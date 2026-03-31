// 게시글 목록 본문: 로딩·에러·빈 목록·카드 리스트·loadingMore.
import { PostCard } from '../PostCard.jsx';

export function PostListContent({
  loading,
  error,
  posts,
  loadingMore,
  onCardClick,
}) {
  const hasPosts = Array.isArray(posts) && posts.length > 0;
  const showInitialSkeleton = !hasPosts && loading;
  return (
    <>
      {!loading && error && <p className="post-list-message">{error}</p>}

      {showInitialSkeleton && !error && (
        <div className="postlist-skeleton" aria-label="게시글 로딩">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="postlist-skeleton__card" />
          ))}
        </div>
      )}

      {!loading && !error && !hasPosts && <p className="post-list-message">게시글이 없습니다.</p>}

      {hasPosts && (
        <div className="post-card-list" role="list">
          {(posts ?? []).map((post, index) => (
            <PostCard
              key={post?.id ?? index}
              post={post}
              onClick={() => onCardClick(post?.id)}
            />
          ))}
        </div>
      )}

      {loadingMore && <div className="app-skeleton-bar" aria-label="추가 로딩" />}
    </>
  );
}
