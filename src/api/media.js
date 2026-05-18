// S3 Presigned POST 이미지 업로드: presign(axios) → S3(fetch) → confirm(axios).
// S3 단계에는 절대 api/axios 인스턴스를 쓰지 않는다(Bearer 헤더 시 400).
import { api } from './client.js';
import { getImageUploadData } from '../utils/index.js';

/** 백엔드 Presigned POST content-length-range 상한(10MB) */
export const PRESIGNED_MAX_BYTES = 10 * 1024 * 1024;

export const PRESIGNED_ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** @typedef {'post' | 'profile' | 'signup'} ImageUploadPurpose */

/**
 * @param {unknown} res
 * @returns {{ url: string, fields: Record<string, string>, fileKey: string }}
 */
function unwrapPresignResponse(res) {
  const step1 = res?.data ?? res;
  const data = step1?.data ?? step1;
  const payload = data?.data ?? data;
  const url = payload?.url;
  const fields = payload?.fields;
  const fileKey = payload?.fileKey;
  if (!url || !fields || !fileKey) {
    const err = new Error('Presign response is missing url, fields, or fileKey.');
    err.code = 'PRESIGN_INVALID_RESPONSE';
    throw err;
  }
  return { url, fields, fileKey };
}

/**
 * 클라이언트 선검증: 타입·10MB 상한(S3 거부 전 UX).
 * @param {File} file
 */
export function validateImageFileForPresignedUpload(file) {
  if (!file) {
    const err = new Error('MISSING_REQUIRED_FIELD');
    err.code = 'MISSING_REQUIRED_FIELD';
    throw err;
  }
  if (!PRESIGNED_ALLOWED_IMAGE_TYPES.includes(file.type)) {
    const err = new Error('INVALID_FILE_TYPE');
    err.code = 'INVALID_FILE_TYPE';
    throw err;
  }
  if (file.size < 1 || file.size > PRESIGNED_MAX_BYTES) {
    const err = new Error('FILE_SIZE_EXCEEDED');
    err.code = 'FILE_SIZE_EXCEEDED';
    throw err;
  }
}

/**
 * purpose에 따라 presign·confirm 경로 분기(signup은 JWT 불필요).
 * @param {ImageUploadPurpose} purpose
 */
function presignConfirmPaths(purpose) {
  if (purpose === 'signup') {
    return {
      presign: '/media/images/signup/presign',
      confirm: '/media/images/signup/confirm',
    };
  }
  return {
    presign: '/media/images/presign',
    confirm: '/media/images/confirm',
  };
}

/**
 * @param {string} presignPath
 * @param {{ filename: string, contentType: string }} body
 */
async function requestPresign(presignPath, body) {
  const res = await api.post(presignPath, body);
  return unwrapPresignResponse(res);
}

/**
 * S3 Presigned POST 업로드. 순수 fetch만 사용(Authorization 미전송).
 * @param {string} url
 * @param {Record<string, string>} fields
 * @param {File} file
 */
export async function postFileToS3(url, fields, file) {
  const formData = new FormData();

  // IMPORTANT: S3는 policy에 명시된 field를 file보다 먼저 받아야 함. 순서 변경 금지.
  for (const [key, value] of Object.entries(fields)) {
    if (value != null && value !== '') {
      formData.append(key, String(value));
    }
  }
  // file은 반드시 마지막 append
  formData.append('file', file, file.name);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'omit',
    });
  } catch (networkErr) {
    const err = new Error(
      'S3 업로드에 실패했습니다. 브라우저 개발자 도구(Network)에서 CORS 오류 여부를 확인하고, ' +
        'S3 버킷 CORS에 이 사이트 Origin과 POST 메서드가 허용되어 있는지 점검하세요.'
    );
    err.code = 'S3_UPLOAD_NETWORK_ERROR';
    err.cause = networkErr;
    throw err;
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const err = new Error(`S3 upload rejected (${response.status})`);
    err.code = 'S3_UPLOAD_FAILED';
    err.status = response.status;
    err.details = detail;
    throw err;
  }
}

/**
 * @param {string} confirmPath
 * @param {ImageUploadPurpose} purpose
 * @param {string} fileKey
 * @param {File} file
 */
async function requestConfirm(confirmPath, purpose, fileKey, file) {
  const body =
    purpose === 'signup'
      ? { fileKey, size: file.size }
      : { fileKey, purpose, size: file.size };
  const res = await api.post(confirmPath, body);
  return getImageUploadData(res);
}

/**
 * Presign → S3(fetch) → Confirm 전체 파이프라인.
 * @param {File} file
 * @param {{ purpose?: ImageUploadPurpose }} [options]
 * @returns {Promise<{ imageId: string | null, url: string | null, signupToken: string | null }>}
 */
export async function uploadImageFile(file, { purpose = 'post' } = {}) {
  validateImageFileForPresignedUpload(file);

  const { presign, confirm } = presignConfirmPaths(purpose);
  const { url, fields, fileKey } = await requestPresign(presign, {
    filename: file.name,
    contentType: file.type,
  });

  await postFileToS3(url, fields, file);

  return requestConfirm(confirm, purpose, fileKey, file);
}
