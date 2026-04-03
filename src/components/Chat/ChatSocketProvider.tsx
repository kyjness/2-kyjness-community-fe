// 전역 DM WebSocket 1회 유지 — sendMessage·status는 useChat()으로 소비.
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useAuth } from '../../context/AuthContext.jsx';
import { useChatSocket, type ChatSocketStatus } from '../../hooks/useChatSocket.js';

export interface ChatContextValue {
  sendMessage: (peerUserId: string, content: string) => boolean;
  status: ChatSocketStatus;
  lastError: string | null;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isRestored, clearUser } = useAuth();
  const enabled = Boolean(isRestored && isLoggedIn);
  const { sendMessage, status, lastError } = useChatSocket({
    enabled,
    onAuthError: () => clearUser(),
  });
  const value = useMemo(
    () => ({ sendMessage, status, lastError }),
    [sendMessage, status, lastError],
  );
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within ChatSocketProvider');
  }
  return ctx;
}
