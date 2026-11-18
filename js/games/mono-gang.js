// 大富翁：幫派街區的動畫（16-bit 像素版）——彩蛋 6 個＋破產 9 種（看破產者是誰）＋沒債主的 2 種
// 畫在寬 140 像素的低解析度畫布上再用最近鄰放大；角色都是 mono-gangpix.js 的像素小人
// 動畫裡不放文字（結束後有通知卡片）；最後 0.7 秒由外框慢慢變黑
(function (root) {
  const P = root.MONO_PIXEL; if (!P || !P.gangSprite) return;
  const GA = {};
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (x, a, b) => Math.max(a == null ? 0 : a, Math.min(b == null ? 1 : b, x));
  const ease = (x) => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }, eout = (x) => 1 - Math.pow(1 - clamp(x), 3), ein = (x) => Math.pow(clamp(x), 3);
  const kit = (SFX) => root.MONO_SCORE && SFX ? root.MONO_SCORE.kit(SFX) : null;
  const LW0 = 120;
  // ---------- 低解析度畫布管線（寬 lw 像素，預設 120）----------
  function pix(ui, ms, scene, snd, lw) {
    let low = null, lg = null; const LW = lw || LW0;
    return ui.overlay(ms, (g, W, Hh, dpr, t) => {
      const lh = Math.round(LW * Hh / W); if (!low || low.height !== lh || low.width !== LW) { [low, lg] = P.canvas(LW, lh); }
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, LW, lh); lg.imageSmoothingEnabled = false;
      lg.save(); try { scene(lg, LW, lh, t); } finally { lg.restore(); }
      g.imageSmoothingEnabled = false; g.drawImage(low, 0, 0, W, Hh); g.imageSmoothingEnabled = true;
      const s = W / LW; g.fillStyle = 'rgba(0,0,0,.14)'; for (let y = 0; y < Hh; y += s) g.fillRect(0, Math.floor(y + s * 0.5), W, Math.max(1, Math.floor(s * 0.3)));
      const vg = g.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * 0.35, W / 2, Hh / 2, Math.max(W, Hh) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, Hh);
    }, snd);
  }
  const R = (g, x, y, w, h, c) => { if (w <= 0 || h <= 0) return; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const A = (g, a, f) => { const o = g.globalAlpha; g.globalAlpha = o * clamp(a); f(); g.globalAlpha = o; };
  function line(g, x0, y0, x1, y1, c, w) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); g.fillStyle = c; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, n = 0; while (n++ < 800) { g.fillRect(x0, y0, w || 1, w || 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  function disc(g, cx, cy, r, c) { g.fillStyle = c; r = Math.max(0, r); for (let y = -Math.round(r); y <= Math.round(r); y++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
  function oval(g, cx, cy, rx, ry, c) { g.fillStyle = c; for (let y = -Math.round(ry); y <= Math.round(ry); y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
  function ring(g, cx, cy, r, c, w) { const n = Math.max(12, Math.round(r * 6)); g.fillStyle = c; for (let k = 0; k < n; k++) { const a = k / n * 6.283; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), w || 1, w || 1); } }
  const hex = (c) => { const m = c.replace('#', '').match(/../g); return m.map(h => parseInt(h, 16)).join(','); };
  function glow(g, x, y, r, rgb, a) { if (rgb[0] === '#') rgb = hex(rgb); const o = g.globalAlpha; for (let k = 7; k >= 1; k--) { g.globalAlpha = o * clamp(a) * 0.13; disc(g, x, y, r * k / 7, `rgb(${rgb})`); } g.globalAlpha = o; }
  const shk = (g, k) => { if (k > 0) g.translate(Math.round(rnd(-k, k)), Math.round(rnd(-k, k))); };
  // 漸層色帶（像素抖色）
  function bands(g, x, y, w, h, cols) { const n = cols.length; for (let i = 0; i < n; i++) { const y0 = y + Math.floor(h * i / n), y1 = y + Math.floor(h * (i + 1) / n); R(g, x, y0, w, y1 - y0, cols[i]); if (i < n - 1) for (let xx = 0; xx < w; xx += 2) R(g, x + xx + ((y1 >> 0) % 2), y1 - 1, 1, 1, cols[i + 1]); } }
  // ---------- 角色 ----------
  const tintC = {}; let tintN = 0;
  function tinted(img, col) { const key = (img.__id || (img.__id = 'i' + (++tintN))) + col; if (tintC[key]) return tintC[key]; const [c, g] = P.canvas(img.width, img.height); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(0, 0, img.width, img.height); if (Object.keys(tintC).length > 400) for (const k in tintC) delete tintC[k]; return (tintC[key] = c); }
  // 畫角色：x,y＝腳底中心；o: flip, rot（繞腳底）, alpha, tint/tintA, scale, sx/sy（各軸縮放）, clipY（只畫這條線以上）
  function spr(g, img, x, y, o) {
    o = o || {}; const s = o.scale || 1, sx = (o.sx || 1) * s, sy = (o.sy || 1) * s; g.save(); g.translate(Math.round(x), Math.round(y));
    if (o.clipY != null) { g.beginPath(); g.rect(-200, o.clipY - Math.round(y) - 400, 400, 400); g.clip(); }
    if (o.rot) g.rotate(o.rot); if (o.flip) g.scale(-1, 1); g.globalAlpha *= o.alpha == null ? 1 : clamp(o.alpha);
    const w = Math.round(img.width * sx), h = Math.round(img.height * sy), dx = -Math.round(w / 2), dy = -h + Math.round(2 * sy);
    g.drawImage(img, dx, dy, w, h); if (o.tint) { g.globalAlpha *= o.tintA == null ? 0.6 : o.tintA; g.drawImage(tinted(img, o.tint), dx, dy, w, h); }
    g.restore();
  }
  const seatChar = (v, s) => { const c = v && v.players && v.players[s] && v.players[s].char; return c && c.kind === 'preset' ? c.i % 9 : 6; };
  function seatOpt(ui, s) { const p = ui.v && ui.v.players && ui.v.players[s]; if (!p) return null; let img = null; try { img = p.pill && ui.pillImg ? ui.pillImg(p.pill) : null; } catch (e) {} return { img, stamp: p.stamp || 0 }; }
  const CH = (i, pose, f, opt) => P.gangSprite(i, pose || {}, f || 0, opt || null);
  // 自訂造型（老大、毒梟、狼、舌頭……）：先畫在小畫布上、自動描深色外框，跟角色同一套畫風；依 key 快取（上限 600 張，滿了就清掉）
  const SPC = {}; let spcN = 0;
  function mkspr(key, w, h, fn) { if (SPC[key]) return SPC[key]; if (++spcN > 600) { for (const k in SPC) delete SPC[k]; spcN = 1; } const [c, g2] = P.canvas(w, h); fn(g2, (x, y, ww, hh, col) => R(g2, x, y, ww, hh, col)); P.outline(c); return (SPC[key] = c); }
  // 畫自訂造型：x,y＝腳底中心（畫布底部往上 2 格）
  function put(g, c, x, y, o) { o = o || {}; const k = o.scale || 1; g.save(); g.translate(Math.round(x), Math.round(y)); if (o.rot) g.rotate(o.rot); if (o.flip) g.scale(-1, 1); if (o.alpha != null) g.globalAlpha *= clamp(o.alpha); g.drawImage(c, -Math.round(c.width * k / 2), -Math.round(c.height * k) + Math.round(2 * k), Math.round(c.width * k), Math.round(c.height * k)); g.restore(); }
  const HUMAN = [3, 5, 6, 7]; // 大鼻子算人類（黑頭車）；藥類被沖馬桶
  // ---------- 粒子 ----------
  function parts() { const L = []; return {
    add(o) { L.push(o); }, burst(n, x, y, sp, t0, col, o) { for (let i = 0; i < n; i++) L.push(Object.assign({ x, y, vx: rnd(-sp, sp), vy: rnd(-sp * 1.3, sp * 0.3), t: t0 + rnd(0, 0.1), s: Math.random() < 0.3 ? 2 : 1, c: Array.isArray(col) ? col[i % col.length] : col, gr: 120, life: 1.6 }, o || {})); },
    draw(g, t) { for (let i = L.length - 1; i >= 0; i--) { const d = L[i], a = t - d.t; if (a > d.life) { L.splice(i, 1); continue; } if (a < 0) continue; const x = d.x + d.vx * a * 30, y = d.y + d.vy * a * 30 + a * a * d.gr * 0.5; if (d.fade) g.globalAlpha = 1 - a / d.life; R(g, x, y, d.s, d.s, d.c); g.globalAlpha = 1; } },
    clear() { L.length = 0; } }; }
  // ---------- 音效小工具 ----------
  const S = {
    splash(SFX, t, v) { SFX.noise(0.7, { f: 1400, type: 'bandpass', q: 0.8, vol: 0.16 * (v || 1), delay: t, attack: 0.005 }); SFX.noise(0.35, { f: 300, vol: 0.14 * (v || 1), delay: t }); for (let i = 0; i < 6; i++) SFX.tone(rnd(500, 1300), 0.06, { glide: rnd(1400, 2400), vol: 0.025, delay: t + 0.05 + i * 0.05, wet: 0.3 }); },
    bubbles(SFX, t, d, n) { for (let i = 0; i < n; i++) { const f = rnd(300, 700); SFX.tone(f, 0.07, { glide: f * 2.4, vol: 0.03, delay: t + rnd(0, d), wet: 0.6 }); } },
    fly(SFX, t, d) { for (let k = 0; k < d * 3; k++) SFX.tone(rnd(180, 230), 0.4, { type: 'sawtooth', vol: 0.01, lp: 1100, detune: rnd(-30, 30), delay: t + k / 3 }); },
    drip(SFX, t) { SFX.tone(1400, 0.08, { glide: 600, vol: 0.04, delay: t, wet: 0.7 }); },
    gun(SFX, t, v) { SFX.noise(0.18, { f: 2200, type: 'bandpass', q: 0.6, vol: 0.32 * (v || 1), delay: t, attack: 0.002 }); SFX.noise(0.4, { f: 180, vol: 0.3 * (v || 1), delay: t, attack: 0.002 }); SFX.tone(110, 0.2, { glide: 40, vol: 0.18 * (v || 1), delay: t, wet: 0.5 }); },
    glass(SFX, t) { for (let i = 0; i < 14; i++) SFX.tone(rnd(2500, 6000), rnd(0.05, 0.25), { type: 'triangle', vol: 0.02, delay: t + rnd(0, 0.35), wet: 0.4 }); SFX.noise(0.3, { f: 5000, type: 'highpass', vol: 0.08, delay: t }); },
    thud(SFX, t, v) { SFX.tone(90, 0.25, { glide: 40, vol: 0.2 * (v || 1), delay: t, wet: 0.2 }); SFX.noise(0.15, { f: 400, vol: 0.1 * (v || 1), delay: t }); },
    beat(K, t, bars, bpm, o) { o = o || {}; const b = 60 / bpm; for (let i = 0; i < bars * 4; i++) { const st = t + i * b; if (o.kick !== false && (o.four || i % 2 === 0)) K.drum(st, 52, o.kv || 0.4, 0.28); if (i % 2 === 1 && o.snare !== false) K.snare(st, o.sv || 0.13); if (o.hat !== false) { K.cymbal(st + b / 2, 0.05, o.hv || 0.03); if (o.hat16) K.cymbal(st + b / 4 * 3, 0.03, (o.hv || 0.03) * 0.6); } } },
    bass(SFX, t, notes, step, o) { o = o || {}; notes.forEach((f, i) => { if (f) SFX.tone(f, step * (o.len || 0.9), { type: o.type || 'triangle', vol: o.vol || 0.12, lp: o.lp || 600, wet: false, delay: t + i * step, glide: o.slide && notes[i + 1] ? notes[i + 1] : undefined }); }); },
    lead(SFX, t, notes, step, o) { o = o || {}; notes.forEach((f, i) => { if (!f) return; SFX.tone(f, step * (o.len || 0.95), { type: o.type || 'sine', vol: o.vol || 0.05, lp: o.lp, detune: o.det || 0, wet: o.wet == null ? 0.4 : o.wet, attack: o.att || 0.02, delay: t + i * step, glide: o.glide ? f * o.glide : undefined }); }); }
  };

  // ======================= 幸運彩蛋 1：馬桶潛水（致敬《猜火車》）=======================
  // 全城最髒的廁所 → 伸手進馬桶 → 整個人鑽進去 → 清澈的深藍海底，優雅游泳撈起兩顆發光藥丸 → 從馬桶衝出來，錢噴滿天
  // 髒公廁（參考使用者給的像素公廁：白磁磚牆＋各色塗鴉、深色地磚、尿斗、洗手台、破鏡子、小心地滑牌、垃圾桶、積水）——全部原創重畫
  const GRAF = [[[8, 30], [12, 24], [16, 32], [20, 24], [24, 31]], [[30, 18], [34, 14], [38, 20], [42, 15]], [[60, 40], [64, 34], [68, 42], [72, 35], [76, 41]], [[84, 22], [90, 28], [94, 20], [98, 27]]];
  function tileWall(g, x0, y0, w, h, t, dirt) { R(g, x0, y0, w, h, '#ecebe4'); for (let y = y0 + h; y > y0; y -= 4) R(g, x0, y, w, 1, '#c8c4bc'); for (let x = x0; x < x0 + w; x += 6) R(g, x, y0, 1, h, '#c8c4bc');
    for (let k = 0; k < 40; k++) { const x = x0 + (k * 37) % w, y = y0 + (k * 23) % h; if ((k * 7) % 3 === 0) R(g, x, y, 1, 1, '#b8b4a8'); }
    if (dirt) for (let y = y0 + h - 14; y < y0 + h; y++) { g.globalAlpha = (y - (y0 + h - 14)) / 14 * 0.35; R(g, x0, y, w, 1, '#8a7a4a'); } g.globalAlpha = 1; }
  function urinal(stain, tape) { return mkspr('ur' + stain + tape, 18, 30, (g2, r) => { r(7, 0, 4, 3, '#8a8a92'); r(8, 3, 2, 4, '#9a9aa2'); r(3, 7, 12, 20, '#f4f2ec'); r(12, 7, 3, 20, '#d8d4cc'); r(5, 12, 8, 12, '#d8d2c4'); r(5, 18, 8, 6, stain ? '#b8a060' : '#c8c2b4'); if (stain) { r(6, 22, 3, 2, '#7a5a2a'); r(10, 20, 2, 2, '#a88a40'); } r(4, 27, 10, 2, '#c8c4bc');
    if (tape) { for (let k = 0; k < 12; k++) { r(3 + k, 10 + Math.round(k * 0.7), 1, 2, k % 4 < 2 ? '#ffd23a' : '#1a1a1a'); r(3 + k, 18 - Math.round(k * 0.6), 1, 2, k % 4 < 2 ? '#ffd23a' : '#1a1a1a'); } } }); }
  function sink() { return mkspr('sink', 26, 22, (g2, r) => { r(11, 0, 2, 5, '#8a8a92'); r(9, 2, 6, 2, '#a8a8b0'); r(14, 4, 2, 2, '#8a8a92'); r(1, 6, 24, 8, '#f4f2ec'); r(3, 7, 20, 4, '#c8c4bc'); r(5, 8, 7, 2, '#b8a878'); r(21, 6, 3, 8, '#d8d4cc'); r(9, 14, 8, 4, '#e0dcd4'); r(11, 18, 4, 3, '#4a4a52'); r(14, 19, 6, 2, '#3a3a42'); }); }
  function wetSign() { return mkspr('wet', 14, 20, (g2, r) => { for (let y = 0; y < 18; y++) { const w = 4 + Math.floor(y * 0.45); r(7 - w, y, w * 2, 1, y < 2 ? '#ffe86a' : '#f4c820'); } r(5, 4, 4, 6, '#1a1a1a'); r(6, 5, 2, 3, '#f4c820'); r(6, 9, 2, 1, '#f4c820'); r(0, 17, 14, 2, '#c89a10'); }); }
  function trashCan(over) { return mkspr('trash' + over, 22, 26, (g2, r) => { r(2, 6, 18, 20, '#6a6a72'); r(2, 6, 18, 2, '#8a8a92'); r(16, 8, 4, 18, '#4a4a52'); for (let k = 0; k < 3; k++) r(5 + k * 5, 10, 1, 14, '#5a5a62'); r(1, 4, 20, 3, '#7a7a82'); if (over) { [[4, 0], [10, 1], [15, 0], [7, 2]].forEach(([x, y], j) => { r(x, y + 1, 5, 4, j % 2 ? '#f4f2ec' : '#e0dcd0'); r(x + 1, y + 2, 2, 1, '#c8c4bc'); }); } }); }
  function mirror(g, x, y, w, h) { R(g, x - 1, y - 1, w + 2, h + 2, '#4a4a52'); R(g, x, y, w, h, '#6a9ab8'); R(g, x, y, w, 3, '#8ab8d0'); line(g, x + 4, y + 2, x + w - 6, y + h - 3, '#3a5a72'); line(g, x + w * 0.5, y + 3, x + 3, y + h - 4, '#3a5a72'); line(g, x + 6, y + 6, x + 14, y + 4, '#1a1a22'); line(g, x + 14, y + 4, x + 10, y + 10, '#1a1a22'); line(g, x + w - 12, y + h - 8, x + w - 4, y + h - 10, '#c82a2a'); R(g, x + 3, y + 3, 4, 1, '#c8e0f0'); }
  function restroom(g, W, Hh, t, o) {
    o = o || {}; const fy = Math.round(Hh * 0.66), lit = o.lit != null ? o.lit : (Math.sin(t * 23) > 0.85 || (t % 1.7) < 0.08 ? 0.35 : 1), sx1 = Math.round(W * 0.66);
    tileWall(g, 0, 0, W, fy, t, true);
    // 塗鴉（看不出字的線條、記號、愛心、笑臉貼紙、海報）
    const cols = ['#c82a2a', '#2a8a3a', '#2a4ac8', '#1a1a1a'];
    GRAF.forEach((pts, k) => { const c = cols[k % 4], oy = fy - 120; for (let i = 0; i < pts.length - 1; i++) line(g, pts[i][0] * W / 120, oy + pts[i][1], pts[i + 1][0] * W / 120, oy + pts[i + 1][1], c); });
    ring(g, W * 0.3, fy - 70, 5, '#c82a2a'); line(g, W * 0.3 - 3, fy - 66, W * 0.3, fy - 76, '#c82a2a'); line(g, W * 0.3, fy - 76, W * 0.3 + 3, fy - 66, '#c82a2a');
    disc(g, W * 0.56, fy - 56, 4, '#2a2a8a'); disc(g, W * 0.56, fy - 56, 3, '#ecebe4'); R(g, W * 0.56 - 2, fy - 57, 1, 1, '#2a2a8a'); R(g, W * 0.56 + 1, fy - 57, 1, 1, '#2a2a8a'); R(g, W * 0.56 - 1, fy - 55, 3, 1, '#2a2a8a');
    R(g, W * 0.78, fy - 108, 16, 20, '#f4f2ec'); R(g, W * 0.78 + 1, fy - 107, 14, 18, '#2a6ac8'); disc(g, W * 0.78 + 8, fy - 100, 4, '#ffffff'); R(g, W * 0.78 + 3, fy - 94, 10, 2, '#ffffff'); R(g, W * 0.78 + 3, fy - 91, 6, 1, '#ffffff'); // 藍色海報
    // 隔間：左邊是放馬桶的隔間（木紋隔板），右邊是尿斗、洗手台、破鏡子
    R(g, sx1, fy - 96, 4, 96, '#6a5e52'); R(g, sx1, fy - 96, 4, 2, '#8a7e72'); R(g, 0, fy - 98, sx1 + 4, 3, '#6a5e52'); R(g, 0, fy - 98, 3, 98, '#6a5e52'); for (let y = fy - 92; y < fy; y += 16) R(g, sx1 + 1, y, 2, 1, '#4a4038');
    R(g, sx1 + 1, fy - 60, 2, 6, '#9a9aa2'); // 門門
    put(g, urinal(1, 1), sx1 + 16, fy - 12); mirror(g, W - 30, fy - 84, 26, 30); put(g, sink(), W - 17, fy - 30);
    // 地板：深色地磚、積水、垃圾
    R(g, 0, fy, W, Hh - fy, '#3a3a40'); for (let y = fy; y < Hh; y += 6) R(g, 0, y, W, 1, '#2a2a30'); for (let x = 0; x < W; x += 9) R(g, x, fy, 1, Hh - fy, '#2a2a30'); R(g, 0, fy, W, 2, '#1a1a20');
    [[0.2, 34, 12, 4, 'rgba(160,130,60,.55)'], [0.75, 22, 14, 3, 'rgba(160,130,60,.5)'], [0.62, 60, 16, 4, 'rgba(90,140,170,.5)']].forEach(([x, y, rx, ry, c]) => { oval(g, x * W, fy + y, rx, ry, c); R(g, x * W - rx + 4, fy + y - 1, 4, 1, 'rgba(255,255,230,.3)'); });
    put(g, wetSign(), W * 0.82, fy + 44); put(g, trashCan(1), 14, fy + 70);
    [[0.48, 64], [0.9, 72], [0.36, 80]].forEach(([x, y], k) => { disc(g, x * W, fy + y, 2, '#e8e4dc'); R(g, x * W - 1, fy + y - 1, 1, 1, '#ffffff'); });
    R(g, W * 0.6, fy + 82, 7, 3, '#f4f2ec'); R(g, W * 0.6 + 7, fy + 83, 6, 1, '#e0dcd0'); // 掉在地上的衛生紙
    // 天花板的日光燈（壞掉一直閃）
    R(g, W * 0.18, 2, W * 0.5, 3, '#2a2a30'); R(g, W * 0.18 + 2, 5, W * 0.5 - 4, 2, lit > 0.5 ? '#e8f8d0' : '#5a6050');
    if (lit < 0.5) { g.globalAlpha = 0.4; R(g, 0, 0, W, Hh, '#0a0c08'); g.globalAlpha = 1; }
    return { cx: Math.round(W * 0.34), fy };
  }
  // 馬桶（統一用「從正前方往下 45 度」的斜俯視：所有水平面＝往後的深度、所有垂直面＝高度，都壓成 0.7 倍；左右不變）
  // 座標：原點＝馬桶前端落地點，往上是負的；牆在深度 50 的地方（地上的牆角線在 y＝−35）
  const K45 = 0.707, PY = (z, d) => -(z + d) * K45;
  const TOI = { w: 44, h: 116, ox: 22, oy: 113, wallY: PY(0, 50),
    seat: { y: PY(40, 25), rx: 18, ry: 22 * K45 }, hole: { y: PY(40, 23), rx: 11.5, ry: 14 * K45 }, water: { y: PY(37, 21), rx: 10.5, ry: 11 * K45 }, // 水面在座圈下面一點
    tank: { top: PY(105, 50), mid: PY(105, 36), bot: PY(80, 36) }, hinge: PY(40, 46) };
  function toiletImg(u, water, dirty) { return mkspr('toi' + u + water + (dirty ? 1 : 0), Math.round(TOI.w * u), Math.round(TOI.h * u), (g2) => {
    const X = (x) => Math.round((TOI.ox + x) * u), Y = (y) => Math.round((TOI.oy + y) * u);
    const rect = (x0, y0, x1, y1, c) => { const a1 = X(x0), b1 = Y(y0), a2 = X(x1), b2 = Y(y1); if (a2 > a1 && b2 > b1) R(g2, a1, b1, a2 - a1, b2 - b1, c); };
    const ell = (cx, cy, rx, ry, c) => oval(g2, X(cx), Y(cy), rx * u, ry * u, c);
    // 牆上的水箱：上面（看得到頂面）＋正面
    rect(-20, TOI.tank.top, 20, TOI.tank.mid, '#f8f6f2'); rect(-19, TOI.tank.top + 1, 19, TOI.tank.top + 2, '#ffffff'); rect(-20, TOI.tank.mid, 20, TOI.tank.bot, '#d6d0c6'); rect(16, TOI.tank.mid, 20, TOI.tank.bot, '#c2bcb2'); rect(-20, TOI.tank.mid, 20, TOI.tank.mid + 1, '#e8e2d8'); rect(10, TOI.tank.mid + 4, 16, TOI.tank.mid + 6, '#9a9aa2');
    // 水管：沿著牆往下接到馬桶後面
    rect(-2, TOI.tank.bot, 2, TOI.hinge + 1, '#a8a8b0'); rect(-2, TOI.tank.bot, -1, TOI.hinge + 1, '#d8d8e0'); rect(1, TOI.tank.bot, 2, TOI.hinge + 1, '#7a7a82'); rect(-4, TOI.hinge - 3, 4, TOI.hinge, '#8a8a92');
    // 馬桶本體的正面（座圈前緣到地面，往下收窄）
    const yT = PY(40, 10), yB = PY(0, 8); /* 上緣藏在座圈底下，兩者接成一體 */ for (let y = yT; y <= yB; y += 1 / u) { const k = (y - yT) / (yB - yT), hw = 17 - 6 * Math.pow(k, 0.8), yy = Y(y); R(g2, X(-hw), yy, X(hw) - X(-hw), 1, '#ece6dc'); R(g2, X(hw - 4), yy, X(hw) - X(hw - 4), 1, '#d4cdc2'); R(g2, X(hw - 2), yy, X(hw) - X(hw - 2), 1, '#c2bbb0'); R(g2, X(-hw + 2), yy, X(-hw + 4) - X(-hw + 2), 1, '#f8f4ee'); R(g2, X(-hw), yy, X(-hw + 1) - X(-hw), 1, '#d8d2c8'); } // 圓弧的正面：左邊受光、右邊陰影
    rect(-12, yB, 12, yB + 2, '#c8c2b8'); // 落地
    // 座圈後面的接頭
    rect(-11, TOI.hinge - 1, 11, TOI.hinge + 3, '#e0dad0');
    // 座圈：先畫前緣厚度（往下 2），再畫頂面
    ell(0, TOI.seat.y + 2.5, TOI.seat.rx, TOI.seat.ry, '#d8d2c8'); ell(0, TOI.seat.y, TOI.seat.rx, TOI.seat.ry, '#f6f2ea'); ell(-3, TOI.seat.y - 3, TOI.seat.rx - 6, TOI.seat.ry - 5, '#fcfaf6');
    // 洞：看得到後面的內壁，水面比座圈低，所以在洞的前半段、被前緣擋掉一部分
    ell(0, TOI.hole.y, TOI.hole.rx, TOI.hole.ry, '#bcb6ac'); ell(0, TOI.hole.y - 2, TOI.hole.rx - 2, TOI.hole.ry - 3, '#cdc7bd');
    g2.save(); g2.beginPath(); g2.ellipse(X(0), Y(TOI.hole.y), TOI.hole.rx * u, TOI.hole.ry * u, 0, 0, 6.283); g2.clip();
    ell(0, TOI.water.y, TOI.water.rx, TOI.water.ry, water); ell(-2, TOI.water.y - 1.5, 3.5, 1.2, 'rgba(255,255,255,.45)');
    if (dirty) { R(g2, X(3), Y(TOI.water.y - 1), 3 * u, 2 * u, '#4a3412'); R(g2, X(-5), Y(TOI.water.y + 1), 2 * u, u, '#4a3412'); }
    g2.restore();
    if (dirty) { [[-8, -3, 5], [7, -2, 4], [0, -6, 3]].forEach(([x, dy2, h]) => rect(x, TOI.hole.y + dy2, x + 1, TOI.hole.y + dy2 + h, '#8a6a2a')); }
  }); }
  function toilet(g, cx, by, o) { // 畫馬桶（by＝前端落地點），回傳水面中心、半徑、洞的範圍、牆角線
    o = o || {}; const u = o.s || 1.4, img = toiletImg(u, o.water || '#7a6a32', !o.clean); g.drawImage(img, Math.round(cx - TOI.ox * u), Math.round(by - TOI.oy * u));
    return { x: cx, y: by + TOI.water.y * u, rx: TOI.water.rx * u, ry: TOI.water.ry * u, hy: by + TOI.hole.y * u, hrx: TOI.hole.rx * u, hry: TOI.hole.ry * u, holeTop: by + (TOI.hole.y - TOI.hole.ry) * u, wallY: by + TOI.wallY * u, u };
  }
  const SEA = { fish: Array.from({ length: 7 }, (_, k) => ({ y: 0.12 + k * 0.09, v: rnd(0.04, 0.09) * (k % 2 ? 1 : -1), o: rnd(0, 1), s: k % 3 })), weed: Array.from({ length: 9 }, (_, k) => ({ x: 4 + k * 14 + rnd(-3, 3), h: 18 + rnd(0, 26), p: rnd(0, 6) })), bub: Array.from({ length: 30 }, () => ({ x: Math.random(), v: rnd(0.08, 0.2), o: Math.random(), s: Math.random() < 0.3 ? 2 : 1 })) };
  function sea(g, W, Hh, t) {
    bands(g, 0, 0, W, Hh, ['#3ab0d8', '#2a98c8', '#1e80b4', '#16689e', '#105488', '#0c4272', '#08325c', '#06264a']);
    for (let k = 0; k < 6; k++) { const x0 = ((k * 27 + t * 6) % (W + 40)) - 20, a = 0.08 + 0.05 * Math.sin(t * 1.3 + k); g.globalAlpha = a; for (let y = 0; y < Hh * 0.8; y++) R(g, x0 + y * 0.35, y, 5 + y * 0.03, 1, '#e8fbff'); } g.globalAlpha = 1;
    for (let x = 0; x < W; x += 2) { const y = 2 + Math.round(Math.sin(x * 0.2 + t * 3) * 1.5); R(g, x, y, 2, 1, '#bff4ff'); }
    SEA.fish.forEach((f, k) => { const x = (((f.o + t * f.v) % 1.3) + 1.3) % 1.3 * W - 10, y = Hh * f.y + Math.sin(t * 2 + k) * 2, d = f.v > 0 ? 1 : -1, c = ['#ffb03a', '#ff6a8a', '#7ae0ff'][f.s];
      R(g, x - 3, y - 1, 6, 3, c); R(g, x - 2, y - 2, 4, 1, c); R(g, x - 2, y + 2, 4, 1, c); R(g, x - 3 * d - (d > 0 ? 2 : 0), y - 2, 2, 5, c); R(g, x + 2 * d - (d > 0 ? 0 : 1), y - 1, 1, 1, '#101018'); });
    const sy = Math.round(Hh * 0.82); R(g, 0, sy, W, Hh - sy, '#d8c08a'); for (let x = 0; x < W; x++) R(g, x, sy - Math.round(Math.abs(Math.sin(x * 0.07)) * 3), 1, 3, '#d8c08a'); for (let k = 0; k < 60; k++) R(g, (k * 37) % W, sy + 3 + (k * 13) % (Hh - sy - 3), 1, 1, k % 2 ? '#b8a06a' : '#efd9a4');
    oval(g, 16, sy + 2, 9, 5, '#5a6a7a'); oval(g, 14, sy, 5, 2, '#7a8a9a'); oval(g, W - 14, sy + 3, 12, 6, '#4a5a6a'); oval(g, W - 18, sy, 6, 2, '#6a7a8a');
    SEA.weed.forEach(w => { for (let i = 0; i < w.h; i++) R(g, w.x + Math.round(Math.sin(i * 0.25 + t * 1.6 + w.p) * (i / w.h) * 4), sy - i, 2, 1, i % 5 < 3 ? '#2a9a5a' : '#3ac06a'); });
    [[W - 28, sy, '#ff6a7a'], [36, sy, '#ff9a5a']].forEach(([x, y, c]) => { for (let k = -2; k <= 2; k++) line(g, x, y, x + k * 3, y - 10 + Math.abs(k), c, 2); disc(g, x, y - 1, 2, c); });
    SEA.bub.forEach(b => { const y = Hh - (((b.o + t * b.v) % 1) * Hh), x = b.x * W + Math.sin(t * 3 + b.o * 9) * 2; ring(g, x, y, b.s, 'rgba(220,250,255,.8)'); });
    g.globalAlpha = 0.25; for (let k = 0; k < 40; k++) { const x = (k * 53 + Math.sin(t + k) * 4) % W, y = sy + 2 + (k * 29) % 18; R(g, x, y, 2, 1, '#fffbe0'); } g.globalAlpha = 1;
    return sy;
  }
  function capsule(g, x, y, rot, t, glowA, sc) { // 發光的膠囊（半白半紅）
    const k = sc || 1; if (glowA) glow(g, x, y, (9 + Math.sin(t * 6) * 1.5) * k, '255,240,170', glowA);
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot || 0); g.scale(k, k); R(g, -5, -2, 5, 5, '#f8f8f0'); R(g, 0, -2, 5, 5, '#e8304a'); R(g, -6, -1, 1, 3, '#f8f8f0'); R(g, 5, -1, 1, 3, '#e8304a'); R(g, -4, -2, 8, 1, 'rgba(255,255,255,.9)'); R(g, -5, 2, 10, 1, 'rgba(0,0,0,.25)'); R(g, -1, -2, 1, 5, '#c8c0b8'); g.restore();
  }
  function bill(g, x, y, rot, k) { g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(rot || 0); if (k) g.scale(k, k); R(g, -7, -4, 14, 8, '#4aa85a'); R(g, -7, -4, 14, 1, '#8ae09a'); R(g, -6, -3, 12, 6, '#3a9a4a'); ring(g, 0, 0, 2, '#a8f0b0'); R(g, -5, -2, 2, 1, '#a8f0b0'); R(g, 3, 1, 2, 1, '#a8f0b0'); R(g, -7, 3, 14, 1, '#2a6a3a'); g.restore(); }
  GA.toilet = function (SFX, e) {
    const ui = this, s = e && e.seat >= 0 ? e.seat : 0, ci = seatChar(ui.v, s), op = seatOpt(ui, s), T = 7400, pt = parts(), SC = 1.45;
    const cash = Array.from({ length: 40 }, () => ({ x: rnd(0, 120), v: rnd(0.8, 1.3), d: rnd(0, 0.6), r: rnd(0, 6), w: rnd(2, 5) })), flies = Array.from({ length: 5 }, () => ({ a: rnd(0, 6), r: rnd(6, 16), v: rnd(5, 9), h: rnd(4, 16) }));
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.buzz(0, 2.7, 0.03); S.fly(SFX, 0, 2.6); [0.3, 1.1, 1.9].forEach(d => S.drip(SFX, d)); K.drone(0, 2.8, [65.4, 98], { lp: 260, vol: 0.05, a: 0.3, r: 0.3 });
      SFX.tone(220, 0.25, { type: 'sawtooth', glide: 140, vol: 0.03, lp: 900, delay: 1.0 });
      K.whoosh(1.75, 0.3, true, 0.1); S.splash(SFX, 2.15, 1.3); K.sweep(2.3, 0.4, 300, 6000, { rev: true, vol: 0.12 });
      K.pad(2.6, 4.2, [220, 277.2, 329.6, 415.3], 0.05, 1200); K.pad(2.6, 4.2, [110], 0.04, 500); K.harp(2.8, [440, 554.4, 659.3, 830.6, 880, 830.6, 659.3, 554.4, 440, 554.4, 659.3, 880], 0.24, 0.045); S.bubbles(SFX, 2.6, 3, 22); K.shimmer(4.3, 1.2, 2000, 0.03); K.chime(4.35, 1318.5, 0.06); K.chime(4.45, 1760, 0.05);
      K.sweep(5.3, 0.4, 300, 5000, { rev: true, vol: 0.12 }); S.splash(SFX, 5.7, 1.6); K.boom(5.7, 120, 50, 0.6, 0.25); [523.3, 659.3, 784, 1046.5].forEach((f, i) => SFX.tone(f, 0.9, { type: 'square', vol: 0.035, lp: 3000, delay: 5.85 + i * 0.07 })); K.shimmer(5.9, 1.2, 1800, 0.03);
      for (let i = 0; i < 12; i++) SFX.noise(0.05, { f: 3000, type: 'bandpass', vol: 0.04, delay: 6.0 + i * 0.07 }); };
    return pix(ui, T, (g, W, Hh, t) => {
      if (t < 2.5 || t >= 5.6) { // ---- 廁所 ----
        const back = t >= 5.6, rr = restroom(g, W, Hh, t, { lit: back ? 1 : undefined }), by = rr.fy - Math.round(TOI.wallY * 1.35); // 馬桶後面貼著牆
        const wt = toilet(g, rr.cx + 8, by, { s: 1.35, water: back ? '#7ac8e8' : null, water2: back ? '#bff0ff' : null, clean: back });
        if (!back) {
          const walk = clamp((t - 0.1) / 0.8), x0 = -10 + walk * 22, lean = clamp((t - 1.25) / 0.35), hop = clamp((t - 1.7) / 0.3), dive = clamp((t - 2.0) / 0.35);
          if (hop <= 0) {
            const pose = t < 0.9 ? { legs: Math.floor(t * 8) % 2 ? 'a' : 'b' } : t < 1.25 ? { eyes: 'wide', mouth: 'o' } : { arms: ['fwd', 'fwd'], eyes: 'wide', mouth: 'flat' };
            spr(g, CH(ci, pose, Math.floor(t * 4), op), x0 + lean * 3, by - 2, { scale: SC, rot: lean * 0.5 });
            if (t > 0.95 && t < 1.25) [[x0 + 8, by - 84], [x0 + 15, by - 88]].forEach(([x, y], k) => { R(g, x + k, y, 1, 4, '#8ac83a'); R(g, x + k, y + 5, 1, 1, '#8ac83a'); });
          } else { // 跳起來翻成頭下腳上，對準馬桶整個鑽進去（水面以下不畫）
            const H = 50 * SC, ax = x0 + 3 + (wt.x - x0 - 3) * ease(hop), ay = (by - 2) + (wt.y - H - (by - 2)) * ease(hop) - Math.sin(hop * Math.PI) * 26 + dive * (H + 8); // 翻成頭下腳上時，頭剛好對準碗裡的洞，再整個鑽進去
            spr(g, CH(ci, { arms: ['up', 'up'], legs: 'jump', eyes: 'blink' }, 0, op), ax, ay, { scale: SC, rot: Math.PI * ease(hop), clipY: dive > 0 ? wt.holeTop + 2 : null }); // 碗口後緣以下不畫＝鑽進洞裡了
          }
          if (t > 2.15 && !pt.s1) { pt.s1 = 1; pt.burst(30, wt.x, wt.y - 2, 1.8, t, ['#6a5a2a', '#8a7a3a', '#4a3a1a'], { gr: 160 }); }
          flies.forEach((f, k) => { const a = f.a + t * f.v, x = wt.x + Math.cos(a) * f.r, y = wt.y - f.h + Math.sin(a * 1.7) * 3; R(g, x, y, 1, 1, '#101010'); if (Math.floor(t * 30 + k) % 2) { R(g, x - 1, y - 1, 1, 1, 'rgba(220,230,255,.7)'); R(g, x + 1, y - 1, 1, 1, 'rgba(220,230,255,.7)'); } });
        } else {
          const up = eout(clamp((t - 5.62) / 0.4)), y = wt.y + 10 - up * 44;
          if (t < 6.5) { const k2 = Math.sin(clamp((t - 5.6) / 0.9) * Math.PI); for (let x = -12; x <= 12; x++) { const h = (1 - Math.abs(x) / 13) * 60 * k2; R(g, wt.x + x, wt.y - h, 1, h, x % 3 ? 'rgba(170,230,255,.75)' : 'rgba(230,250,255,.9)'); } }
          if (t > 5.62 && !pt.s2) { pt.s2 = 1; pt.burst(44, wt.x, wt.y - 4, 2.2, t, ['#bff0ff', '#7ac8e8', '#ffffff'], { gr: 140 }); }
          spr(g, CH(ci, { arms: ['up', 'up'], mouth: 'grin', eyes: 'open' }, 0, op), wt.x, y, { scale: SC, clipY: wt.y + 2 });
          const hand = (P.gangHands(ci, { arms: ['up', 'up'] }, 0) || []); const top = y - 52 * SC + 2 * SC;
          const hs = hand.length >= 2 ? hand.map(([hx, hy]) => [wt.x + (hx - 18) * SC, top + hy * SC]) : [[wt.x - 12, top + 4], [wt.x + 12, top + 4]];
          hs.forEach(([hx, hy], j) => capsule(g, hx, hy - 4, j ? 0.4 : -0.4, t, 0.8, 1.3));
          if (t > 5.9) cash.forEach(c => { const a = t - 5.9 - c.d * 0.5; if (a < 0) return; bill(g, c.x / 120 * W + Math.sin(a * c.w + c.r) * 5, -8 + a * a * 70 * c.v + a * 20, Math.sin(a * c.w + c.r) * 0.8); });
        }
        pt.draw(g, t);
        if (t > 2.3 && t < 2.5) { g.globalAlpha = (t - 2.3) / 0.2; R(g, 0, 0, W, Hh, '#e8fbff'); g.globalAlpha = 1; }
        if (back && t < 5.75) { g.globalAlpha = 1 - (t - 5.6) / 0.15; R(g, 0, 0, W, Hh, '#e8fbff'); g.globalAlpha = 1; }
        return;
      }
      // ---- 海底：從上面游下來，撈起沙地上的兩顆發光膠囊，再往上游 ----
      const k = t - 2.5, sy = sea(g, W, Hh, t);
      const p0 = [-W * 0.1, Hh * 0.18], p1 = [W * 0.1, sy - 14], sw = ease(clamp(k / 1.55));
      let x = p0[0] + (p1[0] - p0[0]) * sw, y = p0[1] + (p1[1] - p0[1]) * sw + Math.sin(k * 2.2) * 3;
      const grab = k > 1.6, rise = ein(clamp((k - 2.2) / 0.9)); x += rise * 6; y -= rise * Hh * 0.8;
      const rot = grab ? -0.25 - rise * 0.9 : Math.PI / 2 + 0.25 - sw * 0.25;
      spr(g, CH(ci, { arms: grab ? ['up', 'up'] : ['up', 'up'], legs: Math.floor(k * 4) % 2 ? 'a' : 'b', eyes: 'open', mouth: grab ? 'grin' : 'smile' }, Math.floor(k * 4), op), x, y, { scale: SC * 0.9, rot });
      if (Math.floor(k * 3) % 4 === 0) ring(g, x + 20, y - 40 - (k * 30) % 20, 1, '#e8fbff');
      const pp = [[W * 0.6, sy - 3], [W * 0.72, sy - 5]];
      if (!grab) pp.forEach(([px, py], j) => capsule(g, px, py + Math.sin(t * 2 + j), j ? 0.5 : -0.2, t, 0.95, 1.5));
      else { const hx = x + Math.sin(rot) * 50, hy = y - Math.cos(rot) * 50; capsule(g, hx - 4, hy, -0.3, t, 0.9, 1.5); capsule(g, hx + 5, hy + 5, 0.4, t, 0.9, 1.5); if (k < 2.2) { g.globalAlpha = 1 - (k - 1.6) / 0.6; for (let a = 0; a < 6.28; a += 0.7) line(g, hx, hy, hx + Math.cos(a + k) * 16, hy + Math.sin(a + k) * 16, '#fff8c0'); g.globalAlpha = 1; } }
      if (k < 0.3) { g.globalAlpha = 1 - k / 0.3; R(g, 0, 0, W, Hh, '#e8fbff'); g.globalAlpha = 1; }
      if (k > 2.8) { g.globalAlpha = clamp((k - 2.8) / 0.3); R(g, 0, 0, W, Hh, '#e8fbff'); g.globalAlpha = 1; }
    }, snd);
  };

  // ---------- 共用小物件 ----------
  function heart(g, x, y, c, k) { const q = k || 1; [[1, 0, 2], [4, 0, 2], [0, 1, 7], [0, 2, 7], [1, 3, 5], [2, 4, 3], [3, 5, 1]].forEach(([a, b2, w]) => R(g, x + (a - 3) * q, y + (b2 - 3) * q, w * q, q, c)); R(g, x - 2 * q, y - 2 * q, q, q, 'rgba(255,255,255,.8)'); }
  function star(g, x, y, r, c) { line(g, x - r, y, x + r, y, c); line(g, x, y - r, x, y + r, c); const d = Math.round(r * 0.5); line(g, x - d, y - d, x + d, y + d, c); line(g, x - d, y + d, x + d, y - d, c); R(g, x - 1, y - 1, 3, 3, '#ffffff'); }
  function smoke(g, list, t, col) { list.forEach(p => { const a = t - p.t; if (a < 0 || a > p.life) return; const r = p.r0 + a * p.gr, k = 1 - a / p.life, x = p.x + p.vx * a * 20 + Math.sin(a * 3 + p.r0) * 2, y = p.y + p.vy * a * 20, c = col || p.c || '#8a8690', al = k * (p.a || 0.6); g.globalAlpha = al * 0.25; disc(g, x, y, r, c); g.globalAlpha = al * 0.3; disc(g, x - r * 0.15, y - r * 0.15, r * 0.7, c); g.globalAlpha = al * 0.25; disc(g, x - r * 0.3, y - r * 0.3, r * 0.35, '#ffffff'); }); g.globalAlpha = 1; }
  const puffs = (n, x, y, t0, o) => Array.from({ length: n }, () => Object.assign({ x: x + rnd(-6, 6), y: y + rnd(-4, 4), vx: rnd(-1, 1), vy: rnd(-1.4, -0.2), t: t0 + rnd(0, 0.3), r0: rnd(2, 4), gr: rnd(6, 12), life: rnd(1, 1.8) }, o || {}));
  // 夜晚的幫派街區（磚造公寓、天際線、路燈、塗鴉、柏油路）；回傳地面線
  function street(g, W, Hh, t, o) {
    o = o || {}; const gy = Math.round(Hh * (o.gy || 0.6));
    bands(g, 0, 0, W, gy, o.sky || ['#0a0818', '#120e26', '#1c1434', '#2a1a40', '#3a2048', '#4a2848']);
    for (let k = 0; k < 30; k++) R(g, (k * 97) % W, (k * 53) % Math.round(gy * 0.45), 1, 1, k % 4 ? '#8a80b0' : '#ffffff');
    if (!o.noMoon) { disc(g, W * 0.78, gy * 0.16, 7, '#f4ecd0'); disc(g, W * 0.78 + 2, gy * 0.16 - 1, 2, '#d8d0b4'); glow(g, W * 0.78, gy * 0.16, 16, '244,236,208', 0.25); }
    const sk = P.gSkyline(1); g.globalAlpha = 0.9; g.drawImage(sk, 0, gy - 64, sk.width, sk.height); g.drawImage(sk, sk.width - 4, gy - 60, sk.width, sk.height); g.globalAlpha = 1;
    [[-6, 2], [W - 44, 5]].forEach(([x, sd]) => { const tb = P.gTenement(sd + (o.seed || 0) * 3, ''); g.drawImage(tb, Math.round(x), gy - tb.height + 2); });
    if (o.wall !== false) { const wl = P.gWall(o.wallSeed == null ? 4 : o.wallSeed); g.drawImage(wl, Math.round(W * 0.28), gy - wl.height + 1); }
    R(g, 0, gy, W, 6, '#4a4652'); R(g, 0, gy, W, 1, '#6a6672'); for (let x = 0; x < W; x += 12) R(g, x, gy + 1, 1, 5, '#3a3642');
    R(g, 0, gy + 6, W, Hh - gy - 6, '#24222a'); for (let x = 0; x < W; x += 16) R(g, x + 2, gy + 30, 9, 2, '#c8a83a'); for (let k = 0; k < 70; k++) R(g, (k * 61) % W, gy + 8 + (k * 37) % (Hh - gy - 8), 1, 1, k % 2 ? '#34303a' : '#1a181e');
    R(g, 0, gy + 6, W, 2, '#1a181e'); // 路邊陰影
    for (let k = 0; k < 6; k++) R(g, 8 + k * 10, gy + 54, 6, 22, '#d8d4dc'); // 斑馬線
    oval(g, W * 0.72, gy + 64, 9, 3, '#3a3640'); oval(g, W * 0.72, gy + 64, 7, 2, '#2a2830'); for (let k = -1; k <= 1; k++) R(g, W * 0.72 + k * 4 - 1, gy + 63, 2, 1, '#4a4652'); // 人孔蓋
    oval(g, W * 0.3, gy + 90, 16, 3, '#2e2a3a'); g.globalAlpha = 0.6; R(g, W * 0.3 - 8, gy + 89, 4, 1, '#ff3ab0'); R(g, W * 0.3 + 3, gy + 90, 5, 1, '#3af0ff'); g.globalAlpha = 1; // 水窪倒影
    if (o.lamp !== false) { const lx = Math.round(W * (o.lampX || 0.86)), on = Math.sin(t * 17) > 0.97 ? 0.3 : 1, lp = P.gLamp(on > 0.5); g.drawImage(lp, lx - 2, gy - lp.height + 3); g.globalAlpha = 0.14 * on; for (let y = gy - lp.height + 8; y < gy + 30; y++) { const w = (y - (gy - lp.height + 8)) * 0.5; R(g, lx + 6 - w, y, w * 2, 1, '#ffc870'); } g.globalAlpha = 1; }
    return gy;
  }

  // ======================= 幸運彩蛋 2：老大的賞識（親吻戒指）=======================
  // 昏暗的書房：百葉窗的斜光、絨布窗簾、桌燈；老大的臉藏在陰影裡，只有伸出來那隻戴金戒指的手被照亮
  function office(g, W, Hh, t) {
    const dy = Math.round(Hh * 0.68);
    R(g, 0, 0, W, Hh, '#1a0e0c'); for (let x = 0; x < W; x += 6) R(g, x, 0, 3, dy, '#21120f'); // 深色木牆板
    // 百葉窗（窗戶在牆的右上），斜斜的光條打在牆上
    const wx = W * 0.5, wy = dy - 112, ww = 46, wh = 52; R(g, wx - 2, wy - 2, ww + 4, wh + 4, '#3a2416'); for (let y = 0; y < wh; y += 4) { R(g, wx, wy + y, ww, 2, '#e8a850'); R(g, wx, wy + y + 2, ww, 2, '#4a2a14'); }
    g.globalAlpha = 0.16; for (let k = 0; k < 9; k++) for (let y = 0; y < 3; y++) line(g, wx - 4 - k * 2, wy + wh + 4 + k * 8 + y, wx - 40 - k * 4, wy + wh + 40 + k * 8 + y, '#ffc070'); g.globalAlpha = 1;
    // 絨布窗簾
    [[0, 1], [W - 16, -1]].forEach(([x, d]) => { for (let i = 0; i < 16; i++) R(g, x + i, 0, 1, dy + 6, (i + (d > 0 ? 0 : 1)) % 4 < 2 ? '#7a1018' : '#5a0a12'); R(g, d > 0 ? x + 15 : x, 0, 1, dy + 6, '#3a0408'); for (let i = 0; i < 16; i += 3) R(g, x + i, dy + 4, 2, 2, '#c8a040'); });
    // 牆上的畫框（看不清的風景）
    const fy0 = dy - 104; R(g, 20, fy0, 26, 20, '#8a6a2a'); R(g, 22, fy0 + 2, 22, 16, '#2a3a2a'); R(g, 22, fy0 + 12, 22, 6, '#3a4a2a'); disc(g, 36, fy0 + 7, 2, '#c8b070');
    R(g, 0, 0, W, Math.max(0, dy - 128), '#140a08'); R(g, 0, dy - 128, W, 2, '#3a2010'); // 天花板線
    // 地毯
    R(g, 0, dy, W, Hh - dy, '#2a0a0e'); for (let y = dy + 4; y < Hh; y += 8) for (let x = (y / 8 % 2) * 6; x < W; x += 12) R(g, x, y, 4, 2, '#3a1218');
    return dy;
  }
  function don(g, cx, dy, t, reach, tgt) { // 老大：寬肩、灰背頭，臉一半在陰影裡（桌燈從右邊打光）；回傳手的位置
    const sh = dy - 34, hc = '#2a2628';
    // 高背皮椅
    R(g, cx - 24, sh - 34, 48, 40, '#3a0a10'); R(g, cx - 24, sh - 34, 48, 2, '#5a1a20'); for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) R(g, cx - 18 + k * 12, sh - 28 + j * 10, 2, 2, '#5a1a20');
    // 西裝身體＋白襯衫 V 領＋紅玫瑰
    for (let y = 0; y < 34; y++) { const w = Math.min(26, 16 + y * 1.2); R(g, cx - w, sh + y, w * 2, 1, '#121016'); }
    R(g, cx - 4, sh, 8, 12, '#d8d0c4'); for (let y = 0; y < 10; y++) R(g, cx - 4 + Math.floor(y / 2.5), sh + y, 1, 1, '#121016'), R(g, cx + 3 - Math.floor(y / 2.5), sh + y, 1, 1, '#121016'); R(g, cx - 1, sh + 2, 2, 10, '#4a0a12');
    disc(g, cx - 14, sh + 8, 2, '#c8202a'); R(g, cx - 15, sh + 7, 1, 1, '#ff5a5a'); R(g, cx - 13, sh + 11, 1, 2, '#2a6a2a');
    // 頭：陰影中的臉，只有髮緣和顴骨有一點光
    oval(g, cx, sh - 12, 9, 11, '#c89a78'); for (let y = -11; y <= 11; y++) { const w = Math.round(9 * Math.sqrt(Math.max(0, 1 - y * y / 121))); R(g, cx - w, sh - 12 + y, w + (y > 4 ? 2 : 0), 1, '#3a2620'); } // 左半邊在陰影裡
    R(g, cx + 6, sh - 14, 3, 8, '#a87a5a'); R(g, cx + 1, sh - 4, 6, 2, '#a87a5a');
    R(g, cx - 9, sh - 23, 18, 6, hc); R(g, cx - 8, sh - 24, 16, 2, '#4a4648'); R(g, cx - 5, sh - 23, 12, 1, '#8a8488'); R(g, cx + 7, sh - 18, 2, 7, '#8a8488'); R(g, cx - 9, sh - 18, 2, 6, '#3a3436'); // 灰背頭、灰鬢角
    R(g, cx - 6, sh - 14, 4, 1, '#1a0e0a'); R(g, cx + 2, sh - 14, 4, 1, '#3a2018'); R(g, cx + 3, sh - 13, 2, 1, '#1a0e0a'); R(g, cx + 4, sh - 13, 1, 1, '#ffc070'); R(g, cx - 5, sh - 13, 1, 1, '#5a3a20'); // 眉骨很深的眼睛
    R(g, cx + 1, sh - 12, 2, 5, '#8a6448'); R(g, cx - 3, sh - 5, 7, 1, '#4a2a20'); R(g, cx - 2, sh - 3, 5, 1, '#5a3a2a'); // 鼻子、緊閉的嘴
    // 手：從身體伸出，靠近時被桌燈照亮
    const rx = cx - 18, ry = dy - 6, hx = Math.round(rx + ((tgt ? tgt[0] : rx - 22) - rx) * reach), hy = Math.round(ry + ((tgt ? tgt[1] : ry - 4) - ry) * reach); for (let k = 0; k < 10; k++) { const u = k / 9; R(g, cx - 18 + (hx - cx + 18) * u - 2, dy - 12 + (hy - dy + 12) * u - 2, 5, 5, '#121016'); }
    R(g, hx - 1, hy - 2, 3, 6, '#d8d0c4'); R(g, hx - 6, hy - 2, 6, 5, '#b88a6a'); R(g, hx - 6, hy - 2, 6, 1, '#d8a888'); R(g, hx - 8, hy, 3, 2, '#b88a6a'); R(g, hx - 6, hy + 2, 5, 1, '#8a5a40');
    R(g, hx - 5, hy - 1, 3, 2, '#ffd23a'); R(g, hx - 4, hy - 2, 1, 1, '#ff3a5a'); return [hx - 4, hy - 1];
  }
  function cat(g, x, y, t) { // 灰色虎斑貓（坐著，尾巴慢慢甩）
    oval(g, x, y - 5, 6, 5, '#7a7680'); oval(g, x + 1, y - 12, 4, 4, '#8a8690'); R(g, x - 3, y - 17, 2, 3, '#8a8690'); R(g, x + 3, y - 17, 2, 3, '#8a8690'); R(g, x - 2, y - 16, 1, 1, '#d89a9a'); R(g, x + 4, y - 16, 1, 1, '#d89a9a');
    R(g, x - 1, y - 13, 1, 1, '#c8e05a'); R(g, x + 2, y - 13, 1, 1, '#c8e05a'); R(g, x, y - 11, 1, 1, '#e8a0a0'); for (let k = 0; k < 3; k++) R(g, x - 4 + k * 2, y - 8 + (k % 2), 1, 3, '#5a5662');
    const a = Math.sin(t * 2) * 0.5; for (let k = 0; k < 9; k++) R(g, x + 6 + k, y - 2 - Math.round(Math.sin(k * 0.4 + a) * (k * 0.5)), 2, 2, k % 3 ? '#7a7680' : '#5a5662');
  }
  function briefcase(g, x, y, open, t) { // 皮革手提箱：open 0~1 打開，裡面整排鈔票
    if (open > 0) { R(g, x - 14, y - 12, 28, 12, '#2a1a10'); for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { R(g, x - 13 + k * 4.5, y - 11 + r * 5, 4, 4, '#4aa85a'); R(g, x - 13 + k * 4.5, y - 9 + r * 5, 4, 1, '#f0e8c8'); R(g, x - 13 + k * 4.5, y - 11 + r * 5, 4, 1, '#8ae09a'); }
      const lh = Math.round(14 * open); R(g, x - 14, y - 12 - lh, 28, lh, '#6a3a1a'); R(g, x - 13, y - 12 - lh + 1, 26, lh - 2, '#5a3016'); if (open > 0.6) glow(g, x, y - 10, 16, '255,230,140', (open - 0.6) * 1.6); }
    R(g, x - 14, y - 2, 28, 12, '#7a4420'); R(g, x - 14, y - 2, 28, 2, '#9a5a2a'); R(g, x - 14, y + 8, 28, 2, '#4a2810'); R(g, x - 10, y - 1, 2, 3, '#e8c040'); R(g, x + 8, y - 1, 2, 3, '#e8c040');
    if (open <= 0) { R(g, x - 4, y - 6, 8, 2, '#4a2810'); R(g, x - 4, y - 5, 1, 4, '#4a2810'); R(g, x + 3, y - 5, 1, 4, '#4a2810'); }
  }
  function keyCard(g, x, y, t) { glow(g, x, y, 12, '255,220,120', 0.5 + Math.sin(t * 8) * 0.2); R(g, x - 7, y - 10, 14, 20, '#f4ecd4'); R(g, x - 7, y - 10, 14, 1, '#ffd23a'); R(g, x - 7, y + 9, 14, 1, '#c8a020'); R(g, x - 7, y - 10, 1, 20, '#ffd23a'); R(g, x + 6, y - 10, 1, 20, '#c8a020');
    ring(g, x, y - 4, 2.5, '#c8a020'); R(g, x, y - 1, 1, 8, '#c8a020'); R(g, x + 1, y + 3, 2, 1, '#c8a020'); R(g, x + 1, y + 5, 2, 1, '#c8a020'); }
  GA.ring = function (SFX, e) {
    const ui = this, s = e && e.seat >= 0 ? e.seat : 0, ci = seatChar(ui.v, s), op = seatOpt(ui, s), T = 6800, pt = parts(), SC = 1.35;
    const cash = Array.from({ length: 36 }, () => ({ x: rnd(0, 1), v: rnd(0.8, 1.3), d: rnd(0, 0.7), r: rnd(0, 6), w: rnd(2, 5) }));
    const snd = () => { const K = kit(SFX); if (!K) return;
      // 原創的小調曼陀林圓舞曲（3/4 拍）：快速撥弦的顫音＋低音
      const mel = [440, 523.3, 659.3, 587.3, 523.3, 493.9, 523.3, 440, 329.6, 349.2, 392, 440, 493.9, 523.3, 493.9, 440], st = 0.36;
      mel.forEach((f, i) => { for (let k = 0; k < 6; k++) SFX.tone(f, 0.07, { type: 'triangle', vol: 0.03 + (k === 0 ? 0.02 : 0), lp: 2600, delay: 0.2 + i * st + k * 0.058, wet: 0.35 }); });
      const bass = [110, 164.8, 164.8, 110, 164.8, 164.8, 98, 146.8, 146.8, 82.4, 123.5, 123.5, 110, 164.8, 164.8, 110];
      bass.forEach((f, i) => SFX.tone(f, 0.3, { type: i % 3 ? 'triangle' : 'sine', vol: i % 3 ? 0.04 : 0.08, delay: 0.2 + i * st, wet: 0.2 }));
      K.drone(0, 6.5, [55, 82.4], { lp: 220, vol: 0.04 });
      K.chime(1.9, 1760, 0.05); K.chime(1.95, 2349, 0.04); SFX.tone(900, 0.06, { vol: 0.03, delay: 2.75 }); // 戒指閃光、親吻
      SFX.noise(0.4, { f: 600, vol: 0.06, delay: 3.2 }); SFX.tone(2200, 0.03, { type: 'square', vol: 0.05, delay: 3.85 }); SFX.tone(2200, 0.03, { type: 'square', vol: 0.05, delay: 3.95 }); // 推箱子、扣環
      K.shimmer(4.1, 1.6, 1600, 0.035); [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => SFX.tone(f, 1.2, { type: 'sine', vol: 0.04, delay: 4.1 + i * 0.08, wet: 0.6 })); for (let i = 0; i < 14; i++) SFX.noise(0.05, { f: 3200, type: 'bandpass', vol: 0.035, delay: 4.6 + i * 0.08 }); };
    return pix(ui, T, (g, W, Hh, t) => {
      const dy = office(g, W, Hh, t), cx = Math.round(W * 0.68), reach = ease(clamp((t - 1.3) / 0.6)) * (1 - ease(clamp((t - 3.1) / 0.4)));
      const walk = clamp((t - 0.1) / 1.1), px = -12 + walk * 44, bow = Math.sin(clamp((t - 2.2) / 0.9) * Math.PI);
      const hand = don(g, cx, dy, t, reach, [px + 24, dy - 16]);
      // 桌子＋桌燈
      R(g, 4, dy - 6, W - 8, 4, '#4a2412'); R(g, 4, dy - 6, W - 8, 1, '#6a3a1e'); R(g, 8, dy - 2, W - 16, 34, '#3a1a0c'); for (let k = 0; k < 3; k++) { R(g, 14 + k * ((W - 28) / 3), dy + 4, (W - 28) / 3 - 4, 22, '#321608'); R(g, 14 + k * ((W - 28) / 3), dy + 4, (W - 28) / 3 - 4, 1, '#4a2412'); }
      const lx = W - 20; R(g, lx - 5, dy - 8, 10, 2, '#a8823a'); R(g, lx - 1, dy - 22, 2, 14, '#a8823a'); R(g, lx - 8, dy - 28, 16, 6, '#1a5a3a'); R(g, lx - 8, dy - 28, 16, 1, '#2a7a4a'); g.globalAlpha = 0.18; for (let y = dy - 22; y < dy - 6; y++) { const w = (y - dy + 22) * 1.2 + 6; R(g, lx - w, y, w * 2, 1, '#ffe0a0'); } g.globalAlpha = 1;
      cat(g, cx + 18, dy - 6, t);
      // 手提箱推過桌面
      const push = ease(clamp((t - 3.2) / 0.6)), open = ease(clamp((t - 3.95) / 0.45)), bx = cx - 4 - push * 40;
      if (t > 3.1) briefcase(g, bx, dy - 16, open, t);
      // 玩家：走進來 → 靠近 → 鞠躬親吻戒指 → 起身 → 開心跳
      const joy = t > 4.3;
      const pose = t < 1.2 ? { legs: Math.floor(t * 8) % 2 ? 'a' : 'b' } : joy ? { arms: ['up', 'up'], mouth: 'grin', legs: Math.floor(t * 6) % 2 ? 'jump' : 'stand', dy: Math.floor(t * 6) % 2 ? -2 : 0 } : bow > 0.2 ? { eyes: 'blink', mouth: 'o' } : { eyes: 'open' };
      spr(g, CH(ci, pose, Math.floor(t * 4), op), px + bow * 3, dy + 30, { scale: SC, rot: bow * 0.24 });
      if (reach > 0.8 && t < 2.4) { const k2 = (t * 3) % 1; star(g, hand[0], hand[1], 2 + Math.round(k2 * 3), '#fff4b0'); }
      if (t > 2.7 && t < 3.6) { const a = (t - 2.7) / 0.9; heart(g, hand[0] - 4, hand[1] - 6 - a * 14, '#ff3a6a', 1); }
      if (open > 0.5) { for (let k = 0; k < 8; k++) { g.globalAlpha = 0.2; line(g, bx, dy - 20, bx + Math.cos(-1.57 + (k - 3.5) * 0.25) * 60, dy - 20 + Math.sin(-1.57 + (k - 3.5) * 0.25) * 60, '#ffe8a0'); } g.globalAlpha = 1; }
      if (t > 4.4) { const a = clamp((t - 4.4) / 1.0); keyCard(g, bx, dy - 26 - ease(a) * 40, t); }
      if (t > 4.6) cash.forEach(c => { const a = t - 4.6 - c.d * 0.5; if (a < 0) return; bill(g, c.x * W + Math.sin(a * c.w + c.r) * 5, -8 + a * a * 60 * c.v + a * 18, Math.sin(a * c.w + c.r) * 0.8); });
      pt.draw(g, t);
    }, snd);
  };

  // ======================= 幸運彩蛋 3：蘑菇森林 =======================
  // 街區開始融化往下滴 → 變成彩虹迷幻森林，巨大的蘑菇跟著節拍跳舞 → 天上睜開一隻眼睛，瞳孔裡的骰子轉個不停（看見未來：下次擲骰自己選）
  const hsl = (h, s2, l) => { h = ((h % 1) + 1) % 1; const a = s2 * Math.min(l, 1 - l), f = n => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0) * 255 | 0, f(8) * 255 | 0, f(4) * 255 | 0]; };
  function bigShroom(g0, x0, y0, h, cap, t, ph, face) { // 會跳舞的大蘑菇（擠壓伸展）：x,y＝根部；量化成 8 個影格、描外框後快取
    const bq = Math.round(Math.sin(t * 2 * Math.PI * (128 / 60) / 2 + ph) * 4) / 4, cw0 = Math.round(h * 0.6) + 6, hh0 = Math.round(h * 1.2) + 6;
    const img = mkspr('sh' + h + cap[0] + bq + (face ? 1 : 0), cw0 * 2, hh0, (g) => { const x = cw0, y = hh0 - 2; const b = bq, sy = 1 + b * 0.12, sx = 1 - b * 0.08, H = h * sy, sw = Math.round(h * 0.18 * sx), cw = Math.round(h * 0.5 * sx), ch = Math.round(h * 0.34 * sy), top = y - H;
    for (let i = 0; i < H * 0.7; i++) { const w = sw + Math.round(Math.sin(i / (H * 0.7) * Math.PI) * 1.5), ox = x - w + Math.round(b * 2 * i / H); R(g, ox, y - i, w * 2, 1, '#f0e6cc'); R(g, ox + w * 2 - 3, y - i, 3, 1, '#d8cbaa'); R(g, ox + 1, y - i, 1, 1, '#fffaf0'); if (i < 3) R(g, ox, y - i, w * 2, 1, '#c8b890'); }
    const capY = top + ch, cx = x + Math.round(b * 2);
    for (let yy = -ch; yy <= 2; yy++) { const w = Math.round(cw * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ch * ch)))); R(g, cx - w, capY + yy, w * 2 + 1, 1, yy > -2 ? cap[2] : yy < -ch * 0.6 ? cap[1] : cap[0]); }
    for (let k = 0; k < 6; k++) { const a = -2.6 + k * 0.42, dx = Math.cos(a) * cw * 0.65, dyy = Math.sin(a) * ch * 0.7; disc(g, cx + dx, capY + dyy, Math.max(1, cw * 0.1), '#fff8f0'); }
    R(g, cx - cw + 2, capY + 2, cw * 2 - 4, 2, 'rgba(0,0,0,.25)');
    if (face) { const fy = capY + Math.round(H * 0.18); R(g, cx - 4, fy, 2, 3, '#2a1a20'); R(g, cx + 3, fy, 2, 3, '#2a1a20'); R(g, cx - 4, fy, 1, 1, '#ffffff'); R(g, cx + 3, fy, 1, 1, '#ffffff'); R(g, cx - 3, fy + 5, 7, 1, '#2a1a20'); R(g, cx - 4, fy + 4, 1, 1, '#2a1a20'); R(g, cx + 4, fy + 4, 1, 1, '#2a1a20'); R(g, cx - 6, fy + 3, 2, 1, '#ff8aa0'); R(g, cx + 5, fy + 3, 2, 1, '#ff8aa0'); }
    }); g0.drawImage(img, Math.round(x0 - cw0), Math.round(y0 - hh0 + 2));
  }
  function dieFace(g, x, y, n, sz) { R(g, x - sz, y - sz, sz * 2 + 1, sz * 2 + 1, '#f8f4ec'); R(g, x - sz, y + sz, sz * 2 + 1, 1, '#c8c0b8'); const p = Math.max(1, Math.round(sz / 3)), o = Math.round(sz * 0.55), dots = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[n];
    dots.forEach(([a, b2]) => R(g, x + a * o - (p >> 1), y + b2 * o - (p >> 1), p, p, n === 1 ? '#e0283a' : '#1a1418')); }
  GA.shroom = function (SFX, e) {
    const ui = this, s = e && e.seat >= 0 ? e.seat : 0, ci = seatChar(ui.v, s), op = seatOpt(ui, s), T = 7000, SC = 1.3;
    let off = null, og = null, bg = null, bgg = null, img = null;
    const spores = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), v: rnd(0.03, 0.09), p: rnd(0, 6), h: Math.random() }));
    const SH = [[0.1, 0.9, 62, ['#ff3a6a', '#ff7a9a', '#c8204a'], 0], [0.9, 0.92, 70, ['#3ab0ff', '#7ad0ff', '#2a7ac8'], 1.6], [0.3, 0.97, 40, ['#ffb03a', '#ffd07a', '#c8801a'], 3.1], [0.7, 0.97, 46, ['#7a3aff', '#a87aff', '#5020c8'], 4.4]];
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.sweep(0.5, 1.4, 4000, 200, { vol: 0.1 }); [440, 415, 392, 370, 349, 330].forEach((f, i) => SFX.tone(f, 0.5, { type: 'sine', glide: f * 0.7, vol: 0.04, delay: 0.5 + i * 0.18, wet: 0.7 }));
      const b = 60 / 128; for (let i = 0; i < 20; i++) { const st = 1.6 + i * b; K.drum(st, 50, 0.45, 0.25); [1, 2, 3].forEach(k => SFX.tone(55 * (i % 8 < 4 ? 1 : 1.189), b / 4 * 0.85, { type: 'sawtooth', vol: 0.05, lp: 500, wet: false, delay: st + k * b / 4 })); K.cymbal(st + b / 2, 0.04, 0.03); }
      const acid = [220, 330, 262, 392, 349, 262, 440, 392]; for (let i = 0; i < 64; i++) { const f = acid[i % 8] * (i % 16 < 8 ? 1 : 1.122); SFX.tone(f, b / 4 * 0.9, { type: 'square', vol: 0.022, lp: 900 + (i % 16) * 180, wet: 0.35, delay: 1.6 + i * b / 4 }); }
      K.pad(1.6, 5.2, [261.6, 329.6, 392, 493.9], 0.035, 2200); K.shimmer(1.8, 4.5, 1700, 0.02);
      K.choir(4.4, 2.2, [523.3, 659.3, 784], { v: 'ah', vol: 0.05, a: 0.4 }); for (let i = 0; i < 12; i++) SFX.tone(800 + i * 60, 0.05, { type: 'square', vol: 0.02, lp: 3000, delay: 4.7 + i * 0.07 }); K.chime(5.6, 1046.5, 0.06); K.chime(5.65, 1568, 0.05); };
    return pix(ui, T, (g, W, Hh, t) => {
      if (!off || off.height !== Hh) { [off, og] = P.canvas(W, Hh); [bg, bgg] = P.canvas(W, Hh); img = bgg.createImageData(W, Hh); }
      const melt = clamp((t - 0.6) / 1.2), forest = clamp((t - 1.3) / 0.6);
      if (forest < 1) { // 街區＋角色先畫到暫存畫布，再一條一條往下滴
        og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, W, Hh); og.imageSmoothingEnabled = false; const gy = street(og, W, Hh, t, { lampX: 0.88, wall: false });
        spr(og, CH(ci, { eyes: melt > 0.2 ? 'wide' : 'open', mouth: melt > 0.2 ? 'o' : 'smile' }, 0, op), W / 2, gy + 30, { scale: SC });
        for (let x = 0; x < W; x++) { const d = melt * melt * (20 + 40 * (0.5 + 0.5 * Math.sin(x * 0.37 + Math.sin(x * 0.11) * 3))) ; g.drawImage(off, x, 0, 1, Hh, x, Math.round(d), 1, Hh); if (d > 0) { g.globalAlpha = 0.6; g.drawImage(off, x, 0, 1, 1, x, 0, 1, Math.round(d)); g.globalAlpha = 1; } }
        if (melt > 0) { g.globalAlpha = melt * 0.35; const [r, gg2, bb] = hsl(t * 0.6, 0.9, 0.5); R(g, 0, 0, W, Hh, `rgb(${r},${gg2},${bb})`); g.globalAlpha = 1; }
      }
      if (forest > 0) {
        g.globalAlpha = forest;
        // 迷幻背景：彩虹螺旋（逐像素）
        const d = img.data, cx = W / 2, cy = Hh * 0.32; for (let y = 0; y < Hh; y += 2) for (let x = 0; x < W; x += 2) { const dx = x - cx, dyy = y - cy, a = Math.atan2(dyy, dx), r = Math.sqrt(dx * dx + dyy * dyy); const [rr, gg, bb] = hsl(a / 6.283 * 2 + r * 0.018 - t * 0.35, 0.85, 0.42 + 0.12 * Math.sin(r * 0.15 - t * 4)); for (let k = 0; k < 4; k++) { const i = ((y + (k >> 1)) * W + x + (k & 1)) * 4; d[i] = rr; d[i + 1] = gg; d[i + 2] = bb; d[i + 3] = 255; } }
        bgg.putImageData(img, 0, 0); g.drawImage(bg, 0, 0);
        // 遠方的蘑菇剪影
        for (let k = 0; k < 8; k++) { const x = (k * 19 + 6) % W, hh = 20 + (k * 7) % 16, b2 = Math.sin(t * 6.7 + k) * 2; R(g, x - 1, Hh * 0.62 - hh + b2, 3, hh, 'rgba(30,10,40,.55)'); oval(g, x, Hh * 0.62 - hh + b2, 7, 4, 'rgba(30,10,40,.55)'); }
        R(g, 0, Hh * 0.62, W, Hh, '#1a0a2a'); for (let x = 0; x < W; x += 3) { const [r, gg, bb] = hsl(x / W + t * 0.3, 0.9, 0.35); R(g, x, Hh * 0.62 - 2 - Math.round(Math.abs(Math.sin(x * 0.3 + t * 3)) * 3), 3, 6, `rgb(${r},${gg},${bb})`); }
        // 天上的眼睛：看見未來（瞳孔裡的骰子一直轉，最後停住）
        const eo = ease(clamp((t - 4.3) / 0.6)); if (eo > 0) { const ex = W / 2, ey = Hh * 0.2, ew = 34, eh = Math.round(14 * eo);
          for (let yy = -eh; yy <= eh; yy++) { const w = Math.round(ew * Math.sqrt(Math.max(0, 1 - (yy * yy) / Math.max(1, eh * eh)))); R(g, ex - w, ey + yy, w * 2 + 1, 1, '#f8f0ff'); }
          if (eh > 4) { for (let r = 11; r >= 6; r--) { const [rr, gg, bb] = hsl(r / 6 + t, 0.9, 0.55); disc(g, ex, ey, Math.min(r, eh), `rgb(${rr},${gg},${bb})`); } disc(g, ex, ey, Math.min(6, eh - 1), '#0a0410'); const n = t < 5.5 ? 1 + Math.floor(t * 14) % 6 : 6; dieFace(g, ex, ey, n, 4); }
          for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; line(g, ex + Math.cos(a) * (ew + 2), ey + Math.sin(a) * (eh + 2), ex + Math.cos(a) * (ew + 6 + Math.sin(t * 6 + k) * 2), ey + Math.sin(a) * (eh + 6 + Math.sin(t * 6 + k) * 2), '#fff0a0'); } }
        SH.forEach(([x, y, h, cap, ph]) => bigShroom(g, x * W, y * Hh * 0.98 + 4, h, cap, t, ph, true));
        // 玩家飄在中間，眼睛發光、顏色一直變
        const [r, gg, bb] = hsl(t * 0.5, 0.9, 0.6); spr(g, CH(ci, { arms: ['up', 'up'], eyes: 'glow', mouth: 'grin', legs: 'jump' }, Math.floor(t * 4), op), W / 2, Hh * 0.66 + Math.sin(t * 2.5) * 5, { scale: SC, tint: `rgb(${r},${gg},${bb})`, tintA: 0.25 });
        spores.forEach(sp => { const x = ((sp.x + Math.sin(t + sp.p) * 0.05 + 1) % 1) * W, y = ((sp.y - t * sp.v + 10) % 1) * Hh; const [r2, g2, b2] = hsl(sp.h + t, 1, 0.75); R(g, x, y, 1, 1, `rgb(${r2},${g2},${b2})`); });
        g.globalAlpha = 1;
      }
      if (t > 5.6 && t < 5.9) { g.globalAlpha = Math.sin((t - 5.6) / 0.3 * Math.PI) * 0.7; R(g, 0, 0, W, Hh, '#ffffff'); g.globalAlpha = 1; }
    }, snd);
  };

  // ======================= 厄運彩蛋 1：床上的馬頭（致敬《教父》）=======================
  function horseHead(g, x, y) { // 側躺在床上的棕色馬頭（臉朝左），x,y＝脖子切口中心；約 46×30
    const C = { b: '#7a4422', l: '#9a5a2e', d: '#5a3018', m: '#2a1a12', w: '#efe6d6', n: '#3a2014' };
    const rows = [ // 每一列：[y, x0, x1]（相對切口）——頭頂到下顎的輪廓，左邊是口鼻
      [-14, -8, 0], [-13, -12, 1], [-12, -16, 2], [-11, -20, 2], [-10, -24, 3], [-9, -28, 3], [-8, -32, 3], [-7, -35, 3], [-6, -37, 3], [-5, -39, 3], [-4, -40, 3], [-3, -41, 3], [-2, -42, 3], [-1, -42, 3],
      [0, -42, 3], [1, -42, 3], [2, -41, 3], [3, -40, 2], [4, -38, 2], [5, -35, 1], [6, -30, 0], [7, -24, -2], [8, -18, -4], [9, -12, -6]];
    rows.forEach(([yy, x0, x1]) => R(g, x + x0, y + yy, x1 - x0, 1, C.b));
    rows.slice(0, 8).forEach(([yy, x0, x1]) => R(g, x + x0 + 2, y + yy, Math.max(0, x1 - x0 - 6), 1, C.l)); // 額頭亮面
    oval(g, x - 10, y - 2, 8, 6, C.l); oval(g, x - 10, y - 1, 6, 4, C.b); R(g, x - 14, y + 3, 10, 1, C.d); // 臉頰肌肉
    for (let i = 0; i < 26; i++) R(g, x - 36 + i, y - 8 - Math.round(i * 0.2), 1, 1, C.w), i < 18 && R(g, x - 38 + i, y - 7 - Math.round(i * 0.2), 1, 1, C.w); // 白色鼻樑紋
    oval(g, x - 39, y - 1, 3, 3, C.d); R(g, x - 41, y - 1, 2, 2, C.n); R(g, x - 40, y - 2, 1, 1, '#1a0a06'); // 鼻孔
    R(g, x - 40, y + 3, 10, 1, C.n); R(g, x - 32, y + 4, 4, 1, C.d); // 嘴
    R(g, x - 19, y - 6, 6, 1, C.m); R(g, x - 18, y - 5, 4, 1, '#120804'); [[-19, -7], [-17, -7], [-15, -7]].forEach(([a2, b2]) => R(g, x + a2, y + b2, 1, 1, C.m)); R(g, x - 20, y - 4, 7, 1, C.d); // 閉上的眼睛＋睫毛
    R(g, x - 5, y - 20, 3, 7, C.b); R(g, x - 4, y - 19, 1, 5, C.d); R(g, x - 1, y - 18, 3, 6, C.d); // 耳朵
    for (let i = 0; i < 12; i++) R(g, x - 10 + i, y - 16 + Math.round(i * 0.15) - (i % 3 === 0 ? 1 : 0), 1, 5 + (i % 2), C.m); for (let i = 0; i < 5; i++) R(g, x - 14 - i, y - 14 + i, 1, 4, C.m); // 鬃毛＋額毛
    oval(g, x + 3, y - 3, 3, 12, '#8a0a14'); oval(g, x + 3, y - 3, 2, 10, '#c82030'); R(g, x + 3, y - 8, 1, 3, '#f0d0c0'); R(g, x + 2, y + 1, 2, 2, '#e8a0a0'); // 切口
  }
  GA.horse = function (SFX, e) {
    const ui = this, s = e && e.seat >= 0 ? e.seat : 0, ci = seatChar(ui.v, s), op = seatOpt(ui, s), T = 6800, SC = 1.3;
    const blood = Array.from({ length: 10 }, (_, k) => ({ x: rnd(-30, 20), d: rnd(0, 1), v: rnd(10, 22) }));
    const snd = () => { const K = kit(SFX); if (!K) return;
      for (let i = 0; i < 6; i++) { const st = 0.1 + i * 0.27 + rnd(0, 0.1), f = rnd(2600, 3600); SFX.tone(f, 0.08, { glide: f * 1.3, vol: 0.02, delay: st }); SFX.tone(f * 1.1, 0.06, { glide: f * 0.9, vol: 0.015, delay: st + 0.1 }); } // 早晨的鳥叫
      for (let i = 0; i < 14; i++) SFX.tone(i % 2 ? 2100 : 2500, 0.04, { type: 'square', vol: 0.03, lp: 4000, delay: 1.0 + i * 0.045, wet: 0.2 }); // 鬧鐘
      SFX.tone(260, 0.5, { type: 'sawtooth', glide: 200, vol: 0.02, lp: 700, delay: 1.7 }); // 打哈欠
      SFX.noise(0.5, { f: 1200, type: 'bandpass', vol: 0.06, delay: 2.55 }); // 掀被子
      K.stinger(2.95, 0.22); K.scream(3.05, 1.6, 520, 0.12); K.heart(3.1, 9, 120, 0.35); K.drone(2.95, 3.6, [41.2, 43.7, 61.7], { lp: 300, vol: 0.1, a: 0.1 }); K.choir(3.2, 3.2, [110, 116.5, 164.8], { v: 'oo', vol: 0.06, bend: 0.94 }); K.boom(2.95, 70, 25, 2, 0.6); };
    return pix(ui, T, (g, W, Hh, t) => {
      const zoom = ease(clamp((t - 3.0) / 2.6)) * 0.55, fx = W * 0.66, fy = Hh * 0.7, sh = t > 2.95 && t < 3.6 ? 2 : t > 3.6 && t < 4.6 ? 1 : 0;
      g.save(); g.translate(fx, fy); g.scale(1 + zoom, 1 + zoom); g.translate(-fx, -fy); shk(g, sh);
      // 臥室：深綠色花紋壁紙、窗戶的晨光、床頭櫃上的鬧鐘
      R(g, 0, 0, W, Hh, '#1e3a2a'); for (let y = 0; y < Hh; y += 10) for (let x = (y / 10 % 2) * 6; x < W; x += 12) { R(g, x + 2, y + 2, 2, 4, '#2a4a36'); R(g, x + 1, y + 3, 4, 2, '#2a4a36'); }
      const wy0 = Math.round(Hh * 0.3); R(g, W * 0.56, wy0, 40, 50, '#d8c8a0'); R(g, W * 0.56 + 2, wy0 + 2, 36, 46, '#fff0c8'); R(g, W * 0.56 + 19, wy0 + 2, 2, 46, '#d8c8a0'); R(g, W * 0.56 + 2, wy0 + 24, 36, 2, '#d8c8a0');
      g.globalAlpha = 0.15; for (let y = wy0 + 50; y < Hh * 0.82; y++) { const w = (y - wy0 - 50) * 0.3 + 18; R(g, W * 0.56 + 20 - w - (y - wy0 - 50) * 0.5, y, w * 2, 1, '#fff4d0'); } g.globalAlpha = 1;
      const fl = Math.round(Hh * 0.8); R(g, 0, fl, W, Hh - fl, '#3a2414'); for (let x = 0; x < W; x += 14) R(g, x, fl, 1, Hh - fl, '#2a180c');
      // 床頭櫃＋鬧鐘
      R(g, 2, fl - 26, 22, 26, '#4a2a16'); R(g, 2, fl - 26, 22, 2, '#6a3a1e'); R(g, 4, fl - 18, 18, 1, '#2a1608');
      const ring2 = t > 1.0 && t < 1.65, ax = 13 + (ring2 ? (Math.floor(t * 40) % 2 ? 1 : -1) : 0); disc(g, ax, fl - 34, 6, '#c8202a'); disc(g, ax, fl - 34, 4, '#f4f0e8'); R(g, ax, fl - 37, 1, 3, '#1a1418'); R(g, ax, fl - 34, 3, 1, '#1a1418'); disc(g, ax - 5, fl - 40, 2, '#e8c040'); disc(g, ax + 5, fl - 40, 2, '#e8c040'); R(g, ax - 4, fl - 28, 2, 2, '#1a1418'); R(g, ax + 3, fl - 28, 2, 2, '#1a1418');
      if (ring2) { [[ax - 9, fl - 44], [ax + 9, fl - 44]].forEach(([x, y]) => { line(g, x, y, x + (x < ax ? -3 : 3), y - 3, '#fff0a0'); line(g, x, y + 3, x + (x < ax ? -4 : 4), y + 3, '#fff0a0'); }); }
      // 床：床頭板、枕頭、緞面床單
      const bx0 = 26, bx1 = W - 4, by = fl - 14; R(g, bx0, by - 46, 8, 46 + 14, '#3a1a0c'); R(g, bx0, by - 46, 8, 2, '#5a2e16'); R(g, bx0 + 2, by - 40, 4, 30, '#2a1208');
      R(g, bx0 + 6, by - 8, bx1 - bx0 - 6, 22, '#5a2e16'); R(g, bx0 + 6, by + 12, bx1 - bx0 - 6, 2, '#3a1a0c');
      R(g, bx0 + 6, by - 12, bx1 - bx0 - 6, 6, '#f4ecdc'); // 床墊
      oval(g, bx0 + 20, by - 15, 12, 5, '#fffaf0'); oval(g, bx0 + 20, by - 14, 11, 3, '#e8e0d0');
      // 角色：睡覺（躺著）→ 鬧鐘響 → 坐起來 → 掀被子 → 尖叫
      const sit = ease(clamp((t - 1.7) / 0.6)), scream = t > 2.95;
      const pose = t < 1.65 ? { eyes: 'blink', mouth: 'flat' } : !scream ? { eyes: 'open', mouth: t < 2.3 ? 'o' : 'flat', arms: ['down', 'down'] } : { eyes: 'wide', mouth: 'o', arms: ['up', 'up'], dy: Math.floor(t * 24) % 2 };
      const stand = ease(clamp((t - 2.95) / 0.25)); // 躺著（頭在枕頭上）→ 坐起來（下半身在被子裡）→ 尖叫時跳起來站在床上
      if (sit <= 0) spr(g, CH(ci, pose, 0, op), bx0 + 22 + 52 * SC - 6, by - 14, { scale: SC, rot: -Math.PI / 2 });
      else { const sx2 = bx0 + 26 + sit * 2; spr(g, CH(ci, pose, 0, op), sx2, by - 10 + (1 - sit) * 8 + (1 - stand) * 24 - stand * 2, { scale: SC, rot: -Math.PI / 2 * (1 - sit) - (scream ? 0.08 : 0), clipY: stand > 0.5 ? null : by - 18 });
        if (stand < 0.5) { const lw = bx0 + 46 - (sx2 - 16); R(g, sx2 - 16, by - 21, lw, 15, '#e8e0f0'); R(g, sx2 - 16, by - 21, lw, 2, '#ffffff'); R(g, sx2 - 6, by - 19, 1, 12, '#c8c0d8'); R(g, sx2 + 6, by - 19, 1, 12, '#c8c0d8'); R(g, sx2 - 16, by - 8, lw, 2, '#b8b0c8'); } } // 坐起來時腿還在被子裡
      // 被子（掀開之前蓋著腳和馬頭）＋馬頭
      const pull = ease(clamp((t - 2.45) / 0.45)), hx = W - 16, hy = by - 16;
      if (pull > 0.2) { const st = clamp((t - 2.6) / 1.4); oval(g, hx - 16, by - 10, 12 + st * 24, 3 + st * 3, '#7a0a14'); oval(g, hx - 18, by - 10, 8 + st * 18, 2 + st * 2, '#a01020'); g.drawImage(mkspr('horse', 52, 34, (g2) => horseHead(g2, 46, 22)), hx - 46, hy - 22);
        blood.forEach(b2 => { const a = t - 3.2 - b2.d; if (a < 0) return; R(g, hx + b2.x, by - 6 + Math.min(18, a * b2.v), 1, Math.min(6, 2 + a * 4), '#8a0a14'); }); }
      const qx = bx0 + 46 + pull * (bx1 - bx0 - 42), qw = Math.max(4, bx1 - qx); // 被子往右掀
      R(g, qx, by - 20, qw, 14, '#e8e0f0'); R(g, qx, by - 20, qw, 2, '#ffffff'); for (let x = qx + 4; x < qx + qw; x += 9) R(g, x, by - 18, 1, 11, '#c8c0d8'); R(g, qx, by - 7, qw, 3, '#b8b0c8');
      if (t < 1.65) { const k2 = (t * 0.8) % 1; ring(g, bx0 + 18 + k2 * 6, by - 34 - k2 * 12, 1 + k2 * 3, 'rgba(220,240,255,.8)'); } // 睡覺的泡泡
      g.restore();
      if (t > 2.95 && t < 3.25) { g.globalAlpha = (1 - (t - 2.95) / 0.3) * 0.7; R(g, 0, 0, W, Hh, '#c80010'); g.globalAlpha = 1; }
      if (t > 3.3) { g.globalAlpha = 0.18 + Math.sin(t * 7) * 0.08; R(g, 0, 0, W, Hh, '#5a0008'); g.globalAlpha = 1; }
    }, snd);
  };

  // ======================= 厄運彩蛋 2：披薩上屋頂（致敬《絕命毒師》）=======================
  GA.pizza = function (SFX, e) {
    const ui = this, s = e && e.seat >= 0 ? e.seat : 0, ci = seatChar(ui.v, s), op = seatOpt(ui, s), T = 6200, SC = 1.3, pt = parts();
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.wind(0, 6, 0.03); for (let i = 0; i < 6; i++) SFX.noise(0.05, { f: 900, type: 'bandpass', vol: 0.04, delay: 0.1 + i * 0.18 });
      K.growl(1.3, 0.7, 90, 0.08); SFX.tone(150, 0.3, { type: 'sawtooth', glide: 220, vol: 0.04, lp: 800, delay: 1.9 }); K.whoosh(2.25, 0.45, true, 0.18);
      for (let i = 0; i < 6; i++) SFX.noise(0.05, { f: 1500, type: 'bandpass', vol: 0.03, delay: 2.35 + i * 0.1 }); // 披薩旋轉
      SFX.noise(0.35, { f: 500, vol: 0.18, delay: 3.0 }); S.thud(SFX, 3.0, 1); SFX.tone(120, 0.1, { vol: 0.05, delay: 3.0 });
      SFX.noise(0.3, { f: 300, vol: 0.06, delay: 3.25 }); // 紙盒掉地上
      [233.1, 220, 207.7, 196].forEach((f, i) => SFX.tone(f, i < 3 ? 0.45 : 1.4, { type: 'sawtooth', vol: 0.06, lp: 900, glide: i === 3 ? 185 : undefined, delay: 3.6 + i * 0.5, wet: 0.3, attack: 0.04 })); // 失望的長號
      for (let i = 0; i < 3; i++) SFX.tone(1800, 0.05, { type: 'square', vol: 0.015, lp: 3500, delay: 5.0 + i * 0.25 }); };
    return pix(ui, T, (g, W, Hh, t) => {
      // 白天的沙漠郊區：藍天、遠方紅色平頂山、一層樓的平房、車道
      bands(g, 0, 0, W, Hh * 0.6, ['#3a98e8', '#4aa4ec', '#5ab0f0', '#6ab8f0', '#7ac0f0', '#8ac8f0', '#9ad0f0', '#a8d8f0']);
      [[20, 24, 14], [80, 40, 10]].forEach(([x, y, r], k) => { const cx = ((x + t * 3) % (W + 40)) - 20; oval(g, cx, y, r, r * 0.45, '#ffffff'); oval(g, cx + r * 0.6, y + 2, r * 0.7, r * 0.35, '#f0f4f8'); });
      const hz = Math.round(Hh * 0.6); for (let x = 0; x < W; x++) { const h = x < 30 ? 24 - Math.max(0, x - 24) * 2 : x < 50 ? 8 + Math.abs(Math.sin(x * 0.2)) * 3 : x < 96 ? 30 - (x < 58 ? (58 - x) * 2.6 : 0) : 30 - (x - 96) * 1.5; R(g, x, hz - h, 1, h, x % 40 < 30 ? '#c8704a' : '#b8603a'); R(g, x, hz - h, 1, 1, '#e8946a'); R(g, x, hz - h + 3, 1, 1, '#a8583a'); }
      R(g, 0, hz, W, Hh - hz, '#d8b888'); for (let k = 0; k < 60; k++) R(g, (k * 41) % W, hz + (k * 23) % (Hh - hz), 1, 1, k % 2 ? '#c8a878' : '#e8c898');
      // 房子
      const hx0 = 14, hx1 = W - 10, wallT = hz - 4, wallB = hz + 46, roofT = wallT - 18;
      for (let y = 0; y < 18; y++) R(g, hx0 + 12 - y * 0.9, roofT + y, hx1 - hx0 - 24 + y * 1.8, 1, y % 3 ? '#7a5a4a' : '#6a4a3a'); R(g, hx0 - 6, wallT, hx1 - hx0 + 12, 2, '#5a3a2a');
      R(g, hx0, wallT + 2, hx1 - hx0, wallB - wallT - 2, '#e8d8b8'); for (let k = 0; k < 40; k++) R(g, hx0 + (k * 29) % (hx1 - hx0), wallT + 4 + (k * 17) % (wallB - wallT - 6), 1, 1, '#d8c8a8');
      R(g, hx0 + 8, wallT + 10, 34, wallB - wallT - 10, '#f4ece0'); for (let y = wallT + 14; y < wallB; y += 6) R(g, hx0 + 8, y, 34, 1, '#d8d0c0'); // 車庫門
      R(g, hx1 - 40, wallT + 12, 18, 14, '#5a8ab0'); R(g, hx1 - 40, wallT + 12, 18, 2, '#8ab8d8'); R(g, hx1 - 32, wallT + 12, 1, 14, '#e8d8b8'); R(g, hx1 - 41, wallT + 11, 20, 1, '#a89878');
      R(g, hx1 - 16, wallT + 16, 10, wallB - wallT - 16, '#6a3a20'); R(g, hx1 - 8, wallT + 30, 1, 2, '#e8c040');
      R(g, hx0 + 4, wallB, 42, Hh - wallB, '#c8c0b0'); R(g, hx0 + 4, wallB, 42, 1, '#a8a090'); for (let y = wallB + 14; y < Hh; y += 16) R(g, hx0 + 4, y, 42, 1, '#b0a898'); // 車道
      R(g, 0, wallB, hx0 + 4, Hh - wallB, '#c8a878'); for (let k = 0; k < 4; k++) disc(g, 4 + k * 3, wallB + 30 + (k % 2) * 4, 2, '#9a8a7a');
      [[W - 10, wallB + 18]].forEach(([x, y]) => { R(g, x - 2, y - 14, 4, 14, '#4a8a3a'); R(g, x - 6, y - 10, 4, 2, '#4a8a3a'); R(g, x - 6, y - 14, 2, 4, '#4a8a3a'); R(g, x + 2, y - 8, 4, 2, '#4a8a3a'); R(g, x + 4, y - 12, 2, 4, '#4a8a3a'); });
      // 角色＋披薩
      const walk = clamp((t - 0.1) / 1.1), px = -12 + walk * 46, py = wallB + 34, angry = t > 1.2 && t < 2.3, wind = clamp((t - 1.9) / 0.35), thr = t > 2.25;
      const pose = t < 1.2 ? { legs: Math.floor(t * 8) % 2 ? 'a' : 'b', arms: ['fwd', 'fwd'] } : angry ? { arms: ['fwd', 'fwd'], eyes: 'wide', mouth: 'flat', dy: Math.floor(t * 20) % 2 } : thr && t < 3.4 ? { arms: ['up', 'up'], mouth: 'o', eyes: 'wide' } : { eyes: 'blink', mouth: 'sad', dy: t > 3.4 ? 2 : 0 };
      spr(g, CH(ci, pose, Math.floor(t * 4), op), px, py, { scale: SC, rot: (t > 3.4 ? 0.12 : 0) - wind * 0.35 * (thr ? 0 : 1), tint: angry ? '#ff2a1a' : null, tintA: 0.25 + Math.sin(t * 20) * 0.1 });
      if (angry) [[px - 8, py - 72], [px + 10, py - 74]].forEach(([x, y], k) => smoke(g, [{ x, y, vx: 0, vy: -1, t: 1.2 + k * 0.2, r0: 1, gr: 3, life: 0.6, a: 0.8 }, { x, y, vx: 0, vy: -1, t: 1.6 + k * 0.2, r0: 1, gr: 3, life: 0.6, a: 0.8 }], t, '#f0f0f0'));
      const boxY = py - 38; if (!thr) { R(g, px - 12, boxY, 24, 6, '#f4f0e8'); R(g, px - 12, boxY, 24, 1, '#ffffff'); R(g, px - 12, boxY + 5, 24, 1, '#c8c0b0'); R(g, px - 5, boxY + 2, 10, 2, '#c8202a'); R(g, px - 2, boxY + 1, 4, 1, '#2a8a3a'); }
      // 披薩飛出去（邊轉邊飛），落在屋頂上啪一聲攤平
      const fly = clamp((t - 2.25) / 0.75), land = t >= 3.0, tx = W * 0.55, ty = roofT + 6;
      if (thr && !land) { const x = px + (tx - px) * fly, y = boxY - 10 + (ty - boxY + 10) * fly - Math.sin(fly * Math.PI) * 40, rx = Math.max(1, Math.abs(Math.cos(t * 18)) * 9); oval(g, x, y, rx, 9, '#c88a3a'); oval(g, x, y, Math.max(1, rx - 1), 8, '#f4c84a'); if (rx > 4) { [[-3, -3], [3, 1], [-1, 4], [4, -4]].forEach(([a, b2]) => disc(g, x + a * rx / 9, y + b2, 1.5, '#c8302a')); } }
      if (thr) { const bf = clamp((t - 2.3) / 0.9), bx2 = px + 6 + bf * 14, byy = boxY + bf * bf * (py - boxY - 2); R(g, bx2 - 9, byy, 18, 3, '#f4f0e8'); R(g, bx2 - 9, byy - 6 * (1 - bf), 18, 2, '#e8e0d0'); }
      if (land) { if (!pt.s) { pt.s = 1; pt.burst(18, tx, ty, 1.4, t, ['#f4c84a', '#c8302a', '#c88a3a'], { gr: 100 }); } oval(g, tx, ty + 2, 14, 4, '#c88a3a'); oval(g, tx, ty + 2, 12, 3, '#f4c84a'); [[-6, 1], [4, 2], [-1, 3], [8, 1]].forEach(([a, b2]) => R(g, tx + a, ty + b2, 2, 1, '#c8302a'));
        [[-9, 0], [-3, 1], [5, 0], [10, 1]].forEach(([a], k) => { const L = Math.min(8, (t - 3.0) * (6 + k * 2)); R(g, tx + a, ty + 4, 1, L, '#f4c84a'); R(g, tx + a, ty + 4 + L, 1, 1, '#e8b830'); }); // 起司往下滴
        if (t > 4.4) { const bx3 = tx + 10, k2 = clamp((t - 4.4) / 0.4), by3 = ty - 20 + k2 * 18; R(g, bx3 - 3, by3 - 3, 6, 4, '#1a1a22'); R(g, bx3 + 2, by3 - 2, 3, 1, '#e8a020'); R(g, bx3 - 5, by3 - 2, 2, 2, '#1a1a22'); R(g, bx3 - 1, by3 + 1, 1, 2, '#e8a020'); R(g, bx3 + 1, by3 - 2, 1, 1, '#ffffff'); if (k2 >= 1 && Math.floor(t * 6) % 2) R(g, bx3 + 4, by3, 2, 1, '#1a1a22'); } } // 烏鴉飛來啄
      pt.draw(g, t);
    }, snd);
  };

  // ======================= 厄運彩蛋 3：跟我的小朋友打招呼（致敬《疤面煞星》）=======================
  // 豪宅主人（原創）：白色雙排扣西裝、深酒紅襯衫、金項鍊、黑背頭、金框飛行員墨鏡；腰間扛著一把下面掛榴彈筒的大槍
  function lordBody() { return mkspr('lord', 34, 60, (g2, r) => {
    r(10, 50, 6, 7, '#e8e4dc'); r(18, 50, 6, 7, '#d0ccc4'); r(13, 50, 1, 7, '#c8c4bc'); r(21, 50, 1, 7, '#b8b4ac'); r(9, 56, 8, 3, '#1a1418'); r(17, 56, 8, 3, '#1a1418'); r(10, 56, 3, 1, '#4a4450'); r(18, 56, 3, 1, '#4a4450'); // 褲管＋皮鞋
    for (let y = 0; y < 26; y++) { const w = y < 4 ? 11 + y : y < 18 ? 14 - Math.floor((y - 4) / 5) : 12; r(17 - w, 25 + y, w * 2, 1, '#f2eee6'); r(17 + w - 4, 25 + y, 4, 1, '#d6d2c8'); } // 西裝外套（寬肩、收腰）
    r(13, 25, 8, 13, '#5a1020'); r(14, 25, 6, 2, '#7a2030'); r(16, 27, 2, 1, '#c8906a'); // 深酒紅襯衫敞開
    for (let y = 0; y < 13; y++) { r(12 - (y < 6 ? 0 : 1), 25 + y, 2, 1, '#ffffff'); r(20 + (y < 6 ? 0 : 1), 25 + y, 2, 1, '#c8c4bc'); } // 寬翻領
    r(15, 29, 1, 1, '#ffd23a'); r(16, 30, 2, 1, '#e8b020'); r(18, 29, 1, 1, '#ffd23a'); r(16, 31, 2, 2, '#ffd23a'); r(16, 31, 1, 1, '#fff4a0'); // 金項鍊＋墜子
    r(20, 40, 2, 4, '#1a1418'); r(22, 41, 2, 3, '#1a1418'); r(13, 40, 2, 4, '#1a1418'); r(11, 41, 2, 3, '#1a1418'); // 雙排扣
    r(23, 30, 4, 2, '#c8202a'); r(24, 29, 2, 1, '#ff5a5a'); // 口袋巾
    r(5, 30, 6, 4, '#f2eee6'); r(23, 30, 0, 0, '#000'); // 左肩
    // 頭：寬下巴、鬍渣、濃眉、金框墨鏡、往後梳的黑髮
    r(11, 9, 12, 15, '#c8906a'); r(19, 9, 4, 15, '#a87050'); r(12, 19, 10, 5, '#b07c58'); for (let k = 0; k < 10; k++) r(12 + k, 20 + (k % 3), 1, 1, '#8a5a40'); r(14, 24, 6, 2, '#a87050'); // 臉、鬍渣、脖子
    r(10, 13, 2, 4, '#b07c58'); r(23, 13, 2, 4, '#8a5a40'); // 耳朵
    r(10, 3, 14, 7, '#141018'); r(9, 5, 2, 8, '#141018'); r(23, 5, 2, 6, '#141018'); r(12, 3, 9, 1, '#4a4458'); r(13, 4, 6, 1, '#2a2430'); r(16, 2, 4, 1, '#141018'); // 背頭（有光澤）
    r(11, 11, 12, 1, '#2a1a12'); // 濃眉
    r(11, 12, 5, 4, '#2a1a30'); r(17, 12, 5, 4, '#2a1a30'); r(16, 12, 1, 1, '#d8a030'); r(11, 12, 5, 1, '#d8a030'); r(17, 12, 5, 1, '#d8a030'); r(12, 13, 2, 1, '#8a6ab0'); r(18, 13, 2, 1, '#8a6ab0'); r(11, 15, 5, 1, '#5a3a6a'); r(17, 15, 5, 1, '#5a3a6a'); // 墨鏡
    r(16, 16, 2, 3, '#a87050'); r(14, 21, 6, 1, '#5a2a20'); r(13, 21, 1, 1, '#7a4a30'); // 鼻子、往下撇的嘴
  }); }
  function lordGun(flash) { return mkspr('lgun' + (flash ? 1 : 0), 48, 14, (g2, r) => { // 槍口朝右；(8,7) 是握把位置
    r(0, 4, 9, 5, '#6a3a1e'); r(0, 4, 9, 1, '#8a5a2e'); r(0, 8, 9, 1, '#4a2410'); // 木槍托
    r(9, 3, 14, 6, '#2a2a30'); r(9, 3, 14, 1, '#5a5a66'); r(12, 1, 6, 2, '#3a3a44'); r(14, 0, 2, 1, '#5a5a66'); // 機匣、提把、照門
    r(14, 9, 3, 5, '#2a2a30'); r(15, 9, 1, 5, '#4a4a54'); // 彈匣
    r(23, 4, 10, 4, '#3a3a44'); r(23, 4, 10, 1, '#6a6a76'); for (let k = 0; k < 4; k++) r(24 + k * 2, 5, 1, 2, '#1a1a20'); // 護木
    r(33, 5, 9, 2, '#1a1a20'); r(40, 3, 1, 2, '#3a3a44'); // 槍管、準星
    r(22, 8, 13, 4, '#4a5a3a'); r(22, 8, 13, 1, '#6a7a5a'); r(34, 8, 2, 4, '#2a3a1a'); r(20, 9, 2, 2, '#2a2a30'); // 下掛榴彈筒
    if (flash) { r(42, 2, 6, 8, '#ffb030'); r(43, 4, 5, 4, '#fff4a0'); r(41, 5, 7, 2, '#ffffff'); }
  }); }
  function lord(g, x, y, aim, flash, t) { // x,y＝腳底；aim 0（槍口朝下）～1（瞄準左下方）
    put(g, lordBody(), x, y);
    g.save(); g.translate(Math.round(x - 2), Math.round(y - 22)); g.scale(-1, 1); g.rotate(0.55 - aim * 0.25); g.drawImage(lordGun(flash), -8, -7); g.restore();
    // 握槍的手（白袖子＋手）
    R(g, x - 10, y - 26, 5, 6, '#f2eee6'); R(g, x - 10, y - 20, 4, 3, '#c8906a'); R(g, x + 4, y - 24, 5, 6, '#d6d2c8'); R(g, x + 3, y - 19, 4, 3, '#a87050');
  }
  GA.friend = function (SFX, e) {
    const ui = this, s = e && e.seat >= 0 ? e.seat : 0, ci = seatChar(ui.v, s), op = seatOpt(ui, s), T = 6800, SC = 1.25, pt = parts(); let sm = [], deb = [];
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.drone(0, 6.5, [55, 58.3], { lp: 400, vol: 0.05 }); SFX.tone(220, 2, { type: 'sawtooth', vol: 0.015, lp: 700, delay: 0.1, attack: 0.5 });
      for (let i = 0; i < 6; i++) SFX.tone(1800, 0.03, { type: 'triangle', vol: 0.03, delay: 0.2 + i * 0.22 }); // 躡手躡腳
      S.thud(SFX, 1.4, 1.5); SFX.noise(0.5, { f: 700, vol: 0.12, delay: 1.4 }); K.stinger(1.45, 0.12); // 門被踹開
      SFX.tone(2400, 0.03, { type: 'square', vol: 0.06, delay: 2.05 }); SFX.tone(1600, 0.05, { type: 'square', vol: 0.05, delay: 2.15 }); // 上膛
      SFX.tone(140, 0.25, { glide: 60, vol: 0.2, delay: 2.5 }); SFX.noise(0.12, { f: 900, vol: 0.12, delay: 2.5 }); // 咚（發射）
      K.boom(2.75, 80, 22, 2.2, 0.8); SFX.noise(1.6, { f: 700, vol: 0.25, delay: 2.75, attack: 0.005 }); K.crack(2.8, 0.6, 0.15); K.whoosh(2.85, 0.5, false, 0.18);
      for (let i = 0; i < 16; i++) S.gun(SFX, 4.0 + i * 0.09, 0.45); for (let i = 0; i < 10; i++) SFX.tone(3000, 0.04, { type: 'triangle', vol: 0.015, delay: 4.2 + i * 0.12 }); // 連發＋彈殼
      S.glass(SFX, 4.5); };
    return pix(ui, T, (g, W, Hh, t) => {
      const sh = t > 2.75 && t < 3.4 ? 3 : t > 4.0 && t < 5.5 ? 1 : 0; g.save(); shk(g, sh);
      // 邁阿密豪宅大廳：深青色牆、粉紅霓虹燈條、白柱、雙樓梯、二樓雙開門、水晶燈、黑白大理石地板
      R(g, 0, 0, W, Hh, '#0e2a30'); for (let x = 0; x < W; x += 10) R(g, x, 0, 1, Hh, '#123238');
      const fl = Math.round(Hh * 0.74), land = Math.round(Hh * 0.36);
      R(g, 0, 18, W, 2, '#ff3ab0'); R(g, 0, 20, W, 1, 'rgba(255,58,176,.4)'); R(g, 0, land + 30, W, 1, '#3af0ff');
      // 二樓平台＋門
      R(g, 0, land, W, 6, '#e8e4dc'); R(g, 0, land + 6, W, 2, '#a8a49c'); for (let x = 2; x < W; x += 6) R(g, x, land - 10, 2, 10, '#d8d4cc'); R(g, 0, land - 12, W, 2, '#e8e4dc');
      const op2 = ease(clamp((t - 1.4) / 0.25)), dx = W / 2; R(g, dx - 18, land - 46, 36, 46, '#2a1a10');
      if (op2 > 0) { R(g, dx - 16, land - 44, 32, 44, '#ffe8c0'); g.globalAlpha = 0.25; for (let y = land; y < fl; y++) { const w = 16 + (y - land) * 0.6; R(g, dx - w, y, w * 2, 1, '#ffe8c0'); } g.globalAlpha = 1; }
      R(g, dx - 16, land - 44, 16 * (1 - op2) + 1, 44, '#6a3a1e'); R(g, dx + 16 - 16 * (1 - op2) - 1, land - 44, 16 * (1 - op2) + 1, 44, '#6a3a1e'); R(g, dx - 2, land - 24, 1, 3, '#e8c040'); R(g, dx + 1, land - 24, 1, 3, '#e8c040');
      // 雙樓梯
      for (let k = 0; k < 14; k++) { const y = land + 6 + k * ((fl - land - 6) / 14); R(g, 4 + k * 2, y, 22, 3, '#e8e4dc'); R(g, W - 26 - k * 2, y, 22, 3, '#e8e4dc'); R(g, 4 + k * 2, y + 2, 22, 1, '#a8a49c'); R(g, W - 26 - k * 2, y + 2, 22, 1, '#a8a49c'); }
      // 白柱
      [W * 0.3, W * 0.7].forEach(x => { R(g, x - 4, land + 8, 8, fl - land - 8, '#f0ece4'); R(g, x + 2, land + 8, 2, fl - land - 8, '#c8c4bc'); R(g, x - 6, land + 8, 12, 3, '#ffffff'); R(g, x - 6, fl - 3, 12, 3, '#d8d4cc'); });
      // 水晶燈
      R(g, dx - 1, 20, 2, 10, '#c8a040'); for (let k = -3; k <= 3; k++) { R(g, dx + k * 4, 30 + Math.abs(k), 2, 5, '#f8f0c8'); R(g, dx + k * 4, 35 + Math.abs(k), 1, 2, '#ffffff'); } glow(g, dx, 34, 14, '255,240,200', 0.3);
      // 大理石地板
      for (let y = fl; y < Hh; y += 7) for (let x = 0; x < W; x += 7) R(g, x, y, 7, 7, ((x / 7 + y / 7) | 0) % 2 ? '#f0ece4' : '#1a1a20'); R(g, 0, fl, W, 1, '#ff3ab0');
      // 花瓶（後面會被打碎）
      if (t < 4.5) { R(g, W * 0.82 - 3, fl - 12, 6, 12, '#3a8ab0'); R(g, W * 0.82 - 2, fl - 14, 4, 2, '#3a8ab0'); R(g, W * 0.82 - 4, fl - 20, 2, 6, '#3aa04a'); R(g, W * 0.82 + 2, fl - 22, 2, 8, '#3aa04a'); disc(g, W * 0.82 - 3, fl - 21, 2, '#ff5a8a'); disc(g, W * 0.82 + 3, fl - 23, 2, '#ffd23a'); }
      else if (!pt.v) { pt.v = 1; pt.burst(20, W * 0.82, fl - 8, 1.6, t, ['#3a8ab0', '#ff5a8a', '#3aa04a'], { gr: 140 }); }
      // 主人：門打開後走到平台，舉槍
      const lx = dx, ly = land, aim = ease(clamp((t - 2.0) / 0.4)), fireA = t > 2.45 && t < 2.6, spray = t > 4.0 && t < 5.5 && Math.floor(t * 22) % 2;
      if (op2 > 0.5) lord(g, lx, ly - 1, aim, fireA || spray, t);
      if (spray) { const k3 = Math.floor(t * 22); if (!pt['h' + k3]) { pt['h' + k3] = 1; const ix = rnd(6, W - 6), iy = rnd(fl - 50, fl + 30); pt.burst(6, ix, iy, 0.8, t, iy > fl ? ['#f0ece4', '#8a8690'] : ['#0e2a30', '#5a7a80'], { gr: 80, life: 0.6 }); (pt.holes = pt.holes || []).push([ix, iy]); } }
      (pt.holes || []).forEach(([ix, iy]) => { R(g, ix, iy, 2, 2, '#0a0a0e'); R(g, ix - 1, iy - 1, 1, 1, '#5a5a62'); });
      if (spray && Math.random() < 0.5) pt.add({ x: lx - 6, y: ly - 22, vx: rnd(0.5, 1.5), vy: -1, t, s: 1, c: '#e8c040', gr: 200, life: 1 });
      // 角色躡手躡腳進來 → 被轟飛出畫面
      const sneak = clamp(t / 1.4), px = -10 + sneak * 44, blast = t > 2.75, fly = clamp((t - 2.75) / 0.9);
      if (!blast) spr(g, CH(ci, t < 1.45 ? { arms: ['out', 'out'], legs: Math.floor(t * 5) % 2 ? 'a' : 'b', eyes: 'open', mouth: 'flat' } : { arms: ['up', 'up'], eyes: 'wide', mouth: 'o', dy: Math.floor(t * 20) % 2 }, 0, op), px, fl + 22, { scale: SC });
      else if (fly < 1) spr(g, CH(ci, { arms: ['out', 'out'], eyes: 'x', mouth: 'o' }, 0, op), 34 - fly * 70, fl + 22 - Math.sin(fly * Math.PI) * 50, { scale: SC, rot: -fly * 9, tint: '#2a1a14', tintA: 0.4 });
      // 榴彈：從槍口飛到角色腳邊
      const shot = clamp((t - 2.5) / 0.25); if (t > 2.5 && t < 2.75) { const sx = lx - 34, sy = ly - 14, ex = 40, ey = fl + 16; const x = sx + (ex - sx) * shot, y = sy + (ey - sy) * shot; R(g, x - 1, y - 1, 3, 3, '#3a3a3a'); for (let k = 1; k < 6; k++) R(g, x - (ex - sx) * 0.03 * k, y - (ey - sy) * 0.03 * k, 1, 1, 'rgba(220,220,220,.6)'); }
      // 爆炸
      if (blast) { const a = t - 2.75; if (!sm.length) { sm = puffs(16, 40, fl + 10, 2.75, { gr: 10, life: 2.4, c: '#6a6470' }); deb = Array.from({ length: 22 }, () => ({ vx: rnd(-2.5, 2.5), vy: rnd(-3.5, -1), s: Math.random() < 0.4 ? 2 : 1, c: Math.random() < 0.5 ? '#f0ece4' : '#1a1a20' })); }
        if (a < 0.45) { const r = 6 + a * 70; disc(g, 40, fl + 12, r, '#ff9a2a'); disc(g, 40, fl + 12, r * 0.7, '#ffe060'); disc(g, 40, fl + 12, r * 0.35, '#ffffff'); }
        smoke(g, sm, t); deb.forEach(d => R(g, 40 + d.vx * a * 30, fl + 12 + d.vy * a * 30 + a * a * 90, d.s, d.s, d.c));
        if (a < 0.15) { g.globalAlpha = 0.8 - a * 5; R(g, 0, 0, W, Hh, '#fff0c0'); g.globalAlpha = 1; } }
      pt.draw(g, t); g.restore();
      // 特寫：門口的主人舉起「小朋友」（1.9～2.5 秒），霓虹逆光
      if (t > 1.9 && t < 2.5) { R(g, 0, 0, W, Hh, '#120818'); for (let y = 0; y < Hh; y += 4) R(g, 0, y, W, 1, '#1a0c22'); glow(g, W / 2, Hh * 0.42, 60, '255,58,176', 0.35); R(g, 0, Hh * 0.72, W, 2, '#3af0ff');
        g.save(); g.translate(W / 2, Hh * 0.72); g.scale(2, 2); lord(g, 0, 0, ease(clamp((t - 1.95) / 0.35)), t > 2.4, t); g.restore();
        if (t > 2.4) { g.globalAlpha = 0.5; R(g, 0, 0, W, Hh, '#fff0c0'); g.globalAlpha = 1; } }
    }, snd);
  };

  // ======================= 破產動畫（看「破產者」是誰）=======================
  // 有債主時用破產者自己的死法；沒債主時：人類被地下錢莊拖上黑頭車，藥類被沖進馬桶
  GA.gangDeath = function (SFX, e) {
    const vi = seatChar(this.v, e.seat);
    if (!(e.by >= 0)) return HUMAN.includes(vi) ? GA.collector.call(this, SFX, e) : GA.flush.call(this, SFX, e);
    return [GA.dPill, GA.dStamp, GA.dLeaf, GA.dNose, GA.dSpoon, GA.dFold, GA.dThug, GA.dBoss, GA.dShroom][vi].call(this, SFX, e);
  };

  // ---------- 0 媽的媽啊：在夜店跳到過熱，冒煙、融化成一攤 ----------
  GA.dPill = function (SFX, e) {
    const ui = this, s = e.seat, op = seatOpt(ui, s), T = 7200, pt = parts(); let st = [];
    const crowd = Array.from({ length: 14 }, (_, k) => ({ x: k / 13, h: rnd(0, 6), p: rnd(0, 6), c: k % 3 }));
    const bpm = (t) => 140 + clamp((t - 0.5) / 3.5) * 40, beatT = (t) => { let b = 0, x = 0; while (x < t && b < 999) { x += 60 / bpm(x); b++; } return b; };
    const snd = () => { const K = kit(SFX); if (!K) return; let x = 0.1, i = 0;
      while (x < 4.3) { const b = 60 / bpm(x); K.drum(x, 50, 0.5, 0.25); if (i % 2) K.snare(x, 0.08); K.cymbal(x + b / 2, 0.04, 0.035); SFX.tone(i % 8 < 4 ? 55 : 65.4, b * 0.45, { type: 'sawtooth', vol: 0.06, lp: 500, wet: false, delay: x + b / 2 }); [880, 1046.5, 1318.5, 1046.5][i % 4] && SFX.tone([880, 1046.5, 1318.5, 1046.5][i % 4], b * 0.4, { type: 'square', vol: 0.018, lp: 2600, delay: x + b * 0.25, wet: 0.3 }); x += b; i++; }
      K.sweep(3.0, 1.3, 300, 8000, { rev: true, vol: 0.1 }); K.riser(2.8, 1.5, 200, 1200, 0.03);
      SFX.tone(300, 1.4, { type: 'sawtooth', glide: 40, vol: 0.08, lp: 900, delay: 4.3 }); // 唱片慢下來停住
      K.hiss(4.3, 2.2, 0.12); for (let k = 0; k < 8; k++) SFX.tone(rnd(200, 500), 0.15, { glide: 80, vol: 0.04, delay: 4.6 + k * 0.2 }); K.drone(4.4, 2.6, [41.2, 43.7], { lp: 200, vol: 0.06 }); };
    return pix(ui, T, (g, W, Hh, t) => {
      const fl = Math.round(Hh * 0.72), on = t < 4.3, b = beatT(t), heat = clamp((t - 1.0) / 3.2), melt = clamp((t - 4.3) / 1.4);
      // 夜店：黑牆、雷射、鏡面球、音箱、會亮的舞池地板
      R(g, 0, 0, W, Hh, '#07040c'); for (let x = 0; x < W; x += 8) R(g, x, 0, 1, fl, '#0c0814');
      if (on) for (let k = 0; k < 6; k++) { const a = Math.sin(t * (1.3 + k * 0.2) + k) * 0.9 + (k % 2 ? 0.4 : -0.4), c = ['#ff2a6a', '#2affd8', '#7a3aff', '#ffe03a', '#2a8aff', '#ff6a2a'][k], ox = k % 2 ? W : 0; g.globalAlpha = 0.55; line(g, ox, 6, ox + (k % 2 ? -1 : 1) * Math.cos(a) * 160, 6 + Math.abs(Math.sin(a)) * 160, c); g.globalAlpha = 1; }
      const bx = W / 2; R(g, bx, 0, 1, 14, '#5a5a62'); disc(g, bx, 20, 7, '#9a9aa8'); for (let k = 0; k < 14; k++) R(g, bx - 6 + (k * 5) % 12, 14 + (k * 3) % 12, 2, 2, (k + Math.floor(t * 8)) % 3 ? '#e8e8f8' : '#5a5a6a');
      if (on) for (let k = 0; k < 18; k++) { const a = k * 1.7 + t * 1.2, r = 30 + (k * 13) % 60; R(g, bx + Math.cos(a) * r * 1.4, 22 + Math.abs(Math.sin(a)) * r * 1.3, 1, 1, '#ffffff'); }
      [[0, 1], [W - 22, -1]].forEach(([x]) => { R(g, x, fl - 70, 22, 70, '#141018'); R(g, x + 1, fl - 69, 20, 68, '#1c1822'); const pul = on && b % 2 ? 1 : 0; [fl - 54, fl - 22].forEach(y => { disc(g, x + 11, y, 8 + pul, '#2a2632'); disc(g, x + 11, y, 5 + pul, '#0c0a10'); disc(g, x + 11, y, 2, '#3a3642'); }); R(g, x + 5, fl - 68, 12, 4, '#2a2632'); });
      for (let y = fl; y < Hh; y += 8) for (let x = 0; x < W; x += 10) { const k = (x / 10 + y / 8 + b) % 5, c = ['#ff2a6a', '#2affd8', '#7a3aff', '#ffe03a', '#2a8aff'][k | 0]; R(g, x, y, 10, 8, '#14101c'); R(g, x, y, 10, 1, '#221c2c'); R(g, x, y, 1, 8, '#221c2c'); if (on && (x / 10 + y / 8 + b) % 3 === 0) { g.globalAlpha = 0.85; R(g, x + 1, y + 1, 9, 7, c); g.globalAlpha = 0.5; R(g, x + 2, y + 2, 4, 1, '#ffffff'); g.globalAlpha = 1; } }
      // 媽的媽啊：一拍換一個舞步，越跳越紅、冒汗、冒煙，最後融化
      const cx = W / 2, cy = fl + 26, moves = [{ arms: ['up', 'up'], legs: 'a' }, { arms: ['out', 'out'], legs: 'b' }, { arms: ['up', 'down'], legs: 'jump', dy: -3 }, { arms: ['down', 'up'], legs: 'a' }, { arms: ['fwd', 'fwd'], legs: 'b' }];
      if (melt <= 0) { const m = moves[b % moves.length], wob = t > 3.9 ? Math.sin(t * 30) * 0.15 : 0;
        spr(g, CH(0, Object.assign({ mouth: heat > 0.6 ? 'o' : 'grin', eyes: t > 3.9 ? 'x' : heat > 0.7 ? 'wide' : 'open' }, m), b, op), cx + Math.sin(b * 1.7) * 6, cy, { scale: 1.45, rot: wob + Math.sin(b * 2.3) * 0.08, tint: '#ff2a1a', tintA: heat * 0.55 });
        if (heat > 0.3 && Math.random() < heat * 0.6) pt.add({ x: cx + rnd(-14, 14), y: cy - 60 + rnd(0, 20), vx: rnd(-1.5, 1.5), vy: rnd(-1.5, -0.5), t, s: 1, c: '#bfe8ff', gr: 120, life: 0.7 });
        if (heat > 0.5 && Math.floor(t * 10) % 2 && st.length < 40) st.push(...puffs(1, cx + rnd(-10, 10), cy - 70, t, { c: '#c8c8d0', gr: 6, life: 1.2, a: 0.5 }));
      } else { // 融化：越來越扁、越來越寬，往下滴
        const sy = 1 - melt * 0.86, sx = 1 + melt * 0.7; spr(g, CH(0, { eyes: 'x', mouth: 'o', arms: ['out', 'out'] }, 0, op), cx, cy, { scale: 1.45, sx, sy, tint: '#ff3a6a', tintA: 0.55 });
        const pw = 10 + melt * 22; oval(g, cx, cy, pw, 2 + melt * 4, '#e8407a'); oval(g, cx - 2, cy - 1, pw * 0.6, 1 + melt * 2, '#ff7aa8'); R(g, cx - pw * 0.4, cy - 1, 3, 1, '#ffd0e0');
        for (let k = 0; k < 6; k++) { const L = clamp(melt * 1.4 - k * 0.08) * (6 + k); R(g, cx - pw * 0.8 + k * pw * 0.32, cy + 2, 2, L, '#d02a64'); }
        if (st.length < 60 && Math.floor(t * 8) % 2) st.push(...puffs(1, cx + rnd(-pw, pw), cy - 4, t, { c: '#d8d8e0', gr: 8, life: 1.6, a: 0.45 }));
        if (melt > 0.9) { R(g, cx - 6, cy - 2, 2, 2, '#ffffff'); R(g, cx + 4, cy - 2, 2, 2, '#ffffff'); R(g, cx - 5, cy - 1, 1, 1, '#120c18'); R(g, cx + 5, cy - 1, 1, 1, '#120c18'); } }
      smoke(g, st, t); pt.draw(g, t);
      // 溫度計（不寫字，紅色水銀一路往上衝）
      if (t > 1.0 && t < 4.8) { const tx = W - 30, ty = 34; R(g, tx - 2, ty, 5, 40, '#e8e8f0'); disc(g, tx, ty + 42, 5, '#e8e8f0'); disc(g, tx, ty + 42, 3, '#e0283a'); const hh = Math.round(36 * clamp(heat * 1.15)); R(g, tx - 1, ty + 40 - hh, 3, hh, '#e0283a'); for (let k = 0; k < 6; k++) R(g, tx + 3, ty + 4 + k * 6, 2, 1, '#8a8a96'); if (heat > 0.85 && Math.floor(t * 10) % 2) glow(g, tx, ty + 8, 8, '255,60,40', 0.8); }
      // 前景人群（剪影跟著節拍跳）
      crowd.forEach(c => { const x = c.x * (W + 10) - 5, jump = on && (b + c.c) % 2 ? 2 : 0, y = Hh - 14 - c.h - jump, rim = on ? ['#7a3aff', '#2affd8', '#ff2a6a'][(c.c + b) % 3] : '#2a2234'; disc(g, x, y, 6, rim); disc(g, x, y + 1, 5, '#050308'); R(g, x - 7, y + 4, 14, 22, rim); R(g, x - 6, y + 5, 12, 22, '#050308'); if (on && (b + c.c) % 3 === 0) { R(g, x - 8, y - 11, 3, 12, rim); R(g, x - 7, y - 10, 1, 10, '#050308'); R(g, x + 5, y - 11, 3, 12, rim); R(g, x + 6, y - 10, 1, 10, '#050308'); R(g, x - 9, y - 14, 2, 3, ['#2affd8', '#ff2a6a', '#ffe03a'][c.c]); } });
      if (on && b % 4 === 0) { g.globalAlpha = 0.12; R(g, 0, 0, W, Hh, '#ffffff'); g.globalAlpha = 1; }
    }, snd);
  };

  // ---------- 1 郵差先生：被巨大的舌頭舔一下，貼到信封上蓋郵戳，寄走 ----------
  function tongue(g, x, y, ext) { // 從上面伸下來的大嘴＋舌頭：x＝中心、y＝嘴巴位置、ext＝舌頭伸出長度（0~70）
    const e2 = Math.round(ext / 2) * 2, img = mkspr('tg' + e2, 64, 104, (g2) => { const cx = 32, my = 22;
      oval(g2, cx, my, 30, 14, '#2a0a10'); oval(g2, cx, my - 6, 30, 8, '#c84a5a'); oval(g2, cx, my - 8, 26, 4, '#e86a7a'); R(g2, cx - 12, my - 10, 8, 1, '#ffb0b8'); oval(g2, cx, my + 10, 26, 6, '#b83a4a'); oval(g2, cx, my + 11, 22, 3, '#d05a68');
      R(g2, cx - 18, my - 3, 36, 4, '#f8f4ec'); for (let k = 0; k < 6; k++) R(g2, cx - 17 + k * 6, my - 3, 1, 4, '#d8d0c4'); // 嘴唇＋牙齒
      for (let i = 0; i < e2; i++) { const w = 14 - Math.max(0, i - e2 + 10) * 1.3; if (w <= 0) break; const yy = my + 8 + i; R(g2, cx - w, yy, w * 2, 1, '#e8708a'); R(g2, cx - w, yy, 3, 1, '#c8506a'); R(g2, cx + w - 3, yy, 3, 1, '#d8607a'); R(g2, cx - 1, yy, 2, 1, '#c84a6a'); if (i % 3 === 1) { R(g2, cx - 7 + (i * 5) % 12, yy, 1, 1, '#f490a8'); } }
      if (e2 > 8) { R(g2, cx + 5, my + 12, 3, Math.min(e2 - 6, 30), '#ffc8d4'); R(g2, cx + 6, my + 14, 1, Math.min(e2 - 10, 24), '#ffffff'); } }); // 口水的反光
    g.drawImage(img, Math.round(x - 32), Math.round(y - 22));
  }
  function envelope(g, x, y, k) { // 信封（正面朝上）：x,y＝中心
    const w = Math.round(52 * (k || 1)), h = Math.round(34 * (k || 1)); R(g, x - w / 2, y - h / 2, w, h, '#f0e6cc'); R(g, x - w / 2, y + h / 2 - 2, w, 2, '#d8ccac');
    for (let i = 0; i < w / 2; i++) { const yy = Math.round(i * h / w * 0.9); R(g, x - w / 2 + i, y - h / 2 + yy, 1, 1, '#d0c4a4'); R(g, x + w / 2 - i - 1, y - h / 2 + yy, 1, 1, '#d0c4a4'); }
    for (let k2 = 0; k2 < 3; k2++) R(g, x - w * 0.3, y + 2 + k2 * 4, w * 0.4, 1, '#a89a80'); }
  GA.dStamp = function (SFX, e) {
    const ui = this, s = e.seat, op = seatOpt(ui, s), T = 7000, pt = parts();
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.drone(0, 6.5, [73.4, 110], { lp: 300, vol: 0.04 }); SFX.tone(392, 0.5, { type: 'sine', vol: 0.02, delay: 0.2 });
      SFX.noise(0.9, { f: 600, type: 'bandpass', q: 1.5, vol: 0.12, delay: 1.6, attack: 0.2 }); SFX.tone(180, 0.7, { type: 'sawtooth', glide: 320, vol: 0.03, lp: 700, delay: 1.6 }); // 舔
      SFX.noise(0.3, { f: 800, type: 'bandpass', vol: 0.06, delay: 2.5 }); S.thud(SFX, 3.0, 0.8); // 啪一聲貼上
      S.thud(SFX, 3.85, 1.3); SFX.noise(0.12, { f: 2400, type: 'bandpass', vol: 0.1, delay: 3.85 }); // 郵戳
      K.whoosh(4.6, 0.6, true, 0.15); SFX.tone(220, 0.2, { type: 'square', vol: 0.04, lp: 800, delay: 5.4 }); S.thud(SFX, 5.45, 0.8); // 投進郵筒
      [392, 523.3].forEach((f, i) => SFX.tone(f, 0.5, { type: 'triangle', vol: 0.03, delay: 5.6 + i * 0.25 })); };
    return pix(ui, T, (g, W, Hh, t) => {
      // 木頭書桌（俯角正面）：印泥、鋼筆、郵筒在右邊
      const ty0 = Math.round(Hh * 0.46); R(g, 0, 0, W, ty0, '#2a1e2a'); for (let x = 0; x < W; x += 12) R(g, x, 0, 1, ty0, '#33263a'); R(g, 6, ty0 - 70, 30, 40, '#d8c8a0'); R(g, 8, ty0 - 68, 26, 36, '#3a5a8a'); disc(g, 21, ty0 - 50, 6, '#e8c040'); R(g, 0, ty0 - 4, W, 4, '#1a1220'); // 牆上的海報、桌子後緣
      R(g, 0, ty0, W, Hh - ty0, '#8a5a32'); for (let y = ty0; y < Hh; y += 3) R(g, 0, y, W, 1, (y / 3) % 4 ? '#7e5230' : '#956438'); for (let k = 0; k < 8; k++) R(g, (k * 37) % W, ty0 + (k * 29) % (Hh - ty0), 8, 1, '#6a4428');
      R(g, 8, ty0 + 10, 16, 10, '#2a2a30'); R(g, 9, ty0 + 11, 14, 8, '#14141a'); // 印泥
      for (let i = 0; i < 26; i++) R(g, W - 50 + i, ty0 + 14 + Math.round(i * 0.3), 1, 2, i < 4 ? '#c8a040' : '#1a1a20'); // 鋼筆
      const bx = W - 16; R(g, bx - 14, ty0 - 52, 28, 70, '#c8202a'); R(g, bx - 14, ty0 - 52, 28, 3, '#e84a4a'); R(g, bx - 9, ty0 - 40, 18, 3, '#1a0a0a'); R(g, bx - 14, ty0 + 16, 28, 3, '#8a1018'); oval(g, bx, ty0 - 54, 14, 5, '#d8303a'); // 郵筒
      // 信封
      const ex = W * 0.58, ey = Hh * 0.7, fly = ease(clamp((t - 4.5) / 0.9)); const ex2 = ex + (bx - ex) * fly, ey2 = ey + (ty0 - 40 - ey) * fly - Math.sin(fly * Math.PI) * 30, ek = 1 - fly * 0.6;
      if (t < 5.4) envelope(g, ex2, ey2, ek);
      // 郵差先生：站著 → 被舔 → 飛到信封右上角貼住 → 蓋郵戳 → 跟信封一起寄走
      const lickT = clamp((t - 1.4) / 0.9), stick = clamp((t - 2.5) / 0.5), sx0 = W * 0.26, sy0 = Hh * 0.8;
      const cx = sx0 + (ex + 16 - sx0) * ease(stick), cy = sy0 + (ey - 2 - sy0) * ease(stick) - Math.sin(stick * Math.PI) * 30, sc = 1.35 - ease(stick) * 0.95;
      const wet = t > 1.7, pose = t < 1.5 ? { eyes: Math.floor(t * 2) % 3 ? 'open' : 'blink', mouth: 'smile' } : t < 2.5 ? { eyes: 'wide', mouth: 'o', arms: ['up', 'up'] } : { eyes: 'x', mouth: 'o' };
      const fx = stick >= 1 ? ex2 + 16 * ek : cx, fy2 = stick >= 1 ? ey2 - 2 * ek : cy;
      if (t < 5.4) spr(g, CH(1, pose, 0, op), fx, fy2 + (stick >= 1 ? 12 * ek : 0), { scale: stick >= 1 ? 0.4 * ek / 1 : sc, rot: stick > 0 && stick < 1 ? stick * 6.28 : 0, tint: wet ? '#7ac8ff' : null, tintA: 0.2 });
      if (wet && stick < 1 && Math.random() < 0.5) pt.add({ x: cx + rnd(-10, 10), y: cy - 40 + rnd(0, 30), vx: rnd(-1, 1), vy: rnd(-0.5, 0.5), t, s: 1, c: '#c8e8ff', gr: 140, life: 0.6 });
      // 郵戳：橡皮章壓下來 → 留下圓圈＋波浪線
      const pr = t > 3.5 && t < 4.2 ? Math.sin(clamp((t - 3.5) / 0.7) * Math.PI) : 0, mx = ex + 16, my = ey - 12;
      if (t > 3.85 && t < 5.4) { const kx = ex2 + 16 * ek, ky = ey2 - 12 * ek; ring(g, kx, ky, 7 * ek, '#1a1a22'); ring(g, kx, ky, 5 * ek, '#1a1a22'); for (let r2 = 0; r2 < 3; r2++) for (let i = 0; i < 18 * ek; i++) R(g, kx - 26 * ek + i, ky - 3 * ek + r2 * 3 * ek + Math.round(Math.sin(i * 0.7) * 1.2), 1, 1, '#1a1a22'); }
      if (pr > 0) { const ry = my - 40 + pr * 34; R(g, mx - 4, ry - 30, 8, 22, '#8a5a2a'); R(g, mx - 4, ry - 30, 8, 2, '#a8783a'); disc(g, mx, ry - 32, 6, '#6a3a1a'); R(g, mx - 10, ry - 8, 20, 6, '#3a2a1a'); R(g, mx - 9, ry - 2, 18, 3, '#1a1a22'); }
      // 舌頭
      if (t > 0.5 && t < 2.6) { const down = ease(clamp((t - 0.5) / 0.8)) * (1 - ease(clamp((t - 2.25) / 0.35))), ext = t < 2.25 ? 4 + Math.sin(lickT * Math.PI) * 66 : 4; tongue(g, sx0 + 2, -30 + down * (sy0 - 70), ext); }
      pt.draw(g, t);
      if (t > 5.4 && t < 5.6) { R(g, bx - 9, ty0 - 40, 18, 3, '#3a0a0a'); }
    }, snd);
  };

  // ---------- 2 美麗妄娜：吃太多，狂吐，被自己的嘔吐物淹沒 ----------
  GA.dLeaf = function (SFX, e) {
    const ui = this, s = e.seat, op = seatOpt(ui, s), T = 7200, pt = parts(); let st = [];
    const haze = Array.from({ length: 10 }, () => ({ x: Math.random(), y: rnd(0.1, 0.6), v: rnd(0.01, 0.03), r: rnd(10, 20) }));
    const snd = () => { const K = kit(SFX); if (!K) return;
      // 慵懶的雷鬼節拍（反拍吉他）
      const b = 60 / 76; for (let i = 0; i < 8; i++) { const st0 = 0.1 + i * b; K.drum(st0, 48, 0.3, 0.3); [196, 246.9, 293.7].forEach(f => SFX.tone(f, 0.08, { type: 'square', vol: 0.02, lp: 1600, delay: st0 + b / 2, wet: 0.3 })); SFX.tone([98, 98, 110, 87.3][i % 4], b * 0.8, { type: 'sine', vol: 0.1, wet: false, delay: st0 }); }
      for (let i = 0; i < 6; i++) SFX.noise(0.08, { f: 1800, type: 'bandpass', vol: 0.04, delay: 0.8 + i * 0.16 }); // 嚼洋芋片
      [2.4, 3.3, 4.1].forEach((d, k) => { K.growl(d, 0.5, 70 - k * 8, 0.12); SFX.noise(0.7, { f: 500, vol: 0.14, delay: d + 0.25, attack: 0.03 }); SFX.noise(0.6, { f: 1500, type: 'bandpass', vol: 0.06, delay: d + 0.3 }); });
      for (let k = 0; k < 16; k++) SFX.tone(rnd(150, 400), 0.12, { glide: rnd(500, 900), vol: 0.04, delay: 4.8 + k * 0.12 }); K.drone(4.6, 2.4, [55, 58.3], { lp: 220, vol: 0.06 }); };
    return pix(ui, T, (g, W, Hh, t) => {
      // 亂糟糟的客廳：褪色壁紙、熔岩燈、舊沙發、茶几上的水煙壺和零食
      const fl = Math.round(Hh * 0.74); R(g, 0, 0, W, fl, '#3a2a40'); for (let x = 0; x < W; x += 10) for (let y = (x / 10 % 2) * 8; y < fl; y += 16) { R(g, x + 3, y + 3, 3, 3, '#46344c'); }
      R(g, 8, 30, 26, 34, '#1a1a22'); R(g, 10, 32, 22, 30, '#5a2a6a'); for (let k = 0; k < 5; k++) disc(g, 21, 47, 9 - k * 2, ['#ff6a2a', '#ffb03a', '#3ac06a', '#2a8aff', '#ff3ab0'][(k + Math.floor(t * 2)) % 5]); // 迷幻海報
      R(g, 0, fl, W, Hh - fl, '#4a3a2a'); for (let k = 0; k < 40; k++) R(g, (k * 31) % W, fl + 2 + (k * 17) % (Hh - fl - 2), 3, 1, '#5a4a36');
      const lx = W - 14; R(g, lx - 4, fl - 34, 8, 4, '#c8a040'); R(g, lx - 3, fl - 30, 6, 30, '#c8a040'); R(g, lx - 4, fl - 60, 8, 26, '#ff5a2a'); for (let k = 0; k < 3; k++) { const by = fl - 58 + ((t * 8 + k * 9) % 22); disc(g, lx + Math.sin(t + k) * 1.5, by, 2, '#ffe03a'); } glow(g, lx, fl - 48, 16, '255,120,60', 0.35);
      // 沙發
      const sx0 = 6, sx1 = W - 26, sy = fl - 4; R(g, sx0, sy - 40, sx1 - sx0, 22, '#b8642a'); R(g, sx0, sy - 40, sx1 - sx0, 2, '#d8843a'); R(g, sx0, sy - 18, sx1 - sx0, 16, '#a8582a'); R(g, sx0 - 4, sy - 30, 8, 30, '#9a4e24'); R(g, sx1 - 4, sy - 30, 8, 30, '#9a4e24'); R(g, sx0 + 30, sy - 18, 1, 14, '#8a4820'); for (let k = 0; k < 3; k++) R(g, sx0 + 12 + k * 22, sy - 34, 6, 3, '#9a4e24');
      // 茶几
      const tx = W * 0.5, tyy = fl + 22; R(g, tx - 30, tyy - 12, 60, 4, '#5a3a20'); R(g, tx - 28, tyy - 8, 3, 10, '#4a2a14'); R(g, tx + 25, tyy - 8, 3, 10, '#4a2a14');
      R(g, tx + 8, tyy - 30, 5, 18, 'rgba(160,220,200,.7)'); oval(g, tx + 10, tyy - 14, 6, 4, 'rgba(120,200,160,.75)'); R(g, tx + 13, tyy - 18, 6, 2, 'rgba(160,220,200,.7)'); // 水煙壺
      R(g, tx - 24, tyy - 22, 12, 10, '#e8c03a'); R(g, tx - 24, tyy - 22, 12, 2, '#c8202a'); R(g, tx - 6, tyy - 18, 10, 6, '#3a8ad8'); // 洋芋片、餅乾
      // 美麗妄娜：坐在沙發上吃 → 臉色發青 → 吐三波 → 吐的東西越積越高把他淹沒
      const px = W * 0.38, py = sy - 16, sick = clamp((t - 1.9) / 0.6), drown = clamp((t - 4.6) / 1.2);
      const heave = [2.65, 3.55, 4.35].some(d => t > d && t < d + 0.55), pose = t < 1.9 ? { arms: ['fwd', 'fwd'], mouth: Math.floor(t * 6) % 2 ? 'grin' : 'o', dy: Math.floor(t * 6) % 2 } : heave ? { arms: ['out', 'out'], eyes: 'wide', mouth: 'o', dy: 2 } : t < 4.6 ? { eyes: 'blink', mouth: 'flat' } : { eyes: 'x', mouth: 'o' };
      spr(g, CH(2, pose, Math.floor(t * 4), op), px, py + drown * 6, { scale: 1.35, rot: t > 4.6 ? -drown * 0.5 : heave ? 0.25 : 0, tint: '#d8f060', tintA: sick * (0.35 + 0.15 * Math.sin(t * 8)) });
      // 吐出來的東西：從嘴巴噴出的弧線＋地上那一攤（越來越高）
      const mx = px + 9, my = py - 33; // 嘴巴的位置（往前彎 0.25 弧度時）
      // 地上那一攤：越來越高的黏稠液體（表面有波紋、亮面、塊狀物、泡泡），最後淹過沙發
      const lvl = clamp((t - 2.7) / 3.0), py2 = fl + 14, top = py2 - 4 - lvl * 30 - drown * 22, x0 = 2, x1 = W - 28;
      if (lvl > 0) { const cols = ['#b8c840', '#a8b832', '#98a82a', '#889a24'];
        for (let x = x0; x < x1; x++) { const u = Math.min(1, (x - x0) / 22, (x1 - x) / 22), edge = Math.sqrt(1 - (1 - u) * (1 - u)), wv = (Math.sin(x * 0.35 + t * 5) * 1.2 + Math.sin(x * 0.13 - t * 3) * 1.5) * edge, y = Math.round(py2 - (py2 - top) * edge + wv), h = py2 + 6 - y; if (h <= 0) continue;
          R(g, x, y, 1, h, cols[1]); R(g, x, y + 1, 1, Math.min(3, h), cols[0]); if (h > 8) R(g, x, y + h - Math.round(h * 0.35), 1, Math.round(h * 0.35), cols[2]); if (h > 14) R(g, x, y + h - 3, 1, 3, cols[3]); R(g, x, y, 1, 1, '#e8f880');
          if ((x * 7) % 11 === 0 && h > 6) R(g, x, y + 4 + (x % Math.max(1, h - 6)), 2, 1, '#e8d870'); if ((x * 5) % 13 === 0 && h > 9) R(g, x, y + 7 + (x % Math.max(1, h - 9)), 2, 2, '#7a8a1a'); }
        for (let k = 0; k < 5; k++) { const a = (t * 0.9 + k * 0.21) % 1, bx = x0 + 10 + (k * 23) % (x1 - x0 - 20); ring(g, bx, top + 3 - a * 3, 1 + a * 1.5, 'rgba(230,250,140,.8)'); }
        g.globalAlpha = 0.5; R(g, x0 + 16, top + 2, 20, 1, '#f4ffb0'); R(g, x0 + 50, top + 3, 12, 1, '#f4ffb0'); g.globalAlpha = 1; }
      // 噴出來的弧線（粗、一段一段的）
      if (heave) { const ph2 = ((t - 2.65) % 0.9) / 0.55; for (let i = 0; i < 26; i++) { const u = i / 26; if (u > ph2 + 0.15) break; const x = mx + u * 50, y = my + u * u * (top - my) * 1.05 - Math.sin(u * Math.PI) * 8, w = u < 0.15 ? 4 : 3; R(g, x, y, w, w, i % 3 ? '#b8c840' : '#d8d860'); R(g, x, y, w, 1, '#eef890'); } if (Math.random() < 0.6) pt.add({ x: mx + rnd(30, 50), y: top, vx: rnd(-1, 1.5), vy: rnd(-2, -1), t, s: 2, c: '#c8d850', gr: 160, life: 0.6 }); }
      pt.draw(g, t);
      haze.forEach(h => { const hx = ((h.x + t * h.v) % 1.2 - 0.1) * W, hy = h.y * Hh; g.globalAlpha = 0.06; disc(g, hx, hy, h.r, '#c8b8d8'); disc(g, hx + 4, hy - 2, h.r * 0.7, '#c8b8d8'); disc(g, hx - 3, hy + 1, h.r * 0.5, '#d8c8e8'); }); g.globalAlpha = 1;
    }, snd);
  };

  // ---------- 3 古柯檢查官：以為是白粉，吸完才發現是鹽巴 ----------
  function shaker(g, x, y, k, tip) { // 玻璃鹽罐（頂端金屬蓋有小洞）：tip＝倒在桌上
    const img = mkspr('shk' + (tip ? 1 : 0), 30, 30, (g2) => { if (tip) { g2.translate(15, 18); g2.rotate(-Math.PI / 2 - 0.15); g2.translate(-15, -18); }
      R(g2, 9, 8, 12, 18, 'rgba(220,235,245,.85)'); R(g2, 10, 14, 10, 12, '#f8f8f4'); R(g2, 11, 14, 2, 12, '#ffffff'); R(g2, 18, 9, 2, 17, 'rgba(160,190,210,.9)'); for (let k = 0; k < 8; k++) R(g2, 11 + (k * 3) % 8, 15 + (k * 5) % 10, 1, 1, '#d8d8e0');
      R(g2, 8, 3, 14, 6, '#b8b8c4'); R(g2, 8, 3, 14, 1, '#e8e8f0'); R(g2, 8, 8, 14, 1, '#7a7a86'); [11, 14, 17, 12, 16].forEach((xx, j) => R(g2, xx, 4 + (j > 2 ? 2 : 0), 1, 1, '#3a3a44')); });
    g.drawImage(img, Math.round(x - 15 * k), Math.round(y - 26 * k), Math.round(30 * k), Math.round(30 * k));
  }
  GA.dNose = function (SFX, e) {
    const ui = this, s = e.seat, op = seatOpt(ui, s), T = 7400, pt = parts(); let fire = [], sm = [];
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.drone(0, 2.8, [65.4, 98, 130.8], { lp: 500, vol: 0.04 }); SFX.tone(130.8, 1.4, { type: 'triangle', vol: 0.04, delay: 0.1 });
      for (let i = 0; i < 3; i++) SFX.noise(0.12, { f: 2500, type: 'bandpass', vol: 0.05, delay: 0.9 + i * 0.2 }); // 嗅嗅
      K.sweep(1.6, 1.0, 800, 4000, { vol: 0.16 }); SFX.noise(1.0, { f: 3000, type: 'highpass', vol: 0.08, delay: 1.6, attack: 0.5 }); // 吸
      SFX.tone(660, 0.12, { type: 'square', vol: 0.03, lp: 2000, delay: 2.9 }); SFX.tone(660, 0.4, { type: 'square', vol: 0.03, lp: 2000, delay: 3.05 }); K.stinger(3.35, 0.14); // 「欸？」→ 驚覺是鹽
      K.scream(3.6, 1.8, 700, 0.1); K.fire(3.6, 2.2, 0.18); for (let i = 0; i < 9; i++) S.thud(SFX, 3.8 + i * 0.22, 0.5); K.boom(5.95, 80, 30, 0.8, 0.4); };
    return pix(ui, T, (g, W, Hh, t) => {
      const tY = Math.round(Hh * 0.6), shx = W * 0.2;
      const zoom = t > 2.95 && t < 3.6 ? ease(clamp((t - 2.95) / 0.25)) * (1 - ease(clamp((t - 3.4) / 0.2))) : 0;
      g.save(); if (zoom > 0) { g.translate(shx, tY - 20); g.scale(1 + zoom * 1.8, 1 + zoom * 1.8); g.translate(-shx, -(tY - 20)); }
      // 昏暗的房間：牆上的霓虹燈管（沒有字）、鏡子；黑色亮面桌子
      R(g, 0, 0, W, tY, '#140c1a'); for (let x = 0; x < W; x += 10) R(g, x, 0, 1, tY, '#180f20');
      glow(g, W * 0.72, tY - 80, 34, '255,58,176', 0.5); for (let a = 0; a < 6.28; a += 0.05) { const hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); R(g, W * 0.72 + hx * 0.8, tY - 80 + hy * 0.8, 2, 2, '#ff7ad0'); } // 粉紅霓虹愛心
      glow(g, W * 0.22, tY - 96, 26, '58,240,255', 0.4); R(g, W * 0.22 - 14, tY - 98, 28, 2, '#9af8ff'); R(g, W * 0.22 - 14, tY - 92, 20, 2, '#9af8ff'); // 青色霓虹燈條
      R(g, 0, tY, W, Hh - tY, '#0e0c12'); R(g, 0, tY, W, 2, '#3a3448'); for (let k = 0; k < 6; k++) R(g, 6 + k * 20, tY + 10 + k * 5, 14, 1, '#24202c'); g.globalAlpha = 0.3; R(g, W * 0.72 - 10, tY + 6, 20, 2, '#ff3ab0'); g.globalAlpha = 1; // 桌面倒影
      // 直立的玻璃鹽罐（左邊）＋從鹽罐那邊灑出來的一條白線（往右）
      shaker(g, shx, tY + 2, 1.8, false); for (let k = 0; k < 16; k++) R(g, shx + 8 + (k * 5) % 10, tY + 3 + (k * 3) % 3, 1, 1, '#f0f0f4');
      const lx0 = W * 0.32, lx1 = W * 0.78, sniff = clamp((t - 1.6) / 1.0), gone = lx1 - (lx1 - lx0) * sniff;
      for (let x = Math.round(lx0); x < gone; x++) R(g, x, tY + 4 + ((x * 7) % 3 === 0 ? -1 : 0), 1, 2, x % 3 ? '#f8f8f8' : '#e0e0e8');
      // 大鼻子：從右邊跳進來 → 嗅一嗅 → 沿著白線往左一路吸到鹽罐旁邊 → 停住 → 看到鹽罐（鏡頭拉近）→ 變紅、噴淚、噴火、亂跳 → 倒下
      const hopIn = clamp(t / 0.8), nx0 = W + 20, base = tY + 2;
      let nx = nx0 + (lx1 + 4 - nx0) * ease(hopIn), ny = base - Math.abs(Math.sin(hopIn * Math.PI * 2)) * 10, rot = 0, pose = { eyes: 'open' }, tint = null, tA = 0;
      if (t > 0.8 && t < 1.6) { nx = lx1 + 4; ny = base - (Math.floor(t * 8) % 2); pose = { eyes: 'open', legs: 'a' }; }
      if (sniff > 0 && t < 2.6) { nx = gone + 2; ny = base; rot = -0.22; pose = { eyes: 'blink' }; if (Math.random() < 0.8) pt.add({ x: gone - rnd(0, 4), y: tY + 4, vx: rnd(0.2, 0.8), vy: rnd(-1.6, -0.9), t, s: 1, c: '#ffffff', gr: -20, life: 0.25 }); }
      if (t >= 2.6 && t < 3.6) { const back = ease(clamp((t - 2.6) / 0.3)); nx = lx0 + 4 + back * (W * 0.62 - lx0 - 4); ny = base - Math.sin(back * Math.PI) * 8; rot = 0; pose = { eyes: t > 2.9 ? 'wide' : 'open' }; }
      const burn = clamp((t - 3.55) / 0.4), dead = t > 5.8;
      if (t >= 3.6 && !dead) { const hop = Math.abs(Math.sin(t * 9)); nx = W * 0.55 + Math.sin(t * 5.3) * 30; ny = base - hop * 22; rot = Math.sin(t * 11) * 0.3; pose = { eyes: 'wide', legs: 'jump' }; tint = '#ff1a0a'; tA = 0.6 * burn;
        if (Math.random() < 0.8) { pt.add({ x: nx - 10, y: ny - 52, vx: rnd(-2.5, -0.8), vy: rnd(-2, -0.5), t, s: 2, c: '#8ad8ff', gr: 160, life: 0.8 }); pt.add({ x: nx + 10, y: ny - 52, vx: rnd(0.8, 2.5), vy: rnd(-2, -0.5), t, s: 2, c: '#8ad8ff', gr: 160, life: 0.8 }); }
        fire.push({ x: nx - 8, y: ny - 6, t, vx: rnd(-1.6, -0.6) }, { x: nx + 8, y: ny - 6, t, vx: rnd(0.6, 1.6) }); }
      if (dead) { const k2 = clamp((t - 5.8) / 0.3); nx = W * 0.55; ny = base; rot = -1.45 * ease(k2); pose = { eyes: 'x' }; tint = '#ff1a0a'; tA = 0.5; if (sm.length < 20 && Math.floor(t * 6) % 2) sm.push(...puffs(1, nx - 24, ny - 12, t, { c: '#6a6470', life: 1.6, gr: 6 })); }
      fire = fire.filter(f => t - f.t < 0.45); fire.forEach(f => { const a = (t - f.t) / 0.45, x = f.x + f.vx * a * 22, y = f.y + a * 12, r = 4 * (1 - a) + 1; disc(g, x, y, r + 1, '#e8401a'); disc(g, x, y - 1, r, a < 0.5 ? '#ffb030' : '#ff7a1a'); if (a < 0.4) disc(g, x, y - 1, r * 0.5, '#fff4a0'); });
      spr(g, CH(3, pose, Math.floor(t * 4), op), nx, ny, { scale: 1.5, rot, tint, tintA: tA });
      smoke(g, sm, t); pt.draw(g, t); g.restore();
      if (t > 3.35 && t < 3.5) { g.globalAlpha = 0.6; R(g, 0, 0, W, Hh, '#ffffff'); g.globalAlpha = 1; }
    }, snd);
  };

  // ---------- 4 海洛因蒂：陷進紅地毯裡，越陷越深（致敬《猜火車》）----------
  GA.dSpoon = function (SFX, e) {
    const ui = this, s = e.seat, op = seatOpt(ui, s), T = 7400;
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.drone(0, 7, [55, 82.4, 110], { lp: 400, vol: 0.05, sweep: 120 }); K.pad(0.2, 3, [220, 261.6, 329.6], 0.03, 900);
      let x = 0.3, b = 0.55; for (let i = 0; i < 9; i++) { K.heart(x, 1, 60, 0.35 - i * 0.025); x += b; b *= 1.18; } // 心跳越來越慢
      K.sweep(1.4, 2.2, 1500, 200, { vol: 0.08 }); SFX.tone(110, 3, { type: 'sine', glide: 55, vol: 0.05, delay: 2.4, attack: 0.5 });
      SFX.tone(880, 1.8, { type: 'sine', vol: 0.03, delay: 5.0, wet: 0.2 }); };
    return pix(ui, T, (g, W, Hh, t) => {
      if (t < 3.0) { // 破舊房間：剝落的壁紙、吊著的燈泡、一整片深紅色地毯；湯匙慢慢陷進地毯
        const fl = Math.round(Hh * 0.62); R(g, 0, 0, W, fl, '#4a4434'); for (let x = 0; x < W; x += 9) R(g, x, 0, 4, fl, '#524c3a'); [[14, 30, 12, 18], [80, 60, 16, 12], [40, 90, 10, 20]].forEach(([x, y, w, h]) => { R(g, x, y, w, h, '#6a6450'); R(g, x, y + h, w, 1, '#2a2618'); });
        R(g, W * 0.68, fl - 70, 26, 70, '#1a1610'); R(g, W * 0.68 + 2, fl - 68, 22, 68, '#0a0806'); // 門口
        const lx = W * 0.4, sw = Math.sin(t * 1.4) * 3; line(g, lx, 0, lx + sw, 40, '#1a1a1a'); disc(g, lx + sw, 44, 4, '#fff0b0'); glow(g, lx + sw, 44, 30, '255,230,150', 0.4);
        R(g, 0, fl, W, Hh - fl, '#8a1018'); for (let y = fl; y < Hh; y += 2) for (let x = (y % 4) / 2; x < W; x += 3) R(g, x, y, 1, 1, (x + y) % 5 ? '#7a0c14' : '#a01a24');
        const sink = ein(clamp((t - 0.9) / 2.0)), cx = W / 2, cy = fl + 36;
        if (sink > 0) { oval(g, cx, cy + 1, 14 + sink * 10, 4 + sink * 4, '#4a0408'); oval(g, cx, cy, 10 + sink * 8, 3 + sink * 3, '#2a0204'); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; line(g, cx + Math.cos(a) * (12 + sink * 9), cy + Math.sin(a) * (3 + sink * 3), cx + Math.cos(a) * (18 + sink * 14), cy + Math.sin(a) * (5 + sink * 5), '#6a0810'); } }
        spr(g, CH(4, { eyes: t < 0.8 ? 'open' : 'blink', mouth: 'flat', arms: sink > 0.3 ? ['up', 'up'] : ['down', 'down'] }, 0, op), cx, cy + sink * 90, { scale: 1.35, rot: Math.sin(t * 1.8) * 0.06, clipY: cy + 1 });
        if (t > 2.6) { g.globalAlpha = (t - 2.6) / 0.4; R(g, 0, 0, W, Hh, '#000'); g.globalAlpha = 1; }
        return;
      }
      // 從上往下看：紅地毯上的一個洞，湯匙躺在洞底；洞越來越深，底部越來越小、越來越暗
      const k = t - 3.0, d = 1 + k * 0.9; R(g, 0, 0, W, Hh, '#8a1018'); for (let y = 0; y < Hh; y += 2) for (let x = (y % 4) / 2; x < W; x += 3) R(g, x, y, 1, 1, (x + y) % 5 ? '#7a0c14' : '#a01a24');
      const hw = 40, hh = 56, cx = W / 2, cy = Hh * 0.48;
      for (let i = 0; i < 24; i++) { const f = i / 24, sc = 1 / (1 + f * d * 1.4), w = hw * sc, h = hh * sc, c = Math.round(110 * (1 - f) * Math.max(0.15, 1 - k * 0.12)); R(g, cx - w, cy - h, w * 2, h * 2, `rgb(${c + 20},${Math.round(c * 0.08)},${Math.round(c * 0.12)})`); if (i % 3 === 0) { R(g, cx - w, cy - h, w * 2, 1, `rgb(${c + 50},${Math.round(c * 0.15)},${Math.round(c * 0.2)})`); } }
      const bs = 1 / (1 + d * 1.4); R(g, cx - hw * bs, cy - hh * bs, hw * bs * 2, hh * bs * 2, '#1a0204');
      spr(g, CH(4, { eyes: 'blink', mouth: 'flat', arms: ['up', 'up'] }, 0, op), cx, cy + hh * bs * 0.9, { scale: 1.6 * bs, alpha: clamp(1.4 - k * 0.25) });
      R(g, cx - hw - 3, cy - hh - 3, hw * 2 + 6, 3, '#5a0408'); R(g, cx - hw - 3, cy + hh, hw * 2 + 6, 3, '#b02030'); R(g, cx - hw - 3, cy - hh, 3, hh * 2, '#6a0610'); R(g, cx + hw, cy - hh, 3, hh * 2, '#a01a28'); // 洞口的地毯邊（光從右下來）
      if (k < 0.4) { g.globalAlpha = 1 - k / 0.4; R(g, 0, 0, W, Hh, '#000'); g.globalAlpha = 1; }
      g.globalAlpha = clamp((k - 2.4) / 1.4) * 0.8; R(g, 0, 0, W, Hh, '#000'); g.globalAlpha = 1;
    }, snd);
  };

  // ---------- 5 折疊人：折著折著就不動了，變成路邊雕像（快轉：日夜、鴿子、三角錐、塗鴉、下雪、雕像底座）----------
  function pigeon(g, x, y, f) { R(g, x - 3, y - 3, 6, 4, '#8a8a9a'); R(g, x - 3, y - 3, 6, 1, '#aaaabc'); R(g, x + 2, y - 5, 3, 3, '#7a7a8c'); R(g, x + 3, y - 4, 1, 1, '#ff8a2a'); R(g, x + 5, y - 4, 1, 1, '#e8b030'); R(g, x - 5, y - 2, 2, 2, '#6a6a7a'); R(g, x + 1, y - 3, 1, 1, '#5ac08a'); R(g, x - 1, y + 1, 1, 2, '#e88a4a'); R(g, x + 1, y + 1, 1, 2, '#e88a4a'); if (f) R(g, x - 4, y - 6, 4, 2, '#9a9aac'); }
  GA.dFold = function (SFX, e) {
    const ui = this, s = e.seat, op = seatOpt(ui, s), T = 7600, snow = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), v: rnd(0.15, 0.3), p: rnd(0, 6) }));
    const snd = () => { const K = kit(SFX); if (!K) return;
      for (let i = 0; i < 5; i++) SFX.noise(0.5 + i * 0.15, { f: 600, type: 'bandpass', vol: 0.05 - i * 0.008, delay: 0.1 + i * (0.4 + i * 0.12), attack: 0.2 }); // 呼吸越來越慢
      K.tick(1.8, 40, 0.09, 0.06); K.sweep(1.8, 3.6, 200, 3000, { vol: 0.05 }); SFX.tone(520, 0.08, { vol: 0.03, delay: 2.4 }); SFX.tone(600, 0.08, { vol: 0.03, delay: 2.5 }); // 鴿子
      SFX.tone(1400, 0.05, { type: 'square', vol: 0.02, delay: 3.2 }); SFX.noise(0.3, { f: 5000, type: 'highpass', vol: 0.04, delay: 3.9 }); K.wind(4.4, 1.4, 0.05); // 三角錐、噴漆、風雪
      K.boom(5.5, 60, 40, 1.2, 0.3); [261.6, 329.6, 392, 523.3].forEach((f, i) => SFX.tone(f, 1.6, { type: 'sawtooth', vol: 0.03, lp: 1200, attack: 0.08, delay: 5.7 + i * 0.12, wet: 0.5 })); K.bell(5.7, 196, 2.5, 0.05); };
    return pix(ui, T, (g, W, Hh, t) => {
      const fast = clamp((t - 1.8) / 3.6), cyc = fast * 3, dayk = 0.5 - 0.5 * Math.cos(cyc * 6.283), stone = clamp((t - 5.4) / 0.8);
      // 天空：快轉時日夜交替
      const night = ['#0a0818', '#120e26', '#1c1434', '#2a1a40'], day = ['#5aa8e8', '#7ab8ec', '#9ac8f0', '#c8dcf0'], lerp = (a, b2, k) => { const A1 = hex(a).split(',').map(Number), B1 = hex(b2).split(',').map(Number); return `rgb(${A1.map((v, i) => Math.round(v + (B1[i] - v) * k)).join(',')})`; };
      const gy = Math.round(Hh * 0.62), dk = t < 1.8 ? 0 : dayk; bands(g, 0, 0, W, gy, night.map((c, i) => lerp(c, day[i], dk)));
      if (t > 1.8) { const a = (cyc % 1) * Math.PI; disc(g, W * 0.1 + (cyc % 1) * W * 0.8, gy - Math.sin(a) * gy * 0.8, 6, dk > 0.5 ? '#fff4c0' : '#f4ecd0'); }
      const tb = P.gTenement(2, ''); g.globalAlpha = 1; g.drawImage(tb, -4, gy - tb.height + 2); g.drawImage(P.gTenement(5, ''), W - 44, gy - tb.height + 2);
      g.globalAlpha = dk * 0.5; R(g, 0, 0, W, gy, '#fff8e0'); g.globalAlpha = 1;
      R(g, 0, gy, W, 6, '#6a6672'); R(g, 0, gy, W, 1, '#8a8692'); R(g, 0, gy + 6, W, Hh - gy - 6, lerp('#24222a', '#4a4852', dk)); for (let x = 0; x < W; x += 16) R(g, x + 2, gy + 26, 9, 2, '#c8a83a');
      // 雕像底座（最後升起來）
      const cx = W * 0.5, base = gy + 20, ped = ease(clamp((t - 5.4) / 0.6)) * 18;
      if (ped > 0) { R(g, cx - 22, base - ped, 44, ped, '#8a8690'); R(g, cx - 24, base - ped, 48, 3, '#a8a4b0'); R(g, cx - 22, base - 2, 44, 2, '#5a5662'); R(g, cx - 8, base - ped + 6, 16, 6, '#c8a040'); R(g, cx - 7, base - ped + 7, 14, 1, '#e8c860'); }
      // 折疊人：呼吸泡泡越來越慢 → 定格（越來越灰紫）→ 最後變成銅像
      const purple = clamp((t - 0.4) / 1.4), y0 = base - ped;
      spr(g, CH(5, { eyes: t < 1.6 ? (Math.floor(t * 2) % 3 ? 'open' : 'blink') : 'blink', mouth: 'flat' }, t < 1.6 ? Math.floor(t * 2) : 0, op), cx, y0, { scale: 1.6, tint: stone > 0 ? '#a8783a' : '#6a4aa8', tintA: stone > 0 ? 0.35 + stone * 0.45 : purple * 0.35 });
      if (t < 1.7) { const per = 0.5 + t * 0.5, ph = (t % per) / per; if (ph < 0.6) ring(g, cx - 18 - ph * 4, y0 - 34 - ph * 8, 1 + ph * 2, 'rgba(230,240,255,.8)'); }
      // 快轉中累積在他身上的東西
      if (t > 2.3) { pigeon(g, cx - 6, y0 - 54, Math.floor(t * 6) % 2 && t < 2.6); }
      if (t > 3.1) { const k2 = ease(clamp((t - 3.1) / 0.2)), cy2 = y0 - 54 - (1 - k2) * 20; R(g, cx - 2, cy2, 10, 3, '#e8601a'); for (let i = 0; i < 10; i++) { const w = 2 + Math.floor((10 - i) * 0.6); R(g, cx + 3 - (w >> 1), cy2 - 10 + i, w, 1, i % 5 < 2 ? '#f4f0e8' : '#ff8a2a'); } } // 三角錐卡在背上
      if (t > 3.8) { const k3 = clamp((t - 3.8) / 0.4); [['#ff3ab0', -14, -30], ['#3af0ff', -6, -24], ['#ffe03a', 4, -36]].forEach(([c, dx, dy], i) => { if (k3 > i / 3) { R(g, cx + dx, y0 + dy, 7, 2, c); R(g, cx + dx + 2, y0 + dy - 2, 2, 6, c); } }); }
      if (t > 4.4) { const k4 = clamp((t - 4.4) / 1.0); R(g, cx - 18, y0 - 46 - k4 * 2, 30, 2 + k4 * 3, '#f4f8ff'); R(g, cx - 8, y0 - 66, 10, 2 + k4 * 2, '#f4f8ff'); snow.forEach(sn => { if (t > 5.6) return; R(g, ((sn.x + Math.sin(t + sn.p) * 0.03 + 1) % 1) * W, ((sn.y + t * sn.v) % 1) * Hh, 1, 1, '#ffffff'); }); R(g, 0, gy, W, Math.round(k4 * 3), '#f4f8ff'); }
      if (stone > 0) { g.globalAlpha = 0.15 * stone; for (let y = 0; y < y0; y++) { const w = (y / y0) * 30; R(g, cx - w, y, w * 2, 1, '#fff4c0'); } g.globalAlpha = 1; }
      if (t > 1.8 && t < 5.4 && Math.floor(t * 12) % 2) { g.globalAlpha = 0.06; R(g, 0, 0, W, Hh, '#ffffff'); g.globalAlpha = 1; } // 快轉閃爍
    }, snd);
  };

  // ---------- 6 小混混：被開著低底盤車經過的敵對幫派開槍打死 ----------
  function lowrider(win, f) { return mkspr('lr' + win + '|' + f, 86, 30, (g2, r) => { // 敵對幫派的低底盤車（朝左開）：win 0~1 後車窗搖下
    r(6, 12, 76, 10, '#2a7a5a'); r(6, 12, 76, 2, '#5ac08a'); r(4, 18, 80, 3, '#1a5a40'); r(14, 4, 46, 9, '#2a7a5a'); r(16, 5, 42, 1, '#5ac08a'); // 車身、車頂
    r(18, 6, 18, 6, '#141a22'); r(38, 6, 18, 6, '#141a22'); r(19, 6, 4, 1, '#4a5a6a'); // 車窗
    if (win > 0) { const h = Math.round(6 * win); r(38, 6, 18, h, '#0a0a0e'); [42, 50].forEach(x => { r(x, 7, 5, 5, '#2a1a14'); r(x - 1, 6, 7, 2, '#2a4ac8'); }); } // 戴藍色頭巾的人影
    r(2, 15, 4, 3, '#f4e8a0'); r(82, 15, 3, 3, '#c82020'); r(6, 21, 76, 1, '#c8c8d0'); // 車燈、鍍鉻條
    [[20, 24], [66, 24]].forEach(([x, y]) => { disc(g2, x, y, 6, '#141418'); disc(g2, x, y, 4, '#c8c8d4'); disc(g2, x, y, 2, '#8a8a96'); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + f; r(x + Math.round(Math.cos(a) * 3), y + Math.round(Math.sin(a) * 3), 1, 1, '#ffffff'); } }); }); }
  GA.dThug = function (SFX, e) {
    const ui = this, s = e.seat, op = seatOpt(ui, s), T = 7200, pt = parts(); let sm = [];
    const snd = () => { const K = kit(SFX); if (!K) return;
      for (let i = 0; i < 8; i++) { const st0 = 0.2 + i * 0.32, v = 0.15 + i * 0.04; K.drum(st0, 42, v, 0.4); if (i % 2) K.snare(st0, 0.04 + i * 0.008); SFX.tone(i % 4 < 2 ? 49 : 55, 0.28, { type: 'sine', vol: 0.06 + i * 0.012, wet: false, delay: st0 }); } // 車上的音響越來越近
      SFX.tone(400, 0.6, { type: 'sawtooth', glide: 200, vol: 0.02, lp: 900, delay: 2.0 }); // 車窗搖下
      for (let i = 0; i < 12; i++) S.gun(SFX, 2.5 + i * 0.08 + rnd(0, 0.03), 0.55); K.stinger(2.5, 0.12); S.thud(SFX, 3.6, 1.2);
      SFX.noise(1.0, { f: 2500, type: 'bandpass', q: 3, vol: 0.12, delay: 3.9, attack: 0.05 }); SFX.tone(150, 1.0, { type: 'sawtooth', glide: 300, vol: 0.05, lp: 900, delay: 3.9 }); // 輪胎尖叫、加速離開
      for (let i = 0; i < 6; i++) SFX.tone(i % 2 ? 660 : 880, 0.38, { type: 'square', vol: 0.012, lp: 2000, delay: 5.0 + i * 0.4 }); K.heart(4.2, 4, 50, 0.3); };
    return pix(ui, T, (g, W, Hh, t) => {
      const gy = street(g, W, Hh, t, { lampX: 0.2, wall: false }), cx = W * 0.4, cy = gy + 30;
      // 車：從右邊彈跳著慢慢開進來 → 停在他前面 → 搖下車窗開槍 → 輪胎冒煙加速開走
      const arr = ease(clamp((t - 0.3) / 1.6)), go = ein(clamp((t - 3.9) / 1.0)), carX = W + 50 - arr * (W + 50 - (cx + 18)) - go * (W + 140), hop = t < 2.0 ? Math.abs(Math.sin(t * 6)) * 4 : 0;
      const win = clamp((t - 2.0) / 0.4), fire = t > 2.5 && t < 3.5;
      const hit = t > 2.55 && t < 3.6, down = clamp((t - 3.55) / 0.35);
      // 角色（在車子後面一點：站在人行道）
      const pose = t < 2.4 ? { arms: ['pocket', 'pocket'], eyes: 'open', mouth: 'flat' } : hit ? { arms: ['out', 'out'], eyes: 'wide', mouth: 'o', dy: Math.floor(t * 30) % 2 } : { eyes: 'x', mouth: 'o' };
      if (down > 0) { const pw = clamp((t - 3.9) / 2.0); oval(g, cx - 14, cy, 6 + pw * 18, 2 + pw * 4, '#7a0a14'); oval(g, cx - 16, cy - 1, 3 + pw * 10, 1 + pw * 2, '#a01020'); }
      spr(g, CH(6, pose, 0, op), cx + (hit ? rnd(-1, 1) : 0), cy - 10, { scale: 1.35, rot: -1.5 * ease(down), tint: hit && Math.floor(t * 20) % 2 ? '#ff1a1a' : null, tintA: 0.4 });
      if (hit && Math.random() < 0.6) pt.burst(3, cx + rnd(-8, 8), cy - 50 + rnd(0, 30), 1.5, t, '#b01020', { gr: 140, life: 0.8 });
      if (go > 0 && sm.length < 40) sm.push(...puffs(2, carX + 70, gy + 40, t, { c: '#8a8690', gr: 10, life: 1.4, a: 0.5 }));
      smoke(g, sm, t);
      const car = lowrider(win, Math.floor(t * 12) % 3); put(g, car, carX, gy + 46 - hop, { scale: 1.2 });
      if (fire && Math.floor(t * 24) % 2) { const fx = carX - 10, fy = gy + 46 - 30; R(g, fx - 8, fy - 2, 8, 5, '#fff4a0'); R(g, fx - 12, fy, 6, 1, '#ffb030'); glow(g, fx - 6, fy, 12, '255,220,120', 0.6); }
      pt.draw(g, t);
      if (t > 5.0) { const k = Math.floor(t * 3) % 2; g.globalAlpha = 0.12; R(g, 0, 0, W, Hh, k ? '#ff1a2a' : '#1a4aff'); g.globalAlpha = 1; } // 遠方警燈
    }, snd, 100);
  };

  // ---------- 7 黑幫老大：坐在車裡停紅燈聽音樂，旁邊開來一台車搖下車窗開槍 ----------
  function sedan(col, win, key) { return mkspr('sd' + key + win, 96, 34, (g2, r) => { // 四門大轎車（朝左），col＝車身色
    const d = col === '#141418' ? '#2a2a34' : '#d8d8e0', hl = col === '#141418' ? '#4a4a58' : '#ffffff';
    r(4, 14, 88, 12, col); r(4, 14, 88, 2, hl); r(20, 4, 54, 11, col); r(24, 5, 46, 1, hl); r(2, 20, 92, 4, d);
    r(24, 6, 22, 8, '#1a2430'); r(48, 6, 22, 8, '#1a2430'); r(25, 6, 6, 1, '#5a6a80'); r(49, 6, 6, 1, '#5a6a80'); r(46, 5, 2, 10, col);
    if (win > 0) r(24, 6, 22, Math.round(8 * win), '#05070a');
    r(2, 16, 4, 3, '#f4e8a0'); r(90, 16, 4, 3, '#c82020'); r(4, 24, 88, 1, '#a8a8b4');
    [[22, 27], [74, 27]].forEach(([x, y]) => { disc(g2, x, y, 6, '#101014'); disc(g2, x, y, 3, '#b8b8c4'); }); }); }
  function limo() { return mkspr('limo', 124, 46, (g2, r) => { // 老大的黑色大轎車（朝左、大一號，車窗看得到人）
    r(4, 20, 116, 14, '#141418'); r(4, 20, 116, 2, '#4a4a58'); r(26, 4, 72, 17, '#141418'); r(30, 5, 64, 1, '#4a4a58'); r(2, 28, 120, 5, '#2a2a34');
    r(30, 7, 30, 13, '#1a2430'); r(63, 7, 30, 13, '#1a2430'); r(60, 6, 3, 15, '#141418'); r(2, 22, 5, 4, '#f4e8a0'); r(118, 22, 4, 4, '#c82020'); r(4, 33, 116, 1, '#a8a8b4'); r(52, 24, 6, 1, '#8a8a96'); r(86, 24, 6, 1, '#8a8a96');
    [[26, 36], [96, 36]].forEach(([x, y]) => { disc(g2, x, y, 8, '#101014'); disc(g2, x, y, 4, '#b8b8c4'); disc(g2, x, y, 2, '#6a6a76'); }); }); }
  GA.dBoss = function (SFX, e) {
    const ui = this, s = e.seat, op = seatOpt(ui, s), T = 7600, pt = parts(); let sm = [];
    const snd = () => { const K = kit(SFX); if (!K) return;
      // 原創的西岸 G-funk：慢節奏、拍手、深沉貝斯、高音的正弦波滑音主旋律（2.6 秒槍響時整個斷掉）
      const b = 60 / 92; for (let i = 0; i < 4; i++) { const st0 = 0.05 + i * b; K.drum(st0, 46, 0.35, 0.35); if (i % 2) { SFX.noise(0.08, { f: 1800, type: 'bandpass', vol: 0.09, delay: st0 }); SFX.noise(0.06, { f: 2600, type: 'bandpass', vol: 0.05, delay: st0 + 0.02 }); } K.cymbal(st0 + b / 2, 0.04, 0.02); }
      S.bass(SFX, 0.05, [55, 0, 55, 65.4, 73.4, 0, 65.4, 55], b / 2, { vol: 0.13, lp: 300, type: 'sine', slide: true });
      S.lead(SFX, 0.3, [880, 987.8, 1046.5, 987.8, 880, 784, 880, 0], b / 2, { type: 'sine', vol: 0.035, glide: 1.03, wet: 0.5 });
      SFX.tone(220, 2.4, { type: 'sawtooth', vol: 0.015, lp: 900, delay: 0.05, attack: 0.3 }); SFX.tone(277.2, 2.4, { type: 'sawtooth', vol: 0.012, lp: 900, delay: 0.05, attack: 0.3 });
      SFX.tone(90, 1.2, { type: 'sawtooth', vol: 0.03, lp: 300, delay: 1.6, attack: 0.3 }); // 另一台車開過來
      for (let i = 0; i < 9; i++) S.gun(SFX, 2.6 + i * 0.13 + rnd(0, 0.03), 0.6); S.glass(SFX, 2.65); K.stinger(2.6, 0.1);
      SFX.tone(4000, 2.5, { type: 'sine', vol: 0.012, delay: 3.0, attack: 0.05 }); // 耳鳴
      SFX.noise(1.0, { f: 2500, type: 'bandpass', q: 3, vol: 0.1, delay: 3.8 }); K.heart(4.4, 3, 40, 0.3); };
    return pix(ui, T, (g, W, Hh, t) => {
      const gy = street(g, W, Hh, t, { lampX: 0.08, wall: false, lamp: true }), music = t < 2.6;
      // 紅綠燈（右邊）：最後變綠燈
      const lx = W - 12, green = t > 4.6; R(g, lx - 1, gy - 70, 2, 70, '#2a2a30'); R(g, lx - 5, gy - 86, 10, 22, '#1a1a20'); disc(g, lx, gy - 81, 3, green ? '#3a1010' : '#ff2a2a'); disc(g, lx, gy - 74, 3, '#3a3010'); disc(g, lx, gy - 67, 3, green ? '#3aff6a' : '#103a18'); glow(g, lx, green ? gy - 67 : gy - 81, 10, green ? '58,255,106' : '255,42,42', 0.6);
      // 老大的黑色轎車（跟著音樂輕輕彈），車窗看得到他、雪茄冒煙
      const bob = music ? (Math.floor(t * 92 / 60 * 2) % 2) : 0, carX = W * 0.46, carY = gy + 28 - bob, hit = t > 2.6 && t < 3.8, slump = clamp((t - 3.1) / 0.6);
      const car = limo();
      // 先畫車內的老大（車窗後面）
      put(g, car, carX, carY + 10); const wx0 = carX - 62 + 30, wy0 = carY + 10 - 46 + 2 + 7, WW = 30, WH = 13; // 前車窗（駕駛座）
      g.save(); g.beginPath(); g.rect(wx0, wy0, WW, WH); g.clip(); R(g, wx0, wy0, WW, WH, '#2a2a36');
      spr(g, CH(7, { eyes: slump > 0 ? 'x' : music ? (Math.floor(t * 3) % 4 ? 'open' : 'blink') : 'wide', mouth: hit ? 'o' : 'smile' }, Math.floor(t * 4), op), wx0 + 15 + slump * 3, wy0 + 36 + slump * 10, { scale: 0.9, rot: slump * 0.5 });
      g.globalAlpha = 0.18; R(g, wx0, wy0, WW, WH, '#8ab8e0'); g.globalAlpha = 0.45; line(g, wx0 + 3, wy0 + WH - 1, wx0 + 11, wy0, '#c8e0f0'); g.globalAlpha = 1; g.restore(); // 玻璃反光
      if (t > 2.65) { line(g, wx0 + 5, wy0, wx0 + 13, wy0 + WH - 1, '#e8f0f8'); line(g, wx0 + 20, wy0 + 1, wx0 + 10, wy0 + 8, '#e8f0f8'); line(g, wx0 + 13, wy0 + 6, wx0 + 24, wy0 + 11, '#e8f0f8'); } // 碎掉的玻璃
      if (slump < 1 && Math.floor(t * 8) % 3 === 0 && sm.length < 30) sm.push(...puffs(1, wx0 + 20, wy0 + 2, t, { c: '#b8b8c4', gr: 4, life: 1.6, a: 0.4, r0: 1 }));
      smoke(g, sm, t);
      if (music) { const k = (t * 1.5) % 1; R(g, carX + 34 + k * 8, carY - 34 - k * 16, 2, 4, '#ffe03a'); R(g, carX + 36 + k * 8, carY - 36 - k * 16, 2, 1, '#ffe03a'); g.globalAlpha = 1 - k; R(g, carX + 20 - k * 6, carY - 30 - k * 12, 2, 3, '#ffe03a'); g.globalAlpha = 1; } // 車裡傳出來的音符
      // 白色的車開到旁邊（前景），車窗搖下，裡面的人開槍，然後加速開走
      const arr = ease(clamp((t - 1.5) / 1.0)), go = ein(clamp((t - 3.8) / 0.9)), wx = -60 + arr * (carX + 6 + 60) - go * 160, win = clamp((t - 2.2) / 0.35), fire = t > 2.6 && t < 3.8 && Math.floor(t * 18) % 2;
      const car2 = sedan('#e8e8f0', win, 'w'); put(g, car2, wx, gy + 54);
      if (win > 0.5) { R(g, wx - 20, gy + 54 - 26, 8, 6, '#1a1418'); R(g, wx - 21, gy + 54 - 27, 10, 2, '#0a0a0e'); } // 人影
      if (fire) { const fx = wx - 14, fy = gy + 54 - 26; R(g, fx - 2, fy - 8, 5, 8, '#fff4a0'); R(g, fx, fy - 12, 1, 5, '#ffb030'); glow(g, fx, fy - 6, 10, '255,220,120', 0.7); }
      if (t > 2.65 && !pt.gl) { pt.gl = 1; pt.burst(30, wx0 + 15, wy0 + 6, 1.4, t, ['#c8e8ff', '#ffffff', '#8ab8d8'], { gr: 140 }); }
      if (go > 0 && sm.length < 50) sm.push(...puffs(1, wx + 40, gy + 50, t, { c: '#9a96a0', gr: 8, life: 1.2, a: 0.5 }));
      pt.draw(g, t);
      if (t > 2.6 && t < 2.7) { g.globalAlpha = 0.6; R(g, 0, 0, W, Hh, '#ffffff'); g.globalAlpha = 1; }
    }, snd, 100);
  };

  // ---------- 8 蘑菇：在森林裡被野狼群圍著尿尿、拉屎 ----------
  function wolf(pose, f) { return mkspr('wolf' + pose + f, 46, 34, (g2, r) => { // 灰狼（朝右）：pose 'walk' | 'pee'（抬後腿）| 'squat'（蹲）| 'howl'（抬頭）| 'sniff'
    const by = pose === 'squat' ? 26 : 24, lg = f % 2;
    // 尾巴
    if (pose === 'squat') { r(4, by - 6, 6, 3, '#6a6a76'); r(2, by - 4, 3, 3, '#5a5a66'); } else { r(2, by - 12, 8, 3, '#7a7a86'); r(0, by - 14, 4, 3, '#8a8a96'); r(0, by - 14, 2, 1, '#c8c8d0'); }
    // 身體
    for (let y = 0; y < 10; y++) r(8, by - 14 + y, 24 - (y > 7 ? 2 : 0), 1, y < 3 ? '#9a9aa6' : y < 7 ? '#7a7a86' : '#5a5a66'); r(10, by - 15, 18, 1, '#b8b8c4'); r(14, by - 6, 12, 2, '#d8d8e0'); // 背、肚子的淺色毛
    // 腿：抬後腿或蹲下
    const legs = pose === 'pee' ? [[10, 0, -1], [14, 1, 0], [24, 0, 0], [28, 1, 0]] : pose === 'squat' ? [[11, 0, 2], [15, 1, 2], [24, 0, 0], [28, 1, 0]] : [[10, lg, 0], [14, 1 - lg, 0], [24, 1 - lg, 0], [28, lg, 0]];
    legs.forEach(([x, k, m], i) => { if (pose === 'pee' && i === 0) { r(6, by - 12, 3, 8, '#6a6a76'); r(3, by - 14, 4, 3, '#6a6a76'); return; } const h = pose === 'squat' && i < 2 ? 4 : 8; r(x + (k ? 1 : -1) * (pose === 'walk' ? 1 : 0), by - 4 - (pose === 'squat' && i < 2 ? -2 : 0), 3, h, i % 2 ? '#5a5a66' : '#7a7a86'); r(x + (k ? 1 : -1) * (pose === 'walk' ? 1 : 0), by + h - 5 - (pose === 'squat' && i < 2 ? -2 : 0), 4, 2, '#3a3a44'); });
    // 頭（howl 時往上抬）
    const hx = 32, hy = pose === 'howl' ? by - 22 : pose === 'sniff' ? by - 8 : by - 16;
    r(hx - 4, hy - 1, 6, 8, '#8a8a96'); r(hx, hy, 8, 6, '#9a9aa6'); r(hx + 6, hy + (pose === 'howl' ? -4 : 2), 7, 3, '#8a8a96'); r(hx + 12, hy + (pose === 'howl' ? -5 : 2), 2, 2, '#1a1a20'); // 頭、長嘴、鼻頭
    r(hx + 1, hy - 4, 3, 4, '#7a7a86'); r(hx + 2, hy - 3, 1, 2, '#c8a0a0'); r(hx + 4, hy - 3, 2, 3, '#6a6a76'); // 耳朵
    r(hx + 4, hy + 1, 2, 1, '#ffd23a'); r(hx + 5, hy + 1, 1, 1, '#1a1a20'); r(hx + 6, hy + 5 + (pose === 'howl' ? -4 : 0), 6, 1, '#d8d8e0'); // 黃眼睛、下巴
    if (pose === 'howl') { r(hx + 8, hy - 1, 4, 1, '#3a1a20'); }
  }); }
  GA.dShroom = function (SFX, e) {
    const ui = this, s = e.seat, op = seatOpt(ui, s), T = 7400, pt = parts(); let poops = [];
    const flies = Array.from({ length: 6 }, () => ({ a: rnd(0, 6), r: rnd(6, 14), v: rnd(5, 9), h: rnd(6, 20) })), fireflies = Array.from({ length: 12 }, () => ({ x: Math.random(), y: rnd(0.3, 0.7), p: rnd(0, 6) }));
    const snd = () => { const K = kit(SFX); if (!K) return;
      for (let i = 0; i < 30; i++) SFX.tone(4200 + rnd(-200, 200), 0.04, { type: 'square', vol: 0.006, lp: 6000, delay: i * 0.22 + rnd(0, 0.05) }); // 蟋蟀
      K.wind(0, 7, 0.03); for (let i = 0; i < 10; i++) SFX.noise(0.1, { f: 1200, type: 'bandpass', vol: 0.03, delay: 0.4 + i * 0.13 }); // 草叢沙沙
      for (let i = 0; i < 4; i++) SFX.noise(0.08, { f: 2200, type: 'bandpass', vol: 0.05, delay: 1.5 + i * 0.12 }); // 嗅
      SFX.noise(1.4, { f: 1800, type: 'bandpass', q: 2, vol: 0.06, delay: 2.1, attack: 0.1 }); // 尿尿
      [2.7, 3.0, 3.25].forEach(d => { SFX.tone(160, 0.12, { glide: 70, vol: 0.12, delay: d }); SFX.noise(0.08, { f: 400, vol: 0.06, delay: d }); }); // 噗通
      SFX.tone(392, 0.8, { type: 'sawtooth', glide: 300, vol: 0.02, lp: 700, delay: 3.6 }); // 洩氣
      K.howl(4.6, 1.8, 330, 0.07); K.howl(4.8, 1.7, 392, 0.06); K.howl(5.0, 1.6, 294, 0.06); };
    return pix(ui, T, (g, W, Hh, t) => {
      // 夜晚的森林：滿月、三層松樹剪影、地上的草和落葉、螢火蟲
      bands(g, 0, 0, W, Hh, ['#06081a', '#0a1028', '#101836', '#162040', '#1a2448']); disc(g, W * 0.7, Hh * 0.16, 14, '#f4f0d8'); disc(g, W * 0.7 - 4, Hh * 0.16 - 3, 3, '#d8d4bc'); disc(g, W * 0.7 + 5, Hh * 0.16 + 4, 2, '#d8d4bc'); glow(g, W * 0.7, Hh * 0.16, 30, '244,240,216', 0.35);
      const gy = Math.round(Hh * 0.66);
      [[0.62, '#0e1626', 10], [0.64, '#0a1220', 14], [0.66, '#060c16', 18]].forEach(([yy, c, hh], L) => { for (let x = -6; x < W + 6; x += 9 + L * 3) { const h = hh + ((x * 13 + L * 7) % 11) * 2, y = Hh * yy; for (let k = 0; k < h; k++) R(g, x - Math.floor(k / 3) + 0, y - k * 2.2, Math.floor(k / 1.5) * 2 + 1, 2, c); } });
      R(g, 0, gy, W, Hh - gy, '#141e14'); for (let k = 0; k < 90; k++) R(g, (k * 37) % W, gy + (k * 23) % (Hh - gy), 2, 1, ['#1e2a1a', '#2a3a22', '#3a2a1a'][k % 3]); for (let x = 0; x < W; x += 3) R(g, x, gy - 2 - (x * 7) % 3, 1, 3, '#2a3a22');
      fireflies.forEach(f => { const a = 0.5 + 0.5 * Math.sin(t * 3 + f.p); if (a < 0.3) return; R(g, ((f.x + Math.sin(t * 0.4 + f.p) * 0.05 + 1) % 1) * W, f.y * Hh + Math.sin(t + f.p) * 4, 1, 1, `rgba(220,255,140,${a})`); });
      // 蘑菇在中間；三隻狼從兩邊走進來 → 嗅一嗅 → 一隻抬腿尿尿、一隻蹲下拉屎 → 蘑菇枯萎 → 狼對著月亮長嚎、離開
      const cx = W * 0.5, cy = gy + 30, wilt = clamp((t - 3.4) / 1.0);
      const arrive = (d) => ease(clamp((t - 0.3 - d) / 1.1)), leave = ein(clamp((t - 6.0) / 1.0));
      const wA = arrive(0), wB = arrive(0.2), wC = arrive(0.4);
      // 嗅完之後轉身，屁股對著蘑菇：左邊那隻轉向左、抬起靠蘑菇那側的後腿尿尿；右邊那隻轉向右、蹲下拉屎
      const W1 = { x: -40 + wA * (cx - 40 + 40) - leave * 70, y: cy - 4, pose: t < 1.4 ? 'walk' : t < 1.95 ? 'sniff' : t < 3.6 ? 'pee' : t > 4.6 && t < 6.0 ? 'howl' : 'walk', flip: t >= 1.95 };
      const W2 = { x: W + 40 - wB * (W + 40 - (cx + 40)) + leave * 70, y: cy - 2, pose: t < 1.6 ? 'walk' : t < 2.35 ? 'sniff' : t < 3.5 ? 'squat' : t > 4.8 && t < 6.0 ? 'howl' : 'walk', flip: t < 2.35 };
      const W3 = { x: W + 40 - wC * (W + 40 - (cx + 8)) + leave * 60, y: cy - 30, pose: t < 1.8 ? 'walk' : t > 5.0 && t < 6.0 ? 'howl' : 'sniff', flip: true };
      [W3].forEach(w => put(g, wolf(w.pose, Math.floor(t * 8) % 2), w.x, w.y, { flip: w.flip, scale: 1.1 }));
      [W1, W2].forEach(w => put(g, wolf(w.pose, Math.floor(t * 8) % 2), w.x, w.y, { flip: w.flip, scale: 1.25 })); // 狼在蘑菇兩側，蘑菇畫在前面
      // 便便堆在蘑菇旁邊
      if (t > 2.7 && poops.length < 1) poops.push(2.7); if (t > 3.0 && poops.length < 2) poops.push(3.0); if (t > 3.25 && poops.length < 3) poops.push(3.25);
      const tailX = W2.x - 17 * 1.25, tailY = W2.y - 14 * 1.25; // 右邊那隻（朝右）的屁股：尾巴根部
      // 蘑菇本人（被尿到慢慢枯萎）
      spr(g, CH(8, t < 1.5 ? { eyes: 'open', mouth: 'smile' } : t < 3.4 ? { eyes: 'wide', mouth: 'o', arms: ['up', 'up'], dy: Math.floor(t * 16) % 2 } : { eyes: 'blink', mouth: 'sad' }, 0, op), cx, cy, { scale: 1.4, sy: 1 - wilt * 0.28, tint: wilt > 0 ? '#5a4a2a' : t > 2.1 ? '#e8d84a' : null, tintA: wilt > 0 ? wilt * 0.6 : 0.18 });
      poops.forEach((p0, i) => { const k = ein(clamp((t - p0) / 0.2)), px = tailX + 2, py = cy - i * 3; if (k < 1) { R(g, tailX, tailY + (py - tailY) * k, 3, 3, '#5a3a1a'); return; } oval(g, px, py, 5 - i, 3 - (i > 1 ? 1 : 0), '#5a3a1a'); oval(g, px - 1, py - 1, 3 - i * 0.5, 1, '#7a5228'); }); // 從尾巴底下掉到地上，越堆越高
      if (t > 3.4) { flies.forEach((f, k) => { const a = f.a + t * f.v, x = cx + 12 + Math.cos(a) * f.r, y = cy - 10 - f.h + Math.sin(a * 1.7) * 3; R(g, x, y, 1, 1, '#101010'); }); for (let k = 0; k < 3; k++) { const a = (t * 0.8 + k / 3) % 1; for (let i = 0; i < 8; i++) R(g, cx - 10 + k * 10 + Math.round(Math.sin(i * 0.8 + t * 4) * 1.5), cy - 64 - a * 20 - i, 1, 1, `rgba(140,200,80,${(1 - a) * 0.8})`); } } // 臭味
      // 尿：從抬起的後腿那邊畫一道黃色弧線到蘑菇上
      if (W1.pose === 'pee' && t > 2.1) { const sx = W1.x + 12 * 1.25, sy = W1.y - 16 * 1.25; for (let i = 0; i < 18; i++) { const u = i / 18, x = sx + u * (cx - 6 - sx), y = sy - Math.sin(u * Math.PI) * 8 + u * (cy - 40 - sy); R(g, x, y, 1, 2, i % 3 ? '#f0d840' : '#fff090'); } /* 從抬起後腿的胯下噴出來 */ if (Math.random() < 0.7) pt.add({ x: cx - 6, y: cy - 40, vx: rnd(-1, 1), vy: rnd(-1, 0), t, s: 1, c: '#f0d840', gr: 120, life: 0.4 }); g.globalAlpha = 0.5; oval(g, cx - 2, cy + 1, 10, 2, '#c8b830'); g.globalAlpha = 1; }
      pt.draw(g, t);
    }, snd);
  };

  // ---------- 沒有債主（人類）：地下錢莊的討債人開黑頭車來，把人拖上車載走 ----------
  function goon(pose, f) { return mkspr('goon' + pose + f, 30, 54, (g2, r) => { // 討債人（原創）：黑西裝、平頭、墨鏡、耳機線，又高又壯；pose 'walk' | 'grab'
    const lg = f % 2; [[9, lg], [17, 1 - lg]].forEach(([x, k]) => { r(x + (pose === 'walk' ? (k ? 1 : -1) : 0), 36, 5, 14, '#16141c'); r(x - 1 + (pose === 'walk' ? (k ? 1 : -1) : 0), 49, 7, 3, '#0a0a0e'); });
    for (let y = 0; y < 20; y++) { const w = y < 3 ? 9 + y : 12 - Math.floor(y / 10); r(15 - w, 17 + y, w * 2, 1, '#1e1c26'); } r(13, 17, 4, 8, '#e8e8f0'); r(14, 18, 2, 7, '#1a1a22'); r(20, 18, 1, 6, '#2a2834'); // 西裝、白襯衫、黑領帶
    const arm = pose === 'grab' ? [[1, 22, 4, 12], [25, 22, 4, 6]] : [[2, 19, 4, 14], [24, 19, 4, 14]]; arm.forEach(([x, y, w, h]) => r(x, y, w, h, '#1e1c26')); r(2, 33, 4, 3, '#c8906a'); r(24, pose === 'grab' ? 27 : 33, 4, 3, '#a87050');
    r(9, 3, 12, 14, '#c8906a'); r(17, 3, 4, 14, '#a87050'); r(9, 2, 12, 3, '#2a2a30'); r(10, 1, 10, 1, '#3a3a44'); r(8, 8, 2, 3, '#b07c58'); // 頭、平頭
    r(9, 8, 12, 3, '#0a0a0e'); r(10, 8, 3, 1, '#4a5a6a'); r(16, 8, 3, 1, '#4a5a6a'); r(12, 14, 6, 1, '#6a3a2a'); r(21, 9, 1, 9, '#e8e8f0'); // 墨鏡、嘴、耳機線
  }); }
  GA.collector = function (SFX, e) {
    const ui = this, s = e.seat, vi = seatChar(ui.v, s), op = seatOpt(ui, s), T = 7400; let sm = [];
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.drone(0, 7, [55, 58.3], { lp: 300, vol: 0.05 }); SFX.tone(90, 1.2, { type: 'sawtooth', vol: 0.04, lp: 300, delay: 0.1, attack: 0.3 });
      SFX.noise(0.7, { f: 2500, type: 'bandpass', q: 3, vol: 0.12, delay: 0.9 }); // 煞車聲
      [1.6, 1.75].forEach(d => { SFX.tone(1200, 0.04, { type: 'square', vol: 0.03, delay: d }); S.thud(SFX, d + 0.1, 0.5); }); // 開車門
      for (let i = 0; i < 6; i++) SFX.noise(0.05, { f: 600, vol: 0.06, delay: 1.9 + i * 0.25 }); // 腳步
      K.scream(2.9, 1.4, 600, 0.06); for (let i = 0; i < 8; i++) SFX.noise(0.06, { f: 900, vol: 0.05, delay: 3.0 + i * 0.16 }); // 掙扎
      S.thud(SFX, 4.55, 1.5); SFX.tone(70, 1.4, { type: 'sawtooth', glide: 140, vol: 0.06, lp: 400, delay: 4.8 }); SFX.noise(1.2, { f: 400, vol: 0.06, delay: 4.8 }); }; // 甩門、加速離開
    return pix(ui, T, (g, W, Hh, t) => {
      const gy = street(g, W, Hh, t, { lampX: 0.12, wall: false }), py = gy + 26;
      // 黑頭車：甩尾停在他前面 → 兩個討債人下車抓住他 → 拖進後座 → 甩門開走
      const arr = ease(clamp((t - 0.6) / 0.6)), go = ein(clamp((t - 4.8) / 1.0)), carX = W + 60 - arr * (W + 60 - W * 0.62) - go * (W + 160), carY = gy + 50;
      const vx0 = W * 0.36; let vx = vx0, vy = py, vr = 0, vp = { eyes: 'open', mouth: 'flat' }, show = true;
      if (t > 1.0 && t < 2.6) vp = { eyes: 'wide', mouth: 'o', arms: ['out', 'out'], dy: Math.floor(t * 16) % 2 };
      const drag = clamp((t - 2.6) / 1.6); if (t >= 2.6) { vx = vx0 + drag * (carX - 8 - vx0); vy = py - 6 - Math.abs(Math.sin(t * 9)) * 3; vr = 0.2; vp = { eyes: 'wide', mouth: 'o', arms: ['up', 'up'], legs: Math.floor(t * 10) % 2 ? 'a' : 'b' }; if (drag >= 1) show = false; }
      const G1x = t < 2.6 ? carX - 6 - clamp((t - 1.7) / 0.8) * (carX - 6 - (vx0 - 16)) : vx - 16, G2x = t < 2.6 ? carX + 10 - clamp((t - 1.8) / 0.8) * (carX + 10 - (vx0 + 16)) : vx + 16;
      if (t > 1.6 && show) put(g, goon(t < 2.6 ? 'walk' : 'grab', Math.floor(t * 6)), G1x, py, { scale: 1.2 });
      if (show) spr(g, CH(vi, vp, Math.floor(t * 4), op), vx, vy, { scale: 1.25, rot: vr });
      if (t > 1.7 && show) put(g, goon(t < 2.6 ? 'walk' : 'grab', Math.floor(t * 6) + 1), G2x, py + 2, { scale: 1.2, flip: true });
      if (t > 4.2 && t < 7) { R(g, vx0 - 2, py - 2, 6, 3, '#f4f4f0'); R(g, vx0 - 2, py - 2, 6, 1, '#ffffff'); R(g, vx0 + 3, py - 4, 1, 2, '#c8c8d0'); } // 掉在路上的一隻鞋
      const car = sedan('#141418', 0, 'col'); put(g, car, carX, carY, { scale: 1.15 });
      if (arr < 1 && arr > 0 && sm.length < 30) sm.push(...puffs(1, carX + 40, carY - 4, t, { c: '#8a8690', gr: 8, life: 1, a: 0.5 }));
      if (go > 0 && sm.length < 60) sm.push(...puffs(2, carX + 50, carY - 6, t, { c: '#8a8690', gr: 10, life: 1.4, a: 0.5 }));
      smoke(g, sm, t);
    }, snd, 100);
  };

  // ---------- 沒有債主（藥類）：掉進馬桶，被沖走 ----------
  GA.flush = function (SFX, e) {
    const ui = this, s = e.seat, vi = seatChar(ui.v, s), op = seatOpt(ui, s), T = 6600, pt = parts();
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.whoosh(0.4, 0.5, false, 0.12); S.splash(SFX, 0.9, 1.2); K.drone(0, 6, [65.4, 98], { lp: 300, vol: 0.04 });
      SFX.tone(1800, 0.05, { type: 'square', vol: 0.04, delay: 1.8 }); SFX.tone(900, 0.08, { type: 'square', vol: 0.04, delay: 1.85 }); // 按下沖水把手
      SFX.noise(3.2, { f: 700, vol: 0.18, delay: 2.0, attack: 0.3 }); SFX.noise(3.0, { f: 2400, type: 'bandpass', q: 1, vol: 0.06, delay: 2.1, attack: 0.5 }); for (let i = 0; i < 18; i++) SFX.tone(rnd(120, 400), 0.12, { glide: rnd(60, 120), vol: 0.04, delay: 2.4 + i * 0.13 }); // 漩渦、咕嚕咕嚕
      K.sweep(4.6, 1.4, 4000, 400, { type: 'highpass', vol: 0.05 }); for (let i = 0; i < 6; i++) S.drip(SFX, 5.2 + i * 0.14); };
    return pix(ui, T, (g, W, Hh, t) => {
      // 跟參考圖一樣的角度：從前上方看馬桶，後面是白磁磚牆、前面是深色地磚；按下沖水後碗裡的水轉成漩渦
      const u = 2.3, by = Math.round(Hh * 0.86), fy = Math.round(by + TOI.wallY * u); tileWall(g, 0, 0, W, fy, t, true); R(g, 0, fy, W, Hh - fy, '#3a3a40'); for (let y = fy; y < Hh; y += 7) R(g, 0, y, W, 1, '#2a2a30'); for (let x = 0; x < W; x += 10) R(g, x, fy, 1, Hh - fy, '#2a2a30'); R(g, 0, fy, W, 2, '#1a1a20');
      line(g, 10, fy - 60, 18, fy - 70, '#c82a2a'); line(g, 18, fy - 70, 24, fy - 58, '#c82a2a'); ring(g, W - 18, fy - 40, 5, '#2a4ac8'); oval(g, W * 0.2, fy + 40, 12, 3, 'rgba(160,130,60,.5)');
      const wt = toilet(g, W / 2, by, { s: u, water: '#6ab8d8', clean: true }), cx = wt.x, cy = wt.y;
      const press = t > 1.75 && t < 2.1; R(g, W / 2 + 10 * u, by + (TOI.tank.mid + 4) * u + (press ? 2 : 0), 6 * u, 2 * u, press ? '#7a7a82' : '#b8b8c0'); // 按下沖水把手
      const sw = clamp((t - 2.0) / 0.6), spin = t > 2.0 ? (t - 2.0) * (2 + (t - 2.0) * 3) : 0, calm = clamp((t - 4.8) / 1.0);
      g.save(); g.beginPath(); g.ellipse(cx, wt.hy, wt.hrx, wt.hry, 0, 0, 6.283); g.clip();
      if (sw > 0 && calm < 1) for (let k = 0; k < 6; k++) for (let i = 0; i < 40; i++) { const uu = i / 40, r2 = (1 - uu), a = k / 6 * 6.283 + uu * 5 + spin; R(g, cx + Math.cos(a) * r2 * wt.rx, cy + Math.sin(a) * r2 * wt.ry, 2, 1, `rgba(225,250,255,${0.7 * sw * (1 - calm) * (1 - uu * 0.5)})`); }
      disc(g, cx, cy + 2, 3 + sw * (1 - calm) * 3, '#2a5a7a'); disc(g, cx, cy + 2, 1 + sw * (1 - calm) * 2, '#0a1a2a');
      // 角色：從上面掉進碗裡 → 浮在水上 → 被漩渦捲著轉、越轉越小 → 被吸進去（畫在碗口裡面，不會跑出馬桶）
      if (t >= 0.9 && t < 4.6) { const k = clamp((t - 2.0) / 2.6), r2 = (1 - ease(k)) * 0.55, a = spin * 1.1, sc = 0.62 * (1 - k * 0.85), rr = t < 2.0 ? Math.sin(t * 4) * 0.2 : a * 1.5, hh = 50 * sc * 0.5, mx = cx + Math.cos(a) * r2 * wt.rx, my = cy + Math.sin(a) * r2 * wt.ry;
        spr(g, CH(vi, t < 2.0 ? { eyes: 'wide', mouth: 'o', arms: ['up', 'up'] } : { eyes: 'x', mouth: 'o', arms: ['up', 'up'] }, 0, op), mx - Math.sin(rr) * hh, my + Math.cos(rr) * hh, { scale: sc, rot: rr }); }
      if (t > 4.6 && t < 5.2) { const a = (t - 4.6) / 0.6; ring(g, cx, cy - a * 4, 1 + a * 3, '#e8fbff'); }
      g.restore();
      if (t < 0.9) { const fy2 = by + PY(40, 2) * u + 2, wob = Math.sin(t * 14) * 0.15 * clamp(t / 0.4), fall = ein(clamp((t - 0.55) / 0.35)); // 站在座圈前緣搖搖晃晃 → 往後跌進碗裡
        spr(g, CH(vi, { eyes: 'wide', mouth: 'o', arms: ['out', 'out'], dy: Math.floor(t * 18) % 2 }, 0, op), cx, fy2 - fall * (fy2 - cy - 6), { scale: 0.9 - fall * 0.2, rot: wob - fall * 0.6, clipY: fall > 0.6 ? cy + 2 : null }); }
      if (t > 0.9 && !pt.s) { pt.s = 1; pt.burst(30, cx, cy, 1.8, t, ['#bff0ff', '#6ab8d8', '#ffffff'], { gr: 100 }); }
      pt.draw(g, t);
    }, snd);
  };

  root.MONO_GANG = GA;
  // 接到彩蛋表：MONO_EGGS[key]
  if (root.MONO_EGGS) Object.keys(GA).forEach(k => { root.MONO_EGGS[k] = function (SFX, e) { return GA[k].call(this, SFX, e); }; });
})(typeof window !== 'undefined' ? window : globalThis);
