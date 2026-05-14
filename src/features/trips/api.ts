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
  };
}

export async function listTrips(): Promise<TripSummary[]> {
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
