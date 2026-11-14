// 大富翁 3D 場景（Three.js）
(function (root) {
  let THREE = null;
  async function loadThree() { if (!THREE) THREE = await import(new URL('vendor/three.module.min.js', document.baseURI).href); return THREE; }

  const PAL = {
    ragnarok: { bg: '#e8dcc2', ground: '#d6c7a1', tile: '#fbf6ea', text: '#3b2f1e', luck: '#f2c94c', bad: '#5b3c88', corner: '#c9a227', side: '#cbb98f', fog: [18, 40] },
    cyber: { bg: '#0a0718', ground: '#130e2c', tile: '#1c1640', text: '#e8f6ff', luck: '#00e5ff', bad: '#ff2e88', corner: '#7b2ff7', side: '#2b2360', fog: [16, 38] },
    animal: { bg: '#bfe6ff', ground: '#7cbf5a', tile: '#fff6dc', text: '#3d2b1f', luck: '#ffd166', bad: '#a0522d', corner: '#5a8f3d', side: '#c9a66b', fog: [20, 45] },
    alien: { bg: '#0d0824', ground: '#24164f', tile: '#2c2266', text: '#efe8ff', luck: '#5ef2d0', bad: '#ff4d6d', corner: '#9d4edd', side: '#3c2f80', fog: [16, 40] }
  };
  const ICON = {
    ragnarok: { start: '🏛️', jail: '💀', free: '🍷', gotojail: '⬇️', luck: '🌟', bad: '⚡', tax: '🪙', teleport: '🌈' },
    cyber: { start: '🚉', jail: '🔒', free: '💉', gotojail: '🚨', luck: '💾', bad: '☠️', tax: '💰', teleport: '🚄' },
    animal: { start: '🌅', jail: '🦓', free: '💧', gotojail: '🪤', luck: '🍌', bad: '🔥', tax: '🌧️', teleport: '🌪️' },
    alien: { start: '🛸', jail: '⛓️', free: '🛰️', gotojail: '🚨', luck: '💎', bad: '☄️', tax: '📦', teleport: '🕳️' }
  };
  const U = 1.5; // 格距

  function tileXZ(i) {
    const side = Math.floor(i / 7), k = i % 7, h = 3.5;
    let x, z;
    if (side === 0) { x = h - k; z = h; } else if (side === 1) { x = -h; z = h - k; }
    else if (side === 2) { x = -h + k; z = -h; } else { x = h; z = -h + k; }
    return [x * U, z * U];
  }

  function wrapText(g, text, maxW) {
    const lines = []; let cur = '';
    for (const ch of text) { if (g.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch; }
    if (cur) lines.push(cur); return lines.slice(0, 3);
  }

  class Board3D {
    constructor() { this.tokens = {}; this.bld = {}; this.flags = {}; this.anim = []; this.t0 = performance.now(); }
    async init(el, theme, R) {
      await loadThree();
      this.el = el; this.theme = theme; this.R = R; this.pal = PAL[theme];
      const w = el.clientWidth || 360, h = el.clientHeight || 400;
      const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(w, h);
      r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(r.domElement);
      const sc = this.scene = new THREE.Scene();
      sc.background = new THREE.Color(this.pal.bg); sc.fog = new THREE.Fog(this.pal.bg, this.pal.fog[0], this.pal.fog[1]);
      this.cam = new THREE.PerspectiveCamera(42, w / h, 0.1, 200);
      this.camTarget = new THREE.Vector3(0, 0, 0); this.camLook = new THREE.Vector3(0, 0, 0);
      this.overview(true);
      const night = theme === 'cyber' || theme === 'alien';
      sc.add(new THREE.HemisphereLight(night ? 0x8899ff : 0xffffff, night ? 0x221133 : 0x998866, night ? 0.9 : 1.1));
      const sun = new THREE.DirectionalLight(night ? 0xbfb3ff : 0xfff2d6, night ? 1.2 : 1.6);
      sun.position.set(8, 16, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); sc.add(sun);
      // 地面
      const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshStandardMaterial({ color: this.pal.ground, roughness: 1 }));
      ground.rotation.x = -Math.PI / 2; ground.position.y = -0.36; ground.receiveShadow = true; sc.add(ground);
      if (theme === 'cyber') { const gh = new THREE.GridHelper(60, 60, 0xff2e88, 0x3a2a7a); gh.position.y = -0.34; sc.add(gh); }
      this.buildTiles(); this.buildDecor();
      // 互動：點格子
      this.ray = new THREE.Raycaster(); let down = null;
      r.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
      r.domElement.addEventListener('pointerup', e => {
        if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return;
        const rect = r.domElement.getBoundingClientRect();
        const v = new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
        this.ray.setFromCamera(v, this.cam);
        const hit = this.ray.intersectObjects(this.tileMeshes, false)[0];
        if (hit && this.onTileTap) this.onTileTap(hit.object.userData.i);
      });
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el);
      const loop = () => { if (this.dead) return; this.raf = requestAnimationFrame(loop); this.frame(); };
      loop();
    }
    resize() {
      const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return;
      this.renderer.setSize(w, h); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); if (!this.following) this.overview(true);
    }
    dispose() { this.dead = true; cancelAnimationFrame(this.raf); try { this.ro.disconnect(); } catch (e) {} try { this.renderer.dispose(); this.renderer.domElement.remove(); } catch (e) {} }
    overview(snap) {
      const asp = this.cam.aspect || 1; const d = asp < 0.62 ? 27 : asp < 0.8 ? 21 : asp < 1.2 ? 16 : 13;
      this.following = null; this.camTarget.set(0, 0, 0);
      this.camPosGoal = new THREE.Vector3(0, d * 1.15, d * 0.5);
      if (snap) { this.cam.position.copy(this.camPosGoal); this.camLook.set(0, 0, 0); this.cam.lookAt(this.camLook); }
    }
    follow(seat) { this.following = seat; }
    frame() {
      const now = performance.now(); const t = (now - this.t0) / 1000;
      // 動畫
      this.anim = this.anim.filter(a => { const k = Math.min(1, (now - a.start) / a.dur); a.step(k); if (k >= 1) { a.done && a.done(); return false; } return true; });
      // 鏡頭
      if (this.following != null && this.tokens[this.following]) {
        const p = this.tokens[this.following].group.position;
        const asp = this.cam.aspect || 1; const d = asp < 0.62 ? 13 : asp < 0.8 ? 11 : 9;
        this.camTarget.lerp(new THREE.Vector3(p.x * 0.75, 0, p.z * 0.75), 0.08);
        this.camPosGoal = new THREE.Vector3(this.camTarget.x, d * 0.95, this.camTarget.z + d * 0.85);
      }
      if (this.camPosGoal) this.cam.position.lerp(this.camPosGoal, 0.06);
      this.camLook.lerp(this.camTarget, 0.08); this.cam.lookAt(this.camLook);
      // 角色呼吸、建築發光
      Object.values(this.tokens).forEach((tk, i) => { if (!tk.busy) tk.body.position.y = 0.32 + Math.sin(t * 3 + i) * 0.03; });
      if (this.spin) this.spin.forEach(o => { o.rotation.y += 0.01; });
      this.renderer.render(this.scene, this.cam);
    }
    tween(dur, step) { return new Promise(res => this.anim.push({ start: performance.now(), dur, step, done: res })); }

    // ---------- 格子 ----------
    tileTexture(i) {
      const R = this.R, b = R.BOARD[i], th = root.MONO_THEMES[this.theme], pal = this.pal;
      const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      const corner = i % 7 === 0;
      let bg = pal.tile; if (b.type === 'luck') bg = pal.luck; if (b.type === 'bad') bg = pal.bad; if (corner) bg = pal.corner; if (b.type === 'tax' || b.type === 'teleport') bg = pal.side;
      g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
      const dark = ['bad', 'jail', 'gotojail', 'start', 'free'].includes(b.type) && this.theme !== 'animal' || this.theme === 'cyber' || this.theme === 'alien';
      g.fillStyle = b.type === 'prop' ? pal.text : (dark ? '#fff' : pal.text);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (b.type === 'prop') {
        g.fillStyle = b.color; g.fillRect(0, 0, 256, 58);
        g.fillStyle = pal.text; g.font = 'bold 40px "PingFang TC","Noto Sans TC",sans-serif';
        const lines = wrapText(g, th.props[b.pi], 230);
        lines.forEach((l, k) => g.fillText(l, 128, 112 + k * 46 - (lines.length - 1) * 18));
        g.font = 'bold 30px sans-serif'; g.globalAlpha = 0.75; g.fillText(b.price.toLocaleString(), 128, 222); g.globalAlpha = 1;
      } else {
        g.font = '88px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        g.fillText(ICON[this.theme][b.type] || '★', 128, 96);
        g.font = 'bold 36px "PingFang TC","Noto Sans TC",sans-serif';
        const lines = wrapText(g, R.tileName(this.theme, i), 236);
        lines.forEach((l, k) => g.fillText(l, 128, 182 + k * 40));
      }
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx;
    }
    buildTiles() {
      this.tileMeshes = [];
      const shape = new THREE.Shape(); const s = 0.66, rr = 0.14;
      shape.moveTo(-s + rr, -s); shape.lineTo(s - rr, -s); shape.quadraticCurveTo(s, -s, s, -s + rr); shape.lineTo(s, s - rr); shape.quadraticCurveTo(s, s, s - rr, s);
      shape.lineTo(-s + rr, s); shape.quadraticCurveTo(-s, s, -s, s - rr); shape.lineTo(-s, -s + rr); shape.quadraticCurveTo(-s, -s, -s + rr, -s);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
      geo.rotateX(-Math.PI / 2); geo.translate(0, -0.3, 0);
      const sideMat = new THREE.MeshStandardMaterial({ color: this.pal.side, roughness: 0.7 });
      for (let i = 0; i < this.R.N; i++) {
        const [x, z] = tileXZ(i);
        const base = new THREE.Mesh(geo, sideMat); base.position.set(x, 0, z); base.castShadow = base.receiveShadow = true; this.scene.add(base);
        const top = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshStandardMaterial({ map: this.tileTexture(i), roughness: 0.6, emissive: (this.theme === 'cyber' || this.theme === 'alien') ? 0x222244 : 0x000000 }));
        top.rotation.x = -Math.PI / 2; top.position.set(x, 0.035, z); top.receiveShadow = true; top.userData.i = i;
        this.scene.add(top); this.tileMeshes.push(top);
      }
    }
    pulseTile(i) {
      const m = this.tileMeshes[i]; if (!m) return;
      this.tween(600, k => { m.position.y = 0.035 + Math.sin(k * Math.PI) * 0.12; });
    }

    // ---------- 裝飾 ----------
    mat(color, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.6 }, extra || {})); }
    buildDecor() {
      const sc = this.scene, th = this.theme, M = (c, e) => this.mat(c, e);
      const add = (geo, mat, x, y, z, cast) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (cast !== false) m.castShadow = true; sc.add(m); return m; };
      this.spin = [];
      if (th === 'ragnarok') {
        add(new THREE.CylinderGeometry(0.4, 0.75, 2.2, 10), M('#8b6b4a'), 0, 0.8, 0);
        [[0, 2.5, -0.2, 1.25], [0.95, 2.2, 0.1, 0.85], [-0.9, 2.25, -0.3, 0.9], [0.1, 2.1, 0.7, 0.75], [-0.2, 2.35, -1.0, 0.8]].forEach(([x, y, z, r]) => add(new THREE.SphereGeometry(r, 16, 12), M('#9bbf6a'), x, y, z));
        [[1.2, 2.6, 0.3], [-1.0, 2.8, 0.4], [0.3, 3.4, -0.4]].forEach(([x, y, z]) => add(new THREE.SphereGeometry(0.16, 10, 8), M('#ffd54f', { metalness: 0.8, roughness: 0.2 }), x, y, z));
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; add(new THREE.CylinderGeometry(0.16, 0.18, 1.6, 12), M('#f5f1e6'), Math.cos(a) * 2.6, 0.5, Math.sin(a) * 2.6); }
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const c = add(new THREE.SphereGeometry(1.2, 12, 10), M('#ffffff', { roughness: 1 }), Math.cos(a) * 16, 4 + (k % 3), Math.sin(a) * 16, false); c.scale.set(1.6, 0.6, 1); }
      } else if (th === 'cyber') {
        const win = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#0b0820'; g.fillRect(0, 0, 64, 128);
          for (let y = 4; y < 128; y += 10) for (let x = 4; x < 64; x += 10) { if (Math.random() < 0.55) { g.fillStyle = ['#ff2e88', '#00e5ff', '#ffd400', '#7b2ff7'][Math.floor(Math.random() * 4)]; g.fillRect(x, y, 5, 6); } }
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
        const hs = [[0, -0.6, 2.6, 1.1], [1.4, 0.2, 1.8, 0.9], [-1.4, -0.4, 2.1, 1], [0.6, -1.8, 1.5, 0.8], [-0.8, 1.2, 1.2, 0.8]];
        hs.forEach(([x, z, h, w]) => add(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ map: win, emissive: 0xffffff, emissiveMap: win, emissiveIntensity: 0.9, roughness: 0.4 }), x, h / 2 - 0.3, z));
        const ring = add(new THREE.TorusGeometry(0.9, 0.05, 8, 40), new THREE.MeshBasicMaterial({ color: '#ff2e88' }), 0, 2.7, -0.6, false); ring.rotation.x = Math.PI / 2; this.spin.push(ring);
        for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, d = 15 + (k % 3) * 2, h = 4 + (k % 5) * 2; add(new THREE.BoxGeometry(2, h, 2), new THREE.MeshStandardMaterial({ map: win, emissive: 0xffffff, emissiveMap: win, emissiveIntensity: 0.7 }), Math.cos(a) * d, h / 2 - 0.3, Math.sin(a) * d, false); }
      } else if (th === 'animal') {
        const pond = add(new THREE.CircleGeometry(2.2, 32), M('#4fb3e8', { roughness: 0.2, metalness: 0.1 }), 0, -0.3, 0, false); pond.rotation.x = -Math.PI / 2;
        const tree = (x, z, s) => { add(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.2 * s, 8), M('#8b5a2b'), x, 0.3 * s, z); add(new THREE.SphereGeometry(0.7 * s, 12, 10), M(['#4caf50', '#66bb6a', '#2e7d32'][Math.floor(Math.random() * 3)]), x, 1.2 * s, z); };
        [[2.6, 1.8, 1.3], [-2.5, -1.6, 1.5], [-2.2, 2.2, 1.1], [2.3, -2.3, 1.2], [0, 2.9, 0.9]].forEach(a => tree(...a));
        for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, d = 14 + (k % 4) * 2; tree(Math.cos(a) * d, Math.sin(a) * d, 2 + (k % 3)); }
        [[0.8, -0.6], [-0.7, 0.5]].forEach(([x, z]) => add(new THREE.SphereGeometry(0.35, 12, 8), M('#9e9e9e'), x, -0.15, z));
      } else {
        for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, d = k ? 1.8 : 0, h = k ? 1.6 + (k % 3) * 0.6 : 3;
          const c = add(new THREE.ConeGeometry(k ? 0.35 : 0.6, h, 6), M(['#5ef2d0', '#c77dff', '#4cc9f0'][k % 3], { emissive: ['#2a8f7a', '#6a2ea3', '#1f6b8a'][k % 3], emissiveIntensity: 0.8, roughness: 0.2 }), Math.cos(a) * d, h / 2 - 0.3, Math.sin(a) * d); }
        const planet = add(new THREE.SphereGeometry(4, 32, 24), M('#ff9f68', { emissive: '#552211', emissiveIntensity: 0.6 }), -14, 12, -22, false);
        const ring = add(new THREE.TorusGeometry(6.2, 0.25, 8, 64), new THREE.MeshBasicMaterial({ color: '#ffd6a5' }), -14, 12, -22, false); ring.rotation.x = 1.2;
        const stars = new THREE.BufferGeometry(); const pts = []; for (let k = 0; k < 500; k++) pts.push((Math.random() - 0.5) * 120, 8 + Math.random() * 50, (Math.random() - 0.5) * 120);
        stars.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); sc.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 })));
      }
    }

    // ---------- 建築 ----------
    building(level, color) {
      const g = new THREE.Group(), th = this.theme, M = (c, e) => this.mat(c, e);
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
      const glow = (c, i) => M(c, { emissive: c, emissiveIntensity: i == null ? 0.9 : i });
      if (th === 'ragnarok') {
        const marble = M('#f6f2e8', { roughness: 0.35 }), gold = M('#d4af37', { metalness: 0.8, roughness: 0.25 });
        if (level === 1) { add(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 10), marble, 0, 0.3, 0); add(new THREE.BoxGeometry(0.3, 0.06, 0.3), marble, 0, 0.62, 0); }
        else {
          const w = 0.35 + level * 0.1, h = 0.25 + level * 0.12;
          add(new THREE.BoxGeometry(w + 0.15, 0.08, w), marble, 0, 0.04, 0);
          [-1, 1].forEach(a => [-1, 1].forEach(b => add(new THREE.CylinderGeometry(0.045, 0.05, h, 8), marble, a * w / 2.4, 0.08 + h / 2, b * w / 2.8)));
          const roof = add(new THREE.CylinderGeometry(0.01, (w + 0.1) / 1.6, 0.25, 4, 1), level >= 3 ? gold : marble, 0, 0.2 + h, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1.2, 1, 0.8);
          if (level === 4) { add(new THREE.SphereGeometry(0.1, 12, 10), gold, 0, h + 0.5, 0); add(new THREE.ConeGeometry(0.08, 0.25, 8), gold, 0, h + 0.36, 0); }
        }
      } else if (th === 'cyber') {
        const body = M('#1b1838', { roughness: 0.3, metalness: 0.4 }); const h = [0, 0.35, 0.6, 0.95, 1.45][level];
        add(new THREE.BoxGeometry(0.5, h, 0.5), body, 0, h / 2, 0);
        add(new THREE.BoxGeometry(0.52, 0.05, 0.52), glow(color), 0, h * 0.6, 0);
        if (level >= 2) add(new THREE.BoxGeometry(0.4, 0.14, 0.03), glow(['#ff2e88', '#00e5ff', '#ffd400'][level % 3], 1.2), 0, h * 0.82, 0.27);
        if (level >= 3) add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), glow('#00e5ff'), 0.15, h + 0.2, 0.15);
        if (level === 4) { const r = add(new THREE.TorusGeometry(0.3, 0.025, 8, 24), glow('#ff2e88', 1.4), 0, h + 0.05, 0); r.rotation.x = Math.PI / 2; this.spin.push(r); }
      } else if (th === 'animal') {
        if (level === 1) { const m = add(new THREE.SphereGeometry(0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M('#8d6e63'), 0, 0, 0); add(new THREE.CircleGeometry(0.12, 12), M('#2b1d16'), 0, 0.1, 0.3).rotation.x = -0.3; void m; }
        else if (level === 2) { add(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 10), M('#8b5a2b'), 0, 0.35, 0); add(new THREE.SphereGeometry(0.34, 12, 10), M('#66bb6a'), 0, 0.85, 0); add(new THREE.CircleGeometry(0.07, 10), M('#1e130c'), 0, 0.4, 0.19); }
        else if (level === 3) { add(new THREE.CylinderGeometry(0.2, 0.26, 1, 10), M('#7b4a26'), 0, 0.5, 0); add(new THREE.SphereGeometry(0.45, 12, 10), M('#43a047'), 0, 1.15, 0); add(new THREE.BoxGeometry(0.45, 0.06, 0.45), M('#a1887f'), 0, 0.7, 0); add(new THREE.ConeGeometry(0.2, 0.18, 4), M('#d84315'), 0, 0.85, 0.05); }
        else { add(new THREE.CylinderGeometry(0.32, 0.4, 1.3, 12), M('#9c7a5b'), 0, 0.65, 0); [[0, 1.45, 0, 0.55], [0.35, 1.3, 0.1, 0.35], [-0.35, 1.32, -0.05, 0.38]].forEach(([x, y, z, r]) => add(new THREE.SphereGeometry(r, 12, 10), M('#2e7d32'), x, y, z)); add(new THREE.SphereGeometry(0.08, 8, 6), M('#ffd54f', { emissive: '#ffb300', emissiveIntensity: 0.6 }), 0.2, 1.75, 0.2); }
      } else {
        const c1 = ['#5ef2d0', '#c77dff', '#4cc9f0', '#ff9f1c'][level - 1];
        if (level === 1) { add(new THREE.ConeGeometry(0.1, 0.45, 6), glow(c1), 0, 0.22, 0); add(new THREE.SphereGeometry(0.08, 8, 6), glow('#ffffff', 1.2), 0, 0.5, 0); }
        else if (level === 2) { add(new THREE.CylinderGeometry(0.06, 0.09, 0.5, 8), M('#e0d7ff'), 0, 0.25, 0); add(new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), glow(c1, 0.7), 0, 0.48, 0); }
        else if (level === 3) { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; const m = add(new THREE.CapsuleGeometry(0.05, 0.6, 4, 8), glow(c1, 0.8), Math.cos(a) * 0.15, 0.4, Math.sin(a) * 0.15); m.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); } add(new THREE.SphereGeometry(0.12, 10, 8), glow('#ffffff', 1), 0, 0.75, 0); }
        else { add(new THREE.CylinderGeometry(0.05, 0.08, 0.7, 8), M('#b9a8ff'), 0, 0.35, 0); const cr = add(new THREE.IcosahedronGeometry(0.28, 0), glow(c1, 1.1), 0, 0.9, 0); this.spin.push(cr); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const p = add(new THREE.ConeGeometry(0.08, 0.4, 4), glow('#ff4d6d', 0.8), Math.cos(a) * 0.3, 0.75, Math.sin(a) * 0.3); p.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2); } }
      }
      return g;
    }
    setBuildings(owners, levels, colors) {
      for (let i = 0; i < this.R.N; i++) {
        const key = owners[i] + ':' + levels[i];
        if (this.bld[i] && this.bld[i].key === key) continue;
        if (this.bld[i]) { this.scene.remove(this.bld[i].obj); this.bld[i] = null; }
        if (this.flags[i]) { this.scene.remove(this.flags[i]); this.flags[i] = null; }
        if (owners[i] < 0) continue;
        const [x, z] = tileXZ(i); const col = colors[owners[i]] || '#ffffff';
        // 地主旗子
        const flag = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), this.mat('#eeeeee')); pole.position.y = 0.25; flag.add(pole);
        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), this.mat(col, { side: THREE.DoubleSide, emissive: col, emissiveIntensity: 0.3 })); cloth.position.set(0.11, 0.42, 0); flag.add(cloth);
        flag.position.set(x - 0.45, 0.04, z - 0.45); this.scene.add(flag); this.flags[i] = flag;
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.58, 0.64, 32), new THREE.MeshBasicMaterial({ color: col })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, -0.035, 0); flag.add(ring); ring.position.set(0.45, 0.002, 0.45);
        if (levels[i] > 0) {
          const b = this.building(levels[i], col); b.position.set(x + 0.18, 0.04, z - 0.18); this.scene.add(b);
          this.bld[i] = { key, obj: b };
          b.scale.setScalar(0.01); this.tween(500, k => b.scale.setScalar(1.35 * Math.max(0.01, 1 + Math.sin(k * Math.PI) * 0.25 * (1 - k) - (1 - k) * (1 - k))));
        } else this.bld[i] = { key, obj: new THREE.Group() };
      }
    }

    // ---------- 角色 ----------
    avatarTexture(char, img) {
      const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
      g.lineWidth = 14; g.strokeStyle = char.color; g.stroke();
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
      if (img) {
        const im = new Image(); im.onload = () => { g.save(); g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.clip(); g.drawImage(im, 16, 16, 224, 224); g.restore(); g.lineWidth = 14; g.strokeStyle = char.color; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.stroke(); tx.needsUpdate = true; }; im.src = img;
      } else {
        g.font = '150px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(char.emoji, 128, 140);
      }
      return tx;
    }
    setTokens(list) { // list: [{seat, char:{emoji,color}, img, alive}]
      list.forEach(p => {
        const key = p.char.emoji + p.char.color + (p.img ? p.img.length : 0);
        let tk = this.tokens[p.seat];
        if (tk && tk.key !== key) { this.scene.remove(tk.group); tk = null; }
        if (!tk) {
          const group = new THREE.Group(); const body = new THREE.Group(); group.add(body);
          const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.28, 4, 12), this.mat(p.char.color, { roughness: 0.4 })); torso.castShadow = true; body.add(torso);
          const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.avatarTexture(p.char, p.img), depthWrite: false })); head.scale.set(1.0, 1.0, 1.0); head.position.y = 0.8; body.add(head);
          const sh = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.045; group.add(sh);
          body.position.y = 0.32; this.scene.add(group);
          tk = this.tokens[p.seat] = { group, body, key, pos: -1 };
        }
        tk.group.visible = p.alive !== false;
      });
    }
    slot(i, seat) {
      const [x, z] = tileXZ(i); const a = seat / 6 * Math.PI * 2 + 0.5; const r = 0.3;
      return new THREE.Vector3(x + Math.cos(a) * r, 0.04, z + Math.sin(a) * r);
    }
    place(seat, i) { const tk = this.tokens[seat]; if (!tk) return; tk.group.position.copy(this.slot(i, seat)); tk.pos = i; }
    async hop(seat, path) {
      const tk = this.tokens[seat]; if (!tk || !path.length) return;
      tk.busy = true; this.follow(seat);
      for (const i of path) {
        const from = tk.group.position.clone(), to = this.slot(i, seat);
        if (this.onStep) this.onStep(i);
        await this.tween(260, k => { tk.group.position.lerpVectors(from, to, k); tk.body.position.y = 0.32 + Math.sin(k * Math.PI) * 0.55; tk.body.rotation.y = k * Math.PI * 2 * 0; });
        tk.pos = i; this.pulseTile(i);
      }
      tk.body.position.y = 0.32; tk.busy = false;
    }
    async teleport(seat, i) {
      const tk = this.tokens[seat]; if (!tk) return; tk.busy = true; this.follow(seat);
      await this.tween(350, k => { tk.body.position.y = 0.32 + k * 3; tk.body.rotation.y = k * 8; });
      tk.group.position.copy(this.slot(i, seat)); tk.pos = i;
      await this.tween(400, k => { tk.body.position.y = 0.32 + (1 - k) * 3; tk.body.rotation.y = (1 - k) * 8; });
      tk.body.rotation.y = 0; tk.busy = false; this.pulseTile(i);
    }
    async shake(seat) { const tk = this.tokens[seat]; if (!tk) return; await this.tween(500, k => { tk.body.position.x = Math.sin(k * 40) * 0.06 * (1 - k); }); tk.body.position.x = 0; }
    async jumpJoy(seat) { const tk = this.tokens[seat]; if (!tk) return; await this.tween(500, k => { tk.body.position.y = 0.32 + Math.abs(Math.sin(k * Math.PI * 2)) * 0.4; }); }
    screenOf(seat, tile) {
      let v;
      if (seat != null && this.tokens[seat]) v = this.tokens[seat].group.position.clone().add(new THREE.Vector3(0, 1.1, 0));
      else if (tile != null) { const [x, z] = tileXZ(tile); v = new THREE.Vector3(x, 0.6, z); }
      else return null;
      v.project(this.cam);
      return { x: (v.x + 1) / 2 * this.el.clientWidth, y: (1 - v.y) / 2 * this.el.clientHeight };
    }
  }
  root.MonoBoard3D = Board3D;
  root.MONO_PAL = PAL;
})(typeof window !== 'undefined' ? window : globalThis);
