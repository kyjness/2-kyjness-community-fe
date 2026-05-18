// 실시간 인기글: TanStack Query, 5분 staleTime으로 목록 API 호출 억제.
import { useQuery } from '@tanstack/react-query';
import { fetchTrendingPosts } from '../api/posts.js';

const STALE_TIME_MS = 5 * 60 * 1000;

function _unwrapApiList(res) {
  if (!res) return [];
  const data = res?.data ?? res;
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : [];
}

function _normalizeTrendingList(envelope) {
  return _unwrapApiList(envelope)
    .map((row) => ({
      id: row?.id,
      title: String(row?.title ?? '').trim(),
      categoryId: row?.categoryId ?? row?.category_id ?? null,
      commentCount: Number(row?.commentCount ?? row?.comment_count ?? 0),
      likeCount: Number(row?.likeCount ?? row?.like_count ?? 0),
      viewCount: Number(row?.viewCount ?? row?.view_count ?? 0),
    }))
    .filter((p) => p.id != null && p.id !== '');
}

export function useTrendingPosts({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['posts', 'trending'],
    queryFn: async () => {
      const res = await fetchTrendingPosts();
      return _normalizeTrendingList(res);
    },
    enabled,
    staleTime: STALE_TIME_MS,
  });
}
