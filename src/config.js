// 프로젝트 설정: BASE_URL, DEFAULT_PROFILE_IMAGE, HEADER_TITLE, SPLASH_ITEMS.
export const BASE_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : '/api/v1';
export const DEFAULT_PROFILE_IMAGE = '/imt.png';
export const HEADER_TITLE = '퍼피톡';

export const SPLASH_ITEMS = [
  { path: '/anim1.json', duration: 1000 },
  { path: '/anim2.json', duration: 1000 },
  { path: '/anim3.json', duration: 1000 },
];
