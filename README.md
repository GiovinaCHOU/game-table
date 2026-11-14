# 牌桌｜線上開房

麻將（台灣16張，3/4/5人）、大老二、心臟病、拉密、吹牛、你畫我猜。PIN 開房、觀戰、即時語音、快捷文字。

## 上線（GitHub Pages）
1. GitHub 新建一個 repo（例如 `game-table`），設成 Public。
2. 把這個資料夾裡全部檔案上傳（Add file → Upload files，整包拖進去）。
3. Settings → Pages → Branch 選 `main`、資料夾 `/ (root)` → Save。
4. 約 1 分鐘後網址：`https://你的帳號.github.io/game-table/`

## 建議：設定 TURN（讓 4G/5G 也連得上）
1. 到 https://dashboard.metered.ca 免費註冊（每月 20GB 免費中繼流量）。
2. TURN Server → Add Credential → 複製 API URL。
3. 打開 `js/config.js`，貼到 `turnApiUrl: ''` 的引號裡，再上傳覆蓋。

## 本機測試
網址後面加 `?local=1`，同一個瀏覽器開多個分頁就能模擬多人（沒有語音）。
