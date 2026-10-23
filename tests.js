'use strict';
/* GILDED FIVE Premium — offline scoring and fairness regression tests.
   Run: node tests.js — no external packages or network needed. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = html.match(/\/\*RULES-START\*\/([\s\S]*?)\/\*RULES-END\*\//);
assert(match, 'Rules extraction markers missing');
const R = vm.runInNewContext(`(function(){ ${match[1]} return {CATS,CAT,counts,sum,isFive,rawScore,turnOptions,playerOptions,cardUpper,cardTotals,totals,setHouse,setGoldDie,setUpperTarget,setShortGame,ptsLabel,rollLimit,handOfRound}; })()`);
let tests=0;
function eq(actual,expected,label){assert.equal(actual,expected,label);tests++;}
function ok(condition,label){assert(condition,label);tests++;}
const blank =()=> Object.fromEntries(Array.from(R.CATS, c=>[c.id,null]));
const player=(s=blank())=>({cards:[{s,yb:0}],xp:0,chips:5});
R.setHouse(null);R.setGoldDie(true);R.setUpperTarget(63);
const d=[2,2,2,5,5];
// All scoring boxes, plus a separate kind with a gold sum component.
for(let f=1;f<=6;f++)eq(R.rawScore(['ones','twos','threes','fours','fives','sixes'][f-1],[f,f,f,1,f],false),(f===1?10:f*4+5),'upper '+f);
eq(R.rawScore('threeK',d,false),21,'three of a kind with gold');
eq(R.rawScore('fourK',[4,4,4,4,2],false),20,'four of a kind with gold');
eq(R.rawScore('full',d,false),25,'full house');
eq(R.rawScore('smS',[1,2,3,4,6],false),30,'small straight');
eq(R.rawScore('lgS',[1,2,3,4,5],false),40,'large straight');
eq(R.rawScore('yahtzee',[6,6,6,6,6],false),80,'gilded five face six');
eq(R.rawScore('chance',[1,2,3,4,6],false),22,'chance doubles gold');
eq(R.rawScore('full',[1,1,1,2,3],true),25,'joker full house');
eq(R.rawScore('smS',[1,1,1,2,3],true),30,'joker straight');
eq(R.rawScore('lgS',[1,1,1,2,3],true),40,'joker large straight');
// Forced joker rule: upper first then any bottom; 100 bonus on a previously scored Gilded Five.
const s=blank();s.yahtzee=55;
let o=R.turnOptions(s,[1,1,1,1,1]);
ok(o.allowed.size===1&&o.allowed.has('ones')&&o.bonus,'forced upper box and bonus');
s.ones=10;o=R.turnOptions(s,[1,1,1,1,1]);
ok(o.joker&&o.allowed.has('full')&&!o.allowed.has('twos'),'forced lower and joker');
s.full=25;s.smS=30;s.lgS=40;s.threeK=20;s.fourK=20;s.chance=15;
o=R.turnOptions(s,[1,1,1,1,1]);ok(!o.joker&&o.allowed.has('twos'),'joker last fallback upper');
s.yahtzee=0;o=R.turnOptions(s,[1,1,1,1,1]);ok(!o.bonus,'no 100 bonus for zero Gilded Five');
// Upper bonus and short-game scaling.
const a=blank(); ['ones','twos','threes','fours','fives','sixes'].forEach((k,i)=>{a[k]=[3,6,9,12,15,18][i]});
eq(R.cardTotals({s:a,yb:0}).bonus,35,'63 bonus');a.sixes=17;eq(R.cardTotals({s:a,yb:0}).bonus,0,'no premature bonus');
R.setUpperTarget(30);eq(R.cardTotals({s:a,yb:0}).bonus,35,'short game upper 30');R.setUpperTarget(63);
// Gilded Die does not change fixed-point combos, and can be disabled in advanced.
eq(R.rawScore('ones',[1,1,1,1,1],false),10,'upper one + 5');
eq(R.rawScore('five'.replace('five','fives'),[5,5,5,5,5],false),30,'upper five + 5');
eq(R.rawScore('yahtzee',[1,1,1,1,1],false),55,'gold face one five of kind');
R.setGoldDie(false);eq(R.rawScore('yahtzee',[6,6,6,6,6],false),50,'gold disabled five of kind');eq(R.rawScore('chance',d,false),16,'gold disabled chance');R.setGoldDie(true);
// Card modifiers and their interactions with gold face; Lucky Sevens never affects Aces.
for(const [rule,cat,hand,value] of [
 ['sevens','ones',[1,1,1,1,1],10],
 ['sevens','chance',[1,1,2,2,1],32],
 ['double','chance',[1,2,3,4,5],40],
 ['party','full',[2,2,2,5,5],40],
 ['straight','smS',[1,2,3,4,6],40],
 ['straight','lgS',[1,2,3,4,5],50],
 ['hot','chance',[1,2,3,4,5],20],
 ['tight','chance',[1,2,3,4,5],20],
 ['underdog','chance',[1,2,3,4,5],20],
 ['net','chance',[1,2,3,4,5],20],
 ]){R.setHouse(rule);eq(R.rawScore(cat,hand,false),value,rule+' '+cat);}
R.setHouse('hot');eq(R.rollLimit({rule:'hot',extra:0}),4,'hot hand roll limit');
R.setHouse('tight');eq(R.rollLimit({rule:'tight',extra:0}),2,'tight table roll limit');
R.setHouse(null);
// Short/Triple option cap: each of the three columns stops offering moves
// once seven distinct boxes have been selected, not after thirteen.
const firstSeven=blank();R.CATS.slice(0,7).forEach(c=>firstSeven[c.id]=0);
R.setShortGame(true);
const p3={cards:[{s:firstSeven,yb:0},{s:blank(),yb:0},{s:blank(),yb:0}]};
const shortOpts=R.playerOptions(p3,[1,2,3,4,5]);
ok(shortOpts.length>0,'Short Triple retains unplayed columns');
ok(shortOpts.every(o=>o.c!==0),'Short Triple closes completed seven-box column');
const justSix=blank();R.CATS.slice(0,6).forEach(c=>justSix[c.id]=0);
const sixOpts=R.playerOptions({cards:[{s:justSix,yb:0}]},[1,2,3,4,5]);
ok(sixOpts.length>0,'Short keeps six-box column open');
R.setShortGame(false);
ok(R.playerOptions({cards:[{s:firstSeven,yb:0}]},[1,2,3,4,5]).length>0,'Full still offers eighth box');
// Total and one-winner cash conversion; High Roller only an award.
const p=player();p.cash=24;p.xp=10;
eq(R.totals(p).grand,34,'chip cash-in +24 plus extras');
let payoff=R.handOfRound([12,22,22,4],11,true);
eq(payoff.payouts[1],5,'tied hand pot split');eq(payoff.payouts[2],5,'other tied winner');eq(payoff.carry,1,'odd chip carries');
eq(R.handOfRound([2,3,1],0,false).bonus,10,'hand of round fixed bonus');
// Dice RNG itself: locate the actual d6() function in the source, inject Node crypto and test 600k results.
const src=html.slice(html.indexOf('function d6()'),html.indexOf('/*RULES-START*/'));
const fn=src.match(/function d6\(\)\s*\{[\s\S]*?\n\}/);
assert(fn,'d6() function missing');
const d6=vm.runInNewContext(fn[0]+';d6',{crypto:webcrypto,window:{crypto:webcrypto},Uint32Array,Math});
const n=600000, freq=[0,0,0,0,0,0,0];for(let i=0;i<n;i++)freq[d6()]++;
for(let f=1;f<=6;f++)ok(Math.abs(freq[f]-n/6)<n/600,'600k d6 fairness, face '+f+' count '+freq[f]);
// Critical structure / protocol safety checks.
ok(!fs.existsSync('index.html'),'only public/index.html source');
ok(!fs.existsSync('assets'),'only public/assets');
ok(!/\bfreeze\s*:\s*\{/.test(html),'Freeze unavailable');
ok(html.includes("delete safe.sim.turns; delete safe.sim.results"),'private dice not broadcast');
ok(fs.readFileSync('server.js','utf8').includes("case 'private':"),'per-seat relay is present');
ok(fs.readFileSync('public/play.html','utf8').includes('id="btnLock"'),'phone lock-in action present');
ok(fs.readFileSync('public/play.html','utf8').includes('crypto.getRandomValues(bytes)'), 'new phone rejoin tokens use secure browser randomness');
// Interface and packaging regressions: no duplicated IDs, retired icons, or remote dependencies.
for(const page of ['public/index.html','public/play.html']){
 const raw=fs.readFileSync(page,'utf8');
 const ids=[...raw.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 ok(new Set(ids).size===ids.length,page+' has unique DOM IDs');
 ok(!/[\u{1F300}-\u{1FAFF}]/u.test(raw),page+' has no emoji glyphs');
 ok(!/<link\s+rel="stylesheet"/i.test(raw),page+' embeds all CSS');
}
ok(html.includes('if(t.chosenBox && playerOptions(p,t.dice).some(o=>o.key===t.chosenBox))'), 'timer respects a legal human box choice before lock-in');
ok(html.includes('S.sim.pot=(S.sim.carryPot||0)+contributed'), 'round pot only contains chips actually collected');
ok(html.includes('Engine.bestHold(t.dice,maxRolls-t.rollNum'), 'timeout AI accounts for the active roll limit');
ok(html.includes("if(S.sim.stage==='reveal')") && html.includes("S.sim.stage='rolling';startSimReveal();"), 'pending reveal resumes after browser refresh');
ok(html.includes("else if(S.sim.stage==='settled')") && html.includes('setTimeout(finishSettledSimRound'), 'settled round continues after browser refresh');
ok(html.includes("!$('#setup').hidden)return;"), 'saved round timer cannot expire behind resume confirmation');
ok(html.includes('finalCashIn();S.awards=makeAwards();'), 'chips converted before final awards on simultaneous finish');
ok(html.includes('finalCashIn(); S.awards = makeAwards();'), 'chips converted before final awards on classic finish');
console.log(`PASS: ${tests} scoring, fairness, accessibility and architecture checks; RNG frequencies ${freq.slice(1).join(', ')}.`);
