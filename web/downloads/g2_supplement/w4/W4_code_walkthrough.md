# W4 코드 walkthrough — 셀별 설명과 인자 변경 가이드

노트북 `W4_architectures.ipynb` 의 셀을 순서대로 설명한다.

## §0 환경 준비

`dr_utils`(데이터·평가)와 `model_utils`(모델·학습)를 불러온다. W4 신규 항목은
`window_partition`, `WindowAttentionMini`, `SwinBlockMini`, `SwinUNetMini`,
`UNet3DMini`, `Slice3DDataset`, `evaluate_model_3d`, `benchmark_models`.
시드(0)를 고정해 재실행 시 결과 변동을 줄인다.

## §1 문제 설정과 기준선

`load_volume` 으로 Bentheimer 256³ 로드, `predict_linear_k` + `eval_targets` 로 선형 보간
기준선을 계산한다. k=2 는 W3와 동일하다.

- **바꿔 보기**: `K=1` 또는 `K=3` 으로 바꾸면 문제 난이도가 달라진다. k 가 클수록 이웃이
  멀어져 모든 방법의 지표가 나빠진다.

## §2 attention 수치 계산

토큰 3개(d=2)로 `Q@K.T → ÷√d → softmax → @V` 를 한 줄씩 실행한다. 모든 중간 행렬을
print 하므로 손계산과 대조할 수 있다.

- **바꿔 보기**: `scaled = scores / (2 ** 0.5)` 를 `scaled = scores` 로 바꾸면 √d 나눗셈이
  빠진다. 이 예제(점수 최대 2)에서는 차이가 작다. §2.1의 큰 점수 예제가 포화를 보여 준다.

## §2.1 √d 와 softmax 포화

점수 [8, 0, −8] 을 그대로/나눠서 softmax 에 넣어 가중치 분포를 비교한다.

## §2.2 창 분할

실제 슬라이스의 64×64 토큰 격자에 8×8 창 경계를 그리고, `window_partition` 의 shape
변화 `(1,64,64,32) → (64,8,8,32)` 를 확인한다.

## §3 SwinUNetMini

`SwinUNetMini(in_ch=2, base=32, num_heads=4, window_size=8)` 를 만들고 파라미터 수
(~124K)와 forward shape 를 확인한다. `WindowAttentionMini(..., return_attn=True)` 로
attention 가중치 행렬(행 합=1)을 직접 꺼내 본다.

- **주의**: 입력 H·W 는 32의 배수여야 한다(패치 4× × 창 8). 64·128·256 모두 가능.

## §4 UNet3DMini

`Slice3DDataset` 의 입력(깊이 5 부피, 채워진 면 2장 + 마스크)을 시각화해 "공정한 입력"을
눈으로 확인한다. 모델 출력은 가운데 슬라이스 한 장이다.

- **바꿔 보기**: `UNet3DMini(base=8)` 또는 `base=12` 로 폭을 바꾸면 파라미터가
  ~83K/~186K 로 변한다. 같은 예산에서 폭 대 학습량의 trade-off 를 볼 수 있다.

## §5 benchmark_models + 우리 방식(GAN)

세 비교 구조를 같은 예산(`budget_s=90`)으로 학습·평가한 뒤, §5.1 에서 **우리 방식**
(2D UNet 생성자 + PatchGAN 판별자)을 같은 90초로 학습해 `results` 에 추가한다. 이것이
"우리 모델은 왜 비교에 없나"의 실습 답이다. GAN 은 픽셀 SSIM 을 조금 내주는 대신 물성(|Δφ|)
보존에서 앞서는 경향을 보인다. benchmark_models 내부 동작:

1. 모델별로 시드 재고정 → 같은 데이터 순서
2. 2D 모델은 `SliceDataset`, 3D 모델은 `Slice3DDataset` (같은 정보)
3. wall-clock 이 예산을 넘으면 즉시 중단 → epoch 수는 모델마다 다름
4. `evaluate_model` / `evaluate_model_3d` 로 동일 지표 산출

optimizer 는 구조별 표준 설정을 쓴다(합성곱: Adam lr=1e-3, transformer: AdamW lr=2e-4
+ gradient clipping). 같은 설정이 모든 구조에 안정적이지는 않기 때문이다.

- **바꿔 보기**: `budget_s=30/90/180`. 예산이 길수록 느린 구조(3D)가 따라붙는지 관찰.
- **주의**: CPU 에서 §5 전체(학습 3회 + 평가 3회)는 5분 내외 걸린다.

## §5.1 학습 곡선

x축이 epoch 이 아니라 **경과 시간(초)** 이다. 같은 시간축이어야 공정한 비교가 된다.

## §6 복원 비교 · §6.1 trade-off

z=128 슬라이스의 전체+64×64 확대를 다섯 가지(원본·선형·세 모델)로 본다.
trade-off 산점도에서는 파라미터·epoch·지표를 함께 읽는다.

- **바꿔 보기**: `zc`, `y0, x0` 를 바꿔 다른 위치를 관찰. 얇은 목(throat)이 있는 위치가
  방법 간 차이가 크다.

## §7 창 크기 실험

`window_size=4` 로 다시 학습해 8×8 과 비교한다. 창이 작으면 스텝이 빨라 epoch 을 더 돌지만
한 번에 보는 범위가 좁다.

- **바꿔 보기**: `window_size=16` (H/4=64의 약수여야 함), `num_heads=2/8`
  (base=32 가 head 수로 나누어떨어져야 함).

## 자주 나는 오류

| 증상 | 원인·해결 |
|---|---|
| `H·W not divisible` 형태의 shape 오류 | 입력 크기가 32의 배수가 아님. patch_size=64 유지 |
| SwinUNet 손실이 내려가다 튐 | 학습률이 큼. benchmark_models 기본 설정 사용 |
| §5가 너무 오래 걸림 | budget_s 를 줄이거나 GPU 사용 (`DEVICE` 자동 감지) |
| 한글 라벨이 □ 로 표시 | `setup_plot_style()` 호출 확인 |
