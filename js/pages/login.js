/**
 * 로그인 페이지
 */

import { api } from '../api.js';
import { setUser } from '../state.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError } from '../utils.js';

/**
 * 로그인 페이지 렌더링
 */
export function renderLogin() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    ${renderHeader({ showProfile: false })}
    
    <main class="main">
      <div class="form-container">
        <h2 class="form-title">로그인</h2>
        
        <form id="form" class="form">
          <div class="form-group">
            <label for="email" class="form-label">이메일</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              class="form-input" 
              placeholder="이메일을 입력하세요"
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">비밀번호</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              class="form-input" 
              placeholder="비밀번호를 입력하세요"
              required 
            />
            <span class="helper-text" id="error-message">*helper text</span>
          </div>
          
          <button type="submit" class="btn btn-primary">로그인</button>
          
          <button type="button" id="signup-btn" class="btn btn-secondary">
            회원가입
          </button>
        </form>
      </div>
    </main>
  `;

  // 이벤트 리스너 등록
  initHeaderEvents();
  attachLoginEvents();
}

/**
 * 로그인 페이지 이벤트 리스너 등록
 */
function attachLoginEvents() {
  const form = document.getElementById('form');
  const signupBtn = document.getElementById('signup-btn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('error-message');

  // 입력란 포커스 시 기본 helper text 숨기기 (공간은 유지)
  if (emailInput) {
    emailInput.addEventListener('focus', () => {
      if (errorMessage && errorMessage.textContent === '*helper text') {
        errorMessage.style.visibility = 'hidden';
      }
    });
    emailInput.addEventListener('blur', () => {
      if (errorMessage && errorMessage.textContent === '*helper text') {
        errorMessage.style.visibility = 'visible';
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('focus', () => {
      if (errorMessage && errorMessage.textContent === '*helper text') {
        errorMessage.style.visibility = 'hidden';
      }
    });
    passwordInput.addEventListener('blur', () => {
      if (errorMessage && errorMessage.textContent === '*helper text') {
        errorMessage.style.visibility = 'visible';
      }
    });
  }

  // 로그인 폼 제출
  form.addEventListener('submit', handleLogin);

  // 회원가입 버튼 클릭
  signupBtn.addEventListener('click', () => {
    navigateTo('/signup');
  });
}

/**
 * 로그인 처리
 */
async function handleLogin(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const email = formData.get('email');
  const password = formData.get('password');

  // 입력값 검증
  if (!email || !password) {
    showError('이메일과 비밀번호를 입력해주세요.');
    return;
  }

  const submitBtn = form.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;

  try {
    // 로딩 상태
    submitBtn.textContent = '로그인 중...';
    submitBtn.disabled = true;

    // 로그인 API 호출 (백엔드: { code, data }. 세션은 Set-Cookie(session_id)로 설정됨)
    const result = await api.post('/auth/login', { email, password });

    // 사용자 정보만 저장 (authToken은 사용하지 않음. 인증은 쿠키로만)
    const data = result?.data;
    if (data) {
      setUser({
        userId: data.userId,
        email: data.email,
        nickname: data.nickname,
        profileImageUrl: data.profileImage ?? data.profileImageUrl,
      });
    }

    navigateTo('/posts');
  } catch (error) {
    // 에러 표시
    const errorMessage = error.message || '로그인에 실패했습니다.';
    showError(errorMessage);
  } finally {
    // 버튼 상태 복원
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

/**
 * 에러 메시지 표시
 */
function showError(message) {
  showFieldError('error-message', message);
}
