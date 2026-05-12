export type ClusterType = 'TIME_GPS' | 'VLM_SCENE';

export interface Cluster {
  id: string;
  roomId: string;
  title: string;
  summary: string | null;
  sceneLabel: string | null;
  dayNumber: number | null;
  clusterType: ClusterType;
  thumbnailKey: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface ClusterPhoto {
  id: string;
  s3Key: string;
  thumbnailKey: string | null;
  takenAt: string | null;
  url: string;
  thumbnailUrl: string;
}

export interface UpdateClusterRequest {
  roomId: string;
  title: string;
}
