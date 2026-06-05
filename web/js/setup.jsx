/* =====================================================================
   setup.jsx — environment install guide
   ===================================================================== */
const { useState: useStateS } = React;

function CodeBlock({ code }) {
  const [copied, setCopied] = useStateS(false);
  const copy = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1400); };
  return (
    <div className="code-block">
      <pre className="font-mono">{code}</pre>
      <button className="code-copy" onClick={copy}>
        <Icon name={copied ? 'check' : 'list'} size={14} />{copied ? '복사됨' : '복사'}
      </button>
    </div>
  );
}

function SetupPage() {
  const S = window.COURSE.setup;
  return (
    <div className="page">
      <SectionHead eyebrow="GET STARTED" title="환경 설치 가이드"
        sub="노트북을 처음 실행하기 전, 가상환경과 패키지를 준비합니다. 운영체제 무관 · 약 5분." />

      <div className="setup-grid">
        {/* main steps */}
        <div className="setup-main">
          {S.steps.map((s, i) => (
            <div key={i} className="setup-step">
              <div className="ss-no font-mono">{i + 1}</div>
              <div className="ss-body">
                <div className="ss-title">{s.t}</div>
                <CodeBlock code={s.cmd} />
              </div>
            </div>
          ))}

          {/* troubleshooting */}
          <div style={{ marginTop: 16 }}>
            <div className="eyebrow muted" style={{ margin: '8px 0 14px' }}>TROUBLESHOOTING</div>
            <div className="trouble-list">
              {S.troubles.map((t, i) => (
                <div key={i} className="trouble-row">
                  <div className="tr-sym font-mono"><Icon name="terminal" size={14} />{t.s}</div>
                  <div className="tr-fix"><Icon name="arrow" size={14} />{t.f}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* side: env summary */}
        <aside className="setup-side">
          <div className="card card-pad env-card">
            <div className="eyebrow" style={{ marginBottom: 14 }}>환경 요약</div>
            <div className="env-row"><span>가상환경</span><b className="font-mono">{S.env}</b></div>
            <div className="env-row"><span>Python</span><b className="font-mono">{S.py}</b></div>
            <hr className="rule" style={{ margin: '14px 0' }} />
            <div className="eyebrow muted" style={{ marginBottom: 10 }}>패키지</div>
            <div className="env-pkgs">
              {S.pkgs.map((p, i) => <span key={i} className="env-pkg font-mono"><Icon name="check" size={12} />{p}</span>)}
            </div>
          </div>

          <div className="card card-pad" style={{ marginTop: 16 }}>
            <div className="row center gap-12" style={{ marginBottom: 10 }}>
              <div className="ins-icon"><Icon name="spark" size={18} /></div>
              <b style={{ fontSize: 14 }}>한글 폰트 깨짐?</b>
            </div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>
              노트북 첫 셀의 <code className="ic">setup_plot_style()</code>를 실행하면
              <b> Pretendard</b>가 자동 등록되어 matplotlib 그래프의 한글이 정상 표시됩니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.SetupPage = SetupPage;
