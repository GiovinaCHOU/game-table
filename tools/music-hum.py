# 「用哼的」測試：python3 tools/music-hum.py
# 產生一段假的哼歌音檔（Do Re Mi Fa Sol、停、Sol Mi Do）當成麥克風輸入，檢查：哼歌模式隱藏鍵盤、哼歌時語音麥克風關掉（hold）、
# 停止後恢復語音並關掉麥克風、轉出來的音正確、可以切回鍵盤疊錄鼓聲、送出後大家收到
import wave, struct, math, random
def make_wav(path):
  sr = 48000; out = []
  for f in [261.63, 293.66, 329.63, 349.23, 392.00, 0, 392.00, 329.63, 261.63]:
    n = int(sr * 0.45)
    for i in range(n):
      t = i / sr
      if f == 0: out.append(random.uniform(-0.003, 0.003)); continue
      env = min(1, i / 600) * min(1, (n - i) / 600); ph = 2 * math.pi * f * (1 + 0.004 * math.sin(2 * math.pi * 5 * t)) * t
      out.append(env * (0.35 * math.sin(ph) + 0.15 * math.sin(2 * ph) + 0.07 * math.sin(3 * ph)) + random.uniform(-0.01, 0.01))
    out += [random.uniform(-0.003, 0.003) for _ in range(int(sr * 0.08))]
  out += [random.uniform(-0.003, 0.003) for _ in range(sr)]
  w = wave.open(path, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
  w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x)) * 32767)) for x in out)); w.close()
make_wav('/tmp/music-hum.wav')
FAILS = []
def check(c, msg):
  print(('  ✓ ' if c else '  ❌ ') + msg)
  if not c: FAILS.append(msg)
import asyncio, functools, threading, http.server, socketserver, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class Q(http.server.SimpleHTTPRequestHandler):
  def log_message(self, *a): pass
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start(); port = srv.server_address[1]
W, H = int(sys.argv[1]) if len(sys.argv) > 1 else 393, int(sys.argv[2]) if len(sys.argv) > 2 else 852
async def main():
  async with async_playwright() as p:
    br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-file-for-fake-audio-capture=/tmp/music-hum.wav', '--autoplay-policy=no-user-gesture-required'])
    ctx = await br.new_context(viewport={'width': W, 'height': H}, permissions=['microphone'])
    h = await ctx.new_page(); errs = []
    h.on('pageerror', lambda e: errs.append(str(e)))
    url = f'http://127.0.0.1:{port}/?local=1'
    await h.goto(url); await h.fill('#nameInput', '房主'); await h.fill('#pinInput', '777777'); await h.click('#joinBtn'); await h.wait_for_timeout(1500)
    await h.evaluate("document.querySelector('[data-g=\"melody\"]').click()"); await h.wait_for_timeout(400)
    for i in range(2): await h.evaluate("document.querySelector('#addBot').click()"); await h.wait_for_timeout(300)
    await h.evaluate("(()=>{const M=GAMES.melody,o=M.init;M.init=function(...a){const st=o.apply(this,a);const me=a[2].indexOf('房主');st.order=[me,...st.order.filter(x=>x!==me)];st.composer=me;st.turn=me;return st;};})()")
    await h.evaluate("document.querySelector('#startBtn').click()"); await h.wait_for_timeout(1500)
    await h.evaluate("(()=>{const b=document.querySelector('#game [data-c]');b&&b.click();})()"); await h.wait_for_timeout(800)
    for _ in range(20):
      if await h.evaluate("!!document.querySelector('#game [data-m=\"hum\"]')"): break
      await h.wait_for_timeout(300)
    else: print('  debug', await h.evaluate("(()=>{const st=Host.game&&Host.game.state;return st&&[st.phase,st.composer,st.order,document.querySelector('#game').innerText.slice(0,160)]})()"))
    await h.click('#game [data-m="hum"]'); await h.wait_for_timeout(300)
    keys = await h.evaluate("getComputedStyle(document.querySelector('#game .mk-keys')).display")
    check(keys == 'none', '哼歌模式隱藏鍵盤')
    await h.click('#game [data-r="rec"]'); await h.wait_for_timeout(1500)
    print('錄音中狀態：', await h.evaluate("document.querySelector('#game .ml-status').textContent"), '音名：', await h.evaluate("document.querySelector('#game .ml-note').textContent"))
    check(await h.evaluate("Net.Voice.hold"), '哼歌時語音麥克風暫時關掉')
    await h.screenshot(path='/tmp/music-hum-rec.png')
    await h.wait_for_timeout(6000)
    await h.click('#game [data-r="stop"]'); await h.wait_for_timeout(400)
    check(not await h.evaluate("Net.Voice.hold"), '停止後恢復語音'); check(await h.evaluate("!GAMES.melody._hum.rec"), '停止後關掉麥克風')
    notes = await h.evaluate("GAMES.melody._kb.notes")
    names = await h.evaluate("GAMES.melody._kb.notes.map(n=>MUSIC.NOTE_NAME(n[1]))")
    print('狀態：', await h.evaluate("document.querySelector('#game .ml-status').textContent"))
    print('  轉出的音：', ' '.join(names))
    check(' '.join(names).startswith('Do Re Mi Fa Sol Sol Mi Do'), '轉出的音正確（Do Re Mi Fa Sol｜Sol Mi Do）')
    await h.screenshot(path='/tmp/music-hum-done.png')
    await h.click('#game [data-m="kb"]'); await h.wait_for_timeout(200)
    await h.click('#game [data-r="dub"]'); await h.wait_for_timeout(500)
    el = await h.query_selector('#game .mk-drums [data-d="0"]'); bb = await el.bounding_box()
    await h.mouse.move(bb['x'] + 20, bb['y'] + 20); await h.mouse.down(); await h.wait_for_timeout(80); await h.mouse.up(); await h.wait_for_timeout(300)
    await h.click('#game [data-r="stop"]'); await h.wait_for_timeout(300)
    n2 = await h.evaluate("GAMES.melody._kb.notes.length")
    check(n2 == len(notes) + 1, '切回鍵盤疊錄鼓聲')
    await h.click('#game [data-r="send"]'); await h.wait_for_timeout(1000)
    check(await h.evaluate("Host.game.state.phase") == 'guess' and await h.evaluate("Host.game.state.notes.length") == n2, '送出後進入猜題、音符完整')
    check(not errs, '沒有頁面錯誤 ' + ' '.join(errs))
    await br.close()
asyncio.run(main())
print('\n' + ('✅ 用哼的測試全部通過' if not FAILS else f'共 {len(FAILS)} 個問題')); sys.exit(1 if FAILS else 0)
