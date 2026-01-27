/**
 * 헤더 컴포넌트
 * 모든 페이지에서 공통으로 사용하는 헤더
 */

import { getUser, clearUser } from '../state.js';
import { navigateTo } from '../router.js';
import { DEFAULT_PROFILE_IMAGE, HEADER_TITLE } from '../constants.js';

/**
 * 헤더 렌더링
 * @param {Object} options - 헤더 옵션
 * @param {boolean} options.showBackButton - 뒤로가기 버튼 표시 여부
 * @param {string} options.backButtonHref - 뒤로가기 버튼 클릭 시 이동할 경로 (기본: '/posts')
 * @param {boolean} options.showProfile - 프로필 드롭다운 표시 여부 (기본: true)
 * @returns {string} 헤더 HTML
 */
export function renderHeader(options = {}) {
  const {
    showBackButton = false,
    backButtonHref = '/posts',
    showProfile = true,
  } = options;
  const user = getUser();
  const profileImage =
    user?.profileImage || user?.profileImageUrl || DEFAULT_PROFILE_IMAGE;

  return `
    <header class="header">
      ${showBackButton ? `
      <a href="javascript:void(0);" class="btn-back" id="header-back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </a>
      ` : ''}
      
      <h1 class="header-title">
        <span id="header-title-link">${HEADER_TITLE}</span>
      </h1>

      ${showProfile ? `
      <!-- 오른쪽 상단 프로필 -->
      <div class="header-profile-wrapper" id="header-profile-btn">
        <div class="profile-avatar">
          <img
            src="${profileImage}"
            class="profile-avatar-img"
          />
        </div>
      </div>

      <!-- 드롭다운 -->
      <div class="profile-dropdown" id="profile-dropdown">
        <button id="go-mypage">회원정보수정</button>
        <button id="go-password">비밀번호수정</button>
        <button id="logout-btn">로그아웃</button>
      </div>
      ` : ''}

      <div class="header-divider"></div>
    </header>
  `;
}

/**
 * 헤더 이벤트 리스너 초기화
 * 헤더를 렌더링한 후 반드시 호출해야 합니다
 * @param {Object} options - 이벤트 옵션
 * @param {string} options.backButtonHref - 뒤로가기 버튼 클릭 시 이동할 경로 (기본: '/posts')
 */
export function initHeaderEvents(options = {}) {
  const { backButtonHref = '/posts' } = options;

  // 뒤로가기 버튼
  const backBtn = document.getElementById('header-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(backButtonHref);
    });
  }

  // 헤더 제목 클릭 → 게시글 목록으로 이동
  const headerTitle = document.getElementById('header-title-link');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      navigateTo('/posts');
    });
  }

  // 프로필 드롭다운 이벤트 등록 (드롭다운이 있으면)
  const profileBtn = document.getElementById('header-profile-btn');
  if (profileBtn) {
    initProfileDropdown();
  }
}

/**
 * 헤더의 프로필 이미지를 업데이트합니다
 * 회원정보 수정 후 호출하여 헤더의 프로필 이미지를 즉시 반영합니다
 */
export function updateHeaderProfileImage() {
  const profileImg = document.querySelector('.profile-avatar-img');
  if (profileImg) {
    const user = getUser();
    const profileImage =
      user?.profileImage || user?.profileImageUrl || DEFAULT_PROFILE_IMAGE;
    profileImg.src = profileImage;
  }
}

/**
 * 프로필 드롭다운 이벤트 초기화
 */
function initProfileDropdown() {
  const profileBtn = document.getElementById('header-profile-btn');
  const dropdown = document.getElementById('profile-dropdown');

  if (!profileBtn || !dropdown) return;

  // 프로필 버튼 클릭 → 드롭다운 토글
  profileBtn.addEventListener('click', () => {
    dropdown.classList.toggle('visible');
  });

  // 회원정보 수정
  const goMypageBtn = document.getElementById('go-mypage');
  if (goMypageBtn) {
    goMypageBtn.addEventListener('click', () => {
      navigateTo('/profile/edit');
      dropdown.classList.remove('visible');
    });
  }

  // 비밀번호 수정
  const goPasswordBtn = document.getElementById('go-password');
  if (goPasswordBtn) {
    goPasswordBtn.addEventListener('click', () => {
      navigateTo('/profile/password');
      dropdown.classList.remove('visible');
    });
  }

  // 로그아웃
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearUser();
      navigateTo('/login');
      dropdown.classList.remove('visible');
    });
  }

  // 바깥 클릭 시 드롭다운 닫기
  document.addEventListener('click', (e) => {
    if (
      !profileBtn.contains(e.target) &&
      !dropdown.contains(e.target)
    ) {
      dropdown.classList.remove('visible');
    }
  });
}
