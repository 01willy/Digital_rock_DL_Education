# Week 1 Handout — 1조 Advanced (재정비판 2026-06-05)

> **Digital Rock 6주 코스 · 1주차 — 데이터 탐색 + Classical Baseline 통합판**
> 구 W1 + W2 를 한 세션으로 합침. 이제 W2는 \"Deep Learning 입문\" 부터 시작합니다.

---

## 0. 체크리스트

- [ ] `COMMON/environment_setup_guide.md` 설치 완료
- [ ] 가상환경 `rock` 활성화
- [ ] `pip install scipy scikit-image` (W1에서 추가)
- [ ] data 폴더에 4개 .bin 파일 (BB, CastleGate, Bentheimer, Parker)

```bash
cd group1_advanced/week1/notebooks/
jupyter notebook W1_load_and_explore.ipynb
```

---

## 1. 학습 흐름 (90분)

| 시간 | 활동 |
|------|------|
| 0~20분 | 강의 1~3장 (개념·데이터·전처리) |
| 20~50분 | 노트북 §0~§4 (로드·정규화·Otsu·시각화·등방성) + [Try-it! ①~②] |
| 50~70분 | 노트북 §5~§7 (Sparse·B1·B2·도메인 sweep) + [Try-it! ③] |
| 70~80분 | 자기 점검 + 탐구 과제 시작 |
| 80~90분 | Q&A + W2 예고 |

---

## 2. 핵심 용어 사전 (W1 신규 추가)

| 용어 | 정의 |
|------|------|
| **Normalization** | uint8 → float [0,1] 변환. DL 학습 안정성을 위해 표준 |
| **Otsu threshold** | 자동 임계값 알고리즘. 클래스 간 분산 최대화 |
| **B1, B2, B3** | 본 연구 baseline 분류. B1=Linear, B2=Cubic k=3, B3=Cubic |
| **\|ΔSA\|** | 표면적 오차 (per Mvoxel). 공극 모양 보존 여부 |
| **SSIM** | Structural Similarity Index. 0~1, 1=완벽 |
| **Tri-axis aggregation** | (W5) 세 축 보간 결과 통합 |
| **Isotropy** | 세 축 통계가 같음 → 본 연구 핵심 가정 |

---

## 3. 노트북 [Try-it!] 요약

| # | 함수 | 변수 | 관찰 포인트 |
|---|------|------|-------------|
| ① | `otsu_threshold` | 인공 grayscale noise σ | 노이즈 크기가 임계값 정확도에 미치는 영향 |
| ② | `porosity_profile` | axis, n_slabs, 도메인 | 등방성 순위 + 통계 안정성 trade-off |
| ③ | `reconstruct_sparse_linear/cubic` | k ∈ {3,5,7,10} | linear vs cubic 우열, k에 따른 변화 |

---

## 4. 탐구 과제 (W2 시작 전까지)

### 과제 1 — 도메인 × baseline × k 전수 비교 (필수)

**4 도메인 × {B1, B2} × k=[2, 3, 5, 7]** → 32 조합 × 3 metric (|Δφ|, |ΔSA|, SSIM) = **96 값** 표 작성.

```python
import pandas as pd
rows = []
for name, vol in domains.items():
    for k in [2, 3, 5, 7]:
        for method, fn in [('B1', reconstruct_sparse_linear),
                            ('B2', reconstruct_sparse_cubic)]:
            rec = fn(vol, k=k)
            rows.append({
                'domain': name, 'method': method, 'k': k,
                'dphi_pp': porosity_error(rec, vol) * 100,
                'dsa': surface_area_error(rec, vol),
                'ssim': ssim_3d_mean(rec, vol),
            })
df = pd.DataFrame(rows)
df.to_csv('W1_baseline_sweep.csv', index=False)
print(df.pivot_table(values='ssim', index=['domain','method'], columns='k').round(4))
```

**보고**:
- 모든 도메인에서 \"B2가 B1보다 명확히 좋다\" 라고 단언할 수 있는가? 반례가 있다면 무엇?
- k 가 커질수록 어느 baseline의 |Δφ| 가 더 빨리 악화되나?

### 과제 2 — 세 축 sparse 보간 비교 (필수)

`make_sparse(vol, k=3, axis=...)` + `reconstruct_sparse_linear(vol, k=3, axis=...)` 의 `axis` 인자를 0/1/2로 sweep. **BB 도메인에서 세 축 결과의 |Δφ| 와 SSIM 차이**를 표로.

**보고**:
- 세 축 결과가 \"통계적으로 같다\"고 말할 수 있는가? std 또는 (max−min)/mean 으로 정량.
- 본 연구의 **tri-axis aggregation** (W5) 이 합리적인 이유를 자신의 말로 설명.

### 과제 3 — Otsu sensitivity 분석 (선택, 도전)

[Try-it! ①] 인공 grayscale의 노이즈 σ ∈ {0.05, 0.1, 0.2, 0.3, 0.5}로 sweep.

| σ | Otsu t | binarize φ | true φ (binary 원본) | Δφ |
|---|--------|------------|-----------------------|-----|

**보고**:
- 어느 σ 부터 Otsu 가 실패하는가? \"실패\"의 기준은 무엇으로 정의했는가?
- Real micro-CT 데이터의 노이즈 수준이 보통 어느 정도일지 추정 (논문 검색 OK)

### 과제 4 — Random sparse 시나리오 (선택, 심화)

`numpy.random.choice` 로 **무작위 33% 슬라이스만 측정** 하는 마스크 생성.
누락 슬라이스를 가장 가까운 known 두 슬라이스로 선형 보간.

**보고**:
- Deterministic k=3 vs random 33%의 |Δφ| 비교 표
- 두 시나리오의 \"평균 측정 간격\" 은 같지만 결과가 다르다면 이유?
- 실제 실험에서 어떤 패턴이 더 \"실용적\"일지 본인 의견

---

## 5. 자기 점검 (handout에 답 적기)

**Q1.** `normalize_to_float` 가 W2 이후 모든 DL 학습에서 필요한 이유는?
```


```

**Q2.** Otsu 임계값이 본 binary 데이터에서는 trivial한 이유를 한 문장으로.
```


```

**Q3.** 4 도메인 중 등방성이 가장 좋은 것 / 가장 약한 것 + 그 판단 근거.
```


```

**Q4.** B1 Linear와 B2 Cubic의 k=5에서의 |Δφ|·SSIM 차이를 답하고, 왜 그런지 가설을 적어보세요.
```


```

**Q5.** \"B1·B2 곡선이 k=5 이상에서 급격히 악화\" 라는 motivation 곡선이 \"왜 deep learning이 필요한가\" 를 어떻게 설명하나요?
```


```

---

## 6. W2 (Deep Learning 입문) 진입 전 준비

- `pip install torch torchvision pytorch-msssim` (모두 CPU 버전 OK)
- 본 W1 의 baseline 결과 (특히 BB k=5에서의 |Δφ|·SSIM) 메모해두기 — W2에서 UNet과 직접 비교

---

## 7. Troubleshooting

| 증상 | 해결 |
|------|------|
| `scipy not found` | `pip install scipy` |
| `Cubic spline 계산 느림` | 정상. 256³ 부피 + scipy interp1d = ~30초 |
| `summarize_metrics` 표가 깨짐 | 모노스페이스 폰트로 출력해야 정렬됨 |
| matplotlib 한글 깨짐 | `setup_plot_style()` 호출 확인 |

---

*W1 handout · 1조 Advanced · 2026-06-05 (재정비판)*
