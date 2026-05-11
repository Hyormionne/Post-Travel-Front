# src/features/ — 도메인별 페이지 컴포넌트 (CLAUDE.md)

화면 단위 페이지가 도메인 별로 묶여 있는 디렉터리. `src/app/`의 라우트 page.tsx는 이 디렉터리의 페이지 컴포넌트를 import만 한다.

## 1. 디렉터리 매핑

| 디렉터리 | 담당 화면 | Phase |
|---|---|---|
| `upload/` | 사진 업로드, 메타데이터 입력 | 2, 3 |
| `clusters/` | AI 클러스터 결과, 매직 직후 (지도 복귀) | 4 A, 4 C |
| `trips/` | 여행 상세, 타임라인 뷰 | 부가 |
| `map/` | 메인 맵 (idle/generating/notified 모드) | 1 A, 4 C, 5 A 공통 |
| `blog/` | 블로그 에디터, 알림 센터 드로어 | 5 B, 5 C |

각 서브디렉터리에 자체 CLAUDE.md가 있다. 화면 단위 사양은 거기서 본다.

## 2. 폴더 구조 규칙

각 feature 폴더는 다음 구조를 따른다:

```
features/<domain>/
├── CLAUDE.md             ← 해당 도메인 사양
├── <DomainPage>.tsx      ← 메인 페이지 컴포넌트 (default export)
├── components/           ← 해당 도메인에서만 쓰는 하위 컴포넌트
│   └── FolderCard.tsx
├── hooks/                ← 해당 도메인 hooks
│   └── useClusters.ts
└── api.ts                ← 해당 도메인 API 함수 모음
```

도메인 무관 공용 컴포넌트는 `src/components/`로.

## 3. API 호출 패턴

- 페이지 진입 시: `useEffect` 또는 React Query/SWR `useQuery`.
- 액션 트리거: `useMutation` 또는 단순 async 함수.
- 401 인터셉터로 `POST /auth/refresh` 자동 호출 → 실패 시 로그인 페이지로.
- **`/auth/refresh`와 `/auth/logout`은 Authorization 헤더에 refresh token을 실음** (access 아님). interceptor 분기 주의.
- 모든 API 호출은 `api.ts` 파일에 함수로 캡슐화 (UI는 fetch 디테일 모름).

## 3b. 실시간 (WebSocket) 패턴

- Socket.IO 클라이언트 인스턴스는 **앱 전역 단일** (`RootProvider` 또는 zustand store).
- 진입한 방에 `socket.emit('room:subscribe', { roomId })`. 화면 이탈 후에도 백그라운드 알림 수신을 위해 구독 유지.
- 이벤트는 도메인별로 hook으로 캡슐화:
  - `features/clusters/hooks/useClusterStream.ts` — `cluster:created`, `photo:processing_progress`
  - `features/blog/hooks/useBlogStream.ts` — `blog:updated`, `blog:published`
- 누적된 알림(Phase 5 C 용)은 별도 store(`useNotificationsStore`)에 모음.

## 4. 라우팅 헬퍼

페이지 간 이동은 `next/navigation`의 `useRouter().push(...)`.
URL query로 넘기는 정보:
- `/clusters?roomId=...`
- `/generating?roomId=...&jobId=...`
- `/editor?blogId=...` 또는 `?roomId=...`
- `/trip-detail?roomId=...`

복잡한 임시 상태(선택된 photoIds 등)는 zustand store에. URL이 깨끗해야 공유·뒤로가기에 강함.

## 5. 시각 통일

- Phase 1 A · 4 C · 5 A는 시각적으로 거의 동일하므로 `features/map/MainMapPage`를 **세 화면이 공유**한다.
- `features/clusters/GeneratingPage`는 그 안에서 `<MainMapPage mode="generating" />`를 렌더.
- 메인 맵의 하단 쉘(좌측 토글 + 우측 FAB)은 여행 상세·타임라인에서도 재사용된다 → `MainShell` 컴포넌트로 묶어 `features/trips`와 `features/map`이 함께 import. 위치는 `components/MainShell.tsx`.

## 6. 작업 순서 (각 페이지 만들 때)

1. 해당 서브디렉터리의 CLAUDE.md 정독.
2. 와이어프레임 좌표·간격·색을 **그대로** 옮긴다. 짐작 금지.
3. 목 데이터로 먼저 렌더링이 픽셀-매치되는지 확인.
4. API 함수 정의 (`api.ts`) → 페이지에 연결.
5. 인터랙션 (탭, 라우팅, 입력) 처리.
6. 로딩/에러/빈 상태.
