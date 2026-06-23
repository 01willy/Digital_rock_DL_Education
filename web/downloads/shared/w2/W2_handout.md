# Week 2 — Deep Learning 입문: UNet / pix2pix 구조

본 주차는 sparse 슬라이스 보간을 학습 가능한 함수로 다시 정식화하고, UNet과 pix2pix(조건부 image-to-image) 구조를 분석합니다. 학생 노트북(CPU)에서 mini UNet을 직접 학습하여 W1 classical baseline과 정량 비교합니다.

## 1. 사전 준비

- 패키지: `pip install torch torchvision` (GPU 없이 CPU만으로도 동작 — PRESET `fast` 기준 ~10분)
- W1 baseline 결과 (특히 BB k=1의 |Δφ|·SSIM) 메모
- 폴더 구성: `w2_code.zip` 을 푼 폴더에 `data/`(=`data_w2.zip` 압축 해제)가 함께 있어야 합니다. 노트북은 `data/` 가 같은 폴더 또는 `../data` 둘 다 자동 인식합니다.

```
<작업 폴더>/
├ W2_deep_learning_intro.ipynb
├ dr_utils.py · model_utils.py
└ data/   ← BB_256.bin · CastleGate_256.bin · Bentheimer_256.bin · Parker_256.bin
```

```bash
jupyter notebook W2_deep_learning_intro.ipynb
```

## 2. 학습 목표

1. UNet의 encoder/decoder/skip-connection 구조 분석
2. pix2pix 흐름 — 조건부 image-to-image 학습의 구조적 핵심
3. SliceDataset — 이웃 입력 (t±k → 가운데 t) 학습 데이터 구성
4. mini UNet (~30K–120K params) 학습 + 학습 곡선·평가 지표 해석
5. W1 Linear baseline 대비 정량 비교, cross-domain 일반화 평가
6. **(심화)** 학습 루프·손실·모델 크기를 *직접 수정*하고 그 영향을 정량 분석 (§6.5)
7. **(심화)** 이웃 거리 일반화·per-slice 실패 모드 분석으로 모델의 *한계*를 서술

## 3. 핵심 용어

| 용어 | 정의 |
|------|------|
| Encoder / Decoder | UNet 입력 압축 / 출력 복원 경로 |
| Skip-connection | Encoder의 detail을 Decoder에 직접 전달 — UNet의 핵심 |
| pix2pix | 조건부 image-to-image 학습 프레임. Generator는 UNet 기반 |
| 이웃 입력 | (t−k, t, t+k): 양옆 이웃 t±k 를 입력, 가운데 t 를 정답으로 하는 학습 sample 단위 |
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

노트북 **§6.5 심화** 셀(`train_custom` 등)을 바탕으로, 아래 과제를 *코드 수정 + 결과 분석*과 함께 정리합니다. 단순 실행이 아니라 **"무엇을 바꿨고 / 무엇이 변했고 / 왜 그런가"** 를 반드시 적으세요.

### 과제 1 (필수) — preset & 모델 크기

`fast`·`standard` 비교에 더해 `train_custom(base=…)` 로 모델 크기를 직접 바꿔, 파라미터 수 ↔ |Δφ|·SSIM ↔ 학습 시간의 trade-off를 표/그래프로 정리. 학습 곡선에서 **overfitting 징후**를 찾아 설명합니다.

### 과제 2 (필수) — Cross-domain 일반화

학습된 모델을 네 도메인(BB·CastleGate·Bentheimer·Parker)에 평가하고 표 + 시각화로 정리. 추가로 **각 도메인의 Linear 대비 개선폭**을 계산하고, 어느 도메인에서 일반화가 깨지는지·그 원인 가설(공극률·구조·등방성)을 정량 근거와 함께 제시합니다.

### 과제 3 (선택, 도전) — 복합 손실 함수

§6.5-B 확장: `nn.L1Loss()` / `nn.MSELoss()` 비교에 더해 **L1 + λ·(1−SSIM) 복합 손실을 직접 구현**하고, λ 를 바꿔 가며 선명도와 |Δφ| 의 trade-off를 분석합니다.

### 과제 4 (선택, 심화) — 이웃 거리별 비교 & 실패 모드

§6.5-C/D 확장: 각 이웃 거리 k(1·2·3·5)에서 UNet과 linear를 같은 조건으로 비교해 **이웃이 멀어질수록(k↑) UNet 우위가 어떻게 변하는지** 지도로 만들고, per-slice 오차가 큰 슬라이스들의 **구조적 공통점**으로 한계를 서술합니다. (도전: lr sweep `{1e-4, 5e-4, 1e-3, 5e-3}` 으로 발산/수렴도.)

## 6. 다음 주차 사전 준비

- W3: 적대적 학습 — pix2pix GAN
- 추가 패키지: `pip install pytorch-msssim optuna` (W3 손실·HPO용 — 이미 설치되어 있으면 생략)
- 본 주차 학습 체크포인트 (`unet_mini_*.pth`) 보존

## 7. 자주 발생하는 문제

| 증상 | 해결 |
|------|------|
| `FileNotFoundError: BB_256.bin` | 노트북과 같은 폴더에 `data/` 가 있고 그 안에 `.bin` 이 풀렸는지 확인 |
| `ModuleNotFoundError: dr_utils` | `dr_utils.py`·`model_utils.py` 가 노트북과 같은 폴더에 있는지 확인 |
| `torch not found` | `pip install torch torchvision` |
| 학습이 너무 느림 | PRESET을 `fast`로 / 다른 프로그램 종료 |
| Out of memory | `TRAINING_PRESETS`의 batch_size 축소 |
| 학습 loss가 NaN으로 발산 | `train_quick` 내부 학습률을 `1e-4`로 낮춤 |
