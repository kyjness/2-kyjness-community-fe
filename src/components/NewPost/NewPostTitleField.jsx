// 게시글 작성 제목 필드.
export function NewPostTitleField({ title, titleError, onChange }) {
  return (
    <div className="form-group">
      <label htmlFor="title" className="form-label">
        제목*
      </label>
      <input
        type="text"
        id="title"
        name="title"
        className="form-input"
        placeholder="제목을 입력하세요. (최대 26글자)"
        maxLength={26}
        value={title}
        onChange={onChange}
        aria-invalid={!!titleError}
        aria-describedby={titleError ? 'title-error' : undefined}
      />
      {titleError && (
        <span className="helper-text" id="title-error" role="alert">
          * {titleError}
        </span>
      )}
    </div>
  );
}
