// R36.4 authored-trace — ENGINE-INDEPENDENT MECHANISM gate (PO: gate the mechanism, not a fragile click-fire), DET-3x.
// (1) IDEMPOTENT mint: authorTrace uuid = keyToUuid('umltrace::<from>::<to>::<relation>') → same triple = SAME uuid (re-draw
//     never dups); ANY component change (from/to/relation) = DIFFERENT uuid. Imports the REAL keyToUuid (TsToModel) — the
//     exact fn server.ts:1110 uses. Engine-independent + pollution-free (pure hash, no POST/write).
// (2) 403-GATE: POST /api/model/trace/create + GET /api/model/traces are feature-gated (requireFeatureAccessHttp
//     'Model-Driven Code Quality', server.ts:2122/2137) → no-token AND non-owner (SystemTester) → 403 (never authors/leaks).
// SPLIT (PO iOS-WebKit-tap discipline): the 🔗-arm→click-source→click-target→POST FLOW + overlay render/reroute = the
//     WebKit @390 visual gate (r364b, separate); fires-on-real-iOS-TAP = Tron device (do NOT false-green a fragile tap-fire).
// [test:uuid:d41ee143-5817-4355-adfa-08c70a827a16] R36.4 authorTrace (Impl a79f6091, server.ts:1105) MECHANISM: idempotent
// uuid = keyToUuid('umltrace::from::to::relation') (same triple = same uuid, re-draw no-dup; any component change = distinct)
// + POST /api/model/trace/create & GET /api/model/traces feature-gated → no-token AND non-owner → 403. DET-3x, engine-independent.
// (authorTrace Impl a79f6091 server.ts:1105 — TWO-KEY CLOSED d41ee143↔a79f6091, both-dir status:pass.) buildTraceEdge dc101d02 render = r364b.
import https from 'node:https';
import { keyToUuid } from '../../src/ts/scenario/TsToModel.js';
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df'; // SystemTester = a real NON-owner (feature-gate must still 403)
const req = (method: string, p: string, headers: Record<string, string> = {}) => new Promise<{ status: number }>((res) => {
  const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: p, method, headers, rejectUnauthorized: false }, (r) => { r.on('data', () => {}); r.on('end', () => res({ status: r.statusCode || 0 })); });
  q.on('error', () => res({ status: 0 })); if (method === 'POST') q.end('{}'); else q.end();
});
const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const cfg = await new Promise<string>((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(b)); }); q.on('error', () => res('{}')); q.end(); });
console.log(`served ${JSON.parse(cfg).version} (mechanism gate is engine-independent — served-verified for the 403 probe)`);

const runs: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  // (1) idempotent key
  const k = (f: string, t: string, r: string) => keyToUuid(`umltrace::${f}::${t}::${r}`);
  const u1 = k('UC-a', 'M-b', 'traces');
  const u2 = k('UC-a', 'M-b', 'traces');            // same triple → same uuid (idempotent, no dup on re-draw)
  const uRel = k('UC-a', 'M-b', 'decomposes');       // relation differs → different uuid
  const uTo = k('UC-a', 'M-c', 'traces');            // to differs → different uuid
  const uFrom = k('UC-x', 'M-b', 'traces');          // from differs → different uuid
  const idempotent = u1 === u2 && V4.test(u1) && uRel !== u1 && uTo !== u1 && uFrom !== u1;

  // (2) 403-gate — no-token AND non-owner both blocked, POST + GET
  const postNo = await req('POST', '/api/model/trace/create');
  const postSt = await req('POST', '/api/model/trace/create', { 'x-player-token': ST });
  const getNo = await req('GET', '/api/model/traces');
  const getSt = await req('GET', '/api/model/traces', { 'x-player-token': ST });
  const gate403 = postNo.status === 403 && postSt.status === 403 && getNo.status === 403 && getSt.status === 403;

  const pass = idempotent && gate403;
  runs.push(pass);
  console.log(`iter ${i}: idempotent=${idempotent}(u1==u2:${u1 === u2} distinct rel/to/from:${uRel !== u1}/${uTo !== u1}/${uFrom !== u1}) 403-gate=${gate403}(POST no/st=${postNo.status}/${postSt.status} GET no/st=${getNo.status}/${getSt.status}) => ${pass ? 'GREEN' : 'RED'}`);
}
const green = runs.length === 3 && runs.every(Boolean);
console.log('\n===== R36.4 authored-trace MECHANISM (idempotent + 403, DET-3x) =====');
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('HELD-TRON: real-iOS-TAP fire of 🔗-arm→click→click; WebKit overlay render/reroute = r364b visual gate.');
process.exitCode = green ? 0 : 1;
