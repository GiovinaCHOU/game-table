// 房間邏輯：房主的裝置負責裁判（所有遊戲狀態都在房主那邊算），其他人只收自己看得到的畫面
(function () {
  const { makePeer, Voice, prefix } = window.Net;
  const G = () => window.GAMES;

  function rid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function myCid() {
    let c = null;
    try { c = sessionStorage.getItem('cid'); } catch (e) {}
    if (!c) { c = rid(); try { sessionStorage.setItem('cid', c); } catch (e) {} }
    return c;
  }
  function randPin() { return String(Math.floor(100000 + Math.random() * 900000)); }
  // ---- 本機暫存（localStorage）：讓房間在大家都切出去後還能用同一個 PIN 救回來 ----
  const KEEP_MS = 6 * 3600 * 1000;
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  // 清掉超過 6 小時的舊房間
  try { Object.keys(localStorage).forEach(k => { if (/^(snap|seat):/.test(k)) { const v = LS.get(k); if (!v || Date.now() - (v.t || 0) > KEEP_MS) LS.del(k); } }); } catch (e) {}
  // 同一個 PIN 用固定身分，重新整理或被系統關掉分頁後回來，還是坐回原本的位子
  const TEST_PIN = '777777'; // 測試房：可以加電腦玩家
  function cidFor(pin) { if (window.Net.LOCAL) return myCid(); const v = LS.get('seat:' + pin); if (v && v.cid) { LS.set('seat:' + pin, { cid: v.cid, t: Date.now() }); return v.cid; } const c = rid(); LS.set('seat:' + pin, { cid: c, t: Date.now() }); return c; }

  const Room = {
    isHost: false, pin: null, peer: null, cid: myCid(), name: '', conn: null,
    room: null, view: null, clockOffset: 0,
    cb: { room() {}, view() {}, ev() {}, chat() {}, quick() {}, status() {}, left() {} },

    // ================= 共用 =================
    serverNow() { return Date.now() + this.clockOffset; },
    send(msg) {
      if (this.isHost) { Host.recv(this.cid, msg); return; }
      if (this.conn && this.conn.open) { try { this.conn.send(msg); } catch (e) {} }
    },
    act(a) { this.send({ t: 'act', a }); },
    // 房主→本機
    _deliver(msg) {
      switch (msg.t) {
        case 'room': this.room = msg.room; this.cb.room(msg.room); this._syncVoice(); break;
        case 'view': this.clockOffset = msg.now - Date.now(); this.view = msg.v; this.cb.view(msg.v); break;
        case 'ev': this.cb.ev(msg.ev, msg.from); break;
        case 'chat': this.cb.chat(msg); break;
        case 'quick': this.cb.quick(msg); break;
        case 'err': this.cb.status(msg.msg, true); break;
        case 'ping': this.clockOffset = msg.now - Date.now(); this._lastHost = Date.now(); this.send({ t: 'pong' }); break;
        case 'kick': this.cb.status('你被房主請出房間', true); this.leave(); break;
        case 'snap': this._snap = msg.s; this._snapAt = Date.now(); this.saveSnap(msg.s); break;
      }
    },
    _syncVoice() {
      if (!this.room) return;
      const list = this.room.members.filter(m => m.online && m.voice).map(m => m.peerId);
      Voice.sync(list);
    },
    async setVoice(mode) { // 'talk' | 'listen' | 'off'
      if (mode === 'off') { Voice.stop(); }
      else { if (Voice.mode !== 'off') Voice.stop(); await Voice.start(mode === 'listen'); }
      this.send({ t: 'voice', mode });
    },

    saveSnap(snap) { if (this.pin) LS.set('snap:' + this.pin, { t: Date.now(), snap }); },
    loadSnap(pin) { const v = LS.get('snap:' + pin); if (!v || Date.now() - v.t > KEEP_MS) return null; return v.snap; },
    hasSnap(pin) { return !!this.loadSnap(pin); },

    // ================= 建房 =================
    async create(name, fixedPin) {
      this.name = name; this.isHost = true;
      for (let i = 0; i < (fixedPin ? 1 : 5); i++) {
        const pin = fixedPin || randPin();
        try {
          const peer = await this._openPeer(prefix + pin);
          this.pin = pin; this.peer = peer; this.cid = cidFor(pin);
          Voice.attach(peer);
          Host.init(this, pin);
          peer.on('connection', c => Host.accept(c));
          this._hostPeerEvents(peer);
          Host.recv(this.cid, { t: 'hello', cid: this.cid, name, spec: false, peerId: peer.id });
          return pin;
        } catch (e) {
          if (!/unavailable|taken/i.test(String(e && (e.type || e.message)))) throw e;
        }
      }
      throw new Error('建立房間失敗，請再試一次');
    },
    _hostPeerEvents(peer) {
      peer.on('disconnected', () => { if (this._leaving || !this.isHost) return; this.cb.status('與配對伺服器斷線，重新連線中…'); setTimeout(() => { try { peer.reconnect(); } catch (e) {} }, 1000); });
      peer.on('error', (e) => {
        // 斷線太久，房號已被候補房主接手 → 自己改當一般玩家重新加入
        if (e && e.type === 'unavailable-id' && this.isHost && !this._leaving) this._demote();
      });
    },
    async _demote() {
      Host.stop(); this.isHost = false;
      try { this.peer && this.peer.destroy(); } catch (e) {}
      this.peer = null; try { Voice.stop(); } catch (e) {}
      this.cb.status('你斷線太久，房主已交給其他人，重新以玩家身分加入…', true);
      try { await this.join(this.pin, this.name, false); } catch (e) { this.cb.status('重新加入失敗：' + (e.message || e), true); }
    },
    // ================= 用暫存救回房間（大家都斷線後，第一個回來的人重開） =================
    async revive(pin, name) {
      const snap = this.loadSnap(pin); if (!snap) throw new Error('這台裝置沒有這個房間的暫存');
      this.name = name; this.pin = pin; this.cid = cidFor(pin);
      const peer = await this._openPeer(prefix + pin); // 房號被占用代表房間其實還在 → 丟出 unavailable
      try { this.peer && this.peer !== peer && this.peer.destroy(); } catch (e) {}
      this.peer = peer; this.isHost = true; clearInterval(this._watch);
      try { this.conn && this.conn.close(); } catch (e) {} this.conn = null;
      Voice.attach(peer);
      Host.restore(this, pin, snap, '房間已從暫存救回，其他人用同一個 PIN 就能回來');
      peer.on('connection', c => Host.accept(c));
      this._hostPeerEvents(peer);
      return pin;
    },
    // 回到網頁時：立刻重連；房間不見了就用暫存救回
    async wake() {
      if (!this.pin || this._leaving || this._waking) return;
      this._waking = true;
      try {
        if (this.isHost) {
          const p = this.hostPeer || this.peer;
          if (p && p.destroyed) { this.isHost = false; await this.reenter(); }
          else if (p && p.disconnected) { try { p.reconnect(); } catch (e) {} }
          return;
        }
        if (this.peer && this.peer.disconnected && !this.peer.destroyed) { try { this.peer.reconnect(); } catch (e) {} await new Promise(r => setTimeout(r, 800)); }
        if (this.peer && this.peer.destroyed) this.peer = null;
        if (this.conn && this.conn.open && Date.now() - (this._lastHost || 0) < 6000) return;
        await this.reenter();
      } finally { this._waking = false; }
    },
    // 先試著加入；連不到而且有暫存，就由自己重開房間
    async reenter() {
      try {
        if (!this.peer) { this.peer = await this._openPeer(null); Voice.attach(this.peer); this.peer.on('disconnected', () => { setTimeout(() => { try { this.peer.reconnect(); } catch (e) {} }, 1000); }); }
        this._connecting = false; await this._connect(); return 'joined';
      } catch (e) {
        if (this.hasSnap(this.pin)) {
          try { await this.revive(this.pin, this.name); return 'revived'; }
          catch (e2) { if (/unavailable/.test(String(e2 && e2.message))) { await new Promise(r => setTimeout(r, 1500)); this._connecting = false; await this._connect(); return 'joined'; } throw e2; }
        }
        throw e;
      }
    },
    // ================= 接手房主 =================
    async _takeover() {
      if (this._takingOver || this.isHost || this._leaving) return;
      if (!this.room || !this._snap) return;
      const heirs = this.room.heirs || [this.room.heir];
      // 第一順位候補立刻接；第二順位等久一點才接（第一順位可能也切出去了）
      const rank = heirs.indexOf(this.cid); if (rank < 0) return;
      if (rank > 0 && Date.now() - (this._lastHost || 0) < 20000) return;
      this._takingOver = true;
      this.cb.status('房主斷線了，你是候補房主，正在接手…', true);
      for (let i = 0; i < 20 && !this._leaving; i++) {
        // 房主如果其實回來了，就不搶
        if (this.conn && this.conn.open && Date.now() - (this._lastHost || 0) < 5000) { this._takingOver = false; return; }
        try {
          const hp = await this._openPeer(prefix + this.pin);
          this.hostPeer = hp; this.isHost = true; clearInterval(this._watch);
          try { this.conn && this.conn.close(); } catch (e) {}
          this.conn = null;
          Host.restore(this, this.pin, this._snap);
          hp.on('connection', c => Host.accept(c));
          this._hostPeerEvents(hp);
          this._takingOver = false;
          this.cb.status('');
          return;
        } catch (e) {
          if (!/unavailable/i.test(String(e && e.message))) { /* 網路問題，稍後再試 */ }
          await new Promise(r => setTimeout(r, 3000));
        }
      }
      this._takingOver = false;
    },
    _openPeer(id) {
      return new Promise(async (res, rej) => {
        const p = await makePeer(id);
        const to = setTimeout(() => rej(new Error('連不到配對伺服器，請檢查網路')), 12000);
        p.on('open', () => { clearTimeout(to); res(p); });
        p.on('error', (e) => { clearTimeout(to); if (e && e.type === 'unavailable-id') rej(new Error('unavailable')); else rej(e); });
      });
    },

    // ================= 加入 =================
    async join(pin, name, spec) {
      this.name = name; this.pin = pin; this.isHost = false; this.spec = spec; this.cid = cidFor(pin);
      if (!this.peer) {
        this.peer = await this._openPeer(null);
        Voice.attach(this.peer);
        this.peer.on('disconnected', () => { setTimeout(() => { try { this.peer.reconnect(); } catch (e) {} }, 1000); });
      }
      try { await this._connect(); }
      catch (e) {
        // 房間不在了，但這台裝置有暫存 → 直接救回
        if (this.hasSnap(pin)) { try { await this.revive(pin, name); return 'revived'; } catch (e2) { if (!/unavailable/.test(String(e2 && e2.message))) throw e2; this._connecting = false; await this._connect(); } }
        else throw e;
      }
      clearInterval(this._watch);
      this._watch = setInterval(() => {
        if (this._leaving) return;
        if (this.isHost) return;
        if (Date.now() - (this._lastHost || 0) > 13000) { this.cb.status('與房主斷線，重新連線中…', true); this._takeover(); this._connect().catch(() => { if (Date.now() - (this._lastHost || 0) > 30000 && this.hasSnap(this.pin)) this.revive(this.pin, this.name).catch(() => {}); }); }
      }, 4000);
    },
    _connect() {
      return new Promise((res, rej) => {
        if (this._connecting) return rej(new Error('busy'));
        this._connecting = true;
        try { this.conn && this.conn.close(); } catch (e) {}
        const conn = this.peer.connect(prefix + this.pin, { reliable: true, serialization: 'json' });
        if (!conn) { this._connecting = false; return rej(new Error('無法連線')); }
        const to = setTimeout(() => { this._connecting = false; rej(new Error('找不到這個房間（PIN 錯誤或房主已離開）')); }, 10000);
        conn.on('open', () => {
          clearTimeout(to); this._connecting = false;
          if (this.isHost) { try { conn.close(); } catch (e) {} return res(); }
          this.conn = conn; this._lastHost = Date.now();
          conn.send({ t: 'hello', cid: this.cid, name: this.name, spec: this.spec, peerId: this.peer.id, voice: Voice.mode === 'off' ? null : Voice.mode });
          this.cb.status('');
          res();
        });
        conn.on('data', d => { this._lastHost = Date.now(); this._deliver(d); });
        conn.on('close', () => {
          if (this._leaving || this.isHost || this.conn !== conn) return;
          this.cb.status('與房主斷線，重新連線中…', true);
          setTimeout(() => this._takeover(), 1500);
          setTimeout(() => { if (!this.isHost && !this._leaving) this._connect().catch(() => {}); }, 3500);
        });
        conn.on('error', () => {});
      });
    },
    leave() {
      this._leaving = true; clearInterval(this._watch);
      try { Voice.stop(); } catch (e) {}
      try { this.conn && this.conn.close(); } catch (e) {}
      try { this.peer && this.peer.destroy(); } catch (e) {}
      try { this.hostPeer && this.hostPeer.destroy(); } catch (e) {}
      Host.stop();
      this.cb.left();
    }
  };

  // =================== 房主（裁判） ===================
  const Host = {
    members: [], conns: {}, game: null, lobby: { gameId: 'monopoly', opts: {}, skin: 'nebula' }, timer: null,
    init(R, pin) {
      this.R = R; this.pin = pin; this.members = []; this.conns = {}; this.game = null;
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), 200);
      this._pingT = setInterval(() => this.ping(), 4000);
    },
    stop() { clearInterval(this.timer); clearInterval(this._pingT); },
    restore(R, pin, snap, msg) {
      this.init(R, pin);
      this.lobby = snap.lobby || this.lobby; this.game = snap.game || null;
      this.members = (snap.members || []).map(m => Object.assign({}, m, { offAt: Date.now() + 20000, online: m.cid === R.cid || !!m.bot, auto: !!m.bot, voice: m.cid === R.cid ? (window.Net.Voice.mode === 'off' ? null : window.Net.Voice.mode) : null, seen: Date.now() }));
      if (!this.m(R.cid)) this.members.push({ cid: R.cid, name: R.name, role: 'player', online: true, voice: null, peerId: R.peer.id, seen: Date.now() });
      else { const me = this.m(R.cid); me.peerId = R.peer.id; me.name = R.name || me.name; }
      // 時限重新給：避免一回來就被判逾時
      try { const st = this.game && this.game.state; if (st && st.deadline) st.deadline = Math.max(st.deadline, Date.now() + 20000); } catch (e) {}
      // 被跳過的時限從現在重新算，避免一接手就逾時
      this.pushRoom(); this.pushViews();
      this.sysChat(msg || `原房主斷線，${R.name} 接手當房主，遊戲繼續`);
    },
    heir() {
      // 候補房主：最早加入、目前在線、不是房主的人（玩家優先）
      const c = this.members.filter(m => m.online && !m.bot && m.cid !== this.R.cid);
      const p = c.filter(m => m.role === 'player');
      return (p[0] || c[0] || {}).cid || null;
    },
    heirs() {
      const c = this.members.filter(m => m.online && !m.bot && m.cid !== this.R.cid);
      return c.filter(m => m.role === 'player').concat(c.filter(m => m.role !== 'player')).slice(0, 2).map(m => m.cid);
    },
    sendSnap() {
      if (this._snapQ) return; this._snapQ = true;
      setTimeout(() => {
        this._snapQ = false;
        const members = this.members.map(m => ({ cid: m.cid, name: m.name, role: m.role, peerId: m.peerId, avatar: m.avatar || null, bot: !!m.bot }));
        const s = { lobby: this.lobby, game: this.game, members };
        this.R.saveSnap(s); // 房主自己也存一份：網頁被系統關掉後回來可以救回
        this.heirs().forEach(h => this.to(h, { t: 'snap', s }));
      }, 300);
    },
    accept(conn) {
      conn.on('data', d => {
        if (d && d.t === 'hello') { conn._mcid = d.cid; this.conns[d.cid] = conn; }
        if (conn._mcid) { const m = this.m(conn._mcid); if (m) m.seen = Date.now(); this.recv(conn._mcid, d); }
      });
      conn.on('close', () => {
        const cid = conn._mcid; if (!cid || this.conns[cid] !== conn) return;
        delete this.conns[cid];
        const m = this.m(cid); if (m) { m.online = false; m.offAt = Date.now(); m.voice = null; this.pushRoom(); this.sysChat(`${m.name} 離線了（輪到他時 40 秒後由系統代打）`); }
      });
    },
    m(cid) { return this.members.find(x => x.cid === cid); },
    to(cid, msg) {
      if (cid === this.R.cid) { this.R._deliver(JSON.parse(JSON.stringify(msg))); return; }
      const c = this.conns[cid]; if (c && c.open) { try { c.send(msg); } catch (e) {} }
    },
    all(msg, except) { this.members.forEach(m => { if (m.online && m.cid !== except) this.to(m.cid, msg); }); },
    ping() {
      const now = Date.now();
      this.members.forEach(m => {
        if (m.cid === this.R.cid) return;
        if (m.bot) { m.online = true; m.seen = now; return; }
        if (m.online && m.seen && now - m.seen > 15000) { m.online = false; m.offAt = now; m.voice = null; this.pushRoom(); }
        this.to(m.cid, { t: 'ping', now });
      });
    },
    sysChat(text) { this.all({ t: 'chat', sys: true, text }); },
    seats() { return this.game ? this.game.seats : []; },
    names() { return this.seats().map(cid => (this.m(cid) || {}).name || '?'); },
    roomInfo() {
      return {
        pin: this.pin, test: this.pin === TEST_PIN, hostCid: this.R.cid, heir: this.heir(), heirs: this.heirs(),
        members: this.members.map(m => ({ cid: m.cid, name: m.name, role: m.role, online: m.online, voice: m.voice, peerId: m.peerId, avatar: m.avatar || null, auto: !!m.auto, bot: !!m.bot, seat: this.seats().indexOf(m.cid) })),
        lobby: this.lobby,
        game: this.game ? { id: this.game.id, seats: this.game.seats, opts: this.game.opts } : null
      };
    },
    pushRoom() { this.all({ t: 'room', room: this.roomInfo() }); this.sendSnap(); },
    pushViews() {
      if (!this.game) return;
      this.sendSnap();
      const mod = G()[this.game.id]; const now = Date.now(); const names = this.names();
      this.members.forEach(m => {
        if (!m.online) return;
        const seat = this.game.seats.indexOf(m.cid);
        let v; try { v = mod.view(this.game.state, seat); } catch (e) { console.error(e); return; }
        v.names = names; v.seat = seat;
        this.to(m.cid, { t: 'view', v, now });
      });
    },
    tick() {
      if (!this.game) return;
      const mod = G()[this.game.id];
      // 斷線超過 15 秒的人輪到時，系統代打，遊戲不會卡住
      let busy = false; try { busy = !!(mod.busy && mod.busy(this.game.state, Date.now())); } catch (e) {}
      if (mod.auto && !busy) {
        let w = null; try { w = mod.auto(this.game.state, (seat) => { const mm = this.m(this.game.seats[seat]); return !!(mm && (mm.auto || !mm.online)); }); } catch (e) {}
        if (w && w.seat >= 0) {
          const m = this.m(this.game.seats[w.seat]);
          const key = JSON.stringify(w); if (key !== this._autoKey) { this._autoKey = key; this._autoSince = Date.now(); }
          const offlineDue = m && !m.online && Date.now() - (m.offAt || 0) > 40000;
          const pilotDue = m && m.auto && Date.now() - this._autoSince > (m.bot ? 700 : 1300); // 託管：稍等一下再出，看起來比較自然
          if ((offlineDue || pilotDue) && Date.now() - (this._lastAuto || 0) > (m.bot ? 450 : 900)) {
            this._lastAuto = Date.now();
            let err; try { err = mod.action(this.game.state, w.seat, w.a, { now: Date.now(), names: this.names(), relay() {}, seat: w.seat }); } catch (e) { err = e; }
            if (!err) { this.pushViews(); return; }
          }
        }
      }
      if (mod.tick) { let ch = false; try { ch = mod.tick(this.game.state, Date.now()); } catch (e) { console.error(e); } if (ch) this.pushViews(); }
    },
    recv(cid, d) {
      const isHost = cid === this.R.cid;
      let m = this.m(cid);
      switch (d.t) {
        case 'hello': {
          const name = String(d.name || '玩家').slice(0, 12);
          if (!m) {
            m = { cid, name, role: d.spec ? 'spec' : 'player', online: true, voice: null, peerId: d.peerId, seen: Date.now() };
            this.members.push(m); this.sysChat(`${name} 加入了房間${m.role === 'spec' ? '（觀戰）' : ''}`);
          } else { const was = m.online; m.online = true; m.peerId = d.peerId; m.name = name; m.seen = Date.now(); if (!was) this.sysChat(`${name} 回來了`); }
          if (d.voice !== undefined) m.voice = d.voice;
          this.pushRoom(); this.pushViews();
          break;
        }
        case 'pong': break;
        case 'chat': if (m) this.all({ t: 'chat', from: m.name, text: String(d.text || '').slice(0, 200) }); break;
        case 'avatar': if (m && typeof d.img === 'string' && d.img.startsWith('data:image/') && d.img.length < 60000) { m.avatar = d.img; this.pushRoom(); this.pushViews(); } break;
        case 'quick': if (m && Date.now() - (m.lastQ || 0) > 1200) { m.lastQ = Date.now(); this.all({ t: 'quick', from: m.name, cid, text: String(d.text || '').slice(0, 30) }); } break;
        case 'autopilot': if (m) { m.auto = !!d.on; this.pushRoom(); } break;
        case 'voice': if (m) { m.voice = d.mode === 'off' ? null : d.mode; this.pushRoom(); } break;
        case 'role': if (m && !this.game) { m.role = d.role === 'spec' ? 'spec' : 'player'; this.pushRoom(); } break;
        case 'lobby': if (isHost && !this.game) { this.lobby = { gameId: d.gameId, opts: d.opts || {}, skin: this.lobby.skin }; this.pushRoom(); } break;
        case 'skin': if (isHost) { this.lobby.skin = ['nebula', 'classic', 'ragnarok', 'cyber', 'animal', 'alien'].includes(d.skin) ? d.skin : 'nebula'; this.pushRoom(); } break;
        case 'addbot': if (isHost && this.pin === TEST_PIN && !this.game) {
          const used = new Set(this.members.filter(x => x.bot).map(x => x.name)); let k = 1; while (used.has('電腦' + k)) k++;
          this.members.push({ cid: 'bot-' + Math.random().toString(36).slice(2, 8), name: '電腦' + k, role: 'player', online: true, auto: true, bot: true, seen: Date.now() });
          this.pushRoom(); } break;
        case 'clearbots': if (isHost && !this.game) { this.members = this.members.filter(x => !x.bot); this.pushRoom(); } break;
        case 'start': if (isHost) this.start(); break;
        case 'end': { // 房主隨時可以；遊戲已經結束時，任何玩家都可以帶大家回大廳
          const done = this.game && this.game.state && ['over', 'end'].includes(this.game.state.phase);
          if (this.game && (isHost || (done && m && m.role === 'player'))) { this.game = null; this.pushRoom(); this.sysChat(isHost ? '回到大廳' : `${m.name} 帶大家回到大廳`); }
          break;
        }
        case 'kick': if (isHost && d.cid !== this.R.cid) { this.to(d.cid, { t: 'kick' }); const i = this.members.findIndex(x => x.cid === d.cid); if (i >= 0) { const c = this.conns[d.cid]; this.members.splice(i, 1); setTimeout(() => { try { c && c.close(); } catch (e) {} }, 300); } this.pushRoom(); } break;
        case 'act': {
          if (!this.game || !m) return;
          const seat = this.game.seats.indexOf(cid);
          const mod = G()[this.game.id];
          const relays = [];
          const ctx = { now: Date.now(), names: this.names(), relay: ev => relays.push(ev), seat, spectator: seat < 0 };
          if (seat < 0 && !(mod.spectatorActs || []).includes(d.a && d.a.type)) return;
          let err; try { err = mod.action(this.game.state, seat, d.a || {}, ctx); } catch (e) { console.error(e); err = '動作錯誤'; }
          relays.forEach(ev => this.all({ t: 'ev', ev, from: seat }, cid));
          if (err === 'silent') return;
          if (err) { this.to(cid, { t: 'err', msg: err }); return; }
          this.pushViews();
          break;
        }
      }
    },
    start() {
      const id = this.lobby.gameId; const mod = G()[id];
      const players = this.members.filter(m => m.online && m.role === 'player');
      if (players.length < mod.min) { this.to(this.R.cid, { t: 'err', msg: `${mod.name} 至少要 ${mod.min} 位玩家` }); return; }
      if (players.length > mod.max) { this.to(this.R.cid, { t: 'err', msg: `${mod.name} 最多 ${mod.max} 位玩家，請讓其他人切換成觀戰` }); return; }
      // 隨機座位
      const seats = players.map(p => p.cid).sort(() => Math.random() - 0.5);
      const opts = Object.assign({}, ...(mod.options || []).map(o => ({ [o.key]: o.def })), this.lobby.opts || {});
      // 舊的設定值如果已經不在選項裡（例如改版後），一律改回預設，避免畫面顯示和實際不一致
      (mod.options || []).forEach(o => { if (o.choices && !o.choices.some(([v]) => String(v) === String(opts[o.key]))) opts[o.key] = o.def; });
      this.game = { id, seats, opts, state: null };
      this.game.state = mod.init(seats.length, opts, this.names(), Date.now());
      this.pushRoom(); this.pushViews();
      this.sysChat(`開始：${mod.name}（${seats.length} 人）`);
    }
  };

  window.Room = Room;
  window.Host = Host;
})();
