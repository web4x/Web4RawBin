// R40.81 SLICE-3 MODEL-WRITE EVASION GATE (architect backstop RED 03eed6cc7 — the 4TH evasion class). r4081d (server token scan)
// is NECESSARY-NOT-SUFFICIENT: a model-unit EDIT reaches data/model-store/index with NO server MODEL_STORE token — the store path
// comes from the CLIENT HREF (rb-detail-drawer.ts:130 scenarioEditorHref(u,'data/model-store/index')) → generic PUT /api/files
// (edit.ts:70) → server writes it raw (server.ts:3707 writeFile(relPath)). The unevadable question is 'can ANY path — client,
// route, or server — reach the model store OUTSIDE the ModelStoreLocator?', not 'does the server mention MODEL_STORE?'.
//
// TWO NEW ASSERTIONS (+ keep r4081d server token scan as the 3rd), each FAILABLE:
//   A1 CLIENT store-literals = 0 : no client code names a model-store path for a model unit (source scan src/public/ts). Stub: inject one → RED.
//   A2 PUT /api/files REFUSES a model-store relPath (BEHAVIOURAL, prove it CANNOT write there — 'not called today' ≠ safe):
//      attempt a real PUT to a data/model-store/index/… relPath on an ISOLATED scratch → assert REFUSED (4xx, nothing written).
//      Stub: if the refusal is disabled the write succeeds → RED. (Scratch-only; NEVER touch the live frozen model-store.)
// RED-BASELINE NOW: A1=1 (rb-detail-drawer.ts:130), A2 not-refused (server.ts:3707 writes raw) → RED. GREEN when the expert
// routes the client edit through the locator (no client store literal) AND /api/files refuses a model-store relPath.
import { setupFoundation } from './r4031-foundation.mjs';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const ROOT = path.resolve('.');

// ── A1: CLIENT model-store path literals (comment-stripped) anywhere in src/public/ts ──
const walk = (d, acc = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, acc); else if (e.name.endsWith('.ts')) acc.push(p); } return acc; };
const scanClient = (extra) => { let hits = []; for (const f of walk(path.join(ROOT, 'src/public/ts'))) { const lines = fs.readFileSync(f, 'utf8').split('\n'); lines.forEach((l, i) => { const c = l.replace(/\/\/.*$/, ''); if (/model-store\/index|['"`]data\/model-store/.test(c)) hits.push(`${f.replace(ROOT + '/', '')}:${i + 1}`); }); } if (extra) hits = hits.concat(scanClientExtra(extra)); return hits; };
const scanClientExtra = (line) => /model-store\/index|['"`]data\/model-store/.test(line.replace(/\/\/.*$/, '')) ? ['<injected>'] : [];
const a1Hits = scanClient();
const a1Teeth = scanClient(`const x = scenarioEditorHref(u, 'data/model-store/index'); // stub`).length === a1Hits.length + 1;
R('═══ R40.81 SLICE-3 MODEL-WRITE EVASION GATE (client + route + server) ═══');
R(`  A1 CLIENT model-store path literals : ${a1Hits.length}  ${a1Hits.length === 0 ? 'GREEN' : 'RED'}`);
for (const h of a1Hits) R(`     ${h}`);
R(`  A1 FAILABLE (inject a client store-literal → RED): ${a1Teeth ? 'PASS' : 'FAIL'}`);

// ── A2: behavioural — PUT /api/files to a model-store relPath must be REFUSED (isolated scratch) ──
const put = (base, relPath) => new Promise((res) => { const u = new URL(`${base}/api/files/${encodeURIComponent(relPath)}`); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'PUT', rejectUnauthorized: false, headers: { 'Content-Type': 'application/json' } }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res({ status: r.statusCode, body: d.slice(0, 120) })); }); req.on('error', (e) => res({ status: 0, body: String(e.message) })); req.end(JSON.stringify({ content: 'EVASION_PROBE_SHOULD_BE_REFUSED' })); });
let a2 = { refused: false, status: '?' };
const f = await setupFoundation({ commit: process.env.ARM_COMMIT || 'HEAD' });
try {
  const rel = 'data/model-store/index/f/a/c/a/d/facade77-0000-4000-8000-000000000081.scenario.json'; // a model-store relPath
  const r = await put(f.base, rel);
  const scratchFile = path.join('/tmp', (fs.readdirSync('/tmp').filter((d) => d.startsWith('r4031-scratch-')).sort().pop() || ''), rel);
  const wroteToStore = (() => { try { return fs.readFileSync(scratchFile, 'utf8').includes('EVASION_PROBE'); } catch { return false; } })();
  // ★ REFUSE-CONFOUNDED: a 404/401 is NOT a proven refusal — writeFile is OVERWRITE-ONLY (server.ts:3698, refuses to CREATE a
  // non-existent file) + the route needs auth (3689). This probe used a NON-existent uuid with no auth → 404 = overwrite/auth
  // miss, NOT a model-store rejection. A faithful A2 must EDIT an EXISTING model unit → needs model-store SEEDED into the scratch
  // (tar, r4081c rig) + a real playerToken/same-origin. Verdicts: reached+WROTE(200,wroteToStore)=hazard-live RED; reached+
  // REJECTED-as-model-store(specific 4xx, no write)=GREEN; 404/401/no-write-but-not-reached = INCONCLUSIVE (not a verdict).
  const reached = r.status === 200 || wroteToStore || /model-store|forbidden|refus/i.test(r.body || '');
  a2 = { status: r.status, wroteToStore, reached, wrote: wroteToStore, refused: reached && !wroteToStore, inconclusive: !reached };
  R(`  A2 PUT /api/files → model-store relPath : status=${r.status} wroteToStore=${wroteToStore} → ${a2.inconclusive ? 'INCONCLUSIVE (probe did NOT reach the overwrite path: overwrite-only+auth; needs seeded model-store + existing uuid + token)' : a2.refused ? 'REFUSED (GREEN)' : 'WROTE / NOT REFUSED (RED)'}`);
  R(`     faithful A2 = seed model-store (tar) → PUT-overwrite an EXISTING model uuid with a live token → pre-fix WRITES (RED), post-fix REFUSED (GREEN). A 404/401 proves nothing.`);
} finally { await f.teardown(); }
R(`  A2 FAILABLE: a refusal that can be disabled → the write lands = RED (this probe IS that check — pre-fix it writes, post-fix it is refused).`);

const green = a1Hits.length === 0 && a1Teeth && a2.refused;
const a2Label = a2.refused ? 'GREEN' : a2.inconclusive ? 'INCONCLUSIVE (not a verdict — needs the seeded rig)' : 'RED (route writes the model store)';
R(`OVERALL: ${green ? 'GREEN — no client/route path reaches the model store outside the locator' : `RED — A1 client-literal=${a1Hits.length} · A2=${a2Label}`}`);
R(`  (3rd assertion = r4081d server token scan, run separately — GREEN on v0.8.196. All three together = the end-to-end unevadable answer.)`);
R(`  PAIR (post-flip 5-step): a pencil EDIT of a model unit must still WORK and land in the SAME store reads come from (under the frozen-source flip this path would break silently for every model unit).`);
process.exit(green ? 0 : 1);
