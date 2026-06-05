/* =====================================================================
   binloader.js — Real micro-CT .bin volume loader for the browser
   ---------------------------------------------------------------------
   학생 학습 UI에서 실제 micro-CT 부피 데이터를 fetch + 시각화하기 위한
   유틸. volume.js의 synthetic Perlin noise 대신, 우리 web/data/*.bin
   (64³ uint8) 파일을 직접 로드합니다.

   사용 예:
     const vol = await BinLoader.load('BB');     // 64x64x64 Uint8Array
     const sliceZ = BinLoader.getZSlice(vol, 32); // 64x64 Uint8Array
     BinLoader.drawSlice(canvas, sliceZ, { palette:'rock' });
   ===================================================================== */
(function () {
  'use strict';

  // ── 64³ 도메인 카탈로그 ──────────────────────────────────────────────
  // data.js 의 COURSE.domains 와 id 가 일치해야 함.
  const CATALOG = {
    BB:          { url: 'data/BB_64.bin',          shape: [64, 64, 64], voxel_um: 2.25, phi_expected: 0.226 },
    CastleGate:  { url: 'data/CastleGate_64.bin',  shape: [64, 64, 64], voxel_um: 2.25, phi_expected: 0.277 },
    Bentheimer:  { url: 'data/Bentheimer_64.bin',  shape: [64, 64, 64], voxel_um: 2.25, phi_expected: 0.249 },
    Parker:      { url: 'data/Parker_64.bin',      shape: [64, 64, 64], voxel_um: 2.25, phi_expected: 0.130 },
    Ketton:      { url: 'data/Ketton_64.bin',      shape: [64, 64, 64], voxel_um: 3.00, phi_expected: 0.118 },
    Estaillades: { url: 'data/Estaillades_64.bin', shape: [64, 64, 64], voxel_um: 3.31, phi_expected: 0.098 },
  };

  // 도메인 색 팔레트 (data.js의 design tokens와 통일)
  const PALETTES = {
    rock: { solid: [237, 232, 223], pore: [31, 58, 95] },       // solid=cream, pore=navy
    diff: { solid: [255, 255, 255], pore: [200, 58, 58] },      // for error map (red)
    gray: { solid: [255, 255, 255], pore: [24, 24, 24] },       // grayscale
  };

  // ── In-memory LRU cache ────────────────────────────────────────────
  const cache = new Map();
  const CACHE_LIMIT = 6;

  /**
   * Load a 64³ binary volume from /data/{id}_64.bin.
   * Returns a Uint8Array of length 64*64*64=262144 (values 0 or 1).
   */
  async function load(id) {
    if (cache.has(id)) {
      const v = cache.get(id);
      cache.delete(id);
      cache.set(id, v);
      return v;
    }
    const entry = CATALOG[id];
    if (!entry) throw new Error(`BinLoader: unknown domain '${id}'`);
    const res = await fetch(entry.url);
    if (!res.ok) throw new Error(`BinLoader: fetch failed for ${entry.url} (${res.status})`);
    const buf = await res.arrayBuffer();
    const expected = entry.shape[0] * entry.shape[1] * entry.shape[2];
    if (buf.byteLength !== expected) {
      throw new Error(`BinLoader: size mismatch for ${id} — got ${buf.byteLength}, expected ${expected}`);
    }
    const arr = new Uint8Array(buf);
    arr.shape = entry.shape;
    arr.voxel_um = entry.voxel_um;
    arr.id = id;
    cache.set(id, arr);
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
    return arr;
  }

  // ── Slice extraction (volume is in C-order [z, y, x]) ──────────────
  function getZSlice(vol, z) {
    const [Z, Y, X] = vol.shape;
    if (z < 0 || z >= Z) throw new Error(`z=${z} out of [0,${Z})`);
    return vol.subarray(z * Y * X, (z + 1) * Y * X);
  }

  function getYSlice(vol, y) {
    const [Z, Y, X] = vol.shape;
    const out = new Uint8Array(Z * X);
    for (let z = 0; z < Z; z++)
      for (let x = 0; x < X; x++)
        out[z * X + x] = vol[z * Y * X + y * X + x];
    out.shape = [Z, X];
    return out;
  }

  function getXSlice(vol, x) {
    const [Z, Y, X] = vol.shape;
    const out = new Uint8Array(Z * Y);
    for (let z = 0; z < Z; z++)
      for (let y = 0; y < Y; y++)
        out[z * Y + y] = vol[z * Y * X + y * X + x];
    out.shape = [Z, Y];
    return out;
  }

  // ── Statistics ─────────────────────────────────────────────────────
  function porosity(vol) {
    let s = 0;
    for (let i = 0; i < vol.length; i++) s += vol[i];
    return s / vol.length;
  }

  // ── Sparse imaging simulation (mirror of dr_utils.make_sparse) ─────
  function makeSparse(L, k) {
    const known = [];
    const missing = [];
    for (let i = 0; i < L; i++) (i % k === 0 ? known : missing).push(i);
    return { known, missing };
  }

  // ── Linear slice interpolation (mirror of linear_interpolate_slice) ─
  function linearInterpolate(sliceA, sliceB, alpha) {
    const out = new Float32Array(sliceA.length);
    for (let i = 0; i < sliceA.length; i++)
      out[i] = (1 - alpha) * sliceA[i] + alpha * sliceB[i];
    return out;
  }

  // Reconstruct an entire volume along z using linear interpolation between
  // known slices (every k-th). Returns Float32Array of same length as vol.
  function reconstructSparseLinear(vol, k) {
    const [Z, Y, X] = vol.shape;
    const out = new Float32Array(vol.length);
    // Copy known slices verbatim
    for (let z = 0; z < Z; z += k) {
      const sl = getZSlice(vol, z);
      out.set(sl, z * Y * X);
    }
    // Interpolate missing
    for (let z = 0; z < Z; z++) {
      if (z % k === 0) continue;
      const before = z - (z % k);
      const after = Math.min(before + k, Z - 1);
      const alpha = (z - before) / Math.max(1, after - before);
      const slBefore = getZSlice(vol, before);
      const slAfter = getZSlice(vol, after);
      const interp = linearInterpolate(slBefore, slAfter, alpha);
      // Binarize at 0.5 to keep values in {0,1}
      for (let i = 0; i < interp.length; i++)
        out[z * Y * X + i] = interp[i] > 0.5 ? 1 : 0;
    }
    out.shape = vol.shape;
    return out;
  }

  function porosityError(reconstructed, original) {
    let sr = 0, so = 0;
    for (let i = 0; i < reconstructed.length; i++) { sr += reconstructed[i]; so += original[i]; }
    return Math.abs((sr - so) / reconstructed.length);
  }

  // ── Canvas drawing ─────────────────────────────────────────────────
  /**
   * Draw a slice to a canvas. slice is Uint8Array or Float32Array
   * (values 0..1). The slice is automatically scaled to fill the canvas.
   *
   * options:
   *   shape    — [H, W] of the slice (default: slice.shape)
   *   palette  — 'rock' | 'gray' | 'diff' (default 'rock')
   *   pixelate — boolean; if true, no smoothing (default true)
   */
  function drawSlice(canvas, slice, options = {}) {
    const shape = options.shape || slice.shape || [Math.sqrt(slice.length), Math.sqrt(slice.length)];
    const [H, W] = shape;
    const palette = PALETTES[options.palette || 'rock'];
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const octx = off.getContext('2d');
    const img = octx.createImageData(W, H);
    for (let i = 0; i < slice.length; i++) {
      const v = slice[i];  // 0 or 1 (or 0..1 for interpolated)
      const col = v > 0.5 ? palette.pore : palette.solid;
      img.data[i * 4 + 0] = col[0];
      img.data[i * 4 + 1] = col[1];
      img.data[i * 4 + 2] = col[2];
      img.data[i * 4 + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = !(options.pixelate !== false);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  }

  /** Difference (XOR) of two binary slices, drawn as red-on-white. */
  function drawDiff(canvas, sliceA, sliceB, options = {}) {
    const diff = new Uint8Array(sliceA.length);
    for (let i = 0; i < sliceA.length; i++)
      diff[i] = (sliceA[i] > 0.5) !== (sliceB[i] > 0.5) ? 1 : 0;
    diff.shape = sliceA.shape;
    drawSlice(canvas, diff, { ...options, palette: 'diff' });
  }

  // ── Public API ─────────────────────────────────────────────────────
  window.BinLoader = {
    CATALOG,
    PALETTES,
    load,
    getZSlice, getYSlice, getXSlice,
    porosity,
    makeSparse,
    linearInterpolate,
    reconstructSparseLinear,
    porosityError,
    drawSlice, drawDiff,
  };

  // Convenience: warn if BinLoader was loaded before being used in modules.
  console.log('[BinLoader] ready — domains:', Object.keys(CATALOG).join(', '));
})();
