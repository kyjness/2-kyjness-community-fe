/**
 * 회원가입 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';

/**
 * 회원가입 페이지 렌더링
 */
export function renderSignup() {
  const root = document.getElementById('app-root');
  
  root.innerHTML = `
    <header class="header">
      <a href="#/login" class="btn-back">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </a>
      <h1 class="header-title">
        <span id="header-title-link">아무 말 대잔치</span>
      </h1>
      <div class="header-divider"></div>
    </header>
    
    <main class="main">
      <div class="form-container">
        <h2 class="form-title">회원가입</h2>
        
        <form id="form" class="form">
          <!-- 프로필 사진 업로드 -->
          <div class="profile-group form-group">
           <label class="form-label">프로필 사진</label>
           <span class="helper-text" id="profile-error">*helper text</span>

           <div class="avatar-wrapper">
            <div class="btn avatar" id="signup-avatar-preview">
             <div class="plus"></div>
             <img
               id="avatar-img"
               style="display: none; width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
             />
            </div>

            <input
             type="file"
             id="profile-image"
             accept="image/*"
             style="display: none;"
            />
           </div>
          </div>
          
          <!-- 이메일 -->
          <div class="form-group">
            <label for="email" class="form-label">이메일*</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              class="form-input" 
              placeholder="이메일을 입력하세요"
              required 
            />
            <span class="helper-text" id="email-error">*helper text</span>
          </div>
          
          <!-- 비밀번호 -->
          <div class="form-group">
            <label for="password" class="form-label">비밀번호*</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              class="form-input" 
              placeholder="비밀번호를 입력하세요"
              required 
            />
            <span class="helper-text" id="password-error">*helper text</span>
          </div>
          
          <!-- 비밀번호 확인 -->
          <div class="form-group">
            <label for="password-confirm" class="form-label">비밀번호 확인*</label>
            <input 
              type="password" 
              id="password-confirm" 
              name="password-confirm" 
              class="form-input" 
              placeholder="비밀번호를 다시 입력하세요"
              required 
            />
            <span class="helper-text" id="password-confirm-error">*helper text</span>
          </div>
          
          <!-- 닉네임 -->
          <div class="form-group">
            <label for="nickname" class="form-label">닉네임*</label>
            <input 
              type="text" 
              id="nickname" 
              name="nickname" 
              class="form-input" 
              placeholder="닉네임을 입력하세요"
              required 
            />
            <span class="helper-text" id="nickname-error">*helper text</span>
          </div>
          
          <button type="submit" class="btn btn-primary">회원가입</button>
          
          <button type="button" id="login-link" class="btn btn-secondary">
            로그인하러 가기
          </button>
        </form>
      </div>
    </main>
  `;
  
  // 이벤트 리스너 등록
  attachSignupEvents();
}

/**
 * 회원가입 페이지 이벤트 리스너 등록
 */
function attachSignupEvents() {
  const form = document.getElementById('form');
  const loginLink = document.getElementById('login-link');
  const avatarWrapper = document.querySelector('.avatar-wrapper');
  const profileInput = document.getElementById('profile-image');
  const avatarImg = document.getElementById('avatar-img');
  
  // 회원가입 폼 제출
  form.addEventListener('submit', handleSignup);
  
  // 로그인 링크 클릭
  loginLink.addEventListener('click', () => {
    navigateTo('/login');
  });
  
  // + 아이콘 클릭 시 파일 선택 (+ 아이콘 부근에서만 클릭 가능)
  const plusIcon = document.querySelector('.plus');
  if (plusIcon) {
    plusIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      profileInput.click();
    });
  }
  
  // 원의 다른 영역 클릭 시 아무 동작 안 함
  const avatarPreview = document.getElementById('signup-avatar-preview');
  if (avatarPreview) {
    avatarPreview.addEventListener('click', (e) => {
      // + 아이콘이 아닌 영역을 클릭한 경우에만 이벤트 전파 중단
      if (e.target !== plusIcon && !plusIcon.contains(e.target)) {
        e.stopPropagation();
        // 아무 동작 안 함
      }
    });
  }
  
  // 프로필 사진 선택 시 미리보기
  profileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        avatarImg.src = event.target.result;
        avatarImg.style.display = 'block';
        document.querySelector('.plus').style.display = 'none';
      };
      reader.readAsDataURL(file);
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
 * 회원가입 처리
 */
async function handleSignup(e) {
  e.preventDefault();
  
  // 에러 메시지 초기화
  clearErrors();
  
  const form = e.target;
  const formData = new FormData(form);
  const email = formData.get('email');
  const password = formData.get('password');
  const passwordConfirm = formData.get('password-confirm');
  const nickname = formData.get('nickname');
  const profileImage = document.getElementById('profile-image').files[0];
  
  // 입력값 검증
  let hasError = false;
  
  if (!email) {
    showFieldError('email-error', '이메일을 입력해주세요.');
    hasError = true;
  }
  
  if (!password) {
    showFieldError('password-error', '비밀번호를 입력해주세요.');
    hasError = true;
  } else if (password.length < 8) {
    showFieldError('password-error', '비밀번호는 8자 이상이어야 합니다.');
    hasError = true;
  }
  
  if (password !== passwordConfirm) {
    showFieldError('password-confirm-error', '비밀번호가 일치하지 않습니다.');
    hasError = true;
  }
  
  if (!nickname) {
    showFieldError('nickname-error', '닉네임을 입력해주세요.');
    hasError = true;
  }
  
  if (hasError) return;
  
  const submitBtn = form.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;
  
  try {
    // 로딩 상태
    submitBtn.textContent = '회원가입 중...';
    submitBtn.disabled = true;
    
    // 회원가입 데이터 준비
    const signupData = {
      email,
      password,
      nickname
    };
    
    // 프로필 이미지가 있으면 Base64로 변환
    if (profileImage) {
      const base64Image = await fileToBase64(profileImage);
      signupData.profileImage = base64Image;
    }
    
    // 회원가입 API 호출
    await api.post('/auth/signup', signupData);
    
    // 성공 메시지 표시 후 로그인 페이지로 이동
    alert('회원가입이 완료되었습니다! 로그인해주세요.');
    navigateTo('/login');
    
  } catch (error) {
    // 에러 표시
    const errorMessage = error.message || '회원가입에 실패했습니다.';
    alert(errorMessage);
  } finally {
    // 버튼 상태 복원
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
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

/**
 * 파일을 Base64로 변환
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
