# W2 보조 노트 — 개념 풀이

본 노트는 W2 본 자료(노트북·핸드아웃)에서 빠르게 지나가는 deep learning 개념을 좀 더 풀어 설명합니다.

---

## 1. 신경망 학습이란?

\"학습\" = 모델의 내부 파라미터(가중치, weight) 를 조정해 입력 → 출력 함수를 데이터로부터 만들어 가는 과정. 본 W2에서는 \"앞·뒤 슬라이스 입력 → 가운데 슬라이스 출력\" 함수를 학습합니다.

핵심 사이클:
1. **Forward**: 모델에 입력을 넣어 예측 출력
2. **Loss**: 예측과 정답의 차이 계산
3. **Backward**: gradient(기울기) 계산
4. **Optimizer step**: 가중치를 \"loss 가 줄어드는 방향\" 으로 한 걸음 갱신

이 사이클을 수많은 batch에 대해 반복하며 가중치가 점점 좋아집니다.

---

## 2. UNet 구조

이름의 \"U\" 는 모양에서 옴 — encoder(수축) → bottleneck → decoder(확장) 이 U자 모양.

**Encoder (수축 경로)**
- Conv → MaxPool 반복
- 영상 크기가 점점 작아짐 (`64×64 → 32×32 → 16×16`)
- 채널 수는 늘어남 (`8 → 16 → 32`)
- \"높은 수준의 특징\" 을 추출

**Decoder (확장 경로)**
- ConvTranspose 로 크기를 다시 키움 (`16×16 → 32×32 → 64×64`)
- 채널 수는 줄어듦
- 픽셀 단위 출력 생성

**Skip-connection (UNet 핵심)**
- Encoder 의 각 단계 출력을 같은 크기의 Decoder 단계에 \"건너뛰어\" 연결
- 왜 필요: encoder에서 작아질 때 잃어버린 detail(엣지, 텍스처) 을 decoder에서 복원할 수 있게

UNet 은 의료 영상 segmentation에서 시작해 image-to-image 변환 분야의 표준이 되었습니다.

---

## 3. pix2pix — 조건부 image-to-image

\"입력 이미지 → 출력 이미지\" 변환을 학습하는 프레임워크. Generator는 보통 UNet 기반.

본 W2 에서는 \"앞 + 뒤 슬라이스\" 라는 조건 입력에서 \"가운데 슬라이스\" 를 만드는 변환입니다. 이는 pix2pix의 한 사례.

W3 에서는 여기에 Discriminator (적대적 학습) 를 더해 더 선명한 복원으로 확장합니다.

---

## 4. Sparse triplet — 학습 데이터의 단위

본 데이터에서 sparse k=3 일 때:
- 측정된 z: 0, 3, 6, 9, ...
- 누락된 z: 1, 2, 4, 5, 7, 8, ...

한 triplet 학습 sample:
- (z=0, z=1, z=3) → 입력 `[bb[0], bb[3]]`, target `bb[1]`
- (z=0, z=2, z=3) → 입력 `[bb[0], bb[3]]`, target `bb[2]`
- (z=3, z=4, z=6) → 입력 `[bb[3], bb[6]]`, target `bb[4]`
- ...

즉, **누락된 슬라이스 하나마다 한 sample**. SliceDataset 클래스가 이를 자동 생성합니다.

---

## 5. Patch — 학습 가속의 트릭

256×256 슬라이스 전체로 학습하면 batch 1개당 메모리·시간이 많이 듭니다. 대신 **64×64 작은 patch** 를 무작위로 잘라 학습하면:
- 메모리: 1/16
- 학습 속도: ~16배 빠름
- 결과 품질: 비슷함 (작은 영역도 충분한 학습 신호 제공)

본 코스에서 `patch_size=64` 가 기본값. 더 큰 patch 로 바꾸려면 메모리·시간이 비례해서 늘어남.

---

## 6. PRESET — 학습 시간 옵션

학생 환경(CPU vs GPU)이 다양해서 **3가지 학습 강도** 를 미리 정의:

| Preset | base 채널 | epochs | 시간 (CPU 기준) |
|--------|----------|--------|-----------------|
| fast | 8 | 20 | ~10분 |
| standard | 16 | 50 | ~30분 |
| full | 16 | 100 | ~60분 |

`base` 가 모델 크기를 결정. 8 → 약 29K 파라미터, 16 → 약 117K. 큰 모델이 항상 좋지는 않습니다 (overfitting 가능).

`epochs` 는 학습 반복 횟수. 너무 적으면 underfit, 너무 많으면 overfit.

---

## 7. Loss 함수 — L1, L2, SSIM 등

**L1 loss (Mean Absolute Error)**
- `|pred − target|` 평균
- robust to outlier, 흐리지만 부드러운 결과

**L2 loss / MSE**
- `(pred − target)²` 평균
- outlier에 민감, 선명도 좋지만 안정성 떨어짐

**SSIM loss**
- 구조 유사도 기반. 픽셀 정확도보다 \"모양 유사성\" 강조

본 W2는 단순 L1만 사용. W3에서 SSIM·porosity 손실 등을 추가하며 효과를 비교합니다.

---

## 8. Optimizer — Adam

가중치 갱신 알고리즘. Stochastic Gradient Descent (SGD) 의 발전된 형태로, 각 파라미터마다 적응적으로 학습률을 조정합니다. 기본 `lr=1e-3` 이 대부분 잘 동작.

학습률 (learning rate, lr):
- 너무 작으면 → 학습 매우 느림
- 너무 크면 → 발산 (loss가 NaN으로 폭주)
- 적정 범위 보통 `1e-4 ~ 5e-3`

---

## 9. 평가 — 학습 후 무엇을 보나

W1 의 baseline (Linear) 결과와 직접 비교:
- 같은 sparse k 에서 |Δφ| 가 얼마나 작아졌는가
- SSIM 이 얼마나 올라갔는가
- 시각 비교: 원본 vs Linear vs UNet vs 오차맵

**Cross-domain 평가**: BB에서 학습한 모델을 CastleGate, Bentheimer, Parker 에 평가. 학습한 도메인 외에서도 잘 작동하면 \"일반화\" 가 된 것.

---

## 다음 단계

이 개념들을 이해했으면 `W2_code_walkthrough.md` 로 셀별 코드 흐름을 따라가보세요.
