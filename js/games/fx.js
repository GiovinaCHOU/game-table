// 牌桌遊戲共用：音效、背景音樂、勝利彩炮／輸家砸雞蛋（全部用 Web Audio 和 Canvas 即時產生，不需要下載任何檔案）
(function (root) {
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  let ctx = null, master = null, sfxBus = null, bgmBus = null;
  const st = { sfx: LS.get('gfx-sfx', '1') === '1', bgm: LS.get('gfx-bgm', '1') === '1' };

  function ac() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ctx = new C(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = st.sfx ? 0.8 : 0; sfxBus.connect(master);
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0; bgmBus.connect(master);
    return ctx;
  }
  // iOS 要使用者點過畫面才能出聲
  // 切到別的 App 太久回來，手機常把音效引擎卡死（狀態 interrupted，或顯示 running 卻沒聲音）：回來後第一次點畫面就整個重建
  let hiddenAt = 0, stale = false;
  function rebuild() { const old = ctx, mode = BGM.mode; try { old && old.close(); } catch (e) {} ctx = null; noiseBuf = null; if (BGM.timer) { clearInterval(BGM.timer); BGM.timer = null; } BGM.mode = 'off'; ac(); if (mode !== 'off') setBgm(mode); }
  const unlock = () => { if (ctx && (stale || ctx.state === 'closed' || ctx.state === 'interrupted')) { stale = false; rebuild(); } const c = ac(); if (c && c.state !== 'running') c.resume(); if (c) { const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } };
  ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { passive: true }));
  const vis = () => { if (document.hidden) { hiddenAt = Date.now(); if (ctx) ctx.suspend().catch(() => {}); } else { if (hiddenAt && Date.now() - hiddenAt > 15000) stale = true; if (ctx) ctx.resume().catch(() => {}); } };
  document.addEventListener('visibilitychange', vis); window.addEventListener('pageshow', (e) => { if (e.persisted) stale = true; if (ctx) ctx.resume().catch(() => {}); });

  // ---------- 基本音色 ----------
  let noiseBuf = null;
  function noise() { const c = ac(); if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const s = c.createBufferSource(); s.buffer = noiseBuf; return s; }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function tone(freq, t, dur, type, vol, bus, glideTo) {
    const c = ac(), o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    env(g, t, 0.008, vol || 0.2, dur); o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function hit(t, f, q, dur, vol, type) {
    const c = ac(), s = noise(), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = type || 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    env(g, t, 0.002, vol, dur); s.connect(bp); bp.connect(g); g.connect(sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const ok = () => st.sfx && ac() && ctx.state !== 'closed';

  // ---------- 音效 ----------
  const S = {
    clack() { if (!ok()) return; const t = ctx.currentTime; hit(t, 2600, 6, 0.06, 0.6); hit(t + 0.012, 1400, 4, 0.05, 0.35); tone(1900, t, 0.04, 'triangle', 0.08); },
    tiles() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 4; i++) { hit(t + i * 0.035, 2200 + Math.random() * 900, 6, 0.05, 0.4); } },
    card() { if (!ok()) return; const t = ctx.currentTime; hit(t, 4200, 1.2, 0.09, 0.28, 'highpass'); hit(t + 0.03, 2400, 2, 0.05, 0.18); },
    flip() { if (!ok()) return; const t = ctx.currentTime; hit(t, 3000, 1.5, 0.07, 0.3); tone(700, t, 0.05, 'triangle', 0.05, null, 1200); },
    pass() { if (!ok()) return; const t = ctx.currentTime; tone(420, t, 0.12, 'sine', 0.08, null, 300); },
    draw() { if (!ok()) return; const t = ctx.currentTime; hit(t, 1800, 3, 0.05, 0.3); },
    chi() { if (!ok()) return; const t = ctx.currentTime; S.tiles(); tone(660, t + 0.05, 0.16, 'triangle', 0.16); tone(880, t + 0.15, 0.22, 'triangle', 0.16); },
    pong() { if (!ok()) return; const t = ctx.currentTime; S.tiles(); tone(523, t + 0.04, 0.14, 'square', 0.07); tone(784, t + 0.12, 0.26, 'square', 0.08); },
    kong() { if (!ok()) return; const t = ctx.currentTime; S.tiles(); [392, 523, 659, 784].forEach((f, i) => tone(f, t + 0.05 + i * 0.07, 0.3, 'sawtooth', 0.06)); tone(80, t, 0.5, 'sine', 0.35, null, 50); },
    flower() { if (!ok()) return; const t = ctx.currentTime; [1318, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.06, 0.35, 'sine', 0.08)); },
    hu() { if (!ok()) return; const t = ctx.currentTime; tone(110, t, 1.6, 'sine', 0.45, null, 70); hit(t, 300, 0.8, 1.2, 0.35, 'lowpass');
      [523, 659, 784, 1046, 1318].forEach((f, i) => { tone(f, t + 0.1 + i * 0.08, 0.6, 'triangle', 0.15); tone(f * 2, t + 0.1 + i * 0.08, 0.4, 'sine', 0.05); }); },
    slap() { if (!ok()) return; const t = ctx.currentTime; hit(t, 900, 0.7, 0.12, 0.9, 'lowpass'); hit(t, 3000, 1, 0.05, 0.5); tone(140, t, 0.12, 'sine', 0.4, null, 70); },
    buzz() { if (!ok()) return; const t = ctx.currentTime; tone(150, t, 0.35, 'sawtooth', 0.12, null, 110); },
    ding() { if (!ok()) return; const t = ctx.currentTime; tone(1318, t, 0.5, 'sine', 0.15); tone(1976, t + 0.08, 0.6, 'sine', 0.1); },
    shake() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 7; i++) hit(t + i * 0.045, 1500 + Math.random() * 1500, 3, 0.04, 0.35); },
    drum() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 6; i++) { tone(90, t + i * 0.09, 0.12, 'sine', 0.3 + i * 0.05, null, 55); hit(t + i * 0.09, 400, 1, 0.08, 0.2, 'lowpass'); } },
    cheer() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 26; i++) hit(t + Math.random() * 0.9, 1200 + Math.random() * 2500, 3, 0.12, 0.12); },
    pop() { if (!ok()) return; const t = ctx.currentTime; hit(t, 1800, 1, 0.08, 0.7); tone(320, t, 0.08, 'sine', 0.2, null, 900); },
    win() { if (!ok()) return; const t = ctx.currentTime; [[523, 0], [659, 0.12], [784, 0.24], [1046, 0.36], [784, 0.52], [1046, 0.62]].forEach(([f, d]) => { tone(f, t + d, d > 0.5 ? 0.7 : 0.18, 'square', 0.07); tone(f / 2, t + d, 0.2, 'triangle', 0.08); }); S.cheer(); },
    lose() { if (!ok()) return; const t = ctx.currentTime; [[392, 0, 0.35], [370, 0.4, 0.35], [349, 0.8, 0.35], [330, 1.2, 1.1]].forEach(([f, d, l]) => { const o = tone(f, t + d, l, 'sawtooth', 0.1, null, d > 1 ? f * 0.85 : null); if (d > 1) { const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 7; lg.gain.value = 9; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t + d); lfo.stop(t + d + l); } }); },
    splat() { if (!ok()) return; const t = ctx.currentTime; hit(t, 500, 0.6, 0.25, 0.9, 'lowpass'); hit(t + 0.02, 1800, 2, 0.12, 0.3); tone(180, t, 0.15, 'sine', 0.3, null, 60); },
    myturn() { if (!ok()) return; const t = ctx.currentTime; tone(988, t, 0.35, 'sine', 0.2); tone(1319, t + 0.14, 0.55, 'sine', 0.2); tone(1976, t + 0.14, 0.4, 'triangle', 0.05); },
    tick() { if (!ok()) return; const t = ctx.currentTime; tone(1500, t, 0.03, 'square', 0.04); }
  };

  // ---------- 背景音樂（即時合成，很省電；有人聽牌／快結束時變緊張） ----------
  const BGM = { mode: 'off', timer: null, step: 0, next: 0 };
  const CALM = { bpm: 84, prog: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], scale: [57, 60, 62, 64, 67, 69, 72, 74, 76] };
  const TENSE = { bpm: 128, prog: [[57, 60, 64], [57, 60, 64], [53, 56, 60], [52, 56, 59]], scale: [57, 59, 60, 62, 64, 65, 68, 69, 72] };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function bgmTick() {
    if (!ctx || BGM.mode === 'off') return;
    const P = BGM.mode === 'tense' ? TENSE : CALM, spb = 60 / P.bpm / 2;
    while (BGM.next < ctx.currentTime + 0.25) {
      const t = Math.max(BGM.next, ctx.currentTime), i = BGM.step, bar = Math.floor(i / 8) % 4, ch = P.prog[bar];
      if (i % 8 === 0) ch.forEach(m => tone(mtof(m - 12), t, spb * 7.5, 'triangle', 0.045, bgmBus)); // 和弦墊底
      if (i % 2 === 0 || BGM.mode === 'tense') { const m = (i * 7 + bar * 3) % 5 === 0 ? ch[(i >> 1) % 3] + 12 : P.scale[(i * 5 + bar * 2) % P.scale.length]; tone(mtof(m), t, spb * 0.9, 'sine', BGM.mode === 'tense' ? 0.05 : 0.06, bgmBus); }
      if (BGM.mode === 'tense') { // 心跳低音＋碎拍
        if (i % 4 === 0 || i % 4 === 1) tone(i % 4 === 0 ? 62 : 55, t, 0.16, 'sine', 0.22, bgmBus, 40);
        if (i % 2 === 1) { const s = noise(), hp = ctx.createBiquadFilter(), g = ctx.createGain(); hp.type = 'highpass'; hp.frequency.value = 7000; env(g, t, 0.001, 0.05, 0.04); s.connect(hp); hp.connect(g); g.connect(bgmBus); s.start(t); s.stop(t + 0.06); }
      } else if (i % 8 === 4) tone(mtof(ch[0] - 24), t, spb * 3, 'sine', 0.08, bgmBus);
      BGM.step++; BGM.next = t + spb;
    }
  }
  function setBgm(mode) {
    if (!st.bgm) mode = 'off';
    if (mode === BGM.mode) return; const c = ac(); if (!c) return;
    BGM.mode = mode; const now = c.currentTime;
    bgmBus.gain.cancelScheduledValues(now); bgmBus.gain.setTargetAtTime(mode === 'off' ? 0 : 0.55, now, 0.4);
    if (mode !== 'off' && !BGM.timer) { BGM.next = c.currentTime + 0.1; BGM.timer = setInterval(bgmTick, 100); }
    if (mode === 'off' && BGM.timer) { const tm = BGM.timer; BGM.timer = null; setTimeout(() => { if (BGM.mode === 'off') clearInterval(tm); else BGM.timer = tm; }, 1500); }
  }

  // ---------- 全螢幕：勝利彩炮／輸家砸雞蛋 ----------
  const MOCK = ['你超遜 🤡', '菜就多練 🥚', '回家練練再來', '輸到脫褲 👖', '手氣跟你的人生一樣 🫠', '這把我幫你哭 😭', '下一把再加油（才怪）'];
  function overlay(kind, title, sub) {
    document.querySelectorAll('.gfx-ov').forEach(e => e.remove());
    const d = document.createElement('div'); d.className = 'gfx-ov ' + kind;
    d.innerHTML = `<canvas></canvas><div class="gfx-msg"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}<em>點一下關閉</em></div>`;
    document.body.appendChild(d);
    const cv = d.querySelector('canvas'), g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr; g.scale(dpr, dpr);
    const w = innerWidth, h = innerHeight, parts = [], splats = [];
    let alive = true; const close = () => { if (!alive) return; alive = false; d.classList.add('out'); setTimeout(() => d.remove(), 400); };
    d.onclick = close; setTimeout(close, kind === 'win' ? 4200 : 3800);
    const COLS = ['#ff4fd8', '#3ef0ff', '#ffd36e', '#7cff6b', '#ff6b5b', '#b18cff', '#fff'];
    const burst = (x, y, n) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 7; parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, r: 3 + Math.random() * 4, c: COLS[i % COLS.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 1, shape: i % 3 }); } };
    const eggs = [];
    if (kind === 'win') { S.win(); [[w * 0.15, h * 0.85], [w * 0.85, h * 0.85], [w * 0.5, h * 0.9]].forEach(([x, y], k) => setTimeout(() => { if (alive) { burst(x, y, 70); S.pop(); } }, k * 380)); setTimeout(() => alive && burst(w * 0.5, h * 0.35, 90), 1300); }
    else { S.lose(); for (let k = 0; k < 4; k++) eggs.push({ x: w * (0.2 + Math.random() * 0.6), y: -60 - k * 180, vy: 9 + Math.random() * 3, rot: Math.random(), tx: w * (0.15 + Math.random() * 0.7), ty: h * (0.25 + Math.random() * 0.5) }); }
    const egg = (x, y, r) => { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = '#fff6e0'; g.beginPath(); g.ellipse(0, 0, 22, 28, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(6, 6, 12, 18, 0, 0, Math.PI * 2); g.fill(); g.restore(); };
    const splat = (s) => { g.save(); g.translate(s.x, s.y); g.globalAlpha = Math.min(1, s.a); g.fillStyle = 'rgba(255,255,240,.92)'; g.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, rr = s.r * (0.75 + 0.35 * Math.sin(i * 2.7 + s.seed)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill();
      for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(Math.cos(i * 1.3 + s.seed) * s.r * 1.3, Math.sin(i * 1.3 + s.seed) * s.r * 1.3 + s.drip * (i % 2), 6, 6 + s.drip * 0.4 * (i % 2), 0, 0, Math.PI * 2); g.fill(); }
      const yg = g.createRadialGradient(-6, -6, 2, 0, 0, s.r * 0.5); yg.addColorStop(0, '#ffe680'); yg.addColorStop(1, '#ffb300'); g.fillStyle = yg; g.beginPath(); g.ellipse(0, 0, s.r * 0.42, s.r * 0.38, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-s.r * 0.12, -s.r * 0.14, s.r * 0.1, s.r * 0.07, -0.5, 0, Math.PI * 2); g.fill(); g.restore(); };
    const loop = () => {
      if (!alive && d.classList.contains('out')) return;
      g.clearRect(0, 0, w, h);
      splats.forEach(s => { s.drip = Math.min(40, s.drip + 0.25); splat(s); });
      eggs.forEach(e => { if (e.done) return; e.y += e.vy; e.vy += 0.5; e.x += (e.tx - e.x) * 0.04; e.rot += 0.15; egg(e.x, e.y, e.rot); if (e.y >= e.ty) { e.done = true; S.splat(); splats.push({ x: e.x, y: e.ty, r: 46 + Math.random() * 22, seed: Math.random() * 9, drip: 0, a: 1 }); d.classList.add('shake'); setTimeout(() => d.classList.remove('shake'), 260); } });
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.99; p.rot += p.vr; p.life -= 0.006; if (p.life <= 0 || p.y > h + 20) { parts.splice(i, 1); continue; }
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, p.life * 2); g.fillStyle = p.c; if (p.shape === 0) g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else if (p.shape === 1) { g.beginPath(); g.arc(0, 0, p.r * 0.7, 0, 7); g.fill(); } else { g.beginPath(); g.moveTo(0, -p.r); g.lineTo(p.r, p.r); g.lineTo(-p.r, p.r); g.fill(); } g.restore(); }
      requestAnimationFrame(loop);
    };
    loop();
  }
  const GFX = {
    S, setBgm, get on() { return st.sfx; }, get music() { return st.bgm; },
    toggleSfx() { st.sfx = !st.sfx; LS.set('gfx-sfx', st.sfx ? '1' : '0'); if (ac()) sfxBus.gain.value = st.sfx ? 0.8 : 0; return st.sfx; },
    toggleBgm() { st.bgm = !st.bgm; LS.set('gfx-bgm', st.bgm ? '1' : '0'); setBgm(st.bgm ? (BGM.want || 'off') : 'off'); return st.bgm; },
    win(title, sub) { overlay('win', title || '🎉 你贏了！', sub); },
    lose(title, sub) { overlay('lose', title || MOCK[Math.floor(Math.random() * MOCK.length)], sub); },
    mock() { return MOCK[Math.floor(Math.random() * MOCK.length)]; },
    want(mode) { BGM.want = mode; setBgm(mode); },

    // 每次收到畫面更新時呼叫：比較前後兩個畫面，自動播對應音效／動畫
    onView(id, p, v) {
      const H = HOOKS[id]; this._key = this._key || {};
      if (!H) { this.want('off'); return; }
      try { H(p, v, this); } catch (e) { console.error(e); }
    }
  };
  // 每個結果只觸發一次
  const once = (k) => { GFX._done = GFX._done || {}; if (GFX._done[k]) return false; GFX._done[k] = 1; return true; };
  const meldN = (v) => v.players ? v.players.reduce((a, q) => a + q.melds.length, 0) : 0;
  const flowerN = (v) => v.players ? v.players.reduce((a, q) => a + q.flowers.length, 0) : 0;
  const HOOKS = {
    mahjong(p, v, G) {
      G.want(v.phase === 'over' || v.phase === 'end' ? 'off' : (v.tense || v.wall <= 16) ? 'tense' : 'calm');
      if (!p) return;
      const rv = (x) => x.players ? x.players.reduce((a, q) => a + q.river.length, 0) : 0;
      if (rv(v) > rv(p)) S.clack();
      if (meldN(v) > meldN(p)) { const all = [].concat(...v.players.map(q => q.melds)), pr = [].concat(...p.players.map(q => q.melds)); const nm = all.find(m => !pr.some(o => o.t === m.t && o.k === m.k && o.tiles.length === m.tiles.length)) || all[all.length - 1]; (nm && nm.k === 'chi' ? S.chi : nm && (nm.k === 'kong' || nm.k === 'an') ? S.kong : S.pong)(); }
      else if (p.players && v.players.some((q, i) => p.players[i] && q.melds.length === p.players[i].melds.length && q.melds.some((m, j) => p.players[i].melds[j] && m.tiles.length > p.players[i].melds[j].tiles.length))) S.kong();
      if (flowerN(v) > flowerN(p)) S.flower();
      if (v.phase === 'over' && p.phase !== 'over' && v.result && once('mj' + v.handNo + ':' + JSON.stringify(v.total))) {
        const r = v.result; if (r.draw) return;
        S.hu(); const me = v.me ? v.me.p : -1, wn = v.names[v.players[r.winner].seat];
        if (me < 0) return;
        if (r.winner === me) setTimeout(() => G.win(r.zimo ? '🎉 自摸！' : '🎉 胡了！', `共 ${r.tai.total} 台`), 600);
        else if (!r.zimo && r.from === me) setTimeout(() => G.lose('放槍啦～ ' + G.mock(), `${wn} 胡你的牌`), 600);
        else if (r.zimo) setTimeout(() => G.lose(G.mock(), `${wn} 自摸，大家都要付錢`), 600);
      }
    },
    bigtwo(p, v, G) {
      G.want(v.phase === 'over' ? 'off' : v.counts.some(c => c > 0 && c <= 3) ? 'tense' : 'calm');
      if (!p) return;
      if (v.top && JSON.stringify(v.top) !== JSON.stringify(p.top)) S.card();
      else if ((v.passes || []).length > (p.passes || []).length) S.pass();
      if (v.phase === 'over' && p.phase !== 'over' && v.seat >= 0 && once('b2' + v.round + ':' + JSON.stringify(v.total))) setTimeout(() => v.winner === v.seat ? G.win('🎉 你出完了！', `+${v.lastPts[v.seat]}`) : G.lose(G.mock(), `${v.names[v.winner]} 先出完`), 500);
    },
    slap(p, v, G) {
      G.want(v.phase === 'over' ? 'off' : v.pileN >= 10 ? 'tense' : 'calm');
      if (!p) return;
      if (v.last && JSON.stringify(v.last) !== JSON.stringify(p.last)) S.flip();
      if ((v.slapped || []).length > (p.slapped || []).length) S.slap();
      if (v.result && !p.result && v.result.loser === v.seat) { S.buzz(); }
      if (v.phase === 'over' && p.phase !== 'over' && v.seat >= 0 && once('sl' + JSON.stringify(v.wins))) setTimeout(() => v.winner === v.seat ? G.win('🎉 你出完牌了！') : G.lose(G.mock(), `${v.names[v.winner]} 贏了`), 400);
    },
    rummi(p, v, G) {
      G.want(v.phase === 'over' ? 'off' : v.counts.some(c => c <= 3) ? 'tense' : 'calm');
      if (!p) return;
      const tn = (x) => (x.table || []).reduce((a, s) => a + s.length, 0);
      if (v.turnId !== p.turnId) { if (tn(v) > tn(p)) S.tiles(); else if (v.counts[p.turn] > p.counts[p.turn]) S.draw(); }
      if (v.phase === 'over' && p.phase !== 'over' && v.seat >= 0 && once('rk' + JSON.stringify(v.total))) setTimeout(() => v.winner === v.seat ? G.win('🎉 你出完了！') : G.lose(G.mock(), `${v.names[v.winner]} 先出完`), 500);
    },
    dice(p, v, G) {
      G.want('calm');
      if (!p) return;
      if ((v.bids || []).length !== (p.bids || []).length && v.phase === 'bid') S.shake();
      if (v.phase === 'reveal' && p.phase !== 'reveal') { S.drum(); const lo = v.lose.findIndex((x, i) => x > (p.lose[i] || 0)); if (lo >= 0 && once('dc' + JSON.stringify(v.lose))) setTimeout(() => lo === v.seat ? G.lose('喝！🍺 ' + G.mock()) : S.cheer(), 900); }
    },
    bluff(p, v, G) {
      G.want(v.phase === 'talk' || v.phase === 'vote' ? 'calm' : 'off');
      if (!p) return;
      if (v.phase === 'talk' && p.phase === 'prep') S.flip();
      else if (v.phase !== p.phase && v.phase === 'vote') S.drum();
      else if (v.phase === 'talk' && v.spk !== p.spk) S.pop();
      if (v.phase === 'prep' && v.word !== p.word && p.phase === 'prep') S.card();
      if (v.phase === 'reveal' && p.phase !== 'reveal' && v.last) { const L = v.last; if (v.seat >= 0 && L.gain[v.seat]) S.ding(); setTimeout(() => (L.ok ? S.cheer : S.buzz)(), 300); }
      if (v.phase === 'over' && p.phase !== 'over' && v.seat >= 0 && once('bl' + v.turnId)) { const best = Math.max(...v.scores); setTimeout(() => v.scores[v.seat] === best ? G.win('👑 你是唬爛王！', `${best} 分`) : G.lose(G.mock(), `唬爛王是 ${v.names[v.scores.indexOf(best)]}`), 700); }
    },
    draw(p, v, G) {
      G.want(v.phase === 'draw' ? 'calm' : 'off');
      if (!p) return;
      if ((v.guessed || []).length > (p.guessed || []).length) S.ding();
      if (v.phase === 'over' && p.phase !== 'over' && v.seat >= 0 && once('dr' + JSON.stringify(v.scores))) { const best = Math.max(...v.scores), win = v.scores[v.seat] === best; setTimeout(() => win ? G.win('🎉 你是畫畫王！', `${best} 分`) : G.lose(G.mock(), `冠軍 ${v.names[v.scores.indexOf(best)]}`), 500); }
    }
  };
  root.GFX = GFX;
})(window);
