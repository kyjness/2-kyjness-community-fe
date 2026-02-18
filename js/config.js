// 프로젝트 설정 (배포 시 BASE_URL 수정)

// [배포 시 수정] API 기본 URL = 백엔드 .env 의 BE_API_URL + '/v1'
// 백엔드에서 BE_API_URL 바꾸면 여기도 같은 호스트로 맞춰 수정 (예: BE_API_URL=http://127.0.0.1:8000 → 아래도 127.0.0.1:8000)
export const BASE_URL = 'http://127.0.0.1:8000/v1';

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
