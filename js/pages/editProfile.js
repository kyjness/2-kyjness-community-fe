/**
 * 회원정보 수정 페이지
 */

import { api } from '../api.js';
import { getUser, setUser, clearUser } from '../state.js';
import { navigateTo } from '../router.js';

/**
 * 회원정보 수정 페이지 렌더링
 */
export function renderEditProfile() {
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
                    src="${user?.profileImage || './imt.png'}"
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
              value="${user?.nickname || ''}"
            />
            <!-- 항상 보이는 helper text (오타 없이) -->
            <span class="helper-text" id="nickname-error">*helper text</span>
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

  attachEditProfileEvents();
}

/**
 * 이벤트 등록
 */
function attachEditProfileEvents() {
  const form = document.getElementById('form');
  const profileBtn = document.getElementById('header-profile-btn');
  const dropdown = document.getElementById('profile-dropdown');
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
  form.addEventListener('submit', handleProfileUpdate);

  // 하단 "수정완료" 버튼도 같은 동작 수행
  if (editCompleteBtn) {
    editCompleteBtn.addEventListener('click', () => {
      form.requestSubmit();
    });
  }

  // "변경" 버튼 클릭 → 파일 선택 (변경 버튼만 클릭 가능)
  avatarChangeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileInput.click();
  });

  // 원의 다른 영역 클릭 시 아무 동작 안 함 (변경 버튼만 클릭 가능)
  avatarArea.addEventListener('click', (e) => {
    // 변경 버튼이 아닌 영역을 클릭한 경우에만 이벤트 전파 중단
    if (e.target !== avatarChangeBtn && !avatarChangeBtn.contains(e.target)) {
      e.stopPropagation();
      // 아무 동작 안 함
    }
  });

  // 프로필 사진 선택 시 미리보기
  profileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      avatarImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // 드롭다운 토글
  profileBtn.addEventListener('click', () => {
    dropdown.classList.toggle('visible');
  });

  // 드롭다운 내부 이동
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

  // 드롭다운 바깥 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('visible');
    }
  });

  // 회원 탈퇴 버튼 → 모달 열기
  deleteBtn.addEventListener('click', () => {
    openDeleteModal(deleteModal);
  });

  // 모달 취소/확인
  deleteModalCancel.addEventListener('click', () => {
    closeDeleteModal(deleteModal);
  });

  deleteModalConfirm.addEventListener('click', async () => {
    await handleDeleteAccount();
  });

  // 모달 바깥 클릭 시 닫기
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      closeDeleteModal(deleteModal);
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
 * 회원정보 수정 처리
 */
async function handleProfileUpdate(e) {
  e.preventDefault();

  clearNicknameError();

  const nicknameInput = document.getElementById('nickname');
  const nickname = nicknameInput.value.trim();
  const submitBtn = e.target.querySelector('button[type="submit"]'); // btn-primary
  const originalText = submitBtn.textContent;

  if (!nickname) {
    showNicknameError('닉네임을 입력해주세요.');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = '수정 중...';

    const payload = { nickname };

    // 프로필 이미지 선택된 경우 Base64로 전송
    const file = document.getElementById('profile-image').files[0];
    if (file) {
      const base64Image = await fileToBase64(file);
      payload.profileImage = base64Image;
    }

    // 백엔드의 내 정보 수정 API
    const updatedUser = await api.put('/users/me', payload);

    if (updatedUser) {
      setUser(updatedUser); // 상태에 저장
    }

    alert('회원정보가 수정되었습니다.');
    navigateTo('/posts');
  } catch (error) {
    alert(error.message || '회원정보 수정에 실패했습니다.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * 회원 탈퇴 처리
 */
async function handleDeleteAccount() {
  const deleteModal = document.getElementById('delete-modal');

  try {
    await api.delete('/users/me');
    clearUser();
    closeDeleteModal(deleteModal);
    alert('회원 탈퇴가 완료되었습니다.');
    navigateTo('/signup');
  } catch (error) {
    alert(error.message || '회원 탈퇴에 실패했습니다.');
  }
}

/* 모달 열기/닫기 */
function openDeleteModal(modal) {
  modal.classList.add('visible');
}
function closeDeleteModal(modal) {
  modal.classList.remove('visible');
}

/* 닉네임 에러 헬퍼 */
function showNicknameError(message) {
  const el = document.getElementById('nickname-error');
  if (!el) return;
  el.textContent = `* ${message}`;
}

function clearNicknameError() {
  const el = document.getElementById('nickname-error');
  if (!el) return;
  el.textContent = '*helper text'; // 기본 helper text로 되돌리기
}

/* 파일 → Base64 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
