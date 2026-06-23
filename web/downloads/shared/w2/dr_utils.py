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


def linear_interpolate_slice(slice_before, slice_after, alpha):
    """선형 보간: (1-α)·before + α·after."""
    a = slice_before.astype(np.float32)
    b = slice_after.astype(np.float32)
    return (1 - alpha) * a + alpha * b


# ──────────────────────────────────────────────────────────────
# 슬라이스 보간 — 이웃 거리 k
#   슬라이스 t 를 양옆 이웃 t−k, t+k 로 예측. k 가 클수록 먼 이웃 → 더 어려움.
# ──────────────────────────────────────────────────────────────
def neighbor_targets(L, k):
    """예측 대상 슬라이스 인덱스 = [k, L−k). (경계는 이웃이 없어 제외)"""
    return list(range(k, L - k))


def predict_linear_k(volume, k):
    """B1 Linear: 슬라이스 t 를 t±k 가운데로 예측.
       recon[t] = ( 0.5·(vol[t−k] + vol[t+k]) > 0.5 ),  t ∈ [k, Z−k). 경계는 원본 유지."""
    vol = volume.astype(np.float32)
    if vol.max() > 1:
        vol = vol / 255.0
    recon = vol.copy()
    Z = vol.shape[0]
    for t in range(k, Z - k):
        recon[t] = (0.5 * (vol[t - k] + vol[t + k]) > 0.5).astype(np.float32)
    return recon


def predict_cubic_k(volume, k):
    """B2 Cubic: 4-knot cubic at z = t±k, t±3k. (경계는 linear 사용)"""
    from scipy.interpolate import CubicSpline
    vol = volume.astype(np.float32)
    if vol.max() > 1:
        vol = vol / 255.0
    recon = vol.copy()
    Z = vol.shape[0]
    for t in range(k, Z - k):
        xs = [t - 3 * k, t - k, t + k, t + 3 * k]
        if xs[0] < 0 or xs[-1] >= Z:                       # 경계 → linear fallback
            recon[t] = (0.5 * (vol[t - k] + vol[t + k]) > 0.5).astype(np.float32)
            continue
        stack = np.stack([vol[x] for x in xs], axis=0)
        cs = CubicSpline(xs, stack, axis=0)
        recon[t] = (np.clip(cs(t), 0, 1) > 0.5).astype(np.float32)
    return recon


def eval_targets(recon, original, k):
    """예측한 슬라이스(t ∈ [k, Z−k)) 만 대상으로 평가.
       |Δφ| = 슬라이스별 |φ(pred) − φ(GT)| 평균 (%p),  SSIM = 슬라이스별 평균."""
    Z = original.shape[0]
    tgt = neighbor_targets(Z, k)
    dphi = float(np.mean([abs(recon[t].mean() - original[t].mean()) for t in tgt])) * 100
    ssim = float(np.mean([ssim_2d(recon[t], original[t]) for t in tgt]))
    return {'dphi_pp': dphi, 'ssim': ssim, 'n_targets': len(tgt)}


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
