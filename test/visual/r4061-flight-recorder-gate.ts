// fact-1 live-MVC FLIGHT RECORDER gate — proves the 5 PO conditions are ASSERTED, not asserted-in-prose.
// (5) NO-PII is the headline: import the REAL sanitizeRef/makeRing/whitelist and prove a ref can carry ONLY a
// technical `type:uuid` key; the endpoint (1-4) tested live on scratch@HEAD (owner-gate/cap/malformed/schema).
// Run: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r4061-flight-recorder-gate.ts
import { sanitizeRef, makeRing, RECORD_KEYS } from '../../src/public/ts/live-mvc-recorder.js';
import { setupFoundation } from './r4031-foundation.mjs';

let pass = 0, fail = 0;
const A = (c: boolean, m: string) => { if (c) pass++; else { fail++; console.log('  FAIL:', m); } };

// ── (5) NO-PII, ASSERTABLE — sanitizeRef reduces ANY input to a technical key (or 'graph'), no free text survives ──
const REF_OK = /^[a-z0-9_-]+(:[a-z0-9_-]+)?$/;
const piiInputs = [
  'Task:7a956c21-46db-440f @host with spaces',
  'user:bob@example.com',
  'note: buy milk call 555-1234',
  'Task:uuid/../../etc/passwd',
  '<script>alert(1)</script>',
  'Задача:кириллица-PII',
];
for (const p of piiInputs) {
  const s = sanitizeRef(p);
  A(REF_OK.test(s), `sanitizeRef must yield a technical key: ${JSON.stringify(p)} → ${JSON.stringify(s)}`);
  A(!/[@ .<>/]|[^\x00-\x7f]/.test(s), `sanitizeRef left PII residue in ${JSON.stringify(s)}`);
  A(s.split(':').length <= 2, `sanitizeRef left >1 colon in ${JSON.stringify(s)}`);
}
A(sanitizeRef('graph') === 'graph', 'bare token preserved');
A(sanitizeRef('Task:abc') === 'task:abc', 'type lowercased');
A(RECORD_KEYS.join(',') === 'k,t,ref,conn,listeners,threw,state', 'record-key whitelist stable');

// bounded ring
const r = makeRing(200);
for (let i = 0; i < 500; i++) r.push({ k: 'frame', t: i });
A(r.length === 200, `ring not bounded: ${r.length}`);

// ── endpoint (1)-(4) on scratch@HEAD (HEAD must carry the committed endpoint) ──
const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
console.log(`scratch up: served=${f.servedVersion} sha=${f.worktreeSha}`);
try {
  const oh = f.ownerHeaders();
  const post = (headers: Record<string, string>, body: string) =>
    fetch(`${f.base}/api/diag/live-mvc`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body })
      .then(r => r.status).catch(() => 0);
  const good = JSON.stringify({ v: 1, at: Date.now(), events: [
    { k: 'frame', t: 1, ref: 'task:7a956c21', conn: true, listeners: 0 },
    { k: 'render', t: 2, ref: 'task:7a956c21', threw: false },
  ] });
  A(await post(oh, good) === 204, '(1) owner good beacon → 204');
  A(await post({}, good) === 403, '(1) NON-OWNER refused → 403');
  A(await post(oh, 'x'.repeat(70000)) === 413, '(2) oversized → 413');
  A(await post(oh, '{ not json') === 400, '(2) malformed → 400');
  A(await post(oh, JSON.stringify({ events: [{ k: 'frame', t: 1, ref: 'task:x', SECRET: 'pii' }] })) === 400, '(5) unknown key → 400');
  A(await post(oh, JSON.stringify({ events: [{ k: 'frame', t: 1, ref: 'note: buy milk 555-1234' }] })) === 400, '(5) PII-carrying ref → 400');
  A(await post(oh, JSON.stringify({ events: [{ k: 'evil', t: 1 }] })) === 400, '(5) bad kind → 400');
  A(await post(oh, JSON.stringify({ events: Array.from({ length: 500 }, (_, i) => ({ k: 'frame', t: i })) })) === 400, '(2) >200 events → 400');
} finally {
  const td = await f.teardown();
  A(td.prodUp === true && td.leftover === 0, `teardown clean (prodUp=${td.prodUp} leftover=${td.leftover})`);
}

console.log(`\nr4061 flight-recorder gate: ${pass} pass / ${fail} fail → ${fail === 0 ? 'GREEN' : 'RED'}`);
process.exit(fail === 0 ? 0 : 1);
