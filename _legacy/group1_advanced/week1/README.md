# Week 1 — Group 1 (Advanced)

> Digital Rock 6주 코스 · 1주차 · DL 경험 있는 학생용

## 폴더 안내

```
group1_advanced/week1/
├── README.md                       ← 지금 보고 있는 파일
├── slides/
│   ├── W1_group1.pptx              ← 강의 슬라이드 (20장)
│   └── figs/                       ← PPT 임베드용 이미지
├── notebooks/
│   └── W1_load_and_explore.ipynb   ← 학생 실습 노트북 (17 셀)
├── helpers/
│   └── dr_utils.py                 ← 데이터 I/O + 보간 함수 (6주 내내 재사용)
├── data/
│   ├── BB_256.bin                  ← BB 사암 256³ binary (16 MB)
│   ├── CastleGate_256.bin
│   └── Bentheimer_256.bin
└── handout/
    └── W1_handout.md               ← 학생 배포용 자기 점검 / 탐구 과제
```

## 실행
```bash
conda activate rock
cd notebooks/
jupyter notebook W1_load_and_explore.ipynb
```

## 사전 요구
- `COMMON/environment_setup_guide.md` 의 환경 설정 완료
- `COMMON/requirements_student.txt` 패키지 설치 완료
