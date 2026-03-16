// 게시글 상세 초기 상태: invalid/loading/error.
import { Header } from '../Header.jsx';

export function PostDetailFallback({ variant, error, onBack }) {
  const content = {
    invalid: <p className="post-list-message">유효하지 않은 게시글입니다.</p>,
    loading: (
      <p style={{ textAlign: 'center', padding: 40 }}>게시글을 불러오는 중...</p>
    ),
    error: (
      <>
        <p className="post-list-message">게시글을 불러올 수 없습니다.</p>
        <p style={{ color: '#777', fontSize: 12 }}>{error}</p>
        <button type="button" className="btn btn-primary" onClick={onBack}>
          목록으로 돌아가기
        </button>
      </>
    ),
  }[variant];

  return (
    <Header showBackButton backHref="/posts">
      <main className="main post-detail-main post-detail-main--fallback">
        <div className="post-detail-container post-detail-container--fallback">{content}</div>
      </main>
    </Header>
  );
}
