// 音樂版你畫我猜：出題者用畫面上的鍵盤／打擊墊彈出一個詞的感覺（或一首歌的旋律），其他人從選項裡猜
(function (root) {
  const U = root.GUTIL;
  const B = () => root.MUSIC_BANK, MU = () => root.MUSIC;
  const T = { choose: 15000, compose: 75000, guess: 30000, show: 8000 }; // 毫秒（畫面測試會暫時縮短）
  const hash = (...xs) => { let h = 2166136261; for (const x of xs) { h ^= (x | 0) + 0x9e3779b9; h = Math.imul(h, 16777619) >>> 0; } return h; };
  const songLabel = (s) => B().label(s);
  const qText = (q) => (q.k === 'song' ? songLabel(q.s) : q.w);

  function songPool(st) { const S = B().SONGS; const p = S.filter(s => st.cat === 'all' || s.c === st.cat); return p.length >= 4 ? p : S; }
  function pickChoices(st) {
    const out = [], usedW = new Set(st.usedQ);
    const kinds = st.qtype === 'scene' ? ['scene', 'scene', 'scene'] : st.qtype === 'song' ? ['song', 'song', 'song'] : U.shuffle(['scene', 'scene', 'song']);
    for (const k of kinds) {
      if (k === 'scene') { let p = B().SCENES.filter(w => !usedW.has(w) && !out.some(o => o.w === w)); if (!p.length) p = B().SCENES.filter(w => !out.some(o => o.w === w)); const w = p[Math.floor(Math.random() * p.length)]; out.push({ k: 'scene', w }); }
      else { const pool = songPool(st); const dup = (s) => out.some(o => o.s && songLabel(o.s) === songLabel(s)); let p = pool.filter(s => !usedW.has(songLabel(s)) && !dup(s)); if (!p.length) p = pool.filter(s => !dup(s)); const s = p[Math.floor(Math.random() * p.length)]; out.push({ k: 'song', s: { t: s.t, a: s.a, c: s.c } }); }
    }
    return out;
  }
  // 選項：情境題 6 個、歌曲題 4 個（同分類），正解混在裡面
  function makeOpts(st, q) {
    if (q.k === 'scene') {
      const others = U.shuffle(B().SCENES.filter(w => w !== q.w)).slice(0, 5);
      return U.shuffle(others.concat([q.w]));
    }
    const lab = songLabel(q.s);
    let pool = B().SONGS.filter(s => s.c === q.s.c && songLabel(s) !== lab);
    if (pool.length < 3) pool = pool.concat(B().SONGS.filter(s => s.c !== q.s.c));
    return U.shuffle(U.shuffle(pool.slice()).slice(0, 3).map(songLabel).concat([lab]));
  }

  function startTurn(st, now) {
    st.composer = st.order[st.ti % st.n];
    st.phase = 'choose'; st.choices = pickChoices(st); st.q = null; st.notes = null; st.inst = 'p';
    st.answers = {}; st.opts = null; st.turn = st.composer; st.deadline = now + T.choose; st.skipped = false; st.step++;
  }
  function choose(st, i, now) {
    st.q = st.choices[Math.max(0, Math.min(st.choices.length - 1, i | 0))];
    st.usedQ.push(qText(st.q));
    st.phase = 'compose'; st.deadline = now + T.compose; st.step++;
  }
  function startGuess(st, now) {
    st.opts = makeOpts(st, st.q); st.ans = st.opts.indexOf(qText(st.q));
    st.phase = 'guess'; st.turn = null; st.deadline = now + T.guess; st.guessAt = now; st.step++;
  }
  const guessers = (st) => U.range(st.n).filter(i => i !== st.composer);
  function reveal(st, now, skipped) {
    st.skipped = !!skipped;
    const gain = Array(st.n).fill(0);
    if (!skipped) {
      const right = Object.entries(st.answers).filter(([, a]) => a.ok).sort((a, b) => a[1].at - b[1].at);
      right.forEach(([s], k) => { gain[+s] += k === 0 ? 3 : k === 1 ? 2 : 1; });
      gain[st.composer] += right.length;
    }
    gain.forEach((g, i) => { st.scores[i] += g; });
    st.last = { composer: st.composer, q: st.q, gain, skipped: !!skipped, answers: st.answers, opts: st.opts, ans: st.ans };
    st.phase = 'reveal'; st.turn = null; st.deadline = now + T.show; st.revealAt = now; st.step++;
  }
  function afterReveal(st, now) {
    st.ti++;
    if (st.ti >= st.n * st.rounds) { st.phase = 'over'; st.deadline = 0; st.step++; return; }
    startTurn(st, now);
  }
  // 電腦玩家出題：隨機一段旋律（只在測試房，讓測試的人看得到猜題畫面）
  function botTune(st) {
    const out = []; let t = 0, h = hash(st.step, st.ti);
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    for (let i = 0; i < 14; i++) { h = Math.imul(h ^ (h >>> 13), 1103515245) >>> 0; out.push([t, 12 + scale[h % scale.length], 220]); t += 250 + (h % 3) * 125; }
    return out;
  }

  const M = {
    id: 'melody', name: '音樂版你畫我猜', icon: '🎹', min: 3, max: 10,
    desc: '輪流當出題者，從 3 個題目選 1 個，用畫面上的鍵盤和打擊墊彈出來（最多錄 10 秒，可以重錄）。情境題要用音樂表達一個詞（例如「下雨天」「被老闆罵」），歌曲題要彈出那首歌的旋律。其他人聽完從選項裡猜（情境題 6 選 1、歌曲題 4 選 1），每人只能答一次。答對依先後 +3／+2／+1，出題者每有一人答對 +1。猜題時全員麥克風暫時關閉，避免有人直接喊出答案。不用開麥也能玩。',
    options: [
      { key: 'qtype', label: '題型', choices: [['mix', '混合'], ['scene', '只有情境題'], ['song', '只有歌曲題']], def: 'mix' },
      { key: 'cat', label: '歌曲分類（歌曲題用）', choices: [['all', '全部混合'], ['zh', '華語經典'], ['zhnew', '華語近年'], ['tw', '台語'], ['jp', '日文'], ['en', '西洋'], ['ost', '動漫・影視']], def: 'all' },
      { key: 'rounds', label: '每人出題次數', choices: [[1, '1 次'], [2, '2 次']], def: 1 }
    ],
    init(n, o, names, now) {
      now = now == null ? Date.now() : now;
      const st = {
        n, qtype: ['mix', 'scene', 'song'].includes(o.qtype) ? o.qtype : 'mix', cat: (o.cat && (o.cat === 'all' || B().CATS[o.cat])) ? o.cat : 'all',
        rounds: +o.rounds === 2 ? 2 : 1, bots: (names || []).map(x => /^電腦\d+$/.test(String(x))),
        scores: Array(n).fill(0), order: U.shuffle(U.range(n)), ti: 0, usedQ: [], step: 0, last: null
      };
      startTurn(st, now); return st;
    },
    action(st, seat, a, ctx) {
      const now = (ctx && ctx.now) || Date.now();
      if (seat < 0) return 'silent';
      switch (a.type) {
        case 'choose':
          if (st.phase !== 'choose' || seat !== st.composer) return 'silent';
          choose(st, a.i, now); return;
        case 'submit': {
          if (st.phase !== 'compose' || seat !== st.composer) return 'silent';
          const notes = MU().clean(a.notes);
          if (!notes.length) return '還沒錄到任何音';
          st.notes = notes; st.inst = ['p', 'e', 'm'].includes(a.inst) ? a.inst : 'p';
          startGuess(st, now); return;
        }
        case 'skip':
          if ((st.phase !== 'compose' && st.phase !== 'choose') || seat !== st.composer) return 'silent';
          if (!st.q) st.q = st.choices[0];
          reveal(st, now, true); return;
        case 'answer': {
          if (st.phase !== 'guess' || seat === st.composer) return 'silent';
          if (st.answers[seat]) return '你已經答過了';
          const i = a.i | 0; if (i < 0 || i >= st.opts.length) return 'silent';
          st.answers[seat] = { i, ok: i === st.ans, at: now }; st.step++;
          if (guessers(st).every(g => st.answers[g])) reveal(st, now);
          return;
        }
        case 'next':
          if (st.phase === 'reveal') { if (now - st.revealAt < 2500) return 'silent'; afterReveal(st, now); return; }
          if (st.phase === 'over') { st.scores = Array(st.n).fill(0); st.ti = 0; st.order = U.shuffle(U.range(st.n)); st.last = null; startTurn(st, now); return; }
          return 'silent';
      }
      return 'silent';
    },
    tick(st, now) {
      if (st.phase === 'choose' && now > st.deadline) { choose(st, 0, now); return true; }
      if (st.phase === 'compose' && now > st.deadline) { reveal(st, now, true); return true; }
      if (st.phase === 'guess' && now > st.deadline) { reveal(st, now); return true; }
      if (st.phase === 'reveal' && now > st.deadline) { afterReveal(st, now); return true; }
      return false;
    },
    // 託管的真人沒辦法代彈，直接跳過（0 分）；電腦玩家（測試房）出隨機旋律；猜題用固定亂數
    auto(st, isAuto) {
      const ia = isAuto || (() => true);
      if (st.phase === 'choose' && ia(st.composer)) return { seat: st.composer, a: { type: 'choose', i: hash(st.step) % st.choices.length } };
      if (st.phase === 'compose' && ia(st.composer)) return st.bots[st.composer] ? { seat: st.composer, a: { type: 'submit', notes: botTune(st), inst: 'p' } } : { seat: st.composer, a: { type: 'skip' } };
      if (st.phase === 'guess') { const s = guessers(st).find(g => !st.answers[g] && ia(g)); return s == null ? null : { seat: s, a: { type: 'answer', i: hash(st.step, s) % st.opts.length } }; }
      return null;
    },
    view(st, seat) {
      const isC = seat === st.composer;
      const open = st.phase === 'reveal' || st.phase === 'over';
      return {
        phase: st.phase, scores: st.scores, deadline: st.deadline, turnId: st.step, turn: st.turn, composer: st.composer,
        ti: st.ti, total: st.n * st.rounds, choices: isC && st.phase === 'choose' ? st.choices : null,
        q: isC && st.q ? st.q : null, qKind: st.q ? st.q.k : null,
        notes: st.phase === 'guess' || open ? st.notes : null, inst: st.inst,
        opts: st.phase === 'guess' ? st.opts : null, myAns: st.answers && st.answers[seat] ? st.answers[seat].i : null,
        answered: U.range(st.n).map(i => !!(st.answers && st.answers[i])), needN: st.n - 1,
        last: open ? st.last : null,
        floor: st.phase === 'guess' ? [] : null // 猜題時全員靜音，避免直接喊出答案
      };
    },
    myTurn(v) {
      if (v.seat < 0) return '';
      if ((v.phase === 'choose' || v.phase === 'compose') && v.composer === v.seat) return '輪到你出題';
      if (v.phase === 'guess' && v.composer !== v.seat && v.myAns == null) return '聽聽看，猜是什麼';
      return '';
    },

    // ================= 畫面 =================
    render(el, v, ui) {
      const me = v.seat, N = v.names, nm = (i) => U.esc(N[i] || '?');
      el.dataset.g = 'melody';
      // 編曲中：畫面更新時不重建鍵盤（不然按到一半的音會斷掉）
      const key = [v.phase, v.turnId, v.composer, me].join(':');
      if (v.phase === 'compose' && v.composer === me && this._key === key && el.querySelector('.mk')) return;
      if (this._key !== key && this._pl) { this._pl.stop(); this._pl = null; }
      const sameTurn = this._turnKey === v.composer + ':' + v.ti;
      if (!sameTurn) { this._turnKey = v.composer + ':' + v.ti; this._plays = 0; this._autoPlayed = false; this._kb = null; this._draft = null; }
      this._key = key;
      const chips = N.map((n, i) => `<div class="pchip ${i === v.composer ? 'turn' : ''}">${i === v.composer ? '🎹' : v.phase === 'guess' && v.answered[i] ? '✔' : ''}${U.esc(n)}<b>${v.scores[i]} 分</b></div>`).join('');
      const head = `<div class="bl-head"><span>第 ${Math.min(v.ti + 1, v.total)}／${v.total} 題</span>${v.deadline ? `<span class="timer" data-deadline="${v.deadline}"></span>` : ''}</div>`;
      let body = '';
      if (v.phase === 'choose') {
        body = v.composer === me
          ? `<p class="turn-line center">選一個題目來彈</p><div class="ml-choices">${v.choices.map((c, i) => `<button class="btn ml-choice" data-c="${i}"><small>${c.k === 'song' ? '🎵 歌曲題：彈出旋律' : '🎬 情境題：彈出感覺'}</small>${U.esc(qText(c))}</button>`).join('')}</div>`
          : `<p class="hint center">${nm(v.composer)} 正在選題目…</p>`;
      } else if (v.phase === 'compose') {
        body = v.composer === me
          ? `<div class="ml-q"><small>${v.q.k === 'song' ? '🎵 彈出這首歌的旋律' : '🎬 用音樂表達'}</small><h3>${U.esc(qText(v.q))}</h3></div>
             <div class="ml-rec"><span class="ml-status"></span>
               <div class="ml-btns"><button class="btn sm ghost" data-r="rec">⏺ 錄音</button><button class="btn sm ghost" data-r="stop">⏹ 停止</button><button class="btn sm ghost" data-r="play">▶ 試聽</button><button class="btn sm" data-r="send">📤 送出</button></div></div>
             <div class="ml-kb"></div>
             <div class="act-row"><button class="btn ghost sm" data-r="skip">放棄這題</button></div>
             <p class="hint center">先按「⏺ 錄音」，按下第一個音才開始計時，最多 10 秒；可以重錄，送出後大家才聽得到</p>`
          : `<p class="hint center">🎹 ${nm(v.composer)} 正在編曲… 先想想看可能是什麼</p><div class="ml-wait">🎶</div>`;
      } else if (v.phase === 'guess') {
        const isC = v.composer === me, left = 3 - this._plays;
        body = `<div class="ml-play"><button class="btn big" data-p="play" ${!isC && left <= 0 ? 'disabled' : ''}>▶ 播放${isC ? '' : `（還能重播 ${Math.max(0, left)} 次）`}</button></div>
          <p class="turn-line center">${isC ? '大家正在猜你的作品' : v.myAns != null ? '已作答，等其他人' : `${v.qKind === 'song' ? '這是哪一首歌？' : '這段音樂在表達什麼？'}`}</p>
          <div class="ml-opts ${v.opts.length > 4 ? 'six' : ''}">${v.opts.map((o, i) => `<button class="btn ghost ml-opt ${v.myAns === i ? 'mine' : ''}" data-o="${i}" ${isC || me < 0 || v.myAns != null ? 'disabled' : ''}>${U.esc(o)}</button>`).join('')}</div>
          <p class="hint center">已作答 ${v.answered.filter(Boolean).length}／${v.needN} 人・猜題時全員麥克風暫時關閉</p>`;
      } else if (v.phase === 'reveal' && v.last) {
        const L = v.last;
        const right = Object.entries(L.answers || {}).filter(([, a]) => a.ok).sort((a, b) => a[1].at - b[1].at).map(([s]) => nm(+s));
        body = `<div class="bl-reveal ${right.length ? 'ok' : 'no'}">
          ${L.skipped ? `<h3>${nm(L.composer)} 這題跳過了</h3>` : `<h3>${right.length ? `🎯 ${right.join('、')} 猜對了！` : '😵 沒人猜對'}</h3>`}
          <div class="bl-mean"><small>答案</small><p>${U.esc(L.q ? qText(L.q) : '')}</p></div>
          ${!L.skipped && v.notes ? '<button class="btn ghost sm" data-p="replay">▶ 再聽一次</button>' : ''}
          <p>${L.gain.map((g, i) => g ? `${nm(i)} +${g}` : '').filter(Boolean).join('、')}</p>
          ${me >= 0 ? '<button class="btn" data-a="next">下一題</button>' : ''}</div>`;
      } else if (v.phase === 'over') {
        const best = Math.max(...v.scores), rank = U.range(v.scores.length).sort((a, b) => v.scores[b] - v.scores[a]);
        body = `<div class="bl-reveal ok"><h3>👑 冠軍：${rank.filter(i => v.scores[i] === best).map(nm).join('、')}</h3>
          ${rank.map((s, i) => `<p>${i + 1}. ${nm(s)} — ${v.scores[s]} 分</p>`).join('')}
          ${me >= 0 ? '<button class="btn" data-a="next">再玩一次</button>' : ''}</div>`;
      }
      el.innerHTML = `<div class="ml"><div class="players-row">${chips}</div>${head}<details class="m-rules"><summary>？ 規則</summary><p>${U.esc(this.desc)}</p></details>${body}</div>`;

      // 編曲：鍵盤＋錄音
      const kbEl = el.querySelector('.ml-kb');
      if (kbEl) {
        const status = el.querySelector('.ml-status');
        const upd = (kb) => {
          const n = kb.notes.length;
          status.textContent = kb.rec ? (n ? `● 錄音中 ${(kb.elapsed() / 1000).toFixed(1)}／10 秒` : '● 準備好了，按下第一個音開始錄') : kb.player ? '▶ 播放中…' : n ? `✔ 已錄 ${n} 個音` : '還沒錄音（可以先自由彈彈看）';
          status.classList.toggle('rec', kb.rec);
          el.querySelector('[data-r="send"]').disabled = !n || kb.rec;
          el.querySelector('[data-r="play"]').disabled = !n || kb.rec;
          el.querySelector('[data-r="stop"]').disabled = !kb.rec && !kb.player;
        };
        const kb = MU().mountKeyboard(kbEl, { inst: this._draft ? this._draft.inst : 'p', notes: this._draft ? this._draft.notes : null, onChange: (k) => { this._draft = { notes: k.notes, inst: k.inst }; upd(k); } });
        this._kb = kb; upd(kb);
        clearInterval(this._iv); this._iv = setInterval(() => { if (!kbEl.isConnected) { clearInterval(this._iv); return; } if (kb.rec && kb.notes.length && kb.elapsed() >= MU().MAX_MS) kb.stopRec(); upd(kb); }, 200);
        el.querySelector('[data-r="rec"]').onclick = () => kb.start();
        el.querySelector('[data-r="stop"]').onclick = () => { if (kb.rec) kb.stopRec(); kb.stopPlay(); upd(kb); };
        el.querySelector('[data-r="play"]').onclick = () => kb.preview();
        el.querySelector('[data-r="send"]').onclick = () => { if (!kb.notes.length) return; kb.stopPlay(); ui.send({ type: 'submit', notes: kb.notes, inst: kb.inst }); };
        el.querySelector('[data-r="skip"]').onclick = () => { if (confirm('確定放棄這題？（這題沒有分數）')) ui.send({ type: 'skip' }); };
      }
      const playNotes = () => { if (this._pl) this._pl.stop(); this._pl = MU().play(v.notes, v.inst, () => { this._pl = null; }); };
      // 進入猜題時自動播一次（不算在重播次數裡）
      if (v.phase === 'guess' && v.notes && !this._autoPlayed) { this._autoPlayed = true; setTimeout(playNotes, 300); }
      el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
        if (b.dataset.p === 'play' && v.composer !== me) { if (this._plays >= 3) return; this._plays++; this.render(el, v, ui); }
        playNotes();
      });
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => ui.send({ type: 'choose', i: +b.dataset.c }));
      el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => ui.send({ type: 'answer', i: +b.dataset.o }));
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => ui.send({ type: b.dataset.a }));
    },
    destroy() { clearInterval(this._iv); if (this._pl) this._pl.stop(); this._pl = null; this._key = null; this._turnKey = null; }
  };
  M.T = T;
  root.GAMES.melody = M;
})(typeof window !== 'undefined' ? window : globalThis);
