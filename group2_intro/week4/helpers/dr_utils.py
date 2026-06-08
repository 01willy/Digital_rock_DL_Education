"""
Digital Rock 교육 코스 — 공통 유틸리티

데이터 I/O · 전처리 · 보간 · 평가 지표.
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from pathlib import Path

ORANGE = '#EA851B'
NAVY   = '#1F3A5F'
GREEN  = '#2E8B57'
RED    = '#C83A3A'
GRAY   = '#7A7A7A'


def setup_plot_style():
    """matplotlib 기본 스타일 — Pretendard / NanumGothic 등 한글 폰트 자동 등록."""
    font_search_dirs = [
        os.path.expanduser('~/.fonts'),
        '/usr/share/fonts',
        os.path.expanduser('~/Library/Fonts'),
        'C:\\Windows\\Fonts',
    ]
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


def load_volume(path, shape=(256, 256, 256), dtype=np.uint8):
    """Binary 파일을 3D voxel 부피로 로드."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"파일 없음: {path}")
    flat = np.fromfile(path, dtype=dtype)
    expected = int(np.prod(shape))
    if flat.size != expected:
        raise ValueError(f"파일 크기 불일치: {flat.size} voxel 읽음, shape={shape}는 {expected} 필요.")
    return flat.reshape(shape)


def porosity(binary_volume):
    """공극률 φ = (pore voxel 수) / (전체 voxel 수)."""
    return float(binary_volume.mean())


def normalize_to_float(vol, dtype=np.float32):
    """uint8 → float [0.0, 1.0] 정규화."""
    vol = vol.astype(dtype)
    if vol.max() > 1.0:
        vol = vol / 255.0
    return vol


def otsu_threshold(grayscale_slice):
    """Otsu 알고리즘 — 클래스 간 분산 최대화 임계값."""
    g = grayscale_slice.ravel()
    hist, edges = np.histogram(g, bins=256, range=(g.min(), g.max() + 1e-9))
    total = hist.sum()
    sum_total = (hist * (edges[:-1] + edges[1:]) / 2).sum()
    w0 = 0.0
    sum0 = 0.0
    best_var = -1.0
    best_t = (edges[0] + edges[-1]) / 2
    for i in range(len(hist)):
        w0 += hist[i]
        if w0 == 0:
            continue
        w1 = total - w0
        if w1 == 0:
            break
        sum0 += hist[i] * (edges[i] + edges[i + 1]) / 2
        m0 = sum0 / w0
        m1 = (sum_total - sum0) / w1
        var_between = w0 * w1 * (m0 - m1) ** 2
        if var_between > best_var:
            best_var = var_between
            best_t = (edges[i] + edges[i + 1]) / 2
    return float(best_t)


def binarize_otsu(slice_or_vol):
    """Otsu 임계값으로 이진화. (binary, threshold) 반환."""
    t = otsu_threshold(slice_or_vol)
    return (slice_or_vol > t).astype(np.uint8), t


def show_slice(volume, axis=0, idx=None, cmap='gray', title=''):
    """한 슬라이스만 시각화."""
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
    """세 축 중앙 슬라이스를 한 그림에 표시."""
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
    """부피를 axis 방향으로 n_slabs개 슬랩으로 나누어 슬랩별 공극률 반환."""
    L = volume.shape[axis]
    edges = np.linspace(0, L, n_slabs + 1, dtype=int)
    out = np.zeros(n_slabs, dtype=float)
    for i in range(n_slabs):
        sl = [slice(None)] * 3
        sl[axis] = slice(edges[i], edges[i + 1])
        out[i] = volume[tuple(sl)].mean()
    return out


def make_sparse(volume, k=3, axis=0):
    """Sparse 시뮬레이션 — axis 방향 k개마다 1개 측정."""
    L = volume.shape[axis]
    known_idx = np.arange(0, L, k)
    missing_idx = np.setdiff1d(np.arange(L), known_idx)
    return known_idx, missing_idx


def time_saving_ratio(k):
    """Sparse k에서의 시간 절감률 (%)."""
    return (1 - 1.0 / k) * 100


def linear_interpolate_slice(slice_before, slice_after, alpha):
    """선형 보간: (1-α)·before + α·after."""
    a = slice_before.astype(np.float32)
    b = slice_after.astype(np.float32)
    return (1 - alpha) * a + alpha * b


def reconstruct_sparse_linear(volume, k=3, axis=0):
    """Sparse 측정 후 누락 슬라이스를 모두 선형 보간으로 복원."""
    L = volume.shape[axis]
    known = np.arange(0, L, k)
    recon = np.zeros_like(volume, dtype=np.float32)
    for i in known:
        sl = [slice(None)] * 3; sl[axis] = i
        recon[tuple(sl)] = volume[tuple(sl)]
    for i in range(L):
        if i in known:
            continue
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


def reconstruct_sparse_cubic(volume, k=3, axis=0):
    """scipy cubic spline 보간으로 sparse 부피 복원."""
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


def porosity_error(reconstructed, original):
    """|Δφ| = |φ(복원) − φ(원본)|."""
    return abs(porosity(reconstructed) - porosity(original))


def ssim_2d(img1, img2, data_range=1.0):
    """2D SSIM (Wang 2004, gaussian σ=1.5)."""
    from scipy.ndimage import gaussian_filter
    a = img1.astype(np.float32); b = img2.astype(np.float32)
    C1 = (0.01 * data_range) ** 2
    C2 = (0.03 * data_range) ** 2
    mu1 = gaussian_filter(a, 1.5)
    mu2 = gaussian_filter(b, 1.5)
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
    """6-연결 voxel 표면적."""
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
    """주요 3개 지표 출력 + dict 반환."""
    dphi = porosity_error(reconstructed, original) * 100
    dsa = surface_area_error(reconstructed, original)
    ssim = ssim_3d_mean(reconstructed, original)
    print(f'  {label:12s}  |Δφ|={dphi:5.2f}%p   |ΔSA|={dsa:6.1f}/Mvox   SSIM={ssim:.4f}')
    return dict(dphi=dphi, dsa=dsa, ssim=ssim)
