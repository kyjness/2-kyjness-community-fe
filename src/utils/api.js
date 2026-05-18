/** ApiResponse 래퍼에서 `data`만 꺼냄 (camelCase 전제). */
export function unwrapApiData(res) {
  if (res == null || typeof res !== 'object') return null;
  return res.data ?? null;
}
