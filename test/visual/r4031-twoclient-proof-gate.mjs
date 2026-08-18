// R40.31 LANDING-3 — REAL-PAGE TWO-CLIENT BROADCAST PROOF, TWO-SIDED (Tron's acceptance: Tab B moves, NO reload) + the
// control-visibility-by-STATUS-not-membership fix (attachTaskStatus, ed3442d10) LOCKED BY ACCEPTANCE.
// The foundation's seeded qaReview task is NON-EAGER BY CONSTRUCTION (no sprintName/parent → not in any pinned Sprint.tasks[]
// → not a current-sprint eager child). So this exercises the OUT-OF-WINDOW case the defect masked — proving controls appear
// from ACTUAL STATUS (via /api/ior attachTaskStatus), not eager-graph membership. Two-sided, both directions, 4 traps:
//   (A) APPEAR  — Approve/Decline RENDER for the actionable NON-EAGER QA-Review task (they did NOT pre-fix → the lock).
//   (B) VANISH  — controls GONE at Done on a PASSIVE client-2 (never clicked, no local emit) from the BROADCAST ALONE, NO reload.
//   (C) STUB-MUST-FAIL both directions:
//        C1 broadcast OFF (serverPatch neuters publishUnitChanged) → client-2 stays connected but does NOT update (proof falsifiable).
//        C2 status-unresolvable (serverPatch neuters attachTaskStatus) → an ACTIONABLE task must NOT silently read as not-actionable
//           (the :477 fail-loud-unresolved half). Silent-hide ⇒ this stub RED. [predicate finalized against the landed fail-loud form.]
//   4 TRAPS: (1) broadcast≠poll — client-2 makes ZERO requests in a quiet window + the ONLY GET after approve is surgical /api/ior/<uuid>,
//   update <5s (causal, not "eventually"); (2) proof falsifiable = C1; (3) controls PRESENT-before → ABSENT-after (never absence-only);
//   (4) NO-RELOAD positive = a sentinel set on client-2 BEFORE survives + nav counter 0.
// RAW row/badge/detail/controls deltas + client-2 request log → PO + architect interpret. node22 + webkit. RUN ONCE when :477 lands.
import { webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { setupFoundation } from './r4031-foundation.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openTaskDrawer(page, uuid) {
  await page.evaluate((u) => { const d = document.querySelector('rb-detail-drawer'); d.setAttribute('open', ''); d.setAttribute('ref', `task:${u}`); }, uuid);
}
const drawerState = (page) => page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  const ap = d?.querySelector('button[data-verb="qa-approve"]');
  const dc = d?.querySelector('button[data-verb="qa-decline"]');
  const text = (d?.textContent || '');
  return {
    approvePresent: !!ap, declinePresent: !!dc,
    statusDone: /\bDone\b/.test(text), statusQaReview: /QA Review/.test(text),
    // fail-loud signal (C2, :477 a38cd7c91-pt4): an absent TASK status is OBSERVABLE, not silently hidden — the deployed hook
    // is the `data-status-unresolved` attribute (a gate + a human read it) + a console.error naming the ref.
    unresolvedSignal: !!document.querySelector('rb-detail-drawer [data-status-unresolved], rb-detail-drawer[data-status-unresolved], [data-status-unresolved]'),
    detailLen: text.length, sentinel: window.__c2sentinel || null, navCount: window.__c2nav || 0,
  };
});

async function runProof({ serverPatch, label, doApprove = true }) {
  const f = await setupFoundation(serverPatch ? { serverPatch } : {});
  const oh = f.ownerHeaders();
  const smSession = (/sm_session=([^;]+)/.exec(oh.Cookie || '') || [])[1] || '';
  const cookie = { name: 'sm_session', value: smSession, domain: 'localhost', path: '/', httpOnly: true, secure: true };
  const uuid = f.seeded.qaReview;
  const browser = await webkit.launch({ headless: true });
  const c2reqs = [];
  const raw = { label, uuid, base: f.base };
  try {
    // confirm NON-EAGER: the seeded task is not among the current-sprint eager children (control must come from status, not membership)
    const probe = await browser.newContext({ ignoreHTTPSErrors: true }); await probe.addCookies([cookie]);
    const pp = await probe.newPage(); await pp.goto(`${f.base}/trace`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    raw.iorStatus = await pp.evaluate(async (u) => { try { return (await (await fetch(`/api/ior/${u}`)).json())?.model?.status ?? null; } catch { return 'err'; } }, uuid);
    raw.nonEager = await pp.evaluate((u) => { const g = document.querySelector('rb-detail-drawer')?._graph; const o = g?.get?.(u); return !o; }, uuid); // absent from the eager graph = non-eager
    await probe.close();

    const ctx1 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx1.addCookies([cookie]);
    const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx2.addCookies([cookie]);
    const p1 = await ctx1.newPage(); const p2 = await ctx2.newPage();
    const consoleErrors = []; // C2 fail-loud: :477 emits a console.error naming the ref for a genuinely-unresolvable task
    p2.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); });
    await p1.goto(`${f.base}/trace`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await p2.goto(`${f.base}/trace`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await p2.waitForFunction(() => window.__liveTransport && window.__liveTransport.state === 'connected', { timeout: 12000 }).catch(() => {});
    await p2.evaluate(() => { window.__c2sentinel = 'c2-' + Math.random().toString(36).slice(2); window.__c2nav = 0; window.addEventListener('beforeunload', () => { window.__c2nav = (window.__c2nav || 0) + 1; }); });
    p2.on('framenavigated', (fr) => { if (fr === p2.mainFrame()) c2reqs.push({ nav: true }); });
    p2.on('request', (r) => c2reqs.push({ url: r.url(), t: Date.now() }));
    await openTaskDrawer(p1, uuid); await openTaskDrawer(p2, uuid);
    await sleep(1200);
    raw.before = await drawerState(p2); // (A) APPEAR + (C2) unresolvedSignal captured here
    raw.consoleErrors = consoleErrors.filter((t) => /status|unresolved|ref|task/i.test(t)); // C2 LOUD console.error

    if (doApprove) {
      const idleMark = c2reqs.length; await sleep(3000);
      raw.pollRequestsInQuietWindow = c2reqs.slice(idleMark).filter((r) => !r.nav).length; // (trap1) no poll
      const approveAt = Date.now();
      const canClick = await p1.$('rb-detail-drawer button[data-verb="qa-approve"]');
      raw.client1HadApprove = !!canClick;
      const reqMark = c2reqs.length;
      if (canClick) await p1.click('rb-detail-drawer button[data-verb="qa-approve"]');
      let updatedAtMs = null;
      for (let i = 0; i < 50 && updatedAtMs === null; i++) { const s = await drawerState(p2); if (!s.approvePresent && !s.declinePresent && s.approvePresent !== raw.before.approvePresent) updatedAtMs = Date.now() - approveAt; else await sleep(100); }
      await sleep(400);
      raw.after = await drawerState(p2);
      raw.updateLatencyMs = updatedAtMs;
      raw.c2GetsAfterApprove = c2reqs.slice(reqMark).filter((r) => !r.nav && r.t >= approveAt).map((r) => r.url.replace(f.base, ''));
      raw.c2NavAfterApprove = c2reqs.slice(reqMark).filter((r) => r.nav).length;
      raw.client1 = await drawerState(p1);
    }
    await ctx1.close(); await ctx2.close();
  } finally { await browser.close(); raw.teardown = await f.teardown(); }
  return raw;
}

// serverPatches (worktree source, pre-boot; torn down with the worktree)
function neuterBroadcast(root) { const p = path.join(root, 'src/ts/server/server.ts'); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/const publishUnitChanged:[^=]*=\s*\(ior, uuid\) =>\s*\{/, 'const publishUnitChanged: (ior: string, uuid: string) => void = (ior, uuid) => { if (1) return; /* R40.31 C1: broadcast OFF */')); }
function neuterAttachStatus(root) { const p = path.join(root, 'src/ts/server/server.ts'); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/function attachTaskStatus\(m: Record<string, unknown>\): void \{/, 'function attachTaskStatus(m: Record<string, unknown>): void { if (1) return; /* R40.31 C2: attachTaskStatus OFF */')); }

console.log('R40.31 landing-3 — POSITIVE (fix ON, broadcast ON)…');
const pos = await runProof({ label: 'positive' });
console.log(JSON.stringify(pos, null, 2));
console.log('\nR40.31 landing-3 — C1 STUB broadcast OFF (client-2 must NOT update)…');
const c1 = await runProof({ label: 'C1-broadcast-off', serverPatch: neuterBroadcast });
console.log(JSON.stringify(c1, null, 2));
console.log('\nR40.31 landing-3 — C2 STUB attachTaskStatus OFF (actionable task must NOT silently hide = the :477 fail-loud)…');
const c2 = await runProof({ label: 'C2-status-off', serverPatch: neuterAttachStatus, doApprove: false });
console.log(JSON.stringify(c2, null, 2));

// VERDICT
const b = pos.before, a = pos.after;
const appear = b && b.approvePresent === true && b.declinePresent === true;                              // (A) controls APPEAR for non-eager actionable task
const nonEager = pos.nonEager === true && pos.iorStatus === 'QA Review';                                 // proven non-eager + status carried by /api/ior (the fix)
const vanish = a && a.approvePresent === false && a.declinePresent === false;                            // (B) VANISH after broadcast
const noReload = a && b && a.sentinel === b.sentinel && a.sentinel !== null && a.navCount === 0 && pos.c2NavAfterApprove === 0; // (trap4)
const noPoll = pos.pollRequestsInQuietWindow === 0;                                                       // (trap1a)
const surgical = pos.c2GetsAfterApprove?.length > 0 && pos.c2GetsAfterApprove.every((u) => u.includes(`/api/ior/${pos.uuid}`)); // (trap1b)
const fast = pos.updateLatencyMs !== null && pos.updateLatencyMs < 5000;                                  // causal, bounded
const client1Moved = pos.client1 && pos.client1.approvePresent === false;                                 // Tab A moved
const c1Falsifiable = c1.after && c1.after.approvePresent === true && c1.updateLatencyMs === null;        // (C1) broadcast off → no update
// (C) TWO-SIDED, assert the LOUD signal EXISTS (fail-loud, not merely fail-safe):
const cResolvableRenders = appear && pos.before.unresolvedSignal === false;                               // (C-i) status resolvable → controls RENDER + NO false unresolved-signal (non-vacuous)
const cUnresolvableLoud = c2.before && c2.before.unresolvedSignal === true && (c2.consoleErrors?.length > 0); // (C-ii) genuinely-unresolvable → data-status-unresolved attr AND console.error = LOUD, never silent
const prodSafe = [pos, c1, c2].every((r) => r.teardown?.prodUp === true && r.teardown?.leftover === 0);

console.log('\n=== VERDICT (landing-3 two-sided) ===');
console.log(`  (A) APPEAR non-eager actionable controls present: ${appear}  [nonEager=${pos.nonEager} iorStatus=${pos.iorStatus}]`);
console.log(`  (B) VANISH at Done from broadcast: ${vanish}  (latency ${pos.updateLatencyMs}ms)`);
console.log(`  trap1 no-poll: ${noPoll} (${pos.pollRequestsInQuietWindow}) · surgical /api/ior only: ${surgical} (${JSON.stringify(pos.c2GetsAfterApprove)}) · fast<5s: ${fast}`);
console.log(`  trap4 no-reload positive (sentinel survived + 0 nav): ${noReload}`);
console.log(`  Tab A moved: ${client1Moved}`);
console.log(`  (C1) broadcast-OFF → client-2 did NOT update: ${c1Falsifiable}`);
console.log(`  (C-i) resolvable → controls render, NO false unresolved-signal: ${cResolvableRenders}  [pos.unresolvedSignal=${pos.before?.unresolvedSignal}]`);
console.log(`  (C-ii) unresolvable → LOUD (data-status-unresolved + console.error): ${cUnresolvableLoud}  [attr=${c2.before?.unresolvedSignal} errs=${JSON.stringify(c2.consoleErrors)}]`);
console.log(`  teardown prod:4444 untouched + 0 leftover (all runs): ${prodSafe}`);
const green = appear && nonEager && vanish && noReload && noPoll && surgical && fast && client1Moved && c1Falsifiable && cResolvableRenders && cUnresolvableLoud && prodSafe;
console.log(`\n${green ? '✓ GREEN' : '✗ RED'} — landing-3 two-sided (APPEAR + VANISH + C1 + C2 + 4 traps)`);
process.exit(green ? 0 : 1);
