# 牌桌｜線上開房（CLAUDE.md）

GitHub Pages 靜態網站（main 分支根目錄）：https://giovinachou.github.io/game-table/
純原生 JS（每個檔案一個 IIFE，掛在 window 上），沒有 build 流程、沒有 npm。

## 架構
- 連線：PeerJS（WebRTC），房主的裝置當裁判，所有遊戲狀態都由房主計算，其他人只收自己看得到的畫面
- 腳本載入順序寫在 index.html 的 `<script>` 標籤裡；新增檔案要加進去，而且要放在依賴它的檔案之前
- 遊戲模組註冊方式：`root.GAMES.<id> = M`（common.js 會建立 GAMES）

## 檔案地圖
核心（非必要不改）
- js/config.js：房號前綴、TURN 設定
- js/net.js：連線層（PeerJS＋本機測試模式）、語音
- js/room.js：房間、PIN、觀戰、房主裁判
- js/app.js：大廳與介面
- js/games/common.js：共用工具（GUTIL、洗牌等）
- js/games/fx.js：共用音效、背景音樂、勝利彩炮／輸家砸雞蛋
- style.css：全站樣式

小遊戲（一個遊戲一個檔案）
- mahjong.js 台灣16張麻將（3/4/5人）｜bigtwo.js 大老二｜slap.js 心臟病｜rummi.js 拉密｜dice.js 吹牛｜draw.js 你畫我猜

大富翁（都在 js/games/）
- monopoly.js：遊戲模組主體、主題選單、事件與動畫的調度
- mono-rules.js：規則（由房主判定）
- mono-themes.js：各主題的資料（地名、角色、建築風格、幸運卡／厄運卡；檔頭有卡片效果代碼的說明）
- mono-quiz.js：翻盤問答題庫（每個主題分簡單／中等／困難）
- mono3d.js：3D 場景核心（鏡頭、格子、角色移動）；諸神黃昏、夜城、深空異種、動物星球的破產演出也在這裡
- mono-art.js：3D 美術（各主題的環境、格子貼圖、建築）
- mono-chars.js：3D 關節角色與動作
- mono-eggs.js：神佛之境＋魔法學院的彩蛋全螢幕動畫（MONO_EGGS）
- mono-horror.js：恐怖系動畫共用工具＋鬼門開
- mono-magicfx.js：魔法學院的動畫
- mono-score.js：彩蛋配樂合成（Web Audio）
- mono-pixel.js：怪奇小鎮的像素角色、建築、場景零件（MONO_PIXEL）
- mono-town.js：怪奇小鎮的動畫
- mono-gangpix.js：幫派街區的像素角色（共用 MONO_PIXEL）
- mono-gangmap.js：幫派街區的像素地圖與建築
- mono-gang.js：幫派街區的動畫（含「正派掃蕩」襲擊）
- mono-raid.js：第 31 回合起每 3 回合的「襲擊」動畫＋分派（MONO_EGGS.raid）：諸神黃昏 路西法、動物星球 猩猩、夜城 乞丐幫、深空異種 未知生物、神佛之境 扎小人、魔法學院 黑魔王；怪奇小鎮魔狗在 mono-town.js（hound／houndBld）、幫派街區在 mono-gang.js（sweep）

主題 id 對照：ragnarok 諸神黃昏、cyber 夜城、animal 動物星球、alien 深空異種、buddha 神佛之境、magic 魔法學院、town 怪奇小鎮、gang 幫派街區

其他
- img/themes/<主題id>-0~2.jpg：主題背景圖｜img/pet0~3.png：拉密鬼牌（三隻貓＋鳥）
- vendor/：peerjs、three.js（不改）
- tools/bump.py：替 index.html 的 js/css 加版本號（避免手機吃到舊快取）
- tools/mono-sim.js：大富翁平衡模擬器（`node tools/mono-sim.js main 2000 A E`／`themes`／`players`／`check`），固定亂數種子配對比較，含 5 種打法的聰明電腦
- tools/mono-cards.js：卡片盤點（每張卡的級別、機率、計算方式、模擬實測的金額分位數、致死數）→ `node tools/mono-cards.js 2000 輸出.csv`
- tools/mono-cardsim.js：卡片平衡 v1 的 A–D 模擬（`node tools/mono-cardsim.js 5000 3,5,6 CA,CB,CC,CD`，一行一個情境的 JSON），含致死率、彩蛋頻率、補救成功率、信賴區間
- tools/mono-rescue.js：危機補救專項測試（同一局面強制套用 不補救／變賣／防護罩／負債，配對比較存活、名次、勝率、清償回合）→ `node tools/mono-rescue.js 60000 5 0`
- tools/mono-eggsim.js：彩蛋權重測試（每局次數分布、落在誰身上、拿到彩蛋的勝率、彩蛋改變勝負的比例）→ `node tools/mono-eggsim.js 5000 3,5,6 CA,CC,EN,EP`
- 彩蛋候選規則（使用者選定，待真人試玩）：P＝依人數調整＋保底，目標整桌每局約 1 次；保底不能變成可預測的倒數（單次機率上限 20%、每次 ±30% 隨機波動、累積速度與冷卻長度隨機）
- 平衡提案開關：mono-rules.js 的 BAL，存在每局的 st.bal（開局決定）；正式房間一律關。測試房 🧪 選項只保留待真人測試的：卡片金額公式、卡片分級抽卡（＝彩蛋依人數＋保底 P）、高額厄運危機處理、擲骰選 1／2 顆、前方危險預覽。已否決、維持正式規則：色組 ×2、末日提前（規則碼還在，只有模擬器能開）；落後收購、投資浮動、轟炸停租、補助三選一、彩池、抵押也只有模擬器能開

## 上線流程
1. 改完程式後執行 `python3 tools/bump.py`
2. commit 並 push 到 main（GitHub Pages 約 1 分鐘後更新）
3. commit 訊息用中文，寫玩家看得懂的改動內容

## 測試
- 網址加 `?local=1`：同一個瀏覽器開多個分頁模擬多人（沒有語音）
- 測試房 PIN 777777：有電腦玩家；大富翁有「🧪」平衡實驗選項（只有測試房看得到，room.js 開局時把其他房間的 test 選項強制改回預設）
- 改到大富翁規則後跑 `node tools/mono-sim.js check`：開關全關時的指紋要跟改之前一樣（＝正式規則沒變）
- 大富翁在測試房裡、網址加 `?egg=<動畫key>`：開局 3 秒後直接預覽該彩蛋動畫（襲擊：`?egg=raid` 搶錢版、`?egg=raidBld` 砸房版，依房間主題）
- 襲擊規則（mono-rules.js 的 RAID）：第 31 回合起每 3 回合擲一次、50% 機率出現（測試可設 globalThis.__RAID_P）；挑存活人數×40%（5 人＝前 2 名）裡資產高於平均的人、按超出平均多少加權；扣現金 20～30%，現金低於 1 萬改成隨機一塊地降一級；第 28 回合預告

## 設計原則（使用者的固定要求）
- 規則要鎖死、防呆，畫面直覺；手機（iPhone／Samsung）優先
- 輪到玩家時，畫面要有明顯的變化
- 彩蛋／破產動畫：一定要有音效（恐怖系要毛骨悚然、魔法系要有魔幻感）、動畫內不放文字（結束後跳通知卡）、結尾慢慢淡出到黑
- 大富翁平衡：第 30–35 回合左右出現第一位破產，翻盤機率維持在 50% 以上；每個建築等級外觀都不同，正常玩能蓋到 L3～L4
- 大富翁的背景跟著主題走，不另外做背景選擇器
- 每個主題的風格各自獨立，不要混搭（例如怪奇物語的元素不要放進深空異種）

## 已修好的問題（改動前先確認不會改壞；修好新問題就補一行）
- 回不去房間：房主手機被系統關掉時，房號會被信令伺服器占住約 1 分鐘 → room.js 的 _rescue 會輪流「救回／連房主」最多 80 秒，不能改回只試一次就報「找不到這個房間」
- 交出房主後 90 秒內不用暫存救回（_noRevive），避免變成兩個房間
- 翻盤問答：解答至少顯示 2 秒才能點掉、作答按鈕要 stopPropagation（不然房主最後作答會直接把解答關掉）；quizres 和 bankrupt 不能被「追進度」跳過
- 上方玩家列（亮框、現金、總資產）跟著動畫走：用 _hud 快照，播到 pay／cash／steal 才變，整批播完＋鏡頭切過去才換人；新增會改錢的事件要記得呼叫 hudAdj
- 過起點領錢的特效在角色踩到起點那一刻才出現
- 動畫還在播時電腦／託管不出手（monopoly.js 的 busy）；送事件的 st.anim 要估夠長
- 跳出遊戲太久回來：第一次點畫面要重建音效引擎
- 襲擊：50% 機率、預告在第 28 回合；動畫內不放文字、不畫容易被看成怪東西的形狀

## 工作方式（省 token）
- 先看這份地圖和「已修好的問題」，只打開跟任務有關的檔案；大檔案（monopoly.js、mono-art.js、mono-gang.js 都超過 13 萬字元）用 grep 找到位置再讀需要的段落
- 直接改 repo 並 commit，不在對話裡貼整份程式碼；回報時用一兩行說明改了什麼、要怎麼測
- 新增檔案、主題或遊戲時，順手更新這份檔案地圖
