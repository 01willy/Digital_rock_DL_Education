"""
Digital Rock 교육 패키지 — 공통 유틸리티 (Group 2: Intro)
W1 강화판 (2026-06-05): 데이터 전처리 + Classical baseline 통합

학생 학습 원칙:
  "이 함수들의 인자(parameter)를 바꾸면서 결과가 어떻게 달라지는지
   관찰하고, 그 차이를 자신의 말로 해석한다."

본 모듈은 6주 코스 전체에서 누적 확장. W1 신규:
  - 데이터 전처리: normalize_to_float, otsu_threshold, binarize_otsu
  - Classical baseline (scipy): reconstruct_sparse_cubic
  - 평가 지표: ssim_2d, surface_area_error
"""

import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

ORANGE = '#EA851B'
NAVY = '#1F3A5F'
GREEN = '#2E8B57'
RED = '#C83A3A'
GRAY = '#7A7A7A'


def setup_plot_style():
    """matplotlib 기본 스타일 — Pretendard 자동 등록 포함."""
    import os
    import matplotlib.font_manager as fm

    font_search_dirs = [os.path.expanduser('~/.fonts'), '/usr/share/fonts',
                        os.path.expanduser('~/Library/Fonts'), 'C:\\Windows\\Fonts']
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
        'figure.dpi': 110, 'font.family': chosen, 'font.size': 11,
        'axes.titlesize': 13, 'axes.titleweight': 'bold', 'axes.labelsize': 11,
        'axes.spines.top': False, 'axes.spines.right': False,
        'image.cmap': 'gray', 'axes.unicode_minus': False,
    })


# ──────────────────────────────────────────────────────────────
# 1. 데이터 I/O
# ──────────────────────────────────────────────────────────────
def load_volume(path, shape=(256, 256, 256), dtype=np.uint8):
    """Binary 파일에서 3D voxel 부피 로드.

    [보조 설명] shape는 \"파일 안에 256×256×256 = 약 1,677만 voxel이 일렬로 저장됨\" 을 의미.
    [파라미터 실험] shape=(128,128,128) 로 주면 에러. 왜?
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"데이터 파일을 찾을 수 없습니다: {path}")
    flat = np.fromfile(path, dtype=dtype)
    expected = int(np.prod(shape))
    if flat.size != expected:
        raise ValueError(f"파일 크기 불일치: {flat.size} voxel 읽음, shape={shape}는 {expected} 필요.")
    return flat.reshape(shape)


def porosity(binary_volume):
    """공극률 φ = (pore voxel 수) / (전체). 0/1 binary이므로 평균 = φ."""
    return float(binary_volume.mean())


# ──────────────────────────────────────────────────────────────
# 2. 데이터 전처리 (W1 NEW)
# ──────────────────────────────────────────────────────────────
def normalize_to_float(vol, dtype=np.float32):
    """uint8 → float32 [0.0, 1.0] 정규화.

    [왜 필요한가] Deep learning 모델은 보통 [0, 1] 범위 float 입력을 가정.
    [보조 설명] uint8은 0~255, [0,1] 사이로 줄이면 학습 안정성이 좋아집니다.
    """
    vol = vol.astype(dtype)
    if vol.max() > 1.0:
        vol = vol / 255.0
    return vol


def otsu_threshold(grayscale_slice):
    """Otsu's method로 자동 임계값 선택. 본 binary 데이터는 trivial 결과(0.5).

    [보조 설명] Otsu는 \"두 봉우리 사이 골짜기를 자동으로 찾는\" 고전 알고리즘.
    Grayscale CT 영상에서 \"공극 vs 암석\" 경계를 자동으로 찾을 때 표준으로 씁니다.
    W4 grayscale 원본에서 의미가 살아남.
    """
    g = grayscale_slice.ravel()
    hist, edges = np.histogram(g, bins=256, range=(g.min(), g.max() + 1e-9))
    total = hist.sum()
    sum_total = (hist * (edges[:-1] + edges[1:]) / 2).sum()
    w0 = sum0 = 0.0
    best_var = -1.0
    best_t = (edges[0] + edges[-1]) / 2
    for i in range(len(hist)):
        w0 += hist[i]
        if w0 == 0: continue
        w1 = total - w0
        if w1 == 0: break
        sum0 += hist[i] * (edges[i] + edges[i + 1]) / 2
        m0 = sum0 / w0
        m1 = (sum_total - sum0) / w1
        var_between = w0 * w1 * (m0 - m1) ** 2
        if var_between > best_var:
            best_var = var_between
            best_t = (edges[i] + edges[i + 1]) / 2
    return float(best_t)


def binarize_otsu(slice_or_vol):
    """Otsu 임계값으로 자동 이진화."""
    t = otsu_threshold(slice_or_vol)
    return (slice_or_vol > t).astype(np.uint8), t


# ──────────────────────────────────────────────────────────────
# 3. 시각화 — 학생이 인자만 바꾸면서 결과 차이 관찰
# ──────────────────────────────────────────────────────────────
def show_slice(volume, axis=0, idx=None, cmap='gray', title=''):
    """한 슬라이스만 시각화 (가장 단순한 버전).

    [파라미터 실험]
      axis (0/1/2), idx (0~255), cmap ('gray','hot','viridis','plasma') 자유롭게 변경.
    """
    L = volume.shape[axis]
    if idx is None: idx = L // 2
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
    """부피를 axis 방향으로 n_slabs개 슬랩으로 나누어 각 슬랩의 공극률.

    [보조 설명] slab = 부피를 한 방향으로 자른 두꺼운 덩어리.
    """
    L = volume.shape[axis]
    edges = np.linspace(0, L, n_slabs + 1, dtype=int)
    out = np.zeros(n_slabs, dtype=float)
    for i in range(n_slabs):
        sl = [slice(None)] * 3
        sl[axis] = slice(edges[i], edges[i + 1])
        out[i] = volume[tuple(sl)].mean()
    return out


# ──────────────────────────────────────────────────────────────
# 4. Sparse imaging
# ──────────────────────────────────────────────────────────────
def make_sparse(volume, k=3, axis=0):
    """Sparse imaging 시뮬레이션: axis 방향 k개마다 1개 측정."""
    L = volume.shape[axis]
    known_idx = np.arange(0, L, k)
    missing_idx = np.setdiff1d(np.arange(L), known_idx)
    return known_idx, missing_idx


def time_saving_ratio(k):
    """Sparse k에서 측정 시간 절감률 (%)."""
    return (1 - 1.0 / k) * 100


# ──────────────────────────────────────────────────────────────
# 5. Linear interpolation (W1 baseline B1)
# ──────────────────────────────────────────────────────────────
def linear_interpolate_slice(slice_before, slice_after, alpha):
    """가장 단순한 보간: predicted = (1 − α) × before + α × after."""
    a = slice_before.astype(np.float32)
    b = slice_after.astype(np.float32)
    return (1 - alpha) * a + alpha * b


def reconstruct_sparse_linear(volume, k=3, axis=0):
    """Sparse 측정에서 누락 슬라이스를 모두 선형 보간으로 복원 → B1 (Linear)."""
    L = volume.shape[axis]
    known = np.arange(0, L, k)
    recon = np.zeros_like(volume, dtype=np.float32)
    for i in known:
        sl = [slice(None)] * 3; sl[axis] = i
        recon[tuple(sl)] = volume[tuple(sl)]
    for i in range(L):
        if i in known: continue
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
        interp = linear_interpolate_slice(volume[tuple(sl_b)], volume[tuple(sl_a)], alpha)
        recon[tuple(sl_i)] = (interp > 0.5).astype(np.float32)
    return recon


# ──────────────────────────────────────────────────────────────
# 6. Cubic interpolation (W1 NEW — B2)
# ──────────────────────────────────────────────────────────────
def reconstruct_sparse_cubic(volume, k=3, axis=0):
    """Cubic spline 보간으로 sparse 부피 복원. scipy 사용 → B2.

    [Linear vs Cubic]
      - Linear: 직선으로 두 점 연결 (단순)
      - Cubic: 4 점을 통과하는 부드러운 곡선 (3차 함수)
    [보조 설명] scipy.interpolate.interp1d 의 kind='cubic' 사용.
    """
    from scipy.interpolate import interp1d
    L = volume.shape[axis]
    known = np.arange(0, L, k)
    vol_t = np.moveaxis(volume, axis, 0).astype(np.float32)
    known_data = vol_t[known]
    f = interp1d(known, known_data, axis=0, kind='cubic',
                 bounds_error=False, fill_value='extrapolate')
    recon_t = f(np.arange(L))
    recon_t = (recon_t > 0.5).astype(np.float32)
    return np.moveaxis(recon_t, 0, axis)


# ──────────────────────────────────────────────────────────────
# 7. 평가 지표 (W1 NEW)
# ──────────────────────────────────────────────────────────────
def porosity_error(reconstructed, original):
    """|Δφ| = |φ(복원) − φ(원본)|."""
    return abs(porosity(reconstructed) - porosity(original))


def ssim_2d(img1, img2, data_range=1.0):
    """2D SSIM — 학생 학습용 minimal 구현 (W4에서 정식 SSIM과 비교).

    [보조 설명] SSIM은 \"구조적 유사도\" — 픽셀 값뿐 아니라 모양/대비도 비교.
    값 0~1, 1에 가까울수록 비슷.
    """
    from scipy.ndimage import gaussian_filter
    a = img1.astype(np.float32); b = img2.astype(np.float32)
    C1 = (0.01 * data_range) ** 2
    C2 = (0.03 * data_range) ** 2
    mu1 = gaussian_filter(a, 1.5); mu2 = gaussian_filter(b, 1.5)
    mu1_sq, mu2_sq = mu1 ** 2, mu2 ** 2
    sigma1_sq = gaussian_filter(a * a, 1.5) - mu1_sq
    sigma2_sq = gaussian_filter(b * b, 1.5) - mu2_sq
    sigma12 = gaussian_filter(a * b, 1.5) - mu1 * mu2
    num = (2 * mu1 * mu2 + C1) * (2 * sigma12 + C2)
    den = (mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2)
    return float((num / den).mean())


def ssim_3d_mean(recon, original):
    """3D 부피의 z-slice별 SSIM 평균."""
    Z = recon.shape[0]
    return float(np.mean([ssim_2d(recon[z], original[z]) for z in range(Z)]))


def surface_area_voxel(binary_volume):
    """6-연결 voxel surface area. 값이 다른 인접 voxel 사이의 면 개수."""
    v = binary_volume.astype(np.int8)
    sa = 0
    for ax in range(3):
        diff = np.diff(v, axis=ax)
        sa += int((diff != 0).sum())
    return sa


def surface_area_error(reconstructed, original):
    """|ΔSA| = |SA(복원) − SA(원본)|, per megavoxel."""
    sa_r = surface_area_voxel(reconstructed > 0.5)
    sa_o = surface_area_voxel(original > 0.5)
    N = original.size / 1e6
    return abs(sa_r - sa_o) / N


def summarize_metrics(reconstructed, original, label=''):
    """주요 3 metric 한 번에."""
    dphi = porosity_error(reconstructed, original) * 100
    dsa = surface_area_error(reconstructed, original)
    ssim = ssim_3d_mean(reconstructed, original)
    print(f'  {label:12s}  |Δφ|={dphi:5.2f}%p   |ΔSA|={dsa:6.1f}/Mvox   SSIM={ssim:.4f}')
    return dict(dphi=dphi, dsa=dsa, ssim=ssim)
