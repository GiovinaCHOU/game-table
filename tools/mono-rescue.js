// 危機補救專項測試：同一個局面、同一位玩家、同一張厄運，強制套用三種補救，配對比較
//   node tools/mono-rescue.js [掃描局數=40000] [人數=5] [起始種子=0] > 結果.jsonl
// 做法：開 D 情境（金額公式＋分級＋危機補救）跑「打到剩一人」的局；第一次出現危機、而且全員都還活著時，存下整個局面。
//   局面一律補齊三個選項：沒有防護罩就先送一張（三個分支都一樣有），已經在負債或沒有地的局面跳過。
//   每個選項各接著跑兩種結局：①打到剩一人（看 5／10 回合後是否還活著）②有人破產就結束（看最終名次、勝率、是不是他破產）
//   每個分支接下來用同一個亂數種子，差異只來自選擇本身。
const M = require('./mono-sim.js'); const R = window.MONO_RULES;
const args = process.argv.slice(2), SCAN = +args[0] || 40000, NP = +args[1] || 5, S0 = +args[2] || 0;
const THEMES = ['ragnarok', 'cyber', 'animal', 'alien', 'buddha', 'magic', 'town', 'gang'], ROUTES = Object.keys(M.STYLE);
const BAL = M.SCEN.CD.bal;

// 跟 mono-sim.js 的 game() 一樣的推進方式；stop(st) 回傳 true 就停下來
function play(st, seats, now, stop) {
  let guard = 0;
  while (st.phase !== 'over' && guard++ < 60000) {
    if (stop && stop(st)) return { now, stopped: true };
    now += 1000;
    if (st.phase === 'quiz') {
      const pd = st.pending; [pd.debtor, pd.cred].forEach(k => R.act(st, k, { type: 'answer', c: Math.random() < 0.5 ? (st.quizKey | 0) : ((st.quizKey + 1) % 4) }, pd.start + Math.random() * 5000));
      if (st.phase === 'quiz') R.act(st, -1, { type: 'quizend' }, st.deadline + 1); continue;
    }
    const S = M.STYLE[seats[st.turn]];
    if (S && st.phase === 'roll') M.smartPre(st, st.turn, S, now);
    const a = S ? M.smartDecide(st, S) : R.autoAct(st); if (!a) break;
    R.act(st, a.seat, a.a, now);
  }
  return { now, stopped: false };
}
const rankOf = (st, s) => st.players.map((p, k) => k).filter(k => k !== s && (st.players[k].alive ? R.worth(st, k) : -1e12 + (st.deadRound || {})[k]) > (st.players[s].alive ? R.worth(st, s) : -1e12)).length + 1;

let found = 0, skipped = { 已負債: 0, 沒有地: 0, 有人已破產: 0, 沒有危機: 0 };
for (let g = S0; g < S0 + SCAN; g++) {
  M.seed(31e6 + g); const theme = THEMES[g % 8], seats = Array.from({ length: NP }, (_, i) => ROUTES[(i + g) % ROUTES.length]);
  const st = R.init(NP, { theme, rounds: 999, cash: 50000, bal: BAL }, 0);
  for (let s = 0; s < NP; s++) R.act(st, s, { type: 'pick', i: s }, 0);
  const r = play(st, seats, 0, (x) => x.phase === 'crisis');
  if (!r.stopped) { skipped.沒有危機++; continue; }
  const s = st.turn, p = st.players[s], pd = st.pending;
  if (st.players.some(q => !q.alive)) { skipped.有人已破產++; continue; }
  if (p.debt > 0) { skipped.已負債++; continue; }
  if (!R.mine(st, s).length) { skipped.沒有地++; continue; }
  const gaveShield = !(p.items || []).includes('shield'); if (gaveShield) { if ((p.items || []).length >= 3) p.items.shift(); (p.items = p.items || []).push('shield'); }
  pd.opts = ['sell', 'shield', 'debt', 'auto']; // auto＝對照組：不補救，照原本自動半價變賣
  const snap = JSON.stringify(st), r0 = st.round, before = { cash: p.cash, cost: pd.cost, worth: R.worth(st, s), rank: rankOf(st, s), avg: st.players.reduce((a, q, k) => a + R.worth(st, k), 0) / NP };
  const out = { g, theme, n: NP, seat: s, style: seats[s], round: r0, gaveShield, card: pd.card.eff, before, opt: {} };
  for (const c of ['auto', 'sell', 'shield', 'debt']) {
    const res = {};
    for (const mode of ['last', 'bankrupt']) {
      const x = JSON.parse(snap); x.maxRounds = mode === 'last' ? 999 : 0; M.seed(41e6 + g);
      R.act(x, s, { type: 'crisis', c }, r.now + 1);
      const q = x.players[s], al = x.players.map((pp, k) => k).filter(k => x.players[k].alive);
      if (mode === 'last') { res.after = { alive: q.alive, worth: q.alive ? R.worth(x, s) : 0, avg: al.reduce((a, k) => a + R.worth(x, k), 0) / Math.max(1, al.length), lead: Math.max(...al.map(k => R.worth(x, k))) }; }
      let deadAt = q.alive ? null : x.round;
      const pr = play(x, seats, r.now + 2, (y) => { if (deadAt == null && !y.players[s].alive) deadAt = y.round; return false; });
      if (deadAt == null && !x.players[s].alive) deadAt = x.round;
      if (mode === 'last') { res.deadAt = deadAt; res.end = x.round; res.surv5 = deadAt == null || deadAt > r0 + 5; res.surv10 = deadAt == null || deadAt > r0 + 10; res.lastWin = x.winner === s;
        const dl = (x.debtLog || []).filter(d => d.s === s)[0]; res.debt = c === 'debt' ? (dl ? { rounds: dl.to - dl.from, forced: dl.forced } : { rounds: null, forced: null, open: true }) : null; }
      else { res.bWin = x.winner === s; res.bBankrupt = !x.players[s].alive; res.bRank = x.ranks ? x.ranks.findIndex(o => o.s === s) + 1 : null; res.bEnd = x.round; }
    }
    out.opt[c] = res;
  }
  found++; console.log(JSON.stringify(out));
}
console.error(JSON.stringify({ 掃描局數: SCAN, 找到局面: found, 跳過: skipped }));
