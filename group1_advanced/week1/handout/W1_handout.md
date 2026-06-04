# Week 1 Handout — 1조 (Advanced)

> **Digital Rock — Sparse Slice Interpolation 6주 코스 · 1주차**
> 학생용 배포자료 — 노트북 옆에 띄워두고 함께 진행하세요.

---

## 0. 시작 전 체크리스트

- [ ] `COMMON/environment_setup_guide.md` 의 설치 가이드 완료
- [ ] 가상환경 `rock` 활성화 (`conda activate rock`)
- [ ] `group1_advanced/week1/` 폴더 전체 (data 포함 ~48 MB) 확보
- [ ] 다음 패키지 동작 확인: `python3 -c "import numpy, matplotlib; print('OK')"`

실행:
```bash
cd group1_advanced/week1/notebooks/
jupyter notebook W1_load_and_explore.ipynb
```

---

## 1. 학습 흐름 (권장 90분 세션)

| 시간 | 활동 | 자료 |
|------|------|------|
| 0~25분 | 강의 + 개념 | `slides/W1_group1.pptx` 슬라이드 1~12 |
| 25~60분 | 노트북 실행 + [Try-it!] 박스 실험 | `notebooks/W1_load_and_explore.ipynb` |
| 60~75분 | 슬라이드 13~18 강의 + 노트북 후반 | (sparse + 선형 보간) |
| 75~85분 | 자기 점검 + 탐구 과제 시작 | 본 handout 4번 |
| 85~90분 | Q&A + W2 예고 | 슬라이드 19~20 |

---

## 2. 핵심 용어 사전

| 용어 | 정의 |
|------|------|
| **Voxel** | 3D 픽셀. `volume[z, y, x]` 의 한 칸 |
| **Slice** | 3D 부피를 한 평면으로 자른 2D 이미지 |
| **Porosity (φ)** | 전체 voxel 중 공극(pore)이 차지하는 비율. 0~1 |
| **Micro-CT** | X-ray 마이크로 단층촬영. 본 데이터의 출처 |
| **Slab** | 부피를 한 방향으로 자른 두꺼운 덩어리. 슬랩별 통계 분석에 사용 |
| **Isotropy** | 세 축 방향이 통계적으로 같은 성질. 본 연구 가정 중 하나 |
| **Sparse imaging** | 모든 슬라이스를 측정하지 않고 일부만 측정하는 전략 |
| **k (sparse 간격)** | 슬라이스 간격. k=3 → 3장 중 1장 측정 |
| **Interpolation** | 측정되지 않은 슬라이스를 측정된 슬라이스로부터 복원하는 작업 |
| **\|Δφ\|** | 보간 후 공극률 오차. 본 연구의 핵심 평가 metric |
| **Tri-axis aggregation** | "세 방향 보간 결과 통합" — W5에서 다룸 |

---

## 3. 노트북 [Try-it!] 박스 정리

본 노트북에는 다음 5개 [Try-it!] 박스가 있습니다. 모두 직접 실험해주세요:

| # | 위치 (셀) | 무엇을 바꾸나 | 무엇을 관찰하나 |
|---|-----------|---------------|-----------------|
| ① | `show_three_axis` | z, y, x 슬라이스 인덱스 | 가장자리 vs 중앙 차이 |
| ② | `porosity_profile` | 도메인, n_slabs | 등방성 / trade-off |
| ③ | `make_sparse` | k 값 (1~10) | 시간 절감 / 측정 슬라이스 수 |
| ④ | `linear_interpolate_slice` | 두 슬라이스 간격 | α=0.5 결과의 흐려짐 |
| ⑤ | `reconstruct_sparse_linear` | vol 도메인 | 도메인별 보간 난이도 |

---

## 4. 탐구 과제 (W2 시작 전까지)

### 과제 1 — 도메인 간 비교 (필수)

세 도메인(BB, CastleGate, Bentheimer) 모두에 대해 `k=[1,2,3,5,7,10]` sweep을 수행하고, 결과를 **한 plot에 세 곡선으로 겹쳐** 그리세요.

**보고할 내용:**
- 어느 도메인의 sparse 보간이 가장 \"쉬운\" 가? (= |Δφ|가 가장 작은가)
- 그 이유에 대한 가설 1~2가지 (공극률, 등방성, 구조 복잡성 등 어느 것이 영향?)

### 과제 2 — 축별 비교 (필수)

`make_sparse(vol, k=3, axis=...)` 에서 axis를 0, 1, 2로 바꿔서 sparse 시뮬레이션이 가능합니다.

**할 일**: BB 사암에 대해 **z, y, x 세 축 각각에 대해 k=3 보간을 수행**하고 |Δφ|를 비교하세요. (`reconstruct_sparse_linear` 의 axis 인자도 같이 바꿔야 합니다.)

**보고할 내용:**
- 세 축의 |Δφ| 가 정확히 같은가? 다르다면 그 차이는 무엇을 의미하나?
- 본 연구의 \"세 방향 통합\" (tri-axis aggregation) 이 왜 합리적인지 자신의 말로 설명.

### 과제 3 — 임계값 sensitivity (선택, 도전)

`reconstruct_sparse_linear` 함수 안에 `(interp > 0.5).astype(np.float32)` 부분이 있습니다 — 보간 결과를 이진화하는 임계값입니다.

**할 일**: 이 함수를 복사해서 새 함수 `reconstruct_with_threshold(vol, k, thr)` 를 만들고, `thr ∈ {0.3, 0.4, 0.5, 0.6, 0.7}` 각각에 대해 k=5에서의 복원 결과의 공극률을 측정.

**보고할 내용:**
- 임계값과 복원된 공극률의 관계 (monotonic? 어느 방향?)
- "원본 공극률과 같아지는" 최적 임계값은 얼마인가?
- 이 임계값이 \"오차 절대값(|Δφ|)을 0으로 만들지만\" 정말 \"정확한 복원\" 이라 할 수 있을까? (힌트: 다른 metric 필요)

### 과제 4 — Random sparse 시나리오 (선택, 심화)

본 노트북은 \"k개마다 1개\" 라는 **결정적(deterministic) sparse** 만 다뤘습니다.

만약 \"전체 슬라이스에서 무작위로 30%만 측정\" 하는 **random sparse** 라면?

**할 일**:
1. `numpy.random.choice` 또는 `numpy.random.rand` 를 활용해 random sparse 마스크를 만드는 함수를 작성.
2. BB 256³ 부피에서 measured ratio = 33% (즉 k=3 deterministic과 같은 데이터 양) 인 random sparse를 시뮬레이션.
3. 누락 슬라이스를 \"가장 가까운 known 두 슬라이스 사이 선형 보간\" 으로 복원.
4. deterministic k=3 의 |Δφ| 와 random 33%의 |Δφ| 를 비교.

**보고할 내용:**
- 어느 시나리오의 보간이 더 어려운가? 왜?
- 실제 실험에서는 어떤 패턴이 더 \"실용적\" 일지 본인 의견.

---

## 5. 자기 점검 질문 (handout에 직접 답 적어보기)

**Q1.** Voxel과 pixel을 한 문장으로 구분 설명하세요.
```


```

**Q2.** \"세 축 공극률 프로파일의 std가 작다\" 는 것은 어떤 의미인가요?
```


```

**Q3.** k=5 sparse일 때 시간 절감률과 BB 사암의 선형 보간 |Δφ| 를 답하세요.
```


```

**Q4.** 본 연구의 tri-axis aggregation은 어떤 가정 위에 서 있나요? 그 가정이 깨지면 어떻게 될까요?
```


```

**Q5.** 오늘 측정한 \"k vs |Δφ|\" 곡선이 \"왜 deep learning이 필요한가\" 를 어떻게 설명하나요?
```


```

---

## 6. 다음 주 (W2) 예고

**주제: Classical Baseline — Linear & Cubic Interpolation (scipy)**

- scipy 기반 선형 / Cubic spline 정식 구현 (`scipy.interpolate`)
- 평가지표 확장: |Δφ| + 표면적 오차(|ΔSA|) + 구조 유사도(SSIM)
- 본 연구의 B1 (Linear), B2 (Cubic k=3), B3 (Cubic) baseline 만들기
- W3 (UNet 학습) 진입 전 마지막 \"non-DL\" 주차

**W2 진입 전 준비:**
- `pip install scipy` 확인
- W1 탐구 과제 1~2 답안 준비 (W2 시작 시 5분 리뷰)

---

## 7. Troubleshooting

| 증상 | 해결 |
|------|------|
| `FileNotFoundError: BB_256.bin` | notebook 실행 위치가 `notebooks/` 폴더 안인지 확인 |
| `ValueError: 파일 크기 불일치` | `load_volume` 의 `shape`/`dtype` 인자 확인 |
| `ModuleNotFoundError: dr_utils` | 첫 셀의 `sys.path.insert(0, ...)` 실행 여부 확인 |
| matplotlib 한글 깨짐 | `COMMON/environment_setup_guide.md` Q5 참조 |
| `reconstruct_sparse_linear` 가 느림 | 정상입니다. 256³ 부피 + python loop = 약 10~20초 소요 |

---

*W1 handout · 1조 Advanced · 2026-06-02*
