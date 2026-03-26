// 게시글 목록 카드: 제목·메타·작성자·강아지·클릭 시 상세 이동.
import { Image } from 'lucide-react';
import { formatDate, getProfileImageUrl, escapeHtml, calculateDogAge, formatDogGenderLabel } from '../utils/index.js';
import { getPostCategoryLabel } from '../utils/postMeta.js';
import { DEFAULT_PROFILE_IMAGE } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

function AuthorBadge({ author }) {
  const dog = author?.representativeDog;
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
    calculateDogAge(dog.birthDate),
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
  const author = post.author ?? null;
  const isMine = !!(
    user &&
    author &&
    (author.userId === user.userId || author.id === user.userId)
  );
  const authorAvatar = getProfileImageUrl(user, author, isMine, DEFAULT_PROFILE_IMAGE);
  const imgSrc =
    (authorAvatar && String(authorAvatar).trim()) ? authorAvatar : DEFAULT_PROFILE_IMAGE;
  const hasImages =
    (Array.isArray(post.files) && post.files.length > 0) ||
    (Number(post.fileCount) > 0) ||
    (Number(post.imageCount) > 0);
  const categoryId = post.categoryId ?? post.categoryid ?? post.category_id ?? null;
  const categoryLabel = getPostCategoryLabel(categoryId);
  const tagList = Array.isArray(post.hashtags) ? post.hashtags.map((t) => String(t)) : [];

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
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2" aria-label="카테고리 및 해시태그">
          <span className="inline-flex items-center rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold text-violet-800">
            {escapeHtml(categoryLabel)}
          </span>
          {tagList.map((t, i) => (
            <span
              key={`${postId}-tag-${i}`}
              className="inline-flex items-center rounded-full bg-sky-50 px-4 py-2 text-xs font-medium text-sky-800"
            >
              #{escapeHtml(t)}
            </span>
          ))}
        </div>
        <span className="post-card-date shrink-0 self-start whitespace-nowrap text-right">
          {formatDate(createdAt)}
        </span>
      </div>
      <div className="post-card-header">
        <div className="post-card-title-row">
          <span className="post-card-title">{title}</span>
          {hasImages && (
            <span className="post-card-title-image-icon" title="사진이 있는 게시글" aria-hidden>
              <Image size={18} strokeWidth={2} />
            </span>
          )}
        </div>
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
        <span className="post-card-author-name">
          <AuthorBadge author={author ?? { nickname: '탈퇴한 사용자' }} />
        </span>
      </div>
    </article>
  );
}
