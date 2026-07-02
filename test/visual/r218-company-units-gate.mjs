// [test:uuid:1d469c7b-e3fa-4c8c-a972-26cf1ad6ba25] R21.8 mintOrReuseShared — company shared dedup + suggest + nameKey
// R21.8 gate — companies as SHARED scenario units (ior:class:Company), v0.6.72.
// Impl a52245de1. CompanyIndex: companyNameKey (legal-suffix strip), mintOrReuseShared
// (dedup by domain then nameKey), suggest() autocomplete, linkToProfile -> Profile.companies[].
//
// Per DET iter (2 persistent users, one shared brand expressed two ways):
//  AC-c1/c2 + seed: GET /api/company/suggest?q=cer -> Cerulean Circle (seeded) + create row.
//  AC-a4 nameKey:   "Zorblax<RUN><i> GmbH & Co KG" -> nameKey === "zorblax<run><i>"
//                   (token-wise legal-suffix + trailing 'and' connector stripped).
//  AC-f2 dedup:     userA commits "<brand> GmbH & Co KG", userB commits "<brand>" -> the SAME
//                   shared Company uuid linked into BOTH Profile.companies[].
//  AC-f1:           Company unit ownerIor === null (shared, unowned).
//  AC-c2:           suggest.create === `Create "<brand>"`.
// Company uuid discovered via the suggest API; Company/Profile units read from local
// scenario/index (prod serves this checkout) only to confirm ownerIor + shared linkage.

import WebSocket from 'ws';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const HOST = 'prod.wo-da.de', PORT = 4444, WSS = `wss://${HOST}:${PORT}`;
const SCEN = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';
const RUN = randomUUID().slice(0, 8);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const _get1 = (p) => new Promise((res) => {
  const req = https.get({ host: HOST, port: PORT, path: p, rejectUnauthorized: false, timeout: 8000 }, (r) => {
    let d = ''; r.on('data', (c) => d += c); r.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, json: j, body: d }); });
  });
  req.on('error', () => res({ status: 0, json: null })); req.on('timeout', () => { req.destroy(); res({ status: 0, json: null }); });
});
const apiGet = async (p) => { let r; for (let t = 0; t < 4; t++) { r = await _get1(p); if (r.status !== 0) return r; await sleep(300); } return r; };
const suggest = (q) => apiGet('/api/company/suggest?q=' + encodeURIComponent(q));

const pathFor = (uuid) => path.join(SCEN, ...uuid.slice(0, 5).split(''), uuid + '.scenario.json');
const readUnit = (uuid) => { try { return JSON.parse(fs.readFileSync(pathFor(uuid), 'utf8')); } catch { return null; } };
const companyRefs = (token) => ((readUnit(token)?.model?.companies) || []).map(r => String(r).replace('ior:instance:', ''));

function session() {
  const token = randomUUID();
  const ws = new WebSocket(WSS, { rejectUnauthorized: false });
  const ready = new Promise((res) => { ws.on('message', (raw) => { let m; try { m = JSON.parse(raw.toString()); } catch { return; } if (m.type === 'welcome') { ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: token, deviceId: '' })); res(); } }); ws.on('error', () => {}); });
  return { token, ready, send: (o) => ws.send(JSON.stringify(o)), close: () => { try { ws.close(); } catch {} } };
}

console.log(`=== R21.8 company shared-units gate @ ${WSS} (run ${RUN}) ===`);
const A = session(), B = session();
await Promise.all([A.ready, B.ready]);
A.send({ type: 'UPDATE_PROFILE', name: `r218-A-${RUN}`, secretCode: '1234' });
B.send({ type: 'UPDATE_PROFILE', name: `r218-B-${RUN}`, secretCode: '1234' });
await sleep(1500);
console.log(`users A=${A.token.slice(0, 8)} B=${B.token.slice(0, 8)}`);

const results = [];
for (let i = 1; i <= 3; i++) {
  const brand = `Zorblax${RUN}${i}`;        // single alnum token, unique per iter
  const expectKey = brand.toLowerCase();     // RUN is lowercase hex

  // seeded Cerulean Circle + create row (AC-c1/c2)
  const cer = await suggest('cer');
  const ceruleanOk = cer.status === 200 && Array.isArray(cer.json?.suggestions)
    && cer.json.suggestions.some(s => s.nameKey === 'ceruleancircle' && /cerulean/i.test(s.name))
    && cer.json.create === 'Create "cer"';

  // two profiles, same brand, different legal forms
  A.send({ type: 'UPDATE_PROFILE', name: `r218-A-${RUN}`, companies: [`${brand} GmbH & Co KG`] });
  B.send({ type: 'UPDATE_PROFILE', name: `r218-B-${RUN}`, companies: [brand] });

  // poll suggest until the brand appears (server writes async)
  let sug = null, hit = null;
  for (let t = 0; t < 20; t++) {
    sug = await suggest(brand);
    hit = sug.json?.suggestions?.find(s => s.nameKey === expectKey);
    if (hit) break; await sleep(500);
  }
  const createRow = sug?.json?.create === `Create "${brand}"`;           // AC-c2
  const nameKeyOk = !!hit && hit.nameKey === expectKey;                  // AC-a4
  const X = hit?.uuid;

  // dedup: BOTH profiles link the SAME shared company uuid (retry read-during-write)
  let sharedOk = false;
  for (let t = 0; t < 16; t++) { if (X && companyRefs(A.token).includes(X) && companyRefs(B.token).includes(X)) { sharedOk = true; break; } await sleep(500); }

  // Company unit: ownerIor null (AC-f1), nameKey matches
  const cu = X ? readUnit(X) : null;
  const ownerNull = !!cu && cu.ior === 'ior:class:Company' && cu.ownerIor === null;
  const unitKeyOk = !!cu && cu.model?.nameKey === expectKey;

  const pass = ceruleanOk && nameKeyOk && createRow && sharedOk && ownerNull && unitKeyOk;
  results.push({ i, pass });
  console.log(`iter ${i}: brand="${brand}" cerSeed=${ceruleanOk} createRow=${createRow} uuid=${X ? X.slice(0, 8) : 'NF'} nameKey="${hit?.nameKey ?? '-'}"==${expectKey}:${nameKeyOk} sharedByBoth=${sharedOk} ownerIor=null:${ownerNull} unitKey=${unitKeyOk} => ${pass ? 'GREEN' : 'RED'}`);
}
A.close(); B.close();

console.log('\n=== VERDICT R21.8 (DET-3x) ===');
results.forEach(r => console.log(`  iter ${r.i}: ${r.pass ? 'GREEN' : 'RED'}`));
console.log(`  POLLUTION: 2 test users (r218-${RUN}) + 3 shared company units — flag for purge.`);
const green = results.length === 3 && results.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
