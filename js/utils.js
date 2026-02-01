/**
 * 공통 유틸리티 함수
 */

/**
 * HTML 이스케이프 처리 (XSS 방지)
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
export function escapeHtml(text) {
  if (!text) return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 날짜 포맷팅 (상대 시간 표시)
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 포맷된 날짜
 */
export function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  // 1분 미만
  if (diff < 60000) {
    return '방금 전';
  }
  // 1시간 미만
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}분 전`;
  }
  // 24시간 미만
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}시간 전`;
  }
  // 7일 미만
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}일 전`;
  }

  // 그 외 - YYYY.MM.DD 형식
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 파일을 Base64로 변환
 * @param {File} file - 변환할 파일
 * @returns {Promise<string>} Base64 문자열
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 필드별 에러 메시지 표시
 * @param {string} elementId - 에러 메시지를 표시할 요소 ID
 * @param {string} message - 에러 메시지
 */
export function showFieldError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = `* ${message}`;
    errorElement.style.visibility = 'visible';
  }
}

/**
 * textarea auto-grow - 글 쓸수록 내용 칸이 아래로 계속 늘어남
 * 커서가 화면 하단에서 ~100px 위쯤 되면 페이지 스크롤이 따라 내려감
 */
export function autoResizeTextarea(textarea, minHeight = 260) {
  if (!textarea) return;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const scrollTop = textarea.scrollTop;
  textarea.style.setProperty('overflow', 'hidden');
  textarea.style.setProperty('min-height', '0');
  textarea.style.setProperty('height', '1px');
  void textarea.offsetHeight; // reflow
  const h = Math.max(minHeight, textarea.scrollHeight);
  textarea.style.setProperty('min-height', minHeight + 'px');
  textarea.style.setProperty('height', h + 'px', 'important');
  textarea.style.removeProperty('overflow');
  textarea.scrollTop = scrollTop;
  const rect = textarea.getBoundingClientRect();
  const margin = 100; // 화면 하단에서 이 정도 위면 스크롤 따라감
  if (rect.bottom > window.innerHeight - margin) {
    window.scrollTo(scrollX, scrollY + (rect.bottom - (window.innerHeight - margin)));
  } else {
    window.scrollTo(scrollX, scrollY);
  }
}

/**
 * 게시글 작성/수정 textarea에 auto-grow 적용
 * @param {string} selector - textarea 선택자 (예: '#content')
 */
export function initAutoResizeTextarea(selector = '#content') {
  const el = document.getElementById(String(selector).replace(/^#/, '')) ?? document.querySelector(selector);
  if (!el) return;
  const resize = () => autoResizeTextarea(el);
  el.addEventListener('input', resize);
  el.addEventListener('keyup', resize);
}

/**
 * 해시 또는 라우터 인자에서 postId 추출
 * @param {string|number|object} param - 라우터 params 또는 해시 파싱 대상
 * @param {{ requireEdit?: boolean }} options - requireEdit: true면 #/posts/1/edit 형태에서만 추출
 */
export function resolvePostId(param, options = {}) {
  if (typeof param === 'string' || typeof param === 'number') return String(param);
  if (param && typeof param === 'object') {
    const id = param.id ?? param.postId ?? null;
    return id ? String(id) : null;
  }
  const hash = (window.location.hash || '').slice(1);
  const parts = hash.split('/');
  if (options.requireEdit) {
    return parts[1] === 'posts' && parts[2] && parts[3] === 'edit' ? parts[2] : null;
  }
  return parts[1] === 'posts' && parts[2] ? parts[2] : null;
}

/**
 * 모든 에러 메시지 초기화
 */
export function clearErrors() {
  const errorElements = document.querySelectorAll('.helper-text');
  errorElements.forEach((el) => {
    el.textContent = '*helper text';
    el.style.visibility = 'hidden'; /* 공간은 유지하면서 숨김 */
  });
}
