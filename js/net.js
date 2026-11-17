// 連線層：PeerJS（WebRTC）＋ 本機測試模式（BroadcastChannel）
(function () {
  const CFG = window.APP_CONFIG;
  const LOCAL = /[?&]local=1/.test(location.search);

  // ---------- 本機測試用的假 Peer（同一個瀏覽器多個分頁） ----------
  class Emitter {
    constructor() { this._h = {}; }
    on(e, f) { (this._h[e] = this._h[e] || []).push(f); return this; }
    emit(e, ...a) { (this._h[e] || []).forEach(f => { try { f(...a); } catch (err) { console.error(err); } }); }
  }
  class FakeConn extends Emitter {
    constructor(peer, remote, cid) { super(); this.peer = remote; this._p = peer; this._cid = cid; this.open = false; }
    send(d) { if (window.__netDown || this._p._dead || this._p.destroyed) return; this._p._bc.postMessage({ k: 'd', to: this.peer, from: this._p.id, cid: this._cid, d: JSON.parse(JSON.stringify(d)) }); }
    close() { this._p._bc.postMessage({ k: 'x', to: this.peer, from: this._p.id, cid: this._cid }); this._down(); }
    _down() { if (this.open || !this._closed) { this.open = false; this._closed = true; delete this._p._conns[this._cid]; this.emit('close'); } }
  }
  class FakePeer extends Emitter {
    constructor(id) {
      super();
      this.id = id || ('p' + Math.random().toString(36).slice(2, 10));
      this._conns = {};
      this._bc = new BroadcastChannel('fakepeer');
      this._bc.onmessage = (ev) => this._rx(ev.data);
      // 模擬真正的 PeerJS：同一個房號只能有一個人占用
      if (window.__netDown) { this._dead = true; setTimeout(() => this.emit('error', { type: 'network' }), 300); return; }
      if (id) { this._q = Math.random().toString(36).slice(2); this._bc.postMessage({ k: 'q', id, q: this._q });
        setTimeout(() => { if (this._taken) { this._dead = true; this.emit('error', { type: 'unavailable-id' }); } else this.emit('open', this.id); }, 700); }
      else setTimeout(() => this.emit('open', this.id), 30);
      window.addEventListener('beforeunload', () => Object.values(this._conns).forEach(c => c.close()));
    }
    _rx(m) {
      if (window.__netDown) return; // 測試用：模擬斷網
      if (m.k === 'q') { if (m.id === this.id && !this._dead && !this._q2(m.q)) this._bc.postMessage({ k: 'qr', q: m.q }); return; }
      if (m.k === 'qr') { if (m.q === this._q) this._taken = true; return; }
      if (this._dead || m.to !== this.id) return;
      if (m.k === 'c') {
        const c = new FakeConn(this, m.from, m.cid); this._conns[m.cid] = c;
        this._bc.postMessage({ k: 'a', to: m.from, from: this.id, cid: m.cid });
        c.open = true; this.emit('connection', c); setTimeout(() => c.emit('open'), 10);
      } else if (m.k === 'a') { const c = this._conns[m.cid]; if (c) { c.open = true; c.emit('open'); } }
      else if (m.k === 'd') { const c = this._conns[m.cid]; if (c) c.emit('data', m.d); }
      else if (m.k === 'x') { const c = this._conns[m.cid]; if (c) c._down(); }
    }
    _q2(q) { return q === this._q; }
    connect(id) {
      const cid = Math.random().toString(36).slice(2);
      const c = new FakeConn(this, id, cid); this._conns[cid] = c;
      this._bc.postMessage({ k: 'c', to: id, from: this.id, cid });
      setTimeout(() => { if (!c.open) { c.emit('error', new Error('timeout')); } }, 3000);
      return c;
    }
    call() { return null; }
    reconnect() {} destroy() { this._dead = true; this.destroyed = true; this._bc.close(); setTimeout(() => this.emit('close'), 50); }
    get disconnected() { return false; }
  }

  let iceCache = null;
  async function getIce() {
    if (iceCache) return iceCache;
    let list = (CFG.iceServers || []).slice();
    if (CFG.turnApiUrl) {
      try {
        const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 5000);
        const r = await fetch(CFG.turnApiUrl, { signal: ac.signal }); clearTimeout(t);
        const extra = await r.json();
        if (Array.isArray(extra)) list = list.concat(extra);
      } catch (e) { console.warn('TURN 取得失敗', e); }
    }
    iceCache = list; return list;
  }

  async function makePeer(id) {
    if (LOCAL) return new FakePeer(id);
    // 測試用：?peerhost=主機:埠 改連自架的配對伺服器（真的 WebRTC，但不走公用伺服器）
    let ph = new URLSearchParams(location.search).get('peerhost'); try { if (ph) sessionStorage.setItem('peerhost', ph); else ph = sessionStorage.getItem('peerhost'); } catch (e) {}
    if (ph) { const [host, port] = ph.split(':'); const o = { host, port: +port || 9000, path: '/', secure: false, config: { iceServers: [] }, debug: 1 }; return id ? new Peer(id, o) : new Peer(o); }
    const iceServers = await getIce();
    const opts = { config: { iceServers }, debug: 1 };
    return id ? new Peer(id, opts) : new Peer(opts);
  }

  // ---------- 語音（全網狀：每個人直接連每個人） ----------
  // 語音省流量：Opus 限制在 24kbps、單聲道、沒說話時幾乎不傳（DTX），走中繼伺服器時比較不會把免費額度用完
  const sdpTransform = (sdp) => sdp.replace(/a=fmtp:(\d+) (.*useinbandfec=1.*)/g, (m, pt, rest) => /maxaveragebitrate/.test(rest) ? m : `a=fmtp:${pt} ${rest};maxaveragebitrate=24000;stereo=0;usedtx=1`);
  const Voice = {
    peer: null, stream: null, mode: 'off', calls: {}, audios: {}, meters: {}, ctx: null, muted: false,
    onLevel: null,
    attach(peer) {
      this.peer = peer;
      peer.on('call', (call) => {
        if (this.mode === 'off') { call.close(); return; }
        const ex = this.calls[call.peer];
        if (ex) { if (call.peer < peer.id) { ex.close(); } else { call.close(); return; } }
        call.answer(this.stream, { sdpTransform });
        this._wire(call);
      });
    },
    _audioCtx() {
      if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    async start(listenOnly) {
      const ctx = this._audioCtx();
      if (listenOnly) {
        const dest = ctx.createMediaStreamDestination(); this.stream = dest.stream; this.mode = 'listen';
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
        this.mode = 'talk';
        this._meter('me', this.stream);
      }
      this.setMuted(false);
    },
    stop() {
      Object.keys(this.calls).forEach(k => this.drop(k));
      if (this.stream) this.stream.getTracks().forEach(t => t.stop());
      this.stream = null; this.mode = 'off'; delete this.meters.me;
    },
    setMuted(m) { this.muted = m; if (this.stream) this.stream.getAudioTracks().forEach(t => t.enabled = !m); },
    callTo(peerId) {
      if (this.mode === 'off' || !this.peer || this.calls[peerId] || peerId === this.peer.id) return;
      const call = this.peer.call(peerId, this.stream, { sdpTransform });
      if (call) this._wire(call);
    },
    _wire(call) {
      this.calls[call.peer] = call;
      call.on('stream', (rs) => {
        let a = this.audios[call.peer];
        if (!a) {
          a = document.createElement('audio'); a.autoplay = true; a.setAttribute('playsinline', '');
          document.getElementById('audios').appendChild(a); this.audios[call.peer] = a;
        }
        a.srcObject = rs;
        a.play().catch(() => window.UI && window.UI.needAudioTap());
        this._meter(call.peer, rs);
      });
      const end = () => { if (this.calls[call.peer] === call) this.drop(call.peer); };
      call.on('close', end); call.on('error', end);
      // 連線狀態監看：斷了自動移除，讓下次同步重新撥
      setTimeout(() => {
        const pc = call.peerConnection; if (!pc) return;
        pc.addEventListener('iceconnectionstatechange', () => {
          if (['failed', 'closed'].includes(pc.iceConnectionState)) end();
        });
      }, 0);
    },
    drop(peerId) {
      const c = this.calls[peerId]; delete this.calls[peerId];
      try { c && c.close(); } catch (e) {}
      const a = this.audios[peerId]; if (a) { a.srcObject = null; a.remove(); delete this.audios[peerId]; }
      delete this.meters[peerId];
    },
    // 依房間名單同步：自己在語音中 → 撥給 peerId 比自己大的人（避免重複撥）；不在名單上的掛掉
    sync(voicePeers) {
      if (this.mode === 'off' || !this.peer) return;
      const me = this.peer.id;
      Object.keys(this.calls).forEach(p => { if (!voicePeers.includes(p)) this.drop(p); });
      voicePeers.forEach(p => { if (p !== me && !this.calls[p] && me < p) this.callTo(p); });
    },
    resumeAll() {
      this._audioCtx();
      Object.values(this.audios).forEach(a => a.play().catch(() => {}));
    },
    _meter(key, stream) {
      const ctx = this._audioCtx(); if (!ctx) return;
      try {
        const src = ctx.createMediaStreamSource(stream);
        const an = ctx.createAnalyser(); an.fftSize = 256; src.connect(an);
        this.meters[key] = { an, buf: new Uint8Array(an.frequencyBinCount) };
      } catch (e) {}
    },
    levels() {
      const out = {};
      for (const [k, m] of Object.entries(this.meters)) {
        m.an.getByteFrequencyData(m.buf);
        let s = 0; for (let i = 0; i < m.buf.length; i++) s += m.buf[i];
        out[k] = s / m.buf.length;
      }
      return out;
    }
  };

  window.Net = { LOCAL, makePeer, Voice, prefix: CFG.roomPrefix };
})();
