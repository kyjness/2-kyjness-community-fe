// 게시글 목록 로직: 무한 스크롤, loadPage, 목록 정규화·정렬, ref 기반 effect.
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client.js';

const PAGE_SIZE = 10;

export function usePostList() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const loadingMoreStateRef = useRef(loadingMore);
  const pageRef = useRef(page);
  hasMoreRef.current = hasMore;
  loadingRef.current = loading;
  loadingMoreStateRef.current = loadingMore;
  pageRef.current = page;

  const loadPage = useCallback(async (pageNum, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
      setError(null);
    } else {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }
    try {
      const res = await api.get(`/posts?page=${pageNum}&size=${PAGE_SIZE}`);
      const raw = res?.data;
      let list = Array.isArray(res)
        ? res
        : Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.posts)
              ? raw.posts
              : Array.isArray(raw?.items)
                ? raw.items
                : Array.isArray(raw?.list)
                  ? raw.list
                  : Array.isArray(raw?.results)
                    ? raw.results
                    : Array.isArray(res?.posts)
                      ? res.posts
                      : Array.isArray(res?.results)
                        ? res.results
                        : [];
      if (!Array.isArray(list)) list = [];
      const normalized = list.map((p) => {
        const author = p?.author ?? p?.user ?? {};
        const authorNorm = {
          ...author,
          userId: author.id ?? author.userId,
          nickname: author.nickname ?? '',
        };
        return { ...p, author: authorNorm };
      });
      const sorted = [...normalized].sort(
        (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
      );
      const hasMoreFromApi =
        typeof res?.hasMore === 'boolean'
          ? res.hasMore
          : typeof raw?.hasMore === 'boolean'
            ? raw.hasMore
            : list.length >= PAGE_SIZE;

      if (append) {
        setPosts((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const newOnes = sorted.filter((p) => !ids.has(p.id));
          return [...prev, ...newOnes];
        });
      } else {
        setPosts(sorted);
      }
      setPage((p) => p + 1);
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
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (
        ticking ||
        !hasMoreRef.current ||
        loadingRef.current ||
        loadingMoreStateRef.current
      )
        return;
      const { scrollTop, scrollHeight } = document.documentElement;
      const { innerHeight } = window;
      if (scrollTop + innerHeight >= scrollHeight - 200) {
        ticking = true;
        loadPage(pageRef.current, true);
        requestAnimationFrame(() => {
          ticking = false;
        });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadPage]);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadPage,
  };
}
