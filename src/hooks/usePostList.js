// 게시글 목록 로직: 무한 스크롤, 검색(debounce 500ms), loadPage, 목록 정규화·정렬, ref 기반 effect.
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client.js';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;

function _makeCacheKey(searchQ, categoryId) {
  const q = (searchQ ?? '').trim();
  const cat = categoryId ?? 'all';
  return `${cat}::${q}`;
}

export function usePostList() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all'); // 'all' | number(string)

  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const loadingMoreStateRef = useRef(loadingMore);
  const pageRef = useRef(page);
  const debouncedSearchRef = useRef(debouncedSearch);
  const categoryRef = useRef(categoryId);
  const bottomRef = useRef(null);
  const cacheRef = useRef(new Map());
  const prefetchInFlightRef = useRef(new Map());
  hasMoreRef.current = hasMore;
  loadingRef.current = loading;
  loadingMoreStateRef.current = loadingMore;
  pageRef.current = page;
  debouncedSearchRef.current = debouncedSearch;
  categoryRef.current = categoryId;

  const prefetchCategory = useCallback(async (nextCategoryId) => {
    const q = (debouncedSearchRef.current ?? '').trim();
    const cat = nextCategoryId ?? 'all';
    const cacheKey = _makeCacheKey(q, cat);

    if (cacheRef.current.has(cacheKey)) return;
    if (prefetchInFlightRef.current.has(cacheKey)) return;

    const qs = new URLSearchParams();
    qs.set('page', '1');
    qs.set('size', String(PAGE_SIZE));
    if (q) qs.set('q', q);
    if (cat && cat !== 'all') qs.set('category_id', String(cat));

    const p = (async () => {
      try {
        const res = await api.get(`/posts?${qs.toString()}`);
        const payload = res?.data ?? {};
        const list = Array.isArray(payload.items) ? payload.items : [];
        const normalized = list.map((item) => {
          const rawAuthor = item?.author ?? item?.user ?? null;
          const authorNorm =
            rawAuthor && typeof rawAuthor === 'object'
              ? {
                  ...rawAuthor,
                  userId: rawAuthor.id ?? rawAuthor.userId,
                  nickname: rawAuthor.nickname ?? '',
                }
              : null;
          return { ...item, author: authorNorm };
        });
        const hasMoreFromApi = payload.hasMore ?? (list.length >= PAGE_SIZE);
        cacheRef.current.set(cacheKey, {
          posts: normalized,
          page: 2,
          hasMore: hasMoreFromApi,
        });
      } catch (_) {
        // Prefetch는 UX 최적화용: 실패해도 무시(Fail-silent).
      } finally {
        prefetchInFlightRef.current.delete(cacheKey);
      }
    })();

    prefetchInFlightRef.current.set(cacheKey, p);
    await p;
  }, []);

  const loadPage = useCallback(async (pageNum, append = false, params = null) => {
    const searchQ = (params?.q ?? debouncedSearchRef.current?.trim()) || null;
    const cat = params?.categoryId ?? categoryRef.current;
    const cacheKey = _makeCacheKey(searchQ || '', cat);
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
    // 백엔드 Query 이름은 snake_case `category_id` (camelCase categoryId는 무시됨).
    if (cat && cat !== 'all') qs.set('category_id', String(cat));
    try {
      const res = await api.get(`/posts?${qs.toString()}`);
      const payload = res?.data ?? {};
      const list = Array.isArray(payload.items) ? payload.items : [];
      const normalized = list.map((p) => {
        // author가 null(탈퇴/파기)일 수 있으므로 null을 보존한다.
        const rawAuthor = p?.author ?? p?.user ?? null;
        const authorNorm =
          rawAuthor && typeof rawAuthor === 'object'
            ? {
                ...rawAuthor,
                userId: rawAuthor.id ?? rawAuthor.userId,
                nickname: rawAuthor.nickname ?? '',
              }
            : null;
        return { ...p, author: authorNorm };
      });
      const sorted = normalized;
      const hasMoreFromApi =
        payload.hasMore ?? (list.length >= PAGE_SIZE);

      if (append) {
        setPosts((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const newOnes = sorted.filter((p) => !ids.has(p.id));
          const merged = [...prev, ...newOnes];
          cacheRef.current.set(cacheKey, {
            posts: merged,
            page: pageNum + 1,
            hasMore: hasMoreFromApi,
          });
          return merged;
        });
      } else {
        setPosts(sorted);
        cacheRef.current.set(cacheKey, {
          posts: sorted,
          page: pageNum + 1,
          hasMore: hasMoreFromApi,
        });
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
        // SWR: 새 응답이 오기 전까지는 기존(stale) 데이터를 유지한다.
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
    const q = debouncedSearch.trim() || '';
    const key = _makeCacheKey(q, categoryId);
    const cached = cacheRef.current.get(key);
    if (cached) {
      // 즉시 표시: 캐시된 데이터(또는 직전 방문 데이터)를 먼저 보여준다.
      setPosts(cached.posts);
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setError(null);
    } else {
      setPage(1);
      setHasMore(true);
    }
    loadPage(1, false, {
      q: q || null,
      categoryId,
    });
  }, [debouncedSearch, categoryId, loadPage]);

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
          categoryId: categoryRef.current,
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
    prefetchCategory,
    searchTerm,
    setSearchTerm,
    categoryId,
    setCategoryId,
    bottomRef,
  };
}
