import type { Cluster, ClusterPhoto, UpdateClusterRequest } from '../../types/cluster';
import { API_BASE, delay, realFetch, withMockFallback } from '../../lib/mockMode';
import { MOCK_CLUSTERS, MOCK_CLUSTER_PHOTOS } from '../../mocks/data';

export async function fetchClusters(roomId: string): Promise<Cluster[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/clusters?roomId=${encodeURIComponent(roomId)}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('fetchClusters failed');
      return res.json();
    },
    async () => {
      await delay(250);
      return MOCK_CLUSTERS.filter((c) => c.roomId === roomId || roomId === 'room-001');
    },
  );
}

export async function fetchClusterPhotos(clusterId: string, roomId: string): Promise<ClusterPhoto[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(
        `${API_BASE}/clusters/${clusterId}/photos?roomId=${encodeURIComponent(roomId)}`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('fetchClusterPhotos failed');
      return res.json();
    },
    async () => {
      await delay(120);
      return MOCK_CLUSTER_PHOTOS[clusterId] ?? [];
    },
  );
}

export async function patchClusterTitle(clusterId: string, body: UpdateClusterRequest): Promise<Cluster> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/clusters/${clusterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('patchClusterTitle failed');
      return res.json();
    },
    async () => {
      await delay(150);
      const c = MOCK_CLUSTERS.find((x) => x.id === clusterId);
      if (!c) throw new Error('cluster not found');
      return { ...c, title: body.title };
    },
  );
}

export async function triggerBlogDraft(roomId: string): Promise<{ jobId: string }> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/blogs/${roomId}/generate`, {
        method: 'POST',
        credentials: 'include',
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
