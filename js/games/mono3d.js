// 大富翁 3D 場景核心：鏡頭操作、格子、角色移動（美術在 mono-art.js、角色在 mono-chars.js）
(function (root) {
  let THREE = null;
  async function loadThree() { if (!THREE) THREE = await import(new URL('vendor/three.module.min.js', document.baseURI).href); return THREE; }

  const ICON = {
    ragnarok: { start: '🏛️', jail: '💀', free: '🍷', gotojail: '⬇️', luck: '🌟', bad: '⚡', tax: '🪙', teleport: '🌈', item: '🏺' },
    cyber: { start: '🚉', jail: '🔒', free: '💉', gotojail: '🚨', luck: '💾', bad: '☠️', tax: '💰', teleport: '🚄', item: '🕶️' },
    animal: { start: '🌅', jail: '🦓', free: '💧', gotojail: '🪤', luck: '🌿', bad: '🔥', tax: '🌧️', teleport: '🌪️', item: '🌰' },
    buddha: { start: '🏮', jail: '👹', free: '♨️', gotojail: '⛓️', luck: '🧧', bad: '👻', tax: '🪔', teleport: '☁️', item: '📿' },
    gang: { start: '🪧', jail: '🔗', free: '🛹', gotojail: '🚨', luck: '💼', bad: '🚔', tax: '✉️', teleport: '👟', item: '🧯' },
    town: { start: '🚲', jail: '🔒', free: '🕹️', gotojail: '🚨', luck: '📻', bad: '🩸', tax: '🧾', teleport: '🌀', item: '🎲' },
    magic: { start: '🏰', jail: '🔒', free: '🔥', gotojail: '🕯️', luck: '⭐', bad: '💥', tax: '📜', teleport: '🌀', item: '🧪' },
    alien: { start: '🛸', jail: '⛓️', free: '🛰️', gotojail: '🚨', luck: '🧬', bad: '☄️', tax: '📦', teleport: '🕳️', item: '🧰' }
  };
  const U = 1.5, N = 28;
  function tileXZ(i) {
    const side = Math.floor(i / 7), k = i % 7, h = 3.5; let x, z;
    if (side === 0) { x = h - k; z = h; } else if (side === 1) { x = -h; z = h - k; } else if (side === 2) { x = -h + k; z = -h; } else { x = h; z = -h + k; }
    return [x * U, z * U];
  }
  function quality() { if (window.__monoQ) return window.__monoQ; try { return localStorage.getItem('mono-q') || ((navigator.hardwareConcurrency || 4) <= 4 ? 'low' : 'high'); } catch (e) { return 'high'; } }

  const U_shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  class Board3D {
    constructor() { this.tokens = {}; this.bld = {}; this.anim = []; this.upd = []; this.t0 = performance.now(); this.last = performance.now(); }
    async init(el, theme, R) {
      const T = await loadThree(); const A = root.MONO_ART;
      // 還沒有自己美術的主題（製作中）先借用 artBase 主題的外觀；格子名稱、建築名稱仍用自己的主題
      const real = theme; if (!A.STYLE[theme]) theme = ((root.MONO_THEMES || {})[theme] || {}).artBase || 'cyber';
      const S = A.STYLE[theme]; this.real = real;
      this.el = el; this.theme = theme; this.real = this.real || theme; this.R = R; this.q = { high: quality() === 'high' };
      const w = el.clientWidth || 360, h = el.clientHeight || 400;
      // 兩種畫質都開反鋸齒；低畫質只是解析度低一點、沒有陰影
      const pix = root.__pix && theme === 'town'; this.pix = pix; // 像素風預覽：用很低的解析度畫，再用最近鄰放大
      const r = this.renderer = new T.WebGLRenderer({ antialias: !pix, powerPreference: 'high-performance' });
      r.setPixelRatio(pix ? 0.34 : Math.min(this.q.high ? 2 : 1.35, window.devicePixelRatio || 1)); r.setSize(w, h); if (pix) r.domElement.style.imageRendering = 'pixelated';
      r.shadowMap.enabled = this.q.high; r.shadowMap.type = T.PCFSoftShadowMap;
      r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = theme === 'cyber' ? 1.35 : theme === 'alien' ? 1.0 : 1.0;
      el.appendChild(r.domElement); r.domElement.style.touchAction = 'none';
      // iOS／App 內建瀏覽器切到背景時可能把 3D 畫面回收（context lost），回來後通知外面整個重建
      r.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; setTimeout(() => this.onLost && this.onLost(), 300); });
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
      sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 }); sun.shadow.bias = -0.0005; sc.add(sun);
      A.env(T, sc, theme, this.q, this.upd);
      this.buildTiles();
      this.cr = { target: new T.Vector3(0, 0, 0), dist: 15, polar: 0.75, azim: 0 };
      this.goal = { target: new T.Vector3(0, 0, 0), dist: 15, polar: 0.75, azim: 0 };
      this.overview(true);
      this.bindGestures();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el);
      // 省電：最多 30 fps、分頁在背景時不畫（手機比較不會燙）
      let lastR = 0; const loop = (ts) => { if (this.dead) return; this.raf = requestAnimationFrame(loop); if (this.paused || document.hidden) return; if (ts - lastR < 31) return; lastR = ts; this.frame(); };
      loop();
    }
    resize() { const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h); this.cam.aspect = w / h; this.applyView(); }
    // 下方有選單蓋住時：把畫面中心往上挪到「沒被擋的那一塊」的正中間（點選格子的判定也跟著挪）
    setInset(px) { this.inset = Math.max(0, px || 0); this.applyView(); }
    applyView() {
      const w = this.el.clientWidth, h = this.el.clientHeight, ins = Math.min(this.inset || 0, h * 0.6);
      if (ins > 0 && w && h) this.cam.setViewOffset(w, h, 0, ins / 2, w, h); else this.cam.clearViewOffset();
      this.cam.updateProjectionMatrix();
    }
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
      const h = this.el.clientHeight || 1, ins = Math.min(this.inset || 0, h * 0.6), vis = (this.el.clientWidth || 1) / Math.max(1, h - ins); // 扣掉被選單擋住的高度再算要拉多遠
      this.follow(null); this.goal.target.set(0, 0, 0); this.goal.dist = asp < 0.62 ? 27 : asp < 0.8 ? 22 : asp < 1.2 ? 17 : 14;
      if (ins > 0) { const need = vis < 0.62 ? 27 : vis < 0.8 ? 22 : vis < 1.2 ? 17 : 14; this.goal.dist = Math.min(36, Math.max(this.goal.dist, need) * h / (h - ins) * 0.92); }
      this.goal.polar = 0.55; this.goal.azim = 0;
      if (snap) this.snap();
    }
    snap() { const c = this.cr, g = this.goal; c.target.copy(g.target); c.dist = g.dist; c.polar = g.polar; c.azim = g.azim; }
    focusSeat(seat, close) { const tk = this.tokens[seat]; if (!tk) return; this.follow(seat); if (close) { this.goal.dist = Math.min(this.goal.dist, 6.5); this.goal.polar = Math.max(0.85, Math.min(this.goal.polar, 1.1)); } }
    follow(seat) { this.following = seat; }
    focusTile(i) { const [x, z] = tileXZ(i); this.follow(null); this.goal.target.set(x, 0, z); this.clampGoal(); }
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
          if (moved > 6) { if (this.following != null && this.onPan) this.onPan(); this.follow(null); this.userMoved = true; }
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
      if (this._marks && this._marks.length) { const k = (performance.now() - this._markT) / 1000; this._marks.forEach((m, j) => { m.material.opacity = (m.scale.x > 1.1 ? 0.75 : 0.35) + Math.sin(k * 4 + j * 0.5) * 0.2; }); }
      const now = performance.now(), dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; const t = (now - this.t0) / 1000;
      this.anim = this.anim.filter(a => { const k = Math.min(1, (now - a.start) / a.dur); a.step(k); if (k >= 1) { a.done && a.done(); return false; } return true; });
      if (this.following != null && this.tokens[this.following]) { const p = this.tokens[this.following].r.g.position; this.goal.target.set(p.x, 0, p.z); this.clampGoal(); }
      const c = this.cr, g = this.goal, k = 1 - Math.pow(0.0015, dt);
      c.target.lerp(g.target, k); c.dist += (g.dist - c.dist) * k; c.polar += (g.polar - c.polar) * k; c.azim += (g.azim - c.azim) * k;
      const sp = Math.sin(c.polar);
      this.cam.position.set(c.target.x + c.dist * sp * Math.sin(c.azim), Math.max(0.45, c.target.y + c.dist * Math.cos(c.polar)), c.target.z + c.dist * sp * Math.cos(c.azim));
      this.cam.lookAt(c.target.x, c.target.y + (c.polar > 1.1 ? 0.4 : 0), c.target.z);
      this.upd.forEach(f => f(t, dt));
      // 擋住鏡頭的大型物件（例如中央星門）自動變透明
      (this.scene.userData.occl || []).forEach(o => {
        const cp = this.cam.position, tg = c.target, seg = tg.clone().sub(cp), L = seg.length(); seg.normalize();
        const tt = Math.max(0, Math.min(L, o.c.clone().sub(cp).dot(seg))), d = cp.clone().addScaledVector(seg, tt).distanceTo(o.c);
        const want = (d < o.r && tt < L - 0.5) || cp.distanceTo(o.c) < o.r + 0.6 ? 0.12 : 1; o.cur = o.cur == null ? 1 : o.cur + (want - o.cur) * Math.min(1, dt * 8);
        if (!o.mats) { o.mats = []; o.g.traverse(m => { if (m.material && !o.mats.includes(m.material)) { o.mats.push(m.material); m.material.userData.op = m.material.opacity; } }); }
        o.mats.forEach(m => { m.transparent = true; m.opacity = (m.userData.op || 1) * o.cur; m.depthWrite = o.cur > 0.9; });
      });
      Object.values(this.tokens).forEach(tk => {
        root.MONO_CHARS.update(tk.r, t, dt);
        if (tk.r.billboard) { const gp = tk.r.g.position; tk.r.billboard.rotation.y = Math.atan2(this.cam.position.x - gp.x, this.cam.position.z - gp.z) - tk.r.g.rotation.y; }
      });
      this.renderer.render(this.scene, this.cam);
    }
    tween(dur, step) { dur *= (root.__monoSlow || 1); return new Promise(res => this.anim.push({ start: performance.now(), dur, step, done: res })); }

    // ================= 格子 =================
    buildTiles() {
      const T = THREE, A = root.MONO_ART; this.tileMeshes = [];
      const shape = new T.Shape(); const s = 0.66, rr = 0.1;
      shape.moveTo(-s + rr, -s); shape.lineTo(s - rr, -s); shape.quadraticCurveTo(s, -s, s, -s + rr); shape.lineTo(s, s - rr); shape.quadraticCurveTo(s, s, s - rr, s);
      shape.lineTo(-s + rr, s); shape.quadraticCurveTo(-s, s, -s, s - rr); shape.lineTo(-s, -s + rr); shape.quadraticCurveTo(-s, -s, -s + rr, -s);
      const geo = new T.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
      geo.rotateX(-Math.PI / 2); geo.translate(0, -0.27, 0);
      const side = { gang: ['#1e1a24', 0.8, 0.1], ragnarok: ['#e9e2d2', 0.35, 0.1], cyber: ['#1a1830', 0.3, 0.7], animal: ['#6e5a3e', 0.95, 0], alien: ['#2a2232', 0.3, 0.6], buddha: ['#3a1012', 0.4, 0.2], magic: ['#3a3446', 0.8, 0.1], town: ['#2a2024', 0.7, 0.1] }[this.theme] || ['#333', 0.7, 0];
      const sideMat = new T.MeshStandardMaterial({ color: side[0], roughness: side[1], metalness: side[2] });
      for (let i = 0; i < N; i++) {
        const [x, z] = tileXZ(i), b = this.R.BOARD[i];
        const base = new T.Mesh(geo, sideMat); base.position.set(x, 0, z); base.castShadow = base.receiveShadow = this.q.high; this.scene.add(base);
        const emis = this.theme === 'cyber' ? 0.55 : this.theme === 'gang' ? 0.42 : this.theme === 'alien' ? 0 : 0;
        const tx = A.tileTexture(T, this.theme, b, this.R.tileName(this.real, i), ICON[this.theme][b.type] || '★');
        const top = new T.Mesh(new T.PlaneGeometry(1.32, 1.32), new T.MeshStandardMaterial({ map: tx, roughness: this.theme === 'ragnarok' ? 0.3 : 0.55, metalness: this.theme === 'cyber' ? 0.3 : 0, emissive: '#ffffff', emissiveMap: emis ? tx : null, emissiveIntensity: emis }));
        top.rotation.x = -Math.PI / 2; top.position.set(x, 0.005, z); top.receiveShadow = this.q.high; top.userData.i = i;
        this.scene.add(top); this.tileMeshes.push(top);
      }
    }
    // 選格子模式：把可以選的格子打上光圈（自己的地金色、其他白色），選中的那格會跳動
    markTiles(list, mine, sel) {
      const T = THREE; this.clearMarks(); this._marks = [];
      for (const i of list) { const [x, z] = tileXZ(i); const g = new T.Mesh(new T.RingGeometry(0.55, 0.72, 40), new T.MeshBasicMaterial({ color: i === sel ? '#3ef0ff' : mine.includes(i) ? '#ffd36e' : '#ffffff', transparent: true, opacity: i === sel ? 0.95 : 0.55, depthWrite: false, side: T.DoubleSide }));
        g.rotation.x = -Math.PI / 2; g.position.set(x, 0.12, z); g.userData.i = i; this.scene.add(g); this._marks.push(g); if (i === sel) { g.scale.setScalar(1.25); } }
      this._markT = performance.now();
    }
    clearMarks() { (this._marks || []).forEach(m => { this.scene.remove(m); m.geometry.dispose(); m.material.dispose(); }); this._marks = []; }
    pulseTile(i) { const m = this.tileMeshes[i]; if (!m) return; this.tween(500, k => { m.position.y = 0.005 + Math.sin(k * Math.PI) * 0.08; }); }

    // ================= 建築 =================
    dropBuilding(i) {
      const r = this.bld[i]; if (!r) return; this.scene.remove(r.obj);
      if (r.fn) { const k = this.upd.indexOf(r.fn); if (k >= 0) this.upd.splice(k, 1); }
      r.obj.traverse(m => { if (m.geometry) m.geometry.dispose(); }); this.bld[i] = null;
    }
    setBuildings(owners, levels, info) {
      const T = THREE;
      for (let i = 0; i < N; i++) {
        const o = owners[i]; const inf = o >= 0 ? info[o] || {} : {};
        const key = o + ':' + levels[i] + ':' + (inf.charIdx != null ? inf.charIdx : '');
        if (this.bld[i] && this.bld[i].key === key) continue;
        if (this.bld[i]) { this.dropBuilding(i); }
        if (o < 0) continue;
        const bu = []; const [x, z] = tileXZ(i); const grp = new T.Group(); grp.position.set(x, 0.005, z);
        const fr = new T.Mesh(new T.RingGeometry(0.58, 0.66, 4, 1), new T.MeshBasicMaterial({ color: inf.color || '#fff' })); fr.rotation.set(-Math.PI / 2, 0, Math.PI / 4); fr.position.y = 0.006; grp.add(fr);
        if (levels[i] > 0) {
          // 建築自己的動畫放在自己的清單，拆掉／改建時一起移除（以前會一直累積，越玩越卡）
          const b = root.MONO_ART.building(T, { theme: this.theme, level: levels[i], color: inf.color || '#fff', name: this.R.tileName(this.real, i), ownerChar: inf.charIdx || 0 }, bu);
          b.position.set(0.15, 0, -0.15); grp.add(b);
          b.traverse(m => { if (m.isMesh) m.castShadow = this.q.high; });
          const s0 = 1.25 * (b.userData.s || 1); b.scale.setScalar(0.01); this.tween(650, k => b.scale.setScalar(s0 * Math.max(0.01, 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.15)));
        }
        const fn = bu.length ? (t, dt) => { for (let k = 0; k < bu.length; k++) bu[k](t, dt); } : null; if (fn) this.upd.push(fn);
        this.scene.add(grp); this.bld[i] = { key, obj: grp, fn };
      }
    }

    // ================= 角色 =================
    // 自畫角色：白底去背＋白色貼紙描邊，做成紙板立牌
    avatarTexture(img) {
      const T = THREE, S = 256; const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
      const im = new Image(); im.onload = () => {
        const cut = document.createElement('canvas'); cut.width = cut.height = S; const cg = cut.getContext('2d');
        cg.drawImage(im, 16, 16, S - 32, S - 32);
        const d = cg.getImageData(0, 0, S, S), x = d.data; let ink = 0;
        for (let i = 0; i < x.length; i += 4) { const m = Math.min(x[i], x[i + 1], x[i + 2]); if (m > 225) x[i + 3] = 0; else { if (m > 190) x[i + 3] = Math.round((225 - m) / 35 * 255); ink++; } }
        cg.putImageData(d, 0, 0);
        if (ink < 50) { g.fillStyle = '#fff'; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 10, 0, 7); g.fill(); g.drawImage(im, 24, 24, S - 48, S - 48); tx.needsUpdate = true; return; } // 幾乎空白就用圓牌
        // 描邊：把剪影往四周位移疊起來，塗白
        const ol = document.createElement('canvas'); ol.width = ol.height = S; const og = ol.getContext('2d');
        for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; og.drawImage(cut, Math.cos(a) * 7, Math.sin(a) * 7); }
        og.globalCompositeOperation = 'source-in'; og.fillStyle = '#ffffff'; og.fillRect(0, 0, S, S);
        g.clearRect(0, 0, S, S); g.drawImage(ol, 0, 0); g.drawImage(cut, 0, 0); tx.needsUpdate = true;
      }; im.src = img; return tx;
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
        const key = p.idx + p.color + (p.img ? p.img.length : 0) + p.name + (p.pill ? p.pill.slice(-24) : '') + '|' + (p.stamp || 0);
        let tk = this.tokens[p.seat];
        if (tk && tk.key !== key) { this.scene.remove(tk.r.g); tk = null; }
        if (!tk) {
          const ct = this.real === 'gang' && root.MONO_PIXEL && root.MONO_PIXEL.gangFrame ? 'gang' : this.theme, r = root.MONO_CHARS.make(THREE, ct, ct !== this.real && this.real !== this.theme ? p.idx % 8 : p.idx, p.color, p.img ? this.avatarTexture(p.img) : null, { pill: p.pill, stamp: p.stamp });
          r.g.traverse(m => { if (m.isMesh) m.castShadow = this.q.high; });
          { const tg = this.nameTag(p.name, p.color); tg.traverse(o => o.userData.tag = true); r.g.add(tg); } r.g.scale.setScalar(1.15); this.scene.add(r.g);
          tk = this.tokens[p.seat] = { r, key, pos: -1 };
        }
        tk.color = p.color;
        if (p.evolved && !tk.evolved) { tk.evolved = true; this.metalize(tk.r); }
        if (!!p.frog !== !!tk.frog) { tk.frog = !!p.frog; this.frogify(tk, tk.frog); }
        if (tk.eaten) tk.r.g.visible = false;
        else if (p.alive === false && tk.r.state !== 'fall') root.MONO_CHARS.set(tk.r, 'fall');
      });
    }
    // 變青蛙：把角色藏起來，換成一隻綠色青蛙（頭上的名牌、光圈保留）
    frogify(tk, on) {
      const T = THREE, r = tk.r;
      if (!tk.frogG) { const M = (c, e) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.4 }, e || {})); const g = new T.Group(); const sk = M('#7a6a38', { roughness: 0.9 });
        const b = new T.Mesh(new T.SphereGeometry(0.22, 18, 14), sk); b.scale.set(1.15, 0.75, 1); b.position.y = 0.17; g.add(b);
        const bl = new T.Mesh(new T.SphereGeometry(0.16, 14, 10), M('#d8c890'));
        for (let k = 0; k < 16; k++) { const w = new T.Mesh(new T.SphereGeometry(0.022, 6, 4), M('#5a4a24', { roughness: 1 })); const a = k * 2.4, h = 0.2 + (k % 4) * 0.03; w.position.set(Math.cos(a) * 0.2, h, Math.sin(a) * 0.17); g.add(w); } bl.scale.set(1.1, 0.6, 0.9); bl.position.set(0, 0.12, 0.08); g.add(bl);
        [-1, 1].forEach(sd => { const e = new T.Mesh(new T.SphereGeometry(0.075, 12, 10), sk); e.position.set(sd * 0.1, 0.34, 0.1); g.add(e); const w = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), M('#ffffff')); w.position.set(sd * 0.1, 0.35, 0.16); g.add(w); const pu = new T.Mesh(new T.SphereGeometry(0.025, 8, 6), M('#111')); pu.position.set(sd * 0.1, 0.35, 0.205); g.add(pu);
          const lg = new T.Mesh(new T.SphereGeometry(0.08, 10, 8), sk); lg.scale.set(0.8, 0.5, 1.4); lg.position.set(sd * 0.2, 0.05, -0.02); g.add(lg); });
        const m = new T.Mesh(new T.TorusGeometry(0.1, 0.012, 6, 16, Math.PI), M('#2a4a1a')); m.rotation.z = Math.PI; m.position.set(0, 0.22, 0.2); g.add(m);
        tk.frogG = g; r.g.add(g); }
      r.body.visible = !on; tk.frogG.visible = on;
    }
    setTurn(seat) { Object.entries(this.tokens).forEach(([s, tk]) => { tk.r.arrow.visible = +s === seat; }); }
    slot(i, seat) { const [x, z] = tileXZ(i); const a = seat / 6 * Math.PI * 2 + 0.5; return new THREE.Vector3(x + Math.cos(a) * 0.3, 0.005, z + Math.sin(a) * 0.3); }
    place(seat, i) { const tk = this.tokens[seat]; if (!tk) return; tk.r.g.position.copy(this.slot(i, seat)); tk.pos = i; const [x, z] = tileXZ(i); tk.r.g.rotation.y = Math.atan2(-x, -z); }
    // 債主衝向破產的人（短距離撲過去再回來）
    async lunge(by, seat) {
      const a = this.tokens[by], d = this.tokens[seat]; if (!a || !d) return;
      const from = a.r.g.position.clone(), to = d.r.g.position.clone(); a.r.g.rotation.y = Math.atan2(to.x - from.x, to.z - from.z); this.follow(seat);
      root.MONO_CHARS.set(a.r, 'walk'); await this.tween(380, k => a.r.g.position.lerpVectors(from, to, k * 0.85));
      root.MONO_CHARS.set(d.r, 'scared', 600); await this.shake(seat); await this.tween(300, k => a.r.g.position.lerpVectors(to, from, 0.15 + k * 0.85).setY(from.y)); root.MONO_CHARS.set(a.r, 'idle');
    }
    mood(seat, m, ms) { const tk = this.tokens[seat]; if (tk) root.MONO_CHARS.set(tk.r, m, ms); }
    async hop(seat, path, watch, ms) {
      const tk = this.tokens[seat]; if (!tk || !path.length) return;
      tk.busy = true; if (watch) this.follow(seat);
      root.MONO_CHARS.set(tk.r, 'walk');
      for (const i of path) {
        const from = tk.r.g.position.clone(), to = this.slot(i, seat);
        const yaw = Math.atan2(to.x - from.x, to.z - from.z);
        if (this.onStep) this.onStep(i);
        await this.tween(ms || (path.length > 8 ? 190 : 230), k => { tk.r.g.position.lerpVectors(from, to, k); let d = yaw - tk.r.g.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; tk.r.g.rotation.y += d * 0.3; });
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
    // ===== 深空異種：債主走過去，把破產的人吞掉 =====
    async devour(eater, victim, sfx) {
      const T = THREE, E = this.tokens[eater], V = this.tokens[victim]; if (!E || !V) return;
      const S = (k) => sfx && sfx(k), wait = (ms) => new Promise(r => setTimeout(r, ms * (root.__monoSlow || 1)));
      E.busy = V.busy = true; const home = E.pos; const N = this.R.N;
      root.MONO_CHARS.set(V.r, 'scared', 9000);
      // 1. 鏡頭跟著債主，走（快步）到破產者那一格
      this.follow(eater); this.goal.dist = 6.5; this.goal.polar = 1.05; this.clampGoal();
      S('growl');
      const fw = (V.pos - E.pos + N) % N, bw = (E.pos - V.pos + N) % N, dir = fw <= bw ? 1 : -1, n = Math.min(fw, bw);
      const path = []; for (let k = 1; k <= n; k++) path.push((E.pos + dir * k + N) % N);
      if (path.length) await this.hop(eater, path, true, Math.max(90, Math.min(180, 1800 / path.length)));
      // 2. 貼近、面對獵物，鏡頭拉近
      const vp = V.r.g.position.clone(), ep0 = E.r.g.position.clone(); const dirV = vp.clone().sub(ep0); dirV.y = 0; if (dirV.length() < 0.05) dirV.set(0.3, 0, 0.3);
      dirV.normalize(); const stand = vp.clone().sub(dirV.clone().multiplyScalar(0.55));
      const yaw = Math.atan2(dirV.x, dirV.z);
      root.MONO_CHARS.set(E.r, 'walk');
      await this.tween(350, k => { E.r.g.position.lerpVectors(ep0, stand, k); E.r.g.rotation.y += (yaw - E.r.g.rotation.y) * 0.3; });
      root.MONO_CHARS.set(E.r, 'idle'); E.r.g.rotation.y = yaw; V.r.g.rotation.y = yaw + Math.PI;
      this.follow(victim); this.goal.dist = 3.4; this.goal.polar = 1.18; this.goal.azim = yaw + Math.PI / 2 + 0.5; this.clampGoal();
      await wait(450);
      // 3. 生物機械巨顎：從債主頭部長出來
      const black = new T.MeshPhysicalMaterial({ color: '#1a1420', roughness: 0.18, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08 }), gum = new T.MeshPhysicalMaterial({ color: '#6a0f1e', roughness: 0.25, clearcoat: 1, side: T.BackSide }),
        bone = new T.MeshStandardMaterial({ color: '#efe6cf', roughness: 0.22, emissive: '#2a2010', emissiveIntensity: 0.3 }), slime = new T.MeshStandardMaterial({ color: '#c9d8a0', roughness: 0.05, transparent: true, opacity: 0.6 });
      const maw = new T.Group(); this.scene.add(maw);
      const mk = (up) => { const j = new T.Group(); maw.add(j);
        const sh = new T.Mesh(new T.SphereGeometry(0.42, 24, 12, 0, Math.PI * 2, up ? 0 : Math.PI / 2, Math.PI / 2), black); sh.scale.set(1, 0.7, 1.25); sh.position.z = 0.32; j.add(sh);
        const in_ = new T.Mesh(new T.SphereGeometry(0.4, 20, 10, 0, Math.PI * 2, up ? 0 : Math.PI / 2, Math.PI / 2), gum); in_.scale.set(0.97, 0.66, 1.2); in_.position.z = 0.32; j.add(in_);
        for (let row = 0; row < 2; row++) for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; if (Math.sin(a) < -0.6) continue; const rr = row ? 0.3 : 0.39, tth = new T.Mesh(new T.ConeGeometry(row ? 0.022 : 0.034, (row ? 0.09 : 0.15) + (k % 3 === 0 ? 0.08 : 0), 6), bone); tth.position.set(Math.cos(a) * rr, 0, 0.32 + Math.sin(a) * rr * 1.25); tth.rotation.x = up ? Math.PI : 0; tth.rotation.z = (up ? 1 : -1) * Math.cos(a) * 0.15; j.add(tth); }
        for (let k = 0; k < 7; k++) { const vn = new T.Mesh(new T.TorusGeometry(0.4 - k * 0.012, 0.01, 4, 16, 0.9), new T.MeshStandardMaterial({ color: '#3a0a14', roughness: 0.3 })); vn.rotation.set(up ? -0.3 - k * 0.12 : 0.3 + k * 0.12, 0, Math.PI / 2); vn.position.z = 0.32; j.add(vn); }
        for (let k = 0; k < 4; k++) { const rb = new T.Mesh(new T.TorusGeometry(0.42, 0.018, 6, 20, Math.PI), bone); rb.scale.set(1, 0.7, 1); rb.rotation.set(up ? 0 : Math.PI, Math.PI / 2, 0); rb.position.z = 0.05 + k * 0.17; j.add(rb); }
        for (let k = 0; k < 3; k++) { const d = new T.Mesh(new T.CylinderGeometry(0.008, 0.004, 0.25, 4), slime); d.position.set(-0.15 + k * 0.15, up ? -0.12 : 0.12, 0.45); j.add(d); }
        return j; };
      const upper = mk(true), lower = mk(false);
      const inner = new T.Group(); maw.add(inner); // 內顎（會彈射出來）
      const ij = new T.Mesh(new T.CapsuleGeometry(0.06, 0.3, 6, 10), black); ij.rotation.x = Math.PI / 2; ij.position.z = 0.15; inner.add(ij);
      for (let k = 0; k < 4; k++) { const tt = new T.Mesh(new T.ConeGeometry(0.014, 0.05, 4), bone); tt.position.set(-0.03 + k * 0.02, 0, 0.36); tt.rotation.x = Math.PI / 2; inner.add(tt); }
      const head0 = E.r.g.position.clone().add(new T.Vector3(0, 0.9, 0)), target = V.r.g.position.clone().add(new T.Vector3(0, 0.45, 0));
      maw.position.copy(head0); maw.lookAt(target); maw.scale.setScalar(0.01);
      S('hiss');
      // 上下顎之間牽絲的黏液
      const strands = []; for (let k = 0; k < 5; k++) { const st = new T.Mesh(new T.CylinderGeometry(0.006, 0.01, 1, 5), slime); st.position.set(-0.2 + k * 0.1, 0, 0.45 + (k % 2) * 0.1); maw.add(st); strands.push(st); }
      const open = (a) => { upper.rotation.x = -a; lower.rotation.x = a; strands.forEach((st, k) => { const h = Math.sin(a) * (0.42 + (k % 2) * 0.1) * 2; st.scale.y = Math.max(0.01, h * (a < 1.0 ? 1 : 0.3)); st.visible = a > 0.12; }); };
      await this.tween(500, k => { const e = 1 - Math.pow(1 - k, 3); maw.scale.setScalar(0.01 + e * 1.15); open(e * 0.9); });
      // 張大嘴移到獵物上方，唾液滴落
      const over = target.clone().sub(dirV.clone().multiplyScalar(0.25)); over.y += 0.15;
      await this.tween(550, k => { maw.position.lerpVectors(head0, over, k); maw.lookAt(target); open(0.9 + k * 0.35); });
      await this.tween(220, k => { inner.position.z = Math.sin(k * Math.PI) * 0.45; });
      // 4. 咬合！把獵物整個叼起來
      S('snap');
      await this.tween(110, k => { open(1.25 * (1 - k) + 0.25 * k); maw.position.lerpVectors(over, target, k); });
      this.gore(target, S, 70, 0.8);
      maw.attach(V.r.g); root.MONO_CHARS.set(V.r, 'scared', 6000);
      const c0 = this.goal.target.clone(); this.tween(450, k => { const a = (1 - k) * 0.12; this.goal.target.set(c0.x + (Math.random() - 0.5) * a, 0, c0.z + (Math.random() - 0.5) * a); }).then(() => this.goal.target.copy(c0));
      // 叼高、猛力甩動，體液一路噴灑
      const up0 = maw.position.clone(), up1 = up0.clone().add(new T.Vector3(0, 0.75, 0));
      await this.tween(380, k => maw.position.lerpVectors(up0, up1, 1 - Math.pow(1 - k, 2)));
      let lastSp = 0; S('growl');
      await this.tween(1100, k => {
        maw.rotation.z = Math.sin(k * 34) * 0.5 * (1 - k * 0.4); maw.position.x = up1.x + Math.sin(k * 17) * 0.12;
        const now = performance.now(); if (now - lastSp > 130) { lastSp = now; const w = new T.Vector3(); V.r.g.getWorldPosition(w); w.y += 0.2; this.gore(w, null, 12, 0.55, true); }
      });
      maw.rotation.z = 0;
      // 吞下去：咀嚼、獵物被嚼碎消失
      for (let c = 0; c < 3; c++) { S('crunch'); const s0 = V.r.g.scale.x; await this.tween(240, k => { open(0.25 + Math.sin(k * Math.PI) * 0.3); V.r.g.scale.setScalar(s0 * (1 - k * 0.3)); }); const w = new T.Vector3(); maw.getWorldPosition(w); this.gore(w, null, 18, 0.6, true); }
      V.r.g.visible = false; V.eaten = true; this.scene.attach(V.r.g);
      await this.tween(300, k => open(0.25 * (1 - k)));
      await this.tween(300, k => maw.position.lerpVectors(up1, up0, k));
      await wait(200);
      // 5. 巨顎縮回債主體內，債主得意
      const back = E.r.g.position.clone().add(new T.Vector3(0, 0.9, 0)), mp = maw.position.clone();
      await this.tween(420, k => { maw.position.lerpVectors(mp, back, k); maw.scale.setScalar(1.15 * (1 - k) + 0.01); });
      this.scene.remove(maw);
      root.MONO_CHARS.set(E.r, 'joy', 1300); S('roar'); await wait(1100);
      // 6. 跳回原本的位置
      this.follow(eater); this.goal.dist = 8;
      E.busy = false; await this.teleport(eater, home, true);
    }
    // ===== 破產處決（諸神黃昏、夜城）共用工具 =====
    sleepS(ms) { return new Promise(r => setTimeout(r, ms * (root.__monoSlow || 1))); }
    async approach(killer, victim, dist) {
      const T = THREE, E = this.tokens[killer], V = this.tokens[victim], N = this.R.N;
      E.busy = V.busy = true; const home = E.pos;
      this.follow(killer); this.goal.dist = 6.5; this.goal.polar = 1.05; this.clampGoal();
      const fw = (V.pos - E.pos + N) % N, bw = (E.pos - V.pos + N) % N, dir = fw <= bw ? 1 : -1, n = Math.min(fw, bw);
      const path = []; for (let k = 1; k <= n; k++) path.push((E.pos + dir * k + N) % N);
      if (path.length) await this.hop(killer, path, true, Math.max(90, Math.min(180, 1800 / path.length)));
      const vp = V.r.g.position.clone(), ep0 = E.r.g.position.clone(); const d = vp.clone().sub(ep0); d.y = 0; if (d.length() < 0.05) d.set(0.3, 0, 0.3); d.normalize();
      const stand = vp.clone().sub(d.clone().multiplyScalar(dist)); const yaw = Math.atan2(d.x, d.z);
      root.MONO_CHARS.set(E.r, 'walk'); await this.tween(380, k => { E.r.g.position.lerpVectors(ep0, stand, k); E.r.g.rotation.y += (yaw - E.r.g.rotation.y) * 0.3; });
      root.MONO_CHARS.set(E.r, 'idle'); E.r.g.rotation.y = yaw; V.r.g.rotation.y = yaw + Math.PI;
      this.follow(null); const mid = stand.clone().lerp(vp, 0.5);
      this.goal.target.set(mid.x, 0, mid.z); this.goal.dist = 3.2 + dist * 0.8; this.goal.polar = 1.15; this.goal.azim = yaw + Math.PI / 2 + 0.35; this.clampGoal();
      root.MONO_CHARS.set(V.r, 'scared', 20000);
      await this.sleepS(350);
      return { home, d, yaw, vp };
    }
    async finishKill(killer, victim, home) {
      const E = this.tokens[killer], V = this.tokens[victim];
      if (V) { V.r.g.visible = false; V.eaten = true; }
      if (E) { root.MONO_CHARS.set(E.r, 'joy', 1000); await this.sleepS(900); E.busy = false; await this.teleport(killer, home, false); }
    }
    // 進化：一般角色變鉻金屬；自畫立牌保留原圖，只變成灰階（不然會變成一塊黑方塊）
    metalize(r, k = 1) {
      const T = THREE, chrome = new T.MeshStandardMaterial({ color: '#9aa0a8', metalness: 1, roughness: 0.22 });
      if (r.kind !== 'standee') return this.recolor(r, chrome);
      r.g.traverse(o => { if (!o.isMesh || o.userData.tag) return;
        if (!o.userData.mat0) o.userData.mat0 = o.material;
        const m0 = o.userData.mat0;
        if (m0.map && m0.map.image) {
          if (!m0.userData.grey) { const img = m0.map.image, c = document.createElement('canvas'); c.width = img.width || 256; c.height = img.height || 256;
            const x = c.getContext('2d'); x.filter = 'grayscale(1) contrast(1.15)'; x.drawImage(img, 0, 0, c.width, c.height);
            if (x.filter !== 'grayscale(1) contrast(1.15)') { const d = x.getImageData(0, 0, c.width, c.height), a = d.data; for (let i = 0; i < a.length; i += 4) { const g = a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11; a[i] = a[i + 1] = a[i + 2] = g; } x.putImageData(d, 0, 0); }
            const t = new T.CanvasTexture(c); t.colorSpace = m0.map.colorSpace; m0.userData.grey = t; }
          const m = m0.clone(); m.map = m0.userData.grey; o.material = m;
        } else o.material = chrome;
      });
    }
    // 道具特效
    itemFx(k, tile, seat, blocked) {
      const T = THREE; let at;
      if (tile != null) { const [x, z] = tileXZ(tile); at = new T.Vector3(x, 0.4, z); }
      else { const tk = this.tokens[seat]; if (!tk) return; at = tk.r.g.position.clone().add(new T.Vector3(0, 0.6, 0)); }
      if (blocked) { this.ring(at, '#7fd8ff', 1.2, 900); this.burst(at, { n: 24, colors: ['#ffffff', '#7fd8ff'], speed: 1.6, up: 0.6, size: 0.03, life: 0.6, add: true }); return; }
      if (k === 'bomb') { this.ring(at, '#ff6a00', 1.8, 700); this.burst(at, { n: 46, colors: ['#ffb000', '#ff4d00', '#3a3a3a', '#777'], speed: 3.2, up: 2.4, size: 0.07, life: 1.0, box: true }); this.burst(at, { n: 30, colors: ['#fff3b0', '#ff9f1c'], speed: 2, up: 1.5, size: 0.05, life: 0.5, add: true }); }
      else if (k === 'trap') { this.ring(at, '#b14cff', 1.0, 1000); this.burst(at, { n: 26, colors: ['#b14cff', '#e0b0ff'], speed: 1.2, up: 1.2, size: 0.04, life: 0.8, add: true }); }
      else if (k === 'steal') { this.burst(at, { n: 30, colors: ['#ffd400', '#ffef8a'], speed: 1.8, up: 2, size: 0.05, life: 0.8, box: true }); }
      else { this.ring(at, '#3cff9e', 1.2, 900); this.burst(at, { n: 24, colors: ['#3cff9e', '#d8ffe9'], speed: 1.4, up: 1.8, size: 0.04, life: 0.8, add: true }); }
    }
    setQuality(high) {
      this.q.high = high; const r = this.renderer; if (!r) return;
      r.setPixelRatio(Math.min(high ? 2 : 1.35, window.devicePixelRatio || 1));
      r.setSize(this.el.clientWidth || 360, this.el.clientHeight || 400);
      r.shadowMap.enabled = high; this.scene.traverse(o => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); } });
    }
    recolor(r, mat) { r.g.traverse(o => { if (o.isMesh && !o.userData.tag) { if (!o.userData.mat0) o.userData.mat0 = o.material; o.material = mat; } }); }
    // 粒子：顏色、數量、速度、重力、壽命、大小
    burst(at, o) {
      const T = THREE, ps = [], geo = o.box ? new T.BoxGeometry(1, 1, 1) : new T.SphereGeometry(1, 6, 5);
      for (let k = 0; k < (o.n || 30); k++) {
        const c = o.colors[k % o.colors.length];
        const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 1, blending: o.add ? T.AdditiveBlending : T.NormalBlending, depthWrite: !o.add }));
        const sz = (o.size || 0.04) * (0.5 + Math.random()); m.scale.setScalar(sz);
        m.position.set(at.x + (Math.random() - 0.5) * (o.spread || 0.3), at.y + (Math.random() - 0.5) * (o.spreadY || o.spread || 0.3), at.z + (Math.random() - 0.5) * (o.spread || 0.3));
        const a = Math.random() * 6.28, sp = (o.speed || 1) * (0.3 + Math.random());
        m.userData = { v: new T.Vector3(Math.cos(a) * sp * (o.flat == null ? 1 : o.flat), (o.up || 0) + Math.random() * (o.upRand || 1), Math.sin(a) * sp * (o.flat == null ? 1 : o.flat)), life: (o.life || 1) * (0.6 + Math.random() * 0.6), age: 0, s0: sz };
        if (o.wind) m.userData.v.add(o.wind);
        this.scene.add(m); ps.push(m);
      }
      const step = (t, dt) => { let alive = 0; ps.forEach(m => { const u = m.userData; if (u.age >= u.life) return; u.age += dt; alive++; u.v.y -= (o.g == null ? 6 : o.g) * dt; m.position.addScaledVector(u.v, dt); if (m.position.y < 0.02 && o.g !== 0) { m.position.y = 0.02; u.v.multiplyScalar(0.3); } const k = u.age / u.life; m.material.opacity = 1 - k; if (o.grow) m.scale.setScalar(u.s0 * (1 + k * o.grow)); if (o.box) m.rotation.x += dt * 4; });
        if (!alive) { const i = this.upd.indexOf(step); if (i >= 0) this.upd.splice(i, 1); ps.forEach(m => { this.scene.remove(m); m.material.dispose(); }); } };
      this.upd.push(step);
    }
    // 閃電：鋸齒狀的發光管
    bolt(from, to, color, width) {
      const T = THREE, pts = [], n = 10; for (let k = 0; k <= n; k++) { const p = from.clone().lerp(to, k / n); if (k && k < n) p.add(new T.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.5)); pts.push(p); }
      const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, false, 'catmullrom', 0), 30, width || 0.035, 5), new T.MeshBasicMaterial({ color: color || '#e8f4ff', transparent: true, blending: T.AdditiveBlending }));
      const glow = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, false, 'catmullrom', 0), 30, (width || 0.035) * 4, 5), new T.MeshBasicMaterial({ color: '#7fb6ff', transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false }));
      const L = new T.PointLight(color || '#cfe4ff', 25, 8, 1.5); L.position.copy(to).add(new T.Vector3(0, 0.6, 0));
      this.scene.add(m, glow, L);
      setTimeout(() => { this.scene.remove(m, glow, L); m.geometry.dispose(); glow.geometry.dispose(); }, 140 + Math.random() * 80);
    }
    ring(at, color, r1, ms) {
      const T = THREE, m = new T.Mesh(new T.TorusGeometry(1, 0.05, 6, 40), new T.MeshBasicMaterial({ color, transparent: true, blending: T.AdditiveBlending })); m.rotation.x = Math.PI / 2; m.position.set(at.x, 0.06, at.z); this.scene.add(m);
      return this.tween(ms || 600, k => { m.scale.setScalar(0.1 + k * r1); m.material.opacity = 1 - k; }).then(() => this.scene.remove(m));
    }
    pile(at, color, h) { const T = THREE, m = new T.Mesh(new T.ConeGeometry(0.28, 1, 12), new T.MeshStandardMaterial({ color, roughness: 1, flatShading: true })); m.position.set(at.x, 0, at.z); m.scale.set(1, 0.01, 1); this.scene.add(m); this.tween(800, k => { m.scale.y = (h || 0.25) * k; m.position.y = (h || 0.25) * k / 2; }); setTimeout(() => this.scene.remove(m), 12000); return m; }
    puppet(r) { root.MONO_CHARS.set(r, 'puppet'); }
    // ===== 諸神黃昏：收錢者用自己的神力處決破產者 =====
    async godKill(killer, victim, kind, S) {
      const T = THREE, E = this.tokens[killer], V = this.tokens[victim]; if (!E || !V) return;
      if (kind === 'fenrir') { await this.feast([killer], victim, S); return; }
      const dist = { zeus: 1.5, thor: 1.7, athena: 2.2, poseidon: 1.8, ra: 1.7, medusa: 1.5, hero: 0.75, crush: 0.6 }[kind] || 1.2;
      const { home, d, vp } = await this.approach(killer, victim, dist);
      const head = vp.clone().add(new T.Vector3(0, 0.55, 0)), Er = E.r, Vr = V.r;
      const armsUp = (k) => Er.arms.forEach(a => { a.rotation.x = -2.8 * k; });
      if (kind === 'zeus') { // 天降雷霆：烏雲聚集，連劈三道，燒成焦炭化成灰
        this.puppet(Er); S('roar'); await this.tween(400, armsUp);
        const cloud = new T.Group(); cloud.position.set(vp.x, 2.6, vp.z); this.scene.add(cloud);
        for (let k = 0; k < 9; k++) { const c = new T.Mesh(new T.SphereGeometry(0.5 + Math.random() * 0.4, 10, 8), new T.MeshStandardMaterial({ color: '#3a3f4a', roughness: 1, transparent: true, opacity: 0.92 })); c.position.set((Math.random() - 0.5) * 1.8, Math.random() * 0.3, (Math.random() - 0.5) * 1.8); cloud.add(c); }
        await this.tween(600, k => cloud.scale.setScalar(0.1 + k * 0.9));
        for (let i = 0; i < 3; i++) { S('thunder'); this.bolt(new T.Vector3(vp.x + (Math.random() - 0.5), 2.5, vp.z + (Math.random() - 0.5)), head, '#ffffff', 0.05); this.burst(head, { n: 18, colors: ['#ffffff', '#9fd0ff'], speed: 2, up: 1, size: 0.03, life: 0.4, add: true }); this.ring(vp, '#bfe0ff', 1.6, 400); if (i === 1) this.recolor(Vr, new T.MeshStandardMaterial({ color: '#1b1612', roughness: 1 })); await this.sleepS(300); }
        root.MONO_CHARS.set(Vr, 'fall'); this.burst(head, { n: 22, colors: ['#7a7a80', '#9a9aa0', '#5a5a60'], speed: 0.25, up: 0.7, upRand: 0.5, g: -0.3, size: 0.06, grow: 1.6, life: 1.8 });
        await this.sleepS(700); this.pile(vp, '#2a2622'); await this.tween(600, k => Vr.g.scale.setScalar(1.15 * (1 - k)));
        await this.tween(500, k => cloud.children.forEach(c => c.material.opacity = 0.92 * (1 - k))); this.scene.remove(cloud);
      } else if (kind === 'thor') { // 雷神之鎚：高高躍起，巨鎚從天砸下，電弧四竄，壓成扁平
        this.puppet(Er); const e0 = Er.g.position.clone();
        await this.tween(400, k => { Er.g.position.y = Math.sin(k * Math.PI / 2) * 2.2; armsUp(k); });
        const hm = new T.Group(); const metal = new T.MeshStandardMaterial({ color: '#9aa1a8', metalness: 0.95, roughness: 0.25 });
        const hh = new T.Mesh(new T.BoxGeometry(0.9, 0.55, 0.55), metal); hh.position.y = 0.3; hm.add(hh);
        const hd = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1.1, 8), new T.MeshStandardMaterial({ color: '#5a3d22' })); hd.position.y = 1.1; hm.add(hd);
        for (let k = 0; k < 3; k++) { const rn = new T.Mesh(new T.BoxGeometry(0.08, 0.3, 0.01), new T.MeshBasicMaterial({ color: '#7fd0ff' })); rn.position.set(-0.25 + k * 0.25, 0.3, 0.28); hm.add(rn); }
        hm.position.set(vp.x, 6, vp.z); this.scene.add(hm); S('growl');
        await this.tween(450, k => { hm.position.y = 6 * (1 - k * k); hm.rotation.y = k * 3; });
        S('thunder'); S('snap'); this.ring(vp, '#9fd0ff', 3, 700); this.ring(vp, '#ffffff', 2, 500);
        Vr.g.scale.set(1.5, 0.08, 1.5); this.gore(vp.clone().add(new T.Vector3(0, 0.15, 0)), S, 50, 0.7);
        for (let i = 0; i < 6; i++) { setTimeout(() => this.bolt(new T.Vector3(vp.x, 0.4, vp.z), new T.Vector3(vp.x + (Math.random() - 0.5) * 3, 0.05, vp.z + (Math.random() - 0.5) * 3), '#cfe8ff', 0.02), i * 90); }
        const c0 = this.goal.target.clone(); await this.tween(450, k => { const a = (1 - k) * 0.18; this.goal.target.set(c0.x + (Math.random() - 0.5) * a, 0, c0.z + (Math.random() - 0.5) * a); }); this.goal.target.copy(c0);
        await this.tween(400, k => { Er.g.position.y = 2.2 * (1 - k); }); Er.g.position.copy(e0);
        await this.sleepS(500); await this.tween(500, k => { hm.position.y = k * 8; }); this.scene.remove(hm);
      } else if (kind === 'athena') { // 長矛貫穿，再用盾牌把人撞飛
        this.puppet(Er); await this.tween(300, k => { Er.arms[1].rotation.x = -2.6 * k; Er.body.rotation.y = -0.4 * k; });
        const spear = new T.Group(); const sh = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 1.3, 6), new T.MeshStandardMaterial({ color: '#7a5a34' })); sh.rotation.x = Math.PI / 2; spear.add(sh);
        const tip = new T.Mesh(new T.ConeGeometry(0.05, 0.22, 6), new T.MeshStandardMaterial({ color: '#d8dde2', metalness: 0.9, roughness: 0.2 })); tip.rotation.x = Math.PI / 2; tip.position.z = 0.75; spear.add(tip);
        const from = Er.g.position.clone().add(new T.Vector3(0, 1.1, 0)); spear.position.copy(from); spear.lookAt(head); this.scene.add(spear); S('hiss');
        await this.tween(260, k => { spear.position.lerpVectors(from, head.clone().sub(d.clone().multiplyScalar(0.3)), k); Er.body.rotation.y = -0.4 + k * 0.8; });
        S('snap'); this.gore(head, S, 40, 0.6, true); Vr.g.attach(spear); await this.tween(250, k => { Vr.g.position.addScaledVector(d, 0.01); Vr.body.rotation.x = -0.3 * k; });
        await this.sleepS(350);
        const shield = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.06, 24), new T.MeshStandardMaterial({ color: '#c9a227', metalness: 0.9, roughness: 0.3 })); shield.rotation.x = Math.PI / 2;
        const sp0 = Er.g.position.clone().add(new T.Vector3(0, 0.7, 0)); shield.position.copy(sp0); this.scene.add(shield); S('roar');
        await this.tween(300, k => { shield.position.lerpVectors(sp0, head, k); shield.rotation.z += 0.6; });
        S('snap'); this.burst(head, { n: 20, colors: ['#ffe9a0', '#ffffff'], speed: 2.5, size: 0.04, life: 0.4, add: true });
        const v0 = d.clone().multiplyScalar(4.5); v0.y = 4.2; const p0 = Vr.g.position.clone(); const tt = 1.0;
        await this.tween(tt * 1000, k => { const t = k * tt; Vr.g.position.set(p0.x + v0.x * t, Math.max(0, p0.y + v0.y * t - 4.9 * t * t), p0.z + v0.z * t); Vr.g.rotation.x += 0.35; shield.position.lerpVectors(head, sp0, k); });
        this.gore(Vr.g.position.clone().add(new T.Vector3(0, 0.1, 0)), S, 40, 0.6); this.scene.remove(shield);
      } else if (kind === 'poseidon') { // 舉起三叉戟，召喚水龍捲把人捲上天，再被巨浪拍碎
        this.puppet(Er); S('growl'); await this.tween(400, armsUp);
        const vortex = new T.Group(); vortex.position.set(vp.x, 0, vp.z); this.scene.add(vortex);
        const wm = (o) => new T.MeshStandardMaterial({ color: '#3fa7d6', emissive: '#0a4a7a', emissiveIntensity: 0.4, transparent: true, opacity: o, roughness: 0.1, side: T.DoubleSide, depthWrite: false });
        for (let k = 0; k < 4; k++) { const c = new T.Mesh(new T.CylinderGeometry(0.5 + k * 0.18, 0.12 + k * 0.08, 3.2, 20, 1, true), wm(0.32 - k * 0.05)); c.position.y = 1.6; vortex.add(c); }
        vortex.scale.set(1, 0.01, 1);
        await this.tween(500, k => vortex.scale.y = k);
        S('hiss'); const sp = (t, dt) => { vortex.children.forEach((c, i) => c.rotation.y += dt * (6 + i * 2)); }; this.upd.push(sp);
        this.burst(vp, { n: 40, colors: ['#bfe9ff', '#ffffff', '#3fa7d6'], speed: 1.6, up: 2, upRand: 2, size: 0.05, life: 1.4 });
        const p0 = Vr.g.position.clone();
        await this.tween(1300, k => { Vr.g.position.set(p0.x + Math.cos(k * 18) * 0.35 * k, k * 2.8, p0.z + Math.sin(k * 18) * 0.35 * k); Vr.g.rotation.y += 0.5; });
        S('splat'); S('thunder'); this.burst(Vr.g.position.clone(), { n: 70, colors: ['#bfe9ff', '#ffffff', '#3fa7d6', '#8a0018'], speed: 3, up: 1, size: 0.07, life: 1.3 });
        Vr.g.visible = false; this.ring(vp, '#bfe9ff', 3.2, 800);
        await this.tween(500, k => vortex.scale.set(1 + k, 1 - k, 1 + k)); const i = this.upd.indexOf(sp); if (i >= 0) this.upd.splice(i, 1); this.scene.remove(vortex);
      } else if (kind === 'ra') { // 太陽聚焦光柱：燒成通紅、化成灰隨風飄散
        this.puppet(Er); await this.tween(400, armsUp); S('hiss');
        const beam = new T.Mesh(new T.CylinderGeometry(0.35, 0.5, 8, 20, 1, true), new T.MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0.55, blending: T.AdditiveBlending, side: T.DoubleSide, depthWrite: false }));
        beam.position.set(vp.x, 4, vp.z); this.scene.add(beam); const L = new T.PointLight('#ffb84a', 30, 6, 1.4); L.position.set(vp.x, 1.2, vp.z); this.scene.add(L);
        const fireM = new T.MeshStandardMaterial({ color: '#ff7a1a', emissive: '#ff4a00', emissiveIntensity: 0, roughness: 0.6 });
        this.recolor(Vr, fireM); let lastB = 0;
        await this.tween(1600, k => { beam.scale.set(1 - k * 0.5, 1, 1 - k * 0.5); fireM.emissiveIntensity = k * 3; const now = performance.now(); if (now - lastB > 120) { lastB = now; this.burst(head, { n: 8, colors: ['#ffcc33', '#ff6a00', '#ff2a00'], speed: 0.4, up: 1.4, g: -1, size: 0.07, life: 0.8, add: true, grow: 0.5 }); } });
        S('thunder'); fireM.color.set('#1a1410'); fireM.emissiveIntensity = 0.4; root.MONO_CHARS.set(Vr, 'fall');
        await this.sleepS(400);
        this.burst(head, { n: 70, colors: ['#3a3430', '#5a5048', '#1a1612'], speed: 0.3, up: 0.6, g: -0.2, size: 0.04, life: 2.2, wind: new T.Vector3(1.4, 0, 0.6) });
        await this.tween(700, k => Vr.g.scale.setScalar(1.15 * (1 - k))); this.pile(vp, '#3a3430', 0.12);
        await this.tween(400, k => beam.material.opacity = 0.55 * (1 - k)); this.scene.remove(beam, L);
      } else if (kind === 'medusa') { // 蛇眼發光，凝視之下化為石像，再碎裂崩塌
        this.puppet(Er); S('hiss');
        const eyeP = Er.g.position.clone().add(new T.Vector3(0, 1.15, 0));
        const gaze = []; for (const sd of [-1, 1]) { const off = new T.Vector3(-d.z, 0, d.x).multiplyScalar(sd * 0.05); const m = new T.Mesh(new T.CylinderGeometry(0.012, 0.03, 1, 6), new T.MeshBasicMaterial({ color: '#c8ff6a', transparent: true, opacity: 0.85, blending: T.AdditiveBlending })); this.scene.add(m); gaze.push([m, off]); }
        const stone = new T.MeshStandardMaterial({ color: '#d8d0bf', roughness: 1, flatShading: true });
        const orig = []; Vr.g.traverse(o => { if (o.isMesh) orig.push([o, o.material.color ? o.material.color.clone() : new T.Color('#888')]); });
        Vr.g.traverse(o => { if (o.isMesh) o.material = o.material.clone(); });
        await this.tween(1500, k => {
          gaze.forEach(([m, off]) => { const a = eyeP.clone().add(off), b = head; m.position.copy(a).lerp(b, 0.5); m.scale.y = a.distanceTo(b); m.lookAt(b); m.rotateX(Math.PI / 2); });
          orig.forEach(([o, c]) => { if (o.material.color) o.material.color.copy(c).lerp(stone.color, k); if (o.material.emissive) o.material.emissiveIntensity = (1 - k) * (o.material.emissiveIntensity || 0); });
          if (k > 0.5) this.puppet(Vr);
        });
        gaze.forEach(([m]) => this.scene.remove(m)); this.recolor(Vr, stone); S('crunch'); await this.sleepS(600);
        S('thunder'); Vr.g.visible = false;
        this.burst(head, { n: 40, colors: ['#d8d0bf', '#b8b0a0', '#9a9284'], speed: 1.4, up: 1.5, size: 0.09, life: 3, box: true });
        this.burst(vp.clone().add(new T.Vector3(0, 0.2, 0)), { n: 20, colors: ['#e8e2d6'], speed: 0.4, up: 0.3, g: -0.2, size: 0.2, grow: 3, life: 1.6 });
        this.pile(vp, '#c8c0b0', 0.18); await this.sleepS(500);
      } else if (kind === 'hero') { // 人類勇者：連續斬擊，最後把人斬成肉塊
        this.puppet(Er);
        for (let i = 0; i < 7; i++) {
          const sl = new T.Mesh(new T.TorusGeometry(0.55, 0.012, 4, 30, Math.PI * 0.9), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: T.AdditiveBlending }));
          sl.position.copy(head); sl.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); this.scene.add(sl);
          Er.arms[1].rotation.x = i % 2 ? -2.6 : -0.4; Er.body.rotation.y = i % 2 ? 0.5 : -0.5; Er.g.position.addScaledVector(d, i % 2 ? 0.05 : -0.05);
          S('snap'); this.gore(head, null, 10, 0.45, true); Vr.body.position.x = (Math.random() - 0.5) * 0.06;
          this.tween(180, k => { sl.material.opacity = 1 - k; sl.scale.setScalar(1 + k * 0.4); }).then(() => this.scene.remove(sl));
          await this.sleepS(130);
        }
        await this.sleepS(300); S('crunch'); Vr.g.visible = false;
        for (let k = 0; k < 6; k++) { const c = this.chunk(0.07 + Math.random() * 0.05); this.scene.add(c); c.position.copy(head).add(new T.Vector3(0, (k - 3) * 0.08, 0)); this.fling(c, new T.Vector3((Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2), null); }
        this.gore(head, S, 80, 0.8); await this.sleepS(600);
      } else { // 自畫角色：跳起來瘋狂重擊，越壓越扁，最後變成肉餅
        const e0 = Er.g.position.clone(), top = vp.clone(); top.y = 0.0;
        for (let i = 0; i < 6; i++) {
          await this.tween(170, k => { Er.g.position.lerpVectors(e0, top, k); Er.g.position.y = Math.sin(k * Math.PI) * 1.6 + (k > 0.5 ? 0.3 : 0); });
          S(i % 2 ? 'crunch' : 'snap'); this.gore(head.clone().setY(0.3), null, 22, 0.6, true);
          Vr.g.scale.set(1.15 * (1 + i * 0.12), Math.max(0.04, 1.15 * Math.pow(0.62, i + 1)), 1.15 * (1 + i * 0.12));
          const c0 = this.goal.target.clone(); this.tween(160, k => { const a = (1 - k) * 0.1; this.goal.target.set(c0.x + (Math.random() - 0.5) * a, 0, c0.z + (Math.random() - 0.5) * a); }).then(() => this.goal.target.copy(c0));
          await this.tween(150, k => { Er.g.position.lerpVectors(top, e0, k); Er.g.position.y = Math.sin(k * Math.PI) * 0.6; });
        }
        Vr.g.visible = false; const pan = new T.Mesh(new T.CylinderGeometry(0.42, 0.45, 0.05, 24), new T.MeshPhysicalMaterial({ color: '#8a1420', roughness: 0.3, clearcoat: 1 })); pan.position.set(vp.x, 0.03, vp.z); this.scene.add(pan);
        const cl = new T.Mesh(new T.CircleGeometry(0.12, 12), new T.MeshStandardMaterial({ color: V.color || '#888' })); cl.rotation.x = -Math.PI / 2; cl.position.set(vp.x + 0.15, 0.06, vp.z - 0.1); this.scene.add(cl);
        this.gore(vp.clone().setY(0.2), S, 60, 0.7); setTimeout(() => this.scene.remove(pan, cl), 12000); await this.sleepS(600);
      }
      if (Er.state === 'puppet') { this.pose(Er, 0); Er.body.rotation.set(0, 0, 0); Er.arms.forEach(a => a.rotation.set(0, 0, 0)); }
      await this.finishKill(killer, victim, home);
    }
    // ===== 諸神黃昏：沒有收錢者 → 路西法從地獄伸手，把破產者拖下去受刑 =====
    async hell(victim, S) {
      const T = THREE, V = this.tokens[victim]; if (!V) return; V.busy = true; const vp = V.r.g.position.clone(); vp.y = 0;
      this.follow(null); this.goal.target.set(vp.x, 0, vp.z); this.goal.dist = 4.2; this.goal.polar = 1.05; this.clampGoal();
      root.MONO_CHARS.set(V.r, 'scared', 20000); S('growl');
      const pit = new T.Group(); pit.position.set(vp.x, 0.025, vp.z); this.scene.add(pit);
      const hole = new T.Mesh(new T.CircleGeometry(0.75, 32), new T.MeshBasicMaterial({ color: '#0a0204' })); hole.rotation.x = -Math.PI / 2; pit.add(hole);
      const lava = new T.Mesh(new T.RingGeometry(0.62, 0.8, 32), new T.MeshBasicMaterial({ color: '#ff5a10', transparent: true, blending: T.AdditiveBlending })); lava.rotation.x = -Math.PI / 2; pit.add(lava);
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; const cr = new T.Mesh(new T.BoxGeometry(0.6 + Math.random() * 0.8, 0.01, 0.03), new T.MeshBasicMaterial({ color: '#ff7a20' })); cr.position.set(Math.cos(a) * 0.9, 0.005, Math.sin(a) * 0.9); cr.rotation.y = -a; pit.add(cr); }
      const L = new T.PointLight('#ff3a10', 25, 6, 1.4); L.position.set(vp.x, 0.6, vp.z); this.scene.add(L);
      pit.scale.setScalar(0.05); S('thunder'); await this.tween(600, k => pit.scale.setScalar(0.05 + k));
      let lastF = 0; const fire = (t) => { const now = performance.now(); if (now - lastF > 90) { lastF = now; this.burst(vp.clone().setY(0.1), { n: 3, colors: ['#ff6a00', '#ff3a00', '#c81e00', '#ffaa33'], speed: 0.4, up: 1.3, g: -1.2, size: 0.06, life: 0.6, add: true, grow: 0.8, spread: 1.1, spreadY: 0.05 }); } L.intensity = 20 + Math.sin(t * 20) * 6; };
      this.upd.push(fire);
      // 巨大的惡魔之手從地底伸出
      const red = new T.MeshPhysicalMaterial({ color: '#5a0a0c', roughness: 0.35, clearcoat: 0.6 }), claw = new T.MeshStandardMaterial({ color: '#1a1012', roughness: 0.3 });
      const hand = new T.Group(); hand.position.set(vp.x, -2.2, vp.z); this.scene.add(hand);
      const arm = new T.Mesh(new T.CylinderGeometry(0.28, 0.36, 2.2, 12), red); arm.position.y = -0.9; hand.add(arm);
      const palm = new T.Mesh(new T.SphereGeometry(0.42, 14, 10), red); palm.scale.set(1, 0.7, 0.6); palm.position.y = 0.35; hand.add(palm);
      const fingers = []; for (let k = 0; k < 5; k++) { const a = (k / 4 - 0.5) * 2.2; const f = new T.Group(); f.position.set(Math.sin(a) * 0.36, 0.55, Math.cos(a) * 0.18 - 0.05); f.rotation.y = a; hand.add(f);
        const s1 = new T.Mesh(new T.CapsuleGeometry(0.07, 0.42, 4, 8), red); s1.position.y = 0.25; f.add(s1); const c = new T.Mesh(new T.ConeGeometry(0.05, 0.22, 6), claw); c.position.y = 0.6; f.add(c); f.rotation.x = -0.2; fingers.push(f); }
      S('roar'); await this.tween(700, k => { hand.position.y = -2.2 + k * 2.2; });
      // 握住，往下拖
      S('snap'); await this.tween(260, k => fingers.forEach(f => f.rotation.x = -0.2 + k * 1.3));
      hand.attach(V.r.g); S('growl');
      // 後方浮現路西法的身影：巨角與燃燒的雙眼
      const lu = new T.Group(); lu.position.set(vp.x, 0.5, vp.z - 2.4); this.scene.add(lu);
      const sil = new T.Mesh(new T.SphereGeometry(1.2, 16, 12), new T.MeshBasicMaterial({ color: '#120204', transparent: true, opacity: 0 })); sil.scale.set(1, 1.3, 0.4); sil.position.y = 1.2; lu.add(sil);
      const hornM = new T.MeshBasicMaterial({ color: '#1a0406', transparent: true, opacity: 0 }); [-1, 1].forEach(sd => { const h = new T.Mesh(new T.ConeGeometry(0.22, 1.2, 8), hornM); h.position.set(sd * 0.6, 2.6, 0); h.rotation.z = -sd * 0.5; lu.add(h); });
      const eyeM = new T.MeshBasicMaterial({ color: '#ffdd33', transparent: true, opacity: 0 }); [-1, 1].forEach(sd => { const e = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), eyeM); e.scale.set(1.6, 0.5, 0.5); e.position.set(sd * 0.3, 1.7, 0.45); lu.add(e); });
      await this.tween(700, k => { sil.material.opacity = 0.85 * k; hornM.opacity = k; eyeM.opacity = k; hand.rotation.z = Math.sin(k * 20) * 0.05; });
      S('thunder'); await this.tween(900, k => { hand.position.y = -k * k * 3.2; });
      V.r.g.visible = false; V.eaten = true; this.scene.attach(V.r.g);
      this.burst(vp.clone().setY(0.2), { n: 30, colors: ['#ff6a00', '#ff2200', '#ffaa33'], speed: 1.2, up: 2.2, g: -0.5, size: 0.08, life: 0.9, add: true, grow: 1.2 });
      await this.tween(600, k => { sil.material.opacity = 0.85 * (1 - k); hornM.opacity = eyeM.opacity = 1 - k; pit.scale.setScalar(1 - k * 0.95); });
      const i = this.upd.indexOf(fire); if (i >= 0) this.upd.splice(i, 1); this.scene.remove(pit, hand, lu, L);
      const scar = new T.Mesh(new T.CircleGeometry(0.5, 20), new T.MeshBasicMaterial({ color: '#1a0a06', transparent: true, opacity: 0.8 })); scar.rotation.x = -Math.PI / 2; scar.position.set(vp.x, 0.02, vp.z); this.scene.add(scar); setTimeout(() => this.scene.remove(scar), 12000);
      await this.sleepS(400);
    }
    // ===== 夜城：收錢者拿出光束槍，把破產者分解成光粒子 =====
    async beamKill(killer, victim, S) {
      const T = THREE, E = this.tokens[killer], V = this.tokens[victim]; if (!E || !V) return;
      const { home, d, vp } = await this.approach(killer, victim, 1.9); const Er = E.r, Vr = V.r, head = vp.clone().add(new T.Vector3(0, 0.55, 0));
      const col = new T.Color(E.color || '#00e5ff');
      const gun = new T.Group(); const body = new T.Mesh(new T.BoxGeometry(0.08, 0.1, 0.36), new T.MeshStandardMaterial({ color: '#1c1c26', metalness: 0.8, roughness: 0.25 })); gun.add(body);
      const barrel = new T.Mesh(new T.CylinderGeometry(0.025, 0.03, 0.26, 10), new T.MeshStandardMaterial({ color: '#2c2c38', metalness: 0.9, roughness: 0.2 })); barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.28; gun.add(barrel);
      for (let k = 0; k < 3; k++) { const c = new T.Mesh(new T.TorusGeometry(0.04, 0.008, 6, 14), new T.MeshBasicMaterial({ color: col })); c.position.z = 0.12 + k * 0.07; gun.add(c); }
      const grip = new T.Mesh(new T.BoxGeometry(0.06, 0.14, 0.06), body.material); grip.position.set(0, -0.1, -0.08); grip.rotation.x = 0.3; gun.add(grip);
      if (Er.handR && Er.kind === 'biped') { Er.handR.add(gun); gun.position.set(0, -0.04, 0.12); this.puppet(Er); Er.arms[1].rotation.x = -1.55; } else { Er.body.add(gun); gun.position.set(0, 0.75, 0.3); this.puppet(Er); }
      S('growl'); await this.sleepS(300);
      // 充能
      const muz = new T.Mesh(new T.SphereGeometry(0.06, 10, 8), new T.MeshBasicMaterial({ color: col, transparent: true, blending: T.AdditiveBlending })); gun.add(muz); muz.position.z = 0.44;
      S('charge'); await this.tween(900, k => { muz.scale.setScalar(0.3 + k * 2.2 + Math.sin(k * 60) * 0.2); });
      const muzW = () => { const w = new T.Vector3(); muz.getWorldPosition(w); return w; };
      for (let i = 0; i < 3; i++) {
        S('laser'); const a = muzW(); const L = a.distanceTo(head);
        const beam = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, L, 8), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: T.AdditiveBlending }));
        const glow = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, L, 10), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false }));
        [beam, glow].forEach(b => { b.position.copy(a).lerp(head, 0.5); b.lookAt(head); b.rotateX(Math.PI / 2); this.scene.add(b); });
        this.burst(head, { n: 22, colors: ['#ffffff', '#' + col.getHexString()], speed: 2.2, size: 0.03, life: 0.4, add: true });
        Vr.body.position.addScaledVector(d, 0.04);
        await this.tween(170, k => { beam.material.opacity = glow.material.opacity = 1 - k; beam.scale.x = beam.scale.z = 1 - k; }); this.scene.remove(beam, glow);
        await this.sleepS(120);
      }
      // 分解：身體發光、閃爍，碎成方塊光粒往上飄散
      const dis = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 1, blending: T.AdditiveBlending });
      this.recolor(Vr, dis); S('disint');
      await this.tween(700, k => { dis.opacity = 0.5 + Math.random() * 0.5; Vr.g.position.x += (Math.random() - 0.5) * 0.02; });
      Vr.g.visible = false;
      this.burst(head, { n: 90, colors: ['#' + col.getHexString(), '#ffffff', '#ff3d7f'], speed: 0.6, up: 0.8, g: -1.2, size: 0.035, life: 1.8, box: true, add: true, spread: 0.5, spreadY: 1.1 });
      await this.sleepS(800);
      gun.parent && gun.parent.remove(gun); if (Er.state === 'puppet') { Er.arms.forEach(a => a.rotation.set(0, 0, 0)); }
      await this.finishKill(killer, victim, home);
    }
    // ===== 夜城：沒有收錢者 → 義體失控發狂，鎮暴部隊空降擊斃 =====
    async psychoKill(victim, S) {
      const T = THREE, V = this.tokens[victim]; if (!V) return; V.busy = true; const vp = V.r.g.position.clone(); vp.y = 0; const head = vp.clone().add(new T.Vector3(0, 0.6, 0));
      this.follow(null); this.goal.target.set(vp.x, 0, vp.z); this.goal.dist = 4.6; this.goal.polar = 1.08; this.clampGoal();
      const Vr = V.r; root.MONO_CHARS.set(Vr, 'scared', 20000); S('glitch');
      const red = new T.MeshBasicMaterial({ color: '#ff1a3a' }); let lastS = 0, lastG = 0;
      const p0 = Vr.g.position.clone();
      await this.tween(1800, k => { const now = performance.now();
        if (now - lastG > 110) { lastG = now; if (Math.random() < 0.5) this.recolor(Vr, red); else Vr.g.traverse(o => { if (o.userData.mat0) o.material = o.userData.mat0; }); Vr.g.position.set(p0.x + (Math.random() - 0.5) * 0.25, 0, p0.z + (Math.random() - 0.5) * 0.25); Vr.g.rotation.y += (Math.random() - 0.5) * 2; }
        if (now - lastS > 90) { lastS = now; this.burst(head, { n: 6, colors: ['#ffe066', '#ffffff', '#ff8a00'], speed: 2, up: 1.5, size: 0.02, life: 0.35, add: true }); } });
      S('roar'); Vr.g.traverse(o => { if (o.userData.mat0) o.material = o.userData.mat0; });
      // 三名鎮暴部隊從天而降
      const squad = []; for (let k = 0; k < 3; k++) { const r = root.MONO_CHARS.make(THREE, 'cyber', 3, '#ff2030', null); r.g.scale.setScalar(1.25); const a = k / 3 * 6.28 + 0.6; r.g.position.set(vp.x + Math.cos(a) * 1.5, 7, vp.z + Math.sin(a) * 1.5); r.g.rotation.y = Math.atan2(vp.x - r.g.position.x, vp.z - r.g.position.z); this.scene.add(r.g);
        const fl = new T.Mesh(new T.ConeGeometry(0.08, 0.5, 8), new T.MeshBasicMaterial({ color: '#7fd0ff', transparent: true, opacity: 0.8, blending: T.AdditiveBlending })); fl.rotation.x = Math.PI; fl.position.y = -0.2; r.g.add(fl); squad.push({ r, fl, a }); }
      S('charge'); const sq = (t, dt) => squad.forEach(q => root.MONO_CHARS.update(q.r, t, dt)); this.upd.push(sq);
      await this.tween(900, k => squad.forEach(q => { q.r.g.position.y = 7 * (1 - k) * (1 - k); q.fl.scale.y = 1 - k * 0.8; }));
      S('snap'); this.ring(vp, '#7fd0ff', 2.5, 500); squad.forEach(q => { q.fl.visible = false; root.MONO_CHARS.set(q.r, 'puppet'); q.r.arms.forEach(a => a.rotation.x = -1.55); });
      await this.sleepS(350);
      for (let i = 0; i < 4; i++) { squad.forEach(q => { const a = q.r.g.position.clone().add(new T.Vector3(0, 0.85, 0)); const L = a.distanceTo(head); const b = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, L, 6), new T.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, blending: T.AdditiveBlending })); b.position.copy(a).lerp(head, 0.5); b.lookAt(head); b.rotateX(Math.PI / 2); this.scene.add(b); setTimeout(() => this.scene.remove(b), 90); }); S('laser'); this.gore(head, null, 14, 0.5, true); this.burst(head, { n: 10, colors: ['#ffe066', '#ffffff'], speed: 2, size: 0.02, life: 0.3, add: true }); await this.sleepS(150); }
      S('thunder'); root.MONO_CHARS.set(Vr, 'fall'); this.gore(head, S, 60, 0.7);
      this.burst(head, { n: 40, colors: ['#ffe066', '#ff8a00', '#ffffff', '#5a5a66'], speed: 2.5, up: 2, size: 0.04, life: 0.9, add: true });
      await this.sleepS(900); Vr.g.visible = false; V.eaten = true;
      squad.forEach(q => { q.fl.visible = true; root.MONO_CHARS.set(q.r, 'idle'); }); S('charge');
      await this.tween(900, k => squad.forEach(q => { q.r.g.position.y = k * k * 8; q.fl.scale.y = 1 + k; }));
      const si = this.upd.indexOf(sq); if (si >= 0) this.upd.splice(si, 1); squad.forEach(q => this.scene.remove(q.r.g));
      await this.sleepS(300);
    }
    // ===== 夜城：完美進化（只有抽到的人），身體變成灰色金屬 =====
    async evolve(seat, S) {
      const T = THREE, V = this.tokens[seat]; if (!V) return;
      this.focusSeat(seat, true); this.goal.dist = 3.4; S('charge');
      const chrome = new T.MeshStandardMaterial({ color: '#9aa0a8', metalness: 1, roughness: 0.22 });
      if (V.r.kind === 'standee') { let lastS = 0; await this.tween(1600, k => { V.r.g.rotation.y = k * Math.PI * 4; const now = performance.now(); if (now - lastS > 140) { lastS = now; this.burst(V.r.g.position.clone().add(new T.Vector3(0, 0.6, 0)), { n: 5, colors: ['#ffffff', '#cfd6dd'], speed: 1.2, size: 0.02, life: 0.3, add: true }); } }); V.r.g.rotation.y = 0; this.metalize(V.r); V.evolved = true; return; }
      const items = []; V.r.g.traverse(o => { if (o.isMesh && !o.userData.tag) { o.material = o.material.clone(); items.push([o, o.material.color ? o.material.color.clone() : null]); } });
      let lastS = 0;
      await this.tween(2200, k => { items.forEach(([o, c]) => { if (c) o.material.color.copy(c).lerp(chrome.color, k); if (o.material.metalness != null) { o.material.metalness = k; o.material.roughness = 0.6 - k * 0.38; } if (o.material.emissiveIntensity) o.material.emissiveIntensity *= 0.97; });
        const now = performance.now(); if (now - lastS > 140) { lastS = now; this.burst(V.r.g.position.clone().add(new T.Vector3(0, 0.6, 0)), { n: 5, colors: ['#ffffff', '#cfd6dd'], speed: 1.2, size: 0.02, life: 0.3, add: true }); } });
      this.metalize(V.r); V.evolved = true;
    }
    // ===== 分食：大家（或債主）圍上去，各自用不同方式吃 =====
    mouth(r) { if (r.head) { const rad = (r.skull && r.skull.geometry.parameters.radius) || 0.13; return [r.head, new THREE.Vector3(0, -0.05, rad * 1.1)]; } return [r.body, new THREE.Vector3(0, 0.6, 0.25)]; }
    wpos(obj, p) { obj.updateWorldMatrix(true, false); return obj.localToWorld(p.clone()); }
    gm() { const T = THREE; return this._gm || (this._gm = { meat: new T.MeshPhysicalMaterial({ color: '#9b1b2a', roughness: 0.3, clearcoat: 0.8, flatShading: true }), dark: new T.MeshStandardMaterial({ color: '#4a0812', roughness: 0.25 }), fat: new T.MeshStandardMaterial({ color: '#f0dcc0', roughness: 0.5 }), bone: new T.MeshStandardMaterial({ color: '#efe6d2', roughness: 0.35 }) }); }
    chunk(sz) {
      const T = THREE, g = new T.Group(), m = this.gm();
      const a = new T.Mesh(new T.DodecahedronGeometry(sz, 0), m.meat); a.scale.set(1.3, 0.8, 1); g.add(a);
      const f = new T.Mesh(new T.SphereGeometry(sz * 0.45, 6, 5), m.fat); f.position.set(sz * 0.5, sz * 0.35, 0); g.add(f);
      const d = new T.Mesh(new T.SphereGeometry(sz * 0.4, 6, 5), m.dark); d.position.set(-sz * 0.4, -sz * 0.2, sz * 0.3); g.add(d);
      if (Math.random() < 0.6) { const b = new T.Mesh(new T.CapsuleGeometry(sz * 0.18, sz * 1.6, 3, 6), m.bone); b.rotation.z = 1.3; b.position.x = sz * 0.6; g.add(b); }
      g.traverse(o => { if (o.isMesh) o.castShadow = this.q.high; }); return g;
    }
    carcass(at, color) {
      const T = THREE, g = new T.Group(), m = this.gm(), meat = []; g.position.set(at.x, 0, at.z); this.scene.add(g);
      const torso = new T.Mesh(new T.SphereGeometry(0.26, 12, 9), m.meat); torso.scale.set(1.4, 0.55, 0.85); torso.position.y = 0.13; g.add(torso); meat.push(torso);
      for (let k = 0; k < 6; k++) { const rb = new T.Mesh(new T.TorusGeometry(0.15, 0.014, 5, 12, Math.PI), m.bone); rb.position.set(-0.2 + k * 0.08, 0.14, 0); rb.rotation.y = Math.PI / 2; g.add(rb); }
      const spine = new T.Mesh(new T.CapsuleGeometry(0.02, 0.55, 3, 6), m.bone); spine.rotation.z = Math.PI / 2; spine.position.y = 0.06; g.add(spine);
      const skull = new T.Mesh(new T.SphereGeometry(0.09, 10, 8), m.bone); skull.position.set(0.38, 0.09, 0); g.add(skull);
      [-1, 1].forEach(sd => { const so = new T.Mesh(new T.SphereGeometry(0.022, 6, 5), m.dark); so.position.set(0.44, 0.11, sd * 0.035); g.add(so); });
      for (let k = 0; k < 7; k++) { const c = this.chunk(0.05 + Math.random() * 0.05); c.position.set((Math.random() - 0.5) * 0.7, 0.05, (Math.random() - 0.5) * 0.5); c.rotation.set(Math.random() * 3, Math.random() * 3, 0); g.add(c); meat.push(c); }
      const cloth = new T.Mesh(new T.PlaneGeometry(0.22, 0.14), new T.MeshStandardMaterial({ color: color || '#888', side: T.DoubleSide, roughness: 0.8 })); cloth.rotation.set(-Math.PI / 2, 0, 0.6); cloth.position.set(-0.32, 0.02, 0.22); g.add(cloth);
      g.traverse(o => { if (o.isMesh) o.castShadow = this.q.high; });
      return { g, meat, torso };
    }
    // 投擲物：帶血滴軌跡，落地變一灘
    fling(obj, vel, S) {
      const T = THREE; let last = 0;
      return new Promise(res => { const step = (t, dt) => {
        vel.y -= 9.8 * dt; obj.position.addScaledVector(vel, dt); obj.rotation.x += dt * 9; obj.rotation.z += dt * 6;
        const now = performance.now(); if (now - last > 70) { last = now; this.gore(obj.position.clone(), null, 3, 0.25, true); }
        if (obj.position.y <= 0.05) { obj.position.y = 0.05; const i = this.upd.indexOf(step); if (i >= 0) this.upd.splice(i, 1); this.gore(obj.position.clone(), S, 16, 0.5); S && S('splat'); res(); }
      }; this.upd.push(step); });
    }
    pose(r, k) { // 0＝站好，1＝低頭彎腰去咬
      if (r.kind === 'float') { r.body.position.y = 0.15 - k * 0.3; if (r.head) r.head.rotation.x = k * 0.5; return; }
      if (r.kind === 'standee') { r.body.rotation.x = k * 0.7; return; }
      const biped = r.kind === 'biped';
      r.body.rotation.x = k * (biped ? 0.65 : 0.32); if (r.head) r.head.rotation.x = k * (biped ? 0.35 : 0.55);
      if (biped) r.arms.forEach(a => { a.rotation.x = -k * 1.1; a.rotation.z = 0; });
    }
    async bite(E, S, at) {
      const r = E.r;
      await this.tween(240, k => this.pose(r, 0.2 + k * 0.8));
      const [mo, mp] = this.mouth(r); const w = at || this.wpos(mo, mp); this.gore(w, null, 10, 0.45, true); S('crunch');
      await this.tween(140, k => { r.body.position.y = -Math.sin(k * Math.PI) * 0.03; });
      await this.tween(220, k => this.pose(r, 1 - k * 0.8));
    }
    async bhGnaw(E, S, F) { for (let i = 0; i < 4; i++) { await this.bite(E, S); if (F.torso) F.torso.scale.multiplyScalar(0.97); } }
    async bhHowlTear(E, S, F) {
      const T = THREE, r = E.r; await this.bite(E, S);
      const [mo, mp] = this.mouth(r);
      if (r.kind === 'biped' && r.handL && r.handR) {
        // 雙手捧起一大塊肉，抬頭嚎叫，再用力往兩邊掰開，爆血
        const a = this.chunk(0.08), b = this.chunk(0.08); r.handL.add(a); r.handR.add(b); a.position.set(0.05, -0.04, 0.03); b.position.set(-0.05, -0.04, 0.03);
        await this.tween(350, k => { this.pose(r, 1 - k); r.arms.forEach((ar, i) => { ar.rotation.x = -1.2 - k * 0.3; ar.rotation.z = (i ? -1 : 1) * 0.35 * k; }); });
        S('roar');
        await this.tween(900, k => { r.head.rotation.x = -0.9 * Math.sin(Math.min(1, k * 1.6) * Math.PI / 2); r.body.rotation.x = -0.18 * k; r.arms.forEach((ar, i) => { ar.rotation.x = -1.5 - k * 1.0; }); r.body.position.y = Math.sin(k * 30) * 0.01; });
        // 掰開
        S('splat'); const mid = this.wpos(r.handL, new T.Vector3(0, 0, 0)).lerp(this.wpos(r.handR, new T.Vector3(0, 0, 0)), 0.5);
        this.gore(mid, S, 45, 0.8, true);
        await this.tween(220, k => r.arms.forEach((ar, i) => { ar.rotation.z = (i ? -1 : 1) * (0.35 - k * 1.25); }));
        await this.tween(500, k => { r.head.rotation.x = -0.9 * (1 - k); });
        // 一手送進嘴裡啃
        for (let i = 0; i < 2; i++) { await this.tween(260, k => { r.arms[1].rotation.x = -2.5 + k * 0.6; r.arms[1].rotation.z = -0.9 + k * 0.9; r.head.rotation.x = k * 0.3; }); S('crunch'); this.gore(this.wpos(mo, mp), null, 8, 0.4, true); b.scale.multiplyScalar(0.7); await this.tween(200, k => { r.arms[1].rotation.x = -1.9 - k * 0.6; }); }
        [a, b].forEach(c => { this.scene.attach(c); this.fling(c, new T.Vector3((Math.random() - 0.5) * 0.5, 0.2, (Math.random() - 0.5) * 0.5), null); });
      } else {
        // 四腳或無手：用前腳壓住、咬住一塊往後猛扯，扯斷爆血，再抬頭嚎叫
        const c = this.chunk(0.09); mo.add(c); c.position.copy(mp);
        await this.tween(260, k => { r.legs.slice(0, 2).forEach(l => l.rotation.x = -0.5 * k); });
        await this.tween(500, k => { const e = Math.sin(k * Math.PI * 3) * 0.1; this.pose(r, 1 - k * 0.6); if (r.head) r.head.rotation.x += e; });
        await this.tween(150, k => { this.pose(r, 0.4 - k * 0.9); });
        S('splat'); this.gore(this.wpos(mo, mp), S, 40, 0.75, true);
        const half = this.chunk(0.06); this.scene.add(half); half.position.copy(this.wpos(mo, mp)); this.fling(half, new T.Vector3(0, -0.5, 0), null);
        S('roar');
        await this.tween(950, k => { if (r.head) r.head.rotation.x = -0.9 * Math.sin(Math.min(1, k * 1.6) * Math.PI / 2); r.body.rotation.x = -0.15 * k; });
        await this.tween(300, k => { if (r.head) r.head.rotation.x = -0.9 * (1 - k); r.legs.slice(0, 2).forEach(l => l.rotation.x = -0.5 * (1 - k)); r.body.rotation.x = -0.15 * (1 - k); });
        this.scene.attach(c); this.fling(c, new T.Vector3(0, 0, 0), null);
      }
      await this.bite(E, S);
    }
    async bhFlingShake(E, S, F) {
      const T = THREE, r = E.r; await this.bite(E, S);
      const [mo, mp] = this.mouth(r); const c = this.chunk(0.085); mo.add(c); c.position.copy(mp);
      await this.tween(250, k => this.pose(r, 1 - k * 1.1));
      // 甩頭：左右猛甩，體液四濺
      let last = 0; const tgt = r.head || r.body; S('growl');
      await this.tween(850, k => { tgt.rotation.y = Math.sin(k * 42) * 0.7; r.body.rotation.y = Math.sin(k * 42) * 0.12; const now = performance.now(); if (now - last > 110) { last = now; this.gore(this.wpos(mo, mp), null, 6, 0.45, true); } });
      tgt.rotation.y = 0; r.body.rotation.y = 0;
      // 甩飛出去
      const side = Math.random() < 0.5 ? -1 : 1, yaw = E.r.g.rotation.y + side * 1.4;
      this.scene.attach(c); S('hiss');
      await this.tween(160, k => { tgt.rotation.y = side * 0.8 * k; });
      this.fling(c, new T.Vector3(Math.sin(yaw) * 2.6, 2.6, Math.cos(yaw) * 2.6), S);
      await this.tween(250, k => { tgt.rotation.y = side * 0.8 * (1 - k); });
      await this.bite(E, S);
    }
    async bhDrag(E, S, F, C) {
      const T = THREE, r = E.r; await this.bite(E, S);
      const [mo, mp] = this.mouth(r); const c = this.chunk(0.1); mo.add(c); c.position.copy(mp);
      // 咬著肉往後拖到旁邊
      const p0 = r.g.position.clone(), out = p0.clone().sub(C); out.y = 0; out.normalize(); const p1 = p0.clone().addScaledVector(out, 0.95);
      S('growl');
      await this.tween(1200, k => { this.pose(r, 0.5); r.g.position.lerpVectors(p0, p1, k); r.legs.forEach((l, i) => l.rotation.x = Math.sin(k * 26 + i * Math.PI) * 0.5); if (r.kind === 'biped') r.arms.forEach(a => a.rotation.x = -0.9); });
      // 轉身背對大家，自己吃
      const y0 = r.g.rotation.y; await this.tween(380, k => { r.g.rotation.y = y0 + Math.PI * k; r.legs.forEach(l => l.rotation.x *= 0.8); });
      this.scene.attach(c); c.position.set(c.position.x, 0.06, c.position.z);
      const fw = new T.Vector3(Math.sin(r.g.rotation.y), 0, Math.cos(r.g.rotation.y)); c.position.copy(r.g.position).addScaledVector(fw, 0.32); c.position.y = 0.06;
      for (let i = 0; i < 4; i++) { await this.bite(E, S, c.position.clone().add(new T.Vector3(0, 0.05, 0))); c.scale.multiplyScalar(0.78); }
      this.scene.remove(c);
      await this.tween(380, k => { r.g.rotation.y = y0 + Math.PI * (1 - k); });
      await this.tween(500, k => r.g.position.lerpVectors(p1, p0, k));
    }
    async feast(eaters, victim, sfx) {
      const T = THREE, V = this.tokens[victim]; if (!V) return;
      const S = (k) => sfx && sfx(k), wait = (ms) => new Promise(r => setTimeout(r, ms * (root.__monoSlow || 1)));
      eaters = eaters.filter(s => s !== victim && this.tokens[s]); if (!eaters.length) return;
      const N = this.R.N; V.busy = true; root.MONO_CHARS.set(V.r, 'scared', 20000);
      const C = V.r.g.position.clone(); C.y = 0;
      this.follow(null); this.goal.target.set(C.x, 0, C.z); this.goal.dist = 6.5; this.goal.polar = 1.0; this.clampGoal();
      S('growl');
      const homes = {};
      // 1. 大家從各自的位置走過來（同時出發）
      await Promise.all(eaters.map((s, k) => (async () => {
        const E = this.tokens[s]; homes[s] = E.pos; E.busy = true; await wait(k * 160);
        const fw = (V.pos - E.pos + N) % N, bw = (E.pos - V.pos + N) % N, dir = fw <= bw ? 1 : -1, n = Math.min(fw, bw);
        const path = []; for (let i = 1; i <= n; i++) path.push((E.pos + dir * i + N) % N);
        if (path.length) await this.hop(s, path, false, Math.max(80, Math.min(170, 1600 / path.length)));
      })()));
      root.MONO_CHARS.set(V.r, 'fall'); S('hiss'); await wait(500);
      // 2. 圍成一圈
      const n = eaters.length, base = Math.random() * 6.28;
      await Promise.all(eaters.map((s, k) => { const E = this.tokens[s]; const a = base + k / Math.max(n, 2) * Math.PI * 2, rr = 0.62 + (E.r.kind === 'quad' ? 0.22 : 0);
        const p0 = E.r.g.position.clone(), p1 = new T.Vector3(C.x + Math.cos(a) * rr, 0.005, C.z + Math.sin(a) * rr), yaw = Math.atan2(C.x - p1.x, C.z - p1.z);
        root.MONO_CHARS.set(E.r, 'walk');
        return this.tween(450, k2 => { E.r.g.position.lerpVectors(p0, p1, k2); E.r.g.rotation.y += (yaw - E.r.g.rotation.y) * 0.25; }).then(() => { E.r.g.rotation.y = yaw; root.MONO_CHARS.set(E.r, 'puppet'); this.pose(E.r, 0); }); }));
      // 3. 撲上去：獵物變成一具屍骸
      V.r.g.visible = false; V.eaten = true; S('snap'); S('crunch');
      const F = this.carcass(C, V.color); this.gore(C.clone().add(new T.Vector3(0, 0.3, 0)), S, 80, 0.85);
      const orbit = (t, dt) => { this.goal.azim += dt * 0.32; }; this.upd.push(orbit);
      this.goal.dist = n > 1 ? 5.4 : 4.4; this.goal.polar = n > 1 ? 0.9 : 1.02;
      // 4. 各吃各的：有人嚎叫撕開、有人甩頭甩飛、有人叼去旁邊、有人埋頭猛啃
      const acts = U_shuffle(['howl', 'fling', 'drag', 'gnaw']);
      await Promise.all(eaters.map((s, k) => (async () => {
        const E = this.tokens[s]; await wait(k * 280);
        const seq = n === 1 ? ['howl', 'fling', 'gnaw'] : [acts[k % 4], 'gnaw'];
        for (const a of seq) {
          if (a === 'howl') await this.bhHowlTear(E, S, F); else if (a === 'fling') await this.bhFlingShake(E, S, F); else if (a === 'drag') await this.bhDrag(E, S, F, C); else await this.bhGnaw(E, S, F);
        }
      })()));
      // 5. 吃乾淨只剩骨頭，大家回到原位
      F.meat.forEach(m => F.g.remove(m)); this.gore(C.clone().add(new T.Vector3(0, 0.1, 0)), null, 14, 0.4, true);
      const oi = this.upd.indexOf(orbit); if (oi >= 0) this.upd.splice(oi, 1);
      eaters.forEach(s => { const E = this.tokens[s]; this.pose(E.r, 0); E.r.body.rotation.set(0, 0, 0); if (E.r.head) E.r.head.rotation.set(0, 0, 0); root.MONO_CHARS.set(E.r, 'joy', 900); });
      await wait(900);
      await Promise.all(eaters.map(s => { const E = this.tokens[s]; E.busy = false; return this.teleport(s, homes[s], false); }));
      setTimeout(() => { const t0 = performance.now(); F.g.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; } }); const fade = () => { const k = (performance.now() - t0) / 2500; F.g.traverse(o => { if (o.material) o.material.opacity = Math.max(0, 1 - k); }); if (k < 1 && !this.dead) requestAnimationFrame(fade); else this.scene.remove(F.g); }; fade(); }, 9000);
    }
    // 血花：深紅與黑色體液噴濺、骨頭碎片，落地變成一灘一灘，幾秒後慢慢淡掉
    gore(at, S, n, pw, noPool) {
      n = n || 110; pw = pw || 1;
      const T = THREE, parts = [], splats = [];
      const cols = ['#5c0010', '#8a0018', '#b3001b', '#3a0008', '#1a0a12'];
      for (let k = 0; k < n; k++) {
        const m = new T.Mesh(new T.SphereGeometry((0.022 + Math.random() * 0.045) * Math.sqrt(pw), 6, 5), new T.MeshStandardMaterial({ color: cols[k % cols.length], roughness: 0.15, metalness: 0.1 }));
        m.position.copy(at); const a = Math.random() * 6.28, sp = (0.8 + Math.random() * 2.4) * pw;
        m.userData.v = new T.Vector3(Math.cos(a) * sp, (1.2 + Math.random() * 3) * pw, Math.sin(a) * sp); this.scene.add(m); parts.push(m);
      }
      for (let k = 0; k < (pw >= 1 ? 10 : 0); k++) { const m = new T.Mesh(new T.CapsuleGeometry(0.012, 0.05 + Math.random() * 0.06, 3, 5), new T.MeshStandardMaterial({ color: '#efe6d2', roughness: 0.4 })); m.position.copy(at); const a = Math.random() * 6.28; m.userData.v = new T.Vector3(Math.cos(a) * 1.4, 2 + Math.random() * 2, Math.sin(a) * 1.4); m.userData.spin = Math.random() * 10; this.scene.add(m); parts.push(m); }
      // 獵物原地慢慢擴散的一大灘
      if (!noPool) { const pool = new T.Mesh(new T.CircleGeometry(0.5, 28), new T.MeshStandardMaterial({ color: '#4a0010', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.95 }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(at.x, 0.012, at.z); pool.scale.setScalar(0.05); this.scene.add(pool); splats.push(pool);
      const p0 = performance.now(), ps = pw; const grow = () => { const k = Math.min(1, (performance.now() - p0) / 1500); pool.scale.set(0.05 + k * 1.1 * ps, 0.05 + k * 0.9 * ps, 1); if (k < 1 && !this.dead) requestAnimationFrame(grow); }; grow(); }
      let landed = 0;
      const step = (t, dt) => {
        parts.forEach(m => { if (m.userData.done) return; const v = m.userData.v; v.y -= 9.8 * dt; m.position.addScaledVector(v, dt); if (m.userData.spin) m.rotation.z += m.userData.spin * dt;
          if (m.position.y <= 0.03) { m.userData.done = true; m.position.y = 0.03; landed++;
            if (!m.userData.spin) { const sz = 0.07 + Math.random() * 0.2; const sp = new T.Mesh(new T.CircleGeometry(sz, 12), new T.MeshStandardMaterial({ color: m.material.color, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.95 })); sp.rotation.x = -Math.PI / 2; sp.position.set(m.position.x, 0.02 + Math.random() * 0.004, m.position.z); sp.scale.set(1, 1 + Math.random() * 0.8, 1); this.scene.add(sp); splats.push(sp); this.scene.remove(m); }
            if (landed === 12 && pw >= 1) S && S('splat'); } });
      };
      this.upd.push(step);
      setTimeout(() => { const i = this.upd.indexOf(step); if (i >= 0) this.upd.splice(i, 1); parts.forEach(m => this.scene.remove(m));
        const t0 = performance.now(); const fade = () => { const k = (performance.now() - t0) / 3000; splats.forEach(s2 => s2.material.opacity = Math.max(0, 0.95 * (1 - k))); if (k < 1 && !this.dead) requestAnimationFrame(fade); else splats.forEach(s2 => this.scene.remove(s2)); }; fade(); }, 9000);
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
