'use strict';
// Real HTTP and WebSocket acceptance checks, using the shipped server and ws dependency.
// No external services, browsers, or user data are touched.
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const WebSocket = require('ws');
const { setTimeout: pause } = require('node:timers/promises');

let assertions = 0;
const check = (condition, message) => { assert(condition, message); assertions++; };
const equal = (a, b, message) => { assert.deepEqual(a, b, message); assertions++; };
const getFreePort = () => new Promise((resolve, reject) => {
  const s = net.createServer(); s.once('error', reject);
  s.listen(0, '127.0.0.1', () => {const port = s.address().port; s.close(() => resolve(port));});
});
const timed = (promise, ms, label) => Promise.race([promise, pause(ms).then(() => {throw Error('Timed out: ' + label);})]);
class Peer {
  constructor(url) { this.ws = new WebSocket(url); this.items = []; this.waiters = [];
    this.ws.on('message', b => {
      const m = JSON.parse(b.toString());
      const waiter = this.waiters.find(w => w.test(m));
      if (waiter) {this.waiters.splice(this.waiters.indexOf(waiter), 1);waiter.resolve(m);}
      else this.items.push(m);
    });
  }
  async open() { await timed(new Promise((resolve,reject) => {if(this.ws.readyState === 1)return resolve();this.ws.once('open',resolve);this.ws.once('error',reject);}),3000,'socket open'); return this; }
  send(v) {this.ws.send(JSON.stringify(v));}
  recv(test, label, ms=3500) {
    const idx = this.items.findIndex(test);if(idx >= 0)return Promise.resolve(this.items.splice(idx,1)[0]);
    return timed(new Promise(resolve => this.waiters.push({test,resolve})),ms,label);
  }
  async close() {if(this.ws.readyState===WebSocket.CLOSED)return;this.ws.close();await Promise.race([new Promise(resolve=>this.ws.once('close',resolve)),pause(1000)]);}
}
async function httpGet(base,path) {
  return new Promise((resolve,reject)=>{
    http.get(base+path,res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString('utf8')}));}).on('error',reject);
  });
}
async function main() {
  const port = await getFreePort();
  const child = spawn(process.execPath, ['server.js'], {cwd:__dirname,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
  let logs='';child.stdout.on('data',b=>logs+=b.toString());child.stderr.on('data',b=>logs+=b.toString());
  const base=`http://127.0.0.1:${port}`,url=`ws://127.0.0.1:${port}/ws`,clients=[];
  const peer = async () => {const p=await new Peer(url).open();clients.push(p);return p;};
  try {
    let ready=false;for(let i=0;i<50;i++){if(child.exitCode !== null)throw Error('Server exited: '+logs);try{const r=await httpGet(base,'/health');if(r.status===200){ready=true;break;}}catch(e){}await pause(50);}
    check(ready,'server boots and health endpoint responds');
    const routes=[['/',200,'text/html','GILDED'],['/tv',200,'text/html','GILDED'],['/play',200,'text/html','JOIN'],['/rules.js',200,'text/javascript','rawScore'],['/api/info',200,'application/json','gilded-five'],['/wake',200,'text/plain','ok'],['/assets/gilded-five-brand.svg',200,'image/svg+xml','svg'],['/assets/lato-regular.woff2',200,'font/woff2',''],['/does-not-exist',404,'text/plain','Not found'],['/qr.svg',400,'text/plain','missing']];
    for(const [path,status,type,body] of routes) {const r=await httpGet(base,path);equal(r.status,status,'HTTP status '+path);check(r.headers['content-type']?.startsWith(type),'MIME '+path);if(body) check(r.body.toLowerCase().includes(body.toLowerCase()),'HTTP contents '+path);}
    const qr=await httpGet(base,'/qr.svg?t='+encodeURIComponent(base+'/play?room=ABCD'));equal(qr.status,200,'QR generated');check(qr.body.includes('<svg'),'QR is SVG');

    const host=await peer();host.send({t:'host'});
    const created=await host.recv(m=>m.t==='hosted','hosted');check(/^[A-Z]{4}$/.test(created.code),'unique room issued');
    check(created.key.length>=8,'room has recovery secret');
    await host.recv(m=>m.t==='roster','initial roster');
    host.send({t:'join',code:created.code,tok:'malicious-host-token',name:'Fake Phone'});
    equal((await host.recv(m=>m.t==='err','host cannot rebind')).e,'already','host cannot switch into a phone');
    const seats=[];
    for(let i=0;i<8;i++){
      const p=await peer();const tok='legit-token-'+i+'-secure';p.send({t:'join',code:created.code,name:'Seat '+(i+1),tok});
      const j=await p.recv(m=>m.t==='joined','join seat '+i);
      equal(j.code,created.code,'seat joins correct room');seats.push({p,tok,id:j.id});
      await host.recv(m=>m.t==='roster'&&m.phones.length===i+1,'host sees seat '+i);
    }
    const ninth=await peer();ninth.send({t:'join',code:created.code,name:'Seat 9',tok:'ninth-token-12345'});
    equal((await ninth.recv(m=>m.t==='err','full game')).e,'full','ninth seat rejected');

    const publicState={k:'game',S:{sim:{on:true,stage:'rolling',progress:[{locked:false}],round:1},players:[{name:'Seat 1'}]}};
    host.send({t:'bcast',d:publicState});
    for(let i=0;i<8;i++)equal((await seats[i].p.recv(m=>m.t==='d'&&m.d?.k==='game','public state '+i)).d,publicState,'public host update to seat '+i);

    const privateMsg={round:1,seat:2,dice:[1,2,3,4,5],held:[false,true,false,true,false]};
    host.send({t:'private',id:seats[2].id,d:privateMsg});
    equal((await seats[2].p.recv(m=>m.t==='priv','private to seat')).d,privateMsg,'target seat receives private dice');
    for(let i=0;i<8;i++)if(i!==2)check(!seats[i].p.items.some(m=>m.t==='priv'),'no other seat gets private dice '+i);

    seats[0].p.send({t:'a',a:{a:'roll'}});
    const action=await host.recv(m=>m.t==='a'&&m.id===seats[0].id,'seat action');equal(action.a.a,'roll','phone action routed to host');
    // A phone cannot promote itself to host or rebind its socket to a new seat.
    seats[0].p.send({t:'host'});
    equal((await seats[0].p.recv(m=>m.t==='err','role rebinding rejected')).e,'already','phone cannot become host');
    seats[0].p.send({t:'join',code:created.code,tok:'new-token-on-old-socket'});
    equal((await seats[0].p.recv(m=>m.t==='err','duplicate join rejected')).e,'already','phone cannot create ghost seats');
    seats[0].p.send({t:'private',id:seats[1].id,d:{dice:[6,6,6,6,6]}});
    await pause(100);
    check(!seats[1].p.items.some(m=>m.t==='priv'),'phone cannot send private messages to peers');

    // Disconnect/reconnect should preserve the seat and replay ONLY public state.
    await seats[3].p.close();await host.recv(m=>m.t==='roster'&&m.phones.some(x=>x.id===seats[3].id&&!x.on),'offline roster');
    const reconnected=await peer();reconnected.send({t:'join',code:created.code,tok:seats[3].tok,name:'Seat 4'});
    const rejoin=await reconnected.recv(m=>m.t==='joined','seat rejoin');equal(rejoin.id,seats[3].id,'rejoined phone keeps seat ID');
    equal((await reconnected.recv(m=>m.t==='d'&&m.d?.k==='game','replay public')).d,publicState,'rejoin receives safe public state');
    check(!reconnected.items.some(m=>m.t==='priv'),'rejoin does not replay another seat private data');

    // Host recovery uses its private key; phone remains in the original room.
    await host.close();await seats[1].p.recv(m=>m.t==='host'&&!m.on,'host offline notification');
    const resumed=await peer();resumed.send({t:'host',code:created.code,key:created.key});
    equal((await resumed.recv(m=>m.t==='hosted','host resumed')).code,created.code,'host recovers existing room');
    const on=await seats[1].p.recv(m=>m.t==='host'&&m.on,'host online notification');check(on.on,'phones receive reconnection notification');
    seats[1].p.send({t:'a',a:{a:'score',key:'0:chance'}});
    equal((await resumed.recv(m=>m.t==='a'&&m.id===seats[1].id,'post recovery action')).a.a,'score','actions survive host recovery');

    console.log('PASS: '+assertions+' real HTTP/WebSocket checks, eight seats, safe private relays, full-room limit and reconnects.');
  } finally {
    await Promise.allSettled(clients.map(p=>p.close()));child.kill('SIGTERM');
    await Promise.race([new Promise(resolve=>child.once('exit',resolve)),pause(1200)]);
  }
}
main().catch(e=>{console.error('FAIL:',e.stack||e);process.exitCode=1;});
