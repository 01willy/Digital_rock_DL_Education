"""
Deep Learning helper — UNetMini · SliceDataset · 학습 루프.

CPU/GPU 모두 지원. PRESET 옵션으로 학습 시간 / 모델 크기 trade-off.
"""

import numpy as np
from pathlib import Path

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
# Mini UNet — CPU 학습 가능 크기
# ──────────────────────────────────────────────────────────────
class ConvBlock(nn.Module):
    """Conv → BatchNorm → LeakyReLU 두 번."""
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
    """ConvTranspose → skip concat → ConvBlock."""
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
    Output : (B, 1, H, W) — predicted middle slice (sigmoid)

    Approximate params: base=8 → ~29K, base=16 → ~117K.
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
        e1 = self.e1(x)
        e2 = self.e2(self.pool(e1))
        e3 = self.e3(self.pool(e2))
        d2 = self.d2(e3, e2)
        d1 = self.d1(d2, e1)
        return torch.sigmoid(self.out(d1))


def count_parameters(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


# ──────────────────────────────────────────────────────────────
# Dataset — 이웃 입력 (t±k → 가운데 t)
# ──────────────────────────────────────────────────────────────
class SliceDataset(Dataset):
    """
    이웃 입력 학습 데이터.

    각 sample: (input_2ch, target_1ch)
      input  = [vol[t-k], vol[t+k]]  (양옆 이웃 슬라이스)
      target = vol[t]                (가운데 GT)
    """
    def __init__(self, volume, k=3, patch_size=64, n_patches_per_triplet=4, augment=True):
        self.vol = (volume.astype(np.float32) if volume.max() <= 1
                    else volume.astype(np.float32) / 255.0)
        self.k = k
        self.patch_size = patch_size
        self.n_patches = n_patches_per_triplet
        self.augment = augment
        Z = volume.shape[0]
        # 이웃 거리 k: 슬라이스 t 를 t±k 에서 예측.
        #   input = [vol[t-k], vol[t+k]],  target = vol[t].  (경계는 제외)
        self.triplets = [(t - k, t, t + k) for t in range(k, Z - k)]

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
        x_in = np.stack([sb, sa], axis=0).astype(np.float32)
        y_tg = sm.astype(np.float32)[None]
        return torch.from_numpy(x_in), torch.from_numpy(y_tg)


# ──────────────────────────────────────────────────────────────
# 학습 루프
# ──────────────────────────────────────────────────────────────
def train_one_epoch(model, loader, optimizer, criterion, device='cpu'):
    """1 epoch 학습, 평균 loss 반환."""
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


def evaluate_model(model, volume, k=1, device='cpu'):
    """슬라이스 t 를 [vol[t−k], vol[t+k]] 에서 예측 → 예측 슬라이스 대상 |Δφ|·SSIM."""
    model.eval()
    vol = (volume.astype(np.float32) if volume.max() <= 1
           else volume.astype(np.float32) / 255.0)
    Z = vol.shape[0]
    recon = vol.copy()          # 경계는 GT 유지 (지표에서 제외됨)
    with torch.no_grad():
        for t in range(k, Z - k):
            x = np.stack([vol[t - k], vol[t + k]], axis=0)[None]
            x_t = torch.from_numpy(x).to(device)
            pred = model(x_t).cpu().numpy()[0, 0]
            recon[t] = (pred > 0.5).astype(np.float32)
    from dr_utils import eval_targets
    r = eval_targets(recon, vol, k)
    return {'dphi_pp': r['dphi_pp'], 'ssim': r['ssim'], 'recon': recon}


# ──────────────────────────────────────────────────────────────
# PRESET — 학습 시간 옵션
# ──────────────────────────────────────────────────────────────
TRAINING_PRESETS = {
    'fast':     dict(base=8,  epochs=20,  batch_size=4, patch_size=64, n_patches=2),
    'standard': dict(base=16, epochs=50,  batch_size=4, patch_size=64, n_patches=4),
    'full':     dict(base=16, epochs=100, batch_size=8, patch_size=64, n_patches=8),
}


def train_quick(volume, k=3, preset='fast', device='cpu', verbose=True):
    """한 줄로 mini UNet 학습. PRESET으로 시간/품질 trade-off 선택."""
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


def save_ckpt(model, path, meta=None):
    """모델 + meta 저장."""
    torch.save({'state_dict': model.state_dict(), 'meta': meta or {}}, path)


def load_ckpt(path, in_ch=2, base=16):
    """모델 로드. meta에 base가 있으면 그것을 우선 사용."""
    obj = torch.load(path, map_location='cpu')
    meta = obj.get('meta', {})
    base = meta.get('base', base)
    model = UNetMini(in_ch=in_ch, base=base)
    model.load_state_dict(obj['state_dict'])
    model.eval()
    return model, meta
