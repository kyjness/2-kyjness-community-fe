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
      {!loading && error && (
        <p className="mt-6 flex w-full justify-center self-center text-center text-[16px] text-black">
          {error}
        </p>
      )}

      {showInitialSkeleton && !error && (
        <div className="flex w-full flex-col gap-6 pb-10" aria-label="게시글 로딩">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[150px] w-full rounded-[16px] bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.1)_30%,rgba(15,23,42,0.06)_60%)] bg-[length:240%_100%] [animation:postlist-skeleton-shimmer_1.1s_ease-in-out_infinite]"
            />
          ))}
        </div>
      )}

      {!loading && !error && !hasPosts && (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center px-4">
          <p className="text-center text-[16px] text-black">게시글이 없습니다.</p>
        </div>
      )}

      {hasPosts && (
        <div className="flex w-full flex-col gap-4 pb-10" role="list">
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
