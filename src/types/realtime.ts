export type JobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PROCESSING_CALLBACK'
  | 'SUCCESS'
  | 'FAILED';

export type JobType = 'VLM_ANALYZE' | 'LLM_BLOG_DRAFT';

export interface RoomSubscribePayload {
  roomId: string;
}

export interface ClusterCreatedEvent {
  clusterId: string;
  title: string;
}

export interface PhotoProcessingProgressEvent {
  jobId: string;
  doneCount: number;
  totalCount: number;
  status: JobStatus;
}

export interface BlogUpdatedEvent {
  blogId: string;
}

export interface BlogPublishedEvent {
  blogId: string;
  title?: string;
}

export type RealtimeEvent =
  | { type: 'cluster:created'; payload: ClusterCreatedEvent }
  | { type: 'photo:processing_progress'; payload: PhotoProcessingProgressEvent }
  | { type: 'blog:updated'; payload: BlogUpdatedEvent }
  | { type: 'blog:published'; payload: BlogPublishedEvent };
