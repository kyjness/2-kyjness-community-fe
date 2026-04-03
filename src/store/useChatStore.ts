// 1:1 DM 메시지 목록(Zustand). 시간순 오름차순(위=과거, 아래=최신)으로 보관.
import { create } from 'zustand';

import type { ApiResponse, ChatMessageRow } from '../api/api-types.js';
import { api } from '../api/client.js';

export function normalizeChatMessage(raw: Record<string, unknown>): ChatMessageRow {
  return {
    id: String(raw.id ?? ''),
    roomId: String(raw.roomId ?? raw.roomid ?? ''),
    senderId: String(raw.senderId ?? raw.senderid ?? ''),
    content: String(raw.content ?? ''),
    isRead: Boolean(raw.isRead ?? raw.isread ?? false),
    createdAt: String(raw.createdAt ?? raw.createdat ?? ''),
  };
}

function dedupeById(list: ChatMessageRow[]): ChatMessageRow[] {
  const seen = new Set<string>();
  const out: ChatMessageRow[] = [];
  for (const m of list) {
    if (!m.id || seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
}

export interface ChatState {
  /** roomId → 시간순 오름차순 메시지 */
  messagesByRoom: Record<string, ChatMessageRow[]>;
  nextCursorByRoom: Record<string, string | null>;
  loadingOlderByRoom: Record<string, boolean>;
  loadingInitialByRoom: Record<string, boolean>;
}

export interface ChatActions {
  resetRoom: (roomId: string) => void;
  setMessages: (roomId: string, messages: ChatMessageRow[]) => void;
  /** REST 첫/재조회: API는 최신순(DESC)이므로 내부에서 역순해 오름차순으로 저장 */
  replaceWithInitialPage: (roomId: string, itemsDesc: unknown[], nextCursor: string | null) => void;
  /** 과거 페이지: API DESC 배열을 역순 후 기존 앞에 붙임 */
  prependMessages: (roomId: string, olderBatchDesc: unknown[]) => void;
  /** 실시간 수신: 맨 뒤에 추가(동일 id 중복 제거) */
  appendMessage: (roomId: string, message: ChatMessageRow) => void;
  fetchInitialMessages: (roomId: string, limit?: number) => Promise<void>;
  fetchOlderMessages: (roomId: string, limit?: number) => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  messagesByRoom: {},
  nextCursorByRoom: {},
  loadingOlderByRoom: {},
  loadingInitialByRoom: {},

  resetRoom: (roomId) =>
    set((s) => {
      const { [roomId]: _m, ...messagesByRoom } = s.messagesByRoom;
      const { [roomId]: _n, ...nextCursorByRoom } = s.nextCursorByRoom;
      const { [roomId]: _l, ...loadingOlderByRoom } = s.loadingOlderByRoom;
      const { [roomId]: _i, ...loadingInitialByRoom } = s.loadingInitialByRoom;
      return { messagesByRoom, nextCursorByRoom, loadingOlderByRoom, loadingInitialByRoom };
    }),

  setMessages: (roomId, messages) =>
    set((s) => ({
      messagesByRoom: { ...s.messagesByRoom, [roomId]: dedupeById(messages) },
    })),

  replaceWithInitialPage: (roomId, itemsDesc, nextCursor) => {
    const mapped = itemsDesc
      .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
      .map((x) => normalizeChatMessage(x));
    const asc = [...mapped].reverse();
    set((s) => ({
      messagesByRoom: { ...s.messagesByRoom, [roomId]: dedupeById(asc) },
      nextCursorByRoom: { ...s.nextCursorByRoom, [roomId]: nextCursor ?? null },
    }));
  },

  prependMessages: (roomId, olderBatchDesc) => {
    const mapped = olderBatchDesc
      .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
      .map((x) => normalizeChatMessage(x));
    const olderAsc = [...mapped].reverse();
    set((s) => {
      const prev = s.messagesByRoom[roomId] ?? [];
      const merged = dedupeById([...olderAsc, ...prev]);
      return {
        messagesByRoom: { ...s.messagesByRoom, [roomId]: merged },
      };
    });
  },

  appendMessage: (roomId, message) =>
    set((s) => {
      const prev = s.messagesByRoom[roomId] ?? [];
      if (message.id && prev.some((m) => m.id === message.id)) {
        return s;
      }
      return {
        messagesByRoom: { ...s.messagesByRoom, [roomId]: [...prev, message] },
      };
    }),

  fetchInitialMessages: async (roomId, limit = 30) => {
    if (!roomId) return;
    set((s) => ({
      loadingInitialByRoom: { ...s.loadingInitialByRoom, [roomId]: true },
    }));
    try {
      const res = (await api.get(
        `/chat/rooms/${encodeURIComponent(roomId)}/messages?limit=${limit}`,
      )) as ApiResponse<{ items?: unknown[]; nextcursor?: string | null; nextCursor?: string | null }>;
      const data = res?.data;
      const items = Array.isArray(data?.items) ? data.items : [];
      const nextRaw = data?.nextCursor ?? data?.nextcursor;
      const nextCursor = nextRaw != null && String(nextRaw).length > 0 ? String(nextRaw) : null;
      get().replaceWithInitialPage(roomId, items, nextCursor);
    } finally {
      set((s) => ({
        loadingInitialByRoom: { ...s.loadingInitialByRoom, [roomId]: false },
      }));
    }
  },

  fetchOlderMessages: async (roomId, limit = 30) => {
    if (!roomId) return;
    const cursor = get().nextCursorByRoom[roomId];
    if (cursor == null || cursor === '') return;
    set((s) => ({
      loadingOlderByRoom: { ...s.loadingOlderByRoom, [roomId]: true },
    }));
    try {
      const q = new URLSearchParams({ limit: String(limit), cursor: cursor });
      const res = (await api.get(
        `/chat/rooms/${encodeURIComponent(roomId)}/messages?${q.toString()}`,
      )) as ApiResponse<{ items?: unknown[]; nextcursor?: string | null; nextCursor?: string | null }>;
      const data = res?.data;
      const items = Array.isArray(data?.items) ? data.items : [];
      const nextRaw = data?.nextCursor ?? data?.nextcursor;
      const nextCursor = nextRaw != null && String(nextRaw).length > 0 ? String(nextRaw) : null;
      get().prependMessages(roomId, items);
      set((s) => ({
        nextCursorByRoom: { ...s.nextCursorByRoom, [roomId]: nextCursor },
      }));
    } finally {
      set((s) => ({
        loadingOlderByRoom: { ...s.loadingOlderByRoom, [roomId]: false },
      }));
    }
  },
}));
