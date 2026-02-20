// 회원가입 페이지

import { api } from '../api.js';
import { navigateTo, route } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, getApiErrorMessage, isValidEmail, validatePassword, validateNickname } from '../utils.js';

// 회원가입 페이지 렌더링
export function renderSignup() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    ${renderHeader({ showBackButton: true, backButtonHref: '/login', showProfile: false })}
    
    <main class="main">
      <div class="form-container">
        <h2 class="form-title">회원가입</h2>
        
        <form id="form" class="form" novalidate>
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
          
          <span class="helper-text" id="form-error"></span>
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

  // 프로필 사진 선택 시 확장자 검증 후 미리보기 (지원: jpeg, jpg, png)
  const ALLOWED_PROFILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  if (profileInput) {
    profileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const profileErrorEl = document.getElementById('profile-error');
      if (profileErrorEl) {
        profileErrorEl.textContent = '';
        profileErrorEl.classList.remove('has-error');
      }
      if (file) {
        if (!ALLOWED_PROFILE_TYPES.includes(file.type)) {
          showFieldError('profile-error', getApiErrorMessage('INVALID_FILE_TYPE'));
          profileInput.value = '';
          if (avatarImg) {
            avatarImg.src = '';
            avatarImg.style.display = 'none';
          }
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          avatarImg.src = event.target.result;
          avatarImg.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// 회원가입 처리 (프로필 사진은 무시 - JSON 단일 요청만)
let _isSubmitting = false;

async function handleSignup(e) {
  e.preventDefault();

  if (_isSubmitting) return;
  _isSubmitting = true;

  clearErrors();

  const form = e.target;
  const formData = new FormData(form);
  const email = formData.get('email');
  const password = formData.get('password');
  const passwordConfirm = formData.get('password-confirm');
  const nickname = formData.get('nickname');

  let hasError = false;

  if (!email) {
    showFieldError('email-error', '이메일을 입력해주세요.');
    hasError = true;
  } else if (!isValidEmail(email)) {
    showFieldError('email-error', getApiErrorMessage('INVALID_EMAIL_FORMAT'));
    hasError = true;
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.ok) {
    showFieldError('password-error', passwordCheck.message);
    hasError = true;
  }
  if (password !== passwordConfirm) {
    showFieldError('password-confirm-error', '비밀번호 확인이 위 비밀번호와 일치하지 않습니다.');
    hasError = true;
  }
  const nicknameCheck = validateNickname(nickname);
  if (!nicknameCheck.ok) {
    showFieldError('nickname-error', nicknameCheck.message);
    hasError = true;
  }

  if (hasError) {
    _isSubmitting = false;
    return;
  }

  const submitBtn = form.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;

  try {
    submitBtn.textContent = '회원가입 중...';
    submitBtn.disabled = true;

    const signupData = {
      email: String(email ?? '').trim(),
      password: String(password ?? ''),
      passwordConfirm: String(passwordConfirm ?? ''),
      nickname: String(nickname ?? '').trim(),
    };
    await api.post('/auth/signup', signupData);

    alert('회원가입이 완료되었습니다! 로그인해주세요.');
    window.location.hash = '#/login';
    window.location.reload();
    await route();
  } catch (error) {
    const code = String(error?.code ?? error?.message ?? '').trim();
    const codeUpper = code.toUpperCase();
    const msg = getApiErrorMessage(code || undefined, '회원가입에 실패했습니다. 이메일·닉네임 중복 여부와 입력 형식을 확인한 뒤 다시 시도해주세요.');
    if (codeUpper === 'NICKNAME_ALREADY_EXISTS') showFieldError('nickname-error', msg);
    else if (codeUpper === 'EMAIL_ALREADY_EXISTS') showFieldError('email-error', msg);
    showFieldError('form-error', msg);
  } finally {
    _isSubmitting = false;
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
