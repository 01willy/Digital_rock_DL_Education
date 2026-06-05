# Week 1 Handout — 2조 Intro (재정비판 2026-06-05)

> **Digital Rock 6주 코스 · 1주차 — 데이터 탐색 + Classical Baseline 통합판**
> 구 W1 + W2 합쳐서 W1으로. 이제 W2는 \"Deep Learning 입문\" 부터 시작합니다.

---

## 0. 체크리스트

- [ ] `COMMON/environment_setup_guide.md` 설치 완료
- [ ] 가상환경 `rock` 활성화
- [ ] `pip install scipy scikit-image` (W1 추가)
- [ ] data 폴더에 3개 .bin 파일 (BB, CastleGate, Parker)

```bash
cd group2_intro/week1/notebooks/
jupyter notebook W1_load_and_explore.ipynb
```

---

## 1. 학습 흐름 (90분)

| 시간 | 활동 |
|------|------|
| 0~25분 | 강의 개념 + 데이터·전처리 |
| 25~55분 | 노트북 §0~§4 (로드·정규화·Otsu·시각화) + [Try-it! ①~②] |
| 55~75분 | 노트북 §5~§7 (Sparse·B1·B2·도메인 sweep) + [Try-it! ③~④] |
| 75~85분 | 자기 점검 + 탐구 과제 시작 |
| 85~90분 | Q&A + W2 예고 |

---

## 2. 핵심 용어 사전

| 용어 | 정의 |
|------|------|
| **Voxel** | 3D pixel. `vol[z,y,x]` 의 한 칸 |
| **Slice** | 3D 부피를 한 평면으로 자른 2D 이미지 |
| **Porosity (φ)** | 공극(pore)의 비율. 본 데이터 평균 = mean |
| **Normalization** | uint8 → float [0,1] 변환. DL 학습 안정성 |
| **Otsu threshold** | 자동 임계값 알고리즘 — \"두 봉우리 사이 골짜기 찾기\" |
| **B1, B2** | Baseline. B1=Linear, B2=Cubic spline |
| **\|Δφ\|** | 공극률 오차 \|복원 − 원본\| |
| **\|ΔSA\|** | 표면적 오차 (per Mvoxel) |
| **SSIM** | 구조 유사도. 0~1, 1=완벽 |
| **Sparse k** | k=3 → 3장 중 1장만 측정 |
| **Tri-axis aggregation** | (W5) 세 방향 보간 결과 통합 |

---

## 3. 노트북 [Try-it!] 정리

| # | 함수 | 변수 | 관찰 포인트 |
|---|------|------|-------------|
| ① | `otsu_threshold` (인공 grayscale) | noise σ ∈ {0.05, 0.2, 0.4} | 노이즈 클수록 Otsu가 어디서 망가지나 |
| ② | `porosity_profile` | n_slabs, axis | 슬랩 수와 축의 효과 |
| ③ | `reconstruct_sparse_linear/cubic` | k ∈ {3,5,7} | 두 baseline 차이 |
| ④ | `linear_interpolate_slice` (탐구과제) | 두 슬라이스 간격 | 간격 클수록 흐려짐 |

---

## 4. 탐구 과제 (W2 시작 전까지)

### 과제 1 — 9개 조합 baseline 표 (필수)

3 도메인 × {B1, B2} × k ∈ {2, 3, 5} = 9 조합 + 빈 칸:

| 도메인 | k | B1 \|Δφ\| | B1 SSIM | B2 \|Δφ\| | B2 SSIM |
|---|---|---|---|---|---|
| BB | 2 | | | | |
| BB | 3 | | | | |
| BB | 5 | | | | |
| CastleGate | 2 | | | | |
| CastleGate | 3 | | | | |
| CastleGate | 5 | | | | |
| Parker | 2 | | | | |
| Parker | 3 | | | | |
| Parker | 5 | | | | |

**보고**:
- 어느 조합이 가장 정확한가? (= 가장 작은 |Δφ| + 가장 큰 SSIM)
- B2가 B1보다 항상 좋은가, 아니면 경우에 따라 다른가?

### 과제 2 — Otsu noise sweep (필수)

[Try-it! ①] 의 노이즈 σ ∈ {0.05, 0.1, 0.2, 0.3, 0.5} 로 sweep.
각 σ에서 Otsu binarize 결과의 공극률 φ을 측정하여 한 plot에 plot.

**보고**:
- σ가 클수록 φ가 어떻게 변하나? (높아지나 / 낮아지나 / 임의?)
- Otsu가 \"신뢰할 수 없게 되는\" 노이즈 수준은 대략?

### 과제 3 — 세 축 sparse 비교 (선택)

`reconstruct_sparse_linear(bb, k=3, axis=0)` 의 `axis` 인자를 0, 1, 2로 바꿔서 세 축 sparse 보간 결과의 |Δφ| 비교.

**보고**:
- 세 결과가 \"거의 같은가\"? 다르다면 어느 축이 가장 어려운가?
- 본 연구의 \"세 방향 통합\" 이 합리적인 이유를 자신의 말로.

### 과제 4 — 슬라이스 간격에 따른 \"흐려짐\" (선택, 도전)

`linear_interpolate_slice(bb[a], bb[b], 0.5)` 에서 두 슬라이스 간격 `b-a` ∈ {1, 3, 7, 15, 30} 으로 sweep. 5장의 α=0.5 결과를 한 줄로 시각화.

**보고**:
- 간격이 클수록 \"흐려짐\" 이 어떻게 보이나? (구조? 경계? 공극 크기?)
- 이 흐려짐이 본 연구가 \"deep learning\" 으로 해결하려는 핵심 문제와 어떤 관계?

---

## 5. 자기 점검

**Q1.** 본 데이터의 \"1\"은 무엇? \"0\"은?
```


```

**Q2.** `normalize_to_float` 가 deep learning에 필요한 이유를 한 문장으로.
```


```

**Q3.** k=5 시간 절감률 + BB의 B1·B2 |Δφ|.
```


```

**Q4.** \"단순 평균 보간\" 의 단점 + 왜 deep learning이 필요한가.
```


```

**Q5.** 세 축 슬라이스 패턴이 비슷한 것이 본 연구 어떤 가정과 연결?
```


```

---

## 6. W2 (Deep Learning 입문) 진입 전

- `pip install torch torchvision pytorch-msssim` (CPU 버전 OK)
- W1 baseline 결과 (특히 BB k=5에서의 |Δφ|·SSIM) 메모

---

## 7. Troubleshooting

| 증상 | 해결 |
|------|------|
| `scipy not found` | `pip install scipy` |
| Cubic spline 계산 느림 | 정상. 30초 정도 소요 |
| matplotlib 한글 깨짐 | 첫 셀 `setup_plot_style()` 호출 확인 |
| `FileNotFoundError: Parker_256.bin` | data/ 폴더에 있는지 확인 |

---

*W1 handout · 2조 Intro · 2026-06-05 (재정비판)*
