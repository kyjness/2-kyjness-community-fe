// 헤더 컴포넌트 (모든 페이지 공통)

import { getUser, clearUser } from '../state.js';
import { navigateTo } from '../router.js';
import { api } from '../api.js';
import { safeImageUrl } from '../utils.js';
import { DEFAULT_PROFILE_IMAGE, HEADER_TITLE } from '../config.js';

// 헤더 렌더링 (options: showBackButton, backButtonHref, showProfile)
export function renderHeader(options = {}) {
  const {
    showBackButton = false,
    backButtonHref = '/posts',
    showProfile = true,
  } = options;
  const user = getUser();
  const profileImage = safeImageUrl(user?.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE;

  return `
    <header class="header">
      ${showBackButton ? `
      <button type="button" class="btn-back" id="header-back-btn" aria-label="뒤로 가기">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
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

// 헤더 이벤트 리스너 초기화 (렌더링 후 반드시 호출, options.backButtonHref, options.backButtonOnClick)
export function initHeaderEvents(options = {}) {
  const { backButtonHref = '/posts', backButtonOnClick } = options;

  // 뒤로가기 버튼
  const backBtn = document.getElementById('header-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof backButtonOnClick === 'function') {
        backButtonOnClick();
      } else {
        navigateTo(backButtonHref);
      }
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

// 헤더 프로필 이미지 업데이트 (회원정보 수정 후 반영)
export function updateHeaderProfileImage() {
  const profileImg = document.querySelector('.profile-avatar-img');
  if (profileImg) {
    const user = getUser();
    const profileImage = safeImageUrl(user?.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE;
    profileImg.src = profileImage;
  }
}

// 프로필 드롭다운 이벤트 초기화
function initProfileDropdown() {
  const profileBtn = document.getElementById('header-profile-btn');
  const dropdown = document.getElementById('profile-dropdown');

  if (!profileBtn || !dropdown) return;

  // 프로필 버튼 클릭 → 드롭다운 토글 (바깥 클릭 시 한 번만 리스너 등록 후 제거, 메모리 누수 방지)
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpening = !dropdown.classList.contains('visible');
    dropdown.classList.toggle('visible');
    if (isOpening) {
      const closeOnOutside = (ev) => {
        if (!profileBtn.contains(ev.target) && !dropdown.contains(ev.target)) {
          dropdown.classList.remove('visible');
          document.removeEventListener('click', closeOnOutside);
        }
      };
      setTimeout(() => document.addEventListener('click', closeOnOutside), 0);
    }
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

  // 로그아웃 (서버 세션 무효화 + 쿠키 삭제 후 클라이언트 상태 초기화)
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      dropdown.classList.remove('visible');
      try {
        await api.post('/auth/logout');
      } catch (_) {
        // 이미 만료되었거나 실패해도 클라이언트는 정리
      }
      clearUser();
      navigateTo('/login');
    });
  }
}
