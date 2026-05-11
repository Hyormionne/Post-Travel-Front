# src/features/blog/ — 에디터 + 알림 센터 (CLAUDE.md)

Phase 5. AI가 작성한 블로그 초안을 편집하고 발행한다. 알림 센터는 작성 진행 상황을 한 곳에서 본다.

---

## EditorPage.tsx — `/editor` (Phase 5 B · Tiptap 스타일 에디터)

### 레이아웃

```
┌────────────────────────────────────────┐
│ ──[상태바 28]──                        │
│ ┌── sticky 헤더 (height 72) ─────┐   │
│ │ ←     ● 저장됨         최종 발행 │   │
│ └─────────────────────────────────┘   │
│                                        │
│  홋카이도, 5월의 봄 (손글씨 24, 600)  │
│  2025.05.12 — 05.16 · 일행 3 · AI ✦   │
│  ┌──────────────────────────────────┐ │
│  │  [첫 사진 height 140]            │ │
│  └──────────────────────────────────┘ │
│  비에이 ▸ 흰 자작나무 길              │
│  ╭ AI TEXT placeholder ─────────────╮ │
│  │ 오전 6시, 비에이의 들판에 도착… │ │
│  ╰─────────────────────────────────╯ │
│  ╭ P placeholder ──────────────────╮ │
│  ╰─────────────────────────────────╯ │
│  삿포로의 맛                          │
│  ┌────────┬────────┐                  │
│  │ [B 70] │ [C 70] │                  │
│  └────────┴────────┘                  │
│  ╭ AI TEXT placeholder ─────────────╮ │
│  ╰─────────────────────────────────╯ │
│  ┌── ✦ 여기에 '비에이의 풍경' 폴더  │ │ ← dashed sage
│  │   사진 더 넣을까요?         [예] │
│  └─────────────────────────────────┘ │
│  ─────────── (위까지 본문, padding bottom 100) ─
│ ┌── 하단 툴바 (height 44) ────────┐  │
│ │  B   I   H   🖼   ✦              │  │
│ └─────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### 사양

- Screen은 `scrollable` prop을 켠다.
- **sticky 헤더** (top 0, z-index 10):
  - height 72, paddingTop 28(상태바), padding `32px 14px 8px`, paper 배경, 1px faint border-bottom.
  - 좌측 ← (16). 가운데 "저장됨" mono 9 SAGE + 6×6 sage 점.
  - 우측 primary 버튼 "최종 발행" (padding `6px 12px`, fontSize 11).
- **본문 영역**: padding `12px 16px 100px`.
- 제목: 손글씨 24 weight 600 line-height 1.15.
- 메타: mono 9 INK_SOFT, "2025.05.12 — 05.16 · 일행 3 · AI 초안 ✦".
- 첫 사진: PhotoTile `100% × 140`, marginBottom 6. 그 아래 fontSize 9 INK_SOFT 캡션.
- **AI TEXT placeholder**: dashed Box, padding 8, flex column, hint="AI TEXT" (오른쪽 하단 mono 7).
- **P placeholder**: 빈 dashed Box, height 32, hint="P".
- **AI 추천 박스** (본문 끝):
  - radius 10, paper_2 배경, **1px dashed SAGE border**, padding 10, gap 8.
  - ✦ 아이콘(14) + 손글씨 13 안내 + sage solid Pill "예".
- **하단 툴바**:
  - absolute bottom 0, height 44, paper 배경, 1px faint border-top.
  - flex justify-around. 항목 `B`, `I`, `H`, `🖼`, `✦`. mono 11 INK_SOFT.

### 인터랙션

- 헤더 ← → `router.back()` (자동 저장 보장).
- "최종 발행" → 확인 다이얼로그 → `POST /blogs/:id/publish` → 응답에서 `publishedAt` 채워진 Blog 받음 → 발행 완료 화면 (또는 토스트 + 메인 맵 복귀).
- 발행 직전 `visibility` 토글 노출 (`PRIVATE` / `ROOM` / `PUBLIC`). 헤더 우상단 옆 또는 발행 모달 안. 기본은 `ROOM`.
- 본문 텍스트 박스 → 인라인 편집 (Tiptap). 변경 시 debounce 1.5s 후 `PATCH /blogs/:id` 호출.
- AI 추천 박스의 "예" → 해당 폴더에서 사진 가져와 본문에 삽입 → `PATCH /blogs/:id` body `{ photoIds: [...기존, ...새] }`. **photoIds를 보내면 기존 연결이 전부 교체**되므로 반드시 기존 + 새 합쳐서 전송.
- 사진 탭 → 사진 옵션 (교체/제거/캡션 편집). 순서 변경은 드래그 → `orderIdx` 재계산 → `PATCH`.
- 하단 툴바 → 텍스트 포맷 (Bold, Italic, Heading, 이미지 삽입, AI 보강).

### 구현 메모

- Tiptap (`@tiptap/react`) 기반. 기본 익스텐션: StarterKit + Image + Placeholder. 커스텀 노드(AI 추천 박스, 사진 갤러리)는 차후.
- 자동 저장 (debounce 1.5s):
  ```ts
  const debouncedSave = useDebouncedCallback((data) => {
    patchBlog(blogId, { title: data.title, content: data.content });
  }, 1500);
  ```
- 사진 순서 = `BlogPhoto.orderIdx` 오름차순. 본문 내 사진 삽입 위치는 Tiptap node attrs로 `photoId`만 저장하고, render 시 `blog.photos`에서 매칭 + 정렬.

### 데이터 흐름

- 진입 시:
  - `?blogId=xxx`로 들어오면 → `GET /blogs/:id`.
  - `?roomId=xxx`로 들어오면 (새 작성) → `POST /blogs` 즉시 생성 후 받은 id로 본 화면 전개. 또는 사용자가 입력 시작 시점에 lazy 생성.
- 발행 후: 응답의 Blog 객체로 상태 업데이트. `publishedAt`이 채워진 상태로 표시.

### API 매핑

| 액션 | 엔드포인트 |
|---|---|
| 새 블로그 생성 | `POST /blogs` body `{ roomId, title, content, photoIds? }` |
| 단건 조회 | `GET /blogs/:id` |
| 자동 저장 | `PATCH /blogs/:id` body `{ title?, content?, photoIds? }` |
| 발행 | `POST /blogs/:id/publish` |
| 삭제 | `DELETE /blogs/:id` |

권한:
- 단건 조회: 방 멤버 (`BlogAccessGuard`).
- 수정/발행/삭제: **작성자만** (`BlogAuthorGuard`). 다른 멤버가 들어오면 읽기 전용으로 표시.

---

## CompletePage.tsx — `/complete` (Phase 5 C · 알림 센터 드로어)

### 레이아웃

```
┌────────────────────────────────────────┐
│ ──[상태바 28]──                        │
│                                        │
│   (흐려진 지도 배경 · cursor: pointer) │ ← dongjin: 빈 곳 탭 = 5A로
│ ← 빈 곳 탭 = 닫고 5A로 (가이드 라벨)  │
│                                        │
│              ┌──── 알림 드로어 ─────┐ │
│              │  알림      모두 읽음  │ │
│              │  ┌─────────────────┐  │ │
│              │  │ [A] ✦ '홋카이도' │ │
│              │  │     초안 완성    │ │ ← terra 강조
│              │  │     방금 · 47장  │ │
│              │  │     [에디터 열기→]│ │
│              │  └─────────────────┘  │ │
│              │  ┌─────────────────┐  │ │
│              │  │ ○ '서울, 4월'    │ │
│              │  │   작성 중…  ▓▓░ │ │
│              │  └─────────────────┘  │ │
│              │  ┌─────────────────┐  │ │
│              │  │ (지) 지원이 사진 │ │
│              │  │  12장을 추가했어요│ │
│              │  └─────────────────┘  │ │
│              └────────────────────┘  │
│                                        │
│  다중 작업 동시 진행 → 알림 센터에서  │ ← 손글씨 라벨
└────────────────────────────────────────┘
```

### 사양

- **배경**: `MapBg`를 `filter: 'blur(2px)'`, `cursor: 'pointer'`로 깔고, 빈 영역 onClick → `/`로 라우팅.
- 안내 라벨: 좌측 상단(top 200, left 14, maxWidth 160), terra 색 손글씨 "← 빈 곳 탭 = 닫고 5A로". **이건 개발용 가이드이므로 실제 배포에선 제거**.
- **드로어**: top 28, right 8, width 290.
  - paper 배경, 1.4 INK border, radius 14, padding 12, z-index 30, 큰 그림자.
- 드로어 헤더: "알림" weight 600 fontSize 12 + "모두 읽음" mono 9 INK_SOFT (우측).
- **완료 카드** (강조):
  - padding 10, radius 10, paper_2 배경, **1.2 solid TERRA border**.
  - 좌측 36×36 PhotoTile + 본문(✦ 제목 weight 600, mono 8 메타, magic Btn "에디터 열기 →").
- **진행 중 카드**:
  - 1px faint border, radius 10.
  - 좌측 18×18 원형 스피너 (top sage). 본문 fontSize 10 + Progress(0.7).
- **일행 활동 카드**:
  - 1px faint border, radius 10, gap 8.
  - 좌측 28×28 sage 원형 아바타(손글씨 13 "지"). 본문 fontSize 10 "**지원**이 사진 12장을 추가했어요".

### 인터랙션 (dongjin 확정)

- **흐려진 지도 빈 곳 탭 → `/`로 닫힘**. 드로어 영역은 stopPropagation으로 닫히지 않게.
- "에디터 열기 →" 탭 → `/editor?blogId=...`.
- 진행 중 카드 탭 → `/generating` 또는 해당 작업 상태.
- 일행 활동 카드 탭 → 해당 여행 상세.
- "모두 읽음" 탭 → 알림 모두 읽음 처리.

### 데이터

- 알림 목록 자체의 GET API는 명세에 없음 (백엔드 협의). 본 단계에서는:
  - **WebSocket 이벤트를 클라이언트가 누적**: `cluster:created`, `photo:processing_progress`, `blog:updated`, `blog:published` 모두 알림 카드로 변환.
  - 누적 상태는 전역 store(예: `useNotificationsStore` — zustand)에 저장.
  - 읽음/안읽음, 시간 정렬은 클라이언트 측 관리.
- 카드 유형 매핑:
  - `blog:published` → "완료" 강조 카드 (terra border, "에디터 열기 →" 액션). 해당 blog 단건 조회로 제목·사진 가져옴.
  - `photo:processing_progress` status RUNNING → "진행 중" 카드 + Progress(`doneCount/totalCount`). status SUCCESS면 5초 후 자동으로 일반 알림으로 강등.
  - `cluster:created` → "새 카테고리 생겼어요" 정도 가벼운 알림.
- 일행 활동(사진 추가) 알림은 **API.md에 이벤트 없음** — 향후 `member:added_photos` 같은 이벤트 추가 협의.

향후 `GET /notifications` 도입 시 — 진입 시 history fetch + WebSocket으로 실시간 추가의 패턴으로 전환.

---

## 공통

- Phase 5 A의 토스트 → 사용자가 탭하면 이 알림 센터로 펼쳐지는 흐름. 즉 5A → 5C → 5B로 이어진다.
- 알림 상태(읽음/안읽음, 완료/진행중)는 빠른 응답을 위해 로컬 캐시. 백엔드 확인은 백그라운드 폴링.
