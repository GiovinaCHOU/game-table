// 大富翁：第 31 回合起每 3 回合的「襲擊」動畫（六個非像素主題）
// 諸神黃昏＝路西法（原創墮天使）｜動物星球＝猩猩爆擊（版畫風）｜夜城＝乞丐幫圍剿｜深空異種＝未知生物｜神佛之境＝扎小人詛咒｜魔法學院＝黑魔王（原創）
// 每個都有兩個版本：e.mode 'cash'（搶錢）／'bld'（現金不夠，砸一棟建築）；怪奇小鎮在 mono-town.js、幫派街區在 mono-gang.js
// 動畫裡不放文字；最後 0.7 秒由 overlay 慢慢淡出到黑；呼叫方式：MONO_EGGS.raid.call(monopoly 模組, SFX, { seat, mode })
(function (root) {
  const H = root.MONO_HORROR; if (!H) return;
  const { rnd, ease, clamp, cvs } = H;
  const RD = {}, T = 6600;
  const kit = (SFX) => root.MONO_SCORE && SFX ? root.MONO_SCORE.kit(SFX) : null;
  const eout = (x) => 1 - Math.pow(1 - clamp(x), 3), ein = (x) => Math.pow(clamp(x), 3), lerp = (a, b, k) => a + (b - a) * k;
  const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const shake = (g, k) => { if (k > 0) g.translate(rnd(-k, k), rnd(-k, k)); };

  // ---------- 剪影＋外緣光：先畫在離屏畫布，再整張加光暈（重疊的部位不會深淺不一） ----------
  // 外緣光用 1/4 解析度的小畫布做模糊再放大（手機上 shadowBlur 畫在全螢幕很吃效能）
  const off = {};
  function rim(g, W, Hh, glow, blur, fn, col, half, box) {
    if (half) return rimHalf(g, W, Hh, glow, blur, fn, col);
    if (!off.c || off.c.width !== W || off.c.height !== Hh) { [off.c, off.g] = cvs(W, Hh); const w4 = Math.max(1, Math.round(W / 4)), h4 = Math.max(1, Math.round(Hh / 4)); [off.s, off.sg] = cvs(w4, h4); [off.b, off.bg] = cvs(w4, h4); }
    // box＝只處理這一塊（x, y, w, h），人物剪影用，省掉整個畫面的清除與複製
    let bx = 0, by = 0, bw = W, bh = Hh; if (box) { bx = Math.max(0, Math.floor(box[0])); by = Math.max(0, Math.floor(box[1])); bw = Math.min(W - bx, Math.ceil(box[2])); bh = Math.min(Hh - by, Math.ceil(box[3])); if (bw <= 0 || bh <= 0) return; }
    const o = off.g; o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over'; o.shadowBlur = 0; o.clearRect(bx, by, bw, bh); o.save(); o.beginPath(); o.rect(bx, by, bw, bh); o.clip(); o.fillStyle = col || '#06040a'; o.strokeStyle = col || '#06040a'; fn(o); o.restore();
    if (glow) { const sg = off.sg, bg = off.bg, w4 = off.s.width, h4 = off.s.height, k = w4 / W, sx = Math.floor(bx * k), sy = Math.floor(by * k), sw = Math.ceil(bw * k) + 1, sh = Math.ceil(bh * k) + 1;
      sg.globalCompositeOperation = 'source-over'; sg.clearRect(sx, sy, sw, sh); sg.drawImage(off.c, bx, by, bw, bh, bx * k, by * k, bw * k, bh * k); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = glow; sg.fillRect(sx, sy, sw, sh);
      bg.clearRect(0, 0, w4, h4); bg.shadowColor = glow; bg.shadowBlur = Math.max(2, blur / 4); bg.drawImage(off.s, sx, sy, sw, sh, sx, sy, sw, sh); bg.drawImage(off.s, sx, sy, sw, sh, sx, sy, sw, sh); bg.shadowBlur = 0;
      const pad = Math.ceil(blur / 4) * 2 + 2, ex = Math.max(0, sx - pad), ey = Math.max(0, sy - pad), ew = Math.min(w4 - ex, sw + pad * 2), eh = Math.min(h4 - ey, sh + pad * 2);
      g.save(); g.imageSmoothingEnabled = true; g.drawImage(off.b, ex, ey, ew, eh, ex / k, ey / k, ew / k, eh / k); g.restore(); }
    g.drawImage(off.c, bx, by, bw, bh, bx, by, bw, bh);
  }
  // 半解析度版本（很大的剪影用，例如六翼路西法）：整個剪影畫在一半大小的畫布上再放大
  const offH = {};
  function rimHalf(g, W, Hh, glow, blur, fn, col) {
    const w2 = Math.round(W / 2), h2 = Math.round(Hh / 2);
    if (!offH.c || offH.c.width !== w2 || offH.c.height !== h2) { [offH.c, offH.g] = cvs(w2, h2); [offH.s, offH.sg] = cvs(Math.round(W / 8), Math.round(Hh / 8)); }
    const o = offH.g; o.setTransform(0.5, 0, 0, 0.5, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W, Hh); o.fillStyle = col || '#06040a'; o.strokeStyle = col || '#06040a'; fn(o);
    if (glow) { const sg = offH.sg, w8 = offH.s.width, h8 = offH.s.height; sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, w8, h8); sg.shadowColor = glow; sg.shadowBlur = Math.max(2, blur / 8); sg.drawImage(offH.c, 0, 0, w8, h8); sg.shadowBlur = 0; sg.globalCompositeOperation = 'source-in'; sg.fillStyle = glow; sg.fillRect(0, 0, w8, h8);
      g.drawImage(offH.s, 0, 0, W, Hh); }
    g.drawImage(offH.c, 0, 0, W, Hh);
  }
  function limb(g, x0, y0, x1, y1, w0, w1) { g.save(); g.strokeStyle = g.fillStyle; g.lineCap = 'round'; g.lineWidth = w0 + w1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore(); }
  // 被襲擊的人（剪影）：x,y＝腳底；o: fall（往後倒 0~1）、kneel（跪下 0~1）、arms 'down'|'up'|'out'|'cover'、lift（被吊起來）、jerk（抽搐）
  function person(g, x, y, s, o, t) {
    o = o || {}; g.save(); g.translate(x, y - (o.lift || 0)); g.rotate(-(o.fall || 0) * 1.35 + (o.jerk ? Math.sin(t * 60) * 0.06 * o.jerk : 0)); g.scale(s, s);
    const kn = o.kneel || 0, hip = -88 + kn * 40;
    if (kn > 0.5) { limb(g, -10, hip, -24, hip + 30, 9, 7); limb(g, -24, hip + 30, -40, 0, 7, 6); limb(g, 10, hip, 20, 0, 9, 7); }
    else { limb(g, -9, hip, -13, 0, 9, 7); limb(g, 9, hip, 13, 0, 9, 7); }
    g.beginPath(); g.moveTo(-17, hip - 64); g.quadraticCurveTo(-22, hip - 30, -15, hip + 2); g.lineTo(15, hip + 2); g.quadraticCurveTo(22, hip - 30, 17, hip - 64); g.closePath(); g.fill();
    const sh = hip - 60, A = { down: [22, 40, 24, 80], up: [28, -30, 24, -72], out: [46, 8, 82, 2], cover: [32, 26, 8, -18] }[o.arms || 'down'];
    [-1, 1].forEach(sd => { limb(g, sd * 15, sh + 4, sd * A[0], sh + A[1], 7, 6); limb(g, sd * A[0], sh + A[1], sd * A[2], sh + A[3], 6, 5); });
    g.beginPath(); g.ellipse(0, sh - 22, 15, 17, 0, 0, 7); g.fill(); g.fillRect(-6, sh - 10, 12, 10);
    g.restore();
  }
  // 金幣（側面翻轉）
  function coin(g, x, y, r, spin, a) { const w = Math.abs(Math.cos(spin)) * r + 0.6; g.save(); g.globalAlpha *= a == null ? 1 : a; g.fillStyle = '#8a5a10'; g.beginPath(); g.ellipse(x, y, w, r, 0, 0, 7); g.fill(); g.fillStyle = '#f0b828'; g.beginPath(); g.ellipse(x, y, w * 0.86, r * 0.86, 0, 0, 7); g.fill(); g.fillStyle = '#ffe48a'; g.beginPath(); g.ellipse(x - w * 0.25, y - r * 0.3, w * 0.3, r * 0.25, 0, 0, 7); g.fill(); g.restore(); }
  function bill(g, x, y, s, rot, a, c1, c2) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(Math.cos(rot * 2.3) * 0.8 + 0.2, 1); g.globalAlpha *= a == null ? 1 : a; g.fillStyle = c1 || '#7ab070'; g.fillRect(-14 * s, -7 * s, 28 * s, 14 * s); g.strokeStyle = c2 || '#2a5a2a'; g.lineWidth = 1.5 * s; g.strokeRect(-11 * s, -4.5 * s, 22 * s, 9 * s); g.beginPath(); g.arc(0, 0, 3 * s, 0, 7); g.stroke(); g.restore(); }
  // 噴出來的東西（金幣、碎片……）：每個帶自己的初速、旋轉
  function spray(n, seed, o) { const r = seeded(seed); return Array.from({ length: n }, () => ({ vx: (r() * 2 - 1) * (o.sx || 1), vy: -(o.up || 1) * (0.4 + r() * 0.8), sp: r() * 10, d: r() * (o.d || 0.3), s: 0.6 + r() * 0.7 })); }

  // ---------- 建築：先畫成兩張離屏圖（下半＝留下的、上半＝被毀的那一層），再用碎塊的方式毀掉上半 ----------
  const bcache = {};
  function bldImg(theme, U) {
    const key = theme + ':' + Math.round(U * 100); if (bcache[key]) return bcache[key];
    const w = Math.round(170 * U), hb = Math.round(150 * U), ht = Math.round(110 * U);
    const [bc, bg] = cvs(w, hb), [tc, tg] = cvs(w, ht); bg.scale(U, U); tg.scale(U, U);
    const B = BLD[theme] || BLD.ragnarok; B(bg, tg); return (bcache[key] = { base: bc, top: tc, w, hb, ht });
  }
  const win = (g, x, y, w, h, c, glow) => { g.save(); if (glow) { g.shadowColor = c; g.shadowBlur = 8; } g.fillStyle = c; g.fillRect(x, y, w, h); g.restore(); };
  const BLD = {
    ragnarok(b, t) { // 神殿：台階＋石柱／三角山牆＋屋頂神像
      b.fillStyle = '#2a1c1c'; b.fillRect(8, 128, 154, 22); b.fillStyle = '#3a2828'; b.fillRect(16, 118, 138, 12); for (let k = 0; k < 6; k++) { const x = 24 + k * 24; const gr = b.createLinearGradient(x, 0, x + 14, 0); gr.addColorStop(0, '#1e1414'); gr.addColorStop(0.5, '#5a4040'); gr.addColorStop(1, '#1e1414'); b.fillStyle = gr; b.fillRect(x, 6, 14, 112); b.fillStyle = '#4a3434'; b.fillRect(x - 3, 0, 20, 8); }
      b.fillStyle = '#ff9a3a'; b.globalAlpha = 0.5; b.fillRect(40, 40, 90, 70); b.globalAlpha = 1; for (let k = 0; k < 5; k++) { b.fillStyle = '#1e1414'; b.fillRect(38 + k * 24, 6, 14, 112); }
      t.fillStyle = '#3a2828'; t.fillRect(10, 92, 150, 18); t.beginPath(); t.moveTo(4, 94); t.lineTo(85, 40); t.lineTo(166, 94); t.closePath(); t.fillStyle = '#4a3232'; t.fill(); t.beginPath(); t.moveTo(24, 88); t.lineTo(85, 50); t.lineTo(146, 88); t.closePath(); t.fillStyle = '#2a1a1a'; t.fill();
      t.fillStyle = '#5a4040'; t.beginPath(); t.ellipse(85, 30, 8, 9, 0, 0, 7); t.fill(); t.fillRect(79, 36, 12, 18); t.fillRect(70, 52, 30, 4); t.fillStyle = '#ffb04a'; t.beginPath(); t.arc(85, 74, 7, 0, 7); t.fill();
    },
    animal(b, t) { // 樹屋：粗樹幹＋木平台／茅草屋頂（版畫配色：黑＋桃膚＋洋紅）
      b.fillStyle = '#0c0608'; b.beginPath(); b.moveTo(60, 150); b.quadraticCurveTo(70, 80, 66, 20); b.lineTo(104, 20); b.quadraticCurveTo(100, 80, 112, 150); b.fill(); b.strokeStyle = '#f4c8a0'; b.lineWidth = 2; for (let k = 0; k < 7; k++) { b.beginPath(); b.moveTo(72 + k * 4, 30); b.lineTo(70 + k * 5, 145); b.stroke(); }
      b.fillStyle = '#7a1650'; b.fillRect(14, 0, 142, 24); b.strokeStyle = '#0c0608'; b.lineWidth = 3; for (let x = 18; x < 156; x += 12) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, 24); b.stroke(); }
      t.fillStyle = '#b02a78'; t.fillRect(30, 62, 110, 48); t.fillStyle = '#0c0608'; t.fillRect(70, 76, 30, 34); win(t, 42, 72, 18, 16, '#f4c8a0'); win(t, 110, 72, 18, 16, '#f4c8a0');
      t.fillStyle = '#f4c8a0'; t.beginPath(); t.moveTo(10, 66); t.lineTo(85, 10); t.lineTo(160, 66); t.closePath(); t.fill(); t.strokeStyle = '#0c0608'; t.lineWidth = 2.5; for (let k = 0; k < 16; k++) { t.beginPath(); t.moveTo(85, 14); t.lineTo(14 + k * 9.5, 64); t.stroke(); }
    },
    cyber(b, t) { // 霓虹大樓：一排排窗戶／頂樓＋空白的霓虹招牌＋天線
      b.fillStyle = '#12101e'; b.fillRect(20, 0, 130, 150); for (let y = 8; y < 146; y += 14) for (let x = 28; x < 142; x += 16) win(b, x, y, 10, 7, (x * y) % 7 === 0 ? '#c02a8a' : (x + y) % 4 === 0 ? '#2ab8c8' : '#1e1a30', (x * y) % 7 === 0);
      t.fillStyle = '#16142a'; t.fillRect(28, 50, 114, 60); for (let x = 36; x < 136; x += 16) win(t, x, 92, 10, 7, '#3af0ff', true);
      t.save(); t.shadowColor = '#ff2a9a'; t.shadowBlur = 14; t.strokeStyle = '#ff3ab0'; t.lineWidth = 4; t.strokeRect(36, 58, 98, 26); t.fillStyle = 'rgba(255,58,176,.25)'; t.fillRect(36, 58, 98, 26); t.strokeStyle = '#ffe14a'; t.lineWidth = 3; t.beginPath(); t.moveTo(50, 71); t.lineTo(120, 71); t.stroke(); t.restore();
      t.strokeStyle = '#4a4a6a'; t.lineWidth = 3; t.beginPath(); t.moveTo(110, 50); t.lineTo(116, 6); t.moveTo(60, 50); t.lineTo(56, 24); t.stroke(); win(t, 113, 2, 6, 6, '#ff2a2a', true);
    },
    alien(b, t) { // 生物機械尖塔：肋骨狀的柱身／鼓起的頂部
      const bone = (g, x, y, w, h) => { const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#1a1c1c'); gr.addColorStop(0.5, '#6a6a5e'); gr.addColorStop(1, '#141616'); g.fillStyle = gr; g.fillRect(x, y, w, h); };
      bone(b, 50, 0, 70, 150); b.strokeStyle = '#0a0c0c'; b.lineWidth = 3; for (let y = 6; y < 150; y += 11) { b.beginPath(); b.moveTo(46, y); b.quadraticCurveTo(85, y + 8, 124, y); b.stroke(); } [40, 130].forEach(x => { b.fillStyle = '#202422'; b.fillRect(x - 4, 10, 8, 140); }); win(b, 78, 40, 14, 60, 'rgba(90,255,210,.55)', true);
      t.fillStyle = '#2a2c28'; t.beginPath(); t.moveTo(50, 110); t.quadraticCurveTo(20, 60, 85, 6); t.quadraticCurveTo(150, 60, 120, 110); t.closePath(); t.fill(); t.strokeStyle = '#0a0c0c'; t.lineWidth = 3; for (let k = 0; k < 7; k++) { t.beginPath(); t.ellipse(85, 30 + k * 11, 14 + k * 5, 4, 0, 0, Math.PI); t.stroke(); }
      win(t, 79, 46, 12, 30, 'rgba(90,255,210,.7)', true);
    },
    buddha(b, t) { // 紙紮屋：紅紙牆、金邊／翹起的屋簷
      b.fillStyle = '#9a1a14'; b.fillRect(22, 10, 126, 140); b.strokeStyle = '#e8b83a'; b.lineWidth = 3; b.strokeRect(26, 14, 118, 132); b.fillStyle = '#2a0a06'; b.fillRect(70, 80, 30, 70); b.fillStyle = '#e8b83a'; b.fillRect(36, 30, 26, 30); b.fillRect(108, 30, 26, 30); b.fillStyle = '#c8301e'; b.fillRect(39, 33, 20, 24); b.fillRect(111, 33, 20, 24); b.fillStyle = '#2a1206'; b.fillRect(14, 0, 142, 12);
      t.fillStyle = '#b8241a'; t.fillRect(36, 66, 98, 44); t.fillStyle = '#e8b83a'; t.fillRect(70, 76, 30, 24); t.fillStyle = '#2a1206'; t.beginPath(); t.moveTo(2, 70); t.quadraticCurveTo(40, 64, 60, 28); t.lineTo(110, 28); t.quadraticCurveTo(130, 64, 168, 70); t.lineTo(168, 62); t.quadraticCurveTo(132, 58, 116, 20); t.lineTo(54, 20); t.quadraticCurveTo(38, 58, 2, 62); t.fill(); t.fillStyle = '#e8b83a'; t.fillRect(56, 14, 58, 6); t.beginPath(); t.arc(85, 10, 6, 0, 7); t.fill();
    },
    magic(b, t) { // 城堡塔樓：石塊／尖錐屋頂
      const gr = b.createLinearGradient(40, 0, 130, 0); gr.addColorStop(0, '#12141e'); gr.addColorStop(0.5, '#3a3e54'); gr.addColorStop(1, '#10121a'); b.fillStyle = gr; b.fillRect(40, 0, 90, 150); b.strokeStyle = '#0a0b12'; b.lineWidth = 2; for (let y = 0; y < 150; y += 12) { b.beginPath(); b.moveTo(40, y); b.lineTo(130, y); b.stroke(); for (let x = 40 + (y / 12 % 2) * 12; x < 130; x += 24) { b.beginPath(); b.moveTo(x, y); b.lineTo(x, y + 12); b.stroke(); } } win(b, 76, 50, 18, 30, '#ffc870', true);
      t.fillStyle = '#2a2e42'; t.fillRect(34, 80, 102, 30); for (let x = 34; x < 136; x += 17) t.fillRect(x, 72, 10, 10); t.beginPath(); t.moveTo(30, 82); t.lineTo(85, 0); t.lineTo(140, 82); t.closePath(); const rg = t.createLinearGradient(30, 0, 140, 0); rg.addColorStop(0, '#1a1030'); rg.addColorStop(0.5, '#4a2a6a'); rg.addColorStop(1, '#140c24'); t.fillStyle = rg; t.fill(); win(t, 78, 46, 14, 20, '#ffc870', true);
    }
  };
  // 把上半層切成小塊；k＝0 完整、1 完全散掉；dir：'down' 往下掉、'out' 往外炸、'up' 被往上扯走
  const shardCache = {};
  function shards(key, cols, rows, seed) { if (shardCache[key]) return shardCache[key]; const r = seeded(seed); const L = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) L.push({ i, j, vx: r() * 2 - 1, vy: r(), sp: r() * 2 - 1, d: r() * 0.25 }); return (shardCache[key] = L); }
  function bldDraw(g, theme, U, x, y, k, o) {
    o = o || {}; const B = bldImg(theme, U), bx = x - B.w / 2;
    g.drawImage(B.base, bx, y - B.hb);
    if (o.tint) { g.save(); g.globalCompositeOperation = 'source-atop'; g.restore(); }
    const ty = y - B.hb - B.ht + Math.round(4 * U);
    if (k <= 0) { g.drawImage(B.top, bx, ty); if (o.overlay) o.overlay(g, bx, ty, B.w, B.ht); return { x, top: ty, mid: y - B.hb }; }
    const C = 7, Rw = 6, sw = B.w / C, sh = B.ht / Rw, L = shards(theme + C, C, Rw, 99);
    L.forEach(p => { const kk = clamp((k - p.d) / (1 - p.d)); if (kk >= 1) return; const sx = p.i * sw, sy = p.j * sh;
      let dx = 0, dy = 0, rot = 0; const e = kk;
      if (o.dir === 'up') { dy = -e * e * 900 * U * (0.6 + p.vy); dx = p.vx * e * 40 * U; rot = p.sp * e * 2; }
      else if (o.dir === 'out') { dx = p.vx * e * 260 * U; dy = -Math.sin(e * 2.2) * 120 * U * (0.5 + p.vy) + e * e * 380 * U; rot = p.sp * e * 8; }
      else { dx = p.vx * e * 70 * U; dy = e * e * 420 * U * (0.6 + p.vy); rot = p.sp * e * 4; }
      g.save(); g.globalAlpha *= 1 - clamp((kk - 0.7) / 0.3); g.translate(bx + sx + sw / 2 + dx, ty + sy + sh / 2 + dy); g.rotate(rot); g.drawImage(B.top, sx, sy, sw, sh, -sw / 2, -sh / 2, sw + 1, sh + 1); g.restore(); });
    if (o.overlay) o.overlay(g, bx, ty, B.w, B.ht);
    return { x, top: ty, mid: y - B.hb };
  }
  // 地面上的目標：人或建築；回傳打擊點
  function target(g, e, U, x, y, k, o, theme) {
    if (e.mode === 'bld') { const r = bldDraw(g, theme, U, x, y, k, o); return [x, r.top + 50 * U]; }
    rim(g, g.canvas.width, g.canvas.height, o.rim || 'rgba(255,200,160,.8)', 18 * U, (q) => person(q, x, y, U * 1.05, o.pose || {}, o.t || 0), null, false, [x - 170 * U, y - 300 * U, 340 * U, 330 * U]);
    return [x, y - 140 * U];
  }
  RD.shared = { rim, person, coin, bill, spray, bldDraw, target, limb, seeded, eout, ein, lerp, shake, T };

  // ======================= 諸神黃昏：路西法降臨 =======================
  // 原創墮天使：六片焦黑翅膀、裂開的光環、彎角、身上熔岩裂紋、發光雙眼；不戴帽子、翅膀上不放眼睛
  function wing(g, sd, base, spread, len, t, k) {
    g.save(); g.scale(sd, 1); g.rotate(lerp(1.3, base, spread) + Math.sin(t * 3 + k) * 0.04);
    g.beginPath(); g.moveTo(0, -9); g.quadraticCurveTo(len * 0.45, -len * 0.2, len, -len * 0.04); g.lineTo(len * 0.96, len * 0.04); g.quadraticCurveTo(len * 0.45, len * 0.0, 0, 12); g.fill();
    const fan = (n, lmin, lmax, w, a0, a1, off) => { for (let f = 0; f < n; f++) { const u = f / (n - 1), px = len * (0.12 + u * 0.86), py = -len * 0.13 * Math.sin(u * Math.PI) + off, fl = lerp(lmin, lmax, u) * len * (0.9 + Math.sin(f * 7.3 + k) * 0.1), fa = lerp(a0, a1, u) + Math.sin(t * 2.5 + f) * 0.02;
      g.save(); g.translate(px, py); g.rotate(fa); g.beginPath(); g.moveTo(0, -w); g.quadraticCurveTo(fl * 0.6, -w * 1.1, fl, -w * 0.15); g.lineTo(fl * 0.9, w * 0.25); g.lineTo(fl * 0.94, w * 0.7); g.quadraticCurveTo(fl * 0.45, w * 1.2, 0, w); g.fill(); g.restore(); } };
    fan(13, 0.32, 0.72, 13, 1.45, 0.35, 0); // 飛羽：越外側越長、越往外翹
    fan(10, 0.18, 0.34, 11, 1.25, 0.5, -6); // 覆羽：短、疊在上面
    g.restore();
  }
  function lucifer(g, x, y, s, t, spread, o) {
    o = o || {}; g.save(); g.translate(x, y); g.scale(s, s);
    // 三對翅膀：上、中、下
    [[-0.95, 250, 0], [-0.25, 290, 1], [0.38, 230, 2]].forEach(([b, len, k]) => [-1, 1].forEach(sd => { g.save(); g.translate(sd * 14, -150 + k * 18); wing(g, sd, b, spread, len, t, k + sd); g.restore(); }));
    // 身體：修長、漂浮（腳尖朝下）
    g.beginPath(); g.moveTo(-26, -168); g.quadraticCurveTo(-34, -120, -16, -70); g.quadraticCurveTo(-20, 10, -6, 90); g.lineTo(6, 90); g.quadraticCurveTo(20, 10, 16, -70); g.quadraticCurveTo(34, -120, 26, -168); g.closePath(); g.fill();
    const reach = o.reach || 0; limb(g, -24, -160, -54 - reach * 20, -100 + reach * 40, 8, 6); limb(g, -54 - reach * 20, -100 + reach * 40, -60 - reach * 70, -40 + reach * 90, 6, 4);
    limb(g, 24, -160, 56, -110, 8, 6); limb(g, 56, -110, 70, -60, 6, 4);
    for (let c = 0; c < 4; c++) { const hx = -60 - reach * 70, hy = -40 + reach * 90; limb(g, hx, hy, hx - 6 + c * 4, hy + 16, 2.5, 0.8); }
    // 頭＋往後彎的角
    g.beginPath(); g.ellipse(0, -192, 15, 19, 0, 0, 7); g.fill();
    [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 8, -204); g.quadraticCurveTo(sd * 30, -226, sd * 22, -262); g.quadraticCurveTo(sd * 18, -232, sd * 2, -210); g.fill(); });
    // 裂開的光環（缺一角）
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,120,30,${0.25 + (o.flare || 0) * 0.3})`; g.lineWidth = 16; g.beginPath(); g.ellipse(0, -226, 34, 9, 0, 0, 7); g.stroke(); g.strokeStyle = `rgba(255,170,60,${0.55 + (o.flare || 0) * 0.45})`; g.lineWidth = 5; g.beginPath(); g.ellipse(0, -226, 34, 9, 0, 0.5, 2.2); g.stroke(); g.beginPath(); g.ellipse(0, -226, 34, 9, 0, 2.55, 5.9); g.stroke(); g.restore();
    // 熔岩裂紋＋眼睛
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,110,30,.75)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, -150); g.lineTo(2, -128); g.lineTo(-4, -104); g.lineTo(5, -78); g.moveTo(2, -128); g.lineTo(12, -118); g.moveTo(-4, -104); g.lineTo(-14, -94); g.stroke();
    g.restore(); g.restore();
  }
  function luciferEyes(g, x, y, s, ey) { g.save(); g.translate(x, y); g.scale(s, s); g.globalCompositeOperation = 'lighter'; g.shadowColor = '#ff2a00'; g.shadowBlur = 22; g.fillStyle = `rgba(255,${190 + ey * 60},140,${ey})`; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 6, -194, 6, 2.2, sd * 0.35, 0, 7); g.fill(); }); g.restore(); }
  RD.ragnarok = function (ui, SFX, e) {
    const bld = e.mode === 'bld', U0 = {}, cs = spray(26, 7, { sx: 1.2, up: 1.4 }), emb = H.embers(50), fire = spray(40, 11, { sx: 1, up: 1 });
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.drone(0, 6.4, [32.7, 49, 65.4], { lp: 320, vol: 0.12, sweep: 500 }); K.wind(0, 6.4, 0.07); K.pad(0.3, 5.6, [65.4, 77.8, 98, 130.8], 0.05, 900); // 低沉的管風琴和弦
      K.choir(0.8, 4.6, [130.8, 155.6, 196], { v: 'aa', vol: 0.05, bend: 0.94 }); K.riser(0.4, 1.6, 60, 300, 0.08);
      [1.3, 1.65, 2.0].forEach((d, i) => K.whoosh(d, 0.4, i % 2 === 0, 0.25)); K.boom(2.2, 60, 24, 1.6, 0.5); K.stinger(2.25, 0.25);
      K.whoosh(2.6, 0.5, false, 0.35); if (bld) { K.boom(3.0, 70, 20, 1.8, 0.6); K.fire(3.0, 2.4, 0.35); K.crack(3.1, 0.8, 0.3); } else { K.growl(2.9, 0.9, 60, 0.35); K.tear(3.05, 0.4, 0.3); for (let i = 0; i < 12; i++) K.chime(3.1 + i * 0.06, 1500 + (i % 5) * 220, 0.05); }
      for (let i = 0; i < 4; i++) K.whoosh(4.4 + i * 0.32, 0.35, true, 0.18); K.howl(4.6, 1.4, 150, 0.05); };
    const T0 = T / 1000;
    return ui.overlay(T, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420; g.save(); shake(g, (t > 2.2 && t < 2.5) || (t > 2.95 && t < 3.3) ? 7 * U : t < 1 ? 1.5 * U : 0);
      // 天空：從暗灰紅轉成血紅，雲層翻滾
      const red = ease(t / 1.2), sky = g.createLinearGradient(0, 0, 0, Hh); sky.addColorStop(0, `rgb(${lerp(20, 60, red)},4,${lerp(10, 8, red)})`); sky.addColorStop(0.55, `rgb(${lerp(50, 150, red)},${lerp(14, 24, red)},${lerp(20, 30, red)})`); sky.addColorStop(1, '#120204'); g.fillStyle = sky; g.fillRect(-40, -40, W + 80, Hh + 80);
      const tex = H.smoke('lucRed', [120, 20, 30], 0.3, 31); H.cloudLayer(g, tex, W, Hh, 2.6 * U, t * 50 * U, Hh * 0.08, 0.6);
      // 地面：黑色懸崖
      const gy = Hh * 0.8, cx = W / 2; g.fillStyle = '#0a0204'; g.beginPath(); g.moveTo(-20, gy); for (let x = 0; x <= W + 20; x += 30 * U) g.lineTo(x, gy + Math.sin(x * 0.03) * 6 * U); g.lineTo(W + 20, Hh + 20); g.lineTo(-20, Hh + 20); g.fill();
      // 路西法：從雲中降下 → 展翅 → 眼睛亮起 → 俯衝伸手 → 升回雲裡
      const desc = eout((t - 0.9) / 1.3), spread = ease((t - 1.5) / 0.7), dive = ease((t - 2.5) / 0.5), back = ein((t - 4.3) / 1.3);
      const ls = U * lerp(0.62, 0.95, dive) * (1 - back * 0.4), lx = cx + Math.sin(t * 1.3) * 8 * U, ly = lerp(-Hh * 0.35, Hh * 0.38, desc) + dive * Hh * 0.04 - back * Hh * 0.75;
      const flare = clamp(1 - Math.abs(t - 2.3) * 4), eyes = clamp((t - 2.15) / 0.2);
      if (t > 0.9) { g.save(); const flap = t > 4.3 ? Math.sin(t * 9) * 0.25 : 0; rim(g, W, Hh, `rgba(255,${80 + flare * 120},40,.9)`, (16 + flare * 30) * U, (q) => lucifer(q, lx, ly, ls, t, clamp(spread - flap), { reach: bld ? 0 : clamp((t - 2.7) / 0.3) * (1 - clamp((t - 3.6) / 0.5)), flare }), null, true); if (eyes > 0) luciferEyes(g, lx, ly, ls, eyes); g.restore(); }
      // 地獄火柱（砸房版）
      const px = cx, hit = clamp((t - 2.9) / 0.15);
      if (bld && t > 2.85 && t < 4.6) { const a = clamp((t - 2.85) / 0.1) * (1 - clamp((t - 4.0) / 0.6)), w0 = 95 * U * (1 + Math.sin(t * 30) * 0.06);
        g.save(); g.globalCompositeOperation = 'lighter'; const fg = g.createLinearGradient(px - w0, 0, px + w0, 0); fg.addColorStop(0, 'rgba(255,60,0,0)'); fg.addColorStop(0.3, `rgba(255,110,20,${0.6 * a})`); fg.addColorStop(0.5, `rgba(255,240,180,${0.95 * a})`); fg.addColorStop(0.7, `rgba(255,110,20,${0.6 * a})`); fg.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = fg; g.fillRect(px - w0, -20, w0 * 2, gy - 150 * U + 20); g.restore(); }
      // 目標
      const [tx, ty] = target(g, e, U, cx, gy, bld ? clamp((t - 2.95) / 1.4) : 0, bld ? { dir: 'down' } : { rim: 'rgba(255,120,60,.9)', t, pose: t < 2.2 ? {} : t < 3.0 ? { arms: 'cover' } : { fall: clamp((t - 3.0) / 0.3) * 0.25, arms: 'out', jerk: t < 3.6 ? 1 : 0 } }, 'ragnarok');
      // 搶錢：金幣噴出 → 變成黑羽毛飄落
      if (!bld && t > 3.0) cs.forEach(c => { const a = t - 3.0 - c.d * 0.4; if (a < 0) return; const x = tx + c.vx * a * 140 * U, y = ty + c.vy * a * 160 * U + a * a * 60 * U - Math.min(a, 0.8) * 0 , turn = clamp((a - 0.5) / 0.6);
        if (turn < 1) coin(g, x, y - a * 120 * U * (1 - turn), 9 * U * c.s, c.sp + t * 9, 1 - turn);
        if (turn > 0) { g.save(); g.translate(x + Math.sin(t * 3 + c.sp) * 20 * U, y - a * 40 * U + a * a * 30 * U); g.rotate(Math.sin(t * 2 + c.sp) * 0.8); g.globalAlpha = turn * (1 - clamp((t - 5.3) / 0.6)); g.fillStyle = '#050102'; g.beginPath(); g.moveTo(0, -14 * U * c.s); g.quadraticCurveTo(6 * U, 0, 0, 14 * U * c.s); g.quadraticCurveTo(-5 * U, 0, 0, -14 * U * c.s); g.fill(); g.restore(); } });
      if (bld && t > 2.95) fire.forEach(c => { const a = t - 2.95 - c.d; if (a < 0 || a > 2) return; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,${120 + c.s * 80},40,${(1 - a / 2) * 0.8})`; g.beginPath(); g.arc(tx + c.vx * a * 120 * U, ty - a * 160 * U * c.s + Math.sin(a * 6 + c.sp) * 10 * U, 3 * U * c.s, 0, 7); g.fill(); g.restore(); });
      g.save(); g.globalCompositeOperation = 'lighter'; H.drawEmbers(g, emb, W, Hh, t, U, 'rgba(255,110,40,A)', 1); g.restore();
      if (flare > 0) { g.fillStyle = `rgba(255,80,40,${flare * 0.35})`; g.fillRect(0, 0, W, Hh); }
      if (t > 2.95 && t < 3.15) { g.fillStyle = `rgba(255,230,200,${(1 - (t - 2.95) / 0.2) * 0.6})`; g.fillRect(0, 0, W, Hh); }
      g.restore(); H.vignette(g, W, Hh, 0.85); H.grain(g, W, Hh, 0.07); void T0; void U0;
    }, snd);
  };

  // ======================= 動物星球：猩猩爆擊（版畫風：粗黑排線、洋紅＋桃膚色、閃電放射背景）=======================
  const MAG = '#b02a78', MAGD = '#7a1650', INK = '#0c0608', PEACH = '#f4c8a0', TONGUE = '#a8505a';
  const gcache = {};
  // 大猩猩的頭（原創構圖：正面怒吼）；jaw＝嘴張開 0~1，先畫在離屏畫布（420×470）再縮放
  function gorillaHead(jaw) {
    const q = Math.round(clamp(jaw) * 6); if (gcache[q]) return gcache[q]; const J = q / 6;
    const [c, g] = cvs(840, 940); g.scale(2, 2); const r = seeded(17 + q);
    const head = new Path2D(); head.moveTo(210, 22); head.bezierCurveTo(300, 20, 350, 90, 362, 170); head.bezierCurveTo(400, 210, 404, 300, 360, 340); head.bezierCurveTo(330, 400 + J * 30, 270, 450 + J * 10, 210, 452 + J * 12); head.bezierCurveTo(150, 450 + J * 10, 90, 400 + J * 30, 60, 340); head.bezierCurveTo(16, 300, 20, 210, 58, 170); head.bezierCurveTo(70, 90, 120, 20, 210, 22); head.closePath();
    g.fillStyle = MAG; g.fill(head);
    g.save(); g.clip(head);
    g.fillStyle = MAGD; g.beginPath(); g.ellipse(330, 260, 90, 220, 0.1, 0, 7); g.fill(); g.beginPath(); g.ellipse(80, 280, 50, 160, -0.1, 0, 7); g.fill();
    // 排線：額頭橫紋、臉頰斜線、陰影區密排
    g.strokeStyle = INK; g.lineCap = 'round';
    const hatch = (x0, y0, x1, y1, n, ang, len, w) => { for (let i = 0; i < n; i++) { const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), a = ang + (r() - 0.5) * 0.35, l = len * (0.6 + r() * 0.7); g.lineWidth = w * (0.6 + r() * 0.8); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } };
    hatch(130, 60, 290, 115, 60, 0.05, 40, 2.4); hatch(290, 150, 385, 370, 130, 1.25, 38, 2.8); hatch(25, 180, 115, 370, 100, 1.9, 36, 2.8); hatch(140, 380, 280, 450, 60, 1.57, 24, 2.4);
    g.strokeStyle = PEACH; hatch(100, 136, 200, 150, 14, -0.35, 30, 2); hatch(220, 136, 320, 150, 14, 0.35, 30, 2); hatch(60, 240, 100, 300, 14, 1.6, 24, 1.6); g.strokeStyle = INK;
    for (let i = 0; i < 16; i++) { g.lineWidth = 2.5; g.beginPath(); g.moveTo(150 + i * 8, 60 + Math.abs(i - 8) * 3); g.quadraticCurveTo(210, 40, 270 - i * 2, 70); g.stroke(); }
    // 眉骨：粗黑、皺起來
    g.fillStyle = INK; g.beginPath(); g.moveTo(70, 168); g.quadraticCurveTo(140, 128, 204, 176); g.lineTo(216, 176); g.quadraticCurveTo(280, 128, 350, 168); g.lineTo(344, 196); g.quadraticCurveTo(280, 170, 212, 206); g.quadraticCurveTo(140, 170, 76, 196); g.closePath(); g.fill();
    hatch(90, 196, 330, 230, 60, 0.2, 26, 2);
    // 眼睛：深陷、一點反光
    [[150, 214, 0.2], [270, 214, -0.2]].forEach(([x, y, a]) => { g.fillStyle = INK; g.beginPath(); g.ellipse(x, y, 26, 11, a, 0, 7); g.fill(); g.fillStyle = PEACH; g.beginPath(); g.ellipse(x + (a > 0 ? 6 : -6), y - 2, 5, 3, 0, 0, 7); g.fill(); });
    // 鼻子：寬、兩個大鼻孔
    g.lineWidth = 3; g.beginPath(); g.moveTo(190, 216); g.quadraticCurveTo(176, 250, 166, 270); g.moveTo(230, 216); g.quadraticCurveTo(244, 250, 254, 270); g.stroke();
    g.fillStyle = INK; [[184, 280, 0.5], [236, 280, -0.5]].forEach(([x, y, a]) => { g.beginPath(); g.ellipse(x, y, 20, 12, a, 0, 7); g.fill(); });
    hatch(140, 290, 280, 310, 36, 0.1, 30, 2.2);
    // 嘴：張開時是一個大黑洞＋舌頭＋上下獠牙
    const my = 340 + J * 18, mw = 110 + J * 30, mh = 16 + J * 92;
    g.fillStyle = PEACH; g.beginPath(); g.ellipse(210, my - 4, mw + 10, mh * 0.6 + 14, 0, Math.PI, 0); g.fill();
    g.fillStyle = INK; g.beginPath(); g.moveTo(210 - mw, my); g.bezierCurveTo(210 - mw * 0.8, my - mh * 0.6, 210 + mw * 0.8, my - mh * 0.6, 210 + mw, my); g.bezierCurveTo(210 + mw * 0.7, my + mh * 1.1, 210 - mw * 0.7, my + mh * 1.1, 210 - mw, my); g.fill();
    if (J > 0.2) { g.fillStyle = TONGUE; g.beginPath(); g.ellipse(210, my + mh * 0.62, mw * 0.55, mh * 0.3, 0, Math.PI * 1.05, Math.PI * 1.95, true); g.fill(); g.strokeStyle = INK; hatch(160, my + mh * 0.4, 260, my + mh * 0.7, 18, 1.4, 16, 1.5);
      g.fillStyle = '#fff4e8'; [[-1], [1]].forEach(([sd]) => { const fx = 210 + sd * mw * 0.62; g.beginPath(); g.moveTo(fx - 12, my - mh * 0.3); g.lineTo(fx + 12, my - mh * 0.3); g.lineTo(fx + sd * 4, my - mh * 0.3 + 26 + J * 18); g.fill(); g.beginPath(); g.moveTo(fx - 10 - sd * 8, my + mh * 0.75); g.lineTo(fx + 10 - sd * 8, my + mh * 0.75); g.lineTo(fx - sd * 10, my + mh * 0.75 - 18 - J * 10); g.fill(); }); }
    g.restore();
    // 外緣的毛：一圈短黑線
    g.strokeStyle = INK; g.lineWidth = 3; for (let i = 0; i < 220; i++) { const a = i / 220 * 6.283, rx = 175 + Math.sin(a * 3) * 10, x = 210 + Math.cos(a) * rx * (a > 0.3 && a < 2.8 ? 1.0 : 1.04), y = 240 + Math.sin(a) * 214; const l = 10 + r() * 22; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + 0.4) * l, y + Math.sin(a + 0.4) * l); g.stroke(); }
    return (gcache[q] = c);
  }
  // 拳頭（四個指節＋排線）
  function fist(g, x, y, s, rot, flip) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * (flip ? -1 : 1), s); const r = seeded(5);
    g.fillStyle = MAG; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(-60, -40); for (let k = 0; k < 4; k++) g.quadraticCurveTo(-60 + k * 30 + 15, -64, -30 + k * 30, -40); g.quadraticCurveTo(70, 10, 40, 60); g.lineTo(-50, 60); g.quadraticCurveTo(-80, 10, -60, -40); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 3; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(-60 + k * 30, -42); g.lineTo(-56 + k * 30, -4); g.stroke(); } g.beginPath(); g.moveTo(-60, 0); g.quadraticCurveTo(0, 14, 50, 0); g.stroke();
    g.fillStyle = MAGD; g.beginPath(); g.moveTo(-50, 60); g.quadraticCurveTo(-78, 20, -62, -10); g.lineTo(-30, 30); g.closePath(); g.fill(); for (let i = 0; i < 22; i++) { const xx = -50 + r() * 90, yy = 10 + r() * 44; g.lineWidth = 2.4; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 6, yy + 14); g.stroke(); }
    g.restore();
  }
  // 閃電放射背景（黑底＋桃膚色鋸齒閃電）
  function bolts(g, W, Hh, cx, cy, t, k) {
    g.fillStyle = INK; g.fillRect(-40, -40, W + 80, Hh + 80); const R0 = Math.hypot(W, Hh); g.fillStyle = PEACH;
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + t * 0.25 + Math.sin(i * 3.1) * 0.2, w = 0.07 + (i % 3) * 0.02, l = R0 * (0.7 + 0.3 * k);
      g.beginPath(); g.moveTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60); const n = 5; for (let j = 1; j <= n; j++) { const u = j / n, rr = l * u, aa = a + (j % 2 ? w : -w) * (1 + u); g.lineTo(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr); }
      for (let j = n; j >= 1; j--) { const u = j / n, rr = l * u * 0.96, aa = a + (j % 2 ? w : -w) * (1 + u) + w * 1.6 * u; g.lineTo(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr); } g.closePath(); g.fill(); }
  }
  function jungle(g, W, Hh, t, sway, U) {
    g.fillStyle = PEACH; g.fillRect(-40, -40, W + 80, Hh + 80); const r = seeded(23);
    for (let i = 0; i < 15; i++) { const side = i % 3, x = side === 0 ? (i / 15) * W + r() * 40 * U : side === 1 ? r() * W * 0.1 : W - r() * W * 0.1, y = side === 0 ? r() * Hh * 0.08 : Hh * 0.1 + r() * Hh * 0.5, s = (70 + r() * 90) * U, a = (side === 1 ? 0 : side === 2 ? 3.14 : 1.57) + (r() - 0.5) * 1.6 + Math.sin(t * 9 + i) * sway * 0.25;
      g.save(); g.translate(x + Math.sin(t * 13 + i) * sway * 8 * U, y); g.rotate(a); g.fillStyle = INK; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 0.5, -s * 0.35, s, 0); g.quadraticCurveTo(s * 0.5, s * 0.35, 0, 0); g.fill(); g.strokeStyle = PEACH; g.lineWidth = 2 * U; g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 0.9, 0); g.stroke(); g.restore(); }
    g.fillStyle = INK; g.fillRect(-40, Hh * 0.82, W + 80, Hh); g.strokeStyle = PEACH; g.lineWidth = 2 * U; for (let x = 0; x < W; x += 14 * U) { g.beginPath(); g.moveTo(x, Hh * 0.84); g.lineTo(x + 8 * U, Hh * 0.9); g.stroke(); }
  }
  RD.animal = function (ui, SFX, e) {
    const bld = e.mode === 'bld', bills = spray(30, 3, { sx: 1, up: 1.3 });
    const snd = () => { const K = kit(SFX); if (!K) return;
      [0.25, 0.6, 0.95].forEach((d, i) => { K.drum(d, 55, 0.5, 0.35); K.crack(d + 0.05, 0.25, 0.12 + i * 0.05); }); K.wind(0, 1.1, 0.06);
      K.boom(1.08, 90, 30, 0.8, 0.32); K.stinger(1.08, 0.25); K.growl(1.12, 1.6, 62, 0.42); K.growl(1.15, 1.5, 95, 0.26); K.howl(1.2, 1.3, 210, 0.12); K.scream(1.3, 1.0, 330, 0.05);
      if (bld) { K.whoosh(3.0, 0.3, false, 0.35); K.boom(3.3, 70, 22, 1.4, 0.48); K.crack(3.32, 0.9, 0.4); K.tear(3.35, 0.5, 0.3); } else { K.whoosh(3.0, 0.35, false, 0.4); K.drum(3.25, 90, 0.45, 0.2); K.boom(3.26, 120, 50, 0.5, 0.3); for (let i = 0; i < 10; i++) K.whoosh(3.3 + i * 0.1, 0.2, i % 2 === 0, 0.06); }
      for (let i = 0; i < 8; i++) K.drum(3.9 + i * 0.16, i % 2 ? 70 : 62, 0.34, 0.18); K.growl(4.0, 1.2, 70, 0.3); };
    return ui.overlay(T, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, cx = W / 2, gy = Hh * 0.82; g.save();
      const close = t >= 1.1 && t < 2.75;
      if (close) { // 特寫：閃電炸開＋猩猩的臉衝到鏡頭前怒吼
        shake(g, (t < 2.4 ? 9 : 3) * U); const k = eout((t - 1.1) / 0.25); bolts(g, W, Hh, cx, Hh * 0.42, t, k);
        const jaw = clamp((t - 1.15) / 0.25) * (0.85 + Math.sin(t * 30) * 0.15 * (t < 2.4 ? 1 : 0)), sc = U * 1.55 * (1.5 - 0.5 * eout((t - 1.1) / 0.18)) * (1 + Math.sin(t * 40) * 0.01), img = gorillaHead(jaw);
        g.save(); g.translate(cx + Math.sin(t * 37) * 6 * U, Hh * 0.47); g.rotate(Math.sin(t * 23) * 0.03); g.drawImage(img, -210 * sc, -240 * sc, 420 * sc, 470 * sc); g.restore();
        g.strokeStyle = INK; g.lineWidth = 4 * U; for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + t, r0 = Math.hypot(W, Hh) * (0.42 + ((t * 2 + i * 0.37) % 1) * 0.1); g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, Hh * 0.5 + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * (r0 + 120 * U), Hh * 0.5 + Math.sin(a) * (r0 + 120 * U)); g.stroke(); }
      } else {
        if (t < 1.1) jungle(g, W, Hh, t, clamp(t / 0.3), U);
        else { bolts(g, W, Hh, cx, Hh * 0.3, t * 0.4, 1); g.fillStyle = 'rgba(12,6,8,.45)'; g.fillRect(-40, -40, W + 80, Hh + 80); g.fillStyle = INK; g.fillRect(-40, Hh * 0.82, W + 80, Hh); g.strokeStyle = PEACH; g.lineWidth = 2 * U; for (let x = 0; x < W; x += 14 * U) { g.beginPath(); g.moveTo(x, Hh * 0.84); g.lineTo(x + 8 * U, Hh * 0.9); g.stroke(); } } shake(g, t < 1.1 ? (Math.sin(t * 9) > 0.7 ? 4 * U : 0) : (t > 3.2 && t < 3.6 ? 10 * U : 0));
        // 遠景：猩猩（大頭＋兩個拳頭）——第 2.75 秒後從上方壓下來
        if (t >= 2.75) { const rise = eout((t - 2.75) / 0.3), out = ein((t - 5.0) / 0.8), hx = cx, hy = lerp(-Hh * 0.3, Hh * 0.26, rise) - out * Hh * 0.5, hs = U * 0.72;
          const jaw = t < 3.9 ? 0.25 : 0.5 + Math.sin(t * 20) * 0.2; g.drawImage(gorillaHead(jaw), hx - 210 * hs, hy - 240 * hs, 420 * hs, 470 * hs);
          // 拳頭：搶錢版右拳橫掃、砸房版雙拳一起砸；之後捶胸
          const beat = t > 3.9 ? Math.sin(t * 20) : 0, fs = U * 0.9;
          let lx = hx - 200 * U, ly = hy + 200 * U + (beat > 0 ? beat * 20 * U : 0), rx = hx + 200 * U, ry = hy + 200 * U + (beat < 0 ? -beat * 20 * U : 0), lr = 0.2, rr = -0.2;
          if (bld && t > 2.95 && t < 3.9) { const up = ease((t - 2.95) / 0.25), dn = ein((t - 3.15) / 0.15), back = ease((t - 3.5) / 0.4); ly = ry = hy + 190 * U - up * 120 * U + dn * (gy - 200 * U - hy - 70 * U) * (1 - back); lx = cx - 70 * U; rx = cx + 70 * U; lr = 3.14; rr = 3.14; }
          if (!bld && t > 2.95 && t < 3.9) { const k = clamp((t - 2.95) / 0.45); rx = lerp(hx + 220 * U, hx - 320 * U, ein(k)); ry = lerp(hy + 150 * U, gy - 140 * U, Math.sin(k * Math.PI) * 1.2 > 1 ? 1 : Math.sin(k * Math.PI) * 1.2); rr = -1.2 + k * 0.6; }
          fist(g, lx, ly, fs, lr, false); fist(g, rx, ry, fs, rr, true);
        }
        const [tx, ty] = target(g, e, U, cx, gy, bld ? clamp((t - 3.28) / 1.2) : 0, bld ? { dir: 'out' } : { rim: MAG, t, pose: t < 1.1 ? { arms: 'cover', jerk: 0.5 } : t < 3.2 ? { arms: 'cover' } : { fall: clamp((t - 3.25) / 0.25) * 0.5, arms: 'out' } }, 'animal');
        if (!bld && t > 3.25) bills.forEach(b => { const a = t - 3.25 - b.d * 0.3; if (a < 0) return; const x = tx - a * 180 * U * (0.6 + b.s) + b.vx * a * 90 * U + Math.sin(a * 4 + b.sp) * 16 * U, y = ty + b.vy * 260 * U * a + a * a * 140 * U; bill(g, x, y, U * 1.3, b.sp + a * 6, 1, PEACH, INK); });
        if (t > 3.28 && t < 3.6) { g.strokeStyle = INK; g.lineWidth = 6 * U; const k = (t - 3.28) / 0.32; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; g.beginPath(); g.moveTo(tx + Math.cos(a) * (40 + k * 140) * U, ty + Math.sin(a) * (40 + k * 140) * U); g.lineTo(tx + Math.cos(a) * (70 + k * 200) * U, ty + Math.sin(a) * (70 + k * 200) * U); g.stroke(); } }
      }
      g.restore();
      if ((t > 1.05 && t < 1.2) || (t > 2.72 && t < 2.82)) { g.fillStyle = PEACH; g.globalAlpha = 0.85; g.fillRect(0, 0, W, Hh); g.globalAlpha = 1; }
      H.grain(g, W, Hh, 0.12);
    }, snd);
  };

  // ======================= 夜城：乞丐幫圍剿（霓虹雨夜巷弄）=======================
  // 乞丐（原創）：破斗篷兜帽、單顆紅色義眼、一隻機械手臂拿破碗
  function beggar(g, x, y, s, t, o) {
    o = o || {}; g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s); const bob = Math.sin(t * 8 + (o.ph || 0)) * 3 * (o.walk || 0);
    g.fillStyle = '#07060c'; g.beginPath(); g.moveTo(-34, 0); for (let k = 0; k <= 8; k++) g.lineTo(-34 + k * 8.5, -(k % 2 ? 8 : 0) - Math.sin(t * 6 + k) * 2); g.lineTo(26, -110 + bob); g.quadraticCurveTo(30, -150 + bob, 4, -164 + bob); g.quadraticCurveTo(-28, -160 + bob, -30, -118 + bob); g.closePath(); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(6, -140 + bob, 13, 15, 0, 0, 7); g.fill(); // 兜帽裡的黑
    // 機械手臂＋碗
    const ax = 16, ay = -100 + bob, rch = o.reach || 0, hx = ax + 16 + rch * 18, hy = ay + 30 - rch * 18;
    g.strokeStyle = '#3a3e52'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + 10, ay + 18); g.lineTo(hx, hy); g.stroke(); g.strokeStyle = '#8ab8d0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ax + 1, ay - 2); g.lineTo(ax + 10, ay + 15); g.lineTo(hx, hy - 3); g.stroke();
    g.fillStyle = '#5a6078'; g.beginPath(); g.arc(ax + 10, ay + 18, 4, 0, 7); g.fill(); g.fillStyle = '#2a2a34'; g.beginPath(); g.ellipse(hx + 6, hy + 2, 13, 6, 0, 0, Math.PI); g.fill();
    // 紅色義眼
    const ey = o.eye == null ? 1 : o.eye; if (ey > 0) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,30,40,${ey * 0.25})`; g.beginPath(); g.arc(10, -142 + bob, 12, 0, 7); g.fill(); g.fillStyle = `rgba(255,40,50,${ey})`; g.beginPath(); g.arc(10, -142 + bob, 3.5, 0, 7); g.fill(); g.fillStyle = `rgba(255,220,220,${ey})`; g.beginPath(); g.arc(10, -142 + bob, 1.3, 0, 7); g.fill(); }
    g.restore();
  }
  function alley(g, W, Hh, t, U, dark) {
    const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#0a0614'); bg.addColorStop(0.6, '#1a0e2e'); bg.addColorStop(1, '#05040a'); g.fillStyle = bg; g.fillRect(-40, -40, W + 80, Hh + 80);
    // 兩側高牆＋看不出字的霓虹招牌（只是色塊和線條）
    [[0, 1], [W, -1]].forEach(([x0, d], i) => { g.fillStyle = '#0c0a16'; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + d * W * 0.3, Hh * 0.12); g.lineTo(x0 + d * W * 0.3, Hh * 0.8); g.lineTo(x0, Hh); g.fill();
      [[0.2, '#ff2a9a'], [0.38, '#2af0ff'], [0.55, '#ffd23a']].forEach(([yy, c], k) => { const on = (Math.sin(t * (7 + k * 3) + i * 2) > -0.85 ? 1 : 0.15) * (1 - dark), x = x0 + d * W * 0.08, w = d * W * 0.16, y = Hh * yy;
        g.save(); g.strokeStyle = c; g.globalAlpha = 0.18 * on; g.lineWidth = 12 * U; g.strokeRect(Math.min(x, x + w), y, Math.abs(w), Hh * 0.07); g.globalAlpha = 0.25 + on * 0.75; g.lineWidth = 3 * U; g.strokeRect(Math.min(x, x + w), y, Math.abs(w), Hh * 0.07); g.beginPath(); g.moveTo(Math.min(x, x + w) + 8 * U, y + Hh * 0.035); g.lineTo(Math.max(x, x + w) - 8 * U, y + Hh * 0.035); g.stroke(); g.restore(); }); });
    // 遠方的光＋地面積水倒影
    const gy = Hh * 0.8; g.fillStyle = '#100c1c'; g.fillRect(-20, gy, W + 40, Hh); g.save(); g.globalCompositeOperation = 'lighter'; const rg = g.createLinearGradient(0, gy, 0, Hh); rg.addColorStop(0, `rgba(255,42,154,${0.18 * (1 - dark)})`); rg.addColorStop(1, 'rgba(42,240,255,0)'); g.fillStyle = rg; g.fillRect(0, gy, W, Hh - gy); g.restore();
  }
  function rain(g, W, Hh, t, U, n) { g.save(); g.strokeStyle = 'rgba(160,200,255,.35)'; g.lineWidth = 1.2 * U; g.beginPath(); for (let i = 0; i < n; i++) { const x = ((i * 97.13 + t * 60) % W), y = ((i * 53.7 + t * 1400 * (0.8 + (i % 5) * 0.08)) % (Hh + 60)) - 30; g.moveTo(x, y); g.lineTo(x - 4 * U, y + 26 * U); } g.stroke(); g.restore(); }
  RD.cyber = function (ui, SFX, e) {
    const bld = e.mode === 'bld', gang = Array.from({ length: 11 }, (_, i) => ({ a: i / 11 * 6.283 + 0.3, r: 0.55 + (i % 3) * 0.12, ph: i * 1.7, on: 1.05 + i * 0.09, s: 0.85 + (i % 4) * 0.1 })), coins = spray(7, 9, { sx: 1, up: 0.3 }), sparks = spray(40, 4, { sx: 1.4, up: 1.4 });
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.hiss(0, 6.4, 0.05); K.wind(0, 6.4, 0.04); K.drone(0, 6.4, [41.2, 61.7], { lp: 260, vol: 0.08 }); K.buzz(0, 2.4, 0.03);
      for (let i = 0; i < 11; i++) { K.synth(1.05 + i * 0.09, [880 + i * 40], 0.05, 0.02, 'square', 3000); }
      for (let i = 0; i < 14; i++) K.drum(2.3 + i * 0.13, 180 + (i % 3) * 30, 0.12, 0.05); K.whisper(2.2, 2.6, 0.12, 5);
      K.riser(2.6, 0.8, 100, 600, 0.06); K.stinger(3.3, 0.2); for (let i = 0; i < 16; i++) K.synth(3.3 + i * 0.05, [rnd(100, 2000)], 0.04, 0.03, 'sawtooth', 4000); K.tear(3.4, 0.6, 0.25);
      if (bld) { K.crack(3.9, 0.5, 0.35); K.boom(4.2, 80, 30, 1.0, 0.5); K.buzz(3.9, 0.9, 0.06); for (let i = 0; i < 8; i++) K.chime(4.2 + i * 0.05, 2600 + i * 200, 0.04); } else { for (let i = 0; i < 6; i++) K.chime(4.4 + i * 0.18, 1800 - i * 120, 0.05); }
      for (let i = 0; i < 10; i++) K.drum(4.2 + i * 0.07, 220, 0.1, 0.04); };
    return ui.overlay(T, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, cx = W / 2, gy = Hh * 0.8, dark = bld ? clamp((t - 4.1) / 0.3) * 0.7 : 0; g.save();
      const swarm = clamp((t - 3.2) / 0.25) * (1 - clamp((t - 4.15) / 0.35));
      shake(g, swarm > 0.5 ? 5 * U : 0); alley(g, W, Hh, t, U, dark);
      // 目標：人站在巷子中央；砸房版是一棟掛霓虹招牌的樓
      const tgtK = bld ? clamp((t - 3.95) / 1.0) : 0;
      const [tx, ty] = target(g, e, U, cx, gy, tgtK, bld ? { dir: 'down' } : { rim: 'rgba(42,240,255,.8)', t, pose: t < 2.3 ? {} : t < 3.2 ? { arms: 'cover' } : t < 4.2 ? { arms: 'up', jerk: 1 } : { arms: 'out', kneel: clamp((t - 4.2) / 0.3) } }, 'cyber');
      // 乞丐：陰影裡一顆顆紅眼亮起 → 從四周圍過來 → 一擁而上 → 散開
      gang.forEach((b, i) => { const eye = clamp((t - b.on) / 0.08) * (Math.sin(t * 30 + i) > -0.9 ? 1 : 0.2); if (eye <= 0) return;
        const appear = ease((t - 2.2) / 0.9), close = ease((t - 3.0) / 0.3), scat = ein((t - 4.15) / 0.6);
        const R0 = W * 0.5 / Math.max(0.3, Math.abs(Math.cos(b.a))) , rr = lerp(R0, W * b.r * 0.45, appear) * (1 - close * 0.85) + scat * R0 * 1.2;
        const bx = cx + Math.cos(b.a) * rr * 0.9 + (close > 0 && scat < 1 ? Math.sin(t * 40 + i) * 12 * U * swarm : 0), by = (bld ? ty + 60 * U : gy) + Math.sin(b.a) * rr * 0.18 + (bld ? 0 : 0);
        const climb = bld ? close * (1 - scat) * (i % 3) * 40 * U : 0;
        beggar(g, bx, by - climb, U * b.s * (0.9 + close * 0.15), t, { flip: Math.cos(b.a) > 0, walk: appear < 1 || scat > 0 ? 1 : 0.3, ph: b.ph, eye, reach: close });
      });
      // 圍剿：故障抖動＋RGB 錯位＋火花
      if (swarm > 0) { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 7; k++) { const y = (Math.sin(t * 50 + k * 9) * 0.5 + 0.5) * Hh, hh = rnd(4, 30) * U; g.fillStyle = k % 2 ? 'rgba(255,40,120,.18)' : 'rgba(40,240,255,.18)'; g.fillRect(rnd(-40, 40) * U, y, W, hh); } g.restore();
        sparks.forEach(p => { const a = ((t - 3.2) * 2 + p.d * 3) % 0.5; g.fillStyle = `rgba(255,${200 + p.s * 50},120,${1 - a * 2})`; g.fillRect(tx + p.vx * a * 300 * U, ty + 40 * U + p.vy * a * 200 * U + a * a * 300 * U, 3 * U, 3 * U); }); }
      // 散開後：錢包被掏空，幾枚硬幣在積水上滾
      if (!bld && t > 4.3) coins.forEach((c, i) => { const a = t - 4.3 - c.d; if (a < 0) return; const x = tx + (i - 3) * 22 * U + c.vx * Math.min(a, 1.2) * 70 * U, y = gy - 6 * U + Math.abs(Math.sin(a * 6 + i)) * 12 * U * Math.max(0, 1 - a); coin(g, x, y, 7 * U, a * 8 + c.sp, 1); });
      // 招牌掉下來（砸房版）
      if (bld && t > 3.95) { const k = ein((t - 3.95) / 0.35), sy = lerp(ty - 10 * U, gy - 20 * U, k); g.save(); g.translate(tx + 30 * U * k, sy); g.rotate(k * 0.5); g.strokeStyle = k < 1 ? '#ff3ab0' : '#5a2a4a'; g.lineWidth = 4 * U; g.strokeRect(-50 * U, -14 * U, 100 * U, 28 * U); g.restore();
        g.strokeStyle = '#1a1a24'; g.lineWidth = 2 * U; for (let k2 = 0; k2 < 3; k2++) { g.beginPath(); g.moveTo(tx - 40 * U + k2 * 40 * U, ty - 60 * U); g.quadraticCurveTo(tx - 30 * U + k2 * 40 * U + Math.sin(t * 5 + k2) * 10 * U, ty + 10 * U, tx - 35 * U + k2 * 40 * U, ty + 40 * U); g.stroke(); } }
      rain(g, W, Hh, t, U, 140);
      g.restore(); if (t > 1.0 && t < 2.2 && Math.sin(t * 50) > 0.8) { g.fillStyle = 'rgba(255,30,60,.07)'; g.fillRect(0, 0, W, Hh); }
      H.vignette(g, W, Hh, 0.8); H.grain(g, W, Hh, 0.08);
    }, snd);
  };

  // ======================= 深空異種：未知星球的未知生物（生物機械風，從頭到尾不露全身）=======================
  const segC = {};
  function alienSeg(U) { const k = 's' + Math.round(U * 100); if (segC[k]) return segC[k]; const w = Math.ceil(32 * U), h = Math.ceil(76 * U), [c, g] = cvs(w, h); g.translate(w / 2, h / 2); const W2 = 34 * U;
    const bg2 = g.createLinearGradient(0, -W2, 0, W2); bg2.addColorStop(0, '#0c0e0c'); bg2.addColorStop(0.45, '#7a7866'); bg2.addColorStop(0.55, '#4a4a3e'); bg2.addColorStop(1, '#060706'); g.fillStyle = bg2; g.beginPath(); g.ellipse(0, 0, 12 * U, W2, 0, 0, 7); g.fill();
    g.strokeStyle = '#141612'; g.lineWidth = 2 * U; g.beginPath(); g.moveTo(-6 * U, -W2 * 0.9); g.lineTo(-6 * U, W2 * 0.9); g.stroke(); g.fillStyle = '#1a1c18'; g.fillRect(-14 * U, -W2 * 1.08, 4 * U, W2 * 2.16); return (segC[k] = c); }
  function alienPod(U) { const k = 'p' + Math.round(U * 100); if (segC[k]) return segC[k]; const w = Math.ceil(60 * U), h = Math.ceil(70 * U), [c, g] = cvs(w, h); g.translate(w / 2, h / 2); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 30 * U); gr.addColorStop(0, 'rgba(160,255,230,.9)'); gr.addColorStop(0.35, 'rgba(90,255,210,.55)'); gr.addColorStop(1, 'rgba(90,255,210,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 26 * U, 32 * U, 0, 0, 7); g.fill(); return (segC[k] = c); }
  RD.alien = function (ui, SFX, e) {
    const bld = e.mode === 'bld', spores = spray(34, 21, { sx: 1, up: 1 }), drips = spray(14, 8, { sx: 1, up: 0.2 }), stars = spray(120, 2, { sx: 1, up: 1 });
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.drone(0, 6.4, [27.5, 41.2, 55], { lp: 200, vol: 0.14, sweep: 300 }); K.heart(0.2, 6, 48, 0.25, 1.4);
      K.creak(0.6, 1.2, 0.14); K.tear(0.8, 0.9, 0.2); K.howl(1.2, 2.2, 160, 0.09); K.howl(1.9, 1.8, 120, 0.07); K.hiss(1.1, 2.5, 0.06);
      K.riser(2.0, 1.0, 50, 260, 0.08); K.tear(2.8, 0.6, 0.3); K.growl(2.9, 0.8, 45, 0.35);
      if (bld) { K.creak(3.2, 1.2, 0.25); K.crack(3.9, 0.7, 0.3); K.whoosh(4.2, 0.5, true, 0.3); } else { K.shimmer(3.3, 1.4, 900, 0.05); K.sweep(3.3, 1.4, 300, 1800, { vol: 0.08 }); }
      K.tear(4.6, 0.6, 0.18); for (let i = 0; i < 6; i++) K.chime(5.0 + i * 0.12, 500 - i * 30, 0.03); K.howl(4.8, 1.4, 90, 0.08); };
    return ui.overlay(T, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, cx = W / 2, gy = Hh * 0.82; g.save(); shake(g, (t > 2.8 && t < 3.1) ? 5 * U : t > 0.6 && t < 1.4 ? 1.5 * U : 0);
      g.fillStyle = '#020306'; g.fillRect(-30, -30, W + 60, Hh + 60); stars.forEach((s2, i) => { g.fillStyle = `rgba(200,230,220,${0.3 + (i % 5) * 0.12})`; g.fillRect((s2.sp / 10) * W, (s2.s - 0.6) / 0.7 * Hh * 0.7, 1.5 * U, 1.5 * U); });
      H.cloudLayer(g, H.smoke('alienNeb', [30, 90, 80], 0.45, 61), W, Hh, 2.6 * U, t * 8 * U, 0, 0.35, 'lighter');
      // 地面：肋骨狀的黑色平台
      g.fillStyle = '#0a0c0c'; g.fillRect(-20, gy, W + 40, Hh); g.strokeStyle = '#2a2e2a'; g.lineWidth = 3 * U; for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(cx, gy + 10 * U + k * 18 * U, W * 0.3 + k * 40 * U, 8 * U, 0, 0, Math.PI); g.stroke(); }
      // 肉質裂縫：張開 → 伸出觸肢 → 闔上
      const rx = cx + 40 * U, ry = Hh * 0.18, op = ease((t - 0.5) / 0.9) * (1 - ease((t - 4.9) / 0.6)), rh = 230 * U * op, rw = 46 * U * op;
      if (op > 0) { g.save(); const lips = g.createRadialGradient(rx, ry, 0, rx, ry, rh); lips.addColorStop(0, '#000'); lips.addColorStop(0.55, '#040806'); lips.addColorStop(0.8, '#3a3a2e'); lips.addColorStop(1, 'rgba(30,40,34,0)');
        const lipO = new Path2D(), lipI = new Path2D(); lipO.ellipse(rx, ry, rw * 1.7, rh * 1.06, 0.08, 0, 7); lipI.ellipse(rx, ry, rw * 0.9 * (1 + Math.sin(t * 3) * 0.05), rh * 0.92, 0.08, 0, 7);
        const fl = g.createLinearGradient(rx - rw * 1.7, 0, rx + rw * 1.7, 0); fl.addColorStop(0, '#120e0a'); fl.addColorStop(0.3, '#5a4a3a'); fl.addColorStop(0.45, '#8a7a62'); fl.addColorStop(0.7, '#3a2e24'); fl.addColorStop(1, '#0a0806'); g.fillStyle = fl; g.fill(lipO);
        const ring = new Path2D(); ring.addPath(lipO); ring.addPath(lipI); g.save(); g.clip(ring, 'evenodd'); g.strokeStyle = 'rgba(10,8,6,.85)'; g.lineWidth = 3 * U;
        for (let k = -9; k <= 9; k++) { const yy = ry + k * rh * 0.11; g.beginPath(); g.moveTo(rx - rw * 1.8, yy - 6 * U); g.quadraticCurveTo(rx, yy + 14 * U, rx + rw * 1.8, yy - 6 * U); g.stroke(); }
        g.strokeStyle = 'rgba(150,40,40,.35)'; g.lineWidth = 1.5 * U; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(rx - rw * (1.5 - k * 0.1), ry - rh * 0.8 + k * 30 * U); g.bezierCurveTo(rx - rw * 1.2, ry, rx - rw * 1.4, ry + rh * 0.3, rx - rw * 1.1, ry + rh * 0.8 - k * 20 * U); g.stroke(); } g.restore();
        g.fillStyle = '#000'; g.fill(lipI); const inner = g.createRadialGradient(rx, ry, 0, rx, ry, rh * 0.9); inner.addColorStop(0, 'rgba(40,120,100,.35)'); inner.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = inner; g.fill(lipI);
        g.fillStyle = 'rgba(160,150,120,.6)'; for (let k = 0; k < 5; k++) { const yy = ry + rh * (0.95 - k * 0.02), xx = rx + (k - 2) * rw * 0.5; g.beginPath(); g.ellipse(xx, yy + Math.sin(t * 2 + k) * 4 * U, 2.5 * U, 6 * U, 0, 0, 7); g.fill(); }
        g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(90,255,210,${0.12 * op})`; g.lineWidth = 14 * U; g.stroke(lipI); g.strokeStyle = `rgba(90,255,210,${0.3 * op})`; g.lineWidth = 2 * U; g.stroke(lipI); g.restore(); }
      // 觸肢：沿著曲線一節一節伸出（脊椎骨＋管線＋發光的半透明腔室），末端張開成五瓣口器
      const ext = ease((t - 1.3) / 1.4) * (1 - ein((t - 4.4) / 0.7)), [tx0, ty0] = bld ? [cx, gy - 260 * U] : [cx, gy - 150 * U];
      const pull = bld ? ein((t - 4.0) / 0.6) : 0;
      const P = (u) => { const x = lerp(rx, tx0, u) + Math.sin(u * 5 + t * 1.3) * 50 * U * (1 - u) + Math.sin(u * 3.1) * 70 * U, y = lerp(ry, ty0 - pull * 300 * U, u) - Math.sin(u * Math.PI) * 40 * U; return [x, y]; };
      if (ext > 0) { const n = 34;
        const seg = alienSeg(U), pod = alienPod(U);
        for (let k = 0; k < n * ext; k++) { const u = k / n, [x, y] = P(u), [x2, y2] = P(u + 0.03), a = Math.atan2(y2 - y, x2 - x), w = (34 - u * 18) / 34;
          g.save(); g.translate(x, y); g.rotate(a); g.scale(1, w); g.drawImage(seg, -seg.width / 2, -seg.height / 2);
          if (k % 6 === 3) { const pul = 0.5 + Math.sin(t * 6 - k) * 0.5; g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45 + pul * 0.55; g.drawImage(pod, -pod.width / 2, -pod.height / 2); }
          g.restore(); }
        // 末端：口器
        const [ex, ey] = P(Math.min(1, ext)), mo = clamp((t - 2.7) / 0.3) * (1 - clamp((t - (bld ? 3.4 : 4.6)) / 0.3)), bite = bld ? clamp((t - 3.2) / 0.3) : 0;
        g.save(); g.translate(ex, ey); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283 + 1.57, op2 = mo * 0.9 + 0.12 - bite * 0.5; g.save(); g.rotate(a + op2 * 0.6 * (k % 2 ? 1 : -1) * 0.2); g.fillStyle = '#3a382e'; g.beginPath(); g.moveTo(-14 * U, 0); g.quadraticCurveTo(-10 * U, 60 * U * (0.4 + op2), 0, 80 * U * (0.4 + op2)); g.quadraticCurveTo(10 * U, 60 * U * (0.4 + op2), 14 * U, 0); g.fill(); g.strokeStyle = '#0c0d0a'; g.lineWidth = 2 * U; g.stroke(); g.restore(); }
        if (mo > 0) { g.globalCompositeOperation = 'lighter'; const ig = g.createRadialGradient(0, 0, 0, 0, 0, 50 * U * mo); ig.addColorStop(0, 'rgba(200,255,230,.9)'); ig.addColorStop(0.4, 'rgba(90,255,210,.5)'); ig.addColorStop(1, 'rgba(90,255,210,0)'); g.fillStyle = ig; g.beginPath(); g.arc(0, 0, 50 * U * mo, 0, 7); g.fill(); }
        g.restore();
        // 搶錢版：金幣從人身上浮起，變成發光孢子，螺旋被吸進口器
        if (!bld && t > 3.1) spores.forEach(sp => { const a = clamp((t - 3.1 - sp.d * 1.2) / 1.1); if (a <= 0 || a >= 1) return; const sx = cx + sp.vx * 70 * U, sy = gy - 120 * U + sp.vy * 50 * U, ang = a * 8 + sp.sp, rr = (1 - a) * 40 * U, x = lerp(sx, ex, ein(a)) + Math.cos(ang) * rr, y = lerp(sy, ey, ein(a)) + Math.sin(ang) * rr;
          if (a < 0.3) coin(g, x, y, 7 * U * sp.s, t * 9 + sp.sp, 1 - a / 0.3); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(90,255,210,${clamp(a / 0.3) * 0.3})`; g.beginPath(); g.arc(x, y, 10 * U * sp.s, 0, 7); g.fill(); g.fillStyle = `rgba(190,255,235,${clamp(a / 0.3)})`; g.beginPath(); g.arc(x, y, 4 * U * sp.s, 0, 7); g.fill(); g.restore(); });
      }
      // 目標（砸房版：頂層先被「同化」成生物組織，再被扯進裂縫）
      const as = bld ? clamp((t - 3.2) / 0.8) : 0;
      target(g, e, U, cx, gy, bld ? clamp((t - 4.0) / 0.9) : 0, bld ? { dir: 'up', overlay: (q, bx, by, bw, bh) => { if (as <= 0 || t > 4.0) return; q.save(); q.globalAlpha = as * 0.85; q.fillStyle = '#4a4636'; q.beginPath(); q.ellipse(bx + bw / 2, by + bh * 0.55, bw * 0.48, bh * 0.55, 0, 0, 7); q.fill(); q.strokeStyle = '#141410'; q.lineWidth = 3 * U; for (let k = 0; k < 6; k++) { q.beginPath(); q.ellipse(bx + bw / 2, by + bh * (0.2 + k * 0.13), bw * (0.2 + k * 0.05), 5 * U, 0, 0, Math.PI); q.stroke(); } q.restore(); } } : { rim: 'rgba(90,255,210,.7)', t, pose: t < 2.7 ? {} : t < 3.1 ? { arms: 'cover' } : { lift: Math.sin(clamp((t - 3.1) / 1.6) * Math.PI) * 40 * U, arms: 'out', jerk: 0.6 } }, 'alien');
      // 黏液從裂縫滴下來
      if (t > 4.6) drips.forEach(d => { const a = t - 4.6 - d.d; if (a < 0) return; const x = rx + d.vx * 40 * U, y = ry + 200 * U * (0.5 + d.s * 0.4) + a * a * 300 * U; g.fillStyle = 'rgba(110,130,100,.75)'; g.beginPath(); g.ellipse(x, y, 3 * U, 7 * U, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(80,100,70,.35)'; g.lineWidth = 1 * U; g.beginPath(); g.moveTo(x, Math.max(ry + 150 * U, y - 60 * U)); g.lineTo(x, y); g.stroke(); });
      g.restore(); H.vignette(g, W, Hh, 0.9); H.grain(g, W, Hh, 0.1);
    }, snd);
  };

  // ======================= 神佛之境：扎小人（民俗恐怖）=======================
  // 昏暗神桌、兩根白蠟燭、香爐；稻草人偶貼著黃符（只有看不出字的紅色符紋）；一隻蒼白的手一針一針扎下去
  function strawDoll(g, x, y, s, t, o) {
    o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.jolt ? Math.sin(t * 50) * 0.05 * o.jolt : 0); const r = seeded(41);
    const straw = (x0, y0, x1, y1, w, n) => { g.fillStyle = '#8a6c3c'; g.beginPath(); const a = Math.atan2(y1 - y0, x1 - x0) + 1.57; g.moveTo(x0 + Math.cos(a) * w, y0 + Math.sin(a) * w); g.lineTo(x1 + Math.cos(a) * w * 0.8, y1 + Math.sin(a) * w * 0.8); g.lineTo(x1 - Math.cos(a) * w * 0.8, y1 - Math.sin(a) * w * 0.8); g.lineTo(x0 - Math.cos(a) * w, y0 - Math.sin(a) * w); g.fill();
      g.strokeStyle = '#6a4a22'; g.lineWidth = 1.3; for (let k = 0; k < n; k++) { const u = r() * 2 - 1; g.beginPath(); g.moveTo(x0 + Math.cos(a) * w * u, y0 + Math.sin(a) * w * u); g.lineTo(x1 + Math.cos(a) * w * 0.8 * u + (r() - 0.5) * 6, y1 + Math.sin(a) * w * 0.8 * u + (r() - 0.5) * 6); g.stroke(); }
      g.strokeStyle = '#c8a870'; g.lineWidth = 1; for (let k = 0; k < n / 2; k++) { const u = r() * 2 - 1; g.beginPath(); g.moveTo(x0 + Math.cos(a) * w * u, y0 + Math.sin(a) * w * u); g.lineTo(x1 + Math.cos(a) * w * 0.8 * u, y1 + Math.sin(a) * w * 0.8 * u); g.stroke(); } };
    const split = o.split || 0;
    straw(-20, -10, -30, 90, 14, 14); straw(20, -10, 30, 90, 14, 14); // 腿
    straw(0, -120, 0 - 2, 0, 40, 30);
    straw(-90, -95, 90, -95, 14, 22); // 手臂
    g.fillStyle = '#94763e'; g.beginPath(); g.ellipse(0, -150, 34, 38, 0, 0, 7); g.fill(); g.strokeStyle = '#a88a52'; g.lineWidth = 1.4; for (let k = 0; k < 26; k++) { const a = r() * 6.28, l = 6 + r() * 20, ex = [[-90, -95], [90, -95], [-30, 90], [30, 90], [0, -188]][k % 5]; g.beginPath(); g.moveTo(ex[0], ex[1]); g.lineTo(ex[0] + Math.cos(a) * l, ex[1] + Math.sin(a) * l); g.stroke(); } // 戳出來的亂草 g.strokeStyle = '#6a4a22'; g.lineWidth = 1.3; for (let k = 0; k < 22; k++) { const a = r() * 6.28; g.beginPath(); g.moveTo(Math.cos(a) * 8, -150 + Math.sin(a) * 8); g.lineTo(Math.cos(a) * 34, -150 + Math.sin(a) * 38); g.stroke(); }
    g.strokeStyle = '#a8141a'; g.lineWidth = 5; [[-118, 40], [-40, 46], [-10, 38]].forEach(([yy, w]) => { g.beginPath(); g.moveTo(-w * 0.9, yy); g.lineTo(w * 0.9, yy + 3); g.stroke(); }); [-80, 80].forEach(xx => { g.beginPath(); g.moveTo(xx, -108); g.lineTo(xx + 4, -82); g.stroke(); });
    // 肚子裂開：中間一道黑色裂口，兩側亂草翹出來（軀幹本身不動）
    if (split > 0) { const w = split * 16; g.fillStyle = '#120804'; g.beginPath(); g.moveTo(0, -96); for (let k = 0; k <= 6; k++) g.lineTo(-w * Math.sin(k / 6 * Math.PI) - (k % 2) * 3, -96 + k * 14); for (let k = 6; k >= 0; k--) g.lineTo(w * Math.sin(k / 6 * Math.PI) + (k % 2) * 3, -96 + k * 14); g.fill();
      g.strokeStyle = '#a88a52'; g.lineWidth = 1.4; for (let k = 0; k < 12; k++) { const y = -90 + k * 7, sd = k % 2 ? 1 : -1, x = sd * w * Math.sin((y + 96) / 84 * Math.PI); g.beginPath(); g.moveTo(x, y); g.lineTo(x + sd * (6 + split * 8), y - 4); g.stroke(); } }
    // 黃符：紅色符紋（不是字）
    g.save(); g.translate(-split * 26, -64 + split * 8); g.rotate(-0.05 - split * 0.5); g.fillStyle = '#e8c84a'; g.fillRect(-20, -34, 40, 70); g.strokeStyle = '#b8141a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-10, -26); g.bezierCurveTo(10, -22, -12, -10, 8, -4); g.bezierCurveTo(-12, 4, 12, 10, -6, 18); g.moveTo(-12, 26); g.quadraticCurveTo(0, 20, 12, 28); g.moveTo(10, -28); g.lineTo(12, -14); g.stroke(); g.beginPath(); g.arc(0, -12, 4, 0, 7); g.stroke(); g.restore();
    // 已經扎進去的針
    (o.needles || []).forEach(([nx, ny, na]) => { g.strokeStyle = '#d8dce4'; g.lineWidth = 2; g.beginPath(); g.moveTo(nx, ny); g.lineTo(nx + Math.cos(na) * 70, ny + Math.sin(na) * 70); g.stroke(); g.fillStyle = '#c81a1a'; g.beginPath(); g.arc(nx + Math.cos(na) * 70, ny + Math.sin(na) * 70, 4, 0, 7); g.fill(); });
    g.restore();
  }
  function paleHand(g, x, y, s, a) { // 從右邊伸進來、捏著長針的手：前臂、手掌、食指和拇指捏針、其他手指彎起來、長長的灰指甲
    g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
    const sk = g.createLinearGradient(0, -40, 0, 40); sk.addColorStop(0, '#ece8e0'); sk.addColorStop(0.6, '#b8b2a6'); sk.addColorStop(1, '#7a746a');
    g.fillStyle = sk; g.beginPath(); g.moveTo(420, -30); g.lineTo(90, -26); g.quadraticCurveTo(40, -34, 20, -14); g.quadraticCurveTo(14, 10, 30, 26); g.quadraticCurveTo(70, 34, 100, 26); g.lineTo(420, 34); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(90,110,130,.45)'; g.lineWidth = 1.6; [[300, -10, 160, -6], [260, 8, 120, 4]].forEach(([x0, y0, x1, y1]) => { g.beginPath(); g.moveTo(x0, y0); g.bezierCurveTo(x0 - 50, y0 + 8, x1 + 50, y1 - 8, x1, y1); g.stroke(); }); // 青筋
    const finger = (pts, w) => { g.strokeStyle = sk; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w; g.beginPath(); pts.forEach(([px, py], i) => g[i ? 'lineTo' : 'moveTo'](px, py)); g.stroke(); g.strokeStyle = 'rgba(80,70,60,.5)'; g.lineWidth = 1.2; g.stroke(); const [lx, ly] = pts[pts.length - 1], [px, py] = pts[pts.length - 2], an = Math.atan2(ly - py, lx - px); g.fillStyle = '#5a5248'; g.beginPath(); g.ellipse(lx + Math.cos(an) * 6, ly + Math.sin(an) * 6, 9, 3.4, an, 0, 7); g.fill(); };
    finger([[34, 22], [16, 34], [12, 46], [22, 50]], 12); finger([[44, 26], [30, 40], [30, 52], [40, 54]], 11); finger([[60, 26], [50, 38], [52, 48]], 10); // 彎起來的三根
    finger([[30, -14], [0, -18], [-28, -10], [-46, -2]], 12); // 食指
    finger([[50, 10], [20, 6], [-8, 4], [-36, 4]], 13); // 拇指
    g.strokeStyle = '#e8ecf4'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-38, 0); g.lineTo(-150, 2); g.stroke(); g.fillStyle = '#c81a1a'; g.beginPath(); g.arc(-34, 0, 4.5, 0, 7); g.fill();
    g.restore();
  }
  RD.buddha = function (ui, SFX, e) {
    const bld = e.mode === 'bld', stabs = [1.8, 2.35, 2.85, 3.25], ash = spray(40, 31, { sx: 0.6, up: 1 }), paper = spray(18, 13, { sx: 1, up: 1 });
    const NP = [[-6, -150, -0.6], [16, -80, -0.35], [-14, -40, -0.8], [6, -120, -0.15]];
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.drone(0, 6.4, [55, 58.3, 82.4], { lp: 300, vol: 0.08 }); K.wind(0, 6.4, 0.04); K.bell(0.2, 1320, 2.2, 0.06, true); K.bell(0.9, 1100, 2, 0.05, true);
      for (let i = 0; i < 6; i++) K.drum(0.3 + i * 0.32, 420 + (i % 2) * 60, 0.05, 0.03); // 倒放般的木魚（很輕、很空）
      K.choir(0.5, 5.4, [220, 233, 330], { v: 'oo', vol: 0.045, bend: 0.98 }); K.whisper(1.0, 4.0, 0.08, 3); K.heart(1.5, 3, 62, 0.25, 1.3);
      stabs.forEach((d, i) => { K.stinger(d, 0.12 + i * 0.03); K.tear(d, 0.15, 0.2); K.creak(d + 0.02, 0.2, 0.12); K.scream(d + 0.03, 0.35, 700 + i * 60, 0.03); });
      if (bld) { K.fire(3.7, 2.4, 0.35); K.crack(4.0, 0.6, 0.18); } else { K.tear(3.75, 0.7, 0.35); K.fire(4.0, 1.8, 0.25); K.bell(3.8, 880, 2.4, 0.05, true); } K.howl(4.4, 1.6, 300, 0.04); };
    return ui.overlay(T, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, cx = W / 2, ty = Hh * 0.66; let hit = 0; stabs.forEach(d => { if (t > d && t < d + 0.18) hit = 1 - (t - d) / 0.18; });
      g.save(); shake(g, hit * 5 * U);
      g.fillStyle = '#080404'; g.fillRect(-30, -30, W + 60, Hh + 60);
      // 背景：受害者的剪影浮在煙裡，每扎一針就抽一下
      const ghostA = 0.35 + hit * 0.35; g.save(); g.globalAlpha = ghostA * clamp((t - 0.6) / 0.8) * (1 - clamp((t - 4.6) / 0.8)); rim(g, W, Hh, 'rgba(200,40,40,.8)', 30 * U, (q) => person(q, cx, Hh * 0.44, U * 1.2, { arms: hit > 0 ? 'cover' : 'down', jerk: hit * 3, fall: hit * 0.08 }, t), '#160808'); g.restore();
      H.cloudLayer(g, H.smoke('incense', [120, 100, 90], 0.5, 77), W, Hh, 1.8 * U, Math.sin(t * 0.3) * 40 * U, -t * 30 * U, 0.35, 'lighter');
      // 神桌
      const tg = g.createLinearGradient(0, ty, 0, Hh); tg.addColorStop(0, '#3a1a0e'); tg.addColorStop(0.1, '#1e0c06'); tg.addColorStop(1, '#0a0402'); g.fillStyle = tg; g.fillRect(-20, ty, W + 40, Hh); g.fillStyle = '#5a2a14'; g.fillRect(-20, ty, W + 40, 4 * U);
      // 蠟燭（燭火每扎一針就猛跳一下）
      [cx - W * 0.36, cx + W * 0.36].forEach((x, i) => { g.fillStyle = '#e8e0d0'; g.fillRect(x - 10 * U, ty - 120 * U, 20 * U, 120 * U); g.fillStyle = '#c8bca8'; g.fillRect(x + 4 * U, ty - 120 * U, 6 * U, 120 * U);
        const fh = (26 + hit * 30 + Math.sin(t * 17 + i) * 4) * U, fx = x + Math.sin(t * 7 + i) * 3 * U; g.save(); g.globalCompositeOperation = 'lighter'; const fg = g.createRadialGradient(fx, ty - 130 * U, 0, fx, ty - 130 * U, 120 * U); fg.addColorStop(0, `rgba(255,190,90,${0.35 + hit * 0.3})`); fg.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = fg; g.fillRect(fx - 120 * U, ty - 250 * U, 240 * U, 240 * U);
        g.fillStyle = hit > 0.3 ? '#ff4a3a' : '#ffd890'; g.beginPath(); g.moveTo(fx - 6 * U, ty - 122 * U); g.quadraticCurveTo(fx - 7 * U, ty - 122 * U - fh * 0.5, fx, ty - 122 * U - fh); g.quadraticCurveTo(fx + 7 * U, ty - 122 * U - fh * 0.5, fx + 6 * U, ty - 122 * U); g.fill(); g.restore(); });
      // 人偶／紙紮屋＋插在上面的針
      const nIn = stabs.filter(d => t > d + 0.08).length, needles = NP.slice(0, nIn), split = bld ? 0 : ease((t - 3.7) / 0.4), burn = clamp((t - 3.7) / 1.4);
      if (!bld) strawDoll(g, cx, ty - 10 * U, U * 1.05, t, { needles, jolt: hit, split });
      else { const r2 = bldDraw(g, 'buddha', U, cx, ty, burn > 0.15 ? clamp((burn - 0.15) / 0.8) : 0, { dir: 'down' }); if (burn < 0.3) { g.save(); g.translate(cx, r2.top + 60 * U); needles.forEach(([nx, , na], k) => { const ny = 10 + k * 14; g.strokeStyle = '#d8dce4'; g.lineWidth = 2 * U; g.beginPath(); g.moveTo(nx * 2 * U, ny * U); g.lineTo(nx * 2 * U + Math.cos(na) * 70 * U, ny * U + Math.sin(na) * 70 * U); g.stroke(); g.fillStyle = '#c81a1a'; g.beginPath(); g.arc(nx * 2 * U + Math.cos(na) * 70 * U, ny * U + Math.sin(na) * 70 * U, 4 * U, 0, 7); g.fill(); }); g.restore(); }
        if (burn > 0) { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 14; k++) { const fx = cx + (k - 7) * 11 * U, fh = (60 + Math.sin(t * 13 + k * 2) * 20) * U * Math.sin(burn * Math.PI) * 1.4, fy = r2.top + 90 * U; const fg = g.createLinearGradient(0, fy, 0, fy - fh); fg.addColorStop(0, 'rgba(255,120,30,.8)'); fg.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = fg; g.beginPath(); g.moveTo(fx - 9 * U, fy); g.quadraticCurveTo(fx, fy - fh * 1.2, fx + 9 * U, fy); g.fill(); } g.restore(); } }
      // 手：伸進來 → 扎四下 → 縮回去
      const inK = ease((t - 0.9) / 0.6) * (1 - ein((t - 3.5) / 0.5)); if (inK > 0) { let poke = 0; stabs.forEach((d, i) => { const k = (t - (d - 0.2)) / 0.32; if (k > 0 && k < 1) poke = Math.sin(k * Math.PI); }); const tgtN = NP[Math.min(3, stabs.filter(d => t > d - 0.2).length - 1)] || NP[0];
        const hx = lerp(W + 260 * U, cx + (bld ? tgtN[0] * 2 * U : tgtN[0] * U) + 190 * U, inK) - poke * 70 * U, hy = (bld ? ty - 210 * U : ty - 10 * U + tgtN[1] * U * 1.05) - 40 * U + poke * 40 * U;
        paleHand(g, hx, hy, U * 1.05, tgtN[2] * 0.5 - 0.25); }
      // 搶錢版：人偶裂開，掉出來的紙錢燒成灰飛上去
      if (!bld && t > 3.7) paper.forEach(p => { const a = t - 3.75 - p.d; if (a < 0) return; const x = cx + p.vx * 120 * U * Math.min(a, 1), y = ty - 80 * U + p.vy * 60 * U * Math.min(a, 0.6) + Math.min(a, 0.6) * 160 * U - Math.max(0, a - 0.6) * 60 * U, b = clamp((a - 0.4) / 0.8);
        g.save(); g.translate(x, y); g.rotate(p.sp + a * 3); g.globalAlpha = 1 - b; g.fillStyle = '#d8b84a'; g.fillRect(-12 * U, -8 * U, 24 * U, 16 * U); g.fillStyle = '#c8301e'; g.fillRect(-4 * U, -4 * U, 8 * U, 8 * U); if (b > 0) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,120,30,${b})`; g.fillRect(-12 * U, -8 * U, 24 * U, 16 * U * b); } g.restore(); });
      if (t > 3.9) ash.forEach(p => { const a = t - 3.9 - p.d * 1.5; if (a < 0 || a > 2.2) return; g.fillStyle = `rgba(${a < 0.6 ? 255 : 120},${a < 0.6 ? 140 : 110},${a < 0.6 ? 60 : 100},${1 - a / 2.2})`; g.fillRect(cx + p.vx * 120 * U + Math.sin(a * 3 + p.sp) * 20 * U, ty - 120 * U - a * 200 * U * p.s, 3 * U, 3 * U); });
      g.restore();
      if (hit > 0) { g.fillStyle = `rgba(160,0,0,${hit * 0.3})`; g.fillRect(0, 0, W, Hh); }
      H.vignette(g, W, Hh, 0.92); H.grain(g, W, Hh, 0.1);
    }, snd);
  };

  // ======================= 魔法學院：黑魔王（原創：黑霧長袍、骨白面具、紫黑色魔法）=======================
  function darkLord(g, x, y, s, t, o) {
    o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); const form = o.form == null ? 1 : o.form;
    const body = !o.maskOnly;
    // 長袍下襬化成一縷縷黑霧
    if (body) { g.fillStyle = '#040308'; g.beginPath(); g.moveTo(-40, -230); g.quadraticCurveTo(-70, -120, -90, 0); for (let k = 0; k <= 9; k++) g.lineTo(-90 + k * 20, (k % 2 ? -10 : 20) + Math.sin(t * 5 + k) * 10); g.quadraticCurveTo(70, -120, 40, -230); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(0, -258, 30, 38, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-34, -262); g.quadraticCurveTo(0, -330, 34, -262); g.fill(); // 兜帽
    }
    const wa = o.wand || 0; if (body) { limb(g, 34, -210, 70 - wa * 10, -150 - wa * 110, 9, 7); limb(g, -34, -210, -60, -130, 9, 7); }
    const wx = 70 - wa * 10, wy = -150 - wa * 110, tx2 = wx + 30 - wa * 22, ty2 = wy - 40 - wa * 20; if (body) { g.strokeStyle = '#1a1420'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(wx, wy); g.lineTo(tx2, ty2); g.stroke(); }
    // 骨白面具＋發紫光的眼縫
    const mg = g.createLinearGradient(-20, -280, 20, -230); mg.addColorStop(0, '#e8e2d4'); mg.addColorStop(1, '#8a8478'); g.fillStyle = mg; const a0 = g.globalAlpha; g.globalAlpha = a0 * form; g.beginPath(); g.ellipse(0, -254, 20, 27, 0, 0, 7); g.fill(); g.globalAlpha = a0;
    const ey = o.eyes || 0; if (ey > 0) { g.globalCompositeOperation = 'lighter'; g.shadowColor = '#b04aff'; g.shadowBlur = 16; g.fillStyle = `rgba(210,150,255,${ey})`; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 8, -258, 6, 2, sd * -0.25, 0, 7); g.fill(); }); }
    g.restore(); return [x + tx2 * s, y + ty2 * s];
  }
  function sigil(g, x, y, r, t, a) { g.save(); g.translate(x, y); g.rotate(t * 0.8); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.25; g.strokeStyle = '#a04aff'; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, r * 0.9, 0, 7); g.stroke(); g.globalAlpha = a; g.strokeStyle = '#c890ff'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.82, 0, 7); g.stroke(); for (let k = 0; k < 2; k++) { g.beginPath(); for (let j = 0; j < 4; j++) { const aa = j / 3 * 6.283 + k * Math.PI / 3; g[j ? 'lineTo' : 'moveTo'](Math.cos(aa) * r * 0.8, Math.sin(aa) * r * 0.8); } g.stroke(); }
    for (let k = 0; k < 12; k++) { const aa = k / 12 * 6.283; g.beginPath(); g.arc(Math.cos(aa) * r * 0.91, Math.sin(aa) * r * 0.91, r * 0.035, 0, 7); g.stroke(); } g.restore(); }
  RD.magic = function (ui, SFX, e) {
    const bld = e.mode === 'bld', coins = spray(26, 51, { sx: 1, up: 1 }), crows = spray(24, 17, { sx: 1.4, up: 1.2 }), stones = spray(1, 1, {});
    const snd = () => { const K = kit(SFX); if (!K) return;
      K.wind(0, 6.4, 0.08); K.crack(0.15, 0.9, 0.3); K.boom(0.2, 60, 25, 1.4, 0.35); for (let i = 0; i < 6; i++) K.whoosh(0.4 + i * 0.12, 0.2, false, 0.05);
      K.choir(0.8, 5.0, [98, 116.5, 146.8], { v: 'oo', vol: 0.06, bend: 0.97 }); K.whisper(0.9, 2.2, 0.12, 4); K.drone(0.8, 5.6, [36.7, 55], { lp: 240, vol: 0.12 }); K.hiss(1.0, 1.5, 0.08);
      K.shimmer(2.0, 1.0, 600, 0.05); K.riser(2.0, 0.8, 80, 500, 0.08); K.boom(2.85, 55, 22, 1.4, 0.55); K.stinger(2.85, 0.25); K.crack(2.86, 0.6, 0.35);
      if (bld) { K.crack(3.2, 1.0, 0.3); K.boom(3.5, 70, 25, 1.4, 0.5); for (let i = 0; i < 10; i++) K.drum(3.4 + i * 0.09, 90 + i * 5, 0.15, 0.08); } else { K.sweep(3.0, 1.4, 1200, 200, { vol: 0.08 }); for (let i = 0; i < 12; i++) K.chime(3.0 + i * 0.09, 1600 - i * 60, 0.04); K.scream(3.0, 0.8, 480, 0.04); }
      for (let i = 0; i < 14; i++) K.whoosh(4.4 + i * 0.07, 0.15, i % 2 === 0, 0.08); K.howl(4.5, 1.2, 420, 0.04); };
    return ui.overlay(T, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, cx = W / 2, gy = Hh * 0.82, lit = (t > 0.15 && t < 0.3) || (t > 2.85 && t < 2.95) ? 1 : 0; g.save(); shake(g, (t > 2.85 && t < 3.2) || (bld && t > 3.4 && t < 3.7) ? 6 * U : 0);
      const sky = g.createLinearGradient(0, 0, 0, Hh); sky.addColorStop(0, lit ? '#3a3060' : '#06050e'); sky.addColorStop(0.7, '#141028'); sky.addColorStop(1, '#030208'); g.fillStyle = sky; g.fillRect(-30, -30, W + 60, Hh + 60);
      H.cloudLayer(g, H.smoke('storm', [60, 50, 90], 0.35, 91), W, Hh, 2.2 * U, t * 50 * U, Hh * 0.02, 0.6);
      // 遠方的城堡剪影＋閃電
      g.fillStyle = '#05040a'; [[0.12, 0.42, 0.06], [0.24, 0.36, 0.05], [0.8, 0.38, 0.07], [0.9, 0.44, 0.05]].forEach(([x, y, w]) => { g.fillRect(W * x - W * w / 2, Hh * y, W * w, gy - Hh * y); g.beginPath(); g.moveTo(W * x - W * w * 0.7, Hh * y); g.lineTo(W * x, Hh * y - W * w * 1.6); g.lineTo(W * x + W * w * 0.7, Hh * y); g.fill(); });
      g.fillRect(-20, gy - Hh * 0.12, W + 40, Hh); g.fillStyle = '#0a0812'; g.fillRect(-20, gy, W + 40, Hh);
      if (lit) { g.strokeStyle = '#e8e0ff'; g.lineWidth = 3 * U; g.beginPath(); let x = W * (t < 1 ? 0.7 : 0.3), y = 0; g.moveTo(x, y); while (y < Hh * 0.4) { x += rnd(-30, 30) * U; y += rnd(20, 50) * U; g.lineTo(x, y); } g.stroke(); }
      // 地上的黑霧聚成一柱 → 黑魔王成形 → 舉杖 → 紫黑色魔法打中目標 → 化成一群黑鴉散掉
      const form = ease((t - 0.9) / 1.0), gone = ease((t - 4.3) / 0.5), lx = cx - W * 0.26, ly = gy - 10 * U, ls = U * 0.95;
      if (t > 0.6) { g.save(); g.globalCompositeOperation = 'source-over'; const sm = H.smoke('lordSmoke', [20, 14, 30], 0.3, 23); g.globalAlpha = clamp((t - 0.6) / 0.5) * (1 - form * 0.6); g.drawImage(sm, lx - 160 * U, ly - 330 * U * Math.max(0.3, form), 320 * U, 340 * U * Math.max(0.3, form)); g.restore(); }
      let tip = [lx, ly - 300 * U];
      if (form > 0 && gone < 1) { g.save(); g.globalAlpha = form * (1 - gone); const wand = ease((t - 2.1) / 0.4) * (1 - ease((t - 4.0) / 0.4)); rim(g, W, Hh, 'rgba(160,80,255,.8)', 22 * U, (q) => { tip = darkLord(q, lx, ly, ls * lerp(0.6, 1, form), t, { wand, form: 0 }); }); darkLord(g, lx, ly, ls * lerp(0.6, 1, form), t, { wand, form, eyes: clamp((t - 1.7) / 0.3), maskOnly: true }); g.restore(); }
      if (t > 2.1 && t < 4.3) sigil(g, tip[0], tip[1], 60 * U * ease((t - 2.1) / 0.5), t * 2, 0.9 * (1 - clamp((t - 3.9) / 0.4)));
      // 目標＋魔法束
      const [tx, ty] = target(g, e, U, cx + W * 0.2, gy, bld ? clamp((t - 3.4) / 1.2) : 0, bld ? { dir: 'down', overlay: (q, bx, by, bw, bh) => { if (t > 2.9 && t < 3.6) { q.save(); q.globalCompositeOperation = 'lighter'; q.strokeStyle = 'rgba(200,140,255,.9)'; q.lineWidth = 2 * U; q.beginPath(); let xx = bx + bw * 0.5, yy = by + 4 * U; q.moveTo(xx, yy); for (let k = 0; k < 7; k++) { xx += rnd(-14, 14) * U; yy += bh / 7; q.lineTo(xx, yy); } q.stroke(); q.restore(); } } } : { rim: 'rgba(200,140,255,.9)', t, pose: t < 2.85 ? { arms: t > 2 ? 'cover' : 'down' } : t < 4.0 ? { lift: ease((t - 2.85) / 0.4) * 60 * U, arms: 'out', jerk: 1 } : { fall: ein((t - 4.0) / 0.3) * 0.6, arms: 'out' } }, 'magic');
      if (t > 2.8 && t < 3.9) { const a = clamp((t - 2.8) / 0.08) * (1 - clamp((t - 3.5) / 0.4)); g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { g.strokeStyle = k ? `rgba(160,60,255,${a * (k === 2 ? 0.25 : 0.5)})` : `rgba(240,220,255,${a})`; g.lineWidth = (k === 2 ? 34 : k ? 14 : 4) * U; g.beginPath(); g.moveTo(tip[0], tip[1]); const n = 10; for (let j = 1; j <= n; j++) { const u = j / n; g.lineTo(lerp(tip[0], tx, u) + (j < n ? rnd(-18, 18) * U : 0), lerp(tip[1], ty, u) + (j < n ? rnd(-18, 18) * U : 0)); } g.stroke(); } g.restore(); }
      // 搶錢版：金幣從身上被抽出來，螺旋飛進杖尖的黑色漩渦
      if (!bld && t > 3.0) { const vk = clamp((t - 3.0) / 0.3) * (1 - clamp((t - 4.3) / 0.3)); if (vk > 0) { g.save(); g.translate(tip[0], tip[1]); for (let k = 0; k < 4; k++) { g.rotate(t * (3 + k)); g.strokeStyle = `rgba(${k ? 60 : 180},${k ? 20 : 120},${k ? 90 : 255},${vk * 0.8})`; g.lineWidth = 3 * U; g.beginPath(); for (let j = 0; j < 40; j++) { const aa = j * 0.35, rr = j * 1.3 * U * vk; g[j ? 'lineTo' : 'moveTo'](Math.cos(aa) * rr, Math.sin(aa) * rr); } g.stroke(); } g.restore(); }
        coins.forEach(c => { const a = clamp((t - 3.0 - c.d * 1.2) / 0.9); if (a <= 0 || a >= 1) return; const ang = a * 10 + c.sp, rr = (1 - a) * 50 * U, x = lerp(tx + c.vx * 40 * U, tip[0], ein(a)) + Math.cos(ang) * rr, y = lerp(ty + c.vy * 30 * U, tip[1], ein(a)) + Math.sin(ang) * rr; coin(g, x, y, 8 * U * c.s * (1 - a * 0.6), t * 10 + c.sp, 1); }); }
      // 散成黑鴉
      if (t > 4.3) crows.forEach(c => { const a = t - 4.3 - c.d * 0.3; if (a < 0) return; const x = lx + c.vx * a * 260 * U, y = ly - 180 * U + c.vy * a * 260 * U - a * a * 40 * U, fl = Math.sin(t * 22 + c.sp) * 0.8; g.save(); g.translate(x, y); g.scale(U * c.s, U * c.s); g.fillStyle = '#05040a'; g.beginPath(); g.moveTo(-26, -fl * 16); g.quadraticCurveTo(-10, -4, 0, 0); g.quadraticCurveTo(10, -4, 26, -fl * 16); g.quadraticCurveTo(10, 6, 0, 6); g.quadraticCurveTo(-10, 6, -26, -fl * 16); g.fill(); g.restore(); });
      g.restore(); if (lit) { g.fillStyle = 'rgba(220,210,255,.25)'; g.fillRect(0, 0, W, Hh); }
      H.vignette(g, W, Hh, 0.88); H.grain(g, W, Hh, 0.08); void stones;
    }, snd);
  };

  // RD 其他主題在下面

  root.MONO_RAID = RD;
  // 接到彩蛋表：MONO_EGGS.raid 依主題分派（測試房網址 ?egg=raid 預覽搶錢版、?egg=raidBld 預覽砸房版）
  if (root.MONO_EGGS) {
    root.MONO_EGGS.raid = function (SFX, e) {
      const th = this.v && this.v.theme, ev = Object.assign({ mode: 'cash' }, e || {});
      if (th === 'town') { const TW = root.MONO_TOWN; return TW ? (ev.mode === 'bld' && TW.houndBld ? TW.houndBld(this, SFX, ev) : TW.hound(this, SFX, ev)) : Promise.resolve(); }
      if (th === 'gang') return root.MONO_GANG && root.MONO_GANG.sweep ? root.MONO_GANG.sweep.call(this, SFX, ev) : Promise.resolve();
      return (RD[th] || RD.ragnarok)(this, SFX, ev);
    };
    root.MONO_EGGS.raidBld = function (SFX, e) { return root.MONO_EGGS.raid.call(this, SFX, Object.assign({}, e, { mode: 'bld' })); };
  }
})(typeof window !== 'undefined' ? window : globalThis);
