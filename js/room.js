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
  try { Object.keys(localStorage).forEach(k => { if (/^(snap|seat|av):/.test(k)) { const v = LS.get(k); if (!v || Date.now() - (v.t || 0) > KEEP_MS) LS.del(k); } }); } catch (e) {}
  // 同一個 PIN 用固定身分，重新整理或被系統關掉分頁後回來，還是坐回原本的位子
  // 裝置簡稱（給「連線狀態」看）
  function devName() {
    const u = navigator.userAgent || '';
    const os = /iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? 'iPad' : /iPhone/.test(u) ? 'iPhone' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : '其他';
    const br = /Instagram/.test(u) ? 'IG 內建' : /FBAN|FBAV/.test(u) ? 'FB 內建' : /\bLine\//.test(u) ? 'LINE 內建' : /GSA\//.test(u) ? 'Google App' : /CriOS|Chrome/.test(u) && !/Edg/.test(u) ? 'Chrome' : /Edg/.test(u) ? 'Edge' : /Firefox|FxiOS/.test(u) ? 'Firefox' : /Safari/.test(u) ? 'Safari' : '瀏覽器';
    const net = navigator.connection && navigator.connection.type ? ({ wifi: '・Wi‑Fi', cellular: '・行動網路' }[navigator.connection.type] || '') : '';
    return `${os} ${br}${net}`;
  }
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
    // 自己畫的頭像：記在這台裝置，每次連上房主都會重送（斷線時傳丟也會補回來）
    myAvatar() { if (this._av) return this._av; const v = this.pin && LS.get('av:' + this.pin); return (v && v.img) || null; },
    setAvatar(img) { this._av = img; if (this.pin) LS.set('av:' + this.pin, { img, t: Date.now() }); this.send({ t: 'avatar', img }); this._avCheck(img, 0); },
    _avCheck(img, n) { setTimeout(() => { const me = this.room && this.room.members.find(x => x.cid === this.cid); if (me && me.avatar === img) return; if (n < 5) { this.send({ t: 'avatar', img }); this._avCheck(img, n + 1); } }, 2500); },
    // 手機網路切換（5G／Wi‑Fi）後，連線元件可能已經壞掉：壞了就換一個新的
    // 連線元件出事（被系統關掉、網路切換）：不等心跳逾時，馬上修
    _watchPeer(p) {
      // 配對伺服器斷線不代表遊戲連線斷了：跟房主的連線還活著就先不要動它
      const healthy = () => this.conn && this.conn.open && Date.now() - (this._lastHost || 0) < 4000;
      const fix = () => { if (this._leaving || this.isHost || this.peer !== p) return; setTimeout(() => { if (healthy()) return; this._ensurePeer().then(() => this._connect()).catch(() => {}); }, 200); };
      p.on('close', fix); p.on('error', (e) => { if (e && /network|disconnected|server-error|socket/.test(e.type || '')) fix(); });
      p.on('disconnected', () => { setTimeout(() => { try { if (this.peer === p && !p.destroyed) p.reconnect(); } catch (e) {} }, 500); });
    },
    async _ensurePeer() {
      if (this.isHost) return;
      const p = this.peer;
      if (p && !p.destroyed && this.conn && this.conn.open && Date.now() - (this._lastHost || 0) < 4000) return; // 遊戲連線還好好的：不要為了配對伺服器的問題把它拆掉
      if (p && !p.destroyed && !p.disconnected) { this._discSince = 0; return; }
      if (p && !p.destroyed && p.disconnected) {
        if (!this._discSince) this._discSince = Date.now();
        if (Date.now() - this._discSince < 8000) { try { p.reconnect(); } catch (e) {} return; }
      }
      try { p && p.destroy(); } catch (e) {}
      this._discSince = 0; this.cb.status('網路變了，重新建立連線…', true);
      this.peer = await this._openPeer(null); Voice.attach(this.peer); this._watchPeer(this.peer);
      this._connecting = false; this._attempts = 0;
    },
    _hello() { try { this.conn && this.conn.open && this.conn.send({ t: 'hello', cid: this.cid, name: this.name, spec: this.spec, peerId: this.peer.id, voice: Voice.mode === 'off' ? null : Voice.mode, avatar: this.myAvatar() }); } catch (e) {} this._helloAt = Date.now(); },
    // 連上了卻一直沒收到房間／遊戲畫面（手機網路常見）：先重送打招呼，再不行就整個重連
    _resync() {
      if (this.isHost || !this.conn || this._connecting) return;
      const now = Date.now(), since = now - (this._helloAt || now);
      const noRoom = !this._roomAt || this._roomAt < this._helloAt;
      const noView = this.room && this.room.game && (!this._viewAt || this._viewAt < this._helloAt);
      if (!(noRoom || noView) || since < 4000) return;
      this._resyncN = (this._resyncN || 0) + 1;
      if (this._resyncN <= 2) { this.cb.status('正在同步房間畫面…', true); this._hello(); }
      else { this._resyncN = 0; this.cb.status('畫面同步失敗，重新連線中…', true); const c = this.conn; this.conn = null; try { c.close(); } catch (e) {} this._connecting = false; this._connect().catch(() => {}); }
    },
    _deliver(msg) {
      switch (msg.t) {
        case 'room': this._roomAt = Date.now(); this.room = msg.room; this.cb.room(msg.room); this._syncVoice(); break;
        case 'view': this._viewAt = Date.now(); this.clockOffset = msg.now - Date.now(); this.view = msg.v; this.cb.view(msg.v); break;
        case 'ev': this.cb.ev(msg.ev, msg.from); break;
        case 'chat': this.cb.chat(msg); break;
        case 'quick': this.cb.quick(msg); break;
        case 'err': this.cb.status(msg.msg, true); break;
        case 'ping': this.clockOffset = msg.now - Date.now(); this._lastHost = Date.now(); this.send({ t: 'pong', now: msg.now, dev: devName(), pd: this.diagPd || null }); break;
        case 'kick': this.cb.status('你被房主請出房間', true); this.leave(); break;
        case 'handover': this._snap = msg.s; this.saveSnap(msg.s); this._claimHost(); break;
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
      // 配對伺服器斷線：已經在玩的人不受影響，但新加入／重連要靠它，所以每 3 秒重試直到接回
      peer.on('disconnected', () => {
        if (this._leaving || !this.isHost) return; this.cb.status('與配對伺服器斷線（遊戲照常），重新連線中…');
        clearInterval(this._sigT); this._sigT = setInterval(() => { if (!this.isHost || peer.destroyed || this.peer !== peer) return clearInterval(this._sigT); if (!peer.disconnected) { clearInterval(this._sigT); this.cb.status(''); return; } try { peer.reconnect(); } catch (e) {} }, 3000);
      });
      peer.on('open', () => { if (this.isHost) { clearInterval(this._sigT); this.cb.status(''); } });
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
    // 房間連不上、但這台有暫存：原房主的手機被系統關掉時，信令伺服器會把房號再占住約 1 分鐘（房間其實已經不在）。
    // 這段時間內輪流「救回房間」和「連房主」，最多 80 秒，房號一釋放就由這台救回；不會只試一次就跳「找不到這個房間」
    async _rescue(pin, name) {
      const until = Date.now() + 80000, say = (m) => { try { this.onProgress && this.onProgress(m); } catch (e) {} };
      for (;;) {
        try { await this.revive(pin, name); return 'revived'; } catch (e2) { if (!/unavailable/.test(String(e2 && e2.message))) throw e2; }
        say('房間交接中，自動重試（最多約 1 分鐘）…');
        try { this._connecting = false; if (this.peer && this.peer.destroyed) this.peer = null; if (!this.peer) { this.peer = await this._openPeer(null); Voice.attach(this.peer); this._watchPeer(this.peer); } await this._connect(); return 'joined'; }
        catch (e) { if (Date.now() > until) throw new Error('房間暫時連不上，請稍等 1 分鐘再按一次（這台有暫存，會自動救回）'); }
        await new Promise(r => setTimeout(r, 2000));
      }
    },
    // 回到網頁時：立刻重連；房間不見了就用暫存救回
    async wake() {
      if (!this.pin || this._leaving || this._waking || this._joining) return; // 正在加入中就不要再插一腳（會變成兩條連線互搶）
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
        if (this.conn && this.conn.open && Date.now() - (this._lastHost || 0) < 3500) return;
        await this.reenter();
      } finally { this._waking = false; }
    },
    // 先試著加入；連不到而且有暫存，就由自己重開房間
    async reenter() {
      try {
        if (this.peer && this.peer.destroyed) this.peer = null;
        if (!this.peer) { this.peer = await this._openPeer(null); Voice.attach(this.peer); this._watchPeer(this.peer); }
        this._connecting = false; await this._connect(); return 'joined';
      } catch (e) {
        if (this.hasSnap(this.pin) && !(this._noRevive > Date.now())) return await this._rescue(this.pin, this.name);
        throw e;
      }
    },
    // ================= 接手房主 =================
    _becomeHost(hp) {
      this.hostPeer = hp; this.isHost = true; clearInterval(this._watch);
      const c = this.conn; this.conn = null; try { c && c.close(); } catch (e) {}
      Host.restore(this, this.pin, this._snap);
      hp.on('connection', c2 => Host.accept(c2));
      this._hostPeerEvents(hp);
    },
    // 房主把位置交給我：舊房主會放掉房號，我接過來
    async _claimHost() {
      if (this.isHost || this._takingOver) return; this._takingOver = true;
      this.cb.status('房主把位置交給你，接手中…', true);
      for (let i = 0; i < 20 && !this._leaving; i++) {
        try { const hp = await this._openPeer(prefix + this.pin); this._becomeHost(hp); this._takingOver = false; this.cb.status(''); return; }
        catch (e) { await new Promise(r => setTimeout(r, 700)); }
      }
      this._takingOver = false; this.cb.status('接手失敗，房間維持原狀', true);
    },
    // 我把房主交出去：放掉房號，改用玩家身分重新加入
    async _stepDown(toName) {
      Host.stop(); this.isHost = false; clearInterval(this._sigT); this._noRevive = Date.now() + 90000; // 交出房主後不要用暫存把房間「救回」（會變成兩個房間）
      if (this.hostPeer) { try { this.hostPeer.destroy(); } catch (e) {} this.hostPeer = null; }
      else { try { this.peer && this.peer.destroy(); } catch (e) {} this.peer = null; try { Voice.stop(); } catch (e) {} }
      this.cb.status(`已把房主交給 ${toName}，重新以玩家身分加入…`, true);
      await new Promise(r => setTimeout(r, 2000));
      for (let i = 0; i < 8 && !this._leaving; i++) {
        try { await this.join(this.pin, this.name, false); this.cb.status(''); return; } catch (e) { await new Promise(r => setTimeout(r, 1500)); }
      }
      this.cb.status('重新加入失敗，請重新整理後用同一個 PIN 加入', true);
    },
    async _takeover(force) {
      if (this._takingOver || this.isHost || this._leaving) return;
      // 只是收不到心跳（可能是自己網路不好或房主短暫切出去）：等久一點才接手；連線明確被關掉才立刻接手
      // 手機卡頓、短暫收不到也不要急著搶房主（會變成兩個房間）：沒收到心跳 20 秒、或連線被關掉而且 5 秒都沒消息才接手
      if (Date.now() - (this._lastHost || 0) < (force ? 5000 : 20000)) return;
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
          this._becomeHost(hp);
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
      this._joining = true;
      try { return await this._join(pin, name, spec); } finally { this._joining = false; }
    },
    async _join(pin, name, spec) {
      this.name = name; this.pin = pin; this.isHost = false; this.spec = spec; this.cid = cidFor(pin); this._av = null;
      if (this.peer && this.peer.destroyed) this.peer = null;
      if (!this.peer) {
        this.peer = await this._openPeer(null);
        Voice.attach(this.peer); this._watchPeer(this.peer);
      }
      try { await this._connect(); }
      catch (e) {
        // 房間不在了，但這台裝置有暫存 → 直接救回
        if (this.hasSnap(pin) && !(this._noRevive > Date.now())) { if (await this._rescue(pin, name) === 'revived') return 'revived'; }
        else throw e;
      }
      clearInterval(this._watch);
      this._watch = setInterval(() => {
        if (this._leaving) return;
        if (this.isHost) return;
        this._resync();
        if (Date.now() - (this._lastHost || 0) > 6500 && (this._attempts || 0) < 2 && Date.now() - (this._lastTry || 0) > 2500) { this.cb.status('與房主斷線，重新連線中…', true); this._takeover(); this._ensurePeer().then(() => this._connect()).catch(() => { if (Date.now() - (this._lastHost || 0) > 30000 && this.hasSnap(this.pin) && !(this._noRevive > Date.now())) this.revive(this.pin, this.name).catch(() => {}); }); }
      }, 1500);
    },
    // 連房主：可以同時有 2～3 個嘗試在跑，誰先接通就用誰（網路剛恢復時不用等上一個嘗試逾時）
    _connect() {
      return new Promise((res, rej) => {
        if ((this._attempts || 0) >= 3) return rej(new Error('busy'));
        if (!this.peer || this.peer.destroyed) return rej(new Error('無法連線'));
        const conn = this.peer.connect(prefix + this.pin, { reliable: true, serialization: 'json' });
        if (!conn) return rej(new Error('無法連線'));
        this._attempts = (this._attempts || 0) + 1; this._connecting = true; this._lastTry = Date.now();
        let done = false; const fin = () => { if (done) return; done = true; this._attempts = Math.max(0, this._attempts - 1); this._connecting = this._attempts > 0; };
        const to = setTimeout(() => { fin(); try { conn.close(); } catch (e) {} rej(new Error('找不到這個房間（PIN 錯誤或房主已離開）')); }, this.room ? 8000 : 10000);
        conn.on('open', () => {
          clearTimeout(to); fin();
          if (this.isHost) { try { conn.close(); } catch (e) {} return res(); }
          // 已經有一條健康的連線了（別的嘗試先接通）：這條就不要了
          if (this.conn && this.conn !== conn && this.conn.open && Date.now() - (this._lastHost || 0) < 2500) { try { conn.close(); } catch (e) {} return res(); }
          const old = this.conn; this.conn = conn; this._lastHost = Date.now();
          if (old && old !== conn) { try { old.close(); } catch (e) {} }
          this._hello(); this._roomAt = 0; this._viewAt = 0; this._resyncN = 0;
          this.cb.status('');
          res();
        });
        conn.on('data', d => { if (this.conn !== conn) return; const gap = Date.now() - (this._lastHost || 0); this._lastHost = Date.now(); if (gap > 3500) { this.cb.status(''); this._hello(); } this._deliver(d); }); // 卡住後又通了：重新打招呼，房主會補送最新畫面
        conn.on('close', () => {
          if (this._leaving || this.isHost || this.conn !== conn) return;
          this.cb.status('與房主斷線，重新連線中…', true);
          setTimeout(() => this._takeover(true), 5500);
          setTimeout(() => { if (!this.isHost && !this._leaving) this._ensurePeer().then(() => this._connect()).catch(() => {}); }, 300);
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
      this._pingT = setInterval(() => this.ping(), 2000); // 每 2 秒心跳：斷線 6～8 秒內就會發現
      clearInterval(this._relayT); this._relayT = setInterval(() => this.checkRelay(), 10000);
    },
    stop() { clearInterval(this.timer); clearInterval(this._pingT); },
    restore(R, pin, snap, msg) {
      this.init(R, pin);
      this.lobby = snap.lobby || this.lobby; this.game = snap.game || null;
      this.members = (snap.members || []).map(m => Object.assign({}, m, { offAt: Date.now() + 20000, online: m.cid === R.cid || !!m.bot, auto: !!(m.bot || m.auto), voice: m.cid === R.cid ? (window.Net.Voice.mode === 'off' ? null : window.Net.Voice.mode) : null, seen: Date.now() }));
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
        if (conn._mcid) {
          const m = this.m(conn._mcid);
          if (m) { m.seen = Date.now(); if (this.conns[conn._mcid] !== conn && conn.open) this.conns[conn._mcid] = conn;
            // 卡住一陣子又通了（連線沒有真的斷）：直接當作回來，補送最新畫面
            if (!m.online && d.t !== 'hello') { m.online = true; this.sysChat(`${m.name} 回來了`); this.pushRoom(); this.pushViews(); } }
          this.recv(conn._mcid, d);
        }
      });
      conn.on('close', () => {
        const cid = conn._mcid; if (!cid || this.conns[cid] !== conn) return;
        delete this.conns[cid];
        const m = this.m(cid); if (m) { m.online = false; m.offAt = Date.now(); m.voice = null; this.pushRoom(); this.sysChat(`${m.name} 離線了（輪到他時 40 秒後由系統代打，超過兩回合沒回來會自動託管）`); }
      });
    },
    m(cid) { return this.members.find(x => x.cid === cid); },
    to(cid, msg) {
      if (cid === this.R.cid) { this.R._deliver(JSON.parse(JSON.stringify(msg))); return; }
      const c = this.conns[cid]; if (c && c.open) { try { c.send(msg); } catch (e) {} }
    },
    all(msg, except) { this.members.forEach(m => { if (m.online && m.cid !== except) this.to(m.cid, msg); }); },
    // 連線方式：直連還是透過中繼伺服器（中繼比較慢、而且會用到免費額度）
    async checkRelay() {
      for (const m of this.members) {
        const c = this.conns[m.cid], pc = c && c.peerConnection; if (!pc || !pc.getStats) continue;
        try { const st = await pc.getStats(); let pair = null; st.forEach(r => { if (r.type === 'candidate-pair' && (r.nominated || r.selected) && r.state === 'succeeded') pair = r; });
          if (pair) { const lc = st.get(pair.localCandidateId), rc = st.get(pair.remoteCandidateId); m.relay = (lc && lc.candidateType === 'relay') || (rc && rc.candidateType === 'relay') ? 1 : 0; } } catch (e) {}
      }
    },
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
        members: this.members.map(m => ({ cid: m.cid, name: m.name, role: m.role, online: m.online, voice: m.voice, peerId: m.peerId, avatar: m.avatar || null, auto: !!m.auto, bot: !!m.bot, seat: this.seats().indexOf(m.cid), net: m.cid === this.R.cid ? { host: 1, dev: devName() } : { rtt: m.rtt || null, relay: m.relay, dev: m.dev || '', pd: m.pd || null } })),
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
    // 離線的人錯過自己兩次回合 → 自動開託管（電腦代打）；回來後要自己按掉，不會自動關
    trackOffline() {
      const st = this.game.state; if (!st) return;
      if (this._offGame !== this.game) { this._offGame = this.game; this._offTurn = null; }
      this.members.forEach(m => { if (m.online && m.offMissed) m.offMissed = 0; });
      const t = typeof st.turn === 'number' ? st.turn : typeof st.turnIdx === 'number' ? st.turnIdx : null;
      if (t == null || t === this._offTurn) return;
      const prev = this._offTurn; this._offTurn = t; if (prev == null) return;
      const m = this.m(this.game.seats[prev]); if (!m || m.bot || m.auto || m.online) return;
      m.offMissed = (m.offMissed || 0) + 1;
      if (m.offMissed >= 2) { m.auto = true; m.offMissed = 0; this.sysChat(`${m.name} 離線超過兩回合，已自動託管（電腦代打）；回來後按「託管」就能自己打`); this.pushRoom(); }
    },
    tick() {
      if (!this.game) return;
      try { this.trackOffline(); } catch (e) { console.error(e); }
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
          if (typeof d.avatar === 'string' && d.avatar.startsWith('data:image/') && d.avatar.length < 60000) m.avatar = d.avatar;
          this.pushRoom(); this.pushViews();
          break;
        }
        case 'diag': this.to(cid, { t: 'room', room: this.roomInfo() }); break;
        case 'pong': if (m) { if (d.now) { const r = Date.now() - d.now; m.rtt = m.rtt ? Math.round(m.rtt * 0.6 + r * 0.4) : r; } if (d.dev) m.dev = String(d.dev).slice(0, 40); if (d.pd != null) m.pd = +d.pd || 0; } break;
        case 'chat': if (m) this.all({ t: 'chat', from: m.name, text: String(d.text || '').slice(0, 200) }); break;
        case 'avatar': if (m && typeof d.img === 'string' && d.img.startsWith('data:image/') && d.img.length < 60000) { m.avatar = d.img; this.pushRoom(); this.pushViews(); } break;
        case 'quick': if (m && Date.now() - (m.lastQ || 0) > 1200) { m.lastQ = Date.now(); this.all({ t: 'quick', from: m.name, cid, text: String(d.text || '').slice(0, 30) }); } break;
        case 'autopilot': if (m) { m.auto = !!d.on; this.pushRoom(); } break;
        case 'voice': if (m) { m.voice = d.mode === 'off' ? null : d.mode; this.pushRoom(); } break;
        case 'role': if (m && !this.game) { m.role = d.role === 'spec' ? 'spec' : 'player'; this.pushRoom(); } break;
        case 'lobby': if (isHost && !this.game) { this.lobby = { gameId: d.gameId, opts: d.opts || {}, skin: this.lobby.skin }; this.pushRoom(); } break;
        // 拉霸隨機選主題：房主按，大家一起看輪播，最後停在同一個
        case 'spin': if (isHost && !this.game) {
          const mod = G()[this.lobby.gameId], o = mod && (mod.options || []).find(x => x.key === d.key); if (!o || !o.choices) break;
          const cur = (this.lobby.opts || {})[d.key], pool = o.choices.map(c => c[0]).filter(v => String(v) !== String(cur));
          const to = pool[Math.floor(Math.random() * pool.length)];
          this.lobby = Object.assign({}, this.lobby, { opts: Object.assign({}, this.lobby.opts, { [d.key]: to }), spin: { key: d.key, to, id: Date.now() + Math.random() } });
          this.pushRoom();
        } break;
        case 'handover': if (isHost) {
          const t = this.m(d.cid); if (!t || t.bot || !t.online || t.cid === this.R.cid || !this.conns[t.cid]) break;
          const members = this.members.map(x => ({ cid: x.cid, name: x.name, role: x.role, peerId: x.peerId, avatar: x.avatar || null, bot: !!x.bot }));
          this.sysChat(`👑 房主交給 ${t.name}`);
          this.to(t.cid, { t: 'handover', s: { lobby: this.lobby, game: this.game, members } });
          setTimeout(() => this.R._stepDown(t.name), 400);
          break;
        }
        case 'skin': if (isHost) { this.lobby.skin = ['nebula', 'classic', 'ragnarok', 'cyber', 'animal', 'buddha', 'magic', 'alien', 'town'].includes(d.skin) ? d.skin : 'nebula'; this.pushRoom(); } break;
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
      // 🧪 測試用選項（test: true）只有測試房能改，其他房間一律強制用預設值
      if (this.pin !== TEST_PIN) (mod.options || []).forEach(o => { if (o.test) opts[o.key] = o.def; });
      this.game = { id, seats, opts, state: null };
      this.game.state = mod.init(seats.length, opts, this.names(), Date.now());
      this.pushRoom(); this.pushViews();
      this.sysChat(`開始：${mod.name}（${seats.length} 人）`);
    }
  };

  // 每 10 秒檢查一次語音：斷掉的自動重撥
  setInterval(() => { try { if (Room.room && !Room._leaving) Room._syncVoice(); } catch (e) {} }, 10000);
  window.Room = Room;
  window.Host = Host;
})();
