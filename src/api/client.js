// 공통 API 클라이언트: Axios, 401 시 refresh 후 재시도, onUnauthorized 콜백.
// Refresh Token은 HttpOnly 쿠키로만 전달되며, localStorage에 저장하지 않습니다.
// `/auth/refresh`, `/auth/logout` 포함 모든 요청에 쿠키를 실으려면 withCredentials가 필요합니다.
import axios from 'axios';
import { BASE_URL } from '../config.js';

const USER_STORAGE_KEY = 'user';
const REFRESH_ENDPOINT = '/auth/refresh';

function getAccessToken() {
  try {
    const raw = typeof window !== 'undefined' && localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.accessToken ?? null;
  } catch (_) {
    return null;
  }
}

function setAccessToken(accessToken) {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    data.accessToken = accessToken;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

/** 로그인/회원가입/비로그인 이미지 업로드 등 401 시 refresh 시도 생략 */
function shouldSkip401Refresh(url) {
  if (!url || typeof url !== 'string') return true;
  return /auth\/login|auth\/signup|media\/images\/signup/.test(url);
}

function isRefreshRequest(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('auth/refresh');
}

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

let isRefreshing = false;
let refreshSubscribers = [];
let refreshAttemptPromise = null;
const MAX_REFRESH_RETRY = 1;

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers.forEach((cb) => cb(null));
  refreshSubscribers = [];
}

function waitForTokenFromRefresh(timeoutMs = 1500) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve(getAccessToken());
    }, timeoutMs);
    subscribeTokenRefresh((newToken) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(newToken ?? getAccessToken());
    });
  });
}

async function requestRefreshToken() {
  const res = await axios.post(`${BASE_URL}${REFRESH_ENDPOINT}`, null, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return res?.data?.data?.accessToken ?? res?.data?.accessToken ?? null;
}

function clearUserAndRedirect() {
  try {
    const path = typeof window !== 'undefined' && window.location.pathname;
    if (path && path !== '/login' && path !== '/signup') {
      sessionStorage.setItem('login_return_path', path);
    }
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (_) {}
  if (typeof onUnauthorized === 'function') {
    onUnauthorized();
  }
}

/** 백엔드 멱등성: 게시글 생성·이미지 업로드 POST에만 사용 */
function normalizeRequestPath(url) {
  if (!url || typeof url !== 'string') return '';
  const pathOnly = url.split('?')[0];
  const withSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return withSlash.replace(/\/+$/, '') || '/';
}

function postNeedsIdempotencyKey(url) {
  const p = normalizeRequestPath(url);
  return p === '/posts' || p === '/media/images' || p === '/media/images/signup';
}

function readIdempotencyHeader(headers) {
  if (!headers) return undefined;
  if (typeof headers.get === 'function') {
    return headers.get('X-Idempotency-Key') || headers.get('x-idempotency-key');
  }
  return headers['X-Idempotency-Key'] ?? headers['x-idempotency-key'];
}

function newIdempotencyKey() {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
  } catch (_) {}
  return `idemp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

const instance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** 기본 Axios 인스턴스 (Bearer + credentials + 401 시 쿠키 기반 silent refresh) */
export const apiClient = instance;

instance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  const method = (config.method || 'get').toLowerCase();
  if (
    method === 'post' &&
    postNeedsIdempotencyKey(config.url || '') &&
    !readIdempotencyHeader(config.headers)
  ) {
    if (!config.__idempotencyKey) {
      config.__idempotencyKey = newIdempotencyKey();
    }
    const key = config.__idempotencyKey;
    if (typeof config.headers?.set === 'function') {
      config.headers.set('X-Idempotency-Key', key);
    } else {
      config.headers = config.headers || {};
      config.headers['X-Idempotency-Key'] = key;
    }
  }
  return config;
});

instance.interceptors.response.use(
  (response) => {
    if (response.status === 204) {
      response.data = { code: 'OK', data: null };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url ?? originalRequest?.baseURL ?? '';
    const status = error.response?.status;
    const body = error.response?.data;
    const refreshTry = Number(originalRequest?._refreshRetry || 0);

    if (status !== 401) {
      const err = new Error(
        body?.code ?? (typeof body?.detail === 'string' ? body.detail : null) ?? body?.detail?.code ?? `HTTP ${status}`
      );
      err.code = body?.code ?? body?.detail?.code ?? null;
      err.status = status;
      return Promise.reject(err);
    }

    if (isRefreshRequest(url)) {
      clearUserAndRedirect();
      const err = new Error(body?.code ?? 'UNAUTHORIZED');
      err.code = body?.code ?? null;
      err.status = 401;
      return Promise.reject(err);
    }

    if (shouldSkip401Refresh(url)) {
      const err = new Error(body?.code ?? (body?.detail?.code ?? 'UNAUTHORIZED'));
      err.code = body?.code ?? body?.detail?.code ?? null;
      err.status = 401;
      return Promise.reject(err);
    }

    if (!originalRequest._retry) {
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;
        originalRequest._refreshRetry = refreshTry;
        try {
          refreshAttemptPromise = requestRefreshToken();
          let newToken = await refreshAttemptPromise;
          if (!newToken && getAccessToken()) {
            newToken = getAccessToken();
          }
          if (newToken) {
            setAccessToken(newToken);
            onRefreshed(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          }
        } catch (refreshErr) {
          const refreshStatus = refreshErr?.response?.status;
          const canRetry409 = refreshStatus === 409 && refreshTry < MAX_REFRESH_RETRY;
          if (canRetry409) {
            // 다른 요청(선행 refresh) 완료를 잠시 대기한 뒤 원요청을 1회 재시도.
            const waitedToken = await waitForTokenFromRefresh();
            const tokenAfterWait = waitedToken || getAccessToken();
            if (tokenAfterWait) {
              setAccessToken(tokenAfterWait);
              onRefreshed(tokenAfterWait);
              originalRequest._refreshRetry = refreshTry + 1;
              originalRequest.headers.Authorization = `Bearer ${tokenAfterWait}`;
              return instance(originalRequest);
            }
          }
          onRefreshFailed();
          clearUserAndRedirect();
          const err = new Error(
            refreshErr?.response?.data?.code ?? (body?.code ?? 'UNAUTHORIZED')
          );
          err.code =
            refreshErr?.response?.data?.code ??
            body?.code ??
            (refreshStatus === 409 ? 'CONFLICT' : null);
          err.status = refreshStatus ?? 401;
          return Promise.reject(err);
        } finally {
          refreshAttemptPromise = null;
          isRefreshing = false;
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            instance(originalRequest).then(resolve).catch(reject);
          } else {
            const err = new Error(body?.code ?? 'UNAUTHORIZED');
            err.code = body?.code ?? null;
            err.status = 401;
            reject(err);
          }
        });
      });
    }

    const err = new Error(body?.code ?? 'UNAUTHORIZED');
    err.code = body?.code ?? body?.detail?.code ?? null;
    err.status = 401;
    return Promise.reject(err);
  }
);

function toData(response) {
  const res = response?.data ?? response;
  if (response?.status === 204 && res == null) return { code: 'OK', data: null };
  return res;
}

export const api = {
  async get(endpoint) {
    const response = await instance.get(endpoint);
    return toData(response);
  },

  async post(endpoint, data, options = {}) {
    const config = options.headers ? { headers: options.headers } : {};
    const response = await instance.post(endpoint, data, config);
    return toData(response);
  },

  async postFormData(endpoint, formData) {
    const response = await instance.post(endpoint, formData, {
      headers: { 'Content-Type': undefined },
    });
    return toData(response);
  },

  async patch(endpoint, data) {
    const response = await instance.patch(endpoint, data);
    return toData(response);
  },

  async delete(endpoint) {
    const response = await instance.delete(endpoint);
    if (response?.status === 204) return { code: 'OK', data: null };
    return toData(response);
  },
};
