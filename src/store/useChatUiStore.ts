import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface FloatingChatRoom {
  roomId: string;
  peerUserId: string;
  title: string;
  peerProfileImageUrl?: string;
}

export interface ChatUiState {
  isChatInboxOpen: boolean;
  floatingRoom: FloatingChatRoom | null;
}

export interface ChatUiActions {
  openChatInbox: () => void;
  closeChatInbox: () => void;
  toggleChatInbox: () => void;
  openFloatingRoom: (room: FloatingChatRoom) => void;
  closeFloatingRoom: () => void;
}

const CHAT_UI_PERSIST_KEY = 'puppytalk:chat-ui';

export const useChatUiStore = create<ChatUiState & ChatUiActions>()(
  persist(
    (set) => ({
      isChatInboxOpen: false,
      floatingRoom: null,

      openChatInbox: () => set({ isChatInboxOpen: true }),
      closeChatInbox: () => set({ isChatInboxOpen: false }),
      toggleChatInbox: () => set((s) => ({ isChatInboxOpen: !s.isChatInboxOpen })),

      openFloatingRoom: (room) =>
        set((s) => {
          const nextRoomId = room?.roomId?.trim() ?? '';
          if (!nextRoomId) return s;
          const prev = s.floatingRoom;
          if (prev?.roomId === nextRoomId) {
            return { ...s, isChatInboxOpen: false, floatingRoom: { ...prev, ...room } };
          }
          return { ...s, isChatInboxOpen: false, floatingRoom: room };
        }),

      closeFloatingRoom: () => set({ floatingRoom: null }),
    }),
    {
      name: CHAT_UI_PERSIST_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ floatingRoom: state.floatingRoom }),
    },
  ),
);

