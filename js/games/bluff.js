// 誰是唬爛王（瞎掰王玩法）：一個冷門詞，只有「老實人」知道真正的意思，其他人當場瞎掰，裁判猜誰說真話
(function (root) {
  const U = root.GUTIL;
  // 題庫：w 詞、m 真正的意思（給老實人看，也是揭曉時的答案）
  // 出題方向（使用者指定）：「真有此事，但聽起來像唬爛」——越像亂掰越好，每題都要查得到出處
  // 每一題都已上網查證（2026-11）；出處本身是傳說的，解釋裡寫「相傳／據說」。查不到可靠出處的題目不收。
  const BANK = {
    history: { name: '怪歷史・怪地名', list: [
      ['鴯鶓戰爭', '1932 年澳洲派軍人帶機槍去對付破壞麥田的大批鴯鶓（一種大鳥），結果沒打贏'],
      ['足球戰爭', '1969 年宏都拉斯和薩爾瓦多在世界盃資格賽後爆發的戰爭，打了大約 100 小時'],
      ['豬戰爭', '1859 年美國和英國因為一頭闖進菜園被射殺的豬而對峙，最後唯一的死者就是那頭豬'],
      ['糖蜜大洪水', '1919 年波士頓一個巨大的糖蜜儲槽破裂，糖蜜浪衝上街道，造成 21 人死亡'],
      ['跳舞瘟疫', '1518 年法國史特拉斯堡有人在街上停不下來地跳舞，一個月內上百人跟著跳'],
      ['啤酒洪水', '1814 年倫敦一家釀酒廠的大酒桶破裂，啤酒浪沖垮房屋，造成 8 人死亡'],
      ['大惡臭', '1858 年夏天倫敦泰晤士河臭到國會受不了，因此蓋了現代的下水道系統'],
      ['屍體審判', '西元 897 年，教宗把前前任教宗的屍體挖出來，穿上教宗袍放在椅子上受審'],
      ['鬱金香狂熱', '17 世紀荷蘭人瘋狂炒作鬱金香球根，最貴的一顆價格比得上一棟房子，最後泡沫破裂'],
      ['英桑戰爭', '1896 年英國和桑吉巴打的仗，大約 38 到 45 分鐘就結束，被認為是史上最短的戰爭'],
      ['地獄村', '挪威真的有一個村莊叫 Hell（地獄），冬天結霜時常被拿來開「地獄結冰了」的玩笑'],
      ['希勒湖', '澳洲一座天然的粉紅色鹽湖，一年四季都是粉紅色']
    ] },
    beast: { name: '怪動物', list: [
      ['屁股呼吸龜', '澳洲的瑪麗河龜可以用屁股（泄殖腔）在水裡呼吸，能連續好幾天不浮上來換氣'],
      ['方塊便便', '袋熊的大便是方方正正的立方體'],
      ['盲鰻噴黏液', '盲鰻被攻擊時，一下子就能噴出一大團黏液，把對方的鰓塞住'],
      ['海參吐內臟', '有些海參遇到危險會把內臟噴出去，之後再慢慢長回來'],
      ['槍蝦', '一種小蝦，夾子瞬間合起來會產生爆裂的氣泡，衝擊力能震暈小魚'],
      ['殭屍螞蟻', '被一種真菌感染的螞蟻會爬上植物咬住葉脈不放，接著真菌從牠頭上長出來'],
      ['吸血雀', '加拉巴哥群島的一種地雀，會啄傷海鳥的皮膚喝牠們的血'],
      ['放屁蟲', '屁步甲遇到危險時，會從屁股噴出接近 100 度的滾燙化學噴霧'],
      ['發光鴨嘴獸', '鴨嘴獸的毛在紫外線燈下會發出藍綠色的螢光'],
      ['長藻的樹懶', '樹懶的毛裡會長出綠藻，讓牠看起來綠綠的'],
      ['站著睡的鯨魚', '抹香鯨會頭朝上、身體直立地漂在海裡睡覺'],
      ['雀尾螳螂蝦', '出拳速度快到能打碎蝦蟹的硬殼，還有打破水族箱玻璃的紀錄'],
      ['水熊蟲', '不到一公釐的小動物，乾掉後能休眠，甚至撐過直接暴露在太空中']
    ] },
    food: { name: '怪食物', list: [
      ['蛆乳酪', '義大利薩丁尼亞的卡蘇馬蘇乳酪，故意讓蒼蠅幼蟲在裡面幫忙發酵'],
      ['童子蛋', '浙江東陽的傳統小吃，用小男孩的尿來煮雞蛋，還列入當地非物質文化遺產'],
      ['貓屎咖啡', '麝香貓吃下咖啡果、排出咖啡豆，再把豆子洗乾淨烘焙成的咖啡'],
      ['狗不理', '天津有名的包子，名字來自創始人的小名「狗子」，因為他忙到不理客人'],
      ['螞蟻上樹', '川菜，冬粉炒肉末，肉末黏在冬粉上像螞蟻在爬樹'],
      ['叫化雞', '用荷葉和泥巴把整隻雞包起來去烤的料理'],
      ['驢打滾', '北京小吃，黏米糕捲紅豆餡，外面滾上一層黃豆粉'],
      ['夫妻肺片', '四川涼菜，用滷過的牛雜拌紅油，裡面其實沒有肺，原本叫「廢片」']
    ] },
    job: { name: '怪職業・怪習俗', list: [
      ['敲窗人', '工業革命時的英國，有人專門拿長竿敲住戶窗戶叫人起床，是人肉鬧鐘'],
      ['吃罪人', '舊時英國和威爾斯，有人專門吃掉放在死者身上的麵包，象徵替死者承擔罪孽'],
      ['鞭童', '相傳歐洲宮廷裡，王子犯錯時代替王子挨打的男孩（有歷史學家認為根本不存在）'],
      ['御廁侍從', '英國都鐸王朝專門服侍國王上廁所的近臣，因為很親近國王，地位很高'],
      ['聞味師', '替除臭劑公司聞受試者腋下、測試除臭效果的專業人員'],
      ['胡床', '古代可以折疊的輕便坐具，就像現在的馬扎，不是床']
    ] },
    tw: { name: '台灣在地', list: [
      ['打狗', '高雄的舊名，來自當地原住民語的音譯'],
      ['雞籠', '基隆的舊名'],
      ['鬼湖', '台灣中央山脈南段的高山湖泊，像大鬼湖、小鬼湖'],
      ['十八王公', '新北石門的廟，相傳供奉十七位遇難者和一條跟著主人殉死的狗'],
      ['孝女白琴', '台灣喪禮上代替家屬哭喪的表演者，名字據說來自布袋戲角色'],
      ['牽亡歌', '台灣喪禮中，用說唱和舞步為亡魂引路的陣頭'],
      ['菜尾', '辦桌最後把幾道菜集合回鍋煮成的雜菜湯（也有人說是總鋪師刻意做的最後一道菜）'],
      ['鴨賞', '宜蘭名產，鴨子先醃過再煙燻做成的'],
      ['糕渣', '宜蘭宴席菜，雞湯等食材凝成塊再裹粉油炸，外酥內綿'],
      ['鹹光餅', '中間有洞、可以用繩子串起來的餅，相傳是戚繼光的軍糧'],
      ['膨風', '台語，吹牛、誇大；原本是肚子脹氣的意思']
    ] },
    myth: { name: '神獸傳說', list: [
      ['狻猊', '傳說中的龍子之一，長得像獅子，常裝飾在香爐或佛座上'],
      ['椒圖', '傳說中的龍子之一，像螺蚌，不喜歡被打擾，常做成大門上的門環'],
      ['蒲牢', '傳說中的龍子之一，很愛吼叫，常鑄在大鐘的頂端'],
      ['贔屭', '傳說中的龍子之一，像烏龜，力氣大愛扛重物，常馱著石碑'],
      ['鴟吻', '屋脊兩端龍頭魚身的裝飾，傳說可以防火'],
      ['獬豸', '傳說中能分辨是非、會用角去頂壞人的獨角神獸，象徵司法公正'],
      ['窮奇', '上古四大凶獸之一，傳說專門幫壞人、害好人'],
      ['旋龜', '《山海經》裡鳥頭蛇尾的烏龜，叫聲像在劈木頭']
    ] },
    psy: { name: '怪效應・冷知識', list: [
      ['自行車棚效應', '開會時，大家對無關緊要的小事（像腳踏車棚用什麼材料）討論得最久'],
      ['眼鏡蛇效應', '解決問題的獎勵反而讓問題更嚴重（相傳懸賞死蛇，結果大家開始養蛇來領錢）'],
      ['紅皇后效應', '你必須拚命跑才能留在原地，比喻競爭中不進步就是退步'],
      ['鳥籠效應', '家裡掛一個空鳥籠，最後很可能會去買一隻鳥來配它'],
      ['富蘭克林效應', '幫過你一次忙的人，會比你幫過的人更願意再幫你'],
      ['狄德羅效應', '買了一件新東西後，會想把周圍的東西都換掉來搭配它'],
      ['橡皮鴨除錯法', '對著一隻橡皮鴨逐行解釋程式碼，講著講著常常就自己發現錯誤'],
      ['巴納姆效應', '人會覺得很籠統的性格描述特別準，像星座分析'],
      ['光噴嚏反射', '有些人突然看到強光就會打噴嚏'],
      ['蝶腭神經節痛', '吃冰吃太快造成的頭痛的正式名稱'],
      ['曼德拉效應', '很多人一起記錯同一件事的現象'],
      ['宜家效應', '人會特別珍惜、高估自己親手組裝的東西'],
      ['蔡格尼克效應', '沒做完的事，比做完的事更容易記得'],
      ['巴德爾-邁因霍夫現象', '剛注意到一件事之後，突然覺得到處都看得到它'],
      ['語義飽和', '一個字盯太久或念太多次，突然覺得它好陌生'],
      ['帕金森定律', '工作會自動膨脹，直到把你給它的時間全部填滿']
    ] }
  };
  // 給唬爛王的靈感：完全沒頭緒時，隨手抓一個方向開始掰
  const ANGLES = ['其實是一種病', '跟某個國王有關', '是古代的刑罰', '是某國的節慶', '是一種昆蟲', '是網路流行語', '是料理手法',
    '是一種舞步', '是運動術語', '是軍事暗號', '是一種迷信', '是發明者的名字', '是工地用語', '是嬰兒用品', '是化妝技巧', '是古代貨幣',
    '是一種占卜', '是天文現象', '是某個地名', '是一種髮型', '是賭博用語', '是建築構造', '是一種植物', '是深海生物', '是醫學檢查',
    '是交通規則', '是祭祀儀式', '是童玩', '是心理學實驗', '是某部電影的梗', '是一種樂器', '是外星人目擊事件', '是喪禮習俗', '是結婚習俗'];
  const CAT_KEYS = Object.keys(BANK);

  function parseCustom(s) {
    return String(s || '').split(/[\n;；]+/).map(x => x.trim()).filter(Boolean).map(x => {
      const k = x.search(/[=＝:：]/); if (k <= 0) return null;
      const w = x.slice(0, k).trim().slice(0, 16), m = x.slice(k + 1).trim().slice(0, 80);
      return w && m ? { w, m, c: '自訂' } : null;
    }).filter(Boolean).slice(0, 200);
  }
  function pool(st) {
    const base = [];
    (st.cat === 'all' ? CAT_KEYS : [st.cat]).forEach(k => BANK[k] && BANK[k].list.forEach(([w, m]) => base.push({ w, m, c: BANK[k].name })));
    if (st.source === 'custom' && st.custom.length >= 3) return st.custom;
    if (st.source === 'both' && st.custom.length) return base.concat(st.custom, st.custom); // 自訂題目機率加倍
    return base;
  }
  function pickWord(st) {
    let p = pool(st).filter(x => !st.used.includes(x.w));
    if (!p.length) { st.used = []; p = pool(st); }
    const x = p[Math.floor(Math.random() * p.length)];
    st.used.push(x.w); return { w: x.w, m: x.m, c: x.c };
  }
  const others = (st) => U.range(st.n).filter(i => i !== st.judge);

  function newRound(st, now) {
    st.phase = 'prep'; st.word = pickWord(st);
    const os = others(st);
    st.honest = os[Math.floor(Math.random() * os.length)];
    st.order = U.shuffle(os.slice());
    st.spk = 0; st.said = {}; st.ready = {}; st.swaps = 0; st.pick = null;
    st.deadline = now + st.prepT * 1000;
    st.peekUntil = st.peek ? now + st.peek * 1000 : 0; st.peekHidden = false;
    st.turn = st.judge; st.step++;
  }
  function startTalk(st, now) {
    st.phase = 'talk'; st.spk = 0; st.turn = st.order[0];
    st.peekHidden = !!st.peek;
    st.deadline = st.speakT ? now + st.speakT * 1000 : 0; st.step++;
  }
  function nextSpeaker(st, now) {
    st.spk++;
    if (st.spk >= st.order.length) { st.phase = 'vote'; st.turn = st.judge; st.deadline = now + 90000; st.step++; return; }
    st.turn = st.order[st.spk]; st.deadline = st.speakT ? now + st.speakT * 1000 : 0; st.step++;
  }
  function judge(st, target, now, timeout) {
    const ok = target === st.honest;
    const gain = Array(st.n).fill(0);
    if (ok) { gain[st.judge]++; gain[st.honest]++; } else gain[target]++;
    gain.forEach((g, i) => { st.scores[i] += g; });
    st.last = { judge: st.judge, pick: target, honest: st.honest, ok, gain, word: st.word, timeout: !!timeout };
    st.phase = 'reveal'; st.deadline = now + 15000; st.revealAt = now; st.step++;
  }
  function afterReveal(st, now) {
    if (Math.max(...st.scores) >= st.target) { st.phase = 'over'; st.deadline = 0; st.step++; return; }
    st.judge = (st.judge + 1) % st.n; st.round++;
    newRound(st, now);
  }

  const M = {
    id: 'bluff', name: '誰是唬爛王', icon: '🤥', min: 3, max: 9,
    desc: '每回合一人當裁判，系統出一個冷門詞。其他人裡只有一位「老實人」看得到真正的意思，其餘都是唬爛王，要當場瞎掰一個解釋。準備好後依順序開麥克風說明（沒開語音可以打字），最後裁判選出他覺得說真話的人。猜對：裁判和老實人各 +1；猜錯：被選中的唬爛王 +1。裁判每回合輪流，先到目標分數的人獲勝。',
    options: [
      { key: 'target', label: '目標分數', choices: [[5, '5 分'], [7, '7 分'], [10, '10 分']], def: 5 },
      { key: 'cat', label: '題目類型', choices: [['all', '全部混合'], ['history', '怪歷史・怪地名'], ['beast', '怪動物'], ['food', '怪食物'], ['job', '怪職業・怪習俗'], ['tw', '台灣在地'], ['myth', '神獸傳說'], ['psy', '怪效應・冷知識']], def: 'all' },
      { key: 'prepT', label: '準備時間', choices: [[30, '30 秒'], [45, '45 秒'], [20, '20 秒']], def: 30 },
      { key: 'speakT', label: '每人說明時間', choices: [[40, '40 秒'], [60, '60 秒'], [25, '25 秒'], [0, '不限（講完自己按）']], def: 40 },
      { key: 'peek', label: '老實人看答案', choices: [[0, '準備時間都看得到'], [5, '只能看 5 秒（村規）'], [10, '只能看 10 秒']], def: 0 },
      { key: 'hint', label: '唬爛王靈感', choices: [[1, '開（給 3 個瞎掰方向）'], [0, '關']], def: 1 },
      { key: 'source', label: '題庫', choices: [['builtin', '內建題目'], ['both', '內建＋自訂'], ['custom', '只用自訂']], def: 'builtin' },
      { key: 'custom', label: '自訂題目（一行一題，詞＝真正的意思）', type: 'text', placeholder: '例如：\n阿傑的貓＝一隻會開冰箱的橘貓\n囍＝雙喜，用在結婚', def: '', count: (s) => parseCustom(s).length }
    ],
    init(n, o, names, now) {
      const st = {
        n, target: +o.target || 5, cat: BANK[o.cat] ? o.cat : 'all', prepT: +o.prepT || 30, speakT: o.speakT == null ? 40 : +o.speakT,
        peek: +o.peek || 0, hint: o.hint == null ? 1 : +o.hint, source: o.source || 'builtin', custom: parseCustom(o.custom),
        scores: Array(n).fill(0), judge: Math.floor(Math.random() * n), round: 1, used: [], step: 0, log: []
      };
      newRound(st, now == null ? Date.now() : now); return st;
    },
    action(st, seat, a, ctx) {
      const now = (ctx && ctx.now) || Date.now();
      switch (a.type) {
        case 'ready':
          if (st.phase !== 'prep' || seat < 0 || seat === st.judge) return 'silent';
          st.ready[seat] = 1;
          if (others(st).every(i => st.ready[i])) startTalk(st, now);
          return;
        case 'swap':
          if (st.phase !== 'prep' || seat < 0) return 'silent';
          if (st.swaps >= 2) return '這回合已經換過 2 次題目了';
          st.swaps++; st.word = pickWord(st); st.ready = {};
          st.deadline = now + st.prepT * 1000; st.peekUntil = st.peek ? now + st.peek * 1000 : 0; st.peekHidden = false;
          st.step++; st.log.push({ sys: '有人認識這個詞，換一題！' });
          return;
        case 'done': {
          if (st.phase !== 'talk' || seat !== st.order[st.spk]) return '還沒輪到你';
          const t = String(a.text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
          st.said[seat] = t || '';
          nextSpeaker(st, now); return;
        }
        case 'pick': {
          if (st.phase !== 'vote' || seat !== st.judge) return '只有裁判可以選';
          const t = a.seat | 0; if (t === st.judge || t < 0 || t >= st.n) return '選擇不對';
          judge(st, t, now); return;
        }
        case 'next':
          if (st.phase === 'reveal') { if (now - st.revealAt < 3000) return 'silent'; afterReveal(st, now); return; }
          if (st.phase === 'over') { st.scores = Array(st.n).fill(0); st.round = 1; st.judge = (st.judge + 1) % st.n; st.last = null; newRound(st, now); return; }
          return 'silent';
      }
      return 'silent';
    },
    tick(st, now) {
      if (st.phase === 'prep') {
        if (st.peekUntil && !st.peekHidden && now > st.peekUntil) { st.peekHidden = true; return true; }
        if (now > st.deadline) { startTalk(st, now); return true; }
      }
      if (st.phase === 'talk' && st.deadline && now > st.deadline) { const s = st.order[st.spk]; if (st.said[s] == null) st.said[s] = ''; nextSpeaker(st, now); return true; }
      if (st.phase === 'vote' && now > st.deadline) { const os = others(st); judge(st, os[Math.floor(Math.random() * os.length)], now, true); return true; }
      if (st.phase === 'reveal' && now > st.deadline) { afterReveal(st, now); return true; }
      return false;
    },
    // 電腦玩家／託管：老實人照抄答案，唬爛王拿別題的解釋來掰，裁判隨便猜
    auto(st, isAuto) {
      const ia = isAuto || (() => true);
      if (st.phase === 'prep') { const s = others(st).find(i => !st.ready[i] && ia(i)); return s == null ? null : { seat: s, a: { type: 'ready' } }; }
      if (st.phase === 'talk') {
        const s = st.order[st.spk];
        let text = st.word.m;
        if (s !== st.honest) { const p = pool(st).filter(x => x.w !== st.word.w); if (p.length) text = p[(st.step * 7 + s * 13) % p.length].m; } // 固定選法：每次呼叫結果相同，託管計時才不會一直重來
        return { seat: s, a: { type: 'done', text } };
      }
      if (st.phase === 'vote') { const os = others(st); return { seat: st.judge, a: { type: 'pick', seat: os[(st.step * 5 + st.round) % os.length] } }; }
      return null;
    },
    view(st, seat) {
      const open = st.phase === 'reveal' || st.phase === 'over';
      const isH = seat === st.honest && seat >= 0;
      const seeM = open || (isH && (!st.peek || (st.phase === 'prep' && !st.peekHidden)));
      return {
        phase: st.phase, round: st.round, judge: st.judge, target: st.target, scores: st.scores, deadline: st.deadline, turn: st.turn, turnId: st.step,
        word: st.word.w, cat: st.word.c, meaning: seeM ? st.word.m : null,
        role: seat < 0 ? 'spec' : seat === st.judge ? 'judge' : isH ? 'honest' : 'liar',
        hint: st.hint, peek: st.peek, peekUntil: isH && st.phase === 'prep' && st.peek && !st.peekHidden ? st.peekUntil : 0, peekGone: isH && st.peek && !seeM && !open,
        order: st.order, spk: st.spk, said: st.said, readyN: Object.keys(st.ready).length, needN: st.n - 1, meReady: !!st.ready[seat], swaps: st.swaps,
        last: open ? st.last : null, log: st.log.slice(-3)
      };
    },

    // ================= 畫面 =================
    render(el, v, ui) {
      const me = v.seat, N = v.names, nm = (i) => U.esc(N[i] || '?');
      // 重畫前保留打到一半的字和游標
      const oldTa = el.querySelector('.bl-say textarea');
      const keep = oldTa ? { val: oldTa.value, focus: document.activeElement === oldTa, s: oldTa.selectionStart, e: oldTa.selectionEnd, key: oldTa.dataset.k } : null;
      el.dataset.g = 'bluff';
      const speaker = v.phase === 'talk' ? v.order[v.spk] : -1;
      const roleTag = { judge: '<span class="bl-role judge">👨‍⚖️ 你是裁判</span>', honest: '<span class="bl-role honest">😇 你是老實人</span>', liar: '<span class="bl-role liar">🤥 你是唬爛王</span>', spec: '<span class="bl-role">👀 觀戰中</span>' }[v.role];
      const chips = N.map((n, i) => `<div class="pchip ${i === speaker || (v.phase === 'vote' && i === v.judge) ? 'turn' : ''} ${i === v.judge ? 'bl-judge' : ''}">${i === v.judge ? '👨‍⚖️' : ''}${U.esc(n)}<b>${v.scores[i]} 分</b></div>`).join('');

      let body = '';
      if (v.phase === 'prep') {
        const tip = { judge: '等大家準備。待會仔細聽每個人的說明，找出誰說的是真的。', honest: '你知道真正的意思！待會照實講，但講得太像背字典反而會被懷疑。', liar: '你不知道意思！從詞的字面去聯想，講得越有細節越像真的。', spec: '玩家準備中…' }[v.role];
        body = `<p class="bl-tip">${tip}</p>
          ${v.role === 'liar' && v.hint ? this._angles(v) : ''}
          ${v.role === 'honest' ? (v.meaning ? `<div class="bl-mean"><small>真正的意思（只有你看得到）${v.peekUntil ? ` <span class="timer" data-deadline="${v.peekUntil}"></span> 後消失` : ''}</small><p>${U.esc(v.meaning)}</p></div>` : `<div class="bl-mean gone"><small>答案已經收起來了，靠記憶吧！</small></div>`) : ''}
          <div class="act-row">
            ${me >= 0 && v.role !== 'judge' ? `<button class="btn big" data-a="ready" ${v.meReady ? 'disabled' : ''}>${v.meReady ? '✔ 已準備' : '我準備好了'}</button>` : ''}
            ${me >= 0 && v.swaps < 2 ? `<button class="btn ghost sm" data-a="swap">我認識這個詞，換一題</button>` : ''}
          </div>
          <p class="hint center">已準備 ${v.readyN}／${v.needN} 人・時間到自動開始</p>`;
      } else if (v.phase === 'talk' || v.phase === 'vote') {
        if (v.role === 'honest' && v.meaning) body += `<div class="bl-mean small"><small>真正的意思</small><p>${U.esc(v.meaning)}</p></div>`;
        if (v.role === 'honest' && v.peekGone) body += `<div class="bl-mean gone"><small>答案已收起來，靠記憶照實說</small></div>`;
        body += `<ol class="bl-order">${v.order.map((s, k) => {
          const st = v.phase === 'vote' || k < v.spk ? 'done' : k === v.spk ? 'now' : 'wait';
          const said = v.said[s];
          const pickable = v.phase === 'vote' && me === v.judge;
          return `<li class="${st} ${pickable ? 'pick' : ''} ${this._sel === s && pickable ? 'sel' : ''}" ${pickable ? `data-p="${s}"` : ''}>
            <div class="who">${st === 'now' ? '🎤' : st === 'done' ? '✔' : (k + 1) + '.'} ${nm(s)}${s === me ? '（你）' : ''}${st === 'now' ? ' <span class="timer" data-deadline="' + (v.deadline || '') + '"></span>' : ''}</div>
            ${said ? `<p class="said">「${U.esc(said)}」</p>` : st === 'now' ? '<p class="said dim">說明中…</p>' : ''}</li>`;
        }).join('')}</ol>`;
        if (v.phase === 'talk' && speaker === me && v.role === 'liar' && v.hint) body += this._angles(v);
        if (v.phase === 'talk' && speaker === me) {
          body += `<div class="bl-say"><p class="turn-line">👉 輪到你了，開麥克風說明「${U.esc(v.word)}」是什麼</p>
            <textarea data-k="${v.turnId}" maxlength="80" rows="2" placeholder="沒開語音的話，可以在這裡打字（選填）"></textarea>
            <button class="btn big" data-a="done">我講完了</button></div>`;
        } else if (v.phase === 'talk') {
          body += `<p class="hint center">請 ${nm(speaker)} 說明，大家安靜聽</p>`;
        } else if (me === v.judge) {
          body += `<div class="bl-say"><p class="turn-line">👉 誰說的才是真的？點一個人再確定 <span class="timer" data-deadline="${v.deadline || ''}"></span></p>
            <button class="btn big" data-a="pick" ${this._sel == null || !v.order.includes(this._sel) ? 'disabled' : ''}>${this._sel != null && v.order.includes(this._sel) ? `就是 ${nm(this._sel)} 說真話！` : '先點一位玩家'}</button></div>`;
        } else {
          body += `<p class="hint center">等 ${nm(v.judge)} 判斷誰說真話… <span class="timer" data-deadline="${v.deadline || ''}"></span></p>`;
        }
      } else if (v.phase === 'reveal' && v.last) {
        const L = v.last;
        body = `<div class="bl-reveal ${L.ok ? 'ok' : 'no'}">
          <p class="big">${L.timeout ? '裁判沒選，系統隨機挑了 ' : '裁判選了 '}<b>${nm(L.pick)}</b></p>
          <h3>${L.ok ? '🎯 猜對了！' : `🤥 被唬爛了！老實人是 ${nm(L.honest)}`}</h3>
          <div class="bl-mean"><small>「${U.esc(L.word.w)}」真正的意思</small><p>${U.esc(L.word.m)}</p></div>
          <p>${L.gain.map((g, i) => g ? `${nm(i)} +${g}` : '').filter(Boolean).join('、')}</p>
          ${me >= 0 ? '<button class="btn" data-a="next">下一回合</button>' : ''}<p class="hint">15 秒後自動繼續</p></div>`;
      } else if (v.phase === 'over') {
        const best = Math.max(...v.scores);
        const rank = U.range(v.scores.length).sort((a, b) => v.scores[b] - v.scores[a]);
        body = `<div class="bl-reveal ok">
          ${v.last ? `<div class="bl-mean"><small>最後一題「${U.esc(v.last.word.w)}」</small><p>${U.esc(v.last.word.m)}</p></div>` : ''}
          <h3>👑 唬爛王：${rank.filter(i => v.scores[i] === best).map(nm).join('、')}</h3>
          ${rank.map((s, i) => `<p>${i + 1}. ${nm(s)} — ${v.scores[s]} 分</p>`).join('')}
          ${me >= 0 ? '<button class="btn" data-a="next">再玩一次</button>' : ''}</div>`;
      }

      el.innerHTML = `<div class="bl">
        <div class="players-row">${chips}</div>
        <div class="bl-head"><span>第 ${v.round} 回合・先到 ${v.target} 分</span>${v.phase === 'prep' ? `<span class="timer" data-deadline="${v.deadline || ''}"></span>` : ''}</div>
        <div class="bl-card"><small>${U.esc(v.cat)}</small><h2>${U.esc(v.word)}</h2>${roleTag}</div>
        ${body}
        ${v.log.length && v.phase === 'prep' ? `<p class="hint center">${U.esc(v.log[v.log.length - 1].sys)}</p>` : ''}
      </div>`;

      const ta = el.querySelector('.bl-say textarea');
      if (ta && keep && keep.key === ta.dataset.k) { ta.value = keep.val; if (keep.focus) { ta.focus(); try { ta.setSelectionRange(keep.s, keep.e); } catch (e) {} } }
      el.querySelectorAll('[data-p]').forEach(li => li.onclick = () => { this._sel = +li.dataset.p; this.render(el, v, ui); });
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        const a = b.dataset.a;
        if (a === 'done') { const t = el.querySelector('.bl-say textarea'); ui.send({ type: 'done', text: t ? t.value : '' }); }
        else if (a === 'pick') { if (this._sel != null) ui.send({ type: 'pick', seat: this._sel }); this._sel = null; }
        else if (a === 'swap') { if (confirm('確定換一題？（不會透露是誰按的）')) ui.send({ type: 'swap' }); }
        else ui.send({ type: a });
      });
      el.querySelectorAll('[data-reroll]').forEach(b => b.onclick = () => { this._roll = (this._roll || 0) + 1; this.render(el, v, ui); });
      if (v.phase !== 'vote') this._sel = null;
    },
    // 每人每題固定 3 個方向（重畫不會亂跳），按🔄換一組
    _angles(v) {
      const key = v.word + ':' + v.seat + ':' + (this._roll || 0);
      if (this._angKey !== key) {
        this._angKey = key; let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        const pool = ANGLES.slice(), out = [];
        while (out.length < 3) { h = (h * 1103515245 + 12345) >>> 0; out.push(pool.splice(h % pool.length, 1)[0]); }
        this._ang = out;
      }
      return `<div class="bl-angles"><small>沒靈感？挑一個方向開始掰</small><div>${this._ang.map(a => `<span>${U.esc(a)}</span>`).join('')}<button class="btn ghost sm" data-reroll>🔄</button></div></div>`;
    }
  };
  M.BANK = BANK;
  root.GAMES.bluff = M;
})(typeof window !== 'undefined' ? window : globalThis);
