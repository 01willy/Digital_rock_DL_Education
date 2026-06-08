# Digital Rock — Sparse Slice Interpolation 6주 학생 코스

학부생/대학원생 대상 교육 repo. 강사·조교·학생 모두를 위한 자료 모음.

## 학습 사이트

- **Web UI**: https://digital-rock-dl-education.vercel.app/
- 본 자료는 모든 학생 공통. 2조 학생은 보조 노트(개념 풀이 · 코드 walkthrough · mini 예제)도 함께 제공됩니다.

## 폴더 구조

```
education_package_2026/
├── README.md
├── COMMON/
│   ├── requirements_student.txt
│   ├── environment_setup_guide.md
│   ├── design_palette.md
│   ├── ppt_theme.py
│   ├── data_extra/                 추가 도메인 (Ketton · Estaillades · Parker · Berea)
│   └── shared/                     ★ 본 자료 (모든 학생 공통)
│       ├── week1/
│       │   ├── notebooks/W1_load_and_explore.ipynb
│       │   ├── helpers/dr_utils.py
│       │   ├── handout/W1_handout.md
│       │   ├── slides/W1.pptx
│       │   └── data/  (4 도메인 256³ binary)
│       └── week2/
│           └── (+ model_utils.py)
├── group2_supplement/              ★ 2조 전용 보조 노트
│   ├── week1/
│   │   ├── W1_concept_notes.md     개념 풀이 (voxel · normalize · Otsu · sparse · baseline 등)
│   │   ├── W1_code_walkthrough.md  본 노트북 셀별 코드 + 인자 변경 가이드
│   │   └── W1_extra_examples.ipynb 단계별 mini 예제 4개
│   └── week2/
│       └── (DL 개념 풀이 · model_utils walkthrough · mini 학습 데모)
├── web/                            정적 사이트 (Vercel)
└── _legacy/                        이전 group1_advanced · group2_intro 자료 (참고용 보존)
```

## 6주 주차

| 주차 | 주제 |
|------|------|
| W1 | 데이터 탐색 + Classical Baseline (Linear / Cubic) |
| W2 | Deep Learning 입문 — UNet · pix2pix 구조 |
| W3 | 적대적 학습 — pix2pix GAN |
| W4 | 다른 아키텍처 비교 — Transformer · 3D |
| W5 | 한계 극복 기법 — tri-axis · multi-k · 증강 |
| W6 | Cross-domain 분석 — Zero-shot · Fine-tune |

## 학생 시작 가이드

### 1) 환경 설정
```bash
cat COMMON/environment_setup_guide.md
# 핵심:
conda create -n rock python=3.10 -y && conda activate rock
pip install -r COMMON/requirements_student.txt
```

### 2) 자료 받기 (사이트에서 다운로드)
- 강의 슬라이드 (`W1.pptx`)
- 실습 노트북 (`W1_load_and_explore.ipynb`)
- 유틸리티 (`dr_utils.py`)
- 핸드아웃 (`W1_handout.md`)
- 데이터 (`data_w1.zip` — 4 도메인 256³ binary)

### 3) 2조 학생은 추가로
- 보조 노트 3종 (개념 풀이 · 코드 walkthrough · mini 예제)

### 4) 노트북 실행
```bash
cd <학생 작업 폴더>
jupyter notebook W1_load_and_explore.ipynb
```

## 컴퓨터 요구사양

- OS: Windows / macOS / Linux
- Python 3.9+ (3.10 권장)
- RAM 8 GB+
- GPU 불필요 — W2 학습은 mini UNet (CPU 10~60분)

## 데이터 도메인

| 도메인 | 종류 | φ | voxel | 사용 주차 |
|--------|------|---|-------|-----------|
| BB | sandstone | 22% | 2.25μm | W1~W6 |
| CastleGate | sandstone | 28% | 2.25μm | W1~W5 |
| Bentheimer | sandstone | 23% | 2.25μm | W1~W5 |
| Parker | sandstone | 12% | 2.25μm | W1~W6 |
| Ketton | carbonate | 12% | 3.00μm | W6 |
| Estaillades | carbonate | 10% | 3.31μm | W6 |

Ketton·Estaillades 원본은 인코딩이 반대(1=solid)였기에 `1 - vol` 처리됨 — W6 인코딩 sanity check 교육 포인트.

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-02 | W1 prototype |
| 2026-06-04 | Claude 디자인 web UI 통합, 6 도메인 확장 |
| 2026-06-05 | 신 6주 타임라인 + W2 신규 |
| 2026-06-08 | 1조/2조 자료 통합 (COMMON/shared/) + 2조 보조 노트 (group2_supplement/) 구조로 전환 |
