// 大富翁：魔法學院的動畫（重做）＝鳳凰重生＋八種破產死法＋怪獸書
// 畫法跟神佛之境一致：背光剪影＋外緣光、雲霧、粒子、底片顆粒；人物都是剪影，避免細節粗糙
(function (root) {
  const H = root.MONO_HORROR; if (!H) return;
  const { rnd, ease, clamp, cvs } = H;
  const M = {};
  // ---------- 共用：用離屏畫布畫剪影，再加一圈外緣光（各部位重疊也不會深淺不一） ----------
  const off = {};
  function rim(g, W, Hh, dpr, glow, blur, fn) {
    if (!off.c || off.c.width !== W || off.c.height !== Hh) { off.c = document.createElement('canvas'); off.c.width = W; off.c.height = Hh; off.g = off.c.getContext('2d'); }
    const o = off.g; o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, Hh); o.fillStyle = '#05040a'; o.strokeStyle = '#05040a'; const r = fn(o);
    g.save(); if (glow) { g.shadowColor = glow; g.shadowBlur = (blur || 24) * dpr; g.drawImage(off.c, 0, 0); g.shadowBlur = 0; } g.drawImage(off.c, 0, 0); g.restore(); return r;
  }
  function limb(g, x0, y0, x1, y1, w0, w1) { const a = Math.atan2(y1 - y0, x1 - x0), n = a + Math.PI / 2, c = Math.cos(n), sn = Math.sin(n); g.beginPath(); g.moveTo(x0 + c * w0, y0 + sn * w0); g.lineTo(x1 + c * w1, y1 + sn * w1); g.lineTo(x1 - c * w1, y1 - sn * w1); g.lineTo(x0 - c * w0, y0 - sn * w0); g.closePath(); g.fill(); g.beginPath(); g.arc(x0, y0, w0, 0, 7); g.fill(); g.beginPath(); g.arc(x1, y1, w1, 0, 7); g.fill(); }
  const tt = (g, W, dpr, txt, y, px, col, a) => { g.save(); g.globalAlpha = a; g.font = `900 ${Math.round(px * dpr)}px "Songti TC","Noto Serif TC","Noto Serif CJK TC",serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#000'; g.shadowBlur = 14 * dpr; g.fillStyle = col; g.fillText(txt, W / 2, y); g.restore(); };

  // ---------- 場景：夜晚的古堡大廳（尖拱窗、月光光束、石柱、漂浮蠟燭、霧） ----------
  const candles = Array.from({ length: 26 }, () => ({ x: Math.random(), y: rnd(0.08, 0.45), s: rnd(0.6, 1.2), p: rnd(0, 6) }));
  function hall(g, W, Hh, t, U, opt) {
    const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#07081a'); bg.addColorStop(0.6, '#161a3a'); bg.addColorStop(1, '#05060e'); g.fillStyle = bg; g.fillRect(-30, -30, W + 60, Hh + 60);
    const wx = W / 2, wy = Hh * 0.18, ww = W * 0.34, wh = Hh * 0.42;
    // 尖拱窗＋月亮
    const win = new Path2D(); win.moveTo(wx - ww / 2, wy + wh); win.lineTo(wx - ww / 2, wy + ww * 0.4); win.quadraticCurveTo(wx - ww / 2, wy, wx, wy - ww * 0.15); win.quadraticCurveTo(wx + ww / 2, wy, wx + ww / 2, wy + ww * 0.4); win.lineTo(wx + ww / 2, wy + wh); win.closePath();
    const wg = g.createLinearGradient(0, wy, 0, wy + wh); wg.addColorStop(0, '#2a3a7a'); wg.addColorStop(1, '#6a7ab8'); g.fillStyle = wg; g.fill(win);
    if (opt && opt.moon) { const mr = ww * 0.3, mg = g.createRadialGradient(wx, wy + wh * 0.35, 0, wx, wy + wh * 0.35, mr * 2.2); mg.addColorStop(0, '#fffbe8'); mg.addColorStop(0.45, '#f4ecc8'); mg.addColorStop(0.5, 'rgba(220,220,255,.5)'); mg.addColorStop(1, 'rgba(160,170,255,0)'); g.save(); g.clip(win); g.fillStyle = mg; g.fillRect(wx - ww, wy, ww * 2, wh); g.restore(); }
    g.strokeStyle = '#0a0b18'; g.lineWidth = 6 * U; g.stroke(win); g.lineWidth = 3 * U; g.beginPath(); g.moveTo(wx, wy - ww * 0.12); g.lineTo(wx, wy + wh); for (let k = 1; k < 5; k++) { g.moveTo(wx - ww / 2, wy + wh * k / 5); g.lineTo(wx + ww / 2, wy + wh * k / 5); } g.stroke();
    // 月光光束
    g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const gr = g.createLinearGradient(wx, wy + wh, wx + W * 0.1, Hh); gr.addColorStop(0, 'rgba(140,160,255,.14)'); gr.addColorStop(1, 'rgba(140,160,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(wx - ww / 2 + k * ww / 3, wy + wh * 0.3); g.lineTo(wx - ww / 2 + (k + 1) * ww / 3, wy + wh * 0.3); g.lineTo(wx + (k - 0.6) * W * 0.22 + W * 0.14, Hh); g.lineTo(wx + (k - 1.4) * W * 0.22 + W * 0.1, Hh); g.fill(); } g.restore();
    // 石柱
    [-1, 1].forEach(sd => { const px = W / 2 + sd * W * 0.42, pg = g.createLinearGradient(px - 34 * U, 0, px + 34 * U, 0); pg.addColorStop(0, '#05060c'); pg.addColorStop(0.5, '#262a40'); pg.addColorStop(1, '#05060c'); g.fillStyle = pg; g.fillRect(px - 32 * U, 0, 64 * U, Hh); });
    // 漂浮蠟燭（暖色散景）
    g.save(); g.globalCompositeOperation = 'lighter'; candles.forEach(c => { const x = c.x * W, y = c.y * Hh + Math.sin(t * 0.9 + c.p) * 6 * U, r = 18 * U * c.s, fl = 0.7 + Math.sin(t * 11 + c.p) * 0.15;
      const cg = g.createRadialGradient(x, y, 0, x, y, r); cg.addColorStop(0, `rgba(255,220,150,${0.8 * fl})`); cg.addColorStop(0.25, `rgba(255,170,80,${0.3 * fl})`); cg.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = cg; g.fillRect(x - r, y - r, r * 2, r * 2);
      g.fillStyle = 'rgba(240,230,210,.35)'; g.fillRect(x - 2 * U * c.s, y + 3 * U, 4 * U * c.s, 16 * U * c.s); }); g.restore();
    // 地板與霧
    const fl = g.createLinearGradient(0, Hh * 0.8, 0, Hh); fl.addColorStop(0, '#0c0e1e'); fl.addColorStop(1, '#03030a'); g.fillStyle = fl; g.fillRect(0, Hh * 0.84, W, Hh * 0.2);
    H.cloudLayer(g, H.smoke('bluefog', [70, 80, 140], 0.45, 17), W, Hh, 2.2 * U, t * 18 * U, Hh * 0.55, 0.35);
  }
  // ---------- 學生剪影（長袍、尖帽、圍巾） p: { lean, run, arms, hat } ----------
  function student(g, x, y, s, p, t) {
    p = p || {}; g.save(); g.translate(x, y); g.scale(s * (p.flip ? -1 : 1), s); g.rotate(p.lean || 0);
    const run = p.run || 0, sw = Math.sin(t * 14) * run;
    limb(g, -10, -60, -14 - sw * 22, 0, 8, 6); limb(g, 10, -60, 14 + sw * 22, 0, 8, 6);
    g.beginPath(); g.moveTo(-20, -150); g.quadraticCurveTo(-30, -90, -42 - sw * 6, -42); g.lineTo(42 + sw * 6, -42 + Math.sin(t * 9) * 3); g.quadraticCurveTo(30, -90, 20, -150); g.closePath(); g.fill();
    const aa = p.arms != null ? p.arms : -0.4; limb(g, -16, -140, -16 + Math.cos(Math.PI + aa) * 46, -140 - Math.sin(Math.PI + aa) * -46, 8, 6); limb(g, 16, -140, 16 + Math.cos(aa) * 46 + sw * 10, -140 + Math.sin(aa) * 46, 8, 6);
    g.beginPath(); g.ellipse(0, -170, 17, 19, 0, 0, 7); g.fill();
    if (p.hat !== false) { g.beginPath(); g.ellipse(0, -184, 30, 6, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-15, -186); g.quadraticCurveTo(-4, -230, 18 + Math.sin(t * 3) * 4, -246); g.quadraticCurveTo(6, -220, 15, -186); g.fill(); }
    if (p.scarf) { g.fillStyle = p.scarf; g.fillRect(-18, -154, 36, 8); g.beginPath(); g.moveTo(12, -150); for (let k = 1; k <= 5; k++) g.lineTo(12 + k * 9, -150 + Math.sin(t * 12 + k) * k * 1.6 + k * 2); for (let k = 5; k >= 1; k--) g.lineTo(12 + k * 9, -144 + Math.sin(t * 12 + k) * k * 1.6 + k * 2); g.fill(); }
    if (p.wand) { g.strokeStyle = g.fillStyle; g.lineWidth = 3; const hx = 16 + Math.cos(aa) * 46, hy = -140 + Math.sin(aa) * 46; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(aa) * 34, hy + Math.sin(aa) * 34); g.stroke(); g.restore(); const lx = hx + Math.cos(aa) * 34, ly = hy + Math.sin(aa) * 34, rr = p.lean || 0, fx = p.flip ? -1 : 1; return [x + fx * (lx * Math.cos(rr) - ly * Math.sin(rr)) * s, y + (lx * Math.sin(rr) + ly * Math.cos(rr)) * s]; }
    g.restore(); return [x, y - 170 * s];
  }
  const finish = (g, W, Hh, dpr, t, T, U, title, sub) => {
    H.vignette(g, W, Hh, 0.88); H.grain(g, W, Hh, 0.09);
    tt(g, W, dpr, title, Hh * 0.08, 30, '#f0dcb0', ease(t / 0.6));
    if (sub && t > T - 2.6) tt(g, W, dpr, sub, Hh * 0.9, 24, '#ffe0c0', clamp((t - (T - 2.6)) * 3));
  };
  const blood = [];
  function spray(x, y, n, sp, t0, col) { for (let i = 0; i < n; i++) blood.push({ x, y, vx: rnd(-sp, sp), vy: rnd(-sp * 1.4, sp * 0.3), r: rnd(1.5, 5), t: t0 + rnd(0, 0.2), c: col || '#8a0008' }); }
  function drawBlood(g, t, U) { for (let i = blood.length - 1; i >= 0; i--) { const d = blood[i], a = t - d.t; if (a > 1.8) { blood.splice(i, 1); continue; } if (a < 0) continue; g.fillStyle = d.c; g.beginPath(); g.ellipse(d.x + d.vx * a * 60 * U, d.y + (d.vy * a * 60 + a * a * 300) * U, d.r * U, d.r * U * (1 + a * 0.8), 0, 0, 7); g.fill(); } }

  // ======================= 鳳凰重生 =======================
  // 看得懂的三段：老鳳凰身上冒火 → 整隻燒成一堆灰 → 灰裡竄出一隻巨大的火鳥展翅
  function fireBird(g, x, y, s, t, a, flap) {
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a; g.globalCompositeOperation = 'lighter';
    const feather = (x0, y0, ang, len, w, k) => { const gr = g.createLinearGradient(x0, y0, x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len); gr.addColorStop(0, 'rgba(255,250,210,.9)'); gr.addColorStop(0.35, 'rgba(255,190,60,.75)'); gr.addColorStop(0.8, 'rgba(255,80,20,.5)'); gr.addColorStop(1, 'rgba(200,20,0,0)');
      g.fillStyle = gr; const wob = Math.sin(t * 9 + k) * 0.06; g.beginPath(); g.moveTo(x0 + Math.cos(ang + 1.57) * w, y0 + Math.sin(ang + 1.57) * w); g.quadraticCurveTo(x0 + Math.cos(ang + wob) * len * 0.6 + Math.cos(ang + 1.57) * w, y0 + Math.sin(ang + wob) * len * 0.6 + Math.sin(ang + 1.57) * w, x0 + Math.cos(ang + wob * 2) * len, y0 + Math.sin(ang + wob * 2) * len); g.quadraticCurveTo(x0 + Math.cos(ang + wob) * len * 0.6 - Math.cos(ang + 1.57) * w, y0 + Math.sin(ang + wob) * len * 0.6 - Math.sin(ang + 1.57) * w, x0 - Math.cos(ang + 1.57) * w, y0 - Math.sin(ang + 1.57) * w); g.fill(); };
    // 兩邊翅膀：一排長羽毛從肩膀往外放射
    [-1, 1].forEach(sd => { for (let k = 0; k < 14; k++) { const u = k / 13, ang = sd < 0 ? Math.PI + (-0.9 + u * 1.3 - flap * 0.5) * -1 : (-0.9 + u * 1.3 - flap * 0.5) * -1 + 0, sx = sd * (20 + u * 40); feather(sx, -20 + u * 10, sd < 0 ? Math.PI - (0.9 - u * 1.25 + flap * 0.6) : (0.9 - u * 1.25 + flap * 0.6) * -1 + 0, 160 - Math.abs(u - 0.4) * 90, 14, k + sd * 20); } });
    // 尾羽：長長往下飄
    for (let k = 0; k < 9; k++) feather(0, 30, Math.PI / 2 + (k - 4) * 0.09 + Math.sin(t * 2 + k) * 0.05, 200 + (4 - Math.abs(k - 4)) * 30, 9, k + 50);
    // 身體與頭
    const bg = g.createRadialGradient(0, -10, 0, 0, -10, 60); bg.addColorStop(0, 'rgba(255,255,230,1)'); bg.addColorStop(0.5, 'rgba(255,200,80,.85)'); bg.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = bg; g.beginPath(); g.ellipse(0, 0, 34, 60, 0, 0, 7); g.fill();
    const hg = g.createRadialGradient(0, -72, 0, 0, -72, 26); hg.addColorStop(0, 'rgba(255,255,235,1)'); hg.addColorStop(0.6, 'rgba(255,210,90,.9)'); hg.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = hg; g.beginPath(); g.arc(0, -72, 26, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,220,120,.85)'; g.beginPath(); g.moveTo(-12, -60); g.quadraticCurveTo(0, -40, 12, -60); g.lineTo(8, -20); g.lineTo(-8, -20); g.fill(); for (let k = 0; k < 5; k++) feather(0, -90, -Math.PI / 2 + (k - 2) * 0.3, 44, 5, k + 80);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(255,236,170,1)'; g.beginPath(); g.moveTo(-14, -78); g.quadraticCurveTo(-34, -76, -40, -64); g.quadraticCurveTo(-28, -68, -14, -66); g.fill(); g.fillStyle = '#3a0a00'; g.beginPath(); g.ellipse(-6, -76, 3.5, 2.5, 0, 0, 7); g.fill();
    g.restore();
  }
  M.phoenix = function (ui, SFX, e) {
    const emb = H.embers(120), ash = Array.from({ length: 160 }, () => ({ x: rnd(-1, 1), y: rnd(-1, 1), v: rnd(0.3, 1) }));
    const snd = () => { if (!SFX) return; const T = SFX.tone, N = SFX.noise;
      T(330, 0.5, { vol: 0.03, glide: 300, delay: 0.1 }); T(280, 0.7, { vol: 0.03, glide: 230, delay: 0.5 }); // 虛弱的鳥叫
      N(1.4, { f: 1800, type: 'bandpass', q: 0.6, vol: 0.07, attack: 0.5, delay: 0.7 }); for (let i = 0; i < 26; i++) N(0.05, { f: 2000 + Math.random() * 3000, type: 'bandpass', q: 3, vol: 0.05, delay: 0.8 + i * 0.05 });
      T(55, 1.0, { vol: 0.08, delay: 1.7 }); [2.0, 2.4].forEach(d => T(70, 0.15, { vol: 0.12, wet: false, delay: d }));
      N(0.8, { f: 500, vol: 0.18, delay: 2.75 }); T(80, 1.2, { glide: 40, vol: 0.15, wet: false, delay: 2.75 }); T(196, 2.0, { type: 'sawtooth', glide: 784, vol: 0.04, lp: 2500, delay: 2.75 });
      [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 2.2, { type: 'sine', vol: 0.035, attack: 0.3, delay: 2.9 + i * 0.04 }));
      T(1568, 0.6, { type: 'triangle', glide: 2093, vol: 0.04, delay: 3.1 });
    };
    const amt = (() => { const th = root.MONO_THEMES[ui.v.theme]; return th ? th.unit : ''; })();
    return ui.overlay(6400, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, cx = W / 2, gy = Hh * 0.7;
      hall(g, W, Hh, t, U, { moon: true });
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, Hh);
      // 石台
      g.fillStyle = '#0c0d18'; g.fillRect(cx - 70 * U, gy, 140 * U, 18 * U); g.fillRect(cx - 50 * U, gy + 18 * U, 100 * U, Hh);
      if (t < 1.6) { // 老鳳凰：暗淡、垂著頭，身上開始冒火
        const burn = clamp((t - 0.6) / 1.0);
        rim(g, W, Hh, dpr, `rgba(255,120,40,${0.4 + burn * 0.5})`, 18 + burn * 30, o => { o.save(); o.translate(cx, gy); o.scale(U, U); o.beginPath(); o.ellipse(0, -40, 30, 40, 0.3, 0, 7); o.fill(); o.beginPath(); o.ellipse(-22, -78 + Math.sin(t * 2) * 2, 13, 12, 0, 0, 7); o.fill(); o.beginPath(); o.moveTo(-32, -78); o.lineTo(-46, -66); o.lineTo(-30, -72); o.fill();
          for (let k = 0; k < 6; k++) { o.beginPath(); o.moveTo(18, -20); o.quadraticCurveTo(50 + k * 4, -10 + k * 6, 60 + k * 6, 30 + k * 10); o.lineTo(20, -10); o.fill(); } o.fillRect(-6, -4, 3, 8); o.fillRect(4, -4, 3, 8); o.restore(); });
        if (burn > 0) { H.flames(g, cx - 50 * U * burn, cx + 50 * U * burn, gy, 120 * U * burn, t, 9 * U, 4, 0.9); }
      } else if (t < 2.7) { // 灰燼
        const k = (t - 1.6) / 1.1;
        if (k < 0.3) H.flames(g, cx - 50 * U, cx + 50 * U, gy, 120 * U * (1 - k / 0.3), t, 9 * U, 4, 0.9);
        ash.forEach(p => { const yy = gy - 40 * U + p.y * 40 * U + Math.min(1, k * 2) * (40 * U - p.y * 40 * U), xx = cx + p.x * 45 * U * (1 + k * 0.3); g.fillStyle = `rgba(${120 + p.v * 60},${110 + p.v * 40},${100},${0.9})`; g.fillRect(xx, yy, 2.4 * dpr, 2.4 * dpr); });
        g.fillStyle = '#3a3634'; g.beginPath(); g.ellipse(cx, gy, 54 * U * Math.min(1, k * 2), 14 * U, 0, Math.PI, 0); g.fill();
        // 灰堆裡的心跳紅光
        const hb = Math.max(0, Math.sin((t - 2.0) * 16)) * (t > 2.0 ? 1 : 0); const hg = g.createRadialGradient(cx, gy - 4 * U, 0, cx, gy - 4 * U, 50 * U); hg.addColorStop(0, `rgba(255,140,40,${0.8 * hb})`); hg.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = hg; g.fillRect(cx - 50 * U, gy - 54 * U, 100 * U, 100 * U);
      } else { // 浴火重生
        const k = t - 2.7, up = ease(k / 1.2);
        H.rays(g, cx, gy - 120 * U * up, Hh, 18, t, 'rgba(255,200,110,A)', 0.4 * Math.min(1, k * 3), 6.28, 0);
        if (k < 0.25) { g.fillStyle = `rgba(255,240,200,${1 - k / 0.25})`; g.fillRect(0, 0, W, Hh); }
        H.flames(g, cx - 70 * U, cx + 70 * U, gy, 160 * U * (1 - up * 0.6), t, 10 * U, 6, 0.9);
        fireBird(g, cx, gy - 40 * U - up * 190 * U, U * (0.5 + up * 0.75), t, Math.min(1, k * 2.5), Math.sin(t * 5) * 0.8);
        // 飄下來的一根火羽毛
        if (k > 1.0) { const fk = (k - 1.0) / 1.1, fx = cx + Math.sin(fk * 6) * 50 * U, fy2 = Hh * 0.3 + fk * Hh * 0.4; g.save(); g.translate(fx, fy2); g.rotate(Math.sin(fk * 6) * 0.6); g.globalCompositeOperation = 'lighter'; const fg = g.createLinearGradient(0, -40 * U, 0, 40 * U); fg.addColorStop(0, 'rgba(255,250,200,.95)'); fg.addColorStop(1, 'rgba(255,80,20,.2)'); g.fillStyle = fg; g.beginPath(); g.ellipse(0, 0, 9 * U, 40 * U, 0, 0, 7); g.fill(); g.restore(); }
      }
      H.drawEmbers(g, emb, W, Hh, t, dpr, 'rgba(255,170,70,A)', 1.4);
      finish(g, W, Hh, dpr, t, 6.4, U, '鳳 凰 重 生', `你的錢包也跟著重生了`);
    }, snd);
  };

  // ======================= 魔法學院破產 =======================
  // 債主角色 i：0 見習巫師（石化咒）1 大巨蛇 2 貓頭鷹 3 小火龍 4 獨角獸 5 鳳凰 6 人馬 7 狼人；-1 沒有債主＝怪獸書
  const NAMES = ['被石化咒變成石像，碎了一地', '被大巨蛇一口吞下', '被貓頭鷹群叼走了', '被小火龍燒成焦炭', '被獨角獸一角頂飛', '被鳳凰之火吞沒', '被人馬一箭射穿', '被狼人撲倒撕碎'];
  function owl(g, x, y, s, ph) { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.ellipse(0, 0, 18, 22, 0, 0, 7); g.fill(); [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 6, -18); g.lineTo(sd * 14, -30); g.lineTo(sd * 16, -14); g.fill();
      g.save(); g.scale(sd, 1); g.rotate(Math.sin(ph) * 0.9); g.beginPath(); g.moveTo(10, -6); g.quadraticCurveTo(50, -30, 70, -10); g.lineTo(56, -4); g.lineTo(62, 4); g.lineTo(46, 4); g.lineTo(50, 12); g.quadraticCurveTo(26, 10, 10, 8); g.fill(); g.restore(); }); g.restore(); }
  // 狼人剪影：駝背、長吻、尖耳、肌肉手臂、利爪、反關節腿；pose: howl / crouch / leap / maul
  function werewolf(o, x, y, s, pose, t, flip) {
    o.save(); o.translate(x, y); o.scale(s * (flip ? -1 : 1), s);
    const P = { howl: { lean: -0.15, head: -1.0, la: -2.0, ra: -1.1, crouch: 0 }, crouch: { lean: 0.5, head: 0.1, la: 0.9, ra: 0.6, crouch: 1 }, leap: { lean: 0.9, head: 0.3, la: -0.2, ra: 0.2, crouch: 0.3 }, maul: { lean: 0.6, head: 0.5, la: -0.4 + Math.sin(t * 18) * 1.2, ra: 0.6 - Math.sin(t * 18 + 1.5) * 1.2, crouch: 0.6 } }[pose];
    const hipY = -110 + P.crouch * 35;
    // 反關節腿
    [-1, 1].forEach(sd => { limb(o, sd * 14, hipY, sd * 22 + 24, hipY + 50, 18, 13); limb(o, sd * 22 + 24, hipY + 50, sd * 14 - 4, -12, 12, 8); limb(o, sd * 14 - 4, -12, sd * 14 + 22, 0, 8, 5); });
    o.save(); o.translate(0, hipY); o.rotate(P.lean);
    // 軀幹：寬肩窄腰，背上一排毛
    const fur = H.furOutline([[-26, 0], [-40, -60], [-58, -120], [-30, -150], [30, -150], [52, -110], [36, -50], [26, 0]], 21, 13); o.beginPath(); o.moveTo(-26, 0); fur.forEach(([fx, fy]) => o.lineTo(fx, fy)); o.closePath(); o.fill();
    // 手臂＋爪
    [[P.la, -1], [P.ra, 1]].forEach(([a, sd]) => { const sx = sd * 40, sy = -132, ex = sx + Math.cos(a + (sd < 0 ? Math.PI : 0)) * 0 + Math.sin(a) * 60 * sd, ey = sy + Math.cos(a) * 60; limb(o, sx, sy, ex, ey, 17, 13); const hx = ex + Math.sin(a + 0.4 * sd) * 58 * sd, hy = ey + Math.cos(a + 0.4 * sd) * 58; limb(o, ex, ey, hx, hy, 13, 10);
      for (let k = -1; k <= 1; k++) { o.beginPath(); o.moveTo(hx + k * 6, hy); o.quadraticCurveTo(hx + k * 9 + Math.sin(a) * 18 * sd, hy + 16, hx + k * 8 + Math.sin(a) * 30 * sd, hy + 26); o.lineTo(hx + k * 6 + 3, hy + 2); o.fill(); } });
    // 頭：長吻、尖耳、張嘴
    o.save(); o.translate(10, -160); o.rotate(P.head); o.beginPath(); o.ellipse(0, 0, 28, 24, 0, 0, 7); o.fill();
    const jaw = pose === 'howl' ? 0.35 : pose === 'maul' ? 0.25 + Math.abs(Math.sin(t * 9)) * 0.2 : 0.15;
    o.beginPath(); o.moveTo(10, -14); o.lineTo(72, -6); o.lineTo(70, 4); o.lineTo(14, 6); o.fill();
    o.save(); o.translate(14, 6); o.rotate(jaw); o.beginPath(); o.moveTo(0, 0); o.lineTo(54, 2); o.lineTo(50, 10); o.lineTo(0, 12); o.fill(); o.restore();
    [[-14, 0], [6, 1]].forEach(([ex]) => { o.beginPath(); o.moveTo(ex - 10, -18); o.lineTo(ex - 2, -56); o.lineTo(ex + 10, -16); o.fill(); });
    o.restore(); o.restore(); o.restore();
    return { eye: [x + (flip ? -1 : 1) * s * 26, y + s * (hipY - 168)], head: [x + (flip ? -1 : 1) * s * 40, y + s * (hipY - 160)] };
  }
  // 大巨蛇：身體是一條連續的粗曲線，頭接在曲線末端、沿著方向轉
  function serpent(o, base, head, ctrl, U, jaw, swallow) {
    const [bx, by] = base, [hx, hy] = head, [c1x, c1y, c2x, c2y] = ctrl, ang = Math.atan2(hy - c2y, hx - c2x);
    o.lineCap = 'round'; o.lineJoin = 'round';
    for (let k = 0; k < 2; k++) { o.lineWidth = (k ? 40 : 54) * U; o.beginPath(); o.moveTo(bx, by); o.bezierCurveTo(c1x, c1y, c2x, c2y, hx - Math.cos(ang) * 20 * U, hy - Math.sin(ang) * 20 * U); o.stroke(); }
    if (swallow >= 0) { const u = 1 - swallow, x = (1 - u) ** 3 * bx + 3 * (1 - u) ** 2 * u * c1x + 3 * (1 - u) * u * u * c2x + u ** 3 * hx, y = (1 - u) ** 3 * by + 3 * (1 - u) ** 2 * u * c1y + 3 * (1 - u) * u * u * c2y + u ** 3 * hy; o.beginPath(); o.ellipse(x, y, 46 * U, 38 * U, ang, 0, 7); o.fill(); }
    // 頭（以下顎鉸接點為軸）：上顎有眉骨突起、尖吻；張嘴時上下顎分開
    o.save(); o.translate(hx, hy); o.rotate(ang); o.scale(U * 1.3, U * 1.3);
    o.beginPath(); o.ellipse(-36, 2, 24, 22, 0, 0, 7); o.fill(); // 後腦（毒腺）
    o.save(); o.translate(-18, 4); o.rotate(-jaw * 0.7); o.translate(18, -4);
    o.beginPath(); o.moveTo(-50, -18); o.quadraticCurveTo(-30, -36, -6, -32); o.lineTo(2, -40); o.lineTo(8, -30); o.quadraticCurveTo(28, -26, 48, -14); o.quadraticCurveTo(60, -8, 56, 0); o.lineTo(-18, 4); o.lineTo(-50, 16); o.closePath(); o.fill(); o.restore();
    o.save(); o.translate(-18, 4); o.rotate(jaw * 0.7); o.translate(18, -4);
    o.beginPath(); o.moveTo(-18, 4); o.lineTo(50, 4); o.quadraticCurveTo(46, 16, 20, 20); o.lineTo(-44, 26); o.closePath(); o.fill(); o.restore();
    o.restore(); return ang;
  }
  // 蛇眼、毒牙、嘴裡：畫在剪影上面
  function serpentFace(g, hx, hy, ang, U, jaw, dpr) {
    g.save(); g.translate(hx, hy); g.rotate(ang); g.scale(U * 1.3, U * 1.3);
    if (jaw > 0.2) { g.fillStyle = '#4a0612'; g.beginPath(); g.moveTo(-18, 4); const a1 = -jaw * 0.7, a2 = jaw * 0.7; g.lineTo(-18 + Math.cos(a1) * 70, 4 + Math.sin(a1) * 70); g.lineTo(-18 + Math.cos(a2) * 64, 4 + Math.sin(a2) * 64); g.closePath(); g.fill();
      g.save(); g.translate(-18, 4); g.rotate(-jaw * 0.7); g.translate(18, -4); g.fillStyle = '#f2efe6'; [[38, 26], [26, 14]].forEach(([x, l]) => { g.beginPath(); g.moveTo(x - 3, 2); g.quadraticCurveTo(x, 2 + l * 0.7, x + 1, 2 + l); g.lineTo(x + 4, 2); g.fill(); }); g.restore();
      g.save(); g.translate(-18, 4); g.rotate(jaw * 0.7); g.translate(18, -4); g.strokeStyle = '#c0283a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(20, 10); g.lineTo(52, 8 + Math.sin(performance.now() / 60) * 4); g.lineTo(60, 2); g.moveTo(52, 8); g.lineTo(60, 14); g.stroke(); g.restore(); }
    // 眼睛跟著上顎轉；直立的瞳孔、往下壓的眉
    g.save(); g.translate(-18, 4); g.rotate(-jaw * 0.7); g.translate(18, -4); g.globalCompositeOperation = 'lighter';
    const eg = g.createRadialGradient(-4, -18, 0, -4, -18, 16); eg.addColorStop(0, 'rgba(255,255,170,1)'); eg.addColorStop(0.35, 'rgba(230,210,0,.85)'); eg.addColorStop(1, 'rgba(200,180,0,0)'); g.fillStyle = eg; g.fillRect(-20, -34, 32, 32); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#100800'; g.beginPath(); g.ellipse(-4, -18, 1.8, 6, 0, 0, 7); g.fill(); g.restore();
    g.restore();
  }
  M.death = function (ui, SFX, e) {
    const v = ui.v, by = e.by, kind = by >= 0 && v.players[by] && v.players[by].char && v.players[by].char.kind !== 'custom' ? v.players[by].char.i % 8 : by >= 0 ? 0 : -1;
    blood.length = 0; const emb = H.embers(70);
    let sd0 = 77; const R0 = () => (sd0 = (sd0 * 16807) % 2147483647) / 2147483647;
    const shards = Array.from({ length: 46 }, () => ({ x: R0() * 44 - 22, y: -R0() * 240, vx: R0() * 8 - 4, vy: -R0() * 6 - 1, r: R0() * 6, s: 6 + R0() * 14, c: 70 + R0() * 40 }));
    const owls = Array.from({ length: 22 }, (_, i) => ({ a: rnd(0, 6.28), d: rnd(0.2, 1.0), p: rnd(0, 6), o: rnd(-70, 70), q: rnd(-40, 30), front: i % 2 }));
    const paper = Array.from({ length: 40 }, () => ({ vx: rnd(-6, 6), vy: rnd(-8, -2), r: rnd(0, 6) }));
    let lastShk = 0, zoomF = null; const T0 = 5.4, persist = {};
    const stoneTex = H.smoke('stone', [150, 146, 140], 0.0, 53);
    const snd = () => { if (!SFX) return; const T = SFX.tone, N = SFX.noise;
      T(49, 5, { type: 'sawtooth', vol: 0.05, lp: 220, attack: 0.4 }); T(147, 2.5, { vol: 0.04, detune: -20, delay: 0.1 }); T(156, 2.5, { vol: 0.03, delay: 0.1 });
      if (kind === -1) { for (let i = 0; i < 14; i++) { N(0.08, { f: 300, vol: 0.12, delay: 0.3 + i * 0.17 }); T(90, 0.08, { vol: 0.08, wet: false, delay: 0.3 + i * 0.17 }); } T(180, 0.5, { type: 'sawtooth', glide: 90, vol: 0.06, lp: 900, delay: 0.8 }); for (let i = 0; i < 10; i++) { N(0.12, { f: 2500, type: 'bandpass', vol: 0.08, delay: 2.6 + i * 0.13 }); N(0.1, { f: 400, vol: 0.12, delay: 2.65 + i * 0.13 }); } T(1300, 0.8, { type: 'sawtooth', glide: 600, vol: 0.05, lp: 3000, delay: 2.55 }); }
      if (kind === 0) { for (let i = 0; i < 8; i++) T(800 + i * 100, 0.15, { type: 'triangle', vol: 0.03, delay: 0.6 + i * 0.05 }); T(220, 1.5, { type: 'square', glide: 110, vol: 0.03, lp: 700, delay: 1.3 }); for (let i = 0; i < 14; i++) N(0.04, { f: 3000, type: 'bandpass', vol: 0.06, delay: 1.5 + i * 0.12 }); N(0.9, { f: 1500, vol: 0.18, delay: 3.2 }); for (let i = 0; i < 16; i++) T(3000 + Math.random() * 2000, 0.1, { type: 'square', vol: 0.02, lp: 7000, delay: 3.2 + Math.random() * 0.6 }); }
      if (kind === 1) { N(1.4, { f: 4000, type: 'highpass', vol: 0.05, delay: 0.4 }); T(300, 0.8, { type: 'sawtooth', glide: 120, vol: 0.05, lp: 1200, delay: 1.3 }); N(0.4, { f: 600, vol: 0.2, delay: 1.95 }); T(70, 0.6, { glide: 35, vol: 0.2, delay: 2.0 }); T(55, 1.2, { glide: 40, vol: 0.12, delay: 2.6 }); }
      if (kind === 2) { for (let i = 0; i < 22; i++) { T(420 + Math.random() * 120, 0.3, { glide: 350, vol: 0.025, delay: 0.3 + i * 0.15 }); N(0.06, { f: 500, vol: 0.06, delay: 0.3 + i * 0.12 }); } }
      if (kind === 3 || kind === 5) { N(2.2, { f: 700, vol: 0.14, attack: 0.2, delay: 1.0 }); T(120, 2, { type: 'sawtooth', glide: 60, vol: 0.05, lp: 500, delay: 1.0 }); T(1200, 1.0, { type: 'sawtooth', glide: 400, vol: 0.05, lp: 3000, delay: 1.4 }); }
      if (kind === 4) { for (let i = 0; i < 10; i++) N(0.06, { f: 250, vol: 0.14, delay: 0.2 + i * 0.14 }); T(1800, 0.8, { glide: 2600, vol: 0.04, delay: 1.5 }); N(0.3, { f: 500, vol: 0.22, delay: 1.6 }); T(900, 0.9, { type: 'sawtooth', glide: 1500, vol: 0.04, lp: 3000, delay: 1.65 }); }
      if (kind === 6) { T(240, 0.8, { type: 'sawtooth', glide: 300, vol: 0.03, lp: 900, delay: 0.5 }); N(0.5, { f: 3000, type: 'bandpass', vol: 0.1, delay: 1.6 }); N(0.15, { f: 700, vol: 0.22, delay: 2.4 }); T(900, 0.7, { type: 'sawtooth', glide: 400, vol: 0.05, lp: 2600, delay: 2.45 }); }
      if (kind === 7) { T(250, 2.0, { type: 'sawtooth', glide: 520, vol: 0.06, lp: 1600, delay: 0.3 }); T(260, 2.0, { type: 'square', glide: 540, vol: 0.02, lp: 1600, delay: 0.3 }); T(90, 0.5, { type: 'sawtooth', vol: 0.08, lp: 600, delay: 2.2 }); N(0.4, { f: 800, vol: 0.2, delay: 2.55 }); for (let i = 0; i < 7; i++) N(0.12, { f: 2500, type: 'highpass', vol: 0.1, delay: 2.7 + i * 0.16 }); [3.9, 4.0, 4.1].forEach(d => N(0.12, { f: 3000, type: 'highpass', vol: 0.14, delay: d })); }
    };
    return ui.overlay(T0 * 1000, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, gy = Hh * 0.86, vx = W * 0.38; let shk = 0; zoomF = null; let zoom = 1;
      // 鏡頭：撞擊時往焦點推近一點
      const cam = (fx, fy, z) => { zoomF = [fx, fy]; zoom = z; };
      const S = U * 0.95;
      // 先把每一種要的參數算好，再一次畫（攻擊者畫在破產者「前面」）
      const draws = []; let victim = { show: true, x: vx, y: gy, rot: 0, pose: { arms: -0.4, scarf: '#9a2020' }, glow: 'rgba(160,180,255,.55)', fill: null };
      if (kind === -1) { // 怪獸書：從右邊跳著追過來，學生往左逃，撲上去狂咬
        const run = t < 2.5, bx = run ? W * (1.3 - t * 0.34) : W * 0.42, hop = run ? Math.abs(Math.sin(t * 9)) * 40 * U : 0, caught = !run;
        victim.x = run ? W * (0.62 - t * 0.12) : W * 0.32; victim.pose = { run: 1, lean: 0.25, arms: -0.9, scarf: '#9a2020', flip: true }; victim.show = !caught;
        if (caught) { cam(W * 0.42, gy - 90 * U, 1.12); if (t < 2.7) shk = 14; }
        const open = caught ? (t < 4.0 ? 0.15 + Math.abs(Math.sin(t * 12)) * 0.4 : 0.1) : 0.35 + Math.abs(Math.sin(t * 9)) * 0.55, bs = caught ? 1.7 : 1.15, rot = caught ? Math.sin(t * 17) * 0.18 : 0.1;
        const bxx = bx + (caught ? Math.sin(t * 40) * 10 * U : 0), byy = gy - 60 * U * bs - hop;
        draws.push(() => { rim(g, W, Hh, dpr, 'rgba(120,255,140,.35)', 16, o => { o.save(); o.translate(bxx, byy); o.scale(-U * bs, U * bs); o.rotate(rot);
          const cover = () => { const fur = H.furOutline([[-70, 0], [-70, -10], [-50, -50], [50, -50], [70, -10], [70, 0]], 3, 9); o.beginPath(); o.moveTo(-70, 0); fur.forEach(([x, y]) => o.lineTo(x, y)); o.closePath(); o.fill(); };
          o.save(); o.rotate(-open * 0.6); cover(); o.restore(); o.save(); o.rotate(open * 0.25); o.scale(1, -1); cover(); o.restore(); o.restore(); });
          g.save(); g.translate(bxx, byy); g.scale(-U * bs, U * bs); g.rotate(rot);
          g.save(); g.rotate(-open * 0.6); g.fillStyle = '#efe6d0'; for (let k = 0; k < 10; k++) { g.beginPath(); g.moveTo(-60 + k * 12, -2); g.lineTo(-54 + k * 12, 14); g.lineTo(-48 + k * 12, -2); g.fill(); } g.restore();
          g.save(); g.rotate(open * 0.25); g.fillStyle = '#efe6d0'; for (let k = 0; k < 10; k++) { g.beginPath(); g.moveTo(-60 + k * 12, 2); g.lineTo(-54 + k * 12, -12); g.lineTo(-48 + k * 12, 2); g.fill(); } g.fillStyle = '#7a1018'; g.beginPath(); g.ellipse(-10, 6, 36, 6, 0, 0, Math.PI); g.fill(); g.restore();
          g.save(); g.rotate(-open * 0.6); g.globalCompositeOperation = 'lighter'; const eg = g.createRadialGradient(20, -30, 0, 20, -30, 14); eg.addColorStop(0, 'rgba(255,255,160,1)'); eg.addColorStop(0.4, 'rgba(160,255,80,.8)'); eg.addColorStop(1, 'rgba(0,255,0,0)'); g.fillStyle = eg; g.fillRect(6, -44, 28, 28); g.restore(); g.restore();
          if (caught) { if (t < 4.0 && Math.random() < 0.7) spray(bx, gy - 90 * U, 3, 4, t); const k2 = t - 2.5; paper.forEach(p => { if (k2 > 2.2) return; g.save(); g.translate(bx + p.vx * k2 * 40 * U, gy - 90 * U + (p.vy * k2 * 40 + k2 * k2 * 120) * U); g.rotate(p.r + k2 * 6); g.fillStyle = 'rgba(230,220,200,.9)'; g.fillRect(-7 * U, -9 * U, 14 * U, 18 * U); g.restore(); });
            if (t > 4.1) { const hk = t - 4.1; g.save(); g.translate(bx + 40 * U + hk * 60 * U, gy - 120 * U - hk * 120 * U + hk * hk * 300 * U); g.rotate(-hk * 5); g.fillStyle = '#0a0812'; g.beginPath(); g.moveTo(-20 * U, 0); g.quadraticCurveTo(-4 * U, -40 * U, 16 * U, -54 * U); g.quadraticCurveTo(6 * U, -30 * U, 18 * U, 0); g.fill(); g.restore(); } } });
      } else if (kind === 0) { // 石化咒：巫師在右邊面對破產者，光束打中→由下往上變石像→裂→碎
        const hit = 1.3, stone = clamp((t - hit) / 1.4), crack = clamp((t - 2.7) / 0.6), shat = t > 3.4 ? t - 3.4 : 0;
        victim.pose = { arms: stone > 0 ? -2.3 : -0.4, lean: stone > 0 ? -0.05 : 0, scarf: stone > 0.5 ? null : '#9a2020' }; victim.show = !shat; victim.frozen = stone > 0 ? hit : null;
        if (stone > 0) victim.stone = stone; if (crack > 0) victim.crack = crack;
        if (t > hit - 0.1 && t < hit + 0.35) { shk = 6; cam(vx, gy - 120 * U, 1.06); }
        if (shat && shat < 0.3) { shk = 12; cam(vx, gy - 120 * U, 1.1); }
        draws.push(() => { const wand = rim(g, W, Hh, dpr, 'rgba(160,190,255,.6)', 16, o => student(o, W * 0.8, gy, S * 1.05, { arms: -0.35 - Math.min(1, t) * 0.3, wand: true, scarf: '#5a3aa0', flip: true }, t));
          if (t > 0.7 && t < hit + 0.5) { const k = clamp((t - 0.7) / 0.6), tx = wand[0] + (vx - wand[0]) * k, ty = wand[1] + (gy - 120 * S - wand[1]) * k; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(220,230,255,.95)'; g.lineWidth = 5 * dpr; g.shadowColor = '#a0b8ff'; g.shadowBlur = 24 * dpr; g.beginPath(); g.moveTo(wand[0], wand[1]); for (let q = 1; q <= 12; q++) g.lineTo(wand[0] + (tx - wand[0]) * q / 12 + rnd(-6, 6) * U, wand[1] + (ty - wand[1]) * q / 12 + rnd(-6, 6) * U); g.stroke(); g.restore(); }
          if (shat) { shards.forEach(p => { const k = shat; g.save(); g.translate(vx + (p.x + p.vx * k * 50) * S, gy + (p.y + p.vy * k * 40 + k * k * 300) * S); g.rotate(p.r + k * 4); g.fillStyle = `rgb(${p.c},${p.c - 2},${p.c - 6})`; g.beginPath(); g.moveTo(-p.s * S, 0); g.lineTo(-p.s * S * 0.2, -p.s * S * 0.8); g.lineTo(p.s * S * 0.7, -p.s * S * 0.2); g.lineTo(p.s * S * 0.4, p.s * S * 0.5); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(-p.s * S, 0); g.lineTo(-p.s * S * 0.2, -p.s * S * 0.8); g.lineTo(0, -p.s * S * 0.3); g.fill(); g.restore(); });
            g.fillStyle = 'rgba(160,156,150,.45)'; g.beginPath(); g.ellipse(vx, gy, 70 * U * Math.min(1, shat * 2), 14 * U, 0, 0, 7); g.fill(); } });
      } else if (kind === 1) { // 大巨蛇：從破產者前方地面竄起、張大嘴、整個吞下、吞嚥的鼓包往下滑
        const rise = ease(t / 1.1), strike = ease(clamp((t - 1.7) / 0.28)), back = ease(clamp((t - 2.2) / 0.9)), jaw = t < 1.2 ? 0.1 : t < 2.0 ? 0.25 + clamp((t - 1.2) / 0.5) * 0.85 : t < 2.3 ? 0.15 : 0.05;
        victim.pose = { arms: t > 1.2 ? -2.5 : -0.4, lean: t > 1.2 ? -0.15 : 0, scarf: '#9a2020' }; victim.show = t < 1.98;
        if (t > 1.9 && t < 2.2) { shk = 12; cam(vx, gy - 130 * U, 1.12); spray(vx, gy - 130 * U, 3, 4, t); }
        const hx0 = W * 0.75, hy0 = gy - 60 * U - rise * 230 * U, hx = hx0 + (vx + 30 * U - hx0) * strike * (1 - back * 0.85), hy = hy0 + (gy - 150 * U - hy0) * strike * (1 - back);
        draws.push(() => { rim(g, W, Hh, dpr, 'rgba(120,255,160,.4)', 22, o => { o.strokeStyle = o.fillStyle; serpent(o, [W * 1.15, gy + 60 * U], [hx, hy], [W * 0.75, gy + 40 * U, W * 1.05, hy + 60 * U], U * 1.15, jaw, t > 2.2 ? clamp((t - 2.2) / 2.0) : -1); });
          serpentFace(g, hx, hy, Math.atan2(hy - (hy + 60 * U), hx - W * 1.05), U * 1.15, jaw, dpr); });
      } else if (kind === 2) { // 貓頭鷹群：從四面八方包圍、抓住、拖出窗外
        const lift = ease((t - 2.0) / 2.4); victim.x = vx + lift * W * 0.12; victim.y = gy - lift * Hh * 0.65; victim.scale = 1 - lift * 0.55; victim.pose = { arms: -2.6 + Math.sin(t * 12) * 0.3, run: lift > 0 ? 0.6 : 0, scarf: '#9a2020' };
        const owlsAt = (front) => o => owls.forEach(p => { if (!!p.front !== front) return; const k = clamp((t - p.d) / 1.1), ox = victim.x + p.o * U * victim.scale, oy = victim.y - 200 * S * victim.scale + p.q * U, sx = ox + Math.cos(p.a) * (1 - k) * W, sy = oy - Math.abs(Math.sin(p.a)) * (1 - k) * Hh; owl(o, sx, sy, U * (front ? 1.1 : 0.8) * (1 - lift * 0.4), t * 16 + p.p); });
        victim.before = () => rim(g, W, Hh, dpr, 'rgba(160,180,255,.4)', 10, owlsAt(false));
        draws.push(() => { rim(g, W, Hh, dpr, 'rgba(160,180,255,.5)', 12, owlsAt(true)); g.fillStyle = 'rgba(200,190,170,.6)'; for (let q = 0; q < 16; q++) { const fk = ((t * 0.3 + q / 16) % 1); g.save(); g.translate((q * 0.06 + 0.1) * W + Math.sin(t * 2 + q) * 20 * U, fk * Hh); g.rotate(Math.sin(t * 3 + q)); g.beginPath(); g.ellipse(0, 0, 3 * U, 9 * U, 0, 0, 7); g.fill(); g.restore(); } });
      } else if (kind === 3 || kind === 5) { // 小火龍在右前方噴火／鳳凰從右上俯衝：燒成焦炭→化成灰
        const fire = clamp((t - 0.9) / 0.3), char = clamp((t - 1.4) / 1.0), crumble = clamp((t - 2.9) / 1.2);
        victim.pose = { arms: -2.4 + Math.sin(t * 15) * (1 - char) * 0.6, scarf: char > 0.3 ? null : '#9a2020' }; victim.char = char; victim.crumble = crumble;
        if (t > 0.9 && t < 1.2) cam(vx, gy - 120 * U, 1.08);
        draws.push(() => {
          if (kind === 3) rim(g, W, Hh, dpr, 'rgba(255,140,60,.6)', 18, o => { o.save(); o.translate(W * 0.78, gy); o.scale(-U * 1.15, U * 1.15); o.beginPath(); o.ellipse(0, -60, 60, 36, -0.1, 0, 7); o.fill(); limb(o, -30, -40, -36, 0, 12, 10); limb(o, 30, -40, 34, 0, 12, 10); o.beginPath(); o.moveTo(40, -80); o.quadraticCurveTo(70, -130, 100, -120); o.lineTo(130, -110); o.lineTo(100, -96); o.quadraticCurveTo(80, -90, 60, -60); o.fill();
            o.beginPath(); o.moveTo(-50, -60); o.quadraticCurveTo(-120, -50, -150, -90); o.lineTo(-140, -70); o.quadraticCurveTo(-110, -40, -50, -40); o.fill(); [-1, 1].forEach(sd => { o.save(); o.translate(-6, -86); o.rotate(sd * 0.25 + Math.sin(t * 8 + sd) * 0.25); o.beginPath(); o.moveTo(0, 0); o.lineTo(-30, -110); o.lineTo(-90, -120); o.quadraticCurveTo(-70, -90, -84, -66); o.quadraticCurveTo(-60, -60, -64, -34); o.quadraticCurveTo(-40, -30, -36, -6); o.closePath(); o.fill(); o.restore(); });
            [0, 10].forEach(d => { o.beginPath(); o.moveTo(76 + d, -124); o.lineTo(70 + d, -152); o.lineTo(86 + d, -122); o.fill(); }); o.restore(); });
          else fireBird(g, W * 0.8 - ease(t / 1.1) * W * 0.35, Hh * 0.12 + ease(t / 1.1) * Hh * 0.5, U * 0.55, t, Math.min(1, t * 2), Math.sin(t * 7));
          if (fire > 0 && t < 3.1) { const sx = kind === 3 ? W * 0.78 - 130 * U * 1.15 : vx + 60 * U, sy = kind === 3 ? gy - 112 * U * 1.15 : gy - 200 * U; g.save(); g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 80; q++) { const ph = (t * 1.8 + q / 80) % 1, x = sx + (vx - sx) * ph * fire, y = sy + (gy - 110 * U - sy) * ph + Math.sin(q * 3 + t * 20) * 30 * U * ph, r = (6 + ph * 34) * U; const fg = g.createRadialGradient(x, y, 0, x, y, r); fg.addColorStop(0, 'rgba(255,250,200,.85)'); fg.addColorStop(0.4, 'rgba(255,150,40,.55)'); fg.addColorStop(1, 'rgba(255,40,0,0)'); g.fillStyle = fg; g.fillRect(x - r, y - r, r * 2, r * 2); } g.restore(); }
          if (char > 0.6) H.flames(g, vx - 40 * U, vx + 40 * U, gy, 220 * U * (1 - crumble), t, 8 * U, 7, 0.85);
          if (crumble > 0) { for (let q = 0; q < 90; q++) { const k = crumble, x = vx + Math.sin(q * 7.1) * 40 * U + Math.sin(q) * k * 60 * U, y = gy - (q % 26) * 10 * U * (1 - k) - 4 * U; g.fillStyle = q % 3 ? 'rgba(60,50,46,.9)' : 'rgba(255,120,40,.8)'; g.fillRect(x, y, 3 * dpr, 3 * dpr); } g.fillStyle = '#2a2420'; g.beginPath(); g.ellipse(vx, gy, 50 * U * crumble, 10 * U, 0, Math.PI, 0); g.fill(); } });
      } else if (kind === 4) { // 獨角獸：從右側全速衝過來，低頭用角從側面撞，人被頂飛到左上方
        const hitT = 1.45, ux = W * (1.35 - Math.min(1, t / hitT) * 0.82) - (t > hitT ? (t - hitT) * W * 0.5 : 0), hit = t > hitT, fly = hit ? t - hitT : 0;
        if (!hit) victim.pose = { arms: t > 0.8 ? -2.5 : -0.4, lean: t > 0.8 ? -0.12 : 0, scarf: '#9a2020' };
        else { victim.x = vx - fly * 260 * U; victim.y = gy - fly * 560 * U + fly * fly * 230 * U; victim.rot = -fly * 10; victim.pose = { arms: -2.5, hat: false, scarf: '#9a2020' }; if (fly < 0.25) { shk = 16; cam(vx, gy - 120 * U, 1.14); } if (fly < 0.08) spray(vx, gy - 120 * U, 30, 6, t); }
        draws.push(() => { rim(g, W, Hh, dpr, 'rgba(230,230,255,.7)', 24, o => { o.save(); o.translate(ux, gy); o.scale(-U * 1.15, U * 1.15); const gal = t * 16, low = hit ? 0 : clamp((t - 0.9) / 0.4); o.beginPath(); o.ellipse(0, -80, 70, 30, 0, 0, 7); o.fill();
          [[-45, 0], [-30, 1], [35, 2], [50, 3]].forEach(([lx, q]) => { const a = Math.sin(gal + q * 1.6) * 0.7; limb(o, lx, -70, lx + Math.sin(a) * 40, -30, 9, 7); limb(o, lx + Math.sin(a) * 40, -30, lx + Math.sin(a) * 30 + Math.sin(a * 1.3) * 10, 0, 7, 6); });
          o.save(); o.translate(50, -96); o.rotate(low * 0.55); o.beginPath(); o.moveTo(-10, 0); o.quadraticCurveTo(12, -54, 34, -68); o.quadraticCurveTo(50, -76, 62, -64); o.lineTo(90, -32); o.quadraticCurveTo(94, -20, 82, -18); o.lineTo(54, -28); o.quadraticCurveTo(40, -4, 20, 26); o.fill(); o.beginPath(); o.moveTo(40, -74); o.lineTo(46, -90); o.lineTo(50, -72); o.fill();
          for (let q = 0; q < 9; q++) { const mx2 = 34 - q * 6, my2 = -72 + q * 9, sw2 = Math.sin(gal * 0.6 + q) * 8; o.beginPath(); o.moveTo(mx2, my2); o.quadraticCurveTo(mx2 - 26, my2 + 4 + sw2, mx2 - 40 + sw2, my2 + 18); o.lineTo(mx2 - 4, my2 + 10); o.fill(); } o.restore();
          o.beginPath(); o.moveTo(-66, -90); o.quadraticCurveTo(-120, -80, -130, -40); o.quadraticCurveTo(-100, -70, -66, -70); o.fill(); o.restore(); });
          const low = hit ? 0 : clamp((t - 0.9) / 0.4), hb = [ux - 50 * U * 1.15, gy - 96 * U * 1.15], ca = Math.PI - (-0.95 + low * 0.55); g.save(); g.translate(hb[0], hb[1]); g.scale(-1, 1); g.rotate(low * 0.55); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,250,220,1)'; g.lineWidth = 6 * U; g.shadowColor = '#fff'; g.shadowBlur = 20 * dpr; g.beginPath(); g.moveTo(66 * U * 1.15, -66 * U * 1.15); g.lineTo(108 * U * 1.15, -118 * U * 1.15); g.stroke(); g.restore(); void ca;
          if (hit) { g.save(); g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 36; q++) { const k = (q / 36), x = vx - k * fly * 260 * U, y = gy - 120 * U - k * fly * 560 * U + (k * fly) ** 2 * 230 * U; g.fillStyle = `rgba(255,${200 + (q % 3) * 20},255,${(1 - k) * 0.8})`; g.fillRect(x + Math.sin(q * 3) * 14 * U, y + Math.cos(q * 2) * 14 * U, 3 * dpr, 3 * dpr); } g.restore(); }
          g.fillStyle = 'rgba(120,120,150,.35)'; for (let q = 0; q < 8; q++) { const dk = (t * 2 + q / 8) % 1; g.beginPath(); g.arc(ux + 60 * U + dk * 80 * U, gy - dk * 30 * U, (8 + dk * 20) * U, 0, 7); g.fill(); } });
      } else if (kind === 6) { // 人馬：站在遠處拉弓→箭沿直線飛向破產者胸口（鏡頭跟著箭）→中箭往後倒
        const draw = clamp((t - 0.3) / 1.0), rel = 1.4, fly = clamp((t - rel) / 0.9), hit = t > rel + 0.9, cxn = W * 0.9, cs = U * 0.78;
        const bowX = cxn - 150 * cs, bowY = gy - 192 * cs, tx = vx + 18 * S, ty = gy - 150 * S; // 弓的位置、瞄準點（破產者胸口）
        const fall = hit ? ease((t - rel - 0.9) / 0.8) : 0; victim.rot = -fall * 1.45; victim.pose = { arms: hit ? -1.6 : t > 1.0 ? -2.0 : -0.4, scarf: '#9a2020' };
        const ax = bowX + (tx - bowX) * fly, ay = bowY + (ty - bowY) * fly, aang = Math.atan2(ty - bowY, tx - bowX);
        if (t > rel && !hit) cam(ax, ay, 1.0 + Math.sin(fly * Math.PI) * 0.22);
        if (hit && t < rel + 1.15) { shk = 10; spray(tx, ty, 4, 5, t); }
        draws.push(() => { rim(g, W, Hh, dpr, 'rgba(160,190,255,.6)', 16, o => { o.save(); o.translate(cxn, gy); o.scale(-cs, cs);
            // 馬身＋四條腿＋尾巴
            o.beginPath(); o.ellipse(-10, -90, 72, 32, 0, 0, 7); o.fill(); [[-60, 0], [-42, 1], [34, 2], [50, 3]].forEach(([lx]) => { limb(o, lx, -80, lx + 4, -32, 11, 8); limb(o, lx + 4, -32, lx, 0, 8, 6); });
            o.beginPath(); o.moveTo(-78, -100); o.quadraticCurveTo(-124, -92, -130, -36); o.lineTo(-112, -70); o.fill();
            // 人的上半身從馬的前胸長出來（同一塊剪影，不會斷開）
            o.beginPath(); o.moveTo(24, -96); o.quadraticCurveTo(30, -150, 40, -198); o.quadraticCurveTo(60, -206, 82, -198); o.quadraticCurveTo(84, -150, 70, -96); o.closePath(); o.fill();
            o.fillRect(54, -214, 12, 18); o.beginPath(); o.ellipse(60, -230, 15, 18, 0, 0, 7); o.fill(); o.beginPath(); o.moveTo(48, -240); o.quadraticCurveTo(30, -236, 26, -210); o.lineTo(46, -228); o.fill(); // 頭與後腦的頭髮
            // 前手握弓（伸直）、後手拉弦
            limb(o, 76, -192, 150, -192, 8, 7); const pull = t < rel ? draw * 70 : 0; limb(o, 50, -190, 120 - pull - 30, -192, 8, 7);
            o.lineWidth = 6; o.beginPath(); o.arc(150 - 70, -192, 70, -1.0, 1.0); o.stroke(); o.lineWidth = 1.5; const sx = 150 - 70 + Math.cos(1.0) * 70, sy = Math.sin(1.0) * 70; o.beginPath(); o.moveTo(sx, -192 - sy); o.lineTo(t < rel ? 120 - pull - 30 : 150 - 70 + Math.cos(1.0) * 70 - 6, -192); o.lineTo(sx, -192 + sy); o.stroke();
            if (t < rel) { o.lineWidth = 3; o.beginPath(); o.moveTo(120 - pull - 30, -192); o.lineTo(190 - pull, -192); o.stroke(); } o.restore(); });
          if (t >= rel && !hit) { g.save(); g.translate(ax, ay); g.rotate(aang); g.globalCompositeOperation = 'lighter'; const tg = g.createLinearGradient(-170 * U, 0, 0, 0); tg.addColorStop(0, 'rgba(200,220,255,0)'); tg.addColorStop(1, 'rgba(220,235,255,.85)'); g.strokeStyle = tg; g.lineWidth = 4 * dpr; g.beginPath(); g.moveTo(-170 * U, 0); g.lineTo(0, 0); g.stroke(); g.globalCompositeOperation = 'source-over';
            g.strokeStyle = '#1a140e'; g.lineWidth = 3 * dpr; g.beginPath(); g.moveTo(-52 * U, 0); g.lineTo(0, 0); g.stroke(); g.fillStyle = '#c8c8d0'; g.beginPath(); g.moveTo(0, -5 * U); g.lineTo(12 * U, 0); g.lineTo(0, 5 * U); g.fill(); g.fillStyle = '#7a1010'; g.fillRect(-54 * U, -5 * U, 10 * U, 10 * U); g.restore(); }
          if (hit) { g.fillStyle = '#6a0008'; g.beginPath(); g.ellipse(vx - 80 * U, gy + 4 * U, 70 * U * fall, 9 * U, 0, 0, 7); g.fill(); } });
        victim.after = hit ? (o) => { o.lineWidth = 3 * dpr; o.beginPath(); o.moveTo(10 * S, -150 * S); o.lineTo(64 * S, -158 * S); o.stroke(); o.fillStyle = '#7a1010'; o.fillRect(60 * S, -163 * S, 8 * S, 10 * S); } : null;
      } else if (kind === 7) { // 狼人：長嚎→蹲低→撲向破產者（嘴精準咬到脖子）→壓倒在地狂抓→滿畫面亂七八糟的爪痕
        const leapT = 2.0, landT = 2.45, ws = U * 1.15;
        let pose = t < 1.5 ? 'howl' : t < leapT ? 'crouch' : t < landT ? 'leap' : 'maul';
        // 破產者站著時脖子的位置，倒地後胸口的位置
        const neck = [vx + 4 * S, gy - 168 * S], downFall = ease(clamp((t - landT) / 0.35)), chest = [vx - 120 * S, gy - 26 * S];
        const tgt = t < landT ? neck : [neck[0] + (chest[0] - neck[0]) * downFall, neck[1] + (chest[1] - neck[1]) * downFall];
        // 依姿勢算出嘴在狼人座標的位置，反推狼人該站哪，讓嘴剛好對到目標
        const mouth = (pz) => { const P = { leap: { lean: 0.9, head: 0.3, crouch: 0.3 }, maul: { lean: 0.6, head: 0.5, crouch: 0.6 } }[pz]; const hipY = -110 + P.crouch * 35;
          const hx = 10 * Math.cos(P.lean) + 160 * Math.sin(P.lean), hy = hipY + 10 * Math.sin(P.lean) - 160 * Math.cos(P.lean), A = P.lean + P.head, mx = hx + 62 * Math.cos(A), my = hy + 62 * Math.sin(A); return [-mx * ws, my * ws]; };
        const startX = W * 0.8, startY = gy; let wx = startX, wy = startY;
        if (t >= leapT) { const m = mouth(t < landT ? 'leap' : 'maul'), endX = tgt[0] - m[0], endY = tgt[1] - m[1]; if (t < landT) { const k = ease((t - leapT) / (landT - leapT)); wx = startX + (endX - startX) * k; wy = startY + (endY - startY) * k - Math.sin(k * Math.PI) * 120 * U; } else { wx = endX; wy = Math.max(endY, gy - 10 * U); } }
        victim.rot = -downFall * 1.45; victim.pose = t > landT ? { arms: -2.8 + Math.sin(t * 20) * 0.3, scarf: '#9a2020' } : { arms: t > 1.1 ? -2.5 : -0.4, lean: t > 1.1 ? -0.12 : 0, scarf: '#9a2020' };
        if (t > landT && t < landT + 0.3) { shk = 16; cam(vx - 40 * U, gy - 90 * U, 1.12); spray(neck[0], neck[1], 12, 6, t); }
        if (t > landT + 0.3 && Math.random() < 0.6) spray(tgt[0], tgt[1], 3, 6, t);
        const slashes = persist.slashes || (persist.slashes = Array.from({ length: 12 }, (_, q) => ({ t: 3.35 + q * 0.12 + Math.random() * 0.05, x: rnd(0.15, 0.85), y: rnd(0.1, 0.6), a: rnd(-1.0, 1.0) + (q % 2 ? Math.PI : 0), l: rnd(0.18, 0.42), n: 3 + (q % 3 === 0 ? 1 : 0), bend: rnd(-30, 30) })));
        slashes.forEach(c => { if (t > c.t && t < c.t + 0.08) shk = 12; });
        draws.push(() => { rim(g, W, Hh, dpr, 'rgba(200,210,255,.7)', 22, o => werewolf(o, wx, wy, ws, pose, t, true));
          if (t > 3.3) { g.save(); g.fillStyle = `rgba(0,0,0,${0.45 * clamp((t - 3.3) * 2)})`; g.fillRect(0, 0, W, Hh);
            slashes.forEach(c => { const ck = clamp((t - c.t) / 0.12); if (ck <= 0) return; const L = Math.min(W, Hh) * c.l, x0 = c.x * W, y0 = c.y * Hh, dx = Math.cos(c.a) * L, dy = Math.abs(Math.sin(c.a)) * L + L * 0.5;
              for (let q = 0; q < c.n; q++) { const ox = q * 15 * U * Math.cos(c.a + Math.PI / 2), oy = q * 15 * U * Math.sin(c.a + Math.PI / 2), w = (8 - q * 1.2) * U;
                g.lineCap = 'round'; g.strokeStyle = '#5a0006'; g.lineWidth = w * 1.6; g.beginPath(); g.moveTo(x0 + ox, y0 + oy); g.quadraticCurveTo(x0 + ox + dx * 0.5 + c.bend * U, y0 + oy + dy * 0.5, x0 + ox + dx * ck, y0 + oy + dy * ck); g.stroke();
                g.strokeStyle = 'rgba(208,28,52,.85)'; g.lineWidth = w * 0.45; g.stroke();
                if (ck >= 1) for (let d = 0; d < 3; d++) { const dk = clamp((t - c.t - 0.2 - d * 0.07) / 1.1), px = x0 + ox + dx * (0.25 + d * 0.25), py = y0 + oy + dy * (0.25 + d * 0.25); g.fillStyle = '#7a0008'; g.fillRect(px - 2 * U, py, 4 * U, dk * 80 * U); g.beginPath(); g.arc(px, py + dk * 80 * U, 3.5 * U, 0, 7); g.fill(); } } });
            g.restore(); } });
      }
      // ===== 畫 =====
      g.save();
      if (zoomF) { g.translate(zoomF[0], zoomF[1]); g.scale(zoom, zoom); g.translate(-zoomF[0], -zoomF[1]); }
      g.translate(rnd(-lastShk, lastShk) * dpr, rnd(-lastShk, lastShk) * dpr);
      hall(g, W, Hh, t, U, { moon: kind === 7 || kind === 2 });
      if (victim.before) victim.before();
      if (victim.show && !(victim.crumble >= 1)) {
        const sc = S * (victim.scale || 1), pz = victim.frozen != null ? victim.frozen : t;
        const drawV = (o, fill) => { if (fill) o.fillStyle = fill; o.save(); o.translate(victim.x, victim.y); o.rotate(victim.rot || 0); student(o, 0, 0, sc, victim.pose, pz); if (victim.after) victim.after(o); o.restore(); };
        g.save(); if (victim.crumble > 0) { g.beginPath(); g.rect(0, 0, W, victim.y - victim.crumble * 260 * S); g.rect(0, 0, 0, 0); g.clip(); }
        const ch = victim.char || 0;
        rim(g, W, Hh, dpr, ch > 0 ? `rgba(255,${120 - ch * 60},40,.9)` : victim.stone ? 'rgba(220,220,230,.45)' : victim.glow, 12 + ch * 20, o => drawV(o, ch > 0.5 ? '#140806' : null));
        if (victim.stone) { // 石像：灰色石頭由腳往上蔓延，左上受光；最後出現裂痕
          g.save(); g.beginPath(); g.rect(0, victim.y - victim.stone * 270 * S, W, Hh); g.clip();
          rim(g, W, Hh, dpr, null, 0, o => { const lg = o.createLinearGradient(victim.x - 50 * U, victim.y - 250 * S, victim.x + 50 * U, victim.y); lg.addColorStop(0, '#c4c0b8'); lg.addColorStop(0.5, '#8f8b84'); lg.addColorStop(1, '#55524d'); drawV(o, lg);
            o.globalCompositeOperation = 'source-atop'; let sd = 3; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647; for (let q = 0; q < 500; q++) { o.fillStyle = R() < 0.5 ? 'rgba(40,38,34,.35)' : 'rgba(230,226,218,.3)'; o.fillRect(victim.x + (R() - 0.5) * 120 * S, victim.y - R() * 270 * S, 2.2 * dpr, 2.2 * dpr); }
            if (victim.crack) { let sd2 = 7; const R2 = () => (sd2 = (sd2 * 16807) % 2147483647) / 2147483647; o.lineCap = 'round';
              for (let q = 0; q < 7; q++) { const len = Math.round(2 + victim.crack * 9); let x = victim.x + (R2() - 0.5) * 30 * S, y = victim.y - 30 * S - R2() * 200 * S; const pts = [[x, y]]; for (let z = 0; z < len; z++) { x += (R2() - 0.5) * 22 * S; y += (R2() - 0.3) * 18 * S; pts.push([x, y]); }
                o.strokeStyle = 'rgba(235,232,226,.6)'; o.lineWidth = 2.2 * dpr; o.beginPath(); pts.forEach(([px, py], k) => k ? o.lineTo(px + 1.2, py + 1.2) : o.moveTo(px + 1.2, py + 1.2)); o.stroke();
                o.strokeStyle = 'rgba(20,18,16,.95)'; o.lineWidth = 1.4 * dpr; o.beginPath(); pts.forEach(([px, py], k) => k ? o.lineTo(px, py) : o.moveTo(px, py)); o.stroke(); } }
            o.globalCompositeOperation = 'source-over'; });
          g.restore(); }
        g.restore(); }
      draws.forEach(f => f());
      drawBlood(g, t, U);
      H.drawEmbers(g, emb, W, Hh, t, dpr, 'rgba(200,210,255,A)', 0.6);
      g.restore(); lastShk = shk;
      H.vignette(g, W, Hh, 0.88); H.grain(g, W, Hh, 0.09);
    }, snd);
  };
  root.MONO_MAGICFX = M;
})(typeof window !== 'undefined' ? window : globalThis);
