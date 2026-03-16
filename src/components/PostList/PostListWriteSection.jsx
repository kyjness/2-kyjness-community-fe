// 게시글 목록 게시글 작성 버튼 래퍼.
export function PostListWriteSection({ postsLength, onWriteClick }) {
  return (
    <div
      className={
        postsLength > 0
          ? 'post-list-write-wrap post-list-write-right'
          : 'post-list-write-wrap'
      }
      style={postsLength === 0 ? { textAlign: 'center' } : {}}
    >
      <button
        type="button"
        className={`btn btn-submit ${postsLength > 0 ? 'right' : ''}`}
        onClick={onWriteClick}
      >
        게시글 작성
      </button>
    </div>
  );
}
