#!/usr/bin/env python3
"""Assemble docs/index.html : une seule page autonome (CSS, JS, données, sprites et polices intégrés)."""
import base64, json, pathlib, sys
R = pathlib.Path(__file__).parent
rd = lambda p: (R / p).read_text(encoding='utf8')
b64 = lambda p: base64.b64encode((R / p).read_bytes()).decode()
fonts = (
    '@font-face{font-family:"Albert Sans";font-style:normal;font-weight:100 900;font-display:swap;'
    f'src:url(data:font/woff2;base64,{b64("fonts/albert-sans-latin-wght-normal.woff2")}) format("woff2")}}\n'
    '@font-face{font-family:"Pixelify Sans";font-style:normal;font-weight:700;font-display:swap;'
    f'src:url(data:font/woff2;base64,{b64("fonts/pixelify-sans-latin-700-normal.woff2")}) format("woff2")}}\n')
css = fonts + rd('src/style.css') + f'\n:root{{--sheet:url(data:image/webp;base64,{b64("data/sprites.webp")})}}\n'
data = json.dumps(json.loads(rd('data/data.json')), ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
js = rd('src/app.js')
assert '</script' not in js and '</style' not in css
html = rd('src/template.html')
for mark, val in (('/*CSS*/', css), ('<!--ARCEUS-->', rd('src/arceus.html')), ('/*DATA*/', data), ('/*JS*/', js)):
    assert html.count(mark) == 1, mark
    html = html.replace(mark, val)
out = R / 'docs'; out.mkdir(exist_ok=True)
(out / 'index.html').write_text(html, encoding='utf8')
print(f'docs/index.html : {len(html.encode())/1024:.0f} Ko')
