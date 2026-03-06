// 게시글 목록 본문: 로딩·에러·빈 목록·카드 리스트·loadingMore.
import { PostCard } from '../PostCard.jsx';

export function PostListContent({
  loading,
  error,
  posts,
  loadingMore,
  onCardClick,
}) {
  return (
    <>
      {loading && (
        <p style={{ textAlign: 'center', padding: 20 }}>게시글을 불러오는 중...</p>
      )}

      {!loading && error && <p className="post-list-message">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="post-list-message">게시글이 없습니다.</p>
      )}

      {!loading && Array.isArray(posts) && posts.length > 0 && (
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

      {loadingMore && (
        <p style={{ textAlign: 'center', padding: 20 }}>게시글을 불러오는 중...</p>
      )}
    </>
  );
}
