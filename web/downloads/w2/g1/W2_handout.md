# Week 2 Handout — 1조 Advanced

> **Deep Learning 입문 + mini UNet 학습**

## 0. 체크리스트
- [ ] `pip install torch torchvision pytorch-msssim`
- [ ] W1 baseline 결과 (BB k=5 |Δφ|·SSIM) 메모
- [ ] W2 폴더 data 4개 (BB·CG·Bentheimer·Parker)

```bash
cd group1_advanced/week2/notebooks/
jupyter notebook W2_deep_learning_intro.ipynb
```

## 1. 학습 흐름 (90분 + 학습 옵션)
| 시간 | 활동 |
|------|------|
| 0~20분 | 강의 (UNet 구조·SliceDataset·학습 루프) |
| 20~30분 | 노트북 §0~§3 (환경·baseline·구조·데이터) |
| **30~30+T분** | **§4 학습** — PRESET 선택 (T = 10 / 30 / 60 분) |
| ~80분 | §5~§6 평가·시각화·[Try-it!] |
| ~90분 | 자기 점검 + Q&A |

## 2. 핵심 용어
| 용어 | 정의 |
|------|------|
| **Encoder / Decoder** | UNet 입력 압축 / 출력 복원 경로 |
| **Skip-connection** | Encoder detail을 Decoder에 직접 전달 — UNet 핵심 |
| **Sparse triplet** | (before, middle, after) 한 학습 sample |
| **Patch** | 큰 이미지에서 잘라낸 작은 영역. 학습 가속 목적 |
| **Augmentation** | flip/rotate로 데이터 늘리기 |
| **L1 / L2 loss** | 픽셀 절대값 / 제곱 오차 |
| **Adam optimizer** | 적응적 학습률 최적화. 기본 lr=1e-3 |
| **Epoch** | 데이터 전체를 1회 훑는 학습 단위 |
| **Checkpoint** | 학습된 모델 가중치 저장 파일 (.pth) |

## 3. PRESET 비교
| PRESET | base | epochs | 시간 (CPU) | params |
|---|---|---|---|---|
| fast | 8 | 20 | ~10분 | 29K |
| standard | 16 | 50 | ~30분 | 117K |
| full | 16 | 100 | ~60분 | 117K |

## 4. 탐구 과제

**과제 1 (필수)**: `'fast'` 와 `'standard'` 두 preset 학습 → BB k=5 의 시간 / 파라미터 / |Δφ| / SSIM 표.
**과제 2 (필수)**: 학습된 모델을 4 도메인에 평가 → cross-domain generalization 표 + 가설.
**과제 3 (선택, 도전)**: `nn.L1Loss()` → `nn.MSELoss()` 변경 후 재학습. L1 vs L2 결과 + 해석.
**과제 4 (선택, 심화)**: lr ∈ {1e-4, 5e-4, 1e-3, 5e-3} sweep + 학습 곡선 4 선 한 plot.

## 5. 회고 — 자기 점검 (본인 노트에 자유 기록)

본인이 본 W2에서 다음 질문들에 대해 어떤 답·관찰·가설을 가지게 되었는지 정리해보세요. 정답이 있는 질문이 아니므로 본인의 분석·근거를 함께 적는 게 핵심입니다.

- UNet의 skip-connection이 보간 문제에 효과적인 이유 — 본인이 학습한 모델 결과로 그 효과가 실제로 보였는가?
- patch_size·base·epochs의 trade-off를 본인 실험으로 확인한 결과
- Cross-domain 평가에서 모델이 \"어느 도메인에서 가장 일반화 잘 됐나\" 와 그 이유에 대한 본인 가설
- 학습 곡선의 모양(감소/평탄/진동)이 학습 과정에 대해 알려주는 것
- 본 mini UNet 이 더 좋아지려면 — 본인이 가장 먼저 바꿔보고 싶은 것 한 가지

## 6. W3 (손실 함수 + HPO) 진입 전
- `pip install pytorch-msssim optuna scikit-image`
- W2 학습 ckpt (`unet_mini_*.pth`) 보존

## Troubleshooting
| 증상 | 해결 |
|------|------|
| `torch not found` | `pip install torch torchvision` |
| 학습이 너무 느림 | PRESET을 'fast'로 / DataLoader num_workers=0 확인 |
| out of memory | batch_size 줄이기 (TRAINING_PRESETS 수정) |
| 학습 loss 발산 (NaN) | lr 너무 큼. `train_quick` 안 lr=1e-3 → 1e-4 |
