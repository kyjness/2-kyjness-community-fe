// 공통 유틸리티 함수

// HTML 이스케이프 (XSS 방지)
export function escapeHtml(text) {
  if (!text) return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// HTML 속성값 이스케이프 (XSS/속성 탈출 방지)
export function escapeAttr(value) {
  if (value == null) return '';
  const s = String(value);
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 날짜 포맷팅 (상대 시간)
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

// 필드별 에러 메시지 표시 (elementId, message)
export function showFieldError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message ? `* ${message}` : '';
    errorElement.classList.add('has-error');
    errorElement.style.visibility = 'visible';
  }
}

// API 에러 코드 → 한글 메시지 (code, fallback)
export function getApiErrorMessage(code, fallback = '처리에 실패했습니다.') {
  const messages = {
    // 입력 검증
    INVALID_PASSWORD_FORMAT:
      '비밀번호는 8~20자, 영문 대/소문자, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.',
    INVALID_NICKNAME_FORMAT: '닉네임은 한글, 영문, 숫자 1~10자로 입력해주세요.',
    INVALID_EMAIL_FORMAT: '이메일 형식이 올바르지 않습니다.',
    INVALID_PROFILEIMAGEURL: '프로필 이미지 형식이 올바르지 않습니다.',
    INVALID_FILE_URL: '파일 URL 형식이 올바르지 않습니다.',
    INVALID_REQUEST: '입력값을 확인해주세요.',
    INVALID_REQUEST_BODY: '입력값을 확인해주세요.',
    INVALID_POSTID_FORMAT: '게시글 ID 형식이 올바르지 않습니다.',
    MISSING_REQUIRED_FIELD: '필수 입력 항목을 입력해주세요.',
    // 인증
    UNAUTHORIZED: '로그인이 필요합니다.',
    INVALID_CREDENTIALS: '이메일 또는 비밀번호가 일치하지 않습니다.',
    FORBIDDEN: '권한이 없습니다.',
    // 중복
    EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
    NICKNAME_ALREADY_EXISTS: '이미 사용 중인 닉네임입니다.',
    CONFLICT: '이미 사용 중입니다.',
    // 리소스 없음
    NOT_FOUND: '찾을 수 없습니다.',
    USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
    POST_NOT_FOUND: '게시글을 찾을 수 없습니다.',
    COMMENT_NOT_FOUND: '댓글을 찾을 수 없습니다.',
    LIKE_NOT_FOUND: '좋아요를 찾을 수 없습니다.',
    ALREADY_LIKED: '이미 좋아요를 누르셨습니다.',
    // 파일
    INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
    INVALID_IMAGE_FILE: '유효하지 않은 이미지 파일입니다.',
    FILE_SIZE_EXCEEDED: '파일 크기가 너무 큽니다.',
    // 서버
    CONSTRAINT_ERROR: '데이터 제약 조건을 위반했습니다.',
    DB_ERROR: '데이터베이스 오류가 발생했습니다.',
    INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다.',
    METHOD_NOT_ALLOWED: '허용되지 않은 요청 방식입니다.',
    UNPROCESSABLE_ENTITY: '요청을 처리할 수 없습니다.',
    RATE_LIMIT_EXCEEDED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    LOGIN_RATE_LIMIT_EXCEEDED: '로그인 시도 횟수가 제한되었습니다. 1분 후 다시 시도해주세요.',
    POST_FILE_LIMIT_EXCEEDED: '이미지는 게시글당 최대 5장까지 첨부할 수 있습니다.',
  };
  return messages[code] || fallback;
}

// 안전한 이미지 URL만 허용 (XSS 방지)
export function safeImageUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') return fallback;
  const t = url.trim();
  if (t.startsWith('https://') || t.startsWith('http://') || t.startsWith('./') || t.startsWith('/')) {
    return t;
  }
  return fallback;
}

// 이메일 형식 검증
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// 게시글 제목 검증 (필수, 최대 26자)
export function validatePostTitle(title) {
  const t = (title ?? '').trim();
  if (!t) return { ok: false, message: '제목을 입력해주세요.' };
  if (t.length > 26) return { ok: false, message: '제목은 26자 이하여야 합니다.' };
  return { ok: true };
}

// 게시글 내용 검증 (필수)
export function validatePostContent(content) {
  if (!(content ?? '').trim()) return { ok: false, message: '내용을 입력해주세요.' };
  return { ok: true };
}

// 비밀번호 형식 검증 (8~20자, 영대/소/숫자/특수문자 각 1자 이상)
export function validatePassword(value) {
  if (!value || typeof value !== 'string') return { ok: false, message: '비밀번호를 입력해주세요.' };
  const v = value.trim();
  if (v.length < 8 || v.length > 20) return { ok: false, message: getApiErrorMessage('INVALID_PASSWORD_FORMAT') };
  if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(v)) {
    return { ok: false, message: getApiErrorMessage('INVALID_PASSWORD_FORMAT') };
  }
  return { ok: true };
}

// 닉네임 검증 (한글/영문/숫자 1~10자)
export function validateNickname(value) {
  if (!value || typeof value !== 'string') return { ok: false, message: '닉네임을 입력해주세요.' };
  if (!/^[가-힣a-zA-Z0-9]{1,10}$/.test(value.trim())) return { ok: false, message: getApiErrorMessage('INVALID_NICKNAME_FORMAT') };
  return { ok: true };
}

// textarea auto-grow (글 쓸수록 늘어남, 스크롤 따라감)
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

// textarea auto-grow 적용 (selector 기본 '#content')
export function initAutoResizeTextarea(selector = '#content') {
  const el = document.getElementById(String(selector).replace(/^#/, '')) ?? document.querySelector(selector);
  if (!el) return;
  const resize = () => autoResizeTextarea(el);
  el.addEventListener('input', resize);
  el.addEventListener('keyup', resize);
}

// 해시/라우터 인자에서 postId 추출 (options.requireEdit)
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

// 모든 에러 메시지 초기화
export function clearErrors() {
  const errorElements = document.querySelectorAll('.helper-text');
  errorElements.forEach((el) => {
    el.textContent = '';
    el.classList.remove('has-error');
    el.style.visibility = 'hidden';
  });
}

// 모달 열기 (공통)
export function openModal(modal) {
  if (!modal) return;
  modal.classList.add('visible');
}

// 모달 닫기 (공통)
export function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('visible');
}
