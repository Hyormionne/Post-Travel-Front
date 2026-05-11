# src/ — 소스 디렉터리 (CLAUDE.md)

전체 구조 한눈 정리. 자세한 사양은 각 서브디렉터리의 CLAUDE.md에.

```
src/
├── app/               ← App Router (thin wrapper page.tsx)
├── features/          ← 도메인별 페이지 컴포넌트 + 도메인 로직
│   ├── upload/        ← Phase 2, 3 (업로드 + 메타)
│   ├── clusters/      ← Phase 4 (클러스터 결과 + 매직 직후)
│   ├── trips/         ← 여행 상세 + 타임라인
│   ├── map/           ← 메인 맵 (Phase 1/4C/5A 공통)
│   └── blog/          ← Phase 5 (에디터 + 알림 센터)
├── components/        ← 도메인 무관 공용 UI (Screen, MapBg, PhotoTile, ui.tsx)
├── theme/             ← 디자인 토큰 (단일 진실 출처)
├── types/             ← 도메인 타입 (API 응답과 1:1)
└── mocks/             ← 개발용 가짜 데이터
```

## 의존 방향

```
app ──→ features ──→ components ──→ theme
                 ↘
                  → types ← (mocks)
```

- `app/`는 `features/`만 import. components·theme·types 직접 import 지양.
- `features/`는 `components/`, `theme/`, `types/`, `mocks/`를 자유롭게 import.
- `components/`는 `theme/`, `types/`만. 다른 feature/component 의존 X.
- `theme/`, `types/`는 의존 없음.

## 작업 시작 시

1. 루트 `CLAUDE.md`로 프로젝트 컨셉·플로우·확정 사항 확인.
2. 작업 대상 폴더의 `CLAUDE.md` 정독.
3. 와이어프레임 좌표·간격·색은 짐작 X — 명시된 값 그대로.
4. 채팅 코멘트(루트 CLAUDE.md §7)는 **반드시** 반영. 잊으면 리뷰에서 잡힘.
