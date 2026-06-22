/* =====================================================================
   Home page — course hub / dashboard
   ===================================================================== */

function HeroReconCard() {
  // 5-slot strip: measured (orange) vs interpolated (hatched), k=2 example
  const slots = [
    { kind:'measured', dom:'BB' },
    { kind:'interp',   dom:'BB' },
    { kind:'measured', dom:'CastleGate' },
    { kind:'interp',   dom:'CastleGate' },
    { kind:'measured', dom:'Bentheimer' },
  ];
  return (
    <div className="recon-card">
      <div className="recon-head">
        <span className="recon-title">sparse_reconstruct · k=2</span>
        <span className="badge badge-navy"><span className="dot"></span>2.5-D</span>
      </div>
      <div className="recon-strip">
        {slots.map((s, i) => (
          <div key={i} className={`recon-slot ${s.kind}`}>
            <img src={`assets/slices/${s.dom}_bin.png`} alt="" loading="lazy"
                 style={{ objectPosition: `${(i*23)%100}% ${(i*37)%100}%` }} />
            <span className={`recon-tag ${s.kind === 'measured' ? 'm' : 'i'}`}>
              {s.kind === 'measured' ? '측정' : 'interp'}
            </span>
          </div>
        ))}
      </div>
      <div className="recon-foot">
        <div className="recon-stat"><div className="rs-n orange tnum">50%</div><div className="rs-l">측정 슬라이스</div></div>
        <div className="recon-stat"><div className="rs-n tnum">2×</div><div className="rs-l">시간 절감</div></div>
        <div className="recon-stat"><div className="rs-n tnum">|Δφ|</div><div className="rs-l">핵심 평가지표</div></div>
      </div>
      <div className="recon-legend">
        <div className="rl-i"><span className="rl-sw" style={{ background:'var(--orange)' }}></span>측정된 슬라이스</div>
        <div className="rl-i"><span className="rl-sw" style={{ background:'repeating-linear-gradient(45deg,#E4E7EC 0 4px,#C9CCD2 4px 8px)' }}></span>보간으로 복원</div>
      </div>
    </div>
  );
}

function DomainStrip() {
  const D = window.COURSE.domains;
  return (
    <div className="domain-strip">
      {D.map(d => (
        <div key={d.id} className="domain-card card">
          <div className="domain-thumb"><img src={`assets/slices/${d.id}_bin.png`} alt={d.name} loading="lazy" /></div>
          <div>
            <div className="domain-name">{d.name}</div>
            <div className="domain-phi font-mono">φ = {d.phi.toFixed(3)}</div>
            <div className="domain-note">{d.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    done:     { c:'status-done', t:'완료' },
    now:      { c:'status-now', t:'진행 중' },
    next:     { c:'status-next', t:'다음 주' },
    upcoming: { c:'status-upcoming', t:'예정' },
  };
  const s = map[status] || map.upcoming;
  return <span className={`status-dot ${s.c}`}><span className="d"></span>{s.t}</span>;
}

function Roadmap({ onOpen }) {
  const W = window.COURSE.weeks;
  return (
    <div className="roadmap">
      {W.map(w => {
        const live = w.status === 'now';
        return (
          <div key={w.n} className={`wk-card clickable ${live ? 'now' : ''}`}
               onClick={() => onOpen('w' + w.n)}
               style={{ cursor: 'pointer' }}>
            <div className="wk-top">
              <span className="wk-num">WEEK {String(w.n).padStart(2,'0')}</span>
              <StatusBadge status={w.status} />
            </div>
            <div className="wk-title">{w.title}</div>
            <div className="wk-en font-mono">{w.en}{w.nonDL && <span style={{ color:'var(--green)', marginLeft:8 }}>· non-DL</span>}</div>
            <div className="wk-summary">{w.summary}</div>
            <div className="wk-concepts">
              {w.concepts.slice(0,4).map((c,i) => <span key={i} className="wk-chip">{c}</span>)}
            </div>
            <div className="wk-link">
              {w.available ? <>주차 페이지 열기 <Icon name="arrow" size={15} /></> : <>미리보기 <Icon name="arrow" size={15} /></>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupCompare() {
  const C = window.COURSE;
  const cur = C.currentWeek();
  const cw = C[cur.slug];
  const g1 = cw.groups.g1, g2 = cw.groups.g2;
  const G = C.groups;
  const WK = cur.slug.toUpperCase();
  const card = (gid, data, grp) => (
    <div className={`gc-card ${gid}`}>
      <div className="gc-head">
        <span className="gc-name">{grp.name}</span>
        <span className="gc-tag font-mono">{grp.tag}</span>
      </div>
      <div className="gc-desc">{grp.desc}</div>
      <div className="gc-stats">
        <div className="gc-stat"><div className="n tnum">{data.slides}</div><div className="l">슬라이드</div></div>
        <div className="gc-stat"><div className="n tnum">{data.cells}</div><div className="l">노트북 셀</div></div>
        <div className="gc-stat"><div className="n tnum">{data.tryits}</div><div className="l">Try-it! 박스</div></div>
      </div>
      <div className="eyebrow muted" style={{ marginBottom:10 }}>{WK} 탐구 과제</div>
      <div className="gc-tasks">
        {data.tasks.map((t,i) => (
          <div key={i} className="gc-task">
            <span className={t.req ? 'req' : 'opt'}>{t.req ? '필수' : '선택'}</span>
            <span><b style={{ color:'var(--ink)' }}>{t.t}</b> — {t.d}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="gcompare">
      {card('g1', g1, G.g1)}
      {card('g2', g2, G.g2)}
    </div>
  );
}

function HomePage({ group, onNav }) {
  const cur = window.COURSE.currentWeek();
  const CW = cur.slug.toUpperCase();
  return (
    <div className="page page-wide">
      {/* hero */}
      <section className="hero">
        <div>
          <div className="hero-tagchip font-mono">6-WEEK RESEARCH COURSE · <b>Micro-CT × Deep Learning</b></div>
          <h1>Sparse 측정으로 빠르게,<br/><span className="accent">딥러닝</span>으로 정확하게.</h1>
          <p className="hero-lead">
            Micro-CT 암석 단면의 일부만 측정(sparse imaging)하고, 누락된 슬라이스를 딥러닝으로 복원합니다.
            6주 동안 데이터 탐색부터 딥러닝 파라미터 조절까지 — 분석 및 평가를 진행합니다.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={() => onNav(cur.slug)}>
              <Icon name="book" size={18} />{CW} 시작하기
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => onNav('demo')}>
              <Icon name="sliders" size={18} />인터랙티브 데모
            </button>
          </div>
          <div className="hero-meta">
            <div><div className="m-n tnum">6</div><div className="m-l">주차 커리큘럼</div></div>
            <div><div className="m-n tnum">2</div><div className="m-l">학습 그룹</div></div>
            <div><div className="m-n tnum">256³</div><div className="m-l">voxel 부피</div></div>
            <div><div className="m-n tnum">6</div><div className="m-l">암석 도메인</div></div>
          </div>
        </div>
        <div className="hero-visual">
          <HeroReconCard />
        </div>
      </section>

      {/* domains */}
      <section style={{ marginTop: 30 }}>
        <DomainStrip />
      </section>

      {/* roadmap */}
      <section style={{ marginTop: 64 }}>
        <SectionHead eyebrow="CURRICULUM" title="6주 로드맵"
          sub="non-DL 베이스라인으로 문제를 충분히 이해한 뒤, 딥러닝으로 넘어갑니다."
          right={<div className="badge badge-orange"><span className="dot"></span>현재 {CW} 진행 중</div>} />
        <Roadmap onOpen={onNav} />
      </section>

      {/* group compare */}
      <section style={{ marginTop: 64 }}>
        <SectionHead eyebrow="TWO TRACKS" title="같은 연구, 두 개의 트랙"
          sub={`동일한 데이터와 목표를 공유하되, 트랙에 따라 탐구의 깊이와 페이스를 달리합니다. (${CW} 기준)`} />
        <GroupCompare />
      </section>

      {/* demo teaser */}
      <section style={{ marginTop: 64 }}>
        <div className="demo-teaser card">
          <div className="dt-left">
            <div className="eyebrow">HANDS-ON</div>
            <h2 className="h1" style={{ marginTop: 8 }}>k를 직접 움직여 보세요</h2>
            <p className="muted" style={{ marginTop: 10, maxWidth: 440 }}>
              sparse 간격 k를 바꾸면 측정 슬라이스 수·시간 절감·공극률 오차 |Δφ|가
              실시간으로 어떻게 변하는지 — 노트북을 켜기 전에 감을 잡습니다.
            </p>
            <button className="btn btn-navy" style={{ marginTop: 22 }} onClick={() => onNav('demo')}>
              <Icon name="play" size={16} />데모 열기
            </button>
          </div>
          <div className="dt-right">
            <div className="dt-kline">
              {[1,2,3,5,7,10].map(k => (
                <div key={k} className="dt-kbar" style={{ height: `${20 + k*7}px` }}>
                  <span>k={k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { HomePage, Roadmap, GroupCompare, DomainStrip, StatusBadge });
