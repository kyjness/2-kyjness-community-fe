// 공통 API 클라이언트 (fetch, credentials 포함, 401 시 로그인으로 리다이렉트)

import { BASE_URL } from './config.js';
import { clearUser } from './state.js';
import { navigateTo } from './router.js';

function getDefaultHeaders(isFormData, extra = {}) {
  if (isFormData) return { ...extra };
  return { 'Content-Type': 'application/json', ...extra };
}

/** 로그인/회원가입/비로그인 이미지 업로드 등 401 시 리다이렉트 생략 */
function shouldSkip401Redirect(endpoint) {
  return /^\/(auth\/login|auth\/signup|media\/images)/.test(String(endpoint || ''));
}

async function handleResponse(response, options = {}) {
  const { skip401Redirect = false } = options;
  const isNoContent = response.status === 204;
  const is2xx = response.ok;
  let body;
  if (isNoContent) {
    body = { code: 'OK', data: null };
  } else {
    const text = await response.text();
    if (!text || text.trim() === '') {
      body = is2xx ? { code: 'OK', data: null } : { code: 'UNKNOWN', data: null };
    } else {
      try {
        body = JSON.parse(text);
      } catch (_) {
        body = is2xx ? { code: 'OK', data: null } : { code: 'UNKNOWN', data: null };
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !skip401Redirect) {
      try {
        const currentPath = window.location.hash.slice(1) || '/posts';
        if (currentPath && currentPath !== '/login' && currentPath !== '/signup') {
          sessionStorage.setItem('login_return_path', currentPath);
        }
      } catch (_) {}
      alert('로그인이 필요합니다.');
      clearUser();
      navigateTo('/login');
    }
    const msg = body?.code || (typeof body?.detail === 'string' ? body.detail : null) || body?.detail?.code || `HTTP ${response.status}`;
    const err = new Error(msg);
    err.code = body?.code ?? body?.detail?.code ?? null;
    err.status = response.status;
    throw err;
  }

  return body;
}

export const api = {
  async get(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: getDefaultHeaders(false),
    });
    return handleResponse(response);
  },

  async post(endpoint, data, options = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: getDefaultHeaders(false, options.headers),
      body: data != null ? JSON.stringify(data) : undefined,
    });
    const skip401Redirect = shouldSkip401Redirect(endpoint);
    return handleResponse(response, { skip401Redirect });
  },

  async postFormData(endpoint, formData) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: getDefaultHeaders(true),
      body: formData,
    });
    const skip401Redirect = shouldSkip401Redirect(endpoint);
    return handleResponse(response, { skip401Redirect });
  },

  async patch(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getDefaultHeaders(false),
      body: data != null ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },

  async delete(endpoint, options = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getDefaultHeaders(false, options.headers),
    });
    if (response.status === 204) return { code: 'OK', data: null };
    return handleResponse(response);
  }
};
