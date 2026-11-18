// 怪奇小鎮的 16-bit 像素畫：角色（多個動作影格）、建築、格子圖示、動畫用的場景零件
// 全部用程式一格一格畫，再自動描深色外框；放大時用最近鄰，維持像素的銳利感
(function (root) {
  const P = {};
  const OUT = [22, 12, 26];
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
  // 畫完後自動描邊（透明格子旁邊有顏色就畫深色邊）
  function outline(c, col) {
    const g = c.getContext('2d'), W = c.width, H = c.height, im = g.getImageData(0, 0, W, H), d = im.data, out = g.createImageData(W, H), o = out.data, oc = col || OUT;
    const A = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4;
      if (A(x, y)) { o[i] = d[i]; o[i + 1] = d[i + 1]; o[i + 2] = d[i + 2]; o[i + 3] = d[i + 3]; }
      else if (A(x - 1, y) || A(x + 1, y) || A(x, y - 1) || A(x, y + 1)) { o[i] = oc[0]; o[i + 1] = oc[1]; o[i + 2] = oc[2]; o[i + 3] = 255; } }
    g.putImageData(out, 0, 0); return c;
  }
  P.outline = outline; P.canvas = canvas;

  // ================= 角色 =================
  // 畫布 36x52，角色本體在 (4,6) 開始的 28x44 範圍；手臂可以舉高、往外伸
  const SW = 36, SH = 52, OX = 4, OY = 6;
  P.SW = SW; P.SH = SH;
  // pose: { arms: [左, 右]（'down' 'up' 'out' 'fwd'）, legs: 'stand' 'a' 'b' 'jump', eyes: 'open' 'blink' 'wide' 'x' 'glow', mouth: 'smile' 'o' 'grin' 'flat', dy }
  function body(R, o, pose) {
    const sk = o.skin || '#f2c8a0', skd = o.skinD || '#d8a078', p = pose || {}, dy = p.dy || 0;
    const r = (x, y, w, h, c) => R(OX + x, OY + y + dy, w, h, c);
    // 腿
    const lg = p.legs || 'stand', L = lg === 'a' ? [-2, 1] : lg === 'b' ? [1, -2] : [0, 0], lh = lg === 'jump' ? 8 : 10;
    [[9 + L[0], o.pants, o.pantsD], [15 + L[1], o.pants, o.pantsD]].forEach(([x, c, cd]) => { r(x, 30, 4, lh, c); r(x + 3, 30, 1, lh, cd); r(x - 1, 30 + lh, 5, 2, o.shoe || '#f4f4f0'); r(x - 1, 31 + lh, 5, 1, o.shoeD || '#b0b0b8'); });
    // 身體
    r(7, 18, 14, 13, o.top); r(17, 18, 4, 13, o.topD); r(7, 18, 2, 13, o.topL || o.top);
    // 手臂
    const arms = p.arms || ['down', 'down'], hands = [];
    arms.forEach((m, k) => { const sx = k ? 21 : 4, sl = k ? (o.sleeveD || o.topD) : (o.sleeve || o.top), hs = k ? skd : sk, dir = k ? 1 : -1;
      if (m === 'up') { r(sx, 8, 3, 11, sl); r(sx, 6, 3, 2, hs); hands.push([OX + sx + 1, OY + 6 + dy]); }
      else if (m === 'out') { const x0 = k ? 21 : -2; r(x0, 19, 9, 3, sl); r(k ? 30 : -4, 19, 2, 3, hs); hands.push([OX + (k ? 31 : -3), OY + 20 + dy]); }
      else if (m === 'fwd') { r(sx, 19, 3, 6, sl); r(sx - dir * 2, 24, 3, 4, sl); r(sx - dir * 2, 28, 3, 2, hs); hands.push([OX + sx - dir * 2 + 1, OY + 28 + dy]); }
      else { r(sx, 19, 3, 9, sl); r(sx, 28, 3, 2, hs); hands.push([OX + sx + 1, OY + 29 + dy]); } });
    // 頭、臉
    r(8, 5, 12, 12, sk); r(17, 5, 3, 12, skd); r(13, 17, 3, 1, skd);
    const ey = p.eyes || 'open';
    if (ey === 'blink') { r(10, 11, 2, 1, '#1a1020'); r(16, 11, 2, 1, '#1a1020'); }
    else if (ey === 'x') { r(10, 10, 1, 1, '#1a1020'); r(11, 11, 1, 1, '#1a1020'); r(10, 11, 1, 1, '#1a1020'); r(11, 10, 1, 1, '#1a1020'); r(16, 10, 1, 1, '#1a1020'); r(17, 11, 1, 1, '#1a1020'); r(16, 11, 1, 1, '#1a1020'); r(17, 10, 1, 1, '#1a1020'); }
    else if (ey === 'glow') { r(10, 10, 2, 2, o.glow || '#ffffff'); r(16, 10, 2, 2, o.glow || '#ffffff'); }
    else { r(10, 10, 2, 2, '#1a1020'); r(16, 10, 2, 2, '#1a1020'); r(10, 10, 1, 1, '#ffffff'); r(16, 10, 1, 1, '#ffffff'); if (ey === 'wide') { r(9, 9, 4, 1, sk); r(15, 9, 4, 1, sk); } }
    const mo = p.mouth || 'smile';
    if (mo === 'o') { r(13, 13, 2, 3, '#4a1010'); } else if (mo === 'grin') { r(11, 14, 6, 2, '#ffffff'); r(11, 14, 6, 1, '#a04040'); } else if (mo === 'flat') r(12, 14, 4, 1, '#7a3030'); else { r(12, 14, 4, 1, o.mouth || '#a04040'); r(11, 13, 1, 1, o.mouth || '#a04040'); r(16, 13, 1, 1, o.mouth || '#a04040'); }
    r(9, 13, 1, 1, '#f0a090'); r(18, 13, 1, 1, '#e08070');
    return { r, hands };
  }
  // 八個原創角色：colors＋髮型與配件
  P.CHARS = [
    { name: '單車男孩', o: { top: '#d8323a', topD: '#a01e28', topL: '#f05a5a', pants: '#3a5a9a', pantsD: '#2a4278' }, extra: (r, R, h, p) => { r(7, 22, 14, 2, '#f4f0e8'); r(8, 3, 12, 5, '#5a3a24'); r(7, 4, 3, 6, '#5a3a24'); r(18, 4, 3, 5, '#4a2e1a'); r(10, 3, 3, 2, '#7a5034');
      const [x, y] = h[1]; R(x - 1, y - 4, 3, 6, '#2a2a30'); R(x, y - 9, 1, 5, '#8a8a90'); R(x, y - 10, 1, 1, '#ff3a3a'); } },
    { name: '念力女孩', glow: '#d8b0ff', o: { top: '#f2c83a', topD: '#c89a1a', topL: '#ffe07a', pants: '#3a3a5a', pantsD: '#2a2a44', shoe: '#c83a3a', shoeD: '#8a2020', glow: '#e8c8ff' }, extra: (r, R, h, p) => { r(8, 3, 12, 4, '#1a1418'); r(7, 4, 2, 10, '#1a1418'); r(19, 4, 2, 10, '#1a1418'); r(20, 12, 2, 2, '#1a1418'); r(21, 14, 2, 3, '#2a2228'); r(21, 17, 2, 3, '#1a1418'); r(21, 20, 2, 1, '#c83a8a');
      if (p.eyes !== 'glow' && p.eyes !== 'x') { r(9, 9, 4, 4, '#c8a0ff'); r(15, 9, 4, 4, '#c8a0ff'); r(10, 10, 2, 2, p.eyes === 'blink' ? '#c8a0ff' : '#ffffff'); r(16, 10, 2, 2, p.eyes === 'blink' ? '#c8a0ff' : '#ffffff'); } r(13, 10, 2, 1, '#2a2228'); r(7, 20, 14, 1, '#c89a1a'); r(13, 18, 1, 13, '#c89a1a'); } },
    { name: '發明家男孩', o: { top: '#3a8a4a', topD: '#286034', topL: '#5aaa6a', pants: '#8a6a3a', pantsD: '#6a4e28', skin: '#a8704a', skinD: '#8a5634', mouth: '#5a2020' }, extra: (r, R, h) => { r(8, 3, 12, 4, '#1a1010'); r(7, 4, 2, 4, '#1a1010'); r(19, 4, 2, 4, '#1a1010'); r(8, 6, 12, 3, '#5a5a62'); r(9, 6, 4, 3, '#7ad8ff'); r(15, 6, 4, 3, '#7ad8ff'); r(10, 7, 1, 1, '#ffffff'); r(16, 7, 1, 1, '#ffffff');
      r(9, 22, 3, 3, '#286034'); r(16, 22, 3, 3, '#286034'); r(9, 22, 3, 1, '#ffd23a'); r(1, 15, 6, 14, '#c8642a'); r(1, 15, 6, 2, '#e08a4a'); r(3, 8, 1, 7, '#9a9aa2'); r(3, 7, 1, 1, '#ff3a3a'); const [x, y] = h[1]; R(x - 2, y, 5, 4, '#c82a2a'); R(x - 1, y - 1, 3, 1, '#7a1a1a'); } },
    { name: '滑板女孩', o: { top: '#3a6aaa', topD: '#2a4e80', topL: '#5a8ac8', pants: '#3a6aaa', pantsD: '#2a4e80' }, extra: (r, R, h) => { r(7, 18, 14, 4, '#f4f0e8'); r(7, 19, 14, 1, '#e5383b'); r(7, 21, 14, 1, '#e5383b'); r(9, 18, 2, 6, '#2a4e80'); r(17, 18, 2, 6, '#2a4e80');
      r(7, 3, 14, 4, '#2ac8c0'); r(6, 4, 3, 10, '#2ac8c0'); r(19, 4, 3, 10, '#1aa098'); r(9, 3, 4, 2, '#5ae8e0'); r(13, 5, 6, 2, '#2ac8c0'); const [x, y] = h[1]; R(x + 1, y - 18, 3, 22, '#2a2a2a'); R(x + 1, y - 18, 3, 2, '#ff8c1a'); R(x + 1, y + 2, 3, 2, '#ff8c1a'); R(x, y - 16, 1, 2, '#ffe08a'); R(x, y, 1, 2, '#ffe08a'); } },
    { name: '小鎮警長', o: { top: '#b89a6a', topD: '#8a7048', topL: '#d0b488', pants: '#5a4a32', pantsD: '#443624', shoe: '#2a1e14', shoeD: '#1a1008' }, extra: (r, R, h, p) => { r(8, 3, 12, 4, '#7a4a2a'); r(7, 4, 2, 8, '#7a4a2a'); r(19, 4, 2, 8, '#6a3a1e'); r(5, 5, 18, 1, '#3a2a1a'); r(9, 1, 10, 4, '#3a2a1a'); r(9, 3, 10, 1, '#b89a6a');
      if (p.eyes !== 'x') { r(9, 9, 10, 3, '#1a1a22'); r(10, 9, 3, 1, '#7a8aa8'); r(16, 9, 2, 1, '#7a8aa8'); } r(9, 21, 3, 3, '#ffd23a'); r(10, 22, 1, 1, '#c89a1a'); r(7, 28, 14, 2, '#2a1e14'); r(13, 28, 2, 2, '#c8a040'); const [x, y] = h[0]; R(x - 3, y - 1, 4, 3, '#2a2a2e'); R(x - 4, y, 1, 1, '#fff8c0'); } },
    { name: '校隊隊長', o: { top: '#b0202a', topD: '#80141c', topL: '#d84048', pants: '#2a2a3a', pantsD: '#1a1a28', sleeve: '#f2f0ea', sleeveD: '#c8c4bc' }, extra: (r, R, h, p) => { r(8, 2, 12, 5, '#e8c45a'); r(7, 4, 2, 4, '#e8c45a'); r(19, 4, 2, 3, '#c8a03a'); r(10, 1, 6, 2, '#f8dc7a'); r(13, 18, 2, 13, '#f2f0ea'); r(9, 21, 3, 4, '#f2f0ea'); r(10, 22, 1, 2, '#b0202a');
      const [x, y] = h[1]; if ((p.arms || [])[1] === 'up') { R(x, y - 16, 2, 18, '#7a7a84'); R(x - 2, y - 16, 3, 2, '#9a9aa4'); } else { R(x, y - 18, 2, 20, '#7a7a84'); R(x - 1, y - 18, 3, 2, '#9a9aa4'); R(x + 2, y - 19, 2, 2, '#7a7a84'); } } },
    { name: '鍵盤手', o: { top: '#1a1a22', topD: '#0e0e14', topL: '#2e2e3a', pants: '#2a2a3a', pantsD: '#1a1a28', shoe: '#1a1a1a', shoeD: '#0a0a0a' }, extra: (r, R, h, p, f) => { r(12, 0, 4, 6, '#ff3ab0'); r(13, 0, 2, 1, '#ff8ad8'); r(8, 5, 4, 2, '#3a2a30'); r(16, 5, 4, 2, '#3a2a30');
      r(8, 19, 1, 1, '#c8c8d0'); r(10, 19, 1, 1, '#c8c8d0'); r(17, 19, 1, 1, '#c8c8d0'); r(19, 19, 1, 1, '#c8c8d0'); r(9, 20, 10, 1, '#ffd23a');
      r(3, 24, 22, 4, '#f4f0e8'); for (let k = 0; k < 7; k++) r(5 + k * 3, 24, 1, 2, '#1a1a22'); r(3, 27, 22, 1, (f || 0) % 2 ? '#ff3ab0' : '#3af0ff'); r(24, 20, 3, 5, '#3af0ff'); } }
  ];
  // 藤蔓鹿怪：比人高，自己的骨架
  function monster(R, p, f) {
    const b = '#2a1418', bd = '#1a0a0e', bl = '#4a2228', red = '#e0283a', dy = (p && p.dy) || 0, r = (x, y, w, h, c) => R(OX + x, OY + y + dy, w, h, c);
    const sw = (f || 0) % 2;
    r(10, 9, 8, 7, b); r(16, 9, 2, 7, bd); r(10, 9, 1, 7, bl); r(11, 15, 6, 3, b); r(12, 11, 1, 1, p && p.eyes === 'glow' ? '#ff4a4a' : '#ffffff'); r(15, 11, 1, 1, p && p.eyes === 'glow' ? '#ff4a4a' : '#ffffff'); r(13, 15, 2, 2, '#5a0a10');
    [[8, 8], [7, 6], [6, 4], [5, 2], [7, 3], [4, 5], [3, 1]].forEach(([x, y], k) => r(x - (k > 4 ? sw : 0), y, 2, 2, b)); [[18, 8], [19, 6], [20, 4], [21, 2], [19, 3], [22, 5], [23, 1]].forEach(([x, y], k) => r(x + (k > 4 ? sw : 0), y, 2, 2, b));
    r(5, 1, 1, 1, red); r(22, 1, 1, 1, red); r(4, 4, 1, 1, red); r(23, 4, 1, 1, red); r(3, 0, 1, 1, red); r(24, 0, 1, 1, red);
    r(9, 18, 10, 13, b); r(16, 18, 3, 13, bd); r(9, 18, 2, 13, bl); const pulse = (f || 0) % 3 === 0 ? '#ff6a6a' : red; r(13, 20, 1, 6, pulse); r(12, 22, 1, 2, pulse); r(14, 23, 1, 2, pulse); r(13, 21, 1, 1, '#ffb0b0');
    const armUp = p && p.arms && p.arms[0] === 'up';
    if (armUp) { r(5, 6, 3, 13, b); r(20, 6, 3, 13, bd); r(4, 3, 1, 3, bd); r(6, 3, 1, 3, bd); r(21, 3, 1, 3, bd); r(23, 3, 1, 3, bd); }
    else if (p && p.arms && p.arms[0] === 'out') { r(-3, 19, 12, 3, b); r(19, 19, 12, 3, bd); r(-5, 18, 2, 1, bd); r(-5, 21, 2, 1, bd); r(31, 18, 2, 1, bd); r(31, 21, 2, 1, bd); }
    else { r(6, 18, 3, 16, b); r(19, 18, 3, 16, bd); r(5, 34, 1, 3, bd); r(7, 34, 1, 3, bd); r(19, 34, 1, 3, bd); r(21, 34, 1, 3, bd); }
    const lg = (p && p.legs) || 'stand', L = lg === 'a' ? [-2, 1] : lg === 'b' ? [1, -2] : [0, 0];
    r(10 + L[0], 31, 3, 11, b); r(15 + L[1], 31, 3, 11, bd); r(9 + L[0], 41, 4, 1, bd); r(15 + L[1], 41, 4, 1, bd);
  }
  // 沒有預設角色（自畫角色當受害者）時用的灰色小孩
  const GENERIC = { o: { top: '#8a8a96', topD: '#6a6a78', pants: '#4a4a5a', pantsD: '#3a3a48' }, extra: (r) => { r(8, 3, 12, 4, '#4a3a2e'); r(7, 4, 2, 6, '#4a3a2e'); r(19, 4, 2, 6, '#3a2a1e'); } };
  const cache = {};
  // 取得角色某個動作的影格（快取）
  P.sprite = function (i, pose, f) {
    const key = i + '|' + JSON.stringify(pose || {}) + '|' + (f || 0); if (cache[key]) return cache[key];
    const [c, g] = canvas(SW, SH); const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    if (i === 7) monster(R, pose || {}, f);
    else { const ch = i >= 0 && i < 7 ? P.CHARS[i] : GENERIC, pz = Object.assign({}, pose || {}); const { r, hands } = body(R, ch.o, pz); ch.extra(r, R, hands, pz, f); }
    outline(c); return (cache[key] = c);
  };
  // 棋盤上的動作 → 影格
  P.tokenFrame = function (i, state, t) {
    const blink = (t % 3.3) < 0.14, f = Math.floor(t * 4);
    if (state === 'walk') return P.sprite(i, { legs: Math.floor(t * 8) % 2 ? 'a' : 'b', arms: ['down', 'down'] }, f % 2);
    if (state === 'joy') return P.sprite(i, { arms: ['up', 'up'], legs: Math.floor(t * 6) % 2 ? 'jump' : 'stand', mouth: 'grin', dy: Math.floor(t * 6) % 2 ? -2 : 0 }, f % 2);
    if (state === 'scared') return P.sprite(i, { arms: ['out', 'out'], eyes: 'wide', mouth: 'o', dy: Math.floor(t * 20) % 2 }, f % 2);
    if (state === 'sad') return P.sprite(i, { eyes: 'blink', mouth: 'flat' }, 0);
    if (state === 'fall') return P.sprite(i, { eyes: 'x', mouth: 'o' }, 0);
    if (i === 1) return P.sprite(i, { arms: ['down', (t % 6) > 4 ? 'up' : 'down'], eyes: (t % 6) > 4 ? 'glow' : blink ? 'blink' : 'open' }, f % 2);
    return P.sprite(i, { eyes: blink ? 'blink' : 'open' }, f % 3);
  };

  // ================= 建築：四個等級，每個有 2～4 個動畫影格 =================
  const BW = 48, BH = 56;
  P.BW = BW; P.BH = BH;
  P.building = function (level, color, f) {
    const key = 'b' + level + color + (f || 0); if (cache[key]) return cache[key];
    const [c, g] = canvas(BW, BH); const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const blink = (k) => ((f || 0) + k) % 4 === 0, bulbs = ['#ff3a3a', '#3aff6a', '#3ab0ff', '#ffd23a', '#ff8ac0'];
    if (level === 1) { // 檸檬汁攤
      R(10, 36, 28, 16, '#8a5a34'); R(10, 36, 28, 2, '#a87048'); R(34, 36, 4, 16, '#6a4024'); R(8, 34, 32, 3, '#c8a070'); R(12, 42, 24, 7, '#ffe86a'); R(14, 44, 2, 3, '#c8202a'); R(18, 44, 2, 3, '#c8202a'); R(22, 44, 2, 3, '#c8202a'); R(26, 44, 2, 3, '#c8202a'); R(30, 44, 2, 3, '#c8202a');
      R(11, 16, 2, 18, '#6a4024'); R(35, 16, 2, 18, '#6a4024'); for (let k = 0; k < 8; k++) R(8 + k * 4, 12 + (k % 2), 4, 6, k % 2 ? '#ffffff' : '#e5383b'); R(8, 18, 32, 1, '#a01e28');
      R(14, 27, 6, 7, '#ffe86a'); R(15, 26, 4, 1, '#f4f4f0'); R(14, 27, 1, 7, '#fff4a8'); R(24, 30, 3, 4, '#f4f0e8'); R(29, 30, 3, 4, '#f4f0e8'); R(24, 30, 3, 1, '#ffe86a');
      R(39, 22, 1, 12, '#ddd'); R(40, 22, 6, 4, color); }
    else if (level === 2) { // 車庫樂團練團室
      R(4, 24, 40, 30, '#d8ccb0'); R(4, 24, 3, 30, '#e8dcc0'); R(40, 24, 4, 30, '#b8ac90');
      for (let k = 0; k < 11; k++) R(4 + k * 2 - 1, 23 - k, 44 - k * 4 + 2, 1, '#5a3a3a'); R(2, 22, 44, 3, '#4a2a2a');
      R(9, 34, 30, 20, '#1a1418'); R(9, 34, 30, 7, '#e8e2d4'); R(9, 37, 30, 1, '#b8b0a0'); R(9, 39, 30, 1, '#b8b0a0');
      R(13, 45, 7, 7, '#c8202a'); R(14, 46, 5, 5, '#e8e2d4'); R(22, 44, 4, 3, '#e8e2d4'); R(28, 41, 6, 1, '#e8c04a'); R(30, 42, 1, 10, '#888'); R(33, 46, 6, 8, '#2a2a2a'); R(34, 47, 4, 4, '#555');
      R(16, 26, 16, 6, '#1a1418'); R(18, 28, 2, 2, blink(0) || blink(2) ? '#5a1010' : '#ff2a1a'); R(22, 28, 8, 2, '#ff6a5a');
      R(40, 12, 1, 12, '#ddd'); R(41, 12, 6, 4, color); }
    else if (level === 3) { // 木造雙層民宅＋聖誕燈
      R(6, 22, 36, 32, '#e8e0d0'); for (let k = 0; k < 8; k++) R(6, 24 + k * 4, 36, 1, '#c8bca8'); R(38, 22, 4, 32, '#c8bca8');
      for (let k = 0; k < 14; k++) R(24 - k * 1.5 - 4, 8 + k, k * 3 + 8, 1, '#3a3a4a'); R(2, 21, 44, 2, '#2a2a3a'); R(32, 4, 5, 10, '#8a4a3a');
      const win = (x, y) => { R(x, y, 8, 7, '#ffd890'); R(x + 3, y, 1, 7, '#3a5a4a'); R(x, y + 3, 8, 1, '#3a5a4a'); R(x, y, 8, 1, '#ffe8b0'); }; win(10, 26); win(30, 26); win(10, 38);
      R(30, 40, 7, 14, '#2a4a3a'); R(35, 47, 1, 1, '#ffd23a'); R(4, 38, 40, 2, '#8a5a34'); R(5, 40, 2, 14, '#f2ece0'); R(41, 40, 2, 14, '#f2ece0');
      for (let k = 0; k < 11; k++) { const x = 5 + k * 3.8, y = 21 - Math.min(k, 10 - k) * 2.6; R(Math.round(x), Math.round(y) + 1, 2, 2, blink(k) ? '#3a2a2a' : bulbs[k % 5]); }
      for (let k = 0; k < 10; k++) R(5 + k * 4, 37 + (k % 2), 2, 2, blink(k + 2) ? '#3a2a2a' : bulbs[(k + 2) % 5]);
      R(20, 2, 1, 10, '#ddd'); R(21, 2, 6, 4, color); }
    else { // 霓虹購物中心
      R(2, 26, 44, 28, '#e8d8e0'); R(2, 26, 3, 28, '#f4e8f0'); R(42, 26, 4, 28, '#c8b8c0'); R(1, 24, 46, 3, '#b03a6a');
      R(10, 12, 28, 12, '#d8c8d8'); R(34, 12, 4, 12, '#b8a8b8'); R(14, 8, 20, 4, '#9ad8ff'); R(14, 8, 20, 1, '#c8f0ff');
      const neon = (f || 0) % 6 === 5 ? '#5a1a3a' : '#ff6ac8'; R(6, 29, 36, 8, '#120814'); for (let k = 0; k < 6; k++) R(9 + k * 5, 31, 3, 4, neon); R(7, 30, 34, 1, neon); R(7, 35, 34, 1, neon);
      R(8, 40, 32, 14, '#8ac8e8'); for (let k = 0; k < 5; k++) R(8 + k * 8, 40, 1, 14, '#2a2228'); R(8, 40, 32, 1, '#c8f0ff'); R(10, 42, 3, 6, '#c8f0ff');
      ['#3af0ff', '#ffd23a', '#ff3ab0'].forEach((cc, k) => R(2, 52 - k * 0, 44, 0, cc)); R(2, 53, 44, 1, (f || 0) % 2 ? '#3af0ff' : '#ff3ab0');
      R(0, 44, 5, 10, '#2a1a4a'); R(1, 45, 3, 3, '#7aff6a'); R(43, 44, 5, 10, '#2a1a4a'); R(44, 45, 3, 3, (f || 0) % 2 ? '#7aff6a' : '#3a7a3a');
      R(40, 2, 1, 10, '#ddd'); R(41, 2, 6, 4, color); }
    outline(c); return (cache[key] = c);
  };

  // ================= 格子圖示（20x20） =================
  P.icon = function (type) {
    const key = 'i' + type; if (cache[key]) return cache[key];
    const [c, g] = canvas(20, 20); const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    if (type === 'luck') { R(3, 7, 14, 11, '#3a3a42'); R(3, 7, 14, 2, '#5a5a62'); R(5, 10, 6, 6, '#7a7a82'); R(6, 11, 1, 1, '#2a2a2a'); R(8, 11, 1, 1, '#2a2a2a'); R(6, 13, 1, 1, '#2a2a2a'); R(8, 13, 1, 1, '#2a2a2a'); R(12, 10, 3, 2, '#ff3a3a'); R(12, 13, 3, 3, '#9a9aa2'); R(14, 1, 1, 6, '#9a9aa2'); R(14, 0, 1, 1, '#ff3a3a'); }
    if (type === 'bad') { R(4, 3, 12, 14, '#3a0a10'); for (let k = 0; k < 6; k++) R(2 + k * 3, 2 + (k % 2) * 2, 2, 6 + (k % 3) * 3, '#2a0408'); R(8, 7, 4, 4, '#e0283a'); R(9, 8, 1, 1, '#ffb0b0'); R(6, 13, 1, 4, '#e0283a'); R(13, 12, 1, 5, '#e0283a'); }
    if (type === 'item') { R(3, 4, 13, 13, '#f4f0e8'); R(13, 4, 3, 13, '#c8c0b0'); R(5, 6, 2, 2, '#1a1a1a'); R(11, 6, 2, 2, '#1a1a1a'); R(8, 9, 2, 2, '#1a1a1a'); R(5, 12, 2, 2, '#1a1a1a'); R(11, 12, 2, 2, '#1a1a1a'); }
    if (type === 'start') { R(2, 12, 6, 6, '#1a1a1a'); R(12, 12, 6, 6, '#1a1a1a'); R(3, 13, 4, 4, '#888'); R(13, 13, 4, 4, '#888'); R(5, 9, 10, 2, '#e5383b'); R(4, 11, 2, 4, '#e5383b'); R(13, 7, 2, 7, '#e5383b'); R(12, 6, 4, 1, '#333'); R(6, 8, 3, 1, '#333'); }
    if (type === 'jail') { R(4, 8, 12, 10, '#c8a040'); R(4, 8, 12, 2, '#e8c060'); R(6, 2, 2, 7, '#8a8a92'); R(12, 2, 2, 7, '#8a8a92'); R(6, 2, 8, 2, '#8a8a92'); R(9, 11, 2, 4, '#3a2a10'); }
    if (type === 'free') { R(4, 1, 12, 18, '#2a1a4a'); R(5, 3, 10, 7, '#3af0ff'); R(6, 4, 2, 2, '#ffd23a'); R(11, 6, 2, 2, '#ff3ab0'); R(6, 12, 2, 4, '#e5383b'); R(5, 12, 1, 1, '#e5383b'); R(11, 13, 2, 2, '#7aff6a'); R(14, 13, 2, 2, '#ffd23a'); }
    if (type === 'gotojail') { R(6, 6, 8, 8, '#e5383b'); R(7, 4, 6, 2, '#ff8a8a'); R(5, 14, 10, 3, '#3a3a42'); R(1, 8, 3, 1, '#ffd23a'); R(16, 8, 3, 1, '#ffd23a'); R(2, 4, 2, 1, '#ffd23a'); R(16, 4, 2, 1, '#ffd23a'); }
    if (type === 'tax') { R(4, 2, 12, 16, '#f4f0e8'); R(4, 2, 12, 2, '#d8d0c0'); for (let k = 0; k < 5; k++) R(6, 6 + k * 2, 8 - (k % 2) * 3, 1, '#7a6a5a'); R(10, 15, 4, 2, '#e5383b'); }
    if (type === 'teleport') { R(4, 4, 12, 12, '#3a0a10'); R(7, 7, 6, 6, '#e0283a'); R(9, 9, 2, 2, '#ffb0b0'); }
    outline(c); return (cache[key] = c);
  };

  // ================= 動畫用：像素場景零件 =================
  // 抖動漸層（2x2 Bayer），讓天空像 16-bit 遊戲的色帶
  P.ditherSky = function (g, w, h, stops) {
    const bay = [[0, 2], [3, 1]];
    for (let y = 0; y < h; y++) { const k = y / h; let a = stops[0], b = stops[stops.length - 1], f = 0;
      for (let i = 0; i < stops.length - 1; i++) { const s0 = i / (stops.length - 1), s1 = (i + 1) / (stops.length - 1); if (k >= s0 && k <= s1) { a = stops[i]; b = stops[i + 1]; f = (k - s0) / (s1 - s0); break; } }
      for (let x = 0; x < w; x += 2) { const th = (bay[y % 2][(x / 2) % 2] + 0.5) / 4; g.fillStyle = f > th ? b : a; g.fillRect(x, y, 2, 1); } }
  };
  P.coin = function () { const key = 'coin'; if (cache[key]) return cache[key]; const [c, g] = canvas(7, 7); const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); }; R(1, 0, 5, 7, '#e8b020'); R(0, 1, 7, 5, '#e8b020'); R(1, 1, 2, 2, '#fff0a0'); R(3, 2, 1, 3, '#a87010'); R(5, 2, 1, 4, '#c89018'); return (cache[key] = c); };

  root.MONO_PIXEL = P;
})(typeof window !== 'undefined' ? window : globalThis);
