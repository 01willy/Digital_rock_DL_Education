# Week 1 — 데이터 탐색 + Classical Baseline

본 주차는 micro-CT 부피 데이터를 직접 다루어 sparse imaging 문제를 정의하고, 고전 보간 두 방법(Linear / Cubic spline)의 한계를 정량적으로 확인하는 것이 목표입니다. 다음 주차의 학습 기반 접근(UNet / pix2pix)을 위한 정량적 기준선이 됩니다.

## 1. 사전 준비

- 환경 설정 가이드: `COMMON/environment_setup_guide.md`
- 추가 패키지: `pip install scipy scikit-image`
- 데이터 폴더에 4개 파일 확인: `BB_256.bin`, `CastleGate_256.bin`, `Bentheimer_256.bin`, `Parker_256.bin`
- 노트북 실행

```bash
cd week1/notebooks/
jupyter notebook W1_load_and_explore.ipynb
```

## 2. 학습 목표

1. 256³ binary 부피의 로딩·정규화·시각화
2. Otsu 임계값과 binary 데이터에서의 한계 이해
3. 네 도메인(BB, CastleGate, Bentheimer, Parker)의 통계 비교 + 등방성 검토
4. Sparse imaging 시뮬레이션과 평가 지표(|Δφ|, |ΔSA|, SSIM)
5. Linear / Cubic spline 보간을 도메인·k에 걸쳐 평가 → 학습 기반 방법이 필요한 지점 도출

## 3. 핵심 용어

| 용어 | 정의 |
|------|------|
| Normalization | uint8 → float [0,1] 변환. 학습 기반 모델 입력의 표준 전처리 |
| Otsu threshold | 클래스 간 분산을 최대화하는 자동 임계값 |
| Linear / Cubic interpolation | 두 측정 슬라이스 사이를 1차 직선·3차 곡선으로 채우는 고전 방법 |
| φ (porosity) | 공극 voxel 비율. 본 연구의 핵심 물리량 |
| \|Δφ\| | 보간 결과의 공극률 오차 |
| \|ΔSA\| | 표면적 오차 (per megavoxel). 공극 모양 보존 여부 |
| SSIM | 구조 유사도. 0–1 범위 |
| Isotropy (등방성) | 세 축 통계가 비슷한 성질. 부피가 방향별로 균질한지 점검할 때 사용 |

## 4. 탐구 과제

다음 과제는 본 노트북의 코드를 수정·확장하며 결과 분석과 함께 정리합니다.

### 과제 1 (필수) — 도메인 × 방법 × k 전수 비교

네 도메인 × {Linear, Cubic} × k ∈ {2, 3, 5, 7} → 32 조합에 대해 (|Δφ|, |ΔSA|, SSIM)을 측정하고 pandas DataFrame으로 정리합니다.

```python
import pandas as pd
rows = []
for name, vol in domains.items():
    for k in [2, 3, 5, 7]:
        for method, fn in [('Linear', reconstruct_sparse_linear),
                            ('Cubic',  reconstruct_sparse_cubic)]:
            rec = fn(vol, k=k)
            rows.append({
                'domain': name, 'method': method, 'k': k,
                'dphi_pp': porosity_error(rec, vol) * 100,
                'dsa':     surface_area_error(rec, vol),
                'ssim':    ssim_3d_mean(rec, vol),
            })
df = pd.DataFrame(rows)
```

심화 질문 — Cubic이 Linear보다 명확히 우수하지 않은 경우가 있다면 어떤 도메인·k에서인지, 그 이유를 정량 근거와 함께 분석합니다.

### 과제 2 (필수) — 세 축 보간 비교

`reconstruct_sparse_linear(vol, k=3, axis=...)`의 `axis`를 0/1/2로 sweep하여 동일 부피의 세 축 보간 오차를 비교합니다. 본 데이터의 등방성 가정을 정량적으로 검토합니다.

심화 질문 — 세 축 결과의 차이가 어디서 비롯되는지, W5의 세 축 정보 융합(2.5D 접근)이 어떤 동기에서 출발하는지 본인 해석.

### 과제 3 (선택) — Otsu 민감도

인공 grayscale (binary + 가우시안 노이즈) 데이터에서 노이즈 σ ∈ {0.05, 0.1, 0.2, 0.3, 0.5}로 sweep하면서 Otsu 결과의 공극률 오차를 측정합니다.

심화 질문 — Otsu가 실용적으로 신뢰할 수 있는 노이즈 범위는? 실제 micro-CT의 노이즈 수준과 비교하면 어떤 결론이 나오는지.

### 과제 4 (선택, 심화) — Random sparse 시나리오

`numpy.random.choice`로 무작위 33% 측정 마스크를 생성하고, 누락 슬라이스를 가장 가까운 두 측정 슬라이스의 선형 보간으로 복원합니다.

심화 질문 — Deterministic k=3과 random 33%는 평균 측정 간격이 같으나 결과는 다릅니다. 차이의 원인은 무엇이며, 실제 실험 설계에서 어떤 패턴이 더 실용적일지 본인 의견.

## 5. 다음 주차 사전 준비

- W2: Deep Learning 입문 — UNet / pix2pix 구조와 학습 루프
- 추가 패키지: `pip install torch torchvision pytorch-msssim`
- 본 주차 baseline 결과(특히 BB k=5의 |Δφ|·SSIM)를 메모해 두면 W2에서 직접 비교 가능합니다.

## 6. 자주 발생하는 문제

| 증상 | 해결 |
|------|------|
| `scipy not found` | `pip install scipy` |
| Cubic spline 계산이 느림 | 정상 동작. 256³ 부피 + scipy interp1d 기준 약 30초 |
| matplotlib 한글 깨짐 | 첫 셀의 `setup_plot_style()` 호출 여부 확인 |
| 데이터 파일을 찾을 수 없음 | 노트북 실행 위치가 `notebooks/` 폴더 내인지 확인 |
