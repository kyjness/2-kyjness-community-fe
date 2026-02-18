// 게시글 수정 페이지
/** 수정 폼 로드 시 채워지는 기존 이미지 ID 목록. 제출 시 새 이미지와 합쳐서 전송 */
let existingPostImageIds = [];

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, autoResizeTextarea, initAutoResizeTextarea, resolvePostId, getApiErrorMessage } from '../utils.js';

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
          
          <form id="edit-post-form" class="form new-post-form">
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
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  class="file-input-hidden"
                />

                <label for="image" class="file-input-button">
                  파일 선택
                </label>

                <span class="file-input-text" id="file-input-text"></span>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary">수정하기</button>
          </form>
        </div>
      </div>
    </main>
  `;

  // 이벤트 리스너 등록
  initHeaderEvents({
    backButtonHref: postId ? `/posts/${postId}` : '/posts',
  });
  attachEditPostEvents(postId);
  initAutoResizeTextarea('content');

  // 기존 게시글 데이터 채우기
  if (postId) {
    await fillEditPostForm(postId);
  } else {
    alert('유효하지 않은 게시글입니다.');
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
    if (fileText) {
      fileText.textContent = files.length > 0 ? `기존 ${files.length}장` : '';
    }
  }

  try {
    const response = await api.get(`/posts/${id}`);
    const postData = response.data || response;
    applyToForm(postData);
  } catch (error) {
    console.error('게시글 정보를 불러올 수 없습니다:', error);
    alert(getApiErrorMessage(error?.code || error?.message, '게시글 정보를 불러올 수 없습니다.'));
  }
}

// 게시글 수정 페이지 이벤트 리스너
function attachEditPostEvents(postId) {
  const form = document.getElementById('edit-post-form');
  if (form) {
    form.addEventListener('submit', (e) => handleEditPost(e, postId));
  }

  // 파일 선택 시 오른쪽 텍스트 변경
  const imageInput = document.getElementById('image');
  const fileText = document.getElementById('file-input-text');
  if (imageInput && fileText) {
    imageInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []).slice(0, 5);
      fileText.textContent = files.length > 0 ? `${files.length}개 추가` : '';
    });
  }
}

// 게시글 수정 처리
async function handleEditPost(e, postId) {
  e.preventDefault();
  if (!postId) {
    alert('유효하지 않은 게시글입니다.');
    return;
  }

  clearErrors();

  const form = e.target;
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const imageInput = document.getElementById('image');
  const imageFiles = Array.from(imageInput?.files || []).slice(0, 5);

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
    submitBtn.textContent = '수정 중...';
    submitBtn.disabled = true;

    const newImageIds = [];
    for (const file of imageFiles.slice(0, 5)) {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.postFormData('/media/images?type=post', formData);
      const id = uploadRes?.data?.imageId ?? uploadRes?.imageId;
      if (id != null) newImageIds.push(id);
    }
    // 기존 이미지 + 새 이미지 (아래에 추가), 최대 5장
    const imageIds = [...existingPostImageIds, ...newImageIds].slice(0, 5);
    const payload = { title, content };
    if (imageIds.length > 0) payload.imageIds = imageIds;

    await api.patch(`/posts/${postId}`, payload);

    alert('게시글이 수정되었습니다!');

    navigateTo(`/posts/${postId}`);
  } catch (error) {
    const msg = getApiErrorMessage(error?.code || error?.message, '게시글 수정에 실패했습니다.');
    alert(msg);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
