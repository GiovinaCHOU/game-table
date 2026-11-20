// 卡片平衡 v1 模擬：A 現行／B 金額公式／C 金額＋分級／D 完整（含危機補救）
//   node tools/mono-cardsim.js [每格局數=5000] [人數=3,5,6] [情境=CA,CB,CC,CD] > 結果.json
// 每個（情境 × 人數）跑兩種桌：5 種打法混合桌（策略勝率）、全內建電腦桌（一般玩家）；主題依局號輪流 8 個
// 同一局號在每個情境用同一個亂數種子（配對比較）
const M = require('./mono-sim.js'); const R = window.MONO_RULES;
const args = process.argv.slice(2), N = +args[0] || 5000, NS = (args[1] || '3,5,6').split(',').map(Number), SC = (args[2] || 'CA,CB,CC,CD').split(',');
const THEMES = ['ragnarok', 'cyber', 'animal', 'alien', 'buddha', 'magic', 'town', 'gang'], ROUTES = Object.keys(M.STYLE);
const PLAIN = ['m', 'up', 'mv', 'go', 'jailfree', 'each', 'immune', 'teleport', 'jail', 'skip', 'house', 'down', 'give', 'pct', 'gonb', 'again'];
const tierOf = (eff) => R.cardTierOf(eff);

// ===== 每一步的記錄 =====
let G = null; // 這一局的記錄
const orig = R.act;
R.act = function (st, s, a, now) {
  if (!G) return orig.call(this, st, s, a, now);
  const c0 = st.players.map(p => p.cash), w0 = st.players.map((p, k) => R.worth(st, k)), alive0 = st.players.map(p => p.alive), ph0 = st.phase;
  const crisisCard = ph0 === 'crisis' && st.pending ? st.pending.card : null, crisisSeat = st.turn;
  const r = orig.call(this, st, s, a, now);
  const evs = st.ev || [];
  const al0 = w0.filter((w, j) => alive0[j]), avg0 = al0.reduce((x, y) => x + y, 0) / Math.max(1, al0.length);
  const rankOf = (ws, k) => ws.filter((w, j) => alive0[j] && w > ws[k]).length;
  const doom = ({ 2: 18, 3: 21, 4: 25, 5: 27, 6: 29 })[st.n] || 27; // 末日通膨開始回合（同 mono-rules.js 的 DOOM_BY_N）
  const rec = (seat, eff, theme, ci) => {
    const k = seat, w1 = R.worth(st, k), ws1 = st.players.map((p, j) => R.worth(st, j));
    // 卡片本身的帳＝資產變化，扣掉：抽卡之前同一步裡的所有金流（投資回收、魔王等），以及抽卡之後的過路費、稅金、起點薪水、落後補助
    let other = 0; evs.forEach((e, idx) => { const before = idx < ci, ext = before || /過路費|稅金|起點|落後補助|還債/.test(e.why || '');
      if (e.t === 'pay' && ext && e.why !== '還債') { if (e.from === k) other -= e.amt; if (e.to === k) other += e.amt; }
      if (e.t === 'cash' && e.seat === k && ext) other += e.amt; });
    const d = w1 - w0[k] - other, died = alive0[k] && !st.players[k].alive;
    const nAl = alive0.filter(Boolean).length, r0 = rankOf(w0, k);
    G.cards.push({ eff, tier: tierOf(eff.replace(/:.*/, ':' + (eff.split(':')[1] || '0'))), d, ratio: w0[k] > 0 ? d / w0[k] : 0, dead: died && w0[k] >= avg0 * 0.3, straw: died && w0[k] < avg0 * 0.3,
      rk: r0 - rankOf(ws1, k), lead: r0 === 0, last: r0 === nAl - 1, cashB: c0[k] < 10000 ? '現金<1萬' : c0[k] < 50000 ? '現金1–5萬' : '現金≥5萬', stage: st.round <= 15 ? '前期' : st.round < doom ? '中期' : '後期', theme, round: st.round });
  };
  if (crisisCard) rec(crisisSeat, crisisCard.eff, st.theme, 0); // 危機處理：選完之後才是這張卡真正的效果
  else { const ci = evs.findIndex(e => e.t === 'card'); if (ci >= 0 && !evs.some(e => e.t === 'crisis')) rec(evs[ci].seat, evs[ci].eff, st.theme, ci); }
  if (ph0 === 'crisis' && st.rescueLog && st.rescueLog.length > G.resc.length) {
    const L = st.rescueLog[st.rescueLog.length - 1], al = st.players.map((p, j) => j).filter(j => st.players[j].alive);
    const avg = al.reduce((x, j) => x + R.worth(st, j), 0) / Math.max(1, al.length);
    G.resc.push({ c: L.c, alive: L.alive, round: L.round, s: L.s, cost: L.cost, worthRatio: L.alive ? R.worth(st, L.s) / Math.max(1, avg) : 0 });
  }
  return r;
};

// ===== 統計工具 =====
const q = (a, p) => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
function wilson(x, n) { if (!n) return null; const z = 1.96, p = x / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [+(p * 100).toFixed(2), +((c - h) * 100).toFixed(2), +((c + h) * 100).toFixed(2)]; }
function medCI(a) { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), n = b.length, h = 1.96 * Math.sqrt(n) / 2; return [b[n >> 1], b[Math.max(0, Math.floor(n / 2 - h))], b[Math.min(n - 1, Math.ceil(n / 2 + h))]]; }
const dist = (a) => a.length ? { 中位數: q(a, 0.5), P10: q(a, 0.1), P25: q(a, 0.25), P75: q(a, 0.75), P90: q(a, 0.9), 最小: a.reduce((x, y) => Math.min(x, y), Infinity), 最大: a.reduce((x, y) => Math.max(x, y), -Infinity), 平均: Math.abs(mean(a)) >= 100 ? Math.round(mean(a)) : +mean(a).toFixed(2) } : null;

function run(sk, n) {
  const sc = M.SCEN[sk], out = { 情境: sc.name, 人數: n };
  const games = [];
  for (const table of ['route', 'casual']) for (let g = 0; g < N; g++) {
    M.seed((table === 'route' ? 11e6 : 12e6) + n * 1e5 + g); const theme = THEMES[g % 8];
    const seats = table === 'route' ? Array.from({ length: n }, (_, i) => ROUTES[(i + g) % ROUTES.length]) : Array(n).fill('預設');
    G = { cards: [], resc: [] }; const r = M.game(seats, sc.bal, { theme, n }); const rec = G; G = null;
    games.push({ table, theme, seats, g, winner: r.winner, round: r.round, L: r.L, cards: rec.cards, resc: rec.resc, err: r.L.err });
  }
  const all = games, ro = games.filter(x => x.table === 'route'), ca = games.filter(x => x.table === 'casual');
  const cards = all.flatMap(x => x.cards), byTier = (t) => cards.filter(c => c.tier === t);
  // 1 直接致死率、2 前期破產率
  out['1 卡片直接致死率（每千次抽卡）'] = { 全部: wilson(cards.filter(c => c.dead).length, cards.length)?.map(x => +(x * 10).toFixed(2)), 普通: wilson(byTier('common').filter(c => c.dead).length, byTier('common').length)?.map(x => +(x * 10).toFixed(2)), 稀有: wilson(byTier('rare').filter(c => c.dead).length, byTier('rare').length)?.map(x => +(x * 10).toFixed(2)), 彩蛋: wilson(byTier('egg').filter(c => c.dead).length, byTier('egg').length)?.map(x => +(x * 10).toFixed(2)), 壓垮稻草次數: cards.filter(c => c.straw).length };
  out['1b 有卡片直接致死的局數比例%'] = wilson(all.filter(x => x.cards.some(c => c.dead)).length, all.length);
  out['2 前期破產率%（第1位破產在第15回合內／第20回合內）'] = { '≤15': wilson(all.filter(x => x.round <= 15 && x.L.dead.length).length, all.length), '≤20': wilson(all.filter(x => x.round <= 20 && x.L.dead.length).length, all.length) };
  // 3 每張卡的資產變動（依級別、階段）
  const dd = (arr) => dist(arr.map(c => Math.round(c.d)));
  out['3 卡片資產變動（依級別）'] = { 普通: dd(byTier('common')), 稀有: dd(byTier('rare')), 彩蛋: dd(byTier('egg')) };
  out['3b 卡片資產變動（依階段，全部級別）'] = { 前期: dd(cards.filter(c => c.stage === '前期')), 中期: dd(cards.filter(c => c.stage === '中期')), 後期: dd(cards.filter(c => c.stage === '後期')) };
  out['3e 依抽卡前現金（全部級別）'] = Object.fromEntries(['現金<1萬', '現金1–5萬', '現金≥5萬'].map(b => [b, Object.assign({ 次數: cards.filter(c => c.cashB === b).length, '致死‰': wilson(cards.filter(c => c.cashB === b && c.dead).length, cards.filter(c => c.cashB === b).length)?.map(x => +(x * 10).toFixed(2)) }, dd(cards.filter(c => c.cashB === b)))]));
  out['3c 單張卡讓資產變動超過30%的比例%'] = { 全部: wilson(cards.filter(c => Math.abs(c.ratio) > 0.3).length, cards.length), 彩蛋: wilson(byTier('egg').filter(c => Math.abs(c.ratio) > 0.3).length, byTier('egg').length) };
  const per = {}; cards.forEach(c => { const k = c.theme + ' ' + c.eff.split(':')[0] + (c.tier === 'egg' ? '（彩蛋）' : ''); (per[k] = per[k] || []).push(c); });
  out['3d 變動最大的 10 種卡（依 |P10|、|P90|）'] = Object.entries(per).filter(([, a]) => a.length >= 30).map(([k, a]) => ({ k, n: a.length, P10: q(a.map(c => c.d), 0.1), P90: q(a.map(c => c.d), 0.9), 致死: a.filter(c => c.dead).length })).sort((x, y) => Math.max(Math.abs(y.P10), Math.abs(y.P90)) - Math.max(Math.abs(x.P10), Math.abs(x.P90))).slice(0, 10).map(o => `${o.k}：P10 ${Math.round(o.P10)}／P90 ${Math.round(o.P90)}（${o.n} 次，致死 ${o.致死}）`);
  // 4 排名變動
  out['4 卡片造成名次變動'] = { 平均名次變動: +mean(cards.map(c => Math.abs(c.rk))).toFixed(3), '一次變動≥2名%': wilson(cards.filter(c => Math.abs(c.rk) >= 2).length, cards.length), '彩蛋 一次變動≥2名%': wilson(byTier('egg').filter(c => Math.abs(c.rk) >= 2).length, byTier('egg').length) };
  // 5 領先者／落後者
  const ld = cards.filter(c => c.lead), lg = cards.filter(c => c.last);
  out['5 領先者／落後者抽卡的資產變動'] = { 領先者: dd(ld), 落後者: dd(lg), 領先者幸運彩蛋平均: Math.round(mean(ld.filter(c => c.tier === 'egg' && c.d > 0).map(c => c.d)) || 0), 落後者幸運彩蛋平均: Math.round(mean(lg.filter(c => c.tier === 'egg' && c.d > 0).map(c => c.d)) || 0) };
  // 6 彩蛋頻率
  out['6 彩蛋實際出現'] = { 每次抽卡機率: wilson(byTier('egg').length, cards.length), 每局平均: +mean(all.map(x => x.cards.filter(c => c.tier === 'egg').length)).toFixed(2), '每局次數 P10/中位/P90': [q(all.map(x => x.cards.filter(c => c.tier === 'egg').length), 0.1), q(all.map(x => x.cards.filter(c => c.tier === 'egg').length), 0.5), q(all.map(x => x.cards.filter(c => c.tier === 'egg').length), 0.9)], '一局都沒出現%': wilson(all.filter(x => !x.cards.some(c => c.tier === 'egg')).length, all.length), 稀有每次抽卡機率: wilson(byTier('rare').length, cards.length) };
  // 7、8 補救
  const rs = all.flatMap(x => x.resc.map(r => Object.assign({ endRound: x.round, deadAt: (x.L.dead.find(d => d.s === r.s) || {}).round }, r)));
  if (rs.length) {
    const cnt = {}; rs.forEach(r => cnt[r.c] = (cnt[r.c] || 0) + 1);
    out['7 補救'] = { 危機次數: rs.length, 每千局: +(rs.length / all.length * 1000).toFixed(1), 選擇: cnt, '補救當下成功（沒破產）%': wilson(rs.filter(r => r.alive).length, rs.length), '依選擇 成功%': Object.fromEntries(Object.keys(cnt).map(c => [c, wilson(rs.filter(r => r.c === c && r.alive).length, cnt[c])])) };
    const ok = rs.filter(r => r.alive);
    out['8 補救後'] = { '資產／全桌平均': dist(ok.map(r => +r.worthRatio.toFixed(2))), '之後又破產%': wilson(ok.filter(r => r.deadAt).length, ok.length), '補救後存活回合（到破產或遊戲結束）': dist(ok.map(r => (r.deadAt || r.endRound) - r.round)) };
  }
  // 9 策略勝率（混合桌）
  const used = [...new Set(ro.flatMap(x => x.seats))], sw = {}, sn = {}; used.forEach(k => { sw[k] = 0; sn[k] = 0; });
  ro.forEach(x => { x.seats.forEach(k => sn[k]++); sw[x.seats[x.winner]]++; });
  const rate = used.map(k => [k, wilson(sw[k], sn[k])]); out['9 策略勝率%（每坐一次的勝率，[值,下限,上限]）'] = Object.fromEntries(rate);
  const vals = rate.map(([, w]) => w[0]); out['9b 策略差距（最強−最弱，百分點）'] = +(Math.max(...vals) - Math.min(...vals)).toFixed(1);
  // 10 破產回合分布（依主題）
  out['10 第1位破產回合（全部）'] = Object.assign(dist(all.map(x => x.round)), { 中位數CI: medCI(all.map(x => x.round)), '30–35回合%': wilson(all.filter(x => x.round >= 30 && x.round <= 35).length, all.length) });
  out['10b 依主題 中位數[P10,P90]'] = Object.fromEntries(THEMES.map(th => { const a = all.filter(x => x.theme === th).map(x => x.round); return [th, [q(a, 0.5), q(a, 0.1), q(a, 0.9)]]; }));
  // 11 極端翻盤
  const f15 = ro.filter(x => x.L.at15);
  out['11 翻盤'] = { 第15回合領先者最後贏: wilson(f15.filter(x => x.L.at15[0] === x.winner).length, f15.length), '極端翻盤（第15回合最後一名最後贏）': wilson(f15.filter(x => x.L.at15[n - 1] === x.winner).length, f15.length), '全內建電腦桌 第15回合領先者贏': wilson(ca.filter(x => x.L.at15 && x.L.at15[0] === x.winner).length, ca.filter(x => x.L.at15).length) };
  out['錯誤局數'] = all.filter(x => x.err).length; if (out['錯誤局數']) out['錯誤例'] = all.find(x => x.err).err;
  out['_極端案例'] = all.flatMap(x => x.cards.filter(c => c.dead).map(c => `${x.table} n=${n} g=${x.g} ${x.theme} 第${c.round}回合 ${c.eff} 變動 ${Math.round(c.d)}`)).slice(0, 8);
  return out;
}
const res = [];
for (const n of NS) for (const sk of SC) { const t = Date.now(); const o = run(sk, n); o.秒 = Math.round((Date.now() - t) / 1000); res.push(o); console.log(JSON.stringify(o)); console.error(sk, n, o.秒 + 's'); } // 一行一個情境（JSON Lines）
