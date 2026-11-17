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
    if (open < 0.03) { g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = r * 0.18; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + r * 0.25, x + r, y); g.stroke(); return; }
    const o = open * 0.62; g.save();
    const lid = new Path2D(); lid.moveTo(x - r * 1.1, y); lid.quadraticCurveTo(x, y - r * o * 1.6, x + r * 1.1, y); lid.quadraticCurveTo(x, y + r * o * 1.6, x - r * 1.1, y);
    g.fillStyle = '#0a0406'; g.beginPath(); g.ellipse(x, y, r * 1.35, r * (0.35 + o * 0.9), 0, 0, 7); g.fill(); // 眼皮的暗色凹陷
    g.clip(lid); const ix = x + look[0] * r * 0.35, iy = y + look[1] * r * 0.2;
    const ig = g.createRadialGradient(ix - r * 0.15, iy - r * 0.15, 0, ix, iy, r * 0.95); ig.addColorStop(0, '#fff2a0'); ig.addColorStop(0.35, '#ffae2a'); ig.addColorStop(0.8, '#e0401a'); ig.addColorStop(1, '#5a0a08');
    g.fillStyle = ig; g.fillRect(x - r * 1.2, y - r, r * 2.4, r * 2);
    g.fillStyle = '#100204'; g.beginPath(); g.ellipse(ix, iy, r * (0.12 + glow * 0.18), r * 0.62, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(ix - r * 0.3, iy - r * 0.25, r * 0.12, 0, 7); g.fill();
    g.restore();
    g.strokeStyle = '#3a0a10'; g.lineWidth = r * 0.14; g.stroke(lid);
    g.save(); g.globalCompositeOperation = 'lighter'; const gg = g.createRadialGradient(x, y, 0, x, y, r * 2.6); gg.addColorStop(0, `rgba(255,120,30,${0.35 * open * (0.7 + glow)})`); gg.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gg; g.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2); g.restore();
  }
  function flyer(g, x, y, s, ph, dir) { // 遠處飛的烏鴉剪影
    g.save(); g.translate(x, y); g.scale(s * dir, s); g.fillStyle = '#07040a';
    g.beginPath(); g.ellipse(0, 0, 26, 9, -0.1, 0, 7); g.fill(); g.beginPath(); g.arc(-26, -3, 7, 0, 7); g.fill(); g.beginPath(); g.moveTo(-32, -4); g.lineTo(-46, -1); g.lineTo(-32, 1); g.fill();
    g.beginPath(); g.moveTo(24, 0); g.lineTo(44, -6); g.lineTo(44, 8); g.fill();
    const a = Math.sin(ph) * 1.1; [-1, 1].forEach(sd => { g.save(); g.scale(1, sd); g.rotate(a * sd * -1 * sd); g.beginPath(); g.moveTo(-8, -4); g.quadraticCurveTo(0, -38, 30, -58 * Math.cos(a)); g.lineTo(16, -30); g.lineTo(26, -26); g.lineTo(10, -14); g.lineTo(16, -6); g.closePath(); g.fill(); g.restore(); });
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
    return ui.overlay(5000, (g, W, Hh, dpr, t) => {
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
      const C = crowSprite(), sc = Math.min(W / C.W, Hh / C.H) * (0.95 + ease(t / 3) * 0.08 + (t > 3.2 ? ease((t - 3.2) / 0.6) * 0.9 : 0));
      const rot = t > 3.2 ? ease((t - 3.2) / 0.5) * 0.35 : Math.sin(t * 0.8) * 0.02;
      g.save(); g.translate(cx + W * 0.08, Hh + 10 * U); g.rotate(rot); g.scale(sc, sc); g.translate(-C.W / 2, -C.H);
      g.drawImage(C.c, 0, 0);
      const look = t < 2.8 ? [Math.sin(t * 2.3) * 0.8, Math.cos(t * 1.7) * 0.6] : [-0.2, 0.25];
      order.forEach((idx, k) => { const [ex, ey, er] = EYES[idx], o = clamp((t - 0.5 - k * 0.11) * 3.5), bl = (Math.sin(t * 3 + idx * 7) > 0.97) ? 0.1 : 1; eye(g, ex, ey, er, o * bl, look, t > 3.0 ? 0.8 : 0.2); });
      g.restore();
      // 一大群烏鴉從鏡頭前橫掃
      if (t > 3.6) rush.forEach(p => { const k = (t - 3.6 - p.d) / 0.9; if (k < 0 || k > 1) return; flyer(g, W * (1.2 - k * 1.5), p.y * Hh, p.s * U, t * 14 + p.p, 1); });
      if (t > 4.1) { g.fillStyle = `rgba(0,0,0,${clamp((t - 4.1) * 2.2)})`; g.fillRect(-20, -20, W + 40, Hh + 40); }
      g.restore();
      H.vignette(g, W, Hh, 0.9); H.grain(g, W, Hh, 0.1);
      const tt = (txt, y, px, col, a) => { g.save(); g.globalAlpha = a; g.font = `900 ${Math.round(px * dpr)}px "Songti TC","Noto Serif TC","Noto Serif CJK TC",serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#000'; g.shadowBlur = 14 * dpr; g.fillStyle = col; g.fillText(txt, W / 2, y); g.restore(); };
      tt('多 眼 鳥 夜 啼', Hh * 0.1, 36, '#f0c8a0', ease(t / 0.8) * (t > 3.2 ? Math.max(0, 1 - (t - 3.2) * 3) : 1));
      if (t > 4.3) tt('被盯上了：接下來 3 次過路費加倍', Hh * 0.5, 22, '#ffb890', clamp((t - 4.3) * 4));
    }, snd);
  };
})(typeof window !== 'undefined' ? window : globalThis);
