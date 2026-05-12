export type BlogVisibility = 'PRIVATE' | 'ROOM' | 'PUBLIC';

export interface BlogPhoto {
  photoId: string;
  orderIdx: number;
  url: string;
  thumbnailUrl: string;
}

export interface Blog {
  id: string;
  roomId: string;
  authorId: string;
  title: string;
  content: string;
  visibility: BlogVisibility;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  photos: BlogPhoto[];
}

export interface CreateBlogRequest {
  roomId: string;
  title: string;
  content: string;
  photoIds?: string[];
}

export interface UpdateBlogRequest {
  title?: string;
  content?: string;
  photoIds?: string[];
  visibility?: BlogVisibility;
}
