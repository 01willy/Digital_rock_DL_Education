# W1 보조 노트 — 코드 walkthrough

본 노트북 `W1_load_and_explore.ipynb`의 각 코드 셀이 무엇을 하는지, 그리고 **어떤 인자를 바꾸면 결과가 어떻게 변하는지** 정리합니다.

---

## §0 환경 준비

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path('..').resolve() / 'helpers'))
```

**해설**: helpers/ 폴더의 `.py` 파일을 import 가능하게 합니다. notebooks/ 폴더에서 한 단계 위로 올라가서 helpers를 찾는 구조.

```python
from dr_utils import load_volume, porosity, ...
```

**해설**: 본 코스 전체에서 사용하는 함수들을 한꺼번에 가져옵니다. 각 함수의 docstring은 `help(load_volume)` 으로 볼 수 있습니다.

```python
setup_plot_style()
```

**해설**: matplotlib의 폰트·색·여백을 일관되게 맞춥니다. 한 번만 호출하면 이후 모든 plot에 적용됩니다.

---

## §1 데이터 로드

```python
DATA_DIR = Path('..') / 'data'
domains = {
    'BB':         load_volume(DATA_DIR / 'BB_256.bin'),
    ...
}
```

**바꿔볼 수 있는 인자**:
- `load_volume(path, shape=(256,256,256), dtype=np.uint8)`
  - `shape` — 부피 모양. 본 데이터는 256³ 고정이지만 다른 부피 크기가 있다면 변경 필요
  - `dtype` — 데이터 타입. 본 데이터는 uint8 (0 또는 1). float32 데이터면 변경

**무엇을 관찰**:
- `print(domains['BB'].shape)` → `(256, 256, 256)`
- `print(domains['BB'].dtype)` → `uint8`
- `np.unique(domains['BB'])` → `[0, 1]` (binary 확인)

---

## §2 데이터 전처리 — 정규화 + Otsu

```python
vol_f = normalize_to_float(vol)
```

**무엇을 함**: uint8 → float32 [0, 1]. 본 데이터는 이미 0/1뿐이라 결과는 거의 같지만, dtype이 float로 바뀝니다.

```python
t = otsu_threshold(vol_f[128])
```

**무엇을 함**: 슬라이스 z=128의 자동 임계값 계산. 본 데이터는 binary라 trivial하게 0.5 부근 반환.

```python
# 인공 grayscale 만들기 — 일부러 노이즈를 더해 Otsu 효과 확인
gray = vol[128].astype(np.float32) + rng.normal(0, 0.2, vol[128].shape)
gray = np.clip(gray, 0, 1)
```

**바꿔볼 수 있는 인자**:
- `rng.normal(0, 0.2, ...)` 의 `0.2` — 노이즈 표준편차 σ
  - **0.05** → 노이즈 거의 없음. Otsu가 정확
  - **0.2** → 적당한 노이즈. Otsu가 두 봉우리를 잘 찾음
  - **0.4** → 노이즈가 큼. Otsu가 흔들리기 시작
  - **0.6** → 두 봉우리가 거의 합쳐짐. Otsu 실패

**무엇을 관찰**:
- 히스토그램 plot의 봉우리 모양
- Otsu가 어디에 선을 긋는지
- binarize 결과의 공극률이 원본과 얼마나 차이 나는지

---

## §3 세 축 시각화

```python
for name, vol in domains.items():
    show_three_axis(vol, title_prefix=f'{name}:')
```

**바꿔볼 수 있는 인자**:
- `show_three_axis(vol, z=None, y=None, x=None)` 의 세 인자
  - None이면 부피 중앙 (z=128 등). 원하는 위치로 변경 가능
  - 예: `show_three_axis(vol, z=10, y=200, x=50)` 으로 가장자리/한쪽 부분 관찰

**무엇을 관찰**:
- 세 축 슬라이스가 시각적으로 얼마나 비슷한가
- 도메인마다 세 축 차이가 다른가 (등방성 정도)

---

## §4 슬랩별 공극률 (등방성 검증)

```python
prof_z = porosity_profile(vol, axis=0, n_slabs=16)
```

**바꿔볼 수 있는 인자**:
- `axis` — 0(z), 1(y), 2(x) 중 하나. 세 축 결과를 비교
- `n_slabs` — 몇 등분할지
  - **4** → 부드러운 곡선 (정보 적음)
  - **16** → 적당한 분해능 (기본값)
  - **64** → 세밀하지만 노이즈가 클 수 있음

**무엇을 관찰**:
- 곡선이 평평한가 (균질) vs 들쭉날쭉한가 (불균질)
- 세 축의 곡선이 비슷한가 (등방성) vs 다른가
- 각 축의 std (표준편차) 가 작을수록 균일

---

## §5 Sparse 시뮬레이션

```python
k = 3
known_idx, missing_idx = make_sparse(vol, k=k, axis=0)
```

**바꿔볼 수 있는 인자**:
- `k` — 측정 간격
  - **1** → 모든 슬라이스 측정 (sparse 아님)
  - **3** → 3장 중 1장만 측정 (가운데 2장 누락)
  - **5** → 5장 중 1장만 측정 (가운데 4장 누락)
  - **10** → 10장 중 1장만 (9장 누락) — 매우 어려운 시나리오
- `axis` — sparse 방향. 기본은 0 (z축)

**무엇을 관찰**:
- `len(known_idx)` 가 k에 따라 어떻게 줄어드는가
- 시간 절감률 = `(1 − 1/k) × 100%`
- 연속 슬라이스 시각화에서 \"측정됨\" / \"누락\" 패턴

---

## §6 Linear / Cubic 보간

```python
recon_l = reconstruct_sparse_linear(vol, k=k)
recon_c = reconstruct_sparse_cubic(vol, k=k)
```

**바꿔볼 수 있는 인자**:
- `k` — sparse 간격 (위와 같음)
- `axis` — 보간 방향
- 함수 내부의 `> 0.5` 이진화 임계값 — 함수 코드를 복사해서 수정 가능

**무엇을 관찰**:
- 두 baseline의 |Δφ|·|ΔSA|·SSIM 비교
- 시각: 원본 vs Linear vs Cubic + 오차맵
- k가 커질수록 두 baseline 모두 악화

---

## §7 k Sweep — 도메인별 비교

```python
k_list = [2, 3, 5, 7]
for name, vol in domains.items():
    for k in k_list:
        rec = reconstruct_sparse_linear(vol, k=k)
        ...
```

**바꿔볼 수 있는 인자**:
- `k_list` — 측정 간격 리스트. `[1, 2, 3, 5, 7, 10]` 등 확장 가능
- 두 baseline (Linear, Cubic) 모두 비교하려면 한 번 더 loop

**무엇을 관찰**:
- 어느 도메인이 가장 \"쉬운\" 보간인가 (|Δφ| 가 가장 작음)
- 모든 도메인의 곡선이 가파르게 꺾이는 지점이 학습 기반 방법이 필요한 지점

---

## 종합 — 본 노트북에서 직접 시도해볼 만한 것

1. **다른 도메인 추가**: COMMON/data_extra/ 에 있는 Ketton, Estaillades, Berea로도 같은 분석을 반복
2. **k 범위 확장**: `[1, 2, 3, 5, 7, 10, 15, 20]` 까지 sweep — 어디서 |Δφ| 가 30%p를 넘는가
3. **다른 축으로 sparse**: `axis=1` 또는 `axis=2` 로 같은 sweep
4. **인공 grayscale 다양화**: 가우시안 노이즈 대신 salt-and-pepper 노이즈 등 다른 패턴 시도

---

## 다음 단계

코드 흐름이 익숙해졌으면 `W1_extra_examples.ipynb` 의 작은 예시들로 손에 익혀보세요.
