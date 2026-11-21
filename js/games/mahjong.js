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
      if (o.heaven) add(o.heaven[0], o.heaven[1]); // 天胡／地胡／人胡：取代門清、自摸、獨聽
      else if (o.zimo && menqing) add('門清自摸（不求人）', 3); else { if (o.zimo) add('自摸', 1); if (menqing) add('門清', 1); }
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
      if (o.waitsN === 1 && !d.special && !o.heaven) add('獨聽', 1);
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
    if (checkSeven(st, now)) return;
  }
  // 七搶一：有人湊到 7 張花、第 8 張在別人手上 → 7 張的人直接胡，搶走那張花
  function checkSeven(st, now) {
    const x = st.flowers.findIndex(f => f.length === 7); if (x < 0) return false;
    const y = st.flowers.findIndex((f, i) => i !== x && f.length === 1); if (y < 0) return false;
    st.flowers[x].push(st.flowers[y].pop()); win(st, x, y, now, { seven: true }); return true;
  }
  const RESERVE = 16;
  function wallLeft(st) { return st.wall.length - RESERVE; }

  function drawFor(st, p, fromBack, now) {
    if (wallLeft(st) <= 0) { drawGame(st, now); return false; }
    let t = fromBack ? st.wall.pop() : st.wall.shift();
    while (isFlower(t)) {
      st.flowers[p].push(t); st.log.push(`${pname(st, p)} 補花 ${tname(tt(t))}`);
      if (st.flowers[p].length === 8) { st.hands[p].push(st.wall.pop()); win(st, p, null, now, { eight: true }); return false; }
      if (checkSeven(st, now)) return false;
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
    const special = flags.eight || flags.seven;
    const types = handTypes(st, p); const winT = special ? -1 : tt(st.hands[p][st.hands[p].length - 1]);
    const beforeWin = types.slice(); if (winT >= 0) beforeWin.splice(beforeWin.lastIndexOf(winT), 1);
    const w = special ? 0 : waits(beforeWin, meldCount(st, p), inPlayTypes(st)).length;
    const zimo = from == null;
    const meldsInfo = st.melds[p].map(m => ({ k: m.k, t: m.t }));
    // 天胡（莊家第一手自摸）、地胡（閒家第一次摸牌就自摸）、人胡（閒家還沒打過牌就胡別人的牌）；中途有人吃碰槓就不算
    let heaven = null;
    if (!special && !flags.robKong && st.melds.every(m => !m.length) && !st.river[p].length) {
      if (zimo && p === 0 && st.river.every(r => !r.length)) heaven = ['天胡', 24];
      else if (zimo && p !== 0) heaven = ['地胡', 16];
      else if (!zimo && p !== 0) heaven = ['人胡', 8];
    }
    let tai = special ? { items: [], total: 0 } : calcTai({ heaven, handTypes: types, melds: meldsInfo, winT, zimo, flowers: st.flowers[p], seatWind: p, roundWind: st.windRound % 4, waitsN: w, last: wallLeft(st) <= 0, kongDraw: st.kongDraw && zimo, robKong: flags.robKong });
    // 八仙過海（三家付）、七搶一（只有被搶的那家付）：都是固定 8 台，不再加正花、花槓
    if (flags.eight) tai = { items: [['八仙過海', 8]], total: 8 };
    if (flags.seven) tai = { items: [['七搶一', 8]], total: 8 };
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
    st.result = { winner: p, from, zimo, tai, pay, lines, eight: !!special, seven: !!flags.seven, winT };
    st.log.push(`${pname(st, p)} ${flags.seven ? `七搶一，搶走 ${pname(st, from)} 的花` : zimo ? '自摸' : `胡 ${pname(st, from)} 的 ${tname(winT)}`}！`);
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


  // ===================== 電腦玩家（會算牌） =====================
  // 向聽數：還差幾步聽牌（0＝聽牌、-1＝胡了）。面子不夠時，搭子（兩張差一張）也算半步
  // 每個花色分開拆（面子 m、搭子 t、雀頭 p 的所有組合），同樣的花色排列只算一次
  const SUIT_CACHE = new Map();
  function suitOpts(c, off, honor) {
    const a = c.slice(off, off + (honor ? 7 : 9)); const key = (honor ? 'h' : 's') + a.join('');
    let r = SUIT_CACHE.get(key); if (r) return r;
    const found = new Map();
    const rec = (i, m, t, p) => {
      while (i < a.length && !a[i]) i++;
      if (i === a.length) { const k = m * 100 + t * 10 + p; found.set(k, [m, t, p]); return; }
      if (a[i] >= 3) { a[i] -= 3; rec(i, m + 1, t, p); a[i] += 3; }
      if (!honor && i <= 6 && a[i + 1] && a[i + 2]) { a[i]--; a[i + 1]--; a[i + 2]--; rec(i, m + 1, t, p); a[i]++; a[i + 1]++; a[i + 2]++; }
      if (a[i] >= 2) { a[i] -= 2; if (!p) rec(i, m, t, 1); rec(i, m, t + 1, p); a[i] += 2; }
      if (!honor) {
        if (i <= 7 && a[i + 1]) { a[i]--; a[i + 1]--; rec(i, m, t + 1, p); a[i]++; a[i + 1]++; }
        if (i <= 6 && a[i + 2]) { a[i]--; a[i + 2]--; rec(i, m, t + 1, p); a[i]++; a[i + 2]++; }
      }
      a[i]--; rec(i, m, t, p); a[i]++;
    };
    rec(0, 0, 0, 0);
    // 只留下不會被別的組合完全比下去的
    const all = [...found.values()];
    r = all.filter(x => !all.some(y => y !== x && y[0] >= x[0] && y[1] >= x[1] && y[2] >= x[2] && (y[0] > x[0] || y[1] > x[1] || y[2] > x[2])));
    SUIT_CACHE.set(key, r); return r;
  }
  // 向聽數：還差幾步聽牌（0＝聽牌、-1＝胡了）
  function shanten(c, need) {
    let combos = [[0, 0, 0]];
    for (const [off, h] of [[0, 0], [9, 0], [18, 0], [27, 1]]) {
      const o = suitOpts(c, off, h); const next = new Map();
      for (const x of combos) for (const y of o) {
        if (x[2] + y[2] > 1) continue;
        const m = x[0] + y[0], t = x[1] + y[1], p = x[2] + y[2];
        next.set(m * 1000 + Math.min(t, 9) * 10 + p, [m, Math.min(t, 9), p]);
      }
      combos = [...next.values()];
    }
    let best = 2 * need;
    for (const [m0, t, p] of combos) { const m = Math.min(m0, need); const v = 2 * need - 2 * m - Math.min(t, need - m) - p; if (v < best) best = v; }
    return best;
  }
  function makeAI(st) {
    const memo = new Map();
    const sh = (c, need) => { const k = need + ':' + c.join(''); let v = memo.get(k); if (v == null) { v = shanten(c, need); memo.set(k, v); } return v; };
    const seen = Array(34).fill(0);
    const lo = st.k === 3 ? 9 : 0;
    st.river.forEach(r => r.forEach(id => { if (!isFlower(id)) seen[tt(id)]++; }));
    st.melds.forEach(ms => ms.forEach(m => m.tiles.forEach(id => seen[tt(id)]++)));
    const unseen = (t, c) => Math.max(0, 4 - seen[t] - c[t]);
    // 打掉一張後（手上 3n+1 張）的進張數
    const ukeire = (c, need, base) => { let n = 0; for (let t = lo; t < 34; t++) { if (c[t] >= 4) continue; c[t]++; if (sh(c, need) < base) n += unseen(t, c); c[t]--; } return n; };
    // 字牌的價值：三元牌、自己的門風、圈風做成刻子有台
    const valueHonor = (p, t) => t >= 31 || t === 27 + p || t === 27 + (st.windRound % 4);
    // 危險度：別人打過的同一張比較安全；中張最危險；看得到 3 張的字牌幾乎安全
    const danger = (p, t) => {
      let d = 0;
      for (let q = 0; q < st.k; q++) {
        if (q === p) continue;
        const threat = st.melds[q].length >= 3 || (st.melds[q].length >= 2 && wallLeft(st) < 40) || wallLeft(st) < 24;
        if (!threat) continue;
        if (st.river[q].some(id => tt(id) === t)) continue;
        if (isHonor(t)) d += seen[t] >= 2 ? 0.3 : 1.5;
        else { const r = t % 9; d += (r >= 3 && r <= 5) ? 4 : (r === 0 || r === 8) ? 2 : 3; }
      }
      return d;
    };
    function bestDiscard(p) {
      const hand = st.hands[p]; const c = counts(hand.map(tt)); const need = 5 - st.melds[p].length;
      const nowSh = sh(c, need) ;
      const late = wallLeft(st) < 24;
      // 某一門花色特別多（含字牌）→ 往混一色／清一色做，別的花色先丟
      const sc = [0, 0, 0]; hand.forEach(id => { const t = tt(id); if (!isHonor(t)) sc[suitOf(t)]++; });
      st.melds[p].forEach(m => { if (!isHonor(m.t)) sc[suitOf(m.t)] += 3; });
      const dom = sc.indexOf(Math.max(...sc)); const chase = sc[dom] >= 9 && nowSh >= 1;
      let best = null;
      for (const t of [...new Set(hand.map(tt))]) {
        c[t]--; const s2 = sh(c, need); const uk = s2 <= 3 ? ukeire(c, need, s2) : 0; c[t]++;
        // 分數越低越好：先看向聽、再看進張；孤張字牌優先丟，有台的字牌湊成對就留
        let score = s2 * 1000 - uk * 10;
        if (isHonor(t)) score += c[t] >= 2 ? (valueHonor(p, t) ? 40 : 15) : (valueHonor(p, t) ? -5 : -20);
        else { const r = t % 9; if (r === 0 || r === 8) score -= 6; else if (r === 1 || r === 7) score -= 2; }
        if (chase) score += (!isHonor(t) && suitOf(t) !== dom) ? -80 : 60;
        const dg = danger(p, t);
        // 離聽牌還遠又有人快胡了 → 安全第一
        if (s2 >= 2 && (late || dg > 0) && nowSh >= 2) score += dg * 400; else score += dg * (s2 === 0 ? 5 : 40);
        if (!best || score < best.score) best = { t, score, s2 };
      }
      const id = (st.drawn != null && hand.includes(st.drawn) && tt(st.drawn) === best.t) ? st.drawn : hand.filter(x => tt(x) === best.t).pop();
      return id;
    }
    // 吃碰之後要打掉一張：回傳打完最好的向聽
    function afterClaimSh(c, need) { let b = 99; for (let t = 0; t < 34; t++) if (c[t]) { c[t]--; const v = sh(c, need); c[t]++; if (v < b) b = v; } return b; }
    function claimDecision(q, o, tile) {
      if (o.hu) return { type: 'hu' };
      const t = tt(tile); const c = counts(st.hands[q].map(tt)); const need = 5 - st.melds[q].length;
      const cur = sh(c, need);
      const open = st.melds[q].some(m => m.k !== 'an');
      const opts = [];
      if (o.pong) { c[t] -= 2; opts.push({ a: { type: 'pong' }, s: afterClaimSh(c, need - 1), val: valueHonor(q, t) }); c[t] += 2; }
      if (o.kong && open) { c[t] -= 3; const v = sh(c, need - 1); c[t] += 3; if (v <= cur) opts.push({ a: { type: 'kong' }, s: v - 0.5 }); }
      if (o.chi) o.chi.forEach((cb, i) => { c[cb[0]]--; c[cb[1]]--; opts.push({ a: { type: 'chi', i }, s: afterClaimSh(c, need - 1) + 0.1 }); c[cb[0]]++; c[cb[1]]++; });
      opts.sort((a, b) => a.s - b.s);
      const b = opts[0];
      if (!b || b.s >= cur) return { type: 'pass' };
      // 門清還很遠的時候不要隨便吃碰（門清有台）；有台的字牌、已經開門、快聽了、牌快摸完 → 吃碰
      if (b.val || open || b.s <= 1 || wallLeft(st) < 36) return b.a;
      return { type: 'pass' };
    }
    function ownKong(p) {
      if (wallLeft(st) <= 0) return null;
      const hand = st.hands[p]; const c = counts(hand.map(tt)); const need = 5 - st.melds[p].length; const cur = sh(c, need);
      for (let t = 0; t < 34; t++) {
        if (c[t] === 4) { c[t] -= 4; const v = sh(c, need - 1); c[t] += 4; if (v <= cur) return { type: 'kong', t }; }
        if (c[t] && st.melds[p].some(m => m.k === 'pong' && m.t === t)) { c[t]--; const v = sh(c, need); c[t]++; if (v <= cur) return { type: 'kong', t }; }
      }
      return null;
    }
    return { bestDiscard, claimDecision, ownKong };
  }
  const M = {
    id: 'mahjong', name: '台灣麻將', icon: '🀄', min: 3, max: 5,
    desc: '台灣 16 張麻將。4 人標準；3 人拿掉萬子；5 人每局輪流一人下桌觀戰。可吃（上家）、碰、槓、胡，含花牌與常見台數（自摸、門清、碰碰胡、混一色、清一色、三元、四喜、暗刻、獨聽、海底、槓上開花、搶槓、嚦咕嚦咕、天胡 24／地胡 16／人胡 8、八仙過海／七搶一 8…）。台數與付款由系統自動計算。',
    options: [
      { key: 'money', label: '底／台', choices: [['100/20', '100 底 20 台'], ['50/20', '50 底 20 台'], ['300/100', '300 底 100 台'], ['30/10', '30 底 10 台']], def: '100/20' },
      { key: 'tlimit', label: '出牌時間', choices: [[20, '20 秒'], [40, '40 秒'], [0, '不限']], def: 20 },
      { key: 'winds', label: '打幾圈', choices: [[1, '1 圈（東風圈）'], [4, '4 圈（一將）'], [99, '不限']], def: 1 }
    ],
    // 測試用
    _t: { tt, canWin, waits, calcTai, decomps, counts, claimOptions, tname, shanten, checkSeven },
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
    // 電腦／託管／斷線代打。房主每個 tick 都會問，同一個局面只算一次
    _memo: null,
    auto(st) {
      if (st.phase !== 'claim' && st.phase !== 'discard') return null;
      const key = [st.handNo, st.phase, st.turn, st.wall.length, st.river.map(r => r.length).join('.'), st.melds.map(m => m.length).join('.'), st.claim ? Object.keys(st.claim.resp).join('.') : ''].join('|');
      if (this._memo && this._memo.key === key) return this._memo.r;
      let r = null;
      try { r = this._think(st); } catch (e) { r = null; }
      if (!r) r = this._dumb(st);
      this._memo = { key, r }; return r;
    },
    _think(st) {
      const ai = makeAI(st);
      if (st.phase === 'claim') {
        const q = Object.keys(st.claim.opts).map(Number).find(q => !st.claim.resp[q]); if (q == null) return null;
        return { seat: st.act[q], a: ai.claimDecision(q, st.claim.opts[q], st.claim.tile) };
      }
      const p = st.turn; const h = st.hands[p];
      if (st.drawn != null && canWin(h.map(tt), st.melds[p].length)) return { seat: st.act[p], a: { type: 'hu' } };
      if (st.drawn != null) { const k = ai.ownKong(p); if (k) return { seat: st.act[p], a: k }; }
      return { seat: st.act[p], a: { type: 'discard', tile: ai.bestDiscard(p) } };
    },
    _dumb(st) {
      if (st.phase === 'claim') { const q = Object.keys(st.claim.opts).map(Number).find(q => !st.claim.resp[q]); if (q == null) return null; return { seat: st.act[q], a: { type: st.claim.opts[q].hu ? 'hu' : 'pass' } }; }
      const p = st.turn; const h = st.hands[p];
      if (st.drawn != null && canWin(h.map(tt), st.melds[p].length)) return { seat: st.act[p], a: { type: 'hu' } };
      const tile = st.drawn != null && h.includes(st.drawn) ? st.drawn : h[h.length - 1];
      return { seat: st.act[p], a: { type: 'discard', tile } };
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
      // 有沒有人聽牌（只給背景音樂變緊張用，不透露是誰）
      let tense = false;
      if (st.phase === 'discard' || st.phase === 'claim') {
        const key = st.log.length + ':' + wallLeft(st) + ':' + st.turn;
        if (this._tenseKey === key) tense = this._tense;
        else { for (let q = 0; q < k && !tense; q++) { const t = handTypes(st, q); if (t.length % 3 === 1 && waits(t, meldCount(st, q), inPlayTypes(st)).length) tense = true; } this._tenseKey = key; this._tense = tense; }
      }
      return {
        phase: st.phase, k, act: st.act, sitter: st.sitter, turn: st.turn, players, me, wall: Math.max(0, wallLeft(st)), tense,
        claim: st.claim ? { from: st.claim.from, tile: st.claim.tile, rob: !!st.claim.rob, waiting: Object.keys(st.claim.opts).length > 0 } : null,
        lastDiscard: st.phase === 'claim' ? st.claim.tile : null,
        deadline: st.deadline, log: st.log.slice(-6), result: st.result, total: st.total, roundWind: WIND[st.windRound % 4], handNo: st.handNo, lian: st.lian,
        winds: st.winds, windRound: st.windRound
      };
    },

    // ================= 畫面 =================
    // 牌面用 SVG 畫成實體麻將：筒是圓點、條是竹子（一條是鳥）、萬是數字＋紅色萬字
    face(t) {
      const C = this._faces || (this._faces = {}); if (C[t]) return C[t];
      const SERIF = "'Songti TC','STSong','Noto Serif TC','PMingLiU',serif";
      const svg = (body) => `<svg viewBox="0 0 60 80" aria-hidden="true">${body}</svg>`;
      const dot = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${r * 0.72}" fill="#fffef6"/><circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${r * 0.22}" fill="#fffef6"/>`;
      const B = '#1f5fa8', G = '#1f8a4c', R = '#c8262c';
      const stick = (x, y, h, c, rot) => `<g transform="translate(${x} ${y})${rot ? ` rotate(${rot})` : ''}"><rect x="-3.6" y="${-h / 2}" width="7.2" height="${h}" rx="3.2" fill="${c}"/><rect x="-1.2" y="${-h / 2 + 2}" width="2.4" height="${h - 4}" rx="1.2" fill="#fffef6" opacity=".55"/><rect x="-4.4" y="-1.3" width="8.8" height="2.6" rx="1.2" fill="${c}"/><rect x="-4.4" y="${-h / 2 + 1}" width="8.8" height="2.2" rx="1" fill="${c}"/><rect x="-4.4" y="${h / 2 - 3.2}" width="8.8" height="2.2" rx="1" fill="${c}"/></g>`;
      let body = '';
      if (t < 9) { // 萬：上面數字、下面紅色「萬」
        body = `<text x="30" y="34" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="30" fill="#1b2a5e">${CN[t]}</text><text x="30" y="70" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="32" fill="${R}">萬</text>`;
      } else if (t < 18) { // 筒
        const n = t - 8;
        const L = { 1: [[30, 40, 22, B]], 2: [[30, 22, 12, G], [30, 58, 12, B]], 3: [[15, 16, 10, B], [30, 40, 10, R], [45, 64, 10, G]],
          4: [[17, 22, 11, B], [43, 22, 11, G], [17, 58, 11, G], [43, 58, 11, B]], 5: [[16, 18, 10, B], [44, 18, 10, G], [30, 40, 10, R], [16, 62, 10, G], [44, 62, 10, B]],
          6: [[17, 15, 9, G], [43, 15, 9, G], [17, 43, 9, R], [43, 43, 9, R], [17, 65, 9, R], [43, 65, 9, R]],
          7: [[13, 11, 7.5, G], [30, 19, 7.5, G], [47, 27, 7.5, G], [17, 46, 8, R], [43, 46, 8, R], [17, 66, 8, R], [43, 66, 8, R]],
          8: [[17, 11, 8, B], [43, 11, 8, B], [17, 30, 8, B], [43, 30, 8, B], [17, 50, 8, B], [43, 50, 8, B], [17, 69, 8, B], [43, 69, 8, B]],
          9: [[13, 15, 8, B], [30, 15, 8, B], [47, 15, 8, B], [13, 40, 8, R], [30, 40, 8, R], [47, 40, 8, R], [13, 65, 8, G], [30, 65, 8, G], [47, 65, 8, G]] }[n];
        body = n === 1 ? `<circle cx="30" cy="40" r="24" fill="${G}"/><circle cx="30" cy="40" r="19" fill="#fffef6"/>${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.283; return `<circle cx="${30 + Math.cos(a) * 15}" cy="${40 + Math.sin(a) * 15}" r="2.6" fill="${B}"/>`; }).join('')}<circle cx="30" cy="40" r="9" fill="${R}"/><circle cx="30" cy="40" r="4.5" fill="#fffef6"/><circle cx="30" cy="40" r="2" fill="${R}"/>`
          : L.map(([x, y, r, c]) => dot(x, y, r, c)).join('');
      } else if (t < 27) { // 條
        const n = t - 17;
        if (n === 1) body = `<g transform="translate(30 42)"><path d="M-14 6 Q-26 -6 -16 -20 Q-6 -26 2 -18 Q8 -10 4 2 Z" fill="${G}"/><circle cx="-6" cy="-20" r="7" fill="${G}"/><circle cx="-8" cy="-21" r="2" fill="#fffef6"/><circle cx="-8" cy="-21" r="1" fill="#111"/><path d="M-13 -21 L-20 -18 L-13 -17 Z" fill="#e0a020"/><path d="M-4 -27 Q0 -34 -6 -30 Q-2 -36 -9 -31" stroke="${R}" stroke-width="2" fill="none"/><path d="M2 0 Q14 -4 22 6 Q12 4 8 12 Q16 14 18 26 Q8 18 2 22 Q4 14 -2 8 Z" fill="${R}"/><path d="M-6 6 L-8 20 M-2 6 L0 20" stroke="#8a5a20" stroke-width="2"/></g>`;
        else {
          const g = G, r = R, b = B;
          const L = { 2: [[30, 22, 28, g], [30, 58, 28, b]], 3: [[30, 22, 28, g], [18, 58, 28, b], [42, 58, 28, b]], 4: [[18, 22, 28, b], [42, 22, 28, g], [18, 58, 28, g], [42, 58, 28, b]],
            5: [[14, 22, 28, g], [46, 22, 28, b], [30, 40, 28, r], [14, 58, 28, b], [46, 58, 28, g]], 6: [[14, 22, 28, g], [30, 22, 28, g], [46, 22, 28, g], [14, 58, 28, b], [30, 58, 28, b], [46, 58, 28, b]],
            7: [[30, 13, 20, r], [14, 40, 22, g], [30, 40, 22, g], [46, 40, 22, g], [14, 66, 22, b], [30, 66, 22, b], [46, 66, 22, b]],
            8: [[12, 22, 28, g, -22], [24, 22, 28, g, 22], [36, 22, 28, g, -22], [48, 22, 28, g, 22], [12, 58, 28, b, 22], [24, 58, 28, b, -22], [36, 58, 28, b, 22], [48, 58, 28, b, -22]],
            9: [[14, 15, 22, b], [30, 15, 22, r], [46, 15, 22, g], [14, 40, 22, b], [30, 40, 22, r], [46, 40, 22, g], [14, 65, 22, b], [30, 65, 22, r], [46, 65, 22, g]] }[n];
          body = L.map(([x, y, h, c, rot]) => stick(x, y, h, c, rot)).join('');
        }
      } else if (t < 34) { // 字牌
        const k = t - 27;
        if (k === 6) body = `<rect x="11" y="12" width="38" height="56" rx="4" fill="none" stroke="${B}" stroke-width="3.5"/><rect x="17" y="18" width="26" height="44" rx="2" fill="none" stroke="${B}" stroke-width="1.5"/>`;
        else body = `<text x="30" y="56" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="42" fill="${k === 4 ? R : k === 5 ? G : '#1b2a5e'}">${HON[k]}</text>`;
      } else { // 花牌：季節與梅蘭竹菊
        const k = t - 34, col = ['#2f9e44', '#e8590c', '#c2255c', '#1c7ed6', '#c92a2a', '#7048e8', '#2b8a3e', '#d9a400'][k];
        body = `<text x="8" y="17" font-family="${SERIF}" font-weight="900" font-size="13" fill="${col}">${k % 4 + 1}</text><text x="30" y="58" text-anchor="middle" font-family="${SERIF}" font-weight="900" font-size="38" fill="${col}">${FLW[k]}</text>`;
      }
      return (C[t] = svg(body));
    },
    tile(id, cls) {
      if (id == null) return '';
      if (id < 0) return `<span class="mt back ${cls || ''}"></span>`;
      const t = tt(id);
      return `<span class="mt ${cls || ''}" data-id="${id}" title="${tname(t)}">${this.face(t)}</span>`;
    },
    _sel: null,
    render(el, v, ui) {
      el.dataset.g = 'mahjong';
      const me = v.me; const T = (id, c) => this.tile(id, c);
      const myP = me ? me.p : -1, base = myP >= 0 ? myP : 0;
      // 座位：自己在下方，下家在右邊、對家在上方、上家在左邊（三人局是ㄩ字：左、右、下）
      const order = U.range(v.k).map(i => (base + i) % v.k);
      const side = {}; side[order[0]] = 'bottom';
      if (v.k === 4) { side[order[1]] = 'right'; side[order[2]] = 'top'; side[order[3]] = 'left'; }
      else if (v.k === 3) { side[order[1]] = 'right'; side[order[2]] = 'left'; }
      else if (v.k === 2) side[order[1]] = 'top';
      const at = (pos) => Object.keys(side).map(Number).find(q => side[q] === pos);
      const meldHTML = (pl, cls) => pl.flowers.map(id => T(id, cls)).join('') + pl.melds.map(m => `<span class="meld">${m.tiles.map(id => T(id, cls)).join('')}</span>`).join('');
      const tag = (q) => { const pl = v.players[q]; return `<div class="mjs-tag ${v.turn === q && v.phase === 'discard' ? 'turn' : ''}"><span class="wind">${pl.wind}${pl.dealer ? '莊' : ''}</span><b>${U.esc(v.names[pl.seat])}</b><small>${pl.count}張 ${v.total[pl.seat] >= 0 ? '+' : ''}${v.total[pl.seat]}</small></div>`; };
      const backs = (n, cls) => `<span class="mjs-backs">${Array.from({ length: n }, () => `<span class="mt back ${cls}"></span>`).join('')}</span>`;
      const seat = (pos) => { const q = at(pos); if (q == null || pos === 'bottom') return `<div class="mjs mjs-${pos} empty"></div>`; const pl = v.players[q];
        return `<div class="mjs mjs-${pos}">${tag(q)}<div class="mjs-melds">${meldHTML(pl, 'xs')}</div>${pl.hand ? `<div class="mjs-melds">${pl.hand.slice().sort((a, b) => tt(a) - tt(b)).map(id => T(id, 'xs')).join('')}</div>` : backs(Math.max(0, pl.count), 'xxs')}</div>`; };
      const river = (pos) => { const q = at(pos); if (q == null) return `<div class="mjr mjr-${pos}"></div>`; const pl = v.players[q];
        return `<div class="mjr mjr-${pos}">${pl.river.map((id, i) => T(id, 'rv' + (v.lastDiscard === id && i === pl.river.length - 1 ? ' last' : ''))).join('')}</div>`; };
      const mine = myP >= 0 ? v.players[myP] : null;
      let hand = me ? me.hand.slice() : [];
      const drawn = me && me.drawn != null ? me.drawn : null;
      // 手牌排序：預設自動依花色排；拖曳過就改成自己排的順序（新摸的牌接在最後）
      const auto = (a, b) => tt(a) - tt(b) || a - b;
      let drawnSep = drawn;
      if (this._order && me) {
        const has = new Set(me.hand); const ord = this._order.filter(id => has.has(id));
        if (drawn != null && ord.includes(drawn)) drawnSep = null;
        const rest = me.hand.filter(id => !ord.includes(id) && id !== drawnSep).sort(auto);
        hand = ord.concat(rest).filter(id => id !== drawnSep); this._order = ord.length ? hand.slice() : null;
      } else hand = hand.filter(id => id !== drawn).sort(auto);
      const myTurn = me && v.phase === 'discard' && v.turn === myP;
      if (this._sel != null && !(me && me.hand.includes(this._sel))) this._sel = null;
      const tips = (me && me.tips) || {};
      const res = v.result;
      const arrow = { bottom: '▼', top: '▲', left: '◀', right: '▶' }[side[v.turn]] || '';
      const core = v.phase === 'claim'
        ? `<div class="mjc-claim">${U.esc(v.names[v.players[v.claim.from].seat])} ${v.claim.rob ? '加槓' : '打出'}<br>${T(v.claim.tile, 'big')}<span class="timer" data-deadline="${v.deadline}"></span></div>`
        : `<div class="mjc-wind">${v.roundWind}<small>風圈</small></div><div class="mjc-info">第${v.handNo + (v.phase === 'over' || v.phase === 'end' ? 0 : 1)}局${v.lian ? `・連${v.lian}` : ''}<br>剩 <b>${v.wall}</b> 張</div>${v.phase === 'discard' ? `<div class="mjc-turn">${arrow} <b>${U.esc(v.names[v.players[v.turn].seat])}</b> <span class="timer" data-deadline="${v.deadline || ''}"></span></div>` : ''}`;
      el.innerHTML = `
        <div class="mjt k${v.k}">
          ${seat('top')}${seat('left')}
          <div class="mj-table">
            ${river('top')}${river('left')}
            <div class="mj-core">${core}<div class="mjc-log">${v.log.slice(-2).map(U.esc).join('<br>')}</div></div>
            ${river('right')}${river('bottom')}
          </div>
          ${seat('right')}
        </div>
        ${(v.phase === 'over' || v.phase === 'end') ? this._resultHTML(v, res) : ''}
        ${mine ? `<div class="mj-me ${myTurn ? 'turn' : ''}">
          <div class="mj-name"><span class="wind">${mine.wind}${mine.dealer ? '莊' : ''}</span>你 <small>${v.total[mine.seat] >= 0 ? '+' : ''}${v.total[mine.seat]}</small>
            ${v.sitter >= 0 ? `<small>・${U.esc(v.names[v.sitter])} 這局休息</small>` : ''}
            ${me.waits && me.waits.length ? `<span class="waits">聽：${me.waits.map(t => tname(t)).join('、')}</span>` : ''}</div>
          ${mine.flowers.length || mine.melds.length ? `<div class="mj-melds">${meldHTML(mine, 'sm')}</div>` : ''}
          <div class="mj-hand">${hand.map(id => T(id, (this._sel === id ? 'sel ' : '') + (tips[tt(id)] ? 'ting' : ''))).join('')}${drawnSep != null ? `<span class="gap"></span>${T(drawnSep, 'drawn ' + (this._sel === drawnSep ? 'sel ' : '') + (tips[tt(drawnSep)] ? 'ting' : ''))}` : ''}</div>
          <div class="mj-sorthint">${this._order ? '<button class="btn ghost sm" data-sort="1">↺ 恢復自動排序</button>' : '<small>按住牌拖曳可以自己排順序</small>'}</div>
          ${this._sel != null && tips[tt(this._sel)] ? `<div class="hint">打 ${tname(tt(this._sel))} 可聽：${tips[tt(this._sel)].map(tname).join('、')}</div>` : ''}
          <div class="act-row mj-acts">${this._actions(v, me, myTurn)}</div>
        </div>` : '<p class="spec-note">' + (v.sitter >= 0 && me == null && v.names[v.sitter] ? '觀戰中（5 人局每局輪一人休息）' : '觀戰中') + '</p>'}`;
      const sb = el.querySelector('[data-sort]'); if (sb) sb.onclick = () => { this._order = null; this.render(el, v, ui); };
      this._bindDrag(el, v, ui, hand, drawnSep);
      this._fit(el);
      el.querySelectorAll('.mj-hand .mt').forEach(t => t.onclick = () => {
        if (this._justDragged) return;
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
    // 版面固定在一個螢幕內：牌河、旁家的牌越來越多時自動縮小牌，不用上下滑
    _fit(el) {
      this._fitEl = el;
      if (!this._onResize) { this._onResize = () => { clearTimeout(this._rz); this._rz = setTimeout(() => { if (this._fitEl && this._fitEl.isConnected && this._fitEl.dataset.g === 'mahjong') this._fit(this._fitEl); }, 120); }; addEventListener('resize', this._onResize); addEventListener('orientationchange', this._onResize); }
      const st = document.getElementById('stage'); if (st) st.scrollTop = 0;
      el.classList.add('mj-fit');
      const vw = innerWidth, vh = (st && st.clientHeight) || innerHeight;
      const big = Math.max(16, Math.min(30, Math.min(vw / 20, vh / 24)));
      const boxes = [...el.querySelectorAll('.mjt, .mj-table, .mjr, .mjs, .mj-core')];
      const set = (s) => {
        el.style.setProperty('--mj-rv', (big * s).toFixed(1) + 'px');
        el.style.setProperty('--mj-xs', (big * s * 0.95).toFixed(1) + 'px');
        el.style.setProperty('--mj-xxs', Math.max(5, big * s * 0.48).toFixed(1) + 'px');
        el.style.setProperty('--mj-hs', Math.min(1, 0.55 + s * 0.6).toFixed(3)); // 手牌最後才縮，而且縮得少
      };
      const over = () => boxes.some(b => b.scrollHeight > b.clientHeight + 1 || b.scrollWidth > b.clientWidth + 1) || el.scrollHeight > el.clientHeight + 1;
      let lo = 0.3, hi = 1; set(hi); if (!over()) return;
      for (let i = 0; i < 7; i++) { const m = (lo + hi) / 2; set(m); if (over()) hi = m; else lo = m; }
      set(lo);
    },
    // 拖曳手牌換位置（滑鼠與手指都可以）
    _bindDrag(el, v, ui, hand, drawnSep) {
      const box = el.querySelector('.mj-hand'); if (!box) return;
      box.querySelectorAll('.mt').forEach(t => t.onpointerdown = (e) => {
        if (e.button) return; const id = +t.dataset.id, x0 = e.clientX, y0 = e.clientY; let drag = false;
        const others = [...box.querySelectorAll('.mt')].filter(o => o !== t);
        const move = (ev) => {
          const dx = ev.clientX - x0, dy = ev.clientY - y0;
          if (!drag && Math.hypot(dx, dy) > 8) { drag = true; t.classList.add('dragging'); try { t.setPointerCapture(e.pointerId); } catch (_) {} }
          if (drag) { ev.preventDefault(); t.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`; }
        };
        const upF = (ev) => {
          window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', upF); window.removeEventListener('pointercancel', upF);
          if (!drag) return;
          this._justDragged = true; setTimeout(() => this._justDragged = false, 50);
          // 找放下位置：離手指最近的那張牌，放在它前面或後面
          let best = null, bd = 1e9; others.forEach(o => { const r = o.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, d = Math.hypot(ev.clientX - cx, (ev.clientY - cy) * 1.6); if (d < bd) { bd = d; best = { id: +o.dataset.id, after: ev.clientX > cx }; } });
          let ord = hand.slice(); if (drawnSep != null) ord.push(drawnSep);
          ord = ord.filter(x => x !== id);
          if (best) { const i = ord.indexOf(best.id); ord.splice(best.after ? i + 1 : i, 0, id); } else ord.push(id);
          if (drawnSep != null && id !== drawnSep && ord[ord.length - 1] === drawnSep) ord.pop(); // 沒動到剛摸的牌就讓它留在右邊
          this._order = ord; this.render(el, v, ui);
        };
        window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', upF); window.addEventListener('pointercancel', upF);
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
        h += `<h3>🎉 ${U.esc(v.names[wp.seat])} ${res.eight ? res.tai.items[0][0] : res.zimo ? '自摸' : '胡牌'}！</h3>`;
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
