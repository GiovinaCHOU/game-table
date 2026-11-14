// 大富翁美術：各主題的環境、格子貼圖、建築（Three.js 程式生成）
(function (root) {
  const A = {};
  const rnd = (a, b) => a + Math.random() * (b - a);
  function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return [c, c.getContext('2d')]; }
  function tex(T, c, rep) { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep, rep); } return t; }
  function wrap(g, text, maxW) { const out = []; let cur = ''; for (const ch of text) { if (g.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch; } else cur += ch; } if (cur) out.push(cur); return out.slice(0, 3); }
  const SANS = '"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif';
  const SERIF = '"Songti TC","Noto Serif TC","PMingLiU",serif';
  const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  // ---------------- 調色盤 ----------------
  A.STYLE = {
    ragnarok: { bg: '#cfd8e6', fog: ['#dfe6f0', 30, 90], hemi: [0xfff6e6, 0x8a9bb5, 0.8], sun: [0xffe7b8, 2.4], env: ['#fff4dc', '#a9b8cf'], panels: [['#fff2c0', 0, 8, 0]], envI: 0.7 },
    cyber: { bg: '#07050f', fog: ['#120a24', 16, 60], hemi: [0x8a7cff, 0x1a0a2a, 0.9], sun: [0xb4c4ff, 0.9], env: ['#2a1450', '#0a0618'], panels: [['#ff2e88', 6, 2, 0], ['#00e5ff', -6, 2, 0], ['#b14cff', 0, 3, 6], ['#ffd400', 0, 2, -6]], envI: 1.0 },
    animal: { bg: '#a9cde6', fog: ['#c9dbe2', 30, 90], hemi: [0xfff3d6, 0x6b5a3a, 0.9], sun: [0xffe2b0, 2.6], env: ['#cfe6f5', '#7a6a48'], envI: 0.5 },
    alien: { bg: '#050806', fog: ['#0a120d', 12, 48], hemi: [0x9fbfa7, 0x0a0f0a, 0.9], sun: [0xd6eedc, 1.3], env: ['#6f8f77', '#101810'], panels: [['#c8ffd0', 0, 8, 0], ['#5cff7a', 6, 1, 0], ['#d9d3b8', -6, 2, 3]], envI: 1.2 }
  };

  // ---------------- 格子貼圖 ----------------
  A.tileTexture = function (T, theme, b, name, icon) {
    const [c, g] = cvs(256); g.textAlign = 'center'; g.textBaseline = 'middle';
    const prop = b.type === 'prop';
    if (theme === 'cyber') {
      g.fillStyle = '#0d0b1c'; g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 4) { g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(0, y, 256, 1); }
      const neon = prop ? b.color : ({ luck: '#00e5ff', bad: '#ff2e63', start: '#ffd400', jail: '#ff2e63', gotojail: '#ff2e63', free: '#3cff9e', tax: '#ffd400', teleport: '#b14cff' }[b.type] || '#00e5ff');
      g.shadowColor = neon; g.shadowBlur = 18; g.strokeStyle = neon; g.lineWidth = 5; g.strokeRect(10, 10, 236, 236);
      g.fillStyle = neon;
      if (!prop) { g.font = `86px ${EMOJI}`; g.shadowBlur = 0; g.fillText(icon, 128, 92); g.shadowBlur = 14; }
      g.font = `bold ${prop ? 40 : 34}px ${SANS}`;
      const ls = wrap(g, name, 220); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 104 : 178) + k * 42 - (ls.length - 1) * (prop ? 20 : 0)));
      if (prop) { g.font = `bold 28px ${SANS}`; g.fillStyle = '#c9c3ff'; g.shadowBlur = 0; g.fillText('$' + b.price.toLocaleString(), 128, 214); }
    } else if (theme === 'alien') {
      // 生物機械：骨白板上刻紋、暗色血管
      const gr = g.createRadialGradient(128, 128, 20, 128, 128, 180); gr.addColorStop(0, '#2b2f28'); gr.addColorStop(1, '#0d100c');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = 'rgba(200,194,168,0.18)'; g.lineWidth = 2;
      for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(0, 20 + k * 28); g.bezierCurveTo(80, 10 + k * 28 + rnd(-12, 12), 170, 30 + k * 28 + rnd(-12, 12), 256, 20 + k * 28); g.stroke(); }
      const acc = prop ? b.color : ({ luck: '#8fd18a', bad: '#b8322c', start: '#c8c2a8', jail: '#b8322c', gotojail: '#b8322c' }[b.type] || '#7fa88a');
      g.strokeStyle = '#c8c2a8'; g.lineWidth = 6; g.strokeRect(8, 8, 240, 240);
      g.fillStyle = acc; g.fillRect(8, 8, 240, prop ? 34 : 10);
      g.fillStyle = '#d9d3b8';
      if (!prop) { g.font = `80px ${EMOJI}`; g.globalAlpha = 0.9; g.fillText(icon, 128, 96); g.globalAlpha = 1; }
      g.font = `bold ${prop ? 38 : 32}px ${SANS}`;
      const ls = wrap(g, name, 220); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 110 : 180) + k * 40 - (ls.length - 1) * (prop ? 20 : 0)));
      if (prop) { g.font = `bold 26px ${SANS}`; g.fillStyle = '#9fae96'; g.fillText(b.price.toLocaleString() + ' 星幣', 128, 214); }
    } else if (theme === 'ragnarok') {
      // 大理石＋金邊
      g.fillStyle = '#f3efe6'; g.fillRect(0, 0, 256, 256);
      for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(120,110,100,${rnd(0.05, 0.15)})`; g.lineWidth = rnd(0.5, 2); g.beginPath(); let x = rnd(0, 256), y = rnd(0, 256); g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += rnd(-40, 40); y += rnd(-40, 40); g.lineTo(x, y); } g.stroke(); }
      g.strokeStyle = '#b8912f'; g.lineWidth = 7; g.strokeRect(9, 9, 238, 238); g.lineWidth = 2; g.strokeRect(20, 20, 216, 216);
      if (prop) { g.fillStyle = b.color; g.fillRect(20, 20, 216, 30); }
      else { const bgc = { luck: 'rgba(242,201,76,0.35)', bad: 'rgba(70,40,100,0.35)' }[b.type]; if (bgc) { g.fillStyle = bgc; g.fillRect(20, 20, 216, 216); } }
      g.fillStyle = '#3b2f1e';
      if (!prop) { g.font = `80px ${EMOJI}`; g.fillText(icon, 128, 98); }
      g.font = `bold ${prop ? 40 : 34}px ${SERIF}`;
      const ls = wrap(g, name, 210); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 112 : 182) + k * 42 - (ls.length - 1) * (prop ? 20 : 0)));
      if (prop) { g.font = `bold 26px ${SERIF}`; g.fillStyle = '#8a6a1f'; g.fillText(b.price.toLocaleString() + ' 金', 128, 214); }
    } else {
      // 動物：土地木牌
      g.fillStyle = '#b89b6e'; g.fillRect(0, 0, 256, 256);
      for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(${rnd(60, 120)},${rnd(45, 90)},${rnd(20, 50)},${rnd(0.08, 0.25)})`; g.fillRect(rnd(0, 256), rnd(0, 256), rnd(2, 6), rnd(2, 6)); }
      g.fillStyle = '#efe2c4'; g.fillRect(18, prop ? 60 : 130, 220, prop ? 120 : 96);
      g.strokeStyle = '#5c4326'; g.lineWidth = 4; g.strokeRect(18, prop ? 60 : 130, 220, prop ? 120 : 96);
      if (prop) { g.fillStyle = b.color; g.fillRect(18, 18, 220, 30); }
      g.fillStyle = '#3d2b1f';
      if (!prop) { g.font = `78px ${EMOJI}`; g.fillText(icon, 128, 72); }
      g.font = `bold ${prop ? 36 : 32}px ${SANS}`;
      const ls = wrap(g, name, 206); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 104 : 162) + k * 38 - (ls.length - 1) * (prop ? 18 : 0)));
      if (prop) { g.font = `bold 26px ${SANS}`; g.fillStyle = '#5c4326'; g.fillText(b.price.toLocaleString() + ' 果', 128, 214); }
    }
    return tex(T, c);
  };

  // ---------------- 環境 ----------------
  A.env = function (T, scene, theme, q, upd) {
    const M = (c, e) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, e || {}));
    const add = (geo, mat, x, y, z, sh) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (sh !== false && q.high) { m.castShadow = true; m.receiveShadow = true; } scene.add(m); return m; };
    if (theme === 'cyber') {
      // 濕亮地面
      const gnd = add(new T.PlaneGeometry(140, 140), M('#07060d', { roughness: 0.12, metalness: 0.75 }), 0, -0.36, 0, false); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = q.high;
      // 地面霓虹倒影線
      for (let k = 0; k < 10; k++) { const l = add(new T.PlaneGeometry(0.06, 60), new T.MeshBasicMaterial({ color: ['#ff2e88', '#00e5ff'][k % 2], transparent: true, opacity: 0.25 }), -18 + k * 4, -0.35, 0, false); l.rotation.x = -Math.PI / 2; }
      // 天際線
      const winTex = (() => { const [c, g] = cvs(64, 256); g.fillStyle = '#05040b'; g.fillRect(0, 0, 64, 256); for (let y = 4; y < 256; y += 8) for (let x = 3; x < 64; x += 8) { if (Math.random() < 0.45) { g.fillStyle = ['#ffcf6b', '#7fe7ff', '#ff6bb5', '#c8c8ff'][Math.floor(Math.random() * 4)]; g.globalAlpha = rnd(0.4, 1); g.fillRect(x, y, 4, 4); } } g.globalAlpha = 1; return tex(T, c); })();
      const signs = ['酒', 'BAR', '夜', '龍', 'CLUB', '電', '拉麵', '24H', '義體', '藥'];
      for (let k = 0; k < 34; k++) {
        const a = k / 34 * Math.PI * 2 + rnd(-0.05, 0.05), d = rnd(22, 34), h = rnd(6, 26), w = rnd(2, 4);
        const m = add(new T.BoxGeometry(w, h, w), new T.MeshStandardMaterial({ color: '#0a0914', map: winTex, emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.3 }), Math.cos(a) * d, h / 2 - 0.36, Math.sin(a) * d, false);
        m.lookAt(0, h / 2, 0);
        if (Math.random() < 0.6) { // 霓虹招牌
          const [c, g] = cvs(256, 96); const col = ['#ff2e88', '#00e5ff', '#ffd400', '#b14cff', '#3cff9e'][k % 5];
          g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, 256, 96); g.shadowColor = col; g.shadowBlur = 20; g.fillStyle = col; g.font = `bold 64px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(signs[k % signs.length], 128, 50);
          const s = new T.Mesh(new T.PlaneGeometry(w * 0.9, w * 0.34), new T.MeshBasicMaterial({ map: tex(T, c), transparent: true, side: T.DoubleSide }));
          const hh = rnd(2, h - 1); s.position.set(Math.cos(a) * (d - w / 2 - 0.05), hh, Math.sin(a) * (d - w / 2 - 0.05)); s.lookAt(0, hh, 0); scene.add(s);
        }
      }
      // 彩色點光
      [['#ff2e88', 6, 6], ['#00e5ff', -6, -5], ['#b14cff', -6, 6], ['#3d6bff', 6, -6]].forEach(([c, x, z]) => { const L = new T.PointLight(c, 5, 12, 1.8); L.position.set(x, 3, z); scene.add(L); });
      // 中央：企業塔
      const core = add(new T.CylinderGeometry(0.9, 1.3, 5, 8), new T.MeshStandardMaterial({ color: '#0d0c18', map: winTex, emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 }), 0, 2.2, 0);
      void core;
      const ring = add(new T.TorusGeometry(1.4, 0.05, 8, 48), new T.MeshBasicMaterial({ color: '#ff2e88' }), 0, 4.0, 0, false); ring.rotation.x = Math.PI / 2;
      const holo = add(new T.CylinderGeometry(1.6, 1.6, 0.9, 32, 1, true), new T.MeshBasicMaterial({ color: '#00e5ff', transparent: true, opacity: 0.15, side: T.DoubleSide }), 0, 4.6, 0, false);
      upd.push((t) => { ring.rotation.z = t * 0.6; holo.rotation.y = -t * 0.3; holo.material.opacity = 0.12 + Math.sin(t * 3) * 0.04; });
      // 雨
      if (q.high) {
        const N = 1400, pos = new Float32Array(N * 6);
        for (let i = 0; i < N; i++) { const x = rnd(-22, 22), y = rnd(0, 18), z = rnd(-22, 22); pos.set([x, y, z, x + 0.03, y - 0.45, z], i * 6); }
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
        const rain = new T.LineSegments(geo, new T.LineBasicMaterial({ color: '#8fa7ff', transparent: true, opacity: 0.35 })); scene.add(rain);
        upd.push((t, dt) => { const p = geo.attributes.position.array; for (let i = 0; i < N; i++) { let y = p[i * 6 + 1] - dt * 18; if (y < -0.3) y += 18; p[i * 6 + 1] = y; p[i * 6 + 4] = y - 0.45; } geo.attributes.position.needsUpdate = true; });
      }
    } else if (theme === 'alien') {
      // 生物機械地面
      const [c, g] = cvs(512); g.fillStyle = '#0d110e'; g.fillRect(0, 0, 512, 512);
      for (let k = 0; k < 60; k++) { g.strokeStyle = `rgba(${rnd(120, 200)},${rnd(120, 190)},${rnd(100, 160)},${rnd(0.05, 0.18)})`; g.lineWidth = rnd(2, 8); g.beginPath(); const y = rnd(0, 512); g.moveTo(0, y); g.bezierCurveTo(170, y + rnd(-60, 60), 340, y + rnd(-60, 60), 512, y); g.stroke(); }
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(200,194,168,${rnd(0.04, 0.12)})`; g.beginPath(); g.ellipse(rnd(0, 512), rnd(0, 512), rnd(6, 26), rnd(3, 10), rnd(0, 3), 0, 7); g.fill(); }
      const gnd = add(new T.PlaneGeometry(140, 140), M('#ffffff', { map: tex(T, c, 14), roughness: 0.35, metalness: 0.55 }), 0, -0.36, 0, false); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = q.high;
      const bone = M('#b9b29a', { roughness: 0.35, metalness: 0.25 }), black = M('#141714', { roughness: 0.2, metalness: 0.8 });
      // 肋骨拱門（遠景）
      for (let k = 0; k < 9; k++) {
        const a = k / 9 * Math.PI * 2, d = 23;
        for (let r = 0; r < 5; r++) { const arch = add(new T.TorusGeometry(5 + r * 0.2, 0.22 - r * 0.02, 8, 28, Math.PI), bone, Math.cos(a) * (d + r * 1.1), -0.4, Math.sin(a) * (d + r * 1.1), false); arch.rotation.y = -a + Math.PI / 2; }
      }
      // 管線
      for (let k = 0; k < 12; k++) {
        const a = rnd(0, 6.28), pts = []; for (let j = 0; j < 6; j++) pts.push(new T.Vector3(Math.cos(a + j * 0.18) * (19 + j * 2.5), rnd(-0.2, 2.5), Math.sin(a + j * 0.18) * (11 + j * 2.5)));
        add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, rnd(0.15, 0.35), 8), black, 0, 0, 0, false);
      }
      // 中央：脊椎尖塔
      const spine = new T.Group(); scene.add(spine);
      for (let k = 0; k < 14; k++) { const v = new T.Mesh(new T.TorusGeometry(0.55 - k * 0.025, 0.16, 8, 18), k % 2 ? bone : black); v.rotation.x = Math.PI / 2; v.position.y = k * 0.33; spine.add(v); }
      for (let k = 0; k < 8; k++) { const rib = new T.Mesh(new T.TorusGeometry(1.1, 0.06, 6, 20, Math.PI * 0.8), bone); rib.position.y = 0.8 + k * 0.45; rib.rotation.set(Math.PI / 2, 0, k * 0.8); spine.add(rib); }
      const eye = new T.Mesh(new T.SphereGeometry(0.28, 16, 12), new T.MeshBasicMaterial({ color: '#7cff6b' })); eye.position.y = 4.9; spine.add(eye);
      const glow = new T.PointLight('#5cff7a', 10, 10, 1.5); glow.position.set(0, 4.6, 0); scene.add(glow);
      upd.push((t) => { glow.intensity = 8 + Math.sin(t * 1.3) * 4; eye.scale.setScalar(1 + Math.sin(t * 2) * 0.08); });
      // 孢子塵
      if (q.high) {
        const N = 500, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) pos.set([rnd(-20, 20), rnd(0, 10), rnd(-20, 20)], i * 3);
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
        const pts = new T.Points(geo, new T.PointsMaterial({ color: '#a8ff9a', size: 0.06, transparent: true, opacity: 0.6 })); scene.add(pts);
        upd.push((t) => { pts.rotation.y = t * 0.02; pts.position.y = Math.sin(t * 0.3) * 0.3; });
      }
    } else if (theme === 'ragnarok') {
      // 雲海＋浮空大理石平台
      const plat = add(new T.CylinderGeometry(8.4, 7.6, 0.8, 8), M('#ece6d8', { roughness: 0.4 }), 0, -0.78, 0); plat.rotation.y = Math.PI / 8;
      const trim = add(new T.TorusGeometry(8.1, 0.14, 8, 8), M('#c9a227', { metalness: 0.85, roughness: 0.25 }), 0, -0.42, 0); trim.rotation.set(Math.PI / 2, 0, Math.PI / 8);
      const under = add(new T.ConeGeometry(7.6, 6, 8), M('#cfc6b4', { roughness: 0.8 }), 0, -4.2, 0); under.rotation.set(Math.PI, Math.PI / 8, 0);
      const cloudM = new T.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.92 });
      for (let k = 0; k < (q.high ? 90 : 45); k++) { const a = rnd(0, 6.28), d = rnd(9, 40); const c = add(new T.SphereGeometry(rnd(1.5, 3.5), 12, 10), cloudM, Math.cos(a) * d, rnd(-4.5, -2.2), Math.sin(a) * d, false); c.scale.y = 0.45; }
      // 遠方神山
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + 0.3, d = rnd(34, 42), h = rnd(10, 18); add(new T.ConeGeometry(rnd(5, 8), h, 7), M('#b9c3d6', { roughness: 1 }), Math.cos(a) * d, h / 2 - 4, Math.sin(a) * d, false); add(new T.ConeGeometry(2, 3, 7), M('#ffffff'), Math.cos(a) * d, h - 5.2, Math.sin(a) * d, false); }
      // 中央：奧林帕斯神殿＋金色神像
      const marble = M('#f4f0e6', { roughness: 0.3 }), gold = M('#d4af37', { metalness: 0.9, roughness: 0.2 });
      for (let s = 0; s < 3; s++) add(new T.BoxGeometry(5 - s * 0.5, 0.18, 4 - s * 0.5), marble, 0, -0.27 + s * 0.18, 0);
      for (let k = 0; k < 10; k++) { const x = -1.8 + (k % 5) * 0.9, z = k < 5 ? -1.3 : 1.3; add(new T.CylinderGeometry(0.15, 0.17, 2.4, 14), marble, x, 1.4, z); }
      add(new T.BoxGeometry(4.3, 0.25, 3.2), marble, 0, 2.7, 0);
      const ped = add(new T.CylinderGeometry(0.01, 2.6, 0.9, 4), marble, 0, 3.25, 0); ped.rotation.y = Math.PI / 4; ped.scale.z = 0.62;
      const st = new T.Group(); st.position.set(0, 0.25, 0); scene.add(st);
      const body = new T.Mesh(new T.CylinderGeometry(0.28, 0.4, 1.4, 12), gold); body.position.y = 0.8; st.add(body);
      const head = new T.Mesh(new T.SphereGeometry(0.22, 16, 12), gold); head.position.y = 1.7; st.add(head);
      const arm = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1.0, 8), gold); arm.position.set(0.38, 1.6, 0); arm.rotation.z = -0.5; st.add(arm);
      const bolt = new T.Mesh(new T.ConeGeometry(0.08, 0.6, 4), new T.MeshBasicMaterial({ color: '#fff4b0' })); bolt.position.set(0.66, 2.15, 0); st.add(bolt);
      const L = new T.PointLight('#ffe9a8', 12, 9, 1.4); L.position.set(0, 2.3, 0); scene.add(L);
      upd.push((t) => { L.intensity = 10 + Math.sin(t * 2) * 2; bolt.material.color.setHSL(0.14, 1, 0.75 + Math.sin(t * 6) * 0.1); });
      // 彩虹橋
      const [rc, rg] = cvs(8, 128); ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#457b9d', '#7b2cbf'].forEach((col, k) => { rg.fillStyle = col; rg.fillRect(0, k * 21, 8, 22); });
      const rb = add(new T.TorusGeometry(9, 0.35, 6, 64, Math.PI * 0.55), new T.MeshBasicMaterial({ map: tex(T, rc), transparent: true, opacity: 0.85 }), 6, -1, -6, false); rb.rotation.set(0, Math.PI / 4, 0);
    } else {
      // 野外：草原土地、河流、金合歡樹、岩石
      const [c, g] = cvs(512); g.fillStyle = '#7d8a4a'; g.fillRect(0, 0, 512, 512);
      for (let k = 0; k < 4000; k++) { g.fillStyle = `rgba(${rnd(90, 160)},${rnd(100, 150)},${rnd(40, 80)},${rnd(0.15, 0.4)})`; g.fillRect(rnd(0, 512), rnd(0, 512), rnd(1, 4), rnd(2, 6)); }
      for (let k = 0; k < 30; k++) { g.fillStyle = `rgba(${rnd(130, 170)},${rnd(110, 140)},${rnd(70, 100)},${rnd(0.15, 0.35)})`; g.beginPath(); g.ellipse(rnd(0, 512), rnd(0, 512), rnd(20, 60), rnd(10, 30), rnd(0, 3), 0, 7); g.fill(); }
      const gnd = add(new T.PlaneGeometry(160, 160), M('#ffffff', { map: tex(T, c, 10), roughness: 1 }), 0, -0.36, 0, false); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = q.high;
      // 河
      const pts = []; for (let k = -6; k <= 6; k++) pts.push(new T.Vector3(k * 5, -0.33, Math.sin(k * 0.6) * 4 - 16));
      const curve = new T.CatmullRomCurve3(pts); const riverPts = curve.getPoints(80);
      const shape = new T.Shape(); riverPts.forEach((p, i) => i ? shape.lineTo(p.x, p.z - 1.6) : shape.moveTo(p.x, p.z - 1.6)); riverPts.slice().reverse().forEach(p => shape.lineTo(p.x, p.z + 1.6));
      const river = add(new T.ShapeGeometry(shape), M('#3f6f7d', { roughness: 0.1, metalness: 0.3 }), 0, -0.33, 0, false); river.rotation.x = Math.PI / 2; river.position.y = -0.33; river.scale.y = -1;
      // 中央水塘＋岩石
      const pond = add(new T.CircleGeometry(2.4, 40), M('#4a7a86', { roughness: 0.08, metalness: 0.3 }), 0, -0.32, 0, false); pond.rotation.x = -Math.PI / 2;
      const rockM = M('#8a8173', { roughness: 0.95, flatShading: true });
      for (let k = 0; k < 9; k++) { const a = rnd(0, 6.28); add(new T.DodecahedronGeometry(rnd(0.3, 0.8), 0), rockM, Math.cos(a) * rnd(2.4, 3.2), -0.2, Math.sin(a) * rnd(2.4, 3.2)).rotation.set(rnd(0, 3), rnd(0, 3), 0); }
      const acacia = (x, z, s) => { const tr = add(new T.CylinderGeometry(0.08 * s, 0.14 * s, 1.6 * s, 7), M('#5b4632', { flatShading: true }), x, 0.45 * s, z); tr.rotation.z = rnd(-0.15, 0.15); const cn = add(new T.SphereGeometry(1.0 * s, 10, 6), M('#5f7a34', { flatShading: true, roughness: 1 }), x, 1.35 * s, z); cn.scale.set(1.5, 0.32, 1.2); };
      acacia(1.2, -1.0, 1.1); acacia(-1.5, 1.2, 0.9);
      for (let k = 0; k < (q.high ? 40 : 18); k++) { const a = rnd(0, 6.28), d = rnd(24, 50); acacia(Math.cos(a) * d, Math.sin(a) * d, rnd(1.8, 3.2)); }
      for (let k = 0; k < (q.high ? 14 : 6); k++) { const a = rnd(0, 6.28), d = rnd(11, 18); acacia(Math.cos(a) * d, Math.sin(a) * d, rnd(0.9, 1.3)); }
      for (let k = 0; k < (q.high ? 25 : 10); k++) { const a = rnd(0, 6.28), d = rnd(24, 45); add(new T.DodecahedronGeometry(rnd(1, 3), 0), rockM, Math.cos(a) * d, rnd(-0.5, 0.5), Math.sin(a) * d); }
      // 草叢
      if (q.high) { const gm = M('#8a9a4a', { roughness: 1 }); for (let k = 0; k < 160; k++) { const a = rnd(0, 6.28), d = rnd(6.8, 20); const gr = add(new T.ConeGeometry(0.12, rnd(0.35, 0.7), 4), gm, Math.cos(a) * d, -0.1, Math.sin(a) * d, false); gr.rotation.z = rnd(-0.3, 0.3); } }
    }
  };

  // ---------------- 建築 ----------------
  // ctx: { theme, level, color(地主顏色), name(地名), ownerChar(角色編號), T }
  A.building = function (T, ctx, upd) {
    const g = new T.Group(), { theme, level } = ctx;
    const M = (c, e) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, e || {}));
    const add = (geo, mat, x, y, z, parent) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; (parent || g).add(m); return m; };
    if (theme === 'cyber') {
      const wall = M('#1c1a2a', { roughness: 0.3, metalness: 0.6 });
      const H = [0, 0.55, 0.95, 1.5, 2.3][level], W = 0.62;
      add(new T.BoxGeometry(W, H, W), wall, 0, H / 2, 0);
      // 店門與櫥窗
      add(new T.BoxGeometry(0.34, 0.26, 0.02), M('#ffcf8a', { emissive: '#ffb347', emissiveIntensity: 1.2 }), 0, 0.15, W / 2 + 0.01);
      // 霓虹店名招牌
      const [c, cg] = cvs(256, 80); cg.shadowColor = ctx.color; cg.shadowBlur = 16; cg.fillStyle = ctx.color; cg.font = `bold 44px ${SANS}`; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.fillText(ctx.name.slice(0, 5), 128, 42);
      const sign = add(new T.PlaneGeometry(0.62, 0.2), new T.MeshBasicMaterial({ map: tex(T, c), transparent: true }), 0, Math.min(H - 0.1, 0.48), W / 2 + 0.02);
      const edges = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(W + 0.01, H, W + 0.01)), new T.LineBasicMaterial({ color: ctx.color })); edges.position.y = H / 2; g.add(edges);
      add(new T.BoxGeometry(W * 0.5, 0.02, W * 0.5), M('#222033', { metalness: 0.8, roughness: 0.3 }), 0, H + 0.01, 0);
      if (level >= 2) for (let k = 1; k < level; k++) add(new T.BoxGeometry(W + 0.02, 0.02, W + 0.02), M('#00e5ff', { emissive: '#00e5ff', emissiveIntensity: 1.2 }), 0, H * k / level, 0);
      if (level >= 3) { const bb = add(new T.PlaneGeometry(0.5, 0.3), M('#ff2e88', { emissive: '#ff2e88', emissiveIntensity: 0.8, side: T.DoubleSide, transparent: true, opacity: 0.8 }), W / 2 + 0.01, H * 0.7, 0); bb.rotation.y = Math.PI / 2; upd.push(t => { bb.material.emissiveIntensity = 0.5 + Math.abs(Math.sin(t * 4 + ctx.level)) * 0.9; }); }
      if (level === 4) { add(new T.CylinderGeometry(0.015, 0.015, 0.7, 6), M('#aaaaaa', { metalness: 0.9 }), 0.15, H + 0.35, 0.15); const r = add(new T.TorusGeometry(0.42, 0.025, 8, 32), M(ctx.color, { emissive: ctx.color, emissiveIntensity: 2 }), 0, H + 0.15, 0); r.rotation.x = Math.PI / 2; upd.push(t => { r.rotation.z = t; }); }
      void sign;
    } else if (theme === 'alien') {
      const bone = M('#bdb59c', { roughness: 0.32, metalness: 0.2 }), dark = M('#151915', { roughness: 0.15, metalness: 0.85 }), glow = M('#7cff6b', { emissive: '#4cff5a', emissiveIntensity: 1.2 });
      const pod = (s, x, z) => { // 卵囊
        const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new T.Vector2(Math.sin(t * Math.PI) * 0.22 * s * (1 - t * 0.35), t * 0.6 * s)); }
        const m = add(new T.LatheGeometry(pts, 14), dark, x, 0, z);
        for (let r = 1; r < 5; r++) { const rg = add(new T.TorusGeometry(0.2 * s * Math.sin(r / 5 * Math.PI) * 0.95, 0.018 * s, 6, 16), bone, x, r / 5 * 0.58 * s, z); rg.rotation.x = Math.PI / 2; }
        const top = add(new T.SphereGeometry(0.05 * s, 8, 6), glow, x, 0.6 * s, z); upd.push(t => { top.material.emissiveIntensity = 0.6 + Math.sin(t * 2 + x * 5) * 0.6; });
        return m;
      };
      if (level === 1) pod(1.1, 0, 0);
      else if (level === 2) { pod(1.2, -0.12, 0); pod(0.8, 0.2, 0.12); const a = add(new T.TorusGeometry(0.34, 0.03, 6, 18, Math.PI), bone, 0, 0, -0.18); a.rotation.y = 0.3; }
      else if (level === 3) {
        for (let k = 0; k < 9; k++) { const v = add(new T.TorusGeometry(0.16 - k * 0.008, 0.06, 6, 12), k % 2 ? bone : dark, 0, 0.08 + k * 0.14, 0); v.rotation.x = Math.PI / 2; }
        for (let k = 0; k < 4; k++) { const rb = add(new T.TorusGeometry(0.35, 0.025, 6, 16, Math.PI * 0.9), bone, 0, 0.35 + k * 0.22, 0); rb.rotation.set(Math.PI / 2, 0, k * 0.9); }
        add(new T.SphereGeometry(0.09, 10, 8), glow, 0, 1.4, 0);
      } else {
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; const arch = add(new T.TorusGeometry(0.42, 0.035, 6, 20, Math.PI), bone, 0, 0, 0); arch.rotation.y = a; }
        for (let k = 0; k < 12; k++) { const v = add(new T.TorusGeometry(0.11 - k * 0.005, 0.045, 6, 12), k % 2 ? bone : dark, 0, 0.1 + k * 0.13, 0); v.rotation.x = Math.PI / 2; }
        const head = add(new T.CapsuleGeometry(0.1, 0.35, 4, 10), dark, 0.08, 1.75, 0); head.rotation.z = -1.1;
        const L = new T.PointLight('#5cff7a', 2.5, 2.2, 2); L.position.set(0, 0.6, 0); g.add(L); upd.push(t => { L.intensity = 1.8 + Math.sin(t * 1.7) * 1; });
      }
      // 地主顏色的發光血管
      const vein = add(new T.TorusGeometry(0.5, 0.012, 4, 32), M(ctx.color, { emissive: ctx.color, emissiveIntensity: 1 }), 0, 0.02, 0); vein.rotation.x = Math.PI / 2;
    } else if (theme === 'ragnarok') {
      const marble = M('#f6f2e8', { roughness: 0.3 }), gold = M('#d4af37', { metalness: 0.9, roughness: 0.2 });
      if (level === 1) { // 雕像
        add(new T.BoxGeometry(0.34, 0.2, 0.34), marble, 0, 0.1, 0); add(new T.CylinderGeometry(0.09, 0.13, 0.5, 10), marble, 0, 0.45, 0); add(new T.SphereGeometry(0.08, 12, 10), marble, 0, 0.78, 0);
        const sp = add(new T.CylinderGeometry(0.012, 0.012, 0.7, 6), gold, 0.14, 0.55, 0); sp.rotation.z = 0.1;
      } else {
        const cols = level === 2 ? 2 : level === 3 ? 3 : 4, W = 0.28 + cols * 0.13, D = level === 2 ? 0.38 : 0.55, H = 0.32 + level * 0.12;
        for (let s = 0; s < 3; s++) add(new T.BoxGeometry(W + 0.2 - s * 0.06, 0.05, D + 0.2 - s * 0.06), marble, 0, 0.025 + s * 0.05, 0);
        for (let i = 0; i < cols; i++) for (const z of [-D / 2, D / 2]) add(new T.CylinderGeometry(0.035, 0.04, H, 10), marble, -W / 2 + 0.05 + i * (W - 0.1) / (cols - 1), 0.15 + H / 2, z);
        add(new T.BoxGeometry(W + 0.06, 0.06, D + 0.08), marble, 0, 0.18 + H, 0);
        const ped = add(new T.CylinderGeometry(0.01, (W + 0.1) * 0.72, 0.2, 4), level >= 3 ? gold : marble, 0, 0.31 + H, 0); ped.rotation.y = Math.PI / 4; ped.scale.z = D / W + 0.1;
        if (level === 4) { add(new T.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, 0.36 + H, 0); const L = new T.PointLight('#ffe39a', 2, 2, 2); L.position.set(0, H + 0.6, 0); g.add(L); }
        // 地主色帷幔
        const cl = add(new T.PlaneGeometry(W * 0.6, H * 0.6), M(ctx.color, { side: T.DoubleSide }), 0, 0.15 + H * 0.55, 0); void cl;
      }
    } else { // 動物：依地主物種蓋家
      const s = 0.65 + level * 0.18; const earth = M('#7a5a3a', { flatShading: true, roughness: 1 }), hole = M('#1a120b', { roughness: 1 }), wood = M('#6b4a2e', { flatShading: true }), leaf = M('#4f6f2a', { flatShading: true, roughness: 1 }), water = M('#3e6b78', { roughness: 0.05, metalness: 0.3 }), rock = M('#8a8173', { flatShading: true, roughness: 0.95 }), mud = M('#5a4630', { roughness: 0.4, metalness: 0.1 });
      const kind = ctx.ownerChar % 8;
      if (kind === 0) { // 獅子：岩洞獸穴
        for (let k = 0; k < 2 + level; k++) add(new T.DodecahedronGeometry(0.18 * s + k * 0.01, 0), rock, Math.cos(k * 1.7) * 0.18, 0.12 + (k % 2) * 0.1, Math.sin(k * 1.7) * 0.15).rotation.set(k, k * 2, 0);
        add(new T.CircleGeometry(0.1 * s, 12), hole, 0, 0.12 * s, 0.25 * s);
      } else if (kind === 1) { // 兔子洞
        const m = add(new T.SphereGeometry(0.28 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), earth, 0, 0, 0); m.scale.y = 0.55;
        for (let k = 0; k < Math.max(1, level - 1); k++) { const h = add(new T.CircleGeometry(0.07 * s, 12), hole, Math.cos(k * 2.1) * 0.15 * s, 0.1 * s, Math.sin(k * 2.1) * 0.15 * s + 0.12); h.rotation.x = -0.9; }
        for (let k = 0; k < level * 2; k++) add(new T.ConeGeometry(0.03, 0.12, 4), leaf, rnd(-0.3, 0.3), 0.06, rnd(-0.3, 0.3));
      } else if (kind === 2) { // 狸貓：樹洞
        add(new T.CylinderGeometry(0.11 * s, 0.17 * s, 0.9 * s, 9), wood, 0, 0.45 * s, 0);
        add(new T.CircleGeometry(0.06 * s, 12), hole, 0, 0.4 * s, 0.14 * s);
        const cn = add(new T.SphereGeometry(0.35 * s, 10, 8), leaf, 0, 0.95 * s, 0); cn.scale.y = 0.8;
      } else if (kind === 3) { // 河馬：小湖
        const lk = add(new T.CircleGeometry(0.28 * s, 24), water, 0, 0.03, 0); lk.rotation.x = -Math.PI / 2;
        const rim = add(new T.TorusGeometry(0.28 * s, 0.035, 6, 24), mud, 0, 0.02, 0); rim.rotation.x = Math.PI / 2;
        for (let k = 0; k < level; k++) add(new T.ConeGeometry(0.025, 0.25, 4), leaf, Math.cos(k * 1.3) * 0.3 * s, 0.1, Math.sin(k * 1.3) * 0.3 * s);
      } else if (kind === 4) { // 河狸：水壩
        const lk = add(new T.CircleGeometry(0.22 * s, 20), water, 0, 0.03, -0.08); lk.rotation.x = -Math.PI / 2;
        for (let k = 0; k < 3 + level * 2; k++) { const lg = add(new T.CylinderGeometry(0.035, 0.035, 0.45 * s, 6), wood, rnd(-0.18, 0.18), 0.04 + (k % 3) * 0.05, 0.14); lg.rotation.set(rnd(-0.3, 0.3), 0, Math.PI / 2 + rnd(-0.4, 0.4)); }
        if (level >= 3) { const lodge = add(new T.ConeGeometry(0.18 * s, 0.22 * s, 8), wood, 0.05, 0.1, -0.1); void lodge; }
      } else if (kind === 5) { // 鱷魚：泥沼
        const sw = add(new T.CircleGeometry(0.32 * s, 20), mud, 0, 0.03, 0); sw.rotation.x = -Math.PI / 2;
        for (let k = 0; k < 2 + level; k++) { const r = add(new T.CylinderGeometry(0.01, 0.015, 0.4, 4), M('#6b7a3a'), rnd(-0.3, 0.3), 0.2, rnd(-0.3, 0.3)); r.rotation.z = rnd(-0.2, 0.2); }
        if (level >= 2) add(new T.DodecahedronGeometry(0.06, 0), rock, 0.12, 0.05, 0.1);
      } else if (kind === 6) { // 熊穴
        const m = add(new T.DodecahedronGeometry(0.32 * s, 0), rock, 0, 0.12 * s, 0); m.scale.y = 0.65;
        add(new T.CircleGeometry(0.1 * s, 12), hole, 0, 0.1 * s, 0.29 * s);
        for (let k = 0; k < level; k++) { const t = add(new T.ConeGeometry(0.14, 0.5, 6), M('#2f4a2a', { flatShading: true }), -0.25 + k * 0.17, 0.25, -0.25); void t; }
      } else { // 猴子：樹屋
        add(new T.CylinderGeometry(0.08 * s, 0.13 * s, 1.1 * s, 8), wood, 0, 0.55 * s, 0);
        add(new T.BoxGeometry(0.4 * s, 0.03, 0.4 * s), wood, 0, 0.6 * s, 0);
        if (level >= 2) add(new T.BoxGeometry(0.24 * s, 0.2 * s, 0.22 * s), M('#8b6a45', { flatShading: true }), 0, 0.72 * s, 0);
        const cn = add(new T.SphereGeometry(0.38 * s, 10, 8), leaf, 0, 1.05 * s, 0); cn.scale.y = 0.75;
      }
      // 地主色小木樁
      add(new T.CylinderGeometry(0.02, 0.02, 0.3, 5), M(ctx.color), -0.38, 0.15, -0.38);
    }
    return g;
  };

  root.MONO_ART = A;
})(typeof window !== 'undefined' ? window : globalThis);
