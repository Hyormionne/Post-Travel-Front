export interface Cluster {
  id: string;
  roomId: string;
  title: string;
  summary?: string | null;
  sceneLabel?: string | null;
  dayNumber?: number | null;
  clusterType?: string | null;
  thumbnailKey?: string | null;
  createdAt: string;
  thumbnailUrl?: string | null;
}
