/**
 * 해시 기반 SPA 라우터
 * URL 해시(#/login, #/posts 등)에 따라 적절한 페이지를 렌더링합니다
 */

import { isLoggedIn } from './state.js';
import { DEV_MODE } from './constants.js';
import { renderLogin } from './pages/login.js';
import { renderSignup } from './pages/signup.js';
import { renderPostList } from './pages/postList.js';
import { renderEditProfile } from './pages/editProfile.js';
import { renderChangePassword } from './pages/changePassword.js';
import { renderPostDetail } from './pages/postDetail.js';
import { renderEditPost } from './pages/editPost.js';
import { renderNewPost } from './pages/newPost.js';

// 라우트 정의 (경로 -> 렌더링 함수 매핑)
const routes = {
  '/': renderPostList, // 메인(게시글 목록)
  '/login': renderLogin, // 로그인
  '/signup': renderSignup, // 회원가입
  '/posts': renderPostList, // 게시글 목록
  '/profile/edit': renderEditProfile, // 회원정보수정
  '/profile/password': renderChangePassword, // 비밀번호 변경
  '/posts/:id': renderPostDetail, // 게시글 상세
  '/posts/:id/edit': renderEditPost, // 게시글 수정
  '/posts/new': renderNewPost, // 게시글 작성
};

// 인증이 필요한 경로 목록
const authRequiredRoutes = [
  '/',
  '/posts',
  '/profile/edit',
  '/profile/password',
  '/posts/:id',
  '/posts/:id/edit',
  '/posts/new',
];

/**
 * 현재 URL 해시를 파싱하여 경로와 파라미터를 반환합니다
 * 예: #/posts/123 -> { path: '/posts/:id', params: { id: '123' } }
 */
function parseHash() {
  const hash = window.location.hash.slice(1) || '/'; // '#' 제거

  // 1. 정확한 경로 매칭 먼저 확인 (동적 경로보다 우선)
  if (routes[hash]) {
    return { path: hash, params: {} };
  }

  // 2. 동적 경로 매칭 (예: /posts/:id)
  for (const route in routes) {
    // 동적 경로만 체크 (정확한 경로는 이미 위에서 체크함)
    if (!route.includes(':')) continue;

    const routePattern = route.replace(/:\w+/g, '([^/]+)'); // :id -> 정규식
    const regex = new RegExp(`^${routePattern}$`);
    const match = hash.match(regex);

    if (match) {
      // 파라미터 추출
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

/**
 * 라우팅 처리 - 현재 URL에 맞는 페이지를 렌더링합니다
 */
export function route() {
  const { path, params } = parseHash();
  const renderPage = routes[path];

  // 개발 모드가 아닐 때만 인증 체크
  if (!DEV_MODE) {
    // 인증이 필요한 경로인데 로그인하지 않은 경우
    if (authRequiredRoutes.includes(path) && !isLoggedIn()) {
      navigateTo('/login');
      return;
    }

    // 로그인 상태에서 로그인/회원가입 페이지 접근 시 메인으로 리다이렉트
    if ((path === '/login' || path === '/signup') && isLoggedIn()) {
      navigateTo('/posts');
      return;
    }
  }

  // 해당 경로의 페이지 렌더링
  if (renderPage) {
    renderPage(params);
  } else {
    // 404 처리
    render404();
  }
}

/**
 * 특정 경로로 이동합니다 (해시 변경)
 * @param {string} path - 이동할 경로 (예: '/login', '/posts/123')
 */
export function navigateTo(path) {
  window.location.hash = path;
}

/**
 * 404 페이지 렌더링
 */
function render404() {
  const root = document.getElementById('app-root');
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
        onclick="window.location.hash='/'" 
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
}

/**
 * 라우터 초기화 - 해시 변경 이벤트 리스너 등록
 */
export function initRouter() {
  // 해시 변경 시 라우팅
  window.addEventListener('hashchange', route);

  // 초기 라우팅
  route();
}
