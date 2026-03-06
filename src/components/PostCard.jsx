// 게시글 목록 카드: 제목·메타·작성자·강아지·클릭 시 상세 이동.
import { formatDate, getProfileImageUrl, escapeHtml, calculateDogAge, formatDogGender } from '../utils/index.js';
import { DEFAULT_PROFILE_IMAGE } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

function AuthorBadge({ author }) {
  const dog = author?.representativeDog ?? author?.representative_dog;
  const name = escapeHtml(author?.nickname || '알 수 없음');
  if (!dog?.name) return <>{name}</>;
  const parts = [
    escapeHtml(dog.name),
    escapeHtml(dog.breed || ''),
    formatDogGender(dog.gender),
    calculateDogAge(dog.birthDate ?? dog.birth_date),
  ].filter(Boolean);
  const badge = parts.join(' / ');
  return (
    <>
      {name}
      <span className="post-card-author-dog-badge"> {badge}</span>
    </>
  );
}

export function PostCard({ post, onClick }) {
  const { user } = useAuth();
  const postId = post.id;
  const title = post.title || '제목 없음';
  const likeCount = post.likeCount ?? 0;
  const commentCount = post.commentCount ?? 0;
  const viewCount = post.viewCount ?? 0;
  const createdAt = post.createdAt ?? '';
  const author = post.author || {};
  const isMine = !!(user && (author.userId === user.userId || author.id === user.userId));
  const authorAvatar = getProfileImageUrl(user, author, isMine, DEFAULT_PROFILE_IMAGE);
  // author.profileImageUrl이 null이어도 기본 이미지가 나가도록, 빈/undefined 시 DEFAULT_PROFILE_IMAGE 고정
  const imgSrc =
    (authorAvatar && String(authorAvatar).trim()) ? authorAvatar : DEFAULT_PROFILE_IMAGE;

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
        <span className="post-card-title">{title}</span>
        <span className="post-card-date">{formatDate(createdAt)}</span>
      </div>
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
