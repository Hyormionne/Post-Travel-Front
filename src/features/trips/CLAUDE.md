# src/features/trips/ — 여행 상세 + 타임라인 뷰 (CLAUDE.md)

기존 여행을 다시 보는 화면들. 두 화면 모두 메인 맵과 같은 하단 쉘(좌측 토글 + 우측 FAB)을 공유한다.

---

## 공통: MainShell

두 페이지 다 `MainShell activeTab="지도" | "타임라인"`을 풋터로 가진다. 동일 컴포넌트로 묶어서 사용.

- **좌측 하단 segmented** (left 14, bottom 22):
  - 컨테이너: 반투명 paper 배경(0.92) + blur(8px), 1.2 ink border, radius 99, padding 3, gap 2.
  - 항목: `padding 5px 12px`, fontSize 10. active는 INK 배경 + PAPER 텍스트, 비active는 transparent + INK 텍스트.
  - 아이콘: 지도 ◉ / 타임라인 ☰.
- **우측 하단 FAB**: 56×56 원형 sage 배경, 1.4 INK border, 큰 그림자, `+` 라벨.

탭 누르면:
- "지도" → `/`
- "타임라인" → `/timeline`

---

## TripDetailPage.tsx — `/trip-detail` (여행 상세)

### 레이아웃

```
┌────────────────────────────────────────┐
│ ──[상태바 28]──                        │
│ ┌── 컴팩트 상단바 (height 36) ────┐   │ ← dongjin 코멘트:
│ │ ←     여행 상세                   │   │   상단바 작게 (mono 9)
│ └──────────────────────────────────┘   │   우상단 ⋯ 삭제
│  [✨마커] 홋카이도, 5월의 봄          │
│         2025.05.12 — 05.16 · 사진 127  │
│  ┌────────────────────────────────┐   │
│  │ 함께한 사람 (지)(민)(나) +초대 │   │
│  └────────────────────────────────┘   │
│  ┃블로그┃ 폴더    ← 미니맵 삭제됨   │
│  ────────                              │
│  블로그                          3개   │
│  [A] 오전 6시, 비에이의 안개  편집→  │
│      5월 13일                          │
│      안개가 천천히 걷히기…             │
│  [B] 삿포로 라멘 골목 산책   읽기→   │
│      5월 14일                          │
│  + 새 블로그 글 작성 (dashed)         │
│                                        │
│  폴더                            4개   │
│  [🍣 삿포로의 맛 32] [❄️ 비에이 28]   │
│  [👥 우리들 24]    [🌸 거리의봄 43] │
│                                        │
│  [지도|타임라인]              [+]      │ ← MainShell
└────────────────────────────────────────┘
```

### 사양

- **상단바 height: 36** (채팅 확정 — 다른 페이지보다 컴팩트). padding `30px 14px 6px` (상태바 28 + 살짝 여백). 좌측 ← (fontSize 14), 가운데 mono 9 "여행 상세", 우측 placeholder 14px (정렬용). **⋯ 메뉴 없음**.
- 본문 padding `14px 16px 80px` (하단 MainShell 자리).
- 헤더 영역: 52×52 마커 (rotated teardrop) + 손글씨 24 제목 + mono 9 부제.
- 멤버 행: paper_2 배경 radius 10 box. 24×24 아바타 3개를 -8px overlap. "+ 초대" 우측 정렬, sage 색 weight 600.
- 탭 행: `블로그` `폴더` 두 개만. **미니맵 탭 없음**. 활성 탭은 INK 텍스트 weight 600 + 하단에 2px terra solid 라인.
- 블로그 리스트 항목:
  - 컨테이너 1px faint border, radius 10, padding 10, gap 10, 정렬 center.
  - 좌측 56×56 PhotoTile.
  - 중간 flex: 제목(weight 600 fontSize 11), 날짜(mono 8), 본문 한 줄(dashed=false Box, paper_2 배경, fontSize 9).
  - 우측 액션: 손글씨 13, 첫 항목 "편집 →" (terra), 두 번째 "읽기 →" (sage).
- "새 블로그 글 작성": dashed Box, padding 12, 손글씨 13.
- 폴더 그리드: Phase 4 A의 FolderCard를 그대로 재사용 (2-col, gap 8).
- **MainShell**(activeTab="지도") 가 풋터로 떠 있음.

### 인터랙션

- ← 탭 → 이전 화면 (`router.back()`).
- 블로그 항목 탭 → 편집(`/editor?blogId=...`) 또는 읽기(차후 상세 화면).
- 폴더 카드 탭 → 폴더 상세(차후).
- "+ 새 블로그 글 작성" → 빈 에디터로 `/editor`.
- **MainShell** 항목 탭은 위 공통 규칙대로.

### API 연동

- 여행 상세: `GET /rooms/:roomId` → Room 정보 + `members[]`. 
  - **주의**: `members[]`는 `{ id, roomId, userId, role, joinedAt }`만 가짐. **닉네임/프로필이 없음** — UI에 표시하려면 별도 user 조회 필요. 백엔드 협의로 응답 확장 요청.
- 사진 목록: `GET /photos?roomId=...`.
- 클러스터(폴더): `GET /clusters?roomId=...`. 폴더 카드 표시용 파생 데이터는 `features/clusters/CLAUDE.md` 참조.
- 블로그 리스트: `GET /blogs?roomId=...` → `Blog[]`. 발행 여부는 `publishedAt`(null이면 초안, 값 있으면 발행됨).
- 방 제목 수정: `PATCH /rooms/:roomId` body `{ title }` (OWNER만 — 다른 멤버한테는 편집 버튼 숨김).
- 멤버 초대 링크 재발급: `POST /rooms/:roomId/invite-token` (OWNER만).
- 방 삭제: `DELETE /rooms/:roomId` (OWNER만, 확인 모달).

---

## TimelinePage.tsx — `/timeline` (타임라인 뷰)

### 레이아웃

```
┌────────────────────────────────────────┐
│ ──[상태바 28]──                        │
│ ← [지도|타임라인] (가운데)            │ ← 우상단 status 뱃지 없음
│  (헤더: padding 32/14/8)              │
│                                        │
│  나의 여행들 (손글씨 22)              │
│  총 12 · 시간 역순 ▾                 │
│                                        │
│  2025                                  │
│  ┌────────────────────────────────┐   │
│  │ [✨] 홋카이도, 5월의 봄          │   │
│  │      5/12 — 5/16               │   │
│  │      5일 · 사진 127 · 일행 3    │   │
│  │      [A][B][C][D][+]           │   │
│  └────────────────────────────────┘   │
│  ┌── 서울, 봄 산책 ──────────────┐   │
│  └────────────────────────────────┘   │
│  ┌── 부산 주말 ──────────────────┐   │
│  └────────────────────────────────┘   │
│  ╭── 대구 출장 작성 중... 2분 전 ─╮  │ ← dashed terra
│                                        │
│  2024                                  │
│  └ 교토 가을 (11/2 — 11/5)            │
│                                        │
│  [지도|타임라인]              [+]      │ ← MainShell
└────────────────────────────────────────┘
```

### 사양

- 헤더 padding `32px 14px 8px`, paper 0.92 + blur 8, 1px faint border-bottom.
- 헤더 좌측 ← (fontSize 16). 가운데에 segmented 토글 (paper_2 배경, 1px faint border, radius 99, padding 2, gap 2). 토글 항목 padding `4px 12px` fontSize 10 weight 500.
- 우측: 빈 14px placeholder (정렬용). **⋯ 메뉴 없음, status 뱃지 없음** (둘 다 채팅에서 삭제 확정).
- 본문 padding `14px 16px 80px`.
- 큰 제목 손글씨 22, 부제 mono 9.
- 연도 헤더: mono 9, letterSpacing 0.08em, INK_SOFT.
- 여행 카드:
  - 컨테이너 1.2 solid INK border, radius 12, paper 배경, padding 10, gap 10.
  - 좌측 44×44 회전 마커 (rotated teardrop).
  - 중간 flex: 제목(weight 600 fontSize 12), 메타(mono 8), 사진 행 (PhotoTile 36×36 4장 + "+" placeholder).
- **작성 중** 카드: dashed terra border (`1.2px dashed`), 좌측 회전 스피너, 중간 텍스트 fontSize 11 ("**'대구 출장'** 블로그 작성 중..."), 우측 mono 8 "2분 전".
- 2024 항목: 1px INK_FAINT border, radius 12, padding 10. 38×38 마커 + 작은 제목.
- **MainShell**(activeTab="타임라인") 가 풋터로 떠 있음.

### 목 데이터

```ts
const trips2025 = [
  { e: '✨', t: '홋카이도, 5월의 봄', d: '5/12 — 5/16', n: '5일 · 사진 127 · 일행 3' },
  { e: '🌸', t: '서울, 봄 산책',     d: '4/22',         n: '하루 · 사진 38' },
  { e: '🌊', t: '부산 주말',         d: '3/8 — 3/9',    n: '2일 · 사진 64 · 일행 2' },
];
const writing = { t: '대구 출장', elapsed: '2분 전' };
const trips2024 = [
  { e: '🍂', t: '교토 가을', d: '11/2 — 11/5' },
];
```

### 인터랙션

- 카드 탭 → `/trip-detail?roomId=...`.
- 작성 중 카드 탭 → `/generating` 또는 `/editor` (작성 단계에 따라).
- 토글에서 "지도" 탭 → `/`.

### API 연동

- **사용자 여행 리스트**: API.md에 명시 없음 — 백엔드 협의 (`GET /rooms` 또는 `GET /users/me/rooms` 형태 예상). 응답에는 작성 중 상태 (해당 방에 진행 중인 `LLM_BLOG_DRAFT` job이 있는지)가 포함되거나 별도 표시 방법 협의.
- 작성 중 카드의 진행률은 WebSocket `photo:processing_progress` 또는 별도 진행 상태 API.
- 카드 탭 시 `roomId`로 `GET /rooms/:roomId` 조회 → `/trip-detail`로 라우팅.
