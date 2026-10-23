#!/usr/bin/env python3
"""Optional end-to-end browser regression: pip install playwright; playwright install chromium.
This exercises local game logic without contacting any outside services.
Use GILDED_CHROMIUM=/usr/bin/chromium to select an installed Chromium binary.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent
html = (root / 'public' / 'index.html').read_text(encoding='utf-8')
marker = 'Phones.probe();\n})();'
if marker not in html:
    raise RuntimeError('Game boot marker changed: adapt browser smoke test')
html = html.replace(marker, "Phones.probe();window.QA={startGame,get:()=>S,prefs,action:simAction,auto:simAuto,newRound:startSimRound,resume:resumeSimStage,public:publicSimState};\n})();")
with sync_playwright() as pw:
    kwargs = {'headless': True, 'args': ['--no-sandbox']}
    if os.environ.get('GILDED_CHROMIUM'):
        kwargs['executable_path'] = os.environ['GILDED_CHROMIUM']
    browser = pw.chromium.launch(**kwargs)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080}, reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(html, wait_until='load')

    page.evaluate('''() => {
      QA.prefs.phones=true; QA.prefs.simultaneous=true; QA.prefs.chips=true;
      QA.prefs.house=false; QA.prefs.timer=0; QA.prefs.mirror=false;
      QA.startGame([{name:'Seat A',color:0,type:'human',sid:'phoneA'},
                    {name:'Seat B',color:1,type:'human',sid:'phoneB'}], 'classic', false);
      QA.action('phoneA',{a:'roll'});
      QA.action('phoneA',{a:'choose',key:'0:ones'});
      QA.auto(0,true);
    }''')
    chosen = page.evaluate('''() => ({box: QA.get().sim.turns[0].chosenBox,
                                   locked: QA.get().sim.turns[0].locked})''')
    assert chosen == {'box': '0:ones', 'locked': True}, chosen

    pot = page.evaluate('''() => {
      const s=QA.get(); s.players[0].chips=0; s.players[1].chips=2;
      QA.newRound(); return {pot:s.sim.pot, chips:s.players.map(p=>p.chips)};
    }''')
    assert pot == {'pot': 1, 'chips': [0, 1]}, pot

    page.evaluate('''() => {
      QA.prefs.chips=false;
      const seats=Array.from({length:8},(_,i)=>
        ({name:'Seat '+(i+1),color:i,type:'human',sid:'phone'+i}));
      QA.startGame(seats,'classic',false);
      for(let i=0;i<8;i++){
        const id='phone'+i;
        QA.action(id,{a:'roll'});
        QA.action(id,{a:'choose',key:'0:chance'});
        QA.action(id,{a:'lock'});
      }
    }''')
    public = page.evaluate('QA.public()')
    assert 'turns' not in public['sim'] and 'results' not in public['sim'], 'Private dice leaked into broadcast'
    assert all(t['locked'] for t in page.evaluate('QA.get().sim.turns')), 'Not all 8 seats locked'
    page.evaluate('QA.resume()')  # simulate host restoring a saved reveal
    page.wait_for_timeout(2850)
    game = page.evaluate('''() => ({round:QA.get().round, stage:QA.get().sim.stage,
                                     boxes:QA.get().players.map(p=>p.cards[0].s.chance)})''')
    assert game['round']==2 and game['stage']=='rolling', game
    assert all(v is not None for v in game['boxes']), game
    assert not errors, 'Browser errors: ' + '; '.join(errors)
    print('PASS: choice respected at timeout, pot accounting, private 8-seat reveal and round recovery')
    browser.close()
