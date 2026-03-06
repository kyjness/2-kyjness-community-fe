// 게시글 상세 카드: 제목·메타·이미지·본문·통계·메시지.
import { DEFAULT_PROFILE_IMAGE } from '../../config.js';
import {
  escapeHtml,
  escapeAttr,
  safeImageUrl,
  formatDateTime,
  calculateDogAge,
  formatDogGender,
} from '../../utils/index.js';

export function PostContent({
  post,
  postId,
  message,
  uniqueFiles,
  commentTotalCount,
  onLike,
  onEdit,
  onDeleteOpen,
  children,
}) {
  if (!post) return null;

  return (
    <section className="post-detail-card">
      <h2 className="post-detail-title">{escapeHtml(post?.title ?? '')}</h2>
      <div className="post-detail-meta">
        <div className="post-detail-meta-left">
          <div className="post-detail-author-img">
            <img
              src={post?.author_profile_image || DEFAULT_PROFILE_IMAGE}
              alt="작성자 프로필"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          </div>
          <div className="post-detail-meta-text">
            <span className="post-detail-author-name">
              {escapeHtml(post?.author_nickname ?? '작성자')}
              {post?.author_representative_dog?.name && (
                <span className="post-detail-author-dog-badge">
                  {' '}
                  {[
                    escapeHtml(post.author_representative_dog.name),
                    escapeHtml(post.author_representative_dog.breed || ''),
                    formatDogGender(post.author_representative_dog.gender),
                    calculateDogAge(
                      post.author_representative_dog.birthDate ??
                        post.author_representative_dog.birth_date
                    ),
                  ]
                    .filter(Boolean)
                    .join(' / ')}
                </span>
              )}
            </span>
            <span className="post-detail-date">{formatDateTime(post?.created_at)}</span>
          </div>
        </div>
        {post?.isMine && (
          <div className="detail-action-group">
            <button
              type="button"
              className="detail-action-btn"
              onClick={() => onEdit(`/posts/${postId}/edit`)}
            >
              수정
            </button>
            <button
              type="button"
              className="detail-action-btn"
              onClick={onDeleteOpen}
            >
              삭제
            </button>
          </div>
        )}
      </div>
      <div className="divider" />
      {uniqueFiles.length > 0 && (
        <div className="post-detail-images-wrapper">
          {uniqueFiles.map((f, i) => {
            const url = safeImageUrl(f.fileUrl, '');
            return url ? (
              <div key={i} className="post-detail-image-wrapper">
                <img
                  src={escapeAttr(url)}
                  alt="게시글 이미지"
                  className="post-detail-image"
                />
              </div>
            ) : null;
          })}
        </div>
      )}
      <p className="post-detail-content">
        {escapeHtml(String(post?.content || '내용이 없습니다.').trim())}
      </p>
      <div className="post-detail-stats">
        <div
          className="post-detail-stat-box"
          id="like-stat-box"
          onClick={onLike}
          style={{ cursor: 'pointer' }}
        >
          <span className="post-detail-stat-count">{post?.likes ?? 0}</span>
          <span className="post-detail-stat-label">좋아요수</span>
        </div>
        <div className="post-detail-stat-box">
          <span className="post-detail-stat-count">{post?.views ?? 0}</span>
          <span className="post-detail-stat-label">조회수</span>
        </div>
        <div className="post-detail-stat-box">
          <span className="post-detail-stat-count">
            {post?.commentCount ?? commentTotalCount ?? 0}
          </span>
          <span className="post-detail-stat-label">댓글</span>
        </div>
      </div>
      <div className="divider" />
      {message && (
        <span className="helper-text" id="post-detail-message">
          * {message}
        </span>
      )}
      {children}
    </section>
  );
}
