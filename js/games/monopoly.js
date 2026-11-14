// 大富翁：遊戲模組（規則在 mono-rules.js，3D 在 mono3d.js）
(function (root) {
  const U = root.GUTIL;
  const R = () => root.MONO_RULES, TH = () => root.MONO_THEMES;

  // ---------- 音效（Web Audio 即時合成） ----------
  const SFX = {
    on: true, ctx: null, rev: null,
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
    glitch() { for (let i = 0; i < 14; i++) { this.noise(0.06, { f: 500 + Math.random() * 4000, type: 'bandpass', q: 8, vol: 0.08, delay: i * 0.07 }); this.tone(80 + Math.random() * 900, 0.06, { type: 'square', vol: 0.03, delay: i * 0.07 + 0.03, wet: false }); } }
  };
  try { SFX.on = localStorage.getItem('mono-sfx') !== '0'; } catch (e) {}

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const fmt = (n) => Math.round(n).toLocaleString();

  const M = {
    id: 'monopoly', name: '大富翁', icon: '🎩', min: 2, max: 6,
    desc: '擲骰子走格子，買地、蓋房子，別人踩到要付過路費。踩到幸運卡或厄運卡會抽主題劇本。錢不夠會自動賣房賣地，賣光就破產。時間到時資產最多的人獲勝，或撐到最後一個沒破產的人。',
    options: [
      { key: 'theme', label: '主題', choices: [['ragnarok', '⚡ 諸神黃昏'], ['cyber', '🌃 夜城'], ['animal', '🦁 動物星球'], ['alien', '👽 外星寶貝']], def: 'ragnarok' },
      { key: 'cash', label: '起始資金', choices: [[50000, '50,000'], [30000, '30,000'], [80000, '80,000']], def: 50000 },
      { key: 'rounds', label: '遊戲長度', choices: [[12, '12 回合（約 30 分）'], [20, '20 回合（約 50 分）'], [35, '35 回合'], [999, '打到剩一人']], def: 20 }
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
        this.queue = this.queue.then(() => this.play(evs)).then(() => this.syncBoard()).catch(e => console.error(e));
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
            <div class="mono-tools"><button data-t="me" title="回到我">🎯</button><button data-t="all" title="全景">🗺️</button><button data-t="sfx" title="音效">${SFX.on ? '🔊' : '🔇'}</button><button data-t="q" title="畫質">${this.quality() === 'high' ? '高' : '低'}</button><label class="auto-tg"><input type="checkbox" ${this._auto ? 'checked' : ''}> 自動</label></div>
            <div class="mono-cam"><button data-c="tu" title="俯視">⤒</button><button data-c="td" title="平視">⤓</button><button data-c="zi">＋</button><button data-c="zo">－</button></div>
            <div class="mono-hint" hidden>單指拖曳移動地圖・雙指開合縮放・雙指上下滑調整角度・點玩家頭像看他在哪</div>
            <div class="mono-vfx"></div>
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
      el.querySelector('.auto-tg input').onchange = (e) => { this._auto = e.target.checked; this.showPrompt(); };
      const stage = el.querySelector('.mono-stage');
      const b = new root.MonoBoard3D();
      b.init(stage, v.theme, R()).then(() => {
        b.ready = true; this.board = b; stage.querySelector('.mono-loading').remove();
        b.onTap = (h) => { if (h.tile != null) this.tileInfo(h.tile); else if (h.seat != null) b.focusSeat(h.seat, true); };
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
          <div><b>${U.esc(v.names[s])}${s === v.seat ? '（你）' : ''}</b><span class="cash" data-s="${s}">${p.alive ? fmt(p.cash) + ' ' + unit : '破產'}</span>
          <small>${p.skip ? `⏸${p.skip} ` : ''}${p.immune ? `🛡${p.immune} ` : ''}${p.jailfree ? `🎫${p.jailfree}` : ''}</small></div>
        </div>`).join('');
      hud.querySelectorAll('.mp').forEach(d => d.onclick = () => { if (this.board) this.board.focusSeat(+d.dataset.s, true); });
      const info = this.el.querySelector('.mono-info');
      info.innerHTML = v.phase === 'over' ? '' : `第 ${Math.min(v.round, v.maxRounds)}${v.maxRounds < 900 ? '/' + v.maxRounds : ''} 回合 · 輪到 <b>${U.esc(v.names[v.turn])}</b> <span class="timer" data-deadline="${v.deadline || ''}"></span>`;
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
      m.innerHTML = `<div class="mm-card"><h3>畫你的角色</h3><canvas class="pad" width="240" height="240"></canvas>
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

    syncBoard(first) {
      const b = this.board, v = this.v; if (!b || !v || v.phase === 'pick') return;
      b.setTokens(v.players.map((p, s) => { const ch = this.charOf(v, s); const c = v.players[s].char; return { seat: s, idx: c ? c.i : s, color: ch ? ch.color : '#999', img: ch && ch.custom ? this.avatarOf(s) : null, alive: p.alive, name: v.names[s] }; }));
      v.players.forEach((p, s) => { const tk = b.tokens[s]; if (tk && !tk.busy && tk.pos !== p.pos) b.place(s, p.pos); });
      b.setBuildings(v.owners, v.levels, v.players.map((p, s) => ({ color: (this.charOf(v, s) || {}).color, charIdx: p.char ? p.char.i : 0 })));
      b.setTurn(v.phase === 'over' ? -1 : v.turn);
      // 輪到自己時，強制把鏡頭拉回自己的角色
      const myTurn = v.seat >= 0 && v.turn === v.seat && v.phase === 'roll';
      if (myTurn && this._lastMyTurn !== v.evId) { this._lastMyTurn = v.evId; b.focusSeat(v.seat, true); }
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
    async play(evs) {
      this.playing = true; this.hidePrompt();
      const v = this.v, b = this.board, unit = TH()[v.theme].unit; const watch = (s) => s === v.seat || b.following === s || v.seat < 0;
      try {
        for (const e of evs) {
          if (!this.board) break;
          switch (e.t) {
            case 'dice': await this.rollDice(e.d); break;
            case 'move': await b.hop(e.seat, e.path, watch(e.seat)); break;
            case 'tp': await b.teleport(e.seat, e.to, watch(e.seat)); break;
            case 'cash': SFX.coin(); this.fx(`+${fmt(e.amt)}${e.why ? ' ' + e.why : ''}`, 'gain', e.seat); b.jumpJoy(e.seat); await sleep(450); break;
            case 'pay':
              SFX.lose(); b.mood(e.from, 'sad', 1300); this.fx(`-${fmt(e.amt)}${e.why ? ' ' + e.why : ''}`, 'loss', e.from); if (e.to >= 0) b.mood(e.to, 'joy', 900);
              if (e.to >= 0) setTimeout(() => this.fx(`+${fmt(e.amt)}`, 'gain', e.to), 300);
              await sleep(650); break;
            case 'buy': SFX.build(); b.mood(e.seat, 'joy', 900); this.fx(`買下！`, 'gain', null, e.tile); this.syncBoard(); await sleep(500); break;
            case 'up': SFX.build(); this.fx(e.free ? '免費升級！' : `升級 Lv${e.level}`, 'gain', null, e.tile); this.syncBoard(); await sleep(600); break;
            case 'down': SFX.lose(); b.mood(e.seat, 'scared', 900); this.fx(`建築被毀 Lv${e.level}`, 'loss', null, e.tile); this.syncBoard(); await sleep(600); break;
            case 'sell': this.fx(e.what === 'land' ? '被迫賣地' : '被迫賣房', 'loss', null, e.tile); this.syncBoard(); await sleep(400); break;
            case 'card': await this.showCard(e); break;
            case 'immune': this.fx('🛡 抵擋了厄運！', 'gain', e.seat); SFX.glory(); this.vfx('glory'); b.mood(e.seat, 'joy', 1200); await sleep(900); break;
            case 'jailfree': this.fx('🎫 使用免罪卡！', 'gain', e.seat); await sleep(900); break;
            case 'jail': SFX.doom(); this.vfx('doom'); this.fx(`⛓ ${TH()[v.theme].corners.jail}`, 'loss', e.seat); await b.teleport(e.seat, R().JAIL, watch(e.seat)); b.mood(e.seat, 'sad', 2000); break;
            case 'skip': this.fx('⏸ 暫停一回合', 'loss', e.seat); await sleep(700); break;
            case 'skipset': this.fx(`⏸ 停 ${e.n} 回合`, 'loss', e.seat); await sleep(500); break;
            case 'bankrupt': SFX.doom(); b.mood(e.seat, 'fall'); this.fx('💥 破產了', 'loss big', e.seat); await b.shake(e.seat); await sleep(800); break;
            case 'note': this.fx(e.text, '', e.seat); await sleep(600); break;
          }
        }
      } finally { this.playing = false; }
      void unit;
    },
    async rollDice(d) {
      const faces = this.el.querySelectorAll('.d6'); SFX.dice();
      for (let k = 0; k < 8; k++) { faces.forEach(f => f.textContent = '⚀⚁⚂⚃⚄⚅'[Math.floor(Math.random() * 6)]); await sleep(60); }
      faces[0].textContent = '⚀⚁⚂⚃⚄⚅'[d[0] - 1]; faces[1].textContent = '⚀⚁⚂⚃⚄⚅'[d[1] - 1];
      this.fx(`${d[0] + d[1]} 步`, 'dice', this.v.turn); await sleep(350);
    },
    showCard(e) {
      return new Promise(res => {
        const v = this.v, th = TH()[v.theme]; const good = e.deck === 'luck';
        if (good) { SFX.glory(); this.vfx('glory'); this.board && this.board.mood(e.seat, 'joy', 1800); }
        else if (e.eff === 'psycho') { SFX.glitch(); SFX.doom(); this.vfx('glitch'); this.board && this.board.mood(e.seat, 'scared', 2500); }
        else { SFX.doom(); this.vfx('doom'); this.board && this.board.mood(e.seat, 'scared', 1800); }
        const m = this.el.querySelector('.mono-modal'); m.hidden = false;
        m.innerHTML = `<div class="mcard ${good ? 'good' : 'bad'}"><div class="mcard-in">
          <div class="mcard-head">${good ? th.luckName : th.badName}</div>
          <div class="mcard-who">${this.faceHTML(v, e.seat, 40)} ${U.esc(v.names[e.seat])}</div>
          <p>${U.esc(e.text)}</p><div class="mcard-eff">${this.effText(e.eff, th)}</div>
          <small>點一下繼續</small></div></div>`;
        let done = false; const fin = () => { if (done) return; done = true; m.hidden = true; res(); };
        m.onclick = fin; setTimeout(fin, 3200);
      });
    },
    effText(eff, th) {
      const [k, v0] = eff.split(':'); const v = +v0; const u = th.unit;
      return { m: v >= 0 ? `+${fmt(v)} ${u}` : `-${fmt(-v)} ${u}`, mv: v >= 0 ? `前進 ${v} 格` : `後退 ${-v} 格`, go: '前往起點並領獎金', gonb: '回到起點（不領錢）', jail: `進入${th.corners.jail}`,
        skip: `暫停 ${v} 回合`, immune: '獲得 🛡 抵擋一次厄運', jailfree: `獲得 🎫 免進${th.corners.jail}一次`, up: '免費升級一棟建築', down: '一棟建築降一級',
        each: `每位玩家付你 ${fmt(v)}`, give: `你付每位玩家 ${fmt(v)}`, house: `每一級建築付 ${fmt(-v)}`, pct: `失去 ${-v}% 現金`, teleport: '隨機傳送', psycho: '失去 30% 現金、兩棟建築降級、停兩回合' }[k] || '';
    },
    hidePrompt() { const m = this.el && this.el.querySelector('.mono-modal'); if (m && !m.querySelector('.mcard') && !m.querySelector('.pad')) m.hidden = true; if (this.el) this.el.querySelector('.go-btn').disabled = true; },
    showPrompt() {
      const v = this.v; if (!this.el || this.playing) return;
      const go = this.el.querySelector('.go-btn'); const m = this.el.querySelector('.mono-modal');
      go.disabled = !this.canAct('roll'); go.classList.toggle('pulse', !go.disabled);
      if (m.querySelector('.pad')) return;
      const th = TH()[v.theme];
      if (v.phase === 'over') {
        m.hidden = false;
        m.innerHTML = `<div class="mm-card over"><h2>🏆 ${U.esc(v.names[v.winner])} 獲勝！</h2>${(v.ranks || []).map((r, k) => `<p>${k + 1}. ${this.faceHTML(v, r.s, 26)} ${U.esc(v.names[r.s])} — ${r.w >= 0 ? '資產 ' + fmt(r.w) + ' ' + th.unit : '破產'}</p>`).join('')}</div>`;
        m.onclick = null; return;
      }
      if ((v.phase === 'buy' || v.phase === 'upgrade') && v.turn === v.seat) {
        const t = R().BOARD[v.pending.tile]; const name = R().tileName(v.theme, t.i);
        const cost = v.phase === 'buy' ? t.price : t.up; const lv = v.levels[t.i];
        const rentNow = v.phase === 'buy' ? Math.round(t.price * 0.12) : Math.round(t.price * [0.12, 0.45, 1.0, 1.8, 2.8][lv + 1]);
        m.hidden = false; m.onclick = null;
        m.innerHTML = `<div class="mm-card"><div class="tile-chip" style="background:${t.color}"></div><h3>${U.esc(name)}</h3>
          <p>${v.phase === 'buy' ? `要買下這塊地嗎？` : `要升級到 Lv${lv + 1} 嗎？`}</p>
          <p class="big">${fmt(cost)} ${th.unit}</p><p class="hint">買了之後別人踩到要付 ${fmt(rentNow)} ${th.unit}（同色兩塊都是你的，空地租金加倍）</p>
          <div class="act-row"><button class="btn ghost" data-y="0">不要</button><button class="btn" data-y="1">${v.phase === 'buy' ? '買！' : '蓋！'}</button></div>
          <span class="timer" data-deadline="${v.deadline}"></span></div>`;
        m.querySelectorAll('[data-y]').forEach(b => b.onclick = () => { this.ui.send({ type: v.phase, yes: b.dataset.y === '1' }); m.hidden = true; });
      } else if (!m.querySelector('.mcard') && !m.querySelector('.tinfo')) m.hidden = true;
      // 自動
      clearTimeout(this._autoT);
      if (this._auto && v.seat >= 0 && v.turn === v.seat && ['roll', 'buy', 'upgrade'].includes(v.phase)) {
        this._autoT = setTimeout(() => {
          if (!this.canAct(v.phase)) return;
          if (v.phase === 'roll') { this.ui.send({ type: 'roll' }); SFX.dice(); }
          else { const t = R().BOARD[v.pending.tile]; const cost = v.phase === 'buy' ? t.price : t.up; this.ui.send({ type: v.phase, yes: v.players[v.seat].cash - cost >= 8000 }); m.hidden = true; }
        }, 900);
      }
    },
    tileInfo(i) {
      const v = this.v; if (!v || this.playing) return; const t = R().BOARD[i]; const th = TH()[v.theme];
      const m = this.el.querySelector('.mono-modal'); if (!m.hidden && !m.querySelector('.tinfo')) return;
      let body = '';
      if (t.type === 'prop') {
        const o = v.owners[i]; const lv = v.levels[i];
        body = `<p>${o >= 0 ? `地主：${this.faceHTML(v, o, 22)} ${U.esc(v.names[o])}　建築 Lv${lv}` : `空地，售價 ${fmt(t.price)} ${th.unit}`}</p>
          <p class="hint">過路費：${[0, 1, 2, 3, 4].map(k => `Lv${k} ${fmt(Math.round(t.price * [0.12, 0.45, 1.0, 1.8, 2.8][k]))}`).join('、')}<br>升級一次 ${fmt(t.up)} ${th.unit}</p>`;
      } else body = `<p class="hint">${{ start: `經過或停在這裡領 ${fmt(R().START_BONUS)} ${th.unit}`, jail: '只是路過就沒事；被抓進來要停一回合', free: '休息一下，什麼事都不會發生', gotojail: `直接送進${th.corners.jail}`, luck: '抽一張好運卡', bad: '抽一張厄運卡', tax: `付 3,000 ${th.unit}`, teleport: '隨機傳送到任一塊地' }[t.type]}</p>`;
      m.hidden = false;
      m.innerHTML = `<div class="mm-card tinfo">${t.type === 'prop' ? `<div class="tile-chip" style="background:${t.color}"></div>` : ''}<h3>${U.esc(R().tileName(v.theme, i))}</h3>${body}<button class="btn sm" data-x>關閉</button></div>`;
      m.onclick = (e) => { if (e.target.closest('[data-x]') || e.target === m) { m.hidden = true; this.showPrompt(); } };
    }
  };
  root.GAMES.monopoly = M;
})(typeof window !== 'undefined' ? window : globalThis);
