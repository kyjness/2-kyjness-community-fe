// DM 말풍선: 내 메시지 오른쪽(파란), 상대 왼쪽(회색). 모바일 퍼스트 max-width.
import type { ChatMessageRow } from '../../api/api-types.js';

export interface ChatMessageBubbleProps {
  message: ChatMessageRow;
  isMine: boolean;
}

export function ChatMessageBubble({ message, isMine }: ChatMessageBubbleProps) {
  return (
    <div
      className={`max-w-[min(100%,18rem)] sm:max-w-sm break-words rounded-2xl px-2.5 py-1.5 text-[14px] leading-snug shadow-sm ${
        isMine
          ? 'rounded-br-md border border-transparent bg-[#2563eb] text-white'
          : 'rounded-bl-md border border-[#e5e7eb] bg-[#f3f4f6] text-[#111827]'
      }`}
      data-message-id={message?.id ?? ''}
    >
      <p className="whitespace-pre-wrap">{message?.content ?? ''}</p>
    </div>
  );
}
