// R21.8 AC-b3 RE-GATE — present-but-unmatched domain mints a DISTINCT Company unit
// (does NOT fall through to nameKey reuse). Fix c22083798 v0.6.73, on top of 446d39d3e.
//
// CompanyIndex.mintOrReuseShared: domain present + no domain match -> mint separate unit
// (nameKey recall gated on no-domain). So same nameKey + different domain = 2 units.
//
// Per DET iter (2 users, same brand/nameKey, different domains):
//   A: {name:<brand>, domain:'apple.com'}        -> U1
//   B: {name:<brand>, domain:'apple-fruit.de'}   -> U2  (DISTINCT from U1, AC-b3)
//   assert: suggest?q=<brand> returns 2 entries, distinct uuids, both nameKey=<key>,
//           domains {apple.com, apple-fruit.de}; units ownerIor null.
//   positive control: A re-commits same {brand, apple.com} -> still U1 (no 3rd unit).
//   no-domain control: bare <brand> -> nameKey recall -> U1 (first unit).

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
  const req = https.get({ host: HOST, port: PORT, path: p, rejectUnauthorized: false, timeout: 8000 }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, json: j }); }); });
  req.on('error', () => res({ status: 0, json: null })); req.on('timeout', () => { req.destroy(); res({ status: 0, json: null }); });
});
const apiGet = async (p) => { let r; for (let t = 0; t < 4; t++) { r = await _get1(p); if (r.status !== 0) return r; await sleep(300); } return r; };
const suggest = (q) => apiGet('/api/company/suggest?q=' + encodeURIComponent(q));
const pathFor = (u) => path.join(SCEN, ...u.slice(0, 5).split(''), u + '.scenario.json');
const readUnit = (u) => { try { return JSON.parse(fs.readFileSync(pathFor(u), 'utf8')); } catch { return null; } };

// ready resolves on the server's PROFILE (proves IDENTIFY was PROCESSED, not merely sent —
// sending UPDATE_PROFILE before that races "Not identified" and the commit is dropped).
function session() {
  const token = randomUUID(); let done; const ready = new Promise(r => done = r);
  const ws = new WebSocket(WSS, { rejectUnauthorized: false });
  ws.on('message', (raw) => { let m; try { m = JSON.parse(raw.toString()); } catch { return; } if (m.type === 'welcome') ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: token, deviceId: '' })); else if (m.type === 'PROFILE') done(); });
  ws.on('error', () => {});
  return { token, ready, send: (o) => ws.send(JSON.stringify(o)), close: () => { try { ws.close(); } catch {} } };
}

console.log(`=== R21.8 AC-b3 domain-distinct re-gate @ ${WSS} (run ${RUN}) ===`);
const distinctUuids = (q, key) => suggest(q).then(s => [...new Set((s.json?.suggestions || []).filter(x => x.nameKey === key).map(x => x.uuid))]);

const results = [];
for (let i = 1; i <= 3; i++) {
  const brand = `Apple${RUN}${i}`, key = brand.toLowerCase();
  // Domain is GLOBALLY authoritative — reusing a registered domain returns its first unit.
  // So each iter needs UNIQUE domains to mint fresh (mirrors apple.com vs apple-fruit.de).
  const dom1 = `${key}.com`, dom2 = `${key}-fruit.de`;
  // FRESH short-lived session per iter (long-lived sessions decay across many sends)
  const u = session(); await u.ready;
  u.send({ type: 'UPDATE_PROFILE', name: `r218b-${RUN}-${i}`, secretCode: '1234' });
  await sleep(800);
  // both domain variants in ONE update -> mint U1(dom1) then DISTINCT U2(dom2) — same nameKey
  u.send({ type: 'UPDATE_PROFILE', name: `r218b-${RUN}-${i}`, companies: [{ name: brand, domain: dom1 }, { name: brand, domain: dom2 }] });

  let units = [];
  for (let t = 0; t < 24; t++) { const s = await suggest(brand); units = (s.json?.suggestions || []).filter(x => x.nameKey === key); if (units.length >= 2) break; await sleep(500); }
  const uuids = [...new Set(units.map(x => x.uuid))];
  const domains = new Set(units.map(x => x.domain));
  const twoDistinct = uuids.length === 2;                                        // AC-b3 core
  const domainsOk = domains.has(dom1) && domains.has(dom2);
  const ownerNull = uuids.length === 2 && uuids.every(x => { const cu = readUnit(x); return cu && cu.ior === 'ior:class:Company' && cu.ownerIor === null && cu.model?.nameKey === key; });

  // control 1: re-commit same {brand, dom1} -> no NEW unit (domain match reuses U1)
  u.send({ type: 'UPDATE_PROFILE', name: `r218b-${RUN}-${i}`, companies: [{ name: brand, domain: dom1 }] });
  await sleep(1300);
  const afterSameDomain = (await distinctUuids(brand, key)).length === 2;
  // control 2: bare name (no domain) -> nameKey recall, still no 3rd unit
  u.send({ type: 'UPDATE_PROFILE', name: `r218b-${RUN}-${i}`, companies: [brand] });
  await sleep(1300);
  const afterBareName = (await distinctUuids(brand, key)).length === 2;
  u.close();

  const pass = twoDistinct && domainsOk && ownerNull && afterSameDomain && afterBareName;
  results.push({ i, pass });
  console.log(`iter ${i}: units=${uuids.length} distinct=${twoDistinct} domains={${[...domains].join(',')}} domOk=${domainsOk} ownerNull+key=${ownerNull} sameDomainReuse(==2)=${afterSameDomain} bareNameRecall(==2)=${afterBareName} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT R21.8 AC-b3 (DET-3x) ===');
results.forEach(r => console.log(`  iter ${r.i}: ${r.pass ? 'GREEN' : 'RED'}`));
console.log(`  POLLUTION: 3 test users (r218b-${RUN}-*) + 6 company units — flag for purge.`);
const green = results.length === 3 && results.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
