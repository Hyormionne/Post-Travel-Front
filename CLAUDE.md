# 여행후유증 — 프로젝트 가이드 (CLAUDE.md)

여행 사진 자동 클러스터링 + AI 블로그 초안 생성 서비스의 프론트엔드.
"사진을 던지면 AI가 여행기를 쓰고, 지도에 핀이 꽂힌다."

---

## 1. 스택 & 규칙

- **Next.js (App Router) + TypeScript**
- 라우팅: `src/app/<route>/page.tsx`가 thin wrapper로서 `src/features/<feature>/<XxxPage>.tsx`를 import해 렌더링한다. 페이지 로직은 features 쪽에 둔다.
- 스타일: 인라인 스타일 + CSS 변수 토큰. 와이어프레임의 색·폰트·간격을 픽셀 단위로 그대로 옮긴다.
- 모바일 우선. 메인 뷰포트는 폰 폭(약 332×720) 기준으로 디자인되어 있다. 데스크탑 웹앱이지만 디자인은 폰 목업 안에 들어있는 형태로 유지된다 (Screen 컴포넌트 사용).
- 한국어가 1차 언어. 모든 UI 카피, 주석, 변수 의미는 한국어가 기준.

## 2. 디자인 시스템 (한 줄 요약)

- **컬러**: INK / INK_SOFT / INK_FAINT · PAPER / PAPER_2 · SAGE(브랜드·액션) · TERRA(AI·매직)
- **폰트**: Caveat·Gaegu(손글씨) · Noto Sans KR(UI) · JetBrains Mono(라벨)
- **무드**: 종이 톤(cream) + 손그림 느낌. dashed border = placeholder, solid border = 실제 UI.
- 모든 토큰은 `src/theme/tokens.ts`. 컴포넌트에서는 CSS 변수(`var(--wf-ink)` 등) 사용.

## 3. 핵심 플로우 (5 phase + 부가 화면)

| Route | 화면 | 와이어프레임 |
|---|---|---|
| `/` | 메인 맵 (진입점) | Phase 1 A |
| `/upload` | 사진 업로드 | Phase 2 B |
| `/metadata` | 메타데이터 + 진행바 | Phase 3 B |
| `/clusters` | AI 클러스터 결과 + 매직 버튼 | Phase 4 A |
| `/generating` | 매직 직후 — 지도 복귀 + 작성 중 도크 + 토스트 | Phase 4 C |
| `/editor` | 블로그 에디터 (Tiptap-style) | Phase 5 B |
| `/complete` | 알림 센터 드로어 | Phase 5 C |
| `/timeline` | 시간순 여행 카드 | Timeline |
| `/trip-detail` | 여행 상세 (블로그·폴더 탭) | TripDetail |

상태 전이(중요):
- `/clusters` → "초안 만들기" → `/generating` (지도 복귀 + 스피너 도크 + 토스트) → 비동기 완료 시 `/editor`
- `/clusters` → "나중에 만들기" → `/` (메인 맵)
- `/complete` (알림 드로어)의 빈 배경 탭 → `/` 으로 닫힘
- 메인 맵의 좌측 하단 [지도/타임라인] 토글 → `/timeline`

## 4. API 연동 (요약)

자세한 명세는 `API.md`. Base URL `http://localhost:3000`, Swagger `http://localhost:3000/docs`.

### 인증
- JWT (access + refresh). Axios interceptor로 401 시 `POST /auth/refresh` 자동 갱신.
- **`/auth/refresh`와 `/auth/logout`은 헤더에 refresh token을 실음** (access token 아님!). 주의.
- refresh token은 **rotation** — 한 번 쓰면 블랙리스트 처리, 응답으로 새 쌍 받음.
- 구글 로그인: `POST /auth/google/token` (idToken을 body로).

### 사진 업로드 (Presigned URL 3-step)
1. `POST /photos/presigned-urls` → 응답은 배열, 각 항목에 `photoId` + `original.{url, key}` + `thumbnail.{url, key}`.
2. 클라이언트가 `original.url`, `thumbnail.url`에 각각 HTTP **PUT**.
3. `POST /photos/complete` → 응답 Photo 객체에 `aiCaption`, `aiKeywords`, `sceneLabel` 필드 포함 (분석 후 채워짐).
- 1회 최대 **50장**. contentType은 **`image/jpeg` / `image/png` / `image/webp`만** 허용.

### 클러스터링 (두 단계)
- **`TIME_GPS`** — 시간 + GPS 기반. `POST /photos/complete` 직후 **자동 생성** (Day 1, Day 2 형식, `dayNumber` 필드 포함).
- **`VLM_SCENE`** — AI 비전 분석 기반. GPU 작업 완료 후 생성. WebSocket `cluster:created` 이벤트로 도착 알림.
- `GET /clusters?roomId=...` 응답은 두 종류가 섞여서 옴 — 필요 시 `clusterType`으로 필터.
- **중요**: API에는 `count`/`keywords`/`thumbnailUrls`(복수) 필드 **없음**. 폴더 카드의 "32장 #라멘 #스시"는 클라이언트 계산:
  - count = `GET /clusters/:clusterId/photos` 결과의 length.
  - keywords = 그 사진들의 `aiKeywords`를 모아 빈도순 상위 2~3개.
  - 대표 썸네일 스택 = 그 사진들의 `thumbnailUrl` 앞 3장.

### 블로그
- `POST /blogs` (생성) → `PATCH /blogs/:id` (자동 저장) → `POST /blogs/:id/publish` (발행).
- 블로그 객체의 `photos[]`는 `{ photoId, orderIdx, url, thumbnailUrl }` — `orderIdx`로 순서 관리.
- `visibility`: `PRIVATE` | `ROOM` | `PUBLIC`. 기본은 `ROOM`. Phase 5 B 발행 직전 토글 필요.
- `PATCH`로 `photoIds`를 보내면 **기존 연결 전부 교체** (덮어쓰기).

### 실시간 (WebSocket, Socket.IO)
- Namespace `/realtime`, `auth.token`으로 인증.
- 연결 후 반드시 `socket.emit('room:subscribe', { roomId })` — 그래야 해당 방 이벤트 수신.
- 서버→클라 이벤트:
  - **`photo:processing_progress`** — `{ jobId, doneCount, totalCount, status }`. Phase 4 C 작성 중 도크의 진행률에 바인딩.
  - **`cluster:created`** — `{ clusterId, title }`. Phase 4 A 폴더 그리드를 점진적으로 채울 때.
  - **`blog:updated`**, **`blog:published`** — 알림 센터(5 C)에 표시.
- `JobStatus`: `PENDING` | `RUNNING` | `PROCESSING_CALLBACK` | `SUCCESS` | `FAILED`.

### 권한 가드
- `RoomMemberGuard` — Photos, Clusters, Blog 대부분. 요청에 `roomId`를 body/query로 함께 보내야 함.
- `RoomOwnerGuard` — Room 수정/삭제, invite-token 재발급.
- `BlogAuthorGuard` — Blog 수정/발행/삭제.

### 기타
- 모든 날짜는 ISO8601.
- DTO whitelist 모드 — 정의되지 않은 필드 보내면 400.

## 5. 디렉터리별 책임

- `src/app/` — 라우트별 page.tsx. **로직 금지**. features의 페이지 컴포넌트 import만.
- `src/features/<domain>/` — 화면 단위 페이지 컴포넌트. 도메인 로직·API 호출·로컬 상태.
- `src/components/` — 도메인 무관 공용 UI (Screen, MapBg, PhotoTile, ui.tsx의 Btn/Pill/Toast 등).
- `src/theme/tokens.ts` — 컬러·폰트·간격 토큰. 단일 진실 출처.
- `src/types/` — API/도메인 타입. 백엔드 스키마와 1:1 대응.
- `src/mocks/data.ts` — 개발용 가짜 데이터. 백엔드 연결 전 단계에서 사용.

## 6. 작업 우선순위

각 화면을 만들 때 순서:
1. **레이아웃 픽셀-매치** — 와이어프레임의 좌표·간격 그대로 옮긴다. 짐작하지 말 것.
2. **인터랙션** — 채팅에서 dongjin이 확정한 동작 (예: 빈 곳 탭 = 닫기, 매직 버튼 → 5B).
3. **목 데이터** 연결 → 실제 API 연결 → 에러/로딩 상태.

## 7. 채팅에서 확정된 dongjin 코멘트 (반드시 반영)

- 여행 상세·타임라인 둘 다 **우상단 ⋯ 점 3개 삭제**.
- 여행 상세 **상단바 컴팩트** (height 36, padding 6). 다른 페이지는 영향 X.
- 여행 상세 탭에서 **미니맵 탭 삭제** → 블로그/폴더만.
- 타임라인 우상단 **status 뱃지(발행됨/초안) 삭제**.
- Phase 4 A: "초안 만들기" → 5B로, "나중에 만들기" → 1A로.
- Phase 4 C: pending 마커도 다른 마커처럼 **완성형으로 통일** (점선 X). "블로그 작성을 시작했어요" 토스트 유지.
- Phase 5 C: 빈 곳 탭 → 5A로 닫힘 (cursor: pointer + 안내 라벨).
- Phase 3 B: 마커 모양 옵션은 [클래식·폴라로이드·스티커·도트·깃발·리본] 6종.

## 8. Phase 1/4C/5A 공통 메인 맵 UI (절대 통일)

이 셋은 시각적으로 **거의 동일한 메인 맵 레이아웃**이다. 다른 점은:
- Phase 1 A: 기본 상태
- Phase 4 C: + 좌측 상단 작성 중 스피너 도크 + 하단 토스트
- Phase 5 A: + 알림 뱃지 강조 + 완성 스낵바

→ 공통 부분은 `features/map/MainMapPage.tsx`에 묶고, 세 화면이 props로 분기.
