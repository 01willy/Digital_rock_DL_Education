/* =====================================================================
   week.jsx — week detail page (generic, group-aware)
   ===================================================================== */
const { useState: useStateW } = React;

function ResourceCard({ icon, kind, name, meta, href, onClick, primary }) {
  const inner = (
    <>
      <div className="res-icon"><Icon name={icon} size={20} /></div>
      <div className="res-body">
        <div className="res-kind">{kind}</div>
        <div className="res-name font-mono">{name}</div>
        <div className="res-meta">{meta}</div>
      </div>
      <Icon name={onClick ? 'chevron' : (primary ? 'arrow' : 'external')} size={16} style={{ color: 'var(--ink-3)' }} />
    </>
  );
  if (onClick) return <button className={`res-card ${primary ? 'primary' : ''}`} onClick={onClick}>{inner}</button>;
  return <a className={`res-card ${primary ? 'primary' : ''}`} href={href} target="_blank" rel="noopener">{inner}</a>;
}

function TermCard({ t }) {
  const [open, setOpen] = useStateW(false);
  return (
    <button className={`term-card ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
      <div className="term-top">
        <span className="term-name font-mono">{t.term}</span>
        <span className="term-tag">{t.tag}</span>
      </div>
      <div className="term-def">{t.ko}</div>
    </button>
  );
}

/* ---------- preview scaffold for weeks not yet released ---------- */
function WeekPreview({ w, onNav }) {
  const prev = window.COURSE.weeks[w.n - 2];   // previous week (w.n is 1-based); undefined for n<=1
  return (
    <div className="page page-wide">
      <div className="crumb">
        <a href="#/home">홈</a><Icon name="chevron" size={13} /><span>Week {String(w.n).padStart(2, '0')}</span>
      </div>
      <div className="wk-hero">
        <div>
          <div className="row center gap-12 wrap" style={{ marginBottom: 14 }}>
            <span className="wk-hero-num font-mono">WEEK {String(w.n).padStart(2, '0')}</span>
            <StatusBadge status={w.status} />
            {w.nonDL && <span className="badge badge-green"><span className="dot"></span>non-DL</span>}
          </div>
          <h1 className="h1" style={{ fontSize: 'clamp(28px,3.6vw,40px)' }}>{w.title}</h1>
          <div className="wk-hero-en font-mono">{w.en}</div>
          <p className="lead" style={{ marginTop: 14, maxWidth: 600 }}>{w.summary}</p>
        </div>
        <div className="wk-hero-side prep-side">
          <div className="row center gap-8" style={{ marginBottom: 14 }}>
            <Icon name="clock" size={16} style={{ color: 'var(--orange-600)' }} />
            <b style={{ fontSize: 14 }}>준비 중인 주차</b>
          </div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, margin: '0 0 16px' }}>
            아래는 이 주차에서 다룰 내용의 미리보기입니다. 이미 공개된 주차와 동일한 템플릿으로 공개됩니다.
          </p>
          {w.prep && <>
            <div className="eyebrow muted" style={{ marginBottom: 8 }}>들어가기 전 준비물</div>
            {w.prep.map((p, i) => <div key={i} className="prep-i font-mono"><Icon name="check" size={14} />{p}</div>)}
          </>}
        </div>
      </div>

      {/* what's coming */}
      <section style={{ marginTop: 44 }}>
        <SectionHead eyebrow="WHAT'S COMING" title="이 주차에서 다룰 것" />
        <div className="plan-grid">
          {(w.plan || []).map((p, i) => (
            <div key={i} className="plan-card">
              <div className="plan-no font-mono">{String(i + 1).padStart(2, '0')}</div>
              <div className="plan-t">{p}</div>
            </div>
          ))}
        </div>
      </section>

      {/* new utils + concepts */}
      <section style={{ marginTop: 44 }}>
        <div className="two-col-sec">
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>NEW IN dr_utils.py</div>
            <div className="newutil-list">
              {(w.newUtils || []).map((u, i) => (
                <div key={i} className="newutil font-mono"><Icon name="terminal" size={14} />{u}<span className="nu-paren">()</span></div>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>KEY CONCEPTS</div>
            <div className="wk-concepts">
              {w.concepts.map((c, i) => <span key={i} className="wk-chip">{c}</span>)}
            </div>
          </div>
        </div>
      </section>

      {prev && (
        <section style={{ marginTop: 44 }}>
          <div className="prevweek card">
            <div>
              <div className="eyebrow">계속하려면</div>
              <h3 className="h2" style={{ marginTop: 8 }}>먼저 {prev.slug.toUpperCase()}을(를) 완료하세요</h3>
              <p className="muted" style={{ marginTop: 8 }}>각 주차는 이전 주차의 결과 위에 쌓입니다.</p>
            </div>
            <button className="btn btn-navy" onClick={() => onNav(prev.slug)}><Icon name="book" size={16} />{prev.slug.toUpperCase()}로 가기</button>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- full week page (generic, data-driven via C[w.slug]) ---------- */
function WeekFull({ w, group, onGroup, onNav }) {
  const C = window.COURSE;
  const wd = C[w.slug];                 // per-week data (flow · groups · selfcheck · res · guide)
  const gd = wd.groups[group];
  const grp = C.groups[group];
  const r = wd.res;
  const guide = wd.guide || C.guide;    // W1 keeps top-level C.guide; W2+ nest their own
  const SLUG = w.slug.toUpperCase();
  const wkNum = String(w.n).padStart(2, '0');
  // 본 자료는 그룹과 무관하게 공통 (shared/), 2조에게는 보조 노트(g2_supplement/) 추가 카드
  const shared = `downloads/shared/${w.slug}`;
  const supp = `downloads/g2_supplement/${w.slug}`;
  const next = C.weeks[w.n];            // next week object (undefined if last)

  return (
    <div className="page page-wide">
      <div className="crumb">
        <a href="#/home">홈</a><Icon name="chevron" size={13} /><span>Week {wkNum}</span>
      </div>

      {/* header */}
      <div className="wk-hero">
        <div>
          <div className="row center gap-12 wrap" style={{ marginBottom: 14 }}>
            <span className="wk-hero-num font-mono">WEEK {wkNum}</span>
            <StatusBadge status={w.status} />
            {w.nonDL && <span className="badge badge-green"><span className="dot"></span>non-DL</span>}
          </div>
          <h1 className="h1" style={{ fontSize: 'clamp(28px,3.6vw,40px)' }}>{w.title}</h1>
          <div className="wk-hero-en font-mono">{w.en}</div>
          <p className="lead" style={{ marginTop: 14, maxWidth: 600 }}>{w.summary}</p>
        </div>
        <div className="wk-hero-side">
          <div className="eyebrow muted" style={{ marginBottom: 10 }}>학습 트랙 선택</div>
          <GroupToggle value={group} onChange={onGroup} size="md" />
          <div className="wk-hero-grpinfo">
            <Icon name="layers" size={15} />
            <span><b>{grp.name} · {grp.track}</b> — {grp.desc}</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
            본 자료는 모든 학생 공통. <b style={{ color: 'var(--orange-600)' }}>2조 선택 시</b> 개념 풀이·코드 walkthrough·mini 예제 3종이 추가로 표시됩니다.
          </div>
        </div>
      </div>

      {/* Step 0 — 환경 설치 안내 */}
      <section style={{ marginTop: 36 }}>
        <div className="card card-pad" style={{ background: 'var(--tint-navy)', borderColor: '#CBD8E6' }}>
          <div className="row between center wrap" style={{ gap: 14 }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--navy)', marginBottom: 6 }}>STEP 0 — 처음이라면</div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>먼저 Python 환경부터 설정하세요 (약 5분)</div>
              <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>conda 환경 + 필수 패키지 설치. GPU 없이 CPU만으로 진행 가능.</div>
            </div>
            <a href="#/setup" className="btn btn-ghost btn-lg" style={{ borderColor: 'var(--navy)' }}>
              <Icon name="terminal" size={18} />환경 설치 가이드
            </a>
          </div>
        </div>
      </section>

      {/* 공통 본 자료 */}
      <section style={{ marginTop: 36 }}>
        <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--orange-600)' }}>본 자료 · 모든 학생 공통</div>
        <div className="res-grid">
          <ResourceCard icon="slides" kind="강의 슬라이드 (웹 슬라이드)" name={`${SLUG} deck`}
            meta="웹에서 바로 보기" href={r.deck} primary />
          <ResourceCard icon="external" kind="노트북 미리보기 (웹뷰)" name="실행 결과 + 그림 포함"
            meta="다운로드 전 결과 미리 확인" href={r.notebookHtml} />
          <ResourceCard icon="notebook" kind="실습 노트북 (다운로드)" name={r.notebook}
            meta="클릭 시 .ipynb 다운로드" href={`${shared}/${r.notebook}`} />
          {r.utils.map((u, i) => (
            <ResourceCard key={i} icon="terminal" kind="유틸리티 (다운로드)" name={u.name}
              meta={u.meta} href={`${shared}/${u.name}`} />
          ))}
          <ResourceCard icon="book" kind="핸드아웃 (다운로드)" name={r.handout.name}
            meta={r.handout.meta} href={`${shared}/${r.handout.name}`} />
          {r.pptx && (
            <ResourceCard icon="slides" kind="강의 슬라이드 (PPTX 다운로드)" name={r.pptx}
              meta="오프라인 발표·편집용" href={`${shared}/${r.pptx}`} />
          )}
        </div>
        <div className="ctl-hint" style={{ marginTop: 14 }}>
          📦 모든 코드·문서 한 번에 받기 — <a href={`downloads/shared/${r.codezip}`}><b>{r.codezip}</b></a>
        </div>
      </section>

      {/* 데이터 — 독립 카드로 분리 + 디렉토리 안내 */}
      <section style={{ marginTop: 36 }}>
        <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--orange-600)' }}>실습 데이터 · 노트북 실행에 필요</div>
        <div className="card card-pad" style={{ background: 'var(--tint)', borderColor: 'var(--orange-200)' }}>
          <div className="row between center wrap" style={{ gap: 14 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{r.data.title}</div>
              <div className="muted" style={{ fontSize: 14 }}>{r.data.desc}</div>
              <pre style={{ background: 'var(--panel)', padding: '10px 14px', marginTop: 10, fontSize: 13, borderRadius: 8, lineHeight: 1.6 }}>
{r.data.tree}
              </pre>
            </div>
            <a href={`downloads/${r.data.file}`} className="btn btn-primary btn-lg" download>
              <Icon name="download" size={18} />데이터 다운로드
            </a>
          </div>
        </div>
      </section>

      {/* 2조 전용 보조 노트 */}
      {group === 'g2' && (
        <section style={{ marginTop: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--orange-600)' }}>
            2조 전용 보조 노트 · 본 자료를 더 친절히 설명
          </div>
          <div className="res-grid">
            {r.supp.map((s, i) => (
              <ResourceCard key={i} icon={s.icon} kind={s.kind} name={s.name}
                meta={s.meta} href={`${supp}/${s.name}`} />
            ))}
          </div>
          <div className="ctl-hint" style={{ marginTop: 14 }}>
            📦 보조 노트 한 번에 받기 — <a href={`downloads/g2_supplement/${r.suppzip}`}><b>{r.suppzip}</b></a>
          </div>
        </section>
      )}

      {/* learning flow — NO times */}
      <section style={{ marginTop: 56 }}>
        <SectionHead eyebrow="SESSION FLOW" title="학습 흐름"
          sub={`${grp.name} · ${grp.track} 권장 진행 순서입니다.`} />
        <div className="flow">
          {wd.flow.map((f, i) => (
            <div key={i} className="flow-row noflow-time">
              <div className="flow-line"><span className="flow-dot"></span>{i < wd.flow.length - 1 && <span className="flow-bar"></span>}</div>
              <div className="flow-body">
                <div className="flow-step font-mono">STEP {String(i + 1).padStart(2, '0')}</div>
                <div className="flow-act">{f.a}</div>
                <div className="flow-src font-mono">{f.src}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DEEP-DIVE GUIDE ===== */}
      <section style={{ marginTop: 56 }} id="guide-anchor">
        <SectionHead eyebrow="자료 깊이 보기" title="노트북 & 유틸리티 가이드"
          sub="다운로드만으로 끝나지 않게 — 무엇을 실행하고 어떤 인자를 어떻게 바꿔야 하는지 안내합니다." />
        <GuideSection guide={guide} onNav={onNav} />
      </section>

      {/* glossary */}
      <section style={{ marginTop: 56 }}>
        <SectionHead eyebrow="KEY TERMS" title="핵심 용어 사전"
          sub="클릭하면 펼쳐집니다. 노트북 옆에 두고 모르는 용어가 나오면 바로 확인하세요." />
        <div className="term-grid">
          {C.glossary.map((t, i) => <TermCard key={i} t={t} />)}
        </div>
      </section>

      {/* tasks */}
      <section style={{ marginTop: 56 }}>
        <SectionHead eyebrow="ASSIGNMENTS"
          title={`탐구 과제 · ${grp.name}`}
          sub={`${next ? 'W' + next.n : '다음 주차'} 시작 전까지 수행하세요. 데모 페이지에서 미리 감을 잡을 수 있습니다.`}
          right={<button className="btn btn-ghost btn-sm" onClick={() => onNav('demo')}><Icon name="sliders" size={15} />데모로 실험</button>} />
        <div className="task-list">
          {gd.tasks.map((t, i) => (
            <div key={i} className={`task-card ${t.req ? 'req' : ''}`}>
              <div className="task-no font-mono">{String(i + 1).padStart(2, '0')}</div>
              <div className="task-main">
                <div className="task-head">
                  <span className="task-t">{t.t}</span>
                  <span className={`badge ${t.req ? 'badge-orange' : 'badge-ghost'}`}>{t.req ? '필수' : '선택'}</span>
                </div>
                <p className="task-d">{t.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* self-check */}
      <section style={{ marginTop: 56 }}>
        <SectionHead eyebrow="SELF-CHECK" title="자기 점검 질문"
          sub="핸드아웃에 직접 답을 적어보세요. 답이 막히면 해당 용어·데모로 돌아가 확인합니다." />
        <div className="selfcheck">
          {wd.selfcheck.map((q, i) => (
            <div key={i} className="sc-row">
              <span className="sc-q-no font-mono">Q{i + 1}</span>
              <span className="sc-q-txt">{q}</span>
            </div>
          ))}
        </div>
      </section>

      {/* next week */}
      {next && (
        <section style={{ marginTop: 56 }}>
          <div className="nextweek card">
            <div>
              <div className="eyebrow">NEXT · WEEK {String(next.n).padStart(2, '0')}</div>
              <h3 className="h2" style={{ marginTop: 8 }}>{next.title} <span className="muted font-mono" style={{ fontSize: 15 }}>· {next.en}</span></h3>
              <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>{next.summary}</p>
              <div className="wk-concepts" style={{ marginTop: 14 }}>
                {next.concepts.map((c, i) => <span key={i} className="wk-chip">{c}</span>)}
              </div>
            </div>
            <div className="nextweek-prep">
              <div className="eyebrow muted" style={{ marginBottom: 8 }}>준비물</div>
              {(next.prep || []).map((p, i) => <div key={i} className="prep-i font-mono"><Icon name="check" size={14} />{p}</div>)}
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 14, width: '100%' }} onClick={() => onNav(next.slug)}>
                {next.slug.toUpperCase()} {next.available ? '바로가기' : '미리보기'} <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function WeekPage({ group, onGroup, onNav, weekN = 1 }) {
  const w = window.COURSE.weeks.find(x => x.n === weekN) || window.COURSE.weeks[0];
  if (!w.available) return <WeekPreview w={w} onNav={onNav} />;
  return <WeekFull w={w} group={group} onGroup={onGroup} onNav={onNav} />;
}

window.WeekPage = WeekPage;
