import type { Cluster, ClusterPhoto, UpdateClusterRequest } from '../../types/cluster';
import { API_BASE, delay, realFetch, withMockFallback } from '../../lib/mockMode';

export async function fetchClusters(roomId: string): Promise<Cluster[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(`${API_BASE}/clusters?roomId=${encodeURIComponent(roomId)}`);
      if (!res.ok) throw new Error('fetchClusters failed');
      return res.json();
    },
    async () => {
      await delay(400);
      // mock: TIME_GPS 클러스터 2개 반환
      const now = new Date().toISOString();
      return [
        {
          id: `cluster-day1-${roomId}`,
          roomId,
          title: 'Day 1',
          summary: null,
          sceneLabel: null,
          dayNumber: 1,
          clusterType: 'TIME_GPS',
          thumbnailKey: null,
          createdAt: now,
          thumbnailUrl: null,
        },
        {
          id: `cluster-day2-${roomId}`,
          roomId,
          title: 'Day 2',
          summary: null,
          sceneLabel: null,
          dayNumber: 2,
          clusterType: 'TIME_GPS',
          thumbnailKey: null,
          createdAt: now,
          thumbnailUrl: null,
        },
      ] as Cluster[];
    },
  );
}

export async function fetchClusterPhotos(clusterId: string, roomId: string): Promise<ClusterPhoto[]> {
  return withMockFallback(
    async () => {
      const res = await realFetch(
        `${API_BASE}/clusters/${clusterId}/photos?roomId=${encodeURIComponent(roomId)}`,
      );
      if (!res.ok) throw new Error('fetchClusterPhotos failed');
      return res.json();
    },
    async () => {
      await delay(200);
      return [] as ClusterPhoto[];
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
      await delay(150);
      // mock: 업데이트된 클러스터를 그대로 반환
      const now = new Date().toISOString();
      return {
        id: clusterId,
        roomId: body.roomId,
        title: body.title,
        summary: null,
        sceneLabel: null,
        dayNumber: null,
        clusterType: 'TIME_GPS',
        thumbnailKey: null,
        createdAt: now,
        thumbnailUrl: null,
      } as Cluster;
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
