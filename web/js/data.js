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
    g1: { id:'g1', name:'1조', tag:'Advanced', track:'심화 트랙', desc:'심화 탐구 트랙 — 도메인·축 비교 등 확장 과제를 추가한다.', accent:'navy' },
    g2: { id:'g2', name:'2조', tag:'Core',     track:'기본 트랙', desc:'개념 중심 트랙 — 단계별 [Try-it!]로 기초를 다진다.', accent:'orange' },
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
      summary:'Micro-CT voxel 데이터를 직접 열고, 전처리(normalize·Otsu)와 슬라이스 보간 문제를 정의. 선형/Cubic 보간으로 이웃 거리 k 를 키우며 |Δφ|·SSIM 측정.',
      concepts:['Voxel · Slice','전처리','Porosity φ','Sparse imaging (k)','Linear · Cubic','|Δφ|·SSIM'],
      nonDL:true,
    },
    {
      n:2, status:'done', slug:'w2', available:true,
      title:'Deep Learning 입문 — UNet · pix2pix 구조',
      en:'UNet · pix2pix · Train',
      summary:'슬라이스 보간을 학습 가능한 함수로 정식화한다. UNet 구조와 pix2pix(조건부 image-to-image) 흐름을 코드로 따라가고 mini UNet을 학습한다. 학습 루프·손실·모델 크기를 수정하며 cross-domain 일반화와 실패 모드를 분석한다.',
      concepts:['UNet · skip','pix2pix 흐름','학습 루프 직접 제어','L1/MSE/복합 손실','k-regime crossover'],
      nonDL:false,
      plan:[
        '이웃 슬라이스 입력 dataset 구성 (양옆 t±k → 가운데 t)',
        'UNet/pix2pix generator 구조 분석',
        '학습 루프 직접 실행 + 학습 곡선 해석',
        'W1 classical baseline 대비 정량 비교',
      ],
      newUtils:['SliceDataset','UNetMini','train_quick','evaluate_model'],
      prep:['pip install torch torchvision','W1 baseline 결과'],
    },
    {
      n:3, status:'done', slug:'w3', available:true,
      title:'적대적 학습 · pix2pix GAN',
      en:'Conditional GAN',
      summary:'L1 손실은 평균의 함정으로 경계를 회색으로 번지게 한다. 두 번째 신경망 판별자(Discriminator)를 붙여 조건부 pix2pix GAN으로 확장하고, 처음부터·W2 이어받기 두 경로로 학습한다. 안정화(warmup·작은 판별자·spectral norm·작은 λ)와 좋은 숫자와 좋은 복원을 구분하는 평가를 다룬다. 이번 주는 균질한 Bentheimer 사암을 k=2로 실습하는 두 조 공통(통합) 트랙이다.',
      concepts:['GAN','Discriminator','hinge loss','조건부·PatchGAN','L1+SSIM+GAN 균형','학습 안정화'],
      nonDL:false,
      plan:[
        '평균의 함정: L1이 회색을 내는 이유 (연속 출력으로 확인)',
        '판별자·hinge 손실·조건부·PatchGAN·spectral norm',
        'GAN 학습 (처음부터 · W2 이어받기)',
        'λ sweep + 정직한 평가 (구조는 픽셀 지표 밖)',
      ],
      newUtils:['PatchDiscriminatorMini','train_gan','d_hinge_loss / g_hinge_loss','ssim_loss','predict_continuous'],
      prep:['W2 학습된 mini UNet 체크포인트','pip install torch torchvision'],
    },
    {
      n:4, status:'now', slug:'w4', available:true,
      title:'딥러닝 아키텍처 비교',
      en:'Transformer · 3D · diffusion',
      summary:'지금까지 우리 pix2pix 모델은 손실·입력·GAN(W3)으로 개선해 왔고 구조의 뼈대는 2D 합성곱이었다. 이번 주는 우리 접근이 좋은지 확인하기 위해, 대안 구조(Transformer 계열 Swin·3D CNN·diffusion)를 비교군으로 두고 같은 데이터·같은 입력 정보·같은 예산에서 비교한다. attention 수식을 숫자로 직접 계산하고, 공정 비교로 파라미터·시간·정확도의 trade-off 를 읽는다. 대규모 결과에서 우리 모델(MAPS)이 비교군을 앞서는 것을 확인한다.',
      concepts:['Attention · Q·K·V','창 분할 · Swin','3D Conv · 정보 누출','diffusion','공정 비교 · 비교군'],
      nonDL:false,
      plan:[
        '개선 축(우리 방법) vs 검증 축(비교군) 구분',
        'attention 수식(QKᵀ/√d → softmax → V)을 직접 계산',
        'SwinUNetMini · UNet3DMini 구축 · 공정 입력 설계',
        '세 비교 구조 + 우리 방식(GAN)을 같은 예산에서 비교',
      ],
      newUtils:['SwinUNetMini','UNet3DMini','benchmark_models'],
      prep:['pip install torch torchvision','W2·W3와 동일 환경'],
    },
    {
      n:5, status:'next', slug:'w5', available:false,
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
    { term:'Isotropy',     ko:'세 축 방향이 통계적으로 같은 성질. 이 코스의 핵심 가정.', tag:'가정' },
    { term:'Sparse imaging',ko:'모든 슬라이스를 측정하지 않고 일부만 측정하는 전략.', tag:'핵심' },
    { term:'k (이웃 거리)',  ko:'예측에 쓰는 양옆 이웃까지의 거리. 슬라이스 t 를 t±k 에서 예측.', tag:'핵심' },
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
          { t:'도메인별 난이도 비교', req:false, d:'4 도메인의 k-sweep 곡선(|Δφ|·SSIM)을 겹쳐, 어느 사암이 보간이 가장 어려운지 정량 비교.' },
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
    intro: 'W1의 핵심은 dr_utils.py가 제공하는 함수의 인자(parameter)를 바꿔가며 결과가 어떻게 달라지는지 관찰하고 해석하는 것이다. 아래 가이드를 노트북 옆에 두고 따라가세요.',

    // notebook cell-by-cell flow
    notebook: {
      file: 'W1_load_and_explore.ipynb',
      cells: [
        { n:'01', kind:'setup', t:'환경 & 스타일 준비', code:"import sys; sys.path.insert(0, '..')\nfrom dr_utils import *\nsetup_plot_style()", d:'dr_utils를 불러오고 plot 스타일·한글 폰트를 등록한다. 이 셀을 건너뛰면 ModuleNotFoundError·한글 깨짐이 납니다.' },
        { n:'02', kind:'io', t:'부피 로드', code:"bb = load_volume('data/BB_256.bin')\nprint(bb.shape, bb.dtype)", d:'256³ binary를 numpy 배열로 읽는다. shape·dtype을 직접 확인하세요.' },
        { n:'03', kind:'view', t:'세 축 슬라이스 보기', code:"show_three_axis(bb, z=128)", d:'한 부피를 z·y·x 세 평면으로 시각화. [Try-it! ①]에서 인자를 바꾼다.' },
        { n:'04', kind:'metric', t:'공극률 계산', code:"print(f'phi = {porosity(bb):.3f}')", d:'평균이 곧 φ. 도메인을 바꿔가며 값을 비교하세요.' },
        { n:'05', kind:'view', t:'슬랩별 공극률 프로파일', code:"prof = porosity_profile(bb, axis=0, n_slabs=16)\nplt.plot(prof)", d:'부피의 균일성을 본다. [Try-it! ②]에서 n_slabs·axis 변경.' },
        { n:'06', kind:'interp', t:'이웃 거리 k 설정', code:"t, k = 62, 3   # 슬라이스 t 를 t±k 에서 예측\n[bb[t-k], bb[t+k]]  →  bb[t]", d:'슬라이스 t 를 양옆 이웃 t±k 에서 예측한다. [Try-it! ③]에서 k 를 sweep.' },
        { n:'07', kind:'interp', t:'두 슬라이스 보간', code:"mid = linear_interpolate_slice(bb[0], bb[3], alpha=0.5)", d:'간격이 큰 두 슬라이스를 보간. [Try-it! ④]에서 간격을 키워 흐려짐을 관찰.' },
        { n:'08', kind:'recon', t:'B1 베이스라인 예측 & 평가', code:"rec = predict_linear_k(bb, 3)\nprint(eval_targets(rec, bb, 3))", d:'각 슬라이스를 t±k 에서 예측하고 |Δφ|·SSIM 으로 평가한다.' },
      ],
      tryits: [
        { n:'①', fn:'show_slice / show_three_axis', change:'axis · idx · cmap', observe:'방향·위치·색상에 따른 보기 차이' },
        { n:'②', fn:'porosity_profile', change:'n_slabs · axis', observe:'슬랩 수와 축 변화의 효과 (분해능 vs 안정성)' },
        { n:'③', fn:'predict_linear_k (k)', change:'이웃 거리 k = 1·2·3·5·7', observe:'k 가 커질수록 |Δφ|↑ · SSIM↓ (예측이 멀어짐)' },
        { n:'④', fn:'linear_interpolate_slice', change:'z_before · z_after 간격', observe:'간격이 클수록 보간이 흐려짐' },
      ],
    },

    // dr_utils.py function reference
    utils: [
      { fn:'load_volume', group:'데이터 I/O', sig:'load_volume(path, shape=(256,256,256), dtype=uint8)',
        ret:'np.ndarray (Z,Y,X)', desc:'header 없는 raw binary를 3D voxel 부피로 읽는다.',
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
      { fn:'predict_linear_k', group:'보간', sig:'predict_linear_k(volume, k)',
        ret:'np.ndarray (복원 부피)', desc:'각 슬라이스 t 를 양옆 이웃 t±k 의 평균으로 예측. k = 이웃 거리.',
        params:[
          { p:'k', d:'이웃 거리', try:'k=1·2·3·5·7 → k 가 커질수록 |Δφ|·SSIM 이 어떻게 변하나?' },
        ] },
      { fn:'linear_interpolate_slice', group:'보간', sig:'linear_interpolate_slice(before, after, alpha)',
        ret:'np.ndarray 2D (0~1)', desc:'두 슬라이스 사이를 α로 선형 혼합. (1−α)·before + α·after.',
        params:[
          { p:'alpha', d:'보간 위치 [0,1]', try:'α=0·0.25·0.5·0.75·1 비교. 두 슬라이스가 다를수록 어디서 깨지나?' },
        ] },
      { fn:'eval_targets', group:'평가', sig:'eval_targets(recon, original, k)',
        ret:'{dphi_pp, ssim}', desc:'예측한 슬라이스만 대상으로 |Δφ|(%p)·SSIM 을 계산.',
        params:[
          { p:'k', d:'이웃 거리', try:'predict_linear_k(bb, k) 와 함께 k=1·2·3·5·7 곡선을 그려보세요.' },
        ] },
      { fn:'porosity_error', group:'평가', sig:'porosity_error(reconstructed, original)',
        ret:'|Δφ| float', desc:'복원 공극률 오차 = |φ(복원) − φ(원본)|. 이 코스의 핵심 평가지표.',
        params:[ { p:'reconstructed / original', d:'복원·원본 부피', try:'|Δφ|=0이면 정말 “정확한 복원”일까? 구조는 다를 수 있다.' } ] },
    ],

    // parameter mindset
    playbook: [
      { t:'바꾼다', d:'한 번에 인자 하나만 바꾼다. 무엇이 원인인지 분리되어야 관찰이 된다.', icon:'sliders' },
      { t:'관찰한다', d:'그림·숫자(φ·|Δφ|·std)가 어떻게 변하는지 기록한다. 한 문장이면 충분하다.', icon:'target' },
      { t:'해석한다', d:'“왜” 그렇게 변했는지 물리/구조로 설명한다. 이것이 실제 학습이다.', icon:'spark' },
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
          { t:'k-regime crossover & 실패 모드 (심화)', req:false, d:'§6.5-C/D 확장 — UNet이 linear를 이기는 k 영역을 직접 지도로(작은 k=UNet, 큰 k=linear) + per-slice 오차가 큰 슬라이스의 구조적 공통점으로 한계를 서술. (lr sweep으로 발산/수렴도.)' },
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
      deck2: 'W2_unet_anatomy.html',
      deck2Label: 'U-Net 구조와 학습 원리',
      deck2Meta: 'U-Net 구조·학습·예측 원리 심화 (35슬라이드)',
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
      intro: 'W2의 핵심은 model_utils.py가 제공하는 UNet·Dataset·학습 함수를 직접 호출하고, PRESET·loss·learning rate·k 같은 인자를 바꿔가며 학습 곡선·|Δφ|·SSIM이 어떻게 달라지는지 관찰·해석하는 것이다. 아래 가이드를 노트북 옆에 두고 따라가세요.',
      notebook: {
        file: 'W2_deep_learning_intro.ipynb',
        cells: [
          { n:'01', kind:'setup', t:'환경 & import', code:"sys.path.insert(0, '../helpers')\nfrom dr_utils import *\nfrom model_utils import *\nDEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'", d:'dr_utils와 model_utils를 불러오고 device(cpu/cuda)를 정한다. torch 미설치 시 pip install torch torchvision.' },
          { n:'02', kind:'recap', t:'W1 baseline 복습 (B1 k=1)', code:"bb = load_volume(DATA / 'BB_256.bin')\nrec_l = predict_linear_k(bb, 1)\nm_baseline = eval_targets(rec_l, bb, 1)", d:'우리가 이길 대상 — W1의 선형 보간 베이스라인 |Δφ|·SSIM을 먼저 측정해 둡니다.' },
          { n:'03', kind:'arch', t:'UNetMini 구조 · 파라미터 비교', code:"for name, p in TRAINING_PRESETS.items():\n    m = UNetMini(in_ch=2, base=p['base'])\n    print(name, count_parameters(m))", d:'세 preset의 모델 크기를 비교하고 UNetMini 구조(encoder·decoder·skip)를 출력한다.' },
          { n:'04', kind:'data', t:'SliceDataset — 이웃 입력', code:"ds = SliceDataset(bb, k=1, patch_size=64,\n                  n_patches_per_triplet=4, augment=True)\nx, y = ds[0]   # x:(2,H,W)=[t-k,t+k] · y:(1,H,W)=t", d:'슬라이스 t 를 양옆 이웃 t±k 에서 예측하도록 학습 sample 을 구성. 한 sample 을 시각화한다.' },
          { n:'05', kind:'train', t:'학습 — PRESET 선택', code:"PRESET = 'fast'   # 'standard' / 'full' 도 가능\nmodel, history = train_quick(bb, k=5, preset=PRESET, device=DEVICE)", d:'한 줄로 mini UNet 학습. [Try-it! ①]에서 preset을 바꿔 시간·품질 trade-off를 관찰.' },
          { n:'06', kind:'train', t:'학습 곡선 + 체크포인트', code:"plt.plot(history)   # Train L1 loss\nsave_ckpt(model, f'unet_mini_{PRESET}.pth', meta={'preset':PRESET})", d:'loss 곡선이 꾸준히 내려가는지 확인하고, 학습된 가중치를 저장(W3에서 재사용).' },
          { n:'07', kind:'metric', t:'평가 — Linear vs UNet', code:"res = evaluate_model(model, bb, k=5, device=DEVICE)\nprint(res['dphi_pp'], res['ssim'])   # vs m_baseline", d:'전체 부피의 누락 슬라이스를 모델로 복원해 |Δφ|·SSIM을 B1 Linear와 직접 비교한다.' },
          { n:'08', kind:'view', t:'시각 비교 (GT/Linear/UNet/diff)', code:"# z=62: GT · B1 Linear · UNet · |GT−UNet|\naxes[3].imshow(np.abs(bb[z]-res['recon'][z]), cmap='hot')", d:'한 슬라이스를 네 패널로 비교 — 숫자뿐 아니라 어디서 좋아졌는지 눈으로 확인.' },
          { n:'09', kind:'cross', t:'Cross-domain 평가', code:"for name in ['CastleGate','Bentheimer','Parker']:\n    vol = load_volume(DATA / f'{name}_256.bin')\n    evaluate_model(model, vol, k=5, device=DEVICE)", d:'BB로 학습한 모델을 다른 도메인에 zero-shot 평가. [Try-it! ②] — 일반화를 관찰.' },
          { n:'10', kind:'train', t:'§6.5-A 학습 루프 직접 제어', code:"def train_custom(volume, k=5, base=8, epochs=20,\n                 lr=1e-3, criterion=None):\n    ...   # train_quick을 펼친 형태\nm, h = train_custom(bb, base=8, lr=1e-3)", d:'편의 함수에 가려졌던 학습 루프를 펼쳐 손실·lr·구조를 직접 바꾼다. [Try-it! ①④]' },
          { n:'11', kind:'train', t:'§6.5-B 손실 함수 비교', code:"for name, crit in [('L1', nn.L1Loss()),\n                   ('MSE', nn.MSELoss())]:\n    m, h = train_custom(bb, criterion=crit)", d:'L1 vs MSE 학습 곡선·|Δφ|·SSIM 비교. 복합 손실(L1+SSIM)까지 직접 구현 도전. [Try-it! ③]' },
          { n:'12', kind:'cross', t:'§6.5-C k-regime crossover', code:"for k in [1, 2, 3, 5]:\n    lin = eval_targets(predict_linear_k(bb, k), bb, k)\n    mk, _ = train_custom(bb, k=k)\n    evaluate_model(mk, bb, k=k)  # vs linear", d:'각 이웃 거리 k 에서 UNet 과 linear 를 같은 조건으로 비교 — k 가 커질수록 누가 유리한지 관찰. [Try-it! ⑤]' },
          { n:'13', kind:'view', t:'§6.5-D per-slice 실패 분석', code:"per_slice = [abs(recon[z].mean()-bb[z].mean())\n             for z in range(256)]\nworst = np.argsort(per_slice)[-5:]", d:'슬라이스별 |Δφ|를 그려 모델이 어디서 실패하는지 찾고 구조적 원인을 분석. [Try-it! ⑥]' },
        ],
        tryits: [
          { n:'①', fn:'train_custom (base·epochs)', change:'preset fast/standard + base 8↔16 직접 조절', observe:'파라미터 ↔ |Δφ|·SSIM ↔ 학습시간 trade-off, overfitting 징후' },
          { n:'②', fn:'evaluate_model (도메인)', change:'BB 모델을 4개 도메인에 평가', observe:'학습 도메인 밖 일반화 + 도메인별 Linear 대비 개선폭' },
          { n:'③', fn:'criterion (loss)', change:'L1 → MSE → L1+λ(1−SSIM) 복합', observe:'손실 종류에 따른 선명도·안정성·|Δφ| 변화' },
          { n:'④', fn:'Adam (learning rate)', change:'lr ∈ {1e-4, 5e-4, 1e-3, 5e-3}', observe:'학습 곡선 — 너무 작으면 느림, 너무 크면 NaN 발산' },
          { n:'⑤', fn:'k-regime crossover', change:'각 k(2·3·5)에서 학습·평가 vs linear', observe:'작은 k=UNet 우세, 큰 k=linear 우세 (crossover)' },
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
          ret:'torch Dataset', desc:'슬라이스 t 를 양옆 이웃 t±k 에서 예측하는 학습 sample 을 자동 생성.',
          params:[
            { p:'k', d:'이웃 거리', try:'k 가 커지면 이웃이 멀어져 학습이 어려워집니다.' },
            { p:'patch_size', d:'학습 patch 크기 (기본 64)', try:'None이면 전체 슬라이스. 키우면 메모리·시간↑.' },
            { p:'augment', d:'flip 증강 on/off', try:'False로 끄면 일반화에 어떤 영향이 있나?' },
          ] },
        { fn:'train_quick', group:'학습', sig:'train_quick(volume, k=3, preset="fast", device="cpu")',
          ret:'(model, history)', desc:'PRESET 하나로 mini UNet을 학습. 내부에서 SliceDataset·Adam·L1Loss를 구성.',
          params:[
            { p:'preset', d:"'fast' · 'standard' · 'full'", try:'시간/품질 trade-off — [Try-it! ①]의 핵심.' },
            { p:'k', d:'이웃 거리 k (W1과 동일 정의)', try:'baseline과 같은 k로 맞춰야 공정 비교.' },
            { p:'device', d:"'cpu' 또는 'cuda'", try:'GPU가 있으면 cuda로 크게 가속.' },
          ] },
        { fn:'evaluate_model', group:'평가', sig:'evaluate_model(model, volume, k=3) → dict',
          ret:'{dphi_pp, ssim, recon}', desc:'각 슬라이스를 양옆 이웃 t±k 에서 모델로 예측하고 |Δφ|(%p)·SSIM을 계산.',
          params:[
            { p:'volume', d:'평가 대상 부피', try:'학습과 다른 도메인을 넣어 cross-domain 일반화 측정 — [Try-it! ②].' },
            { p:'k', d:'평가 이웃 거리', try:'학습 때와 같은 k로 평가해야 공정하다.' },
          ] },
        { fn:'ssim_3d_mean', group:'평가', sig:'ssim_3d_mean(recon, original) → float',
          ret:'평균 SSIM', desc:'복원/원본의 슬라이스별 구조 유사도(SSIM) 평균. W2부터 추가되는 핵심 지표.',
          params:[ { p:'recon / original', d:'복원·원본 부피', try:'|Δφ|=0이어도 SSIM이 낮을 수 있다 — 둘을 함께 봐야 하는 이유.' } ] },
        { fn:'eval_targets', group:'평가', sig:'eval_targets(recon, original, k) → dict',
          ret:'{dphi_pp, ssim}', desc:'예측한 슬라이스(t∈[k, Z−k))만 대상으로 |Δφ|(%p)·SSIM을 계산. baseline·모델 비교에 사용.',
          params:[ { p:'k', d:'이웃 거리', try:"predict_linear_k·evaluate_model과 같은 k로 평가해 공정 비교." } ] },
        { fn:'save_ckpt / load_ckpt', group:'체크포인트', sig:'save_ckpt(model, path, meta) · load_ckpt(path)',
          ret:'저장 / (model, meta)', desc:'학습된 모델 가중치를 저장·로드. meta에 base가 있으면 로드 시 자동 사용.',
          params:[ { p:'path', d:'.pth 경로', try:'W3에서 이 체크포인트를 불러와 GAN으로 이어 학습한다.' } ] },
      ],
      playbook: [
        { t:'바꾼다', d:'한 번에 인자 하나(preset·loss·lr·k)만 바꾼다. 원인이 분리되어야 관찰이 된다.', icon:'sliders' },
        { t:'관찰한다', d:'학습 곡선·|Δφ|·SSIM·학습 시간이 어떻게 변하는지 기록한다. 한 문장이면 충분하다.', icon:'target' },
        { t:'해석한다', d:'“왜” 그렇게 변했는지 모델 크기·손실 성질·일반화로 설명한다. 이것이 실제 학습이다.', icon:'spark' },
      ],
    },
  },

  // ===================================================================
  //  W3 · 적대적 학습 (pix2pix GAN)  ·  두 조 공통(통합) 트랙
  // ===================================================================
  w3: {
    flow: [
      { a:'강의 + L1의 한계·GAN 아이디어',        src:'슬라이드 1–13' },
      { a:'노트북: 판별자·hinge·연속 출력',        src:'W3_pix2pix_gan.ipynb §1–3' },
      { a:'GAN 직접 학습 (처음부터 · W2 이어받기)', src:'노트북 §4–5' },
      { a:'정직한 평가 + λ sweep',                src:'노트북 §6 · §6.5' },
      { a:'탐구 과제 안내 + W4 예고',             src:'handout §5' },
    ],
    groups: {
      // 두 조 공통 · 동일 내용(통합 트랙)
      g1: {
        slides:45, cells:26, tryits:5,
        notebook:'W3_pix2pix_gan.ipynb',
        tasks:[
          { t:'GAN 있음/없음 비교', req:true, d:'같은 조건에서 L1만 모델과 GAN 모델의 연속 출력·경계·작은 pore를 비교. 회색(불확실) 비율과 함께 무엇이 달라졌는지 서술.' },
          { t:'λ sweep trade-off', req:true, d:'λ∈{0, 0.05, 0.1, 0.3, 0.5} 을 바꿔 선명도(회색↓)와 |Δφ|의 trade-off 곡선을 그리고, 적정 λ를 근거와 함께 고르기.' },
          { t:'학습 안정화 실험', req:false, d:'warmup 길이·spectral norm on/off·학습률을 바꿔 D/G 손실 곡선의 안정성이 어떻게 달라지는지 관찰. 무너지는 신호를 찾아 설명.' },
          { t:'"숫자 ≠ 좋은 복원" 사례', req:false, d:'|Δφ|·SSIM은 비슷한데 구조는 다른 슬라이스를 직접 찾아 시각화. 왜 픽셀 지표가 이를 못 잡는지, 어떤 지표가 필요한지(→W5) 서술.' },
        ],
      },
      g2: {
        slides:45, cells:26, tryits:5,
        notebook:'W3_pix2pix_gan.ipynb',
        tasks:[
          { t:'GAN 있음/없음 비교', req:true, d:'같은 조건에서 L1만 모델과 GAN 모델의 연속 출력·경계·작은 pore를 비교. 회색(불확실) 비율과 함께 무엇이 달라졌는지 서술.' },
          { t:'λ sweep trade-off', req:true, d:'λ∈{0, 0.05, 0.1, 0.3, 0.5} 을 바꿔 선명도(회색↓)와 |Δφ|의 trade-off 곡선을 그리고, 적정 λ를 근거와 함께 고르기.' },
          { t:'학습 안정화 실험', req:false, d:'warmup 길이·spectral norm on/off·학습률을 바꿔 D/G 손실 곡선의 안정성이 어떻게 달라지는지 관찰. 무너지는 신호를 찾아 설명.' },
          { t:'"숫자 ≠ 좋은 복원" 사례', req:false, d:'|Δφ|·SSIM은 비슷한데 구조는 다른 슬라이스를 직접 찾아 시각화. 왜 픽셀 지표가 이를 못 잡는지, 어떤 지표가 필요한지(→W5) 서술.' },
        ],
      },
    },
    selfcheck: [
      'L1은 왜 흐린 결과를 내나? "평균의 함정"을 한 문장으로.',
      '판별자에 이웃(조건)을 함께 넣는 이유는? 안 넣으면 어떤 허점이 생기나?',
      'hinge 손실에서 "벌점 0"이 되는 조건은 진짜·가짜 각각 무엇인가?',
      'λ를 키우면 왜 |Δφ|가 나빠질 수 있나? 반대로 너무 작으면?',
      'D 손실이 0에 붙으면 학습에 무슨 일이 생기나? d_base로 어떻게 완화하나?',
      '픽셀 지표만으로는 GAN의 이득을 다 못 보는 이유는? GAN이 확실히 얻는 것은 무엇인가?',
    ],
    res: {
      deck: 'W3_deck.html',
      notebookHtml: 'notebooks/W3_pix2pix_gan.html',
      notebook: 'W3_pix2pix_gan.ipynb',
      utils: [
        { name:'dr_utils.py',    meta:'W1·W2와 동일 (평가 지표 포함)' },
        { name:'model_utils.py', meta:'+ PatchDiscriminatorMini · train_gan · hinge · ssim_loss' },
      ],
      handout: { name:'W3_handout.md', meta:'학습 목표 · GAN 손실 · 탐구 과제' },
      pptx: 'W3.pptx',
      codezip: 'w3_code.zip',
      data: {
        file:'data_w3.zip',
        title:'data_w3.zip · 256³ binary · 4 도메인',
        desc:'BB · CastleGate · Bentheimer · Parker (각 16 MB, zip ~4.5 MB). W1·W2와 동일한 데이터.',
        tree:`<본인 작업 폴더>/
├ W3_pix2pix_gan.ipynb
├ dr_utils.py
├ model_utils.py
└ data/        ← data_w3.zip의 .bin 파일을 여기에 압축 해제
  ├ BB_256.bin
  ├ CastleGate_256.bin
  ├ Bentheimer_256.bin
  └ Parker_256.bin`,
      },
      supp: [
        { icon:'book',     kind:'개념 풀이',        name:'W3_concept_notes.md',    meta:'GAN · 판별자 · hinge · pix2pix · 안정화 등' },
        { icon:'terminal', kind:'코드 walkthrough', name:'W3_code_walkthrough.md',  meta:'셀별 코드 설명 + 인자 변경 가이드' },
        { icon:'notebook', kind:'작은 예시 노트북',  name:'W3_extra_examples.ipynb', meta:'단계별 mini 예제' },
      ],
      suppzip: 'w3_supplement.zip',
    },
    // ---- W3 deep-dive: 노트북 walkthrough + GAN API reference ----
    guide: {
      utilsLabel: 'model_utils.py (+GAN)',
      intro: 'W3의 핵심은 model_utils.py에 새로 추가된 판별자·GAN 학습 함수를 호출하고, λ·warmup·d_base·손실 가중치를 바꿔가며 선명도·|Δφ|·학습 안정성이 어떻게 달라지는지 관찰·해석하는 것이다. 이번 주는 균질한 Bentheimer 사암을 k=2로 실습해 복원과 GAN의 효과를 관찰한다. GAN의 목적은 픽셀 지표를 더 낮추는 것이 아니라 구조와 사실감을 회복하는 것이며, 이를 결과로 확인한다.',
      notebook: {
        file: 'W3_pix2pix_gan.ipynb',
        cells: [
          { n:'01', kind:'setup', t:'환경 & import', code:"from dr_utils import *\nfrom model_utils import *\nDEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'", d:'dr_utils와 model_utils(+GAN)를 불러오고 device를 정한다. torch 미설치 시 pip install torch torchvision.' },
          { n:'02', kind:'recap', t:'W2 복습과 오늘의 문제 (Bentheimer, k=2)', code:"vol = load_volume(DATA / 'Bentheimer_256.bin')\nK = 2\nG_l1, _, _ = train_gan(vol, k=K, preset='fast',\n    lambda_gan=0.0, w_ssim=0.0, epochs=22,\n    warmup=0, d_base=16)", d:'선형 보간 기준선을 잡고, GAN 없이 순수 L1로 학습한 모델을 만들어 회색 번짐을 관찰할 준비를 한다.' },
          { n:'03', kind:'view', t:'회색 번짐 확인', code:"cont_l1 = predict_continuous(G_l1, before, after)\n# 경계가 0.5 근처 회색으로 번짐", d:'threshold 전 확률 출력과 가로 단면을 그려, L1이 경계를 회색으로 번지게 하는 것을 확인한다. [Try-it! ①]' },
          { n:'04', kind:'arch', t:'판별자 구축 (d_base=16)', code:"D = PatchDiscriminatorMini(cond_ch=2, base=16)\nscore = D(cond, y)  # patch별 진위 점수 map", d:'조건부 PatchGAN 판별자를 만들고 입력에서 점수 map 형태를 확인한다. 폭을 생성자보다 작게 잡아 D 독주를 막는다.' },
          { n:'05', kind:'loss', t:'hinge 손실 숫자 예시', code:"d_hinge_loss(D, cond, y_real, y_fake)\ng_hinge_loss(D, cond, y_fake)", d:'확실히 맞힌 표본에 벌점 0을 toy 텐서로 계산해 확인한다.' },
          { n:'06', kind:'train', t:'경로① 처음부터 GAN 학습', code:"G, D, hist = train_gan(vol, k=K, preset='fast',\n    lambda_gan=0.1, w_ssim=0.3, epochs=30,\n    warmup=8, d_base=16, lambda_decay=0.3,\n    snapshot=(before,after), snapshot_every=3)", d:'warmup 후 adversarial을 켠다. snapshot으로 학습 중 출력 변화를 저장한다. [Try-it! ②③]' },
          { n:'07', kind:'view', t:'학습 곡선: G·D 균형', code:"plt.plot(hist['D_loss']); plt.plot(hist['G_gan'])", d:'D·G 손실을 함께 본다. D 손실이 0에 붙지 않고 값을 유지하면 균형 상태, 0에 붙거나 진동하면 불안정 신호이다.' },
          { n:'08', kind:'view', t:'복원 결과와 GAN 선명도 비교', code:"res_gan = evaluate_model(G, vol, k=K)\ncont_gan = predict_continuous(G, before, after)\n# 회색 비율 L1 → GAN 감소", d:'복원 슬라이스를 원본·선형과 나란히 보고, 같은 patch에서 L1(회색)과 GAN(선명)의 회색 비율을 비교한다.' },
          { n:'09', kind:'metric', t:'정직한 평가: 선형 vs GAN 없음 vs GAN', code:"G_fair, _, _ = train_gan(vol, k=K, preset='fast',\n    lambda_gan=0.0, w_ssim=0.3, epochs=30,\n    warmup=8, d_base=16)\nevaluate_model(G_fair, vol, k=K)  # GAN 없음", d:'세 방법의 |Δφ|·SSIM을 같은 설정에서 비교한다. GAN은 선명도를 높이지만 픽셀 지표 이득은 작다는 것이 이번 주 핵심 교훈이다. [Try-it! ④]' },
          { n:'10', kind:'train', t:'경로② W2 이어받아 미세조정', code:"G0, _ = train_quick(vol, k=K, preset='fast')\nG_ft, D_ft, _ = train_gan(vol, k=K,\n    generator=G0, lambda_gan=0.1, w_ssim=0.3,\n    epochs=15, warmup=2, d_base=16)", d:'W2 UNet을 Generator 초기값으로 이어받아 GAN 미세조정한다. 이미 기본 성능이 있어 warmup을 짧게 줄일 수 있다.' },
          { n:'11', kind:'train', t:'§8 λ sweep', code:"for lam in [0.0, 0.1, 0.3]:\n    Gi,_,_ = train_gan(vol, k=K, preset='fast',\n        lambda_gan=lam, w_ssim=0.3,\n        epochs=26, warmup=6, d_base=16)", d:'λ를 바꿔 선명도(회색↓)와 |Δφ|의 trade-off를 관찰한다. λ가 크면 |Δφ|가 오히려 나빠지기 쉬워 작게(0.1) 넣는다. [Try-it! ⑤]' },
        ],
        tryits: [
          { n:'①', fn:'predict_continuous', change:'k = 1 · 2 · 3 · 5 로 관찰', observe:'이웃이 멀수록(k↑) L1의 회색 번짐이 심해진다' },
          { n:'②', fn:'train_gan (warmup)', change:'warmup = 0 · 4 · 8 · 12', observe:'너무 짧으면 초반 불안정, 너무 길면 GAN 효과 늦게' },
          { n:'③', fn:'train_gan (lambda_gan)', change:'λ = 0 · 0.05 · 0.1 · 0.3', observe:'선명도와 |Δφ|의 trade-off, 큰 λ의 환각' },
          { n:'④', fn:'evaluate_model', change:'GAN 없음(G_fair) vs GAN(G)', observe:'|Δφ|·SSIM 차이는 작다, GAN 이득은 주로 선명도' },
          { n:'⑤', fn:'train_gan (d_base)', change:'d_base = 16 vs 48', observe:'판별자를 키우면 D 독주(D_loss→0)로 학습이 무너진다' },
        ],
      },
      utils: [
        { fn:'PatchDiscriminatorMini', group:'모델', sig:'PatchDiscriminatorMini(cond_ch=2, base=16)',
          ret:'nn.Module', desc:'조건부 PatchGAN 판별자 + spectral norm. 조건(2ch)+대상(1ch)에서 patch별 점수 map을 냅니다.',
          params:[
            { p:'cond_ch', d:'조건 채널 수(앞·뒤 슬라이스=2)' },
            { p:'base', d:'판별자 폭(용량)', try:'생성자보다 작게(16). 너무 크면 D가 독주한다.' },
          ] },
        { fn:'train_gan', group:'학습', sig:'train_gan(volume, k, preset="fast", generator=None, lambda_gan=0.1, w_ssim=0.3, warmup=None, epochs=None, d_base=16, ...)',
          ret:'(G, D, history)', desc:'조건부 pix2pix GAN 학습. warmup·hinge·spectral norm 내장.',
          params:[
            { p:'generator', d:'None이면 처음부터, 모델을 주면 W2 이어받기', try:'두 경로를 모두 돌려 결과와 속도를 비교한다.' },
            { p:'lambda_gan', d:'adversarial 가중치', try:'0·0.1·0.3. 흐림과 환각 사이 균형을 결정하는 인자.' },
            { p:'d_base', d:'판별자 폭. 생성자보다 작게 잡아 독주 방지', try:'16 vs 48로 D 독주(D_loss→0)를 관찰한다.' },
            { p:'warmup', d:'재구성만 학습할 epoch', try:'0·8·12로 안정성에 미치는 영향을 확인한다.' },
            { p:'snapshot', d:'(before,after)를 주면 학습 중 출력을 저장', try:'출력이 언제 또렷해지는지 관찰한다.' },
          ] },
        { fn:'ssim_loss', group:'손실', sig:'ssim_loss(pred, target) → tensor',
          ret:'1 − SSIM', desc:'미분가능 SSIM 손실(Gaussian window). 외부 패키지 불필요.',
          params:[ { p:'pred / target', d:'예측·정답', try:'w_ssim으로 가중해 L1과 함께 사용한다.' } ] },
        { fn:'d_hinge_loss / g_hinge_loss', group:'손실', sig:'d_hinge_loss(D, cond, y_real, y_fake) · g_hinge_loss(D, cond, y_fake)',
          ret:'판별자 · 생성자 적대적 손실', desc:'hinge 형태. 확실히 맞힌 표본에 벌점 0. D는 y_fake를 detach.',
          params:[ { p:'cond', d:'조건(이웃 2ch)', try:'toy 텐서로 값을 넣어 벌점 계산을 확인한다.' } ] },
        { fn:'predict_continuous', group:'시각화', sig:'predict_continuous(model, before, after) → 2D',
          ret:'0~1 연속 출력', desc:'threshold 전 확률 출력. L1 회색 vs GAN 선명 비교의 핵심.',
          params:[ { p:'before / after', d:'이웃 슬라이스', try:'경계를 지나는 가로 단면을 그려 회색 번짐을 정량화한다.' } ] },
        { fn:'save_gan_ckpt / load_gan_ckpt', group:'체크포인트', sig:'save_gan_ckpt(G, D, path, meta) · load_gan_ckpt(path)',
          ret:'저장 / (G, D, meta)', desc:'생성자+판별자 가중치 저장·로드. 배포 시엔 G만 사용.',
          params:[ { p:'path', d:'.pth 경로', try:'W4에서 이 G를 다른 아키텍처와 비교한다.' } ] },
      ],
      playbook: [
        { t:'바꾼다', d:'한 번에 인자 하나(λ·warmup·loss·k)만 바꾼다. 원인이 분리되어야 관찰이 된다.', icon:'sliders' },
        { t:'관찰한다', d:'연속 출력의 회색 비율·D/G 손실 곡선·|Δφ|·SSIM이 어떻게 변하는지 기록한다.', icon:'target' },
        { t:'해석한다', d:'변화의 원인을 손실 균형·안정성·평가의 한계로 설명한다.', icon:'spark' },
      ],
    },
  },

  /* ── Week 4 · 다른 아키텍처 (Swin Transformer · 3D CNN) ─────────── */
  w4: {
    flow: [
      { a:'맥락 + 합성곱 · attention 유도 (§1–§2)', src:'슬라이드 1–22' },
      { a:'3D CNN · diffusion · 공정 비교·결과', src:'슬라이드 23–36' },
      { a:'노트북: attention 계산 · 두 모델 구축', src:'W4_architectures.ipynb §1–4' },
      { a:'공정 비교 + 우리 방식(GAN) + trade-off', src:'노트북 §5–7' },
      { a:'탐구 과제 안내 + W5 예고', src:'handout §5' },
    ],
    groups: {
      g1: {
        slides:47, cells:30, tryits:5,
        notebook:'W4_architectures.ipynb',
        tasks:[
          { t:'시간 예산과 순위', req:true,  d:'budget_s=30/90/180 으로 공정 비교를 반복하고, 예산에 따라 세 구조의 지표·순위가 어떻게 변하는지 표로 정리한다. 느린 구조(3D)가 예산 증가의 이득을 더 보는지 확인.' },
          { t:'창 크기 trade-off', req:true,  d:'window_size=4/8/16 에서 SwinUNet 의 epoch 수·|Δφ|·SSIM 을 비교하고 "보는 범위 ↔ 계산 비용" 관점으로 해석한다.' },
          { t:'파라미터-성능 곡선', req:false, d:'세 구조의 base 를 각각 바꿔 "파라미터 vs 지표" 곡선을 그리고, 같은 크기에서 구조 간 격차가 유지되는지 확인한다.' },
          { t:'정보 누출 실험', req:false, d:'Slice3DDataset 을 복사해 t±1 까지 채우는 잘못된 버전을 만들어 학습하고, 지표가 얼마나 부풀는지 측정한 뒤 왜 실력이 아닌지 설명한다.' },
        ],
      },
      g2: {
        slides:47, cells:30, tryits:5,
        notebook:'W4_architectures.ipynb',
        tasks:[
          { t:'시간 예산과 순위', req:true,  d:'budget_s=30/90/180 으로 공정 비교를 반복하고, 예산에 따라 세 구조의 지표·순위가 어떻게 변하는지 표로 정리한다. 느린 구조(3D)가 예산 증가의 이득을 더 보는지 확인.' },
          { t:'창 크기 trade-off', req:true,  d:'window_size=4/8/16 에서 SwinUNet 의 epoch 수·|Δφ|·SSIM 을 비교하고 "보는 범위 ↔ 계산 비용" 관점으로 해석한다.' },
          { t:'파라미터-성능 곡선', req:false, d:'세 구조의 base 를 각각 바꿔 "파라미터 vs 지표" 곡선을 그리고, 같은 크기에서 구조 간 격차가 유지되는지 확인한다.' },
          { t:'정보 누출 실험', req:false, d:'Slice3DDataset 을 복사해 t±1 까지 채우는 잘못된 버전을 만들어 학습하고, 지표가 얼마나 부풀는지 측정한 뒤 왜 실력이 아닌지 설명한다.' },
        ],
      },
    },
    selfcheck: [
      '합성곱과 attention 의 가중치는 각각 무엇이 정하는가? 한 문장으로.',
      'Q·K·V 의 역할을 나누어 설명하고, softmax(QKᵀ/√d)V 를 말로 풀어 보라.',
      '√d 로 나누지 않으면 무엇이 잘못되는가? "포화"와 "기울기"로 답하라.',
      '창 분할이 줄이는 것과 잃는 것은? 창 이동은 무엇을 복구하는가?',
      '3D 모델 입력에 t±1 슬라이스를 넣으면 안 되는 이유는? (SSIM 0.953 vs 0.823 사례)',
      '"파라미터 수가 비슷하니 공정한 비교다"라는 주장의 빈틈 두 가지는?',
    ],
    res: {
      deck: 'W4_deck.html',
      notebookHtml: 'notebooks/W4_architectures.html',
      notebook: 'W4_architectures.ipynb',
      utils: [
        { name:'dr_utils.py',    meta:'W1~W3와 동일 (평가 지표 포함)' },
        { name:'model_utils.py', meta:'+ SwinUNetMini · UNet3DMini · benchmark_models' },
      ],
      handout: { name:'W4_handout.md', meta:'학습 목표 · 핵심 용어 · 탐구 과제' },
      pptx: 'W4.pptx',
      codezip: 'w4_code.zip',
      data: {
        file:'data_w4.zip',
        title:'data_w4.zip · 256³ binary · 4 도메인',
        desc:'BB · CastleGate · Bentheimer · Parker (각 16 MB, zip ~4.5 MB). W1~W3와 동일한 데이터.',
        tree:`<본인 작업 폴더>/
├ W4_architectures.ipynb
├ dr_utils.py
├ model_utils.py
└ data/        ← data_w4.zip의 .bin 파일을 여기에 압축 해제
  ├ BB_256.bin
  ├ Bentheimer_256.bin
  ├ CastleGate_256.bin
  └ Parker_256.bin`,
      },
      supp: [
        { icon:'book',     kind:'개념 풀이',        name:'W4_concept_notes.md',    meta:'attention · Q·K·V · 창 분할 · 3D · 공정 비교' },
        { icon:'terminal', kind:'코드 walkthrough', name:'W4_code_walkthrough.md',  meta:'셀별 코드 설명 + 인자 변경 가이드' },
        { icon:'notebook', kind:'작은 예시 노트북',  name:'W4_extra_examples.ipynb', meta:'softmax 손계산 · attention 단계별 · 창 분할 shape' },
      ],
      suppzip: 'w4_supplement.zip',
    },
    guide: {
      utilsLabel: 'model_utils.py (+아키텍처)',
      intro: 'W4의 핵심은 우리 pix2pix 접근을 대안 구조(Transformer 계열 Swin·3D CNN·diffusion)와 같은 조건에서 비교하는 것이다. 이 구조들은 채택 대상이 아니라 비교군(baseline)이다. attention 을 숫자로 직접 계산하고, benchmark_models 로 세 비교 구조를 학습한 뒤 우리 방식(2D UNet + GAN)까지 같은 예산으로 더해 비교한다.',
      notebook: {
        file: 'W4_architectures.ipynb',
        cells: [
          { n:'01', kind:'setup', t:'환경 & import',
            code:"from dr_utils import *\nfrom model_utils import *\nDEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'",
            d:'W4 신규 심볼(window_partition·SwinUNetMini·UNet3DMini·benchmark_models 등)을 불러오고 시드를 고정한다.' },
          { n:'02', kind:'recap', t:'데이터 로드 + 선형 기준선 (Bentheimer, k=2)',
            code:"vol = load_volume(DATA / 'Bentheimer_256.bin')\nm_lin = eval_targets(predict_linear_k(vol, K), vol, K)",
            d:'W3와 같은 데이터·같은 k. 선형 보간 |Δφ|·SSIM 이 비교의 기준선이 된다.' },
          { n:'03', kind:'attn', t:'attention 수치 계산 (토큰 3개, d=2)',
            code:"scores = Q @ Kmat.T\nweights = torch.softmax(scores / (2**0.5), dim=1)\nout = weights @ V",
            d:'QKᵀ → ÷√d → softmax → ×V 를 한 줄씩 실행한다. 모든 중간 행렬이 print 되므로 손계산과 대조한다.' },
          { n:'04', kind:'attn', t:'√d 포화 실험 + 창 분할 시각화',
            code:"torch.softmax(torch.tensor([8.,0.,-8.]), 0)  # 포화\nwin = window_partition(x, 8)",
            d:'큰 점수의 softmax 포화를 확인하고, 실제 슬라이스의 64×64 토큰 격자에 8×8 창 경계를 그린다.' },
          { n:'05', kind:'arch', t:'SwinUNetMini 구축 (~125K)',
            code:"swin = SwinUNetMini(in_ch=2, base=32, num_heads=4, window_size=8)\nout, attn = wa(tok, return_attn=True)",
            d:'파라미터 수·forward shape 를 확인하고 attention map(행 합=1)을 직접 꺼내 본다. 입력 H·W는 32의 배수.' },
          { n:'06', kind:'arch', t:'UNet3DMini + 공정한 입력 (~129K)',
            code:"unet3d = UNet3DMini(in_ch=2, base=10)\nx3, y3 = Slice3DDataset(vol, k=K)[128]",
            d:'깊이 5 입력 부피에서 채워진 면이 이웃 t±2 두 장뿐임을 눈으로 확인한다 (정보 누출 방지).' },
          { n:'07', kind:'bench', t:'공정 비교 실행 (모델당 90초)',
            code:"results = benchmark_models(vol, k=K, budget_s=90,\n                           device=DEVICE, seed=0)",
            d:'세 모델을 같은 조건에서 학습·평가한다. epoch 수가 모델마다 다른 것이 정상 (같은 시간, 다른 속도).' },
          { n:'08', kind:'view', t:'시간축 학습 곡선',
            code:"ax.plot([h[0] for h in r['history']], [h[1] for h in r['history']])",
            d:'x축이 epoch 이 아니라 경과 시간(초)이다. 점 간격이 한 epoch 의 비용을 보여 준다.' },
          { n:'09', kind:'view', t:'복원 비교 (전체 + 64×64 확대)',
            code:"axes[0,i].imshow(img); axes[1,i].imshow(img[y0:y0+64, x0:x0+64])",
            d:'원본·선형·세 모델을 같은 위치에서 비교한다. 선형은 얇은 목(throat)이 끊긴다.' },
          { n:'10', kind:'metric', t:'trade-off 정리',
            code:"axes[0].scatter(r['params'], r['ssim'])\naxes[1].scatter(r['epochs'], r['dphi_pp'])",
            d:'파라미터·epoch·지표를 함께 읽는다. "누가 이겼나"보다 "무엇을 내주고 무엇을 얻었나".' },
          { n:'11', kind:'train', t:'심화: 창 크기 실험',
            code:"benchmark_models(vol, k=K, budget_s=90,\n  models={'SwinUNet w=4': SwinUNetMini(window_size=4)})",
            d:'창을 줄이면 스텝이 빨라지고 시야가 좁아진다. 같은 예산에서 어느 쪽이 유리한지 실험으로 확인.' },
        ],
        tryits: [
          { n:'①', fn:'attention 수치 계산', change:'scaled = scores 로 바꿔 √d 나눗셈 제거', observe:'이 작은 예제에서는 차이가 작다. §2.1의 큰 점수([8,0,−8])에서 포화가 드러난다' },
          { n:'②', fn:'benchmark_models', change:'budget_s = 30 · 90 · 180', observe:'예산이 길수록 느린 구조(3D)가 따라붙는다. 순위가 예산의 함수임을 확인' },
          { n:'③', fn:'SwinUNetMini', change:'window_size = 4 · 8 · 16', observe:'창이 작으면 epoch 은 늘고 시야는 좁아진다 (보는 범위 ↔ 계산 비용)' },
          { n:'④', fn:'UNet3DMini', change:'base = 8 · 10 · 12 (~83K/129K/186K)', observe:'같은 예산에서 폭을 키우면 epoch 이 줄어든다. 크기와 학습량의 trade-off' },
          { n:'⑤', fn:'Slice3DDataset', change:'(심화) t±1 까지 채우는 누출 버전 제작', observe:'지표가 크게 부풀지만 실력이 아니다. 배포 상황에는 t±1 이 없다' },
        ],
      },
      utils: [
        { fn:'window_partition', group:'모델', sig:'window_partition(x, window_size) → windows',
          ret:'(창 개수·B, ws, ws, C)', desc:'(B,H,W,C) 토큰 배열을 창 단위로 분할한다. window_reverse 가 역변환.',
          params:[ { p:'window_size', d:'창 한 변의 토큰 수', try:'shape 변화를 print 로 확인한다 (총 토큰 수는 불변).' } ] },
        { fn:'WindowAttentionMini', group:'모델', sig:'WindowAttentionMini(dim, window_size, num_heads)',
          ret:'nn.Module', desc:'창 내부 self-attention. softmax(QKᵀ/√d)V 를 구현.',
          params:[ { p:'return_attn', d:'True 면 attention map 반환', try:'행 합이 1인지 확인하고 imshow 로 관찰한다.' } ] },
        { fn:'SwinUNetMini', group:'모델', sig:'SwinUNetMini(in_ch=2, base=32, num_heads=4, window_size=8)',
          ret:'nn.Module (~125K)', desc:'U-구조에 Swin 블록 쌍. 최상단 full-res stem skip 포함 (없으면 자명해에 갇힘).',
          params:[ { p:'window_size', d:'창 크기 (H/4 의 약수)', try:'4/8/16 으로 바꿔 같은 예산 재실험한다.' },
                   { p:'base', d:'채널 폭 (head 수로 나누어떨어져야)', try:'16/32/48 로 파라미터-성능 곡선을 그린다.' } ] },
        { fn:'UNet3DMini', group:'모델', sig:'UNet3DMini(in_ch=2, base=10)',
          ret:'nn.Module (~129K)', desc:'3×3×3 합성곱 U-구조. 깊이는 풀링하지 않고 가운데 슬라이스만 출력.',
          params:[ { p:'base', d:'채널 폭', try:'8/10/12 로 크기 대 학습량 trade-off 를 관찰한다.' } ] },
        { fn:'Slice3DDataset', group:'데이터셋', sig:'Slice3DDataset(volume, k=2, patch_size=64, ...)',
          ret:'Dataset', desc:'공정한 3D 입력: 깊이 2k+1 부피에 이웃 t±k 두 장만 채움 + 마스크 채널.',
          params:[ { p:'k', d:'이웃 거리', try:'x3[0].mean(dim=(1,2)) 로 채워진 면을 확인한다.' } ] },
        { fn:'evaluate_model_3d', group:'평가', sig:'evaluate_model_3d(model, volume, k=2, device)',
          ret:"{'dphi_pp','ssim','recon'}", desc:'UNet3DMini 평가. 지표는 evaluate_model(2D)과 동일해 직접 비교 가능.',
          params:[ { p:'volume', d:'평가할 부피', try:'2D 결과와 같은 표에 놓고 비교한다.' } ] },
        { fn:'benchmark_models', group:'벤치마크', sig:'benchmark_models(volume, k=2, budget_s=90, models=None, device, seed=0)',
          ret:'{이름: {params, epochs, dphi_pp, ssim, history, recon}}', desc:'같은 데이터·같은 입력 정보·같은 시간 예산의 공정 비교 루프. optimizer 는 구조별 표준 설정.',
          params:[ { p:'budget_s', d:'모델당 wall-clock 예산(초)', try:'30/90/180 으로 예산-순위 관계를 조사한다 (과제 1).' },
                   { p:'models', d:'{이름: 모델} 로 교체 가능', try:'창 크기·base 를 바꾼 변형을 넣어 재실험한다.' } ] },
      ],
      playbook: [
        { t:'바꾼다', d:'한 번에 인자 하나(budget_s·window_size·base·k)만 바꾼다. 구조 비교는 통제가 전부다.', icon:'sliders' },
        { t:'관찰한다', d:'|Δφ|·SSIM 만이 아니라 epoch 수(학습량)·시간축 곡선까지 함께 기록한다.', icon:'target' },
        { t:'해석한다', d:'차이를 "구조의 귀납 편향 ↔ 데이터·예산" 관점으로 설명하고, 지표 전에 입력(누출)부터 점검한다.', icon:'spark' },
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
