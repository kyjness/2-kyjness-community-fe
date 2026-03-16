// 게시글 목록 카드: 제목·메타·작성자·강아지·클릭 시 상세 이동.
import { Image } from 'lucide-react';
import { formatDate, getProfileImageUrl, escapeHtml, calculateDogAge, formatDogGenderLabel } from '../utils/index.js';
import { DEFAULT_PROFILE_IMAGE } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

function AuthorBadge({ author }) {
  const dog = author?.representativeDog ?? author?.representative_dog;
  const name = escapeHtml(author?.nickname || '알 수 없음');
  if (!dog?.name) return <>{name}</>;
  const genderLabel = dog.gender ? (
    <span className={`dog-gender-badge dog-gender--${dog.gender}`}>
      {formatDogGenderLabel(dog.gender)}
    </span>
  ) : null;
  const parts = [
    escapeHtml(dog.name),
    escapeHtml(dog.breed || ''),
    genderLabel,
    calculateDogAge(dog.birthDate ?? dog.birth_date),
  ].filter(Boolean);
  return (
    <>
      {name}
      <span className="post-card-author-dog-badge">
        {' '}
        {parts.map((p, i) => (
          <span key={i}>
            {i > 0 && ' / '}
            {p}
          </span>
        ))}
      </span>
    </>
  );
}

/** 목록용 본문 미리보기: 첫 줄만, 길면 말줄임 */
function getContentExcerpt(content, maxLength = 80) {
  if (!content || typeof content !== 'string') return '';
  const firstLine = content.trim().split(/\r?\n/)[0] || '';
  if (firstLine.length <= maxLength) return firstLine;
  return firstLine.slice(0, maxLength).trim() + '...';
}

export function PostCard({ post, onClick }) {
  const { user } = useAuth();
  const postId = post.id;
  const title = post.title || '제목 없음';
  const contentPreview =
    post.contentPreview ??
    getContentExcerpt(post.content ?? '', 80);
  const likeCount = post.likeCount ?? 0;
  const commentCount = post.commentCount ?? 0;
  const viewCount = post.viewCount ?? 0;
  const createdAt = post.createdAt ?? '';
  const author = post.author || {};
  const isMine = !!(user && (author.userId === user.userId || author.id === user.userId));
  const authorAvatar = getProfileImageUrl(user, author, isMine, DEFAULT_PROFILE_IMAGE);
  const imgSrc =
    (authorAvatar && String(authorAvatar).trim()) ? authorAvatar : DEFAULT_PROFILE_IMAGE;
  const hasImages =
    (Array.isArray(post.files) && post.files.length > 0) ||
    (Number(post.fileCount) > 0) ||
    (Number(post.imageCount) > 0);

  return (
    <article
      className="post-card"
      data-id={postId}
      role="listitem"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={0}
    >
      <div className="post-card-header">
        <div className="post-card-title-row">
          <span className="post-card-title">{title}</span>
          {hasImages && (
            <span className="post-card-title-image-icon" title="사진이 있는 게시글" aria-hidden>
              <Image size={18} strokeWidth={2} />
            </span>
          )}
        </div>
        <span className="post-card-date">{formatDate(createdAt)}</span>
      </div>
      {contentPreview ? (
        <p className="post-card-excerpt" title={contentPreview}>
          {contentPreview}
        </p>
      ) : null}
      <div className="post-card-stats">
        <span>좋아요 {likeCount}</span>
        <span>댓글 {commentCount}</span>
        <span>조회수 {viewCount}</span>
      </div>
      <div className="post-card-divider" />
      <div className="post-card-author">
        <div className="post-card-author-img">
          <img
            src={imgSrc}
            alt="작성자 프로필"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              display: 'block',
            }}
            onError={(e) => {
              if (e.target.src !== DEFAULT_PROFILE_IMAGE) {
                e.target.src = DEFAULT_PROFILE_IMAGE;
              }
            }}
          />
        </div>
        <span className="post-card-author-name"><AuthorBadge author={author} /></span>
      </div>
    </article>
  );
}
