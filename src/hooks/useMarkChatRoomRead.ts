import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { api } from '../api/client.js';

export function useMarkChatRoomRead() {
  const queryClient = useQueryClient();
  return useCallback(
    async (roomId: string) => {
      const rid = roomId.trim();
      if (!rid) return;
      try {
        await api.post(`/chat/rooms/${encodeURIComponent(rid)}/read`, {});
        await queryClient.invalidateQueries({ queryKey: ['chat', 'recent-rooms'] });
      } catch (e) {
        console.warn('[markChatRoomRead]', e);
      }
    },
    [queryClient],
  );
}
