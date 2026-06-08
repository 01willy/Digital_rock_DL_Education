# Week 1 — 데이터 탐색 + Classical Baseline (2조)

본 주차는 micro-CT 부피 데이터를 직접 다루며 sparse imaging 문제를 정의하고, 단순 평균 보간과 Cubic spline 보간의 한계를 정량적으로 확인하는 것이 목표입니다.

## 1. 사전 준비

- 환경 설정 가이드: `COMMON/environment_setup_guide.md`
- 추가 패키지: `pip install scipy scikit-image`
- 데이터 폴더에 3개 파일 확인: `BB_256.bin`, `CastleGate_256.bin`, `Parker_256.bin`
- 노트북 실행

```bash
cd group2_intro/week1/notebooks/
jupyter notebook W1_load_and_explore.ipynb
```

## 2. 학습 목표

1. 3D voxel 데이터(.bin)의 구조와 로딩 방법
2. 정규화 / Otsu 임계값 — 전처리 기초
3. 세 도메인(BB, CastleGate, Parker)의 통계 비교 + 슬랩별 공극률 분석
4. Sparse imaging의 정의와 평가 지표(|Δφ|, |ΔSA|, SSIM)
5. Linear / Cubic spline 보간을 도메인·k에 걸쳐 평가

## 3. 핵심 용어

| 용어 | 정의 |
|------|------|
| Voxel | 3D pixel. `vol[z, y, x]`의 한 칸 |
| Slice | 3D 부피를 한 평면으로 자른 2D 이미지 |
| Porosity (φ) | 공극(pore)이 차지하는 비율 |
| Normalization | uint8 → float [0,1] 변환 |
| Otsu threshold | 자동 임계값 알고리즘 — 두 봉우리 사이 골짜기를 찾음 |
| Sparse k | 측정 간격. k=3 → 3장 중 1장만 측정 |
| Interpolation | 측정되지 않은 슬라이스를 측정 슬라이스로부터 복원 |
| \|Δφ\|, \|ΔSA\|, SSIM | 보간 정확도 평가 지표 3종 |

## 4. 탐구 과제

다음 과제는 본 노트북의 코드를 수정·확장하며 결과 분석과 함께 정리합니다.

### 과제 1 (필수) — 9개 조합 baseline 비교

세 도메인 × {Linear, Cubic} × k ∈ {2, 3, 5} = 9개 조합에 대해 `summarize_metrics`를 호출하고 결과를 표로 정리합니다. 어느 조합이 가장 정확한지, 그리고 Cubic이 항상 Linear보다 좋은지 본인 해석으로 정리합니다.

### 과제 2 (필수) — Otsu 노이즈 sweep

인공 grayscale(binary + 가우시안 노이즈) 데이터에서 노이즈 σ ∈ {0.05, 0.1, 0.2, 0.3, 0.5}로 sweep하고, 각 σ에서 Otsu binarize 결과의 공극률을 측정해 plot합니다. σ가 어떤 수준에서 Otsu가 신뢰할 수 없게 되는지 본인 기준으로 정의합니다.

### 과제 3 (선택) — 세 축 보간 비교

`reconstruct_sparse_linear(bb, k=3, axis=...)`의 `axis`를 0/1/2로 바꾸면서 세 축 보간 결과의 |Δφ|를 비교합니다. 본 데이터가 세 축에서 통계적으로 비슷한지 본인 실험으로 검토합니다.

### 과제 4 (선택, 도전) — 슬라이스 간격의 영향

`linear_interpolate_slice(bb[a], bb[b], 0.5)`에서 두 슬라이스 간격 `b-a` ∈ {1, 3, 7, 15, 30}으로 sweep하고 α=0.5 결과를 시각화합니다. 간격이 클수록 결과가 어떻게 변하는지, 그 한계가 본 연구가 deep learning을 도입하는 동기와 어떻게 연결되는지 본인 해석.

## 5. 다음 주차 사전 준비

- W2: Deep Learning 입문 — UNet / pix2pix 구조와 학습 루프
- 추가 패키지: `pip install torch torchvision pytorch-msssim`
- 본 주차 baseline 결과를 메모해 두면 W2에서 직접 비교 가능합니다.

## 6. 자주 발생하는 문제

| 증상 | 해결 |
|------|------|
| `scipy not found` | `pip install scipy` |
| Cubic spline 계산이 느림 | 정상 (약 30초 소요) |
| matplotlib 한글 깨짐 | 첫 셀 `setup_plot_style()` 호출 확인 |
| 데이터 파일을 찾을 수 없음 | 노트북 실행 위치가 `notebooks/` 폴더 내인지 확인 |
