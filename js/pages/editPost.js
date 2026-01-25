/**
 * 게시글 수정 페이지
 */

import { api } from '../api.js';
import { navigateTo } from '../router.js';

/**
 * 게시글 수정 페이지 렌더링
 * @param {Object} params - 라우트 파라미터 { id: '123' }
 */
export async function renderEditPost(params) {
  const root = document.getElementById('app-root');
  const postId = params.id;
  
  if (!postId) {
    alert('잘못된 게시글 ID입니다.');
    navigateTo('/posts');
    return;
  }
  
  root.innerHTML = `
    <header class="header">
      <a href="#/posts/${postId}" class="btn-back">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </a>
      <h1 class="header-title">
        <span id="header-title-link">아무 말 대잔치</span>
      </h1>
      <div class="header-divider"></div>
    </header>
    
    <main class="main">
      <div class="form-container">
        <h2 class="form-title">게시글 수정</h2>
        
        <div class="loading">
          <div class="spinner"></div>
        </div>
      </div>
    </main>
  `;
  
  // 게시글 정보 로드
  await loadPostForEdit(postId);
}

/**
 * 수정할 게시글 정보 로드
 */
async function loadPostForEdit(postId) {
  const container = document.querySelector('.form-container');
  
  try {
    // 게시글 상세 API 호출
    const post = await api.get(`/posts/${postId}`);
    
    container.innerHTML = `
      <h2 class="form-title">게시글 수정</h2>
      
      <form id="form" class="form">
        <!-- 제목 -->
        <div class="form-group">
          <label for="title" class="form-label">제목*</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            class="form-input" 
            placeholder="제목을 입력하세요"
            value="${post.title || ''}"
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
            class="form-input" 
            rows="10"
            placeholder="내용을 입력하세요"
            required
          >${post.content || ''}</textarea>
          <span class="helper-text" id="content-error">*helper text</span>
        </div>
        
        <button type="submit" class="btn btn-primary">수정하기</button>
      </form>
    `;
    
    // 이벤트 리스너 등록
    attachEditPostEvents(postId);
    
  } catch (error) {
    console.error('게시글 로드 실패:', error);
    container.innerHTML = `
      <p style="text-align: center; color: #ff0000; padding: 40px;">
        게시글을 불러오는 중 오류가 발생했습니다.
      </p>
      <button 
        onclick="window.location.hash='/posts'" 
        style="display: block; margin: 0 auto; padding: 12px 24px; background-color: #aca0eb; color: white; border: none; border-radius: 6px; cursor: pointer;"
      >
        목록으로 돌아가기
      </button>
    `;
  }
}

/**
 * 게시글 수정 페이지 이벤트 리스너 등록
 */
function attachEditPostEvents(postId) {
  const form = document.getElementById('form');
  form.addEventListener('submit', (e) => handleEditPost(e, postId));
  
  // 헤더 제목 클릭 → 게시글 목록으로 이동
  const headerTitle = document.getElementById('header-title-link');
  if (headerTitle) {
    headerTitle.addEventListener('click', () => {
      navigateTo('/posts');
    });
  }
}

/**
 * 게시글 수정 처리
 */
async function handleEditPost(e, postId) {
  e.preventDefault();
  
  clearErrors();
  
  const form = e.target;
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  
  let hasError = false;
  
  if (!title) {
    showFieldError('title-error', '제목을 입력해주세요.');
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
    
    // 게시글 수정 API 호출
    await api.put(`/posts/${postId}`, {
      title,
      content
    });
    
    alert('게시글이 수정되었습니다!');
    
    // 게시글 상세 페이지로 이동
    navigateTo(`/posts/${postId}`);
    
  } catch (error) {
    const errorMessage = error.message || '게시글 수정에 실패했습니다.';
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
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}
