// 게시글 목록 로직: 무한 스크롤, 검색(debounce 500ms), loadPage, 목록 정규화·정렬, ref 기반 effect.
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client.js';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;

/** 게시글 정렬: 최신순, 인기순, 조회순, 등록순 */
export const POST_SORTS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'views', label: '조회순' },
  { value: 'oldest', label: '등록순' },
];

export function usePostList() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('latest');

  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const loadingMoreStateRef = useRef(loadingMore);
  const pageRef = useRef(page);
  const debouncedSearchRef = useRef(debouncedSearch);
  const sortRef = useRef(sort);
  const bottomRef = useRef(null);
  hasMoreRef.current = hasMore;
  loadingRef.current = loading;
  loadingMoreStateRef.current = loadingMore;
  pageRef.current = page;
  debouncedSearchRef.current = debouncedSearch;
  sortRef.current = sort;

  const loadPage = useCallback(async (pageNum, append = false, params = null) => {
    const searchQ = (params?.q ?? debouncedSearchRef.current?.trim()) || null;
    const srt = params?.sort ?? sortRef.current;
    if (pageNum === 1) {
      setLoading(true);
      setError(null);
    } else {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }
    const qs = new URLSearchParams();
    qs.set('page', String(pageNum));
    qs.set('size', String(PAGE_SIZE));
    if (searchQ) qs.set('q', searchQ);
    if (srt && srt !== 'latest') qs.set('sort', srt);
    try {
      const res = await api.get(`/posts?${qs.toString()}`);
      const payload = res?.data?.data ?? res?.data ?? {};
      const list = Array.isArray(payload?.items) ? payload.items : [];
      const normalized = list.map((p) => {
        const author = p?.author ?? p?.user ?? {};
        const authorNorm = {
          ...author,
          userId: author.id ?? author.userId,
          nickname: author.nickname ?? '',
        };
        return { ...p, author: authorNorm };
      });
      const sorted = normalized;
      const hasMoreFromApi =
        payload?.hasMore ?? payload?.has_more ?? (list.length >= PAGE_SIZE);

      if (append) {
        setPosts((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const newOnes = sorted.filter((p) => !ids.has(p.id));
          return [...prev, ...newOnes];
        });
      } else {
        setPosts(sorted);
      }
      setPage(pageNum + 1);
      setHasMore(hasMoreFromApi);
    } catch (err) {
      if (pageNum === 1) {
        const msg =
          err?.message && err.message !== 'Failed to fetch'
            ? err.message
            : '게시글을 불러올 수 없습니다. (연결을 확인해 주세요.)';
        setError(msg);
        setPosts([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadPage(1, false, {
      q: debouncedSearch.trim() || null,
      sort,
    });
  }, [debouncedSearch, sort, loadPage]);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          !entries[0]?.isIntersecting ||
          !hasMoreRef.current ||
          loadingRef.current ||
          loadingMoreStateRef.current
        )
          return;
        loadPage(pageRef.current, true, {
          q: debouncedSearchRef.current?.trim() || null,
          sort: sortRef.current,
        });
      },
      { root: null, rootMargin: '100px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, posts.length, loadPage]);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadPage,
    searchTerm,
    setSearchTerm,
    sort,
    setSort,
    bottomRef,
  };
}
