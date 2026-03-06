// 게시글 작성 내용·이미지 미리보기·contentError.
import ImagePreviewItem from '../ImagePreviewItem.jsx';

export function NewPostContentBlock({
  content,
  contentRef,
  contentError,
  onChange,
  newImages,
  totalCount,
  onRemovePreview,
}) {
  return (
    <div className="form-group">
      <label htmlFor="content" className="form-label">
        내용*
      </label>
      <textarea
        ref={contentRef}
        id="content"
        name="content"
        className="form-input form-textarea"
        placeholder="내용을 입력하세요."
        value={content}
        onChange={onChange}
        aria-invalid={!!contentError}
        aria-describedby={contentError ? 'content-error' : undefined}
      />
      <div
        id="post-image-preview"
        className={`post-image-preview ${totalCount > 0 ? 'has-images' : ''}`}
        aria-label="첨부 이미지 미리보기"
      >
        {newImages.map((item, i) => (
          <ImagePreviewItem
            key={`new-${i}`}
            type="new"
            item={item}
            index={i}
            onRemove={onRemovePreview}
          />
        ))}
      </div>
      {contentError && (
        <span className="helper-text" id="content-error" role="alert">
          * {contentError}
        </span>
      )}
    </div>
  );
}
