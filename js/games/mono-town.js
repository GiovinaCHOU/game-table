// 大富翁：怪奇小鎮的動畫（彩蛋＋破產）——畫風跟神佛之境、魔法學院一致：背光剪影＋外緣光、霧、顆粒
// 角色、怪物、場景都是原創造型，只取 80 年代小鎮＋倒影世界的氣氛
(function (root) {
  const H = root.MONO_HORROR; if (!H) return;
  const { rnd, ease, clamp } = H;
  const TW = {};
  const off = {};
  function rim(g, W, Hh, dpr, glow, blur, fn) {
    if (!off.c || off.c.width !== W || off.c.height !== Hh) { off.c = document.createElement('canvas'); off.c.width = W; off.c.height = Hh; off.g = off.c.getContext('2d'); }
    const o = off.g; o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, Hh); o.fillStyle = '#060408'; o.strokeStyle = '#060408'; const r = fn(o);
    g.save(); if (glow) { g.shadowColor = glow; g.shadowBlur = (blur || 22) * dpr; g.drawImage(off.c, 0, 0); g.shadowBlur = 0; } g.drawImage(off.c, 0, 0); g.restore(); return r;
  }
  function limb(g, x0, y0, x1, y1, w0, w1) { const a = Math.atan2(y1 - y0, x1 - x0), n = a + Math.PI / 2, c = Math.cos(n), sn = Math.sin(n); g.beginPath(); g.moveTo(x0 + c * w0, y0 + sn * w0); g.lineTo(x1 + c * w1, y1 + sn * w1); g.lineTo(x1 - c * w1, y1 - sn * w1); g.lineTo(x0 - c * w0, y0 - sn * w0); g.closePath(); g.fill(); g.beginPath(); g.arc(x0, y0, w0, 0, 7); g.fill(); g.beginPath(); g.arc(x1, y1, w1, 0, 7); g.fill(); }
  const T_ = (g) => g.keepText || g.fillText.bind(g); // 場景裡本來就有的字（牆上的字母、骰子點數）要照畫
  let seed = 1; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ---------- 場景：1983 年小鎮夜晚的街道（遠處房子、電線桿、路燈、霧）；upside＝倒影世界版本 ----------
  const houses = (() => { seed = 11; return Array.from({ length: 9 }, (_, k) => ({ x: k / 8 + (R() - 0.5) * 0.05, w: 0.1 + R() * 0.06, h: 0.07 + R() * 0.05, win: [R() > 0.3, R() > 0.5, R() > 0.4] })); })();
  const spores = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), v: rnd(0.01, 0.05), s: rnd(0.6, 2.2), p: rnd(0, 6) }));
  function street(g, W, Hh, t, U, o) {
    o = o || {}; const up = o.upside || 0;
    const sky = g.createLinearGradient(0, 0, 0, Hh * 0.7);
    sky.addColorStop(0, up ? '#0a0204' : '#0c0a22'); sky.addColorStop(0.7, up ? '#2a0608' : '#2a1838'); sky.addColorStop(1, up ? '#4a0a0c' : '#5a2a3a');
    g.fillStyle = sky; g.fillRect(-40, -40, W + 80, Hh + 80);
    if (!up) { g.fillStyle = 'rgba(255,245,230,.7)'; for (let k = 0; k < 50; k++) g.fillRect((k * 97 % 100) / 100 * W, (k * 37 % 50) / 100 * Hh, 1.5 * U, 1.5 * U); }
    else if (Math.sin(t * 7.3) > 0.93 || (t % 2.1) < 0.06) { // 紅色閃電
      g.save(); g.strokeStyle = 'rgba(255,60,50,.9)'; g.shadowColor = '#ff2a1a'; g.shadowBlur = 20 * U; g.lineWidth = 2.5 * U; g.beginPath(); let x = W * (0.2 + (Math.floor(t * 3) % 5) * 0.15), y = 0; g.moveTo(x, y); while (y < Hh * 0.45) { x += rnd(-30, 30) * U; y += rnd(15, 35) * U; g.lineTo(x, y); } g.stroke(); g.restore();
      g.fillStyle = 'rgba(255,40,30,.12)'; g.fillRect(0, 0, W, Hh); }
    const hy = Hh * 0.66;
    // 遠處房子剪影（亮著窗）
    houses.forEach((h, k) => { const x = h.x * W, w = h.w * W, hh = h.h * Hh; g.fillStyle = up ? '#120406' : '#120c1c'; g.fillRect(x - w / 2, hy - hh, w, hh); g.beginPath(); g.moveTo(x - w / 2 - 4 * U, hy - hh); g.lineTo(x, hy - hh - w * 0.35); g.lineTo(x + w / 2 + 4 * U, hy - hh); g.fill();
      h.win.forEach((on, j) => { if (!on) return; const fl = up ? 0 : (Math.sin(t * 9 + k * 3 + j) > 0.985 ? 0.2 : 1); g.fillStyle = up ? 'rgba(120,10,10,.5)' : `rgba(255,200,120,${0.85 * fl})`; g.fillRect(x - w * 0.32 + j * w * 0.26, hy - hh * 0.65, w * 0.14, hh * 0.22); }); });
    // 電線桿＋電線
    g.strokeStyle = up ? '#0a0204' : '#0a0812'; g.fillStyle = g.strokeStyle; [0.08, 0.5, 0.92].forEach(px => { g.fillRect(px * W - 3 * U, Hh * 0.28, 6 * U, hy - Hh * 0.28); g.fillRect(px * W - 22 * U, Hh * 0.3, 44 * U, 4 * U); });
    g.lineWidth = 1.4 * U; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(0, Hh * 0.31 + k * 8 * U); [0.08, 0.5, 0.92].forEach((px, j) => { const x = px * W; if (j) g.quadraticCurveTo(x - W * 0.21, Hh * 0.36 + k * 8 * U, x, Hh * 0.31 + k * 8 * U); else g.lineTo(x, Hh * 0.31 + k * 8 * U); }); g.lineTo(W, Hh * 0.33); g.stroke(); }
    // 地面＋路面
    const gr = g.createLinearGradient(0, hy, 0, Hh); gr.addColorStop(0, up ? '#1a0406' : '#1a1420'); gr.addColorStop(1, '#050306'); g.fillStyle = gr; g.fillRect(0, hy, W, Hh - hy);
    // 路燈＋光錐
    if (!o.noLamp) { const lx = W * (o.lampX || 0.72), on = up ? 0.25 : (Math.sin(t * 17) > 0.96 ? 0.3 : 1); g.fillStyle = '#0a0810'; g.fillRect(lx - 3 * U, Hh * 0.36, 6 * U, hy + 40 * U - Hh * 0.36); g.fillRect(lx - 3 * U, Hh * 0.36, 30 * U, 4 * U);
      g.save(); g.globalCompositeOperation = 'lighter'; const cone = g.createLinearGradient(0, Hh * 0.37, 0, Hh * 0.95); cone.addColorStop(0, `rgba(255,190,110,${0.45 * on})`); cone.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = cone; g.beginPath(); g.moveTo(lx + 22 * U, Hh * 0.37); g.lineTo(lx + 22 * U - 120 * U, Hh * 0.95); g.lineTo(lx + 22 * U + 120 * U, Hh * 0.95); g.fill();
        const bl = g.createRadialGradient(lx + 24 * U, Hh * 0.375, 0, lx + 24 * U, Hh * 0.375, 30 * U); bl.addColorStop(0, `rgba(255,230,180,${on})`); bl.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = bl; g.fillRect(lx - 10 * U, Hh * 0.33, 70 * U, 60 * U); g.restore(); }
    H.cloudLayer(g, H.smoke(up ? 'redfog' : 'purplefog', up ? [120, 30, 30] : [90, 70, 120], 0.45, 31), W, Hh, 2.2 * U, t * 14 * U, Hh * 0.6, up ? 0.5 : 0.3);
    if (up || o.spores) { g.save(); g.fillStyle = up ? 'rgba(230,210,200,.65)' : 'rgba(230,220,210,.4)'; spores.forEach(p => { const x = ((p.x + Math.sin(t * 0.5 + p.p) * 0.02) % 1) * W, y = ((p.y - t * p.v + 10) % 1) * Hh; g.beginPath(); g.arc(x, y, p.s * U, 0, 7); g.fill(); }); g.restore(); }
    return hy;
  }
  // ---------- 人物剪影 p: { lean, run, aL, aR（手臂角度，0＝往前平舉、正＝往下）, hair, flip, eyes, legs } ----------
  function kid(g, x, y, s, p, t) {
    p = p || {}; g.save(); g.translate(x, y); g.scale(s * (p.flip ? -1 : 1), s); g.rotate(p.lean || 0);
    const run = p.run || 0, sw = Math.sin(t * 14) * run, big = p.big || 1;
    if (p.legs !== false) { limb(g, -9, -95, -12 - sw * 24 + (p.kneel || 0), 0, 9 * big, 7); limb(g, 9, -95, 12 + sw * 24, 0, 9 * big, 7); g.beginPath(); g.ellipse(-12 - sw * 24 + (p.kneel || 0) + 6, -2, 13, 6, 0, 0, 7); g.ellipse(12 + sw * 24 + 6, -2, 13, 6, 0, 0, 7); g.fill(); }
    g.beginPath(); g.moveTo(-20 * big, -165); g.quadraticCurveTo(-26 * big, -120, -19 * big, -88); g.lineTo(19 * big, -88); g.quadraticCurveTo(26 * big, -120, 20 * big, -165); g.closePath(); g.fill();
    const aL = p.aL != null ? p.aL : 1.35, aR = p.aR != null ? p.aR : 1.35, L = 58;
    const hl = [-18 * big - Math.cos(aL) * L, -158 + Math.sin(aL) * L], hr = [18 * big + Math.cos(aR) * L + sw * 6, -158 + Math.sin(aR) * L];
    limb(g, -18 * big, -158, hl[0], hl[1], 8, 6); limb(g, 18 * big, -158, hr[0], hr[1], 8, 6);
    g.beginPath(); g.ellipse(0, -188, 19, 21, 0, 0, 7); g.fill();
    const hair = p.hair;
    if (hair === 'curly') for (let k = 0; k < 11; k++) { const a = Math.PI + k / 10 * Math.PI; g.beginPath(); g.arc(Math.cos(a) * 19, -192 + Math.sin(a) * 18, 7.5, 0, 7); g.fill(); }
    if (hair === 'cap') { g.beginPath(); g.ellipse(0, -202, 21, 11, 0, Math.PI, 0); g.fill(); g.fillRect(4, -204, 26, 5); }
    if (hair === 'long') { g.beginPath(); g.moveTo(-20, -200); g.quadraticCurveTo(-30, -150, -22, -128); g.lineTo(-8, -150); g.lineTo(-10, -195); g.fill(); g.beginPath(); g.ellipse(-16, -150 + Math.sin(t * 6) * 3, 7, 22, 0.2, 0, 7); g.fill(); }
    if (hair === 'puff') { g.beginPath(); g.ellipse(-2, -206, 27, 20, -0.15, 0, 7); g.fill(); g.beginPath(); g.ellipse(14, -210, 14, 11, 0.4, 0, 7); g.fill(); }
    if (hair === 'hat') { g.beginPath(); g.ellipse(0, -204, 38, 7, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-17, -205); g.quadraticCurveTo(-16, -232, 0, -230); g.quadraticCurveTo(16, -232, 17, -205); g.fill(); }
    if (hair === 'metal') { for (let k = 0; k < 14; k++) { const a = Math.PI * 0.85 + k / 13 * Math.PI * 1.3; g.beginPath(); g.arc(Math.cos(a) * 22, -186 + Math.sin(a) * 22 + (k > 8 ? 12 : 0), 8, 0, 7); g.fill(); } g.beginPath(); g.moveTo(-22, -190); g.quadraticCurveTo(-34, -150, -26, -130 + Math.sin(t * 5) * 4); g.lineTo(-12, -160); g.fill(); }
    g.restore();
    const fx = p.flip ? -1 : 1, rr = p.lean || 0, tr = (px, py) => [x + fx * s * (px * Math.cos(rr) - py * Math.sin(rr)), y + s * (px * Math.sin(rr) + py * Math.cos(rr))];
    return { head: tr(0, -188), handR: tr(hr[0], hr[1]), handL: tr(hl[0], hl[1]), chest: tr(0, -140) };
  }
  // 發光的眼睛（被附身、翻白眼）
  function eyesGlow(g, x, y, s, col, a, U) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 12 * U; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(x + sd * 7 * s, y - 2 * s, 4 * s, 2.4 * s, 0, 0, 7); g.fill(); }); g.restore(); }
  // ---------- 花臉怪：細長身體、頭像花瓣一樣裂開，裡面一圈圈尖牙 ----------
  function flower(g, x, y, s, open, t, lunge) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(lunge || 0);
    limb(g, -10, -150, -18 + Math.sin(t * 3) * 4, 0, 9, 5); limb(g, 10, -150, 20 - Math.sin(t * 3) * 4, 0, 9, 5);
    g.beginPath(); g.moveTo(-22, -270); g.quadraticCurveTo(-30, -200, -14, -145); g.lineTo(14, -145); g.quadraticCurveTo(30, -200, 22, -270); g.closePath(); g.fill();
    limb(g, -22, -262, -70, -190 + Math.sin(t * 2) * 8, 7, 4); limb(g, -70, -190 + Math.sin(t * 2) * 8, -96, -128, 4, 3); limb(g, 22, -262, 74, -200, 7, 4); limb(g, 74, -200, 106, -150, 4, 3);
    for (let f = 0; f < 4; f++) { limb(g, -96, -128, -100 + f * 5, -96, 2, 1); limb(g, 106, -150, 110 + f * 4, -118, 2, 1); }
    g.beginPath(); g.arc(0, -290, 16, 0, 7); g.fill();
    const n = 5; for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k - (n - 1) / 2) * (0.45 + open * 0.55), len = 46 + open * 14; g.save(); g.translate(0, -296); g.rotate(a + Math.PI / 2); g.beginPath(); g.moveTo(-12, 0); g.quadraticCurveTo(-18 - open * 6, -len * 0.6, -3, -len); g.quadraticCurveTo(6, -len * 0.8, 12, 0); g.fill(); g.restore(); }
    g.restore();
    if (open > 0.2) { // 花心：血紅的肉＋一圈尖牙（不是剪影，直接畫在上面）
      g.save(); g.translate(x, y); g.rotate(lunge || 0); g.translate(0, -296 * s); const rr = (14 + open * 22) * s; const cg = g.createRadialGradient(0, 0, 0, 0, 0, rr); cg.addColorStop(0, '#1a0004'); cg.addColorStop(0.55, '#7a0a14'); cg.addColorStop(1, '#c02838'); g.fillStyle = cg; g.beginPath(); g.arc(0, 0, rr, 0, 7); g.fill();
      g.fillStyle = '#eee4d4'; for (let ring = 0; ring < 2; ring++) for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283 + ring * 0.22, r0 = rr * (0.95 - ring * 0.35); g.beginPath(); g.moveTo(Math.cos(a - 0.1) * r0, Math.sin(a - 0.1) * r0); g.lineTo(Math.cos(a) * r0 * 0.68, Math.sin(a) * r0 * 0.68); g.lineTo(Math.cos(a + 0.1) * r0, Math.sin(a + 0.1) * r0); g.fill(); } g.restore(); }
  }
  // 倒影世界的觸手藤蔓（從畫面邊緣、地面爬出來）
  function vines(g, list, W, Hh, t, U, grow) {
    g.save(); g.strokeStyle = '#1a0408'; g.lineCap = 'round';
    list.forEach(v => { const len = clamp((grow - v.d) * 1.6); if (len <= 0) return; g.lineWidth = v.w * U; g.beginPath(); let x = v.x * W, y = v.y * Hh, a = v.a; g.moveTo(x, y); const steps = Math.floor(18 * len); for (let k = 0; k < steps; k++) { a += Math.sin(k * 0.7 + v.p + t * 0.8) * 0.18; x += Math.cos(a) * 14 * U; y += Math.sin(a) * 14 * U; g.lineTo(x, y); } g.stroke();
      g.lineWidth = v.w * 0.35 * U; g.strokeStyle = 'rgba(120,10,20,.6)'; g.stroke(); g.strokeStyle = '#1a0408'; });
    g.restore();
  }
  const mkVines = (n, from) => Array.from({ length: n }, (_, k) => { const side = from || ['l', 'r', 'b', 't'][k % 4]; return { x: side === 'l' ? 0 : side === 'r' ? 1 : rnd(0, 1), y: side === 't' ? 0 : side === 'b' ? 1 : rnd(0.2, 1), a: side === 'l' ? rnd(-0.6, 0.6) : side === 'r' ? Math.PI + rnd(-0.6, 0.6) : side === 'b' ? -Math.PI / 2 + rnd(-0.7, 0.7) : Math.PI / 2 + rnd(-0.7, 0.7), w: rnd(5, 12), p: rnd(0, 6), d: k / n * 0.5 }; });
  const finish = (g, W, Hh) => { H.vignette(g, W, Hh, 0.86); H.grain(g, W, Hh, 0.09); };
  const blood = [];
  function spray(x, y, n, sp, t0) { for (let i = 0; i < n; i++) blood.push({ x, y, vx: rnd(-sp, sp), vy: rnd(-sp * 1.4, sp * 0.3), r: rnd(1.5, 5), t: t0 + rnd(0, 0.2) }); }
  function drawBlood(g, t, U) { for (let i = blood.length - 1; i >= 0; i--) { const d = blood[i], a = t - d.t; if (a > 1.8) { blood.splice(i, 1); continue; } if (a < 0) continue; g.fillStyle = '#7a0008'; g.beginPath(); g.ellipse(d.x + d.vx * a * 60 * U, d.y + (d.vy * a * 60 + a * a * 300) * U, d.r * U, d.r * U * (1 + a * 0.8), 0, 0, 7); g.fill(); } }
  const kit = (SFX) => root.MONO_SCORE && SFX ? root.MONO_SCORE.kit(SFX) : null;
  const shake = (g, k, U) => { if (k > 0) g.translate(rnd(-k, k) * U, rnd(-k, k) * U); };

  // ======================= 彩蛋 =======================
  // 聖誕燈拼字：牆上畫滿字母，每個字母上面一顆燈；燈亂閃，然後一顆顆亮出 R、U、N，最後全部爆亮、代幣灑下來
  TW.xlights = function (ui, SFX) {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), rows = [L.slice(0, 9), L.slice(9, 18), L.slice(18)], cols = ['#ff3a3a', '#3aff6a', '#3ab0ff', '#ffd23a', '#ff8ac0', '#ff8a2a'];
    const coins = Array.from({ length: 60 }, () => ({ x: Math.random(), v: rnd(0.5, 1.1), r: rnd(0, 6), s: rnd(0.7, 1.2), d: rnd(0, 0.8) }));
    const snd = () => { const K = kit(SFX); if (!K) return; K.drone(0, 5.6, [55, 82.4], { lp: 400, vol: 0.06 }); K.synth(0.2, [220, 261.6, 329.6, 261.6, 220, 261.6, 329.6, 392], 0.3, 0.03, 'square', 1200); K.buzz(0, 2.0, 0.05);
      [2.1, 2.7, 3.3].forEach((d, i) => { K.chime(d, [880, 988, 1175][i], 0.08); K.buzz(d, 0.2, 0.08); }); K.heart(0.2, 6, 72, 0.25);
      K.sweep(3.6, 0.5, 300, 6000, { rev: true, vol: 0.15 }); K.boom(4.1, 90, 40, 1.2, 0.4); K.shimmer(4.1, 1.5, 1600, 0.04); K.synth(4.1, [523, 659, 784, 1047], 0.12, 0.05, 'square', 3000); };
    return ui.overlay(5800, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, fit = T_(g);
      // 舊壁紙
      const wall = g.createLinearGradient(0, 0, 0, Hh); wall.addColorStop(0, '#2a2018'); wall.addColorStop(1, '#120c08'); g.fillStyle = wall; g.fillRect(0, 0, W, Hh);
      g.strokeStyle = 'rgba(120,90,50,.18)'; g.lineWidth = 2 * U; for (let x = 0; x < W; x += 26 * U) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); }
      const row = rows.length, top = Hh * 0.24, gap = Hh * 0.17, lit = { R: t > 2.1, U: t > 2.7, N: t > 3.3 }, all = t > 4.0;
      // 電線
      rows.forEach((rw, ri) => { const y = top + ri * gap, x0 = W * 0.08, x1 = W * 0.92; g.strokeStyle = '#0a0806'; g.lineWidth = 2 * U; g.beginPath(); g.moveTo(x0, y); for (let k = 0; k <= 20; k++) { const x = x0 + (x1 - x0) * k / 20; g.lineTo(x, y + Math.sin(k / 20 * Math.PI * rw.length) * 6 * U); } g.stroke(); });
      rows.forEach((rw, ri) => rw.forEach((ch, ci) => { const x = W * 0.08 + (W * 0.84) * (ci + 0.5) / rw.length, y = top + ri * gap;
        // 油漆寫的字母（歪歪的、會往下滴）
        g.save(); g.fillStyle = '#e8e0d0'; g.globalAlpha = 0.85; g.font = `900 ${Math.round(34 * U)}px "Arial Black","Helvetica",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.translate(x, y + 42 * U); g.rotate(((ci * 7 + ri * 3) % 5 - 2) * 0.05); fit(ch, 0, 0); g.fillRect(-1 * U, 14 * U, 2 * U, ((ci * 13) % 5 + 3) * 3 * U); g.restore();
        const special = lit[ch], rand = !all && !special && t < 3.8 && Math.sin(t * (6 + ci) + ri * 5 + ci * 2.3) > (t < 2 ? 0.4 : 0.85);
        const on = all ? 0.6 + Math.sin(t * 20 + ci) * 0.4 : special ? 1 : rand ? 0.8 : 0.08, col = cols[(ci + ri) % cols.length];
        g.fillStyle = '#1a1410'; g.fillRect(x - 3 * U, y, 6 * U, 6 * U);
        g.save(); g.globalCompositeOperation = 'lighter'; const r = (special ? 34 : 20) * U * (0.4 + on), bl = g.createRadialGradient(x, y + 12 * U, 0, x, y + 12 * U, r); bl.addColorStop(0, col); bl.addColorStop(0.3, col + 'aa'); bl.addColorStop(1, col + '00'); g.globalAlpha = on; g.fillStyle = bl; g.fillRect(x - r, y + 12 * U - r, r * 2, r * 2); g.restore();
        g.fillStyle = col; g.globalAlpha = 0.4 + on * 0.6; g.beginPath(); g.ellipse(x, y + 12 * U, 5 * U, 8 * U, 0, 0, 7); g.fill(); g.globalAlpha = 1; }));
      // 燈全亮的瞬間白光，代幣從天花板灑下
      if (t > 4.0) { const k = clamp(1 - (t - 4.0) * 3); if (k > 0) { g.fillStyle = `rgba(255,240,210,${k * 0.6})`; g.fillRect(0, 0, W, Hh); }
        g.save(); g.font = `${Math.round(28 * U)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; coins.forEach(c => { const a = t - 4.0 - c.d; if (a < 0) return; g.save(); g.translate(c.x * W, -30 * U + a * a * 380 * U * c.v); g.rotate(c.r + a * 4); g.scale(c.s, c.s); g.fillText('🪙', 0, 0); g.restore(); }); g.restore(); }
      finish(g, W, Hh);
    }, snd);
  };

  // 念力爆發：女孩舉起手、流鼻血，空氣扭曲成一圈圈波紋，大家的代幣從四面八方被吸過來
  TW.psy = function (ui, SFX) {
    const coins = Array.from({ length: 70 }, () => ({ a: rnd(0, 6.28), d: rnd(0.6, 1.1), s: rnd(0.6, 1.2), o: rnd(0, 0.9) }));
    const snd = () => { const K = kit(SFX); if (!K) return; K.drone(0, 5, [41, 61.7, 82.4], { lp: 300, vol: 0.09, sweep: 1400 }); K.heart(0.2, 8, 70, 0.35, 0.9); K.riser(0.6, 1.8, 120, 700, 0.05); K.sweep(1.0, 1.4, 200, 4000, { rev: true, vol: 0.12 });
      K.boom(2.4, 70, 28, 1.5, 0.6); K.stinger(2.4, 0.15); K.whisper(1.0, 1.4, 0.04, 8); for (let i = 0; i < 10; i++) K.whoosh(2.5 + i * 0.12, 0.3, false, 0.06, rnd(-1, 1)); K.synth(2.6, [196, 233, 294, 233, 196, 233, 294, 349], 0.2, 0.04, 'sawtooth', 900); };
    return ui.overlay(5200, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, raise = ease(clamp((t - 0.6) / 0.8)), burst = clamp((t - 2.4) / 0.4);
      g.save(); shake(g, t > 2.4 && t < 3.6 ? 5 * (1 - (t - 2.4) / 1.2) : t > 1.2 && t < 2.4 ? 1.5 : 0, U);
      const hy = street(g, W, Hh, t, U, { lampX: 0.85 });
      // 空氣扭曲的波紋
      if (t > 1.0) { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const p = ((t - 1.0) * 0.7 + k / 5) % 1, r = p * Math.max(W, Hh) * 0.7; g.strokeStyle = `rgba(255,120,180,${(1 - p) * 0.35 * (t > 2.4 ? 1.6 : 0.8)})`; g.lineWidth = (6 - p * 5) * U; g.beginPath(); g.arc(W / 2, hy - 150 * U, r, 0, 7); g.stroke(); } g.restore(); }
      const pos = rim(g, W, Hh, dpr, '#ff5aa8', 30 + burst * 30, o => kid(o, W / 2, hy + 30 * U, 1.25 * U, { aR: -0.25 + (1 - raise) * 1.6, aL: 1.2, hair: 'buzz', lean: -0.05 * raise }, t));
      eyesGlow(g, pos.head[0], pos.head[1], 1.25 * U, '#ffd0f0', raise * 0.9, U);
      if (t > 1.5) { g.fillStyle = '#b0000c'; const len = clamp((t - 1.5) / 1.5) * 16 * U; g.fillRect(pos.head[0] - 3 * U, pos.head[1] + 8 * U, 2.5 * U, len); }
      // 手掌的光
      g.save(); g.globalCompositeOperation = 'lighter'; const hr = (20 + raise * 30 + burst * 60) * U, hg = g.createRadialGradient(pos.handR[0], pos.handR[1], 0, pos.handR[0], pos.handR[1], hr); hg.addColorStop(0, `rgba(255,220,240,${0.4 + raise * 0.5})`); hg.addColorStop(1, 'rgba(255,80,160,0)'); g.fillStyle = hg; g.fillRect(pos.handR[0] - hr, pos.handR[1] - hr, hr * 2, hr * 2); g.restore();
      // 代幣被吸過來
      if (t > 2.4) { g.save(); g.font = `${Math.round(24 * U)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; coins.forEach(c => { const a = clamp((t - 2.4 - c.o) / 1.1); if (a <= 0 || a >= 1) return; const e = ease(a), d = c.d * Math.max(W, Hh) * 0.7 * (1 - e); g.save(); g.globalAlpha = Math.min(1, (1 - a) * 3); g.translate(pos.handR[0] + Math.cos(c.a + e * 2) * d, pos.handR[1] + Math.sin(c.a + e * 2) * d); g.scale(c.s, c.s); g.fillText('🪙', 0, 0); g.restore(); }); g.restore(); }
      if (burst > 0 && burst < 1) { g.fillStyle = `rgba(255,200,230,${(1 - burst) * 0.5})`; g.fillRect(0, 0, W, Hh); }
      g.restore(); finish(g, W, Hh);
    }, snd);
  };

  // 倒影入侵：正常的小鎮街道 → 燈閃 → 整個畫面上下翻轉，變成陰暗的倒影世界，孢子飄、藤蔓爬滿畫面
  TW.flip = function (ui, SFX) {
    const vs = mkVines(26), lamp = { x: 0.72 };
    const snd = () => { const K = kit(SFX); if (!K) return; K.wind(0, 6, 0.05); K.synth(0, [130.8, 155.6, 196, 155.6, 130.8, 155.6, 196, 233], 0.22, 0.03, 'square', 900); K.buzz(1.2, 0.9, 0.08);
      K.sweep(1.6, 0.6, 200, 5000, { rev: true, vol: 0.18 }); K.boom(2.2, 60, 22, 2.2, 0.7); K.growl(2.3, 2.4, 45, 0.22); K.drone(2.2, 3.9, [32.7, 34.6, 49], { lp: 220, vol: 0.12, sweep: 500 });
      K.whisper(2.5, 3, 0.06, 14); K.choir(2.6, 3.4, [110, 116.5, 164.8], { v: 'oo', vol: 0.08, bend: 0.94 }); for (let i = 0; i < 6; i++) K.creak(2.8 + i * 0.5, 0.4, 0.12); K.heart(2.4, 8, 80, 0.4); K.stinger(4.6, 0.2); };
    return ui.overlay(6200, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, fl = clamp((t - 1.9) / 0.5), up = t > 2.15 ? 1 : 0;
      g.save();
      if (t > 1.9 && t < 2.4) { // 翻轉：畫面整個上下顛倒
        const k = ease(fl), sy = Math.cos(k * Math.PI); g.translate(W / 2, Hh / 2); g.scale(1 + Math.sin(k * Math.PI) * 0.15, sy); g.translate(-W / 2, -Hh / 2); }
      else if (up) { g.translate(0, Hh); g.scale(1, -1); shake(g, t < 3 ? 4 : 1, U); }
      const hy = street(g, W, Hh, t, U, { upside: up, lampX: lamp.x });
      // 站在路燈下的人（之後倒過來看就像倒影）
      rim(g, W, Hh, dpr, up ? '#ff2a1a' : '#ffb070', 20, o => kid(o, W * 0.42, hy + 34 * U, 1.1 * U, { aR: 1.4, aL: 1.4, hair: 'cap' }, t));
      g.restore();
      if (t > 1.2 && t < 1.9 && Math.sin(t * 40) > 0) { g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(0, 0, W, Hh); } // 燈一直閃
      if (fl > 0 && fl < 1) { g.fillStyle = `rgba(255,255,255,${Math.sin(fl * Math.PI) * 0.8})`; g.fillRect(0, 0, W, Hh); }
      if (up) { vines(g, vs, W, Hh, t, U, (t - 2.3) / 2.5); const red = g.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, Math.max(W, Hh) * 0.7); red.addColorStop(0, 'rgba(0,0,0,0)'); red.addColorStop(1, 'rgba(80,0,8,.55)'); g.fillStyle = red; g.fillRect(0, 0, W, Hh); }
      finish(g, W, Hh);
    }, snd);
  };

  // 老爺鐘詛咒：巨大的老爺鐘、鐘擺越晃越大、指針狂轉；人被看不見的力量拖到半空，四肢扭曲、眼睛翻白，紅色裂痕爬滿畫面
  TW.clock = function (ui, SFX) {
    const cracks = Array.from({ length: 9 }, () => ({ x: rnd(0.1, 0.9), y: rnd(0.1, 0.9), a: rnd(0, 6.28), d: rnd(0, 0.6) }));
    const snd = () => { const K = kit(SFX); if (!K) return; K.tick(0, 22, 0.24, 0.12); [0.4, 1.9, 3.1, 3.9, 4.5, 4.9].forEach((d, i) => K.bell(d, 98 - i * 3, 3.5, 0.08 + i * 0.03, true));
      K.drone(0, 6.4, [36.7, 38.9, 55], { lp: 260, vol: 0.12, sweep: 700 }); K.heart(0.5, 14, 64, 0.38, 0.93); K.whisper(1.5, 4.5, 0.06, 20); K.riser(2.2, 2.8, 120, 900, 0.05);
      K.choir(2.0, 4.2, [87.3, 92.5, 130.8], { v: 'oo', vol: 0.09, bend: 0.92 }); for (let i = 0; i < 6; i++) K.crack(3.0 + i * 0.45, 0.3, 0.15); K.scream(4.6, 1.2, 420, 0.1); K.stinger(5.2, 0.24); };
    return ui.overlay(6500, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, lift = ease(clamp((t - 1.8) / 2.0)), cx = W / 2;
      g.save(); shake(g, t > 3 ? (t - 3) * 2 : 0, U);
      const bg = g.createRadialGradient(cx, Hh * 0.45, 0, cx, Hh * 0.45, Math.max(W, Hh) * 0.8); bg.addColorStop(0, '#2a1416'); bg.addColorStop(1, '#050204'); g.fillStyle = bg; g.fillRect(-20, -20, W + 40, Hh + 40);
      H.cloudLayer(g, H.smoke('redfog', [120, 30, 30], 0.45, 31), W, Hh, 2.4 * U, t * 10 * U, Hh * 0.5, 0.35);
      // 老爺鐘
      const ch = Hh * 0.82, cw = Math.min(W * 0.36, 150 * U), top = Hh * 0.08; rim(g, W, Hh, dpr, '#ff3a2a', 26, o => { o.fillRect(cx - cw / 2, top + cw * 0.5, cw, ch - cw * 0.5); o.beginPath(); o.arc(cx, top + cw * 0.5, cw / 2, Math.PI, 0); o.fill(); o.fillRect(cx - cw * 0.62, top + ch - 6 * U, cw * 1.24, 12 * U); });
      const fy = top + cw * 0.55, fr = cw * 0.36; g.fillStyle = '#d8ccb0'; g.beginPath(); g.arc(cx, fy, fr, 0, 7); g.fill(); g.strokeStyle = '#2a1a10'; g.lineWidth = 3 * U; g.stroke();
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; g.fillStyle = '#2a1a10'; g.fillRect(cx + Math.cos(a) * fr * 0.82 - 2 * U, fy + Math.sin(a) * fr * 0.82 - 2 * U, 4 * U, 4 * U); }
      const spin = t < 1.8 ? t * 0.3 : t * 0.3 + Math.pow(t - 1.8, 2) * 3; [[spin, 0.55, 4], [spin * 12, 0.8, 2.5]].forEach(([a, l, w]) => { g.strokeStyle = '#1a0a06'; g.lineWidth = w * U; g.beginPath(); g.moveTo(cx, fy); g.lineTo(cx + Math.sin(a) * fr * l, fy - Math.cos(a) * fr * l); g.stroke(); });
      const sw = Math.sin(t * (3.2 + t * 0.6)) * (0.25 + clamp(t / 4) * 0.35), py = fy + fr + 10 * U; g.strokeStyle = '#c8a040'; g.lineWidth = 3 * U; g.beginPath(); g.moveTo(cx, py); g.lineTo(cx + Math.sin(sw) * ch * 0.4, py + Math.cos(sw) * ch * 0.4); g.stroke();
      g.fillStyle = '#e8c04a'; g.beginPath(); g.arc(cx + Math.sin(sw) * ch * 0.4, py + Math.cos(sw) * ch * 0.4, 14 * U, 0, 7); g.fill();
      // 被拖到半空中的人
      const ky = Hh * 0.95 - lift * Hh * 0.38, tw = lift * Math.sin(t * 9) * 0.06;
      const pos = rim(g, W, Hh, dpr, '#ff2a1a', 18 + lift * 22, o => kid(o, cx + W * 0.0, ky, 1.15 * U, { aL: -0.2 - lift * 0.4 + Math.sin(t * 13) * 0.1 * lift, aR: -0.3 - lift * 0.5 + Math.cos(t * 11) * 0.1 * lift, lean: tw, legs: true, hair: 'long', kneel: lift * 10 }, t));
      eyesGlow(g, pos.head[0], pos.head[1], 1.15 * U, '#ffffff', lift, U);
      g.restore();
      // 紅色裂痕從邊緣爬進來
      if (t > 3.0) { g.save(); g.strokeStyle = '#ff2a1a'; g.shadowColor = '#ff0000'; g.shadowBlur = 10 * U; g.lineWidth = 2 * U; cracks.forEach(c => { const p = clamp((t - 3.0 - c.d) / 1.4); if (p <= 0) return; g.beginPath(); let x = c.x * W, y = c.y * Hh, a = c.a; g.moveTo(x, y); for (let k = 0; k < p * 14; k++) { a += rnd(-0.5, 0.5); x += Math.cos(a) * 16 * U; y += Math.sin(a) * 16 * U; g.lineTo(x, y); } g.stroke(); }); g.restore(); }
      if (t > 5.2) { g.fillStyle = `rgba(0,0,0,${clamp((t - 5.2) * 1.5)})`; g.fillRect(0, 0, W, Hh); }
      finish(g, W, Hh);
    }, snd);
  };

  // 命運之骰：地下室跑團的桌子、檯燈，一顆巨大的 20 面骰滾過來，停在這次的點數；20 金光、1 裂開
  TW.d20 = function (ui, SFX, e) {
    const roll = e && e.roll ? e.roll : 1 + Math.floor(Math.random() * 20), crit = roll === 20, fail = roll === 1;
    const sparks = Array.from({ length: 80 }, () => ({ a: rnd(0, 6.28), v: rnd(0.4, 1.4), s: rnd(1, 3) }));
    const snd = () => { const K = kit(SFX); if (!K) return; K.synth(0, [146.8, 174.6, 220, 174.6, 146.8, 174.6, 220, 261.6], 0.25, 0.03, 'square', 1000); K.drone(0, 5, [73.4, 110], { lp: 500, vol: 0.05 });
      for (let i = 0; i < 10; i++) K.drum(0.6 + i * 0.14 + i * i * 0.012, 300 + rnd(0, 200), 0.18, 0.05); K.heart(1.2, 3, 90, 0.25);
      if (crit) { K.sweep(2.4, 0.4, 400, 6000, { rev: true, vol: 0.12 }); K.boom(2.8, 120, 50, 1, 0.4); K.synth(2.8, [523, 659, 784, 1047, 1319], 0.1, 0.06, 'square', 4000); K.shimmer(2.8, 1.8, 1800, 0.04); K.choir(2.9, 2, [523, 659, 784], { v: 'ah', vol: 0.05 }); }
      else if (fail) { K.boom(2.8, 70, 25, 1.5, 0.5); K.crack(2.8, 0.6, 0.3); K.synth(2.9, [220, 207.7, 196, 185], 0.3, 0.05, 'sawtooth', 700); K.growl(3, 1, 60, 0.15); }
      else { K.drum(2.8, 200, 0.3, 0.2); K.chime(2.9, roll >= 11 ? 880 : 440, 0.06); } };
    return ui.overlay(5200, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, fit = T_(g), cx = W / 2, cy = Hh * 0.52;
      // 地下室：深色牆、檯燈光暈、桌面上的地圖紙
      g.fillStyle = '#0c0808'; g.fillRect(0, 0, W, Hh);
      const lamp = g.createRadialGradient(cx, Hh * 0.35, 0, cx, Hh * 0.45, Math.max(W, Hh) * 0.6); lamp.addColorStop(0, 'rgba(255,200,120,.45)'); lamp.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = lamp; g.fillRect(0, 0, W, Hh);
      g.save(); g.translate(cx, Hh * 0.62); g.rotate(-0.08); g.fillStyle = '#c8b088'; g.fillRect(-W * 0.42, -Hh * 0.12, W * 0.84, Hh * 0.3); g.strokeStyle = 'rgba(80,50,20,.5)'; g.lineWidth = 1.5 * U; for (let k = 0; k < 14; k++) { g.beginPath(); g.moveTo(-W * 0.4 + k * W * 0.06, -Hh * 0.1); g.lineTo(-W * 0.4 + k * W * 0.06, Hh * 0.16); g.stroke(); } g.restore();
      ['🎲', '🧙', '🐉', '🗡️', '🥤'].forEach((em, k) => { g.save(); g.font = `${Math.round(30 * U)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.globalAlpha = 0.85; g.fillText(em, W * (0.14 + k * 0.18), Hh * (0.8 + (k % 2) * 0.06)); g.restore(); });
      // 骰子：從左上滾進來，越滾越慢
      const p = ease(clamp((t - 0.5) / 2.2)), dx = cx - W * 0.6 * (1 - p), dy = cy - Hh * 0.3 * (1 - p) - Math.abs(Math.sin(p * 9)) * 50 * U * (1 - p), rot = (1 - p) * 14, r = 70 * U * (1 + (t > 2.7 ? Math.sin(clamp((t - 2.7) * 4) * Math.PI) * 0.15 : 0));
      const shown = t < 2.7 ? 1 + Math.floor((t * 23) % 20) : roll, col = t < 2.7 ? '#3a2a6a' : crit ? '#e8b020' : fail ? '#6a0a10' : '#3a2a6a';
      g.save(); g.translate(dx, dy); g.rotate(rot); g.shadowColor = crit && t > 2.7 ? '#ffd23a' : 'rgba(0,0,0,.6)'; g.shadowBlur = (crit && t > 2.7 ? 50 : 20) * U;
      const hex = []; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 - Math.PI / 2; hex.push([Math.cos(a) * r, Math.sin(a) * r]); }
      g.fillStyle = col; g.beginPath(); hex.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.shadowBlur = 0;
      const tri = [[0, -r * 0.62], [r * 0.54, r * 0.31], [-r * 0.54, r * 0.31]]; g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); tri.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2 * U; hex.forEach(([x, y], k) => { g.beginPath(); g.moveTo(x, y); g.lineTo(tri[Math.floor(k / 2) % 3][0], tri[Math.floor(k / 2) % 3][1]); g.stroke(); }); g.beginPath(); tri.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke();
      g.fillStyle = crit && t > 2.7 ? '#2a1a00' : '#f6ecd8'; g.font = `900 ${Math.round(r * 0.5)}px "Arial Black","Helvetica",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; fit(String(shown), 0, r * 0.06);
      if (fail && t > 2.8) { g.strokeStyle = '#1a0000'; g.lineWidth = 4 * U; g.beginPath(); g.moveTo(-r * 0.3, -r * 0.9); g.lineTo(-r * 0.05, -r * 0.3); g.lineTo(-r * 0.25, r * 0.1); g.lineTo(r * 0.1, r * 0.9); g.stroke(); }
      g.restore();
      if (crit && t > 2.8) { g.save(); g.globalCompositeOperation = 'lighter'; H.rays(g, dx, dy, Math.max(W, Hh), 14, t, 'rgba(255,210,90,A)', 0.35 * clamp((t - 2.8) * 2), 6.283); sparks.forEach(s => { const a = (t - 2.8) * s.v; g.fillStyle = `rgba(255,220,120,${clamp(1 - a * 0.6)})`; g.beginPath(); g.arc(dx + Math.cos(s.a) * a * 300 * U, dy + Math.sin(s.a) * a * 300 * U + a * a * 100 * U, s.s * U, 0, 7); g.fill(); }); g.restore(); }
      if (fail && t > 2.8) { g.fillStyle = `rgba(80,0,0,${clamp((t - 2.8) * 0.8) * 0.45})`; g.fillRect(0, 0, W, Hh); }
      finish(g, W, Hh);
    }, snd);
  };

  // ======================= 破產：每個角色各自出手（攻擊者都在破產者前面或側面） =======================
  TW.death = function (ui, SFX, e) {
    const v = ui.v, by = e.by, ch = by >= 0 && v.players[by] && v.players[by].char; const kind = ch && ch.kind !== 'custom' ? ch.i % 8 : by >= 0 ? 5 : -1;
    blood.length = 0; const T0 = 5.4, vs = mkVines(16, 'b'); let sprayed = {}, lastShk = 0;
    const snd = () => { const K = kit(SFX); if (!K) return; K.drone(0, T0, [41.2, 43.7, 61.7], { lp: 280, vol: 0.09 }); K.synth(0, [110, 130.8, 164.8, 130.8, 110, 130.8, 164.8, 196], 0.28, 0.025, 'square', 800); K.heart(0, 5, 66, 0.3);
      if (kind === -1) { K.growl(0.4, 2.4, 42, 0.25); for (let i = 0; i < 8; i++) K.creak(0.6 + i * 0.3, 0.3, 0.12); K.scream(1.6, 1.2, 480, 0.08); K.boom(2.8, 60, 22, 1.8, 0.6); K.whisper(1, 3, 0.05, 12); }
      if (kind === 0) { K.sweep(0.2, 1.4, 300, 1500, { vol: 0.08 }); for (let i = 0; i < 6; i++) K.drum(0.3 + i * 0.22, 900, 0.06, 0.03); K.boom(1.65, 90, 30, 1, 0.6); K.crack(1.65, 0.3, 0.25); K.scream(1.7, 0.6, 520, 0.06); }
      if (kind === 1) { K.riser(0.4, 1.4, 100, 600, 0.05); K.sweep(0.6, 1.2, 200, 3000, { rev: true, vol: 0.1 }); K.crack(1.9, 0.5, 0.25); K.boom(2.1, 70, 25, 1.4, 0.6); K.scream(1.5, 0.5, 600, 0.07); }
      if (kind === 2) { K.growl(0.6, 0.5, 120, 0.15); K.growl(1.2, 1.0, 70, 0.25); K.boom(1.9, 80, 30, 0.8, 0.5); for (let i = 0; i < 8; i++) K.tear(2.0 + i * 0.12, 0.1, 0.22); K.scream(2.0, 0.6, 520, 0.07); }
      if (kind === 3) { K.sweep(0.2, 1.2, 600, 1200, { vol: 0.06 }); for (let i = 0; i < 5; i++) K.drum(0.25 + i * 0.25, 400, 0.08, 0.04); K.whoosh(1.5, 0.3, false, 0.2); K.boom(1.8, 110, 40, 0.6, 0.6); K.crack(1.8, 0.2, 0.3); }
      if (kind === 4) { K.drum(0.5, 70, 0.3, 0.2); K.drum(0.9, 70, 0.3, 0.2); K.whoosh(1.5, 0.25, false, 0.2); K.boom(1.75, 70, 28, 1, 0.7); K.crack(1.75, 0.3, 0.2); }
      if (kind === 5) { K.whoosh(1.3, 0.3, false, 0.25); K.boom(1.55, 90, 30, 0.8, 0.6); K.whoosh(2.2, 0.3, true, 0.2); K.boom(2.45, 80, 30, 0.8, 0.5); K.scream(1.6, 0.5, 560, 0.07); }
      if (kind === 6) { K.guitar(0.6, [82.4, 123.5, 164.8], 0.5, 0.12); K.guitar(1.3, [82.4, 123.5, 164.8], 1.8, 0.16); K.sweep(1.4, 1.2, 100, 3000, { vol: 0.15 }); K.boom(1.6, 60, 25, 1.4, 0.6); K.cymbal(1.4, 1.5, 0.08); }
      if (kind === 7) { K.growl(0.4, 1.2, 50, 0.26); K.sweep(1.2, 0.6, 3000, 600, { vol: 0.12 }); K.stinger(1.6, 0.2); K.growl(1.8, 1.4, 40, 0.3); for (let i = 0; i < 6; i++) K.tear(1.9 + i * 0.15, 0.1, 0.2); K.scream(1.7, 0.8, 600, 0.09); } };
    return ui.overlay(T0 * 1000, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420; let shk = 0;
      g.save(); shake(g, lastShk, U); const hy = street(g, W, Hh, t, U, { lampX: 0.62, spores: kind === -1 || kind === 7, upside: kind === -1 && t > 0.6 ? 1 : 0 });
      const gy = hy + 46 * U, vx0 = W * 0.4, vs0 = 1.1 * U;
      let vx = vx0, vy = gy, vrot = 0, valpha = 1, vpose = { aL: 1.3, aR: 1.3, hair: 'cap' }, after = null;
      const lean = (p) => Object.assign({}, vpose, p);
      if (kind === -1) { // 沒債主：地上裂出紅光，藤蔓纏住破產者把他拖進地底
        const gr = clamp((t - 0.6) / 1.4), sink = ease(clamp((t - 2.2) / 1.4)); vy = gy + sink * 220 * U; vpose = lean({ aL: -0.6 - Math.sin(t * 12) * 0.2, aR: -0.7 + Math.sin(t * 11) * 0.2, lean: Math.sin(t * 8) * 0.08 * gr });
        g.save(); g.globalCompositeOperation = 'lighter'; const cg = g.createRadialGradient(vx, gy, 0, vx, gy, 140 * U); cg.addColorStop(0, `rgba(255,40,30,${0.7 * gr})`); cg.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = cg; g.fillRect(vx - 140 * U, gy - 80 * U, 280 * U, 160 * U); g.restore();
        after = () => { g.save(); g.beginPath(); g.rect(0, 0, W, gy + 6 * U); g.clip(); }; shk = sink > 0 && sink < 1 ? 3 : 0;
        vs.forEach(q => { q.x = (vx + (q.p - 3) * 22 * U) / W; q.y = gy / Hh; });
      }
      if (kind === 0) { // 單車男孩：騎腳踏車全速從右邊衝過來，把人撞飛
        const p = clamp(t / 1.65), bx = W * 1.15 - (W * 1.15 - vx0 - 40 * U) * ease(p, 1), hit = clamp((t - 1.65) / 1.2);
        if (t > 1.65) { vx = vx0 - hit * W * 0.45; vy = gy - Math.sin(hit * Math.PI) * 140 * U + hit * 20 * U; vrot = -hit * 5; shk = hit < 0.3 ? 6 : 0; if (!sprayed.a) { sprayed.a = 1; spray(vx0, gy - 150 * U, 30, 4, t); } }
        rim(g, W, Hh, dpr, '#ffb070', 18, o => { const x = t < 1.65 ? bx : vx0 + 40 * U + (t - 1.65) * 40 * U; o.lineWidth = 6 * U; [[-55, 0], [55, 0]].forEach(([dx]) => { o.beginPath(); o.arc(x + dx * U, gy - 32 * U, 32 * U, 0, 7); o.stroke(); });
          o.lineWidth = 5 * U; o.beginPath(); o.moveTo(x - 55 * U, gy - 32 * U); o.lineTo(x - 10 * U, gy - 80 * U); o.lineTo(x + 40 * U, gy - 80 * U); o.lineTo(x + 55 * U, gy - 32 * U); o.moveTo(x - 10 * U, gy - 80 * U); o.lineTo(x, gy - 32 * U); o.lineTo(x - 55 * U, gy - 32 * U); o.moveTo(x + 40 * U, gy - 80 * U); o.lineTo(x + 32 * U, gy - 104 * U); o.stroke();
          kid(o, x, gy - 40 * U, 1.0 * U, { flip: true, aR: 0.2, aL: 0.2, lean: 0.25, hair: 'cap', kneel: 10 }, t); });
      }
      if (kind === 1) { // 超能力女孩：舉手，破產者被念力吊到半空、扭曲，再狠狠摔在地上
        const raise = clamp((t - 0.3) / 0.6), lift = ease(clamp((t - 0.7) / 1.0)), slam = clamp((t - 1.9) / 0.25);
        vy = gy - lift * 160 * U * (1 - slam); vrot = lift * Math.sin(t * 18) * 0.15 * (1 - slam) + slam * -1.4; vpose = lean({ aL: -0.4 * lift, aR: -0.5 * lift }); if (slam >= 1) { shk = t < 2.3 ? 7 : 0; if (!sprayed.a) { sprayed.a = 1; spray(vx, gy - 20 * U, 40, 5, t); } }
        const pos = rim(g, W, Hh, dpr, '#ff5aa8', 30, o => kid(o, W * 0.8, gy, 1.15 * U, { flip: true, aR: 1.3 - raise * 1.3, aL: 1.2, hair: 'buzz' }, t)); eyesGlow(g, pos.head[0], pos.head[1], 1.15 * U, '#ffd0f0', raise, U);
        if (t > 0.8) { g.fillStyle = '#b0000c'; g.fillRect(pos.head[0] - 2 * U, pos.head[1] + 8 * U, 2.5 * U, clamp((t - 0.8) / 1.2) * 16 * U); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,120,190,${0.4 * raise})`; for (let k = 0; k < 4; k++) { const p = (t * 1.2 + k / 4) % 1; g.lineWidth = 3 * U; g.beginPath(); g.arc(pos.handR[0], pos.handR[1], p * 120 * U, 0, 7); g.stroke(); } g.restore(); }
      }
      if (kind === 2) { // 捲髮男孩：打開盒子放出他養的小怪物，牠長大撲上去咬
        const grow = ease(clamp((t - 0.5) / 1.0)), leap = clamp((t - 1.5) / 0.4); rim(g, W, Hh, dpr, '#ffb070', 18, o => kid(o, W * 0.86, gy, 1.0 * U, { flip: true, aR: 0.8, aL: 1.2, hair: 'curly' }, t));
        const mx = W * 0.74 - leap * (W * 0.74 - vx0 - 30 * U), my = gy - Math.sin(leap * Math.PI) * 90 * U, ms = (0.3 + grow * 0.9) * U;
        if (leap >= 1) { vrot = -clamp((t - 1.9) / 0.5) * 1.5; vx = vx0 - clamp((t - 1.9) / 0.5) * 40 * U; shk = t < 2.6 ? 4 : 0; if (!sprayed.a) { sprayed.a = 1; spray(vx0, gy - 160 * U, 50, 5, t); } }
        rim(g, W, Hh, dpr, '#ff3a2a', 20, o => { o.save(); o.translate(leap >= 1 ? vx0 + 30 * U : mx, leap >= 1 ? gy - 120 * U : my); o.scale(-ms, ms); o.rotate(leap > 0 && leap < 1 ? -0.4 : 0);
          o.beginPath(); o.ellipse(0, -40, 60, 30, 0, 0, 7); o.fill(); [[-40, 0], [-20, 0], [20, 0], [40, 0]].forEach(([x]) => limb(o, x, -30, x + Math.sin(t * 14 + x) * 10, 0, 7, 4)); o.beginPath(); o.ellipse(60, -50, 30, 26, 0, 0, 7); o.fill();
          for (let k = 0; k < 5; k++) { const a = -0.9 + k * 0.45; o.save(); o.translate(78, -50); o.rotate(a); o.beginPath(); o.moveTo(0, -8); o.quadraticCurveTo(26, -14, 34, 0); o.quadraticCurveTo(26, 14, 0, 8); o.fill(); o.restore(); } o.restore(); });
      }
      if (kind === 3) { // 滑板女孩：踩著滑板滑進來，跳起來用滑板往頭上砸
        const p = clamp(t / 1.5), sx = W * 1.1 - (W * 1.1 - vx0 - 60 * U) * ease(p), jump = clamp((t - 1.2) / 0.6), swing = clamp((t - 1.55) / 0.25);
        if (swing >= 1) { vrot = -clamp((t - 1.8) / 0.4) * 1.5; shk = t < 2.2 ? 6 : 0; if (!sprayed.a) { sprayed.a = 1; spray(vx0 + 10 * U, gy - 190 * U, 40, 4, t); } }
        rim(g, W, Hh, dpr, '#ffb070', 18, o => { const y = gy - Math.sin(jump * Math.PI) * 60 * U - 14 * U; const k2 = kid(o, sx, y, 1.0 * U, { flip: true, aR: swing > 0 ? -1.2 + swing * 2.2 : -1.1, aL: 0.9, hair: 'long', lean: 0.1 }, t);
          o.save(); o.translate(k2.handR[0], k2.handR[1]); o.rotate(-0.8 + swing * 2.2); o.fillRect(-8 * U, -70 * U, 16 * U, 90 * U); o.restore(); if (jump === 0) { o.fillRect(sx - 40 * U, gy - 14 * U, 80 * U, 6 * U); } });
      }
      if (kind === 4) { // 小鎮警長：大步走過來，一記重拳把人打飛
        const p = clamp(t / 1.3), px = W * 0.9 - (W * 0.9 - vx0 - 70 * U) * ease(p), punch = clamp((t - 1.5) / 0.25);
        if (punch >= 1) { const h2 = clamp((t - 1.75) / 0.9); vx = vx0 - h2 * W * 0.3; vy = gy - Math.sin(h2 * Math.PI) * 60 * U; vrot = -h2 * 1.6; shk = h2 < 0.3 ? 7 : 0; if (!sprayed.a) { sprayed.a = 1; spray(vx0, gy - 190 * U, 30, 4, t); } }
        rim(g, W, Hh, dpr, '#ffb070', 18, o => kid(o, px, gy, 1.3 * U, { flip: true, aR: punch > 0 ? 0.05 : 0.9 + Math.sin(t * 8) * 0.2, aL: 1.2, hair: 'hat', big: 1.2, run: p < 1 ? 0.4 : 0 }, t));
      }
      if (kind === 5) { // 球棒帥哥：舉起釘滿釘子的球棒，左右揮兩下
        const sw1 = clamp((t - 1.3) / 0.25), sw2 = clamp((t - 2.2) / 0.25), pos = rim(g, W, Hh, dpr, '#ffb070', 18, o => { const k2 = kid(o, vx0 + 120 * U, gy, 1.12 * U, { flip: true, aR: -1.4 + sw1 * 2.4 - sw2 * 2.4, aL: 1.3, hair: 'puff' }, t);
          o.save(); o.translate(k2.handR[0], k2.handR[1]); o.rotate(-2.6 + sw1 * 2.4 - sw2 * 2.4); o.beginPath(); o.moveTo(-4 * U, 0); o.lineTo(-9 * U, -110 * U); o.lineTo(9 * U, -110 * U); o.lineTo(4 * U, 0); o.fill(); for (let k = 0; k < 10; k++) { o.fillRect((k % 2 ? 8 : -14) * U, -(60 + k * 5) * U, 6 * U, 2 * U); } o.restore(); return k2; });
        void pos; if (sw1 >= 1) { vrot = -0.4 - clamp((t - 2.45) / 0.5) * 1.1; shk = (t < 1.8 || (t > 2.45 && t < 2.8)) ? 6 : 0; if (!sprayed.a) { sprayed.a = 1; spray(vx0 + 20 * U, gy - 180 * U, 40, 5, t); } if (sw2 >= 1 && !sprayed.b) { sprayed.b = 1; spray(vx0, gy - 150 * U, 50, 6, t); } }
      }
      if (kind === 6) { // 重金屬吉他手：刷下強力和弦，音箱的聲波把人震飛
        const strum = t > 1.3, wave = clamp((t - 1.3) / 1.4);
        rim(g, W, Hh, dpr, '#ff5a3a', 22, o => { kid(o, W * 0.86, gy, 1.12 * U, { flip: true, aR: strum ? 1.0 + Math.sin(t * 30) * 0.3 : 0.6, aL: 0.4, hair: 'metal' }, t); o.fillRect(W * 0.66, gy - 90 * U, 70 * U, 90 * U); o.beginPath(); o.moveTo(W * 0.86 - 30 * U, gy - 110 * U); o.lineTo(W * 0.86 - 90 * U, gy - 70 * U); o.lineTo(W * 0.86 - 60 * U, gy - 60 * U); o.closePath(); o.fill(); });
        g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(W * 0.66 + 35 * U, gy - 45 * U, 24 * U, 0, 7); g.fill();
        if (strum) { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 7; k++) { const p = (wave * 1.6 + k / 7) % 1, r = p * W * 0.6; g.strokeStyle = `rgba(255,120,60,${(1 - p) * 0.6})`; g.lineWidth = (10 - p * 8) * U; g.beginPath(); g.arc(W * 0.66, gy - 45 * U, r, Math.PI * 0.75, Math.PI * 1.25); g.stroke(); } g.restore();
          const h2 = clamp((t - 1.6) / 1.4); vx = vx0 - ease(h2) * W * 0.6; vy = gy - Math.sin(h2 * Math.PI) * 50 * U; vrot = -h2 * 2.2; valpha = 1 - clamp((h2 - 0.6) * 2.5); shk = t < 2.6 ? 5 : 0; }
      }
      if (kind === 7) { // 花臉怪：從後面陰影裡長出來，頭像花瓣一樣裂開，一口把人吞掉
        const rise = ease(clamp((t - 0.2) / 1.0)), open = clamp((t - 1.0) / 0.6), bite = clamp((t - 1.65) / 0.35), fx2 = vx0 + 110 * U;
        const lung = bite > 0 ? -0.55 * Math.sin(Math.min(1, bite) * Math.PI * 0.5) : 0;
        if (bite > 0.5) { valpha = 0; if (!sprayed.a) { sprayed.a = 1; spray(vx0, gy - 180 * U, 60, 6, t); } shk = t < 2.4 ? 6 : 0; }
        const fo = bite > 0.5 ? 0.5 + Math.sin(t * 8) * 0.1 : open; g.save(); g.globalAlpha = rise; rim(g, W, Hh, dpr, '#ff2a1a', 26, o => flower(o, fx2, gy + (1 - rise) * 120 * U, 1.05 * U, fo, t, lung)); g.restore();
        if (bite > 0.5) { g.fillStyle = '#060408'; g.beginPath(); g.ellipse(vx0, gy - 2 * U, 30 * U, 6 * U, 0, 0, 7); g.fill(); }
      }
      // 破產者
      if (kind === -1) after();
      if (valpha > 0) { g.save(); g.globalAlpha = valpha; rim(g, W, Hh, dpr, kind === -1 ? '#ff2a1a' : '#ffb070', 16, o => kid(o, vx, vy, vs0, Object.assign({ lean: vrot }, vpose), t)); g.restore(); }
      if (kind === -1) { g.restore(); vines(g, vs, W, Hh, t, U, clamp((t - 0.6) / 1.2)); }
      drawBlood(g, t, U);
      g.restore(); lastShk = shk;
      finish(g, W, Hh);
    }, snd);
  };

  root.MONO_TOWN = TW;
})(typeof window !== 'undefined' ? window : globalThis);
