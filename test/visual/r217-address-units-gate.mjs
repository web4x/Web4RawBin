// [test:uuid:0802991c-b3af-4e70-a5bb-cdc8ddde57c0] R21.7 mintAndVerifyAsync — address unit + async OSM verify flip + badge
// R21.7 gate — addresses as scenario units + async OSM (Nominatim) verify, v0.6.71.
// Impl 3cf79d5d3. Server (server.ts): committed UPDATE_PROFILE{addresses[]} ->
// indexProfileAddress -> AddressIndex.mintAddress (SYNC, verified:false, links null,
// pushes Profile.addresses[]) + enqueueAddressVerify (background, <=1 req/s, Nominatim
// /search; HIT -> applyVerification verified:true + osmLink + gmapsLink). Badge endpoint
// GET /api/address/<uuid> -> { verified, osmLink, gmapsLink, oneLine }.
//
// Prod serves from THIS checkout (tsx watch .../2cuGitHub/Web4RawBin) so scenario/index
// is on local disk — used ONLY to discover the minted Address uuid (an internal id with
// no public list endpoint). All ACCEPTANCE assertions go through the live API.
//
// Per iter (DET-3x, 3 distinct real Berlin addresses on one self-created user):
//   AC1: Profile.addresses[] holds the new unit + badge.verified===false initially
//   AC2: GET /api/address/<uuid> returns the badge state
//   AC3: async Nominatim flips verified->true with osmLink (mlat/mlon) + gmapsLink (q=lat,lon)

import WebSocket from 'ws';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const HOST = 'prod.wo-da.de', PORT = 4444, WSS = `wss://${HOST}:${PORT}`;
const SCEN = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';
const RUN = randomUUID().slice(0, 8);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const norm = (s) => String(s || '').trim().replace(/\s+/g, ' ');

const _get1 = (p) => new Promise((res) => {
  const req = https.get({ host: HOST, port: PORT, path: p, rejectUnauthorized: false, timeout: 8000 }, (r) => {
    let d = ''; r.on('data', (c) => d += c); r.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, json: j, body: d }); });
  });
  req.on('error', () => res({ status: 0, json: null })); req.on('timeout', () => { req.destroy(); res({ status: 0, json: null }); });
});
const apiGet = async (p) => { let r; for (let t = 0; t < 4; t++) { r = await _get1(p); if (r.status !== 0) return r; await sleep(300); } return r; };

const pathFor = (uuid) => path.join(SCEN, ...uuid.slice(0, 5).split(''), uuid + '.scenario.json');
const readUnit = (uuid) => { try { return JSON.parse(fs.readFileSync(pathFor(uuid), 'utf8')); } catch { return null; } };

function session() {
  const token = randomUUID(); const msgs = [];
  const ws = new WebSocket(WSS, { rejectUnauthorized: false });
  const ready = new Promise((res) => { ws.on('message', (raw) => { let m; try { m = JSON.parse(raw.toString()); } catch { return; } if (m.type === 'welcome') { ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: token, deviceId: '' })); res(); } else msgs.push(m); }); ws.on('error', () => {}); });
  return { token, msgs, ready, send: (o) => ws.send(JSON.stringify(o)), close: () => { try { ws.close(); } catch {} } };
}

// Discover the addrUuid in MY profile whose oneLine matches (disk read, internal id only)
function discover(token, oneLine) {
  const prof = readUnit(token);
  if (!prof) return { profExists: false };
  const refs = (prof.model?.addresses || []).map(r => String(r).replace('ior:instance:', ''));
  for (const u of refs) { const au = readUnit(u); if (au && norm(au.model?.oneLine) === norm(oneLine)) return { profExists: true, refs, uuid: u }; }
  return { profExists: true, refs, uuid: null };
}
// Retry: the server writes the Profile/Address unit files async to our read; a read can
// land before the write flushes or mid-write (parse fails -> null). Poll until found.
async function discoverRetry(token, oneLine, tries = 16) {
  let d; for (let t = 0; t < tries; t++) { d = discover(token, oneLine); if (d.uuid) return d; await sleep(500); } return d;
}

// Each iter: one REAL address (geocodes -> flips verified) + one GARBAGE address
// (can't geocode -> verified stays false). Garbage gives a RACE-FREE assertion of AC1
// (sync mint -> verified:false) and AC-c5 (Nominatim MISS stays unverified), observable
// at any time. Real address proves AC3 (flip -> verified:true + osm/gmaps links).
const REAL = [
  'DE Berlin 10117 Friedrichstrasse 43',
  'DE Berlin 10115 Invalidenstrasse 43',
  'DE Berlin 10178 Karl-Liebknecht-Strasse 5',
];
const garbage = (i) => `ZZ Nowhere${RUN}${i} 00000 Nostreet${RUN}${i} 0`; // high-entropy -> Nominatim MISS

console.log(`=== R21.7 address units + OSM verify gate @ ${WSS} (run ${RUN}) ===`);
const u = session();
await u.ready;
u.send({ type: 'UPDATE_PROFILE', name: `r217-gate-${RUN}`, secretCode: '1234' });
await sleep(1500);
console.log('test user token=', u.token);

const results = [];
for (let i = 0; i < 3; i++) {
  const real = REAL[i], garb = garbage(i);
  u.send({ type: 'UPDATE_PROFILE', name: `r217-gate-${RUN}`, addresses: [real, garb] });
  await sleep(900); // sync mint writes both units

  const dR = await discoverRetry(u.token, real), dG = await discoverRetry(u.token, garb);
  const profilePopulated = !!(dR.profExists && dR.uuid && dG.uuid && (dR.refs || []).includes(dR.uuid) && dR.refs.includes(dG.uuid));

  // AC1 + AC-c5 (race-free): garbage unit created verified:false and STAYS false (MISS)
  const bG = dG.uuid ? await apiGet('/api/address/' + dG.uuid) : null;
  const garbageInitFalse = !!(bG?.status === 200 && bG.json && bG.json.verified === false && 'oneLine' in bG.json); // AC1 + AC2 shape

  // AC2: real badge returns state
  const bR0 = dR.uuid ? await apiGet('/api/address/' + dR.uuid) : null;
  const badgeReturns = !!(bR0?.status === 200 && bR0.json && typeof bR0.json.verified === 'boolean' && 'oneLine' in bR0.json);

  // AC3: real address async Nominatim flip -> verified:true + links
  let flipped = false, final = bR0;
  if (dR.uuid) for (let t = 0; t < 30; t++) { final = await apiGet('/api/address/' + dR.uuid); if (final.json?.verified === true) { flipped = true; break; } await sleep(1000); }
  const osmOk = !!final?.json?.osmLink && /mlat=|#map=/.test(final.json.osmLink);
  const gmapsOk = !!final?.json?.gmapsLink && /q=/.test(final.json.gmapsLink);

  // AC-c5: garbage still unverified after the wait
  const bGafter = dG.uuid ? await apiGet('/api/address/' + dG.uuid) : null;
  const garbageStaysFalse = bGafter?.json?.verified === false;

  const pass = profilePopulated && garbageInitFalse && badgeReturns && flipped && osmOk && gmapsOk && garbageStaysFalse;
  results.push({ i: i + 1, pass });
  console.log(`iter ${i + 1}: real=${dR.uuid?.slice(0, 8) || 'NF'} garb=${dG.uuid?.slice(0, 8) || 'NF'} profPop=${profilePopulated} garbInitFalse=${garbageInitFalse} badge=${badgeReturns} realFlipped=${flipped} osm=${osmOk} gmaps=${gmapsOk} garbStaysFalse=${garbageStaysFalse} => ${pass ? 'GREEN' : 'RED'}`);
  if (final?.json) console.log(`   real badge: verified=${final.json.verified} osm=${(final.json.osmLink || '').slice(0, 50)} gmaps=${(final.json.gmapsLink || '').slice(0, 42)}`);
}
u.close();

console.log('\n=== VERDICT R21.7 (DET-3x) ===');
results.forEach(r => console.log(`  iter ${r.i}: ${r.pass ? 'GREEN' : 'RED'}`));
console.log(`  POLLUTION: 1 test user (${u.token}) + 3 address units, tagged r217-${RUN} — flag for purge.`);
const green = results.length === 3 && results.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
