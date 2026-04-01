// 알림 드롭다운 본문: 로딩·목록·모두 읽음.
import { NotificationItem } from './NotificationItem.jsx';

export function NotificationList({ items, loading, error, listTotal = 0, onMarkRead, onMarkAllRead }) {
  return (
    <div className="notification-list flex flex-col gap-1 min-w-[280px] max-w-[min(100vw-2rem,360px)]">
      <div className="flex items-center justify-between gap-2 px-1 pb-2 border-b border-stone-200/80">
        <span className="text-xs font-semibold text-stone-700">알림</span>
        <button
          type="button"
          className="text-[11px] text-stone-600 hover:text-stone-900 underline-offset-2 hover:underline disabled:opacity-40"
          onClick={() => onMarkAllRead?.()}
          disabled={loading || items.length === 0}
        >
          모두 읽음
        </button>
      </div>
      {loading && (
        <p className="text-xs text-stone-500 py-6 text-center">불러오는 중…</p>
      )}
      {!loading && error && (
        <p className="text-xs text-red-600 py-4 text-center">알림을 불러오지 못했습니다.</p>
      )}
      {!loading && !error && items.length === 0 && listTotal > 0 && (
        <p className="text-xs text-amber-800 py-4 text-center px-1">
          서버에는 알림이 {listTotal}건 있는데 화면에 표시하지 못했습니다. 새로고침 후 다시 시도해 주세요.
        </p>
      )}
      {!loading && !error && items.length === 0 && listTotal === 0 && (
        <p className="text-xs text-stone-500 py-6 text-center">받은 알림이 없습니다.</p>
      )}
      {!loading &&
        !error &&
        items.map((item) => (
          <NotificationItem key={item.id} item={item} onMarkRead={onMarkRead} />
        ))}
    </div>
  );
}
