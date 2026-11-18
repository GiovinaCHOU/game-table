// 大富翁：遊戲模組（規則在 mono-rules.js，3D 在 mono3d.js）
(function (root) {
  try { if (/[?&]pix=1/.test(location.search)) root.__pix = true; } catch (e) {}
  try { if (/[?&]pixenv=1/.test(location.search)) localStorage.removeItem('mono-pixenv'); if (/[?&]pixenv=0/.test(location.search)) localStorage.setItem('mono-pixenv', '0'); } catch (e) {} // 怪奇小鎮環境：預設像素，?pixenv=0 切回 3D
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
    thunder() { this.noise(0.12, { f: 3000, type: 'highpass', vol: 0.25, attack: 0.002 }); this.noise(1.6, { f: 220, vol: 0.2, attack: 0.02, delay: 0.05 }); this.tone(50, 1.2, { type: 'sine', vol: 0.15, glide: 32, delay: 0.05 }); },
    charge() { this.tone(200, 1.0, { type: 'sawtooth', vol: 0.04, lp: 2500, glide: 1400, attack: 0.1 }); this.tone(203, 1.0, { type: 'square', vol: 0.02, lp: 1800, glide: 1420, attack: 0.1 }); },
    laser() { this.tone(1800, 0.22, { type: 'sawtooth', vol: 0.06, lp: 5000, glide: 220, attack: 0.002, wet: 0.3 }); this.noise(0.12, { f: 2400, type: 'bandpass', q: 1.5, vol: 0.06, attack: 0.002 }); },
    disint() { for (let i = 0; i < 14; i++) this.tone(600 + Math.random() * 2400, 0.08, { type: 'square', vol: 0.025, delay: i * 0.05, lp: 4000 }); this.noise(1.0, { f: 5000, type: 'highpass', vol: 0.04, attack: 0.3 }); },
    void_() { this.tone(110, 3.5, { type: 'sine', vol: 0.06, glide: 55, attack: 0.3 }); this.tone(165, 3.5, { type: 'sine', vol: 0.03, glide: 82, attack: 0.3 }); },
    clash() { this.noise(0.25, { f: 1200, type: 'bandpass', q: 0.8, vol: 0.25, attack: 0.002 }); this.tone(70, 0.8, { type: 'sine', vol: 0.18, glide: 35 }); this.tone(1400, 0.4, { type: 'triangle', vol: 0.05, glide: 900, wet: 0.6 }); },
    shimmer() { [0, 0.3, 0.6, 0.9, 1.2, 1.6, 2.0, 2.4].forEach((d, i) => this.tone([523, 659, 784, 988, 1175, 1319, 1568, 1760][i], 1.6, { type: 'sine', vol: 0.035, delay: d, attack: 0.2, wet: 0.8 })); this.tone(130, 4.5, { type: 'sine', vol: 0.05, attack: 1 }); },
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
    desc: '擲骰子走格子，買地、蓋房子，別人踩到要付過路費。付完過路費可以花 1.4 倍價錢強制收購那塊地（地標不行）。落後的人經過起點多領補助，稅金越有錢、房子越多繳越多。錢不夠會自動賣房賣地，賣光就破產。結束時比「總資產」＝現金＋地價＋建築。',
    options: [
      { key: 'theme', label: '主題', choices: [['ragnarok', '⚡ 諸神黃昏'], ['cyber', '🌃 夜城'], ['animal', '🦁 動物星球'], ['buddha', '🪷 神佛之境'], ['magic', '🔮 魔法學院'], ['town', '🚲 怪奇小鎮'], ['alien', '🌌 深空異種']], def: 'ragnarok' },
      { key: 'layout', label: '地圖排列', choices: [['random', '每局隨機（角落不動、同色地相連）'], ['fixed', '固定']], def: 'random' },
      { key: 'cash', label: '起始資金', choices: [[50000, '50,000'], [30000, '30,000'], [80000, '80,000']], def: 50000 },
      { key: 'rounds', label: '遊戲長度', choices: [[0, '任何一人破產就結束（約 35～50 分）'], [12, '12 回合（約 10 分）'], [24, '24 回合（約 20 分）'], [36, '36 回合（約 30 分）'], [999, '打到剩一人']], def: 0 }
    ],
    init(n, o, names, now) { return R().init(n, o, now); },
    action(st, seat, a, ctx) {
      if (seat < 0) return 'silent';
      return R().act(st, seat, a, ctx.now);
    },
    tick(st, now) {
      if (!st.deadline || now <= st.deadline || st.phase === 'over') return false;
      if (st.phase === 'passbuild') { R().act(st, st.turn, { type: 'passbuild', to: -1 }, now); return true; } // 真人逾時：這次不蓋，不幫他花錢
      const w = R().autoAct(st); if (!w) return false;
      R().act(st, w.seat < 0 ? 0 : w.seat, w.a, now); return true;
    },
    // 動畫還在播的時候，電腦／託管先不要出手（不然畫面會跟不上，角色會倒退再往前）
    busy(st, now) { return !!st.animAt && now < st.animAt + (st.anim || 0) + 900; },
    auto(st, isAuto) {
      // 選角色階段：電腦／託管的玩家自動挑一個還沒被選走的角色
      if (st.phase === 'pick' && isAuto) {
        const th = TH()[st.theme]; const s = st.players.findIndex((p, k) => !p.char && isAuto(k));
        if (s >= 0) { const used = new Set(st.players.filter(p => p.char && p.char.kind === 'preset').map(p => p.char.i)); const free = th.chars.map((_, i) => i).filter(i => !used.has(i)); return { seat: s, a: { type: 'pick', i: free[(s * 3 + st.n) % free.length] } }; } // 不能用亂數：同一個決定要維持穩定，系統才會在等待後出手
        return null;
      }
      const w = R().autoAct(st); return w && w.seat >= 0 ? w : null; },
    view(st, seat) {
      return {
        theme: st.theme, layout: st.layout, phase: st.phase, turn: st.turn, round: st.round, maxRounds: st.maxRounds, deadline: st.deadline,
        players: st.players.map((p, k) => ({ cash: p.cash, pos: p.pos, alive: p.alive, skip: p.skip, immune: p.immune, jailfree: p.jailfree, char: p.char, evolved: !!p.evolved, trance: !!p.trance, curse: p.curse || 0, freeRent: p.freeRent || 0, frog: !!p.frog, items: k === seat ? (p.items || []) : (p.items || []).map(() => '?'), invest: (p.invest || []).slice(), usedItem: !!p.usedItem })),
        assets: st.players.map((p, s) => R().assets(st, s)), infl: R().inflation(st),
        owners: st.owners, levels: st.levels, ev: (st.ev || []).map(e => e.t === 'getitem' && e.seat !== seat ? { t: 'getitem', seat: e.seat, amt: e.amt ? 1 : 0 } : e), evId: st.evId,
        pending: st.phase === 'shop' && st.turn !== seat ? { shop: true } : st.pending, dice: st.dice, winner: st.winner, ranks: st.ranks, endWhy: st.endWhy
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
      R().useLayout(v.layout);
      if (v.seat >= 0 && v.turn === v.seat && ['buy', 'upgrade', 'buyout', 'shop', 'gate'].includes(v.phase)) { const k = v.evId + ':' + v.phase; if (this._decKey !== k) { this._decKey = k; this._decAt = Date.now(); } }
      this.ui = ui; this.v = v;
      const lk = (v.layout || []).join(','); // 這局的地圖排列（每個玩家畫面都要先切過來）
      if (el.dataset.g !== 'monopoly' || this._theme !== v.theme || this._layoutKey !== lk) { this._layoutKey = lk; this.build(el, v); }
      el.classList.toggle('dim-bg', false);
      this.renderHud(); this.renderPick();
      if (v.phase === 'pick') { this.showPrompt(); return; }
      if (!this.board || !this.board.ready) { this._pendingSync = true; return; }
      if (v.evId !== this._evId) {
        const evs = v.ev.slice(); this._evId = v.evId; this._backlog = (this._backlog || 0) + 1;
        // 還有後面的動畫在排隊時，不要先把棋子擺到最新位置（不然會先跳過去、再倒退重播）
        const gen = this._gen;
        this.queue = this.queue.then(() => gen === this._gen ? this.play(evs) : null).then(() => { this._backlog--; return this._backlog ? null : this.holdCam(); }).then(() => { if (!this._backlog) this.syncBoard(); }).catch(e => { this._backlog = Math.max(0, this._backlog - 1); console.error(e); });
      } else if (!this.playing) this.syncBoard();
      this.queue.then(() => { if (!this._backlog) this.showPrompt(); });
    },
    destroy() { this._gen = (this._gen || 0) + 1; this._backlog = 0; if (this.board) this.board.dispose(); if (this._booting) this._booting.dispose(); this.board = null; this._theme = null; },
    build(el, v) {
      if (this.board) this.board.dispose();
      this.board = null; this._theme = v.theme; this._evId = v.evId; this.queue = Promise.resolve(); this._backlog = 0; this.playing = false;
      el.dataset.g = 'monopoly';
      const th = TH()[v.theme];
      el.innerHTML = `
        <div class="mono mono-${v.theme}">
          <div class="mono-hud"></div>
          <div class="mono-stage"><div class="mono-loading">${th.icon} 載入 3D 場景中…</div><div class="mono-fx"></div>
            <div class="mono-items"></div><div class="mono-dice"><div class="dice-faces"><span class="d6">?</span><span class="d6">?</span></div><button class="go-btn" disabled>GO</button></div>
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
      el.querySelector('.go-btn').onclick = () => { if (!this.canAct('roll')) return; if (this.v.players[this.v.seat].trance) return this.diceBar(true); this.ui.send({ type: 'roll' }); el.querySelector('.go-btn').disabled = true; SFX.dice(); };
      el.querySelector('[data-t="me"]').onclick = () => { if (this.board && this.v.seat >= 0) this.board.focusSeat(this.v.seat, true); };
      el.querySelector('[data-t="all"]').onclick = () => { if (this.board) this.board.overview(); };
      el.querySelector('[data-t="q"]').onclick = (e) => { const nq = this.quality() === 'high' ? 'low' : 'high'; try { localStorage.setItem('mono-q', nq); } catch (x) {} e.target.textContent = nq === 'high' ? '高' : '低'; if (this.board && this.board.setQuality) this.board.setQuality(nq === 'high'); this.ui.toast(nq === 'high' ? '高畫質：更清晰、有陰影（比較耗電）' : '省電畫質：解析度低一點、沒有陰影'); };
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { if (!this.board) return; const c = b.dataset.c; if (c === 'tu') this.board.nudge('tilt', -0.25); if (c === 'td') this.board.nudge('tilt', 0.25); if (c === 'zi') this.board.nudge('zoom', 0.8); if (c === 'zo') this.board.nudge('zoom', 1.25); });
      el.querySelector('[data-t="sfx"]').onclick = (e) => { SFX.on = !SFX.on; e.target.textContent = SFX.on ? '🔊' : '🔇'; try { localStorage.setItem('mono-sfx', SFX.on ? '1' : '0'); } catch (x) {} };
      const stage = el.querySelector('.mono-stage');
      const b = new root.MonoBoard3D();
      b.init(stage, v.theme, R()).then(() => {
        b.ready = true; this.board = b; try { const an = Math.min(8, b.renderer.capabilities.getMaxAnisotropy()); b.scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { if (m.map) { m.map.anisotropy = an; m.map.needsUpdate = true; } }); }); } catch (e) {} /* 斜看的格子文字比較不糊 */ stage.querySelector('.mono-loading').remove();
        // 測試房預覽彩蛋：網址加 &egg=ghost（或 sync、trance、birds、hell…）進遊戲 3 秒後播放一次
        try { const ek = new URLSearchParams(location.search).get('egg'), rm = root.Room && root.Room.room; if (ek && rm && rm.test && root.MONO_EGGS && root.MONO_EGGS[ek] && !this._eggPreviewed) { this._eggPreviewed = true; setTimeout(() => root.MONO_EGGS[ek].call(this, SFX, { eff: ek + ':30000', mul: 1, seat: Math.max(0, this.v.seat), by: -1 }), 3000); } } catch (e) {}
        b.onPan = () => { this._camFree = true; };
        b.onLost = () => { if (this.board !== b || !this.v || !this.ui) return; try { this.destroy(); } catch (e) {} const host = this.el; if (host) { host.dataset.g = ''; this.render(host, this.v, this.ui); } };
        b.onTap = (h) => { if (h.tile != null && this.canAct('passbuild')) this.pickBuild(h.tile); else if (h.tile != null && this.canAct('gate')) this.pickGate(h.tile); else if (h.tile != null) this.tileInfo(h.tile); else if (h.seat != null) b.focusSeat(h.seat, true); };
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
          <small>${p.skip ? `⏸${p.skip} ` : ''}${p.immune ? `🛡${p.immune} ` : ''}${p.jailfree ? `🎫${p.jailfree} ` : ''}${p.items && p.items.length ? `🎒${p.items.length} ` : ''}${p.invest && p.invest.length ? `📈${p.invest.length}` : ''}</small></div>
        </div>`).join('');
      hud.querySelectorAll('.mp').forEach(d => d.onclick = () => this.assetInfo(+d.dataset.s));
      this.renderItems();
      const info = this.el.querySelector('.mono-info');
      info.innerHTML = v.phase === 'over' ? '' : `第 ${v.round}${v.maxRounds && v.maxRounds < 900 ? '/' + v.maxRounds : ''} 回合${v.maxRounds === 0 ? '（有人破產就結束）' : ''}${v.infl > 1 ? ` · 過路費 ×${v.infl.toFixed(1)}` : ''} · 輪到 <b>${U.esc(v.names[v.turn])}</b> <span class="timer" data-deadline="${v.deadline || ''}"></span>`;
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
      const d = box.querySelector('[data-draw]'); if (d) d.onclick = () => { this.ui.send({ type: 'pick', custom: true }); if (!myAv) this.drawPad(); }; // 先佔好「自己畫」，畫圖時間到了也不會被系統換成預設角色；畫好的圖送出後角色會自動換成立牌
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
      m.querySelector('[data-a="cancel"]').onclick = () => { m.hidden = true; m.innerHTML = ''; this.showPrompt(); };
      m.querySelector('[data-a="ok"]').onclick = () => {
        const small = document.createElement('canvas'); small.width = small.height = 128; small.getContext('2d').drawImage(cv, 0, 0, 128, 128);
        const img = small.toDataURL('image/jpeg', 0.8);
        root.Room.setAvatar(img); m.hidden = true; m.innerHTML = ''; if (after) setTimeout(after, 300); setTimeout(() => this.showPrompt(), 400);
      };
    },

    syncBoard(first, mid) {
      // mid＝播放中途呼叫：只更新棋盤，不換鏡頭
      const b = this.board, v = this.v; if (!b || !v || v.phase === 'pick') return;
      b.setTokens(v.players.map((p, s) => { const ch = this.charOf(v, s); const c = v.players[s].char; return { seat: s, idx: c ? c.i : s, color: ch ? ch.color : '#999', img: ch && ch.custom ? this.avatarOf(s) : null, alive: p.alive, name: v.names[s], evolved: p.evolved, frog: !!p.frog }; }));
      v.players.forEach((p, s) => { const tk = b.tokens[s]; if (tk && !tk.busy && tk.pos !== p.pos) b.place(s, p.pos); });
      b.setBuildings(v.owners, v.levels, v.players.map((p, s) => ({ color: (this.charOf(v, s) || {}).color, charIdx: p.char ? p.char.i : 0 })));
      if (b.scene && b.scene.userData.decay) b.scene.userData.decay(v.round); // 怪奇小鎮：回合越後面越被倒影世界侵蝕
      b.setTurn(v.phase === 'over' ? -1 : v.turn);
      // 換人時鏡頭自動切到輪到的人（自己拖地圖後，這一輪就不再自動跟）；輪到自己一定拉回來
      if (!mid && v.phase !== 'over' && this._camTurn !== v.turn) { this._camTurn = v.turn; this._camFree = false; b.focusSeat(v.turn, true); }
      // 卡片提示：換人或輪到我擲骰時自動收起（至少顯示 2 秒）
      if (!this.playing && this._cardAt && Date.now() - this._cardAt > 2000 && (v.turn !== this._cardTurn || (v.seat >= 0 && v.turn === v.seat && v.phase === 'roll'))) this.closeCard();
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
      this._played = false; return sleep(800);
    },
    async play(evs) {
      this._played = evs.some(e => ['buy', 'up', 'buyout', 'jail', 'pay', 'card', 'sell', 'down', 'skip', 'skipset', 'cash', 'immune'].includes(e.t));
      this.playing = true; this.hidePrompt();
      const v = this.v, b = this.board, unit = TH()[v.theme].unit, $ = (n) => fmt(n) + ' ' + unit, why = (w) => w ? (w === '卡片' ? '（卡片）' : ' ' + w) : ''; const watch = (s) => !this._camFree || b.following === s;
      try {
        for (const e of evs) {
          // 追進度：後面還有排隊的畫面時（手機慢、網路一次送來好幾批），這批只記錄不播動畫，讓最新的提示框盡快出現
          if (this._backlog > 1 && e.t !== 'bankrupt') { this.quickLog(e, $, why); continue; }
          if (e.t === 'bankrupt') this.cine(true);
          if (!this.board) break;
          switch (e.t) {
            case 'dice': this.closeCard(); this.ungrey(); if (!this._camFree) b.focusSeat(e.seat, true); await this.rollDice(e.d); break;
            case 'move': await b.hop(e.seat, e.path, watch(e.seat)); break;
            case 'tp': if (e.gate && this._gateShown) { this._gateShown = false; } else if (e.gate) { this.feed(`🌀 ${this.who(e.seat)} 穿越星門 → <b>${U.esc(R().tileName(v.theme, e.to))}</b>`, 'big'); await this.stargate(); } await b.teleport(e.seat, e.to, watch(e.seat)); break;
            case 'cash': if (!e.boost && window.gameLog) window.gameLog(`${this.who(e.seat)} 獲得 <b class="g">+${$(e.amt)}</b>${U.esc(why(e.why))}`); SFX.coin(); this.fx(`+${$(e.amt)}${why(e.why)}`, 'gain', e.seat); b.jumpJoy(e.seat); if (e.boost) this.feed(`${this.who(e.seat)} 落後補助 <b class="g">+${$(e.amt)}</b>`, 'good'); await sleep(450); break;
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
            case 'card': if (window.gameLog) window.gameLog(`${this.who(e.seat)} 抽到${e.deck === 'luck' ? '好運' : '厄運'}卡：${U.esc(e.text)}`); await this.showCard(e); break;
            case 'quiz': {
              this.closeCard(); SFX.doom(); this.vfx('doom'); b.mood(e.debtor, 'scared', 2500); b.mood(e.cred, 'joy', 1500);
              this.feed(`⚔️ ${this.who(e.debtor)} 付不出 ${$(e.amt)}，跟 ${this.who(e.cred)} 進入翻盤問答！`, 'big');
              if (!this._camFree) b.focusSeat(e.debtor, true); await sleep(1400); break;
            }
            case 'quizres': await this.quizReveal(e); break;
            case 'getitem': { const mine = e.seat === v.seat, nm = mine ? this.itemName(e.k) : '道具'; SFX.coin(); b.jumpJoy(e.seat); this.fx(`🎒 ${nm}`, 'gain', e.seat); this.feed(mine ? `你${e.amt ? `花 ${$(e.amt)} 買了` : '拿到'} <b>${U.esc(nm)}</b>` : `${this.who(e.seat)} ${e.amt ? '買了' : '拿到'}一張道具`, 'good'); await sleep(900); break; }  // 別人買了什麼、花多少都不顯示
            case 'item': {
              const nm = this.itemName(e.k), tg = e.target != null && e.target >= 0 ? this.who(e.target) : '';
              this._played = true; if (!this._camFree) { if (e.tile != null) b.focusTile(e.tile); else b.focusSeat(e.target >= 0 ? e.target : e.seat, true); }
              this.feed(`${this.who(e.seat)} 使用 <b>${U.esc(nm)}</b>${tg ? ` → ${tg}` : ''}`, 'big'); this.fx(nm, 'gain big', e.seat);
              await sleep(700);
              if (e.blocked) { SFX.glory(); b.itemFx(e.k, null, e.target, true); b.mood(e.target, 'joy', 1200); this.fx(`${this.itemName('shield')} 擋下了！`, 'gain big', e.target); this.feed(`${tg} 的 <b>${U.esc(this.itemName('shield'))}</b> 擋下了攻擊`, 'good'); await sleep(1300); break; }
              if (e.k === 'bomb') { SFX.thunder(); this.vfx('doom'); b.itemFx('bomb', e.tile); b.mood(e.target, 'scared', 1400); this.syncBoard(false, true); this.fx(`建築降到 Lv${e.level}`, 'loss', null, e.tile); }
              else if (e.k === 'trap') { SFX.hiss(); b.itemFx('trap', null, e.target); b.mood(e.target, 'scared', 1400); this.fx('⏸ 下回合停一輪', 'loss', e.target); }
              else if (e.k === 'steal') { SFX.coin(); b.itemFx('steal', null, e.target); b.mood(e.target, 'sad', 1300); b.mood(e.seat, 'joy', 1300); this.fx(`-${$(e.amt)}`, 'loss', e.target); setTimeout(() => this.fx(`+${$(e.amt)}`, 'gain', e.seat), 400); }
              else if (e.k === 'invest') { SFX.build(); b.itemFx('invest', null, e.seat); this.fx(`第 ${e.due} 回合拿回 ${$(e.amt)}`, 'gain', e.seat); }
              await sleep(1400); break;
            }
            case 'immune': this.fx('🛡 抵擋了厄運！', 'gain', e.seat); SFX.glory(); this.vfx('glory'); b.mood(e.seat, 'joy', 1200); await sleep(900); break;
            case 'jailfree': this.fx('🎫 使用免罪卡！', 'gain', e.seat); await sleep(900); break;
            case 'jail': this.feed(`${this.who(e.seat)} 被送進 ${U.esc(TH()[v.theme].corners.jail)}`, 'pay'); SFX.doom(); this.vfx('doom'); this.fx(`⛓ ${TH()[v.theme].corners.jail}`, 'loss', e.seat); await b.teleport(e.seat, R().JAIL, watch(e.seat)); b.mood(e.seat, 'sad', 2000); break;
            case 'skip': this.fx('⏸ 暫停一回合', 'loss', e.seat); await sleep(700); break;
            case 'skipset': this.fx(`⏸ 停 ${e.n} 回合`, 'loss', e.seat); await sleep(500); break;
            case 'bankrupt':
              if ((v.theme === 'ragnarok' || v.theme === 'cyber') && b.tokens[e.seat]) {
                const snd = k => SFX[k] && SFX[k](); SFX.doom(); this.vfx('doom'); this._played = true;
                const by = e.by >= 0 && b.tokens[e.by] ? e.by : -1;
                if (v.theme === 'ragnarok') {
                  if (by >= 0) {
                    const ch = v.players[by].char || {}; const kind = ch.kind === 'custom' ? 'crush' : ['zeus', 'thor', 'athena', 'poseidon', 'fenrir', 'ra', 'medusa', 'hero'][ch.i] || 'hero';
                    this.feed(`⚡ ${this.who(e.seat)} 破產了，被 ${this.who(by)} 用神力處決`, 'big'); await b.godKill(by, e.seat, kind, snd);
                  } else { this.feed(`🔥 ${this.who(e.seat)} 破產了，被路西法拖進地獄受刑`, 'big'); await b.hell(e.seat, snd); }
                } else {
                  if (by >= 0) { this.feed(`🔫 ${this.who(e.seat)} 破產了，被 ${this.who(by)} 用光束槍分解`, 'big'); await b.beamKill(by, e.seat, snd); }
                  else { this.feed(`⚠️ ${this.who(e.seat)} 破產了，義體失控發狂，鎮暴部隊出動`, 'big'); await b.psychoKill(e.seat, snd); }
                }
                break;
              }
              if ((v.theme === 'buddha' || v.theme === 'magic' || v.theme === 'town') && root.MONO_EGGS) {
                SFX.doom(); this._played = true; const by = e.by >= 0 && b.tokens[e.by] ? e.by : -1;
                if (v.theme === 'buddha') this.feed(by >= 0 ? `🔥 ${this.who(e.seat)} 破產了，被 ${this.who(by)} 打入十八層地獄` : `🔥 ${this.who(e.seat)} 破產了，閻羅判官判他下十八層地獄`, 'big');
                else if (v.theme === 'town') this.feed(by >= 0 ? `🩸 ${this.who(e.seat)} 破產了，被 ${this.who(by)} 解決` : `🩸 ${this.who(e.seat)} 破產了，被倒影世界的藤蔓拖進地底`, 'big');
                else this.feed(by >= 0 ? `💀 ${this.who(e.seat)} 破產了，被 ${this.who(by)} 解決` : `💀 ${this.who(e.seat)} 破產了，被魔法書吸進去`, 'big');
                if (by >= 0) { b.mood(by, 'joy', 2000); b.lunge && await b.lunge(by, e.seat); }
                b.mood(e.seat, 'fall');
                await root.MONO_EGGS[v.theme === 'buddha' ? 'hell' : v.theme === 'town' ? 'townDeath' : 'magicDeath'].call(this, SFX, { seat: e.seat, by });
                if (b.tokens[e.seat]) b.tokens[e.seat].r.g.visible = false;
                break;
              }
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
            case 'hound': this.feed(`🐺 魔狗突襲 ${this.who(e.seat)}！`, 'big'); if (root.MONO_EGGS && root.MONO_EGGS.hound) await root.MONO_EGGS.hound.call(this, SFX, { seat: e.seat }); break;
            case 'alert': this.feed(U.esc(e.text), 'big'); this.fx(e.text, 'loss big', v.turn); SFX.doom && SFX.doom(); await sleep(1500); break;
            case 'note': this.fx(e.text, '', e.seat); if (e.feed && e.seat === v.seat) this.feed(`💡 ${U.esc(e.text)}`, ''); await sleep(e.feed ? 1200 : 600); break;
          }
        }
      } finally { this.playing = false; if (this._cine) this.cine(false); }
    },
    async rollDice(d) {
      const faces = this.el.querySelectorAll('.d6'); SFX.dice();
      for (let k = 0; k < 7; k++) { faces.forEach(f => f.textContent = '⚀⚁⚂⚃⚄⚅'[Math.floor(Math.random() * 6)]); await sleep(55); }
      faces[0].textContent = '⚀⚁⚂⚃⚄⚅'[d[0] - 1]; faces[1].textContent = '⚀⚁⚂⚃⚄⚅'[d[1] - 1];
      this.fx(`${d[0] + d[1]} 步`, 'dice', this.v.turn); await sleep(220);
    },
    // 卡片：所有人都看得到（頭像＋名字），可以自己關；下一位擲骰前自動收掉
    async showCard(e) {
      const v = this.v, th = TH()[v.theme]; const good = e.deck === 'luck';
      // 彩蛋卡：先跑全螢幕動畫，再翻開卡片內容，比較震撼
      const k0 = e.eff.split(':')[0];
      if (['gm', 'gagain', 'gtp'].includes(k0)) { await this.stargate(); if (k0 === 'gtp') this._gateShown = true; }
      else if (k0 === 'mig') await this.migration();
      else if (k0 === 'cat') await this.catSpin();
      else if (k0 === 'war') { const ch = v.players[e.seat].char || {}; const human = ch.kind === 'custom' || ch.i === 7; await this.godWar(good ? human : !human); }
      else if (k0 === 'link') await this.mindLink();
      else if (k0 === 'evo') await this.evolution(e.seat);
      else if (root.MONO_EGGS && root.MONO_EGGS[k0]) await root.MONO_EGGS[k0].call(this, SFX, e);
      if (good) { SFX.glory(); this.vfx('glory'); this.board && this.board.mood(e.seat, 'joy', 1800); }
      else if (e.eff === 'psycho') { SFX.glitch(); SFX.doom(); this.vfx('glitch'); this.board && this.board.mood(e.seat, 'scared', 2500); }
      else { SFX.doom(); this.vfx('doom'); this.board && this.board.mood(e.seat, 'scared', 1800); }
      const L = this.el.querySelector('.mono-cardlayer');
      L.innerHTML = `<div class="mcard ${good ? 'good' : 'bad'}"><div class="mcard-in">
        <button class="mcard-x" aria-label="關閉">✕</button>
        <div class="mcard-head">${good ? th.luckName : th.badName}</div>
        <div class="mcard-who">${this.faceHTML(v, e.seat, 52)}<b>${U.esc(v.names[e.seat])}</b>${e.seat === v.seat ? '<em>（你）</em>' : ''}</div>
        <p>${U.esc(e.text)}</p><div class="mcard-eff">${this.effText(e.eff, th, e.mul)}</div></div></div>`;
      L.classList.add('on'); L.onclick = () => this.closeCard(); this._cardTurn = v.turn; this._cardAt = Date.now();
      clearTimeout(this._cardT); this._cardT = setTimeout(() => this.closeCard(), 9000);
      await sleep(2200);
    },
    ungrey() { if (!this._grey) return; this._grey = false; const st = this.el && this.el.querySelector('.mono-stage'); if (st) { st.style.transition = 'filter 1.2s'; st.style.filter = ''; } },
    closeCard() { const L = this.el && this.el.querySelector('.mono-cardlayer'); if (L) { L.classList.remove('on'); L.innerHTML = ''; } clearTimeout(this._cardT); this._cardAt = 0; },
    who(s) { const v = this.v; return `<span class="who">${this.faceHTML(v, s, 22)}${U.esc(v.names[s])}</span>`; },
    quickLog(e, $, why) {
      const L = window.gameLog; if (!L) return; const v = this.v, tn = (i) => U.esc(R().tileName(v.theme, i));
      const t = { pay: () => e.to >= 0 ? `${this.who(e.from)} 付給 ${this.who(e.to)} <b class="r">${$(e.amt)}</b>${U.esc(why(e.why))}` : `${this.who(e.from)} 付出 <b class="r">${$(e.amt)}</b>${U.esc(why(e.why))}`,
        buy: () => `${this.who(e.seat)} 買下 <b>${tn(e.tile)}</b>`, up: () => `${this.who(e.seat)} 把 <b>${tn(e.tile)}</b> 蓋到 Lv${e.level}`,
        buyout: () => `${this.who(e.seat)} 強制收購 ${this.who(e.from)} 的 <b>${tn(e.tile)}</b>`, cash: () => `${this.who(e.seat)} 獲得 <b class="g">+${$(e.amt)}</b>${U.esc(why(e.why))}`,
        card: () => `${this.who(e.seat)} 抽到${e.deck === 'luck' ? '好運' : '厄運'}卡：${U.esc(e.text || '')}`, jail: () => `${this.who(e.seat)} 被送進監獄`,
        item: () => `${this.who(e.seat)} 使用 <b>${U.esc(this.itemName(e.k))}</b>`, getitem: () => `${this.who(e.seat)} 拿到一張道具` }[e.t];
      if (t) L(t());
    },
    // 破產等大動畫播放時，通知先收起來，播完再顯示，不擋畫面
    cine(on) {
      this._cine = on; if (!this.el) return; this.el.classList.toggle('cine', on);
      if (on) { const box = this.el.querySelector('.mono-feed'); if (box) box.innerHTML = ''; }
      else { const held = this._held || []; this._held = []; held.slice(-2).forEach(([h, c]) => this._show(h, c)); }
    },
    feed(html, cls) {
      if (window.gameLog) window.gameLog(html);
      if (this._cine) { (this._held = this._held || []).push([html, cls, true]); return; }
      this._show(html, cls);
    },
    _show(html, cls) {
      const box = this.el && this.el.querySelector('.mono-feed'); if (!box) return;
      const d = document.createElement('div'); d.className = 'mfeed ' + (cls || ''); d.innerHTML = html; box.prepend(d);
      while (box.children.length > 2) box.lastChild.remove();
      setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 500); }, 4500);
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
        <div class="act-row"><button class="btn sm ghost" data-where>看他在哪</button>${s === v.seat && v.players[s].alive && v.phase !== 'over' ? '<button class="btn sm ghost" data-mydraw>✏️ 換成我畫的角色</button>' : ''}<button class="btn sm" data-x>關閉</button></div></div>`;
      m.onclick = (e) => {
        if (e.target.closest('[data-mydraw]')) { m.onclick = null; this.drawPad(() => this.ui.send({ type: 'custom' })); return; }
        if (e.target.closest('[data-where]')) { m.hidden = true; if (this.board) { this._camFree = true; this.board.focusSeat(s, true); } this.showPrompt(); }
        else if (e.target.closest('[data-x]') || e.target === m) { m.hidden = true; this.showPrompt(); }
      };
    },
    effText(eff, th, mul) {
      const [k, v0] = eff.split(':'); const v = ['m', 'each', 'give', 'house', 'gm', 'link', 'war', 'sync', 'bag', 'goblin', 'phoenix', 'xlights', 'd20'].includes(k) ? Math.round(+v0 * (mul || 1) / 100) * 100 : +v0; const u = th.unit;
      return { m: v >= 0 ? `+${fmt(v)} ${u}` : `-${fmt(-v)} ${u}`, mv: v >= 0 ? `前進 ${v} 格` : `後退 ${-v} 格`, go: '前往起點並領獎金', gonb: '回到起點（不領錢）', jail: `進入${th.corners.jail}`,
        skip: `暫停 ${v} 回合`, immune: '獲得 🛡 抵擋一次厄運', jailfree: `獲得 🎫 免進${th.corners.jail}一次`, up: '免費升級一棟建築', down: '一棟建築降一級',
        each: `每位玩家付你 ${fmt(v)} ${u}`, give: `你付每位玩家 ${fmt(v)} ${u}`, house: `每一級建築付 ${fmt(-v)} ${u}`, pct: `失去 ${-v}% 現金`, teleport: '隨機傳送', mig: `🦓 跟著獸群前進 ${v} 格`, war: v > 0 ? `你的陣營勝利，+${fmt(v)} ${u}` : `你的陣營戰敗，賠 ${fmt(-v)} ${u}（最多現金的 35%）`, link: `+${fmt(v)} ${u}，並獲得一次厄運免疫`, evo: `失去 ${v}% 現金、停 1 回合，身體永久變成金屬`, cat: `🐈 頭暈，停 ${v} 回合`, gate: '🌀 自己選目的地，穿越星門', gm: `🌀 +${fmt(v)} ${u}`, gagain: '🌀 這回合再擲一次', gtp: '🌀 被丟到隨機一格', psycho: '失去 30% 現金、兩棟建築降級、停兩回合', again: '⏳ 再擲一次', sync: `+${fmt(v)} ${u}，下一次過路費免付`, trance: '下一次擲骰自己選點數（2～12）', ghost: `失去 ${v}% 現金`, birds: `接下來 ${v} 次過路費加倍`, bag: `+${fmt(v)} ${u}`, goblin: `+${fmt(v)} ${u}`, phoenix: '現金補回開局金額（已經比開局多就再加一筆）', mandrake: `停 1 回合，失去 ${v}% 現金`, frog: `變成蟾蜍 3 回合（前 ${v} 回合停住不能動）`, xlights: `+${fmt(v)} ${u}`, psy: `從其他每位玩家身上吸走 ${v}% 現金`, flip: `停 1 回合，失去 ${v}% 現金`, clock: `失去 ${v}% 現金，被丟進${th.corners.jail}`, d20: '擲 20 面骰：20 點賺兩倍、11 點以上賺錢、10 點以下賠錢、1 點失去 20% 現金' }[k] || '';
    },
    // ===== 道具 =====
    itemName(k) { const I = root.MONO_ITEMS.NAMES[this.v.theme][k]; return I[1] + ' ' + I[0]; },
    renderItems() {
      const v = this.v, box = this.el && this.el.querySelector('.mono-items'); if (!box) return;
      const p = v.seat >= 0 ? v.players[v.seat] : null;
      if (!p || !p.alive || !p.items.length || v.phase === 'over' || v.phase === 'pick') { box.innerHTML = ''; return; }
      const ok = this.canAct('roll') && !p.usedItem, I = root.MONO_ITEMS.NAMES[v.theme];
      box.innerHTML = p.items.map((k, i) => `<button class="mi ${k === 'shield' ? 'passive' : ''} ${ok && k !== 'shield' ? 'ready' : ''}" data-i="${i}" title="${I[k][0]}"><i>${I[k][1]}</i><span>${I[k][0]}</span></button>`).join('');
      box.querySelectorAll('[data-i]').forEach(b => b.onclick = () => this.itemSheet(+b.dataset.i));
    },
    itemSheet(i) {
      const v = this.v, p = v.players[v.seat], k = p.items[i]; if (!k) return;
      const MI = root.MONO_ITEMS, I = MI.NAMES[v.theme][k], th = TH()[v.theme];
      const ok = this.canAct('roll') && !p.usedItem && k !== 'shield';
      const m = this.el.querySelector('.mono-modal'); m.hidden = false; m.onclick = (e) => { if (e.target === m) m.hidden = true; };
      let pick = '';
      if (ok && (k === 'trap' || k === 'steal')) pick = `<div class="mi-targets">${v.players.map((q, s) => s !== v.seat && q.alive ? `<button class="btn ghost" data-tg="${s}">${this.faceHTML(v, s, 24)} ${U.esc(v.names[s])}${k === 'steal' ? `<small>可拿約 ${fmt(Math.max(0, Math.min((v.assets[s].total > v.assets[v.seat].total ? 30000 : 3000) * Math.min(3, v.infl || 1), Math.floor(q.cash * 0.15 / 100) * 100)))}</small>` : ''}</button>` : '').join('')}</div>`;
      else if (ok && k === 'bomb') { const tl = R().BOARD.filter(t => t.type === 'prop' && v.owners[t.i] >= 0 && v.owners[t.i] !== v.seat && v.players[v.owners[t.i]].alive && v.levels[t.i] > 0);
        pick = tl.length ? `<div class="mi-targets">${tl.map(t => `<button class="btn ghost" data-tl="${t.i}"><span class="tile-dot" style="background:${t.color}"></span>${U.esc(R().tileName(v.theme, t.i))} <small>Lv${v.levels[t.i]}・${U.esc(v.names[v.owners[t.i]])}</small></button>`).join('')}</div>` : '<p class="hint">現在沒有別人蓋了建築的地，先留著吧</p>'; }
      else if (ok && k === 'invest') pick = `<div class="act-row"><button class="btn" data-inv>開始投資（3 回合後拿回 ${fmt(Math.round(6000 * Math.min(3, v.infl || 1) / 100) * 100)} ${th.unit}）</button></div>`;
      const why = k === 'shield' ? '' : !this.canAct('roll') ? '<p class="hint">輪到你、擲骰子之前才能用</p>' : p.usedItem ? '<p class="hint">這回合已經用過道具了</p>' : '';
      m.innerHTML = `<div class="mm-card mi-card"><div class="mi-big">${I[1]}</div><h3>${I[0]}</h3><p>${MI.DESC[k].replace(/[0-9,]+(?=（|$| 拿| 後)/g, x => x)}</p>${why}${pick}<div class="act-row"><button class="btn ghost" data-x>${ok ? '先不用' : '關閉'}</button></div></div>`;
      const send = (extra) => { this.ui.send(Object.assign({ type: 'item', i }, extra)); m.hidden = true; };
      m.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => send({ target: +b.dataset.tg }));
      m.querySelectorAll('[data-tl]').forEach(b => b.onclick = () => send({ tile: +b.dataset.tl }));
      const inv = m.querySelector('[data-inv]'); if (inv) inv.onclick = () => send({});
      m.querySelector('[data-x]').onclick = () => { m.hidden = true; };
    },
    hidePrompt() { const m = this.el && this.el.querySelector('.mono-modal'); if (m && !m.querySelector('.pad') && !m.querySelector('.tinfo')) m.hidden = true; const go = this.el && this.el.querySelector('.go-btn'); if (go) go.disabled = true; },
    showPrompt() {
      const v = this.v; if (!this.el || this.playing || !this.el.querySelector('.go-btn')) return;
      if (v.phase === 'quiz' && v.pending && v.pending.quiz) this.quizUI(v.pending, null); else if (!this._revealing) { const qz = this.el.querySelector('.mono-quiz'); if (qz) qz.hidden = true; }
      if (!(v.phase === 'gate' && v.turn === v.seat)) this.gateBar(false);
      if (!(v.phase === 'passbuild' && v.turn === v.seat)) this.buildBar(false);
      if (!(v.phase === 'roll' && v.turn === v.seat && v.players[v.seat] && v.players[v.seat].trance)) this.diceBar(false); else if (this.canAct('roll')) this.diceBar(true);
      const go = this.el.querySelector('.go-btn'); const m = this.el.querySelector('.mono-modal');
      go.disabled = !this.canAct('roll'); go.classList.toggle('pulse', !go.disabled); this.renderItems();
      if (!m.hidden && m.querySelector('.pad')) return;
      // 告訴房主：提示框已經出現在我畫面上（時間從現在開始算）
      if (v.seat >= 0 && v.turn === v.seat && ['roll', 'buy', 'upgrade', 'buyout', 'shop', 'gate', 'dicepick'].includes(v.phase) && this._seenKey !== v.evId + ':' + v.phase) { this._seenKey = v.evId + ':' + v.phase; this.ui.send({ type: 'seen' }); if (this._decAt && v.phase !== 'roll') root.Room.diagPd = Date.now() - this._decAt; }
      const th = TH()[v.theme];
      if (v.phase === 'over') {
        m.hidden = false;
        const ew = v.endWhy || {}, dn = (ew.dead || []).map(i => U.esc(v.names[i])).join('、');
        const why = ew.why === 'bankrupt' ? `${dn} 破產了，這局設定「有人破產就結束」，所以由總資產最多的人獲勝` : ew.why === 'last' ? `其他人都破產了，只剩一位` : ew.why === 'rounds' ? `打滿設定的 ${ew.round} 回合` : ew.why === 'cap' ? `已經到第 ${ew.round} 回合上限` : '';
        m.innerHTML = `<div class="mm-card over"><h2>🏆 ${U.esc(v.names[v.winner])} 獲勝！</h2>${why ? `<p class="endwhy">結束原因：${why}</p>` : ''}
          <p class="hint">排名看「總資產」＝ 現金 ＋ 地價 ＋ 建築（單位：${th.unit}）</p>
          <table class="atab rank"><tr><th></th><th>玩家</th><th>現金</th><th>地＋建築</th><th>總資產</th></tr>${(v.ranks || []).map((r, k) => `<tr class="${k === 0 ? 'win' : ''}"><td>${k + 1}</td><td>${this.faceHTML(v, r.s, 24)} ${U.esc(v.names[r.s])}</td>${r.w >= 0 ? `<td>${fmt(r.cash)}</td><td>${fmt(r.land + r.bld)}</td><td><b>${fmt(r.w)}</b></td>` : '<td colspan="3">破產</td>'}</tr>`).join('')}</table><div class="act-row"><button class="btn" data-lobby>回遊戲大廳</button></div></div>`;
        m.onclick = null; const lb = m.querySelector('[data-lobby]'); if (lb) { if (v.seat < 0) lb.remove(); else lb.onclick = () => window.backToLobby ? window.backToLobby() : Room.send({ t: 'end' }); } return;
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
      } else if (v.phase === 'shop' && v.turn === v.seat) {
        const pd = v.pending, MI = root.MONO_ITEMS, I = MI.NAMES[v.theme], me = v.players[v.seat];
        m.hidden = false; m.onclick = null;
        m.innerHTML = `<div class="mm-card shop-card"><h3>${pd.free ? '🎁 休息站：免費挑一張道具' : `${U.esc(I.tile)}：要買道具嗎？`}</h3>
          ${pd.free ? '<p class="hint">免費的，不算購買次數</p>' : `<p class="hint">這是你的第 ${pd.nth} 次購買，越買越貴（每 ${MI.RESET} 回合歸零）</p>`}
          <div class="shop-row">${pd.offers.map((k, j) => `<button class="shop-it" data-k="${k}" ${me.cash < pd.prices[j] ? 'disabled' : ''}><i>${I[k][1]}</i><b>${I[k][0]}</b><small>${MI.DESC[k]}</small><em>${pd.prices[j] ? `${fmt(pd.prices[j])}<u>${th.unit}</u>` : '免費'}</em></button>`).join('')}</div>
          <p class="shop-rule">🎒 背包最多放 3 個道具・要在<b>擲骰子之前</b>使用（點左下角的道具）</p>
          <div class="act-row"><button class="btn ghost" data-k="">${pd.free ? '都不要' : '不買'}</button></div>
          <span class="timer" data-deadline="${v.deadline}"></span></div>`;
        m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { this.ui.send({ type: 'shop', k: b.dataset.k || null }); m.hidden = true; });
      } else if (v.phase === 'passbuild' && v.turn === v.seat) {
        m.hidden = true; this.buildBar(true); return;
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
    // 傳送／自選格子：直接點地圖。進入時自動切到全景，自己的地是金色光圈；第一下選、按確認才送出
    gateBar(on) {
      const st = this.el.querySelector('.mono-stage'); let bar = st.querySelector('.gate-bar');
      if (!on) { if (bar) bar.remove(); if (this.board) this.board.clearMarks(); this._gateSel = null; return; }
      if (bar) return; const v = this.v, b = this.board;
      const all = R().BOARD.map(t => t.i), mine = all.filter(i => v.owners[i] === v.seat);
      if (b) { this._camFree = true; b.overview(); b.markTiles(all, mine, null); }
      bar = document.createElement('div'); bar.className = 'gate-bar';
      bar.innerHTML = `<b>🌀 選一格傳送過去</b><span class="gb-tip">直接點地圖上的格子（<i class="dot gold"></i>金圈是你的地）</span>
        <div class="gate-row"><span class="gb-sel">還沒選</span><button class="btn sm ghost" data-list>用清單選</button><button class="btn sm" data-go disabled>傳送到這裡</button></div><span class="timer" data-deadline="${v.deadline}"></span>`;
      st.appendChild(bar);
      bar.querySelector('[data-go]').onclick = () => { if (this._gateSel != null) { this._camFree = false; this.ui.send({ type: 'gate', to: this._gateSel }); this.gateBar(false); } };
      bar.querySelector('[data-list]').onclick = () => {
        const m = this.el.querySelector('.mono-modal'); m.hidden = false; m.onclick = null;
        m.innerHTML = `<div class="mm-card"><h3>選要傳送的格子</h3><div class="mi-targets">${R().BOARD.map(t => `<button class="btn ghost" data-tl="${t.i}">${t.color ? `<span class="tile-dot" style="background:${t.color}"></span>` : ''}${U.esc(R().tileName(v.theme, t.i))}<small>${v.owners[t.i] === v.seat ? '你的地' : v.owners[t.i] >= 0 ? U.esc(v.names[v.owners[t.i]]) + ' 的地' : t.type === 'prop' ? '空地' : ''}</small></button>`).join('')}</div><div class="act-row"><button class="btn ghost" data-x>關閉</button></div></div>`;
        m.querySelectorAll('[data-tl]').forEach(x => x.onclick = () => { m.hidden = true; this.pickGate(+x.dataset.tl); });
        m.querySelector('[data-x]').onclick = () => { m.hidden = true; };
      };
    },
    // 神明附身：自己選這次要走幾步，選了會在地圖上標出會停在哪
    diceBar(on) {
      const st = this.el.querySelector('.mono-stage'); let bar = st.querySelector('.dice-bar');
      if (!on) { if (bar) bar.remove(); st.classList.remove('picking'); if (this.board) this.board.clearMarks(); return; }
      if (bar) return; const v = this.v, b = this.board, me = v.players[v.seat]; st.classList.add('picking');
      if (b) { this._camFree = true; b.overview(); }
      bar = document.createElement('div'); bar.className = 'gate-bar dice-bar';
      bar.innerHTML = `<b>🔥 神明附身：這次要走幾步？</b><span class="gb-tip">點數字，地圖上會標出會停在哪一格</span>
        <div class="dice-nums">${[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => `<button class="btn ghost sm" data-n="${n}">${n}</button>`).join('')}</div>
        <div class="gate-row"><span class="gb-sel">還沒選</span><button class="btn sm" data-go disabled>走！</button></div><span class="timer" data-deadline="${v.deadline}"></span>`;
      st.appendChild(bar); let pick = 0;
      bar.querySelectorAll('[data-n]').forEach(x => x.onclick = () => {
        pick = +x.dataset.n; bar.querySelectorAll('[data-n]').forEach(y => y.classList.toggle('on', y === x));
        const to = (me.pos + pick) % R().N, t = R().BOARD[to];
        const own = v.owners[to] === v.seat ? '（你的地）' : v.owners[to] >= 0 ? `（${U.esc(v.names[v.owners[to]])} 的地，要付過路費）` : t.type === 'prop' ? '（空地，可以買）' : '';
        bar.querySelector('.gb-sel').innerHTML = `停在 <b>${U.esc(R().tileName(v.theme, to))}</b>${own}`; bar.querySelector('[data-go]').disabled = false;
        if (b) { b.markTiles([to], v.owners[to] === v.seat ? [to] : [], to); b.focusTile(to);
          // 把那一格推到畫面上半部，避免被下面的選單擋住：鏡頭焦點往鏡頭方向挪一點
          const cp = b.cam.position, tg = b.goal.target, dx = cp.x - tg.x, dz = cp.z - tg.z, L = Math.hypot(dx, dz) || 1; tg.x += dx / L * 2.2; tg.z += dz / L * 2.2; b.goal.dist = Math.min(b.goal.dist || 14, 14); b.clampGoal && b.clampGoal(); }
        bar.querySelector('.gb-tip').hidden = true;
      });
      bar.querySelector('[data-go]').onclick = () => { if (!pick) return; this._camFree = false; this.ui.send({ type: 'roll', pick }); this.diceBar(false); const g = this.el.querySelector('.go-btn'); if (g) g.disabled = true; SFX.dice(); };
    },
    // 經過起點的加蓋：直接點地圖上金色光圈的地（自己的、還能蓋的），或用清單選
    buildBar(on) {
      const st = this.el.querySelector('.mono-stage'); let bar = st.querySelector('.build-bar');
      if (!on) { if (bar) { bar.remove(); if (this.board) this.board.clearMarks(); this._camFree = false; } this._bldSel = null; return; }
      if (bar) return; const v = this.v, b = this.board, opts = (v.pending && v.pending.opts) || [];
      if (b) { this._camFree = true; b.overview(); b.markTiles(opts, opts, null); }
      bar = document.createElement('div'); bar.className = 'gate-bar build-bar';
      bar.innerHTML = `<b>🏗️ 經過起點：可以加蓋一層</b><span class="gb-tip">點地圖上<i class="dot gold"></i>金圈的地（你的地、錢夠蓋的）</span>
        <div class="gate-row"><span class="gb-sel">還沒選</span><button class="btn sm ghost" data-list>用清單選</button><button class="btn sm ghost" data-skip>這次不蓋</button><button class="btn sm" data-go disabled>蓋這裡</button></div><span class="timer" data-deadline="${v.deadline}"></span>`;
      st.appendChild(bar);
      bar.querySelector('[data-go]').onclick = () => { if (this._bldSel != null) { this.ui.send({ type: 'passbuild', to: this._bldSel }); this.buildBar(false); } };
      bar.querySelector('[data-skip]').onclick = () => { this.ui.send({ type: 'passbuild', to: -1 }); this.buildBar(false); };
      bar.querySelector('[data-list]').onclick = () => {
        const m = this.el.querySelector('.mono-modal'); m.hidden = false; m.onclick = null;
        m.innerHTML = `<div class="mm-card"><h3>要加蓋哪一塊？</h3><div class="mi-targets">${opts.map(i => { const t = R().BOARD[i]; return `<button class="btn ghost" data-tl="${i}"><span class="tile-dot" style="background:${t.color}"></span>${U.esc(R().tileName(v.theme, i))}<small>${v.levels[i]} 級 → ${v.levels[i] + 1} 級・${t.up.toLocaleString()}</small></button>`; }).join('')}</div><div class="act-row"><button class="btn ghost" data-x>關閉</button></div></div>`;
        m.querySelectorAll('[data-tl]').forEach(x => x.onclick = () => { m.hidden = true; this.pickBuild(+x.dataset.tl); });
        m.querySelector('[data-x]').onclick = () => { m.hidden = true; };
      };
    },
    pickBuild(i) {
      const bar = this.el.querySelector('.build-bar'); if (!bar) return; const v = this.v, opts = (v.pending && v.pending.opts) || [];
      if (!opts.includes(i)) { this.fx('這塊不能加蓋', '', v.seat); return; }
      this._bldSel = i; const t = R().BOARD[i], lv = v.levels[i];
      const rentNow = R().rentOf ? null : null; void rentNow;
      bar.querySelector('.gb-sel').innerHTML = `<b>${U.esc(R().tileName(v.theme, i))}</b>：${lv} 級 → ${lv + 1} 級${lv + 1 === 4 ? '（地標！）' : ''}・建築費 ${t.up.toLocaleString()}`; bar.querySelector('[data-go]').disabled = false;
      if (this.board) { this.board.markTiles(opts, opts, i); this.board.focusTile && this.board.focusTile(i); }
    },
    pickGate(i) {
      const bar = this.el.querySelector('.gate-bar'); if (!bar) return; const v = this.v, b = this.board;
      this._gateSel = i; const t = R().BOARD[i];
      const own = v.owners[i] === v.seat ? '（你的地）' : v.owners[i] >= 0 ? `（${U.esc(v.names[v.owners[i]])} 的地，要付過路費）` : t.type === 'prop' ? '（空地，可以買）' : '';
      bar.querySelector('.gb-sel').innerHTML = `<b>${U.esc(R().tileName(v.theme, i))}</b>${own}`; bar.querySelector('[data-go]').disabled = false;
      if (b) { const all = R().BOARD.map(x => x.i); b.markTiles(all, all.filter(k => v.owners[k] === v.seat), i); }
      SFX.click && SFX.click();
    },
    // 全螢幕 3 秒星門穿越動畫（光帶隧道＋行星被拉長）
    stargate() {
      return new Promise(res => {
        SFX.warp(); if (this.board) this.board.paused = true; // 動畫期間暫停 3D，手機比較順
        const cv = document.createElement('canvas'); cv.className = 'stargate'; document.body.appendChild(cv);
        const pixd = root.__pix && this.v && this.v.theme === 'town'; if (pixd) cv.style.imageRendering = 'pixelated';
        const dpr = pixd ? 0.32 : Math.min(2, window.devicePixelRatio || 1), W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr, g = cv.getContext('2d');
        // 動畫裡不放字（結束後會有通知卡片），只有特別標記的字（g.keepText）才畫
        const ft = g.fillText.bind(g), st2 = g.strokeText.bind(g); g.keepText = ft; g.fillText = (s, ...a) => { if (!/[\p{L}\p{N}]/u.test(String(s))) ft(s, ...a); }; g.strokeText = (s, ...a) => { if (!/[\p{L}\p{N}]/u.test(String(s))) st2(s, ...a); }; // 只擋文字，emoji 圖案照畫
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
        <div class="qz-top"><span>⚔️ 翻盤問答${pd.lv ? `<em class="qz-lv ${pd.lv}">${{ e: '簡單', m: '中等', h: '困難', f: '影視題' }[pd.lv]}</em>` : ''}</span><span class="timer" data-deadline="${res ? '' : v.deadline}"></span></div>
        <div class="qz-vs">${who(pd.debtor, '破產危機')}<em>VS</em>${who(pd.cred, '收錢的人')}</div>
        <div class="qz-bar"><i style="animation-duration:${res ? 0 : Math.max(0.5, (v.deadline - this.now()) / 1000)}s"></i></div>
        <p class="qz-q">${U.esc(pd.q)}</p>
        <div class="qz-opts">${pd.opts.map((o, i) => { const st = res ? (i === key ? 'ok' : 'ng') : (ans[me] && ans[me].c === i ? 'pick' : '');
          const heads = Object.entries(ans).filter(([, a]) => a.c === i).map(([s]) => this.faceHTML(v, +s, 26)).join('');
          return `<button class="qz-o ${st}" data-c="${i}" ${mine && !answered(me) ? '' : 'disabled'}><span>${'ABCD'[i]}</span>${U.esc(o)}<i>${heads}</i></button>`; }).join('')}</div>
        ${res && res.note ? `<div class="qz-note">💡 ${U.esc(res.note)}</div>` : ''}
        <p class="qz-tip">${res ? (res.win ? `🎉 ${U.esc(v.names[pd.debtor])} 翻盤成功！不用付 ${fmt(pd.amt)} ${th.unit}` : `💀 ${U.esc(v.names[pd.debtor])} 翻盤失敗……`) + '<br><small>點一下繼續</small>' : mine ? (answered(me) ? '已送出，等對方……' : '搶答！比對方先答對就贏') : `賭注：${fmt(pd.amt)} ${th.unit} 過路費・破產者答對而且比收錢者快，就免付、不出局`}</p></div>`;
      box.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { if (b.disabled) return; this.ui.send({ type: 'answer', c: +b.dataset.c }); box.querySelectorAll('[data-c]').forEach(x => x.disabled = true); b.classList.add('pick'); SFX.step(); });
    },
    now() { try { return root.Room && root.Room.serverNow ? root.Room.serverNow() : Date.now(); } catch (e) { return Date.now(); } },
    async quizReveal(e) {
      this._revealing = true;
      this.quizUI({ debtor: e.debtor, cred: e.cred, q: e.q, opts: e.opts, amt: e.amt, lv: e.lv }, e);
      if (e.win) { SFX.glory(); this.vfx('glory'); this.board && this.board.mood(e.debtor, 'joy', 2000); this.board && this.board.mood(e.cred, 'sad', 2000); }
      else { SFX.doom(); this.board && this.board.mood(e.debtor, 'scared', 2500); }
      // 小知識讓大家看完（約 6.5 秒），點一下可以先收起來
      await new Promise(r => { const qz = this.el.querySelector('.mono-quiz'); const t = setTimeout(r, 6500); qz.onclick = () => { clearTimeout(t); r(); }; });
      const qz0 = this.el && this.el.querySelector('.mono-quiz'); if (qz0) qz0.onclick = null;
      this._revealing = false; const qz = this.el && this.el.querySelector('.mono-quiz'); if (qz) qz.hidden = true;
    },
    // 全螢幕畫布動畫的共用外框
    overlay(T, draw, sound) {
      return new Promise(res => {
        sound && sound(); if (this.board) this.board.paused = true;
        const cv = document.createElement('canvas'); cv.className = 'stargate'; document.body.appendChild(cv);
        const pixd = root.__pix && this.v && this.v.theme === 'town'; if (pixd) cv.style.imageRendering = 'pixelated';
        const dpr = pixd ? 0.32 : Math.min(2, window.devicePixelRatio || 1), W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr, g = cv.getContext('2d');
        // 動畫裡不放字（結束後會有通知卡片），只有特別標記的字（g.keepText）才畫
        const ft = g.fillText.bind(g), st2 = g.strokeText.bind(g); g.keepText = ft; g.fillText = (s, ...a) => { if (!/[\p{L}\p{N}]/u.test(String(s))) ft(s, ...a); }; g.strokeText = (s, ...a) => { if (!/[\p{L}\p{N}]/u.test(String(s))) st2(s, ...a); }; // 只擋文字，emoji 圖案照畫
        const t0 = performance.now();
        const frame = () => { const ms = performance.now() - t0; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.setTransform(1, 0, 0, 1, 0, 0); draw(g, W, H, dpr, ms / 1000, ms / T); if (ms > T - 700) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(0,0,0,${Math.min(1, (ms - (T - 700)) / 650)})`; g.fillRect(0, 0, W, H); } cv.style.opacity = String(Math.min(1, ms / 250, (T - ms) / 300));
          if (ms < T) requestAnimationFrame(frame); else { cv.style.transition = 'opacity .6s'; cv.style.opacity = '0'; setTimeout(() => cv.remove(), 650); if (this.board) this.board.paused = false; res(); } };
        requestAnimationFrame(frame);
      });
    },
    // ===== 諸神黃昏彩蛋：人類 vs 眾神（humanWins：人類贏） =====
    godWar(humanWins) {
      const rnd = (a, b) => a + Math.random() * (b - a);
      // 有肌肉弧度的肢體（兩端不同粗細、一側鼓起）
      const limb = (g, x1, y1, x2, y2, w1, w2, bulge) => {
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, b = bulge == null ? 1.25 : bulge, wm = Math.max(w1, w2);
        g.beginPath(); g.moveTo(x1 + nx * w1, y1 + ny * w1); g.quadraticCurveTo(mx + nx * wm * b, my + ny * wm * b, x2 + nx * w2, y2 + ny * w2);
        g.arc(x2, y2, w2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true);
        g.quadraticCurveTo(mx - nx * wm * (b * 0.85), my - ny * wm * (b * 0.85), x1 - nx * w1, y1 - ny * w1); g.arc(x1, y1, w1, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true); g.closePath(); g.fill(); g.stroke();
      };
      const lerp = (a, b, k) => a + (b - a) * k;
      // 戰士骨架：p＝出拳伸展程度，crouch＝蹲低
      const skel = (p, crouch, big) => { const s = big ? 1.18 : 1;
        const hip = [0, -95 * s + crouch * 12], chest = [6 * p, -160 * s + crouch * 14], neck = [10 * p, -182 * s + crouch * 14], head = [14 * p, -205 * s + crouch * 14];
        const shF = [chest[0] + 6, chest[1] - 12], shB = [chest[0] - 4, chest[1] - 16]; // 側面：近側肩在前、遠側肩被身體擋住一半
        const elF = [lerp(shF[0] + 30, shF[0] + 62, p), lerp(shF[1] + 34, shF[1] - 4, p)], haF = [lerp(shF[0] + 52, shF[0] + 118, p), lerp(shF[1] + 6, shF[1] - 6, p)];
        const elB = [lerp(shB[0] + 22, shB[0] - 22, p), shB[1] + 40], haB = [lerp(shB[0] + 40, shB[0] + 6, p), lerp(shB[1] + 16, shB[1] + 54, p)]; // 遠側手：護在臉前，出拳時收回腰側
        const knF = [hip[0] + 34 + p * 10, hip[1] + 48 - crouch * 6], ftF = [hip[0] + 48 + p * 16, 0], knB = [hip[0] - 30, hip[1] + 46 - crouch * 6], ftB = [hip[0] - 54 - p * 10, 0];
        return { hip, chest, neck, head, shF, shB, elF, haF, elB, haB, knF, ftF, knB, ftB, s };
      };
      const human = (g, p, crouch, flash) => { // 肌肉人類戰士：寬肩窄腰、繃帶拳頭、短刺髮
        const k = skel(p, crouch, false);
        const skin = g.createLinearGradient(-60, -230, 80, 0); skin.addColorStop(0, '#e2a77a'); skin.addColorStop(0.55, '#b0714a'); skin.addColorStop(1, '#5e3420');
        const ink = '#2a1208'; g.lineWidth = 2.2; g.lineJoin = 'round'; g.strokeStyle = ink;
        const S = flash ? '#111' : skin, pants = flash ? '#111' : '#262230';
        g.fillStyle = flash ? '#111' : '#17141e'; limb(g, k.hip[0] - 8, k.hip[1], k.knB[0], k.knB[1], 17, 13); limb(g, k.knB[0], k.knB[1], k.ftB[0], k.ftB[1] - 6, 13, 9, 1.1);
        g.fillStyle = flash ? '#111' : '#7a4a30'; limb(g, k.shB[0], k.shB[1], k.elB[0], k.elB[1], 15, 12, 1.4); limb(g, k.elB[0], k.elB[1], k.haB[0], k.haB[1], 12, 10, 1.2); // 遠側手臂（比較暗）
        g.fillStyle = flash ? '#111' : '#bdb2a0'; g.beginPath(); g.arc(k.haB[0], k.haB[1], 12, 0, 7); g.fill(); g.stroke();
        // 軀幹（側面）：厚實的背、往前鼓的胸肌、收窄的腰
        const torso = () => { g.beginPath(); g.moveTo(k.neck[0] - 10, k.neck[1] + 4); g.quadraticCurveTo(k.chest[0] - 34, k.chest[1] - 4, k.chest[0] - 26, k.chest[1] + 30); g.quadraticCurveTo(k.hip[0] - 24, k.hip[1] - 30, k.hip[0] - 18, k.hip[1] - 4);
          g.lineTo(k.hip[0] + 16, k.hip[1] - 4); g.quadraticCurveTo(k.hip[0] + 22, k.hip[1] - 34, k.chest[0] + 22, k.chest[1] + 18); g.quadraticCurveTo(k.chest[0] + 36, k.chest[1] + 6, k.chest[0] + 26, k.chest[1] - 8); g.quadraticCurveTo(k.chest[0] + 14, k.neck[1] + 4, k.neck[0] + 8, k.neck[1] + 6); g.closePath(); };
        g.fillStyle = S; torso(); g.fill(); g.stroke();
        if (!flash) { g.strokeStyle = 'rgba(60,24,10,0.55)'; g.lineWidth = 1.8;
          g.beginPath(); g.moveTo(k.chest[0] - 4, k.chest[1] + 4); g.quadraticCurveTo(k.chest[0] + 14, k.chest[1] + 22, k.chest[0] + 30, k.chest[1] + 8); g.stroke(); // 胸肌下緣
          for (let r = 0; r < 3; r++) { const y = k.chest[1] + 30 + r * 12; g.beginPath(); g.moveTo(k.chest[0] + 8, y); g.quadraticCurveTo(k.chest[0] + 14, y + 4, k.chest[0] + 20, y - 1); g.stroke(); } // 側面看到的腹肌
          for (let r = 0; r < 3; r++) { const y = k.chest[1] + 16 + r * 9; g.beginPath(); g.moveTo(k.chest[0] - 6, y); g.lineTo(k.chest[0] + 4, y + 5); g.stroke(); } // 前鋸肌
          g.beginPath(); g.moveTo(k.chest[0] - 2, k.chest[1] + 40); g.quadraticCurveTo(k.hip[0] + 4, k.hip[1] - 22, k.hip[0] + 14, k.hip[1] - 6); g.stroke(); // 腹斜肌
          g.beginPath(); g.moveTo(k.chest[0] - 22, k.chest[1] + 4); g.quadraticCurveTo(k.chest[0] - 12, k.chest[1] + 30, k.chest[0] - 18, k.chest[1] + 48); g.stroke(); // 背闊肌
          g.strokeStyle = ink; g.lineWidth = 2.2; }
        g.fillStyle = flash ? '#111' : '#3a1d10'; g.fillRect(k.hip[0] - 21, k.hip[1] - 10, 42, 9); // 腰帶
        g.fillStyle = pants; limb(g, k.hip[0] + 8, k.hip[1], k.knF[0], k.knF[1], 18, 14); limb(g, k.knF[0], k.knF[1], k.ftF[0], k.ftF[1] - 6, 14, 9, 1.1);
        g.fillStyle = flash ? '#111' : '#1a1418'; [k.ftB, k.ftF].forEach(f => { g.beginPath(); g.ellipse(f[0] + 6, f[1] - 4, 16, 7, 0, 0, 7); g.fill(); });
        // 頭：方下巴、刺髮
        g.fillStyle = S; limb(g, k.neck[0], k.neck[1] + 6, k.head[0], k.head[1] + 8, 11, 10, 1); g.beginPath(); g.ellipse(k.head[0] + 2, k.head[1], 17, 21, 0.15, 0, 7); g.fill(); g.stroke();
        g.fillStyle = flash ? '#111' : '#120a08'; g.beginPath(); g.moveTo(k.head[0] - 16, k.head[1] - 4); for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i * 0.14); g.lineTo(k.head[0] + Math.cos(a) * 30, k.head[1] - 6 + Math.sin(a) * 30); g.lineTo(k.head[0] + Math.cos(a + 0.07) * 17, k.head[1] - 4 + Math.sin(a + 0.07) * 19); } g.closePath(); g.fill();
        if (!flash) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(k.head[0] + 10, k.head[1] - 2, 4, 2, -0.2, 0, 7); g.fill(); g.strokeStyle = ink; g.beginPath(); g.moveTo(k.head[0] + 4, k.head[1] - 9); g.lineTo(k.head[0] + 16, k.head[1] - 6); g.stroke(); }
        g.fillStyle = S; limb(g, k.shF[0], k.shF[1], k.elF[0], k.elF[1], 17, 13, 1.5); limb(g, k.elF[0], k.elF[1], k.haF[0], k.haF[1], 13, 11, 1.25);
        g.fillStyle = flash ? '#111' : '#f1e6d2'; g.beginPath(); g.arc(k.haF[0], k.haF[1], 14, 0, 7); g.fill(); g.stroke();
        if (!flash) { g.strokeStyle = 'rgba(255,170,110,0.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(k.chest[0] + 27, k.chest[1] - 4); g.quadraticCurveTo(k.chest[0] + 34, k.chest[1] + 8, k.chest[0] + 22, k.chest[1] + 20); g.quadraticCurveTo(k.hip[0] + 22, k.hip[1] - 34, k.hip[0] + 16, k.hip[1] - 6); g.stroke(); } // 胸腹前緣的邊緣光
      };
      const god = (g, p, crouch, flash, t) => { // 神：金色光環、飄動長髮鬍鬚、披肩長袍、手臂纏繞雷電
        const k = skel(p, crouch, true); const ink = '#5a4320'; g.lineWidth = 2; g.lineJoin = 'round'; g.strokeStyle = ink;
        if (!flash) { const au = g.createRadialGradient(k.chest[0], k.chest[1], 20, k.chest[0], k.chest[1], 230); au.addColorStop(0, 'rgba(255,236,170,0.45)'); au.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = au; g.beginPath(); g.arc(k.chest[0], k.chest[1], 230, 0, 7); g.fill(); }
        const skin = flash ? '#111' : (() => { const s2 = g.createLinearGradient(-60, -260, 80, 0); s2.addColorStop(0, '#fff3d6'); s2.addColorStop(1, '#c9a46a'); return s2; })();
        const cloth = flash ? '#111' : (() => { const c = g.createLinearGradient(-80, -200, 60, 0); c.addColorStop(0, '#ffffff'); c.addColorStop(1, '#cfc6b4'); return c; })();
        // 長袍下擺（隨風飄）
        g.fillStyle = cloth; g.beginPath(); g.moveTo(k.hip[0] - 26, k.hip[1] - 14); g.quadraticCurveTo(k.hip[0] - 60 - Math.sin(t * 6) * 10, k.hip[1] + 50, k.ftB[0] - 20, 0); g.lineTo(k.ftF[0] + 26, 0); g.quadraticCurveTo(k.hip[0] + 50, k.hip[1] + 40, k.hip[0] + 26, k.hip[1] - 14); g.closePath(); g.fill(); g.stroke();
        if (!flash) { g.strokeStyle = 'rgba(120,100,70,0.35)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(k.hip[0] - 18 + i * 9, k.hip[1]); g.quadraticCurveTo(k.hip[0] - 26 + i * 14, k.hip[1] + 50, k.hip[0] - 34 + i * 20, -4); g.stroke(); } g.strokeStyle = ink; }
        g.fillStyle = flash ? '#111' : '#a8844e'; limb(g, k.shB[0], k.shB[1], k.elB[0], k.elB[1], 16, 13, 1.35); limb(g, k.elB[0], k.elB[1], k.haB[0], k.haB[1], 13, 10, 1.2); // 遠側手臂（比較暗）
        g.fillStyle = skin; g.beginPath(); g.moveTo(k.neck[0] - 12, k.neck[1] + 4); g.quadraticCurveTo(k.chest[0] - 38, k.chest[1] - 4, k.chest[0] - 28, k.chest[1] + 34); g.quadraticCurveTo(k.hip[0] - 26, k.hip[1] - 30, k.hip[0] - 22, k.hip[1] - 8);
        g.lineTo(k.hip[0] + 20, k.hip[1] - 8); g.quadraticCurveTo(k.hip[0] + 26, k.hip[1] - 36, k.chest[0] + 24, k.chest[1] + 20); g.quadraticCurveTo(k.chest[0] + 40, k.chest[1] + 6, k.chest[0] + 28, k.chest[1] - 10); g.quadraticCurveTo(k.chest[0] + 14, k.neck[1] + 4, k.neck[0] + 8, k.neck[1] + 6); g.closePath(); g.fill(); g.stroke();
        if (!flash) { g.strokeStyle = 'rgba(120,90,40,0.45)'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(k.chest[0] - 4, k.chest[1] + 6); g.quadraticCurveTo(k.chest[0] + 16, k.chest[1] + 24, k.chest[0] + 32, k.chest[1] + 8); g.stroke(); g.strokeStyle = ink; g.lineWidth = 2; }
        // 斜披一邊肩膀的布
        g.fillStyle = cloth; g.beginPath(); g.moveTo(k.neck[0] - 12, k.neck[1] + 2); g.quadraticCurveTo(k.chest[0] + 8, k.chest[1] + 4, k.hip[0] + 22, k.hip[1] - 10); g.lineTo(k.hip[0] - 6, k.hip[1] - 6); g.quadraticCurveTo(k.chest[0] - 30, k.chest[1] + 20, k.neck[0] - 18, k.neck[1] + 14); g.closePath(); g.fill(); g.stroke(); // 從背後斜披到腰的布
        g.fillStyle = flash ? '#111' : '#d9b85a'; g.fillRect(k.hip[0] - 26, k.hip[1] - 16, 52, 8);
        // 頭、飄動長髮與鬍鬚、金色桂冠、發光的眼睛
        g.fillStyle = flash ? '#111' : '#f4f1ea';
        for (let i = 0; i < 9; i++) { const w = Math.sin(t * 5 + i) * 8; g.beginPath(); g.moveTo(k.head[0] - 14, k.head[1] - 14 + i * 3); g.quadraticCurveTo(k.head[0] - 40 + w, k.head[1] + 10 + i * 5, k.head[0] - 52 + w * 1.6, k.head[1] + 40 + i * 6); g.lineTo(k.head[0] - 44 + w, k.head[1] + 36 + i * 6); g.quadraticCurveTo(k.head[0] - 30, k.head[1] + 6 + i * 4, k.head[0] - 10, k.head[1] - 8 + i * 3); g.fill(); }
        g.fillStyle = skin; limb(g, k.neck[0], k.neck[1] + 6, k.head[0], k.head[1] + 8, 12, 11, 1); g.beginPath(); g.ellipse(k.head[0] + 2, k.head[1], 18, 22, 0.1, 0, 7); g.fill(); g.stroke();
        g.fillStyle = flash ? '#111' : '#f4f1ea'; g.beginPath(); g.moveTo(k.head[0] - 12, k.head[1] + 6); g.quadraticCurveTo(k.head[0] + 4, k.head[1] + 60 + Math.sin(t * 4) * 4, k.head[0] + 22, k.head[1] + 6); g.quadraticCurveTo(k.head[0] + 6, k.head[1] + 16, k.head[0] - 12, k.head[1] + 6); g.fill(); g.stroke();
        if (!flash) { g.strokeStyle = '#d9b85a'; g.lineWidth = 3; g.beginPath(); g.arc(k.head[0], k.head[1] - 6, 20, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); for (let i = 0; i < 6; i++) { const a = Math.PI * (1.1 + i * 0.15); g.fillStyle = '#e8c860'; g.beginPath(); g.ellipse(k.head[0] + Math.cos(a) * 21, k.head[1] - 6 + Math.sin(a) * 21, 6, 3, a + 1.2, 0, 7); g.fill(); }
          g.fillStyle = '#fffbe0'; g.shadowColor = '#ffe680'; g.shadowBlur = 16; g.beginPath(); g.ellipse(k.head[0] + 11, k.head[1] - 3, 5, 2.5, 0, 0, 7); g.fill(); g.shadowBlur = 0; g.strokeStyle = ink; g.lineWidth = 2; }
        g.strokeStyle = 'rgba(255,240,180,0.8)'; g.lineWidth = 4; if (!flash) { g.beginPath(); g.arc(k.head[0], k.head[1] - 8, 40, 0, 7); g.stroke(); } g.strokeStyle = ink; g.lineWidth = 2;
        g.fillStyle = skin; limb(g, k.shF[0], k.shF[1], k.elF[0], k.elF[1], 18, 14, 1.45); limb(g, k.elF[0], k.elF[1], k.haF[0], k.haF[1], 14, 12, 1.2); g.beginPath(); g.arc(k.haF[0], k.haF[1], 14, 0, 7); g.fill(); g.stroke();
        if (!flash) { g.strokeStyle = 'rgba(200,230,255,0.95)'; g.lineWidth = 2.5; g.shadowColor = '#9fd0ff'; g.shadowBlur = 14; for (let j = 0; j < 3; j++) { g.beginPath(); let x = k.shF[0], y = k.shF[1]; g.moveTo(x, y); for (let i = 1; i <= 6; i++) { x = lerp(k.shF[0], k.haF[0], i / 6) + rnd(-10, 10); y = lerp(k.shF[1], k.haF[1], i / 6) + rnd(-10, 10); g.lineTo(x, y); } g.stroke(); } g.shadowBlur = 0; }
      };
      const debris = Array.from({ length: 40 }, () => ({ a: rnd(-3, 0), v: rnd(0.4, 1.2), r: rnd(3, 9), spin: rnd(-8, 8) }));
      const crowd = Array.from({ length: 160 }, () => ({ x: Math.random(), row: Math.floor(Math.random() * 3), h: rnd(0, 360) }));
      return this.overlay(6200, (g, W, H, dpr, t) => {
        const cx = W / 2, gy = H * 0.7, u = Math.min(W / 440, H / 620);
        // 時間軸：0～1.3 對峙蓄力、1.3～1.6 衝刺、1.6 第一擊（定格）、1.6～3.2 角力、3.2 第二擊、3.6 勝負
        const hitT = [1.6, 3.2], near = hitT.map(h => Math.max(0, 1 - Math.abs(t - h) * 5));
        const impact = Math.max(...near), freeze = hitT.some(h => t > h && t < h + 0.12);
        const zoom = 1 + impact * 0.18 + (t > 3.6 ? 0.08 : 0);
        g.save(); g.translate(cx, gy - 80 * u); g.scale(zoom, zoom); g.translate(-cx, -(gy - 80 * u));
        const shake = impact * 14 * dpr; g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        // 背景：暮色天空、競技場拱門、觀眾
        const sky = g.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, '#120a24'); sky.addColorStop(0.5, '#4a1a30'); sky.addColorStop(1, '#c8562a'); g.fillStyle = freeze ? '#fff' : sky; g.fillRect(-W, -H, W * 3, H * 3);
        if (!freeze) {
          g.fillStyle = 'rgba(255,190,120,0.18)'; g.beginPath(); g.arc(cx, gy - 40 * u, 220 * u, Math.PI, 0); g.fill();
          for (let tier = 0; tier < 2; tier++) { const y0 = gy - (150 - tier * 70) * u, h = 60 * u; g.fillStyle = tier ? '#3a1e1a' : '#2c1616'; g.fillRect(-W, y0, W * 3, h);
            g.fillStyle = tier ? '#1a0c0c' : '#140808'; for (let x = -W; x < W * 2; x += 44 * u) { g.beginPath(); g.moveTo(x + 8 * u, y0 + h); g.lineTo(x + 8 * u, y0 + 22 * u); g.arc(x + 22 * u, y0 + 22 * u, 14 * u, Math.PI, 0); g.lineTo(x + 36 * u, y0 + h); g.fill(); } }
          crowd.forEach(c => { const y = gy - (176 - c.row * 9) * u, x = c.x * W; g.fillStyle = `hsla(${c.h},30%,${30 + c.row * 6}%,1)`; g.beginPath(); g.arc(x, y + Math.sin(t * 12 + c.x * 40) * 1.5 * u, 3.2 * u, 0, 7); g.fill(); });
          const gr = g.createLinearGradient(0, gy, 0, H); gr.addColorStop(0, '#6a3a24'); gr.addColorStop(1, '#2a140c'); g.fillStyle = gr; g.fillRect(-W, gy, W * 3, H);
          g.strokeStyle = 'rgba(30,10,4,0.6)'; g.lineWidth = 2 * dpr; if (t > 1.6) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI; g.beginPath(); g.moveTo(cx, gy + 4); g.lineTo(cx + Math.cos(a) * 160 * u, gy + 4 + Math.sin(a) * 26 * u); g.stroke(); }
        } else { g.fillStyle = '#fff'; g.fillRect(-W, gy, W * 3, H); }
        // 位置與姿勢
        let hx, gx, hp = 0, gp = 0, hc = 0, gc = 0;
        if (t < 1.3) { hx = cx - 118 * u; gx = cx + 118 * u; hc = 1; gc = 0.5; hp = 0; gp = Math.min(1, t) * 0.3; }
        else if (t < 1.6) { const k = (t - 1.3) / 0.3; hx = cx - lerp(118, 52, k) * u; gx = cx + lerp(118, 60, k) * u; hp = k; gp = k; }
        else if (t < 3.2) { const k = (t - 1.6) / 1.6; const push = Math.sin(k * Math.PI * 3) * 10 * u; hx = cx - (52 + Math.sin(k * Math.PI) * 60) * u + push; gx = cx + (60 + Math.sin(k * Math.PI) * 60) * u + push; hp = 1 - Math.sin(k * Math.PI) * 0.8; gp = hp; hc = Math.sin(k * Math.PI) * 0.6; }
        else if (t < 3.6) { hx = cx - 52 * u; gx = cx + 60 * u; hp = 1; gp = 1; }
        else { const k = Math.min(1, (t - 3.6) / 0.6), e = 1 - Math.pow(1 - k, 3); hx = cx - 52 * u; gx = cx + 60 * u; hp = gp = 1; if (humanWins) gx += e * W * 0.9; else hx -= e * W * 0.9; }
        const flyRot = (t > 3.6) ? Math.min(1, (t - 3.6) / 0.6) * 2.4 : 0;
        // 衝刺殘影
        if (t > 1.3 && t < 1.6 && !freeze) { g.globalAlpha = 0.25; [40, 80].forEach(o => { g.save(); g.translate(hx - o * u, gy); g.scale(u, u); human(g, hp, hc, false); g.restore(); }); g.globalAlpha = 1; }
        g.save(); g.translate(hx, gy); if (!humanWins && flyRot) g.rotate(-flyRot); g.scale(u, u); human(g, hp, hc, freeze); g.restore();
        g.save(); g.translate(gx, gy); if (humanWins && flyRot) g.rotate(flyRot); g.scale(-u, u); god(g, gp, gc, freeze, t); g.restore();
        // 碰撞：衝擊波、光、飛石
        hitT.forEach(h => { const k = (t - h) / 0.7; if (k < 0 || k > 1 || freeze) return; const px = cx + 4 * u, py = gy - 170 * u;
          g.strokeStyle = `rgba(255,250,230,${1 - k})`; g.lineWidth = 10 * dpr * (1 - k); g.beginPath(); g.ellipse(px, py, k * 260 * u, k * 120 * u, 0, 0, 7); g.stroke();
          const fl = g.createRadialGradient(px, py, 0, px, py, 140 * u * (1 - k * 0.5)); fl.addColorStop(0, `rgba(255,255,240,${1 - k})`); fl.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = fl; g.beginPath(); g.arc(px, py, 140 * u, 0, 7); g.fill();
          debris.forEach(d => { const dd = k * d.v * 260 * u; g.save(); g.translate(px + Math.cos(d.a) * dd, py + Math.sin(d.a) * dd + k * k * 120 * u); g.rotate(d.spin * k); g.fillStyle = '#4a2a1a'; g.fillRect(-d.r * u / 2, -d.r * u / 2, d.r * u, d.r * u * 0.7); g.restore(); }); });
        // 漫畫速度線
        if (t > 1.25 && t < 4.2) { g.strokeStyle = freeze ? 'rgba(0,0,0,0.6)' : 'rgba(255,240,220,0.16)'; g.lineWidth = 1.6 * dpr; for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283 + (i % 3) * 0.02; const r0 = W * (0.35 + (i % 5) * 0.04); g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, gy - 160 * u + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * W * 1.2, gy - 160 * u + Math.sin(a) * W * 1.2); g.stroke(); } }
        g.restore();
        g.textAlign = 'center'; g.lineJoin = 'round'; g.font = `900 ${28 * dpr}px system-ui, sans-serif`; g.lineWidth = 7 * dpr; g.strokeStyle = '#000';
        const title = t < 1.3 ? '⚔️ 諸神黃昏・人神對決' : t > 3.9 ? (humanWins ? '人類勝利！' : '眾神勝利！') : '';
        if (title) { g.fillStyle = t > 3.9 ? (humanWins ? '#ff9a6a' : '#ffe9a0') : '#fff'; g.strokeText(title, cx, H * 0.16); g.fillText(title, cx, H * 0.16); }
      }, () => { SFX.roar(); [1.6, 3.2].forEach(d => setTimeout(() => { SFX.clash(); SFX.thunder(); }, d * 1000)); setTimeout(() => (humanWins ? SFX.roar() : SFX.glory()), 3900); });
    },
    // ===== 夜城好運卡：意識共鳴（夢幻、幻彩、有機的意識空間） =====
    mindLink() {
      const rnd = (a, b) => a + Math.random() * (b - a);
      const cells = Array.from({ length: 70 }, () => ({ a: rnd(0, 6.283), d: rnd(0.05, 1.2), rx: rnd(0.6, 1.4), ry: rnd(0.45, 0.9), rot: rnd(0, 3), h: rnd(150, 290), sp: rnd(0.6, 1.2) }));
      const tend = Array.from({ length: 11 }, (_, i) => ({ a: i / 11 * 6.283 + rnd(-0.2, 0.2), w: rnd(14, 26), ph: rnd(0, 6), holes: Array.from({ length: 9 }, () => ({ k: rnd(0.25, 0.95), o: rnd(-0.5, 0.5), r: rnd(3, 8) })) }));
      const sparks = Array.from({ length: 90 }, () => ({ a: rnd(0, 6.283), d: rnd(0, 1), sp: rnd(0.1, 0.4), h: rnd(0, 360) }));
      let layer = null;
      return this.overlay(5600, (g, W, H, dpr, t) => {
        const cx = W / 2, cy = H * 0.48, M = Math.max(W, H), R = Math.min(W, H) * 0.16 * (1 + Math.sin(t * 2) * 0.03);
        // 柔和的粉藍白光背景
        const bg = g.createRadialGradient(cx, cy, 0, cx, cy, M * 0.75); bg.addColorStop(0, '#fbfdff'); bg.addColorStop(0.25, '#d6f3f6'); bg.addColorStop(0.55, '#a9c9ee'); bg.addColorStop(0.85, '#8a78c8'); bg.addColorStop(1, '#4a3a88'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
        // 有機細胞斑點：從中心往外飛（像在往前穿越）
        cells.forEach(c => { c.d += c.sp * 0.006 * (1 + t * 0.4); if (c.d > 1.3) { c.d = 0.05; c.a = rnd(0, 6.283); }
          const dist = Math.pow(c.d, 1.6) * M * 0.75, x = cx + Math.cos(c.a) * dist, y = cy + Math.sin(c.a) * dist, sz = (8 + c.d * 70) * dpr;
          g.save(); g.translate(x, y); g.rotate(c.rot + t * 0.2); g.globalAlpha = Math.min(1, c.d * 3) * 0.9;
          const cg = g.createRadialGradient(0, 0, 0, 0, 0, sz); cg.addColorStop(0, `hsla(${c.h},55%,22%,0.95)`); cg.addColorStop(0.6, `hsla(${c.h},55%,38%,0.85)`); cg.addColorStop(0.85, `hsla(${(c.h + 60) % 360},80%,75%,0.9)`); cg.addColorStop(1, `hsla(${(c.h + 120) % 360},90%,90%,0)`);
          g.fillStyle = cg; g.beginPath(); g.ellipse(0, 0, sz * c.rx, sz * c.ry, 0, 0, 7); g.fill();
          g.strokeStyle = `hsla(${(c.h + t * 80) % 360},100%,85%,0.6)`; g.lineWidth = 1.5 * dpr; g.beginPath(); g.ellipse(-sz * 0.2, -sz * 0.15, sz * c.rx * 0.6, sz * c.ry * 0.5, 0, 3.6, 5.6); g.stroke();
          g.restore(); });
        g.globalAlpha = 1;
        // 幻彩薄膜觸鬚（有破洞的網狀組織），從中央的核心往外延伸
        if (!layer || layer.width !== W) { layer = document.createElement('canvas'); layer.width = W; layer.height = H; }
        const L = layer.getContext('2d'); L.clearRect(0, 0, W, H);
        tend.forEach(td => { const len = M * 0.62, a = td.a + Math.sin(t * 0.8 + td.ph) * 0.12, bend = Math.sin(t * 1.3 + td.ph) * 0.35;
          const p = (k) => { const ang = a + bend * k * k; return [cx + Math.cos(ang) * (R * 0.9 + k * len), cy + Math.sin(ang) * (R * 0.9 + k * len)]; };
          const gr = L.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.3, `hsla(${(300 + t * 30) % 360},80%,80%,0.9)`); gr.addColorStop(0.65, `hsla(${(200 + t * 30) % 360},80%,75%,0.85)`); gr.addColorStop(1, 'hsla(260,70%,70%,0)');
          L.fillStyle = gr; L.beginPath(); const N = 16; const pts = []; for (let i = 0; i <= N; i++) pts.push(p(i / N));
          for (let i = 0; i <= N; i++) { const [x, y] = pts[i], w = td.w * dpr * (1 - i / N * 0.85) * (1 + Math.sin(i * 1.7 + t * 3) * 0.2), nx = -Math.sin(a), ny = Math.cos(a); i ? L.lineTo(x + nx * w, y + ny * w) : L.moveTo(x + nx * w, y + ny * w); }
          for (let i = N; i >= 0; i--) { const [x, y] = pts[i], w = td.w * dpr * (1 - i / N * 0.85) * (1 + Math.cos(i * 1.3 + t * 3) * 0.2), nx = -Math.sin(a), ny = Math.cos(a); L.lineTo(x - nx * w, y - ny * w); }
          L.closePath(); L.fill();
          L.globalCompositeOperation = 'destination-out'; td.holes.forEach(hh => { const [x, y] = p(hh.k), w = td.w * dpr * (1 - hh.k * 0.85); L.beginPath(); L.ellipse(x + hh.o * w, y - hh.o * w * 0.5, hh.r * dpr * (1 - hh.k * 0.5), hh.r * dpr * 0.6, a, 0, 7); L.fill(); }); L.globalCompositeOperation = 'source-over'; });
        g.drawImage(layer, 0, 0);
        // 中央的意識核心：發光球體，表面是一圈圈幻彩花瓣
        const glow = g.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 2.4); glow.addColorStop(0, 'rgba(255,255,255,0.9)'); glow.addColorStop(1, 'rgba(200,230,255,0)'); g.fillStyle = glow; g.beginPath(); g.arc(cx, cy, R * 2.4, 0, 7); g.fill();
        const orb = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R); orb.addColorStop(0, '#ffffff'); orb.addColorStop(0.6, '#e6f6ff'); orb.addColorStop(1, '#9ab6e8'); g.fillStyle = orb; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
        g.save(); g.beginPath(); g.arc(cx, cy, R * 0.97, 0, 7); g.clip();
        [[0.28, 6, 0.16], [0.55, 12, 0.13], [0.8, 18, 0.1]].forEach(([rr, n, ps], ri) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283 + t * (ri % 2 ? -0.35 : 0.25); const x = cx + Math.cos(a) * R * rr, y = cy + Math.sin(a) * R * rr * 0.92;
          g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); const hue = (i * 360 / n + ri * 50 + t * 60) % 360; const pg = g.createLinearGradient(0, -R * ps, 0, R * ps); pg.addColorStop(0, `hsl(${hue},90%,82%)`); pg.addColorStop(1, `hsl(${(hue + 80) % 360},85%,62%)`);
          g.fillStyle = pg; g.strokeStyle = 'rgba(40,30,80,0.55)'; g.lineWidth = 1.2 * dpr; g.beginPath(); g.ellipse(0, 0, R * ps * 0.45, R * ps, 0, 0, 7); g.fill(); g.stroke(); g.restore(); } });
        g.restore();
        g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(cx - R * 0.35, cy - R * 0.42, R * 0.28, R * 0.14, -0.6, 0, 7); g.fill();
        // 幻彩光點
        g.globalCompositeOperation = 'lighter'; sparks.forEach(sp => { sp.d = (sp.d + sp.sp * 0.01) % 1; const dist = R * 1.1 + sp.d * M * 0.5; g.fillStyle = `hsla(${(sp.h + t * 90) % 360},100%,75%,${1 - sp.d})`; g.beginPath(); g.arc(cx + Math.cos(sp.a) * dist, cy + Math.sin(sp.a) * dist, (1 + (1 - sp.d) * 2.5) * dpr, 0, 7); g.fill(); });
        g.globalCompositeOperation = 'source-over';
        if (t < 2.6) { g.globalAlpha = Math.min(1, t * 2, (2.6 - t) * 2); g.textAlign = 'center'; g.font = `600 ${22 * dpr}px system-ui, sans-serif`; g.fillStyle = '#3a2a78'; g.fillText('意識共鳴', cx, H * 0.12); g.globalAlpha = 1; }
      }, () => SFX.shimmer());
    },
    // ===== 夜城壞運卡：完美進化（只有抽到的人）→ 色彩與聲音消失，只剩虛無 =====
    async evolution(seat) {
      const st = this.el.querySelector('.mono-stage'), b = this.board;
      SFX.void_(); st.style.transition = 'filter 2.4s'; st.style.filter = 'grayscale(1) brightness(0.92)';
      if (b) await b.evolve(seat, k => SFX[k] && SFX[k]());
      await this.overlay(3200, (g, W, H, dpr, t) => {
        g.fillStyle = `rgba(52,54,58,${Math.min(0.7, t / 1.5)})`; g.fillRect(0, 0, W, H);
        const a = Math.min(1, Math.max(0, (t - 0.8) / 0.8)) * Math.min(1, (3.2 - t) / 0.6);
        g.globalAlpha = a; g.textAlign = 'center'; g.fillStyle = '#c8ccd2'; g.font = `300 ${26 * dpr}px system-ui, sans-serif`; g.fillText('完美進化', W / 2, H / 2 - 10 * dpr);
        g.font = `300 ${13 * dpr}px system-ui, sans-serif`; g.fillStyle = '#8a8e96'; g.fillText('沒有痛苦，也沒有任何感覺', W / 2, H / 2 + 22 * dpr); g.globalAlpha = 1;
      });
      this._grey = true; // 這一輪剩下的畫面維持灰色，換下一位擲骰時才恢復
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
      } else body = `<p class="hint">${{ start: `經過或停在這裡領 ${fmt(R().START_BONUS)} ${th.unit}`, jail: '只是路過就沒事；被抓進來要停一回合', free: '休息一下，從 3 張道具中免費挑一張', gotojail: `直接送進${th.corners.jail}`, luck: '抽一張好運卡', bad: '抽一張厄運卡', tax: '財產稅＋房屋稅：總資產分段累進（5 萬內 2%、5–10 萬 5%、10–20 萬 8%、20 萬以上 11%），每蓋一級房子再加 500、地標一塊 3,000', teleport: '隨機傳送到任一塊地', item: '從 3 張道具中挑一張買（越買越貴、錢最少的人 5 折），擲骰子前可以使用' }[t.type]}</p>`;
      m.hidden = false;
      m.innerHTML = `<div class="mm-card tinfo">${t.type === 'prop' ? `<div class="tile-chip" style="background:${t.color}"></div>` : ''}<h3>${U.esc(R().tileName(v.theme, i))}</h3>${body}<button class="btn sm" data-x>關閉</button></div>`;
      m.onclick = (e) => { if (e.target.closest('[data-x]') || e.target === m) { m.hidden = true; this.showPrompt(); } };
    }
  };
  if (typeof document !== 'undefined') ['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, () => { if (!SFX.ctx || SFX.ctx.state !== 'running') SFX.unlock(); }, { passive: true }));
  root.GAMES.monopoly = M;
})(typeof window !== 'undefined' ? window : globalThis);
