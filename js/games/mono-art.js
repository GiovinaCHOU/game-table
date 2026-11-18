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
    gang: { bg: '#0e0a18', fog: ['#1a1428', 26, 95], hemi: [0xc8b8ff, 0x2a2238, 1.3], sun: [0xffc890, 1.5], env: ['#4a3060', '#0e0a18'], panels: [['#ff3ab0', 6, 3, 0], ['#3af0ff', -6, 3, 0], ['#ffb050', 0, 8, 0]], envI: 0.9 },
    town: { bg: '#2a1830', fog: ['#4a2a3a', 26, 95], hemi: [0xffd0b0, 0x3a2a40, 1.25], sun: [0xffb070, 1.9], env: ['#c86a4a', '#2a1830'], panels: [['#ff9a4a', 6, 3, 0], ['#7ab0ff', -6, 3, 0], ['#ffffff', 0, 8, 0]], envI: 0.85 },
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
    } else if (theme === 'gang' && root.MONO_PIXEL && root.MONO_PIXEL.gangIcon) {
      // 像素格子：深色水泥板、外框、地主色條／圖示、白字，價錢用鈔票綠
      const P = root.MONO_PIXEL, [pc, pg] = P.canvas(64, 64), R = (x, y, w, h, col) => { pg.fillStyle = col; pg.fillRect(x, y, w, h); };
      R(0, 0, 64, 64, '#0e0c12'); R(2, 2, 60, 60, '#2c2834'); R(2, 2, 60, 1, '#3e3a48'); R(2, 2, 1, 60, '#3e3a48'); R(2, 61, 60, 1, '#1e1a24'); R(61, 2, 1, 60, '#1e1a24');
      for (let k = 0; k < 70; k++) R(3 + ((k * 37) % 58), 4 + ((k * 23) % 56), 1, 1, k % 3 ? '#34303e' : '#24202c');
      for (let k = 0; k < 9; k++) R(40 + k, 50 + Math.round(Math.sin(k) * 1.5), 1, 1, '#1e1a24');
      const acc = prop ? b.color : ({ item: '#ff7a2a', luck: '#7aff6a', bad: '#3a7aff', start: '#3ab06a', jail: '#9a9aa6', gotojail: '#ff3a3a', free: '#ff3ab0', tax: '#ffd23a', teleport: '#3af0ff' }[b.type] || '#ff3ab0');
      if (prop) { R(4, 4, 56, 8, acc); R(4, 4, 56, 1, 'rgba(255,255,255,.35)'); R(4, 11, 56, 1, 'rgba(0,0,0,.35)'); }
      else { R(4, 4, 56, 2, acc); R(4, 6, 56, 1, 'rgba(0,0,0,.4)'); pg.drawImage(P.gangIcon(b.type), 22, 12, 20, 20); }
      g.imageSmoothingEnabled = false; g.drawImage(pc, 0, 0, 256, 256); g.imageSmoothingEnabled = true;
      g.fillStyle = '#f4ecd8'; g.font = `900 ${prop ? 38 : 32}px ${SANS}`; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowOffsetY = 3;
      const ls = wrap(g, name, 206); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 108 : 178) + k * 40 - (ls.length - 1) * (prop ? 20 : 0)));
      if (prop) { g.font = `bold 24px ${SANS}`; g.fillStyle = '#7aff6a'; g.fillText(b.price.toLocaleString() + ' 黑錢', 128, 212); }
      g.shadowColor = 'transparent'; g.shadowOffsetY = 0;
    } else if (theme === 'town' && root.MONO_PIXEL) {
      // 16-bit 像素格子：先在 64x64 畫像素底（框、斜面、色條、圖示），用最近鄰放大，再寫清楚的字
      const P = root.MONO_PIXEL, [pc, pg] = P.canvas(64, 64), R = (x, y, w, h, col) => { pg.fillStyle = col; pg.fillRect(x, y, w, h); };
      R(0, 0, 64, 64, '#1a1418'); R(2, 2, 60, 60, '#efe2c8'); R(2, 2, 60, 2, '#fff4dc'); R(2, 2, 2, 60, '#fff4dc'); R(2, 60, 60, 2, '#c8b490'); R(60, 2, 2, 60, '#c8b490');
      for (let k = 0; k < 40; k++) R(4 + ((k * 37) % 56), 6 + ((k * 23) % 52), 1, 1, 'rgba(120,90,60,.25)');
      const acc = prop ? b.color : ({ item: '#ff9f1c', luck: '#3ab0e0', bad: '#b0202a', start: '#e5383b', jail: '#5a3a6a', gotojail: '#b0202a', free: '#3ab06a', tax: '#7a6a5a', teleport: '#b0202a' }[b.type] || '#e5383b');
      if (prop) { R(4, 4, 56, 8, acc); R(4, 4, 56, 1, 'rgba(255,255,255,.35)'); R(4, 11, 56, 1, 'rgba(0,0,0,.3)'); }
      else { ['#e5383b', '#ff8c1a', '#ffd23a', '#3ab0e0'].forEach((c2, k) => R(4, 4 + k * 2, 56, 2, c2)); pg.drawImage(P.icon(b.type), 22, 13, 20, 20); }
      g.imageSmoothingEnabled = false; g.drawImage(pc, 0, 0, 256, 256); g.imageSmoothingEnabled = true;
      g.fillStyle = '#1a1418'; g.font = `900 ${prop ? 38 : 32}px ${SANS}`;
      const ls = wrap(g, name, 206); ls.forEach((l, k) => g.fillText(l, 128, (prop ? 108 : 178) + k * 40 - (ls.length - 1) * (prop ? 20 : 0)));
      if (prop) { g.font = `bold 23px ${SANS}`; g.fillStyle = '#b0202a'; g.fillText(b.price.toLocaleString() + ' 代幣', 128, 212); }
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
    } else if (theme === 'gang' && root.MONO_PIXEL && root.MONO_PIXEL.gTenement) {
      // ===== 午夜的街區：水泥地、十字路口、一圈磚造公寓（霓虹招牌會閃）、塗鴉牆、鐵絲網、棕櫚樹、鈉燈、油桶火、停著的低底盤車；
      //        中央是塗鴉籃球場。回合越後面「風聲越緊」：警車一台台開進來、紅藍燈越來越亮，最後直升機帶著探照燈在頭上繞 =====
      const PX = root.MONO_PIXEL, hs2 = (x, y, s) => { const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453; return v - Math.floor(v); };
      const nearest = (tx) => { tx.magFilter = T.NearestFilter; tx.minFilter = T.NearestFilter; tx.generateMipmaps = false; tx.anisotropy = 1; return tx; };
      const ntex = (img) => nearest(tex(T, img));
      const bbs = [], bb = (img, w, x, z, tint, y0) => { const h = w * img.height / img.width, m = add(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: ntex(img), transparent: true, alphaTest: 0.5, side: T.DoubleSide, color: tint || '#b8b0c8' }), x, h / 2 - 0.4 + (y0 || 0), z, false); bbs.push(m); return m; };
      const swap = (m, imgs, fps, ph) => { const txs = imgs.map(ntex); let cur = -1; upd.push(t => { const k = Math.floor(t * fps + (ph || 0)) % txs.length; if (k !== cur) { cur = k; m.material.map = txs[k]; } }); };
      // 天空：午夜紫、地平線一點城市的橘光、月亮、少量星星
      { const [c, g] = cvs(64, 512); PX.ditherSky(g, 64, 512, ['#06040e', '#0a0818', '#120e26', '#1c1434', '#2a1a3e', '#4a2448', '#6a3040', '#1a1220', '#0a0810']);
        for (let k = 0; k < 50; k++) { g.fillStyle = k % 5 ? '#a8a0c8' : '#ffffff'; g.fillRect(Math.floor(rnd(0, 64)), Math.floor(rnd(0, 170)), 1, 1); }
        const st = ntex(c); scene.add(new T.Mesh(new T.SphereGeometry(140, 32, 16), new T.MeshBasicMaterial({ map: st, side: T.BackSide, fog: false, depthWrite: false }))); }
      { const [c, g] = cvs(24, 24), R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); }; for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const d = Math.hypot(x - 11.5, y - 11.5); if (d < 9) R(x, y, 1, 1, d < 7.5 ? (hs2(x >> 1, y >> 1, 3) > 0.8 ? '#d8d0b8' : '#f4ecd0') : '#c8c0a8'); } R(8, 8, 3, 2, '#d0c8b0'); R(14, 13, 2, 2, '#d0c8b0');
        const moon = new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshBasicMaterial({ map: ntex(c), transparent: true, alphaTest: 0.5, fog: false, depthWrite: false })); moon.position.set(-60, 52, -95); moon.lookAt(0, 0, 0); scene.add(moon); }
      scene.background = null;
      // 地面：水泥＋十字柏油路（黃線）＋人行道邊緣
      { const gnd = add(new T.PlaneGeometry(160, 160), M('#ffffff', { map: (() => { const tx = ntex(PX.gConcrete()); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(40, 40); return tx; })(), roughness: 1 }), 0, -0.36, 0, false); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = q.high; }
      const asph = M('#ffffff', { map: (() => { const tx = ntex(PX.asphalt()); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(1, 40); return tx; })(), color: '#9a96a8', roughness: 0.95 }), yl = new T.MeshBasicMaterial({ color: '#c8a83a' }), curb = M('#6a6672', { roughness: 0.9 });
      [[0, 1], [1, 0]].forEach(([dx, dz]) => { const r0 = add(new T.PlaneGeometry(dx ? 160 : 4, dz ? 160 : 4), asph, 0, -0.35, 0, false); r0.rotation.x = -Math.PI / 2; r0.receiveShadow = q.high;
        [-2.1, 2.1].forEach(o => [-1, 1].forEach(sg => { const L = 73, c0 = sg * (7 + L / 2), cb = add(new T.BoxGeometry(dx ? L : 0.2, 0.1, dz ? L : 0.2), curb, dz ? o : c0, -0.32, dx ? o : c0, false); cb.receiveShadow = q.high; }));
        for (let k = -24; k <= 24; k++) { if (Math.abs(k) < 3) continue; const d = add(new T.PlaneGeometry(dx ? 1.3 : 0.1, dz ? 1.3 : 0.1), yl, dx ? k * 3 : 0, -0.34, dz ? k * 3 : 0, false); d.rotation.x = -Math.PI / 2; } });
      const offRoad = (x, z, m) => Math.abs(x) > (m || 2.8) && Math.abs(z) > (m || 2.8);
      // 中央：塗鴉籃球場、籃框、油桶火
      { const ct = add(new T.PlaneGeometry(7.4, 7.4), new T.MeshStandardMaterial({ map: ntex(PX.gCourt()), roughness: 0.9, color: '#d8d0e0' }), 0, -0.33, 0, false); ct.rotation.x = -Math.PI / 2; ct.receiveShadow = q.high; }
      bb(PX.gHoop(), 1.1, -0.3, -2.9, '#c8c0d4');
      const fires = []; const fire = (x, z, sc) => { const m = bb(PX.gBarrel(0), 0.55 * (sc || 1), x, z, '#ffffff'); swap(m, [0, 1, 2, 3].map(PX.gBarrel), 8, rnd(0, 4)); const L = new T.PointLight('#ff7a2a', 2.2, 5 * (sc || 1), 1.6); L.position.set(x, 0.6, z); scene.add(L); fires.push(L); };
      fire(2.4, 2.2, 1.1);
      // 一圈公寓（霓虹招牌會閃）
      let ts = 0; const N0 = q.high ? 20 : 13;
      for (let k = 0; k < N0; k++) { const a = k / N0 * Math.PI * 2 + rnd(-0.05, 0.05), d = rnd(14, 19); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (!offRoad(x, z, 3.6)) continue; const sd = ts++ % 10, m = bb(PX.gTenement(sd, 1), rnd(4.6, 5.4), x, z); if (sd % 3 !== 2) swap(m, [PX.gTenement(sd, 1), PX.gTenement(sd, 1), PX.gTenement(sd, 1), PX.gTenement(sd, 1), PX.gTenement(sd, 1), PX.gTenement(sd, 0), PX.gTenement(sd, 1), PX.gTenement(sd, 0)], 5, k * 1.7); }
      // 塗鴉牆、鐵絲網、垃圾車、消防栓
      for (let k = 0; k < (q.high ? 14 : 8); k++) { const a = rnd(0, 6.28), d = rnd(8.5, 12); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (!offRoad(x, z)) continue; bb(k % 3 === 2 ? PX.gFence() : PX.gWall(k), k % 3 === 2 ? 3 : 5.2, x, z, k % 3 === 2 ? null : '#c8c0d4'); }
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + 0.4, d = rnd(9, 12.5); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (!offRoad(x, z)) continue; bb(k % 2 ? PX.gDumpster(k) : PX.gHydrant(), k % 2 ? 1.5 : 0.42, x, z); }
      // 棕櫚樹（高高的剪影）
      for (let k = 0; k < (q.high ? 30 : 16); k++) { const a = rnd(0, 6.28), d = rnd(10, 34); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (!offRoad(x, z, 3)) continue; bb(PX.gPalm(k % 5), rnd(3.6, 4.8), x, z, '#9a90b0'); }
      // 鈉燈（偶爾閃）
      const lamps = [];
      [[-2.6, 8], [2.6, -8], [8, 2.6], [-8, -2.6], [-2.6, -14], [2.6, 14], [14, -2.6], [-14, 2.6]].forEach(([x, z]) => { const m = bb(PX.gLamp(1), 1.0, x, z, '#ffffff'), on = m.material.map, off = ntex(PX.gLamp(0)); let cur = 1; lamps.push(w => { if (w !== cur) { cur = w; m.material.map = w ? on : off; } });
        const pool = add(new T.CircleGeometry(1.6, 20), new T.MeshBasicMaterial({ color: '#ff9a3a', transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false }), x + (x > 0 ? -0.5 : 0.5) * (Math.abs(x) < 3 ? 1 : 0), -0.33, z + (z > 0 ? -0.5 : 0.5) * (Math.abs(z) < 3 ? 1 : 0), false); pool.rotation.x = -Math.PI / 2; });
      // 路邊停的低底盤車
      [[2.6, 10.5, 0], [-2.6, -11, 1], [11, -2.6, 2], [-10.5, 2.6, 3], [2.6, -17, 4], [-17, -2.6, 0]].forEach(([x, z, s]) => bb(PX.gCar(s), 2.3, x * 1.05, z, '#c0b8d0'));
      for (let k = 0; k < 4; k++) { const a = k / 4 * 6.28 + 0.8, d = rnd(10, 13); fire(Math.cos(a) * d, Math.sin(a) * d, 1); }
      // 遠方天際線
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, d = 58; const m = add(new T.PlaneGeometry(28, 14), new T.MeshBasicMaterial({ map: ntex(PX.gSkyline(k)), transparent: true, alphaTest: 0.5, fog: false, color: '#a098b8' }), Math.cos(a) * d, 6.6, Math.sin(a) * d, false); m.lookAt(0, 6.6, 0); }
      { const wp = new T.Vector3(); bbs.forEach(m => { m.onBeforeRender = (rr, sc, cam) => { m.getWorldPosition(wp); m.rotation.y = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z); }; }); }
      // ===== 風聲越緊：警車、紅藍光、直升機探照燈 =====
      const COPS = [[-2.6, 6.8], [7, -2.6], [2.6, -6.6], [-6.8, 2.6], [6.6, 2.6], [-2.6, -7]], cops = [];
      const copTx = [PX.gCop(0), PX.gCop(1)].map(ntex);
      COPS.forEach(([x, z], k) => { const h = 1.9 * 22 / 52, m = add(new T.PlaneGeometry(1.9, h), new T.MeshBasicMaterial({ map: copTx[0], transparent: true, alphaTest: 0.5, side: T.DoubleSide, color: '#d8d0e0' }), x, h / 2 - 0.4, z, false); const wp = new T.Vector3(); m.onBeforeRender = (rr, sc, cam) => { m.getWorldPosition(wp); m.rotation.y = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z); }; m.visible = false;
        const gl = add(new T.CircleGeometry(1.4, 24), new T.MeshBasicMaterial({ color: '#ff2a3a', transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }), x, -0.325, z, false); gl.rotation.x = -Math.PI / 2; cops.push({ m, gl, th: (k + 1) / (COPS.length + 1) * 0.85 }); });
      const chop = add(new T.PlaneGeometry(2.6, 2.6 * 18 / 44), new T.MeshBasicMaterial({ map: ntex(PX.gChopper(0)), transparent: true, alphaTest: 0.5, side: T.DoubleSide, color: '#c8c0d8', fog: false }), 0, 9, 0, false); chop.visible = false; const chT = [PX.gChopper(0), PX.gChopper(1)].map(ntex);
      const spot = add(new T.CircleGeometry(1.5, 32), new T.MeshBasicMaterial({ color: '#f4f0d8', transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }), 0, -0.31, 0, false); spot.rotation.x = -Math.PI / 2;
      let beam = null; { const g0 = new T.CylinderGeometry(0.12, 1.5, 1, 20, 1, true); g0.translate(0, -0.5, 0); beam = new T.Mesh(g0, new T.MeshBasicMaterial({ color: '#f4f0d8', transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); scene.add(beam); beam.visible = false; }
      let heat = 0; scene.userData.decay = (round) => { heat = Math.max(0, Math.min(1, ((round || 1) - 4) / 30)); cops.forEach(c2 => { c2.m.visible = heat >= c2.th; }); chop.visible = beam.visible = heat > 0.55; scene.fog && scene.fog.color.set('#1a1428').lerp(new T.Color('#24102a'), heat * 0.6); };
      scene.userData.decay(1);
      upd.push((t) => {
        const fl = Math.random() < 0.004 ? 0 : 1; lamps.forEach((f2, k) => f2(fl && Math.sin(t * 11 + k * 5) < 0.985 ? 1 : 0));
        fires.forEach((L, k) => { L.intensity = 1.8 + Math.sin(t * 17 + k * 3) * 0.35 + Math.sin(t * 29 + k) * 0.25; });
        const blink = Math.floor(t * 3) % 2;
        cops.forEach((c2, k) => { if (!c2.m.visible) { c2.gl.material.opacity = 0; return; } const b2 = (blink + k) % 2; c2.m.material.map = copTx[b2]; c2.gl.material.color.set(b2 ? '#ff2a3a' : '#2a5aff'); c2.gl.material.opacity = 0.12 + heat * 0.16; });
        if (chop.visible) { const a = t * 0.18, r = 4.5 + Math.sin(t * 0.37) * 2.5, sx = Math.cos(a * 1.3) * r, sz = Math.sin(a) * r; chop.position.set(sx * 0.6 - 3, 8.5 + Math.sin(t * 0.8) * 0.3, sz * 0.6 - 3); chop.material.map = chT[Math.floor(t * 14) % 2];
          const wp = chop.position; chop.rotation.y = 0; chop.lookAt(wp.x * 2, wp.y, wp.z * 2); chop.rotation.y += Math.PI / 2;
          spot.position.set(sx, -0.31, sz); spot.material.opacity = 0.16 + Math.sin(t * 7) * 0.02;
          beam.position.copy(chop.position); beam.lookAt(sx, -0.3, sz); beam.rotateX(-Math.PI / 2); const L2 = chop.position.distanceTo(spot.position); beam.scale.set(1, L2, 1); beam.material.opacity = 0.06; }
        else spot.material.opacity = 0;
      });
    } else if (theme === 'town') {
      // ===== 1983 年秋天的小鎮黃昏：郊區房子、楓樹、路燈、水塔；中央大楓樹底下有紅光裂縫；回合越後面越被藤蔓和孢子侵蝕 =====
      let pe0 = true; try { if (localStorage.getItem('mono-pixenv') === '0') pe0 = false; } catch (e) {} const PE = pe0 && root.MONO_PIXEL, PX = root.MONO_PIXEL; // PE：環境也換成像素立牌
      const nearest = (tx) => { tx.magFilter = T.NearestFilter; tx.minFilter = T.NearestFilter; tx.generateMipmaps = false; tx.anisotropy = 1; return tx; };
      const bbs = [], bb = (img, w, x, z, dim) => { const h = w * img.height / img.width, tx = nearest(tex(T, img)), m = add(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: 0.5, side: T.DoubleSide, color: dim || '#c8b8c0' }), x, h / 2 - 0.4, z, false); bbs.push(m); return m; };
      { const [c, g] = cvs(64, 512); const gr = g.createLinearGradient(0, 0, 0, 512);
        gr.addColorStop(0, '#1a1030'); gr.addColorStop(0.38, '#4a2448'); gr.addColorStop(0.55, '#c8584a'); gr.addColorStop(0.63, '#f2a05a'); gr.addColorStop(0.68, '#6a3a4a'); gr.addColorStop(1, '#1a1018');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 512); for (let k = 0; k < 80; k++) { g.fillStyle = `rgba(255,240,220,${rnd(0.2, 0.8)})`; g.fillRect(rnd(0, 64), rnd(0, 160), 1, 1); }
        if (PE) { g.clearRect(0, 0, 64, 512); PX.ditherSky(g, 64, 512, ['#1a1030', '#2a1838', '#4a2448', '#8a3a4a', '#c8584a', '#f2a05a', '#6a3a4a', '#1a1018']); for (let k = 0; k < 60; k++) { g.fillStyle = k % 4 ? '#c8c0e0' : '#ffffff'; g.fillRect(Math.floor(rnd(0, 64)), Math.floor(rnd(0, 150)), 1, 1); } }
        const st = tex(T, c); if (PE) nearest(st); scene.add(new T.Mesh(new T.SphereGeometry(140, 32, 16), new T.MeshBasicMaterial({ map: st, side: T.BackSide, fog: false, depthWrite: false }))); }
      scene.background = null;
      // 草地＋落葉
      { const [c, g] = cvs(512); g.fillStyle = '#4e5230'; g.fillRect(0, 0, 512, 512);
        for (let k = 0; k < 2600; k++) { g.fillStyle = `rgba(${rnd(60, 90)},${rnd(70, 90)},${rnd(30, 45)},${rnd(0.2, 0.5)})`; g.fillRect(rnd(0, 512), rnd(0, 512), rnd(1, 3), rnd(2, 5)); }
        for (let k = 0; k < 260; k++) { g.fillStyle = ['#c8461e', '#e07a2a', '#a8321e', '#d8a03a', '#7a3a1e'][k % 5]; g.globalAlpha = rnd(0.5, 0.9); g.save(); g.translate(rnd(0, 512), rnd(0, 512)); g.rotate(rnd(0, 6.28)); g.beginPath(); g.ellipse(0, 0, rnd(2, 4), rnd(1.5, 2.5), 0, 0, 7); g.fill(); g.restore(); } g.globalAlpha = 1;
        const gnd = add(new T.PlaneGeometry(160, 160), M('#ffffff', { map: PE ? nearest(tex(T, PX.grass(), 40)) : tex(T, c, 28), roughness: 1 }), 0, -0.36, 0, false); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = q.high; }
      // 柏油路（十字）
      const asph = PE ? M('#ffffff', { map: (() => { const tx = nearest(tex(T, PX.asphalt())); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(1, 40); return tx; })(), roughness: 0.95 }) : M('#2a2628', { roughness: 0.95 }), line = new T.MeshBasicMaterial({ color: '#e8c84a' });
      [[0, 1], [1, 0]].forEach(([dx, dz]) => { const r0 = add(new T.PlaneGeometry(dx ? 160 : 3.4, dz ? 160 : 3.4), asph, 0, -0.35, 0, false); r0.rotation.x = -Math.PI / 2; r0.receiveShadow = q.high;
        for (let k = -24; k <= 24; k++) { if (Math.abs(k) < 4) continue; const d = add(new T.PlaneGeometry(dx ? 1.2 : 0.12, dz ? 1.2 : 0.12), line, dx ? k * 3 : 0, -0.34, dz ? k * 3 : 0, false); d.rotation.x = -Math.PI / 2; } });
      // 郊區房子
      const houseCols = ['#e8dcc0', '#c8d8e0', '#e0c8a0', '#d8b0a0', '#c8d0b0', '#f0e8d8'], roofC = ['#4a3a3a', '#3a3a4a', '#5a3a2a', '#2a3a3a'];
      const winM = M('#ffd890', { emissive: '#ffb050', emissiveIntensity: 1.4 }), houses = [];
      let hs = 0; const house = (x, z, rot) => { if (PE) { const sd = hs++, m = bb(PX.house(sd), rnd(3.2, 3.8), x, z); m.userData.seed = sd; houses.push(m); return m; } const g2 = new T.Group(); g2.position.set(x, -0.36, z); g2.rotation.y = rot; scene.add(g2);
        const w = rnd(2.2, 3), d = rnd(1.8, 2.4), h = rnd(1.4, 2.2); const bm = M(houseCols[Math.floor(rnd(0, 6))], { roughness: 0.85 });
        const b = new T.Mesh(new T.BoxGeometry(w, h, d), bm); b.position.y = h / 2; b.castShadow = q.high; g2.add(b);
        { const sh = new T.Shape(); sh.moveTo(-w / 2 - 0.15, 0); sh.lineTo(w / 2 + 0.15, 0); sh.lineTo(0, d * 0.55); sh.lineTo(-w / 2 - 0.15, 0); const rf = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: d + 0.2, bevelEnabled: false }), M(roofC[Math.floor(rnd(0, 4))], { roughness: 0.8 })); rf.position.set(0, h, -d / 2 - 0.1); rf.castShadow = q.high; g2.add(rf); }
        for (let k = 0; k < 2; k++) { const wn = new T.Mesh(new T.PlaneGeometry(0.4, 0.45), winM); wn.position.set(-w * 0.25 + k * w * 0.5, h * 0.62, d / 2 + 0.01); g2.add(wn); }
        const door = new T.Mesh(new T.PlaneGeometry(0.4, 0.75), M('#5a3a2a')); door.position.set(0, 0.38, d / 2 + 0.012); g2.add(door);
        for (let k = 0; k < 9; k++) { const pk = new T.Mesh(new T.BoxGeometry(0.06, 0.4, 0.03), M('#f2f0ea')); pk.position.set(-w / 2 + k * w / 8, 0.2, d / 2 + 0.9); g2.add(pk); }
        houses.push(g2); return g2; };
      for (let k = 0; k < (q.high ? 22 : 14); k++) { const a = k / (q.high ? 22 : 14) * Math.PI * 2 + rnd(-0.06, 0.06), d = rnd(13, 19); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 2.6 || Math.abs(z) < 2.6) continue; house(x, z, -a - Math.PI / 2); }
      // 楓樹
      const trunkM = M('#4a3020', { roughness: 0.95 }), leafMs = ['#c8461e', '#e07a2a', '#a8321e', '#d89a3a'].map(c2 => M(c2, { roughness: 0.9, flatShading: true }));
      let ms = 0; const maple = (x, z, sc) => { if (PE) return bb(PX.tree(ms++ % 6, 1), 2.6 * sc, x, z); const g2 = new T.Group(); g2.position.set(x, -0.36, z); g2.scale.setScalar(sc); scene.add(g2);
        const tr = new T.Mesh(new T.CylinderGeometry(0.12, 0.2, 1.8, 7), trunkM); tr.position.y = 0.9; g2.add(tr);
        for (let k = 0; k < 7; k++) { const lf = new T.Mesh(new T.IcosahedronGeometry(rnd(0.55, 0.85), 0), leafMs[k % 4]); lf.position.set(rnd(-0.6, 0.6), rnd(1.8, 2.7), rnd(-0.6, 0.6)); lf.castShadow = q.high; g2.add(lf); } return g2; };
      for (let k = 0; k < (q.high ? 34 : 18); k++) { const a = rnd(0, 6.28), d = rnd(10, 30); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 2.4 || Math.abs(z) < 2.4) continue; maple(x, z, rnd(0.8, 1.4)); }
      // 路燈（會偶爾閃爍）
      const lampM = M('#fff0c0', { emissive: '#ffd27a', emissiveIntensity: 2 }), lamps = [];
      [[-2.2, 9], [2.2, -9], [9, 2.2], [-9, -2.2], [-2.2, -15], [2.2, 15], [15, -2.2], [-15, 2.2]].forEach(([x, z]) => { if (PE) { const m = bb(PX.lamp(1), 1.0, x, z, '#ffffff'), on = m.material.map, off = nearest(tex(T, PX.lamp(0))); let cur = 1; lamps.push({ material: { set emissiveIntensity(v) { const w = v > 1 ? 1 : 0; if (w !== cur) { cur = w; m.material.map = w ? on : off; } } } }); return; } add(new T.CylinderGeometry(0.05, 0.07, 3.2, 6), M('#2a2a2e', { metalness: 0.6 }), x, 1.24, z); const b = add(new T.SphereGeometry(0.16, 10, 8), lampM, x, 2.9, z, false); lamps.push(b); });
      // 遠方水塔＋森林
      if (PE) bb(PX.tower(), 6, -18, -24); else { const wt = new T.Group(); wt.position.set(-18, -0.36, -24); scene.add(wt); const leg = M('#6a6a70', { metalness: 0.5 }); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 6, 5), leg); l.position.set(a * 0.9, 3, b * 0.9); wt.add(l); });
        const tank = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 2, 16), M('#c8c8cc', { metalness: 0.4, roughness: 0.5 })); tank.position.y = 7; wt.add(tank); const cap = new T.Mesh(new T.ConeGeometry(1.7, 0.8, 16), M('#9a9aa0')); cap.position.y = 8.4; wt.add(cap); }
      const pine = M('#1a2418', { flatShading: true, roughness: 1 });
      for (let k = 0; k < (q.high ? 70 : 34); k++) { const a = rnd(0, 6.28), d = rnd(32, 55), h = rnd(4, 9); if (PE) { bb(PX.pine(k), h * 0.5, Math.cos(a) * d, Math.sin(a) * d, '#a898a8'); continue; } add(new T.ConeGeometry(h * 0.25, h, 6), pine, Math.cos(a) * d, h / 2 - 0.36, Math.sin(a) * d, false); }
      // ===== 中央：大楓樹＋樹根下的紅光裂縫 =====
      let bigBB = null; if (PE) bigBB = bb(PX.tree(1, 1, true), 4.6, 0, 0, '#d8c8c8');
      const big = new T.Group(); big.position.set(0, -0.36, 0); big.scale.setScalar(0.78); if (!PE) scene.add(big);
      const tb = new T.Mesh(new T.CylinderGeometry(0.35, 0.6, 3.2, 9), trunkM); tb.position.y = 1.6; tb.castShadow = q.high; big.add(tb);
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + 0.3; const br = new T.Mesh(new T.CylinderGeometry(0.08, 0.16, 1.8, 6), trunkM); br.position.set(Math.cos(a) * 0.5, 3.2, Math.sin(a) * 0.5); br.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); big.add(br); }
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; const rt = new T.Mesh(new T.CylinderGeometry(0.05, 0.16, 1.4, 6), trunkM); rt.position.set(Math.cos(a) * 0.65, 0.12, Math.sin(a) * 0.65); rt.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25); big.add(rt); }
      const crown = []; if (!PE) for (let k = 0; k < (q.high ? 22 : 14); k++) { const a = rnd(0, 6.28), d = rnd(0, 1.6); const lf = new T.Mesh(new T.IcosahedronGeometry(rnd(0.6, 1.0), 1), leafMs[k % 4]); lf.position.set(Math.cos(a) * d, rnd(3.6, 5.2), Math.sin(a) * d); lf.castShadow = q.high; big.add(lf); crown.push(lf); }
      // 裂縫：不規則的發光紅線＋地面紅光
      const [cc, cg] = cvs(256); cg.clearRect(0, 0, 256, 256); const crackPath = () => { cg.beginPath(); let x = 128, y = 128; cg.moveTo(x, y); for (let k = 0; k < 9; k++) { x += rnd(-22, 22); y += rnd(-22, 22); cg.lineTo(x, y); } cg.stroke(); };
      cg.strokeStyle = 'rgba(255,70,50,1)'; cg.shadowColor = '#ff2a1a'; cg.shadowBlur = 18; for (let k = 0; k < 9; k++) { cg.lineWidth = rnd(3, 8); crackPath(); } if (PE) { cg.clearRect(0, 0, 256, 256); cg.shadowBlur = 0; cg.imageSmoothingEnabled = false; cg.drawImage(PX.crackTex(3), 0, 0, 256, 256); }
      const glowM = new T.MeshBasicMaterial({ map: PE ? nearest(tex(T, cc)) : tex(T, cc), transparent: true, blending: T.AdditiveBlending, depthWrite: false, color: '#ff4a3a' });
      const crack = add(new T.PlaneGeometry(4.2, 4.2), glowM, 0, -0.33, 0, false); crack.rotation.x = -Math.PI / 2;
      const [hc, hg] = cvs(128); const rg = hg.createRadialGradient(64, 64, 0, 64, 64, 64); rg.addColorStop(0, 'rgba(255,60,40,.55)'); rg.addColorStop(1, 'rgba(255,60,40,0)'); hg.fillStyle = rg; hg.fillRect(0, 0, 128, 128);
      const halo = add(new T.PlaneGeometry(5, 5), new T.MeshBasicMaterial({ map: tex(T, hc), transparent: true, blending: T.AdditiveBlending, depthWrite: false }), 0, -0.32, 0, false); halo.rotation.x = -Math.PI / 2;
      const redL = new T.PointLight('#ff3a2a', 3, 7, 1.6); redL.position.set(0, 0.6, 0); scene.add(redL);
      // 孢子（倒影世界飄過來的灰白碎屑）
      const sporeM = new T.MeshBasicMaterial({ color: '#d8d0c8', transparent: true, opacity: 0.7, depthWrite: false }), spores = [];
      for (let k = 0; k < (q.high ? 90 : 45); k++) { const m = add(new T.SphereGeometry(0.035, 5, 4), sporeM, 0, 0, 0, false); m.userData = { a: rnd(0, 6.28), d: rnd(0.5, 14), h: rnd(0, 5), s: rnd(0.1, 0.35), on: k / (q.high ? 90 : 45) }; spores.push(m); }
      // 飄落的楓葉
      const leaves = [], leafG = new T.PlaneGeometry(0.16, 0.12);
      for (let k = 0; k < (q.high ? 40 : 20); k++) { const m = add(leafG, new T.MeshBasicMaterial({ color: ['#e07a2a', '#c8461e', '#d89a3a'][k % 3], side: T.DoubleSide }), 0, 0, 0, false); m.userData = { x: rnd(-12, 12), z: rnd(-12, 12), o: rnd(0, 1), s: rnd(0.08, 0.16) }; leaves.push(m); }
      // 侵蝕用的藤蔓：從裂縫往外爬、也爬上房子
      const vineM = M('#2a0e14', { roughness: 0.6, emissive: '#3a0610', emissiveIntensity: 0.4 }), vines = [];
      if (!PE) for (let k = 0; k < (q.high ? 26 : 14); k++) { const a = k / (q.high ? 26 : 14) * 6.28 + rnd(-0.1, 0.1); const pts = []; let x = Math.cos(a) * 0.8, z = Math.sin(a) * 0.8; for (let j = 0; j < 9; j++) { pts.push(new T.Vector3(x, -0.3 + Math.abs(Math.sin(j)) * 0.08, z)); const d = 0.8 + j * 0.5; x = Math.cos(a + Math.sin(j * 1.3) * 0.25) * d * (1 + j * 0.25); z = Math.sin(a + Math.sin(j * 1.3) * 0.25) * d * (1 + j * 0.25); }
        const v = add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.05, 5, false), vineM, 0, 0, 0, false); v.userData.k = k / (q.high ? 26 : 14); v.visible = false; vines.push(v); }
      houses.forEach((h, k) => { if (k % 2 || PE) return; for (let j = 0; j < 3; j++) { const pts = []; for (let q2 = 0; q2 < 6; q2++) pts.push(new T.Vector3(-1 + j * 0.9 + Math.sin(q2 * 1.7) * 0.25, q2 * 0.35, 1.2)); const v = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 20, 0.04, 4, false), vineM); v.visible = false; v.userData.k = 0.3 + (k % 7) / 10; h.add(v); vines.push(v); } });
      { const wp = new T.Vector3(); bbs.forEach(m => { m.onBeforeRender = (rr, sc, cam) => { m.getWorldPosition(wp); m.rotation.y = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z); }; }); }
      // ===== 像素版：地面藤蔓（從裂縫長到房子）、斑駁的紅光（中間夾黑色脈絡）、往上飄的黑色灰燼 =====
      let peDraw = null, ashes = null, pGlow = null;
      if (PE) { halo.visible = false;
        const hs2 = (x, y, s) => { const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453; return v - Math.floor(v); };
        const SZ = 42, NP = 640, ppu = NP / SZ, [vc, vg] = cvs(NP); vg.imageSmoothingEnabled = false;
        const vtx = nearest(tex(T, vc)), vp = add(new T.PlaneGeometry(SZ, SZ), new T.MeshBasicMaterial({ map: vtx, transparent: true, depthWrite: false, color: '#d0c0c8' }), 0, -0.328, 0, false); vp.rotation.x = -Math.PI / 2; vp.renderOrder = 3;
        // 藤蔓路徑：一半通往房子（長到房子門口），其他往外亂長
        const paths = [];
        houses.forEach((h, k) => { if (k % 2) return; const th = 0.3 + (k % 7) / 10; paths.push({ tx: h.position.x, tz: h.position.z, th, house: h, w: 5, k }); });
        for (let k = 0; k < (q.high ? 16 : 10); k++) { const a = k / (q.high ? 16 : 10) * 6.283 + 0.2, d = 7 + hs2(k, 1, 4) * 6; paths.push({ tx: Math.cos(a) * d, tz: Math.sin(a) * d, th: 0.3 + (k / (q.high ? 16 : 10)) * 0.65, w: 4, k: k + 40 }); }
        paths.forEach(pp => { const pts = []; let x = 0, z = 0; const L = Math.hypot(pp.tx, pp.tz), n = Math.ceil(L * ppu / 1.5); let a = Math.atan2(pp.tz, pp.tx);
          for (let i = 0; i <= n; i++) { const want = Math.atan2(pp.tz - z, pp.tx - x); a += Math.max(-0.25, Math.min(0.25, (want - a + Math.PI * 3) % (Math.PI * 2) - Math.PI)) * 0.3 + (hs2(i, pp.k, 7) - 0.5) * 0.5; x += Math.cos(a) * 1.5 / ppu; z += Math.sin(a) * 1.5 / ppu; pts.push([NP / 2 + x * ppu, NP / 2 + z * ppu]); if (Math.hypot(pp.tx - x, pp.tz - z) < 0.6) break; }
          pp.pts = pts; pp.br = Array.from({ length: Math.floor(pts.length / 14) }, (_, j) => ({ at: Math.floor((j + 0.5) * 14), d: hs2(j, pp.k, 9) > 0.5 ? 1 : -1, n: 6 + Math.floor(hs2(pp.k, j, 3) * 10) })); });
        const VR = (x, y, w, h, c) => { vg.fillStyle = c; vg.fillRect(Math.round(x), Math.round(y), w, h); };
        const drawVines = (dec) => { vg.clearRect(0, 0, NP, NP);
          paths.forEach(pp => { const f = Math.max(0, Math.min(1, (dec - (pp.th - 0.28)) / 0.28)); if (f <= 0) return; const m = Math.floor(pp.pts.length * f);
            for (let i = 0; i < m; i++) { const [x, y] = pp.pts[i], u = i / pp.pts.length, w = Math.max(1, Math.round(pp.w * (1 - u * 0.6) * (f < 1 && i > m - 12 ? (m - i) / 12 : 1))); VR(x - (w >> 1), y - (w >> 1), w, w, '#1a0608'); if (w > 2) VR(x - (w >> 1), y - (w >> 1), 1, 1, '#3a1018'); if (hs2(i, pp.k, 5) > 0.93) VR(x, y, 1, 1, '#d02030'); }
            pp.br.forEach(b => { if (b.at >= m) return; let [x, y] = pp.pts[b.at]; const [x2, y2] = pp.pts[Math.min(b.at + 1, pp.pts.length - 1)]; let a = Math.atan2(y2 - y, x2 - x) + b.d * 0.9; for (let j = 0; j < b.n; j++) { a += (hs2(j, b.at, pp.k) - 0.5) * 0.6; x += Math.cos(a) * 1.4; y += Math.sin(a) * 1.4; VR(x, y, j < 3 ? 2 : 1, j < 3 ? 2 : 1, '#1a0608'); } }); });
          vtx.needsUpdate = true;
          paths.forEach(pp => { if (!pp.house) return; const lv = Math.max(0, Math.min(3, Math.floor((dec - pp.th) / 0.12) + 1)), h = pp.house; if (h.userData.lv === lv) return; h.userData.lv = lv; h.material.map = nearest(tex(T, PX.house(h.userData.seed, lv))); }); };
        peDraw = drawVines;
        // 斑駁紅光：中心最亮、外圍漸暗，用粗顆粒雜訊讓局部變黑，再壓上黑色交錯脈絡
        { const N = 112, [gc, gg] = cvs(N), C = ['#000000', '#2a0402', '#5a0806', '#9a1608', '#d8341a', '#ff7a3a'];
          const nz = (x, y, s, c) => { const x0 = Math.floor(x / c), y0 = Math.floor(y / c), fx = x / c - x0, fy = y / c - y0, L = (a, b, k) => a + (b - a) * k; return L(L(hs2(x0, y0, s), hs2(x0 + 1, y0, s), fx), L(hs2(x0, y0 + 1, s), hs2(x0 + 1, y0 + 1, s), fx), fy); };
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = Math.hypot(x - N / 2, y - N / 2) / (N / 2); if (r >= 1) continue; const fall = Math.pow(1 - r, 1.1), v = fall * (0.2 + 0.8 * (nz(x, y, 1, 10) * 0.7 + nz(x, y, 2, 4) * 0.3)) * 1.45;
            const i = Math.max(0, Math.min(5, Math.floor(v * 6))); if (!i) continue; gg.fillStyle = C[i]; gg.fillRect(x, y, 1, 1); }
          gg.fillStyle = '#000'; for (let k = 0; k < 26; k++) { let a = hs2(k, 3, 3) * 6.283, x = N / 2 + Math.cos(a) * N * 0.45, y = N / 2 + Math.sin(a) * N * 0.45; const b = a + Math.PI + (hs2(k, 4, 3) - 0.5) * 1.6; for (let j = 0; j < N; j++) { x += Math.cos(b + Math.sin(j * 0.15 + k) * 0.15); y += Math.sin(b + Math.sin(j * 0.15 + k) * 0.15); gg.fillRect(Math.round(x), Math.round(y), 1, 1); } }
          pGlow = add(new T.PlaneGeometry(11, 11), new T.MeshBasicMaterial({ map: nearest(tex(T, gc)), transparent: true, blending: T.AdditiveBlending, depthWrite: false }), 0, -0.334, 0, false); pGlow.rotation.x = -Math.PI / 2; pGlow.renderOrder = 1; }
        // 小小的黑色灰燼：在裂縫上方慢慢旋轉往上飄
        { const n = q.high ? 220 : 120, pos = new Float32Array(n * 3), geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
          const seeds = Array.from({ length: n }, (_, k) => ({ a: hs2(k, 1, 1) * 6.283, d: 0.4 + Math.pow(hs2(k, 2, 1), 0.7) * 7, o: hs2(k, 3, 1), s: 0.05 + hs2(k, 4, 1) * 0.1, w: (hs2(k, 5, 1) - 0.5) * 0.4 }));
          ashes = new T.Points(geo, new T.PointsMaterial({ color: '#140808', size: 0.075, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false })); scene.add(ashes); ashes.userData = { seeds, pos, geo, n }; }
      }
      let decay = 0; scene.userData.decay = (round) => { decay = Math.max(0, Math.min(1, ((round || 1) - 4) / 30)); vines.forEach(v => { v.visible = decay > v.userData.k * 0.9; }); { const g2 = 1 + decay * 1.0; crack.scale.set(g2, g2, 1); halo.scale.set(1 + decay * 1.3, 1 + decay * 1.3, 1); redL.distance = 7 + decay * 7; crown.forEach((c2, k) => { c2.visible = decay < 0.45 + (k / crown.length) * 1.2; }); } if (peDraw) { const q2 = Math.round(decay * 20) / 20; if (q2 !== scene.userData.__pq) { scene.userData.__pq = q2; peDraw(q2); } } if (pGlow) { const g3 = 1 + decay * 0.9; pGlow.scale.set(g3, g3, 1); } if (ashes) ashes.geometry.setDrawRange(0, Math.round(ashes.userData.n * (0.35 + decay * 0.65))); if (bigBB) { const lv = decay < 0.3 ? 1 : decay < 0.6 ? 0.75 : decay < 0.85 ? 0.5 : 0.35; if (bigBB.userData.lv !== lv) { bigBB.userData.lv = lv; bigBB.material.map = nearest(tex(T, PX.tree(1, lv, true))); } } scene.fog && scene.fog.color.set('#4a2a3a').lerp(new T.Color('#3a0a14'), decay * 0.8); };
      scene.userData.decay(1);
      upd.push((t, dt) => {
        const flick = Math.random() < 0.004 ? 0.2 : 1; // 偶爾整個小鎮的燈閃一下
        lamps.forEach((l, k) => { l.material.emissiveIntensity = (Math.sin(t * 13 + k * 7) > 0.97 ? 0.3 : 2) * flick; });
        const pulse = 0.6 + Math.sin(t * 1.3) * 0.25 + Math.max(0, Math.sin(t * 0.37)) * 0.4 * decay + (Math.random() < 0.01 ? 0.6 : 0);
        glowM.opacity = Math.min(1, pulse); halo.material.opacity = Math.min(1, 0.5 + pulse * 0.5); redL.intensity = (2 + pulse * 2) * (1 + decay);
        if (ashes) { const u = ashes.userData; for (let i = 0; i < u.n; i++) { const s = u.seeds[i], p = (t * s.s + s.o) % 1, a = s.a + t * s.w + p * 2; u.pos[i * 3] = Math.cos(a) * s.d * (1 + decay * 0.6); u.pos[i * 3 + 1] = -0.2 + p * 4.5; u.pos[i * 3 + 2] = Math.sin(a) * s.d * (1 + decay * 0.6); } u.geo.attributes.position.needsUpdate = true; }
        if (pGlow) pGlow.material.opacity = Math.min(1, 0.7 + pulse * 0.3);
        spores.forEach(m => { const u = m.userData; m.visible = u.on < 0.25 + decay * 0.75; if (!m.visible) return; const a = u.a + t * u.s * 0.3; m.position.set(Math.cos(a) * u.d, (u.h + t * u.s) % 5, Math.sin(a) * u.d); });
        leaves.forEach(m => { const u = m.userData, p = (t * u.s + u.o) % 1; m.position.set(u.x + Math.sin(t + u.o * 9) * 0.8, 5.5 - p * 5.8, u.z + Math.cos(t * 0.8 + u.o * 7) * 0.6); m.rotation.set(t * 2 + u.o * 9, t * 1.5, t * 3); });
        crown.forEach((c2, k) => { c2.rotation.y = Math.sin(t * 0.5 + k) * 0.05; });
      });
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
      // 中央：林間噴泉廣場（女神雕像倒水、小天使、雕像群、白鴿、精靈粉塵）
      const marble = M('#f3eee2', { roughness: 0.45 }), stone = M('#cbbb9c', { roughness: 0.85 }), aged = M('#a99a7e', { roughness: 0.9 });
      // 鋪石地＋斑駁光影
      { const [c, g2] = cvs(512); g2.fillStyle = '#b9ab90'; g2.fillRect(0, 0, 512, 512);
        for (let r = 0; r < 12; r++) for (let k = 0; k < 6 + r * 6; k++) { const a0 = k / (6 + r * 6) * 6.283, rr = r * 21 + 6; g2.fillStyle = `hsl(38,${rnd(14, 24)}%,${rnd(58, 70)}%)`; g2.beginPath(); g2.arc(256 + Math.cos(a0) * rr, 256 + Math.sin(a0) * rr, rnd(8, 11), 0, 7); g2.fill(); }
        for (let k = 0; k < 70; k++) { g2.fillStyle = `rgba(255,246,210,${rnd(0.12, 0.3)})`; g2.beginPath(); g2.ellipse(rnd(0, 512), rnd(0, 512), rnd(6, 26), rnd(4, 14), rnd(0, 3), 0, 7); g2.fill(); }
        for (let k = 0; k < 40; k++) { g2.fillStyle = `rgba(60,70,40,${rnd(0.08, 0.18)})`; g2.beginPath(); g2.ellipse(rnd(0, 512), rnd(0, 512), rnd(10, 40), rnd(6, 20), rnd(0, 3), 0, 7); g2.fill(); }
        const fl = add(new T.CircleGeometry(3.5, 48), M('#ffffff', { map: tex(T, c), roughness: 0.9 }), 0, -0.36, 0, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = q.high; }
      // 水池：外緣石圈＋青綠水面（水紋會流動）
      const [wc, wg] = cvs(256); const wt = tex(T, wc, 2); wt.wrapS = wt.wrapT = T.RepeatWrapping;
      { wg.fillStyle = '#2fb3bf'; wg.fillRect(0, 0, 256, 256); for (let k = 0; k < 160; k++) { wg.strokeStyle = `rgba(210,255,250,${rnd(0.15, 0.45)})`; wg.lineWidth = rnd(1, 2.5); wg.beginPath(); const x = rnd(0, 256), y = rnd(0, 256), r = rnd(6, 20); wg.arc(x, y, r, rnd(0, 3), rnd(3, 6)); wg.stroke(); } wt.needsUpdate = true; }
      const rimG = new T.LatheGeometry([[2.0, -0.36], [2.25, -0.36], [2.3, -0.05], [2.36, 0.04], [2.36, 0.12], [2.0, 0.12], [2.0, -0.36]].map(([x, y]) => new T.Vector2(x, y)), 64);
      add(rimG, stone, 0, 0, 0);
      const pool = add(new T.CircleGeometry(2.02, 48), new T.MeshStandardMaterial({ color: '#ffffff', map: wt, roughness: 0.08, metalness: 0.2, emissive: '#1a8a94', emissiveIntensity: 0.35, transparent: true, opacity: 0.93 }), 0, 0.02, 0, false); pool.rotation.x = -Math.PI / 2;
      // 中柱＋上層水盆（有雕花托架）
      const stemG = new T.LatheGeometry([[0, -0.3], [0.5, -0.3], [0.42, 0], [0.26, 0.15], [0.22, 0.5], [0.3, 0.62], [0.95, 0.78], [1.15, 0.86], [1.15, 0.94], [0, 0.94]].map(([x, y]) => new T.Vector2(x, y)), 48);
      add(stemG, aged, 0, 0, 0);
      for (let k = 0; k < 4; k++) { const a0 = k / 4 * 6.283 + 0.4; const br = add(new T.TorusGeometry(0.16, 0.05, 8, 12, Math.PI), aged, Math.cos(a0) * 0.36, 0.42, Math.sin(a0) * 0.36); br.rotation.y = -a0; br.rotation.z = Math.PI / 2; }
      const bowlW = add(new T.CircleGeometry(1.08, 40), new T.MeshStandardMaterial({ color: '#ffffff', map: wt, roughness: 0.08, emissive: '#1a8a94', emissiveIntensity: 0.4 }), 0, 0.95, 0, false); bowlW.rotation.x = -Math.PI / 2;
      // 雕像：披袍人形
      const gold = M('#d4af37', { metalness: 0.9, roughness: 0.25 });
      const figure = (sc, pose) => {
        const f = new T.Group(); f.scale.setScalar(sc);
        const robe = new T.Mesh(new T.LatheGeometry([[0.26, 0], [0.24, 0.12], [0.19, 0.42], [0.13, 0.62], [0.15, 0.76], [0.16, 0.88], [0.11, 0.97], [0.05, 1.02]].map(([x, y]) => new T.Vector2(x, y)), 44), marble); f.add(robe);
        { const pa = robe.geometry.attributes.position; for (let v = 0; v < pa.count; v++) { const x = pa.getX(v), y = pa.getY(v), z = pa.getZ(v), an = Math.atan2(z, x), w = 1 + Math.max(0, 0.75 - y) * 0.12 * Math.sin(an * 11 + y * 2); pa.setX(v, x * w); pa.setZ(v, z * w); } robe.geometry.computeVertexNormals(); }
        const drape = new T.Mesh(new T.TorusGeometry(0.2, 0.035, 6, 18, Math.PI * 1.1), marble); drape.position.set(0, 0.55, 0.02); drape.rotation.set(0.25, 0, -0.6); f.add(drape);
        const sash = new T.Mesh(new T.TorusGeometry(0.16, 0.025, 6, 16), marble); sash.position.y = 0.8; sash.rotation.set(Math.PI / 2 - 0.5, 0, 0); f.add(sash);
        const nk = new T.Mesh(new T.CylinderGeometry(0.035, 0.045, 0.08, 8), marble); nk.position.y = 1.05; f.add(nk);
        const hd = new T.Mesh(new T.SphereGeometry(0.085, 16, 12), marble); hd.position.y = 1.15; hd.scale.set(0.9, 1.1, 0.95); f.add(hd);
        const hair = new T.Mesh(new T.SphereGeometry(0.09, 14, 10, 0, 6.283, 0, 1.6), marble); hair.position.set(0, 1.17, -0.012); f.add(hair);
        const bun = new T.Mesh(new T.SphereGeometry(0.045, 10, 8), marble); bun.position.set(0, 1.2, -0.085); f.add(bun);
        const nose = new T.Mesh(new T.ConeGeometry(0.014, 0.04, 5), marble); nose.position.set(0, 1.15, 0.085); nose.rotation.x = Math.PI / 2 + 0.3; f.add(nose);
        const wreath = new T.Mesh(new T.TorusGeometry(0.088, 0.012, 6, 20), gold); wreath.position.set(0, 1.2, -0.01); wreath.rotation.x = Math.PI / 2 - 0.25; f.add(wreath);
        const arm = (side, ex, ey, ez) => { const sh = new T.Vector3(side * 0.15, 0.95, 0), el = new T.Vector3(ex, ey, ez); const len = sh.distanceTo(el); const c = new T.Mesh(new T.CapsuleGeometry(0.035, len, 4, 8), marble); c.position.copy(sh).add(el).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), el.clone().sub(sh).normalize()); f.add(c); return el; };
        const out = [];
        if (pose === 'pour') { [-1, 1].forEach(sd => { const h = arm(sd, sd * 0.3, 0.66, 0.12); const urn = new T.Mesh(new T.LatheGeometry([[0, 0], [0.06, 0.02], [0.085, 0.08], [0.05, 0.16], [0.035, 0.19], [0.055, 0.22]].map(([x, y]) => new T.Vector2(x, y)), 16), marble); urn.position.set(h.x + sd * 0.02, h.y - 0.02, h.z); urn.rotation.z = sd * -1.9; f.add(urn); out.push(new T.Vector3(h.x + sd * 0.22, h.y - 0.08, h.z)); }); }
        else if (pose === 'raise') { arm(1, 0.16, 1.45, 0.05); arm(-1, -0.25, 0.6, 0.12); const wr = new T.Mesh(new T.TorusGeometry(0.07, 0.015, 6, 14), gold); wr.position.set(0.16, 1.52, 0.05); f.add(wr); }
        else if (pose === 'lyre') { arm(1, 0.1, 0.78, 0.2); arm(-1, -0.1, 0.8, 0.2); const ly = new T.Mesh(new T.TorusGeometry(0.09, 0.012, 6, 14, Math.PI * 1.3), gold); ly.position.set(0, 0.85, 0.23); ly.rotation.z = Math.PI * 1.35; f.add(ly); }
        else { arm(1, 0.12, 0.6, 0.1); arm(-1, -0.1, 0.62, 0.1); const bk = new T.Mesh(new T.BoxGeometry(0.16, 0.1, 0.04), aged); bk.position.set(0, 0.64, 0.14); f.add(bk); }
        f.traverse(m => { if (m.isMesh && q.high) { m.castShadow = true; m.receiveShadow = true; } });
        return { f, out };
      };
      const god = figure(1.05, 'pour'); god.f.position.set(0, 0.94, 0); scene.add(god.f);
      const godBase = add(new T.CylinderGeometry(0.28, 0.34, 0.1, 16), aged, 0, 0.97, 0);
      void godBase;
      // 兩個跪坐的小天使在水盆邊抱著水瓶倒水
      const kids = [];
      [-1, 1].forEach(sd => { const k = new T.Group(); k.position.set(sd * 0.82, 0.94, 0.25); k.rotation.y = sd * -0.9; scene.add(k);
        const bd = new T.Mesh(new T.SphereGeometry(0.12, 12, 10), marble); bd.position.y = 0.14; bd.scale.set(1, 1.15, 0.9); k.add(bd);
        const lg = new T.Mesh(new T.CapsuleGeometry(0.05, 0.14, 4, 8), marble); lg.position.set(0, 0.05, 0.08); lg.rotation.x = Math.PI / 2; k.add(lg);
        const hd = new T.Mesh(new T.SphereGeometry(0.075, 12, 10), marble); hd.position.y = 0.32; k.add(hd);
        [-1, 1].forEach(w => { const wi = new T.Mesh(new T.SphereGeometry(0.09, 10, 6, 0, 3.14), marble); wi.position.set(w * 0.08, 0.22, -0.08); wi.scale.set(0.5, 1.1, 0.3); wi.rotation.y = w * 0.6; k.add(wi); });
        const vs = new T.Mesh(new T.LatheGeometry([[0, 0], [0.05, 0.02], [0.065, 0.07], [0.035, 0.13], [0.04, 0.15]].map(([x, y]) => new T.Vector2(x, y)), 10), marble); vs.position.set(0, 0.22, 0.13); vs.rotation.x = 1.9; k.add(vs);
        k.traverse(m => { if (m.isMesh && q.high) m.castShadow = true; }); kids.push(k); });
      // 周圍雕像群：四座台座上不同姿態的雕像＋兩根愛奧尼克柱
      [['raise', 0.785], ['lyre', 2.356], ['book', 3.927], ['raise', 5.498]].forEach(([pose, a0], i) => {
        const x = Math.cos(a0) * 3.0, z = Math.sin(a0) * 3.0;
        add(new T.BoxGeometry(0.42, 0.5, 0.42), stone, x, -0.11, z); add(new T.BoxGeometry(0.5, 0.06, 0.5), aged, x, 0.17, z);
        const s2 = figure(0.62, pose); s2.f.position.set(x, 0.2, z); s2.f.lookAt(0, 0.2, 0); scene.add(s2.f); void i;
      });
      [0, Math.PI].forEach(a0 => { const x = Math.cos(a0) * 3.15, z = Math.sin(a0) * 3.15;
        add(new T.CylinderGeometry(0.17, 0.19, 1.9, 16), marble, x, 0.6, z);
        for (let k = 0; k < 12; k++) { const fl = add(new T.BoxGeometry(0.02, 1.85, 0.02), aged, x + Math.cos(k / 12 * 6.283) * 0.175, 0.6, z + Math.sin(k / 12 * 6.283) * 0.175, false); void fl; }
        add(new T.BoxGeometry(0.5, 0.1, 0.5), marble, x, 1.6, z); [-1, 1].forEach(sd => { const vo = add(new T.TorusGeometry(0.07, 0.03, 6, 12), marble, x + sd * 0.24, 1.52, z); vo.rotation.y = Math.PI / 2; });
        add(new T.BoxGeometry(0.4, 0.12, 0.4), stone, x, -0.3, z);
        const ivy = M('#4f7a34', { roughness: 1, flatShading: true }); for (let k = 0; k < 14; k++) { const u = k / 14; add(new T.SphereGeometry(rnd(0.05, 0.08), 6, 4), ivy, x + Math.cos(u * 9) * 0.19, -0.2 + u * 1.5, z + Math.sin(u * 9) * 0.19, false); } });
      // 花壇與灌木
      const leaf = M('#5f8a3a', { roughness: 1, flatShading: true }), petals = ['#e8455a', '#ff8fa8', '#ffffff', '#f6d36b'].map(c => M(c, { roughness: 0.8 }));
      for (let k = 0; k < 10; k++) { const a0 = k / 10 * 6.283 + 0.31; if (Math.abs(Math.cos(a0)) > 0.97) continue; const x = Math.cos(a0) * 2.75, z = Math.sin(a0) * 2.75; const bu = add(new T.SphereGeometry(0.26, 10, 8), leaf, x, -0.22, z); bu.scale.y = 0.65;
        for (let j = 0; j < 7; j++) add(new T.SphereGeometry(0.035, 6, 4), petals[(k + j) % 4], x + rnd(-0.2, 0.2), -0.1 + rnd(0, 0.06), z + rnd(-0.2, 0.2), false); }
      // 水流：女神雙瓶、小天使水瓶的拋物線水柱＋水盆邊緣的溢流水簾（流動紋理）
      const [sc3, sg3] = cvs(32, 128); sg3.clearRect(0, 0, 32, 128); sg3.fillStyle = 'rgba(200,245,255,0.35)'; sg3.fillRect(0, 0, 32, 128); for (let k = 0; k < 90; k++) { const x = rnd(0, 32), y = rnd(0, 128), l = rnd(14, 50), gr = sg3.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${rnd(0.5, 1)})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); sg3.fillStyle = gr; sg3.fillRect(x, y, rnd(0.8, 2), l); }
      const flowT = tex(T, sc3); flowT.wrapS = flowT.wrapT = T.RepeatWrapping;
      const flowM = new T.MeshBasicMaterial({ map: flowT, color: '#9fe8ff', transparent: true, opacity: 0.95, depthWrite: false, side: T.DoubleSide });
      const arcTube = (o, v, ground, r) => { const pts = []; for (let k = 0; k <= 16; k++) { const tt = k / 16 * 0.6; const y = o.y + v.y * tt - 4.9 * tt * tt; pts.push(new T.Vector3(o.x + v.x * tt, Math.max(ground, y), o.z + v.z * tt)); if (y < ground) break; }
        const tb = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, r, 6, false), flowM); scene.add(tb); return pts[pts.length - 1]; };
      const splash = [];
      god.f.updateMatrixWorld(true);
      god.out.forEach(pp => { const w = god.f.localToWorld(pp.clone()); splash.push(arcTube(w, new T.Vector3(Math.sign(w.x) * 0.5, 0.25, 0.08), 0.95, 0.045)); });
      kids.forEach(k => { k.updateMatrixWorld(true); const w = k.localToWorld(new T.Vector3(0, 0.2, 0.25)); const d = k.localToWorld(new T.Vector3(0, 0, 1)).sub(k.position).normalize(); splash.push(arcTube(w, d.multiplyScalar(0.55).setY(0.2), 0.95, 0.032)); });
      const curtain = add(new T.CylinderGeometry(1.17, 1.3, 0.9, 64, 1, true), new T.MeshBasicMaterial({ map: flowT, color: '#a8ecff', transparent: true, opacity: 0.85, depthWrite: false, side: T.DoubleSide }), 0, 0.47, 0, false);
      curtain.material.map = flowT.clone(); curtain.material.map.repeat.set(10, 1); curtain.material.map.needsUpdate = true;
      const dropM = new T.MeshBasicMaterial({ color: '#f0ffff', transparent: true, opacity: 0.8, depthWrite: false }), drops = [];
      splash.forEach(sp => { for (let k = 0; k < 5; k++) { const m = add(new T.SphereGeometry(0.014, 5, 4), dropM, sp.x, sp.y, sp.z, false); m.userData = { o: sp, a: rnd(0, 6.28), v: rnd(0.3, 0.6), ph: rnd(0, 1) }; drops.push(m); } });
      // 水面漣漪
      const rips = []; for (let k = 0; k < 6; k++) { const r = add(new T.RingGeometry(0.9, 0.94, 40), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, depthWrite: false }), 0, 0.03, 0, false); r.rotation.x = -Math.PI / 2; r.userData.o = k / 6; rips.push(r); }
      // 光束（林間灑下的光）
      const [bc, bg2] = cvs(32, 128); const grd = bg2.createLinearGradient(0, 0, 0, 128); grd.addColorStop(0, 'rgba(255,248,214,0)'); grd.addColorStop(0.35, 'rgba(255,244,200,0.22)'); grd.addColorStop(1, 'rgba(255,248,214,0)'); bg2.fillStyle = grd; bg2.fillRect(0, 0, 32, 128);
      const beamM = new T.MeshBasicMaterial({ map: tex(T, bc), transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      const beams = []; [[-0.8, 0.3, 0.5], [0.6, -0.5, 0.35], [1.4, 0.8, 0.28]].forEach(([x, z, w]) => { for (let r = 0; r < 2; r++) { const b = add(new T.PlaneGeometry(w, 7), beamM.clone(), x, 2.6, z, false); b.rotation.set(0, r * Math.PI / 2, 0.32); beams.push(b); } });
      // 精靈粉塵：會閃爍、慢慢往上飄的金綠光點
      const [sc2, sg] = cvs(32); const rg2 = sg.createRadialGradient(16, 16, 0, 16, 16, 16); rg2.addColorStop(0, 'rgba(255,255,255,1)'); rg2.addColorStop(0.25, 'rgba(255,250,200,0.8)'); rg2.addColorStop(1, 'rgba(255,240,160,0)'); sg.fillStyle = rg2; sg.fillRect(0, 0, 32, 32);
      const sprite = tex(T, sc2), dust = [];
      [['#ffd86a', 0], ['#b8ff9a', 2.1], ['#ffe9b0', 4.2]].forEach(([col, ph]) => {
        const n = q.high ? 40 : 20, pos = new Float32Array(n * 3), base = [];
        for (let k = 0; k < n; k++) { const a0 = rnd(0, 6.283), d = Math.sqrt(Math.random()) * 3.3; base.push([Math.cos(a0) * d, rnd(0, 3), Math.sin(a0) * d, rnd(0.15, 0.4), rnd(0, 6)]); }
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
        const pt = new T.Points(geo, new T.PointsMaterial({ color: col, map: sprite, size: 0.08, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); scene.add(pt);
        dust.push({ pt, pos, base, ph });
      });
      // 白鴿：繞著噴泉盤旋，翅膀拍動；另有兩隻停在池邊
      const doveM = M('#fbfbf6', { roughness: 0.7 }), beakM = M('#e09a6a');
      const dove = () => { const d = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), doveM); b.scale.set(0.8, 0.8, 1.6); d.add(b); const h = new T.Mesh(new T.SphereGeometry(0.045, 10, 8), doveM); h.position.set(0, 0.04, 0.11); d.add(h); const bk = new T.Mesh(new T.ConeGeometry(0.012, 0.035, 5), beakM); bk.position.set(0, 0.035, 0.16); bk.rotation.x = Math.PI / 2; d.add(bk); const tl = new T.Mesh(new T.ConeGeometry(0.05, 0.12, 4), doveM); tl.position.set(0, 0, -0.14); tl.rotation.x = -Math.PI / 2; tl.scale.y = 1; tl.scale.x = 1.4; d.add(tl);
        const wings = [-1, 1].map(sd => { const pv = new T.Group(); pv.position.set(sd * 0.04, 0.02, 0); const w = new T.Mesh(new T.PlaneGeometry(0.22, 0.11), new T.MeshStandardMaterial({ color: '#ffffff', side: T.DoubleSide, roughness: 0.7 })); w.position.x = sd * 0.11; w.rotation.x = -Math.PI / 2; pv.add(w); d.add(pv); return pv; }); d.userData.w = wings; scene.add(d); return d; };
      const flock = []; for (let k = 0; k < (q.high ? 7 : 4); k++) { const d = dove(); d.userData.r = rnd(1.6, 3.2); d.userData.h = rnd(2.2, 3.6); d.userData.s = rnd(0.35, 0.55) * (k % 2 ? 1 : -1); d.userData.o = rnd(0, 6.28); flock.push(d); }
      const perched = [[2.2, 0.13, 0.5, 1.2], [-1.9, 0.13, -1.15, -2.1]].map(([x, y, z, ry]) => { const d = dove(); d.position.set(x, y + 0.06, z); d.rotation.y = ry; d.userData.w.forEach(w => { w.rotation.z = 0; w.children[0].scale.set(0.6, 1, 1); }); return d; });
      const L = new T.PointLight('#fff1c8', 6, 8, 1.6); L.position.set(0, 2.6, 0.6); scene.add(L);
      upd.push((t) => {
        wt.offset.set(t * 0.02, t * 0.013);
        flowT.offset.y = t * 1.6; curtain.material.map.offset.y = t * 0.9;
        drops.forEach(m => { const u = m.userData, tt = ((t * 1.4 + u.ph) % 1) * 0.3; m.position.set(u.o.x + Math.cos(u.a) * u.v * tt, u.o.y + 1.2 * tt - 4.9 * tt * tt, u.o.z + Math.sin(u.a) * u.v * tt); });
        rips.forEach(r => { const p = (t * 0.35 + r.userData.o) % 1; const R = 1.2 + p * 0.8; r.scale.setScalar(R); r.material.opacity = 0.35 * (1 - p); });
        beams.forEach((b, k) => { b.material.opacity = 0.6 + Math.sin(t * 0.6 + k) * 0.3; });
        dust.forEach(D => { const { pos, base } = D; for (let k = 0; k < base.length; k++) { const [x, y, z, sp, o] = base[k]; const yy = (y + t * sp) % 3.2; pos[k * 3] = x + Math.sin(t * 0.7 + o) * 0.25; pos[k * 3 + 1] = yy - 0.1; pos[k * 3 + 2] = z + Math.cos(t * 0.6 + o) * 0.25; } D.pt.geometry.attributes.position.needsUpdate = true; D.pt.material.opacity = 0.45 + Math.sin(t * 2.3 + D.ph) * 0.45; D.pt.material.size = 0.06 + (Math.sin(t * 3.1 + D.ph) * 0.5 + 0.5) * 0.05; });
        flock.forEach((d, k) => { const u = d.userData, a0 = u.o + t * u.s; d.position.set(Math.cos(a0) * u.r, u.h + Math.sin(t * 0.9 + k) * 0.25, Math.sin(a0) * u.r); d.rotation.y = -a0 + (u.s > 0 ? 0 : Math.PI); const fl = Math.sin(t * 11 + k * 1.7) * 0.8; d.userData.w[0].rotation.z = -fl; d.userData.w[1].rotation.z = fl; });
        perched.forEach((d, k) => { const hop = Math.max(0, Math.sin(t * 0.8 + k * 2.5)) ** 20; d.position.y = 0.19 + hop * 0.12; d.children[1].position.y = 0.04 + Math.max(0, Math.sin(t * 3 + k)) * 0.015; });
        L.intensity = 5.5 + Math.sin(t * 1.3) * 0.6;
      });
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
    if (theme === 'alien') { // 深空異種：發光卵囊群 → 生物蜂巢丘 → 肋骨尖塔＋跳動的心臟 → 半埋的異種母艦
      const bone = M('#e3d9c0', { roughness: 0.32, metalness: 0.2 }), dark = M('#2a2034', { roughness: 0.15, metalness: 0.4 }), glow = (c, k) => M(c, { emissive: c, emissiveIntensity: k || 1.8 }), slime = M('#7affc8', { emissive: '#3affa0', emissiveIntensity: 1.2, transparent: true, opacity: 0.75, roughness: 0.1 });
      const egg = (x, z, s) => { const pts = []; for (let i = 0; i <= 12; i++) { const t2 = i / 12; pts.push(new T.Vector2(Math.sin(t2 * Math.PI) * 0.12 * s * (1 - t2 * 0.25), t2 * 0.3 * s)); } const m = add(new T.LatheGeometry(pts, 14), dark, x, 0, z);
        const core = add(new T.SphereGeometry(0.06 * s, 10, 8), glow(ctx.color, 1.6), x, 0.13 * s, z); for (let k = 0; k < 4; k++) { const v = add(new T.TorusGeometry(0.1 * s * Math.sin((k + 1) / 5 * Math.PI), 0.006, 4, 20), bone, x, 0.05 * s + k * 0.06 * s, z); v.rotation.x = Math.PI / 2; } void m; return core; };
      if (level === 1) { // 卵囊群：四顆大小不同的卵，裡面的光一起呼吸；地上一灘發光黏液
        const cores = [egg(0, 0, 1.2), egg(0.18, 0.1, 0.8), egg(-0.17, 0.08, 0.9), egg(0.05, -0.18, 0.7)];
        const pool = add(new T.CircleGeometry(0.3, 24), slime, 0, 0.012, 0); pool.rotation.x = -Math.PI / 2;
        upd.push(t => cores.forEach((c, k) => c.scale.setScalar(1 + Math.sin(t * 3 + k) * 0.18)));
      } else if (level === 2) { // 生物蜂巢丘：一團長滿孔洞的丘，孔裡透出紫光，表面有血管
        const mound = add(new T.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), M('#4a3a52', { roughness: 0.6, flatShading: true }), 0, 0, 0); mound.scale.y = 1.15;
        const holes = []; for (let k = 0; k < 9; k++) { const a = k * 2.4, h = 0.08 + (k % 3) * 0.1, r = Math.sqrt(Math.max(0.01, 0.32 * 0.32 - (h / 1.15) ** 2)); const hl = add(new T.CircleGeometry(0.035 + (k % 2) * 0.015, 12), glow('#c060ff', 2), Math.cos(a) * r, h, Math.sin(a) * r); hl.lookAt(Math.cos(a) * 3, h, Math.sin(a) * 3); holes.push(hl); }
        for (let k = 0; k < 6; k++) { const a = k * 1.05, vein = add(new T.TorusGeometry(0.3, 0.008, 4, 20, 1.2), M('#c03a6a', { emissive: '#801030', emissiveIntensity: 0.6 }), 0, 0, 0); vein.rotation.set(0, a, Math.PI / 2); }
        add(new T.ConeGeometry(0.05, 0.22, 8), bone, 0, 0.42, 0); add(new T.SphereGeometry(0.03, 8, 6), glow(ctx.color, 2.2), 0, 0.54, 0);
        upd.push(t => holes.forEach((h, k) => h.material.emissiveIntensity = 1.4 + Math.sin(t * 4 + k) * 0.8));
      } else if (level === 3) { // 肋骨尖塔：一根根彎曲的骨頭圍成尖塔，中間吊著一顆跳動的心臟
        for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283, pts = []; for (let q = 0; q <= 8; q++) { const u = q / 8; pts.push(new T.Vector3(Math.cos(a) * 0.28 * (1 - u * 0.85) + Math.cos(a + 1.57) * Math.sin(u * 3) * 0.03, u * 1.25, Math.sin(a) * 0.28 * (1 - u * 0.85))); }
          add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, 0.025 * 1, 6), bone, 0, 0, 0); }
        const mem = add(new T.ConeGeometry(0.24, 1.0, 7, 1, true), M('#5a2a4a', { transparent: true, opacity: 0.55, side: T.DoubleSide, roughness: 0.3 }), 0, 0.55, 0); void mem;
        const heart = add(new T.SphereGeometry(0.09, 14, 12), M('#d02a4a', { emissive: '#ff2a50', emissiveIntensity: 1.2, roughness: 0.3 }), 0, 0.55, 0); heart.scale.y = 1.25;
        add(new T.SphereGeometry(0.04, 10, 8), glow(ctx.color, 2.6), 0, 1.32, 0);
        upd.push(t => { const b = Math.pow(Math.max(0, Math.sin(t * 5)), 6); heart.scale.set(1 + b * 0.25, 1.25 + b * 0.3, 1 + b * 0.25); heart.material.emissiveIntensity = 1 + b * 2; });
      } else { // 異種母艦：半埋在地裡的生物機械飛碟，觸手垂地、發光環、往天上打的信號光柱
        g.userData.s = 0.9;
        const ship = new T.Group(); ship.position.set(0, 0.32, 0); ship.rotation.z = 0.28; g.add(ship);
        const disc = new T.Mesh(new T.SphereGeometry(0.5, 24, 12), dark); disc.scale.set(1, 0.22, 1); ship.add(disc);
        const dome = new T.Mesh(new T.SphereGeometry(0.22, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), M('#8a6aff', { emissive: '#5a3aff', emissiveIntensity: 1.2, transparent: true, opacity: 0.8, roughness: 0.1 })); dome.position.y = 0.08; ship.add(dome);
        const ring = new T.Mesh(new T.TorusGeometry(0.46, 0.02, 8, 48), glow(ctx.color, 2.4)); ring.rotation.x = Math.PI / 2; ship.add(ring);
        const lights = []; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283, l = new T.Mesh(new T.SphereGeometry(0.022, 8, 6), glow('#7affc8', 2)); l.position.set(Math.cos(a) * 0.4, -0.05, Math.sin(a) * 0.4); ship.add(l); lights.push(l); }
        for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283 + 0.3, pts = []; for (let q = 0; q <= 8; q++) { const u = q / 8; pts.push(new T.Vector3(Math.cos(a) * (0.3 + u * 0.25), -u * 0.5, Math.sin(a) * (0.3 + u * 0.25) + Math.sin(u * 5) * 0.04)); } ship.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, 0.025, 6), bone)); }
        for (let k = 0; k < 8; k++) add(new T.DodecahedronGeometry(0.07 + (k % 3) * 0.03, 0), M('#4a3a52', { flatShading: true }), Math.cos(k * 0.8) * 0.4 + 0.25, 0.04, Math.sin(k * 0.8) * 0.35);
        const beam = add(new T.CylinderGeometry(0.05, 0.12, 2.2, 16, 1, true), new T.MeshBasicMaterial({ color: '#b080ff', transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }), -0.08, 1.5, 0);
        upd.push(t => { ring.rotation.z = t * 0.8; dome.material.emissiveIntensity = 1 + Math.sin(t * 2) * 0.4; lights.forEach((l, k) => l.visible = (Math.floor(t * 6) + k) % 4 !== 0); beam.material.opacity = 0.16 + Math.sin(t * 3) * 0.08; });
      }
    } else if (theme === 'buddha') { // 神佛之境：土地公小廟 → 神社 → 三層寶塔 → 金色佛寺群
      const red = M('#b3191c', { roughness: 0.45 }), gold = M('#e0b040', { metalness: 0.85, roughness: 0.25 }), green = M('#2a6a4a', { roughness: 0.4 }), tile = M('#d0702a', { roughness: 0.35, metalness: 0.2 }), stone = M('#a09a90', { roughness: 0.9 }), lampM = M('#ffcf6a', { emissive: '#ffa030', emissiveIntensity: 2 });
      const eave = (y, w, d, h, mat, parent) => { // 兩端往上翹的屋頂
        const r = add(new T.CylinderGeometry(0.01, 1, h, 4, 1), mat, 0, y, 0, parent); r.rotation.y = Math.PI / 4; r.scale.set(w * 0.72, 1, d * 0.72);
        [-1, 1].forEach(sd => { const tail = add(new T.ConeGeometry(0.012, 0.09, 6), gold, sd * w * 0.47, y - h * 0.32, 0, parent); tail.rotation.z = sd * 0.9; }); };
      const banner = (x, z) => { add(new T.CylinderGeometry(0.008, 0.008, 0.6, 5), M('#5a4a3a'), x, 0.3, z); const f = add(new T.PlaneGeometry(0.1, 0.32), M(ctx.color, { side: T.DoubleSide }), x + 0.055, 0.42, z); upd.push(t => { f.rotation.y = Math.sin(t * 2.5 + x) * 0.35; }); };
      if (level === 1) { // 土地公小廟：紅牆小廟、燕尾屋頂、香爐冒煙、兩盞燈籠
        add(new T.BoxGeometry(0.34, 0.06, 0.3), stone, 0, 0.03, 0); add(new T.BoxGeometry(0.26, 0.24, 0.22), red, 0, 0.18, 0);
        add(new T.BoxGeometry(0.12, 0.14, 0.01), M('#2a0a0a'), 0, 0.15, 0.111); add(new T.SphereGeometry(0.02, 8, 6), lampM, 0, 0.16, 0.1);
        eave(0.36, 0.42, 0.34, 0.12, tile);
        add(new T.CylinderGeometry(0.04, 0.03, 0.05, 10), M('#6a5a3a', { metalness: 0.7 }), 0, 0.03, 0.23);
        [-0.17, 0.17].forEach(x => { const l = add(new T.SphereGeometry(0.03, 10, 8), M('#ff3a2a', { emissive: '#ff2a10', emissiveIntensity: 1.6 }), x, 0.28, 0.14); l.scale.y = 1.3; });
        const sm = []; for (let k = 0; k < 3; k++) { const s2 = add(new T.SphereGeometry(0.02, 8, 6), new T.MeshBasicMaterial({ color: '#e0d8e0', transparent: true, opacity: 0.3, depthWrite: false }), 0, 0.08, 0.23); s2.userData.o = k / 3; sm.push(s2); }
        upd.push(t => sm.forEach(s2 => { const p = (t * 0.3 + s2.userData.o) % 1; s2.position.set(Math.sin(t + p * 6) * 0.03, 0.08 + p * 0.4, 0.23); s2.scale.setScalar(1 + p * 2); s2.material.opacity = 0.3 * (1 - p); }));
        banner(-0.3, -0.2);
      } else if (level === 2) { // 神社：朱紅鳥居、注連繩、石燈籠一對、白牆小社殿
        const or = M('#e2401c', { roughness: 0.5 });
        [-0.18, 0.18].forEach(x => add(new T.CylinderGeometry(0.022, 0.026, 0.44, 10), or, x, 0.22, 0.24));
        add(new T.BoxGeometry(0.5, 0.035, 0.05), M('#1c1416'), 0, 0.46, 0.24).rotation.z = 0; add(new T.BoxGeometry(0.42, 0.025, 0.04), or, 0, 0.38, 0.24);
        const rope = add(new T.TorusGeometry(0.15, 0.012, 6, 20, Math.PI), M('#e8d8a0'), 0, 0.36, 0.24); rope.rotation.z = Math.PI; for (let k = 0; k < 3; k++) add(new T.PlaneGeometry(0.02, 0.05), M('#ffffff', { side: T.DoubleSide }), -0.08 + k * 0.08, 0.2, 0.245);
        add(new T.BoxGeometry(0.3, 0.06, 0.26), stone, 0, 0.03, -0.12); add(new T.BoxGeometry(0.24, 0.2, 0.2), M('#f0e8d8'), 0, 0.16, -0.12);
        [-0.08, 0.08].forEach(x => add(new T.BoxGeometry(0.02, 0.2, 0.02), or, x, 0.16, -0.015));
        const rf = add(new T.CylinderGeometry(0.01, 0.24, 0.16, 4), M('#3a3a42', { roughness: 0.5 }), 0, 0.34, -0.12); rf.rotation.y = Math.PI / 4; rf.scale.z = 0.8;
        [-0.3, 0.3].forEach(x => { add(new T.CylinderGeometry(0.03, 0.04, 0.12, 8), stone, x, 0.06, 0.12); add(new T.BoxGeometry(0.08, 0.06, 0.08), stone, x, 0.15, 0.12); add(new T.BoxGeometry(0.05, 0.035, 0.05), lampM, x, 0.15, 0.12); add(new T.ConeGeometry(0.07, 0.05, 4), stone, x, 0.205, 0.12).rotation.y = Math.PI / 4; });
        banner(-0.32, -0.25);
      } else if (level === 3) { // 三層寶塔：翹簷、每層掛風鈴、金色相輪、塔邊經幡串
        add(new T.BoxGeometry(0.42, 0.06, 0.42), stone, 0, 0.03, 0);
        const bells = [];
        for (let k = 0; k < 3; k++) { const s2 = 1 - k * 0.2, y = 0.06 + k * 0.34; add(new T.BoxGeometry(0.28 * s2, 0.24, 0.28 * s2), red, 0, y + 0.12, 0); add(new T.BoxGeometry(0.1 * s2, 0.14, 0.01), M('#2a0a0a'), 0, y + 0.1, 0.141 * s2);
          eave(y + 0.29, 0.5 * s2, 0.5 * s2, 0.1, green);
          [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b2]) => { const bl = add(new T.ConeGeometry(0.012, 0.03, 6), gold, a * 0.2 * s2, y + 0.22, b2 * 0.2 * s2); bells.push(bl); }); }
        add(new T.CylinderGeometry(0.012, 0.02, 0.3, 6), gold, 0, 1.2, 0); for (let k = 0; k < 5; k++) add(new T.TorusGeometry(0.03 - k * 0.003, 0.006, 4, 12), gold, 0, 1.1 + k * 0.05, 0).rotation.x = Math.PI / 2;
        const cols = ['#2a5bd7', '#ffffff', '#d7262a', '#2a9a4a', '#f2c230']; for (let k = 0; k < 7; k++) { const u = k / 6; const f = add(new T.PlaneGeometry(0.05, 0.07), M(cols[k % 5], { side: T.DoubleSide }), -0.3 + u * 0.28, 0.9 - u * 0.75 - Math.sin(u * Math.PI) * 0.05, 0.25); upd.push(t => { f.rotation.x = Math.sin(t * 3 + k) * 0.3; }); }
        upd.push(t => bells.forEach((b2, k) => { b2.rotation.z = Math.sin(t * 4 + k) * 0.3; }));
        banner(0.32, -0.25);
      } else { // 金色佛寺群：中央大金佛塔＋四座小塔、那伽欄杆、蓮花燈飄浮、金光
        add(new T.BoxGeometry(0.62, 0.08, 0.62), M('#e8e0d0', { roughness: 0.7 }), 0, 0.04, 0); add(new T.BoxGeometry(0.46, 0.06, 0.46), M('#e8e0d0'), 0, 0.11, 0);
        const stupa = (x, z, s) => { const pts = []; for (let i = 0; i <= 24; i++) { const t2 = i / 24; pts.push(new T.Vector2(t2 < 0.18 ? 0.42 - t2 * 0.25 : t2 < 0.45 ? 0.37 + Math.sin((t2 - 0.18) / 0.27 * Math.PI) * 0.05 - (t2 - 0.18) * 0.4 : Math.max(0.006, 0.28 * Math.pow(1 - (t2 - 0.45) / 0.55, 1.7)), t2 * 1.7)); } const m = add(new T.LatheGeometry(pts, 24), gold, x, 0.14, z); m.scale.setScalar(s); return m; };
        stupa(0, 0, 0.62); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b2]) => stupa(a * 0.25, b2 * 0.25, 0.3));
        for (let k = 0; k < 3; k++) add(new T.CylinderGeometry(0.2 - k * 0.04, 0.22 - k * 0.04, 0.05, 20), M('#f2ece0', { roughness: 0.6 }), 0, 0.165 + k * 0.05, 0);
        for (let k = 0; k < 3; k++) add(new T.TorusGeometry(0.22 - k * 0.04, 0.01, 6, 30), M('#c8302a', { roughness: 0.4 }), 0, 0.42 + k * 0.1, 0).rotation.x = Math.PI / 2;
        [-1, 1].forEach(sd => { const pts = []; for (let q = 0; q <= 8; q++) { const u = q / 8; pts.push(new T.Vector3(sd * 0.1, 0.12 + u * 0.03, 0.42 - u * 0.2 + Math.sin(u * 7) * 0.01)); } add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 10, 0.02, 6), M('#3a9a6a', { metalness: 0.5, roughness: 0.3 }), 0, 0, 0); const hd = add(new T.SphereGeometry(0.035, 10, 8), gold, sd * 0.1, 0.17, 0.44); hd.scale.set(1, 1.2, 0.7); });
        const lotus = []; for (let k = 0; k < 6; k++) { const lg = new T.Group(); g.add(lg); for (let q = 0; q < 6; q++) { const pt = new T.Mesh(new T.SphereGeometry(0.025, 8, 6), M('#ffb0c8', { emissive: '#ff6a9a', emissiveIntensity: 0.8 })); pt.scale.set(0.5, 1, 0.3); pt.position.set(Math.cos(q) * 0.015, 0.015, Math.sin(q) * 0.015); pt.rotation.z = Math.cos(q) * 0.6; pt.rotation.x = Math.sin(q) * 0.6; lg.add(pt); } const c = new T.Mesh(new T.SphereGeometry(0.012, 6, 4), lampM); c.position.y = 0.02; lg.add(c); lg.userData = { a: k / 6 * 6.28, r: 0.5 }; lotus.push(lg); }
        const L = Object.assign(new T.Object3D(), { intensity: 0 }) /* 建築不放真的光源：每多一盞燈所有材質都要重編譯，手機會卡又燙 */; L.position.set(0, 0.9, 0.4); g.add(L);
        upd.push(t => { L.intensity = 1.8 + Math.sin(t * 3) * 0.5; lotus.forEach((lg, k) => { const a = lg.userData.a + t * 0.25; lg.position.set(Math.cos(a) * 0.48, 0.5 + Math.sin(t * 1.3 + k) * 0.12 + k * 0.05, Math.sin(a) * 0.48); }); });
        banner(-0.36, 0.36);
      }
    } else if (theme === 'gang' && root.MONO_PIXEL && root.MONO_PIXEL.gangBuilding) { // 幫派街區：像素立牌建築（霓虹會閃、跑馬燈會跑）
      const P = root.MONO_PIXEL, tx = new T.CanvasTexture(P.gangBuilding(level, ctx.color, 0)); tx.magFilter = T.NearestFilter; tx.minFilter = T.NearestFilter; tx.generateMipmaps = false; tx.colorSpace = T.SRGBColorSpace;
      const w = 0.95, h = w * P.BH / P.BW, m = add(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: 0.5, side: T.DoubleSide }), 0, h / 2 - 0.02, 0);
      const wp = new T.Vector3(); m.onBeforeRender = (rr, sc, cam) => { m.getWorldPosition(wp); m.rotation.y = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z); };
      const sh = add(new T.CircleGeometry(0.32, 16), new T.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false }), 0, 0.012, 0); sh.rotation.x = -Math.PI / 2; sh.castShadow = false;
      let fr = -1; upd.push(t => { const f = Math.floor(t * 4) % 6; if (f !== fr) { fr = f; tx.image = P.gangBuilding(level, ctx.color, f); tx.needsUpdate = true; } });
    } else if (theme === 'town' && root.MONO_PIXEL) { // 怪奇小鎮：像素畫立牌建築（永遠面向鏡頭，燈會一格一格閃）
      const P = root.MONO_PIXEL, tx = new T.CanvasTexture(P.building(level, ctx.color, 0)); tx.magFilter = T.NearestFilter; tx.minFilter = T.NearestFilter; tx.generateMipmaps = false; tx.colorSpace = T.SRGBColorSpace;
      const w = 0.95, h = w * P.BH / P.BW, m = add(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: 0.5, side: T.DoubleSide }), 0, h / 2 - 0.02, 0);
      const wp = new T.Vector3(); m.onBeforeRender = (rr, sc, cam) => { m.getWorldPosition(wp); m.rotation.y = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z); };
      const sh = add(new T.CircleGeometry(0.32, 16), new T.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.3, depthWrite: false }), 0, 0.012, 0); sh.rotation.x = -Math.PI / 2; sh.castShadow = false;
      let fr = -1; upd.push(t => { const f = Math.floor(t * 3) % 6; if (f !== fr) { fr = f; tx.image = P.building(level, ctx.color, f); tx.needsUpdate = true; } });
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
        const L = Object.assign(new T.Object3D(), { intensity: 0 }) /* 建築不放真的光源：每多一盞燈所有材質都要重編譯，手機會卡又燙 */; L.position.set(0, 0.6, 0.5); g.add(L);
        upd.push(t => { fl.rotation.y = Math.sin(t * 3) * 0.4; cry.rotation.y = t; cry.position.y = 2.3 + Math.sin(t * 1.5) * 0.06; halo.position.y = 0.5 + Math.sin(t) * 0.15; halo.scale.setScalar(1 + Math.sin(t * 2) * 0.05); motes.forEach(m => { const a = m.userData.a + t * 0.8; m.position.set(Math.cos(a) * m.userData.r, 0.4 + Math.sin(t * 2 + m.userData.a) * 0.3, Math.sin(a) * m.userData.r); }); });
      }
    } else if (theme === 'ragnarok') { // 諸神黃昏：殘柱雕像 → 圓形小神殿 → 大神殿 → 浮空的阿斯嘉宮殿＋彩虹橋
      const marble = M('#f6f2e8', { roughness: 0.3 }), gold = M('#d4af37', { metalness: 0.9, roughness: 0.2 }), bronze = M('#8a6a3a', { metalness: 0.8, roughness: 0.35 });
      const col = (x, z, h, r) => { add(new T.CylinderGeometry(r, r * 1.08, h, 12), marble, x, h / 2 + 0.06, z); add(new T.BoxGeometry(r * 2.6, 0.03, r * 2.6), marble, x, h + 0.075, z); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; add(new T.BoxGeometry(0.004, h * 0.9, 0.004), M('#d8d0c0'), x + Math.cos(a) * r, h / 2 + 0.06, z + Math.sin(a) * r); } };
      const fire = (x, y, z) => { add(new T.CylinderGeometry(0.05, 0.03, 0.05, 10), bronze, x, y, z); const f = add(new T.ConeGeometry(0.035, 0.1, 8), M('#ffb040', { emissive: '#ff7a10', emissiveIntensity: 2.5, transparent: true, opacity: 0.9 }), x, y + 0.07, z); upd.push(t => { f.scale.set(1 + Math.sin(t * 13 + x) * 0.15, 1 + Math.sin(t * 9 + z) * 0.25, 1); }); };
      if (level === 1) { // 殘柱與雕像：底座、持矛雕像、倒下的斷柱、銅火盆
        add(new T.BoxGeometry(0.3, 0.16, 0.3), marble, 0, 0.08, 0); add(new T.BoxGeometry(0.34, 0.03, 0.34), marble, 0, 0.175, 0);
        add(new T.CylinderGeometry(0.06, 0.09, 0.32, 10), marble, 0, 0.35, 0); add(new T.SphereGeometry(0.055, 12, 10), marble, 0, 0.56, 0);
        add(new T.TorusGeometry(0.05, 0.01, 6, 14), M('#6a8a3a'), 0, 0.59, 0).rotation.x = Math.PI / 2;
        const sp = add(new T.CylinderGeometry(0.008, 0.008, 0.6, 5), bronze, 0.09, 0.45, 0); sp.rotation.z = -0.1; add(new T.ConeGeometry(0.02, 0.06, 6), gold, 0.12, 0.77, 0);
        const br = add(new T.CylinderGeometry(0.045, 0.045, 0.24, 12), marble, -0.26, 0.05, 0.16); br.rotation.set(0, 0.6, Math.PI / 2);
        fire(0.26, 0.03, 0.22);
      } else if (level === 2) { // 圓形小神殿：一圈柱子、圓頂、中間的小雕像與聖火
        add(new T.CylinderGeometry(0.3, 0.32, 0.06, 20), marble, 0, 0.03, 0);
        for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; col(Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0.42, 0.025); }
        add(new T.CylinderGeometry(0.29, 0.29, 0.05, 20), marble, 0, 0.53, 0); add(new T.SphereGeometry(0.27, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M('#c8d8e0', { metalness: 0.3, roughness: 0.4 }), 0, 0.55, 0);
        add(new T.ConeGeometry(0.03, 0.1, 8), gold, 0, 0.86, 0);
        add(new T.CylinderGeometry(0.04, 0.05, 0.12, 8), marble, 0, 0.12, 0); fire(0, 0.2, 0);
      } else if (level === 3) { // 大神殿：前廊雙排柱、三角山牆與浮雕、屋頂金色雕像、兩邊火盆
        add(new T.BoxGeometry(0.62, 0.05, 0.5), marble, 0, 0.025, 0); add(new T.BoxGeometry(0.56, 0.04, 0.44), marble, 0, 0.07, 0);
        for (let k = 0; k < 6; k++) { col(-0.24 + k * 0.096, 0.17, 0.46, 0.022); col(-0.24 + k * 0.096, -0.17, 0.46, 0.022); }
        add(new T.BoxGeometry(0.4, 0.4, 0.26), M('#e8e0d0'), 0, 0.29, 0);
        add(new T.BoxGeometry(0.6, 0.05, 0.46), marble, 0, 0.58, 0);
        const ped = new T.Shape(); ped.moveTo(-0.3, 0); ped.lineTo(0.3, 0); ped.lineTo(0, 0.14); ped.closePath(); const pg = add(new T.ExtrudeGeometry(ped, { depth: 0.46, bevelEnabled: false }), marble, 0, 0.605, -0.23); void pg;
        const fr = add(new T.ShapeGeometry(ped), M('#d4b060', { metalness: 0.6, roughness: 0.3 }), 0, 0.6, 0.235); fr.scale.set(0.8, 0.7, 1);
        add(new T.CylinderGeometry(0.02, 0.03, 0.12, 8), gold, 0, 0.8, 0.0); add(new T.SphereGeometry(0.025, 10, 8), gold, 0, 0.88, 0);
        [-0.34, 0.34].forEach(x => { add(new T.CylinderGeometry(0.02, 0.03, 0.2, 8), bronze, x, 0.1, 0.24); fire(x, 0.22, 0.24); });
      } else { // 阿斯嘉宮殿：浮在雲上的岩島、金頂宮殿、彩虹橋、偶爾打一道閃電
        g.userData.s = 0.95;
        const isle = new T.Group(); isle.position.y = 0.45; g.add(isle); upd.push(t => { isle.position.y = 0.45 + Math.sin(t * 1.2) * 0.04; });
        const rock = new T.Mesh(new T.ConeGeometry(0.36, 0.5, 9), M('#6a6470', { flatShading: true, roughness: 0.9 })); rock.rotation.x = Math.PI; rock.position.y = -0.25; isle.add(rock);
        const top = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.06, 9), M('#7a9a5a', { flatShading: true })); isle.add(top);
        const ia = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; isle.add(m); return m; };
        ia(new T.BoxGeometry(0.36, 0.26, 0.26), marble, 0, 0.16, -0.02);
        for (let k = 0; k < 5; k++) ia(new T.CylinderGeometry(0.018, 0.02, 0.26, 10), marble, -0.14 + k * 0.07, 0.16, 0.13);
        const dome = ia(new T.SphereGeometry(0.17, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, 0.3, -0.02); void dome;
        [-0.2, 0.2].forEach(x => { ia(new T.CylinderGeometry(0.05, 0.06, 0.42, 10), marble, x, 0.24, -0.08); ia(new T.ConeGeometry(0.07, 0.14, 10), gold, x, 0.52, -0.08); });
        for (let k = 0; k < 6; k++) { const sh = ia(new T.CircleGeometry(0.035, 14), k % 2 ? gold : bronze, -0.15 + k * 0.06, 0.3, 0.111); void sh; }
        const L = Object.assign(new T.Object3D(), { intensity: 0 }) /* 建築不放真的光源：每多一盞燈所有材質都要重編譯，手機會卡又燙 */; L.position.set(0, 0.4, 0.4); isle.add(L);
        // 彩虹橋：從島邊往下彎到地面
        const cols = ['#ff4a4a', '#ff9a3a', '#ffe04a', '#5ae07a', '#4ab0ff', '#9a6aff'];
        cols.forEach((c, k) => { const pts = []; for (let q = 0; q <= 16; q++) { const u = q / 16; pts.push(new T.Vector3(0.25 + u * 0.2, 0.48 - u * 0.47 + Math.sin(u * Math.PI) * 0.14, 0.15 + u * 0.2 + k * 0.03)); } const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.016, 5), M(c, { emissive: c, emissiveIntensity: 1.1 })); g.add(m); });
        const clouds = []; for (let k = 0; k < 5; k++) { const c = add(new T.SphereGeometry(0.1 + (k % 2) * 0.04, 10, 8), M('#ffffff', { transparent: true, opacity: 0.85, roughness: 1 }), Math.cos(k * 1.3) * 0.3, 0.12, Math.sin(k * 1.3) * 0.25); c.scale.y = 0.5; clouds.push(c); }
        const bolt = add(new T.CylinderGeometry(0.008, 0.008, 0.5, 4), new T.MeshBasicMaterial({ color: '#d8f0ff' }), -0.3, 0.95, 0); bolt.rotation.z = 0.4;
        upd.push(t => { bolt.visible = (t % 4) < 0.12 || ((t % 4) > 0.2 && (t % 4) < 0.28); clouds.forEach((c, k) => { c.position.x = Math.cos(k * 1.3 + t * 0.2) * 0.3; }); });
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
