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
