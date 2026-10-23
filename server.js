'use strict';
/*
  Gilded Five: phone relay server.
  The TV page (public/index.html) runs the whole game. This server only
  passes messages between the TV and the phones and hands out room codes.
*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomInt } = require('node:crypto');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');

const PORT = Number(process.env.PORT) || 3000;
const PUB = path.join(__dirname, 'public');
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MAX_PHONES = 8;
const HOST_GRACE_MS = 30 * 60 * 1000;

const rooms = new Map();

// Use cryptographically strong, unbiased codes and recovery secrets.
const rand = (n, chars) => { let s = ''; for (let i = 0; i < n; i++) s += chars[randomInt(chars.length)]; return s; };
const newCode = () => { let c; do { c = rand(4, CODE_CHARS); } while (rooms.has(c)); return c; };
const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} '._-]/gu, '').trim().slice(0, 14);
const safeSend = (ws, str) => { try { if (ws && ws.readyState === 1) ws.send(str); } catch (e) {} };
const J = o => JSON.stringify(o);

function lanAddresses() {
  const out = [];
  Object.values(os.networkInterfaces()).forEach(list => (list || []).forEach(i => {
    if (i.family === 'IPv4' && !i.internal) out.push(i.address);
  }));
  const priv = a => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a);
  return out.sort((a, b) => priv(b) - priv(a));
}

/* ---------- http ---------- */
const read = f => fs.readFileSync(path.join(PUB, f));
function rulesJs() {
  const html = read('index.html').toString('utf8');
  const a = html.indexOf('/*RULES-START*/'), b = html.indexOf('/*RULES-END*/');
  if (a < 0 || b < 0) throw new Error('rules markers missing in index.html');
  const body = html.slice(a + 15, b);
  return 'window.Rules=(function(){' + body +
    '\nreturn {CATS,UPPER,LOWER,CAT,counts,sum,isFive,rawScore,turnOptions,multOf,playerOptions,cardUpper,cardTotals,totals,setHouse,setGoldDie,setUpperTarget,ptsLabel,rollLimit,handOfRound};})();';
}
function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/' || url.pathname === '/tv') return send(res, 200, 'text/html; charset=utf-8', read('index.html'));
    if (url.pathname === '/play') return send(res, 200, 'text/html; charset=utf-8', read('play.html'));
    if (url.pathname === '/rules.js') return send(res, 200, 'text/javascript; charset=utf-8', rulesJs());
    const assets = {
      '/assets/gilded-five-mark.svg': 'image/svg+xml',
      '/assets/gilded-five-brand.svg': 'image/svg+xml',
      '/assets/liberation-serif.woff2': 'font/woff2',
      '/assets/lato-regular.woff2': 'font/woff2'
    };
    if (assets[url.pathname]) {if(url.pathname.endsWith('.woff2')) {res.writeHead(200,{'Content-Type':assets[url.pathname],'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'});return res.end(read(url.pathname.slice(1)));}return send(res, 200, assets[url.pathname], read(url.pathname.slice(1)));}
    if (url.pathname === '/api/info') return send(res, 200, 'application/json', J({ app: 'gilded-five', v: 1, lan: lanAddresses(), port: PORT }));
    if (url.pathname === '/health' || url.pathname === '/wake') return send(res, 200, 'text/plain', 'ok');
    if (url.pathname === '/qr.svg') {
      const t = (url.searchParams.get('t') || '').slice(0, 300);
      if (!t) return send(res, 400, 'text/plain', 'missing t');
      const svg = await QRCode.toString(t, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#08331f', light: '#fff3c4' } });
      return send(res, 200, 'image/svg+xml', svg);
    }
    send(res, 404, 'text/plain', 'Not found');
  } catch (e) { console.error(e); send(res, 500, 'text/plain', 'Server error'); }
});

/* ---------- websocket relay ---------- */
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 256 * 1024 });

function rosterMsg(room) {
  return J({ t: 'roster', phones: [...room.phones.values()].map(p => ({ id: p.id, name: p.name, on: !!(p.ws && p.ws.readyState === 1) })) });
}
const sendRoster = room => safeSend(room.host, rosterMsg(room));
const toPhones = (room, str) => room.phones.forEach(p => safeSend(p.ws, str));

function dropPhone(room, p, why) {
  if (p.ws) { safeSend(p.ws, J({ t: why || 'kicked' })); try { p.ws.close(); } catch (e) {} p.ws.ctx = null; }
  room.phones.delete(p.id); room.byTok.delete(p.tok);
}

function onHost(ws, m) {
  let room = null;
  const code = String(m.code || '').toUpperCase();
  const key = String(m.key || '').slice(0, 40);
  const ex = rooms.get(code);
  if (ex && ex.key === key && key) {
    room = ex;
    if (room.host && room.host !== ws) { room.host.ctx = null; try { room.host.close(); } catch (e) {} }
  } else if (!ex && /^[A-Z]{4}$/.test(code) && key.length >= 8) {
    room = { code, key, host: null, phones: new Map(), byTok: new Map(), lastMsg: null, hostLeft: 0 };
    rooms.set(code, room);
  } else {
    room = { code: newCode(), key: rand(16, 'abcdefghijklmnopqrstuvwxyz0123456789'), host: null, phones: new Map(), byTok: new Map(), lastMsg: null, hostLeft: 0 };
    rooms.set(room.code, room);
  }
  room.host = ws; room.hostLeft = 0; ws.ctx = { role: 'host', room };
  safeSend(ws, J({ t: 'hosted', code: room.code, key: room.key }));
  sendRoster(room);
  toPhones(room, J({ t: 'host', on: true }));
}

function onJoin(ws, m) {
  const room = rooms.get(String(m.code || '').toUpperCase().trim());
  if (!room) return safeSend(ws, J({ t: 'err', e: 'noroom' }));
  const tok = String(m.tok || '').slice(0, 40);
  if (tok.length < 8) return safeSend(ws, J({ t: 'err', e: 'bad' }));
  const name = cleanName(m.name) || 'Player';
  let p = room.phones.get(room.byTok.get(tok));
  if (p) {
    if (p.ws && p.ws !== ws) { p.ws.ctx = null; try { p.ws.close(); } catch (e) {} }
    if (m.name) p.name = name;
  } else {
    if (room.phones.size >= MAX_PHONES) return safeSend(ws, J({ t: 'err', e: 'full' }));
    let id = String(m.id || '');
    if (!/^p[a-z0-9]{3,6}$/.test(id) || room.phones.has(id)) { do { id = 'p' + rand(4, 'abcdefghjkmnpqrstuvwxyz23456789'); } while (room.phones.has(id)); }
    p = { id, tok, name, ws: null };
    room.phones.set(id, p); room.byTok.set(tok, id);
  }
  p.ws = ws; ws.ctx = { role: 'phone', room, id: p.id };
  safeSend(ws, J({ t: 'joined', id: p.id, name: p.name, code: room.code }));
  safeSend(ws, J({ t: 'host', on: !!room.host }));
  if (room.lastMsg) safeSend(ws, room.lastMsg);
  sendRoster(room);
}

wss.on('connection', ws => {
  ws.isAlive = true; ws.ctx = null;ws.msgWindow=Date.now();ws.msgCount=0;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw.toString()); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    const now=Date.now();if(now-ws.msgWindow>1000){ws.msgWindow=now;ws.msgCount=0;}
    if(++ws.msgCount>30)return;
    const c = ws.ctx;
    switch (m.t) {
      case 'ping': return safeSend(ws, J({ t: 'pong' }));
      // The role and room are bound at the first successful handshake. Without this
      // guard, another join/host message can abandon a seat while keeping the
      // old room's host or phone reference pointing to the same socket.
      case 'host': return c ? safeSend(ws, J({ t: 'err', e: 'already' })) : onHost(ws, m);
      case 'join': return c ? safeSend(ws, J({ t: 'err', e: 'already' })) : onJoin(ws, m);
      case 'bcast':
        if (c && c.role === 'host') { c.room.lastMsg = J({ t: 'd', d: m.d }); toPhones(c.room, c.room.lastMsg); }
        return;
      case 'private':
        if(c && c.role==='host') { const dest=c.room.phones.get(String(m.id||''));if(dest)safeSend(dest.ws,J({t:'priv',d:m.d})); }
        return;
      case 'kick':
        if (c && c.role === 'host') { const p = c.room.phones.get(String(m.id)); if (p) { dropPhone(c.room, p, 'kicked'); sendRoster(c.room); } }
        return;
      case 'a':
        if (c && c.role === 'phone') safeSend(c.room.host, J({ t: 'a', id: c.id, a: m.a }));
        return;
      case 'leave':
        if (c && c.role === 'phone') { const p = c.room.phones.get(c.id); if (p) { dropPhone(c.room, p, 'left'); sendRoster(c.room); } }
        return;
    }
  });
  ws.on('close', () => {
    const c = ws.ctx; if (!c) return;
    if (c.role === 'host' && c.room.host === ws) {
      c.room.host = null; c.room.hostLeft = Date.now();
      toPhones(c.room, J({ t: 'host', on: false }));
    } else if (c.role === 'phone') {
      const p = c.room.phones.get(c.id);
      if (p && p.ws === ws) { p.ws = null; sendRoster(c.room); }
    }
  });
  ws.on('error', () => {});
});

setInterval(() => {
  wss.clients.forEach(ws => { if (!ws.isAlive) return ws.terminate(); ws.isAlive = false; try { ws.ping(); } catch (e) {} });
  const now = Date.now();
  rooms.forEach((room, code) => {
    if (!room.host && room.hostLeft && now - room.hostLeft > HOST_GRACE_MS) {
      room.phones.forEach(p => dropPhone(room, p, 'left'));
      rooms.delete(code);
    }
  });
}, 25000);

server.listen(PORT, () => {
  console.log('\n  GILDED FIVE is running.\n');
  console.log('  On this computer, open:   http://localhost:' + PORT);
  lanAddresses().slice(0, 2).forEach(a => console.log('  Phones will join through: http://' + a + ':' + PORT + '/play'));
  console.log('\n  Keep this window open while you play. Press Ctrl+C to stop.\n');
});
