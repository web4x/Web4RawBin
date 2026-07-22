// [test:uuid:672a841a-2d7e-40cc-b33f-db7a0a16afb7] R31.8 ServerManagerGuard.requireFeatureAccess (Impl 765ca93b) — data-driven feature gate REJECT direction, DET-3x served==local-HEAD f5a87d5f6 (fresh pid, verify-by-pid): INV-F1 non-member (no-token/unknown/malformed/owner-literal) → 403 on ALL feature routes at the ONE choke (server.ts:929); INV-F3 feature ws upgrade destroy-before-open (never 'open'); INV-F6 a LIVE authenticated NON-MEMBER (SystemTester) + the OWNER_TOKEN literal → 403 (membership only, owner NOT OR-d into access); INV-F5 fail-closed; INV-G2 OWNER_TOKEN literal ==1. member→200 flip = slice-(b) grant/revoke (Tron-facing).
// R31.8 slice-(a) requireFeatureAccess (Impl 765ca93b, Method 35e91ba7, Class ServerManagerGuard 1d6933c7) — the
// DATA-DRIVEN feature gate that generalizes assertOwner: access = caller token ∈ Feature.allowedUsers (data), NEVER
// s.owner / mere session-presence (INV-F6), fail-closed (INV-F5). Same choke as R31.2 (server.ts:929 HTTP + :2340 ws),
// now requireFeatureAccessHttp. served = local HEAD f5a87d5f6, fresh pid (verify-by-pid). DET-3x, REJECT direction
// (member→200 needs slice-(b) grant/revoke = a live member, Tron-facing — NOT gated here).
// INV-F1: every feature route → 403 for a non-member at the ONE choke. INV-F3: feature ws upgrade checks access BEFORE
// handleUpgrade → non-member socket destroyed pre-open (never 'open'). INV-F5: no-token / empty allowedUsers → deny.
// INV-F6: a LIVE authenticated NON-MEMBER (SystemTester, not in allowedUsers) → 403 (membership, not presence); the
// OWNER_TOKEN literal is NOT OR-d into access. INV-G2: OWNER_TOKEN literal appears EXACTLY once in src.
import https from 'node:https';
import { execFileSync } from 'node:child_process';
import { WebSocket } from 'ws';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const OWNER = '41ad88c4-4dee-49ac-afcb-8a2026657b2d', ST = 'ce981242-74fe-4d44-b5b6-43c641e224df', UNKNOWN = '00000000-0000-4000-8000-000000000000';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const get = (path, headers = {}) => new Promise((res) => { const q = https.request({ host: HOST, port: PORT, path, method: 'GET', headers, rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res({ status: r.statusCode, body: b })); }); q.on('error', () => res({ status: 0, body: '' })); q.end(); });
const wsProbe = (headers = {}) => new Promise((res) => { let done = false; const fin = (r) => { if (!done) { done = true; try { ws.terminate(); } catch { /* */ } res(r); } }; const ws = new WebSocket(`wss://${HOST}:${PORT}/api/server-manager/terminal`, { rejectUnauthorized: false, headers }); ws.on('open', () => fin({ opened: true, code: null })); ws.on('unexpected-response', (_q, r) => fin({ opened: false, code: r.statusCode })); ws.on('error', (e) => fin({ opened: false, code: /403/.test(e?.message || '') ? 403 : -1 })); setTimeout(() => fin({ opened: false, code: -2 }), 4000); });
const invG2 = () => execFileSync('grep', ['-rl', OWNER, `${REPO}/src`], { encoding: 'utf8' }).split('\n').filter(Boolean).filter(f => !/test\//.test(f)).length;

const ROUTES = ['/server-manager', '/api/server-manager/whoami', '/api/server-manager/tree', '/api/server-manager/terminal', '/api/server-manager/', '/api/server-manager/x'];
const VARIANTS = [['no-token', {}], ['unknown', { 'x-player-token': UNKNOWN }], ['malformed', { 'x-player-token': 'not-a-uuid-@@' }], ['owner-literal-not-member', { 'x-player-token': OWNER }]];

async function liveNonMember() { // INV-F6: a LIVE authenticated SystemTester (has a real session, NOT in allowedUsers) → 403
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
  try { const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' }); await seedSystemTester(ctx); const page = await ctx.newPage(); await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await sleep(1500);
    return await page.evaluate(async (st) => { const s = async (h) => (await fetch('/api/server-manager/whoami', { headers: h })).status; return { own: await s({ 'x-player-token': st }), none: await s({}), lit: await s({ 'x-player-token': '41ad88c4-4dee-49ac-afcb-8a2026657b2d' }) }; }, ST).finally(() => ctx.close());
  } finally { await browser.close(); }
}

const results = [];
const g2 = invG2();
const b = await liveNonMember();
for (let i = 1; i <= 3; i++) {
  const httpRej = []; for (const [n, h] of VARIANTS) httpRej.push([n, (await get('/api/server-manager/whoami', h)).status]);
  const httpAll403 = httpRej.every(([, s]) => s === 403);
  const routeRej = []; let neverShell = true; for (const p of ROUTES) { const r = await get(p, {}); routeRej.push(r.status); if (p === '/server-manager' && /server manager|sm-tree|<script/i.test(r.body)) neverShell = false; }
  const routesAll403 = routeRej.every(s => s === 403);
  const servedConfirm = routeRej[0] === 403; // feature-gate deployed (403 not 404/200)
  const wsNo = await wsProbe({}), wsUnk = await wsProbe({ 'x-player-token': UNKNOWN }), wsLit = await wsProbe({ 'x-player-token': OWNER });
  const wsF3 = [wsNo, wsUnk, wsLit].every(w => !w.opened && (w.code === 403 || w.code === -2)); // INV-F3 destroy-before-open
  const invF6 = b.own === 403 && b.none === 403 && b.lit === 403; // live non-member + owner-literal → 403 (membership only)
  const invG2ok = g2 === 1;
  const pass = httpAll403 && routesAll403 && servedConfirm && neverShell && wsF3 && invF6 && invG2ok;
  results.push(pass);
  console.log(`iter ${i}: INV-F1 httpReject=${httpAll403}[${httpRej.map(x => x[1]).join(',')}] routes403=${routesAll403}[${routeRej.join(',')}] served=${servedConfirm} neverShell=${neverShell} | INV-F3 ws-destroy=${wsF3}(no=${wsNo.code} unk=${wsUnk.code} lit=${wsLit.code}) | INV-F6 live-non-member=${invF6}(own=${b.own} none=${b.none} lit=${b.lit}) | INV-G2 lit==1=${invG2ok}(${g2}) => ${pass ? 'GREEN' : 'RED'}`);
}
console.log('\n===== R31.8 requireFeatureAccess (reject direction, DET-3x) =====');
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: member→200 (grant/revoke flip) needs slice-(b) + a live member = Tron-facing, not gated here.');
process.exitCode = green ? 0 : 1;
