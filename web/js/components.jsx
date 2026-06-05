/* =====================================================================
   Shared components — icons, brand mark, top bar, group toggle, motifs
   ===================================================================== */

/* ---------- icon set (clean 1.7 stroke) ---------- */
function Icon({ name, size = 18, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  const paths = {
    arrow:    <path d="M5 12h14M13 6l6 6-6 6" />,
    arrowL:   <path d="M19 12H5M11 18l-6-6 6-6" />,
    book:     <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M4 20.5A1.5 1.5 0 0 1 5.5 19H19"/></>,
    notebook: <><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M9 8.5l-2 2 2 2M15 8.5l2 2-2 2"/></>,
    slides:   <><rect x="3" y="4" width="18" height="13" rx="1.6"/><path d="M9 21h6M12 17v4"/></>,
    play:     <path d="M8 5.5v13l11-6.5z"/>,
    download: <><path d="M12 4v11M7 11l5 4 5-4"/><path d="M5 19h14"/></>,
    check:    <path d="M5 12.5l4.5 4.5L19 7"/>,
    layers:   <><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></>,
    beaker:   <><path d="M9 3h6M10 3v6l-5 8.5A2 2 0 0 0 6.7 21h10.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7.5 15h9"/></>,
    terminal: <><rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M7 9.5l3 2.5-3 2.5M13 15h4"/></>,
    grid:     <><rect x="4" y="4" width="7" height="7" rx="1.2"/><rect x="13" y="4" width="7" height="7" rx="1.2"/><rect x="4" y="13" width="7" height="7" rx="1.2"/><rect x="13" y="13" width="7" height="7" rx="1.2"/></>,
    chevron:  <path d="M9 6l6 6-6 6"/>,
    external: <><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/></>,
    spark:    <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/>,
    target:   <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/></>,
    list:     <><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
    clock:    <><circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.5"/></>,
    cube:     <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 3v18M4 7.5l8 4.5 8-4.5"/></>,
    sliders:  <><path d="M4 8h10M18 8h2M4 16h2M10 16h10"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/></>,
    flask:    <><path d="M10 3h4M11 3v5l-4.5 9A1.8 1.8 0 0 0 8.2 20h7.6a1.8 1.8 0 0 0 1.7-3L13 8V3"/></>,
    chart:    <><path d="M4 4v16h16"/><path d="M8 15l3-4 3 2 4-6"/></>,
    home:     <><path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* ---------- brand mark: stack of slices (measured=orange, interp=gray) ---------- */
function BrandMark({ size = 34 }) {
  const s = size, layers = [
    { y: 0.62, c: '#EA851B' }, { y: 0.46, c: '#C9CCD2' },
    { y: 0.30, c: '#C9CCD2' }, { y: 0.14, c: '#1F3A5F' },
  ];
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" style={{ display:'block' }}>
      {layers.map((l, i) => {
        const y = l.y * 40;
        return <path key={i} d={`M6 ${y+6} L20 ${y} L34 ${y+6} L20 ${y+12} Z`}
          fill={l.c} opacity={l.c === '#C9CCD2' ? 0.9 : 1} />;
      })}
    </svg>
  );
}

/* ---------- slice image with caption ---------- */
function SliceImage({ domain, kind = 'bin', cap, style, className = '' }) {
  return (
    <div className={`slice-frame ${className}`} style={style}>
      <img src={`assets/slices/${domain}_${kind}.png`} alt={`${domain} ${kind}`} loading="lazy" />
      {cap && <div className="slice-cap">{cap}</div>}
    </div>
  );
}

/* ---------- group toggle (segmented) ---------- */
function GroupToggle({ value, onChange, size = 'md' }) {
  const G = window.COURSE.groups;
  const items = [G.g1, G.g2];
  return (
    <div className={`grp-toggle ${size}`} role="tablist">
      {items.map(g => {
        const on = value === g.id;
        return (
          <button key={g.id} role="tab" aria-selected={on}
            className={`grp-pill ${on ? 'on ' + g.accent : ''}`}
            onClick={() => onChange(g.id)}>
            <span className="grp-name">{g.name}</span>
            <span className="grp-tag">{g.tag}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- top navigation bar ---------- */
function TopBar({ route, group, onGroup }) {
  const nav = [
    { id:'home',  label:'홈',       icon:'home' },
    { id:'w1',    label:'W1 주차',  icon:'book' },
    { id:'demo',  label:'데모',     icon:'sliders' },
    { id:'setup', label:'설치',     icon:'terminal' },
  ];
  const active = (id) => route === id || (id==='w1' && route.startsWith('w'));
  return (
    <header className="topbar">
      <a href="#/home" className="brand">
        <BrandMark size={30} />
        <div className="brand-txt">
          <div className="brand-name">Digital Rock</div>
          <div className="brand-sub">Sparse Slice Interpolation</div>
        </div>
      </a>
      <nav className="topnav">
        {nav.map(n => (
          <a key={n.id} href={`#/${n.id}`} className={`topnav-i ${active(n.id) ? 'on' : ''}`}>
            <Icon name={n.icon} size={16} />{n.label}
          </a>
        ))}
      </nav>
      <div className="topbar-right">
        <GroupToggle value={group} onChange={onGroup} size="sm" />
      </div>
    </header>
  );
}

/* ---------- section header ---------- */
function SectionHead({ eyebrow, title, sub, right }) {
  return (
    <div className="row between center" style={{ marginBottom: 20, flexWrap:'wrap', gap:12 }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 7 }}>{eyebrow}</div>}
        <h2 className="h1">{title}</h2>
        {sub && <p className="muted" style={{ margin:'8px 0 0', maxWidth: 620 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- footer ---------- */
function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="foot-inner">
        <div className="row center gap-12">
          <BrandMark size={26} />
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>Digital Rock · DL Education</div>
            <div className="muted font-mono" style={{ fontSize:11.5 }}>Sparse Slice Interpolation · 6-week course</div>
          </div>
        </div>
        <div className="muted font-mono" style={{ fontSize:11.5 }}>
          repo: Digital_rock_DL_Education · deployed on Vercel / GitHub Pages
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Icon, BrandMark, SliceImage, GroupToggle, TopBar, SectionHead, SiteFooter });
