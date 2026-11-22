// 音樂遊戲共用：樂器合成（Web Audio）、手機鍵盤＋打擊墊、錄音資料的播放
// 音符資料：[t 毫秒, k, d 毫秒]；k 0～35＝C3 起算的半音（三個八度），100～103＝打擊墊（大鼓、小鼓、拍手、鈸）
(function (root) {
  const INSTS = { p: '🎹 鋼琴', e: '🎛️ 電子琴', m: '🎶 八音盒' };
  const DRUMS = [['大鼓', '🥁'], ['小鼓', '🪘'], ['拍手', '👏'], ['鈸', '🔔']];
  const NAMES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  const MAX_MS = 10000, MAX_NOTES = 300;

  function A() { return root.GFX && root.GFX.audio ? root.GFX.audio() : null; }
  let noiseBuf = null, noiseCtx = null;
  function noise(c) {
    if (!noiseBuf || noiseCtx !== c) { noiseCtx = c; noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = c.createBufferSource(); s.buffer = noiseBuf; return s;
  }
  const freq = (k) => 130.81 * Math.pow(2, k / 12); // k=0 → C3

  // 發一個音；回傳 stop(t)：放開按鍵時收尾（打擊樂器不用收）
  function voice(k, inst, t, a) {
    a = a || A(); if (!a) return () => {};
    const c = a.ctx, out = a.out; t = Math.max(t || 0, c.currentTime);
    if (k >= 100) { drum(k - 100, t, c, out); return () => {}; }
    const f = freq(k), g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = inst === 'e' ? 2200 : 4200; lp.connect(g); g.connect(out);
    const oscs = [];
    const osc = (type, mul, vol) => { const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = f * mul; og.gain.value = vol; o.connect(og); og.connect(lp); o.start(t); oscs.push(o); };
    let peak = 0.22, hold;
    if (inst === 'm') { osc('sine', 2, 0.8); osc('triangle', 4, 0.12); peak = 0.16; hold = 1.2; }
    else if (inst === 'e') { osc('sine', 1, 0.8); osc('sine', 2, 0.25); osc('square', 1, 0.04); peak = 0.2; hold = 3; }
    else { osc('triangle', 1, 0.7); osc('sine', 2, 0.25); osc('sine', 3, 0.06); hold = 2.2; }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(peak * (inst === 'e' ? 0.6 : 0.3), t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + hold);
    oscs.forEach(o => o.stop(t + hold + 0.05));
    let done = false;
    // stop(te)：放開按鍵時在 te 收尾；stop(0, true)：播放被中斷，馬上靜音（包含還沒開始的音）
    return (te, cancel) => {
      if (cancel) { try { const n = c.currentTime; g.gain.cancelScheduledValues(0); g.gain.setValueAtTime(0.0001, n); oscs.forEach(o => { try { o.stop(n + 0.02); } catch (e) {} }); } catch (e) {} return; }
      if (done) return; done = true; te = Math.max(te || 0, c.currentTime, t + 0.06);
      if (inst === 'm') return; // 八音盒放開也繼續響完
      try { g.gain.cancelScheduledValues(te); g.gain.setValueAtTime(Math.max(0.0002, peak * 0.3), te); g.gain.exponentialRampToValueAtTime(0.0001, te + 0.18); oscs.forEach(o => { try { o.stop(te + 0.22); } catch (e) {} }); } catch (e) {}
    };
  }
  function drum(i, t, c, out) {
    const g = c.createGain(); g.connect(out);
    if (i === 0) { const o = c.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.25); o.connect(g); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.start(t); o.stop(t + 0.4); return; }
    const n = noise(c), f = c.createBiquadFilter(); n.connect(f); f.connect(g);
    if (i === 1) { f.type = 'bandpass'; f.frequency.value = 1800; g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); const o = c.createOscillator(), og = c.createGain(); o.frequency.value = 190; og.gain.setValueAtTime(0.3, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.12); n.start(t); n.stop(t + 0.22); }
    else if (i === 2) { f.type = 'bandpass'; f.frequency.value = 1200; [0, 0.012, 0.024].forEach(d => { g.gain.setValueAtTime(0.8, t + d); g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.01); }); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); n.start(t); n.stop(t + 0.18); }
    else { f.type = 'highpass'; f.frequency.value = 6000; g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1); n.start(t); n.stop(t + 1.15); }
  }

  // 播放一段錄好的音符；回傳 { stop(), dur }
  function play(notes, inst, onEnd) {
    const a = A(); if (!a || !notes || !notes.length) { if (onEnd) setTimeout(onEnd, 50); return { stop() {}, dur: 0 }; }
    const t0 = a.ctx.currentTime + 0.08; const stops = [];
    notes.forEach(([t, k, d]) => { const s = voice(k, inst, t0 + t / 1000, a); stops.push(s); if (k < 100) s(t0 + (t + Math.max(80, d || 200)) / 1000); });
    const dur = Math.max(...notes.map(n => n[0] + (n[1] >= 100 ? 300 : Math.max(80, n[2] || 200)))) + 400;
    const tm = onEnd ? setTimeout(onEnd, dur + 100) : null;
    return { dur, stop() { clearTimeout(tm); const now = a.ctx.currentTime; stops.forEach(s => s(now, true)); } };
  }

  // 檢查／清理玩家送來的音符資料（房主端用，防亂送）
  function clean(notes) {
    if (!Array.isArray(notes)) return [];
    const out = [];
    for (const n of notes.slice(0, MAX_NOTES)) {
      if (!Array.isArray(n)) continue;
      const t = Math.round(+n[0]), k = Math.round(+n[1]), d = Math.round(+n[2] || 0);
      if (!(t >= 0 && t <= MAX_MS)) continue;
      if (!((k >= 0 && k <= 35) || (k >= 100 && k <= 103))) continue;
      out.push([t, k, Math.max(0, Math.min(3000, d))]);
    }
    return out.sort((a, b) => a[0] - b[0]);
  }

  // ===== 手機鍵盤：一次一個八度（低／中／高切換）＋ 4 個打擊墊；可錄音 =====
  // Kb.mount(el, { inst, onChange }) → 回傳控制物件；錄音資料存在 kb.notes
  function mountKeyboard(el, opt) {
    const kb = { inst: opt.inst || 'p', oct: 1, rec: false, t0: 0, notes: opt.notes ? opt.notes.slice() : [], held: {}, player: null };
    const whites = [0, 2, 4, 5, 7, 9, 11], blacks = [[1, 0], [3, 1], [6, 3], [8, 4], [10, 5]]; // [半音, 在第幾個白鍵後面]
    el.innerHTML = `<div class="mk">
      <div class="mk-bar">
        <div class="mk-seg" data-r="inst">${Object.entries(INSTS).map(([k, v]) => `<button data-inst="${k}">${v}</button>`).join('')}</div>
        <div class="mk-seg" data-r="oct">${['低', '中', '高'].map((x, i) => `<button data-oct="${i}">${x}</button>`).join('')}</div>
      </div>
      <div class="mk-keys">${whites.map((s, i) => `<button class="w" data-s="${s}"><small>${NAMES[s]}</small></button>`).join('')}
        ${blacks.map(([s, after]) => `<button class="b" data-s="${s}" style="left:calc(${(after + 1) / 7 * 100}% - 6.5%)"></button>`).join('')}</div>
      <div class="mk-drums">${DRUMS.map((d, i) => `<button data-d="${i}">${d[1]}<small>${d[0]}</small></button>`).join('')}</div>
    </div>`;
    const sync = () => {
      el.querySelectorAll('[data-inst]').forEach(b => b.classList.toggle('on', b.dataset.inst === kb.inst));
      el.querySelectorAll('[data-oct]').forEach(b => b.classList.toggle('on', +b.dataset.oct === kb.oct));
    };
    sync();
    el.querySelectorAll('[data-inst]').forEach(b => b.onclick = () => { if (kb.notes.length && kb.inst !== b.dataset.inst && opt.lockInst) return; kb.inst = b.dataset.inst; sync(); opt.onChange && opt.onChange(kb); });
    el.querySelectorAll('[data-oct]').forEach(b => b.onclick = () => { kb.oct = +b.dataset.oct; sync(); });
    const now = () => performance.now();
    function down(k, id) {
      const a = A(); if (!a) return;
      if (a.ctx.state !== 'running') a.ctx.resume();
      const stop = voice(k, kb.inst, 0, a);
      let idx = -1;
      if (kb.rec) {
        if (!kb.notes.length) kb.t0 = now();
        const t = Math.round(now() - kb.t0);
        if (t <= MAX_MS && kb.notes.length < MAX_NOTES) { kb.notes.push([t, k, 0]); idx = kb.notes.length - 1; }
        if (t > MAX_MS) { kb.rec = false; opt.onChange && opt.onChange(kb); }
        else opt.onChange && opt.onChange(kb);
      }
      kb.held[id] = { stop, idx, at: now() };
    }
    function up(id) {
      const h = kb.held[id]; if (!h) return; delete kb.held[id];
      h.stop();
      if (h.idx >= 0 && kb.notes[h.idx]) kb.notes[h.idx][2] = Math.min(3000, Math.round(now() - h.at));
    }
    const bind = (b, kf) => {
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} b.classList.add('down'); down(kf(), e.pointerId); });
      const end = (e) => { b.classList.remove('down'); up(e.pointerId); };
      b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); b.addEventListener('lostpointercapture', end);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    };
    el.querySelectorAll('.mk-keys [data-s]').forEach(b => bind(b, () => kb.oct * 12 + +b.dataset.s));
    el.querySelectorAll('[data-d]').forEach(b => bind(b, () => 100 + +b.dataset.d));
    kb.start = () => { kb.stopPlay(); kb.notes = []; kb.rec = true; kb.t0 = 0; opt.onChange && opt.onChange(kb); };
    kb.stopRec = () => { kb.rec = false; opt.onChange && opt.onChange(kb); };
    kb.preview = () => { kb.stopPlay(); kb.player = play(kb.notes, kb.inst, () => { kb.player = null; opt.onChange && opt.onChange(kb); }); opt.onChange && opt.onChange(kb); };
    kb.stopPlay = () => { if (kb.player) { kb.player.stop(); kb.player = null; } };
    // 疊錄：保留原本的音，一邊播一邊再用鍵盤／鼓加音（時間從播放開始算）
    kb.overdub = () => { if (!kb.notes.length) return; kb.stopPlay(); kb.t0 = now(); kb.rec = true; kb.player = play(kb.notes, kb.inst, () => { kb.player = null; opt.onChange && opt.onChange(kb); }); opt.onChange && opt.onChange(kb); };
    kb.setNotes = (n) => { kb.stopPlay(); kb.rec = false; kb.notes = (n || []).slice(); opt.onChange && opt.onChange(kb); };
    kb.elapsed = () => kb.rec && kb.notes.length ? Math.min(MAX_MS, now() - kb.t0) : 0;
    return kb;
  }


  // ===== 哼歌轉樂器：對麥克風哼，即時抓音高、對到最近的半音，轉成音符資料（別人聽到的是樂器聲，不是本人的聲音）=====
  // 音高偵測：自相關法（ACF2+），只收 70～1000 Hz；同一個半音連續 2 格（約 60 毫秒）才算開始一個音，避免抖動
  function detectPitch(buf, sr) {
    let n = buf.length, rms = 0;
    for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / n);
    if (rms < 0.012) return { f: -1, rms };
    let r1 = 0, r2 = n - 1; const th = 0.2;
    for (let i = 0; i < n / 2; i++) if (Math.abs(buf[i]) < th) { r1 = i; break; }
    for (let i = 1; i < n / 2; i++) if (Math.abs(buf[n - i]) < th) { r2 = n - i; break; }
    const b = buf.slice(r1, r2); n = b.length;
    const maxLag = Math.min(n - 1, Math.floor(sr / 70)), minLag = Math.floor(sr / 1000);
    const c = new Float32Array(maxLag + 1);
    for (let i = 0; i <= maxLag; i++) { let sum = 0; for (let j = 0; j < n - i; j++) sum += b[j] * b[j + i]; c[i] = sum; }
    let d = 0; while (d < maxLag && c[d] > c[d + 1]) d++;
    let mx = -1, T = -1;
    for (let i = Math.max(d, minLag); i <= maxLag; i++) if (c[i] > mx) { mx = c[i]; T = i; }
    if (T <= 0 || mx < c[0] * 0.3) return { f: -1, rms };
    const x1 = c[T - 1] || 0, x2 = c[T], x3 = c[T + 1] || 0, aa = (x1 + x3 - 2 * x2) / 2, bb = (x3 - x1) / 2;
    const t0 = aa ? T - bb / (2 * aa) : T;
    return { f: sr / t0, rms };
  }
  // 整理哼出來的音：同一個音中間只斷一下（<150 毫秒）就接起來；換音時滑過去產生的短音（<120 毫秒）拿掉
  function tidy(notes) {
    const out = [];
    for (const n of notes) {
      const p = out[out.length - 1];
      if (p && p[1] === n[1] && n[0] - (p[0] + p[2]) < 150) { p[2] = n[0] + n[2] - p[0]; continue; }
      out.push(n.slice());
    }
    return out.filter(n => n[2] >= 120);
  }
  // 把哼出來的音整體移到樂器好聽的音域（中位數落在中間那個八度），超出範圍的音折回來
  function fitRange(notes) {
    if (!notes.length) return notes;
    const ms = notes.map(n => n[1]).sort((a, b) => a - b), med = ms[Math.floor(ms.length / 2)];
    const shift = 12 * Math.round((66 - med) / 12) - 48; // 整個八度移動，讓中位數落在 C4～B4 附近，再換成 k（C3＝0）
    return notes.map(([t, m, d]) => { let k = m + shift; while (k < 0) k += 12; while (k > 35) k -= 12; return [t, k, d]; });
  }
  async function getMic() {
    const V = root.Net && root.Net.Voice;
    const tr = V && V.stream && V.stream.getAudioTracks().find(t => t.readyState === 'live');
    if (tr) { const c = tr.clone(); c.enabled = true; return { stream: new MediaStream([c]), own: true }; } // 借語音的麥克風（複製一份，原本那條另外關掉）
    const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    return { stream: st, own: true };
  }
  function humRecorder(opt) {
    const H = { notes: [], rec: false, live: null, level: 0, err: '' };
    let mic = null, src = null, an = null, sink = null, iv = null, t0 = 0, first = 0, cur = null, cand = null;
    const now = () => performance.now();
    const close = (t) => { if (cur) { const d = Math.round(t - cur.t); if (d >= 80 && H.notes.length < MAX_NOTES) H.notes.push([Math.round(cur.t), cur.m, Math.min(3000, d)]); cur = null; } };
    H.start = async () => {
      H.stop(true); H.err = ''; H.notes = []; cur = null; cand = null; first = 0;
      const a = A(); if (!a) { H.err = '這台裝置不支援音效'; return false; }
      if (a.ctx.state !== 'running') { try { await a.ctx.resume(); } catch (e) {} }
      try { mic = await getMic(); } catch (e) { H.err = '沒有拿到麥克風權限（請在瀏覽器允許使用麥克風）'; return false; }
      try { root.Net && root.Net.Voice && root.Net.Voice.setHold(true); } catch (e) {}
      const c = a.ctx; src = c.createMediaStreamSource(mic.stream); an = c.createAnalyser(); an.fftSize = 2048;
      sink = c.createGain(); sink.gain.value = 0; src.connect(an); an.connect(sink); sink.connect(c.destination); // 接到靜音輸出，Safari 才會持續分析
      const buf = new Float32Array(an.fftSize); t0 = now(); H.rec = true;
      iv = setInterval(() => {
        an.getFloatTimeDomainData(buf);
        const r = detectPitch(buf, c.sampleRate), tn = now();
        H.level = Math.min(1, r.rms * 8);
        if (first && tn - first > MAX_MS) { H.stop(); opt.onChange && opt.onChange(H); return; }
        const t = first ? tn - first : 0;
        if (r.f < 70 || r.f > 1000) { if (first) close(t); cand = null; H.live = null; opt.onChange && opt.onChange(H); return; }
        const midi = 69 + 12 * Math.log2(r.f / 440), m = Math.round(midi);
        H.live = m;
        if (cur && Math.abs(midi - cur.m) < 0.7) { opt.onChange && opt.onChange(H); return; }
        if (cand && cand.m === m) cand.n++; else cand = { m, n: 1, at: tn };
        if (cand.n >= 2) {
          if (!first) first = cand.at;
          const ts = cand.at - first; close(ts); cur = { m, t: ts }; cand = null;
        }
        opt.onChange && opt.onChange(H);
      }, 30);
      opt.onChange && opt.onChange(H);
      return true;
    };
    // 停止：收尾、關麥克風、恢復語音；回傳轉好的音符（已移到好聽的音域）
    H.stop = (silent) => {
      const was = H.rec;
      clearInterval(iv); iv = null;
      if (was && first) close(now() - first);
      try { src && src.disconnect(); an && an.disconnect(); sink && sink.disconnect(); } catch (e) {}
      if (mic) { mic.stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} }); mic = null; }
      try { root.Net && root.Net.Voice && root.Net.Voice.setHold(false); } catch (e) {}
      H.rec = false; H.live = null; H.level = 0;
      if (was) H.notes = fitRange(tidy(H.notes));
      if (!silent) opt.onChange && opt.onChange(H);
      return H.notes;
    };
    H.elapsed = () => (H.rec && first ? Math.min(MAX_MS, now() - first) : 0);
    return H;
  }
  const NOTE_NAME = (m) => (m == null ? '' : NAMES[((m % 12) + 12) % 12]);

  root.MUSIC = { INSTS, DRUMS, MAX_MS, MAX_NOTES, voice, play, clean, mountKeyboard, freq, humRecorder, detectPitch, fitRange, tidy, NOTE_NAME };
})(typeof window !== 'undefined' ? window : globalThis);
