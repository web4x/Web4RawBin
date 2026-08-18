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
// C1 neuter — insert an early-return in publishUnitChanged's IMPLEMENTATION body. The old regex used [^=]* which stops at the
// '=' in the type annotation '=> void' → never matched (grep -c=0). This matches the impl arrow specifically ([\s\S]*? spans the
// type). teardownAsserts the neuter TOOK EFFECT (marker present) — prove-the-instrument-before-the-reading.
function neuterBroadcast(root) {
  const p = path.join(root, 'src/ts/server/server.ts');
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(/(const publishUnitChanged:[\s\S]*?=\s*\(ior, uuid\)\s*=>\s*\{)/, '$1 if (1) return; /* C1: broadcast OFF */');
  if (after === before || !after.includes('/* C1: broadcast OFF */')) throw new Error('neuterBroadcast: regex did NOT patch publishUnitChanged — instrument would be unproven');
  fs.writeFileSync(p, after);
}

const drawerState = (page) => page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  const badge = d?.querySelector('.dv-status-badge')?.textContent?.trim() || null; // architect: assert live status via the BADGE ELEMENT, not a textContent substring
  return { approve: !!d?.querySelector('button[data-verb="qa-approve"]'), decline: !!d?.querySelector('button[data-verb="qa-decline"]'),
    badge, sentinel: window.__c2s || null, nav: window.__c2nav || 0, len: (d?.textContent || '').length };
});
// WARMUP: open the task AND wait for the status-driven controls/badge to actually RENDER, so present-before is a real snapshot (not a too-early read).
async function openTask(page, u) {
  await page.waitForSelector('rb-detail-drawer', { timeout: 15000 });
  await page.evaluate((x) => { const d = document.querySelector('rb-detail-drawer'); d.setAttribute('open', ''); d.setAttribute('ref', `task:${x}`); }, u);
  await page.waitForSelector('rb-detail-drawer button[data-verb="qa-approve"]', { timeout: 8000 }).catch(() => {}); // warmup: controls rendered
  await page.waitForSelector('rb-detail-drawer .dv-status-badge', { timeout: 4000 }).catch(() => {});
}

async function runB({ serverPatch, label, commit, buildDist }) {
  const f = await setupFoundation({ attachEvidenceTo: TARGET, ...(commit ? { commit } : {}), ...(buildDist ? { buildDist: true } : {}), ...(serverPatch ? { serverPatch } : {}) });
  const oh = f.ownerHeaders(); const smSession = (/sm_session=([^;]+)/.exec(oh.Cookie || '') || [])[1] || '';
  const cookie = { name: 'sm_session', value: smSession, domain: 'localhost', path: '/', httpOnly: true, secure: true };
  const browser = await webkit.launch({ headless: true });
  const c2reqs = []; const raw = { label, target: TARGET, worktreeSha: f.worktreeSha, servedVersion: f.servedVersion, distHasViewBusKey: f.distHasViewBusKey };
  try {
    const ctx1 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx1.addCookies([cookie]);
    const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx2.addCookies([cookie]);
    const p1 = await ctx1.newPage(); const p2 = await ctx2.newPage();
    // CAUSALITY-BY-EXCLUSION (architect 439adf982 — corrects the tree-less premise I disproved: /model DOES poll the tree). Keep the
    // REAL page; capture client-2's WS FRAMES; the C1 arm (broadcast OFF, SAME page, SAME polls) is the EXCLUSION control: polls fire
    // in BOTH arms but the update happens ONLY with broadcast → polls excluded as the cause, the WS broadcast IS the cause.
    const wsFrames = [];
    p2.on('websocket', (ws) => { ws.on('framereceived', (ev) => { try { const m = JSON.parse(ev.payload); wsFrames.push({ type: m.type, uuid: m.uuid, t: Date.now() }); } catch { /* non-JSON frame */ } }); });
    await p1.goto(`${f.base}/model`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await p2.goto(`${f.base}/model`, { waitUntil: 'domcontentloaded', timeout: 20000 });
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
    // CAUSALITY-BY-EXCLUSION evidence: the WS broadcast frame carrying TARGET (the cause) + proof the polls fired (excluded by C1).
    raw.wsFramesAfterApprove = wsFrames.filter((fr) => fr.t >= approveAt).map((fr) => ({ type: fr.type, uuid: String(fr.uuid || '').slice(0, 8) }));
    raw.wsUnitChangedForTarget = wsFrames.some((fr) => fr.type === 'unit-changed' && String(fr.uuid || '') === TARGET && fr.t >= approveAt);
    raw.pollCountAfterApprove = raw.c2GetsAfterApprove.filter((u) => u.includes('/api/')).length; // polls DID fire (both arms) — the C1 arm excludes them as the cause
    await ctx1.close(); await ctx2.close();
  } finally { await browser.close(); raw.teardown = await f.teardown(); }
  return raw;
}

async function prodStatus(u) { try { const r = await fetch(`${PROD}/api/ior/${u}`); const j = await r.json(); return j?.unit?.model?.status ?? j?.result?.unit?.model?.status ?? j?.model?.status ?? null; } catch { return 'err'; } }
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const prodBefore = await prodStatus(TARGET);

// DIFFERENTIAL axis (architect 7-pt bar): COMMIT pins the arm (PRE=748cab757 pre-viewBusKey / POST=>=50b22399a fix);
// BUILDDIST forces a worktree build so dist==THIS commit (provenance-provable, not a moving symlink). PRE_ONLY skips the
// C1 exclusion (meaningless pre-fix — the PRE arm just establishes the INERT baseline for the pre→post DELTA).
const COMMIT = process.env.COMMIT || null; const BUILDDIST = process.env.BUILDDIST === '1'; const PRE_ONLY = process.env.PRE_ONLY === '1';
console.log(`R40.31 B (VANISH) — POSITIVE (broadcast ON)${COMMIT ? ` @${COMMIT} buildDist=${BUILDDIST}` : ''}${PRE_ONLY ? ' [PRE-BASELINE]' : ''}…`);
const pos = await runB({ label: 'positive', commit: COMMIT, buildDist: BUILDDIST });
console.log(JSON.stringify(pos, null, 2));
let c1 = { skipped: true, distHasViewBusKey: pos.distHasViewBusKey };
if (!PRE_ONLY) {
  console.log('\nR40.31 B — C1 STUB broadcast OFF (client-2 must NOT update)…');
  c1 = await runB({ label: 'C1-broadcast-off', serverPatch: neuterBroadcast, commit: COMMIT, buildDist: BUILDDIST });
  console.log(JSON.stringify(c1, null, 2));
}
const prodAfter = await prodStatus(TARGET);

// PRE-BASELINE short-circuit: the pre-fix arm proves the DELTA's low end — provenance says NO viewBusKey in the bundle, and
// the drawer is INERT (broadcast received, controls do NOT vanish). This is the EXPECTED pre-fix result, reported as a
// labelled baseline (not RED) — it pairs with the POST arm to make pre=INERT→post=IN-PLACE the proof.
if (PRE_ONLY) {
  const b0 = pos.before, a0 = pos.after;
  const inert = !(a0?.approve === false && a0?.decline === false); // controls did NOT vanish = INERT (pre-fix)
  const provenancePreFix = pos.distHasViewBusKey === false;         // built bundle carries NO viewBusKey = genuinely pre-fix
  console.log('\n=== PRE-FIX BASELINE (differential low end) ===');
  console.log(`  worktree ${pos.worktreeSha}/v${pos.servedVersion} · dist-provenance viewBusKey=${pos.distHasViewBusKey} (want false)`);
  console.log(`  drawer INERT (controls did NOT vanish): ${inert}  [before ${JSON.stringify(b0)} after ${JSON.stringify(a0)}]`);
  console.log(`  WS frame carried TARGET (bridge received, render inert): ${pos.wsUnitChangedForTarget}`);
  console.log(`  prod ${TARGET} unchanged: ${prodBefore === 'QA Review' && prodAfter === 'QA Review'} · teardown prod:4444 untouched+0 leftover: ${pos.teardown?.prodUp === true && pos.teardown?.leftover === 0}`);
  const ok = provenancePreFix && inert;
  console.log(`\n${ok ? '✓ PRE-BASELINE VALID' : '⊘ PRE-BASELINE INVALID'} — provenance-pre-fix=${provenancePreFix} AND drawer-inert=${inert} ${ok ? '(supersedes f11b71bcf symlink-dist baseline)' : '(re-check: provenance or inert failed)'}`);
  process.exit(ok ? 0 : 2);
}

// VERDICT
const b = pos.before, a = pos.after;
const presentBefore = b?.approve === true && b?.decline === true;                        // (3) controls present-before (warmup landed)
const absentAfter = a?.approve === false && a?.decline === false;                         // (3) controls vanished
const badgeFlip = b?.badge === 'QA Review' && a?.badge === 'Done';                        // status via the BADGE ELEMENT flipped QA Review→Done (not a substring)
const noReload = a && b && a.sentinel === b.sentinel && a.sentinel !== null && a.nav === 0 && pos.c2NavAfterApprove === 0; // (4) no reload
const fast = pos.latencyMs !== null && pos.latencyMs < 5000;                              // causal window
const client1Moved = pos.client1?.approve === false;                                     // Tab A moved too
// ★ CAUSALITY-BY-EXCLUSION (architect 439adf982): the WS broadcast frame for TARGET arrived (cause present) AND the C1 arm
// (broadcast OFF, SAME real page, polls STILL fired) did NOT update and received NO unit-changed frame → polls fire in BOTH
// arms but the update happens ONLY with the broadcast → polls are EXCLUDED as the cause, the WS broadcast IS the cause.
const wsCarried = pos.wsUnitChangedForTarget === true;
const pollsFiredBothArms = pos.pollCountAfterApprove > 0 && c1.pollCountAfterApprove > 0;
const c1NoUpdate = c1.after?.approve === true && c1.latencyMs === null && c1.wsUnitChangedForTarget === false; // (2) broadcast off → no update, no frame, despite polls
const broadcastByExclusion = wsCarried && pollsFiredBothArms && c1NoUpdate;
const prodUnchanged = prodBefore === 'QA Review' && prodAfter === 'QA Review';            // ★ isolation held for the REAL task
const prodSafe = pos.teardown?.prodUp === true && pos.teardown?.leftover === 0 && c1.teardown?.prodUp === true && c1.teardown?.leftover === 0;

console.log('\n=== VERDICT B (VANISH — Tab B moves from broadcast ALONE, no reload; causality-by-exclusion) ===');
console.log(`  subject ${TARGET} · PROVEN AT worktree ${pos.worktreeSha}/v${pos.servedVersion} (C1 @ ${c1.worktreeSha}/v${c1.servedVersion})`);
console.log(`  (3) controls PRESENT-before=${presentBefore} → ABSENT-after=${absentAfter} · BADGE ${b?.badge}→${a?.badge} flip=${badgeFlip}`);
console.log(`  (4) NO-RELOAD positive (sentinel survived + 0 nav): ${noReload} · fast<5s=${fast}(${pos.latencyMs}ms) · Tab A moved=${client1Moved}`);
console.log(`  ★ EXCLUSION: WS frame carried TARGET=${wsCarried} · polls fired both arms=${pollsFiredBothArms} (pos ${pos.pollCountAfterApprove}/C1 ${c1.pollCountAfterApprove}) · C1 broadcast-OFF→no-update+no-frame=${c1NoUpdate} ⇒ broadcast-by-exclusion=${broadcastByExclusion}`);
console.log(`  WS frames after approve (client-2): ${JSON.stringify(pos.wsFramesAfterApprove)}`);
console.log(`  ★ PROD 97e8a6ad UNCHANGED (isolation held for a REAL task): ${prodUnchanged}  [${prodBefore} → ${prodAfter}] · teardown prod:4444 untouched + 0 leftover: ${prodSafe}`);
const neuterWorked = c1.wsUnitChangedForTarget === false; // ★ prove-the-instrument: C1 must have SUPPRESSED the broadcast, else the exclusion is unreadable
const green = presentBefore && absentAfter && badgeFlip && noReload && fast && client1Moved && broadcastByExclusion && prodUnchanged && prodSafe;
let outcome, exit;
if (!neuterWorked) { outcome = `INVALID — C1 neuter did NOT suppress the broadcast (C1 still received unit-changed for TARGET) → instrument unproven, exclusion unreadable. prove-the-instrument-before-the-reading.`; exit = 2; }
else if (!presentBefore) { outcome = 'INVALID — controls not present-before (precondition/warmup unmet), nothing to vanish'; exit = 2; }
else if (green) { outcome = 'GREEN — Tab B vanished from the broadcast ALONE (causality-by-exclusion: WS frame carried it, C1 excludes the polls)'; exit = 0; }
else { outcome = `RED — /model drawer RECEIVED the broadcast (wsCarried=${wsCarried}) but did NOT re-render (absentAfter=${absentAfter}, badgeFlip=${badgeFlip}, client1Moved=${client1Moved}) — Tron's live-MVC gap on /model OR graph-less-drawer does-not-live-update (architect premise question)`; exit = 1; }
console.log(`\n${outcome.startsWith('GREEN') ? '✓' : outcome.startsWith('INVALID') ? '⊘' : '✗'} ${outcome}`);
process.exit(exit);
