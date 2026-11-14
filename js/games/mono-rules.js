// 大富翁規則（房主判定）
(function (root) {
  const U = root.GUTIL;
  const TH = () => root.MONO_THEMES;

  // 28 格：0 起點、7 監獄、14 休息、21 進監獄；P=地產(群組)，L=幸運，B=厄運，X=稅，T=傳送
  const LAYOUT = ['S', 'P0', 'L', 'P0', 'X', 'P1', 'B', 'J', 'P1', 'P2', 'L', 'P2', 'P3', 'B', 'F', 'P3', 'P4', 'L', 'P4', 'T', 'P5', 'G', 'P5', 'B', 'P6', 'P6', 'P7', 'P7'];
  const GROUP_PRICE = [3000, 4000, 5000, 6000, 8000, 9000, 11000, 13000];
  const GROUP_COLOR = ['#8d6e63', '#4fc3f7', '#ec407a', '#ffa726', '#ef5350', '#ffee58', '#66bb6a', '#5c6bc0'];
  const RENT_MUL = [0.12, 0.45, 1.0, 1.8, 2.8];
  const START_BONUS = 5000, TAX = 3000, JAIL = 7;
  const BOARD = []; { let pi = 0; LAYOUT.forEach((c, i) => {
    if (c[0] === 'P') { const g = +c[1]; BOARD.push({ i, type: 'prop', g, pi: pi++, price: GROUP_PRICE[g], up: Math.round(GROUP_PRICE[g] * 0.6), color: GROUP_COLOR[g] }); }
    else BOARD.push({ i, type: { S: 'start', L: 'luck', B: 'bad', X: 'tax', J: 'jail', F: 'free', G: 'gotojail', T: 'teleport' }[c] });
  }); }
  const N = BOARD.length;

  function tileName(theme, i) {
    const t = BOARD[i], th = TH()[theme];
    if (t.type === 'prop') return th.props[t.pi];
    if (t.type === 'start') return th.corners.start; if (t.type === 'jail') return th.corners.jail;
    if (t.type === 'free') return th.corners.free; if (t.type === 'gotojail') return th.corners.gotojail;
    if (t.type === 'tax') return th.tax; if (t.type === 'teleport') return th.teleport;
    if (t.type === 'luck') return th.luckName; return th.badName;
  }
  function rentOf(st, i) {
    const t = BOARD[i]; const lv = st.levels[i]; let r = Math.round(t.price * RENT_MUL[lv]);
    if (lv === 0) { const same = BOARD.filter(b => b.type === 'prop' && b.g === t.g); if (same.every(b => st.owners[b.i] === st.owners[i])) r *= 2; }
    return r;
  }
  function worth(st, s) {
    let w = st.players[s].cash;
    BOARD.forEach(t => { if (t.type === 'prop' && st.owners[t.i] === s) w += t.price + st.levels[t.i] * t.up; });
    return w;
  }
  const alive = (st) => U.range(st.n).filter(s => st.players[s].alive);

  function ev(st, e) { st.ev.push(e); st.anim += ({ move: 0.3 * ((e.path && e.path.length) || 1), card: 2.6, dice: 1.0, tp: 1.0, jail: 1.2 }[e.t] || 0.4) * 1000; }

  function moveTo(st, s, steps) {
    const p = st.players[s]; const path = []; let pos = p.pos;
    const dir = steps >= 0 ? 1 : -1;
    for (let k = 0; k < Math.abs(steps); k++) {
      pos = (pos + dir + N) % N; path.push(pos);
      if (dir > 0 && pos === 0) { p.cash += START_BONUS; ev(st, { t: 'cash', seat: s, amt: START_BONUS, why: '經過起點' }); }
    }
    p.pos = pos; ev(st, { t: 'move', seat: s, path });
  }
  function jump(st, s, to, bonusIfPassStart) {
    const p = st.players[s];
    if (bonusIfPassStart) { let steps = (to - p.pos + N) % N; if (steps === 0) steps = N; moveTo(st, s, steps); return; }
    p.pos = to; ev(st, { t: 'tp', seat: s, to });
  }
  function pay(st, from, to, amt, why) {
    if (amt <= 0) return 0;
    const p = st.players[from];
    p.cash -= amt; liquidate(st, from);
    let paid = amt;
    if (p.cash < 0) { paid = amt + p.cash; p.cash = 0; bankrupt(st, from); }
    if (to >= 0 && st.players[to].alive) st.players[to].cash += paid;
    ev(st, { t: 'pay', from, to, amt: paid, why });
    return paid;
  }
  function liquidate(st, s) {
    const p = st.players[s]; if (p.cash >= 0) return;
    const mine = BOARD.filter(t => t.type === 'prop' && st.owners[t.i] === s);
    // 先賣建築（半價），再賣地（半價）
    for (const t of mine.slice().sort((a, b) => st.levels[b.i] - st.levels[a.i])) {
      while (p.cash < 0 && st.levels[t.i] > 0) { st.levels[t.i]--; p.cash += Math.round(t.up / 2); ev(st, { t: 'sell', seat: s, tile: t.i, what: 'building' }); }
    }
    for (const t of mine) { if (p.cash >= 0) break; st.owners[t.i] = -1; p.cash += Math.round(t.price / 2); ev(st, { t: 'sell', seat: s, tile: t.i, what: 'land' }); }
  }
  function bankrupt(st, s) {
    const p = st.players[s]; p.alive = false;
    BOARD.forEach(t => { if (st.owners[t.i] === s) { st.owners[t.i] = -1; st.levels[t.i] = 0; } });
    ev(st, { t: 'bankrupt', seat: s });
  }
  function sendJail(st, s) {
    const p = st.players[s];
    if (p.jailfree > 0) { p.jailfree--; ev(st, { t: 'jailfree', seat: s }); return; }
    p.pos = JAIL; p.skip = Math.max(p.skip, 1); ev(st, { t: 'jail', seat: s });
  }
  function mine(st, s) { return BOARD.filter(t => t.type === 'prop' && st.owners[t.i] === s); }

  function drawCard(st, deck) {
    const th = TH()[st.theme]; const list = th[deck === 'luck' ? 'lucky' : 'bad'];
    if (!st.decks[deck] || !st.decks[deck].length) st.decks[deck] = U.shuffle(U.range(list.length));
    const idx = st.decks[deck].pop(); return { idx, text: list[idx][0], eff: list[idx][1] };
  }
  function applyCard(st, s, deck, card, depth) {
    const p = st.players[s];
    ev(st, { t: 'card', seat: s, deck, text: card.text, eff: card.eff });
    if (deck === 'bad' && p.immune > 0) { p.immune--; ev(st, { t: 'immune', seat: s }); return; }
    const [k, v0] = card.eff.split(':'); const v = +v0;
    switch (k) {
      case 'm': if (v >= 0) { p.cash += v; ev(st, { t: 'cash', seat: s, amt: v }); } else pay(st, s, -1, -v, '卡片'); break;
      case 'mv': moveTo(st, s, v); land(st, s, depth + 1); break;
      case 'go': jump(st, s, v, true); land(st, s, depth + 1); break;
      case 'gonb': jump(st, s, v, false); break;
      case 'jail': sendJail(st, s); break;
      case 'skip': p.skip += v; ev(st, { t: 'skipset', seat: s, n: v }); break;
      case 'immune': p.immune++; break;
      case 'jailfree': p.jailfree++; break;
      case 'up': {
        const c = mine(st, s).filter(t => st.levels[t.i] < 4);
        if (c.length) { const t = c.sort((a, b) => st.levels[a.i] - st.levels[b.i] || b.price - a.price)[0]; st.levels[t.i]++; ev(st, { t: 'up', tile: t.i, level: st.levels[t.i], seat: s, free: true }); }
        else { p.cash += 3000; ev(st, { t: 'cash', seat: s, amt: 3000, why: '沒有可升級的地，改發現金' }); }
        break;
      }
      case 'down': {
        const c = mine(st, s).filter(t => st.levels[t.i] > 0);
        if (c.length) { const t = c.sort((a, b) => st.levels[b.i] - st.levels[a.i])[0]; st.levels[t.i]--; ev(st, { t: 'down', tile: t.i, level: st.levels[t.i], seat: s }); }
        else pay(st, s, -1, 1500, '沒有建築可壞，改罰款');
        break;
      }
      case 'each': alive(st).filter(o => o !== s).forEach(o => pay(st, o, s, v, '卡片')); break;
      case 'give': alive(st).filter(o => o !== s).forEach(o => { if (p.alive) pay(st, s, o, v, '卡片'); }); break;
      case 'house': { const lv = mine(st, s).reduce((a, t) => a + st.levels[t.i], 0); if (lv) pay(st, s, -1, lv * Math.abs(v), '建築費'); else ev(st, { t: 'note', seat: s, text: '你沒有建築，逃過一劫' }); break; }
      case 'pct': pay(st, s, -1, Math.floor(p.cash * Math.abs(v) / 100), '卡片'); break;
      case 'teleport': { const to = BOARD.filter(t => t.type === 'prop')[Math.floor(Math.random() * 16)].i; jump(st, s, to, false); land(st, s, depth + 1); break; }
      case 'psycho': {
        pay(st, s, -1, Math.floor(p.cash * 0.3), '神機錯亂');
        for (let k2 = 0; k2 < 2; k2++) { const c = mine(st, s).filter(t => st.levels[t.i] > 0).sort((a, b) => st.levels[b.i] - st.levels[a.i])[0]; if (c) { st.levels[c.i]--; ev(st, { t: 'down', tile: c.i, level: st.levels[c.i], seat: s }); } }
        p.skip += 2; ev(st, { t: 'skipset', seat: s, n: 2 });
        break;
      }
    }
  }
  // 停在某格之後要做的事；若需要玩家決定，設定 phase 並回傳 true
  function land(st, s, depth) {
    const p = st.players[s]; if (!p.alive || depth > 3) return false;
    const t = BOARD[p.pos];
    if (t.type === 'prop') {
      const o = st.owners[t.i];
      if (o === -1) { if (p.cash >= t.price) { st.phase = 'buy'; st.pending = { tile: t.i }; return true; } ev(st, { t: 'note', seat: s, text: '錢不夠買這塊地' }); return false; }
      if (o === s) { if (st.levels[t.i] < 4 && p.cash >= t.up) { st.phase = 'upgrade'; st.pending = { tile: t.i }; return true; } return false; }
      if (st.players[o].alive) pay(st, s, o, rentOf(st, t.i), '過路費');
      return false;
    }
    if (t.type === 'luck' || t.type === 'bad') { applyCard(st, s, t.type, drawCard(st, t.type), depth); return st.phase === 'buy' || st.phase === 'upgrade'; }
    if (t.type === 'tax') { pay(st, s, -1, TAX, t.type); return false; }
    if (t.type === 'gotojail') { sendJail(st, s); return false; }
    if (t.type === 'teleport') { const to = BOARD.filter(b => b.type === 'prop')[Math.floor(Math.random() * 16)].i; jump(st, s, to, false); return land(st, s, depth + 1); }
    return false;
  }
  function endTurn(st, now) {
    st.phase = 'roll'; st.pending = null;
    const al = alive(st);
    if (al.length <= 1) return finish(st);
    let s = st.turn;
    for (let guard = 0; guard < st.n * 4; guard++) {
      s = (s + 1) % st.n;
      if (s === st.first) { st.round++; if (st.round > st.maxRounds) return finish(st); }
      const p = st.players[s]; if (!p.alive) continue;
      if (p.skip > 0) { p.skip--; ev(st, { t: 'skip', seat: s }); continue; }
      break;
    }
    st.turn = s; setDeadline(st, now, 15000);
  }
  function finish(st) {
    st.phase = 'over'; st.deadline = 0;
    const ranks = U.range(st.n).map(s => ({ s, w: st.players[s].alive ? worth(st, s) : -1 })).sort((a, b) => b.w - a.w);
    st.winner = ranks[0].s; st.ranks = ranks;
  }
  function setDeadline(st, now, ms) { st.deadline = now + st.anim + ms; }

  const R = {
    BOARD, N, LAYOUT, GROUP_COLOR, START_BONUS, JAIL, tileName, rentOf, worth,
    init(n, o, now) {
      const theme = TH()[o.theme] ? o.theme : 'ragnarok';
      const cash = +o.cash || 50000;
      const st = {
        n, theme, maxRounds: +o.rounds || 20, round: 1, first: 0, turn: 0, phase: 'pick',
        players: U.range(n).map(() => ({ cash, pos: 0, alive: true, skip: 0, immune: 0, jailfree: 0, char: null })),
        owners: Array(N).fill(-1), levels: Array(N).fill(0), decks: {}, ev: [], evId: 0, anim: 0, pending: null, dice: null
      };
      st.deadline = now + 90000;
      return st;
    },
    begin(st, now) {
      st.ev = []; st.anim = 0; st.evId++;
      const th = TH()[st.theme]; const used = st.players.map(p => p.char && p.char.kind === 'preset' ? p.char.i : -1);
      st.players.forEach(p => { if (!p.char) { const i = U.range(th.chars.length).find(i => !used.includes(i)); p.char = { kind: 'preset', i }; used.push(i); } });
      st.phase = 'roll'; st.turn = 0; st.first = 0; setDeadline(st, now, 15000);
    },
    act(st, s, a, now) {
      if (a.type === 'pick') {
        if (st.phase !== 'pick') return 'silent';
        const th = TH()[st.theme];
        if (a.custom) st.players[s].char = { kind: 'custom', i: s % th.chars.length };
        else {
          const i = a.i | 0; if (i < 0 || i >= th.chars.length) return '沒有這個角色';
          if (st.players.some((p, k) => k !== s && p.char && p.char.kind === 'preset' && p.char.i === i)) return '這個角色已經被選走了';
          st.players[s].char = { kind: 'preset', i };
        }
        if (st.players.every(p => p.char)) R.begin(st, now);
        return;
      }
      if (a.type === 'start' ) { if (st.phase === 'pick') R.begin(st, now); return; }
      if (st.phase === 'over' || st.phase === 'pick') return 'silent';
      if (s !== st.turn) return '還沒輪到你';
      const p = st.players[s];
      st.ev = []; st.anim = 0; st.evId++;
      if (a.type === 'roll') {
        if (st.phase !== 'roll') return 'silent';
        const d = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
        st.dice = d; ev(st, { t: 'dice', seat: s, d });
        moveTo(st, s, d[0] + d[1]);
        if (!land(st, s, 0)) endTurn(st, now); else setDeadline(st, now, 15000);
        return;
      }
      if (a.type === 'buy' || a.type === 'upgrade') {
        if (st.phase !== a.type) return 'silent';
        const t = BOARD[st.pending.tile];
        if (a.yes) {
          if (a.type === 'buy') { if (p.cash < t.price || st.owners[t.i] !== -1) return '錢不夠'; p.cash -= t.price; st.owners[t.i] = s; ev(st, { t: 'buy', seat: s, tile: t.i, amt: t.price }); }
          else { if (p.cash < t.up || st.levels[t.i] >= 4) return '不能升級'; p.cash -= t.up; st.levels[t.i]++; ev(st, { t: 'up', seat: s, tile: t.i, level: st.levels[t.i], amt: t.up }); }
        }
        endTurn(st, now); return;
      }
      return 'silent';
    },
    // 輪到的人沒反應（逾時或斷線）時的預設動作
    autoAct(st) {
      if (st.phase === 'pick') return { seat: -1, a: { type: 'start' } };
      if (st.phase === 'roll') return { seat: st.turn, a: { type: 'roll' } };
      if (st.phase === 'buy' || st.phase === 'upgrade') {
        const t = BOARD[st.pending.tile]; const cost = st.phase === 'buy' ? t.price : t.up;
        return { seat: st.turn, a: { type: st.phase, yes: st.players[st.turn].cash - cost >= 8000 } };
      }
      return null;
    }
  };
  root.MONO_RULES = R;
})(typeof window !== 'undefined' ? window : globalThis);
