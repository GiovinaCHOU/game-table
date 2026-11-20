// 誰是唬爛王（瞎掰王玩法）：一個冷門詞，只有「老實人」知道真正的意思，其他人當場瞎掰，裁判猜誰說真話
(function (root) {
  const U = root.GUTIL;
  // 題庫：w 詞、m 真正的意思（給老實人看，也是揭曉時的答案）
  // 出題方向（使用者指定）：「真有此事，但聽起來像唬爛」——越像亂掰越好，每題都要查得到出處
  const BANK = {
    // ===== 怪但是真的（預設題庫）：聽起來像亂掰，其實真有其事 =====
    history: { name: '怪歷史・怪地名', weird: 1, list: [
      ['鴯鶓戰爭', '1932 年澳洲派軍人帶機槍去對付破壞農田的大批鴯鶓（一種大鳥），結果沒打贏'],
      ['足球戰爭', '1969 年宏都拉斯和薩爾瓦多在世界盃資格賽後爆發的短暫戰爭'],
      ['豬戰爭', '1859 年美國和英國因為一頭闖進菜園被射殺的豬而對峙，最後唯一的死者就是那頭豬'],
      ['糖蜜大洪水', '1919 年波士頓一個巨大的糖蜜儲槽破裂，糖蜜浪衝上街道，造成 21 人死亡'],
      ['跳舞瘟疫', '1518 年法國史特拉斯堡有人在街上停不下來地跳舞，接著上百人跟著跳了好幾天'],
      ['啤酒洪水', '1814 年倫敦一家釀酒廠的大酒桶破裂，啤酒沖垮房屋，造成 8 人死亡'],
      ['大惡臭', '1858 年夏天倫敦泰晤士河臭到國會受不了，因此蓋了現代的下水道系統'],
      ['屍體審判', '西元 897 年，教宗把前任教宗的屍體挖出來，穿上袍子放在被告席上受審'],
      ['鬱金香狂熱', '17 世紀荷蘭人瘋狂炒作鬱金香球根，一顆球根貴到能換一棟房子，最後泡沫破裂'],
      ['英桑戰爭', '1896 年英國和桑吉巴打的仗，不到一個小時就結束，被認為是史上最短的戰爭'],
      ['地獄村', '挪威真的有一個村莊叫 Hell（地獄），冬天還會被說「地獄結冰了」'],
      ['打狗', '高雄的舊名'],
      ['雞籠', '基隆的舊名'],
      ['鬼湖', '台灣中央山脈南段的一群高山湖泊，像大鬼湖、小鬼湖'],
      ['希勒湖', '澳洲一座天然的粉紅色湖泊，從空中看像一杯草莓牛奶']
    ] },
    beast: { name: '怪動物', weird: 1, list: [
      ['屁股呼吸龜', '澳洲的瑪麗河龜可以用屁股（泄殖腔）在水裡呼吸，能長時間不浮上來換氣'],
      ['方塊便便', '袋熊的大便是方方正正的立方體'],
      ['盲鰻噴黏液', '盲鰻被攻擊時，一下子就能噴出一大團黏液，把對方的鰓塞住'],
      ['海參吐內臟', '有些海參遇到危險會把內臟噴出去嚇敵人，之後再慢慢長回來'],
      ['槍蝦', '一種小蝦，夾子瞬間合起來會產生爆裂的氣泡，聲音大到能震暈小魚'],
      ['殭屍螞蟻', '被一種真菌感染的螞蟻會爬到高處咬住葉子不放，接著真菌從牠頭上長出來'],
      ['吸血雀', '加拉巴哥群島的一種地雀，會啄傷海鳥的皮膚喝牠們的血'],
      ['放屁蟲', '屁步甲遇到危險時，會從屁股噴出接近 100 度的滾燙化學噴霧'],
      ['發光鴨嘴獸', '鴨嘴獸的毛在紫外線燈下會發出藍綠色的螢光'],
      ['長藻的樹懶', '樹懶動作太慢，毛裡會長出綠藻，讓牠看起來綠綠的'],
      ['站著睡的鯨魚', '抹香鯨會頭朝上、身體直立地漂在海裡睡覺'],
      ['雀尾螳螂蝦', '出拳速度快到能打碎蝦蟹的硬殼，甚至打裂水族箱的玻璃'],
      ['水熊蟲', '不到一公釐的小動物，乾掉後能休眠，撐過極冷、極熱甚至太空環境']
    ] },
    food: { name: '怪食物', weird: 1, list: [
      ['蛆乳酪', '義大利薩丁尼亞的卡蘇馬蘇乳酪，故意讓蒼蠅幼蟲在裡面幫忙發酵'],
      ['童子蛋', '浙江東陽的傳統小吃，用小男孩的尿來煮雞蛋'],
      ['貓屎咖啡', '麝香貓吃下咖啡果、排出咖啡豆，再把豆子洗乾淨烘焙成的咖啡'],
      ['狗不理', '天津有名的包子店，店名來自創始人的小名「狗子」'],
      ['螞蟻上樹', '川菜，冬粉炒肉末，肉末黏在冬粉上像螞蟻在爬樹'],
      ['叫化雞', '用荷葉和泥巴把整隻雞包起來去烤的料理'],
      ['驢打滾', '北京小吃，黃豆粉裹著紅豆餡的糯米捲'],
      ['夫妻肺片', '四川涼菜，用滷過的牛肉和牛雜拌紅油，名字裡的「肺片」據說原本是「廢片」'],
      ['菜尾', '辦桌吃剩的各種菜倒在一起重新煮的湯']
    ] },
    job: { name: '怪職業・怪習俗', weird: 1, list: [
      ['敲窗人', '工業革命時的英國，有人專門拿長竿敲住戶窗戶叫人起床，是人肉鬧鐘'],
      ['吃罪人', '舊時英國有人專門吃掉放在死者身上的麵包，象徵替死者承擔罪孽'],
      ['鞭童', '相傳歐洲宮廷裡，王子犯錯時代替王子挨打的男孩'],
      ['御廁侍從', '英國都鐸王朝專門服侍國王上廁所的近臣，因為很親近國王，地位很高'],
      ['聞味師', '替除臭劑公司聞受試者腋下、測試除臭效果的專業人員'],
      ['孝女白琴', '台灣喪禮上代替家屬哭喪的表演者'],
      ['牽亡歌', '台灣喪禮中，用說唱和舞步引導亡魂的陣頭'],
      ['十八王公', '新北石門的廟，供奉十七位落難者，以及一條跟著主人殉死的狗'],
      ['曲水流觴', '古人在彎曲的水道放酒杯，杯子停在誰面前誰就要喝酒作詩'],
      ['射覆', '古代遊戲：把東西蓋在碗下面讓人猜是什麼'],
      ['胡床', '古代可以折疊的輕便坐椅，類似現在的板凳，不是床'],
      ['笏', '古代大臣上朝時拿在手上的長條板子，可以記事']
    ] },
    psy: { name: '怪效應・冷知識', weird: 1, list: [
      ['自行車棚效應', '開會時，大家對無關緊要的小事（像腳踏車棚要漆什麼顏色）討論得最久'],
      ['眼鏡蛇效應', '解決問題的獎勵反而讓問題更嚴重（相傳懸賞死蛇，結果大家開始養蛇來領錢）'],
      ['史翠珊效應', '越想刪掉、壓下某個消息，它反而傳得越廣'],
      ['紅皇后效應', '你必須拚命跑才能留在原地，比喻競爭中不進步就是退步'],
      ['鳥籠效應', '有人送你一個空鳥籠，你最後很可能會去買一隻鳥來配它'],
      ['富蘭克林效應', '幫過你一次忙的人，會比你幫過的人更願意再幫你'],
      ['狄德羅效應', '買了一件新東西後，會想把周圍的東西都換掉來搭配它'],
      ['橡皮鴨除錯法', '對著一隻橡皮鴨逐行解釋程式碼，講著講著常常就自己發現錯誤'],
      ['麥格克效應', '看到的嘴形會改變你聽到的聲音'],
      ['巴納姆效應', '人會覺得很籠統的性格描述特別準，像星座分析'],
      ['光噴嚏反射', '有些人突然看到強光就會打噴嚏'],
      ['蝶腭神經節痛', '吃冰吃太快造成的頭痛的正式名稱'],
      ['曼德拉效應', '很多人一起記錯同一件事的現象'],
      ['宜家效應', '人會特別珍惜、高估自己親手組裝的東西'],
      ['蔡格尼克效應', '沒做完的事，比做完的事更容易記得'],
      ['巴德爾-邁因霍夫現象', '剛注意到一件事之後，突然覺得到處都看得到它'],
      ['語義飽和', '一個字盯太久或念太多次，突然覺得它好陌生'],
      ['幻想性錯覺', '在雲朵、插座、房子上看到人臉的現象'],
      ['彼得原理', '在組織裡，人會一路被升遷到他不能勝任的位置為止'],
      ['帕金森定律', '工作會自動膨脹，直到把你給它的時間全部填滿'],
      ['布羅肯幽靈', '背對太陽時，自己的影子投在雲霧上，周圍還有一圈彩色光環'],
      ['布丁石', '圓滾滾的卵石嵌在細砂裡，看起來像葡萄乾布丁的岩石']
    ] },
    // ===== 經典冷門詞（難字、神獸、台語）=====
    word: { name: '難字詞語', list: [
      ['囧', '本義是光明，形容窗戶透進光的樣子；後來網路借用來表示尷尬無奈'],
      ['槑', '「梅」的古字'],
      ['嫑', '方言用字，「不要」兩個字合在一起的意思'],
      ['兲', '「天」的古字寫法'],
      ['靐', '形容打雷的聲音'],
      ['龘', '形容龍在天上飛的樣子'],
      ['齉', '鼻子不通氣，說話帶著很重的鼻音'],
      ['耵聹', '耳屎的正式名稱'],
      ['眵', '眼屎'],
      ['呃逆', '打嗝的醫學名稱'],
      ['囟門', '嬰兒頭頂骨頭還沒長合的柔軟部位'],
      ['膕窩', '膝蓋正後方的那個凹窩'],
      ['觳觫', '因為害怕而全身發抖'],
      ['囁嚅', '想說又不敢說，吞吞吐吐的樣子'],
      ['饔飧', '早餐和晚餐（古人一天吃兩餐）'],
      ['蹀躞', '小步走路、來回徘徊的樣子'],
      ['闃寂', '寂靜無聲'],
      ['杌隉', '局勢或心情動盪不安'],
      ['黽勉', '勤奮努力'],
      ['繾綣', '感情纏綿，捨不得分開'],
      ['窸窣', '細碎輕微的摩擦聲'],
      ['黧黑', '臉色又黑又黃'],
      ['齟齬', '上下牙齒對不齊，比喻意見不合'],
      ['睚眥', '瞪眼生氣，比喻很小很小的怨恨'],
      ['氍毹', '毛織的地毯，古時也借指戲台'],
      ['罔兩', '影子邊緣那一圈淡淡的影子（出自《莊子》的寓言）'],
      ['枵腹從公', '餓著肚子也要辦公事，形容公而忘私'],
      ['首鼠兩端', '像老鼠探頭出洞那樣猶豫不決、搖擺不定'],
      ['曲突徙薪', '把煙囪改彎、把柴搬遠，比喻事先防範災禍'],
      ['鼯鼠五技', '會五種本事卻樣樣不精'],
      ['蚍蜉撼樹', '螞蟻想搖動大樹，比喻不自量力'],
      ['狗尾續貂', '拿差的東西接在好東西後面，多指續寫的作品比不上原作'],
      ['鵲巢鳩占', '斑鳩住進喜鵲的巢，比喻霸占別人的位置']
    ] },
    nature: { name: '生物難字', list: [
      ['孑孓', '蚊子的幼蟲，在水裡一扭一扭地游'],
      ['蝤蠐', '天牛的幼蟲，又白又長，古人拿來形容女子的脖子白皙'],
      ['蜩', '蟬的古稱'],
      ['螽斯', '一種長得像蚱蜢的昆蟲，古代用來祝福子孫滿堂'],
      ['蟪蛄', '一種小型的蟬，夏天出生、秋天就死'],
      ['蛞蝓', '沒有殼的蝸牛，俗稱鼻涕蟲'],
      ['蚰蜒', '長得像蜈蚣、腳特別細長的節肢動物'],
      ['蠼螋', '尾巴有一對鉗子的昆蟲，俗稱剪刀蟲'],
      ['蜾蠃', '一種細腰蜂，會抓青蟲回巢給自己的幼蟲當食物'],
      ['螟蛉', '螟蛾的幼蟲；古人誤以為細腰蜂在收養牠，後來借指養子'],
      ['鼩鼱', '長得像老鼠的小型食蟲動物，其實不是老鼠'],
      ['鸊鷉', '一種很會潛水的小型水鳥'],
      ['鴞', '貓頭鷹一類的鳥'],
      ['鼯鼠', '能張開翼膜在樹林間滑翔的松鼠'],
      ['鱟', '背著硬殼、拖著劍狀尾巴的海洋節肢動物，血是藍色的'],
      ['鮟鱇', '頭頂有一根會發光的「釣竿」誘捕獵物的深海魚'],
      ['海蟑螂', '海邊礁岩上很常見的甲殼動物，其實不是蟑螂'],
      ['海豬', '生活在深海泥地上的一種海參，長得像粉紅色小豬'],
      ['海兔', '一種沒有外殼的海蛞蝓，頭上的觸角像兔子耳朵'],
      ['星鼻鼴', '鼻子周圍長了一圈星星狀肉質觸手的鼴鼠'],
      ['指猴', '馬達加斯加的狐猴，用特別細長的中指敲樹找蟲吃'],
      ['霍加狓', '長頸鹿的近親，屁股和腿上有斑馬般的條紋'],
      ['鼷鹿', '世界上最小的有蹄類動物之一，體型跟兔子差不多'],
      ['獴', '一種敢跟眼鏡蛇對打的小型肉食動物'],
      ['鬼頭刀', '額頭又高又方的海洋魚，又叫鯕鰍'],
      ['鯔', '烏魚'],
      ['犰狳', '身上有骨質盔甲的美洲動物，有些種類遇到危險會縮成一顆球']
    ] },
    myth: { name: '神獸傳說', list: [
      ['狻猊', '龍生九子之一，像獅子，喜歡煙火，常裝飾在香爐上'],
      ['椒圖', '龍生九子之一，像螺蚌，喜歡把門關緊，常做成大門上的門環'],
      ['蒲牢', '龍生九子之一，很愛吼叫，常鑄在大鐘的頂端'],
      ['贔屭', '龍生九子之一，像烏龜，力氣大愛扛重物，常馱著石碑'],
      ['鴟吻', '屋脊兩端龍頭魚尾的裝飾，傳說可以防火'],
      ['獬豸', '能分辨是非、會用角去頂壞人的神獸，象徵司法公正'],
      ['畢方', '《山海經》裡只有一隻腳的鳥，牠出現的地方會發生火災'],
      ['帝江', '《山海經》裡像黃色布袋、六隻腳四個翅膀、沒有臉，卻會唱歌跳舞的神獸'],
      ['夔', '只有一隻腳的神獸，傳說黃帝用牠的皮做鼓，聲音傳五百里'],
      ['窮奇', '上古四凶之一，像長了翅膀的老虎，專門吃好人、幫壞人'],
      ['當康', '《山海經》裡長得像豬、叫聲就是自己名字的獸，牠出現代表要大豐收'],
      ['朱厭', '《山海經》裡像白頭紅腳猿猴的獸，牠出現就會有大戰'],
      ['旋龜', '《山海經》裡鳥頭蛇尾的烏龜，叫聲像在劈木頭'],
      ['陸吾', '《山海經》裡人臉虎身、九條尾巴的神，掌管崑崙山'],
      ['英招', '《山海經》裡馬身人臉、虎紋鳥翅的神，替天帝看守花園'],
      ['鯥', '《山海經》裡像牛、有蛇尾和翅膀的魚，冬天死掉、夏天又活過來'],
      ['蠱雕', '《山海經》裡長得像雕卻頭上長角、叫聲像嬰兒、會吃人的怪鳥']
    ] },
    tw: { name: '台灣在地', list: [
      ['臭彈', '台語，吹牛、說大話'],
      ['膨風', '台語，吹牛、誇大其詞'],
      ['烏白講', '台語，亂講話'],
      ['鐵齒', '台語，嘴硬、不信邪'],
      ['無采', '台語，可惜、浪費'],
      ['抾角', '台語，罵人沒用、不成材'],
      ['古錐', '台語，可愛'],
      ['阿沙力', '台語（源自日語），做事爽快乾脆'],
      ['凍蒜', '台語「當選」的諧音，選舉造勢時大家一起喊'],
      ['菜市仔名', '很常見、到處都有人取的名字'],
      ['雞婆', '愛多管閒事'],
      ['黑白切', '小吃攤上滷或燙好的各種小菜，想吃什麼就切什麼'],
      ['鹹光餅', '中間有洞、可以用繩子串起來的餅，相傳是戚繼光的軍糧'],
      ['鴨賞', '宜蘭名產，鴨子先醃過再煙燻做成的'],
      ['卜肉', '宜蘭小吃，豬肉條裹粉下去油炸'],
      ['糕渣', '宜蘭小吃，高湯煮成濃稠糊狀放涼切塊，再裹粉油炸'],
      ['膽肝', '宜蘭名產，豬肝用糖和醬料醃過再風乾'],
      ['狀元糕', '米粉填進木模蒸成的小糕，中間常包花生粉'],
      ['米苔目', '米漿做成的粗短麵條，常加在剉冰或湯裡']
    ] },
  };
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
    (st.cat === 'all' ? CAT_KEYS : st.cat === 'weird' ? CAT_KEYS.filter(k => BANK[k].weird) : [st.cat]).forEach(k => BANK[k] && BANK[k].list.forEach(([w, m]) => base.push({ w, m, c: BANK[k].name })));
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
      { key: 'cat', label: '題目類型', choices: [['weird', '怪但是真的（推薦）'], ['all', '全部混合'], ['history', '怪歷史・怪地名'], ['beast', '怪動物'], ['food', '怪食物'], ['job', '怪職業・怪習俗'], ['psy', '怪效應・冷知識'], ['tw', '台灣在地'], ['myth', '神獸傳說'], ['word', '難字詞語'], ['nature', '生物難字']], def: 'weird' },
      { key: 'prepT', label: '準備時間', choices: [[30, '30 秒'], [45, '45 秒'], [20, '20 秒']], def: 30 },
      { key: 'speakT', label: '每人說明時間', choices: [[40, '40 秒'], [60, '60 秒'], [25, '25 秒'], [0, '不限（講完自己按）']], def: 40 },
      { key: 'peek', label: '老實人看答案', choices: [[0, '準備時間都看得到'], [5, '只能看 5 秒（村規）'], [10, '只能看 10 秒']], def: 0 },
      { key: 'source', label: '題庫', choices: [['builtin', '內建題目'], ['both', '內建＋自訂'], ['custom', '只用自訂']], def: 'builtin' },
      { key: 'custom', label: '自訂題目（一行一題，詞＝真正的意思）', type: 'text', placeholder: '例如：\n阿傑的貓＝一隻會開冰箱的橘貓\n囍＝雙喜，用在結婚', def: '', count: (s) => parseCustom(s).length }
    ],
    init(n, o, names, now) {
      const st = {
        n, target: +o.target || 5, cat: BANK[o.cat] || o.cat === 'all' || o.cat === 'weird' ? o.cat : 'weird', prepT: +o.prepT || 30, speakT: o.speakT == null ? 40 : +o.speakT,
        peek: +o.peek || 0, source: o.source || 'builtin', custom: parseCustom(o.custom),
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
        peek: st.peek, peekUntil: isH && st.phase === 'prep' && st.peek && !st.peekHidden ? st.peekUntil : 0, peekGone: isH && st.peek && !seeM && !open,
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
        const tip = { judge: '等大家準備。待會仔細聽每個人的說明，找出誰說的是真的。', honest: '你知道真正的意思！待會照實講，但講得太像背字典反而會被懷疑。', liar: '你不知道意思，開始想一個聽起來很像真的解釋吧！', spec: '玩家準備中…' }[v.role];
        body = `<p class="bl-tip">${tip}</p>
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
      if (v.phase !== 'vote') this._sel = null;
    }
  };
  M.BANK = BANK;
  root.GAMES.bluff = M;
})(typeof window !== 'undefined' ? window : globalThis);
