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

  // 6-week roadmap — revised plan (2026-06-05)
  // 변경 사항:
  //  • W1 = 데이터+Classical (구 W1+W2 통합) — 한 세션에 데이터/sparse/선형/Cubic 모두 다룸
  //  • W2 = DL 입문 + mini UNet 학습 (skeleton 코드, 학습시간 옵션 10/30/60min)
  //  • W3 = 손실 함수 + HPO (Optuna 결과 분석 + mini Optuna 직접 실행)
  //  • W4 = 다른 아키텍처 (UNetG vs SwinUNet vs 3D UNet)
  //  • W5 = Tri-axis aggregation (3가지 GT-free 방법 비교)
  //  • W6 = Cross-domain + Carbonate (Ketton/Estaillades) + LBM + 발표
  weeks: [
    {
      n:1, status:'now', slug:'w1', available:true,
      title:'데이터 탐색 + Classical Baseline',
      en:'Load · Preprocess · Linear/Cubic',
      summary:'Micro-CT voxel 데이터를 직접 열고, 데이터 전처리(normalize·Otsu)와 sparse imaging 문제를 정의. scipy 기반 선형/Cubic 보간으로 |Δφ|·|ΔSA|·SSIM까지 측정 — 왜 딥러닝이 필요한지 정량적으로 확인합니다.',
      concepts:['Voxel & Slice','Preprocessing','Porosity φ','Sparse imaging (k)','Linear/Cubic','|Δφ|·SSIM'],
      nonDL:true,
    },
    {
      n:2, status:'next', slug:'w2', available:false,
      title:'Deep Learning 입문 — mini UNet 학습',
      en:'UNet skeleton + Train',
      summary:'2D 슬라이스 보간을 학습하는 첫 신경망. UNet 구조·skip-connection·학습 루프를 코드로 직접 따라가고, mini UNet(~100K params)을 학생 노트북에서 10/30/60분 옵션으로 학습합니다. 1조는 skeleton 받아 학습, 2조는 pre-trained ckpt 로드 후 파라미터 sweep.',
      concepts:['UNet','skip-connection','학습 루프','Patching·Dataset','학습시간 옵션'],
      nonDL:false,
      plan:['ML용 dataset 만들기 (patching·sparse mask·augmentation)','UNet 구조 분석 + skip-connection 시각','mini UNet 학습 (base=8/16, epoch 20/50/100)','B1·B2 baseline 대비 |Δφ|·SSIM 비교'],
      newUtils:['SliceDataset','UNetMini','train_one_epoch','evaluate_model','load_pretrained'],
      prep:['pip install torch torchvision','W1 baseline 결과 (|Δφ| at k=3,5)'],
    },
    {
      n:3, status:'upcoming', slug:'w3', available:false,
      title:'손실 함수 + HPO 입문',
      en:'Losses · Optuna',
      summary:'6개 손실 함수(L1·SSIM·Gradient·Porosity·SurfaceArea·S2)의 효과를 ablation으로 분석하고, Optuna multi-objective HPO 결과를 해석. 1조는 mini Optuna(3 trial, ~20min)를 직접 실행.',
      concepts:['Loss ablation','Soft-Otsu porosity loss','Surface area loss','Optuna','Pareto front'],
      nonDL:false,
      plan:['6개 손실 함수 시각 비교 ablation','Loss weight sweep — 어떤 조합이 어떤 결과를 내나','Optuna 60-trial 결과 Pareto 시각화','1조: mini Optuna 3-trial 직접 실행','연구 결과 fig_component_waterfall 해석'],
      newUtils:['compute_porosity_loss','compute_sa_loss','compute_s2_loss','run_optuna_mini'],
      prep:['pip install pytorch-msssim optuna scikit-image','W2 학습된 mini UNet 체크포인트'],
    },
    {
      n:4, status:'upcoming', slug:'w4', available:false,
      title:'다른 아키텍처 비교',
      en:'UNet · Transformer · 3D',
      summary:'같은 sparse 보간 문제를 여러 모델로 풀어 비교 — 파라미터·시간·정확도 trade-off.',
      concepts:['아키텍처 비교','Pre-trained 활용','trade-off'],
      nonDL:false,
      plan:['주요 아키텍처 후보들 개요','각 모델 inference·비교','평가 지표 다중 비교'],
      newUtils:['model_zoo','benchmark_models'],
      prep:['Pre-trained ckpt 안내'],
    },
    {
      n:5, status:'upcoming', slug:'w5', available:false,
      title:'Tri-Axis Aggregation',
      en:'2.5-D Fusion',
      summary:'세 직교축 보간 결과를 융합하는 여러 GT-free 방식 비교 및 등방성 검증.',
      concepts:['Tri-axis','GT-free','등방성'],
      nonDL:false,
      plan:['축별 inference','aggregation 방식 비교','도메인별 평가'],
      newUtils:['triaxis_inference','aggregate_methods'],
      prep:['W4 또는 W2 ckpt'],
    },
    {
      n:6, status:'upcoming', slug:'w6', available:false,
      title:'Cross-domain Transfer',
      en:'Sandstone → Carbonate',
      summary:'다른 암석 도메인(carbonate)에서의 Zero-shot vs Fine-tune 비교, 인코딩 sanity check, 발표.',
      concepts:['Cross-domain','Zero-shot vs FT','Encoding sanity'],
      nonDL:false,
      plan:['Carbonate 데이터 로딩·인코딩 점검','ZS vs FT 비교','종합 발표'],
      newUtils:['load_carbonate','fine_tune_short'],
      prep:['전체 주차 결과 정리','발표 자료'],
    },
  ],

  // domains (real micro-CT samples) — 6 도메인으로 확장
  // φ 값은 본 패키지 256³ subvolume 기준 (실제 측정값)
  domains: [
    { id:'BB',          name:'BB Sandstone',   phi:0.221, voxel_um:2.25, family:'sandstone', note:'기준 학습 도메인 (W1~W5)' },
    { id:'CastleGate',  name:'CastleGate',     phi:0.277, voxel_um:2.25, family:'sandstone', note:'고공극·불균질 사암' },
    { id:'Bentheimer',  name:'Bentheimer',     phi:0.234, voxel_um:2.25, family:'sandstone', note:'균질 사암 (1조용)' },
    { id:'Parker',      name:'Parker',         phi:0.123, voxel_um:2.25, family:'sandstone', note:'저공극 사암 (W1 비교용)' },
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
    flow: [
      { t:'0–25분',  a:'강의 + 개념',                  src:'슬라이드 1–12',  g1:'0–25분', g2:'0–30분 (천천히)' },
      { t:'25–60분', a:'노트북 실행 + [Try-it!]',       src:'W1_load_and_explore.ipynb', g1:'25–60분', g2:'30–65분' },
      { t:'60–75분', a:'후반 강의 + 노트북',            src:'sparse + 보간',  g1:'60–75분', g2:'65–80분' },
      { t:'75–85분', a:'자기 점검 + 탐구 과제',          src:'handout §4',     g1:'75–85분', g2:'80–88분' },
      { t:'85–90분', a:'Q&A + W2 예고',                src:'마무리',         g1:'85–90분', g2:'88–90분' },
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
          { t:'[Try-it!] 4종 수행', req:true, d:'노트북 [Try-it! ①~④] 박스를 모두 수행하고 각각 한 문장씩 관찰 기록.' },
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

  setup: {
    env:'rock',
    py:'3.10+',
    steps:[
      { t:'Conda 환경 생성', cmd:'conda create -n rock python=3.10 -y\nconda activate rock' },
      { t:'필수 패키지 설치', cmd:'pip install numpy matplotlib jupyter' },
      { t:'동작 확인', cmd:'python3 -c "import numpy, matplotlib; print(\'OK\')"' },
      { t:'노트북 실행', cmd:'cd week1/notebooks/\njupyter notebook W1_load_and_explore.ipynb' },
    ],
    pkgs:['numpy','matplotlib','jupyter','scipy (W2~)'],
    troubles:[
      { s:'FileNotFoundError: BB_256.bin', f:'노트북 실행 위치가 notebooks/ 폴더 안인지 확인' },
      { s:'ValueError: 파일 크기 불일치', f:'load_volume의 shape / dtype 인자 확인' },
      { s:'ModuleNotFoundError: dr_utils', f:'첫 셀의 sys.path.insert(0, …) 실행 여부 확인' },
      { s:'matplotlib 한글 깨짐', f:'첫 셀 setup_plot_style() 실행 — Pretendard 자동 등록' },
    ],
  },
};
