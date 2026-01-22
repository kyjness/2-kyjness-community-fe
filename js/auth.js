import { api } from './api.js';

export function initAuth() {
  // 로그인 폼 이벤트
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // 회원가입 버튼 이벤트
  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', () => {
      // 회원가입 페이지로 이동 (나중에 구현)
      console.log('회원가입 페이지로 이동');
      // window.location.href = '/signup.html';
    });
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  const email = formData.get('email');
  const password = formData.get('password');

  // 입력 검증
  if (!email || !password) {
    showError('이메일과 비밀번호를 입력해주세요.');
    return;
  }

  const data = {
    email: email,
    password: password
  };

  try {
    // 로딩 상태 표시
    const submitBtn = form.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '로그인 중...';
    submitBtn.disabled = true;

    const result = await api.post('/auth/login', data);
    
    // 성공 시
    alert('로그인 성공!');
    window.location.href = '/';
    
  } catch (error) {
    // 에러 처리
    const errorMessage = error.message || '로그인에 실패했습니다.';
    showError(errorMessage);
    
    // Helper Text 업데이트
    const helperText = document.querySelector('.helper-text');
    if (helperText) {
      helperText.textContent = `*${errorMessage}`;
      helperText.style.display = 'block';
    }
  } finally {
    // 버튼 상태 복원
    const submitBtn = form.querySelector('.btn-primary');
    submitBtn.textContent = '로그인';
    submitBtn.disabled = false;
  }
}

function showError(message) {
  alert(message);
}
