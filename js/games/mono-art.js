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
    ragnarok: { bg: '#b4c2d8', fog: ['#c9d3e2', 34, 100], hemi: [0xfff1dc, 0x6f7f9a, 0.65], sun: [0xffdca0, 2.1], env: ['#ffe9c4', '#8796b0'], panels: [['#fff2c0', 0, 8, 0]], envI: 0.55 },
    cyber: { bg: '#21173f', fog: ['#2c1f55', 26, 85], hemi: [0xc0b4ff, 0x3a2a60, 1.7], sun: [0xd8e0ff, 1.9], env: ['#6a48b0', '#241848'], panels: [['#ff2e88', 6, 2, 0], ['#00e5ff', -6, 2, 0], ['#b14cff', 0, 3, 6], ['#ffd400', 0, 2, -6], ['#ffffff', 0, 8, 0]], envI: 1.5 },
    animal: { bg: '#a9cde6', fog: ['#c9dbe2', 30, 90], hemi: [0xfff3d6, 0x6b5a3a, 0.9], sun: [0xffe2b0, 2.6], env: ['#cfe6f5', '#7a6a48'], envI: 0.5 },
    buddha: { bg: '#120508', fog: ['#2a0c18', 26, 95], hemi: [0xffc8a0, 0x3a1838, 1.25], sun: [0xffb080, 1.4], env: ['#5a2030', '#120508'], panels: [['#ff6a3a', 6, 3, 0], ['#ff6a3a', -6, 3, 0], ['#ffd27a', 0, 8, 0]], envI: 0.9 },
    magic: { bg: '#0a0a1a', fog: ['#141638', 28, 100], hemi: [0xc8c0ff, 0x2a2a48, 1.45], sun: [0xd8e0ff, 1.5], env: ['#3a3a7a', '#0a0a1a'], panels: [['#ffc070', 5, 3, 0], ['#8ac8ff', -5, 4, 0], ['#ffffff', 0, 8, 0]], envI: 1.0 },
    alien: { bg: '#f29ab8', fog: ['#f4a7a6', 34, 120], hemi: [0xffe0f2, 0x6a3f8a, 1.25], sun: [0xfff0d6, 2.3], env: ['#ffc2dc', '#5a3a8a'], panels: [['#7df9ff', 6, 2, 0], ['#ff79c6', -6, 2, 0], ['#ffd27a', 0, 8, 0]], envI: 0.8 }
  };

  // ---------------- 格子貼圖 ----------------
  A.tileTexture = function (T, theme, b, name, icon) {
    const [c, g] = cvs(256); g.textAlign = 'center'; g.textBaseline = 'middle';
    const prop = b.type === 'prop';
    if (theme === 'cyber') {
      g.fillStyle = '#231d44'; g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 4) { g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(0, y, 256, 1); }
      const neon = prop ? b.color : ({ item: '#ff9f1c', luck: '#00e5ff', bad: '#ff2e63', start: '#ffd400', jail: '#ff2e63', gotojail: '#ff2e63', free: '#3cff9e', tax: '#ffd400', teleport: '#b14cff' }[b.type] || '#00e5ff');
      g.shadowColor = neon; g.shadowBlur = 18; g.strokeStyle = neon; g.lineWidth = 5; g.strokeRect(10, 10, 236, 236);
      g.fillStyle = neon;
      if (!prop) { g.font = `86px ${EMOJI}`; g.shadowBlur = 0; g.fillText(icon, 128, 92); g.shadowBlur = 14; }
      g.font = `bold ${prop ? 40 : 34}px ${SANS}`;
      const ls = wrap(g, name, 220); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 104 : 178) + k * 42 - (ls.length - 1) * (prop ? 20 : 0)));
      if (prop) { g.font = `bold 24px ${SANS}`; g.fillStyle = '#c9c3ff'; g.shadowBlur = 0; g.fillText(b.price.toLocaleString() + ' 信用點', 128, 214); }
    } else if (theme === 'alien') {
      // 骨白板＋黑色生物機械紋路＋主題色發光條
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#f1e9d6'); gr.addColorStop(1, '#d9ceb4');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = 'rgba(40,30,50,0.16)'; g.lineWidth = 3;
      for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(0, 30 + k * 34); g.bezierCurveTo(80, 18 + k * 34 + rnd(-14, 14), 170, 42 + k * 34 + rnd(-14, 14), 256, 30 + k * 34); g.stroke(); }
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(40,30,50,0.10)'; g.beginPath(); g.ellipse(rnd(20, 236), rnd(20, 236), rnd(6, 16), rnd(3, 7), rnd(0, 3), 0, 7); g.fill(); }
      const acc = prop ? b.color : ({ item: '#ffb347', luck: '#3fd8c8', bad: '#e04a6a', start: '#8a6bff', jail: '#e04a6a', gotojail: '#e04a6a', free: '#3fd8c8', tax: '#ffb347', teleport: '#8a6bff' }[b.type] || '#8a6bff');
      g.strokeStyle = '#2a2232'; g.lineWidth = 10; g.strokeRect(5, 5, 246, 246);
      g.strokeStyle = '#bfb39a'; g.lineWidth = 3; g.strokeRect(13, 13, 230, 230);
      for (const [x, y] of [[5, 5], [251, 5], [5, 251], [251, 251]]) { g.fillStyle = '#2a2232'; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.fillStyle = acc; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
      g.fillStyle = acc; g.fillRect(16, 16, 224, prop ? 30 : 8);
      g.fillStyle = '#2b2430';
      if (!prop) { g.font = `80px ${EMOJI}`; g.fillText(icon, 128, 96); }
      g.font = `bold ${prop ? 38 : 32}px ${SANS}`;
      const ls = wrap(g, name, 210); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 110 : 180) + k * 40 - (ls.length - 1) * (prop ? 20 : 0)));
      if (prop) { g.font = `bold 26px ${SANS}`; g.fillStyle = '#6a5a7a'; g.fillText(b.price.toLocaleString() + ' 星幣', 128, 214); }
    } else if (theme === 'buddha') {
      // 朱漆底＋雙金框＋四角祥雲
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#7a1416'); gr.addColorStop(1, '#4a0a0c');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      for (let k = 0; k < 160; k++) { g.fillStyle = `rgba(0,0,0,${rnd(0.04, 0.12)})`; g.fillRect(rnd(0, 256), rnd(0, 256), rnd(1, 3), rnd(4, 18)); }
      g.strokeStyle = '#e8b83a'; g.lineWidth = 7; g.strokeRect(8, 8, 240, 240); g.lineWidth = 2; g.strokeRect(19, 19, 218, 218);
      const cloud = (x, y, sx, sy) => { g.save(); g.translate(x, y); g.scale(sx, sy); g.strokeStyle = '#e8b83a'; g.lineWidth = 3; g.beginPath(); g.arc(14, 14, 10, Math.PI, Math.PI * 2.4); g.stroke(); g.beginPath(); g.arc(26, 22, 7, Math.PI * 1.2, Math.PI * 2.6); g.stroke(); g.restore(); };
      cloud(20, 20, 1, 1); cloud(236, 20, -1, 1); cloud(20, 236, 1, -1); cloud(236, 236, -1, -1);
      const acc = prop ? b.color : ({ item: '#ff9f1c', luck: '#ffd34a', bad: '#9b5cff', start: '#ffd34a', jail: '#9b5cff', gotojail: '#9b5cff', free: '#5ee0c0', tax: '#ffd34a', teleport: '#5ee0c0' }[b.type] || '#ffd34a');
      if (prop) { g.fillStyle = acc; g.fillRect(19, 19, 218, 28); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(19, 44, 218, 3); }
      g.fillStyle = '#ffe3a0'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4;
      if (!prop) { g.font = `78px ${EMOJI}`; g.fillText(icon, 128, 96); }
      g.font = `bold ${prop ? 40 : 34}px ${SERIF}`;
      const ls = wrap(g, name, 210); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 112 : 182) + k * 42 - (ls.length - 1) * (prop ? 20 : 0)));
      if (prop) { g.font = `bold 25px ${SERIF}`; g.fillStyle = '#e8b83a'; g.fillText(b.price.toLocaleString() + ' 功德', 128, 214); }
    } else if (theme === 'magic') {
      // 羊皮紙＋墨線花框＋四角星
      const gr = g.createRadialGradient(128, 128, 30, 128, 128, 190); gr.addColorStop(0, '#f3e6c4'); gr.addColorStop(1, '#cdb487');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      for (let k = 0; k < 220; k++) { g.fillStyle = `rgba(110,80,40,${rnd(0.03, 0.1)})`; g.beginPath(); g.arc(rnd(0, 256), rnd(0, 256), rnd(1, 5), 0, 7); g.fill(); }
      g.strokeStyle = '#2b2140'; g.lineWidth = 6; g.strokeRect(9, 9, 238, 238); g.lineWidth = 1.5; g.strokeRect(18, 18, 220, 220);
      const star = (x, y, r) => { g.fillStyle = '#b8892a'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? r * 0.38 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); };
      [[18, 18], [238, 18], [18, 238], [238, 238]].forEach(([x, y]) => star(x, y, 13));
      const acc = prop ? b.color : ({ item: '#c0762a', luck: '#3a7bd5', bad: '#7a2a8a', start: '#b8892a', jail: '#7a2a8a', gotojail: '#7a2a8a', free: '#c0762a', tax: '#5a4a3a', teleport: '#3a9a7a' }[b.type] || '#3a7bd5');
      if (prop) { g.fillStyle = acc; g.fillRect(24, 24, 208, 26); g.fillStyle = '#b8892a'; g.fillRect(24, 50, 208, 2); }
      g.fillStyle = '#2b2140';
      if (!prop) { g.font = `78px ${EMOJI}`; g.fillText(icon, 128, 96); }
      g.font = `bold ${prop ? 40 : 34}px ${SERIF}`;
      const ls = wrap(g, name, 206); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 112 : 182) + k * 42 - (ls.length - 1) * (prop ? 20 : 0)));
      if (prop) { g.font = `bold 24px ${SERIF}`; g.fillStyle = '#6a4a20'; g.fillText(b.price.toLocaleString() + ' 魔法幣', 128, 214); }
    } else if (theme === 'ragnarok') {
      // 大理石＋金邊
      g.fillStyle = '#f3efe6'; g.fillRect(0, 0, 256, 256);
      for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(120,110,100,${rnd(0.05, 0.15)})`; g.lineWidth = rnd(0.5, 2); g.beginPath(); let x = rnd(0, 256), y = rnd(0, 256); g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += rnd(-40, 40); y += rnd(-40, 40); g.lineTo(x, y); } g.stroke(); }
      g.strokeStyle = '#b8912f'; g.lineWidth = 7; g.strokeRect(9, 9, 238, 238); g.lineWidth = 2; g.strokeRect(20, 20, 216, 216);
      if (prop) { g.fillStyle = b.color; g.fillRect(20, 20, 216, 30); }
      else { const bgc = { luck: 'rgba(242,201,76,0.35)', bad: 'rgba(70,40,100,0.35)', item: 'rgba(255,159,28,0.3)' }[b.type]; if (bgc) { g.fillStyle = bgc; g.fillRect(20, 20, 216, 216); } }
      g.fillStyle = '#3b2f1e';
      if (!prop) { g.font = `80px ${EMOJI}`; g.fillText(icon, 128, 98); }
      g.font = `bold ${prop ? 40 : 34}px ${SERIF}`;
      const ls = wrap(g, name, 210); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 112 : 182) + k * 42 - (ls.length - 1) * (prop ? 20 : 0)));
      if (prop) { g.font = `bold 26px ${SERIF}`; g.fillStyle = '#8a6a1f'; g.fillText(b.price.toLocaleString() + ' 金幣', 128, 214); }
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
      // ===== 無人深空色彩的外星球＋Giger 生物機械棋盤＋中央星門 =====
      // 天空：粉紫到青綠的漸層，加星星和星雲
      { const [c, g] = cvs(64, 512); const gr = g.createLinearGradient(0, 0, 0, 512);
        gr.addColorStop(0, '#2a1a5e'); gr.addColorStop(0.3, '#7b3fa0'); gr.addColorStop(0.5, '#e86aa6'); gr.addColorStop(0.58, '#ffb38a'); gr.addColorStop(0.62, '#f4a7a6'); gr.addColorStop(1, '#5a2e6e');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 512); for (let k = 0; k < 120; k++) { g.fillStyle = `rgba(255,255,255,${rnd(0.3, 0.9)})`; g.fillRect(rnd(0, 64), rnd(0, 200), 1, 1); }
        const sky = new T.Mesh(new T.SphereGeometry(140, 32, 16), new T.MeshBasicMaterial({ map: tex(T, c), side: T.BackSide, fog: false, depthWrite: false })); scene.add(sky); }
      scene.background = null;
      // 星雲
      { const [c, g] = cvs(512, 256); for (let k = 0; k < 40; k++) { const x = rnd(40, 470), y = rnd(40, 216), r = rnd(30, 110), col = ['255,120,200', '120,230,255', '190,130,255', '255,190,120'][k % 4]; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},0.16)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); }
        const neb = new T.Mesh(new T.PlaneGeometry(160, 80), new T.MeshBasicMaterial({ map: tex(T, c), transparent: true, fog: false, depthWrite: false, blending: T.AdditiveBlending })); neb.position.set(10, 48, -110); scene.add(neb); upd.push(t => { neb.material.opacity = 0.8 + Math.sin(t * 0.3) * 0.2; }); }
      // 帶光環的大行星＋小衛星
      { const [c, g] = cvs(256, 128); for (let y = 0; y < 128; y++) { const h = 20 + Math.sin(y * 0.18) * 14 + Math.sin(y * 0.05) * 20; g.fillStyle = `hsl(${185 + h},60%,${55 + Math.sin(y * 0.3) * 8}%)`; g.fillRect(0, y, 256, 1); }
        const pl = new T.Mesh(new T.SphereGeometry(16, 40, 24), new T.MeshStandardMaterial({ map: tex(T, c), roughness: 0.9, emissive: '#3a2a6a', emissiveIntensity: 0.3, fog: false })); pl.position.set(-46, 34, -88); pl.rotation.z = 0.35; scene.add(pl);
        const ring = new T.Mesh(new T.RingGeometry(21, 30, 64), new T.MeshBasicMaterial({ color: '#ffd9b0', transparent: true, opacity: 0.55, side: T.DoubleSide, fog: false })); ring.position.copy(pl.position); ring.rotation.set(1.25, 0.2, 0.35); scene.add(ring);
        const moon = new T.Mesh(new T.SphereGeometry(4, 24, 16), new T.MeshStandardMaterial({ color: '#ffd0e0', roughness: 1, emissive: '#7a4060', emissiveIntensity: 0.25, fog: false })); moon.position.set(52, 40, -80); scene.add(moon);
        upd.push(t => { pl.rotation.y = t * 0.02; ring.rotation.z = 0.35 + Math.sin(t * 0.05) * 0.02; }); }
      // 地面：珊瑚色沙地＋紋理
      { const [c, g] = cvs(512); g.fillStyle = '#e9855f'; g.fillRect(0, 0, 512, 512);
        for (let k = 0; k < 140; k++) { g.fillStyle = `rgba(${rnd(170, 255)},${rnd(80, 140)},${rnd(80, 140)},${rnd(0.08, 0.25)})`; g.beginPath(); g.ellipse(rnd(0, 512), rnd(0, 512), rnd(10, 60), rnd(4, 20), rnd(0, 3), 0, 7); g.fill(); }
        for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(80,230,210,${rnd(0.1, 0.3)})`; g.beginPath(); g.arc(rnd(0, 512), rnd(0, 512), rnd(4, 14), 0, 7); g.fill(); }
        const gnd = add(new T.PlaneGeometry(260, 260), M('#ffffff', { map: tex(T, c, 18), roughness: 0.95 }), 0, -0.9, 0, false); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = q.high; }
      const bone = M('#e3d9c0', { roughness: 0.4, metalness: 0.15 }), black = M('#231c2c', { roughness: 0.18, metalness: 0.75 });
      // 生物機械平台：黑色金屬底座＋一圈骨頭肋條＋管線
      const plat = add(new T.CylinderGeometry(8.6, 8.0, 0.75, 32), black, 0, -0.78, 0);
      for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; const rb = add(new T.TorusGeometry(0.5, 0.08, 6, 12, Math.PI), bone, Math.cos(a) * 8.45, -0.85, Math.sin(a) * 8.45, false); rb.rotation.y = -a; }
      const tube = add(new T.TorusGeometry(8.75, 0.16, 10, 96), black, 0, -0.45, 0); tube.rotation.x = Math.PI / 2; void plat;
      // 遠方：巨大骨骼拱門與脊椎塔（Giger）
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + 0.4, d = 34;
        for (let r = 0; r < 4; r++) { const arch = add(new T.TorusGeometry(6 + r * 0.25, 0.32 - r * 0.04, 8, 28, Math.PI), r % 2 ? black : bone, Math.cos(a) * (d + r * 1.3), -0.9, Math.sin(a) * (d + r * 1.3), false); arch.rotation.y = -a + Math.PI / 2; } }
      for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 1.1, d = rnd(44, 52), h = rnd(10, 18);
        for (let j = 0; j < 14; j++) { const v = add(new T.TorusGeometry(1.1 - j * 0.05, 0.38, 8, 16), j % 2 ? bone : black, Math.cos(a) * d, j * h / 14, Math.sin(a) * d, false); v.rotation.x = Math.PI / 2; } }
      // 外星植物：球莖樹、巨大蘑菇、水晶、會呼吸的發光孢子
      const glowM = (c) => new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, roughness: 0.3, transparent: true, opacity: 0.85 });
      const flora = (x, z, kind, s) => {
        if (kind === 0) { // 球莖樹
          const pts = []; for (let j = 0; j < 5; j++) pts.push(new T.Vector3(x + Math.sin(j) * 0.3 * s, j * 1.1 * s, z + Math.cos(j * 0.7) * 0.3 * s));
          add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, 0.18 * s, 6), M('#5a2e6e', { roughness: 0.6 }), 0, -0.9, 0, false);
          const b = add(new T.SphereGeometry(0.9 * s, 16, 12), glowM(['#7df9ff', '#ff79c6', '#ffd27a'][Math.floor(rnd(0, 3))]), pts[4].x, pts[4].y - 0.4, pts[4].z, false);
          upd.push(t => { const k = 1 + Math.sin(t * 1.5 + x) * 0.06; b.scale.set(k, k * 1.1, k); b.material.emissiveIntensity = 0.6 + Math.sin(t * 1.5 + x) * 0.3; });
        } else if (kind === 1) { // 巨大蘑菇
          add(new T.CylinderGeometry(0.25 * s, 0.4 * s, 2.6 * s, 10), M('#f6e6d0', { roughness: 0.8 }), x, -0.9 + 1.3 * s, z, false);
          const cap = add(new T.SphereGeometry(1.5 * s, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), M(['#3fd8c8', '#a66bff', '#ff79c6'][Math.floor(rnd(0, 3))], { roughness: 0.5, emissive: '#301a40', emissiveIntensity: 0.3 }), x, -0.9 + 2.5 * s, z, false); cap.scale.y = 0.6;
          for (let j = 0; j < 7; j++) add(new T.SphereGeometry(0.12 * s, 6, 6), glowM('#fff6b0'), x + Math.cos(j) * 0.9 * s, -0.9 + 2.75 * s, z + Math.sin(j) * 0.9 * s, false);
        } else if (kind === 2) { // 水晶簇
          const col = ['#7df9ff', '#ff79c6', '#b388ff'][Math.floor(rnd(0, 3))];
          for (let j = 0; j < 5; j++) { const c = add(new T.OctahedronGeometry(rnd(0.4, 0.9) * s, 0), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.8 }), x + rnd(-0.6, 0.6) * s, -0.5 + rnd(0, 0.8) * s, z + rnd(-0.6, 0.6) * s, false); c.scale.y = rnd(1.6, 2.6); c.rotation.set(rnd(-0.3, 0.3), rnd(0, 3), rnd(-0.3, 0.3)); }
        } else { // 浮空岩塊
          const r = add(new T.DodecahedronGeometry(rnd(0.8, 1.6) * s, 0), M('#8a5a7a', { flatShading: true, roughness: 0.9 }), x, rnd(4, 9), z, false); const y0 = r.position.y, ph = rnd(0, 6);
          add(new T.ConeGeometry(0.5 * s, 1.4 * s, 6), M('#6a4060', { flatShading: true }), 0, 0, 0, false).position.set(x, y0 - 1.1 * s, z);
          upd.push(t => { r.position.y = y0 + Math.sin(t * 0.5 + ph) * 0.4; r.rotation.y = t * 0.05 + ph; });
        }
      };
      for (let k = 0; k < (q.high ? 46 : 24); k++) { const a = rnd(0, 6.28), d = rnd(11, 30); flora(Math.cos(a) * d, Math.sin(a) * d, k % 4, rnd(0.7, 1.4)); }
      // 中央：古老星門（立著的石環＋符文＋波動的事件視界）
      { const gate = new T.Group(); gate.position.set(0, 0, 0); scene.add(gate); (scene.userData.occl = scene.userData.occl || []).push({ g: gate, c: new T.Vector3(0, 2.1, 0), r: 2.6 });
        const stone = M('#8d8798', { roughness: 0.6, metalness: 0.3 });
        const ringM = new T.Mesh(new T.TorusGeometry(1.9, 0.32, 16, 64), stone); ringM.position.y = 2.15; gate.add(ringM);
        const inner = new T.Mesh(new T.TorusGeometry(1.62, 0.07, 8, 64), black); inner.position.y = 2.15; gate.add(inner);
        const runes = []; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + Math.PI / 2; const ch = new T.Mesh(new T.ConeGeometry(0.2, 0.32, 3), new T.MeshStandardMaterial({ color: '#ffb347', emissive: '#ff8a00', emissiveIntensity: 0.2 })); ch.position.set(Math.cos(a) * 2.25, 2.15 + Math.sin(a) * 2.25, 0); ch.rotation.z = a + Math.PI / 2; gate.add(ch); runes.push(ch); }
        const [c, g] = cvs(256); const tx = tex(T, c);
        const hz = new T.Mesh(new T.CircleGeometry(1.6, 48), new T.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0.92, side: T.DoubleSide })); hz.position.y = 2.15; gate.add(hz);
        add(new T.BoxGeometry(4.6, 0.3, 1.2), stone, 0, 0.0, 0); add(new T.BoxGeometry(3.4, 0.3, 1.0), stone, 0, 0.3, 0);
        const L = new T.PointLight('#7fc8ff', 6, 9, 1.6); L.position.set(0, 2.2, 1.2); scene.add(L);
        upd.push(t => {
          gate.rotation.y = Math.sin(t * 0.15) * 0.5;
          const kk = Math.floor(t * 1.2) % 12; runes.forEach((r, i) => r.material.emissiveIntensity = i < kk ? 1.6 : 0.2);
          g.fillStyle = '#16307a'; g.fillRect(0, 0, 256, 256);
          for (let i = 0; i < 6; i++) { const rr = ((t * 40 + i * 22) % 128); g.strokeStyle = `rgba(150,220,255,${0.6 - rr / 220})`; g.lineWidth = 6; g.beginPath(); g.arc(128 + Math.sin(t + i) * 6, 128 + Math.cos(t * 1.3 + i) * 6, rr, 0, 6.283); g.stroke(); }
          const cg = g.createRadialGradient(128, 128, 0, 128, 128, 128); cg.addColorStop(0, 'rgba(255,255,255,0.75)'); cg.addColorStop(0.4, 'rgba(120,200,255,0.25)'); cg.addColorStop(1, 'rgba(30,60,160,0)'); g.fillStyle = cg; g.fillRect(0, 0, 256, 256);
          tx.needsUpdate = true; L.intensity = 5 + Math.sin(t * 2) * 1.5;
        });
      }
      // 漂浮的彩色孢子
      if (q.high) {
        const N = 400, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), pal = [[1, 0.5, 0.8], [0.5, 1, 1], [1, 0.85, 0.5]];
        for (let i = 0; i < N; i++) { pos.set([rnd(-24, 24), rnd(0, 10), rnd(-24, 24)], i * 3); col.set(pal[i % 3], i * 3); }
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
        const pts = new T.Points(geo, new T.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.85 })); scene.add(pts);
        upd.push((t) => { pts.rotation.y = t * 0.015; pts.position.y = Math.sin(t * 0.3) * 0.4; });
      }
    } else if (theme === 'buddha') {
      // ===== 夜晚的廟會：紅燈籠、香煙、千本鳥居、金色佛塔、遠方雪山與經幡 =====
      { const [c, g] = cvs(64, 512); const gr = g.createLinearGradient(0, 0, 0, 512);
        gr.addColorStop(0, '#07040f'); gr.addColorStop(0.35, '#1d0b2a'); gr.addColorStop(0.55, '#4a1230'); gr.addColorStop(0.62, '#7a2a2a'); gr.addColorStop(1, '#120508');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 512); for (let k = 0; k < 140; k++) { g.fillStyle = `rgba(255,240,220,${rnd(0.2, 0.8)})`; g.fillRect(rnd(0, 64), rnd(0, 220), 1, 1); }
        scene.add(new T.Mesh(new T.SphereGeometry(140, 32, 16), new T.MeshBasicMaterial({ map: tex(T, c), side: T.BackSide, fog: false, depthWrite: false }))); }
      scene.background = null;
      // 血月
      const moon = add(new T.SphereGeometry(5, 24, 16), new T.MeshBasicMaterial({ color: '#ff6a4a', fog: false }), -30, 42, -95, false);
      const halo = add(new T.PlaneGeometry(26, 26), new T.MeshBasicMaterial({ map: (() => { const [c, g] = cvs(128); const r = g.createRadialGradient(64, 64, 10, 64, 64, 64); r.addColorStop(0, 'rgba(255,90,60,.6)'); r.addColorStop(1, 'rgba(255,90,60,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return tex(T, c); })(), transparent: true, fog: false, depthWrite: false, blending: T.AdditiveBlending }), -30, 42, -94, false); halo.lookAt(0, 0, 0); void moon;
      // 地面：石板廟埕
      { const [c, g] = cvs(512); g.fillStyle = '#2a2224'; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 * 32; x < 512; x += 64) { g.fillStyle = `rgb(${rnd(48, 62)},${rnd(40, 50)},${rnd(42, 52)})`; g.fillRect(x + 2, y + 2, 60, 60); }
        const gnd = add(new T.PlaneGeometry(160, 160), M('#ffffff', { map: tex(T, c, 14), roughness: 0.85 }), 0, -0.36, 0, false); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = q.high; }
      const red = M('#b3191c', { roughness: 0.45 }), gold = M('#e0b040', { metalness: 0.85, roughness: 0.25 }), dark = M('#1c1416', { roughness: 0.7 }), jade = M('#2f7a5a', { roughness: 0.5 });
      // 中央：燕尾脊的廟（紅柱、金屋脊、翹起的燕尾）
      { const tp = new T.Group(); scene.add(tp);
        const mk = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = q.high; tp.add(m); return m; };
        mk(new T.BoxGeometry(4.2, 0.3, 3.2), M('#8a7a70', { roughness: 0.9 }), 0, -0.2, 0);
        for (let k = 0; k < 8; k++) mk(new T.CylinderGeometry(0.12, 0.12, 1.6, 12), red, -1.7 + (k % 4) * 1.13, 0.75, k < 4 ? -1.1 : 1.1);
        mk(new T.BoxGeometry(3.6, 1.3, 2.0), M('#5a1012', { roughness: 0.6 }), 0, 0.6, 0);
        mk(new T.BoxGeometry(1.0, 1.0, 0.05), gold, 0, 0.6, 1.01);
        const roof = (y, w, d, h) => { const r = mk(new T.CylinderGeometry(0.01, 1, h, 4, 1), M('#d0702a', { roughness: 0.35, metalness: 0.2 }), 0, y, 0); r.rotation.y = Math.PI / 4; r.scale.set(w * 0.72, 1, d * 0.72); mk(new T.BoxGeometry(w * 0.85, 0.1, 0.12), gold, 0, y + h / 2 - 0.02, 0);
          [-1, 1].forEach(sd => { const tail = mk(new T.ConeGeometry(0.08, 0.7, 6), gold, sd * w * 0.47, y + h / 2 + 0.18, 0); tail.rotation.z = sd * 0.9; }); };
        roof(1.8, 4.6, 3.0, 0.9); roof(2.75, 3.0, 2.0, 0.8);
        // 屋脊上的雙龍搶珠
        const pearl = mk(new T.SphereGeometry(0.18, 16, 12), M('#ffd84a', { emissive: '#ff9a00', emissiveIntensity: 1.5 }), 0, 3.45, 0);
        [-1, 1].forEach(sd => { const pts = [0, 1, 2, 3, 4].map(j => new T.Vector3(sd * (0.3 + j * 0.22), 3.2 + Math.sin(j * 1.5) * 0.15, Math.cos(j * 1.3) * 0.08)); mk(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 20, 0.06, 6), jade, 0, 0, 0); });
        const L = new T.PointLight('#ffb050', 10, 9, 1.4); L.position.set(0, 2.2, 1.8); scene.add(L);
        upd.push(t => { pearl.rotation.y = t; L.intensity = 9 + Math.sin(t * 7) * 0.8 + Math.sin(t * 13) * 0.5; });
        // 大香爐＋香煙
        mk(new T.CylinderGeometry(0.45, 0.35, 0.5, 16), M('#6a5a3a', { metalness: 0.7, roughness: 0.4 }), 0, 0.05, 2.1);
        const smoke = []; const sm = new T.MeshBasicMaterial({ color: '#d8ccd8', transparent: true, opacity: 0.18, depthWrite: false });
        for (let k = 0; k < 14; k++) { const s = mk(new T.SphereGeometry(0.2, 8, 6), sm, 0, 0.4, 2.1); s.userData.o = k / 14; smoke.push(s); }
        upd.push(t => smoke.forEach(s => { const p = (t * 0.15 + s.userData.o) % 1; s.position.set(Math.sin(t + p * 9) * 0.25 * p, 0.4 + p * 3.2, 2.1 + Math.cos(p * 5) * 0.2); s.scale.setScalar(0.6 + p * 2.4); s.material.opacity = 0.2 * (1 - p); }));
      }
      // 紅燈籠串：繞棋盤外圈
      const lantM = M('#ff3a2a', { emissive: '#ff2a10', emissiveIntensity: 1.6, roughness: 0.5 });
      const lanterns = [];
      const NL = q.high ? 40 : 24, lp = [];
      for (let k = 0; k < NL; k++) { const a = k / NL * Math.PI * 2, d = 10.8; const l = add(new T.SphereGeometry(0.16, 12, 10), lantM, Math.cos(a) * d, 2.4 + Math.sin(k * 0.7) * 0.15, Math.sin(a) * d, false); l.scale.y = 1.25; lanterns.push(l);
        add(new T.CylinderGeometry(0.1, 0.1, 0.05, 10), M('#2a1a10'), l.position.x, l.position.y + 0.21, l.position.z, false); lp.push(new T.Vector3(l.position.x, 2.75, l.position.z)); }
      { lp.push(lp[0].clone()); const ln = new T.Line(new T.BufferGeometry().setFromPoints(lp), new T.LineBasicMaterial({ color: '#3a2a1a' })); scene.add(ln);
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; add(new T.CylinderGeometry(0.06, 0.08, 3.1, 8), red, Math.cos(a) * 10.8, 1.2, Math.sin(a) * 10.8, false); } }
      for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4, L = new T.PointLight('#ff6a3a', 4, 10, 1.6); L.position.set(Math.cos(a) * 10.8, 2.4, Math.sin(a) * 10.8); scene.add(L); }
      upd.push(t => lanterns.forEach((l, k) => { l.position.y = 2.4 + Math.sin(t * 1.2 + k) * 0.06; l.material.emissiveIntensity = 1.4 + Math.sin(t * 9 + k * 3) * 0.15; }));
      // 千本鳥居：外圈一條紅色隧道
      const torii = (x, z, ry, s) => { const g2 = new T.Group(); g2.position.set(x, -0.36, z); g2.rotation.y = ry; g2.scale.setScalar(s); scene.add(g2);
        const mk = (geo, mat, px, py, pz) => { const m = new T.Mesh(geo, mat); m.position.set(px, py, pz); g2.add(m); return m; };
        const or = M('#e2401c', { roughness: 0.5 });
        [-0.7, 0.7].forEach(px => mk(new T.CylinderGeometry(0.08, 0.1, 2.2, 10), or, px, 1.1, 0));
        mk(new T.BoxGeometry(2.0, 0.12, 0.18), dark, 0, 2.25, 0); mk(new T.BoxGeometry(1.6, 0.1, 0.12), or, 0, 1.85, 0); return g2; };
      for (let k = 0; k < (q.high ? 28 : 14); k++) { const a = -0.6 + k * 0.05, d = 14; torii(Math.cos(a) * d, Math.sin(a) * d, -a, 1.3); }
      torii(0, 12, 0, 2.6);
      // 金色佛塔（泰式）
      const chedi = (x, z, s) => { const g2 = new T.Group(); g2.position.set(x, -0.36, z); g2.scale.setScalar(s); scene.add(g2);
        const pts = []; for (let i = 0; i <= 20; i++) { const t2 = i / 20; pts.push(new T.Vector2(t2 < 0.3 ? 1 - t2 * 0.6 : t2 < 0.55 ? 0.82 - (t2 - 0.3) * 0.4 : Math.max(0.02, 0.72 * (1 - (t2 - 0.55) / 0.45) ** 1.6), t2 * 5)); }
        const m = new T.Mesh(new T.LatheGeometry(pts, 24), gold); g2.add(m); return g2; };
      chedi(-16, -12, 2.2); chedi(-21, -6, 1.4); chedi(18, -14, 1.8);
      // 遠方雪山＋經幡
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2, d = rnd(38, 46), h = rnd(14, 24); add(new T.ConeGeometry(rnd(7, 11), h, 6), M('#2a2236', { roughness: 1, flatShading: true }), Math.cos(a) * d, h / 2 - 4, Math.sin(a) * d, false); add(new T.ConeGeometry(2.6, 4, 6), M('#d8dde8', { roughness: 1, flatShading: true }), Math.cos(a) * d, h - 5.6, Math.sin(a) * d, false); }
      { const cols = ['#2a5bd7', '#ffffff', '#d7262a', '#2a9a4a', '#f2c230'];
        for (let r = 0; r < 3; r++) { const a0 = 2.2 + r * 0.5; for (let k = 0; k < 18; k++) { const a = a0 + k * 0.018, d = 16 + k * 0.02, f = add(new T.PlaneGeometry(0.4, 0.5), new T.MeshStandardMaterial({ color: cols[k % 5], side: T.DoubleSide, roughness: 0.9 }), Math.cos(a) * d, 3.2 - Math.sin(k / 17 * Math.PI) * 0.8 + r * 0.6, Math.sin(a) * d, false); f.lookAt(0, f.position.y, 0); f.userData.k = k; upd.push(t => { f.rotation.x = Math.sin(t * 3 + k) * 0.3; }); } } }
      // 飄在空中的鬼火
      const wisps = []; const wm = new T.MeshBasicMaterial({ color: '#7affd0', transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false });
      for (let k = 0; k < (q.high ? 18 : 8); k++) { const a = rnd(0, 6.28), d = rnd(10.5, 20); const w = add(new T.SphereGeometry(0.12, 8, 6), wm, Math.cos(a) * d, rnd(0.5, 3), Math.sin(a) * d, false); w.userData = { a, d, h: w.position.y, s: rnd(0.2, 0.5) }; wisps.push(w); }
      upd.push(t => wisps.forEach((w, k) => { const u = w.userData; const a = u.a + t * u.s * 0.2; w.position.set(Math.cos(a) * u.d, u.h + Math.sin(t * 2 + k) * 0.4, Math.sin(a) * u.d); w.material.opacity = 0.4 + Math.sin(t * 5 + k) * 0.3; }));
    } else if (theme === 'magic') {
      // ===== 夜晚的魔法古堡：星空、月亮、漂浮蠟燭、尖塔、黑湖、森林 =====
      { const [c, g] = cvs(64, 512); const gr = g.createLinearGradient(0, 0, 0, 512);
        gr.addColorStop(0, '#05061a'); gr.addColorStop(0.4, '#14164a'); gr.addColorStop(0.58, '#3a2a6a'); gr.addColorStop(0.64, '#5a4a8a'); gr.addColorStop(1, '#0a0a1a');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 512); for (let k = 0; k < 200; k++) { g.fillStyle = `rgba(255,255,240,${rnd(0.3, 1)})`; g.fillRect(rnd(0, 64), rnd(0, 260), 1, 1); }
        scene.add(new T.Mesh(new T.SphereGeometry(140, 32, 16), new T.MeshBasicMaterial({ map: tex(T, c), side: T.BackSide, fog: false, depthWrite: false }))); }
      scene.background = null;
      add(new T.SphereGeometry(6, 24, 16), new T.MeshBasicMaterial({ color: '#fff6d8', fog: false }), 40, 46, -90, false);
      // 草地＋石板小路
      { const [c, g] = cvs(512); g.fillStyle = '#2c3c30'; g.fillRect(0, 0, 512, 512); for (let k = 0; k < 3000; k++) { g.fillStyle = `rgba(${rnd(30, 60)},${rnd(50, 80)},${rnd(40, 60)},${rnd(0.2, 0.5)})`; g.fillRect(rnd(0, 512), rnd(0, 512), rnd(1, 3), rnd(2, 6)); }
        const gnd = add(new T.PlaneGeometry(160, 160), M('#ffffff', { map: tex(T, c, 10), roughness: 1 }), 0, -0.36, 0, false); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = q.high; }
      const stone = M('#6a6478', { roughness: 0.85 }), roofM = M('#2a2550', { roughness: 0.5, metalness: 0.2 }), win = M('#ffcf6a', { emissive: '#ffb030', emissiveIntensity: 1.6 });
      const tower = (x, z, r, h, s) => { const g2 = new T.Group(); g2.position.set(x, -0.36, z); g2.scale.setScalar(s || 1); scene.add(g2);
        const body = new T.Mesh(new T.CylinderGeometry(r, r * 1.08, h, 14), stone); body.position.y = h / 2; body.castShadow = q.high; g2.add(body);
        const rf = new T.Mesh(new T.ConeGeometry(r * 1.35, r * 3, 14), roofM); rf.position.y = h + r * 1.5; g2.add(rf);
        for (let k = 0; k < Math.floor(h / 1.2); k++) { const a = k * 2.3; const w = new T.Mesh(new T.PlaneGeometry(r * 0.3, r * 0.5), win); w.position.set(Math.cos(a) * (r + 0.01), 0.8 + k * 1.1, Math.sin(a) * (r + 0.01)); w.lookAt(Math.cos(a) * 9, w.position.y, Math.sin(a) * 9); g2.add(w); }
        return g2; };
      // 中央：古堡主塔群
      tower(0, 0, 0.9, 4.2); tower(-1.5, -0.6, 0.55, 3.0); tower(1.5, -0.6, 0.55, 3.0); tower(-0.9, 1.1, 0.45, 2.2); tower(0.9, 1.1, 0.45, 2.2);
      add(new T.BoxGeometry(3.4, 1.4, 1.2), stone, 0, 0.35, -0.2);
      const crystal = add(new T.OctahedronGeometry(0.35, 0), M('#9ad8ff', { emissive: '#5ab0ff', emissiveIntensity: 1.8, transparent: true, opacity: 0.9 }), 0, 7.4, 0, false);
      const cL = new T.PointLight('#8ac8ff', 8, 10, 1.4); cL.position.set(0, 6.5, 0); scene.add(cL);
      upd.push(t => { crystal.rotation.y = t * 0.8; crystal.position.y = 7.4 + Math.sin(t * 1.5) * 0.15; });
      // 遠方尖塔環繞
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2 + 0.1, d = rnd(20, 30); tower(Math.cos(a) * d, Math.sin(a) * d, rnd(0.8, 1.6), rnd(5, 12), 1); }
      // 漂浮蠟燭
      const candles = []; const wax = M('#f5efe0', { roughness: 0.6 }), flame = new T.MeshBasicMaterial({ color: '#ffd27a' });
      for (let k = 0; k < (q.high ? 60 : 30); k++) { const a = rnd(0, 6.28), d = rnd(3, 9.5); const c = new T.Group(); c.position.set(Math.cos(a) * d, rnd(2.4, 4.5), Math.sin(a) * d); scene.add(c);
        const b2 = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.3, 8), wax); c.add(b2); const f = new T.Mesh(new T.SphereGeometry(0.035, 6, 6), flame); f.position.y = 0.19; f.scale.y = 1.6; c.add(f); c.userData.h = c.position.y; candles.push(c); }
      for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2, L = new T.PointLight('#ffc070', 3.5, 9, 1.6); L.position.set(Math.cos(a) * 6, 3.6, Math.sin(a) * 6); scene.add(L); }
      upd.push(t => candles.forEach((c, k) => { c.position.y = c.userData.h + Math.sin(t * 0.9 + k) * 0.12; }));
      // 黑湖＋迷霧森林
      { const lake = add(new T.CircleGeometry(9, 40), M('#0a1424', { roughness: 0.05, metalness: 0.6 }), -4, -0.34, -20, false); lake.rotation.x = -Math.PI / 2; lake.scale.x = 2; }
      const pine = M('#122018', { flatShading: true, roughness: 1 });
      for (let k = 0; k < (q.high ? 60 : 28); k++) { const a = rnd(0, 6.28), d = rnd(12, 40); if (Math.abs(Math.sin(a) * d + 20) < 5 && Math.abs(Math.cos(a) * d + 4) < 16) continue; const h = rnd(2.5, 6); add(new T.ConeGeometry(h * 0.28, h, 6), pine, Math.cos(a) * d, h / 2 - 0.36, Math.sin(a) * d, false); }
      // 飛過的貓頭鷹剪影（小小的）＋魔法光點
      const motes = []; const mm = new T.MeshBasicMaterial({ color: '#c8b0ff', transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false });
      for (let k = 0; k < (q.high ? 40 : 18); k++) { const m = add(new T.SphereGeometry(0.05, 6, 4), mm, rnd(-12, 12), rnd(0.3, 5), rnd(-12, 12), false); m.userData = { x: m.position.x, z: m.position.z, h: m.position.y, s: rnd(0.3, 1) }; motes.push(m); }
      upd.push(t => motes.forEach((m, k) => { const u = m.userData; m.position.set(u.x + Math.sin(t * u.s + k) * 0.6, u.h + Math.sin(t * 0.7 * u.s + k) * 0.5, u.z + Math.cos(t * u.s + k) * 0.6); }));
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
    if (theme === 'cyber') { // 夜城：拉麵攤 → 霓虹小店 → 膠囊公寓 → 企業摩天塔，每一級長得完全不一樣
      const neon = (c, k) => M(c, { emissive: c, emissiveIntensity: k || 2.2, roughness: 0.4 }), steel = M('#2a2838', { roughness: 0.35, metalness: 0.7 }), dark = M('#14121e', { roughness: 0.5, metalness: 0.5 });
      const sign = (txt, w, h, col) => { const [c, cg] = cvs(128, Math.round(128 * h / w)); cg.fillStyle = '#0a0812'; cg.fillRect(0, 0, c.width, c.height); cg.shadowColor = col; cg.shadowBlur = 12; cg.fillStyle = col; cg.font = `900 ${Math.round(c.height * 0.7)}px ${SANS}`; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.fillText(txt, c.width / 2, c.height / 2 + 2); return new T.MeshBasicMaterial({ map: tex(T, c) }); };
      const vsign = (txt, col) => { const [c, cg] = cvs(48, 160); cg.fillStyle = '#0a0812'; cg.fillRect(0, 0, 48, 160); cg.shadowColor = col; cg.shadowBlur = 10; cg.fillStyle = col; cg.font = `900 34px ${SANS}`; cg.textAlign = 'center'; txt.split('').forEach((ch, k) => cg.fillText(ch, 24, 40 + k * 40)); return new T.MeshBasicMaterial({ map: tex(T, c) }); };
      if (level === 1) { // 路邊拉麵攤：推車、斜屋簷、布簾、紅燈籠、熱氣、板凳
        add(new T.BoxGeometry(0.5, 0.26, 0.3), M('#5a3a24', { roughness: 0.8 }), 0, 0.2, 0);
        add(new T.BoxGeometry(0.54, 0.03, 0.34), M('#8a6040'), 0, 0.345, 0);
        [-0.22, 0.22].forEach(x => add(new T.CylinderGeometry(0.012, 0.012, 0.38, 6), M('#3a2a1a'), x, 0.53, -0.12));
        const roof = add(new T.BoxGeometry(0.62, 0.025, 0.42), M('#c8402a'), 0, 0.72, 0); roof.rotation.x = 0.18;
        for (let k = 0; k < 4; k++) add(new T.PlaneGeometry(0.12, 0.13), neon(ctx.color, 0.9), -0.2 + k * 0.135, 0.62, 0.19);
        const lan = add(new T.SphereGeometry(0.05, 12, 10), neon('#ff3a2a', 2.5), 0.3, 0.6, 0.17); lan.scale.y = 1.3;
        [-0.16, 0.16].forEach(x => add(new T.CylinderGeometry(0.035, 0.035, 0.03, 10), M('#c0c0c0', { metalness: 0.8 }), x, 0.37, 0.05));
        [-0.18, 0, 0.18].forEach(x => { add(new T.CylinderGeometry(0.04, 0.04, 0.02, 10), M('#c8402a'), x, 0.16, 0.3); add(new T.CylinderGeometry(0.008, 0.008, 0.15, 5), dark, x, 0.075, 0.3); });
        [-0.18, 0.18].forEach(x => { const wh = add(new T.CylinderGeometry(0.07, 0.07, 0.02, 14), dark, x, 0.07, -0.16); wh.rotation.x = Math.PI / 2; });
        // 霓虹燈串：沿著屋簷垂成弧線的彩色小燈泡，會輪流閃
        const bulbs = [], cols = ['#ff2e88', '#3ad0ff', '#ffe04a', '#7aff6a', ctx.color];
        for (let k = 0; k <= 12; k++) { const u = k / 12, x = -0.3 + u * 0.6, y = 0.69 - Math.sin(u * Math.PI) * 0.06; const b = add(new T.SphereGeometry(0.013, 8, 6), M(cols[k % 5], { emissive: cols[k % 5], emissiveIntensity: 2.4 }), x, y, 0.22); bulbs.push(b); }
        for (let k = 0; k <= 8; k++) { const u = k / 8, z = 0.22 - u * 0.42, y = 0.69 - Math.sin(u * Math.PI) * 0.05; const b = add(new T.SphereGeometry(0.013, 8, 6), M(cols[(k + 2) % 5], { emissive: cols[(k + 2) % 5], emissiveIntensity: 2.4 }), 0.31, y, z); bulbs.push(b); }
        const wire = new T.Line(new T.BufferGeometry().setFromPoints(Array.from({ length: 13 }, (_, k) => new T.Vector3(-0.3 + k / 12 * 0.6, 0.69 - Math.sin(k / 12 * Math.PI) * 0.06 + 0.012, 0.22))), new T.LineBasicMaterial({ color: '#111' })); g.add(wire);
        const ns = add(new T.PlaneGeometry(0.2, 0.07), sign('拉麵', 0.2, 0.07, '#ff2e88'), 0, 0.8, 0.13); ns.rotation.x = -0.18;
        upd.push(t => bulbs.forEach((b, k) => { b.material.emissiveIntensity = (Math.floor(t * 3) + k) % 3 === 0 ? 0.4 : 2.6; }));
        const steam = []; for (let k = 0; k < 4; k++) { const s = add(new T.SphereGeometry(0.04, 8, 6), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.3, depthWrite: false }), -0.16, 0.4, 0.05); s.userData.o = k / 4; steam.push(s); }
        upd.push(t => steam.forEach(s => { const p = (t * 0.5 + s.userData.o) % 1; s.position.y = 0.4 + p * 0.35; s.position.x = -0.16 + Math.sin(t * 2 + p * 6) * 0.03; s.scale.setScalar(0.6 + p * 1.5); s.material.opacity = 0.3 * (1 - p); }));
      } else if (level === 2) { // 霓虹小酒館：兩層、捲門、直立招牌、自動販賣機、冷氣、電線
        add(new T.BoxGeometry(0.56, 0.7, 0.48), M('#2a2236', { roughness: 0.6, metalness: 0.3 }), 0, 0.35, 0);
        add(new T.BoxGeometry(0.4, 0.26, 0.02), M('#ffcf8a', { emissive: '#ffb347', emissiveIntensity: 1.3 }), -0.04, 0.15, 0.25);
        for (let k = 0; k < 5; k++) add(new T.BoxGeometry(0.4, 0.008, 0.005), dark, -0.04, 0.05 + k * 0.05, 0.262);
        add(new T.PlaneGeometry(0.42, 0.13), sign('酒場', 0.42, 0.13, ctx.color), 0, 0.42, 0.245);
        add(new T.PlaneGeometry(0.1, 0.36), vsign('夜城', '#ff2e88'), 0.31, 0.5, 0.2).rotation.y = -Math.PI / 2;
        add(new T.BoxGeometry(0.03, 0.4, 0.12), dark, 0.29, 0.5, 0.2);
        const vm = add(new T.BoxGeometry(0.13, 0.26, 0.1), M('#e8eef2', { emissive: '#8ad8ff', emissiveIntensity: 0.5 }), 0.24, 0.13, 0.3); void vm;
        add(new T.PlaneGeometry(0.1, 0.14), neon('#3ad0ff', 1.4), 0.24, 0.16, 0.351);
        const ac = add(new T.BoxGeometry(0.14, 0.09, 0.06), M('#9aa0a8'), -0.18, 0.55, 0.27); void ac; add(new T.CylinderGeometry(0.03, 0.03, 0.005, 12), dark, -0.18, 0.55, 0.302).rotation.x = Math.PI / 2;
        const w1 = add(new T.BoxGeometry(0.16, 0.12, 0.01), neon('#ffb070', 0.8), 0.08, 0.55, 0.245); void w1;
        const cable = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-0.28, 0.7, 0.24), new T.Vector3(-0.1, 0.6, 0.35), new T.Vector3(0.2, 0.66, 0.4), new T.Vector3(0.34, 0.74, 0.3)]), new T.LineBasicMaterial({ color: '#111' })); g.add(cable);
        const flick = sgn => sgn; void flick;
      } else if (level === 3) { // 膠囊公寓：一格一格亮燈的窗、外掛逃生梯、屋頂水塔、天線、直立霓虹
        const Hb = 1.35; const [c, cg] = cvs(64, 128); cg.fillStyle = '#1a1626'; cg.fillRect(0, 0, 64, 128);
        for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { const lit = Math.random() < 0.65; cg.fillStyle = lit ? ['#ffd28a', '#8ad8ff', '#ff8ac8', '#fff2c0'][(x + y) % 4] : '#0a0812'; cg.fillRect(4 + x * 15, 4 + y * 15.5, 11, 11); }
        const wm = new T.MeshStandardMaterial({ map: tex(T, c), emissiveMap: tex(T, c), emissive: '#ffffff', emissiveIntensity: 0.9, roughness: 0.6 });
        add(new T.BoxGeometry(0.46, Hb, 0.42), [M('#1a1626'), M('#1a1626'), M('#1a1626'), M('#1a1626'), wm, M('#1a1626')], 0, Hb / 2, 0);
        for (let k = 0; k < 6; k++) { const y = 0.2 + k * 0.2; add(new T.BoxGeometry(0.12, 0.01, 0.1), steel, 0.29, y, 0.08); const st = add(new T.BoxGeometry(0.02, 0.01, 0.2), steel, 0.3, y + 0.1, 0.08); st.rotation.x = (k % 2 ? 1 : -1) * 0.75; }
        add(new T.BoxGeometry(0.005, Hb, 0.005), steel, 0.35, Hb / 2, 0.13);
        add(new T.PlaneGeometry(0.09, 0.5), vsign('膠囊', ctx.color), -0.24, 0.85, 0.12).rotation.y = -Math.PI / 2;
        add(new T.CylinderGeometry(0.08, 0.08, 0.14, 12), M('#6a5040'), -0.1, Hb + 0.13, -0.06); add(new T.ConeGeometry(0.085, 0.05, 12), M('#5a4030'), -0.1, Hb + 0.225, -0.06);
        [-0.06, 0.06].forEach(x => add(new T.CylinderGeometry(0.006, 0.006, 0.12, 4), steel, -0.1 + x, Hb + 0.03, -0.06));
        add(new T.CylinderGeometry(0.005, 0.005, 0.35, 4), steel, 0.14, Hb + 0.17, 0.1); const bl = add(new T.SphereGeometry(0.02, 8, 6), neon('#ff2020', 3), 0.14, Hb + 0.35, 0.1);
        upd.push(t => { bl.visible = Math.sin(t * 4) > 0; });
        add(new T.BoxGeometry(0.48, 0.015, 0.44), neon(ctx.color, 2), 0, 0.3, 0);
      } else { g.userData.s = 0.85; // 企業摩天塔：往上收窄的玻璃塔、發光格線、會轉的全息廣告、頂端光環、探照燈
        const [c, cg] = cvs(64, 256); cg.fillStyle = '#0c1424'; cg.fillRect(0, 0, 64, 256); cg.strokeStyle = 'rgba(80,200,255,.8)'; cg.lineWidth = 1; for (let y = 0; y < 256; y += 8) { cg.beginPath(); cg.moveTo(0, y); cg.lineTo(64, y); cg.stroke(); } for (let x = 0; x < 64; x += 16) { cg.beginPath(); cg.moveTo(x, 0); cg.lineTo(x, 256); cg.stroke(); }
        for (let k = 0; k < 60; k++) { cg.fillStyle = 'rgba(255,230,180,.85)'; cg.fillRect(Math.floor(Math.random() * 4) * 16 + 3, Math.floor(Math.random() * 32) * 8 + 2, 10, 4); }
        const gl = new T.MeshStandardMaterial({ map: tex(T, c), emissiveMap: tex(T, c), emissive: '#ffffff', emissiveIntensity: 1.0, roughness: 0.15, metalness: 0.7 });
        const tower = add(new T.CylinderGeometry(0.16, 0.3, 2.1, 4, 1), gl, 0, 1.05, 0); tower.rotation.y = Math.PI / 4;
        add(new T.BoxGeometry(0.62, 0.12, 0.62), steel, 0, 0.06, 0); add(new T.BoxGeometry(0.5, 0.02, 0.5), neon(ctx.color, 2.4), 0, 0.13, 0);
        [-1, 1].forEach(sd => { const fin = add(new T.BoxGeometry(0.02, 1.8, 0.06), neon(ctx.color, 2.6), sd * 0.2, 1.0, 0.2); fin.rotation.z = -sd * 0.05; });
        const crown = add(new T.TorusGeometry(0.2, 0.015, 8, 30), neon('#3ad0ff', 3), 0, 2.2, 0); crown.rotation.x = Math.PI / 2;
        add(new T.CylinderGeometry(0.008, 0.008, 0.45, 4), steel, 0, 2.3, 0); const tip = add(new T.SphereGeometry(0.025, 8, 6), neon('#ff2020', 3), 0, 2.53, 0);
        const holo = new T.Group(); holo.position.set(0, 1.45, 0); g.add(holo);
        const [hc, hg] = cvs(128, 64); hg.fillStyle = 'rgba(0,0,0,0)'; hg.clearRect(0, 0, 128, 64); hg.shadowColor = ctx.color; hg.shadowBlur = 14; hg.fillStyle = ctx.color; hg.font = `900 40px ${SANS}`; hg.textAlign = 'center'; hg.fillText('NIGHT CORP', 64, 44);
        const hm = new T.MeshBasicMaterial({ map: tex(T, hc), transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending });
        const hp = new T.Mesh(new T.PlaneGeometry(0.7, 0.35), hm); hp.position.z = 0.32; holo.add(hp);
        const beam = new T.Mesh(new T.ConeGeometry(0.12, 1.4, 16, 1, true), new T.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.12, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending })); beam.position.set(0, 3.2, 0); g.add(beam);
        upd.push(t => { holo.rotation.y = t * 0.6; crown.rotation.z = t; tip.visible = Math.sin(t * 3) > 0; beam.rotation.z = Math.sin(t * 0.7) * 0.35; hm.opacity = 0.7 + Math.sin(t * 9) * 0.1 + (Math.random() < 0.03 ? -0.5 : 0); });
      }
      return g;
    }
    if (theme === 'alien') {
      const bone = M('#e3d9c0', { roughness: 0.32, metalness: 0.2 }), dark = M('#2a2034', { roughness: 0.15, metalness: 0.8 }), glow = M(ctx.color, { emissive: ctx.color, emissiveIntensity: 1.2 });
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
        const L = new T.PointLight(ctx.color, 2.5, 2.2, 2); L.position.set(0, 0.6, 0); g.add(L); upd.push(t => { L.intensity = 1.8 + Math.sin(t * 1.7) * 1; });
      }
      // 地主顏色的發光血管
      const vein = add(new T.TorusGeometry(0.5, 0.012, 4, 32), M(ctx.color, { emissive: ctx.color, emissiveIntensity: 1 }), 0, 0.02, 0); vein.rotation.x = Math.PI / 2;
    } else if (theme === 'buddha') {
      const red = M('#b3191c', { roughness: 0.45 }), gold = M('#e0b040', { metalness: 0.85, roughness: 0.25 }), roofM = M('#2a4a3a', { roughness: 0.5 }), stone = M('#8a7a70', { roughness: 0.9 });
      if (level === 1) { // 土地公小廟（泰式神龕）
        add(new T.CylinderGeometry(0.03, 0.03, 0.45, 6), stone, 0, 0.22, 0);
        add(new T.BoxGeometry(0.3, 0.22, 0.26), red, 0, 0.55, 0);
        const r = add(new T.ConeGeometry(0.26, 0.22, 4), gold, 0, 0.77, 0); r.rotation.y = Math.PI / 4;
        add(new T.SphereGeometry(0.04, 8, 6), M('#ffd84a', { emissive: '#ff9a00', emissiveIntensity: 1.5 }), 0, 0.55, 0.14);
      } else if (level === 2) { // 鳥居＋小社
        const or = M('#e2401c'); [-0.25, 0.25].forEach(x => add(new T.CylinderGeometry(0.03, 0.035, 0.6, 8), or, x, 0.3, 0.28));
        add(new T.BoxGeometry(0.7, 0.05, 0.07), M('#1c1416'), 0, 0.62, 0.28); add(new T.BoxGeometry(0.56, 0.04, 0.05), or, 0, 0.52, 0.28);
        add(new T.BoxGeometry(0.4, 0.3, 0.32), M('#e8dcc4'), 0, 0.15, -0.12); const r = add(new T.ConeGeometry(0.36, 0.2, 4), roofM, 0, 0.4, -0.12); r.rotation.y = Math.PI / 4; r.scale.z = 0.8;
      } else { // 層塔：3 = 三層、4 = 金色佛塔
        if (level === 3) {
          for (let k = 0; k < 3; k++) { const s = 1 - k * 0.22, y = 0.05 + k * 0.38; add(new T.BoxGeometry(0.42 * s, 0.3, 0.42 * s), red, 0, y + 0.15, 0); const r = add(new T.ConeGeometry(0.42 * s, 0.14, 4), roofM, 0, y + 0.36, 0); r.rotation.y = Math.PI / 4; }
          add(new T.ConeGeometry(0.03, 0.3, 6), gold, 0, 1.35, 0);
        } else {
          const pts = []; for (let i = 0; i <= 20; i++) { const t2 = i / 20; pts.push(new T.Vector2(t2 < 0.25 ? 0.42 - t2 * 0.3 : t2 < 0.5 ? 0.36 - (t2 - 0.25) * 0.2 : Math.max(0.01, 0.31 * (1 - (t2 - 0.5) / 0.5) ** 1.5), t2 * 1.7)); }
          add(new T.LatheGeometry(pts, 20), gold, 0, 0, 0);
          const L = new T.PointLight('#ffd27a', 2.2, 2.2, 2); L.position.set(0, 0.8, 0.4); g.add(L); upd.push(t => { L.intensity = 1.8 + Math.sin(t * 3) * 0.5; });
        }
      }
      // 地主色的幡旗
      add(new T.CylinderGeometry(0.012, 0.012, 0.7, 5), M('#5a4a3a'), -0.36, 0.35, -0.36);
      const fl = add(new T.PlaneGeometry(0.14, 0.4), M(ctx.color, { side: T.DoubleSide }), -0.29, 0.5, -0.36); upd.push(t => { fl.rotation.y = Math.sin(t * 2.5) * 0.35; });
    } else if (theme === 'magic') { // 魔法學院：魔藥攤 → 歪斜魔杖店 → 觀星塔 → 浮空魔法城堡
      const stone = M('#8a8496', { roughness: 0.85 }), wood = M('#5a3a22', { roughness: 0.85 }), brass = M('#c8a050', { metalness: 0.85, roughness: 0.3 }), win = M('#ffcf6a', { emissive: '#ffb030', emissiveIntensity: 1.6 }), roofM = M('#2e3550', { roughness: 0.55, metalness: 0.25 });
      const pennant = (x, y, z) => { add(new T.CylinderGeometry(0.006, 0.006, 0.2, 4), M('#c8c8d0', { metalness: 0.6 }), x, y + 0.1, z); const f = add(new T.PlaneGeometry(0.1, 0.05), M(ctx.color, { side: T.DoubleSide, emissive: ctx.color, emissiveIntensity: 0.3 }), x + 0.05, y + 0.17, z); upd.push(t => { f.rotation.y = Math.sin(t * 3 + x * 9) * 0.4; }); };
      if (level === 1) { // 魔藥攤：條紋小棚子、三腳大釜、冒泡的綠色魔藥、一排藥瓶
        [-0.2, 0.2].forEach(x => add(new T.CylinderGeometry(0.012, 0.012, 0.5, 6), wood, x, 0.25, -0.12));
        const awn = add(new T.CylinderGeometry(0.28, 0.28, 0.5, 16, 1, true, 0, Math.PI), M('#3a2a5a', { side: T.DoubleSide, roughness: 0.7 }), 0, 0.5, -0.12); awn.rotation.z = Math.PI / 2; awn.scale.set(1, 1, 0.45);
        add(new T.BoxGeometry(0.46, 0.02, 0.12), wood, 0, 0.26, -0.14); for (let k = 0; k < 5; k++) add(new T.CylinderGeometry(0.018, 0.022, 0.06, 8), M(['#5ae07a', '#c05aff', '#ff5a7a', '#5ac8ff', '#ffd25a'][k], { emissive: ['#2a8040', '#6020a0', '#a02040', '#2070a0', '#a08020'][k], emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }), -0.18 + k * 0.09, 0.3, -0.14);
        const pot = add(new T.SphereGeometry(0.14, 16, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), M('#1a1a20', { metalness: 0.6, roughness: 0.4, side: T.DoubleSide }), 0, 0.2, 0.1);
        [0, 2.1, 4.2].forEach(a => { const l = add(new T.CylinderGeometry(0.01, 0.01, 0.14, 4), M('#1a1a20'), Math.cos(a) * 0.1, 0.05, 0.1 + Math.sin(a) * 0.1); l.rotation.z = Math.cos(a) * 0.3; });
        const liq = add(new T.CircleGeometry(0.115, 20), M('#5aff7a', { emissive: '#3aff5a', emissiveIntensity: 1.6 }), 0, 0.24, 0.1); liq.rotation.x = -Math.PI / 2; void pot;
        const bub = []; for (let k = 0; k < 5; k++) { const b = add(new T.SphereGeometry(0.02, 8, 6), M('#aaffb0', { emissive: '#5aff7a', emissiveIntensity: 1.2, transparent: true, opacity: 0.8 }), 0, 0.25, 0.1); b.userData.o = k / 5; bub.push(b); }
        add(new T.CylinderGeometry(0.281, 0.281, 0.04, 16, 1, true, 0, Math.PI), M('#c8a050', { side: T.DoubleSide, metalness: 0.7 }), 0, 0.5, -0.12).rotation.z = Math.PI / 2; pennant(0.2, 0.5, -0.12);
        upd.push(t => bub.forEach((b, k) => { const p = (t * 0.7 + b.userData.o) % 1; b.position.set(Math.sin(k * 2.3) * 0.05, 0.25 + p * 0.3, 0.1 + Math.cos(k * 1.7) * 0.05); b.scale.setScalar(1 + p); b.material.opacity = 0.8 * (1 - p); }));
      } else if (level === 2) { // 歪斜魔杖店：木框屋身往一邊歪、陡屋頂、彎煙囪冒煙、圓窗、掛著的魔杖招牌
        const house = new T.Group(); house.rotation.z = 0.08; g.add(house);
        add(new T.BoxGeometry(0.42, 0.45, 0.38), M('#e8dcc0', { roughness: 0.9 }), 0, 0.225, 0, house);
        for (let k = 0; k < 3; k++) add(new T.BoxGeometry(0.43, 0.025, 0.39), wood, 0, 0.02 + k * 0.21, 0, house);
        [-0.2, 0, 0.2].forEach(x => add(new T.BoxGeometry(0.025, 0.45, 0.39), wood, x, 0.225, 0, house));
        const roof = add(new T.ConeGeometry(0.36, 0.42, 4), roofM, 0.02, 0.66, 0, house); roof.rotation.set(0, Math.PI / 4, -0.12); pennant(-0.06, 0.86, 0);
        const chim = add(new T.CylinderGeometry(0.035, 0.045, 0.3, 8), stone, 0.14, 0.82, -0.06, house); chim.rotation.z = -0.25;
        add(new T.CircleGeometry(0.06, 16), win, -0.08, 0.32, 0.192, house); add(new T.BoxGeometry(0.12, 0.18, 0.01), M('#3a2a1a'), 0.09, 0.09, 0.192, house);
        add(new T.BoxGeometry(0.16, 0.06, 0.01), M('#2a1a10'), 0.12, 0.38, 0.24, house); const wand = add(new T.CylinderGeometry(0.005, 0.008, 0.14, 6), brass, 0.12, 0.38, 0.25, house); wand.rotation.z = 1.2;
        const smoke = []; for (let k = 0; k < 4; k++) { const sm = add(new T.SphereGeometry(0.03, 8, 6), new T.MeshBasicMaterial({ color: '#d8d0e8', transparent: true, opacity: 0.4, depthWrite: false }), 0.18, 0.98, -0.06); sm.userData.o = k / 4; smoke.push(sm); }
        upd.push(t => smoke.forEach(sm => { const p = (t * 0.35 + sm.userData.o) % 1; sm.position.set(0.18 + p * 0.12 + Math.sin(t + p * 5) * 0.03, 0.98 + p * 0.4, -0.06); sm.scale.setScalar(0.8 + p * 2); sm.material.opacity = 0.4 * (1 - p); }));
      } else if (level === 3) { // 觀星塔：石塔＋黃銅望遠鏡圓頂＋頭上轉動的天體儀
        add(new T.CylinderGeometry(0.17, 0.21, 0.95, 12), stone, 0, 0.475, 0);
        for (let k = 0; k < 3; k++) add(new T.PlaneGeometry(0.06, 0.1), win, Math.cos(k * 2.1) * 0.19, 0.3 + k * 0.22, Math.sin(k * 2.1) * 0.19).lookAt(Math.cos(k * 2.1) * 2, 0.3 + k * 0.22, Math.sin(k * 2.1) * 2);
        add(new T.CylinderGeometry(0.22, 0.2, 0.05, 14), stone, 0, 0.97, 0);
        add(new T.SphereGeometry(0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M('#4a5a8a', { metalness: 0.6, roughness: 0.3 }), 0, 0.99, 0);
        const scope = add(new T.CylinderGeometry(0.025, 0.04, 0.32, 10), brass, 0.08, 1.14, 0.06); scope.rotation.z = -0.9;
        const orr = new T.Group(); orr.position.y = 1.45; g.add(orr);
        [0, 1, 2].forEach(k => { const rg = new T.Mesh(new T.TorusGeometry(0.16 + k * 0.05, 0.008, 6, 40), brass); rg.rotation.set(k * 0.9, k * 0.6, 0); orr.add(rg); });
        const sun = new T.Mesh(new T.SphereGeometry(0.05, 12, 10), M('#ffd27a', { emissive: '#ffb030', emissiveIntensity: 2 })); orr.add(sun);
        const pl = new T.Mesh(new T.SphereGeometry(0.025, 8, 6), M(ctx.color, { emissive: ctx.color, emissiveIntensity: 1 })); orr.add(pl); pennant(0.2, 0.97, 0.05);
        upd.push(t => { orr.children.forEach((c, k) => { if (k < 3) c.rotation.y = t * (0.4 + k * 0.3); }); pl.position.set(Math.cos(t * 1.2) * 0.21, Math.sin(t * 0.6) * 0.05, Math.sin(t * 1.2) * 0.21); });
      } else { // 浮空魔法城堡：城牆＋多座尖塔＋懸浮的水晶與魔法光環
        const tw = (x, z, r, h) => { add(new T.CylinderGeometry(r, r * 1.08, h, 12), stone, x, h / 2, z); add(new T.ConeGeometry(r * 1.35, r * 2.6, 12), roofM, x, h + r * 1.3, z); add(new T.PlaneGeometry(r * 0.5, r * 0.7), win, x, h * 0.65, z + r + 0.005); };
        add(new T.BoxGeometry(0.62, 0.42, 0.5), stone, 0, 0.21, 0); for (let k = 0; k < 6; k++) add(new T.BoxGeometry(0.06, 0.06, 0.06), stone, -0.27 + k * 0.108, 0.45, 0.25);
        add(new T.BoxGeometry(0.12, 0.2, 0.01), M('#2a1a10'), 0, 0.1, 0.251); add(new T.CircleGeometry(0.06, 16, 0, Math.PI), M('#2a1a10'), 0, 0.2, 0.252);
        tw(-0.28, -0.2, 0.11, 0.85); tw(0.28, -0.2, 0.11, 0.85); tw(0, 0.05, 0.16, 1.3); tw(-0.3, 0.2, 0.08, 0.6); tw(0.3, 0.2, 0.08, 0.6);
        const fl = add(new T.PlaneGeometry(0.18, 0.11), M(ctx.color, { side: T.DoubleSide, emissive: ctx.color, emissiveIntensity: 0.4 }), 0.09, 2.0, 0.05); add(new T.CylinderGeometry(0.008, 0.008, 0.3, 4), M('#ccc'), 0, 1.95, 0.05);
        const cry = add(new T.OctahedronGeometry(0.09, 0), M('#9ad8ff', { emissive: '#5ab0ff', emissiveIntensity: 2.2, transparent: true, opacity: 0.9 }), 0, 2.3, 0);
        const halo = add(new T.TorusGeometry(0.5, 0.01, 6, 48), new T.MeshBasicMaterial({ color: '#b8a0ff', transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false }), 0, 0.5, 0); halo.rotation.x = Math.PI / 2;
        const motes = []; for (let k = 0; k < 10; k++) { const m = add(new T.SphereGeometry(0.015, 6, 4), new T.MeshBasicMaterial({ color: '#e0d0ff' }), 0, 0, 0); m.userData = { a: k / 10 * 6.28, r: 0.45 + (k % 3) * 0.06 }; motes.push(m); }
        const L = new T.PointLight('#ffc070', 1.6, 2, 2); L.position.set(0, 0.6, 0.5); g.add(L);
        upd.push(t => { fl.rotation.y = Math.sin(t * 3) * 0.4; cry.rotation.y = t; cry.position.y = 2.3 + Math.sin(t * 1.5) * 0.06; halo.position.y = 0.5 + Math.sin(t) * 0.15; halo.scale.setScalar(1 + Math.sin(t * 2) * 0.05); motes.forEach(m => { const a = m.userData.a + t * 0.8; m.position.set(Math.cos(a) * m.userData.r, 0.4 + Math.sin(t * 2 + m.userData.a) * 0.3, Math.sin(a) * m.userData.r); }); });
      }
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
    } else { // 動物：樹樁小窩 → 圓木小屋 → 樹屋 → 叢林神木（地主的物種決定門口的小動物剪影）
      const wood = M('#6b4a2e', { roughness: 0.9 }), bark = M('#5a3e26', { flatShading: true, roughness: 1 }), leaf = M('#4f7a3a', { flatShading: true, roughness: 0.9 }), leaf2 = M('#6a9a40', { flatShading: true }), hole = M('#1a120b', { roughness: 1 }), lamp = M('#ffd27a', { emissive: '#ffb040', emissiveIntensity: 1.6 });
      const flag = (x, y, z) => { add(new T.CylinderGeometry(0.01, 0.01, 0.26, 5), wood, x, y + 0.13, z); const f = add(new T.PlaneGeometry(0.12, 0.08), M(ctx.color, { side: T.DoubleSide }), x + 0.06, y + 0.22, z); upd.push(t => { f.rotation.y = Math.sin(t * 2.5) * 0.4; }); };
      if (level === 1) { // 樹樁小窩：截斷的樹樁、地洞入口、蘑菇、小草
        const st = add(new T.CylinderGeometry(0.17, 0.22, 0.24, 12), bark, 0, 0.12, 0); void st;
        const top = add(new T.CircleGeometry(0.17, 16), M('#c8a070', { roughness: 0.8 }), 0, 0.241, 0); top.rotation.x = -Math.PI / 2;
        for (let k = 1; k < 4; k++) { const rg = add(new T.RingGeometry(k * 0.04, k * 0.04 + 0.006, 16), M('#8a6040'), 0, 0.243, 0); rg.rotation.x = -Math.PI / 2; }
        add(new T.CircleGeometry(0.06, 14), hole, 0, 0.07, 0.205);
        [[0.2, 0.12], [-0.22, 0.08], [0.24, -0.1]].forEach(([x, z], k) => { add(new T.CylinderGeometry(0.012, 0.015, 0.06, 6), M('#f0e8d8'), x, 0.03, z); add(new T.SphereGeometry(0.035, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(k % 2 ? '#d83a2a' : '#c8902a'), x, 0.06, z); });
        for (let k = 0; k < 8; k++) add(new T.ConeGeometry(0.015, 0.08, 3), leaf2, Math.cos(k) * 0.3, 0.04, Math.sin(k * 1.3) * 0.3);
        flag(-0.3, 0, -0.25);
      } else if (level === 2) { // 圓木小屋：一根根圓木疊的牆、茅草屋頂、圓門、亮燈的小窗、柴堆
        for (let k = 0; k < 6; k++) { [-1, 1].forEach(sd => { const lg = add(new T.CylinderGeometry(0.025, 0.025, 0.46, 8), wood, 0, 0.03 + k * 0.05, sd * 0.18); lg.rotation.z = Math.PI / 2; const lg2 = add(new T.CylinderGeometry(0.025, 0.025, 0.4, 8), wood, sd * 0.21, 0.055 + k * 0.05, 0); lg2.rotation.x = Math.PI / 2; }); }
        const roof = add(new T.ConeGeometry(0.4, 0.3, 4), M('#c8a048', { flatShading: true, roughness: 1 }), 0, 0.48, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.85;
        add(new T.CircleGeometry(0.065, 16), M('#3a2414'), 0, 0.09, 0.206); add(new T.SphereGeometry(0.008, 6, 4), lamp, 0.04, 0.09, 0.21);
        add(new T.PlaneGeometry(0.07, 0.06), lamp, 0.13, 0.2, 0.207); add(new T.PlaneGeometry(0.07, 0.06), lamp, -0.13, 0.2, 0.207);
        for (let k = 0; k < 6; k++) { const lg = add(new T.CylinderGeometry(0.02, 0.02, 0.14, 6), wood, 0.32, 0.03 + Math.floor(k / 3) * 0.04, -0.06 + (k % 3) * 0.045); lg.rotation.z = Math.PI / 2; }
        const sm = []; for (let k = 0; k < 3; k++) { const s2 = add(new T.SphereGeometry(0.025, 8, 6), new T.MeshBasicMaterial({ color: '#e8e8e8', transparent: true, opacity: 0.35, depthWrite: false }), 0.1, 0.62, -0.05); s2.userData.o = k / 3; sm.push(s2); }
        upd.push(t => sm.forEach(s2 => { const p = (t * 0.3 + s2.userData.o) % 1; s2.position.y = 0.62 + p * 0.3; s2.scale.setScalar(1 + p * 1.5); s2.material.opacity = 0.35 * (1 - p); }));
        flag(-0.32, 0, 0.2);
      } else if (level === 3) { // 樹屋：粗樹幹、平台、小木屋、繩梯、燈籠、樹冠
        add(new T.CylinderGeometry(0.09, 0.15, 1.0, 9), bark, 0, 0.5, -0.05);
        for (let k = 0; k < 3; k++) { const rt = add(new T.CylinderGeometry(0.02, 0.05, 0.25, 6), bark, Math.cos(k * 2.1) * 0.15, 0.06, -0.05 + Math.sin(k * 2.1) * 0.15); rt.rotation.z = Math.cos(k * 2.1) * 0.9; rt.rotation.x = -Math.sin(k * 2.1) * 0.9; }
        add(new T.BoxGeometry(0.5, 0.03, 0.42), wood, 0, 0.58, 0);
        add(new T.BoxGeometry(0.3, 0.24, 0.26), M('#9a6a40', { roughness: 0.9 }), 0, 0.71, 0); const rf = add(new T.ConeGeometry(0.26, 0.18, 4), M('#7a3a2a', { flatShading: true }), 0, 0.92, 0); rf.rotation.y = Math.PI / 4;
        add(new T.PlaneGeometry(0.07, 0.07), lamp, 0.07, 0.73, 0.131); add(new T.PlaneGeometry(0.07, 0.12), M('#3a2414'), -0.07, 0.66, 0.131);
        for (let k = 0; k < 4; k++) add(new T.CylinderGeometry(0.006, 0.006, 0.42, 4), wood, (k % 2 ? 1 : -1) * 0.22 + (k > 1 ? 0 : 0), 0.79, k > 1 ? -0.2 : 0.2);
        [-0.04, 0.04].forEach(x => add(new T.CylinderGeometry(0.004, 0.004, 0.56, 4), M('#c8a870'), 0.18 + x, 0.29, 0.21)); for (let k = 0; k < 6; k++) add(new T.BoxGeometry(0.1, 0.01, 0.015), wood, 0.18, 0.05 + k * 0.09, 0.21);
        const lan = add(new T.SphereGeometry(0.03, 10, 8), lamp, -0.24, 0.5, 0.2); upd.push(t => { lan.position.y = 0.5 + Math.sin(t * 2) * 0.01; });
        [[0, 1.12, 0, 0.36], [-0.2, 1.0, -0.1, 0.24], [0.22, 1.02, -0.08, 0.26]].forEach(([x, y, z, r]) => { const c = add(new T.IcosahedronGeometry(r, 0), leaf, x, y, z); c.scale.y = 0.75; });
        flag(-0.3, 0.58, -0.15);
      } else { g.userData.s = 0.8; // 叢林神木：巨大樹幹盤根、好幾層樹屋、吊橋、垂下的藤蔓、螢火蟲、樹頂發光的果實
        add(new T.CylinderGeometry(0.16, 0.3, 1.8, 10), bark, 0, 0.9, 0);
        for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28, rt = add(new T.CylinderGeometry(0.03, 0.08, 0.45, 6), bark, Math.cos(a) * 0.28, 0.1, Math.sin(a) * 0.28); rt.rotation.z = Math.cos(a) * 1.1; rt.rotation.x = -Math.sin(a) * 1.1; }
        const hut = (y, a, s) => { const x = Math.cos(a) * 0.3, z = Math.sin(a) * 0.3; add(new T.CylinderGeometry(0.2 * s, 0.2 * s, 0.025, 12), wood, x, y, z); add(new T.CylinderGeometry(0.12 * s, 0.12 * s, 0.16 * s, 10), M('#9a6a40'), x, y + 0.09 * s, z); add(new T.ConeGeometry(0.17 * s, 0.16 * s, 10), M('#c8a048', { flatShading: true }), x, y + 0.24 * s, z); add(new T.PlaneGeometry(0.05, 0.05), lamp, x + Math.cos(a) * 0.121 * s, y + 0.1 * s, z + Math.sin(a) * 0.121 * s).lookAt(x * 4, y + 0.1, z * 4); };
        hut(0.55, 0.6, 1.0); hut(0.95, 2.6, 0.9); hut(1.3, 4.5, 0.85);
        const br = new T.Line(new T.BufferGeometry().setFromPoints([0, 1, 2, 3, 4, 5, 6].map(q => new T.Vector3(Math.cos(0.6) * 0.3 + (Math.cos(2.6) * 0.3 - Math.cos(0.6) * 0.3) * q / 6, 0.6 + (0.95 - 0.6) * q / 6 - Math.sin(q / 6 * Math.PI) * 0.06, Math.sin(0.6) * 0.3 + (Math.sin(2.6) * 0.3 - Math.sin(0.6) * 0.3) * q / 6))), new T.LineBasicMaterial({ color: '#c8a870' })); g.add(br);
        [[0, 2.05, 0, 0.6], [-0.35, 1.8, 0.1, 0.4], [0.35, 1.85, -0.1, 0.42], [0.05, 1.7, 0.4, 0.36]].forEach(([x, y, z, r]) => { const c = add(new T.IcosahedronGeometry(r, 1), (x + z) > 0 ? leaf : leaf2, x, y, z); c.scale.y = 0.7; });
        for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, v = add(new T.CylinderGeometry(0.006, 0.006, 0.5 + (k % 3) * 0.15, 4), leaf2, Math.cos(a) * 0.5, 1.45, Math.sin(a) * 0.5); void v; }
        const fruits = []; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28, f = add(new T.SphereGeometry(0.035, 8, 6), M('#ffe07a', { emissive: '#ffb030', emissiveIntensity: 2 }), Math.cos(a) * 0.45, 1.75 + (k % 2) * 0.15, Math.sin(a) * 0.45); fruits.push(f); }
        const ff = []; for (let k = 0; k < 10; k++) { const f = add(new T.SphereGeometry(0.012, 6, 4), new T.MeshBasicMaterial({ color: '#d8ff7a' }), 0, 0, 0); f.userData = { a: k / 10 * 6.28, r: 0.45 + (k % 4) * 0.08, h: 0.3 + (k % 5) * 0.3 }; ff.push(f); }
        upd.push(t => { fruits.forEach((f, k) => f.material.emissiveIntensity = 1.6 + Math.sin(t * 3 + k) * 0.6); ff.forEach(f => { const a = f.userData.a + t * 0.5; f.position.set(Math.cos(a) * f.userData.r, f.userData.h + Math.sin(t * 2 + f.userData.a) * 0.1, Math.sin(a) * f.userData.r); f.visible = Math.sin(t * 5 + f.userData.a * 3) > -0.3; }); });
        flag(-0.42, 0, 0.35);
      }
    }
    return g;
  };

  root.MONO_ART = A;
})(typeof window !== 'undefined' ? window : globalThis);
