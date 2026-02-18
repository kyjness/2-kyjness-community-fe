// 회원가입 페이지

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, getApiErrorMessage, isValidEmail } from '../utils.js';

// 회원가입 페이지 렌더링
export function renderSignup() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    ${renderHeader({ showBackButton: true, backButtonHref: '/login', showProfile: false })}
    
    <main class="main">
      <div class="form-container">
        <h2 class="form-title">회원가입</h2>
        
        <form id="form" class="form">
          <!-- 프로필 사진 업로드 -->
          <div class="profile-group form-group">
           <label class="form-label">프로필 사진</label>
           <span class="helper-text" id="profile-error"></span>

           <div class="avatar-wrapper">
            <div class="btn avatar" id="signup-avatar-preview">
             <img
               id="avatar-img"
               style="display: none;"
             />
             <!-- + 아이콘은 항상 표시 (사진이 있어도) -->
             <div class="plus" id="plus-icon"></div>
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
            <span class="helper-text" id="email-error"></span>
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
            <span class="helper-text" id="password-error"></span>
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
            <span class="helper-text" id="password-confirm-error"></span>
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
            <span class="helper-text" id="nickname-error"></span>
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
  initHeaderEvents({ backButtonHref: '/login' });
  attachSignupEvents();
}

// 회원가입 페이지 이벤트 리스너
function attachSignupEvents() {
  const form = document.getElementById('form');
  const loginLink = document.getElementById('login-link');
  const profileInput = document.getElementById('profile-image');
  const avatarImg = document.getElementById('avatar-img');

  // 회원가입 폼 제출
  form.addEventListener('submit', handleSignup);

  // 로그인 링크 클릭
  loginLink.addEventListener('click', () => {
    navigateTo('/login');
  });

  const plusIcon = document.getElementById('plus-icon');
  const avatarPreview = document.getElementById('signup-avatar-preview');

  // + 아이콘 클릭 시 파일 선택
  if (plusIcon) {
    plusIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      profileInput.click();
    });
  }

  // 이미지가 있을 때 이미지 클릭 시에도 파일 선택 가능
  if (avatarImg) {
    avatarImg.addEventListener('click', (e) => {
      e.stopPropagation();
      profileInput.click();
    });
  }

  // 원의 다른 영역 클릭 시 아무 동작 안 함 (이미지나 + 아이콘이 아닌 경우)
  if (avatarPreview) {
    avatarPreview.addEventListener('click', (e) => {
      // + 아이콘이나 이미지가 아닌 영역을 클릭한 경우에만 이벤트 전파 중단
      if (e.target !== plusIcon && !plusIcon.contains(e.target) && e.target !== avatarImg) {
        e.stopPropagation();
      }
    });
  }

  // 프로필 사진 선택 시 미리보기
  if (profileInput) {
    profileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          avatarImg.src = event.target.result;
          avatarImg.style.display = 'block';
          // + 아이콘은 계속 표시 (사진이 있어도)
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// 회원가입 처리
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

  // 입력값 검증
  let hasError = false;

  if (!email) {
    showFieldError('email-error', '이메일을 입력해주세요.');
    hasError = true;
  } else if (!isValidEmail(email)) {
    showFieldError('email-error', getApiErrorMessage('INVALID_EMAIL_FORMAT'));
    hasError = true;
  }

  if (!password) {
    showFieldError('password-error', '비밀번호를 입력해주세요.');
    hasError = true;
  } else if (password.length < 8 || password.length > 20) {
    showFieldError('password-error', getApiErrorMessage('INVALID_PASSWORD_FORMAT'));
    hasError = true;
  } else if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) {
    showFieldError('password-error', getApiErrorMessage('INVALID_PASSWORD_FORMAT'));
    hasError = true;
  }

  if (password !== passwordConfirm) {
    showFieldError(
      'password-confirm-error',
      '비밀번호가 일치하지 않습니다.',
    );
    hasError = true;
  }

  if (!nickname) {
    showFieldError('nickname-error', '닉네임을 입력해주세요.');
    hasError = true;
  } else if (!/^[가-힣a-zA-Z0-9]{1,10}$/.test(nickname.trim())) {
    showFieldError('nickname-error', getApiErrorMessage('INVALID_NICKNAME_FORMAT'));
    hasError = true;
  }

  if (hasError) return;

  const submitBtn = form.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;

  try {
    submitBtn.textContent = '회원가입 중...';
    submitBtn.disabled = true;

    let profileImageId = null;
    const profileInput = document.getElementById('profile-image');
    if (profileInput?.files?.[0]) {
      const formData = new FormData();
      formData.append('image', profileInput.files[0]);
      const uploadRes = await api.postFormData('/media/images?type=profile', formData);
      profileImageId = uploadRes?.data?.imageId ?? uploadRes?.imageId ?? null;
    }

    const signupData = {
      email,
      password,
      passwordConfirm,
      nickname,
    };
    if (profileImageId != null) signupData.profileImageId = profileImageId;

    await api.post('/auth/signup', signupData);

    // 성공 메시지 표시 후 로그인 페이지로 이동
    alert('회원가입이 완료되었습니다! 로그인해주세요.');
    navigateTo('/login');
  } catch (error) {
    const msg = getApiErrorMessage(error?.code || error?.message, '회원가입에 실패했습니다.');
    alert(msg);
  } finally {
    // 버튼 상태 복원
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
