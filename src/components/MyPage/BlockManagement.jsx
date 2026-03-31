// 차단 유저 관리: GET /users/me/blocks 목록 표시, 차단 해제 시 POST /users/{id}/block 토글.
import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { DEFAULT_PROFILE_IMAGE } from '../../config.js';
import { getApiErrorMessage, getClientErrorCode } from '../../utils/index.js';

export function BlockManagement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBlocks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/me/blocks');
      const payload = res?.data ?? {};
      const items = Array.isArray(payload.items) ? payload.items : [];
      setList(items);
    } catch (err) {
      setError(getApiErrorMessage(getClientErrorCode(err), '차단 목록을 불러오지 못했습니다.'));
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleUnblock = async (userId) => {
    const prevList = list;
    const nextList = prevList.filter((item) => item.id !== userId);
    setList(nextList);
    try {
      await api.post(`/users/${userId}/block`);
    } catch (err) {
      const msg = getApiErrorMessage(getClientErrorCode(err), '차단 해제에 실패했습니다.');
      alert(msg);
      setError(msg);
      setList(prevList);
    }
  };

  const avatarUrl = (item) => item?.profileImageUrl ?? DEFAULT_PROFILE_IMAGE;

  return (
    <div className="pb-6 max-w-[600px] w-full mypage-form-center">
      <h2 className="form-title text-[16px] mb-4">차단 관리</h2>
      {error && (
        <p className="text-red-500 text-sm mb-3" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <ul className="block-management-list list-none p-0 m-0" aria-label="차단 목록 로딩">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="block-management-item block-skeleton-row flex items-center justify-between gap-4 py-6 border-b border-gray-200 last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="block-skeleton-avatar" aria-hidden="true" />
                <div className="block-skeleton-name" aria-hidden="true" />
              </div>
              <div className="block-skeleton-btn" aria-hidden="true" />
            </li>
          ))}
        </ul>
      ) : list.length === 0 ? (
        <p className="block-management-placeholder text-gray-600 text-sm m-0">
          차단한 유저가 없습니다.
        </p>
      ) : (
        <ul className="block-management-list list-none p-0 m-0">
          {list.map((item) => (
            <li
              key={item.id}
              className="block-management-item flex items-center justify-between gap-4 py-6 border-b border-gray-200 last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={avatarUrl(item)}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0 bg-gray-200"
                  onError={(e) => {
                    if (e.target.src !== DEFAULT_PROFILE_IMAGE) {
                      e.target.src = DEFAULT_PROFILE_IMAGE;
                    }
                  }}
                />
                <span className="font-medium text-gray-800 truncate">
                  {item.nickname ?? ''}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary text-sm shrink-0 disabled:opacity-50"
                onClick={() => handleUnblock(item.id)}
              >
                차단 해제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
