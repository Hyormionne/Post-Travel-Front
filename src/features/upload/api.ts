// 업로드/룸 도메인 API. 실 API 시도 → 실패 시 mock 폴백.
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
import { MOCK_PHOTOS, MOCK_ROOM } from '../../mocks/data';

const ALLOWED: ContentType[] = ['image/jpeg', 'image/png', 'image/webp'];

export function isAllowedType(t: string): t is ContentType {
  return (ALLOWED as string[]).includes(t);
}

// ── Room ──────────────────────────────────────────────
export async function createRoom(body: CreateRoomRequest): Promise<Room> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('createRoom failed');
      return res.json();
    },
    async () => {
      await delay(250);
      return {
        ...MOCK_ROOM,
        id: `room-${Math.random().toString(36).slice(2, 8)}`,
        title: body.title ?? '새 여행',
        createdAt: new Date().toISOString(),
      };
    },
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
        credentials: 'include',
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error('presigned-urls failed');
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
// mock://... URL이면 항상 가짜 진행률만 흘려보냄 (presigned 폴백이 mock URL을 발급한 경우).
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
        credentials: 'include',
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error('complete failed');
      return res.json();
    },
    async () => {
      await delay(200);
      return MOCK_PHOTOS.slice(0, req.photos.length);
    },
  );
}

export function buildCompleteItems(
  presigned: PresignedUrlsResponse,
  files: File[],
): PhotoCompleteItem[] {
  return presigned.map((p, i) => ({
    photoId: p.photoId,
    s3Key: p.original.key,
    thumbnailKey: p.thumbnail.key,
    fileSize: files[i]?.size ?? 0,
  }));
}
