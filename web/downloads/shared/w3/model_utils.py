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


# ══════════════════════════════════════════════════════════════
#  W3 — 적대적 학습 (pix2pix GAN)
#
#  W2의 UNetMini(=Generator) 는 그대로 두고, 두 번째 신경망
#  '판별자(Discriminator)' 를 붙여 서로 경쟁시킵니다.
#    · Generator  : 이웃 슬라이스 → 가운데 슬라이스 (진짜처럼 보이게)
#    · Discriminator : 이 슬라이스가 '진짜 암석 단면인가'를 판정
#  총 G 손실 = w_l1·L1 + w_ssim·SSIM + λ_gan·adversarial
# ══════════════════════════════════════════════════════════════
from torch.nn.utils import spectral_norm as _sn


# ──────────────────────────────────────────────────────────────
#  조건부 PatchGAN 판별자 (+ spectral normalization)
# ──────────────────────────────────────────────────────────────
class PatchDiscriminatorMini(nn.Module):
    """
    조건부(conditional) PatchGAN 판별자.

    입력 : cond(앞·뒤 슬라이스 2ch) + 판정 대상 슬라이스(1ch) = 3ch
    출력 : (B, 1, h, w) — 이미지 전체가 아니라 '국소 patch'마다 진위 점수 map

    · PatchGAN   : 전체가 아닌 겹치는 조각(patch)마다 진짜/가짜를 매김
                   → 국소 pore 텍스처·경계 선명도에 집중.
    · conditional: 이웃 슬라이스(cond)를 함께 봐서 '사실적이면서 이웃과 일관'
                   된 슬라이스인지 판정 (그럴듯한 오답에 안 속음).
    · spectral norm: 판별자의 '힘(Lipschitz 상수)'에 상한을 둬 학습 안정화.

    점수 map 에 sigmoid 를 두지 않음 → hinge loss 에서 raw logit 을 그대로 사용.
    """
    def __init__(self, cond_ch: int = 2, base: int = 32):
        super().__init__()
        b = base
        self.net = nn.Sequential(
            _sn(nn.Conv2d(cond_ch + 1, b, 4, 2, 1)), nn.LeakyReLU(0.2, inplace=True),
            _sn(nn.Conv2d(b, b * 2, 4, 2, 1)),       nn.LeakyReLU(0.2, inplace=True),
            _sn(nn.Conv2d(b * 2, b * 4, 4, 2, 1)),   nn.LeakyReLU(0.2, inplace=True),
            _sn(nn.Conv2d(b * 4, 1, 4, 1, 1)),       # patch score map (logit)
        )

    def forward(self, cond, y):
        return self.net(torch.cat([cond, y], dim=1))


# ──────────────────────────────────────────────────────────────
#  손실 — hinge GAN + 미분가능 SSIM (외부 패키지 불필요)
# ──────────────────────────────────────────────────────────────
def _gauss_window(win=11, sigma=1.5, device='cpu'):
    coords = torch.arange(win, dtype=torch.float32, device=device) - win // 2
    g = torch.exp(-(coords ** 2) / (2 * sigma ** 2))
    g = (g / g.sum())
    return (g[:, None] * g[None, :])[None, None]   # (1,1,win,win)


def ssim_loss(pred, target, win=11, data_range=1.0):
    """
    미분가능 SSIM 손실 = 1 − SSIM.  (Gaussian window, 외부 의존성 없음)
    구조 유사도가 높을수록 손실↓. L1/L2 와 달리 '모양의 유사성'을 본다.
    """
    device = pred.device
    w = _gauss_window(win, device=device)
    C1 = (0.01 * data_range) ** 2
    C2 = (0.03 * data_range) ** 2
    mu1 = F.conv2d(pred, w, padding=win // 2)
    mu2 = F.conv2d(target, w, padding=win // 2)
    mu1_sq, mu2_sq, mu12 = mu1 * mu1, mu2 * mu2, mu1 * mu2
    s1 = F.conv2d(pred * pred, w, padding=win // 2) - mu1_sq
    s2 = F.conv2d(target * target, w, padding=win // 2) - mu2_sq
    s12 = F.conv2d(pred * target, w, padding=win // 2) - mu12
    ssim_map = ((2 * mu12 + C1) * (2 * s12 + C2)) / \
               ((mu1_sq + mu2_sq + C1) * (s1 + s2 + C2))
    return 1.0 - ssim_map.mean()


def d_hinge_loss(D, cond, y_real, y_fake):
    """판별자 hinge 손실:  relu(1 − D(real)) + relu(1 + D(fake)).
    진짜는 점수를 +1 이상, 가짜는 −1 이하로 밀어내려 한다."""
    real = D(cond, y_real)
    fake = D(cond, y_fake.detach())          # G 로 gradient 안 흐르게 detach
    return F.relu(1.0 - real).mean() + F.relu(1.0 + fake).mean()


def g_hinge_loss(D, cond, y_fake):
    """생성자 adversarial 손실:  −D(fake).  판별자 점수를 높이려(=속이려) 한다."""
    return -D(cond, y_fake).mean()


# ──────────────────────────────────────────────────────────────
#  적대적 학습 PRESET
# ──────────────────────────────────────────────────────────────
GAN_PRESETS = {
    # base: G 폭 · d_base: D 폭 · warmup: adversarial 도입 전 재구성만 학습할 epoch 수
    'fast':     dict(base=8,  d_base=32, epochs=30, batch_size=8, patch_size=64, n_patches=2, warmup=8),
    'standard': dict(base=16, d_base=48, epochs=60, batch_size=8, patch_size=64, n_patches=4, warmup=12),
}


def predict_continuous(model, before, after, device='cpu'):
    """threshold(0.5) 전 '연속 확률 출력'(0~1) 을 반환.
    L1 흐림(회색 경계) vs GAN 선명(이진에 가까움) 을 눈으로 비교할 때 사용."""
    model.eval()
    x = np.stack([before, after], axis=0)[None].astype(np.float32)
    with torch.no_grad():
        return model(torch.from_numpy(x).to(device)).cpu().numpy()[0, 0]


def train_gan(volume, k=1, preset='fast', generator=None, device='cpu',
              lambda_gan=0.1, w_l1=1.0, w_ssim=0.3, lr_g=2e-4, lr_d=2e-4,
              lambda_decay=0.0, epochs=None, warmup=None,
              snapshot=None, snapshot_every=0, verbose=True):
    """
    조건부 pix2pix GAN 학습 (CPU 가능).

    두 가지 시작 방식:
      · generator=None      → 새 UNetMini 를 처음부터 학습 (from scratch)
      · generator=<불러온 G> → W2 체크포인트를 이어받아 미세조정 (fine-tune)

    총 G 손실 = w_l1·L1 + w_ssim·SSIM + λ_eff·adversarial
      - 처음 warmup epoch 동안은 λ_eff=0 (판별자 없이 재구성만 '몸풀기')
      - 이후 λ_eff = lambda_gan · (1 − lambda_decay · 진행률)  으로 서서히 조절

    snapshot=(before, after) 를 주면 snapshot_every epoch 마다 그 patch 의
    연속 출력을 저장 → 학습 progression 관찰/GIF 용.

    반환: (G, D, history)
      history = {'G_l1','G_ssim','G_gan','D_loss','lam','snapshots'}
    """
    p = GAN_PRESETS[preset]
    n_epochs = epochs if epochs is not None else p['epochs']   # preset 값 override 가능
    n_warmup = warmup if warmup is not None else p['warmup']
    ds = SliceDataset(volume, k=k, patch_size=p['patch_size'],
                      n_patches_per_triplet=p['n_patches'], augment=True)
    loader = DataLoader(ds, batch_size=p['batch_size'], shuffle=True, num_workers=0)

    G = generator.to(device) if generator is not None else UNetMini(in_ch=2, base=p['base']).to(device)
    D = PatchDiscriminatorMini(cond_ch=2, base=p['d_base']).to(device)
    if verbose:
        mode = 'fine-tune (W2 이어받기)' if generator is not None else 'from scratch'
        print(f'[train_gan] preset={preset} · {mode}')
        print(f'  G params: {count_parameters(G):,} · D params: {count_parameters(D):,}')
        print(f'  warmup={n_warmup} epochs (재구성만) → 이후 adversarial (λ={lambda_gan})')

    opt_G = torch.optim.Adam(G.parameters(), lr=lr_g, betas=(0.5, 0.999))
    opt_D = torch.optim.Adam(D.parameters(), lr=lr_d, betas=(0.5, 0.999))

    hist = {'G_l1': [], 'G_ssim': [], 'G_gan': [], 'D_loss': [], 'lam': [], 'snapshots': []}
    for ep in range(n_epochs):
        progress = max(0.0, (ep - n_warmup) / max(1, n_epochs - n_warmup))
        lam = 0.0 if ep < n_warmup else lambda_gan * (1.0 - lambda_decay * progress)
        G.train(); D.train()
        e_l1 = e_ss = e_gan = e_d = 0.0; nb = 0
        for x, y in loader:
            x = x.to(device); y = y.to(device)
            cond = x                       # 조건 = 앞·뒤 슬라이스 2ch
            y_fake = G(x)
            # ── 판별자 갱신 (warmup 이후에만) ──
            if lam > 0:
                opt_D.zero_grad()
                d_loss = d_hinge_loss(D, cond, y, y_fake)
                d_loss.backward(); opt_D.step()
                e_d += float(d_loss.detach())
            # ── 생성자 갱신 ──
            opt_G.zero_grad()
            y_fake = G(x)
            loss_l1 = F.l1_loss(y_fake, y)
            loss_ss = ssim_loss(y_fake, y)
            g_loss = w_l1 * loss_l1 + w_ssim * loss_ss
            if lam > 0:
                loss_gan = g_hinge_loss(D, cond, y_fake)
                g_loss = g_loss + lam * loss_gan
                e_gan += float(loss_gan.detach())
            g_loss.backward(); opt_G.step()
            e_l1 += float(loss_l1.detach()); e_ss += float(loss_ss.detach()); nb += 1
        hist['G_l1'].append(e_l1 / nb); hist['G_ssim'].append(e_ss / nb)
        hist['G_gan'].append(e_gan / max(1, nb)); hist['D_loss'].append(e_d / max(1, nb))
        hist['lam'].append(lam)
        if snapshot is not None and snapshot_every and (ep % snapshot_every == 0 or ep == n_epochs - 1):
            cont = predict_continuous(G, snapshot[0], snapshot[1], device=device)
            hist['snapshots'].append((ep, cont))
        if verbose and (ep + 1) % max(1, n_epochs // 10) == 0:
            tag = 'warmup' if lam == 0 else f'λ={lam:.3f}'
            print(f'  epoch {ep+1:3d}/{n_epochs}  L1={e_l1/nb:.4f} SSIM_loss={e_ss/nb:.4f} '
                  f'G_gan={e_gan/max(1,nb):+.3f} D={e_d/max(1,nb):.3f}  [{tag}]')
    return G, D, hist


def save_gan_ckpt(G, D, path, meta=None):
    """생성자+판별자 가중치 저장."""
    torch.save({'G': G.state_dict(), 'D': D.state_dict(), 'meta': meta or {}}, path)


def load_gan_ckpt(path, g_base=8, d_base=32):
    """저장된 GAN 체크포인트 로드 → (G, D, meta)."""
    obj = torch.load(path, map_location='cpu')
    meta = obj.get('meta', {})
    G = UNetMini(in_ch=2, base=meta.get('g_base', g_base))
    D = PatchDiscriminatorMini(cond_ch=2, base=meta.get('d_base', d_base))
    G.load_state_dict(obj['G']); D.load_state_dict(obj['D'])
    G.eval(); D.eval()
    return G, D, meta
