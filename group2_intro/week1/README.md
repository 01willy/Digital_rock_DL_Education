# Week 1 — Group 2 (Intro)

> Digital Rock 6주 코스 · 1주차 · DL 처음 배우는 학생용

## 폴더 안내

```
group2_intro/week1/
├── README.md                       ← 지금 보고 있는 파일
├── slides/
│   ├── W1_group2.pptx              ← 강의 슬라이드 (22장)
│   └── figs/                       ← PPT 임베드용 이미지
├── notebooks/
│   └── W1_load_and_explore.ipynb   ← 학생 실습 노트북 (20+ 셀, 단계별)
├── helpers/
│   └── dr_utils.py                 ← 데이터 I/O + 시각화 함수
├── data/
│   ├── BB_256.bin                  ← BB 사암 256³ binary (16 MB)
│   └── CastleGate_256.bin
└── handout/
    └── W1_handout.md               ← 학생 배포용 자기 점검 / 탐구 과제
```

## 실행
```bash
conda activate rock
cd notebooks/
jupyter notebook W1_load_and_explore.ipynb
```

## 학습 흐름 (권장 90분)
1. (30분) 강의 — `slides/W1_group2.pptx` 1~12장 (천천히, 용어 풀이 충분히)
2. (35분) 노트북 실행 + [Try-it!] 박스 4개 수행
3. (15분) 슬라이드 13~21 + 노트북 후반 (sparse + 단순 평균 보간)
4. (8분) 자기 점검 + 탐구 과제 시작 (handout 4번)
5. (2분) Q&A + W2 예고

## 사전 요구
- `COMMON/environment_setup_guide.md` 의 환경 설정 완료
- `COMMON/requirements_student.txt` 패키지 설치 완료

## 모르는 게 있을 때
- `handout/W1_handout.md` 의 **2. 핵심 용어 사전** 부터 확인
- notebook 안의 `[보조 설명]` 박스를 꼼꼼히 읽기
- 그래도 모르면 조교에게 질문
