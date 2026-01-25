/**
 * 게시글 작성 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { getUser, clearUser } from '../state.js';

/**
 * 게시글 작성 페이지 렌더링
 */
export function renderNewPost() {
  const root = document.getElementById('app-root');
  const user = getUser();

  root.innerHTML = `
    <header class="header">
      <!-- 뒤로가기 버튼 -->
      <a href="javascript:void(0);" class="btn-back" id="btn-back">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </a>

      <!-- 제목 -->
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
      <!-- 게시글 목록과 같은 폭을 쓰되, 새 게시글 전용 클래스 추가 -->
      <div class="post-list-container post-new-container">
        <div class="form-container">
          <h2 class="form-title">게시글 작성</h2>
          
          <!-- 🔥 새 게시글 전용 클래스 추가 -->
          <form id="form" class="form new-post-form">
            <!-- 제목 -->
            <div class="form-group">
              <label for="title" class="form-label">제목*</label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                class="form-input" 
                placeholder="제목을 입력해주세요. (최대 26글자)"
                maxlength="26"
                required 
              />
            </div>
            
            <!-- 내용 -->
            <div class="form-group">
              <label for="content" class="form-label">내용*</label>
              <textarea 
                id="content" 
                name="content" 
                class="form-input form-textarea"
                placeholder="내용을 입력해주세요."
                required
              ></textarea>
              <span class="helper-text" id="content-error">*helper text</span>
            </div>

            <!-- 이미지 -->
            <div class="form-group">
              <label for="image" class="form-label">이미지</label>

              <div class="file-input-wrapper">
                <!-- 실제 파일 input (숨김) -->
                <input 
                  type="file" 
                  id="image" 
                  name="image"
                  accept="image/*"
                  class="file-input-hidden"
                />

                <!-- 디자인된 버튼 -->
                <label for="image" class="file-input-button">
                  파일 선택
                </label>

                <!-- 오른쪽 안내 문구 -->
                <span class="file-input-text" id="file-input-text">
                  파일을 선택해주세요.
                </span>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary">완료</button>
          </form>
        </div>
      </div>
    </main>
  `;
  
  // 이벤트 리스너 등록
  attachNewPostEvents();
}

/**
 * 게시글 작성 페이지 이벤트 리스너 등록
 */
function attachNewPostEvents() {
  const form = document.getElementById('form');
  form.addEventListener('submit', handleNewPost);

  // 헤더 제목 클릭 → 게시글 목록으로 이동
  const headerTitle = document.getElementById('header-title-link');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      navigateTo('/posts');
    });
  }

  // 뒤로가기 버튼 → 게시글 목록으로 이동
  const backBtn = document.getElementById('btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/posts');
    });
  }

  // 파일 선택 시 오른쪽 텍스트 변경
  const imageInput = document.getElementById('image');
  const fileText = document.getElementById('file-input-text');
  if (imageInput && fileText) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      fileText.textContent = file ? file.name : '파일을 선택해주세요.';
    });
  }

  // 프로필 드롭다운 관련
  const profileBtn = document.getElementById('header-profile-btn');
  const dropdown = document.getElementById('profile-dropdown');

  if (profileBtn && dropdown) {
    // 프로필 버튼 클릭 → 드롭다운 on/off
    profileBtn.addEventListener('click', () => {
      dropdown.classList.toggle('visible');
    });

    // 마이페이지 이동
    document.getElementById('go-mypage').addEventListener('click', () => {
      navigateTo('/profile/edit');
    });

    // 비밀번호 수정
    document.getElementById('go-password').addEventListener('click', () => {
      navigateTo('/profile/password');
    });

    // 로그아웃
    document.getElementById('logout-btn').addEventListener('click', () => {
      clearUser();
      navigateTo('/login');
    });

    // 화면 아무데나 클릭하면 드롭다운 닫힘
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('visible');
      }
    });
  }
}

/**
 * 게시글 작성 처리
 */
async function handleNewPost(e) {
  e.preventDefault();
  
  clearErrors();
  
  const form = e.target;
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const imageInput = document.getElementById('image');
  const imageFile = imageInput?.files?.[0];

  let hasError = false;
  
  if (!title) {
    showFieldError('title-error', '제목을 입력해주세요.');
    hasError = true;
  } else if (title.length > 26) {
    showFieldError('title-error', '제목은 26자 이하여야 합니다.');
    hasError = true;
  }
  
  if (!content) {
    showFieldError('content-error', '내용을 입력해주세요.');
    hasError = true;
  }
  
  if (hasError) return;
  
  const submitBtn = form.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.textContent = '작성 중...';
    submitBtn.disabled = true;
    
    // 기본 데이터
    const postData = {
      title,
      content,
    };

    // (선택) 이미지가 필요하면 여기서 postData에 붙여서 백엔드와 맞추면 됨.
    // 예: base64로 변환해서 postData.image = ...

    // 게시글 작성 API 호출
    const result = await api.post('/posts', postData);
    
    alert('게시글이 작성되었습니다!');
    
    // 게시글 상세 페이지로 이동 (id가 있으면 상세, 없으면 목록으로)
    if (result && result.id) {
      navigateTo(`/posts/${result.id}`);
    } else {
      navigateTo('/posts');
    }
    
  } catch (error) {
    const errorMessage = error.message || '게시글 작성에 실패했습니다.';
    alert(errorMessage);
  } finally {
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
  errorElements.forEach((el) => {
    el.textContent = '';
    el.style.display = 'none';
  });
}
