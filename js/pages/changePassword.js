// 비밀번호 변경 페이지

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, getApiErrorMessage, validatePassword } from '../utils.js';

// 비밀번호 변경 페이지 렌더링
export function renderChangePassword() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    ${renderHeader()}
    
    <main class="main">
      <div class="form-container">
        <h2 class="form-title">비밀번호 수정</h2>
        
        <form id="form" class="form" novalidate>
          <!-- 현재 비밀번호 -->
          <div class="form-group">
            <label for="current-password" class="form-label">현재 비밀번호</label>
            <input 
              type="password" 
              id="current-password" 
              name="current-password" 
              class="form-input" 
              placeholder="현재 비밀번호를 입력하세요"
              required 
            />
            <span class="helper-text" id="current-password-error"></span>
          </div>
          
          <!-- 새 비밀번호 -->
          <div class="form-group">
            <label for="new-password" class="form-label">새 비밀번호</label>
            <input 
              type="password" 
              id="new-password" 
              name="new-password" 
              class="form-input" 
              placeholder="새 비밀번호를 입력하세요"
              required 
            />
            <span class="helper-text" id="new-password-error"></span>
          </div>
          
          <!-- 새 비밀번호 확인 -->
          <div class="form-group">
            <label for="new-password-confirm" class="form-label">새 비밀번호 확인</label>
            <input 
              type="password" 
              id="new-password-confirm" 
              name="new-password-confirm" 
              class="form-input" 
              placeholder="새 비밀번호를 한번 더 입력하세요"
              required 
            />
            <span class="helper-text" id="new-password-confirm-error"></span>
          </div>
          
          <button type="submit" class="btn btn-primary">수정하기</button>
        </form>
      </div>
    </main>
  `;

  // 이벤트 리스너 등록
  initHeaderEvents();
  attachChangePasswordEvents();
}

// 비밀번호 변경 페이지 이벤트 리스너
function attachChangePasswordEvents() {
  const form = document.getElementById('form');
  if (form) {
    form.addEventListener('submit', handleChangePassword);
  }
}

// 비밀번호 변경 처리
async function handleChangePassword(e) {
  e.preventDefault();

  clearErrors();

  const form = e.target;
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const newPasswordConfirm = document.getElementById('new-password-confirm').value;

  let hasError = false;

  if (!currentPassword) {
    showFieldError('current-password-error', '현재 비밀번호를 입력해주세요.');
    hasError = true;
  }

  const newPasswordCheck = validatePassword(newPassword);
  if (!newPasswordCheck.ok) {
    showFieldError('new-password-error', newPasswordCheck.message);
    hasError = true;
  }

  if (newPassword !== newPasswordConfirm) {
    showFieldError(
      'new-password-confirm-error',
      '새 비밀번호 확인이 위 새 비밀번호와 일치하지 않습니다.',
    );
    hasError = true;
  }

  if (hasError) return;

  const submitBtn = form.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;

  try {
    submitBtn.textContent = '변경 중...';
    submitBtn.disabled = true;

    await api.patch('/users/me/password', {
      currentPassword,
      newPassword,
    });

    alert('비밀번호가 변경되었습니다!');
    navigateTo('/posts');
  } catch (error) {
    const msg = getApiErrorMessage(error?.code || error?.message, '현재 비밀번호가 맞는지 확인한 뒤 다시 시도해주세요.');
    showFieldError('form-error', msg);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
