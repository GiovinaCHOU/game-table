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
        case 'snap': this._snap = msg.s; this._snapAt = Date.now(); break;
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

    // ================= 建房 =================
    async create(name) {
      this.name = name; this.isHost = true;
      for (let i = 0; i < 5; i++) {
        const pin = randPin();
        try {
          const peer = await this._openPeer(prefix + pin);
          this.pin = pin; this.peer = peer;
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
    // ================= 接手房主 =================
    async _takeover() {
      if (this._takingOver || this.isHost || this._leaving) return;
      if (!this.room || this.room.heir !== this.cid || !this._snap) return;
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
      this.name = name; this.pin = pin; this.isHost = false; this.spec = spec;
      if (!this.peer) {
        this.peer = await this._openPeer(null);
        Voice.attach(this.peer);
        this.peer.on('disconnected', () => { setTimeout(() => { try { this.peer.reconnect(); } catch (e) {} }, 1000); });
      }
      await this._connect();
      clearInterval(this._watch);
      this._watch = setInterval(() => {
        if (this._leaving) return;
        if (this.isHost) return;
        if (Date.now() - (this._lastHost || 0) > 13000) { this.cb.status('與房主斷線，重新連線中…', true); this._takeover(); this._connect().catch(() => {}); }
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
    members: [], conns: {}, game: null, lobby: { gameId: 'monopoly', opts: {}, skin: 'classic' }, timer: null,
    init(R, pin) {
      this.R = R; this.pin = pin; this.members = []; this.conns = {}; this.game = null;
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), 200);
      this._pingT = setInterval(() => this.ping(), 4000);
    },
    stop() { clearInterval(this.timer); clearInterval(this._pingT); },
    restore(R, pin, snap) {
      this.init(R, pin);
      this.lobby = snap.lobby || this.lobby; this.game = snap.game || null;
      this.members = (snap.members || []).map(m => Object.assign({}, m, { offAt: Date.now(), online: m.cid === R.cid, voice: m.cid === R.cid ? (window.Net.Voice.mode === 'off' ? null : window.Net.Voice.mode) : null, seen: Date.now() }));
      if (!this.m(R.cid)) this.members.push({ cid: R.cid, name: R.name, role: 'player', online: true, voice: null, peerId: R.peer.id, seen: Date.now() });
      // 被跳過的時限從現在重新算，避免一接手就逾時
      this.pushRoom(); this.pushViews();
      this.sysChat(`原房主斷線，${R.name} 接手當房主，遊戲繼續`);
    },
    heir() {
      // 候補房主：最早加入、目前在線、不是房主的人（玩家優先）
      const c = this.members.filter(m => m.online && m.cid !== this.R.cid);
      const p = c.filter(m => m.role === 'player');
      return (p[0] || c[0] || {}).cid || null;
    },
    sendSnap() {
      if (this._snapQ) return; this._snapQ = true;
      setTimeout(() => {
        this._snapQ = false; const h = this.heir(); if (!h) return;
        const members = this.members.map(m => ({ cid: m.cid, name: m.name, role: m.role, peerId: m.peerId, avatar: m.avatar || null }));
        this.to(h, { t: 'snap', s: { lobby: this.lobby, game: this.game, members } });
      }, 50);
    },
    accept(conn) {
      conn.on('data', d => {
        if (d && d.t === 'hello') { conn._mcid = d.cid; this.conns[d.cid] = conn; }
        if (conn._mcid) { const m = this.m(conn._mcid); if (m) m.seen = Date.now(); this.recv(conn._mcid, d); }
      });
      conn.on('close', () => {
        const cid = conn._mcid; if (!cid || this.conns[cid] !== conn) return;
        delete this.conns[cid];
        const m = this.m(cid); if (m) { m.online = false; m.offAt = Date.now(); m.voice = null; this.pushRoom(); this.sysChat(`${m.name} 離線了（輪到他時 15 秒後由系統代打）`); }
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
        if (m.online && m.seen && now - m.seen > 15000) { m.online = false; m.offAt = now; m.voice = null; this.pushRoom(); }
        this.to(m.cid, { t: 'ping', now });
      });
    },
    sysChat(text) { this.all({ t: 'chat', sys: true, text }); },
    seats() { return this.game ? this.game.seats : []; },
    names() { return this.seats().map(cid => (this.m(cid) || {}).name || '?'); },
    roomInfo() {
      return {
        pin: this.pin, hostCid: this.R.cid, heir: this.heir(),
        members: this.members.map(m => ({ cid: m.cid, name: m.name, role: m.role, online: m.online, voice: m.voice, peerId: m.peerId, avatar: m.avatar || null, seat: this.seats().indexOf(m.cid) })),
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
      if (mod.auto) {
        let w = null; try { w = mod.auto(this.game.state); } catch (e) {}
        if (w && w.seat >= 0) {
          const m = this.m(this.game.seats[w.seat]);
          if (m && !m.online && Date.now() - (m.offAt || 0) > 15000 && Date.now() - (this._lastAuto || 0) > 1500) {
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
        case 'voice': if (m) { m.voice = d.mode === 'off' ? null : d.mode; this.pushRoom(); } break;
        case 'role': if (m && !this.game) { m.role = d.role === 'spec' ? 'spec' : 'player'; this.pushRoom(); } break;
        case 'lobby': if (isHost && !this.game) { this.lobby = { gameId: d.gameId, opts: d.opts || {}, skin: this.lobby.skin }; this.pushRoom(); } break;
        case 'skin': if (isHost) { this.lobby.skin = ['classic', 'ragnarok', 'cyber', 'animal', 'alien'].includes(d.skin) ? d.skin : 'classic'; this.pushRoom(); } break;
        case 'start': if (isHost) this.start(); break;
        case 'end': if (isHost) { this.game = null; this.pushRoom(); this.sysChat('回到大廳'); } break;
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
      this.game = { id, seats, opts, state: null };
      this.game.state = mod.init(seats.length, opts, this.names(), Date.now());
      this.pushRoom(); this.pushViews();
      this.sysChat(`開始：${mod.name}（${seats.length} 人）`);
    }
  };

  window.Room = Room;
  window.Host = Host;
})();
