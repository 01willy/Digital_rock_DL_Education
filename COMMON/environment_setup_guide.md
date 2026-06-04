# 환경 설정 가이드 — Digital Rock 6주 코스

> **이 가이드는 1조와 2조 모두 동일하게 적용됩니다.**
> 첫 수업 전까지 반드시 본인 노트북에서 setup을 완료해주세요.

---

## 0. 한눈에 보기 — 본 코스에 필요한 것

| 항목 | 요구 사양 |
|------|-----------|
| OS | Windows 10/11, macOS 12+, Ubuntu 20.04+ 모두 가능 |
| Python | **3.9 이상 (3.10 또는 3.11 권장)** |
| RAM | 8 GB 이상 (16 GB 권장) |
| 디스크 | 약 5 GB 여유 (가상환경 + 데이터 + 체크포인트) |
| GPU | **불필요** — CPU만으로 전 주차 진행 가능 (W3 학습은 mini 모델로 대체) |
| 인터넷 | 최초 패키지 설치 시에만 필요 |

> **GPU가 없어도 됩니다.** W3에서 본격적인 UNet 학습은 시간이 오래 걸리므로, 우리는 미리 학습된 체크포인트(checkpoint)를 함께 배포합니다. 학생은 모델을 **불러와서 inference만** 하거나, **축소 모델(mini-UNet)을 짧게 학습**하는 두 가지 옵션 중 선택할 수 있습니다.

---

## 1. Python 설치 확인

### 1-1. 이미 설치되어 있는지 확인

터미널(macOS/Linux) 또는 Anaconda Prompt(Windows)에서:

```bash
python3 --version
```

`Python 3.9.x` 이상이 나오면 OK. 그렇지 않다면 아래로.

### 1-2. 새로 설치 (Anaconda 권장)

학생용으로는 **Anaconda 또는 Miniconda** 가 가장 쉽습니다.

- Anaconda 다운로드: https://www.anaconda.com/download
- 더 가벼운 Miniconda: https://docs.conda.io/en/latest/miniconda.html

설치 후 터미널 재시작.

---

## 2. 가상환경 만들기 (필수!)

가상환경(virtual environment)은 "이 프로젝트 전용 Python 작업방"입니다.
다른 프로젝트와 버전 충돌이 일어나지 않게 해줍니다.

### 방법 A — conda (가장 추천, 모든 OS)

```bash
# 1) "rock"이라는 이름의 새 환경을 Python 3.10으로 만들기
conda create -n rock python=3.10 -y

# 2) 환경 활성화 (앞으로 매번 작업 시작 시 실행)
conda activate rock

# 3) 패키지 설치
pip install -r requirements_student.txt
```

### 방법 B — venv (conda 없이)

```bash
# 1) 환경 만들기
python3 -m venv ~/rock_env

# 2) 활성화
# macOS/Linux:
source ~/rock_env/bin/activate
# Windows:
~/rock_env/Scripts/activate

# 3) 설치
pip install -r requirements_student.txt
```

---

## 3. 설치 확인

가상환경 활성화 후:

```bash
python3 -c "import numpy, matplotlib, scipy, torch; print('numpy:', numpy.__version__); print('torch:', torch.__version__); print('OK')"
```

`torch.__version__` 이 2.0 이상으로 나오면 성공.

### Jupyter Notebook 실행

```bash
cd <본인이 압축 푼 폴더>/group1_advanced/week1/  # 또는 group2_intro
jupyter notebook
```

브라우저에서 `notebooks/` 폴더의 `.ipynb` 파일을 클릭해 열어보세요.

---

## 4. 자주 발생하는 문제

### Q1. "ModuleNotFoundError: No module named 'torch'"
→ 가상환경이 활성화되어 있지 않습니다. `conda activate rock` 또는 `source ~/rock_env/bin/activate` 다시 실행.

### Q2. PyTorch 설치가 느리거나 실패
→ 공식 가이드를 그대로 사용하세요: https://pytorch.org/get-started/locally/
   기본 옵션 (Stable / Linux 또는 Mac / Pip / Python / CPU) 선택.

### Q3. "RuntimeError: CUDA out of memory" (GPU 사용 중 발생)
→ batch size 또는 patch size를 줄이세요. notebook 안에 `BATCH_SIZE`, `PATCH_SIZE` 파라미터가 있습니다.

### Q4. matplotlib 그래프가 노트북에 안 보임
→ 첫 셀에 `%matplotlib inline` 을 추가하거나, 노트북을 재시작 후 모든 셀 다시 실행.

### Q5. 한글이 깨져서 보임 (matplotlib)
→ macOS/Linux: 첫 셀에 추가
   ```python
   import matplotlib.pyplot as plt
   plt.rcParams['font.family'] = 'AppleGothic'  # 또는 'NanumGothic'
   ```
   Windows: `'Malgun Gothic'`

---

## 5. GPU가 있는 경우 (선택)

NVIDIA GPU가 있는 학생은 CUDA 버전 PyTorch를 설치하면 W3 학습이 훨씬 빠릅니다.

```bash
# CUDA 11.8 기준 (NVIDIA 드라이버 확인 필요)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

확인:
```python
import torch
print(torch.cuda.is_available())   # True 가 나와야 함
print(torch.cuda.get_device_name(0))
```

> GPU가 없어도 본 코스의 모든 학습 목표는 달성 가능합니다. 단, 시간 차이가 큽니다.

---

## 6. 디스크 / 폴더 구조

배포받은 폴더의 전체 구조:

```
education_package_2026/
├── COMMON/                   ← 이 가이드 + requirements
├── group1_advanced/          ← 1조용 자료 (DL 경험 있는 학생)
│   └── week1/                  ← 1주차 폴더
│       ├── slides/             ← 강의 PPT
│       ├── notebooks/          ← 실습 jupyter notebook
│       ├── helpers/            ← 공통 helper 모듈 (.py)
│       ├── data/               ← W1 데이터 (16~32 MB)
│       └── handout/            ← 숙제 / 체크리스트
└── group2_intro/             ← 2조용 자료 (DL 입문 학생)
    └── week1/
        └── (동일 구조)
```

매주 새 폴더 (week2, week3, ...) 가 추가됩니다.

---

## 7. 도움 요청

설치 중 막히면 **첫 수업 시작 전까지 조교/교수님께 연락** 해주세요.
스크린샷과 에러 메시지를 함께 보내주시면 빠르게 도와드릴 수 있습니다.
