# src/features/clusters/ — AI 클러스터 결과 + 매직 트리거 (CLAUDE.md)

Phase 4 화면들. AI 분류 결과를 확인하고 "초안 만들기"를 누르면 비동기 작성이 시작되어 메인 맵으로 돌아간다.

---

## 핵심: 클러스터링은 두 단계로 도착한다

API.md의 클러스터 타입:
- **`TIME_GPS`** — 시간 + GPS 기반. `POST /photos/complete` **직후 자동 생성**. "Day 1 · 5/12", "Day 2 · 5/13"처럼 `dayNumber` 채워진 형태.
- **`VLM_SCENE`** — AI 비전 분석 결과. GPU 작업이 끝나면 생성됨. "삿포로의 맛", "비에이의 하얀 풍경"처럼 `sceneLabel` 채워진 형태. 도착은 **WebSocket `cluster:created` 이벤트로 알림**.

즉 `/clusters` 화면은:
1. 진입 즉시 `GET /clusters?roomId=...` 호출 → 그 시점에 있는 클러스터(보통 `TIME_GPS`)를 즉시 표시.
2. WebSocket 구독으로 `cluster:created` 받을 때마다 그리드에 카드 추가.
3. `photo:processing_progress`의 `status === 'SUCCESS'`가 오면 분석 완료 — 상단 헤더의 "분류 중..." → "5개의 추억으로 묶었어요"로 변경.

**또는** 더 단순한 UX: 분석이 끝날 때까지 화면을 로딩 상태로 두고, 완료되면 한꺼번에 `VLM_SCENE`을 보여줌. PM과 결정 필요. 본 CLAUDE.md는 **점진적(streaming) 표시**를 기본으로 가정.

---

## ClusterResultPage.tsx — `/clusters` (Phase 4 A · 폴더 그리드)

### 레이아웃

```
┌────────────────────────────────────────┐
│ ──[상태바 28]──                        │
│  ✨ 127장의 사진을 5개의 추억으로 묶었어요 │
│  홋카이도, 5월 · 클러스터링 완료       │
│  ┌──────────┬──────────┐               │
│  │ 🍣      │ ❄️       │               │
│  │ 삿포로의맛│비에이의…  │               │
│  │ 32 #라멘 │ 28 #눈    │               │
│  ├──────────┼──────────┤               │
│  │ 👥      │ 🌸       │               │
│  │ 우리들  │거리의 봄  │               │
│  │ 24      │ 43 #벚꽃  │               │
│  └──────────┴──────────┘               │
│  ┌──────────────────────────────────┐  │
│  │  ✨ AI 여행로그 초안 만들기      │  │ ← 매직 버튼
│  └──────────────────────────────────┘  │
│         나중에 만들기 (밑줄)            │
└────────────────────────────────────────┘
```

### 사양

- 상단 헤더 top: 32, padding `6px 16px`. 손글씨 fontSize 18 lineHeight 1.1. 부제는 mono 8.
- 그리드 영역: top 90, bottom 92, padding L/R 12, gap 8. `gridTemplateColumns: 1fr 1fr`.
- FolderCard: 12 radius, 1.2 solid INK border, paper 배경, padding 10. 내부:
  - 상단 70px 높이 영역에 스택 썸네일 3장 (PhotoTile 56×56, absolute로 stacked). 각 카드는 `left: 8 + i*14`, `top: 4 + i*4`, `rotate((i-1)*4deg)`, z-index `stack.length - i`.
  - 그 아래 한 줄: 이모지(13) + 제목(weight 600, fontSize 11, flex 1) + 카운트(mono 8 INK_SOFT)
  - 그 아래 키워드 칩들: mono 8 INK_SOFT, `#키워드` 형태.
- 매직 버튼 영역 bottom: 18, full width. `<Btn magic full>` 사용. padding `14px 16px`, fontSize 13. magic = terra 그라디언트.
- "나중에 만들기": mono 8, INK_SOFT, 가운데정렬, underline + underline-offset 3.

### 폴더 카드 표시 데이터 (API 응답에서 직접 안 옴, **클라이언트 계산**)

```ts
interface FolderCardVM {
  id: string;
  icon: string;                 // VLM_SCENE의 sceneLabel을 이모지로 매핑 또는 dayNumber
  title: string;                // cluster.title
  count: number;                // 사진 length
  keywords: string[];           // aiKeywords 빈도순 상위 2~3개
  stack: { thumbnailUrl: string }[];  // 앞 3장
}

async function clusterToVM(cluster: Cluster): Promise<FolderCardVM> {
  const photos = await fetchClusterPhotos(cluster.id, cluster.roomId);
  return {
    id: cluster.id,
    icon: pickIcon(cluster),                 // sceneLabel/dayNumber → 이모지
    title: cluster.title,
    count: photos.length,
    keywords: topKeywords(photos, 2),        // 사진들 aiKeywords flatten + 빈도순
    stack: photos.slice(0, 3).map(p => ({ thumbnailUrl: p.thumbnailUrl })),
  };
}
```

- `pickIcon`은 sceneLabel 키워드 매핑 테이블(food→🍣, snow→❄️, person→👥, flower→🌸 ...)을 가지고 fallback은 `📷`.
- 사진 fetch가 클러스터마다 1회 발생 — 클러스터 개수가 많으면 비용. **백엔드에 count + 대표 썸네일 + 키워드를 직접 응답에 넣어달라고 요청하는 것이 정석.** 명세 확정 전까지는 클라이언트 계산.
- 위 변환은 `features/clusters/lib.ts`로 분리.

### 헤더 카피 동적 생성

- 총 사진 수 = `Room` 페이지 진입 시 받은 사진 length (또는 `GET /photos?roomId=...`).
- 클러스터 수 = `VLM_SCENE` 타입 클러스터 length (Day 단위 `TIME_GPS`는 제외하고 카운트할지 PM과 결정).
- 분석이 진행 중이면 "✨ 127장의 사진을 분류하고 있어요…" + 우측에 회전 스피너. 완료되면 "5개의 추억으로 묶었어요".

### 인터랙션 (dongjin 확정)

- **"초안 만들기" 탭** → AI 작성 트리거 (백엔드 엔드포인트는 협의 필요, 현재 `LLM_BLOG_DRAFT` JobType만 enum에 정의됨) → 즉시 **`/generating`** 으로 이동.
  - WebSocket `blog:updated`/`blog:published` 또는 `photo:processing_progress`로 완료 감지 → 그 시점에 `/editor`로 이동.
- **"나중에 만들기" 탭** → 메인 맵 `/`로 이동.
- 폴더 탭(각 카드) → 폴더 상세 (스코프 차후).

### API 연동

- **목록**: `GET /clusters?roomId=<UUID>` → `Cluster[]`. 진입 시 1회 + WebSocket으로 점진 갱신.
- **클러스터 사진**: `GET /clusters/:clusterId/photos?roomId=<UUID>` → `ClusterPhoto[]`. 폴더 카드 1개당 1회 호출 (또는 backend 협의).
- **제목 인라인 편집**: `PATCH /clusters/:clusterId` body `{ roomId, title }`.
- **매직 트리거**: 현재 명시 엔드포인트 없음. `POST /blogs` (사진 photoIds 포함)로 직접 만드는 흐름 또는 백엔드의 `LLM_BLOG_DRAFT` 트리거 엔드포인트 협의.

### WebSocket 처리

```ts
// features/clusters/useClusterStream.ts (예시)
useEffect(() => {
  socket.emit('room:subscribe', { roomId });
  const onCreated = (e: ClusterCreatedEvent) => {
    refetchClusters();             // 또는 e.clusterId로 단건 fetch 후 setState
  };
  const onProgress = (e: PhotoProcessingProgressEvent) => {
    setAnalysisProgress(e.doneCount / e.totalCount);
    if (e.status === 'SUCCESS') setAnalysisComplete(true);
    if (e.status === 'FAILED')  setAnalysisError(true);
  };
  socket.on('cluster:created', onCreated);
  socket.on('photo:processing_progress', onProgress);
  return () => {
    socket.off('cluster:created', onCreated);
    socket.off('photo:processing_progress', onProgress);
  };
}, [roomId]);
```

---

## GeneratingPage.tsx — `/generating` (Phase 4 C · 지도 복귀 + 작성 중)

**핵심**: Phase 1 A와 **시각적으로 거의 동일한 메인 맵**에 좌측 상단 스피너 도크 + 하단 토스트를 얹은 화면.
→ `features/map/MainMapPage`를 `mode="generating"` props로 재사용.

### 추가 요소 (메인 맵 기본 위)

1. **좌측 상단 스피너 도크** (left: 14, top: 84):
   - 컨테이너: paper 배경, 1px ink border, radius 99, padding `4px 10px 4px 6px`, gap 6, 박스 shadow.
   - 내부: 16×16 원형 스피너 + mono 9 텍스트 "1개 작성 중" 또는 진행률("3 / 5").
   - **WebSocket `photo:processing_progress`** 의 `doneCount/totalCount`를 표시하면 더 명확.
   - z-index 15.

2. **하단 토스트** (`Toast` 컴포넌트):
   - 내용: `✨ 블로그 작성을 시작했어요. 완료되면 알림으로 알려드릴게요!`
   - **이 문구는 채팅에서 dongjin이 유지하라고 명시함. 그대로 유지.**

3. **pending 마커 제거** — 채팅 코멘트: pending 마커도 다른 마커처럼 완성형으로.

### 마커 배치 (Phase 1 A와 동일)

```ts
[
  { x: 120, y: 170, label: '🌸' },
  { x: 250, y: 130, label: '🌊' },
  { x: 200, y: 260, label: '🍜' },
  { x:  70, y: 300, label: '🎌' },
  { x: 310, y: 290, label: '✨' },
]
```

### 인터랙션 + WebSocket

- 이 페이지는 **대기 화면**. 사용자가 메인 맵 컨트롤(FAB, 토글, 줌)을 누르면 정상 작동, 작성은 백그라운드 유지.
- WebSocket 구독:
  - `photo:processing_progress` → 스피너 도크의 진행률 갱신.
  - `blog:published` → 도크가 사라지고 토스트가 "초안이 완성되었어요" 스낵바로 전환 (Phase 5 A 상태) → `mode="notified"`로 전환.
  - 또는 사용자 정책에 따라 즉시 `/editor`로 라우팅.

### 구현 메모

- 스피너 키프레임은 `globals.css`의 `@keyframes spin` 사용.
- 토스트는 5초 후 자동 사라짐. 사용자가 종 아이콘을 탭하면 알림 센터(`/complete`)로 이동.
- 사용자가 페이지를 떠나도 WebSocket 구독은 전역 store(zustand 등)에서 유지 → 어디서든 완료 알림 수신 가능.

---

## 공용 사항

- 두 화면 모두 Phase 1/4C/5A 시각적 통일 원칙을 따른다 (`features/map/MainMapPage` 재사용).
- 사진 분석 진행 상태가 아직 "처리 중"이면 `/clusters`는 점진 표시 또는 로딩. `photo:processing_progress.status`로 판단.

## 권장 디렉터리 구조

```
features/clusters/
├── CLAUDE.md
├── ClusterResultPage.tsx
├── GeneratingPage.tsx
├── components/
│   └── FolderCard.tsx
├── hooks/
│   └── useClusterStream.ts   ← WebSocket 구독
├── lib.ts                     ← clusterToVM, pickIcon, topKeywords
└── api.ts                     ← fetchClusters, fetchClusterPhotos, patchClusterTitle
```
