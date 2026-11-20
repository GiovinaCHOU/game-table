// 大富翁卡片盤點：每張卡的級別、權重、計算方式、金額範圍、破產風險，加上模擬實測（現行規則、5 人、每主題 N 局）
//   node tools/mono-cards.js [每主題局數=2000] > card-audit.csv
const M = require('./mono-sim.js'); const R = window.MONO_RULES, TH = window.MONO_THEMES;
const N = +process.argv[2] || 2000, NP = 5;
const PLAIN = ['m', 'up', 'mv', 'go', 'jailfree', 'each', 'immune', 'teleport', 'jail', 'skip', 'house', 'down', 'give', 'pct', 'gonb', 'again'];
const EGG_MONEY = ['gm', 'link', 'war', 'sync', 'bag', 'goblin', 'xlights', 'd20', 'toilet', 'ring', 'shroom'];
const START = 50000;
// 每種效果的靜態說明：[計算方式, 基準, 最低, 最高, 會不會直接破產]
function spec(k, v, deck) {
  const f = (x) => Math.round(x).toLocaleString('en');
  const inf = EGG_MONEY.includes(k);
  switch (k) {
    case 'm': return v >= 0 ? ['固定金額', '—', f(v), f(v), '否'] : ['固定金額', '—', f(v), f(v), '可能（現金＋變賣不夠時）'];
    case 'each': return ['固定金額×對手人數', '人數', f(v), f(v * (NP - 1)) + '（5 人）', '否（付錢的是對手）'];
    case 'give': return ['固定金額×對手人數', '人數', '-' + f(v), '-' + f(v * (NP - 1)) + '（5 人）', '可能'];
    case 'house': return ['固定金額×建築總等級', '建築數', '0', f(v) + '×等級（16 塊全 L4＝×64）', '可能'];
    case 'pct': return ['現金百分比', '現金', '0', v + '% 現金', '否'];
    case 'war': return v > 0 ? ['固定金額×通膨(最多3倍)', '通膨', f(v), f(v * 3), '否'] : ['固定金額，上限現金 35%', '現金', '0', '-' + f(-v) + '（最多現金 35%）', '否'];
    case 'phoenix': return ['現金補回開局金額；不缺錢時固定金額×通膨', '現金', f(v), f(START) + ' 或 ' + f(v * 3), '否'];
    case 'd20': return ['d20：20 點 2 倍、11–19 按比例、2–10 扣固定、1 點扣現金 20%', '現金＋通膨', '-20% 現金', f(v * 2 * 3), '可能（2–10 點的固定扣款，金額小）'];
    case 'psy': return ['從每個對手拿現金 %', '對手現金', '0', v + '%×對手人數', '否'];
    case 'psycho': return ['扣現金 30%＋兩棟降級＋停 2 回合', '現金', '-30% 現金', '-30% 現金', '否'];
    case 'ghost': case 'evo': case 'mandrake': case 'flip': case 'clock': case 'pizza': case 'friend':
      return ['現金百分比' + ({ evo: '＋停 1 回合', mandrake: '＋停 1 回合', flip: '＋停 1 回合', clock: '＋進監獄', friend: '＋停 1 回合' }[k] || ''), '現金', '0', v + '% 現金', '否'];
    case 'horse': return ['最貴的一棟降一級；沒有建築改扣現金 %', '建築／現金', '0', v + '% 現金', '否'];
    case 'sync': return ['固定金額×通膨＋免一次過路費', '通膨', f(v), f(v * 3), '否'];
    default:
      if (inf) return ['固定金額×通膨(最多3倍)', '通膨', f(v), f(v * 3), '否'];
      return ['非金錢效果', '—', '—', '—', ['jail', 'skip', 'cat', 'frog'].includes(k) ? '否（停回合）' : '否'];
  }
}
function tierNow(k) { return PLAIN.includes(k) ? '一般' : '彩蛋'; }
function tierNew(k, v) { // 建議級別（v1 草案）：普通＝小額／移動；稀有＝較大或特殊效果；彩蛋＝有專屬動畫的卡
  if (!PLAIN.includes(k)) return '彩蛋';
  if (k === 'm') return Math.abs(v) <= 5000 ? '普通' : '稀有';
  if (['mv', 'gonb'].includes(k)) return '普通';
  return '稀有';
}
// ===== 模擬實測 =====
const stat = {};
const orig = R.act;
R.act = function (st, s, a, now) {
  const w0 = st.players.map((p, k) => R.worth(st, k)), alive0 = st.players.map(p => p.alive);
  const rank0 = w0.map((w, k) => w0.filter(x => x > w).length);
  const r = orig.call(this, st, s, a, now);
  const evs = st.ev || []; let cur = null;
  const flush = () => { if (!cur) return; const k = cur.s; const w1 = R.worth(st, k);
    // 卡片本身造成的變動＝資產變化扣掉同一批裡的過路費、起點薪水、稅金（移動卡之後踩到的地不算卡片的帳）
    let other = 0; evs.forEach(e => { if (e.t === 'pay' && /過路費|稅金/.test(e.why || '')) { if (e.from === k) other -= e.amt; if (e.to === k) other += e.amt; } if (e.t === 'cash' && e.seat === k && /起點|過路費/.test(e.why || '')) other += e.amt; });
    cur.d = w1 - w0[k] - other;
    const rank1 = st.players.map((p, j) => R.worth(st, j)).filter(x => x > w1).length; cur.rk = rank0[k] - rank1;
    const avg0 = w0.filter((w, j) => alive0[j]).reduce((a, b) => a + b, 0) / Math.max(1, alive0.filter(Boolean).length);
    cur.dead = alive0[k] && !st.players[k].alive && w0[k] >= avg0 * 0.3; cur.straw = alive0[k] && !st.players[k].alive && !cur.dead; // 致死＝原本不算窮（資產 ≥ 全桌平均 30%）卻被這張卡打到破產 cur.lead = rank0[k] === 0; cur.last = rank0[k] === st.players.filter(p => p.alive).length - 1 || rank0[k] === NP - 1;
    cur.ratio = w0[k] > 0 ? cur.d / w0[k] : 0; cur.early = st.round <= 15; (stat[cur.key] = stat[cur.key] || []).push(cur); };
  // 一批事件裡只取第一張卡（連鎖卡的效果併進第一張）
  const ce = evs.find(e => e.t === 'card'); if (ce) { cur = { key: st.theme + '|' + ce.deck + '|' + ce.text, s: ce.seat, round: st.round }; flush(); }
  return r;
};
for (const th of Object.keys(TH)) for (let g = 0; g < N; g++) { M.seed(7e6 + g); M.game(Array(NP).fill('預設'), {}, { theme: th }); }
R.act = orig;
// ===== 輸出 =====
const q = (a, p) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
const f0 = (x) => Math.round(x).toLocaleString('en');
const rows = [['主題', '牌組', '卡片ID', '卡片內容（前 24 字）', '效果代碼', '現行級別', '建議級別', '現行每次抽卡機率', '每千局實際出現', '計算方式', '計算基準', '設定最低', '設定最高', '可能直接破產', '補救機制', '實測資產變動 中位數', 'P10', 'P90', '實測最大損失', '實測最大獲得', '直接致死（原本資產≥全桌平均30%）', '其中前15回合', '壓垮稻草（本來就快破產）', '排名變動 平均（正＝上升）', '落後者抽到 平均變動', '領先者抽到 平均變動', '極端翻盤風險']];
const flags = [];
for (const th of Object.keys(TH)) {
  const T = TH[th];
  ['lucky', 'bad'].forEach(deck => {
    const L = T[deck], eggs = L.filter(c => !PLAIN.includes(c[1].split(':')[0])).length, plain = L.length - eggs;
    const pEgg = eggs ? Math.min(0.3, eggs * 0.12) : 0;
    L.forEach((c, i) => {
      const [k, vs] = c[1].split(':'), v = +vs, isEgg = !PLAIN.includes(k);
      const pr = isEgg ? pEgg / (eggs > 1 ? eggs - 0.5 : 1) * (eggs > 1 ? (eggs - 1) / eggs + 0 : 1) : (1 - pEgg) / plain; // 彩蛋不連續重複，近似值
      const sp = spec(k, v, deck), s = stat[th + '|' + (deck === 'lucky' ? 'luck' : 'bad') + '|' + c[0]] || [];
      const d = s.map(x => x.d), dead = s.filter(x => x.dead), early = dead.filter(x => x.early);
      const lag = s.filter(x => x.last).map(x => x.d), lead = s.filter(x => x.lead).map(x => x.d);
      const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
      const bigUp = s.filter(x => x.ratio > 0.3).length, bigDown = s.filter(x => x.ratio < -0.3).length;
      const risk = dead.length > 0 || bigUp / Math.max(1, s.length) > 0.2 || bigDown / Math.max(1, s.length) > 0.2 || Math.abs(q(d, 0.9)) >= 20000 || Math.abs(q(d, 0.1)) >= 20000 ? '高' : (Math.abs(q(d, 0.9)) >= 8000 || Math.abs(q(d, 0.1)) >= 8000 ? '中' : '低');
      const id = `${th}-${deck === 'lucky' ? 'L' : 'B'}${String(i + 1).padStart(2, '0')}`;
      rows.push([T.name, deck === 'lucky' ? '幸運' : '厄運', id, c[0].slice(0, 24), c[1], tierNow(k), tierNew(k, v), (pr * 100).toFixed(1) + '%', (s.length / N * 1000).toFixed(0),
        sp[0], sp[1], sp[2], sp[3], sp[4], deck === 'bad' ? '🛡 抵擋厄運可擋；付不出自動半價變賣，沒有翻盤問答' : '—',
        f0(q(d, 0.5)), f0(q(d, 0.1)), f0(q(d, 0.9)), f0(Math.min(0, ...d, 0)), f0(Math.max(0, ...d, 0)), dead.length, early.length, s.filter(x => x.straw).length, mean(s.map(x => x.rk)).toFixed(2), f0(mean(lag)), f0(mean(lead)), risk]);
      if (risk === '高') flags.push(`${id} ${T.name} ${c[1]}：P10 ${f0(q(d, 0.1))}／P90 ${f0(q(d, 0.9))}，直接致死 ${dead.length}（前 15 回合 ${early.length}）`);
    });
  });
}
const csv = rows.map(r => r.map(x => /[",\n]/.test(String(x)) ? '"' + String(x).replace(/"/g, '""') + '"' : x).join(',')).join('\n');
require('fs').writeFileSync(process.argv[3] || 'card-audit.csv', '﻿' + csv);
console.error('高風險卡片：\n' + flags.join('\n'));
