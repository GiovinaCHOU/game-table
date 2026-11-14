// 你畫我猜
(function (root) {
  const U = root.GUTIL;
  const WORDS = ('蘋果 香蕉 西瓜 鳳梨 草莓 葡萄 珍珠奶茶 雞排 滷肉飯 小籠包 臭豆腐 粽子 月餅 漢堡 披薩 薯條 冰淇淋 蛋糕 甜甜圈 壽司 拉麵 火鍋 '
    + '貓 狗 兔子 長頸鹿 大象 企鵝 獅子 老虎 熊貓 猴子 蛇 烏龜 章魚 鯊魚 恐龍 蝴蝶 蜘蛛 蝸牛 刺蝟 河馬 斑馬 袋鼠 貓頭鷹 孔雀 '
    + '飛機 火車 腳踏車 機車 潛水艇 熱氣球 火箭 帆船 救護車 '
    + '雨傘 眼鏡 手錶 鑰匙 剪刀 牙刷 吹風機 電風扇 冰箱 洗衣機 沙發 檯燈 鏡子 枕頭 馬桶 拖鞋 背包 錢包 手機 耳機 吉他 鋼琴 鼓 麥克風 相機 電視 遙控器 '
    + '太陽 月亮 彩虹 閃電 雪人 火山 瀑布 沙漠 島 颱風 星星 雲 '
    + '101大樓 金字塔 摩天輪 雲霄飛車 城堡 燈塔 廟 夜市 便利商店 捷運 紅綠燈 '
    + '醫生 警察 消防員 廚師 魔術師 海盜 忍者 美人魚 外星人 殭屍 天使 聖誕老人 '
    + '游泳 跑步 釣魚 睡覺 打噴嚏 自拍 跳舞 唱歌 打麻將 放風箏 '
    + '心臟 眼睛 鼻子 牙齒 鬍子 指紋 '
    + '王冠 鑽石 寶藏 炸彈 氣球 禮物 蠟燭 鞭炮 紅包 獎盃 '
    + '筷子 便當 電鍋 茶壺 珍珠 布丁 爆米花 棒棒糖 '
    + '馬桶塞 掃把 垃圾車 衛生紙 牙膏 安全帽 口罩').split(/\s+/).filter(Boolean);

  function pick3() { return U.shuffle(WORDS.slice()).slice(0, 3); }
  function norm(s) { return String(s || '').replace(/\s+/g, '').toLowerCase(); }

  function startTurn(st, now) {
    st.phase = 'choose'; st.choices = pick3(); st.word = ''; st.strokes = []; st.guessed = {};
    st.deadline = now + 15000; st.hint = [];
  }
  function nextTurn(st, now) {
    st.turnIdx++;
    if (st.turnIdx >= st.n) { st.turnIdx = 0; st.roundNo++; }
    if (st.roundNo > st.rounds) { st.phase = 'over'; st.deadline = 0; return; }
    startTurn(st, now);
  }
  function toReveal(st, now) { st.phase = 'reveal'; st.deadline = now + 5000; st.log.push({ sys: `答案是「${st.word}」` }); }

  const M = {
    id: 'draw', name: '你畫我猜', icon: '🎨', min: 2, max: 12,
    desc: '輪流畫圖，其他人在下面打字猜。越快猜對分數越高，畫的人也會加分。',
    options: [
      { key: 'rounds', label: '輪數', choices: [[1, '1 輪'], [2, '2 輪'], [3, '3 輪']], def: 2 },
      { key: 'time', label: '每題秒數', choices: [[60, '60 秒'], [80, '80 秒'], [100, '100 秒']], def: 80 }
    ],
    init(n, o, names, now) {
      const st = { n, rounds: +o.rounds, time: +o.time, roundNo: 1, turnIdx: 0, scores: Array(n).fill(0), log: [] };
      startTurn(st, now); return st;
    },
    drawer(st) { return st.turnIdx; },
    action(st, seat, a, ctx) {
      const now = ctx.now; const d = st.turnIdx;
      switch (a.type) {
        case 'choose':
          if (seat !== d || st.phase !== 'choose') return '現在不能選';
          st.word = st.choices[a.i | 0] || st.choices[0];
          st.phase = 'draw'; st.start = now; st.deadline = now + st.time * 1000;
          st.hint = []; st.hintAt = [now + st.time * 500, now + st.time * 800];
          st.log.push({ sys: `${ctx.names[d]} 開始畫了！` });
          return;
        case 'seg':
          if (seat !== d || st.phase !== 'draw') return 'silent';
          ctx.relay({ type: 'seg', s: a.s }); return 'silent';
        case 'stroke':
          if (seat !== d || st.phase !== 'draw') return 'silent';
          if (a.s && Array.isArray(a.s.p) && a.s.p.length <= 4000) st.strokes.push({ c: String(a.s.c).slice(0, 9), w: +a.s.w || 6, p: a.s.p.map(x => x | 0) });
          return;
        case 'undo': if (seat === d) st.strokes.pop(); return;
        case 'clear': if (seat === d) st.strokes = []; return;
        case 'skip': if (seat !== d) return '只有畫的人可以跳過'; if (st.phase === 'draw') toReveal(st, now); else nextTurn(st, now); return;
        case 'guess': {
          const text = String(a.text || '').trim().slice(0, 40); if (!text) return 'silent';
          if (st.phase !== 'draw' || seat === d || st.guessed[seat] != null) { st.log.push({ seat, text, secret: st.phase === 'draw' }); return; }
          if (norm(text) === norm(st.word)) {
            const left = Math.max(0, st.deadline - now) / (st.time * 1000);
            const pts = 10 + Math.round(50 * left);
            st.scores[seat] += pts; st.scores[d] += 10;
            st.guessed[seat] = pts;
            st.log.push({ seat, ok: true, pts });
            const remain = U.range(st.n).filter(i => i !== d && st.guessed[i] == null);
            if (!remain.length) toReveal(st, now);
          } else {
            const close = st.word.length > 1 && (st.word.includes(norm(text)) && norm(text).length >= st.word.length - 1 || norm(text).includes(st.word));
            st.log.push({ seat, text, close: close ? seat : undefined });
          }
          if (st.log.length > 80) st.log.splice(0, st.log.length - 80);
          return;
        }
        case 'next':
          if (st.phase !== 'over') return;
          Object.assign(st, { roundNo: 1, turnIdx: 0, scores: Array(st.n).fill(0), log: [] }); startTurn(st, now); return;
      }
    },
    tick(st, now) {
      if (st.phase === 'choose' && now > st.deadline) { this.action(st, st.turnIdx, { type: 'choose', i: 0 }, { now, names: [], relay() {} }); st.log.push({ sys: '時間到，自動選題' }); return true; }
      if (st.phase === 'draw') {
        if (now > st.deadline) { toReveal(st, now); return true; }
        let ch = false;
        while (st.hintAt.length && now > st.hintAt[0] && st.word.length > 1) {
          st.hintAt.shift();
          const hidden = U.range(st.word.length).filter(i => !st.hint.includes(i));
          if (hidden.length > 1) { st.hint.push(hidden[Math.floor(Math.random() * hidden.length)]); ch = true; }
        }
        return ch;
      }
      if (st.phase === 'reveal' && now > st.deadline) { nextTurn(st, now); return true; }
      return false;
    },
    auto(st) { return (st.phase === 'choose' || st.phase === 'draw') ? { seat: st.turnIdx, a: { type: 'skip' } } : null; },
    view(st, seat) {
      const d = st.turnIdx;
      const knows = seat === d || st.guessed[seat] != null || st.phase === 'reveal' || st.phase === 'over';
      return {
        phase: st.phase, drawer: d, roundNo: st.roundNo, rounds: st.rounds, deadline: st.deadline, scores: st.scores,
        strokes: st.strokes, guessed: Object.keys(st.guessed).map(Number),
        choices: seat === d && st.phase === 'choose' ? st.choices : null,
        word: knows ? st.word : null,
        mask: st.word ? [...st.word].map((ch, i) => st.hint.includes(i) ? ch : '＿').join(' ') : '',
        len: st.word.length,
        log: st.log.filter(l => (!l.secret || seat === d || st.guessed[seat] != null) && (l.close == null || l.close === seat)).slice(-40)
      };
    },

    // ================= 畫面 =================
    _ui: { color: '#222222', w: 6 },
    render(el, v, ui) {
      const me = v.seat, iDraw = me === v.drawer && v.phase === 'draw';
      if (el.dataset.g !== 'draw') {
        el.dataset.g = 'draw';
        el.innerHTML = `
          <div class="dr-top"><span class="dr-round"></span><span class="dr-word"></span><span class="timer" data-deadline=""></span></div>
          <div class="dr-canvas-wrap"><canvas width="1000" height="1000"></canvas><div class="dr-overlay"></div></div>
          <div class="dr-tools"></div>
          <div class="dr-bottom"><div class="dr-log"></div>
            <form class="dr-guess"><input placeholder="輸入答案或聊天…" maxlength="40" autocomplete="off"><button>送出</button></form></div>
          <div class="dr-scores"></div>`;
        this._canvas = el.querySelector('canvas');
        this._bindCanvas(ui);
        el.querySelector('.dr-guess').onsubmit = (e) => { e.preventDefault(); const i = e.target.querySelector('input'); if (i.value.trim()) ui.send({ type: 'guess', text: i.value }); i.value = ''; };
      }
      this._v = v; this._ui2 = ui;
      el.querySelector('.dr-round').textContent = `第 ${Math.min(v.roundNo, v.rounds)}/${v.rounds} 輪`;
      el.querySelector('.dr-word').innerHTML = v.word ? `<b>${U.esc(v.word)}</b>` : (v.phase === 'draw' ? `<span class="mask">${U.esc(v.mask)}</span> <small>(${v.len} 字)</small>` : '');
      const t = el.querySelector('.timer'); t.dataset.deadline = v.deadline || '';
      // 工具列
      const tools = el.querySelector('.dr-tools');
      if (iDraw) {
        const colors = ['#222222', '#e03131', '#f08c00', '#fab005', '#2f9e44', '#1971c2', '#7048e8', '#e64980', '#8d6e63', '#ffffff'];
        tools.innerHTML = colors.map(c => `<button class="sw ${this._ui.color === c ? 'on' : ''}" data-c="${c}" style="background:${c}">${c === '#ffffff' ? '擦' : ''}</button>`).join('')
          + [4, 10, 24].map(w => `<button class="sz ${this._ui.w === w ? 'on' : ''}" data-w="${w}"><span style="width:${w / 1.6 + 3}px;height:${w / 1.6 + 3}px"></span></button>`).join('')
          + `<button class="btn sm" data-a="undo">復原</button><button class="btn sm" data-a="clear">清空</button><button class="btn sm ghost" data-a="skip">跳過</button>`;
        tools.onclick = (e) => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.c) this._ui.color = b.dataset.c;
          if (b.dataset.w) this._ui.w = +b.dataset.w;
          if (b.dataset.a) { if (b.dataset.a !== 'clear' || confirm('清空畫布？')) ui.send({ type: b.dataset.a }); }
          tools.querySelectorAll('.sw,.sz').forEach(x => x.classList.toggle('on', x.dataset.c === this._ui.color || +x.dataset.w === this._ui.w));
        };
        tools.style.display = '';
      } else { tools.innerHTML = ''; tools.style.display = 'none'; }
      // 覆蓋層
      const ov = el.querySelector('.dr-overlay');
      if (v.phase === 'choose') {
        ov.style.display = 'flex';
        ov.innerHTML = v.choices ? `<div><p>選一個題目來畫</p>${v.choices.map((w, i) => `<button class="btn" data-i="${i}">${U.esc(w)}</button>`).join('')}</div>`
          : `<div><p>${U.esc(v.names[v.drawer])} 正在選題目…</p></div>`;
        ov.onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) ui.send({ type: 'choose', i: +b.dataset.i }); };
      } else if (v.phase === 'reveal') {
        ov.style.display = 'flex'; ov.innerHTML = `<div class="reveal"><p>答案</p><h2>${U.esc(v.word)}</h2></div>`; ov.onclick = null;
      } else if (v.phase === 'over') {
        const rank = U.range(v.scores.length).sort((a, b) => v.scores[b] - v.scores[a]);
        ov.style.display = 'flex';
        ov.innerHTML = `<div><h2>🏆 ${U.esc(v.names[rank[0]])} 獲勝</h2>${rank.map((s, i) => `<p>${i + 1}. ${U.esc(v.names[s])} — ${v.scores[s]} 分</p>`).join('')}${me >= 0 ? '<button class="btn" data-next>再玩一次</button>' : ''}</div>`;
        ov.onclick = (e) => { if (e.target.closest('[data-next]')) ui.send({ type: 'next' }); };
      } else { ov.style.display = 'none'; }
      // 畫布
      const key = v.drawer + ':' + v.roundNo + ':' + v.strokes.length + ':' + (v.strokes.length ? v.strokes[v.strokes.length - 1].p.length : 0);
      if (this._drawing && iDraw) { /* 自己正在畫，不重畫 */ }
      else if (key !== this._key) { this._key = key; this._redraw(v.strokes); }
      // 紀錄
      const log = el.querySelector('.dr-log');
      log.innerHTML = v.log.map(l => l.sys ? `<p class="sys">${U.esc(l.sys)}</p>`
        : l.ok ? `<p class="ok">✔ ${U.esc(v.names[l.seat])} 猜對了！ +${l.pts}</p>`
        : `<p class="${l.secret ? 'secret' : ''}"><b>${U.esc(v.names[l.seat])}</b>：${U.esc(l.text)}${l.close != null ? ' <em>（很接近了！）</em>' : ''}</p>`).join('');
      log.scrollTop = log.scrollHeight;
      const inp = el.querySelector('.dr-guess input');
      inp.placeholder = me === v.drawer && v.phase === 'draw' ? '你在畫，只能聊天（別洩題）' : '輸入答案或聊天…';
      el.querySelector('.dr-guess').style.display = me < 0 ? 'none' : '';
      el.querySelector('.dr-scores').innerHTML = v.names.map((n, i) => `<span class="${i === v.drawer ? 'drawer' : ''} ${v.guessed.includes(i) ? 'got' : ''}">${i === v.drawer ? '✏️' : v.guessed.includes(i) ? '✔' : ''}${U.esc(n)} <b>${v.scores[i]}</b></span>`).join('');
    },
    onEvent(ev) {
      if (ev.type === 'seg' && this._canvas) this._stroke(ev.s);
    },
    _redraw(strokes) {
      const c = this._canvas; if (!c) return; const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, 1000, 1000);
      strokes.forEach(s => this._stroke(s));
    },
    _stroke(s) {
      const g = this._canvas.getContext('2d'); const p = s.p;
      g.strokeStyle = s.c; g.fillStyle = s.c; g.lineWidth = s.w * 2; g.lineCap = 'round'; g.lineJoin = 'round';
      if (p.length === 2) { g.beginPath(); g.arc(p[0], p[1], s.w, 0, 7); g.fill(); return; }
      g.beginPath(); g.moveTo(p[0], p[1]);
      for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]);
      g.stroke();
    },
    _bindCanvas() {
      const c = this._canvas; let cur = null, sent = 0, lastSend = 0;
      const pos = (e) => { const r = c.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 1000), Math.round((e.clientY - r.top) / r.height * 1000)]; };
      const can = () => this._v && this._v.seat === this._v.drawer && this._v.phase === 'draw';
      c.addEventListener('pointerdown', (e) => {
        if (!can()) return; e.preventDefault(); c.setPointerCapture(e.pointerId);
        this._drawing = true; cur = { c: this._ui.color, w: this._ui.w, p: pos(e) }; sent = 0; this._stroke(cur);
      });
      c.addEventListener('pointermove', (e) => {
        if (!cur) return; e.preventDefault();
        const [x, y] = pos(e); const n = cur.p.length;
        if (Math.abs(x - cur.p[n - 2]) + Math.abs(y - cur.p[n - 1]) < 4) return;
        const seg = { c: cur.c, w: cur.w, p: [cur.p[n - 2], cur.p[n - 1], x, y] };
        cur.p.push(x, y); this._stroke(seg);
        const now = performance.now();
        if (now - lastSend > 50) { const part = cur.p.slice(Math.max(0, sent - 2)); this._ui2.send({ type: 'seg', s: { c: cur.c, w: cur.w, p: part } }); sent = cur.p.length; lastSend = now; }
      });
      const up = () => {
        if (!cur) return; const s = cur; cur = null; this._drawing = false;
        this._ui2.send({ type: 'stroke', s });
      };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    }
  };
  root.GAMES.draw = M;
})(typeof window !== 'undefined' ? window : globalThis);
