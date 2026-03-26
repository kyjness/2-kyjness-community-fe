// 게시글 이미지 상태: 기존/신규 목록, 추가·삭제·업로드, Object URL revoke.
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client.js';
import { getImageUploadData, revokeObjectUrlSafely } from '../utils/index.js';

/** @typedef {import('../api/api-types.js').ExistingImageItem} ExistingUrlItem */
/** @typedef {import('../api/api-types.js').NewImageItem} NewImageItem */

/**
 * @param {{ ids: number[], urls: ExistingUrlItem[] } | null} initialExisting - 서버에서 받은 기존 이미지 (한 번만 적용)
 * @param {number} maxImages
 * @returns {{
 *   existingIds: number[],
 *   existingUrls: ExistingUrlItem[],
 *   newImages: NewImageItem[],
 *   totalCount: number,
 *   addFiles: (files: FileList | File[]) => void,
 *   removeExisting: (index: number) => void,
 *   removeNew: (index: number) => Promise<void>,
 *   uploadNewImages: () => Promise<NewImageItem[]>,
 * }}
 */
export function usePostImages(initialExisting, maxImages = 5) {
  const [existingIds, setExistingIds] = useState([]);
  const [existingUrls, setExistingUrls] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const appliedRef = useRef(false);
  const newImagesRef = useRef([]);
  newImagesRef.current = newImages;

  const totalCount = existingUrls.length + newImages.length;

  // 초기 기존 이미지 한 번만 반영 (데이터 로드 시)
  useEffect(() => {
    if (!initialExisting || appliedRef.current) return;
    setExistingIds(initialExisting.ids ?? []);
    setExistingUrls(initialExisting.urls ?? []);
    appliedRef.current = true;
  }, [initialExisting]);

  // 언마운트 시 새 이미지 Object URL 전부 해제 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      newImagesRef.current.forEach((item) => revokeObjectUrlSafely(item.objectUrl));
    };
  }, []);

  const addFiles = useCallback(
    (files) => {
      const list = Array.from(files ?? []);
      if (list.length === 0) return;
      setNewImages((prev) => {
        const cap = maxImages - existingUrls.length - prev.length;
        const toAdd = list.slice(0, Math.max(0, cap));
        const next = [...prev];
        for (const file of toAdd) {
          if (next.length + existingUrls.length >= maxImages) break;
          next.push({ file, objectUrl: URL.createObjectURL(file), imageId: null });
        }
        return next;
      });
    },
    [maxImages, existingUrls.length]
  );

  const removeExisting = useCallback((index) => {
    setExistingUrls((prev) => {
      const imageId = prev[index]?.imageId;
      if (imageId != null) {
        setExistingIds((ids) => ids.filter((id) => String(id) !== String(imageId)));
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const removeNew = useCallback(async (index) => {
    setNewImages((prev) => {
      const entry = prev[index];
      if (!entry) return prev;
      if (entry.imageId != null) {
        api.delete(`/media/images/${entry.imageId}`).catch(() => {});
      }
      revokeObjectUrlSafely(entry.objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const uploadNewImages = useCallback(async () => {
    const current = newImagesRef.current.map((item) => ({ ...item }));
    for (let i = 0; i < current.length; i++) {
      if (current[i].imageId != null) continue;
      const fd = new FormData();
      fd.append('image', current[i].file);
      const res = await api.postFormData('/media/images?purpose=post', fd);
      const data = getImageUploadData(res);
      const id = data?.imageId ?? null;
      if (id == null) {
        console.error('[usePostImages] 이미지 업로드 응답에 imageId 없음:', res);
        throw new Error('이미지 업로드에 실패했습니다. 응답 형식을 확인해 주세요.');
      }
      current[i].imageId = id;
    }
    return current;
  }, []);

  return {
    existingIds,
    existingUrls,
    newImages,
    totalCount,
    addFiles,
    removeExisting,
    removeNew,
    uploadNewImages,
  };
}
