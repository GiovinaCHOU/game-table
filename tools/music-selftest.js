// 音樂遊戲規則自測：node tools/music-selftest.js [每種設定的隨機局數，預設 400]
// ① 題庫檢查 ② 誰是走音臥底逐條情境 ③ 音樂版你畫我猜逐條情境 ④ 隨機整局（亂按、不合法操作、時間到、電腦／託管）不能出錯、不能卡住、畫面不能洩漏
require('../js/games/common.js'); require('../js/games/music-bank.js'); require('../js/games/music-common.js');
require('../js/games/humspy.js'); require('../js/games/melody.js');
const H = globalThis.GAMES.humspy, ML = globalThis.GAMES.melody, BK = globalThis.MUSIC_BANK;
const GAMES = +process.argv[2] || 400;
let pass = 0; const fails = [];
function ok(c, msg) { if (c) pass++; else { fails.push(msg); if (fails.length < 40) console.log('  ❌', msg); } }
let NOW = 1e12;
const names = (n, bots) => Array.from({ length: n }, (_, i) => (i < (bots || 0) ? '電腦' + (i + 1) : '玩家' + i));

// ---------- ① 題庫 ----------
console.log('① 題庫');
const lab = (s) => s[0] + '|' + s[1];
BK.PAIRS.forEach((p, i) => {
  ok(BK.CATS[p[0]], `配對 ${i} 分類不對`); ok(['n', 'h'].includes(p[1]), `配對 ${i} 難度不對`);
  ok(lab(p[2]) !== lab(p[3]) && p[2][0] !== p[3][0], `配對 ${i} 兩首是同一首`);
  ok(p[2][0] && p[2][1] && p[3][0] && p[3][1] && p[4], `配對 ${i} 缺欄位`);
  if (p[1] === 'h') ok(p[2][1] === p[3][1], `困難配對 ${i} 應該同歌手`); else ok(p[2][1] !== p[3][1], `一般配對 ${i} 應該不同歌手`);
});
const pk = BK.PAIRS.map(p => [lab(p[2]), lab(p[3])].sort().join('~'));
ok(new Set(pk).size === pk.length, '有重複的配對');
ok(new Set(BK.SONGS.map(s => s.t + '|' + s.a)).size === BK.SONGS.length, '歌曲清單有重複');
ok(new Set(BK.SCENES).size === BK.SCENES.length, '情境題有重複');
Object.keys(BK.CATS).forEach(c => ok(BK.PAIRS.some(p => p[0] === c && p[1] === 'n') || BK.PAIRS.some(p => p[0] === c), `分類 ${c} 沒有配對`));

// ---------- ② 誰是走音臥底 ----------
console.log('② 誰是走音臥底');
const HA = (st, s, a) => H.action(st, s, a, { now: NOW });
function hGame(n, o, bots) { NOW = 1e12; return H.init(n, o || {}, names(n, bots), NOW); }
function seeAll(st) { for (let i = 0; i < st.n; i++) HA(st, i, { type: 'seen' }); }
function humAll(st) { let g = 0; while (st.phase === 'hum' && g++ < 100) { NOW = st.humStart + 10; HA(st, st.hummer, { type: 'done' }); } }
function voteFor(st, f) { st.alive.forEach((a, i) => { if (a && st.phase === 'vote') HA(st, i, { type: 'vote', t: f(i) }); }); }
const civOf = (st) => st.alive.map((a, i) => i).filter(i => !st.spies.includes(i));
{
  const st = hGame(5); ok(st.spies.length === 1, '5 人應該 1 位臥底'); ok(hGame(7).spies.length === 2, '7 人應該 2 位臥底');
  ok(st.phase === 'look', '開局是看歌'); seeAll(st); ok(st.phase === 'hum' && st.queue.length === 10, '第一輪哼兩圈');
  ok(JSON.stringify(st.queue.slice(5)) === JSON.stringify(st.queue.slice(0, 5).reverse()), '第二圈順序反過來');
  const v = H.view(st, (st.hummer + 1) % 5); ok(JSON.stringify(v.floor) === JSON.stringify([st.hummer]), '哼歌時發言權只給哼歌的人');
  ok(HA(st, (st.hummer + 1) % 5, { type: 'done' }) === 'silent', '別人不能幫忙按哼完');
  humAll(st); ok(st.phase === 'vote' && H.view(st, 0).floor === null, '哼完進投票、全員可講');
  ok(HA(st, 0, { type: 'vote', t: 0 }) === '不能投自己', '不能投自己');
  const spy = st.spies[0]; voteFor(st, i => i === spy ? (spy + 1) % 5 : spy);
  ok(st.phase === 'guess' && st.guess.seat === spy, '臥底被投出 → 猜歌');
  ok(st.guess.opts.length === 4 && new Set(st.guess.opts.map(lab)).size === 4, '猜歌 4 個不同選項');
  ok(lab(st.guess.opts[st.guess.ans]) === lab(st.pair.civ), '正解是平民的歌'); ok(!st.guess.opts.some(o => lab(o) === lab(st.pair.spy)), '選項不含臥底自己的歌');
  ok(H.view(st, (spy + 1) % 5).guess.opts === null, '別人看不到臥底的選項');
  const wrong = (st.guess.ans + 1) % 4; HA(st, spy, { type: 'guess', i: wrong }); ok(st.phase === 'show', '猜錯 → 公布');
  NOW = st.deadline + 1; H.tick(st, NOW); ok(st.phase === 'end' && st.result.win === 'civ', '臥底抓光 → 平民贏');
  civOf(st).forEach(i => ok(st.scores[i] === 1, '平民各 +1')); ok(st.scores[spy] === 0, '臥底 0 分');
}
{ // 臥底猜對翻盤
  const st = hGame(6); seeAll(st); humAll(st); const spy = st.spies[0];
  voteFor(st, i => i === spy ? (spy + 1) % 6 : spy); HA(st, spy, { type: 'guess', i: st.guess.ans });
  ok(st.phase === 'end' && st.result.win === 'spy' && st.result.why === 'guess' && st.scores[spy] === 3, '臥底猜對 → 臥底贏 +3');
}
{ // 4 人投錯平民 → 剩 3 人臥底贏
  const st = hGame(4); seeAll(st); humAll(st); const spy = st.spies[0], c = civOf(st);
  voteFor(st, i => i === c[0] ? c[1] : c[0]); ok(st.phase === 'show' && st.out === c[0], '平民出局');
  NOW = st.deadline + 1; H.tick(st, NOW); ok(st.phase === 'end' && st.result.win === 'spy' && st.result.why === 'survive', '剩 3 人 → 臥底贏');
}
{ // 投錯平民，人還夠 → 下一輪哼一圈
  const st = hGame(6); seeAll(st); humAll(st); const c = civOf(st);
  voteFor(st, i => i === c[0] ? c[1] : c[0]); NOW = st.deadline + 1; H.tick(st, NOW);
  ok(st.phase === 'hum' && st.cycle === 2 && st.queue.length === 5 && !st.queue.includes(c[0]), '第二輪哼一圈、出局的人不用哼');
  ok(HA(st, c[0], { type: 'report' }) === 'silent', '出局的人不能檢舉');
}
{ // 平票 → 加哼 → 只能投平票的人 → 再平沒人出局
  const st = hGame(6); seeAll(st); humAll(st); const [a, b] = [st.order[0], st.order[1]];
  const rest = [0, 1, 2, 3, 4, 5].filter(i => i !== a && i !== b);
  const tieVote = (i) => (i === a ? b : i === b ? a : rest.indexOf(i) < 2 ? a : b);
  voteFor(st, tieVote);
  ok(st.phase === 'hum' && st.pk && st.queue.length === 2, '平票 → 平票的人加哼');
  humAll(st); ok(st.phase === 'vote' && JSON.stringify(H.view(st, 0).cands) === JSON.stringify(st.pk), '重投只能投平票的人');
  ok(HA(st, rest[0], { type: 'vote', t: rest[1] }) === '這次只能投平票的人', '重投不能投平票以外的人');
  voteFor(st, tieVote);
  ok(st.phase === 'show' && st.out == null && st.alive.every(Boolean), '再平 → 沒人出局');
}
{ // 沒人投票 → 沒人出局；6 輪上限
  const st = hGame(5); seeAll(st); let g = 0;
  while (st.phase !== 'end' && g++ < 200) { humAll(st); if (st.phase === 'vote') { NOW = st.deadline + 1; H.tick(st, NOW); } if (st.phase === 'show') { NOW = st.deadline + 1; H.tick(st, NOW); } }
  ok(st.phase === 'end' && st.result.why === 'cap' && st.cycle === 6, '6 輪都沒抓到 → 臥底贏');
}
{ // 檢舉唱詞：超過一半才扣分，分數不會變負
  const st = hGame(5); seeAll(st); const s = st.hummer; NOW = st.humStart + 10;
  const others = [0, 1, 2, 3, 4].filter(i => i !== s); HA(st, others[0], { type: 'report' }); HA(st, others[1], { type: 'report' });
  HA(st, s, { type: 'done' }); ok(st.scores[s] === 0, '剛好一半不扣分');
  const s2 = st.hummer; NOW = st.humStart + 10; st.scores[s2] = 2; [0, 1, 2, 3, 4].filter(i => i !== s2).slice(0, 3).forEach(i => HA(st, i, { type: 'report' }));
  HA(st, s2, { type: 'done' }); ok(st.scores[s2] === 1, '超過一半扣 1 分');
  const st2 = hGame(5); seeAll(st2); const s3 = st2.hummer; ok(HA(st2, (s3 + 1) % 5, { type: 'report' }) === '他還沒開始哼', '準備時間不能檢舉');
}
{ // 白板模式＋看歌不洩漏
  const st = hGame(5, { mode: 'blank' }); const spy = st.spies[0], civ = civOf(st)[0];
  ok(H.view(st, spy).mySong === null && H.view(st, spy).blankSpy, '白板臥底沒有歌');
  const vc = H.view(st, civ); ok(vc.mySong && !vc.blankSpy && vc.spies === null && vc.pair === null, '平民看不到臥底資訊');
  ok(H.view(st, -1).mySong === null, '觀戰看不到歌');
  const st2 = hGame(5); const sp = st2.spies[0]; ok(lab(H.view(st2, sp).mySong) === lab(st2.pair.spy) && !H.view(st2, sp).blankSpy, '一般模式臥底拿到另一首');
}
{ // 回饋 → 結算列表
  const st = hGame(4, { target: 1 }); seeAll(st); humAll(st); const spy = st.spies[0];
  voteFor(st, i => i === spy ? (spy + 1) % 4 : spy); HA(st, spy, { type: 'guess', i: st.guess.ans });
  HA(st, 0, { type: 'fb', v: 'close' }); HA(st, 1, { type: 'fb', v: 'far' }); HA(st, 2, { type: 'fb', v: 'close' });
  NOW += 4000; HA(st, 0, { type: 'next' }); ok(st.phase === 'over' && st.fb.length === 1 && st.fb[0].close === 2 && st.fb[0].far === 1, '題庫回饋有記錄');
  ok(H.view(st, 0).fb.length === 1, '結算畫面看得到回饋');
}

// ---------- ③ 音樂版你畫我猜 ----------
console.log('③ 音樂版你畫我猜');
const MA = (st, s, a) => ML.action(st, s, a, { now: NOW });
function mGame(n, o, bots) { NOW = 1e12; return ML.init(n, o || {}, names(n, bots), NOW); }
const tune = [[0, 12, 200], [300, 14, 200], [600, 16, 300], [900, 100, 0]];
{
  const st = mGame(4); const c = st.composer, o = [0, 1, 2, 3].filter(i => i !== c);
  ok(st.phase === 'choose' && ML.view(st, c).choices.length === 3 && ML.view(st, o[0]).choices === null, '只有出題者看得到題目');
  ok(MA(st, o[0], { type: 'choose', i: 0 }) === 'silent', '別人不能選題');
  MA(st, c, { type: 'choose', i: 1 }); ok(st.phase === 'compose' && ML.view(st, o[0]).q === null, '編曲中別人看不到題目');
  ok(MA(st, c, { type: 'submit', notes: [] }) === '還沒錄到任何音', '空的不能送');
  MA(st, c, { type: 'submit', notes: tune.concat([[99999, 1, 1], [5, 77, 1]]), inst: 'e' });
  ok(st.phase === 'guess' && st.notes.length === 4 && st.inst === 'e', '送出 → 猜題（壞資料被濾掉）');
  ok(JSON.stringify(ML.view(st, o[0]).floor) === '[]', '猜題時全員靜音');
  const nOpt = st.q.k === 'scene' ? 6 : 4; ok(st.opts.length === nOpt && st.opts[st.ans] === (st.q.k === 'scene' ? st.q.w : BK.label(st.q.s)), '選項數量與正解');
  ok(new Set(st.opts).size === st.opts.length, '選項不重複');
  ok(MA(st, c, { type: 'answer', i: st.ans }) === 'silent', '出題者不能答');
  NOW += 100; MA(st, o[1], { type: 'answer', i: st.ans }); NOW += 100; MA(st, o[0], { type: 'answer', i: st.ans });
  ok(MA(st, o[0], { type: 'answer', i: 0 }) === '你已經答過了', '只能答一次');
  NOW += 100; MA(st, o[2], { type: 'answer', i: (st.ans + 1) % nOpt });
  ok(st.phase === 'reveal', '全部答完 → 公布');
  ok(st.scores[o[1]] === 3 && st.scores[o[0]] === 2 && st.scores[o[2]] === 0 && st.scores[c] === 2, '依先後 +3／+2、答錯 0、出題者每人答對 +1');
}
{ // 放棄、時間到
  const st = mGame(3); const c = st.composer; MA(st, c, { type: 'choose', i: 0 }); MA(st, c, { type: 'skip' });
  ok(st.phase === 'reveal' && st.last.skipped && st.scores.every(x => x === 0), '放棄 → 0 分');
  const st2 = mGame(3); NOW = st2.deadline + 1; ML.tick(st2, NOW); ok(st2.phase === 'compose', '選題時間到自動選');
  NOW = st2.deadline + 1; ML.tick(st2, NOW); ok(st2.phase === 'reveal' && st2.last.skipped, '編曲時間到 → 跳過');
  const st3 = mGame(3); MA(st3, st3.composer, { type: 'choose', i: 0 }); MA(st3, st3.composer, { type: 'submit', notes: tune });
  NOW = st3.deadline + 1; ML.tick(st3, NOW); ok(st3.phase === 'reveal' && !st3.last.skipped, '猜題時間到 → 公布');
}
{ // 電腦出隨機旋律、託管跳過
  const st = mGame(3, {}, 3); let g = 0; while (st.phase !== 'guess' && g++ < 5) { const w = ML.auto(st, () => true); if (!w) break; ML.action(st, w.seat, w.a, { now: NOW }); }
  ok(st.phase === 'guess' && st.notes.length > 0, '電腦玩家會出題');
  const st2 = mGame(3); MA(st2, st2.composer, { type: 'choose', i: 0 }); const w = ML.auto(st2, (s) => s === st2.composer);
  ok(w && w.a.type === 'skip', '託管的真人出題直接跳過');
}
{ // 題型
  const s1 = mGame(3, { qtype: 'scene' }); ok(s1.choices.every(c => c.k === 'scene'), '只有情境題');
  for (let k = 0; k < 300; k++) { const sx = mGame(3, { qtype: ['mix', 'song', 'scene'][k % 3], cat: ['tw', 'en', 'all'][k % 3] }); const ls = sx.choices.map(c => c.k === 'song' ? BK.label(c.s) : c.w); if (new Set(ls).size !== 3) { ok(false, '3 個題目有重複：' + ls); break; } }
  const s2 = mGame(3, { qtype: 'song', cat: 'jp' }); ok(s2.choices.every(c => c.k === 'song' && c.s.c === 'jp'), '只有歌曲題、分類正確');
  const s3 = mGame(4, { rounds: 2 }); let g = 0; while (s3.phase !== 'over' && g++ < 100) { MA(s3, s3.composer, { type: 'choose', i: 0 }); MA(s3, s3.composer, { type: 'skip' }); NOW += 3000; MA(s3, 0, { type: 'next' }); }
  ok(s3.phase === 'over' && s3.ti === 8, '每人出題 2 次');
}

// ---------- ④ 隨機整局 ----------
console.log('④ 隨機整局');
const R = (k) => Math.floor(Math.random() * k);
function noLeak(G, st, i) {
  const v = G.view(st, i);
  if (G === H) {
    if (st.phase !== 'end' && st.phase !== 'over') { if (v.spies || v.pair) return 'spies'; if (v.lastVote && st.phase === 'vote') return 'votes'; }
    if (st.phase === 'guess' && i !== st.guess.seat && v.guess.opts) return 'guessopts';
  } else {
    if (i !== st.composer && (v.q || v.choices)) return 'question';
    if (st.phase === 'compose' && v.notes) return 'notes';
  }
  return null;
}
function randomGame(G, n, o, bots, pilot) {
  NOW = 1e12; const st = G.init(n, o, names(n, bots), NOW);
  const isAuto = (s) => s < bots || pilot.includes(s);
  for (let k = 0; k < 4000; k++) {
    if (st.phase === 'over') return { st, k };
    const r = Math.random();
    try {
      if (r < 0.45) { const w = G.auto(st, isAuto); if (w) G.action(st, w.seat, w.a, { now: NOW }); }
      else if (r < 0.8) {
        const s = R(n + 1) - 1, ts = ['seen', 'done', 'report', 'vote', 'guess', 'fb', 'next', 'choose', 'submit', 'skip', 'answer'];
        const t = ts[R(ts.length)];
        G.action(st, s, { type: t, t: R(n + 2) - 1, i: R(8) - 1, v: ['close', 'far', 'x'][R(3)], notes: Math.random() < 0.7 ? tune : [[R(20000), R(120), R(5000)]], inst: 'pem'[R(3)] }, { now: NOW });
      } else { NOW = (st.deadline || NOW) + 1 + R(500); G.tick(st, NOW); if (st.phase === 'end' || st.phase === 'reveal') { NOW += 3500; G.action(st, R(n), { type: 'next' }, { now: NOW }); } }
      NOW += R(800);
    } catch (e) { ok(false, `${G.id} 出錯：${e.stack.split('\n').slice(0, 2).join(' ')}`); return { st, k, err: 1 }; }
    for (let i = -1; i < n; i++) { const l = noLeak(G, st, i); if (l) { ok(false, `${G.id} 畫面洩漏 ${l} 座位 ${i} 階段 ${st.phase}`); return { st, k, err: 1 }; } }
    if (st.scores.some(x => x < 0 || !Number.isFinite(x))) { ok(false, `${G.id} 分數壞掉 ${st.scores}`); return { st, k, err: 1 }; }
  }
  return { st, k: 4000 };
}
const setups = [];
for (const n of [4, 5, 6, 7, 8, 10]) for (const mode of ['near', 'blank']) for (const diff of ['n', 'h', 'mix']) setups.push([H, n, { target: 3, mode, diff, humT: 5, cat: ['all', 'zh', 'jp', 'ost'][n % 4] }]);
for (const n of [3, 4, 6, 10]) for (const qtype of ['mix', 'scene', 'song']) for (const cat of ['all', 'tw', 'en']) setups.push([ML, n, { qtype, cat, rounds: 1 + (n % 2) }]);
let games = 0, over = 0;
for (const [G, n, o] of setups) {
  const per = Math.max(10, Math.round(GAMES / 10));
  for (let g = 0; g < per; g++) {
    const bots = R(n + 1), pilot = Math.random() < 0.3 ? [R(n)] : [];
    const r = randomGame(G, n, o, bots, pilot); games++; if (r.st.phase === 'over') over++;
  }
}
ok(over / games > 0.95, `隨機整局應該幾乎都能打完：${over}/${games}`);
console.log(`隨機整局 ${games} 局，打完 ${over} 局`);
console.log(fails.length ? `\n❌ ${fails.length} 項失敗、${pass} 項通過` : `\n✅ 全部通過（${pass} 項）`);
process.exit(fails.length ? 1 : 0);
