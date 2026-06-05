/* =====================================================================
   demo.jsx — interactive sparse imaging & interpolation playground
   ===================================================================== */
const { useState, useMemo, useRef, useEffect } = React;

/* canvas that redraws via a draw(canvas) callback */
function PlaneCanvas({ draw, dep, className, style }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && draw) draw(ref.current); }, dep);
  return <canvas ref={ref} className={`plane-cv ${className || ''}`} style={style} />;
}

const AX = [{ id: 0, k: 'z', label: 'z축' }, { id: 1, k: 'y', label: 'y축' }, { id: 2, k: 'x', label: 'x축' }];

function DemoPage({ group }) {
  const N = 64;
  const targetPhi = 0.221;
  const vol = useMemo(() => window.VOL.makeVolume(N, N, N, targetPhi, 1337), []);
  const [axis, setAxis] = useState(0);
  const [k, setK] = useState(3);
  const [thr, setThr] = useState(0.5);
  const [view, setView] = useState(20);

  const recon = useMemo(() => window.VOL.reconstruct(vol, axis, k, thr), [axis, k, thr]);
  const curve = useMemo(() => window.VOL.errorCurve(vol, axis, thr, 10), [axis, thr]);
  const L = recon.L;

  // clamp view to L
  useEffect(() => { if (view >= L) setView(L - 1); }, [L]);
  const vi = Math.min(view, L - 1);
  const isMeasured = recon.measSet.has(vi);

  // before/after measured for current view
  const before = [...recon.meas].filter(m => m <= vi).pop();
  const after = [...recon.meas].find(m => m > vi) ?? before;

  const VV = window.VOL;
  const origPlane = VV.getPlane(vol, vol.bin, axis, vi);
  const interp = !isMeasured ? VV.interpPlane(vol, axis, before, after, vi, thr) : null;

  const timeSaving = Math.round((1 - recon.ratio) * 100);
  const speed = (L / recon.nMeasured).toFixed(1);

  return (
    <div className="page page-wide">
      <SectionHead eyebrow="HANDS-ON DEMO"
        title="Sparse 측정 & 선형 보간 플레이그라운드"
        sub="하나의 합성 64³ 공극 부피를 ground truth로 고정하고, 그 위에서 sparse 간격 k·측정 축·이진화 임계값만 바꿔 보간 정확도를 비교합니다. 실제 micro-CT는 매번 다른 측정 데이터를 얻지만, 본 데모는 변수 통제를 통한 직관 형성이 목적입니다." />

      <div className="demo-grid">
        {/* LEFT: controls + pattern + stats */}
        <div className="demo-left">
          <div className="card card-pad">
            <div className="ctl-block">
              <div className="ctl-label">
                <span>Sparse 간격 <b className="font-mono">k</b></span>
                <span className="ctl-val font-mono">{k}</span>
              </div>
              <input className="range orange" type="range" min="1" max="10" step="1"
                value={k} onChange={e => setK(+e.target.value)} />
              <div className="ctl-hint">k장 중 1장만 측정 — 나머지는 보간으로 복원</div>
            </div>

            <div className="ctl-block">
              <div className="ctl-label"><span>측정 축</span></div>
              <div className="seg">
                {AX.map(a => (
                  <button key={a.id} className={`seg-i ${axis === a.id ? 'on' : ''}`}
                    onClick={() => setAxis(a.id)}>{a.label}</button>
                ))}
              </div>
              <div className="ctl-hint">등방성이면 어느 축이든 |Δφ|가 비슷해야 합니다</div>
            </div>

            <div className="ctl-block">
              <div className="ctl-label">
                <span>이진화 임계값 <b className="font-mono">thr</b></span>
                <span className="ctl-val font-mono">{thr.toFixed(2)}</span>
              </div>
              <input className="range navy" type="range" min="0.3" max="0.7" step="0.05"
                value={thr} onChange={e => setThr(+e.target.value)} />
              <div className="ctl-hint">보간 결과 &gt; thr → pore. 0.5가 기본</div>
            </div>
          </div>

          {/* measured pattern */}
          <div className="card card-pad" style={{ marginTop: 16 }}>
            <div className="eyebrow muted" style={{ marginBottom: 12 }}>측정 패턴 · {AX[axis].k}축 {L}슬라이스</div>
            <div className="patt-strip">
              {Array.from({ length: L }, (_, i) => {
                const m = recon.measSet.has(i);
                return <button key={i} title={`${AX[axis].k}=${i}${m ? ' · 측정' : ' · 보간'}`}
                  className={`patt-tick ${m ? 'meas' : 'interp'} ${i === vi ? 'cur' : ''}`}
                  onClick={() => setView(i)} />;
              })}
            </div>
            <div className="patt-legend">
              <span className="rl-i"><span className="rl-sw" style={{ background: 'var(--orange)' }}></span>측정</span>
              <span className="rl-i"><span className="rl-sw" style={{ background: '#D8DCE3' }}></span>보간 복원</span>
              <span className="rl-i" style={{ marginLeft: 'auto' }}><span className="rl-sw" style={{ background: 'var(--navy)' }}></span>현재 보기</span>
            </div>
          </div>

          {/* stats */}
          <div className="stat-grid">
            <div className="stat-card"><div className="sc-n font-mono tnum">{recon.nMeasured}<span className="sc-u">/{L}</span></div><div className="sc-l">측정 슬라이스</div></div>
            <div className="stat-card"><div className="sc-n font-mono tnum orange">{speed}×</div><div className="sc-l">획득 속도</div></div>
            <div className="stat-card"><div className="sc-n font-mono tnum">{timeSaving}%</div><div className="sc-l">시간 절감</div></div>
            <div className="stat-card hl"><div className="sc-n font-mono tnum">{recon.absDphi.toFixed(4)}</div><div className="sc-l">|Δφ| 공극률 오차</div></div>
          </div>
          <div className="phi-row">
            <span>φ 원본 <b className="font-mono">{recon.phiOrig.toFixed(3)}</b></span>
            <Icon name="arrow" size={14} />
            <span>φ 복원 <b className="font-mono">{recon.phiRecon.toFixed(3)}</b></span>
          </div>
        </div>

        {/* RIGHT: scrubber + compare */}
        <div className="demo-right">
          <div className="card card-pad">
            <div className="row between center" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div className="eyebrow muted">슬라이스 보기 · <span className="font-mono">{AX[axis].k} = {vi}</span></div>
              <span className={`badge ${isMeasured ? 'badge-orange' : 'badge-navy'}`}>
                <span className="dot"></span>{isMeasured ? '측정된 슬라이스' : `보간 복원 (α=${interp ? interp.alpha.toFixed(2) : '–'})`}
              </span>
            </div>
            <input className="range navy wide" type="range" min="0" max={L - 1} step="1"
              value={vi} onChange={e => setView(+e.target.value)} />

            {isMeasured ? (
              <div className="compare-one">
                <div className="cmp-cell wide-cell">
                  <PlaneCanvas dep={[axis, vi]} draw={(c) => VV.drawPlane(c, origPlane)} />
                  <div className="cmp-cap">측정됨 — 원본 그대로 사용</div>
                </div>
                <p className="cmp-note">이 슬라이스는 <b>k 간격에 포함되어 실제로 측정</b>되었습니다. 복원이 필요 없습니다.</p>
              </div>
            ) : (
              <div className="compare-4">
                <div className="cmp-cell">
                  <PlaneCanvas dep={[axis, before]} draw={(c) => VV.drawPlane(c, VV.getPlane(vol, vol.bin, axis, before))} />
                  <div className="cmp-cap">앞 측정 <span className="font-mono">{AX[axis].k}={before}</span></div>
                </div>
                <div className="cmp-cell">
                  <PlaneCanvas dep={[axis, vi, thr]} draw={(c) => VV.drawPlane(c, interp)} />
                  <div className="cmp-cap orange">선형 보간 복원</div>
                </div>
                <div className="cmp-cell">
                  <PlaneCanvas dep={[axis, vi]} draw={(c) => VV.drawPlane(c, origPlane)} />
                  <div className="cmp-cap">원본 (GT)</div>
                </div>
                <div className="cmp-cell">
                  <PlaneCanvas dep={[axis, vi, thr]} draw={(c) => VV.drawDiff(c, interp, origPlane)} />
                  <div className="cmp-cap red">오차맵 (빨강=불일치)</div>
                </div>
              </div>
            )}
          </div>

          {/* error curve */}
          <div className="card card-pad" style={{ marginTop: 16 }}>
            <div className="row between center" style={{ marginBottom: 10 }}>
              <div className="eyebrow muted">동일 부피 / k 1–10 시뮬레이션 · {AX[axis].k}축</div>
              <span className="muted" style={{ fontSize: 12 }}>현재 <b className="font-mono" style={{ color: 'var(--orange-600)' }}>k={k} · |Δφ|={(recon.absDphi*100).toFixed(2)}%p</b></span>
            </div>
            <ErrorCurve curve={curve} k={k} onPick={setK} />
            <div className="ctl-hint" style={{ marginTop: 10 }}>
              x축 = sparse 간격 k · y축 = 같은 부피를 k 간격으로 sampling 후 선형 보간했을 때의 |Δφ|.
              <br/>곡선은 한 번 계산되어 정적이지만, <b>k 슬라이더로 좌측 4-up 슬라이스 비교는 매번 다시 계산</b>됩니다.
              곡선이 급격히 꺾이는 k가 선형 보간의 실용 한계로, 그 이후로는 더 정교한 방법(deep learning)이 필요해집니다.
            </div>
          </div>
        </div>
      </div>

      {/* insight callouts — open-ended exploration */}
      <div className="insight-grid">
        <div className="insight">
          <div className="ins-icon"><Icon name="target" size={18} /></div>
          <div><b>탐구 · 측정량과 정확도의 관계</b><p>k를 1에서 10까지 움직이며 측정 슬라이스 수와 |Δφ| 변화를 관찰하세요. 선형 보간의 한계가 어디서 드러나는지, 그 한계가 실제 sparse imaging 연구의 어떤 문제와 닿는지 본인 언어로 정리해보세요.</p></div>
        </div>
        <div className="insight">
          <div className="ins-icon"><Icon name="layers" size={18} /></div>
          <div><b>탐구 · 축별 비교와 등방성</b><p>z·y·x 축을 바꾸며 |Δφ| 추이를 비교하세요. 본 합성 부피의 등방성 가정이 어느 축에서 약해지는지 — 그리고 실제 micro-CT 데이터에서 이 가정이 깨지면 어떤 분석 전략이 필요할지 토론거리로.</p></div>
        </div>
        <div className="insight">
          <div className="ins-icon"><Icon name="sliders" size={18} /></div>
          <div><b>탐구 · 임계값과 평가 metric</b><p>임계값을 0.3↔0.7로 sweep하면 복원 공극률이 단조 변화합니다. |Δφ|를 임의로 0에 가깝게 만들 수 있다면 그것을 \"좋은 복원\"이라 부를 수 있을까요? 다른 metric이 왜 필요한가요?</p></div>
        </div>
      </div>
    </div>
  );
}

/* error curve chart (canvas, themed) */
function ErrorCurve({ curve, k, onPick }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = 150;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    const padL = 42, padR = 12, padT = 12, padB = 26;
    const maxErr = Math.max(0.001, ...curve.map(c => c.err)) * 1.15;
    const x = (kk) => padL + (kk - 1) / 9 * (W - padL - padR);
    const y = (e) => padT + (1 - e / maxErr) * (H - padT - padB);
    // grid
    ctx.strokeStyle = '#EFECE6'; ctx.lineWidth = 1; ctx.font = '10px "JetBrains Mono"'; ctx.fillStyle = '#8A93A3';
    for (let g = 0; g <= 3; g++) {
      const e = maxErr * g / 3, yy = y(e);
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy); ctx.stroke();
      ctx.textAlign = 'right'; ctx.fillText(e.toFixed(3), padL - 6, yy + 3);
    }
    // area + line
    ctx.beginPath();
    curve.forEach((c, i) => { const X = x(c.k), Y = y(c.err); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.lineTo(x(10), y(0)); ctx.lineTo(x(1), y(0)); ctx.closePath();
    const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
    grad.addColorStop(0, 'rgba(234,133,27,.20)'); grad.addColorStop(1, 'rgba(234,133,27,.02)');
    ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath();
    curve.forEach((c, i) => { const X = x(c.k), Y = y(c.err); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.strokeStyle = '#EA851B'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();
    // points + x labels
    curve.forEach(c => {
      const X = x(c.k), Y = y(c.err), on = c.k === k;
      ctx.beginPath(); ctx.arc(X, Y, on ? 5.5 : 3.2, 0, 7);
      ctx.fillStyle = on ? '#1F3A5F' : '#EA851B'; ctx.fill();
      if (on) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = on ? '#1F3A5F' : '#8A93A3'; ctx.textAlign = 'center';
      ctx.font = (on ? 'bold ' : '') + '10px "JetBrains Mono"';
      ctx.fillText(c.k, X, H - 10);
    });
  });
  return <canvas ref={ref} className="err-curve" onClick={(e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const W = r.width, padL = 42, padR = 12;
    const kk = Math.round((e.clientX - r.left - padL) / (W - padL - padR) * 9 + 1);
    if (kk >= 1 && kk <= 10) onPick(kk);
  }} style={{ width: '100%', height: 150, cursor: 'pointer' }} />;
}

window.DemoPage = DemoPage;
