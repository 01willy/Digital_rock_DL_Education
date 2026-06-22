/* =====================================================================
   Course data — Digital Rock · Sparse Slice Interpolation (6-week)
   Single source of truth for the learning UI.
   ===================================================================== */
window.COURSE = {
  meta: {
    title: 'Digital Rock',
    subtitle: 'Sparse Slice Interpolation',
    tagline: 'Micro-CT 암석 단면을 딥러닝으로 복원하는 6주 연구 코스',
  },

  groups: {
    g1: { id:'g1', name:'1조', tag:'Advanced', track:'심화 트랙', desc:'심화 탐구 트랙 — 도메인·축 비교 등 확장 과제를 더합니다.', accent:'navy' },
    g2: { id:'g2', name:'2조', tag:'Core',     track:'기본 트랙', desc:'개념 중심 트랙 — 단계별 [Try-it!]로 기초를 탄탄히 다집니다.', accent:'orange' },
  },

  // 6-week roadmap — revised (2026-06-08)
  //  • W1 = 데이터 + Classical (선형/Cubic 보간) — 학생이 2주에 걸쳐 충분히 소화
  //  • W2 = Deep Learning 입문 — UNet/pix2pix 구조와 학습 루프 직접 분석
  //  • W3 = 적대적 학습 (GAN) — pix2pix → 조건부 GAN 으로 확장, 학습 안정화
  //  • W4 = 다른 아키텍처 — Transformer 기반, 3D 모델, 파라미터 trade-off
  //  • W5 = 한계 극복 기법 — tri-axis, multi-k 학습, augmentation, 후처리
  //  • W6 = Cross-domain 분석 — Carbonate, Zero-shot vs Fine-tune
  weeks: [
    {
      n:1, status:'done', slug:'w1', available:true,
      title:'데이터 탐색 + Classical Baseline',
      en:'Load · Preprocess · Linear/Cubic',
      summary:'Micro-CT voxel 데이터를 직접 열고, 전처리(normalize·Otsu)와 sparse imaging 문제를 정의. scipy 기반 선형/Cubic 보간으로 |Δφ|·|ΔSA|·SSIM 측정.',
      concepts:['Voxel · Slice','전처리','Porosity φ','Sparse imaging (k)','Linear · Cubic','|Δφ|·SSIM'],
      nonDL:true,
    },
    {
      n:2, status:'now', slug:'w2', available:true,
      title:'Deep Learning 입문 — UNet · pix2pix 구조',
      en:'UNet · pix2pix · Train',
      summary:'슬라이스 보간을 학습 가능한 함수로 정식화. UNet 구조와 pix2pix(조건부 image-to-image) 흐름을 코드로 따라가고, mini UNet을 직접 학습합니다. 나아가 학습 루프·손실·모델 크기를 직접 수정하며 cross-domain 일반화와 실패 모드까지 분석합니다.',
      concepts:['UNet · skip','pix2pix 흐름','학습 루프 직접 제어','L1/MSE/복합 손실','k 일반화 · 실패 모드'],
      nonDL:false,
      plan:[
        'sparse triplet dataset 구성 (입력 2채널 → 가운데 슬라이스)',
        'UNet/pix2pix generator 구조 분석',
        '학습 루프 직접 실행 + 학습 곡선 해석',
        'W1 classical baseline 대비 정량 비교',
      ],
      newUtils:['SliceDataset','UNetMini','train_quick','evaluate_model'],
      prep:['pip install torch torchvision','W1 baseline 결과'],
    },
    {
      n:3, status:'next', slug:'w3', available:false,
      title:'적대적 학습 — pix2pix GAN',
      en:'Conditional GAN',
      summary:'L1 손실만으로는 흐릿한 복원이 한계. pix2pix 구조에 patch discriminator를 더해 조건부 GAN 학습으로 확장. 학습 안정화·loss weight 균형·평가 metric 추가.',
      concepts:['GAN','Discriminator','Adversarial loss','L1 + GAN 균형','학습 안정화'],
      nonDL:false,
      plan:[
        'Discriminator 구조와 PatchGAN',
        'L1 / SSIM / Adversarial loss 가중 균형',
        '학습 안정화 (gradient penalty · spectral norm)',
        'W2 결과 대비 시각·정량 비교',
      ],
      newUtils:['PatchDiscriminator','gan_train_step','loss_balancer'],
      prep:['W2 학습된 mini UNet 체크포인트'],
    },
    {
      n:4, status:'upcoming', slug:'w4', available:false,
      title:'다른 아키텍처 비교',
      en:'Transformer · 3D · trade-off',
      summary:'CNN 외의 아키텍처(Transformer 기반·3D conv)들을 같은 sparse 보간 문제에 적용. 파라미터 수·학습 시간·정확도의 trade-off를 비교.',
      concepts:['Attention','Transformer encoder','3D Conv','파라미터 효율'],
      nonDL:false,
      plan:[
        '주요 아키텍처 후보 (UNet · SwinUNet · 3D UNet) 비교',
        '동일 데이터·예산에서의 평가',
        '평가지표 다중 비교 표',
      ],
      newUtils:['SwinUNetMini','UNet3DMini','benchmark_models'],
      prep:['Pre-trained ckpt 안내'],
    },
    {
      n:5, status:'upcoming', slug:'w5', available:false,
      title:'한계 극복 기법',
      en:'Tri-axis · multi-k · augmentation',
      summary:'단일 축·단일 k 학습의 한계를 보완하는 여러 기법 검토. 세 직교축 정보 융합(2.5D), 다양한 k에서의 학습, 데이터 증강·후처리 전략.',
      concepts:['Tri-axis fusion','Multi-k training','Augmentation','후처리'],
      nonDL:false,
      plan:[
        '세 축 정보 융합으로 2.5D 복원',
        'Multi-k 학습이 일반화에 미치는 영향',
        '증강·후처리 효과 정량 평가',
      ],
      newUtils:['triaxis_fusion','multi_k_loader','postproc_morph'],
      prep:['W2 또는 W4 학습 모델'],
    },
    {
      n:6, status:'upcoming', slug:'w6', available:false,
      title:'Cross-domain 분석 — 일반화 능력',
      en:'Zero-shot · Fine-tune',
      summary:'다른 암석 도메인(sandstone → carbonate)에서의 zero-shot 평가 vs 짧은 fine-tune 결과 비교. 데이터 인코딩 차이 점검과 종합 발표.',
      concepts:['Cross-domain','Zero-shot','Fine-tuning','Domain shift'],
      nonDL:false,
      plan:[
        'Carbonate 데이터 로딩 + 인코딩 점검',
        'Zero-shot 평가 vs Fine-tune 결과',
        '종합 발표 + 회고',
      ],
      newUtils:['load_carbonate','fine_tune_short'],
      prep:['전체 주차 결과 정리','발표 자료'],
    },
  ],

  // domains (real micro-CT samples) — 6 도메인으로 확장
  // φ 값은 본 패키지 256³ subvolume 기준 (실제 측정값)
  domains: [
    { id:'BB',          name:'BB Sandstone',   phi:0.220, voxel_um:2.25, family:'sandstone', note:'기준 학습 도메인 (W1~W5)' },
    { id:'CastleGate',  name:'CastleGate',     phi:0.252, voxel_um:2.25, family:'sandstone', note:'불균질 사암' },
    { id:'Bentheimer',  name:'Bentheimer',     phi:0.267, voxel_um:2.25, family:'sandstone', note:'균질 사암' },
    { id:'Parker',      name:'Parker',         phi:0.123, voxel_um:2.25, family:'sandstone', note:'저공극 사암' },
    { id:'Ketton',      name:'Ketton',         phi:0.118, voxel_um:3.00, family:'carbonate', note:'탄산염암 — W6 cross-domain' },
    { id:'Estaillades', name:'Estaillades',    phi:0.096, voxel_um:3.31, family:'carbonate', note:'탄산염암 — 원본 인코딩 invert (교육 포인트)' },
  ],

  // glossary (merged from both handouts)
  glossary: [
    { term:'Voxel',        ko:'3D 픽셀. volume[z,y,x]의 한 칸 — 작은 정육면체 하나.', tag:'기초' },
    { term:'Slice',        ko:'3D 부피를 한 평면으로 자른 2D 이미지. volume[100,:,:]', tag:'기초' },
    { term:'Porosity (φ)', ko:'전체 voxel 중 공극(pore)이 차지하는 비율. 0~1. 0.22 = 22%.', tag:'평가' },
    { term:'Pore / Solid', ko:'공극(빈 공간) / 고체(암석). 본 데이터에서 1 / 0.', tag:'기초' },
    { term:'Micro-CT',     ko:'마이크로미터 해상도의 X-ray 단층촬영. 본 데이터의 출처.', tag:'데이터' },
    { term:'Slab',         ko:'부피를 한 방향으로 자른 두꺼운 덩어리. 슬랩별 통계 분석에 사용.', tag:'분석' },
    { term:'Isotropy',     ko:'세 축 방향이 통계적으로 같은 성질. 본 연구의 핵심 가정.', tag:'가정' },
    { term:'Sparse imaging',ko:'모든 슬라이스를 측정하지 않고 일부만 측정하는 전략.', tag:'핵심' },
    { term:'k (간격)',      ko:'슬라이스 측정 간격. k=3 → 3장 중 1장만 측정.', tag:'핵심' },
    { term:'Interpolation',ko:'측정되지 않은 슬라이스를 측정된 슬라이스로부터 복원.', tag:'핵심' },
    { term:'|Δφ|',         ko:'보간 후 공극률 오차 = |φ(복원) − φ(원본)|. 핵심 평가 metric.', tag:'평가' },
    { term:'SSIM',         ko:'구조 유사도. 복원 슬라이스가 원본과 얼마나 닮았는지 (W2~).', tag:'평가' },
    { term:'Tri-axis agg.',ko:'세 방향(z/y/x) 보간 결과를 통합 (W5에서 상세).', tag:'심화' },
  ],

  // W1 detail — per group
  w1: {
    // flow rows are { a, src } — WeekFull renders action + source only (.noflow-time)
    flow: [
      { a:'강의 + 개념',            src:'슬라이드 1–12' },
      { a:'노트북 실행 + [Try-it!]', src:'W1_load_and_explore.ipynb' },
      { a:'후반 강의 + 노트북',      src:'sparse + 보간' },
      { a:'자기 점검 + 탐구 과제',   src:'handout §4' },
      { a:'Q&A + W2 예고',          src:'마무리' },
    ],
    groups: {
      g1: {
        slides:20, cells:17, tryits:5,
        notebook:'W1_load_and_explore.ipynb',
        tasks:[
          { t:'도메인 간 비교', req:true, d:'세 도메인 모두 k=[1,2,3,5,7,10] sweep → 한 plot에 세 곡선. 어느 도메인의 sparse 보간이 가장 쉬운가?' },
          { t:'축별 비교', req:true, d:'BB에서 z·y·x 세 축 각각 k=3 보간 후 |Δφ| 비교. tri-axis aggregation이 합리적인 이유를 설명.' },
          { t:'임계값 sensitivity', req:false, d:'이진화 임계 thr∈{0.3…0.7} 각각의 복원 공극률 측정. 최적 임계는? |Δφ|=0이 곧 정확한 복원일까?' },
          { t:'Random sparse', req:false, d:'결정적 k=3 vs 무작위 33% 측정의 |Δφ| 비교. 어느 쪽 보간이 더 어려운가?' },
        ],
      },
      g2: {
        slides:22, cells:20, tryits:4,
        notebook:'W1_load_and_explore.ipynb',
        tasks:[
          { t:'실습 셀 sweep 수행', req:true, d:'노트북의 파라미터 sweep 셀들을 실행하고 결과를 본인 분석으로 정리.' },
          { t:'두 도메인 슬랩 비교', req:true, d:'BB·CastleGate porosity_profile(n_slabs=16) 두 곡선 겹쳐 그리기. 어느 쪽이 더 균일한가? std로 비교.' },
          { t:'α와 공극률 관계', req:false, d:'linear_interpolate_slice의 α를 0~1 sweep. α=0.5 공극률이 앞뒤 평균과 같은가?' },
          { t:'세 축 sparse 비교', req:false, d:'make_sparse의 axis를 0·1·2로 바꿔 측정 패턴 시각화 비교. 등방성이면 통계적으로 같아야 함.' },
        ],
      },
    },
    selfcheck: [
      'Voxel과 pixel을 한 문장으로 구분하면?',
      '"세 축 공극률 프로파일의 std가 작다"는 어떤 의미인가?',
      'k=5 sparse일 때 시간 절감률과 BB의 선형 보간 |Δφ|는?',
      'tri-axis aggregation은 어떤 가정 위에 서 있나? 깨지면?',
      '오늘의 "k vs |Δφ|" 곡선이 왜 딥러닝이 필요한지 어떻게 설명하나?',
    ],
    // page resources (driven generically by WeekFull)
    res: {
      deck: 'W1_deck.html',
      notebookHtml: 'notebooks/W1_load_and_explore.html',
      notebook: 'W1_load_and_explore.ipynb',
      utils: [
        { name:'dr_utils.py', meta:'클릭 시 .py 다운로드' },
      ],
      handout: { name:'W1_handout.md', meta:'탐구 과제 안내' },
      pptx: 'W1.pptx',
      codezip: 'w1_code.zip',
      data: {
        file:'data_w1.zip',
        title:'data_w1.zip — 256³ binary · 4 도메인',
        desc:'BB · CastleGate · Bentheimer · Parker (각 16 MB, zip ~4.5 MB).',
        tree:`<본인 작업 폴더>/
├ W1_load_and_explore.ipynb
├ dr_utils.py
└ data/        ← data_w1.zip의 .bin 파일을 여기에 압축 해제
  ├ BB_256.bin
  ├ CastleGate_256.bin
  ├ Bentheimer_256.bin
  └ Parker_256.bin`,
      },
      supp: [
        { icon:'book',     kind:'개념 풀이',        name:'W1_concept_notes.md',    meta:'voxel · normalize · Otsu · sparse 등' },
        { icon:'terminal', kind:'코드 walkthrough', name:'W1_code_walkthrough.md',  meta:'셀별 코드 설명 + 인자 변경 가이드' },
        { icon:'notebook', kind:'작은 예시 노트북',  name:'W1_extra_examples.ipynb', meta:'단계별 mini 예제 4개' },
      ],
      suppzip: 'w1_supplement.zip',
    },
  },

  // ---- W1 deep-dive: notebook walkthrough + dr_utils reference ----
  guide: {
    intro: 'W1의 핵심은 dr_utils.py가 제공하는 함수의 인자(parameter)를 바꿔가며 결과가 어떻게 달라지는지 관찰하고 해석하는 것입니다. 아래 가이드를 노트북 옆에 두고 따라가세요.',

    // notebook cell-by-cell flow
    notebook: {
      file: 'W1_load_and_explore.ipynb',
      cells: [
        { n:'01', kind:'setup', t:'환경 & 스타일 준비', code:"import sys; sys.path.insert(0, '..')\nfrom dr_utils import *\nsetup_plot_style()", d:'dr_utils를 불러오고 plot 스타일·한글 폰트를 등록합니다. 이 셀을 건너뛰면 ModuleNotFoundError·한글 깨짐이 납니다.' },
        { n:'02', kind:'io', t:'부피 로드', code:"bb = load_volume('data/BB_256.bin')\nprint(bb.shape, bb.dtype)", d:'256³ binary를 numpy 배열로 읽습니다. shape·dtype을 직접 확인하세요.' },
        { n:'03', kind:'view', t:'세 축 슬라이스 보기', code:"show_three_axis(bb, z=128)", d:'한 부피를 z·y·x 세 평면으로 시각화. [Try-it! ①]에서 인자를 바꿉니다.' },
        { n:'04', kind:'metric', t:'공극률 계산', code:"print(f'phi = {porosity(bb):.3f}')", d:'평균이 곧 φ. 도메인을 바꿔가며 값을 비교하세요.' },
        { n:'05', kind:'view', t:'슬랩별 공극률 프로파일', code:"prof = porosity_profile(bb, axis=0, n_slabs=16)\nplt.plot(prof)", d:'부피의 균일성을 본다. [Try-it! ②]에서 n_slabs·axis 변경.' },
        { n:'06', kind:'sparse', t:'Sparse 측정 시뮬레이션', code:"known, missing = make_sparse(bb, k=3, axis=0)\nprint(len(known), len(missing))", d:'측정/누락 인덱스를 나눕니다. [Try-it! ③]에서 k를 sweep.' },
        { n:'07', kind:'interp', t:'두 슬라이스 보간', code:"mid = linear_interpolate_slice(bb[0], bb[3], alpha=0.5)", d:'간격이 큰 두 슬라이스를 보간. [Try-it! ④]에서 간격을 키워 흐려짐을 관찰.' },
        { n:'08', kind:'recon', t:'B1 베이스라인 복원 & 평가', code:"recon = reconstruct_sparse_linear(bb, k=3)\nprint(porosity_error(recon, bb))", d:'sparse 부피를 선형 보간으로 전체 복원하고 |Δφ|로 오차를 측정합니다.' },
      ],
      tryits: [
        { n:'①', fn:'show_slice / show_three_axis', change:'axis · idx · cmap', observe:'방향·위치·색상에 따른 보기 차이' },
        { n:'②', fn:'porosity_profile', change:'n_slabs · axis', observe:'슬랩 수와 축 변화의 효과 (분해능 vs 안정성)' },
        { n:'③', fn:'make_sparse (k_values)', change:'k 값 리스트', observe:'측정 슬라이스 수와 시간 절감률' },
        { n:'④', fn:'linear_interpolate_slice', change:'z_before · z_after 간격', observe:'간격이 클수록 보간이 흐려짐' },
      ],
    },

    // dr_utils.py function reference
    utils: [
      { fn:'load_volume', group:'데이터 I/O', sig:'load_volume(path, shape=(256,256,256), dtype=uint8)',
        ret:'np.ndarray (Z,Y,X)', desc:'header 없는 raw binary를 3D voxel 부피로 읽습니다.',
        params:[
          { p:'path', d:'.bin 파일 경로' },
          { p:'shape', d:'3D 형상. W1 데이터는 256³', try:'(128,128,128)로 바꾸면? → ValueError. voxel 개수가 안 맞기 때문.' },
          { p:'dtype', d:'uint8 (0=solid, 1=pore)' },
        ] },
      { fn:'porosity', group:'평가', sig:'porosity(binary_volume) → float',
        ret:'φ ∈ [0,1]', desc:'공극률 = pore voxel 수 / 전체. 값이 0/1뿐이라 mean()이 곧 φ.',
        params:[ { p:'binary_volume', d:'이진 부피', try:'세 도메인에 각각 적용해 φ를 비교해 보세요.' } ] },
      { fn:'show_three_axis', group:'시각화', sig:'show_three_axis(volume, z=None, y=None, x=None)',
        ret:'fig, axes', desc:'한 부피를 z·y·x 세 평면으로 동시에 시각화. None이면 중앙.',
        params:[
          { p:'z / y / x', d:'각 축의 슬라이스 위치', try:'z=0·128·255 비교 → 가장자리 vs 중앙 차이는?' },
        ] },
      { fn:'porosity_profile', group:'시각화', sig:'porosity_profile(volume, axis=0, n_slabs=16)',
        ret:'np.ndarray (n_slabs,)', desc:'부피를 axis 방향 n_slabs개 슬랩으로 나눠 각 슬랩 공극률.',
        params:[
          { p:'axis', d:'0=z · 1=y · 2=x', try:'세 축 프로파일이 비슷한가? 다르면 등방성이 깨진 것.' },
          { p:'n_slabs', d:'분할 수', try:'4·16·64로 바꿔보면 분해능 vs 통계 안정성의 trade-off.' },
        ] },
      { fn:'make_sparse', group:'Sparse', sig:'make_sparse(volume, k=3, axis=0)',
        ret:'known_idx, missing_idx', desc:'axis 방향으로 k개마다 1개만 측정 → 측정/누락 인덱스 분리.',
        params:[
          { p:'k', d:'슬라이스 측정 간격', try:'k=1·2·3·5·7·10 → 측정 수·시간 절감률이 어떻게 변하나?' },
          { p:'axis', d:'측정 방향', try:'등방성이라면 어느 축이든 통계적으로 비슷해야 함.' },
        ] },
      { fn:'linear_interpolate_slice', group:'보간', sig:'linear_interpolate_slice(before, after, alpha)',
        ret:'np.ndarray 2D (0~1)', desc:'두 슬라이스 사이를 α로 선형 혼합. (1−α)·before + α·after.',
        params:[
          { p:'alpha', d:'보간 위치 [0,1]', try:'α=0·0.25·0.5·0.75·1 비교. 두 슬라이스가 다를수록 어디서 깨지나?' },
        ] },
      { fn:'reconstruct_sparse_linear', group:'보간', sig:'reconstruct_sparse_linear(volume, k=3, axis=0)',
        ret:'np.ndarray (복원 부피)', desc:'sparse 측정의 누락 슬라이스를 모두 선형 보간 → 본 연구의 베이스라인 B1.',
        params:[
          { p:'k', d:'sparse 간격', try:'k=1→10 sweep하며 |Δφ| plot. 오차가 급증하는 “실용 한계 k”는?' },
        ] },
      { fn:'porosity_error', group:'평가', sig:'porosity_error(reconstructed, original)',
        ret:'|Δφ| float', desc:'복원 공극률 오차 = |φ(복원) − φ(원본)|. 본 연구의 핵심 평가지표.',
        params:[ { p:'reconstructed / original', d:'복원·원본 부피', try:'|Δφ|=0이면 정말 “정확한 복원”일까? 구조는 다를 수 있습니다.' } ] },
    ],

    // parameter mindset
    playbook: [
      { t:'바꾼다', d:'한 번에 인자 하나만 바꿉니다. 무엇이 원인인지 분리되어야 관찰이 됩니다.', icon:'sliders' },
      { t:'관찰한다', d:'그림·숫자(φ·|Δφ|·std)가 어떻게 변하는지 기록합니다. 한 문장이면 충분합니다.', icon:'target' },
      { t:'해석한다', d:'“왜” 그렇게 변했는지 물리/구조로 설명해 봅니다. 이게 진짜 학습입니다.', icon:'spark' },
    ],
  },

  // ===================================================================
  //  W2 — Deep Learning 입문 (UNet · pix2pix · mini UNet 학습)
  // ===================================================================
  w2: {
    flow: [
      { a:'강의 + 학습 원리·UNet 구조',          src:'슬라이드 1–11' },
      { a:'노트북 실행 + 구조·데이터 분석',       src:'W2_deep_learning_intro.ipynb' },
      { a:'mini UNet 직접 학습 + 곡선 해석',      src:'노트북 §4 학습 · PRESET' },
      { a:'W1 baseline 대비 평가 + cross-domain', src:'노트북 §5 평가' },
      { a:'탐구 과제 안내 + W3 예고',             src:'handout §5 탐구 과제' },
    ],
    groups: {
      g1: {
        slides:26, cells:24, tryits:6,
        notebook:'W2_deep_learning_intro.ipynb',
        tasks:[
          { t:'preset & 모델 크기', req:true, d:'fast·standard 비교에 더해 train_custom(base=…)로 모델 크기를 직접 바꿔 파라미터 ↔ |Δφ|·SSIM ↔ 학습시간 trade-off 곡선을 그리기. 학습 곡선에서 overfitting 징후를 찾아 설명.' },
          { t:'Cross-domain 일반화', req:true, d:'4 도메인 평가표 + 시각화. 추가로 각 도메인의 Linear 대비 개선폭을 계산하고, 일반화가 깨지는 도메인과 원인 가설(공극률·구조·등방성)을 정량 근거와 함께 제시.' },
          { t:'복합 손실 함수 (도전)', req:false, d:'§6.5-B 확장 — L1/MSE 비교에 더해 L1 + λ·(1−SSIM) 복합 손실을 직접 구현, λ 를 바꿔 선명도와 |Δφ| 의 trade-off를 분석.' },
          { t:'k 일반화 & 실패 모드 (심화)', req:false, d:'§6.5-C/D 확장 — 학습 k≠평가 k 성능 지도 + per-slice 오차가 큰 슬라이스의 구조적 공통점으로 모델의 한계를 서술. (lr sweep으로 발산/수렴도 함께.)' },
        ],
      },
      g2: {
        slides:26, cells:24, tryits:6,
        notebook:'W2_deep_learning_intro.ipynb',
        tasks:[
          { t:'노트북 전체 실행 + 심화 A', req:true, d:'환경 준비부터 평가까지 모든 셀을 실행하고, §6.5-A train_custom을 한 번 직접 돌려본 뒤 결과(파라미터·학습 곡선·|Δφ|·SSIM)를 본인 말로 정리.' },
          { t:'preset 두 개 비교', req:true, d:'fast와 standard 두 preset의 학습 시간과 |Δφ|·SSIM을 표로 비교. 어느 쪽이 본인 환경에 맞는지 근거와 함께.' },
          { t:'손실 바꿔보기', req:false, d:'§6.5-B에서 criterion을 L1 → MSE로 바꿔 학습 곡선과 결과가 어떻게 달라지는지 관찰·설명.' },
          { t:'cross-domain 관찰', req:false, d:'BB 학습 모델을 CastleGate에 평가. 같은 모델인데 결과가 왜 달라지는지, per-slice 오차도 살펴 한두 문장으로.' },
        ],
      },
    },
    selfcheck: [
      'skip-connection을 제거하면 복원의 어떤 성질(경계·detail)이 먼저 무너지나? 그 이유는?',
      'L1을 L2(MSE)로 바꾸면 학습 안정성과 선명도가 어떻게 달라지고, 그건 손실의 어떤 성질 때문인가?',
      'base를 키워 파라미터를 늘렸는데 성능이 더 나빠졌다 — 학습 곡선의 어떤 신호로 overfitting을 진단하나?',
      '학습 k=3 모델을 k=7로 평가하면 성능이 급락하는 이유는? 어떻게 완화할 수 있나?',
      'per-slice |Δφ|가 특정 구간에서 치솟는다면, 그 슬라이스들의 구조적 공통점으로 무엇을 의심하나?',
    ],
    res: {
      deck: 'W2_deck.html',
      notebookHtml: 'notebooks/W2_deep_learning_intro.html',
      notebook: 'W2_deep_learning_intro.ipynb',
      utils: [
        { name:'dr_utils.py',    meta:'W1과 동일 (평가 지표 포함)' },
        { name:'model_utils.py', meta:'UNetMini · SliceDataset · 학습 루프' },
      ],
      handout: { name:'W2_handout.md', meta:'학습 목표 · PRESET · 탐구 과제' },
      pptx: 'W2.pptx',
      codezip: 'w2_code.zip',
      data: {
        file:'data_w2.zip',
        title:'data_w2.zip — 256³ binary · 4 도메인',
        desc:'BB · CastleGate · Bentheimer · Parker (각 16 MB, zip ~4.5 MB). W1과 동일한 데이터.',
        tree:`<본인 작업 폴더>/
├ W2_deep_learning_intro.ipynb
├ dr_utils.py
├ model_utils.py
└ data/        ← data_w2.zip의 .bin 파일을 여기에 압축 해제
  ├ BB_256.bin
  ├ CastleGate_256.bin
  ├ Bentheimer_256.bin
  └ Parker_256.bin`,
      },
      supp: [
        { icon:'book',     kind:'개념 풀이',        name:'W2_concept_notes.md',    meta:'신경망 학습 · UNet · pix2pix · loss 등' },
        { icon:'terminal', kind:'코드 walkthrough', name:'W2_code_walkthrough.md',  meta:'셀별 코드 설명 + 인자 변경 가이드' },
        { icon:'notebook', kind:'작은 예시 노트북',  name:'W2_extra_examples.ipynb', meta:'단계별 mini 예제' },
      ],
      suppzip: 'w2_supplement.zip',
    },
    // ---- W2 deep-dive: notebook walkthrough + model_utils reference ----
    guide: {
      utilsLabel: 'model_utils.py',
      intro: 'W2의 핵심은 model_utils.py가 제공하는 UNet·Dataset·학습 함수를 직접 호출하고, PRESET·loss·learning rate·k 같은 인자를 바꿔가며 학습 곡선·|Δφ|·SSIM이 어떻게 달라지는지 관찰·해석하는 것입니다. 아래 가이드를 노트북 옆에 두고 따라가세요.',
      notebook: {
        file: 'W2_deep_learning_intro.ipynb',
        cells: [
          { n:'01', kind:'setup', t:'환경 & import', code:"sys.path.insert(0, '../helpers')\nfrom dr_utils import *\nfrom model_utils import *\nDEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'", d:'dr_utils와 model_utils를 불러오고 device(cpu/cuda)를 정합니다. torch 미설치 시 pip install torch torchvision.' },
          { n:'02', kind:'recap', t:'W1 baseline 복습 (B1 k=5)', code:"bb = load_volume(DATA / 'BB_256.bin')\nrec_l = reconstruct_sparse_linear(bb, k=5)\nm_baseline = summarize_metrics(rec_l, bb, label='B1 Linear k=5')", d:'우리가 이길 대상 — W1의 선형 보간 베이스라인 |Δφ|·SSIM을 먼저 측정해 둡니다.' },
          { n:'03', kind:'arch', t:'UNetMini 구조 · 파라미터 비교', code:"for name, p in TRAINING_PRESETS.items():\n    m = UNetMini(in_ch=2, base=p['base'])\n    print(name, count_parameters(m))", d:'세 preset의 모델 크기를 비교하고 UNetMini 구조(encoder·decoder·skip)를 출력합니다.' },
          { n:'04', kind:'data', t:'SliceDataset — sparse triplet', code:"ds = SliceDataset(bb, k=5, patch_size=64,\n                  n_patches_per_triplet=4, augment=True)\nx, y = ds[0]   # x:(2,H,W) before·after · y:(1,H,W) middle", d:'누락 슬라이스마다 (before, middle, after) triplet을 만들어 학습 sample을 구성. 한 sample을 시각화합니다.' },
          { n:'05', kind:'train', t:'학습 — PRESET 선택', code:"PRESET = 'fast'   # 'standard' / 'full' 도 가능\nmodel, history = train_quick(bb, k=5, preset=PRESET, device=DEVICE)", d:'한 줄로 mini UNet 학습. [Try-it! ①]에서 preset을 바꿔 시간·품질 trade-off를 관찰.' },
          { n:'06', kind:'train', t:'학습 곡선 + 체크포인트', code:"plt.plot(history)   # Train L1 loss\nsave_ckpt(model, f'unet_mini_{PRESET}.pth', meta={'preset':PRESET})", d:'loss 곡선이 꾸준히 내려가는지 확인하고, 학습된 가중치를 저장(W3에서 재사용).' },
          { n:'07', kind:'metric', t:'평가 — Linear vs UNet', code:"res = evaluate_model(model, bb, k=5, device=DEVICE)\nprint(res['dphi_pp'], res['ssim'])   # vs m_baseline", d:'전체 부피의 누락 슬라이스를 모델로 복원해 |Δφ|·SSIM을 B1 Linear와 직접 비교합니다.' },
          { n:'08', kind:'view', t:'시각 비교 (GT/Linear/UNet/diff)', code:"# z=62: GT · B1 Linear · UNet · |GT−UNet|\naxes[3].imshow(np.abs(bb[z]-res['recon'][z]), cmap='hot')", d:'한 슬라이스를 네 패널로 비교 — 숫자뿐 아니라 어디서 좋아졌는지 눈으로 확인.' },
          { n:'09', kind:'cross', t:'Cross-domain 평가', code:"for name in ['CastleGate','Bentheimer','Parker']:\n    vol = load_volume(DATA / f'{name}_256.bin')\n    evaluate_model(model, vol, k=5, device=DEVICE)", d:'BB로 학습한 모델을 다른 도메인에 zero-shot 평가. [Try-it! ②] — 일반화를 관찰.' },
          { n:'10', kind:'train', t:'§6.5-A 학습 루프 직접 제어', code:"def train_custom(volume, k=5, base=8, epochs=20,\n                 lr=1e-3, criterion=None):\n    ...   # train_quick을 펼친 형태\nm, h = train_custom(bb, base=8, lr=1e-3)", d:'편의 함수에 가려졌던 학습 루프를 펼쳐 손실·lr·구조를 직접 바꿉니다. [Try-it! ①④]' },
          { n:'11', kind:'train', t:'§6.5-B 손실 함수 비교', code:"for name, crit in [('L1', nn.L1Loss()),\n                   ('MSE', nn.MSELoss())]:\n    m, h = train_custom(bb, criterion=crit)", d:'L1 vs MSE 학습 곡선·|Δφ|·SSIM 비교. 복합 손실(L1+SSIM)까지 직접 구현 도전. [Try-it! ③]' },
          { n:'12', kind:'cross', t:'§6.5-C k 일반화', code:"model_k3, _ = train_custom(bb, k=3)\nfor k_eval in [2, 3, 5, 7]:\n    evaluate_model(model_k3, bb, k=k_eval)", d:'학습 k와 평가 k가 다를 때 성능 변화 — sparsity 일반화를 관찰. [Try-it! ⑤]' },
          { n:'13', kind:'view', t:'§6.5-D per-slice 실패 분석', code:"per_slice = [abs(recon[z].mean()-bb[z].mean())\n             for z in range(256)]\nworst = np.argsort(per_slice)[-5:]", d:'슬라이스별 |Δφ|를 그려 모델이 어디서 실패하는지 찾고 구조적 원인을 분석. [Try-it! ⑥]' },
        ],
        tryits: [
          { n:'①', fn:'train_custom (base·epochs)', change:'preset fast/standard + base 8↔16 직접 조절', observe:'파라미터 ↔ |Δφ|·SSIM ↔ 학습시간 trade-off, overfitting 징후' },
          { n:'②', fn:'evaluate_model (도메인)', change:'BB 모델을 4개 도메인에 평가', observe:'학습 도메인 밖 일반화 + 도메인별 Linear 대비 개선폭' },
          { n:'③', fn:'criterion (loss)', change:'L1 → MSE → L1+λ(1−SSIM) 복합', observe:'손실 종류에 따른 선명도·안정성·|Δφ| 변화' },
          { n:'④', fn:'Adam (learning rate)', change:'lr ∈ {1e-4, 5e-4, 1e-3, 5e-3}', observe:'학습 곡선 — 너무 작으면 느림, 너무 크면 NaN 발산' },
          { n:'⑤', fn:'k 일반화', change:'학습 k=3 → 평가 k∈{2,3,5,7}', observe:'학습 k에서 멀어질수록 성능 변화 (sparsity 일반화)' },
          { n:'⑥', fn:'per-slice 오차', change:'|Δφ| per slice 계산·정렬', observe:'모델이 실패하는 슬라이스의 구조적 공통점' },
        ],
      },
      utils: [
        { fn:'UNetMini', group:'모델', sig:'UNetMini(in_ch=2, base=16)',
          ret:'nn.Module', desc:'mini UNet — encoder/decoder/skip. 입력 2채널(before·after) → 출력 1채널(middle, sigmoid).',
          params:[
            { p:'in_ch', d:'입력 채널 수. 본 과제는 2 (앞·뒤 슬라이스).' },
            { p:'base', d:'첫 채널 폭 = 모델 크기', try:'base=8(~29K) vs 16(~117K). 큰 모델이 항상 더 좋은지 학습해 비교.' },
          ] },
        { fn:'count_parameters', group:'모델', sig:'count_parameters(model) → int',
          ret:'학습 파라미터 수', desc:'requires_grad 파라미터 총합. 모델 크기를 한눈에 비교할 때.',
          params:[ { p:'model', d:'nn.Module', try:'세 preset의 base별 파라미터 수를 출력해 비교.' } ] },
        { fn:'SliceDataset', group:'데이터셋', sig:'SliceDataset(volume, k=3, patch_size=64, n_patches_per_triplet=4, augment=True)',
          ret:'torch Dataset', desc:'sparse triplet (before, middle, after)을 자동 생성. 누락 슬라이스 하나마다 한 sample.',
          params:[
            { p:'k', d:'sparse 측정 간격', try:'k를 키우면 누락이 많아져 학습이 어려워집니다.' },
            { p:'patch_size', d:'학습 patch 크기 (기본 64)', try:'None이면 전체 슬라이스. 키우면 메모리·시간↑.' },
            { p:'augment', d:'flip 증강 on/off', try:'False로 끄면 일반화에 어떤 영향이 있나?' },
          ] },
        { fn:'train_quick', group:'학습', sig:'train_quick(volume, k=3, preset="fast", device="cpu")',
          ret:'(model, history)', desc:'PRESET 하나로 mini UNet을 학습. 내부에서 SliceDataset·Adam·L1Loss를 구성.',
          params:[
            { p:'preset', d:"'fast' · 'standard' · 'full'", try:'시간/품질 trade-off — [Try-it! ①]의 핵심.' },
            { p:'k', d:'sparse 간격 (W1과 동일 정의)', try:'baseline과 같은 k로 맞춰야 공정 비교.' },
            { p:'device', d:"'cpu' 또는 'cuda'", try:'GPU가 있으면 cuda로 크게 가속.' },
          ] },
        { fn:'evaluate_model', group:'평가', sig:'evaluate_model(model, volume, k=3) → dict',
          ret:'{dphi_pp, ssim, recon}', desc:'전체 부피의 누락 슬라이스를 모델로 복원하고 |Δφ|(%p)·SSIM을 계산.',
          params:[
            { p:'volume', d:'평가 대상 부피', try:'학습과 다른 도메인을 넣어 cross-domain 일반화 측정 — [Try-it! ②].' },
            { p:'k', d:'평가 sparse 간격', try:'학습 때와 같은 k로 평가해야 공정합니다.' },
          ] },
        { fn:'ssim_3d_mean', group:'평가', sig:'ssim_3d_mean(recon, original) → float',
          ret:'평균 SSIM', desc:'복원/원본의 슬라이스별 구조 유사도(SSIM) 평균. W2부터 추가되는 핵심 지표.',
          params:[ { p:'recon / original', d:'복원·원본 부피', try:'|Δφ|=0이어도 SSIM이 낮을 수 있습니다 — 둘을 함께 봐야 하는 이유.' } ] },
        { fn:'summarize_metrics', group:'평가', sig:'summarize_metrics(recon, original, label="")',
          ret:'dict (dphi · ssim · dsa)', desc:'|Δφ|·SSIM·|ΔSA|를 한 번에 계산하고 라벨과 함께 출력. baseline 비교에 편리.',
          params:[ { p:'label', d:'출력에 붙는 이름', try:"'B1 Linear k=5' 처럼 비교 대상을 명확히." } ] },
        { fn:'save_ckpt / load_ckpt', group:'체크포인트', sig:'save_ckpt(model, path, meta) · load_ckpt(path)',
          ret:'저장 / (model, meta)', desc:'학습된 모델 가중치를 저장·로드. meta에 base가 있으면 로드 시 자동 사용.',
          params:[ { p:'path', d:'.pth 경로', try:'W3에서 이 체크포인트를 불러와 GAN으로 이어 학습합니다.' } ] },
      ],
      playbook: [
        { t:'바꾼다', d:'한 번에 인자 하나(preset·loss·lr·k)만 바꿉니다. 원인이 분리되어야 관찰이 됩니다.', icon:'sliders' },
        { t:'관찰한다', d:'학습 곡선·|Δφ|·SSIM·학습 시간이 어떻게 변하는지 기록합니다. 한 문장이면 충분합니다.', icon:'target' },
        { t:'해석한다', d:'“왜” 그렇게 변했는지 모델 크기·손실 성질·일반화로 설명해 봅니다. 이게 진짜 학습입니다.', icon:'spark' },
      ],
    },
  },

  setup: {
    env:'rock',
    py:'3.10+',
    steps:[
      { t:'Conda 환경 생성', cmd:'conda create -n rock python=3.10 -y\nconda activate rock' },
      { t:'필수 패키지 설치', cmd:'pip install numpy matplotlib jupyter' },
      { t:'동작 확인', cmd:'python3 -c "import numpy, matplotlib; print(\'OK\')"' },
      { t:'노트북 실행', cmd:'cd week1/notebooks/\njupyter notebook W1_load_and_explore.ipynb' },
    ],
    pkgs:['numpy','matplotlib','jupyter','scipy','torch · torchvision (W2~)'],
    troubles:[
      { s:'FileNotFoundError: BB_256.bin', f:'노트북과 같은 폴더에 data/ 가 있고 그 안에 .bin 이 풀렸는지 확인' },
      { s:'ValueError: 파일 크기 불일치', f:'load_volume의 shape / dtype 인자 확인' },
      { s:'ModuleNotFoundError: dr_utils', f:'dr_utils.py · model_utils.py 가 노트북과 같은 폴더에 있는지 확인' },
      { s:'ModuleNotFoundError: torch (W2~)', f:'pip install torch torchvision — W2 딥러닝부터 필요' },
      { s:'matplotlib 한글 깨짐', f:'첫 셀 setup_plot_style() 실행 — Pretendard 자동 등록' },
    ],
  },
};

// 현재 진행 주차 = status 'now' 인 (마지막) 주차, 없으면 공개된 마지막 주차 (네비·홈에서 사용)
// 'now'를 여러 주차에 두면 가장 뒤 주차가 현재로 선택됨 → 다음 주 승급 시에도 안전
window.COURSE.currentWeek = () =>
  window.COURSE.weeks.filter(w => w.status === 'now').slice(-1)[0]
  || window.COURSE.weeks.filter(w => w.available).slice(-1)[0]
  || window.COURSE.weeks[0];
