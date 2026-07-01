// T26.3 v0.7.4 gate — server-to-server federation fetch API (capability-grant auth). HTTP-only,
// stateless HMAC grants (no storage) → ZERO pollution. SystemTester token mints grants. DET-3x.
//   (1) GET /api/scenario/<uuid> without grant → 403.
//   (2) GET /api/scenario/<uuid>/grant?token=<SystemTester> → { grant } valid token.
//   (3) GET /api/scenario/<uuid>?grant=<G> → 200 + { unit } JSON.
//   (4) GET /api/scenario/<file>/content?grant=<G> → 200 + bytes.
//   (5) GET /api/scenario/<unit-with-children>/children?grant=<G> → children stamped @originHost.

import https from 'https';
import { execSync } from 'child_process';

const HOST = 'prod.wo-da.de', PORT = 4444, ORIGIN = `https://${HOST}:${PORT}`;
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const WEBITEM = 'c8dc9d0d-ad6d-4d1e-a3af-7967cccdb37d';   // unit JSON
const ICS = 'b57d2f42-0cc4-4fa4-84c6-acaebe40a48a';       // File with content
const SCEN = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';
const CHILDREN_UNIT = execSync(`find ${SCEN}/2/3/a/3/f -name '23a3f882*.scenario.json'`, { encoding: 'utf8' }).trim().split('/').pop().replace('.scenario.json', ''); // WebItem w/ 1 child

const get = (path) => new Promise((res) => {
  const r = https.get({ host: HOST, port: PORT, path, rejectUnauthorized: false, timeout: 8000 }, (x) => { const chunks = []; x.on('data', c => chunks.push(c)); x.on('end', () => { const buf = Buffer.concat(chunks); let json = null; try { json = JSON.parse(buf.toString('utf8')); } catch {} res({ status: x.statusCode, buf, json, ctype: x.headers['content-type'] || '' }); }); });
  r.on('error', () => res({ status: 0 })); r.on('timeout', () => { r.destroy(); res({ status: 0 }); });
});
const mintGrant = async (uuid) => { const r = await get(`/api/scenario/${uuid}/grant?token=${ST}`); return { status: r.status, grant: r.json?.grant || '' }; };

const results = [];
for (let i = 1; i <= 3; i++) {
  // (1) no grant -> 403
  const noGrant = await get(`/api/scenario/${WEBITEM}`);
  const item1 = noGrant.status === 403;
  // mint requires an identified user (no token -> 403), with token -> valid grant
  const noToken = await get(`/api/scenario/${WEBITEM}/grant`);
  const g = await mintGrant(WEBITEM);
  const item2 = noToken.status === 403 && g.status === 200 && typeof g.grant === 'string' && g.grant.length > 20 && g.grant.includes('.');
  // (3) fetch with grant -> 200 unit JSON
  const fetched = await get(`/api/scenario/${WEBITEM}?grant=${encodeURIComponent(g.grant)}`);
  const item3 = fetched.status === 200 && fetched.json?.unit?.ior === 'ior:class:WebItem' && fetched.json.unit.model?.uuid === WEBITEM;
  // (4) /content with grant -> bytes
  const gc = await mintGrant(ICS);
  const content = await get(`/api/scenario/${ICS}/content?grant=${encodeURIComponent(gc.grant)}`);
  const item4 = content.status === 200 && content.buf?.byteLength > 0 && !/json/.test(content.ctype);
  // (5) /children -> children stamped @originHost
  const gch = await mintGrant(CHILDREN_UNIT);
  const children = await get(`/api/scenario/${CHILDREN_UNIT}/children?grant=${encodeURIComponent(gch.grant)}`);
  const ch = children.json?.children || [];
  const item5 = children.status === 200 && ch.length > 0 && ch.every(c => typeof c.ior === 'string' && c.ior.includes(`@${ORIGIN}`));

  const pass = item1 && item2 && item3 && item4 && item5;
  results.push(pass);
  console.log(`iter ${i}: (1)no-grant-403=${item1} (2)mint[noTok=${noToken.status},grant=${g.grant.slice(0, 10)}…]=${item2} (3)unit-json=${item3} (4)content-bytes=${item4}(${content.buf?.byteLength}b) (5)children@host=${item5}(${ch.length}) => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT T26.3 federation API (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('HTTP-only, stateless HMAC grants — 0 prod writes, 0 pollution.');
process.exit(green ? 0 : 1);
