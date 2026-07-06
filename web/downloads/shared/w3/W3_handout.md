# Week 3 — 적대적 학습: pix2pix GAN

본 주차는 W2의 UNet(=Generator)에 두 번째 신경망 **판별자(Discriminator)** 를 붙여 **조건부 pix2pix GAN** 으로 확장합니다. L1 손실이 만드는 "흐림"을 진단하고, 적대적 학습으로 더 선명·사실적인 복원을 유도합니다. **이번 주는 두 조 공통(통합) 트랙**입니다.

## 1. 사전 준비

- 패키지: `pip install torch torchvision` (GPU 없이 CPU만으로도 동작)
- W2 학습 체크포인트(`unet_mini_*.pth`)가 있으면 준비 — "경로② 이어받기"에 사용 (없으면 노트북이 즉석에서 하나 만듭니다)
- 폴더 구성: `w3_code.zip` 을 푼 폴더에 `data/`(=`data_w3.zip` 압축 해제)가 함께 있어야 합니다. 노트북은 `data/` 가 같은 폴더 또는 `../data` 둘 다 자동 인식합니다.

```
<작업 폴더>/
├ W3_pix2pix_gan.ipynb
├ dr_utils.py · model_utils.py
└ data/   ← BB_256.bin · CastleGate_256.bin · Bentheimer_256.bin · Parker_256.bin
```

```bash
jupyter notebook W3_pix2pix_gan.ipynb
```

> 이번 주는 이웃이 먼 어려운 보간 **k=5** 로 실습합니다. k=1(가까운 이웃)에서는 L1도 이미 거의 완벽해 GAN의 효과가 잘 드러나지 않기 때문입니다.

## 2. 학습 목표

1. **평균의 함정** — L1 손실이 왜 흐린 결과를 내는지 (연속 출력으로 직접 확인)
2. **판별자(Discriminator)** 구조 — 조건부(conditional) · PatchGAN · spectral normalization
3. **적대적 손실(hinge)** — min-max 게임을 수식·숫자로 이해
4. **GAN 직접 학습** — 처음부터 / W2 체크포인트 이어받기, **두 경로 모두** 실습
5. **학습 안정화** — warmup · 작은 λ · spectral norm · 손실 곡선 모니터링
6. **물성으로 평가** — GAN은 구조를 사실적으로 복원해 |Δφ|(볼륨)·투과율 같은 물성을 개선한다. 단 |Δφ| 하나론 부족(같은 |Δφ|라도 연결성 다르면 투과율 다름 → 물리 지표 필요)

## 3. 핵심 용어

| 용어 | 정의 |
|------|------|
| Generator (G) | 슬라이스를 만드는 신경망. 본 과제에선 W2의 UNet |
| Discriminator (D) | "진짜 암석 단면인가?"를 판정하는 신경망 |
| Adversarial loss | G와 D가 서로 반대로 당기는 손실 (min-max) |
| hinge loss | "확실히 맞히면 벌점 0" 형태의 적대적 손실 |
| Conditional | 판별자가 이웃 슬라이스(조건)를 함께 보는 것 |
| PatchGAN | 이미지를 조각(patch)마다 진짜/가짜로 판정 |
| Spectral norm | 판별자의 힘(Lipschitz)에 상한 → 안정화 |
| warmup | 초반에 재구성(L1·SSIM)만 학습하는 구간(λ=0) |
| λ (lambda_gan) | adversarial 가중치. 흐림↔환각 균형의 핵심 노브 |
| 연속 출력 | threshold(0.5) 전의 확률 출력(0~1) |

## 4. 학습 옵션 (GAN PRESET)

| Preset | G base | D base | epochs | warmup | 비고 |
|--------|--------|--------|--------|--------|------|
| fast | 8 | 32 | 30 | 8 | 기본 (CPU에서 실습 가능) |
| standard | 16 | 48 | 60 | 12 | 시간 여유 있을 때 |

`train_gan(..., epochs=…, warmup=…)` 로 preset 값을 직접 덮어쓸 수 있습니다(빠른 실험용).

총 생성자 손실 = **w₁·L1 + wₛ·SSIM + λ·adversarial** (기본 w₁=1.0, wₛ=0.3, λ≈0.1). 형태·물리 손실(공극률·표면적)은 **W5**에서 더합니다.

## 5. 탐구 과제 (두 조 공통)

노트북 셀을 바탕으로, 아래 과제를 *코드 수정 + 결과 분석*과 함께 정리합니다. **"무엇을 바꿨고 / 무엇이 변했고 / 왜 그런가"** 를 반드시 적으세요.

### 과제 1 (필수) — GAN 있음/없음 비교
같은 조건에서 L1만 쓴 모델과 GAN 모델의 **연속 출력·경계·작은 pore** 를 비교합니다. 회색(불확실) 비율과 함께 무엇이 달라졌는지 서술.

### 과제 2 (필수) — λ sweep trade-off
`lambda_gan` 을 {0, 0.05, 0.1, 0.3, 0.5} 로 바꿔 **선명도(회색↓)** 와 **|Δφ|** 의 trade-off 곡선을 그리고, 적정 λ를 근거와 함께 고릅니다.

### 과제 3 (선택) — 학습 안정화 실험
`warmup` 길이 · spectral norm on/off · 학습률을 바꿔 **D/G 손실 곡선의 안정성** 이 어떻게 달라지는지 관찰합니다. 무너지는 신호(D 손실이 0에 붙음, 진동)를 찾아 설명.

### 과제 4 (선택, 심화) — "숫자 ≠ 좋은 복원"
|Δφ|·SSIM은 비슷한데 **구조는 다른** 슬라이스를 직접 찾아 시각화합니다. 왜 픽셀 지표가 이를 못 잡는지, 어떤 지표가 필요한지(→W5)를 서술.

## 6. 다음 주차 사전 준비

- W4: 다른 아키텍처 (Transformer 기반 · 3D conv)
- 본 주차 GAN 체크포인트(`w3_gan_mini.pth`) 보존

## 7. 자주 발생하는 문제

| 증상 | 해결 |
|------|------|
| `FileNotFoundError: BB_256.bin` | 노트북과 같은 폴더에 `data/` 가 있고 그 안에 `.bin` 이 풀렸는지 확인 |
| `ModuleNotFoundError: model_utils` | `dr_utils.py`·`model_utils.py` 가 노트북과 같은 폴더에 있는지 확인 |
| 학습이 너무 느림 | `epochs` 를 줄이거나 `preset='fast'` / 다른 프로그램 종료 |
| D 손실이 0으로 붙음 | λ를 낮추거나 D 학습률을 줄임 (판별자 독주) |
| 손실이 NaN으로 발산 | 학습률을 낮춤(예: 1e-4), warmup을 늘림 |
| 결과가 오히려 나빠짐 | λ가 너무 큼 — 0.1 근처로 |
