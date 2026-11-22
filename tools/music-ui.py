# 音樂遊戲畫面測試（需要 Python playwright＋Chrome）：python3 tools/music-ui.py [裝置名稱...]
# 自己開本機伺服器。每種裝置尺寸：房主＋一般玩家兩個分頁（?local=1）進測試房 777777＋電腦玩家，用點畫面的方式玩完整局：
#   誰是走音臥底：按住看歌（放開要蓋回去）、哼完、檢舉、投票、猜歌、題庫回饋
#   音樂版你畫我猜：選題、按錄音、實際按鍵盤和打擊墊、送出、作答
# 每個新階段檢查：橫向捲動、元素超出畫面、按鈕文字截斷、按鈕被擋住或太小、鍵盤按鍵太窄、發言權（靜音）有沒有啟動、頁面錯誤
# 截圖存到 /tmp/music-shots/<裝置>/。沒有 WebKit，iPhone 是用 Chrome 模擬尺寸與 UA
import asyncio, sys, os, random, threading, functools, http.server, socketserver, time
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = '/tmp/music-shots'
IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
AND = 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
DEVICES = [
  ('iPhone SE', 375, 667, True, IOS, [('humspy', 5, {}), ('melody', 3, {})]),
  ('iPhone 15', 393, 852, True, IOS, [('humspy', 4, {'mode': 'blank'}), ('melody', 4, {'qtype': 'song'})]),
  ('iPhone Pro Max', 430, 932, True, IOS, [('humspy', 7, {}), ('melody', 3, {'qtype': 'scene'})]),
  ('Samsung S', 360, 780, True, AND, [('humspy', 6, {'diff': 'h'}), ('melody', 5, {})]),
  ('Samsung A', 412, 915, True, AND, [('humspy', 5, {}), ('melody', 3, {})]),
  ('手機橫放', 852, 393, True, IOS, [('humspy', 4, {}), ('melody', 3, {})]),
  ('iPad', 820, 1180, True, IPAD, [('humspy', 8, {}), ('melody', 4, {})]),
  ('筆電', 1366, 768, False, None, [('humspy', 5, {}), ('melody', 3, {})]),
  ('桌機', 1920, 1080, False, None, [('humspy', 10, {}), ('melody', 6, {})]),
]
FAILS = []
def fail(msg):
  FAILS.append(msg); print('  ❌', msg)

FAST = """(()=>{Object.assign(GAMES.humspy.T,{look:6000,prep:800,vote:9000,guess:6000,show:1500,end:4000});Object.assign(GAMES.melody.T,{choose:6000,compose:25000,guess:9000,show:2500});})()"""
STATE = """(id)=>{const root=document.querySelector('#game .'+(id==='humspy'?'hs':'ml'));if(!root)return null;
const q=(s)=>[...root.querySelectorAll(s)].filter(e=>e.offsetParent);
const v=window.__lastV||{};
return {phase:v.phase,turnId:v.turnId,seat:v.seat,floor:document.body.classList.contains('floor-mode'),
 a:q('[data-a]').filter(b=>!b.disabled).map(b=>b.dataset.a),t:q('[data-t]').filter(b=>!b.disabled).map(b=>+b.dataset.t),
 g:q('[data-g]').length,fb:q('[data-fb]').length,hold:q('[data-hold]').length,c:q('[data-c]').length,o:q('[data-o]').filter(b=>!b.disabled).length,
 kb:q('.mk').length,r:q('[data-r]').filter(b=>!b.disabled).map(b=>b.dataset.r)}}"""
LAYOUT = """(cls)=>{const out=[];const W=innerWidth;const de=document.documentElement;
if(de.scrollWidth>W+1)out.push('整頁可以橫向捲動（'+de.scrollWidth+'>'+W+'）');
const root=document.querySelector('#game .'+cls);if(!root)return ['找不到遊戲畫面'];
const vis=(e)=>{const r=e.getBoundingClientRect();return e.offsetParent&&r.width>0&&r.height>0;};
root.querySelectorAll('button,h3,p,.hs-card,.ml-q,.mk-keys').forEach(e=>{if(!vis(e))return;const r=e.getBoundingClientRect();
 if(r.left<-1||r.right>W+1)out.push('超出畫面左右：'+(e.dataset.a||e.className||e.tagName)+' '+Math.round(r.left)+'~'+Math.round(r.right));
 if(e.tagName==='BUTTON'&&e.scrollWidth>e.clientWidth+2&&!e.closest('.players-row'))out.push('按鈕文字被截斷：'+e.textContent.trim().slice(0,20));});
root.querySelectorAll('.mk-keys .w').forEach((k,i)=>{const r=k.getBoundingClientRect();if(r.width<40)out.push('鍵盤白鍵太窄（'+Math.round(r.width)+'px）');});
root.querySelectorAll('.mk-keys .b').forEach((k,i)=>{const r=k.getBoundingClientRect();if(r.width<26)out.push('鍵盤黑鍵太窄（'+Math.round(r.width)+'px）');});
return [...new Set(out)];}"""
COVER = """async(cls)=>{const out=[];if(document.querySelector('.gfx-ov'))return out;const bs=[...document.querySelectorAll('#game .'+cls+' .btn.big, #game .'+cls+' .mk-drums button, #game .'+cls+' [data-r]')].filter(b=>b.offsetParent&&!b.disabled);
for(const b of bs){if(!b.isConnected)continue;b.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,60));if(!b.isConnected)continue;const r=b.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;
 if(y<0||y>innerHeight){out.push('按鈕捲不到畫面裡：'+b.textContent.trim().slice(0,16));continue;}
 const e=document.elementFromPoint(x,y);if(!e||!(b===e||b.contains(e)))out.push('按鈕被擋住：'+b.textContent.trim().slice(0,16)+' ← '+(e?(e.id||e.className||e.tagName):'無'));
 if(r.height<34)out.push('按鈕太小（高 '+Math.round(r.height)+'px）：'+b.textContent.trim().slice(0,16));}
return out;}"""
HOOK = """(()=>{for(const id of ['humspy','melody']){const M=GAMES[id];if(M.__hooked)continue;M.__hooked=1;const r=M.render;M.render=function(el,v,ui){window.__lastV=v;return r.call(this,el,v,ui);};}})()"""

def serve():
  class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
  srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
  threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv

async def click(pg, sel):
  await pg.evaluate("(s)=>{const b=[...document.querySelectorAll(s)].find(x=>!x.disabled&&x.offsetParent);b&&b.click();}", sel)

async def press(pg, sel, ms=180):
  el = await pg.query_selector(sel)
  if not el: return False
  await el.scroll_into_view_if_needed(); bb = await el.bounding_box()
  if not bb: return False
  await pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] * 0.8); await pg.mouse.down(); await pg.wait_for_timeout(ms); await pg.mouse.up()
  return True

async def step(pg, gid, who, rnd, seen, dev, label):
  s = await pg.evaluate(STATE, gid)
  if not s or not s['phase']: return None
  cls = 'hs' if gid == 'humspy' else 'ml'
  key = s['phase'] + ('-我' if (gid == 'humspy' and s['phase'] == 'hum' and 'done' in s['a']) or (gid == 'melody' and (s['c'] or s['kb'])) else '')
  if (who, key) not in seen:
    seen.add((who, key))
    await pg.wait_for_timeout(150)
    for p in await pg.evaluate(LAYOUT, cls): fail(f'{dev}／{label}／{who}／{key}：{p}')
    for p in await pg.evaluate(COVER, cls): fail(f'{dev}／{label}／{who}／{key}：{p}')
    await pg.evaluate('window.scrollTo(0,0);document.querySelector("#stage")&&(document.querySelector("#stage").scrollTop=0)')
    await pg.screenshot(path=f'{SHOTS}/{dev}/{label}-{who}-{key}.png')
    if gid == 'humspy' and s['phase'] == 'hum' and not s['floor']: fail(f'{dev}／{label}／{who}：哼歌時發言權（靜音）沒有啟動')
    if gid == 'melody' and s['phase'] == 'guess' and not s['floor']: fail(f'{dev}／{label}／{who}：猜題時全員靜音沒有啟動')
    if gid == 'humspy' and s['phase'] in ('vote', 'end', 'look') and s['floor']: fail(f'{dev}／{label}／{who}：{key} 不該靜音')
  ph = s['phase']
  if gid == 'humspy':
    if ph == 'look':
      if s['hold'] and ('hold', who) not in seen:
        seen.add(('hold', who)); bb = None
        for _ in range(8):  # 別人按「看好了」會重畫畫面，卡片元素會換掉：重試到抓穩為止
          try:
            await pg.evaluate("document.querySelector('[data-hold]').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(120)
            bb = await pg.locator('[data-hold]').bounding_box(timeout=1500)
            if bb: break
          except Exception: await pg.wait_for_timeout(200)
        if not bb: fail(f'{dev}／{label}／{who}：找不到歌曲卡片'); return s
        on = False
        for _ in range(4):  # 按下前再量一次位置（畫面可能剛重畫、位置變了）；沒按在卡片上就放開重按
          bb = await pg.locator('[data-hold]').bounding_box(timeout=1500)
          x, y = bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2
          await pg.mouse.move(x, y); await pg.mouse.down(); await pg.wait_for_timeout(250)
          on = await pg.evaluate("!!document.querySelector('[data-hold].show')")
          if on or not await pg.evaluate("(([x,y])=>!document.elementFromPoint(x,y)?.closest('[data-hold]'))", [x, y]): break
          await pg.mouse.up(); await pg.wait_for_timeout(150)
        if on: await pg.screenshot(path=f'{SHOTS}/{dev}/{label}-{who}-按住看歌.png')
        await pg.mouse.up(); await pg.wait_for_timeout(150)
        off = await pg.evaluate("!document.querySelector('[data-hold].show')")
        if not on:
          hit = await pg.evaluate("(([x,y])=>{const e=document.elementFromPoint(x,y);return e?(e.id||e.className||e.tagName)+' | '+(e.closest('[data-hold]')?'在卡片上':'不在卡片上'):'無'})", [bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2])
          fail(f'{dev}／{label}／{who}：按住卡片沒有顯示歌名（按到：{hit}）')
        if not off: fail(f'{dev}／{label}／{who}：放開後歌名沒有蓋回去')
      if 'seen' in s['a']: await click(pg, '#game [data-a="seen"]')
    elif ph == 'hum':
      if 'done' in s['a']: await pg.wait_for_timeout(900); await click(pg, '#game [data-a="done"]')
      elif 'report' in s['a'] and rnd.random() < 0.3: await click(pg, '#game [data-a="report"]')
    elif ph == 'vote' and s['t'] and 'vote' not in s['a']:
      t = rnd.choice(s['t']); await pg.click(f'#game [data-t="{t}"]'); await pg.wait_for_timeout(120); await click(pg, '#game [data-a="vote"]')
    elif ph == 'guess' and s['g']:
      await pg.wait_for_timeout(400); await click(pg, '#game [data-g]')
    elif ph == 'end':
      if s['fb'] and ('fb', who) not in seen: seen.add(('fb', who)); await click(pg, '#game [data-fb="close"]')
      if 'next' in s['a'] and rnd.random() < 0.3: await click(pg, '#game [data-a="next"]')
  else:
    if ph == 'choose' and s['c']: await pg.wait_for_timeout(300); await click(pg, '#game [data-c]')
    elif ph == 'compose' and s['kb']:
      # 實際按鍵盤錄一段：錄音 → 按 6 個音＋2 個鼓 → 檢查狀態 → 送出
      await click(pg, '#game [data-r="rec"]'); await pg.wait_for_timeout(150)
      keys = await pg.evaluate("[...document.querySelectorAll('#game .mk-keys [data-s]')].length")
      for i in range(6): await press(pg, f'#game .mk-keys .w:nth-child({1 + rnd.randrange(7)})', 150)
      await press(pg, '#game .mk-keys .b', 150)
      await press(pg, '#game .mk-drums [data-d="0"]', 80); await press(pg, '#game .mk-drums [data-d="2"]', 80)
      await pg.evaluate("document.querySelectorAll('#game [data-oct]')[2].click()"); await press(pg, '#game .mk-keys .w', 150)
      await pg.wait_for_timeout(300)
      st = await pg.evaluate("document.querySelector('#game .ml-status').textContent")
      if '錄音中' not in st and '已錄' not in st: fail(f'{dev}／{label}／{who}：按了鍵盤沒有錄到音（{st}）')
      if keys != 12: fail(f'{dev}／{label}／{who}：鍵盤按鍵數量不對 {keys}')
      await pg.screenshot(path=f'{SHOTS}/{dev}/{label}-{who}-錄音中.png')
      await click(pg, '#game [data-r="stop"]'); await pg.wait_for_timeout(150)
      st = await pg.evaluate("document.querySelector('#game .ml-status').textContent")
      if '已錄 10 個音' not in st: fail(f'{dev}／{label}／{who}：錄到的音數不對（{st}）')
      await click(pg, '#game [data-r="send"]')
    elif ph == 'guess' and s['o']:
      await pg.wait_for_timeout(500); await click(pg, '#game [data-o]')
    elif ph == 'reveal' and 'next' in s['a'] and rnd.random() < 0.3: await click(pg, '#game [data-a="next"]')
  return s

async def run_game(br, dev, w, h, mobile, ua, gid, n, opts, port):
  label = ('走音臥底' if gid == 'humspy' else '音樂你畫我猜') + f'{n}人' + ('-' + '-'.join(f'{k}{v}' for k, v in opts.items()) if opts else '')
  print(f'== {dev} {w}×{h}：{label}')
  kw = dict(viewport={'width': w, 'height': h}, device_scale_factor=2 if mobile else 1)
  if mobile: kw.update(is_mobile=True, has_touch=True)
  if ua: kw['user_agent'] = ua
  ctx = await br.new_context(**kw); errs = []
  host = await ctx.new_page(); guest = await ctx.new_page()
  for who, pg in (('房主', host), ('玩家', guest)):
    pg.on('pageerror', lambda e, w=who: errs.append(f'{w} 頁面錯誤：{e}'))
    pg.on('console', lambda m, w=who: errs.append(f'{w} console：{m.text}') if m.type == 'error' and '404' not in m.text and 'favicon' not in m.text and 'ERR_' not in m.text else None)
    pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
  url = f'http://127.0.0.1:{port}/?local=1'
  await host.goto(url); await host.fill('#nameInput', '房主'); await host.fill('#pinInput', '777777'); await host.click('#joinBtn'); await host.wait_for_timeout(1500)
  await guest.goto(url); await guest.fill('#nameInput', '超級無敵長的名字一二三'); await guest.fill('#pinInput', '777777'); await guest.click('#joinBtn'); await guest.wait_for_timeout(1500)
  for pg in (host, guest): await pg.evaluate(HOOK)
  await host.evaluate(f"document.querySelector('[data-g=\"{gid}\"]').click()"); await host.wait_for_timeout(500)
  for k, v in opts.items(): await host.select_option(f'select[data-opt="{k}"]', v); await host.wait_for_timeout(200)
  for i in range(n - 2): await host.evaluate("document.querySelector('#addBot').click()"); await host.wait_for_timeout(300)
  await host.screenshot(path=f'{SHOTS}/{dev}/{label}-大廳.png')
  lp = await host.evaluate("[...document.querySelectorAll('#lobby button,#lobby select,#lobby p')].filter(e=>e.offsetParent&&(e.getBoundingClientRect().right>innerWidth+1)).map(e=>e.textContent.slice(0,20))")
  for p in lp: fail(f'{dev}／{label}：大廳元素超出畫面：{p}')
  await host.evaluate(FAST)
  await host.evaluate("document.querySelector('#startBtn').click()"); await host.wait_for_timeout(1500)
  if not await host.evaluate("!!(window.Room.room&&window.Room.room.game)"): fail(f'{dev}／{label}：沒有開始遊戲'); await ctx.close(); return
  # 走音臥底：目標分數改成 2（玩兩回合左右，測到「下一回合」又不會太久）
  if gid == 'humspy': await host.evaluate("window.Host.game.state.target=2")
  rnd = random.Random(hash((dev, label)) & 0xffff); seen = set(); t0 = time.time(); last = None; stuck = 0
  while time.time() - t0 < 480:
    sh = await step(host, gid, '房主', rnd, seen, dev, label)
    sg = await step(guest, gid, '玩家', rnd, seen, dev, label)
    if sh and sg and sh['phase'] == 'over' and sg['phase'] == 'over': break
    k = (sh and sh['turnId'], sg and sg['turnId'])
    if k == last: stuck += 1
    else: stuck = 0; last = k
    if stuck > 200: fail(f'{dev}／{label}：畫面卡住（{sh and sh["phase"]}）'); break
    await host.wait_for_timeout(250)
  else: fail(f'{dev}／{label}：8 分鐘內沒有玩完')
  for who, pg in (('房主', host), ('玩家', guest)):
    await pg.wait_for_timeout(800)
    cls = 'hs' if gid == 'humspy' else 'ml'
    for p in await pg.evaluate(LAYOUT, cls): fail(f'{dev}／{label}／{who}／結算：{p}')
    await pg.screenshot(path=f'{SHOTS}/{dev}/{label}-{who}-結算.png', full_page=True)
  print(f'  {"✓" if not errs else "❌"} 玩完一局 {int(time.time() - t0)} 秒，檢查過 {len([x for x in seen if x[0] in ("房主", "玩家")])} 個畫面')
  for e in errs: fail(f'{dev}／{label}：{e}')
  await ctx.close()

async def main():
  names = sys.argv[1:]; srv = serve(); port = srv.server_address[1]
  async with async_playwright() as p:
    br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
    for dev, w, h, mobile, ua, games in DEVICES:
      if names and dev not in names: continue
      os.makedirs(f'{SHOTS}/{dev}', exist_ok=True)
      for gid, n, opts in games: await run_game(br, dev, w, h, mobile, ua, gid, n, opts, port)
    await br.close()
  srv.shutdown()
  print('\n' + ('✅ 音樂遊戲畫面測試全部通過' if not FAILS else f'共 {len(FAILS)} 個問題'))
  sys.exit(1 if FAILS else 0)
asyncio.run(main())
