// 心臟病
(function (root) {
  const U = root.GUTIL;
  const CALL = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  function deal(st) {
    const deck = U.shuffle(U.deck(st.decks));
    st.hands = U.range(st.n).map(() => []);
    deck.forEach((c, i) => st.hands[i % st.n].push(c));
    st.pile = []; st.call = 0; st.turn = st.starter % st.n; st.phase = 'flip'; st.last = null; st.slaps = []; st.winner = null;
  }
  function alive(st) { return U.range(st.n).filter(i => st.out.indexOf(i) < 0); }
  function nextAlive(st, from) { for (let k = 1; k <= st.n; k++) { const s = (from + k) % st.n; if (st.out.indexOf(s) < 0 && st.hands[s].length) return s; } return from; }

  function takePile(st, seat, reason, now) {
    const got = st.pile.length;
    st.hands[seat] = U.shuffle(st.pile.slice()).concat(st.hands[seat]); // 放到牌堆底（陣列頭）
    st.pile = []; st.call = 0;
    st.result = { loser: seat, reason, got, slaps: st.slaps.slice(), until: now + 2200 };
    st.out = st.out.filter(s => s !== seat);
    st.turn = seat; st.phase = 'result'; st.deadline = now + 2200;
  }
  function resolve(st, now) {
    const al = alive(st).concat(st.out.filter(s => s === st.last.seat)); // 剛出完的人也要拍
    const slapped = st.slaps.map(s => s.seat);
    const missing = U.range(st.n).filter(s => st.hands[s].length > 0 || s === st.last.seat).filter(s => !slapped.includes(s));
    let loser;
    if (missing.length) loser = missing[0];
    else loser = st.slaps.slice().sort((a, b) => a.rt - b.rt)[st.slaps.length - 1].seat;
    void al;
    takePile(st, loser, missing.length ? 'noslap' : 'last', now);
  }
  function checkWin(st) {
    const emp = U.range(st.n).filter(s => st.hands[s].length === 0);
    if (emp.length && st.phase === 'flip') { st.winner = emp[0]; st.phase = 'over'; st.wins[emp[0]]++; return true; }
    return false;
  }

  const M = {
    id: 'slap', name: '心臟病', icon: '💓', min: 2, max: 8,
    desc: '輪流翻牌並依序喊 A、2、3…K。翻出的牌跟喊的數字一樣就要搶著拍，最慢拍的人收走整疊牌；喊錯拍也要收。最先把手牌出完的人贏。系統用每個人的「反應時間」判定快慢，網速慢的人不吃虧。',
    options: [{ key: 'decks', label: '牌數', choices: [[1, '1 副牌'], [2, '2 副牌（人多建議）']], def: 1 },
      { key: 'auto', label: '自動翻牌', choices: [[0, '關閉'], [6, '6 秒沒翻自動翻']], def: 6 }],
    init(n, o) {
      const st = { n, decks: +o.decks, auto: +o.auto, starter: 0, out: [], wins: Array(n).fill(0) };
      deal(st); st.deadline = 0; return st;
    },
    action(st, seat, a, ctx) {
      const now = ctx.now;
      if (a.type === 'flip') {
        if (st.phase !== 'flip' || seat !== st.turn) return 'silent';
        return this._flip(st, now);
      }
      if (a.type === 'slap') {
        if (st.phase === 'slap') {
          if (st.slaps.some(s => s.seat === seat)) return 'silent';
          const rt = Math.max(30, Math.min(5000, +a.rt || (now - st.slapStart)));
          st.slaps.push({ seat, rt });
          const need = U.range(st.n).filter(s => st.hands[s].length > 0 || s === st.last.seat);
          if (need.every(s => st.slaps.some(x => x.seat === s))) resolve(st, now);
          return;
        }
        if (st.phase === 'flip' && st.pile.length) { st.slaps = [{ seat, rt: 0 }]; takePile(st, seat, 'wrong', now); return; }
        return 'silent';
      }
      if (a.type === 'next' && st.phase === 'over') { st.starter++; st.out = []; deal(st); return; }
    },
    _flip(st, now) {
      const s = st.turn; const c = st.hands[s].pop();
      const called = st.call % 13; st.call++;
      st.pile.push(c); st.last = { seat: s, c, called, at: now, id: (st.last ? st.last.id + 1 : 1) };
      if (U.rank(c) === called + 1) { st.phase = 'slap'; st.slapStart = now; st.slaps = []; st.deadline = now + 3500; }
      else {
        if (st.hands[s].length === 0) { st.phase = 'flip'; if (checkWin(st)) return; }
        st.turn = nextAlive(st, s); st.deadline = st.auto ? now + st.auto * 1000 : 0;
      }
    },
    tick(st, now) {
      if (st.phase === 'slap' && now > st.deadline) { resolve(st, now); return true; }
      if (st.phase === 'result' && now > st.deadline) {
        st.phase = 'flip'; st.result = null; st.slaps = [];
        if (checkWin(st)) return true;
        if (!st.hands[st.turn].length) st.turn = nextAlive(st, st.turn);
        st.deadline = st.auto ? now + st.auto * 1000 : 0; return true;
      }
      if (st.phase === 'flip' && st.auto && st.deadline && now > st.deadline) { this._flip(st, now); return true; }
      return false;
    },
    auto(st) { return st.phase === 'flip' ? { seat: st.turn, a: { type: 'flip' } } : null; },
    view(st, seat) {
      return {
        phase: st.phase, turn: st.turn, counts: st.hands.map(h => h.length), pileN: st.pile.length,
        last: st.last, nextCall: CALL[st.call % 13], deadline: st.phase === 'slap' ? 0 : st.deadline,
        slapped: st.slaps.map(s => s.seat), result: st.result, winner: st.winner, wins: st.wins
      };
    },
    render(el, v, ui) {
      const me = v.seat;
      if (this._lastId !== (v.last && v.last.id) && v.phase === 'slap') { this._shownAt = performance.now(); }
      this._lastId = v.last && v.last.id;
      const last = v.last;
      const res = v.result;
      el.dataset.g = 'slap';
      el.innerHTML = `
        <div class="players-row">${v.names.map((n, i) => `<div class="pchip ${i === v.turn && v.phase === 'flip' ? 'turn' : ''} ${v.slapped.includes(i) ? 'slapped' : ''}">${U.esc(n)}<b>${v.counts[i]} 張</b>${v.wins[i] ? `<small>🏆${v.wins[i]}</small>` : ''}</div>`).join('')}</div>
        <div class="slap-center">
          <div class="slap-call">${last ? `<small>${U.esc(v.names[last.seat])} 喊</small><strong>${CALL[last.called]}</strong>` : '<small>準備開始</small>'}</div>
          <div class="slap-pile">${last && v.pileN ? U.cardHTML(last.c, 'big flipin') : '<div class="card empty big"></div>'}<span>${v.pileN} 張</span></div>
        </div>
        <div class="slap-msg">${
          v.phase === 'over' ? `🎉 ${U.esc(v.names[v.winner])} 出完牌，獲勝！`
          : res ? (res.reason === 'wrong' ? `😵 ${U.esc(v.names[res.loser])} 拍錯了，收走 ${res.got} 張` : res.reason === 'noslap' ? `😴 ${U.esc(v.names[res.loser])} 沒拍到，收走 ${res.got} 張` : `🐢 ${U.esc(v.names[res.loser])} 最慢，收走 ${res.got} 張`)
            + (res.slaps.length > 1 ? `<small>${res.slaps.slice().sort((a, b) => a.rt - b.rt).map(s => `${U.esc(v.names[s.seat])} ${s.rt}ms`).join('、')}</small>` : '')
          : v.phase === 'slap' ? '<b class="hot">拍！！</b>'
          : `輪到 <b>${U.esc(v.names[v.turn])}</b>，下一張喊 <b>${v.nextCall}</b> <span class="timer" data-deadline="${v.deadline || ''}"></span>`
        }</div>
        ${me >= 0 ? `<div class="slap-btns">
          ${v.phase === 'over' ? '<button class="btn big" data-a="next">再來一局</button>' :
            `<button class="btn big flipbtn" data-a="flip" ${v.phase === 'flip' && v.turn === me ? '' : 'disabled'}>翻牌（喊 ${v.nextCall}）</button>
             <button class="slapbtn ${v.phase === 'slap' ? 'hot' : ''}" data-a="slap">✋ 拍！</button>`}
        </div>` : ''}`;
      el.querySelectorAll('[data-a]').forEach(b => b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const a = b.dataset.a;
        if (a === 'slap') ui.send({ type: 'slap', rt: v.phase === 'slap' ? Math.round(performance.now() - (this._shownAt || performance.now())) : 0 });
        else ui.send({ type: a });
        if (navigator.vibrate) navigator.vibrate(30);
      }));
    }
  };
  root.GAMES.slap = M;
})(typeof window !== 'undefined' ? window : globalThis);
