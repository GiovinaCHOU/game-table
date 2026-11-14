// ===== 設定檔：只需要改這裡 =====
window.APP_CONFIG = {
  // 房間 ID 前綴（避免跟別人的 PeerJS 房號撞到，可改成任何英文）
  roomPrefix: 'yungmei-table-',

  // TURN 中繼伺服器（建議設定，讓 4G/5G 也連得上）
  // 做法：到 https://dashboard.metered.ca 免費註冊 → TURN Server → Add Credential
  // 方式 A：把 Metered 給的「API URL」貼在這裡（像 https://你的名字.metered.live/api/v1/turn/credentials?apiKey=xxxx）
  turnApiUrl: 'https://giovina-game-table.metered.live/api/v1/turn/credentials?apiKey=f1c6cb78871f1f50801134e99e84b282e29c',

  // 方式 B：直接把 ICE Servers 陣列貼在這裡（與方式 A 二選一）
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
    // 備援 TURN（ExpressTURN）貼在這裡，例如：
    // ,{ urls: 'turn:relay1.expressturn.com:3478', username: '...', credential: '...' }
  ]
};
