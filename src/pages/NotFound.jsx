// 404 페이지: 존재하지 않는 경로 접근 시 표시.
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: 20,
      }}
    >
      <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
      <p style={{ fontSize: 16, margin: '12px 0' }}>페이지를 찾을 수 없습니다</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
