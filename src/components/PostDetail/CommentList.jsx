// 댓글 목록·수정/삭제·답글·페이지네이션. 트리(대댓글 1-depth) 렌더링.
import { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, MoreHorizontal, UserX, AlertTriangle } from 'lucide-react';
import { escapeHtml, formatDateTime, calculateDogAge, formatDogGenderLabel } from '../../utils/index.js';
import { DEFAULT_PROFILE_IMAGE } from '../../config.js';
function CommentItem({
  c,
  currentUserId,
  commentEdit,
  setCommentEdit,
  onEditSave,
  onCommentLike,
  onDeleteOpen,
  onBlockUser,
  onReportOpen,
  replyToCommentId,
  setReplyToCommentId,
  replyForm,
  setReplyForm,
  onReplySubmit,
  depth = 0,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const replyTextareaRef = useRef(null);
  const editTextareaRef = useRef(null);
  const isReply = depth > 0;
  const isMyComment = c.isMine || (currentUserId != null && c.author_id === currentUserId);

  const adjustReplyHeight = useCallback(() => {
    const el = replyTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, 44), 300);
    el.style.height = `${next}px`;
    el.style.overflowY = 'hidden';
  }, []);

  const adjustEditHeight = useCallback(() => {
    const el = editTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, 60), 300);
    el.style.height = `${next}px`;
    el.style.overflowY = 'hidden';
  }, []);

  useEffect(() => {
    if (replyToCommentId === c.id) adjustReplyHeight();
  }, [replyToCommentId, c.id, replyForm.content, adjustReplyHeight]);

  useEffect(() => {
    if (commentEdit.editingId === c.id) adjustEditHeight();
  }, [commentEdit.editingId, c.id, commentEdit.content, adjustEditHeight]);

  return (
    <article
      key={c.id}
      className={`comment-item ${isReply ? 'is-reply' : ''}`}
      data-comment-id={c.id}
    >
      <div className="comment-item-avatar">
        <img
          src={c.author_profile_image || DEFAULT_PROFILE_IMAGE}
          alt="댓글 작성자 프로필"
        />
      </div>
      <div className="comment-item-body">
        <div className="comment-item-header">
          <div className="comment-item-author-wrap">
            <span className="comment-item-author">{escapeHtml(c.author_nickname ?? '')}</span>
            {c.author_representative_dog?.name && (
              <span className="comment-item-dog">
                {' '}
                {(() => {
                  const d = c.author_representative_dog;
                  const genderLabel = d.gender ? (
                    <span className={`dog-gender-badge dog-gender--${d.gender}`}>
                      {formatDogGenderLabel(d.gender)}
                    </span>
                  ) : null;
                  const parts = [
                    escapeHtml(d.name),
                    escapeHtml(d.breed || ''),
                    genderLabel,
                    calculateDogAge(d.birthDate),
                  ].filter(Boolean);
                  return parts.map((p, i) => (
                    <span key={i}>
                      {i > 0 && ' / '}
                      {p}
                    </span>
                  ));
                })()}
              </span>
            )}
          </div>
          <div className="comment-item-actions">
            {isMyComment && currentUserId != null ? (
              <div className="comment-item-my-actions">
                <button
                  type="button"
                  className="comment-item-action-btn"
                  onClick={() => setCommentEdit({ editingId: c.id, content: c.content ?? '' })}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="comment-item-action-btn"
                  onClick={() => onDeleteOpen(c.id)}
                >
                  삭제
                </button>
              </div>
            ) : !isMyComment ? (
              <div className="relative">
                <button
                  type="button"
                  className="comment-item-menu-trigger"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="메뉴"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal size={18} aria-hidden />
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="comment-item-menu-backdrop"
                      role="presentation"
                      aria-hidden="true"
                      onClick={() => setMenuOpen(false)}
                    />
                    <ul className="comment-item-menu">
                      {currentUserId != null && c.author_id != null ? (
                        <li>
                          <button
                            type="button"
                            className="menu-item-btn menu-item-btn--danger"
                            onClick={() => {
                              onBlockUser?.(c.author_id);
                              setMenuOpen(false);
                            }}
                          >
                            <UserX size={15} aria-hidden />
                            차단
                          </button>
                        </li>
                      ) : null}
                      <li>
                        <button
                          type="button"
                          className="menu-item-btn menu-item-btn--danger"
                          onClick={() => {
                            onReportOpen?.('COMMENT', c.id);
                            setMenuOpen(false);
                          }}
                        >
                          <AlertTriangle size={15} aria-hidden />
                          신고
                        </button>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            ) : (
              <div className="comment-item-actions-spacer" aria-hidden />
            )}
          </div>
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
              ref={editTextareaRef}
              className="w-full min-h-[60px] p-2 border border-gray-300 rounded text-[13px] font-['Pretendard',sans-serif] resize-none"
              aria-label="댓글 수정"
              value={commentEdit.content}
              onChange={(e) => {
                const value = e.target.value;
                setCommentEdit((prev) => ({ ...prev, content: value }));
                // 같은 tick에서 DOM 값이 반영되므로 즉시 높이 재계산 가능
                adjustEditHeight();
              }}
            />
            <div className="comment-edit-actions">
              <button type="submit">
                저장
              </button>
              <button
                type="button"
                onClick={() => setCommentEdit({ editingId: null, content: '' })}
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <div className="comment-item-content-block">
            <div className="comment-item-content-row">
              <p className="comment-item-content">
                {c.isDeleted ? '삭제된 댓글입니다.' : escapeHtml(c.content ?? '')}
              </p>
              {!isReply && onCommentLike && !c.isDeleted && (
                <div className="comment-item-like-col">
                  <div className="comment-item-like-icon">
                    <button
                      type="button"
                      className={c.isLiked ? 'is-liked' : ''}
                      onClick={() => onCommentLike(c.id)}
                      aria-label={c.isLiked ? '좋아요 취소' : '좋아요'}
                    >
                      <Heart
                        size={16}
                        strokeWidth={2}
                        fill={c.isLiked ? 'currentColor' : 'none'}
                        aria-hidden
                      />
                    </button>
                  </div>
                  <div className="comment-item-like-count">
                    <span>{c.likeCount ?? 0}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="comment-item-meta-row">
              <div className="comment-item-meta">
                <span>
                  {formatDateTime(c.created_at)}
                  {c.isEdited && <span className="comment-item-edited"> (수정됨)</span>}
                </span>
                {currentUserId != null && !c.isDeleted && !c.parentId && (
                  <button
                    type="button"
                    className="comment-reply-btn"
                    onClick={() => setReplyToCommentId(replyToCommentId === c.id ? null : c.id)}
                  >
                    답글 쓰기
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {currentUserId != null && replyToCommentId === c.id && (
          <form
            className="comment-reply-box"
            onSubmit={(e) => onReplySubmit(e, c.id)}
          >
            <textarea
              ref={replyTextareaRef}
              rows={1}
              className="comment-reply-textarea"
              placeholder="댓글을 남겨보세요"
              value={replyForm.content}
              onChange={(e) => setReplyForm((prev) => ({ ...prev, content: e.target.value }))}
            />
            <div className="comment-reply-box-divider" />
            <div className="comment-reply-actions">
              <button
                type="button"
                className="comment-reply-cancel"
                onClick={() => {
                  setReplyToCommentId(null);
                  setReplyForm((prev) => ({ ...prev, content: '' }));
                }}
              >
                취소
              </button>
              <button type="submit" className="btn btn-submit" disabled={replyForm.submitting}>
                등록
              </button>
            </div>
          </form>
        )}
        {Array.isArray(c.replies) && c.replies.length > 0 && (
          <div className="comment-replies">
            {c.replies.map((r) => (
              <CommentItem
                key={r.id}
                c={r}
                currentUserId={currentUserId}
                commentEdit={commentEdit}
                setCommentEdit={setCommentEdit}
                onEditSave={onEditSave}
                onCommentLike={onCommentLike}
                onDeleteOpen={onDeleteOpen}
                onBlockUser={onBlockUser}
                onReportOpen={onReportOpen}
                replyToCommentId={replyToCommentId}
                setReplyToCommentId={setReplyToCommentId}
                replyForm={replyForm}
                setReplyForm={setReplyForm}
                onReplySubmit={onReplySubmit}
                depth={1}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

const COMMENT_SORTS = [
  { value: 'popular', label: '인기순' },
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '등록순' },
];

export function CommentList({
  comments,
  currentUserId,
  commentSort,
  setCommentSort,
  commentEdit,
  setCommentEdit,
  onEditSave,
  onCommentLike,
  onDeleteOpen,
  onBlockUser,
  onReportOpen,
  commentPage,
  commentTotalPages,
  setCommentPage,
  replyToCommentId,
  setReplyToCommentId,
  replyForm,
  setReplyForm,
  onReplySubmit,
}) {
  return (
    <>
      <div className="comment-sort-tabs" role="tablist" aria-label="댓글 정렬">
        {COMMENT_SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            role="tab"
            aria-selected={commentSort === s.value}
            onClick={() => setCommentSort(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <section id="comment-list">
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            c={c}
            currentUserId={currentUserId}
            commentEdit={commentEdit}
            setCommentEdit={setCommentEdit}
            onEditSave={onEditSave}
            onCommentLike={onCommentLike}
            onDeleteOpen={onDeleteOpen}
            onBlockUser={onBlockUser}
            onReportOpen={onReportOpen}
            replyToCommentId={replyToCommentId}
            setReplyToCommentId={setReplyToCommentId}
            replyForm={replyForm}
            setReplyForm={setReplyForm}
            onReplySubmit={onReplySubmit}
          />
        ))}
      </section>
      {commentTotalPages > 1 && (
        <nav className="comment-pagination" aria-label="댓글 페이지">
          <ul>
            {Array.from({ length: commentTotalPages }, (_, i) => i + 1).map((p) => (
              <li key={p}>
                <button
                  type="button"
                  className={p === commentPage ? 'active' : ''}
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
