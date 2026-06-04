# Digital Rock — Sparse Slice Interpolation 6주 학생 코스

> 학부생/대학원생을 위한 educational repo.
> 이 repo는 강사·조교·학생 모두를 위한 자료 모음입니다.

## 🌐 학생용 학습 사이트

- **Web UI**: (Vercel 배포 URL — 추후 추가)
- **Source**: [`web/`](web/) 폴더 — 정적 사이트 (백엔드 없음, `localStorage` 진도 저장)

학생은 위 URL에 접속해 본인 조(1조/2조)를 선택하면 6주 교재로 바로 진입합니다.
직접 로컬에서 jupyter notebook을 돌리고 싶은 학생은 아래 \"빠른 시작\" 참고.

---

## 📁 폴더 구조

```
education_package_2026/
├── README.md                       ← 지금 보고 있는 파일
├── COMMON/                         ← 모든 조 공통 자료 (먼저 읽으세요)
│   ├── requirements_student.txt    ← pip 패키지 목록
│   ├── environment_setup_guide.md  ← 가상환경 + Python 설치 가이드
│   ├── design_palette.md           ← PPT/figure 디자인 가이드 (강사용)
│   └── ppt_theme.py                ← PPT 빌더 helper (강사용)
├── group1_advanced/                ← 1조 (DL 경험 있는 학생)
│   └── week1/
│       ├── slides/W1_group1.pptx
│       ├── notebooks/W1_load_and_explore.ipynb
│       ├── helpers/dr_utils.py
│       ├── data/  (BB + CastleGate + Bentheimer 256³, 약 48 MB)
│       ├── handout/W1_handout.md
│       └── README.md
└── group2_intro/                   ← 2조 (Python만 알고 DL 처음 배우는 학생)
    └── week1/
        ├── slides/W1_group2.pptx
        ├── notebooks/W1_load_and_explore.ipynb
        ├── helpers/dr_utils.py
        ├── data/  (BB + CastleGate 256³, 약 32 MB)
        ├── handout/W1_handout.md
        └── README.md
```

매주 새 폴더 (`week2`, `week3`, ..., `week6`) 가 추가됩니다.

---

## 🎯 코스 개요

**연구 주제**: Sparse micro-CT 영상에서 누락된 슬라이스를 deep learning으로 복원하고, 세 축 보간 결과를 통합(tri-axis aggregation) 하여 암석의 물리 특성(공극률·표면적·투과성)을 보존하는 시스템 개발.

| 주차 | 주제 | 핵심 기법 |
|------|------|-----------|
| **W1** | 데이터 탐색 + 문제 정의 | voxel / 공극률 / sparse imaging |
| **W2** | Classical baseline | scipy 선형 / Cubic 보간 |
| **W3** | 2D UNet 기초 | 모델 구조 + 미니 학습 (1조) / pre-trained inference (2조) |
| **W4** | 손실 함수 | L1, SSIM, 형태 보존 (porosity loss 등) |
| **W5** | Tri-axis aggregation | 세 방향 통합 — 본 연구의 핵심 contribution |
| **W6** | 평가 / 벤치마크 / 발표 | 비교 표 + 도메인 일반화 |

---

## 👥 조별 차등 — 무엇이 다른가?

| 항목 | 1조 (Advanced) | 2조 (Intro) |
|------|----------------|-------------|
| 대상 | DL/ML 기초 + Python 프로젝트 경험 | Python 기초만 |
| W1 학습 시간 | 90분 (이론 25 + 실습 35 + 후반 + 과제) | 90분 (이론 30 + 실습 35 + 후반 + 과제) |
| 데이터 | BB + CastleGate + Bentheimer (3개) | BB + CastleGate (2개) |
| Notebook 셀 수 | ~17 셀, 미니 ML 코드 포함 | ~20 셀, 단계별 + 보조 설명 박스 |
| 탐구 과제 | 4문항 (필수 2 + 선택 2, 도전 포함) | 4문항 (필수 2 + 선택 2) |
| 슬라이드 수 | 20장 (밀도 약간 높음) | 22장 (단계별, 친절) |
| 후반 진도 | 단순 보간 → 미니 ML reconstruction → k sweep 정량 분석 | 슬라이스 시각화 + 슬랩 분석 + α sweep 시각 |

**공통 원칙** (양쪽 모두):
- **\"코드를 직접 짜기보다, 배포된 함수의 파라미터를 바꿔보며 결과 변화를 관찰\"**
- `[Try-it!]` 박스 — 변수 값 sweep
- `[해석 질문]` 박스 — 결과를 자신의 말로 해석
- helper module은 양쪽 동일 (`dr_utils.py`) — 함수 시그니처는 같지만 1조용에는 미니 ML 함수가 더 포함됨

---

## 🚀 학생을 위한 빠른 시작

### 1단계 — 환경 설정 (한 번만)
```bash
# COMMON 폴더의 가이드 따라 진행
cat COMMON/environment_setup_guide.md

# 핵심만 요약:
conda create -n rock python=3.10 -y
conda activate rock
pip install -r COMMON/requirements_student.txt
```

### 2단계 — 본인 조의 W1 시작
```bash
# 1조 학생
cd group1_advanced/week1/notebooks/
jupyter notebook W1_load_and_explore.ipynb

# 2조 학생
cd group2_intro/week1/notebooks/
jupyter notebook W1_load_and_explore.ipynb
```

### 3단계 — 슬라이드 + handout 함께 보기
- `slides/W1_group<n>.pptx` 를 띄워 강의 흐름 확인
- `handout/W1_handout.md` 를 옆에 두고 자기 점검 / 과제 진행

---

## 🖥 컴퓨터 요구 사양 (학생 노트북)

| 항목 | 요구 |
|------|------|
| OS | Windows / macOS / Linux 모두 가능 |
| Python | 3.9 이상 (3.10 권장) |
| RAM | 8 GB 이상 |
| 디스크 | 약 5 GB 여유 |
| **GPU** | **불필요** — W3 학습은 mini 모델 또는 사전 학습 ckpt 사용 |

자세한 내용: `COMMON/environment_setup_guide.md`

---

## 🎨 강사·조교용 자료

- `COMMON/design_palette.md` — 색/폰트 통일 가이드 (Pretendard + 오렌지 톤)
- `COMMON/ppt_theme.py` — 새 PPT 빌드용 helper module (W2~W6 만들 때 재사용)
- 각 조 `week*/slides/figs/` — PPT에 삽입된 figure png들 (matplotlib 재생성 가능)

---

## 📝 라이센스 & 출처

- 데이터: Brazil sandstone, CastleGate sandstone, Bentheimer sandstone (micro-CT 2.25μm 스캔)
- 연구 코드 출처: `/home/willy010313/Digital_Rock/slice_interp_research/`
- 본 educational package: 2026, 내부 교육용 (외부 공개 시 별도 확인)

---

## 📅 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-02 | W1 prototype 완성 (1조 / 2조 분리 배포) |

---

문의: 본 코스 강사 / 조교
