# src/theme/ — 디자인 토큰 (CLAUDE.md)

색·폰트·간격·라운드의 단일 진실 출처. 컴포넌트는 절대로 색 hex를 인라인에 박지 말고 여기서 export한 토큰 또는 `var(--wf-*)` CSS 변수를 사용한다 (PhotoTile의 사진 톤 팔레트 5종만 예외).

## tokens.ts

```ts
// ── 컬러 ──────────────────────────────────────────────
export const COLORS = {
  ink:       '#2c2620',
  inkSoft:   'rgba(44,38,32,0.55)',
  inkFaint:  'rgba(44,38,32,0.28)',
  paper:     '#f6f1e6',      // cream (기본 톤)
  paper2:    '#ede6d4',
  sage:      '#8a9a7b',      // 브랜드 · 액션
  terra:     '#c0654a',      // AI · 매직
} as const;

// 페이퍼 톤 변형 (필요 시 다크/ivory/ash 전환에 사용)
export const PAPER_TONES = {
  cream: { paper: '#f6f1e6', paper2: '#ede6d4', ink: '#2c2620', inkSoft: 'rgba(44,38,32,0.55)', inkFaint: 'rgba(44,38,32,0.28)' },
  ivory: { paper: '#faf6ec', paper2: '#f0eadb', ink: '#2a261e', inkSoft: 'rgba(42,38,30,0.55)', inkFaint: 'rgba(42,38,30,0.25)' },
  ash:   { paper: '#ecebe6', paper2: '#dedcd4', ink: '#1f1c18', inkSoft: 'rgba(31,28,24,0.55)', inkFaint: 'rgba(31,28,24,0.28)' },
} as const;

// 사진 placeholder 톤 (PhotoTile 전용)
export const PHOTO_TONES = [
  ['#d8c9a5', '#b8a279'],
  ['#cfd8c2', '#a3b491'],
  ['#dcc4b3', '#b89884'],
  ['#c8cdd4', '#9ba4ad'],
  ['#e1d3a8', '#bda973'],
] as const;

// 마커 배경 컬러 (Phase 3 B 마커 커스텀)
export const MARKER_BG = [
  '#d8c9a5', '#cfd8c2', '#e2c9bc', '#c9d2db', '#decfd8', '#f0ead2',
] as const;

// ── 폰트 ──────────────────────────────────────────────
export const FONT = {
  hand: `'Caveat', 'Gaegu', cursive`,                 // 손글씨 (제목·라벨·캡션)
  ui:   `'Noto Sans KR', system-ui, sans-serif`,      // 본문 UI
  mono: `'JetBrains Mono', ui-monospace, monospace`,  // 메타·태그·진행률
} as const;

// ── 폰트 사이즈 (와이어프레임 기준) ────────────────
export const FZ = {
  // mono
  mono7: 7, mono8: 8, mono9: 9, mono11: 11,
  // ui
  ui9: 9, ui10: 10, ui11: 11, ui12: 12, ui13: 13, ui14: 14,
  // hand
  hand12: 12, hand13: 13, hand14: 14, hand16: 16, hand18: 18, hand22: 22, hand24: 24, hand32: 32,
} as const;

// ── 라운드 ─────────────────────────────────────────────
export const R = {
  xs: 4,  sm: 6,  md: 8, lg: 10, xl: 12, xxl: 14, screen: 18,
  pill: 99,
} as const;

// ── 그림자 ─────────────────────────────────────────────
export const SH = {
  card:    '0 1px 0 rgba(0,0,0,0.04)',
  toast:   '0 8px 20px rgba(0,0,0,0.2)',
  fab:     '0 6px 0 rgba(0,0,0,0.08), 0 12px 24px rgba(0,0,0,0.18)',
  drawer:  '0 12px 28px rgba(0,0,0,0.18)',
  pin:     '0 2px 0 rgba(0,0,0,0.12)',
  pill:    '0 4px 10px rgba(0,0,0,0.10)',
} as const;

// ── z-index 시스템 ─────────────────────────────────────
export const Z = {
  base:      0,
  pin:       1,
  fab:       5,
  toggle:    10,
  header:    10,
  badge:     20,
  drawer:    30,
  statusBar: 50,
} as const;
```

## CSS 변수 동기화

`globals.css`에서 `:root`에 동일한 값을 CSS 변수로 둔다. 인라인 스타일에선 `color: 'var(--wf-ink)'` 식으로 참조.

```css
:root {
  --wf-paper: #f6f1e6;
  --wf-paper-2: #ede6d4;
  --wf-ink: #2c2620;
  --wf-ink-soft: rgba(44, 38, 32, 0.55);
  --wf-ink-faint: rgba(44, 38, 32, 0.28);
  --wf-sage: #8a9a7b;
  --wf-terra: #c0654a;
  --wf-hand: 'Caveat', 'Gaegu', cursive;
  --wf-ui: 'Noto Sans KR', system-ui, sans-serif;
  --wf-mono: 'JetBrains Mono', ui-monospace, monospace;
}

@keyframes spin { to { transform: rotate(360deg); } }
```

## 변경 영향

- 컬러 토큰을 바꿀 때: CSS 변수와 TypeScript 토큰을 **동시에** 수정.
- 다크모드 도입 시: `PAPER_TONES`에 `dark` 추가 + `:root[data-theme='dark']` 변수 override + body에 `data-theme` 토글.

## 절대 금지

- 컴포넌트에 색 hex 하드코딩 (PHOTO_TONES, MARKER_BG 예외).
- 폰트 패밀리 하드코딩.
- 임의 그림자/라운드 — 위 토큰에 없으면 추가 후 사용.
