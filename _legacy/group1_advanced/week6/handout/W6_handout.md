# Week 6 Handout — 1조 Advanced (skeleton)

> **Cross-domain + Carbonate + 발표** — Sandstone → Carbonate · LBM
> Ketton/Estaillades 탄산염암에 ZS vs FT 비교, LBM 결과 시각화

## 학습 목표
1. Ketton·Estaillades 탄산염암 데이터 불러오기
2. 인코딩 sanity check (1=solid invert 처리) — 교육 포인트
3. Zero-shot vs Fine-tune 30분 결과 비교
4. LBM permeability (사전 계산 결과) 해석
5. 학생 발표 + 종합 회고

## 사전 준비
- Ketton·Estaillades 256 .bin (COMMON/data_extra)
- 발표 자료 5분 준비

## 신규 utils (dr_utils 확장)
- `load_carbonate`
- `encoding_check`
- `fine_tune_short`
- `lbm_results_viz`

## 학습 흐름 (skeleton — 풀콘텐츠는 강사가 단계적 추가)

| 섹션 | 주제 |
|------|------|
| §1 | Ketton·Estaillades 탄산염암 데이터 불러오기 |
| §2 | 인코딩 sanity check (1=solid invert 처리) — 교육 포인트 |
| §3 | Zero-shot vs Fine-tune 30분 결과 비교 |
| §4 | LBM permeability (사전 계산 결과) 해석 |
| §5 | 학생 발표 + 종합 회고 |

## 탐구 과제 (W6 skeleton)

**과제 1 (필수)**: 본 주제의 핵심 함수에 대해 주요 파라미터 sweep 수행.

**과제 2 (필수)**: 학습/평가 결과를 W1, W2 결과와 직접 비교.

**과제 3 (선택)**: 본인이 흥미있는 도메인/파라미터로 추가 탐구.

*(상세 과제는 풀콘텐츠 작성 시 추가)*

## 자기 점검 (skeleton)
1. 본 주차의 핵심 개념은?
2. Ketton·Estaillades 탄산염암 데이터 불러오기 에서 가장 중요한 발견?
3. W5 대비 무엇이 새로워졌나?
4. 다음 주 무엇을 다룰까?
5. *(추가 문항은 풀콘텐츠 작성 시)*

## 다음 주
🎓 코스 종료

---
*W6 handout · 1조 Advanced · skeleton (2026-06-05)*
