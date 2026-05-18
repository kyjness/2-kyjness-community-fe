// S3 Presigned POST 업로드 React Query mutation 래퍼.
import { useMutation } from '@tanstack/react-query';
import { uploadImageFile } from '../api/media.js';

/**
 * @typedef {import('../api/media.js').ImageUploadPurpose} ImageUploadPurpose
 */

/**
 * @typedef {Object} ImageUploadVariables
 * @property {File} file
 * @property {ImageUploadPurpose} [purpose]
 */

/**
 * @typedef {Object} ImageUploadResult
 * @property {string | null} imageId
 * @property {string | null} url
 * @property {string | null} signupToken
 */

/**
 * Presigned POST 파이프라인 useMutation.
 * @param {import('@tanstack/react-query').UseMutationOptions<ImageUploadResult, Error, ImageUploadVariables>} [options]
 */
export function useImageUpload(options = {}) {
  return useMutation({
    mutationFn: ({ file, purpose = 'post' }) => uploadImageFile(file, { purpose }),
    ...options,
  });
}
