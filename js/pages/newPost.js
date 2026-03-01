// 게시글 작성 페이지 — 처음부터 단순하게 작성

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, initAutoResizeTextarea, getApiErrorMessage, validatePostTitle, validatePostContent } from '../utils.js';

const MAX_IMAGES = 5;
let selectedImages = [];

function getPreviewContainer() {
  return document.getElementById('post-image-preview');
}

function getFileTextEl() {
  return document.getElementById('file-input-text');
}

const NEW_POST_HASH = '#/posts/new';

function renderPreviews(skipHashCheck = false) {
  if (!skipHashCheck && (window.location.hash || '').replace(/^#?/, '#') !== NEW_POST_HASH) return;
  const container = getPreviewContainer();
  if (!container || !document.body.contains(container)) return;
  const html = selectedImages
    .map(
      (item, i) =>
        `<div class="post-image-preview-item" data-index="${i}">
          <img src="${item.objectUrl}" alt="미리보기" />
          <button type="button" class="post-image-remove" aria-label="제거">×</button>
        </div>`
    )
    .join('');
  container.innerHTML = html;
  container.classList.toggle('has-images', selectedImages.length > 0);
  const ft = getFileTextEl();
  if (ft) ft.textContent = selectedImages.length > 0 ? `총 ${selectedImages.length}장` : '파일을 선택해주세요.';
}

export function renderNewPost() {
  selectedImages = [];
  const root = document.getElementById('app-root');
  root.innerHTML = `
    ${renderHeader({ showBackButton: true })}
    <main class="main">
      <div class="post-list-container post-new-container">
        <div class="form-container">
          <h2 class="form-title">게시글 작성</h2>
          <form id="new-post-form" class="form new-post-form" novalidate>
            <div class="form-group">
              <label for="title" class="form-label">제목*</label>
              <input type="text" id="title" name="title" class="form-input" placeholder="제목을 입력하세요. (최대 26글자)" maxlength="26" required />
              <span class="helper-text" id="title-error"></span>
            </div>
            <div class="form-group">
              <label for="content" class="form-label">내용*</label>
              <textarea id="content" name="content" class="form-input form-textarea" placeholder="내용을 입력하세요." required></textarea>
              <div id="post-image-preview" class="post-image-preview" aria-label="첨부 이미지 미리보기"></div>
              <span class="helper-text" id="content-error"></span>
            </div>
            <div class="form-group">
              <span class="form-label">이미지 (최대 ${MAX_IMAGES}장)</span>
              <div class="file-input-wrapper">
                <input type="file" id="post-file-input" accept="image/jpeg,image/png" multiple class="file-input-hidden" aria-hidden="true" />
                <button type="button" class="file-input-button" id="post-file-trigger">파일 선택</button>
                <span class="file-input-text" id="file-input-text">파일을 선택해주세요.</span>
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
  initAutoResizeTextarea('content');
  renderPreviews(true);

  const form = document.getElementById('new-post-form');
  const fileInput = document.getElementById('post-file-input');
  const trigger = document.getElementById('post-file-trigger');
  const previewContainer = getPreviewContainer();

  form.addEventListener('submit', onSubmit);

  if (trigger && fileInput) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      const left = MAX_IMAGES - selectedImages.length;
      const toAdd = files.slice(0, left);
      for (const file of toAdd) {
        if (selectedImages.length >= MAX_IMAGES) break;
        const objectUrl = URL.createObjectURL(file);
        const entry = { file, objectUrl, imageId: null };
        selectedImages.push(entry);
        renderPreviews();
        try {
          const fd = new FormData();
          fd.append('image', file);
          const res = await api.postFormData('/media/images?purpose=post', fd);
          if ((window.location.hash || '').replace(/^#?/, '#') !== NEW_POST_HASH) return;
          entry.imageId = res?.data?.imageId ?? res?.imageId ?? null;
        } catch (err) {
          if ((window.location.hash || '').replace(/^#?/, '#') === NEW_POST_HASH) {
            URL.revokeObjectURL(objectUrl);
            selectedImages = selectedImages.filter((x) => x !== entry);
            renderPreviews();
            showFieldError('content-error', getApiErrorMessage(err?.code ?? err?.message, '이미지 업로드에 실패했습니다.'));
          }
        }
      }
      renderPreviews();
    });
  }

  if (previewContainer) {
    previewContainer.addEventListener('click', async (e) => {
      const remove = e.target.closest('.post-image-remove');
      if (!remove) return;
      const item = remove.closest('.post-image-preview-item');
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();
      const i = parseInt(item.dataset.index, 10);
      const entry = selectedImages[i];
      if (entry?.imageId != null) {
        try {
          await api.delete(`/media/images/${entry.imageId}`);
        } catch (_) {}
      }
      if (entry?.objectUrl) URL.revokeObjectURL(entry.objectUrl);
      selectedImages = selectedImages.filter((_, idx) => idx !== i);
      renderPreviews();
    });
  }
}

async function onSubmit(e) {
  e.preventDefault();
  clearErrors();

  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const imageIds = selectedImages.map((x) => x.imageId).filter((id) => id != null);

  const tCheck = validatePostTitle(title);
  if (!tCheck.ok) {
    showFieldError('title-error', tCheck.message);
    return;
  }
  const cCheck = validatePostContent(content);
  if (!cCheck.ok) {
    showFieldError('content-error', cCheck.message);
    return;
  }

  const form = e.target;
  const btn = form.querySelector('.btn-primary');
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = '작성 중...';

  try {
    const res = await api.post('/posts', { title, content, imageIds: imageIds.length ? imageIds : undefined });
    const postId = res?.data?.postId ?? res?.postId;
    alert('게시글이 작성되었습니다!');
    navigateTo(postId != null ? `/posts/${postId}` : '/posts');
  } catch (err) {
    showFieldError('form-error', getApiErrorMessage(err?.code ?? err?.message, '게시글 작성에 실패했습니다.'));
    btn.disabled = false;
    btn.textContent = orig;
  }
}
