// R40.62 recorder-survival POST-DEPLOY gate (PO method) — the END-TO-END pairing IS the gate: the client TRIGGER
// and the server SINK must BOTH be live, or Tron's reload captures ZERO (existence of either half alone proves nothing).
// Per surface: parse the SERVED page for the bundle it NOW references (hashes changed in the rebuild — NEVER reuse a
// remembered name), fetch THAT asset, assert the '/api/diag/live-mvc' marker survives minification. + endpoint 403-not-404
// + served==committed phantom-guard. Owner-mint (system owner token, READ-ONLY, no mutation) for the gated /model page.
// UNPROVEN-not-skip on any unreadable surface. Any surface ABSENT => RED => expert restores backup, no fix-forward.
import { WebSocket } from 'ws';
import fs from 'fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444', WSS = 'wss://prod.wo-da.de:4444';
const MARKER = '/api/diag/live-mvc';
const raw = {}; let pass = 0, fail = 0, unproven = 0;
const A = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL:', m); } };

// (4) phantom-guard: served == committed
const cfg = await (await fetch(`${BASE}/api/config`)).json();
const served = cfg.version;
const committed = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
raw.served = served; raw.committed = committed;
A(served === committed, `phantom-guard: served(${served}) == committed(${committed})`);

// (3) SERVER SINK live: non-owner POST → 403 (not 404 = old process, not other)
const ep = await fetch(`${BASE}${MARKER}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.status).catch(() => 0);
raw.endpoint_nonOwner = ep;
A(ep === 403, `server sink live: non-owner POST → 403 (got ${ep})`);

// owner-mint (READ-ONLY: WS IDENTIFY registers the token, POST mints sm_session — no data mutation) for gated pages
function readOwnerToken() {
  const e = (process.env.RAWBIN_OWNER_TOKEN || '').trim(); if (e) return e;
  try { return fs.readFileSync(process.env.RAWBIN_OWNER_TOKEN_FILE || '/root/.rawbin/owner-token', 'utf8').trim(); } catch { return ''; }
}
async function ownerCookie() {
  const tok = readOwnerToken(); if (!tok) return '';
  try {
    await new Promise((res, rej) => {
      const ws = new WebSocket(WSS, { rejectUnauthorized: false });
      const to = setTimeout(() => { try { ws.close(); } catch {} rej(new Error('ws timeout')); }, 8000);
      ws.on('message', d => { try { const m = JSON.parse(d); if (m.type === 'welcome') { ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: tok, deviceId: 'r4062-read', name: 'r4062-read', screenWidth: 1, screenHeight: 1, platform: 'node' })); clearTimeout(to); setTimeout(() => { try { ws.close(); } catch {} res(); }, 400); } } catch {} });
      ws.on('error', e => { clearTimeout(to); rej(e); });
    });
    const sres = await fetch(`${BASE}/api/server-manager/session`, { method: 'POST', headers: { 'x-player-token': tok } });
    return (/sm_session=([^;]+)/.exec(sres.headers.get('set-cookie') || '') || [])[1] || '';
  } catch { return ''; }
}

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

await surface('trace', '/trace', '');
await surface('scenario', '/scenario', '');
const oc = await ownerCookie();
raw.ownerMint = oc ? 'ok' : 'FAILED';
await surface('model', '/model', oc);

console.log('\n=== RAW PER-SURFACE ===');
console.log(JSON.stringify(raw, null, 2));
const green = fail === 0 && unproven === 0;
console.log(`\nr4062 recorder-survival: ${pass} pass / ${fail} fail / ${unproven} unproven → ${green ? 'GREEN (client trigger + server sink BOTH live, all 3 surfaces)' : (fail > 0 ? 'RED — a surface/half is missing (expert restore backup, no fix-forward)' : 'INCOMPLETE — surface UNPROVEN, not GREEN')}`);
process.exit(green ? 0 : 1);
