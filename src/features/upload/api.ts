// 업로드/룸 도메인 API.
import type {
  Photo,
  PhotoCompleteItem,
  PhotoCompleteRequest,
  PresignedUrlsRequest,
  PresignedUrlsResponse,
  ContentType,
} from '../../types/photo';
import type { Room, CreateRoomRequest } from '../../types/room';
import { API_BASE, delay, realFetch, withMockFallback } from '../../lib/mockMode';

const ALLOWED: ContentType[] = ['image/jpeg', 'image/png', 'image/webp'];

export function isAllowedType(t: string): t is ContentType {
  return (ALLOWED as string[]).includes(t);
}

// ── Room ──────────────────────────────────────────────
// 백엔드 CreateRoomDto는 title만 허용 (forbidNonWhitelisted: true).
// markerEmoji 등 extra 필드를 보내면 400이 난다.
// 마커 설정은 방 생성 후 PATCH /rooms/:roomId 로 별도 업데이트.
export async function createRoom(body: CreateRoomRequest): Promise<Room> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: body.title }),  // title만 전송
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`createRoom ${res.status}: ${text}`);
      }
      return res.json();
    },
    async () => {
      await delay(300);
      const now = new Date().toISOString();
      const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      return {
        id: uuid(),
        title: body.title ?? '새 여행',
        inviteToken: Math.random().toString(36).slice(2, 8),
        createdBy: 'mock-user',
        createdAt: now,
        members: [],
        markerEmoji: body.markerEmoji ?? '✨',
        markerBgColor: body.markerBgColor ?? '#d8c9a5',
        markerShape: body.markerShape ?? 'classic',
      };
    },
  );
}

// 마커 설정 업데이트 — createRoom 이후 별도 호출 (실패해도 업로드 흐름 유지)
export async function updateRoomMarker(
  roomId: string,
  marker: { markerEmoji: string; markerBgColor: string; markerShape: string },
): Promise<void> {
  await withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marker),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`updateRoomMarker ${res.status}: ${text}`);
      }
    },
    async () => { await delay(100); },
  );
}

// ── Presigned URLs ────────────────────────────────────
export async function getPresignedUrls(req: PresignedUrlsRequest): Promise<PresignedUrlsResponse> {
  if (req.files.length === 0) throw new Error('files is empty');
  if (req.files.length > 50) throw new Error('files exceeds 50');
  for (const f of req.files) {
    if (!isAllowedType(f.contentType)) throw new Error(`contentType not allowed: ${f.contentType}`);
  }

  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/photos/presigned-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        timeoutMs: 10000, // presigned URL 발급은 최대 10초
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`presigned-urls ${res.status}: ${text}`);
      }
      return res.json();
    },
    async () => {
      await delay(300);
      return req.files.map((_, i) => ({
        photoId: `photo-${Date.now()}-${i}`,
        original: { url: `mock://put/original/${i}`, key: `rooms/${req.roomId}/photos/${i}.jpg` },
        thumbnail: { url: `mock://put/thumb/${i}`, key: `rooms/${req.roomId}/thumbs/${i}.jpg` },
      }));
    },
  );
}

// ── S3 PUT ────────────────────────────────────────────
// mock://... URL이면 항상 가짜 진행률만 흘려보냄
export async function putToS3(
  url: string,
  file: File | Blob,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  if (url.startsWith('mock://')) {
    const total = file.size > 0 ? file.size : 100_000;
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      await delay(60);
      onProgress?.(Math.round((total * i) / steps), total);
    }
    return;
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    if (file instanceof File) xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded, e.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 PUT ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('S3 PUT network error'));
    xhr.send(file);
  });
}

// ── Complete ─────────────────────────────────────────
export async function completeUpload(req: PhotoCompleteRequest): Promise<Photo[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/photos/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`photos/complete ${res.status}: ${text}`);
      }
      return res.json();
    },
    async () => {
      await delay(400);
      return [];
    },
  );
}

