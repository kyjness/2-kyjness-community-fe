// 공통 API 클라이언트: Axios, 401 시 refresh 후 재시도, onUnauthorized 콜백.
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

const instance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
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
        try {
          const res = await axios.post(`${BASE_URL}${REFRESH_ENDPOINT}`, null, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          });
          const newToken = res?.data?.data?.accessToken ?? res?.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            onRefreshed(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          }
        } catch (refreshErr) {
          onRefreshFailed();
          clearUserAndRedirect();
          const err = new Error(
            refreshErr?.response?.data?.code ?? (body?.code ?? 'UNAUTHORIZED')
          );
          err.code = refreshErr?.response?.data?.code ?? body?.code ?? null;
          err.status = 401;
          return Promise.reject(err);
        } finally {
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
