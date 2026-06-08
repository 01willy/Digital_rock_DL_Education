# Week 5 Handout — 1조 Advanced (skeleton)

> **Tri-Axis Aggregation — 본 연구 핵심** — 2.5D Fusion (3 methods)
> 세 직교축 보간 결과를 GT-free 방식으로 융합

## 학습 목표
1. z·y·x 각 축 inference 직접 실행
2. 3가지 GT-free aggregation 비교: tri_mean / tri_weuler_self / tri_consensus
3. 4 도메인 (BB·CG·Bentheimer·Parker) 결과 비교
4. 등방성 가정의 정량 검증
5. fig_aggregation_pareto 해석

## 사전 준비
- W4 pre-trained ckpt 또는 W2 학습 mini UNet

## 신규 utils (dr_utils 확장)
- `triaxis_inference`
- `aggregate_mean`
- `aggregate_weuler`
- `aggregate_consensus`

## 학습 흐름 (skeleton — 풀콘텐츠는 강사가 단계적 추가)

| 섹션 | 주제 |
|------|------|
| §1 | z·y·x 각 축 inference 직접 실행 |
| §2 | 3가지 GT-free aggregation 비교: tri_mean / tri_weuler_self / tri_consensus |
| §3 | 4 도메인 (BB·CG·Bentheimer·Parker) 결과 비교 |
| §4 | 등방성 가정의 정량 검증 |
| §5 | fig_aggregation_pareto 해석 |

## 탐구 과제 (W5 skeleton)

**과제 1 (필수)**: 본 주제의 핵심 함수에 대해 주요 파라미터 sweep 수행.

**과제 2 (필수)**: 학습/평가 결과를 W1, W2 결과와 직접 비교.

**과제 3 (선택)**: 본인이 흥미있는 도메인/파라미터로 추가 탐구.

*(상세 과제는 풀콘텐츠 작성 시 추가)*

## 자기 점검 (skeleton)
1. 본 주차의 핵심 개념은?
2. z·y·x 각 축 inference 직접 실행 에서 가장 중요한 발견?
3. W4 대비 무엇이 새로워졌나?
4. 다음 주 무엇을 다룰까?
5. *(추가 문항은 풀콘텐츠 작성 시)*

## 다음 주
W6: Cross-domain (Carbonate) + LBM + 발표

---
*W5 handout · 1조 Advanced · skeleton (2026-06-05)*
