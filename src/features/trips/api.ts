<<<<<<< HEAD
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
=======
import type { Room, TripSummary } from '../../types/room';
import type { Photo } from '../../types/photo';
import { API_BASE, realFetch } from '../../lib/mockMode';
import { getRoomIds, removeRoomId } from '../../store/roomRegistry';

async function fetchRoom(roomId: string): Promise<Room | null> {
  const res = await realFetch(`${API_BASE}/rooms/${roomId}`);
  if (!res.ok) return null;
  return res.json();
}

async function listPhotos(roomId: string): Promise<Photo[]> {
  const res = await realFetch(`${API_BASE}/photos?roomId=${encodeURIComponent(roomId)}`);
  if (!res.ok) return [];
  return res.json();
}

// GPS 없는 방은 한국 중심 근처에 약간 분산 배치
const DEFAULT_LAT = 37.5;
const DEFAULT_LNG = 127.0;

function buildTripSummary(room: Room, photos: Photo[], index: number): TripSummary {
  const withGps = photos.filter((p) => p.lat != null && p.lng != null && (p.lat !== 0 || p.lng !== 0));
  const hasGps = withGps.length > 0;
  const lat = hasGps ? withGps.reduce((s, p) => s + p.lat!, 0) / withGps.length : DEFAULT_LAT + index * 0.3;
  const lng = hasGps ? withGps.reduce((s, p) => s + p.lng!, 0) / withGps.length : DEFAULT_LNG + index * 0.3;

  const dates = photos
    .map((p) => p.takenAt)
    .filter((d): d is string => !!d)
    .sort();
  const first = dates[0] ? new Date(dates[0]) : null;
  const last = dates.length > 1 ? new Date(dates[dates.length - 1]) : first;
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const dateStr = first
    ? last && last.getTime() !== first.getTime()
      ? `${fmt(first)} — ${fmt(last)}`
      : fmt(first)
    : '';

  return {
    id: room.id,
    emoji: ((room as unknown as Record<string, unknown>).markerEmoji as string) || '✨',
    title: room.title ?? '여행',
    dates: dateStr,
    info: `사진 ${photos.length}장` + (room.members.length > 1 ? ` · 일행 ${room.members.length}` : ''),
    status: '초안',
    lat,
    lng,
    year: first ? String(first.getFullYear()) : String(new Date().getFullYear()),
    thumbnails: photos
      .map((p) => p.thumbnailUrl ?? p.url)
      .filter(Boolean)
      .slice(0, 5),
>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a
  };
}

export async function listTrips(): Promise<TripSummary[]> {
<<<<<<< HEAD
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
=======
  const roomIds = getRoomIds();
  console.log('[listTrips] roomIds from registry:', roomIds);
  if (roomIds.length === 0) {
    console.log('[listTrips] no rooms in registry');
    return [];
  }
  const results = await Promise.all(
    roomIds.map(async (roomId, i) => {
      const room = await fetchRoom(roomId);
      console.log(`[listTrips] fetchRoom(${roomId}):`, room ? 'ok' : 'null');
      if (!room) {
        removeRoomId(roomId);
        return null;
      }
      const photos = await listPhotos(room.id);
      console.log(`[listTrips] photos for ${roomId}:`, photos.length);
      const summary = buildTripSummary(room, photos, i);
      console.log(`[listTrips] summary:`, summary.lat, summary.lng, summary.emoji);
      return summary;
    }),
>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a
  );
  return results.filter((t): t is TripSummary => t !== null);
}

export async function getRoom(roomId: string): Promise<Room> {
  const res = await realFetch(`${API_BASE}/rooms/${roomId}`);
  if (!res.ok) throw new Error('getRoom failed');
  return res.json();
}

export function resolveMemberName(userId: string): string {
  return userId.slice(0, 2);
}
