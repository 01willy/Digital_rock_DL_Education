"""pix2pix 슬라이스 보간 전체 구조 figure (재현 가능 SVG → PNG).
model-architecture-figure 스킬: semantic spec(figures/architecture_spec.json) 기반.
출력: figures/W3_architecture.svg + web/assets/figures/W3_architecture.png
"""
import cairosvg, base64, os
from pathlib import Path

TOK = dict(bg='#f4f1eb', card='#ffffff', ink='#1a2333', sub='#5a6475', muted='#8a93a3',
           line='#d9d2c4', navy='#1f3a5f', navy2='#475067', orange='#ea851b', orange_d='#d4760f',
           green='#2e8b57', red='#c83a3a', tint='#fbf7f2', tintl='#f1e5d6',
           navy_soft='#e2e9f1', orange_soft='#fbe7ce', green_soft='#e1f0e8')
FIGDIR = Path('/home/willy010313/Digital_Rock/education_package_2026/web/assets/figures')

def img_b64(name):
    return 'data:image/png;base64,' + base64.b64encode((FIGDIR/name).read_bytes()).decode()

W, H = 1640, 720
E = []
def add(s): E.append(s)

# 배경
add(f'<rect x="0" y="0" width="{W}" height="{H}" fill="{TOK["bg"]}"/>')

def box(x,y,w,h,fill,stroke,sw=2,rx=12):
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
def txt(x,y,s,size,fill,w='400',anchor='middle',mono=False,ls=''):
    fam = "'JetBrains Mono','Pretendard',monospace" if mono else "'Pretendard',sans-serif"
    lss = f' letter-spacing="{ls}"' if ls else ''
    add(f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{fam}" font-size="{size}" font-weight="{w}" fill="{fill}"{lss}>{s}</text>')
def arrow(x1,y1,x2,y2,color,sw=2.6,dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    add(f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{color}" stroke-width="{sw}" fill="none"{d} marker-end="url(#ah-{color[1:]})"/>')
def img(x,y,s,name,stroke=None,sw=2):
    add(f'<image x="{x}" y="{y}" width="{s}" height="{s}" href="{img_b64(name)}" preserveAspectRatio="none"/>')
    if stroke: add(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" rx="4" fill="none" stroke="{stroke}" stroke-width="{sw}"/>')

markers = set()
def need_marker(c): markers.add(c)

# ── 입력 (좌) ─────────────────────────────────────────
ix, iy = 40, 210
img(ix, iy, 90, 'W3_tile_before.png', TOK['line'])
img(ix, iy+108, 90, 'W3_tile_after.png', TOK['line'])
txt(ix+45, iy-16, '이웃 슬라이스', 20, TOK['ink'], '600')
txt(ix+45, iy+232, 'x = [t−k, t+k]', 18, TOK['sub'], mono=True)
txt(ix+45, iy+256, '2 채널', 16, TOK['muted'])
need_marker(TOK['muted']); arrow(ix+95, iy+108, 232, iy+108, TOK['muted'])

# ── Generator (UNet) — U자 사다리 ────────────────────
gx, gy = 240, 120
box(gx, gy, 470, 300, TOK['orange_soft'], TOK['orange'], 2.5, 16)
txt(gx+235, gy+34, 'Generator · UNet', 24, TOK['orange_d'], '700')
# encoder/decoder 계단 (사다리꼴 느낌)
enc = [(2,'64²'),(8,'32²'),(16,'16²')]
dec = [(16,'32²'),(8,'64²')]
bx = gx+40; by0 = gy+70
# encoder 블록 (내려감)
levels = [(0, 32, 155), (1, 26, 130), (2, 20, 108)]  # (idx, h, w center)
col_navy = TOK['navy']
ex = gx+55
for i,(ch,sz) in enumerate(enc):
    h = 150 - i*38; y = gy+120 - h/2 + 40
    box(ex, y, 46, h, TOK['navy_soft'], TOK['navy'], 1.8, 6)
    txt(ex+23, gy+120+40, f'{ch}', 17, TOK['navy'], '700')
    txt(ex+23, y-8, sz, 13, TOK['muted'], mono=True)
    ex += 60
# bottleneck
box(ex, gy+120-30+40, 46, 60, TOK['navy'], TOK['navy'], 1.8, 6)
txt(ex+23, gy+120+8+40, '32', 16, '#fff', '700')
ex += 74
# decoder 블록 (올라감)
dxs = []
for i,(ch,sz) in enumerate(dec):
    h = 74 + i*38; y = gy+120 - h/2 + 40
    box(ex, y, 46, h, TOK['orange_soft'], TOK['orange_d'], 1.8, 6)
    txt(ex+23, gy+120+40, f'{ch}', 17, TOK['orange_d'], '700')
    txt(ex+23, y-8, sz, 13, TOK['muted'], mono=True)
    dxs.append(ex)
    ex += 60
# skip connection 호 (encoder → decoder)
add(f'<path d="M{gx+78} {gy+95} C {gx+180} {gy+58}, {dxs[1]+46-30} {gy+58}, {dxs[1]+23} {gy+95}" stroke="{TOK["green"]}" stroke-width="2.2" fill="none" stroke-dasharray="6 6"/>')
add(f'<path d="M{gx+138} {gy+108} C {gx+230} {gy+80}, {dxs[0]-20} {gy+80}, {dxs[0]+23} {gy+108}" stroke="{TOK["green"]}" stroke-width="2.2" fill="none" stroke-dasharray="6 6"/>')
txt(gx+235, gy-12, 'skip connection', 14, TOK['green'], '600')
txt(gx+235, gy+290, 'encoder  →  bottleneck  →  decoder', 15, TOK['sub'])

# ── 생성 슬라이스 ŷ ───────────────────────────────────
fx, fy = 740, 150
need_marker(TOK['orange']); arrow(gx+470, gy+150, fx-8, fy+45, TOK['orange'])
img(fx, fy, 90, 'W3_tile_cont_gan.png', TOK['orange'], 2.5)
txt(fx+45, fy-14, '생성 슬라이스', 19, TOK['orange_d'], '600')
txt(fx+45, fy+112, 'ŷ = G(x)', 17, TOK['sub'], mono=True)

# ── 진짜 슬라이스 y ──────────────────────────────────
ry, ryy = fx, 470
img(ry, ryy, 90, 'W3_tile_target.png', TOK['green'], 2.5)
txt(ry+45, ryy-12, '진짜 슬라이스', 19, TOK['green'], '600')
txt(ry+45, ryy+112, 'y (정답)', 17, TOK['sub'])

# ── Discriminator (PatchGAN) ─────────────────────────
dx, dyt = 980, 250
box(dx, dyt, 300, 220, TOK['navy_soft'], TOK['navy'], 2.5, 16)
txt(dx+150, dyt+34, 'Discriminator', 23, TOK['navy'], '700')
txt(dx+150, dyt+58, 'PatchGAN · spectral norm', 15, TOK['sub'])
# conv 계단
convs = [(32,'64²'),(64,'32²'),(128,'16²')]
cx = dx+30
for i,(ch,sz) in enumerate(convs):
    h = 60 + i*22; y = dyt+130 - h/2
    box(cx, y, 40, h, '#fff', TOK['navy'], 1.6, 5)
    txt(cx+20, dyt+134, f'{ch}', 15, TOK['navy'], '700')
    cx += 52
txt(dx+150, dyt+200, 'x + y  →  3채널 입력', 15, TOK['sub'])
# 화살표 ŷ→D, y→D (조건 x 도 함께)
need_marker(TOK['navy'])
arrow(fx+90, fy+50, dx-6, dyt+70, TOK['orange'])
arrow(ry+90, ryy+50, dx-6, dyt+150, TOK['green'])

# ── 점수 map ─────────────────────────────────────────
sx, sy = 1350, 300
box(sx, sy, 130, 130, '#fff', TOK['navy'], 2.2, 10)
# 미니 격자
gg = 100; ox=sx+15; oy=sy+15; cell=gg/5
for i in range(6):
    add(f'<line x1="{ox+i*cell}" y1="{oy}" x2="{ox+i*cell}" y2="{oy+gg}" stroke="{TOK["navy"]}" stroke-width="0.8" opacity="0.5"/>')
    add(f'<line x1="{ox}" y1="{oy+i*cell}" x2="{ox+gg}" y2="{oy+i*cell}" stroke="{TOK["navy"]}" stroke-width="0.8" opacity="0.5"/>')
import math
vals = [0.8,0.6,-.3,0.7,0.5, 0.9,-.2,0.6,0.4,0.7, 0.5,0.8,-.4,0.6,0.3, 0.7,0.4,0.6,-.1,0.8, 0.6,0.7,0.5,0.8,-.2]
for i,v in enumerate(vals):
    r,c = divmod(i,5)
    col = TOK['green'] if v>0 else TOK['red']
    add(f'<rect x="{ox+c*cell+1}" y="{oy+r*cell+1}" width="{cell-2}" height="{cell-2}" fill="{col}" opacity="{0.15+0.5*abs(v)}"/>')
txt(sx+65, sy-12, '15×15 점수', 17, TOK['navy'], '600')
txt(sx+65, sy+152, '+진짜 / −가짜', 15, TOK['muted'])
need_marker(TOK['navy']); arrow(dx+300, dyt+110, sx-6, sy+65, TOK['navy'])

# ── 손실 (하단) ──────────────────────────────────────
ly = 600
# 재구성 손실 (ŷ ↔ y)
add(f'<path d="M{fx+45} {fy+92} C {fx+45} {ryy-60}, {ry+45} {ryy-60}, {ry+45} {ryy-2}" stroke="{TOK["navy2"]}" stroke-width="2" fill="none" stroke-dasharray="5 5"/>')
txt(fx-80, (fy+ryy)/2+50, 'L1 · SSIM', 17, TOK['navy2'], '700', anchor='start')
txt(fx-80, (fy+ryy)/2+72, '(재구성 손실)', 14, TOK['muted'], anchor='start')

# 전체 손실 박스
box(560, ly, 540, 90, TOK['tint'], TOK['tintl'], 1.5, 12)
txt(830, ly+34, '생성자 전체 손실', 17, TOK['ink'], '700')
txt(830, ly+66, 'L_G = 1.0·L1 + 0.3·SSIM + λ·adversarial   (λ ≈ 0.1)', 19, TOK['navy'], '600', mono=True)

# adversarial 손실 라벨
txt(dx+150, dyt+250, 'adversarial (hinge)', 16, TOK['orange_d'], '700')
add(f'<path d="M{dx+150} {dyt+220} L{dx+150} {dyt+236}" stroke="{TOK["orange_d"]}" stroke-width="1.6"/>')

# markers defs
defs = '<defs>'
for c in markers | {TOK['orange'], TOK['green'], TOK['navy'], TOK['muted']}:
    defs += f'<marker id="ah-{c[1:]}" markerWidth="11" markerHeight="11" refX="8" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="{c}"/></marker>'
defs += '</defs>'

svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{defs}{"".join(E)}</svg>'
out_svg = Path('/home/willy010313/Digital_Rock/education_package_2026/figures/W3_architecture.svg')
out_svg.write_text(svg)
cairosvg.svg2png(bytestring=svg.encode(), write_to=str(FIGDIR/'W3_architecture.png'), output_width=1640, background_color=TOK['bg'])
print('저장:', out_svg, '+', FIGDIR/'W3_architecture.png')
