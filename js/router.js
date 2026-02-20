// 해시 기반 SPA 라우터 (Lazy Loading)

import { isLoggedIn } from './state.js';

// 라우트 정의: 경로 -> 로더 함수 (dynamic import로 Lazy Loading)
const routeLoaders = {
  '/': () => import('./pages/postList.js'),
  '/login': () => import('./pages/login.js'),
  '/signup': () => import('./pages/signup.js'),
  '/posts': () => import('./pages/postList.js'),
  '/profile/edit': () => import('./pages/editProfile.js'),
  '/profile/password': () => import('./pages/changePassword.js'),
  '/posts/:id': () => import('./pages/postDetail.js'),
  '/posts/:id/edit': () => import('./pages/editPost.js'),
  '/posts/new': () => import('./pages/newPost.js'),
};

// 경로 -> 렌더 함수 이름 매핑 (각 페이지 모듈의 export 이름)
const renderKeys = {
  '/': 'renderPostList',
  '/login': 'renderLogin',
  '/signup': 'renderSignup',
  '/posts': 'renderPostList',
  '/profile/edit': 'renderEditProfile',
  '/profile/password': 'renderChangePassword',
  '/posts/:id': 'renderPostDetail',
  '/posts/:id/edit': 'renderEditPost',
  '/posts/new': 'renderNewPost',
};

// 인증이 필요한 경로 (백엔드와 동일: 목록·상세는 비로그인 허용)
const authRequiredRoutes = [
  '/profile/edit',
  '/profile/password',
  '/posts/:id/edit',
  '/posts/new',
];

// 첫 route() 호출 여부 (조회수: 상세 새로고침/직접URL 진입 감지)
let isFirstRoute = true;

// URL 해시 파싱 (#/posts/123 -> path, params)
function parseHash() {
  const hash = window.location.hash.slice(1) || '/';

  if (routeLoaders[hash]) {
    return { path: hash, params: {} };
  }

  for (const route in routeLoaders) {
    if (!route.includes(':')) continue;
    const routePattern = route.replace(/:\w+/g, '([^/]+)');
    const regex = new RegExp(`^${routePattern}$`);
    const match = hash.match(regex);
    if (match) {
      const params = {};
      const paramNames = (route.match(/:\w+/g) || []).map((p) => p.slice(1));
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { path: route, params };
    }
  }
  return { path: hash, params: {} };
}

// 라우팅 처리 (Lazy Loading)
export async function route() {
  const { path, params } = parseHash();
  const firstRoutePath = isFirstRoute ? path : null;
  if (isFirstRoute) isFirstRoute = false;
  const load = routeLoaders[path];

  if (authRequiredRoutes.includes(path) && !isLoggedIn()) {
    alert('로그인이 필요합니다.');
    navigateTo('/login');
    return;
  }
  if ((path === '/login' || path === '/signup') && isLoggedIn()) {
    navigateTo('/posts');
    return;
  }

  if (load) {
    try {
      const mod = await load();
      const renderFn = mod[renderKeys[path]];
      if (typeof renderFn === 'function') {
        await renderFn({ ...params, _firstRoutePath: firstRoutePath });
      } else {
        render404();
      }
    } catch (_) {
      render404();
    }
  } else {
    render404();
  }
}

// 특정 경로로 이동 (해시 변경)
export function navigateTo(path) {
  window.location.hash = path;
}

function render404() {
  const root = document.getElementById('app-root');
  if (!root) return;
  root.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 20px;
    ">
      <h1 style="font-size: 48px; margin: 0; color: #000;">404</h1>
      <p style="font-size: 16px; margin: 12px 0; color: #666;">페이지를 찾을 수 없습니다</p>
      <button
        type="button"
        id="btn-404-home"
        style="
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #aca0eb;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        "
      >
        홈으로 돌아가기
      </button>
    </div>
  `;
  const btn = document.getElementById('btn-404-home');
  if (btn) btn.addEventListener('click', () => navigateTo('/'));
}

// 라우터 초기화 (hashchange 리스너)
export function initRouter() {
  window.addEventListener('hashchange', () => {
    route();
  });
  route();
}
