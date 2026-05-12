import type { Blog, CreateBlogRequest, UpdateBlogRequest } from '../../types/blog';
import { API_BASE, delay, realFetch, withMockFallback } from '../../lib/mockMode';
import { MOCK_BLOGS } from '../../mocks/data';

// 백엔드 미연결/실패 시 메모리 store가 mock 응답을 누적해 CRUD 시뮬레이션을 유지.
const blogStore: Blog[] = [...MOCK_BLOGS];

export async function listBlogs(roomId: string): Promise<Blog[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/blogs?roomId=${encodeURIComponent(roomId)}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('listBlogs failed');
      return res.json();
    },
    async () => {
      await delay(150);
      return blogStore.filter((b) => b.roomId === roomId || roomId === 'room-001');
    },
  );
}

export async function getBlog(id: string): Promise<Blog> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/blogs/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('getBlog failed');
      return res.json();
    },
    async () => {
      await delay(150);
      const b = blogStore.find((x) => x.id === id) ?? blogStore[0];
      if (!b) throw new Error('blog not found');
      return b;
    },
  );
}

export async function createBlog(body: CreateBlogRequest): Promise<Blog> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/blogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('createBlog failed');
      return res.json();
    },
    async () => {
      await delay(200);
      const now = new Date().toISOString();
      const next: Blog = {
        id: `blog-${Math.random().toString(36).slice(2, 8)}`,
        roomId: body.roomId,
        authorId: 'user-001',
        title: body.title,
        content: body.content,
        visibility: 'ROOM',
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
        photos: (body.photoIds ?? []).map((id, i) => ({ photoId: id, orderIdx: i, url: '', thumbnailUrl: '' })),
      };
      blogStore.unshift(next);
      return next;
    },
  );
}

export async function patchBlog(id: string, body: UpdateBlogRequest): Promise<Blog> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/blogs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('patchBlog failed');
      return res.json();
    },
    async () => {
      await delay(150);
      const idx = blogStore.findIndex((b) => b.id === id);
      if (idx < 0) throw new Error('blog not found');
      const cur = blogStore[idx];
      const photos =
        body.photoIds == null
          ? cur.photos
          : body.photoIds.map((pid, i) => ({ photoId: pid, orderIdx: i, url: '', thumbnailUrl: '' }));
      const next: Blog = {
        ...cur,
        title: body.title ?? cur.title,
        content: body.content ?? cur.content,
        visibility: body.visibility ?? cur.visibility,
        photos,
        updatedAt: new Date().toISOString(),
      };
      blogStore[idx] = next;
      return next;
    },
  );
}

export async function publishBlog(id: string): Promise<Blog> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/blogs/${id}/publish`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('publishBlog failed');
      return res.json();
    },
    async () => {
      await delay(250);
      const idx = blogStore.findIndex((b) => b.id === id);
      if (idx < 0) throw new Error('blog not found');
      const next: Blog = { ...blogStore[idx], publishedAt: new Date().toISOString() };
      blogStore[idx] = next;
      return next;
    },
  );
}

export async function deleteBlog(id: string): Promise<void> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/blogs/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('deleteBlog failed');
    },
    async () => {
      await delay(150);
      const idx = blogStore.findIndex((b) => b.id === id);
      if (idx >= 0) blogStore.splice(idx, 1);
    },
  );
}
