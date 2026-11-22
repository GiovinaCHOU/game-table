// 誰是走音臥底：平民拿到同一首歌，臥底拿到相近的另一首（或什麼都沒拿到），輪流只用哼的，投票抓臥底
(function (root) {
  const U = root.GUTIL;
  const B = () => root.MUSIC_BANK;
  const T = { look: 12000, prep: 3000, vote: 40000, guess: 25000, show: 7000, end: 20000 }, MAX_CYCLE = 6; // 毫秒（畫面測試會暫時縮短）
  const hash = (...xs) => { let h = 2166136261; for (const x of xs) { h ^= (x | 0) + 0x9e3779b9; h = Math.imul(h, 16777619) >>> 0; } return h; };
  const spyN = (n) => (n >= 7 ? 2 : 1);
  const aliveSeats = (st) => U.range(st.n).filter(i => st.alive[i]);
  const songLabel = (s) => (s ? B().label(s) : '');

  function pickPair(st) {
    const P = B().PAIRS;
    let ids = U.range(P.length).filter(i => (st.cat === 'all' || P[i][0] === st.cat) && (st.diff === 'mix' || P[i][1] === st.diff));
    if (!ids.length) ids = U.range(P.length).filter(i => st.cat === 'all' || P[i][0] === st.cat);
    if (!ids.length) ids = U.range(P.length);
    let fresh = ids.filter(i => !st.usedPairs.includes(i));
    if (!fresh.length) { st.usedPairs = st.usedPairs.filter(i => !ids.includes(i)); fresh = ids; }
    const id = fresh[Math.floor(Math.random() * fresh.length)]; st.usedPairs.push(id);
    const p = P[id], flip = Math.random() < 0.5;
    return { id, cat: p[0], diff: p[1], civ: flip ? p[3] : p[2], spy: flip ? p[2] : p[3], why: p[4] };
  }
  // 臥底被抓時猜平民的歌：正解＋同分類的 3 首（不含臥底自己那首）
  function guessOpts(st) {
    const S = B().SONGS, pr = st.pair, key = (s) => s.t + '|' + s.a;
    const civK = pr.civ[0] + '|' + pr.civ[1], spyK = pr.spy[0] + '|' + pr.spy[1];
    let pool = S.filter(s => s.c === pr.cat && key(s) !== civK && key(s) !== spyK);
    if (pool.length < 3) pool = pool.concat(S.filter(s => s.c !== pr.cat && key(s) !== civK && key(s) !== spyK));
    pool = U.shuffle(pool.slice()).slice(0, 3).map(s => [s.t, s.a]);
    const opts = U.shuffle(pool.concat([pr.civ.slice()]));
    return { opts, ans: opts.findIndex(o => o[0] === pr.civ[0] && o[1] === pr.civ[1]) };
  }

  function newRound(st, now) {
    st.pair = pickPair(st);
    st.spies = U.shuffle(U.range(st.n)).slice(0, spyN(st.n)).sort((a, b) => a - b);
    st.alive = Array(st.n).fill(true);
    st.order = U.shuffle(U.range(st.n));
    st.outs = []; st.cycle = 0; st.seen = {}; st.votes = {}; st.pk = null; st.pkDone = false;
    st.lastVote = null; st.out = null; st.guess = null; st.result = null; st.fbNow = {}; st.reports = {};
    st.phase = 'look'; st.deadline = now + T.look; st.turn = null; st.step++;
  }
  function startCycle(st, now) {
    st.cycle++;
    const ord = st.order.filter(i => st.alive[i]);
    st.queue = st.cycle === 1 ? ord.concat(ord.slice().reverse()) : ord; // 第一輪哼兩圈，第二圈順序反過來
    st.qi = -1; st.pk = null; st.pkDone = false;
    nextHum(st, now);
  }
  function nextHum(st, now) {
    st.qi++;
    if (st.qi >= st.queue.length) { startVote(st, now); return; }
    const s = st.queue[st.qi];
    st.phase = 'hum'; st.hummer = s; st.turn = s; st.humStart = now + T.prep; st.deadline = st.humStart + st.humT * 1000;
    st.reports = {}; st.step++;
  }
  function endHum(st, now) {
    const s = st.hummer, others = aliveSeats(st).filter(i => i !== s);
    const rep = Object.keys(st.reports).length;
    if (others.length && rep * 2 > others.length) { st.scores[s] = Math.max(0, st.scores[s] - 1); st.log.push({ t: 'sang', seat: s }); }
    nextHum(st, now);
  }
  function startVote(st, now) {
    st.phase = 'vote'; st.votes = {}; st.turn = null; st.hummer = -1; st.deadline = now + T.vote; st.step++;
  }
  const voters = (st) => aliveSeats(st);
  const cands = (st) => (st.pk || aliveSeats(st));
  function resolveVote(st, now) {
    const tally = Array(st.n).fill(0);
    Object.entries(st.votes).forEach(([v, t]) => { if (st.alive[+v] && cands(st).includes(t)) tally[t]++; });
    const best = Math.max(...tally);
    st.lastVote = { votes: Object.assign({}, st.votes), tally, pk: !!st.pk };
    if (best <= 0) { st.out = null; st.log.push({ t: 'novote' }); showOut(st, now, null); return; }
    const top = U.range(st.n).filter(i => tally[i] === best);
    if (top.length > 1) {
      if (!st.pkDone) { // 平票：平票的人各再哼一次，然後只在他們之中重投
        st.pk = top; st.pkDone = true; st.queue = top.slice(); st.qi = -1; st.log.push({ t: 'pk', seats: top });
        nextHum(st, now); return;
      }
      st.log.push({ t: 'tie' }); showOut(st, now, null); return;
    }
    eliminate(st, now, top[0]);
  }
  function eliminate(st, now, x) {
    st.alive[x] = false; st.out = x;
    const spy = st.spies.includes(x);
    st.outs.push({ seat: x, spy });
    if (spy) {
      const g = guessOpts(st);
      st.guess = { seat: x, opts: g.opts, ans: g.ans, pick: null };
      st.phase = 'guess'; st.turn = x; st.deadline = now + T.guess; st.step++; return;
    }
    showOut(st, now, x);
  }
  function showOut(st, now, x) {
    st.out = x; st.phase = 'show'; st.turn = null; st.deadline = now + T.show; st.step++;
  }
  function afterShow(st, now) {
    const sa = st.spies.filter(i => st.alive[i]).length, al = aliveSeats(st).length;
    if (sa === 0) return finish(st, now, 'civ', 'all');
    if (al <= 3) return finish(st, now, 'spy', 'survive');
    if (st.cycle >= MAX_CYCLE) return finish(st, now, 'spy', 'cap');
    startCycle(st, now);
  }
  function finish(st, now, win, why) {
    const gain = Array(st.n).fill(0);
    U.range(st.n).forEach(i => { const spy = st.spies.includes(i); if (win === 'spy' && spy) gain[i] = 3; if (win === 'civ' && !spy) gain[i] = 1; });
    gain.forEach((g, i) => { st.scores[i] += g; });
    st.result = { win, why, gain };
    st.phase = 'end'; st.turn = null; st.deadline = now + T.end; st.revealAt = now; st.step++;
  }
  function afterEnd(st, now) {
    const c = Object.values(st.fbNow);
    if (c.length) st.fb.push({ civ: st.pair.civ, spy: st.pair.spy, close: c.filter(x => x === 'close').length, far: c.filter(x => x === 'far').length });
    if (Math.max(...st.scores) >= st.target) { st.phase = 'over'; st.deadline = 0; st.turn = null; st.step++; return; }
    st.round++; newRound(st, now);
  }

  const M = {
    id: 'humspy', name: '誰是走音臥底', icon: '🎤', min: 4, max: 10, needVoice: true,
    desc: '大家拿到同一首歌，只有臥底拿到另一首相近的歌（白板模式：臥底什麼都沒拿到）。沒人知道自己是不是臥底。輪流只用「哼」的（不能唱歌詞），輪到誰哼，只開他的麥克風，其他人自動靜音。第一輪哼兩圈，之後每輪一圈，接著全員投票抓臥底；平票的人各再哼一次後重投，再平就沒人出局。臥底被抓到時可以從 4 個選項猜平民的歌，猜對就翻盤。抓光臥底：平民每人 +1；臥底撐到只剩 3 人，或撐過 6 輪投票：臥底每人 +3。4～6 人 1 位臥底、7～10 人 2 位。每位玩家都要開「🎤 語音」，建議戴耳機。',
    options: [
      { key: 'target', label: '目標分數', choices: [[5, '5 分'], [7, '7 分'], [10, '10 分']], def: 5 },
      { key: 'cat', label: '歌曲分類', choices: [['all', '全部混合'], ['zh', '華語經典'], ['zhnew', '華語近年'], ['tw', '台語'], ['jp', '日文'], ['en', '西洋'], ['ost', '動漫・影視']], def: 'all' },
      { key: 'diff', label: '難度', choices: [['n', '一般（不同歌手、同曲風）'], ['h', '困難（同歌手、同時期）'], ['mix', '混合']], def: 'n' },
      { key: 'mode', label: '臥底拿到', choices: [['near', '相近的另一首歌'], ['blank', '什麼都沒有（白板）']], def: 'near' },
      { key: 'humT', label: '每人哼幾秒', choices: [[5, '5 秒'], [8, '8 秒'], [10, '10 秒']], def: 5 }
    ],
    init(n, o, names, now) {
      now = now == null ? Date.now() : now;
      const st = {
        n, target: +o.target || 5, cat: (o.cat && (o.cat === 'all' || B().CATS[o.cat])) ? o.cat : 'all',
        diff: ['n', 'h', 'mix'].includes(o.diff) ? o.diff : 'n', mode: o.mode === 'blank' ? 'blank' : 'near', humT: [5, 8, 10].includes(+o.humT) ? +o.humT : 5,
        bots: (names || []).map(x => /^電腦\d+$/.test(String(x))),
        scores: Array(n).fill(0), round: 1, usedPairs: [], step: 0, log: [], fb: []
      };
      newRound(st, now); return st;
    },
    action(st, seat, a, ctx) {
      const now = (ctx && ctx.now) || Date.now();
      if (seat < 0) return 'silent';
      switch (a.type) {
        case 'seen':
          if (st.phase !== 'look') return 'silent';
          st.seen[seat] = 1;
          if (U.range(st.n).every(i => st.seen[i])) startCycle(st, now); else st.step++;
          return;
        case 'done':
          if (st.phase !== 'hum' || seat !== st.hummer) return 'silent';
          endHum(st, now); return;
        case 'report':
          if (st.phase !== 'hum' || seat === st.hummer || !st.alive[seat]) return 'silent';
          if (now < st.humStart) return '他還沒開始哼';
          st.reports[seat] = 1; st.step++; return;
        case 'vote': {
          if (st.phase !== 'vote') return 'silent';
          if (!st.alive[seat]) return '你已經出局了，不能投票';
          const t = a.t | 0;
          if (t === seat) return '不能投自己';
          if (!cands(st).includes(t)) return st.pk ? '這次只能投平票的人' : '這個人不能投';
          if (st.votes[seat] != null) return '你已經投過了';
          st.votes[seat] = t; st.step++;
          if (voters(st).every(v => st.votes[v] != null)) resolveVote(st, now);
          return;
        }
        case 'guess': {
          if (st.phase !== 'guess' || !st.guess || seat !== st.guess.seat) return 'silent';
          const i = a.i | 0; if (i < 0 || i >= st.guess.opts.length) return 'silent';
          st.guess.pick = i;
          if (i === st.guess.ans) { finish(st, now, 'spy', 'guess'); return; }
          showOut(st, now, seat); return;
        }
        case 'fb':
          if (st.phase !== 'end' || !['close', 'far'].includes(a.v)) return 'silent';
          st.fbNow[seat] = a.v; st.step++; return;
        case 'next':
          if (st.phase === 'end') { if (now - st.revealAt < 3000) return 'silent'; afterEnd(st, now); return; }
          if (st.phase === 'over') { st.scores = Array(st.n).fill(0); st.round = 1; st.fb = []; newRound(st, now); return; }
          return 'silent';
      }
      return 'silent';
    },
    tick(st, now) {
      if (st.phase === 'look' && now > st.deadline) { startCycle(st, now); return true; }
      if (st.phase === 'hum' && now > st.deadline) { endHum(st, now); return true; }
      if (st.phase === 'vote' && now > st.deadline) { resolveVote(st, now); return true; }
      if (st.phase === 'guess' && now > st.deadline) { st.guess.pick = -1; showOut(st, now, st.guess.seat); return true; }
      if (st.phase === 'show' && now > st.deadline) { afterShow(st, now); return true; }
      if (st.phase === 'end' && now > st.deadline) { afterEnd(st, now); return true; }
      return false;
    },
    // 電腦玩家／託管：沒辦法代哼，輪到就直接跳過；投票、猜歌用固定亂數（同一個局面每次結果一樣）
    auto(st, isAuto) {
      const ia = isAuto || (() => true);
      if (st.phase === 'look') { const s = U.range(st.n).find(i => !st.seen[i] && ia(i)); return s == null ? null : { seat: s, a: { type: 'seen' } }; }
      if (st.phase === 'hum') return ia(st.hummer) ? { seat: st.hummer, a: { type: 'done' } } : null;
      if (st.phase === 'vote') {
        const s = voters(st).find(i => st.votes[i] == null && ia(i)); if (s == null) return null;
        const c = cands(st).filter(t => t !== s); if (!c.length) return null;
        return { seat: s, a: { type: 'vote', t: c[hash(st.step, s, st.round) % c.length] } };
      }
      if (st.phase === 'guess' && ia(st.guess.seat)) return { seat: st.guess.seat, a: { type: 'guess', i: hash(st.step, st.round) % st.guess.opts.length } };
      return null;
    },
    view(st, seat) {
      const open = st.phase === 'end' || st.phase === 'over';
      const me = seat >= 0 && seat < st.n;
      const isSpy = me && st.spies.includes(seat);
      const mySong = !me ? null : isSpy ? (st.mode === 'blank' ? null : st.pair.spy) : st.pair.civ;
      return {
        phase: st.phase, round: st.round, target: st.target, scores: st.scores, deadline: st.deadline, turnId: st.step, turn: st.turn,
        humStart: st.humStart || 0, humT: st.humT, mode: st.mode, diff: st.diff, cat: st.pair.cat,
        catName: B().CATS[st.pair.cat], mySong, blankSpy: me && isSpy && st.mode === 'blank',
        alive: st.alive, outs: st.outs, order: st.order, queue: st.phase === 'hum' ? st.queue : null, qi: st.qi, hummer: st.phase === 'hum' ? st.hummer : -1,
        cycle: st.cycle, pk: st.pk, seenN: Object.keys(st.seen).length, meSeen: !!st.seen[seat],
        reported: !!st.reports[seat], reportN: st.phase === 'hum' ? Object.keys(st.reports).length : 0,
        voted: U.range(st.n).map(i => st.votes[i] != null), myVote: st.votes[seat] != null ? st.votes[seat] : null, cands: st.phase === 'vote' ? cands(st) : null,
        lastVote: st.phase === 'show' || open ? st.lastVote : null, out: st.out,
        guess: st.guess ? { seat: st.guess.seat, opts: seat === st.guess.seat || st.phase !== 'guess' ? st.guess.opts : null, pick: st.guess.pick, ans: st.phase === 'guess' ? null : st.guess.ans } : null,
        result: open ? st.result : null, spies: open ? st.spies : null, pair: open ? { civ: st.pair.civ, spy: st.pair.spy, why: st.pair.why } : null,
        myFb: st.fbNow[seat] || null, fb: st.phase === 'over' ? st.fb : null, log: st.log.slice(-3),
        floor: st.phase === 'hum' ? [st.hummer] : null // 發言權：哼歌時只開哼歌的人的麥克風
      };
    },
    myTurn(v) {
      if (v.seat < 0) return '';
      if (v.phase === 'hum' && v.hummer === v.seat) return '輪到你哼歌';
      if (v.phase === 'vote' && v.alive[v.seat] && v.myVote == null) return '投票抓臥底';
      if (v.phase === 'guess' && v.guess && v.guess.seat === v.seat) return '猜平民的歌來翻盤！';
      return '';
    },

    // ================= 畫面 =================
    render(el, v, ui) {
      const me = v.seat, N = v.names, nm = (i) => U.esc(N[i] || '?');
      el.dataset.g = 'humspy';
      clearTimeout(this._tm);
      const sNow = () => (root.Room && root.Room.serverNow ? root.Room.serverNow() : Date.now());
      const outInfo = {}; v.outs.forEach(o => { outInfo[o.seat] = o.spy; });
      const chips = N.map((n, i) => {
        const dead = !v.alive[i];
        const tag = dead ? (outInfo[i] ? '<i class="hs-tag spy">臥底</i>' : '<i class="hs-tag">出局</i>') : v.phase === 'hum' && v.hummer === i ? '🎤' : v.phase === 'vote' && v.voted[i] ? '✔' : '';
        return `<div class="pchip ${v.hummer === i ? 'turn' : ''} ${dead ? 'hs-dead' : ''}">${tag}${U.esc(n)}<b>${v.scores[i]} 分</b></div>`;
      }).join('');

      // 自己的歌：按住才顯示
      let card = '';
      if (me >= 0 && v.phase !== 'end' && v.phase !== 'over') {
        card = v.blankSpy
          ? `<div class="hs-card blank ${v.phase === 'look' ? '' : 'mini'}"><small>你的歌</small><h3>你沒有拿到歌</h3>${v.phase === 'look' ? '<p>你是臥底！仔細聽別人哼，跟著模仿，不要被發現</p>' : ''}</div>`
          : `<div class="hs-card hold ${v.phase === 'look' ? '' : 'mini'}" data-hold><small>${U.esc(v.catName || '')}・按住看你的歌${v.phase === 'look' ? '，放開就蓋回去' : ''}</small><h3 class="hs-cover">🎵 按住這裡</h3><h3 class="hs-song">${U.esc(songLabel(v.mySong))}</h3></div>`;
      }

      let body = '';
      if (v.phase === 'look') {
        body = `<p class="hs-tip">${v.blankSpy ? '準備好就按「看好了」。' : '按住上面的卡片看你的歌，記住它怎麼唱。沒人知道自己是不是臥底，你的歌也可能是臥底的那首！'}</p>
          ${me >= 0 ? `<div class="act-row"><button class="btn big" data-a="seen" ${v.meSeen ? 'disabled' : ''}>${v.meSeen ? '✔ 看好了' : '看好了'}</button></div>` : ''}
          <p class="hint center">已準備 ${v.seenN}／${N.length} 人・<span class="timer" data-deadline="${v.deadline}"></span> 後開始哼</p>`;
      } else if (v.phase === 'hum') {
        const q = v.queue || [], n1 = v.cycle === 1 ? q.length / 2 : q.length;
        const prep = sNow() < v.humStart;
        if (prep) this._tm = setTimeout(() => this.render(el, v, ui), Math.max(50, v.humStart - sNow() + 30));
        const lead = v.pk ? `平票加哼：${v.pk.map(nm).join('、')}` : v.cycle === 1 ? `第 ${v.qi < n1 ? 1 : 2} 圈${v.qi >= n1 ? '（順序反過來）' : ''}` : `第 ${v.cycle} 輪`;
        const nx = q[v.qi + 1];
        body = `<p class="hint center">${lead}・第 ${v.qi + 1}／${q.length} 位${nx != null ? `・下一位：${nm(nx)}${nx === me ? '（你）' : ''}` : '・最後一位'}</p>`;
        if (v.hummer === me) {
          body += `<div class="hs-turn"><p class="turn-line">🎤 輪到你哼歌，只能哼，不能唱歌詞</p>
            <p class="hs-count">${prep ? '準備…' : '哼！'} <span class="timer" data-deadline="${prep ? v.humStart : v.deadline}"></span></p>
            <button class="btn big" data-a="done">哼完了</button></div>`;
        } else {
          body += `<div class="hs-turn"><p class="turn-line">請 ${nm(v.hummer)} 哼歌，其他人麥克風暫時關閉</p>
            <p class="hs-count">${prep ? '準備' : '哼歌中'} <span class="timer" data-deadline="${prep ? v.humStart : v.deadline}"></span></p>
            ${me >= 0 && v.alive[me] && !prep ? `<button class="btn ghost sm" data-a="report" ${v.reported ? 'disabled' : ''}>${v.reported ? '已檢舉' : '🚩 他唱歌詞了'}</button>` : ''}
            ${v.reportN ? `<p class="hint">${v.reportN} 人檢舉唱詞（超過一半就扣 1 分）</p>` : ''}</div>`;
        }
      } else if (v.phase === 'vote') {
        const canVote = me >= 0 && v.alive[me] && v.myVote == null;
        body = `<p class="turn-line center">${v.pk ? '平票重投：只能投平票的人' : '誰是臥底？投一票'} <span class="timer" data-deadline="${v.deadline}"></span></p>
          <div class="hs-vote">${v.cands.map(t => `<button class="hs-vbtn ${this._sel === t ? 'sel' : ''} ${v.myVote === t ? 'mine' : ''}" data-t="${t}" ${!canVote || t === me ? 'disabled' : ''}>${nm(t)}${t === me ? '（你）' : ''}</button>`).join('')}</div>
          ${canVote ? `<button class="btn big" data-a="vote" ${this._sel == null || !v.cands.includes(this._sel) || this._sel === me ? 'disabled' : ''}>${this._sel != null && v.cands.includes(this._sel) && this._sel !== me ? `投給 ${nm(this._sel)}` : '先點一位玩家'}</button>` : ''}
          <p class="hint center">${me >= 0 && !v.alive[me] ? '你已經出局，等大家投票・' : v.myVote != null ? `你投給了 ${nm(v.myVote)}・` : ''}已投 ${v.voted.filter((x, i) => x && v.alive[i]).length}／${v.alive.filter(Boolean).length} 人</p>`;
      } else if (v.phase === 'guess' && v.guess) {
        if (me === v.guess.seat) {
          body = `<div class="hs-turn"><p class="turn-line">你被抓到了！猜猜平民的歌是哪一首，猜對就翻盤 <span class="timer" data-deadline="${v.deadline}"></span></p>
            <div class="hs-opts">${v.guess.opts.map((o, i) => `<button class="btn" data-g="${i}">${U.esc(songLabel(o))}</button>`).join('')}</div></div>`;
        } else body = `<div class="hs-turn"><p class="turn-line">${nm(v.guess.seat)} 是臥底！正在猜平民的歌，猜對就翻盤… <span class="timer" data-deadline="${v.deadline}"></span></p></div>`;
      } else if (v.phase === 'show') {
        body = `<div class="hs-turn">${this._tally(v, nm)}
          ${v.out == null ? `<h3>${v.lastVote && v.lastVote.tally.every(x => !x) ? '沒有人投票' : '再次平票'}，這輪沒人出局</h3>`
            : v.guess && v.guess.seat === v.out ? `<h3>${nm(v.out)} 是臥底，${v.guess.pick === -1 ? '時間到沒猜' : '猜錯了'}！</h3>`
            : `<h3>${nm(v.out)} 出局，他是平民</h3>`}
          <p class="hint">馬上進入下一輪… <span class="timer" data-deadline="${v.deadline}"></span></p></div>`;
      } else if (v.phase === 'end' && v.result) {
        const R = v.result, why = { all: '臥底全部被抓到', survive: '臥底撐到只剩 3 人', cap: '臥底撐過 6 輪投票', guess: '臥底猜中平民的歌，翻盤！' }[R.why];
        body = `<div class="hs-end ${R.win}">
          ${this._tally(v, nm)}
          <h3>${R.win === 'civ' ? '🎉 平民贏了' : '🕵️ 臥底贏了'}</h3><p>${why}</p>
          <div class="hs-pair"><div><small>平民的歌</small><b>${U.esc(songLabel(v.pair.civ))}</b></div>
            <div><small>臥底的歌</small><b>${v.mode === 'blank' ? '（白板，沒有歌）' : U.esc(songLabel(v.pair.spy))}</b></div></div>
          ${v.mode !== 'blank' ? `<p class="hint">配對理由：${U.esc(v.pair.why)}</p>` : ''}
          <p>臥底：${v.spies.map(nm).join('、')}</p>
          <p>${R.gain.map((g, i) => g ? `${nm(i)} +${g}` : '').filter(Boolean).join('、')}</p>
          ${me >= 0 && v.mode !== 'blank' ? `<div class="hs-fb"><small>這兩首歌配得好嗎？（幫忙調整題庫）</small>
            <button class="btn ghost sm ${v.myFb === 'close' ? 'on' : ''}" data-fb="close">太像了</button><button class="btn ghost sm ${v.myFb === 'far' ? 'on' : ''}" data-fb="far">太不像了</button></div>` : ''}
          ${me >= 0 ? '<button class="btn" data-a="next">下一回合</button>' : ''}<p class="hint">20 秒後自動繼續</p></div>`;
      } else if (v.phase === 'over') {
        const best = Math.max(...v.scores), rank = U.range(v.scores.length).sort((a, b) => v.scores[b] - v.scores[a]);
        body = `<div class="hs-end civ"><h3>👑 冠軍：${rank.filter(i => v.scores[i] === best).map(nm).join('、')}</h3>
          ${rank.map((s, i) => `<p>${i + 1}. ${nm(s)} — ${v.scores[s]} 分</p>`).join('')}
          ${v.fb && v.fb.length ? `<div class="hs-fblist"><small>本局題庫回饋（截圖給開發者參考）</small>${v.fb.map(f => `<p>${U.esc(songLabel(f.civ))} ／ ${U.esc(songLabel(f.spy))}：太像 ${f.close}・太不像 ${f.far}</p>`).join('')}</div>` : ''}
          ${me >= 0 ? '<button class="btn" data-a="next">再玩一次</button>' : ''}</div>`;
      }

      el.innerHTML = `<div class="hs">
        <div class="players-row">${chips}</div>
        <div class="bl-head"><span>第 ${v.round} 回合・先到 ${v.target} 分</span><span>${v.mode === 'blank' ? '白板臥底' : v.diff === 'h' ? '困難' : v.diff === 'mix' ? '混合難度' : '一般'}</span></div>
        <details class="m-rules"><summary>？ 規則</summary><p>${U.esc(this.desc)}</p></details>
        ${card}${body}
      </div>`;

      const hold = el.querySelector('[data-hold]');
      if (hold) {
        // 按住中如果畫面剛好更新（別人按了按鈕），卡片要維持翻開：狀態記在 this._holding，放開手指（在哪裡放都算）才蓋回去
        if (this._holding) hold.classList.add('show');
        const on = (e) => { e.preventDefault(); this._holding = true; hold.classList.add('show'); };
        hold.addEventListener('pointerdown', on);
        if (!this._offBound) {
          this._offBound = true;
          const off = () => { if (!this._holding) return; this._holding = false; document.querySelectorAll('[data-hold].show').forEach(h => h.classList.remove('show')); };
          ['pointerup', 'pointercancel', 'blur'].forEach(x => (x === 'blur' ? window : document).addEventListener(x, off, true));
        }
        hold.addEventListener('contextmenu', (e) => e.preventDefault());
      }
      el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { this._sel = +b.dataset.t; this.render(el, v, ui); });
      el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => ui.send({ type: 'guess', i: +b.dataset.g }));
      el.querySelectorAll('[data-fb]').forEach(b => b.onclick = () => ui.send({ type: 'fb', v: b.dataset.fb }));
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const a = b.dataset.a;
        if (a === 'vote') { if (this._sel != null) ui.send({ type: 'vote', t: this._sel }); this._sel = null; }
        else ui.send({ type: a });
      });
      if (v.phase !== 'vote') this._sel = null;
    },
    _tally(v, nm) {
      const L = v.lastVote; if (!L) return '';
      const rows = Object.entries(L.votes).map(([a, t]) => `${nm(+a)} → ${nm(t)}`);
      return rows.length ? `<details class="hs-tally"><summary>${L.pk ? '平票重投' : '投票'}結果（點開看誰投誰）</summary><p>${rows.join('<br>')}</p></details>` : '';
    },
    destroy() { clearTimeout(this._tm); }
  };
  M.T = T;
  root.GAMES.humspy = M;
})(typeof window !== 'undefined' ? window : globalThis);
