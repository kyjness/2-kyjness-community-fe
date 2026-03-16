// 게시글 목록 페이지: usePostList 훅 + PostList 하위 컴포넌트 조합.
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from '../components/Header.jsx';
import { DogProfileBanner } from '../components/DogProfileBanner.jsx';
import { usePostList, POST_SORTS } from '../hooks/usePostList.js';
import {
  PostListGreeting,
  PostListWriteSection,
  PostListContent,
} from '../components/PostList';
import { useAuth } from '../context/AuthContext.jsx';

export function PostList() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const {
    posts,
    loading,
    loadingMore,
    error,
    searchTerm,
    setSearchTerm,
    sort,
    setSort,
    bottomRef,
  } = usePostList();

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Header showProfile={true}>
      <div className="post-list-banner-wrap">
        <DogProfileBanner user={user} />
      </div>
      <main className="main post-list-main">
        <div
          className="post-list-search-fixed"
          aria-label="게시글 검색"
        >
          <input
            type="text"
            placeholder="제목·내용 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="post-list-search-input"
            aria-label="게시글 검색"
          />
        </div>
        <div className="post-list-container">
          <PostListGreeting searchTerm={searchTerm} />
          <div className="sort-tabs" role="tablist" aria-label="정렬">
            {POST_SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                role="tab"
                aria-selected={sort === s.value}
                className={`sort-text-btn ${sort === s.value ? 'active' : ''}`}
                onClick={() => setSort(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
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
          <div ref={bottomRef} style={{ height: '20px' }} aria-hidden="true" />
        </div>
        {showScrollTop && (
          <button
            type="button"
            className="post-list-scroll-top-btn"
            onClick={scrollToTop}
            aria-label="맨 위로"
          >
            ↑
          </button>
        )}
      </main>
    </Header>
  );
}
