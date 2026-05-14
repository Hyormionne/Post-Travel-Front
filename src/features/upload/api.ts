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
        body: JSON.stringify({ title: body.title }),
      });
      if (!res.ok) throw new Error('createRoom failed');
      return res.json();
    },
    async () => {
      throw new Error('mock mode disabled');
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
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error('complete failed');
      return res.json();
    },
    async () => {
      throw new Error('mock mode disabled');
    },
  );
}

export async function buildCompleteItems(
  presigned: PresignedUrlsResponse,
  files: File[],
): Promise<PhotoCompleteItem[]> {
  const exifr = await import('exifr');
  return Promise.all(
    presigned.map(async (p, i) => {
      const file = files[i];
      const item: PhotoCompleteItem = {
        photoId: p.photoId,
        s3Key: p.original.key,
        thumbnailKey: p.thumbnail.key,
        fileSize: file?.size ?? 0,
      };
      if (!file) return item;
      try {
        // GPS 좌표 추출
        const gps = await exifr.gps(file).catch(() => null);
        if (gps?.latitude != null && gps?.longitude != null) {
          item.lat = gps.latitude;
          item.lng = gps.longitude;
        }
        // 나머지 EXIF 태그 추출
        const exif = await exifr.parse(file, ['DateTimeOriginal', 'ExifImageWidth', 'ExifImageHeight', 'ImageWidth', 'ImageHeight']).catch(() => null);
        if (exif) {
          if (exif.DateTimeOriginal) {
            item.takenAt = new Date(exif.DateTimeOriginal).toISOString();
          }
          const w = exif.ExifImageWidth ?? exif.ImageWidth;
          const h = exif.ExifImageHeight ?? exif.ImageHeight;
          if (w) item.width = w;
          if (h) item.height = h;
        }
        console.log(`[EXIF] ${file.name}: lat=${item.lat}, lng=${item.lng}, takenAt=${item.takenAt}`);
      } catch {
        console.log(`[EXIF] ${file.name}: parse failed`);
      }
      return item;
    }),
  );
}
