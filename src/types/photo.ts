export type ContentType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface Photo {
  id: string;
  roomId: string;
  uploadedBy: string;
  s3Key: string;
  thumbnailKey?: string | null;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  takenAt?: string | null;
  lat?: number | null;
  lng?: number | null;
  sceneLabel?: string | null;
  aiCaption?: string | null;
  aiKeywords: string[];
  createdAt: string;
  url: string;
  thumbnailUrl?: string | null;
}

// POST /photos/presigned-urls — request
export interface PresignedUrlsRequest {
  roomId: string;
  files: Array<{
    name: string;
    size: number;
    contentType: ContentType;
  }>;
}

// POST /photos/presigned-urls — response (배열)
export type PresignedUrlsResponse = Array<{
  photoId: string;
  original: { url: string; key: string };
  thumbnail: { url: string; key: string };
}>;

// POST /photos/complete — request
export interface PhotoCompleteItem {
  photoId: string;
  s3Key: string;
  thumbnailKey?: string;
  fileSize: number;
  width?: number;
  height?: number;
  takenAt?: string;
  lat?: number;
  lng?: number;
}

export interface PhotoCompleteRequest {
  roomId: string;
  photos: PhotoCompleteItem[];
}
