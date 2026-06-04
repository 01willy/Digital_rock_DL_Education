"""
Digital Rock 교육 패키지 — 공통 유틸리티 (Group 2: Intro)

본 모듈은 6주 코스 전체에서 재사용됩니다.

학생이 학습할 핵심 관점:
  "이 함수들의 인자(parameter)를 바꾸면서 결과가 어떻게 달라지는지
   관찰하고, 그 차이를 자신의 말로 해석하는 것이 목표입니다."

각 함수의 docstring 마지막에 [파라미터 실험] 박스가 있습니다.
notebook의 [Try-it!] 셀에서 직접 실험해보세요.
"""

import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

# ──────────────────────────────────────────────────────────────
# 디자인 상수 (모든 plot 통일)
# ──────────────────────────────────────────────────────────────
ORANGE = '#EA851B'
NAVY = '#1F3A5F'
GREEN = '#2E8B57'
RED = '#C83A3A'
GRAY = '#7A7A7A'


def setup_plot_style():
    """
    matplotlib 기본 스타일 — 모든 notebook 첫 셀에서 호출.

    한글이 plot에 들어가도록 시스템 폰트(Pretendard 등)를 등록하고,
    글자 크기/축 스타일을 통일합니다.
    """
    import os
    import matplotlib.font_manager as fm

    font_search_dirs = ['/home/willy010313/.fonts',
                        '/usr/share/fonts',
                        os.path.expanduser('~/Library/Fonts'),
                        'C:\\Windows\\Fonts']
    candidates = ['Pretendard', 'NanumGothic', 'AppleGothic', 'Malgun Gothic']
    chosen = 'sans-serif'
    for d in font_search_dirs:
        if not os.path.isdir(d):
            continue
        for root, _, files in os.walk(d):
            for f in files:
                if f.lower().endswith(('.ttf', '.otf')) and any(c in f for c in ['Pretendard', 'Nanum']):
                    try:
                        fm.fontManager.addfont(os.path.join(root, f))
                    except Exception:
                        pass
    for c in candidates:
        if any(c == f.name for f in fm.fontManager.ttflist):
            chosen = c
            break

    plt.rcParams.update({
        'figure.dpi': 110,
        'font.family': chosen,
        'font.size': 11,
        'axes.titlesize': 13,
        'axes.titleweight': 'bold',
        'axes.labelsize': 11,
        'axes.spines.top': False,
        'axes.spines.right': False,
        'image.cmap': 'gray',
        'axes.unicode_minus': False,
    })


# ──────────────────────────────────────────────────────────────
# 데이터 I/O
# ──────────────────────────────────────────────────────────────
def load_volume(path, shape=(256, 256, 256), dtype=np.uint8):
    """
    Binary 파일에서 3D voxel 부피를 로드합니다.

    Parameters
    ----------
    path : str
        .bin 파일 경로 (header 없는 raw binary)
    shape : tuple of int
        3D shape. 본 W1 데이터는 (256, 256, 256).
        → 이 숫자는 \"파일 안에 256×256×256 = 약 1,677만 개 voxel이 일렬로 저장됨\" 을 의미.
    dtype : numpy dtype
        본 W1 데이터는 uint8 (값이 0 또는 1).

    Returns
    -------
    np.ndarray, shape=shape
        3D 배열. volume[z, y, x] 형태로 접근.

    [파라미터 실험]
      shape 인자를 (128,128,128)로 바꾸면 무슨 일이 일어날까요?
      → 에러가 납니다. 왜 그런지 한 번 생각해보세요.
      (힌트: 파일 크기 vs 요구 voxel 수)
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(
            f"데이터 파일을 찾을 수 없습니다: {path}\n"
            f"data/ 폴더에 .bin 파일이 있는지 확인해주세요."
        )
    flat = np.fromfile(path, dtype=dtype)
    expected = int(np.prod(shape))
    if flat.size != expected:
        raise ValueError(
            f"파일 크기 불일치: {flat.size} voxel 읽음, "
            f"shape={shape}는 {expected} voxel 필요. "
            f"shape 또는 dtype을 다시 확인하세요."
        )
    return flat.reshape(shape)


def porosity(binary_volume):
    """
    공극률 (porosity, φ) = (pore voxel 수) / (전체 voxel 수).

    [핵심 직관]
      값이 0 또는 1만 가지므로, 평균을 내면 곧 \"1의 비율\" 입니다.
      예: 100개 voxel 중 22개가 1이면 평균은 0.22 → φ = 22%.
    """
    return float(binary_volume.mean())


# ──────────────────────────────────────────────────────────────
# 시각화 — 학생이 인자만 바꾸면서 결과 차이 관찰
# ──────────────────────────────────────────────────────────────
def show_slice(volume, axis=0, idx=None, cmap='gray', title=''):
    """
    한 슬라이스만 시각화 (가장 단순한 버전).

    Parameters
    ----------
    axis : 0, 1, 2
        0=z방향 (XY 평면), 1=y방향 (ZX 평면), 2=x방향 (ZY 평면)
    idx : int or None
        슬라이스 인덱스. None이면 중앙.
    cmap : str
        색상맵. 'gray', 'hot', 'viridis', 'plasma' 등 시도 가능.

    [파라미터 실험]
      1. axis=0, 1, 2 각각 출력 → 세 방향이 비슷한가, 다른가?
      2. idx=0, 64, 128, 192, 255 비교 → 가장자리와 중앙 차이?
      3. cmap을 'gray' → 'hot' → 'viridis' → 'plasma' 로 바꿔보면 어느 게
         pore를 가장 잘 \"눈에 띄게\" 보여주는가?
    """
    L = volume.shape[axis]
    if idx is None:
        idx = L // 2
    sl = [slice(None)] * 3
    sl[axis] = idx
    img = volume[tuple(sl)]

    plt.figure(figsize=(5, 5))
    plt.imshow(img, cmap=cmap)
    plt.title(title or f'axis={axis}, idx={idx}, cmap={cmap}')
    plt.axis('off')
    plt.tight_layout()


def show_three_axis(volume, z=None, y=None, x=None, title_prefix=''):
    """3축 슬라이스 한 번에 시각화."""
    Z, Y, X = volume.shape
    if z is None: z = Z // 2
    if y is None: y = Y // 2
    if x is None: x = X // 2

    fig, axes = plt.subplots(1, 3, figsize=(11, 4))
    axes[0].imshow(volume[z, :, :]); axes[0].set_title(f'{title_prefix} z={z}')
    axes[1].imshow(volume[:, y, :]); axes[1].set_title(f'{title_prefix} y={y}')
    axes[2].imshow(volume[:, :, x]); axes[2].set_title(f'{title_prefix} x={x}')
    for ax in axes: ax.axis('off')
    plt.tight_layout()
    return fig, axes


def porosity_profile(volume, axis=0, n_slabs=8):
    """
    부피를 axis 방향으로 n_slabs개 슬랩(slab)으로 나누어 각 슬랩의 공극률 계산.

    슬랩(slab)이란? → 부피를 \"한 방향으로 자른 두꺼운 덩어리\".
    예: 256 voxel을 8 slab으로 나누면 한 slab = 32 voxel 두께.

    [파라미터 실험]
      n_slabs를 4, 8, 32로 바꾸면 그래프가 어떻게 달라지나?
      → 작으면 부드럽고 평균적, 크면 세부 변동이 보임.
      어느 쪽이 \"부피가 균일한지\" 판단하기 좋을까요?
    """
    L = volume.shape[axis]
    edges = np.linspace(0, L, n_slabs + 1, dtype=int)
    out = np.zeros(n_slabs, dtype=float)
    for i in range(n_slabs):
        sl = [slice(None)] * 3
        sl[axis] = slice(edges[i], edges[i+1])
        out[i] = volume[tuple(sl)].mean()
    return out


# ──────────────────────────────────────────────────────────────
# Sparse imaging 시뮬레이션
# ──────────────────────────────────────────────────────────────
def make_sparse(volume, k=3, axis=0):
    """
    Sparse imaging 시뮬레이션: axis 방향으로 k개마다 1개만 측정.

    예: k=3, axis=0 → z=0, 3, 6, 9, ... 만 측정. 나머지는 \"복원해야 할 슬라이스\".

    Parameters
    ----------
    k : int
        Sparse 간격. 클수록 측정 슬라이스가 적어짐 (= 스캔 시간 더 절약).
    axis : 0, 1, 2
        어느 축 방향으로 sparse? (보통 z방향 = 0)

    Returns
    -------
    known_idx, missing_idx : np.ndarray
        측정된 / 누락된 슬라이스 인덱스.

    [파라미터 실험]
      k = 1 (전체 측정) → 2 → 3 → 5 → 7 → 10 로 sweep:
        측정 슬라이스 수가 어떻게 줄어드는가?
        측정 시간 절감률(%)은? (수식: (1 - 1/k) × 100)
    """
    L = volume.shape[axis]
    known_idx = np.arange(0, L, k)
    missing_idx = np.setdiff1d(np.arange(L), known_idx)
    return known_idx, missing_idx


def time_saving_ratio(k):
    """Sparse k에서의 시간 절감률 (단위: %)."""
    return (1 - 1.0 / k) * 100


# ──────────────────────────────────────────────────────────────
# 단순 보간 데모 (W2의 맛보기)
# ──────────────────────────────────────────────────────────────
def linear_interpolate_slice(slice_before, slice_after, alpha):
    """
    두 슬라이스 \"사이\" 의 한 장을 단순 평균 비율로 만들어 봅니다.

    공식:
        predicted = (1 − α) × slice_before  +  α × slice_after

    Parameters
    ----------
    slice_before : 2D array, 앞 슬라이스 (α=0 위치)
    slice_after  : 2D array, 뒤 슬라이스 (α=1 위치)
    alpha : float, 0 ≤ α ≤ 1
        0이면 앞 슬라이스, 1이면 뒤 슬라이스, 0.5면 정확히 중간.

    Returns
    -------
    2D array, dtype=float
        보간된 슬라이스. 값이 0~1 사이의 실수.

    [파라미터 실험]
      두 슬라이스의 z 간격이 작으면(예: 1) α=0.5 결과가 거의 원본 같음.
      간격이 크면(예: 30) α=0.5 결과가 \"흐릿\" 해짐 — 왜 그럴까요?

    [핵심 통찰]
      이것이 본 연구의 가장 단순한 baseline (\"Linear interpolation\") 의 핵심 아이디어.
      나중에 deep learning은 이 단순 평균 대신 \"학습된 함수\" 로 가운데를 채웁니다.
    """
    a = slice_before.astype(np.float32)
    b = slice_after.astype(np.float32)
    return (1 - alpha) * a + alpha * b
