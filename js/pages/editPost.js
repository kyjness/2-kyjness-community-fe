/**
 * 게시글 수정 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';
import { renderHeader, initHeaderEvents } from '../components/header.js';
import { showFieldError, clearErrors, fileToBase64 } from '../utils.js';
import { DEV_MODE } from '../constants.js';

/** 목록/상세 예시 게시글과 동일한 ID용 폼 기본값 (API 실패 시 수정 폼 채우기) */
const DUMMY_EDIT = {
  '1': { title: '첫 번째 예시 게시글', content: '첫 번째 예시 게시글의 본문 내용입니다. 목록에서 이 카드를 눌렀을 때 보이는 상세 페이지입니다.', file: null },
  '2': { title: '두 번째 예시 게시글', content: '두 번째 예시 게시글의 본문입니다. 이 역시 목록의 예시 카드를 눌렀을 때 보이는 상세입니다.', file: null },
};

/**
 * 게시글 수정 페이지 렌더링
 * router에서 postId를 인자로 넘겨준다고 가정 + 해시에서 파싱
 */
function resolvePostId(param) {
  if (typeof param === 'string' || typeof param === 'number') return String(param);
  if (param && typeof param === 'object') {
    const id = param.id ?? param.postId ?? null;
    return id ? String(id) : null;
  }
  const hash = (window.location.hash || '').slice(1);
  const parts = hash.split('/');
  if (parts[1] === 'posts' && parts[2] && parts[3] === 'edit') return parts[2];
  return null;
}

export async function renderEditPost(param) {
  const root = document.getElementById('app-root');
  const postId = resolvePostId(param);

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

  // 기존 게시글 데이터 채우기
  if (postId) {
    await fillEditPostForm(postId);
  } else {
    alert('유효하지 않은 게시글입니다.');
    navigateTo('/posts');
  }
}

/**
 * 기존 게시글 데이터 불러와서 폼에 채우기 (API 실패 시 예시 id면 더미로 채움)
 */
async function fillEditPostForm(postId) {
  const id = String(postId);
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const fileText = document.getElementById('file-input-text');

  function applyToForm(postData) {
    if (titleInput) titleInput.value = postData.title ?? '';
    if (contentInput) contentInput.value = postData.content ?? '';
    if (fileText) {
      const fileName = postData.file?.fileName ?? postData.file?.name ?? postData.fileName ?? null;
      const fileUrl = postData.file?.fileUrl ?? postData.file?.url ?? postData.image_url ?? null;
      if (fileName) {
        fileText.textContent = fileName;
      } else if (fileUrl) {
        const urlParts = String(fileUrl).split('/');
        const extractedName = urlParts[urlParts.length - 1];
        fileText.textContent = extractedName && extractedName !== 'null' && extractedName !== 'undefined' ? extractedName : '';
      } else {
        fileText.textContent = '';
      }
    }
  }

  try {
    const response = await api.get(`/posts/${id}`);
    const postData = response.data || response;
    applyToForm(postData);
  } catch (error) {
    console.error('게시글 정보를 불러올 수 없습니다:', error);
    if (DEV_MODE && DUMMY_EDIT[id]) {
      applyToForm(DUMMY_EDIT[id]);
    } else {
      alert(error.message || '게시글 정보를 불러올 수 없습니다.');
    }
  }
}

/**
 * 게시글 수정 페이지 이벤트 리스너 등록
 */
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
      const file = e.target.files[0];
      if (file) {
        fileText.textContent = file.name;
      } else {
        // 파일 선택 취소 시 기존 파일명이 있으면 유지, 없으면 빈 문자열
        fileText.textContent = '';
      }
    });
  }
}

/**
 * 게시글 수정 처리
 */
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
    submitBtn.textContent = '수정 중...';
    submitBtn.disabled = true;

    // 기본 데이터
    const postData = {
      title,
      content,
    };

    // 이미지 변경이 있을 때만 추가 (백엔드 규칙에 맞춰서 수정 가능)
    if (imageFile) {
      postData.image = await fileToBase64(imageFile);
    }

    // 게시글 수정 API 호출 (PUT 기준, 필요하면 PATCH로 변경)
    await api.put(`/posts/${postId}`, postData);

    alert('게시글이 수정되었습니다!');

    navigateTo(`/posts/${postId}`);
  } catch (error) {
    const errorMessage = error.message || '게시글 수정에 실패했습니다.';
    alert(errorMessage);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}
