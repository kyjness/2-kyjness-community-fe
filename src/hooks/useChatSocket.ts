// DM WebSocket: /v1/ws/chat?token= — 수신 시 useChatStore.appendMessage, 백오프 재연결.
import { useCallback, useEffect, useRef, useState } from 'react';

import { getStoredAccessToken } from '../api/client.js';
import { BASE_URL } from '../config.js';
import { normalizeChatMessage, useChatStore } from '../store/useChatStore.js';

const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

export type ChatSocketStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

/** `BASE_URL`이 `/api/v1`일 때: `ws(s)://현재호스트/api/v1/ws/chat?token=`. 절대 URL(`VITE_API_BASE_URL`)이면 해당 호스트 사용. */
function buildChatWebSocketUrl(token: string | null | undefined): string | null {
  const t = token != null ? String(token).trim() : '';
  if (!t) return null;
  try {
    if (typeof window === 'undefined') return null;
    const baseRaw = String(BASE_URL ?? '/api/v1').replace(/\/+$/, '');
    if (baseRaw.startsWith('http://') || baseRaw.startsWith('https://')) {
      const httpUrl = new URL(baseRaw.endsWith('/') ? baseRaw : `${baseRaw}/`);
      const wsProto = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      const path = `${httpUrl.pathname.replace(/\/+$/, '')}/ws/chat`;
      return `${wsProto}//${httpUrl.host}${path}?token=${encodeURIComponent(t)}`;
    }
    if (!baseRaw.startsWith('/')) return null;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}${baseRaw}/ws/chat?token=${encodeURIComponent(t)}`;
    return wsUrl;
  } catch {
    return null;
  }
}

function parseIncomingPayload(
  raw: string,
): { type: 'message'; roomId: string; row: ReturnType<typeof normalizeChatMessage> } | { type: 'error'; code: string; message?: string } | null {
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    const t = j.type;
    if (t === 'error') {
      return {
        type: 'error',
        code: String(j.code ?? 'error'),
        message: j.message != null ? String(j.message) : undefined,
      };
    }
    if (t === 'chat.message') {
      const row = normalizeChatMessage(j);
      if (!row.roomId) return null;
      return { type: 'message', roomId: row.roomId, row };
    }
  } catch {
    return null;
  }
  return null;
}

export interface UseChatSocketOptions {
  enabled: boolean;
  /** close code 1008·서버 error 중 인증으로 판단될 때 */
  onAuthError?: () => void;
}

export interface UseChatSocketResult {
  status: ChatSocketStatus;
  lastError: string | null;
  sendMessage: (peerUserId: string, content: string) => boolean;
}

/**
 * `enabled===true`일 때만 연결. 언마운트·enabled false 시 소켓/재연결 타이머 정리(HMR 누수 방지).
 */
export function useChatSocket(options: UseChatSocketOptions): UseChatSocketResult {
  const { enabled, onAuthError } = options;
  const appendMessage = useChatStore((s) => s.appendMessage);
  const appendSyncRef = useRef(appendMessage);
  appendSyncRef.current = appendMessage;

  const [status, setStatus] = useState<ChatSocketStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const backoffMsRef = useRef(MIN_BACKOFF_MS);
  const closedByCleanupRef = useRef(false);
  const onAuthErrorRef = useRef(onAuthError);
  onAuthErrorRef.current = onAuthError;

  const sendMessage = useCallback((peerUserId: string, content: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    const trimmed = content.trim();
    if (!trimmed || !peerUserId.trim()) return false;
    const payload = {
      type: 'chat.send',
      peerUserId: peerUserId.trim(),
      content: trimmed,
    };
    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
      if (reconnectTimer != null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const scheduleReconnect = () => {
      clearTimer();
      const jitter = Math.floor(Math.random() * 400);
      const delay = Math.min(MAX_BACKOFF_MS, backoffMsRef.current) + jitter;
      reconnectTimer = window.setTimeout(() => {
        void openSocket();
      }, delay);
      backoffMsRef.current = Math.min(MAX_BACKOFF_MS, Math.floor(backoffMsRef.current * 1.8));
    };

    const openSocket = async () => {
      if (closedByCleanupRef.current || !enabled) return;
      const token = getStoredAccessToken();
      if (!token) {
        setStatus('closed');
        setLastError('no_token');
        return;
      }

      try {
        wsRef.current?.close();
      } catch {
        /* noop */
      }
      wsRef.current = null;

      setStatus('connecting');
      setLastError(null);

      const wsUrl = buildChatWebSocketUrl(token);
      if (!wsUrl) {
        setStatus('error');
        setLastError('bad_ws_url');
        scheduleReconnect();
        return;
      }

      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch (e) {
        setStatus('error');
        setLastError(e instanceof Error ? e.message : 'websocket_construct_failed');
        scheduleReconnect();
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        if (closedByCleanupRef.current) {
          try {
            ws.close();
          } catch {
            /* noop */
          }
          return;
        }
        backoffMsRef.current = MIN_BACKOFF_MS;
        setStatus('open');
      };

      ws.onmessage = (ev) => {
        if (typeof ev.data !== 'string') return;
        const parsed = parseIncomingPayload(ev.data);
        if (!parsed) return;
        if (parsed.type === 'error') {
          setLastError(parsed.message ?? parsed.code);
          return;
        }
        appendSyncRef.current(parsed.roomId, parsed.row);
      };

      ws.onerror = () => {
        setLastError('websocket_error');
        setStatus('error');
      };

      ws.onclose = (ev) => {
        wsRef.current = null;
        if (closedByCleanupRef.current) {
          setStatus('closed');
          return;
        }
        setStatus('closed');
        if (ev.code === 1008) {
          setLastError(ev.reason || 'policy_violation');
          onAuthErrorRef.current?.();
          return;
        }
        if (enabled) {
          scheduleReconnect();
        }
      };
    };

    if (!enabled) {
      closedByCleanupRef.current = true;
      clearTimer();
      try {
        wsRef.current?.close();
      } catch {
        /* noop */
      }
      wsRef.current = null;
      setStatus('idle');
      return () => {
        clearTimer();
      };
    }

    closedByCleanupRef.current = false;

    void openSocket();

    return () => {
      closedByCleanupRef.current = true;
      clearTimer();
      try {
        wsRef.current?.close();
      } catch {
        /* noop */
      }
      wsRef.current = null;
      setStatus('closed');
    };
  }, [enabled]);

  return { status, lastError, sendMessage };
}
