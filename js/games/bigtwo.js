// 大老二（台灣規則）
(function (root) {
  const U = root.GUTIL;
  // 大小：3<4<…<K<A<2；花色 ♣<♦<♥<♠
  const ord = (c) => ((U.rank(c) + 10) % 13); // 3→0 … K→10, A→11, 2→12
  const val = (c) => ord(c) * 4 + U.suit(c);
  const TYPE_NAME = { 1: '單張', 2: '對子', straight: '順子', flush: '同花', full: '葫蘆', four: '鐵支', sf: '同花順' };
  const FIVE_RANK = { straight: 1, flush: 2, full: 3, four: 4, sf: 5 };

  function straightKey(cards) {
    const rs = cards.map(U.rank).sort((a, b) => a - b);
    const s = rs.join(',');
    // 合法順子與大小：34567(0)…10JQKA(7)、A2345(8)、23456(9)
    const table = { '1,2,3,4,5': 8, '2,3,4,5,6': 9, '1,10,11,12,13': 7 };
    if (table[s] != null) {
      const top = s === '1,10,11,12,13' ? cards.find(c => U.rank(c) === 1) : cards.find(c => U.rank(c) === 2);
      return [table[s], U.suit(top)];
    }
    for (let i = 1; i < 5; i++) if (rs[i] !== rs[0] + i) return null;
    if (rs[0] < 3) return null;
    const topR = rs[4];
    return [rs[0] - 3, U.suit(cards.find(c => U.rank(c) === topR))];
  }
  function classify(cards) {
    const n = cards.length;
    if (n === 1) return { t: 1, k: [val(cards[0])] };
    if (n === 2) { if (U.rank(cards[0]) !== U.rank(cards[1])) return null; return { t: 2, k: [Math.max(val(cards[0]), val(cards[1]))] }; }
    if (n !== 5) return null;
    const cnt = {}; cards.forEach(c => cnt[U.rank(c)] = (cnt[U.rank(c)] || 0) + 1);
    const groups = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
    const flush = cards.every(c => U.suit(c) === U.suit(cards[0]));
    const st = straightKey(cards);
    if (st && flush) return { t: 'sf', k: st };
    if (groups[0][1] === 4) return { t: 'four', k: [ord(+groups[0][0] * 4)] };
    if (groups[0][1] === 3 && groups[1][1] === 2) return { t: 'full', k: [ord(+groups[0][0] * 4)] };
    if (flush) return { t: 'flush', k: cards.map(val).sort((a, b) => b - a) };
    if (st) return { t: 'straight', k: st };
    return null;
  }
  const ordOfRank = (r) => (r + 10) % 13;
  // 修正：葫蘆/鐵支 k 用點數大小
  function fixK(h, cards) {
    if (h && (h.t === 'four' || h.t === 'full')) {
      const cnt = {}; cards.forEach(c => cnt[U.rank(c)] = (cnt[U.rank(c)] || 0) + 1);
      const r = +Object.keys(cnt).find(k => cnt[k] >= 3); h.k = [ordOfRank(r)];
    }
    return h;
  }
  function cmpK(a, b) { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; }
  function beats(h, prev, bomb) {
    if (!prev) return true;
    const isBomb = h.t === 'four' || h.t === 'sf';
    if (prev.t === 1 || prev.t === 2) {
      if (h.t === prev.t) return cmpK(h.k, prev.k) > 0;
      return bomb && isBomb;
    }
    if (typeof h.t === 'number') return false;
    if (FIVE_RANK[h.t] !== FIVE_RANK[prev.t]) return FIVE_RANK[h.t] > FIVE_RANK[prev.t];
    return cmpK(h.k, prev.k) > 0;
  }

  function deal(st) {
    const deck = U.shuffle(U.deck(1));
    const per = st.n === 2 ? 13 : st.n === 3 ? 17 : 13;
    st.hands = U.range(st.n).map(i => deck.slice(i * per, i * per + per));
    const c3 = 8; // ♣3 = (3-1)*4+0
    let owner = st.hands.findIndex(h => h.includes(c3));
    if (st.n === 3) { const left = deck[51]; if (owner < 0) owner = 0; st.hands[owner].push(left); }
    if (owner < 0) { // 兩人局 ♣3 可能沒發到：由最小牌的人先
      let best = 1e9; st.hands.forEach((h, i) => h.forEach(c => { if (val(c) < best) { best = val(c); owner = i; } }));
      st.mustCard = st.hands[owner].reduce((a, c) => val(c) < val(a) ? c : a);
    } else st.mustCard = c3;
    st.turn = owner; st.lead = owner; st.top = null; st.passes = []; st.phase = 'play'; st.history = []; st.winner = null; st.first = true;
  }

  const M = {
    id: 'bigtwo', name: '大老二', icon: '🂡', min: 2, max: 4,
    desc: '拿到梅花 3 的人先出，而且第一手要包含梅花 3。牌的大小：3 最小，2 最大；同點數時比花色 ♠>♥>♦>♣。可以出單張、對子或五張牌型（順子、同花、葫蘆、鐵支、同花順）。誰先出完誰贏，其他人照剩下的牌數扣分。',
    options: [{ key: 'bomb', label: '鐵支/同花順', choices: [[1, '可以壓單張和對子'], [0, '只能壓五張牌型']], def: 1 },
      { key: 'tlimit', label: '每手時間', choices: [[30, '30 秒'], [45, '45 秒'], [20, '20 秒'], [0, '不限']], def: 30 }],
    classify: (cards) => fixK(classify(cards), cards), beats,
    init(n, o, names, now) { const st = { n, bomb: +o.bomb, tlimit: o.tlimit == null ? 30 : +o.tlimit, total: Array(n).fill(0), round: 1 }; deal(st); this._dl(st, now || Date.now()); return st; },
    _dl(st, now) { st.deadline = st.tlimit && st.phase === 'play' ? now + st.tlimit * 1000 : 0; },
    tick(st, now) { if (!st.deadline || now <= st.deadline || st.phase !== 'play') return false; const w = this.auto(st); if (!w) return false; this.action(st, w.seat, w.a, { now }); return true; },
    action(st, seat, a, ctx) {
      const r = this._act(st, seat, a); if (!r) this._dl(st, (ctx && ctx.now) || Date.now()); return r;
    },
    _act(st, seat, a) {
      if (a.type === 'next') { if (st.phase !== 'over') return; st.round++; deal(st); return; }
      if (st.phase !== 'play') return '這局已結束';
      if (seat !== st.turn) return '還沒輪到你';
      if (a.type === 'pass') {
        if (!st.top) return '你是這輪第一個出牌，不能 Pass';
        st.passes.push(seat); st.history.push({ seat, pass: true });
        this._advance(st); return;
      }
      if (a.type === 'play') {
        const cards = (a.cards || []).map(Number);
        if (!cards.length || new Set(cards).size !== cards.length || !cards.every(c => st.hands[seat].includes(c))) return '選的牌不對';
        const h = fixK(classify(cards), cards);
        if (!h) return '這不是合法的牌型';
        if (st.first && !cards.includes(st.mustCard)) return `第一手必須包含 ${U.RANKS[U.rank(st.mustCard)]}${U.SUITS[U.suit(st.mustCard)]}`;
        if (st.top && !beats(h, st.top.h, st.bomb)) return '壓不過上一手';
        st.hands[seat] = st.hands[seat].filter(c => !cards.includes(c));
        st.top = { seat, cards, h }; st.first = false; st.passes = [];
        st.history.push({ seat, cards, name: TYPE_NAME[h.t] });
        if (!st.hands[seat].length) { this._end(st, seat); return; }
        this._advance(st); return;
      }
    },
    _advance(st) {
      for (let k = 1; k <= st.n; k++) {
        const s = (st.turn + k) % st.n;
        if (st.top && s === st.top.seat) { st.turn = s; st.top = null; st.passes = []; st.history.push({ seat: s, newLead: true }); return; }
        if (!st.passes.includes(s)) { st.turn = s; return; }
      }
    },
    _end(st, w) {
      st.phase = 'over'; st.winner = w;
      const pts = st.hands.map((h, i) => i === w ? 0 : -(h.length >= 13 ? h.length * 3 : h.length >= 10 ? h.length * 2 : h.length));
      pts[w] = -pts.reduce((a, b) => a + b, 0);
      st.lastPts = pts; pts.forEach((p, i) => st.total[i] += p);
    },
    // 輪到的人斷線時，代打：能 Pass 就 Pass，否則出最小的單張（第一手出必出的那張）
    auto(st) {
      if (st.phase !== 'play') return null;
      const s = st.turn;
      if (st.top) return { seat: s, a: { type: 'pass' } };
      const c = st.first ? st.mustCard : st.hands[s].reduce((a, c) => val(c) < val(a) ? c : a);
      return { seat: s, a: { type: 'play', cards: [c] } };
    },
    view(st, seat) {
      return {
        phase: st.phase, turn: st.turn, top: st.top ? { seat: st.top.seat, cards: st.top.cards, name: TYPE_NAME[st.top.h.t] } : null,
        counts: st.hands.map(h => h.length), hand: seat >= 0 ? st.hands[seat].slice().sort((a, b) => val(a) - val(b)) : null,
        passes: st.passes, history: st.history.slice(-8), winner: st.winner, total: st.total, lastPts: st.lastPts, round: st.round,
        first: st.first, mustCard: st.mustCard, deadline: st.deadline,
        reveal: st.phase === 'over' ? st.hands : null
      };
    },
    _sel: new Set(), _sortBy: 'rank',
    render(el, v, ui) {
      const me = v.seat; el.dataset.g = 'bigtwo';
      if (v.hand) this._sel = new Set([...this._sel].filter(c => v.hand.includes(c))); else this._sel.clear();
      const hand = v.hand ? v.hand.slice().sort((a, b) => this._sortBy === 'suit' ? (U.suit(a) - U.suit(b)) || (val(a) - val(b)) : val(a) - val(b)) : [];
      const sel = [...this._sel]; const h = sel.length ? fixK(classify(sel), sel) : null;
      const myTurn = v.phase === 'play' && v.turn === me;
      el.innerHTML = `
        <div class="players-row">${v.names.map((n, i) => `<div class="pchip ${i === v.turn && v.phase === 'play' ? 'turn' : ''}">${U.esc(n)}<b>${v.counts[i]} 張</b>${v.passes.includes(i) ? '<small>Pass</small>' : ''}<small>${v.total[i] >= 0 ? '+' : ''}${v.total[i]}</small></div>`).join('')}</div>
        <div class="b2-table">
          <div class="b2-timer">${v.phase === 'play' ? `輪到 ${U.esc(v.names[v.turn])} <span class="timer" data-deadline="${v.deadline || ''}"></span>` : ''}</div>
          ${v.top ? `<div class="b2-top"><small>${U.esc(v.names[v.top.seat])}：${v.top.name}</small><div class="cards">${v.top.cards.slice().sort((a, b) => val(a) - val(b)).map(c => U.cardHTML(c)).join('')}</div></div>`
          : `<div class="b2-top empty">${v.phase === 'play' ? `${U.esc(v.names[v.turn])} 自由出牌${v.first ? `（要含 ${U.RANKS[U.rank(v.mustCard)]}${U.SUITS[U.suit(v.mustCard)]}）` : ''}` : ''}</div>`}
          ${v.phase === 'over' ? `<div class="b2-over"><h3>🎉 ${U.esc(v.names[v.winner])} 出完了！</h3>${v.names.map((n, i) => `<p>${U.esc(n)}：${v.lastPts[i] >= 0 ? '+' : ''}${v.lastPts[i]}</p>`).join('')}${me >= 0 ? '<button class="btn" data-a="next">下一局</button>' : ''}</div>` : ''}
        </div>
        ${v.hand ? `<div class="hand-tools"><span class="hint">${sel.length ? (h ? '✔ ' + (TYPE_NAME[h.t]) : '✘ 不是牌型') : (myTurn ? '輪到你了' : '')}</span>
          <button class="btn sm ghost" data-a="sort">${this._sortBy === 'rank' ? '依花色排' : '依點數排'}</button></div>
          <div class="hand cards fan">${hand.map(c => U.cardHTML(c, this._sel.has(c) ? 'sel' : '')).join('')}</div>
          <div class="act-row"><button class="btn" data-a="play" ${myTurn && h ? '' : 'disabled'}>出牌</button><button class="btn ghost" data-a="pass" ${myTurn && v.top ? '' : 'disabled'}>Pass</button><button class="btn ghost sm" data-a="clr">取消選取</button></div>` : '<p class="spec-note">觀戰中</p>'}`;
      el.querySelectorAll('.hand .card').forEach(c => c.onclick = () => { const id = +c.dataset.c; this._sel.has(id) ? this._sel.delete(id) : this._sel.add(id); this.render(el, v, ui); });
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const a = b.dataset.a;
        if (a === 'sort') { this._sortBy = this._sortBy === 'rank' ? 'suit' : 'rank'; this.render(el, v, ui); }
        else if (a === 'clr') { this._sel.clear(); this.render(el, v, ui); }
        else if (a === 'play') { ui.send({ type: 'play', cards: [...this._sel] }); }
        else ui.send({ type: a });
      });
    }
  };
  root.GAMES.bigtwo = M;
})(typeof window !== 'undefined' ? window : globalThis);
