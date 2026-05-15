// 초대 토큰으로 방에 참가하는 API
import type { Room } from '../../types/room';
import { API_BASE, delay, realFetch, withMockFallback } from '../../lib/mockMode';

export async function joinRoom(token: string): Promise<Room> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/rooms/join/${encodeURIComponent(token)}`, {
        method: 'GET',
      });
      if (!res.ok) throw new Error(`joinRoom failed: ${res.status}`);
      return res.json();
    },
    async () => {
      throw new Error('mock mode disabled');
    },
  );
}
