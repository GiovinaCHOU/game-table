// 大富翁平衡模擬器（Node 直接跑，不用安裝任何東西）
//   node tools/mono-sim.js                 → 全部情境、每項 400 局
//   node tools/mono-sim.js 200 現況 色組   → 指定局數與情境（名稱見下方 SCEN）
// 規則直接用 js/games/mono-rules.js；提案用 globalThis.__MONO_BAL 開關（說明在 mono-rules.js 的 BAL）
// 指標：
//   技巧差距：1 個聰明電腦 vs 4 個預設電腦（5 人局憑運氣是 20%），越高代表「會玩」越有用
//   路線勝率：5 種不同打法的聰明電腦同桌（每局輪換座位），差距越小代表越多條路走得通
//   落後翻盤：第 15 回合排在後兩名、最後贏的比例（聰明 vs 預設）→ 翻盤靠技巧還是運氣
//   破產回合：第一位破產的回合中位數、落在 30–35 回合的比例
global.window = global;
const G = require('path').join(__dirname, '..', 'js', 'games') + '/';
['common.js', 'mono-themes.js', 'mono-quiz.js', 'mono-rules.js'].forEach(f => require(G + f));
const R = window.MONO_RULES, BOARD = R.BOARD, N28 = R.N;
const bal = () => globalThis.__MONO_BAL || {};

// ===== 聰明電腦 =====
const DICE = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map(x => x / 36);
const noRent = (st, i) => (st.mort && st.mort[i]) || (st.noRent && st.noRent[i] >= st.round);
function rentFor(st, s, i) { const o = st.owners[i]; if (o < 0 || o === s || !st.players[o].alive || noRent(st, i)) return 0; return R.rentOf(st, i); }
// 前方 2–12 格裡，被別人收過路費的期望值與最壞情況
function danger(st, s, from) {
  let exp = 0, max = 0; const pos = from == null ? st.players[s].pos : from;
  for (let d = 2; d <= 12; d++) { const r = rentFor(st, s, (pos + d) % N28); exp += r * DICE[d]; max = Math.max(max, r); }
  return { exp, max };
}
const groupOf = (i) => BOARD[i].g;
const sameGroup = (i) => BOARD.filter(b => b.type === 'prop' && b.g === groupOf(i) && b.i !== i).map(b => b.i);
const completesSet = (st, s, i) => sameGroup(i).every(j => st.owners[j] === s);
const blocksSet = (st, s, i) => sameGroup(i).some(j => st.owners[j] >= 0 && st.owners[j] !== s);
const fullSetOf = (st, i) => { const o = st.owners[i]; return o >= 0 && sameGroup(i).every(j => st.owners[j] === o); };
const leader = (st, s) => st.players.map((p, k) => k).filter(k => k !== s && st.players[k].alive).sort((a, b) => R.worth(st, b) - R.worth(st, a))[0];
const hasShield = (st, k) => (st.players[k].items || []).includes('shield');

// 打法參數：reserve 保命錢倍數、setBias 搶色組、hunter 收購積極度、items 道具策略、mort 會不會用抵押
const STYLE = {
  平衡: { reserve: 1.0, setBias: 1, hunter: 1, items: 'all', mort: true },
  土地: { reserve: 0.6, setBias: 2, hunter: 0.5, items: 'invest', mort: true },
  現金: { reserve: 1.6, setBias: 0.5, hunter: 0, items: 'invest', mort: false },
  獵人: { reserve: 1.0, setBias: 1, hunter: 2, items: 'none', mort: true },
  攻擊: { reserve: 1.0, setBias: 1, hunter: 0.5, items: 'attack', mort: false }
};
function reserveOf(st, s, S) { const d = danger(st, s); return Math.max(3000, S.reserve * Math.max(d.max * 0.8, d.exp * 4)); }

function smartPre(st, s, S, now) { // 擲骰前：抵押／贖回、用道具
  const p = st.players[s], res = reserveOf(st, s, S);
  if (bal().mortgage && S.mort) {
    const mort = st.mort || {};
    if (p.cash < res * 0.5) { const t = R.mine(st, s).filter(t => !mort[t.i] && !fullSetOf(st, t.i)).sort((a, b) => R.rentOf(st, a.i) - R.rentOf(st, b.i))[0]; if (t) R.act(st, s, { type: 'mortgage', tile: t.i }, now); }
    else { const t = R.mine(st, s).filter(t => mort[t.i] && p.cash - mort[t.i] > res * 1.5)[0]; if (t) R.act(st, s, { type: 'redeem', tile: t.i }, now); }
  }
  if (!p.items || !p.items.length || p.usedItem || S.items === 'none') return;
  const ld = leader(st, s); const meAhead = ld == null || R.worth(st, s) >= R.worth(st, ld);
  for (let i = 0; i < p.items.length; i++) {
    const k = p.items[i];
    if (k === 'invest') { R.act(st, s, { type: 'item', i }, now); return; }
    if (k === 'shield' || S.items === 'invest') continue;
    const foes = st.players.map((q, j) => j).filter(j => j !== s && st.players[j].alive && !hasShield(st, j));
    if (k === 'bomb') { // 炸別人收最多的那塊（優先拆色組）
      const t = BOARD.filter(t => t.type === 'prop' && foes.includes(st.owners[t.i]) && st.levels[t.i] > 0).sort((a, b) => R.rentOf(st, b.i) * (fullSetOf(st, b.i) ? 1.5 : 1) - R.rentOf(st, a.i) * (fullSetOf(st, a.i) ? 1.5 : 1))[0];
      if (t) { R.act(st, s, { type: 'item', i, tile: t.i }, now); return; } continue;
    }
    if (meAhead && k === 'trap') continue; // 領先時陷阱留著
    const tgt = (k === 'steal' ? foes.slice().sort((a, b) => st.players[b].cash - st.players[a].cash) : foes.slice().sort((a, b) => R.worth(st, b) - R.worth(st, a)))[0];
    if (tgt != null) { R.act(st, s, { type: 'item', i, target: tgt }, now); return; }
  }
}
// 擲 1 顆還是 2 顆：比較落點的期望值（踩到會破產的地當成大損失）
function tileValue(st, s, i, passStart) {
  const p = st.players[s], t = BOARD[i]; let v = passStart ? 5000 : 0;
  if (t.type === 'prop') { const o = st.owners[i];
    if (o === -1) v += p.cash >= R.priceOf(st, s, i) ? t.price * 0.3 : 0;
    else if (o === s) v += st.levels[i] < 4 && p.cash >= R.upOf(st, s, i) ? t.up * 0.3 : 0;
    else { const r = rentFor(st, s, i); v -= r >= p.cash + R.worth(st, s) * 0.3 ? R.worth(st, s) * 1.5 : r; } }
  else if (t.type === 'luck') v += 1000; else if (t.type === 'bad') v -= 1500; else if (t.type === 'gotojail') v -= 3000; else if (t.type === 'tax') v -= R.taxOf(st, s);
  return v;
}
function diceEV(st, s, one) { const pos = st.players[s].pos; let ev = 0;
  if (one) for (let d = 1; d <= 6; d++) ev += tileValue(st, s, (pos + d) % N28, pos + d >= N28) / 6;
  else for (let d = 2; d <= 12; d++) ev += tileValue(st, s, (pos + d) % N28, pos + d >= N28) * DICE[d];
  return ev; }
function smartDecide(st, S) {
  const s = st.turn, p = st.players[s], a = R.autoAct(st); if (!a) return null; const res = reserveOf(st, s, S);
  if (st.phase === 'buy') { const t = st.pending.tile, c = R.priceOf(st, s, t), w = completesSet(st, s, t) ? 0.3 / S.setBias : blocksSet(st, s, t) ? 0.7 / S.setBias : 1; a.a.yes = p.cash - c >= res * w; }
  if (st.phase === 'upgrade') { const t = st.pending.tile, c = R.upOf(st, s, t); a.a.yes = p.cash - c >= res * (fullSetOf(st, t) ? 0.7 : 1.1); }
  if (st.phase === 'passbuild') { const best = st.pending.opts.filter(i => p.cash - R.upOf(st, s, i) >= res).sort((x, y) => (R.rentOf(st, y) * (fullSetOf(st, y) ? 2 : 1)) - (R.rentOf(st, x) * (fullSetOf(st, x) ? 2 : 1)))[0]; a.a.to = best == null ? -1 : best; }
  if (st.phase === 'buyout') { const { tile, cost, from } = st.pending; const good = completesSet(st, s, tile) || fullSetOf(st, tile) || st.levels[tile] >= 2 || (S.hunter >= 2 && from === leader(st, s)); a.a.yes = S.hunter > 0 && good && p.cash - cost >= res * (S.hunter >= 2 ? 0.5 : 0.9); }
  if (st.phase === 'shop') {
    const pd = st.pending; let pick = null;
    const want = S.items === 'none' ? [] : S.items === 'invest' ? ['invest', 'shield'] : S.items === 'attack' ? ['bomb', 'steal', 'trap', 'shield', 'invest'] : ['invest', 'bomb', 'steal', 'shield', 'trap'];
    for (const k of want) { const j = pd.offers.indexOf(k); if (j >= 0 && (pd.free || p.cash - pd.prices[j] >= res)) { pick = k; break; } }
    if (pd.free && !pick && S.items !== 'none') pick = pd.offers[0];
    a.a.k = pick;
  }
  if (st.phase === 'roll' && bal().diceChoice && !p.trance) a.a.one = diceEV(st, s, true) > diceEV(st, s, false) + 500;
  if (st.phase === 'boost') a.a.k = S.items !== 'none' && (p.items || []).length < 3 ? 'item' : 'cash';
  return a;
}

// ===== 跑一局 =====
// seats：每個座位是 STYLE 名稱或 '預設'（遊戲內建電腦）
function game(seats, theme) {
  let now = 0; const n = seats.length, st = R.init(n, { theme: theme || 'ragnarok', rounds: 0, cash: 50000 }, now);
  for (let s = 0; s < n; s++) R.act(st, s, { type: 'pick', i: s }, now);
  let guard = 0, at15 = null;
  while (st.phase !== 'over' && guard++ < 30000) {
    now += 1000;
    if (st.round >= 15 && !at15) at15 = st.players.map((p, k) => k).sort((a, b) => R.worth(st, b) - R.worth(st, a));
    if (st.phase === 'quiz') { // 問答：兩人各 50% 答對、先後隨機（真人大致如此）
      const pd = st.pending; [pd.debtor, pd.cred].forEach(k => R.act(st, k, { type: 'answer', c: Math.random() < 0.5 ? (st.quizKey | 0) : ((st.quizKey + 1) % 4) }, pd.start + Math.random() * 5000));
      if (st.phase === 'quiz') R.act(st, -1, { type: 'quizend' }, st.deadline + 1); continue;
    }
    const sty = seats[st.turn], S = STYLE[sty];
    if (S && st.phase === 'roll') smartPre(st, st.turn, S, now);
    const a = S ? smartDecide(st, S) : R.autoAct(st); if (!a) break;
    R.act(st, a.seat, a.a, now);
  }
  return { winner: st.winner, round: st.endWhy ? st.endWhy.round : 0, at15 };
}

// ===== 情境（提案組合）=====
const SCEN = {
  現況: {},
  色組: { setMul: 1.5 },
  落後收購: { lagBuyout: 1.1 },
  投資浮動: { invest: { price: 3000, lo: 2000, hi: 10000 } },
  轟炸停租: { bombRent: true },
  補助三選一: { boostChoice: true },
  彩池: { pot: true },
  抵押: { mortgage: true },
  擲骰選擇: { diceChoice: true },
  末日放緩: { doomRate: 0.3 },
  色組加倍: { setMul: 2.5 },
  收購1點2: { buyoutMul: 1.2 },
  收購1點2加色組: { buyoutMul: 1.2, setMul: 2 },
  建議組合: { diceChoice: true, doomRate: 0.45, setMul: 2, buyoutMul: 1.2, lagBuyout: 1.0, invest: { price: 3000, lo: 2000, hi: 10000 }, bombRent: true },
  '擲骰選擇＋末日放緩': { diceChoice: true, doomRate: 0.3 },
  組合: { setMul: 1.5, lagBuyout: 1.1, invest: { price: 3000, lo: 2000, hi: 10000 }, bombRent: true, boostChoice: true, pot: true, mortgage: true }
};
const ROUTES = ['平衡', '土地', '現金', '獵人', '攻擊'];
function run(name, N) {
  globalThis.__MONO_BAL = SCEN[name];
  // 1) 技巧差距＋落後翻盤（聰明輪流坐不同座位）
  let sw = 0, sb = 0, sbw = 0, db = 0, dbw = 0; const rounds = [];
  for (let g = 0; g < N; g++) {
    const me = g % 5, seats = Array(5).fill('預設'); seats[me] = '平衡'; const r = game(seats);
    if (r.winner === me) sw++; rounds.push(r.round);
    if (r.at15) r.at15.slice(3).forEach(k => { if (k === me) { sb++; if (r.winner === k) sbw++; } else { db++; if (r.winner === k) dbw++; } });
  }
  // 2) 路線勝率（5 種打法同桌、輪換座位）
  const rw = {}; ROUTES.forEach(k => rw[k] = 0); let lw = 0, ln = 0;
  for (let g = 0; g < N; g++) {
    const seats = ROUTES.map((_, i) => ROUTES[(i + g) % 5]); const r = game(seats);
    rw[seats[r.winner]]++; rounds.push(r.round); if (r.at15) { ln++; if (r.at15[0] === r.winner) lw++; }
  }
  rounds.sort((a, b) => a - b); const pct = (x, y) => y ? Math.round(x / y * 100) + '%' : '-';
  const spread = Math.max(...ROUTES.map(k => rw[k])) - Math.min(...ROUTES.map(k => rw[k]));
  return {
    情境: name, 技巧差距: pct(sw, N), 落後翻盤聰明: pct(sbw, sb), 落後翻盤預設: pct(dbw, db), 第15回合領先者勝: pct(lw, ln),
    路線: ROUTES.map(k => k + pct(rw[k], N)).join(' '), 路線落差: pct(spread, N),
    破產回合中位: rounds[rounds.length >> 1], '30–35回合': pct(rounds.filter(x => x >= 30 && x <= 35).length, rounds.length)
  };
}
module.exports = { game, run, SCEN, STYLE };
if (require.main === module) {
  const args = process.argv.slice(2), N = +args[0] || 400, names = args.slice(1).length ? args.slice(1) : Object.keys(SCEN);
  for (const nm of names) { if (!SCEN[nm]) { console.log('沒有這個情境：' + nm); continue; } const t = Date.now(); const r = run(nm, N); console.log(JSON.stringify(r), `(${Math.round((Date.now() - t) / 1000)}s)`); }
}
