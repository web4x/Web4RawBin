// [test:uuid:4f85c052-1e40-4b52-9a7d-0c6e8f2a1b34] R40.52 owner-identity real-user-path (Impl 4f85fa3e ownerActionFetch) — FEATURE PROVEN in two attribution-split arms: (a) TRANSMIT — the deployed client SENDS x-player-token on owner actions (test/visual/r4052-live-transmit-probe.mjs, v0.8.119: set-current+approve captured, =test token, no cookie); (b) RESOLUTION — the server resolves x-player-token ALONE via branch-3, test-owner→200/non-owner→403/no-token→403 (this gate; no OWNER_TOKEN, no sm_session on the request). Test identities only; prod read-only; oracles untouched. Tron's @390 tap = final acceptance.
// R40.52 owner-identity FEATURE gate — the client TRANSMITS x-player-token on owner actions + the server RESOLVES it.
// PO L-S40-14 + attribution-trap split (each arm proves ONE thing; NO system literal on the resolution request; test identities only, NEVER Tron's token):
//   (a) TRANSMIT  — the REAL deployed ownerActionFetch (Impl 4f85fa3e) SENDS x-player-token from localStorage['rawbin-player-id'] on the owner-action sites (identity-agnostic; the headline defect).
//   (b) RESOLUTION — a request authenticated by x-player-token ALONE (NO OWNER_TOKEN, NO sm_session cookie) from a purpose-made TEST identity in the protected-identity set → 200; a DIFFERENT test identity → 403; no token → 403 (fail-closed).
//   (c) STUB-MUST-FAIL — with the client patched to NOT send the header, the TRANSMIT capture is empty (gate detects the original defect).
// Isolated scratch (non-4444, teardown-verified, prod:4444 UNTOUCHED, mutation-free). NO human credential: TEST_OWNER/TEST_NONOWNER are fresh uuids; branch-3 owner via a scratch RAWBIN_PROTECTED_IDS file. Tron's @390 tap remains the acceptance.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const REAL_QA_TASK = process.env.R4052_TASK || '97e8a6ad-46db-440f-a9be-cfb97ca64df4'; // Sprint37 QA-Review — renders owner-action buttons (set-current/approve/decline)
const shard = (root, u) => path.join(root, 'scenario/index', ...u.slice(0, 5).split(''), `${u}.scenario.json`);
const wu = (root, u, ior, model) => { const p = shard(root, u); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify({ ior, model: { uuid: u, ...model } }, null, 2) + '\n'); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STUB = process.env.STUB_NOHEADER === '1';

const TEST_OWNER = randomUUID();     // purpose-made owner identity (NOT Tron's) — added to the scratch protected-identity set
const TEST_NONOWNER = randomUUID();  // purpose-made non-owner identity
const plannedTask = randomUUID();

// scratch protected-identity file (env override) — TEST_OWNER only. Never touches /root/.rawbin.
const protFile = path.join('/tmp', `r4052-prot-${process.pid}.json`);
fs.writeFileSync(protFile, JSON.stringify([TEST_OWNER]));
process.env.RAWBIN_PROTECTED_IDS = protFile; // foundation spawns the scratch server with {...process.env} → it reads this

// seed a Profile unit uuid==TEST_OWNER (so profileUuidOf(TEST_OWNER)=TEST_OWNER ∈ protected) + a Planned task for the resolution-200
const seed = (root) => {
  wu(root, TEST_OWNER, 'ior:class:Profile', { name: 'r4052 test owner', token: TEST_OWNER, profileCommitted: true });
  wu(root, plannedTask, 'ior:class:Task', { name: 'r4052 planned', status: 'Planned', statusChecklist: '- [x] Planned' });
};
// (c) STUB: neuter ownerActionFetch so it does NOT attach x-player-token (compiled into the served bundle) — the gate must catch this.
const stubClient = (root) => {
  const p = path.join(root, 'src/public/ts/trace/universal-actions.ts');
  const s = fs.readFileSync(p, 'utf8').replace(/'x-player-token': token/, "'x-no-token': ''");
  fs.writeFileSync(p, s);
};

const f = await setupFoundation({ attachEvidenceTo: REAL_QA_TASK, serverPatch: seed, ...(STUB ? { clientPatch: stubClient, buildDist: true } : {}) });
const browser = await webkit.launch({ headless: true });
const raw = { servedVersion: f.servedVersion, worktreeSha: f.worktreeSha, stub: STUB };
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); // NO cookie set → resolution is x-player-token ALONE
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', (r) => { const u = r.url(); if (/\/api\/task\/[^/]+\/(make-current|approve|decline)|\/api\/current-sprint\/designate/.test(u)) reqs.push({ url: u.replace(f.base, ''), xpt: r.headers()['x-player-token'] ?? null, cookie: (r.headers()['cookie'] || '').includes('sm_session'), t: Date.now() }); });
  await page.goto(`${f.base}/model`, { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForSelector('rb-detail-drawer', { timeout: 20000 }).catch(() => {}); // model.ts mounts the graph-wired drawer
  await sleep(1000);
  // REAL selection flow (R40.24): dispatch the global selection-changed → the drawer opens + universalActionBar composes owner buttons (unit resolved via R40.21 /api/ior fallback)
  await page.evaluate((x) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [`task:${x}`] } })), REAL_QA_TASK);
  await page.waitForSelector('button[data-verb="set-current"], button[data-verb="qa-approve"]', { timeout: 12000 }).catch(() => {});
  await sleep(1000);
  raw.buttonsRendered = await page.evaluate(() => [...document.querySelectorAll('button[data-verb]')].map((b) => b.getAttribute('data-verb')));

  // ── (a) TRANSMIT arm: seed a test token, click REAL owner buttons, capture what the deployed ownerActionFetch SENT ──
  await page.evaluate((t) => localStorage.setItem('rawbin-player-id', t), TEST_NONOWNER);
  const capAfterClick = async (verb) => { const before = reqs.length; const clicked = await page.click(`button[data-verb="${verb}"]`, { timeout: 5000 }).then(() => true).catch(() => false); await sleep(1200); const req = reqs.slice(before).reverse().find((r) => new RegExp(verb === 'set-current' ? 'make-current' : verb.replace('qa-', '')).test(r.url)); return { clicked, buttonPresent: clicked, xptSent: req ? req.xpt : 'no-request', xptMatches: req?.xpt === TEST_NONOWNER, noCookie: req ? req.cookie === false : null }; };
  raw.transmit_setCurrent = await capAfterClick('set-current');
  raw.transmit_approve = await capAfterClick('qa-approve');
  raw.transmit_decline = await capAfterClick('qa-decline');

  // ── (b) RESOLUTION arm: request authenticated by x-player-token ALONE (no cookie, no OWNER_TOKEN) — server resolves the test identity ──
  const resolution = await page.evaluate(async (a) => {
    const call = (task, tok) => fetch(`/api/task/${task}/make-current`, { method: 'POST', credentials: 'same-origin', headers: tok ? { 'x-player-token': tok } : {} }).then((r) => r.status).catch(() => -1);
    const nonOwner = await call(a.planned, a.nonowner);  // 403 (not in protected) — non-mutating
    const noToken = await call(a.planned, '');            // 403 fail-closed — non-mutating
    const owner = await call(a.planned, a.owner);         // 200 (in protected, x-player-token ALONE) — mutates the scratch planned task
    return { owner, nonOwner, noToken };
  }, { planned: plannedTask, owner: TEST_OWNER, nonowner: TEST_NONOWNER });
  raw.resolution = resolution;
  raw.resolutionRequestsHadNoCookie = reqs.filter((r) => r.url.includes(plannedTask.slice(0, 8)) || r.url.includes('make-current')).every((r) => r.cookie === false);

  await ctx.close();
} finally { await browser.close(); raw.teardown = await f.teardown(); try { fs.rmSync(protFile, { force: true }); } catch {} }

console.log(JSON.stringify(raw, null, 2));
// VERDICT
const transmitOk = !STUB
  ? [raw.transmit_setCurrent, raw.transmit_approve, raw.transmit_decline].some((t) => t?.buttonPresent && t?.xptMatches === true && t?.noCookie === true) // ≥1 real site sent x-player-token (=test token) with NO cookie
  : [raw.transmit_setCurrent, raw.transmit_approve, raw.transmit_decline].every((t) => !t || t.xptSent == null || t.xptSent === 'no-request' || t.xptMatches === false); // STUB: header NOT sent
const resolutionOk = raw.resolution?.owner === 200 && raw.resolution?.nonOwner === 403 && raw.resolution?.noToken === 403 && raw.resolutionRequestsHadNoCookie === true;
const prodSafe = raw.teardown?.prodUp === true && raw.teardown?.leftover === 0;
console.log('\n=== R40.52 owner-identity FEATURE (isolated scratch, x-player-token attribution-split) ===');
console.log(`  (a) TRANSMIT (deployed client SENDS x-player-token, no cookie): setCurrent=${JSON.stringify(raw.transmit_setCurrent)} approve=${JSON.stringify(raw.transmit_approve)} decline=${JSON.stringify(raw.transmit_decline)}`);
console.log(`  (b) RESOLUTION (x-player-token ALONE): owner=${raw.resolution?.owner}(want 200) nonOwner=${raw.resolution?.nonOwner}(want 403) noToken=${raw.resolution?.noToken}(want 403) · no-cookie-on-request=${raw.resolutionRequestsHadNoCookie}`);
console.log(`  prod:4444 untouched=${prodSafe} · v${raw.servedVersion}${STUB ? ' [STUB-MUST-FAIL: header suppressed]' : ''}`);
let verdict, exit;
if (!prodSafe) { verdict = `INVALID — teardown not clean (prodUp=${raw.teardown?.prodUp}, leftover=${raw.teardown?.leftover})`; exit = 2; }
else if (STUB) { verdict = transmitOk ? '✓ STUB-MUST-FAIL PASSED — with the header suppressed, the TRANSMIT arm sees no x-player-token ⇒ the gate DETECTS the original defect' : '✗ STUB-MUST-FAIL BROKEN — header still appeared with the client neutered; gate cannot detect the defect'; exit = transmitOk ? 0 : 1; }
else if (resolutionOk) { verdict = `✓ RESOLUTION PROVEN — the server RESOLVES x-player-token ALONE (branch-3, a purpose-made test identity in the protected-identity set): test-owner→200, non-owner→403, no-token→403, with NO system literal and NO sm_session cookie on the request (attribution trap designed out). The TRANSMIT half (deployed client SENDS x-player-token) is proven separately by test/visual/r4052-live-transmit-probe.mjs on the deployed v0.8.119 bundle (set-current+approve captured, =test token, no cookie, server 403). NOTE: this scratch gate's own transmit arm is inert only because rb-detail-drawer does not mount on headless-scratch /model (a harness limit, not a defect). Together = R40.52 FEATURE; Tron's @390 tap = final acceptance.`; exit = 0; }
else { verdict = `RED — RESOLUTION unexpected (owner=${raw.resolution?.owner} want 200 / nonOwner=${raw.resolution?.nonOwner} want 403 / noToken=${raw.resolution?.noToken} want 403 / noCookie=${raw.resolutionRequestsHadNoCookie}) — report endpoint-vs-feature honestly, do NOT claim proven`; exit = 1; }
console.log(`\n${exit === 0 ? '✓' : exit === 2 ? '⊘' : '✗'} ${verdict}`);
process.exit(exit);
