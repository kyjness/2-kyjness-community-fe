// 공통 유틸: XSS 방지, 날짜·이미지 URL, API 에러 메시지, 검증(이메일·비밀번호·닉네임 등).
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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

function parseApiDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;
  const s = dateString.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !/[Z+-]\d{2}:?\d{2}$/.test(s)) {
    return new Date(s + (s.endsWith('Z') ? '' : 'Z'));
  }
  return new Date(s);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = parseApiDate(dateString);
  if (!date || Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

/** ISO 날짜 문자열 → YYYY-MM-DD HH:mm (초 없음) */
export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = parseApiDate(dateString);
  if (!date || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

const API_ERROR_MESSAGES = {
  INVALID_PASSWORD_FORMAT:
    '8~20자의 영문 소문자·숫자·특수문자 필수 포함해야 합니다.',
  INVALID_NICKNAME_FORMAT: '닉네임은 한글, 영문, 숫자 1~10자로 입력해주세요.',
  INVALID_EMAIL_FORMAT: '이메일 형식이 올바르지 않습니다.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 일치하지 않습니다.',
  INVALID_REQUEST_BODY: '입력값을 확인해주세요.',
  UNPROCESSABLE_ENTITY: '요청을 처리할 수 없습니다.',
  POST_NOT_FOUND: '게시글을 찾을 수 없습니다.',
  EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
  NICKNAME_ALREADY_EXISTS: '이미 사용 중인 닉네임입니다.',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
  FILE_SIZE_EXCEEDED: '파일 크기가 너무 큽니다.',
  SIGNUP_IMAGE_TOKEN_INVALID:
    '프로필 이미지 토큰이 만료되었거나 유효하지 않습니다. 사진을 다시 선택한 뒤 회원가입을 시도해주세요.',
  SIGNUP_IMAGE_TOKEN_ALREADY_USED: '이미 사용된 프로필 이미지입니다. 사진을 다시 선택해주세요.',
  RATE_LIMIT_EXCEEDED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  LOGIN_RATE_LIMIT_EXCEEDED: '로그인 시도 횟수가 제한되었습니다. 1분 후 다시 시도해주세요.',
  UNAUTHORIZED: '로그인이 필요합니다. 다시 로그인해주세요.',
  TOKEN_EXPIRED: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
  INVALID_REQUEST: '요청 내용을 확인해주세요.',
  USER_WITHDRAWN: '탈퇴한 유저입니다.',
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  POST_FILE_LIMIT_EXCEEDED: '이미지는 최대 5장까지 첨부할 수 있습니다.',
};

export const PASSWORD_POLICY_TEXT = API_ERROR_MESSAGES.INVALID_PASSWORD_FORMAT;

export function getApiErrorMessage(code, fallback = '처리에 실패했습니다.') {
  const key = (code || '').toString().toUpperCase();
  return API_ERROR_MESSAGES[key] || fallback;
}

/**
 * api.* 가 반환하는 본문(ApiResponse 래퍼)에서 `data`만 꺼냄. 필드는 항상 camelCase 전제.
 */
export function unwrapApiData(res) {
  if (res == null || typeof res !== 'object') return null;
  return res.data ?? null;
}

/**
 * 이미지 URL 보정. 빈 값이면 fallback.
 * 개발 시 백엔드 절대 URL(어떤 호스트든 /upload/ 경로)이면 상대 경로 /upload/... 로 바꿔 Vite 프록시로 로드.
 */
export function safeImageUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') return fallback;
  const t = url.trim();
  if (!t) return fallback;
  const u = t;
  // 어떤 호스트(127.0.0.1, localhost, 0.0.0.0 등)의 /upload/ 경로 → 상대 경로로 통일
  if (/^https?:\/\/[^/]+\/upload\//.test(u)) {
    return u.replace(/^https?:\/\/[^/]+/, '');
  }
  if (u.startsWith('https://') || u.startsWith('http://') || u.startsWith('./') || u.startsWith('/')) {
    return u;
  }
  return fallback;
}

/**
 * Single Source of Truth: 작성자 프로필 이미지 URL 결정.
 * - 내 글/댓글이면(currentUser 일치) AuthContext의 profileImageUrl 사용(프로필 수정 후 즉시 반영).
 * - 그 외면 API에서 내려준 author.profileImageUrl 사용.
 * - null/빈 값/실패 시 반드시 defaultUrl(DEFAULT_PROFILE_IMAGE, /imt.png) 반환하여 엑박 방지.
 * @param {{ profileImageUrl?: string | null } | null} currentUser - 로그인 유저 (AuthContext)
 * @param {{ userId?: number, id?: number, profileImageUrl?: string | null } | null} author - API 작성자(camelCase)
 * @param {boolean} isMine - 현재 유저가 작성자인지
 * @param {string} defaultUrl - DEFAULT_PROFILE_IMAGE (/imt.png)
 * @returns {string} 절대 빈 문자열이 되지 않도록 defaultUrl로 보정
 */
export function getProfileImageUrl(currentUser, author, isMine, defaultUrl) {
  const fallback = defaultUrl && String(defaultUrl).trim() ? defaultUrl : '';
  let out = '';
  if (isMine && currentUser?.profileImageUrl) {
    out = safeImageUrl(currentUser.profileImageUrl, fallback) || fallback;
  } else {
    const url = author?.profileImageUrl ?? null;
    out = safeImageUrl(url, fallback) || fallback;
  }
  return (out && String(out).trim()) ? out : (defaultUrl || '');
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(value) {
  if (!value || typeof value !== 'string') return { ok: false, message: '비밀번호를 입력해주세요.' };
  const v = value.trim();
  if (v.length < 8) return { ok: false, message: PASSWORD_POLICY_TEXT };
  if (v.length > 20) return { ok: false, message: PASSWORD_POLICY_TEXT };
  if (
    !/^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(v)
  ) {
    return {
      ok: false,
      message: PASSWORD_POLICY_TEXT,
    };
  }
  return { ok: true };
}

export function validateNickname(value) {
  if (!value || typeof value !== 'string') return { ok: false, message: '닉네임을 입력해주세요.' };
  const t = value.trim();
  if (t.length > 10) return { ok: false, message: '닉네임은 10자 이내로 입력해주세요.' };
  if (!/^[가-힣a-zA-Z0-9]{1,10}$/.test(t)) {
    return { ok: false, message: getApiErrorMessage('INVALID_NICKNAME_FORMAT') };
  }
  return { ok: true };
}

export function validatePostTitle(title) {
  const t = (title ?? '').trim();
  if (!t) return { ok: false, message: '제목을 입력해주세요.' };
  if (t.length > 26) return { ok: false, message: '제목은 26자 이내로 입력해주세요.' };
  return { ok: true };
}

export function validatePostContent(content) {
  if (!(content ?? '').trim()) return { ok: false, message: '내용을 입력해주세요.' };
  return { ok: true };
}

/**
 * 이미지 업로드 API 응답에서 imageId, url, signupToken 추출.
 * API는 camelCase(id, fileUrl, signupToken)로 전달됨.
 */
export function getImageUploadData(res) {
  const step1 = res?.data ?? res;
  const data = step1?.data ?? step1;
  const inner = data?.data ?? data;
  const payload = inner ?? data;
  return {
    imageId: payload?.id ?? null,
    url: payload?.fileUrl ?? null,
    signupToken: payload?.signupToken ?? null,
  };
}

export function revokeObjectUrlSafely(url) {
  if (!url || typeof url !== 'string') return;
  try {
    URL.revokeObjectURL(url);
  } catch (_) {}
}

/**
 * 강아지 생년월일 → 현재 기준 나이 문자열.
 * 12개월 미만: "n개월", 이상: "n살". 잘못된/빈 값은 "" 반환.
 * @param {string|Date|null|undefined} birthDate - YYYY-MM-DD 또는 Date
 * @returns {string}
 */
export function calculateDogAge(birthDate) {
  if (birthDate == null) return '';
  const date = typeof birthDate === 'string' ? new Date(birthDate.trim() + 'T00:00:00') : birthDate;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const months = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  if (months < 0) return '';
  if (months < 12) return `${months}개월`;
  const years = Math.floor(months / 12);
  return `${years}살`;
}

/**
 * API 성별 코드 → 문자로 표시 (이모지 대신 유니코드 기호로 폰트 호환성 확보).
 * @param {string} gender - "male" | "female"
 * @returns {string}
 */
export function formatDogGender(gender) {
  if (gender === 'male') return '\u2642';  /* ♂ */
  if (gender === 'female') return '\u2640'; /* ♀ */
  return gender ? String(gender) : '';
}

/** 성별 이모지 (게시글/댓글·반려견관리 공통, 글씨 없이 이모지만) */
export function formatDogGenderLabel(gender) {
  if (gender === 'male') return '\u2642\uFE0F';   /* ♂️ */
  if (gender === 'female') return '\u2640\uFE0F'; /* ♀️ */
  return gender ? String(gender) : '';
}

/** 라우트 파라미터 또는 해시에서 postId 추출 (React: useParams 결과 객체 전달 가능) */
export function resolvePostId(param, options = {}) {
  if (typeof param === 'string' || typeof param === 'number') return String(param);
  if (param && typeof param === 'object') {
    const id = param.id ?? param.postId ?? null;
    return id != null ? String(id) : null;
  }
  if (typeof window === 'undefined') return null;
  const path = (window.location.pathname || '').replace(/^\//, '');
  const parts = path.split('/');
  if (options.requireEdit) {
    return parts[0] === 'posts' && parts[1] && parts[2] === 'edit' ? parts[1] : null;
  }
  return parts[0] === 'posts' && parts[1] ? parts[1] : null;
}
