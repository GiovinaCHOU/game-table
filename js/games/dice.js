// 吹牛（大話骰）
(function (root) {
  const U = root.GUTIL;
  const FACE_ORDER = [2, 3, 4, 5, 6, 1]; // 1 最大
  const fr = (f) => FACE_ORDER.indexOf(f);
  const PIP = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  function roll(st) {
    st.dice = U.range(st.n).map(() => U.range(st.per).map(() => 1 + Math.floor(Math.random() * 6)));
    st.bid = null; st.bids = []; st.phase = 'bid'; st.wild = true; st.reveal = null; st.turn = st.starter;
  }
  const M = {
    id: 'dice', name: '吹牛', icon: '🎲', min: 2, max: 8,
    desc: '每人 6 顆骰子（可選 6–8 顆），只看得到自己的。輪流喊「全場至少有幾個幾」，下一個人要喊得更大（數量更多，或數量一樣但點數更大，1 最大），不信就按「開」。1 點可以當任何點數（萬用），但只要有人喊過「1」，這一局 1 就不能當萬用了。輸的人罰一杯並先喊下一局。',
    options: [{ key: 'per', label: '每人骰子', choices: [[6, '6 顆'], [7, '7 顆'], [8, '8 顆']], def: 6 },
      { key: 'tlimit', label: '每口時間', choices: [[25, '25 秒'], [40, '40 秒'], [15, '15 秒'], [0, '不限']], def: 25 },
      { key: 'minAdd', label: '開局最少喊', choices: [[1, '人數 +1 個'], [0, '人數 個'], [-99, '不限制']], def: 1 }],
    init(n, o, names, now) { const st = { n, per: Math.max(6, +o.per || 6), minAdd: +o.minAdd, tlimit: o.tlimit == null ? 25 : +o.tlimit, starter: 0, lose: Array(n).fill(0) }; roll(st); this._dl(st, now || Date.now()); return st; },
    _dl(st, now) { st.deadline = st.tlimit && st.phase === 'bid' ? now + st.tlimit * 1000 : 0; },
    tick(st, now) { if (!st.deadline || now <= st.deadline || st.phase !== 'bid') return false; const w = this.auto(st); if (!w) return false; this.action(st, w.seat, w.a, { now }); return true; },
    minCount(st) { return st.minAdd < -50 ? 1 : Math.max(1, st.n + st.minAdd); },
    action(st, seat, a, ctx) {
      const r = this._act(st, seat, a); if (!r) this._dl(st, (ctx && ctx.now) || Date.now()); return r;
    },
    _act(st, seat, a) {
      if (a.type === 'next') { if (st.phase !== 'reveal') return; roll(st); return; }
      if (st.phase !== 'bid') return 'silent';
      if (seat !== st.turn) return '還沒輪到你';
      if (a.type === 'bid') {
        const c = a.count | 0, f = a.face | 0;
        if (f < 1 || f > 6 || c < 1 || c > st.n * st.per) return '喊法不對';
        if (!st.bid) { if (c < this.minCount(st)) return `第一口至少要喊 ${this.minCount(st)} 個`; }
        else if (!(c > st.bid.count || (c === st.bid.count && fr(f) > fr(st.bid.face)))) return '要喊得比上一口大';
        st.bid = { seat, count: c, face: f }; st.bids.push(st.bid);
        if (f === 1) st.wild = false;
        st.turn = (seat + 1) % st.n; return;
      }
      if (a.type === 'open') {
        if (!st.bid) return '還沒有人喊';
        const f = st.bid.face;
        const actual = st.dice.flat().filter(d => d === f || (st.wild && f !== 1 && d === 1)).length;
        const loser = actual >= st.bid.count ? seat : st.bid.seat;
        st.lose[loser]++; st.starter = loser;
        st.reveal = { opener: seat, actual, loser, bid: st.bid, wild: st.wild };
        st.phase = 'reveal'; return;
      }
    },
    auto(st) {
      if (st.phase !== 'bid') return null;
      const b = st.bid;
      if (!b) return { seat: st.turn, a: { type: 'bid', count: this.minCount(st), face: 2 } };
      // 依自己的骰子估算：喊的數量明顯太多就開，否則加一
      const mine = st.dice[st.turn].filter(d => d === b.face || (st.wild && b.face !== 1 && d === 1)).length;
      const others = (st.n - 1) * st.per; const expect = mine + others * (st.wild && b.face !== 1 ? 1 / 3 : 1 / 6);
      if (b.count > expect + 1) return { seat: st.turn, a: { type: 'open' } };
      return { seat: st.turn, a: { type: 'bid', count: b.count + 1, face: b.face } };
    },
    view(st, seat) {
      return { phase: st.phase, turn: st.turn, bid: st.bid, bids: st.bids.slice(-10), wild: st.wild, lose: st.lose, per: st.per, n: st.n,
        deadline: st.deadline, mine: seat >= 0 ? st.dice[seat] : null, all: st.phase === 'reveal' ? st.dice : null, reveal: st.reveal, minCount: this.minCount(st) };
    },
    _pick: null,
    render(el, v, ui) {
      el.dataset.g = 'dice'; const me = v.seat; const myTurn = v.phase === 'bid' && v.turn === me;
      // 預設下一口
      if (!this._pick || this._pickKey !== JSON.stringify(v.bid)) {
        this._pickKey = JSON.stringify(v.bid);
        this._pick = v.bid ? { count: v.bid.face === 1 ? v.bid.count + 1 : v.bid.count, face: v.bid.face === 1 ? 2 : FACE_ORDER[fr(v.bid.face) + 1] } : { count: v.minCount, face: 2 };
      }
      const p = this._pick; const r = v.reveal;
      const dieHTML = (d, hl) => `<span class="die ${hl ? 'hl' : ''}">${PIP[d]}</span>`;
      const match = (d) => r && (d === r.bid.face || (r.wild && r.bid.face !== 1 && d === 1));
      el.innerHTML = `
        <div class="players-row">${v.names.map((n, i) => `<div class="pchip ${i === v.turn && v.phase === 'bid' ? 'turn' : ''}">${U.esc(n)}<small>🍺 ${v.lose[i]}</small></div>`).join('')}</div>
        <div class="dice-bid">${v.bid ? `<small>${U.esc(v.names[v.bid.seat])} 喊</small><strong>${v.bid.count} 個 ${PIP[v.bid.face]}</strong>` : '<small>等待第一口</small>'}
          <div class="wild ${v.wild ? '' : 'off'}">${v.wild ? '1 點目前是萬用' : '有人喊過 1，1 不是萬用'}</div></div>
        ${r ? `<div class="dice-reveal"><h3>${U.esc(v.names[r.opener])} 開！全場有 <b>${r.actual}</b> 個 ${PIP[r.bid.face]}（喊 ${r.bid.count} 個）</h3>
              <p>🍺 ${U.esc(v.names[r.loser])} 輸了，喝！</p>
              ${v.all.map((ds, i) => `<div class="dice-line"><span>${U.esc(v.names[i])}</span>${ds.map(d => dieHTML(d, match(d))).join('')}</div>`).join('')}
              ${me >= 0 ? '<button class="btn" data-a="next">下一局（重新搖）</button>' : ''}</div>` : ''}
        ${v.mine && !r ? `<div class="my-dice"><small>你的骰子（只有你看得到）</small><div>${v.mine.slice().sort().map(d => dieHTML(d)).join('')}</div></div>` : ''}
        ${me >= 0 && v.phase === 'bid' ? `<div class="bid-pad ${myTurn ? 'mine' : 'dim'}">
            <p class="turn-line">${myTurn ? '👉 輪到你了' : `等 ${U.esc(v.names[v.turn])} 喊…`} <span class="timer" data-deadline="${v.deadline || ''}"></span></p>
            <div class="bid-compose"><small>你要喊</small>
              <div class="cnt"><button class="btn sm" data-c="-1">－</button><b>${p.count}</b><span>個</span><button class="btn sm" data-c="1">＋</button></div>
              <div class="faces">${[2, 3, 4, 5, 6, 1].map(f => `<button class="die-btn ${p.face === f ? 'on' : ''}" data-f="${f}">${PIP[f]}</button>`).join('')}</div>
              <button class="btn big bid-go" data-a="bid" ${myTurn ? '' : 'disabled'}>📣 喊 ${p.count} 個 ${PIP[p.face]}</button>
            </div>
            <div class="open-zone"><small>不相信上一家？</small>
              <button class="btn open-go ${this._armed ? 'armed' : ''}" data-a="open" ${myTurn && v.bid ? '' : 'disabled'}>${this._armed ? '再按一次確定開！' : `🫵 開 ${v.bid ? U.esc(v.names[v.bid.seat]) + ' 的 ' + v.bid.count + ' 個' + PIP[v.bid.face] : ''}`}</button>
            </div>
          </div>` : ''}
        <div class="bid-log">${v.bids.map(b => `<span>${U.esc(v.names[b.seat])}：${b.count}個${PIP[b.face]}</span>`).join(' → ')}</div>`;
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { p.count = Math.max(1, Math.min(v.n * v.per, p.count + +b.dataset.c)); this.render(el, v, ui); });
      el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { p.face = +b.dataset.f; this.render(el, v, ui); });
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const a = b.dataset.a;
        if (a === 'bid') { this._armed = false; ui.send({ type: 'bid', count: p.count, face: p.face }); }
        else if (a === 'open') { // 開要按兩次，避免誤按
          if (!this._armed) { this._armed = true; clearTimeout(this._armT); this._armT = setTimeout(() => { this._armed = false; this.render(el, this._lastV || v, ui); }, 2500); this.render(el, v, ui); }
          else { this._armed = false; ui.send({ type: 'open' }); }
        } else ui.send({ type: a });
      });
      this._lastV = v;
    }
  };
  root.GAMES.dice = M;
})(typeof window !== 'undefined' ? window : globalThis);
