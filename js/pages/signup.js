// 회원가입 페이지 — 처음부터 단순하게 작성

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, getApiErrorMessage, isValidEmail, validatePassword, validateNickname } from '../utils.js';

export function renderSignup() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    ${renderHeader({ showBackButton: true, backButtonHref: '/login', showProfile: false })}
    <main class="main">
      <div class="form-container">
        <h2 class="form-title">회원가입</h2>
        <form id="signup-form" class="form" novalidate>
          <div class="profile-group form-group">
            <label class="form-label">프로필 사진</label>
            <span class="helper-text" id="profile-error"></span>
            <div class="avatar-wrapper">
              <div class="btn avatar" id="signup-avatar-preview">
                <img id="avatar-img" style="display: none;" alt="" />
                <div class="plus" id="plus-icon"></div>
              </div>
              <input type="file" id="profile-image" accept="image/jpeg,image/png" style="display: none;" />
            </div>
          </div>
          <div class="form-group">
            <label for="email" class="form-label">이메일*</label>
            <input type="email" id="email" name="email" class="form-input" placeholder="이메일을 입력하세요" required />
            <span class="helper-text" id="email-error"></span>
          </div>
          <div class="form-group">
            <label for="password" class="form-label">비밀번호*</label>
            <input type="password" id="password" name="password" class="form-input" placeholder="비밀번호를 입력하세요" required />
            <span class="helper-text" id="password-error"></span>
          </div>
          <div class="form-group">
            <label for="password-confirm" class="form-label">비밀번호 확인*</label>
            <input type="password" id="password-confirm" name="password-confirm" class="form-input" placeholder="비밀번호를 다시 입력하세요" required />
            <span class="helper-text" id="password-confirm-error"></span>
          </div>
          <div class="form-group">
            <label for="nickname" class="form-label">닉네임*</label>
            <input type="text" id="nickname" name="nickname" class="form-input" placeholder="닉네임을 입력하세요" required />
            <span class="helper-text" id="nickname-error"></span>
          </div>
          <span class="helper-text form-error-common" id="form-error-common"></span>
          <button type="submit" class="btn btn-primary" id="signup-submit">회원가입</button>
          <button type="button" id="login-link" class="btn btn-secondary">로그인하러 가기</button>
        </form>
      </div>
    </main>
  `;

  initHeaderEvents({ backButtonHref: '/login' });

  const form = document.getElementById('signup-form');
  const profileInput = document.getElementById('profile-image');
  const avatarImg = document.getElementById('avatar-img');
  const avatarPreview = document.getElementById('signup-avatar-preview');

  form.addEventListener('submit', onSignupSubmit);
  document.getElementById('login-link').addEventListener('click', () => navigateTo('/login'));

  if (avatarPreview && profileInput) {
    avatarPreview.addEventListener('click', () => profileInput.click());
  }

  const ALLOWED = ['image/jpeg', 'image/png'];
  if (profileInput && avatarImg) {
    profileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      document.getElementById('profile-error').textContent = '';
      if (!file) return;
      if (!ALLOWED.includes(file.type)) {
        showFieldError('profile-error', getApiErrorMessage('INVALID_FILE_TYPE'));
        profileInput.value = '';
        avatarImg.style.display = 'none';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        avatarImg.src = ev.target.result;
        avatarImg.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }
}

let signupSubmitting = false;

async function onSignupSubmit(e) {
  e.preventDefault();
  if (signupSubmitting) return;

  clearErrors();
  const form = e.target;
  const email = String(form.email?.value ?? '').trim();
  const password = form.password?.value ?? '';
  const passwordConfirm = form['password-confirm']?.value ?? '';
  const nickname = String(form.nickname?.value ?? '').trim();
  const profileFile = document.getElementById('profile-image')?.files?.[0];

  if (!email) {
    showFieldError('email-error', '이메일을 입력해주세요.');
    return;
  }
  if (!isValidEmail(email)) {
    showFieldError('email-error', getApiErrorMessage('INVALID_EMAIL_FORMAT'));
    return;
  }
  const pwCheck = validatePassword(password);
  if (!pwCheck.ok) {
    showFieldError('password-error', pwCheck.message);
    return;
  }
  if (!passwordConfirm?.trim()) {
    showFieldError('password-confirm-error', '비밀번호 확인을 입력해주세요.');
    return;
  }
  if (password !== passwordConfirm) {
    showFieldError('password-confirm-error', '비밀번호 확인이 일치하지 않습니다.');
    return;
  }
  const nickCheck = validateNickname(nickname);
  if (!nickCheck.ok) {
    showFieldError('nickname-error', nickCheck.message);
    return;
  }

  const submitBtn = document.getElementById('signup-submit');
  const originalText = submitBtn.textContent;
  signupSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.textContent = '회원가입 중...';

  let success = false;
  try {
    let profileImageId = null;
    let signupToken = null;

    if (profileFile) {
      const fd = new FormData();
      fd.append('image', profileFile);
      const res = await api.postFormData('/media/images/signup', fd);
      const data = res?.data ?? {};
      const id = data.imageId ?? data.image_id ?? data.id;
      const token = data.signupToken ?? data.signup_token;
      if (id == null || token == null || String(token).trim() === '') {
        showFieldError('profile-error', '프로필 이미지 업로드에 실패했습니다.');
        return;
      }
      profileImageId = Number(id);
      signupToken = String(token).trim();
    }

    const payload = { email, password, nickname };
    if (profileImageId != null && signupToken) {
      payload.profileImageId = profileImageId;
      payload.signupToken = signupToken;
    }

    await api.post('/auth/signup', payload);
    success = true;
    alert('회원가입이 완료되었습니다! 로그인해주세요.');
    navigateTo('/login');
  } catch (err) {
    const code = String(err?.code ?? err?.message ?? '').trim().toUpperCase();
    const msg = getApiErrorMessage(code || undefined, '회원가입에 실패했습니다. 다시 시도해주세요.');
    if (['EMAIL_ALREADY_EXISTS', 'INVALID_EMAIL_FORMAT'].includes(code)) {
      showFieldError('email-error', msg);
    } else if (code === 'INVALID_PASSWORD_FORMAT') {
      showFieldError('password-error', msg);
    } else if (['NICKNAME_ALREADY_EXISTS', 'INVALID_NICKNAME_FORMAT'].includes(code)) {
      showFieldError('nickname-error', msg);
    } else if (['SIGNUP_IMAGE_TOKEN_INVALID', 'SIGNUP_IMAGE_TOKEN_ALREADY_USED', 'FILE_SIZE_EXCEEDED', 'INVALID_FILE_TYPE', 'RATE_LIMIT_EXCEEDED'].includes(code)) {
      showFieldError('profile-error', msg);
    } else {
      showFieldError('form-error-common', msg);
    }
  } finally {
    signupSubmitting = false;
    if (!success && submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}
