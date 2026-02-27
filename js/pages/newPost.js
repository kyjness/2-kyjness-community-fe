// 게시글 작성 페이지
/** 새로 선택한 파일 목록 (미리보기 objectUrl + 선택 시 업로드된 imageId, 제거 시 DELETE /media/images 호출) */
let newPreviewFiles = [];

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, initAutoResizeTextarea, getApiErrorMessage, validatePostTitle, validatePostContent } from '../utils.js';

// 게시글 작성 페이지 렌더링
export function renderNewPost() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    ${renderHeader({ showBackButton: true })}
    
    <main class="main">
      <div class="post-list-container post-new-container">
        <div class="form-container">
          <h2 class="form-title">게시글 작성</h2>

          <form id="form" class="form new-post-form" novalidate>
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
              <span class="helper-text" id="title-error"></span>
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
              <div id="post-image-preview" class="post-image-preview" aria-label="첨부 이미지 미리보기"></div>
              <span class="helper-text" id="content-error"></span>
            </div>

            <!-- 이미지 (최대 5장) -->
            <div class="form-group">
              <label for="image" class="form-label">이미지 (최대 5장)</label>

              <div class="file-input-wrapper">
                <input 
                  type="file" 
                  id="image" 
                  name="image"
                  accept="image/jpeg,image/png"
                  multiple
                  class="file-input-hidden"
                />

                <label for="image" class="file-input-button">
                  파일 선택
                </label>

                <span class="file-input-text" id="file-input-text">
                  파일을 선택해주세요.
                </span>
              </div>
            </div>
            <span class="helper-text form-error-common" id="form-error"></span>
            <button type="submit" class="btn btn-primary">완료</button>
          </form>
        </div>
      </div>
    </main>
  `;

  initHeaderEvents();
  attachNewPostEvents();
  initAutoResizeTextarea('content');
}

// 내용 영역 이미지 미리보기 (새로 선택한 파일만, 오른쪽 위 X로 제거)
function renderImagePreviews() {
  const container = document.getElementById('post-image-preview');
  if (!container) return;
  const items = (newPreviewFiles || []).map(
    (item, i) =>
      `<div class="post-image-preview-item" data-type="new" data-index="${i}">
        <img src="${item.objectUrl}" alt="새 이미지" />
        <button type="button" class="post-image-remove" aria-label="이미지 제거">×</button>
      </div>`
  );
  container.innerHTML = items.join('');
  container.classList.toggle('has-images', items.length > 0);
}

// 게시글 작성 페이지 이벤트 리스너
function attachNewPostEvents() {
  const form = document.getElementById('form');
  if (!form) return;
  form.addEventListener('submit', handleNewPost);

  const imageInput = document.getElementById('image');
  const fileText = document.getElementById('file-input-text');
  const previewContainer = document.getElementById('post-image-preview');
  const fileInputBtn = form.querySelector('.file-input-button');
  const maxTotal = 5;

  if (fileInputBtn && imageInput) {
    fileInputBtn.addEventListener('click', (e) => {
      e.preventDefault();
      imageInput.click();
    });
  }

  if (previewContainer) {
    previewContainer.addEventListener('click', async (e) => {
      const removeBtn = e.target.closest('.post-image-remove');
      if (!removeBtn) return;
      const item = removeBtn.closest('.post-image-preview-item');
      if (!item) return;
      e.preventDefault();
      const index = parseInt(item.dataset.index, 10);
      const entry = newPreviewFiles[index];
      if (entry?.imageId != null) {
        try {
          await api.delete(`/media/images/${entry.imageId}`);
        } catch (_) {}
      }
      if (entry?.objectUrl) URL.revokeObjectURL(entry.objectUrl);
      newPreviewFiles = newPreviewFiles.filter((_, i) => i !== index);
      renderImagePreviews();
      if (fileText) {
        fileText.textContent = newPreviewFiles.length > 0 ? `총 ${newPreviewFiles.length}장` : '파일을 선택해주세요.';
      }
    });
  }

  if (imageInput && fileText) {
    imageInput.addEventListener('change', async (e) => {
      const added = Array.from(e.target.files || []).slice(0, maxTotal - newPreviewFiles.length);
      for (const file of added) {
        if (newPreviewFiles.length >= maxTotal) break;
        const objectUrl = URL.createObjectURL(file);
        try {
          const formData = new FormData();
          formData.append('image', file);
          const uploadRes = await api.postFormData('/media/images?type=post', formData);
          const imageId = uploadRes?.data?.imageId ?? uploadRes?.imageId ?? null;
          newPreviewFiles.push({ file, objectUrl, imageId });
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          showFieldError('content-error', getApiErrorMessage(err?.code ?? err?.message, '이미지 업로드에 실패했습니다.'));
          break;
        }
      }
      imageInput.value = '';
      renderImagePreviews();
      fileText.textContent = newPreviewFiles.length > 0 ? `총 ${newPreviewFiles.length}장` : '파일을 선택해주세요.';
    });
  }
}

// 게시글 작성 처리
async function handleNewPost(e) {
  e.preventDefault();

  clearErrors();

  const form = e.target;
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const imageIds = (newPreviewFiles || []).map((item) => item.imageId).filter((id) => id != null);

  const titleCheck = validatePostTitle(title);
  const contentCheck = validatePostContent(content);

  if (!titleCheck.ok) showFieldError('title-error', titleCheck.message);
  if (!contentCheck.ok) showFieldError('content-error', contentCheck.message);
  if (!titleCheck.ok || !contentCheck.ok) return;

  const submitBtn = form.querySelector('.btn-primary');
  const originalText = submitBtn.textContent;

  try {
    submitBtn.textContent = '작성 중...';
    submitBtn.disabled = true;

    const result = await api.post('/posts', { title, content, imageIds: imageIds.length ? imageIds : undefined });
    const postId = result?.data?.postId ?? result?.postId ?? null;
    const id = postId != null && postId !== '' ? String(postId) : null;

    alert('게시글이 작성되었습니다!');
    if (id) {
      navigateTo(`/posts/${id}`);
    } else {
      navigateTo('/posts');
    }
  } catch (error) {
    const msg = getApiErrorMessage(error?.code || error?.message, '게시글 작성에 실패했습니다. 제목·내용·이미지를 확인한 뒤 다시 시도해주세요.');
    showFieldError('form-error', msg);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
