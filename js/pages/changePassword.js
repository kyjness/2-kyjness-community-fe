/**
 * 비밀번호 변경 페이지
 */

import { api } from '../api.js';
import { getUser, clearUser } from '../state.js'; // 현재 사용자 정보 가져오기
import { navigateTo } from '../router.js';

/**
 * 비밀번호 변경 페이지 렌더링
 */
export function renderChangePassword() {
  const root = document.getElementById('app-root');
  const user = getUser();

  root.innerHTML = `
    <header class="header">
      <h1 class="header-title">
        <span id="header-title-link">아무 말 대잔치</span>
      </h1>

      <!-- 오른쪽 상단 프로필 -->
      <div class="header-profile-wrapper" id="header-profile-btn">
        <div class="profile-avatar">
          <img
            src="${user?.profileImage || './imt.png'}"
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

      <div class="header-divider"></div>
    </header>
    
    <main class="main">
      <div class="form-container">
        <h2 class="form-title">비밀번호 수정</h2>
        
        <form id="form" class="form">
          <!-- 새 비밀번호 -->
          <div class="form-group">
            <label for="new-password" class="form-label">비밀번호</label>
            <input 
              type="password" 
              id="new-password" 
              name="new-password" 
              class="form-input" 
              placeholder="비밀번호를 입력하세요"
              required 
            />
            <span class="helper-text" id="new-password-error">*helper text</span>
          </div>
          
          <!-- 새 비밀번호 확인 -->
          <div class="form-group">
            <label for="new-password-confirm" class="form-label">비밀번호 확인</label>
            <input 
              type="password" 
              id="new-password-confirm" 
              name="new-password-confirm" 
              class="form-input" 
              placeholder="비밀번호를 한번 더 입력하세요"
              required 
            />
            <span class="helper-text" id="new-password-confirm-error">*helper text</span>
          </div>
          
          <button type="submit" class="btn btn-primary">수정하기</button>
        </form>
      </div>
    </main>
  `;
  
  // 이벤트 리스너 등록
  attachChangePasswordEvents();
}

/**
 * 비밀번호 변경 페이지 이벤트 리스너 등록
 */
function attachChangePasswordEvents() {
  const form = document.getElementById('form');
  form.addEventListener('submit', handleChangePassword);

  const profileBtn = document.getElementById('header-profile-btn');
  const dropdown = document.getElementById('profile-dropdown');

  // 프로필 버튼 클릭 시 드롭다운 토글
  profileBtn.addEventListener('click', () => {
    dropdown.classList.toggle('visible');
  });

  // 드롭다운 메뉴 동작
  document.getElementById('go-mypage').addEventListener('click', () => {
    navigateTo('/profile/edit');
  });

  document.getElementById('go-password').addEventListener('click', () => {
    navigateTo('/profile/password');
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearUser();
    navigateTo('/login');
  });

  // 바깥 클릭 시 드롭다운 닫기
  document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('visible');
    }
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
 * 비밀번호 변경 처리
 */
async function handleChangePassword(e) {
  e.preventDefault();
  
  clearErrors();
  
  const form = e.target;
  const newPassword = document.getElementById('new-password').value;
  const newPasswordConfirm = document.getElementById('new-password-confirm').value;
  
  let hasError = false;
  
  if (!newPassword) {
    showFieldError('new-password-error', '비밀번호를 입력해주세요.');
    hasError = true;
  } else if (newPassword.length < 8) {
    showFieldError('new-password-error', '비밀번호는 8자 이상이어야 합니다.');
    hasError = true;
  }
  
  if (newPassword !== newPasswordConfirm) {
    showFieldError('new-password-confirm-error', '비밀번호가 일치하지 않습니다.');
    hasError = true;
  }
  
  if (hasError) return;
  
  const submitBtn = form.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.textContent = '변경 중...';
    submitBtn.disabled = true;
    
    // 비밀번호 변경 API 호출
    await api.put('/auth/password', {
      newPassword,
    });
    
    alert('비밀번호가 변경되었습니다!');
    navigateTo('/posts');
    
  } catch (error) {
    const errorMessage = error.message || '비밀번호 변경에 실패했습니다.';
    alert(errorMessage);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

/**
 * 필드별 에러 메시지 표시
 */
function showFieldError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = `* ${message}`;
    errorElement.style.display = 'block';
  }
}

/**
 * 모든 에러 메시지 초기화
 */
function clearErrors() {
  const errorElements = document.querySelectorAll('.helper-text');
  errorElements.forEach((el) => {
    el.textContent = '';
    el.style.display = 'none';
  });
}
