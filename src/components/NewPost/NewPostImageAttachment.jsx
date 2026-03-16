// 게시글 작성 이미지 첨부(파일 선택·총 N장 표시).
export function NewPostImageAttachment({
  fileInputRef,
  totalCount,
  maxImages,
  onFileChange,
}) {
  return (
    <div className="form-group">
      <span className="form-label">이미지 (최대 {maxImages}장)</span>
      <div className="file-input-wrapper">
        <input
          ref={fileInputRef}
          type="file"
          id="post-file-input"
          accept="image/jpeg,image/png"
          multiple
          className="file-input-hidden"
          aria-hidden="true"
          onChange={onFileChange}
        />
        <button
          type="button"
          className="file-input-button"
          id="post-file-trigger"
          onClick={() => fileInputRef.current?.click()}
          disabled={totalCount >= maxImages}
        >
          파일 선택
        </button>
        <span className="file-input-text" id="file-input-text">
          {totalCount > 0 ? `총 ${totalCount}장` : '파일을 선택해주세요.'}
        </span>
      </div>
    </div>
  );
}
