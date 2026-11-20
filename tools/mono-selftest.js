// 大富翁自我檢查（改到大富翁規則或 🧪 選項後一定要跑）：node tools/mono-selftest.js [每種組合局數=20]
// 1. 正式規則指紋：所有 🧪 關閉時，結果要跟改之前一樣（看 mono-sim.js check 的指紋有沒有變）
// 2. 每個 🧪 選項開了，規則真的有收到（防止選項壞掉、選了沒作用）
// 3. 5 個 🧪 開關的 32 種組合 × 2～6 人 × 8 主題 × 兩種結局，整局跑完：不能出錯、不能卡住、數值不能壞掉
const M = require('./mono-sim.js'); const R = window.MONO_RULES;
const PER = +process.argv[2] || 20;
let fail = 0; const bad = (msg) => { fail++; if (fail <= 30) console.log('❌ ' + msg); };

// ---- 1 指紋 ----
console.log('正式規則指紋', M.fingerprint());

// ---- 2 選項 → 規則開關 ----
global.document = undefined;
const opts = (() => { const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'games', 'monopoly.js'), 'utf8');
  const m = [...src.matchAll(/\{ key: '(b[A-Za-z]+)', label: '([^']+)', test: true, choices: (\[\[.*?\]\]), def: 0 \}/g)]; return m.map(x => ({ key: x[1], label: x[2], choices: eval(x[3]) })); })();
const EXPECT = { bCardAmt: ['cardAmt'], bCardTier: ['cardTier', 'eggByN', 'eggPity'], bRescue: ['rescue'], bDice: ['diceChoice'], bPreview: ['preview'] };
if (!opts.length) bad('找不到 monopoly.js 裡的 🧪 選項');
opts.forEach(o => {
  if (!EXPECT[o.key]) bad(`🧪 選項 ${o.key}（${o.label}）沒有寫在自我檢查的對照表裡`);
  o.choices.forEach(([v]) => {
    const st = R.init(3, { [o.key]: v }, 0), b = st.bal || {};
    const want = +v ? EXPECT[o.key] || [] : [];
    want.forEach(f => { if (!b[f]) bad(`選了 ${o.label}=${v}，規則卻沒有開 ${f}`); });
    if (!+v && Object.keys(b).length) bad(`${o.label} 選關閉，規則卻有開關：${JSON.stringify(b)}`);
  });
});
{ const st = R.init(3, {}, 0); if (st.bal) bad('什麼都沒選，卻有平衡開關：' + JSON.stringify(st.bal)); }
console.log('🧪 選項', opts.map(o => o.label).join('、'));

// ---- 3 全組合對局 ----
const KEYS = Object.keys(EXPECT), THEMES = ['ragnarok', 'cyber', 'animal', 'alien', 'buddha', 'magic', 'town', 'gang'], ROUTES = Object.keys(M.STYLE);
// 合法階段：直接從 mono-rules.js 裡所有 st.phase = '…' 讀出來（新增階段不用改這裡）
const RSRC = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'games', 'mono-rules.js'), 'utf8');
const PHASES = new Set(['pick', 'dicepick', ...[...RSRC.matchAll(/phase = '([a-z]+)'/g)].map(m => m[1])]);
const orig = R.act; let cur = null;
R.act = function (st, s, a, now) {
  const r = orig.call(this, st, s, a, now);
  if (cur && !cur.done) {
    const where = `${cur.tag} 第${st.round}回合 動作 ${a && a.type}`;
    if (!PHASES.has(st.phase)) { bad(`${where}：未知階段 ${st.phase}`); cur.done = true; }
    st.players.forEach((p, k) => {
      if (!Number.isFinite(p.cash)) { bad(`${where}：玩家${k} 現金不是數字 ${p.cash}`); cur.done = true; }
      if (p.alive && p.cash < 0 && st.phase !== 'quiz') { bad(`${where}：玩家${k} 還活著但現金是負的 ${p.cash}`); cur.done = true; }
      if (p.debt != null && !(p.debt >= 0)) { bad(`${where}：玩家${k} 負債異常 ${p.debt}`); cur.done = true; }
      if (!p.alive && st.owners.some(o => o === k)) { bad(`${where}：玩家${k} 破產了還有地`); cur.done = true; }
      if (!Number.isFinite(R.worth(st, k))) { bad(`${where}：玩家${k} 總資產不是數字`); cur.done = true; }
    });
    st.levels.forEach((l, i) => { if (l < 0 || l > 4) { bad(`${where}：第${i}格等級 ${l}`); cur.done = true; } if (l > 0 && st.owners[i] < 0) { bad(`${where}：第${i}格沒有地主卻有建築`); cur.done = true; } });
    if (st.phase === 'crisis' && !(st.pending && st.pending.opts && st.pending.opts.length)) { bad(`${where}：危機處理沒有選項`); cur.done = true; }
    if (st.bal && st.bal.preview && st.phase === 'roll') { try { const v1 = R.diceRisk(st, st.turn, true), v2 = R.diceRisk(st, st.turn, false); if (!(v1.pHit >= 0 && v1.pHit <= 1.0001 && v2.pHit >= 0 && v2.pHit <= 1.0001)) bad(`${where}：危險預覽機率異常`); } catch (e) { bad(`${where}：危險預覽出錯 ${e.message}`); } }
  }
  return r;
};
let games = 0, t0 = Date.now(), byCombo = {};
for (let mask = 0; mask < 32; mask++) {
  const o = {}; KEYS.forEach((k, i) => { if (mask & (1 << i)) o[k] = 1; });
  const bal = R.init(3, o, 0).bal || {};
  for (let n = 2; n <= 6; n++) for (let g = 0; g < PER; g++) {
    const theme = THEMES[(g + n + mask) % 8], rounds = g % 3 === 2 ? 999 : g % 3 === 1 ? 24 : 0;
    const seats = g % 2 ? Array(n).fill('預設') : Array.from({ length: n }, (_, i) => ROUTES[(i + g) % 5]);
    M.seed(77e6 + mask * 1000 + n * 100 + g); cur = { tag: `組合${mask}（${Object.keys(o).join('+') || '全關'}）${n}人 ${theme} ${rounds === 999 ? '打到剩一人' : rounds ? rounds + '回合' : '破產即結束'}`, done: false };
    const r = M.game(seats, bal, { theme, rounds }); games++;
    if (r.L.err) bad(`${cur.tag}：${r.L.err}`);
    else if (r.st.phase !== 'over') bad(`${cur.tag}：沒有正常結束（停在 ${r.st.phase}，第 ${r.st.round} 回合）`);
    byCombo[mask] = (byCombo[mask] || 0) + 1;
  }
}
cur = null;
console.log(`全組合對局 ${games} 局（${Math.round((Date.now() - t0) / 1000)} 秒）`);
console.log(fail ? `\n共 ${fail} 個問題` : '\n✅ 全部通過');
process.exit(fail ? 1 : 0);
