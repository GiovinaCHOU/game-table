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
  function inviteLink() { return location.origin + location.pathname + '?pin=' + R.pin + (window.Net.LOCAL ? '&local=1' : ''); }
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
    try { const r = await R.join(pin, name, $('#specCheck').checked); enterRoom(); if (r === 'revived') toast('房間已從這台裝置的暫存救回，請朋友用同一個 PIN 回來', 4000); } catch (e) { $('#homeMsg').textContent = e.message || String(e); }
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

  function enterRoom() {
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
  R.cb.room = (room) => {
    document.body.dataset.skin = (room.lobby && room.lobby.skin) || 'classic';
    renderMembers(room);
    const host = R.isHost;
    $('#endBtn').hidden = !(host && room.game);
    if (!room.game) { document.body.classList.remove('in-mono'); if (curGame && window.GAMES[curGame].destroy) window.GAMES[curGame].destroy(); curGame = null; $('#game').innerHTML = ''; $('#game').dataset.g = ''; $('#lobby').hidden = false; renderLobby(room); }
    else { $('#lobby').hidden = true; }
  };
  R.cb.view = (v) => {
    const room = R.room; if (!room || !room.game) return;
    const mod = window.GAMES[room.game.id];
    const el = $('#game');
    if (curGame !== room.game.id) { if (curGame && window.GAMES[curGame].destroy) window.GAMES[curGame].destroy(); curGame = room.game.id; el.innerHTML = ''; el.dataset.g = ''; }
    document.body.classList.toggle('in-mono', room.game.id === 'monopoly');
    try { mod.render(el, v, gameUI(v)); } catch (e) { console.error(e); }
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
        <span class="vi">${m.voice === 'talk' ? '🎤' : m.voice === 'listen' ? '🎧' : ''}</span>${m.role === 'spec' ? '<small>觀戰</small>' : ''}${!m.online ? '<small>離線</small>' : ''}${m.cid === room.heir ? '<small>候補房主</small>' : ''}
        ${meHost && m.cid !== R.cid ? `<button class="kick" data-kick="${U.esc(m.cid)}" title="請出房間">×</button>` : ''}
      </div>`).join('');
    $('#members').querySelectorAll('[data-kick]').forEach(b => b.onclick = (e) => {
      e.stopPropagation(); const m = room.members.find(x => x.cid === b.dataset.kick);
      if (m && confirm(`把 ${m.name} 請出房間？`)) R.send({ t: 'kick', cid: m.cid });
    });
  }

  function renderLobby(room) {
    const host = R.isHost; const lobby = room.lobby; const sel = lobby.gameId;
    const mod = window.GAMES[sel];
    const players = room.members.filter(m => m.online && m.role === 'player');
    const opts = Object.assign({}, ...(mod.options || []).map(o => ({ [o.key]: o.def })), lobby.opts || {});
    const me = room.members.find(m => m.cid === R.cid);
    const countOk = players.length >= mod.min && players.length <= mod.max;
    $('#lobby').innerHTML = `
      <h2 class="lobby-title">${host ? '選一個遊戲' : '等房主選遊戲並開始'}</h2>
      <div class="game-grid">${GAME_ORDER.map(id => { const g = window.GAMES[id]; return `
        <button class="gcard ${id === sel ? 'on' : ''}" data-g="${id}" ${host ? '' : 'disabled'}>
          <span class="gi">${g.icon}</span><b>${g.name}</b><small>${g.min === g.max ? g.min : g.min + '–' + g.max} 人</small></button>`; }).join('')}</div>
      <div class="lobby-detail">
        <p class="gdesc">${U.esc(mod.desc)}</p>
        ${(mod.options || []).map(o => `<label class="opt"><span>${o.label}</span>
          <select data-opt="${o.key}" ${host ? '' : 'disabled'}>${o.choices.map(([v, l]) => `<option value="${v}" ${String(opts[o.key]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`).join('')}
        ${sel === 'mahjong' ? `<p class="gdesc small">目前 ${players.length} 位玩家：${players.length === 3 ? '三人麻將（拿掉萬子）' : players.length === 4 ? '標準四人' : players.length === 5 ? '五人，每局輪流一人休息' : '需要 3–5 人'}</p>` : ''}
        <label class="opt"><span>桌面風格（所有遊戲）</span><select id="skinSel" ${host ? '' : 'disabled'}>${[['classic', '🟢 經典綠桌'], ['ragnarok', '⚡ 諸神黃昏'], ['cyber', '🌃 夜城'], ['animal', '🦁 動物星球'], ['alien', '👽 外星寶貝']].map(([v, l]) => `<option value="${v}" ${(lobby.skin || 'classic') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <p class="pcount ${countOk ? '' : 'bad'}">玩家 ${players.length} 人（${mod.min}–${mod.max} 人）${countOk ? '' : ' — 人數不符'}</p>
        <div class="act-row">
          <button class="btn ghost" id="myRole">${me && me.role === 'spec' ? '我要當玩家' : '我改成觀戰'}</button>
          ${host ? `<button class="btn big" id="startBtn" ${countOk ? '' : 'disabled'}>開始遊戲</button>` : ''}
        </div>
        <div class="invite"><p>邀請朋友：把 PIN <b>${R.pin}</b> 告訴他們，或</p><button class="btn sm" id="inviteBtn">複製邀請連結</button></div>
      </div>`;
    $('#lobby').querySelectorAll('[data-g]').forEach(b => b.onclick = () => R.send({ t: 'lobby', gameId: b.dataset.g, opts: {} }));
    $('#lobby').querySelectorAll('[data-opt]').forEach(s => s.onchange = () => {
      const o = Object.assign({}, lobby.opts); o[s.dataset.opt] = isNaN(+s.value) ? s.value : +s.value;
      R.send({ t: 'lobby', gameId: sel, opts: o });
    });
    $('#myRole').onclick = () => R.send({ t: 'role', role: me && me.role === 'spec' ? 'player' : 'spec' });
    if (host) $('#startBtn').onclick = () => R.send({ t: 'start' });
    $('#skinSel').onchange = (e) => R.send({ t: 'skin', skin: e.target.value });
    $('#inviteBtn').onclick = copyInvite;
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
  $('#menuBtn').onclick = (e) => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
  document.addEventListener('click', (e) => { if (!e.target.closest('#menu')) $('#menu').hidden = true; });
  $('#leaveBtn').onclick = () => { const h = R.room && R.room.members.find(m => m.cid === R.room.heir);
    if (confirm(R.isHost ? (h ? `你是房主，離開後會由「${h.name}」接手當房主，遊戲繼續。確定離開？` : '你是房主，目前沒有其他人，離開後房間會關閉。確定？') : '確定離開房間？')) R.leave(); };
  $('#endBtn').onclick = () => { $('#menu').hidden = true; if (confirm('結束目前的遊戲，回到大廳？')) R.send({ t: 'end' }); };
  $('#roleBtn').onclick = () => {
    $('#menu').hidden = true;
    if (R.room && R.room.game) { toast('遊戲進行中不能切換，回大廳後再換'); return; }
    const me = R.room.members.find(m => m.cid === R.cid); R.send({ t: 'role', role: me.role === 'spec' ? 'player' : 'spec' });
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
  function quickList() {
    let saved = []; try { saved = JSON.parse(ls.get('quick') || '[]'); } catch (e) {}
    const inMj = R.room && ((R.room.game && R.room.game.id === 'mahjong') || (!R.room.game && R.room.lobby.gameId === 'mahjong'));
    return QDEF.map((d, i) => (saved[i] && saved[i].trim()) || d || (inMj ? '珮希又在堆積木' : '可以用點心嗎'));
  }
  function renderQuick() {
    $('#quick').innerHTML = quickList().map((q, i) => `<button data-q="${i}">${U.esc(q)}</button>`).join('') + '<button class="edit" data-edit>✏️ 自訂快捷文字</button>';
  }
  $('#quickBtn').onclick = (e) => { e.stopPropagation(); renderQuick(); $('#quick').hidden = !$('#quick').hidden; };
  document.addEventListener('click', (e) => { if (!e.target.closest('#quick')) $('#quick').hidden = true; });
  $('#quick').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit != null) { $('#quick').hidden = true; editQuick(); return; }
    R.send({ t: 'quick', text: quickList()[+b.dataset.q] }); $('#quick').hidden = true;
  };
  function editQuick() {
    let saved = []; try { saved = JSON.parse(ls.get('quick') || '[]'); } catch (e) {}
    const sh = $('#sheet');
    sh.querySelector('.sheet-body').innerHTML = `<h3>自訂快捷文字（最多 30 字）</h3>` +
      QDEF.map((d, i) => `<input class="qin" maxlength="30" value="${U.esc(saved[i] || '')}" placeholder="${U.esc(d || '預設：珮希又在堆積木（麻將）／可以用點心嗎')}">`).join('') +
      `<p class="hint">留空就用預設</p><div class="act-row"><button class="btn ghost" id="qReset">全部恢復預設</button><button class="btn" id="qSave">儲存</button></div>`;
    sh.hidden = false;
    $('#qSave').onclick = () => { ls.set('quick', JSON.stringify([...sh.querySelectorAll('.qin')].map(i => i.value.trim()))); sh.hidden = true; toast('已儲存'); };
    $('#qReset').onclick = () => { ls.set('quick', '[]'); sh.hidden = true; toast('已恢復預設'); };
  }
  R.cb.quick = (m) => {
    const b = document.createElement('div'); b.className = 'bubble';
    b.innerHTML = `<b>${U.esc(m.from)}</b>${U.esc(m.text)}`;
    $('#bubbles').appendChild(b); setTimeout(() => b.classList.add('out'), 2600); setTimeout(() => b.remove(), 3100);
    const ch = document.querySelector(`.mchip[data-cid="${CSS.escape(m.cid)}"]`);
    if (ch) { ch.classList.add('talking'); setTimeout(() => ch.classList.remove('talking'), 2500); }
    if (navigator.vibrate && m.cid !== R.cid) navigator.vibrate(20);
  };

  // 有 PIN 的連結：記得名字就自動加入
  if (qp.get('pin') && ls.get('name') && qp.get('auto') === '1') $('#joinBtn').click();
})();
