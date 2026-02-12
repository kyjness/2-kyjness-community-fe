// 프로젝트 설정 (배포 시 BASE_URL 수정)

// [배포 시 수정] API 기본 URL
export const BASE_URL = 'http://localhost:8000';

// 이미지/애니 리소스는 모두 img/ 폴더 기준
export const IMG_PATH = './img';

// 기본 프로필 이미지 경로
export const DEFAULT_PROFILE_IMAGE = './img/imt.png';

// 헤더 제목
export const HEADER_TITLE = '퍼피톡';

// 스플래시 순차 재생 목록 (로티만 사용)
export const SPLASH_ITEMS = [
  { path: './img/anim1.json', duration: 1000 },
  { path: './img/anim2.json', duration: 1000 },
  { path: './img/anim3.json', duration: 1000 },
];
