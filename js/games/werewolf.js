// 狼人殺：經典版（GAMES.werewolf）＋一夜版（GAMES.onenight）的遊戲模組與畫面；規則在 ww-rules.js
(function (root) {
  const U = root.GUTIL, W = root.WW_RULES, C = W.classic, O = W.onenight;
  const esc = U.esc;
  const nm = (s) => (s + 1) + ' 號';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  // ---------------- 說明文字（只講規則，不教怎麼贏） ----------------
  const GLOSSARY = [
    ['上警', '參加警長競選'], ['退水', '上警後放棄競選'], ['警徽', '警長的身分，警長投票算 1.5 票'], ['平安夜', '晚上沒有人死亡'],
    ['金水', '預言家查驗後說是好人的玩家'], ['查殺', '預言家查驗後說是狼人的玩家'], ['銀水', '女巫用解藥救起來的玩家'],
    ['空刀', '狼人晚上不殺人'], ['自刀', '狼人殺自己的隊友'], ['PK', '平票的人再各發言一次，然後重新投票'], ['屠邊', '狼人殺光所有神職，或殺光所有平民就獲勝'], ['遺言', '出局時最後的發言']
  ];
  function classicHelp(v) {
    const cnt = {}; v.comp.forEach(r => cnt[r] = (cnt[r] || 0) + 1);
    const roles = Object.keys(cnt).map(r => `<div class="ww-hrole"><b>${C.ROLE[r].i} ${C.ROLE[r].n}${cnt[r] > 1 ? ` ×${cnt[r]}` : ''}</b><p>${esc(C.ROLE[r].d)}</p></div>`).join('');
    const nightOrder = ['guard', 'wolf', 'witch', 'seer'].filter(x => x === 'wolf' || v.comp.includes(x)).map(x => x === 'wolf' ? '狼人' : C.ROLE[x].n).join(' → ');
    return {
      '這局角色': `<p class="ww-hsub">${esc(v.board)}${v.untested ? '（未經真人測試）' : ''}・好人 ${v.comp.filter(r => !C.isWolf(r)).length} 人 vs 狼人 ${v.comp.filter(r => C.isWolf(r)).length} 人</p>${roles}`,
      '流程': `<ol class="ww-hlist">
        <li><b>發身分</b>：按住牌看自己的身分，看完按「看過了」。</li>
        <li><b>天黑</b>：${nightOrder} 依序行動，其他人等待。每一段的時間都是固定的，不會因為有人比較快就提早結束（狼人意見一致時例外）。</li>
        ${v.hasSheriff ? '<li><b>第一天競選警長</b>：想當的人按「上警」，上警的人輪流發言，可以中途退水；沒上警的人投票選出警長。平票的人 PK 發言後再投一次，再平就沒有警長。警長投票算 1.5 票，決定發言從哪一邊開始，自己最後發言。</li>' : ''}
        <li><b>天亮</b>：公布昨晚死亡的人${v.hasSheriff ? '（第一天在警長競選之後公布）' : ''}。</li>
        <li><b>輪流發言</b>：只有輪到的人能開麥，其他人自動靜音。講完按「結束發言」，時間到也會自動換人。</li>
        <li><b>投票放逐</b>：所有人同時投票（可以棄票、不能投自己），最高票的人出局。平票的人 PK 發言後再投一次（平票的人不能投），再平就沒有人出局。</li>
        <li>重複天黑、天亮，直到一方獲勝。</li></ol>`,
      '細節': `<ul class="ww-hlist">
        <li><b>遺言</b>：第一晚死亡的人、白天被放逐的人、被開槍帶走的人有遺言；第二晚起晚上死亡的人沒有遺言。自爆、被白狼王帶走、決鬥死亡沒有遺言。</li>
        <li><b>技能時段</b>：每位出局的人都有一段一樣長的時間決定要不要發動技能（不管有沒有技能都一樣），只有獵人${v.comp.includes('wolfking') ? '、狼王' : ''}能真的發動。</li>
        <li><b>狼人殺人</b>：狼人各自點選目標，隊友看得到彼此選了誰。全部選同一人就提早結束；時間到以多數為準，平手或沒人選就是不殺人。</li>
        ${v.hasSheriff ? '<li><b>警徽</b>：警長出局時可以把警徽交給一位活著的玩家，或撕掉（之後就沒有警長）。警長競選時有人自爆，這局就沒有警長。</li>' : ''}
        <li><b>晚上</b>：全場麥克風關閉。出局的人麥克風一直關閉，可以繼續看，但遊戲結束前看不到別人的身分。</li>
        <li><b>斷線</b>：離線超過兩次發言就自動託管：託管時不投票、不用技能，狼人跟隨隊友的選擇。</li></ul>`,
      '勝負': `<ul class="ww-hlist"><li><b>好人</b>：投票放逐所有狼人。</li><li><b>狼人</b>：殺光所有神職（${v.comp.filter(r => C.ROLE[r].t === 'god').map(r => C.ROLE[r].n).join('、')}），或殺光所有平民（屠邊）。</li>
        <li>同一個天亮雙方同時達成條件時，判狼人獲勝（狼刀在先）。</li>${v.comp.includes('idiot') ? '<li>翻牌的白痴判斷勝負時當作已出局。</li>' : ''}</ul>`,
      '術語': `<dl class="ww-gloss">${GLOSSARY.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`
    };
  }
  function onenightHelp(v) {
    const cnt = {}; v.deck.forEach(r => cnt[r] = (cnt[r] || 0) + 1);
    const roles = Object.keys(cnt).map(r => `<div class="ww-hrole"><b>${O.ROLE[r].i} ${O.ROLE[r].n}${cnt[r] > 1 ? ` ×${cnt[r]}` : ''}</b><p>${esc(O.ROLE[r].d)}</p></div>`).join('');
    return {
      '這局角色': `<p class="ww-hsub">${v.n} 位玩家＋中間 3 張，共 ${v.deck.length} 張牌${v.dropped && v.dropped.length ? `（人數太少，${v.dropped.map(r => O.ROLE[r].n).join('、')} 放不進去）` : ''}</p>${roles}`,
      '流程': `<ol class="ww-hlist">
        <li><b>發牌</b>：每人一張，中間另外蓋 3 張。按住牌看自己的身分，看完按「看過了」。</li>
        <li><b>只有一個晚上</b>：${v.steps.map(r => O.ROLE[r].n).join(' → ')} 依序醒來，每個角色只行動一次。牌在中間的角色也會照樣呼叫、等一樣久。</li>
        <li><b>白天討論 ${v.talkT} 分鐘</b>：大家同時開麥自由討論。全員都按「提早投票」就提前結束。</li>
        <li><b>同時投票</b>：每人投一位其他玩家（不能投自己）。最高票的人出局，平票的人全部出局；如果每個人都只拿到 1 票，就沒有人出局。</li>
        <li>揭曉所有人最後的牌，判斷勝負。</li></ol>
        <p class="ww-hsub">注意：你的牌可能在晚上被強盜、搗蛋鬼換掉，你不一定知道。勝負以<b>夜晚結束時你手上的牌</b>為準。</p>`,
      '勝負': `<ul class="ww-hlist">
        <li>有狼人被投出局 → <b>好人</b>贏。</li>
        <li>玩家裡有狼人，但沒有狼人被投出局 → <b>狼人隊</b>（狼人＋爪牙）贏。</li>
        <li>玩家裡沒有狼人（狼人都在中間）：沒人出局 → 好人贏；有人出局 → 好人輸${v.deck.includes('minion') ? '（爪牙在場時，只要出局的不是爪牙，爪牙就贏；爪牙出局則好人贏）' : ''}。</li>
        ${v.deck.includes('tanner') ? '<li>皮匠出局 → 皮匠贏；這時如果也沒有狼人出局，狼人隊不算贏。</li>' : ''}
        ${v.deck.includes('hunter') ? '<li>獵人出局時，他投的那個人也一起出局。</li>' : ''}</ul>`,
      '術語': `<dl class="ww-gloss"><dt>中間的牌</dt><dd>沒發給玩家的 3 張牌</dd><dt>換牌</dt><dd>強盜、搗蛋鬼、酒鬼在晚上交換牌，被換的人不會被通知</dd></dl>`
    };
  }

  // ---------------- 共用畫面工具 ----------------
  const UIX = {
    help(mod, v) {
      const pages = v.mode === 'classic' ? classicHelp(v) : onenightHelp(v); const keys = Object.keys(pages);
      const cur = keys.includes(mod._helpTab) ? mod._helpTab : keys[0];
      return `<div class="ww-over">
        <div class="ww-sheet"><div class="ww-sheet-h"><b>${v.mode === 'classic' ? '狼人殺 規則說明' : '一夜狼人 規則說明'}</b><button class="iconbtn" data-close>✕</button></div>
        <div class="ww-tabs">${keys.map(k => `<button class="${k === cur ? 'on' : ''}" data-tab="${k}">${k}</button>`).join('')}</div>
        <div class="ww-sheet-b">${pages[cur]}</div></div></div>`;
    },
    ring(v, opt) {
      const n = v.n; const seats = [];
      for (let i = 0; i < n; i++) {
        const a = -90 + i * 360 / n, r = 41;
        const x = 50 + r * Math.cos(a * Math.PI / 180), y = 50 + r * Math.sin(a * Math.PI / 180);
        seats.push(`<div class="ww-seat ${opt.cls(i)}" data-seat="${i}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%">
          <div class="ww-av"><span class="ww-no">${i + 1}</span>${opt.badge(i)}</div><div class="ww-nm">${esc(String(v.names[i] || '?').slice(0, 4))}</div>${opt.under ? opt.under(i) : ''}</div>`);
      }
      return `<div class="ww-ring" style="--n:${n}">${seats.join('')}<div class="ww-mid">${opt.mid || ''}</div></div>`;
    },
    note(mod, i) { const t = (mod._notes || {})[i]; return t ? `<i class="ww-note n-${t}">${{ good: '好', wolf: '狼', seer: '預', q: '？' }[t]}</i>` : ''; },
    noteMenu(mod) {
      const i = mod._noteFor; if (i == null) return '';
      return `<div class="ww-over"><div class="ww-sheet small"><div class="ww-sheet-h"><b>幫 ${nm(i)} 做記號（只有你看得到）</b><button class="iconbtn" data-close>✕</button></div>
        <div class="ww-notes">${[['good', '好人'], ['wolf', '狼'], ['seer', '預言家'], ['q', '？'], ['', '清除']].map(([k, l]) => `<button class="btn ${k ? 'ghost' : 'ghost'} n-${k}" data-note="${k}">${l}</button>`).join('')}</div></div></div>`;
    },
    // 按住才翻開的身分牌
    // 放在座位圓環正中間；按住時，下方操作區最上面顯示這個角色的說明
    roleChip(mod, icon, name) {
      return `<button class="ww-rolechip ${mod._peek ? 'peek' : ''}" data-peek>
        <span class="back">🂠 按住看身分</span><span class="front">${icon} <b>${esc(name)}</b></span></button>`;
    },
    peekDesc(mod, desc) { return mod._peek && desc ? `<div class="ww-peekdesc">${esc(desc)}</div>` : ''; },
    logSheet(v) {
      const L = (v.log || []).slice().reverse();
      return `<div class="ww-over"><div class="ww-sheet"><div class="ww-sheet-h"><b>公開紀錄</b><button class="iconbtn" data-close>✕</button></div>
        <div class="ww-sheet-b"><ul class="ww-log">${L.map(x => `<li class="k-${x.k || ''}"><small>${x.d ? '第 ' + x.d + ' 天' : '第一晚'}</small>${esc(x.text)}</li>`).join('') || '<li>還沒有紀錄</li>'}</ul></div></div></div>`;
    },
    // 依可用高度調整圓環與座位大小（#stage 是遊戲區的捲動容器；手機橫放時圓環變成橢圓）
    fit(el, n) {
      const ww = el.querySelector('.ww'), ring = el.querySelector('.ww-ring'); if (!ww || !ring) return;
      const st = document.getElementById('stage'); const H = st && st.clientHeight > 100 ? st.clientHeight : innerHeight;
      ww.style.setProperty('--sh', H + 'px');
      const r = ring.getBoundingClientRect(); const m = Math.min(r.width, r.height || r.width);
      const seat = Math.max(34, Math.min(66, m * (n <= 6 ? 0.19 : n <= 9 ? 0.17 : 0.15)));
      ring.style.setProperty('--seat', seat.toFixed(1) + 'px');
      // 很扁的圓環（手機橫放）：座位改沿著長方形桌邊平均排，避免兩側擠在一起
      if (r.height && r.width / r.height > 1.3) {
        const A = r.width / 2 - seat / 2 - 4, B = r.height / 2 - seat * 0.72, P = 4 * (A + B);
        ring.querySelectorAll('.ww-seat').forEach(e => {
          let d = (+e.dataset.seat + 0.5) * P / n, x, y; // 錯開半格：正上方、正下方留給中間的身分牌／中間三張牌
          if (d < A) { x = d; y = -B; } else if ((d -= A) < 2 * B) { x = A; y = -B + d; } else if ((d -= 2 * B) < 2 * A) { x = A - d; y = B; } else if ((d -= 2 * A) < 2 * B) { x = -A; y = B - d; } else { d -= 2 * B; x = -A + d; y = -B; }
          e.style.left = (r.width / 2 + x) + 'px'; e.style.top = (r.height / 2 + y - seat * 0.12) + 'px';
        });
        ring.classList.add('flat');
      }
      if (!UIX._rs) { UIX._rs = true; window.addEventListener('resize', () => { for (const g of [root.GAMES.werewolf, root.GAMES.onenight]) if (g && g._last && document.body.contains(g._last.el.querySelector('.ww'))) g.render(g._last.el, g._last.v, g._last.ui); }); }
    },
    // 共用事件：按住看牌、點座位選人、長按做記號、說明／紀錄視窗
    bind(mod, el, v, ui, onSeat) {
      UIX.fit(el, v.n);
      const rerender = () => mod.render(el, v, ui);
      el.querySelectorAll('[data-peek]').forEach(b => {
        const on = (e) => { e.preventDefault(); mod._peek = true; b.classList.add('peek'); rerender(); };
        b.addEventListener('pointerdown', on); b.addEventListener('contextmenu', e => e.preventDefault());
      });
      if (!UIX._up) { UIX._up = true; const off = () => { for (const m of [root.GAMES.werewolf, root.GAMES.onenight]) if (m && m._peek) { m._peek = false; if (m._last) m.render(m._last.el, m._last.v, m._last.ui); } }; ['pointerup', 'pointercancel', 'blur'].forEach(ev => (ev === 'blur' ? window : document).addEventListener(ev, off)); }
      el.querySelectorAll('[data-seat]').forEach(s => {
        const i = +s.dataset.seat; let timer = null, long = false;
        s.addEventListener('pointerdown', () => { long = false; timer = setTimeout(() => { long = true; mod._noteFor = i; rerender(); }, 550); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => s.addEventListener(ev, () => clearTimeout(timer)));
        s.addEventListener('click', () => { if (long) return; onSeat(i); });
        s.addEventListener('contextmenu', e => e.preventDefault());
      });
      // 視窗：點背景或 ✕ 關閉
      el.querySelectorAll('.ww-over').forEach(o => o.addEventListener('click', (e) => { if (e.target !== o && !e.target.closest('button[data-close]')) return; mod._help = false; mod._logOpen = false; mod._noteFor = null; rerender(); }));
      el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { mod._helpTab = b.dataset.tab; rerender(); });
      el.querySelectorAll('[data-note]').forEach(b => b.onclick = () => { const k = b.dataset.note; mod._notes = mod._notes || {}; if (k) mod._notes[mod._noteFor] = k; else delete mod._notes[mod._noteFor]; LS.set('ww-notes', JSON.stringify({ g: mod._gid, n: mod._notes })); mod._noteFor = null; rerender(); });
      const h = el.querySelector('[data-help]'); if (h) h.onclick = () => { mod._help = true; rerender(); };
      const lg = el.querySelector('[data-logbtn]'); if (lg) lg.onclick = () => { mod._logOpen = true; rerender(); };
    },
    // 每局第一次：自動打開規則（玩過第二次之後預設不打開）；新的一局清掉記號
    newGame(mod, v, key) {
      const gid = key + ':' + v.names.join(',') + ':' + (v.mode === 'classic' ? v.comp.join() : v.deck.join());
      if (v.phase === 'deal' && mod._dealSeen !== v.turnId && mod._gidPhase !== gid + v.turnId) {
        mod._gidPhase = gid + v.turnId;
        if (mod._gid !== gid || mod._lastPhase === 'over') { mod._notes = {}; mod._gid = gid + ':' + Date.now(); LS.set('ww-notes', '{}'); mod._sel = null; mod._sel2 = null; mod._mode = null; }
        const seenKey = 'ww-help-' + v.mode; const times = +LS.get(seenKey, '0');
        if (times < 1 && v.seat >= 0) mod._help = true;
        LS.set(seenKey, String(times + 1));
      }
      if (!mod._notes) { try { const o = JSON.parse(LS.get('ww-notes', '{}')); mod._notes = o.n || {}; mod._gid = o.g || mod._gid; } catch (e) { mod._notes = {}; } }
      mod._lastPhase = v.phase;
    }
  };

  // ======================================================================
  // 經典版
  // ======================================================================
  const PHASE_NAME = { deal: '發身分', night: '天黑請閉眼', signup: '警長競選', espeech: '警長競選發言', epk: '警長 PK 發言', evote: '投票選警長', announce: '天亮了', badge: '移交警徽', skill: '技能時段', lw: '遺言', order: '警長決定發言順序', speech: '輪流發言', pkspeech: 'PK 發言', vote: '放逐投票', over: '遊戲結束' };
  const SUB_NAME = { guard: '守衛', wolf: '狼人', witch: '女巫', seer: '預言家' };
  const EXPLODE_OK = ['signup', 'espeech', 'epk', 'speech', 'pkspeech'];

  function cMyTurn(v) {
    const me = v.me; if (!me) return '';
    const s = v.seat;
    if (v.phase === 'deal' && !v.meReady) return '看你的身分';
    if (v.phase === 'night' && me.alive) {
      if (v.sub === 'wolf' && C.isWolf(me.role) && (me.wp || {})[s] == null) return '狼人請選擇今晚要殺的人';
      if (v.sub === 'guard' && me.role === 'guard' && !me.gdone) return '守衛請行動';
      if (v.sub === 'witch' && me.role === 'witch' && !me.wdone) return '女巫請行動';
      if (v.sub === 'seer' && me.role === 'seer' && !me.sdone) return '預言家請查驗';
      return '';
    }
    if (['espeech', 'epk', 'speech', 'pkspeech', 'lw'].includes(v.phase) && v.speaker === s) return v.phase === 'lw' ? '請發表遺言' : '輪到你發言';
    if ((v.phase === 'vote' || v.phase === 'evote') && v.voters.includes(s) && v.myVote == null) return v.phase === 'evote' ? '請投票選警長' : '請投票';
    if (v.phase === 'badge' && v.bs === s) return '請移交警徽';
    if (v.phase === 'skill' && v.ks === s) return v.canShoot ? '你出局了，要發動技能嗎？' : '你出局了';
    if (v.phase === 'order' && v.sheriff === s) return '請決定發言順序';
    return '';
  }

  const WWG = {
    id: 'werewolf', name: '狼人殺', icon: '🐺', min: 6, max: 12, counts: C.COUNTS, needVoice: true,
    countText: '6／9／10／12 人',
    desc: '主流「預女獵白」規則。房主手機自動當主持人，不需要真人上帝。晚上依序行動，白天輪流發言（只有發言的人能開麥）、投票放逐。好人要投出所有狼人；狼人要殺光所有神職或所有平民。支援 6、9、10、12 人（10、12 人局未經真人測試）。每位玩家都要開「🎤 語音」。',
    options: [
      { key: 'six', label: '6 人局的第三位神', choices: [['witch', '女巫'], ['hunter', '獵人'], ['guard', '守衛']], def: 'witch' },
      { key: 'b12', label: '12 人局板子', choices: [['wh', '預女獵白（標準）'], ['wg', '預女獵守'], ['kg', '狼王守衛'], ['wk', '白狼王騎士']], def: 'wh' },
      { key: 'speakT', label: '每人發言時間', choices: [[60, '60 秒'], [45, '45 秒'], [90, '90 秒']], def: 60 }
    ],
    init: C.init, action: C.action, tick: C.tick, auto: C.auto, view: C.view,
    myTurn: cMyTurn,
    render(el, v, ui) {
      this._last = { el, v, ui };
      el.dataset.g = 'werewolf';
      UIX.newGame(this, v, 'c');
      const me = v.me, s = v.seat, ph = v.phase, alive = v.alive;
      if (ph !== this._selPhase || v.sub !== this._selSub) { this._sel = null; this._mode = null; this._selPhase = ph; this._selSub = v.sub; }
      const night = ph === 'night' || ph === 'deal';
      const wolves = me && me.wolves ? me.wolves.map(w => w.s) : [];
      const over = ph === 'over';
      // 這個階段可以點哪些座位
      const target = this._target(v);
      const cls = (i) => [
        !alive[i] ? 'dead' : '', v.idiotUp.includes(i) ? 'idiot' : '', i === s ? 'me' : '',
        v.speaker === i ? 'spk' : '', target && target.ok(i) ? 'pickable' : '', this._sel === i ? 'sel' : '',
        !over && wolves.includes(i) ? 'mate' : '', over && v.roles && C.isWolf(v.roles[i]) ? 'mate' : ''
      ].join(' ');
      const badge = (i) => {
        let b = '';
        if (v.sheriff === i) b += '<i class="b-sh">🎖</i>';
        if (!alive[i]) b += '<i class="b-dead">💀</i>';
        if (v.idiotUp.includes(i)) b += '<i class="b-id">🃏</i>';
        if (!over && me && me.wp && wolves.includes(i) && me.wp[i] != null) b += `<i class="b-wp">${me.wp[i] < 0 ? '🚫' : '🐺' + (me.wp[i] + 1)}</i>`;
        if (v.phase === 'signup' && v.signed && v.signed.includes(i)) b += '<i class="b-run">✋</i>';
        if ((ph === 'espeech' || ph === 'epk') && v.cands && v.cands.includes(i)) b += '<i class="b-run">✋</i>';
        return b + UIX.note(this, i);
      };
      const under = over && v.roles ? (i) => `<div class="ww-rv ${C.isWolf(v.roles[i]) ? 'w' : ''}">${C.ROLE[v.roles[i]].i}${C.ROLE[v.roles[i]].n}</div>` : null;
      const R = me ? C.ROLE[me.role] : null;
      const mid = `<div class="ww-sky">${night ? '🌙' : over ? (v.winner === 'wolf' ? '🐺' : '🌞') : '☀️'}<span class="ww-day">${ph === 'deal' ? '準備' : night ? `第 ${v.nightNo} 晚` : over ? '' : `第 ${v.day} 天`}</span></div>${me && !over ? UIX.roleChip(this, R.i, R.n) : ''}`;
      const ring = UIX.ring(v, { cls, badge, under, mid });

      const top = `<div class="ww-top"><b>${PHASE_NAME[ph] || ''}${ph === 'night' && v.sub ? `<small>・${SUB_NAME[v.sub]}行動中</small>` : ''}</b>
        <span class="timer" data-deadline="${v.deadline || ''}"></span>
        <span class="ww-tools"><button class="btn ghost sm" data-logbtn>📜</button><button class="btn ghost sm" data-help>？</button></span></div>`;
      const roleRow = me ? UIX.peekDesc(this, R.d) + (!me.alive && !over ? '<p class="ww-out">💀 你已出局：麥克風關閉，可以繼續看</p>' : '') : '<p class="ww-out">👀 觀戰中</p>';
      const panel = this._panel(v, target);

      el.innerHTML = `<div class="ww ${night ? 'night' : ''} ${over ? 'over' : ''}">${top}${ring}<div class="ww-panel">${roleRow}${panel}</div>
        ${this._help ? UIX.help(this, v) : ''}${this._logOpen ? UIX.logSheet(v) : ''}${UIX.noteMenu(this)}</div>`;

      UIX.bind(this, el, v, ui, (i) => {
        if (!target || !target.ok(i)) return;
        this._sel = this._sel === i ? null : i; this.render(el, v, ui);
      });
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => this._act(b, v, ui, el));
    },
    // 目前可以點選的目標
    _target(v) {
      const me = v.me, s = v.seat, ph = v.phase, A = v.alive; if (!me || ph === 'over') return null;
      const aliveOther = (i) => A[i] && i !== s;
      if (ph === 'night' && me.alive) {
        if (v.sub === 'wolf' && C.isWolf(me.role)) return { ok: (i) => A[i] };
        if (v.sub === 'guard' && me.role === 'guard' && !me.gdone) return { ok: (i) => A[i] && i !== me.guardLast };
        if (v.sub === 'witch' && me.role === 'witch' && !me.wdone && me.poison && this._mode === 'poison') return { ok: aliveOther };
        if (v.sub === 'seer' && me.role === 'seer' && !me.sdone) return { ok: aliveOther };
        return null;
      }
      if ((ph === 'vote' || ph === 'evote') && v.voters.includes(s)) return { ok: (i) => v.cands.includes(i) && i !== s };
      if (ph === 'badge' && v.bs === s) return { ok: (i) => aliveOther(i) && !v.idiotUp.includes(i) };
      if (ph === 'skill' && v.ks === s && v.canShoot) return { ok: aliveOther };
      if (this._mode === 'duel' && ph === 'speech' && v.speaker === s) return { ok: aliveOther };
      if (this._mode === 'explode' && me.role === 'whitewolf' && EXPLODE_OK.includes(ph)) return { ok: aliveOther };
      return null;
    },
    _panel(v, target) {
      const me = v.me, s = v.seat, ph = v.phase, sel = this._sel, A = v.alive;
      const hint = (t) => `<p class="ww-hint">${t}</p>`;
      const btn = (a, label, cls, dis) => `<button class="btn ${cls || ''}" data-a="${a}" ${dis ? 'disabled' : ''}>${label}</button>`;
      const row = (x) => `<div class="act-row">${x}</div>`;
      const selName = sel != null ? nm(sel) : null;
      let h = '';
      const info = this._privInfo(v);
      if (ph === 'deal') {
        h += hint(me ? '按住圓圈中間的「按住看身分」看你的身分（放開就會蓋回去），看完按「看過了」。所有人看完就天黑。' : '玩家正在看身分…');
        if (me) h += row(btn('ready', v.meReady ? '✔ 已看過' : '看過了', 'big', v.meReady));
        h += `<p class="ww-sub">已準備 ${v.readyN}／${v.n} 人・可以先按右上角「？」看規則${v.untested ? '・這個人數的板子還沒經過真人測試' : ''}</p>`;
        return h + info;
      }
      if (ph === 'night') {
        const mine = me && me.alive && ((v.sub === 'wolf' && C.isWolf(me.role)) || v.sub === me.role);
        if (!mine) {
          h += hint(me && !me.alive ? '你已出局，等待天亮。' : `現在是${SUB_NAME[v.sub]}的行動時間，其他人請等待。`);
          if (me && me.alive) h += row(`<button class="btn ghost ${this._eyes === v.turnId ? 'on' : ''}" data-a="eyes">${this._eyes === v.turnId ? '😴 閉眼中' : '我閉眼了'}</button>`);
          return h + info;
        }
        if (v.sub === 'wolf') {
          const mates = (me.wolves || []).filter(w => w.s !== s && A[w.s]);
          h += hint(`點一位玩家，選今晚要殺的人。${mates.length ? '隊友選誰會顯示在他頭像上；全部選同一人就提早結束，時間到以多數為準，平手不殺人。' : '時間到以你的選擇為準。'}`);
          const mine2 = (me.wp || {})[s];
          h += row(btn('wpick', sel != null ? `殺 ${selName}` : '先點一位玩家', 'big danger', sel == null) + btn('wnone', '今晚不殺人', 'ghost'));
          if (mine2 != null) h += `<p class="ww-sub">你目前選的是：${mine2 < 0 ? '不殺人' : nm(mine2)}（可以改）</p>`;
          return h + info;
        }
        if (v.sub === 'guard') {
          if (me.gdone) return h + hint(`你今晚守護了：${me.g < 0 ? '沒有守人' : nm(me.g)}。等待其他人行動。`) + info;
          h += hint(`點一位玩家守護（可以守自己），他今晚不會被狼人殺死。${me.guardLast >= 0 ? `不能連續兩晚守同一人（昨晚守了 ${nm(me.guardLast)}）。` : ''}`);
          return h + row(btn('guard', sel != null ? `守護 ${selName}` : '先點一位玩家', 'big', sel == null) + btn('gnone', '今晚不守人', 'ghost')) + info;
        }
        if (v.sub === 'witch') {
          if (me.wdone) return h + hint(me.wdone === 'save' ? '你用了解藥。等待天亮。' : me.wdone === 'poison' ? `你對 ${nm(me.wpoison)} 用了毒藥。等待天亮。` : '你今晚沒有用藥。等待天亮。') + info;
          const k = me.kill;
          let t = me.save ? (k == null || k < 0 ? '今晚沒有人被殺。' : `今晚被殺的是 <b>${nm(k)}</b>${k === s ? '（你自己）' : ''}。`) : '解藥已經用掉了，你不會知道今晚誰被殺。';
          t += '每晚只能用一瓶藥。';
          h += hint(t);
          const canSave = me.save && k != null && k >= 0 && !(k === s && v.nightNo > 1);
          if (me.save && k === s && v.nightNo > 1) h += `<p class="ww-sub">只有第一晚可以救自己。</p>`;
          if (this._mode === 'poison') {
            h += hint('點一位玩家，對他使用毒藥（不能毒自己）。');
            h += row(btn('poison', sel != null ? `毒 ${selName}` : '先點一位玩家', 'big danger', sel == null) + btn('mode-', '返回', 'ghost'));
          } else {
            h += row((canSave ? btn('save', `用解藥救 ${nm(k)}`, 'big') : '') + (me.poison ? btn('mode-poison', '用毒藥…', 'danger') : '') + btn('wpass', '今晚不用藥', 'ghost'));
            h += `<p class="ww-sub">剩下：${me.save ? '解藥 ×1' : ''}${me.save && me.poison ? '、' : ''}${me.poison ? '毒藥 ×1' : ''}${!me.save && !me.poison ? '沒有藥了' : ''}</p>`;
          }
          return h + info;
        }
        if (v.sub === 'seer') {
          if (me.sdone) { const c = me.checks[me.checks.length - 1]; return h + hint(`查驗結果：${nm(c.s)} 是 <b class="${c.wolf ? 'rd' : 'gd'}">${c.wolf ? '狼人' : '好人'}</b>。等待天亮。`) + info; }
          h += hint('點一位玩家查驗，會看到他是好人還是狼人。');
          return h + row(btn('check', sel != null ? `查驗 ${selName}` : '先點一位玩家', 'big', sel == null)) + info;
        }
      }
      // ===== 白天 =====
      const explodeBtn = me && me.alive && C.isWolf(me.role) && EXPLODE_OK.includes(ph)
        ? (this._mode === 'explode' && me.role === 'whitewolf'
          ? hint('白狼王自爆：點一位要一起帶走的玩家。') + row(btn('explode', sel != null ? `自爆並帶走 ${selName}` : '先點一位玩家', 'danger', sel == null) + btn('mode-', '取消', 'ghost'))
          : `<div class="ww-danger">${btn(me.role === 'whitewolf' ? 'mode-explode' : 'explode', '💥 自爆', 'danger sm')}</div>`) : '';
      if (ph === 'signup') {
        const on = me && v.signed.includes(s);
        h += hint('想當警長就按「上警」，可以再按一次取消。時間到結束。');
        if (me && me.alive) h += row(btn('run', on ? '取消上警' : '✋ 上警', on ? 'ghost big' : 'big'));
        h += `<p class="ww-sub">目前上警：${v.signed.length ? v.signed.map(nm).join('、') : '沒有人'}</p>`;
        return h + explodeBtn + info;
      }
      if (['espeech', 'epk', 'speech', 'pkspeech', 'lw'].includes(ph)) {
        const spk = v.speaker; const mine = spk === s;
        const what = { espeech: '警長競選發言', epk: '警長 PK 發言', speech: '發言', pkspeech: 'PK 發言', lw: '遺言' }[ph];
        h += `<ol class="ww-order">${v.order.map((x, k) => `<li class="${k < v.i ? 'done' : k === v.i ? 'now' : ''} ${(v.wd || {})[x] ? 'wd' : ''} ${!A[x] && ph !== 'lw' ? 'dead' : ''}">${k === v.i ? '🎤' : ''}${x + 1}</li>`).join('')}</ol>`;
        if (mine) {
          h += `<p class="turn-line">👉 輪到你${what}了，開麥克風說話</p>`;
          if (this._mode === 'duel') h += hint('騎士決鬥：點一位玩家。對方是狼人就狼人死亡、直接天黑；對方是好人就騎士死亡。') + row(btn('duel', sel != null ? `和 ${selName} 決鬥` : '先點一位玩家', 'danger', sel == null) + btn('mode-', '取消', 'ghost'));
          else h += row(btn('end', '結束' + (ph === 'lw' ? '遺言' : '發言'), 'big') + (ph === 'speech' && me.role === 'knight' && !v.knightUsed ? btn('mode-duel', '⚔️ 翻牌決鬥', 'danger') : ''));
        } else h += hint(`請 ${nm(spk)} ${what}，其他人的麥克風暫時關閉。`);
        if (ph === 'espeech' && me && v.cands.includes(s)) h += row(btn('withdraw', '退水（放棄競選）', 'ghost sm'));
        return h + explodeBtn + info;
      }
      if (ph === 'evote' || ph === 'vote') {
        const can = v.voters.includes(s);
        if (can) h += hint(ph === 'evote' ? `點一位候選人投票選警長（${v.cands.map(nm).join('、')}）。上警的人不能投票。` : v.round === 2 ? `PK 投票：只能投 ${v.cands.map(nm).join('、')}，平票的人不能投。` : '點一位玩家投票放逐，所有人同時投票，可以棄票、不能投自己。');
        if (can) {
          if (v.myVote != null) h += `<p class="ww-sub">你投了：${v.myVote < 0 ? '棄票' : nm(v.myVote)}（等其他人）</p>`;
          else h += row(btn('vote', sel != null ? `投給 ${selName}` : '先點一位玩家', 'big', sel == null) + btn('abstain', '棄票', 'ghost'));
        } else h += `<p class="ww-sub">${me && v.idiotUp.includes(s) ? '你已翻牌，不能投票。' : '你這一輪不能投票。'}</p>`;
        h += `<p class="ww-sub">已投票 ${v.votedN}／${v.voters.length} 人</p>`;
        return h + info;
      }
      if (ph === 'announce') {
        h += `<div class="ww-news">${v.dead.length ? `昨晚死亡：<b>${v.dead.map(nm).join('、')}</b>` : '昨晚是<b>平安夜</b>'}</div>`;
        return h + info;
      }
      if (ph === 'badge') {
        if (v.bs === s) {
          h += hint(v.idiotBadge ? '你翻牌後不能投票，請把警徽交給一位玩家，或撕掉。' : '你出局了，請把警徽交給一位活著的玩家，或撕掉（之後就沒有警長）。');
          h += row(btn('badge', sel != null ? `交給 ${selName}` : '先點一位玩家', 'big', sel == null) + btn('tear', '撕掉警徽', 'ghost'));
        } else h += hint(`等待 ${nm(v.bs)} 移交警徽…`);
        return h + info;
      }
      if (ph === 'skill') {
        if (v.ks === s) {
          if (v.canShoot) h += hint('你可以發動技能，帶走一位玩家。') + row(btn('shoot', sel != null ? `帶走 ${selName}` : '先點一位玩家', 'big danger', sel == null) + btn('skip', '不發動', 'ghost'));
          else h += hint('你出局了。' + (me.role === 'hunter' || me.role === 'wolfking' ? '你是被毒死的，不能發動技能。' : '你沒有可以發動的技能。')) + row(btn('skip', '確認', 'big'));
        } else h += hint(`${nm(v.ks)} 出局，等待他決定是否發動技能…`);
        return h + info;
      }
      if (ph === 'order') {
        if (v.sheriff === s) {
          const L = this._firstAlive(v, s, -1), Rr = this._firstAlive(v, s, 1);
          h += hint('你是警長，決定從哪一邊開始發言（你最後發言）。');
          h += row(btn('dirR', `從 ${nm(Rr)} 開始（號碼往大）`, 'big') + btn('dirL', `從 ${nm(L)} 開始（號碼往小）`, 'big'));
        } else h += hint(`等待警長 ${nm(v.sheriff)} 決定發言順序…`);
        return h + info;
      }
      if (ph === 'over') {
        const win = v.winner === 'wolf' ? '🐺 狼人陣營獲勝' : '🌞 好人陣營獲勝';
        const mine = me ? (C.isWolf(me.role) ? 'wolf' : 'good') === v.winner : null;
        h += `<div class="ww-win ${v.winner}"><h2>${win}</h2>${mine == null ? '' : `<p>${mine ? '你贏了！' : '你輸了'}</p>`}</div>`;
        h += `<details class="ww-replay" open><summary>每晚發生的事</summary><ul>${v.nights.map(x => `<li><b>第 ${x.n} 晚</b>：${v.comp.includes('guard') ? `守衛守 ${x.guard >= 0 ? nm(x.guard) : '沒人'}・` : ''}狼人殺 ${x.kill >= 0 ? nm(x.kill) : '沒人'}${x.save ? '・女巫救人' : ''}${x.poison >= 0 ? `・女巫毒 ${nm(x.poison)}` : ''}${x.check >= 0 ? `・預言家驗 ${nm(x.check)}` : ''} → ${x.dead.length ? x.dead.map(nm).join('、') + ' 死亡' : '平安夜'}</li>`).join('')}</ul></details>`;
        if (me) h += row(btn('again', '再來一局（同樣人數重新發身分）', 'big'));
        return h;
      }
      return h + info;
    },
    _firstAlive(v, s, d) { let x = s; for (let k = 0; k < v.n; k++) { x = (x + d + v.n) % v.n; if (v.alive[x]) return x; } return s; },
    // 只有自己看得到的資訊（查驗紀錄、狼隊友、藥）
    _privInfo(v) {
      const me = v.me; if (!me || v.phase === 'over') return '';
      const out = [];
      if (me.wolves) out.push(`狼隊友：${me.wolves.filter(w => w.s !== v.seat).map(w => nm(w.s) + (w.r !== 'wolf' ? `（${C.ROLE[w.r].n}）` : '')).join('、') || '沒有'}`);
      if (me.checks && me.checks.length) out.push('查驗紀錄：' + me.checks.map(c => `第 ${c.n} 晚 ${nm(c.s)} <b class="${c.wolf ? 'rd' : 'gd'}">${c.wolf ? '狼人' : '好人'}</b>`).join('、'));
      if (me.role === 'witch' && v.phase !== 'night') out.push(`藥：${me.save ? '解藥 ×1' : '解藥已用'}、${me.poison ? '毒藥 ×1' : '毒藥已用'}`);
      if (me.role === 'guard' && me.guardLast >= 0 && v.phase !== 'night') out.push(`昨晚守了 ${nm(me.guardLast)}`);
      if (me.role === 'knight') out.push(v.knightUsed ? '決鬥已經用過了' : '決鬥：輪到你發言時可以使用（整局一次）');
      return out.length ? `<div class="ww-priv">${out.map(x => `<p>${x}</p>`).join('')}<small>🔒 只有你看得到</small></div>` : '';
    },
    _act(b, v, ui, el) {
      const a = b.dataset.a, sel = this._sel; const send = (x) => { this._sel = null; this._mode = null; ui.send(x); };
      if (a.startsWith('mode-')) { this._mode = a.slice(5) || null; this._sel = null; this.render(el, v, ui); return; }
      switch (a) {
        case 'ready': return send({ type: 'ready' });
        case 'eyes': this._eyes = v.turnId; this.render(el, v, ui); return;
        case 'wpick': return sel != null && send({ type: 'wpick', t: sel });
        case 'wnone': return send({ type: 'wpick', t: -1 });
        case 'guard': return sel != null && send({ type: 'guard', t: sel });
        case 'gnone': return send({ type: 'guard', t: -1 });
        case 'save': return send({ type: 'witch', use: 'save' });
        case 'poison': return sel != null && confirm(`確定對 ${nm(sel)} 使用毒藥？`) && send({ type: 'witch', use: 'poison', t: sel });
        case 'wpass': return send({ type: 'witch', use: 'pass' });
        case 'check': return sel != null && send({ type: 'check', t: sel });
        case 'run': return send({ type: 'run' });
        case 'end': return send({ type: 'end' });
        case 'withdraw': return confirm('確定退水？退水後不能再競選，也不能投票。') && send({ type: 'withdraw' });
        case 'duel': return sel != null && confirm(`確定翻牌和 ${nm(sel)} 決鬥？整局只能用一次。`) && send({ type: 'duel', t: sel });
        case 'explode': return confirm(sel != null ? `確定自爆並帶走 ${nm(sel)}？` : '確定自爆？你會亮出狼人身分並出局，今天直接結束進入黑夜。') && send(sel != null ? { type: 'explode', t: sel } : { type: 'explode' });
        case 'vote': return sel != null && send({ type: 'vote', t: sel });
        case 'abstain': return send({ type: 'vote', t: -1 });
        case 'badge': return sel != null && send({ type: 'badge', t: sel });
        case 'tear': return confirm('確定撕掉警徽？之後這局就沒有警長了。') && send({ type: 'badge', t: -1 });
        case 'shoot': return sel != null && confirm(`確定帶走 ${nm(sel)}？`) && send({ type: 'shoot', t: sel });
        case 'skip': return send({ type: 'skip' });
        case 'dirR': return send({ type: 'dir', d: 1 });
        case 'dirL': return send({ type: 'dir', d: -1 });
        case 'again': return send({ type: 'again' });
      }
    },
    // 音效：天黑、天亮、輪到誰、結果（fx.js 的 GFX.onView 會呼叫 gfxHook）
    gfxHook(p, v, G) {
      G.want('off');
      if (!p || !root.GFX) return;
      const S = G.S;
      const dark = (x) => x.phase === 'night' || x.phase === 'deal';
      if (v.phase === 'night' && p.phase !== 'night') { S.nightfall && S.nightfall(); WWG._curtain('night'); }
      else if (!dark(v) && dark(p) && v.phase !== 'over') { S.dawn && S.dawn(); WWG._curtain('day'); }
      if (v.phase === 'announce' && p.phase !== 'announce' && v.dead.length) setTimeout(() => S.toll && S.toll(), 900);
      if (['vote', 'evote'].includes(v.phase) && p.phase !== v.phase) S.drum && S.drum();
      if (v.speaker != null && v.speaker !== p.speaker) S.pop && S.pop();
      if (v.phase === 'over' && p.phase !== 'over') {
        const me = v.me; if (!me) return;
        const won = (C.isWolf(me.role) ? 'wolf' : 'good') === v.winner;
        setTimeout(() => won ? G.win(v.winner === 'wolf' ? '🐺 狼人獲勝！' : '🌞 好人獲勝！', '你贏了') : G.lose(G.mock(), v.winner === 'wolf' ? '狼人獲勝' : '好人獲勝'), 900);
      }
    },
    // 天黑／天亮轉場（畫面內不放文字）
    _curtain(kind) {
      let c = document.getElementById('wwCurtain'); if (c) c.remove();
      c = document.createElement('div'); c.id = 'wwCurtain'; c.className = 'ww-curtain ' + kind;
      c.innerHTML = kind === 'night' ? '<div class="moon"></div><div class="stars"></div>' : '<div class="sun"></div>';
      document.body.appendChild(c); setTimeout(() => c.remove(), 2400);
    }
  };

  // ======================================================================
  // 一夜版
  // ======================================================================
  const OP = { deal: '發牌', night: '夜晚', day: '白天討論', vote: '投票', over: '揭曉' };
  function oMyTurn(v) {
    if (!v.me) return '';
    if (v.phase === 'deal' && !v.meReady) return '看你的牌';
    if (v.phase === 'night' && v.me.myStep && !v.me.done) {
      const r = v.me.orig;
      if (r === 'werewolf') return v.me.loneWolf ? '狼人請行動' : '';
      if (['seer', 'robber', 'troublemaker', 'drunk'].includes(r)) return O.ROLE[r].n + '請行動';
      return '';
    }
    if (v.phase === 'vote' && v.myVote == null) return '請投票';
    return '';
  }
  const ONG = {
    id: 'onenight', name: '一夜狼人', icon: '🌕', min: 3, max: 6, needVoice: true,
    desc: '狼人殺的小人數版本：每人一張牌、中間蓋 3 張，只有一個晚上——角色依序醒來偷看或交換牌，你的身分可能被換掉了自己都不知道。白天大家同時開麥討論幾分鐘，最後同時投票一次。投出狼人好人就贏。沒有人會中途出局，一局約 10 分鐘。每位玩家都要開「🎤 語音」。',
    options: [
      { key: 'talkT', label: '白天討論時間', choices: [[5, '5 分鐘'], [3, '3 分鐘'], [8, '8 分鐘']], def: 5 },
      { key: 'minion', label: '爪牙（站在狼人那邊）', choices: [[0, '不加'], [1, '加入']], def: 0 },
      { key: 'hunter', label: '獵人', choices: [[0, '不加'], [1, '加入']], def: 0 },
      { key: 'tanner', label: '皮匠（被投出去才贏）', choices: [[0, '不加'], [1, '加入']], def: 0 }
    ],
    init: O.init, action: O.action, tick: O.tick, auto: O.auto, view: O.view,
    myTurn: oMyTurn,
    render(el, v, ui) {
      this._last = { el, v, ui };
      el.dataset.g = 'onenight';
      UIX.newGame(this, v, 'o');
      const me = v.me, s = v.seat, ph = v.phase, over = ph === 'over';
      if (ph !== this._selPhase || v.sub !== this._selSub) { this._sel = null; this._sel2 = null; this._csel = []; this._selPhase = ph; this._selSub = v.sub; }
      this._csel = this._csel || [];
      const act = this._oact(v);
      const R = over && v.result;
      const cls = (i) => [i === s ? 'me' : '', act && act.p && act.p(i) ? 'pickable' : '', this._sel === i || this._sel2 === i ? 'sel' : '', R && R.dead.includes(i) ? 'dead' : '', R && R.win[i] ? 'won' : ''].join(' ');
      const badge = (i) => {
        let b = UIX.note(this, i);
        if (R) { const c = R.counts[i]; if (c) b += `<i class="b-votes">${c}票</i>`; }
        return b;
      };
      const under = over ? (i) => `<div class="ww-rv ${O.ROLE[v.cards[i]].t === 'wolf' ? 'w' : ''}">${O.ROLE[v.cards[i]].i}${O.ROLE[v.cards[i]].n}</div>${v.orig[i] !== v.cards[i] ? `<div class="ww-rv0">原本${O.ROLE[v.orig[i]].n}</div>` : ''}` : null;
      const center = [0, 1, 2].map(c => {
        const pick = act && act.c && act.c(c);
        return `<button class="ww-cc ${pick ? 'pickable' : ''} ${this._csel.includes(c) ? 'sel' : ''}" data-c="${c}" ${pick ? '' : 'disabled'}>${over ? `${O.ROLE[v.cards[v.n + c]].i}<small>${O.ROLE[v.cards[v.n + c]].n}</small>` : '🂠'}</button>`;
      }).join('');
      const RR = me ? O.ROLE[me.orig] : null;
      const mid = `<div class="ww-sky">${ph === 'night' || ph === 'deal' ? '🌕' : '☀️'}</div><div class="ww-center">${center}</div>${me && !over ? UIX.roleChip(this, RR.i, RR.n) : ''}`;
      const ring = UIX.ring(v, { cls, badge, under, mid });
      const top = `<div class="ww-top"><b>${OP[ph]}${ph === 'night' && v.sub ? `<small>・${O.ROLE[v.sub].n}醒來</small>` : ''}</b><span class="timer" data-deadline="${v.deadline || ''}"></span>
        <span class="ww-tools"><button class="btn ghost sm" data-help>？</button></span></div>`;
      const roleRow = me ? UIX.peekDesc(this, RR.d + '（這是你一開始拿到的牌，晚上可能被別人換掉）') : '<p class="ww-out">👀 觀戰中</p>';
      el.innerHTML = `<div class="ww onenight ${ph === 'night' || ph === 'deal' ? 'night' : ''} ${over ? 'over' : ''}">${top}${ring}<div class="ww-panel">${roleRow}${this._panel(v, act)}</div>
        ${this._help ? UIX.help(this, v) : ''}${UIX.noteMenu(this)}</div>`;
      UIX.bind(this, el, v, ui, (i) => {
        if (!act || !act.p || !act.p(i)) return;
        if (act.two) { if (this._sel === i) this._sel = null; else if (this._sel2 === i) this._sel2 = null; else if (this._sel == null) this._sel = i; else this._sel2 = i; this._csel = []; }
        else { this._sel = this._sel === i ? null : i; this._csel = []; }
        this.render(el, v, ui);
      });
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
        const c = +b.dataset.c; if (!act || !act.c || !act.c(c)) return;
        this._sel = null; this._sel2 = null;
        if (this._csel.includes(c)) this._csel = this._csel.filter(x => x !== c);
        else { this._csel.push(c); const max = act.cn || 1; if (this._csel.length > max) this._csel.shift(); }
        this.render(el, v, ui);
      });
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => this._act(b, v, ui, el));
    },
    _oact(v) {
      const me = v.me, s = v.seat; if (!me) return null;
      const other = (i) => i !== s;
      if (v.phase === 'night' && me.myStep && !me.done) {
        const r = me.orig;
        if (r === 'werewolf' && me.loneWolf) return { c: () => true, cn: 1 };
        if (r === 'seer') return { p: other, c: () => true, cn: 2 };
        if (r === 'robber') return { p: other };
        if (r === 'troublemaker') return { p: other, two: true };
        if (r === 'drunk') return { c: () => true, cn: 1 };
      }
      if (v.phase === 'vote' && v.myVote == null) return { p: other };
      return null;
    },
    _panel(v, act) {
      const me = v.me, s = v.seat, ph = v.phase, sel = this._sel, cs = this._csel;
      const hint = (t) => `<p class="ww-hint">${t}</p>`;
      const btn = (a, label, cls, dis) => `<button class="btn ${cls || ''}" data-a="${a}" ${dis ? 'disabled' : ''}>${label}</button>`;
      const row = (x) => `<div class="act-row">${x}</div>`;
      const info = me && me.info.length && ph !== 'over' ? `<div class="ww-priv">${me.info.map(x => `<p>${esc(x)}</p>`).join('')}<small>🔒 只有你看得到</small></div>` : '';
      let h = '';
      if (ph === 'deal') {
        h += hint(me ? '按住圓圈中間的「按住看身分」看你一開始拿到的牌，看完按「看過了」。' : '玩家正在看牌…');
        if (me) h += row(btn('ready', v.meReady ? '✔ 已看過' : '看過了', 'big', v.meReady));
        return h + `<p class="ww-sub">已準備 ${v.readyN}／${v.n} 人・這局的牌：${v.deck.map(r => O.ROLE[r].n).join('、')}</p>`;
      }
      if (ph === 'night') {
        const steps = `<ol class="ww-order steps">${v.steps.map(r => `<li class="${r === v.sub ? 'now' : v.steps.indexOf(r) < v.steps.indexOf(v.sub) ? 'done' : ''}">${O.ROLE[r].n}</li>`).join('')}</ol>`;
        h += steps;
        if (!me) return h + hint('夜晚進行中…');
        if (!me.myStep) return h + hint(`現在是${O.ROLE[v.sub].n}的時間，其他人請等待。`) + row(`<button class="btn ghost ${this._eyes === v.turnId ? 'on' : ''}" data-a="eyes">${this._eyes === v.turnId ? '😴 閉眼中' : '我閉眼了'}</button>`) + info;
        const r = me.orig;
        if (me.done || (r === 'werewolf' && !me.loneWolf) || r === 'minion' || r === 'insomniac') return h + hint(r === 'werewolf' && !me.loneWolf ? '看看你的狼隊友是誰（下方資訊）。' : r === 'minion' ? '看看誰是狼人（下方資訊）。' : r === 'insomniac' ? '看看你現在的牌（下方資訊）。' : '你已經行動了，等待下一位。') + info;
        if (r === 'werewolf') return h + hint('場上只有你一隻狼，可以點中間一張牌偷看（也可以不看）。') + row(btn('peek', cs.length ? `看中間第 ${cs[0] + 1} 張` : '先點中間一張牌', 'big', !cs.length) + btn('skip', '不看', 'ghost')) + info;
        if (r === 'seer') return h + hint('點一位玩家看他的牌，或點中間兩張牌看。') + row(btn('see', sel != null ? `看 ${nm(sel)} 的牌` : cs.length === 2 ? `看中間第 ${cs[0] + 1}、${cs[1] + 1} 張` : '先點一位玩家或中間兩張', 'big', !(sel != null || cs.length === 2)) + btn('skip', '不看', 'ghost')) + info;
        if (r === 'robber') return h + hint('點一位玩家，和他交換牌，然後你會看到換到的新牌。') + row(btn('rob', sel != null ? `和 ${nm(sel)} 交換` : '先點一位玩家', 'big', sel == null) + btn('skip', '不換', 'ghost')) + info;
        if (r === 'troublemaker') return h + hint('點兩位其他玩家，交換他們的牌（你看不到內容）。') + row(btn('tm', sel != null && this._sel2 != null ? `交換 ${nm(sel)} 和 ${nm(this._sel2)}` : '先點兩位玩家', 'big', !(sel != null && this._sel2 != null)) + btn('skip', '不換', 'ghost')) + info;
        if (r === 'drunk') return h + hint('一定要點中間一張牌和自己交換（看不到換到什麼）。時間到會隨機換一張。') + row(btn('drunk', cs.length ? `換中間第 ${cs[0] + 1} 張` : '先點中間一張牌', 'big', !cs.length)) + info;
        return h + info;
      }
      if (ph === 'day') {
        h += hint(`大家開麥自由討論。時間到或全員都按「提早投票」就開始投票。`);
        if (me) h += row(btn('early', v.meEarly ? '取消提早投票' : '提早投票', v.meEarly ? 'ghost' : ''));
        return h + `<p class="ww-sub">想提早投票：${v.earlyN}／${v.n} 人</p>` + info;
      }
      if (ph === 'vote') {
        h += hint('點一位玩家投票（不能投自己）。所有人同時投票，投完會一起揭曉。');
        if (me) h += v.myVote != null ? `<p class="ww-sub">你投了 ${nm(v.myVote)}，等其他人…</p>` : row(btn('vote', sel != null ? `投給 ${nm(sel)}` : '先點一位玩家', 'big', sel == null));
        return h + `<p class="ww-sub">已投票 ${v.votedN}／${v.n} 人</p>` + info;
      }
      if (ph === 'over') {
        const R = v.result; const won = me ? R.win[s] : null;
        const title = R.dead.length ? `出局：${R.dead.map(nm).join('、')}` : '沒有人出局';
        const team = R.win.some((w, i) => w && O.ROLE[v.cards[i]].t === 'wolf') ? '🐺 狼人隊獲勝' : R.win.some((w, i) => w && O.ROLE[v.cards[i]].t === 'vil') ? '🌞 好人獲勝' : '';
        const tan = R.win.some((w, i) => w && v.cards[i] === 'tanner') ? '🪡 皮匠獲勝' : '';
        h += `<div class="ww-win ${team.includes('狼') ? 'wolf' : 'good'}"><h2>${[team, tan].filter(Boolean).join('・') || '沒有人獲勝'}</h2><p>${title}</p>${won == null ? '' : `<p>${won ? '你贏了！' : '你輸了'}（你最後是「${O.ROLE[v.cards[s]].n}」）</p>`}</div>`;
        const ACT = (a) => a.r === 'werewolf' ? `${nm(a.s)}（狼人）偷看中間第 ${a.c + 1} 張` : a.r === 'seer' ? `${nm(a.s)}（預言家）看了 ${a.p != null ? nm(a.p) : `中間第 ${a.c[0] + 1}、${a.c[1] + 1} 張`}` : a.r === 'robber' ? `${nm(a.s)}（強盜）和 ${nm(a.p)} 交換` : a.r === 'troublemaker' ? `${nm(a.s)}（搗蛋鬼）交換了 ${nm(a.a)} 和 ${nm(a.b)}` : `${nm(a.s)}（酒鬼）和中間第 ${a.c + 1} 張交換${a.auto ? '（時間到隨機）' : ''}`;
        h += `<details class="ww-replay" open><summary>晚上發生的事</summary><ul>${v.acts.length ? v.acts.map(a => `<li>${ACT(a)}</li>`).join('') : '<li>沒有人換牌</li>'}</ul></details>`;
        h += `<details class="ww-replay"><summary>投票</summary><ul>${Object.keys(R.votes).map(k => `<li>${nm(+k)} → ${nm(R.votes[k])}</li>`).join('') || '<li>沒有人投票</li>'}</ul></details>`;
        if (me) h += row(btn('again', '再來一局', 'big'));
      }
      return h;
    },
    _act(b, v, ui, el) {
      const a = b.dataset.a, sel = this._sel, cs = this._csel || []; const send = (x) => { this._sel = null; this._sel2 = null; this._csel = []; ui.send(x); };
      switch (a) {
        case 'ready': return send({ type: 'ready' });
        case 'eyes': this._eyes = v.turnId; this.render(el, v, ui); return;
        case 'peek': return cs.length && send({ type: 'peek', c: cs[0] });
        case 'see': return sel != null ? send({ type: 'see', p: sel }) : cs.length === 2 && send({ type: 'see', c: cs.slice() });
        case 'rob': return sel != null && send({ type: 'rob', p: sel });
        case 'tm': return sel != null && this._sel2 != null && send({ type: 'tm', a: sel, b: this._sel2 });
        case 'drunk': return cs.length && send({ type: 'drunk', c: cs[0] });
        case 'skip': return send({ type: 'skip' });
        case 'early': return send({ type: 'early' });
        case 'vote': return sel != null && send({ type: 'vote', t: sel });
        case 'again': return send({ type: 'again' });
      }
    },
    gfxHook(p, v, G) {
      G.want('off');
      if (!p || !root.GFX) return; const S = G.S;
      if (v.phase === 'night' && p.phase !== 'night') { S.nightfall && S.nightfall(); WWG._curtain('night'); }
      if (v.phase === 'day' && p.phase !== 'day') { S.dawn && S.dawn(); WWG._curtain('day'); }
      if (v.phase === 'night' && p.phase === 'night' && v.sub !== p.sub) S.pop && S.pop();
      if (v.phase === 'vote' && p.phase !== 'vote') S.drum && S.drum();
      if (v.phase === 'over' && p.phase !== 'over' && v.me) { const won = v.result.win[v.seat]; setTimeout(() => won ? G.win('🎉 你贏了！', '') : G.lose(G.mock(), ''), 900); }
    }
  };

  root.GAMES.werewolf = WWG;
  root.GAMES.onenight = ONG;
})(typeof window !== 'undefined' ? window : globalThis);
