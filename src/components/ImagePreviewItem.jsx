// 게시글 이미지 미리보기 1건(기존/신규), 제거 시 onRemove 호출.
import { memo } from 'react';
import { safeImageUrl } from '../utils/index.js';

/**
 * @param {'existing' | 'new'} type
 * @param {{ imageId?: number, fileUrl?: string } | { objectUrl: string }} item
 * @param {number} index
 * @param {(type: 'existing' | 'new', index: number) => void} onRemove
 */
function ImagePreviewItem({ type, item, index, onRemove }) {
  const src = type === 'existing'
    ? (safeImageUrl(item.fileUrl, '') || '')
    : item.objectUrl;
  const dataImageId = type === 'existing' && item.imageId != null ? item.imageId : undefined;

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(type, index);
  };

  return (
    <div
      className="post-image-preview-item"
      data-type={type}
      data-index={index}
      {...(dataImageId != null && { 'data-image-id': dataImageId })}
    >
      <img src={src} alt={type === 'existing' ? '이미지' : '새 이미지'} />
      <button
        type="button"
        className="post-image-remove"
        aria-label="제거"
        onClick={handleRemove}
      >
        ×
      </button>
    </div>
  );
}

export default memo(ImagePreviewItem);
