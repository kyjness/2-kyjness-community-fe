// 게시글 수정 페이지 — 처음부터 단순하게 작성

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, initAutoResizeTextarea, autoResizeTextarea, resolvePostId, getApiErrorMessage, safeImageUrl, validatePostTitle, validatePostContent } from '../utils.js';

const MAX_IMAGES = 5;

let existingIds = [];
let existingUrls = [];
let newImages = [];
let editSubmitting = false;
let expectedEditHash = '';

function getPreviewContainer() {
  return document.getElementById('post-image-preview');
}
function getFileTextEl() {
  return document.getElementById('file-input-text');
}

function renderPreviews(skipHashCheck = false) {
  if (!skipHashCheck && expectedEditHash) {
    const hash = (window.location.hash || '').replace(/^#?/, '#');
    if (hash !== expectedEditHash) return;
  }
  const container = getPreviewContainer();
  if (!container || !document.body.contains(container)) return;
  const existingHtml = (existingUrls || []).map(
    (item, i) => {
      const src = (safeImageUrl(item.fileUrl, '') || '').replace(/"/g, '&quot;');
      return `<div class="post-image-preview-item" data-type="existing" data-index="${i}" data-image-id="${item.imageId}">
        <img src="${src}" alt="이미지" />
        <button type="button" class="post-image-remove" aria-label="제거">×</button>
      </div>`;
    }
  );
  const newHtml = (newImages || []).map(
    (item, i) =>
      `<div class="post-image-preview-item" data-type="new" data-index="${i}">
        <img src="${item.objectUrl}" alt="새 이미지" />
        <button type="button" class="post-image-remove" aria-label="제거">×</button>
      </div>`
  );
  container.innerHTML = [...existingHtml, ...newHtml].join('');
  container.classList.toggle('has-images', existingUrls.length + newImages.length > 0);
  const ft = getFileTextEl();
  if (ft) ft.textContent = existingUrls.length + newImages.length > 0 ? `총 ${existingUrls.length + newImages.length}장` : '';
}

export async function renderEditPost(param) {
  const postId = resolvePostId(param, { requireEdit: true });
  const root = document.getElementById('app-root');

  root.innerHTML = `
    ${renderHeader({
      showBackButton: true,
      backButtonHref: postId ? `/posts/${postId}` : '/posts',
      backButtonOnClick: postId ? () => { sessionStorage.setItem('post_detail_skip_view', String(postId)); navigateTo(`/posts/${postId}`); } : undefined,
    })}
    <main class="main">
      <div class="post-list-container post-new-container">
        <div class="form-container">
          <h2 class="form-title">게시글 수정</h2>
          <form id="edit-post-form" class="form new-post-form" novalidate>
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
              <span class="form-label">이미지 추가 (최대 ${MAX_IMAGES}장)</span>
              <div class="file-input-wrapper">
                <input type="file" id="edit-file-input" accept="image/jpeg,image/png" multiple class="file-input-hidden" aria-hidden="true" />
                <button type="button" class="file-input-button" id="edit-file-trigger">파일 선택</button>
                <span class="file-input-text" id="file-input-text"></span>
              </div>
            </div>
            <span class="helper-text form-error-common" id="form-error"></span>
            <button type="button" class="btn btn-primary" id="edit-submit-btn" disabled>수정하기</button>
          </form>
        </div>
      </div>
    </main>
  `;

  initHeaderEvents({
    backButtonHref: postId ? `/posts/${postId}` : '/posts',
    backButtonOnClick: postId ? () => { sessionStorage.setItem('post_detail_skip_view', String(postId)); navigateTo(`/posts/${postId}`); } : undefined,
  });
  initAutoResizeTextarea('content');

  if (!postId) {
    showFieldError('form-error', '유효하지 않은 게시글입니다.');
    navigateTo('/posts');
    return;
  }

  expectedEditHash = `#/posts/${postId}/edit`;
  existingIds = [];
  existingUrls = [];
  newImages = [];

  const form = document.getElementById('edit-post-form');
  const fileInput = document.getElementById('edit-file-input');
  const trigger = document.getElementById('edit-file-trigger');
  const previewContainer = getPreviewContainer();
  const submitBtn = document.getElementById('edit-submit-btn');

  try {
    const res = await api.get(`/posts/${postId}`);
    const data = res?.data ?? res;
    document.getElementById('title').value = data.title ?? '';
    const contentEl = document.getElementById('content');
    contentEl.value = data.content ?? '';
    autoResizeTextarea(contentEl);
    const files = data.files || (data.file ? [data.file] : []);
    existingIds = files.map((f) => f.imageId).filter((id) => id != null);
    existingUrls = files.filter((f) => f.imageId != null).map((f) => ({ imageId: f.imageId, fileUrl: f.fileUrl || f.url || '' }));
    renderPreviews(true);
    if (submitBtn) submitBtn.disabled = false;
  } catch (err) {
    showFieldError('form-error', getApiErrorMessage(err?.code ?? err?.message, '게시글을 불러오지 못했습니다.'));
    if (submitBtn) submitBtn.disabled = false;
  }

  submitBtn?.addEventListener('click', () => onSubmit(postId));
  form?.addEventListener('submit', (e) => { e.preventDefault(); onSubmit(postId); });

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
      const left = MAX_IMAGES - existingUrls.length - newImages.length;
      const toAdd = files.slice(0, Math.max(0, left));
      for (const file of toAdd) {
        if (existingUrls.length + newImages.length >= MAX_IMAGES) break;
        const objectUrl = URL.createObjectURL(file);
        const entry = { file, objectUrl, imageId: null };
        newImages.push(entry);
        renderPreviews();
        try {
          const fd = new FormData();
          fd.append('image', file);
          const res = await api.postFormData('/media/images?purpose=post', fd);
          if ((window.location.hash || '').replace(/^#?/, '#') !== expectedEditHash) return;
          entry.imageId = res?.data?.imageId ?? res?.imageId ?? null;
        } catch (err) {
          if ((window.location.hash || '').replace(/^#?/, '#') === expectedEditHash) {
            URL.revokeObjectURL(objectUrl);
            newImages = newImages.filter((x) => x !== entry);
            renderPreviews();
            showFieldError('form-error', getApiErrorMessage(err?.code ?? err?.message, '이미지 업로드에 실패했습니다.'));
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
      const type = item.dataset.type;
      const i = parseInt(item.dataset.index, 10);
      if (type === 'existing') {
        const imageId = item.dataset.imageId;
        existingIds = existingIds.filter((id) => String(id) !== String(imageId));
        existingUrls = existingUrls.filter((_, idx) => idx !== i);
      } else {
        const entry = newImages[i];
        if (entry?.imageId != null) {
          try { await api.delete(`/media/images/${entry.imageId}`); } catch (_) {}
        }
        if (entry?.objectUrl) URL.revokeObjectURL(entry.objectUrl);
        newImages = newImages.filter((_, idx) => idx !== i);
      }
      renderPreviews();
    });
  }
}

async function onSubmit(postId) {
  if (editSubmitting || !postId) return;
  clearErrors();

  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
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

  const newIds = newImages.map((x) => x.imageId).filter((id) => id != null);
  const imageIds = [...existingIds, ...newIds].slice(0, MAX_IMAGES).map(Number);
  const submitBtn = document.getElementById('edit-submit-btn');
  const orig = submitBtn?.textContent ?? '수정하기';
  editSubmitting = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '수정 중...';
  }

  try {
    await api.patch(`/posts/${postId}`, { title, content, imageIds });
    alert('게시글이 수정되었습니다!');
    sessionStorage.setItem('post_detail_skip_view', String(postId));
    navigateTo(`/posts/${postId}`);
  } catch (err) {
    showFieldError('form-error', getApiErrorMessage(err?.code ?? err?.message, '게시글 수정에 실패했습니다.'));
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = orig;
    }
  } finally {
    editSubmitting = false;
  }
}
