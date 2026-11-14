// 台灣 16 張麻將（3／4／5 人）
(function (root) {
  const U = root.GUTIL;
  // 牌種 0-8 萬、9-17 筒、18-26 條、27-30 東南西北、31-33 中發白、34-41 花（春夏秋冬梅蘭竹菊）
  const tt = (id) => id < 136 ? Math.floor(id / 4) : 34 + (id - 136);
  const isFlower = (id) => id >= 136;
  const isHonor = (t) => t >= 27 && t < 34;
  const suitOf = (t) => t < 27 ? Math.floor(t / 9) : 3;
  const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const HON = ['東', '南', '西', '北', '中', '發', '白'];
  const FLW = ['春', '夏', '秋', '冬', '梅', '蘭', '竹', '菊'];
  const WIND = ['東', '南', '西', '北'];
  const tname = (t) => t < 9 ? CN[t] + '萬' : t < 18 ? (t - 8) + '筒' : t < 27 ? (t - 17) + '條' : t < 34 ? HON[t - 27] : FLW[t - 34];

  // ---------- 胡牌判定 ----------
  function counts(types) { const c = Array(34).fill(0); types.forEach(t => c[t]++); return c; }
  function decomps(c, needSets, limit) {
    const out = []; const sets = [];
    let pair = -1;
    (function rec() {
      if (out.length >= (limit || 40)) return;
      let i = 0; while (i < 34 && !c[i]) i++;
      if (i === 34) { if (pair >= 0 && sets.length === needSets) out.push({ pair, sets: sets.slice() }); return; }
      if (pair < 0 && c[i] >= 2) { c[i] -= 2; pair = i; rec(); pair = -1; c[i] += 2; }
      if (c[i] >= 3) { c[i] -= 3; sets.push({ k: 'pung', t: i }); rec(); sets.pop(); c[i] += 3; }
      if (i < 27 && i % 9 <= 6 && c[i + 1] && c[i + 2]) { c[i]--; c[i + 1]--; c[i + 2]--; sets.push({ k: 'chow', t: i }); rec(); sets.pop(); c[i]++; c[i + 1]++; c[i + 2]++; }
    })();
    return out;
  }
  function liguligu(c) { // 嚦咕嚦咕：七對＋一刻（17 張門清）
    let pairs = 0, trip = 0;
    for (let i = 0; i < 34; i++) { if (c[i] === 2) pairs++; else if (c[i] === 3) trip++; else if (c[i] === 4) pairs += 2; else if (c[i]) return false; }
    return pairs === 7 && trip === 1;
  }
  function canWin(handTypes, meldCount) {
    const c = counts(handTypes); const need = 5 - meldCount;
    if (handTypes.length !== need * 3 + 2) return false;
    if (meldCount === 0 && liguligu(c)) return true;
    return decomps(c, need, 1).length > 0;
  }
  function waits(handTypes, meldCount, avail) {
    const c = counts(handTypes); const res = [];
    for (let t = 0; t < 34; t++) { if (avail && !avail.includes(t)) continue; if (c[t] >= 4) continue; if (canWin(handTypes.concat([t]), meldCount)) res.push(t); }
    return res;
  }

  // ---------- 台數 ----------
  function calcTai(o) {
    // o: {handTypes(含胡的那張), melds, winT, zimo, flowers, seatWind, roundWind, waitsN, last, kongDraw, robKong, isDealerWin}
    const meldCount = o.melds.length;
    const c = counts(o.handTypes);
    const options = [];
    if (meldCount === 0 && liguligu(c)) options.push({ special: 'ligu' });
    decomps(counts(o.handTypes), 5 - meldCount, 40).forEach(d => options.push(d));
    let best = null;
    for (const d of options) {
      const items = [];
      const add = (name, n) => items.push([name, n]);
      const exposed = o.melds.filter(m => m.k !== 'an');
      const menqing = exposed.length === 0;
      if (o.zimo && menqing) add('門清自摸（不求人）', 3); else { if (o.zimo) add('自摸', 1); if (menqing) add('門清', 1); }
      // 花
      const fl = o.flowers.map(tt);
      fl.forEach(f => { const idx = (f - 34) % 4; if (idx === o.seatWind) add('正花 ' + FLW[f - 34], 1); });
      if ([34, 35, 36, 37].every(f => fl.includes(f))) add('花槓（春夏秋冬）', 2);
      if ([38, 39, 40, 41].every(f => fl.includes(f))) add('花槓（梅蘭竹菊）', 2);
      if (o.eight) add('八仙過海', 8);
      if (d.special === 'ligu') add('嚦咕嚦咕', 8);
      if (o.last) add(o.zimo ? '海底撈月' : '河底撈魚', 1);
      if (o.kongDraw && o.zimo) add('槓上開花', 1);
      if (o.robKong) add('搶槓', 1);
      if (o.waitsN === 1 && !d.special) add('獨聽', 1);
      if (!d.special) {
        // 全部面子
        const all = d.sets.map(s => {
          let concealed = true;
          if (!o.zimo && s.k === 'pung' && s.t === o.winT) {
            const usedElse = d.pair === o.winT || d.sets.some(x => x !== s && x.k === 'chow' && o.winT >= x.t && o.winT <= x.t + 2);
            if (!usedElse) concealed = false;
          }
          return { k: s.k, t: s.t, concealed };
        }).concat(o.melds.map(m => ({ k: m.k === 'chi' ? 'chow' : 'pung', t: m.t, concealed: m.k === 'an' })));
        const pungs = all.filter(s => s.k === 'pung');
        const types = all.map(s => s.t).concat([d.pair]);
        if (pungs.length === 5) add('碰碰胡', 4);
        const an = pungs.filter(s => s.concealed).length;
        if (an >= 5) add('五暗刻', 8); else if (an === 4) add('四暗刻', 5); else if (an === 3) add('三暗刻', 2);
        if (meldCount === 5 && !o.zimo && o.waitsN === 1) add('全求人', 2);
        // 三元
        const dr = [31, 32, 33].filter(t => pungs.some(s => s.t === t));
        if (dr.length === 3) add('大三元', 8);
        else if (dr.length === 2 && [31, 32, 33].includes(d.pair)) add('小三元', 4);
        else dr.forEach(t => add('三元牌 ' + HON[t - 27], 1));
        // 風
        const wd = [27, 28, 29, 30].filter(t => pungs.some(s => s.t === t));
        if (wd.length === 4) add('大四喜', 16);
        else if (wd.length === 3 && [27, 28, 29, 30].includes(d.pair)) add('小四喜', 8);
        else {
          if (wd.includes(27 + o.roundWind)) add('圈風 ' + WIND[o.roundWind], 1);
          if (wd.includes(27 + o.seatWind)) add('門風 ' + WIND[o.seatWind], 1);
        }
        // 一色
        const suits = new Set(types.filter(t => !isHonor(t)).map(suitOf));
        const hasHonor = types.some(isHonor);
        if (suits.size === 0) add('字一色', 16);
        else if (suits.size === 1 && !hasHonor) add('清一色', 8);
        else if (suits.size === 1 && hasHonor) add('混一色', 4);
        // 平胡
        if (pungs.length === 0 && !hasHonor && !o.flowers.length && !o.zimo && o.waitsN > 1) add('平胡', 2);
      } else {
        const ts = o.handTypes; const suits = new Set(ts.filter(t => !isHonor(t)).map(suitOf)); const hasHonor = ts.some(isHonor);
        if (suits.size === 1 && !hasHonor) add('清一色', 8); else if (suits.size === 1 && hasHonor) add('混一色', 4); else if (!suits.size) add('字一色', 16);
      }
      const total = items.reduce((a, x) => a + x[1], 0);
      if (!best || total > best.total) best = { items, total };
    }
    return best || { items: [], total: 0 };
  }

  // ---------- 牌局 ----------
  function buildWall(n3) {
    const ids = [];
    for (let id = 0; id < 144; id++) { if (n3 && id < 136 && tt(id) < 9) continue; ids.push(id); }
    return U.shuffle(ids);
  }
  function inPlayTypes(st) { const r = []; for (let t = st.k === 3 ? 9 : 0; t < 34; t++) r.push(t); return r; }

  function newHand(st, now) {
    const n = st.n;
    // 座位安排
    if (n === 5) { st.sitter = st.handNo % 5; const d = (st.sitter + 1) % 5; st.act = U.range(4).map(i => (d + i) % 5).filter(s => s !== st.sitter); if (st.act.length < 4) st.act = U.range(5).filter(s => s !== st.sitter); }
    else { st.sitter = -1; st.act = U.range(n).map(i => (st.dealer + i) % n); }
    const k = st.k = st.act.length;
    st.wall = buildWall(k === 3);
    st.hands = U.range(k).map(() => []); st.melds = U.range(k).map(() => []); st.flowers = U.range(k).map(() => []); st.river = U.range(k).map(() => []);
    for (let r = 0; r < 16; r++) for (let p = 0; p < k; p++) st.hands[p].push(st.wall.shift());
    st.hands[0].push(st.wall.shift());
    // 補花
    let again = true;
    while (again) {
      again = false;
      for (let p = 0; p < k; p++) {
        for (let i = 0; i < st.hands[p].length; i++) {
          if (isFlower(st.hands[p][i])) { st.flowers[p].push(st.hands[p][i]); st.hands[p][i] = st.wall.pop(); again = true; }
        }
      }
    }
    st.turn = 0; st.drawn = st.hands[0][16]; st.phase = 'discard'; st.claim = null; st.result = null; st.kongDraw = false; st.firstTurn = true;
    st.log = [`第 ${st.handNo + 1} 局開始，莊家 ${st.names[st.act[0]]}${st.lian ? `（連${st.lian}）` : ''}`];
    st.deadline = st.tlimit ? now + st.tlimit * 1000 : 0;
    for (let p = 0; p < k; p++) if (st.flowers[p].length === 8) { win(st, p, null, now, { eight: true }); return; }
  }
  const RESERVE = 16;
  function wallLeft(st) { return st.wall.length - RESERVE; }

  function drawFor(st, p, fromBack, now) {
    if (wallLeft(st) <= 0) { drawGame(st, now); return false; }
    let t = fromBack ? st.wall.pop() : st.wall.shift();
    while (isFlower(t)) {
      st.flowers[p].push(t); st.log.push(`${pname(st, p)} 補花 ${tname(tt(t))}`);
      if (st.flowers[p].length === 8) { st.hands[p].push(st.wall.pop()); win(st, p, null, now, { eight: true }); return false; }
      if (wallLeft(st) <= 0) { drawGame(st, now); return false; }
      t = st.wall.pop();
    }
    st.hands[p].push(t); st.drawn = t; st.turn = p; st.phase = 'discard'; st.claim = null;
    st.deadline = st.tlimit ? now + st.tlimit * 1000 : 0;
    return true;
  }
  function pname(st, p) { return st.names[st.act[p]]; }
  function meldCount(st, p) { return st.melds[p].length; }
  function handTypes(st, p) { return st.hands[p].map(tt); }

  function drawGame(st, now) {
    st.phase = 'over'; st.result = { draw: true }; st.deadline = 0; st.log.push('流局（海底剩 16 張）');
    afterHand(st, true);
  }
  function afterHand(st, dealerStays) {
    st.handNo++;
    if (st.n === 5) { st.lian = 0; if (st.handNo % 5 === 0) st.windRound++; return; }
    if (dealerStays) st.lian++;
    else { st.lian = 0; st.dealer = (st.dealer + 1) % st.n; st.dealerMoves++; if (st.dealerMoves % st.n === 0) st.windRound++; }
  }
  function win(st, p, from, now, flags) {
    flags = flags || {};
    const types = handTypes(st, p); const winT = flags.eight ? -1 : tt(st.hands[p][st.hands[p].length - 1]);
    const beforeWin = types.slice(); if (winT >= 0) beforeWin.splice(beforeWin.lastIndexOf(winT), 1);
    const w = flags.eight ? 0 : waits(beforeWin, meldCount(st, p), inPlayTypes(st)).length;
    const zimo = from == null;
    const meldsInfo = st.melds[p].map(m => ({ k: m.k, t: m.t }));
    let tai = flags.eight ? { items: [], total: 0 } : calcTai({ handTypes: types, melds: meldsInfo, winT, zimo, flowers: st.flowers[p], seatWind: p, roundWind: st.windRound % 4, waitsN: w, last: wallLeft(st) <= 0, kongDraw: st.kongDraw && zimo, robKong: flags.robKong });
    if (flags.eight) { tai = calcTai({ handTypes: [], melds: [], winT: -1, zimo: true, flowers: st.flowers[p], seatWind: p, roundWind: 0, waitsN: 0, eight: true }); tai.items = tai.items.filter(x => /花|八仙/.test(x[0])); tai.total = tai.items.reduce((a, x) => a + x[1], 0); }
    // 結算
    const payers = zimo ? U.range(st.k).filter(q => q !== p) : [from];
    const pay = Array(st.n).fill(0); const lines = [];
    payers.forEach(q => {
      let t = tai.total; const dealerIn = p === 0 || q === 0;
      if (dealerIn) t += 1 + st.lian * 2;
      const amt = st.base + t * st.per;
      pay[st.act[q]] -= amt; pay[st.act[p]] += amt;
      lines.push(`${pname(st, q)} 付 ${amt}（${t} 台${dealerIn ? `，含莊家${st.lian ? `連${st.lian}拉${st.lian}` : ''}` : ''}）`);
    });
    pay.forEach((x, i) => st.total[i] += x);
    st.phase = 'over'; st.deadline = 0;
    st.result = { winner: p, from, zimo, tai, pay, lines, eight: !!flags.eight, winT };
    st.log.push(`${pname(st, p)} ${zimo ? '自摸' : `胡 ${pname(st, from)} 的 ${tname(winT)}`}！`);
    afterHand(st, p === 0);
  }

  function claimOptions(st, from, tile) {
    const t = tt(tile); const opts = {};
    for (let d = 1; d < st.k; d++) {
      const q = (from + d) % st.k; const ht = handTypes(st, q); const o = {};
      if (canWin(ht.concat([t]), meldCount(st, q))) o.hu = true;
      const same = ht.filter(x => x === t).length;
      if (wallLeft(st) > 0) {
        if (same >= 2) o.pong = true;
        if (same >= 3) o.kong = true;
        if (d === 1 && t < 27) {
          const has = (x) => x >= 0 && x < 27 && suitOf(x) === suitOf(t) && ht.includes(x);
          const ch = [];
          if (has(t - 2) && has(t - 1)) ch.push([t - 2, t - 1]);
          if (has(t - 1) && has(t + 1)) ch.push([t - 1, t + 1]);
          if (has(t + 1) && has(t + 2)) ch.push([t + 1, t + 2]);
          if (ch.length) o.chi = ch;
        }
      }
      if (Object.keys(o).length) opts[q] = o;
    }
    return opts;
  }
  function takeTypes(st, p, types) { // 從手上拿出指定牌種
    const got = [];
    types.forEach(t => { const i = st.hands[p].findIndex(id => tt(id) === t); got.push(st.hands[p].splice(i, 1)[0]); });
    return got;
  }
  function resolveClaim(st, now) {
    const c = st.claim; const order = U.range(st.k - 1).map(d => (c.from + 1 + d) % st.k);
    const r = (q) => c.resp[q] || {};
    const huer = order.find(q => r(q).type === 'hu');
    if (huer != null) {
      if (c.rob) { st.hands[huer].push(c.tile); win(st, huer, c.from, now, { robKong: true }); return; }
      const rv = st.river[c.from]; rv.pop();
      st.hands[huer].push(c.tile); win(st, huer, c.from, now); return;
    }
    if (c.rob) { // 沒人搶槓：完成加槓
      const m = st.melds[c.from][c.rob.mi]; m.k = 'kong'; m.tiles.push(c.tile);
      st.log.push(`${pname(st, c.from)} 加槓 ${tname(tt(c.tile))}`);
      st.kongDraw = true; drawFor(st, c.from, true, now); return;
    }
    const pk = order.find(q => r(q).type === 'pong' || r(q).type === 'kong');
    if (pk != null) {
      const kind = r(pk).type; const t = tt(c.tile); st.river[c.from].pop();
      const tiles = takeTypes(st, pk, kind === 'kong' ? [t, t, t] : [t, t]).concat([c.tile]);
      st.melds[pk].push({ k: kind === 'kong' ? 'kong' : 'pong', t, tiles, from: c.from });
      st.log.push(`${pname(st, pk)} ${kind === 'kong' ? '槓' : '碰'} ${tname(t)}`);
      st.claim = null; st.firstTurn = false;
      if (kind === 'kong') { st.kongDraw = true; drawFor(st, pk, true, now); }
      else { st.turn = pk; st.phase = 'discard'; st.drawn = null; st.kongDraw = false; st.deadline = st.tlimit ? now + st.tlimit * 1000 : 0; }
      return;
    }
    const nx = (c.from + 1) % st.k;
    if (r(nx).type === 'chi') {
      const combo = r(nx).combo; const t = tt(c.tile); st.river[c.from].pop();
      const tiles = takeTypes(st, nx, combo); tiles.push(c.tile);
      tiles.sort((a, b) => tt(a) - tt(b));
      st.melds[nx].push({ k: 'chi', t: Math.min(t, ...combo), tiles, from: c.from });
      st.log.push(`${pname(st, nx)} 吃 ${tname(t)}`);
      st.claim = null; st.turn = nx; st.phase = 'discard'; st.drawn = null; st.kongDraw = false; st.firstTurn = false;
      st.deadline = st.tlimit ? now + st.tlimit * 1000 : 0; return;
    }
    st.claim = null; st.kongDraw = false;
    drawFor(st, nx, false, now);
  }

  const M = {
    id: 'mahjong', name: '台灣麻將', icon: '🀄', min: 3, max: 5,
    desc: '台灣 16 張麻將。4 人標準；3 人拿掉萬子；5 人每局輪流一人下桌觀戰。可吃（上家）、碰、槓、胡，含花牌與常見台數（自摸、門清、碰碰胡、混一色、清一色、三元、四喜、暗刻、獨聽、海底、槓上開花、搶槓、嚦咕嚦咕…）。台數與付款由系統自動計算。',
    options: [
      { key: 'money', label: '底／台', choices: [['100/20', '100 底 20 台'], ['50/20', '50 底 20 台'], ['300/100', '300 底 100 台'], ['30/10', '30 底 10 台']], def: '100/20' },
      { key: 'tlimit', label: '出牌時間', choices: [[20, '20 秒'], [40, '40 秒'], [0, '不限']], def: 20 },
      { key: 'winds', label: '打幾圈', choices: [[1, '1 圈（東風圈）'], [4, '4 圈（一將）'], [99, '不限']], def: 1 }
    ],
    // 測試用
    _t: { tt, canWin, waits, calcTai, decomps, counts, claimOptions, tname },
    init(n, o, names, now) {
      const [base, per] = String(o.money || '100/20').split('/').map(Number);
      const st = { n, base, per, tlimit: +o.tlimit, winds: +o.winds, names: names || U.range(n).map(i => 'P' + i), dealer: 0, dealerMoves: 0, lian: 0, windRound: 0, handNo: 0, total: Array(n).fill(0) };
      newHand(st, now); return st;
    },
    action(st, seat, a, ctx) {
      const now = ctx.now; if (ctx.names && ctx.names.length) st.names = ctx.names;
      if (a.type === 'next') {
        if (st.phase !== 'over') return 'silent';
        if (st.windRound >= st.winds) { st.phase = 'end'; return; }
        newHand(st, now); return;
      }
      if (a.type === 'newgame') { if (st.phase !== 'end') return; const f = this.init(st.n, { money: st.base + '/' + st.per, tlimit: st.tlimit, winds: st.winds }, st.names, now); Object.keys(st).forEach(k => delete st[k]); Object.assign(st, f); return; }
      const p = st.act.indexOf(seat); if (p < 0) return '這局你下桌休息';
      if (st.phase === 'discard') {
        if (p !== st.turn) return '還沒輪到你';
        if (a.type === 'discard') {
          const i = st.hands[p].indexOf(+a.tile); if (i < 0) return '沒有這張牌';
          const tile = st.hands[p].splice(i, 1)[0]; st.river[p].push(tile); st.kongDraw = false; st.firstTurn = false;
          st.log.push(`${pname(st, p)} 打 ${tname(tt(tile))}`); if (st.log.length > 30) st.log.splice(0, 10);
          const opts = claimOptions(st, p, tile);
          if (Object.keys(opts).length) { st.phase = 'claim'; st.claim = { from: p, tile, opts, resp: {} }; st.deadline = now + 10000; }
          else drawFor(st, (p + 1) % st.k, false, now);
          return;
        }
        if (a.type === 'hu') {
          if (st.drawn == null) return '吃碰之後要先打牌';
          if (!canWin(handTypes(st, p), meldCount(st, p))) return '還不能胡';
          const i = st.hands[p].indexOf(st.drawn); if (i >= 0) { st.hands[p].splice(i, 1); st.hands[p].push(st.drawn); }
          win(st, p, null, now); return;
        }
        if (a.type === 'kong') {
          const t = +a.t;
          if (wallLeft(st) <= 0) return '海底不能槓';
          const ht = handTypes(st, p);
          if (ht.filter(x => x === t).length === 4) {
            const tiles = takeTypes(st, p, [t, t, t, t]);
            st.melds[p].push({ k: 'an', t, tiles }); st.log.push(`${pname(st, p)} 暗槓`);
            st.kongDraw = true; drawFor(st, p, true, now); return;
          }
          const mi = st.melds[p].findIndex(m => m.k === 'pong' && m.t === t);
          if (mi >= 0 && ht.includes(t)) {
            const tile = takeTypes(st, p, [t])[0];
            const opts = {};
            for (let d = 1; d < st.k; d++) { const q = (p + d) % st.k; if (canWin(handTypes(st, q).concat([t]), meldCount(st, q))) opts[q] = { hu: true }; }
            st.phase = 'claim'; st.claim = { from: p, tile, opts, resp: {}, rob: { mi } }; st.deadline = now + 10000;
            if (!Object.keys(opts).length) resolveClaim(st, now);
            return;
          }
          return '不能槓';
        }
        return 'silent';
      }
      if (st.phase === 'claim') {
        const c = st.claim; const o = c.opts[p]; if (!o || c.resp[p]) return 'silent';
        if (a.type === 'pass') c.resp[p] = { type: 'pass' };
        else if (a.type === 'hu' && o.hu) c.resp[p] = { type: 'hu' };
        else if (a.type === 'pong' && o.pong) c.resp[p] = { type: 'pong' };
        else if (a.type === 'kong' && o.kong) c.resp[p] = { type: 'kong' };
        else if (a.type === 'chi' && o.chi) { const cb = o.chi[a.i | 0]; if (!cb) return '吃法不對'; c.resp[p] = { type: 'chi', combo: cb }; }
        else return '不能這樣做';
        // 可以提早結算：有人胡且是順位最前的胡；或所有人都回覆
        const all = Object.keys(c.opts).every(q => c.resp[q]);
        if (all) resolveClaim(st, now);
        return;
      }
      return 'silent';
    },
    tick(st, now) {
      if (!st.deadline || now <= st.deadline) return false;
      if (st.phase === 'claim') { resolveClaim(st, now); return true; }
      if (st.phase === 'discard') {
        const p = st.turn; const tile = st.drawn != null && st.hands[p].includes(st.drawn) ? st.drawn : st.hands[p][st.hands[p].length - 1];
        this.action(st, st.act[p], { type: 'discard', tile }, { now, names: [] }); st.log.push('（時間到自動打牌）'); return true;
      }
      return false;
    },
    view(st, seat) {
      const p = st.act ? st.act.indexOf(seat) : -1;
      const k = st.k;
      const players = U.range(k).map(q => ({
        seat: st.act[q], wind: WIND[q], count: st.hands[q].length, melds: st.melds[q].map(m => ({ k: m.k, tiles: m.k === 'an' && q !== p && st.phase !== 'over' ? m.tiles.map(() => -1) : m.tiles })),
        flowers: st.flowers[q], river: st.river[q], dealer: q === 0,
        hand: (st.phase === 'over' || st.phase === 'end') ? st.hands[q] : null
      }));
      let me = null;
      if (p >= 0) {
        const hand = st.hands[p].slice();
        const ht = hand.map(tt);
        me = { p, hand, drawn: st.turn === p && st.phase === 'discard' ? st.drawn : null, actions: {} };
        if (st.phase === 'discard' && st.turn === p) {
          if (st.drawn != null && canWin(ht, meldCount(st, p))) me.actions.hu = true;
          const ks = [];
          if (wallLeft(st) > 0) {
            const c = counts(ht); for (let t = 0; t < 34; t++) if (c[t] === 4) ks.push(t);
            st.melds[p].forEach(m => { if (m.k === 'pong' && ht.includes(m.t)) ks.push(m.t); });
          }
          if (ks.length) me.actions.kong = ks;
          // 打哪張可以聽
          const tips = {};
          const uniq = [...new Set(ht)];
          uniq.forEach(t => { const rest = ht.slice(); rest.splice(rest.indexOf(t), 1); const w = waits(rest, meldCount(st, p), inPlayTypes(st)); if (w.length) tips[t] = w; });
          me.tips = tips;
        } else {
          if (ht.length % 3 === 1) me.waits = waits(ht, meldCount(st, p), inPlayTypes(st));
        }
        if (st.phase === 'claim' && st.claim.opts[p] && !st.claim.resp[p]) me.claim = st.claim.opts[p];
      }
      return {
        phase: st.phase, k, act: st.act, sitter: st.sitter, turn: st.turn, players, me, wall: Math.max(0, wallLeft(st)),
        claim: st.claim ? { from: st.claim.from, tile: st.claim.tile, rob: !!st.claim.rob, waiting: Object.keys(st.claim.opts).length > 0 } : null,
        lastDiscard: st.phase === 'claim' ? st.claim.tile : null,
        deadline: st.deadline, log: st.log.slice(-6), result: st.result, total: st.total, roundWind: WIND[st.windRound % 4], handNo: st.handNo, lian: st.lian,
        winds: st.winds, windRound: st.windRound
      };
    },

    // ================= 畫面 =================
    tile(id, cls) {
      if (id == null) return '';
      if (id < 0) return `<span class="mt back ${cls || ''}"></span>`;
      const t = tt(id); let inner, c = '';
      if (t < 9) { inner = `<b>${CN[t]}</b><i>萬</i>`; c = 'man'; }
      else if (t < 18) { inner = `<b>${t - 8}</b><i>筒</i>`; c = 'pin'; }
      else if (t < 27) { inner = `<b>${t - 17}</b><i>條</i>`; c = 'sou'; }
      else if (t < 34) { inner = `<b class="h">${HON[t - 27]}</b>`; c = ['wind', 'wind', 'wind', 'wind', 'chun', 'fa', 'bai'][t - 27]; }
      else { inner = `<b class="h">${FLW[t - 34]}</b><i>${(t - 34) % 4 + 1}</i>`; c = 'flw'; }
      return `<span class="mt ${c} ${cls || ''}" data-id="${id}">${inner}</span>`;
    },
    _sel: null,
    render(el, v, ui) {
      el.dataset.g = 'mahjong';
      const me = v.me; const T = (id, c) => this.tile(id, c);
      const myP = me ? me.p : -1;
      // 以自己為下方，其他人依序
      const order = U.range(v.k).map(i => ((myP >= 0 ? myP : 0) + i) % v.k);
      const meldHTML = (pl, small) => pl.melds.map(m => `<span class="meld">${m.tiles.map(id => T(id, small ? 'sm' : '')).join('')}</span>`).join('');
      const opp = order.slice(myP >= 0 ? 1 : 0).map(q => {
        const pl = v.players[q];
        return `<div class="mj-opp ${v.turn === q && (v.phase === 'discard') ? 'turn' : ''}">
          <div class="mj-name"><span class="wind">${pl.wind}${pl.dealer ? '莊' : ''}</span>${U.esc(v.names[pl.seat])} <small>${pl.count} 張 · ${v.total[pl.seat] >= 0 ? '+' : ''}${v.total[pl.seat]}</small></div>
          <div class="mj-melds">${pl.flowers.map(id => T(id, 'sm')).join('')}${meldHTML(pl, true)}</div>
          ${pl.hand ? `<div class="mj-reveal">${pl.hand.slice().sort((a, b) => tt(a) - tt(b)).map(id => T(id, 'sm')).join('')}</div>` : ''}
          <div class="mj-river">${pl.river.map((id, i) => T(id, 'xs' + (v.lastDiscard === id && i === pl.river.length - 1 ? ' last' : ''))).join('')}</div>
        </div>`;
      }).join('');
      const mine = myP >= 0 ? v.players[myP] : null;
      let hand = me ? me.hand.slice() : [];
      const drawn = me && me.drawn != null ? me.drawn : null;
      hand = hand.filter(id => id !== drawn).sort((a, b) => tt(a) - tt(b) || a - b);
      const myTurn = me && v.phase === 'discard' && v.turn === myP;
      if (this._sel != null && !(me && me.hand.includes(this._sel))) this._sel = null;
      const tips = (me && me.tips) || {};
      const res = v.result;
      const center = v.phase === 'claim' ? `<div class="mj-center">${U.esc(v.names[v.players[v.claim.from].seat])} ${v.claim.rob ? '加槓' : '打出'} ${T(v.claim.tile, 'big')} <span class="timer" data-deadline="${v.deadline}"></span></div>`
        : v.phase === 'discard' ? `<div class="mj-center">輪到 <b>${U.esc(v.names[v.players[v.turn].seat])}</b> <span class="timer" data-deadline="${v.deadline || ''}"></span></div>` : '';
      el.innerHTML = `
        <div class="mj-info">${v.roundWind}風圈 第${v.handNo + (v.phase === 'over' || v.phase === 'end' ? 0 : 1)}局${v.lian ? ` · 連${v.lian}` : ''} · 剩 ${v.wall} 張${v.sitter >= 0 ? ` · ${U.esc(v.names[v.sitter])} 這局休息` : ''}</div>
        <div class="mj-opps">${opp}</div>
        ${center}
        ${(v.phase === 'over' || v.phase === 'end') ? this._resultHTML(v, res) : ''}
        <div class="mj-log">${v.log.slice(-3).map(U.esc).join('<br>')}</div>
        ${mine ? `<div class="mj-me ${myTurn ? 'turn' : ''}">
          <div class="mj-name"><span class="wind">${mine.wind}${mine.dealer ? '莊' : ''}</span>你 <small>${v.total[mine.seat] >= 0 ? '+' : ''}${v.total[mine.seat]}</small>
            ${me.waits && me.waits.length ? `<span class="waits">聽：${me.waits.map(t => tname(t)).join('、')}</span>` : ''}</div>
          <div class="mj-melds">${mine.flowers.map(id => T(id, 'sm')).join('')}${meldHTML(mine, false)}</div>
          <div class="mj-river mine">${mine.river.map(id => T(id, 'xs')).join('')}</div>
          <div class="mj-hand">${hand.map(id => T(id, (this._sel === id ? 'sel ' : '') + (tips[tt(id)] ? 'ting' : ''))).join('')}${drawn != null ? `<span class="gap"></span>${T(drawn, 'drawn ' + (this._sel === drawn ? 'sel ' : '') + (tips[tt(drawn)] ? 'ting' : ''))}` : ''}</div>
          ${this._sel != null && tips[tt(this._sel)] ? `<div class="hint">打 ${tname(tt(this._sel))} 可聽：${tips[tt(this._sel)].map(tname).join('、')}</div>` : ''}
          <div class="act-row mj-acts">${this._actions(v, me, myTurn)}</div>
        </div>` : '<p class="spec-note">' + (v.sitter >= 0 && me == null && v.names[v.sitter] ? '觀戰中（5 人局每局輪一人休息）' : '觀戰中') + '</p>'}`;
      el.querySelectorAll('.mj-hand .mt').forEach(t => t.onclick = () => {
        if (!myTurn) return; const id = +t.dataset.id;
        if (this._sel === id) { ui.send({ type: 'discard', tile: id }); this._sel = null; }
        else { this._sel = id; this.render(el, v, ui); }
      });
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const a = b.dataset.a;
        if (a === 'discard') { if (this._sel != null) ui.send({ type: 'discard', tile: this._sel }); this._sel = null; }
        else if (a === 'kong') ui.send({ type: 'kong', t: +b.dataset.t });
        else if (a === 'chi') ui.send({ type: 'chi', i: +b.dataset.i });
        else ui.send({ type: a });
      });
    },
    _actions(v, me, myTurn) {
      if (!me) return '';
      let h = '';
      if (me.claim) {
        const c = me.claim;
        if (c.hu) h += `<button class="btn danger" data-a="hu">胡！</button>`;
        if (c.kong) h += `<button class="btn" data-a="kong">槓</button>`;
        if (c.pong) h += `<button class="btn" data-a="pong">碰</button>`;
        if (c.chi) h += c.chi.map((cb, i) => `<button class="btn" data-a="chi" data-i="${i}">吃 ${cb.map(t => tname(t)).join('')}</button>`).join('');
        h += `<button class="btn ghost" data-a="pass">過</button>`;
        return h;
      }
      if (myTurn) {
        if (me.actions.hu) h += `<button class="btn danger" data-a="hu">自摸！</button>`;
        (me.actions.kong || []).forEach(t => h += `<button class="btn" data-a="kong" data-t="${t}">槓 ${tname(t)}</button>`);
        h += `<button class="btn" data-a="discard" ${this._sel != null ? '' : 'disabled'}>打出</button><span class="hint">點兩下直接打出</span>`;
        return h;
      }
      if (v.phase === 'claim' && v.claim.waiting) return '<span class="hint">等待其他玩家決定吃碰胡…</span>';
      return '';
    },
    _resultHTML(v, res) {
      let h = '<div class="mj-result">';
      if (res && res.draw) h += '<h3>流局</h3><p>莊家連莊</p>';
      else if (res) {
        const wp = v.players[res.winner];
        h += `<h3>🎉 ${U.esc(v.names[wp.seat])} ${res.eight ? '八仙過海' : res.zimo ? '自摸' : '胡牌'}！</h3>`;
        h += `<div class="mj-reveal">${(wp.hand || []).slice().sort((a, b) => tt(a) - tt(b)).map(id => this.tile(id, 'sm')).join('')}</div>`;
        h += `<p class="tai">${res.tai.items.map(x => `${x[0]} ${x[1]}台`).join('、') || '屁胡（0 台）'}<br><b>共 ${res.tai.total} 台</b></p>`;
        h += `<p>${res.lines.map(U.esc).join('<br>')}</p>`;
      }
      if (v.phase === 'end') {
        const rank = v.total.map((x, i) => [i, x]).sort((a, b) => b[1] - a[1]);
        h += `<h3>整場結束</h3>${rank.map(([i, x]) => `<p>${U.esc(v.names[i])}：${x >= 0 ? '+' : ''}${x}</p>`).join('')}`;
        if (v.me || v.seat >= 0) h += `<button class="btn" data-a="newgame">重新開一場</button>`;
      } else if (v.seat >= 0) {
        h += `<button class="btn" data-a="next">${v.windRound >= v.winds ? '看總結' : '下一局'}</button>`;
      }
      return h + '</div>';
    }
  };
  root.GAMES.mahjong = M;
})(typeof window !== 'undefined' ? window : globalThis);
