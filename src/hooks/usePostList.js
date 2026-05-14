// 게시글 목록: TanStack Query useInfiniteQuery + 커서 페이지네이션 + useInView 무한 스크롤.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPostsFeedPage } from '../api/posts.js';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;

function _qFromSearch(search) {
  return new URLSearchParams(search).get('q') ?? '';
}

function _normalizePageFromEnvelope(envelope) {
  const payload = envelope?.data ?? envelope ?? {};
  const list = Array.isArray(payload.items) ? payload.items : [];
  const normalized = list.map((p) => {
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
  const hasMore = Boolean(payload.hasMore ?? payload.has_more);
  return { items: normalized, hasMore };
}

function _postsQueryKey(qTrimmed, categoryId) {
  return ['posts', 'feed', { q: qTrimmed, categoryId: categoryId ?? 'all' }];
}

function _getNextCursorFromPage(page) {
  if (!page?.hasMore || !Array.isArray(page.items) || page.items.length === 0) {
    return undefined;
  }
  const last = page.items[page.items.length - 1];
  const id = last?.id;
  if (id == null || id === '') return undefined;
  return id;
}

export function usePostList() {
  const location = useLocation();
  const initialQ = _qFromSearch(location.search);
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ.trim());
  const [categoryId, setCategoryId] = useState('all');
  const queryClient = useQueryClient();
  const debouncedSearchRef = useRef(debouncedSearch);

  useEffect(() => {
    debouncedSearchRef.current = debouncedSearch;
  }, [debouncedSearch]);

  const qTrimmed = debouncedSearch.trim();
  const queryKey = _postsQueryKey(qTrimmed, categoryId);

  const infinite = useInfiniteQuery({
    queryKey,
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const raw = await fetchPostsFeedPage({
        cursor: pageParam,
        q: qTrimmed || null,
        categoryId,
        size: PAGE_SIZE,
      });
      return _normalizePageFromEnvelope(raw);
    },
    getNextPageParam: (lastPage) => _getNextCursorFromPage(lastPage),
  });

  const {
    data,
    error,
    isPending,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = infinite;

  const posts = useMemo(() => {
    const flat = data?.pages?.flatMap((p) => p?.items ?? []) ?? [];
    const seen = new Set();
    return flat.filter((p) => {
      const id = p?.id;
      if (id == null || id === '') return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [data]);

  const { ref: bottomRef, inView } = useInView({
    rootMargin: '100px',
    threshold: 0,
    skip: !hasNextPage,
  });

  useEffect(() => {
    if (!inView || !hasNextPage || isFetchingNextPage) return;
    if (isPending) return;
    if (isFetching && !isFetchingNextPage) return;
    fetchNextPage();
  }, [
    inView,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isFetching,
    fetchNextPage,
  ]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') ?? '';
    const trimmed = q.trim();
    queueMicrotask(() => {
      setSearchTerm((prev) => (prev === q ? prev : q));
      setDebouncedSearch((prev) => (prev === trimmed ? prev : trimmed));
    });
  }, [location.search]);

  const prefetchCategory = useCallback(
    async (nextCategoryId) => {
      const q = (debouncedSearchRef.current ?? '').trim();
      const cat = nextCategoryId ?? 'all';
      const key = _postsQueryKey(q, cat);
      if (queryClient.getQueryData(key) != null) return;
      try {
        await queryClient.prefetchInfiniteQuery({
          queryKey: key,
          initialPageParam: undefined,
          queryFn: async ({ pageParam }) => {
            const raw = await fetchPostsFeedPage({
              cursor: pageParam,
              q: q || null,
              categoryId: cat,
              size: PAGE_SIZE,
            });
            return _normalizePageFromEnvelope(raw);
          },
          getNextPageParam: (lastPage) => _getNextCursorFromPage(lastPage),
        });
      } catch {
        // prefetch 실패는 무시
      }
    },
    [queryClient]
  );

  const errorMessage =
    error?.message && error.message !== 'Failed to fetch'
      ? error.message
      : error
        ? '게시글을 불러올 수 없습니다. (연결을 확인해 주세요.)'
        : null;

  return {
    posts,
    loading: isPending,
    loadingMore: isFetchingNextPage,
    hasMore: Boolean(hasNextPage),
    error: errorMessage,
    prefetchCategory,
    searchTerm,
    setSearchTerm,
    categoryId,
    setCategoryId,
    bottomRef,
  };
}
