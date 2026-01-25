/**
 * 헤더 컴포넌트
 * 로그인된 사용자에게 헤더와 드롭다운 메뉴를 제공합니다
 */

import { getUser, clearUser } from '../state.js';
import { navigateTo } from '../router.js';

/**
 * 헤더 렌더링
 * @returns {string} 헤더 HTML
 */
export function renderHeader() {
  const user = getUser();
  
  return `
    <header class="posts-header header">
      <h1 class="header-title">
        <span id="header-title-link">아무 말 대잔치</span>
      </h1>
      <div class="header-divider"></div>
      
      <!-- 사용자 메뉴 -->
      <div class="dropdown" id="user-menu">
        <button class="posts-user-btn dropdown-toggle" id="user-menu-btn">
          ${user?.profileImageUrl 
            ? `<img src="${user.profileImageUrl}" alt="${user.nickname}" class="posts-user-avatar" />`
            : `<div class="posts-user-avatar" style="background-color: #c4c4c4;"></div>`
          }
        </button>
        
        <div class="dropdown-menu" id="user-dropdown">
          <button class="dropdown-item" data-action="my-page">내 프로필</button>
          <button class="dropdown-item" data-action="logout">로그아웃</button>
        </div>
      </div>
    </header>
  `;
}

/**
 * 헤더 이벤트 리스너 초기화
 * 헤더를 렌더링한 후 반드시 호출해야 합니다
 */
export function initHeaderEvents() {
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  
  if (!userMenuBtn || !userDropdown) return;
  
  // 사용자 메뉴 버튼 클릭 시 드롭다운 토글
  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });
  
  // 드롭다운 메뉴 아이템 클릭
  userDropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = item.dataset.action;
      
      if (action === 'my-page') {
        navigateTo('/my');
      } else if (action === 'logout') {
        handleLogout();
      }
      
      // 드롭다운 닫기
      userDropdown.classList.remove('show');
    });
  });
  
  // 외부 클릭 시 드롭다운 닫기
  document.addEventListener('click', () => {
    userDropdown.classList.remove('show');
  });
  
  // 헤더 제목 클릭 → 게시글 목록으로 이동
  const headerTitle = document.getElementById('header-title-link');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      navigateTo('/posts');
    });
  }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
  if (!confirm('로그아웃 하시겠습니까?')) {
    return;
  }
  
  // 로그아웃 API 호출 (선택사항)
  // await api.post('/auth/logout');
  
  // 로컬 상태 초기화
  clearUser();
  
  // 로그인 페이지로 이동
  navigateTo('/login');
}
