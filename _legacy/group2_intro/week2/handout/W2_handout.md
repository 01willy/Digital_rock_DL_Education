# Week 2 — Deep Learning 입문: UNet / pix2pix 구조 (2조)

본 주차는 sparse 슬라이스 보간을 학습 가능한 함수로 다시 정식화하고, UNet과 pix2pix 구조를 분석합니다. 학생 노트북(CPU)에서 mini UNet을 직접 학습(약 10분)하여 W1 baseline과 비교합니다.

## 1. 사전 준비

- 패키지: `pip install torch torchvision pytorch-msssim`
- W1 baseline 결과 메모
- 데이터 폴더 확인: `BB_256.bin`, `CastleGate_256.bin`, `Parker_256.bin`

```bash
cd group2_intro/week2/notebooks/
jupyter notebook W2_deep_learning_intro.ipynb
```

## 2. 학습 목표

1. UNet 구조의 핵심(encoder, decoder, skip-connection)을 코드로 따라가며 이해
2. pix2pix 흐름 — 조건부 image-to-image 학습 개요
3. mini UNet(~30K params)을 본인 노트북에서 직접 학습(약 10분)
4. 학습 곡선으로 학습 진행 판단
5. W1 Linear baseline과 정량 비교 + 다른 도메인 일반화 평가

## 3. 핵심 용어

| 용어 | 풀이 |
|------|------|
| Encoder | 영상을 점점 작게 만들며 핵심 특징을 추출 |
| Decoder | 작아진 특징을 원래 크기로 복원하며 출력 생성 |
| Skip-connection | Encoder의 detail을 Decoder에 직접 전달 |
| pix2pix | 조건부 image-to-image 학습 프레임 |
| Patch | 큰 이미지에서 잘라낸 작은 영역 |
| Loss | 예측과 정답의 차이 |
| Epoch | 학습 데이터 전체를 1회 훑는 단위 |
| Optimizer | 가중치를 갱신하는 알고리즘 |
| Checkpoint | 학습된 모델 저장 파일 |

## 4. 학습 옵션 (PRESET, 2조 권장: fast)

| Preset | base | epochs | 시간 (CPU) | 파라미터 |
|--------|------|--------|-----------|----------|
| fast (권장) | 8 | 20 | ~10분 | 약 29K |
| standard | 16 | 50 | ~30분 | 약 117K |

## 5. 탐구 과제

다음 과제는 본 노트북의 코드를 수정·확장하며 결과 분석과 함께 정리합니다.

### 과제 1 (필수) — preset 비교

fast와 standard 두 preset으로 학습하고 시간·파라미터·|Δφ|·SSIM 표를 작성합니다. 어느 preset이 본인 기준에서 가장 가성비가 좋은지, 그 근거를 제시.

### 과제 2 (필수) — Cross-domain 평가

학습된 모델을 BB·CastleGate·Parker 세 도메인에 평가합니다. 어느 도메인에서 일반화가 가장 잘 됐는지, 그 이유에 대한 본인 가설.

### 과제 3 (선택) — sparse k 변경

K=5로 학습한 모델을 K=3, K=7로도 평가하고 결과 변화를 관찰합니다. 모델이 어떤 K 범위에서 안정적인지 본인 분석.

### 과제 4 (선택, 도전) — Learning rate 실험

`train_quick` 내부 `lr=1e-3`을 1e-4, 5e-3으로 바꾸어 학습 곡선을 비교합니다. 학습률이 너무 작거나 너무 큰 경우의 양상을 본인 관찰·해석.

## 6. 다음 주차 사전 준비

- W3: 적대적 학습 — pix2pix GAN
- 본 주차 학습 체크포인트 보존

## 7. 자주 발생하는 문제

| 증상 | 해결 |
|------|------|
| `torch not found` | `pip install torch torchvision` |
| 학습이 너무 느림 | PRESET을 fast로 / 다른 프로그램 종료 |
| 학습 중 멈춤 | `n_patches_per_triplet=1`로 변경 (메모리 감소) |
| Loss가 NaN으로 발산 | 학습률을 `1e-4`로 낮춤 |
