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
    errorElement.style.display = 'block';
  }
}

/**
 * 모든 에러 메시지 초기화
 */
export function clearErrors() {
  const errorElements = document.querySelectorAll('.helper-text');
  errorElements.forEach((el) => {
    el.textContent = '*helper text';
    el.style.display = 'none';
  });
}
