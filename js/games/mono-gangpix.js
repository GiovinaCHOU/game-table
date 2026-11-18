// 幫派街區的 16-bit 像素角色：9 個原創角色（多數是擬人化的物件＋橡膠管手腳的卡通風）
// 跟怪奇小鎮共用 MONO_PIXEL 的畫布、描邊與動作參數：pose = { arms:[左,右], legs, eyes, mouth, dy }
(function (root) {
  const P = root.MONO_PIXEL; if (!P) return;
  const SW = 36, SH = 52;
  const cache = {};
  // 小工具：在畫布上畫像素
  function mk() { const [c, g] = P.canvas(SW, SH); const R = (x, y, w, h, col) => { if (w <= 0 || h <= 0) return; g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }; return [c, g, R]; }
  // 實心橢圓（逐列填）
  function oval(R, cx, cy, rx, ry, col) { for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); R(cx - w, cy + y, w * 2 + 1, 1, col); } }
  // 粗線（2 像素寬的 Bresenham），手腳用
  function seg(R, x0, y0, x1, y1, col, w) { w = w || 2; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; R(Math.round(x - (w - 1) / 2), Math.round(y - (w - 1) / 2), w, w, col); } }
  // 橡膠管手：shoulder (sx,sy)，dir=-1 左手、1 右手；回傳手掌位置
  function arm(R, sx, sy, dir, m, col, glove) {
    let hx, hy;
    if (m === 'up') { hx = sx + dir * 2; hy = sy - 10; seg(R, sx, sy, sx + dir * 3, sy - 5, col); seg(R, sx + dir * 3, sy - 5, hx, hy, col); }
    else if (m === 'out') { hx = sx + dir * 10; hy = sy - 1; seg(R, sx, sy, sx + dir * 5, sy + 1, col); seg(R, sx + dir * 5, sy + 1, hx, hy, col); }
    else if (m === 'fwd') { hx = sx + dir * 4; hy = sy + 6; seg(R, sx, sy, sx + dir * 2, sy + 4, col); seg(R, sx + dir * 2, sy + 4, hx, hy, col); }
    else if (m === 'pocket') { seg(R, sx, sy, sx + dir * 1, sy + 5, col); seg(R, sx + dir * 1, sy + 5, sx - dir * 1, sy + 8, col); return [sx - dir, sy + 8]; }
    else { hx = sx + dir * 2; hy = sy + 9; seg(R, sx, sy, sx + dir * 2, sy + 4, col); seg(R, sx + dir * 2, sy + 4, hx, hy, col); }
    // 卡通白手套（4x4，有指縫）
    R(hx - 2, hy - 2, 4, 4, glove || '#f8f6f0'); R(hx - 2, hy + 1, 4, 1, '#c8c4bc'); R(hx + (dir > 0 ? 1 : -2), hy - 3, 1, 1, glove || '#f8f6f0');
    return [hx, hy];
  }
  // 橡膠管腳＋大鞋
  function legs(R, hx, hy, lg, col, shoe, shoeD) {
    const L = lg === 'a' ? [-2, 2] : lg === 'b' ? [2, -2] : [0, 0], len = lg === 'jump' ? 5 : 8;
    [[hx - 3, L[0], -1], [hx + 3, L[1], 1]].forEach(([x, d, s]) => { const fx = x + d, fy = hy + len; seg(R, x, hy, fx, fy, col); R(fx - 2 + (s > 0 ? 0 : -1), fy + 1, 5, 3, shoe || '#2a2a30'); R(fx - 2 + (s > 0 ? 0 : -1), fy + 1, 5, 1, shoeD || '#4a4a54'); R(fx - 2 + (s > 0 ? 0 : -1), fy + 3, 5, 1, '#121216'); });
  }
  // 大眼睛：w×h 白眼，pupil 黑眼珠大小；mode 對應 pose.eyes
  function eyes(R, x1, x2, y, w, h, pu, mode, o) {
    o = o || {}; const lid = o.lid || 0;
    [x1, x2].forEach((x, k) => {
      if (mode === 'blink') { R(x, y + (h >> 1), w, 1, '#1a1020'); return; }
      if (mode === 'x') { for (let i = 0; i < Math.min(w, h); i++) { R(x + i, y + i, 1, 1, '#1a1020'); R(x + w - 1 - i, y + i, 1, 1, '#1a1020'); } return; }
      R(x, y, w, h, o.white || '#ffffff'); R(x, y + h - 1, w, 1, o.whiteD || '#d8d4e0');
      if (o.red) { R(x, y + h - 2, 1, 1, '#ff8a9a'); R(x + w - 1, y + 1, 1, 1, '#ff8a9a'); }
      const p = mode === 'wide' ? Math.max(1, pu - 2) : pu, px = x + ((w - p) >> 1) + (o.look || 0), py = y + ((h - p) >> 1) + (mode === 'wide' ? 0 : 1);
      if (mode === 'glow') R(x + 1, y + 1, w - 2, h - 2, o.glow || '#ffe060');
      else { R(px, py, p, p, '#141018'); if (p >= 3) R(px, py, 1, 1, '#3a3448'); R(px + p - 1 - (p > 2 ? 1 : 0), py, 1, 1, '#ffffff'); }
      if (lid) R(x, y, w, lid, o.lidC || '#000');
    });
  }
  // 媽的媽啊專用：圓滾滾的大眼睛，瞳孔大到幾乎全黑（只剩一圈白，不加反光、不加睫毛）
  function bigEyes(R, x1, x2, y, mode) {
    [x1, x2].forEach(cx => {
      if (mode === 'blink') { R(cx - 3, y, 7, 1, '#1a1020'); R(cx - 4, y - 1, 1, 1, '#1a1020'); R(cx + 4, y - 1, 1, 1, '#1a1020'); return; }
      if (mode === 'x') { for (let i = -2; i <= 2; i++) { R(cx + i, y + i, 1, 1, '#1a1020'); R(cx - i, y + i, 1, 1, '#1a1020'); } return; }
      oval(R, cx, y, 4, 4, '#ffffff'); R(cx - 4, y + 2, 9, 1, '#e0dce8');
      const pr = mode === 'wide' ? 1 : 3; oval(R, cx, y + (mode === 'wide' ? 0 : 0), pr, pr, '#120c18');
      if (mode === 'glow') oval(R, cx, y, 3, 3, '#ffe060');
    });
  }
  function mouth(R, cx, y, mo, o) {
    o = o || {}; const c = o.c || '#7a2030';
    if (mo === 'o') { R(cx - 1, y, 3, 3, '#3a0a14'); R(cx, y + 1, 1, 1, '#c84050'); }
    else if (mo === 'grin') { R(cx - 3, y, 7, 3, '#3a0a14'); R(cx - 2, y, 5, 1, '#ffffff'); R(cx - 1, y + 2, 3, 1, '#e05060'); }
    else if (mo === 'flat') R(cx - 2, y + 1, 5, 1, c);
    else if (mo === 'sad') { R(cx - 2, y + 1, 5, 1, c); R(cx - 3, y + 2, 1, 1, c); R(cx + 3, y + 2, 1, 1, c); }
    else { R(cx - 2, y + 1, 5, 1, c); R(cx - 3, y, 1, 1, c); R(cx + 3, y, 1, 1, c); }
  }

  // ---------- 0 媽的媽啊：圓形藥丸（顏色、圖案可以自己畫），大眼睛、超大黑瞳孔 ----------
  function pill(R, g, p, f, opt) {
    const dy = p.dy || 0, cx = 18, cy = 22 + dy, col = opt && opt.img ? ['#3a2a38', '#3a2a38', '#3a2a38', '#2a1a28'] : (opt && opt.col) || ['#ff7ac8', '#e04ca4', '#ffb0e0', '#b8307c'];
    legs(R, cx, cy + 11, p.legs, '#2a1a22', '#ff4ca0', '#ff8ac8');
    oval(R, cx, cy, 12, 12, col[1]); oval(R, cx - 1, cy - 1, 11, 11, col[0]); oval(R, cx - 4, cy - 5, 4, 3, col[2]);
    // 藥丸邊緣的厚度（側面一圈）
    for (let a = 0.3; a < 2.85; a += 0.08) R(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12 - 1, 1, 2, col[3]);
    if (opt && opt.img) { g.save(); g.beginPath(); g.arc(cx + 0.5, cy + 0.5, 12.6, 0, 6.283); g.clip(); g.imageSmoothingEnabled = false; if (opt.img.width === 23) g.drawImage(opt.img, cx - 11, cy - 11); else g.drawImage(opt.img, cx - 12, cy - 12, 25, 25); g.restore();
      // 自畫的圖案上面再疊立體感：左上反光、下緣陰影、側面厚度
      oval(R, cx - 4, cy - 6, 4, 2, 'rgba(255,255,255,.45)'); R(cx - 6, cy - 6, 2, 1, 'rgba(255,255,255,.7)');
      for (let y = 5; y <= 11; y++) { const w = Math.round(11 * Math.sqrt(Math.max(0, 1 - (y * y) / 121))); R(cx - w, cy + y, w * 2 + 1, 1, `rgba(40,0,30,${0.05 + (y - 5) * 0.035})`); }
      for (let a = 0.3; a < 2.85; a += 0.08) R(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12 - 1, 1, 2, 'rgba(60,10,40,.6)'); }
    else { // 預設壓印：中間一道刻痕＋小星星
      [[cx - 7, cy + 7], [cx + 7, cy + 7], [cx, cy - 9]].forEach(([x, y]) => { R(x, y - 1, 1, 3, col[1]); R(x - 1, y, 3, 1, col[1]); R(x, y, 1, 1, col[2]); }); }
    bigEyes(R, cx - 5, cx + 5, cy - 4, p.eyes || 'open');
    mouth(R, cx, cy + 3, p.mouth || 'grin', {});
    const h1 = arm(R, cx - 11, cy + 2, -1, (p.arms || [])[0], '#2a1a22'), h2 = arm(R, cx + 11, cy + 2, 1, (p.arms || [])[1], '#2a1a22');
    return [h1, h2];
  }
  // ---------- 1 郵差先生：一張郵票（鋸齒邊），圖案可以選 6 款；臉在郵票下方白邊，頭戴郵差帽 ----------
  // 圖案畫在 18×15 的範圍（ix, iy 為左上角）
  const STAMP_ART = [
    // 0 光環人像
    (R, ix, iy, f) => { R(ix, iy, 18, 15, '#5a8aff'); R(ix, iy, 18, 4, '#7aa8ff'); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + (f % 2) * 0.2; for (let r = 6; r < 9; r++) R(ix + 9 + Math.cos(a) * r, iy + 7 + Math.sin(a) * r, 1, 1, '#ffe88a'); }
      R(ix + 4, iy + 1, 11, 2, '#ffd23a'); R(ix + 5, iy + 3, 9, 10, '#6a4024'); R(ix + 7, iy + 4, 5, 6, '#f2c8a0'); R(ix + 11, iy + 4, 1, 6, '#d8a078'); R(ix + 7, iy + 8, 5, 3, '#7a4a2a'); R(ix + 8, iy + 6, 1, 1, '#2a1a10'); R(ix + 10, iy + 6, 1, 1, '#2a1a10'); R(ix + 3, iy + 12, 12, 3, '#f6f2e6'); R(ix + 8, iy + 12, 2, 3, '#d8d0bc'); },
    // 1 腳踏車
    (R, ix, iy, f) => { R(ix, iy, 18, 15, '#8ad8ff'); R(ix, iy + 11, 18, 4, '#6ac86a'); R(ix + 13, iy + 1, 3, 3, '#fff27a');
      [[4, 10], [13, 10]].forEach(([cx, cy]) => { for (let a = 0; a < 6.28; a += 0.25) R(ix + cx + Math.round(Math.cos(a) * 3), iy + cy + Math.round(Math.sin(a) * 3), 1, 1, '#2a2a30'); R(ix + cx, iy + cy, 1, 1, '#8a8a90'); });
      [[4, 10, 8, 6], [8, 6, 13, 10], [8, 6, 9, 10], [9, 10, 4, 10], [8, 6, 7, 4], [12, 5, 13, 10]].forEach(([a, b, c, d]) => { const n = Math.max(Math.abs(c - a), Math.abs(d - b)); for (let i = 0; i <= n; i++) R(ix + Math.round(a + (c - a) * i / n), iy + Math.round(b + (d - b) * i / n), 1, 1, '#e5383b'); });
      R(ix + 6, iy + 3, 3, 1, '#2a2a30'); R(ix + 11, iy + 4, 3, 1, '#2a2a30'); },
    // 2 圖騰柱
    (R, ix, iy, f) => { R(ix, iy, 18, 15, '#ffb84a'); R(ix, iy + 9, 18, 6, '#ff8a3a'); R(ix + 1, iy + 2, 5, 2, '#5a2a1a'); R(ix + 12, iy + 2, 5, 2, '#5a2a1a');
      R(ix + 5, iy + 1, 8, 14, '#a85a2a'); R(ix + 11, iy + 1, 2, 14, '#7a3a1a'); R(ix + 5, iy + 1, 8, 1, '#c87a3a');
      [[2, '#2aa8c8'], [7, '#e5383b'], [12, '#2a8a4a']].forEach(([y, c]) => { R(ix + 6, iy + y, 2, 2, '#ffffff'); R(ix + 10, iy + y, 2, 2, '#ffffff'); R(ix + 7, iy + y + 1, 1, 1, '#1a1010'); R(ix + 10, iy + y + 1, 1, 1, '#1a1010'); R(ix + 7, iy + y + 3, 4, 1, c); R(ix + 5, iy + y + 4, 8, 1, '#7a3a1a'); }); },
    // 3 火箭
    (R, ix, iy, f) => { R(ix, iy, 18, 15, '#1a1a4a'); [[2, 2], [15, 4], [4, 10], [14, 12], [10, 1]].forEach(([x, y]) => R(ix + x, iy + y, 1, 1, '#ffffff'));
      R(ix + 7, iy + 3, 5, 8, '#f4f4f0'); R(ix + 8, iy + 1, 3, 2, '#f4f4f0'); R(ix + 9, iy, 1, 1, '#e5383b'); R(ix + 11, iy + 3, 1, 8, '#c8c8d0'); R(ix + 8, iy + 4, 3, 3, '#3ab0ff'); R(ix + 8, iy + 4, 1, 1, '#ffffff');
      R(ix + 5, iy + 8, 2, 4, '#e5383b'); R(ix + 12, iy + 8, 2, 4, '#e5383b'); R(ix + 8, iy + 11, 3, 1, '#8a8a90'); R(ix + 8, iy + 12, 3, 2, f % 2 ? '#ffd23a' : '#ff8a1a'); R(ix + 9, iy + 14, 1, 1, '#ff4a1a'); },
    // 4 哥布林
    (R, ix, iy, f) => { R(ix, iy, 18, 15, '#8a4ac8'); R(ix, iy + 11, 18, 4, '#6a2aa8');
      R(ix + 1, iy + 4, 4, 2, '#5aa83a'); R(ix + 13, iy + 4, 4, 2, '#5aa83a'); R(ix, iy + 3, 2, 1, '#5aa83a'); R(ix + 16, iy + 3, 2, 1, '#5aa83a');
      R(ix + 4, iy + 2, 10, 11, '#6ac84a'); R(ix + 11, iy + 2, 3, 11, '#4a9a34'); R(ix + 6, iy + 5, 2, 2, '#ffe02a'); R(ix + 10, iy + 5, 2, 2, '#ffe02a'); R(ix + 7, iy + 6, 1, 1, '#1a1010'); R(ix + 10, iy + 6, 1, 1, '#1a1010');
      R(ix + 8, iy + 7, 2, 2, '#4a9a34'); R(ix + 6, iy + 10, 6, 1, '#3a1010'); R(ix + 6, iy + 9, 1, 1, '#ffffff'); R(ix + 11, iy + 9, 1, 1, '#ffffff'); R(ix + 8, iy + 10, 1, 1, '#ffffff'); },
    // 5 外星人（原創）
    (R, ix, iy, f) => { R(ix, iy, 18, 15, '#3ac86a'); for (let k = 0; k < 4; k++) R(ix, iy + k * 4, 18, 1, '#5ae88a');
      R(ix + 5, iy + 2, 8, 9, '#c8c8d8'); R(ix + 4, iy + 3, 10, 5, '#c8c8d8'); R(ix + 7, iy + 11, 4, 2, '#c8c8d8'); R(ix + 11, iy + 2, 2, 10, '#a8a8b8');
      R(ix + 5, iy + 5, 3, 3, '#141018'); R(ix + 10, iy + 5, 3, 3, '#141018'); R(ix + 5, iy + 5, 1, 1, '#5a5a6a'); R(ix + 10, iy + 5, 1, 1, '#5a5a6a'); R(ix + 8, iy + 10, 2, 1, '#6a6a7a'); }
  ];
  P.STAMP_NAMES = ['光環人像', '腳踏車', '圖騰', '火箭', '哥布林', '外星人'];
  function stamp(R, g, p, f, opt) {
    const dy = p.dy || 0, x0 = 6, y0 = 9 + dy, w = 24, h = 30, art = STAMP_ART[(opt && opt.stamp) || 0] || STAMP_ART[0];
    legs(R, 18, y0 + h, p.legs, '#2a2a44', '#2a3a7a', '#4a5aa8');
    R(x0, y0, w, h, '#f6f2e6'); R(x0 + w - 1, y0, 1, h, '#d8d0bc'); R(x0, y0 + h - 1, w, 1, '#d8d0bc');
    // 郵票的齒孔：邊緣每 3 格挖一個缺口，描邊後就是一圈波浪
    for (let k = 1; k < w - 1; k += 3) { g.clearRect(x0 + k, y0, 1, 1); g.clearRect(x0 + k, y0 + h - 1, 1, 1); }
    for (let k = 1; k < h - 1; k += 3) { g.clearRect(x0, y0 + k, 1, 1); g.clearRect(x0 + w - 1, y0 + k, 1, 1); }
    // 圖案（18×15）＋細框
    const ix = x0 + 3, iy = y0 + 3; art(R, ix, iy, f); R(ix - 1, iy - 1, 20, 1, '#c8c0a8'); R(ix - 1, iy + 15, 20, 1, '#c8c0a8'); R(ix - 1, iy - 1, 1, 17, '#c8c0a8'); R(ix + 18, iy - 1, 1, 17, '#c8c0a8');
    // 臉：在下方白邊（表情跟著 pose）
    const ey = p.eyes || 'open', fy = y0 + 21, ex = [x0 + 7, x0 + 14];
    if (ey === 'blink') ex.forEach(x => R(x, fy + 1, 3, 1, '#2a1a10'));
    else if (ey === 'x') ex.forEach(x => { R(x, fy, 1, 1, '#2a1a10'); R(x + 2, fy, 1, 1, '#2a1a10'); R(x + 1, fy + 1, 1, 1, '#2a1a10'); R(x, fy + 2, 1, 1, '#2a1a10'); R(x + 2, fy + 2, 1, 1, '#2a1a10'); });
    else ex.forEach(x => { R(x, fy, 3, 3, '#2a1a10'); if (ey === 'wide') R(x + 1, fy + 1, 1, 1, '#ffffff'); else R(x, fy, 1, 1, '#6a5a50'); });
    const mo = p.mouth || 'smile', mx = x0 + 12, my = fy + 5;
    if (mo === 'o') R(mx - 1, my - 1, 2, 2, '#7a2030'); else if (mo === 'grin') { R(mx - 3, my - 1, 6, 2, '#7a2030'); R(mx - 2, my - 1, 4, 1, '#ffffff'); } else if (mo === 'sad') { R(mx - 2, my, 4, 1, '#7a2030'); R(mx - 3, my + 1, 1, 1, '#7a2030'); R(mx + 2, my + 1, 1, 1, '#7a2030'); } else { R(mx - 2, my, 4, 1, '#7a2030'); R(mx - 3, my - 1, 1, 1, '#7a2030'); R(mx + 2, my - 1, 1, 1, '#7a2030'); }
    R(x0 + 4, fy + 3, 2, 1, '#ffb0b0'); R(x0 + 18, fy + 3, 2, 1, '#ffb0b0');
    // 郵差帽
    R(x0 + 4, y0 - 7, 16, 6, '#2a3a7a'); R(x0 + 4, y0 - 7, 16, 2, '#3a4e9a'); R(x0 + 2, y0 - 2, 20, 2, '#1a2450'); R(x0 + 10, y0 - 6, 4, 3, '#ffd23a'); R(x0 + 11, y0 - 5, 2, 1, '#c89a1a');
    const h1 = arm(R, x0 - 1, y0 + 17, -1, (p.arms || [])[0], '#2a2a44'), h2 = arm(R, x0 + w, y0 + 17, 1, (p.arms || [])[1], '#2a2a44');
    if (!p.noItem) { const [x, y] = h2; R(x - 1, y - 7, 8, 6, '#f6f2e6'); R(x - 1, y - 7, 8, 1, '#d8d0bc'); R(x, y - 6, 3, 2, '#c8202a'); R(x + 3, y - 5, 3, 1, '#d8d0bc'); }
    return [h1, h2];
  }
  // ---------- 2 美麗妄娜：七片葉的葉子寶寶，瞇瞇眼、腮紅 ----------
  function leaf(R, g, p, f) {
    const dy = p.dy || 0, cx = 18, base = 33 + dy, sway = (f % 2) ? 1 : 0;
    legs(R, cx, base + 1, p.legs, '#2a4a1a', '#7a4a2a', '#9a6a3a');
    // 七片細長鋸齒葉（中間最長）
    const L = [[0, 26, 4], [-0.55, 21, 3.6], [0.55, 21, 3.6], [-1.1, 15, 3], [1.1, 15, 3], [-1.5, 9, 2.4], [1.5, 9, 2.4]];
    L.slice().reverse().forEach(([a, len, wd], k) => { const ang = a + (k < 2 ? sway * 0.04 : 0);
      for (let t = 0; t <= len; t++) { const u = t / len, w = wd * Math.sin(Math.PI * Math.pow(u, 0.7)) + 0.3, x = cx + Math.sin(ang) * t, y = base - Math.cos(ang) * t, nx = Math.cos(ang), ny = Math.sin(ang);
        for (let s = -w; s <= w; s += 0.5) { const tooth = (Math.abs(s) > w - 0.9 && t % 2) ? 1 : 0; if (tooth && Math.abs(s) > w - 0.4) continue; R(x + nx * s, y + ny * s, 1, 1, s < -w * 0.3 ? '#3aa83a' : s > w * 0.4 ? '#1e6a24' : '#2c8a30'); }
        R(x, y, 1, 1, '#8ad86a'); } });
    // 臉：在中央葉的下半部，圓圓的臉蛋
    const fy = base - 12; oval(R, cx, fy, 7, 6, '#3ab040'); oval(R, cx - 1, fy - 1, 6, 5, '#4ac850');
    R(cx - 6, fy + 2, 2, 1, '#ff9aa8'); R(cx + 5, fy + 2, 2, 1, '#ff9aa8');
    const ey = p.eyes || 'open';
    if (ey === 'open' || ey === 'blink') { R(cx - 5, fy - 1, 3, 1, '#1a3010'); R(cx + 3, fy - 1, 3, 1, '#1a3010'); R(cx - 5, fy - 2, 3, 1, '#c84a5a'); R(cx + 3, fy - 2, 3, 1, '#c84a5a'); } // 半睜的紅眼皮
    else eyes(R, cx - 5, cx + 2, fy - 3, 3, 3, 2, ey, {});
    mouth(R, cx, fy + 2, p.mouth || 'smile', { c: '#1a4a14' });
    const h1 = arm(R, cx - 6, base - 4, -1, (p.arms || [])[0], '#2a4a1a'), h2 = arm(R, cx + 6, base - 4, 1, (p.arms || [])[1], '#2a4a1a');
    // 玻璃水煙：平常右手拿在旁邊；吸的時候（f 4～5）舉到嘴邊、水在冒泡
    if (!p.noItem && (p.arms || [])[1] !== 'up' && (p.arms || [])[1] !== 'out') { const inh = f % 8 === 4 || f % 8 === 5, fy = base - 12;
      const [x, y] = inh ? [cx + 1, fy + 18] : h2;
      R(x + 1, y - 16, 3, 13, '#d8f0ff'); R(x + 1, y - 16, 1, 13, '#ffffff'); R(x + 3, y - 16, 1, 13, '#a8c8d8'); R(x, y - 17, 5, 1, '#a8c8d8');
      R(x - 1, y - 4, 7, 6, '#c8e8f4'); R(x - 1, y - 4, 1, 6, '#ffffff'); R(x, y - 1, 5, 3, '#5ac87a'); R(x, y - 2, 5, 1, '#7ae89a'); R(x - 1, y + 2, 7, 1, '#8ab8c8');
      R(x - 3, y - 6, 3, 1, '#a8c8d8'); R(x - 4, y - 7, 2, 2, '#6a5a4a'); R(x - 4, y - 8, 2, 1, inh ? '#ff6a2a' : '#4a8a3a');
      if (inh) { R(x + 1, y - 2, 1, 1, '#ffffff'); R(x + 3, y - 1, 1, 1, '#ffffff'); R(x + 2, y - 7 - (f % 2) * 3, 1, 1, '#ffffff'); R(x + 2, y - 11, 1, 1, '#e8f4ff'); R(x + 5, y - 2, 2, 2, '#2a4a1a'); } }
    return [h1, h2];
  }
  // 人類共用的身體（比怪奇小鎮再大一點點的頭身比）
  function human(R, p, o) {
    const dy = p.dy || 0, r = (x, y, w, h, c) => R(x, y + dy, w, h, c), sk = o.skin, skd = o.skinD;
    const lg = p.legs || 'stand', L = lg === 'a' ? [-2, 1] : lg === 'b' ? [1, -2] : [0, 0], lh = lg === 'jump' ? 8 : 10;
    [[13 + L[0], 0], [19 + L[1], 1]].forEach(([x, k]) => { r(x, 36, o.legW || 4, lh, k ? o.pantsD : o.pants); r(x - 1, 36 + lh, 6, 2, o.shoe); r(x - 1, 37 + lh, 6, 1, o.shoeD); });
    return r;
  }
  function headFace(r, p, o, x, y) {
    const sk = o.skin, skd = o.skinD; r(x, y, 12, 12, sk); r(x + 9, y, 3, 12, skd); r(x + 5, y + 12, 3, 1, skd);
    const ey = p.eyes || 'open';
    if (ey === 'blink') { r(x + 2, y + 6, 2, 1, '#1a1020'); r(x + 8, y + 6, 2, 1, '#1a1020'); }
    else if (ey === 'x') { [[2, 5], [3, 6], [2, 6], [3, 5], [8, 5], [9, 6], [8, 6], [9, 5]].forEach(([a, b]) => r(x + a, y + b, 1, 1, '#1a1020')); }
    else if (ey === 'glow') { r(x + 2, y + 5, 2, 2, '#ffe060'); r(x + 8, y + 5, 2, 2, '#ffe060'); }
    else { r(x + 2, y + 5, 2, 2, '#1a1020'); r(x + 8, y + 5, 2, 2, '#1a1020'); r(x + 2, y + 5, 1, 1, '#ffffff'); r(x + 8, y + 5, 1, 1, '#ffffff'); if (ey === 'wide') { r(x + 1, y + 4, 4, 1, sk); r(x + 7, y + 4, 4, 1, sk); r(x + 2, y + 4, 2, 1, '#ffffff'); r(x + 8, y + 4, 2, 1, '#ffffff'); } }
    const mo = p.mouth || 'smile', m = (a, b, w, h, c) => r(x + a, y + b, w, h, c);
    if (mo === 'o') m(5, 9, 2, 2, '#4a1010'); else if (mo === 'grin') { m(3, 9, 6, 2, '#ffffff'); m(3, 10, 6, 1, '#a04040'); } else if (mo === 'flat') m(4, 9, 4, 1, '#6a2a2a'); else { m(4, 9, 4, 1, '#7a3030'); m(3, 8, 1, 1, '#7a3030'); m(8, 8, 1, 1, '#7a3030'); }
  }
  function humanArms(r, p, o, shY, k0x, k1x) {
    const hands = []; (p.arms || ['down', 'down']).forEach((m, k) => { const sx = k ? k1x : k0x, dir = k ? 1 : -1, sl = k ? o.sleeveD : o.sleeve, hs = k ? o.skinD : o.skin;
      if (m === 'up') { r(sx, shY - 10, 3, 11, sl); r(sx, shY - 12, 3, 2, hs); hands.push([sx + 1, shY - 12]); }
      else if (m === 'out') { const x0 = k ? sx : sx - 6; r(x0, shY + 1, 9, 3, sl); r(k ? sx + 9 : sx - 8, shY + 1, 2, 3, hs); hands.push([k ? sx + 10 : sx - 7, shY + 2]); }
      else if (m === 'fwd') { r(sx, shY + 1, 3, 6, sl); r(sx - dir * 2, shY + 6, 3, 4, sl); r(sx - dir * 2, shY + 10, 3, 2, hs); hands.push([sx - dir * 2 + 1, shY + 10]); }
      else if (m === 'pocket') { r(sx, shY + 1, 3, 8, sl); r(sx + (k ? -1 : 1), shY + 8, 3, 3, sl); hands.push([sx + 1, shY + 10]); }
      else { r(sx, shY + 1, 3, 9, sl); r(sx, shY + 10, 3, 2, hs); hands.push([sx + 1, shY + 11]); } });
    return hands;
  }
  // ---------- 3 古柯檢查官：只有一個大鼻子（沒有手腳）。照寫實鼻子的正面造型逐格畫：長直鼻樑＋直向反光、
  //            圓鼓的兩瓣鼻翼和摺痕、鼻底兩道彎月形鼻孔、鼻孔邊緣沾白粉；鼻樑上一對小眼睛 ----------
  const NOSE_MAP = [
      '................................',
      '..........LLLMMMMMMMDD..........',
      '..........LLLMMMMMMMDD..........',
      '..........LLLMMMMMMMDD..........',
      '..........LLLMMMMMMMDD..........',
      '..........LLLHMMMMMMDD..........',
      '..........LLLHMMMMMMDD..........',
      '..........LLLHMMMMMMDD..........',
      '..........LLLHHMMMMMDD..........',
      '..........LLLHHMMMMMDD..........',
      '..........LLLHHMMMMMDD..........',
      '..........LLLHHMMMMMDD..........',
      '..........LLLHHMMMMMDD..........',
      '..........LLLHHMMMMMDD..........',
      '..........LLLHHMMMMMDD..........',
      '..........LLLHHMMMMMDD..........',
      '.........LLLLHHMMMMMDDD.........',
      '.........LLLLHHMMMMMDDD.........',
      '.........LLLLHHMMMMMDDD.........',
      '........LLLLLHHMMMMMDDDD........',
      '........LLLLLHHMMMMMDDDD........',
      '........LLLLLHHMMMMMDDDD........',
      '.......LLLLLLHHMMMMMDDDDD.......',
      '.......LLLLLLHHMMMMMDDDDD.......',
      '.......LLLLLHHMMMMMMDDDDD.......',
      '.......LLLLLHHMMMMMMDDDDD.......',
      '......LLLLLLHMMMMMMMDDDDDD......',
      '......LLLLLLHMLMMMMMDDDDDD......',
      '......LLLLLLLLLLLLMMDDDDDD......',
      '........LLLLLHLLLLMMDDDD........',
      '...MMEEEELLLLHHwwLLMDDDFFFFDD...',
      '..MLLLMMMELLLWLLLLWMDDFMMMDDDD..',
      '.MLLLLLMMMWLLLLLLLMMDWMMMMMDDDD.',
      '.MLLLLLMwMMLwMwMMwMwDDMwMMMDDDD.',
      '.MLLLLMMMwMwLMMMMMMMwDwMMMMDDDD.',
      '.MMMMMWWnnnnMwDDDDwDnnnnWWDDDDD.',
      '.MMMMWWNNnNNNNWDDWNNNNnNNWWDDDD.',
      '.MMMWWWMNNNNNDwWWwDNNNNNDWWWDDD.',
      '..DDDDWWWWWWWWWDDWWWWWWWWWEEEE..',
      '...DDDDw......DDDD......wEEEE...',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ], NOSE_PAL = { L: '#f6d2b4', M: '#ecbc98', D: '#d89c78', E: '#c07c5c', F: '#aa644a', H: '#fff2e4', N: '#601a14', n: '#a04032', W: '#ffffff', w: '#e8e8f0' };
  function nose(R, g, p, f) {
    const dy = (p.dy || 0) + (p.legs === 'jump' ? -3 : p.legs === 'a' || p.legs === 'b' ? -1 : 0), ox = 2, oy = 3 + dy, big = p.mouth === 'o' || p.eyes === 'wide';
    NOSE_MAP.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const c = row[x]; if (c !== '.') R(ox + x, oy + y, 1, 1, NOSE_PAL[c]); } });
    // 嚇到／吸的時候鼻孔撐大：彎月再往下多一排
    if (big) [[8, 34, 11], [7, 35, 13]].forEach(([a, y, b]) => { for (let x = a; x <= b; x++) { R(ox + x, oy + y, 1, 1, NOSE_PAL.N); R(ox + 31 - x, oy + y, 1, 1, NOSE_PAL.N); } }); // 撐大：鼻孔往上多開兩排，白粉還在下緣
    // 鼻樑上的小眼睛
    const r = (x, y, w, h, c) => R(x, y + dy, w, h, c), ey = p.eyes || 'open', ex = [13, 20], eyY = 13;
    if (ey === 'blink') ex.forEach(x => r(x, eyY + 1, 4, 1, '#3a1a1a'));
    else if (ey === 'x') ex.forEach(x => { r(x, eyY, 1, 1, '#1a1020'); r(x + 3, eyY, 1, 1, '#1a1020'); r(x + 1, eyY + 1, 2, 1, '#1a1020'); r(x, eyY + 2, 1, 1, '#1a1020'); r(x + 3, eyY + 2, 1, 1, '#1a1020'); });
    else ex.forEach(x => { r(x, eyY - 1, 4, 4, '#ffffff'); r(x, eyY + 2, 4, 1, '#e0dce8'); const s2 = ey === 'wide' ? 1 : 0; r(x + 1, eyY + (s2 ? 0 : 1), 2, 2, ey === 'glow' ? '#ffe060' : '#1a1020'); r(x - 1, eyY - 3, 5, 1, '#7a4030'); if (ey === 'open' && !s2) r(x, eyY - 1, 4, 1, '#f0a8a0'); });
    return [[ox, oy + 35], [ox + 31, oy + 35]];
  }
  // ---------- 4 海洛因蒂：湯匙（頭）＋針筒（拿在手上），湯匙裡有白粉痕跡、底部燒黑 ----------
  function spoon(R, g, p, f) {
    const dy = p.dy || 0, cx = 18, r = (x, y, w, h, c) => R(x, y + dy, w, h, c);
    legs(R, cx, 39 + dy, p.legs, '#4a4a58', '#3a3a48', '#5a5a6a');
    // 柄（身體）：往下越來越寬、尾端圓頭
    for (let y = 22; y < 39; y++) { const w = 2 + Math.floor((y - 22) / 6); r(cx - w, y, w * 2 + 1, 1, '#c0c0cc'); r(cx - w, y, 1, 1, '#f0f0f8'); r(cx + w, y, 1, 1, '#8a8a9a'); }
    r(cx - 4, 36, 9, 3, '#c0c0cc'); r(cx - 3, 39, 7, 1, '#9a9aaa');
    // 匙頸（細）
    r(cx - 1, 19, 3, 4, '#b0b0bc'); r(cx - 1, 19, 1, 4, '#e8e8f4');
    // 匙面：直立的橢圓，邊緣亮、裡面凹（上暗下亮），中間一團白粉、邊上燒黑
    oval(R, cx, 10 + dy, 8, 10, '#8a8a9a'); oval(R, cx, 10 + dy, 7, 9, '#e4e4ee');
    for (let y = -8; y <= 8; y++) { const w = Math.round(6 * Math.sqrt(1 - (y * y) / 64)); r(cx - w, 10 + y, w * 2 + 1, 1, y < -3 ? '#d4d4de' : y < 2 ? '#bcbcc8' : '#9e9eae'); }
    r(cx - 5, 3, 3, 2, '#ffffff'); r(cx - 6, 5, 1, 3, '#ffffff');
    r(cx - 5, 15, 5, 2, '#f4f4ec'); r(cx - 4, 14, 3, 1, '#ffffff'); r(cx - 5, 16, 5, 1, '#c8c8c0'); r(cx - 6, 16, 1, 1, '#e8e8e0'); r(cx, 16, 1, 1, '#e8e8e0'); // 一小撮白粉
    // 臉：眼皮半垂、瞳孔縮成針尖
    const ey = p.eyes || 'open';
    if (ey === 'blink') { r(cx - 5, 8, 4, 1, '#3a3a48'); r(cx + 2, 8, 4, 1, '#3a3a48'); }
    else if (ey === 'x') { [[-5, 7], [-4, 8], [-3, 9], [-3, 7], [-5, 9], [2, 7], [3, 8], [4, 9], [4, 7], [2, 9]].forEach(([a, b]) => r(cx + a, b, 1, 1, '#1a1020')); }
    else { r(cx - 5, 7, 4, 3, '#ffffff'); r(cx + 2, 7, 4, 3, '#ffffff'); r(cx - 4, 8 + (ey === 'wide' ? 0 : 1), 1, 1, '#1a1020'); r(cx + 3, 8 + (ey === 'wide' ? 0 : 1), 1, 1, '#1a1020'); if (ey !== 'wide') { r(cx - 5, 7, 4, 1, '#9a9aaa'); r(cx + 2, 7, 4, 1, '#9a9aaa'); } }
    const mo = p.mouth || 'flat'; if (mo === 'o') r(cx, 11, 2, 2, '#3a2030'); else if (mo === 'grin') r(cx - 1, 11, 4, 1, '#5a3a48'); else if (mo === 'sad') { r(cx - 1, 11, 3, 1, '#6a6a7a'); r(cx - 2, 12, 1, 1, '#6a6a7a'); r(cx + 2, 12, 1, 1, '#6a6a7a'); } else r(cx - 1, 11, 3, 1, '#6a6a7a');
    const h1 = arm(R, cx - 3, 25 + dy, -1, (p.arms || [])[0], '#4a4a58'), h2 = arm(R, cx + 3, 25 + dy, 1, (p.arms || [])[1], '#4a4a58');
    // 針筒（右手直立拿著）：透明針筒、刻度、推桿、針頭
    if (!p.noItem) { const [x, y] = h2; R(x - 1, y - 15, 4, 13, '#d8ecf8'); R(x - 1, y - 15, 1, 13, '#ffffff'); R(x + 2, y - 15, 1, 13, '#a8c0d8'); R(x, y - 9, 2, 7, '#8ab8e8'); for (let k = 0; k < 4; k++) R(x + 1, y - 14 + k * 3, 2, 1, '#5a6a8a');
      R(x - 2, y - 16, 6, 1, '#7a7a8a'); R(x, y - 20, 2, 4, '#e8e8f4'); R(x - 1, y - 21, 4, 1, '#7a7a8a'); R(x, y - 2, 2, 1, '#9a9aaa'); R(x + 1, y - 1, 1, 4, '#dcdce8'); }
    return [h1, h2];
  }
  // ---------- 5 折疊人：彎腰對折、頭垂到膝蓋，連帽衫，針尖瞳孔 ----------
  function folded(R, g, p, f) {
    const dy = p.dy || 0, sw = (f % 2), up = p.arms && p.arms[0] === 'up', r = (x, y, w, h, c) => R(x, y + dy, w, h, c);
    const o = { pants: '#4a6a9a', pantsD: '#36507a', shoe: '#e8e8e0', shoeD: '#a8a8a0', hood: '#5a5a68', hoodD: '#40404c', hoodL: '#7a7a8a', skin: '#e8d0c0', skinD: '#c8ae9c' };
    if (up || p.legs === 'jump' || p.stand) { // 站直（嚇到、跳起來時）
      const rr = human(R, p, Object.assign({ skin: o.skin, skinD: o.skinD, sleeve: o.hood, sleeveD: o.hoodD }, o));
      rr(11, 21, 14, 16, o.hood); rr(21, 21, 4, 16, o.hoodD); rr(11, 21, 2, 16, o.hoodL); rr(13, 30, 10, 4, o.hoodD); rr(14, 30, 8, 1, '#4a3428'); rr(15, 21, 1, 4, '#e8e0d0'); rr(20, 21, 1, 4, '#e8e0d0');
      const hands = humanArms(rr, p, { skin: o.skin, skinD: o.skinD, sleeve: o.hood, sleeveD: o.hoodD }, 21, 8, 25);
      headFace(rr, p, o, 12, 8); rr(11, 6, 14, 4, o.hood); rr(10, 8, 2, 10, o.hood); rr(24, 8, 2, 10, o.hoodD);
      return hands; }
    // 招牌姿勢：腿站直、屁股翹高、上身往前往下對折成一道弧，頭垂到膝蓋前，雙手垂到地上
    r(21, 19, 5, 13, o.pants); r(24, 19, 2, 13, o.pantsD); r(21, 32, 5, 11, o.pants); r(20, 32, 2, 11, o.pantsD); r(21, 31, 5, 1, o.pantsD); r(21, 19, 5, 1, '#2a2a30'); // 腿拉長（膝蓋微彎）
    r(19, 43, 8, 2, o.shoe); r(19, 44, 8, 1, o.shoeD); r(26, 43, 1, 1, '#c8c8c0');
    // 手（在身體後面那隻）
    r(12, 27, 3, 9 - sw, o.hoodD); r(12, 36 - sw, 3, 2, o.skinD);
    // 帽 T 上身：從髖關節往前折，接近水平、稍微往下（背是平的，不是駝背）
    const hip = [21, 21], sh = [9, 26], L2 = (t) => [hip[0] + (sh[0] - hip[0]) * t, hip[1] + (sh[1] - hip[1]) * t];
    for (let t = 0; t <= 1.001; t += 0.04) { const [x, y] = L2(t); oval(R, x, y + dy, 4, 4, o.hood); }
    for (let t = 0; t <= 1.001; t += 0.04) { const [x, y] = L2(t); R(x, y - 4 + dy, 2, 1, o.hoodL); } // 平平的背（亮面）
    for (let t = 0.1; t <= 0.95; t += 0.04) { const [x, y] = L2(t); R(x, y + 3 + dy, 2, 1, o.hoodD); } // 肚子那面（暗）
    oval(R, 22, 20 + dy, 4, 3, o.hood); R(20, 17 + dy, 4, 1, o.hoodL); // 屁股
    r(13, 26, 4, 2, o.hoodD); r(14, 26, 2, 1, '#2e2e38'); // 口袋
    // 頭：帽子圓圓的，臉朝下朝外，針尖瞳孔
    const hx = 7, hy = 30; oval(R, hx, hy + dy, 5, 5, o.hood); R(hx - 5, hy + 2 + dy, 11, 3, o.hoodD); oval(R, hx - 1, hy + 1 + dy, 3, 3, o.skin); R(hx + 1, hy - 1 + dy, 1, 5, o.skinD);
    r(hx + 2, hy + 3, 1, 3, '#e8e0d0'); r(hx - 2, hy + 4, 1, 2, '#e8e0d0'); // 帽繩
    const ey = p.eyes || 'open';
    if (ey === 'x') { r(hx - 3, hy - 1, 1, 1, '#1a1020'); r(hx - 2, hy, 1, 1, '#1a1020'); r(hx, hy - 1, 1, 1, '#1a1020'); r(hx + 1, hy, 1, 1, '#1a1020'); }
    else if (ey === 'wide') { r(hx - 3, hy - 1, 2, 2, '#ffffff'); r(hx, hy - 1, 2, 2, '#ffffff'); r(hx - 3, hy, 1, 1, '#1a1020'); r(hx, hy, 1, 1, '#1a1020'); }
    else { r(hx - 3, hy - 1, 2, 1, '#7a5a50'); r(hx, hy - 1, 2, 1, '#7a5a50'); if (ey !== 'blink') { r(hx - 3, hy, 1, 1, '#1a1020'); r(hx, hy, 1, 1, '#1a1020'); } }
    if (p.mouth === 'o') r(hx - 2, hy + 2, 2, 2, '#4a1010'); else r(hx - 2, hy + 2, 2, 1, '#8a5a5a');
    // 前面那隻手垂到地上，輕輕晃
    r(9, 28, 3, 9 + sw, o.hood); r(9, 28, 1, 9 + sw, o.hoodL); r(9, 37 + sw, 3, 2, o.skin);
    return [[10, 38 + dy], [13, 37 + dy]];
  }
  // ---------- 6 小混混：反戴鴨舌帽、白吊嘎、金項鍊、垮褲露內褲、滿身刺青（臉上也有）、手插口袋 ----------
  function thug(R, g, p, f) {
    const o = { skin: '#c8906a', skinD: '#a87050', pants: '#4a6aa8', pantsD: '#3a5488', shoe: '#f4f4f0', shoeD: '#b8b8c0', sleeve: '#c8906a', sleeveD: '#a87050', legW: 5 };
    const pz = Object.assign({}, p); if (!p.arms) pz.arms = ['pocket', 'pocket'];
    const r = human(R, pz, o);
    // 垮褲（很低、很寬）＋露出的內褲
    r(11, 30, 15, 7, '#4a6aa8'); r(22, 30, 4, 7, '#3a5488'); r(11, 30, 15, 2, '#e04a4a'); r(13, 30, 2, 1, '#ffffff'); r(19, 30, 2, 1, '#ffffff');
    // 吊嘎＋手臂刺青
    r(12, 21, 12, 10, '#f8f6f0'); r(21, 21, 3, 10, '#d8d4cc'); r(14, 21, 8, 2, o.skin);
    const hands = humanArms(r, pz, o, 21, 9, 24);
    r(9, 24, 2, 1, '#2a3a5a'); r(10, 26, 1, 2, '#2a3a5a'); r(9, 28, 2, 1, '#2a3a5a'); r(25, 23, 1, 3, '#2a3a5a'); r(24, 27, 2, 1, '#2a3a5a'); r(15, 21, 1, 1, '#2a3a5a'); r(20, 21, 1, 1, '#2a3a5a');
    // 金項鍊
    r(14, 23, 1, 1, '#ffd23a'); r(15, 24, 1, 1, '#e8b020'); r(16, 25, 4, 1, '#ffd23a'); r(20, 24, 1, 1, '#e8b020'); r(21, 23, 1, 1, '#ffd23a'); r(17, 26, 2, 2, '#ffd23a');
    headFace(r, p, o, 12, 8);
    // 臉上刺青：眼下淚滴、眉尾三道、臉頰小星星
    r(13, 16, 1, 2, '#2a3a5a'); r(21, 9, 2, 1, '#2a3a5a'); r(21, 11, 2, 1, '#2a3a5a'); r(22, 15, 1, 1, '#2a3a5a'); r(21, 16, 3, 1, '#2a3a5a'); r(22, 17, 1, 1, '#2a3a5a');
    // 反戴鴨舌帽（帽簷朝後）
    r(12, 5, 12, 5, '#1a1a22'); r(12, 5, 12, 1, '#3a3a48'); r(22, 8, 6, 2, '#1a1a22'); r(15, 6, 4, 2, '#e04a4a');
    return hands;
  }
  // ---------- 7 黑幫老大：細條紋黑西裝、白襯衫、領帶、背頭（灰鬢角）、紅玫瑰胸花、雪茄、金戒指 ----------
  function boss(R, g, p, f) {
    const o = { skin: '#e8c0a0', skinD: '#c8a080', pants: '#1e1e24', pantsD: '#141418', shoe: '#0e0e10', shoeD: '#3a3a40', sleeve: '#26262e', sleeveD: '#1a1a20', legW: 5 };
    const r = human(R, p, o);
    r(10, 21, 16, 16, '#26262e'); r(22, 21, 4, 16, '#1a1a20'); for (let x = 12; x < 22; x += 3) r(x, 21, 1, 16, '#3a3a46'); // 細條紋
    r(15, 21, 6, 8, '#f4f0e8'); r(17, 21, 2, 9, '#8a1a24'); r(17, 21, 2, 1, '#b02a34'); r(14, 21, 2, 6, '#1a1a20'); r(20, 21, 2, 6, '#1a1a20');
    r(11, 23, 3, 3, '#d8202a'); r(12, 22, 1, 1, '#ff4a4a'); r(12, 26, 1, 2, '#2a7a2a'); // 紅玫瑰
    r(10, 32, 16, 1, '#141418');
    const hands = humanArms(r, p, o, 21, 7, 26);
    hands.forEach(([x, y]) => R(x, y + (p.dy || 0) + 1, 1, 1, '#ffd23a'));
    headFace(r, p, o, 12, 7); r(13, 12, 3, 1, '#2a1a10'); r(19, 12, 3, 1, '#2a1a10'); // 濃眉
    r(12, 4, 12, 4, '#141418'); r(12, 4, 12, 1, '#3a3a48'); r(11, 6, 2, 6, '#141418'); r(23, 6, 2, 6, '#141418'); r(11, 9, 1, 3, '#9a9aa4'); r(24, 9, 1, 3, '#9a9aa4'); // 背頭＋灰鬢角
    if (p.mouth !== 'o' && p.mouth !== 'grin' && !p.noItem) { r(19, 16, 6, 2, '#6a3a1a'); r(19, 16, 6, 1, '#8a5a2a'); r(25, 16, 1, 2, (f % 2) ? '#ff6a2a' : '#ffaa4a'); r(26, 13 - (f % 2), 1, 1, '#c8c8d0'); r(27, 11, 1, 1, '#a8a8b0'); }
    return hands;
  }
  // ---------- 8 蘑菇：彩虹菇傘（斜向彩帶、會滴下來），米白菇柄，臉在菇柄上 ----------
  function mushroom(R, g, p, f) {
    const dy = p.dy || 0, cx = 18, RB = ['#e8202a', '#ff8a1a', '#ffe02a', '#5ac83a', '#8ac8ff', '#a87aff', '#ff8ae0'];
    legs(R, cx, 39 + dy, p.legs, '#6a4a3a', '#5a3a2a', '#7a5a44');
    // 菇柄（身體）
    R(cx - 6, 20 + dy, 12, 20, '#f2d8b8'); R(cx + 3, 20 + dy, 3, 20, '#d8b890'); R(cx - 6, 20 + dy, 2, 20, '#fff0dc'); R(cx - 7, 36 + dy, 14, 4, '#e8c8a0'); R(cx - 7, 39 + dy, 14, 1, '#c8a880');
    // 菇傘：半圓，斜向彩虹帶
    for (let y = -11; y <= 0; y++) { const w = Math.round(15 * Math.sqrt(1 - (y * y) / 121)); for (let x = -w; x <= w; x++) { const band = Math.floor(((x + 15) * 0.55 - y * 0.6 + 2) / 2.6); R(cx + x, 19 + dy + y, 1, 1, RB[Math.max(0, Math.min(6, band))]); } }
    R(cx - 15, 19 + dy, 31, 2, '#4a3a5a'); oval(R, cx - 6, 11 + dy, 3, 2, 'rgba(255,255,255,.55)'); R(cx - 3, 9 + dy, 2, 1, '#ffffff');
    // 滴下來的彩色
    [[-12, 3, 0], [-5, 2, 3], [7, 4, 5], [12, 2, 6]].forEach(([x, l, c]) => { R(cx + x, 21 + dy, 2, l + (f % 2), RB[c]); R(cx + x, 21 + dy + l + (f % 2), 2, 1, RB[c]); });
    eyes(R, cx - 5, cx + 1, 25 + dy, 4, 5, 3, p.eyes || 'open', { look: (f % 3) - 1 });
    mouth(R, cx, 32 + dy, p.mouth || 'smile', { c: '#8a4a3a' }); R(cx - 6, 30 + dy, 2, 1, '#ffa8a8'); R(cx + 5, 30 + dy, 2, 1, '#ffa8a8');
    const h1 = arm(R, cx - 7, 28 + dy, -1, (p.arms || [])[0], '#6a4a3a'), h2 = arm(R, cx + 7, 28 + dy, 1, (p.arms || [])[1], '#6a4a3a');
    return [h1, h2];
  }
  const DRAW = [pill, stamp, leaf, nose, spoon, folded, thug, boss, mushroom];
  P.GANG_N = DRAW.length;
  // 取得幫派角色某個動作的影格；opt.img＝媽的媽啊的自畫藥丸圖案
  // 描邊之後才畫的東西（不要黑框）：大鼻子走路掉白粉、大麻寶寶吐煙
  const POST = {
    3: (R, p, f) => { if (p.legs !== 'a' && p.legs !== 'b') return; const dy = p.dy || 0, k = f % 4;
      [[12, 44 + k], [21, 45 + ((k + 2) % 4)], [16, 47 + (k % 2)], [9, 46 - (k % 2)], [24, 43 + k]].forEach(([x, y], j) => { if ((j + k) % 3 !== 2) R(x, y + dy, 1, 1, j % 2 ? '#f0f0f8' : '#ffffff'); }); },
    2: (R, p, f) => { const k = f % 8; if (k < 6 || p.eyes === 'x' || p.mouth === 'o') return; const dy = p.dy || 0, t = k - 6, mx = 18, my = 22 + dy;
      // 吐出來的煙：柔和的白色雲團（兩格動畫：剛吐出、往上飄散開）
      const puff = t === 0 ? [[1, 0, 2], [4, -2, 3], [7, -4, 2]] : [[3, -5, 3], [7, -8, 3], [5, -12, 2], [10, -12, 2], [1, -9, 2]];
      puff.forEach(([x, y, r]) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const d = xx * xx + yy * yy; if (d > r * r + 0.6) continue; R(mx + 2 + x + xx, my + y + yy, 1, 1, d > (r - 1) * (r - 1) + 0.6 ? (t ? 'rgba(220,228,222,.7)' : 'rgba(228,234,230,.85)') : (t ? 'rgba(244,247,244,.8)' : '#f6f8f6')); } }); }
  };
  P.gangSprite = function (i, pose, f, opt) {
    const key = 'g' + i + '|' + JSON.stringify(pose || {}) + '|' + (f || 0) + '|' + (opt && opt.img ? (opt.img.__id || (opt.img.__id = Math.random())) : '') + '|' + (opt && opt.stamp ? opt.stamp : 0);
    if (cache[key]) return cache[key];
    const [c, g, R] = mk(), k = ((i % DRAW.length) + DRAW.length) % DRAW.length; DRAW[k](R, g, pose || {}, f || 0, opt);
    P.outline(c); if (POST[k]) POST[k](R, pose || {}, f || 0, opt); return (cache[key] = c);
  };
  P.gangHands = function (i, pose, f) { const [c, g, R] = mk(); return DRAW[i](R, g, pose || {}, f || 0) || []; };
  // 畫藥丸的畫板用：只有眼睛＋嘴巴的 23×23 圖（畫板上鎖住這些格子）
  P.pillFace = function () { if (cache.pf) return cache.pf; const [c, g] = P.canvas(23, 23); const R = (x, y, w, h, col) => { if (w <= 0 || h <= 0) return; g.fillStyle = col; g.fillRect(Math.round(x) - 7, Math.round(y) - 11, Math.round(w), Math.round(h)); };
    bigEyes(R, 13, 23, 18, 'open'); mouth(R, 18, 25, 'grin', {}); return (cache.pf = c); };
  // 頭像（HUD、選角清單用）：每個角色裁出臉的範圍，回傳 dataURL
  const FACE = [[4, 7, 28, 28], [4, 2, 28, 28], [4, 3, 28, 28], [2, 8, 32, 32], [7, 0, 22, 22], [0, 18, 18, 18], [8, 3, 20, 20], [8, 1, 20, 20], [2, 6, 32, 32]], faceC = {};
  P.gangFace = function (i, opt) {
    if (opt && opt.naturalWidth !== undefined) opt = { img: opt }; const img = opt && opt.img;
    const key = i + '|' + (img ? (img.__id || (img.__id = Math.random())) : '') + '|' + ((opt && opt.stamp) || 0); if (faceC[key]) return faceC[key];
    const [x, y, w, h] = FACE[i % FACE.length], [c, g] = P.canvas(48, 48); g.imageSmoothingEnabled = false; g.drawImage(P.gangSprite(i, {}, 0, opt || null), x, y, w, h, 0, 0, 48, 48);
    return (faceC[key] = c.toDataURL());
  };
  // 棋盤上的動作 → 影格（同怪奇小鎮的 tokenFrame）
  P.gangFrame = function (i, state, t, opt) {
    const blink = (t % 3.3) < 0.14, f = Math.floor(t * 4), S = (pose, ff) => P.gangSprite(i, pose, ff, opt);
    const ff = i === 2 ? f % 8 : i === 3 ? f % 4 : f % 2;
    if (state === 'walk') return S({ legs: Math.floor(t * 8) % 2 ? 'a' : 'b' }, ff);
    if (state === 'joy') return S({ arms: ['up', 'up'], legs: Math.floor(t * 6) % 2 ? 'jump' : 'stand', mouth: 'grin', dy: Math.floor(t * 6) % 2 ? -2 : 0 }, f % 2);
    if (state === 'scared') return S({ arms: ['out', 'out'], eyes: 'wide', mouth: 'o', dy: Math.floor(t * 20) % 2 }, f % 2);
    if (state === 'sad') return S({ eyes: 'blink', mouth: 'sad' }, 0);
    if (state === 'fall') return S({ eyes: 'x', mouth: 'o' }, 0);
    return S({ eyes: blink ? 'blink' : 'open', mouth: i === 2 && (f % 8 === 4 || f % 8 === 5) ? 'o' : undefined }, i === 2 ? f % 8 : f % 2);
  };
})(typeof window !== 'undefined' ? window : globalThis);
