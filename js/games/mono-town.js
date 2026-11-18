// 大富翁：怪奇小鎮的動畫（16-bit 像素版）——彩蛋 5 個＋破產 9 種
// 畫在低解析度畫布上（寬 200 像素）再用最近鄰放大；人物都是 mono-pixel.js 的像素小人，動作看得懂、不糊
(function (root) {
  const H = root.MONO_HORROR, P = root.MONO_PIXEL; if (!H || !P) return;
  const { rnd, ease, clamp } = H;
  const TW = {};
  const kit = (SFX) => root.MONO_SCORE && SFX ? root.MONO_SCORE.kit(SFX) : null;
  const LW = 140;
  // ---------- 低解析度畫布管線：每一幀先畫在 200 寬的小畫布，再放大，最後加掃描線 ----------
  function pix(ui, ms, scene, snd) {
    let low = null, lg = null;
    return ui.overlay(ms, (g, W, Hh, dpr, t) => {
      const lh = Math.round(LW * Hh / W); if (!low || low.height !== lh) { [low, lg] = P.canvas(LW, lh); }
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, LW, lh); lg.imageSmoothingEnabled = false;
      scene(lg, LW, lh, t);
      g.imageSmoothingEnabled = false; g.drawImage(low, 0, 0, W, Hh); g.imageSmoothingEnabled = true;
      const s = W / LW; g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < Hh; y += s) g.fillRect(0, Math.floor(y + s * 0.5), W, Math.max(1, Math.floor(s * 0.35)));
      H.vignette(g, W, Hh, 0.7);
    }, snd);
  }
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  // 畫像素小人：x,y＝腳底中心；opt: flip, rot（弧度，繞腳底）, alpha, tint, scale
  const tintC = {};
  function tinted(img, col) { const key = (img.__id || (img.__id = Math.random())) + col; if (tintC[key]) return tintC[key]; const [c, g] = P.canvas(img.width, img.height); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(0, 0, img.width, img.height); return (tintC[key] = c); }
  function spr(g, img, x, y, o) {
    o = o || {}; const s = o.scale || 1; g.save(); g.translate(Math.round(x), Math.round(y)); if (o.rot) g.rotate(o.rot); if (o.flip) g.scale(-1, 1); g.globalAlpha = o.alpha == null ? 1 : o.alpha;
    g.drawImage(img, -Math.round(img.width * s / 2), -Math.round(img.height * s) + 4 * s, Math.round(img.width * s), Math.round(img.height * s));
    if (o.tint) { g.globalAlpha = o.tintA == null ? 0.6 : o.tintA; g.drawImage(tinted(img, o.tint), -Math.round(img.width * s / 2), -Math.round(img.height * s) + 4 * s, Math.round(img.width * s), Math.round(img.height * s)); }
    g.restore();
  }
  const ch = (i, pose, f) => P.sprite(i, pose || {}, f || 0);
  // 像素直線（Bresenham）
  function line(g, x0, y0, x1, y1, c, w) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); g.fillStyle = c; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, n = 0; while (n++ < 600) { g.fillRect(x0, y0, w || 1, w || 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  function circle(g, cx, cy, r, c, w) { const n = Math.max(12, Math.round(r * 6)); g.fillStyle = c; for (let k = 0; k < n; k++) { const a = k / n * 6.283; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), w || 1, w || 1); } }
  function disc(g, cx, cy, r, c) { g.fillStyle = c; for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
  // 像素光暈（色帶式）
  function glow(g, x, y, r, rgb, a) { for (let k = 4; k >= 1; k--) { g.globalAlpha = a * (0.18 + (4 - k) * 0.08); disc(g, x, y, r * k / 4, `rgb(${rgb})`); } g.globalAlpha = 1; }
  // 3x5 像素字型（牆上的字母、骰子點數）
  const FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
  function text(g, str, x, y, s, c) { g.fillStyle = c; String(str).split('').forEach((chh, i) => { const f = FONT[chh]; if (!f) return; for (let k = 0; k < 15; k++) if (f[k] === '1') g.fillRect(Math.round(x + (i * 4 + k % 3) * s), Math.round(y + Math.floor(k / 3) * s), s, s); }); }
  const textW = (str, s) => (String(str).length * 4 - 1) * s;
  // ---------- 場景：1983 年小鎮夜晚的街道；up＝倒影世界 ----------
  const HOUSES = (() => { let sd = 7; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; return Array.from({ length: 7 }, (_, k) => ({ x: k * 32 + r() * 8, w: 22 + r() * 8, h: 14 + r() * 10, win: [r() > 0.3, r() > 0.4, r() > 0.5] })); })();
  const SP = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), v: rnd(0.01, 0.05), p: rnd(0, 6) }));
  const LEAF = Array.from({ length: 24 }, () => ({ x: Math.random(), y: Math.random(), v: rnd(0.04, 0.09), p: rnd(0, 6), c: ['#e07a2a', '#c8461e', '#d89a3a'][Math.floor(rnd(0, 3))] }));
  function street(g, W, Hh, t, o) {
    o = o || {}; const up = !!o.up, hy = Math.round(Hh * 0.62);
    P.ditherSky(g, W, hy, up ? ['#0a0204', '#2a0608', '#5a0c10'] : ['#0c0a22', '#2a1838', '#6a2a3a', '#c8584a']);
    if (!up) for (let k = 0; k < 40; k++) R(g, (k * 97) % W, (k * 53) % Math.round(hy * 0.6), 1, 1, k % 5 ? '#c8c0e0' : '#ffffff');
    if (!up) { disc(g, W * 0.8, hy * 0.25, 7, '#f4ecc8'); disc(g, W * 0.8 + 3, hy * 0.25 - 2, 6, '#2a1838'); }
    if (up && (Math.sin(t * 7.3) > 0.93 || (t % 2.1) < 0.06)) { let x = W * (0.2 + (Math.floor(t * 3) % 5) * 0.15), y = 0; while (y < hy * 0.7) { const nx = x + rnd(-6, 6), ny = y + rnd(4, 9); line(g, x, y, nx, ny, '#ff4a3a'); x = nx; y = ny; } g.globalAlpha = 0.15; R(g, 0, 0, W, Hh, '#ff2a1a'); g.globalAlpha = 1; }
    // 遠方樹林
    for (let x = 0; x < W; x += 4) { const h = 10 + ((x * 13) % 9); R(g, x, hy - 22 - h * 0.4, 4, h, up ? '#14040a' : '#140c20'); }
    HOUSES.forEach((h, k) => { const x = (h.x * W / 200), b = hy - 6, top = b - h.h; R(g, x, top, h.w, h.h, up ? '#1a0608' : '#1e1428'); for (let r = 0; r < 7; r++) R(g, x - 2 + r * 1.5, top - r, h.w + 4 - r * 3, 1, up ? '#120406' : '#140c1c');
      h.win.forEach((on, j) => { if (!on) return; const fl = up ? false : Math.sin(t * 9 + k * 3 + j) > 0.985; R(g, x + 3 + j * 7, top + 4, 3, 3, up ? '#4a0a0c' : fl ? '#3a2a20' : '#ffc870'); }); });
    // 電線桿＋電線
    [0.06, 0.52, 0.96].forEach(px => { R(g, px * W - 1, hy * 0.36, 2, hy * 0.64, '#08060c'); R(g, px * W - 7, hy * 0.38, 14, 1, '#08060c'); });
    for (let x = 0; x < W; x++) { const u = (x / W) % 0.46, sag = Math.sin(((x - 0.06 * W) / (0.46 * W)) * Math.PI) * 4; R(g, x, hy * 0.385 + Math.abs(sag), 1, 1, '#08060c'); R(g, x, hy * 0.385 + 3 + Math.abs(sag), 1, 1, '#08060c'); void u; }
    // 地面、馬路
    R(g, 0, hy, W, Hh - hy, up ? '#140406' : '#1a1622'); R(g, 0, hy + 8, W, 26, up ? '#0e0204' : '#121018'); for (let x = 0; x < W; x += 16) R(g, x + ((t * 0) | 0), hy + 20, 8, 2, up ? '#3a0a0c' : '#c8a83a');
    for (let k = 0; k < 40; k++) R(g, (k * 61) % W, hy + 40 + (k * 37) % (Hh - hy - 40), 2, 1, up ? '#2a0608' : ['#5a2a14', '#7a3a1a', '#3a2a1a'][k % 3]);
    // 路燈＋光錐
    if (!o.noLamp) { const lx = Math.round(W * (o.lampX || 0.72)), on = up ? 0.25 : (Math.sin(t * 17) > 0.96 ? 0.25 : 1); R(g, lx - 1, hy * 0.42, 2, hy * 0.58 + 10, '#08060c'); R(g, lx - 1, hy * 0.42, 8, 2, '#08060c'); R(g, lx + 5, hy * 0.42 + 2, 3, 2, on > 0.5 ? '#fff0c0' : '#5a4a30');
      g.globalAlpha = 0.16 * on; for (let y = Math.round(hy * 0.42 + 4); y < hy + 40; y++) { const w = (y - hy * 0.42) * 0.55; R(g, lx + 6 - w, y, w * 2, 1, '#ffc870'); } g.globalAlpha = 1; }
    if (up || o.spores) SP.forEach(p => R(g, ((p.x + Math.sin(t * 0.5 + p.p) * 0.02 + 1) % 1) * W, ((p.y - t * p.v + 10) % 1) * Hh, 1, 1, up ? '#e8d0c8' : '#b8b0a8'));
    else LEAF.forEach(p => R(g, ((p.x + Math.sin(t + p.p) * 0.03 + 1) % 1) * W, ((p.y + t * p.v) % 1) * Hh, 2, 1, p.c));
    return hy;
  }
  // 藤蔓（像素粗線，從某一點往外長）
  function vineGrow(g, list, t, grow, c) { list.forEach(v => { const len = clamp((grow - v.d) * 1.5); if (len <= 0) return; let x = v.x, y = v.y, a = v.a; const n = Math.floor(v.n * len); for (let k = 0; k < n; k++) { a += Math.sin(k * 0.7 + v.p + t * 0.8) * 0.2; const nx = x + Math.cos(a) * 3, ny = y + Math.sin(a) * 3; line(g, x, y, nx, ny, c || '#2a0408', v.w); if (k % 4 === 2) R(g, nx, ny, 1, 1, '#c0202a'); x = nx; y = ny; } }); }
  const mkV = (n, x0, y0, spread, dir, len) => Array.from({ length: n }, (_, k) => ({ x: x0 + rnd(-spread, spread), y: y0, a: dir + rnd(-0.9, 0.9), w: k % 3 ? 1 : 2, n: len || 30, p: rnd(0, 6), d: k / n * 0.4 }));
  // 血點
  const blood = [];
  function spray(x, y, n, sp, t0) { for (let i = 0; i < n; i++) blood.push({ x, y, vx: rnd(-sp, sp), vy: rnd(-sp * 1.3, sp * 0.2), t: t0 + rnd(0, 0.15), s: Math.random() < 0.3 ? 2 : 1 }); }
  function drawBlood(g, t) { for (let i = blood.length - 1; i >= 0; i--) { const d = blood[i], a = t - d.t; if (a > 2) { blood.splice(i, 1); continue; } if (a < 0) continue; R(g, d.x + d.vx * a * 30, d.y + d.vy * a * 30 + a * a * 120, d.s, d.s, '#a00010'); } }
  const dust = [];
  function puff(x, y, n, t0) { for (let i = 0; i < n; i++) dust.push({ x, y, vx: rnd(-1.5, 1.5), vy: rnd(-1, -0.2), t: t0 }); }
  function drawDust(g, t) { for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i], a = t - d.t; if (a > 1) { dust.splice(i, 1); continue; } g.globalAlpha = 1 - a; R(g, d.x + d.vx * a * 20, d.y + d.vy * a * 20, 2, 2, '#8a7a6a'); } g.globalAlpha = 1; }
  const shk = (g, k) => { if (k > 0) g.translate(Math.round(rnd(-k, k)), Math.round(rnd(-k, k))); };
  const seatSprite = (v, s) => { const c = v && v.players[s] && v.players[s].char; return c && c.kind !== 'custom' ? c.i % 8 : -1; };

  // ======================= 彩蛋 =======================
  TW.xlights = function (ui, SFX) {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), rows = [L.slice(0, 9), L.slice(9, 18), L.slice(18)], cols = ['#ff3a3a', '#3aff6a', '#3ab0ff', '#ffd23a', '#ff8ac0', '#ff8a2a'];
    const coins = Array.from({ length: 50 }, () => ({ x: Math.random(), v: rnd(0.6, 1.1), d: rnd(0, 0.8) }));
    const snd = () => { const K = kit(SFX); if (!K) return; K.drone(0, 5.6, [55, 82.4], { lp: 400, vol: 0.06 }); K.synth(0.2, [220, 261.6, 329.6, 261.6, 220, 261.6, 329.6, 392], 0.3, 0.03, 'square', 1200); K.buzz(0, 2.0, 0.05);
      [2.1, 2.7, 3.3].forEach((d, i) => { K.chime(d, [880, 988, 1175][i], 0.08); K.buzz(d, 0.2, 0.08); }); K.heart(0.2, 6, 72, 0.25);
      K.sweep(3.6, 0.5, 300, 6000, { rev: true, vol: 0.15 }); K.boom(4.1, 90, 40, 1.2, 0.4); K.shimmer(4.1, 1.5, 1600, 0.04); K.synth(4.1, [523, 659, 784, 1047], 0.12, 0.05, 'square', 3000); };
    return pix(ui, 5800, (g, W, Hh, t) => {
      R(g, 0, 0, W, Hh, '#2a2018'); for (let x = 0; x < W; x += 10) { R(g, x, 0, 1, Hh, '#33281e'); R(g, x + 5, 0, 1, Hh, '#241a12'); }
      for (let x = 0; x < W; x += 20) for (let y = 6; y < Hh; y += 20) R(g, x + 3, y, 2, 2, '#3a2c20');
      const top = Math.round(Hh * 0.22), gap = Math.round(Hh * 0.2), lit = { R: t > 2.1, U: t > 2.7, N: t > 3.3 }, all = t > 4.0;
      rows.forEach((rw, ri) => { const y = top + ri * gap; for (let x = 6; x < W - 6; x++) R(g, x, y + Math.round(Math.abs(Math.sin((x - 6) / (W - 12) * Math.PI * rw.length)) * 3), 1, 1, '#0a0806');
        rw.forEach((chh, ci) => { const x = Math.round(6 + (W - 12) * (ci + 0.5) / rw.length);
          text(g, chh, x - 3, y + 12, 2, '#e8e0d0'); R(g, x - 1, y + 22, 1, (ci * 3 + ri) % 4 + 2, '#c8c0b0');
          const special = lit[chh], rand = !all && !special && t < 3.8 && Math.sin(t * (6 + ci) + ri * 5 + ci * 2.3) > (t < 2 ? 0.4 : 0.85);
          const on = all ? (Math.floor(t * 8 + ci) % 2 ? 1 : 0.5) : special ? 1 : rand ? 0.85 : 0, col = cols[(ci + ri) % cols.length];
          R(g, x - 1, y + 1, 2, 2, '#1a1410'); if (on > 0) glow(g, x, y + 5, special ? 9 : 6, col.replace('#', '').match(/../g).map(h => parseInt(h, 16)).join(','), on);
          R(g, x - 1, y + 3, 3, 4, on > 0 ? col : '#3a3028'); if (on > 0) R(g, x - 1, y + 3, 1, 1, '#ffffff'); }); });
      if (t > 4.0) { const k = clamp(1 - (t - 4.0) * 3); if (k > 0) { g.globalAlpha = k * 0.6; R(g, 0, 0, W, Hh, '#fff0d0'); g.globalAlpha = 1; }
        const cn = P.coin(); coins.forEach(c => { const a = t - 4.0 - c.d; if (a < 0) return; g.drawImage(cn, Math.round(c.x * W), Math.round(-8 + a * a * 160 * c.v)); }); }
    }, snd);
  };
  TW.psy = function (ui, SFX, e) {
    const me = seatSprite(ui.v, e && e.seat >= 0 ? e.seat : 0), coins = Array.from({ length: 60 }, () => ({ a: rnd(0, 6.28), d: rnd(0.7, 1.2), o: rnd(0, 0.9) }));
    const snd = () => { const K = kit(SFX); if (!K) return; K.drone(0, 5, [41, 61.7, 82.4], { lp: 300, vol: 0.09, sweep: 1400 }); K.heart(0.2, 8, 70, 0.35, 0.9); K.riser(0.6, 1.8, 120, 700, 0.05); K.sweep(1.0, 1.4, 200, 4000, { rev: true, vol: 0.12 });
      K.boom(2.4, 70, 28, 1.5, 0.6); K.stinger(2.4, 0.15); K.whisper(1.0, 1.4, 0.04, 8); for (let i = 0; i < 10; i++) K.whoosh(2.5 + i * 0.12, 0.3, false, 0.06, rnd(-1, 1)); K.synth(2.6, [196, 233, 294, 233, 196, 233, 294, 349], 0.2, 0.04, 'sawtooth', 900); };
    return pix(ui, 5200, (g, W, Hh, t) => {
      const raise = clamp((t - 0.6) / 0.8), burst = clamp((t - 2.4) / 0.4);
      g.save(); shk(g, t > 2.4 && t < 3.4 ? 2 : t > 1.2 && t < 2.4 ? 1 : 0); const hy = street(g, W, Hh, t, { lampX: 0.88 });
      const x = W / 2, y = hy + 34, hx = x + 9, hyy = y - 46;
      if (t > 1.0) for (let k = 0; k < 5; k++) { const p = ((t - 1.0) * 0.7 + k / 5) % 1; g.globalAlpha = (1 - p) * (t > 2.4 ? 0.9 : 0.5); circle(g, x, y - 26, p * W * 0.8, '#ff6ac8', 1); } g.globalAlpha = 1;
      glow(g, hx, hyy, 10 + raise * 10 + burst * 20, '255,140,220', 0.6 + raise * 0.4);
      spr(g, ch(1, { arms: ['down', raise > 0.5 ? 'up' : 'down'], eyes: raise > 0.3 ? 'glow' : 'open', mouth: 'flat' }, Math.floor(t * 4) % 3), x, y, { scale: 1.4 });
      if (t > 2.4) { const cn = P.coin(); coins.forEach(c => { const a = clamp((t - 2.4 - c.o) / 1.1); if (a <= 0 || a >= 1) return; const d = c.d * W * (1 - ease(a)); g.drawImage(cn, Math.round(hx + Math.cos(c.a + a * 2) * d - 3), Math.round(hyy + Math.sin(c.a + a * 2) * d - 3)); }); }
      if (burst > 0 && burst < 1) { g.globalAlpha = (1 - burst) * 0.6; R(g, 0, 0, W, Hh, '#ffd0f0'); g.globalAlpha = 1; }
      g.restore(); void me;
    }, snd);
  };
  TW.flip = function (ui, SFX, e) {
    const me = seatSprite(ui.v, e && e.seat >= 0 ? e.seat : 0), vs = [];
    const snd = () => { const K = kit(SFX); if (!K) return; K.wind(0, 6, 0.05); K.synth(0, [130.8, 155.6, 196, 155.6, 130.8, 155.6, 196, 233], 0.22, 0.03, 'square', 900); K.buzz(1.2, 0.9, 0.08);
      K.sweep(1.6, 0.6, 200, 5000, { rev: true, vol: 0.18 }); K.boom(2.2, 60, 22, 2.2, 0.7); K.growl(2.3, 2.4, 45, 0.22); K.drone(2.2, 3.9, [32.7, 34.6, 49], { lp: 220, vol: 0.12, sweep: 500 });
      K.whisper(2.5, 3, 0.06, 14); K.choir(2.6, 3.4, [110, 116.5, 164.8], { v: 'oo', vol: 0.08, bend: 0.94 }); for (let i = 0; i < 6; i++) K.creak(2.8 + i * 0.5, 0.4, 0.12); K.heart(2.4, 8, 80, 0.4); K.stinger(4.6, 0.2); };
    let tmp = null, tg = null;
    return pix(ui, 6200, (g, W, Hh, t) => {
      const fl = clamp((t - 1.9) / 0.5), up = t > 2.15;
      if (!tmp || tmp.height !== Hh) { [tmp, tg] = P.canvas(W, Hh); vs.length = 0; for (let k = 0; k < 18; k++) vs.push({ x: [0, W][k % 2] + 0, y: rnd(0, Hh), a: k % 2 ? Math.PI + rnd(-0.6, 0.6) : rnd(-0.6, 0.6), w: k % 3 ? 1 : 2, n: 34, p: rnd(0, 6), d: k / 18 * 0.4 }); for (let k = 0; k < 10; k++) vs.push({ x: rnd(0, W), y: Hh, a: -Math.PI / 2 + rnd(-0.6, 0.6), w: 2, n: 30, p: rnd(0, 6), d: k / 10 * 0.5 }); }
      tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, W, Hh); tg.imageSmoothingEnabled = false;
      const hy = street(tg, W, Hh, t, { up, lampX: 0.7 }); spr(tg, ch(me, { eyes: up ? 'wide' : 'open', mouth: up ? 'o' : 'smile', arms: up ? ['out', 'out'] : ['down', 'down'] }, 0), W * 0.42, hy + 30, { scale: 1.3, tint: up ? '#ff2a1a' : null, tintA: 0.25 });
      g.save();
      if (t > 1.9 && t < 2.4) { const k = ease(fl), sy = Math.cos(k * Math.PI); g.translate(W / 2, Hh / 2); g.scale(1, sy || 0.01); g.translate(-W / 2, -Hh / 2); }
      else if (up) { g.translate(0, Hh); g.scale(1, -1); shk(g, t < 3 ? 2 : 0); }
      g.drawImage(tmp, 0, 0); g.restore();
      if (t > 1.2 && t < 1.9 && Math.sin(t * 40) > 0) { g.globalAlpha = 0.7; R(g, 0, 0, W, Hh, '#000'); g.globalAlpha = 1; }
      if (fl > 0 && fl < 1) { g.globalAlpha = Math.sin(fl * Math.PI) * 0.8; R(g, 0, 0, W, Hh, '#ffffff'); g.globalAlpha = 1; }
      if (up) { vineGrow(g, vs, t, (t - 2.3) / 2.4); g.globalAlpha = 0.25; R(g, 0, 0, W, Hh, '#3a0006'); g.globalAlpha = 1; }
    }, snd);
  };
  TW.clock = function (ui, SFX, e) {
    const me = seatSprite(ui.v, e && e.seat >= 0 ? e.seat : 0), cracks = Array.from({ length: 9 }, () => ({ x: rnd(0.05, 0.95), y: rnd(0.05, 0.95), a: rnd(0, 6.28), d: rnd(0, 0.6), s: [] }));
    const snd = () => { const K = kit(SFX); if (!K) return; K.tick(0, 22, 0.24, 0.12); [0.4, 1.9, 3.1, 3.9, 4.5, 4.9].forEach((d, i) => K.bell(d, 98 - i * 3, 3.5, 0.08 + i * 0.03, true));
      K.drone(0, 6.4, [36.7, 38.9, 55], { lp: 260, vol: 0.12, sweep: 700 }); K.heart(0.5, 14, 64, 0.38, 0.93); K.whisper(1.5, 4.5, 0.06, 20); K.riser(2.2, 2.8, 120, 900, 0.05);
      K.choir(2.0, 4.2, [87.3, 92.5, 130.8], { v: 'oo', vol: 0.09, bend: 0.92 }); for (let i = 0; i < 6; i++) K.crack(3.0 + i * 0.45, 0.3, 0.15); K.scream(4.6, 1.2, 420, 0.1); K.stinger(5.2, 0.24); };
    return pix(ui, 6500, (g, W, Hh, t) => {
      const lift = ease(clamp((t - 1.8) / 2.0)), cx = Math.round(W / 2);
      g.save(); shk(g, t > 3 ? Math.round((t - 3) * 0.8) : 0);
      P.ditherSky(g, W, Hh, ['#1a0a0c', '#2a1012', '#120608']); for (let x = 0; x < W; x += 12) R(g, x, 0, 2, Hh, '#1e0c0e');
      const cw = Math.min(70, W * 0.36), top = Math.round(Hh * 0.08), chh = Math.round(Hh * 0.82);
      glow(g, cx, top + chh / 2, cw * 0.9, '255,40,30', 0.35);
      R(g, cx - cw / 2, top + cw / 2, cw, chh - cw / 2, '#2a1810'); R(g, cx - cw / 2, top + cw / 2, 3, chh - cw / 2, '#4a2a18'); R(g, cx + cw / 2 - 4, top + cw / 2, 4, chh - cw / 2, '#1a0e08'); disc(g, cx, top + cw / 2, cw / 2, '#2a1810'); R(g, cx - cw * 0.6, top + chh - 4, cw * 1.2, 6, '#1a0e08');
      R(g, cx - cw / 2 + 5, top + cw + 4, cw - 10, chh - cw - 14, '#120806');
      const fy = top + Math.round(cw * 0.55), fr = Math.round(cw * 0.36); disc(g, cx, fy, fr, '#d8ccb0'); circle(g, cx, fy, fr, '#6a4a20', 1); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; R(g, cx + Math.cos(a) * fr * 0.8, fy + Math.sin(a) * fr * 0.8, 1, 1, '#2a1a10'); }
      const spin = t < 1.8 ? t * 0.3 : t * 0.3 + Math.pow(t - 1.8, 2) * 3; line(g, cx, fy, cx + Math.sin(spin) * fr * 0.5, fy - Math.cos(spin) * fr * 0.5, '#1a0a06', 2); line(g, cx, fy, cx + Math.sin(spin * 12) * fr * 0.8, fy - Math.cos(spin * 12) * fr * 0.8, '#1a0a06', 1);
      const sw = Math.sin(t * (3.2 + t * 0.6)) * (0.25 + clamp(t / 4) * 0.35), py = fy + fr + 6, pl = (chh - cw) * 0.45; line(g, cx, py, cx + Math.sin(sw) * pl, py + Math.cos(sw) * pl, '#c8a040', 1); disc(g, cx + Math.sin(sw) * pl, py + Math.cos(sw) * pl, 5, '#e8c04a');
      // 被拖到半空中的人：手臂張開、眼睛翻白
      const ky = Hh * 0.97 - lift * Hh * 0.42; glow(g, cx, ky - 30, 18 + lift * 14, '255,40,30', 0.4 * lift);
      spr(g, ch(me, { arms: lift > 0.2 ? ['out', 'out'] : ['down', 'down'], eyes: lift > 0.3 ? 'glow' : 'wide', mouth: 'o', legs: 'jump' }, 0), cx + Math.sin(t * 9) * lift, ky, { scale: 1.3, rot: lift * Math.sin(t * 7) * 0.06 });
      g.restore();
      if (t > 3.0) cracks.forEach(c => { const p = clamp((t - 3.0 - c.d) / 1.4); if (p <= 0) return; if (!c.s.length) { let x = c.x * W, y = c.y * Hh, a = c.a; for (let k = 0; k < 14; k++) { a += rnd(-0.6, 0.6); const nx = x + Math.cos(a) * 7, ny = y + Math.sin(a) * 7; c.s.push([x, y, nx, ny]); x = nx; y = ny; } } c.s.slice(0, Math.ceil(p * 14)).forEach(([a, b, x2, y2]) => line(g, a, b, x2, y2, '#ff3a2a', 1)); });
      if (t > 5.2) { g.globalAlpha = clamp((t - 5.2) * 1.5); R(g, 0, 0, W, Hh, '#000'); g.globalAlpha = 1; }
    }, snd);
  };
  TW.d20 = function (ui, SFX, e) {
    const roll = e && e.roll ? e.roll : 1 + Math.floor(Math.random() * 20), crit = roll === 20, fail = roll === 1, sparks = Array.from({ length: 50 }, () => ({ a: rnd(0, 6.28), v: rnd(0.5, 1.4) }));
    const snd = () => { const K = kit(SFX); if (!K) return; K.synth(0, [146.8, 174.6, 220, 174.6, 146.8, 174.6, 220, 261.6], 0.25, 0.03, 'square', 1000); K.drone(0, 5, [73.4, 110], { lp: 500, vol: 0.05 });
      for (let i = 0; i < 10; i++) K.drum(0.6 + i * 0.14 + i * i * 0.012, 300 + rnd(0, 200), 0.18, 0.05); K.heart(1.2, 3, 90, 0.25);
      if (crit) { K.sweep(2.4, 0.4, 400, 6000, { rev: true, vol: 0.12 }); K.boom(2.8, 120, 50, 1, 0.4); K.synth(2.8, [523, 659, 784, 1047, 1319], 0.1, 0.06, 'square', 4000); K.shimmer(2.8, 1.8, 1800, 0.04); K.choir(2.9, 2, [523, 659, 784], { v: 'ah', vol: 0.05 }); }
      else if (fail) { K.boom(2.8, 70, 25, 1.5, 0.5); K.crack(2.8, 0.6, 0.3); K.synth(2.9, [220, 207.7, 196, 185], 0.3, 0.05, 'sawtooth', 700); K.growl(3, 1, 60, 0.15); }
      else { K.drum(2.8, 200, 0.3, 0.2); K.chime(2.9, roll >= 11 ? 880 : 440, 0.06); } };
    return pix(ui, 5200, (g, W, Hh, t) => {
      const cx = W / 2, cy = Math.round(Hh * 0.5);
      R(g, 0, 0, W, Hh, '#0c0808'); for (let y = 0; y < Hh * 0.55; y += 8) R(g, 0, y, W, 1, '#140e0c');
      glow(g, cx, Hh * 0.3, W * 0.55, '255,190,110', 0.5); R(g, cx - 2, 0, 4, Hh * 0.14, '#0a0606'); R(g, cx - 14, Hh * 0.14, 28, 6, '#3a5a3a'); R(g, cx - 12, Hh * 0.14 + 6, 24, 2, '#fff0b0');
      R(g, 8, Hh * 0.56, W - 16, Hh * 0.3, '#5a3a24'); R(g, 8, Hh * 0.56, W - 16, 2, '#7a5034'); R(g, 20, Hh * 0.58, W - 40, Hh * 0.24, '#c8b088'); for (let k = 0; k < 9; k++) R(g, 24 + k * (W - 48) / 8, Hh * 0.58, 1, Hh * 0.24, '#a89068'); for (let k = 0; k < 6; k++) R(g, 20, Hh * 0.6 + k * Hh * 0.04, W - 40, 1, '#a89068');
      [[0, 0.73], [1, 0.79], [2, 0.75], [3, 0.8]].forEach(([i, yy], k) => spr(g, ch([0, 2, 3, 6][i], { eyes: t > 2.8 && crit ? 'open' : 'open', mouth: t > 2.8 ? (crit ? 'grin' : fail ? 'o' : 'smile') : 'flat', arms: t > 2.8 && crit ? ['up', 'up'] : ['down', 'down'] }, 0), W * (0.12 + k * 0.25), Hh * yy + 40, { scale: 0.9, alpha: 0.95 }));
      const p = ease(clamp((t - 0.5) / 2.2)), dx = cx - W * 0.6 * (1 - p), dy = cy - Hh * 0.28 * (1 - p) - Math.abs(Math.sin(p * 9)) * 30 * (1 - p), rot = (1 - p) * 14, rr = 26 * (1 + (t > 2.7 ? Math.sin(clamp((t - 2.7) * 4) * Math.PI) * 0.15 : 0));
      const shown = t < 2.7 ? 1 + Math.floor((t * 23) % 20) : roll, col = t < 2.7 ? '#4a3a8a' : crit ? '#e8b020' : fail ? '#8a1018' : '#4a3a8a', colD = t < 2.7 ? '#2a1e5a' : crit ? '#a87010' : fail ? '#4a0008' : '#2a1e5a';
      if (crit && t > 2.8) { glow(g, dx, dy, 60, '255,210,90', clamp((t - 2.8) * 2)); sparks.forEach(s => { const a = (t - 2.8) * s.v; R(g, dx + Math.cos(s.a) * a * 90, dy + Math.sin(s.a) * a * 90 + a * a * 30, 2, 2, a < 0.8 ? '#fff0a0' : '#e8b020'); }); }
      g.save(); g.translate(Math.round(dx), Math.round(dy)); g.rotate(Math.round(rot * 4) / 4);
      const hex = []; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 - Math.PI / 2; hex.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      g.fillStyle = col; g.beginPath(); hex.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
      g.fillStyle = colD; g.beginPath(); g.moveTo(hex[1][0], hex[1][1]); g.lineTo(hex[2][0], hex[2][1]); g.lineTo(hex[3][0], hex[3][1]); g.lineTo(0, rr * 0.35); g.closePath(); g.fill();
      for (let k = 0; k < 6; k++) line(g, hex[k][0], hex[k][1], hex[(k + 1) % 6][0], hex[(k + 1) % 6][1], '#120a1a', 1);
      const tri = [[0, -rr * 0.6], [rr * 0.52, rr * 0.32], [-rr * 0.52, rr * 0.32]]; for (let k = 0; k < 3; k++) line(g, tri[k][0], tri[k][1], tri[(k + 1) % 3][0], tri[(k + 1) % 3][1], 'rgba(255,255,255,.55)', 1);
      const s = 2, tw = textW(shown, s); text(g, shown, -tw / 2, -4, s, crit && t > 2.7 ? '#2a1a00' : '#ffffff');
      if (fail && t > 2.8) { line(g, -rr * 0.3, -rr * 0.9, -2, -rr * 0.2, '#100000', 2); line(g, -2, -rr * 0.2, -rr * 0.2, rr * 0.2, '#100000', 2); line(g, -rr * 0.2, rr * 0.2, rr * 0.15, rr * 0.9, '#100000', 2); }
      g.restore();
      if (fail && t > 2.8) { g.globalAlpha = clamp((t - 2.8) * 0.8) * 0.4; R(g, 0, 0, W, Hh, '#500000'); g.globalAlpha = 1; }
    }, snd);
  };

  // ======================= 破產：攻擊者都在破產者前面或側面 =======================
  TW.death = function (ui, SFX, e) {
    const v = ui.v, by = e.by, kc = by >= 0 && v.players[by] && v.players[by].char; const kind = kc && kc.kind !== 'custom' ? kc.i % 8 : by >= 0 ? 5 : -1;
    const vi = seatSprite(v, e.seat), ki = kind < 0 ? -1 : kind; blood.length = 0; dust.length = 0; const T0 = 5.4; let sd = {}, lastShk = 0;
    const vines = [];
    const snd = () => { const K = kit(SFX); if (!K) return; K.drone(0, T0, [41.2, 43.7, 61.7], { lp: 280, vol: 0.09 }); K.synth(0, [110, 130.8, 164.8, 130.8, 110, 130.8, 164.8, 196], 0.28, 0.025, 'square', 800); K.heart(0, 5, 66, 0.3);
      if (kind === -1) { K.growl(0.4, 2.4, 42, 0.25); for (let i = 0; i < 8; i++) K.creak(0.6 + i * 0.3, 0.3, 0.12); K.scream(1.6, 1.2, 480, 0.08); K.boom(2.8, 60, 22, 1.8, 0.6); K.whisper(1, 3, 0.05, 12); }
      if (kind === 0) { K.sweep(0.2, 1.4, 300, 1500, { vol: 0.08 }); for (let i = 0; i < 6; i++) K.drum(0.3 + i * 0.22, 900, 0.06, 0.03); K.boom(1.65, 90, 30, 1, 0.6); K.crack(1.65, 0.3, 0.25); K.scream(1.7, 0.6, 520, 0.06); }
      if (kind === 1) { K.riser(0.4, 1.4, 100, 600, 0.05); K.sweep(0.6, 1.2, 200, 3000, { rev: true, vol: 0.1 }); K.crack(1.9, 0.5, 0.25); K.boom(2.1, 70, 25, 1.4, 0.6); K.scream(1.5, 0.5, 600, 0.07); }
      if (kind === 2) { K.buzz(0.6, 0.8, 0.08); K.riser(0.8, 0.8, 200, 1600, 0.04); K.buzz(1.6, 1.4, 0.18); K.crack(1.6, 1.2, 0.2); K.scream(1.7, 0.9, 640, 0.08); K.boom(3.0, 70, 25, 1, 0.45); }
      if (kind === 3) { K.sweep(0.2, 1.2, 600, 1200, { vol: 0.06 }); for (let i = 0; i < 5; i++) K.drum(0.25 + i * 0.25, 400, 0.08, 0.04); K.whoosh(1.5, 0.3, false, 0.2); K.boom(1.8, 110, 40, 0.6, 0.6); K.crack(1.8, 0.2, 0.3); }
      if (kind === 4) { K.drum(0.4, 70, 0.3, 0.2); K.drum(0.8, 70, 0.3, 0.2); K.sweep(1.1, 0.3, 2000, 6000, { vol: 0.08 }); K.whoosh(1.6, 0.25, false, 0.2); K.boom(1.8, 70, 28, 1, 0.7); K.crack(1.8, 0.3, 0.2); }
      if (kind === 5) { K.whoosh(1.3, 0.3, false, 0.25); K.boom(1.55, 90, 30, 0.8, 0.6); K.crack(1.55, 0.2, 0.2); K.whoosh(2.2, 0.3, true, 0.2); K.boom(2.45, 80, 30, 0.8, 0.5); K.scream(1.6, 0.5, 560, 0.07); }
      if (kind === 6) { K.synth(0.5, [164.8, 196, 246.9, 329.6], 0.12, 0.06, 'sawtooth', 2400); K.guitar(1.3, [82.4, 123.5, 164.8], 1.8, 0.14); K.synth(1.3, [329.6, 329.6, 329.6, 329.6, 329.6, 329.6], 0.1, 0.07, 'square', 3000); K.sweep(1.4, 1.2, 100, 3000, { vol: 0.15 }); K.boom(1.6, 60, 25, 1.4, 0.6); }
      if (kind === 7) { K.growl(0.3, 1.4, 45, 0.26); for (let i = 0; i < 8; i++) K.creak(1.0 + i * 0.18, 0.25, 0.12); K.stinger(1.6, 0.18); K.scream(1.7, 1.0, 600, 0.09); K.growl(2.4, 1.6, 38, 0.3); K.boom(2.9, 60, 22, 1.4, 0.55); } };
    return pix(ui, T0 * 1000, (g, W, Hh, t) => {
      g.save(); shk(g, lastShk); let sk = 0;
      const hy = street(g, W, Hh, t, { lampX: 0.62, spores: kind === -1 || kind === 7, up: kind === -1 && t > 0.6 }), gy = hy + 34, vx0 = Math.round(W * 0.36), S = 1.25;
      let vx = vx0, vy = gy, vr = 0, va = 1, vp = { arms: ['down', 'down'], eyes: 'open' }, vtint = null;
      const hit = (k, x, y, n) => { if (!sd[k]) { sd[k] = 1; spray(x, y, n || 30, 2.2, t); puff(x, gy, 8, t); } };
      if (kind === -1) { const gr = clamp((t - 0.6) / 1.4), sink = ease(clamp((t - 2.2) / 1.4)); vy = gy + sink * 80; vp = { arms: ['up', 'up'], eyes: 'wide', mouth: 'o', dy: Math.floor(t * 20) % 2 }; sk = sink > 0 && sink < 1 ? 1 : 0;
        glow(g, vx0, gy, 30 * gr + 4, '255,40,30', 0.8 * gr); for (let k = 0; k < 5; k++) line(g, vx0 - 20 + k * 10, gy, vx0 - 24 + k * 12 + Math.sin(k) * 6, gy + 6, '#ff3a2a', 1);
        if (!vines.length) for (let k = 0; k < 12; k++) vines.push({ x: vx0 + rnd(-14, 14), y: gy + 2, a: -Math.PI / 2 + rnd(-0.5, 0.5), w: k % 3 ? 1 : 2, n: 16, p: rnd(0, 6), d: k / 12 * 0.3 }); }
      if (kind === 0) { // 單車男孩：騎腳踏車從右邊全速衝過來
        const p = clamp(t / 1.65), bx = W * 1.2 - (W * 1.2 - vx0 - 20) * ease(p), x = t < 1.65 ? bx : vx0 + 20 + (t - 1.65) * 25;
        if (t > 1.65) { const h2 = clamp((t - 1.65) / 1.1); vx = vx0 - h2 * W * 0.45; vy = gy - Math.sin(h2 * Math.PI) * 50; vr = -h2 * 5; vp = { arms: ['out', 'out'], eyes: 'x', mouth: 'o' }; sk = h2 < 0.3 ? 3 : 0; hit('a', vx0, gy - 40, 30); }
        [[-14, 0], [14, 0]].forEach(([dx]) => { circle(g, x + dx, gy - 9, 9, '#0a0a0e', 2); circle(g, x + dx, gy - 9, 4, '#5a5a62', 1); }); line(g, x - 14, gy - 9, x - 3, gy - 22, '#d0202a', 2); line(g, x - 3, gy - 22, x + 10, gy - 22, '#d0202a', 2); line(g, x + 10, gy - 22, x + 14, gy - 9, '#d0202a', 2); line(g, x - 3, gy - 22, x, gy - 9, '#d0202a', 2); line(g, x, gy - 9, x - 14, gy - 9, '#d0202a', 2); line(g, x + 10, gy - 22, x + 8, gy - 29, '#888', 1);
        spr(g, ch(0, { arms: ['fwd', 'fwd'], legs: Math.floor(t * 10) % 2 ? 'a' : 'b', mouth: t > 1.5 ? 'grin' : 'flat' }, 0), x - 2, gy - 12, { scale: S, flip: true }); }
      if (kind === 1) { // 念力女孩：念力把人吊到半空扭曲，再狠狠摔下
        const raise = clamp((t - 0.3) / 0.6), lift = ease(clamp((t - 0.7) / 1.0)), slam = clamp((t - 1.9) / 0.2);
        vy = gy - lift * 60 * (1 - slam); vr = lift * Math.sin(t * 18) * 0.12 * (1 - slam) + slam * -1.5; vp = { arms: ['out', 'out'], eyes: slam >= 1 ? 'x' : 'wide', mouth: 'o' }; if (slam >= 1) { sk = t < 2.3 ? 3 : 0; hit('a', vx, gy - 6, 40); }
        const gx = W * 0.8; glow(g, gx - 8, gy - 60, 14 * raise, '220,160,255', 0.8); spr(g, ch(1, { arms: ['down', raise > 0.4 ? 'up' : 'down'], eyes: raise > 0.3 ? 'glow' : 'open', mouth: 'flat' }, Math.floor(t * 4) % 2), gx, gy, { scale: S, flip: true });
        if (t > 0.8 && slam < 1) { g.globalAlpha = 0.6; for (let k = 0; k < 3; k++) { const p = (t * 1.2 + k / 3) % 1; circle(g, vx, vy - 30, 12 + p * 16, '#d8a0ff', 1); } g.globalAlpha = 1; } }
      if (kind === 2) { // 發明家男孩：自製電擊槍，閃電把人電到骨頭都看得見
        const aim = clamp((t - 0.4) / 0.4), zap = t > 1.6 && t < 3.0, gx = W * 0.8; spr(g, ch(2, { arms: ['down', aim > 0.5 ? 'out' : 'down'], mouth: zap ? 'grin' : 'flat', eyes: 'open' }, 0), gx, gy, { scale: S, flip: true });
        const tip = [gx - 40, gy - 37]; R(g, tip[0], tip[1] - 2, 8, 4, '#5a5a62'); R(g, tip[0] - 2, tip[1] - 1, 2, 2, '#7ad8ff'); if (t > 0.8) glow(g, tip[0] - 2, tip[1], 4 + Math.sin(t * 30) * 2 + (zap ? 6 : 0), '120,220,255', 0.9);
        if (zap) { let x = tip[0], y = tip[1]; for (let k = 0; k < 9; k++) { const nx = x - (tip[0] - vx0) / 9, ny = y + rnd(-6, 6); line(g, x, y, nx, ny, Math.floor(t * 30) % 2 ? '#ffffff' : '#7ad8ff', 2); x = nx; y = ny; } vp = { arms: ['up', 'up'], eyes: 'glow', mouth: 'o', dy: Math.floor(t * 30) % 2 }; vtint = Math.floor(t * 15) % 2 ? '#e8f8ff' : '#202030'; sk = 1; hit('a', vx0, gy - 30, 10); }
        if (t >= 3.0) { vr = -clamp((t - 3.0) / 0.4) * 1.5; vp = { eyes: 'x', mouth: 'o' }; vtint = '#1a1410'; if (Math.floor(t * 5) % 2) R(g, vx0 - 6 + Math.sin(t * 3) * 3, gy - 50 - (t - 3) * 10, 3, 3, '#5a5a5a'); } }
      if (kind === 3) { // 滑板女孩：踩滑板滑進來，跳起來用滑板往頭上砸
        const p = clamp(t / 1.5), sx = W * 1.1 - (W * 1.1 - vx0 - 22) * ease(p), jump = clamp((t - 1.2) / 0.6), swing = clamp((t - 1.55) / 0.25), y = gy - Math.sin(jump * Math.PI) * 26 - 4;
        if (jump === 0) R(g, sx - 12, gy - 3, 24, 3, '#2a2a2a'); spr(g, ch(3, { arms: ['down', swing > 0 ? 'fwd' : 'up'], legs: jump > 0 ? 'jump' : 'stand', mouth: 'grin' }, 0), sx, y, { scale: S, flip: true });
        g.save(); g.translate(Math.round(sx - 10), Math.round(y - 50)); g.rotate(-0.6 + swing * 2.3); R(g, -2, -26, 4, 28, '#2a2a2a'); R(g, -2, -26, 4, 3, '#ff8c1a'); R(g, -3, -22, 1, 3, '#ffe08a'); R(g, -3, -4, 1, 3, '#ffe08a'); g.restore();
        if (swing >= 1) { vr = -clamp((t - 1.8) / 0.4) * 1.5; vp = { eyes: 'x', mouth: 'o' }; sk = t < 2.2 ? 3 : 0; hit('a', vx0 + 2, gy - 58, 35); } }
      if (kind === 4) { // 小鎮警長：手電筒照得人睜不開眼，再一記重拳
        const p = clamp(t / 1.2), px = W * 0.92 - (W * 0.92 - vx0 - 28) * ease(p), punch = clamp((t - 1.6) / 0.2);
        if (t > 0.9 && t < 1.7) { g.globalAlpha = 0.35; for (let y = -10; y <= 10; y++) line(g, px - 18, gy - 40, vx0, gy - 50 + y * 2, '#fff8c0', 1); g.globalAlpha = 1; vp = { eyes: 'blink', mouth: 'o', arms: ['up', 'down'] }; }
        spr(g, ch(4, { arms: [t > 0.6 && t < 1.7 ? 'out' : 'down', punch > 0 ? 'out' : 'down'], legs: p < 1 ? (Math.floor(t * 8) % 2 ? 'a' : 'b') : 'stand', mouth: 'flat' }, 0), px, gy, { scale: S * 1.1, flip: true });
        if (punch >= 1) { const h2 = clamp((t - 1.8) / 0.9); vx = vx0 - h2 * W * 0.3; vy = gy - Math.sin(h2 * Math.PI) * 22; vr = -h2 * 1.6; vp = { eyes: 'x', mouth: 'o', arms: ['out', 'out'] }; sk = h2 < 0.3 ? 3 : 0; hit('a', vx0, gy - 56, 25); } }
      if (kind === 5) { // 校隊隊長：撬棍揮兩下
        const sw1 = clamp((t - 1.3) / 0.22), sw2 = clamp((t - 2.2) / 0.22), cx2 = vx0 + 34; const up = (t > 0.8 && sw1 < 1) || (t > 1.8 && sw2 < 1);
        spr(g, ch(5, { arms: ['down', up ? 'up' : 'fwd'], mouth: 'flat' }, 0), cx2, gy, { scale: S, flip: true });
        g.save(); g.translate(cx2 - 12, gy - 50); g.rotate(up ? -0.3 : -1.6 - (sw2 > 0 ? 0.4 : 0)); R(g, -1, -28, 3, 28, '#7a7a84'); R(g, -4, -28, 4, 3, '#9a9aa4'); g.restore();
        if (sw1 >= 1) { vr = -0.4 - clamp((t - 2.4) / 0.5) * 1.1; vp = { eyes: sw2 >= 1 ? 'x' : 'wide', mouth: 'o' }; sk = (t < 1.7 || (t > 2.4 && t < 2.7)) ? 3 : 0; hit('a', vx0 + 4, gy - 56, 30); if (sw2 >= 1) hit('b', vx0, gy - 46, 40); } }
      if (kind === 6) { // 鍵盤手：一個和弦按下去，音箱的聲波把人震飛
        const strum = t > 1.3, gx = W * 0.84; R(g, gx - 44, gy - 26, 18, 26, '#1a1a1a'); disc(g, gx - 35, gy - 15, 6, '#3a3a3a'); disc(g, gx - 35, gy - 15, 2, '#111');
        spr(g, ch(6, { arms: ['fwd', 'fwd'], mouth: strum ? 'grin' : 'flat', eyes: 'open', dy: strum ? Math.floor(t * 12) % 2 : 0 }, Math.floor(t * 8)), gx, gy, { scale: S, flip: true });
        if (strum) { for (let k = 0; k < 6; k++) { const p = ((t - 1.3) * 1.3 + k / 6) % 1, r = 8 + p * W * 0.7; g.globalAlpha = 1 - p; for (let a = -0.5; a <= 0.5; a += 0.04) R(g, gx - 35 - Math.cos(a) * r, gy - 15 + Math.sin(a) * r, 2, 2, k % 2 ? '#ff3ab0' : '#3af0ff'); } g.globalAlpha = 1;
          const h2 = clamp((t - 1.6) / 1.4); vx = vx0 - ease(h2) * W * 0.6; vy = gy - Math.sin(h2 * Math.PI) * 20; vr = -h2 * 2.2; va = 1 - clamp((h2 - 0.6) * 2.5); vp = { arms: ['out', 'out'], eyes: 'x', mouth: 'o' }; sk = t < 2.6 ? 2 : 0; } }
      if (kind === 7) { // 藤蔓鹿怪：從陰影裡站起來，鹿角的藤蔓甩出去纏住人，把人拖進胸口的裂縫
        const rise = ease(clamp((t - 0.2) / 1.0)), lash = clamp((t - 1.2) / 0.5), pull = ease(clamp((t - 1.9) / 1.0)), mx = vx0 + 44;
        g.globalAlpha = rise; glow(g, mx, gy - 40, 16 + Math.sin(t * 6) * 3, '255,40,40', 0.5 * rise); spr(g, ch(7, { arms: lash > 0 ? ['out', 'out'] : ['down', 'down'], eyes: 'glow', legs: 'stand' }, Math.floor(t * 4)), mx, gy + (1 - rise) * 40, { scale: S * 1.35 }); g.globalAlpha = 1;
        if (lash > 0 && pull < 1) for (let k = 0; k < 5; k++) { const ex = mx + (vx - mx) * lash + Math.sin(t * 9 + k) * 3, ey = gy - 70 + k * 6 + (vy - 40 - (gy - 70)) * lash * 0.5; line(g, mx - 8 + k * 4, gy - 82, ex, ey + k * 4, '#2a0408', 2); R(g, ex, ey + k * 4, 2, 2, '#e0283a'); }
        if (lash >= 1) { vx = vx0 + (mx - vx0) * pull; vy = gy - pull * 20; vp = { arms: ['up', 'up'], eyes: 'wide', mouth: 'o', dy: Math.floor(t * 20) % 2 }; vtint = '#3a0408'; va = 1 - clamp((pull - 0.7) * 3.3); sk = 1; if (pull > 0.8) hit('a', mx, gy - 40, 50); } }
      // 破產者
      if (va > 0) spr(g, ch(vi, vp, 0), vx, vy, { scale: S, rot: vr, alpha: va, tint: vtint, tintA: vtint === '#e8f8ff' ? 0.8 : 0.45 });
      if (kind === -1) { R(g, 0, gy + 2, W, Hh - gy, '#140406'); vineGrow(g, vines, t, clamp((t - 0.6) / 1.2), '#2a0408'); }
      drawBlood(g, t); drawDust(g, t); g.restore(); lastShk = sk;
    }, snd);
  };

  root.MONO_TOWN = TW;
})(typeof window !== 'undefined' ? window : globalThis);
