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
              d_base=None, d_every=1,
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

    db = d_base if d_base is not None else p['d_base']   # 판별자 폭 override (독주 방지용)
    G = generator.to(device) if generator is not None else UNetMini(in_ch=2, base=p['base']).to(device)
    D = PatchDiscriminatorMini(cond_ch=2, base=db).to(device)
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
        e_l1 = e_ss = e_gan = e_d = 0.0; nb = 0; nd = 0; step = 0
        for x, y in loader:
            x = x.to(device); y = y.to(device)
            cond = x                       # 조건 = 앞·뒤 슬라이스 2ch
            y_fake = G(x)
            # ── 판별자 갱신 (warmup 이후 · d_every 스텝마다) ──
            if lam > 0 and (step % d_every == 0):
                opt_D.zero_grad()
                d_loss = d_hinge_loss(D, cond, y, y_fake)
                d_loss.backward(); opt_D.step()
                e_d += float(d_loss.detach()); nd += 1
            step += 1
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
        hist['G_gan'].append(e_gan / max(1, nb)); hist['D_loss'].append(e_d / max(1, nd))
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
    """저장된 GAN 체크포인트 로드 → (G, D, meta).

    폭(base)은 저장된 가중치의 실제 shape 에서 읽는다. meta 에 적힌 값과
    가중치가 어긋나 있어도 항상 로드된다.
    """
    obj = torch.load(path, map_location='cpu')
    meta = obj.get('meta', {})
    # 첫 conv 가중치의 출력 채널 수 = base (meta 오기와 무관하게 정확)
    g_actual = obj['G']['e1.conv.0.weight'].shape[0]
    d_sd = obj.get('D', {})
    d_key = 'net.0.weight_orig' if 'net.0.weight_orig' in d_sd else 'net.0.weight'
    d_actual = d_sd[d_key].shape[0] if d_key in d_sd else d_base
    G = UNetMini(in_ch=2, base=g_actual)
    D = PatchDiscriminatorMini(cond_ch=2, base=d_actual)
    G.load_state_dict(obj['G']); D.load_state_dict(obj['D'])
    G.eval(); D.eval()
    return G, D, meta


# ══════════════════════════════════════════════════════════════
#  W4 — 다른 아키텍처 (Swin Transformer · 3D CNN) 와 공정 비교
#
#  같은 문제(이웃 t±k → 가운데 t)를 연결 방식이 다른 세 구조로 푼다.
#    · UNetMini     (W2) : 2D 합성곱 — 지역 연산, 고정 가중치
#    · SwinUNetMini (W4) : 창(window) attention — 내용 기반 가중치
#    · UNet3DMini   (W4) : 3D 합성곱 — 슬라이스 사이 부피 문맥
#  세 모델의 파라미터 수는 ~10만 대로 맞춰져 있어 '구조'의 효과만 비교된다.
# ══════════════════════════════════════════════════════════════


# ──────────────────────────────────────────────────────────────
#  창 분할 (window partition) — 이미지를 window_size² 조각으로
# ──────────────────────────────────────────────────────────────
def window_partition(x, window_size):
    """(B, H, W, C) → (창 개수·B, window_size, window_size, C)"""
    B, H, W, C = x.shape
    x = x.view(B, H // window_size, window_size, W // window_size, window_size, C)
    return x.permute(0, 1, 3, 2, 4, 5).contiguous().view(-1, window_size, window_size, C)


def window_reverse(windows, window_size, H, W):
    """window_partition 의 역변환 → (B, H, W, C)"""
    B = int(windows.shape[0] / (H * W / window_size / window_size))
    x = windows.view(B, H // window_size, W // window_size, window_size, window_size, -1)
    return x.permute(0, 1, 3, 2, 4, 5).contiguous().view(B, H, W, -1)


class WindowAttentionMini(nn.Module):
    """
    창 내부 self-attention.

    Attention(Q, K, V) = softmax(Q Kᵀ / √d) V
      · Q(질의)·K(색인)·V(내용)는 같은 입력에서 선형 변환으로 만든다.
      · Q Kᵀ = 토큰 쌍의 유사도 점수 → √d 로 나눠 크기 안정화
      · softmax 로 합=1 가중치 → V 의 가중 평균이 새 표현이 된다.

    forward(x, return_attn=True) 로 attention map 을 직접 볼 수 있다.
    """
    def __init__(self, dim, window_size, num_heads):
        super().__init__()
        self.dim = dim
        self.window_size = window_size
        self.num_heads = num_heads
        head_dim = dim // num_heads
        self.scale = head_dim ** -0.5          # 1/√d
        self.qkv = nn.Linear(dim, dim * 3, bias=True)
        self.proj = nn.Linear(dim, dim)

    def forward(self, x, return_attn=False):
        B_, N, C = x.shape                     # N = window_size²  (창 안 토큰 수)
        qkv = self.qkv(x).reshape(B_, N, 3, self.num_heads, C // self.num_heads)
        qkv = qkv.permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]
        attn = (q @ k.transpose(-2, -1)) * self.scale   # 유사도 / √d
        attn = attn.softmax(dim=-1)                     # 행마다 합=1 가중치
        out = (attn @ v).transpose(1, 2).reshape(B_, N, C)
        out = self.proj(out)
        if return_attn:
            return out, attn                   # attn: (B_, heads, N, N)
        return out


class SwinBlockMini(nn.Module):
    """
    Swin 블록: LayerNorm → 창 attention(W-MSA/SW-MSA) → LayerNorm → MLP.
    shift=True 면 창을 절반 이동(torch.roll)시켜 창 경계를 넘는 연결을 만든다.
    두 블록(고정 창 + 이동 창)을 쌍으로 쓰는 것이 Swin 의 기본 단위다.
    """
    def __init__(self, dim, num_heads, window_size=8, shift=False):
        super().__init__()
        self.window_size = window_size
        self.shift_size = window_size // 2 if shift else 0
        self.norm1 = nn.LayerNorm(dim)
        self.attn = WindowAttentionMini(dim, window_size, num_heads)
        self.norm2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, dim * 2), nn.GELU(),
            nn.Linear(dim * 2, dim))

    def forward(self, x):                      # x: (B, H, W, C)
        B, H, W, C = x.shape
        shortcut = x
        x = self.norm1(x)
        if self.shift_size > 0:
            x = torch.roll(x, shifts=(-self.shift_size, -self.shift_size), dims=(1, 2))
        win = window_partition(x, self.window_size)
        win = win.view(-1, self.window_size * self.window_size, C)
        out = self.attn(win)
        out = out.view(-1, self.window_size, self.window_size, C)
        out = window_reverse(out, self.window_size, H, W)
        if self.shift_size > 0:
            out = torch.roll(out, shifts=(self.shift_size, self.shift_size), dims=(1, 2))
        x = shortcut + out                     # 잔차 연결 1
        x = x + self.mlp(self.norm2(x))        # 잔차 연결 2
        return x


class SwinUNetMini(nn.Module):
    """
    창 attention 기반 mini 모델 (CNN 하이브리드).

    Input  : (B, 2, H, W) — [slice_before, slice_after], H·W 는 32의 배수
    Output : (B, 1, H, W) — 가운데 슬라이스 (sigmoid)

    구조: 4×4 conv 로 패치 임베딩(H/4) → Swin 블록 쌍 → 다운(H/8) → Swin 블록 쌍
          → 업 + skip → Swin 블록 쌍 → ×2 업샘플 두 번 → 최상단 skip 결합 → 1ch 출력.
    UNetMini 와 같은 U-구조(최상단 full-res skip 포함)에서 합성곱 블록 자리만
    Swin 블록으로 바뀐 형태다. 최상단 skip 이 없으면 픽셀 세부를 토큰에서 다시
    만들어야 해서, 짧은 학습에서는 '전부 solid' 같은 자명해에 갇히기 쉽다.
    base=32, heads=4, window=8 → ~125K 파라미터 (UNetMini base=16 과 동급).
    """
    def __init__(self, in_ch=2, base=32, num_heads=4, window_size=8):
        super().__init__()
        self.stem = nn.Conv2d(in_ch, base // 4, 3, padding=1)  # 최상단 skip (full-res)
        self.embed = nn.Conv2d(in_ch, base, 4, stride=4)       # 패치 임베딩
        self.s1 = nn.ModuleList([
            SwinBlockMini(base, num_heads, window_size, shift=(i % 2 == 1))
            for i in range(2)])
        self.down = nn.Conv2d(base, base * 2, 2, stride=2)
        self.s2 = nn.ModuleList([
            SwinBlockMini(base * 2, num_heads * 2, window_size, shift=(i % 2 == 1))
            for i in range(2)])
        self.up1 = nn.ConvTranspose2d(base * 2, base, 2, stride=2)
        self.skip_conv = nn.Conv2d(base * 2, base, 1)
        self.s3 = nn.ModuleList([
            SwinBlockMini(base, num_heads, window_size, shift=(i % 2 == 1))
            for i in range(2)])
        self.up2 = nn.ConvTranspose2d(base, base // 2, 2, stride=2)
        self.up3 = nn.ConvTranspose2d(base // 2, base // 4, 2, stride=2)
        self.head = nn.Sequential(
            nn.Conv2d(base // 4 + base // 4, base // 4, 3, padding=1), nn.GELU(),
            nn.Conv2d(base // 4, 1, 1), nn.Sigmoid())

    def forward(self, x):
        s0 = self.stem(x)                      # 최상단 skip (full-res 세부 정보)
        x = self.embed(x)                      # (B, base, H/4, W/4)
        x = x.permute(0, 2, 3, 1)              # 토큰 배열 (B, H/4, W/4, base)
        for blk in self.s1:
            x = blk(x)
        skip1 = x
        x = x.permute(0, 3, 1, 2)
        x = self.down(x)                       # (B, 2·base, H/8, W/8)
        x = x.permute(0, 2, 3, 1)
        for blk in self.s2:
            x = blk(x)
        x = x.permute(0, 3, 1, 2)
        x = self.up1(x)                        # (B, base, H/4, W/4)
        x = torch.cat([x, skip1.permute(0, 3, 1, 2)], dim=1)
        x = self.skip_conv(x)                  # skip 결합
        x = x.permute(0, 2, 3, 1)
        for blk in self.s3:
            x = blk(x)
        x = x.permute(0, 3, 1, 2)
        x = self.up2(x)                        # (B, base/2, H/2, W/2)
        x = self.up3(x)                        # (B, base/4, H, W)
        x = torch.cat([x, s0], dim=1)          # 최상단 skip 결합
        return self.head(x)


# ──────────────────────────────────────────────────────────────
#  3D CNN — 부피 문맥 + '공정한 입력' 설계
# ──────────────────────────────────────────────────────────────
class ConvBlock3D(nn.Module):
    """Conv3d(3×3×3) → BatchNorm3d → LeakyReLU 두 번."""
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv3d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm3d(out_ch),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Conv3d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm3d(out_ch),
            nn.LeakyReLU(0.1, inplace=True),
        )

    def forward(self, x):
        return self.conv(x)


class UNet3DMini(nn.Module):
    """
    3D 합성곱 mini 모델.

    Input  : (B, 2, D, H, W) — D = 2k+1 슬라이스 창.
             ch0 = 이웃 t±k 두 장만 채워진 부피(나머지 0), ch1 = 채움 마스크
    Output : (B, 1, H, W) — 가운데(t) 슬라이스 (sigmoid)

    입력에는 2D 모델과 '같은 정보'(이웃 t±k 두 장)만 들어간다. 다른 슬라이스를
    입력에 넣으면 예측 대상 근처의 GT 가 새어 들어가 비교가 무의미해진다.
    깊이 방향은 pooling 하지 않고(H·W 만 1/2), 3×3×3 합성곱이 층을 거치며
    이웃 정보를 가운데로 전파한다. base=10 → ~129K 파라미터.
    """
    def __init__(self, in_ch=2, base=10):
        super().__init__()
        self.e1 = ConvBlock3D(in_ch, base)
        self.e2 = ConvBlock3D(base, base * 2)
        self.e3 = ConvBlock3D(base * 2, base * 4)
        self.d2 = None                          # 아래 UpBlock3D 참조
        self.up2 = nn.ConvTranspose3d(base * 4, base * 2, (1, 2, 2), stride=(1, 2, 2))
        self.c2 = ConvBlock3D(base * 4, base * 2)
        self.up1 = nn.ConvTranspose3d(base * 2, base, (1, 2, 2), stride=(1, 2, 2))
        self.c1 = ConvBlock3D(base * 2, base)
        self.out = nn.Conv3d(base, 1, 1)
        self.pool = nn.MaxPool3d((1, 2, 2))     # 깊이는 유지, H·W 만 1/2

    def forward(self, x):                       # x: (B, 2, D, H, W)
        e1 = self.e1(x)
        e2 = self.e2(self.pool(e1))
        e3 = self.e3(self.pool(e2))
        d2 = self.up2(e3)
        d2 = self.c2(torch.cat([d2, e2], dim=1))
        d1 = self.up1(d2)
        d1 = self.c1(torch.cat([d1, e1], dim=1))
        vol = torch.sigmoid(self.out(d1))       # (B, 1, D, H, W)
        return vol[:, :, vol.shape[2] // 2]     # 가운데 슬라이스만 반환


class Slice3DDataset(Dataset):
    """
    UNet3DMini 용 데이터. SliceDataset 과 같은 정보를 3D 형태로 담는다.

    각 sample: (input (2, 2k+1, p, p), target (1, p, p))
      ch0 = 깊이 0 과 2k 에만 이웃 슬라이스가 채워진 부피 (나머지 0)
      ch1 = 채움 위치 마스크,  target = 가운데(t) patch
    """
    def __init__(self, volume, k=2, patch_size=64, n_patches_per_triplet=4, augment=True):
        self.vol = (volume.astype(np.float32) if volume.max() <= 1
                    else volume.astype(np.float32) / 255.0)
        self.k = k
        self.patch_size = patch_size
        self.n_patches = n_patches_per_triplet
        self.augment = augment
        Z = volume.shape[0]
        self.triplets = [(t - k, t, t + k) for t in range(k, Z - k)]

    def __len__(self):
        return len(self.triplets) * self.n_patches

    def __getitem__(self, idx):
        before, mid, after = self.triplets[idx // self.n_patches]
        H, W = self.vol.shape[1:]
        ps = self.patch_size or H
        y = np.random.randint(0, H - ps + 1) if self.patch_size else 0
        x = np.random.randint(0, W - ps + 1) if self.patch_size else 0
        sb = self.vol[before, y:y+ps, x:x+ps]
        sa = self.vol[after,  y:y+ps, x:x+ps]
        sm = self.vol[mid,    y:y+ps, x:x+ps]
        if self.augment:
            if np.random.rand() < 0.5:
                sb, sa, sm = sb[::-1].copy(), sa[::-1].copy(), sm[::-1].copy()
            if np.random.rand() < 0.5:
                sb, sa, sm = sb[:, ::-1].copy(), sa[:, ::-1].copy(), sm[:, ::-1].copy()
        D = 2 * self.k + 1
        x_in = np.zeros((2, D, ps, ps), dtype=np.float32)
        x_in[0, 0] = sb          # 이웃 t−k
        x_in[0, D - 1] = sa      # 이웃 t+k
        x_in[1, 0] = 1.0         # 채움 마스크
        x_in[1, D - 1] = 1.0
        y_tg = sm.astype(np.float32)[None]
        return torch.from_numpy(x_in), torch.from_numpy(y_tg)


def evaluate_model_3d(model, volume, k=2, device='cpu'):
    """UNet3DMini 평가 — evaluate_model 과 같은 지표(|Δφ|·SSIM)."""
    model.eval()
    vol = (volume.astype(np.float32) if volume.max() <= 1
           else volume.astype(np.float32) / 255.0)
    Z, H, W = vol.shape
    D = 2 * k + 1
    recon = vol.copy()
    with torch.no_grad():
        for t in range(k, Z - k):
            x = np.zeros((1, 2, D, H, W), dtype=np.float32)
            x[0, 0, 0] = vol[t - k]
            x[0, 0, D - 1] = vol[t + k]
            x[0, 1, 0] = 1.0
            x[0, 1, D - 1] = 1.0
            pred = model(torch.from_numpy(x).to(device)).cpu().numpy()[0, 0]
            recon[t] = (pred > 0.5).astype(np.float32)
    from dr_utils import eval_targets
    r = eval_targets(recon, vol, k)
    return {'dphi_pp': r['dphi_pp'], 'ssim': r['ssim'], 'recon': recon}


# ──────────────────────────────────────────────────────────────
#  공정 비교 — 같은 데이터 · 같은 정보 · 같은 시간 예산
# ──────────────────────────────────────────────────────────────
def benchmark_models(volume, k=2, budget_s=90, device='cpu', models=None,
                     patch_size=64, batch_size=8, n_patches=2, lr=1e-3,
                     seed=0, keep_recon=True, verbose=True):
    """
    세 구조를 같은 조건에서 학습·평가한다.

      · 같은 데이터  : 같은 volume, 같은 (t−k, t, t+k) triplet
      · 같은 정보    : 입력은 이웃 t±k 두 장뿐 (3D 모델도 동일)
      · 같은 시간    : 모델마다 wall-clock budget_s 초 학습 (epoch 수는 달라짐)
      · 같은 손실    : L1

    optimizer 는 구조별 표준 설정을 쓴다. 같은 설정이 모든 구조에 안정적이지
    않기 때문이다 (합성곱 계열: Adam lr=1e-3 · transformer 계열: AdamW lr=2e-4,
    weight_decay=1e-4, gradient clipping 1.0).

    반환: {이름: {'params','time_s','epochs','steps','dphi_pp','ssim',
                  'history'(=[(경과초, 평균손실), …]), 'recon'}}
    """
    if models is None:
        models = {
            'UNet2D (W2)': UNetMini(in_ch=2, base=16),
            'SwinUNet':    SwinUNetMini(in_ch=2, base=32, num_heads=4, window_size=8),
            'UNet3D':      UNet3DMini(in_ch=2, base=10),
        }
    import time
    results = {}
    for name, model in models.items():
        torch.manual_seed(seed)
        np.random.seed(seed)
        is3d = isinstance(model, UNet3DMini)
        ds = (Slice3DDataset if is3d else SliceDataset)(
            volume, k=k, patch_size=patch_size,
            n_patches_per_triplet=n_patches, augment=True)
        loader = DataLoader(ds, batch_size=batch_size, shuffle=True, num_workers=0)
        model = model.to(device)
        n_params = count_parameters(model)
        if verbose:
            print(f'[{name}] params={n_params:,} · budget={budget_s}s')
        criterion = nn.L1Loss()
        # 구조별 표준 optimizer — transformer 는 AdamW(작은 lr)+clip 이 안정적
        is_transformer = isinstance(model, SwinUNetMini)
        if is_transformer:
            optimizer = torch.optim.AdamW(model.parameters(), lr=2e-4, weight_decay=1e-4)
        else:
            optimizer = torch.optim.Adam(model.parameters(), lr=lr)
        model.train()
        t0 = time.time()
        history = []
        epochs = 0
        steps = 0
        stop = False
        while not stop:
            run_loss, run_n = 0.0, 0
            for x, y in loader:
                x = x.to(device); y = y.to(device)
                optimizer.zero_grad()
                loss = criterion(model(x), y)
                loss.backward()
                if is_transformer:
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                run_loss += loss.item() * x.size(0); run_n += x.size(0)
                steps += 1
                if time.time() - t0 >= budget_s:
                    stop = True
                    break
            if run_n:
                history.append((time.time() - t0, run_loss / run_n))
            epochs += 1
            if stop and epochs == 1 and verbose:
                print('  (budget 이 1 epoch 안에 끝남 — budget_s 를 늘리면 안정적)')
        train_s = time.time() - t0
        ev = (evaluate_model_3d if is3d else evaluate_model)(model, volume, k=k, device=device)
        results[name] = {
            'model': model, 'params': n_params, 'time_s': train_s,
            'epochs': epochs, 'steps': steps,
            'dphi_pp': ev['dphi_pp'], 'ssim': ev['ssim'],
            'history': history,
            'recon': ev['recon'] if keep_recon else None,
        }
        if verbose:
            print(f'  {train_s:.0f}s · {epochs} epochs ({steps} steps) '
                  f'→ |Δφ|={ev["dphi_pp"]:.2f}%p · SSIM={ev["ssim"]:.3f}')
    if verbose:
        print()
        print(f'{"모델":<14}{"params":>10}{"epochs":>8}{"|Δφ| %p":>10}{"SSIM":>8}')
        for name, r in results.items():
            print(f'{name:<14}{r["params"]:>10,}{r["epochs"]:>8}'
                  f'{r["dphi_pp"]:>10.2f}{r["ssim"]:>8.3f}')
    return results
