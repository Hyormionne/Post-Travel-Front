# src/mocks/ — 목 데이터 (CLAUDE.md)

백엔드 연동 전에 화면을 개발/테스트할 때 쓰는 가짜 데이터. 모든 목은 **`src/types/`의 실제 타입을 만족**해야 한다 — 그래야 실 API로 갈아끼울 때 컴파일 에러로 누락을 잡을 수 있다.

## data.ts 구성

```ts
import type {
  Room, RoomMember, Photo, Cluster, ClusterPhoto,
  Blog, BlogPhoto, PhotoProcessingProgressEvent,
} from '@/types';

// ─ 사용자 ─────────────────────────────────────
export const mockUser = {
  id: 'user-1',
  nickname: '나',
  email: 'me@example.com',
};

// ─ 여행(Room) ─────────────────────────────────
export const mockRooms: Room[] = [
  {
    id: 'room-1',
    title: '홋카이도, 5월의 봄',
    inviteToken: 'invite-4Kj9aBcDe',
    createdBy: 'user-1',
    createdAt: '2025-05-12T09:00:00.000Z',
    members: [
      { id: 'm-1', roomId: 'room-1', userId: 'user-1', role: 'OWNER',  joinedAt: '2025-05-12T09:00:00.000Z' },
      { id: 'm-2', roomId: 'room-1', userId: 'user-2', role: 'MEMBER', joinedAt: '2025-05-12T09:30:00.000Z' },
      { id: 'm-3', roomId: 'room-1', userId: 'user-3', role: 'MEMBER', joinedAt: '2025-05-12T10:00:00.000Z' },
    ],
  },
  // ...추가 여행들
];

// 닉네임 매핑 (API에 없으므로 클라이언트가 보충) — 백엔드 협의 전 임시
export const mockUserNames: Record<string, string> = {
  'user-1': '나',
  'user-2': '지원',
  'user-3': '민호',
};

// ─ 사진 ───────────────────────────────────────
export const mockPhotos: Photo[] = Array.from({ length: 47 }, (_, i) => ({
  id: `photo-${i + 1}`,
  roomId: 'room-1',
  uploadedBy: 'user-1',
  s3Key: `rooms/room-1/photos/photo-${i + 1}.jpg`,
  thumbnailKey: `rooms/room-1/thumbs/photo-${i + 1}.jpg`,
  fileSize: 5_242_880,
  width: 4032,
  height: 3024,
  takenAt: new Date(Date.parse('2025-05-13T06:00:00Z') + i * 1000 * 60 * 30).toISOString(),
  lat: 43.6 + Math.random() * 0.3,
  lng: 142.7 + Math.random() * 0.5,
  sceneLabel: ['food', 'snow', 'person', 'flower'][i % 4],
  aiCaption: null,
  aiKeywords: [
    ['ramen', 'noodle'],
    ['snow', 'mountain'],
    ['selfie', 'group'],
    ['cherry', 'street'],
  ][i % 4],
  createdAt: '2025-05-16T20:00:00.000Z',
  url:          `https://mock.example.com/photos/${i + 1}.jpg`,
  thumbnailUrl: `https://mock.example.com/thumbs/${i + 1}.jpg`,
}));

// ─ 클러스터 ───────────────────────────────────
// 두 타입이 섞여서 도착: TIME_GPS는 업로드 직후, VLM_SCENE은 분석 후 점진 도착
export const mockClusters: Cluster[] = [
  // TIME_GPS — Day별 (업로드 직후 자동 생성)
  {
    id: 'cluster-day-1', roomId: 'room-1',
    title: 'Day 1', summary: null, sceneLabel: null,
    dayNumber: 1, clusterType: 'TIME_GPS',
    thumbnailKey: null, thumbnailUrl: null,
    createdAt: '2025-05-16T20:30:00.000Z',
  },
  {
    id: 'cluster-day-2', roomId: 'room-1',
    title: 'Day 2', summary: null, sceneLabel: null,
    dayNumber: 2, clusterType: 'TIME_GPS',
    thumbnailKey: null, thumbnailUrl: null,
    createdAt: '2025-05-16T20:30:00.000Z',
  },
  // VLM_SCENE — AI 분석 결과 (WebSocket으로 점진 도착)
  {
    id: 'cluster-sapporo-food', roomId: 'room-1',
    title: '삿포로의 맛', summary: '라멘과 스시',
    sceneLabel: 'food', dayNumber: null, clusterType: 'VLM_SCENE',
    thumbnailKey: 'rooms/room-1/thumbs/photo-1.jpg',
    thumbnailUrl: 'https://mock.example.com/thumbs/1.jpg',
    createdAt: '2025-05-17T09:00:00.000Z',
  },
  {
    id: 'cluster-biei-snow', roomId: 'room-1',
    title: '비에이의 하얀 풍경', summary: '눈 덮인 자작나무 길',
    sceneLabel: 'snow', dayNumber: null, clusterType: 'VLM_SCENE',
    thumbnailKey: 'rooms/room-1/thumbs/photo-5.jpg',
    thumbnailUrl: 'https://mock.example.com/thumbs/5.jpg',
    createdAt: '2025-05-17T09:00:30.000Z',
  },
  {
    id: 'cluster-us', roomId: 'room-1',
    title: '우리들', summary: null,
    sceneLabel: 'person', dayNumber: null, clusterType: 'VLM_SCENE',
    thumbnailKey: 'rooms/room-1/thumbs/photo-9.jpg',
    thumbnailUrl: 'https://mock.example.com/thumbs/9.jpg',
    createdAt: '2025-05-17T09:01:00.000Z',
  },
  {
    id: 'cluster-spring', roomId: 'room-1',
    title: '거리의 봄', summary: '벚꽃과 거리',
    sceneLabel: 'flower', dayNumber: null, clusterType: 'VLM_SCENE',
    thumbnailKey: 'rooms/room-1/thumbs/photo-13.jpg',
    thumbnailUrl: 'https://mock.example.com/thumbs/13.jpg',
    createdAt: '2025-05-17T09:01:30.000Z',
  },
];

// 클러스터 사진 (GET /clusters/:id/photos) — 폴더 카드 count/keywords 계산용
export const mockClusterPhotos: Record<string, ClusterPhoto[]> = {
  'cluster-sapporo-food': mockPhotos.filter((_, i) => i % 4 === 0)
    .map(p => ({ id: p.id, s3Key: p.s3Key, thumbnailKey: p.thumbnailKey, takenAt: p.takenAt, url: p.url, thumbnailUrl: p.thumbnailUrl })),
  // ... 나머지 클러스터도 비슷하게
};

// 클러스터 sceneLabel → 이모지 매핑 테이블
export const SCENE_ICON: Record<string, string> = {
  food: '🍣',
  snow: '❄️',
  person: '👥',
  flower: '🌸',
  beach: '🌊',
  city: '🏙️',
};

// ─ 블로그 ──────────────────────────────────────
export const mockBlogs: Blog[] = [
  {
    id: 'blog-1', roomId: 'room-1', authorId: 'user-1',
    title: '오전 6시, 비에이의 안개',
    content: '안개가 천천히 걷히기 시작했고, 자작나무 길은…',
    visibility: 'ROOM',
    publishedAt: null,                         // 초안
    createdAt: '2025-05-17T10:00:00.000Z',
    updatedAt: '2025-05-17T10:30:00.000Z',
    photos: [
      { photoId: 'photo-5', orderIdx: 0,
        url: 'https://mock.example.com/photos/5.jpg',
        thumbnailUrl: 'https://mock.example.com/thumbs/5.jpg' },
    ],
  },
  {
    id: 'blog-2', roomId: 'room-1', authorId: 'user-1',
    title: '삿포로 라멘 골목 산책',
    content: '저녁이 되자 라멘 가게 앞으로 줄이 길게…',
    visibility: 'ROOM',
    publishedAt: '2025-05-18T15:00:00.000Z',   // 발행됨
    createdAt: '2025-05-18T12:00:00.000Z',
    updatedAt: '2025-05-18T14:50:00.000Z',
    photos: [
      { photoId: 'photo-1', orderIdx: 0,
        url: 'https://mock.example.com/photos/1.jpg',
        thumbnailUrl: 'https://mock.example.com/thumbs/1.jpg' },
    ],
  },
];

// ─ 메인 맵 핀 (Phase 1) ───────────────────────
export const mockPins = [
  { id: 'p1', x: 120, y: 170, label: '🌸' },
  { id: 'p2', x: 250, y: 130, label: '🌊' },
  { id: 'p3', x: 200, y: 260, label: '🍜' },
  { id: 'p4', x:  70, y: 300, label: '🎌' },
  { id: 'p5', x: 310, y: 290, label: '✨' },
];

// ─ 폴더(사이드바) — Phase 2 B ─────────────────
export const mockFolders = [
  { n: '최근', c: 47, active: true },
  { n: '5월',  c: 124 },
  { n: '4월',  c: 86 },
  { n: '★',    c: 32 },
  { n: '☁ GP', c: 1240 },
];

// ─ 타임라인 ────────────────────────────────────
export const mockTimeline = {
  '2025': [
    { e: '✨', t: '홋카이도, 5월의 봄', d: '5/12 — 5/16', n: '5일 · 사진 127 · 일행 3' },
    { e: '🌸', t: '서울, 봄 산책',     d: '4/22',         n: '하루 · 사진 38' },
    { e: '🌊', t: '부산 주말',         d: '3/8 — 3/9',    n: '2일 · 사진 64 · 일행 2' },
  ],
  '2024': [
    { e: '🍂', t: '교토 가을', d: '11/2 — 11/5' },
  ],
};

export const mockWritingInProgress = { t: '대구 출장', elapsed: '2분 전' };

// ─ WebSocket 이벤트 시뮬레이션 ───────────────────
// 개발 환경에서 실제 서버 없이 진행률·완료를 흉내내고 싶을 때
export const mockProgressStream: PhotoProcessingProgressEvent[] = [
  { jobId: 'job-1', doneCount: 0,  totalCount: 47, status: 'PENDING' },
  { jobId: 'job-1', doneCount: 12, totalCount: 47, status: 'RUNNING' },
  { jobId: 'job-1', doneCount: 28, totalCount: 47, status: 'RUNNING' },
  { jobId: 'job-1', doneCount: 47, totalCount: 47, status: 'PROCESSING_CALLBACK' },
  { jobId: 'job-1', doneCount: 47, totalCount: 47, status: 'SUCCESS' },
];

// 알림 누적용 (Phase 5 C) — WebSocket 이벤트가 변환되는 형태
export const mockNotifications = [
  { id: 'n1', type: 'blog:published',           blogId: 'blog-2', title: '삿포로 라멘 골목 산책', meta: '방금 · 사진 47', highlight: true },
  { id: 'n2', type: 'photo:processing_progress', jobId: 'job-2',  title: '서울, 4월',         progress: 0.7 },
  { id: 'n3', type: 'member:added_photos',      actor: '지원',    body: '사진 12장을 추가했어요' }, // 향후 이벤트
];
```

## 사용 패턴

```ts
// features/clusters/api.ts
import { mockClusters, mockClusterPhotos } from '@/mocks/data';

export async function fetchClusters(roomId: string) {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    await new Promise(r => setTimeout(r, 300));
    return mockClusters.filter(c => c.roomId === roomId);
  }
  const res = await fetch(`/api/clusters?roomId=${roomId}`);
  return res.json();
}

export async function fetchClusterPhotos(clusterId: string, roomId: string) {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    return mockClusterPhotos[clusterId] ?? [];
  }
  const res = await fetch(`/api/clusters/${clusterId}/photos?roomId=${roomId}`);
  return res.json();
}
```

`NEXT_PUBLIC_USE_MOCKS=true`를 `.env.local`에 두면 전체 모드 전환.

WebSocket 시뮬레이션:

```ts
// features/clusters/hooks/useClusterStream.ts (mock 모드)
if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
  mockProgressStream.forEach((event, i) => {
    setTimeout(() => onProgress(event), i * 1500);
  });
}
```

## 추가 시 원칙

- 새 화면 추가 → 그 화면이 쓰는 데이터를 여기에 우선 정의.
- 실 API와 키 이름 일치 (백엔드 응답 형태 그대로). 카멜케이스.
- 이미지 URL은 실제 호스팅된 placeholder(Lorem Picsum 등)로 바꿔도 OK. 없으면 PhotoTile이 fallback.
- 한국어 텍스트는 와이어프레임의 카피를 그대로 사용.
- 클러스터의 count·keywords·썸네일 스택 같은 **파생 데이터는 mockClusterPhotos에서 계산**. 직접 mockClusters에 박아넣지 말 것 — 실 API와 같은 흐름을 유지해야 갈아끼우기 쉬움.
