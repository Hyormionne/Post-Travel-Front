import type { Cluster, ClusterPhoto, UpdateClusterRequest } from '../../types/cluster';
import { API_BASE, delay, realFetch, withMockFallback } from '../../lib/mockMode';

export async function fetchClusters(roomId: string): Promise<Cluster[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/clusters?roomId=${encodeURIComponent(roomId)}`, {
      });
      if (!res.ok) throw new Error('fetchClusters failed');
      return res.json();
    },
    async () => {
      throw new Error('mock mode disabled');
    },
  );
}

export async function fetchClusterPhotos(clusterId: string, roomId: string): Promise<ClusterPhoto[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(
        `${API_BASE}/clusters/${clusterId}/photos?roomId=${encodeURIComponent(roomId)}`,
        {},
      );
      if (!res.ok) throw new Error('fetchClusterPhotos failed');
      return res.json();
    },
    async () => {
      throw new Error('mock mode disabled');
    },
  );
}

export async function patchClusterTitle(clusterId: string, body: UpdateClusterRequest): Promise<Cluster> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/clusters/${clusterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('patchClusterTitle failed');
      return res.json();
    },
    async () => {
      throw new Error('mock mode disabled');
    },
  );
}

export async function triggerBlogDraft(roomId: string): Promise<{ jobId: string }> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/blogs/${roomId}/generate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('triggerBlogDraft failed');
      return res.json();
    },
    async () => {
      await delay(120);
      return { jobId: `job-${Date.now()}` };
    },
  );
}
