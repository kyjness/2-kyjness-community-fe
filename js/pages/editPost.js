// 게시글 수정 페이지
/** 수정 폼 로드 시 채워지는 기존 이미지 ID 목록. 제출 시 새 이미지와 합쳐서 전송 */
let existingPostImageIds = [];
/** 기존 이미지 URL 목록 (미리보기 + X로 제거 시 사용) */
let existingPostImageUrls = [];
/** 새로 선택한 파일 목록 (미리보기용 objectUrl + 선택 시 업로드된 imageId, 제거 시 DELETE /media/images 호출) */
let newPreviewFiles = [];
/** 수정 제출 중복 방지 (한 번만 요청 가도록) */
let isSubmittingEdit = false;

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, initAutoResizeTextarea, autoResizeTextarea, resolvePostId, getApiErrorMessage, safeImageUrl, validatePostTitle, validatePostContent } from '../utils.js';

export async function renderEditPost(param) {
  const root = document.getElementById('app-root');
  const postId = resolvePostId(param, { requireEdit: true });

  root.innerHTML = `
    ${renderHeader({
      showBackButton: true,
      backButtonHref: postId ? `/posts/${postId}` : '/posts',
    })}
    
    <main class="main">
      <!-- newPost랑 동일한 폭 사용 -->
      <div class="post-list-container post-new-container">
        <div class="form-container">
          <h2 class="form-title">게시글 수정</h2>
          
          <form id="edit-post-form" class="form new-post-form" novalidate>
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
              <label for="image" class="form-label">이미지 추가 (최대 5장)</label>

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

  // 이벤트 리스너 등록 (수정 화면 뒤로가기 시 조회수 미증가를 위해 플래그 설정)
  initHeaderEvents({
    backButtonHref: postId ? `/posts/${postId}` : '/posts',
    backButtonOnClick: postId
      ? () => {
          sessionStorage.setItem('post_detail_skip_view', String(postId));
          navigateTo(`/posts/${postId}`);
        }
      : undefined,
  });
  attachEditPostEvents(postId);
  initAutoResizeTextarea('content');

  // 기존 게시글 데이터 채우기
  if (postId) {
    await fillEditPostForm(postId);
  } else {
    showFieldError('form-error', '유효하지 않은 게시글입니다.');
    navigateTo('/posts');
  }
}

// 기존 게시글 데이터 API로 불러와서 폼에 채움
async function fillEditPostForm(postId) {
  const id = String(postId);
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const fileText = document.getElementById('file-input-text');

  function applyToForm(postData) {
    if (titleInput) titleInput.value = postData.title ?? '';
    if (contentInput) {
      contentInput.value = postData.content ?? '';
      autoResizeTextarea(contentInput);
    }
    const files = postData.files || (postData.file ? [postData.file] : []);
    existingPostImageIds = files.map((f) => f.imageId).filter((id) => id != null);
    existingPostImageUrls = files
      .filter((f) => f.imageId != null)
      .map((f) => ({ imageId: f.imageId, fileUrl: f.fileUrl || f.url || '' }));
    newPreviewFiles = [];
    if (fileText) {
      fileText.textContent = files.length > 0 ? `총 ${files.length}장` : '';
    }
    renderImagePreviews();
    const submitBtn = document.getElementById('edit-submit-btn');
    if (submitBtn) submitBtn.disabled = false;
  }

  try {
    const response = await api.get(`/posts/${id}`);
    const postData = response.data || response;
    applyToForm(postData);
  } catch (error) {
    showFieldError('form-error', getApiErrorMessage(error?.code || error?.message, '게시글을 불러오지 못했습니다. 삭제되었거나 주소가 잘못되었을 수 있습니다.'));
    const submitBtn = document.getElementById('edit-submit-btn');
    if (submitBtn) submitBtn.disabled = false;
  }
}

// 내용 영역 이미지 미리보기 렌더 (기존 + 새로 선택한 파일, 각각 오른쪽 위 X로 제거 가능)
function renderImagePreviews() {
  const container = document.getElementById('post-image-preview');
  if (!container) return;
  const maxTotal = 5;
  const existing = (existingPostImageUrls || []).map(
    (item, i) => {
      const src = safeImageUrl(item.fileUrl, '') || '';
      return `<div class="post-image-preview-item" data-type="existing" data-index="${i}" data-image-id="${String(item.imageId)}">
        <img src="${src.replace(/"/g, '&quot;')}" alt="첨부 이미지" />
        <button type="button" class="post-image-remove" aria-label="이미지 제거">×</button>
      </div>`;
    }
  );
  const news = (newPreviewFiles || []).map(
    (item, i) =>
      `<div class="post-image-preview-item" data-type="new" data-index="${i}" data-image-id="${item.imageId != null ? String(item.imageId) : ''}">
        <img src="${item.objectUrl}" alt="새 이미지" />
        <button type="button" class="post-image-remove" aria-label="이미지 제거">×</button>
      </div>`
  );
  container.innerHTML = [...existing, ...news].join('');
  container.classList.toggle('has-images', existing.length + news.length > 0);
}

// 게시글 수정 페이지 이벤트 리스너
function attachEditPostEvents(postId) {
  const form = document.getElementById('edit-post-form');
  const submitBtn = document.getElementById('edit-submit-btn');
  if (form && submitBtn) {
    submitBtn.addEventListener('click', () => handleEditPost(postId));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleEditPost(postId);
    });
  }

  const imageInput = document.getElementById('image');
  const fileText = document.getElementById('file-input-text');
  const previewContainer = document.getElementById('post-image-preview');
  const fileInputBtn = form?.querySelector('.file-input-button');
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
      const type = item.dataset.type;
      const index = parseInt(item.dataset.index, 10);
      if (type === 'existing') {
        const imageId = item.dataset.imageId;
        existingPostImageIds = existingPostImageIds.filter((id) => String(id) !== String(imageId));
        existingPostImageUrls = existingPostImageUrls.filter((_, i) => i !== index);
      } else if (type === 'new') {
        const entry = newPreviewFiles[index];
        if (entry?.imageId != null) {
          try {
            await api.delete(`/media/images/${entry.imageId}`);
          } catch (_) {}
        }
        if (entry?.objectUrl) URL.revokeObjectURL(entry.objectUrl);
        newPreviewFiles = newPreviewFiles.filter((_, i) => i !== index);
      }
      renderImagePreviews();
      if (fileText) {
        const total = (existingPostImageUrls?.length || 0) + (newPreviewFiles?.length || 0);
        fileText.textContent = total > 0 ? `총 ${total}장` : '';
      }
    });
  }

  if (imageInput && fileText) {
    imageInput.addEventListener('change', async (e) => {
      const added = Array.from(e.target.files || []);
      const allowed = maxTotal - (existingPostImageUrls?.length || 0) - (newPreviewFiles?.length || 0);
      const toAdd = added.slice(0, Math.max(0, allowed));
      for (const file of toAdd) {
        const objectUrl = URL.createObjectURL(file);
        try {
          const formData = new FormData();
          formData.append('image', file);
          const uploadRes = await api.postFormData('/media/images?type=post', formData);
          const imageId = uploadRes?.data?.imageId ?? uploadRes?.imageId ?? null;
          newPreviewFiles = [...newPreviewFiles, { file, objectUrl, imageId }];
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          showFieldError('form-error', getApiErrorMessage(err?.code ?? err?.message, '이미지 업로드에 실패했습니다.'));
          break;
        }
      }
      imageInput.value = '';
      renderImagePreviews();
      const total = (existingPostImageUrls?.length || 0) + (newPreviewFiles?.length || 0);
      fileText.textContent = total > 0 ? `총 ${total}장` : '파일 선택';
    });
  }
}

// 게시글 수정 처리
async function handleEditPost(postId) {
  if (isSubmittingEdit) return;

  const submitBtn = document.getElementById('edit-submit-btn');
  const originalText = submitBtn?.textContent ?? '수정하기';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '수정 중...';
  }
  isSubmittingEdit = true;

  if (!postId) {
    showFieldError('form-error', '유효하지 않은 게시글입니다.');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
    isSubmittingEdit = false;
    return;
  }

  clearErrors();

  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();

  const titleCheck = validatePostTitle(title);
  if (!titleCheck.ok) {
    showFieldError('title-error', titleCheck.message);
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
    isSubmittingEdit = false;
    return;
  }
  const contentCheck = validatePostContent(content);
  if (!contentCheck.ok) {
    showFieldError('content-error', contentCheck.message);
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
    isSubmittingEdit = false;
    return;
  }

  try {
    const newImageIds = (newPreviewFiles || []).map((item) => item.imageId).filter((id) => id != null);
    const imageIds = [...existingPostImageIds, ...newImageIds].slice(0, 5).map((id) => Number(id));
    const payload = { title, content, imageIds };

    await api.patch(`/posts/${postId}`, payload);

    alert('게시글이 수정되었습니다!');

    sessionStorage.setItem('post_detail_skip_view', String(postId));
    navigateTo(`/posts/${postId}`);
  } catch (error) {
    const msg = getApiErrorMessage(error?.code || error?.message, '게시글 수정에 실패했습니다. 제목·내용·이미지를 확인한 뒤 다시 시도해주세요.');
    showFieldError('form-error', msg);
  } finally {
    if (submitBtn) {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
    isSubmittingEdit = false;
  }
}
