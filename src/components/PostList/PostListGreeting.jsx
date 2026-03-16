// 게시글 목록 인사 문구. 검색어 입력 시에는 숨김.
export function PostListGreeting({ searchTerm }) {
  if (searchTerm != null && String(searchTerm).trim() !== '') {
    return null;
  }
  return (
    <p className="post-list-greeting">
      안녕하세요,<br />
      퍼피톡 <strong>게시판</strong> 입니다.
    </p>
  );
}
