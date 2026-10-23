#!/usr/bin/env python3
"""Offline complete-match regression: Classic, Short, Triple and rematch.

Tests the real game's scoring, next-turn, results and restart code, without
any room traffic or real multiplayer users. Requires local Playwright Chromium.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent
html = (root / 'public/index.html').read_text(encoding='utf-8')
marker = 'Phones.probe();\n})();'
assert marker in html, 'Test hook anchor changed'
html = html.replace(marker, '''Phones.probe();window.QA={
start:startGame,get:()=>S,prefs,score:chooseCell,options:(p,d)=>playerOptions(p,d),
raw:(k,d)=>rawScore(k,d,false)};
})();''')
with sync_playwright() as pw:
    launch = {'headless': True, 'args': ['--no-sandbox']}
    if os.getenv('GILDED_CHROMIUM'):
        launch['executable_path'] = os.environ['GILDED_CHROMIUM']
    browser = pw.chromium.launch(**launch)
    page = browser.new_page(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(html, wait_until='load')
    cases = [
        ('classic', False, 1, 13),
        ('classic', True, 2, 7),
        ('triple', False, 1, 39),
        ('triple', True, 1, 21),
        ('classic', False, 2, 13, True),
    ]
    assertions = 0
    for case in cases:
        mode,short,count,expected=case[:4]
        high_stakes=len(case)>4 and case[4]
        page.evaluate('''cfg => {
          QA.prefs.phones=false; QA.prefs.simultaneous=false; QA.prefs.mode=cfg.mode;
          QA.prefs.short=cfg.short; QA.prefs.gold=true; QA.prefs.chips=cfg.stakes;
          QA.prefs.house=cfg.stakes; QA.prefs.replay=false; QA.prefs.voiceOn=false;
          QA.prefs.ambOn=false; QA.prefs.sound=false;
          QA.start(Array.from({length:cfg.count},(_,i)=>({name:'Seat '+(i+1),
                    type:'human',color:i})),cfg.mode,false);
        }''', {'mode':mode,'short':short,'count':count,'stakes':high_stakes})
        result = page.evaluate('''() => {
           let commits=0;
           while(QA.get().phase==='play' && commits < 320){
             const s=QA.get(), p=s.players[s.current];
             s.dice=[1,2,3,4,5]; s.rollNum=3;
             const opts=QA.options(p,s.dice);
             const opt=opts[0];
             if(!opt)throw Error('No scoring option for '+p.name+' on round '+s.round);
             QA.score(opt.key,true);
             commits++;
           }
           const s=QA.get();return {phase:s.phase,commits,round:s.round,
             cards:s.players.map(p=>p.cards.map(c=>Object.values(c.s).filter(x=>x!==null).length)),
             score:s.players.map(p=>p.cards.map(c=>Object.values(c.s).filter(x=>x!==null).reduce((a,b)=>a+b,0)))};
        }''')
        assert result['phase']=='over', f'{mode} short={short}: game unfinished {result}'
        assertions += 1
        assert result['commits']==expected*count, f'{mode} short={short}: {result}'
        assertions += 1
        assert all(all(v == (7 if short else 13) for v in cols) for cols in result['cards']), result
        assertions += 1
        page.wait_for_timeout(1050)
        assert page.locator('#results').is_visible(), f'{mode} results overlay missing'
        assertions += 1
        if high_stakes:
            assert page.evaluate('QA.get().cashed===true');assertions+=1
            assert 'High Roller' in page.locator('#resultsCard').inner_text();assertions+=1
            assert page.evaluate('QA.get().players.every(p=>p.cash === 2*p.chips)');assertions+=1
        if mode=='classic' and not short:
            page.locator('#resRematch').click()
            again = page.evaluate('''() => ({phase:QA.get().phase,
                     round:QA.get().round,
                     scored:QA.get().players[0].cards[0].s.ones})''')
            assert again == {'phase':'play','round':1,'scored':None}, again
            assertions += 1
            page.wait_for_timeout(200)
    assert not errors, 'Browser page errors: ' + ' | '.join(errors)
    assertions += 1
    browser.close()
print(f'PASS: {assertions} complete-match and rematch checks (Classic, Short, Triple, High Stakes)')
