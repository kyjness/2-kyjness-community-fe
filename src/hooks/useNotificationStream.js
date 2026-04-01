// 알림 SSE: EventSourcePolyfill(withCredentials + Bearer)·백오프 재연결·ApiResponse 형식 파싱.
import { useEffect, useRef } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { BASE_URL } from '../config.js';
import { api, getStoredAccessToken } from '../api/client.js';
import { useNotificationStore } from '../store/useNotificationStore.js';

const STREAM_PATH = '/notifications/stream';
const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

function buildNotificationStreamUrl() {
  const base = String(BASE_URL).replace(/\/+$/, '');
  const combined = `${base}${STREAM_PATH}`;
  if (/^https?:\/\//i.test(combined)) return combined;
  if (typeof window === 'undefined') return combined;
  const path = combined.startsWith('/') ? combined : `/${combined}`;
  return new URL(path, window.location.origin).href;
}

/**
 * @param {{ enabled: boolean }} opts
 */
export function useNotificationStream({ enabled }) {
  const ingestFromStream = useNotificationStore((s) => s.ingestFromStream);
  const setStreamConnected = useNotificationStore((s) => s.setStreamConnected);
  const enabledRef = useRef(enabled);
  const ingestRef = useRef(ingestFromStream);

  useEffect(() => {
    enabledRef.current = enabled;
    ingestRef.current = ingestFromStream;

    let es = /** @type {EventSourcePolyfill | null} */ (null);
    let reconnectTimer = 0;
    let backoffMs = MIN_BACKOFF_MS;
    let failCount = 0;
    let closed = false;

    const clearTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = 0;
      }
    };

    const scheduleReconnect = () => {
      clearTimer();
      const jitter = Math.floor(Math.random() * 400);
      reconnectTimer = window.setTimeout(() => {
        void attemptConnect();
      }, backoffMs + jitter);
      backoffMs = Math.min(MAX_BACKOFF_MS, Math.floor(backoffMs * 1.8));
    };

    const parseAndDispatch = (rawData) => {
      if (rawData == null || typeof rawData !== 'string') return;
      const trimmed = rawData.trim();
      if (!trimmed) return;
      try {
        const payload = JSON.parse(trimmed);
        if (payload && typeof payload === 'object') {
          if ('data' in payload && (payload.code != null || payload.message != null)) {
            const inner = /** @type {Record<string, unknown>} */ (payload).data;
            if (inner != null && typeof inner === 'object') {
              ingestRef.current(inner);
              return;
            }
          }
          ingestRef.current(payload);
        }
      } catch {
        // ping 또는 비JSON 라인 무시
      }
    };

    const attemptConnect = async () => {
      if (closed || !enabledRef.current) return;
      const token = getStoredAccessToken();
      if (!token) {
        setStreamConnected(false);
        return;
      }

      if (failCount >= 2) {
        try {
          await api.get('/notifications?page=1&size=1');
        } catch (err) {
          const status = /** @type {{ status?: number }} */ (err)?.status;
          if (status === 401) {
            setStreamConnected(false);
            return;
          }
        }
      }

      const url = buildNotificationStreamUrl();

      try {
        es?.close();
        es = new EventSourcePolyfill(url, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        es.addEventListener('open', () => {
          failCount = 0;
          backoffMs = MIN_BACKOFF_MS;
          setStreamConnected(true);
        });

        es.addEventListener('message', (ev) => {
          const d = /** @type {MessageEvent & { data?: string }} */ (ev)?.data;
          parseAndDispatch(d);
        });

        es.addEventListener('error', () => {
          setStreamConnected(false);
          failCount += 1;
          try {
            es?.close();
          } catch {
            //
          }
          es = null;
          if (!closed && enabledRef.current && getStoredAccessToken()) {
            scheduleReconnect();
          }
        });
      } catch {
        setStreamConnected(false);
        if (!closed && enabledRef.current && getStoredAccessToken()) {
          scheduleReconnect();
        }
      }
    };

    if (enabled) {
      void attemptConnect();
    } else {
      setStreamConnected(false);
    }

    return () => {
      closed = true;
      clearTimer();
      try {
        es?.close();
      } catch {
        //
      }
      es = null;
      setStreamConnected(false);
    };
  }, [enabled, ingestFromStream, setStreamConnected]);
}
