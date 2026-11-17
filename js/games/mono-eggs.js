// 大富翁：神佛之境＋魔法學院的彩蛋卡全螢幕動畫（Canvas 2D＋合成音效）
// 呼叫方式：MONO_EGGS[k].call(monopoly 模組, SFX, 卡片事件)，回傳 Promise
(function (root) {
  const E = {};
  const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const TXT = '900 {s}px "PingFang TC","Noto Sans TC",system-ui,sans-serif';
  const rnd = (a, b) => a + Math.random() * (b - a);
  const font = (g, px) => { g.font = TXT.replace('{s}', Math.round(px)); };
  function title(g, W, H, dpr, text, col, y, size) {
    font(g, (size || 34) * dpr); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6 * dpr; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(text, W / 2, y || H * 0.14);
    g.fillStyle = col || '#fff'; g.fillText(text, W / 2, y || H * 0.14);
  }
  function emoji(g, ch, x, y, px, rot) { g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.font = `${Math.round(px)}px ${EMOJI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 0, 0); g.restore(); }
  function eyeShape(g, x, y, r, open, iris, look) { // 杏仁眼，open 0~1
    if (open <= 0.02) { g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = Math.max(1, r * 0.15); g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + r * 0.3, x + r, y); g.stroke(); return; }
    g.save(); g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y - r * open, x + r, y); g.quadraticCurveTo(x, y + r * open, x - r, y); g.closePath();
    g.fillStyle = '#f6f0e4'; g.fill(); g.clip();
    const lx = (look ? look[0] : 0) * r * 0.35, ly = (look ? look[1] : 0) * r * 0.2;
    g.fillStyle = iris || '#3a8a6a'; g.beginPath(); g.arc(x + lx, y + ly, r * 0.48, 0, 7); g.fill();
    g.fillStyle = '#050505'; g.beginPath(); g.arc(x + lx, y + ly, r * 0.22, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + lx + r * 0.12, y + ly - r * 0.12, r * 0.08, 0, 7); g.fill();
    g.restore(); g.strokeStyle = '#1a0a08'; g.lineWidth = Math.max(1, r * 0.1); g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y - r * open, x + r, y); g.stroke();
  }
  function shake(g, amt) { g.translate(rnd(-amt, amt), rnd(-amt, amt)); }
  function coins(g, W, H, dpr, t, t0, n, ch) { // 從天而降的錢
    if (t < t0) return; const k = t - t0;
    for (let i = 0; i < n; i++) { const x = (i * 97.13 % 1) * W, sp = 0.6 + (i * 13.7 % 1) * 0.8, y = -60 * dpr + (k * sp * H * 0.9 + (i * 53.3 % 1) * H * 0.4) % (H + 120 * dpr); emoji(g, ch || '🪙', x, y, 34 * dpr, k * 3 + i); }
  }
  const unitOf = (ui) => { const th = root.MONO_THEMES[ui.v.theme]; return th ? th.unit : ''; };
  const amtText = (ui, e) => { const v0 = +(e.eff.split(':')[1] || 0), v = Math.round(v0 * (e.mul || 1) / 100) * 100; return `+${v.toLocaleString()} ${unitOf(ui)}`; };

  // ---------- 音效 ----------
  const S = {
    psy(SFX, dur) { // 145 BPM 迷幻電子：四拍大鼓、滾動貝斯、壓克力酸音
      const b = 60 / 145, n = Math.floor(dur / b);
      for (let i = 0; i < n; i++) {
        SFX.tone(150, 0.16, { glide: 42, vol: 0.16, wet: false, delay: i * b });
        SFX.noise(0.04, { f: 8000, type: 'highpass', vol: 0.03, delay: i * b + b / 2 });
        [1, 2, 3].forEach(k => SFX.tone(55, b / 4 * 0.9, { type: 'sawtooth', vol: 0.05, lp: 420, wet: false, delay: i * b + k * b / 4 }));
      }
      const acid = [220, 220, 330, 220, 262, 220, 392, 349, 220, 220, 440, 330, 294, 220, 523, 466];
      for (let i = 0; i < n * 4; i++) { const f = acid[i % 16]; SFX.tone(f, b / 4 * 0.95, { type: 'sawtooth', vol: 0.035, lp: 500 + (i % 16) * 260 + Math.sin(i / 3) * 400, glide: i % 4 === 3 ? f * 1.5 : undefined, wet: 0.2, delay: i * b / 4 }); }
      SFX.tone(880, dur, { type: 'sine', vol: 0.02, detune: 7, delay: 0.2, attack: 1.5 }); SFX.tone(1320, dur, { type: 'sine', vol: 0.015, delay: 1.5, attack: 1.5 });
    },
    trance(SFX) { // 陣頭鼓＋鑼＋鞭炮
      for (let i = 0; i < 26; i++) SFX.tone(i % 2 ? 110 : 82, 0.12, { type: 'triangle', glide: 55, vol: 0.12 - i * 0.002, delay: i * 0.11 });
      [0.1, 1.4, 2.6].forEach(d => { SFX.tone(196, 2.2, { type: 'sine', vol: 0.06, detune: -20, delay: d }); SFX.tone(203, 2.2, { type: 'sine', vol: 0.05, delay: d }); SFX.noise(0.6, { f: 3000, type: 'bandpass', vol: 0.05, delay: d }); });
      for (let i = 0; i < 40; i++) SFX.noise(0.03, { f: 2500 + Math.random() * 3000, type: 'bandpass', q: 2, vol: 0.1, delay: 1.2 + Math.random() * 2.2 });
    },
    ghost(SFX) { // 低鳴＋開門吱嘎＋耳語＋最後尖叫
      SFX.tone(55, 4.2, { type: 'sawtooth', vol: 0.05, lp: 220, attack: 0.8 }); SFX.tone(58.3, 4.2, { type: 'sawtooth', vol: 0.05, lp: 220, attack: 0.8 });
      SFX.tone(140, 1.6, { type: 'sawtooth', glide: 90, vol: 0.05, lp: 900, delay: 0.3 }); SFX.tone(160, 1.2, { type: 'square', glide: 120, vol: 0.02, lp: 700, delay: 0.5 });
      for (let i = 0; i < 18; i++) SFX.noise(0.5, { f: 900 + Math.random() * 1600, type: 'bandpass', q: 9, vol: 0.05, delay: 1.2 + i * 0.13 });
      SFX.tone(1400, 1.1, { type: 'sine', glide: 2600, vol: 0.06, delay: 3.3 }); SFX.tone(1450, 1.1, { type: 'square', glide: 2500, vol: 0.025, lp: 4000, delay: 3.3 }); SFX.noise(1.0, { f: 2500, type: 'highpass', vol: 0.06, delay: 3.3 });
      [0.2, 2.2].forEach(d => SFX.tone(392, 2.5, { type: 'sine', vol: 0.04, detune: 13, delay: d }));
    },
    birds(SFX) { // 木頭吱嘎、低沉的貓頭鷹叫、心跳、高頻顫音
      [0.2, 1.3, 2.4].forEach(d => { SFX.tone(370, 0.35, { vol: 0.07, glide: 340, delay: d }); SFX.tone(330, 0.6, { vol: 0.07, glide: 290, delay: d + 0.45 }); });
      for (let i = 0; i < 8; i++) { SFX.tone(60, 0.12, { vol: 0.14, wet: false, delay: 0.3 + i * 0.5 }); SFX.tone(55, 0.12, { vol: 0.1, wet: false, delay: 0.45 + i * 0.5 }); }
      SFX.tone(3200, 3.5, { type: 'sine', vol: 0.012, detune: 30, delay: 0.8, attack: 1 }); SFX.tone(3260, 3.5, { type: 'sine', vol: 0.012, delay: 0.8, attack: 1 });
      SFX.tone(110, 1.2, { type: 'sawtooth', glide: 70, vol: 0.04, lp: 600, delay: 0 });
    },
    bag(SFX) { for (let i = 0; i < 16; i++) { SFX.noise(0.08, { f: 1200, type: 'bandpass', vol: 0.05, delay: i * 0.2 }); SFX.tone(440 * Math.pow(2, (i % 8) / 8), 0.18, { type: 'triangle', vol: 0.05, delay: i * 0.2 + 0.05 }); }
      for (let i = 0; i < 14; i++) SFX.tone(1800 + Math.random() * 900, 0.15, { type: 'square', vol: 0.02, lp: 4000, delay: 3 + i * 0.06 }); },
    phoenix(SFX) { for (let i = 0; i < 30; i++) SFX.noise(0.06, { f: 1500 + Math.random() * 2000, type: 'bandpass', vol: 0.05, delay: i * 0.06 });
      SFX.noise(1.6, { f: 600, vol: 0.08, delay: 1.6, attack: 0.8 }); SFX.tone(220, 2.2, { type: 'sawtooth', glide: 880, vol: 0.03, lp: 2000, delay: 1.6 });
      [523, 659, 784, 1047].forEach((f, i) => SFX.tone(f, 2.2, { type: 'sine', vol: 0.04, attack: 0.4, delay: 2.2 + i * 0.05 })); },
    goblin(SFX) { for (let i = 0; i < 3; i++) { SFX.noise(0.9, { f: 260, vol: 0.08, attack: 0.5, delay: i * 1.0 }); SFX.tone(70, 0.5, { type: 'sawtooth', vol: 0.03, lp: 300, delay: i * 1.0 + 0.5 }); }
      for (let i = 0; i < 24; i++) SFX.tone(2000 + Math.random() * 1500, 0.1, { type: 'square', vol: 0.02, lp: 5000, delay: 2.6 + i * 0.05 }); },
    mandrake(SFX) { // 尖叫：多個高頻鋸齒＋顫音
      SFX.noise(0.3, { f: 500, vol: 0.06, delay: 0.2 });
      for (let k = 0; k < 4; k++) SFX.tone(900 + k * 230, 2.3, { type: k % 2 ? 'square' : 'sawtooth', glide: 1700 + k * 300, vol: 0.05, lp: 5000, attack: 0.05, delay: 0.7 + k * 0.02 });
      for (let i = 0; i < 16; i++) SFX.tone(1500 + (i % 2) * 300, 0.12, { type: 'sawtooth', vol: 0.03, lp: 6000, delay: 0.8 + i * 0.13 });
      SFX.noise(2.2, { f: 3500, type: 'highpass', vol: 0.05, delay: 0.7 });
      SFX.tone(80, 0.8, { glide: 40, vol: 0.12, delay: 3.0 });
    },
    frog(SFX) { SFX.noise(0.4, { f: 900, vol: 0.12 }); SFX.tone(600, 0.3, { glide: 1200, type: 'triangle', vol: 0.05, delay: 0.05 });
      [0.9, 1.5, 2.2, 2.8].forEach(d => { for (let k = 0; k < 4; k++) SFX.tone(150, 0.04, { type: 'square', vol: 0.06, lp: 900, delay: d + k * 0.045 }); SFX.tone(110, 0.25, { type: 'sawtooth', glide: 90, vol: 0.04, lp: 500, delay: d + 0.2 }); }); }
  };

  // ======================= 神佛之境 =======================
  // 與神同頻（Alex Grey 風格：透明的人體、脈輪、神聖幾何、第三眼、無限的眼與手）
  E.sync = function (SFX, e) {
    const CH = ['#ff2a3a', '#ff8a1a', '#ffe21a', '#2aff7a', '#2ab0ff', '#5a3aff', '#d03aff'];
    const amt = amtText(this, e);
    return this.overlay(5200, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.52, U = Math.min(W, H) / 400, hue = t * 70;
      g.fillStyle = '#04020a'; g.fillRect(0, 0, W, H);
      // 背景：無限的眼睛
      if (t > 2.6) { const n = 9, s = Math.max(W, H) / n; for (let y = -1; y <= n + 1; y++) for (let x = -1; x <= n + 1; x++) { const px = x * s + (y % 2) * s / 2, py = y * s * 0.8; const op = Math.min(1, (t - 2.6) * 1.2 - Math.hypot(px - cx, py - cy) / Math.max(W, H)); if (op <= 0) continue; g.globalAlpha = op * 0.55; eyeShape(g, px, py, s * 0.28, Math.min(1, Math.abs(Math.sin(t * 2 + x + y)) * 1.4) * 0.9, `hsl(${(hue + x * 30 + y * 20) % 360},90%,55%)`, [Math.cos(t * 2), Math.sin(t)]); } g.globalAlpha = 1; }
      // 神聖幾何：生命之花＋光芒
      g.save(); g.translate(cx, cy); g.rotate(t * 0.25); g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 36; k++) { const a = k / 36 * 6.283; g.strokeStyle = `hsla(${(hue + k * 10) % 360},100%,60%,0.25)`; g.lineWidth = 2 * dpr; g.beginPath(); g.moveTo(Math.cos(a) * 60 * U, Math.sin(a) * 60 * U); g.lineTo(Math.cos(a) * 900 * U, Math.sin(a) * 900 * U); g.stroke(); }
      const R = 46 * U * Math.min(1, t * 0.6 + 0.3); for (let ring = 0; ring < 3; ring++) for (let k = 0; k < (ring ? 6 * ring : 1); k++) { const a = k / (6 * ring || 1) * 6.283; g.strokeStyle = `hsla(${(hue + ring * 60) % 360},100%,65%,0.55)`; g.lineWidth = 1.6 * dpr; g.beginPath(); g.arc(Math.cos(a) * R * ring, Math.sin(a) * R * ring, R, 0, 7); g.stroke(); }
      // 千手：一圈手臂
      if (t > 1.2) for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283 - t * 0.4, d = 150 * U; g.save(); g.rotate(a); g.globalAlpha = Math.min(1, t - 1.2) * 0.75; g.strokeStyle = `hsl(${(hue + k * 15) % 360},100%,70%)`; g.lineWidth = 3 * dpr; g.beginPath(); g.moveTo(70 * U, 0); g.quadraticCurveTo(110 * U, 12 * U, d, 0); g.stroke();
        g.fillStyle = g.strokeStyle; g.beginPath(); g.ellipse(d + 10 * U, 0, 12 * U, 8 * U, 0, 0, 7); g.fill(); for (let f = -2; f <= 2; f++) { g.fillRect(d + 16 * U, f * 3.2 * U - U, 12 * U, 2 * U); } eyeShape(g, d + 8 * U, 0, 5 * U, 0.8, '#3a2aff'); g.restore(); }
      g.restore(); g.globalCompositeOperation = 'source-over';
      // 透明人體（打坐）
      g.save(); g.translate(cx, cy);
      const body = new Path2D(); body.ellipse(0, -100 * U, 26 * U, 32 * U, 0, 0, 7); body.moveTo(-40 * U, -60 * U); body.quadraticCurveTo(-58 * U, 20 * U, -36 * U, 52 * U); body.quadraticCurveTo(-110 * U, 74 * U, -60 * U, 92 * U); body.lineTo(60 * U, 92 * U); body.quadraticCurveTo(110 * U, 74 * U, 36 * U, 52 * U); body.quadraticCurveTo(58 * U, 20 * U, 40 * U, -60 * U); body.closePath();
      g.fillStyle = 'rgba(80,140,255,0.12)'; g.fill(body); g.strokeStyle = `hsla(${(hue + 180) % 360},100%,70%,0.9)`; g.lineWidth = 2 * dpr; g.stroke(body);
      // 經絡線
      g.globalAlpha = 0.5; for (let k = 0; k < 9; k++) { g.strokeStyle = `hsl(${(hue + k * 40) % 360},100%,65%)`; g.lineWidth = 1 * dpr; g.beginPath(); g.moveTo(0, 70 * U); g.bezierCurveTo((k - 4) * 14 * U, 10 * U, (k - 4) * 10 * U, -50 * U, 0, -100 * U); g.stroke(); } g.globalAlpha = 1;
      // 七個脈輪依序亮起
      for (let k = 0; k < 7; k++) { const on = Math.max(0, Math.min(1, (t - 0.3 - k * 0.3) * 3)); if (!on) continue; const y = 66 * U - k * 28 * U - (k === 6 ? 14 * U : 0);
        const gr = g.createRadialGradient(0, y, 0, 0, y, 26 * U * on); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, CH[k]); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, y, 26 * U * on * (1 + Math.sin(t * 8 + k) * 0.1), 0, 7); g.fill(); }
      // 第三眼張開
      const te = Math.max(0, Math.min(1, (t - 2.5) * 1.5)); if (te) { g.shadowColor = '#fff'; g.shadowBlur = 30 * dpr * te; eyeShape(g, 0, -106 * U, 16 * U * (1 + te * 0.4), te * 0.9, `hsl(${hue % 360},100%,55%)`); g.shadowBlur = 0; }
      g.restore();
      if (t > 3.4) { title(g, W, H, dpr, '🪷 與神同頻', `hsl(${hue % 360},100%,75%)`, H * 0.1, 34); title(g, W, H, dpr, amt + '・下一次過路費免付', '#ffe9a0', H * 0.9, 22); }
      if (t > 4.7) { g.fillStyle = `rgba(255,255,255,${(t - 4.7) * 1.6})`; g.fillRect(0, 0, W, H); }
    }, () => S.psy(SFX, 5.0));
  };
  // 神明附身・起乩：畫面猛晃、角色雙眼發光、鞭炮
  E.trance = function (SFX, e) {
    const th = root.MONO_THEMES[this.v.theme], p = this.v.players[e.seat], ch = p && p.char && p.char.kind !== 'custom' && th.chars[p.char.i] ? th.chars[p.char.i][0] : '🙏';
    const sparks = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), v: rnd(0.2, 0.8), c: ['#ffd23a', '#ff4a2a', '#fff'][Math.floor(Math.random() * 3)] }));
    return this.overlay(3800, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.52, U = Math.min(W, H) / 400, amp = t < 0.6 ? t * 30 : 18 + Math.sin(t * 30) * 6;
      g.save(); shake(g, amp * dpr);
      g.fillStyle = t % 0.24 < 0.12 ? '#5a0a0a' : '#2a0404'; g.fillRect(-50, -50, W + 100, H + 100);
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283 + t * 2; g.fillStyle = k % 2 ? 'rgba(255,200,40,.18)' : 'rgba(255,60,30,.12)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, Math.hypot(W, H), a, a + 0.26); g.fill(); }
      // 煙霧
      for (let k = 0; k < 10; k++) { const r = (80 + k * 30) * U; g.fillStyle = `rgba(200,180,190,${0.05})`; g.beginPath(); g.arc(cx + Math.sin(t + k) * 60 * U, H - (t * 60 + k * 40) % H, r, 0, 7); g.fill(); }
      // 角色：左右狂抖＋發光的眼睛
      const s = 160 * U * (1 + Math.sin(t * 22) * 0.05); emoji(g, ch, cx + Math.sin(t * 40) * 10 * U, cy, s, Math.sin(t * 25) * 0.25);
      if (t > 0.8) { g.globalCompositeOperation = 'lighter'; [-1, 1].forEach(sd => { const ex = cx + sd * 26 * U, ey = cy - 30 * U, rr = 16 * U * (1 + Math.sin(t * 15) * 0.25); const gr = g.createRadialGradient(ex, ey, 0, ex, ey, rr); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, '#ffd23a'); gr.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(ex, ey, rr, 0, 7); g.fill(); }); g.globalCompositeOperation = 'source-over'; }
      // 鞭炮火花
      if (t > 1.2) sparks.forEach(p2 => { const y = (p2.y + (t - 1.2) * p2.v) % 1; g.fillStyle = p2.c; g.fillRect(p2.x * W + Math.sin(t * 20 + p2.y * 9) * 6, (1 - y) * H, 4 * dpr, 4 * dpr); });
      g.restore();
      title(g, W, H, dpr, t < 1 ? '……' : '神明附身・起乩！', '#ffd23a', H * 0.13, 38);
      if (t > 1.8) title(g, W, H, dpr, '下一次擲骰：點數你說了算', '#fff', H * 0.88, 22);
    }, () => S.trance(SFX));
  };
  // 鬼門開：廟門緩緩打開，綠光裡湧出好兄弟，冥紙亂飛
  E.ghost = function (SFX) {
    const gh = Array.from({ length: 26 }, () => ({ x: rnd(-0.5, 0.5), d: rnd(0, 1), s: rnd(0.7, 1.3), w: rnd(0, 6) }));
    const paper = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(0, 6), v: rnd(0.1, 0.4) }));
    return this.overlay(4400, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.55, U = Math.min(W, H) / 400;
      g.fillStyle = '#020604'; g.fillRect(0, 0, W, H);
      const open = Math.max(0, Math.min(1, (t - 0.5) / 1.6)), gw = 150 * U, gh2 = 230 * U;
      // 門內的綠光
      const gr = g.createRadialGradient(cx, cy, 10, cx, cy, gw * 2.5 * (0.3 + open)); gr.addColorStop(0, `rgba(140,255,170,${0.9 * open})`); gr.addColorStop(0.4, `rgba(40,160,80,${0.4 * open})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // 好兄弟：從門裡往鏡頭飄
      if (t > 1.2) gh.forEach((p, k) => { const z = ((t - 1.2) * 0.35 + p.d) % 1, sc = (0.2 + z * z * 3.2) * p.s * U, x = cx + p.x * gw * (1 + z * 6) + Math.sin(t * 2 + p.w) * 20 * U * z, y = cy - 20 * U + z * 120 * U;
        g.globalAlpha = Math.min(0.85, z * 1.6) * (1 - Math.max(0, z - 0.85) * 6); g.fillStyle = '#d8f8e0';
        g.beginPath(); g.arc(x, y - 60 * sc, 26 * sc, Math.PI, 0); g.lineTo(x + 26 * sc, y + 30 * sc); for (let j = 0; j < 4; j++) g.quadraticCurveTo(x + 26 * sc - (j + 0.5) * 13 * sc, y + (j % 2 ? 20 : 44) * sc, x + 26 * sc - (j + 1) * 13 * sc, y + 30 * sc); g.closePath(); g.fill();
        g.fillStyle = '#020604'; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(x + sd * 9 * sc, y - 62 * sc, 5 * sc, 8 * sc, 0, 0, 7); g.fill(); }); g.beginPath(); g.ellipse(x, y - 42 * sc, 6 * sc, 10 * sc, 0, 0, 7); g.fill(); });
      g.globalAlpha = 1;
      // 兩扇朱紅門板＋金色門釘
      [-1, 1].forEach(sd => { const ang = open * 1.25, w = gw * Math.cos(ang); g.save(); g.translate(cx + sd * gw, cy - gh2 / 2); g.fillStyle = '#6a0a0a'; g.fillRect(sd < 0 ? 0 : -w, 0, w, gh2); g.fillStyle = '#d8a83a';
        for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) { const px = (sd < 0 ? 1 : -1) * (c + 0.5) / 5 * w; g.beginPath(); g.arc(px, (r + 0.6) * gh2 / 7.3, 4 * U * Math.cos(ang), 0, 7); g.fill(); } g.restore(); });
      g.strokeStyle = '#2a0404'; g.lineWidth = 16 * U; g.strokeRect(cx - gw - 8 * U, cy - gh2 / 2 - 8 * U, gw * 2 + 16 * U, gh2 + 16 * U);
      g.fillStyle = '#1a0606'; g.fillRect(cx - gw - 40 * U, cy - gh2 / 2 - 50 * U, gw * 2 + 80 * U, 36 * U); font(g, 26 * U); g.fillStyle = '#d8a83a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('鬼　門　關', cx, cy - gh2 / 2 - 32 * U);
      // 冥紙
      paper.forEach(p => { const y = (p.y + t * p.v) % 1; g.save(); g.translate(p.x * W + Math.sin(t * 2 + p.r) * 30 * U, y * H); g.rotate(t * 3 + p.r); g.fillStyle = '#e8d8a0'; g.fillRect(-8 * U, -5 * U, 16 * U, 10 * U); g.fillStyle = '#c0902a'; g.fillRect(-3 * U, -2 * U, 6 * U, 4 * U); g.restore(); });
      title(g, W, H, dpr, '鬼門開', '#9affb8', H * 0.1, 40);
      if (t > 2.2) title(g, W, H, dpr, '好兄弟把三成功德搬走了', '#fff', H * 0.92, 22);
      if (t > 3.3 && t < 3.6) { g.fillStyle = 'rgba(220,255,230,.9)'; g.fillRect(0, 0, W, H); }
      if (t > 3.3) { g.save(); g.translate(cx, cy); const sc = (t - 3.3) * 6 * U; g.fillStyle = '#f0fff4'; g.beginPath(); g.arc(0, 0, 30 * sc, 0, 7); g.fill(); g.fillStyle = '#000'; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 11 * sc, -6 * sc, 6 * sc, 10 * sc, 0, 0, 7); g.fill(); }); g.beginPath(); g.ellipse(0, 14 * sc, 8 * sc, 13 * sc, 0, 0, 7); g.fill(); g.restore(); }
    }, () => S.ghost(SFX));
  };
  // 多眼鳥夜啼：木雕鳥身上的眼睛一顆一顆睜開，最後全部盯著你
  E.birds = function (SFX) {
    const eyes = []; for (let k = 0; k < 46; k++) { const a = rnd(0, 6.283), r = Math.sqrt(Math.random()); eyes.push({ x: Math.cos(a) * r * 0.9, y: Math.sin(a) * r * 0.75, s: rnd(0.06, 0.12), o: 0.5 + k * 0.055 }); }
    return this.overlay(4400, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.54, U = Math.min(W, H) / 400, look = t > 3 ? [0, 0] : [Math.sin(t * 3), Math.cos(t * 2) * 0.5];
      g.fillStyle = '#060404'; g.fillRect(0, 0, W, H);
      const gr = g.createRadialGradient(cx, cy, 20, cx, cy, 300 * U); gr.addColorStop(0, 'rgba(90,60,40,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.save(); g.translate(cx, cy + Math.sin(t * 1.3) * 3 * U); const S2 = 150 * U;
      // 木雕鳥的身體、頭、喙、尾巴
      g.fillStyle = '#5a3a24'; g.beginPath(); g.ellipse(0, 0, S2, S2 * 0.78, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(-S2 * 0.9, S2 * 0.1); g.lineTo(-S2 * 1.5, S2 * 0.55); g.lineTo(-S2 * 0.8, S2 * 0.45); g.fill();
      g.beginPath(); g.arc(S2 * 0.75, -S2 * 0.6, S2 * 0.42, 0, 7); g.fill();
      g.fillStyle = '#3a2414'; g.beginPath(); g.moveTo(S2 * 1.1, -S2 * 0.62); g.lineTo(S2 * 1.45, -S2 * 0.52); g.lineTo(S2 * 1.1, -S2 * 0.48); g.fill();
      g.strokeStyle = 'rgba(30,15,5,.5)'; g.lineWidth = 2 * dpr; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(-S2 * 0.2, S2 * 0.1, S2 * (0.2 + k * 0.08), -0.8, 1.2); g.stroke(); }
      eyes.forEach(e2 => { const op = Math.max(0, Math.min(1, (t - e2.o) * 3)); eyeShape(g, e2.x * S2, e2.y * S2, e2.s * S2, op * 0.85, '#c8a020', look); });
      eyeShape(g, S2 * 0.82, -S2 * 0.66, S2 * 0.14, Math.min(1, t * 2) * 0.85, '#c02020', look);
      g.restore();
      // 背景的黑暗裡也有眼睛
      if (t > 2.4) for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, d = Math.max(W, H) * 0.42; eyeShape(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, 14 * U, Math.min(1, (t - 2.4 - k * 0.05) * 2) * 0.8, '#a01818', [-Math.cos(a), -Math.sin(a)]); }
      title(g, W, H, dpr, '多眼鳥夜啼', '#e8c070', H * 0.1, 36);
      if (t > 2.6) title(g, W, H, dpr, '接下來 3 次過路費加倍', '#fff', H * 0.92, 22);
      if (t > 3.6) { g.fillStyle = `rgba(0,0,0,${(t - 3.6) * 1.2})`; g.fillRect(0, 0, W, H); }
    }, () => S.birds(SFX));
  };

  // ======================= 魔法學院 =======================
  E.bag = function (SFX, e) {
    const items = ['📚', '⛺', '🫖', '🖼️', '🧪', '🧹', '🕯️', '🗺️', '🎻', '🪑', '🧣', '📜', '🔭', '🧸', '🪞', '💰'];
    const amt = amtText(this, e);
    return this.overlay(4200, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.66, U = Math.min(W, H) / 400;
      const gr = g.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W, H)); gr.addColorStop(0, '#5a3a9a'); gr.addColorStop(1, '#120a24'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(255,240,200,${0.3 + Math.sin(t * 5 + k) * 0.3})`; g.fillRect((k * 97 % 100) / 100 * W, (k * 61 % 100) / 100 * H, 2 * dpr, 2 * dpr); }
      // 小串珠包（會被撐大、晃動）
      const bulge = 1 + Math.min(0.25, t * 0.08) + Math.sin(t * 18) * 0.03;
      g.save(); g.translate(cx, cy); g.scale(bulge, bulge); g.fillStyle = '#c86aa8'; g.beginPath(); g.ellipse(0, 20 * U, 48 * U, 40 * U, 0, 0, 7); g.fill();
      for (let k = 0; k < 40; k++) { g.fillStyle = k % 2 ? '#ffd8f0' : '#e8a0d0'; g.beginPath(); g.arc(Math.cos(k * 2.4) * 40 * U * ((k % 7) / 7), 20 * U + Math.sin(k * 2.4) * 32 * U * ((k % 5) / 5), 2.6 * U, 0, 7); g.fill(); }
      g.strokeStyle = '#e8c46a'; g.lineWidth = 3 * U; g.beginPath(); g.arc(0, -10 * U, 28 * U, Math.PI, 0); g.stroke(); g.fillStyle = '#2a1030'; g.beginPath(); g.ellipse(0, -14 * U, 26 * U, 7 * U, 0, 0, 7); g.fill(); g.restore();
      // 一直掏出東西
      items.forEach((ch, k) => { const k0 = 0.3 + k * 0.2, tt = t - k0; if (tt < 0) return; const dir = (k % 2 ? 1 : -1) * (0.3 + (k % 5) * 0.12), x = cx + dir * tt * 200 * U, y = cy - 20 * U - tt * 300 * U + tt * tt * 160 * U; emoji(g, ch, x, y, (28 + Math.min(tt, 1) * 26) * U, tt * dir * 4); });
      coins(g, W, H, dpr, t, 3.0, 30, '🔮');
      title(g, W, H, dpr, '無底魔法包', '#ffd8f0', H * 0.1, 36);
      if (t > 3.0) title(g, W, H, dpr, amt, '#ffe9a0', H * 0.9, 30);
    }, () => S.bag(SFX));
  };
  E.phoenix = function (SFX, e) {
    const ash = Array.from({ length: 140 }, () => ({ x: rnd(-1, 1), y: rnd(-1, 0.5), v: rnd(0.4, 1.2) }));
    const fire = Array.from({ length: 220 }, () => ({ a: rnd(0, 6.283), r: Math.random(), v: rnd(0.5, 1.5), h: rnd(10, 50) }));
    return this.overlay(4200, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.5, U = Math.min(W, H) / 400;
      g.fillStyle = t < 1.6 ? '#140808' : `rgb(${Math.min(80, (t - 1.6) * 60)},${Math.min(30, (t - 1.6) * 20)},8)`; g.fillRect(0, 0, W, H);
      if (t < 1.6) { // 垂死的鳥化成灰燼
        const k = t / 1.6; g.globalAlpha = 1 - k; emoji(g, '🐦', cx, cy, 120 * U); g.globalAlpha = 1;
        ash.forEach(p => { const y = cy + (p.y * 60 + k * k * p.v * 260) * U; g.fillStyle = `rgba(160,150,140,${Math.min(1, k * 2) * (1 - Math.max(0, k - 0.8) * 3)})`; g.fillRect(cx + p.x * 70 * U, y, 3 * dpr, 3 * dpr); });
        g.fillStyle = 'rgba(90,80,70,.8)'; g.beginPath(); g.ellipse(cx, cy + 120 * U, 60 * U * k, 10 * U * k, 0, 0, 7); g.fill();
      } else { // 從火裡重生
        const k = Math.min(1, (t - 1.6) / 1.2), rise = (t - 1.6) * 40 * U;
        g.globalCompositeOperation = 'lighter';
        fire.forEach(p => { const life = ((t - 1.6) * p.v + p.r) % 1, x = cx + Math.cos(p.a) * (30 + life * 140 * k) * U * (Math.abs(Math.cos(p.a)) > 0.5 ? 1.6 : 0.6), y = cy + 120 * U - rise - life * p.h * 6 * U - Math.abs(Math.sin(p.a)) * 80 * U * k;
          const gr = g.createRadialGradient(x, y, 0, x, y, 22 * U * (1 - life)); gr.addColorStop(0, 'rgba(255,240,180,.9)'); gr.addColorStop(0.4, 'rgba(255,140,20,.5)'); gr.addColorStop(1, 'rgba(255,40,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 22 * U * (1 - life) + 1, 0, 7); g.fill(); });
        // 鳳凰輪廓：張開的翅膀
        const flap = Math.sin(t * 6) * 0.25; g.fillStyle = `rgba(255,200,80,${0.6 * k})`;
        [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(cx, cy - rise); g.quadraticCurveTo(cx + sd * 120 * U, cy - rise - (90 + flap * 100) * U, cx + sd * 220 * U, cy - rise - (40 + flap * 160) * U); g.quadraticCurveTo(cx + sd * 120 * U, cy - rise + 10 * U, cx, cy - rise + 30 * U); g.fill(); });
        g.globalCompositeOperation = 'source-over';
        emoji(g, '🔥', cx, cy - rise - 30 * U, 90 * U * k);
      }
      title(g, W, H, dpr, '鳳凰重生', '#ffd27a', H * 0.1, 36);
      if (t > 2.6) title(g, W, H, dpr, '你的錢包也跟著重生了', '#fff', H * 0.9, 24);
      if (t > 3.8) { g.fillStyle = `rgba(255,240,200,${(t - 3.8) * 2})`; g.fillRect(0, 0, W, H); }
    }, () => S.phoenix(SFX));
  };
  E.goblin = function (SFX, e) {
    const amt = amtText(this, e);
    return this.overlay(4200, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.56, U = Math.min(W, H) / 400;
      g.fillStyle = '#0e1410'; g.fillRect(0, 0, W, H);
      // 金庫背景：成堆的金幣
      g.fillStyle = '#3a2a10'; for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(k / 8 * W, H * 0.92, 90 * U, 50 * U, 0, Math.PI, 0); g.fill(); }
      for (let k = 0; k < 80; k++) { g.fillStyle = k % 3 ? '#e0b040' : '#ffd86a'; g.beginPath(); g.ellipse((k * 53 % 100) / 100 * W, H * 0.86 + (k % 5) * 6 * U, 9 * U, 4 * U, 0, 0, 7); g.fill(); }
      // 櫃台
      g.fillStyle = '#4a2a14'; g.fillRect(cx - 160 * U, cy + 40 * U, 320 * U, 60 * U); g.fillStyle = '#6a4020'; g.fillRect(cx - 170 * U, cy + 32 * U, 340 * U, 12 * U);
      // 打瞌睡的金庫妖精：綠皮、尖耳、長鼻子
      const nod = t < 2.4 ? Math.min(1, t * 0.8) : 1, sway = Math.sin(t * 2) * 0.05;
      g.save(); g.translate(cx - 40 * U, cy + 10 * U); g.rotate(nod * 0.5 + sway);
      g.fillStyle = '#6a8a4a'; g.beginPath(); g.ellipse(0, -30 * U, 36 * U, 32 * U, 0, 0, 7); g.fill();
      [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 30 * U, -40 * U); g.lineTo(sd * 72 * U, -58 * U); g.lineTo(sd * 30 * U, -24 * U); g.fill(); });
      g.beginPath(); g.ellipse(20 * U, -22 * U, 14 * U, 8 * U, 0.5, 0, 7); g.fill();
      g.strokeStyle = '#1a2a10'; g.lineWidth = 3 * U; [-1, 1].forEach(sd => { g.beginPath(); g.arc(sd * 12 * U - 4 * U, -36 * U, 6 * U, 0.2, Math.PI - 0.2); g.stroke(); });
      g.fillStyle = '#2a1a10'; g.fillRect(-40 * U, 2 * U, 80 * U, 40 * U); g.restore();
      // 被打翻的南瓜汁
      emoji(g, '🍹', cx + 70 * U, cy + 22 * U, 34 * U, t > 1 ? 1.4 : 0);
      if (t > 0.8) for (let k = 0; k < 3; k++) { const z = ((t - 0.8) * 0.6 + k / 3) % 1; g.globalAlpha = 1 - z; font(g, (18 + z * 18) * U); g.fillStyle = '#c8e8ff'; g.textAlign = 'center'; g.fillText('Z', cx - 10 * U + z * 70 * U, cy - 60 * U - z * 90 * U); } g.globalAlpha = 1;
      // 你扛著錢袋偷溜
      if (t > 2.2) { const k = t - 2.2; emoji(g, '💰', cx + 180 * U - k * 220 * U, cy - 10 * U + Math.abs(Math.sin(k * 10)) * -16 * U, 70 * U); emoji(g, '🫣', cx + 210 * U - k * 220 * U, cy - 50 * U, 44 * U); }
      coins(g, W, H, dpr, t, 2.6, 26, '🔮');
      title(g, W, H, dpr, '迷暈金庫妖精', '#c8f0a0', H * 0.1, 36);
      if (t > 2.6) title(g, W, H, dpr, amt, '#ffe9a0', H * 0.9, 30);
    }, () => S.goblin(SFX));
  };
  E.mandrake = function (SFX, e) {
    return this.overlay(3800, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.55, U = Math.min(W, H) / 400, scream = t > 0.7 && t < 3.0;
      g.save(); if (scream) shake(g, 14 * dpr);
      g.fillStyle = '#16200e'; g.fillRect(-40, -40, W + 80, H + 80);
      // 溫室窗格
      g.strokeStyle = 'rgba(160,200,140,.15)'; g.lineWidth = 3 * dpr; for (let x = 0; x < W; x += 80 * U) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 80 * U) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      if (scream) for (let k = 0; k < 6; k++) { const r = ((t - 0.7) * 500 + k * 90) % 600 * U; g.strokeStyle = `rgba(255,255,200,${0.5 * (1 - r / (600 * U))})`; g.lineWidth = 6 * dpr; g.beginPath(); g.arc(cx, cy - 40 * U, r, 0, 7); g.stroke(); }
      // 花盆
      g.fillStyle = '#9a4a2a'; g.beginPath(); g.moveTo(cx - 70 * U, cy + 60 * U); g.lineTo(cx + 70 * U, cy + 60 * U); g.lineTo(cx + 52 * U, cy + 150 * U); g.lineTo(cx - 52 * U, cy + 150 * U); g.fill();
      // 被拔起來的根：醜醜的小臉
      const up = Math.min(1, t / 0.7) * 110 * U, y0 = cy + 50 * U - up;
      g.fillStyle = '#c8a070'; g.beginPath(); g.ellipse(cx, y0, 40 * U, 52 * U, 0, 0, 7); g.fill();
      g.strokeStyle = '#c8a070'; g.lineWidth = 6 * U; [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(cx + sd * 20 * U, y0 + 40 * U); g.quadraticCurveTo(cx + sd * 40 * U, y0 + 80 * U, cx + sd * 30 * U, y0 + 110 * U); g.stroke(); g.beginPath(); g.moveTo(cx + sd * 36 * U, y0); g.quadraticCurveTo(cx + sd * (70 + Math.sin(t * 40) * 10) * U, y0 - 20 * U, cx + sd * 80 * U, y0 - (scream ? 50 : 10) * U); g.stroke(); });
      g.fillStyle = '#3a8a2a'; for (let k = -2; k <= 2; k++) { g.save(); g.translate(cx + k * 8 * U, y0 - 48 * U); g.rotate(k * 0.35 + Math.sin(t * 30) * 0.1); g.beginPath(); g.ellipse(0, -26 * U, 9 * U, 28 * U, 0, 0, 7); g.fill(); g.restore(); }
      g.fillStyle = '#2a1a0a'; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(cx + sd * 14 * U, y0 - 14 * U, 6 * U, scream ? 4 * U : 7 * U, sd * 0.4, 0, 7); g.fill(); });
      g.fillStyle = '#3a0a0a'; g.beginPath(); g.ellipse(cx, y0 + 14 * U, scream ? 18 * U : 8 * U, scream ? 22 * U + Math.sin(t * 50) * 3 * U : 4 * U, 0, 0, 7); g.fill();
      g.restore();
      if (scream) { font(g, (40 + Math.sin(t * 30) * 6) * dpr); g.textAlign = 'center'; g.fillStyle = '#ffffa0'; g.strokeStyle = '#000'; g.lineWidth = 6 * dpr; g.strokeText('啊啊啊啊啊——！', cx, H * 0.14); g.fillText('啊啊啊啊啊——！', cx, H * 0.14); }
      if (t > 2.9) { g.fillStyle = `rgba(0,0,0,${Math.min(1, (t - 2.9) * 2)})`; g.fillRect(0, 0, W, H); if (t > 3.1) title(g, W, H, dpr, '你昏倒了……（停 1 回合＋賠溫室）', '#fff', H * 0.5, 22); }
    }, () => S.mandrake(SFX));
  };
  E.frog = function (SFX, e) {
    const th = root.MONO_THEMES[this.v.theme], p = this.v.players[e.seat], ch = p && p.char && p.char.kind !== 'custom' && th.chars[p.char.i] ? th.chars[p.char.i][0] : '🧙';
    return this.overlay(3800, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.55, U = Math.min(W, H) / 400;
      g.fillStyle = '#0e2a14'; g.fillRect(0, 0, W, H);
      for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(80,160,60,.25)'; g.beginPath(); g.ellipse((k * 37 % 100) / 100 * W, H * 0.85 + (k % 3) * 20 * U, 70 * U, 22 * U, 0, 0, 7); g.fill(); }
      if (t < 0.6) { emoji(g, ch, cx, cy, 130 * U); g.strokeStyle = '#a0ff80'; g.lineWidth = 4 * dpr; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 + t * 6; g.beginPath(); g.moveTo(cx + Math.cos(a) * 30 * U, cy + Math.sin(a) * 30 * U); g.lineTo(cx + Math.cos(a) * (60 + t * 160) * U, cy + Math.sin(a) * (60 + t * 160) * U); g.stroke(); } }
      else if (t < 1.0) { const k = (t - 0.6) / 0.4; for (let j = 0; j < 14; j++) { g.fillStyle = `rgba(230,240,230,${0.8 * (1 - k)})`; g.beginPath(); g.arc(cx + Math.cos(j) * 60 * U * k, cy + Math.sin(j * 1.7) * 50 * U * k, (40 + k * 40) * U, 0, 7); g.fill(); } }
      else { const hop = Math.abs(Math.sin((t - 1) * 4)) * 40 * U; emoji(g, '🐸', cx, cy - hop, 150 * U); emoji(g, ch, cx + 60 * U, cy - hop - 70 * U, 34 * U, Math.sin(t * 5) * 0.3);
        [0.9, 1.5, 2.2, 2.8].forEach((d, k) => { const z = t - d; if (z < 0 || z > 0.9) return; g.globalAlpha = 1 - z; font(g, 30 * dpr); g.fillStyle = '#d8ffb0'; g.textAlign = 'center'; g.fillText('呱！', cx + (k % 2 ? 1 : -1) * 120 * U, cy - 80 * U - z * 60 * U); g.globalAlpha = 1; }); }
      title(g, W, H, dpr, '變青蛙！', '#b8ff90', H * 0.12, 38);
      if (t > 1.4) title(g, W, H, dpr, '兩回合後才變回來', '#fff', H * 0.9, 22);
    }, () => S.frog(SFX));
  };

  // ======================= 破產 =======================
  // 角色頭像：內建角色用 emoji，自畫角色用自己的圖
  function face(ui, s) {
    const v = ui.v, th = root.MONO_THEMES[v.theme], c = v.players[s] && v.players[s].char;
    if (c && c.kind === 'custom') { const src = ui.avatarOf(s); if (src) { const im = new Image(); im.src = src; return { img: im }; } return { ch: '🙂' }; }
    return { ch: c && th.chars[c.i] ? th.chars[c.i][0] : '🙂', i: c ? c.i : -1 };
  }
  function drawFace(g, f, x, y, px, rot) { if (f.img && f.img.complete && f.img.naturalWidth) { g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.drawImage(f.img, -px / 2, -px / 2, px, px); g.restore(); } else emoji(g, f.ch || '🙂', x, y, px, rot); }
  function blood(g, list, t, U) { list.forEach(b => { const k = t - b.t; if (k < 0) return; const x = b.x + b.vx * k * 60 * U, y = b.y + (b.vy * k * 60 + k * k * 300) * U; g.fillStyle = '#9a0000'; g.beginPath(); g.ellipse(x, y, b.r * U, b.r * U * (1 + Math.min(1, k) * 0.6), 0, 0, 7); g.fill(); }); }
  function burst(n, x, y, t0, sp) { return Array.from({ length: n }, () => ({ x, y, t: t0 + Math.random() * 0.3, vx: rnd(-sp, sp), vy: rnd(-sp * 1.4, sp * 0.3), r: rnd(2, 7) })); }
  // 壁畫風格的人物：粗黑框、平塗色
  function outlineFill(g, path, fill, U) { g.fillStyle = fill; g.fill(path); g.strokeStyle = '#120404'; g.lineWidth = 4 * U; g.stroke(path); }
  function demon(g, x, y, U, kind, armA) { // kind 0=牛頭 1=馬面
    g.save(); g.translate(x, y);
    const body = new Path2D(); body.moveTo(-34 * U, 0); body.lineTo(34 * U, 0); body.lineTo(44 * U, 120 * U); body.lineTo(-44 * U, 120 * U); body.closePath(); outlineFill(g, body, kind ? '#2a4a8a' : '#6a2a8a', U);
    const belt = new Path2D(); belt.rect(-40 * U, 50 * U, 80 * U, 14 * U); outlineFill(g, belt, '#d8a83a', U);
    const head = new Path2D(); if (kind) { head.ellipse(0, -40 * U, 24 * U, 48 * U, 0, 0, 7); } else { head.ellipse(0, -28 * U, 36 * U, 32 * U, 0, 0, 7); }
    outlineFill(g, head, kind ? '#e8e0d0' : '#8a4a2a', U);
    if (!kind) { [-1, 1].forEach(sd => { const h = new Path2D(); h.moveTo(sd * 26 * U, -48 * U); h.quadraticCurveTo(sd * 70 * U, -60 * U, sd * 58 * U, -96 * U); h.quadraticCurveTo(sd * 48 * U, -66 * U, sd * 14 * U, -56 * U); outlineFill(g, h, '#f0e8d0', U); });
      const sn = new Path2D(); sn.ellipse(0, -12 * U, 20 * U, 13 * U, 0, 0, 7); outlineFill(g, sn, '#c08060', U); g.fillStyle = '#120404'; [-1, 1].forEach(sd => { g.beginPath(); g.arc(sd * 8 * U, -12 * U, 3 * U, 0, 7); g.fill(); });
      const ring = new Path2D(); ring.arc(0, -2 * U, 7 * U, 0, Math.PI); g.strokeStyle = '#d8a83a'; g.lineWidth = 3 * U; g.stroke(ring); }
    else { [-1, 1].forEach(sd => { const e = new Path2D(); e.moveTo(sd * 12 * U, -78 * U); e.lineTo(sd * 22 * U, -104 * U); e.lineTo(sd * 24 * U, -74 * U); outlineFill(g, e, '#e8e0d0', U); });
      g.fillStyle = '#120404'; [-1, 1].forEach(sd => { g.beginPath(); g.arc(sd * 7 * U, 2 * U, 3 * U, 0, 7); g.fill(); }); g.fillStyle = '#4a3a2a'; g.fillRect(-4 * U, -92 * U, 8 * U, 40 * U); }
    g.fillStyle = '#ffdd00'; [-1, 1].forEach(sd => { g.beginPath(); g.arc(sd * 13 * U, kind ? -50 * U : -36 * U, 6 * U, 0, 7); g.fill(); g.fillStyle = '#c00000'; g.beginPath(); g.arc(sd * 13 * U, kind ? -50 * U : -36 * U, 3 * U, 0, 7); g.fill(); g.fillStyle = '#ffdd00'; });
    // 手臂（拿武器那隻）
    g.save(); g.translate(30 * U, 16 * U); g.rotate(armA || 0); const arm = new Path2D(); arm.rect(0, -8 * U, 60 * U, 16 * U); outlineFill(g, arm, kind ? '#e8e0d0' : '#8a4a2a', U); g.restore();
    g.restore();
  }
  function victim(g, f, x, y, U, rot, s) { // 受刑者：簡單的人形＋頭像
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s || 1, s || 1);
    const b = new Path2D(); b.moveTo(-18 * U, 0); b.lineTo(18 * U, 0); b.lineTo(14 * U, 60 * U); b.lineTo(-14 * U, 60 * U); b.closePath(); outlineFill(g, b, '#e8dccb', U);
    g.strokeStyle = '#e8dccb'; g.lineWidth = 8 * U; [[-14, 60, -18, 96], [14, 60, 18, 96], [-18, 6, -38, 40], [18, 6, 38, 40]].forEach(([a, b2, c, d]) => { g.beginPath(); g.moveTo(a * U, b2 * U); g.lineTo(c * U, d * U); g.stroke(); });
    drawFace(g, f, 0, -24 * U, 48 * U); g.restore();
  }
  E.hell = function (SFX, e) {
    const ui = this, vf = face(ui, e.seat), bf = e.by >= 0 ? face(ui, e.by) : null, kind = Math.floor(Math.random() * 4);
    const PUN = ['上刀山', '下油鍋', '拔舌地獄', '石磨地獄'][kind];
    let bl = [];
    const SND = () => { // 地獄：低鳴＋銅鑼＋尖銳的哀嚎
      SFX.tone(41, 7.5, { type: 'sawtooth', vol: 0.06, lp: 200, attack: 0.5 }); SFX.tone(43.6, 7.5, { type: 'sawtooth', vol: 0.05, lp: 200, attack: 0.5 });
      [0.1, 2.6].forEach(d => { SFX.tone(98, 3, { vol: 0.08, detune: -30, delay: d }); SFX.tone(103, 3, { vol: 0.06, delay: d }); SFX.noise(0.8, { f: 2000, type: 'bandpass', vol: 0.06, delay: d }); });
      if (bf) { SFX.noise(0.3, { f: 300, vol: 0.18, delay: 1.0 }); SFX.tone(120, 0.4, { glide: 40, vol: 0.15, delay: 1.0 }); } else { SFX.tone(160, 0.6, { type: 'sawtooth', vol: 0.07, lp: 900, delay: 0.6 }); SFX.tone(130, 0.9, { type: 'sawtooth', vol: 0.07, lp: 900, delay: 1.1 }); }
      SFX.tone(900, 1.2, { type: 'sawtooth', glide: 300, vol: 0.05, lp: 3000, delay: 1.6 });
      for (let i = 0; i < 6; i++) SFX.tone(1100 + Math.random() * 600, 0.6, { type: 'sawtooth', glide: 700 + Math.random() * 400, vol: 0.04, lp: 4000, delay: 3.2 + i * 0.6 });
      if (kind === 0) for (let i = 0; i < 8; i++) SFX.tone(2400 + Math.random() * 800, 0.3, { type: 'square', vol: 0.02, lp: 6000, delay: 3.0 + i * 0.4 });
      if (kind === 1) { SFX.noise(3.8, { f: 5000, type: 'highpass', vol: 0.07, delay: 3.2, attack: 0.2 }); SFX.noise(0.5, { f: 600, vol: 0.15, delay: 3.6 }); }
      if (kind === 2) for (let i = 0; i < 5; i++) SFX.tone(300, 0.5, { type: 'sawtooth', glide: 900, vol: 0.04, lp: 2000, delay: 3.4 + i * 0.7 });
      if (kind === 3) for (let i = 0; i < 6; i++) SFX.noise(0.6, { f: 160, vol: 0.14, delay: 3.2 + i * 0.6 });
    };
    return this.overlay(7600, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.56, U = Math.min(W, H) / 420;
      // ===== 第一段：打入地獄（0～2.8 秒）=====
      if (t < 2.8) {
        g.fillStyle = '#0a0202'; g.fillRect(0, 0, W, H);
        // 地獄裂縫／門
        const op = Math.min(1, t / 1.2), gx = cx, gy = H * 0.78;
        const gr = g.createRadialGradient(gx, gy, 5, gx, gy, 200 * U * op); gr.addColorStop(0, '#ffe080'); gr.addColorStop(0.3, '#ff4000'); gr.addColorStop(0.7, 'rgba(120,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(gx, gy, 200 * U * op, 50 * U * op, 0, 0, 7); g.fill();
        for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI, r = 200 * U * op; g.fillStyle = `rgba(255,${80 + k * 8},0,.5)`; g.beginPath(); g.moveTo(gx + Math.cos(a) * r * 0.8 - 12 * U, gy); g.lineTo(gx + Math.cos(a) * r * 0.8, gy - (40 + Math.sin(t * 12 + k * 2) * 30) * U); g.lineTo(gx + Math.cos(a) * r * 0.8 + 12 * U, gy); g.fill(); }
        let vx = cx, vy = H * 0.44, vr = 0, vs = 1;
        if (bf) { // 債主衝過來把他打進去
          const k1 = Math.min(1, t / 1.0); drawFace(g, bf, -100 * U + k1 * (cx - 60 * U + 100 * U), H * 0.44, 110 * U, k1 > 0.95 ? -0.4 : 0);
          if (t > 1.0) { const k2 = Math.min(1, (t - 1.0) / 1.2); vx = cx + k2 * 40 * U; vy = H * 0.44 + k2 * k2 * (gy - H * 0.44); vr = k2 * 6; vs = 1 - k2 * 0.85; if (t < 1.15) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, 0, W, H); } if (!bl.length) bl = burst(30, cx, H * 0.44, 1.0, 5); }
        } else { // 閻羅判官：烏紗帽、黑臉長鬚、紅袍，指著破產的人
          const jx = W * 0.28, jy = H * 0.5, s = U * 1.1, sh = t > 0.9 && t < 1.3 ? rnd(-4, 4) * U : 0;
          g.save(); g.translate(jx + sh, jy);
          const robe = new Path2D(); robe.moveTo(-70 * s, -30 * s); robe.lineTo(70 * s, -30 * s); robe.lineTo(95 * s, 200 * s); robe.lineTo(-95 * s, 200 * s); robe.closePath(); outlineFill(g, robe, '#a01010', s);
          const dr = new Path2D(); dr.rect(-30 * s, 0, 60 * s, 60 * s); outlineFill(g, dr, '#d8a83a', s);
          const hd = new Path2D(); hd.ellipse(0, -70 * s, 46 * s, 50 * s, 0, 0, 7); outlineFill(g, hd, '#2a2a30', s);
          const beard = new Path2D(); beard.moveTo(-34 * s, -50 * s); beard.quadraticCurveTo(0, 60 * s, 34 * s, -50 * s); outlineFill(g, beard, '#0a0a0a', s);
          const hat = new Path2D(); hat.rect(-50 * s, -150 * s, 100 * s, 50 * s); outlineFill(g, hat, '#141414', s);
          [-1, 1].forEach(sd => { const w = new Path2D(); w.ellipse(sd * 80 * s, -122 * s, 34 * s, 10 * s, 0, 0, 7); outlineFill(g, w, '#141414', s); });
          g.fillStyle = '#ffdd00'; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 17 * s, -78 * s, 10 * s, 6 * s, sd * -0.3, 0, 7); g.fill(); }); g.fillStyle = '#c00000'; [-1, 1].forEach(sd => { g.beginPath(); g.arc(sd * 17 * s, -78 * s, 4 * s, 0, 7); g.fill(); });
          const brow = new Path2D(); brow.moveTo(-34 * s, -98 * s); brow.lineTo(-6 * s, -86 * s); brow.moveTo(34 * s, -98 * s); brow.lineTo(6 * s, -86 * s); g.strokeStyle = '#d8d8d8'; g.lineWidth = 6 * s; g.stroke(brow);
          // 指向的手
          const pa = Math.min(1, t / 0.9); g.save(); g.translate(60 * s, -10 * s); g.rotate(-0.25 - pa * 0.15); const arm = new Path2D(); arm.rect(0, -14 * s, 150 * s * pa, 28 * s); outlineFill(g, arm, '#a01010', s); const hand = new Path2D(); hand.ellipse(150 * s * pa + 12 * s, 0, 16 * s, 12 * s, 0, 0, 7); outlineFill(g, hand, '#2a2a30', s); const fg = new Path2D(); fg.rect(150 * s * pa + 22 * s, -4 * s, 34 * s, 8 * s); outlineFill(g, fg, '#2a2a30', s); g.restore();
          g.restore();
          if (t > 0.9) { font(g, 40 * U); g.textAlign = 'center'; g.fillStyle = '#ffdd00'; g.strokeStyle = '#000'; g.lineWidth = 7 * U; g.strokeText('打入地獄！', W * 0.3, H * 0.13); g.fillText('打入地獄！', W * 0.3, H * 0.13); }
          vx = W * 0.68; if (t > 1.3) { const k2 = Math.min(1, (t - 1.3) / 1.2); vy = H * 0.44 + k2 * k2 * (gy - H * 0.44); vr = k2 * 4; vs = 1 - k2 * 0.85; } if (t > 1.3 && !bl.length) bl = burst(14, vx, H * 0.44, 1.3, 3);
          if (t > 0.9 && t < 1.3) { g.strokeStyle = 'rgba(255,220,0,.8)'; g.lineWidth = 6 * U; g.beginPath(); g.moveTo(W * 0.48, H * 0.4); g.lineTo(vx - 40 * U, vy); g.stroke(); }
        }
        drawFace(g, vf, vx, vy, 110 * U * vs, vr);
        blood(g, bl, t, U);
        title(g, W, H, dpr, bf ? '欠債不還，打入十八層地獄' : '', '#ff6a4a', H * 0.92, 22);
        if (t > 2.5) { g.fillStyle = `rgba(0,0,0,${(t - 2.5) * 3.3})`; g.fillRect(0, 0, W, H); }
        return;
      }
      // ===== 第二段：十殿閻羅壁畫風的刑罰（2.8～7.6 秒）=====
      const k = t - 2.8;
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a0404'); bg.addColorStop(0.6, '#5a0808'); bg.addColorStop(1, '#1a0202'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,90,20,.12)'; for (let i = 0; i < 18; i++) { const x = (i / 17) * W; g.beginPath(); g.moveTo(x - 30 * U, H); g.quadraticCurveTo(x + Math.sin(t * 3 + i) * 20 * U, H - (120 + Math.sin(t * 4 + i * 2) * 50) * U, x + 30 * U, H); g.fill(); }
      g.strokeStyle = '#d8a83a'; g.lineWidth = 6 * U; g.strokeRect(14 * U, 14 * U, W - 28 * U, H - 28 * U); g.lineWidth = 2 * U; g.strokeRect(24 * U, 24 * U, W - 48 * U, H - 48 * U);
      if (kind === 0) { // 上刀山
        const base = H * 0.86; const m = new Path2D(); m.moveTo(cx - 200 * U, base); m.lineTo(cx, H * 0.3); m.lineTo(cx + 200 * U, base); m.closePath(); outlineFill(g, m, '#3a2a2a', U);
        for (let i = 0; i < 40; i++) { const r = (i * 0.618) % 1, side = i % 2 ? 1 : -1, hh = r * (base - H * 0.3), x = cx + side * (1 - hh / (base - H * 0.3)) * 190 * U * ((i * 0.37) % 1), y = base - hh; const bl2 = new Path2D(); bl2.moveTo(x - 5 * U, y); bl2.lineTo(x, y - 34 * U); bl2.lineTo(x + 5 * U, y); outlineFill(g, bl2, '#d8dce8', U * 0.5); }
        const up = Math.min(1, k / 2.5), vy = base - 80 * U - up * (base - H * 0.42 - 80 * U);
        victim(g, vf, cx - 30 * U + up * 30 * U, vy, U, 0.3, 0.9); demon(g, cx - 160 * U, vy + 40 * U, U * 0.9, 0, -0.6 + Math.sin(t * 6) * 0.2);
        if (!bl.length || bl[0].t < 2.8) bl = burst(40, cx - 10 * U, vy + 30 * U, 3.2, 4).concat(burst(40, cx, H * 0.5, 4.8, 4));
      } else if (kind === 1) { // 下油鍋
        const px = cx, py = H * 0.68;
        for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#ffb000' : '#ff4000'; g.beginPath(); g.moveTo(px - 140 * U + i * 35 * U, H * 0.9); g.quadraticCurveTo(px - 125 * U + i * 35 * U, H * 0.9 - (60 + Math.sin(t * 9 + i) * 25) * U, px - 110 * U + i * 35 * U, H * 0.9); g.fill(); }
        const pot = new Path2D(); pot.moveTo(px - 170 * U, py - 40 * U); pot.lineTo(px + 170 * U, py - 40 * U); pot.quadraticCurveTo(px + 160 * U, py + 100 * U, px, py + 110 * U); pot.quadraticCurveTo(px - 160 * U, py + 100 * U, px - 170 * U, py - 40 * U); outlineFill(g, pot, '#2a2420', U);
        g.fillStyle = '#d89a20'; g.beginPath(); g.ellipse(px, py - 40 * U, 168 * U, 26 * U, 0, 0, 7); g.fill();
        for (let i = 0; i < 16; i++) { const bx = px + Math.sin(i * 7.1) * 140 * U, ph = (t * 2 + i * 0.3) % 1; g.fillStyle = `rgba(255,230,120,${1 - ph})`; g.beginPath(); g.arc(bx, py - 44 * U - ph * 20 * U, (4 + ph * 8) * U, 0, 7); g.fill(); }
        const drop = Math.min(1, k / 1.4), vx = cx + 160 * U - drop * 150 * U, vy = H * 0.3 + drop * drop * (py - 60 * U - H * 0.3);
        if (k < 1.6) victim(g, vf, vx, vy, U, drop * 3, 0.9); else { drawFace(g, vf, cx + Math.sin(t * 8) * 30 * U, py - 50 * U + Math.sin(t * 13) * 6 * U, 50 * U, Math.sin(t * 5)); g.strokeStyle = '#e8dccb'; g.lineWidth = 7 * U; [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(cx + sd * 40 * U, py - 40 * U); g.lineTo(cx + sd * (60 + Math.sin(t * 15) * 10) * U, py - 110 * U); g.stroke(); }); }
        demon(g, cx + 250 * U, H * 0.36, U * 0.9, 1, -2.4 + Math.min(1, k) * 1.2);
        if (!bl.length || bl[0].t < 2.8) bl = burst(36, cx, py - 50 * U, 4.2, 5);
      } else if (kind === 2) { // 拔舌地獄
        const vx = cx - 90 * U, vy = H * 0.5; victim(g, vf, vx, vy, U, -0.15, 1.1);
        const pull = Math.min(1, k / 2.6) * 200 * U + Math.sin(t * 20) * 4 * U;
        g.fillStyle = '#d02040'; g.strokeStyle = '#120404'; g.lineWidth = 3 * U; g.beginPath(); g.moveTo(vx + 6 * U, vy - 12 * U); g.quadraticCurveTo(vx + 40 * U + pull * 0.5, vy - 30 * U - Math.sin(t * 6) * 10 * U, vx + 20 * U + pull, vy - 26 * U); g.lineTo(vx + 20 * U + pull, vy - 6 * U); g.quadraticCurveTo(vx + 40 * U + pull * 0.5, vy - 10 * U, vx + 6 * U, vy - 2 * U); g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = '#8a8aa0'; g.lineWidth = 8 * U; g.beginPath(); g.moveTo(vx + 20 * U + pull, vy - 26 * U); g.lineTo(vx + 70 * U + pull, vy - 40 * U); g.moveTo(vx + 20 * U + pull, vy - 6 * U); g.lineTo(vx + 70 * U + pull, vy + 6 * U); g.stroke();
        demon(g, vx + 120 * U + pull, vy - 10 * U, U * 0.95, 0, Math.PI);
        if (!bl.length || bl[0].t < 2.8) bl = burst(50, vx + 20 * U, vy - 16 * U, 3.4, 3).concat(burst(30, vx + 20 * U, vy - 16 * U, 5.0, 4));
      } else { // 石磨地獄
        const mx = cx + 30 * U, my = H * 0.6, rot = t * 2.2;
        const st = new Path2D(); st.ellipse(mx, my + 40 * U, 150 * U, 40 * U, 0, 0, 7); outlineFill(g, st, '#6a6460', U);
        g.save(); g.translate(mx, my); const top = new Path2D(); top.rect(-130 * U, -50 * U, 260 * U, 80 * U); outlineFill(g, top, '#8a847c', U); g.strokeStyle = '#5a544c'; g.lineWidth = 3 * U; for (let i = 0; i < 8; i++) { const x = ((i * 40 + rot * 60) % 260) - 130; g.beginPath(); g.moveTo(x * U, -50 * U); g.lineTo(x * U, 30 * U); g.stroke(); } g.restore();
        g.strokeStyle = '#4a3a2a'; g.lineWidth = 10 * U; g.beginPath(); g.moveTo(mx + Math.cos(rot) * 130 * U, my - 10 * U); g.lineTo(mx + Math.cos(rot) * 210 * U, my - 50 * U); g.stroke();
        demon(g, mx + Math.cos(rot) * 260 * U, my - 150 * U, U * 0.8, 1, 0.6);
        const sink = Math.min(1, k / 2.4); if (sink < 1) { g.save(); g.beginPath(); g.rect(0, 0, W, my - 50 * U); g.clip(); victim(g, vf, mx - 20 * U, my - 120 * U + sink * 100 * U, U, 0, 0.9); g.restore(); }
        g.fillStyle = '#8a0000'; for (let i = 0; i < 10; i++) { const ph = (t * 0.6 + i * 0.1) % 1; g.beginPath(); g.ellipse(mx - 140 * U + i * 30 * U, my + 30 * U + ph * 90 * U, 5 * U, (8 + ph * 18) * U, 0, 0, 7); g.fill(); }
        g.fillStyle = '#6a0000'; g.beginPath(); g.ellipse(mx, H * 0.9, 190 * U * Math.min(1, k / 3), 22 * U, 0, 0, 7); g.fill();
        if (!bl.length || bl[0].t < 2.8) bl = burst(40, mx - 20 * U, my - 50 * U, 3.6, 4);
      }
      blood(g, bl, t, U);
      g.fillStyle = 'rgba(120,0,0,.18)'; g.fillRect(0, 0, W, H);
      title(g, W, H, dpr, `十八層地獄・${PUN}`, '#ffdd60', H * 0.1, 34);
      if (k < 0.3) { g.fillStyle = `rgba(0,0,0,${1 - k / 0.3})`; g.fillRect(0, 0, W, H); }
    }, SND);
  };

  // 魔法學院破產：看債主是誰決定死法；沒有債主就被巨大的魔法書吸進去
  E.magicDeath = function (SFX, e) {
    const ui = this, vf = face(ui, e.seat), bf = e.by >= 0 ? face(ui, e.by) : null, kind = bf ? (bf.i >= 0 ? bf.i : 0) : -1;
    const NAME = ['咒語反彈大爆炸', '被大巨蛇一口吞下', '被貓頭鷹群叼走', '被小火龍烤焦', '被獨角獸頂飛', '被鳳凰之火吞噬', '被人馬一箭射穿', '被狼人撲倒', ][kind] || '被巨大的魔法書吸進去';
    const parts = Array.from({ length: 80 }, () => ({ a: rnd(0, 6.283), v: rnd(0.4, 1.4), c: ['#ffd23a', '#ff6a2a', '#fff', '#c8a0ff'][Math.floor(Math.random() * 4)] }));
    let bl = [];
    const snd = () => {
      SFX.tone(60, 4.5, { type: 'sawtooth', vol: 0.05, lp: 300, attack: 0.3 });
      if (kind === 0 || kind === -1) { for (let i = 0; i < 10; i++) SFX.tone(600 + i * 120, 0.2, { type: 'triangle', vol: 0.04, delay: 0.3 + i * 0.08 }); }
      if (kind === 0 || kind === 3 || kind === 5) { SFX.noise(1.4, { f: 700, vol: 0.2, delay: 1.4 }); SFX.tone(90, 1, { glide: 30, vol: 0.18, delay: 1.4 }); }
      if (kind === 1) { SFX.noise(0.5, { f: 3000, type: 'highpass', vol: 0.06, delay: 0.4 }); SFX.tone(70, 0.6, { glide: 35, vol: 0.2, delay: 1.5 }); SFX.noise(0.4, { f: 300, vol: 0.15, delay: 1.6 }); }
      if (kind === 2) for (let i = 0; i < 14; i++) SFX.tone(400, 0.25, { glide: 330, vol: 0.04, delay: 0.3 + i * 0.18 });
      if (kind === 4) { SFX.tone(1200, 0.6, { glide: 2400, vol: 0.05, delay: 0.8 }); SFX.noise(0.3, { f: 500, vol: 0.18, delay: 1.5 }); }
      if (kind === 6) { SFX.noise(0.25, { f: 4000, type: 'bandpass', vol: 0.1, delay: 1.1 }); SFX.noise(0.15, { f: 600, vol: 0.2, delay: 1.45 }); }
      if (kind === 7) { SFX.tone(300, 1.6, { type: 'sawtooth', glide: 700, vol: 0.05, lp: 1800, delay: 0.2 }); SFX.noise(0.5, { f: 900, vol: 0.18, delay: 1.4 }); }
      SFX.tone(700, 0.9, { type: 'sawtooth', glide: 200, vol: 0.05, lp: 2500, delay: 1.6 });
    };
    return this.overlay(4800, (g, W, H, dpr, t) => {
      const cx = W / 2, cy = H * 0.5, U = Math.min(W, H) / 400, hit = 1.4;
      g.save(); if (t > hit && t < hit + 0.5) shake(g, 12 * dpr);
      const gr = g.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W, H)); gr.addColorStop(0, '#2a2050'); gr.addColorStop(1, '#06040e'); g.fillStyle = gr; g.fillRect(-30, -30, W + 60, H + 60);
      let vx = cx + 80 * U, vy = cy, vs = 1, vr = 0, show = true;
      const ax = cx - 150 * U, k = Math.min(1, t / hit);
      if (kind === -1) { // 魔法書
        const open = Math.min(1, t / 0.8); g.save(); g.translate(cx, cy + 90 * U);
        [-1, 1].forEach(sd => { g.save(); g.scale(sd, 1); g.transform(1, 0, -0.2 * open, 1, 0, 0); g.fillStyle = '#4a2a14'; g.fillRect(0, -10 * U, 150 * U * open, 110 * U); g.fillStyle = '#f0e2c0'; g.fillRect(6 * U, -4 * U, 138 * U * open, 98 * U); g.restore(); }); g.restore();
        const sw = Math.max(0, t - 0.6); for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283 + t * 4, r = (200 - (sw * 120 + i * 9) % 200) * U; g.fillStyle = `rgba(200,160,255,${r / (200 * U)})`; g.fillRect(cx + Math.cos(a) * r, cy + 90 * U + Math.sin(a) * r * 0.5 - 40 * U, 3 * dpr, 3 * dpr); }
        if (t > 1.0) { const s2 = Math.min(1, (t - 1.0) / 1.4); vx = cx + (80 - 80 * s2) * U; vy = cy + s2 * 100 * U; vs = 1 - s2; vr = s2 * 10; }
      } else {
        const ex = ax + k * (kind === 6 || kind === 0 || kind === 3 || kind === 5 ? 0 : 200 * U);
        drawFace(g, bf, ex, cy, 120 * U, kind === 7 && t > 1 ? -0.5 : 0);
        if (kind === 0 && t < hit) { g.strokeStyle = '#c8a0ff'; g.lineWidth = 6 * dpr; g.beginPath(); g.moveTo(ax + 60 * U, cy); g.lineTo(ax + 60 * U + (vx - ax - 60 * U) * k, cy + Math.sin(t * 40) * 10 * U); g.stroke(); }
        if (kind === 3 || kind === 5) { if (t > 0.5) for (let i = 0; i < 60; i++) { const ph = (t * 1.5 + i / 60) % 1, x = ax + 60 * U + ph * (vx - ax), y = cy + Math.sin(i * 3 + t * 9) * 30 * U * ph; const r = (8 + ph * 26) * U; const f2 = g.createRadialGradient(x, y, 0, x, y, r); f2.addColorStop(0, 'rgba(255,240,160,.9)'); f2.addColorStop(1, kind === 5 ? 'rgba(255,120,0,0)' : 'rgba(255,40,0,0)'); g.fillStyle = f2; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }
        if (kind === 6) { const ak = Math.min(1, Math.max(0, (t - 1.0) / 0.4)); g.strokeStyle = '#8a5a2a'; g.lineWidth = 5 * dpr; const x0 = ax + 60 * U + ak * (vx - ax - 80 * U); g.beginPath(); g.moveTo(x0, cy); g.lineTo(x0 + 70 * U, cy); g.stroke(); g.fillStyle = '#d8d8e0'; g.beginPath(); g.moveTo(x0 + 70 * U, cy - 8 * U); g.lineTo(x0 + 92 * U, cy); g.lineTo(x0 + 70 * U, cy + 8 * U); g.fill(); }
        if (kind === 2) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + t * 3, r = Math.max(30, 220 - t * 140) * U; emoji(g, '🦉', vx + Math.cos(a) * r, vy + Math.sin(a) * r * 0.6 - Math.max(0, t - 1.6) * 260 * U, 44 * U, Math.sin(t * 20 + i) * 0.3); }
        if (t > hit) { const h = t - hit;
          if (kind === 1) { show = false; g.fillStyle = '#2e6a38'; g.beginPath(); g.ellipse(vx - 40 * U, cy + 30 * U, 90 * U - h * 10 * U, 60 * U, 0, 0, 7); g.fill(); }
          else if (kind === 2) { vy = cy - h * 260 * U; vr = Math.sin(h * 10) * 0.4; }
          else if (kind === 4 || kind === 7) { vx = cx + 80 * U + h * 300 * U; vy = cy - h * 260 * U + h * h * 260 * U; vr = h * 12; }
          else if (kind === 6) { vr = 1.4; vy = cy + Math.min(1, h) * 80 * U; }
          else { vs = Math.max(0, 1 - h * 1.5); vr = h * 4; parts.forEach(p => { const r = h * p.v * 300 * U; g.fillStyle = p.c; g.fillRect(vx + Math.cos(p.a) * r, vy + Math.sin(p.a) * r, 5 * dpr, 5 * dpr); }); if (kind === 3 || kind === 5) { g.fillStyle = `rgba(30,20,10,${Math.min(0.8, h)})`; } }
          if (!bl.length && kind !== 2) bl = burst(kind === 6 || kind === 7 || kind === 4 ? 40 : 20, vx, vy, hit, 4);
        }
      }
      if (show && vs > 0.02) drawFace(g, vf, vx, vy, 110 * U * vs, vr);
      blood(g, bl, t, U);
      g.restore();
      title(g, W, H, dpr, '💀 破產！' + NAME, '#ffd8a0', H * 0.12, 30);
      if (t > 4.2) { g.fillStyle = `rgba(0,0,0,${(t - 4.2) * 1.6})`; g.fillRect(0, 0, W, H); }
    }, snd);
  };

  root.MONO_EGGS = E;
})(typeof window !== 'undefined' ? window : globalThis);
