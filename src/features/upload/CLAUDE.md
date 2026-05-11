# src/features/upload/ — 사진 업로드 + 메타데이터 (CLAUDE.md)

Phase 2 (업로드) + Phase 3 (메타 입력) 화면. 핵심 컨셉: **Action First + Perceived Performance**.
업로드 대기 시간을 메타 입력 폼으로 "가려서" 체감 속도를 끌어올린다.

---

## PhotoUploadPage.tsx — `/upload` (Phase 2 B · 사이드바 + 그리드)

### 레이아웃

```
┌────────────────────────────────────────┐
│ ┃최근  │  최근 업로드           │ ← 상태바(28px)는 항상
│ ┃5월   │  47장 · 11 선택        │   Screen 컴포넌트에서 처리
│ ┃4월   ├────────────────────────┤
│ ┃★     │ [전체][인물][풍경][음식] (Pill)
│ ┃☁ GP  ├────────────────────────┤
│ ┃      │ ┌──┬──┬──┐
│ ┃      │ │ ✓│ ✓│  │
│ ┃      │ ├──┼──┼──┤
│ ┃      │ │  │ ✓│ ✓│  ← 3-col grid, gridAutoRows: 70
│ ┃      │ ├──┼──┼──┤
│ ┃      │ │ ✓│  │  │
│ ┃      ├────────────────────────┤
│ ┃      │ 11장             [다음 →]
└────────────────────────────────────────┘
```

### 사양

- 사이드바 폭 68px, 배경 `--wf-paper-2`, 오른쪽 1px faint border.
- 사이드바 항목: 패딩 `10px 4px`, 텍스트 가운데정렬. active면 배경을 `--wf-paper`로 바꾸고 **왼쪽 3px terra solid border** 표시 + fontWeight 600.
- 사이드바 카운트는 JetBrains Mono fontSize 7로 작게.
- 메인 영역 상단: paddingTop 32 (상태바 자리), 제목 fontSize 12 weight 600, "47장 · 11 선택" mono 9.
- 필터 Pill 행: gap 4, 첫 칩(`전체`)은 solid + INK 배경.
- 그리드: `gridTemplateColumns: repeat(3, 1fr)`, gap 4, `gridAutoRows: 70`. 선택된 사진은 SAGE 체크 뱃지 (16×16, top-left).
- 하단 액션바: 사이드바 right(left: 68)부터 시작. paper_2 배경, 1px ink border-top, padding 10. 좌측 "11장" weight 600 fontSize 11, 우측 primary 버튼 "다음 →".

### 폴더 데이터 (목)

```ts
[
  { n: '최근', c: 47, active: true },
  { n: '5월', c: 124 },
  { n: '4월', c: 86 },
  { n: '★', c: 32 },
  { n: '☁ GP', c: 1240 },
]
```

### 인터랙션

- 사이드바 항목 탭 → 해당 폴더로 필터 변경 (active 표시).
- 사진 카드 탭 → 선택 토글 (체크 뱃지).
- "다음 →" 탭 → `/metadata`로 라우팅. **선택된 photoIds를 함께 넘김** (URL query string 또는 zustand/context 등 임시 store).
- 필터 Pill — 카테고리 필터링 (현재는 시각만, 동작은 차후).

### API 연동

업로드는 **Presigned URL 3단계**. 두 단계 분리:

1. **사용자가 + 액션을 눌렀을 때** — 선택한 로컬 파일들에 대해:
   - `POST /photos/presigned-urls` 호출.
     - Body: `{ roomId, files: [{ name, size, contentType }] }`. **1회 1~50개**.
     - `contentType`은 **`image/jpeg` / `image/png` / `image/webp`만 허용**. 그 외는 클라이언트에서 미리 차단(또는 변환).
   - 응답은 **배열** — 각 항목 `{ photoId, original: {url, key}, thumbnail: {url, key} }`.
2. **클라이언트가 S3에 직접 PUT** — `original.url`과 `thumbnail.url`에 각각 HTTP PUT. 병렬 처리, 진행률 추적(`xhr.upload.onprogress`).
3. **모든 PUT 완료 시** — `POST /photos/complete`.
   - Body: `{ roomId, photos: PhotoCompleteItem[] }`.
   - 필수: `photoId`, `s3Key`, `fileSize`. 선택: `thumbnailKey`, `width`, `height`, `takenAt`, `lat`, `lng`.
   - EXIF에서 추출한 값을 함께 보내면 백엔드가 `TIME_GPS` 자동 클러스터링에 사용.
   - 응답: 완성된 Photo 객체 배열 (presigned GET URL `url`, `thumbnailUrl` 포함). `aiCaption`/`aiKeywords`/`sceneLabel`은 이 시점엔 null/[] — VLM 분석 후에 채워짐.

본 화면 진입 시 디폴트로 라이브러리(브라우저: File picker / 모바일 웹: input[capture])에서 사진을 받는다. 클라우드 폴더(`☁ GP`) 연동은 추후 — Google Photos OAuth 등 별도 흐름.

---

## MetadataPage.tsx — `/metadata` (Phase 3 B · 라이브 스트립 + 폼)

### 레이아웃

```
┌────────────────────────────────────────┐
│ ──────[상태바 28]──────                │
│ ┌── 상단 라이브 스트립 (height 84) ──┐ │  ← 채팅 코멘트:
│ │ 업로드 중 · 18 / 47    2.4 MB/s    │ │    "선이 약간 위로"
│ │ ▓▓▓▓░░░░░░ (Progress)             │ │     → 84 (원래 94)
│ │ [a][b][c][d][e][f][g] [+40]        │ │
│ └────────────────────────────────────┘ │
│ ┌── 하단 폼 (padding 14/16) ────────┐ │
│ │ 여행 이름 · 마커 커스텀  *필수    │ │
│ │ ┌──────────────────────────────┐   │ │
│ │ │ [마커  │ 배경 컬러 [][][][][]│   │ │
│ │ │  프리뷰│  스타일 [✦][폴][스][도][깃][리] │
│ │ │  ✨   │                     │   │ │
│ │ │  ✎이모지                    │   │ │
│ │ └──────────────────────────────┘   │ │
│ │ [ 홋카이도, 5월│              ]   │ │
│ │                                    │ │
│ │ 일행  *선택                       │ │
│ │ (지)(민)(+)                       │ │
│ │ yht.app/i/4Kj9..       🔗 복사    │ │
│ │                                    │ │
│ │ 대표 사진                          │ │
│ │ [K][L✓][M][N]                     │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### 사양

- **상단 스트립 height: 84** (채팅 코멘트 반영, 원래 94에서 줄임 — 마커 커스텀 텍스트와 구분선 간격 확보).
- 스트립 안: 상단에 mono 9로 "업로드 중 · 18 / 47" / "2.4 MB/s", 그 아래 Progress(value 0.38), 그 아래 PhotoTile 7개 + "+40" placeholder.
- PhotoTile dim: 앞 3개(업로드 완료)는 1.0, 나머지는 0.4.
- **하단 폼 영역 top: 124** (28 + 84 + 12 여백).
- 마커 커스텀 카드: 12px radius, 1.2 solid INK border, paper 배경, padding 10. 좌(70px 고정 마커 프리뷰)·우(flex 1 옵션) 분할.
- 마커 프리뷰: 52×52, `borderRadius: '50% 50% 50% 8%'`, `rotate(-45deg)`. 내부 이모지는 `rotate(45deg)` 보정.
- 이모지 입력 필드: 26 height, 가운데 이모지, 우측에 mono 7 ✎ 아이콘.
- **배경 컬러** 옵션 6종 (24×24, radius 6, 첫 번째는 INK solid border 1.6):
  - `#d8c9a5`, `#cfd8c2`, `#e2c9bc`, `#c9d2db`, `#decfd8`, `#f0ead2`
- **스타일** 옵션 6종 (각 24×24 컨테이너, active는 PAPER 배경 + INK 1.4 border):
  - `클래식` (티어드롭, 회전 -45deg)
  - `폴라로이드` (사각 + 살짝 기울임)
  - `스티커` (원 + 흰 inner border + 그림자)
  - `도트` (작은 원 + 외곽 글로우)
  - `깃발` (세로 막대 + 페넌트)
  - `리본` (양끝 V자)
- 여행 이름 입력: dashed=false Box, padding 12/14, placeholder는 INK 색 (실제 입력값 표시 스타일).
- 일행 영역: 32×32 원형 아바타 + "+" placeholder + 초대 링크 Box (copy 액션).
- 대표 사진: 48×48 PhotoTile 4장, 두 번째 picked.

### 인터랙션

- 진행률은 `POST /photos/presigned-urls` 이후 S3 PUT 진행률을 실시간 반영. 모든 업로드 완료 시 `POST /photos/complete` 호출.
- "준비 완료" CTA (없으면 추가) → 현재 입력값으로 **`POST /rooms`** 호출 → roomId 받아 다음 단계(`/clusters`)로.
- 마커 커스텀 값은 room metadata로 함께 저장.
- 일행 초대 링크: `GET /rooms/join/:token` 패턴. **이 페이지에서는 token 생성 후 링크 표시만** 하고, 실제 참가는 다른 디바이스에서.

### API 연동

- **방 생성**: `POST /rooms` body `{ "title": "홋카이도, 5월" }` → 응답에서 `id`, `inviteToken` 받음.
  - **마커 커스텀(이모지/색/모양)은 현재 API 스키마에 없음** — 클라이언트 측 로컬 보관(localStorage 또는 추후 user 설정 API)으로 시작. 백엔드 협의 후 Room 응답에 추가 협상.
- **방 생성 후 다음 단계**: 받은 `roomId`를 `/upload`에 넘기지 말고, **방 생성을 메타 입력 직후가 아니라 업로드 시작 직전에** 한다. 즉:
  - `/metadata`에서 메타 입력 완료 → `POST /rooms` → 받은 `roomId`로 `/photos/presigned-urls` → S3 PUT → `/photos/complete` → `/clusters`로 라우팅.
  - 또는 흐름을 단순화하려면 `/upload` 진입 시 방을 미리 만들고 `/metadata`에서 `PATCH /rooms/:roomId`로 제목 갱신.
- **업로드 진행률**: 클라이언트가 S3 PUT의 `xhr.upload.onprogress`로 추적. 또한 `/photos/complete` 후 백엔드의 GPU 분석 진행률은 **WebSocket `photo:processing_progress`** 로 받음 (`features/map/CLAUDE.md` 참조).
- **일행 초대**: `inviteToken`을 URL로 만들어 표시. 다른 사용자가 `GET /rooms/join/:token` 호출하면 멤버 가입.
- 토큰 재발급이 필요할 때: `POST /rooms/:roomId/invite-token` (OWNER만).

---

## 공용 사항

- 사용자가 `/upload`에서 선택한 photoIds + `/metadata`에서 입력한 메타는 같은 흐름이므로 **간단한 zustand store 또는 React Context**로 관리. 페이지 이탈 시 보존, 완료 시 초기화.
- 두 페이지 모두 폰 폭 332 가정. 데스크탑에서는 캔버스 가운데 폰 목업으로 표시.
