// 게시글 목록 페이지: usePostList 훅 + PostList 하위 컴포넌트 조합.
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Pencil, Search } from 'lucide-react';
import { Header } from '../components/Header.jsx';
import { DogProfileBanner } from '../components/DogProfileBanner.jsx';
import { usePostList } from '../hooks/usePostList.js';
import {
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
    prefetchCategory,
    searchTerm,
    setSearchTerm,
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
      <main className="main main-top post-list-main">
        <div className="flex items-start justify-center gap-10 max-w-7xl mx-auto w-full">
          <aside className="hidden lg:block w-[200px] shrink-0" aria-label="카테고리">
            <div className="sticky top-20">
              <nav className="postlist-category-plain" aria-label="게시글 카테고리">
                <button
                  type="button"
                  onClick={() => setCategoryId('all')}
                  onMouseEnter={() => prefetchCategory('all')}
                  aria-current={categoryId === 'all' ? 'page' : undefined}
                  className={[
                    'postlist-category-plain__item',
                    categoryId === 'all' ? 'is-active' : '',
                  ].join(' ')}
                >
                  전체
                </button>
                {POST_CATEGORY_OPTIONS.map((c) => {
                  const v = String(c.id);
                  const active = categoryId === v;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(v)}
                      onMouseEnter={() => prefetchCategory(v)}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'postlist-category-plain__item',
                        active ? 'is-active' : '',
                      ].join(' ')}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="w-full max-w-[590px] mx-auto lg:px-8">
            <div className="post-list-container">
              <div className={`postlist-feed ${loading ? 'is-loading' : ''}`}>
                <PostListContent
                  loading={loading}
                  error={error}
                  posts={posts}
                  loadingMore={loadingMore}
                  onCardClick={handleCardClick}
                />
              </div>
              <div ref={bottomRef} style={{ height: '20px' }} aria-hidden="true" />
            </div>
          </div>

          <aside className="hidden lg:block w-[200px] shrink-0" aria-label="게시글 검색">
            <div className="postlist-search-plain">
              <div className="postlist-search-plain__input-wrap">
                <input
                  type="text"
                  placeholder="검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="postlist-search-plain__input"
                  aria-label="게시글 검색"
                />
                <Search size={18} aria-hidden="true" className="postlist-search-plain__icon" />
              </div>
            </div>
          </aside>
        </div>
        <button
          type="button"
          className="post-list-fab"
          onClick={handleWriteClick}
          aria-label="게시글 작성"
          style={{
            bottom: showScrollTop ? 84 : 24,
          }}
        >
          <Pencil size={18} strokeWidth={2.2} color="#fff" aria-hidden="true" />
        </button>
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
