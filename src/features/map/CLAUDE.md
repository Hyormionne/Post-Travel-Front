# src/features/map/ — 메인 맵 (CLAUDE.md)

진입점이자 가장 자주 보이는 화면. Phase 1 A · 4 C · 5 A가 **시각적으로 거의 동일**하므로 이 디렉터리의 컴포넌트를 세 화면이 공유한다.

---

## MainMapPage.tsx — 통합 메인 맵 컴포넌트

### Props

```ts
type MainMapMode = 'idle' | 'generating' | 'notified';

interface MainMapPageProps {
  mode?: MainMapMode;           // 기본 'idle' (Phase 1 A)
  pins: Pin[];                  // 표시할 마커들
  notificationCount?: number;   // 우상단 종 뱃지 카운트
  onPinTap?: (pinId: string) => void;
  onFabTap?: () => void;        // 기본: /upload
  onTimelineTap?: () => void;   // 기본: /timeline
}

interface Pin {
  id: string;
  x: number;                    // 332 폭 기준 좌표
  y: number;                    // 720 높이 기준 좌표
  label: string;                // 이모지
  // pending은 더이상 사용하지 않음 — 채팅 확정
}
```

### 모드별 추가 요소

| Mode | 추가 표시 |
|---|---|
| `idle` (Phase 1 A) | 기본 — 헤더, FAB, 토글, 줌 컨트롤 |
| `generating` (Phase 4 C) | + 좌측 상단 작성 중 스피너 도크 + "✨ 블로그 작성을 시작했어요…" 토스트 |
| `notified` (Phase 5 A) | + 우상단 종 뱃지에 빨간 카운트 강조 + "← 뱃지 노출" 라벨 + "🔔 '...' 초안이 완성되었어요!" 스낵바 + "열기 →" 액션 |

### 공통 레이아웃 (모든 모드)

1. **배경 (MapBg)**: paper_2 + radial 그라디언트 2개 + 대각선 격자 2개 + scribbled coastline SVG. `features/map`이 아닌 `components/MapBg.tsx`로 빼는 것이 좋음 (재사용).
2. **마커 (ThumbPin)**: 각 핀은 `position: absolute`, `transform: translate(-50%, -100%)`. 32×32 티어드롭 (`borderRadius: '50% 50% 50% 8%'`), `rotate(-45deg)`. 배경 `#d8c9a5`, 1.4 INK border. 내부 이모지는 `rotate(45deg)` 보정. **모두 완성형으로 표시 (pending 없음)**.
3. **FrostedHeader**: top 28, left/right 8, height 44. 반투명 paper(0.7) + blur 8, 1px faint border, radius 22. 좌측 28×28 프로필 아바타, 우측 종 아이콘. `rightBadge` prop이 true면 종 옆 빨간 점.
4. **FAB**: bottom 24, right 18 (기본). 56×56 sage 원형, 1.4 INK border, 그림자 2단 (`0 6px 0 rgba(0,0,0,0.08), 0 12px 24px rgba(0,0,0,0.18)`). 라벨 `+`.
5. **좌측 하단 segmented 토글** (left 14, bottom 22):
   - 반투명 paper(0.92) + blur 8, 1.2 INK border, radius 99, padding 3, gap 2, 그림자.
   - 항목 `padding 5px 12px`, fontSize 10. active(지도)는 INK 배경 + PAPER 텍스트. 아이콘: ◉ / ☰.
6. **줌 컨트롤** (right 14, top 96): 28×28 paper 배경 정사각형 두 개, 1px INK border, radius 8. 라벨 `+` / `−`.

### 마커 데이터 (기본 — Phase 1/4C/5A 통일)

```ts
const defaultPins = [
  { id: '1', x: 120, y: 170, label: '🌸' },
  { id: '2', x: 250, y: 130, label: '🌊' },
  { id: '3', x: 200, y: 260, label: '🍜' },
  { id: '4', x:  70, y: 300, label: '🎌' },
  { id: '5', x: 310, y: 290, label: '✨' },
];
```

### 모드별 분기 디테일

#### `generating` (Phase 4 C)

```tsx
{/* 좌측 상단 작성 중 도크 */}
<div style={{
  position: 'absolute', left: 14, top: 84,
  background: 'var(--wf-paper)', border: '1px solid var(--wf-ink)',
  borderRadius: 99, padding: '4px 10px 4px 6px',
  display: 'flex', alignItems: 'center', gap: 6,
  boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
  zIndex: 15,
}}>
  <div style={{
    width: 16, height: 16, borderRadius: '50%',
    border: '2px solid var(--wf-ink-faint)',
    borderTopColor: 'var(--wf-terra)',
    animation: 'spin 1s linear infinite',
  }} />
  <span style={{ fontFamily: 'var(--wf-mono)', fontSize: 9 }}>1개 작성 중</span>
</div>

{/* 토스트 */}
<Toast>
  <span>✨</span>
  <span>블로그 작성을 시작했어요. 완료되면 알림으로 알려드릴게요!</span>
</Toast>
```

#### `notified` (Phase 5 A)

- 종 뱃지: top 36, right 22, 14×14 원형 TERRA 배경, 1.5 흰 border, 숫자 9px 흰색.
- 손글씨 라벨 "← 뱃지 노출" (top 30, right 50).
- 토스트: `🔔` + `<b>'홋카이도, 5월'</b> 블로그 초안이 완성되었어요!` + 우측 SAGE "열기 →" 버튼.

### 인터랙션

- 핀 탭 → 위치 프리뷰 시트 표시 (Phase 1 B 디자인 — 차후 확장 시 추가).
- FAB 탭 → `/upload`.
- 좌측 토글 "타임라인" 탭 → `/timeline`.
- 줌 +/− 탭 → 지도 스케일 변경 (현재 시각 placeholder).
- `notified` 모드 토스트 "열기 →" 탭 → `/editor?roomId=...`.

### MapBg 좌표 시스템

- 폰 mock 폭이 332px이므로 핀 좌표(x,y)는 그 안에서 절대 위치. 실 좌표→픽셀 변환은 차후 실제 지도 통합 시.
- 현재 단계: 정적 placeholder. 실제 지도(Mapbox/Naver/Kakao 등)는 백엔드 협의 후 결정.

---

## 진입 흐름

이 페이지는 **로그인 후 메인 진입점**. 사용자가 처음 들어오면:
- 토큰 검증 → 실패 시 `/auth/login`(차후 추가) 또는 시작 페이지.
- 사용자의 여행 리스트를 가져와 핀으로 표시. (현재 명세에 `GET /rooms` 같은 사용자 방 목록 API가 없음 — 백엔드 협의 필요.)
- FAB → 새 여행 만들기 플로우 시작 (`/upload`).

---

## WebSocket 통합

메인 맵은 작성 중인 블로그/분석 중인 사진의 **백그라운드 상태**를 반영해야 한다. WebSocket(`/realtime`)을 전역으로 연결하고 진행 중인 방들에 `room:subscribe`.

### 이벤트 → UI 반영

| 이벤트 | UI 반영 |
|---|---|
| `photo:processing_progress` | `mode="generating"` 도크의 진행률 갱신. `status === 'SUCCESS'`면 `mode="notified"`로 전환. |
| `cluster:created` | 해당 방의 핀 데이터 갱신 (필요 시). 핀 자체엔 큰 영향 없으나 알림 누적. |
| `blog:published` | `mode="notified"` 토스트 표시 + 종 뱃지 카운트 증가. |
| `blog:updated` | 알림 센터에 누적. 메인 맵엔 영향 없음. |

### 권장 구조

```ts
// app/layout.tsx 또는 별도 RootProvider에서 1회 연결
const socket = io('http://localhost:3000/realtime', { auth: { token: `Bearer ${accessToken}` } });

// MainMapPage 진입 시
useEffect(() => {
  activeRoomIds.forEach(id => socket.emit('room:subscribe', { roomId: id }));
}, [activeRoomIds]);
```

`socket` 인스턴스는 전역 store(`useRealtimeStore`)로 노출. 다른 화면(/clusters, /generating, /complete)에서도 같은 인스턴스 사용.

### Mode 자동 전환 로직 (간단 예시)

```ts
const [mode, setMode] = useState<MainMapMode>('idle');

useEffect(() => {
  const onProgress = (e: PhotoProcessingProgressEvent) => {
    if (e.status === 'RUNNING' || e.status === 'PROCESSING_CALLBACK') setMode('generating');
    if (e.status === 'SUCCESS')                                       setMode('notified');
  };
  socket.on('photo:processing_progress', onProgress);
  return () => { socket.off('photo:processing_progress', onProgress); };
}, []);
```

> ⚠️ `mode`가 라우트와 충돌하지 않게 주의 — `/generating` 페이지는 `mode="generating"`을 강제 (URL이 진실), 메인 맵 `/`는 WebSocket 이벤트가 mode를 결정.
