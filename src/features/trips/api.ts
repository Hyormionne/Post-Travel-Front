import type { Room } from '../../types/room';
import { API_BASE, delay, realFetch, withMockFallback } from '../../lib/mockMode';
import { MOCK_ROOM, MOCK_TRIPS, MOCK_USER_NAMES, type TripSummary } from '../../mocks/data';

export async function listTrips(): Promise<TripSummary[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/rooms`, { credentials: 'include' });
      if (!res.ok) throw new Error('listTrips failed');
      return res.json();
    },
    async () => {
      await delay(180);
      return MOCK_TRIPS;
    },
  );
}

export async function getRoom(roomId: string): Promise<Room> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/rooms/${roomId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('getRoom failed');
      return res.json();
    },
    async () => {
      await delay(150);
      return { ...MOCK_ROOM, id: roomId };
    },
  );
}

export function resolveMemberName(userId: string): string {
  return MOCK_USER_NAMES[userId] ?? userId.slice(0, 2);
}
