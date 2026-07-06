# W3 보조 노트 — 코드 walkthrough

본 노트북 `W3_pix2pix_gan.ipynb` 의 셀별 코드와 **인자 변경 가이드**.

---

## §0 환경 준비

```python
from dr_utils import *
from model_utils import (
    UNetMini, train_quick, evaluate_model, load_ckpt,
    PatchDiscriminatorMini, ssim_loss, d_hinge_loss, g_hinge_loss,
    train_gan, predict_continuous, save_gan_ckpt, load_gan_ckpt,
)
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
```

**해설**: W2의 함수에 더해 W3 신규(판별자·GAN 학습·손실)를 불러옵니다. GPU 있으면 자동 사용.

---

## §1 L1의 흐림 진단 (k=5)

```python
K = 5
m_lin = eval_targets(predict_linear_k(bb, K), bb, K)
G_l1, _, _ = train_gan(bb, k=K, lambda_gan=0.0, w_ssim=0.0, epochs=18, warmup=0)
```

**해설**: `train_gan(lambda_gan=0, w_ssim=0)` 은 판별자·SSIM 없이 **순수 L1 학습기**가 됩니다. 이게 "GAN 없음" 기준선.

**바꿔볼 인자**:
- `K` — 이웃 거리. 1이면 흐림이 거의 안 보이고, 5·7이면 뚜렷. 왜 그런지 생각해 보세요.
- `epochs` — 작으면 덜 학습돼 더 흐림. 크면 시간↑.

---

## §1 흐림을 눈으로 — 연속 출력

```python
cont_l1 = predict_continuous(G_l1, before, after, device=DEVICE)
grey = lambda c: ((c > 0.2) & (c < 0.8)).mean()
```

**해설**: `predict_continuous` 는 threshold(0.5) **전**의 확률 출력을 줍니다. `grey` 는 0.2~0.8 사이(불확실) 픽셀 비율 — 클수록 흐림. 가로 단면을 그리면 L1이 경계에서 완만한 경사(회색)를 그리는 게 보입니다.

**바꿔볼 인자**:
- 관찰 patch 위치 `z, c0, c1` — 다른 영역에서도 흐림이 보이는지.

---

## §2 판별자 구축

```python
D = PatchDiscriminatorMini(cond_ch=2, base=32)
score = D(cond, y)   # (1,1,h,w) — patch별 점수 map
```

**해설**: 조건(2ch)+대상(1ch)=3ch를 받아 patch별 진위 점수 map을 냅니다. sigmoid가 없어서 점수는 음수/양수 모두 가능(hinge에서 그대로 사용).

**바꿔볼 인자**:
- `base` — 판별자 용량. 너무 크면 D가 독주(D_loss→0)할 수 있습니다.

---

## §3 hinge 손실 숫자 예시

```python
real_score = torch.tensor([0.8, 1.5, -0.2])
fake_score = torch.tensor([-0.4, 0.3, -1.5])
d_pen = torch.relu(1 - real_score).mean() + torch.relu(1 + fake_score).mean()
g_adv = -fake_score.mean()
```

**해설**: 진짜에 1.5(≥+1)는 벌점 0, 0.8은 벌점 0.2. 가짜에 −1.5(≤−1)는 벌점 0, 0.3은 벌점 1.3. G는 `−fake_score` 를 줄이려(=fake 점수를 높이려) 합니다.

---

## §4 경로① 처음부터 GAN 학습

```python
G, D, hist = train_gan(bb, k=K, lambda_gan=0.12, w_ssim=0.3, lambda_decay=0.3,
                       epochs=30, warmup=8, snapshot=(before, after), snapshot_every=3)
```

**해설**: 처음 8 epoch은 재구성만(λ=0), 이후 adversarial. `snapshot` 을 주면 학습 중 연속 출력을 저장(progression 관찰).

**바꿔볼 인자**:
- `lambda_gan` — **가장 중요**. 0=흐림, 크면 환각. 0.1 근처가 보통 적정.
- `warmup` — 너무 짧으면 초반 불안정, 너무 길면 GAN 효과 늦게.
- `lambda_decay` — 후반에 λ를 줄여 정확도 보호.

---

## §4 학습 곡선

```python
plt.plot(hist['D_loss']); plt.plot(hist['G_gan'])
```

**해설**: D 손실과 G 적대적 손실을 **함께** 봅니다. D가 0에 붙으면 독주, 크게 진동하면 불안정. `hist` 에는 `G_l1·G_ssim·G_gan·D_loss·lam` 곡선이 담깁니다.

---

## §5 경로② W2 이어받아 미세조정

```python
G0, _ = load_ckpt('unet_mini_fast.pth')      # W2 체크포인트
G_ft, D_ft, _ = train_gan(bb, generator=G0, lambda_gan=0.12, epochs=15, warmup=2)
```

**해설**: `generator=G0` 를 주면 그 모델을 Generator 초기값으로 **이어받아** 학습. 이미 어느 정도 학습된 상태라 `warmup` 을 짧게 줄일 수 있습니다. (노트북에서는 W2 모델을 즉석에서 하나 만들어 시연.)

---

## §6 정직한 평가 — GAN 없음 vs GAN

```python
evaluate_model(G_l1, bb, k=K)   # |Δφ|·SSIM
evaluate_model(G,    bb, k=K)
```

**해설**: GAN이 |Δφ|·SSIM을 **더 낮추지 못함**(비슷하거나 약간↑)을 직접 확인합니다. 이건 실패가 아니라 예상된 일 — GAN은 정확도를 사실감과 맞바꾸고, 픽셀 지표는 구조를 못 봅니다. (→ W5의 물리 지표)

---

## §6.5 λ sweep

```python
for lam in [0.0, 0.1, 0.5]:
    Gi, _, _ = train_gan(bb, k=K, lambda_gan=lam, epochs=14, warmup=4)
    ci = predict_continuous(Gi, before, after)
    ri = evaluate_model(Gi, bb, k=K)
```

**해설**: λ를 바꿔 **선명도(회색↓)** 와 **|Δφ|** 의 trade-off를 봅니다. 작은 λ=흐림, 큰 λ=선명하지만 |Δφ| 흔들림. 적정 λ를 찾는 게 핵심.

**바꿔볼 인자**:
- λ 목록을 {0, 0.05, 0.1, 0.3, 0.5} 로 넓혀 곡선을 촘촘히.
- `epochs` 를 늘리면 더 정확하지만 느림.
