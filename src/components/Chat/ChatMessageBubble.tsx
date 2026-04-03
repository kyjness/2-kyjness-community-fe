// DM 말풍선: 내 메시지 오른쪽(파란), 상대 왼쪽(회색). 모바일 퍼스트 max-width.
import type { ChatMessageRow } from '../../api/api-types.js';

function formatChatTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '';
  }
}

export interface ChatMessageBubbleProps {
  message: ChatMessageRow;
  isMine: boolean;
}

export function ChatMessageBubble({ message, isMine }: ChatMessageBubbleProps) {
  const time = formatChatTime(message?.createdAt ?? '');
  return (
    <div
      className={`flex w-full min-w-0 ${isMine ? 'justify-end' : 'justify-start'}`}
      data-message-id={message?.id ?? ''}
    >
      <div
        className={`max-w-[min(100%,20rem)] sm:max-w-md break-words rounded-2xl px-3 py-2 text-[15px] leading-snug shadow-sm ${
          isMine
            ? 'rounded-br-md bg-[#2563eb] text-white'
            : 'rounded-bl-md border border-[#e5e7eb] bg-[#f3f4f6] text-[#111827]'
        }`}
      >
        <p className="whitespace-pre-wrap">{message?.content ?? ''}</p>
        <time
          className={`mt-1 block text-[11px] tabular-nums ${isMine ? 'text-blue-100' : 'text-gray-500'}`}
          dateTime={message?.createdAt ?? ''}
        >
          {time}
        </time>
      </div>
    </div>
  );
}
