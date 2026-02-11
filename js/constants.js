/**
 * 프로젝트 전역 상수
 */

// API 기본 URL
export const BASE_URL = 'http://localhost:8000';

/** 이미지/애니 리소스는 모두 img/ 폴더 기준 */
export const IMG_PATH = './img';

// 기본 프로필 이미지 경로
export const DEFAULT_PROFILE_IMAGE = './img/imt.png';

// 헤더 제목
export const HEADER_TITLE = '아무 말 대잔치';

/**
 * 스플래시 순차 재생 목록 (로티만 사용, 한 곳만 수정하면 자동 반영)
 * - path: img 폴더 기준 경로 (예: './img/anim1.json')
 * - duration: 표시 시간(ms)
 * 항목 추가 시 이 배열에만 넣으면 됨.
 */
export const SPLASH_ITEMS = [
  { path: './img/anim1.json', duration: 1000 },
  { path: './img/anim2.json', duration: 1000 },
  { path: './img/anim3.json', duration: 1000 },
];

/**
 * 개발 모드: true면 목록/상세/수정에서 API 실패 시 예시(더미) 데이터를 보여줌.
 * 배포 시 false 로 변경하면 예시는 완전히 끄고, 모든 데이터는 API·백엔드만 사용함.
 */
export const DEV_MODE = false;
