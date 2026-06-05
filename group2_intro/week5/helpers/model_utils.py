"""
Week 2 — Deep Learning helper (Group 1 Advanced)

Mini UNet skeleton + Dataset + Training loop.
CPU-friendly (학생 노트북 환경 가정).

학생 학습 관점:
  "모델은 우리가 배포. 너희는 base_channels / epoch / batch_size 등
   파라미터를 바꾸며 학습 결과 차이를 관찰하라."
"""

import numpy as np
from pathlib import Path

# Import torch lazily — 학생이 W1만 해도 W1 notebook 작동 가능
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torch.utils.data import Dataset, DataLoader
    TORCH_OK = True
except ImportError:
    TORCH_OK = False
    print('[model_utils] torch not installed. Run: pip install torch torchvision')


# ──────────────────────────────────────────────────────────────
# Mini UNet — 학생용 (CPU 학습 가능 크기)
# ──────────────────────────────────────────────────────────────
class ConvBlock(nn.Module):
    """Conv → BatchNorm → LeakyReLU × 2."""
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.LeakyReLU(0.1, inplace=True),
        )
    def forward(self, x):
        return self.conv(x)


class UpBlock(nn.Module):
    """Upsample → concat skip → ConvBlock."""
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.up = nn.ConvTranspose2d(in_ch, out_ch, 2, stride=2)
        self.conv = ConvBlock(out_ch * 2, out_ch)
    def forward(self, x, skip):
        x = self.up(x)
        x = torch.cat([x, skip], dim=1)
        return self.conv(x)


class UNetMini(nn.Module):
    """
    Mini UNet for slice interpolation.

    Input  : (B, 2, H, W) — [slice_before, slice_after]
    Output : (B, 1, H, W) — predicted middle slice (sigmoid → [0,1])

    Params 추정 (base=16): ~98K
    Params 추정 (base=8) : ~25K
    Params 추정 (base=32): ~390K

    [파라미터 실험]
      base를 8/16/32로 바꾸면 학습 시간 vs 정확도 trade-off 관찰 가능.
    """
    def __init__(self, in_ch=2, base=16):
        super().__init__()
        self.e1 = ConvBlock(in_ch, base)
        self.e2 = ConvBlock(base, base * 2)
        self.e3 = ConvBlock(base * 2, base * 4)
        self.d2 = UpBlock(base * 4, base * 2)
        self.d1 = UpBlock(base * 2, base)
        self.out = nn.Conv2d(base, 1, 1)
        self.pool = nn.MaxPool2d(2)

    def forward(self, x):
        e1 = self.e1(x)              # (B, base, H, W)
        e2 = self.e2(self.pool(e1))  # (B, 2b, H/2, W/2)
        e3 = self.e3(self.pool(e2))  # (B, 4b, H/4, W/4)
        d2 = self.d2(e3, e2)         # (B, 2b, H/2, W/2)
        d1 = self.d1(d2, e1)         # (B, base, H, W)
        return torch.sigmoid(self.out(d1))


def count_parameters(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


# ──────────────────────────────────────────────────────────────
# Dataset — slice triplets (before, after, middle)
# ──────────────────────────────────────────────────────────────
class SliceDataset(Dataset):
    """
    Sparse triplet dataset.

    각 sample: (input_2ch, target_1ch)
      input  = [slice_before, slice_after] (앞/뒤 known)
      target = slice_middle (정답, 학습 시에만)

    Parameters
    ----------
    volume : np.ndarray (Z, Y, X), 0/1 uint8 or float
    k : int, 슬라이스 간격 (default 3)
    patch_size : int, 작은 patch 크기 (학습 가속, None이면 전체)
    n_patches_per_triplet : int, 한 triplet에서 뽑을 random patch 수
    augment : bool, flip 증강 사용

    [파라미터 실험]
      - patch_size=64 vs 128 vs 256 : 학습 시간 4배 차이
      - n_patches_per_triplet=1 vs 8 : dataset 크기 늘림
      - augment True/False : 일반화 성능 차이
    """
    def __init__(self, volume, k=3, patch_size=64, n_patches_per_triplet=4, augment=True):
        self.vol = (volume.astype(np.float32) if volume.max() <= 1
                    else volume.astype(np.float32) / 255.0)
        self.k = k
        self.patch_size = patch_size
        self.n_patches = n_patches_per_triplet
        self.augment = augment
        # Triplets: 모든 (z-k, z, z+k) 쌍에서 z는 측정되지 않은 슬라이스
        # k=3: known z=0,3,6,...; middle z=1,2,4,5,7,8,...
        Z = volume.shape[0]
        self.triplets = []
        for z in range(Z):
            if z % k == 0:  # known, skip as middle
                continue
            before = z - (z % k)
            after = min(before + k, Z - 1)
            if before == after:
                continue
            self.triplets.append((before, z, after))

    def __len__(self):
        return len(self.triplets) * self.n_patches

    def __getitem__(self, idx):
        tri_idx = idx // self.n_patches
        before, mid, after = self.triplets[tri_idx]
        H, W = self.vol.shape[1:]
        if self.patch_size is None:
            sb = self.vol[before]; sa = self.vol[after]; sm = self.vol[mid]
        else:
            ps = self.patch_size
            y = np.random.randint(0, H - ps + 1)
            x = np.random.randint(0, W - ps + 1)
            sb = self.vol[before, y:y+ps, x:x+ps]
            sa = self.vol[after,  y:y+ps, x:x+ps]
            sm = self.vol[mid,    y:y+ps, x:x+ps]
        if self.augment:
            if np.random.rand() < 0.5:
                sb, sa, sm = sb[::-1].copy(), sa[::-1].copy(), sm[::-1].copy()
            if np.random.rand() < 0.5:
                sb, sa, sm = sb[:, ::-1].copy(), sa[:, ::-1].copy(), sm[:, ::-1].copy()
        x_in = np.stack([sb, sa], axis=0).astype(np.float32)  # (2, H, W)
        y_tg = sm.astype(np.float32)[None]                     # (1, H, W)
        return torch.from_numpy(x_in), torch.from_numpy(y_tg)


# ──────────────────────────────────────────────────────────────
# Training loop — CPU friendly
# ──────────────────────────────────────────────────────────────
def train_one_epoch(model, loader, optimizer, criterion, device='cpu'):
    """1 epoch 학습. 평균 loss 반환."""
    model.train()
    total = 0.0
    n = 0
    for x, y in loader:
        x = x.to(device); y = y.to(device)
        optimizer.zero_grad()
        pred = model(x)
        loss = criterion(pred, y)
        loss.backward()
        optimizer.step()
        total += loss.item() * x.size(0)
        n += x.size(0)
    return total / n


def evaluate_model(model, volume, k=3, device='cpu'):
    """전체 부피의 누락 슬라이스를 모델로 복원 → |Δφ|, SSIM 측정."""
    model.eval()
    vol = (volume.astype(np.float32) if volume.max() <= 1
           else volume.astype(np.float32) / 255.0)
    Z = vol.shape[0]
    recon = np.zeros_like(vol)
    for z in range(0, Z, k):
        recon[z] = vol[z]
    with torch.no_grad():
        for z in range(Z):
            if z % k == 0:
                continue
            before = z - (z % k)
            after = min(before + k, Z - 1)
            x = np.stack([vol[before], vol[after]], axis=0)[None]  # (1,2,H,W)
            x_t = torch.from_numpy(x).to(device)
            pred = model(x_t).cpu().numpy()[0, 0]
            recon[z] = (pred > 0.5).astype(np.float32)
    # metrics
    from dr_utils import porosity_error, ssim_3d_mean
    return {
        'dphi_pp': porosity_error(recon, vol) * 100,
        'ssim': ssim_3d_mean(recon, vol),
        'recon': recon,
    }


# ──────────────────────────────────────────────────────────────
# Quick training presets — 10/30/60min on CPU
# ──────────────────────────────────────────────────────────────
TRAINING_PRESETS = {
    'fast':     dict(base=8,  epochs=20, batch_size=4,  patch_size=64, n_patches=2),
    'standard': dict(base=16, epochs=50, batch_size=4,  patch_size=64, n_patches=4),
    'full':     dict(base=16, epochs=100, batch_size=8, patch_size=64, n_patches=8),
}
# 예상 시간 (CPU, BB 256³ k=3 ~170 missing slices):
#   fast     : ~10분, ~25K params
#   standard : ~30분, ~98K params
#   full     : ~60분, ~98K params (더 많은 epoch, 더 큰 batch)


def train_quick(volume, k=3, preset='fast', device='cpu', verbose=True):
    """
    한 줄로 mini UNet 학습. preset 인자로 시간/품질 trade-off.

    Returns
    -------
    model, history (list of per-epoch losses)
    """
    p = TRAINING_PRESETS[preset]
    if verbose:
        print(f'[train_quick] preset={preset}: {p}')
    ds = SliceDataset(volume, k=k, patch_size=p['patch_size'],
                      n_patches_per_triplet=p['n_patches'], augment=True)
    loader = DataLoader(ds, batch_size=p['batch_size'], shuffle=True, num_workers=0)
    model = UNetMini(in_ch=2, base=p['base']).to(device)
    if verbose:
        print(f'  params: {count_parameters(model):,}')
        print(f'  dataset size: {len(ds)} samples')
    criterion = nn.L1Loss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    history = []
    for ep in range(p['epochs']):
        loss = train_one_epoch(model, loader, optimizer, criterion, device=device)
        history.append(loss)
        if verbose and (ep + 1) % max(1, p['epochs'] // 10) == 0:
            print(f'  epoch {ep+1:3d}/{p["epochs"]}  loss={loss:.4f}')
    return model, history


# ──────────────────────────────────────────────────────────────
# Save / Load
# ──────────────────────────────────────────────────────────────
def save_ckpt(model, path, meta=None):
    """모델 + meta(파라미터, epoch 등) 저장."""
    torch.save({'state_dict': model.state_dict(), 'meta': meta or {}}, path)


def load_ckpt(path, in_ch=2, base=16):
    """모델 로드. base 채널 수를 알아야 함 (또는 meta에서 추론)."""
    obj = torch.load(path, map_location='cpu')
    meta = obj.get('meta', {})
    base = meta.get('base', base)
    model = UNetMini(in_ch=in_ch, base=base)
    model.load_state_dict(obj['state_dict'])
    model.eval()
    return model, meta
