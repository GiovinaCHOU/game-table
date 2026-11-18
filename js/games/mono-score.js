// 彩蛋配樂工具：用 Web Audio 即時合成恐怖／魔幻的聲音層（耳語、尖叫、合唱、心跳、門吱嘎、鐘、嗩吶、豎琴、閃光音……）
// 用法：const K = MONO_SCORE.kit(SFX); K.whisper(0.5, 2) …（第一個參數都是「幾秒後開始」）
(function (root) {
  'use strict';
  const rnd = (a, b) => a + Math.random() * (b - a);
  let cache = null;
  function kit(SFX) {
    if (!SFX || !SFX.on) return null;
    let c; try { c = SFX.ac(); } catch (e) { return null; }
    if (!cache || cache.c !== c) {
      // 主輸出：壓縮器避免爆音＋一個很長很暗的殘響（大廳／地府的空間感）
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.3;
      const out = c.createGain(); out.gain.value = 0.9; out.connect(comp).connect(c.destination);
      const len = c.sampleRate * 5, buf = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { lp = lp * 0.82 + (Math.random() * 2 - 1) * 0.18; d[i] = lp * Math.pow(1 - i / len, 2.2) * 2.4; } }
      const cv = c.createConvolver(); cv.buffer = buf; const wet = c.createGain(); wet.gain.value = 0.55; cv.connect(wet).connect(comp);
      const nb = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      cache = { c, out, rev: cv, noise: nb };
    }
    const { out, rev, noise } = cache, now = c.currentTime + 0.03;
    const at = (t) => now + t;
    // 接到輸出（乾聲＋殘響），回傳要接的節點
    const bus = (wet, pan) => { const g = c.createGain(); let n = g; if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); n = p; } n.connect(out); if (wet) { const w = c.createGain(); w.gain.value = wet; n.connect(w).connect(rev); } return g; };
    const env = (g, t, a, hold, r, v) => { g.gain.setValueAtTime(0.0001, at(t)); g.gain.exponentialRampToValueAtTime(v, at(t) + a); g.gain.setValueAtTime(v, at(t) + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, at(t) + a + hold + r); };
    const osc = (type, f, t, d) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, at(t)); o.start(at(t)); o.stop(at(t) + d + 0.1); return o; };
    const nz = (t, d) => { const s = c.createBufferSource(); s.buffer = noise; s.loop = true; s.start(at(t), Math.random() * 3); s.stop(at(t) + d + 0.1); return s; };
    const filt = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; };
    const lfo = (param, t, d, rate, depth) => { const o = osc('sine', rate, t, d), g = c.createGain(); g.gain.value = depth; o.connect(g).connect(param); };
    const K = {
      // 低沉的持續嗡鳴（幾個差一點點的音一起拍頻，慢慢膨脹）
      drone(t, d, fs, o) { o = o || {}; const g = bus(o.wet == null ? 0.6 : o.wet), lp = filt('lowpass', o.lp || 300, 2); lp.connect(g); env(g, t, o.a || 1.2, Math.max(0, d - (o.a || 1.2) - (o.r || 1)), o.r || 1, o.vol || 0.08);
        if (o.sweep) lp.frequency.exponentialRampToValueAtTime(o.sweep, at(t) + d); lfo(lp.frequency, t, d, o.rate || 0.2, (o.lp || 300) * 0.4);
        fs.forEach((f, i) => { const s = osc(o.type || 'sawtooth', f, t, d); s.detune.value = (i % 2 ? 1 : -1) * (o.det || 9); if (o.bend) s.frequency.exponentialRampToValueAtTime(f * o.bend, at(t) + d); s.connect(lp); }); },
      // 次低頻撞擊／下墜
      boom(t, f0, f1, d, vol) { const g = bus(0.3); env(g, t, 0.005, 0, d, vol || 0.5); const s = osc('sine', f0, t, d); s.frequency.exponentialRampToValueAtTime(f1, at(t) + d); s.connect(g);
        const n = nz(t, 0.3), lp = filt('lowpass', 900), g2 = bus(0.4); env(g2, t, 0.003, 0, 0.35, (vol || 0.5) * 0.5); n.connect(lp).connect(g2); },
      // 濾波雜訊掃頻（風、呼嘯、倒放鈸）
      sweep(t, d, f0, f1, o) { o = o || {}; const n = nz(t, d), b = filt(o.type || 'bandpass', f0, o.q == null ? 1.2 : o.q), g = bus(o.wet == null ? 0.5 : o.wet, o.pan); b.frequency.exponentialRampToValueAtTime(f1, at(t) + d); n.connect(b).connect(g);
        if (o.rev) { g.gain.setValueAtTime(0.0001, at(t)); g.gain.exponentialRampToValueAtTime(o.vol || 0.15, at(t) + d); g.gain.exponentialRampToValueAtTime(0.0001, at(t) + d + 0.05); } else env(g, t, o.a || d * 0.4, 0, d * 0.6, o.vol || 0.12); },
      wind(t, d, vol) { const n = nz(t, d), b = filt('bandpass', 500, 3), g = bus(0.6); lfo(b.frequency, t, d, 0.17, 320); lfo(g.gain, t, d, 0.31, (vol || 0.08) * 0.5); n.connect(b).connect(g); env(g, t, 1.2, d - 2.2, 1, vol || 0.08); },
      // 耳語：窄頻雜訊的「嘶、噓」加上忽大忽小的氣音，左右亂飄
      whisper(t, d, vol, n) { for (let k = 0; k < (n || 6); k++) { const st = t + rnd(0, d * 0.7), dd = rnd(0.35, 0.9); const s = nz(st, dd), b1 = filt('bandpass', rnd(1800, 4200), 6), b2 = filt('bandpass', rnd(700, 1400), 5), g = bus(0.7, rnd(-0.9, 0.9));
        b1.frequency.linearRampToValueAtTime(rnd(1500, 5000), at(st) + dd); s.connect(b1).connect(g); s.connect(b2).connect(g); lfo(g.gain, st, dd, rnd(6, 13), (vol || 0.05) * 0.8);
        g.gain.setValueAtTime(0.0001, at(st)); g.gain.linearRampToValueAtTime(vol || 0.05, at(st) + dd * 0.3); g.gain.linearRampToValueAtTime(0.0001, at(st) + dd); } },
      // 人聲般的尖叫（鋸齒＋顫音，通過「啊」的共振峰）
      scream(t, d, f, vol, pan) { const g = bus(0.6, pan), mix = c.createGain(); mix.gain.value = 1; [[800, 6], [1150, 7], [2900, 9]].forEach(([ff, q]) => mix.connect(filt('bandpass', ff, q)).connect(g));
        [0, 7, -5].forEach(dt => { const s = osc('sawtooth', f, t, d); s.detune.value = dt; s.frequency.linearRampToValueAtTime(f * 1.25, at(t) + d * 0.25); s.frequency.exponentialRampToValueAtTime(f * 0.55, at(t) + d); lfo(s.frequency, t, d, rnd(5.5, 8), f * 0.035); s.connect(mix); });
        env(g, t, 0.05, d * 0.3, d * 0.65, vol || 0.12); },
      // 合唱（用母音共振峰濾鋸齒波，慢慢浮出來）：v='oo' 陰森、'ah' 神聖
      choir(t, d, fs, o) { o = o || {}; const fm = o.v === 'ah' ? [[730, 8], [1090, 9], [2440, 10]] : [[300, 7], [870, 8], [2240, 10]]; const g = bus(0.9, o.pan), mix = c.createGain(); fm.forEach(([ff, q]) => mix.connect(filt('bandpass', ff, q)).connect(g));
        fs.forEach(f => [0, 1, 2].forEach(k => { const s = osc('sawtooth', f, t, d); s.detune.value = (k - 1) * 11; lfo(s.frequency, t, d, rnd(4.5, 5.8), f * 0.008); if (o.bend) s.frequency.exponentialRampToValueAtTime(f * o.bend, at(t) + d); s.connect(mix); }));
        env(g, t, o.a || 1.5, Math.max(0, d - (o.a || 1.5) - 1.2), 1.2, o.vol || 0.12); },
      // 鐘／鑼：不和諧的泛音，慢慢衰減
      bell(t, f, d, vol, metal) { const g = bus(0.8); (metal ? [1, 1.48, 2.02, 2.74, 3.76, 5.4] : [0.5, 1, 1.19, 1.56, 2, 2.74, 3.76]).forEach((m, i) => { const gg = c.createGain(); env(gg, t, 0.004, 0, d / (1 + i * 0.35), (vol || 0.1) / (1 + i * 0.6)); const s = osc('sine', f * m, t, d); s.detune.value = rnd(-8, 8); s.connect(gg).connect(g); }); env(g, t, 0.004, 0, d, 1); },
      gong(t, f, d, vol) { K.bell(t, f, d, vol, true); const n = nz(t, 1.2), b = filt('bandpass', 2600, 1), g = bus(0.8); env(g, t, 0.01, 0, 1.2, (vol || 0.1) * 0.6); n.connect(b).connect(g); K.boom(t, f * 0.5, f * 0.45, 2, (vol || 0.1) * 1.5); },
      // 心跳（噗通）
      heart(t, n, bpm, vol, accel) { let tt = t, iv = 60 / bpm; for (let k = 0; k < n; k++) { [0, 0.16].forEach((o, j) => { const g = bus(0.15); env(g, tt + o, 0.004, 0, 0.22, (vol || 0.35) * (j ? 0.7 : 1)); const s = osc('sine', j ? 52 : 60, tt + o, 0.25); s.frequency.exponentialRampToValueAtTime(34, at(tt + o) + 0.2); s.connect(g); }); tt += iv; if (accel) iv *= accel; } },
      // 門／木頭吱嘎：低頻鋸齒脈衝通過亮的帶通，頻率抖來抖去
      creak(t, d, vol) { const s = osc('sawtooth', 28, t, d), b = filt('bandpass', 1100, 9), b2 = filt('bandpass', 2300, 12), g = bus(0.6); s.frequency.linearRampToValueAtTime(rnd(14, 22), at(t) + d * 0.5); s.frequency.linearRampToValueAtTime(rnd(30, 44), at(t) + d);
        for (let k = 0; k < 12; k++) s.frequency.setValueAtTime(rnd(16, 46), at(t) + d * k / 12); s.connect(b).connect(g); s.connect(b2).connect(g); env(g, t, 0.08, d - 0.3, 0.22, vol || 0.25); },
      // 低吼（怪物）：鋸齒＋雜訊，振幅亂抖
      growl(t, d, f, vol) { const g = bus(0.5), lp = filt('lowpass', 700, 3), am = c.createGain(); am.gain.value = 0.6; lfo(am.gain, t, d, 23, 0.45); [1, 1.5, 2.01].forEach(m => { const s = osc('sawtooth', f * m, t, d); s.frequency.linearRampToValueAtTime(f * m * 0.8, at(t) + d); lfo(s.frequency, t, d, 7, f * 0.06); s.connect(am); }); const n = nz(t, d), b = filt('bandpass', 400, 1); n.connect(b).connect(am); am.connect(lp).connect(g); env(g, t, 0.15, d * 0.5, d * 0.5 - 0.15, vol || 0.2); },
      // 嚇人的瞬間：刺耳不和諧和弦＋雜訊爆＋次低頻
      stinger(t, vol) { const v = vol || 0.2; [370, 392, 523, 554, 740, 784, 1109].forEach(f => { const g = bus(0.7); env(g, t, 0.003, 0.15, 1.6, v * 0.18); const s = osc('sawtooth', f, t, 1.8); s.frequency.exponentialRampToValueAtTime(f * 0.94, at(t) + 1.8); s.connect(filt('lowpass', 5000)).connect(g); });
        K.sweep(t, 0.6, 6000, 1500, { type: 'bandpass', q: 0.5, vol: v * 0.9, a: 0.005 }); K.boom(t, 90, 28, 1.6, v * 2.2); },
      // 越來越緊張的上升音（像警報般的滑音群）
      riser(t, d, f0, f1, vol) { [0, 0.5, 1.01].forEach(m => { const g = bus(0.5); g.gain.setValueAtTime(0.0001, at(t)); g.gain.exponentialRampToValueAtTime(vol || 0.05, at(t) + d); g.gain.exponentialRampToValueAtTime(0.0001, at(t) + d + 0.08); const s = osc('sawtooth', f0 * (1 + m), t, d); s.frequency.exponentialRampToValueAtTime(f1 * (1 + m), at(t) + d); lfo(s.frequency, t, d, 9, f0 * 0.05); s.connect(filt('lowpass', 2800)).connect(g); }); },
      // 鼓：大鼓／小鼓／鈸
      drum(t, f, vol, dec) { const g = bus(0.25); env(g, t, 0.002, 0, dec || 0.3, vol || 0.4); const s = osc('sine', f * 2.2, t, dec || 0.3); s.frequency.exponentialRampToValueAtTime(f, at(t) + 0.05); s.connect(g); const n = nz(t, 0.06), lp = filt('lowpass', 1500), g2 = bus(0.2); env(g2, t, 0.001, 0, 0.06, (vol || 0.4) * 0.4); n.connect(lp).connect(g2); },
      snare(t, vol) { const n = nz(t, 0.18), b = filt('highpass', 1800), g = bus(0.3); env(g, t, 0.002, 0, 0.16, vol || 0.15); n.connect(b).connect(g); },
      cymbal(t, d, vol) { const n = nz(t, d), b = filt('highpass', 5500), g = bus(0.6); env(g, t, 0.003, 0, d, vol || 0.08); n.connect(b).connect(g); },
      // 鞭炮
      crackers(t, n, vol) { for (let k = 0; k < n; k++) { const st = t + k * rnd(0.03, 0.08); const s = nz(st, 0.04), b = filt('bandpass', rnd(1500, 4500), 1.5), g = bus(0.35, rnd(-0.8, 0.8)); env(g, st, 0.001, 0, 0.035, (vol || 0.2) * rnd(0.5, 1)); s.connect(b).connect(g); } },
      // 嗩吶：鼻音很重的方波＋顫音、每個音前面有一點滑音
      suona(t, notes, step, vol) { notes.forEach((f, i) => { if (!f) return; const st = t + i * step, d = step * 0.95, g = bus(0.45), b = filt('bandpass', 1600, 1.4); const s = osc('square', f * 0.94, st, d), s2 = osc('sawtooth', f * 0.94, st, d);
        [s, s2].forEach(o => { o.frequency.exponentialRampToValueAtTime(f, at(st) + 0.06); lfo(o.frequency, st, d, 6.5, f * 0.018); o.connect(b); }); b.connect(g); env(g, st, 0.02, d * 0.6, d * 0.35, vol || 0.05); }); },
      // 豎琴／音樂盒琶音
      harp(t, notes, step, vol, pan) { notes.forEach((f, i) => { const st = t + i * step, g = bus(0.75, pan == null ? rnd(-0.5, 0.5) : pan); env(g, st, 0.003, 0, 1.6, vol || 0.06); const s = osc('triangle', f, st, 1.7); s.connect(g); const g2 = bus(0.8); env(g2, st, 0.002, 0, 0.6, (vol || 0.06) * 0.35); osc('sine', f * 4, st, 0.7).connect(g2); }); },
      // 魔法閃光：高頻的星星碎音
      shimmer(t, d, base, vol) { for (let k = 0; k < d * 14; k++) { const st = t + rnd(0, d), f = (base || 1800) * Math.pow(2, Math.floor(rnd(0, 18)) / 12), g = bus(0.9, rnd(-0.9, 0.9)); env(g, st, 0.004, 0, rnd(0.3, 0.8), (vol || 0.025) * rnd(0.4, 1)); osc('sine', f, st, 0.9).connect(g); } },
      // 魔幻和弦鋪底（慢慢浮出來的柔軟和弦）
      pad(t, d, fs, vol, bright) { const g = bus(0.9), lp = filt('lowpass', bright || 1600, 0.7); lp.connect(g); lfo(lp.frequency, t, d, 0.25, (bright || 1600) * 0.3); fs.forEach(f => [-7, 7].forEach(dt => { const s = osc('sawtooth', f, t, d); s.detune.value = dt; s.connect(lp); })); env(g, t, Math.min(1.4, d * 0.35), Math.max(0, d - 2.4), 1, vol || 0.04); },
      // 咻：短的呼嘯
      whoosh(t, d, up, vol, pan) { K.sweep(t, d, up ? 400 : 3500, up ? 3500 : 300, { q: 1.5, vol: vol || 0.16, a: d * 0.55, pan }); },
      hiss(t, d, vol) { const n = nz(t, d), b = filt('highpass', 4200), b2 = filt('bandpass', 7000, 2), g = bus(0.3); n.connect(b).connect(g); n.connect(b2).connect(g); env(g, t, 0.15, d - 0.4, 0.25, vol || 0.12); },
      // 火焰燃燒的轟轟聲＋劈啪
      fire(t, d, vol) { const n = nz(t, d), lp = filt('lowpass', 380, 1), g = bus(0.4); lfo(lp.frequency, t, d, 3, 150); n.connect(lp).connect(g); env(g, t, 0.3, d - 0.8, 0.5, vol || 0.2); for (let k = 0; k < d * 9; k++) { const st = t + rnd(0, d), s = nz(st, 0.02), b = filt('bandpass', rnd(1800, 5000), 2), g2 = bus(0.2); env(g2, st, 0.001, 0, 0.02, (vol || 0.2) * rnd(0.2, 0.6)); s.connect(b).connect(g2); } },
      // 石頭碎裂（很多短的喀喀聲）
      crack(t, d, vol) { for (let k = 0; k < d * 30; k++) { const st = t + Math.pow(rnd(0, 1), 1.6) * d, s = nz(st, 0.015), b = filt('bandpass', rnd(600, 3000), 3), g = bus(0.3, rnd(-0.6, 0.6)); env(g, st, 0.001, 0, 0.015, (vol || 0.2) * rnd(0.3, 1)); s.connect(b).connect(g); } K.boom(t + d * 0.8, 110, 40, 0.6, (vol || 0.2) * 1.2); },
      // 撕紙
      tear(t, d, vol) { const n = nz(t, d), b = filt('bandpass', 2600, 1.5), am = c.createGain(), g = bus(0.3); am.gain.value = 0.5; lfo(am.gain, t, d, 38, 0.5); n.connect(b).connect(am).connect(g); env(g, t, 0.01, d * 0.7, d * 0.3, vol || 0.2); },
      // 動物叫聲
      hoot(t, f, vol, pan) { [0, 0.42].forEach((o, j) => { const g = bus(0.9, pan); env(g, t + o, 0.04, 0.1, 0.35, (vol || 0.08) * (j ? 1 : 0.7)); const s = osc('sine', f * (j ? 1 : 1.05), t + o, 0.5); s.frequency.exponentialRampToValueAtTime(f * 0.88, at(t + o) + 0.45); s.connect(g); }); },
      howl(t, d, f, vol) { const g = bus(0.9), mix = c.createGain(); [[700, 5], [1100, 6]].forEach(([ff, q]) => mix.connect(filt('bandpass', ff, q)).connect(g)); const s = osc('sawtooth', f, t, d), s2 = osc('sine', f, t, d);
        [s, s2].forEach(o => { o.frequency.exponentialRampToValueAtTime(f * 1.9, at(t) + d * 0.3); o.frequency.setValueAtTime(f * 1.9, at(t) + d * 0.65); o.frequency.exponentialRampToValueAtTime(f * 1.3, at(t) + d); lfo(o.frequency, t, d, 5, f * 0.02); o.connect(mix); }); s2.connect(g); env(g, t, d * 0.25, d * 0.45, d * 0.3, vol || 0.1); },
      cry(t, d, f, vol) { // 鳥類的高亢長鳴（鳳凰）
        const g = bus(0.8), b = filt('bandpass', f * 1.5, 2); [0, 1].forEach(k => { const s = osc(k ? 'sawtooth' : 'triangle', f, t, d); s.frequency.exponentialRampToValueAtTime(f * 1.7, at(t) + d * 0.2); s.frequency.exponentialRampToValueAtTime(f * 1.2, at(t) + d); lfo(s.frequency, t, d, 11, f * 0.03); s.connect(b); }); b.connect(g); env(g, t, 0.03, d * 0.4, d * 0.55, vol || 0.08); },
      hooves(t, n, step, vol) { for (let k = 0; k < n; k++) [0, 0.07].forEach(o => K.drum(t + k * step + o, 140, (vol || 0.2) * rnd(0.6, 1), 0.08)); },
      chime(t, f, vol) { K.bell(t, f, 2.4, vol || 0.05); },
      // 80 年代合成器：方波／鋸齒波琶音，通過會慢慢打開的低通
      synth(t, notes, step, vol, type, cut) { const lp = filt('lowpass', cut || 1800, 4), g = bus(0.7); lp.connect(g); env(g, t, 0.05, Math.max(0, notes.length * step - 0.3), 0.4, vol || 0.05);
        notes.forEach((f, i) => { if (!f) return; const o = osc(type || 'square', f, t + i * step, step * 0.9), gg = c.createGain(); env(gg, t + i * step, 0.005, step * 0.4, step * 0.45, 1); o.connect(gg).connect(lp); }); },
      // 電吉他強力和弦（失真）
      guitar(t, fs, d, vol) { const ws = c.createWaveShaper(), cur = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; cur[i] = Math.tanh(x * 9); } ws.curve = cur; const g = bus(0.5), lp = filt('lowpass', 3200, 1); ws.connect(lp).connect(g);
        fs.forEach(f => [0, 6].forEach(dt => { const o = osc('sawtooth', f, t, d); o.detune.value = dt; lfo(o.frequency, t, d, 5.5, f * 0.01); o.connect(ws); })); env(g, t, 0.01, d * 0.5, d * 0.5, vol || 0.12); },
      // 電流嗡嗡聲＋燈泡啪滋閃爍
      buzz(t, d, vol) { const o = osc('sawtooth', 60, t, d), b = filt('bandpass', 180, 2), g = bus(0.2), am = c.createGain(); am.gain.value = 0.6; lfo(am.gain, t, d, 13, 0.5); o.connect(b).connect(am).connect(g); env(g, t, 0.05, d - 0.2, 0.15, vol || 0.06);
        for (let k = 0; k < d * 5; k++) { const st = t + rnd(0, d), n = nz(st, 0.03), hb = filt('highpass', 3000), g2 = bus(0.2); env(g2, st, 0.001, 0, 0.03, (vol || 0.06) * 1.5); n.connect(hb).connect(g2); } },
      // 老爺鐘：滴答聲
      tick(t, n, step, vol) { for (let k = 0; k < n; k++) { const st = t + k * step, g = bus(0.5); env(g, st, 0.001, 0, 0.05, (vol || 0.12) * (k % 2 ? 0.7 : 1)); osc('square', k % 2 ? 1900 : 2300, st, 0.06).connect(filt('bandpass', 2200, 8)).connect(g); } }
    };
    return K;
  }
  root.MONO_SCORE = { kit };
})(typeof window !== 'undefined' ? window : globalThis);
