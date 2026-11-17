// 大富翁：恐怖系動畫的共用工具（煙霧雲層、底片顆粒、暗角、預先畫好的尖叫鬼臉）＋重做的「鬼門開」
// 做法：重的東西（雲、鬼臉）只在第一次畫進離屏 canvas，每一格只負責移動、縮放、疊色，手機也跑得動
(function (root) {
  const H = {};
  const rnd = (a, b) => a + Math.random() * (b - a);
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return [c, c.getContext('2d')]; };
  const ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
  const clamp = (k) => k < 0 ? 0 : k > 1 ? 1 : k;
  H.ease = ease; H.clamp = clamp; H.rnd = rnd; H.cvs = cvs;

  // ---------- 值雜訊（可無縫拼接）→ 雲／煙霧貼圖 ----------
  function fbm(size, oct, seed) {
    const out = new Float32Array(size * size); let s = seed || 1; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let o = 0; o < oct; o++) {
      const cells = 4 << o, grid = new Float32Array(cells * cells); for (let i = 0; i < grid.length; i++) grid[i] = R();
      const amp = Math.pow(0.55, o);
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const fx = x / size * cells, fy = y / size * cells, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
        const a = grid[(y0 % cells) * cells + x0 % cells], b = grid[(y0 % cells) * cells + (x0 + 1) % cells], c = grid[((y0 + 1) % cells) * cells + x0 % cells], d = grid[((y0 + 1) % cells) * cells + (x0 + 1) % cells];
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        out[y * size + x] += ((a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy) * amp;
      }
    }
    let mn = 9, mx = -9; for (const v of out) { mn = Math.min(mn, v); mx = Math.max(mx, v); } for (let i = 0; i < out.length; i++) out[i] = (out[i] - mn) / (mx - mn);
    return out;
  }
  const cache = {};
  // 煙霧：顏色 [r,g,b]、門檻 th（越高越稀疏）
  H.smoke = function (key, rgb, th, seed) {
    if (cache[key]) return cache[key];
    const N = 256, n = fbm(N, 5, seed || 7), [c, g] = cvs(N), im = g.createImageData(N, N);
    for (let i = 0; i < N * N; i++) { const v = Math.max(0, (n[i] - th) / (1 - th)); im.data[i * 4] = rgb[0] * (0.6 + v * 0.6); im.data[i * 4 + 1] = rgb[1] * (0.6 + v * 0.6); im.data[i * 4 + 2] = rgb[2] * (0.6 + v * 0.6); im.data[i * 4 + 3] = Math.min(255, v * 300); }
    g.putImageData(im, 0, 0); return (cache[key] = c);
  };
  // 一層會漂移的雲：平鋪貼圖並捲動
  H.cloudLayer = function (g, tex, W, Hh, scale, ox, oy, alpha, op) {
    const s = tex.width * scale; g.save(); g.globalAlpha = alpha; if (op) g.globalCompositeOperation = op;
    const x0 = ((ox % s) + s) % s - s, y0 = ((oy % s) + s) % s - s;
    for (let y = y0; y < Hh; y += s) for (let x = x0; x < W; x += s) g.drawImage(tex, x, y, s + 1, s + 1);
    g.restore();
  };
  // 底片顆粒＋暗角＋偶爾的閃爍，最後疊上去讓畫面像電影
  H.grain = function (g, W, Hh, amt) {
    if (!cache.grain) { const [c, gg] = cvs(160), im = gg.createImageData(160, 160); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } gg.putImageData(im, 0, 0); cache.grain = c; }
    g.save(); g.globalAlpha = amt || 0.08; g.globalCompositeOperation = 'overlay'; const ox = Math.random() * 160, oy = Math.random() * 160;
    for (let y = -oy; y < Hh; y += 320) for (let x = -ox; x < W; x += 320) g.drawImage(cache.grain, x, y, 320, 320);
    g.restore();
  };
  H.vignette = function (g, W, Hh, strength, col) {
    const r = Math.hypot(W, Hh) / 2, gr = g.createRadialGradient(W / 2, Hh / 2, r * 0.35, W / 2, Hh / 2, r);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, col || `rgba(0,0,0,${strength || 0.85})`); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
  };
  // 光芒：從一點往外放射的光束（加亮混合）
  H.rays = function (g, x, y, len, n, t, col, alpha, spread, dir) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const a = (dir == null ? -Math.PI / 2 : dir) + (i / (n - 1) - 0.5) * (spread || 2.2) + Math.sin(t * 0.7 + i * 1.7) * 0.03, w = 0.02 + (Math.sin(i * 12.9) * 0.5 + 0.5) * 0.05;
      const gr = g.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len); gr.addColorStop(0, col.replace('A', alpha * (0.6 + 0.4 * Math.sin(t * 2 + i)))); gr.addColorStop(1, col.replace('A', 0));
      g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a - w) * len, y + Math.sin(a - w) * len); g.lineTo(x + Math.cos(a + w) * len, y + Math.sin(a + w) * len); g.fill(); }
    g.restore();
  };
  // 火星／灰燼粒子
  H.embers = function (n) { return Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), v: rnd(0.05, 0.25), s: rnd(0.6, 2.2), w: rnd(0, 6.28) })); };
  H.drawEmbers = function (g, list, W, Hh, t, dpr, col, up) {
    g.save(); g.globalCompositeOperation = 'lighter';
    list.forEach(p => { const y = ((p.y - t * p.v * (up || 1)) % 1 + 1) % 1, x = p.x * W + Math.sin(t * 1.3 + p.w) * 30 * dpr, a = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + p.w));
      g.fillStyle = col.replace('A', a); g.beginPath(); g.arc(x, y * Hh, p.s * dpr, 0, 7); g.fill(); });
    g.restore();
  };

  // ---------- 預先畫好的尖叫鬼臉（像融化的頭骨，紅色系，參考動畫裡的牆面） ----------
  // 用很多半透明筆觸疊出來，看起來比較像手繪；回傳離屏 canvas
  H.face = function (v, size, hue) {
    const key = 'face' + v + ':' + size + ':' + (hue || 0); if (cache[key]) return cache[key];
    const S = size, [c, g] = cvs(S, Math.round(S * 1.6)); let sd = v * 97 + 3; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const cx = S / 2, top = S * 0.1, tilt = (R() - 0.5) * 0.25, stretch = 1.05 + R() * 0.35, jaw = 0.6 + R() * 0.5, droop = 0.15 + R() * 0.25, asym = (R() - 0.5) * 0.12;
    const col = (l, a) => `hsla(${hue || 0},${85 - l * 0.25}%,${l}%,${a})`;
    g.translate(cx, top + S * 0.6); g.rotate(tilt); g.translate(-cx, -(top + S * 0.6));
    const L = (y) => top + y * S * stretch; // 垂直位置（會被拉長）
    // 頭形：額頭圓、兩頰凹陷、下巴被嘴巴撐開往下拉
    const head = new Path2D(); head.moveTo(cx, top);
    head.bezierCurveTo(cx + S * 0.44, top, cx + S * 0.47, L(0.42), cx + S * 0.36, L(0.62)); head.bezierCurveTo(cx + S * 0.3, L(0.74), cx + S * 0.27, L(0.95), cx + S * 0.14, L(1.12));
    head.bezierCurveTo(cx + S * 0.06, L(1.2), cx - S * 0.06, L(1.2), cx - S * 0.14, L(1.12)); head.bezierCurveTo(cx - S * 0.27, L(0.95), cx - S * 0.3, L(0.74), cx - S * 0.36, L(0.62));
    head.bezierCurveTo(cx - S * 0.47, L(0.42), cx - S * 0.44, top, cx, top);
    const gr = g.createRadialGradient(cx - S * 0.08, L(0.3), S * 0.04, cx, L(0.6), S * 0.8); gr.addColorStop(0, col(42, 1)); gr.addColorStop(0.45, col(24, 1)); gr.addColorStop(1, col(5, 1));
    g.fillStyle = gr; g.fill(head);
    g.save(); g.clip(head);
    // 底層：往下流的暗色筆觸
    g.lineCap = 'round';
    for (let i = 0; i < 90; i++) { const x = cx + (R() - 0.5) * S * 0.95, y = top + R() * S * 1.3 * stretch, l = S * (0.1 + R() * 0.35); g.strokeStyle = col(3 + R() * 10, 0.28); g.lineWidth = S * (0.012 + R() * 0.03); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - 0.5) * S * 0.06, y + l / 2, x + (R() - 0.5) * S * 0.04, y + l); g.stroke(); }
    // 骨頭的稜線用亮紅筆觸勾出來（眉骨、顴骨、下顎、太陽穴）
    const ridge = (pts, w, l, a) => { g.strokeStyle = col(l, a * 0.55); g.lineWidth = S * w * (0.4 + R() * 0.4); g.setLineDash([S * (0.03 + R() * 0.08), S * (0.01 + R() * 0.04)]); g.lineDashOffset = R() * S; g.beginPath(); const o = () => (R() - 0.5) * 0.025; g.moveTo(cx + (pts[0] + o()) * S, L(pts[1] + o())); for (let k = 2; k < pts.length; k += 4) g.quadraticCurveTo(cx + (pts[k] + o()) * S, L(pts[k + 1] + o()), cx + (pts[k + 2] + o()) * S, L(pts[k + 3] + o())); g.stroke(); g.setLineDash([]); };
    for (let rep = 0; rep < 5; rep++) { const j = () => (R() - 0.5) * 0.02;
            [-1, 1].forEach(sx => {
        ridge([sx * 0.04, 0.27, sx * 0.17, 0.2 + j(), sx * 0.32, 0.3], 0.028, 36 + rep * 3, 0.45);          // 眉骨
        ridge([sx * 0.33, 0.47, sx * 0.3, 0.6, sx * 0.2, 0.66 + j()], 0.032, 38 + rep * 3, 0.45);           // 顴骨
        ridge([sx * 0.27, 0.78, sx * 0.24, 0.98, sx * 0.1, 1.1], 0.022, 32 + rep * 3, 0.4);               // 下顎
        ridge([sx * 0.4, 0.2, sx * 0.43, 0.35, sx * 0.39, 0.5], 0.02, 45, 0.4);                             // 太陽穴
      }); }
    g.restore();
    // 眼窩：往外下垂的淚滴形黑洞（痛苦的表情），邊緣暈開
    [-1, 1].forEach(sx => { const ex = cx + sx * S * 0.15 + asym * S, ey = L(0.39);
      const sh = g.createRadialGradient(ex, ey, 0, ex, ey, S * 0.24); sh.addColorStop(0, 'rgba(0,0,0,.7)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.beginPath(); g.arc(ex, ey, S * 0.24, 0, 7); g.fill();
      const p = new Path2D(); p.moveTo(ex - sx * S * 0.09, ey - S * 0.03); p.bezierCurveTo(ex - sx * S * 0.02, ey - S * 0.12, ex + sx * S * 0.12, ey - S * 0.06, ex + sx * S * 0.1, ey + S * (0.07 + droop * 0.2));
      p.bezierCurveTo(ex + sx * S * 0.09, ey + S * (0.17 + droop * 0.3), ex - sx * S * 0.05, ey + S * 0.14, ex - sx * S * 0.09, ey - S * 0.03);
      g.save(); g.shadowColor = 'rgba(0,0,0,1)'; g.shadowBlur = S * 0.08; g.fillStyle = '#000'; g.fill(p); g.fill(p); g.restore();
      });
    [-1, 1].forEach(sx => { const hx = cx + sx * S * 0.22, hy = L(0.74), hg = g.createRadialGradient(hx, hy, 0, hx, hy, S * 0.16); hg.addColorStop(0, 'rgba(0,0,0,.55)'); hg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = hg; g.beginPath(); g.ellipse(hx, hy, S * 0.12, S * 0.2, 0, 0, 7); g.fill(); });
    // 鼻子：兩道細縫
    g.fillStyle = 'rgba(0,0,0,.95)'; [-1, 1].forEach(sx => { g.beginPath(); g.ellipse(cx + sx * S * 0.03, L(0.6), S * 0.013, S * 0.04, sx * 0.4, 0, 7); g.fill(); });
    // 嘴：又長又歪的黑洞，嘴唇有一圈亮紅筆觸
    const my = L(0.86), mh = S * (0.15 + jaw * 0.12), mw = S * (0.08 + jaw * 0.03);
    const m = new Path2D(); m.moveTo(cx - mw + asym * S, my - mh * 0.55); m.bezierCurveTo(cx - mw * 0.3, my - mh * 0.85, cx + mw * 0.6, my - mh * 0.7, cx + mw + asym * S, my - mh * 0.4);
    m.bezierCurveTo(cx + mw * 1.2, my + mh * 0.4, cx + mw * 0.3, my + mh * 0.9, cx - mw * 0.2, my + mh * 0.85); m.bezierCurveTo(cx - mw * 1.1, my + mh * 0.6, cx - mw * 1.25, my, cx - mw + asym * S, my - mh * 0.55);
    g.save(); g.shadowColor = '#000'; g.shadowBlur = S * 0.06; g.fillStyle = '#000'; g.fill(m); g.fill(m); g.restore();
    
    // 下巴往下融化滴落
    for (let i = 0; i < 9; i++) { const x = cx + (R() - 0.5) * S * 0.3, y0 = L(1.05); g.strokeStyle = col(8 + R() * 14, 0.7); g.lineWidth = S * (0.015 + R() * 0.025); g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (R() - 0.5) * S * 0.03, y0 + S * (0.08 + R() * 0.3)); g.stroke(); }
    return (cache[key] = c);
  };

  // ---------- 中式城門剪影（牌樓＋燕尾屋頂＋門板，門可以打開） ----------
  H.gate = function (g, cx, base, w, open, t, glow, U) {
    const h = w * 1.05, dw = w * 0.36, dh = h * 0.56;
    // 門洞裡的光
    if (open > 0) { const gr = g.createRadialGradient(cx, base - dh * 0.4, 0, cx, base - dh * 0.4, dw * 2.4); gr.addColorStop(0, `rgba(255,236,190,${glow})`); gr.addColorStop(0.25, `rgba(255,120,40,${glow * 0.85})`); gr.addColorStop(1, 'rgba(120,0,0,0)');
      g.fillStyle = gr; g.fillRect(cx - dw * 2.4, base - dh * 2.5, dw * 4.8, dh * 2.5); }
    g.fillStyle = '#070303';
    // 主體牆與柱
    g.fillRect(cx - w / 2, base - h * 0.66, w, h * 0.66);
    // 兩層屋頂，屋簷兩端往上翹
    const roof = (y, rw, rh) => { g.beginPath(); g.moveTo(cx - rw / 2 - rw * 0.08, y - rh * 0.55); g.quadraticCurveTo(cx - rw * 0.35, y + rh * 0.05, cx - rw * 0.3, y); g.lineTo(cx + rw * 0.3, y); g.quadraticCurveTo(cx + rw * 0.35, y + rh * 0.05, cx + rw / 2 + rw * 0.08, y - rh * 0.55);
      g.quadraticCurveTo(cx + rw * 0.3, y - rh * 0.3, cx + rw * 0.18, y - rh); g.lineTo(cx - rw * 0.18, y - rh); g.quadraticCurveTo(cx - rw * 0.3, y - rh * 0.3, cx - rw / 2 - rw * 0.08, y - rh * 0.55); g.fill();
      for (let k = -1; k <= 1; k += 2) { g.beginPath(); g.moveTo(cx + k * rw * 0.18, y - rh); g.quadraticCurveTo(cx + k * rw * 0.26, y - rh * 1.3, cx + k * rw * 0.3, y - rh * 1.55); g.lineTo(cx + k * rw * 0.22, y - rh * 1.05); g.fill(); } };
    roof(base - h * 0.64, w * 1.25, h * 0.16); g.fillRect(cx - w * 0.36, base - h * 0.95, w * 0.72, h * 0.18); roof(base - h * 0.93, w * 0.85, h * 0.14);
    // 匾額「鬼門關」
    g.fillStyle = '#1a0606'; g.fillRect(cx - w * 0.17, base - h * 0.86, w * 0.34, h * 0.075);
    g.font = `900 ${Math.round(h * 0.052)}px "Songti TC","Noto Serif TC","Noto Serif CJK TC",serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = `rgba(220,160,70,${0.35 + glow * 0.5})`; g.fillText('鬼　門　關', cx, base - h * 0.822);
    // 門洞（打開時是亮的）＋兩扇門板往內轉
    g.save(); g.beginPath(); g.rect(cx - dw, base - dh, dw * 2, dh); g.clip();
    if (open > 0) { const lg = g.createRadialGradient(cx, base - dh * 0.35, 0, cx, base - dh * 0.35, dh * 0.9); lg.addColorStop(0, `rgba(255,248,220,${glow})`); lg.addColorStop(0.35, `rgba(255,170,70,${glow})`); lg.addColorStop(1, `rgba(150,20,5,${glow})`); g.fillStyle = lg; g.fillRect(cx - dw, base - dh, dw * 2, dh);
      g.globalCompositeOperation = 'multiply'; H.cloudLayer(g, H.smoke('fog', [70, 20, 18], 0.45, 5), cx + dw, base, 1.2, cx - dw - t * 40, base - dh + t * -30, 0.55 * glow, 'multiply'); g.globalCompositeOperation = 'source-over'; }
    [-1, 1].forEach(sd => { const ang = open * 1.35, ww = dw * Math.cos(ang); g.fillStyle = '#1c0505'; const x0 = sd < 0 ? cx - dw : cx + dw - ww; g.fillRect(x0, base - dh, ww, dh);
      g.fillStyle = `rgba(200,140,50,${0.25 + (1 - open) * 0.3})`; for (let r = 0; r < 8; r++) for (let q = 0; q < 4; q++) { g.beginPath(); g.arc(x0 + (q + 0.5) / 4 * ww, base - dh + (r + 0.6) / 8.4 * dh, Math.max(0.5, dw * 0.03 * Math.cos(ang)), 0, 7); g.fill(); }
      // 門上的封條符咒
      if (open < 0.3) { g.fillStyle = `rgba(230,200,90,${0.9 - open * 3})`; g.fillRect(cx - dw * 0.08 + sd * dw * 0.04, base - dh * 0.8, dw * 0.08, dh * 0.5); g.fillStyle = `rgba(150,0,0,${0.9 - open * 3})`; g.fillRect(cx - dw * 0.06 + sd * dw * 0.04, base - dh * 0.7, dw * 0.04, dh * 0.3); } });
    g.restore();
    // 兩側石獅剪影＋燈籠
    [-1, 1].forEach(sd => { g.fillStyle = '#060202'; const lx = cx + sd * w * 0.62; g.beginPath(); g.ellipse(lx, base - h * 0.08, w * 0.07, h * 0.08, 0, 0, 7); g.fill(); g.fillRect(lx - w * 0.06, base - h * 0.05, w * 0.12, h * 0.05);
      const fl = 0.6 + Math.sin(t * 13 + sd) * 0.15 + Math.sin(t * 31) * 0.1; const lgx = cx + sd * w * 0.44, lgy = base - h * 0.52;
      const lgr = g.createRadialGradient(lgx, lgy, 0, lgx, lgy, w * 0.16); lgr.addColorStop(0, `rgba(255,90,40,${0.55 * fl})`); lgr.addColorStop(1, 'rgba(255,40,0,0)'); g.fillStyle = lgr; g.fillRect(lgx - w * 0.2, lgy - w * 0.2, w * 0.4, w * 0.4);
      g.fillStyle = `rgba(200,30,20,${0.8 * fl + 0.2})`; g.beginPath(); g.ellipse(lgx, lgy, w * 0.035, w * 0.045, 0, 0, 7); g.fill(); });
    return { doorX: cx, doorY: base - dh * 0.45, dw, dh };
  };

  // 天空中的巨大牛角惡鬼剪影：有毛邊的肩膀、往下長的羊頭吻部、彎曲漸細的角、垂下的長毛
  // 形狀只算一次（固定亂數），每一格只做輕微呼吸起伏
  function furOutline(pts, seed, len) { // 沿著折線每一小段長出一根往外的毛
    let sd = seed; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647; const out = [];
    for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 9));
      const nx = (y1 - y0), ny = -(x1 - x0), nl = Math.hypot(nx, ny) || 1;
      for (let q = 0; q < n; q++) { const u = q / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u, l = len * (0.3 + R()); out.push([x, y]); out.push([x + nx / nl * l + (R() - 0.5) * 6, y + ny / nl * l + l * 0.5]); } }
    return out;
  }
  H.furOutline = furOutline;
  let demonPath = null;
  function buildDemon() {
    const P = new Path2D();
    // 外輪廓（順時針）：左肩 → 頭頂 → 右肩 → 下方
    const body = [[-360, 430], [-330, 300], [-270, 190], [-200, 120], [-120, 70], [-80, 20], [-70, -50], [-40, -90], [0, -98], [40, -90], [70, -50], [80, 20], [120, 70], [200, 120], [270, 190], [330, 300], [360, 430]];
    const fur = furOutline(body, 41, 26); P.moveTo(fur[0][0], fur[0][1]); fur.forEach(([x, y]) => P.lineTo(x, y)); P.lineTo(360, 460); P.lineTo(-360, 460); P.closePath();
    // 吻部：從臉往下變窄，像羊或牛的長臉
    const sn = new Path2D(); sn.moveTo(-52, 20); sn.bezierCurveTo(-50, 70, -30, 120, -14, 150); sn.quadraticCurveTo(0, 162, 14, 150); sn.bezierCurveTo(30, 120, 50, 70, 52, 20); sn.closePath();
    // 角：漸細、往外再往上彎
    const horn = (sd) => { const h = new Path2D(); h.moveTo(sd * 15, -55); h.bezierCurveTo(sd * 90, -175, sd * 240, -195, sd * 312, -112); h.bezierCurveTo(sd * 350, -62, sd * 340, -2, sd * 305, 30); h.bezierCurveTo(sd * 312, -28, sd * 292, -66, sd * 245, -88); h.bezierCurveTo(sd * 175, -112, sd * 112, -66, sd * 85, -5); h.closePath(); return h; };
    // 垂下的長毛
    const hair = []; let sd = 77; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 26; k++) { const x0 = (R() - 0.5) * 130, y0 = -40 + R() * 70, len = 80 + R() * 170, dx = (x0 > 0 ? 1 : -1) * (40 + R() * 160); hair.push([x0, y0, dx, len, 2 + R() * 6]); }
    demonPath = { P, sn, hl: horn(-1), hr: horn(1), hair };
  }
  // 整隻先畫進一張不透明的離屏圖（避免各部位半透明重疊出深淺不一），每格再整張淡入
  let demonImg = null;
  function demonSprite() {
    if (demonImg) return demonImg; if (!demonPath) buildDemon(); const D = demonPath, parts = [D.hl, D.hr, D.P, D.sn];
    const SC = 1.2, Wd = Math.round(800 * SC), Hd = Math.round(680 * SC), base = (g) => g.setTransform(SC, 0, 0, SC, 400 * SC, 210 * SC);
    // 1. 細節層：實心剪影＋毛流＋角的環紋＋吻部亮面，最後用剪影遮罩切乾淨
    const [dc, d] = cvs(Wd, Hd); base(d); d.fillStyle = '#140303'; parts.forEach(p => d.fill(p));
    let sd = 9; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647; d.lineCap = 'round';
    for (let k = 0; k < 900; k++) { const x = (R() - 0.5) * 720, y = -90 + R() * 540, l = 8 + R() * 16, dir = x > 0 ? 0.35 : -0.35; d.strokeStyle = R() < 0.5 ? 'rgba(42,10,8,.55)' : 'rgba(6,1,1,.6)'; d.lineWidth = 1.2 + R() * 1.6; d.beginPath(); d.moveTo(x, y); d.lineTo(x + dir * l, y + l); d.stroke(); }
    [D.hl, D.hr].forEach((hp, h) => { const q = h ? 1 : -1; d.save(); d.clip(hp); d.fillStyle = '#1e0605'; d.fill(hp); d.strokeStyle = 'rgba(0,0,0,.6)'; d.lineWidth = 3; for (let k = 0; k < 16; k++) { const u = k / 16; d.beginPath(); d.arc(q * (50 + u * 270), -70 - Math.sin(u * Math.PI) * 85 + u * 60, 52 - u * 30, 0, 7); d.stroke(); } d.restore(); });
    const sg = d.createLinearGradient(-50, 40, 50, 40); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(0.5, 'rgba(95,26,14,.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = sg; d.fill(D.sn);
    d.fillStyle = 'rgba(255,90,30,.35)'; [-1, 1].forEach(q => { d.beginPath(); d.ellipse(q * 9, 140, 4, 6, q * 0.3, 0, 7); d.fill(); });
    const [mc, m] = cvs(Wd, Hd); base(m); m.fillStyle = '#000'; parts.forEach(p => m.fill(p));
    d.setTransform(1, 0, 0, 1, 0, 0); d.globalCompositeOperation = 'destination-in'; d.drawImage(mc, 0, 0); d.globalCompositeOperation = 'source-over';
    // 2. 成品：先畫一次外緣火光（只用陰影），再把細節層蓋上去
    const [c, g] = cvs(Wd, Hd); g.shadowColor = 'rgba(255,110,30,.85)'; g.shadowBlur = 40; g.drawImage(mc, 0, 0); g.shadowBlur = 0; g.drawImage(dc, 0, 0);
    return (demonImg = { c, SC });
  }
  H.horned = function (g, cx, cy, s, a, t) {
    if (a <= 0) return; const { c, SC } = demonSprite();
    g.save(); g.translate(cx, cy + Math.sin(t * 0.8) * 4 * s); g.scale(s * (1 + Math.sin(t * 0.8) * 0.006), s);
    g.globalAlpha = a; g.drawImage(c, -400, -210, c.width / SC, c.height / SC);
    const eo = (0.65 + Math.sin(t * 5) * 0.2) * a; g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
    [-1, 1].forEach(sd => { const gr = g.createRadialGradient(sd * 30, 8, 0, sd * 30, 8, 46); gr.addColorStop(0, `rgba(255,240,180,${eo})`); gr.addColorStop(0.2, `rgba(255,80,20,${eo * 0.9})`); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(sd * 30 - 46, -38, 92, 92);
      g.fillStyle = `rgba(255,225,160,${eo})`; g.beginPath(); g.moveTo(sd * 12, 4); g.quadraticCurveTo(sd * 30, -8, sd * 48, 2); g.quadraticCurveTo(sd * 30, 12, sd * 12, 4); g.fill(); });
    g.restore();
  };

  // ======================= 鬼門開（重做） =======================
  // 0~1.3 秒：紅黑色的天、城門剪影、一個小小的人站在門前；鏡頭慢慢推進
  // 1.3~2.6 秒：符咒剝落、門往內打開，光爆出來；天上的牛角惡鬼從煙裡浮現
  // 2.6~4.3 秒：一整片尖叫的鬼臉從門裡湧出來衝向鏡頭，畫面被紅色臉牆淹沒
  // 4.3~5.2 秒：一張臉直接撲到眼前＋尖叫，閃白，字幕
  H.ghostGate = function (ui, SFX, opt) {
    const faces = Array.from({ length: 8 }, (_, i) => i);
    const torrent = Array.from({ length: 70 }, (_, i) => ({ f: i % 8, a: rnd(-1, 1), d: rnd(0, 1), s: rnd(0.7, 1.3), r: rnd(-0.4, 0.4), w: rnd(0, 6) }));
    const wall = Array.from({ length: 46 }, (_, i) => ({ f: i % 8, x: rnd(-0.1, 1.1), y: rnd(-0.1, 1.1), s: rnd(0.8, 1.4), r: rnd(-0.5, 0.5), w: rnd(0, 6) }));
    const emb = H.embers(110), paper = Array.from({ length: 16 }, () => ({ x: rnd(0, 1), y: rnd(0, 1), r: rnd(0, 6), v: rnd(0.1, 0.35) }));
    const sky1 = H.smoke('sky1b', [230, 80, 30], 0.3, 11), sky2 = H.smoke('sky2', [40, 4, 4], 0.35, 23), fog = H.smoke('fog', [70, 20, 18], 0.45, 5);
    let ready = false;
    const snd = () => { if (!SFX) return; const T = SFX.tone, N = SFX.noise;
      // 低頻：兩個差一點點的音互相拍頻，聽起來像在呼吸
      T(36.7, 5.2, { type: 'sawtooth', vol: 0.07, lp: 160, attack: 0.6 }); T(38.1, 5.2, { type: 'sawtooth', vol: 0.06, lp: 160, attack: 0.6 }); T(73.4, 4.2, { type: 'sine', vol: 0.05, attack: 1.2 });
      // 遠處走音的廟鐘
      [0.15, 1.15].forEach((d, i) => { T(196 - i * 9, 3.2, { type: 'sine', vol: 0.05, detune: -35, delay: d }); T(523 - i * 20, 2.4, { type: 'sine', vol: 0.025, detune: 18, delay: d }); });
      // 人群的耳語（很多窄頻雜訊）
      for (let i = 0; i < 40; i++) N(0.25 + Math.random() * 0.4, { f: 700 + Math.random() * 2600, type: 'bandpass', q: 14, vol: 0.035 + i * 0.0012, delay: 0.3 + i * 0.07 });
      // 門板吱嘎：好幾段鋸齒音忽高忽低
      for (let i = 0; i < 9; i++) T(110 + Math.random() * 90, 0.18, { type: 'sawtooth', glide: 70 + Math.random() * 60, vol: 0.05, lp: 1300, delay: 1.3 + i * 0.13 });
      N(0.5, { f: 180, vol: 0.12, delay: 2.5 });
      // 不和諧的合唱慢慢變大
      [311, 329.6, 349, 466, 493.9].forEach((f, i) => T(f, 2.6, { type: 'sine', vol: 0.022, attack: 1.4, delay: 1.6 + i * 0.05 }));
      // 鬼臉湧出：一層一層的哀嚎
      for (let i = 0; i < 18; i++) { const f = 500 + Math.random() * 900; T(f, 0.7 + Math.random() * 0.6, { type: i % 2 ? 'sawtooth' : 'square', glide: f * (0.55 + Math.random() * 0.3), vol: 0.018 + i * 0.002, lp: 2600, delay: 2.5 + i * 0.1 }); }
      N(1.8, { f: 1800, type: 'bandpass', q: 1, vol: 0.06, attack: 1.0, delay: 2.6 });
      // 撲臉尖叫
      [1300, 1390, 1820, 2260].forEach((f, i) => T(f, 0.9, { type: i % 2 ? 'square' : 'sawtooth', glide: f * 1.25, vol: 0.06, lp: 6000, attack: 0.01, delay: 4.32 }));
      N(0.8, { f: 2500, type: 'highpass', vol: 0.12, delay: 4.32 }); T(55, 0.6, { glide: 30, vol: 0.2, wet: false, delay: 4.32 });
    };
    return ui.overlay(5400, (g, W, Hh, dpr, t) => {
      if (!ready) { faces.forEach(f => H.face(f, 180, 0)); ready = true; }
      const U = Math.min(W, Hh) / 420, cx = W / 2;
      const push = 1 + ease(t / 2.6) * 0.18 + (t > 2.6 ? (t - 2.6) * 0.05 : 0), shakeA = t > 1.3 && t < 1.7 ? 6 : t > 2.6 && t < 4.3 ? 3 + (t - 2.6) * 3 : t > 4.3 && t < 4.7 ? 18 : 0;
      g.fillStyle = '#050101'; g.fillRect(0, 0, W, Hh);
      g.save(); g.translate(W / 2 + rnd(-shakeA, shakeA) * dpr, Hh * 0.62 + rnd(-shakeA, shakeA) * dpr); g.scale(push, push); g.translate(-W / 2, -Hh * 0.62);
      // 天空：兩層雲往不同方向漂
      const sg = g.createLinearGradient(0, 0, 0, Hh); sg.addColorStop(0, '#2a0404'); sg.addColorStop(0.18, '#8a1d0c'); sg.addColorStop(0.32, '#e0581c'); sg.addColorStop(0.5, '#9a2a10'); sg.addColorStop(0.75, '#c2401a'); sg.addColorStop(1, '#2a0505'); g.fillStyle = sg; g.fillRect(-W * 0.2, -Hh * 0.2, W * 1.4, Hh * 1.4);
      H.cloudLayer(g, sky1, W * 1.3, Hh, 3.2 * U, -W * 0.15 + t * 22 * U, t * -6 * U, 0.9);
      H.cloudLayer(g, sky2, W * 1.3, Hh, 2.2 * U, -W * 0.15 - t * 35 * U, t * 4 * U, 0.5);
      // 牛角惡鬼
      H.horned(g, cx, Hh * 0.3, 0.6 * U * (1 + ease((t - 1.2) / 3) * 0.12), ease((t - 1.0) / 1.6) * 0.95, t);
      H.cloudLayer(g, sky2, W * 1.3, Hh, 1.6 * U, -W * 0.15 + t * 50 * U, 0, 0.22);
      // 遠景的城牆與塔剪影
      g.fillStyle = '#0b0202'; g.beginPath(); g.moveTo(-W * 0.2, Hh); for (let i = 0; i <= 14; i++) { const x = -W * 0.2 + i / 14 * W * 1.4, h2 = Hh * (0.28 + ((i * 37) % 7) / 40 + (i === 3 || i === 11 ? 0.12 : 0)); g.lineTo(x, Hh - h2); g.lineTo(x + W * 0.05, Hh - h2); } g.lineTo(W * 1.2, Hh); g.fill();
      // 城門
      const open = ease((t - 1.3) / 1.3), glow = Math.min(1, open * 1.3) * (0.85 + Math.sin(t * 9) * 0.1);
      const gw = W * 0.62, base = Hh * 0.9; const gp = H.gate(g, cx, base, gw, open, t, glow, U);
      if (open > 0.05) H.rays(g, gp.doorX, gp.doorY, Hh * 0.9, 13, t, 'rgba(255,170,90,A)', 0.35 * open, 1.9, -Math.PI / 2);
      // 站在門前的小人影（玩家）
      g.fillStyle = '#020000'; const px = cx, py = base; g.beginPath(); g.ellipse(px, py - 46 * U, 7 * U, 8 * U, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(px - 10 * U, py - 38 * U); g.lineTo(px + 10 * U, py - 38 * U); g.lineTo(px + 13 * U, py); g.lineTo(px - 13 * U, py); g.fill();
      // 鬼臉湧出：從門洞中心往鏡頭衝
      if (t > 2.4) { const k = t - 2.4; torrent.forEach(p => { const z = (k * 0.42 + p.d) % 1.0001; if (k * 0.42 + p.d < 1 && k < 0.2 + p.d * 2) return;
        const sc = (0.05 + z * z * 1.6) * p.s * U, x = gp.doorX + p.a * z * z * W * 0.9 + Math.sin(t * 3 + p.w) * 12 * U * z, y = gp.doorY - z * z * Hh * 0.35;
        const im = H.face(p.f, 180, 0); g.save(); g.globalAlpha = Math.min(1, z * 3) * (z > 0.92 ? (1 - z) * 12 : 1); g.translate(x, y); g.rotate(p.r + Math.sin(t * 2 + p.w) * 0.15); g.drawImage(im, -im.width * sc / 2, -im.height * sc / 2, im.width * sc, im.height * sc); g.restore(); }); }
      // 地面的霧
      H.cloudLayer(g, fog, W * 1.3, Hh * 1.1, 2.4 * U, -W * 0.15 + t * 30 * U, Hh * 0.62, 0.5);
      H.drawEmbers(g, emb, W, Hh, t, dpr, 'rgba(255,150,60,A)', 1);
      // 冥紙
      if (t > 1.5) paper.forEach(p => { const y = ((p.y - (t - 1.5) * p.v) % 1 + 1) % 1; g.save(); g.translate(p.x * W + Math.sin(t * 2 + p.r) * 30 * U, y * Hh); g.rotate(t * 3 + p.r); g.scale(1, Math.sin(t * 5 + p.r)); g.fillStyle = 'rgba(160,120,60,.6)'; g.fillRect(-7 * U, -5 * U, 14 * U, 10 * U); g.fillStyle = 'rgba(120,60,20,.7)'; g.fillRect(-3 * U, -2 * U, 6 * U, 4 * U); g.restore(); });
      g.restore();
      // 臉牆淹沒整個畫面
      if (t > 3.3) { const k = ease((t - 3.3) / 1.0); wall.forEach(p => { const im = H.face(p.f, 180, 0), sc = p.s * U * 1.25 * (0.6 + k * 0.6) * (1 + Math.sin(t * 4 + p.w) * 0.04);
        g.save(); g.globalAlpha = k * 0.95; g.translate(p.x * W + Math.sin(t * 1.5 + p.w) * 10 * U, p.y * Hh + Math.cos(t * 1.2 + p.w) * 10 * U); g.rotate(p.r); g.drawImage(im, -im.width * sc / 2, -im.height * sc / 2, im.width * sc, im.height * sc); g.restore(); });
        g.fillStyle = `rgba(90,0,0,${k * 0.25})`; g.globalCompositeOperation = 'multiply'; g.fillRect(0, 0, W, Hh); g.globalCompositeOperation = 'source-over'; }
      // 撲臉
      if (t > 4.3) { const k = clamp((t - 4.3) / 0.35), im = H.face(3, 180, 0), sc = (0.6 + ease(k) * 5) * U * 1.6;
        g.save(); g.translate(W / 2 + rnd(-8, 8) * dpr, Hh * 0.5); g.drawImage(im, -im.width * sc / 2, -im.height * sc * 0.55, im.width * sc, im.height * sc);
        [-1, 1].forEach(sx => { const ex = sx * 0.16 * 180 * sc, ey = (0.1 * 180 + 0.38 * 180 * 1.1) * sc - im.height * sc * 0.55 + 4 * sc; g.fillStyle = 'rgba(255,240,220,.95)'; g.shadowColor = '#ff3a1a'; g.shadowBlur = 20 * dpr; g.beginPath(); g.arc(ex, ey, 2.2 * sc, 0, 7); g.fill(); });
        g.restore();
        if (t > 4.55 && t < 4.72) { g.fillStyle = 'rgba(255,240,235,.92)'; g.fillRect(0, 0, W, Hh); } }
      H.vignette(g, W, Hh, 0.9);
      H.grain(g, W, Hh, 0.12);
      if (Math.random() < 0.04) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, Hh); }
      // 字
      const tt = (txt, y, px, col, a) => { g.save(); g.globalAlpha = a; g.font = `900 ${Math.round(px * dpr)}px "Songti TC","Noto Serif TC","Noto Serif CJK TC",serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#000'; g.shadowBlur = 14 * dpr; g.fillStyle = col; g.fillText(txt, W / 2, y); g.restore(); };
      tt('鬼　門　開', Hh * 0.1, 40, '#e8d0b0', ease(t / 0.8) * (t > 4.2 ? Math.max(0, 1 - (t - 4.2) * 4) : 1));
      if (t > 4.75) { g.fillStyle = `rgba(0,0,0,${clamp((t - 4.75) * 3) * 0.75})`; g.fillRect(0, 0, W, Hh); tt('好兄弟湧進你家，搬走三成功德', Hh * 0.5, 22, '#ffb8a0', clamp((t - 4.8) * 4)); }
    }, snd);
  };

  root.MONO_HORROR = H;
})(typeof window !== 'undefined' ? window : globalThis);

// ======================= 多眼鳥夜啼（重做） =======================
(function (root) {
  const H = root.MONO_HORROR, { cvs, rnd, ease, clamp } = H;
  // 側面的大烏鴉（嘴往左上張開）：羽毛一片一片疊出來，先畫成一張離屏圖
  let crow = null;
  const EYES = [ // 眼睛位置（在 600×820 的烏鴉圖上）＋大小
    [312, 190, 26], [372, 170, 16], [282, 262, 15], [350, 290, 22], [410, 262, 14], [300, 360, 15], [392, 352, 19], [452, 318, 13], [340, 420, 17], [430, 410, 15],
    [280, 455, 13], [384, 478, 18], [470, 470, 14], [330, 530, 14], [420, 548, 16], [500, 520, 12], [262, 560, 12], [370, 610, 15], [470, 620, 13], [300, 660, 12], [410, 690, 14], [520, 680, 12]];
  function crowSprite() {
    if (crow) return crow; const Wc = 600, Hc = 820, [c, g] = cvs(Wc, Hc);
    // 外輪廓：頭頂圓、後頸往下、喉嚨是一撮撮尖尖的蓑羽
    const back = [[262, 168], [300, 126], [350, 108], [405, 116], [446, 150], [462, 200], [456, 262], [470, 320], [520, 400], [565, 520], [590, 660], [600, 820]];
    const front = [[150, 820], [175, 690], [195, 600], [205, 520], [212, 450], [222, 380], [232, 320], [244, 268]];
    const fb = H.furOutline(back, 3, 10), ff = H.furOutline(front, 8, 26);
    const body = new Path2D(); body.moveTo(fb[0][0], fb[0][1]); fb.forEach(([x, y]) => body.lineTo(x, y)); body.lineTo(600, 820); ff.forEach(([x, y]) => body.lineTo(x, y)); body.lineTo(252, 238); body.closePath();
    // 嘴喙：根部很寬、直接長在額頭上
    const upper = new Path2D(); upper.moveTo(270, 160); upper.bezierCurveTo(215, 128, 120, 72, 36, 50); upper.bezierCurveTo(64, 72, 120, 112, 160, 146); upper.bezierCurveTo(190, 172, 222, 202, 250, 226); upper.closePath();
    const lower = new Path2D(); lower.moveTo(250, 240); lower.bezierCurveTo(205, 214, 140, 178, 66, 140); lower.bezierCurveTo(118, 186, 180, 240, 246, 282); lower.closePath();
    g.fillStyle = '#3a0a1c'; g.beginPath(); g.moveTo(252, 228); g.lineTo(150, 150); g.lineTo(90, 128); g.lineTo(120, 162); g.lineTo(248, 246); g.fill();
    // 羽毛：隨機撒、由下往上畫（上面的蓋住下面），方向順著身體往右下
    g.save(); g.clip(body); g.fillStyle = '#120c18'; g.fillRect(0, 0, Wc, Hc);
    let sd = 5; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647; const fs = [];
    for (let k = 0; k < 2600; k++) fs.push([140 + R() * 470, 100 + R() * 730, R(), R(), R()]); fs.sort((a, b) => b[1] - a[1]);
    fs.forEach(([x, y, r1, r2, r3]) => { const sz = 7 + (y / Hc) * 22 + r1 * 8, l = 9 + r2 * 24, hue = 258 + r3 * 34;
      g.fillStyle = `hsl(${hue},${20 + r1 * 25}%,${l}%)`; g.save(); g.translate(x, y); g.rotate(0.35 + (r2 - 0.5) * 0.6 - (x < 260 ? 0.4 : 0));
      g.beginPath(); g.moveTo(0, -sz); g.bezierCurveTo(sz * 0.6, -sz * 0.4, sz * 0.35, sz * 0.5, 0, sz * 0.9); g.bezierCurveTo(-sz * 0.35, sz * 0.5, -sz * 0.6, -sz * 0.4, 0, -sz); g.fill();
      g.strokeStyle = `hsla(${hue},45%,${l + 20}%,.45)`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -sz * 0.85); g.lineTo(0, sz * 0.7); g.stroke(); g.restore(); });
    // 收起來的翅膀：大片、顏色更深的飛羽，邊緣一片片
    const wing = new Path2D(); wing.moveTo(400, 420); wing.bezierCurveTo(470, 400, 560, 470, 600, 560); wing.lineTo(600, 820); wing.lineTo(380, 820); wing.bezierCurveTo(360, 680, 360, 520, 400, 420);
    g.save(); g.clip(wing); g.fillStyle = '#0e0914'; g.fillRect(300, 380, 320, 460);
    for (let row = 0; row < 7; row++) for (let k = 0; k < 9; k++) { const x = 370 + k * 28 + row * 6, y = 440 + row * 58 + k * 10, l = 14 + R() * 16; g.fillStyle = `hsl(${262 + R() * 20},${25 + R() * 15}%,${l}%)`; g.save(); g.translate(x, y); g.rotate(0.55);
      g.beginPath(); g.moveTo(0, -30); g.quadraticCurveTo(16, 0, 4, 70); g.quadraticCurveTo(-4, 74, -10, 60); g.quadraticCurveTo(-14, 0, 0, -30); g.fill(); g.strokeStyle = 'rgba(190,150,230,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -26); g.lineTo(-2, 64); g.stroke(); g.restore(); }
    g.restore(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(400, 420); g.bezierCurveTo(470, 400, 560, 470, 600, 560); g.stroke();
    const lg = g.createLinearGradient(160, 120, 580, 760); lg.addColorStop(0, 'rgba(210,140,255,.25)'); lg.addColorStop(0.45, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = lg; g.fillRect(0, 0, Wc, Hc);
    g.restore();
    // 嘴喙上色＋亮邊＋鼻孔
    [upper, lower].forEach((p, k) => { const bg = g.createLinearGradient(40, 50, 260, 250); bg.addColorStop(0, '#6a5a78'); bg.addColorStop(0.6, '#3a2e48'); bg.addColorStop(1, '#1a1222'); g.fillStyle = bg; g.fill(p); });
    g.strokeStyle = 'rgba(230,200,250,.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(266, 158); g.bezierCurveTo(212, 126, 120, 74, 40, 52); g.stroke();
    g.fillStyle = '#0a060e'; g.beginPath(); g.ellipse(232, 168, 9, 4, -0.5, 0, 7); g.fill();
    // 嘴根的鬚毛
    g.strokeStyle = 'rgba(30,20,40,.9)'; g.lineWidth = 2; for (let k = 0; k < 14; k++) { g.beginPath(); g.moveTo(262 + R() * 10, 165 + k * 4); g.quadraticCurveTo(230, 160 + k * 4, 205 - R() * 20, 150 + k * 5); g.stroke(); }
    // 外緣被月光照到的紅邊
    g.save(); g.globalCompositeOperation = 'destination-over'; g.shadowColor = 'rgba(255,90,60,.6)'; g.shadowBlur = 30; g.fillStyle = '#100a16'; g.fill(body); g.fill(upper); g.fill(lower); g.restore();
    return (crow = { c, W: Wc, H: Hc });
  }
  function eye(g, x, y, r, open, look, glow) { // 杏仁眼，橘紅色會發光的虹膜、直立的瞳孔
    if (open < 0.03) { g.strokeStyle = 'rgba(30,8,10,.9)'; g.lineWidth = Math.max(1.5, r * 0.06); g.beginPath(); g.moveTo(x - r * 1.1, y); g.quadraticCurveTo(x, y + r * 0.3, x + r * 1.1, y); g.stroke(); g.lineWidth *= 0.6; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + k * r * 0.35, y + r * 0.18 - Math.abs(k) * r * 0.04); g.lineTo(x + k * r * 0.42, y + r * 0.42); g.stroke(); } return; }
    const o = open * 0.62; g.save();
    const lid = new Path2D(); lid.moveTo(x - r * 1.1, y); lid.quadraticCurveTo(x, y - r * o * 1.6, x + r * 1.1, y); lid.quadraticCurveTo(x, y + r * o * 1.6, x - r * 1.1, y);
    const rg = g.createRadialGradient(x, y, r * 0.5, x, y, r * 1.5); rg.addColorStop(0, 'rgba(8,2,4,.95)'); rg.addColorStop(1, 'rgba(8,2,4,0)'); g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, r * 1.5, r * (0.5 + o * 0.9), 0, 0, 7); g.fill(); // 眼皮的暗色凹陷
    g.clip(lid); const ix = x + look[0] * r * 0.35, iy = y + look[1] * r * 0.2;
    const ig = g.createRadialGradient(ix - r * 0.15, iy - r * 0.15, 0, ix, iy, r * 0.95); ig.addColorStop(0, '#fff2a0'); ig.addColorStop(0.35, '#ffae2a'); ig.addColorStop(0.8, '#e0401a'); ig.addColorStop(1, '#5a0a08');
    g.fillStyle = ig; g.fillRect(x - r * 1.2, y - r, r * 2.4, r * 2);
    g.fillStyle = '#100204'; g.beginPath(); g.ellipse(ix, iy, r * (0.12 + glow * 0.18), r * 0.62, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(ix - r * 0.3, iy - r * 0.25, r * 0.12, 0, 7); g.fill();
    g.restore();
    g.strokeStyle = '#3a0a10'; g.lineWidth = r * 0.14; g.stroke(lid);
    g.save(); g.globalCompositeOperation = 'lighter'; const gg = g.createRadialGradient(x, y, r * 0.6, x, y, r * 1.9); gg.addColorStop(0, `rgba(255,120,30,${0.28 * open * (0.7 + glow)})`); gg.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gg; g.fillRect(x - r * 1.9, y - r * 1.9, r * 3.8, r * 3.8); g.restore();
  }
  function flyer(g, x, y, s, ph, dir) { // 遠處飛的烏鴉剪影：流線身體、扇形尾、五根分岔的飛羽
    g.save(); g.translate(x, y); g.scale(s * dir, s); g.fillStyle = '#07040a';
    g.beginPath(); g.moveTo(-34, -2); g.quadraticCurveTo(-30, -9, -20, -8); g.quadraticCurveTo(0, -10, 22, -3); g.lineTo(46, -9); g.lineTo(50, 0); g.lineTo(46, 8); g.lineTo(22, 4); g.quadraticCurveTo(0, 9, -20, 6); g.quadraticCurveTo(-30, 6, -34, 2); g.lineTo(-46, 0); g.closePath(); g.fill();
    const a = Math.sin(ph); [-1, 1].forEach(sd => { g.save(); g.scale(1, sd); const up = sd < 0 ? a : -a * 0.6, tipY = -50 * up - 6, tipX = 6 + Math.abs(up) * 4;
      g.beginPath(); g.moveTo(-10, -2); g.quadraticCurveTo(-4, tipY * 0.6, tipX - 6, tipY);
      for (let k = 0; k < 5; k++) { g.lineTo(tipX + k * 5, tipY + 2 + k * 3); g.lineTo(tipX + k * 5 + 2, tipY + 8 + k * 4); }
      g.quadraticCurveTo(22, tipY * 0.3, 14, -2); g.closePath(); g.fill(); g.restore(); });
    g.restore();
  }
  H.manyEyes = function (ui, SFX) {
    const sky = H.smoke('purpsky', [90, 40, 120], 0.35, 31), mist = H.smoke('mist2', [40, 10, 30], 0.4, 13);
    const flock = Array.from({ length: 34 }, (_, i) => ({ a: i / 34 * 6.283 + rnd(0, 0.3), r: rnd(0.36, 0.5), s: rnd(0.5, 1.1), p: rnd(0, 6), v: rnd(0.25, 0.45) }));
    const rush = Array.from({ length: 26 }, () => ({ y: rnd(0.05, 0.95), d: rnd(0, 0.5), s: rnd(2.5, 6), p: rnd(0, 6) }));
    const order = EYES.map((e, i) => i).sort((a, b) => (a === 0 ? -1 : b === 0 ? 1 : EYES[a][1] - EYES[b][1]));
    const snd = () => { if (!SFX) return; const T = SFX.tone, N = SFX.noise;
      T(41, 4.8, { type: 'sawtooth', vol: 0.06, lp: 180, attack: 0.5 }); T(43.2, 4.8, { type: 'sawtooth', vol: 0.05, lp: 180, attack: 0.5 });
      for (let i = 0; i < 10; i++) { const d = 0.2 + i * 0.32 + Math.random() * 0.2, f = 700 + Math.random() * 500; T(f, 0.22, { type: 'sawtooth', glide: f * 0.7, vol: 0.02 + Math.random() * 0.02, lp: 1800, delay: d }); N(0.1, { f: 1500, type: 'bandpass', q: 3, vol: 0.02, delay: d }); }
      for (let i = 0; i < 24; i++) N(0.06, { f: 400, vol: 0.05, delay: 0.1 + i * 0.16 });
      for (let i = 0; i < 9; i++) { T(58, 0.12, { vol: 0.16, wet: false, delay: 0.6 + i * 0.42 - i * i * 0.012 }); T(52, 0.12, { vol: 0.12, wet: false, delay: 0.75 + i * 0.42 - i * i * 0.012 }); }
      T(3400, 2.8, { type: 'sine', vol: 0.012, detune: 25, delay: 1.0, attack: 1.2 }); T(3480, 2.8, { type: 'sine', vol: 0.012, delay: 1.0, attack: 1.2 });
      [620, 660, 900, 1240].forEach((f, i) => T(f, 0.7, { type: i % 2 ? 'square' : 'sawtooth', glide: f * 0.62, vol: 0.06, lp: 3200, delay: 3.25 })); N(0.6, { f: 1200, type: 'bandpass', vol: 0.1, delay: 3.25 });
      for (let i = 0; i < 30; i++) N(0.08, { f: 300 + Math.random() * 300, vol: 0.08, delay: 3.6 + i * 0.03 });
    };
    const big = Array.from({ length: 16 }, (_, i) => ({ x: rnd(0.05, 0.95), y: rnd(0.08, 0.92), d: i * 0.07, r: rnd(0.7, 1.3), b: rnd(0, 6) }));
    return ui.overlay(6200, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, cx = W / 2, cy = Hh * 0.45;
      const shk = t > 3.25 && t < 3.7 ? 10 : 0; g.save(); g.translate(rnd(-shk, shk) * dpr, rnd(-shk, shk) * dpr);
      const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#0c0814'); bg.addColorStop(0.5, '#24122c'); bg.addColorStop(1, '#08040a'); g.fillStyle = bg; g.fillRect(-20, -20, W + 40, Hh + 40);
      H.cloudLayer(g, sky, W, Hh, 2.6 * U, t * 14 * U, 0, 0.7);
      // 血紅的大月亮
      const mr = Math.min(W, Hh) * 0.42, mg = g.createRadialGradient(cx, cy, mr * 0.2, cx, cy, mr); mg.addColorStop(0, '#ff7a3a'); mg.addColorStop(0.7, '#e02a1a'); mg.addColorStop(1, '#7a0a10'); g.fillStyle = mg; g.beginPath(); g.arc(cx, cy, mr, 0, 7); g.fill();
      const halo = g.createRadialGradient(cx, cy, mr, cx, cy, mr * 1.6); halo.addColorStop(0, 'rgba(255,60,30,.45)'); halo.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = halo; g.fillRect(0, 0, W, Hh);
      H.cloudLayer(g, mist, W, Hh, 1.8 * U, -t * 25 * U, Hh * 0.2, 0.45);
      // 繞著月亮盤旋的烏鴉
      flock.forEach(f => { const a = f.a + t * f.v, r = Math.min(W, Hh) * (f.r + Math.sin(t + f.p) * 0.03) * 1.35; flyer(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.15, f.s * U * 0.7, t * 9 + f.p, Math.sin(a) > 0 ? -1 : 1); });
      // 大烏鴉：慢慢靠近，最後低頭衝向鏡頭
      const C = crowSprite(), sc = Math.min(W / C.W, Hh / C.H) * (0.95 + ease(t / 3.4) * 0.1);
      const rot = t > 2.8 ? ease((t - 2.8) / 0.6) * 0.12 : Math.sin(t * 0.8) * 0.02;
      g.save(); g.translate(cx + W * 0.08, Hh + 10 * U); g.rotate(rot); g.scale(sc, sc); g.translate(-C.W / 2, -C.H);
      g.drawImage(C.c, 0, 0);
      const look = t < 2.8 ? [Math.sin(t * 2.3) * 0.8, Math.cos(t * 1.7) * 0.6] : [-0.2, 0.25];
      order.forEach((idx, k) => { const [ex, ey, er] = EYES[idx], o = clamp((t - 0.5 - k * 0.11) * 3.5), bl = (Math.sin(t * 3 + idx * 7) > 0.97) ? 0.1 : 1; eye(g, ex, ey, er, o * bl, look, t > 3.0 ? 0.8 : 0.2); });
      g.restore();
      // 結尾：眼睛眨呀眨、一顆顆放大，塞滿整個畫面
      if (t > 3.4) { const k = t - 3.4; g.fillStyle = `rgba(0,0,0,${clamp(k * 1.2) * 0.85})`; g.fillRect(-20, -20, W + 40, Hh + 40);
        big.forEach(p => { const kk = clamp((k - p.d) / 1.6), r = (20 + ease(kk) * 170) * U * p.r, bl = Math.sin(t * 5 + p.b) > 0.92 ? 0.05 : 1; if (kk <= 0) return; eye(g, p.x * W, p.y * Hh, r, Math.min(1, kk * 3) * bl, [Math.sin(t * 1.3 + p.b) * 0.3 - (p.x - 0.5) * 0.8, -(p.y - 0.5) * 0.6], 0.6 + kk * 0.4); });
        if (k > 1.5) { g.fillStyle = `rgba(0,0,0,${clamp((k - 1.5) * 2.2)})`; g.fillRect(-20, -20, W + 40, Hh + 40); } }
      g.restore();
      H.vignette(g, W, Hh, 0.9); H.grain(g, W, Hh, 0.1);
      const tt = (txt, y, px, col, a) => { g.save(); g.globalAlpha = a; g.font = `900 ${Math.round(px * dpr)}px "Songti TC","Noto Serif TC","Noto Serif CJK TC",serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#000'; g.shadowBlur = 14 * dpr; g.fillStyle = col; g.fillText(txt, W / 2, y); g.restore(); };
      tt('多 眼 鳥 夜 啼', Hh * 0.1, 36, '#f0c8a0', ease(t / 0.8) * (t > 3.2 ? Math.max(0, 1 - (t - 3.2) * 3) : 1));
      if (t > 5.0) tt('被盯上了：接下來 3 次過路費加倍', Hh * 0.5, 22, '#ffb890', clamp((t - 5.0) * 3));
    }, snd);
  };
})(typeof window !== 'undefined' ? window : globalThis);

// ======================= 神明附身・起乩（重做） =======================
(function (root) {
  const H = root.MONO_HORROR, { rnd, ease, clamp } = H;
  // 乩童剪影：關節式的人形（可以抖、甩頭、舉劍），統一黑色＋金色外緣光
  function limb(g, x0, y0, x1, y1, w0, w1) { const a = Math.atan2(y1 - y0, x1 - x0), n = a + Math.PI / 2, c = Math.cos(n), sn = Math.sin(n); g.beginPath(); g.moveTo(x0 + c * w0, y0 + sn * w0); g.lineTo(x1 + c * w1, y1 + sn * w1); g.lineTo(x1 - c * w1, y1 - sn * w1); g.lineTo(x0 - c * w0, y0 - sn * w0); g.closePath(); g.fill(); g.beginPath(); g.arc(x0, y0, w0, 0, 7); g.fill(); g.beginPath(); g.arc(x1, y1, w1, 0, 7); g.fill(); }
  function medium(g, t, s, jerk) {
    const tw = (f, a) => Math.sin(t * f) * a + (jerk ? rnd(-a, a) * 0.6 : 0);
    const hip = [0, -150], sh = [tw(17, 6), -300 + tw(9, 4)], hd = [sh[0] + tw(23, 14), sh[1] - 52];
    g.save(); g.scale(s, s);
    // 腿（馬步）
    limb(g, hip[0] - 18, hip[1], -70, -70 + tw(11, 4), 22, 17); limb(g, -70, -70, -88, 0, 17, 14);
    limb(g, hip[0] + 18, hip[1], 70, -72 + tw(13, 4), 22, 17); limb(g, 70, -72, 92, 0, 17, 14);
    // 下身褲裙＋軀幹
    g.beginPath(); g.moveTo(-46, hip[1] - 10); g.lineTo(46, hip[1] - 10); g.lineTo(62, hip[1] + 40); g.lineTo(-62, hip[1] + 40); g.fill();
    g.beginPath(); g.moveTo(hip[0] - 40, hip[1]); g.bezierCurveTo(hip[0] - 46, hip[1] - 60, sh[0] - 70, sh[1] + 40, sh[0] - 62, sh[1] + 8); g.quadraticCurveTo(sh[0], sh[1] - 22, sh[0] + 62, sh[1] + 8); g.bezierCurveTo(sh[0] + 70, sh[1] + 40, hip[0] + 46, hip[1] - 60, hip[0] + 40, hip[1]); g.closePath(); g.fill();
    // 舉劍的右手、張開的左手
    const ra = [sh[0] + 46, sh[1] + 6], re = [ra[0] + 40 + tw(19, 8), ra[1] - 70 + tw(15, 10)], rh = [re[0] + 8 + tw(21, 10), re[1] - 78];
    limb(g, ra[0], ra[1], re[0], re[1], 16, 13); limb(g, re[0], re[1], rh[0], rh[1], 13, 11);
    const la = [sh[0] - 46, sh[1] + 6], le = [la[0] - 70 + tw(14, 10), la[1] + 30 + tw(18, 12)], lh = [le[0] - 60, le[1] - 20 + tw(25, 14)];
    limb(g, la[0], la[1], le[0], le[1], 16, 13); limb(g, le[0], le[1], lh[0], lh[1], 13, 11);
    // 七星劍
    g.save(); g.translate(rh[0], rh[1]); g.rotate(-0.25 + tw(20, 0.12)); g.fillRect(-4, -170, 8, 170); g.fillRect(-20, -6, 40, 10); g.beginPath(); g.moveTo(-4, -170); g.lineTo(0, -190); g.lineTo(4, -170); g.fill(); g.restore();
    // 頭：甩頭時留下殘影
    for (let k = 3; k >= 0; k--) { const tt = t - k * 0.03, hx = sh[0] + Math.sin(tt * 23) * 14 + Math.sin(tt * 37) * 8, hy = sh[1] - 52 + Math.cos(tt * 29) * 5; g.globalAlpha = k ? 0.25 : 1; g.beginPath(); g.ellipse(hx, hy, 30, 36, Math.sin(tt * 23) * 0.4, 0, 7); g.fill(); g.fillRect(hx - 12, hy + 20, 24, 30); }
    g.globalAlpha = 1; g.restore();
    const ht = t, hx = sh[0] + Math.sin(ht * 23) * 14 + Math.sin(ht * 37) * 8, hy = sh[1] - 52 + Math.cos(ht * 29) * 5;
    return { head: [hx * s, hy * s], sword: [rh[0] * s, (rh[1] - 120) * s], chest: [sh[0] * s, (sh[1] + 70) * s], tilt: Math.sin(ht * 23) * 0.4 };
  }
  H.trance = function (ui, SFX) { const self = {};
    const smoke = H.smoke('incense', [200, 150, 120], 0.42, 19), smoke2 = H.smoke('incense2', [120, 40, 30], 0.35, 29), emb = H.embers(90);
    const bursts = Array.from({ length: 22 }, () => ({ t: rnd(1.0, 3.6), x: rnd(0.05, 0.95), y: rnd(0.7, 0.98), n: Array.from({ length: 26 }, () => [rnd(0, 6.283), rnd(0.4, 1)]) }));
    const shreds = Array.from({ length: 60 }, () => ({ x: rnd(0, 1), y: rnd(0, 1), r: rnd(0, 6), v: rnd(0.15, 0.4) }));
    const lanterns = Array.from({ length: 12 }, (_, i) => ({ x: (i + 0.5) / 12 + rnd(-0.03, 0.03), y: rnd(0.08, 0.3), s: rnd(0.6, 1.4) }));
    const snd = () => { if (!SFX) return; const T = SFX.tone, N = SFX.noise;
      // 北管大鼓＋小鼓越打越快
      for (let i = 0; i < 34; i++) { const d = i < 8 ? i * 0.26 : 2.08 + (i - 8) * 0.075; T(i % 2 ? 98 : 72, 0.14, { type: 'triangle', glide: 45, vol: 0.13, wet: false, delay: d }); N(0.04, { f: 1800, type: 'bandpass', vol: 0.03, delay: d }); }
      // 大鑼：低頻＋金屬泛音
      [0.05, 1.6, 3.3].forEach(d => { T(132, 2.4, { vol: 0.08, detune: -25, delay: d }); T(137, 2.4, { vol: 0.06, delay: d }); T(523, 1.6, { vol: 0.02, detune: 30, delay: d }); N(0.9, { f: 3200, type: 'bandpass', q: 2, vol: 0.06, delay: d }); });
      // 嗩吶般的尖銳旋律
      [587, 659, 784, 659, 880, 784, 659, 587].forEach((f, i) => T(f, 0.24, { type: 'sawtooth', vol: 0.03, lp: 2600, delay: 1.0 + i * 0.25 }));
      // 鞭炮
      bursts.forEach(b => { for (let k = 0; k < 6; k++) N(0.03, { f: 2000 + Math.random() * 3000, type: 'bandpass', q: 2, vol: 0.1, delay: b.t + k * 0.04 }); });
    };
    return ui.overlay(4400, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, cx = W / 2, base = Hh * 0.9;
      const beat = t < 2.08 ? (t % 0.26) / 0.26 : ((t - 2.08) % 0.075) / 0.075, kick = Math.pow(1 - beat, 4), shk = (t > 0.6 ? 3 + Math.min(10, (t - 0.6) * 4) : 1) * kick;
      g.save(); g.translate(rnd(-shk, shk) * dpr, rnd(-shk, shk) * dpr);
      // 廟裡：深紅背景、燈籠散景、兩根大紅柱
      const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#1a0404'); bg.addColorStop(0.6, '#3a0a06'); bg.addColorStop(1, '#120202'); g.fillStyle = bg; g.fillRect(-30, -30, W + 60, Hh + 60);
      lanterns.forEach((l, i) => { const x = l.x * W, y = l.y * Hh, r = 26 * U * l.s, fl = 0.7 + Math.sin(t * 9 + i) * 0.15; const lg = g.createRadialGradient(x, y, 0, x, y, r * 2.2); lg.addColorStop(0, `rgba(255,120,60,${0.55 * fl})`); lg.addColorStop(0.35, `rgba(220,30,20,${0.35 * fl})`); lg.addColorStop(1, 'rgba(120,0,0,0)'); g.fillStyle = lg; g.beginPath(); g.arc(x, y, r * 2.2, 0, 7); g.fill(); });
      [-1, 1].forEach(sd => { const px = cx + sd * W * 0.42, pg = g.createLinearGradient(px - 30 * U, 0, px + 30 * U, 0); pg.addColorStop(0, '#2a0404'); pg.addColorStop(0.5, '#7a1410'); pg.addColorStop(1, '#1a0202'); g.fillStyle = pg; g.fillRect(px - 26 * U, 0, 52 * U, Hh);
        g.strokeStyle = 'rgba(220,170,70,.5)'; g.lineWidth = 3 * U; for (let k = 0; k < 6; k++) { const y = ((k * 0.17 + t * 0.03) % 1) * Hh; g.beginPath(); g.moveTo(px - 26 * U, y); g.quadraticCurveTo(px, y + 30 * U, px + 26 * U, y); g.stroke(); } });
      // 神明的火焰背光：一圈會轉的火，越來越亮
      const fa = ease((t - 0.4) / 1.6), mx = cx, my = base - 330 * U * 0.95;
      if (fa > 0) { g.save(); g.globalCompositeOperation = 'lighter';
        const hg = g.createRadialGradient(mx, my, 40 * U, mx, my, 210 * U); hg.addColorStop(0, `rgba(255,220,120,${0.25 * fa})`); hg.addColorStop(0.6, `rgba(255,120,30,${0.3 * fa})`); hg.addColorStop(1, 'rgba(255,40,0,0)'); g.fillStyle = hg; g.beginPath(); g.arc(mx, my, 210 * U, 0, 7); g.fill();
        [[0, '255,70,20', 1.5, 0.5], [1, '255,170,40', 1.0, 0.65], [2, '255,240,170', 0.55, 0.7]].forEach(([L, col, len, al]) => { for (let k = 0; k < 54; k++) { const a = k / 54 * 6.283 + t * (0.4 + L * 0.15), r0 = 140 * U, n = Math.sin(k * 12.9 + L) * 0.5 + 0.5, fl = (20 + n * 40 + Math.sin(t * (9 + n * 6) + k * 2.3) * 14) * U * len, bend = Math.sin(t * 5 + k) * 0.12;
          g.fillStyle = `rgba(${col},${al * fa})`; g.beginPath(); g.moveTo(mx + Math.cos(a - 0.07) * r0, my + Math.sin(a - 0.07) * r0); g.quadraticCurveTo(mx + Math.cos(a - 0.05 + bend) * (r0 + fl * 0.6), my + Math.sin(a - 0.05 + bend) * (r0 + fl * 0.6), mx + Math.cos(a + bend * 1.6) * (r0 + fl), my + Math.sin(a + bend * 1.6) * (r0 + fl)); g.quadraticCurveTo(mx + Math.cos(a + 0.06 + bend) * (r0 + fl * 0.5), my + Math.sin(a + 0.06 + bend) * (r0 + fl * 0.5), mx + Math.cos(a + 0.07) * r0, my + Math.sin(a + 0.07) * r0); g.fill(); } });
        g.strokeStyle = `rgba(255,230,150,${0.3 * fa})`; g.lineWidth = 2 * U; g.beginPath(); g.arc(mx, my, 140 * U, 0, 7); g.stroke(); g.restore(); }
      // 香煙
      H.cloudLayer(g, smoke2, W, Hh, 2.2 * U, t * 10 * U, -t * 30 * U, 0.55);
      H.cloudLayer(g, smoke, W, Hh, 1.7 * U, -t * 14 * U, -t * 45 * U, 0.28, 'screen');
      // 乩童：先畫金色外緣光，再畫黑色本體
      if (!self.fig || self.fig.width !== W) { self.fig = document.createElement('canvas'); self.fig.width = W; self.fig.height = Hh; }
      const fg = self.fig.getContext('2d'); fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, W, Hh); fg.translate(cx, base); fg.fillStyle = '#080202'; const P = medium(fg, t, U * 0.95, kick > 0.5 && t > 0.6);
      // 紅肚兜＋飄動的紅頭巾
      fg.fillStyle = '#9a1010'; fg.beginPath(); fg.moveTo(P.chest[0], P.chest[1] - 40 * U); fg.lineTo(P.chest[0] + 32 * U, P.chest[1]); fg.lineTo(P.chest[0], P.chest[1] + 46 * U); fg.lineTo(P.chest[0] - 32 * U, P.chest[1]); fg.fill();
      fg.fillStyle = '#c8a040'; fg.beginPath(); fg.arc(P.chest[0], P.chest[1], 8 * U, 0, 7); fg.fill();
      fg.save(); fg.translate(P.head[0], P.head[1] - 12 * U); fg.rotate(P.tilt); fg.fillStyle = '#a81212'; fg.fillRect(-31 * U, -6 * U, 62 * U, 12 * U);
      for (let k = 0; k < 2; k++) { fg.beginPath(); fg.moveTo(28 * U, -2 * U); for (let q = 1; q <= 8; q++) fg.lineTo((28 + q * 12) * U, (Math.sin(t * 18 + q * 0.9 + k) * q * 2.2 + k * 8) * U); for (let q = 8; q >= 1; q--) fg.lineTo((28 + q * 12) * U, (Math.sin(t * 18 + q * 0.9 + k) * q * 2.2 + k * 8 + 6) * U); fg.fill(); }
      fg.restore();
      g.save(); g.shadowColor = 'rgba(255,170,60,.95)'; g.shadowBlur = 28 * dpr; g.drawImage(self.fig, 0, 0); g.shadowBlur = 0; g.drawImage(self.fig, 0, 0); g.restore();
      // 雙眼發金光
      if (t > 0.9) { const ex = cx + P.head[0], ey = base + P.head[1] - 6 * U, eo = ease((t - 0.9) / 0.4) * (0.8 + Math.sin(t * 20) * 0.2); g.save(); g.globalCompositeOperation = 'lighter';
        [-1, 1].forEach(sd => { const x = ex + sd * 11 * U, gr = g.createRadialGradient(x, ey, 0, x, ey, 16 * U); gr.addColorStop(0, `rgba(255,255,230,${eo})`); gr.addColorStop(0.15, `rgba(255,210,80,${eo})`); gr.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gr; g.fillRect(x - 16 * U, ey - 16 * U, 32 * U, 32 * U);
          g.strokeStyle = `rgba(255,220,120,${eo * 0.5})`; g.lineWidth = 3 * U; g.beginPath(); g.moveTo(x, ey); g.lineTo(x + sd * 60 * U, ey - 6 * U); g.stroke(); }); g.restore(); }
      // 劍尖閃光
      if (t > 1.2) { const sx = cx + P.sword[0], sy = base + P.sword[1]; g.save(); g.globalCompositeOperation = 'lighter'; const sg = g.createRadialGradient(sx, sy, 0, sx, sy, 50 * U * (0.6 + kick)); sg.addColorStop(0, 'rgba(255,255,255,.9)'); sg.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = sg; g.fillRect(sx - 60 * U, sy - 60 * U, 120 * U, 120 * U); g.restore(); }
      // 鞭炮：亮點炸開＋一團白煙
      bursts.forEach(b => { const k = t - b.t; if (k < 0 || k > 0.9) return; const bx = b.x * W, by = b.y * Hh; g.save(); g.globalCompositeOperation = 'lighter';
        if (k < 0.08) { const fg = g.createRadialGradient(bx, by, 0, bx, by, 70 * U); fg.addColorStop(0, 'rgba(255,255,220,1)'); fg.addColorStop(1, 'rgba(255,160,40,0)'); g.fillStyle = fg; g.fillRect(bx - 70 * U, by - 70 * U, 140 * U, 140 * U); }
        b.n.forEach(([a, v]) => { const r = k * v * 160 * U; g.fillStyle = `rgba(255,${200 + v * 55},120,${1 - k})`; g.fillRect(bx + Math.cos(a) * r, by + Math.sin(a) * r + k * k * 60 * U, 3 * dpr, 3 * dpr); }); g.restore();
        const sr = (20 + k * 60) * U, sy2 = by - k * 30 * U, smg = g.createRadialGradient(bx, sy2, 0, bx, sy2, sr); smg.addColorStop(0, `rgba(200,190,190,${0.22 * (1 - k)})`); smg.addColorStop(1, 'rgba(200,190,190,0)'); g.fillStyle = smg; g.fillRect(bx - sr, sy2 - sr, sr * 2, sr * 2); });
      // 紅色鞭炮紙屑
      if (t > 1.0) shreds.forEach(p => { const y = ((p.y + (t - 1) * p.v) % 1); g.save(); g.translate(p.x * W + Math.sin(t * 3 + p.r) * 20 * U, y * Hh); g.rotate(t * 5 + p.r); g.scale(1, Math.sin(t * 7 + p.r)); g.fillStyle = 'rgba(200,20,20,.9)'; g.fillRect(-5 * U, -3 * U, 10 * U, 6 * U); g.restore(); });
      H.drawEmbers(g, emb, W, Hh, t, dpr, 'rgba(255,190,90,A)', 1.2);
      g.restore();
      // 閃光節拍
      if (t > 2.08) { g.fillStyle = `rgba(255,200,120,${kick * 0.12})`; g.fillRect(0, 0, W, Hh); }
      H.vignette(g, W, Hh, 0.85); H.grain(g, W, Hh, 0.08);
      const tt = (txt, y, px, col, a) => { g.save(); g.globalAlpha = a; g.font = `900 ${Math.round(px * dpr)}px "Songti TC","Noto Serif TC","Noto Serif CJK TC",serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#000'; g.shadowBlur = 14 * dpr; g.fillStyle = col; g.fillText(txt, W / 2, y); g.restore(); };
      tt('神 明 附 身', Hh * 0.08, 38, '#ffe0a0', ease((t - 0.9) / 0.5));
      if (t > 2.6) tt('下一次擲骰：點數由你決定', Hh * 0.95, 22, '#fff1d0', clamp((t - 2.6) * 3));
    }, snd);
  };
})(typeof window !== 'undefined' ? window : globalThis);

// ======================= 十八層地獄（重做） =======================
(function (root) {
  const H = root.MONO_HORROR, { rnd, ease, clamp, cvs } = H;
  // 一層層的火舌（暗紅→橘→黃），像中世紀地獄畫裡塞滿畫面的火
  H.flames = function (g, x0, x1, base, hgt, t, dens, seed, alpha) {
    // 每一根火舌是三層同心的形狀（外暗紅、中橘、內黃），寬度高度都不一樣，尖端會左右擺
    const n = Math.max(5, Math.round((x1 - x0) / dens)); let sd = seed || 1; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const list = []; for (let i = 0; i < n; i++) list.push({ x: x0 + (i + R()) / n * (x1 - x0), w: (x1 - x0) / n * (0.7 + R() * 1.2), h: 0.45 + R() * 0.75, ph: R() * 6.28, sp: 4 + R() * 5 });
    g.save(); g.globalAlpha = alpha == null ? 1 : alpha;
    [['rgba(120,12,6,.95)', 1, 1], ['rgba(235,90,20,.9)', 0.72, 0.8], ['rgba(255,200,70,.85)', 0.45, 0.55], ['rgba(255,245,200,.7)', 0.22, 0.3]].forEach(([col, ws, hs]) => {
      g.fillStyle = col;
      list.forEach(f => { const hh = hgt * f.h * hs * (0.85 + Math.sin(t * f.sp + f.ph) * 0.12 + Math.sin(t * f.sp * 2.3 + f.ph) * 0.05), w = f.w * ws, sw = (Math.sin(t * 3.1 + f.ph) * 0.6 + Math.sin(t * 7.7 + f.ph * 2) * 0.25) * f.w * 0.9;
        g.beginPath(); g.moveTo(f.x - w, base); g.bezierCurveTo(f.x - w * 1.1, base - hh * 0.35, f.x - w * 0.5 + sw * 0.4, base - hh * 0.6, f.x + sw, base - hh);
        g.bezierCurveTo(f.x + w * 0.5 + sw * 0.4, base - hh * 0.62, f.x + w * 1.1, base - hh * 0.35, f.x + w, base); g.fill(); }); });
    g.restore();
  };
  function limb(g, x0, y0, x1, y1, w0, w1) { const a = Math.atan2(y1 - y0, x1 - x0), n = a + Math.PI / 2, c = Math.cos(n), sn = Math.sin(n); g.beginPath(); g.moveTo(x0 + c * w0, y0 + sn * w0); g.lineTo(x1 + c * w1, y1 + sn * w1); g.lineTo(x1 - c * w1, y1 - sn * w1); g.lineTo(x0 - c * w0, y0 - sn * w0); g.closePath(); g.fill(); g.beginPath(); g.arc(x0, y0, w0, 0, 7); g.fill(); g.beginPath(); g.arc(x1, y1, w1, 0, 7); g.fill(); }
  // 受刑的人：蒼白、瘦、四肢可以擺姿勢；p = { a: 手臂角度…}
  function sinner(g, x, y, s, pose, t, col) {
    g.save(); g.translate(x, y); g.scale(s, s); const base = col || '#e8d6c0'; const gr = g.createLinearGradient(-30, -100, 30, 60); gr.addColorStop(0, base); gr.addColorStop(0.55, base); gr.addColorStop(1, '#b0603a'); g.fillStyle = gr;
    const P = Object.assign({ la: -2.4, ra: -0.7, ll: 1.9, rl: 1.2, lean: 0, head: 0 }, pose);
    g.rotate(P.lean); const sh = [0, -62], hp = [0, 0];
    g.beginPath(); g.moveTo(-10, 2); g.bezierCurveTo(-12, -24, -18, -48, -14, -62); g.quadraticCurveTo(0, -70, 14, -62); g.bezierCurveTo(18, -48, 12, -24, 10, 2); g.closePath(); g.fill();
    [[P.la, -1], [P.ra, 1]].forEach(([a, sd]) => { const e = [sh[0] + sd * 10 + Math.cos(a) * 26, sh[1] + 4 + Math.sin(a) * 26], h = [e[0] + Math.cos(a + sd * 0.4) * 24, e[1] + Math.sin(a + sd * 0.4) * 24]; limb(g, sh[0] + sd * 10, sh[1] + 4, e[0], e[1], 5, 4); limb(g, e[0], e[1], h[0], h[1], 4, 3); });
    [[P.ll, -1], [P.rl, 1]].forEach(([a, sd]) => { const k = [hp[0] + sd * 6 + Math.cos(a) * 30, hp[1] + Math.sin(a) * 30], f = [k[0] + Math.cos(a - sd * 0.3) * 30, k[1] + Math.sin(a - sd * 0.3) * 30]; limb(g, hp[0] + sd * 6, hp[1], k[0], k[1], 6, 5); limb(g, k[0], k[1], f[0], f[1], 5, 3.5); });
    g.save(); g.translate(sh[0], sh[1] - 16); g.rotate(P.head); g.fillStyle = base; g.beginPath(); g.ellipse(0, 0, 10, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#1a0606'; g.beginPath(); g.ellipse(-4, -2, 2, 2.6, 0, 0, 7); g.ellipse(4, -2, 2, 2.6, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, 6, 3, 4 + Math.abs(Math.sin(t * 9)) * 2, 0, 0, 7); g.fill();
    g.fillStyle = '#2a1408'; g.beginPath(); g.arc(0, -4, 10.5, Math.PI * 1.05, Math.PI * 1.95); g.fill(); g.restore();
    g.restore();
  }
  // 牛頭／馬面：黑色剪影、發光的眼睛、手持武器（kind 0 牛頭 1 馬面），w 武器角度
  function guard(g, x, y, s, kind, w, t, weapon) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#0a0303';
    limb(g, -14, -70, -30, 0, 13, 10); limb(g, 14, -70, 30, 0, 13, 10);
    g.beginPath(); g.moveTo(-34, -70); g.bezierCurveTo(-46, -120, -48, -150, -40, -170); g.lineTo(40, -170); g.bezierCurveTo(48, -150, 46, -120, 34, -70); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-40, -85); g.lineTo(40, -85); g.lineTo(50, -50); g.lineTo(-50, -50); g.fill(); // 裙甲
    // 頭
    g.save(); g.translate(0, -185);
    if (!kind) { g.beginPath(); g.ellipse(0, 0, 30, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, 18, 18, 14, 0, 0, 7); g.fill();
      [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 22, -14); g.bezierCurveTo(sd * 52, -20, sd * 66, -40, sd * 58, -66); g.bezierCurveTo(sd * 52, -44, sd * 38, -30, sd * 22, -2); g.fill(); g.beginPath(); g.ellipse(sd * 32, -2, 12, 6, sd * 0.4, 0, 7); g.fill(); });
      g.strokeStyle = 'rgba(200,150,60,.7)'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 26, 6, 0.2, Math.PI - 0.2); g.stroke(); }
    else { g.beginPath(); g.moveTo(-18, -24); g.bezierCurveTo(-22, 10, -16, 40, -6, 52); g.quadraticCurveTo(0, 56, 6, 52); g.bezierCurveTo(16, 40, 22, 10, 18, -24); g.quadraticCurveTo(0, -36, -18, -24); g.fill();
      [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 8, -28); g.lineTo(sd * 18, -56); g.lineTo(sd * 20, -24); g.fill(); });
      for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(-2, -30 + k * 8); g.lineTo(-22 - k * 2, -20 + k * 10); g.lineTo(-4, -24 + k * 8); g.fill(); } }
    const eo = 0.75 + Math.sin(t * 6 + kind) * 0.2; g.globalCompositeOperation = 'lighter';
    [-1, 1].forEach(sd => { const ex = sd * (kind ? 12 : 13), ey = kind ? -6 : -4, gr = g.createRadialGradient(ex, ey, 0, ex, ey, 12); gr.addColorStop(0, `rgba(255,240,170,${eo})`); gr.addColorStop(0.3, `rgba(255,90,20,${eo})`); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(ex - 12, ey - 12, 24, 24); });
    g.globalCompositeOperation = 'source-over'; g.restore();
    // 手臂＋武器
    const sx = 36, sy = -160, ex = sx + Math.cos(w) * 46, ey = sy + Math.sin(w) * 46; limb(g, sx, sy, ex, ey, 11, 9); const hx = ex + Math.cos(w + 0.5) * 40, hy = ey + Math.sin(w + 0.5) * 40; limb(g, ex, ey, hx, hy, 9, 8);
    limb(g, -36, -160, -60, -110, 11, 9); limb(g, -60, -110, -50, -70, 9, 8);
    if (weapon) { g.save(); g.translate(hx, hy); g.rotate(w + 0.5 + Math.PI / 2); g.fillStyle = '#1a1414'; g.fillRect(-3, -110, 6, 220);
      if (weapon === 'fork') { g.fillStyle = '#8a8a96'; g.fillRect(-18, -118, 36, 6); [-16, 0, 16].forEach(d => { g.beginPath(); g.moveTo(d - 3, -118); g.lineTo(d, -146); g.lineTo(d + 3, -118); g.fill(); }); }
      if (weapon === 'pincer') { g.fillStyle = '#6a6a74'; g.fillRect(-8, -125, 5, 30); g.fillRect(3, -125, 5, 30); }
      g.restore(); }
    g.restore();
    return [x + hx * s, y + hy * s];
  }
  // 閻羅判官：巨大的背光剪影（烏紗帽、長鬚、寬袍），手指向破產的人
  function judge(g, x, y, s, point, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.shadowColor = 'rgba(255,90,30,.85)'; g.shadowBlur = 40; g.fillStyle = '#0c0303';
    g.beginPath(); g.moveTo(-90, -230); g.bezierCurveTo(-170, -150, -210, 0, -230, 260); g.lineTo(230, 260); g.bezierCurveTo(210, 0, 170, -150, 90, -230); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(0, -290, 58, 66, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-48, -262); g.bezierCurveTo(-40, -150, -20, -100, 0, -70); g.bezierCurveTo(20, -100, 40, -150, 48, -262); g.fill(); // 長鬚
    g.fillRect(-64, -390, 128, 70); g.beginPath(); g.ellipse(0, -390, 64, 22, 0, Math.PI, 0); g.fill(); // 帽
    [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 112, -360, 54, 12, sd * 0.05, 0, 7); g.fill(); }); // 帽翅
    // 指人的手（從袖子伸出）
    const k = ease(point); g.save(); g.translate(120, -150); g.rotate(-0.15 - k * 0.25); g.beginPath(); g.moveTo(0, -40); g.lineTo(220 * k + 40, -26); g.lineTo(220 * k + 40, 26); g.lineTo(0, 50); g.fill();
    g.beginPath(); g.ellipse(220 * k + 62, 0, 26, 20, 0, 0, 7); g.fill(); g.fillRect(220 * k + 80, -7, 62 * k + 6, 14); g.restore();
    g.shadowBlur = 0;
    // 怒目（白底紅瞳）＋粗眉
    [-1, 1].forEach(sd => { g.fillStyle = 'rgba(255,230,190,.95)'; g.beginPath(); g.ellipse(sd * 22, -300, 13, 7, sd * -0.25, 0, 7); g.fill(); g.fillStyle = '#c00000'; g.beginPath(); g.arc(sd * 20 + 4, -300, 4.5, 0, 7); g.fill();
      g.strokeStyle = 'rgba(80,60,50,.9)'; g.lineWidth = 7; g.beginPath(); g.moveTo(sd * 40, -322); g.lineTo(sd * 8, -312); g.stroke(); });
    g.restore();
  }

  H.hell = function (ui, SFX, info) {
    const kind = Math.floor(Math.random() * 4), PUN = ['上刀山', '下油鍋', '拔舌地獄', '石磨地獄'][kind];
    const smoke = H.smoke('hellsmoke', [90, 20, 10], 0.4, 37), emb = H.embers(140);
    const crowd = Array.from({ length: 16 }, (_, i) => ({ x: rnd(0.05, 0.95), y: rnd(0.25, 0.5), s: rnd(0.5, 0.8), p: rnd(0, 6), f: i % 2 }));
    const drops = [];
    const addBlood = (x, y, n, sp, t0) => { for (let i = 0; i < n; i++) drops.push({ x, y, vx: rnd(-sp, sp), vy: rnd(-sp * 1.3, sp * 0.2), r: rnd(1.5, 5), t: t0 + rnd(0, 0.25) }); };
    const byName = info && info.byName, vName = info && info.vName;
    const snd = () => { if (!SFX) return; const T = SFX.tone, N = SFX.noise;
      T(33, 8.5, { type: 'sawtooth', vol: 0.07, lp: 150, attack: 0.4 }); T(34.6, 8.5, { type: 'sawtooth', vol: 0.06, lp: 150, attack: 0.4 });
      [0.1, 2.9].forEach(d => { T(98, 3.5, { vol: 0.09, detune: -30, delay: d }); T(103.5, 3.5, { vol: 0.07, delay: d }); T(392, 2.4, { vol: 0.02, detune: 25, delay: d }); N(1.0, { f: 2400, type: 'bandpass', q: 2, vol: 0.07, delay: d }); });
      // 判官大喝（低沉的嗓音）＋墜落的風聲＋落地撞擊
      [0.8, 1.05].forEach((d, i) => { T(110 - i * 15, 0.4, { type: 'sawtooth', vol: 0.09, lp: 700, glide: 80, delay: d }); T(165 - i * 20, 0.4, { type: 'square', vol: 0.04, lp: 900, delay: d }); });
      N(1.2, { f: 900, type: 'bandpass', q: 0.7, vol: 0.06, attack: 0.8, delay: 1.3 }); T(700, 1.2, { type: 'sawtooth', glide: 180, vol: 0.05, lp: 2500, delay: 1.4 }); N(0.5, { f: 200, vol: 0.2, delay: 2.5 }); T(50, 0.7, { glide: 28, vol: 0.2, wet: false, delay: 2.5 });
      // 地獄裡的哀嚎此起彼落
      for (let i = 0; i < 16; i++) { const f = 400 + Math.random() * 900; T(f, 0.5 + Math.random() * 0.8, { type: i % 2 ? 'sawtooth' : 'square', glide: f * (0.5 + Math.random() * 0.3), vol: 0.02 + Math.random() * 0.02, lp: 2400, delay: 3.0 + i * 0.32 }); }
      N(5.4, { f: 600, type: 'lowpass', vol: 0.05, attack: 0.5, delay: 2.8 }); // 火焰聲
      if (kind === 0) for (let i = 0; i < 10; i++) T(2600 + Math.random() * 900, 0.35, { type: 'square', vol: 0.018, lp: 6000, delay: 3.3 + i * 0.45 });
      if (kind === 1) { N(4.5, { f: 5200, type: 'highpass', vol: 0.08, attack: 0.3, delay: 3.6 }); N(0.6, { f: 500, vol: 0.18, delay: 4.1 }); }
      if (kind === 2) for (let i = 0; i < 5; i++) T(260, 0.6, { type: 'sawtooth', glide: 1000, vol: 0.05, lp: 2200, delay: 3.6 + i * 0.85 });
      if (kind === 3) for (let i = 0; i < 8; i++) N(0.6, { f: 140, vol: 0.15, delay: 3.4 + i * 0.6 });
      T(1500, 1.4, { type: 'sawtooth', glide: 700, vol: 0.06, lp: 4000, delay: 4.2 }); T(1580, 1.4, { type: 'square', glide: 760, vol: 0.03, lp: 4000, delay: 4.2 });
    };
    return ui.overlay(8400, (g, W, Hh, dpr, t) => {
      const U = Math.min(W, Hh) / 420, cx = W / 2;
      const tt = (txt, y, px, col, a) => { g.save(); g.globalAlpha = a; g.font = `900 ${Math.round(px * dpr)}px "Songti TC","Noto Serif TC","Noto Serif CJK TC",serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#000'; g.shadowBlur = 14 * dpr; g.fillStyle = col; g.fillText(txt, W / 2, y); g.restore(); };
      // ===== 第一段：判決（0～2.9 秒）=====
      if (t < 2.9) {
        const shk = t > 0.8 && t < 1.3 ? 8 : t > 2.45 && t < 2.7 ? 14 : 0; g.save(); g.translate(rnd(-shk, shk) * dpr, rnd(-shk, shk) * dpr);
        const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#120202'); bg.addColorStop(0.55, '#3a0806'); bg.addColorStop(1, '#0a0101'); g.fillStyle = bg; g.fillRect(-20, -20, W + 40, Hh + 40);
        H.cloudLayer(g, smoke, W, Hh, 2.4 * U, t * 20 * U, -t * 10 * U, 0.7);
        // 地上的裂縫：從中間裂開，透出岩漿光
        const crack = ease((t - 1.2) / 0.6), gy = Hh * 0.86;
        if (crack > 0) { const cg = g.createRadialGradient(cx, gy, 0, cx, gy, W * 0.5 * crack); cg.addColorStop(0, 'rgba(255,230,140,.95)'); cg.addColorStop(0.3, 'rgba(255,90,20,.8)'); cg.addColorStop(1, 'rgba(80,0,0,0)'); g.fillStyle = cg; g.beginPath(); g.ellipse(cx, gy, W * 0.5 * crack, 40 * U * crack, 0, 0, 7); g.fill();
          H.flames(g, cx - W * 0.35 * crack, cx + W * 0.35 * crack, gy + 10 * U, 90 * U * crack, t, 18 * U, 3); }
        if (!byName) judge(g, W * 0.3, Hh * 0.62, U * 0.62, clamp((t - 0.6) / 0.4), t);
        // 破產的人：站著發抖，裂縫打開後往下掉
        const fall = ease((t - 1.6) / 0.9), vx = byName ? cx : W * 0.72, vy = Hh * 0.84 + fall * fall * 140 * U;
        if (fall < 0.98) { g.save(); g.globalAlpha = 1 - Math.max(0, fall - 0.7) * 3; sinner(g, vx + Math.sin(t * 40) * 1.5 * U, vy - 40 * U, U * 1.1, fall > 0 ? { la: -2.6 - Math.sin(t * 20) * 0.4, ra: -0.5 + Math.sin(t * 22) * 0.4, ll: 1.3, rl: 1.9, lean: fall * 1.4, head: -0.3 } : { la: 1.8, ra: 1.3, ll: 1.75, rl: 1.4 }, t); g.restore(); }
        if (!byName && t > 0.95 && t < 1.6) { g.strokeStyle = 'rgba(255,200,120,.6)'; g.lineWidth = 3 * dpr; g.setLineDash([10 * dpr, 8 * dpr]); g.beginPath(); g.moveTo(W * 0.3 + 230 * U * 0.62 * 1.2, Hh * 0.62 - 150 * U * 0.62 - 40 * U); g.lineTo(vx, vy - 90 * U); g.stroke(); g.setLineDash([]); }
        H.drawEmbers(g, emb, W, Hh, t, dpr, 'rgba(255,140,50,A)', 1.4);
        g.restore();
        H.vignette(g, W, Hh, 0.92); H.grain(g, W, Hh, 0.1);
        if (byName) tt(`欠 ${byName} 的錢還不出來`, Hh * 0.12, 24, '#ffcfb0', ease(t / 0.5));
        else if (t > 0.9) tt('打 入 地 獄 ！', Hh * 0.12, 40, '#ffd070', ease((t - 0.9) / 0.2));
        if (t > 2.45 && t < 2.6) { g.fillStyle = 'rgba(255,240,220,.85)'; g.fillRect(0, 0, W, Hh); }
        if (t > 2.6) { g.fillStyle = `rgba(0,0,0,${(t - 2.6) * 3.4})`; g.fillRect(0, 0, W, Hh); }
        return;
      }
      // ===== 第二段：地獄畫卷（2.9～8.4 秒）=====
      const k = t - 2.9, push = 1.05 + k * 0.02;
      g.save(); g.translate(cx, Hh / 2); g.scale(push, push); g.translate(-cx, -Hh / 2);
      const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#3a0603'); bg.addColorStop(0.5, '#7a1606'); bg.addColorStop(1, '#2a0402'); g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
      // 後面整片的火海＋在火裡掙扎的小人（上排）
      H.flames(g, -20, W + 20, Hh * 0.62, Hh * 0.55, t, 26 * U, 11, 0.9);
      crowd.forEach((c, i) => sinner(g, c.x * W, Hh * (0.36 + c.y * 0.35) + Math.sin(t * 3 + c.p) * 3 * U, U * c.s * 0.75, { la: -2.2 + Math.sin(t * 6 + c.p) * 0.6, ra: -0.9 - Math.sin(t * 5 + c.p) * 0.6, ll: 1.6, rl: 1.3, lean: Math.sin(t * 2 + c.p) * 0.2, head: -0.4 }, t, '#c88a68'));
      H.flames(g, -20, W + 20, Hh * 0.7, Hh * 0.3, t + 1, 20 * U, 12, 0.95);
      const fl = g.createLinearGradient(0, Hh * 0.62, 0, Hh); fl.addColorStop(0, '#5a0e04'); fl.addColorStop(1, '#1a0302'); g.fillStyle = fl; g.fillRect(0, Hh * 0.69, W, Hh * 0.31);
      // 岩壁框（像壁畫的邊）
      g.fillStyle = '#1a0806'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, Hh); g.lineTo(0, Hh); g.closePath();
      g.moveTo(26 * U, 40 * U); for (let i = 0; i <= 12; i++) g.lineTo(26 * U + Math.sin(i * 2.1) * 10 * U, 40 * U + i / 12 * (Hh - 80 * U)); for (let i = 12; i >= 0; i--) g.lineTo(W - 26 * U + Math.sin(i * 1.7) * 10 * U, 40 * U + i / 12 * (Hh - 80 * U)); g.closePath(); g.fill('evenodd');
      // 前景：刑罰
      const fy = Hh * 0.9, mid = Hh * 0.72;
      if (kind === 0) { // 上刀山
        g.fillStyle = '#20100c'; g.beginPath(); g.moveTo(cx - 190 * U, fy); g.quadraticCurveTo(cx - 40 * U, Hh * 0.45, cx + 10 * U, Hh * 0.4); g.quadraticCurveTo(cx + 60 * U, Hh * 0.45, cx + 200 * U, fy); g.fill();
        let sd = 4; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        for (let i = 0; i < 70; i++) { const u = R(), side = R() - 0.5, y = fy - u * (fy - Hh * 0.42), w2 = (1 - u) * 190 * U, x = cx + side * 2 * w2; const bl = g.createLinearGradient(x, y, x, y - 30 * U); bl.addColorStop(0, '#5a5a66'); bl.addColorStop(1, '#f0f0ff'); g.fillStyle = bl; g.beginPath(); g.moveTo(x - 4 * U, y); g.lineTo(x + (R() - 0.5) * 6 * U, y - (24 + R() * 18) * U); g.lineTo(x + 4 * U, y); g.fill(); }
        const up = ease(k / 3.4), sy2 = fy - 40 * U - up * (fy - Hh * 0.48 - 40 * U), sx2 = cx - 120 * U + up * 110 * U;
        sinner(g, sx2, sy2, U * 1.25, { la: -2.4 + Math.sin(t * 9) * 0.5, ra: -0.6 + Math.sin(t * 11) * 0.5, ll: 1.0, rl: 2.0, lean: 0.5, head: -0.5 }, t);
        guard(g, sx2 - 95 * U, sy2 + 80 * U, U * 0.62, 0, -0.9 + Math.sin(t * 5) * 0.15, t, 'fork');
        if (k > 0.4 && Math.random() < 0.5) addBlood(sx2, sy2 - 30 * U, 2, 3, t);
        g.fillStyle = 'rgba(130,0,0,.85)'; for (let i = 0; i < 12; i++) { const x = cx + (i - 6) * 26 * U, l = clamp(k / 4) * (40 + (i * 37 % 50)) * U; g.fillRect(x, Hh * 0.55 + (i * 23 % 60) * U, 3 * U, l); }
      } else if (kind === 1) { // 下油鍋
        H.flames(g, cx - 160 * U, cx + 160 * U, fy + 6 * U, 110 * U, t, 16 * U, 5);
        g.fillStyle = '#16100e'; g.beginPath(); g.moveTo(cx - 175 * U, mid); g.lineTo(cx + 175 * U, mid); g.quadraticCurveTo(cx + 165 * U, fy - 10 * U, cx, fy); g.quadraticCurveTo(cx - 165 * U, fy - 10 * U, cx - 175 * U, mid); g.fill();
        g.strokeStyle = '#3a2a24'; g.lineWidth = 6 * U; g.beginPath(); g.ellipse(cx, mid, 175 * U, 26 * U, 0, 0, 7); g.stroke();
        const og = g.createRadialGradient(cx, mid, 0, cx, mid, 170 * U); og.addColorStop(0, '#ffe08a'); og.addColorStop(0.6, '#e08a20'); og.addColorStop(1, '#7a3a08'); g.fillStyle = og; g.beginPath(); g.ellipse(cx, mid, 170 * U, 23 * U, 0, 0, 7); g.fill();
        for (let i = 0; i < 26; i++) { const bx = cx + Math.sin(i * 7.3) * 150 * U, ph = (t * 2.5 + i * 0.27) % 1; g.fillStyle = `rgba(255,245,200,${0.9 * (1 - ph)})`; g.beginPath(); g.arc(bx, mid - ph * 14 * U, (2 + ph * 7) * U, 0, 7); g.fill(); }
        const drop = ease(k / 1.3), into = k > 1.3; const vx = cx + 170 * U - drop * 160 * U, vy = Hh * 0.4 + drop * drop * (mid - Hh * 0.4);
        if (!into) sinner(g, vx, vy, U * 1.2, { la: -2.8, ra: -0.3, ll: 0.6, rl: 2.6, lean: drop * 2.2, head: 0.5 }, t);
        else { g.save(); g.beginPath(); g.rect(0, 0, W, mid + 4 * U); g.clip(); sinner(g, cx + Math.sin(t * 7) * 20 * U, mid + 30 * U - Math.abs(Math.sin(t * 6)) * 14 * U, U * 1.2, { la: -2.0 + Math.sin(t * 14) * 0.6, ra: -1.1 - Math.sin(t * 13) * 0.6, ll: 1.5, rl: 1.5, head: -0.6 }, t, '#e8a88a'); g.restore(); if (Math.random() < 0.6) addBlood(cx, mid - 6 * U, 2, 4, t); }
        guard(g, cx + 240 * U, fy + 4 * U, U * 0.7, 1, -2.2 + Math.min(1, k / 1.3) * 0.9, t, 'fork');
        for (let i = 0; i < 6; i++) { const ph = (t * 0.4 + i / 6) % 1; g.fillStyle = `rgba(230,220,210,${0.18 * (1 - ph)})`; g.beginPath(); g.arc(cx + Math.sin(i * 3 + t) * 100 * U, mid - ph * 220 * U, (30 + ph * 60) * U, 0, 7); g.fill(); }
      } else if (kind === 2) { // 拔舌
        const vx = cx - 100 * U, vy = fy - 30 * U; sinner(g, vx, vy, U * 1.5, { la: 0.9, ra: 2.2, ll: 2.4, rl: 0.7, lean: 0.25, head: 0.35 + Math.sin(t * 15) * 0.06 }, t);
        g.strokeStyle = '#4a4a54'; g.lineWidth = 4 * U; g.setLineDash([7 * U, 4 * U]); g.beginPath(); g.moveTo(vx - 30 * U, vy - 40 * U); g.lineTo(cx - 220 * U, fy); g.stroke(); g.setLineDash([]);
        const pull = ease(k / 3) * 115 * U + Math.sin(t * 22) * 3 * U, sc = U * 1.5, mx = vx + Math.sin(0.25) * 78 * sc + 6 * sc, my = vy - Math.cos(0.25) * 78 * sc + 6 * sc;
        g.fillStyle = '#c0283a'; g.strokeStyle = '#3a0606'; g.lineWidth = 2 * U; g.beginPath(); g.moveTo(mx, my - 4 * U); g.quadraticCurveTo(mx + pull * 0.5, my - 20 * U - Math.sin(t * 6) * 8 * U, mx + pull, my - 10 * U); g.lineTo(mx + pull, my + 8 * U); g.quadraticCurveTo(mx + pull * 0.5, my + 2 * U, mx, my + 5 * U); g.closePath(); g.fill(); g.stroke();
        guard(g, Math.min(W - 40 * U, mx + pull + 50 * U), my + 135 * U, U * 0.66, 0, Math.PI - 0.35, t, 'pincer');
        if (Math.random() < 0.7) addBlood(mx + 4 * U, my + 4 * U, 2, 2.5, t);
        g.fillStyle = 'rgba(120,0,0,.9)'; g.beginPath(); g.ellipse(vx + 10 * U, fy + 4 * U, (40 + k * 18) * U, 9 * U, 0, 0, 7); g.fill();
      } else { // 石磨
        const mx = cx + 20 * U, my = fy - 70 * U, rot = t * 2.4;
        g.fillStyle = '#3a3430'; g.beginPath(); g.ellipse(mx, my + 40 * U, 160 * U, 38 * U, 0, 0, 7); g.fill();
        const sg = g.createLinearGradient(mx - 140 * U, 0, mx + 140 * U, 0); sg.addColorStop(0, '#2a2622'); sg.addColorStop(0.5, '#6a645c'); sg.addColorStop(1, '#2a2622'); g.fillStyle = sg; g.fillRect(mx - 140 * U, my - 50 * U, 280 * U, 82 * U);
        g.strokeStyle = 'rgba(20,16,14,.7)'; g.lineWidth = 3 * U; for (let i = 0; i < 10; i++) { const x = ((i * 28 + rot * 50) % 280) - 140; g.beginPath(); g.moveTo(mx + x * U, my - 50 * U); g.lineTo(mx + x * U, my + 32 * U); g.stroke(); }
        g.fillStyle = '#5a5048'; g.beginPath(); g.ellipse(mx, my - 50 * U, 140 * U, 26 * U, 0, 0, 7); g.fill();
        const hx = mx + Math.cos(rot) * 120 * U, hz = Math.sin(rot); g.strokeStyle = '#2a1a10'; g.lineWidth = 9 * U; g.beginPath(); g.moveTo(mx, my - 50 * U); g.lineTo(hx, my - 50 * U + hz * 20 * U); g.stroke();
        guard(g, hx + 40 * U, my + 30 * U, U * 0.6, 1, Math.PI + 0.4, t, null);
        const sink = ease(k / 3); if (sink < 1) { g.save(); g.beginPath(); g.rect(0, 0, W, my - 52 * U); g.clip(); sinner(g, mx - 20 * U, my - 100 * U + sink * 120 * U, U * 1.3, { la: -2.9 + Math.sin(t * 13) * 0.3, ra: -0.2 - Math.sin(t * 12) * 0.3, ll: 1.5, rl: 1.6, head: -0.5 }, t); g.restore(); }
        g.fillStyle = '#7a0000'; for (let i = 0; i < 12; i++) { const ph = (t * 0.7 + i * 0.083) % 1; g.beginPath(); g.ellipse(mx - 150 * U + i * 27 * U, my + 30 * U + ph * 60 * U, 4 * U, (6 + ph * 14) * U, 0, 0, 7); g.fill(); }
        g.fillStyle = '#5a0000'; g.beginPath(); g.ellipse(mx, fy + 12 * U, 200 * U * ease(k / 3), 14 * U, 0, 0, 7); g.fill();
      }
      // 血
      drops.forEach(d => { const a = t - d.t; if (a < 0 || a > 1.6) return; g.fillStyle = '#8a0000'; g.beginPath(); g.ellipse(d.x + d.vx * a * 60 * U, d.y + (d.vy * a * 60 + a * a * 260) * U, d.r * U, d.r * U * (1 + a), 0, 0, 7); g.fill(); });
      while (drops.length > 400) drops.shift();
      H.drawEmbers(g, emb, W, Hh, t, dpr, 'rgba(255,170,60,A)', 1.6);
      H.cloudLayer(g, smoke, W, Hh, 2 * U, t * 30 * U, -t * 20 * U, 0.35);
      g.restore();
      // 金色邊框＋標題（像寺廟壁畫的題字）
      g.strokeStyle = 'rgba(200,150,60,.85)'; g.lineWidth = 5 * U; g.strokeRect(10 * U, 10 * U, W - 20 * U, Hh - 20 * U); g.lineWidth = 1.5 * U; g.strokeRect(18 * U, 18 * U, W - 36 * U, Hh - 36 * U);
      g.fillStyle = 'rgba(80,0,0,.12)'; g.fillRect(0, 0, W, Hh);
      H.vignette(g, W, Hh, 0.8); H.grain(g, W, Hh, 0.1);
      tt(`十八層地獄・${PUN}`, Hh * 0.08, 30, '#ffd890', ease(k / 0.6));
      if (vName) tt(`${vName} 破產了`, Hh * 0.94, 20, '#ffb8a0', ease((k - 0.8) / 0.5));
      if (k < 0.35) { g.fillStyle = `rgba(0,0,0,${1 - k / 0.35})`; g.fillRect(0, 0, W, Hh); }
      if (t > 7.9) { g.fillStyle = `rgba(0,0,0,${(t - 7.9) * 2})`; g.fillRect(0, 0, W, Hh); }
    }, snd);
  };
})(typeof window !== 'undefined' ? window : globalThis);
