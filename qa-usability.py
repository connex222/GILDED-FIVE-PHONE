#!/usr/bin/env python3
"""Offline browser checks for keyboard navigation, settings and saved-game recovery.
Chromium and Python Playwright are required; the test uses document content
with a local fake storage backend and never calls an external server.
"""
from pathlib import Path
import os, json
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent
html=(root/'public/index.html').read_text(encoding='utf-8')
def with_storage(values=None):
    fake='''<script>
      const __storageData=STORAGE;
      const localStorage={getItem(k){return Object.prototype.hasOwnProperty.call(__storageData,k)?__storageData[k]:null},
        setItem(k,v){__storageData[k]=String(v)},removeItem(k){delete __storageData[k]}};
      window.__testSaved=()=>({...__storageData});
    </script>'''.replace('STORAGE',json.dumps(values or {}))
    return html.replace('</head>',fake+'</head>',1)

checks=0
with sync_playwright() as pw:
    args={'headless':True,'args':['--no-sandbox']}
    if os.getenv('GILDED_CHROMIUM'):args['executable_path']=os.getenv('GILDED_CHROMIUM')
    browser=pw.chromium.launch(**args)
    page=browser.new_page(viewport={'width':1280,'height':800},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(with_storage(),wait_until='load')
    assert page.locator('#setup').is_visible();checks+=1
    assert page.evaluate("document.querySelector('#setup').contains(document.activeElement)");checks+=1
    page.locator('#btnRules1').click()
    assert page.locator('#rules').is_visible();checks+=1
    assert page.evaluate("document.querySelector('#rules').contains(document.activeElement)");checks+=1
    page.keyboard.press('Escape')
    assert page.locator('#rules').is_hidden();checks+=1
    assert page.evaluate("document.activeElement.id==='btnRules1'");checks+=1
    page.evaluate('''() => {const d=document.querySelector('#setup');
      const els=[...d.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')].filter(e=>e.getClientRects().length);els.at(-1).focus();}''')
    page.keyboard.press('Tab')
    assert page.evaluate("document.querySelector('#setup').contains(document.activeElement)");checks+=1
    page.locator('#advanced summary').click()
    page.locator('#optShort').check()
    assert '7 turns' in page.locator('#modeInfo').inner_text();checks+=1
    page.locator('[data-mode="triple"]').click()
    assert '21 turns' in page.locator('#modeInfo').inner_text();checks+=1
    page.locator('#optShort').uncheck()
    assert '39 turns' in page.locator('#modeInfo').inner_text();checks+=1
    page.locator('#btnStart').click()
    assert page.locator('#setup').is_hidden();checks+=1
    saved=page.evaluate('window.__testSaved()')
    assert 'gildedFive.game.v2' in saved;checks+=1
    page.close()
    page=browser.new_page(viewport={'width':1280,'height':800},reduced_motion='reduce')
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(with_storage(saved),wait_until='load')
    assert page.locator('#resumeBox').is_visible();checks+=1
    assert '39' in page.locator('#resumeInfo').inner_text();checks+=1
    page.locator('#btnResume').click()
    assert page.locator('#setup').is_hidden();checks+=1
    assert not errors,errors;checks+=1
    page.close()

    broken=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
    bad_errors=[];broken.on('pageerror',lambda e:bad_errors.append(str(e)))
    bad={
        'gildedFive.prefs.v2':json.dumps({'seats':None,'phoneBots':None,'count':1000,'mode':'invalid','preset':'something'}),
        'gildedFive.profiles.v1':json.dumps({'bad':'shape'}),
        'gildedFive.records.v1':'null',
        'gildedFive.game.v2':json.dumps({'v':2,'phase':'play','players':[{'name':'Ghost'}]})
    }
    broken.set_content(with_storage(bad),wait_until='load')
    assert broken.locator('#setup').is_visible();checks+=1
    assert broken.locator('#resumeBox').is_hidden();checks+=1
    assert broken.locator('#counts button').count()==8;checks+=1
    assert broken.locator('#counts button[aria-pressed="true"]').text_content()=='2';checks+=1
    broken.locator('#btnRecords1').click()
    assert broken.locator('#records').is_visible();checks+=1
    assert not bad_errors,bad_errors;checks+=1
    broken.close();browser.close()
print(f'PASS: {checks} keyboard, short-mode, resume and malformed-storage UI checks')
