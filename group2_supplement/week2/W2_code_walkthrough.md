# W2 보조 노트 — 코드 walkthrough

본 노트북 `W2_deep_learning_intro.ipynb` 의 셀별 코드와 **인자 변경 가이드**.

---

## §0 환경 준비

```python
import torch
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
```

**해설**: GPU가 있으면 자동으로 사용, 없으면 CPU. 본 코스는 CPU 가정.

---

## §1 W1 baseline 복습

```python
K = 5
rec_l = reconstruct_sparse_linear(bb, k=K)
m_baseline = summarize_metrics(rec_l, bb, label=f'Linear k={K}')
```

**해설**: W1의 결과를 다시 측정해 \"이길 대상\" 설정. W2 결과는 이 baseline 대비 얼마나 좋아졌는지로 평가.

**바꿔볼 인자**:
- `K` — sparse 간격. 3, 5, 7 등으로 바꿔 baseline 의 변화를 확인

---

## §2 모델 구조

```python
for name, p in TRAINING_PRESETS.items():
    m = UNetMini(in_ch=2, base=p['base'])
    print(f'{name}: params={count_parameters(m):,}')
```

**해설**: 세 preset (fast/standard/full) 의 모델 크기 출력. base 채널 수가 2배 늘면 파라미터는 약 4배 (Conv layer 의 in × out 곱 때문).

```python
print(UNetMini(in_ch=2, base=16))
```

**해설**: 모델의 layer 구조 출력. encoder 3단계 + decoder 2단계 + 출력 conv.

---

## §3 SliceDataset

```python
ds = SliceDataset(bb, k=K, patch_size=64, n_patches_per_triplet=4, augment=True)
```

**바꿔볼 인자**:
- `patch_size` — random crop 크기
  - **32** → 학습 더 빠름, 작은 패턴만 학습
  - **64** → 기본 (균형)
  - **128** → 더 큰 문맥, 메모리·시간 4배
  - **None** → 전체 슬라이스 (메모리 많이 필요)
- `n_patches_per_triplet` — 한 triplet에서 뽑을 random patch 수
  - **2** → 데이터 양 적음 (빠른 학습)
  - **4~8** → 더 다양한 patch, 일반화 ↑
- `augment` — flip 증강 on/off
  - **True** → 데이터 양 사실상 2~4배 (좋은 일반화)
  - **False** → 빠른 epoch, 과적합 위험

**시각화**:
```python
x, y = ds[0]
# x.shape = (2, 64, 64), y.shape = (1, 64, 64)
```
첫 sample 의 입력 2채널과 target 을 plot 으로 확인.

---

## §4 학습 실행

```python
PRESET = 'fast'
model, history = train_quick(bb, k=K, preset=PRESET, device=DEVICE)
```

**바꿔볼 인자**:
- `PRESET` — 학습 강도 선택
  - **'fast'** → 약 10분, 작동 확인용
  - **'standard'** → 약 30분, 의미 있는 비교
  - **'full'** → 약 60분, 충분히 학습

**train_quick 내부에서 바꿀 수 있는 것** (함수 코드 복사 후 수정):
- `criterion = nn.L1Loss()` → `nn.MSELoss()` 로 바꾸면 L2 학습
- `Adam(lr=1e-3)` 의 `lr` 을 1e-4, 5e-3 등으로 변경

**학습 곡선 plot**: epoch 마다의 loss 값. 단조 감소하면 학습 진행 중. 평평해지면 saturation.

---

## §5 평가

```python
res_unet = evaluate_model(model, bb, k=K, device=DEVICE)
print(f'Linear      |Δφ|={m_baseline[\"dphi\"]:.2f}%p')
print(f'UNet        |Δφ|={res_unet[\"dphi_pp\"]:.2f}%p')
```

**해설**: 학습 모델로 전체 BB 부피의 누락 슬라이스를 모두 복원하고 |Δφ|·SSIM 측정. Linear baseline과 직접 비교.

```python
improvement = (m_baseline['dphi'] - res_unet['dphi_pp']) / m_baseline['dphi'] * 100
```

**개선률** — 양수면 UNet이 baseline 보다 좋음. 음수면 baseline 이 오히려 좋음 (이런 경우 학습 부족 또는 모델 너무 작음).

---

## §6 Cross-domain 평가

```python
for name in ['CastleGate', 'Bentheimer', 'Parker']:
    vol = load_volume(DATA / f'{name}_256.bin')
    res = evaluate_model(model, vol, k=K, device=DEVICE)
    print(f'{name}: |Δφ|={res[\"dphi_pp\"]:.2f}%p')
```

**해설**: BB로 학습한 모델을 다른 도메인에 평가. 결과가 BB 와 비슷하면 \"일반화 잘 됨\".

**관찰 포인트**: 어느 도메인에서 가장 떨어지나? 그 도메인의 공극률·구조가 BB와 어떻게 다른가?

---

## 종합 — 시도해볼 만한 것

1. **세 preset 모두 학습** → 시간 vs 성능 표
2. **K 변경**: K=3 (쉬움) vs K=7 (어려움) 에서 학습된 모델의 안정성
3. **patch_size 변경**: 32 vs 64 vs 128 의 학습 곡선·결과 비교
4. **Loss 변경**: L1 vs L2 의 결과 차이 (특히 시각 차이)
5. **다른 도메인에서 학습**: BB 대신 Parker (저공극) 로 학습 → BB 에 평가하면?

---

## 다음 단계

손에 익숙해졌으면 `W2_extra_examples.ipynb` 의 작은 학습 데모도 시도해보세요.
