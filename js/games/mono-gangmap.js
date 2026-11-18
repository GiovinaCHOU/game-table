// 幫派街區的像素地圖：建築（4 級）、格子圖示、環境立牌（公寓、塗鴉牆、棕櫚樹、路燈、油桶火、車、警車、直升機）、地面
// 夜晚的配色：磚紅、水泥灰、鈉燈橘、霓虹粉／青；全部一格一格畫，再描深色外框
(function (root) {
  const P = root.MONO_PIXEL; if (!P) return;
  const { canvas, outline } = P;
  const hsh = (x, y, s) => { const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453; return v - Math.floor(v); };
  const C = {}; const memo = (k, f) => C[k] || (C[k] = f());
  const mk = (w, h) => { const [c, g] = canvas(w, h); const R = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); }; return [c, g, R]; };
  // 3x5 像素字
  const FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', $: '011110010011110', 2: '111001111100111', 4: '101101111001001', 7: '111001001001001', '!': '010010010000010' };
  const txt = (R, s, x, y, col, dy) => String(s).split('').forEach((ch, i) => { const f = FONT[ch]; if (!f) return; for (let k = 0; k < 15; k++) if (f[k] === '1') R(dy ? x + k % 3 : x + i * 4 + k % 3, dy ? y + i * 6 + Math.floor(k / 3) : y + Math.floor(k / 3), 1, 1, col); });
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const t = f < 0 ? 0 : 255, p = Math.abs(f); r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); };

  // 磚牆：一排一排錯開，偶爾有較亮／較暗的磚
  function brick(R, x0, y0, w, h, base, seed) {
    const mort = shade(base, -0.45), hi = shade(base, 0.14), lo = shade(base, -0.18);
    R(x0, y0, w, h, base);
    for (let y = 0; y < h; y++) { const row = Math.floor(y / 3), off = row % 2 ? 2 : 0;
      if (y % 3 === 2) { R(x0, y0 + y, w, 1, mort); continue; }
      for (let x = 0; x < w; x++) { if ((x + off) % 5 === 4) { R(x0 + x, y0 + y, 1, 1, mort); continue; } const b = hsh(Math.floor((x + off) / 5), row, seed); if (b > 0.86) R(x0 + x, y0 + y, 1, 1, hi); else if (b < 0.12) R(x0 + x, y0 + y, 1, 1, lo); } }
  }
  // 塗鴉 tag：泡泡字，地主顏色，白色亮點，往下滴
  function tag(R, x0, y0, w, h, col, seed) {
    // 用 3x5 字型放大後再往外膨脹一格，變成胖胖的泡泡字；字母略微上下錯開、彼此重疊
    const dk = shade(col, -0.6), lt = shade(col, 0.55), L = 'ABCDEGHKMNOPRSTUWXY', sc = h >= 9 ? 2 : 1;
    const n = Math.max(1, Math.floor((w - 2) / (3 * sc + 1))), cells = new Set(), put = (x, y) => cells.add(x + ',' + y);
    for (let i = 0; i < n; i++) { const f = FONT[L[Math.floor(hsh(i, seed, 1) * L.length)]], ox = x0 + 1 + i * (3 * sc + 1), oy = y0 + 1 + Math.round((hsh(i, seed, 2) - 0.5) * 2) + Math.max(0, Math.floor((h - 2 - 5 * sc) / 2));
      for (let k = 0; k < 15; k++) if (f[k] === '1') for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) put(ox + (k % 3) * sc + a, oy + Math.floor(k / 3) * sc + b); }
    const core = new Set(cells); core.forEach(s2 => { const [x, y] = s2.split(',').map(Number); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => put(x + a, y + b)); });
    cells.forEach(s2 => { const [x, y] = s2.split(',').map(Number); [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]].forEach(([a, b]) => { if (!cells.has((x + a) + ',' + (y + b))) R(x + a, y + b, 1, 1, dk); }); });
    cells.forEach(s2 => { const [x, y] = s2.split(',').map(Number); R(x, y, 1, 1, core.has(s2) ? col : shade(col, -0.2)); if (core.has(s2) && !core.has(x + ',' + (y - 1))) R(x, y, 1, 1, lt); });
    let ymax = 0; cells.forEach(s2 => { ymax = Math.max(ymax, +s2.split(',')[1]); });
    for (let i = 0; i < n; i++) if (hsh(i, seed, 6) > 0.6) { const x = x0 + 2 + i * (3 * sc + 1) + Math.floor(hsh(i, seed, 4) * 2), d = 1 + Math.floor(hsh(i, seed, 5) * 2); R(x, ymax + 1, 1, d, shade(col, -0.2)); }
  }
  // ===== 塗鴉：先用字型把字畫成遮罩，再依風格一層層上色（雲狀底、立體陰影、外框、漸層填色、星星／圓點）=====
  const GF = '"PingFang TC","Noto Sans TC","Noto Sans CJK TC","Microsoft JhengHei",sans-serif';
  function mask(text, w, h, px, o) { o = o || {}; const [c, g] = canvas(w, h); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.font = `900 ${px}px ${GF}`;
    const chars = [...text], ws = chars.map(ch => g.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) * (o.tight || 0.92); let x = (w - tot) / 2;
    chars.forEach((ch, i) => { g.save(); g.translate(x + ws[i] / 2, h / 2 + (o.bounce ? (hsh(i, o.seed || 1, 3) - 0.5) * o.bounce : 0)); g.rotate((hsh(i, o.seed || 1, 4) - 0.5) * (o.rot || 0)); g.transform(1, 0, -(o.skew || 0), 1, 0, 0); g.textAlign = 'center'; g.fillText(ch, 0, 0); g.restore(); x += ws[i] * (o.tight || 0.92); });
    const d = g.getImageData(0, 0, w, h).data, M = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) M[i] = d[i * 4 + 3] > 120 ? 1 : 0; return M; }
  const dil = (M, w, h, r, jag, seed) => { const O = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!M[y * w + x]) continue; const rr = jag ? r + Math.round((hsh(x >> 2, y >> 2, seed || 5) - 0.5) * jag) : r; for (let b = -rr; b <= rr; b++) for (let a = -rr; a <= rr; a++) { if (a * a + b * b > rr * rr + rr) continue; const X = x + a, Y = y + b; if (X >= 0 && Y >= 0 && X < w && Y < h) O[Y * w + X] = 1; } } return O; };
  const shift = (M, w, h, dx, dy) => { const O = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (M[y * w + x]) { const X = x + dx, Y = y + dy; if (X < w && Y < h && X >= 0 && Y >= 0) O[Y * w + X] = 1; } return O; };
  // style：wild（紫藍紅橘漸層＋黃邊＋立體＋雲狀底＋星星）、throw（泡泡字：一個顏色＋粗黑邊）、cn（紅字藍邊白外框）、chrome（銀字黑邊藍影）、scrawl（細黑簽名）
  function piece(R, x0, y0, w, h, text, style, o) {
    o = o || {}; const seed = o.seed || 1, px = o.px || Math.round(h * 0.78);
    const pl = style === 'plain', M = mask(text, w, h, px, pl ? { tight: 1 } : { skew: style === 'wild' ? 0.18 : style === 'throw' ? 0.1 : style === 'scrawl' ? 0.3 : 0, rot: style === 'wild' ? 0.35 : style === 'scrawl' ? 0.3 : 0.12, bounce: style === 'wild' ? 3 : 1.5, seed, tight: style === 'throw' ? 0.82 : style === 'wild' ? 0.86 : 0.95 });
    const at = (L, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (L[y * w + x]) { const col = f(x, y); if (col) R(x0 + x, y0 + y, 1, 1, col); } };
    const minus = (A, B) => A.map((v, i) => v && !B[i] ? 1 : 0);
    let top = h, bot = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (M[y * w + x]) { top = Math.min(top, y); bot = Math.max(bot, y); } const sp = Math.max(1, bot - top);
    if (style === 'wild') {
      const cloud = dil(M, w, h, 4, 3, seed); at(cloud, (x, y) => hsh(x >> 1, y >> 1, seed) > 0.86 ? '#3a5466' : '#22323e');
      const ext = minus(dil(shift(M, w, h, 2, 2), w, h, 1), dil(M, w, h, 1)); at(ext, (x, y) => (x + y) % 5 ? '#5a5a1e' : '#3e3e12');
      const ol = minus(dil(M, w, h, 1), M); at(ol, () => '#f4ec3a');
      const G = o.grad || ['#5a3aa8', '#3a5ae0', '#8a2a8a', '#c8203a', '#e8602a'];
      at(M, (x, y) => { const u = (y - top) / sp * (G.length - 1), i = Math.min(G.length - 2, Math.floor(u)), f = u - i; return (f > ((x + y) % 2 ? 0.66 : 0.33) ? G[i + 1] : G[i]); });
      at(M, (x, y) => (y - top) / sp > 0.62 && hsh(x >> 1, y >> 1, seed + 3) > 0.9 ? '#8a1426' : null);
      for (let k = 0; k < (o.stars || 4); k++) { const sx = Math.floor(hsh(k, seed, 7) * w), sy = Math.floor(top + hsh(k, seed, 8) * sp * 0.6); if (!M[sy * w + sx]) continue; [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => R(x0 + sx + a, y0 + sy + b, 1, 1, '#b890ff')); }
    } else if (style === 'throw') {
      const ol = minus(dil(M, w, h, o.ow || 2), M); at(ol, () => '#101014');
      const col = o.col || '#5ab0ff', lt = shade(col, 0.35), dk = shade(col, -0.25);
      at(M, (x, y) => { const u = (y - top) / sp; return u < 0.22 ? lt : u > 0.8 ? dk : col; });
      at(M, (x, y) => !M[(y - 1) * w + x] && M[(y + 1) * w + x] && hsh(x, y, seed) > 0.4 ? '#ffffff' : null);
    } else if (style === 'cn') {
      const o2 = dil(M, w, h, 2), o1 = dil(M, w, h, 1); at(shift(o2, w, h, 1, 2), () => '#14141e'); at(minus(o2, o1), () => '#f4f0e8'); at(minus(o1, M), () => '#2a5ac8');
      at(M, (x, y) => ((y - top) % 4 === 0 && hsh(x >> 2, y, seed) > 0.5) ? '#ff7a6a' : '#e0283a');
    } else if (style === 'chrome') {
      const ol = dil(M, w, h, 1); at(shift(ol, w, h, 2, 2), () => '#2a5ac8'); at(minus(ol, M), () => '#101014');
      at(M, (x, y) => { const u = (y - top) / sp; return u < 0.3 ? '#f4f4fa' : u < 0.5 ? '#a8a8b8' : u < 0.55 ? '#5a5a6a' : u < 0.8 ? '#c8c8d6' : '#e8e8f4'; });
    } else at(M, () => o.col || '#101014');
  }
  P.piece = piece;
  // 台灣綠色路牌
  function streetSign(R, x, y) { R(x, y, 34, 11, '#f4f0e8'); R(x + 1, y + 1, 32, 9, '#1e7a4a'); txt(R, 'LANE', x + 3, y + 3, '#f4f0e8'); txt(R, '24', x + 21, y + 3, '#f4f0e8'); R(x + 28, y + 5, 4, 1, '#f4f0e8'); R(x + 30, y + 4, 1, 1, '#f4f0e8'); R(x + 30, y + 6, 1, 1, '#f4f0e8'); R(x + 29, y + 3, 1, 1, '#f4f0e8'); R(x + 29, y + 7, 1, 1, '#f4f0e8'); R(x + 16, y + 11, 2, 4, '#8a8a92'); }
  // 原創塗鴉貓：圓滾滾的粉紅貓頭，黑粗邊、豆豆眼、Y 字嘴
  function catThrow(R, x, y, s) { const [c0] = canvas(1, 1); void c0;
    for (let b = -6; b <= 6; b++) for (let a = -8; a <= 8; a++) { const e = (a * a) / 64 + (b * b) / 36; if (e <= 1.25) R(x + a, y + b, 1, 1, e > 0.9 ? '#101014' : b < -3 ? '#ffb8d8' : '#ff7ab8'); }
    [-1, 1].forEach(d => { const bx = x + d * 5; for (let k = 0; k < 4; k++) { const w = 6 - k * 2; if (w <= 0) { R(bx, y - 6 - k, 1, 1, '#101014'); continue; } R(bx - (w >> 1), y - 5 - k, w, 1, '#ff7ab8'); R(bx - (w >> 1) - 1, y - 5 - k, 1, 1, '#101014'); R(bx - (w >> 1) + w, y - 5 - k, 1, 1, '#101014'); } R(bx, y - 4, 1, 1, '#ffb8d8'); });
    R(x - 4, y - 1, 2, 2, '#101014'); R(x + 3, y - 1, 2, 2, '#101014'); R(x - 4, y - 1, 1, 1, '#ffffff'); R(x + 3, y - 1, 1, 1, '#ffffff'); R(x, y + 1, 1, 2, '#101014'); R(x - 1, y + 3, 1, 1, '#101014'); R(x + 1, y + 3, 1, 1, '#101014');
    R(x - 10, y + 1, 3, 1, '#101014'); R(x - 10, y + 3, 3, 1, '#101014'); R(x + 8, y + 1, 3, 1, '#101014'); R(x + 8, y + 3, 3, 1, '#101014'); void s; }
  const flag = (R, x, y, col) => { R(x, y, 1, 11, '#c8c8d0'); R(x + 1, y, 6, 4, col); R(x + 1, y + 3, 6, 1, shade(col, -0.35)); R(x + 1, y, 6, 1, shade(col, 0.3)); };

  // ================= 建築（48x56），四級；f＝動畫影格 0～5 =================
  P.gangBuilding = function (level, color, f) {
    f = f || 0; return memo('gb' + level + color + f, () => {
      const [c, g, R] = mk(P.BW, P.BH);
      if (level === 1) { // 街角地下攤：大陽傘（地主顏色條紋）、摺疊桌、黑色旅行袋露出鈔票、電子秤、紙板招牌、收音機、冰桶
        // 陽傘
        R(23, 12, 2, 30, '#b8b8c0'); R(24, 12, 1, 30, '#8a8a92');
        for (let r = 0; r < 9; r++) { const w = 12 + r * 4.2, x = 24 - w / 2; for (let k = 0; k < Math.ceil(w); k++) { const seg = Math.floor((x + k - 2) / 6); R(x + k, 4 + r, 1, 1, seg % 2 ? '#f4f0e8' : color); } }
        R(5, 13, 38, 1, shade(color, -0.45)); for (let k = 0; k < 7; k++) R(6 + k * 6, 13, 3, 2, (k % 2 ? '#d8d4cc' : shade(color, -0.2))); R(23, 2, 2, 3, '#e8e8f0');
        // 摺疊桌
        R(6, 39, 36, 3, '#d8d2c4'); R(6, 39, 36, 1, '#f0ece2'); R(6, 41, 36, 1, '#8a8478');
        for (let k = 0; k < 13; k++) { R(9 + k * 0.6, 42 + k, 1, 1, '#6a6a72'); R(16 - k * 0.6, 42 + k, 1, 1, '#6a6a72'); R(32 + k * 0.6, 42 + k, 1, 1, '#6a6a72'); R(39 - k * 0.6, 42 + k, 1, 1, '#6a6a72'); }
        // 旅行袋＋鈔票
        R(9, 31, 14, 8, '#24222c'); R(9, 31, 14, 1, '#3a3844'); R(10, 30, 12, 1, '#24222c'); R(13, 28, 6, 1, '#3a3844'); R(13, 28, 1, 3, '#3a3844'); R(18, 28, 1, 3, '#3a3844');
        R(10, 32, 11, 1, '#c8c8d0'); for (let k = 0; k < 4; k++) { R(11 + k * 2.5, 29 + (k % 2), 3, 3, '#6ab05a'); R(11 + k * 2.5, 29 + (k % 2), 3, 1, '#9ad07a'); }
        // 電子秤（綠色螢幕會閃）
        R(26, 35, 10, 4, '#a8a8b0'); R(26, 35, 10, 1, '#d0d0d8'); R(25, 34, 12, 1, '#c8c8d0'); R(28, 37, 5, 1, f % 3 === 0 ? '#2a5a2a' : '#7aff6a');
        // 紙板招牌（手寫 $$）
        R(14, 43, 14, 10, '#b08a5a'); R(14, 43, 14, 1, '#c8a070'); R(27, 43, 1, 10, '#8a6a40'); txt(R, '$$', 16, 46, '#1a1418'); R(24, 47, 2, 1, '#1a1418');
        // 收音機（喇叭會跳）
        const big = f % 2; R(1, 45, 13, 9, '#4a4a54'); R(1, 45, 13, 1, '#6a6a74'); R(4, 43, 7, 2, '#2a2a30'); R(3, 47 - big, 4, 4 + big, '#18181e'); R(9, 47 - big, 4, 4 + big, '#18181e'); R(4, 48, 2, 2, big ? '#8a8a96' : '#5a5a66'); R(10, 48, 2, 2, big ? '#8a8a96' : '#5a5a66'); R(7, 47, 1, 1, '#ff3a3a');
        // 冰桶
        R(36, 46, 11, 8, '#e8eef4'); R(36, 46, 11, 3, '#3a7ac8'); R(36, 46, 11, 1, '#6aa0e0'); R(45, 49, 2, 5, '#c0c8d0'); R(39, 45, 5, 1, '#d0d6dc');
      } else if (level === 2) { // 磚造小店：霓虹 OPEN 招牌、半開的鐵捲門（上面有地主顏色塗鴉）、店裡透出暖光、冷氣滴水、垃圾袋
        brick(R, 3, 20, 42, 35, '#7a3428', 21); R(41, 20, 4, 35, 'rgba(0,0,0,.28)');
        R(1, 17, 46, 3, '#5a5260'); R(1, 17, 46, 1, '#7a7280'); R(1, 19, 46, 1, '#3a3440');
        R(30, 10, 11, 7, '#9a9aa2'); R(30, 10, 11, 1, '#c0c0c8'); for (let k = 0; k < 4; k++) R(32 + k * 2, 12, 1, 4, '#6a6a72'); R(10, 6, 1, 11, '#5a5a62'); R(8, 6, 5, 1, '#5a5a62');
        // 霓虹招牌
        R(7, 22, 34, 9, '#120a16'); R(7, 22, 34, 1, '#2a1e2e'); const on = f % 6 !== 4, pk = on ? '#ff4ac0' : '#4a1a3a';
        txt(R, 'OPEN', 11, 24, pk); if (on) { R(8, 23, 32, 1, 'rgba(255,74,192,.35)'); } txt(R, '24', 30, 24, f % 6 === 1 ? '#1a4a5a' : '#3af0ff');
        // 鐵捲門
        R(7, 33, 34, 12, '#8a8a94'); for (let k = 0; k < 6; k++) R(7, 34 + k * 2, 34, 1, '#6a6a74'); R(7, 33, 34, 1, '#a8a8b2'); R(7, 44, 34, 1, '#4a4a54'); tag(R, 10, 35, 26, 7, color, 3);
        R(7, 45, 34, 9, '#ffb860'); R(7, 45, 34, 1, '#ffe0a0'); for (let k = 0; k < 4; k++) { R(9 + k * 8, 47, 6, 1, '#a86a30'); R(9 + k * 8, 50, 6, 1, '#a86a30'); R(10 + k * 8, 46, 1, 1, ['#e5383b', '#3ab0e0', '#5aff6a', '#ffd23a'][k]); R(12 + k * 8, 49, 2, 1, ['#3ab0e0', '#ffd23a', '#e5383b', '#5aff6a'][k]); }
        R(5, 32, 2, 23, '#4a4a54'); R(41, 32, 2, 23, '#4a4a54');
        // 冷氣＋滴水
        R(42, 24, 6, 6, '#b8b8c0'); R(42, 24, 6, 1, '#d8d8e0'); R(43, 26, 4, 3, '#7a7a82'); R(45, 31 + (f % 3) * 3, 1, 2, '#7ac8ff');
        // 垃圾袋
        R(0, 48, 7, 7, '#18161e'); R(1, 47, 4, 1, '#18161e'); R(2, 49, 2, 1, '#3a3844'); R(3, 46, 1, 1, '#3a3844');
        flag(R, 18, 6, color);
      } else if (level === 3) { // 三層磚公寓：外掛逃生梯、亮燈的窗（有一戶在看電視一閃一閃）、直立霓虹 BAR、屋頂水塔、塗鴉
        brick(R, 5, 10, 37, 45, '#6a2c26', 33); R(38, 10, 4, 45, 'rgba(0,0,0,.3)');
        R(3, 8, 41, 3, '#4a4250'); R(3, 8, 41, 1, '#6a6270');
        // 屋頂水塔
        R(12, 0, 10, 6, '#7a5236'); for (let k = 0; k < 3; k++) R(12, 1 + k * 2, 10, 1, '#5a3a24'); R(11, 0, 12, 1, '#4a3424'); R(13, 6, 1, 2, '#3a3440'); R(20, 6, 1, 2, '#3a3440');
        // 窗戶：三層 × 三扇
        const win = (x, y, k) => { const mode = Math.floor(hsh(k, 7, 3) * 3), tv = k === 4, flick = tv ? ['#5ab0ff', '#2a5aa0', '#8ad0ff', '#3a70c0', '#5ab0ff', '#2a4a90'][f] : null, lit = mode > 0 || tv;
          R(x - 1, y - 1, 8, 9, '#4a4250'); R(x, y, 6, 7, lit ? (tv ? flick : (mode === 2 ? '#ffc870' : '#ffa850')) : '#1a1626'); if (lit && !tv) R(x, y, 3, 3, mode === 2 ? '#ffe4a8' : '#ffc070'); R(x + 3, y, 1, 7, '#3a3440'); R(x, y + 3, 6, 1, '#3a3440'); R(x - 1, y + 7, 8, 1, '#8a8090'); };
        [13, 24, 35].forEach((y, r) => [9, 19, 29].forEach((x, k) => win(x, y, r * 3 + k)));
        // 逃生梯（黑鐵平台＋欄杆＋斜梯）
        [21, 33].forEach(y => { R(6, y, 26, 1, '#18161e'); R(6, y - 3, 26, 1, '#24222a'); for (let x = 6; x < 32; x += 3) R(x, y - 3, 1, 3, '#24222a'); });
        for (let k = 0; k < 11; k++) R(26 - k, 22 + k, 2, 1, '#18161e'); for (let k = 0; k < 6; k++) R(16 + k * 2, 22 + k * 2 + 1, 1, 1, '#3a3842');
        // 一樓：門＋小窗＋塗鴉
        R(10, 45, 7, 10, '#2a1e1a'); R(10, 45, 7, 1, '#4a3a30'); R(15, 50, 1, 1, '#c8a050'); R(9, 44, 9, 1, '#8a8090');
        R(22, 49, 12, 5, '#ffb860'); R(22, 49, 12, 1, '#ffe0a0'); R(27, 49, 1, 5, '#4a4250'); R(21, 54, 14, 1, '#8a8090');
        tag(R, 20, 42, 16, 5, color, 9);
        // 直立霓虹 BAR
        const on = f % 6 !== 3; R(41, 16, 7, 22, '#120a16'); R(41, 16, 7, 1, '#2a1e2e'); R(40, 20, 1, 2, '#3a3440'); R(40, 32, 1, 2, '#3a3440');
        txt(R, 'BAR', 43, 18, on ? '#3af0ff' : '#14404a', true); if (on && f % 2) R(42, 17, 1, 20, 'rgba(58,240,255,.3)');
        flag(R, 30, 0, color);
      } else { // 老大的夜總會：黑金立面、跑馬燈、霓虹 CLUB、金框大門、紅地毯、絲絨圍欄、屋頂兩棵棕櫚樹
        // 屋頂棕櫚
        [[5, 1], [41, -1]].forEach(([x, d]) => { R(x, 6, 2, 14, '#6a4a30'); for (let k = 0; k < 7; k++) R(x - 6 + k * 2, 4 + Math.abs(k - 3) * 0.7, 2, 1, '#2a6a3a'); R(x - 5, 5, 3, 1, '#1e4a2a'); R(x + 4, 5, 3, 1, '#1e4a2a'); R(x - 1, 2, 4, 2, '#3a8a4a'); R(x - 6, 6, 1, 2, '#2a6a3a'); R(x + 7, 6, 1, 2, '#2a6a3a'); void d; });
        R(1, 18, 46, 37, '#18121e'); R(1, 18, 2, 37, '#2a2232'); R(43, 18, 4, 37, '#0e0a12');
        R(0, 16, 48, 3, '#c8a050'); R(0, 16, 48, 1, '#f0d890'); R(0, 18, 48, 1, '#8a6a30');
        // 招牌＋跑馬燈
        R(6, 20, 36, 12, '#0a060e'); for (let k = 0; k < 18; k++) { const lit = (k + f) % 3 === 0; R(6 + k * 2, 20, 1, 1, lit ? '#fff0b0' : '#8a6a30'); R(41 - k * 2, 31, 1, 1, lit ? '#fff0b0' : '#8a6a30'); }
        for (let k = 0; k < 5; k++) { const lit = (k + f) % 3 === 0; R(6, 22 + k * 2, 1, 1, lit ? '#fff0b0' : '#8a6a30'); R(41, 22 + k * 2, 1, 1, lit ? '#fff0b0' : '#8a6a30'); }
        const on = f % 6 !== 5, nc = on ? '#ff4ac0' : '#4a1a3a'; [['C', 12], ['L', 19], ['U', 26], ['B', 33]].forEach(([ch, x]) => { const f2 = FONT[ch]; for (let k = 0; k < 15; k++) if (f2[k] === '1') R(x + (k % 3) * 2, 23 + Math.floor(k / 3), 2, 1, nc); });
        R(8, 25, 1, 1, on ? '#ffd23a' : '#5a4a1a'); R(39, 25, 1, 1, on ? '#ffd23a' : '#5a4a1a');
        // 有色玻璃窗
        [4, 36].forEach(x => { R(x, 35, 8, 10, '#3a1e4a'); R(x, 35, 8, 1, '#c8a050'); R(x, 44, 8, 1, '#c8a050'); R(x + 1, 36, 2, 4, '#6a3a8a'); R(x + 4, 37, 1, 6, '#4a2a5a'); });
        // 大門
        R(16, 34, 16, 21, '#c8a050'); R(17, 35, 14, 20, '#2a0a12'); R(24, 35, 1, 20, '#c8a050'); R(22, 44, 1, 3, '#f0d890'); R(26, 44, 1, 3, '#f0d890'); R(16, 34, 16, 1, '#f0d890'); R(18, 36, 5, 6, '#4a1828'); R(26, 36, 5, 6, '#4a1828');
        // 紅地毯
        R(17, 53, 14, 3, '#a01828'); R(17, 53, 14, 1, '#c82838');
        // 絲絨圍欄（地主顏色的繩子）
        [10, 37].forEach((x, k) => { R(x, 46, 2, 9, '#c8a050'); R(x, 46, 2, 1, '#f0d890'); R(x - 1, 54, 4, 1, '#8a6a30'); const x2 = k ? x - 5 : x + 5; R(x2, 46, 2, 9, '#c8a050'); R(x2 - 1, 54, 4, 1, '#8a6a30'); for (let j = 0; j < 4; j++) R(Math.min(x, x2) + 2 + j, 48 + (j === 1 || j === 2 ? 1 : 0), 1, 1, color); });
        // 屋頂探照燈
        R(14, 12, 5, 4, '#3a3440'); R(15, 11, 3, 2, f % 2 ? '#fff8d0' : '#d8d0a0'); R(30, 12, 5, 4, '#3a3440'); R(31, 11, 3, 2, f % 2 ? '#d8d0a0' : '#fff8d0');
        flag(R, 23, 3, color);
      }
      outline(c); return c; });
  };

  // ================= 格子圖示（20x20）=================
  P.gangIcon = function (type) {
    return memo('gi' + type, () => { const [c, g, R] = mk(20, 20);
      if (type === 'start') { // 路牌
        R(9, 7, 2, 13, '#6a6a72'); R(9, 7, 1, 13, '#8a8a92'); R(1, 2, 18, 5, '#2a8a4a'); R(1, 2, 18, 1, '#4ab06a'); R(2, 3, 16, 3, '#2a8a4a'); for (let k = 0; k < 6; k++) R(3 + k * 2.5, 4, 2, 1, '#f4f0e8'); R(15, 3, 1, 1, '#f4f0e8'); R(3, 8, 14, 4, '#1a5aa0'); R(3, 8, 14, 1, '#3a7ac8'); for (let k = 0; k < 4; k++) R(5 + k * 3, 10, 2, 1, '#f4f0e8'); }
      if (type === 'jail') { // 手銬
        const cuff = (x, y) => { R(x + 1, y, 5, 1, '#c0c0c8'); R(x, y + 1, 1, 5, '#c0c0c8'); R(x + 6, y + 1, 1, 5, '#8a8a92'); R(x + 1, y + 6, 5, 1, '#8a8a92'); R(x + 1, y + 1, 1, 1, '#f0f0f8'); R(x + 5, y + 2, 2, 2, '#6a6a72'); };
        cuff(1, 9); cuff(12, 3); for (let k = 0; k < 4; k++) R(7 + k * 1.3, 10 - k * 1.2, 2, 1, k % 2 ? '#8a8a92' : '#c0c0c8'); }
      if (type === 'free') { // 滑板
        R(2, 9, 16, 3, '#e5383b'); R(1, 10, 1, 2, '#e5383b'); R(18, 9, 1, 2, '#e5383b'); R(2, 9, 16, 1, '#ff6a5a'); R(5, 10, 10, 1, '#ffd23a'); R(4, 12, 3, 1, '#8a8a92'); R(13, 12, 3, 1, '#8a8a92'); R(3, 13, 3, 3, '#f4f0e8'); R(14, 13, 3, 3, '#f4f0e8'); R(4, 14, 1, 1, '#aaa'); R(15, 14, 1, 1, '#aaa'); R(4, 4, 1, 3, '#d8d4cc'); R(7, 3, 1, 4, '#d8d4cc'); R(15, 4, 1, 3, '#d8d4cc'); }
      if (type === 'gotojail') { // 警燈
        R(3, 10, 14, 6, '#1a1a22'); R(3, 10, 14, 1, '#3a3a44'); R(4, 6, 6, 5, '#e5383b'); R(10, 6, 6, 5, '#2a6aff'); R(5, 7, 2, 2, '#ff9a9a'); R(11, 7, 2, 2, '#9ac0ff'); R(0, 7, 3, 1, '#ff5a5a'); R(1, 4, 2, 1, '#ff5a5a'); R(17, 7, 3, 1, '#5a8aff'); R(17, 4, 2, 1, '#5a8aff'); R(2, 16, 16, 2, '#2a2a32'); }
      if (type === 'luck') { // 一箱現金
        R(2, 6, 16, 11, '#2a2a32'); R(2, 6, 16, 1, '#4a4a54'); R(8, 4, 4, 2, '#2a2a32'); R(3, 7, 14, 7, '#6ab05a'); for (let k = 0; k < 4; k++) { R(3, 8 + k * 2, 14, 1, '#4a8a3a'); R(9, 7 + k * 2, 2, 1, '#9ad07a'); } R(2, 14, 16, 3, '#1a1a22'); R(9, 15, 2, 1, '#c8a050'); }
      if (type === 'bad') { // 警徽
        R(6, 2, 8, 2, '#e8b020'); R(4, 4, 12, 9, '#e8b020'); R(5, 13, 10, 2, '#e8b020'); R(7, 15, 6, 2, '#e8b020'); R(9, 17, 2, 2, '#e8b020'); R(4, 4, 12, 1, '#fff0a0'); R(7, 6, 6, 6, '#1a3a8a'); R(9, 7, 2, 4, '#e8b020'); R(8, 8, 4, 2, '#e8b020'); R(14, 5, 2, 9, '#b08010'); }
      if (type === 'tax') { // 信封塞錢
        R(2, 6, 16, 11, '#e8dcc0'); R(2, 6, 16, 1, '#f8f0e0'); for (let k = 0; k < 8; k++) R(2 + k, 7 + k * 0.6, 16 - k * 2, 1, '#c8bca0'); R(5, 3, 10, 4, '#6ab05a'); R(5, 3, 10, 1, '#9ad07a'); R(9, 4, 2, 2, '#3a7a2a'); R(8, 12, 4, 3, '#c8202a'); }
      if (type === 'teleport') { // 跑路：球鞋＋速度線
        R(6, 9, 10, 5, '#f4f0e8'); R(5, 12, 13, 3, '#f4f0e8'); R(5, 15, 13, 2, '#e5383b'); R(8, 9, 3, 3, '#1a1a22'); R(12, 11, 4, 1, '#3ab0e0'); R(13, 12, 3, 1, '#3ab0e0'); R(7, 7, 4, 2, '#f4f0e8'); R(0, 9, 4, 1, '#c8c8d0'); R(1, 12, 3, 1, '#c8c8d0'); R(0, 15, 4, 1, '#c8c8d0'); }
      if (type === 'item') { // 噴漆罐
        R(6, 5, 8, 14, '#e5383b'); R(6, 5, 2, 14, '#ff6a5a'); R(12, 5, 2, 14, '#a01e28'); R(7, 3, 6, 2, '#c0c0c8'); R(9, 1, 2, 2, '#1a1a22'); R(7, 9, 6, 5, '#f4f0e8'); R(8, 10, 4, 1, '#1a1a22'); R(8, 12, 3, 1, '#1a1a22'); R(14, 0, 1, 1, '#ff3ab0'); R(16, 2, 1, 1, '#ff3ab0'); R(17, 0, 1, 1, '#3af0ff'); }
      outline(c); return c; });
  };

  // ================= 環境立牌 =================
  // 公寓（48x80）：四～五層、逃生梯、亮燈的窗、屋頂水塔或看板、有的掛直立霓虹（sign=0 關／1 開）
  P.gTenement = function (seed, sign) {
    return memo('gt' + seed + '|' + sign, () => { const [c, g, R] = mk(48, 80);
      const base = ['#6a2c26', '#7a4030', '#5a4a4a', '#6a3a3a', '#4a4250'][seed % 5], floors = 4 + (seed % 2), fh = 13, top = 80 - floors * fh - 4;
      if (base === '#4a4250') { R(3, top, 40, 80 - top, base); for (let y = top; y < 80; y += 4) R(3, y, 40, 1, shade(base, -0.2)); } else brick(R, 3, top, 40, 80 - top, base, seed * 7 + 1);
      R(39, top, 4, 80 - top, 'rgba(0,0,0,.3)'); R(1, top - 3, 44, 3, '#3a3440'); R(1, top - 3, 44, 1, '#5a5260');
      if (seed % 3 === 0) { R(8, top - 12, 11, 8, '#6a4a32'); for (let k = 0; k < 3; k++) R(8, top - 11 + k * 2.5, 11, 1, '#4a3222'); R(7, top - 13, 13, 1, '#3a2a1e'); R(10, top - 4, 1, 1, '#2a2430'); R(17, top - 4, 1, 1, '#2a2430'); }
      else if (seed % 3 === 1) { R(20, top - 14, 22, 10, '#e8e0d0'); R(21, top - 13, 20, 8, ['#e5383b', '#3ab0e0', '#ffd23a'][seed % 3]); R(23, top - 11, 10, 2, '#f4f0e8'); R(23, top - 8, 14, 1, '#f4f0e8'); R(24, top - 4, 1, 4, '#3a3440'); R(38, top - 4, 1, 4, '#3a3440'); }
      else { R(30, top - 9, 1, 6, '#6a6a72'); R(27, top - 9, 7, 1, '#6a6a72'); R(29, top - 7, 3, 1, '#6a6a72'); }
      for (let fl = 0; fl < floors; fl++) { const y = top + 3 + fl * fh; for (let k = 0; k < 3; k++) { const x = 7 + k * 11, h = hsh(seed, fl * 3 + k, 5), lit = h > 0.45, tv = h > 0.93;
          R(x - 1, y - 1, 8, 9, '#3a3440'); R(x, y, 6, 7, tv ? '#5ab0ff' : lit ? (h > 0.7 ? '#ffc870' : '#ff9a4a') : '#16121e'); if (lit && !tv) R(x, y, 3, 3, h > 0.7 ? '#ffe4a8' : '#ffb870'); if (!lit && h < 0.2) R(x + 1, y + 1, 4, 5, '#24202e');
          R(x + 3, y, 1, 7, '#3a3440'); R(x, y + 3, 6, 1, '#3a3440'); R(x - 1, y + 7, 8, 1, '#7a7080'); }
        if (fl > 0 && seed % 2 === 0) { R(4, y + 9, 26, 1, '#14121a'); for (let x = 4; x < 30; x += 3) R(x, y + 6, 1, 3, '#1e1c24'); R(4, y + 6, 26, 1, '#1e1c24'); } }
      if (seed % 2 === 0) for (let fl = 1; fl < floors - 1; fl++) { const y = top + 3 + fl * fh + 9; for (let k = 0; k < fh; k++) R(24 - k * 0.9, y + k, 2, 1, '#14121a'); }
      // 一樓：店面
      R(5, 66, 36, 14, '#1e1a24'); const shop = seed % 4; R(7, 68, 14, 9, shop === 1 ? '#5ab0ff' : '#ffb860'); R(7, 68, 14, 1, '#fff0c0'); R(25, 67, 8, 13, '#2a1e1a'); R(31, 73, 1, 1, '#c8a050');
      tag(R, 8, 59, 22, 5, ['#ff3ab0', '#3af0ff', '#ffd23a', '#7aff6a', '#ff7a2a'][seed % 5], seed);
      if (seed % 3 !== 2) { const col = ['#ff4ac0', '#3af0ff', '#ffd23a'][seed % 3], word = ['HOTEL', 'BAR', 'LIQUOR', 'PAWN', 'TATTOO'][seed % 5].slice(0, 5); R(42, top + 6, 6, word.length * 6 + 3, '#120a16'); txt(R, word, 43, top + 8, sign ? col : shade(col, -0.7), true); }
      outline(c); return c; });
  };
  // 塗鴉牆（64x26）
  // 塗鴉牆（96x40）：清水模／磚牆底，每面一種台灣街頭常見的塗鴉
  P.gWall = function (seed) {
    return memo('gw' + seed, () => { const [c, g, R] = mk(96, 40); const kind = seed % 6;
      if (kind === 1 || kind === 4) brick(R, 0, 3, 96, 37, kind === 1 ? '#7a4a3a' : '#6a3a34', seed); else { R(0, 3, 96, 37, '#8a8690'); for (let x = 0; x < 96; x += 4) R(x, 3, 1, 37, '#7e7a86'); for (let y = 12; y < 40; y += 12) R(0, y, 96, 1, '#76727e'); for (let k = 0; k < 90; k++) R(hsh(k, seed, 1) * 96, 3 + hsh(k, seed, 2) * 37, 1, 1, k % 3 ? '#9a96a0' : '#6a6670'); for (let k = 0; k < 4; k++) { const x = hsh(k, seed, 6) * 90; R(x, 3, 1, 10 + hsh(k, seed, 7) * 20, '#6e6a76'); } }
      R(0, 0, 96, 3, '#5a5662'); R(0, 0, 96, 1, '#8a8692');
      if (kind === 0) { piece(R, 2, 7, 92, 30, 'BLOCK', 'wild', { seed: seed + 1 }); piece(R, 14, 3, 20, 8, 'ok', 'scrawl', { px: 8, col: '#f4ec3a', seed: 3 }); piece(R, 64, 3, 20, 8, 'jen', 'scrawl', { px: 8, col: '#f4ec3a', seed: 4 }); }
      else if (kind === 1) { piece(R, 4, 12, 72, 26, 'BOMB', 'throw', { col: '#4aa8ff', seed }); piece(R, 6, 4, 30, 10, 'yoyo', 'scrawl', { px: 9, seed: 6 }); piece(R, 50, 4, 30, 10, 'kuo', 'scrawl', { px: 9, seed: 7 }); streetSign(R, 58, 3); }
      else if (kind === 2) { piece(R, 4, 6, 64, 32, '黑錢', 'cn', { seed, px: 26 }); piece(R, 66, 9, 28, 26, '街', 'cn', { seed: seed + 2, px: 20 }); piece(R, 60, 3, 34, 8, 'FREE', 'scrawl', { px: 7, col: '#2a5ac8', seed: 8 }); }
      else if (kind === 3) { const sc = ['#f4f0e8', '#101014', '#ffd23a', '#ff5a5a', '#5ad0a0', '#c8c8d0']; for (let k = 0; k < 26; k++) { const x = Math.floor(hsh(k, seed, 1) * 88), y = 5 + Math.floor(hsh(k, seed, 2) * 30), w = 6 + Math.floor(hsh(k, seed, 3) * 7), h = 4 + Math.floor(hsh(k, seed, 4) * 4), col = sc[k % 6]; R(x, y, w, h, col); R(x, y + h - 1, w, 1, shade(col, -0.25)); for (let j = 0; j < w - 2; j += 2) R(x + 1 + j, y + 1 + (j % 3), 1, 1, col === '#101014' ? '#f4f0e8' : '#101014'); }
        catThrow(R, 70, 22); piece(R, 6, 12, 50, 22, 'LUV', 'throw', { col: '#f4f0e8', seed }); }
      else if (kind === 4) { piece(R, 3, 7, 90, 30, 'NITE', 'chrome', { seed }); catThrow(R, 85, 9); }
      else { piece(R, 2, 6, 92, 32, 'CASH', 'wild', { seed: seed + 9, grad: ['#2a8a4a', '#3ad06a', '#2a6aa8', '#1a3a8a', '#5a2a8a'] }); piece(R, 40, 2, 30, 8, 'ABC', 'scrawl', { px: 8, col: '#f4ec3a', seed: 5 }); }
      outline(c); return c; });
  };
  P.gFence = function () {
    return memo('gf', () => { const [c, g, R] = mk(48, 30);
      for (let y = 6; y < 30; y++) for (let x = 0; x < 48; x++) if ((x + y) % 7 === 0 || (x - y + 700) % 7 === 0) R(x, y, 1, 1, (x + y) % 14 < 7 ? '#a8a8b4' : '#868692');
      [0, 23, 46].forEach(x => { R(x, 3, 2, 27, '#8a8a96'); R(x, 3, 1, 27, '#b0b0bc'); }); R(0, 6, 48, 1, '#8a8a96');
      for (let x = 0; x < 48; x++) { const y = 2 + Math.round(Math.sin(x * 0.8) * 1.5); R(x, y, 1, 1, '#b0b0bc'); if (x % 4 === 0) { R(x - 1, y - 1, 1, 1, '#d0d0dc'); R(x + 1, y + 1, 1, 1, '#d0d0dc'); } }
      outline(c, [16, 14, 22]); return c; });
  };
  // 棕櫚樹（30x84）：夜裡是深色剪影，邊緣有一點鈉燈的橘光
  P.gPalm = function (seed) {
    return memo('gp' + seed, () => { const [c, g, R] = mk(48, 88); const bend = (hsh(seed, 1, 1) - 0.5) * 10;
      for (let y = 18; y < 88; y++) { const u = (y - 18) / 70, x = 23 + bend * (1 - u) * (1 - u); R(x, y, 3, 1, '#5a4030'); R(x, y, 1, 1, '#7a5a40'); if (y % 3 === 0) R(x, y, 3, 1, '#3a2a20'); }
      const tx = 23 + bend, ty = 18;
      for (let k = 0; k < 10; k++) { const a = -Math.PI * 1.02 + k / 9 * Math.PI * 1.04 + (hsh(k, seed, 2) - 0.5) * 0.25, L = 15 + hsh(k, seed, 3) * 6; let x = tx + 1, y = ty, vx = Math.cos(a), vy = Math.sin(a) * 0.7;
        for (let j = 0; j < L; j++) { vy += 0.07; x += vx; y += vy; const fade = j / L; R(x, y, 2, 1, fade > 0.7 ? '#1a3222' : '#22442c'); if (j > 1) { const ln = Math.max(1, Math.round(3 * (1 - fade))); R(x, y + 1, 1, ln, '#183020'); R(x + (vx > 0 ? -1 : 1), y + 1, 1, Math.max(1, ln - 1), '#1e3a26'); } if (j % 3 === 0) R(x, y - 1, 1, 1, '#2e5a3a'); } }
      R(tx - 1, ty - 2, 5, 4, '#2a4a32'); R(tx, ty - 2, 2, 1, '#3a6a46'); R(tx - 1, ty + 2, 2, 2, '#4a3020'); R(tx + 2, ty + 2, 2, 2, '#4a3020'); R(tx + 1, ty + 3, 2, 2, '#5a3a24');
      outline(c, [12, 10, 18]); return c; });
  };
  P.gLamp = function (on) {
    return memo('gl' + on, () => { const [c, g, R] = mk(18, 52); R(3, 6, 2, 45, '#2a2a32'); R(3, 6, 1, 45, '#4a4a54'); R(2, 49, 4, 2, '#1a1a20'); R(3, 5, 9, 2, '#2a2a32'); R(9, 7, 6, 2, '#3a3a44'); R(10, 9, 4, 1, on ? '#ffb050' : '#4a3a20'); if (on) { R(9, 10, 6, 1, '#ffd890'); } outline(c); return c; });
  };
  // 油桶火（16x26）：4 個火焰影格
  P.gBarrel = function (f) {
    return memo('gbr' + (f % 4), () => { const [c, g, R] = mk(16, 26);
      R(2, 12, 12, 14, '#6a3a24'); R(2, 12, 2, 14, '#8a5236'); R(11, 12, 3, 14, '#4a2618'); R(2, 15, 12, 1, '#4a2618'); R(2, 21, 12, 1, '#4a2618'); R(1, 11, 14, 2, '#3a2418'); R(5, 17, 2, 2, '#2a1810'); R(9, 23, 2, 1, '#2a1810');
      const fl = [[4, 6, 0, 3], [8, 9, 1, 4], [11, 5, 2, 3], [6, 4, 3, 2]]; fl.forEach(([x, h0, k, w0]) => { const h = h0 + ((f + k) % 3) * 2 - 1, sway = ((f + k) % 2) ? 1 : 0; for (let r = 0; r < h; r++) { const u = r / h, w = Math.max(1, Math.round(w0 * (1 - u * u))), xx = x - (w >> 1) + (u > 0.5 ? sway : 0); R(xx, 11 - r, w, 1, u > 0.75 ? '#e83a0a' : '#ff7a1a'); if (w > 2 && u < 0.6) R(xx + 1, 11 - r, w - 2, 1, '#ffd23a'); } });
      R(5 + (f % 3) * 2, 2 - (f % 2), 1, 1, '#ffb050');
      R(3, 10, 10, 1, '#ffd890'); outline(c); return c; });
  };
  // 低底盤車（52x20）：糖果漆、白邊胎、鍍鉻輪框
  P.gCar = function (seed) {
    return memo('gc' + seed, () => { const [c, g, R] = mk(52, 20); const col = ['#7a2ab0', '#c82848', '#2a8aa0', '#d89a2a', '#2a2a32'][seed % 5], hi = shade(col, 0.35), lo = shade(col, -0.35);
      R(2, 9, 48, 6, col); R(2, 9, 48, 1, hi); R(2, 14, 48, 1, lo); R(0, 11, 3, 3, col); R(49, 10, 3, 4, col); R(12, 3, 22, 6, col); R(12, 3, 22, 1, hi); R(14, 4, 8, 5, '#2a3a5a'); R(24, 4, 8, 5, '#2a3a5a'); R(15, 4, 3, 2, '#5a7aa0'); R(25, 4, 3, 2, '#5a7aa0'); R(22, 4, 2, 5, col);
      R(2, 12, 46, 1, '#e8e8f0'); R(0, 13, 4, 1, '#c8c8d0'); R(48, 13, 4, 1, '#c8c8d0'); R(49, 10, 2, 2, '#ffe8a0'); R(0, 11, 2, 2, '#ff3a3a');
      [[6, 0], [38, 1]].forEach(([x]) => { R(x, 13, 9, 7, '#14141a'); R(x + 1, 14, 7, 5, '#e8e8f0'); R(x + 2, 15, 5, 3, '#c0c0c8'); R(x + 3, 16, 3, 1, '#f8f8ff'); R(x + 4, 15, 1, 3, '#8a8a96'); });
      outline(c); return c; });
  };
  // 警車（52x22）：車頂紅藍燈兩個影格
  P.gCop = function (f) {
    return memo('gk' + (f % 2), () => { const [c, g, R] = mk(52, 22);
      R(2, 11, 48, 6, '#f4f4f8'); R(2, 11, 48, 1, '#ffffff'); R(2, 16, 48, 1, '#a8a8b0'); R(14, 11, 22, 6, '#1a1a22'); R(0, 13, 3, 3, '#e8e8f0'); R(49, 12, 3, 4, '#e8e8f0'); R(12, 5, 24, 6, '#1a1a22'); R(14, 6, 9, 5, '#3a4a6a'); R(25, 6, 9, 5, '#3a4a6a'); R(23, 5, 2, 6, '#1a1a22');
      R(17, 2, 14, 3, '#2a2a32'); R(18, 2, 6, 2, f % 2 ? '#ff3a3a' : '#5a1a1a'); R(24, 2, 6, 2, f % 2 ? '#1a2a5a' : '#3a7aff'); if (f % 2) R(17, 0, 7, 2, '#ff8a8a'); else R(24, 0, 7, 2, '#8ab0ff');
      R(16, 13, 6, 2, '#e8b020'); R(16, 13, 6, 1, '#fff0a0'); R(49, 12, 2, 2, '#ffe8a0');
      [[6], [38]].forEach(([x]) => { R(x, 15, 9, 7, '#14141a'); R(x + 2, 17, 5, 3, '#6a6a76'); R(x + 3, 18, 3, 1, '#9a9aa6'); });
      outline(c); return c; });
  };
  P.gHydrant = function () { return memo('gh', () => { const [c, g, R] = mk(10, 16); R(2, 4, 6, 11, '#e5383b'); R(2, 4, 2, 11, '#ff6a5a'); R(3, 2, 4, 2, '#c8202a'); R(0, 7, 2, 3, '#c8202a'); R(8, 7, 2, 3, '#c8202a'); R(1, 14, 8, 2, '#a01e28'); R(4, 1, 2, 1, '#a01e28'); outline(c); return c; }); };
  P.gDumpster = function (seed) { return memo('gd' + seed, () => { const [c, g, R] = mk(34, 22); const col = seed % 2 ? '#2a6a3a' : '#2a4a7a'; R(1, 6, 32, 15, col); R(1, 6, 32, 1, shade(col, 0.3)); for (let k = 0; k < 4; k++) R(5 + k * 7, 8, 1, 12, shade(col, -0.3)); R(0, 3, 34, 4, shade(col, -0.2)); R(0, 3, 34, 1, shade(col, 0.15)); R(3, 21, 3, 1, '#1a1a1e'); R(28, 21, 3, 1, '#1a1a1e'); R(8, 1, 6, 3, '#18161e'); R(20, 2, 4, 2, '#d8d0b0'); tag(R, 9, 11, 14, 5, ['#ff3ab0', '#ffd23a'][seed % 2], seed); outline(c); return c; }); };
  // 籃框（26x60）：鐵柱、壓克力板、鐵鍊網
  P.gHoop = function () { return memo('gho', () => { const [c, g, R] = mk(26, 60); R(4, 14, 3, 46, '#4a4a54'); R(4, 14, 1, 46, '#6a6a74'); R(2, 58, 7, 2, '#2a2a30'); R(5, 12, 10, 2, '#4a4a54');
      R(10, 2, 15, 12, '#e8e8f0'); R(10, 2, 15, 1, '#ffffff'); R(11, 3, 13, 10, '#c8d0dc'); R(14, 6, 7, 5, '#e8e8f0'); R(15, 7, 5, 4, '#c8d0dc'); R(13, 13, 9, 1, '#ff6a1a'); R(12, 14, 11, 1, '#e85a10');
      for (let k = 0; k < 6; k++) { R(13 + k * 2 - (k > 2 ? 1 : 0), 15, 1, 7 - Math.abs(k - 2.5), '#c0c0c8'); if (k % 2) R(13 + k * 2, 17, 1, 1, '#8a8a96'); } outline(c); return c; }); };
  // 直升機（44x18）：機身＋旋翼兩個影格
  P.gChopper = function (f) { return memo('gch' + (f % 2), () => { const [c, g, R] = mk(44, 18);
      R(10, 6, 16, 8, '#1e1e26'); R(8, 8, 3, 5, '#1e1e26'); R(26, 8, 14, 2, '#1e1e26'); R(38, 5, 2, 5, '#1e1e26'); R(11, 7, 6, 4, '#3a4a6a'); R(12, 7, 2, 2, '#6a8ab0'); R(12, 15, 14, 1, '#2a2a32'); R(14, 13, 1, 2, '#2a2a32'); R(22, 13, 1, 2, '#2a2a32'); R(17, 4, 2, 2, '#2a2a32');
      if (f % 2) R(2, 3, 32, 1, '#5a5a66'); else { R(10, 3, 16, 1, '#5a5a66'); R(17, 2, 2, 1, '#5a5a66'); } R(37 + (f % 2), 4, 1, 7, '#4a4a54'); R(24, 12, 2, 2, f % 2 ? '#ff3a3a' : '#5a1a1a'); outline(c); return c; }); };
  // 遠方天際線（96x48），只有少量窗光
  P.gSkyline = function (seed) { return memo('gs' + seed, () => { const [c, g, R] = mk(96, 48); let x = 0, k = 0;
      while (x < 96) { const w = 8 + Math.floor(hsh(k, seed, 1) * 12), h = 14 + Math.floor(hsh(k, seed, 2) * 32); R(x, 48 - h, w, h, k % 2 ? '#1a1428' : '#16122a'); if (hsh(k, seed, 3) > 0.6) R(x + w / 2, 48 - h - 4, 1, 4, '#16122a');
        for (let y = 48 - h + 3; y < 46; y += 3) for (let xx = x + 2; xx < x + w - 1; xx += 3) if (hsh(xx, y, seed) > 0.8) R(xx, y, 1, 1, hsh(xx, y, 2) > 0.5 ? '#ffc870' : '#ff9a4a');
        if (hsh(k, seed, 4) > 0.85) R(x + w / 2, 48 - h - 5, 1, 1, '#ff3a3a'); x += w + 1; k++; }
      return c; }); };
  // 地面：水泥＋裂痕＋口香糖漬（64x64，會重複貼）
  P.gConcrete = function () { return memo('gcn', () => { const [c, g, R] = mk(64, 64); R(0, 0, 64, 64, '#34303a');
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const h = hsh(x, y, 11); if (h > 0.86) R(x, y, 1, 1, '#3e3a44'); else if (h < 0.1) R(x, y, 1, 1, '#2a2630'); }
      R(0, 0, 64, 1, '#2a2630'); R(0, 0, 1, 64, '#2a2630'); R(32, 0, 1, 64, '#2e2a34'); R(0, 32, 64, 1, '#2e2a34');
      let x = 10, y = 14; for (let k = 0; k < 22; k++) { x += hsh(k, 1, 4) > 0.5 ? 1 : 0; y += 1; R(x, y, 1, 1, '#221e28'); }
      for (let k = 0; k < 7; k++) R(hsh(k, 2, 4) * 62, hsh(k, 3, 4) * 62, 2, 1, '#45404c'); return c; }); };
  // 中央的球場地面（128x128）：油漆線、中圈、塗鴉 logo、油漬
  P.gCourt = function () { return memo('gct', () => { const [c, g, R] = mk(128, 128); R(0, 0, 128, 128, '#3a3442');
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const h = hsh(x, y, 21); if (h > 0.85) R(x, y, 1, 1, '#443e4c'); else if (h < 0.08) R(x, y, 1, 1, '#2e2a36'); }
      const L = '#d8d0c0'; R(6, 6, 116, 2, L); R(6, 120, 116, 2, L); R(6, 6, 2, 116, L); R(120, 6, 2, 116, L); R(6, 63, 116, 2, L);
      for (let a = 0; a < 200; a++) { const t = a / 200 * 6.283; R(64 + Math.cos(t) * 16, 64 + Math.sin(t) * 16, 2, 2, L); }
      for (let a = 0; a < 120; a++) { const t = a / 120 * Math.PI; R(64 + Math.cos(t) * 26, 8 + Math.sin(t) * 26, 2, 2, L); R(64 + Math.cos(t) * 26, 120 - Math.sin(t) * 26, 2, 2, L); }
      R(50, 8, 2, 30, L); R(76, 8, 2, 30, L); R(50, 38, 28, 2, L); R(50, 90, 2, 30, L); R(76, 90, 2, 30, L); R(50, 88, 28, 2, L);
      piece(R, 30, 50, 68, 28, 'BLOCK', 'wild', { seed: 77 });
      for (let k = 0; k < 5; k++) { const x = hsh(k, 9, 2) * 110 + 8, y = hsh(k, 9, 3) * 110 + 8; for (let j = 0; j < 14; j++) R(x + hsh(j, k, 1) * 8, y + hsh(j, k, 2) * 6, 2, 1, '#26222c'); }
      return c; }); };
})(typeof window !== 'undefined' ? window : globalThis);
