// 介面
(function () {
  const $ = (s) => document.querySelector(s);
  const U = window.GUTIL, R = window.Room, V = window.Net.Voice;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const GAME_ORDER = ['monopoly', 'mahjong', 'bigtwo', 'slap', 'rummi', 'dice', 'draw'];

  let curGame = null, chatOpen = false, unread = 0, wakeLock = null;

  function toast(msg, ms) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, ms || 2400);
  }
  function show(id) { document.querySelectorAll('.screen').forEach(s => s.hidden = s.id !== id); }
  // LINE 點開邀請連結時直接跳到外部瀏覽器（openExternalBrowser 是 LINE 官方支援的參數）
  function inviteLink() { return location.origin + location.pathname + '?pin=' + R.pin + (window.Net.LOCAL ? '&local=1' : '') + '&openExternalBrowser=1'; }
  // App 內建瀏覽器（IG、FB、LINE、Google App…）切出去就容易被系統關掉，語音也常常不能用
  (function inAppWarn() {
    const ua = navigator.userAgent || '';
    const app = /Instagram/i.test(ua) ? 'Instagram' : /FBAN|FBAV|FB_IAB/i.test(ua) ? 'Facebook' : /\bLine\//i.test(ua) ? 'LINE' : /GSA\//i.test(ua) ? 'Google App' : /; wv\)/.test(ua) ? 'App' : '';
    if (!app) return;
    const ios = /iPhone|iPad|iPod/i.test(ua);
    const d = document.createElement('div'); d.className = 'inapp-warn';
    d.innerHTML = `<b>⚠️ 你正在用 ${app} 內建的瀏覽器</b><span>切出去很容易斷線回不來、語音也可能沒聲音。請點右上角「⋯」或分享按鈕，選「${ios ? '用 Safari 開啟' : '用 Chrome 開啟'}」。</span><button class="btn sm" data-copy>複製網址</button><button class="x" data-x>✕</button>`;
    document.body.appendChild(d);
    d.querySelector('[data-x]').onclick = () => d.remove();
    d.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(location.href); toast('已複製，貼到 Safari／Chrome 打開'); } catch (e) { prompt('複製這個網址，貼到 Safari／Chrome：', location.href); } };
  })();
  async function keepAwake() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} }
  // 從 LINE 等其他 App 切回來：馬上重連；房間不見了就用暫存救回
  const wake = () => { if (!R.pin) return; keepAwake(); R.wake().catch(() => {}); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake(); });
  window.addEventListener('pageshow', wake); window.addEventListener('online', wake); window.addEventListener('focus', wake);

  window.UI = { needAudioTap() { $('#audioTap').hidden = false; } };
  $('#audioTap').onclick = () => { V.resumeAll(); $('#audioTap').hidden = true; };

  // ---------------- 首頁 ----------------
  $('#nameInput').value = ls.get('name') || '';
  const qp = new URLSearchParams(location.search);
  if (qp.get('pin')) $('#pinInput').value = qp.get('pin');
  function getName() {
    const n = $('#nameInput').value.trim();
    if (!n) { $('#homeMsg').textContent = '先輸入暱稱'; $('#nameInput').focus(); return null; }
    ls.set('name', n); return n;
  }
  function busy(b) { $('#createBtn').disabled = b; $('#joinBtn').disabled = b; }
  $('#createBtn').onclick = async () => {
    const name = getName(); if (!name) return;
    busy(true); $('#homeMsg').textContent = '建立中…';
    try { await R.create(name); enterRoom(); } catch (e) { $('#homeMsg').textContent = e.message || String(e); }
    busy(false);
  };
  $('#joinBtn').onclick = async () => {
    const name = getName(); if (!name) return;
    const pin = $('#pinInput').value.replace(/\D/g, '');
    if (pin.length !== 6) { $('#homeMsg').textContent = 'PIN 是 6 位數字'; return; }
    busy(true); $('#homeMsg').textContent = '連線中…';
    // 測試房 777777：先試著自己開；已經有人開著（房號被占用）才改成加入
    if (pin === '777777' && !$('#specCheck').checked) {
      try { await R.create(name, pin); enterRoom(); toast('🧪 已開啟測試房，可以在大廳加電腦玩家', 3500); busy(false); return; }
      catch (e) { try { R.peer && R.peer.destroy(); } catch (_) {} R.peer = null; R.isHost = false; try { Host.stop(); } catch (_) {} }
    }
    try { const r = await R.join(pin, name, $('#specCheck').checked); enterRoom(); if (r === 'revived') toast('房間已從這台裝置的暫存救回，請朋友用同一個 PIN 回來', 4000); }
    catch (e) {
      // 測試房 777777：房間不存在就直接由自己開
      if (pin === '777777') { try { try { R.peer && R.peer.destroy(); } catch (_) {} R.peer = null; R._connecting = false; await R.create(name, pin); enterRoom(); toast('🧪 已開啟測試房，可以在大廳加電腦玩家', 3500); busy(false); return; } catch (e2) { e = e2; } }
      $('#homeMsg').textContent = e.message || String(e);
    }
    busy(false);
  };
  $('#pinInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#joinBtn').click(); });
  // 首頁：6 小時內玩過的房間，一鍵回去
  (function resumeList() {
    let list = [];
    try { Object.keys(localStorage).filter(k => k.startsWith('snap:')).forEach(k => { const v = JSON.parse(localStorage.getItem(k)); if (v && Date.now() - v.t < 6 * 3600 * 1000) list.push({ pin: k.slice(5), t: v.t, game: v.snap && v.snap.game && v.snap.game.id }); }); } catch (e) {}
    list.sort((a, b) => b.t - a.t); list = list.slice(0, 3);
    if (!list.length) return;
    const box = document.createElement('div'); box.className = 'resume';
    box.innerHTML = '<p>回到最近的房間</p>' + list.map(r => `<button class="btn ghost sm" data-pin="${r.pin}">PIN ${r.pin}${r.game && window.GAMES[r.game] ? '・' + window.GAMES[r.game].name : ''}・${Math.max(1, Math.round((Date.now() - r.t) / 60000))} 分鐘前</button>`).join('');
    $('.home-card').insertBefore(box, $('#homeMsg'));
    box.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => { $('#pinInput').value = b.dataset.pin; $('#joinBtn').click(); });
  })();

  // 鎖定版面高度＝實際可視高度（含手機鍵盤彈出時），避免畫面上下跳
  // 鍵盤打開時（尤其舊 iPhone）不要把頁面捲回頂端，並把輸入框貼在鍵盤正上方
  function setVH() {
    const vv = window.visualViewport, h = (vv && vv.height) || window.innerHeight;
    const ae = document.activeElement, typing = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae.type !== 'range';
    const kb = typing && vv && window.innerHeight - vv.height > 120;
    document.body.classList.toggle('kb-open', !!kb);
    if (kb) { document.documentElement.style.setProperty('--kb-bottom', (vv.offsetTop + vv.height) + 'px'); return; }
    document.documentElement.style.setProperty('--vh', h + 'px'); if (document.body.classList.contains('in-room')) window.scrollTo(0, 0);
  }
  document.addEventListener('focusin', () => setTimeout(setVH, 50)); document.addEventListener('focusout', () => setTimeout(setVH, 80));
  setVH(); window.addEventListener('resize', setVH); if (window.visualViewport) { window.visualViewport.addEventListener('resize', setVH); window.visualViewport.addEventListener('scroll', setVH); }
  function enterRoom() {
    document.body.classList.add('in-room');
    $('#homeMsg').textContent = '';
    show('room'); $('#pinText').textContent = R.pin;
    history.replaceState(null, '', '?pin=' + R.pin + (window.Net.LOCAL ? '&local=1' : ''));
    keepAwake();
  }

  // ---------------- 房間事件 ----------------
  R.cb.status = (msg, warn) => {
    const s = $('#status');
    if (!msg) { s.hidden = true; return; }
    if (warn && R.room) { toast(msg); return; }
    s.textContent = msg; s.hidden = false;
  };
  R.cb.left = () => { location.href = location.pathname + (window.Net.LOCAL ? '?local=1' : ''); };
  $('#pilotBtn').onclick = () => { const me = R.room && R.room.members.find(m => m.cid === R.cid); const on = !(me && me.auto); R.send({ t: 'autopilot', on }); toast(on ? '已開啟託管：系統會幫你出牌，再按一次取消' : '已取消託管'); };
  R.cb.room = (room) => {
    // 桌面風格：平常都是星雲霓虹；大富翁開局後跟著選的主題（不用另外選）
    { const th = room.game && room.game.id === 'monopoly' && room.game.opts && room.game.opts.theme; document.body.dataset.skin = ['ragnarok', 'cyber', 'animal', 'buddha', 'magic', 'alien', 'town'].includes(th) ? th : 'nebula'; }
    { const me = room.members.find(m => m.cid === R.cid); const seated = room.game && me && room.game.seats.includes(me.cid);
      $('#pilotBtn').hidden = !seated; $('#pilotBtn').classList.toggle('on', !!(me && me.auto)); }
    renderMembers(room);
    const host = R.isHost;
    $('#endBtn').hidden = !(host && room.game) && !(room.game && lastPhaseOver);
    if (!room.game) lastPhaseOver = false;
    if (!room.game && window.GFX) { GFX.want('off'); document.body.classList.remove('res-open', 'res-peek'); }
    if (!room.game) { document.body.classList.remove('in-mono'); if (curGame && window.GAMES[curGame].destroy) window.GAMES[curGame].destroy(); curGame = null; $('#game').innerHTML = ''; $('#game').dataset.g = ''; $('#lobby').hidden = false; renderLobby(room); }
    else { $('#lobby').hidden = true; }
  };
  let prevView = null, lastPhaseOver = false;
  // 結算畫面：蓋在牌桌上面，不用往下滑；可以按「看牌桌」暫時收起
  function resultLayer(el) {
    const r = el.querySelector('.mj-result, .b2-over');
    document.body.classList.toggle('res-open', !!r);
    if (!r) { document.body.classList.remove('res-peek'); return; }
    if (!r.querySelector('.res-peek-btn')) { const b = document.createElement('button'); b.className = 'btn ghost sm res-peek-btn'; b.textContent = '看牌桌'; b.onclick = (e) => { e.stopPropagation(); document.body.classList.add('res-peek'); }; r.appendChild(b); }
    let pill = document.getElementById('resPill');
    if (!pill) { pill = document.createElement('button'); pill.id = 'resPill'; pill.className = 'btn res-pill'; pill.textContent = '📋 看結算'; pill.onclick = () => document.body.classList.remove('res-peek'); document.body.appendChild(pill); }
  }
  // ===== 輪到你了：整個畫面金色呼吸外框＋大字提示＋叮咚聲＋震動（牌類遊戲共用）=====
  const MYTURN = {
    bigtwo: (v) => v.phase === 'play' && v.turn === v.seat ? '輪到你出牌' : '',
    rummi: (v) => v.phase === 'play' && v.turn === v.seat ? '輪到你了' : '',
    dice: (v) => v.phase === 'bid' && v.turn === v.seat ? '輪到你喊' : '',
    mahjong: (v) => !v.me ? '' : v.me.claim ? '可以' + [v.me.claim.hu && '胡', v.me.claim.kong && '槓', v.me.claim.pong && '碰', v.me.claim.chi && '吃'].filter(Boolean).join('／') + '！' : v.phase === 'discard' && v.turn === v.me.p ? '輪到你打牌' : ''
  };
  let turnKey = '';
  function yourTurn(id, v) {
    const f = MYTURN[id]; const txt = f ? f(v) : '';
    document.body.classList.toggle('my-turn', !!txt);
    if (!txt) { turnKey = ''; if (document.title.startsWith('🔔')) document.title = document.title.replace(/^🔔 [^｜]*｜/, ''); return; }
    const k = id + ':' + txt + ':' + (v.turnId != null ? v.turnId : (v.history ? v.history.length : '')) + ':' + (v.round || '') + ':' + (v.handNo || '');
    if (turnKey === k) return; turnKey = k;
    try { window.GFX && GFX.S.myturn(); } catch (e) {}
    try { navigator.vibrate && navigator.vibrate([90, 60, 90]); } catch (e) {}
    if (document.hidden && !document.title.startsWith('🔔')) document.title = '🔔 ' + txt + '｜' + document.title;
    let b = document.getElementById('turnBanner'); if (!b) { b = document.createElement('div'); b.id = 'turnBanner'; document.body.appendChild(b); }
    b.textContent = txt; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && document.title.startsWith('🔔')) document.title = document.title.replace(/^🔔 [^｜]*｜/, ''); });
  R.cb.view = (v) => {
    const room = R.room; if (!room || !room.game) return;
    const mod = window.GAMES[room.game.id];
    const el = $('#game');
    if (curGame !== room.game.id) { if (curGame && window.GAMES[curGame].destroy) window.GAMES[curGame].destroy(); curGame = room.game.id; el.innerHTML = ''; el.dataset.g = ''; prevView = null; }
    document.body.classList.toggle('in-mono', room.game.id === 'monopoly');
    try { window.GFX && GFX.onView(room.game.id, prevView, v); } catch (e) { console.error(e); }
    prevView = v; lastPhaseOver = ['over', 'end'].includes(v.phase); if (room.game) $('#endBtn').hidden = !(R.isHost || lastPhaseOver);
    try { mod.render(el, v, gameUI(v)); } catch (e) { console.error(e); }
    resultLayer(el);
    yourTurn(room.game.id, v);
    tickTimers();
  };
  R.cb.ev = (ev) => { const room = R.room; if (!room || !room.game) return; const mod = window.GAMES[room.game.id]; if (mod.onEvent) mod.onEvent(ev); };
  R.cb.chat = (m) => {
    const log = $('#chatLog');
    const p = document.createElement('p'); p.className = m.sys ? 'sys' : '';
    p.innerHTML = m.sys ? U.esc(m.text) : `<b>${U.esc(m.from)}</b>：${U.esc(m.text)}`;
    log.appendChild(p); log.scrollTop = log.scrollHeight;
    if (!chatOpen && !m.sys) { unread++; $('#chatBadge').textContent = unread; $('#chatBadge').hidden = false; toast(`${m.from}：${m.text}`, 2500); }
  };
  // 遊戲紀錄：寫進聊天室（只在自己畫面，不會傳給別人），通知框消失後還能回頭看
  window.gameLog = (html) => {
    const log = $('#chatLog'); if (!log) return;
    const p = document.createElement('p'); p.className = 'glog';
    const t = new Date(); p.innerHTML = `<i>${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}</i>${html}`;
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.appendChild(p); const gl = log.querySelectorAll('.glog'); if (gl.length > 300) gl[0].remove();
    if (atBottom) log.scrollTop = log.scrollHeight;
  };
  function gameUI(v) { return { send: (a) => R.act(a), toast, seat: v.seat, isSpec: v.seat < 0 }; }

  function tickTimers() {
    const now = R.serverNow();
    document.querySelectorAll('[data-deadline]').forEach(e => {
      const d = +e.dataset.deadline; if (!d) { e.textContent = ''; return; }
      const s = Math.max(0, Math.ceil((d - now) / 1000)); e.textContent = '⏱ ' + s; e.classList.toggle('urgent', s <= 5);
    });
  }
  setInterval(tickTimers, 250);

  // 說話指示：頭像發光＋上方「正在說話」列（人再多也看得到）
  const talkUntil = {};
  setInterval(() => {
    const bar = $('#speakers');
    if (V.mode === 'off' || !R.room) { bar.hidden = true; return; }
    const lv = V.levels(); const myPeer = R.peer && R.peer.id; const now = Date.now();
    R.room.members.forEach(m => { const l = m.peerId === myPeer ? (V.muted ? 0 : lv.me) : lv[m.peerId]; if ((l || 0) > 18) talkUntil[m.cid] = now + 600; });
    const talking = R.room.members.filter(m => (talkUntil[m.cid] || 0) > now);
    document.querySelectorAll('.mchip').forEach(ch => ch.classList.toggle('speaking', (talkUntil[ch.dataset.cid] || 0) > now));
    if (!talking.length) { bar.hidden = true; return; }
    bar.hidden = false;
    bar.innerHTML = talking.map(m => `<span><i class="mav" style="background:${avColor(m.name)}">${m.avatar ? `<img src="${m.avatar}">` : U.esc([...m.name][0] || '?')}</i>${U.esc(m.name)}</span>`).join('') + '<b>🎤</b>';
  }, 150);

  function avColor(name) { let h = 0; for (const ch of name) h = (h * 31 + ch.codePointAt(0)) % 360; return `hsl(${h},55%,45%)`; }
  function renderMembers(room) {
    const meHost = R.isHost;
    $('#members').innerHTML = room.members.map(m => `
      <div class="mchip ${m.online ? '' : 'off'} ${m.role === 'spec' ? 'spec' : ''}" data-peer="${U.esc(m.peerId)}" data-cid="${U.esc(m.cid)}">
        <span class="mav" style="background:${avColor(m.name)}">${m.avatar ? `<img src="${m.avatar}">` : U.esc([...m.name][0] || '?')}</span>
        ${m.cid === room.hostCid ? '👑' : ''}${U.esc(m.name)}${m.cid === R.cid ? '（你）' : ''}
        <span class="vi">${m.voice === 'talk' ? '🎤' : m.voice === 'listen' ? '🎧' : ''}</span>${m.bot ? '<small>🤖電腦</small>' : m.auto ? '<small>🤖託管</small>' : ''}${m.role === 'spec' ? '<small>觀戰</small>' : ''}${!m.online ? '<small>離線</small>' : ''}${m.cid === room.heir ? '<small>候補房主</small>' : ''}
        ${meHost && m.cid !== R.cid && m.online && !m.bot ? `<button class="crown" data-hand="${U.esc(m.cid)}" title="把房主交給他">👑</button>` : ''}
        ${meHost && m.cid !== R.cid ? `<button class="kick" data-kick="${U.esc(m.cid)}" title="請出房間">×</button>` : ''}
      </div>`).join('');
    $('#members').querySelectorAll('[data-hand]').forEach(b => b.onclick = (e) => {
      e.stopPropagation(); const m = room.members.find(x => x.cid === b.dataset.hand);
      if (m && confirm(`把房主交給 ${m.name}？\n交出去後換他選遊戲、開始和設定，你會用玩家身分自動重新加入（約 3 秒）。`)) R.send({ t: 'handover', cid: m.cid });
    });
    $('#members').querySelectorAll('[data-kick]').forEach(b => b.onclick = (e) => {
      e.stopPropagation(); const m = room.members.find(x => x.cid === b.dataset.kick);
      if (m && (m.bot || confirm(`把 ${m.name} 請出房間？`))) R.send({ t: 'kick', cid: m.cid });
    });
  }

  // 大富翁主題預覽：每個主題 3 張遊戲畫面＋拉霸隨機
  function themeGrid(mod, opts, host) {
    const o = mod.options.find(x => x.key === 'theme');
    return `<div class="theme-pick"><div class="tp-head"><span>主題</span>${host ? '<button class="btn sm" id="spinBtn">🎰 隨機選</button>' : ''}</div>
      <div class="tp-grid">${o.choices.map(([v, l]) => `<button class="tp-card ${String(opts.theme) === v ? 'on' : ''}" data-theme="${v}" ${host ? '' : 'disabled'}>
        <div class="tp-shots">${[0, 1, 2].map(k => `<img src="img/themes/${v}-${k}.jpg" alt="" loading="lazy" style="animation-delay:${k * -3}s">`).join('')}</div>
        <b>${l}</b></button>`).join('')}</div></div>`;
  }
  let spinSeen = null, spinning = false;
  function runSpin(spin, done) {
    const cards = [...$('#lobby').querySelectorAll('.tp-card')]; if (!cards.length) return done();
    spinning = true; const target = cards.findIndex(c => c.dataset.theme === String(spin.to));
    const total = cards.length * 4 + ((target - 0 + cards.length) % cards.length); let i = 0;
    cards.forEach(c => c.classList.remove('on'));
    const step = () => {
      cards.forEach(c => c.classList.remove('spin')); const c = cards[i % cards.length]; c.classList.add('spin');
      try { window.GFX && GFX.S.tick(); } catch (e) {}
      if (i >= total) { c.classList.remove('spin'); c.classList.add('on', 'won'); try { GFX.S.ding(); GFX.S.pop(); } catch (e) {} setTimeout(() => { spinning = false; done(); }, 1100); return; }
      const left = total - i; i++; setTimeout(step, left < 6 ? 120 + (6 - left) * 90 : 70);
    };
    step();
  }
  function renderLobby(room) {
    const ae = document.activeElement; if (ae && ae.tagName === 'TEXTAREA' && $('#lobby').contains(ae)) { ae.onblur = () => { ae.dispatchEvent(new Event('change')); setTimeout(() => renderLobby(R.room), 50); }; return; }
    if (spinning) return;
    const host = R.isHost; const lobby = room.lobby; const sel = lobby.gameId;
    const mod = window.GAMES[sel];
    const players = room.members.filter(m => m.online && m.role === 'player');
    const opts = Object.assign({}, ...(mod.options || []).map(o => ({ [o.key]: o.def })), lobby.opts || {});
    (mod.options || []).forEach(o => { if (o.choices && !o.choices.some(([v]) => String(v) === String(opts[o.key]))) opts[o.key] = o.def; });
    const me = room.members.find(m => m.cid === R.cid);
    const countOk = players.length >= mod.min && players.length <= mod.max;
    $('#lobby').innerHTML = `
      <h2 class="lobby-title">${host ? '選一個遊戲' : '等房主選遊戲並開始'}</h2>
      <div class="game-grid">${GAME_ORDER.map(id => { const g = window.GAMES[id]; return `
        <button class="gcard ${id === sel ? 'on' : ''}" data-g="${id}" ${host ? '' : 'disabled'}>
          <span class="gi">${g.icon}</span><b>${g.name}</b><small>${g.min === g.max ? g.min : g.min + '–' + g.max} 人</small></button>`; }).join('')}</div>
      <div class="lobby-detail">
        <p class="gdesc">${U.esc(mod.desc)}</p>
        ${sel === 'monopoly' ? themeGrid(mod, opts, host) : ''}
        ${(mod.options || []).filter(o => !(sel === 'monopoly' && o.key === 'theme')).map(o => o.type === 'text' ? (host ? `<label class="opt col"><span>${o.label}</span>
          <textarea data-opt="${o.key}" rows="2" maxlength="1500" placeholder="${U.esc(o.placeholder || '')}">${U.esc(opts[o.key] || '')}</textarea><small class="hint">其他人看不到內容，只會看到題目數量</small></label>`
          : `<label class="opt"><span>${o.label}</span><span class="hint">${String(opts[o.key] || '').split(/[,，、\s\n]+/).filter(Boolean).length} 題（房主設定，內容保密）</span></label>`) : `<label class="opt"><span>${o.label}</span>
          <select data-opt="${o.key}" ${host ? '' : 'disabled'}>${o.choices.map(([v, l]) => `<option value="${v}" ${String(opts[o.key]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`).join('')}
        ${sel === 'mahjong' ? `<p class="gdesc small">目前 ${players.length} 位玩家：${players.length === 3 ? '三人麻將（拿掉萬子）' : players.length === 4 ? '標準四人' : players.length === 5 ? '五人，每局輪流一人休息' : '需要 3–5 人'}</p>` : ''}
        ${room.test && host ? `<div class="testbox"><b>🧪 測試房</b><span>電腦玩家會自動出牌，用來測試遊戲流程</span>
          <div class="act-row"><button class="btn sm" id="addBot" ${players.length >= mod.max ? 'disabled' : ''}>＋ 加電腦玩家</button><button class="btn ghost sm" id="fillBot" ${players.length >= mod.max ? 'disabled' : ''}>補滿到 ${mod.max} 人</button><button class="btn ghost sm" id="clearBot" ${room.members.some(m => m.bot) ? '' : 'disabled'}>移除全部電腦</button></div></div>` : ''}
        <p class="pcount ${countOk ? '' : 'bad'}">玩家 ${players.length} 人（${mod.min}–${mod.max} 人）${countOk ? '' : ' — 人數不符'}</p>
        <div class="act-row">
          <button class="btn ghost" id="myRole">${me && me.role === 'spec' ? '我要當玩家' : '我改成觀戰'}</button>
          ${host ? `<button class="btn big" id="startBtn" ${countOk ? '' : 'disabled'}>開始遊戲</button>` : ''}
        </div>
        <div class="invite"><p>邀請朋友：把 PIN <b>${R.pin}</b> 告訴他們，或</p><button class="btn sm" id="inviteBtn">複製邀請連結</button></div>
      </div>`;
    $('#lobby').querySelectorAll('[data-g]').forEach(b => b.onclick = () => R.send({ t: 'lobby', gameId: b.dataset.g, opts: {} }));
    $('#lobby').querySelectorAll('[data-theme]').forEach(b => b.onclick = () => { if (!host) return; R.send({ t: 'lobby', gameId: sel, opts: Object.assign({}, lobby.opts, { theme: b.dataset.theme }) }); });
    if ($('#spinBtn')) $('#spinBtn').onclick = () => R.send({ t: 'spin', key: 'theme' });
    if (lobby.spin && lobby.spin.id !== spinSeen) { const first = spinSeen === null && !R._spinReady; spinSeen = lobby.spin.id; if (!first) runSpin(lobby.spin, () => renderLobby(R.room)); }
    R._spinReady = true;
    $('#lobby').querySelectorAll('[data-opt]').forEach(s => s.onchange = () => {
      const o = Object.assign({}, lobby.opts); o[s.dataset.opt] = s.tagName === 'TEXTAREA' || isNaN(+s.value) || s.value === '' ? s.value : +s.value;
      R.send({ t: 'lobby', gameId: sel, opts: o });
    });
    $('#myRole').onclick = () => R.send({ t: 'role', role: me && me.role === 'spec' ? 'player' : 'spec' });
    if (host) $('#startBtn').onclick = () => R.send({ t: 'start' });
    $('#inviteBtn').onclick = copyInvite;
    if ($('#addBot')) {
      $('#addBot').onclick = () => R.send({ t: 'addbot' });
      $('#fillBot').onclick = () => { for (let i = players.length; i < mod.max; i++) R.send({ t: 'addbot' }); };
      $('#clearBot').onclick = () => R.send({ t: 'clearbots' });
    }
  }

  async function copyInvite() {
    const link = inviteLink();
    try { await navigator.clipboard.writeText(link); toast('已複製邀請連結'); } catch (e) { prompt('複製這個連結：', link); }
  }
  $('#pinBtn').onclick = copyInvite;
  $('#shareBtn').onclick = async () => {
    $('#menu').hidden = true;
    if (navigator.share) { try { await navigator.share({ title: '來打牌！', text: `房間 PIN：${R.pin}`, url: inviteLink() }); } catch (e) {} }
    else copyInvite();
  };

  // ---------------- 選單 ----------------
  $('#menuBtn').onclick = (e) => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; try { qLabel(); sfxLabel(); } catch (x) {} };
  document.addEventListener('click', (e) => { if (!e.target.closest('#menu')) $('#menu').hidden = true; });
  $('#leaveBtn').onclick = () => { const h = R.room && R.room.members.find(m => m.cid === R.room.heir);
    if (confirm(R.isHost ? (h ? `你是房主，離開後會由「${h.name}」接手當房主，遊戲繼續。確定離開？` : '你是房主，目前沒有其他人，離開後房間會關閉。確定？') : '確定離開房間？')) R.leave(); };
  // 回大廳：房主那台如果還是舊版網頁，不會理會非房主的要求，這時提示大家重新整理
  window.backToLobby = () => {
    R.send({ t: 'end' });
    if (!R.isHost) setTimeout(() => { if (R.room && R.room.game) toast('房主那邊還沒反應：請房主重新整理網頁後再按一次，或請房主按「回遊戲大廳」', 5000); }, 2500);
  };
  $('#endBtn').onclick = () => { $('#menu').hidden = true; if (lastPhaseOver || confirm('結束目前的遊戲，回到大廳？')) window.backToLobby(); };
  $('#roleBtn').onclick = () => {
    $('#menu').hidden = true;
    if (R.room && R.room.game) { toast('遊戲進行中不能切換，回大廳後再換'); return; }
    const me = R.room.members.find(m => m.cid === R.cid); R.send({ t: 'role', role: me.role === 'spec' ? 'player' : 'spec' });
  };
  const sfxLabel = () => { $('#sfxBtn').textContent = `🔊 音效：${GFX.on ? '開' : '關'}`; $('#bgmBtn').textContent = `🎵 背景音樂：${GFX.music ? '開' : '關'}`; };
  const qNow = () => { try { return localStorage.getItem('mono-q') || ((navigator.hardwareConcurrency || 4) <= 4 ? 'low' : 'high'); } catch (e) { return 'high'; } };
  const qLabel = () => { $('#qBtn').textContent = `🖥️ 大富翁畫質：${qNow() === 'high' ? '高（清楚、較耗電）' : '省電'}`; };
  qLabel(); $('#qBtn').onclick = () => { const nq = qNow() === 'high' ? 'low' : 'high'; try { localStorage.setItem('mono-q', nq); } catch (e) {} const M = window.GAMES.monopoly; if (M && M.board && M.board.setQuality) M.board.setQuality(nq === 'high'); const qb = document.querySelector('.mono-tools [data-t="q"]'); if (qb) qb.textContent = nq === 'high' ? '高' : '低'; qLabel(); };
  if (window.GFX) { sfxLabel(); $('#sfxBtn').onclick = () => { GFX.toggleSfx(); sfxLabel(); }; $('#bgmBtn').onclick = () => { GFX.toggleBgm(); sfxLabel(); }; }
  // 連線狀態：每個人的延遲、直連／中繼、裝置、上次提示框等了多久（房主每 2 秒量一次）
  let netT = null;
  function netPanel() {
    const sh = $('#sheet'); if (sh.hidden || !sh.querySelector('.netp')) { clearInterval(netT); netT = null; return; }
    const room = R.isHost && window.Host && Host.roomInfo ? Host.roomInfo() : R.room;
    const ms = (room && room.members || []).filter(m => !m.bot && m.role !== 'gone');
    const q = (r) => r == null ? ['—', ''] : r < 150 ? [`${r} ms`, 'ok'] : r < 400 ? [`${r} ms`, 'mid'] : [`${r} ms`, 'bad'];
    sh.querySelector('.netp').innerHTML = ms.map(m => { const n = m.net || {}; const [rt, cls] = n.host ? ['房主', 'ok'] : q(n.rtt);
      return `<tr class="${m.online ? '' : 'off'}"><td><b>${U.esc(m.name)}</b><small>${U.esc(n.dev || '')}</small></td><td class="${m.online ? cls : 'bad'}">${m.online ? rt : '離線'}</td><td>${n.host ? '—' : n.relay == null ? '…' : n.relay ? '中繼' : '直連'}</td><td>${n.pd ? (n.pd / 1000).toFixed(1) + ' 秒' : '—'}</td></tr>`; }).join('');
    if (!R.isHost) R.send({ t: 'diag' });
  }
  $('#netBtn').onclick = () => {
    $('#menu').hidden = true;
    const sh = $('#sheet'); sh.querySelector('.sheet-body').innerHTML = `<h3>📶 連線狀態</h3><table class="nett"><thead><tr><th>玩家</th><th>延遲</th><th>連線</th><th>上次提示</th></tr></thead><tbody class="netp"></tbody></table>
      <p class="hint">延遲：訊息到房主再回來要多久，150 ms 以下很順、400 ms 以上會卡。<br>連線：「中繼」是透過中繼伺服器轉送，比較慢也會用到免費額度。<br>上次提示：從擲骰到買地等提示框出現花了多久（含動畫）。</p><button class="btn" id="sheetClose">關閉</button>`;
    sh.hidden = false; $('#sheetClose').onclick = () => sh.hidden = true;
    netPanel(); clearInterval(netT); netT = setInterval(netPanel, 2000);
  };
  $('#rulesBtn').onclick = () => {
    $('#menu').hidden = true;
    const id = (R.room.game && R.room.game.id) || R.room.lobby.gameId; const g = window.GAMES[id];
    const sh = $('#sheet'); sh.querySelector('.sheet-body').innerHTML = `<h3>${g.icon} ${g.name}</h3><p>${U.esc(g.desc)}</p><button class="btn" id="sheetClose">知道了</button>`;
    sh.hidden = false; $('#sheetClose').onclick = () => sh.hidden = true;
  };
  $('#sheet').onclick = (e) => { if (e.target.id === 'sheet') $('#sheet').hidden = true; };

  // ---------------- 聊天 ----------------
  $('#chatBtn').onclick = () => { chatOpen = !chatOpen; $('#chat').hidden = !chatOpen; if (chatOpen) { unread = 0; $('#chatBadge').hidden = true; $('#chatLog').scrollTop = 1e9; } };
  $('#chatClose').onclick = () => { chatOpen = false; $('#chat').hidden = true; };
  $('#chatForm').onsubmit = (e) => { e.preventDefault(); const i = $('#chatInput'); if (i.value.trim()) R.send({ t: 'chat', text: i.value.trim() }); i.value = ''; };

  // ---------------- 語音 ----------------
  function voiceButtons() {
    const m = V.mode;
    $('#vTalk').hidden = m === 'talk'; $('#vListen').hidden = m !== 'off';
    $('#vMute').hidden = m !== 'talk'; $('#vOff').hidden = m === 'off';
    $('#vMute').textContent = V.muted ? '🎙️ 開麥' : '🔇 靜音';
    $('#vMute').classList.toggle('on', V.muted);
    $('#vTalk').textContent = m === 'listen' ? '🎤 開麥說話' : '🎤 語音';
  }
  async function setVoice(mode) {
    if (window.Net.LOCAL) { toast('本機測試模式沒有語音'); return; }
    try { await R.setVoice(mode); } catch (e) {
      toast(/Permission|NotAllowed/i.test(e.name + e.message) ? '麥克風被拒絕：請在瀏覽器設定允許麥克風' : '開啟語音失敗：' + (e.message || e), 4000);
    }
    voiceButtons();
  }
  $('#vTalk').onclick = () => setVoice('talk');
  $('#vListen').onclick = () => setVoice('listen');
  $('#vOff').onclick = () => setVoice('off');
  $('#vMute').onclick = () => { V.setMuted(!V.muted); voiceButtons(); };
  voiceButtons();

  // ---------------- 快捷文字 ----------------
  const QDEF = ['是想好了沒', null, '我要去尿尿', '屁眼派對', '你們這些輸家'];
  function inMjNow() { return !!(R.room && ((R.room.game && R.room.game.id === 'mahjong') || (!R.room.game && R.room.lobby.gameId === 'mahjong'))); }
  function qKey() { return inMjNow() ? 'quick-mj' : 'quick'; }
  function quickList() {
    let saved = []; try { saved = JSON.parse(ls.get(qKey()) || '[]'); } catch (e) {}
    const inMj = R.room && ((R.room.game && R.room.game.id === 'mahjong') || (!R.room.game && R.room.lobby.gameId === 'mahjong'));
    return QDEF.map((d, i) => (saved[i] && saved[i].trim()) || d || (inMj ? '姵希又在堆積木' : '可以用點心嗎'));
  }
  function renderQuick() {
    $('#quick').innerHTML = quickList().map((q, i) => `<button data-q="${i}">${U.esc(q)}</button>`).join('') + '<button class="edit" data-edit>✏️ 自訂快捷文字</button>';
  }
  $('#quickBtn').onclick = (e) => { e.stopPropagation(); renderQuick(); $('#quick').hidden = !$('#quick').hidden; };
  document.addEventListener('click', (e) => { if (!e.target.closest('#quick')) $('#quick').hidden = true; });
  $('#quick').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit != null) { $('#quick').hidden = true; editQuick(); return; }
    const nowQ = Date.now(); if (nowQ - (window.__qLast || 0) < 1500) { toast('慢一點～'); return; } window.__qLast = nowQ;
    R.send({ t: 'quick', text: quickList()[+b.dataset.q] }); $('#quick').hidden = true;
  };
  function editQuick() {
    let saved = []; try { saved = JSON.parse(ls.get(qKey()) || '[]'); } catch (e) {}
    const sh = $('#sheet');
    sh.querySelector('.sheet-body').innerHTML = `<h3>自訂快捷文字（最多 30 字）</h3><p class="hint">${inMjNow() ? '這組只用在麻將' : '這組用在麻將以外的遊戲（麻將有自己的一組）'}</p>` +
      QDEF.map((d, i) => `<input class="qin" maxlength="30" value="${U.esc(saved[i] || '')}" placeholder="${U.esc(d || (inMjNow() ? '預設：姵希又在堆積木' : '預設：可以用點心嗎'))}">`).join('') +
      `<p class="hint">留空就用預設</p><div class="act-row"><button class="btn ghost" id="qReset">全部恢復預設</button><button class="btn" id="qSave">儲存</button></div>`;
    sh.hidden = false;
    $('#qSave').onclick = () => { ls.set(qKey(), JSON.stringify([...sh.querySelectorAll('.qin')].map(i => i.value.trim()))); sh.hidden = true; toast('已儲存'); };
    $('#qReset').onclick = () => { ls.set(qKey(), '[]'); sh.hidden = true; toast('已恢復預設'); };
  }
  R.cb.quick = (m) => {
    // 小而半透明、不擋操作：同一人新的取代舊的，最多同時 3 則
    const box = $('#bubbles'); const old = box.querySelector(`[data-cid="${CSS.escape(m.cid || '')}"]`); if (old) old.remove();
    const b = document.createElement('div'); b.className = 'bubble'; b.dataset.cid = m.cid || '';
    b.innerHTML = `<b>${U.esc(m.from)}</b>${U.esc(m.text)}`;
    box.appendChild(b); while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => b.classList.add('out'), 2600); setTimeout(() => b.remove(), 3100);
    const ch = document.querySelector(`.mchip[data-cid="${CSS.escape(m.cid)}"]`);
    if (ch) { ch.classList.add('talking'); setTimeout(() => ch.classList.remove('talking'), 2500); }
    if (navigator.vibrate && m.cid !== R.cid) navigator.vibrate(20);
  };

  // 有 PIN 的連結：記得名字就自動加入
  if (qp.get('pin') && ls.get('name') && qp.get('auto') === '1') $('#joinBtn').click();
})();
