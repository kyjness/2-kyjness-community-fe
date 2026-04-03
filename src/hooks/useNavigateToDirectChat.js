// 상대 공개 ID로 1:1 방 조회·생성 후 /chat/:roomId?peer&title 이동.
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api/client.js';
import { getApiErrorMessage, getClientErrorCode } from '../utils/index.js';

export function useNavigateToDirectChat() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const go = useCallback(
    async (peerUserId, title) => {
      const peer = peerUserId != null ? String(peerUserId).trim() : '';
      if (!peer) return false;
      setBusy(true);
      try {
        const body = await api.get(`/chat/rooms/direct/${encodeURIComponent(peer)}`);
        const inner = body?.data;
        const raw =
          inner?.roomId ?? inner?.roomid ?? inner?.room_id;
        const roomIdStr =
          raw != null && String(raw).trim() ? String(raw).trim() : '';
        const invalid =
          !roomIdStr ||
          roomIdStr === 'None' ||
          roomIdStr === 'null' ||
          roomIdStr === 'undefined';
        if (invalid) {
          window.alert('채팅방 정보를 받지 못했습니다. (서버 응답 오류)');
          return false;
        }
        const q = new URLSearchParams();
        q.set('peer', peer);
        q.set('title', (title != null && String(title).trim()) || '채팅');
        // 경로 세그먼트는 RR이 처리하도록 pathname + search 분리(이중 인코딩·roomId 불일치 방지)
        navigate({ pathname: `/chat/${roomIdStr}`, search: `?${q.toString()}` });
        return true;
      } catch (err) {
        window.alert(
          getApiErrorMessage(
            getClientErrorCode(err),
            '채팅방을 열 수 없습니다.',
          ),
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
    [navigate],
  );

  return { go, busy };
}
