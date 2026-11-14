// 大富翁 3D 場景核心：鏡頭操作、格子、角色移動（美術在 mono-art.js、角色在 mono-chars.js）
(function (root) {
  let THREE = null;
  async function loadThree() { if (!THREE) THREE = await import(new URL('vendor/three.module.min.js', document.baseURI).href); return THREE; }

  const ICON = {
    ragnarok: { start: '🏛️', jail: '💀', free: '🍷', gotojail: '⬇️', luck: '🌟', bad: '⚡', tax: '🪙', teleport: '🌈' },
    cyber: { start: '🚉', jail: '🔒', free: '💉', gotojail: '🚨', luck: '💾', bad: '☠️', tax: '💰', teleport: '🚄' },
    animal: { start: '🌅', jail: '🦓', free: '💧', gotojail: '🪤', luck: '🌿', bad: '🔥', tax: '🌧️', teleport: '🌪️' },
    alien: { start: '🛸', jail: '⛓️', free: '🛰️', gotojail: '🚨', luck: '🧬', bad: '☄️', tax: '📦', teleport: '🕳️' }
  };
  const U = 1.5, N = 28;
  function tileXZ(i) {
    const side = Math.floor(i / 7), k = i % 7, h = 3.5; let x, z;
    if (side === 0) { x = h - k; z = h; } else if (side === 1) { x = -h; z = h - k; } else if (side === 2) { x = -h + k; z = -h; } else { x = h; z = -h + k; }
    return [x * U, z * U];
  }
  function quality() { if (window.__monoQ) return window.__monoQ; try { return localStorage.getItem('mono-q') || ((navigator.hardwareConcurrency || 4) <= 4 ? 'low' : 'high'); } catch (e) { return 'high'; } }

  class Board3D {
    constructor() { this.tokens = {}; this.bld = {}; this.anim = []; this.upd = []; this.t0 = performance.now(); this.last = performance.now(); }
    async init(el, theme, R) {
      const T = await loadThree(); const A = root.MONO_ART, S = A.STYLE[theme];
      this.el = el; this.theme = theme; this.R = R; this.q = { high: quality() === 'high' };
      const w = el.clientWidth || 360, h = el.clientHeight || 400;
      const r = this.renderer = new T.WebGLRenderer({ antialias: this.q.high, powerPreference: 'high-performance' });
      r.setPixelRatio(Math.min(this.q.high ? 2 : 1.25, window.devicePixelRatio || 1)); r.setSize(w, h);
      r.shadowMap.enabled = this.q.high; r.shadowMap.type = T.PCFSoftShadowMap;
      r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = theme === 'cyber' || theme === 'alien' ? 1.15 : 1.0;
      el.appendChild(r.domElement); r.domElement.style.touchAction = 'none';
      const sc = this.scene = new T.Scene();
      sc.background = new T.Color(S.bg); sc.fog = new T.Fog(S.fog[0], S.fog[1], S.fog[2]);
      this.cam = new T.PerspectiveCamera(45, w / h, 0.1, 300);
      // 環境反射：讓金屬、濕亮表面有東西可反射（不然會一片黑）
      try {
        const pm = new T.PMREMGenerator(r), es = new T.Scene();
        const [c1, c2] = S.env || ['#888888', '#222222'];
        const cv = document.createElement('canvas'); cv.width = 16; cv.height = 256; const cg = cv.getContext('2d'); const gr = cg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, c1); gr.addColorStop(0.55, c2); gr.addColorStop(1, '#050505'); cg.fillStyle = gr; cg.fillRect(0, 0, 16, 256);
        const et = new T.CanvasTexture(cv); et.colorSpace = T.SRGBColorSpace;
        es.add(new T.Mesh(new T.SphereGeometry(10, 32, 16), new T.MeshBasicMaterial({ map: et, side: T.BackSide })));
        (S.panels || []).forEach(([col, x, y, z]) => { const p = new T.Mesh(new T.PlaneGeometry(4, 2), new T.MeshBasicMaterial({ color: col, side: T.DoubleSide })); p.position.set(x, y, z); p.lookAt(0, 0, 0); es.add(p); });
        sc.environment = pm.fromScene(es, 0.03).texture; sc.environmentIntensity = S.envI || 0.6;
      } catch (e) { console.warn(e); }
      sc.add(new T.HemisphereLight(S.hemi[0], S.hemi[1], S.hemi[2]));
      const sun = new T.DirectionalLight(S.sun[0], S.sun[1]); sun.position.set(10, 18, 8); sun.castShadow = this.q.high;
      sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 }); sun.shadow.bias = -0.0005; sc.add(sun);
      A.env(T, sc, theme, this.q, this.upd);
      this.buildTiles();
      this.cr = { target: new T.Vector3(0, 0, 0), dist: 15, polar: 0.75, azim: 0 };
      this.goal = { target: new T.Vector3(0, 0, 0), dist: 15, polar: 0.75, azim: 0 };
      this.overview(true);
      this.bindGestures();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el);
      const loop = () => { if (this.dead) return; this.raf = requestAnimationFrame(loop); this.frame(); };
      loop();
    }
    resize() { const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }
    dispose() { this.dead = true; cancelAnimationFrame(this.raf); try { this.ro.disconnect(); } catch (e) {} try { this.renderer.dispose(); this.renderer.domElement.remove(); } catch (e) {} }

    // ================= 鏡頭操作 =================
    clampGoal() {
      const g = this.goal;
      g.polar = Math.max(0.1, Math.min(1.42, g.polar));
      g.dist = Math.max(3.2, Math.min(36, g.dist));
      g.target.x = Math.max(-9, Math.min(9, g.target.x)); g.target.z = Math.max(-9, Math.min(9, g.target.z)); g.target.y = 0;
    }
    overview(snap) {
      const asp = this.cam.aspect || 1;
      this.follow(null); this.goal.target.set(0, 0, 0); this.goal.dist = asp < 0.62 ? 27 : asp < 0.8 ? 22 : asp < 1.2 ? 17 : 14; this.goal.polar = 0.55; this.goal.azim = 0;
      if (snap) this.snap();
    }
    snap() { const c = this.cr, g = this.goal; c.target.copy(g.target); c.dist = g.dist; c.polar = g.polar; c.azim = g.azim; }
    focusSeat(seat, close) { const tk = this.tokens[seat]; if (!tk) return; this.follow(seat); if (close) { this.goal.dist = Math.min(this.goal.dist, 9); this.goal.polar = Math.max(0.7, Math.min(this.goal.polar, 1.0)); } }
    follow(seat) { this.following = seat; }
    bindGestures() {
      const el = this.renderer.domElement; const P = new Map(); let start = null, prev = null, moved = 0, tap0 = 0;
      const info = () => { const ps = [...P.values()]; if (!ps.length) return null; if (ps.length === 1) return { x: ps[0].x, y: ps[0].y, n: 1 }; const [a, b] = ps; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), n: 2 }; };
      el.addEventListener('pointerdown', e => { try { el.setPointerCapture(e.pointerId); } catch (x) {} P.set(e.pointerId, { x: e.clientX, y: e.clientY, btn: e.button, shift: e.shiftKey }); prev = info(); if (P.size === 1) { start = { x: e.clientX, y: e.clientY }; moved = 0; tap0 = performance.now(); } else start = null; });
      el.addEventListener('pointermove', e => {
        if (!P.has(e.pointerId)) return; const p = P.get(e.pointerId); p.x = e.clientX; p.y = e.clientY;
        const cur = info(); if (!prev || prev.n !== cur.n) { prev = cur; return; }
        const dx = cur.x - prev.x, dy = cur.y - prev.y; moved += Math.abs(dx) + Math.abs(dy);
        const g = this.goal;
        if (cur.n === 1 && !(p.btn === 2 || p.shift)) { // 單指拖曳：平移地圖
          if (moved > 6) { this.follow(null); this.userMoved = true; }
          const s = g.dist * 0.0016, az = g.azim;
          g.target.x += -Math.cos(az) * dx * s - Math.sin(az) * dy * s * 1.4;
          g.target.z += Math.sin(az) * dx * s - Math.cos(az) * dy * s * 1.4;
        } else if (cur.n === 1) { // 滑鼠右鍵或 Shift＋拖曳：旋轉＋俯仰
          g.azim -= dx * 0.006; g.polar += dy * 0.005; this.userMoved = true;
        } else { // 雙指：開合縮放、上下滑調俯仰、轉動
          g.dist *= prev.d / Math.max(10, cur.d);
          g.polar += dy * 0.006;
          let da = cur.ang - prev.ang; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; g.azim -= da;
          this.userMoved = true;
        }
        this.clampGoal(); prev = cur;
      });
      const up = e => {
        const wasTap = P.size === 1 && moved < 8 && performance.now() - tap0 < 400 && start;
        P.delete(e.pointerId); prev = info();
        if (wasTap && this.onTap) this.pick(e.clientX, e.clientY);
      };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', e => { P.delete(e.pointerId); prev = info(); });
      el.addEventListener('contextmenu', e => e.preventDefault());
      el.addEventListener('wheel', e => { e.preventDefault(); this.goal.dist *= 1 + Math.sign(e.deltaY) * Math.min(0.25, Math.abs(e.deltaY) * 0.0015); this.clampGoal(); this.userMoved = true; }, { passive: false });
    }
    // 給按鈕用：俯仰、縮放
    nudge(kind, v) { const g = this.goal; if (kind === 'tilt') g.polar += v; if (kind === 'zoom') g.dist *= v; if (kind === 'rot') g.azim += v; this.clampGoal(); }
    pick(cx, cy) {
      const T = THREE, rect = this.renderer.domElement.getBoundingClientRect();
      const v = new T.Vector2((cx - rect.left) / rect.width * 2 - 1, -(cy - rect.top) / rect.height * 2 + 1);
      const ray = new T.Raycaster(); ray.setFromCamera(v, this.cam);
      const toks = Object.entries(this.tokens).map(([s, tk]) => { tk.r.g.userData.seat = +s; return tk.r.g; });
      const th = ray.intersectObjects(toks, true)[0];
      if (th) { let o = th.object; while (o && o.userData.seat == null) o = o.parent; if (o) { this.onTap({ seat: o.userData.seat }); return; } }
      const hit = ray.intersectObjects(this.tileMeshes, false)[0]; if (hit) this.onTap({ tile: hit.object.userData.i });
    }
    frame() {
      const now = performance.now(), dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; const t = (now - this.t0) / 1000;
      this.anim = this.anim.filter(a => { const k = Math.min(1, (now - a.start) / a.dur); a.step(k); if (k >= 1) { a.done && a.done(); return false; } return true; });
      if (this.following != null && this.tokens[this.following]) { const p = this.tokens[this.following].r.g.position; this.goal.target.set(p.x, 0, p.z); this.clampGoal(); }
      const c = this.cr, g = this.goal, k = 1 - Math.pow(0.0015, dt);
      c.target.lerp(g.target, k); c.dist += (g.dist - c.dist) * k; c.polar += (g.polar - c.polar) * k; c.azim += (g.azim - c.azim) * k;
      const sp = Math.sin(c.polar);
      this.cam.position.set(c.target.x + c.dist * sp * Math.sin(c.azim), Math.max(0.45, c.target.y + c.dist * Math.cos(c.polar)), c.target.z + c.dist * sp * Math.cos(c.azim));
      this.cam.lookAt(c.target.x, c.target.y + (c.polar > 1.1 ? 0.4 : 0), c.target.z);
      this.upd.forEach(f => f(t, dt));
      Object.values(this.tokens).forEach(tk => root.MONO_CHARS.update(tk.r, t, dt));
      this.renderer.render(this.scene, this.cam);
    }
    tween(dur, step) { return new Promise(res => this.anim.push({ start: performance.now(), dur, step, done: res })); }

    // ================= 格子 =================
    buildTiles() {
      const T = THREE, A = root.MONO_ART; this.tileMeshes = [];
      const shape = new T.Shape(); const s = 0.66, rr = 0.1;
      shape.moveTo(-s + rr, -s); shape.lineTo(s - rr, -s); shape.quadraticCurveTo(s, -s, s, -s + rr); shape.lineTo(s, s - rr); shape.quadraticCurveTo(s, s, s - rr, s);
      shape.lineTo(-s + rr, s); shape.quadraticCurveTo(-s, s, -s, s - rr); shape.lineTo(-s, -s + rr); shape.quadraticCurveTo(-s, -s, -s + rr, -s);
      const geo = new T.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
      geo.rotateX(-Math.PI / 2); geo.translate(0, -0.27, 0);
      const side = { ragnarok: ['#e9e2d2', 0.35, 0.1], cyber: ['#1a1830', 0.3, 0.7], animal: ['#6e5a3e', 0.95, 0], alien: ['#26291f', 0.25, 0.7] }[this.theme];
      const sideMat = new T.MeshStandardMaterial({ color: side[0], roughness: side[1], metalness: side[2] });
      for (let i = 0; i < N; i++) {
        const [x, z] = tileXZ(i), b = this.R.BOARD[i];
        const base = new T.Mesh(geo, sideMat); base.position.set(x, 0, z); base.castShadow = base.receiveShadow = this.q.high; this.scene.add(base);
        const emis = this.theme === 'cyber' ? 0.55 : this.theme === 'alien' ? 0.25 : 0;
        const tx = A.tileTexture(T, this.theme, b, this.R.tileName(this.theme, i), ICON[this.theme][b.type] || '★');
        const top = new T.Mesh(new T.PlaneGeometry(1.32, 1.32), new T.MeshStandardMaterial({ map: tx, roughness: this.theme === 'ragnarok' ? 0.3 : 0.55, metalness: this.theme === 'cyber' ? 0.3 : 0, emissive: '#ffffff', emissiveMap: emis ? tx : null, emissiveIntensity: emis }));
        top.rotation.x = -Math.PI / 2; top.position.set(x, 0.005, z); top.receiveShadow = this.q.high; top.userData.i = i;
        this.scene.add(top); this.tileMeshes.push(top);
      }
    }
    pulseTile(i) { const m = this.tileMeshes[i]; if (!m) return; this.tween(500, k => { m.position.y = 0.005 + Math.sin(k * Math.PI) * 0.08; }); }

    // ================= 建築 =================
    setBuildings(owners, levels, info) {
      const T = THREE;
      for (let i = 0; i < N; i++) {
        const o = owners[i]; const inf = o >= 0 ? info[o] || {} : {};
        const key = o + ':' + levels[i] + ':' + (inf.charIdx != null ? inf.charIdx : '');
        if (this.bld[i] && this.bld[i].key === key) continue;
        if (this.bld[i]) { this.scene.remove(this.bld[i].obj); this.bld[i] = null; }
        if (o < 0) continue;
        const [x, z] = tileXZ(i); const grp = new T.Group(); grp.position.set(x, 0.005, z);
        const fr = new T.Mesh(new T.RingGeometry(0.58, 0.66, 4, 1), new T.MeshBasicMaterial({ color: inf.color || '#fff' })); fr.rotation.set(-Math.PI / 2, 0, Math.PI / 4); fr.position.y = 0.006; grp.add(fr);
        if (levels[i] > 0) {
          const b = root.MONO_ART.building(T, { theme: this.theme, level: levels[i], color: inf.color || '#fff', name: this.R.tileName(this.theme, i), ownerChar: inf.charIdx || 0 }, this.upd);
          b.position.set(0.15, 0, -0.15); grp.add(b);
          b.traverse(m => { if (m.isMesh) m.castShadow = this.q.high; });
          const s0 = 1.25; b.scale.setScalar(0.01); this.tween(650, k => b.scale.setScalar(s0 * Math.max(0.01, 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.15)));
        }
        this.scene.add(grp); this.bld[i] = { key, obj: grp };
      }
    }

    // ================= 角色 =================
    avatarTexture(img) {
      const T = THREE; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
      const im = new Image(); im.onload = () => { g.drawImage(im, 0, 0, 128, 128); tx.needsUpdate = true; }; im.src = img; return tx;
    }
    nameTag(name, color) {
      const T = THREE; const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
      g.font = 'bold 34px "PingFang TC","Noto Sans TC",sans-serif'; const w = Math.min(240, g.measureText(name).width + 28);
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); if (g.roundRect) g.roundRect(128 - w / 2, 8, w, 48, 24); else g.rect(128 - w / 2, 8, w, 48); g.fill();
      g.strokeStyle = color; g.lineWidth = 4; g.stroke(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, 128, 33);
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
      const sp = new T.Sprite(new T.SpriteMaterial({ map: tx, depthTest: false, transparent: true })); sp.scale.set(0.9, 0.225, 1); sp.position.y = 1.6; sp.renderOrder = 10; return sp;
    }
    setTokens(list) { // [{seat, idx, color, img, alive, name}]
      list.forEach(p => {
        const key = p.idx + p.color + (p.img ? p.img.length : 0) + p.name;
        let tk = this.tokens[p.seat];
        if (tk && tk.key !== key) { this.scene.remove(tk.r.g); tk = null; }
        if (!tk) {
          const r = root.MONO_CHARS.make(THREE, this.theme, p.idx, p.color, p.img ? this.avatarTexture(p.img) : null);
          r.g.traverse(m => { if (m.isMesh) m.castShadow = this.q.high; });
          r.g.add(this.nameTag(p.name, p.color)); r.g.scale.setScalar(1.15); this.scene.add(r.g);
          tk = this.tokens[p.seat] = { r, key, pos: -1 };
        }
        if (p.alive === false && tk.r.state !== 'fall') root.MONO_CHARS.set(tk.r, 'fall');
      });
    }
    setTurn(seat) { Object.entries(this.tokens).forEach(([s, tk]) => { tk.r.arrow.visible = +s === seat; }); }
    slot(i, seat) { const [x, z] = tileXZ(i); const a = seat / 6 * Math.PI * 2 + 0.5; return new THREE.Vector3(x + Math.cos(a) * 0.3, 0.005, z + Math.sin(a) * 0.3); }
    place(seat, i) { const tk = this.tokens[seat]; if (!tk) return; tk.r.g.position.copy(this.slot(i, seat)); tk.pos = i; const [x, z] = tileXZ(i); tk.r.g.rotation.y = Math.atan2(-x, -z); }
    mood(seat, m, ms) { const tk = this.tokens[seat]; if (tk) root.MONO_CHARS.set(tk.r, m, ms); }
    async hop(seat, path, watch) {
      const tk = this.tokens[seat]; if (!tk || !path.length) return;
      tk.busy = true; if (watch) this.follow(seat);
      root.MONO_CHARS.set(tk.r, 'walk');
      for (const i of path) {
        const from = tk.r.g.position.clone(), to = this.slot(i, seat);
        const yaw = Math.atan2(to.x - from.x, to.z - from.z);
        if (this.onStep) this.onStep(i);
        await this.tween(300, k => { tk.r.g.position.lerpVectors(from, to, k); let d = yaw - tk.r.g.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; tk.r.g.rotation.y += d * 0.3; });
        tk.pos = i; this.pulseTile(i);
      }
      root.MONO_CHARS.set(tk.r, 'idle'); tk.busy = false;
    }
    async teleport(seat, i, watch) {
      const tk = this.tokens[seat]; if (!tk) return; tk.busy = true; if (watch) this.follow(seat);
      const g = tk.r.g, base = g.scale.x;
      await this.tween(400, k => { g.position.y = 0.005 + k * k * 4; g.rotation.y += 0.4; g.scale.setScalar(base * (1 - k * 0.6)); });
      g.position.copy(this.slot(i, seat)); g.position.y = 4; tk.pos = i;
      await this.tween(450, k => { g.position.y = (1 - k) * (1 - k) * 4 + 0.005; g.rotation.y += 0.3; g.scale.setScalar(base * (0.4 + k * 0.6)); });
      g.scale.setScalar(base); tk.busy = false; this.pulseTile(i);
    }
    async shake(seat) { this.mood(seat, 'scared', 700); await new Promise(r => setTimeout(r, 700)); }
    async jumpJoy(seat) { this.mood(seat, 'joy', 900); }
    screenOf(seat, tile) {
      let v; const T = THREE;
      if (seat != null && this.tokens[seat]) v = this.tokens[seat].r.g.position.clone().add(new T.Vector3(0, 1.4, 0));
      else if (tile != null) { const [x, z] = tileXZ(tile); v = new T.Vector3(x, 0.7, z); } else return null;
      v.project(this.cam); if (v.z > 1) return null;
      return { x: (v.x + 1) / 2 * this.el.clientWidth, y: (1 - v.y) / 2 * this.el.clientHeight };
    }
  }
  root.MonoBoard3D = Board3D;
})(typeof window !== 'undefined' ? window : globalThis);
