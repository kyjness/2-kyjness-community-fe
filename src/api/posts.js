// 게시글 목록 API: 커서(UUIDv7 공개 ID) 기반 무한 스크롤. 첫 요청은 cursor 미포함.
import { api } from './client.js';

/**
 * @param {{ cursor?: string | null, q?: string | null, categoryId?: string | number, size: number }} p
 * @returns {Promise<unknown>} ApiResponse 래퍼 `{ data: { items, hasMore, total } }` 형태
 */
export async function fetchPostsFeedPage({ cursor, q, categoryId, size }) {
  const qs = new URLSearchParams();
  qs.set('size', String(size));
  const trimmedQ = (q ?? '').trim();
  if (trimmedQ) qs.set('q', trimmedQ);
  if (categoryId != null && categoryId !== '' && categoryId !== 'all') {
    qs.set('category_id', String(categoryId));
  }
  if (cursor != null && String(cursor).trim() !== '') {
    qs.set('cursor', String(cursor));
  }
  return api.get(`/posts?${qs.toString()}`);
}

/**
 * @returns {Promise<unknown>} ApiResponse `{ data: TrendingPost[] }`
 */
export async function fetchTrendingPosts() {
  return api.get('/posts/trending');
}
