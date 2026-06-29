// R21.3/R21.4 phone-as-identity gate — same phone = ONE identity. Pollution-free
// (curl + wss probe with an ephemeral NON-minting token; no SystemTester user created).
//
// The bug: Tron had 3 "Marcel Donges" profiles sharing the landline +4981422917723.
// Expert merged 3->1 (non-destructive consolidate, 8c583ec51): primary 8f74dfba;
// 3effa1fc + 2703628c now redirectTo=8f74dfba (NOT deleted). +4915253844085 was test
// pollution, removed. Re-gate criteria (DET-3x):
//   (1) NORMALIZE: '+49 8142 2917723' / '+49-8142-2917723' / '+4981422917723' -> same key.
//   (2) CHALLENGE: connecting with the landline -> KNOWN_KEY_CHALLENGE -> primary, no mint.
//   (3) MERGE:     exactly ONE ACTIVE (no redirectTo) "Marcel Donges" = primary 8f74dfba;
//                  /api/phone/+4981422917723 -> 8f74dfba.
//   (4) ROOMS:     Heartspaces (6c04f959) + Marcel's Room (8be52aa9) owned by primary.

import WebSocket from 'ws';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const HOST = 'prod.wo-da.de', PORT = 4444, WSS = `wss://${HOST}:${PORT}`;
const ROOT = '/var/dev/Workspaces/2cuGitHub/Web4RawBin';
const PROFILES = `${ROOT}/data/profiles.json`;
const LANDLINE = '+4981422917723';
const PRIMARY = '8f74dfba-ccf6-4f52-9c0d-b3c327ee53dd';
const HEARTSPACES = '6c04f959-f3d6-42eb-818f-5e2e4498bf91';
const MARCEL_ROOM = '8be52aa9-7db8-4e3a-8356-eed920dd1f1a';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const apiGet = (p) => new Promise((res) => {
  const req = https.get({ host: HOST, port: PORT, path: p, rejectUnauthorized: false, timeout: 8000 }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, json: j }); }); });
  req.on('error', () => res({ status: 0, json: null })); req.on('timeout', () => { req.destroy(); res({ status: 0, json: null }); });
});
const phone = (raw) => apiGet('/api/phone/' + encodeURIComponent(raw));

function probe(ph, ms = 2800) {
  return new Promise((res) => {
    const token = randomUUID(); const msgs = [];
    const ws = new WebSocket(WSS, { rejectUnauthorized: false });
    let s = false; const id = () => { if (s) return; s = true; ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: token, deviceId: '', phone: ph })); };
    ws.on('open', () => setTimeout(id, 250));
    ws.on('message', (r) => { let m; try { m = JSON.parse(r.toString()); } catch { return; } if (m.type === 'welcome') return id(); msgs.push(m); });
    ws.on('error', () => {});
    setTimeout(() => { try { ws.close(); } catch {} res(msgs); }, ms);
  });
}
const activeMarcels = () => { try { return JSON.parse(fs.readFileSync(PROFILES, 'utf8')).filter(p => p.name === 'Marcel Donges' && !p.redirectTo); } catch { return null; } };
const shardPath = (u) => path.join(ROOT, 'scenario/index', ...u.slice(0, 5).split(''), u + '.scenario.json');
const roomOwner = (uuid) => { try { const u = JSON.parse(fs.readFileSync(shardPath(uuid), 'utf8')); return String(u.ownerIor || u.model?.creatorToken || '').replace('ior:instance:', ''); } catch { return null; } };

const results = [];
for (let run = 1; run <= 3; run++) {
  // (1) NORMALIZE
  const keys = [];
  for (const f of ['+49 8142 2917723', '+49-8142-2917723', '+4981422917723']) keys.push((await phone(f)).json?.key);
  const normOk = keys.every(k => k === '+4981422917723');

  // (2) CHALLENGE -> primary, no mint
  const msgs = await probe(LANDLINE);
  const ch = msgs.find(m => m.type === 'KNOWN_KEY_CHALLENGE'); const minted = msgs.find(m => m.type === 'PROFILE');
  const challengeOk = !!ch && ch.profileUuid === PRIMARY && !minted;

  // (3) MERGE
  const land = (await phone(LANDLINE)).json?.profileUuid;
  const act = activeMarcels();
  const mergeOk = !!act && act.length === 1 && act[0].token === PRIMARY && land === PRIMARY;

  // (4) ROOMS under primary
  const hOwner = roomOwner(HEARTSPACES), mOwner = roomOwner(MARCEL_ROOM);
  const roomsOk = hOwner === PRIMARY && mOwner === PRIMARY;

  const pass = normOk && challengeOk && mergeOk && roomsOk;
  results.push(pass);
  console.log(`run ${run}: (1)normalize=${normOk} | (2)challenge[->${ch?.profileUuid?.slice(0, 8)} noMint=${!minted}]=${challengeOk} | (3)merge[activeMarcel=${act ? act.length : '?'} land->${land?.slice(0, 8)}]=${mergeOk} | (4)rooms[heart=${hOwner?.slice(0, 8)} marcel=${mOwner?.slice(0, 8)}]=${roomsOk} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT phone-as-identity merge (DET-3x) ===');
results.forEach((p, i) => console.log(`  run ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
