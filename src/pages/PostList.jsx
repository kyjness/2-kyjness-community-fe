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
import { POST_CATEGORY_OPTIONS } from '../utils/postMeta.js';

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
    categoryId,
    setCategoryId,
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
          <div className="flex w-full max-w-full items-center justify-center gap-3 mt-2 mb-5 self-stretch">
            <div className="flex min-w-0 flex-nowrap items-center gap-2">
              <label
                htmlFor="post-list-category"
                className="shrink-0 whitespace-nowrap text-sm font-medium text-gray-700"
              >
                카테고리
              </label>
              <select
                id="post-list-category"
                className="form-input !h-auto !min-h-9 w-[160px] !py-1.5 !pl-3 !pr-9 text-sm !leading-tight"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                aria-label="카테고리 필터"
              >
                <option value="all">전체</option>
                {POST_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
