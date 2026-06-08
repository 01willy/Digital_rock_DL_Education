/* =====================================================================
   volume.js — synthetic 3D pore volume + sparse reconstruction
   (pure JS, no deps). Mirrors dr_utils.py concepts in the browser.
   ===================================================================== */
(function () {
  // seeded RNG (mulberry32)
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const smooth = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  // value-noise field on a coarse lattice, trilinear + smoothstep, 2 octaves
  function buildField(D, H, W, seed) {
    const r = rng(seed);
    function octave(gx, gy, gz) {
      const grid = new Float32Array((gx + 1) * (gy + 1) * (gz + 1));
      for (let i = 0; i < grid.length; i++) grid[i] = r();
      const gidx = (x, y, z) => ((z * (gy + 1)) + y) * (gx + 1) + x;
      return (fx, fy, fz) => {
        const X = fx * gx, Y = fy * gy, Z = fz * gz;
        const x0 = Math.floor(X), y0 = Math.floor(Y), z0 = Math.floor(Z);
        const tx = smooth(X - x0), ty = smooth(Y - y0), tz = smooth(Z - z0);
        const c = (dx, dy, dz) => grid[gidx(x0 + dx, y0 + dy, z0 + dz)];
        const x00 = lerp(c(0,0,0), c(1,0,0), tx), x10 = lerp(c(0,1,0), c(1,1,0), tx);
        const x01 = lerp(c(0,0,1), c(1,0,1), tx), x11 = lerp(c(0,1,1), c(1,1,1), tx);
        return lerp(lerp(x00, x10, ty), lerp(x01, x11, ty), tz);
      };
    }
    const o1 = octave(6, 6, 6), o2 = octave(12, 12, 12), o3 = octave(3, 3, 3);
    const field = new Float32Array(D * H * W);
    let k = 0;
    for (let z = 0; z < D; z++)
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const fz = z / (D - 1), fy = y / (H - 1), fx = x / (W - 1);
          field[k++] = 0.55 * o1(fx, fy, fz) + 0.3 * o2(fx, fy, fz) + 0.15 * o3(fx, fy, fz);
        }
    return field;
  }

  // threshold field -> binary so that porosity ≈ targetPhi (pore = field below cut)
  function binarize(field, targetPhi) {
    const sorted = Float32Array.from(field).sort();
    const cut = sorted[Math.floor(targetPhi * sorted.length)];
    const bin = new Uint8Array(field.length);
    for (let i = 0; i < field.length; i++) bin[i] = field[i] < cut ? 1 : 0; // 1 = pore
    return bin;
  }

  function makeVolume(D, H, W, targetPhi, seed) {
    const field = buildField(D, H, W, seed);
    const bin = binarize(field, targetPhi);
    return { D, H, W, bin };
  }

  const dimsOf = (v, axis) => axis === 0 ? v.D : axis === 1 ? v.H : v.W;

  // extract a plane along axis at idx -> {rows, cols, data(Uint8)}
  function getPlane(v, bin, axis, idx) {
    const { D, H, W } = v;
    let rows, cols, out;
    if (axis === 0) { rows = H; cols = W; out = new Uint8Array(rows * cols);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * cols + x] = bin[(idx * H + y) * W + x];
    } else if (axis === 1) { rows = D; cols = W; out = new Uint8Array(rows * cols);
      for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) out[z * cols + x] = bin[(z * H + idx) * W + x];
    } else { rows = D; cols = H; out = new Uint8Array(rows * cols);
      for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) out[z * cols + y] = bin[(z * H + y) * W + idx];
    }
    return { rows, cols, data: out };
  }

  const phi = (bin) => { let s = 0; for (let i = 0; i < bin.length; i++) s += bin[i]; return s / bin.length; };

  function measuredIdx(L, k) { const a = []; for (let i = 0; i < L; i += k) a.push(i); if (a[a.length - 1] !== L - 1) a.push(L - 1); return a; }

  // full sparse reconstruction along axis; returns reconstructed bin volume + stats
  function reconstruct(v, axis, k, thr) {
    const { D, H, W, bin } = v;
    const L = dimsOf(v, axis);
    const meas = measuredIdx(L, k);
    const measSet = new Set(meas);
    const recon = new Uint8Array(bin.length);
    // helper to write a plane into recon at axis idx
    const setPlane = (idx, planeData) => {
      if (axis === 0) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) recon[(idx * H + y) * W + x] = planeData[y * W + x]; }
      else if (axis === 1) { for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) recon[(z * H + idx) * W + x] = planeData[z * W + x]; }
      else { for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) recon[(z * H + y) * W + idx] = planeData[z * H + y]; }
    };
    // copy measured planes
    for (const m of meas) setPlane(m, getPlane(v, bin, axis, m).data);
    // interpolate missing
    let bi = 0;
    for (let i = 0; i < L; i++) {
      if (measSet.has(i)) continue;
      while (meas[bi + 1] !== undefined && meas[bi + 1] <= i) bi++;
      const before = meas[bi], after = meas[bi + 1] ?? before;
      const pb = getPlane(v, bin, axis, before).data;
      const pa = getPlane(v, bin, axis, after).data;
      const alpha = after === before ? 0 : (i - before) / (after - before);
      const plane = new Uint8Array(pb.length);
      for (let j = 0; j < pb.length; j++) plane[j] = ((1 - alpha) * pb[j] + alpha * pa[j]) > thr ? 1 : 0;
      setPlane(i, plane);
    }
    const phiO = phi(bin), phiR = phi(recon);
    // voxel-level mismatch ratio — 항상 단조 증가하는 직관적 metric (k 커질수록 측정 정보 ↓ → 불일치 ↑)
    let nMismatch = 0;
    for (let i = 0; i < bin.length; i++) if (recon[i] !== bin[i]) nMismatch++;
    const mismatchRatio = nMismatch / bin.length;
    return { recon, meas, measSet, L, phiOrig: phiO, phiRecon: phiR, absDphi: Math.abs(phiR - phiO),
             mismatchRatio,
             nMeasured: meas.length, ratio: meas.length / L };
  }

  // reconstruct a single missing plane (for the compare view) without full volume
  function interpPlane(v, axis, before, after, idx, thr) {
    const pb = getPlane(v, v.bin, axis, before).data;
    const pa = getPlane(v, v.bin, axis, after).data;
    const alpha = after === before ? 0 : (idx - before) / (after - before);
    const sample = getPlane(v, v.bin, axis, before); // for rows/cols
    const plane = new Uint8Array(pb.length);
    for (let j = 0; j < pb.length; j++) plane[j] = ((1 - alpha) * pb[j] + alpha * pa[j]) > thr ? 1 : 0;
    return { rows: sample.rows, cols: sample.cols, data: plane, alpha };
  }

  // error curve over k = 1..maxK — voxel mismatch ratio (단조 증가, 학생 직관용)
  function errorCurve(v, axis, thr, maxK) {
    const out = [];
    for (let k = 1; k <= maxK; k++) {
      const r = reconstruct(v, axis, k, thr);
      out.push({ k, err: r.mismatchRatio });
    }
    return out;
  }

  // draw a binary plane to canvas. mode: 'pore' (navy pore) | 'diff' (red mismatch vs ref)
  function drawPlane(canvas, plane, opts = {}) {
    const { rows, cols, data } = plane;
    const ctx = canvas.getContext('2d');
    canvas.width = cols; canvas.height = rows;
    const img = ctx.createImageData(cols, rows);
    const solid = opts.solid || [237, 232, 223];   // #EDE8DF
    const pore = opts.pore || [31, 58, 95];         // navy
    for (let i = 0; i < data.length; i++) {
      const c = data[i] ? pore : solid;
      img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawDiff(canvas, plane, ref) {
    const { rows, cols, data } = plane;
    const ctx = canvas.getContext('2d');
    canvas.width = cols; canvas.height = rows;
    const img = ctx.createImageData(cols, rows);
    let mism = 0;
    for (let i = 0; i < data.length; i++) {
      const wrong = data[i] !== ref.data[i];
      if (wrong) mism++;
      const c = wrong ? [200, 58, 58] : [246, 243, 238];
      img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return mism / data.length;
  }

  window.VOL = { makeVolume, getPlane, reconstruct, interpPlane, errorCurve, drawPlane, drawDiff, phi, dimsOf, measuredIdx };
})();
