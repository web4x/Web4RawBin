// [test:uuid:638f94d3-2c51-40ae-8f43-b606e34d0ec0] R26.7 FederationApi.federationImport — e2e drag/drop scenario transfer
// T26.7 v0.7.7 gate — federation END-TO-END import (/api/federation/import). Drag a file from one
// RawBin, drop on another → the SCENARIO transfers (not a plain URL). Tests the real import endpoint
// with an INLINE synthetic unit + no room (cleanly deletable, no dangling-ref risk). SystemTester token.
//   (1) imported item is a REAL unit with originHost PROVENANCE, NOT an app#file.show URL WebItem.
//   (2) children stay LAZY @host refs (never eagerly imported/minted).
//   (3) same-source re-drop is IDEMPOTENT (noop, no new unit).
// DET-3x. Leaves NOTHING (synthetic unit deleted in cleanup; no room link).

import https from 'https';
import fs from 'fs';
import path from 'path';

const HOST = 'prod.wo-da.de', PORT = 4444;
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const SCEN = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';
const SYNTH = 'fed00000-0000-4000-8000-00000000e2e7';         // fixed synthetic uuid (deterministic + deletable)
const ORIGIN = 'https://origin-a.example';                    // a DIFFERENT (remote) origin
const shard = (u) => path.join(SCEN, ...u.slice(0, 5).split(''), u + '.scenario.json');

const inlineUnit = { ior: 'ior:class:WebItem', model: { uuid: SYNTH, kind: 'link', name: 'Federation E2E Gate Import', url: 'https://example.org/federated-resource', children: ['ior:instance:child-fed-0001'] }, ownerIor: null };
const ref = { ior: `ior:instance:${SYNTH}@${ORIGIN}`, originHost: ORIGIN, type: 'webitem', name: 'Federation E2E Gate Import', fetchUrl: `${ORIGIN}/api/scenario/${SYNTH}`, inline: inlineUnit };

const post = (body) => new Promise((res) => {
  const data = JSON.stringify(body);
  const r = https.request({ host: HOST, port: PORT, path: '/api/federation/import', method: 'POST', rejectUnauthorized: false, timeout: 8000, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (x) => { let d = ''; x.on('data', c => d += c); x.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} res({ status: x.statusCode, json: j }); }); });
  r.on('error', () => res({ status: 0 })); r.on('timeout', () => { r.destroy(); res({ status: 0 }); });
  r.write(data); r.end();
});
const readStored = () => { try { return JSON.parse(fs.readFileSync(shard(SYNTH), 'utf8')); } catch { return null; } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ensure a clean slate (delete any leftover from a prior run) so iter1 is a fresh mint
try { fs.unlinkSync(shard(SYNTH)); } catch {}

const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const r = await post({ ref, roomId: '', token: ST });  // roomId '' → no room link (no dangling-ref risk)
    await sleep(800);
    const stored = readStored();
    const m = stored?.model || {};
    // (1) real unit + provenance, NOT a plain URL WebItem pointing at app#file.show
    const item1 = r.status === 200 && r.json?.uuid === SYNTH && stored?.ior === 'ior:class:WebItem'
      && m.originHost === ORIGIN && typeof m.originIor === 'string' && m.originIor.includes(`@${ORIGIN}`)
      && m.url === 'https://example.org/federated-resource' && !/app#|file\.show/.test(m.url || '');
    // (2) children stay lazy @host refs
    const item2 = Array.isArray(m.children) && m.children.length === 1 && m.children[0] === `ior:instance:child-fed-0001@${ORIGIN}`;
    // (3) idempotent: iter 1 = mint (fresh), iters 2-3 = noop (same-source, no re-write)
    const item3 = (i === 1) ? (r.json?.action === 'mint') : (r.json?.action === 'noop');
    const pass = item1 && item2 && item3;
    results.push(pass);
    console.log(`iter ${i}: (1)real+prov=${item1} (2)lazyChildren=${item2}[${(m.children || [])[0] || ''}] (3)action=${r.json?.action}(exp ${i === 1 ? 'mint' : 'noop'})=${item3} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally {
  let removed = 0; try { fs.unlinkSync(shard(SYNTH)); removed = 1; } catch {}
  console.log(`cleanup: removed ${removed} synthetic import unit (no room link → no dangling ref). 0 profiles, 0 rooms touched.`);
}

console.log('\n=== VERDICT T26.7 federation E2E import (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
