# W3 보조 노트 · 코드 walkthrough

본 노트북 `W3_pix2pix_gan.ipynb` 의 셀별 코드와 **인자 변경 가이드**입니다. 이번 주는 **Bentheimer 사암**을 **k=2**(측정한 슬라이스 사이에 2칸씩 비어 있는 상황)로 실습합니다.

---

## §0 환경 준비

```python
from dr_utils import (
    load_volume, porosity, predict_linear_k, eval_targets,
    setup_plot_style, ORANGE, NAVY, GREEN, RED, GRAY,
)
from model_utils import (
    UNetMini, count_parameters, train_quick, evaluate_model, load_ckpt,
    PatchDiscriminatorMini, ssim_loss, d_hinge_loss, g_hinge_loss,
    train_gan, predict_continuous, save_gan_ckpt, load_gan_ckpt,
)
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
```

**해설**: W2의 함수에 더해 W3에서 새로 쓰는 판별자·GAN 학습·손실 함수를 불러옵니다. GPU가 있으면 자동으로 씁니다.

---

## §1 W2 복습과 오늘의 문제 (Bentheimer, k=2)

```python
vol = load_volume(DATA / 'Bentheimer_256.bin')
K = 2   # 이웃 거리
m_lin = eval_targets(predict_linear_k(vol, K), vol, K)   # 선형 보간 기준선
G_l1, _, _ = train_gan(vol, k=K, preset='fast', lambda_gan=0.0, w_ssim=0.0,
                       epochs=22, warmup=0, d_base=16, device=DEVICE, verbose=True)
```

**해설**: `train_gan(lambda_gan=0, w_ssim=0)` 은 판별자와 SSIM 없이 순수 L1 학습기가 됩니다. 이게 "GAN 없음" 기준선입니다. 선형 보간(`predict_linear_k`)은 우리가 이겨야 할 대상입니다.

**바꿔볼 인자**:
- `K`: 이웃 거리. k=1이면 회색 번짐이 거의 안 보이고, k를 키우면 뚜렷해집니다. 왜 그런지 생각해 보세요.
- `epochs`: 작으면 덜 학습돼 더 번집니다. 크면 시간이 늘어납니다.
- 데이터 파일: `Bentheimer_256.bin` 대신 `BB_256.bin` 등 다른 도메인으로 바꾸면 복원 난이도가 어떻게 달라지는지 볼 수 있습니다.

---

## §1 회색 번짐을 눈으로

```python
cont_l1 = predict_continuous(G_l1, before, after, device=DEVICE)
grey = lambda c: ((c > 0.2) & (c < 0.8)).mean()
```

**해설**: `predict_continuous` 는 threshold(0.5) **전**의 확률 출력을 줍니다. `grey` 는 0.2~0.8 사이(불확실) 픽셀 비율로, 클수록 번진 것입니다. 가로 단면을 그리면 L1이 경계에서 완만한 경사(회색)를 그리는 게 보입니다.

**바꿔볼 인자**:
- 관찰 patch 위치 `z, c0, c1`: 다른 영역에서도 회색이 보이는지 확인합니다.

---

## §2 판별자 구축 (d_base=16)

```python
D = PatchDiscriminatorMini(cond_ch=2, base=16)
score = D(cond, y)   # (1,1,h,w) · patch별 점수 map
```

**해설**: 조건(2ch)과 대상(1ch)을 받아 patch별 진위 점수 map을 냅니다. sigmoid가 없어서 점수는 음수·양수 모두 가능합니다(hinge에서 그대로 사용). 판별자 폭 `base=16` 은 생성자보다 작게 잡은 값입니다. 생성자가 작은데 판별자를 크게 만들면 판별자가 독주해 학습이 망가지기 때문입니다.

**바꿔볼 인자**:
- `base`: 판별자 용량. 너무 크게(예: 48) 잡으면 D가 독주(D_loss→0)하는 걸 관찰할 수 있습니다.

---

## §3 hinge 손실 숫자 예시

```python
real_score = torch.tensor([0.8, 1.5, -0.2])
fake_score = torch.tensor([-0.4, 0.3, -1.5])
d_pen = torch.relu(1 - real_score).mean() + torch.relu(1 + fake_score).mean()
g_adv = -fake_score.mean()
```

**해설**: 진짜에 1.5(≥+1)면 벌점 0, 0.8이면 벌점 0.2. 가짜에 −1.5(≤−1)면 벌점 0, 0.3이면 벌점 1.3. G는 `−fake_score` 를 줄이려(=가짜 점수를 높이려) 합니다.

---

## §4 경로① 처음부터 GAN 학습

```python
G, D, hist = train_gan(vol, k=K, preset='fast', lambda_gan=0.1, w_ssim=0.3,
                       epochs=30, warmup=8, d_base=16, d_every=1, lambda_decay=0.3,
                       snapshot=(before, after), snapshot_every=3,
                       device=DEVICE, verbose=True)
save_gan_ckpt(G, D, 'w3_gan_mini.pth', meta={'k': K, 'domain': 'Bentheimer'})
```

**해설**: 처음 8 epoch은 재구성만(λ=0), 이후 adversarial을 켭니다. `snapshot` 을 주면 학습 중 연속 출력을 저장해 나중에 변화를 볼 수 있습니다.

**바꿔볼 인자**:
- `lambda_gan`: **가장 중요**. 0이면 회색, 크면 환각. 0.1 근처가 보통 적정입니다.
- `warmup`: 너무 짧으면 초반이 불안정하고, 너무 길면 GAN 효과가 늦게 나옵니다.
- `lambda_decay`: 후반에 λ를 줄여 정확도를 보호합니다.
- `d_base`: 판별자 폭. 키우면 D가 독주하는지 확인해 봅니다.

---

## §4 학습 곡선 읽는 법

```python
plt.plot(hist['D_loss']); plt.plot(hist['G_gan'])
```

**해설**: 판별자 손실(D)과 생성자 적대 손실(G)을 함께 봅니다. **D 손실이 0에 딱 붙지 않고 어느 정도 값을 유지**하면 건강한 균형입니다. D 손실이 0으로 떨어지면 판별자가 일방적으로 이긴 것이라 생성자가 배우지 못합니다. 크게 진동해도 불안정 신호입니다. `hist` 에는 `G_l1·G_ssim·G_gan·D_loss·lam` 곡선이 담깁니다.

---

## §5 복원 결과를 원본과 비교

```python
res_gan = evaluate_model(G, vol, k=K, device=DEVICE)
lin_recon = predict_linear_k(vol, K)
cont_gan = predict_continuous(G, before, after, device=DEVICE)
```

**해설**: 학습한 GAN 모델로 빠진 슬라이스를 복원해 원본·선형 보간과 나란히 봅니다. 균질한 Bentheimer라 복원이 원본에 꽤 가깝게 나옵니다. 이어서 연속 출력의 회색 비율을 L1과 GAN에서 비교하면, GAN 쪽이 더 또렷한 것을 확인할 수 있습니다.

---

## §6 정직한 평가: 선형 vs GAN 없음 vs GAN

```python
G_fair, _, _ = train_gan(vol, k=K, preset='fast', lambda_gan=0.0, w_ssim=0.3,
                         epochs=30, warmup=8, d_base=16, device=DEVICE, verbose=False)
res_fair = evaluate_model(G_fair, vol, k=K, device=DEVICE)   # GAN 없음
# 선형 · GAN 없음 · GAN 세 방법의 |Δφ|·SSIM을 표로 비교
```

**해설**: 세 방법을 같은 설정에서 비교합니다. 선형 보간에서 딥러닝으로 넘어가면 오차가 크게 줄어듭니다. GAN을 켜면 여기서는 |Δφ| 가 한 번 더 내려가지만, 그 차이는 크지 않고 학습의 무작위성에 따라 비슷하거나 살짝 뒤집힐 수도 있습니다. 확실한 것은 GAN이 연속 출력을 더 선명하게 만든다는 점입니다. 픽셀 지표 하나로는 GAN의 이득을 다 잡지 못하므로, 큰 모델에서는 투과율 같은 물성 지표로 확인합니다(→W5).

---

## §7 경로② W2 이어받아 미세조정

```python
G0, _ = train_quick(vol, k=K, preset='fast', device=DEVICE, verbose=False)  # 시연용 W2 모델
# 실제로는 load_ckpt('unet_mini_fast.pth') 로 W2 체크포인트를 불러옵니다.
G_ft, D_ft, _ = train_gan(vol, k=K, generator=G0, lambda_gan=0.1, w_ssim=0.3,
                          epochs=15, warmup=2, d_base=16, device=DEVICE, verbose=True)
```

**해설**: `generator=G0` 를 주면 그 모델을 생성자 초기값으로 이어받아 학습합니다. 이미 어느 정도 학습된 상태라 `warmup` 을 짧게 줄일 수 있습니다. 노트북에서는 W2 모델을 즉석에서 하나 만들어 시연합니다.

---

## §8 λ sweep

```python
for lam in [0.0, 0.1, 0.3]:
    Gi, _, _ = train_gan(vol, k=K, preset='fast', lambda_gan=lam, w_ssim=0.3,
                         epochs=26, warmup=6, d_base=16, device=DEVICE, verbose=False)
    ci = predict_continuous(Gi, before, after, device=DEVICE)
    ri = evaluate_model(Gi, vol, k=K, device=DEVICE)
```

**해설**: λ를 바꿔 **선명도(회색↓)** 와 **|Δφ|** 의 trade-off를 봅니다. 작은 λ는 회색, 큰 λ는 선명하지만 |Δφ| 가 흔들립니다. 특히 λ를 크게 넣으면 |Δφ| 가 오히려 나빠지기 쉽습니다. 그래서 실전에서는 λ를 작게(0.1 근처) 넣어 재구성 손실이 주도하게 합니다.

**바꿔볼 인자**:
- λ 목록을 {0, 0.05, 0.1, 0.3, 0.5} 로 넓혀 곡선을 촘촘히 그립니다.
- `epochs` 를 늘리면 더 정확하지만 느립니다.
</content>
