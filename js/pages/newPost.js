/**
 * 게시글 작성 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors } from '../utils.js';

/**
 * 게시글 작성 페이지 렌더링
 */
export function renderNewPost() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    ${renderHeader({ showBackButton: true })}
    
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
              <span class="helper-text" id="title-error">*helper text</span>
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
  initHeaderEvents();
  attachNewPostEvents();
}

/**
 * 게시글 작성 페이지 이벤트 리스너 등록
 */
function attachNewPostEvents() {
  const form = document.getElementById('form');
  form.addEventListener('submit', handleNewPost);

  // 파일 선택 시 오른쪽 텍스트 변경
  const imageInput = document.getElementById('image');
  const fileText = document.getElementById('file-input-text');
  if (imageInput && fileText) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      fileText.textContent = file ? file.name : '파일을 선택해주세요.';
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

    const result = await api.post('/posts', { title, content, fileUrl: '' });
    const postId = result?.data?.postId ?? result?.postId;

    if (imageFile && postId) {
      const formData = new FormData();
      formData.append('postFile', imageFile);
      await api.postFormData(`/posts/${postId}/image`, formData);
    }

    alert('게시글이 작성되었습니다!');
    if (postId) {
      navigateTo(`/posts/${postId}`);
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
