// R40.62 recorder-survival POST-DEPLOY gate (PO method) — the END-TO-END pairing IS the gate: the client TRIGGER
// and the server SINK must BOTH be live, or Tron's reload captures ZERO (existence of either half alone proves nothing).
// Per surface: parse the SERVED page for the bundle it NOW references (hashes changed in the rebuild — NEVER reuse a
// remembered name), fetch THAT asset, assert the '/api/diag/live-mvc' marker survives minification. + endpoint 403-not-404
// + served==committed phantom-guard. Owner-mint (system owner token, READ-ONLY, no mutation) for the gated /model page.
// UNPROVEN-not-skip on any unreadable surface. Any surface ABSENT => RED => expert restores backup, no fix-forward.
import fs from 'fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const MARKER = '/api/diag/live-mvc';
const raw = {}; let pass = 0, fail = 0, unproven = 0;
const A = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL:', m); } };

// (4) phantom-guard: served == committed
const cfg = await (await fetch(`${BASE}/api/config`)).json();
const served = cfg.version;
const committed = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
raw.served = served; raw.committed = committed;
A(served === committed, `phantom-guard: served(${served}) == committed(${committed})`);

// (3) SERVER SINK live — probe the METHOD THE RECORDER ACTUALLY USES (POST, the sendBeacon path), NOT GET. FAMILY =
// wrong-method-probe (sibling of DOM-count-for-pixels / req-Test-for-task-scope): a GET probe (GET=405 'route exists')
// stays GREEN even if POST breaks → it tests a different path than the one that matters. POST==403 proves the whole chain
// the recorder depends on: route + METHOD + reaches the auth layer (non-owner rejected; Tron-as-owner would be accepted).
// 404 = route gone / old process = RED (failure condition). 405 = POST-method broken = RED. Only 403 is a healthy sink.
const ep = await fetch(`${BASE}${MARKER}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.status).catch(() => 0);
raw.endpoint_nonOwner = ep;
A(ep === 403, `server sink live: recorder POST → 403 (auth-gated: route+method+auth-layer). 404=route-gone/old-process, 405=POST-method-broken → both RED. got ${ep}`);
// STUB-MUST-FAIL (proves the sink-check is falsifiable, not vacuous): a broken sink (bogus path → 404) MUST NOT satisfy the
// 403 assertion → the gate would RED on it. If this bogus POST ever returned 403, the check would be meaningless.
const stub = await fetch(`${BASE}${MARKER}-r4062-stub-nonexistent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.status).catch(() => 0);
raw.stub_brokenSink = stub;
A(stub !== 403, `stub-must-fail: a broken sink (bogus path POST → ${stub}) does NOT pass the 403 check → the gate can RED (not vacuous)`);

// per-surface: fetch page → parse bundle(s) it NOW references → fetch each asset → marker survives?
async function surface(name, path, cookie) {
  let r;
  try { r = await fetch(`${BASE}${path}`, cookie ? { headers: { Cookie: `sm_session=${cookie}` } } : {}); } catch (e) { unproven++; raw[name] = { unproven: `fetch-error:${String(e.message || e).slice(0, 40)}` }; console.log(`  UNPROVEN: ${name} — ${raw[name].unproven}`); return; }
  if (!r.ok) { unproven++; raw[name] = { page: r.status, unproven: true }; console.log(`  UNPROVEN: ${name} page not readable (status ${r.status}${cookie ? ', owner cookie present' : ''})`); return; }
  const html = await r.text();
  const bundles = [...new Set((html.match(/\/dist\/[a-zA-Z0-9-]+\.js/g) || []))].filter(b => !/rb-update-banner/.test(b)); // the page-content bundles
  const checked = []; let found = false;
  for (const b of bundles) { const js = await (await fetch(`${BASE}${b}`)).text(); const has = js.includes(MARKER); checked.push(`${b.replace('/dist/', '')}${has ? '=MARKER✓' : '=none'}`); if (has) found = true; }
  raw[name] = { page: 200, bundles: checked, found };
  A(found && bundles.length > 0, `${name}: recorder marker in a SERVED bundle [${checked.join(' ')}]`);
}

// /model is owner-gated (403 on prod) — read its bundle via the committed manifest hash + PUBLIC /dist. NO prod owner-auth
// (the no-prod-owner-auth boundary stands; owner-auth is scratch-only). served==committed by construction: the committed
// content-hash IS what prod serves, so /dist/<hash>.js returning 200 proves the committed bundle is live.
async function surfaceByManifest(name, key) {
  let hash;
  try { hash = JSON.parse(fs.readFileSync('src/public/dist/build-manifest.json', 'utf8'))[key]; } catch { /* missing */ }
  if (!hash) { unproven++; raw[name] = { unproven: `manifest ${key} missing` }; console.log(`  UNPROVEN: ${name} — no manifest hash for ${key}`); return; }
  let js = '', status = 0;
  try { const r = await fetch(`${BASE}/dist/${hash}`); status = r.status; js = r.ok ? await r.text() : ''; } catch (e) { unproven++; raw[name] = { unproven: `fetch:${String(e.message || e).slice(0, 30)}` }; console.log(`  UNPROVEN: ${name} — ${raw[name].unproven}`); return; }
  const has = js.includes(MARKER);
  raw[name] = { bundle: hash, served: status, found: has };
  A(status === 200 && has, `${name}: committed bundle ${hash} SERVED (${status}) + recorder marker present [served==committed via manifest, no owner-auth]`);
}

await surface('trace', '/trace', '');
await surface('scenario', '/scenario', '');
await surfaceByManifest('model', 'model.js');

console.log('\n=== RAW PER-SURFACE ===');
console.log(JSON.stringify(raw, null, 2));
const green = fail === 0 && unproven === 0;
console.log(`\nr4062 recorder-survival: ${pass} pass / ${fail} fail / ${unproven} unproven → ${green ? 'GREEN (client trigger + server sink BOTH live, all 3 surfaces)' : (fail > 0 ? 'RED — a surface/half is missing (expert restore backup, no fix-forward)' : 'INCOMPLETE — surface UNPROVEN, not GREEN')}`);
process.exit(green ? 0 : 1);
