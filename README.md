# Digital Rock — Sparse Slice Interpolation 6주 학생 코스

> 학부생/대학원생을 위한 educational repo.
> 강사·조교·학생 모두를 위한 자료 모음.

## 🌐 학습 사이트

- **Web UI**: (Vercel 배포 URL — 추후 추가)
- **Source**: [`web/`](web/) 폴더 — 정적 사이트 (백엔드 없음, `localStorage` 진도 저장)

학생은 위 URL에 접속해 본인 조(1조/2조)를 선택 → 6주 교재로 진입.
로컬에서 jupyter로 실습하고 싶으면 아래 \"빠른 시작\" 참고.

---

## 🗂 폴더 구조

```
education_package_2026/
├── README.md
├── COMMON/                        # 모든 조 공통 자료 (먼저 읽기)
│   ├── requirements_student.txt
│   ├── environment_setup_guide.md
│   ├── design_palette.md
│   ├── ppt_theme.py
│   └── data_extra/                # 6 도메인 + README
├── web/                           # 학생 학습 UI (React+JSX, 정적)
├── group1_advanced/               # 1조 (DL 경험 있음)
│   ├── week1/  (full content)
│   ├── week2/  (full content — mini UNet 학습 skeleton)
│   ├── week3/  (skeleton)
│   ├── week4/  (skeleton)
│   ├── week5/  (skeleton)
│   └── week6/  (skeleton)
└── group2_intro/                  # 2조 (DL 입문)
    └── (동일 구조, 콘텐츠 더 친절·단계별)
```

---

## 📅 신 6주 코스 (2026-06-05 재정비)

| 주차 | 주제 | 상태 |
|------|------|------|
| **W1** | 데이터 탐색 + Classical Baseline (전처리 + Otsu + Linear/Cubic + k sweep) | ✅ Full |
| **W2** | Deep Learning 입문 + mini UNet 학습 (10/30/60분 옵션) | ✅ Full |
| **W3** | 손실 함수 + HPO 입문 (6 losses + Optuna) | 📋 Skeleton |
| **W4** | 다른 아키텍처 비교 (UNetG vs SwinUNet vs 3D UNet) | 📋 Skeleton |
| **W5** | Tri-Axis Aggregation (본 연구 핵심, 3 GT-free 방법) | 📋 Skeleton |
| **W6** | Cross-domain + Carbonate (Ketton/Estaillades) + LBM + 발표 | 📋 Skeleton |

> Skeleton = 폴더 구조 + notebook 셀 구조 + PPT 8장 + handout 골격. 풀콘텐츠는 단계적 작성.

---

## 👥 조별 차등

| 항목 | 1조 (Advanced) | 2조 (Intro) |
|------|----------------|-------------|
| 대상 | DL/ML 기초 + Python 프로젝트 경험 | Python 기초만 |
| W1 도메인 | BB + CG + Bentheimer + Parker (4개) | BB + CG + Parker (3개) |
| W2 학습 | mini UNet 10/30/60분 모든 옵션 | fast (10분) 권장 |
| Notebook 셀 | ~17 | ~20 (단계별 + 보조 설명) |
| 탐구 과제 | 4문항 (필수 + 도전) | 4문항 (필수 + 선택) |

**공통 학습 원칙**: \"코드를 직접 짜기보다, 배포된 함수의 파라미터를 바꿔보며 결과 변화를 관찰\"

---

## 🚀 학생을 위한 빠른 시작

### 1) 환경 설정 (한 번)
```bash
cat COMMON/environment_setup_guide.md   # 상세 가이드
# 핵심만:
conda create -n rock python=3.10 -y && conda activate rock
pip install -r COMMON/requirements_student.txt
```

### 2) 본인 조의 W1 시작
```bash
cd group1_advanced/week1/notebooks/      # 1조
# or: cd group2_intro/week1/notebooks/   # 2조
jupyter notebook W1_load_and_explore.ipynb
```

### 3) PPT + handout 함께 보기
- `slides/W{n}_group{1,2}.pptx`
- `handout/W{n}_handout.md`

---

## 🖥 학생 노트북 요구사양

| 항목 | 요구 |
|------|------|
| OS | Windows / macOS / Linux |
| Python | 3.9+ (3.10 권장) |
| RAM | 8 GB+ |
| 디스크 | ~5 GB 여유 |
| **GPU** | **불필요** — W2 학습은 mini UNet (CPU 10~60분) |

---

## 🎨 디자인 톤

- **Pretendard 폰트** (한+영)
- **#EA851B 오렌지** 강조색, **#181818** 본문
- **16:9 PPT**, 슬라이드당 메시지 1개, 다이어그램 > 텍스트

상세: `COMMON/design_palette.md`

---

## 📦 데이터 도메인 (6개)

| 도메인 | 종류 | φ | voxel | 사용 주차 |
|--------|------|---|-------|-----------|
| BB | sandstone | 22% | 2.25μm | W1~W6 (기준) |
| CastleGate | sandstone | 28% | 2.25μm | W1~W5 |
| Bentheimer | sandstone | 23% | 2.25μm | 1조 W1~W5 |
| Parker | sandstone | 12% | 2.25μm | W1~W6 (저공극) |
| Ketton | carbonate | 12% | 3.00μm | W6 (cross-domain) |
| Estaillades | carbonate | 10% | 3.31μm | W6 (인코딩 교육 포인트) |

→ Ketton/Estaillades 원본은 \"1=solid\" 인코딩이므로 `1 - vol` 처리됨. 학생에게 \"인코딩 sanity check\" 교훈으로 사용.

---

## 📅 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-02 | W1 prototype 완성 (1조/2조 분리) |
| 2026-06-04 | Claude 디자인 web UI 통합, 6 도메인 확장, data.js 재작성 |
| 2026-06-05 | 신 6주 타임라인 적용 — W1 재정비 (구 W1+W2 통합), W2 신규 (mini UNet), W3~W6 skeleton |

---

문의: 본 코스 강사 / 조교
