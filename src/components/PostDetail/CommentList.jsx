// 댓글 목록·수정/삭제·페이지네이션.
import { escapeHtml, formatDateTime, calculateDogAge, formatDogGender } from '../../utils/index.js';
import { DEFAULT_PROFILE_IMAGE } from '../../config.js';

export function CommentList({
  comments,
  commentEdit,
  setCommentEdit,
  onEditSave,
  onDeleteOpen,
  commentPage,
  commentTotalPages,
  setCommentPage,
}) {
  return (
    <>
      <section className="comment-list" id="comment-list">
        {comments.map((c) => (
          <article key={c.id} className="comment-item" data-comment-id={c.id}>
            <div className="comment-avatar">
              <img
                src={c.author_profile_image || DEFAULT_PROFILE_IMAGE}
                alt="댓글 작성자 프로필"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            </div>
            <div className="comment-body">
              <div className="comment-header">
                <div className="comment-header-left">
                  <span className="comment-author-name">
                    {escapeHtml(c.author_nickname ?? '')}
                    {c.author_representative_dog?.name && (
                      <span className="comment-author-dog-badge">
                        {' '}
                        {[
                          escapeHtml(c.author_representative_dog.name),
                          escapeHtml(c.author_representative_dog.breed || ''),
                          formatDogGender(c.author_representative_dog.gender),
                          calculateDogAge(
                            c.author_representative_dog.birthDate ??
                              c.author_representative_dog.birth_date
                          ),
                        ]
                          .filter(Boolean)
                          .join(' / ')}
                      </span>
                    )}
                  </span>
                  <span className="comment-date">{formatDateTime(c.created_at)}</span>
                </div>
                {c.isMine && commentEdit.editingId !== c.id && (
                  <div className="detail-action-group">
                    <button
                      type="button"
                      className="detail-action-btn comment-edit-btn"
                      onClick={() =>
                        setCommentEdit({ editingId: c.id, content: c.content ?? '' })
                      }
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="detail-action-btn comment-delete-btn"
                      onClick={() => onDeleteOpen(c.id)}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              {commentEdit.editingId === c.id ? (
                <form
                  className="comment-edit-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onEditSave(c.id, commentEdit.content);
                  }}
                >
                  <textarea
                    className="comment-edit-textarea"
                    aria-label="댓글 수정"
                    value={commentEdit.content}
                    onChange={(e) =>
                      setCommentEdit((prev) => ({ ...prev, content: e.target.value }))
                    }
                  />
                  <div className="detail-action-group">
                    <button type="submit" className="detail-action-btn">
                      저장
                    </button>
                    <button
                      type="button"
                      className="detail-action-btn comment-edit-cancel-btn"
                      onClick={() => setCommentEdit({ editingId: null, content: '' })}
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <p className="comment-content">{escapeHtml(c.content ?? '')}</p>
              )}
            </div>
          </article>
        ))}
      </section>
      {commentTotalPages > 1 && (
        <nav className="comment-pagination" aria-label="댓글 페이지">
          <ul className="comment-pagination-list">
            {Array.from({ length: commentTotalPages }, (_, i) => i + 1).map((p) => (
              <li key={p}>
                <button
                  type="button"
                  className={`comment-page-btn ${p === commentPage ? 'active' : ''}`}
                  data-page={p}
                  onClick={() => setCommentPage(p)}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
