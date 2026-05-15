# Post-Travel API 기능명세서

> **Base URL**: `http://localhost:3000`
> **Swagger UI**: `http://localhost:3000/docs`
> **최종 수정**: 2026-05-13

---

## 목차

1. [공통 사항](#1-공통-사항)
2. [Health Check](#2-health-check)
3. [Auth (인증)](#3-auth-인증)
4. [Rooms (여행방)](#4-rooms-여행방)
5. [Photos (사진)](#5-photos-사진)
6. [Clusters (클러스터)](#6-clusters-클러스터)
7. [Blogs (블로그)](#7-blogs-블로그)
8. [WebSocket (실시간)](#8-websocket-실시간)

---

## 1. 공통 사항

### 인증

- 모든 API는 **JWT Bearer 인증**이 기본 적용됩니다.
- `@Public()` 표시된 엔드포인트만 인증 없이 호출 가능합니다.
- 헤더: `Authorization: Bearer <accessToken>`

### 에러 응답 형식

```json
{
  "statusCode": 400,
  "message": "에러 메시지 또는 메시지 배열",
  "error": "Bad Request"
}
```

### Validation

- `whitelist: true` — DTO에 정의되지 않은 필드는 자동 제거
- `forbidNonWhitelisted: true` — 정의되지 않은 필드가 있으면 400 에러
- `transform: true` — 자동 타입 변환 활성화

---

## 2. Health Check

### `GET /health`

서버 상태 확인 (DB + Redis). **인증 불필요**.

**Response `200`**
```json
{
  "status": "ok",
  "db": "up",
  "redis": "up"
}
```

**Response `503`** — DB 또는 Redis 장애
```json
{
  "status": "degraded",
  "db": "down",
  "redis": "up"
}
```

---

## 3. Auth (인증)

### 3-1. `POST /auth/signup` — 이메일 회원가입

**인증 불필요**

**Request Body**
| 필드 | 타입 | 필수 | 제약 | 예시 |
|------|------|------|------|------|
| `email` | `string` | ✅ | 이메일 형식 | `"user@example.com"` |
| `password` | `string` | ✅ | 8~72자 | `"password123"` |
| `nickname` | `string` | ✅ | 1~32자 | `"홍길동"` |

**Response `201`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response `409`** — 이미 존재하는 이메일

---

### 3-2. `POST /auth/login` — 이메일 로그인

**인증 불필요**

**Request Body**
| 필드 | 타입 | 필수 | 제약 | 예시 |
|------|------|------|------|------|
| `email` | `string` | ✅ | 이메일 형식 | `"user@example.com"` |
| `password` | `string` | ✅ | 8자 이상 | `"password123"` |

**Response `200`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response `401`** — 이메일 또는 비밀번호 불일치

---

### 3-3. `POST /auth/refresh` — Access Token 재발급

**헤더**: `Authorization: Bearer <refreshToken>` (Access Token이 아님!)

**Request Body**: 없음

**Response `200`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

> ⚠️ 사용된 refreshToken은 즉시 블랙리스트 처리됩니다 (Rotation 방식).

**Response `401`** — 유효하지 않은 refresh token

---

### 3-4. `POST /auth/logout` — 로그아웃

**헤더**: `Authorization: Bearer <refreshToken>` (Access Token이 아님!)

**Request Body**: 없음

**Response `204`** — No Content

**Response `401`** — 유효하지 않은 refresh token

---

### 3-5. `POST /auth/google/token` — Google 로그인 (React Native용)

**인증 불필요**

Google Sign-In SDK에서 받은 `idToken`을 서버에서 검증 후 JWT 토큰 쌍을 발급합니다.

**Request Body**
| 필드 | 타입 | 필수 | 예시 |
|------|------|------|------|
| `idToken` | `string` | ✅ | `"eyJhbGciOiJSUzI1NiIs..."` |

**Response `200`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response `401`** — 유효하지 않은 Google idToken

---

## 4. Rooms (여행방)

> 모든 Rooms API는 **JWT 인증 필수**입니다.

### 4-1. `POST /rooms` — 여행방 생성

**Request Body**
| 필드 | 타입 | 필수 | 제약 | 예시 |
|------|------|------|------|------|
| `title` | `string` | ❌ | 최대 100자 | `"제주도 여행 2025"` |

**Response `201`**
```json
{
  "id": "uuid-room",
  "title": "제주도 여행 2025",
  "inviteToken": "uuid-token",
  "createdBy": "uuid-user",
  "createdAt": "2025-07-01T00:00:00.000Z",
  "members": [
    {
      "id": "uuid-member",
      "roomId": "uuid-room",
      "userId": "uuid-user",
      "role": "OWNER",
      "joinedAt": "2025-07-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4-2. `GET /rooms/join/:token` — 초대 토큰으로 방 참가

**Path Params**
| 이름 | 타입 | 설명 |
|------|------|------|
| `token` | `string` | 초대 토큰 (UUID) |

**Response `200`**
```json
{
  "id": "uuid-member",
  "roomId": "uuid-room",
  "userId": "uuid-user",
  "role": "MEMBER",
  "joinedAt": "2025-07-01T00:00:00.000Z"
}
```

| 에러 | 설명 |
|------|------|
| `404` | 유효하지 않은 토큰 |
| `409` | 이미 방 멤버 |

---

### 4-3. `GET /rooms/:roomId` — 방 상세 조회

**권한**: 방 멤버만 (`RoomMemberGuard`)

**Response `200`**
```json
{
  "id": "uuid-room",
  "title": "제주도 여행 2025",
  "inviteToken": "uuid-token",
  "createdBy": "uuid-user",
  "createdAt": "2025-07-01T00:00:00.000Z",
  "members": [
    {
      "id": "uuid-member",
      "roomId": "uuid-room",
      "userId": "uuid-user",
      "role": "OWNER",
      "joinedAt": "2025-07-01T00:00:00.000Z"
    }
  ]
}
```

| 에러 | 설명 |
|------|------|
| `403` | 방 멤버 아님 |
| `404` | 방 없음 |

---

### 4-4. `PATCH /rooms/:roomId` — 방 제목 및 마커 수정

**권한**: OWNER만 (`RoomOwnerGuard`)

**Request Body** (모든 필드 선택)
| 필드 | 타입 | 필수 | 제약 | 예시 |
|------|------|------|------|------|
| `title` | `string` | ❌ | 1~100자 | `"제주도 여행 2025"` |
| `markerShape` | `string` | ❌ | `classic` `polaroid` `sticker` `dot` `flag` `ribbon` | `"classic"` |
| `markerBgColor` | `string` | ❌ | `#d8c9a5` `#cfd8c2` `#e2c9bc` `#c9d2db` `#decfd8` `#f0ead2` | `"#d8c9a5"` |
| `markerEmoji` | `string` | ❌ | | `"🌴"` |

**Response `200`** — 수정된 Room 객체 (4-3과 동일한 형태)

**Response `403`** — OWNER 아님

---

### 4-5. `DELETE /rooms/:roomId` — 방 삭제

**권한**: OWNER만 (`RoomOwnerGuard`)

**Response `204`** — No Content

**Response `403`** — OWNER 아님

---

### 4-6. `POST /rooms/:roomId/invite-token` — 초대 토큰 재발급

**권한**: OWNER만 (`RoomOwnerGuard`)

**Response `201`**
```json
{
  "inviteToken": "new-uuid-token"
}
```

**Response `403`** — OWNER 아님

---

## 5. Photos (사진)

> 모든 Photos API는 **JWT 인증 필수** + **방 멤버 전용** (`RoomMemberGuard`)

### 사진 업로드 플로우

```
1. POST /photos/presigned-urls  → Presigned PUT URL 받기
2. PUT <presigned-url>          → S3에 원본/썸네일 직접 업로드
3. POST /photos/complete        → 서버에 업로드 완료 알림 → DB 저장 + 클러스터링
```

---

### 5-1. `POST /photos/presigned-urls` — Presigned PUT URL 요청

**Request Body**
```json
{
  "roomId": "uuid-room",
  "files": [
    {
      "name": "photo1.jpg",
      "size": 5242880,
      "contentType": "image/jpeg"
    }
  ]
}
```

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| `roomId` | `string (UUID)` | ✅ | |
| `files` | `PresignedFileItem[]` | ✅ | 1~50개 |
| `files[].name` | `string` | ✅ | 파일명 |
| `files[].size` | `integer` | ✅ | 바이트 단위, 최소 1 |
| `files[].contentType` | `string` | ✅ | `image/jpeg` \| `image/png` \| `image/webp` |

**Response `201`**
```json
[
  {
    "photoId": "uuid-photo",
    "original": {
      "url": "https://bucket.s3.amazonaws.com/rooms/r1/photos/p1.jpg?X-Amz-Signature=...",
      "key": "rooms/r1/photos/p1.jpg"
    },
    "thumbnail": {
      "url": "https://bucket.s3.amazonaws.com/rooms/r1/thumbs/p1.jpg?X-Amz-Signature=...",
      "key": "rooms/r1/thumbs/p1.jpg"
    }
  }
]
```

> 💡 `original.url`과 `thumbnail.url`에 각각 HTTP `PUT`으로 파일을 업로드하세요.

---

### 5-2. `POST /photos/complete` — 업로드 완료 알림

S3 업로드 완료 후 호출. Photo DB 레코드 생성 + 시간/GPS 기반 자동 클러스터링을 수행합니다.

**Request Body**
```json
{
  "roomId": "uuid-room",
  "photos": [
    {
      "photoId": "uuid-photo",
      "s3Key": "rooms/uuid-room/photos/uuid-photo.jpg",
      "thumbnailKey": "rooms/uuid-room/thumbs/uuid-photo.jpg",
      "fileSize": 5242880,
      "width": 4032,
      "height": 3024,
      "takenAt": "2025-07-15T10:30:00.000Z",
      "lat": 37.5665,
      "lng": 126.978
    }
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `roomId` | `string (UUID)` | ✅ | |
| `photos` | `PhotoCompleteItem[]` | ✅ | |
| `photos[].photoId` | `string (UUID)` | ✅ | presigned-urls에서 받은 ID |
| `photos[].s3Key` | `string` | ✅ | 원본 S3 키 |
| `photos[].thumbnailKey` | `string` | ❌ | 썸네일 S3 키 |
| `photos[].fileSize` | `integer` | ✅ | 바이트 단위, 최소 1 |
| `photos[].width` | `integer` | ❌ | 가로 픽셀 |
| `photos[].height` | `integer` | ❌ | 세로 픽셀 |
| `photos[].takenAt` | `string (ISO 8601)` | ❌ | EXIF 촬영 시각 |
| `photos[].lat` | `number` | ❌ | 위도 |
| `photos[].lng` | `number` | ❌ | 경도 |

**Response `201`** — Photo 객체 배열 (presigned GET URL 포함)
```json
[
  {
    "id": "uuid-photo",
    "roomId": "uuid-room",
    "uploadedBy": "uuid-user",
    "s3Key": "rooms/uuid-room/photos/uuid-photo.jpg",
    "thumbnailKey": "rooms/uuid-room/thumbs/uuid-photo.jpg",
    "fileSize": 5242880,
    "width": 4032,
    "height": 3024,
    "takenAt": "2025-07-15T10:30:00.000Z",
    "lat": 37.5665,
    "lng": 126.978,
    "sceneLabel": null,
    "aiCaption": null,
    "aiKeywords": [],
    "createdAt": "2025-07-15T10:35:00.000Z",
    "url": "https://...presigned-get-url...",
    "thumbnailUrl": "https://...presigned-get-url..."
  }
]
```

---

### 5-3. `GET /photos` — 방의 사진 목록 조회

**Query Params**
| 이름 | 타입 | 필수 | 예시 |
|------|------|------|------|
| `roomId` | `string (UUID)` | ✅ | `"uuid-room"` |

**Response `200`** — Photo 객체 배열 (5-2 응답과 동일한 형태)

---

### 5-4. `DELETE /photos/:photoId` — 사진 삭제

**Path Params**: `photoId` (UUID)
**Query Params**: `roomId` (UUID, 필수 — RoomMemberGuard용)

**Response `204`** — No Content

---

## 6. Clusters (클러스터)

> 모든 Clusters API는 **JWT 인증 필수** + **방 멤버 전용** (`RoomMemberGuard`)

클러스터 타입:
- `TIME_GPS` — 시간 + GPS 기반 자동 클러스터링 (사진 업로드 시 자동 생성)
- `VLM_SCENE` — AI VLM 분석 기반 장면 클러스터링 (GPU 작업 완료 시 생성)

---

### 6-1. `GET /clusters` — 클러스터 목록 조회

**Query Params**
| 이름 | 타입 | 필수 | 예시 |
|------|------|------|------|
| `roomId` | `string (UUID)` | ✅ | `"uuid-room"` |

**Response `200`**
```json
[
  {
    "id": "uuid-cluster",
    "roomId": "uuid-room",
    "title": "Day 1",
    "summary": null,
    "sceneLabel": null,
    "dayNumber": 1,
    "clusterType": "TIME_GPS",
    "thumbnailKey": null,
    "createdAt": "2025-07-15T10:35:00.000Z",
    "thumbnailUrl": null
  }
]
```

---

### 6-2. `PATCH /clusters/:clusterId` — 클러스터 제목 수정

**Path Params**: `clusterId` (UUID)

**Request Body**
| 필드 | 타입 | 필수 | 제약 | 예시 |
|------|------|------|------|------|
| `roomId` | `string (UUID)` | ✅ | Guard용 | `"uuid-room"` |
| `title` | `string` | ✅ | 1~100자 | `"첫째 날 - 해변 산책"` |

**Response `200`** — 수정된 Cluster 객체

| 에러 | 설명 |
|------|------|
| `403` | 방 멤버 아님 |
| `404` | 클러스터 없음 |

---

### 6-3. `GET /clusters/:clusterId/photos` — 클러스터 내 사진 목록

**Path Params**: `clusterId` (UUID)
**Query Params**: `roomId` (UUID, 필수)

**Response `200`**
```json
[
  {
    "id": "uuid-photo",
    "s3Key": "rooms/uuid-room/photos/uuid-photo.jpg",
    "thumbnailKey": "rooms/uuid-room/thumbs/uuid-photo.jpg",
    "takenAt": "2025-07-15T10:30:00.000Z",
    "url": "https://...presigned-get-url...",
    "thumbnailUrl": "https://...presigned-get-url..."
  }
]
```

---

## 7. Blogs (블로그)

> JWT 인증 필수. 권한 가드가 엔드포인트마다 다릅니다.

`visibility` 값: `PRIVATE` | `ROOM` | `PUBLIC`

---

### 7-1. `POST /blogs` — 블로그 생성

**권한**: 방 멤버 (`RoomMemberGuard`)

**Request Body**
| 필드 | 타입 | 필수 | 예시 |
|------|------|------|------|
| `roomId` | `string (UUID)` | ✅ | `"uuid-room"` |
| `title` | `string` | ✅ | `"Day 1 in Jeju"` |
| `content` | `string` | ✅ | `"오늘은 제주도 첫날..."` |
| `photoIds` | `string[] (UUID[])` | ❌ | `["uuid-photo-1", "uuid-photo-2"]` |

**Response `201`**
```json
{
  "id": "uuid-blog",
  "roomId": "uuid-room",
  "authorId": "uuid-user",
  "title": "Day 1 in Jeju",
  "content": "오늘은 제주도 첫날...",
  "visibility": "ROOM",
  "publishedAt": null,
  "createdAt": "2026-05-07T12:00:00.000Z",
  "updatedAt": "2026-05-07T12:00:00.000Z",
  "photos": [
    {
      "photoId": "uuid-photo-1",
      "orderIdx": 0,
      "url": "https://...presigned-get-url...",
      "thumbnailUrl": "https://...presigned-get-url..."
    }
  ]
}
```

---

### 7-2. `GET /blogs?roomId=` — 방의 블로그 목록 조회

**권한**: 방 멤버 (`RoomMemberGuard`)

**Query Params**: `roomId` (UUID, 필수)

**Response `200`** — Blog 객체 배열 (7-1 응답과 동일 형태)

---

### 7-3. `GET /blogs/:id` — 블로그 단건 조회

**권한**: 방 멤버 (`BlogAccessGuard`)

**Response `200`** — Blog 객체 (7-1 응답과 동일 형태)

---

### 7-4. `PATCH /blogs/:id` — 블로그 수정

**권한**: 작성자만 (`BlogAuthorGuard`)

**Request Body** (모든 필드 선택)
| 필드 | 타입 | 필수 | 예시 |
|------|------|------|------|
| `title` | `string` | ❌ | `"Updated title"` |
| `content` | `string` | ❌ | `"Updated content..."` |
| `photoIds` | `string[] (UUID[])` | ❌ | `["uuid-photo-1"]` |

> ⚠️ `photoIds`를 보내면 기존 사진 연결이 **전부 교체**됩니다.

**Response `200`** — 수정된 Blog 객체

**Response `403`** — 작성자 아님

---

### 7-5. `POST /blogs/:id/publish` — 블로그 발행

**권한**: 작성자만 (`BlogAuthorGuard`)

**Request Body**: 없음

**Response `201`** — `publishedAt`이 설정된 Blog 객체

**Response `403`** — 작성자 아님

---

### 7-6. `DELETE /blogs/:id` — 블로그 삭제

**권한**: 작성자만 (`BlogAuthorGuard`)

**Response `204`** — No Content

**Response `403`** — 작성자 아님

---

### 7-7. `POST /blogs/:roomId/generate` — AI 블로그 초안 생성 요청

**권한**: 방 멤버 (`RoomMemberGuard`)

**Request Body**
| 필드 | 타입 | 필수 | 설명/예시 |
|------|------|------|------|
| `persona` | `string` | ❌ | `"friendly_diary"` \| `"emotional_essay"` \| `"witty"` \| `"concise_log"` \| `"magazine"` |
| `photoIds` | `string[] (UUID[])` | ❌ | `["uuid-photo-1", "uuid-photo-2"]` |

**Response `201`**
```json
{
  "jobId": "uuid-job",
  "status": "PENDING"
}
```

**Response `403`** — 방 멤버 아님

---

## 8. WebSocket (실시간)

### 연결

- **Namespace**: `/realtime`
- **라이브러리**: Socket.IO
- **인증**: 연결 시 `auth.token`에 Access Token 전달

```typescript
const socket = io('http://localhost:3000/realtime', {
  auth: { token: 'Bearer <accessToken>' }
});
```

### 이벤트: Client → Server

#### `room:subscribe` — 방 구독

방의 실시간 이벤트를 수신하려면 구독이 필요합니다. 방 멤버만 구독 가능합니다.

```typescript
socket.emit('room:subscribe', { roomId: 'uuid-room' });
```

### 이벤트: Server → Client

| 이벤트 | 페이로드 | 설명 |
|--------|----------|------|
| `cluster:created` | `{ clusterId, title }` | AI VLM 분석 완료 후 새 클러스터 생성 |
| `photo:processing_progress` | `{ jobId, doneCount, totalCount, status }` | GPU 작업 진행/완료 알림 |
| `blog:generated` | `{ jobId, blogId }` | AI 블로그 초안 생성 완료 |
| `blog:updated` | `{ blogId }` | 블로그 수정됨 |
| `blog:published` | `{ blogId }` | 블로그 발행됨 |

#### `photo:processing_progress` 페이로드 상세

```json
{
  "jobId": "uuid-job",
  "doneCount": 5,
  "totalCount": 10,
  "status": "SUCCESS"
}
```

`status` 값: `PENDING` | `RUNNING` | `PROCESSING_CALLBACK` | `SUCCESS` | `FAILED`

---

## 부록: 데이터 모델 요약

### User
| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `UUID` | PK |
| `email` | `string` | 고유 |
| `nickname` | `string` | |
| `profileImageUrl` | `string?` | |
| `googleSub` | `string?` | Google 계정 식별자 |
| `createdAt` | `DateTime` | |

### TravelRoom
| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `UUID` | PK |
| `title` | `string?` | |
| `markerShape` | `string?` | 마커 모양 |
| `markerBgColor` | `string?` | 마커 배경색 |
| `markerEmoji` | `string?` | 마커 이모지 |
| `inviteToken` | `string` | 초대용 UUID |
| `createdBy` | `UUID` | 방장 User ID |
| `createdAt` | `DateTime` | |

### RoomMember
| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `UUID` | PK |
| `roomId` | `UUID` | |
| `userId` | `UUID` | |
| `role` | `OWNER \| MEMBER` | |
| `joinedAt` | `DateTime` | |

### Photo
| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `UUID` | PK |
| `roomId` | `UUID` | |
| `uploadedBy` | `UUID` | 업로더 User ID |
| `s3Key` | `string` | 원본 S3 경로 |
| `thumbnailKey` | `string?` | 썸네일 S3 경로 |
| `fileSize` | `integer` | 바이트 |
| `width` | `integer?` | |
| `height` | `integer?` | |
| `takenAt` | `DateTime?` | EXIF 촬영 시각 |
| `lat` | `float?` | 위도 |
| `lng` | `float?` | 경도 |
| `sceneLabel` | `string?` | AI 장면 레이블 |
| `aiCaption` | `string?` | AI 생성 캡션 |
| `aiKeywords` | `string[]` | AI 키워드 |
| `createdAt` | `DateTime` | |

### Cluster
| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `UUID` | PK |
| `roomId` | `UUID` | |
| `title` | `string` | |
| `summary` | `string?` | |
| `sceneLabel` | `string?` | |
| `dayNumber` | `integer?` | 여행 n일차 |
| `clusterType` | `TIME_GPS \| VLM_SCENE` | |
| `thumbnailKey` | `string?` | |
| `createdAt` | `DateTime` | |

### Blog
| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `UUID` | PK |
| `roomId` | `UUID` | |
| `authorId` | `UUID` | 작성자 User ID |
| `title` | `string` | |
| `content` | `string` | 본문 (Text) |
| `visibility` | `PRIVATE \| ROOM \| PUBLIC` | |
| `publishedAt` | `DateTime?` | 발행 시각 |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

### ProcessingJob
| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `UUID` | PK |
| `roomId` | `UUID` | |
| `requestedBy` | `UUID?` | 요청자 User ID |
| `jobType` | `VLM_ANALYZE \| LLM_BLOG_DRAFT` | |
| `status` | `PENDING \| RUNNING \| PROCESSING_CALLBACK \| SUCCESS \| FAILED` | |
| `totalCount` | `integer` | |
| `doneCount` | `integer` | |
| `errorMsg` | `string?` | |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

### Enum: RoomRole
`OWNER` | `MEMBER`

### Enum: BlogVisibility
`PRIVATE` | `ROOM` | `PUBLIC`

### Enum: ClusterType
`TIME_GPS` | `VLM_SCENE`

### Enum: JobStatus
`PENDING` | `RUNNING` | `PROCESSING_CALLBACK` | `SUCCESS` | `FAILED`

### Enum: JobType
`VLM_ANALYZE` | `LLM_BLOG_DRAFT`
