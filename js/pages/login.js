// 로그인 페이지

import { api } from '../api.js';
import { setUser } from '../state.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, getApiErrorMessage, isValidEmail } from '../utils.js';

// 로그인 페이지 렌더링
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
            <span class="helper-text" id="error-message"></span>
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

// 로그인 페이지 이벤트 리스너
function attachLoginEvents() {
  const form = document.getElementById('form');
  const signupBtn = document.getElementById('signup-btn');

  // 로그인 폼 제출
  form.addEventListener('submit', handleLogin);

  // 회원가입 버튼 클릭
  signupBtn.addEventListener('click', () => {
    navigateTo('/signup');
  });
}

// 로그인 처리
async function handleLogin(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const email = formData.get('email');
  const password = formData.get('password');

  // 기존 에러 메시지 초기화
  clearErrors();

  // 입력값 검증
  let hasError = false;
  let errorMessage = '';

  if (!email) {
    errorMessage = '이메일을 입력해주세요.';
    hasError = true;
  } else if (!isValidEmail(email)) {
    errorMessage = getApiErrorMessage('INVALID_EMAIL_FORMAT');
    hasError = true;
  } else if (!password) {
    errorMessage = '비밀번호를 입력해주세요.';
    hasError = true;
  }

  if (hasError) {
    showFieldError('error-message', errorMessage);
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
        profileImageUrl: data.profileImageUrl,
      });
    }

    navigateTo('/posts');
  } catch (error) {
    const msg = getApiErrorMessage(error?.code || error?.message, '로그인에 실패했습니다.');
    showFieldError('error-message', msg);
  } finally {
    // 버튼 상태 복원
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
