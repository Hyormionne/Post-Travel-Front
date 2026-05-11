import type { Room } from '../types/room';
import type { Photo } from '../types/photo';
import type { Cluster } from '../types/cluster';

export const MOCK_ROOM: Room = {
  id: 'room-001',
  title: '홋카이도, 5월',
  inviteToken: 'abc123',
  createdBy: 'user-001',
  createdAt: '2025-05-12T00:00:00.000Z',
  members: [
    { id: 'm1', roomId: 'room-001', userId: 'user-001', role: 'OWNER', joinedAt: '2025-05-12T00:00:00.000Z' },
    { id: 'm2', roomId: 'room-001', userId: 'user-002', role: 'MEMBER', joinedAt: '2025-05-12T01:00:00.000Z' },
    { id: 'm3', roomId: 'room-001', userId: 'user-003', role: 'MEMBER', joinedAt: '2025-05-12T02:00:00.000Z' },
  ],
};

export const MOCK_PHOTOS: Photo[] = Array.from({ length: 47 }, (_, i) => ({
  id: `photo-${String(i + 1).padStart(3, '0')}`,
  roomId: 'room-001',
  uploadedBy: 'user-001',
  s3Key: `rooms/room-001/photos/photo-${i + 1}.jpg`,
  thumbnailKey: `rooms/room-001/thumbs/photo-${i + 1}.jpg`,
  fileSize: 3000000 + Math.floor(Math.random() * 5000000),
  width: 4032,
  height: 3024,
  takenAt: new Date(2025, 4, 12 + Math.floor(i / 10), 6 + (i % 12)).toISOString(),
  lat: 43.06 + Math.random() * 0.5,
  lng: 141.35 + Math.random() * 0.8,
  sceneLabel: ['food', 'landscape', 'people', 'street'][i % 4],
  aiCaption: null,
  aiKeywords: [],
  createdAt: new Date(2025, 4, 16, 10, i).toISOString(),
  url: '',
  thumbnailUrl: '',
}));

export const MOCK_CLUSTERS: Cluster[] = [
  { id: 'cl-1', roomId: 'room-001', title: '삿포로의 맛', summary: null, sceneLabel: 'food', dayNumber: 1, clusterType: 'TIME_GPS', thumbnailKey: null, createdAt: '2025-05-16T10:00:00.000Z', thumbnailUrl: null },
  { id: 'cl-2', roomId: 'room-001', title: '비에이의 하얀 풍경', summary: null, sceneLabel: 'landscape', dayNumber: 2, clusterType: 'TIME_GPS', thumbnailKey: null, createdAt: '2025-05-16T10:01:00.000Z', thumbnailUrl: null },
  { id: 'cl-3', roomId: 'room-001', title: '우리들', summary: null, sceneLabel: 'people', dayNumber: 3, clusterType: 'TIME_GPS', thumbnailKey: null, createdAt: '2025-05-16T10:02:00.000Z', thumbnailUrl: null },
  { id: 'cl-4', roomId: 'room-001', title: '거리의 봄', summary: null, sceneLabel: 'street', dayNumber: 4, clusterType: 'TIME_GPS', thumbnailKey: null, createdAt: '2025-05-16T10:03:00.000Z', thumbnailUrl: null },
];

export const MOCK_TRIPS = [
  { id: 'room-001', emoji: '✨', title: '홋카이도, 5월의 봄', dates: '5/12 — 5/16', info: '5일 · 사진 127 · 일행 3', status: '발행됨' as const },
  { id: 'room-002', emoji: '🌸', title: '서울, 봄 산책', dates: '4/22', info: '하루 · 사진 38', status: '초안' as const },
  { id: 'room-003', emoji: '🌊', title: '부산 주말', dates: '3/8 — 3/9', info: '2일 · 사진 64 · 일행 2', status: '발행됨' as const },
];
