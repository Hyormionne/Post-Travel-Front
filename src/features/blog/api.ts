import type { Blog, CreateBlogRequest, UpdateBlogRequest } from '../../types/blog';
import { API_BASE, delay, realFetch, withMockFallback } from '../../lib/mockMode';

const blogStore: Blog[] = [];

export async function listBlogs(roomId: string): Promise<Blog[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/blogs?roomId=${encodeURIComponent(roomId)}`, {
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
      const res = await realFetch(`${API_BASE}/blogs/${id}`, {});
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
      const res = await realFetch(`${API_BASE}/blogs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('deleteBlog failed');
    },
    async () => {
      await delay(150);
      const idx = blogStore.findIndex((b) => b.id === id);
      if (idx >= 0) blogStore.splice(idx, 1);
    },
  );
}

// POST /blogs/:roomId/generate — AI 블로그 초안 생성 트리거
// 백엔드 GenerateBlogDto: persona?(string), photoIds?(string[]) 둘 다 optional
export async function generateBlogDraft(
  roomId: string,
  opts: { persona?: string; photoIds?: string[] } = {},
): Promise<{ jobId: string; status: string }> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/blogs/${encodeURIComponent(roomId)}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(opts),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`generateBlogDraft ${res.status}: ${text}`);
      }
      return res.json();
    },
    async () => {
      await delay(300);
      return { jobId: `mock-job-${Date.now()}`, status: 'PENDING' };
    },
  );
}
