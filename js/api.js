// 공통 API 클라이언트 (fetch, credentials 포함, 401 시 로그인으로 리다이렉트)

import { BASE_URL } from './config.js';
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
