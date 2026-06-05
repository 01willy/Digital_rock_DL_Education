# Week 3 Handout — 1조 Advanced (skeleton)

> **손실 함수 + HPO 입문** — Losses · Optuna HPO
> 6개 손실 함수 ablation + Optuna multi-objective HPO

## 학습 목표
1. 6개 손실 함수 (L1·SSIM·Gradient·Porosity·SurfaceArea·S2) 효과 시각 비교
2. Loss weight sweep — 어떤 조합이 어떤 결과?
3. Optuna multi-objective HPO 결과 Pareto front 해석
4. 1조: mini Optuna (3 trial, ~20분) 직접 실행
5. fig_component_waterfall (연구 결과 figure) 해석

## 사전 준비
- pip install pytorch-msssim optuna scikit-image

## 신규 utils (dr_utils 확장)
- `porosity_loss`
- `sa_loss`
- `s2_loss`
- `run_optuna_mini`

## 학습 흐름 (skeleton — 풀콘텐츠는 강사가 단계적 추가)

| 섹션 | 주제 |
|------|------|
| §1 | 6개 손실 함수 (L1·SSIM·Gradient·Porosity·SurfaceArea·S2) 효과 시각 비교 |
| §2 | Loss weight sweep — 어떤 조합이 어떤 결과? |
| §3 | Optuna multi-objective HPO 결과 Pareto front 해석 |
| §4 | 1조: mini Optuna (3 trial, ~20분) 직접 실행 |
| §5 | fig_component_waterfall (연구 결과 figure) 해석 |

## 탐구 과제 (W3 skeleton)

**과제 1 (필수)**: 본 주제의 핵심 함수에 대해 주요 파라미터 sweep 수행.

**과제 2 (필수)**: 학습/평가 결과를 W1, W2 결과와 직접 비교.

**과제 3 (선택)**: 본인이 흥미있는 도메인/파라미터로 추가 탐구.

*(상세 과제는 풀콘텐츠 작성 시 추가)*

## 자기 점검 (skeleton)
1. 본 주차의 핵심 개념은?
2. 6개 손실 함수 (L1·SSIM·Gradient·Porosity·SurfaceArea·S2) 효과 시각 비교 에서 가장 중요한 발견?
3. W2 대비 무엇이 새로워졌나?
4. 다음 주 무엇을 다룰까?
5. *(추가 문항은 풀콘텐츠 작성 시)*

## 다음 주
W4: 다른 아키텍처 비교 (SwinUNet vs UNetG vs 3D UNet)

---
*W3 handout · 1조 Advanced · skeleton (2026-06-05)*
