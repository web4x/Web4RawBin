// R40.31 LANDING-3 · HALF B (VANISH) — TRON'S #1 ACCEPTANCE ("live MVC not at all working"). Owner approves on client-1;
// a GENUINELY PASSIVE client-2 (never clicked, no local emit) re-renders detail + status-badge + CONTROLS (Approve/Decline
// VANISH at Done) from the BROADCAST ALONE, NO reload. Does NOT need graph-absence — runs on a NORMAL current-sprint QA-Review
// task (97e8a6ad, graph-present → controls ARE present, exactly what present-before→absent-after needs). 4 TRAPS:
//   (1) broadcast≠poll: client-2 makes ZERO requests in a quiet window; the ONLY GET after approve is surgical /api/ior/<uuid>; update <5s (causal).
//   (2) proof MUST FAIL with broadcast suppressed = C1 (serverPatch neuters publishUnitChanged → client-2 stays connected, does NOT update).
//   (3) controls PRESENT-BEFORE → ABSENT-AFTER (never absence-only).
//   (4) NO-RELOAD as a POSITIVE sentinel surviving the action + nav counter 0.
// Approve reaches Done via a MECHANISM FIXTURE (attachEvidenceTo injects a passing two-keyed Test into the REAL task's SCRATCH
// chain) — proves the approve→Done→broadcast PATH, does NOT claim the real task is Done-worthy. POST-RUN: assert PROD still shows
// 97e8a6ad = 'QA Review' (isolation held for a REAL task — the strongest safeguard). VERSION-PINNED per arm. Real-WebKit @390. Raw → PO+architect.
import { webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { setupFoundation } from './r4031-foundation.mjs';

const TARGET = process.env.VANISH_UUID || '97e8a6ad-46db-440f-a9be-cfb97ca64df4'; // Sprint 37 (current) QA-Review, graph-present → controls render
const PROD = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function neuterBroadcast(root) { const p = path.join(root, 'src/ts/server/server.ts'); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/const publishUnitChanged:[^=]*=\s*\(ior, uuid\) =>\s*\{/, 'const publishUnitChanged: (ior: string, uuid: string) => void = (ior, uuid) => { if (1) return; /* C1: broadcast OFF */')); }

const drawerState = (page) => page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer'); const t = d?.textContent || '';
  return { approve: !!d?.querySelector('button[data-verb="qa-approve"]'), decline: !!d?.querySelector('button[data-verb="qa-decline"]'),
    statusDone: /\bDone\b/.test(t), statusQaReview: /QA Review/.test(t), sentinel: window.__c2s || null, nav: window.__c2nav || 0, len: t.length };
});
async function openTask(page, u) { await page.waitForSelector('rb-detail-drawer', { timeout: 15000 }); await page.evaluate((x) => { const d = document.querySelector('rb-detail-drawer'); d.setAttribute('open', ''); d.setAttribute('ref', `task:${x}`); }, u); }

async function runB({ serverPatch, label }) {
  const f = await setupFoundation({ attachEvidenceTo: TARGET, ...(serverPatch ? { serverPatch } : {}) });
  const oh = f.ownerHeaders(); const smSession = (/sm_session=([^;]+)/.exec(oh.Cookie || '') || [])[1] || '';
  const cookie = { name: 'sm_session', value: smSession, domain: 'localhost', path: '/', httpOnly: true, secure: true };
  const browser = await webkit.launch({ headless: true });
  const c2reqs = []; const raw = { label, target: TARGET, worktreeSha: f.worktreeSha, servedVersion: f.servedVersion };
  try {
    const ctx1 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx1.addCookies([cookie]);
    const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx2.addCookies([cookie]);
    const p1 = await ctx1.newPage(); const p2 = await ctx2.newPage();
    await p1.goto(`${f.base}/trace`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await p2.goto(`${f.base}/trace`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await p2.waitForFunction(() => window.__liveTransport?.state === 'connected', { timeout: 12000 }).catch(() => {});
    await p2.evaluate(() => { window.__c2s = 'c2-' + Math.random().toString(36).slice(2); window.__c2nav = 0; });
    p2.on('framenavigated', (fr) => { if (fr === p2.mainFrame()) c2reqs.push({ nav: true }); });
    p2.on('request', (r) => c2reqs.push({ url: r.url(), t: Date.now() }));
    await openTask(p1, TARGET); await openTask(p2, TARGET);
    await sleep(1200);
    raw.before = await drawerState(p2);                               // (3) controls PRESENT-before (97e8a6ad graph-present → render)
    const idleMark = c2reqs.length; await sleep(3000);
    raw.pollInQuietWindow = c2reqs.slice(idleMark).filter((r) => !r.nav).length; // (1) no poll
    const approveAt = Date.now(); const reqMark = c2reqs.length;
    raw.client1HadApprove = !!(await p1.$('rb-detail-drawer button[data-verb="qa-approve"]'));
    if (raw.client1HadApprove) await p1.click('rb-detail-drawer button[data-verb="qa-approve"]'); // owner acts on client-1 (real UI)
    let latency = null;
    for (let i = 0; i < 60 && latency === null; i++) { const s = await drawerState(p2); if (s.approve === false && s.decline === false && raw.before.approve === true) latency = Date.now() - approveAt; else await sleep(100); }
    await sleep(500);
    raw.after = await drawerState(p2);                                // (3) controls ABSENT-after
    raw.latencyMs = latency;
    raw.c2GetsAfterApprove = c2reqs.slice(reqMark).filter((r) => !r.nav && r.t >= approveAt).map((r) => r.url.replace(f.base, '')); // (1) surgical
    raw.c2NavAfterApprove = c2reqs.slice(reqMark).filter((r) => r.nav).length;
    raw.client1 = await drawerState(p1);
    await ctx1.close(); await ctx2.close();
  } finally { await browser.close(); raw.teardown = await f.teardown(); }
  return raw;
}

async function prodStatus(u) { try { const r = await fetch(`${PROD}/api/ior/${u}`); const j = await r.json(); return j?.unit?.model?.status ?? j?.result?.unit?.model?.status ?? j?.model?.status ?? null; } catch { return 'err'; } }
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const prodBefore = await prodStatus(TARGET);

console.log('R40.31 B (VANISH) — POSITIVE (broadcast ON)…');
const pos = await runB({ label: 'positive' });
console.log(JSON.stringify(pos, null, 2));
console.log('\nR40.31 B — C1 STUB broadcast OFF (client-2 must NOT update)…');
const c1 = await runB({ label: 'C1-broadcast-off', serverPatch: neuterBroadcast });
console.log(JSON.stringify(c1, null, 2));
const prodAfter = await prodStatus(TARGET);

// VERDICT
const b = pos.before, a = pos.after;
const presentBefore = b?.approve === true && b?.decline === true;                       // (3)
const absentAfter = a?.approve === false && a?.decline === false;                        // (3)
const noReload = a && b && a.sentinel === b.sentinel && a.sentinel !== null && a.nav === 0 && pos.c2NavAfterApprove === 0; // (4)
const noPoll = pos.pollInQuietWindow === 0;                                              // (1a)
const surgical = pos.c2GetsAfterApprove?.length > 0 && pos.c2GetsAfterApprove.every((u) => u.includes(`/api/ior/${TARGET}`)); // (1b)
const fast = pos.latencyMs !== null && pos.latencyMs < 5000;                             // causal
const client1Moved = pos.client1?.approve === false;                                    // Tab A moved
const c1Falsifiable = c1.after?.approve === true && c1.latencyMs === null;               // (2) broadcast off → no update
const prodUnchanged = prodBefore === 'QA Review' && prodAfter === 'QA Review';           // ★ isolation held for the REAL task
const prodSafe = pos.teardown?.prodUp === true && pos.teardown?.leftover === 0 && c1.teardown?.prodUp === true && c1.teardown?.leftover === 0;

console.log('\n=== VERDICT B (VANISH — Tab B moves from broadcast alone, no reload) ===');
console.log(`  subject ${TARGET} · PROVEN AT worktree ${pos.worktreeSha}/v${pos.servedVersion} (C1 @ ${c1.worktreeSha}/v${c1.servedVersion})`);
console.log(`  (3) controls PRESENT-before=${presentBefore} → ABSENT-after=${absentAfter}  [before ${JSON.stringify(b)} after ${JSON.stringify(a)}]`);
console.log(`  (4) NO-RELOAD positive (sentinel survived + 0 nav): ${noReload}`);
console.log(`  (1) no-poll=${noPoll}(${pos.pollInQuietWindow}) · surgical /api/ior only=${surgical}(${JSON.stringify(pos.c2GetsAfterApprove)}) · fast<5s=${fast}(${pos.latencyMs}ms)`);
console.log(`  Tab A moved: ${client1Moved}`);
console.log(`  (2) STUB broadcast-OFF → client-2 did NOT update: ${c1Falsifiable}`);
console.log(`  ★ PROD 97e8a6ad UNCHANGED (isolation held for a REAL task): ${prodUnchanged}  [${prodBefore} → ${prodAfter}]`);
console.log(`  teardown prod:4444 untouched + 0 leftover: ${prodSafe}`);
const green = presentBefore && absentAfter && noReload && noPoll && surgical && fast && client1Moved && c1Falsifiable && prodUnchanged && prodSafe;
console.log(`\n${green ? '✓ GREEN' : '✗ RED'} — B VANISH (Tron's #1: Tab B moves from broadcast alone, no reload)`);
process.exit(green ? 0 : 1);
