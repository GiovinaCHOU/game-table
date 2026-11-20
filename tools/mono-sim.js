// 大富翁平衡模擬器（Node 直接跑，不用安裝任何東西）
//   node tools/mono-sim.js main [局數] [情境]     → A–E 情境的完整比較（預設每批 2000 局）
//   node tools/mono-sim.js themes [局數] A E      → 各主題 × 指定情境
//   node tools/mono-sim.js players [局數] A E     → 3～6 人 × 指定情境
//   node tools/mono-sim.js check                  → 印出 300 局的指紋（改規則前後比對「正式規則有沒有變」用）
// 規則直接用 js/games/mono-rules.js，提案用開局選項 o.bal 打開（mono-rules.js 的 BAL 有說明）
// 每一局用固定亂數種子（第 g 局＝種子 g），不同情境的第 g 局起點完全一樣，可以配對比較
global.window = global; globalThis.__MONO_SIM = true;
const G = require('path').join(__dirname, '..', 'js', 'games') + '/';

// ===== 固定種子亂數（Math.random 和 crypto 都接管，洗牌會用到 crypto）=====
let _rng = Math.random;
function seed(n) { let a = (n * 2654435761) >>> 0 || 1; _rng = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
Math.random = () => _rng();
Object.defineProperty(globalThis, 'crypto', { value: { getRandomValues(arr) { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(_rng() * 4294967296); return arr; } }, configurable: true, writable: true });
['common.js', 'mono-themes.js', 'mono-quiz.js', 'mono-rules.js'].forEach(f => require(G + f));
const R = window.MONO_RULES, BOARD = R.BOARD, N28 = R.N;

// ===== 情境（preview 不影響電腦：電腦本來就看得到全部資訊）=====
const SCEN = {
  A: { name: 'A 現行規則', bal: {} },
  B: { name: 'B 僅擲骰選擇', bal: { diceChoice: true, preview: true } },
  C: { name: 'C 僅色組×2', bal: { setMul: 2 } },
  D: { name: 'D 擲骰＋色組', bal: { diceChoice: true, preview: true, setMul: 2 } },
  E: { name: 'E D＋末日提前1', bal: { diceChoice: true, preview: true, setMul: 2, doomShift: -1 } },
  // 卡片平衡 v1
  CA: { name: 'A 現行規則', bal: {} },
  CB: { name: 'B 僅金額公式', bal: { cardAmt: true } },
  CC: { name: 'C 金額＋分級權重', bal: { cardAmt: true, cardTier: true } },
  CD: { name: 'D 完整（含危機補救）', bal: { cardAmt: true, cardTier: true, rescue: true } }
};

// ===== 聰明電腦（5 種打法）=====
const DICE = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map(x => x / 36);
const sameGroup = (i) => BOARD.filter(b => b.type === 'prop' && b.g === BOARD[i].g && b.i !== i).map(b => b.i);
const completesSet = (st, s, i) => sameGroup(i).every(j => st.owners[j] === s);
const blocksSet = (st, s, i) => sameGroup(i).some(j => st.owners[j] >= 0 && st.owners[j] !== s);
const fullSetOf = (st, i) => { const o = st.owners[i]; return o >= 0 && sameGroup(i).every(j => st.owners[j] === o); };
const leader = (st, s) => st.players.map((p, k) => k).filter(k => k !== s && st.players[k].alive).sort((a, b) => R.worth(st, b) - R.worth(st, a))[0];
const hasShield = (st, k) => (st.players[k].items || []).includes('shield');
function danger(st, s) { let exp = 0, max = 0; const pos = st.players[s].pos; for (let d = 2; d <= 12; d++) { const r = R.rentIfLand(st, s, (pos + d) % N28); exp += r * DICE[d]; max = Math.max(max, r); } return { exp, max }; }
const STYLE = {
  平衡: { reserve: 1.0, setBias: 1, hunter: 1, items: 'all' },
  土地: { reserve: 0.6, setBias: 2, hunter: 0.5, items: 'invest' },
  現金: { reserve: 1.6, setBias: 0.5, hunter: 0, items: 'invest' },
  獵人: { reserve: 1.0, setBias: 1, hunter: 2, items: 'none' },
  攻擊: { reserve: 1.0, setBias: 1, hunter: 0.5, items: 'attack' }
};
const ROUTES = Object.keys(STYLE);
function reserveOf(st, s, S) { const d = danger(st, s); return Math.max(3000, S.reserve * Math.max(d.max * 0.8, d.exp * 4)); }
function tileValue(st, s, i, pass) {
  const p = st.players[s], t = BOARD[i]; let v = pass ? R.START_BONUS : 0;
  if (t.type === 'prop') { const o = st.owners[i];
    if (o === -1) v += p.cash >= R.priceOf(st, s, i) ? t.price * 0.3 : 0;
    else if (o === s) v += st.levels[i] < 4 && p.cash >= R.upOf(st, s, i) ? t.up * 0.3 : 0;
    else { const r = R.rentIfLand(st, s, i); v -= r > R.liqValue(st, s) + (pass ? R.START_BONUS : 0) ? R.worth(st, s) * 1.5 : r; } }
  else if (t.type === 'luck') v += 1000; else if (t.type === 'bad') v -= 1500; else if (t.type === 'gotojail') v -= 3000; else if (t.type === 'tax') v -= R.taxOf(st, s);
  return v;
}
function diceEV(st, s, one) { const pos = st.players[s].pos, dm = R.perk(st, s).dice || 0; let ev = 0;
  const dist = one ? [1, 2, 3, 4, 5, 6].map(k => [k, 1 / 6]) : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(k => [k, DICE[k]]);
  dist.forEach(([k, pr]) => { const steps = Math.max(1, k + dm); ev += tileValue(st, s, (pos + steps) % N28, pos + steps >= N28) * pr; }); return ev; }
function smartPre(st, s, S, now) {
  const p = st.players[s]; if (!p.items || !p.items.length || p.usedItem || S.items === 'none') return;
  const ld = leader(st, s), meAhead = ld == null || R.worth(st, s) >= R.worth(st, ld);
  for (let i = 0; i < p.items.length; i++) {
    const k = p.items[i];
    if (k === 'invest') { R.act(st, s, { type: 'item', i }, now); return; }
    if (k === 'shield' || S.items === 'invest') continue;
    const foes = st.players.map((q, j) => j).filter(j => j !== s && st.players[j].alive && !hasShield(st, j));
    if (k === 'bomb') { const sc = (t) => R.rentOf(st, t.i) * (fullSetOf(st, t.i) ? 1.5 : 1);
      const t = BOARD.filter(t => t.type === 'prop' && foes.includes(st.owners[t.i]) && st.levels[t.i] > 0).sort((a, b) => sc(b) - sc(a))[0];
      if (t) { R.act(st, s, { type: 'item', i, tile: t.i }, now); return; } continue; }
    if (meAhead && k === 'trap') continue;
    const tgt = (k === 'steal' ? foes.slice().sort((a, b) => st.players[b].cash - st.players[a].cash) : foes.slice().sort((a, b) => R.worth(st, b) - R.worth(st, a)))[0];
    if (tgt != null) { R.act(st, s, { type: 'item', i, target: tgt }, now); return; }
  }
}
function smartDecide(st, S) {
  const s = st.turn, p = st.players[s], a = R.autoAct(st); if (!a) return null; const res = reserveOf(st, s, S);
  if (st.phase === 'roll' && (st.bal || {}).diceChoice && !p.trance) a.a.one = diceEV(st, s, true) > diceEV(st, s, false) + 500;
  if (st.phase === 'buy') { const t = st.pending.tile, c = R.priceOf(st, s, t), w = completesSet(st, s, t) ? 0.3 / S.setBias : blocksSet(st, s, t) ? 0.7 / S.setBias : 1; a.a.yes = p.cash - c >= res * w; }
  if (st.phase === 'upgrade') { const t = st.pending.tile, c = R.upOf(st, s, t); a.a.yes = p.cash - c >= res * (fullSetOf(st, t) ? 0.7 : 1.1); }
  if (st.phase === 'passbuild') { const sc = (i) => R.rentOf(st, i) * (fullSetOf(st, i) ? 2 : 1); const best = st.pending.opts.filter(i => p.cash - R.upOf(st, s, i) >= res).sort((x, y) => sc(y) - sc(x))[0]; a.a.to = best == null ? -1 : best; }
  if (st.phase === 'buyout') { const { tile, cost, from } = st.pending; const good = completesSet(st, s, tile) || fullSetOf(st, tile) || st.levels[tile] >= 2 || (S.hunter >= 2 && from === leader(st, s)); a.a.yes = S.hunter > 0 && good && p.cash - cost >= res * (S.hunter >= 2 ? 0.5 : 0.9); }
  if (st.phase === 'shop') {
    const pd = st.pending; let pick = null;
    const want = S.items === 'none' ? [] : S.items === 'invest' ? ['invest', 'shield'] : S.items === 'attack' ? ['bomb', 'steal', 'trap', 'shield', 'invest'] : ['invest', 'bomb', 'steal', 'shield', 'trap'];
    for (const k of want) { const j = pd.offers.indexOf(k); if (j >= 0 && (pd.free || p.cash - pd.prices[j] >= res)) { pick = k; break; } }
    if (pd.free && !pick && S.items !== 'none') pick = pd.offers[0];
    a.a.k = pick;
  }
  return a;
}

// ===== 跑一局（順便記錄統計）=====
// seats：每個座位是打法名稱，或 '預設'（遊戲內建電腦，跟測試房的電腦玩家一樣）
function game(seats, bal, opt) {
  opt = opt || {}; let now = 0; const n = seats.length;
  const st = R.init(n, { theme: opt.theme || 'ragnarok', rounds: opt.rounds == null ? 0 : opt.rounds, cash: 50000, bal }, now);
  for (let s = 0; s < n; s++) R.act(st, s, { type: 'pick', i: s }, now);
  const L = { rent: [], rolls: [], at15: null, dead: [], err: null, fatal: null, oneN: 0, choiceN: 0 };
  let guard = 0;
  try {
    while (st.phase !== 'over' && guard++ < 40000) {
      now += 1000;
      if (st.round >= 15 && !L.at15) L.at15 = st.players.map((p, k) => k).sort((a, b) => R.worth(st, b) - R.worth(st, a));
      const w0 = st.players.map((p, k) => R.worth(st, k)), alive0 = st.players.map(p => p.alive);
      let pre = null;
      if (st.phase === 'quiz') { // 問答：兩人各 50% 答對、先後隨機（真人大致如此）
        const pd = st.pending; [pd.debtor, pd.cred].forEach(k => R.act(st, k, { type: 'answer', c: Math.random() < 0.5 ? (st.quizKey | 0) : ((st.quizKey + 1) % 4) }, pd.start + Math.random() * 5000));
        if (st.phase === 'quiz') R.act(st, -1, { type: 'quizend' }, st.deadline + 1);
      } else {
        const sty = seats[st.turn], S = STYLE[sty];
        if (S && st.phase === 'roll') smartPre(st, st.turn, S, now);
        const a = S ? smartDecide(st, S) : R.autoAct(st); if (!a) break;
        if (a.a.type === 'roll' && (st.bal || {}).diceChoice && !st.players[st.turn].trance) { // 擲骰前：記下每個步數會付多少（之後算「另一個選擇會怎樣」）
          const s = st.turn, p = st.players[s], dm = R.perk(st, s).dice || 0, liq = R.liqValue(st, s), cash = p.cash, pos = p.pos;
          const tbl = {}; for (let k = 1; k <= 12; k++) { const steps = Math.max(1, k + dm), pass = pos + steps >= N28 ? R.START_BONUS : 0, r = R.rentIfLand(st, s, (pos + steps) % N28); tbl[k] = { r, high: r > cash + pass, fatal: r > liq + pass }; }
          pre = { s, one: !!a.a.one, tbl }; L.choiceN++; if (a.a.one) L.oneN++;
        }
        R.act(st, a.seat, a.a, now);
      }
      const evs = st.ev || [], quizEnd = evs.some(e => e.t === 'quizres');
      evs.forEach(e => {
        if (e.t === 'quiz') L.rent.push({ amt: e.amt, w: w0[e.debtor] });
        if (e.t === 'pay' && e.why === '過路費' && !quizEnd) L.rent.push({ amt: e.amt, w: w0[e.from] });
      });
      if (pre && st.lastRoll) { const [d1, d2] = st.lastRoll.d; L.rolls.push({ one: pre.one, s: pre.s, mine: pre.tbl[pre.one ? d1 : d1 + d2], alt: pre.tbl[pre.one ? d1 + d2 : d1] }); st.lastRoll = null; }
      st.players.forEach((p, k) => { if (alive0[k] && !p.alive) { L.dead.push({ s: k, round: st.round }); if (!L.fatal) L.fatal = { s: k, roll: pre && pre.s === k ? L.rolls[L.rolls.length - 1] : null }; } });
    }
  } catch (e) { L.err = String(e && e.stack || e).split('\n').slice(0, 3).join(' | '); }
  if (guard >= 40000) L.err = L.err || '超過 40000 步沒結束';
  return { st, winner: st.winner, round: st.endWhy ? st.endWhy.round : st.round, L, n };
}

// ===== 統計 =====
const pct = (x, y) => y ? (x / y * 100).toFixed(1) + '%' : '-';
const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0; };
const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const KIND = { skill: 1, route: 2, casual: 3, last: 4 };
function batch(kind, sc, N, opt) {
  opt = opt || {}; const n = opt.n || 5, out = [];
  for (let g = 0; g < N; g++) {
    seed(KIND[kind] * 1e6 + g);
    let seats;
    if (kind === 'skill') { seats = Array(n).fill('預設'); seats[g % n] = '平衡'; }
    else if (kind === 'route' || kind === 'last') seats = Array.from({ length: n }, (_, i) => ROUTES[(i + g) % ROUTES.length]);
    else seats = Array(n).fill('預設');
    const r = game(seats, sc.bal, Object.assign({}, opt, kind === 'last' ? { rounds: 999 } : {}));
    out.push({ seats, g, winner: r.winner, round: r.round, L: r.L });
  }
  return out;
}
function summarize(sc, N, opt) {
  opt = opt || {}; const n = opt.n || 5;
  const sk = batch('skill', sc, N, opt), ro = batch('route', sc, N, opt), ca = batch('casual', sc, N, opt);
  const all = sk.concat(ro, ca), res = { 情境: sc.name };
  res.技巧差距 = pct(sk.filter(r => r.seats[r.winner] === '平衡').length, N); // 聰明（平衡打法）對 4 個預設電腦
  const used = [...new Set(ro[0].seats)], rw = {}, rn = {}; used.forEach(k => { rw[k] = 0; rn[k] = 0; });
  ro.forEach(r => { r.seats.forEach(k => rn[k]++); rw[r.seats[r.winner]]++; });
  const rv = used.map(k => rw[k] / rn[k] * n * 100 / n); // 每個打法的勝率（以「每坐一次」計）
  res.策略勝率 = used.map((k, i) => k + ' ' + rv[i].toFixed(1) + '%').join('｜');
  res.策略落差 = (Math.max(...rv) - Math.min(...rv)).toFixed(1) + 'pt';
  const fifteen = ro.filter(r => r.L.at15);
  res.第15回合領先者勝 = pct(fifteen.filter(r => r.L.at15[0] === r.winner).length, fifteen.length);
  res.後兩名翻盤 = pct(fifteen.filter(r => r.L.at15.slice(-2).includes(r.winner)).length, fifteen.length);
  let sb = 0, sbw = 0, db = 0, dbw = 0; sk.filter(r => r.L.at15).forEach(r => r.L.at15.slice(-2).forEach(k => { if (r.seats[k] === '平衡') { sb++; if (r.winner === k) sbw++; } else { db++; if (r.winner === k) dbw++; } }));
  res['落後翻盤 聰明／預設'] = pct(sbw, sb) + '／' + pct(dbw, db);
  const rounds = all.map(r => r.round); res.破產回合中位 = med(rounds); res['30–35回合'] = pct(rounds.filter(x => x >= 30 && x <= 35).length, rounds.length);
  const rent = all.flatMap(r => r.L.rent).filter(x => x.w > 0);
  res['過路費>資產50%'] = pct(rent.filter(x => x.amt > x.w * 0.5).length, rent.length);
  res['>70%'] = pct(rent.filter(x => x.amt > x.w * 0.7).length, rent.length);
  res['>100%'] = pct(rent.filter(x => x.amt > x.w).length, rent.length);
  res['每局有>70%'] = pct(all.filter(r => r.L.rent.some(x => x.w > 0 && x.amt > x.w * 0.7)).length, all.length);
  const rolls = all.flatMap(r => r.L.rolls);
  if (rolls.length) {
    const ch = all.reduce((a, r) => a + r.L.choiceN, 0), one = all.reduce((a, r) => a + r.L.oneN, 0);
    res.選1顆 = pct(one, ch);
    res.避開高額 = pct(rolls.filter(x => x.alt.high && !x.mine.high).length, rolls.length) + '（反而踩到 ' + pct(rolls.filter(x => x.mine.high && !x.alt.high).length, rolls.length) + '）';
    res.避開致命 = pct(rolls.filter(x => x.alt.fatal && !x.mine.fatal).length, rolls.length) + '（反而踩到 ' + pct(rolls.filter(x => x.mine.fatal && !x.alt.fatal).length, rolls.length) + '）';
    const fat = all.filter(r => r.L.fatal && r.L.fatal.roll);
    res.破產者換選擇能活 = pct(fat.filter(r => !r.L.fatal.roll.alt.fatal).length, fat.length);
  }
  const byRank = Array.from({ length: n }, () => [0, 0]); fifteen.forEach(r => { const d = r.L.dead[0]; r.L.at15.forEach((k, rank) => { byRank[rank][1]++; if (d && d.s === k) byRank[rank][0]++; }); });
  res['破產機率 依第15回合名次'] = byRank.map(x => pct(x[0], x[1])).join(' ');
  const seatW = Array(n).fill(0); ca.forEach(r => seatW[r.winner]++); res['座位勝率 全預設桌'] = seatW.map(x => pct(x, N)).join(' ');
  const bad = all.filter(r => r.L.err), long = all.filter(r => r.round > 60), short = all.filter(r => r.round < 20);
  res.異常 = `錯誤 ${bad.length}｜超過60回合 ${long.length}｜20回合內結束 ${short.length}` + (bad[0] ? '｜例：' + bad[0].L.err : '') + (short[0] ? `｜最短 g=${short[0].g} 第${short[0].round}回合` : '');
  return res;
}
// 「打到剩一人」：第 15 回合的領先者／後兩名平均存活到第幾回合
function survival(sc, N, opt) {
  const ls = batch('last', sc, N, opt), lead = [], lag = [];
  ls.forEach(r => { if (!r.L.at15) return; const deadAt = {}; r.L.dead.forEach(d => deadAt[d.s] = d.round); const life = (k) => deadAt[k] || r.round;
    lead.push(life(r.L.at15[0])); r.L.at15.slice(-2).forEach(k => lag.push(life(k))); });
  return { 領先者平均存活: mean(lead).toFixed(1), 後兩名平均存活: mean(lag).toFixed(1), 剩一人結束回合中位: med(ls.map(r => r.round)), 剩一人模式錯誤: ls.filter(r => r.L.err).length };
}
function fingerprint() { const out = []; for (let g = 0; g < 300; g++) { seed(g); const r = game(g % 2 ? ['平衡', '預設', '預設', '預設', '預設'] : ROUTES, {}); out.push(r.winner + ':' + r.round + ':' + r.L.rent.length); } let h = 2166136261; const s = out.join(','); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }

module.exports = { game, batch, summarize, survival, fingerprint, SCEN, STYLE, seed, smartPre, smartDecide };
if (require.main === module) {
  const [cmd, nArg, ...rest] = process.argv.slice(2), N = +nArg || 2000, keys = rest.length ? rest : Object.keys(SCEN);
  const show = (o) => console.log(JSON.stringify(o));
  if (cmd === 'check') console.log('指紋', fingerprint());
  else if (cmd === 'main') keys.forEach(k => { const t = Date.now(); show(Object.assign(summarize(SCEN[k], N), survival(SCEN[k], N), { 秒: Math.round((Date.now() - t) / 1000) })); });
  else if (cmd === 'themes') ['ragnarok', 'cyber', 'animal', 'alien', 'buddha', 'magic', 'town', 'gang'].forEach(th => keys.forEach(k => { const r = summarize(SCEN[k], N, { theme: th }); show({ 主題: th, 情境: r.情境, 技巧差距: r.技巧差距, 策略落差: r.策略落差, 第15回合領先者勝: r.第15回合領先者勝, 破產回合中位: r.破產回合中位, '30–35回合': r['30–35回合'], '>70%': r['>70%'], 座位: r['座位勝率 全預設桌'], 異常: r.異常 }); }));
  else if (cmd === 'players') [3, 4, 5, 6].forEach(n => keys.forEach(k => { const r = summarize(SCEN[k], N, { n }); show({ 人數: n, 情境: r.情境, 技巧差距: r.技巧差距, 憑運氣: (100 / n).toFixed(1) + '%', 策略勝率: r.策略勝率, 策略落差: r.策略落差, 第15回合領先者勝: r.第15回合領先者勝, 破產回合中位: r.破產回合中位, '30–35回合': r['30–35回合'], '>70%': r['>70%'], 座位: r['座位勝率 全預設桌'], 異常: r.異常 }); }));
  else console.log('用法：node tools/mono-sim.js main|themes|players|check [局數] [情境 A–E]');
}
