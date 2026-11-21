# 狼人殺畫面測試（需要 Python playwright＋Chrome）：python3 tools/ww-ui.py [裝置名稱...]
# 自己開本機伺服器（不用另外開 http.server）。每種裝置尺寸：房主＋一般玩家兩個分頁（?local=1）進測試房 777777＋電腦玩家，
# 兩個真人都用「點畫面」的方式玩完整局（點座位、按按鈕、按住看身分、說明視窗），每個新階段檢查：
#   橫向捲動、元素超出畫面、按鈕文字被截斷、座位互相重疊、按鈕被其他東西擋住、頁面錯誤
# 每個階段截圖存到 /tmp/ww-shots/<裝置>/
# 注意：這裡沒有 WebKit（Safari 核心），iPhone 尺寸是用 Chrome 模擬 iPhone 的畫面大小與 User-Agent
import asyncio, sys, os, random, threading, functools, http.server, socketserver, time
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = '/tmp/ww-shots'
IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
AND = 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
# 名稱, 寬, 高, 手機, UA, 這台要跑的局
DEVICES = [
  ('iPhone SE', 375, 667, True, IOS, [('werewolf', 6, {'six': 'witch'}), ('onenight', 4, {'minion': '1'}), ('werewolf', 12, {'b12': 'wk'})]),
  ('iPhone 15', 393, 852, True, IOS, [('werewolf', 6, {'six': 'hunter'}), ('onenight', 3, {})]),
  ('iPhone Pro Max', 430, 932, True, IOS, [('werewolf', 9, {}), ('onenight', 6, {'hunter': '1', 'tanner': '1'})]),
  ('Samsung S', 360, 780, True, AND, [('werewolf', 6, {'six': 'guard'}), ('onenight', 5, {'tanner': '1'}), ('werewolf', 12, {'b12': 'kg'})]),
  ('Samsung A', 412, 915, True, AND, [('werewolf', 10, {}), ('onenight', 4, {})]),
  ('手機橫放', 852, 393, True, IOS, [('werewolf', 6, {'six': 'witch'}), ('onenight', 4, {}), ('werewolf', 12, {'b12': 'wh'})]),
  ('iPad', 820, 1180, True, IPAD, [('werewolf', 9, {}), ('onenight', 6, {'minion': '1'})]),
  ('筆電', 1366, 768, False, None, [('werewolf', 12, {'b12': 'wg'}), ('onenight', 5, {})]),
  ('桌機', 1920, 1080, False, None, [('werewolf', 6, {'six': 'hunter'}), ('onenight', 3, {'minion': '1', 'hunter': '1'})]),
]
FAILS = []
def fail(msg):
  FAILS.append(msg); print('  ❌', msg)

# 加快計時（只影響這個測試，不改正式規則）：房主頁面把夜晚各段、投票等時間縮短
FAST = """(()=>{const C=WW_RULES.classic,O=WW_RULES.onenight;Object.assign(C.NIGHT_T,{guard:3500,wolf:6000,witch:4500,seer:3500});
Object.assign(C.T,{deal:30000,signup:4000,evote:9000,vote:9000,announce:2500,badge:6000,skill:3500,order:6000});Object.assign(O.T,{deal:30000,vote:15000,step:3500});})()"""

STATE = """(id)=>{const M=window.GAMES[id];const L=M&&M._last;if(!L)return null;const v=L.v;
const q=(s)=>[...document.querySelectorAll(s)];
return {phase:v.phase,sub:v.sub||null,seat:v.seat,turnId:v.turnId,over:v.phase==='over',
 overlay:!!document.querySelector('.ww-over'),pick:q('.ww-seat.pickable').map(e=>+e.dataset.seat),sel:q('.ww-seat.sel').length,
 cpick:q('.ww-cc.pickable').map(e=>+e.dataset.c),csel:q('.ww-cc.sel').length,
 btns:q('#game .ww [data-a]').filter(b=>b.offsetParent).map(b=>({a:b.dataset.a,dis:b.disabled,t:b.textContent.trim()})),
 floor:document.body.classList.contains('floor-mode'),win:!!document.querySelector('.ww-win')}}"""

# 版面檢查：回傳問題清單
LAYOUT = """()=>{const out=[];const W=innerWidth,H=innerHeight;const de=document.documentElement;
if(de.scrollWidth>W+1)out.push('整頁可以橫向捲動（'+de.scrollWidth+'>'+W+'）');
const vis=(e)=>{const r=e.getBoundingClientRect();return e.offsetParent&&r.width>0&&r.height>0;};
const root=document.querySelector('#game .ww');if(!root)return ['找不到遊戲畫面'];
const ov=document.querySelector('.ww-over');
root.querySelectorAll('button,.ww-hint,.ww-sub,.ww-top b,.ww-order,.ww-priv,.ww-news,.ww-win').forEach(e=>{if(!vis(e)||(ov&&!ov.contains(e)))return;const r=e.getBoundingClientRect();
 if(r.left<-1||r.right>W+1)out.push('超出畫面左右：'+(e.dataset.a||e.className||e.tagName)+' '+Math.round(r.left)+'~'+Math.round(r.right));
 if(e.tagName==='BUTTON'&&e.scrollWidth>e.clientWidth+2)out.push('按鈕文字被截斷：'+e.textContent.trim().slice(0,20));});
const av=[...root.querySelectorAll('.ww-av')].map(e=>e.getBoundingClientRect());
for(let i=0;i<av.length;i++)for(let j=i+1;j<av.length;j++){const a=av[i],b=av[j];const x=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left)),y=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));if(x*y>0.12*a.width*a.height)out.push('座位 '+(i+1)+' 和 '+(j+1)+' 重疊');}
av.forEach((r,i)=>{if(r.left<-2||r.right>W+2)out.push('座位 '+(i+1)+' 超出畫面');});
root.querySelectorAll('.ww-cc').forEach((c,k)=>{const r=c.getBoundingClientRect();av.forEach((a,i)=>{const x=Math.max(0,Math.min(a.right,r.right)-Math.max(a.left,r.left)),y=Math.max(0,Math.min(a.bottom,r.bottom)-Math.max(a.top,r.top));if(x*y>4)out.push('中間第 '+(k+1)+' 張牌和座位 '+(i+1)+' 重疊');});});
const nm=[...root.querySelectorAll('.ww-nm')].map(e=>e.getBoundingClientRect());
// 座位名字不能壓到別的座位頭像
nm.forEach((r,i)=>av.forEach((a,j)=>{if(i===j)return;const x=Math.max(0,Math.min(a.right,r.right)-Math.max(a.left,r.left)),y=Math.max(0,Math.min(a.bottom,r.bottom)-Math.max(a.top,r.top));if(x*y>0.15*r.width*r.height)out.push('座位 '+(i+1)+' 的名字壓到座位 '+(j+1));}));
return out;}"""
# 按鈕有沒有被別的東西蓋住（捲到畫面中間再檢查最上層的元素）
COVER = """async()=>{const out=[];if(document.querySelector('.gfx-ov'))return out;const bs=[...document.querySelectorAll('#game .ww .act-row .btn')].filter(b=>b.offsetParent&&!b.disabled);
for(const b of bs){if(!b.isConnected)continue;b.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,60));if(!b.isConnected)continue;const r=b.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;
 if(y<0||y>innerHeight){out.push('按鈕捲不到畫面裡：'+b.textContent.trim().slice(0,16));continue;}
 const e=document.elementFromPoint(x,y);if(!e||!(b===e||b.contains(e)))out.push('按鈕被擋住：'+b.textContent.trim().slice(0,16)+' ← '+(e?(e.id||e.className||e.tagName):'無'));
 if(r.height<34)out.push('按鈕太小（高 '+Math.round(r.height)+'px）：'+b.textContent.trim().slice(0,16));}
return out;}"""

PRIORITY = ['ready', 'wpick', 'guard', 'save', 'check', 'end', 'vote', 'badge', 'shoot', 'dirR', 'peek', 'see', 'rob', 'tm', 'drunk', 'early', 'skip']
ALT = ['wnone', 'gnone', 'wpass', 'abstain', 'skip', 'tear', 'dirL']

def serve():
  class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
  h = functools.partial(Q, directory=ROOT)
  srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), h); srv.daemon_threads = True
  threading.Thread(target=srv.serve_forever, daemon=True).start()
  return srv

async def click_a(pg, a):
  await pg.evaluate("(a)=>{const b=[...document.querySelectorAll('#game .ww [data-a]')].find(x=>x.dataset.a===a&&!x.disabled&&x.offsetParent);b&&b.click();}", a)

async def play_step(pg, gid, who, rnd, seen, dev, label, errs):
  s = await pg.evaluate(STATE, gid)
  if not s: return None
  key = f"{s['phase']}-{s['sub'] or ''}"
  # 第一次進到這個階段：檢查版面＋截圖
  if (who, key) not in seen:
    seen.add((who, key))
    probs = await pg.evaluate(LAYOUT)
    if not s['overlay']: probs += await pg.evaluate(COVER)
    for p in probs: fail(f'{dev}／{label}／{who}／{key}：{p}')
    # 版面也要檢查直向：圓環不能被下方工具列蓋住（#stage 是遊戲區）
    vp = await pg.evaluate("()=>{const st=document.getElementById('stage').getBoundingClientRect();const o=[];document.querySelectorAll('#game .ww-av').forEach((e,i)=>{const r=e.getBoundingClientRect();if(r.bottom>st.bottom+2&&document.getElementById('stage').scrollHeight<=document.getElementById('stage').clientHeight+2)o.push('座位 '+(i+1)+' 被下方工具列蓋住');});return o;}")
    for p in vp: fail(f'{dev}／{label}／{who}／{key}：{p}')
    if who == '房主' or s['phase'] in ('night', 'deal', 'over', 'vote'):
      for _ in range(14):
        if not await pg.evaluate("!!document.getElementById('wwCurtain')"): break
        await pg.wait_for_timeout(200)
      await pg.evaluate('window.scrollTo(0,0);document.querySelector("#stage")&&(document.querySelector("#stage").scrollTop=0)')
      await pg.screenshot(path=f'{SHOTS}/{dev}/{label}-{who}-{key}.png')
    if s['phase'] in ('speech', 'espeech', 'pkspeech', 'lw', 'night') and not s['floor']: fail(f'{dev}／{label}／{key}：發言權（靜音控制）沒有啟動')
  if s['overlay']:
    # 說明視窗：每個分頁都點一次，再關掉
    if ('help', who) not in seen:
      seen.add(('help', who))
      tabs = await pg.eval_on_selector_all('.ww-tabs button', 'bs=>bs.map(b=>b.textContent)')
      for i, t in enumerate(tabs):
        await pg.evaluate(f"document.querySelectorAll('.ww-tabs button')[{i}].click()"); await pg.wait_for_timeout(120)
        probs = await pg.evaluate("()=>{const b=document.querySelector('.ww-sheet');const r=b.getBoundingClientRect();const o=[];if(r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||r.top<0)o.push('說明視窗超出畫面');const t=document.querySelector('.ww-sheet-b');if(t.innerText.trim().length<20)o.push('說明內容是空的');return o;}")
        for p in probs: fail(f'{dev}／{label}／{who}／說明「{t}」：{p}')
        if i == 1 and who == '房主': await pg.screenshot(path=f'{SHOTS}/{dev}/{label}-說明-{t}.png')
    await pg.evaluate("document.querySelector('.ww-over button[data-close]').click()"); await pg.wait_for_timeout(150)
    return s
  if s['over']: return s
  avail = {b['a'] for b in s['btns'] if not b['dis']}
  if s['phase'] == 'deal' and 'ready' in avail:
    # 按住看身分：按下去要翻開、放開要蓋回去
    box = await pg.query_selector('[data-peek]')
    if box:
      bb = await box.bounding_box()
      await pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); await pg.mouse.down(); await pg.wait_for_timeout(250)
      on = await pg.evaluate("!!document.querySelector('.ww-rolechip.peek')")
      if ('peekshot', who) not in seen and on: seen.add(('peekshot', who)); await pg.screenshot(path=f'{SHOTS}/{dev}/{label}-{who}-按住看身分.png')
      await pg.mouse.up(); await pg.wait_for_timeout(200)
      off = await pg.evaluate("!document.querySelector('.ww-rolechip.peek')")
      if not on: fail(f'{dev}／{label}／{who}：按住身分牌沒有翻開')
      if not off: fail(f'{dev}／{label}／{who}：放開後身分牌沒有蓋回去')
    await click_a(pg, 'ready'); return s
  if 'eyes' in avail and rnd.random() < 0.5: await click_a(pg, 'eyes')
  if s['phase'] == 'signup' and 'run' in avail and ('run', who) not in seen:
    seen.add(('run', who))
    if rnd.random() < 0.6: await click_a(pg, 'run')
    return s
  # 長按座位做記號（每個分頁一次）
  if ('note', who) not in seen and s['phase'] not in ('deal',) and not s['pick']:
    seen.add(('note', who))
    el = await pg.query_selector('.ww-seat[data-seat="0"]')
    if el:
      bb = await el.bounding_box(); await pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + 10); await pg.mouse.down(); await pg.wait_for_timeout(700); await pg.mouse.up(); await pg.wait_for_timeout(200)
      has = await pg.evaluate("!!document.querySelector('[data-note=\"wolf\"]')")
      if not has: fail(f'{dev}／{label}／{who}：長按座位沒有出現記號選單')
      else:
        await pg.evaluate("document.querySelector('[data-note=\"wolf\"]').click()"); await pg.wait_for_timeout(200)
        if not await pg.evaluate("!!document.querySelector('.ww-seat[data-seat=\"0\"] .ww-note.n-wolf')"): fail(f'{dev}／{label}／{who}：記號沒有顯示在座位上')
  # 點座位／中間的牌
  if s['pick'] and not s['sel'] and rnd.random() < 0.9:
    t = rnd.choice(s['pick']); await pg.click(f'.ww-seat[data-seat="{t}"]'); await pg.wait_for_timeout(120)
    if s['sub'] == 'troublemaker' or (gid == 'onenight' and s['phase'] == 'night' and 'tm' in avail):
      rest = [x for x in s['pick'] if x != t]
      if rest: await pg.click(f'.ww-seat[data-seat="{rnd.choice(rest)}"]'); await pg.wait_for_timeout(120)
    s2 = await pg.evaluate(STATE, gid)
    if s2 and s2['turnId'] == s['turnId'] and not s2['sel']: fail(f'{dev}／{label}／{who}：點了可以選的座位卻沒有選起來（{key}）')
    s = s2 or s; avail = {b['a'] for b in s['btns'] if not b['dis']}
  elif s['cpick'] and not s['csel'] and not s['pick']:
    n = 2 if 'see' in avail else 1
    for c in rnd.sample(s['cpick'], min(n, len(s['cpick']))): await pg.click(f'.ww-cc[data-c="{c}"]'); await pg.wait_for_timeout(100)
    s = await pg.evaluate(STATE, gid) or s; avail = {b['a'] for b in s['btns'] if not b['dis']}
  if rnd.random() < 0.15:
    for a in ALT:
      if a in avail: await click_a(pg, a); return s
  for a in PRIORITY:
    if a in avail: await click_a(pg, a); return s
  return s

async def run_game(br, dev, w, h, mobile, ua, gid, n, opts, port):
  label = f"{'經典' if gid == 'werewolf' else '一夜'}{n}人" + ('-' + '-'.join(f'{k}{v}' for k, v in opts.items()) if opts else '')
  print(f'== {dev} {w}×{h}：{label}')
  kw = dict(viewport={'width': w, 'height': h}, device_scale_factor=2 if mobile else 1)
  if mobile: kw.update(is_mobile=True, has_touch=True)
  if ua: kw['user_agent'] = ua
  ctx = await br.new_context(**kw)
  errs = []
  host = await ctx.new_page(); guest = await ctx.new_page()
  for who, pg in (('房主', host), ('玩家', guest)):
    pg.on('pageerror', lambda e, w=who: errs.append(f'{w} 頁面錯誤：{e}'))
    pg.on('console', lambda m, w=who: errs.append(f'{w} console：{m.text}') if m.type == 'error' and '404' not in m.text and 'favicon' not in m.text and 'ERR_' not in m.text else None)
    pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
  url = f'http://127.0.0.1:{port}/?local=1'
  await host.goto(url); await host.fill('#nameInput', '房主'); await host.fill('#pinInput', '777777'); await host.click('#joinBtn'); await host.wait_for_timeout(1500)
  await guest.goto(url); await guest.fill('#nameInput', '小美'); await guest.fill('#pinInput', '777777'); await guest.click('#joinBtn'); await guest.wait_for_timeout(1500)
  await host.evaluate(f"document.querySelector('[data-g=\"{gid}\"]').click()"); await host.wait_for_timeout(500)
  # 大廳：人數不符時開始鍵要鎖住
  for k, v in opts.items(): await host.select_option(f'select[data-opt="{k}"]', v); await host.wait_for_timeout(200)
  for i in range(n - 2): await host.evaluate("document.querySelector('#addBot').click()"); await host.wait_for_timeout(300)
  if gid == 'werewolf':
    # 先多加一個確認 7／11 人時開始鍵是鎖住的（只在 6 人局測）
    if n == 6:
      await host.evaluate("document.querySelector('#addBot').click()"); await host.wait_for_timeout(400)
      dis = await host.evaluate("document.querySelector('#startBtn').disabled")
      if not dis: fail(f'{dev}／{label}：7 人時開始鍵沒有鎖住')
      bots = await host.evaluate("window.Room.room.members.filter(m=>m.bot).map(m=>m.cid)")
      await host.evaluate("document.querySelector('#clearBot').click()"); await host.wait_for_timeout(400)
      for i in range(n - 2): await host.evaluate("document.querySelector('#addBot').click()"); await host.wait_for_timeout(300)
  cnt = await host.evaluate("window.Room.room.members.filter(m=>m.role==='player'&&m.online).length")
  if cnt != n: fail(f'{dev}／{label}：玩家人數 {cnt} 不是 {n}')
  await host.screenshot(path=f'{SHOTS}/{dev}/{label}-大廳.png')
  lp = await host.evaluate("[...document.querySelectorAll('#lobby button,#lobby select,#lobby p')].filter(e=>e.offsetParent&&(e.getBoundingClientRect().right>innerWidth+1)).map(e=>e.textContent.slice(0,20))")
  for p in lp: fail(f'{dev}／{label}：大廳元素超出畫面：{p}')
  await host.evaluate(FAST)
  await host.evaluate("document.querySelector('#startBtn').click()"); await host.wait_for_timeout(1500)
  started = await host.evaluate("!!(window.Room.room&&window.Room.room.game)")
  if not started:
    fail(f'{dev}／{label}：沒有開始遊戲'); await ctx.close(); return
  rnd = random.Random(hash((dev, label)) & 0xffff)
  seen = set(); t0 = time.time(); last = None; stuck = 0
  while time.time() - t0 < 420:
    sh = await play_step(host, gid, '房主', rnd, seen, dev, label, errs)
    sg = await play_step(guest, gid, '玩家', rnd, seen, dev, label, errs)
    if sh and sg and sh['over'] and sg['over']: break
    k = (sh and sh['turnId'], sg and sg['turnId'])
    if k == last: stuck += 1
    else: stuck = 0; last = k
    if stuck > 150: fail(f'{dev}／{label}：畫面卡住超過 45 秒（{sh and sh["phase"]}）'); break
    await host.wait_for_timeout(300)
  else: fail(f'{dev}／{label}：7 分鐘內沒有玩完')
  # 結算畫面
  for who, pg in (('房主', host), ('玩家', guest)):
    s = await pg.evaluate(STATE, gid)
    if s and s['over']:
      if not s['win']: fail(f'{dev}／{label}／{who}：結算沒有顯示勝負')
      if 'again' not in {b['a'] for b in s['btns']}: fail(f'{dev}／{label}／{who}：結算沒有「再來一局」')
      await pg.wait_for_timeout(2500)  # 等勝利／失敗動畫播完
      await pg.evaluate("document.querySelectorAll('.gfx-ov').forEach(e=>e.remove())")
      probs = await pg.evaluate(LAYOUT)
      for p in probs: fail(f'{dev}／{label}／{who}／結算：{p}')
      await pg.screenshot(path=f'{SHOTS}/{dev}/{label}-{who}-結算.png', full_page=True)
  # 再來一局：要重新發身分
  await click_a(host, 'again'); await host.wait_for_timeout(1500)
  s = await host.evaluate(STATE, gid)
  if not s or s['phase'] != 'deal': fail(f'{dev}／{label}：按「再來一局」沒有重新發身分（{s and s["phase"]}）')
  print(f'  {"✓" if not errs else "❌"} 玩完一局 {int(time.time() - t0)} 秒，檢查過 {len([x for x in seen if isinstance(x, tuple) and len(x) == 2 and x[0] in ("房主", "玩家")])} 個畫面')
  for e in errs: fail(f'{dev}／{label}：{e}')
  await ctx.close()

async def main():
  names = sys.argv[1:]
  srv = serve(); port = srv.server_address[1]
  async with async_playwright() as p:
    br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
    for dev, w, h, mobile, ua, games in DEVICES:
      if names and dev not in names: continue
      os.makedirs(f'{SHOTS}/{dev}', exist_ok=True)
      for gid, n, opts in games: await run_game(br, dev, w, h, mobile, ua, gid, n, opts, port)
    await br.close()
  srv.shutdown()
  print('\n' + ('✅ 狼人殺畫面測試全部通過' if not FAILS else f'共 {len(FAILS)} 個問題'))
  sys.exit(1 if FAILS else 0)
asyncio.run(main())
