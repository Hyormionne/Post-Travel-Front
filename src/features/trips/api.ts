import type { Room } from '../../types/room';
import { API_BASE, delay, realFetch, withMockFallback } from '../../lib/mockMode';
import { MOCK_ROOM, MOCK_USER_NAMES, type TripSummary } from '../../mocks/data';

// 방 생성 시 도시 좌표를 localStorage에 저장 — 백엔드 Room에 lat/lng 필드 없음
const LOC_KEY = 'yh_room_locations';
const LOCAL_TRIPS_KEY = 'yh_local_trips';

// "도시명, N월" 형식으로 여행 제목 생성
export function formatTripTitle(cityName: string, travelDates: string[], tripName?: string): string {
  if (tripName) return tripName;
  const city = cityName.split(',')[0].trim();
  const sorted = travelDates.slice().sort();
  if (city && sorted.length > 0) {
    const month = parseInt(sorted[0].slice(5, 7));
    return `${city}, ${month}월`;
  }
  return city || '새 여행';
}

interface RoomLocation { lat: number; lng: number; }

function getStoredLocations(): Record<string, RoomLocation> {
  try {
    return JSON.parse(
      (typeof window !== 'undefined' ? localStorage.getItem(LOC_KEY) : null) ?? '{}',
    ) as Record<string, RoomLocation>;
  } catch { return {}; }
}

export function saveRoomLocation(roomId: string, lat: number, lng: number): void {
  try {
    const cur = getStoredLocations();
    cur[roomId] = { lat, lng };
    localStorage.setItem(LOC_KEY, JSON.stringify(cur));
  } catch { /* ignore */ }
}

function getLocalTrips(): TripSummary[] {
  try {
    return JSON.parse(
      (typeof window !== 'undefined' ? localStorage.getItem(LOCAL_TRIPS_KEY) : null) ?? '[]',
    ) as TripSummary[];
  } catch { return []; }
}

export function saveLocalTrip(trip: TripSummary): void {
  try {
    const cur = getLocalTrips().filter((t) => t.id !== trip.id);
    localStorage.setItem(LOCAL_TRIPS_KEY, JSON.stringify([trip, ...cur]));
  } catch { /* ignore */ }
}

function roomToTrip(room: Room, loc: RoomLocation | undefined): TripSummary {
  const d = new Date(room.createdAt);
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return {
    id: room.id,
    emoji: '✈',
    title: room.title || '새 여행',
    dates: dateStr,
    info: `멤버 ${room.members?.length ?? 1}`,
    status: '초안',
    lat: loc?.lat ?? 0,
    lng: loc?.lng ?? 0,
    year: String(d.getFullYear()),
  };
}

export async function listTrips(): Promise<TripSummary[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/rooms`, { credentials: 'include' });
      if (!res.ok) throw new Error('listTrips failed');
      const rooms: Room[] = await res.json();
      const locations = getStoredLocations();
      const apiTrips = rooms.map((r) => roomToTrip(r, locations[r.id]));
      // 로컬 저장 여행 중 API에 없는 것만 추가 (새로 생성했으나 API 반환 전 등)
      const local = getLocalTrips().filter((lt) => !apiTrips.some((at) => at.id === lt.id));
      return [...apiTrips, ...local];
    },
    async () => {
      await delay(180);
      return getLocalTrips();
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
