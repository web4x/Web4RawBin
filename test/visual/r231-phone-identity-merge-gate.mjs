// R21.3/R21.4 phone-as-identity gate — same phone = ONE identity. Pollution-free
// (curl + wss probe with an ephemeral NON-minting token; no SystemTester user created).
//
// The bug (PO-reported): Tron has 3 separate "Marcel Donges" profiles sharing one phone.
// After the expert normalizes + MERGES, this gate must be GREEN. Three checks, DET-3x:
//   (1) NORMALIZE: a phone in spaces / dashes / plain form -> the SAME /api/phone key.
//   (2) CHALLENGE: connecting with a known phone -> KNOWN_KEY_CHALLENGE, NOT a new mint.
//   (3) MERGE:     the phone resolves to ONE identity, mobile + landline -> the SAME
//                  profile uuid, and exactly ONE committed "Marcel Donges" profile exists.

import WebSocket from 'ws';
import https from 'https';
import fs from 'fs';
import { randomUUID } from 'crypto';

const HOST = 'prod.wo-da.de', PORT = 4444, WSS = `wss://${HOST}:${PORT}`;
const PROFILES = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/data/profiles.json';
const TRON_MOBILE = '+4915253844085';
const TRON_LANDLINE = '+4981422917723';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const apiGet = (p) => new Promise((res) => {
  const req = https.get({ host: HOST, port: PORT, path: p, rejectUnauthorized: false, timeout: 8000 }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, json: j }); }); });
  req.on('error', () => res({ status: 0, json: null })); req.on('timeout', () => { req.destroy(); res({ status: 0, json: null }); });
});
const phone = (raw) => apiGet('/api/phone/' + encodeURIComponent(raw));

// ephemeral fresh-token IDENTIFY probe (challenge path breaks BEFORE mint -> creates no user)
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
// count committed "Marcel Donges" profiles whose normalized phone is one of Tron's numbers
function tronProfileCount() {
  try {
    const arr = JSON.parse(fs.readFileSync(PROFILES, 'utf8'));
    const norm = (p) => '+' + String(p || '').replace(/\D/g, '');
    const nums = new Set([TRON_MOBILE, TRON_LANDLINE]);
    return arr.filter(p => p.name === 'Marcel Donges' && (nums.has(norm(p.phone)))).length;
  } catch { return -1; }
}

const results = [];
for (let run = 1; run <= 3; run++) {
  // (1) NORMALIZE — 3 formats of the landline -> same key
  const fmts = ['+49 8142 2917723', '+49-8142-2917723', '+4981422917723'];
  const keys = [];
  for (const f of fmts) { const r = await phone(f); keys.push(r.json?.key); }
  const normOk = keys.every(k => k === '+4981422917723');

  // (2) CHALLENGE — known phone -> KNOWN_KEY_CHALLENGE, no mint
  const ch = (msgs) => { const c = msgs.find(m => m.type === 'KNOWN_KEY_CHALLENGE'); const mint = msgs.find(m => m.type === 'PROFILE'); return { challenged: !!c, uuid: c?.profileUuid, minted: !!mint }; };
  const cm = ch(await probe(TRON_MOBILE));
  const cl = ch(await probe(TRON_LANDLINE));
  const challengeOk = cm.challenged && !cm.minted && cl.challenged && !cl.minted;

  // (3) MERGE — mobile + landline resolve to the SAME identity, and ONE Marcel Donges profile
  const mUuid = (await phone(TRON_MOBILE)).json?.profileUuid;
  const lUuid = (await phone(TRON_LANDLINE)).json?.profileUuid;
  const count = tronProfileCount();
  const mergeOk = !!mUuid && mUuid === lUuid && count === 1;

  const pass = normOk && challengeOk && mergeOk;
  results.push(pass);
  console.log(`run ${run}: (1)normalize[${keys.join(',')}]=${normOk} | (2)challenge[mob=${cm.uuid?.slice(0,8)}/${!cm.minted} land=${cl.uuid?.slice(0,8)}/${!cl.minted}]=${challengeOk} | (3)merge[mob=${mUuid?.slice(0,8)} land=${lUuid?.slice(0,8)} sameId=${mUuid===lUuid} MarcelProfiles=${count}]=${mergeOk} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT phone-as-identity (DET-3x) ===');
results.forEach((p, i) => console.log(`  run ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (merge pending — 3 Marcel Donges profiles, mobile/landline -> different uuids)');
process.exit(green ? 0 : 1);
