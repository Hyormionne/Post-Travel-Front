# src/types/ — 도메인 타입 (CLAUDE.md)

백엔드 API 응답 스키마와 1:1 대응되는 TypeScript 타입. `API.md`의 응답 형태를 그대로 따른다.

## 파일 (권장)

| 파일 | 타입 | API 매핑 |
|---|---|---|
| `auth.ts` | `Tokens`, `LoginRequest`, `SignupRequest`, `GoogleTokenRequest` | `/auth/*` |
| `room.ts` | `Room`, `RoomMember`, `RoomRole`, `CreateRoomRequest`, `UpdateRoomRequest`, `InviteTokenResponse` | `/rooms/*` |
| `photo.ts` | `Photo`, `PresignedUrlsRequest`, `PresignedUrlsResponse`, `PhotoCompleteRequest`, `PhotoCompleteItem`, `ContentType` | `/photos/*` |
| `cluster.ts` | `Cluster`, `ClusterType`, `ClusterPhoto`, `UpdateClusterRequest` | `/clusters/*` |
| `blog.ts` | `Blog`, `BlogPhoto`, `BlogVisibility`, `CreateBlogRequest`, `UpdateBlogRequest` | `/blogs/*` |
| `realtime.ts` | `JobStatus`, `JobType`, WebSocket 이벤트 페이로드 | `/realtime` namespace |
| `index.ts` | 위 모든 타입 re-export + `ApiError` | 공통 |

---

## auth.ts

```ts
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface SignupRequest {
  email: string;
  password: string;          // 8~72자
  nickname: string;          // 1~32자
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleTokenRequest {
  idToken: string;
}
```

> ⚠️ `/auth/refresh`, `/auth/logout`은 **Authorization 헤더에 refreshToken**을 실음 (access 아님). interceptor 작성 시 주의.

---

## room.ts

```ts
export type RoomRole = 'OWNER' | 'MEMBER';

export interface RoomMember {
  id: string;                // membership ID (UUID)
  roomId: string;
  userId: string;
  role: RoomRole;
  joinedAt: string;          // ISO8601
}

export interface Room {
  id: string;
  title: string | null;      // optional per spec
  inviteToken: string;
  createdBy: string;         // user ID
  createdAt: string;
  members: RoomMember[];
}

// POST /rooms
export interface CreateRoomRequest {
  title?: string;            // 최대 100자, optional
}

// PATCH /rooms/:roomId
export interface UpdateRoomRequest {
  title: string;             // 1~100자, required
}

// POST /rooms/:roomId/invite-token
export interface InviteTokenResponse {
  inviteToken: string;
}
```

> ⚠️ `RoomMember`에 **사용자 닉네임이 없음**. 멤버 표시(여행 상세의 "함께한 사람")할 때 별도 user 조회 API가 필요할 수도 있음 — 백엔드와 협의 (또는 응답 확장 요청).

---

## photo.ts

```ts
export type ContentType = 'image/jpeg' | 'image/png' | 'image/webp';

// POST /photos/presigned-urls — Request
export interface PresignedUrlsRequest {
  roomId: string;
  files: Array<{
    name: string;
    size: number;            // 최소 1, 바이트
    contentType: ContentType;
  }>;                        // 1~50개
}

// POST /photos/presigned-urls — Response (배열)
export type PresignedUrlsResponse = Array<{
  photoId: string;
  original:  { url: string; key: string };
  thumbnail: { url: string; key: string };
}>;

// POST /photos/complete — Request
export interface PhotoCompleteItem {
  photoId: string;
  s3Key: string;
  thumbnailKey?: string;
  fileSize: number;          // 바이트, 최소 1
  width?: number;
  height?: number;
  takenAt?: string;          // EXIF, ISO8601
  lat?: number;
  lng?: number;
}

export interface PhotoCompleteRequest {
  roomId: string;
  photos: PhotoCompleteItem[];
}

// Photo 엔티티 (응답)
export interface Photo {
  id: string;
  roomId: string;
  uploadedBy: string;        // user ID
  s3Key: string;
  thumbnailKey: string | null;
  fileSize: number;
  width: number | null;
  height: number | null;
  takenAt: string | null;
  lat: number | null;        // ⚠️ gps 객체 아님, 평면 필드
  lng: number | null;
  sceneLabel: string | null;
  aiCaption: string | null;
  aiKeywords: string[];      // AI 분석 후 채워짐
  createdAt: string;
  url: string;               // presigned GET URL
  thumbnailUrl: string;      // presigned GET URL
}
```

---

## cluster.ts

```ts
export type ClusterType = 'TIME_GPS' | 'VLM_SCENE';

// GET /clusters 응답 항목
export interface Cluster {
  id: string;
  roomId: string;
  title: string;             // "Day 1" 또는 AI 라벨 또는 사용자 편집값
  summary: string | null;
  sceneLabel: string | null;
  dayNumber: number | null;  // TIME_GPS 클러스터의 n일차
  clusterType: ClusterType;
  thumbnailKey: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

// GET /clusters/:id/photos 응답 항목 (Photo의 일부 슬림 버전)
export interface ClusterPhoto {
  id: string;
  s3Key: string;
  thumbnailKey: string | null;
  takenAt: string | null;
  url: string;
  thumbnailUrl: string;
}

// PATCH /clusters/:clusterId
export interface UpdateClusterRequest {
  roomId: string;            // RoomMemberGuard용
  title: string;             // 1~100자
}
```

> ⚠️ **count / keywords / thumbnailUrls(복수)는 API에 없다.** UI에서 폴더 카드를 그릴 때:
> - count = `GET /clusters/:id/photos`의 length
> - keywords = 그 사진들의 `aiKeywords`를 모아 빈도순 상위 N개 (클라이언트 계산)
> - 썸네일 스택 = 그 사진들의 `thumbnailUrl` 앞 3장

이 파생 계산은 `features/clusters/lib.ts`(예시)로 빼서 재사용.

---

## blog.ts

```ts
export type BlogVisibility = 'PRIVATE' | 'ROOM' | 'PUBLIC';

export interface BlogPhoto {
  photoId: string;
  orderIdx: number;          // 0부터 — 본문 내 순서
  url: string;
  thumbnailUrl: string;
}

export interface Blog {
  id: string;
  roomId: string;
  authorId: string;
  title: string;
  content: string;           // 본문 텍스트 (Tiptap 출력 형식 등)
  visibility: BlogVisibility;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  photos: BlogPhoto[];
}

// POST /blogs
export interface CreateBlogRequest {
  roomId: string;
  title: string;
  content: string;
  photoIds?: string[];
}

// PATCH /blogs/:id — 모든 필드 선택. photoIds를 보내면 기존 사진 연결 전부 교체.
export interface UpdateBlogRequest {
  title?: string;
  content?: string;
  photoIds?: string[];
}
```

---

## realtime.ts (WebSocket)

```ts
export type JobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PROCESSING_CALLBACK'
  | 'SUCCESS'
  | 'FAILED';

export type JobType = 'VLM_ANALYZE' | 'LLM_BLOG_DRAFT';

// Client → Server
export interface RoomSubscribePayload {
  roomId: string;
}

// Server → Client
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

export interface BlogUpdatedEvent { blogId: string; }
export interface BlogPublishedEvent { blogId: string; }

// 타입 안전 이벤트 맵 (Socket.IO Typed client에 사용)
export interface ServerToClientEvents {
  'cluster:created':           (e: ClusterCreatedEvent) => void;
  'photo:processing_progress': (e: PhotoProcessingProgressEvent) => void;
  'blog:updated':              (e: BlogUpdatedEvent) => void;
  'blog:published':            (e: BlogPublishedEvent) => void;
}

export interface ClientToServerEvents {
  'room:subscribe': (p: RoomSubscribePayload) => void;
}
```

---

## 공통

```ts
// API 에러 형식
export interface ApiError {
  statusCode: number;
  message: string | string[];   // validation 시 배열
  error: string;                // 'Bad Request', 'Unauthorized', 'Forbidden' 등
}
```

### 명명 규칙

- 응답 객체: `Xxx` (단일), `XxxResponse` (필요할 때만).
- 요청 body: `CreateXxxRequest`, `UpdateXxxRequest`.
- ID: 항상 `string` (UUID).
- 날짜: 항상 `string` (ISO8601). `Date` 변환은 사용 직전 (예: `formatDate(p.takenAt)`).
- nullable: API에서 nullable이면 `| null`로 명시 (`undefined` 아님).

---

## 백엔드 협의 필요 (잔여)

API.md에 누락되어 협의가 필요한 항목:

- **사용자 여행 리스트** (`GET /rooms` 또는 `GET /users/me/rooms`) — 메인 맵과 타임라인의 진입 데이터.
- **RoomMember에 nickname/profile** 정보 — 여행 상세의 "함께한 사람" 표시용. 별도 user 조회 API 또는 응답 확장.
- **마커 커스터마이징** — Phase 3 B의 이모지/색/모양은 백엔드 스키마에 없음. 클라이언트 측 로컬 저장으로 시작하거나 Room 응답 확장 요청.
- **알림 목록** (`GET /notifications`?) — Phase 5 C 알림 센터 드로어. 현재는 WebSocket 이벤트를 클라이언트가 누적하는 방식으로 시작 가능.
- **AI 블로그 초안 트리거** (`POST /rooms/:roomId/blog-draft`?) — Phase 4 A "✨ 초안 만들기" 버튼이 호출할 엔드포인트. `LLM_BLOG_DRAFT` JobType이 enum에 있으니 백엔드에서 추가 예정으로 보임.

협의가 끝난 항목은 위 파일에 타입 추가하고 이 목록에서 지운다.
