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
    if (p.wand) { g.strokeStyle = g.fillStyle; g.lineWidth = 3; const hx = 16 + Math.cos(aa) * 46, hy = -140 + Math.sin(aa) * 46; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(aa) * 34, hy + Math.sin(aa) * 34); g.stroke(); g.restore(); return [x + (hx + Math.cos(aa) * 34) * s, y + (hy + Math.sin(aa) * 34) * s]; }
    g.restore(); return [x, y - 170 * s];
  }
  const finish = (g, W, Hh, dpr, t, T, U, title, sub) => {
    H.vignette(g, W, Hh, 0.88); H.grain(g, W, Hh, 0.09);
    tt(g, W, dpr, title, Hh * 0.08, 30, '#f0dcb0', ease(t / 0.6));
    if (sub && t > T - 1.6) tt(g, W, dpr, sub, Hh * 0.93, 20, '#ffd0b0', clamp((t - (T - 1.6)) * 3));
    if (t > T - 0.5) { g.fillStyle = `rgba(0,0,0,${(t - (T - 0.5)) * 2})`; g.fillRect(0, 0, W, Hh); }
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
    g.beginPath(); g.arc(0, -72, 20, 0, 7); g.fill(); for (let k = 0; k < 5; k++) feather(0, -86, -Math.PI / 2 + (k - 2) * 0.3, 40, 5, k + 80);
    g.fillStyle = 'rgba(255,240,180,1)'; g.beginPath(); g.moveTo(-18, -74); g.lineTo(-36, -66); g.lineTo(-16, -66); g.fill();
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
    return ui.overlay(4800, (g, W, Hh, dpr, t) => {
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
      finish(g, W, Hh, dpr, t, 4.8, U, '鳳 凰 重 生', `你的錢包也跟著重生了`);
    }, snd);
  };

  // ======================= 魔法學院破產 =======================
  // 債主角色 i：0 見習巫師（石化咒）1 大巨蛇 2 貓頭鷹 3 小火龍 4 獨角獸 5 鳳凰 6 人馬 7 狼人；-1 沒有債主＝怪獸書
  const NAMES = ['被石化咒變成石像，碎了一地', '被大巨蛇一口吞下', '被貓頭鷹群叼走了', '被小火龍燒成焦炭', '被獨角獸一角頂飛', '被鳳凰之火吞沒', '被人馬一箭射穿', '被狼人撲倒撕碎'];
  function owl(g, x, y, s, ph) { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.ellipse(0, 0, 18, 22, 0, 0, 7); g.fill(); [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 6, -18); g.lineTo(sd * 14, -30); g.lineTo(sd * 16, -14); g.fill();
      g.save(); g.scale(sd, 1); g.rotate(Math.sin(ph) * 0.9); g.beginPath(); g.moveTo(10, -6); g.quadraticCurveTo(50, -30, 70, -10); g.lineTo(56, -4); g.lineTo(62, 4); g.lineTo(46, 4); g.lineTo(50, 12); g.quadraticCurveTo(26, 10, 10, 8); g.fill(); g.restore(); }); g.restore(); }
  M.death = function (ui, SFX, e) {
    const v = ui.v, th = root.MONO_THEMES[v.theme], by = e.by, kind = by >= 0 && v.players[by] && v.players[by].char && v.players[by].char.kind !== 'custom' ? v.players[by].char.i % 8 : by >= 0 ? 0 : -1;
    blood.length = 0; const emb = H.embers(70);
    const shards = Array.from({ length: 40 }, () => ({ x: rnd(-22, 22), y: rnd(-240, 0), vx: rnd(-3, 3), vy: rnd(-5, -1), r: rnd(0, 6), s: rnd(6, 16) }));
    const owls = Array.from({ length: 18 }, (_, i) => ({ a: rnd(0, 6.28), d: rnd(0.3, 0.9), p: rnd(0, 6), o: rnd(-60, 60), q: rnd(-30, 20) }));
    const paper = Array.from({ length: 40 }, () => ({ vx: rnd(-6, 6), vy: rnd(-8, -2), r: rnd(0, 6) }));
    let lastShk = 0; const T0 = 5.0, vName = v.names && v.names[e.seat] || '', title = kind < 0 ? '被怪獸書追到了' : NAMES[kind];
    const snd = () => { if (!SFX) return; const T = SFX.tone, N = SFX.noise;
      T(49, 5, { type: 'sawtooth', vol: 0.05, lp: 220, attack: 0.4 }); [0.1].forEach(d => { T(147, 2.5, { vol: 0.04, detune: -20, delay: d }); T(156, 2.5, { vol: 0.03, delay: d }); });
      if (kind === -1) { for (let i = 0; i < 14; i++) { N(0.08, { f: 300, vol: 0.12, delay: 0.3 + i * 0.17 }); T(90, 0.08, { vol: 0.08, wet: false, delay: 0.3 + i * 0.17 }); } T(180, 0.5, { type: 'sawtooth', glide: 90, vol: 0.06, lp: 900, delay: 0.8 }); for (let i = 0; i < 10; i++) { N(0.12, { f: 2500, type: 'bandpass', vol: 0.08, delay: 2.6 + i * 0.13 }); N(0.1, { f: 400, vol: 0.12, delay: 2.65 + i * 0.13 }); } T(1300, 0.8, { type: 'sawtooth', glide: 600, vol: 0.05, lp: 3000, delay: 2.55 }); }
      if (kind === 0) { for (let i = 0; i < 8; i++) T(800 + i * 100, 0.15, { type: 'triangle', vol: 0.03, delay: 0.6 + i * 0.05 }); T(220, 1.5, { type: 'square', glide: 110, vol: 0.03, lp: 700, delay: 1.3 }); for (let i = 0; i < 12; i++) N(0.04, { f: 3000, type: 'bandpass', vol: 0.06, delay: 1.5 + i * 0.1 }); N(0.9, { f: 1500, vol: 0.18, delay: 3.0 }); for (let i = 0; i < 16; i++) T(3000 + Math.random() * 2000, 0.1, { type: 'square', vol: 0.02, lp: 7000, delay: 3.0 + Math.random() * 0.6 }); }
      if (kind === 1) { N(1.4, { f: 4000, type: 'highpass', vol: 0.05, delay: 0.4 }); N(0.4, { f: 600, vol: 0.2, delay: 1.9 }); T(70, 0.6, { glide: 35, vol: 0.2, delay: 1.95 }); T(55, 1.2, { glide: 40, vol: 0.12, delay: 2.5 }); }
      if (kind === 2) { for (let i = 0; i < 20; i++) { T(420 + Math.random() * 120, 0.3, { glide: 350, vol: 0.025, delay: 0.4 + i * 0.15 }); N(0.06, { f: 500, vol: 0.06, delay: 0.4 + i * 0.12 }); } }
      if (kind === 3 || kind === 5) { N(2.2, { f: 700, vol: 0.14, attack: 0.2, delay: 1.0 }); T(120, 2, { type: 'sawtooth', glide: 60, vol: 0.05, lp: 500, delay: 1.0 }); T(1200, 1.0, { type: 'sawtooth', glide: 400, vol: 0.05, lp: 3000, delay: 1.4 }); }
      if (kind === 4) { for (let i = 0; i < 8; i++) N(0.06, { f: 250, vol: 0.14, delay: 0.3 + i * 0.16 }); T(1800, 0.8, { glide: 2600, vol: 0.04, delay: 1.5 }); N(0.3, { f: 500, vol: 0.2, delay: 1.6 }); }
      if (kind === 6) { T(240, 0.6, { type: 'sawtooth', glide: 300, vol: 0.03, lp: 900, delay: 0.6 }); N(0.4, { f: 3000, type: 'bandpass', vol: 0.1, delay: 1.6 }); N(0.15, { f: 700, vol: 0.22, delay: 2.2 }); T(900, 0.7, { type: 'sawtooth', glide: 400, vol: 0.05, lp: 2600, delay: 2.25 }); }
      if (kind === 7) { T(250, 2.0, { type: 'sawtooth', glide: 520, vol: 0.06, lp: 1600, delay: 0.3 }); T(260, 2.0, { type: 'square', glide: 540, vol: 0.02, lp: 1600, delay: 0.3 }); N(0.4, { f: 800, vol: 0.2, delay: 2.4 }); [2.5, 2.62, 2.74].forEach(d => N(0.12, { f: 2500, type: 'highpass', vol: 0.12, delay: d })); }
    };
    return ui.overlay(T0 * 1000, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, gy = Hh * 0.86, vx0 = W * 0.66; let shk = 0;
      g.save(); g.translate(rnd(-lastShk, lastShk) * dpr, rnd(-lastShk, lastShk) * dpr);
      hall(g, W, Hh, t, U, { moon: kind === 7 || kind === 2 });
      const S = U * 0.95;
      if (kind === -1) { // ===== 怪獸書：追、撲、咬爛 =====
        const run = t < 2.5, vx = run ? W * (0.9 - t * 0.2) : W * 0.4, bx = run ? W * (1.25 - t * 0.33) : W * 0.42, hop = Math.abs(Math.sin(t * 9)) * 40 * U;
        const caught = t >= 2.5; if (caught && t < 2.7) shk = 14;
        if (!caught) rim(g, W, Hh, dpr, 'rgba(160,180,255,.6)', 14, o => student(o, vx, gy, S, { run: 1, lean: -0.25, arms: -0.9, scarf: '#9a2020' }, t));
        // 書：毛邊封面、上下兩片一開一合、利牙、一顆眼睛
        const open = caught ? (t < 3.8 ? 0.15 + Math.abs(Math.sin(t * 12)) * 0.35 : 0.1) : 0.35 + Math.abs(Math.sin(t * 9)) * 0.55, bs = caught ? 1.6 : 1.1;
        rim(g, W, Hh, dpr, 'rgba(120,255,140,.35)', 16, o => { o.save(); o.translate(bx + (caught ? Math.sin(t * 40) * 10 * U : 0), gy - 60 * U * bs - (caught ? 0 : hop)); o.scale(U * bs, U * bs); o.rotate(caught ? Math.sin(t * 17) * 0.15 : -0.1);
          const cover = (sd) => { const fur = H.furOutline([[-70, 0], [-70, -sd * 10], [-50, -sd * 50], [50, -sd * 50], [70, -sd * 10], [70, 0]], sd > 0 ? 3 : 9, 9); o.beginPath(); o.moveTo(-70, 0); fur.forEach(([x, y]) => o.lineTo(x, y)); o.closePath(); o.fill(); };
          o.save(); o.rotate(-open * 0.6); cover(1); o.restore(); o.save(); o.rotate(open * 0.25); o.scale(1, -1); cover(1); o.restore(); o.restore(); });
        g.save(); g.translate(bx + (caught ? Math.sin(t * 40) * 10 * U : 0), gy - 60 * U * bs - (caught ? 0 : hop)); g.scale(U * bs, U * bs); g.rotate(caught ? Math.sin(t * 17) * 0.15 : -0.1);
        g.save(); g.rotate(-open * 0.6); g.fillStyle = '#efe6d0'; for (let k = 0; k < 10; k++) { g.beginPath(); g.moveTo(-60 + k * 12, -2); g.lineTo(-54 + k * 12, 14); g.lineTo(-48 + k * 12, -2); g.fill(); } g.restore();
        g.save(); g.rotate(open * 0.25); g.fillStyle = '#efe6d0'; for (let k = 0; k < 10; k++) { g.beginPath(); g.moveTo(-60 + k * 12, 2); g.lineTo(-54 + k * 12, -12); g.lineTo(-48 + k * 12, 2); g.fill(); } g.fillStyle = '#7a1018'; g.beginPath(); g.ellipse(-10, 6, 36, 6, 0, 0, Math.PI); g.fill(); g.restore();
        g.save(); g.rotate(-open * 0.6); g.globalCompositeOperation = 'lighter'; const eg = g.createRadialGradient(20, -30, 0, 20, -30, 14); eg.addColorStop(0, 'rgba(255,255,160,1)'); eg.addColorStop(0.4, 'rgba(160,255,80,.8)'); eg.addColorStop(1, 'rgba(0,255,0,0)'); g.fillStyle = eg; g.fillRect(6, -44, 28, 28); g.restore(); g.restore();
        if (caught) { if (t < 3.9 && Math.random() < 0.7) spray(bx, gy - 90 * U, 3, 4, t); const k2 = t - 2.5; paper.forEach(p => { if (k2 > 2) return; g.save(); g.translate(bx + p.vx * k2 * 40 * U, gy - 90 * U + (p.vy * k2 * 40 + k2 * k2 * 120) * U); g.rotate(p.r + k2 * 6); g.fillStyle = 'rgba(230,220,200,.9)'; g.fillRect(-7 * U, -9 * U, 14 * U, 18 * U); g.restore(); });
          if (t > 4.0) { const hk = t - 4.0; g.save(); g.translate(bx - 40 * U - hk * 60 * U, gy - 120 * U - hk * 120 * U + hk * hk * 300 * U); g.rotate(hk * 5); g.fillStyle = '#0a0812'; g.beginPath(); g.moveTo(-20 * U, 0); g.quadraticCurveTo(-4 * U, -40 * U, 16 * U, -54 * U); g.quadraticCurveTo(6 * U, -30 * U, 18 * U, 0); g.fill(); g.restore(); } }
      } else if (kind === 0) { // ===== 石化咒：光束打中→從腳開始變石頭→裂開→碎掉 =====
        const wand = rim(g, W, Hh, dpr, 'rgba(160,190,255,.6)', 16, o => student(o, W * 0.2, gy, S * 1.05, { arms: -0.35 - Math.min(1, t) * 0.25, wand: true, scarf: '#5a3aa0' }, t));
        const hit = 1.3, stone = clamp((t - hit) / 1.2), shat = t > 3.0 ? t - 3.0 : 0;
        if (t > 0.7 && t < hit + 0.4) { const k = clamp((t - 0.7) / 0.6), tx = wand[0] + (vx0 - wand[0]) * k, ty = wand[1] + (gy - 120 * S - wand[1]) * k; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(220,230,255,.9)'; g.lineWidth = 4 * dpr; g.shadowColor = '#a0b8ff'; g.shadowBlur = 20 * dpr; g.beginPath(); g.moveTo(wand[0], wand[1]); for (let q = 1; q <= 10; q++) g.lineTo(wand[0] + (tx - wand[0]) * q / 10 + rnd(-6, 6) * U, wand[1] + (ty - wand[1]) * q / 10 + rnd(-6, 6) * U); g.stroke(); g.restore(); }
        if (!shat) { rim(g, W, Hh, dpr, stone > 0 ? 'rgba(200,210,230,.5)' : 'rgba(160,180,255,.5)', 12, o => student(o, vx0, gy, S, { arms: stone > 0 ? -2.3 : -0.4, lean: stone > 0 ? -0.05 : 0, scarf: '#9a2020', flip: true }, stone > 0 ? hit : t));
          if (stone > 0) { g.save(); g.beginPath(); g.rect(0, gy - stone * 260 * S, W, Hh); g.clip(); rim(g, W, Hh, dpr, null, 0, o => { o.fillStyle = '#5c5a58'; student(o, vx0, gy, S, { arms: -2.3, lean: -0.05, hat: true, flip: true }, hit); }); g.restore();
            if (stone > 0.6) { g.strokeStyle = 'rgba(20,20,26,.9)'; g.lineWidth = 2 * dpr; for (let q = 0; q < 6; q++) { g.beginPath(); let x = vx0 + (q - 3) * 8 * U, y = gy - 40 * U - q * 30 * U; g.moveTo(x, y); for (let z = 0; z < 5; z++) { x += rnd(-10, 10) * U * stone; y -= rnd(4, 14) * U; g.lineTo(x, y); } g.stroke(); } } } }
        else { shk = shat < 0.3 ? 10 : 0; shards.forEach(p => { const k = shat; g.save(); g.translate(vx0 + (p.x + p.vx * k * 50) * S, gy + (p.y + p.vy * k * 40 + k * k * 260) * S); g.rotate(p.r + k * 4); g.fillStyle = '#7a7a82'; g.beginPath(); g.moveTo(-p.s * S, 0); g.lineTo(0, -p.s * S * 0.8); g.lineTo(p.s * S * 0.7, p.s * S * 0.3); g.fill(); g.restore(); });
          g.fillStyle = 'rgba(160,160,170,.4)'; g.beginPath(); g.ellipse(vx0, gy, 60 * U * Math.min(1, shat * 2), 12 * U, 0, 0, 7); g.fill(); }
      } else if (kind === 1) { // ===== 大巨蛇：從暗處升起、張嘴、撲咬、吞下 =====
        const rise = ease(t / 1.2), strike = clamp((t - 1.6) / 0.25), back = clamp((t - 2.0) / 0.8), gone = t > 1.85;
        if (!gone) rim(g, W, Hh, dpr, 'rgba(160,180,255,.5)', 12, o => student(o, vx0, gy, S, { arms: t > 1.2 ? -2.4 : -0.4, flip: true, lean: t > 1.2 ? 0.1 : 0, scarf: '#9a2020' }, t)); else if (t < 2.1) spray(vx0, gy - 120 * U, 4, 5, t);
        rim(g, W, Hh, dpr, 'rgba(120,255,160,.35)', 22, o => { const hx = W * 0.22 + strike * (vx0 - W * 0.2) * (1 - back * 0.7), hy = gy - 60 * U - rise * 210 * U + strike * 80 * U; o.lineCap = 'round';
          o.lineWidth = 46 * U; o.beginPath(); o.moveTo(-W * 0.1, gy + 40 * U); o.bezierCurveTo(W * 0.3, gy + 20 * U, W * 0.02, gy - 120 * U * rise, hx - 40 * U, hy + 40 * U); o.stroke();
          const bulge = t > 2.1 ? clamp((t - 2.1) / 1.8) : -1; if (bulge >= 0) { o.beginPath(); o.ellipse(-W * 0.1 + (hx - 40 * U + W * 0.1) * (1 - bulge), gy + 30 * U - (1 - bulge) * 100 * U, 40 * U, 30 * U, 0, 0, 7); o.fill(); }
          const jaw = t < 1.4 ? 0.1 : t < 1.85 ? 0.9 : t < 2.2 ? 0.2 : 0.05; o.save(); o.translate(hx, hy); o.rotate(-0.3 + strike * 0.3); o.beginPath(); o.moveTo(-40 * U, -24 * U); o.quadraticCurveTo(10 * U, -34 * U, 40 * U, -16 * U); o.lineTo(40 * U, 16 * U); o.quadraticCurveTo(10 * U, 30 * U, -40 * U, 24 * U); o.closePath(); o.fill();
          o.save(); o.translate(30 * U, 0); o.rotate(-jaw * 0.55); o.beginPath(); o.moveTo(0, -16 * U); o.quadraticCurveTo(40 * U, -18 * U, 70 * U, -6 * U); o.quadraticCurveTo(60 * U, 4 * U, 0, 4 * U); o.fill(); o.restore(); o.save(); o.translate(30 * U, 0); o.rotate(jaw * 0.55); o.beginPath(); o.moveTo(0, 2 * U); o.quadraticCurveTo(40 * U, 4 * U, 64 * U, 8 * U); o.quadraticCurveTo(50 * U, 16 * U, 0, 16 * U); o.fill(); o.restore(); o.restore(); return [hx, hy, jaw]; });
        const hx = W * 0.22 + strike * (vx0 - W * 0.2) * (1 - back * 0.7), hy = gy - 60 * U - rise * 210 * U + strike * 80 * U, jaw = t < 1.4 ? 0.1 : t < 1.85 ? 0.9 : t < 2.2 ? 0.2 : 0.05;
        g.save(); g.translate(hx, hy); g.rotate(-0.3 + strike * 0.3); g.globalCompositeOperation = 'lighter'; const eg = g.createRadialGradient(10 * U, -14 * U, 0, 10 * U, -14 * U, 18 * U); eg.addColorStop(0, 'rgba(255,255,150,1)'); eg.addColorStop(0.3, 'rgba(230,220,0,.8)'); eg.addColorStop(1, 'rgba(200,200,0,0)'); g.fillStyle = eg; g.fillRect(-8 * U, -32 * U, 36 * U, 36 * U); g.globalCompositeOperation = 'source-over';
        if (jaw > 0.5) { g.fillStyle = '#f0f0e8'; g.save(); g.translate(30 * U, 0); g.rotate(-jaw * 0.55); [16, 50].forEach(x => { g.beginPath(); g.moveTo(x * U, 0); g.lineTo((x + 4) * U, 26 * U); g.lineTo((x + 9) * U, 0); g.fill(); }); g.restore(); } g.restore();
        if (t > 1.6 && t < 1.95) shk = 10;
      } else if (kind === 2) { // ===== 貓頭鷹群：從四面八方撲下來，把人叼上月亮 =====
        const lift = ease((t - 2.0) / 2.2), vy = gy - lift * Hh * 0.7;
        rim(g, W, Hh, dpr, 'rgba(160,180,255,.5)', 12, o => { student(o, vx0 - lift * W * 0.2, vy, S * (1 - lift * 0.5), { arms: -2.6 + Math.sin(t * 12) * 0.3, flip: true, run: lift > 0 ? 0.6 : 0, scarf: '#9a2020' }, t);
          owls.forEach(p => { const k = clamp((t - p.d) / 1.2), ox = vx0 - lift * W * 0.2 + p.o * U * (1 - lift * 0.5), oy = vy - 200 * S * (1 - lift * 0.5) + p.q * U, sx = ox + Math.cos(p.a) * (1 - k) * W, sy = oy - Math.abs(Math.sin(p.a)) * (1 - k) * Hh; owl(o, sx, sy, U * 0.9 * (1 - lift * 0.4), t * 16 + p.p); }); });
        g.fillStyle = 'rgba(200,190,170,.6)'; for (let q = 0; q < 14; q++) { const fk = ((t * 0.3 + q / 14) % 1); g.save(); g.translate((q * 0.07 + 0.1) * W + Math.sin(t * 2 + q) * 20 * U, fk * Hh); g.rotate(Math.sin(t * 3 + q)); g.beginPath(); g.ellipse(0, 0, 3 * U, 9 * U, 0, 0, 7); g.fill(); g.restore(); }
      } else if (kind === 3 || kind === 5) { // ===== 小火龍噴火／鳳凰撲下：燒成焦炭再化成灰 =====
        const fire = clamp((t - 0.9) / 0.3), char = clamp((t - 1.4) / 1.0), crumble = clamp((t - 2.8) / 1.2);
        if (kind === 3) rim(g, W, Hh, dpr, 'rgba(255,140,60,.6)', 18, o => { o.save(); o.translate(W * 0.2, gy); o.scale(U, U); o.beginPath(); o.ellipse(0, -60, 60, 36, -0.1, 0, 7); o.fill(); limb(o, -30, -40, -36, 0, 12, 10); limb(o, 30, -40, 34, 0, 12, 10); o.beginPath(); o.moveTo(40, -80); o.quadraticCurveTo(70, -130, 100, -120); o.lineTo(130, -110); o.lineTo(100, -96); o.quadraticCurveTo(80, -90, 60, -60); o.fill();
          o.beginPath(); o.moveTo(-50, -60); o.quadraticCurveTo(-120, -50, -150, -90); o.lineTo(-140, -70); o.quadraticCurveTo(-110, -40, -50, -40); o.fill(); [-1, 1].forEach(sd => { o.save(); o.translate(-6, -86); o.rotate(sd * 0.25 + Math.sin(t * 8 + sd) * 0.25); o.beginPath(); o.moveTo(0, 0); o.lineTo(-30, -110); o.lineTo(-90, -120); o.quadraticCurveTo(-70, -90, -84, -66); o.quadraticCurveTo(-60, -60, -64, -34); o.quadraticCurveTo(-40, -30, -36, -6); o.closePath(); o.fill(); o.restore(); }); [0, 10].forEach(d => { o.beginPath(); o.moveTo(76 + d, -124); o.lineTo(70 + d, -152); o.lineTo(86 + d, -122); o.fill(); }); o.restore(); });
        else fireBird(g, W * 0.3 + ease(t / 1.2) * W * 0.3, Hh * 0.15 + ease(t / 1.2) * Hh * 0.45, U * 0.5, t, Math.min(1, t * 2), Math.sin(t * 7));
        if (fire > 0 && t < 3.0) { const sx = kind === 3 ? W * 0.2 + 130 * U : vx0, sy = kind === 3 ? gy - 112 * U : gy - 200 * U; g.save(); g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 70; q++) { const ph = (t * 1.8 + q / 70) % 1, x = sx + (vx0 - sx) * ph * fire, y = sy + (gy - 100 * U - sy) * ph + Math.sin(q * 3 + t * 20) * 26 * U * ph, r = (6 + ph * 30) * U; const fg = g.createRadialGradient(x, y, 0, x, y, r); fg.addColorStop(0, 'rgba(255,250,200,.85)'); fg.addColorStop(0.4, 'rgba(255,150,40,.55)'); fg.addColorStop(1, 'rgba(255,40,0,0)'); g.fillStyle = fg; g.fillRect(x - r, y - r, r * 2, r * 2); } g.restore(); }
        if (crumble < 1) { g.save(); if (crumble > 0) { g.beginPath(); g.rect(0, gy - (1 - crumble) * 260 * S, W, Hh); g.clip(); } rim(g, W, Hh, dpr, char > 0 ? `rgba(255,${120 - char * 60},40,${0.9})` : 'rgba(160,180,255,.5)', 12 + char * 20, o => { if (char > 0.5) o.fillStyle = '#140806'; student(o, vx0, gy, S, { arms: -2.4 + Math.sin(t * 15) * (1 - char) * 0.6, flip: true, scarf: char > 0.3 ? null : '#9a2020' }, char > 0.8 ? 1.4 : t); }); g.restore(); }
        if (char > 0.6) H.flames(g, vx0 - 40 * U, vx0 + 40 * U, gy, 200 * U * (1 - crumble), t, 8 * U, 7, 0.85);
        if (crumble > 0) { for (let q = 0; q < 80; q++) { const k = crumble, x = vx0 + Math.sin(q * 7.1) * 40 * U + Math.sin(q) * k * 60 * U, y = gy - (q % 26) * 10 * U * (1 - k) - 4 * U; g.fillStyle = q % 3 ? 'rgba(60,50,46,.9)' : 'rgba(255,120,40,.8)'; g.fillRect(x, y, 3 * dpr, 3 * dpr); } g.fillStyle = '#2a2420'; g.beginPath(); g.ellipse(vx0, gy, 50 * U * crumble, 10 * U, 0, Math.PI, 0); g.fill(); }
      } else if (kind === 4) { // ===== 獨角獸：衝刺、角發光、把人頂上天 =====
        const ux = W * (-0.2 + Math.min(1, t / 1.5) * 0.75), hit = t > 1.5, fly = hit ? t - 1.5 : 0;
        rim(g, W, Hh, dpr, 'rgba(230,230,255,.7)', 24, o => { o.save(); o.translate(ux, gy); o.scale(U, U); const gal = t * 16; o.beginPath(); o.ellipse(0, -80, 70, 30, 0, 0, 7); o.fill();
          [[-45, 0], [-30, 1], [35, 2], [50, 3]].forEach(([lx, q]) => { const a = Math.sin(gal + q * 1.6) * (hit ? 0.2 : 0.7); limb(o, lx, -70, lx + Math.sin(a) * 40, -30, 9, 7); limb(o, lx + Math.sin(a) * 40, -30, lx + Math.sin(a) * 30 + Math.sin(a * 1.3) * 10, 0, 7, 6); });
          o.beginPath(); o.moveTo(40, -104); o.quadraticCurveTo(62, -150, 84, -164); o.quadraticCurveTo(100, -172, 112, -160); o.lineTo(140, -128); o.quadraticCurveTo(144, -116, 132, -114); o.lineTo(104, -124); o.quadraticCurveTo(90, -100, 70, -66); o.fill();
          o.beginPath(); o.moveTo(90, -170); o.lineTo(96, -186); o.lineTo(100, -168); o.fill();
          for (let q = 0; q < 9; q++) { const mx2 = 84 - q * 6, my2 = -168 + q * 9, sw2 = Math.sin(gal * 0.6 + q) * 8; o.beginPath(); o.moveTo(mx2, my2); o.quadraticCurveTo(mx2 - 26, my2 + 4 + sw2, mx2 - 40 + sw2, my2 + 18); o.lineTo(mx2 - 4, my2 + 10); o.fill(); }
          o.beginPath(); o.moveTo(-66, -90); o.quadraticCurveTo(-120, -80, -130, -40); o.quadraticCurveTo(-100, -70, -66, -70); o.fill(); o.restore(); });
        g.save(); g.translate(ux, gy); g.scale(U, U); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,250,220,1)'; g.lineWidth = 6; g.shadowColor = '#fff'; g.shadowBlur = 20; g.beginPath(); g.moveTo(112, -164); g.lineTo(150, -216); g.stroke(); g.restore();
        if (!hit) rim(g, W, Hh, dpr, 'rgba(160,180,255,.5)', 12, o => student(o, vx0, gy, S, { arms: t > 0.8 ? -2.5 : -0.4, flip: true, scarf: '#9a2020' }, t));
        else { if (fly < 0.1) { shk = 12; spray(vx0, gy - 120 * U, 30, 6, t); } rim(g, W, Hh, dpr, 'rgba(160,180,255,.5)', 12, o => { o.save(); o.translate(vx0 + fly * 220 * U, gy - fly * 520 * U + fly * fly * 200 * U); o.rotate(fly * 9); student(o, 0, 0, S, { arms: -2.5, flip: true, hat: false, scarf: '#9a2020' }, t); o.restore(); });
          g.save(); g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 30; q++) { const k = (fly * 0.9 + q / 30) % 1; g.fillStyle = `rgba(255,${200 + (q % 3) * 20},255,${1 - k})`; g.fillRect(vx0 + k * fly * 220 * U + Math.sin(q) * 20 * U, gy - k * fly * 420 * U, 3 * dpr, 3 * dpr); } g.restore(); }
      } else if (kind === 6) { // ===== 人馬：拉弓、慢動作的箭、射中倒下 =====
        const draw = clamp((t - 0.4) / 1.0), rel = 1.5, fly = clamp((t - rel) / 0.7), hit = t > rel + 0.7;
        rim(g, W, Hh, dpr, 'rgba(160,190,255,.6)', 16, o => { o.save(); o.translate(W * 0.18, gy); o.scale(U * 0.95, U * 0.95); o.beginPath(); o.ellipse(-10, -90, 70, 32, 0, 0, 7); o.fill(); [[-60, 0], [-40, 1], [30, 2], [46, 3]].forEach(([lx, q]) => { limb(o, lx, -80, lx + 4, -30, 10, 8); limb(o, lx + 4, -30, lx, 0, 8, 6); });
          o.beginPath(); o.moveTo(-76, -100); o.quadraticCurveTo(-120, -90, -126, -40); o.lineTo(-110, -70); o.fill(); limb(o, 40, -110, 50, -210, 22, 20); o.beginPath(); o.ellipse(56, -236, 16, 19, 0, 0, 7); o.fill();
          limb(o, 50, -196, 120, -200, 7, 6); limb(o, 50, -196, 120 - draw * 70, -198, 7, 6);
          o.strokeStyle = o.fillStyle; o.lineWidth = 5; o.beginPath(); o.arc(110, -200, 80, -1.15, 1.15); o.stroke(); o.lineWidth = 1.5; o.beginPath(); o.moveTo(110 + Math.cos(-1.15) * 80, -200 + Math.sin(-1.15) * 80); o.lineTo(t < rel ? 120 - draw * 70 : 112, -198); o.lineTo(110 + Math.cos(1.15) * 80, -200 + Math.sin(1.15) * 80); o.stroke();
          if (t < rel) { o.lineWidth = 3; o.beginPath(); o.moveTo(120 - draw * 70, -198); o.lineTo(220 - draw * 70, -198); o.stroke(); } o.restore(); });
        const ax = W * 0.18 + 140 * U + fly * (vx0 - W * 0.18 - 160 * U), ay = gy - 190 * U + fly * 40 * U;
        if (t >= rel && !hit) { g.save(); g.globalCompositeOperation = 'lighter'; const tg = g.createLinearGradient(ax - 120 * U, ay, ax, ay); tg.addColorStop(0, 'rgba(200,220,255,0)'); tg.addColorStop(1, 'rgba(220,235,255,.8)'); g.strokeStyle = tg; g.lineWidth = 4 * dpr; g.beginPath(); g.moveTo(ax - 120 * U, ay - 10 * U); g.lineTo(ax, ay); g.stroke(); g.restore(); g.strokeStyle = '#1a140e'; g.lineWidth = 3 * dpr; g.beginPath(); g.moveTo(ax - 50 * U, ay - 4 * U); g.lineTo(ax, ay); g.stroke(); }
        const fall = hit ? ease((t - rel - 0.7) / 0.8) : 0; if (hit && t < rel + 0.8) { shk = 10; spray(vx0, gy - 150 * U, 4, 5, t); }
        rim(g, W, Hh, dpr, 'rgba(160,180,255,.5)', 12, o => { o.save(); o.translate(vx0, gy); o.rotate(fall * 1.45); student(o, 0, 0, S, { arms: hit ? -1.6 : -0.4, flip: true, scarf: '#9a2020' }, t); if (hit) { o.lineWidth = 3; o.beginPath(); o.moveTo(-20 * S, -150 * S); o.lineTo(-70 * S, -160 * S); o.stroke(); } o.restore(); });
        if (hit) { g.fillStyle = '#6a0008'; g.beginPath(); g.ellipse(vx0 + 60 * U, gy + 4 * U, 60 * U * fall, 8 * U, 0, 0, 7); g.fill(); }
      } else if (kind === 7) { // ===== 狼人：仰天長嚎、撲過來、三道爪痕 =====
        const howl = t < 2.0, pounce = clamp((t - 2.0) / 0.4);
        rim(g, W, Hh, dpr, 'rgba(200,210,255,.7)', 20, o => { o.save(); o.translate(W * 0.25 + pounce * W * 0.35, gy - pounce * 120 * U); o.scale(U * (1 + pounce * 0.6), U * (1 + pounce * 0.6)); o.rotate(howl ? 0 : -0.4);
          const fur = H.furOutline([[-50, 0], [-60, -90], [-40, -170], [0, -200], [40, -170], [60, -90], [50, 0]], 13, 14); o.beginPath(); o.moveTo(-50, 0); fur.forEach(([x, y]) => o.lineTo(x, y)); o.closePath(); o.fill();
          o.save(); o.translate(0, -200); o.rotate(howl ? -0.9 + Math.sin(t * 3) * 0.05 : 0.2); o.beginPath(); o.ellipse(0, -20, 30, 26, 0, 0, 7); o.fill(); o.beginPath(); o.moveTo(10, -30); o.lineTo(76, -26); o.lineTo(70, -10); o.lineTo(10, -4); o.fill(); [-1, 1].forEach(sd => { o.beginPath(); o.moveTo(sd * 10 - 6, -40); o.lineTo(sd * 14 - 4, -78); o.lineTo(sd * 20 + 4, -42); o.fill(); }); o.restore();
          limb(o, -40, -150, -90, howl ? -60 : -230, 14, 10); limb(o, 40, -150, 90, howl ? -60 : -230, 14, 10); o.restore(); });
        if (howl) rim(g, W, Hh, dpr, 'rgba(160,180,255,.5)', 12, o => student(o, vx0, gy, S, { arms: t > 1.0 ? -2.6 : -0.4, flip: true, lean: t > 1.0 ? 0.15 : 0, scarf: '#9a2020' }, t));
        if (t > 2.4) { const k = clamp((t - 2.4) / 0.35); if (t < 2.55) shk = 16; g.save(); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, W, Hh); for (let q = 0; q < 3; q++) { const x0 = W * (0.2 + q * 0.22), y0 = Hh * 0.1, x1 = x0 + W * 0.3, y1 = Hh * 0.9; g.strokeStyle = '#7a0008'; g.lineWidth = 26 * U; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); g.stroke(); g.strokeStyle = '#d8203a'; g.lineWidth = 8 * U; g.stroke();
            if (k >= 1) for (let d = 0; d < 6; d++) { const dk = clamp((t - 2.8 - d * 0.05) / 1.5); const dx = x0 + (x1 - x0) * (d / 6 + 0.05), dy = y0 + (y1 - y0) * (d / 6 + 0.05); g.fillStyle = '#7a0008'; g.fillRect(dx - 3 * U, dy, 6 * U, dk * 120 * U); g.beginPath(); g.arc(dx, dy + dk * 120 * U, 5 * U, 0, 7); g.fill(); } } g.restore(); }
      }
      drawBlood(g, t, U);
      H.drawEmbers(g, emb, W, Hh, t, dpr, 'rgba(200,210,255,A)', 0.6);
      g.restore();
      lastShk = shk;
      finish(g, W, Hh, dpr, t, T0, U, '💀 ' + title, vName ? `${vName} 破產了` : '');
    }, snd);
  };
  root.MONO_MAGICFX = M;
})(typeof window !== 'undefined' ? window : globalThis);
