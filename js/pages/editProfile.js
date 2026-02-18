// 회원정보 수정 페이지

import { api } from '../api.js';
import { getUser, setUser, clearUser } from '../state.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents, updateHeaderProfileImage } from '../components/header.js';
import { escapeHtml, getApiErrorMessage, safeImageUrl, openModal, closeModal, showFieldError, clearErrors } from '../utils.js';
import { DEFAULT_PROFILE_IMAGE } from '../config.js';

// 회원정보 수정 페이지 렌더링
export function renderEditProfile() {
  const root = document.getElementById('app-root');
  const user = getUser();

  root.innerHTML = `
    ${renderHeader()}

    <main class="main">
      <div class="form-container profile-edit">
        <h2 class="form-title">회원정보수정</h2>

        <form id="form" class="form">
          <!-- 1) 프로필 사진 -->
          <div class="form-group signup-profile-group">
            <label class="form-label">프로필 사진*</label>

            <div class="avatar-wrapper">
              <div
                class="btn avatar profile-edit-avatar"
                id="avatar-area"
              >
                <!-- ✅ 이미지를 래퍼로 한 번 감쌈 -->
                <div class="avatar-img-wrapper">
                  <img
                    id="avatar-img"
                    src="${safeImageUrl(user?.profileImageUrl, DEFAULT_PROFILE_IMAGE) || DEFAULT_PROFILE_IMAGE}"
                    alt="프로필 이미지"
                  />
                </div>

                <button
                  type="button"
                  class="profile-edit-avatar-change"
                  id="avatar-change-btn"
                >
                  변경
                </button>
              </div>

              <input
                type="file"
                id="profile-image"
                accept="image/*"
                style="display:none;"
              />
            </div>
          </div>

          <!-- 2) 이메일 (저장된 이메일 표시) -->
          <div class="form-group">
            <label class="form-label">이메일</label>
            <p class="profile-edit-email">
              ${user?.email || '&nbsp;'}
            </p>
          </div>

          <!-- 3) 닉네임 -->
          <div class="form-group">
            <label for="nickname" class="form-label">닉네임</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              class="form-input"
              value="${escapeHtml(String(user?.nickname || ''))}"
            />
            <span class="helper-text" id="nickname-error"></span>
          </div>

          <!-- 4) 수정하기 버튼 (폼 submit) -->
          <button type="submit" class="btn btn-primary">
            수정하기
          </button>

          <!-- 5) 회원 탈퇴 -->
          <button
            type="button"
            id="delete-account-btn"
            class="btn btn-secondary profile-delete-btn"
          >
            회원 탈퇴
          </button>
        </form>

        <!-- 6) 하단 큰 "수정완료" 버튼 (.btn-submit 공통 사용) -->
        <button
          type="button"
          id="edit-complete-btn"
          class="btn-submit"
        >
          수정완료
        </button>
      </div>
    </main>

    <!-- 회원탈퇴 모달 -->
    <div class="modal-overlay" id="delete-modal">
      <div class="modal">
        <h3 class="modal-title">회원탈퇴 하시겠습니까?</h3>
        <p class="modal-text">작성된 게시글과 댓글은 삭제됩니다.</p>

        <div class="modal-actions">
          <button
            type="button"
            class="modal-btn modal-btn-cancel"
            id="delete-modal-cancel"
          >
            취소
          </button>
          <button
            type="button"
            class="modal-btn modal-btn-confirm"
            id="delete-modal-confirm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  `;

  initHeaderEvents();
  attachEditProfileEvents();
}

// 이벤트 등록
function attachEditProfileEvents() {
  const form = document.getElementById('form');
  const avatarArea = document.getElementById('avatar-area');
  const profileInput = document.getElementById('profile-image');
  const avatarImg = document.getElementById('avatar-img');
  const avatarChangeBtn = document.getElementById('avatar-change-btn');
  const deleteBtn = document.getElementById('delete-account-btn');
  const editCompleteBtn = document.getElementById('edit-complete-btn');

  const deleteModal = document.getElementById('delete-modal');
  const deleteModalCancel = document.getElementById('delete-modal-cancel');
  const deleteModalConfirm = document.getElementById('delete-modal-confirm');

  // 폼 제출 → 회원정보 수정
  if (form) {
    form.addEventListener('submit', handleProfileUpdate);
  }

  // 하단 "수정완료" 버튼도 같은 동작 수행
  if (editCompleteBtn) {
    editCompleteBtn.addEventListener('click', () => {
      form.requestSubmit();
    });
  }

  // "변경" 버튼 클릭 → 파일 선택 (변경 버튼만 클릭 가능)
  if (avatarChangeBtn && profileInput) {
    avatarChangeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileInput.click();
    });
  }

  // 원의 다른 영역 클릭 시 아무 동작 안 함 (변경 버튼만 클릭 가능)
  if (avatarArea && avatarChangeBtn) {
    avatarArea.addEventListener('click', (e) => {
      // 변경 버튼이 아닌 영역을 클릭한 경우에만 이벤트 전파 중단
      if (e.target !== avatarChangeBtn && !avatarChangeBtn.contains(e.target)) {
        e.stopPropagation();
      }
    });
  }

  // 프로필 사진 선택 시 미리보기 (회원정보 수정 페이지 + 헤더 모두 업데이트)
  if (profileInput && avatarImg) {
    profileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target.result;
        // 회원정보 수정 페이지의 프로필 이미지 업데이트
        avatarImg.src = imageDataUrl;
        // 헤더의 프로필 이미지도 즉시 업데이트 (미리보기)
        const headerProfileImg = document.querySelector('.profile-avatar-img');
        if (headerProfileImg) {
          headerProfileImg.src = imageDataUrl;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // 회원 탈퇴 버튼 → 모달 열기
  if (deleteBtn && deleteModal) {
    deleteBtn.addEventListener('click', () => openModal(deleteModal));
  }

  // 모달 취소/확인
  if (deleteModalCancel && deleteModal) {
    deleteModalCancel.addEventListener('click', () => closeModal(deleteModal));
  }

  if (deleteModalConfirm) {
    deleteModalConfirm.addEventListener('click', async () => {
      await handleDeleteAccount();
    });
  }

  // 모달 바깥 클릭 시 닫기
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeModal(deleteModal);
    });
  }
}

// 회원정보 수정 처리
async function handleProfileUpdate(e) {
  e.preventDefault();

  clearErrors();

  const nicknameInput = document.getElementById('nickname');
  const nickname = nicknameInput.value.trim();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  if (!nickname) {
    showFieldError('nickname-error', '닉네임을 입력해주세요.');
    return;
  }

  if (!/^[가-힣a-zA-Z0-9]{1,10}$/.test(nickname)) {
    showFieldError('nickname-error', getApiErrorMessage('INVALID_NICKNAME_FORMAT'));
    return;
  }

  const user = getUser();

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = '수정 중...';

    let profileImageId = null;

    // 프로필 이미지 선택된 경우 먼저 업로드 (POST /v1/media/images) 후 profileImageId 전달
    const file = document.getElementById('profile-image').files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.postFormData('/media/images?type=profile', formData);
      profileImageId = uploadRes?.data?.imageId ?? uploadRes?.imageId ?? null;
    }

    const payload = { nickname };
    if (profileImageId != null) payload.profileImageId = profileImageId;

    await api.patch('/users/me', payload);

    const meRes = await api.get('/users/me');
    setUser(meRes?.data ?? user);
    updateHeaderProfileImage();

    alert('회원정보가 수정되었습니다.');
    navigateTo('/posts');
  } catch (error) {
    alert(getApiErrorMessage(error?.code || error?.message, '회원정보 수정에 실패했습니다.'));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// 회원 탈퇴 처리
async function handleDeleteAccount() {
  const deleteModal = document.getElementById('delete-modal');

  try {
    await api.delete('/users/me');
    clearUser();
    closeModal(deleteModal);
    alert('회원 탈퇴가 완료되었습니다.');
    navigateTo('/signup');
  } catch (error) {
    alert(getApiErrorMessage(error?.code || error?.message, '회원 탈퇴에 실패했습니다.'));
  }
}
