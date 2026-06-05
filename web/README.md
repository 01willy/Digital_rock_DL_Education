# Handoff: Digital Rock — 학습용 웹 UI & W1 슬라이드 덱

## Overview
"Digital Rock — Sparse Slice Interpolation" 6주 연구 교육 코스를 위한 **학생 학습용 웹사이트**와 **W1 강의 슬라이드 덱**입니다. Micro-CT 암석 단면 데이터를 sparse하게 측정하고 누락 슬라이스를 딥러닝으로 복원하는 연구를 학생이 따라가도록 돕습니다.

산출물은 두 가지:
1. **학습 웹 UI** (SPA) — 코스 홈, 주차별 페이지(W1 풀 콘텐츠 + W2~W6 미리보기), 인터랙티브 sparse/보간 데모, 환경 설치 가이드
2. **W1 슬라이드 덱** — 1조(심화)·2조(기본) 두 버전, 각 22장. 편집 가능한 PPTX로도 export 됨

대상 배포: GitHub repo `01willy/Digital_rock_DL_Education` 의 `web/` 폴더 → Vercel / GitHub Pages.

---

## About the Design Files
이 번들의 파일들은 **HTML로 만든 디자인 레퍼런스(프로토타입)** 입니다. 의도한 외형·동작·콘텐츠 구조를 보여주는 것이지, 그대로 프로덕션에 올리는 코드가 아닙니다.

목표는 이 디자인을 **타깃 코드베이스의 환경에서 재현**하는 것입니다. 다만 이 프로젝트는 아직 정해진 프레임워크가 없으므로(현재는 CDN React + in-browser Babel로 빠르게 프로토타이핑됨), 개발자는 다음 중 하나를 선택할 수 있습니다:
- **그대로 사용**: 정적 호스팅이면 현재 구조(바닐라 + CDN React)도 배포 가능. 단, in-browser Babel은 프로덕션에 부적합하므로 빌드 단계 추가 권장.
- **권장**: **Vite + React** (또는 Next.js — 정적 export). 현재 컴포넌트가 이미 React 함수 컴포넌트라 이식이 쉽습니다. JSX 파일들을 모듈로 분리하고 번들링만 붙이면 됩니다.

데이터(`data.js`)는 순수 객체라 그대로 재사용 가능합니다.

---

## Fidelity
**High-fidelity (hifi).** 최종 색상·타이포그래피·간격·인터랙션이 모두 확정되어 있습니다. 픽셀 단위로 재현하되, 타깃 코드베이스의 컴포넌트 라이브러리가 있으면 그 패턴으로 옮기세요. 디자인 토큰은 아래 명세를 그대로 사용합니다.

---

## Design Tokens

### Colors
| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | `#F7F5F1` | 페이지 배경 (웜 페이퍼). 덱은 `#F4F1EB` |
| `--panel` | `#FFFFFF` | 카드/패널 |
| `--panel-2` | `#FBFAF7` | 보조 패널/코드 라벨 |
| `--tint` | `#FDF2E4` | 오렌지 틴트 배경 |
| `--tint-navy` | `#EEF2F7` | 네이비 틴트 배경 |
| `--ink` | `#1A2333` | 본문 텍스트 |
| `--ink-2-solid` | `#5A6475` | 보조 텍스트 |
| `--ink-3` | `#8A93A3` | 약한 텍스트/캡션 |
| `--navy` | `#1F3A5F` | 브랜드 1차 (강조, 버튼, pore 색) |
| `--navy-700` | `#18304E` | 네이비 hover |
| `--orange` | `#EA851B` | 브랜드 강조 (측정·primary) |
| `--orange-600` | `#D4760F` | 오렌지 hover/텍스트 |
| `--orange-200` | `#F6C994` | 오렌지 밝은 톤 |
| `--green` | `#2E8B57` | non-DL/성공/체크 |
| `--red` | `#C83A3A` | 오차/경고 |
| `--line` | `#E8E3DA` | 보더 |
| `--line-2` | `#F0EBE2` | 약한 구분선 |

데이터 시각화(공극 단면): solid = `#EDE8DF`(RGB 237,232,223), pore = navy `#1F3A5F`, 오차 불일치 = red `#C83A3A`.

### Typography
- **Sans**: `Pretendard` (CDN: `jsdelivr orioncactus/pretendard@v1.3.9`). 한글 본문 전반.
- **Mono**: `JetBrains Mono` (Google Fonts, 400/500/700). 코드·수치·eyebrow·라벨.
- 스케일(웹): display `clamp(34px,5vw,56px)` / h1 `clamp(26px,3.4vw,38px)` / h2 24px / h3 19px / body 16px / 캡션 11–12px.
- `.eyebrow`: mono 12px, `letter-spacing:.12em`, uppercase, `--orange-600`.
- 제목 `letter-spacing` 음수(-.01 ~ -.025em), `line-height` 1.04~1.18.
- 덱(1920×1080): 본문 최소 21–27px, 제목 50–88px (절대 24px 미만 금지).

### Spacing / Radius / Shadow
- Radius: `--r-sm` 6 / `--r` 10 / `--r-lg` 16 / `--r-xl` 22 (px). (Tweaks로 둥글게/중간/각지게 토글 가능)
- Shadow: `--sh-sm` `0 1px 2px rgba(26,35,51,.05)` / `--sh` `0 2px 8px rgba(26,35,51,.06)` / `--sh-lg` `0 12px 32px rgba(26,35,51,.10)` / `--sh-orange` `0 6px 18px rgba(234,133,27,.22)`.
- 페이지 컨테이너: `max-width:1160px`(wide 1280), `padding:40px 32px 64px`.
- 섹션 간 수직 간격: 56–64px.

### Brand mark
4겹 슬라이스 스택(isometric diamond). 위→아래: navy / gray `#C9CCD2` / gray / orange. "측정=오렌지, 보간=회색"의 연구 모티프. SVG로 `components.jsx`의 `BrandMark`에 구현.

---

## Screens / Views

### 0. App Shell (`app.jsx`)
- **라우팅**: hash 기반. `#/home`, `#/w1`…`#/w6`, `#/demo`, `#/setup`. 라우트 변경 시 `window.scrollTo(0,0)`.
- **TopBar**(sticky, 64px, blur 배경): 브랜드 마크+이름, 네비(홈/W1 주차/데모/설치), 우측 **그룹 토글**(1조/2조, localStorage `dr_group`에 persist).
- **상태**: `group`(g1/g2), 라우트, Tweaks(accent/surface/radius).
- 하단 **SiteFooter**.

### 1. Home (`home.jsx` → `HomePage`)
- **Hero** (2열 grid 1.08:0.92): 좌측 — mono 태그칩, display 제목("Sparse 측정으로 빠르게, 딥러닝으로 정확하게."), lead, CTA 2개(W1 시작/데모), 메타 4개(6주·2그룹·256³·4도메인). 우측 — **Recon 카드**: `sparse_reconstruct k=2` 5칸 스트립(측정=오렌지 보더, 보간=대각 빗금 오버레이), 하단 통계 3개 + 범례.
- **Domain strip** (3열): BB/CastleGate/Bentheimer 썸네일 + φ값 + 노트.
- **6주 로드맵** (3열 grid): 주차 카드. 현재 주(now)는 오렌지 상단 바 + ring. 카드 = 번호/상태뱃지/제목/영문/요약/개념칩4/링크. 전체 클릭 가능 → 해당 주차.
- **그룹 비교** (2열): 1조/2조 카드. 상단 컬러 보더(navy/orange), 통계 3(슬라이드·셀·Try-it!), 과제 리스트(필수/선택 뱃지).
- **데모 티저**: 좌 카피 + CTA, 우 k-bar 차트(오렌지→네이비).

### 2. Week Page (`week.jsx`) — **범용 템플릿**
`WeekPage({weekN})` → `w.available`이면 `WeekFull`, 아니면 `WeekPreview`.

**WeekFull (W1):**
- Breadcrumb → Hero(번호/상태/non-DL 뱃지, 제목, 영문, lead) + 우측 사이드(학습 트랙 토글 + 선택 트랙 설명).
- **Resources** (4 카드): 강의 슬라이드(primary navy, 그룹별 덱 링크), 실습 노트북, 유틸리티 dr_utils.py, 핸드아웃. 그룹에 따라 내용/링크 변동.
- **Session flow** (`SESSION FLOW`): 타임라인. **시간 표기 없음** — STEP 01~05 + 활동 + 자료. (왼쪽 dot+bar 레일, `.noflow-time` grid)
- **자료 깊이 보기 가이드** (`week_guide.jsx` → `GuideSection`): 아래 3블록 — (a) **Playbook** 3카드(바꾼다→관찰→해석, 화살표 연결), (b) **Notebook walkthrough** 8셀(번호 레일 + 코드블록 + 설명) + **Try-it! 표**(sticky, 4박스), (c) **dr_utils 함수 레퍼런스** 8개 펼침 카드(그룹 뱃지·시그니처·설명·returns·파라미터별 실험 가이드).
- **Glossary**: 13개 용어 펼침 카드(3열).
- **Tasks**: 그룹별 탐구 과제(필수/선택).
- **Self-check**: Q1~Q5.
- **Next week**: W2 요약 + 준비물 + 미리보기 버튼.

**WeekPreview (W2~W6):** Hero + "준비 중" 사이드(준비물) + "이 주차에서 다룰 것"(plan grid) + NEW IN dr_utils.py + KEY CONCEPTS + "먼저 W1 완료" CTA.

### 3. Interactive Demo (`demo.jsx` + `volume.js`)
브라우저에서 합성 3D 공극 부피(64³, value-noise→threshold)를 생성해 sparse 보간을 실시간 시연.
- **좌 컬럼**(sticky): 컨트롤 — k 슬라이더(1–10), 측정 축 세그(z/y/x), thr 슬라이더(0.3–0.7). 측정 패턴 스트립(클릭 점프). 통계 4(측정 수·속도·시간절감·|Δφ|) + φ원본→복원.
- **우 컬럼**: 슬라이스 스크러버. 측정 슬라이스면 1-up(원본), 보간이면 **4-up**(앞 측정/선형 보간/원본 GT/오차맵 red). 하단 **k vs |Δφ| 곡선**(canvas, 클릭으로 k 선택).
- **인사이트 콜아웃** 3개(Try-it/탐구 과제 연계).
- 핵심 로직 `volume.js`(`window.VOL`): `makeVolume, reconstruct, errorCurve, getPlane, interpPlane, drawPlane, drawDiff`. dr_utils.py의 개념(load/porosity/make_sparse/linear_interpolate/reconstruct_sparse_linear)을 JS로 미러링.

### 4. Setup Guide (`setup.jsx`)
2열: 좌 — 단계별 설치(복사 가능한 코드블록 4) + 트러블슈팅 표. 우 — 환경 요약 카드(env/python/패키지) + 한글 폰트 팁.

---

## Interactions & Behavior
- **그룹 토글**: g1/g2. localStorage `dr_group` persist. 주차 페이지의 콘텐츠(슬라이드 수·셀·과제·덱 링크)가 그룹에 따라 바뀜.
- **로드맵 카드 클릭** → `#/w{n}`. 미공개 주차는 미리보기.
- **펼침 카드**(용어·함수·Try-it): 클릭 토글, `max-height` transition.
- **데모**: 슬라이더/세그 변경 시 `reconstruct`·`errorCurve` 재계산(useMemo), canvas 재draw(useEffect). 곡선 클릭으로 k 선택.
- **코드 복사**: navigator.clipboard, "복사됨" 1.4s 피드백.
- **슬라이드 entrance 애니메이션**: `[data-deck-active]` + `prefers-reduced-motion:no-preference`에서만. 기본 상태는 보이는 end-state(프린트/PDF 안전).
- **Tweaks 패널**: accent(3 오렌지 계열)/surface(3 배경)/radius(3). CSS 변수 오버라이드.
- **반응형**: 920px·640px·600px 브레이크포인트. 920 이하 grid 1–2열로 접힘, topnav 숨김.

## State Management
- `App`: `route`(useHashRoute), `group`(localStorage), `t`(tweaks).
- `Demo`: `axis`, `k`, `thr`, `view`(슬라이스 인덱스). 부피는 useMemo로 1회 생성.
- 펼침 카드: 각자 로컬 `open` boolean.
- 데이터 페칭 없음 — 전부 `data.js` 정적 객체 + 클라이언트 계산.

---

## Data Model (`data.js` → `window.COURSE`)
이식의 핵심. 순수 객체이므로 그대로 import.
- `meta`, `groups{g1,g2}`(name/tag/track/desc/accent).
- `weeks[6]`: `{n,status,slug,available,title,en,summary,concepts[],nonDL, plan[],newUtils[],prep[]}`. **W2~W6 확장은 여기 항목만 채우면 됨** — `available:true`로 바꾸고 풀 콘텐츠 필드 추가.
- `domains[3]`, `glossary[13]`.
- `w1`: `flow[5]`(시간 필드는 있으나 UI에서 미사용), `groups{g1,g2}`(slides/cells/tryits/notebook/tasks), `selfcheck[5]`.
- `guide`: `intro`, `notebook{file,cells[8],tryits[4]}`, `utils[8]`(함수 레퍼런스), `playbook[3]`.
- `setup`: env/py/steps/pkgs/troubles.

---

## Assets
- `web/assets/slices/*.png` — 실제 micro-CT 단면 6장(BB/Bentheimer/CastleGate × raw/bin). 사용자 제공 reference PPTX에서 크롭. **저작권: 연구실 자체 데이터.** 타깃에 그대로 복사.
- 아이콘: `components.jsx`의 `Icon` 컴포넌트(인라인 SVG stroke 세트). 외부 아이콘 라이브러리 미사용 — 코드베이스 아이콘 세트로 교체 가능.
- 폰트: Pretendard(CDN), JetBrains Mono(Google). 타깃에선 self-host 권장.

## Files (이 번들 내)
- `index.html` — SPA 진입점, 스크립트/스타일 로드 순서 참고.
- `css/app.css`(토큰·기본), `css/ui.css`(셸·홈), `css/pages.css`(데모·주차·설치), `css/guide.css`(가이드).
- `js/data.js`(데이터), `js/components.jsx`(공유), `js/home.jsx`, `js/week.jsx`, `js/week_guide.jsx`, `js/demo.jsx`, `js/volume.js`, `js/setup.jsx`, `js/setup.jsx`, `js/app.jsx`, `js/tweaks-panel.jsx`.
- `W1_deck.html`(1조), `W1_deck_group2.html`(2조), `deck/deck.css`, `deck/deck-stage.js`.
- `export/*.pptx` — 생성된 편집용 슬라이드.

### 덱 확장(W2~) 방법
`deck/deck.css`의 디자인 시스템을 공유하는 새 `W2_deck.html`을 만들고, `<deck-stage>` 안에 `<section>`을 추가하면 됩니다. 레이아웃 클래스(`.s-pad`, `.divider`, `.two`, `.fig`, `.dcard`, `.callout` 등)를 재사용하세요.

---

## Screenshots (`screenshots/`)
구현 시 시각 레퍼런스로 사용하세요. 모두 hifi 기준 캡처입니다.
| 파일 | 화면 |
|---|---|
| `01_home.png` | 홈 — Hero + Recon 카드 + 도메인 스트립 |
| `02_home_roadmap.png` | 홈 — 6주 로드맵 + 그룹 비교 |
| `03_week1_hero.png` | W1 — Hero + 트랙 토글 + 자료 카드 |
| `04_week1_guide.png` | W1 — 노트북 워크스루 + Try-it! 표 |
| `05_week1_utils.png` | W1 — dr_utils 함수 레퍼런스(펼침) |
| `06_demo.png` | 인터랙티브 sparse/보간 데모 |
| `07_setup.png` | 환경 설치 가이드 |
| `08_week2_preview.png` | W2 미리보기(범용 템플릿) |
| `09_deck_g1_cover.png` | W1 덱(1조) 표지 |
| `10_deck_g1_groupdiff.png` | W1 덱 — 1조/2조 트랙 비교 슬라이드 |
| `11_deck_g2_cover.png` | W1 덱(2조 Core) 표지 |
