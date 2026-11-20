# 大富翁畫面煙霧測試（需要 Python playwright＋Chrome）：python3 tools/ui-smoke.py [設定名稱...]
# 先在 repo 根目錄開 `python3 -m http.server 8123`
# 每種設定：房主＋一般玩家兩個分頁（?local=1）進測試房 777777＋1 個電腦，開局後先託管跑幾回合，
# 再關掉託管，等輪到自己時檢查 🧪 畫面（擲骰 1／2 顆、危險預覽）真的出現、真的能用；全部開時再測一般玩家端的危機處理畫面
# 全程收集頁面錯誤，有任何錯誤或檢查不過就失敗
import asyncio, sys, json
from playwright.async_api import async_playwright
URL = 'http://localhost:8123/?local=1'
CONFIGS = {
  '正式規則': {},
  '只開擲骰': {'bDice': '1'},
  '只開預覽': {'bPreview': '1'},
  '全部開': {'bCardAmt': '1', 'bCardTier': '1', 'bRescue': '1', 'bDice': '1', 'bPreview': '1'},
}
STATE = "(()=>{const M=window.GAMES.monopoly,v=M.v;if(!v)return null;const bar=document.querySelector('.risk-bar'),R=window.Room,me=R.room&&R.room.members.find(m=>m.cid===R.cid);return {auto:!!(me&&me.auto),go:!document.querySelector('.go-btn').disabled,round:v.round,turn:v.turn,seat:v.seat,phase:v.phase,can:M.canAct('roll'),bar:!!bar,pick:!!(bar&&bar.querySelector('[data-one]')),rows:!!(bar&&(bar.querySelector('.rb-rows,.rb-sum,.rb-s'))),txt:bar?bar.innerText:''}})()"
FAILS = []
def fail(msg): FAILS.append(msg); print('  ❌', msg)

async def pick_char(pg):
  for i in range(12):
    ph = await pg.evaluate("(()=>{const v=window.GAMES.monopoly.v;return v?v.phase:null})()")
    if ph and ph != 'pick': return
    await pg.evaluate("(()=>{const b=document.querySelector('.mono-pick button:not([disabled])'); b&&b.click();})()"); await pg.wait_for_timeout(400)
    await pg.evaluate("(()=>{const b=document.querySelector('.mono-pick [data-go], .mono-pick .btn.big'); b&&b.click();})()"); await pg.wait_for_timeout(700)

async def pilot(pg, on):
  cur = await pg.evaluate("(()=>{const b=document.querySelector('#pilotBtn');return b?b.classList.contains('on'):null})()")
  if cur is None: fail('找不到託管按鈕'); return
  if bool(cur) != on: await pg.evaluate("document.querySelector('#pilotBtn').click()"); await pg.wait_for_timeout(300)

async def check_roll(pg, who, cfg):
  # 等輪到自己而且可以擲
  s = None
  for i in range(240):
    await pg.wait_for_timeout(500)
    s = await pg.evaluate(STATE)
    if s and not s['auto'] and s['turn'] == s['seat'] and s['phase'] == 'roll' and s['can']: break
  else: fail(f'{who}：等不到自己擲骰'); return
  await pg.wait_for_timeout(600); s = await pg.evaluate(STATE)
  if not (s['turn'] == s['seat'] and s['phase'] == 'roll'): fail(f'{who}：輪到自己 0.6 秒後就被別人動了 {s}'); return
  want_bar = cfg.get('bDice') == '1' or cfg.get('bPreview') == '1'
  if want_bar != s['bar']: fail(f"{who}：擲骰面板應該{'出現' if want_bar else '不出現'}，實際 {s['bar']}（{s}）")
  if cfg.get('bDice') == '1' and not s['pick']: fail(f'{who}：開了擲骰選擇卻沒有 1／2 顆按鈕')
  if cfg.get('bDice') != '1' and s['pick']: fail(f'{who}：沒開擲骰選擇卻出現 1／2 顆按鈕')
  if cfg.get('bPreview') == '1' and not s['rows']: fail(f'{who}：開了危險預覽卻沒有預覽內容')
  if cfg.get('bDice') == '1':
    await pg.evaluate("document.querySelector('.risk-bar [data-one=\"1\"]').click()"); await pg.wait_for_timeout(300)
    on1 = await pg.evaluate("document.querySelector('.risk-bar [data-one=\"1\"]').classList.contains('on')")
    if not on1: fail(f'{who}：按了 1 顆沒有被選起來')
    await pg.evaluate("document.querySelector('.go-btn').click()"); await pg.wait_for_timeout(1800)
    faces = await pg.eval_on_selector_all('.d6', 'els=>els.map(e=>e.style.visibility)')
    if faces[1] != 'hidden': fail(f'{who}：選 1 顆擲骰，卻還是顯示 2 顆（{faces}）')
    else: print(f'  ✓ {who}：1 顆骰子可以選、擲出來只有 1 顆')
  else:
    await pg.evaluate("document.querySelector('.go-btn').click()"); await pg.wait_for_timeout(1500)
  print(f"  ✓ {who}：擲骰面板 {'有' if s['bar'] else '無'}（{s['txt'][:40].replace(chr(10),' ')}…）" if s['bar'] else f'  ✓ {who}：沒有 🧪 面板（正確）')

async def run(name, cfg, br):
  print('==', name, cfg)
  ctx = await br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
  errs = []
  host = await ctx.new_page(); guest = await ctx.new_page()
  for who, pg in (('房主', host), ('玩家', guest)):
    pg.on('pageerror', lambda e, w=who: errs.append(f'{w} 頁面錯誤：{e}'))
    pg.on('console', lambda m, w=who: errs.append(f'{w} console：{m.text}') if m.type == 'error' and '404' not in m.text and 'favicon' not in m.text else None)
  await host.goto(URL); await host.fill('#nameInput', '房主'); await host.fill('#pinInput', '777777'); await host.click('#joinBtn'); await host.wait_for_timeout(1500)
  await guest.goto(URL); await guest.fill('#nameInput', '玩家'); await guest.fill('#pinInput', '777777'); await guest.click('#joinBtn'); await guest.wait_for_timeout(1500)
  await host.click('[data-g="monopoly"]'); await host.wait_for_timeout(400)
  for k, v in cfg.items(): await host.select_option(f'select[data-opt="{k}"]', v); await host.wait_for_timeout(200)
  await host.click('#addBot'); await host.wait_for_timeout(400)
  await host.evaluate("document.querySelector('#startBtn').click()"); await host.wait_for_timeout(2500)
  bal = await host.evaluate("JSON.stringify(window.Host.game.state.bal||null)")
  print('  規則開關', bal)
  exp = {'bCardAmt': 'cardAmt', 'bCardTier': 'eggPity', 'bRescue': 'rescue', 'bDice': 'diceChoice', 'bPreview': 'preview'}
  b = json.loads(bal) or {}
  for k in cfg:
    if not b.get(exp[k]): fail(f'{name}：選了 {k} 但規則沒開 {exp[k]}')
  if not cfg and b: fail(f'{name}：沒選卻有開關 {b}')
  await pick_char(host); await pick_char(guest)
  # 先託管跑幾回合，讓場上有地、有危險
  await pilot(host, True); await pilot(guest, True)
  for i in range(240):
    await host.wait_for_timeout(500)
    r = await host.evaluate("window.Host.game.state.round")
    if r >= 4: break
  await pilot(guest, False); await check_roll(guest, f'{name}／一般玩家', cfg); await pilot(guest, True)
  await pilot(host, False); await check_roll(host, f'{name}／房主', cfg); await pilot(host, True)
  if cfg.get('bRescue') == '1':
    # 一般玩家端的危機處理：在房主的局面直接造一次危機給一般玩家，從一般玩家的畫面選「負債」
    gseat = await host.evaluate("window.Host.game.seats.findIndex((c,i)=>window.Host.game.state.players[i]&&window.Host.game.state.players[i].alive&&i!==0&&!(window.Host.game.state.players[i].bot))")
    await pilot(guest, False); await host.wait_for_timeout(500)
    ok = await host.evaluate("""(()=>{const H=window.Host,st=H.game.state,R=window.MONO_RULES;const s=H.game.seats.length>1?1:0;const p=st.players[s];if(!p.alive)return false;
      R.BOARD.filter(t=>t.type==='prop'&&st.owners[t.i]<0).slice(0,1).forEach(t=>{st.owners[t.i]=s;});
      st.turn=s;p.cash=500;st.phase='crisis';st.pending={card:{idx:0,text:'（測試）罰款 15000',eff:'m:-15000'},cost:15000,cash:500,liq:R.liqValue(st,s),opts:['sell','debt'],depth:0,rate:50,sellRate:0.7,shieldBlock:0.5};
      st.deadline=Date.now()+60000;st.ev=[];st.evId++;H.pushViews();return true;})()""")
    await guest.wait_for_timeout(1500)
    has = await guest.evaluate("!!document.querySelector('.crisis-card [data-c=\"debt\"]')")
    if not has: fail(f'{name}：一般玩家端沒有出現危機處理畫面')
    else:
      await guest.evaluate("document.querySelector('.crisis-card [data-c=\"debt\"]').click()"); await guest.wait_for_timeout(2000)
      after = await host.evaluate("(()=>{const st=window.Host.game.state,p=st.players[1];return {phase:st.phase,cash:p.cash,debt:p.debt||0,alive:p.alive}})()")
      if not (after['debt'] > 0 and after['phase'] != 'crisis'): fail(f'{name}：一般玩家選負債後狀態不對 {after}')
      else: print(f'  ✓ 一般玩家端危機處理：選負債後 {after}')
    await pilot(guest, True)
  # 再跑一下確認不會壞
  await host.wait_for_timeout(8000)
  for e in errs: fail(e)
  await ctx.close()

async def main():
  names = sys.argv[1:] or list(CONFIGS)
  async with async_playwright() as p:
    br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
    for n in names: await run(n, CONFIGS[n], br)
    await br.close()
  print('\n' + ('✅ 畫面測試全部通過' if not FAILS else f'共 {len(FAILS)} 個問題'))
  sys.exit(1 if FAILS else 0)
asyncio.run(main())
