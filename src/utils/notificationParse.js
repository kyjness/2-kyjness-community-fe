// 알림 API·SSE 페이로드 파싱 (ApiResponse { code, data, message } / data.items).

/**
 * @typedef {Object} NotificationItem
 * @property {string} id
 * @property {string} kind
 * @property {string | null} actorId
 * @property {string | null} postId
 * @property {string | null} commentId
 * @property {string | null} readAt
 * @property {string | null} createdAt
 */

/**
 * @param {unknown} res
 * @returns {{ code?: string, data?: unknown, message?: string | null, requestId?: string } | null}
 */
export function parseApiEnvelope(res) {
  if (res == null || typeof res !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (res);
  const data = 'data' in o ? o.data : res;
  const code = typeof o.code === 'string' ? o.code : undefined;
  const message = o.message == null ? null : String(o.message);
  const requestId =
    typeof o.requestId === 'string'
      ? o.requestId
      : typeof o.request_id === 'string'
        ? o.request_id
        : undefined;
  return { code, data, message, requestId };
}

/**
 * @param {unknown} raw
 * @returns {NotificationItem | null}
 */
export function normalizeNotificationItem(raw) {
  if (raw == null || typeof raw !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const id =
    o.id != null
      ? String(o.id)
      : o.notificationId != null
        ? String(o.notificationId)
        : o.notification_id != null
          ? String(o.notification_id)
          : '';
  if (!id) return null;
  const kind = o.kind != null ? String(o.kind) : '';
  const actorId = o.actorId != null ? String(o.actorId) : o.actor_id != null ? String(o.actor_id) : null;
  const postId = o.postId != null ? String(o.postId) : o.post_id != null ? String(o.post_id) : null;
  const commentId =
    o.commentId != null ? String(o.commentId) : o.comment_id != null ? String(o.comment_id) : null;
  const readAt =
    o.readAt != null ? String(o.readAt) : o.read_at != null ? String(o.read_at) : null;
  const createdAt =
    o.createdAt != null ? String(o.createdAt) : o.created_at != null ? String(o.created_at) : null;
  return {
    id,
    kind,
    actorId,
    postId,
    commentId,
    readAt,
    createdAt,
  };
}

/**
 * GET /notifications 목록 응답에서 items·페이지 정보 추출.
 * @param {unknown} res
 */
export function parseNotificationListResponse(res) {
  const env = parseApiEnvelope(res);

  let page = /** @type {unknown} */ (undefined);
  if (env?.data != null && typeof env.data === 'object') {
    page = env.data;
  } else if (res != null && typeof res === 'object') {
    page = res;
  }

  if (page != null && typeof page === 'object' && !Array.isArray(page)) {
    const bag = /** @type {Record<string, unknown>} */ (page);
    const hasTopItems = Array.isArray(bag.items);
    if (!hasTopItems && bag.data != null && typeof bag.data === 'object') {
      const inner = /** @type {Record<string, unknown>} */ (bag.data);
      if (Array.isArray(inner.items) || Array.isArray(inner)) {
        page = bag.data;
      }
    }
  }

  let rawItems = [];
  let hasMore = false;
  let total = 0;

  if (Array.isArray(page)) {
    rawItems = page;
  } else if (page != null && typeof page === 'object') {
    const bag = /** @type {Record<string, unknown>} */ (page);
    const list = bag.items ?? bag.Items;
    rawItems = Array.isArray(list) ? list : [];
    hasMore = Boolean(bag.hasMore ?? bag.has_more);
    const t = bag.total ?? bag.Total;
    total = typeof t === 'number' && Number.isFinite(t) ? t : 0;
  }

  const items = rawItems.map(normalizeNotificationItem).filter(Boolean);
  return { items, hasMore, total, code: env?.code, requestId: env?.requestId };
}

/**
 * SSE `data:` JSON (실시간 페이로드) → 스토어 아이템으로 병합용.
 * @param {unknown} raw
 */
export function parseSseRealtimePayload(raw) {
  if (raw == null || typeof raw !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const nid =
    o.notificationId != null
      ? String(o.notificationId)
      : o.notification_id != null
        ? String(o.notification_id)
        : o.id != null
          ? String(o.id)
          : '';
  if (!nid) return null;
  const kind = o.kind != null ? String(o.kind) : '';
  const actorId = o.actorId != null ? String(o.actorId) : o.actor_id != null ? String(o.actor_id) : null;
  const postId = o.postId != null ? String(o.postId) : o.post_id != null ? String(o.post_id) : null;
  const commentId =
    o.commentId != null ? String(o.commentId) : o.comment_id != null ? String(o.comment_id) : null;
  const createdAt = new Date().toISOString();
  return {
    id: nid,
    kind,
    actorId,
    postId,
    commentId,
    readAt: null,
    createdAt,
  };
}
