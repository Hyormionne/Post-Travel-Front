import type { Cluster, ClusterPhoto } from '../../types/cluster';
import { SCENE_ICON } from '../../mocks/data';

export interface FolderCardVM {
  id: string;
  icon: string;
  title: string;
  count: number;
  keywords: string[];
  thumbnails: string[];
  clusterType: Cluster['clusterType'];
}

// sceneLabel 또는 dayNumber로 이모지 결정.
export function pickIcon(cluster: Cluster): string {
  if (cluster.sceneLabel && SCENE_ICON[cluster.sceneLabel]) return SCENE_ICON[cluster.sceneLabel];
  if (cluster.dayNumber != null) return '📅';
  return '📷';
}

// 사진들의 aiKeywords 빈도순 상위 N개.
export function topKeywords(
  photos: Array<{ aiKeywords?: string[] }>,
  n = 2,
): string[] {
  const freq = new Map<string, number>();
  for (const p of photos) {
    for (const k of p.aiKeywords ?? []) {
      freq.set(k, (freq.get(k) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

// Cluster + 사진 배열 → FolderCardVM
export function clusterToVM(
  cluster: Cluster,
  photos: Array<ClusterPhoto & { aiKeywords?: string[] }>,
): FolderCardVM {
  return {
    id: cluster.id,
    icon: pickIcon(cluster),
    title: cluster.title,
    count: photos.length,
    keywords: topKeywords(photos, 2),
    thumbnails: photos.slice(0, 3).map((p) => p.thumbnailUrl).filter(Boolean),
    clusterType: cluster.clusterType,
  };
}
