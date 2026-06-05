# Week 2 Handout — 2조 Intro

> **Deep Learning 입문 + mini UNet 학습 (10분)**

## 0. 체크리스트
- [ ] `pip install torch torchvision pytorch-msssim`
- [ ] W1 baseline 결과 메모
- [ ] W2 폴더 data 3개 (BB·CG·Parker)

```bash
cd group2_intro/week2/notebooks/
jupyter notebook W2_deep_learning_intro.ipynb
```

## 1. 학습 흐름 (90분)
| 시간 | 활동 |
|------|------|
| 0~25분 | 강의 (UNet 직관·skip-connection 이유·학습 루프) |
| 25~35분 | 노트북 §0~§3 (환경·baseline·구조·데이터) |
| **35~45분** | **§4 학습 — PRESET='fast' (10분)** |
| 45~75분 | §5~§6 평가·[Try-it!] |
| 75~90분 | 자기 점검 + Q&A |

## 2. 핵심 용어 (꼭 외워두기)
| 용어 | 풀이 |
|------|------|
| **Encoder** | 영상을 점점 작게 만들며 \"중요한 특징\" 추출하는 부분 |
| **Decoder** | 작아진 특징을 다시 원래 크기로 복원하는 부분 |
| **Skip-connection** | Encoder의 detail을 Decoder에 \"건너뛰어\" 직접 전달 |
| **Patch** | 큰 이미지를 작게 잘라 학습 — 메모리/시간 절약 |
| **Loss (손실)** | 예측과 정답의 차이. 작을수록 좋음 |
| **Epoch** | 데이터 전체를 1번 보고 학습하는 단위 |
| **Optimizer** | loss를 최소화하는 방향으로 모델 가중치 조정 (Adam이 기본) |
| **Checkpoint** | 학습된 모델 저장 파일 (.pth) — 나중에 재학습 없이 사용 |

## 3. PRESET 비교 (2조는 'fast' 권장)
| PRESET | base | epochs | 시간 | params |
|---|---|---|---|---|
| **fast** ★ | 8 | 20 | ~10분 | 29K |
| standard | 16 | 50 | ~30분 | 117K |

## 4. 탐구 과제

**과제 1 (필수)**: fast 와 standard 두 preset 학습 → 시간/파라미터/|Δφ|·SSIM 표. \"가성비\" 가 좋은 쪽은?

**과제 2 (필수)**: 학습된 모델을 BB·CastleGate·Parker 세 도메인 평가. 어느 도메인에서 일반화가 가장 잘 됐나?

**과제 3 (선택)**: K=5 학습 모델을 K=3 평가, K=7 평가. K가 작아질수록 / 커질수록 결과는?

**과제 4 (선택, 도전)**: `train_quick` 안 `Adam(lr=1e-3)` 를 `lr=1e-4` / `lr=5e-3` 으로 바꿔보고 학습 곡선 비교.

## 5. 자기 점검 (직접 답 적기)
1. UNet skip-connection 의 역할 (한 문장) → ________
2. patch_size 의 효과 (왜 작게 자르나?) → ________
3. 본인이 학습한 fast 모델의 |Δφ| 와 baseline |Δφ| 비교 → ________
4. 학습 곡선이 어떻게 변했나 (감소? 평탄? 진동?) → ________
5. Cross-domain 평가에서 어느 도메인이 가장 어려웠나? → ________

## 6. W3 (손실 함수) 진입 전
- `pip install pytorch-msssim`
- W2 학습 ckpt 보존

## Troubleshooting
| 증상 | 해결 |
|------|------|
| `torch not found` | `pip install torch torchvision` |
| 학습 너무 느림 | PRESET='fast' 인지 확인 / 다른 프로그램 끄기 |
| 학습 도중 멈춤 | RAM 부족 — `n_patches_per_triplet=1` 로 변경 |
| Loss 가 NaN | lr 너무 큼 — `train_quick` 내부 lr=1e-4 |
