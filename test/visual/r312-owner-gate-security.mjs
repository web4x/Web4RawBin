// [test:uuid:87b040ee-08b2-44ea-a832-52da08f1fef9] R31.2 ServerManagerGuard.assertOwner (Impl 335dbf3d) — owner-gate REJECT foundation, DET-3x GREEN on served==HEAD==v0.7.84: non-owner/no-token/malformed/empty + LEAKED-owner-literal-not-live → 403 across ALL /api/server-manager/* (INV-G1 choke), ws terminal upgrade rejected socket-never-opens (INV-G3), OWNER_TOKEN literal ==1 (INV-G2), fail-closed, UI-force live-non-owner → 403, + R31.1 Server-Manager feature-grant ABSENT (markup forced, server-gated).
// R31.2 Server-Manager OWNER-GATE — INDEPENDENT security gate (reject/foundation direction), DET-3x.
// Measured DIFFERENTLY than the expert's build-check: raw HTTP + raw ws handshake probes + source-literal grep +
// a LIVE authenticated non-owner browser session forcing the endpoint. Owner constant + guard: ServerManagerGuard.ts
// (assertOwner = live-session AND constant-time-equal OWNER_TOKEN, fail-closed). Choke-point: server.ts:822
// (/api/server-manager/* → requireOwnerHttp) + ws upgrade server.ts:2196 (same resolveOwner, socket destroyed on reject).
// PO scope: gate the REJECT direction (owner-200 ACCEPT needs Tron's live session token = Tron-facing, NOT blocked here).
// Assertions: (1) no-token/unknown/malformed/empty → 403; (2) LEAKED owner-literal-but-not-a-live-session → STILL 403
// (depth: knowing the constant ≠ access); (3) EVERY /api/server-manager/* sub-route → 403 (INV-G1 choke); (4) terminal
// ws upgrade non-owner → 403 handshake, socket NEVER opens (INV-G3); (5) INV-G2 OWNER_TOKEN literal appears EXACTLY once
// in src; (6) UI-hiding-is-NOT-the-gate — a LIVE SystemTester (non-owner) forcing fetch('/api/server-manager/whoami')
// from the real app still gets 403 server-side. served-confirm: 403 (NOT 404) on no-token = R31.2 guard IS deployed.
import https from 'node:https';
import { execSync } from 'node:child_process';
import { WebSocket } from 'ws';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';

const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`;
const OWNER = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';               // leaked from ServerManagerGuard.ts — must STILL 403 (no live session)
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';                  // SystemTester (a real non-owner)
const UNKNOWN = '00000000-0000-4000-8000-000000000000';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const httpGet = (path, headers = {}) => new Promise((resolve) => {
  const req = https.request({ host: HOST, port: PORT, path, method: 'GET', headers, rejectUnauthorized: false }, (res) => {
    let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b }));
  });
  req.on('error', () => resolve({ status: 0, body: 'ERR' })); req.end();
});

// ws handshake probe → { opened, rejectCode }. INV-G3: a rejected upgrade must NEVER fire 'open'.
const wsProbe = (headers = {}) => new Promise((resolve) => {
  let done = false; const fin = (r) => { if (!done) { done = true; try { ws.terminate(); } catch { /* noop */ } resolve(r); } };
  const ws = new WebSocket(`wss://${HOST}:${PORT}/api/server-manager/terminal`, { rejectUnauthorized: false, headers });
  ws.on('open', () => fin({ opened: true, rejectCode: null }));                           // ← would be the INV-G3 violation
  ws.on('unexpected-response', (_req, res) => fin({ opened: false, rejectCode: res.statusCode }));
  ws.on('error', (e) => fin({ opened: false, rejectCode: /403/.test(e?.message || '') ? 403 : -1 }));
  setTimeout(() => fin({ opened: false, rejectCode: -2 }), 4000);
});

// INV-G2 (static, correct-by-construction): the OWNER_TOKEN literal appears in EXACTLY one src location.
const invG2 = () => {
  const out = execSync(`grep -rn "${OWNER}" src/ || true`, { cwd: '/var/dev/Workspaces/web4x/Web4RawBin', encoding: 'utf8' });
  const lines = out.split('\n').filter(l => l.includes(OWNER));
  return { count: lines.length, where: lines.map(l => l.split(':').slice(0, 2).join(':')) };
};

const TOKEN_VARIANTS = [
  ['no-token', {}],
  ['unknown', { 'x-player-token': UNKNOWN }],
  ['malformed', { 'x-player-token': 'not-a-uuid-@@@' }],
  ['empty', { 'x-player-token': '' }],
  ['owner-literal-NOT-live', { 'x-player-token': OWNER }],   // ★ depth: correct constant, no live session → must 403
];
const ROUTES = ['/api/server-manager/whoami', '/api/server-manager/terminal', '/api/server-manager/foo', '/api/server-manager/', '/api/server-manager/x/y'];

async function browserChecks() {
  // (A#6) UI-hiding-is-NOT-the-gate: a LIVE authenticated SystemTester (non-owner) forces the gated endpoint from the app.
  // (B) R31.1: the profile's 'Server Manager' feature-grant is SERVER-gated (renders only if whoami→200) — for a non-owner
  //     it is ABSENT, and FORCING the entry markup grants nothing (the resource itself stays 403). /app?editProfile=1
  //     auto-opens the profile editor (app.ts:51) → renderFeatureGrants runs → #pe-feature-grants populated by the gate.
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
  try {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/app?editProfile=1`, { waitUntil: 'networkidle' });
    await sleep(3000); // live ws session + profile editor open + renderFeatureGrants' whoami fetch settle
    return await page.evaluate(async (st) => {
      const s = async (h) => (await fetch('/api/server-manager/whoami', { headers: h })).status;
      const withOwnHeader = await s({ 'x-player-token': st });
      const noHeader = await s({});
      const withOwnerLiteral = await s({ 'x-player-token': '41ad88c4-4dee-49ac-afcb-8a2026657b2d' });
      // R31.1 entry-absent: the profile editor rendered its grants host, but NO 'Server Manager' grant for a non-owner
      const grantsHost = document.querySelector('#pe-feature-grants');
      const grantsRendered = !!grantsHost;
      const smEntries = Array.from(document.querySelectorAll('a.profile-grant')).filter(a => /server manager/i.test(a.textContent || ''));
      const entryAbsent = smEntries.length === 0;
      // markup FORCED: inject the exact owner entry — prove the server still gates the resource (forcing markup ≠ access)
      const forced = document.createElement('a'); forced.className = 'profile-grant'; forced.href = '/server-manager'; forced.textContent = '🖥️ Server Manager';
      (grantsHost || document.body).appendChild(forced);
      const afterForceWhoami = await s({ 'x-player-token': st });
      return { withOwnHeader, noHeader, withOwnerLiteral, grantsRendered, entryCount: smEntries.length, entryAbsent, afterForceWhoami };
    }, ST).finally(() => ctx.close());
  } finally { await browser.close(); }
}

// PHANTOM-GUARD: I verify served==target MYSELF before gating (never certify served!=HEAD).
const TARGET_VERSION = '0.7.84';
const cfg = await httpGet('/api/config');
let servedVersion = null; try { servedVersion = JSON.parse(cfg.body).version; } catch { /* noop */ }
if (servedVersion !== TARGET_VERSION) {
  console.log(`ABORT (phantom-guard): served version=${servedVersion} != target ${TARGET_VERSION} — refusing to gate.`);
  process.exitCode = 1;
} else {
console.log(`served version verified == ${TARGET_VERSION} (phantom-guard satisfied)`);

const results = [];
for (let i = 1; i <= 3; i++) {
  // (1)+(2) HTTP reject matrix on whoami
  const httpRej = [];
  for (const [name, h] of TOKEN_VARIANTS) { const r = await httpGet('/api/server-manager/whoami', h); httpRej.push([name, r.status]); }
  const httpAll403 = httpRej.every(([, s]) => s === 403);
  const servedConfirm = httpRej[0][1] === 403;   // no-token → 403 (NOT 404) = R31.2 guard deployed

  // (3) route enumeration — every sub-route, no token → 403 (INV-G1 choke-point)
  const routeRej = [];
  for (const p of ROUTES) { const r = await httpGet(p, {}); routeRej.push([p, r.status]); }
  const routesAll403 = routeRej.every(([, s]) => s === 403);

  // (4) ws INV-G3 — non-owner upgrade rejected, socket never opens
  const wsNo = await wsProbe({});
  const wsUnknown = await wsProbe({ 'x-player-token': UNKNOWN });
  const wsOwnerNotLive = await wsProbe({ 'x-player-token': OWNER });
  const wsNeverOpens = !wsNo.opened && !wsUnknown.opened && !wsOwnerNotLive.opened;
  const wsRejected = [wsNo, wsUnknown, wsOwnerNotLive].every(w => w.rejectCode === 403 || w.rejectCode === -2 /* destroyed, no response */);

  // (5) INV-G2 single literal
  const g2 = invG2();
  const invG2ok = g2.count === 1;

  // (6) UI-hiding-is-NOT-the-gate (live non-owner browser) + (B) R31.1 Server-Manager entry ABSENT (markup forced)
  const b = await browserChecks();
  const uiAll403 = b.withOwnHeader === 403 && b.noHeader === 403 && b.withOwnerLiteral === 403;
  const r31_1_entryAbsent = b.grantsRendered && b.entryAbsent;         // profile editor opened + NO Server Manager grant
  const r31_1_forcedNoAccess = b.afterForceWhoami === 403;            // forcing the entry markup grants no access (server-gated)

  const pass = httpAll403 && servedConfirm && routesAll403 && wsNeverOpens && wsRejected && invG2ok && uiAll403 && r31_1_entryAbsent && r31_1_forcedNoAccess;
  results.push(pass);
  console.log(`iter ${i}: [A]httpReject=${httpAll403}[${httpRej.map(x => x[1]).join(',')}] served=${servedConfirm} routes403=${routesAll403}[${routeRej.map(x => x[1]).join(',')}] wsNeverOpens=${wsNeverOpens}(no=${wsNo.rejectCode} unk=${wsUnknown.rejectCode} ownerNotLive=${wsOwnerNotLive.rejectCode}) INV-G2=${invG2ok}(${g2.count}) UI-force403=${uiAll403}(own=${b.withOwnHeader} none=${b.noHeader} lit=${b.withOwnerLiteral}) | [B]R31.1-entryAbsent=${r31_1_entryAbsent}(rendered=${b.grantsRendered} smCount=${b.entryCount}) forcedNoAccess=${r31_1_forcedNoAccess}(${b.afterForceWhoami}) => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R31.2 owner-gate security (REJECT foundation, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: owner-200 ACCEPT path + entry-VISIBLE (Tron live-session token) are Tron-facing — intentionally NOT gated here per PO.');
process.exitCode = green ? 0 : 1;
}
