// 게시글 목록 페이지: usePostList 훅 + PostList 하위 컴포넌트 조합.
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.jsx';
import { DogProfileBanner } from '../components/DogProfileBanner.jsx';
import { usePostList } from '../hooks/usePostList.js';
import {
  PostListGreeting,
  PostListWriteSection,
  PostListContent,
} from '../components/PostList';
import { useAuth } from '../context/AuthContext.jsx';

export function PostList() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { posts, loading, loadingMore, error } = usePostList();

  const handleWriteClick = () => {
    if (isLoggedIn) {
      navigate('/posts/new');
    } else {
      if (window.confirm('로그인이 필요한 서비스입니다. 로그인 페이지로 이동할까요?')) {
        navigate('/login');
      }
    }
  };

  const handleCardClick = (postId) => {
    navigate(`/posts/${postId}`);
  };

  return (
    <Header showProfile={true}>
      <main className="main">
        <div className="post-list-container">
          <PostListGreeting />
          <DogProfileBanner user={user} />
          <PostListWriteSection
            postsLength={posts.length}
            onWriteClick={handleWriteClick}
          />
          <PostListContent
            loading={loading}
            error={error}
            posts={posts}
            loadingMore={loadingMore}
            onCardClick={handleCardClick}
          />
        </div>
      </main>
    </Header>
  );
}
