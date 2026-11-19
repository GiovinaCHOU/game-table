// 大富翁規則（房主判定）
(function (root) {
  const U = root.GUTIL;
  const TH = () => root.MONO_THEMES;

  // 28 格：0 起點、7 監獄、14 休息、21 進監獄；P=地產(群組)，L=幸運，B=厄運，X=稅，T=傳送，I=道具
  const LAYOUT = ['S', 'P0', 'L', 'P0', 'X', 'P1', 'B', 'J', 'P1', 'P2', 'I', 'P2', 'P3', 'B', 'F', 'P3', 'P4', 'L', 'P4', 'X', 'P5', 'G', 'P5', 'I', 'P6', 'P6', 'P7', 'P7'];
  const GROUP_PRICE = [3000, 4000, 5000, 6000, 8000, 9000, 11000, 13000];
  const GROUP_COLOR = ['#8d6e63', '#4fc3f7', '#ec407a', '#ffa726', '#ef5350', '#ffee58', '#66bb6a', '#5c6bc0'];
  const RENT_MUL = [0.035, 0.11, 0.21, 0.38, 0.62]; // 搭配「經過起點可加蓋」整體下修，等級差距拉開、通膨會讓它越來越貴
  const BUYOUT_MUL = 1.4, ROUND_CAP = 40, SAFETY_CAP = 300; // ROUND_CAP 只給「打到剩一人」以外的舊設定用；破產模式不強制結算
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
  // 棋盤：BOARD 是同一個陣列，換地圖時「原地」重建，所以所有用到 BOARD 的地方都不用改
  // 每局的排列存在 st.layout（28 格代碼）；舊存檔沒有 layout 就用預設排列
  const BOARD = []; let curLayout = '';
  function useLayout(L) {
    const lay = Array.isArray(L) && L.length === LAYOUT.length ? L : LAYOUT, key = lay.join(',');
    if (key === curLayout) return; curLayout = key; BOARD.length = 0; const cnt = Array(8).fill(0);
    lay.forEach((c, i) => {
      if (c[0] === 'P') { const g = +c[1]; BOARD.push({ i, type: 'prop', g, pi: g * 2 + cnt[g]++, price: GROUP_PRICE[g], up: Math.round(GROUP_PRICE[g] * 0.6), color: GROUP_COLOR[g] }); } // 地名跟著色組走
      else BOARD.push({ i, type: { S: 'start', L: 'luck', B: 'bad', X: 'tax', J: 'jail', F: 'free', G: 'gotojail', T: 'teleport', I: 'item' }[c] });
    });
  }
  useLayout(LAYOUT);
  const N = LAYOUT.length;
  // 隨機地圖：四個角落（起點 0、監獄 7、免費停車 14、進監獄 21）不動；每邊 6 格＝2 組同色地（各 2 格相連）＋2 張不同的功能格
  function randomLayout() {
    const groups = U.shuffle(U.range(8)); let singles;
    for (let k = 0; k < 200; k++) { singles = U.shuffle(['L', 'L', 'B', 'B', 'X', 'X', 'I', 'I']); let ok = true; for (let sd = 0; sd < 4; sd++) if (singles[sd * 2] === singles[sd * 2 + 1]) ok = false; if (ok) break; }
    const out = ['S']; ['J', 'F', 'G', null].forEach((corner, sd) => {
      const units = U.shuffle([['P' + groups[sd * 2], 'P' + groups[sd * 2]], ['P' + groups[sd * 2 + 1], 'P' + groups[sd * 2 + 1]], [singles[sd * 2]], [singles[sd * 2 + 1]]]);
      units.forEach(u => out.push(...u)); if (corner) out.push(corner);
    });
    return out;
  }
  function checkLayout(L) { // 給測試用：確認排列合法
    if (!Array.isArray(L) || L.length !== 28 || L[0] !== 'S' || L[7] !== 'J' || L[14] !== 'F' || L[21] !== 'G') return false;
    const c = {}; L.forEach(x => c[x] = (c[x] || 0) + 1); if (['L', 'B', 'X', 'I'].some(k => c[k] !== 2)) return false;
    for (let g = 0; g < 8; g++) { const at = L.map((x, i) => x === 'P' + g ? i : -1).filter(i => i >= 0); if (at.length !== 2 || at[1] - at[0] !== 1) return false; }
    return true;
  }

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
  // 通膨：第 6 回合起每回合 +10%，最多 3 倍；「末日通膨」依人數提前（3人21／4人25／5人27回合），之後每回合再 +60%
  // 目標：第一次破產大約落在 30–35 回合，第 15 回合領先者最後翻盤率 55% 以上（tests 模擬 300 局）
  const DOOM_BY_N = { 2: 18, 3: 21, 4: 25, 5: 27, 6: 29 };
  const doomRound = (st) => globalThis.__DOOM || DOOM_BY_N[st.n] || 25;
  const INF = (globalThis.__INF || { start: 6, rate: 0.1, max: 3 });
  // 襲擊（全主題）：第 31 回合起每 3 回合（31、34、37…）擲一次，一半機率出現，打「有錢人」其中一位
  // 挑人：存活人數×40%（四捨五入、至少 1；5 人＝前 2 名）裡，總資產高於全員平均的人；機率照「超出平均多少」加權（剛好在平均附近幾乎不會被選）
  // 損失：現金 20～30%；現金低於 10,000 改成隨機一塊有建築的地降一級（沒有建築就照樣扣現金）；不會因此破產；厄運免疫可擋
  const RAID = { round: 31, every: 3, p: 0.5, top: 0.4, min: 0.2, max: 0.3, floor: 10000, warn: 3 };
  const RAID_INFO = {
    town: { icon: '🐺', who: '魔狗', start: '倒影世界的魔狗開始出沒，會襲擊最有錢的人', why: '魔狗突襲' },
    ragnarok: { icon: '😈', who: '路西法', start: '路西法從地獄降臨，專挑最有錢的人下手', why: '路西法降臨' },
    animal: { icon: '🦍', who: '猩猩', start: '叢林暴君出沒，最有錢的人小心被爆擊', why: '猩猩爆擊' },
    cyber: { icon: '🦾', who: '乞丐幫', start: '乞丐幫開始在夜城出沒，專門圍剿有錢人', why: '乞丐幫圍剿' },
    alien: { icon: '🦠', who: '未知生物', start: '未知星球的生物甦醒了，會吞噬最有錢的人', why: '未知生物吞噬' },
    buddha: { icon: '🪡', who: '扎小人詛咒', start: '有人開始扎小人，詛咒最有錢的人', why: '被詛咒' },
    magic: { icon: '🐍', who: '黑魔王', start: '黑魔王歸來，會襲擊最有錢的人', why: '黑魔王襲擊' },
    gang: { icon: '🚔', who: '正派掃蕩', start: '警方展開正派掃蕩，專抓最有錢的人', why: '正派掃蕩' }
  };
  const raidInfo = (theme) => RAID_INFO[theme] || RAID_INFO.ragnarok;
  const raidAt = (r) => r >= RAID.round && (r - RAID.round) % RAID.every === 0;
  function raidPick(st) {
    const al = st.players.map((p, k) => k).filter(k => st.players[k].alive); if (al.length < 2) return -1;
    const w = {}; al.forEach(k => w[k] = worth(st, k)); const avg = al.reduce((a, k) => a + w[k], 0) / al.length;
    const top = al.slice().sort((a, b) => w[b] - w[a]).slice(0, Math.max(1, Math.round(al.length * RAID.top)));
    const c = top.filter(k => w[k] > avg); if (!c.length) return top[Math.floor(Math.random() * top.length)];
    let r = Math.random() * c.reduce((a, k) => a + (w[k] - avg), 0);
    for (const k of c) { r -= w[k] - avg; if (r < 0) return k; } return c[0];
  }
  function houndRound(st) {
    const I = raidInfo(st.theme);
    if (st.round === RAID.round - RAID.warn) ev(st, { t: 'alert', text: `${I.icon} ${RAID.warn} 回合後（第 ${RAID.round} 回合）${I.who}會出現，之後每 ${RAID.every} 回合有一半機率出現，專打有錢人` });
    if (!raidAt(st.round)) return;
    if (Math.random() >= (globalThis.__RAID_P == null ? RAID.p : globalThis.__RAID_P)) return;
    if (!st.raidSeen) { st.raidSeen = true; ev(st, { t: 'alert', text: `${I.icon} ${I.start}` }); }
    const k = raidPick(st); if (k < 0) return; const p = st.players[k];
    const blds = BOARD.filter(t => t.type === 'prop' && st.owners[t.i] === k && st.levels[t.i] > 0);
    const mode = p.cash < RAID.floor && blds.length ? 'bld' : 'cash', tile = mode === 'bld' ? blds[Math.floor(Math.random() * blds.length)].i : null;
    ev(st, { t: 'hound', seat: k, mode, tile }); st.anim += 6800;
    if (p.immune > 0) { p.immune--; ev(st, { t: 'note', seat: k, text: `🛡️ 厄運免疫擋下了${I.who}` }); return; }
    if (mode === 'bld') { st.levels[tile]--; ev(st, { t: 'down', tile, level: st.levels[tile], seat: k, raid: true }); return; }
    const lo = Math.ceil(p.cash * RAID.min / 100) * 100, hi = Math.max(lo, Math.floor(p.cash * RAID.max / 100) * 100), amt = Math.min(Math.max(0, Math.floor(p.cash / 100) * 100), Math.min(hi, Math.max(lo, Math.round(p.cash * (RAID.min + Math.random() * (RAID.max - RAID.min)) / 100) * 100))); // 20～30%，取整到百
    if (amt > 0) pay(st, k, -1, amt, I.why);
  }
  function inflation(st) { if (!st.inflate) return 1; const r = st.round; const base = Math.min(INF.max, 1 + Math.max(0, r - INF.start) * INF.rate); const D = doomRound(st); return r < D ? base : Math.min(20, INF.max + (r - D + 1) * 0.6); }
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

  // ===== 角色屬性（幫派街區）：主題的 perks[角色].m；自畫角色、沒有 perks 的主題一律空物件 =====
  function perk(st, s) { const p = st.players[s], th = TH()[st.theme]; if (!p || !p.char || p.char.kind !== 'preset' || !th || !th.perks) return {}; const k = th.perks[p.char.i]; return (k && k.m) || {}; }
  const r100 = (x) => Math.round(x / 100) * 100;
  function priceOf(st, s, i) { const m = perk(st, s); return m.buyMul ? r100(BOARD[i].price * m.buyMul) : BOARD[i].price; }
  function upOf(st, s, i) { const m = perk(st, s); return m.buyMul ? r100(BOARD[i].up * m.buyMul) : BOARD[i].up; }
  function ev(st, e) {
    if (e.t === 'skipset' && st.players[e.seat]) { const m = perk(st, e.seat), p = st.players[e.seat];
      if (m.noSkip && e.n > 0) { p.skip = Math.max(0, p.skip - e.n); e.n = 0; st.ev.push(e); st.ev.push({ t: 'note', seat: e.seat, feed: true, text: '🥄 麻掉沒感覺：停回合對我無效' }); st.anim += 800; return; }
      if (m.skipExtra && e.n > 0) { p.skip += m.skipExtra; e.n += m.skipExtra; } }
    st.ev.push(e); st.anim += ({ move: 0.3 * ((e.path && e.path.length) || 1), card: 2.6, dice: 1.0, tp: 1.0, jail: 1.2 }[e.t] || 0.4) * 1000; }

  function moveTo(st, s, steps) {
    const p = st.players[s]; let path = []; let pos = p.pos;
    const dir = steps >= 0 ? 1 : -1;
    for (let k = 0; k < Math.abs(steps); k++) {
      pos = (pos + dir + N) % N; path.push(pos);
      if (dir > 0 && pos === 0) {
        // 先把走到起點這段播完，領錢的特效才會在角色踩到起點時出現
        p.pos = pos; ev(st, { t: 'move', seat: s, path }); path = [];
        const m = perk(st, s), sb = m.startFixed || (m.startMul ? r100(START_BONUS * m.startMul) : START_BONUS);
        p.cash += sb; ev(st, { t: 'cash', seat: s, amt: sb, why: '經過起點' }); p.buildTicket = 1;
        if (!m.noBoost && isLast(st, s)) { p.cash += BOOST; ev(st, { t: 'cash', seat: s, amt: BOOST, why: '落後補助', boost: true }); }
        if (m.startTrance && !p.trance) { p.trance = true; ev(st, { t: 'note', seat: s, feed: true, text: '🍄 看見未來：下一次擲骰自己選點數' }); }
      }
    }
    p.pos = pos; if (path.length || !steps) ev(st, { t: 'move', seat: s, path });
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
    if (st.__cardLoss && st.__cardLoss.s === from) st.__cardLoss.amt += amt;
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
    // 難度比例：簡單 55%、中等 35%、困難 10%；另外 30% 機率改出主題相關的電影／動畫題
    const Q = root.MONO_QUIZ || {}, tb = Q[st.theme] || {}, mv = Q.movie || {};
    const all = []; ['e', 'm', 'h'].forEach(lv => (tb[lv] || []).forEach((q, i) => all.push({ id: lv + i, lv, q, src: 't' })));
    // 主題相關的電影／動畫／影集題（難度算中等以下），約 30% 機率出
    (tb.f || []).forEach((q, i) => all.push({ id: 'f' + i, lv: 'f', q, src: 'mv' })); void mv;
    if (!all.length) { pay(st, s, o, amt, '過路費', tile); return; }
    st.qused = st.qused || []; let left = all.filter(x => !st.qused.includes(x.id)); if (!left.length) { st.qused = []; left = all; }
    const wantMv = Math.random() < 0.3 && left.some(x => x.src === 'mv'); left = left.filter(x => (x.src === 'mv') === wantMv) .length ? left.filter(x => (x.src === 'mv') === wantMv) : left;
    const r = Math.random(), want = r < 0.55 ? 'e' : r < 0.9 ? 'm' : 'h';
    const lvs = [...new Set(left.map(x => x.lv))], lv = wantMv ? 'f' : lvs.includes(want) ? want : lvs.includes('e') ? 'e' : lvs[0], pool = left.filter(x => x.lv === lv);
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
    st.ev = []; st.anim = 0; st.evId++; st.animAt = now;
    ev(st, { t: 'quizres', debtor: pd.debtor, cred: pd.cred, q: pd.q, lv: pd.lv, opts: pd.opts, ans: a, key, win, amt: pd.amt, tile: pd.tile, note: st.quizNote || '' }); st.anim += 7000;
    st.phase = 'roll'; const { debtor, cred, amt, tile } = pd; st.pending = null; st.quizKey = null;
    if (!win) pay(st, debtor, cred, amt, '過路費', tile);
    endTurn(st, now);
  }
  function bankrupt(st, s, by) {
    const p = st.players[s], m = perk(st, s);
    // 海洛因蒂：第一次要破產時被 Narcan 救回來（地產已經賣光，債務一筆勾銷，現金補到 revive）
    if (m.revive && !p.revived) { p.revived = true; p.cash = m.revive; ev(st, { t: 'revive', seat: s, amt: m.revive }); ev(st, { t: 'note', seat: s, feed: true, text: `💉 被 Narcan 救回來了！債務一筆勾銷，現金回到 ${m.revive.toLocaleString()}` }); st.anim += 2500; return; }
    p.alive = false;
    BOARD.forEach(t => { if (st.owners[t.i] === s) { st.owners[t.i] = -1; st.levels[t.i] = 0; } });
    ev(st, { t: 'bankrupt', seat: s, by: by >= 0 && st.players[by].alive ? by : -1 });
    st.anim += 12000; // 破產動畫
  }
  function sendJail(st, s) {
    const p = st.players[s];
    if (perk(st, s).noJail) { ev(st, { t: 'note', seat: s, feed: true, text: '🥄 麻掉沒感覺：被抓也照樣走' }); return; }
    if (p.jailfree > 0) { p.jailfree--; ev(st, { t: 'jailfree', seat: s }); return; }
    if (p.jailChoice > 0 && !p.jailAsk) { p.jailAsk = true; return; } // 古柯檢查官：先問要不要用免進監獄（回合結束前會停下來問）
    goJail(st, s);
  }
  function goJail(st, s) {
    const p = st.players[s], m = perk(st, s);
    p.pos = JAIL; p.skip = Math.max(p.skip, 1 + (m.jailExtra || 0)); ev(st, { t: 'jail', seat: s });
    if (m.jailExtra) ev(st, { t: 'note', seat: s, feed: true, text: `🧢 前科累累：多關 ${m.jailExtra} 回合` });
  }
  function mine(st, s) { return BOARD.filter(t => t.type === 'prop' && st.owners[t.i] === s); }

  const EGG_MONEY = ['gm', 'link', 'war', 'sync', 'bag', 'goblin', 'xlights', 'd20', 'toilet', 'ring', 'shroom'];
  const MONEY_KEYS = ['m', 'each', 'give', 'house', 'gm', 'link', 'war', 'sync', 'bag', 'goblin', 'phoenix', 'xlights', 'd20', 'toilet', 'ring', 'shroom'];
  const PLAIN_CARD = ['m', 'up', 'mv', 'go', 'jailfree', 'each', 'immune', 'teleport', 'jail', 'skip', 'house', 'down', 'give', 'pct', 'gonb', 'again'];
  function drawCard(st, deck) {
    const th = TH()[st.theme]; const list = th[deck === 'luck' ? 'lucky' : 'bad'];
    if (!st.decks[deck] || !st.decks[deck].length) st.decks[deck] = U.shuffle(U.range(list.length));
    // 彩蛋卡另外加權：每抽一張有 min(30%, 彩蛋張數×12%) 機率直接抽彩蛋（同一疊不會連續兩次同一張彩蛋）
    const eggs = U.range(list.length).filter(i => !PLAIN_CARD.includes(list[i][1].split(':')[0]));
    const last = (st.lastEgg || {})[deck];
    const pool = eggs.length > 1 ? eggs.filter(i => i !== last) : eggs;
    if (pool.length && Math.random() < Math.min(0.3, eggs.length * 0.12)) { const idx = pool[Math.floor(Math.random() * pool.length)]; (st.lastEgg = st.lastEgg || {})[deck] = idx; return { idx, text: list[idx][0], eff: list[idx][1] }; }
    let idx = st.decks[deck].pop(); while (eggs.includes(idx) && st.decks[deck].length) idx = st.decks[deck].pop(); // 一般牌堆裡的彩蛋略過，彩蛋只從上面的機率出
    if (eggs.includes(idx)) { st.decks[deck] = U.shuffle(U.range(list.length).filter(i => !eggs.includes(i))); idx = st.decks[deck].pop(); }
    return { idx, text: list[idx][0], eff: list[idx][1] };
  }
  // 郵差先生（幸運 ×1.3、厄運 ×1.5）、美麗妄娜（厄運 ×0.6）：用這張卡實際拿到／付出的錢來加減
  function cardWithPerk(st, s, deck, card, depth) {
    const m = perk(st, s), mul = deck === 'luck' ? m.luckMul : m.badMul;
    if (!mul || mul === 1) return applyCard(st, s, deck, card, depth);
    const p = st.players[s], c0 = p.cash, prev = st.__cardLoss, acc = { s, amt: 0 }; st.__cardLoss = acc;
    try { applyCard(st, s, deck, card, depth); } finally { st.__cardLoss = prev || null; } const loss = acc.amt;
    if (!p.alive) return;
    if (deck === 'luck') { const gain = p.cash - c0, add = gain > 0 ? r100(gain * (mul - 1)) : 0; if (add > 0) { p.cash += add; ev(st, { t: 'cash', seat: s, amt: add, why: '📮 好事放大' }); } }
    else if (loss > 0) { const d = r100(loss * Math.abs(mul - 1)); if (d <= 0) return; if (mul < 1) { p.cash += d; ev(st, { t: 'cash', seat: s, amt: d, why: '🌿 很 chill，少損失' }); } else pay(st, s, -1, d, '📮 壞事放大'); }
  }
  function applyCard(st, s, deck, card, depth) {
    const p = st.players[s];
    const [k, v0] = card.eff.split(':');
    // 彩蛋卡的金額跟著通膨放大（最多 3 倍），一般卡不變
    const mul = EGG_MONEY.includes(k) ? Math.min(3, inflation(st)) : 1, v = MONEY_KEYS.includes(k) ? Math.round(+v0 * mul / 100) * 100 : +v0; // 只有金額取整到百；百分比、格數、回合數用原值
    const ce = { t: 'card', seat: s, deck, text: card.text, eff: card.eff, mul }; ev(st, ce);
    if (deck === 'bad' && p.immune > 0) { p.immune--; ev(st, { t: 'immune', seat: s }); return; }
    switch (k) {
      // ===== 神佛之境 =====
      case 'sync': st.anim += 6500; p.cash += v; p.freeRent = (p.freeRent || 0) + 1; ev(st, { t: 'cash', seat: s, amt: v, why: '與神同頻' }); break;
      case 'trance': st.anim += 5000; p.trance = true; ev(st, { t: 'note', seat: s, text: '🔥 神明附身！下次擲骰自己選點數' }); break;
      case 'ghost': st.anim += 5500; pay(st, s, -1, Math.floor(p.cash * v / 100), '鬼門開'); break;
      case 'birds': st.anim += 6800; p.curse = (p.curse || 0) + v; ev(st, { t: 'note', seat: s, text: `👁️ 被多眼鳥盯上：接下來 ${v} 次過路費加倍` }); break;
      // ===== 魔法學院 =====
      case 'bag': st.anim += 5000; p.cash += v; ev(st, { t: 'cash', seat: s, amt: v, why: '無底魔法包' }); break;
      case 'goblin': st.anim += 1500; p.cash += v; ev(st, { t: 'cash', seat: s, amt: v, why: '金庫妖精' }); break;
      case 'phoenix': { st.anim += 6800; const full = st.startCash || 50000; const add = p.cash < full ? full - p.cash : Math.round(v * Math.min(3, inflation(st)) / 100) * 100; p.cash += add; ev(st, { t: 'cash', seat: s, amt: add, why: '鳳凰重生' }); break; }
      case 'mandrake': st.anim += 4500; p.skip += 1; ev(st, { t: 'skipset', seat: s, n: 1 }); pay(st, s, -1, Math.floor(p.cash * v / 100), '曼德拉草'); break;
      // ===== 怪奇小鎮 =====
      case 'xlights': st.anim += 5800; p.cash += v; ev(st, { t: 'cash', seat: s, amt: v, why: '聖誕燈拼字' }); break;
      case 'psy': { st.anim += 5200; let got = 0; st.players.forEach((o, k) => { if (k === s || !o.alive || o.immune > 0) return; const a = Math.floor(Math.max(0, o.cash) * v / 100 / 100) * 100; if (a > 0) got += pay(st, k, s, a, '念力爆發') || 0; }); ev(st, { t: 'note', seat: s, text: `🧠 念力爆發：從其他人身上吸走 ${v}% 現金` }); break; }
      case 'flip': st.anim += 6200; p.skip += 1; ev(st, { t: 'skipset', seat: s, n: 1 }); pay(st, s, -1, Math.floor(p.cash * v / 100), '倒影入侵'); break;
      case 'clock': st.anim += 6500; pay(st, s, -1, Math.floor(p.cash * v / 100), '老爺鐘詛咒'); if (p.alive) sendJail(st, s); break;
      case 'd20': { st.anim += 5200; const r = 1 + Math.floor(Math.random() * 20); ce.roll = r;
        if (r === 20) { const a = v * 2; p.cash += a; ev(st, { t: 'cash', seat: s, amt: a, why: '命運之骰 20 點大成功' }); }
        else if (r === 1) pay(st, s, -1, Math.floor(p.cash * 0.2), '命運之骰 1 點大失敗');
        else if (r >= 11) { const a = Math.round(v * r / 20 / 100) * 100; p.cash += a; ev(st, { t: 'cash', seat: s, amt: a, why: `命運之骰 ${r} 點` }); }
        else pay(st, s, -1, Math.round(v * (11 - r) / 40 / 100) * 100, `命運之骰 ${r} 點`);
        break; }
      // ===== 幫派街區 =====
      case 'toilet': st.anim += 7000; p.cash += v; ev(st, { t: 'cash', seat: s, amt: v, why: '馬桶潛水' }); break;
      case 'ring': st.anim += 6000; p.cash += v; p.jailfree++; ev(st, { t: 'cash', seat: s, amt: v, why: '老大的賞識' }); break;
      case 'shroom': st.anim += 6500; p.cash += v; p.trance = true; ev(st, { t: 'cash', seat: s, amt: v, why: '蘑菇森林' }); ev(st, { t: 'note', seat: s, feed: true, text: '🍄 看見未來：下一次擲骰自己選點數' }); break;
      case 'horse': { st.anim += 6500; const c = mine(st, s).filter(t => st.levels[t.i] > 0).sort((a, b) => (b.price + st.levels[b.i] * b.up) - (a.price + st.levels[a.i] * a.up))[0];
        if (c) { st.levels[c.i]--; ev(st, { t: 'down', tile: c.i, level: st.levels[c.i], seat: s }); } else pay(st, s, -1, Math.floor(p.cash * v / 100 / 100) * 100, '老大的警告'); break; }
      case 'pizza': st.anim += 5500; pay(st, s, -1, Math.floor(p.cash * v / 100 / 100) * 100, '披薩上屋頂'); break;
      case 'friend': st.anim += 6500; pay(st, s, -1, Math.floor(p.cash * v / 100 / 100) * 100, '被轟出豪宅'); if (p.alive) { p.skip += 1; ev(st, { t: 'skipset', seat: s, n: 1 }); } break;
      case 'frog': st.anim += 4500; p.skip += v; p.frog = true; p.frogT = 3; ev(st, { t: 'skipset', seat: s, n: v }); ev(st, { t: 'frog', seat: s }); break;
      case 'gm': p.cash += v; ev(st, { t: 'cash', seat: s, amt: v, why: '星門彼端' }); break;
      case 'again': st.extra = true; ev(st, { t: 'note', seat: s, text: '⏳ 再擲一次！' }); break;
      case 'gagain': st.extra = true; ev(st, { t: 'note', seat: s, text: '⏳ 再擲一次！' }); break;
      case 'gtp': { const to = Math.floor(Math.random() * N); p.pos = to; ev(st, { t: 'tp', seat: s, to, gate: true }); land(st, s, depth + 1); break; }
      case 'gate': st.phase = 'gate'; st.pending = { gate: true }; break;
      case 'm': if (v >= 0) { p.cash += v; ev(st, { t: 'cash', seat: s, amt: v }); } else pay(st, s, -1, -v, '卡片'); break;
      case 'war': { // 人神對決：看抽卡者是人類陣營（人類勇者、自畫角色）還是神的陣營
        const human = p.char && (p.char.kind === 'custom' || p.char.i === 7); st.anim += 5500;
        ev(st, { t: 'note', seat: s, text: v > 0 ? (human ? '人類勝利！' : '眾神勝利！') : (human ? '人類戰敗……' : '眾神戰敗……') });
        if (v > 0) { p.cash += v; ev(st, { t: 'cash', seat: s, amt: v, why: '戰利品' }); } else pay(st, s, -1, Math.min(-v, Math.floor(p.cash * 0.35)), '戰敗賠償'); // 輸的時候最多賠現金的 35%，避免一張卡直接破產
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
    buddha: { tile: '法器鋪', trap: ['下符咒', '📜'], steal: ['五鬼搬運', '👻'], invest: ['點光明燈', '🏮'], bomb: ['雷公電母', '⚡'], shield: ['平安符', '🧧'] },
    town: { tile: '漫畫桌遊店', trap: ['捕獸夾', '🪤'], steal: ['隱形窺視', '👀'], invest: ['街機高分榜', '🕹️'], bomb: ['自製煙火', '🎆'], shield: ['鹽圈', '🧂'] },
    magic: { tile: '魔法雜貨舖', trap: ['沉睡咒', '💤'], steal: ['隱形斗篷', '🧥'], invest: ['鍊金術', '⚗️'], bomb: ['火龍吐息', '🔥'], shield: ['守護結界', '🔰'] },
    gang: { tile: 'Trap House', trap: ['臥底線民', '🪤'], steal: ['扒手', '👛'], invest: ['洗錢', '🧼'], bomb: ['砸店', '🧱'], shield: ['律師', '⚖️'] },
    alien: { tile: '遺落艙', trap: ['寄生卵', '🥚'], steal: ['觸手竊取', '🦑'], invest: ['孢子培養', '🍄'], bomb: ['孢子腐蝕', '☣️'], shield: ['幾丁質護甲', '🪲'] }
  };
  const ITEM_DESC = { trap: '讓一位玩家下回合停一輪', steal: '偷對方現金 15%（偷比你有錢的最多 3 萬，比你窮的最多 3 千）', invest: '3 回合後拿回 6,000（後期會變多）', bomb: '炸掉別人一塊地的一層房子', shield: '放著就生效：擋下別人對你用的下一個道具' };
  root.MONO_ITEMS = { KEYS: ITEM_KEYS, MAX: ITEM_MAX, NAMES: ITEMS, DESC: ITEM_DESC };
  // 價格：依道具強度分級 × 自己第幾次購買（越買越貴），每 25 回合歸零；錢最少的人 5 折；後期跟著通膨（最多 3 倍）
  const ITEM_BASE = { invest: 1000, shield: 1500, trap: 2000, bomb: 2500, steal: 3000 }, ITEM_MULT = [1, 2, 3.5, 5], ITEM_RESET = 25;
  root.MONO_ITEMS.BASE = ITEM_BASE; root.MONO_ITEMS.MULT = ITEM_MULT; root.MONO_ITEMS.RESET = ITEM_RESET;
  function itemBought(st, s) { const p = st.players[s], era = Math.floor((st.round - 1) / ITEM_RESET); if (p.buyEra !== era) { p.buyEra = era; p.bought = 0; } return p.bought || 0; }
  function itemPrice(st, s, k) { const n = itemBought(st, s); return Math.round(ITEM_BASE[k] * ITEM_MULT[Math.min(n, ITEM_MULT.length - 1)] * Math.min(3, inflation(st)) * (isLast(st, s) ? 0.5 : 1) / 100) * 100; }
  // 投資：買道具的錢就是本金，3 回合後拿回 6,000（跟著通膨，最多 3 倍）
  function investAmt(st) { return Math.round(6000 * Math.min(3, inflation(st)) / 100) * 100; }
  // 偷錢：拿對方現金的 15%；偷比自己有錢的人上限高（翻盤用），偷比自己窮的人上限很低（不欺負弱勢）
  function stealAmt(st, s, t) {
    const tp = st.players[t], richer = worth(st, t) > worth(st, s), m = Math.min(3, inflation(st));
    return Math.max(0, Math.min(richer ? 30000 * m : 3000 * m, Math.floor(tp.cash * 0.15 / 100) * 100));
  }
  root.MONO_ITEMS.stealAmt = (st, s, t) => stealAmt(st, s, t);
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
      const short = (cost, what) => ev(st, { t: 'note', seat: s, feed: true, poor: true, text: `💸 買不起：${what}要 ${cost.toLocaleString()}，手上只有 ${Math.max(0, p.cash).toLocaleString()}` });
      if (o === -1) { const c = priceOf(st, s, t.i); if (p.cash >= c) { st.phase = 'buy'; st.pending = { tile: t.i }; return true; } short(c, '買這塊地'); return false; }
      if (o === s) { if (st.levels[t.i] >= 4) return false; const c = upOf(st, s, t.i); if (p.cash >= c) { st.phase = 'upgrade'; st.pending = { tile: t.i }; return true; } short(c, '升級'); return false; }
      if (!st.players[o].alive) return false;
      let rent = rentOf(st, t.i); { const mi = perk(st, o).rentIn || 1, mo = perk(st, s).rentOut || 1; if (mi !== 1 || mo !== 1) rent = r100(rent * mi * mo); }
      if (p.freeRent > 0) { p.freeRent--; ev(st, { t: 'note', seat: s, feed: true, text: '🪷 神明保佑：這次過路費免付' }); return false; }
      if (p.curse > 0) { p.curse--; rent *= 2; ev(st, { t: 'note', seat: s, feed: true, text: `👁️ 多眼鳥的詛咒：過路費加倍（還剩 ${p.curse} 次）` }); }
      // 翻盤問答：付不起（賣光也不夠）就跟收錢者搶答，答贏免付、不出局
      if (!canPay(st, s, rent)) { startQuiz(st, s, o, rent, t.i); return true; }
      pay(st, s, o, rent, '過路費', t.i);
      // 翻盤機制：付完過路費後，可以用 1.4 倍價格強制收購（地標 Lv4 不能收購）
      if (p.alive && st.levels[t.i] < 4 && !(st.boLock[t.i] > st.round)) {
        if (p.cash >= buyoutOf(st, t.i)) { st.phase = 'buyout'; st.pending = { tile: t.i, from: o, cost: buyoutOf(st, t.i) }; return true; }
        ev(st, { t: 'note', seat: s, feed: true, text: `可以強制收購這塊地（要 ${buyoutOf(st, t.i).toLocaleString()}），但錢不夠` });
      }
      return false;
    }
    if (t.type === 'luck' || t.type === 'bad') { cardWithPerk(st, s, t.type, drawCard(st, t.type), depth); return st.phase !== 'roll'; }
    if (t.type === 'item' || t.type === 'free') return openShop(st, s, t.type === 'free');
    if (t.type === 'tax' && perk(st, s).noTax) { ev(st, { t: 'note', seat: s, feed: true, text: `🎩 老大逃漏稅：${TH()[st.theme].tax}免繳` }); return false; }
    if (t.type === 'tax') { const d = taxDetail(st, s); ev(st, { t: 'note', seat: s, text: `財產稅 ${d.wealth.toLocaleString()}＋房屋稅 ${d.house.toLocaleString()}${d.total > d.wealth + d.house ? '（最少 1,000）' : ''}` }); pay(st, s, -1, d.total, '稅金'); return false; }
    if (t.type === 'gotojail') { sendJail(st, s); return false; }
    if (t.type === 'teleport') { const to = BOARD.filter(b => b.type === 'prop')[Math.floor(Math.random() * 16)].i; jump(st, s, to, false); return land(st, s, depth + 1); }
    return false;
  }
  // 經過起點的加蓋機會：自己的地（未滿 4 級、付得起建築費）任選一塊加蓋一層
  function buildOpts(st, s) { const p = st.players[s]; return BOARD.filter(t => t.type === 'prop' && st.owners[t.i] === s && st.levels[t.i] < 4 && p.cash >= upOf(st, s, t.i)).map(t => t.i); }
  function endTurn(st, now) {
    const cp = st.players[st.turn];
    if (cp && cp.alive && cp.jailAsk && st.phase !== 'over') { st.phase = 'jailask'; st.pending = { left: cp.jailChoice, extra: !!st.extra }; st.extra = false; setDeadline(st, now, 20000); return; }
    if (cp && cp.jailAsk && !cp.alive) cp.jailAsk = false;
    if (cp && cp.alive && cp.buildTicket > 0 && st.phase !== 'over') { cp.buildTicket = 0; const opts = buildOpts(st, st.turn); if (opts.length) { st.phase = 'passbuild'; st.pending = { opts }; setDeadline(st, now, 25000); return; } if (BOARD.some(t => t.type === 'prop' && st.owners[t.i] === st.turn && st.levels[t.i] < 4)) ev(st, { t: 'note', seat: st.turn, feed: true, poor: true, text: '💸 經過起點可以加蓋，但錢不夠蓋任何一塊地' }); }
    st.phase = 'roll'; st.pending = null;
    if (st.extra) { st.extra = false; if (st.players[st.turn].alive && alive(st).length > 1) { setDeadline(st, now, 15000); return; } }
    const al = alive(st);
    if (al.length <= 1) return finish(st, 'last');
    if (st.maxRounds === 0 && al.length < st.n) return finish(st, 'bankrupt'); // 有人破產就結束
    let s = st.turn;
    for (let guard = 0; guard < st.n * 4; guard++) {
      s = (s + 1) % st.n;
      if (s === st.first) { st.round++; const cap = st.maxRounds === 0 || st.maxRounds >= 900 ? SAFETY_CAP : st.maxRounds;
        if (st.round > cap) return finish(st, cap === SAFETY_CAP ? 'cap' : 'rounds');
        if (st.inflate && st.round === doomRound(st) - 3) ev(st, { t: 'alert', text: `⚠️ 3 回合後（第 ${doomRound(st)} 回合）末日通膨，過路費會開始暴漲` });
        if (st.inflate && st.round === doomRound(st)) ev(st, { t: 'alert', text: '🔥 末日通膨開始！從現在起過路費每回合暴漲' });
        if (cap !== SAFETY_CAP && cap - st.round === 3) ev(st, { t: 'alert', text: `⏳ 剩最後 3 回合，第 ${cap} 回合結束時用總資產決定勝負` });
        houndRound(st); }
      const p = st.players[s]; if (!p.alive) continue;
      // 蟾蜍：抽到後接下來 3 個自己的回合都是蟾蜍（前 2 回合停住），第 4 回合變回原本的角色（含自畫角色）
      if (p.frog) { if (!(p.frogT > 0)) { p.frog = false; ev(st, { t: 'unfrog', seat: s }); } else p.frogT--; }
      if (p.skip > 0) { p.skip--; ev(st, { t: 'skip', seat: s }); continue; }
      break;
    }
    st.turn = s;
    const np = st.players[s]; np.usedItem = false;
    if (np.invest && np.invest.length) { const dd = (x) => typeof x === 'number' ? x : x.due, due = np.invest.filter(x => dd(x) <= st.round); if (due.length) { np.invest = np.invest.filter(x => dd(x) > st.round); const got = due.reduce((a, x) => a + (typeof x === 'number' ? 6000 : x.amt), 0); np.cash += got; ev(st, { t: 'cash', seat: s, amt: got, why: '投資回收' }); } }
    setDeadline(st, now, 15000);
  }
  function finish(st, why) {
    st.phase = 'over'; st.deadline = 0;
    const dead = st.players.map((p, i) => p.alive ? -1 : i).filter(i => i >= 0);
    st.endWhy = { why: why || 'cap', dead, round: Math.min(st.round, st.maxRounds && st.maxRounds < 900 ? st.maxRounds : SAFETY_CAP) };
    const ranks = U.range(st.n).map(s => { const a = assets(st, s); return { s, w: st.players[s].alive ? a.total : -1, cash: a.cash, land: a.land, bld: a.bld }; }).sort((a, b) => b.w - a.w);
    st.winner = ranks[0].s; st.ranks = ranks;
  }
  function setDeadline(st, now, ms) {
    st.deadline = now + st.anim + ms;
    if (st.phase === 'quiz' && st.pending && !st.pending.start) { st.pending.start = now + st.anim; st.deadline = st.pending.start + QUIZ_MS; }
  }

  const R = {
    _applyCard: applyCard, _raid: houndRound, RAID, RAID_INFO, raidPick, raidAt, perk, priceOf, upOf, useLayout, randomLayout, checkLayout, BOARD, N, LAYOUT, GROUP_COLOR, ITEMS: root.MONO_ITEMS, RENT_MUL, START_BONUS, BOOST, JAIL, ROUND_CAP, tileName, rentOf, inflation, worth, assets, taxOf, taxDetail, buyoutOf,
    init(n, o, now) {
      const theme = TH()[o.theme] ? o.theme : 'ragnarok';
      const cash = +o.cash || 50000;
      const st = {
        n, theme, maxRounds: o.rounds == null || o.rounds === '' ? 20 : +o.rounds, inflate: +o.rounds === 0 || +o.rounds >= 900, round: 1, first: 0, turn: 0, phase: 'pick',
        players: U.range(n).map(() => ({ cash, pos: 0, alive: true, skip: 0, immune: 0, jailfree: 0, char: null })),
        startCash: cash, owners: Array(N).fill(-1), levels: Array(N).fill(0), boLock: Array(N).fill(0), decks: {}, ev: [], evId: 0, anim: 0, pending: null, dice: null
      };
      st.layout = o.layout === 'fixed' ? LAYOUT.slice() : randomLayout(); useLayout(st.layout);
      st.deadline = now + 90000;
      return st;
    },
    begin(st, now) {
      st.ev = []; st.anim = 0; st.evId++; st.animAt = now;
      const th = TH()[st.theme]; const used = st.players.map(p => p.char && p.char.kind === 'preset' ? p.char.i : -1);
      st.players.forEach(p => { if (!p.char) { const i = U.range(th.chars.length).find(i => !used.includes(i)); p.char = { kind: 'preset', i }; used.push(i); } });
      st.players.forEach((p, s) => { const m = perk(st, s); if (m.jailChoice) p.jailChoice = m.jailChoice; });
      st.phase = 'roll'; st.turn = 0; st.first = 0; setDeadline(st, now, 15000);
    },
    act(st, s, a, now) {
      if (a.type === 'pick') {
        if (st.phase !== 'pick') return 'silent';
        const th = TH()[st.theme];
        if (a.custom) { if (th.noCustom) return '這個主題不能自畫角色'; st.players[s].char = { kind: 'custom', i: s % th.chars.length }; }
        else {
          const i = a.i | 0; if (i < 0 || i >= th.chars.length) return '沒有這個角色';
          if (st.players.some((p, k) => k !== s && p.char && p.char.kind === 'preset' && p.char.i === i)) return '這個角色已經被選走了';
          st.players[s].char = { kind: 'preset', i };
          st.players[s].pillPending = !!(a.pad && th.perks && ((i === 0 && !st.players[s].pill) || (i === 1 && st.players[s].stamp == null))); // 真人選了媽的媽啊／郵差先生：等他畫完藥丸、選好郵票圖案再開始
        }
        if (st.players.every(p => p.char && !p.pillPending)) R.begin(st, now);
        return;
      }
      if (a.type === 'pill') { // 媽的媽啊：自己畫的藥丸圖案（32×32 PNG）
        const p0 = st.players[s], th0 = TH()[st.theme]; if (!p0 || !p0.char || p0.char.kind !== 'preset' || p0.char.i !== 0 || !th0.perks) return 'silent';
        if (a.skip) p0.pillPending = false; else { if (typeof a.img !== 'string' || !a.img.startsWith('data:image/png;base64,') || a.img.length > 9000) return '圖案太大了'; p0.pill = a.img; p0.pillPending = false; }
        if (st.phase === 'pick' && st.players.every(p => p.char && !p.pillPending)) R.begin(st, now); return; }
      if (a.type === 'stamp') { // 郵差先生：選郵票圖案（0～5）
        const p0 = st.players[s], th0 = TH()[st.theme]; if (!p0 || !p0.char || p0.char.kind !== 'preset' || p0.char.i !== 1 || !th0.perks) return 'silent';
        if (!a.skip) { const k = a.k | 0; if (k < 0 || k > 5) return '沒有這個圖案'; p0.stamp = k; } p0.pillPending = false;
        if (st.phase === 'pick' && st.players.every(p => p.char && !p.pillPending)) R.begin(st, now); return; }
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
      // 換成自己畫的角色：遊戲中任何時候都可以（選角色時來不及畫的人可以補）
      if (a.type === 'custom') { const p0 = st.players[s]; if (!p0 || !p0.alive || TH()[st.theme].noCustom) return 'silent'; p0.char = { kind: 'custom', i: p0.char ? p0.char.i : s }; return; }
      // 提示框真的出現在玩家畫面上了：從這一刻起再給完整的 15 秒（網路慢、動畫還沒播完時不會被系統先決定）
      if (a.type === 'seen') { if (s === st.turn && ['roll', 'buy', 'upgrade', 'buyout', 'shop', 'gate', 'dicepick', 'passbuild'].includes(st.phase) && st.seenId !== st.evId + ':' + st.phase) { st.seenId = st.evId + ':' + st.phase; st.deadline = Math.max(st.deadline, now + (['gate', 'dicepick', 'passbuild'].includes(st.phase) || (st.phase === 'roll' && st.players[s].trance) ? 30000 : 15000)); return; } return 'silent'; }
      if (s !== st.turn) return '還沒輪到你';
      const p = st.players[s];
      st.ev = []; st.anim = 0; st.evId++; st.animAt = now;
      if (a.type === 'roll') {
        if (st.phase !== 'roll') return 'silent';
        let d = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
        // 神明附身：這一次可以自己決定點數（2～12）
        if (p.trance) { const n = a.pick | 0; if (n >= 2 && n <= 12) d = [Math.ceil(n / 2), Math.floor(n / 2)]; p.trance = false; }
        st.dice = d; ev(st, { t: 'dice', seat: s, d });
        const dm = perk(st, s).dice || 0; if (dm) ev(st, { t: 'note', seat: s, text: dm < 0 ? `🌿 慢慢來：少走 ${-dm} 格` : `多走 ${dm} 格` });
        moveTo(st, s, Math.max(1, d[0] + d[1] + dm));
        if (!land(st, s, 0)) endTurn(st, now); else setDeadline(st, now, 15000);
        return;
      }
      if (a.type === 'jailask') { // 古柯檢查官：要不要用掉一次免進監獄
        if (st.phase !== 'jailask' || !p.jailAsk) return 'silent';
        const keepExtra = st.pending && st.pending.extra; p.jailAsk = false; st.pending = null;
        if (a.use && p.jailChoice > 0) { p.jailChoice--; if (keepExtra) st.extra = true; ev(st, { t: 'jailfree', seat: s }); ev(st, { t: 'note', seat: s, feed: true, text: `👃 用掉一次免進監獄（還剩 ${p.jailChoice} 次）` }); }
        else goJail(st, s);
        st.phase = 'roll'; endTurn(st, now); return;
      }
      if (a.type === 'buy' || a.type === 'upgrade') {
        if (st.phase !== a.type) return 'silent';
        const t = BOARD[st.pending.tile];
        if (a.yes) {
          if (a.type === 'buy') { const c = priceOf(st, s, t.i); if (p.cash < c || st.owners[t.i] !== -1) return '錢不夠'; p.cash -= c; st.owners[t.i] = s; ev(st, { t: 'buy', seat: s, tile: t.i, amt: c }); }
          else { const c = upOf(st, s, t.i); if (p.cash < c || st.levels[t.i] >= 4) return '不能升級'; p.cash -= c; st.levels[t.i]++; ev(st, { t: 'up', seat: s, tile: t.i, level: st.levels[t.i], amt: c }); }
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
        
        items.splice(i, 1); p.usedItem = true;
        const tp = tgt >= 0 ? st.players[tgt] : null, si = tp && tp.items ? tp.items.indexOf('shield') : -1;
        if (si >= 0) { tp.items.splice(si, 1); st.anim += 2600; ev(st, { t: 'item', seat: s, k, target: tgt, tile: a.tile, blocked: true }); setDeadline(st, now, 15000); return; }
        if (tp && perk(st, tgt).itemImmune) { st.anim += 2600; ev(st, { t: 'item', seat: s, k, target: tgt, tile: a.tile, blocked: true, perk: true }); ev(st, { t: 'note', seat: tgt, feed: true, text: '🫠 縮成一團摸不到：道具對他無效' }); setDeadline(st, now, 15000); return; }
        st.anim += 2600;
        if (k === 'trap') { const tm = perk(st, tgt); ev(st, { t: 'item', seat: s, k, target: tgt }); if (tm.noSkip) ev(st, { t: 'note', seat: tgt, feed: true, text: '🥄 麻掉沒感覺：停回合對我無效' }); else tp.skip += 1 + (tm.skipExtra || 0); }
        else if (k === 'steal') { const amt = stealAmt(st, s, tgt); tp.cash -= amt; p.cash += amt; ev(st, { t: 'item', seat: s, k, target: tgt, amt }); }
        else if (k === 'invest') { const amt = investAmt(st); (p.invest = p.invest || []).push({ due: st.round + 3, amt }); ev(st, { t: 'item', seat: s, k, amt, due: st.round + 3 }); }
        else if (k === 'bomb') { const tl = a.tile | 0; st.levels[tl]--; ev(st, { t: 'item', seat: s, k, target: tgt, tile: tl, level: st.levels[tl] }); }
        setDeadline(st, now, 15000); return;
      }
      if (a.type === 'passbuild') {
        if (st.phase !== 'passbuild') return 'silent';
        const to = a.to == null ? -1 : a.to | 0;
        if (to >= 0) { if (!st.pending.opts.includes(to)) return '這塊地不能加蓋'; const c = upOf(st, s, to); if (p.cash < c || st.levels[to] >= 4) return '錢不夠'; p.cash -= c; st.levels[to]++; ev(st, { t: 'up', seat: s, tile: to, level: st.levels[to], amt: c, pass: true }); st.anim += 1600; }
        st.pending = null; endTurn(st, now); return;
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
      if (st.phase === 'roll') {
        const p = st.players[st.turn];
        if (p.trance) { // 附身時電腦會挑：自己的地 > 空地 > 好運 > 其他，避開別人的地
          const score = n => { const t = BOARD[(p.pos + n) % N], o = st.owners[t.i]; return t.type === 'prop' ? (o === st.turn ? 3 : o === -1 ? 2 : -5) : t.type === 'luck' ? 1 : t.type === 'gotojail' || t.type === 'bad' ? -3 : 0; };
          let best = 7; for (let n = 2; n <= 12; n++) if (score(n) > score(best)) best = n; return { seat: st.turn, a: { type: 'roll', pick: best } };
        }
        return { seat: st.turn, a: { type: 'roll' } };
      }
      if (st.phase === 'passbuild') { // 電腦：蓋最高的那塊（最快變地標），但要留 6000 保命錢
        const p = st.players[st.turn], best = st.pending.opts.filter(i => p.cash - upOf(st, st.turn, i) >= 6000).sort((x, y) => st.levels[y] - st.levels[x])[0];
        return { seat: st.turn, a: { type: 'passbuild', to: best == null ? -1 : best } };
      }
      if (st.phase === 'gate') { // 代打：去能升級的自己的地 → 買得起的空地 → 休息站
        const p = st.players[st.turn];
        const up = BOARD.filter(t => t.type === 'prop' && st.owners[t.i] === st.turn && st.levels[t.i] < 4 && p.cash >= upOf(st, st.turn, t.i)).sort((a, b) => b.price - a.price)[0];
        const buy = BOARD.filter(t => t.type === 'prop' && st.owners[t.i] === -1 && p.cash >= priceOf(st, st.turn, t.i)).sort((a, b) => b.price - a.price)[0];
        return { seat: st.turn, a: { type: 'gate', to: (up || buy || BOARD[14]).i } };
      }
      if (st.phase === 'quiz') return { seat: -1, a: { type: 'quizend' } };
      if (st.phase === 'jailask') return { seat: st.turn, a: { type: 'jailask', use: true } }; // 逾時／電腦：用掉免進監獄
      if (st.phase === 'shop') { // 代打：免費就拿第一張；要錢的話，買完還剩 2 萬以上才買最便宜的
        const pd = st.pending, cash = st.players[st.turn].cash;
        if (pd.free) return { seat: st.turn, a: { type: 'shop', k: pd.offers[0] } };
        let best = -1; pd.prices.forEach((c, j) => { if (cash - c >= 20000 && (best < 0 || c < pd.prices[best])) best = j; });
        return { seat: st.turn, a: { type: 'shop', k: best >= 0 ? pd.offers[best] : null } };
      }
      if (st.phase === 'buyout') return { seat: st.turn, a: { type: 'buyout', yes: st.players[st.turn].cash - st.pending.cost >= 25000 } };
      if (st.phase === 'buy' || st.phase === 'upgrade') {
        const t = BOARD[st.pending.tile]; const cost = st.phase === 'buy' ? priceOf(st, st.turn, t.i) : upOf(st, st.turn, t.i);
        return { seat: st.turn, a: { type: st.phase, yes: st.players[st.turn].cash - cost >= 8000 } };
      }
      return null;
    }
  };
  // 所有吃 st 的對外函式：先切到這局的地圖排列
  Object.keys(R).forEach(k => { const f = R[k]; if (typeof f !== 'function' || k === 'init' || k === 'useLayout') return; R[k] = function (...a) { if (a[0] && typeof a[0] === 'object' && a[0].owners) useLayout(a[0].layout); return f.apply(this, a); }; });
  root.MONO_RULES = R;
})(typeof window !== 'undefined' ? window : globalThis);
