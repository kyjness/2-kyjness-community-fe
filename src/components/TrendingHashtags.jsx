import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

function unwrapApiList(res) {
  if (!res) return [];
  const data = res?.data ?? res;
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : [];
}

function rankClass(rank) {
  if (rank <= 3) return 'text-purple-600 font-extrabold';
  return 'text-gray-400 font-medium';
}

export function TrendingHashtags() {
  const navigate = useNavigate();
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleTagClick = (name) => {
    const raw = String(name ?? '').trim();
    if (!raw) return;
    const q = `#${raw}`;
    navigate(`/posts?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/posts/trending-hashtags');
        const items = unwrapApiList(res)
          .slice(0, 10)
          .map((x) => ({
            name: String(x?.name ?? '').trim(),
            count: Number(x?.count ?? 0),
          }))
          .filter((x) => x.name);
        if (alive) setHashtags(items);
      } catch (_) {
        if (alive) setHashtags([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isEmpty = !loading && (!hashtags || hashtags.length === 0);

  return (
    <section className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 pl-5 pr-3 w-full box-border border border-gray-50">
      <div className="text-[14px] font-bold text-gray-800 border-b border-gray-100 pb-4 mb-5">
        🔥 지금 뜨는 멍태그
      </div>

      {loading || isEmpty ? (
        <div className="text-xs text-gray-500 leading-relaxed">
          아직 인기 태그가 없어요 🐾
        </div>
      ) : (
        <ul className="space-y-1">
          {hashtags.map((h, idx) => {
            const rank = idx + 1;
            return (
              <li key={`${h.name}-${rank}`}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg py-3 pl-0 pr-1 text-left cursor-pointer transition-opacity hover:opacity-80 active:opacity-65 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
                  title={`#${h.name} 검색`}
                  aria-label={`${h.name} 태그로 게시글 검색`}
                  onClick={() => handleTagClick(h.name)}
                >
                  <span
                    className={`w-5 shrink-0 text-center text-[13px] tabular-nums ${rankClass(rank)}`}
                  >
                    {rank}
                  </span>
                  <span className="min-w-0 truncate text-[13px] font-medium text-gray-700">
                    #{h.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

