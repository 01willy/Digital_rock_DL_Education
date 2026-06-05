/* =====================================================================
   week_guide.jsx — W1 deep-dive: notebook + dr_utils + parameter playbook
   ===================================================================== */
const { useState: useStateG } = React;

const KIND_META = {
  setup:  { c:'navy',   t:'환경' },
  io:     { c:'navy',   t:'I/O' },
  view:   { c:'orange', t:'시각화' },
  metric: { c:'green',  t:'평가' },
  sparse: { c:'orange', t:'Sparse' },
  interp: { c:'orange', t:'보간' },
  recon:  { c:'navy',   t:'복원' },
};
const GROUP_COLOR = {
  '데이터 I/O':'navy', '시각화':'orange', 'Sparse':'orange', '보간':'orange', '평가':'green',
};

/* notebook walkthrough */
function NotebookWalk() {
  const nb = window.COURSE.guide.notebook;
  return (
    <div className="nb-wrap">
      <div className="nb-file">
        <Icon name="notebook" size={18} />
        <span className="font-mono">{nb.file}</span>
        <span className="badge badge-ghost" style={{ marginLeft:'auto' }}>{nb.cells.length} 셀 · {nb.tryits.length} Try-it!</span>
      </div>
      <div className="nb-cells">
        {nb.cells.map((c, i) => {
          const km = KIND_META[c.kind] || KIND_META.io;
          return (
            <div key={i} className="nb-cell">
              <div className="nbc-rail">
                <span className="nbc-no font-mono">{c.n}</span>
                {i < nb.cells.length - 1 && <span className="nbc-bar"></span>}
              </div>
              <div className="nbc-body">
                <div className="nbc-head">
                  <span className="nbc-t">{c.t}</span>
                  <span className={`badge badge-${km.c}`}>{km.t}</span>
                </div>
                <pre className="nbc-code font-mono">{c.code}</pre>
                <p className="nbc-d">{c.d}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* try-it box table */
function TryItTable() {
  const tt = window.COURSE.guide.notebook.tryits;
  return (
    <div className="tryit-wrap">
      <div className="tryit-head">
        <Icon name="spark" size={16} /><b>[Try-it!] 박스 — 모두 직접 수행하세요</b>
      </div>
      <div className="tryit-grid">
        {tt.map((t, i) => (
          <div key={i} className="tryit-card">
            <div className="ti-no font-mono">{t.n}</div>
            <div className="ti-fn font-mono">{t.fn}</div>
            <div className="ti-row"><span className="ti-k">바꾼다</span><span>{t.change}</span></div>
            <div className="ti-row"><span className="ti-k">관찰</span><span>{t.observe}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* dr_utils function reference card (expandable) */
function UtilCard({ u }) {
  const [open, setOpen] = useStateG(false);
  const gc = GROUP_COLOR[u.group] || 'navy';
  return (
    <div className={`util-card ${open ? 'open' : ''}`}>
      <button className="util-head" onClick={() => setOpen(o => !o)}>
        <div className="uh-left">
          <span className={`util-group badge badge-${gc}`}>{u.group}</span>
          <span className="util-fn font-mono">{u.fn}<span className="util-paren">()</span></span>
        </div>
        <Icon name="chevron" size={16} style={{ transform: open ? 'rotate(90deg)' : 'none', transition:'transform .2s', color:'var(--ink-3)' }} />
      </button>
      <div className="util-sig font-mono">{u.sig}</div>
      <div className="util-body">
        <p className="util-desc">{u.desc}</p>
        <div className="util-ret font-mono"><span className="ur-k">returns</span> {u.ret}</div>
        <div className="eyebrow muted" style={{ margin:'16px 0 10px' }}>PARAMETERS</div>
        <div className="param-list">
          {u.params.map((p, i) => (
            <div key={i} className="param-row">
              <span className="param-name font-mono">{p.p}</span>
              <div className="param-info">
                <span className="param-d">{p.d}</span>
                {p.try && <div className="param-try"><Icon name="sliders" size={13} /><span>{p.try}</span></div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* parameter mindset playbook */
function Playbook() {
  const pb = window.COURSE.guide.playbook;
  return (
    <div className="playbook">
      {pb.map((p, i) => (
        <React.Fragment key={i}>
          <div className="pb-card">
            <div className="pb-step font-mono">{String(i + 1).padStart(2, '0')}</div>
            <div className="pb-ic"><Icon name={p.icon} size={20} /></div>
            <div className="pb-t">{p.t}</div>
            <div className="pb-d">{p.d}</div>
          </div>
          {i < pb.length - 1 && <div className="pb-arrow"><Icon name="arrow" size={20} /></div>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* the whole guide section */
function GuideSection({ onNav }) {
  const g = window.COURSE.guide;
  return (
    <div className="guide-sec">
      <div className="guide-intro card card-pad">
        <div className="gi-ic"><Icon name="target" size={22} /></div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>어떻게 학습하나</div>
          <p className="gi-text">{g.intro}</p>
        </div>
      </div>

      <Playbook />

      <div style={{ marginTop: 44 }}>
        <SectionHead eyebrow="NOTEBOOK WALKTHROUGH" title="실습 노트북 — 셀 단위로 따라가기"
          sub="각 셀이 무엇을 하고, 어디서 [Try-it!]으로 인자를 바꾸는지 한눈에." />
        <div className="guide-2col">
          <NotebookWalk />
          <TryItTable />
        </div>
      </div>

      <div style={{ marginTop: 44 }}>
        <SectionHead eyebrow="dr_utils.py REFERENCE" title="유틸리티 함수 — 인자를 어떻게 다루나"
          sub="카드를 펼치면 시그니처·인자·실험 가이드가 나옵니다. 직접 함수를 짜기보다, 인자를 바꿔 결과 차이를 관찰하세요."
          right={<button className="btn btn-ghost btn-sm" onClick={() => onNav('demo')}><Icon name="sliders" size={15} />데모로 실험</button>} />
        <div className="util-grid">
          {g.utils.map((u, i) => <UtilCard key={i} u={u} />)}
        </div>
      </div>
    </div>
  );
}

window.GuideSection = GuideSection;
