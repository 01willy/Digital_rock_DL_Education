# Week 2 — Deep Learning 입문: UNet / pix2pix 구조 (1조)

본 주차는 sparse 슬라이스 보간을 학습 가능한 함수로 다시 정식화하고, UNet과 pix2pix(조건부 image-to-image) 구조를 분석합니다. 학생 노트북(CPU)에서 mini UNet을 직접 학습하여 W1 classical baseline과 정량 비교합니다.

## 1. 사전 준비

- 패키지: `pip install torch torchvision pytorch-msssim`
- W1 baseline 결과 (특히 BB k=5의 |Δφ|·SSIM) 메모
- 데이터 폴더 확인: `BB_256.bin`, `CastleGate_256.bin`, `Bentheimer_256.bin`, `Parker_256.bin`

```bash
cd group1_advanced/week2/notebooks/
jupyter notebook W2_deep_learning_intro.ipynb
```

## 2. 학습 목표

1. UNet의 encoder/decoder/skip-connection 구조 분석
2. pix2pix 흐름 — 조건부 image-to-image 학습의 구조적 핵심
3. SliceDataset — sparse triplet (before, middle, after) 학습 데이터 구성
4. mini UNet (~30K–120K params) 학습 + 학습 곡선·평가 지표 해석
5. W1 Linear baseline 대비 정량 비교, cross-domain 일반화 평가

## 3. 핵심 용어

| 용어 | 정의 |
|------|------|
| Encoder / Decoder | UNet 입력 압축 / 출력 복원 경로 |
| Skip-connection | Encoder의 detail을 Decoder에 직접 전달 — UNet의 핵심 |
| pix2pix | 조건부 image-to-image 학습 프레임. Generator는 UNet 기반 |
| Sparse triplet | (before, middle, after) 형태의 학습 sample 단위 |
| Patch | 큰 이미지에서 잘라낸 작은 영역. 학습 가속 목적 |
| Augmentation | flip/rotate 등으로 데이터 변형 |
| L1 / L2 loss | 픽셀 절대값 / 제곱 오차 |
| Adam optimizer | 적응적 학습률 최적화 |
| Epoch / Checkpoint | 데이터 전체 1회 학습 단위 / 학습된 가중치 저장 |

## 4. 학습 옵션 (PRESET)

| Preset | base | epochs | 시간 (CPU) | 파라미터 |
|--------|------|--------|-----------|----------|
| fast | 8 | 20 | ~10분 | 약 29K |
| standard | 16 | 50 | ~30분 | 약 117K |
| full | 16 | 100 | ~60분 | 약 117K |

## 5. 탐구 과제

본 노트북을 본인 작업 파일로 복사한 뒤, 다음 과제를 본인 분석·시각화·해석과 함께 정리해 제출합니다.

### 과제 1 (필수) — preset 비교

`fast`와 `standard` 두 preset으로 학습하고 시간 / 파라미터 / |Δφ| / SSIM과 학습 곡선을 함께 비교합니다. 더 큰 모델이 항상 좋지 않을 수 있는 이유에 대한 본인 해석.

### 과제 2 (필수) — Cross-domain 일반화

학습된 모델을 네 도메인(BB·CastleGate·Bentheimer·Parker)에 평가하고 결과 표 + 시각화로 정리합니다. 차이의 원인에 대한 본인 가설(공극률·구조·등방성 차이 등) 제시.

### 과제 3 (선택, 도전) — Loss 함수 비교

`nn.L1Loss()`를 `nn.MSELoss()` 또는 다른 손실로 바꾸어 같은 preset으로 재학습하고 결과 차이를 분석합니다. L1과 L2가 각각 유리한 상황에 대한 본인 해석.

### 과제 4 (선택, 심화) — Learning rate sensitivity

`train_quick` 내부 `Adam(lr=1e-3)`의 학습률을 ∈ {1e-4, 5e-4, 1e-3, 5e-3}로 sweep하고 학습 곡선을 비교합니다. 학습률이 너무 작거나 너무 큰 경우의 학습 양상 관찰.

## 6. 다음 주차 사전 준비

- W3: 적대적 학습 — pix2pix GAN
- 추가 패키지: `pip install pytorch-msssim` (이미 설치되어 있으면 생략)
- 본 주차 학습 체크포인트 (`unet_mini_*.pth`) 보존

## 7. 자주 발생하는 문제

| 증상 | 해결 |
|------|------|
| `torch not found` | `pip install torch torchvision` |
| 학습이 너무 느림 | PRESET을 `fast`로 / 다른 프로그램 종료 |
| Out of memory | `TRAINING_PRESETS`의 batch_size 축소 |
| 학습 loss가 NaN으로 발산 | `train_quick` 내부 학습률을 `1e-4`로 낮춤 |
