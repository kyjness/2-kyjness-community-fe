// 댓글 입력 폼.
export function CommentForm({ content, submitting, onChangeContent, onSubmit }) {
  return (
    <section className="comment-write-box">
      <form className="comment-form" onSubmit={onSubmit} noValidate>
        <textarea
          className="form-input comment-textarea"
          placeholder="댓글을 남겨주세요!"
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
        />
        <div className="comment-write-box-divider" />
        <button type="submit" className="btn btn-submit" disabled={submitting}>
          {submitting ? '등록 중...' : '댓글 등록'}
        </button>
      </form>
    </section>
  );
}
