// 彩蛋權重測試：A 現行／CC 固定彩蛋權重 5／EN 依人數調整
//   node tools/mono-eggsim.js [每種桌局數=5000] [人數=3,5,6] [情境=CA,CC,EN] > 結果.jsonl
// 每格＝混合打法桌 N 局＋全內建電腦桌 N 局，8 主題輪流，同局號同種子
// 指標：每局彩蛋次數分布（0／1／2／3 以上）、彩蛋落在誰身上（集中度）、拿到彩蛋的人勝率、彩蛋是否改變勝負
const M = require('./mono-sim.js'); const R = window.MONO_RULES;
const args = process.argv.slice(2), N = +args[0] || 5000, NS = (args[1] || '3,5,6').split(',').map(Number), SC = (args[2] || 'CA,CC,EN').split(',');
const THEMES = ['ragnarok', 'cyber', 'animal', 'alien', 'buddha', 'magic', 'town', 'gang'], ROUTES = Object.keys(M.STYLE);
const isEgg = (eff) => R.cardTierOf(eff) === 'egg';

let G = null;
const orig = R.act;
R.act = function (st, s, a, now) {
  if (!G) return orig.call(this, st, s, a, now);
  const w0 = st.players.map((p, k) => R.worth(st, k)), alive0 = st.players.map(p => p.alive), ph0 = st.phase;
  const crisisCard = ph0 === 'crisis' && st.pending ? st.pending.card : null, crisisSeat = st.turn;
  const r = orig.call(this, st, s, a, now), evs = st.ev || [];
  evs.forEach(e => { if (e.t === 'card' && st.eggP != null) G.draws.push([st.eggP, isEgg(e.eff)]); });
  const rank0 = (k) => w0.filter((w, j) => alive0[j] && w > w0[k]).length;
  const rec = (k, deck, eff, ci) => { // 卡片本身的帳（同 mono-cardsim.js）
    let other = 0; evs.forEach((e, idx) => { const ext = idx < ci || /過路費|稅金|起點|落後補助|還債/.test(e.why || '');
      if (e.t === 'pay' && ext && e.why !== '還債') { if (e.from === k) other -= e.amt; if (e.to === k) other += e.amt; }
      if (e.t === 'cash' && e.seat === k && ext) other += e.amt; });
    G.eggs.push({ s: k, deck, d: R.worth(st, k) - w0[k] - other, rank: rank0(k), round: st.round });
  };
  if (crisisCard) { if (isEgg(crisisCard.eff)) rec(crisisSeat, 'bad', crisisCard.eff, 0); }
  else { const ci = evs.findIndex(e => e.t === 'card'); if (ci >= 0 && !evs.some(e => e.t === 'crisis') && isEgg(evs[ci].eff)) rec(evs[ci].seat, evs[ci].deck, evs[ci].eff, ci); }
  return r;
};
function wilson(x, n) { if (!n) return null; const z = 1.96, p = x / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [+(p * 100).toFixed(1), +((c - h) * 100).toFixed(1), +((c + h) * 100).toFixed(1)]; }
const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

function run(sk, n) {
  const sc = M.SCEN[sk], games = [];
  for (const table of ['route', 'casual']) for (let g = 0; g < N; g++) {
    M.seed((table === 'route' ? 21e6 : 22e6) + n * 1e5 + g);
    const seats = table === 'route' ? Array.from({ length: n }, (_, i) => ROUTES[(i + g) % ROUTES.length]) : Array(n).fill('預設');
    G = { eggs: [], draws: [] }; const r = M.game(seats, sc.bal, { theme: THEMES[g % 8] }); const eggs = G.eggs, draws = G.draws; G = null;
    const fin = Array(n).fill(-1); (r.st.ranks || []).forEach(o => fin[o.s] = o.w);
    games.push({ table, winner: r.winner, eggs, fin, err: r.L.err, draws });
  }
  const T = games.length, cnt = games.map(x => x.eggs.length), out = { 情境: sc.name, 人數: n, 局數: T };
  out['每局彩蛋 平均'] = +mean(cnt).toFixed(2);
  out['0 次%'] = wilson(cnt.filter(c => c === 0).length, T); out['1 次%'] = wilson(cnt.filter(c => c === 1).length, T);
  out['2 次%'] = wilson(cnt.filter(c => c === 2).length, T); out['3 次以上%'] = wilson(cnt.filter(c => c >= 3).length, T);
  out['2 次以上%'] = wilson(cnt.filter(c => c >= 2).length, T); out['最多一局'] = Math.max(...cnt);
  out['幸運／厄運彩蛋 每局'] = [+mean(games.map(x => x.eggs.filter(e => e.deck === 'luck').length)).toFixed(2), +mean(games.map(x => x.eggs.filter(e => e.deck === 'bad').length)).toFixed(2)];
  // 落在誰身上
  const per = games.flatMap(x => Array.from({ length: n }, (_, k) => x.eggs.filter(e => e.s === k).length));
  out['每位玩家每局拿到 0／1／2 次以上 %'] = [wilson(per.filter(c => c === 0).length, per.length)[0], wilson(per.filter(c => c === 1).length, per.length)[0], wilson(per.filter(c => c >= 2).length, per.length)[0]];
  const multi = games.filter(x => x.eggs.length >= 2);
  out['有 2 次以上的局：全部落在同一人%'] = wilson(multi.filter(x => new Set(x.eggs.map(e => e.s)).size === 1).length, multi.length);
  out['有 2 次以上的局：拿最多的人占比（平均）'] = +mean(multi.map(x => { const c = {}; x.eggs.forEach(e => c[e.s] = (c[e.s] || 0) + 1); return Math.max(...Object.values(c)) / x.eggs.length; })).toFixed(2);
  const lk = games.flatMap(x => x.eggs.filter(e => e.deck === 'luck'));
  out['幸運彩蛋落在 領先者／中間／最後一名 %'] = [wilson(lk.filter(e => e.rank === 0).length, lk.length)[0], wilson(lk.filter(e => e.rank > 0 && e.rank < n - 1).length, lk.length)[0], wilson(lk.filter(e => e.rank === n - 1).length, lk.length)[0]];
  // 勝率
  const pl = games.flatMap(x => Array.from({ length: n }, (_, k) => ({ win: x.winner === k, luck: x.eggs.some(e => e.s === k && e.deck === 'luck'), bad: x.eggs.some(e => e.s === k && e.deck === 'bad') })));
  const wr = (f) => { const a = pl.filter(f); return wilson(a.filter(p => p.win).length, a.length); };
  out['勝率：拿到幸運彩蛋'] = wr(p => p.luck); out['勝率：沒拿到任何幸運彩蛋'] = wr(p => !p.luck); out['勝率：抽到厄運彩蛋'] = wr(p => p.bad); out['勝率基準'] = +(100 / n).toFixed(1);
  // 彩蛋改變勝負：把每個人的彩蛋淨收支扣掉，第一名會不會換人（一階估計，不含彩蛋之後的連鎖影響）
  const withEgg = games.filter(x => x.eggs.length);
  const flip = withEgg.filter(x => { const adj = x.fin.map((w, k) => w < 0 ? -1e12 : w - x.eggs.filter(e => e.s === k).reduce((a, e) => a + e.d, 0)); return adj.indexOf(Math.max(...adj)) !== x.winner; });
  out['彩蛋改變勝負（占有彩蛋的局）%'] = wilson(flip.length, withEgg.length); out['彩蛋改變勝負（占全部局）%'] = wilson(flip.length, T);
  out['彩蛋淨收支 中位／P10／P90'] = (() => { const a = games.flatMap(x => x.eggs.map(e => e.d)).sort((x, y) => x - y); const q = (p) => a.length ? Math.round(a[Math.min(a.length - 1, Math.floor(p * a.length))]) : 0; return [q(0.5), q(0.1), q(0.9)]; })();
  const dr = games.flatMap(x => x.draws);
  if (dr.length) { const ps = dr.map(d => d[0]).sort((x, y) => x - y), q = (p) => +(ps[Math.min(ps.length - 1, Math.floor(p * ps.length))] * 100).toFixed(1);
    const hi = dr.filter(d => d[0] >= 0.15);
    out['保底：每次抽卡的彩蛋機率 中位／P90／最高 %'] = [q(0.5), q(0.9), +(ps[ps.length - 1] * 100).toFixed(1)];
    out['保底：機率≥15% 的抽卡占比 %'] = +(hi.length / dr.length * 100).toFixed(2);
    out['保底：機率≥15% 時真的出彩蛋 %'] = wilson(hi.filter(d => d[1]).length, hi.length);
    const gapEgg = []; games.forEach(x => { let k = 0; x.draws.forEach(d => { k++; if (d[1]) { gapEgg.push(k); k = 0; } }); });
    const gs = gapEgg.sort((x, y) => x - y), gq = (p) => gs[Math.min(gs.length - 1, Math.floor(p * gs.length))];
    out['保底：兩次彩蛋之間隔幾張卡 P10／中位／P90'] = [gq(0.1), gq(0.5), gq(0.9)]; }
  out.錯誤局數 = games.filter(x => x.err).length;
  return out;
}
for (const n of NS) for (const sk of SC) { const t = Date.now(); const o = run(sk, n); o.秒 = Math.round((Date.now() - t) / 1000); console.log(JSON.stringify(o)); console.error(sk, n, o.秒 + 's'); }
