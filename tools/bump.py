# 每次上線前執行：幫 index.html 裡的 js / css 加上版本號，手機才不會一直用舊的快取
import re, time, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'index.html'
v = time.strftime('%m%d%H%M')
s = p.read_text(encoding='utf-8')
s = re.sub(r'((?:src|href)="(?!http)[^"]+\.(?:js|css))(\?v=[^"]*)?"', lambda m: f'{m.group(1)}?v={v}"', s)
p.write_text(s, encoding='utf-8'); print('version', v)
