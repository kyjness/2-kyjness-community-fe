/**
 * 개발 모드용 더미 데이터 (목록/상세/수정에서 API 실패 시 사용)
 * constants.DEV_MODE가 true일 때만 사용됨
 */

/** 상세/수정용 더미 (id -> { post, comments }) */
export const DUMMY_POST_DETAIL = {
  '1': {
    post: {
      id: '1',
      title: '첫 번째 예시 게시글',
      content: '첫 번째 예시 게시글의 본문 내용입니다. 목록에서 이 카드를 눌렀을 때 보이는 상세 페이지입니다.',
      author_nickname: '예시작성자1',
      author_profile_image: null,
      created_at: new Date().toLocaleString('ko-KR'),
      image_url: null,
      likes: 3,
      views: 15,
      isMine: true,
    },
    comments: [
      { id: 101, author_nickname: '댓글작성자A', author_profile_image: null, created_at: new Date().toLocaleString('ko-KR'), content: '첫 번째 게시글에 대한 댓글입니다.', isMine: true },
      { id: 102, author_nickname: '댓글작성자B', author_profile_image: null, created_at: new Date().toLocaleString('ko-KR'), content: '예시 댓글 하나 더 있어요.', isMine: true },
    ],
  },
  '2': {
    post: {
      id: '2',
      title: '❓ Storage 에 저장할까? Cookie 에 저장할까?',
      content: `### **1. 사용자가 방문한 페이지를 저장**

- **저장 방법**: **\`localStorage\`** 또는 **\`sessionStorage\`**
- **이유**: 사용자 세션 동안 또는 이후에도 사용자의 방문 기록을 보관해야 할 필요가 있을 수 있으므로, 세션 종료 후에도 정보를 유지하려면 **\`localStorage\`**를, 단지 현재 세션 동안만 유지하려면 **\`sessionStorage\`**를 사용하는 것이 좋습니다.

### **2. 검색 기록**

- **저장 방법**: **\`localStorage\`**
- **이유**: 사용자가 이전에 어떤 검색을 했는지 기록을 유지하여 개인화된 경험을 제공하기 위해 사용자의 검색 기록을 영구적으로 저장해야 할 필요가 있습니다. **\`localStorage\`**를 사용하면 브라우저를 닫아도 정보가 유지됩니다.

### **3. 장바구니**

- **저장 방법**: **\`localStorage\`** 또는 서버 측 데이터베이스
- **이유**: 사용자가 웹사이트를 나갔다가 다시 방문했을 때도 장바구니의 내용을 유지할 필요가 있습니다. **\`localStorage\`**는 클라이언트 측에서 쉽게 접근할 수 있으며, 서버 측 데이터베이스와 함께 사용하면 더욱 안정적인 데이터 유지가 가능합니다.`,
      author_nickname: '예시작성자2',
      author_profile_image: null,
      created_at: new Date(Date.now() - 86400000).toLocaleString('ko-KR'),
      image_url: null,
      likes: 0,
      views: 5,
      isMine: true,
    },
    comments: [
      { id: 201, author_nickname: '댓글작성자C', author_profile_image: null, created_at: new Date(Date.now() - 3600000).toLocaleString('ko-KR'), content: '두 번째 게시글 댓글입니다.', isMine: true },
    ],
  },
};

/** 수정 폼용 더미 (id -> { title, content, file }) */
export function getDummyEdit(id) {
  const d = DUMMY_POST_DETAIL[id];
  return d ? { title: d.post.title, content: d.post.content, file: null } : null;
}

/** 목록용 더미 (postList 형식) */
export function getDummyPostList() {
  return [
    {
      postId: 1,
      title: DUMMY_POST_DETAIL['1'].post.title,
      likeCount: 3,
      commentCount: 2,
      hits: 15,
      createdAt: new Date().toISOString(),
      author: { nickname: '예시작성자1', profileImageUrl: null },
    },
    {
      postId: 2,
      title: DUMMY_POST_DETAIL['2'].post.title,
      likeCount: 0,
      commentCount: 1,
      hits: 5,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      author: { nickname: '예시작성자2', profileImageUrl: null },
    },
  ];
}
