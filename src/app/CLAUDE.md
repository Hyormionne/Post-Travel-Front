# src/app/ — App Router (CLAUDE.md)

Next.js App Router 라우트 정의 디렉터리. **이 폴더의 page.tsx는 thin wrapper**여야 한다.

## 1. 규칙

- 각 `page.tsx`는 `features/<domain>/<XxxPage>.tsx`를 import해서 그대로 렌더링한다.
- 페이지 단위 데이터 페칭(`fetch`, 서버 컴포넌트 로직)이 필요하면 여기서 처리하되, JSX 트리는 features 쪽 컴포넌트에 위임.
- `'use client'`가 필요한 페이지 (대부분 — 인터랙션, 상태가 있다)는 page.tsx 맨 위에 선언.

## 2. 라우트 매핑

| 파일 | 라우트 | 화면 | features 컴포넌트 |
|---|---|---|---|
| `page.tsx` | `/` | 메인 맵 | `features/map/MainMapPage` |
| `upload/page.tsx` | `/upload` | 사진 업로드 | `features/upload/PhotoUploadPage` |
| `metadata/page.tsx` | `/metadata` | 메타데이터 입력 | `features/upload/MetadataPage` |
| `clusters/page.tsx` | `/clusters` | AI 클러스터 결과 | `features/clusters/ClusterResultPage` |
| `generating/page.tsx` | `/generating` | 매직 직후 (지도 + 스피너 + 토스트) | `features/clusters/GeneratingPage` |
| `editor/page.tsx` | `/editor` | 블로그 에디터 | `features/blog/EditorPage` |
| `complete/page.tsx` | `/complete` | 알림 드로어 | `features/blog/CompletePage` |
| `timeline/page.tsx` | `/timeline` | 시간순 여행 | `features/trips/TimelinePage` |
| `trip-detail/page.tsx` | `/trip-detail` | 여행 상세 | `features/trips/TripDetailPage` |

## 3. layout.tsx

- `<html lang="ko">` 고정.
- `globals.css` import. Google Fonts (Caveat, Gaegu, JetBrains Mono, Noto Sans KR) preconnect.
- body 배경: `#f0eee9` (와이어프레임 캔버스 톤). 단, 실제 화면은 `Screen` 컴포넌트가 내부에서 paper 톤을 칠하므로 layout body는 캔버스 역할.
- 폰트는 Noto Sans KR을 기본으로 두고 손글씨가 필요한 곳에서만 Caveat/Gaegu 사용.

```html
<!-- preconnect 예시 -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Gaegu:wght@400;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

## 4. globals.css

- 와이어프레임 CSS 변수를 `:root`에 선언:
  - `--wf-paper`, `--wf-paper-2`, `--wf-ink`, `--wf-ink-soft`, `--wf-ink-faint`, `--wf-sage`, `--wf-terra`
- spinner 키프레임 정의: `@keyframes spin { to { transform: rotate(360deg); } }` (Phase 4C, 5C에서 사용).
- `html, body, #__next { margin:0; padding:0; height:100%; }`
- 폰트 fallback: `system-ui, sans-serif`.

## 5. 클라이언트/서버 컴포넌트 정책

- 현재 모든 페이지가 인터랙션·상태를 가지므로 `'use client'` 기본. 추후 SSG/SSR 도입 시 페이지 단위로 재검토.
- 인증이 필요한 페이지는 서버 컴포넌트에서 토큰 확인 후 redirect, 또는 클라이언트 측 가드 컴포넌트로 처리. **현 단계에서는 클라이언트 가드면 충분**.
