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

// ── A2: FAITHFUL behavioural probe (PO ordering: PROVE THE HAZARD IS LIVE FIRST). Seed the real model-store into the scratch
//    (tar, r4081c rig) → pick an EXISTING model uuid → PUT-overwrite it with same-origin auth → the write MUST land in the
//    scratch model-store PRE-fix (hazard-live RED). Only then does a POST-fix REFUSED distinguish 'hole closed' from 'never
//    reached'. Same-origin auth via Origin header = f.base (server.ts:3688 origin.includes(`localhost:${HTTPS_PORT}`)). ──
const SNAP_TAR = path.join(ROOT, 'test/baseline/model-store-premigration-v0.8.186.tar.gz');
const put = (base, relPath, content) => new Promise((res) => { const u = new URL(`${base}/api/files/${encodeURIComponent(relPath)}`); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'PUT', rejectUnauthorized: false, headers: { 'Content-Type': 'application/json', 'Origin': base } }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res({ status: r.statusCode, body: d.slice(0, 140) })); }); req.on('error', (e) => res({ status: 0, body: String(e.message) })); req.end(JSON.stringify({ content })); });
let a2 = { refused: false, wrote: false, inconclusive: true, status: '?' };
const before = new Set(fs.readdirSync('/tmp').filter((d) => d.startsWith('r4031-scratch-')));
const f = await setupFoundation({ commit: process.env.ARM_COMMIT || 'HEAD' });
try {
  const scratchRoot = [...fs.readdirSync('/tmp').filter((d) => d.startsWith('r4031-scratch-'))].filter((d) => !before.has(d)).map((d) => `/tmp/${d}`)[0];
  const { execSync } = await import('node:child_process');
  execSync(`tar xzf ${SNAP_TAR} -C ${scratchRoot}`); // seed the REAL model-store (existing model units to edit)
  const msRoot = `${scratchRoot}/data/model-store/index`;
  const findReal = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = `${d}/${e.name}`; if (e.isSymbolicLink()) continue; if (e.isDirectory()) { const r = findReal(p); if (r) return r; } else if (e.name.endsWith('.scenario.json')) return p; } return null; };
  const target = findReal(msRoot);
  const relPath = target.slice(scratchRoot.length + 1); // data/model-store/index/<shard>/<uuid>.scenario.json
  const original = fs.readFileSync(target, 'utf8');
  const marker = `"__EVASION_PROBE__":"r4081e-${process.pid}"`;
  const edited = original.replace(/\{/, `{${marker},`); // a valid-JSON edit
  const r = await put(f.base, relPath, edited);
  const after = fs.readFileSync(target, 'utf8');
  const wrote = after.includes('__EVASION_PROBE__');
  // reached-and-wrote = hazard live (RED); reached-and-rejected (200-not-written is impossible; a real refusal = 4xx w/ no write
  // AFTER we know the write path is auth+existing-reachable) = GREEN; anything ambiguous (couldn't seed / no target) = INCONCLUSIVE.
  a2 = { status: r.status, wrote, refused: r.status >= 400 && !wrote, inconclusive: !target, relPath };
  R(`  A2 FAITHFUL (seeded model-store, EXISTING uuid, same-origin auth) — PUT-overwrite ${relPath?.slice(0, 60)}`);
  R(`     status=${r.status} wroteToModelStore=${wrote} → ${a2.inconclusive ? 'INCONCLUSIVE (no seed/target)' : wrote ? 'WROTE the model store OUTSIDE the locator = HAZARD LIVE (RED, as it must be PRE-fix)' : a2.refused ? 'REFUSED, no write (GREEN)' : `status ${r.status} no write — inspect (body: ${r.body})`}`);
  R(`     PRE-fix expectation = WROTE=true (proves the hole is real + the probe reaches it); POST-fix expectation = REFUSED + wrote=false. Pre-RED→post-GREEN on THIS rig is the only proof.`);
} catch (e) { R(`  A2 rig error: ${String(e.message).slice(0, 140)}`); a2 = { inconclusive: true }; } finally { await f.teardown(); }

const green = a1Hits.length === 0 && a1Teeth && a2.refused;
const a2Label = a2.refused ? 'GREEN' : a2.inconclusive ? 'INCONCLUSIVE (not a verdict — needs the seeded rig)' : 'RED (route writes the model store)';
R(`OVERALL: ${green ? 'GREEN — no client/route path reaches the model store outside the locator' : `RED — A1 client-literal=${a1Hits.length} · A2=${a2Label}`}`);
R(`  (3rd assertion = r4081d server token scan, run separately — GREEN on v0.8.196. All three together = the end-to-end unevadable answer.)`);
R(`  PAIR (post-flip 5-step): a pencil EDIT of a model unit must still WORK and land in the SAME store reads come from (under the frozen-source flip this path would break silently for every model unit).`);
process.exit(green ? 0 : 1);
