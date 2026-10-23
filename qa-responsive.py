#!/usr/bin/env python3
"""Optional browser smoke checks: Chromium and python Playwright required.
Uses local HTML, no external network, and preserves the original source files.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent
host=(root/'public/index.html').read_text(encoding='utf-8')
phone=(root/'public/play.html').read_text(encoding='utf-8')
marker='Phones.probe();\n})();'
assert marker in host, 'Host boot marker changed'
host=host.replace(marker,"Phones.probe();window.QA={startGame,get:()=>S,prefs};\n})();")
with sync_playwright() as pw:
  options={'headless':True,'args':['--no-sandbox']}
  if os.environ.get('GILDED_CHROMIUM'): options['executable_path']=os.environ['GILDED_CHROMIUM']
  browser=pw.chromium.launch(**options)
  checks=0
  for size in [320,390,768,1920,3840]:
    height=800 if size<=390 else (1080 if size<3000 else 2160)
    for page_name,source in [('host',host),('phone',phone)]:
      p=browser.new_page(viewport={'width':size,'height':height},reduced_motion='reduce')
      errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
      p.set_content(source,wait_until='load')
      p.wait_for_timeout(100)
      overflow=p.evaluate('''() => ({width:document.documentElement.scrollWidth,viewport:window.innerWidth})''')
      assert overflow['width']<=overflow['viewport']+1,f'{page_name} {size}px horizontal overflow: {overflow}'
      checks+=1
      if page_name=='phone':
        b=p.locator('#inCode').bounding_box();assert b,f'No join code input on {size}px'
        assert b['x']>=-1 and b['x']+b['width']<=size+1,f'Phone room input clipped at {size}px: {b}'
        checks+=1
      if page_name=='host':
        if size==1920:
          b=p.locator('#btnStart').bounding_box();assert b and b['y']+b['height']<=height+1,f'TV deal button below viewport: {b}'
          checks+=1
        p.evaluate('''() => {QA.prefs.phones=false;QA.prefs.simultaneous=false;QA.prefs.house=false;QA.startGame([{name:'Seat 1',color:0,type:'human'}],'classic',false)}''')
        p.wait_for_timeout(100)
        btn=p.locator('#btnRoll').bounding_box();assert btn and btn['width']>70,'Roll button has viable tap target'
        label=p.locator('#rollText').evaluate('''e => ({scroll:e.scrollWidth,client:e.clientWidth})''')
        assert label['scroll']<=label['client']+2,f'Roll button text truncated at {size}px: {label}'
        checks+=2
      assert not errors,f'{page_name} {size}px page errors: {errors}'
      checks+=1
      p.close()
  browser.close()
print(f'PASS: {checks} responsive UI checks across 320, 390, 768, 1920, 3840px')
