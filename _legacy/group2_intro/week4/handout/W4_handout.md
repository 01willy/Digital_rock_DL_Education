# Week 4 Handout — 2조 Intro (skeleton)

> **다른 아키텍처 비교** — UNet vs SwinUNet vs 3D UNet
> 같은 sparse 보간을 3개 모델로 풀어 비교

## 학습 목표
1. UNetG (CNN) vs SwinUNet (Transformer) vs 3D UNet 비교
2. Pre-trained 3개 ckpt 로드 + inference
3. 파라미터·학습시간·정확도 trade-off 정량 분석
4. 1조: 모델 swap 실험, 2조: 결과 해석
5. fig_supp_swinunet (연구 결과 figure) 해석

## 사전 준비
- Pre-trained 3 ckpt 다운로드 (config 안내 따라)

## 신규 utils (dr_utils 확장)
- `SwinUNetMini`
- `UNet3DMini`
- `model_zoo`
- `benchmark_models`

## 학습 흐름 (skeleton — 풀콘텐츠는 강사가 단계적 추가)

| 섹션 | 주제 |
|------|------|
| §1 | UNetG (CNN) vs SwinUNet (Transformer) vs 3D UNet 비교 |
| §2 | Pre-trained 3개 ckpt 로드 + inference |
| §3 | 파라미터·학습시간·정확도 trade-off 정량 분석 |
| §4 | 1조: 모델 swap 실험, 2조: 결과 해석 |
| §5 | fig_supp_swinunet (연구 결과 figure) 해석 |

## 탐구 과제 (W4 skeleton)

**과제 1 (필수)**: 본 주제의 핵심 함수에 대해 주요 파라미터 sweep 수행.

**과제 2 (필수)**: 학습/평가 결과를 W1, W2 결과와 직접 비교.

**과제 3 (선택)**: 본인이 흥미있는 도메인/파라미터로 추가 탐구.

*(상세 과제는 풀콘텐츠 작성 시 추가)*

## 자기 점검 (skeleton)
1. 본 주차의 핵심 개념은?
2. UNetG (CNN) vs SwinUNet (Transformer) vs 3D UNet 비교 에서 가장 중요한 발견?
3. W3 대비 무엇이 새로워졌나?
4. 다음 주 무엇을 다룰까?
5. *(추가 문항은 풀콘텐츠 작성 시)*

## 다음 주
W5: Tri-axis aggregation (본 연구 핵심)

---
*W4 handout · 2조 Intro · skeleton (2026-06-05)*
