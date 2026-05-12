import type { Room } from '../types/room';
import type { Photo } from '../types/photo';
import type { Cluster, ClusterPhoto } from '../types/cluster';
import type { Blog } from '../types/blog';
import type { PhotoProcessingProgressEvent } from '../types/realtime';

// ─ User ─────────────────────────────────────────
export const MOCK_USER = {
  id: 'user-001',
  nickname: '나',
  email: 'me@example.com',
};

// userId → nickname (API에 없으므로 임시 매핑)
export const MOCK_USER_NAMES: Record<string, string> = {
  'user-001': '나',
  'user-002': '지원',
  'user-003': '민호',
};

// ─ Room ─────────────────────────────────────────
export const MOCK_ROOM: Room = {
  id: 'room-001',
  title: '홋카이도, 5월',
  inviteToken: 'invite-4Kj9aBcDe',
  createdBy: 'user-001',
  createdAt: '2025-05-12T00:00:00.000Z',
  members: [
    { id: 'm1', roomId: 'room-001', userId: 'user-001', role: 'OWNER', joinedAt: '2025-05-12T00:00:00.000Z' },
    { id: 'm2', roomId: 'room-001', userId: 'user-002', role: 'MEMBER', joinedAt: '2025-05-12T01:00:00.000Z' },
    { id: 'm3', roomId: 'room-001', userId: 'user-003', role: 'MEMBER', joinedAt: '2025-05-12T02:00:00.000Z' },
  ],
};

// ─ Photos ───────────────────────────────────────
const KW_SETS = [
  ['ramen', 'noodle', 'food'],
  ['snow', 'mountain', 'landscape'],
  ['selfie', 'group', 'person'],
  ['cherry', 'street', 'flower'],
];

export const MOCK_PHOTOS: Photo[] = Array.from({ length: 47 }, (_, i) => ({
  id: `photo-${String(i + 1).padStart(3, '0')}`,
  roomId: 'room-001',
  uploadedBy: 'user-001',
  s3Key: `rooms/room-001/photos/photo-${i + 1}.jpg`,
  thumbnailKey: `rooms/room-001/thumbs/photo-${i + 1}.jpg`,
  fileSize: 3000000 + ((i * 173) % 5000000),
  width: 4032,
  height: 3024,
  takenAt: new Date(Date.UTC(2025, 4, 12 + Math.floor(i / 12), 6 + (i % 12))).toISOString(),
  lat: 43.06 + ((i * 0.013) % 0.5),
  lng: 141.35 + ((i * 0.027) % 0.8),
  sceneLabel: ['food', 'snow', 'person', 'flower'][i % 4],
  aiCaption: null,
  aiKeywords: KW_SETS[i % 4],
  createdAt: new Date(Date.UTC(2025, 4, 16, 10, i)).toISOString(),
  url: '',
  thumbnailUrl: '',
}));

// ─ Clusters ─────────────────────────────────────
export const MOCK_CLUSTERS: Cluster[] = [
  {
    id: 'cl-sapporo-food', roomId: 'room-001',
    title: '삿포로의 맛', summary: '라멘과 스시',
    sceneLabel: 'food', dayNumber: null, clusterType: 'VLM_SCENE',
    thumbnailKey: null, thumbnailUrl: null,
    createdAt: '2025-05-17T09:00:00.000Z',
  },
  {
    id: 'cl-biei-snow', roomId: 'room-001',
    title: '비에이의 하얀 풍경', summary: '눈 덮인 자작나무 길',
    sceneLabel: 'snow', dayNumber: null, clusterType: 'VLM_SCENE',
    thumbnailKey: null, thumbnailUrl: null,
    createdAt: '2025-05-17T09:00:30.000Z',
  },
  {
    id: 'cl-us', roomId: 'room-001',
    title: '우리들', summary: null,
    sceneLabel: 'person', dayNumber: null, clusterType: 'VLM_SCENE',
    thumbnailKey: null, thumbnailUrl: null,
    createdAt: '2025-05-17T09:01:00.000Z',
  },
  {
    id: 'cl-spring', roomId: 'room-001',
    title: '거리의 봄', summary: '벚꽃과 거리',
    sceneLabel: 'flower', dayNumber: null, clusterType: 'VLM_SCENE',
    thumbnailKey: null, thumbnailUrl: null,
    createdAt: '2025-05-17T09:01:30.000Z',
  },
];

// 클러스터별 소속 사진 (count, keywords, 썸네일 스택 계산용)
export const MOCK_CLUSTER_PHOTOS: Record<string, ClusterPhoto[]> = {
  'cl-sapporo-food': MOCK_PHOTOS.filter((p) => p.sceneLabel === 'food').map((p) => ({
    id: p.id, s3Key: p.s3Key, thumbnailKey: p.thumbnailKey ?? null,
    takenAt: p.takenAt ?? null, url: p.url, thumbnailUrl: p.thumbnailUrl ?? '',
  })),
  'cl-biei-snow': MOCK_PHOTOS.filter((p) => p.sceneLabel === 'snow').map((p) => ({
    id: p.id, s3Key: p.s3Key, thumbnailKey: p.thumbnailKey ?? null,
    takenAt: p.takenAt ?? null, url: p.url, thumbnailUrl: p.thumbnailUrl ?? '',
  })),
  'cl-us': MOCK_PHOTOS.filter((p) => p.sceneLabel === 'person').map((p) => ({
    id: p.id, s3Key: p.s3Key, thumbnailKey: p.thumbnailKey ?? null,
    takenAt: p.takenAt ?? null, url: p.url, thumbnailUrl: p.thumbnailUrl ?? '',
  })),
  'cl-spring': MOCK_PHOTOS.filter((p) => p.sceneLabel === 'flower').map((p) => ({
    id: p.id, s3Key: p.s3Key, thumbnailKey: p.thumbnailKey ?? null,
    takenAt: p.takenAt ?? null, url: p.url, thumbnailUrl: p.thumbnailUrl ?? '',
  })),
};

// sceneLabel → 이모지 매핑
export const SCENE_ICON: Record<string, string> = {
  food: '🍣',
  snow: '❄️',
  person: '👥',
  flower: '🌸',
  beach: '🌊',
  city: '🏙️',
  landscape: '🏞️',
  street: '🚶',
};

// ─ Blogs ────────────────────────────────────────
export const MOCK_BLOGS: Blog[] = [
  {
    id: 'blog-1', roomId: 'room-001', authorId: 'user-001',
    title: '오전 6시, 비에이의 안개',
    content:
      '오전 6시, 비에이의 들판에 도착했다. 안개가 천천히 걷히기 시작했고, 자작나무 길은 마치 다른 세계처럼 보였다. 차가운 공기가 폐를 가득 채울 때마다 여행의 시작을 실감했다.',
    visibility: 'ROOM',
    publishedAt: null,
    createdAt: '2025-05-17T10:00:00.000Z',
    updatedAt: '2025-05-17T10:30:00.000Z',
    photos: [
      { photoId: 'photo-005', orderIdx: 0, url: '', thumbnailUrl: '' },
    ],
  },
  {
    id: 'blog-2', roomId: 'room-001', authorId: 'user-001',
    title: '삿포로 라멘 골목 산책',
    content:
      '저녁이 되자 라멘 가게 앞으로 줄이 길게 늘어섰다. 삿포로 라멘 골목에서 처음 먹은 미소 라멘은 지금까지 먹어본 것 중 가장 진한 맛이었다.',
    visibility: 'ROOM',
    publishedAt: '2025-05-18T15:00:00.000Z',
    createdAt: '2025-05-18T12:00:00.000Z',
    updatedAt: '2025-05-18T14:50:00.000Z',
    photos: [
      { photoId: 'photo-001', orderIdx: 0, url: '', thumbnailUrl: '' },
    ],
  },
];

// ─ Trips (메인 맵 + 타임라인 진입 데이터) ─────────
export interface TripSummary {
  id: string;
  emoji: string;
  title: string;
  dates: string;
  info: string;
  status: '발행됨' | '초안' | '작성중';
  lat: number;
  lng: number;
  year: string;
}

export const MOCK_TRIPS: TripSummary[] = [
  { id: 'room-001', emoji: '✨', title: '홋카이도, 5월의 봄', dates: '2025.05.12 — 05.16', info: '5일 · 사진 127 · 일행 3', status: '발행됨', lat: 43.2203, lng: 142.8635, year: '2025' },
  { id: 'room-002', emoji: '🌸', title: '서울, 봄 산책', dates: '2025.04.22', info: '하루 · 사진 38', status: '초안', lat: 37.5665, lng: 126.9780, year: '2025' },
  { id: 'room-003', emoji: '🌊', title: '부산 주말', dates: '2025.03.08 — 03.09', info: '2일 · 사진 64 · 일행 2', status: '발행됨', lat: 35.1796, lng: 129.0756, year: '2025' },
  { id: 'room-004', emoji: '🍜', title: '삿포로의 맛', dates: '2025.05.12 — 05.16', info: '5일 · 일행 3', status: '발행됨', lat: 43.0642, lng: 141.3469, year: '2025' },
  { id: 'room-005', emoji: '🍂', title: '교토 가을', dates: '2024.11.02 — 11.05', info: '4일 · 일행 2', status: '발행됨', lat: 35.0116, lng: 135.7681, year: '2024' },
];

export const MOCK_WRITING_IN_PROGRESS = { roomId: 'room-006', title: '대구 출장', elapsed: '2분 전' };

// ─ 폴더 사이드바 (Phase 2) ────────────────────────
export const MOCK_FOLDERS = [
  { n: '최근', c: 47 },
  { n: '5월', c: 124 },
  { n: '4월', c: 86 },
  { n: '★', c: 32 },
  { n: '☁ GP', c: 1240 },
];

// ─ WebSocket 이벤트 시뮬레이션 ────────────────────
export const MOCK_PROGRESS_STREAM: PhotoProcessingProgressEvent[] = [
  { jobId: 'job-1', doneCount: 0, totalCount: 5, status: 'PENDING' },
  { jobId: 'job-1', doneCount: 1, totalCount: 5, status: 'RUNNING' },
  { jobId: 'job-1', doneCount: 2, totalCount: 5, status: 'RUNNING' },
  { jobId: 'job-1', doneCount: 3, totalCount: 5, status: 'RUNNING' },
  { jobId: 'job-1', doneCount: 4, totalCount: 5, status: 'RUNNING' },
  { jobId: 'job-1', doneCount: 5, totalCount: 5, status: 'PROCESSING_CALLBACK' },
  { jobId: 'job-1', doneCount: 5, totalCount: 5, status: 'SUCCESS' },
];

// ─ 알림 누적용 (Phase 5 C) ────────────────────────
export interface MockNotification {
  id: string;
  kind: 'blog:published' | 'photo:processing_progress' | 'member:added_photos';
  title: string;
  meta: string;
  highlight?: boolean;
  progress?: number;
  actor?: string;
  blogId?: string;
  roomId?: string;
  jobId?: string;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'n1', kind: 'blog:published', blogId: 'blog-1', roomId: 'room-001',
    title: "'홋카이도, 5월' 초안 완성", meta: '방금 · 사진 47', highlight: true,
  },
  {
    id: 'n2', kind: 'photo:processing_progress', jobId: 'job-2', roomId: 'room-002',
    title: "'서울, 4월' 작성 중...", meta: '진행 중', progress: 0.7,
  },
  {
    id: 'n3', kind: 'member:added_photos', actor: '지원', roomId: 'room-001',
    title: '지원이 사진 12장을 추가했어요', meta: '5분 전',
  },
];
