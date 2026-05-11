# src/components/ — 공용 UI 컴포넌트 (CLAUDE.md)

도메인 무관 재사용 컴포넌트. 와이어프레임의 `primitives.jsx`를 그대로 옮긴 게 골격.

## 1. 파일 목록과 책임

| 파일 | 컴포넌트 | 설명 |
|---|---|---|
| `Screen.tsx` | `Screen` | 폰 mock 컨테이너. 상태바(28px) + paper 배경 + 라운드 + inset shadow. `scrollable` prop. |
| `MapBg.tsx` | `MapBg` | 종이톤 지도 배경. radial 그라디언트 2개 + 대각선 격자 + scribbled coastline SVG. |
| `OpenMapBg.tsx` | `OpenMapBg` | 실제 지도(Mapbox/Naver/Kakao 등) 통합 시 쓸 컨테이너. 현재는 placeholder. |
| `PhotoTile.tsx` | `PhotoTile` | 사진 placeholder. 그라디언트 톤 5종 + 대각선 스크래치 + 선택 시 terra ring + ✓ 뱃지. |
| `ui.tsx` | `Btn`, `Pill`, `Toast`, `Progress`, `Box`, `HandLabel`, `SectionTitle`, `FAB`, `FrostedHeader`, `BottomSheet`, `ThumbPin`, `ClusterBadge`, `Arrow`, `Notes` | 소형 프리미티브 모음 |

(필요해지면 `MainShell.tsx`, `Spinner.tsx` 등을 추가)

## 2. Screen.tsx

```tsx
interface ScreenProps {
  children: ReactNode;
  label?: string;          // 디자인 캔버스용 라벨. 프로덕션에선 표시 안 함.
  scrollable?: boolean;    // 기본 false (overflow: hidden)
}
```

- width 100%, height 100%, position relative.
- 배경 paper, 색 ink, 폰트 Noto Sans KR fontSize 11.
- borderRadius 18, border 1.2 solid INK.
- inset shadow `inset 0 0 0 4px ${PAPER}`, 살짝 외부 그림자.
- 상단 상태바 28px (mono 9 INK_SOFT, "9:41" / `••• ◐ ▮`).

## 3. MapBg.tsx

- absolute inset 0, paper_2 배경.
- background-image: radial 2개 + linear 격자 2개 (대각선).
- 위에 SVG coastline overlay (path 3개, dashed stroke).
- `children`을 그대로 렌더 (마커 등은 children으로 넣는다).

## 4. PhotoTile.tsx

```tsx
interface PhotoTileProps {
  w?: number | string;
  h?: number | string;
  label?: string;        // 톤 결정용 (charCode % 5)
  dim?: number;          // opacity. 업로드 중 사진은 0.4.
  picked?: boolean;      // 선택 표시 (terra ring + ✓ 뱃지)
  kind?: string;         // 좌상단 mono 7 태그 (예: 'AI TEXT')
  style?: CSSProperties;
}
```

- 톤 팔레트 5종 (`primitives.jsx` 그대로):
  - `['#d8c9a5','#b8a279']`, `['#cfd8c2','#a3b491']`, `['#dcc4b3','#b89884']`, `['#c8cdd4','#9ba4ad']`, `['#e1d3a8','#bda973']`.
- 그라디언트 + 대각선 라인 2줄 + 흰 원 1개 (사진처럼 보이게).
- picked면 1px terra border + outer 2px terra ring + 우상단 12×12 terra 원형 ✓ 뱃지.

## 5. ui.tsx (소형 프리미티브)

### Btn

```tsx
interface BtnProps {
  primary?: boolean;     // sage 배경
  magic?: boolean;       // terra 그라디언트 (Phase 4 매직 버튼)
  full?: boolean;        // width 100%
  children, onClick, style
}
```

- 기본: transparent + 1.2 INK border + INK 텍스트.
- primary: sage 배경 + 흰 텍스트.
- **magic**: `linear-gradient(135deg, var(--wf-terra), #d97a5c)` + 흰 텍스트 + 작은 그림자.
- padding `10px 16px`, fontSize 12 weight 600.

### Pill

- inline-flex, padding `3px 9px`, radius 99, fontSize 9 weight 500.
- `color` prop: 1px solid 색 border.
- `solid`: 배경을 color로 채우고 텍스트는 흰색.

### Toast

- absolute, left 16, right 16, bottom 90.
- padding `10px 14px`, radius 10, INK 배경, PAPER 텍스트.
- flex 정렬, gap 8. 큰 그림자.

### Progress

```tsx
interface ProgressProps {
  value: number;         // 0 ~ 1
  label?: string;        // 표시 시 하단 mono 8
  style?: CSSProperties;
}
```

- 트랙: height 4, INK_FAINT 배경, radius 2.
- 인디케이터: terra 배경.

### Box (placeholder)

- 1.2 dashed (또는 solid) INK border, radius 6, padding 6.
- `hint` prop이 있으면 우하단에 mono 7 INK_FAINT 라벨 (예: "AI TEXT", "P").

### HandLabel

- 손글씨 (Caveat/Gaegu) 14, INK_SOFT 기본. `color` prop 가능.
- 와이어프레임 가이드용. **프로덕션에선 가급적 제거 또는 prod 빌드에서 hide**.

### FAB

```tsx
interface FABProps {
  position?: 'right' | 'center';   // 기본 'right'
  label?: string;                  // 기본 '+'
  size?: number;                   // 기본 56
  color?: string;                  // 기본 sage
}
```

- absolute bottom 24. right면 right 18, center면 left 50% translateX -50%.
- 큰 그림자 2단, 흰 텍스트, fontSize 26 weight 300.

### FrostedHeader

- top 28, left/right 8, height 44.
- 반투명 paper(0.7) + blur 8, radius 22, 1px faint border.
- 좌측 28×28 프로필 아바타, 우측 종(🔔). `rightBadge` true면 종 옆 8×8 terra 빨간 점.

### ThumbPin

```tsx
interface ThumbPinProps {
  x: number;
  y: number;
  label?: string;        // 이모지
  size?: number;         // 기본 32
  // pending prop은 사용하지 않음 (채팅 확정)
}
```

- absolute, transform `translate(-50%, -100%)`.
- 티어드롭: `borderRadius: '50% 50% 50% 8%'`, `rotate(-45deg)`, 1.4 solid INK border, 배경 `#d8c9a5`.
- 내부 이모지는 `rotate(45deg)` 보정, fontSize 16.

### Notes

- 와이어프레임 캔버스에서만 쓰는 주석 박스. **프로덕션 컴포넌트엔 포함 X** (또는 `if (process.env.NODE_ENV !== 'production')` 가드).

## 6. 토큰 사용

모든 컴포넌트는 CSS 변수 (`var(--wf-ink)` 등)로 색을 참조한다. 토큰 정의는 `src/theme/tokens.ts`와 `globals.css`에. 컴포넌트 내부에 색 값을 하드코딩하지 말 것 — PhotoTile의 톤 팔레트 5종만 예외 (와이어프레임 톤이라서).

## 7. props 명명 규칙

- boolean: `primary`, `magic`, `full`, `picked`, `dashed`, `scrollable` 처럼 형용사.
- 핸들러: `onClick`, `onTap`, `onChange`.
- 위치/사이즈: `x`, `y`, `w`, `h`, `size`.

## 8. 추가 권장

- `Spinner.tsx`를 추가해 4C·5C에서 재사용 (`features/clusters/GeneratingPage`, `features/blog/CompletePage`).
- `MainShell.tsx`를 추가해 메인 맵·여행 상세·타임라인의 하단 쉘(좌측 토글 + 우측 FAB)을 묶기.
