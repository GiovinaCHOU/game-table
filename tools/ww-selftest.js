// 狼人殺規則自測：node tools/ww-selftest.js [每種設定的隨機局數，預設 1500]
// ① 逐條情境測試（經典版＋一夜版的每條規則）
// ② 隨機整局：每種人數／板子／選項，亂按（含不合法操作、死人亂按、時間到）＋電腦玩家，檢查不會出錯、不會卡住、規則不變式都成立、畫面不洩漏身分
require('../js/games/ww-rules.js');
const W = globalThis.WW_RULES, C = W.classic, O = W.onenight;
const GAMES = +process.argv[2] || 1500;
let pass = 0, fails = [];
function ok(cond, msg) { if (cond) pass++; else { fails.push(msg); if (fails.length < 40) console.log('  ❌', msg); } }
const clone = (x) => JSON.parse(JSON.stringify(x));

// ---------------- 經典版：工具 ----------------
let NOW = 1e12;
function game(roles, o) {
  NOW = 1e12; const n = roles.length;
  const st = C.init(n, o || {}, [], NOW);
  st.roles = roles.slice();
  return st;
}
const A = (st, s, a) => C.action(st, s, a, { now: NOW });
function timeout(st) { NOW = st.deadline + 1; C.tick(st, NOW); }
function deal(st) { for (let i = 0; i < st.n; i++) A(st, i, { type: 'ready' }); }
const sub = (st) => st.cur.k === 'night' ? st.cur.subs[st.cur.si] : null;
const who = (st, r) => st.roles.indexOf(r);
// 晚上：依序處理守衛／狼人／女巫／預言家；plan = { guard, kill（狼人共同目標，-1 空刀）, witch: 'save'|['poison',t]|'pass', check }
function night(st, plan) {
  if (st.cur.k !== 'night') throw new Error('不是晚上：' + st.cur.k);
  const no = st.nightNo;
  while (st.cur.k === 'night' && st.nightNo === no) {
    const s = sub(st);
    if (s === 'guard' && plan.guard !== undefined && st.alive[who(st, 'guard')]) A(st, who(st, 'guard'), { type: 'guard', t: plan.guard });
    if (s === 'wolf' && plan.kill !== undefined) { st.roles.forEach((r, i) => { if (C.isWolf(r) && st.alive[i]) A(st, i, { type: 'wpick', t: plan.kill }); }); if (sub(st) !== 'wolf') continue; }
    if (s === 'witch' && plan.witch && st.alive[who(st, 'witch')]) { const w = plan.witch; A(st, who(st, 'witch'), Array.isArray(w) ? { type: 'witch', use: w[0], t: w[1] } : { type: 'witch', use: w }); }
    if (s === 'seer' && plan.check !== undefined && st.alive[who(st, 'seer')]) A(st, who(st, 'seer'), { type: 'check', t: plan.check });
    timeout(st);
  }
}
// 一路按「時間到」直到某個階段（遇到發言就讓發言者講完）
function until(st, k, max) { for (let i = 0; i < (max || 200) && st.cur.k !== k && st.cur.k !== 'over'; i++) { if (['speech', 'espeech', 'epk', 'pkspeech', 'lw'].includes(st.cur.k)) A(st, st.cur.order[st.cur.i], { type: 'end' }); else timeout(st); } return st.cur.k === k; }
function voteAll(st, f) { st.cur.voters.forEach(v => A(st, v, { type: 'vote', t: f(v) })); }
const dawn = (st) => until(st, 'announce');
const lastLog = (st, n) => st.log.slice(-(n || 6)).map(x => x.text).join('｜');

// 6 人預女：0,1 狼 2,3 民 4 預 5 女
const SIX_W = ['wolf', 'wolf', 'villager', 'villager', 'seer', 'witch'];
const SIX_H = ['wolf', 'wolf', 'villager', 'villager', 'seer', 'hunter'];
const SIX_G = ['wolf', 'wolf', 'villager', 'villager', 'seer', 'guard'];
const R9 = ['wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter'];
const R12 = { wh: ['wolf', 'wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter', 'idiot'],
  kg: ['wolfking', 'wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter', 'guard'],
  wk: ['whitewolf', 'wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter', 'knight'] };

function scenarios() {
  console.log('== 經典版情境');
  { // 女巫同一晚不能用兩瓶藥；第一晚可以自救
    const st = game(SIX_W, { six: 'witch' }); deal(st);
    night(st, { kill: 5 }); // 狼刀女巫，女巫還沒行動 → 前面 night 會把整晚跑完，所以重新來
    const s2 = game(SIX_W, { six: 'witch' }); deal(s2);
    while (sub(s2) !== 'witch') { if (sub(s2) === 'wolf') { A(s2, 0, { type: 'wpick', t: 5 }); A(s2, 1, { type: 'wpick', t: 5 }); } else timeout(s2); }
    ok(A(s2, 5, { type: 'witch', use: 'save' }) == null, '女巫第一晚可以救自己');
    ok(typeof A(s2, 5, { type: 'witch', use: 'poison', t: 0 }) === 'string', '女巫同一晚不能再用毒藥');
    ok(s2.poison === true, '女巫被擋下的毒藥沒有用掉');
    timeout(s2); while (s2.cur.k === 'night') timeout(s2);
    ok(s2.alive[5], '女巫自救成功');
  }
  { // 第二晚起不能自救
    const st = game(SIX_W, { six: 'witch' }); deal(st);
    night(st, { kill: -1, witch: 'pass' }); until(st, 'night');
    while (sub(st) !== 'witch') { if (sub(st) === 'wolf') { A(st, 0, { type: 'wpick', t: 5 }); A(st, 1, { type: 'wpick', t: 5 }); } else timeout(st); }
    ok(typeof A(st, 5, { type: 'witch', use: 'save' }) === 'string', '女巫第二晚不能救自己');
  }
  { // 解藥用掉後不再知道刀口
    const st = game(SIX_W, { six: 'witch' }); deal(st);
    night(st, { kill: 2, witch: 'save' }); ok(st.alive[2], '女巫救人成功'); until(st, 'night');
    while (sub(st) !== 'witch') { if (sub(st) === 'wolf') { A(st, 0, { type: 'wpick', t: 3 }); A(st, 1, { type: 'wpick', t: 3 }); } else timeout(st); }
    ok(C.view(st, 5).me.kill === null, '解藥用掉後，女巫畫面看不到刀口');
    ok(C.view(st, 0).me.kill === undefined && C.view(st, 2).me.kill === undefined, '只有女巫看得到刀口資訊');
  }
  { // 獵人被毒不能開槍；被刀可以
    const st = game(SIX_W.map((r, i) => i === 3 ? 'hunter' : r), { six: 'witch' }); deal(st);
    night(st, { kill: -1, witch: ['poison', 3] });
    until(st, 'skill'); ok(st.cur.k === 'skill' && st.cur.s === 3 && !st.cur.can, '獵人被毒：有技能時段但不能開槍');
    ok(typeof A(st, 3, { type: 'shoot', t: 0 }) === 'string', '獵人被毒開槍被擋下');
    const s2 = game(SIX_H, { six: 'hunter' }); deal(s2);
    night(s2, { kill: 5 }); until(s2, 'skill');
    ok(s2.cur.can === true, '獵人被狼刀可以開槍');
    ok(A(s2, 5, { type: 'shoot', t: 0 }) == null && !s2.alive[0], '獵人開槍帶走 1 號');
    // 非獵人死亡也有一樣的技能時段（不洩漏身分）
    const s3 = game(SIX_H, { six: 'hunter' }); deal(s3); night(s3, { kill: 2 }); until(s3, 'skill');
    ok(s3.cur.k === 'skill' && s3.cur.s === 2 && !s3.cur.can && s3.deadline - NOW === C.T.skill, '平民死亡也有同樣長度的技能時段');
  }
  { // 狼王：被毒不能開槍、被放逐可以
    const st = game(R12.kg, { b12: 'kg' }); deal(st);
    night(st, { kill: -1, guard: -1, witch: ['poison', 0] }); until(st, 'skill');
    ok(st.cur.s === 0 && !st.cur.can, '狼王被毒不能開槍');
    const s2 = game(R12.kg, { b12: 'kg' }); deal(s2); night(s2, { kill: -1, guard: -1, witch: 'pass' });
    until(s2, 'vote'); voteAll(s2, v => v === 0 ? 4 : 0); until(s2, 'skill');
    ok(s2.cur.s === 0 && s2.cur.can, '狼王被放逐可以開槍');
  }
  { // 白痴翻牌：不能投票、不能被投；勝負當作出局
    const st = game(R12.wh, { b12: 'wh' }); deal(st);
    night(st, { kill: -1, witch: 'pass' }); until(st, 'vote');
    voteAll(st, v => v === 11 ? 0 : 11);
    ok(st.alive[11] && st.idiotUp.includes(11), '白痴被放逐翻牌留場');
    until(st, 'night'); night(st, { kill: -1, witch: 'pass' }); until(st, 'vote');
    ok(!st.cur.voters.includes(11) && !st.cur.cands.includes(11), '白痴翻牌後不能投票也不能被投');
    ok(typeof A(st, 11, { type: 'vote', t: 0 }) === 'string', '白痴投票被擋下');
    ok(typeof A(st, 0, { type: 'vote', t: 11 }) === 'string', '投白痴被擋下');
  }
  { // PK 再平票 → 沒人出局；投票不能投自己
    const st = game(SIX_W, { six: 'witch' }); deal(st); night(st, { kill: -1, witch: 'pass' }); until(st, 'vote');
    ok(typeof A(st, 2, { type: 'vote', t: 2 }) === 'string', '不能投自己');
    // 2、3 各 3 票平手
    voteAll(st, v => [0, 1, 2].includes(v) ? 3 : 2);
    ok(st.cur.k === 'pkspeech' && JSON.stringify(st.cur.order) === '[2,3]', 'PK 由平票的 3、4 號發言');
    until(st, 'vote'); ok(st.cur.round === 2 && !st.cur.voters.includes(2) && !st.cur.voters.includes(3), 'PK 投票：平票的人不能投');
    voteAll(st, v => [0, 1].includes(v) ? 2 : 3);
    ok(st.alive.every(x => x) && /今天沒有人出局/.test(lastLog(st)), 'PK 再平票沒人出局');
  }
  { // 守衛：不能連守；同守同救會死；守住狼刀
    const st = game(R12.kg, { b12: 'kg' }); deal(st);
    night(st, { guard: 4, kill: 4, witch: 'pass' }); ok(st.alive[4], '守衛守住狼刀');
    until(st, 'night');
    while (sub(st) !== 'guard') timeout(st);
    ok(typeof A(st, 11, { type: 'guard', t: 4 }) === 'string', '不能連續兩晚守同一人');
    const s2 = game(R12.kg, { b12: 'kg' }); deal(s2); night(s2, { guard: 5, kill: 5, witch: 'save' }); dawn(s2);
    ok(!s2.alive[5], '同守同救：這個人死亡');
    const s3 = game(R12.kg, { b12: 'kg' }); deal(s3); night(s3, { guard: 5, kill: -1, witch: ['poison', 5] }); dawn(s3);
    ok(!s3.alive[5], '守衛擋不住毒藥');
    const s4 = game(R12.kg, { b12: 'kg' }); deal(s4); night(s4, { guard: -1, kill: -1, witch: 'pass' }); until(s4, 'night');
    while (sub(s4) !== 'guard') timeout(s4); ok(A(s4, 11, { type: 'guard', t: -1 }) == null, '可以連續兩晚空守');
  }
  { // 狼人：空刀、自刀、意見不同以多數、平手不殺
    const st = game(SIX_W, { six: 'witch' }); deal(st); night(st, { kill: -1, witch: 'pass' }); ok(st.alive.every(x => x), '空刀平安夜');
    const s2 = game(SIX_W, { six: 'witch' }); deal(s2); night(s2, { kill: 1, witch: 'pass' }); ok(!s2.alive[1], '狼人可以自刀');
    const s3 = game(SIX_W, { six: 'witch' }); deal(s3); A(s3, 0, { type: 'wpick', t: 2 }); A(s3, 1, { type: 'wpick', t: 3 });
    ok(sub(s3) === 'wolf', '狼人意見不同不會提早結束'); timeout(s3); while (s3.cur.k === 'night') timeout(s3);
    ok(s3.alive.every(x => x), '狼人平手＝不殺人');
    const s4 = game(R12.wh, { b12: 'wh' }); deal(s4); A(s4, 0, { type: 'wpick', t: 5 }); A(s4, 1, { type: 'wpick', t: 5 }); A(s4, 2, { type: 'wpick', t: 6 }); timeout(s4); while (s4.cur.k === 'night') timeout(s4); dawn(s4);
    ok(!s4.alive[5] && s4.alive[6], '狼人意見不同以多數為準');
    const v = C.view(s4, 2); ok(v.me.wolves.length === 4 && C.view(s4, 4).me.wolves === undefined, '只有狼人看得到狼隊友');
  }
  { // 狼刀在先：同一個天亮雙方同時成立 → 狼贏
    const st = game(SIX_W, { six: 'witch' }); deal(st);
    st.alive[1] = false; st.alive[2] = false; st.alive[4] = false; // 剩 0 狼、3 民、5 女
    night(st, { kill: 3, witch: ['poison', 0] });
    until(st, 'over'); ok(st.winner === 'wolf', '狼刀在先：最後一位平民被刀、最後一隻狼被毒 → 狼贏');
  }
  { // 屠邊：殺光神 → 狼贏；放逐全部狼 → 好人贏
    const st = game(SIX_W, { six: 'witch' }); deal(st); st.alive[4] = false; night(st, { kill: 5, witch: 'pass' });
    until(st, 'over'); ok(st.winner === 'wolf', '神職全滅 → 狼贏');
    const s2 = game(SIX_W, { six: 'witch' }); deal(s2); s2.alive[1] = false; night(s2, { kill: -1, witch: 'pass' }); until(s2, 'vote');
    voteAll(s2, v => v === 0 ? 2 : 0); until(s2, 'over'); ok(s2.winner === 'good', '狼人全部出局 → 好人贏');
    ok(C.view(s2, 3).roles && C.view(s2, 3).roles.length === 6, '結束後所有人看得到全部身分');
  }
  { // 遺言：第一晚死亡有遺言、第二晚起沒有、被放逐有
    const st = game(R9); deal(st); night(st, { kill: 3, witch: 'pass' }); until(st, 'lw');
    ok(st.cur.k === 'lw' && st.cur.order[0] === 3, '第一晚死者有遺言');
    until(st, 'vote'); voteAll(st, v => v === 4 ? 5 : 4); ok(st.cur.k === 'skill', '放逐後有技能時段');
    until(st, 'lw'); ok(st.cur.order[0] === 4, '被放逐的人有遺言');
    until(st, 'night'); night(st, { kill: 5, witch: 'pass' });
    let sawLw = false; for (let i = 0; i < 20 && st.cur.k !== 'speech' && st.cur.k !== 'over'; i++) { if (st.cur.k === 'lw') sawLw = true; timeout(st); }
    ok(!sawLw, '第二晚死者沒有遺言');
  }
  { // 自爆：直接天黑、不能在投票時自爆；白狼王帶人
    const st = game(R12.wk, { b12: 'wk' }); deal(st); night(st, { kill: -1, witch: 'pass' });
    until(st, 'signup'); ok(st.cur.k === 'signup', '9 人以上第一天有警長競選');
    ok(typeof A(st, 4, { type: 'explode' }) === 'string', '好人不能自爆');
    A(st, 0, { type: 'explode', t: 8 });
    ok(!st.alive[0] && !st.alive[8] && st.badgeLost, '白狼王警上自爆帶走 9 號，警徽流失');
    until(st, 'night', 30); ok(st.cur.k === 'night', '自爆後直接天黑');
    night(st, { kill: -1, witch: 'pass' }); until(st, 'vote'); ok(typeof A(st, 1, { type: 'explode' }) === 'string', '投票中不能自爆');
  }
  { // 騎士決鬥
    const st = game(R12.wk, { b12: 'wk' }); deal(st); night(st, { kill: -1, witch: 'pass' }); until(st, 'signup'); timeout(st);
    until(st, 'speech'); while (st.cur.order[st.cur.i] !== 11) A(st, st.cur.order[st.cur.i], { type: 'end' });
    ok(A(st, 11, { type: 'duel', t: 1 }) == null && !st.alive[1], '騎士決鬥到狼人：狼人死亡');
    until(st, 'night', 30); ok(st.cur.k === 'night', '決鬥到狼人後直接天黑');
    const s2 = game(R12.wk, { b12: 'wk' }); deal(s2); night(s2, { kill: -1, witch: 'pass' }); until(s2, 'signup'); timeout(s2); until(s2, 'speech');
    while (s2.cur.order[s2.cur.i] !== 11) A(s2, s2.cur.order[s2.cur.i], { type: 'end' });
    const idx = s2.cur.order.indexOf(11), nextSpk = s2.cur.order[idx + 1];
    A(s2, 11, { type: 'duel', t: 4 });
    ok(!s2.alive[11] && s2.alive[4], '騎士決鬥到好人：騎士死亡');
    if (nextSpk == null) { until(s2, 'vote', 10); ok(s2.cur.k === 'vote', '騎士是最後一位發言者：死後直接進入投票'); }
    else { until(s2, 'speech', 10); ok(s2.cur.k === 'speech' && s2.cur.order[s2.cur.i] === nextSpk, '騎士死後由下一位繼續發言'); }
    ok(typeof A(s2, 4, { type: 'duel', t: 0 }) === 'string', '非騎士不能決鬥');
  }
  { // 警長：1.5 票、移交、撕警徽、競選時昨晚死者也能參加
    const st = game(R12.wh, { b12: 'wh' }); deal(st); night(st, { kill: 4, witch: 'pass' });
    until(st, 'signup'); A(st, 4, { type: 'run' }); A(st, 5, { type: 'run' }); timeout(st);
    ok(st.cur.k === 'espeech', '兩人上警進入競選發言');
    until(st, 'evote'); ok(!st.cur.voters.includes(4) && !st.cur.voters.includes(5), '上警的人不能投票');
    voteAll(st, v => v < 8 ? 4 : 5); ok(st.sheriff === 4, '昨晚的死者也能當選警長');
    until(st, 'badge'); ok(st.cur.k === 'badge' && st.cur.s === 4, '警長死亡要移交警徽');
    ok(typeof A(st, 4, { type: 'badge', t: 4 }) === 'string', '警徽不能交給自己');
    A(st, 4, { type: 'badge', t: 6 }); ok(st.sheriff === 6, '警徽移交給 7 號');
    until(st, 'order'); ok(st.cur.k === 'order', '警長決定發言方向'); A(st, 6, { type: 'dir', d: -1 });
    ok(st.cur.k === 'speech' && st.cur.order[0] === 5 && st.cur.order[st.cur.order.length - 1] === 6, '從警長右手邊（號碼小）開始、警長最後發言');
    until(st, 'vote');
    // 警長 1.5 票：6 號（警長）+ 0 投 2；其他 2 人投 3 → 2.5 vs 2
    st.cur.voters.forEach(v => A(st, v, { type: 'vote', t: [6, 0].includes(v) ? 2 : [1, 5].includes(v) ? 3 : -1 }));
    ok(!st.alive[2] || st.idiotUp.includes(2), '警長 1.5 票決定放逐');
    const s2 = game(R12.wh, { b12: 'wh' }); deal(s2); night(s2, { kill: 4, witch: 'pass' }); until(s2, 'signup'); A(s2, 4, { type: 'run' }); timeout(s2);
    ok(s2.sheriff === 4, '只有一人上警直接當選'); until(s2, 'badge'); A(s2, 4, { type: 'badge', t: -1 }); ok(s2.sheriff === -1 && s2.badgeLost, '撕警徽');
    const s3 = game(R12.wh, { b12: 'wh' }); deal(s3); night(s3, { kill: -1, witch: 'pass' }); until(s3, 'signup'); timeout(s3);
    ok(s3.badgeLost && s3.cur.k !== 'espeech', '沒人上警：這局沒有警長');
    const s4 = game(SIX_W, { six: 'witch' }); deal(s4); night(s4, { kill: -1, witch: 'pass' }); ok(s4.cur.k !== 'signup', '6 人局沒有警長');
  }
  { // 死人不能行動
    const st = game(SIX_W, { six: 'witch' }); deal(st); night(st, { kill: 2, witch: 'pass' }); until(st, 'vote');
    const before = JSON.stringify(st); ok(typeof A(st, 2, { type: 'vote', t: 0 }) === 'string' && JSON.stringify(st) === before, '死人不能投票');
    until(st, 'night'); const b2 = JSON.stringify(st.cur); A(st, 2, { type: 'wpick', t: 3 }); ok(JSON.stringify(st.cur) === b2, '死人晚上不能行動');
  }
  { // 託管：真人託管不投票、狼人跟隊友
    const st = game(SIX_W, { six: 'witch' }); deal(st);
    A(st, 0, { type: 'wpick', t: 3 });
    const w = C.auto(st, (s) => s === 1); ok(w && w.seat === 1 && w.a.t === 3, '託管的狼人跟隨隊友的選擇');
    night(st, { witch: 'pass' }); until(st, 'vote');
    const v = C.auto(st, (s) => s === 2); ok(v && v.a.type === 'vote' && v.a.t === -1, '託管的真人棄票');
  }
  { // 發言權
    const st = game(SIX_W, { six: 'witch' }); deal(st);
    ok(JSON.stringify(C.view(st, 0).floor) === '[]', '晚上全場靜音');
    night(st, { kill: -1, witch: 'pass' }); until(st, 'speech');
    ok(JSON.stringify(C.view(st, 0).floor) === JSON.stringify([st.cur.order[st.cur.i]]), '白天只有發言者能說話');
  }
  { // 人數與板子
    ok(JSON.stringify(C.COUNTS) === '[6,9,10,12]', '經典版只支援 6、9、10、12 人');
    [[6, { six: 'guard' }, 'wolf,wolf,villager,villager,seer,guard'], [9, {}, 'wolf,wolf,wolf,villager,villager,villager,seer,witch,hunter'], [10, {}, 'wolf,wolf,wolf,villager,villager,villager,villager,seer,witch,hunter']].forEach(([n, o, exp]) => ok(C.board(n, o).roles.join() === exp, `${n} 人板子配置正確`));
    ok(C.board(7, {}) === null && C.board(11, {}) === null, '7、11 人不能開');
    ok(C.board(12, { b12: 'wk' }).roles.includes('knight') && C.board(12, { b12: 'kg' }).roles.includes('wolfking'), '12 人進階板子');
  }

  console.log('== 一夜版情境');
  const og = (orig, o) => { const n = orig.length - 3; const st = O.init(n, o || {}, [], 1e12); st.orig = orig.slice(); st.cards = orig.slice(); st.steps = O.STEPS.filter(r => orig.includes(r)); st.deckList = orig.slice(); st.info = Array.from({ length: n }, () => []); return st; };
  let T0 = 1e12; const OA = (st, s, a) => O.action(st, s, a, { now: T0 });
  const ot = (st) => { T0 = st.deadline + 1; O.tick(st, T0); };
  const toStep = (st, r) => { if (st.cur.k === 'deal') for (let i = 0; i < st.n; i++) OA(st, i, { type: 'ready' }); while (st.cur.k === 'night' && st.steps[st.cur.si] !== r) ot(st); };
  const toVote = (st) => { while (st.cur.k !== 'vote') ot(st); };
  { // 換牌組合：強盜 → 搗蛋鬼 → 酒鬼 → 失眠者
    // 玩家 0 狼 1 強盜 2 搗蛋 3 預言家 4 失眠；中間：酒鬼? 不，中間放 狼、村、村
    const st = og(['werewolf', 'robber', 'troublemaker', 'seer', 'insomniac', 'werewolf', 'villager', 'villager']);
    toStep(st, 'seer'); OA(st, 3, { type: 'see', p: 1 }); ok(/強盜/.test(st.info[3].join()), '預言家看到換牌前的牌');
    toStep(st, 'robber'); OA(st, 1, { type: 'rob', p: 0 }); ok(st.cards[1] === 'werewolf' && st.cards[0] === 'robber' && /狼人/.test(st.info[1].join()), '強盜換到狼並看到');
    toStep(st, 'troublemaker'); OA(st, 2, { type: 'tm', a: 1, b: 4 }); ok(st.cards[4] === 'werewolf' && st.cards[1] === 'insomniac', '搗蛋鬼交換兩人');
    ok(typeof OA(st, 2, { type: 'tm', a: 0, b: 3 }) === 'string', '搗蛋鬼只能換一次');
    toStep(st, 'insomniac'); ok(/狼人/.test(st.info[4].join()), '失眠者看到自己最後變成狼人');
    toVote(st);
    // 投 4 號（現在是狼）
    [0, 1, 2, 3].forEach(s => OA(st, s, { type: 'vote', t: 4 })); OA(st, 4, { type: 'vote', t: 0 });
    const R = st.result; ok(R.dead.join() === '4' && R.win[1] && !R.win[4] && R.win[0], '投出最後是狼的人 → 好人贏（原本的狼現在是強盜，也算好人）');
  }
  { // 酒鬼＋失眠者；酒鬼不動時系統強制換
    const st = og(['werewolf', 'drunk', 'insomniac', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager']);
    toStep(st, 'drunk'); ot(st); ok(st.cards[1] !== 'drunk' && st.acts.some(a => a.r === 'drunk' && a.auto), '酒鬼沒選時間到也會被強制換');
    const s2 = og(['werewolf', 'drunk', 'insomniac', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager']);
    toStep(s2, 'drunk'); OA(s2, 1, { type: 'drunk', c: 2 }); ok(s2.cards[1] === 'villager' && s2.cards[7] === 'drunk' && !/村民/.test(s2.info[1].join()), '酒鬼換牌但看不到');
  }
  { // 單狼偷看；雙狼不能偷看
    const st = og(['werewolf', 'seer', 'villager', 'werewolf', 'robber', 'troublemaker']); toStep(st, 'werewolf');
    ok(OA(st, 0, { type: 'peek', c: 1 }) == null && /強盜/.test(st.info[0].join()), '單狼可以偷看中間一張');
    const s2 = og(['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager']); toStep(s2, 'werewolf');
    ok(typeof OA(s2, 0, { type: 'peek', c: 0 }) === 'string', '雙狼不能偷看');
  }
  // 勝負表
  const res = (orig, votes) => { const st = og(orig); while (st.cur.k !== 'vote') { if (st.cur.k === 'deal') for (let i = 0; i < st.n; i++) OA(st, i, { type: 'ready' }); else ot(st); } st.cards = orig.slice(); votes.forEach((t, s) => OA(st, s, { type: 'vote', t })); if (st.cur.k !== 'over') ot(st); return st.result; };
  { const base = ['werewolf', 'villager', 'seer', 'robber', 'werewolf', 'troublemaker'];
    let r = res(base, [1, 0, 0, 0]); ok(r.dead.join() === '0' && r.win[1] && !r.win[0], '投中狼 → 好人贏');
    r = res(base, [1, 2, 1, 1]); ok(r.dead.join() === '1' && r.win[0] && !r.win[2], '沒投中狼 → 狼贏');
    r = res(base, [1, 2, 3, 0]); ok(r.dead.length === 0 && r.win[0] && !r.win[1], '每人都只有 1 票 → 沒人出局，有狼在場 → 狼贏');
    r = res(['werewolf', 'villager', 'seer', 'villager', 'robber', 'werewolf', 'troublemaker'], [1, 0, 1, 0]); ok(r.dead.join() === '0,1' && r.win[1] && !r.win[0], '平票全部出局（含狼）→ 好人贏');
    const nw = ['villager', 'seer', 'robber', 'werewolf', 'werewolf', 'troublemaker'];
    r = res(nw, [1, 2, 0]); ok(r.dead.length === 0 && r.win.every(x => x), '玩家沒有狼、沒人出局 → 好人贏');
    r = res(nw, [1, 0, 0]); ok(r.dead.join() === '0' && r.win.every(x => !x), '玩家沒有狼、有人出局 → 好人輸');
    const tn = ['werewolf', 'tanner', 'seer', 'villager', 'robber', 'troublemaker', 'werewolf'];
    r = res(tn, [1, 0, 1, 1]); ok(r.dead.join() === '1' && r.win[1] && !r.win[0] && !r.win[2], '皮匠出局：皮匠贏，狼和好人都不算贏');
    r = res(tn, [1, 0, 0, 1]); ok(r.dead.join() === '0,1' && r.win[1] && r.win[2] && !r.win[0], '皮匠和狼都出局：皮匠和好人都贏');
    const hu = ['hunter', 'werewolf', 'seer', 'villager', 'robber', 'troublemaker', 'villager'];
    r = res(hu, [1, 0, 0, 0]); ok(r.dead.join() === '0,1' && r.win[0], '獵人出局，他投的人也一起出局');
    const mi = ['minion', 'werewolf', 'seer', 'villager', 'werewolf', 'robber', 'troublemaker'];
    r = res(mi, [1, 0, 0, 0]); ok(r.dead.join() === '0' && r.win[0] && r.win[1] && !r.win[2], '爪牙被投出、狼沒被投 → 狼隊（含爪牙）贏');
    const mn = ['minion', 'villager', 'seer', 'werewolf', 'werewolf', 'robber'];
    r = res(mn, [1, 0, 1]); ok(r.dead.join() === '1' && r.win[0] && !r.win[1], '玩家沒有狼：別人出局 → 爪牙贏');
    r = res(mn, [1, 0, 0]); ok(r.dead.join() === '0' && !r.win[0] && r.win[1], '玩家沒有狼：爪牙出局 → 好人贏');
  }
  { // 中間的角色照樣呼叫、每段時間相同
    const st = og(['werewolf', 'villager', 'villager', 'seer', 'robber', 'werewolf']); for (let i = 0; i < 3; i++) OA(st, i, { type: 'ready' });
    const lens = []; while (st.cur.k === 'night') { const d0 = st.deadline; lens.push(st.steps[st.cur.si]); ot(st); }
    ok(lens.join() === 'werewolf,seer,robber', '預言家、強盜在中間也照樣呼叫');
    ok(O.view(st, 1).cards === undefined && O.view(st, 1).orig === undefined, '一夜版遊戲中看不到別人的牌');
  }
  { // 牌數
    for (let n = 3; n <= 6; n++) { const d = O.deck(n, { minion: 1, hunter: 1, tanner: 1 }); ok(d.deck.length === n + 3, `一夜版 ${n} 人牌數＝${n + 3}`); }
    ok(O.deck(3, { minion: 1, hunter: 1, tanner: 1 }).dropped.join() === 'hunter,tanner', '3 人放不下的角色會列出來');
  }
}

// ---------------- 隨機整局 ----------------
function viewLeak(st, mode) {
  for (let s = -1; s < st.n; s++) {
    const v = (mode === 'classic' ? C : O).view(st, s); const j = JSON.stringify(v);
    if (st.cur.k === 'over') continue;
    if (mode === 'classic') {
      if (v.roles || v.nights) return '遊戲中看得到全部身分';
      if (s >= 0 && v.me.wolves && !C.isWolf(st.roles[s])) return '非狼人看到狼隊友';
      if (s >= 0 && v.me.checks && st.roles[s] !== 'seer') return '非預言家看到查驗';
      if (s >= 0 && v.me.kill !== undefined && st.roles[s] !== 'witch') return '非女巫看到刀口';
      if (s >= 0 && v.me.wp && !C.isWolf(st.roles[s])) return '非狼人看到狼人選擇';
      if (s < 0 && v.me) return '觀戰看到私人資訊';
    } else {
      if (v.cards || v.orig || v.acts) return '遊戲中看得到牌';
      if (s >= 0 && JSON.stringify(v.me.info) !== JSON.stringify(st.info[s])) return '私人資訊不對';
    }
    if (j.length > 60000) return '畫面資料太大';
  }
  return null;
}
function randGame(mode, n, o, seed, allBot) {
  let s0 = seed >>> 0; const R = (k) => { s0 = (Math.imul(s0, 1103515245) + 12345) >>> 0; return s0 % k; };
  const M = mode === 'classic' ? C : O;
  let now = 1e12; const names = Array.from({ length: n }, (_, i) => allBot || R(2) ? '電腦' + (i + 1) : '玩家' + i);
  const st = M.init(n, o, names, now);
  let steps = 0, nightsPrev = 0;
  while (st.cur.k !== 'over') {
    if (++steps > 6000) return '卡住（超過 6000 步）：' + st.cur.k;
    const r = R(10);
    try {
      if (r < 4) { // 電腦玩家
        const w = M.auto(st, (s) => !!(st.bots && st.bots[s]) || R(4) === 0);
        if (w) { const e = M.action(st, w.seat, w.a, { now }); if (e && e !== 'silent') return `電腦的動作被拒絕：${JSON.stringify(w)} → ${e}（${st.cur.k}）`; }
        else { now = (st.deadline || now) + 1; M.tick(st, now); }
      } else if (r < 8) { // 亂按（含不合法）
        const s = R(n + 1) - 1, t = R(n + 2) - 2;
        const types = mode === 'classic' ? ['ready', 'wpick', 'guard', 'witch', 'check', 'run', 'end', 'withdraw', 'duel', 'vote', 'dir', 'badge', 'shoot', 'skip', 'explode', 'again'] : ['ready', 'peek', 'see', 'rob', 'tm', 'drunk', 'skip', 'early', 'vote', 'again'];
        const a = { type: types[R(types.length)], t, use: ['save', 'poison', 'pass', 'x'][R(4)], d: R(2) ? 1 : -1, p: R(n + 1) - 1, c: R(2) ? R(4) - 1 : [R(3), R(3)], a: R(n), b: R(n) };
        const deadBefore = mode === 'classic' && s >= 0 && !st.alive[s] && !['badge', 'skill', 'lw', 'over', 'deal'].includes(st.cur.k);
        const snap = deadBefore ? JSON.stringify(st) : null;
        M.action(st, s, a, { now: now += 50 });
        if (deadBefore && a.type !== 'again' && JSON.stringify(st) !== snap) return `出局的 ${s + 1} 號在 ${st.cur.k} 改到了局面（${a.type}）`;
      } else { now = Math.max(now, st.deadline || now) + 1; M.tick(st, now); }
    } catch (e) { return '程式錯誤：' + e.stack.split('\n').slice(0, 3).join(' '); }
    if (st.cur.k !== 'over' && !st.deadline) return '沒有倒數時間：' + st.cur.k;
    if (mode === 'classic') {
      if (st.nights.length !== nightsPrev) {
        nightsPrev = st.nights.length; const ns = st.nights; const L = ns[ns.length - 1], P = ns[ns.length - 2];
        if (P && L.guard >= 0 && L.guard === P.guard) return '守衛連守同一人';
        if (L.save && L.poison >= 0) return '女巫同一晚用了兩瓶藥';
        if (ns.filter(x => x.save).length > 1 || ns.filter(x => x.poison >= 0).length > 1) return '藥用了不只一次';
        if (L.save && L.kill === st.roles.indexOf('witch') && L.n > 1) return '女巫第二晚以後自救';
        if (L.kill >= 0 && !L.save && L.guard !== L.kill && !L.dead.includes(L.kill)) return '被刀沒救沒守卻沒死';
        if (L.kill >= 0 && L.save && L.guard === L.kill && !L.dead.includes(L.kill)) return '同守同救沒死';
      }
      if (st.cur.k !== 'over' && st.winner === null && C.winnerOf(st) && !['announce'].includes(st.cur.k)) return '已經分出勝負卻沒結束：' + st.cur.k;
      if (st.sheriff >= 0 && !st.alive[st.sheriff] && !['badge', 'skill', 'lw', 'announce', 'over'].includes(st.cur.k) && !st.q.some(x => x.k === 'badge')) return '警長死了卻沒處理警徽：' + st.cur.k;
    }
    if (R(7) === 0) { const lk = viewLeak(st, mode); if (lk) return lk + '（' + st.cur.k + '）'; }
  }
  if (mode === 'classic') { const w = C.winnerOf(st); if (!st.winner || (w && w !== st.winner && !(w === 'wolf'))) return '勝負不一致'; }
  else { const r = st.result; if (!r || r.win.length !== n) return '沒有結算'; }
  return { steps, winner: mode === 'classic' ? st.winner : (st.result.team || 'none') };
}
function random() {
  console.log(`== 隨機整局（每種設定 ${GAMES} 局）`);
  const cfgs = [];
  [['witch'], ['hunter'], ['guard']].forEach(([x]) => cfgs.push(['classic', 6, { six: x, speakT: 60 }]));
  cfgs.push(['classic', 9, { speakT: 45 }], ['classic', 10, { speakT: 90 }]);
  ['wh', 'wg', 'kg', 'wk'].forEach(b => cfgs.push(['classic', 12, { b12: b }]));
  for (let n = 3; n <= 6; n++) for (let m = 0; m < 8; m++) cfgs.push(['onenight', n, { minion: m & 1, hunter: (m >> 1) & 1, tanner: (m >> 2) & 1, talkT: [3, 5, 8][m % 3] }]);
  for (const [mode, n, o] of cfgs) {
    const wins = {}; let bad = 0, steps = 0;
    for (let g = 0; g < GAMES; g++) {
      const r = randGame(mode, n, o, g * 7919 + n * 31 + 1, g % 3 === 0);
      if (typeof r === 'string') { bad++; ok(false, `${mode} ${n} 人 ${JSON.stringify(o)} 第 ${g} 局：${r}`); } else { pass++; wins[r.winner] = (wins[r.winner] || 0) + 1; steps += r.steps; }
    }
    console.log(`  ${mode === 'classic' ? '經典' : '一夜'} ${n} 人 ${JSON.stringify(o)}：${bad ? '❌ ' + bad + ' 局出錯' : '✓'}  勝負 ${JSON.stringify(wins)}  平均 ${Math.round(steps / Math.max(1, GAMES - bad))} 步`);
  }
}

const t0 = Date.now();
scenarios(); random();
console.log(`\n通過 ${pass} 項，失敗 ${fails.length} 項（${((Date.now() - t0) / 1000).toFixed(1)} 秒）`);
process.exit(fails.length ? 1 : 0);
