"""
Digital Rock 교육 패키지 — 공통 유틸리티 (Group 1: Advanced)

본 모듈은 6주 코스 전체에서 재사용됩니다.
학생은 매번 데이터 로드/시각화 코드를 다시 짜지 않고, 여기 함수만 호출하면 됩니다.

학생이 학습할 핵심 관점:
  "직접 함수를 짜기보다, 이 함수들의 인자(parameter)를 바꾸면
   결과가 어떻게 달라지는지 관찰하고, 그 차이를 해석하는 것이 더 중요합니다."
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

    # 한글 폰트 후보 자동 탐색 (Pretendard 우선)
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
    shape : tuple
        3D shape. 본 W1 데이터는 (256, 256, 256).
    dtype : numpy dtype
        본 W1 데이터는 uint8 (0=solid, 1=pore).

    Returns
    -------
    np.ndarray, shape=shape

    [파라미터 실험]
      이 함수의 `shape` 인자를 잘못 주면 어떻게 될까요? 한 번 (128,128,128)로 시도해보세요.
      → ValueError 가 발생합니다. 왜? (힌트: voxel 개수)
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"파일 없음: {path}")
    flat = np.fromfile(path, dtype=dtype)
    expected = int(np.prod(shape))
    if flat.size != expected:
        raise ValueError(
            f"파일 크기 불일치: {flat.size} voxel 읽음, shape={shape}는 {expected} voxel 필요."
        )
    return flat.reshape(shape)


def porosity(binary_volume):
    """공극률 φ = (pore voxel 수) / (전체 voxel 수). 값이 0/1이므로 mean이 곧 φ."""
    return float(binary_volume.mean())


# ──────────────────────────────────────────────────────────────
# 시각화 — 학생이 인자만 바꾸면서 결과 차이 관찰
# ──────────────────────────────────────────────────────────────
def show_three_axis(volume, z=None, y=None, x=None, title_prefix=''):
    """
    3축 슬라이스 한 번에 시각화.

    Parameters
    ----------
    z, y, x : int or None
        None이면 중앙. 학생이 다양한 값으로 바꿔보며 차이 관찰.

    [파라미터 실험]
      - z=0, z=128, z=255 비교 → 가장자리 vs 중앙 슬라이스 차이?
      - z=128 고정하고 다른 도메인끼리 비교 → 어느 암석이 더 \"빈 공간\"이 많아 보이는가?
    """
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


def porosity_profile(volume, axis=0, n_slabs=16):
    """
    부피를 axis 방향으로 n_slabs개 슬랩으로 나누어 각 슬랩의 공극률 계산.

    Parameters
    ----------
    axis : 0, 1, 2
        0=z방향, 1=y방향, 2=x방향
    n_slabs : int
        몇 등분할지

    Returns
    -------
    np.ndarray, shape (n_slabs,)
        각 슬랩의 공극률.

    [파라미터 실험]
      axis=0, 1, 2 각각에서 계산한 프로파일이 비슷한가? 다르다면 등방성(isotropic)이 깨진 것.
      n_slabs를 4, 16, 64로 바꿔보면 어떤 trade-off가 있는가? (분해능 vs 통계 안정성)
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

    Parameters
    ----------
    volume : np.ndarray, shape (Z, Y, X)
    k : int, slice 간격
    axis : 0=z, 1=y, 2=x

    Returns
    -------
    known_idx, missing_idx : np.ndarray
        측정된 / 누락된 슬라이스의 axis 방향 인덱스.

    [파라미터 실험]
      k = 1, 2, 3, 5, 7, 10 로 바꿔보면 측정 슬라이스 수와 시간 절감률이 어떻게 변하는가?
      axis = 0, 1, 2 로 바꾸면? (이론적으로는 등방성 부피라면 결과가 비슷해야 함)
    """
    L = volume.shape[axis]
    known_idx = np.arange(0, L, k)
    missing_idx = np.setdiff1d(np.arange(L), known_idx)
    return known_idx, missing_idx


# ──────────────────────────────────────────────────────────────
# 가장 단순한 보간 (W2의 맛보기 — 1조용)
# ──────────────────────────────────────────────────────────────
def linear_interpolate_slice(slice_before, slice_after, alpha):
    """
    두 슬라이스 사이를 선형 보간으로 한 장 생성.

    Parameters
    ----------
    slice_before : np.ndarray, 2D
        앞 슬라이스 (alpha=0에 해당)
    slice_after : np.ndarray, 2D
        뒤 슬라이스 (alpha=1에 해당)
    alpha : float, [0, 1]
        보간 위치. 0.5면 중간.

    Returns
    -------
    np.ndarray, 2D, dtype=float
        선형 보간 결과 (0.0 ~ 1.0). 후에 임계 0.5로 이진화 가능.

    [파라미터 실험]
      alpha = 0.0, 0.25, 0.5, 0.75, 1.0 결과를 비교해보세요.
      두 슬라이스가 거의 같다면(연속) 어떤 alpha라도 비슷.
      두 슬라이스가 매우 다르다면(불연속) 보간이 어색해짐 — 어디서 깨지는지 관찰.
    """
    a = slice_before.astype(np.float32)
    b = slice_after.astype(np.float32)
    return (1 - alpha) * a + alpha * b


def reconstruct_sparse_linear(volume, k=3, axis=0):
    """
    Sparse 측정에서 누락된 슬라이스를 모두 선형 보간으로 복원.

    이것이 본 연구의 베이스라인 B1 (Linear interpolation) 의 핵심 아이디어입니다.
    W2에서 scipy 기반 정식 구현을, W3에서 deep learning 버전을 다룹니다.

    Parameters
    ----------
    volume : np.ndarray, shape (Z, Y, X)
        원본 부피 (ground truth).
    k : int, sparse 간격.
    axis : 0=z, 1=y, 2=x.

    Returns
    -------
    np.ndarray, dtype=float
        복원된 부피. 측정된 슬라이스는 원본 그대로,
        누락된 슬라이스는 선형 보간 후 0.5 임계로 이진화.

    [파라미터 실험]
      k=1 (원본 그대로) 부터 k=10 (90% 누락) 까지 sweep 하면서
      복원 후 공극률 오차 |Δφ| 를 plot 해보세요.
      어느 k부터 오차가 급격히 커지는가? 그것이 \"실용 한계 k\" 입니다.
    """
    L = volume.shape[axis]
    known = np.arange(0, L, k)
    recon = np.zeros_like(volume, dtype=np.float32)

    # 측정된 슬라이스는 그대로 복사
    for i in known:
        sl = [slice(None)] * 3
        sl[axis] = i
        recon[tuple(sl)] = volume[tuple(sl)]

    # 누락된 슬라이스는 가장 가까운 두 known 사이를 선형 보간
    for i in range(L):
        if i in known: continue
        # 가장 가까운 known indices (앞, 뒤)
        before = known[known < i].max() if (known < i).any() else known.min()
        after = known[known > i].min() if (known > i).any() else known.max()
        if before == after:
            sl_i = [slice(None)] * 3; sl_i[axis] = i
            sl_b = [slice(None)] * 3; sl_b[axis] = before
            recon[tuple(sl_i)] = volume[tuple(sl_b)]
            continue
        alpha = (i - before) / (after - before)
        sl_b = [slice(None)] * 3; sl_b[axis] = before
        sl_a = [slice(None)] * 3; sl_a[axis] = after
        sl_i = [slice(None)] * 3; sl_i[axis] = i
        interp = linear_interpolate_slice(volume[tuple(sl_b)],
                                           volume[tuple(sl_a)], alpha)
        recon[tuple(sl_i)] = (interp > 0.5).astype(np.float32)

    return recon


def porosity_error(reconstructed, original):
    """|Δφ| = |φ(복원) − φ(원본)|, 본 연구의 핵심 평가 지표."""
    return abs(porosity(reconstructed) - porosity(original))
