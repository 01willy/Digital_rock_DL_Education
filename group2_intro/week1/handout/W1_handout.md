# Week 1 Handout — 2조 (Intro)

> **Digital Rock — Sparse Slice Interpolation 6주 코스 · 1주차**
> 학생용 배포자료 — 노트북 옆에 띄워두고 함께 진행하세요.

---

## 0. 시작 전 체크리스트

- [ ] `COMMON/environment_setup_guide.md` 의 설치 가이드 완료
- [ ] 가상환경 `rock` 활성화 (`conda activate rock`)
- [ ] `group2_intro/week1/` 폴더 전체 (data 포함 ~32 MB) 확보
- [ ] 동작 확인: `python3 -c "import numpy, matplotlib; print('OK')"`

실행:
```bash
cd group2_intro/week1/notebooks/
jupyter notebook W1_load_and_explore.ipynb
```

---

## 1. 학습 흐름 (권장 90분 세션)

| 시간 | 활동 | 자료 |
|------|------|------|
| 0~30분 | 강의 + 개념 (천천히) | `slides/W1_group2.pptx` 슬라이드 1~12 |
| 30~65분 | 노트북 실행 + [Try-it!] 박스 실험 | `notebooks/W1_load_and_explore.ipynb` |
| 65~80분 | 슬라이드 13~21 강의 + 노트북 후반 | (sparse + 보간) |
| 80~88분 | 자기 점검 + 탐구 과제 시작 | 본 handout 4번 |
| 88~90분 | Q&A + W2 예고 | 슬라이드 22 |

---

## 2. 핵심 용어 사전 (꼭 외워두세요)

| 용어 | 정의 | 예시 |
|------|------|------|
| **Voxel** | 3D 픽셀. 한 voxel = 한 작은 정육면체 | `volume[z, y, x]` 한 칸 |
| **Pixel** | 2D 픽셀 | `image[y, x]` 한 칸 |
| **Slice** | 3D 부피를 한 평면으로 자른 2D 이미지 | `volume[100, :, :]` |
| **Porosity (φ)** | 전체 voxel 중 공극(빈 공간)이 차지하는 비율 | 0.22 = 22% |
| **Pore / Solid** | 공극(빈 공간) / 고체(암석) | 본 데이터: 1 / 0 |
| **Micro-CT** | 마이크로미터 해상도의 컴퓨터 단층촬영 | 본 데이터의 출처 |
| **Slab** | 부피를 한 방향으로 자른 두꺼운 덩어리 | z축 8슬랩 = 각 두께 32 |
| **Sparse imaging** | 일부 슬라이스만 측정하는 전략 | k=3 → 3장 중 1장 |
| **k (sparse 간격)** | 슬라이스 측정 간격 | k=5 → 5장 중 1장 |
| **Interpolation** | 누락 슬라이스를 측정된 슬라이스로부터 복원 | "linear", "cubic" 등 |
| **Tri-axis aggregation** | 세 방향(z/y/x) 보간 결과를 통합 | W5에서 자세히 |

---

## 3. 노트북 [Try-it!] 박스 정리

본 노트북에는 다음 4개 [Try-it!] 박스가 있습니다. **모두 직접 수행** 해주세요:

| # | 위치 (함수) | 무엇을 바꾸나 | 어떤 차이를 관찰하나 |
|---|------|------|------|
| ① | `show_slice` | axis, idx, cmap | 방향/위치/색상에 따른 보기 차이 |
| ② | `porosity_profile` | n_slabs, axis | 슬랩 수와 축 변화의 효과 |
| ③ | `k_values` 리스트 | k 값 | 측정 슬라이스 수와 시간 절감 |
| ④ | `linear_interpolate_slice` | z_before, z_after 간격 | 간격이 클수록 흐려짐 |

---

## 4. 탐구 과제 (W2 시작 전까지)

### 과제 1 — [Try-it!] 4종 수행 (필수)

본 노트북의 [Try-it! ①~④] 박스를 모두 직접 수행하고, **각각에 대해 한 문장씩** 관찰 결과를 적어보세요.

**예시 답안 (참고용)**:
> [Try-it! ①] cmap='viridis' 가 'gray' 보다 pore가 더 또렷하게 보였다.

| # | 본인의 관찰 (한 문장) |
|---|----------------------|
| ① | |
| ② | |
| ③ | |
| ④ | |

### 과제 2 — 두 도메인 슬랩 비교 (필수)

BB와 CastleGate 두 도메인에 대해 `porosity_profile(vol, axis=0, n_slabs=16)` 를 각각 실행하고, **두 곡선을 한 plot에 겹쳐** 그려보세요.

**보고할 내용:**
- 두 사암 중 어느 쪽이 더 \"균일한 부피\"를 가지는가? (= 곡선이 더 평평한 쪽)
- std (표준편차) 가 더 작은 쪽이 \"균일\" 하다고 볼 수 있습니다. 직접 계산해 비교하세요.

코드 힌트:
```python
prof_bb = porosity_profile(bb, axis=0, n_slabs=16)
prof_cg = porosity_profile(cg, axis=0, n_slabs=16)
print(f'BB std={prof_bb.std():.4f}, CastleGate std={prof_cg.std():.4f}')
```

### 과제 3 — α와 공극률 관계 (선택)

`linear_interpolate_slice` 의 α 를 `np.linspace(0, 1, 11)` 로 sweep 하면서, 각 α에서 \"보간 결과의 공극률\" 을 계산해보세요.

**보고할 내용:**
- α와 공극률의 관계는 어떤 형태인가요? (직선? 곡선? 단조 증가/감소?)
- α=0.5 일 때 공극률은 \"앞과 뒤 슬라이스의 공극률 평균\" 과 같은가요? 다른가요?

### 과제 4 — 세 축 sparse 비교 (선택, 도전)

`make_sparse` 의 `axis` 인자를 0(z), 1(y), 2(x) 로 바꿔보세요. 같은 k=3이라도 어느 축으로 자르는지에 따라 \"측정 슬라이스 패턴\" 이 달라집니다.

**할 일**: 세 축 각각 k=3 으로 sparse 시뮬레이션을 한 뒤, **시각화 (각 축 첫 3장의 측정 슬라이스)** 를 비교하세요.

**보고할 내용:**
- 세 축의 시각화가 비슷한가요, 다른가요?
- 만약 부피가 완벽히 등방성이라면 결과가 \"통계적으로 같아야\" 합니다. 본 데이터는 어떤가요?

---

## 5. 자기 점검 (handout에 직접 답 적어보기)

**Q1.** Voxel과 pixel의 차이를 한 문장으로 답하세요.
```


```

**Q2.** 본 데이터에서 \"1\" 은 무엇을 의미하나요? \"0\" 은?
```


```

**Q3.** 공극률을 numpy 한 줄로 어떻게 계산하나요? 왜 그것이 가능한가요?
```


```

**Q4.** k=3 sparse imaging에서 시간이 얼마나 절약되나요? 수식과 함께.
```


```

**Q5.** 단순 평균 보간(linear interpolation) 의 단점은 무엇이라 생각하나요?
이 단점을 해결하기 위해 deep learning이 어떻게 도움이 될 수 있을지 자신의 생각을 적어보세요.
```


```

---

## 6. 다음 주 (W2) 예고

**주제: Classical Baseline — scipy 보간**

- scipy의 보간 함수 사용법 (`scipy.interpolate`)
- 선형 / Cubic 보간을 정식으로 구현
- 복원 후 공극률 오차 |Δφ| 직접 측정
- 본 연구의 B1, B2, B3 baseline 만들기

**W2 진입 전 준비:**
- `pip install scipy` 확인
- W1 자기 점검 Q1~Q5 답안 준비

---

## 7. Troubleshooting

| 증상 | 해결 |
|------|------|
| `FileNotFoundError: BB_256.bin` | notebook 실행 위치가 `notebooks/` 안인지 확인 |
| `ValueError: 파일 크기 불일치` | `load_volume` 의 shape/dtype 인자 확인 |
| `ModuleNotFoundError: dr_utils` | 첫 셀의 `sys.path.insert(0, ...)` 실행 여부 확인 |
| matplotlib 한글 깨짐 | 첫 셀 `setup_plot_style()` 실행 — 자동으로 Pretendard 등록 |
| 그래프가 안 보임 | 첫 셀 위에 `%matplotlib inline` 한 줄 추가 |

---

*W1 handout · 2조 Intro · 2026-06-02*
