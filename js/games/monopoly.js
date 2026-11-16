// 大富翁：遊戲模組（規則在 mono-rules.js，3D 在 mono3d.js）
(function (root) {
  const U = root.GUTIL;
  const R = () => root.MONO_RULES, TH = () => root.MONO_THEMES;

  // ---------- 音效（Web Audio 即時合成） ----------
  const SFX = {
    on: true, ctx: null, rev: null,
    unlock() { // iPhone 要在使用者點擊時啟動音效，否則整場都沒聲音
      try { const c = this.ac(); const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); if (c.state !== 'running') c.resume(); } catch (e) {}
    },
    ac() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        // 殘響：用衰減雜訊當脈衝響應
        const c = this.ctx, len = c.sampleRate * 2.5, buf = c.createBuffer(2, len, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
        this.rev = c.createConvolver(); this.rev.buffer = buf; const rg = c.createGain(); rg.gain.value = 0.5; this.rev.connect(rg).connect(c.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    tone(f, d, o) {
      if (!this.on) return; o = o || {};
      try {
        const c = this.ac(), t0 = c.currentTime + (o.delay || 0);
        const osc = c.createOscillator(), g = c.createGain(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t0);
        if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t0 + d);
        if (o.detune) osc.detune.value = o.detune;
        const v = o.vol || 0.08, a = o.attack || 0.005;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        let node = osc; if (o.lp) { const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.lp; osc.connect(f2); node = f2; }
        node.connect(g); g.connect(c.destination); if (o.wet !== false) { const w = c.createGain(); w.gain.value = o.wet || 0.35; g.connect(w).connect(this.rev); }
        osc.start(t0); osc.stop(t0 + d + 0.05);
      } catch (e) {}
    },
    noise(d, o) {
      if (!this.on) return; o = o || {};
      try {
        const c = this.ac(), t0 = c.currentTime + (o.delay || 0), len = c.sampleRate * d, buf = c.createBuffer(1, len, c.sampleRate), x = buf.getChannelData(0);
        for (let i = 0; i < len; i++) x[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource(); src.buffer = buf; const f = c.createBiquadFilter(); f.type = o.type || 'lowpass'; f.frequency.value = o.f || 400; if (o.q) f.Q.value = o.q;
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.vol || 0.1, t0 + (o.attack || 0.02)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        src.connect(f).connect(g).connect(c.destination); const w = c.createGain(); w.gain.value = 0.4; g.connect(w).connect(this.rev);
        src.start(t0);
      } catch (e) {}
    },
    step() { this.tone(520 + Math.random() * 60, 0.07, { type: 'triangle', vol: 0.035, wet: 0.1 }); this.noise(0.05, { f: 1800, type: 'bandpass', vol: 0.02 }); },
    coin() { this.tone(988, 0.12, { type: 'square', vol: 0.03, lp: 3000 }); this.tone(1319, 0.35, { type: 'square', vol: 0.03, lp: 3000, delay: 0.07 }); },
    lose() { this.tone(196, 0.5, { type: 'sawtooth', vol: 0.04, lp: 700, glide: 140 }); },
    dice() { for (let i = 0; i < 7; i++) this.noise(0.04, { f: 2500 + Math.random() * 2000, type: 'bandpass', q: 3, vol: 0.06, delay: i * 0.05 }); },
    build() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.4, { type: 'triangle', vol: 0.05, delay: i * 0.06 })); this.noise(0.25, { f: 300, vol: 0.05 }); },
    // 幸運：上升的光輝琶音＋閃爍高音＋和弦鋪底
    glory() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => this.tone(f, 1.4, { type: 'sine', vol: 0.05, delay: i * 0.07, wet: 0.6 }));
      [261.6, 329.6, 392].forEach(f => this.tone(f, 2.2, { type: 'sawtooth', vol: 0.018, lp: 1400, attack: 0.4, wet: 0.7 }));
      for (let i = 0; i < 10; i++) this.tone(2093 + Math.random() * 2000, 0.25, { type: 'sine', vol: 0.02, delay: 0.3 + i * 0.09, wet: 0.8 });
    },
    // 厄運：低沉不和諧的嗡鳴＋三全音＋喪鐘＋低頻雜訊
    doom() {
      this.tone(55, 2.6, { type: 'sawtooth', vol: 0.07, lp: 260, attack: 0.3, wet: 0.5 });
      this.tone(58.3, 2.6, { type: 'sawtooth', vol: 0.06, lp: 260, attack: 0.3, wet: 0.5 });
      this.tone(110, 2.2, { type: 'triangle', vol: 0.05, attack: 0.5, delay: 0.2 }); this.tone(155.6, 2.2, { type: 'triangle', vol: 0.045, attack: 0.5, delay: 0.25 });
      [[0, 1], [0.9, 0.8]].forEach(([d, v]) => { [220, 440 * 1.19, 660 * 1.33].forEach((f, k) => this.tone(f, 2.4, { type: 'sine', vol: 0.05 * v / (k + 1), delay: d, wet: 0.8 })); });
      this.noise(2.2, { f: 160, vol: 0.06, attack: 0.6 });
    },
    // 神機錯亂：故障雜訊
    warp() { // 星門：上升的呼嘯＋最後一聲轟
      this.tone(80, 0.6, { type: 'sine', vol: 0.06, glide: 220, attack: 0.2 });
      [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2].forEach((d, i) => this.tone(330 * Math.pow(1.122, i), 0.12, { type: 'triangle', vol: 0.03, delay: d * 0.55, wet: 0.6 }));
      this.tone(110, 2.4, { type: 'sawtooth', vol: 0.03, lp: 1800, glide: 880, attack: 0.5, delay: 0.5 });
      this.noise(2.0, { f: 2500, type: 'bandpass', q: 0.7, vol: 0.06, attack: 1.4, delay: 0.5 });
      this.tone(55, 1.2, { type: 'sine', vol: 0.12, delay: 2.5, glide: 30 }); this.noise(0.8, { f: 200, vol: 0.12, delay: 2.5 });
    },
    growl() { this.tone(70, 1.4, { type: 'sawtooth', vol: 0.07, lp: 400, glide: 52, attack: 0.2 }); this.tone(73, 1.4, { type: 'sawtooth', vol: 0.05, lp: 350, glide: 50, attack: 0.3 }); this.noise(1.2, { f: 300, vol: 0.05, attack: 0.3 }); },
    hiss() { this.noise(0.9, { f: 4500, type: 'highpass', vol: 0.05, attack: 0.15 }); this.tone(180, 0.6, { type: 'sawtooth', vol: 0.03, lp: 900, glide: 120 }); },
    snap() { this.noise(0.08, { f: 1800, type: 'bandpass', q: 2, vol: 0.2, attack: 0.002 }); this.tone(90, 0.25, { type: 'square', vol: 0.08, lp: 600, glide: 40, wet: 0.2 }); },
    crunch() { for (let i = 0; i < 6; i++) this.noise(0.05, { f: 900 + Math.random() * 1500, type: 'bandpass', q: 4, vol: 0.12, delay: i * 0.035, attack: 0.002 }); this.noise(0.25, { f: 350, vol: 0.06, delay: 0.05 }); },
    splat() { this.noise(0.35, { f: 600, type: 'lowpass', vol: 0.1, attack: 0.005 }); this.tone(220, 0.3, { type: 'sine', vol: 0.04, glide: 70, wet: 0.2 }); },
    roar() { this.tone(110, 1.0, { type: 'sawtooth', vol: 0.06, lp: 900, glide: 70, attack: 0.05 }); this.tone(165, 1.0, { type: 'sawtooth', vol: 0.04, lp: 1200, glide: 100, attack: 0.05 }); this.noise(0.9, { f: 800, type: 'bandpass', q: 0.8, vol: 0.06, attack: 0.05 }); },
    stampede() { // 大地震動的蹄聲
      this.noise(4.4, { f: 180, vol: 0.12, attack: 0.6 }); this.tone(45, 4.2, { type: 'sine', vol: 0.12, attack: 0.5 });
      for (let i = 0; i < 46; i++) this.noise(0.07, { f: 140 + Math.random() * 160, vol: 0.09 + Math.random() * 0.05, delay: 0.15 + i * 0.09 + Math.random() * 0.04, attack: 0.003 });
      [0.6, 1.8, 3.0].forEach(d => this.tone(220, 0.5, { type: 'sawtooth', vol: 0.025, lp: 900, glide: 160, delay: d, attack: 0.05 }));
    },
    oiia() { // 用合成器模擬貓叫的母音「喔、咿、咿、啊、咿」，越來越快、越來越高
      try { const c = this.ac(); if (!this.on) return; const t0 = c.currentTime + 0.05;
        const vow = { o: [480, 860], i: [320, 2400], a: [820, 1250] }, seq = ['o', 'i', 'i', 'a', 'i'];
        let tt = 0, k = 0; while (tt < 3.3) { const v = vow[seq[k % 5]], d = Math.max(0.09, 0.26 - k * 0.012), f0 = 380 + k * 9;
          const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t0 + tt); o.frequency.linearRampToValueAtTime(f0 * (seq[k % 5] === 'i' ? 1.25 : 0.95), t0 + tt + d);
          const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0 + tt); g.gain.exponentialRampToValueAtTime(0.09, t0 + tt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + tt + d);
          v.forEach((fr, j) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = 6; const bg = c.createGain(); bg.gain.value = j ? 0.6 : 1; o.connect(b).connect(bg).connect(g); });
          g.connect(c.destination); o.start(t0 + tt); o.stop(t0 + tt + d + 0.02); tt += d; k++; } } catch (e) {}
    },
    glitch() { for (let i = 0; i < 14; i++) { this.noise(0.06, { f: 500 + Math.random() * 4000, type: 'bandpass', q: 8, vol: 0.08, delay: i * 0.07 }); this.tone(80 + Math.random() * 900, 0.06, { type: 'square', vol: 0.03, delay: i * 0.07 + 0.03, wet: false }); } }
  };
  try { SFX.on = localStorage.getItem('mono-sfx') !== '0'; } catch (e) {}

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const fmt = (n) => Math.round(n).toLocaleString();

  const M = {
    id: 'monopoly', name: '大富翁', icon: '🎩', min: 2, max: 6,
    desc: '擲骰子走格子，買地、蓋房子，別人踩到要付過路費。付完過路費可以花 1.4 倍價錢強制收購那塊地（地標不行）。落後的人經過起點多領補助，稅金越有錢繳越多。錢不夠會自動賣房賣地，賣光就破產。結束時比「總資產」＝現金＋地價＋建築。',
    options: [
      { key: 'theme', label: '主題', choices: [['ragnarok', '⚡ 諸神黃昏'], ['cyber', '🌃 夜城'], ['animal', '🦁 動物星球'], ['alien', '🌌 深空異種']], def: 'ragnarok' },
      { key: 'cash', label: '起始資金', choices: [[50000, '50,000'], [30000, '30,000'], [80000, '80,000']], def: 50000 },
      { key: 'rounds', label: '遊戲長度', choices: [[0, '有人破產就結束（約 25～30 分）'], [12, '12 回合（約 10 分）'], [24, '24 回合（約 20 分）'], [36, '36 回合（約 30 分）'], [999, '打到剩一人']], def: 0 }
    ],
    init(n, o, names, now) { return R().init(n, o, now); },
    action(st, seat, a, ctx) {
      if (seat < 0) return 'silent';
      return R().act(st, seat, a, ctx.now);
    },
    tick(st, now) {
      if (!st.deadline || now <= st.deadline || st.phase === 'over') return false;
      const w = R().autoAct(st); if (!w) return false;
      R().act(st, w.seat < 0 ? 0 : w.seat, w.a, now); return true;
    },
    auto(st) { const w = R().autoAct(st); return w && w.seat >= 0 ? w : null; },
    view(st) {
      return {
        theme: st.theme, phase: st.phase, turn: st.turn, round: st.round, maxRounds: st.maxRounds, deadline: st.deadline,
        players: st.players.map(p => ({ cash: p.cash, pos: p.pos, alive: p.alive, skip: p.skip, immune: p.immune, jailfree: p.jailfree, char: p.char })),
        assets: st.players.map((p, s) => R().assets(st, s)), infl: R().inflation(st),
        owners: st.owners, levels: st.levels, ev: st.ev, evId: st.evId, pending: st.pending, dice: st.dice, winner: st.winner, ranks: st.ranks
      };
    },

    // ================= 畫面 =================
    _auto: false,
    charOf(v, s) {
      const th = TH()[v.theme]; const c = v.players[s].char;
      if (!c) return null;
      const base = th.chars[c.i % th.chars.length];
      return { emoji: base[0], name: c.kind === 'custom' ? v.names[s] : base[1], color: base[2], custom: c.kind === 'custom' };
    },
    avatarOf(s) {
      const room = root.Room && root.Room.room; if (!room || !room.game) return null;
      const cid = room.game.seats[s]; const m = room.members.find(x => x.cid === cid); return m && m.avatar || null;
    },
    faceHTML(v, s, size) {
      const ch = this.charOf(v, s); const img = ch && ch.custom ? this.avatarOf(s) : null;
      const sz = size || 34;
      if (!ch) return `<span class="mface" style="width:${sz}px;height:${sz}px">？</span>`;
      return `<span class="mface" style="width:${sz}px;height:${sz}px;border-color:${ch.color}">${img ? `<img src="${img}">` : `<i style="font-size:${sz * 0.6}px">${ch.emoji}</i>`}</span>`;
    },
    render(el, v, ui) {
      this.ui = ui; this.v = v;
      if (el.dataset.g !== 'monopoly' || this._theme !== v.theme) this.build(el, v);
      el.classList.toggle('dim-bg', false);
      this.renderHud(); this.renderPick();
      if (v.phase === 'pick') { this.showPrompt(); return; }
      if (!this.board || !this.board.ready) { this._pendingSync = true; return; }
      if (v.evId !== this._evId) {
        const evs = v.ev.slice(); this._evId = v.evId;
        this.queue = this.queue.then(() => this.play(evs)).then(() => this.holdCam()).then(() => this.syncBoard()).catch(e => console.error(e));
      } else if (!this.playing) this.syncBoard();
      this.queue.then(() => this.showPrompt());
    },
    destroy() { if (this.board) this.board.dispose(); if (this._booting) this._booting.dispose(); this.board = null; this._theme = null; },
    build(el, v) {
      if (this.board) this.board.dispose();
      this.board = null; this._theme = v.theme; this._evId = v.evId; this.queue = Promise.resolve(); this.playing = false;
      el.dataset.g = 'monopoly';
      const th = TH()[v.theme];
      el.innerHTML = `
        <div class="mono mono-${v.theme}">
          <div class="mono-hud"></div>
          <div class="mono-stage"><div class="mono-loading">${th.icon} 載入 3D 場景中…</div><div class="mono-fx"></div>
            <div class="mono-dice"><div class="dice-faces"><span class="d6">?</span><span class="d6">?</span></div><button class="go-btn" disabled>GO</button></div>
            <div class="mono-tools"><button data-t="me" title="回到我">🎯</button><button data-t="all" title="全景">🗺️</button><button data-t="sfx" title="音效">${SFX.on ? '🔊' : '🔇'}</button><button data-t="q" title="畫質">${this.quality() === 'high' ? '高' : '低'}</button></div>
            <div class="mono-cam"><button data-c="tu" title="俯視">⤒</button><button data-c="td" title="平視">⤓</button><button data-c="zi">＋</button><button data-c="zo">－</button></div>
            <div class="mono-hint" hidden>單指拖曳移動地圖・雙指開合縮放・雙指上下滑調整角度・點玩家頭像看他在哪</div>
            <div class="mono-vfx"></div>
            <div class="mono-feed"></div>
            <div class="mono-cardlayer"></div>
            <div class="mono-quiz" hidden></div>
          </div>
          <div class="mono-info"></div>
          <div class="mono-modal" hidden></div>
          <div class="mono-pick" hidden></div>
        </div>`;
      this.el = el;
      el.querySelector('.go-btn').onclick = () => { if (this.canAct('roll')) { this.ui.send({ type: 'roll' }); el.querySelector('.go-btn').disabled = true; SFX.dice(); } };
      el.querySelector('[data-t="me"]').onclick = () => { if (this.board && this.v.seat >= 0) this.board.focusSeat(this.v.seat, true); };
      el.querySelector('[data-t="all"]').onclick = () => { if (this.board) this.board.overview(); };
      el.querySelector('[data-t="q"]').onclick = (e) => { const nq = this.quality() === 'high' ? 'low' : 'high'; try { localStorage.setItem('mono-q', nq); } catch (x) {} e.target.textContent = nq === 'high' ? '高' : '低'; this.ui.toast('畫質已切換，重新整理頁面後生效'); };
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { if (!this.board) return; const c = b.dataset.c; if (c === 'tu') this.board.nudge('tilt', -0.25); if (c === 'td') this.board.nudge('tilt', 0.25); if (c === 'zi') this.board.nudge('zoom', 0.8); if (c === 'zo') this.board.nudge('zoom', 1.25); });
      el.querySelector('[data-t="sfx"]').onclick = (e) => { SFX.on = !SFX.on; e.target.textContent = SFX.on ? '🔊' : '🔇'; try { localStorage.setItem('mono-sfx', SFX.on ? '1' : '0'); } catch (x) {} };
      const stage = el.querySelector('.mono-stage');
      const b = new root.MonoBoard3D();
      b.init(stage, v.theme, R()).then(() => {
        b.ready = true; this.board = b; stage.querySelector('.mono-loading').remove();
        b.onPan = () => { this._camFree = true; };
        b.onTap = (h) => { if (h.tile != null && this.canAct('gate')) this.pickGate(h.tile); else if (h.tile != null) this.tileInfo(h.tile); else if (h.seat != null) b.focusSeat(h.seat, true); };
        try { if (!localStorage.getItem('mono-hint')) { const hn = el.querySelector('.mono-hint'); hn.hidden = false; setTimeout(() => hn.hidden = true, 6000); localStorage.setItem('mono-hint', '1'); } } catch (x) {}
        b.onStep = () => SFX.step();
        this.syncBoard(true);
        if (this.v.seat >= 0 && this.board.tokens[this.v.seat]) { this.board.focusSeat(this.v.seat, true); this.board.snap(); }
        this.showPrompt();
      }).catch(e => { console.error(e); stage.querySelector('.mono-loading').textContent = '這台裝置不支援 3D（WebGL），請換瀏覽器或裝置'; });
      this.board = null; this._booting = b;
    },
    quality() { try { return localStorage.getItem('mono-q') || ((navigator.hardwareConcurrency || 4) <= 4 ? 'low' : 'high'); } catch (e) { return 'high'; } },
    canAct(phase) { const v = this.v; return v && v.seat >= 0 && v.turn === v.seat && v.phase === phase && !this.playing; },

    renderHud() {
      const v = this.v, hud = this.el.querySelector('.mono-hud'); const unit = TH()[v.theme].unit;
      hud.innerHTML = v.players.map((p, s) => `
        <div class="mp ${s === v.turn && v.phase !== 'over' ? 'turn' : ''} ${p.alive ? '' : 'dead'}" data-s="${s}">
          ${this.faceHTML(v, s, 34)}
          <div><b>${U.esc(v.names[s])}${s === v.seat ? '（你）' : ''}</b><span class="cash" data-s="${s}">${p.alive ? (TH()[v.theme].coin || '💰') + fmt(p.cash) : '破產'}</span>${p.alive && v.assets ? `<span class="worth">總資產 ${fmt(v.assets[s].total)} ${unit}</span>` : ''}
          <small>${p.skip ? `⏸${p.skip} ` : ''}${p.immune ? `🛡${p.immune} ` : ''}${p.jailfree ? `🎫${p.jailfree}` : ''}</small></div>
        </div>`).join('');
      hud.querySelectorAll('.mp').forEach(d => d.onclick = () => this.assetInfo(+d.dataset.s));
      const info = this.el.querySelector('.mono-info');
      const cap = v.maxRounds || R().ROUND_CAP;
      info.innerHTML = v.phase === 'over' ? '' : `第 ${Math.min(v.round, cap)}${v.maxRounds && v.maxRounds < 900 ? '/' + v.maxRounds : ''} 回合${v.maxRounds === 0 ? '（有人破產就結束）' : ''}${v.infl > 1 ? ` · 過路費 ×${v.infl.toFixed(1)}` : ''} · 輪到 <b>${U.esc(v.names[v.turn])}</b> <span class="timer" data-deadline="${v.deadline || ''}"></span>`;
    },
    renderPick() {
      const v = this.v, box = this.el.querySelector('.mono-pick');
      if (v.phase !== 'pick') { box.hidden = true; return; }
      const th = TH()[v.theme]; box.hidden = false;
      const mine = v.seat >= 0 ? v.players[v.seat].char : null;
      const taken = v.players.map(p => p.char && p.char.kind === 'preset' ? p.char.i : -1);
      const myAv = v.seat >= 0 ? this.avatarOf(v.seat) : null;
      box.innerHTML = `<div class="pick-card"><h3>${th.icon} ${th.name}：選角色</h3><p class="hint">${U.esc(th.desc)}</p>
        <div class="pick-grid">${th.chars.map((c, i) => `<button class="pc ${mine && mine.kind === 'preset' && mine.i === i ? 'on' : ''}" data-i="${i}" ${taken.includes(i) && !(mine && mine.i === i && mine.kind === 'preset') || v.seat < 0 ? 'disabled' : ''} style="--c:${c[2]}"><i>${c[0]}</i><span>${c[1]}</span></button>`).join('')}
          <button class="pc draw ${mine && mine.kind === 'custom' ? 'on' : ''}" data-draw ${v.seat < 0 ? 'disabled' : ''}>${myAv ? `<img src="${myAv}">` : '<i>✏️</i>'}<span>${myAv ? '用我畫的' : '自己畫'}</span></button></div>
        <div class="pick-who">${v.players.map((p, s) => `<span class="${p.char ? 'ok' : ''}">${p.char ? '✔' : '…'} ${U.esc(v.names[s])}</span>`).join('')}</div>
        <p class="hint">所有人選好就開始，<span class="timer" data-deadline="${v.deadline}"></span> 後自動分配</p>
        ${myAv ? '<button class="btn sm ghost" data-redraw>重畫我的角色</button>' : ''}</div>`;
      box.querySelectorAll('[data-i]').forEach(b => b.onclick = () => this.ui.send({ type: 'pick', i: +b.dataset.i }));
      const d = box.querySelector('[data-draw]'); if (d) d.onclick = () => { if (myAv) this.ui.send({ type: 'pick', custom: true }); else this.drawPad(() => this.ui.send({ type: 'pick', custom: true })); };
      const rd = box.querySelector('[data-redraw]'); if (rd) rd.onclick = () => this.drawPad();
    },
    drawPad(after) {
      const m = this.el.querySelector('.mono-modal'); m.hidden = false;
      m.innerHTML = `<div class="mm-card"><h3>畫你的角色</h3><p class="hint">畫好的圖本身就是你的角色（白色部分會變透明，做成立牌在地圖上走）</p><canvas class="pad" width="240" height="240"></canvas>
        <div class="pad-tools">${['#222', '#e03131', '#f08c00', '#fab005', '#2f9e44', '#1971c2', '#ae3ec9', '#f783ac', '#8d6e63', '#fff'].map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('')}</div>
        <div class="act-row"><button class="btn sm ghost" data-a="clr">清空</button><button class="btn sm ghost" data-a="cancel">取消</button><button class="btn" data-a="ok">用這個角色</button></div></div>`;
      const cv = m.querySelector('canvas'), g = cv.getContext('2d'); let col = '#222', drawing = false, last = null;
      g.fillStyle = '#fff'; g.fillRect(0, 0, 240, 240); g.lineCap = g.lineJoin = 'round'; g.lineWidth = 8;
      const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 240, (e.clientY - r.top) / r.height * 240]; };
      cv.onpointerdown = (e) => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); g.beginPath(); g.fillStyle = col; g.arc(last[0], last[1], 4, 0, 7); g.fill(); };
      cv.onpointermove = (e) => { if (!drawing) return; const p = pos(e); g.strokeStyle = col; g.lineWidth = col === '#fff' ? 22 : 8; g.beginPath(); g.moveTo(...last); g.lineTo(...p); g.stroke(); last = p; };
      cv.onpointerup = cv.onpointercancel = () => drawing = false;
      m.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { col = b.dataset.c; });
      m.querySelector('[data-a="clr"]').onclick = () => { g.fillStyle = '#fff'; g.fillRect(0, 0, 240, 240); };
      m.querySelector('[data-a="cancel"]').onclick = () => { m.hidden = true; };
      m.querySelector('[data-a="ok"]').onclick = () => {
        const small = document.createElement('canvas'); small.width = small.height = 128; small.getContext('2d').drawImage(cv, 0, 0, 128, 128);
        const img = small.toDataURL('image/jpeg', 0.8);
        root.Room.send({ t: 'avatar', img }); m.hidden = true; if (after) setTimeout(after, 300);
      };
    },

    syncBoard(first, mid) {
      // mid＝播放中途呼叫：只更新棋盤，不換鏡頭
      const b = this.board, v = this.v; if (!b || !v || v.phase === 'pick') return;
      b.setTokens(v.players.map((p, s) => { const ch = this.charOf(v, s); const c = v.players[s].char; return { seat: s, idx: c ? c.i : s, color: ch ? ch.color : '#999', img: ch && ch.custom ? this.avatarOf(s) : null, alive: p.alive, name: v.names[s] }; }));
      v.players.forEach((p, s) => { const tk = b.tokens[s]; if (tk && !tk.busy && tk.pos !== p.pos) b.place(s, p.pos); });
      b.setBuildings(v.owners, v.levels, v.players.map((p, s) => ({ color: (this.charOf(v, s) || {}).color, charIdx: p.char ? p.char.i : 0 })));
      b.setTurn(v.phase === 'over' ? -1 : v.turn);
      // 換人時鏡頭自動切到輪到的人（自己拖地圖後，這一輪就不再自動跟）；輪到自己一定拉回來
      if (!mid && v.phase !== 'over' && this._camTurn !== v.turn) { this._camTurn = v.turn; this._camFree = false; b.focusSeat(v.turn, true); }
      const myTurn = v.seat >= 0 && v.turn === v.seat && v.phase === 'roll';
      if (!mid && myTurn && this._lastMyTurn !== v.evId) { this._lastMyTurn = v.evId; this._camFree = false; b.focusSeat(v.seat, true); }
      if (first && v.seat < 0) b.overview(true);
    },
    vfx(kind) {
      const box = this.el && this.el.querySelector('.mono-vfx'); if (!box) return;
      box.className = 'mono-vfx ' + kind; void box.offsetWidth; box.classList.add('go');
      clearTimeout(this._vfxT); this._vfxT = setTimeout(() => { box.className = 'mono-vfx'; }, 2600);
      if (kind === 'doom' || kind === 'glitch') { const st = this.el.querySelector('.mono-stage'); st.classList.remove('shake'); void st.offsetWidth; st.classList.add('shake'); }
    },
    fx(text, cls, seat, tile) {
      const b = this.board; const host = this.el.querySelector('.mono-fx'); if (!b) return;
      const p = b.screenOf(seat, tile) || { x: host.clientWidth / 2, y: host.clientHeight / 2 };
      const d = document.createElement('div'); d.className = 'mfx ' + (cls || ''); d.textContent = text; d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
      host.appendChild(d); setTimeout(() => d.remove(), 1600);
    },
    // 換人前在剛剛那個人身上多停一下，讓買地、蓋房、進監獄的動畫看得完整（約 1.2 秒，不會停太久）
    holdCam() {
      const v = this.v; if (!v || v.phase === 'over' || this._camTurn === v.turn || this._camTurn == null || !this._played) return;
      this._played = false; return sleep(1200);
    },
    async play(evs) {
      this._played = evs.some(e => ['buy', 'up', 'buyout', 'jail', 'pay', 'card', 'sell', 'down', 'skip', 'skipset', 'cash', 'immune'].includes(e.t));
      this.playing = true; this.hidePrompt();
      const v = this.v, b = this.board, unit = TH()[v.theme].unit, $ = (n) => fmt(n) + ' ' + unit, why = (w) => w ? (w === '卡片' ? '（卡片）' : ' ' + w) : ''; const watch = (s) => !this._camFree || b.following === s;
      try {
        for (const e of evs) {
          if (!this.board) break;
          switch (e.t) {
            case 'dice': this.closeCard(); if (!this._camFree) b.focusSeat(e.seat, true); await this.rollDice(e.d); break;
            case 'move': await b.hop(e.seat, e.path, watch(e.seat)); break;
            case 'tp': if (e.gate) { this.feed(`🌀 ${this.who(e.seat)} 穿越星門 → <b>${U.esc(R().tileName(v.theme, e.to))}</b>`, 'big'); await this.stargate(); } await b.teleport(e.seat, e.to, watch(e.seat)); break;
            case 'cash': SFX.coin(); this.fx(`+${$(e.amt)}${why(e.why)}`, 'gain', e.seat); b.jumpJoy(e.seat); if (e.boost) this.feed(`${this.who(e.seat)} 落後補助 <b class="g">+${$(e.amt)}</b>`, 'good'); await sleep(450); break;
            case 'pay':
              SFX.lose(); b.mood(e.from, 'sad', 1300); this.fx(`-${$(e.amt)}${why(e.why)}`, 'loss', e.from); if (e.to >= 0) b.mood(e.to, 'joy', 900);
              if (e.to >= 0) setTimeout(() => this.fx(`+${$(e.amt)}`, 'gain', e.to), 300);
              if (e.to >= 0) this.feed(`${this.who(e.from)} 付給 ${this.who(e.to)} <b class="r">${$(e.amt)}</b>${U.esc(why(e.why))}${e.tile != null ? `<small>（${U.esc(R().tileName(v.theme, e.tile))}）</small>` : ''}`, 'pay');
              else if (e.why !== '卡片' || e.amt >= 3000) this.feed(`${this.who(e.from)} 付出 <b class="r">${$(e.amt)}</b>${U.esc(why(e.why))}`, 'pay');
              await sleep(650); break;
            case 'buy': SFX.build(); b.mood(e.seat, 'joy', 900); this.fx(`買下！`, 'gain', null, e.tile); this.feed(`${this.who(e.seat)} 買下 <b>${U.esc(R().tileName(v.theme, e.tile))}</b>`, 'good'); this.syncBoard(false, true); await sleep(500); break;
            case 'buyout': SFX.build(); SFX.lose(); b.mood(e.seat, 'joy', 1200); b.mood(e.from, 'sad', 1200); this.fx('強制收購！', 'gain big', null, e.tile); this.feed(`${this.who(e.seat)} 花 <b>${$(e.amt)}</b> 收購了 ${this.who(e.from)} 的 <b>${U.esc(R().tileName(v.theme, e.tile))}</b>`, 'big'); this.syncBoard(false, true); await sleep(900); break;
            case 'up': SFX.build(); this.fx(e.free ? '免費升級！' : `升級 Lv${e.level}`, 'gain', null, e.tile); this.feed(`${this.who(e.seat)} 把 <b>${U.esc(R().tileName(v.theme, e.tile))}</b> 蓋到 Lv${e.level}`, 'good'); this.syncBoard(false, true); await sleep(600); break;
            case 'down': SFX.lose(); b.mood(e.seat, 'scared', 900); this.fx(`建築被毀 Lv${e.level}`, 'loss', null, e.tile); this.syncBoard(false, true); await sleep(600); break;
            case 'sell': this.fx(e.what === 'land' ? '被迫賣地' : '被迫賣房', 'loss', null, e.tile); this.feed(`${this.who(e.seat)} 錢不夠，被迫${e.what === 'land' ? '賣掉' : '拆掉'} <b>${U.esc(R().tileName(v.theme, e.tile))}</b>${e.what === 'land' ? '' : ' 的建築'}`, 'pay'); this.syncBoard(false, true); await sleep(400); break;
            case 'card': await this.showCard(e); break;
            case 'quiz': {
              this.closeCard(); SFX.doom(); this.vfx('doom'); b.mood(e.debtor, 'scared', 2500); b.mood(e.cred, 'joy', 1500);
              this.feed(`⚔️ ${this.who(e.debtor)} 付不出 ${$(e.amt)}，跟 ${this.who(e.cred)} 進入翻盤問答！`, 'big');
              if (!this._camFree) b.focusSeat(e.debtor, true); await sleep(1400); break;
            }
            case 'quizres': await this.quizReveal(e); break;
            case 'immune': this.fx('🛡 抵擋了厄運！', 'gain', e.seat); SFX.glory(); this.vfx('glory'); b.mood(e.seat, 'joy', 1200); await sleep(900); break;
            case 'jailfree': this.fx('🎫 使用免罪卡！', 'gain', e.seat); await sleep(900); break;
            case 'jail': this.feed(`${this.who(e.seat)} 被送進 ${U.esc(TH()[v.theme].corners.jail)}`, 'pay'); SFX.doom(); this.vfx('doom'); this.fx(`⛓ ${TH()[v.theme].corners.jail}`, 'loss', e.seat); await b.teleport(e.seat, R().JAIL, watch(e.seat)); b.mood(e.seat, 'sad', 2000); break;
            case 'skip': this.fx('⏸ 暫停一回合', 'loss', e.seat); await sleep(700); break;
            case 'skipset': this.fx(`⏸ 停 ${e.n} 回合`, 'loss', e.seat); await sleep(500); break;
            case 'bankrupt':
              if ((v.theme === 'alien' || v.theme === 'animal') && b.tokens[e.seat]) {
                const snd = k => SFX[k] && SFX[k](); SFX.doom(); this.vfx('doom'); this._played = true;
                if (e.by >= 0 && b.tokens[e.by]) { // 欠誰的錢，就被誰吃掉
                  this.feed(`🩸 ${this.who(e.seat)} 破產了，被 ${this.who(e.by)} 吃掉了`, 'big');
                  if (v.theme === 'alien') await b.devour(e.by, e.seat, snd); else await b.feast([e.by], e.seat, snd);
                } else { // 不是欠玩家錢：還活著的人一起圍上去分食
                  const eaters = v.players.map((p, s) => s).filter(s => s !== e.seat && v.players[s].alive && b.tokens[s] && !b.tokens[s].eaten);
                  this.feed(`🩸 ${this.who(e.seat)} 破產了，大家一起分食`, 'big');
                  if (eaters.length) await b.feast(eaters, e.seat, snd);
                }
                break;
              }
              this.feed(`💥 ${this.who(e.seat)} 破產了！`, 'big'); SFX.doom(); b.mood(e.seat, 'fall'); this.fx('💥 破產了', 'loss big', e.seat); await b.shake(e.seat); await sleep(800); break;
            case 'note': this.fx(e.text, '', e.seat); await sleep(600); break;
          }
        }
      } finally { this.playing = false; }
    },
    async rollDice(d) {
      const faces = this.el.querySelectorAll('.d6'); SFX.dice();
      for (let k = 0; k < 8; k++) { faces.forEach(f => f.textContent = '⚀⚁⚂⚃⚄⚅'[Math.floor(Math.random() * 6)]); await sleep(60); }
      faces[0].textContent = '⚀⚁⚂⚃⚄⚅'[d[0] - 1]; faces[1].textContent = '⚀⚁⚂⚃⚄⚅'[d[1] - 1];
      this.fx(`${d[0] + d[1]} 步`, 'dice', this.v.turn); await sleep(350);
    },
    // 卡片：所有人都看得到（頭像＋名字），可以自己關；下一位擲骰前自動收掉
    async showCard(e) {
      const v = this.v, th = TH()[v.theme]; const good = e.deck === 'luck';
      if (good) { SFX.glory(); this.vfx('glory'); this.board && this.board.mood(e.seat, 'joy', 1800); }
      else if (e.eff === 'psycho') { SFX.glitch(); SFX.doom(); this.vfx('glitch'); this.board && this.board.mood(e.seat, 'scared', 2500); }
      else { SFX.doom(); this.vfx('doom'); this.board && this.board.mood(e.seat, 'scared', 1800); }
      const L = this.el.querySelector('.mono-cardlayer');
      L.innerHTML = `<div class="mcard ${good ? 'good' : 'bad'}"><div class="mcard-in">
        <button class="mcard-x" aria-label="關閉">✕</button>
        <div class="mcard-head">${good ? th.luckName : th.badName}</div>
        <div class="mcard-who">${this.faceHTML(v, e.seat, 52)}<b>${U.esc(v.names[e.seat])}</b>${e.seat === v.seat ? '<em>（你）</em>' : ''}</div>
        <p>${U.esc(e.text)}</p><div class="mcard-eff">${this.effText(e.eff, th)}</div></div></div>`;
      L.classList.add('on'); L.onclick = () => this.closeCard();
      clearTimeout(this._cardT); this._cardT = setTimeout(() => this.closeCard(), 25000);
      await sleep(2200);
      if (e.eff === 'gagain' || e.eff.startsWith('gm:')) { this.closeCard(); await this.stargate(); }
      else if (e.eff.startsWith('mig:')) { this.closeCard(); await this.migration(); }
      else if (e.eff.startsWith('cat:')) { this.closeCard(); await this.catSpin(); }
    },
    closeCard() { const L = this.el && this.el.querySelector('.mono-cardlayer'); if (L) { L.classList.remove('on'); L.innerHTML = ''; } clearTimeout(this._cardT); },
    who(s) { const v = this.v; return `<span class="who">${this.faceHTML(v, s, 22)}${U.esc(v.names[s])}</span>`; },
    feed(html, cls) {
      const box = this.el && this.el.querySelector('.mono-feed'); if (!box) return;
      const d = document.createElement('div'); d.className = 'mfeed ' + (cls || ''); d.innerHTML = html; box.prepend(d);
      while (box.children.length > 3) box.lastChild.remove();
      setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 500); }, 6000);
      d.onclick = () => d.remove();
    },
    assetInfo(s) {
      const v = this.v; if (!v || !v.assets) return; const th = TH()[v.theme]; const a = v.assets[s];
      const m = this.el.querySelector('.mono-modal'); if (!m.hidden && !m.querySelector('.tinfo')) return;
      const rows = a.tiles.map(i => { const t = R().BOARD[i]; return `<li><i style="background:${t.color}"></i>${U.esc(R().tileName(v.theme, i))}<span>${v.levels[i] ? '🏠 Lv' + v.levels[i] : '空地'}</span></li>`; }).join('');
      m.hidden = false;
      m.innerHTML = `<div class="mm-card tinfo assets"><div class="mcard-who">${this.faceHTML(v, s, 44)}<b>${U.esc(v.names[s])}</b></div>
        ${v.players[s].alive ? `<table class="atab"><tr><td>現金</td><td>${fmt(a.cash)} ${th.unit}</td></tr><tr><td>地價（${a.tiles.length} 塊）</td><td>${fmt(a.land)} ${th.unit}</td></tr><tr><td>建築</td><td>${fmt(a.bld)} ${th.unit}</td></tr><tr class="sum"><td>總資產</td><td>${fmt(a.total)} ${th.unit}</td></tr></table>
        ${rows ? `<ul class="alist">${rows}</ul>` : '<p class="hint">還沒有地</p>'}` : '<p>已破產</p>'}
        <div class="act-row"><button class="btn sm ghost" data-where>看他在哪</button><button class="btn sm" data-x>關閉</button></div></div>`;
      m.onclick = (e) => {
        if (e.target.closest('[data-where]')) { m.hidden = true; if (this.board) { this._camFree = true; this.board.focusSeat(s, true); } this.showPrompt(); }
        else if (e.target.closest('[data-x]') || e.target === m) { m.hidden = true; this.showPrompt(); }
      };
    },
    effText(eff, th) {
      const [k, v0] = eff.split(':'); const v = +v0; const u = th.unit;
      return { m: v >= 0 ? `+${fmt(v)} ${u}` : `-${fmt(-v)} ${u}`, mv: v >= 0 ? `前進 ${v} 格` : `後退 ${-v} 格`, go: '前往起點並領獎金', gonb: '回到起點（不領錢）', jail: `進入${th.corners.jail}`,
        skip: `暫停 ${v} 回合`, immune: '獲得 🛡 抵擋一次厄運', jailfree: `獲得 🎫 免進${th.corners.jail}一次`, up: '免費升級一棟建築', down: '一棟建築降一級',
        each: `每位玩家付你 ${fmt(v)} ${u}`, give: `你付每位玩家 ${fmt(v)} ${u}`, house: `每一級建築付 ${fmt(-v)} ${u}`, pct: `失去 ${-v}% 現金`, teleport: '隨機傳送', mig: `🦓 跟著獸群前進 ${v} 格`, cat: `🐈 頭暈，停 ${v} 回合`, gate: '🌀 自己選目的地，穿越星門', gm: `🌀 +${fmt(v)} ${u}`, gagain: '🌀 這回合再擲一次', gtp: '🌀 被丟到隨機一格', psycho: '失去 30% 現金、兩棟建築降級、停兩回合' }[k] || '';
    },
    hidePrompt() { const m = this.el && this.el.querySelector('.mono-modal'); if (m && !m.querySelector('.pad') && !m.querySelector('.tinfo')) m.hidden = true; if (this.el) this.el.querySelector('.go-btn').disabled = true; },
    showPrompt() {
      const v = this.v; if (!this.el || this.playing) return;
      if (v.phase === 'quiz' && v.pending && v.pending.quiz) this.quizUI(v.pending, null); else if (!this._revealing) { const qz = this.el.querySelector('.mono-quiz'); if (qz) qz.hidden = true; }
      if (!(v.phase === 'gate' && v.turn === v.seat)) this.gateBar(false);
      const go = this.el.querySelector('.go-btn'); const m = this.el.querySelector('.mono-modal');
      go.disabled = !this.canAct('roll'); go.classList.toggle('pulse', !go.disabled);
      if (m.querySelector('.pad')) return;
      const th = TH()[v.theme];
      if (v.phase === 'over') {
        m.hidden = false;
        m.innerHTML = `<div class="mm-card over"><h2>🏆 ${U.esc(v.names[v.winner])} 獲勝！</h2>
          <p class="hint">排名看「總資產」＝ 現金 ＋ 地價 ＋ 建築（單位：${th.unit}）</p>
          <table class="atab rank"><tr><th></th><th>玩家</th><th>現金</th><th>地＋建築</th><th>總資產</th></tr>${(v.ranks || []).map((r, k) => `<tr class="${k === 0 ? 'win' : ''}"><td>${k + 1}</td><td>${this.faceHTML(v, r.s, 24)} ${U.esc(v.names[r.s])}</td>${r.w >= 0 ? `<td>${fmt(r.cash)}</td><td>${fmt(r.land + r.bld)}</td><td><b>${fmt(r.w)}</b></td>` : '<td colspan="3">破產</td>'}</tr>`).join('')}</table></div>`;
        m.onclick = null; return;
      }
      if ((v.phase === 'buy' || v.phase === 'upgrade') && v.turn === v.seat) {
        const t = R().BOARD[v.pending.tile]; const name = R().tileName(v.theme, t.i);
        const cost = v.phase === 'buy' ? t.price : t.up; const lv = v.levels[t.i];
        const rentNow = Math.round(t.price * R().RENT_MUL[v.phase === 'buy' ? 0 : lv + 1] * (v.infl || 1));
        m.hidden = false; m.onclick = null;
        m.innerHTML = `<div class="mm-card"><div class="tile-chip" style="background:${t.color}"></div><h3>${U.esc(name)}</h3>
          <p>${v.phase === 'buy' ? `要買下這塊地嗎？` : `要升級到 Lv${lv + 1} 嗎？`}</p>
          <p class="big">${fmt(cost)} ${th.unit}</p><p class="hint">買了之後別人踩到要付 ${fmt(rentNow)} ${th.unit}（同色兩塊都是你的，空地租金加倍）</p>
          <div class="act-row"><button class="btn ghost" data-y="0">不要</button><button class="btn" data-y="1">${v.phase === 'buy' ? '買！' : '蓋！'}</button></div>
          <span class="timer" data-deadline="${v.deadline}"></span></div>`;
        m.querySelectorAll('[data-y]').forEach(b => b.onclick = () => { this.ui.send({ type: v.phase, yes: b.dataset.y === '1' }); m.hidden = true; });
      } else if (v.phase === 'gate' && v.turn === v.seat) {
        m.hidden = true; this.gateBar(true); return;
      } else if (v.phase === 'buyout' && v.turn === v.seat) {
        const pd = v.pending, t = R().BOARD[pd.tile]; const name = R().tileName(v.theme, t.i);
        m.hidden = false; m.onclick = null;
        m.innerHTML = `<div class="mm-card"><div class="tile-chip" style="background:${t.color}"></div><h3>${U.esc(name)}</h3>
          <p>要從 ${this.who(pd.from)} 手上<b>強制收購</b>這塊地嗎？</p>
          <p class="big">${fmt(pd.cost)} ${th.unit}</p><p class="hint">錢會付給原地主，建築 Lv${v.levels[t.i]} 一起歸你。收購後 3 回合內別人不能再收購。</p>
          <div class="act-row"><button class="btn ghost" data-y="0">不要</button><button class="btn" data-y="1">收購！</button></div>
          <span class="timer" data-deadline="${v.deadline}"></span></div>`;
        m.querySelectorAll('[data-y]').forEach(b => b.onclick = () => { this.ui.send({ type: 'buyout', yes: b.dataset.y === '1' }); m.hidden = true; });
      } else if (!m.querySelector('.tinfo')) m.hidden = true;
    },
    // 星門：選目的地（點地圖上的格子，或用下拉選單）
    gateBar(on) {
      const st = this.el.querySelector('.mono-stage'); let bar = st.querySelector('.gate-bar');
      if (!on) { if (bar) bar.remove(); return; }
      if (bar) return; const v = this.v;
      bar = document.createElement('div'); bar.className = 'gate-bar';
      bar.innerHTML = `<b>🌀 星門啟動：點地圖上任一格，或從選單挑</b><div class="gate-row"><select>${R().BOARD.map(t => `<option value="${t.i}">${U.esc(R().tileName(v.theme, t.i))}${t.type === 'prop' ? (v.owners[t.i] === v.seat ? '（我的 Lv' + v.levels[t.i] + '）' : v.owners[t.i] >= 0 ? '（' + U.esc(v.names[v.owners[t.i]]) + '）' : '（空地 ' + fmt(t.price) + '）') : ''}</option>`).join('')}</select><button class="btn sm">傳送</button></div><span class="timer" data-deadline="${v.deadline}"></span>`;
      st.appendChild(bar);
      bar.querySelector('button').onclick = () => this.pickGate(+bar.querySelector('select').value);
    },
    pickGate(i) {
      const bar = this.el.querySelector('.gate-bar'); const sel = bar && bar.querySelector('select');
      if (sel && String(sel.value) !== String(i)) { sel.value = i; if (this.board) this.board.focusTile && this.board.focusTile(i); this.ui.toast('再按一次「傳送」確認'); return; }
      this.ui.send({ type: 'gate', to: i }); this.gateBar(false);
    },
    // 全螢幕 3 秒星門穿越動畫（光帶隧道＋行星被拉長）
    stargate() {
      return new Promise(res => {
        SFX.warp(); if (this.board) this.board.paused = true; // 動畫期間暫停 3D，手機比較順
        const cv = document.createElement('canvas'); cv.className = 'stargate'; document.body.appendChild(cv);
        const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr, g = cv.getContext('2d');
        const cx = W / 2, cy = H / 2, R0 = Math.min(W, H) * 0.32, D = Math.hypot(W, H) / 2;
        const PAL = ['#ff4fa3', '#39e8ff', '#ffb347', '#a66bff', '#7dffb0', '#ffffff'];
        const P = Array.from({ length: 520 }, () => ({ a: Math.random() * 6.283, z: Math.random(), c: PAL[Math.floor(Math.random() * PAL.length)], w: 1 + Math.random() * 2.5 }));
        const planets = Array.from({ length: 5 }, (_, k) => ({ a: Math.random() * 6.283, z: 1 + k * 0.25, c: PAL[k % 5], r: 0.08 + Math.random() * 0.08 }));
        const t0 = performance.now(), T = 3000;
        const frame = () => {
          const ms = performance.now() - t0, k = ms / T;
          g.globalCompositeOperation = 'source-over';
          if (k < 0.17) { // 石環啟動，符文依序亮起
            const f = k / 0.17; g.fillStyle = `rgba(4,2,14,${0.5 + f * 0.5})`; g.fillRect(0, 0, W, H);
            const ig = g.createRadialGradient(cx, cy, 0, cx, cy, R0); ig.addColorStop(0, `rgba(120,220,255,${f * 0.9})`); ig.addColorStop(0.7, `rgba(60,90,255,${f * 0.6})`); ig.addColorStop(1, 'rgba(20,10,60,0)');
            g.fillStyle = ig; g.beginPath(); g.arc(cx, cy, R0, 0, 6.283); g.fill();
            g.lineWidth = R0 * 0.16; g.strokeStyle = '#6d6a78'; g.beginPath(); g.arc(cx, cy, R0 * 1.08, 0, 6.283); g.stroke();
            g.lineWidth = R0 * 0.03; g.strokeStyle = '#3d3a48'; g.beginPath(); g.arc(cx, cy, R0 * 1.0, 0, 6.283); g.stroke();
            for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 - 1.571 + f * 0.6, lit = f * 9 > i; g.save(); g.translate(cx + Math.cos(a) * R0 * 1.08, cy + Math.sin(a) * R0 * 1.08); g.rotate(a + 1.571); g.fillStyle = lit ? '#ffb347' : '#2a2834'; if (lit) { g.shadowColor = '#ff8a00'; g.shadowBlur = 30 * dpr; } g.beginPath(); g.moveTo(-R0 * 0.07, -R0 * 0.07); g.lineTo(R0 * 0.07, -R0 * 0.07); g.lineTo(0, R0 * 0.07); g.closePath(); g.fill(); g.restore(); }
          } else if (k < 0.83) { // 光帶隧道
            const f = (k - 0.17) / 0.66, sp = 0.004 + f * f * 0.05;
            g.fillStyle = 'rgba(6,2,20,0.28)'; g.fillRect(0, 0, W, H);
            const rot = f * f * 2.4;
            g.globalCompositeOperation = 'lighter';
            for (const p of P) {
              const z0 = p.z; p.z -= sp * (0.6 + p.w * 0.25); if (p.z <= 0.02) { p.z += 1; continue; }
              const r0 = D * 0.06 / z0, r1 = D * 0.06 / p.z, a = p.a + rot;
              g.strokeStyle = p.c; g.lineWidth = p.w * dpr * (0.5 + 1 / p.z * 0.08); g.globalAlpha = Math.min(1, 0.25 + (1 - p.z));
              g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke();
            }
            for (const pl of planets) { // 行星被拉長成彩色線
              pl.z -= sp * 0.9; if (pl.z <= 0.05) pl.z += 1.3;
              const r1 = D * 0.08 / pl.z, r0 = r1 * (1 - Math.min(0.85, sp * 18)), a = pl.a + rot;
              g.globalAlpha = 0.8; g.strokeStyle = pl.c; g.lineCap = 'round'; g.lineWidth = Math.max(2, pl.r * r1);
              g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke();
            }
            g.globalAlpha = 1; const core = g.createRadialGradient(cx, cy, 0, cx, cy, D * 0.12 * (1 + f)); core.addColorStop(0, 'rgba(255,255,255,0.9)'); core.addColorStop(1, 'rgba(160,120,255,0)');
            g.fillStyle = core; g.beginPath(); g.arc(cx, cy, D * 0.12 * (1 + f), 0, 6.283); g.fill();
          } else { // 白光一閃後淡出
            const f = (k - 0.83) / 0.17; g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); cv.style.opacity = String(Math.max(0, 1 - f * 1.2));
          }
          g.globalAlpha = 1;
          if (ms < T) requestAnimationFrame(frame); else { cv.remove(); if (this.board) this.board.paused = false; res(); }
        };
        requestAnimationFrame(frame);
      });
    },
    // ===== 翻盤問答：破產者 vs 收錢者搶答，大家都看得到 =====
    quizUI(pd, res) {
      const v = this.v, box = this.el.querySelector('.mono-quiz'); if (!box) return;
      const me = v.seat, mine = (me === pd.debtor || me === pd.cred) && !res, ans = (res ? res.ans : pd.ans) || {}, th = TH()[v.theme];
      const answered = (s) => ans[s] != null, key = res ? res.key : -1;
      const sig = JSON.stringify([pd.q, ans, key]); if (!box.hidden && box.dataset.sig === sig) return; box.dataset.sig = sig;
      box.hidden = false;
      const who = (s, tag) => `<div class="qz-p ${answered(s) ? 'done' : ''}">${this.faceHTML(v, s, 44)}<b>${U.esc(v.names[s])}</b><small>${tag}${answered(s) ? ' ✓ 已作答' : ''}</small></div>`;
      box.innerHTML = `<div class="qz-card">
        <div class="qz-top"><span>⚔️ 翻盤問答</span><span class="timer" data-deadline="${res ? '' : v.deadline}"></span></div>
        <div class="qz-vs">${who(pd.debtor, '破產危機')}<em>VS</em>${who(pd.cred, '收錢的人')}</div>
        <div class="qz-bar"><i style="animation-duration:${res ? 0 : Math.max(0.5, (v.deadline - this.now()) / 1000)}s"></i></div>
        <p class="qz-q">${U.esc(pd.q)}</p>
        <div class="qz-opts">${pd.opts.map((o, i) => { const st = res ? (i === key ? 'ok' : 'ng') : (ans[me] && ans[me].c === i ? 'pick' : '');
          const heads = Object.entries(ans).filter(([, a]) => a.c === i).map(([s]) => this.faceHTML(v, +s, 26)).join('');
          return `<button class="qz-o ${st}" data-c="${i}" ${mine && !answered(me) ? '' : 'disabled'}><span>${'ABCD'[i]}</span>${U.esc(o)}<i>${heads}</i></button>`; }).join('')}</div>
        <p class="qz-tip">${res ? (res.win ? `🎉 ${U.esc(v.names[pd.debtor])} 翻盤成功！不用付 ${fmt(pd.amt)} ${th.unit}` : `💀 ${U.esc(v.names[pd.debtor])} 翻盤失敗……`) : mine ? (answered(me) ? '已送出，等對方……' : '搶答！比對方先答對就贏') : `賭注：${fmt(pd.amt)} ${th.unit} 過路費・破產者答對而且比收錢者快，就免付、不出局`}</p></div>`;
      box.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { if (b.disabled) return; this.ui.send({ type: 'answer', c: +b.dataset.c }); box.querySelectorAll('[data-c]').forEach(x => x.disabled = true); b.classList.add('pick'); SFX.step(); });
    },
    now() { try { return root.Room && root.Room.serverNow ? root.Room.serverNow() : Date.now(); } catch (e) { return Date.now(); } },
    async quizReveal(e) {
      this._revealing = true;
      this.quizUI({ debtor: e.debtor, cred: e.cred, q: e.q, opts: e.opts, amt: e.amt }, e);
      if (e.win) { SFX.glory(); this.vfx('glory'); this.board && this.board.mood(e.debtor, 'joy', 2000); this.board && this.board.mood(e.cred, 'sad', 2000); }
      else { SFX.doom(); this.board && this.board.mood(e.debtor, 'scared', 2500); }
      await sleep(3200);
      this._revealing = false; const qz = this.el && this.el.querySelector('.mono-quiz'); if (qz) qz.hidden = true;
    },
    // 全螢幕畫布動畫的共用外框
    overlay(T, draw, sound) {
      return new Promise(res => {
        sound && sound(); if (this.board) this.board.paused = true;
        const cv = document.createElement('canvas'); cv.className = 'stargate'; document.body.appendChild(cv);
        const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr, g = cv.getContext('2d');
        const t0 = performance.now();
        const frame = () => { const ms = performance.now() - t0; draw(g, W, H, dpr, ms / 1000, ms / T); cv.style.opacity = String(Math.min(1, ms / 250, (T - ms) / 300));
          if (ms < T) requestAnimationFrame(frame); else { cv.remove(); if (this.board) this.board.paused = false; res(); } };
        requestAnimationFrame(frame);
      });
    },
    // ===== 動物星球彩蛋：動物大遷徙（約 4.5 秒） =====
    migration() {
      const L = [], rnd = (a, b) => a + Math.random() * (b - a);
      [[0.6, 0.45, 0.42, 90], [0.7, 0.75, 0.6, 70], [0.84, 1.2, 0.85, 42]].forEach(([y, sc, sp, n], li) => { for (let k = 0; k < n; k++) L.push({ li, y: y + rnd(-0.05, 0.05), sc: sc * rnd(0.85, 1.15), sp: sp * rnd(0.9, 1.1), x0: rnd(-1.9, 0.15), ph: rnd(0, 6.28), ty: Math.random() < 0.55 ? 0 : Math.random() < 0.6 ? 1 : 2 }); });
      L.sort((a, b) => a.y - b.y);
      const trees = Array.from({ length: 5 }, () => ({ x: rnd(0, 1), s: rnd(0.7, 1.3) }));
      const beast = (g, x, y, s, ty, ph, li) => {
        const bob = -Math.abs(Math.sin(ph)) * (ty === 2 ? 10 : 3) * s; g.save(); g.translate(x, y + bob); g.scale(s, s);
        const shade = [['#6a4a48', '#c9b8b0', '#b07a5a'], ['#463430', '#e2d9cc', '#bf8452'], ['#2e2824', '#f1ede2', '#c98a4b']][li][ty];
        // 腳（奔跑擺動）
        g.strokeStyle = ty === 1 ? '#2a2622' : shade; g.lineCap = 'round'; g.lineWidth = ty === 2 ? 2.2 : 3;
        [[-11, 0], [-7, 1.6], [7, 3.1], [11, 4.7]].forEach(([hx, o]) => { const a = Math.sin(ph + o) * 0.75; g.beginPath(); g.moveTo(hx, -9); const kx = hx + Math.sin(a) * 6, ky = -3; g.lineTo(kx, ky); g.lineTo(kx + Math.sin(a * 1.4 - 0.4) * 6, 4); g.stroke(); });
        g.fillStyle = shade;
        if (ty === 0) { // 角馬：前高後低、駝背、鬍鬚、彎角
          g.beginPath(); g.ellipse(-2, -12, 15, 7.5, -0.12, 0, 7); g.fill(); g.beginPath(); g.ellipse(8, -15, 8, 7.5, 0, 0, 7); g.fill();
          g.beginPath(); g.moveTo(12, -19); g.lineTo(21, -17); g.lineTo(25, -8); g.lineTo(19, -7); g.lineTo(13, -9); g.closePath(); g.fill();
          g.strokeStyle = '#d8cfbf'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(20, -18); g.quadraticCurveTo(17, -25, 23, -24); g.moveTo(22, -17); g.quadraticCurveTo(26, -23, 29, -20); g.stroke();
          g.strokeStyle = '#1a1512'; g.lineWidth = 2; g.beginPath(); g.moveTo(19, -8); g.lineTo(18, -3); g.moveTo(-17, -12); g.quadraticCurveTo(-22, -10 + Math.sin(ph * 2) * 3, -21, -4); g.stroke();
        } else if (ty === 1) { // 斑馬：白底黑條紋、立起的鬃毛
          g.beginPath(); g.ellipse(0, -12, 15, 7, 0, 0, 7); g.fill();
          g.beginPath(); g.moveTo(10, -16); g.lineTo(18, -24); g.lineTo(25, -20); g.lineTo(26, -15); g.lineTo(20, -14); g.lineTo(14, -9); g.closePath(); g.fill();
          g.save(); g.beginPath(); g.ellipse(0, -12, 15, 7, 0, 0, 7); g.moveTo(10, -16); g.lineTo(18, -24); g.lineTo(25, -20); g.lineTo(26, -15); g.lineTo(20, -14); g.lineTo(14, -9); g.clip();
          g.strokeStyle = '#1f1c19'; g.lineWidth = 1.8; for (let k = -16; k < 28; k += 3.6) { g.beginPath(); g.moveTo(k, -26); g.quadraticCurveTo(k + 2, -12, k - 1, -3); g.stroke(); } g.restore();
          g.strokeStyle = '#1f1c19'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(11, -17); g.lineTo(18, -25); g.stroke(); g.beginPath(); g.moveTo(-15, -12); g.lineTo(-20, -6 + Math.sin(ph * 2) * 2); g.stroke();
        } else { // 羚羊：細長、跳躍、白肚子、直角
          g.beginPath(); g.ellipse(0, -13, 12, 5.5, -0.1, 0, 7); g.fill(); g.fillStyle = '#f4ead8'; g.beginPath(); g.ellipse(0, -10.5, 9, 2.5, 0, 0, 7); g.fill(); g.fillStyle = shade;
          g.beginPath(); g.moveTo(8, -15); g.lineTo(14, -25); g.lineTo(20, -24); g.lineTo(19, -21); g.lineTo(12, -13); g.closePath(); g.fill();
          g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(15, -25); g.lineTo(13, -33); g.moveTo(17, -25); g.lineTo(17, -33); g.stroke();
        }
        g.restore();
      };
      const dust = Array.from({ length: 26 }, () => ({ x: rnd(-0.3, 1.1), y: rnd(0.55, 0.92), r: rnd(0.08, 0.2), sp: rnd(0.25, 0.5) }));
      return this.overlay(4600, (g, W, H, dpr, t, k) => {
        const shake = Math.min(1, t) * 3 * dpr; g.save(); g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        const sky = g.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, '#5a3a78'); sky.addColorStop(0.45, '#e8706a'); sky.addColorStop(1, '#ffc46b'); g.fillStyle = sky; g.fillRect(-20, -20, W + 40, H + 40);
        g.fillStyle = 'rgba(255,236,170,0.95)'; g.beginPath(); g.arc(W * 0.7, H * 0.5, Math.min(W, H) * 0.16, 0, 6.283); g.fill();
        g.fillStyle = '#7a4a5a'; g.beginPath(); g.moveTo(0, H * 0.56); for (let x = 0; x <= W; x += W / 12) g.lineTo(x, H * (0.52 + Math.sin(x / W * 9) * 0.02)); g.lineTo(W, H); g.lineTo(0, H); g.fill();
        trees.forEach(tr => { const x = tr.x * W, y = H * 0.565, s2 = tr.s * W / 400; g.fillStyle = '#3a2430'; g.fillRect(x - 2 * s2, y - 40 * s2, 4 * s2, 40 * s2); g.beginPath(); g.ellipse(x, y - 42 * s2, 30 * s2, 7 * s2, 0, 0, 7); g.fill(); });
        const gr = g.createLinearGradient(0, H * 0.56, 0, H); gr.addColorStop(0, '#c98a52'); gr.addColorStop(1, '#8a5a32'); g.fillStyle = gr; g.fillRect(-20, H * 0.565, W + 40, H);
        const u = W / 390;
        L.forEach(a => { const x = (a.x0 + a.sp * t) * W * 0.9; if (x < -60 * u || x > W + 60 * u) return; beast(g, x, a.y * H, a.sc * u * 2.3, a.ty, a.ph + t * (a.ty === 2 ? 12 : 16), a.li);
          if (a.li === 2 && Math.random() < 0.12) { g.fillStyle = 'rgba(210,170,120,0.35)'; g.beginPath(); g.arc(x - 10 * u, a.y * H + 4 * u, rnd(4, 10) * u, 0, 6.283); g.fill(); } });
        dust.forEach(d => { const x = ((d.x + d.sp * t) % 1.4) * W, y = d.y * H, r = d.r * W; const dg = g.createRadialGradient(x, y, 0, x, y, r); dg.addColorStop(0, 'rgba(225,180,130,0.32)'); dg.addColorStop(1, 'rgba(225,180,130,0)'); g.fillStyle = dg; g.fillRect(x - r, y - r, 2 * r, 2 * r); });
        if (t < 2.2) { g.globalAlpha = Math.min(1, t * 3, (2.2 - t) * 3); g.fillStyle = '#fff'; g.strokeStyle = 'rgba(60,30,20,0.8)'; g.lineWidth = 6 * dpr; g.font = `900 ${34 * dpr}px system-ui, sans-serif`; g.textAlign = 'center'; g.strokeText('🦓 動物大遷徙！', W / 2, H * 0.22); g.fillText('🦓 動物大遷徙！', W / 2, H * 0.22); g.globalAlpha = 1; }
        g.restore();
      }, () => SFX.stampede());
    },
    // ===== 動物星球彩蛋：迷因貓轉圈圈（約 3.6 秒，自己畫的貓） =====
    catSpin() {
      const cat = (g, s, back) => { // 坐著的灰色虎斑貓，正面張嘴；轉到背面時看到背和尾巴
        g.save(); g.scale(s, s);
        g.fillStyle = '#9a9aa2'; g.beginPath(); g.ellipse(0, 40, 46, 52, 0, 0, 7); g.fill(); // 身體
        if (back) { g.strokeStyle = '#9a9aa2'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, 80); g.quadraticCurveTo(70, 70, 55, 10); g.stroke(); }
        else { g.fillStyle = '#f2f0ec'; g.beginPath(); g.ellipse(0, 52, 26, 36, 0, 0, 7); g.fill(); }
        g.fillStyle = '#b0b0b8'; g.beginPath(); g.ellipse(0, -30, 44, 38, 0, 0, 7); g.fill(); // 頭
        [-1, 1].forEach(sd => { g.fillStyle = '#9a9aa2'; g.beginPath(); g.moveTo(sd * 40, -40); g.lineTo(sd * 32, -82); g.lineTo(sd * 10, -62); g.fill(); if (!back) { g.fillStyle = '#e8b0b8'; g.beginPath(); g.moveTo(sd * 33, -46); g.lineTo(sd * 29, -72); g.lineTo(sd * 15, -60); g.fill(); } });
        g.strokeStyle = '#6a6a72'; g.lineWidth = 4; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(k * 12, -66); g.lineTo(k * 10, -48); g.stroke(); }
        if (!back) {
          [-1, 1].forEach(sd => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(sd * 17, -36, 11, 12, 0, 0, 7); g.fill(); g.fillStyle = '#2a8a3a'; g.beginPath(); g.ellipse(sd * 17, -35, 7, 9, 0, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.ellipse(sd * 17, -35, 2.5, 8, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(sd * 17 + 3, -39, 2.5, 0, 7); g.fill(); });
          g.fillStyle = '#e88a9a'; g.beginPath(); g.moveTo(-5, -20); g.lineTo(5, -20); g.lineTo(0, -15); g.fill();
          g.fillStyle = '#5a1a24'; g.beginPath(); g.ellipse(0, -5, 10, 12 + Math.sin(performance.now() / 60) * 4, 0, 0, 7); g.fill(); // 張大嘴「喔～」
          g.fillStyle = '#e86a7a'; g.beginPath(); g.ellipse(0, 1, 6, 4, 0, 0, 7); g.fill();
          g.strokeStyle = '#e8e8ea'; g.lineWidth = 1.5; [-1, 1].forEach(sd => { for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(sd * 14, -14 + k * 4); g.lineTo(sd * 46, -20 + k * 7); g.stroke(); } });
        }
        g.restore();
      };
      return this.overlay(3600, (g, W, H, dpr, t) => {
        const ang = t * t * 9 + t * 4; // 越轉越快
        g.fillStyle = '#1a1030'; g.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H * 0.5, R = Math.hypot(W, H);
        for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283 + t * 1.5; g.fillStyle = `hsl(${(k * 20 + t * 240) % 360},90%,60%)`; g.globalAlpha = 0.55; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a, a + 6.283 / 36); g.fill(); }
        g.globalAlpha = 1;
        const sx = Math.cos(ang), s = Math.min(W, H) / 260 * (1 + Math.sin(t * 6) * 0.03);
        g.save(); g.translate(cx, cy + Math.sin(t * 12) * 4 * dpr); g.scale(sx >= 0 ? Math.max(0.04, sx) : Math.min(-0.04, sx), 1); cat(g, s, sx < 0); g.restore();
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(cx, cy + 100 * s, 60 * s * Math.abs(sx) + 20 * s, 10 * s, 0, 0, 7); g.fill();
        g.font = `900 ${30 * dpr}px system-ui, sans-serif`; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 5 * dpr;
        const txt = ['喔', '咿', '咿', '啊', '咿'][Math.floor(ang / Math.PI) % 5] + '～'; g.strokeText(txt, cx, H * 0.18); g.fillText(txt, cx, H * 0.18);
        if (t > 2.8) { g.fillStyle = `rgba(255,255,255,${(t - 2.8) * 1.2})`; g.fillRect(0, 0, W, H); }
      }, () => SFX.oiia());
    },
    tileInfo(i) {
      const v = this.v; if (!v || this.playing) return; const t = R().BOARD[i]; const th = TH()[v.theme];
      const m = this.el.querySelector('.mono-modal'); if (!m.hidden && !m.querySelector('.tinfo')) return;
      let body = '';
      if (t.type === 'prop') {
        const o = v.owners[i]; const lv = v.levels[i];
        body = `<p>${o >= 0 ? `地主：${this.faceHTML(v, o, 22)} ${U.esc(v.names[o])}　建築 Lv${lv}` : `空地，售價 ${fmt(t.price)} ${th.unit}`}</p>
          <p class="hint">過路費：${[0, 1, 2, 3, 4].map(k => `Lv${k} ${fmt(Math.round(t.price * R().RENT_MUL[k] * (v.infl || 1)))}`).join('、')}${v.infl > 1 ? `（已含漲價 ×${v.infl.toFixed(1)}）` : ''}<br>升級一次 ${fmt(t.up)} ${th.unit}${o >= 0 && lv < 4 ? `<br>收購價 ${fmt(R().buyoutOf({ levels: v.levels }, i))}` : ''}</p>`;
      } else body = `<p class="hint">${{ start: `經過或停在這裡領 ${fmt(R().START_BONUS)} ${th.unit}`, jail: '只是路過就沒事；被抓進來要停一回合', free: '休息一下，什麼事都不會發生', gotojail: `直接送進${th.corners.jail}`, luck: '抽一張好運卡', bad: '抽一張厄運卡', tax: '繳總資產的 6%（最少 2,000）', teleport: '隨機傳送到任一塊地' }[t.type]}</p>`;
      m.hidden = false;
      m.innerHTML = `<div class="mm-card tinfo">${t.type === 'prop' ? `<div class="tile-chip" style="background:${t.color}"></div>` : ''}<h3>${U.esc(R().tileName(v.theme, i))}</h3>${body}<button class="btn sm" data-x>關閉</button></div>`;
      m.onclick = (e) => { if (e.target.closest('[data-x]') || e.target === m) { m.hidden = true; this.showPrompt(); } };
    }
  };
  if (typeof document !== 'undefined') ['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, () => { if (!SFX.ctx || SFX.ctx.state !== 'running') SFX.unlock(); }, { passive: true }));
  root.GAMES.monopoly = M;
})(typeof window !== 'undefined' ? window : globalThis);
