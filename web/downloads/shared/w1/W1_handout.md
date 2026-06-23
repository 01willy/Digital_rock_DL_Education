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
4. 슬라이스 보간 문제 정의(이웃 거리 k)와 평가 지표(|Δφ|, SSIM)
5. Linear / Cubic spline 보간을 도메인·k에 걸쳐 평가 → 학습 기반 방법이 필요한 지점 도출

## 3. 핵심 용어

| 용어 | 정의 |
|------|------|
| Normalization | uint8 → float [0,1] 변환. 학습 기반 모델 입력의 표준 전처리 |
| Otsu threshold | 클래스 간 분산을 최대화하는 자동 임계값 |
| 이웃 거리 k | 슬라이스 t 를 양옆 이웃 t−k·t+k 로 예측. k 가 클수록 이웃이 멀어짐 |
| Linear / Cubic interpolation | 양옆 이웃 슬라이스로 가운데를 1차 직선·3차 곡선으로 예측하는 고전 방법 |
| φ (porosity) | 공극 voxel 비율. 본 연구의 핵심 물리량 |
| \|Δφ\| | 예측 슬라이스의 공극률 오차 = \|φ(예측) − φ(원본)\| |
| SSIM | 구조 유사도. 0–1 범위 |
| Isotropy (등방성) | 세 축 통계가 비슷한 성질. 부피가 방향별로 균질한지 점검할 때 사용 |

## 4. 탐구 과제

다음 과제는 본 노트북의 코드를 수정·확장하며 결과 분석과 함께 정리합니다.

### 과제 1 (필수) — 도메인 × 방법 × k 전수 비교

네 도메인 × {Linear, Cubic} × k ∈ {1, 2, 3, 5, 7} → 40 조합에 대해 (|Δφ|, SSIM)을 측정하고 pandas DataFrame으로 정리합니다.

```python
import pandas as pd
rows = []
for name, vol in domains.items():
    for k in [1, 2, 3, 5, 7]:
        for method, fn in [('Linear', predict_linear_k),
                            ('Cubic',  predict_cubic_k)]:
            rec = fn(vol, k)
            m = eval_targets(rec, vol, k)
            rows.append({
                'domain': name, 'method': method, 'k': k,
                'dphi_pp': m['dphi_pp'], 'ssim': m['ssim'],
            })
df = pd.DataFrame(rows)
```

심화 질문 — Cubic이 Linear보다 명확히 우수하지 않은 경우가 있다면 어떤 도메인·k에서인지, 그 이유를 정량 근거와 함께 분석합니다.

### 과제 2 (필수) — 세 축 보간 비교

동일 부피를 세 축(z·y·x)으로 각각 보간해 비교합니다. `np.transpose`로 축을 바꿔 `predict_linear_k`를 적용하고 `eval_targets`로 |Δφ|·SSIM 을 비교합니다.

```python
for axis, vol_ax in [('z', vol), ('y', vol.transpose(1, 0, 2)), ('x', vol.transpose(2, 0, 1))]:
    rec = predict_linear_k(vol_ax, 3)
    print(axis, eval_targets(rec, vol_ax, 3))
```

심화 질문 — 세 축 결과의 차이가 어디서 비롯되는지, W5의 세 축 정보 융합(2.5D 접근)이 어떤 동기에서 출발하는지 본인 해석.

### 과제 3 (선택) — Otsu 민감도

인공 grayscale (binary + 가우시안 노이즈) 데이터에서 노이즈 σ ∈ {0.05, 0.1, 0.2, 0.3, 0.5}로 sweep하면서 Otsu 결과의 공극률 오차를 측정합니다.

심화 질문 — Otsu가 실용적으로 신뢰할 수 있는 노이즈 범위는? 실제 micro-CT의 노이즈 수준과 비교하면 어떤 결론이 나오는지.

### 과제 4 (선택, 심화) — 이웃 거리 한계 탐색

이웃 거리 k 를 1→10 까지 키우며 |Δφ| 곡선을 그리고, 오차가 급격히 꺾이는 "실용 한계 k"를 도메인별로 찾습니다.

```python
import matplotlib.pyplot as plt
for name, vol in domains.items():
    ks = list(range(1, 11))
    dphi = [eval_targets(predict_linear_k(vol, k), vol, k)['dphi_pp'] for k in ks]
    plt.plot(ks, dphi, marker='o', label=name)
plt.xlabel('이웃 거리 k'); plt.ylabel('|Δφ| (%p)'); plt.legend(); plt.show()
```

심화 질문 — 도메인마다 "실용 한계 k"가 다른 이유는 무엇이며, 각 도메인의 공극률·구조와 어떤 관계가 있는지 본인 해석.

## 5. 다음 주차 사전 준비

- W2: Deep Learning 입문 — UNet / pix2pix 구조와 학습 루프
- 추가 패키지: `pip install torch torchvision pytorch-msssim`
- 본 주차 baseline 결과(특히 BB k=1의 |Δφ|·SSIM)를 메모해 두면 W2에서 직접 비교 가능합니다.

## 6. 자주 발생하는 문제

| 증상 | 해결 |
|------|------|
| `scipy not found` | `pip install scipy` |
| Cubic spline 계산이 느림 | 정상 동작. 256³ 부피 + scipy interp1d 기준 약 30초 |
| matplotlib 한글 깨짐 | 첫 셀의 `setup_plot_style()` 호출 여부 확인 |
| 데이터 파일을 찾을 수 없음 | 노트북 실행 위치가 `notebooks/` 폴더 내인지 확인 |
