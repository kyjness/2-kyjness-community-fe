/**
 * 공통 API 클라이언트 (fetch 기반)
 * - 모든 요청에 credentials: 'include' 강제 (쿠키/세션 인증)
 * - 응답 포맷: 성공/실패 공통 { code, data } (실패 시 data === null)
 * - 401 시 클라이언트 상태 초기화 후 로그인으로 리다이렉트
 */

import { BASE_URL } from './constants.js';
import { clearUser } from './state.js';
import { navigateTo } from './router.js';

function getDefaultHeaders(isFormData) {
  if (isFormData) return {};
  return { 'Content-Type': 'application/json' };
}

async function handleResponse(response) {
  const body = await response.json().catch(() => ({ code: 'UNKNOWN', data: null }));

  if (!response.ok) {
    if (response.status === 401) {
      clearUser();
      navigateTo('/login');
    }
    const msg = body?.code || (typeof body?.detail === 'string' ? body.detail : null) || (body?.detail?.code) || `HTTP ${response.status}`;
    const err = new Error(msg);
    err.code = body?.code ?? null;
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

  async post(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: getDefaultHeaders(false),
      body: data != null ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },

  async postFormData(endpoint, formData) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: getDefaultHeaders(true),
      body: formData,
    });
    return handleResponse(response);
  },

  async put(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: getDefaultHeaders(false),
      body: data != null ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
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

  async delete(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getDefaultHeaders(false),
    });
    if (response.status === 204) return { code: 'OK', data: null };
    return handleResponse(response);
  }
};
