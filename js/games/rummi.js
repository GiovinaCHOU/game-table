// 拉密（Rummikub 數字牌）
(function (root) {
  const U = root.GUTIL;
  const JOKER = (t) => t >= 104;
  const color = (t) => Math.floor((t % 52) / 13);
  const num = (t) => (t % 52) % 13 + 1;
  const COLORS = ['黑', '紅', '藍', '橘'];

  function analyze(set) {
    if (!Array.isArray(set) || set.length < 3) return null;
    const nj = set.filter(t => !JOKER(t)); const j = set.length - nj.length;
    if (!nj.length) return null;
    // 同數字組
    const n0 = num(nj[0]);
    if (set.length <= 4 && nj.every(t => num(t) === n0) && new Set(nj.map(color)).size === nj.length) {
      return { kind: 'group', value: n0 * set.length, order: nj.slice().sort((a, b) => color(a) - color(b)).concat(set.filter(JOKER)) };
    }
    // 同色順子
    const c0 = color(nj[0]);
    if (set.length <= 13 && nj.every(t => color(t) === c0)) {
      const ns = nj.map(num).sort((a, b) => a - b);
      if (new Set(ns).size !== ns.length) return null;
      const mn = ns[0], mx = ns[ns.length - 1];
      if (mx - mn + 1 > set.length) return null;
      let start = mn; if (start + set.length - 1 > 13) start = 14 - set.length;
      const jokers = set.filter(JOKER); const order = [];
      for (let k = start; k < start + set.length; k++) { const t = nj.find(x => num(x) === k); order.push(t != null ? t : jokers.pop()); }
      let value = 0; for (let k = start; k < start + set.length; k++) value += k;
      return { kind: 'run', value, order };
    }
    return null;
  }
  const tileVal = (t) => JOKER(t) ? 30 : num(t);
  const key = (set) => set.slice().sort((a, b) => a - b).join(',');

  function nextTurn(st, now) {
    st.turn = (st.turn + 1) % st.n; st.turnId++;
    st.deadline = st.limit ? now + st.limit * 1000 : 0;
  }
  // 抽一張；牌池空了就算「跳過」。所有人連續跳過一輪 → 結算（手牌點數最少的人贏）
  function drawOne(st, seat) {
    if (st.pool.length) { st.racks[seat].push(st.pool.pop()); st.passes = 0; return true; }
    st.passes = (st.passes || 0) + 1; return false;
  }
  function finish(st, winner, reason) {
    st.phase = 'over'; st.winner = winner; st.endReason = reason;
    const sums = st.racks.map(r => r.reduce((a, t) => a + tileVal(t), 0));
    const pts = sums.map(x => -(x - sums[winner]));
    pts[winner] = -pts.reduce((a, b, i) => i === winner ? a : a + b, 0);
    st.lastPts = pts; pts.forEach((p, i) => st.total[i] += p);
  }
  function afterPass(st, now) {
    if ((st.passes || 0) >= st.n) {
      const sums = st.racks.map(r => r.reduce((a, t) => a + tileVal(t), 0));
      finish(st, sums.indexOf(Math.min(...sums)), 'pool'); return;
    }
    nextTurn(st, now);
  }

  // ===== 電腦玩家（簡單）：只用自己的牌組牌組，再把單張接到桌上現成的牌組，不會拆桌上的牌 =====
  function findSets(rack) {
    let left = rack.filter(t => !JOKER(t)); let jokers = rack.filter(JOKER); const sets = [];
    const pickRun = () => {
      let best = null;
      for (let c = 0; c < 4; c++) {
        const byNum = {}; left.filter(t => color(t) === c).forEach(t => { if (!(num(t) in byNum)) byNum[num(t)] = t; });
        let cur = [];
        for (let k = 1; k <= 14; k++) {
          if (byNum[k] != null) cur.push(byNum[k]);
          else { if (cur.length >= 3 && (!best || cur.length > best.length)) best = cur; cur = []; }
        }
      }
      return best;
    };
    const pickGroup = () => {
      let best = null;
      for (let k = 13; k >= 1; k--) {
        const byCol = {}; left.filter(t => num(t) === k).forEach(t => { if (!(color(t) in byCol)) byCol[color(t)] = t; });
        const g = Object.values(byCol);
        if (g.length >= 3 && (!best || g.length > best.length)) best = g;
      }
      return best;
    };
    for (;;) {
      const r = pickRun(), g = pickGroup();
      const s = r && g ? (r.length >= g.length ? r : g) : (r || g);
      if (!s) break;
      sets.push(s); left = left.filter(t => !s.includes(t));
    }
    // 鬼牌補兩張的半成品（同數字不同色，或同色差 1～2）
    while (jokers.length) {
      let pair = null;
      outer: for (let i = 0; i < left.length; i++) for (let j = i + 1; j < left.length; j++) {
        const a = left[i], b = left[j];
        if (num(a) === num(b) && color(a) !== color(b)) { pair = [a, b]; break outer; }
        if (color(a) === color(b) && Math.abs(num(a) - num(b)) >= 1 && Math.abs(num(a) - num(b)) <= 2) { pair = [a, b]; break outer; }
      }
      if (!pair) break;
      const s = pair.concat(jokers.shift());
      if (!analyze(s)) break;
      sets.push(s); left = left.filter(t => !pair.includes(t));
    }
    return sets;
  }
  function botMove(st) {
    const seat = st.turn, rack = st.racks[seat];
    let sets = findSets(rack).filter(s => analyze(s));
    if (!st.melded[seat]) {
      const sum = sets.reduce((a, s) => a + analyze(s).value, 0);
      if (sum < 30) return { type: 'draw' };
      return { type: 'commit', table: st.table.map(s => s.slice()).concat(sets) };
    }
    const table = st.table.map(s => s.slice()).concat(sets);
    let hand = rack.filter(t => !sets.some(s => s.includes(t)));
    // 單張接到桌上的牌組（含剛放下的），一直接到接不上為止
    for (let changed = true; changed;) {
      changed = false;
      for (const t of hand.slice()) {
        for (let i = 0; i < table.length; i++) {
          const r = analyze(table[i].concat(t));
          if (r) { table[i] = r.order; hand = hand.filter(x => x !== t); changed = true; break; }
        }
      }
    }
    if (hand.length === rack.length) return { type: 'draw' };
    return { type: 'commit', table };
  }

  const M = {
    id: 'rummi', name: '拉密', icon: '🔢', min: 2, max: 4,
    desc: '4 色 × 1–13 各兩張數字牌，加上鬼牌（可以當任何數字和顏色，圖案是家裡的毛孩）。每人 14 張，輪流把牌組成「同數字不同色 3–4 張」或「同色連號 3 張以上」放到桌上，也可以拆改桌上的牌組。第一次下牌需要自己的牌總和 ≥30。不出牌就要抽一張；牌池抽完後不出牌就跳過，所有人連續跳過一輪就結算，手牌點數最少的人贏。先出完的人贏。',
    options: [{ key: 'limit', label: '每回合時間', choices: [[0, '不限'], [60, '60 秒'], [120, '120 秒']], def: 120 },
      { key: 'jokers', label: '鬼牌數量', choices: [[2, '2 張（每局隨機兩隻）'], [4, '4 張（四隻都出場）']], def: 2 }],
    analyze,
    init(n, o, names, now) {
      const J = +o.jokers === 4 ? 4 : 2, pool = U.shuffle(U.range(104 + J));
      const st = { n, limit: +o.limit, jokers: J, pets: U.shuffle([0, 1, 2, 3]).slice(0, J), pool, racks: U.range(n).map(() => pool.splice(0, 14)), table: [], melded: Array(n).fill(false), turn: 0, turnId: 1, phase: 'play', total: Array(n).fill(0), round: 1, starter: 0 };
      st.deadline = st.limit ? now + st.limit * 1000 : 0; return st;
    },
    action(st, seat, a, ctx) {
      const now = ctx.now;
      if (a.type === 'next') {
        if (st.phase !== 'over') return;
        const n = st.n; const fresh = this.init(n, { limit: st.limit, jokers: st.jokers }, null, now);
        fresh.total = st.total; fresh.round = st.round + 1; fresh.starter = (st.starter + 1) % n; fresh.turn = fresh.starter;
        Object.keys(st).forEach(k => delete st[k]); Object.assign(st, fresh); return;
      }
      if (st.phase !== 'play') return 'silent';
      if (seat !== st.turn) return '還沒輪到你';
      if (a.type === 'draw') { const got = drawOne(st, seat); st.log = got ? `${ctx.names[seat]} 抽了一張` : `${ctx.names[seat]} 跳過（牌池已空）`; afterPass(st, now); return; }
      if (a.type === 'commit') {
        const table = a.table;
        if (!Array.isArray(table) || !table.every(Array.isArray)) return '資料錯誤';
        const newTiles = table.flat().map(Number);
        if (new Set(newTiles).size !== newTiles.length) return '資料錯誤（重複的牌）';
        const oldTiles = new Set(st.table.flat());
        const rack = new Set(st.racks[seat]);
        for (const t of oldTiles) if (!newTiles.includes(t)) return '桌上原本的牌不能拿回手上';
        const played = newTiles.filter(t => !oldTiles.has(t));
        if (!played.every(t => rack.has(t))) return '資料錯誤';
        if (!played.length) return '你沒有出任何牌（不出請按抽牌）';
        for (const s of table) if (!analyze(s)) return '桌上有不合法的牌組（紅框）';
        if (!st.melded[seat]) {
          const oldKeys = st.table.map(key); const newKeys = table.map(key);
          const left = newKeys.slice();
          for (const k of oldKeys) { const i = left.indexOf(k); if (i < 0) return '第一次下牌前不能動桌上的牌'; left.splice(i, 1); }
          const fresh = table.filter(s => left.includes(key(s)));
          if (!fresh.every(s => s.every(t => rack.has(t)))) return '第一次下牌只能用自己的牌';
          const sum = fresh.reduce((a, s) => a + analyze(s).value, 0);
          if (sum < 30) return `第一次下牌總和要 ≥30（目前 ${sum}）`;
          st.melded[seat] = true;
        }
        st.table = table.map(s => analyze(s).order);
        st.racks[seat] = st.racks[seat].filter(t => !played.includes(t));
        st.log = `${ctx.names[seat]} 出了 ${played.length} 張`;
        st.passes = 0;
        if (!st.racks[seat].length) { finish(st, seat, 'out'); return; }
        nextTurn(st, now); return;
      }
    },
    tick(st, now) {
      if (st.phase === 'play' && st.deadline && now > st.deadline) { const got = drawOne(st, st.turn); st.log = got ? '時間到，自動抽牌' : '時間到，跳過'; afterPass(st, now); return true; }
      return false;
    },
    // 電腦／託管／斷線代打：同一個回合只算一次（房主每個 tick 都會問）
    _memo: null,
    auto(st) {
      if (st.phase !== 'play') return null;
      const k = st.turnId + ':' + st.racks[st.turn].length + ':' + st.table.length;
      if (!this._memo || this._memo.k !== k) { let a; try { a = botMove(st); } catch (e) { a = { type: 'draw' }; } this._memo = { k, a }; }
      return { seat: st.turn, a: this._memo.a };
    },
    view(st, seat) {
      return { phase: st.phase, turn: st.turn, turnId: st.turnId, table: st.table, rack: seat >= 0 ? st.racks[seat] : null,
        counts: st.racks.map(r => r.length), pool: st.pool.length, melded: st.melded, deadline: st.deadline, log: st.log,
        winner: st.winner, endReason: st.endReason, lastPts: st.lastPts, total: st.total, reveal: st.phase === 'over' ? st.racks : null, pets: st.pets || [3, 0] };
    },

    // ================= 畫面 =================
    _w: null, _sort: 'color',
    tileHTML(t, cls) {
      if (JOKER(t)) return `<span class="rt joker ${cls || ''}" data-t="${t}" title="鬼牌"><img src="img/pet${((this._pets || [3, 0])[t - 104]) ?? 3}.png" alt="鬼牌" draggable="false"></span>`;
      return `<span class="rt c${color(t)} ${cls || ''}" data-t="${t}">${num(t)}</span>`;
    },
    render(el, v, ui) {
      this._pets = v.pets;
      el.dataset.g = 'rummi'; const me = v.seat; const myTurn = v.phase === 'play' && v.turn === me;
      if (!this._w || this._w.turnId !== v.turnId || !myTurn || this._w.phase !== v.phase) {
        this._w = { turnId: v.turnId, phase: v.phase, table: v.table.map(s => s.slice()), rack: (v.rack || []).slice(), orig: new Set(v.rack || []), sel: new Set() };
      }
      const w = this._w;
      const sortRack = (r) => r.slice().sort((a, b) => {
        if (JOKER(a) || JOKER(b)) return JOKER(a) - JOKER(b);
        return this._sort === 'color' ? (color(a) - color(b)) || (num(a) - num(b)) : (num(a) - num(b)) || (color(a) - color(b));
      });
      const freshVal = () => {
        const oldKeys = v.table.map(key); const left = w.table.map(key);
        oldKeys.forEach(k => { const i = left.indexOf(k); if (i >= 0) left.splice(i, 1); });
        return w.table.filter(s => left.includes(key(s))).reduce((a, s) => { const r = analyze(s); return a + (r ? r.value : 0); }, 0);
      };
      const changed = w.rack.length !== (v.rack || []).length || JSON.stringify(w.table) !== JSON.stringify(v.table);
      el.innerHTML = `
        <div class="players-row">${v.names.map((n, i) => `<div class="pchip ${i === v.turn && v.phase === 'play' ? 'turn' : ''}">${U.esc(n)}<b>${v.counts[i]} 張</b><small>${v.melded[i] ? '已破冰' : '未破冰'} · ${v.total[i] >= 0 ? '+' : ''}${v.total[i]}</small></div>`).join('')}</div>
        <div class="rm-status">牌池 ${v.pool} 張 · ${v.phase === 'play' ? `輪到 <b>${U.esc(v.names[v.turn])}</b>` : ''} <span class="timer" data-deadline="${v.deadline || ''}"></span> <small>${U.esc(v.log || '')}</small></div>
        ${v.phase === 'over' ? `<div class="b2-over"><h3>🎉 ${v.endReason === 'pool' ? `牌池抽完，${U.esc(v.names[v.winner])} 手牌點數最少！` : `${U.esc(v.names[v.winner])} 出完了！`}</h3>${v.names.map((n, i) => `<p>${U.esc(n)}：${v.lastPts[i] >= 0 ? '+' : ''}${v.lastPts[i]}</p>`).join('')}${me >= 0 ? '<button class="btn" data-a="next">下一局</button>' : ''}</div>` : ''}
        <div class="rm-table ${(n => n > 70 ? 'd2' : n > 36 ? 'd1' : '')(w.table.reduce((a, x) => a + x.length, 0))}">${w.table.map((s, i) => { const r = analyze(s); return `<div class="rm-set ${r ? '' : 'bad'}" data-set="${i}">${(r ? r.order : s).map(t => this.tileHTML(t, w.sel.has(t) ? 'sel' : '')).join('')}${myTurn && w.sel.size ? '<span class="rm-plus">＋</span>' : ''}</div>`; }).join('') || '<p class="hint">桌上還沒有牌</p>'}</div>
        ${v.rack ? `<div class="rm-rack-tools">
            ${myTurn && !v.melded[me] ? `<span class="hint">破冰進度：${freshVal()}/30</span>` : ''}
            <button class="btn sm ghost" data-a="sort">${this._sort === 'color' ? '依數字排' : '依顏色排'}</button></div>
          <div class="rm-rack">${sortRack(w.rack).map(t => this.tileHTML(t, w.sel.has(t) ? 'sel' : '')).join('')}</div>
          ${myTurn ? `<div class="act-row">
            <button class="btn sm" data-a="new" ${w.sel.size ? '' : 'disabled'}>選的牌→新牌組</button>
            <button class="btn sm ghost" data-a="back" ${w.sel.size ? '' : 'disabled'}>收回手上</button>
            <button class="btn sm ghost" data-a="reset" ${changed ? '' : 'disabled'}>重來</button></div>
            <div class="act-row"><button class="btn" data-a="commit" ${changed ? '' : 'disabled'}>完成出牌</button><button class="btn ghost" data-a="draw" ${changed ? 'disabled' : ''}>${v.pool ? '抽一張' : '跳過（牌池已空）'}</button></div>
            <p class="hint">點選牌 → 點桌上的牌組加進去，或按「新牌組」。桌上的牌可以拆開重組。</p>` : ''}` : '<p class="spec-note">觀戰中</p>'}`;
      const rerender = () => this.render(el, v, ui);
      const removeSel = () => {
        w.table = w.table.map(s => s.filter(t => !w.sel.has(t))).filter(s => s.length);
        w.rack = w.rack.filter(t => !w.sel.has(t));
      };
      el.querySelectorAll('.rt').forEach(tEl => tEl.onclick = (e) => {
        if (!myTurn) return; e.stopPropagation(); const t = +tEl.dataset.t;
        w.sel.has(t) ? w.sel.delete(t) : w.sel.add(t); rerender();
      });
      el.querySelectorAll('.rm-set').forEach(sEl => sEl.onclick = () => {
        if (!myTurn || !w.sel.size) return;
        const target = w.table[+sEl.dataset.set]; const moving = [...w.sel];
        const keep = target.filter(t => !w.sel.has(t));
        removeSel(); // 這可能刪掉 target 原本的陣列，用內容重新找
        const idx = w.table.findIndex(s => s.length === keep.length && s.every((t, i) => t === keep[i]));
        if (idx >= 0) w.table[idx] = keep.concat(moving); else w.table.push(keep.concat(moving));
        w.sel.clear(); rerender();
      });
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const a = b.dataset.a;
        if (a === 'sort') { this._sort = this._sort === 'color' ? 'num' : 'color'; rerender(); }
        else if (a === 'new') { const moving = [...w.sel]; removeSel(); w.table.push(moving); w.sel.clear(); rerender(); }
        else if (a === 'back') {
          const bad = [...w.sel].filter(t => !w.orig.has(t));
          if (bad.length) { ui.toast('桌上原本的牌不能拿回手上'); return; }
          const moving = [...w.sel]; removeSel(); w.rack = w.rack.concat(moving); w.sel.clear(); rerender();
        }
        else if (a === 'reset') { this._w = null; this.render(el, v, ui); }
        else if (a === 'commit') ui.send({ type: 'commit', table: w.table });
        else ui.send({ type: a });
      });
    }
  };
  root.GAMES.rummi = M;
})(typeof window !== 'undefined' ? window : globalThis);
