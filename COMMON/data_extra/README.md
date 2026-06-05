# COMMON/data_extra — 6주 코스 확장 데이터

W2~W6 에서 사용될 추가 도메인 256³ binary sub-volume 모음.
모든 파일은 **uint8 (0=solid, 1=pore)** 로 통일됨.

| 파일 | shape | dtype | voxel size | φ | 도메인 | 사용 주차 |
|------|-------|-------|-----------|---|--------|-----------|
| Parker_256.bin | 256³ | uint8 | 2.25 μm | 12.3% | sandstone | W1~W6 |
| Berea_256.bin | 256³ | uint8 | 2.77 μm | 19.8% | sandstone | W3 (debug) |
| Ketton_256.bin | 256³ | uint8 | 3.00 μm | 11.8% | carbonate | W6 (cross-domain) |
| Estaillades_256.bin | 256³ | uint8 | 3.31 μm | 9.6% | carbonate | W6 (cross-domain) |

## 인코딩 통일 노트 ★ 교육 포인트

Ketton/Estaillades 원본은 **1=solid, 0=pore** 로 반대 인코딩되어 있었음.
우리는 W1부터 \"0=solid, 1=pore\" 로 통일하므로 추출 시 `1 - vol` 로 invert 처리됨.

→ W6에서 학생에게 \"서로 다른 출처의 데이터는 인코딩이 다를 수 있다 — 첫 단계로 공극률 sanity check 필수\" 라는 교훈으로 활용.

## voxel size 차이

도메인마다 voxel 크기가 다름 (2.25 ~ 3.31 μm).
실제 부피 비교 시 \"voxel 수\" 가 아니라 \"μm³\" 로 환산 필요.
W6 cross-domain 평가에서 다룸.
