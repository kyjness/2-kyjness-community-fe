// 댓글 입력 폼. 자동 높이 조절(스크롤 없음), 구분선 겹침 방지.
import { useRef, useEffect, useCallback } from 'react';

const MIN_HEIGHT = 44;
const MAX_HEIGHT = 400;

export function CommentForm({ content, submitting, onChangeContent, onSubmit }) {
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = 'hidden';
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  return (
    <section className="comment-write-box">
      <form className="comment-form" onSubmit={onSubmit} noValidate>
        <textarea
          ref={textareaRef}
          className="form-input comment-textarea"
          placeholder="댓글을 남겨보세요"
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          rows={1}
        />
        <div className="comment-write-box-divider" />
        <button type="submit" className="btn btn-submit" disabled={submitting}>
          {submitting ? '등록 중...' : '댓글 등록'}
        </button>
      </form>
    </section>
  );
}
