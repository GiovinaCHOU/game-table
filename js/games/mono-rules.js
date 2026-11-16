// 大富翁規則（房主判定）
(function (root) {
  const U = root.GUTIL;
  const TH = () => root.MONO_THEMES;

  // 28 格：0 起點、7 監獄、14 休息、21 進監獄；P=地產(群組)，L=幸運，B=厄運，X=稅，T=傳送，I=道具
  const LAYOUT = ['S', 'P0', 'L', 'P0', 'X', 'P1', 'B', 'J', 'P1', 'P2', 'I', 'P2', 'P3', 'B', 'F', 'P3', 'P4', 'L', 'P4', 'X', 'P5', 'G', 'P5', 'I', 'P6', 'P6', 'P7', 'P7'];
  const GROUP_PRICE = [3000, 4000, 5000, 6000, 8000, 9000, 11000, 13000];
  const GROUP_COLOR = ['#8d6e63', '#4fc3f7', '#ec407a', '#ffa726', '#ef5350', '#ffee58', '#66bb6a', '#5c6bc0'];
  const RENT_MUL = [0.092, 0.35, 0.74, 1.29, 2.02]; // 過路費比原本少約 8%
  const BUYOUT_MUL = 1.4, ROUND_CAP = 40;
  const START_BONUS = 5000, BOOST = 3000, JAIL = 7;
  // 稅金＝財產稅（總資產分段累進）＋房屋稅（每蓋一級 500，地標一塊 3,000），最少 1,000
  const TAX_BRACKETS = [[50000, 0.02], [100000, 0.05], [200000, 0.08], [Infinity, 0.11]], HOUSE_TAX = 500, LANDMARK_TAX = 3000;
  function taxDetail(st, s) {
    let w = worth(st, s), prev = 0, wealth = 0;
    for (const [cap, r] of TAX_BRACKETS) { if (w <= prev) break; wealth += (Math.min(w, cap) - prev) * r; prev = cap; }
    let house = 0; BOARD.forEach(t => { if (t.type === 'prop' && st.owners[t.i] === s) { const lv = st.levels[t.i]; house += lv >= 4 ? LANDMARK_TAX : lv * HOUSE_TAX; } });
    wealth = Math.round(wealth / 100) * 100;
    return { wealth, house, total: Math.max(1000, wealth + house) };
  }
  const taxOf = (st, s) => taxDetail(st, s).total;
  const BOARD = []; { let pi = 0; LAYOUT.forEach((c, i) => {
    if (c[0] === 'P') { const g = +c[1]; BOARD.push({ i, type: 'prop', g, pi: pi++, price: GROUP_PRICE[g], up: Math.round(GROUP_PRICE[g] * 0.6), color: GROUP_COLOR[g] }); }
    else BOARD.push({ i, type: { S: 'start', L: 'luck', B: 'bad', X: 'tax', J: 'jail', F: 'free', G: 'gotojail', T: 'teleport', I: 'item' }[c] });
  }); }
  const N = BOARD.length;

  function tileName(theme, i) {
    const t = BOARD[i], th = TH()[theme];
    if (t.type === 'prop') return th.props[t.pi];
    if (t.type === 'start') return th.corners.start; if (t.type === 'jail') return th.corners.jail;
    if (t.type === 'free') return th.corners.free; if (t.type === 'gotojail') return th.corners.gotojail;
    if (t.type === 'tax') return th.tax; if (t.type === 'teleport') return th.teleport;
    if (t.type === 'item') return ITEMS[theme].tile;
    if (t.type === 'luck') return th.luckName; return th.badName;
  }
  // 「打到有人破產／剩一人」模式：第 8 回合後過路費每回合漲 20%（最多 6 倍），避免無限拖長
  function inflation(st) { return st.inflate ? Math.min(6, 1 + Math.max(0, st.round - 8) * 0.2) : 1; }
  function rentOf(st, i) {
    const t = BOARD[i]; const lv = st.levels[i]; let r = Math.round(t.price * RENT_MUL[lv] * inflation(st));
    if (lv === 0) { const same = BOARD.filter(b => b.type === 'prop' && b.g === t.g); if (same.every(b => st.owners[b.i] === st.owners[i])) r *= 2; }
    return r;
  }
  function assets(st, s) {
    const a = { cash: st.players[s].cash, land: 0, bld: 0, tiles: [] };
    BOARD.forEach(t => { if (t.type === 'prop' && st.owners[t.i] === s) { a.land += t.price; a.bld += st.levels[t.i] * t.up; a.tiles.push(t.i); } });
    a.total = a.cash + a.land + a.bld; return a;
  }
  function worth(st, s) { return assets(st, s).total; }
  const buyoutOf = (st, i) => Math.round((BOARD[i].price + st.levels[i] * BOARD[i].up) * BUYOUT_MUL / 100) * 100;
  const alive = (st) => U.range(st.n).filter(s => st.players[s].alive);

  function ev(st, e) { st.ev.push(e); st.anim += ({ move: 0.3 * ((e.path && e.path.length) || 1), card: 2.6, dice: 1.0, tp: 1.0, jail: 1.2 }[e.t] || 0.4) * 1000; }

  function moveTo(st, s, steps) {
    const p = st.players[s]; const path = []; let pos = p.pos;
    const dir = steps >= 0 ? 1 : -1;
    for (let k = 0; k < Math.abs(steps); k++) {
      pos = (pos + dir + N) % N; path.push(pos);
      if (dir > 0 && pos === 0) {
        p.cash += START_BONUS; ev(st, { t: 'cash', seat: s, amt: START_BONUS, why: '經過起點' });
        if (isLast(st, s)) { p.cash += BOOST; ev(st, { t: 'cash', seat: s, amt: BOOST, why: '落後補助', boost: true }); }
      }
    }
    p.pos = pos; ev(st, { t: 'move', seat: s, path });
  }
  function jump(st, s, to, bonusIfPassStart) {
    const p = st.players[s];
    if (bonusIfPassStart) { let steps = (to - p.pos + N) % N; if (steps === 0) steps = N; moveTo(st, s, steps); return; }
    p.pos = to; ev(st, { t: 'tp', seat: s, to });
  }
  // 資產最少（且明顯落後）的人：經過起點多領補助
  function isLast(st, s) {
    const al = alive(st); if (al.length < 2) return false;
    const w = al.map(k => worth(st, k)); const me = worth(st, s);
    return me === Math.min(...w) && me < Math.max(...w) * 0.7;
  }
  function pay(st, from, to, amt, why, tile) {
    if (amt <= 0) return 0;
    const p = st.players[from];
    p.cash -= amt; liquidate(st, from);
    let paid = amt;
    if (p.cash < 0) { paid = amt + p.cash; p.cash = 0; bankrupt(st, from, to); }
    if (to >= 0 && st.players[to].alive) st.players[to].cash += paid;
    ev(st, { t: 'pay', from, to, amt: paid, why, tile });
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
  function canPay(st, s, amt) {
    let v = st.players[s].cash; BOARD.forEach(t => { if (t.type === 'prop' && st.owners[t.i] === s) v += Math.round(t.price / 2) + st.levels[t.i] * Math.round(t.up / 2); });
    return v >= amt;
  }
  const QUIZ_MS = 10000;
  function startQuiz(st, s, o, amt, tile) {
    // 隨機挑一個難度（簡單／中等／困難），同一場遊戲盡量不重複；全部出過一輪才重來
    const tb = (root.MONO_QUIZ || {})[st.theme] || {};
    const all = []; ['e', 'm', 'h'].forEach(lv => (tb[lv] || []).forEach((q, i) => all.push({ id: lv + i, lv, q })));
    if (!all.length) { pay(st, s, o, amt, '過路費', tile); return; }
    st.qused = st.qused || []; let left = all.filter(x => !st.qused.includes(x.id)); if (!left.length) { st.qused = []; left = all; }
    const lvs = [...new Set(left.map(x => x.lv))], lv = lvs[Math.floor(Math.random() * lvs.length)], pool = left.filter(x => x.lv === lv);
    const pick = pool[Math.floor(Math.random() * pool.length)]; st.qused.push(pick.id);
    const bank = [pick.q], qi = 0;
    const q = bank[qi]; const order = U.shuffle([0, 1, 2, 3]);
    st.quizKey = order.indexOf(0); st.quizNote = q[5] || ''; // 正確答案與小知識（揭曉前不給畫面）
    st.phase = 'quiz'; st.pending = { quiz: true, debtor: s, cred: o, amt, tile, q: q[0], lv: pick.lv, opts: order.map(k => q[1 + k]), ans: {}, start: 0 };
    ev(st, { t: 'quiz', debtor: s, cred: o, amt, tile }); st.anim += 1500;
  }
  function endQuiz(st, now) {
    const pd = st.pending, key = st.quizKey, a = pd.ans;
    const ok = (s) => a[s] && a[s].c === key;
    const dOK = ok(pd.debtor), cOK = ok(pd.cred);
    const win = dOK && (!cOK || a[pd.debtor].t < a[pd.cred].t);
    st.ev = []; st.anim = 0; st.evId++;
    ev(st, { t: 'quizres', debtor: pd.debtor, cred: pd.cred, q: pd.q, lv: pd.lv, opts: pd.opts, ans: a, key, win, amt: pd.amt, tile: pd.tile, note: st.quizNote || '' }); st.anim += 7000;
    st.phase = 'roll'; const { debtor, cred, amt, tile } = pd; st.pending = null; st.quizKey = null;
    if (!win) pay(st, debtor, cred, amt, '過路費', tile);
    endTurn(st, now);
  }
  function bankrupt(st, s, by) {
    const p = st.players[s]; p.alive = false;
    BOARD.forEach(t => { if (st.owners[t.i] === s) { st.owners[t.i] = -1; st.levels[t.i] = 0; } });
    ev(st, { t: 'bankrupt', seat: s, by: by >= 0 && st.players[by].alive ? by : -1 });
    st.anim += 12000; // 破產動畫
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
      case 'gm': p.cash += v; ev(st, { t: 'cash', seat: s, amt: v, why: '星門彼端' }); break;
      case 'gagain': st.extra = true; ev(st, { t: 'note', seat: s, text: '⏳ 再擲一次！' }); break;
      case 'gtp': { const to = Math.floor(Math.random() * N); p.pos = to; ev(st, { t: 'tp', seat: s, to, gate: true }); land(st, s, depth + 1); break; }
      case 'gate': st.phase = 'gate'; st.pending = { gate: true }; break;
      case 'm': if (v >= 0) { p.cash += v; ev(st, { t: 'cash', seat: s, amt: v }); } else pay(st, s, -1, -v, '卡片'); break;
      case 'war': { // 人神對決：看抽卡者是人類陣營（人類勇者、自畫角色）還是神的陣營
        const human = p.char && (p.char.kind === 'custom' || p.char.i === 7); st.anim += 5500;
        ev(st, { t: 'note', seat: s, text: v > 0 ? (human ? '人類勝利！' : '眾神勝利！') : (human ? '人類戰敗……' : '眾神戰敗……') });
        if (v > 0) { p.cash += v; ev(st, { t: 'cash', seat: s, amt: v, why: '戰利品' }); } else pay(st, s, -1, -v, '戰敗賠償');
        break;
      }
      case 'link': st.anim += 5000; p.cash += v; p.immune++; ev(st, { t: 'cash', seat: s, amt: v, why: '意識共鳴' }); break;
      case 'evo': st.anim += 6000; p.evolved = true; pay(st, s, -1, Math.floor(p.cash * v / 100), '完美進化'); p.skip += 1; ev(st, { t: 'skipset', seat: s, n: 1 }); break;
      case 'mig': st.anim += 4500; moveTo(st, s, v); land(st, s, depth + 1); break; // 動物大遷徙
      case 'cat': st.anim += 3500; p.skip += v; ev(st, { t: 'skipset', seat: s, n: v }); break; // 迷因貓
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

  // ===== 道具：四個主題規則一樣，只有名稱和圖示不同 =====
  // trap 陷害（對方停一回合）、steal 偷錢（10%，最多 5,000）、invest 投資（付 3,000，3 回合後拿回 6,000）、bomb 轟炸（別人的房子降一級）、shield 防護罩（被動擋一次）
  const ITEM_KEYS = ['trap', 'steal', 'invest', 'bomb', 'shield'], ITEM_MAX = 3;
  const ITEMS = {
    ragnarok: { tile: '眾神寶庫', trap: ['洛基的詭計', '🐍'], steal: ['赫密士之手', '🪽'], invest: ['諾恩織命', '🧵'], bomb: ['雷神之鎚', '🔨'], shield: ['埃癸斯之盾', '🛡️'] },
    cyber: { tile: '地下黑市', trap: ['病毒植入', '🦠'], steal: ['駭入帳戶', '💻'], invest: ['加密貨幣', '📈'], bomb: ['無人機空襲', '🛩️'], shield: ['防火牆', '🧱'] },
    animal: { tile: '松鼠的寶藏', trap: ['香蕉皮', '🍌'], steal: ['浣熊順手牽羊', '🦝'], invest: ['松鼠存糧', '🐿️'], bomb: ['河馬踩踏', '🦛'], shield: ['龜殼護盾', '🐢'] },
    alien: { tile: '遺落艙', trap: ['寄生卵', '🥚'], steal: ['觸手竊取', '🦑'], invest: ['孢子培養', '🍄'], bomb: ['孢子腐蝕', '☣️'], shield: ['幾丁質護甲', '🪲'] }
  };
  const ITEM_DESC = { trap: '選一位玩家，讓他下回合停一輪', steal: '從一位玩家身上拿走他現金的 10%（最多 5,000）', invest: '現在付 3,000，3 回合後拿回 6,000（期間破產就拿不回來）', bomb: '選別人一塊有建築的地，建築降一級', shield: '拿在手上就生效：自動擋下下一次別人對你用的道具' };
  root.MONO_ITEMS = { KEYS: ITEM_KEYS, MAX: ITEM_MAX, NAMES: ITEMS, DESC: ITEM_DESC };
  // 價格：依道具強度分級 × 自己第幾次購買（越買越貴），每 25 回合歸零；錢最少的人 5 折；後期跟著通膨（最多 3 倍）
  const ITEM_BASE = { invest: 1000, shield: 1500, trap: 2000, bomb: 2500, steal: 3000 }, ITEM_MULT = [1, 2, 3.5, 5], ITEM_RESET = 25;
  root.MONO_ITEMS.BASE = ITEM_BASE; root.MONO_ITEMS.MULT = ITEM_MULT; root.MONO_ITEMS.RESET = ITEM_RESET;
  function itemBought(st, s) { const p = st.players[s], era = Math.floor((st.round - 1) / ITEM_RESET); if (p.buyEra !== era) { p.buyEra = era; p.bought = 0; } return p.bought || 0; }
  function itemPrice(st, s, k) { const n = itemBought(st, s); return Math.round(ITEM_BASE[k] * ITEM_MULT[Math.min(n, ITEM_MULT.length - 1)] * Math.min(3, inflation(st)) * (isLast(st, s) ? 0.5 : 1) / 100) * 100; }
  function openShop(st, s, free) {
    const p = st.players[s]; p.items = p.items || [];
    if (p.items.length >= ITEM_MAX) { ev(st, { t: 'note', seat: s, text: `道具已滿（最多 ${ITEM_MAX} 張）` }); return false; }
    const offers = ITEM_KEYS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    st.phase = 'shop'; st.pending = { offers, free, prices: offers.map(k => free ? 0 : itemPrice(st, s, k)), nth: itemBought(st, s) + 1 };
    return true;
  }
  // 停在某格之後要做的事；若需要玩家決定，設定 phase 並回傳 true
  function land(st, s, depth) {
    const p = st.players[s]; if (!p.alive || depth > 3) return false;
    const t = BOARD[p.pos];
    if (t.type === 'prop') {
      const o = st.owners[t.i];
      if (o === -1) { if (p.cash >= t.price) { st.phase = 'buy'; st.pending = { tile: t.i }; return true; } ev(st, { t: 'note', seat: s, text: '錢不夠買這塊地' }); return false; }
      if (o === s) { if (st.levels[t.i] < 4 && p.cash >= t.up) { st.phase = 'upgrade'; st.pending = { tile: t.i }; return true; } return false; }
      if (!st.players[o].alive) return false;
      const rent = rentOf(st, t.i);
      // 翻盤問答：付不起（賣光也不夠）就跟收錢者搶答，答贏免付、不出局
      if (!canPay(st, s, rent)) { startQuiz(st, s, o, rent, t.i); return true; }
      pay(st, s, o, rent, '過路費', t.i);
      // 翻盤機制：付完過路費後，可以用 1.4 倍價格強制收購（地標 Lv4 不能收購）
      if (p.alive && st.levels[t.i] < 4 && !(st.boLock[t.i] > st.round) && p.cash >= buyoutOf(st, t.i)) { st.phase = 'buyout'; st.pending = { tile: t.i, from: o, cost: buyoutOf(st, t.i) }; return true; }
      return false;
    }
    if (t.type === 'luck' || t.type === 'bad') { applyCard(st, s, t.type, drawCard(st, t.type), depth); return st.phase !== 'roll'; }
    if (t.type === 'item' || t.type === 'free') return openShop(st, s, t.type === 'free');
    if (t.type === 'tax') { const d = taxDetail(st, s); ev(st, { t: 'note', seat: s, text: `財產稅 ${d.wealth.toLocaleString()}＋房屋稅 ${d.house.toLocaleString()}${d.total > d.wealth + d.house ? '（最少 1,000）' : ''}` }); pay(st, s, -1, d.total, '稅金'); return false; }
    if (t.type === 'gotojail') { sendJail(st, s); return false; }
    if (t.type === 'teleport') { const to = BOARD.filter(b => b.type === 'prop')[Math.floor(Math.random() * 16)].i; jump(st, s, to, false); return land(st, s, depth + 1); }
    return false;
  }
  function endTurn(st, now) {
    st.phase = 'roll'; st.pending = null;
    if (st.extra) { st.extra = false; if (st.players[st.turn].alive && alive(st).length > 1) { setDeadline(st, now, 15000); return; } }
    const al = alive(st);
    if (al.length <= 1) return finish(st);
    if (st.maxRounds === 0 && al.length < st.n) return finish(st); // 有人破產就結束
    let s = st.turn;
    for (let guard = 0; guard < st.n * 4; guard++) {
      s = (s + 1) % st.n;
      if (s === st.first) { st.round++; if (st.round > (st.maxRounds || ROUND_CAP)) return finish(st); }
      const p = st.players[s]; if (!p.alive) continue;
      if (p.skip > 0) { p.skip--; ev(st, { t: 'skip', seat: s }); continue; }
      break;
    }
    st.turn = s;
    const np = st.players[s]; np.usedItem = false;
    if (np.invest && np.invest.length) { const due = np.invest.filter(r => r <= st.round); if (due.length) { np.invest = np.invest.filter(r => r > st.round); np.cash += 6000 * due.length; ev(st, { t: 'cash', seat: s, amt: 6000 * due.length, why: '投資回收' }); } }
    setDeadline(st, now, 15000);
  }
  function finish(st) {
    st.phase = 'over'; st.deadline = 0;
    const ranks = U.range(st.n).map(s => { const a = assets(st, s); return { s, w: st.players[s].alive ? a.total : -1, cash: a.cash, land: a.land, bld: a.bld }; }).sort((a, b) => b.w - a.w);
    st.winner = ranks[0].s; st.ranks = ranks;
  }
  function setDeadline(st, now, ms) {
    st.deadline = now + st.anim + ms;
    if (st.phase === 'quiz' && st.pending && !st.pending.start) { st.pending.start = now + st.anim; st.deadline = st.pending.start + QUIZ_MS; }
  }

  const R = {
    BOARD, N, LAYOUT, GROUP_COLOR, ITEMS: root.MONO_ITEMS, RENT_MUL, START_BONUS, BOOST, JAIL, ROUND_CAP, tileName, rentOf, inflation, worth, assets, taxOf, taxDetail, buyoutOf,
    init(n, o, now) {
      const theme = TH()[o.theme] ? o.theme : 'ragnarok';
      const cash = +o.cash || 50000;
      const st = {
        n, theme, maxRounds: o.rounds == null || o.rounds === '' ? 20 : +o.rounds, inflate: +o.rounds === 0 || +o.rounds >= 900, round: 1, first: 0, turn: 0, phase: 'pick',
        players: U.range(n).map(() => ({ cash, pos: 0, alive: true, skip: 0, immune: 0, jailfree: 0, char: null })),
        owners: Array(N).fill(-1), levels: Array(N).fill(0), boLock: Array(N).fill(0), decks: {}, ev: [], evId: 0, anim: 0, pending: null, dice: null
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
      if (a.type === 'answer') { // 搶答：只有破產者和收錢者可以作答，各答一次
        const pd = st.pending; if (st.phase !== 'quiz' || !pd) return 'silent';
        if (s !== pd.debtor && s !== pd.cred) return '只有對決的兩個人可以作答';
        if (pd.ans[s]) return 'silent'; if (now < pd.start - 300) return '題目還沒出現';
        const c = a.c | 0; if (c < 0 || c > 3) return 'silent';
        pd.ans[s] = { c, t: Math.max(0, now - pd.start) };
        if (pd.ans[pd.debtor] && pd.ans[pd.cred]) endQuiz(st, now);
        return;
      }
      if (a.type === 'quizend') { if (st.phase === 'quiz' && now >= st.deadline) endQuiz(st, now); return; }
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
      if (a.type === 'shop') {
        if (st.phase !== 'shop' || !st.pending) return 'silent';
        const pd = st.pending, j = pd.offers.indexOf(a.k);
        if (a.k != null && j >= 0) {
          const price = pd.prices[j]; if (p.cash < price) return '錢不夠';
          p.cash -= price; (p.items = p.items || []).push(a.k); if (!pd.free) { itemBought(st, s); p.bought = (p.bought || 0) + 1; }
          st.anim += 1600; ev(st, { t: 'getitem', seat: s, k: a.k, amt: price });
        }
        endTurn(st, now); return;
      }
      if (a.type === 'item') {
        if (st.phase !== 'roll') return '擲骰子前才能用道具';
        if (p.usedItem) return '每回合只能用一張道具';
        const items = p.items || []; const i = a.i | 0, k = items[i]; if (!k) return '沒有這張道具';
        if (k === 'shield') return '防護罩不用主動使用，被攻擊時會自動擋下';
        let tgt = -1;
        if (k === 'trap' || k === 'steal') { tgt = a.target | 0; if (tgt === s || !st.players[tgt] || !st.players[tgt].alive) return '請選一位還在場上的對手'; }
        if (k === 'bomb') { const tl = a.tile | 0; if (!BOARD[tl] || BOARD[tl].type !== 'prop' || st.owners[tl] < 0 || st.owners[tl] === s || !st.players[st.owners[tl]].alive || st.levels[tl] < 1) return '請選別人有建築的地'; tgt = st.owners[tl]; }
        if (k === 'invest' && p.cash < 3000) return '錢不夠投資（要 3,000）';
        items.splice(i, 1); p.usedItem = true;
        const tp = tgt >= 0 ? st.players[tgt] : null, si = tp && tp.items ? tp.items.indexOf('shield') : -1;
        if (si >= 0) { tp.items.splice(si, 1); st.anim += 2600; ev(st, { t: 'item', seat: s, k, target: tgt, tile: a.tile, blocked: true }); setDeadline(st, now, 15000); return; }
        st.anim += 2600;
        if (k === 'trap') { tp.skip += 1; ev(st, { t: 'item', seat: s, k, target: tgt }); }
        else if (k === 'steal') { const amt = Math.min(5000, Math.floor(tp.cash * 0.1 / 100) * 100); tp.cash -= amt; p.cash += amt; ev(st, { t: 'item', seat: s, k, target: tgt, amt }); }
        else if (k === 'invest') { p.cash -= 3000; (p.invest = p.invest || []).push(st.round + 3); ev(st, { t: 'item', seat: s, k, amt: 3000, due: st.round + 3 }); }
        else if (k === 'bomb') { const tl = a.tile | 0; st.levels[tl]--; ev(st, { t: 'item', seat: s, k, target: tgt, tile: tl, level: st.levels[tl] }); }
        setDeadline(st, now, 15000); return;
      }
      if (a.type === 'gate') {
        if (st.phase !== 'gate') return 'silent';
        const to = a.to | 0; if (to < 0 || to >= N) return '沒有這一格';
        p.pos = to; ev(st, { t: 'tp', seat: s, to, gate: true }); st.phase = 'roll'; st.pending = null;
        if (!land(st, s, 1)) endTurn(st, now); else setDeadline(st, now, 15000);
        return;
      }
      if (a.type === 'buyout') {
        if (st.phase !== 'buyout') return 'silent';
        const { tile, from, cost } = st.pending;
        if (a.yes) {
          if (p.cash < cost || st.owners[tile] !== from || st.levels[tile] >= 4) return '不能收購';
          p.cash -= cost; st.players[from].cash += cost; st.owners[tile] = s; st.boLock[tile] = st.round + 3; // 收購後保護 3 回合
          ev(st, { t: 'buyout', seat: s, from, tile, amt: cost });
        }
        endTurn(st, now); return;
      }
      return 'silent';
    },
    // 輪到的人沒反應（逾時或斷線）時的預設動作
    autoAct(st) {
      if (st.phase === 'pick') return { seat: -1, a: { type: 'start' } };
      if (st.phase === 'roll') return { seat: st.turn, a: { type: 'roll' } };
      if (st.phase === 'gate') { // 代打：去能升級的自己的地 → 買得起的空地 → 休息站
        const p = st.players[st.turn];
        const up = BOARD.filter(t => t.type === 'prop' && st.owners[t.i] === st.turn && st.levels[t.i] < 4 && p.cash >= t.up).sort((a, b) => b.price - a.price)[0];
        const buy = BOARD.filter(t => t.type === 'prop' && st.owners[t.i] === -1 && p.cash >= t.price).sort((a, b) => b.price - a.price)[0];
        return { seat: st.turn, a: { type: 'gate', to: (up || buy || BOARD[14]).i } };
      }
      if (st.phase === 'quiz') return { seat: -1, a: { type: 'quizend' } };
      if (st.phase === 'shop') { // 代打：免費就拿第一張；要錢的話，買完還剩 2 萬以上才買最便宜的
        const pd = st.pending, cash = st.players[st.turn].cash;
        if (pd.free) return { seat: st.turn, a: { type: 'shop', k: pd.offers[0] } };
        let best = -1; pd.prices.forEach((c, j) => { if (cash - c >= 20000 && (best < 0 || c < pd.prices[best])) best = j; });
        return { seat: st.turn, a: { type: 'shop', k: best >= 0 ? pd.offers[best] : null } };
      }
      if (st.phase === 'buyout') return { seat: st.turn, a: { type: 'buyout', yes: st.players[st.turn].cash - st.pending.cost >= 25000 } };
      if (st.phase === 'buy' || st.phase === 'upgrade') {
        const t = BOARD[st.pending.tile]; const cost = st.phase === 'buy' ? t.price : t.up;
        return { seat: st.turn, a: { type: st.phase, yes: st.players[st.turn].cash - cost >= 8000 } };
      }
      return null;
    }
  };
  root.MONO_RULES = R;
})(typeof window !== 'undefined' ? window : globalThis);
