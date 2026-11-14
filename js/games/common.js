// 共用工具
(function (root) {
  const U = {};
  U.shuffle = function (a) {
    for (let i = a.length - 1; i > 0; i--) {
      let r;
      if (root.crypto && root.crypto.getRandomValues) { const b = new Uint32Array(1); root.crypto.getRandomValues(b); r = b[0] / 4294967296; }
      else r = Math.random();
      const j = Math.floor(r * (i + 1)); [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.range = (n) => Array.from({ length: n }, (_, i) => i);
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 撲克牌：c = (點數-1)*4 + 花色，點數 1(A)~13(K)，花色 0♣ 1♦ 2♥ 3♠；多副牌 +52
  U.SUITS = ['♣', '♦', '♥', '♠'];
  U.RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  U.rank = (c) => Math.floor((c % 52) / 4) + 1;
  U.suit = (c) => (c % 52) % 4;
  U.deck = (n) => U.range(52 * (n || 1));
  U.cardHTML = function (c, extra) {
    if (c == null || c < 0) return `<div class="card back ${extra || ''}"></div>`;
    const s = U.suit(c), r = U.rank(c);
    return `<div class="card ${s === 1 || s === 2 ? 'red' : ''} ${extra || ''}" data-c="${c}"><b>${U.RANKS[r]}</b><i>${U.SUITS[s]}</i></div>`;
  };
  U.fmtLeft = function (deadline, serverNow) {
    if (!deadline) return '';
    const s = Math.max(0, Math.ceil((deadline - serverNow) / 1000));
    return s + '″';
  };
  root.GUTIL = U;
  root.GAMES = root.GAMES || {};
})(typeof window !== 'undefined' ? window : globalThis);
