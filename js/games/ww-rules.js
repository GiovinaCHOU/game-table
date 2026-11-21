// 狼人殺規則（房主判定；純邏輯、沒有畫面，node 也能載入：tools/ww-selftest.js）
// WW_RULES.classic：經典版（6／9／10／12 人，預女獵白等主流板子）
// WW_RULES.onenight：一夜版（3～6 人）
// 每一局的流程都是「工作佇列」：st.cur 是現在的階段，st.q 是接下來的階段；死亡、自爆、決鬥會把新階段插到佇列前面
(function (root) {
  function rnd(n) {
    if (root.crypto && root.crypto.getRandomValues) { const b = new Uint32Array(1); root.crypto.getRandomValues(b); return Math.floor(b[0] / 4294967296 * n); }
    return Math.floor(Math.random() * n);
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // 電腦玩家用的固定亂數：同一個局面每次算出來都一樣（房主每個 tick 都會問 auto）
  function hsh() { let h = 2166136261; for (let k = 0; k < arguments.length; k++) { h = Math.imul(h ^ ((arguments[k] + 11) >>> 0), 16777619) >>> 0; h ^= h >>> 13; } return h >>> 0; }
  const pick = (arr, h) => arr.length ? arr[h % arr.length] : null;
  const isBot = (st, s) => !!(st.bots && st.bots[s]);

  // ======================================================================
  // 經典版
  // ======================================================================
  const ROLE = {
    wolf: { n: '狼人', t: 'wolf', i: '🐺', d: '每晚和狼隊友一起選一位玩家殺害（可以不殺，也可以殺自己人）。白天發言階段可以「自爆」：亮出狼人身分，當天直接結束、進入黑夜，自爆的人沒有遺言。' },
    wolfking: { n: '狼王', t: 'wolf', i: '😈', d: '狼人的一員：每晚和狼隊友一起殺人、白天可以自爆。死亡時可以開槍帶走一位玩家；被女巫毒死或自爆時不能開槍。' },
    whitewolf: { n: '白狼王', t: 'wolf', i: '🤍', d: '狼人的一員：每晚和狼隊友一起殺人。白天發言階段可以自爆，並同時帶走一位玩家（被帶走的人沒有遺言）。' },
    seer: { n: '預言家', t: 'god', i: '🔮', d: '每晚查驗一位玩家，會看到他是「好人」還是「狼人」（狼王、白狼王也顯示狼人）。' },
    witch: { n: '女巫', t: 'god', i: '🧪', d: '有解藥、毒藥各一瓶，整局各只能用一次，同一晚只能用一瓶。解藥：救活當晚被狼人殺的人（只有第一晚可以救自己）。毒藥：毒死一位玩家。用掉解藥後，之後的晚上就不會再知道狼人殺了誰。' },
    hunter: { n: '獵人', t: 'god', i: '🏹', d: '死亡時可以開槍帶走一位玩家。被女巫毒死時不能開槍。' },
    idiot: { n: '白痴', t: 'god', i: '🃏', d: '白天被投票放逐時會翻牌亮出身分、留在場上，但之後不能投票，也不能再被投票（判斷勝負時當作已出局）。晚上被殺或被毒還是會死。' },
    guard: { n: '守衛', t: 'god', i: '🛡️', d: '每晚守護一位玩家（可以守自己），被守護的人當晚不會被狼人殺死；不能連續兩晚守同一個人。守衛擋不住女巫的毒藥。注意：如果守的人同時被女巫用解藥救，這個人反而會死（同守同救）。' },
    knight: { n: '騎士', t: 'god', i: '⚔️', d: '白天輪到自己發言時，可以翻牌和一位玩家決鬥，整局只能用一次。對方是狼人：狼人死亡，當天直接進入黑夜；對方是好人：騎士死亡，發言繼續。' },
    villager: { n: '平民', t: 'vil', i: '🧑‍🌾', d: '沒有特殊技能，靠發言和投票找出狼人。' }
  };
  const isWolf = (r) => ROLE[r] && ROLE[r].t === 'wolf';
  const COUNTS = [6, 9, 10, 12];
  const B12 = {
    wh: { name: '預女獵白', roles: ['wolf', 'wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter', 'idiot'] },
    wg: { name: '預女獵守', roles: ['wolf', 'wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter', 'guard'] },
    kg: { name: '狼王守衛', roles: ['wolfking', 'wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter', 'guard'] },
    wk: { name: '白狼王騎士', roles: ['whitewolf', 'wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter', 'knight'] }
  };
  function board(n, o) {
    o = o || {};
    if (n === 6) { const g = ['witch', 'hunter', 'guard'].includes(o.six) ? o.six : 'witch'; return { key: '6' + g, name: '6 人・預言家＋' + ROLE[g].n, roles: ['wolf', 'wolf', 'villager', 'villager', 'seer', g], sheriff: false, untested: false }; }
    if (n === 9) return { key: '9', name: '9 人・預女獵', roles: ['wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter'], sheriff: true, untested: false };
    if (n === 10) return { key: '10', name: '10 人・預女獵', roles: ['wolf', 'wolf', 'wolf', 'villager', 'villager', 'villager', 'villager', 'seer', 'witch', 'hunter'], sheriff: true, untested: true };
    if (n === 12) { const k = B12[o.b12] ? o.b12 : 'wh'; return { key: '12' + k, name: '12 人・' + B12[k].name, roles: B12[k].roles.slice(), sheriff: true, untested: true }; }
    return null;
  }
  const NIGHT_T = { guard: 15000, wolf: 40000, witch: 20000, seer: 15000 };
  const T = { deal: 90000, signup: 15000, evote: 20000, vote: 20000, announce: 6000, badge: 20000, skill: 12000, order: 15000 };
  const SPEECH = ['espeech', 'epk', 'speech', 'pkspeech', 'lw'];
  const EXPLODE_OK = ['signup', 'espeech', 'epk', 'speech', 'pkspeech'];

  function cntAlive(st) {
    let w = 0, g = 0, v = 0;
    for (let i = 0; i < st.n; i++) {
      if (!st.alive[i] || st.idiotUp.includes(i)) continue;
      const t = ROLE[st.roles[i]].t; if (t === 'wolf') w++; else if (t === 'god') g++; else v++;
    }
    return { w, g, v };
  }
  // 屠邊；同時成立時狼人優先（狼刀在先）
  function winnerOf(st) { const c = cntAlive(st); if (c.g === 0 || c.v === 0) return 'wolf'; if (c.w === 0) return 'good'; return null; }
  function log(st, text, kind) { st.log.push({ d: st.day, text, k: kind || '' }); if (st.log.length > 120) st.log.shift(); }
  const nm = (s) => (s + 1) + ' 號';

  // later＝同時死亡的一批還沒處理完，等整批處理完再判斷勝負（狼刀在先）
  function die(st, s, cause, later) {
    if (!st.alive[s]) return false;
    st.alive[s] = false; st.deaths.push({ s, cause, day: st.day });
    if (!later && !st.winner) st.winner = winnerOf(st);
    return true;
  }
  // 某人死亡之後要做的事：移交警徽 → 技能（每個死者都等一樣久，不洩漏誰是獵人）→ 遺言
  function deathTasks(st, s, cause) {
    const t = [];
    if (st.sheriff === s) {
      if (cause === 'explode') { st.sheriff = -1; st.badgeLost = true; log(st, '自爆的是警長，警徽流失'); }
      else t.push({ k: 'badge', s });
    }
    if (cause !== 'explode') { const r = st.roles[s]; t.push({ k: 'skill', s, can: (r === 'hunter' || r === 'wolfking') && cause !== 'poison' }); }
    const lw = (cause === 'knife' || cause === 'poison') ? st.day === 1 : (cause === 'exile' || cause === 'shot');
    if (lw) t.push({ k: 'lw', s, order: [s] });
    return t;
  }

  function startTask(st, task, now) {
    st.cur = task; st.step++; st.turn = null; st.deadline = 0;
    const k = task.k;
    if (k === 'over') { st.deadline = 0; return; }
    if (k === 'deal') { task.ready = {}; st.deadline = now + T.deal; return; }
    if (k === 'night') {
      st.nightNo++;
      const has = (r) => st.roles.includes(r);
      task.subs = ['guard', 'wolf', 'witch', 'seer'].filter(x => x === 'wolf' || has(x));
      task.si = 0; task.wp = {}; task.done = {}; task.res = { g: -1, kill: -1, save: false, poison: -1, check: -1 };
      st.deadline = now + NIGHT_T[task.subs[0]]; return;
    }
    if (k === 'signup') { task.signed = []; st.deadline = now + T.signup; return; }
    if (k === 'announce') {
      const ds = (st.pending || []).slice().sort((a, b) => a.s - b.s); st.pending = [];
      st.lastNight = ds.map(d => d.s);
      const done = ds.filter(d => die(st, d.s, d.cause, true));
      if (!st.winner) st.winner = winnerOf(st);
      task.dead = ds.map(d => d.s);
      log(st, ds.length ? `天亮了，昨晚 ${ds.map(d => nm(d.s)).join('、')} 死亡` : '天亮了，昨晚是平安夜', 'dawn');
      const more = []; done.forEach(d => more.push(...deathTasks(st, d.s, d.cause)));
      st.q.unshift(...more);
      st.deadline = now + T.announce; return;
    }
    if (k === 'order') {
      if (st.sheriff >= 0 && st.alive[st.sheriff]) { st.deadline = now + T.order; return; }
      // 沒有警長：從昨晚死者（號碼最小的）的下一位開始，往號碼大的方向；平安夜就隨機挑一位開始
      const alive = [...Array(st.n).keys()].filter(i => st.alive[i]);
      let start;
      if (st.lastNight && st.lastNight.length) { const d = st.lastNight[0]; start = d; do { start = (start + 1) % st.n; } while (!st.alive[start]); }
      else start = alive[rnd(alive.length)];
      return startTask(st, { k: 'speech', order: speechOrder(st, start, 1, -1), i: -1 }, now);
    }
    if (SPEECH.includes(k)) { task.i = task.i == null ? -1 : task.i; return nextSpeaker(st, now); }
    if (k === 'evote') { task.votes = {}; if (!task.voters.length) return finishVote(st, now); st.deadline = now + T.evote; return; }
    if (k === 'vote') {
      task.votes = {};
      const ok = (i) => st.alive[i] && !st.idiotUp.includes(i);
      if (!task.cands) task.cands = [...Array(st.n).keys()].filter(ok);
      task.voters = [...Array(st.n).keys()].filter(i => ok(i) && !(task.round === 2 && task.cands.includes(i)));
      if (!task.voters.length || task.cands.length < 1) return finishVote(st, now);
      st.deadline = now + T.vote; return;
    }
    if (k === 'badge' || k === 'skill') { st.deadline = now + T[k]; return; }
  }
  function next(st, now) {
    if (st.winner) {
      if (!st.cur || st.cur.k !== 'over') { log(st, st.winner === 'wolf' ? '狼人陣營獲勝' : '好人陣營獲勝', 'end'); startTask(st, { k: 'over' }, now); }
      return;
    }
    const t = st.q.shift();
    startTask(st, t || { k: 'night' }, now);
  }
  function speechOrder(st, start, dir, last) {
    const out = []; let s = start;
    for (let k = 0; k < st.n; k++) { if (st.alive[s] && s !== last) out.push(s); s = (s + dir + st.n) % st.n; }
    if (last >= 0 && st.alive[last]) out.push(last);
    return out;
  }
  function nextSpeaker(st, now) {
    const t = st.cur;
    for (;;) {
      t.i++;
      if (t.i >= t.order.length) {
        if (t.k === 'espeech') return endElectSpeech(st, now);
        return next(st, now);
      }
      const s = t.order[t.i];
      if (t.k === 'lw') break;
      if (t.k === 'espeech' && t.wd && t.wd[s]) continue;
      if (st.alive[s]) break;
    }
    st.turn = t.order[t.i]; st.step++;
    st.deadline = now + st.speakT * 1000;
  }
  function endElectSpeech(st, now) {
    const t = st.cur; const left = t.order.filter(s => !(t.wd && t.wd[s]));
    if (!left.length) { st.badgeLost = true; log(st, '上警的人全部退水，這局沒有警長'); return next(st, now); }
    if (left.length === 1) { st.sheriff = left[0]; log(st, `${nm(left[0])} 當選警長（只剩一位候選人）`, 'sheriff'); return next(st, now); }
    st.q.unshift({ k: 'evote', cands: left, voters: t.voters, round: 1 });
    return next(st, now);
  }
  function tally(st, t, weightSheriff) {
    const sum = {}; const lines = [];
    t.voters.forEach(v => {
      const x = t.votes[v];
      if (x == null || x < 0) { lines.push(`${nm(v)} 棄票`); return; }
      const w = weightSheriff && v === st.sheriff ? 1.5 : 1;
      sum[x] = (sum[x] || 0) + w; lines.push(`${nm(v)}→${nm(x)}${w > 1 ? '（警長 1.5 票）' : ''}`);
    });
    const max = Math.max(0, ...Object.values(sum));
    const top = Object.keys(sum).filter(k => sum[k] === max).map(Number).sort((a, b) => a - b);
    return { sum, max, top: max > 0 ? top : [], lines };
  }
  function finishVote(st, now) {
    const t = st.cur;
    if (t.k === 'evote') {
      const r = tally(st, t, false);
      st.lastVote = { k: 'evote', votes: Object.assign({}, t.votes), voters: t.voters.slice(), sum: r.sum, round: t.round };
      log(st, '警長投票：' + (r.lines.join('、') || '沒有人投票'), 'vote');
      if (!r.top.length) { st.badgeLost = true; log(st, '沒有人投票，這局沒有警長'); return next(st, now); }
      if (r.top.length === 1) { st.sheriff = r.top[0]; log(st, `${nm(r.top[0])} 當選警長`, 'sheriff'); return next(st, now); }
      if (t.round === 1) { log(st, `${r.top.map(nm).join('、')} 平票，進入警長 PK`); st.q.unshift({ k: 'epk', order: r.top }, { k: 'evote', cands: r.top, voters: t.voters.filter(v => !r.top.includes(v)), round: 2 }); return next(st, now); }
      st.badgeLost = true; log(st, '警長 PK 再次平票，這局沒有警長'); return next(st, now);
    }
    const r = tally(st, t, true);
    st.lastVote = { k: 'vote', votes: Object.assign({}, t.votes), voters: t.voters.slice(), sum: r.sum, round: t.round };
    log(st, (t.round === 2 ? 'PK 投票：' : '放逐投票：') + (r.lines.join('、') || '沒有人投票'), 'vote');
    if (!r.top.length) { log(st, '沒有人投票，今天沒有人出局'); return next(st, now); }
    if (r.top.length > 1) {
      if (t.round === 1) { log(st, `${r.top.map(nm).join('、')} 平票，進入 PK`); st.q.unshift({ k: 'pkspeech', order: r.top }, { k: 'vote', round: 2, cands: r.top }); return next(st, now); }
      log(st, 'PK 再次平票，今天沒有人出局'); return next(st, now);
    }
    exile(st, r.top[0]); return next(st, now);
  }
  function exile(st, s) {
    if (st.roles[s] === 'idiot' && !st.idiotUp.includes(s)) {
      st.idiotUp.push(s); log(st, `${nm(s)} 被投票放逐，翻牌亮出身分：白痴，留在場上但之後不能投票`, 'idiot');
      if (!st.winner) st.winner = winnerOf(st);
      if (st.sheriff === s) st.q.unshift({ k: 'badge', s, idiot: true });
      return;
    }
    log(st, `${nm(s)} 被投票放逐`, 'exile');
    die(st, s, 'exile');
    st.q.unshift(...deathTasks(st, s, 'exile'));
  }
  // 自爆／狼人被騎士決鬥：當天直接結束，只保留還沒處理完的死亡（公布死訊、警徽、技能、遺言），然後天黑
  function endDay(st, pre) {
    const keep = st.q.filter(x => ['announce', 'badge', 'skill', 'lw'].includes(x.k));
    st.q = pre.concat(keep, [{ k: 'night' }]);
  }
  function endNightSub(st, now) {
    const t = st.cur; const sub = t.subs[t.si];
    if (sub === 'wolf') {
      const r = tallyWolf(st, t); t.res.kill = r;
    }
    t.si++;
    if (t.si < t.subs.length) { st.step++; st.deadline = now + NIGHT_T[t.subs[t.si]]; return; }
    // 天亮結算
    const R = t.res; const ds = [];
    if (R.kill >= 0) { const g = R.g === R.kill, s = R.save; if (g === s) ds.push({ s: R.kill, cause: 'knife' }); }
    if (R.poison >= 0 && !ds.some(d => d.s === R.poison)) ds.push({ s: R.poison, cause: 'poison' });
    st.nights.push({ n: st.nightNo, guard: R.g, kill: R.kill, save: R.save, poison: R.poison, check: R.check, dead: ds.map(d => d.s) });
    st.guardLast = R.g;
    st.pending = ds; st.day++;
    // 試算：如果昨晚的死亡已經分出勝負，就不競選警長
    const save = st.alive.slice(); ds.forEach(d => { st.alive[d.s] = false; }); const ending = !!winnerOf(st); st.alive = save;
    st.q = [];
    if (st.day === 1 && st.bd.sheriff && st.sheriff < 0 && !st.badgeLost && !ending) st.q.push({ k: 'signup' });
    st.q.push({ k: 'announce' }, { k: 'order' }, { k: 'vote', round: 1 }, { k: 'night' });
    next(st, now);
  }
  function wolfSeats(st) { return [...Array(st.n).keys()].filter(i => st.alive[i] && isWolf(st.roles[i])); }
  function tallyWolf(st, t) {
    const c = {}; wolfSeats(st).forEach(w => { const x = t.wp[w]; if (x != null && x >= 0 && st.alive[x]) c[x] = (c[x] || 0) + 1; });
    const max = Math.max(0, ...Object.values(c)); if (!max) return -1;
    const top = Object.keys(c).filter(k => c[k] === max); return top.length === 1 ? +top[0] : -1; // 平手或都沒選＝不殺人
  }

  const classic = {
    ROLE, COUNTS, board, B12, isWolf, winnerOf, NIGHT_T, T,
    init(n, o, names, now) {
      now = now == null ? Date.now() : now; o = o || {};
      const bd = board(n, o); if (!bd) throw new Error('人數不支援');
      const st = {
        mode: 'classic', n, o, bd, roles: shuffle(bd.roles.slice()), alive: Array(n).fill(true), idiotUp: [], sheriff: -1, badgeLost: !bd.sheriff,
        day: 0, nightNo: 0, save: true, poison: true, guardLast: -1, knightUsed: false, checks: [], nights: [], deaths: [], log: [], pending: [],
        speakT: [45, 60, 90].includes(+o.speakT) ? +o.speakT : 60, q: [{ k: 'night' }], cur: null, step: 0, turn: null, deadline: 0, winner: null,
        bots: (names || []).map(x => /^電腦\d+$/.test(String(x))), lastVote: null
      };
      startTask(st, { k: 'deal' }, now);
      return st;
    },
    action(st, seat, a, ctx) {
      const now = (ctx && ctx.now) || Date.now(); const t = st.cur; if (!t || seat < 0) return 'silent';
      const k = t.k, type = a && a.type, tg = a && a.t != null ? a.t | 0 : null;
      const validSeat = (x) => x != null && x >= 0 && x < st.n;
      if (type === 'again') { if (k !== 'over') return 'silent'; const ns = classic.init(st.n, st.o, [], now); ns.bots = st.bots; Object.keys(st).forEach(x => delete st[x]); Object.assign(st, ns); return; }
      if (type === 'explode') {
        if (!EXPLODE_OK.includes(k)) return '現在不能自爆';
        if (!st.alive[seat] || !isWolf(st.roles[seat])) return '只有活著的狼人可以自爆';
        const ww = st.roles[seat] === 'whitewolf';
        if (ww && validSeat(tg) && (tg === seat || !st.alive[tg])) return '要帶走的人不對';
        log(st, `${nm(seat)} 自爆，亮出身分：${ROLE[st.roles[seat]].n}`, 'explode');
        if (['signup', 'espeech', 'epk'].includes(k) && st.sheriff < 0 && !st.badgeLost) { st.badgeLost = true; log(st, '警長競選中有人自爆，這局警徽流失'); }
        const pre = []; die(st, seat, 'explode', true); pre.push(...deathTasks(st, seat, 'explode'));
        if (ww && validSeat(tg)) { log(st, `白狼王帶走了 ${nm(tg)}`, 'shot'); die(st, tg, 'wwk', true); pre.push(...deathTasks(st, tg, 'wwk')); }
        if (!st.winner) st.winner = winnerOf(st);
        endDay(st, pre); next(st, now); return;
      }
      switch (k) {
        case 'deal':
          if (type !== 'ready') return 'silent';
          t.ready[seat] = 1; if (Object.keys(t.ready).length >= st.n) next(st, now); return;
        case 'night': {
          const sub = t.subs[t.si]; const me = st.roles[seat];
          if (!st.alive[seat]) return '你已經出局了';
          if (type === 'wpick') {
            if (sub !== 'wolf' || !isWolf(me)) return 'silent';
            if (tg !== -1 && !(validSeat(tg) && st.alive[tg])) return '選擇不對';
            t.wp[seat] = tg; st.step++;
            const ws = wolfSeats(st); const ps = ws.map(w => t.wp[w]);
            if (ps.every(x => x != null) && ps.every(x => x === ps[0])) endNightSub(st, now); // 狼隊意見一致就提早結束（狼人永遠存在，不會洩漏身分）
            return;
          }
          if (type === 'guard') {
            if (sub !== 'guard' || me !== 'guard') return 'silent'; if (t.done.guard) return '今晚已經守過了';
            if (tg !== -1 && !(validSeat(tg) && st.alive[tg])) return '選擇不對';
            if (tg >= 0 && tg === st.guardLast) return '不能連續兩晚守同一個人';
            t.res.g = tg; t.done.guard = 1; st.step++; return;
          }
          if (type === 'witch') {
            if (sub !== 'witch' || me !== 'witch') return 'silent'; if (t.done.witch) return '今晚已經決定了';
            if (a.use === 'save') {
              if (!st.save) return '解藥已經用掉了'; if (t.res.kill < 0) return '今晚沒有人被殺';
              if (t.res.kill === seat && st.nightNo > 1) return '只有第一晚可以救自己';
              st.save = false; t.res.save = true;
            } else if (a.use === 'poison') {
              if (!st.poison) return '毒藥已經用掉了'; if (!(validSeat(tg) && st.alive[tg])) return '選擇不對'; if (tg === seat) return '不能毒自己';
              st.poison = false; t.res.poison = tg;
            } else if (a.use !== 'pass') return 'silent';
            t.done.witch = a.use; st.step++; return;
          }
          if (type === 'check') {
            if (sub !== 'seer' || me !== 'seer') return 'silent'; if (t.done.seer) return '今晚已經查驗過了';
            if (!(validSeat(tg) && st.alive[tg]) || tg === seat) return '選擇不對';
            t.res.check = tg; t.done.seer = 1; st.checks.push({ n: st.nightNo, s: tg, wolf: isWolf(st.roles[tg]) }); st.step++; return;
          }
          return 'silent';
        }
        case 'signup':
          if (type !== 'run') return 'silent';
          if (!st.alive[seat]) return 'silent';
          if (t.signed.includes(seat)) t.signed = t.signed.filter(x => x !== seat); else t.signed.push(seat);
          st.step++; return;
        case 'espeech': case 'epk': case 'speech': case 'pkspeech': case 'lw': {
          const spk = t.order[t.i];
          if (type === 'end') { if (seat !== spk) return '還沒輪到你'; nextSpeaker(st, now); return; }
          if (type === 'withdraw') {
            if (k !== 'espeech' || !t.order.includes(seat)) return 'silent'; t.wd = t.wd || {}; if (t.wd[seat]) return 'silent';
            t.wd[seat] = 1; log(st, `${nm(seat)} 退水（不再競選警長）`);
            if (seat === spk) nextSpeaker(st, now); else st.step++;
            return;
          }
          if (type === 'duel') {
            if (k !== 'speech' || seat !== spk) return '輪到你發言時才能決鬥';
            if (st.roles[seat] !== 'knight' || st.knightUsed) return 'silent';
            if (!(validSeat(tg) && st.alive[tg]) || tg === seat) return '選擇不對';
            st.knightUsed = true;
            if (isWolf(st.roles[tg])) {
              log(st, `${nm(seat)} 翻牌：騎士，和 ${nm(tg)} 決鬥 → ${nm(tg)} 是狼人，狼人死亡，直接進入黑夜`, 'duel');
              die(st, tg, 'duel'); endDay(st, deathTasks(st, tg, 'duel')); next(st, now); return;
            }
            log(st, `${nm(seat)} 翻牌：騎士，和 ${nm(tg)} 決鬥 → ${nm(tg)} 是好人，騎士以死謝罪`, 'duel');
            die(st, seat, 'duel');
            st.q.unshift(...deathTasks(st, seat, 'duel'), { k: 'speech', order: t.order, i: t.i });
            next(st, now); return;
          }
          return 'silent';
        }
        case 'evote': case 'vote': {
          if (type !== 'vote') return 'silent';
          if (!t.voters.includes(seat)) return '你這輪不能投票';
          if (tg !== -1 && !(t.cands.includes(tg) && tg !== seat)) return '不能投這個人';
          t.votes[seat] = tg; st.step++;
          if (t.voters.every(v => t.votes[v] != null)) finishVote(st, now);
          return;
        }
        case 'order':
          if (type !== 'dir' || seat !== st.sheriff) return 'silent';
          { const d = a.d === -1 ? -1 : 1; const start = (st.sheriff + d + st.n) % st.n;
            log(st, `警長選擇從 ${nm(speechOrder(st, start, d, st.sheriff)[0])} 開始發言`);
            startTask(st, { k: 'speech', order: speechOrder(st, start, d, st.sheriff), i: -1 }, now); }
          return;
        case 'badge':
          if (type !== 'badge' || seat !== t.s) return 'silent';
          if (tg === -1) { st.sheriff = -1; st.badgeLost = true; log(st, `${nm(t.s)} 撕掉警徽，這局之後沒有警長`, 'sheriff'); next(st, now); return; }
          if (!(validSeat(tg) && st.alive[tg]) || tg === t.s || st.idiotUp.includes(tg)) return '不能交給這個人';
          st.sheriff = tg; log(st, `警徽移交給 ${nm(tg)}`, 'sheriff'); next(st, now); return;
        case 'skill':
          if (seat !== t.s) return 'silent';
          if (type === 'skip') { next(st, now); return; }
          if (type === 'shoot') {
            if (!t.can) return '你現在不能發動技能';
            if (!(validSeat(tg) && st.alive[tg]) || tg === seat) return '選擇不對';
            log(st, `${nm(seat)} 發動技能（${ROLE[st.roles[seat]].n}），帶走了 ${nm(tg)}`, 'shot');
            die(st, tg, 'shot');
            let j = 0; while (j < st.q.length && st.q[j].s === seat) j++;
            st.q.splice(j, 0, ...deathTasks(st, tg, 'shot'));
            next(st, now); return;
          }
          return 'silent';
      }
      return 'silent';
    },
    tick(st, now) {
      const t = st.cur; if (!t || !st.deadline || now <= st.deadline) return false;
      switch (t.k) {
        case 'deal': next(st, now); break;
        case 'night': endNightSub(st, now); break;
        case 'signup': {
          const c = t.signed.filter(s => st.alive[s]).sort((a, b) => a - b), all = [...Array(st.n).keys()].filter(i => st.alive[i]);
          if (!c.length) { st.badgeLost = true; log(st, '沒有人上警，這局沒有警長'); next(st, now); break; }
          if (c.length === all.length) { st.badgeLost = true; log(st, '所有人都上警，沒有人可以投票，這局沒有警長'); next(st, now); break; }
          log(st, `上警：${c.map(nm).join('、')}`);
          if (c.length === 1) { st.sheriff = c[0]; log(st, `${nm(c[0])} 當選警長（只有一位候選人）`, 'sheriff'); next(st, now); break; }
          const st0 = c[rnd(c.length)], dir = rnd(2) ? 1 : -1; const ord = []; let s = st0;
          for (let k = 0; k < st.n; k++) { if (c.includes(s)) ord.push(s); s = (s + dir + st.n) % st.n; }
          st.q.unshift({ k: 'espeech', order: ord, voters: all.filter(x => !c.includes(x)) });
          next(st, now); break;
        }
        case 'espeech': case 'epk': case 'speech': case 'pkspeech': case 'lw': nextSpeaker(st, now); break;
        case 'evote': case 'vote': finishVote(st, now); break;
        case 'announce': next(st, now); break;
        case 'badge': st.sheriff = -1; st.badgeLost = true; log(st, `${nm(t.s)} 沒有移交警徽，警徽流失`, 'sheriff'); next(st, now); break;
        case 'skill': next(st, now); break;
        case 'order': classic.action(st, st.sheriff, { type: 'dir', d: 1 }, { now }); break;
        default: return false;
      }
      return true;
    },
    // 電腦玩家／託管。託管的真人：不投票、不用技能、狼人跟隨隊友；電腦玩家（測試房）會隨機行動
    auto(st, isAuto) {
      const ia = isAuto || (() => true); const t = st.cur; if (!t) return null;
      const alive = [...Array(st.n).keys()].filter(i => st.alive[i]);
      const H = (s, x) => hsh(st.step, s, x || 0, st.nightNo, st.day);
      switch (t.k) {
        case 'deal': { const s = [...Array(st.n).keys()].find(i => !t.ready[i] && ia(i)); return s == null ? null : { seat: s, a: { type: 'ready' } }; }
        case 'night': {
          const sub = t.subs[t.si];
          if (sub === 'wolf') {
            const ws = wolfSeats(st); const s = ws.find(w => t.wp[w] == null && ia(w)); if (s == null) return null;
            const mate = ws.map(w => t.wp[w]).find((x, j) => x != null && !ia(ws[j]));
            if (mate != null) return { seat: s, a: { type: 'wpick', t: mate } };
            const prev = ws.map(w => t.wp[w]).find(x => x != null);
            if (prev != null) return { seat: s, a: { type: 'wpick', t: prev } };
            if (!isBot(st, s)) return null;
            return { seat: s, a: { type: 'wpick', t: pick(alive.filter(i => !isWolf(st.roles[i])), H(s)) } };
          }
          const holder = [...Array(st.n).keys()].find(i => st.roles[i] === sub);
          if (holder == null || !st.alive[holder] || !ia(holder) || t.done[sub]) return null;
          if (!isBot(st, holder)) return sub === 'witch' ? { seat: holder, a: { type: 'witch', use: 'pass' } } : null;
          if (sub === 'guard') return { seat: holder, a: { type: 'guard', t: pick(alive.filter(i => i !== st.guardLast), H(holder)) } };
          if (sub === 'seer') { const done = st.checks.map(c => c.s); const c = alive.filter(i => i !== holder && !done.includes(i)); return { seat: holder, a: { type: 'check', t: pick(c.length ? c : alive.filter(i => i !== holder), H(holder)) } }; }
          if (sub === 'witch') {
            if (st.save && t.res.kill >= 0 && (t.res.kill !== holder || st.nightNo === 1) && H(holder) % 3) return { seat: holder, a: { type: 'witch', use: 'save' } };
            if (st.poison && H(holder, 1) % 5 === 0) return { seat: holder, a: { type: 'witch', use: 'poison', t: pick(alive.filter(i => i !== holder), H(holder, 2)) } };
            return { seat: holder, a: { type: 'witch', use: 'pass' } };
          }
          return null;
        }
        case 'signup': { const s = alive.find(i => ia(i) && isBot(st, i) && !t.signed.includes(i) && H(i) % 3 === 0); return s == null ? null : { seat: s, a: { type: 'run' } }; }
        case 'espeech': case 'epk': case 'speech': case 'pkspeech': case 'lw': { const s = t.order[t.i]; return s != null && ia(s) ? { seat: s, a: { type: 'end' } } : null; }
        case 'evote': case 'vote': {
          const s = t.voters.find(v => t.votes[v] == null && ia(v)); if (s == null) return null;
          if (!isBot(st, s)) return { seat: s, a: { type: 'vote', t: -1 } };
          const c = t.cands.filter(x => x !== s); return { seat: s, a: { type: 'vote', t: c.length ? pick(c, H(s)) : -1 } };
        }
        case 'order': return ia(st.sheriff) ? { seat: st.sheriff, a: { type: 'dir', d: 1 } } : null;
        case 'badge': {
          if (!ia(t.s)) return null; if (!isBot(st, t.s)) return { seat: t.s, a: { type: 'badge', t: -1 } };
          const c = alive.filter(i => i !== t.s && !st.idiotUp.includes(i)); return { seat: t.s, a: { type: 'badge', t: c.length ? pick(c, H(t.s)) : -1 } };
        }
        case 'skill': {
          if (!ia(t.s)) return null;
          if (t.can && isBot(st, t.s) && H(t.s) % 2) { const c = alive.filter(i => i !== t.s); if (c.length) return { seat: t.s, a: { type: 'shoot', t: pick(c, H(t.s, 1)) } }; }
          return { seat: t.s, a: { type: 'skip' } };
        }
      }
      return null;
    },
    view(st, seat) {
      const t = st.cur || {}; const k = t.k; const me = seat >= 0 ? st.roles[seat] : null; const over = k === 'over';
      const sub = k === 'night' ? t.subs[t.si] : null;
      const v = {
        mode: 'classic', n: st.n, board: st.bd.name, boardKey: st.bd.key, untested: st.bd.untested, comp: st.bd.roles, hasSheriff: st.bd.sheriff,
        phase: k, sub, deadline: st.deadline, day: st.day, nightNo: st.nightNo, alive: st.alive, idiotUp: st.idiotUp, sheriff: st.sheriff, badgeLost: st.badgeLost,
        turn: st.turn, turnId: st.step, speakT: st.speakT, log: st.log.slice(-40), lastVote: st.lastVote,
        knightUsed: st.knightUsed, winner: st.winner
      };
      if (SPEECH.includes(k)) { v.order = t.order; v.i = t.i; v.speaker = t.order[t.i]; v.wd = t.wd || {}; }
      if (k === 'deal') { v.readyN = Object.keys(t.ready).length; v.meReady = !!t.ready[seat]; }
      if (k === 'signup') v.signed = t.signed;
      if (k === 'espeech' || k === 'epk') v.cands = t.order.filter(s => !(t.wd && t.wd[s]));
      if (k === 'evote' || k === 'vote') { v.cands = t.cands; v.voters = t.voters; v.votedN = Object.keys(t.votes).length; v.myVote = t.votes[seat]; v.round = t.round; }
      if (k === 'announce') v.dead = t.dead;
      if (k === 'badge') { v.bs = t.s; v.idiotBadge = !!t.idiot; }
      if (k === 'skill') { v.ks = t.s; if (seat === t.s) v.canShoot = !!t.can; }
      if (seat >= 0) {
        const m = v.me = { role: me, alive: st.alive[seat] };
        if (isWolf(me)) { m.wolves = [...Array(st.n).keys()].filter(i => isWolf(st.roles[i])).map(i => ({ s: i, r: st.roles[i] })); if (sub === 'wolf') m.wp = t.wp; }
        if (me === 'seer') m.checks = st.checks;
        if (me === 'witch') { m.save = st.save; m.poison = st.poison; if (sub === 'witch') { m.kill = st.save ? t.res.kill : null; m.wdone = t.done.witch || null; m.wpoison = t.res.poison; } }
        if (me === 'guard') { m.guardLast = st.guardLast; if (sub === 'guard') { m.gdone = !!t.done.guard; m.g = t.res.g; } }
        if (me === 'seer' && sub === 'seer') m.sdone = !!t.done.seer;
        if (me === 'knight') m.knightUsed = st.knightUsed;
      }
      if (over) { v.roles = st.roles; v.nights = st.nights; v.deaths = st.deaths; }
      // 發言權：發言時只有發言者能說話；晚上、投票、公布、技能時全場靜音；結束後自由說話
      v.floor = over ? null : SPEECH.includes(k) && t.order[t.i] != null ? [t.order[t.i]] : [];
      return v;
    }
  };

  // ======================================================================
  // 一夜版
  // ======================================================================
  const OROLE = {
    werewolf: { n: '狼人', t: 'wolf', i: '🐺', d: '晚上醒來和其他狼人互相確認。如果場上只有你一隻狼，可以偷看中間的一張牌。' },
    minion: { n: '爪牙', t: 'wolf', i: '🦇', d: '晚上會看到誰是狼人，但狼人不知道誰是爪牙。你和狼人同一隊：狼人沒被投出去，你們就贏（你自己被投出去也算贏）。' },
    seer: { n: '預言家', t: 'vil', i: '🔮', d: '晚上可以看一位玩家的牌，或看中間的兩張牌。' },
    robber: { n: '強盜', t: 'vil', i: '🦹', d: '晚上可以和一位玩家交換牌，再看自己換到的新牌。換完之後你屬於新牌的陣營，對方變成強盜（但他不知道）。' },
    troublemaker: { n: '搗蛋鬼', t: 'vil', i: '😜', d: '晚上可以交換另外兩位玩家的牌，你看不到牌的內容。' },
    drunk: { n: '酒鬼', t: 'vil', i: '🍺', d: '晚上一定要把自己的牌和中間的一張牌交換，而且看不到換到什麼。' },
    insomniac: { n: '失眠者', t: 'vil', i: '🥱', d: '晚上最後醒來，看自己現在的牌（看得出有沒有被換過）。' },
    hunter: { n: '獵人', t: 'vil', i: '🏹', d: '沒有夜晚技能。如果你被投票出局，你投的那個人也會一起出局。' },
    tanner: { n: '皮匠', t: 'tanner', i: '🪡', d: '你討厭這份工作，只想被投出去。你被投票出局就贏，不屬於好人或狼人。' },
    villager: { n: '村民', t: 'vil', i: '🧑‍🌾', d: '沒有特殊技能，靠討論找出狼人。' }
  };
  const OSTEPS = ['werewolf', 'minion', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac'];
  function odeck(n, o) {
    o = o || {};
    const fillN = n + 3 - 5; const fill = ['insomniac', 'drunk', 'villager', 'villager'].slice(0, fillN);
    // 爪牙、獵人、皮匠：從最後面的空位換掉（先換村民，再換酒鬼、失眠者）；空位不夠就放不進去
    const extras = ['minion', 'hunter', 'tanner'].filter(r => +o[r] === 1);
    const dropped = [];
    extras.forEach(r => { let j = fill.length - 1; while (j >= 0 && extras.includes(fill[j])) j--; if (j < 0) dropped.push(r); else fill[j] = r; });
    return { deck: ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker'].concat(fill), dropped };
  }
  const OT = { deal: 60000, vote: 30000, step: 12000 };
  function oresolve(st) {
    const t = st.cur; const n = st.n; const c = {};
    for (let i = 0; i < n; i++) { const x = t.votes[i]; if (x != null && x >= 0) c[x] = (c[x] || 0) + 1; }
    const max = Math.max(0, ...Object.values(c));
    let dead = max >= 2 ? Object.keys(c).filter(k => c[k] === max).map(Number) : [];
    // 獵人：被投出局時，他投的人也出局
    dead.slice().forEach(s => { if (st.cards[s] === 'hunter') { const x = t.votes[s]; if (x != null && x >= 0 && !dead.includes(x)) dead.push(x); } });
    dead.sort((a, b) => a - b);
    const fin = st.cards.slice(0, n);
    const wolvesIn = fin.some(r => r === 'werewolf'), minionIn = fin.includes('minion');
    const deadWolf = dead.some(s => fin[s] === 'werewolf'), deadTanner = dead.some(s => fin[s] === 'tanner'), deadMinion = dead.some(s => fin[s] === 'minion');
    let vilWin, wolfWin, minionSoloWin = false;
    if (wolvesIn) { vilWin = deadWolf; wolfWin = !deadWolf && !deadTanner; }
    else {
      vilWin = dead.length === 0 || deadMinion; wolfWin = false;
      if (minionIn) minionSoloWin = dead.some(s => fin[s] !== 'minion') && !deadMinion && !deadTanner;
    }
    const win = fin.map((r, s) => {
      const tm = OROLE[r].t;
      if (r === 'tanner') return deadTanner && dead.includes(s);
      if (r === 'minion') return wolvesIn ? wolfWin : minionSoloWin;
      if (tm === 'wolf') return wolfWin;
      return vilWin;
    });
    st.result = { votes: Object.assign({}, t.votes), counts: c, dead, win, wolvesIn, deadTanner, team: vilWin && !wolfWin ? 'vil' : wolfWin ? 'wolf' : null };
  }
  function ostart(st, k, now) {
    st.cur = { k }; st.step++; st.deadline = 0;
    if (k === 'deal') { st.cur.ready = {}; st.deadline = now + OT.deal; }
    if (k === 'night') { st.cur.si = 0; st.cur.done = {}; st.deadline = now + OT.step; }
    if (k === 'day') { st.cur.early = {}; st.deadline = now + st.talkT * 60000; }
    if (k === 'vote') { st.cur.votes = {}; st.deadline = now + OT.vote; }
  }
  function oholders(st, role) { return [...Array(st.n).keys()].filter(i => st.orig[i] === role); }
  function oswap(st, a, b) { const x = st.cards[a]; st.cards[a] = st.cards[b]; st.cards[b] = x; }
  function onightNext(st, now) {
    const t = st.cur; const role = st.steps[t.si];
    // 酒鬼沒動作：時間到強制換中間隨機一張
    if (role === 'drunk') oholders(st, 'drunk').forEach(s => { if (!t.done[s]) { const c = st.n + rnd(3); oswap(st, s, c); st.acts.push({ r: 'drunk', s, c: c - st.n, auto: true }); t.done[s] = 1; } });
    t.si++;
    if (t.si >= st.steps.length) return ostart(st, 'day', now);
    st.step++; st.deadline = now + OT.step;
    const r2 = st.steps[t.si];
    if (r2 === 'insomniac') oholders(st, 'insomniac').forEach(s => { st.info[s].push(`醒來看自己的牌：現在是「${OROLE[st.cards[s]].n}」`); });
  }
  function oinfoWolves(st) {
    const ws = oholders(st, 'werewolf');
    ws.forEach(s => { const o = ws.filter(x => x !== s); st.info[s].push(o.length ? `你的狼隊友：${o.map(nm).join('、')}` : '場上只有你一隻狼（另一隻在中間的牌裡），可以偷看中間一張牌'); });
    oholders(st, 'minion').forEach(s => { st.info[s].push(ws.length ? `狼人是：${ws.map(nm).join('、')}` : '玩家裡沒有狼人（狼人都在中間的牌裡）'); });
  }
  const onenight = {
    ROLE: OROLE, STEPS: OSTEPS, deck: odeck, T: OT,
    init(n, o, names, now) {
      now = now == null ? Date.now() : now; o = o || {};
      const { deck, dropped } = odeck(n, o);
      const cards = shuffle(deck.slice());
      const st = {
        mode: 'onenight', n, o, deckList: deck, dropped, cards, orig: cards.slice(), info: Array.from({ length: n }, () => []), acts: [],
        steps: OSTEPS.filter(r => deck.includes(r)), talkT: [3, 5, 8].includes(+o.talkT) ? +o.talkT : 5,
        cur: null, step: 0, deadline: 0, turn: null, result: null, bots: (names || []).map(x => /^電腦\d+$/.test(String(x)))
      };
      ostart(st, 'deal', now);
      return st;
    },
    action(st, seat, a, ctx) {
      const now = (ctx && ctx.now) || Date.now(); const t = st.cur; if (!t || seat < 0) return 'silent';
      const type = a && a.type; const n = st.n; const pl = (x) => Number.isInteger(x) && x >= 0 && x < n;
      if (type === 'again') { if (t.k !== 'over') return 'silent'; const ns = onenight.init(n, st.o, [], now); ns.bots = st.bots; Object.keys(st).forEach(x => delete st[x]); Object.assign(st, ns); return; }
      if (t.k === 'deal') { if (type !== 'ready') return 'silent'; t.ready[seat] = 1; if (Object.keys(t.ready).length >= n) { ostart(st, 'night', now); oinfoWolves(st); } return; }
      if (t.k === 'night') {
        const role = st.steps[t.si]; if (st.orig[seat] !== role) return 'silent'; if (t.done[seat]) return '已經行動過了';
        if (role === 'werewolf' && type === 'peek') {
          if (oholders(st, 'werewolf').length !== 1) return '場上有兩隻狼時不能偷看';
          const c = a.c | 0; if (c < 0 || c > 2) return '選擇不對';
          st.info[seat].push(`偷看中間第 ${c + 1} 張：${OROLE[st.cards[n + c]].n}`); st.acts.push({ r: 'werewolf', s: seat, c }); t.done[seat] = 1; st.step++; return;
        }
        if (role === 'seer' && type === 'see') {
          if (pl(a.p) && a.p !== seat) { st.info[seat].push(`看了 ${nm(a.p)} 的牌：${OROLE[st.cards[a.p]].n}`); st.acts.push({ r: 'seer', s: seat, p: a.p }); }
          else if (Array.isArray(a.c) && a.c.length === 2 && a.c[0] !== a.c[1] && a.c.every(x => x >= 0 && x <= 2)) { st.info[seat].push(`看了中間第 ${a.c[0] + 1}、${a.c[1] + 1} 張：${OROLE[st.cards[n + a.c[0]]].n}、${OROLE[st.cards[n + a.c[1]]].n}`); st.acts.push({ r: 'seer', s: seat, c: a.c.slice() }); }
          else return '選擇不對';
          t.done[seat] = 1; st.step++; return;
        }
        if (role === 'robber' && type === 'rob') {
          if (!pl(a.p) || a.p === seat) return '選擇不對';
          oswap(st, seat, a.p); st.info[seat].push(`和 ${nm(a.p)} 交換了牌，你現在是「${OROLE[st.cards[seat]].n}」`); st.acts.push({ r: 'robber', s: seat, p: a.p }); t.done[seat] = 1; st.step++; return;
        }
        if (role === 'troublemaker' && type === 'tm') {
          if (!pl(a.a) || !pl(a.b) || a.a === a.b || a.a === seat || a.b === seat) return '要選兩位其他玩家';
          oswap(st, a.a, a.b); st.info[seat].push(`交換了 ${nm(a.a)} 和 ${nm(a.b)} 的牌`); st.acts.push({ r: 'troublemaker', s: seat, a: a.a, b: a.b }); t.done[seat] = 1; st.step++; return;
        }
        if (role === 'drunk' && type === 'drunk') {
          const c = a.c | 0; if (c < 0 || c > 2) return '選擇不對';
          oswap(st, seat, n + c); st.info[seat].push(`把自己的牌和中間第 ${c + 1} 張交換了（看不到換到什麼）`); st.acts.push({ r: 'drunk', s: seat, c }); t.done[seat] = 1; st.step++; return;
        }
        if (type === 'skip' && role !== 'drunk') { t.done[seat] = 1; st.step++; return; }
        return 'silent';
      }
      if (t.k === 'day') {
        if (type !== 'early') return 'silent';
        if (t.early[seat]) delete t.early[seat]; else t.early[seat] = 1; st.step++;
        if (Object.keys(t.early).length >= n) ostart(st, 'vote', now);
        return;
      }
      if (t.k === 'vote') {
        if (type !== 'vote') return 'silent';
        if (!pl(a.t) || a.t === seat) return '不能投這個人';
        t.votes[seat] = a.t; st.step++;
        if (Object.keys(t.votes).length >= n) { oresolve(st); ostart(st, 'over', now); }
        return;
      }
      return 'silent';
    },
    tick(st, now) {
      const t = st.cur; if (!t || !st.deadline || now <= st.deadline) return false;
      if (t.k === 'deal') { ostart(st, 'night', now); oinfoWolves(st); return true; }
      if (t.k === 'night') { onightNext(st, now); return true; }
      if (t.k === 'day') { ostart(st, 'vote', now); return true; }
      if (t.k === 'vote') { oresolve(st); ostart(st, 'over', now); return true; }
      return false;
    },
    auto(st, isAuto) {
      const ia = isAuto || (() => true); const t = st.cur; if (!t) return null; const n = st.n;
      const H = (s, x) => hsh(st.step, s, x || 0);
      const others = (s) => [...Array(n).keys()].filter(i => i !== s);
      if (t.k === 'deal') { const s = [...Array(n).keys()].find(i => !t.ready[i] && ia(i)); return s == null ? null : { seat: s, a: { type: 'ready' } }; }
      if (t.k === 'night') {
        const role = st.steps[t.si];
        const s = oholders(st, role).find(i => !t.done[i] && ia(i)); if (s == null) return null;
        if (role === 'drunk') return { seat: s, a: { type: 'drunk', c: H(s) % 3 } };
        if (!isBot(st, s)) return null; // 託管的真人：夜晚不行動（酒鬼由系統隨機換）
        if (role === 'werewolf') return oholders(st, 'werewolf').length === 1 ? { seat: s, a: { type: 'peek', c: H(s) % 3 } } : null;
        if (role === 'seer') return H(s) % 2 ? { seat: s, a: { type: 'see', p: pick(others(s), H(s, 1)) } } : { seat: s, a: { type: 'see', c: [0, 1, 2].filter(x => x !== H(s, 2) % 3) } };
        if (role === 'robber') return { seat: s, a: { type: 'rob', p: pick(others(s), H(s, 1)) } };
        if (role === 'troublemaker') { const o = others(s); const a1 = pick(o, H(s, 1)); const o2 = o.filter(x => x !== a1); return o2.length ? { seat: s, a: { type: 'tm', a: a1, b: pick(o2, H(s, 2)) } } : null; }
        return null;
      }
      if (t.k === 'day') { const s = [...Array(n).keys()].find(i => !t.early[i] && ia(i) && isBot(st, i)); return s == null ? null : { seat: s, a: { type: 'early' } }; }
      if (t.k === 'vote') { const s = [...Array(n).keys()].find(i => t.votes[i] == null && ia(i) && isBot(st, i)); return s == null ? null : { seat: s, a: { type: 'vote', t: pick(others(s), H(s)) } }; }
      return null;
    },
    view(st, seat) {
      const t = st.cur || {}; const k = t.k; const over = k === 'over';
      const v = {
        mode: 'onenight', n: st.n, deck: st.deckList, dropped: st.dropped, steps: st.steps, phase: k, deadline: st.deadline, turnId: st.step, turn: null, talkT: st.talkT,
        sub: k === 'night' ? st.steps[t.si] : null
      };
      if (k === 'deal') { v.readyN = Object.keys(t.ready).length; v.meReady = !!t.ready[seat]; }
      if (k === 'day') { v.earlyN = Object.keys(t.early).length; v.meEarly = !!t.early[seat]; }
      if (k === 'vote') { v.votedN = Object.keys(t.votes).length; v.myVote = t.votes[seat]; }
      if (seat >= 0) {
        v.me = { orig: st.orig[seat], info: st.info[seat].slice() };
        if (k === 'night') { v.me.myStep = st.steps[t.si] === st.orig[seat]; v.me.done = !!t.done[seat]; v.me.loneWolf = st.orig[seat] === 'werewolf' && oholders(st, 'werewolf').length === 1; }
      }
      if (over) { v.orig = st.orig; v.cards = st.cards; v.acts = st.acts; v.result = st.result; }
      v.floor = over || k === 'day' ? null : [];
      return v;
    }
  };

  root.WW_RULES = { classic, onenight, hsh, shuffle };
})(typeof window !== 'undefined' ? window : globalThis);
