// R40.31 LANDING-3 · HALF A (APPEAR) — control-visibility follows STATUS not MEMBERSHIP, on a GRAPH-ABSENT subject (architect
// ruling): obj = _graph.get || _fallbackGraph.get (rb-detail-drawer.ts:481). A real non-current-sprint QA-Review task opened BY
// REF that is NOT in _graph lands in _fallbackGraph from /api/ior → status comes ONLY from /api/ior (the fix). MUST verify
// _graph.get(subject)===undefined AT TEST TIME (part of the evidence). Then BOTH proofs (belt + braces):
//   DIRECT      = controls RENDER + _graph.get=undefined + /api/ior status='QA Review'  ⇒ /api/ior is the SOLE status source.
//   DIFFERENTIAL= same graph-absent subject, attachTaskStatus ON→RENDER vs OFF(serverPatch, SAME commit)→HIDE; _graph identical
//                 (absent) both arms ⇒ isolates attachTaskStatus by construction (if membership were the source, OFF would render too).
// The gate SWEEPS candidate non-current-sprint QA-Review tasks and picks the first that measures graph-absent (92bdca8b was in
// _graph — confounded — so never assumed). VERSION-PINNED per arm (trap-5). Real-WebKit @390. Raw → PO + architect.
import { webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { setupFoundation } from './r4031-foundation.mjs';

const CANDIDATES = [ // non-current-sprint QA-Review tasks (Sprint 25 / 40 = not the current pin) — sweep for one measuring graph-absent
  '92bdca8b-6c08-459d-a540-98073b80c020', '9a70ce5e-7e88-45f9-b921-0f8e9caf07a6',
  '9f11a990-79bd-46e4-95e2-abe066f4b95b', '9ca4b58f-015f-44b8-9b27-62eeee31d4ea', '97e8a6ad-46db-440f-a9be-cfb97ca64df4',
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function neuterAttachStatus(root) { const p = path.join(root, 'src/ts/server/server.ts'); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/function attachTaskStatus\(m: Record<string, unknown>\): void \{/, 'function attachTaskStatus(m: Record<string, unknown>): void { if (1) return; /* differential FIX-OFF (attachTaskStatus neutered @ this commit) */')); }

const iorStatusOf = (page, u) => page.evaluate(async (x) => { try { const j = await (await fetch(`/api/ior/${x}`)).json(); return j?.unit?.model?.status ?? j?.result?.unit?.model?.status ?? j?.model?.status ?? null; } catch { return 'err'; } }, u);
const graphGet = (page, u) => page.evaluate((x) => { const g = document.querySelector('rb-detail-drawer')?._graph; try { const o = g?.get?.(x); return { present: !!o, status: o?.status ?? null }; } catch { return { present: 'err' }; } }, u);
const openAndRead = async (page, u) => {
  await page.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); d.removeAttribute('ref'); }); await sleep(200);
  await page.evaluate((x) => { const d = document.querySelector('rb-detail-drawer'); d.setAttribute('open', ''); d.setAttribute('ref', `task:${x}`); }, u);
  await page.waitForSelector('rb-detail-drawer button[data-verb="qa-approve"]', { timeout: 6000 }).catch(() => {});
  await sleep(400);
  return page.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); return { approve: !!d?.querySelector('button[data-verb="qa-approve"]'), decline: !!d?.querySelector('button[data-verb="qa-decline"]'), unresolved: !!document.querySelector('[data-status-unresolved]') }; });
};

async function runArm(fixOn, forcedSubject) {
  const f = await setupFoundation(fixOn ? {} : { serverPatch: neuterAttachStatus });
  const oh = f.ownerHeaders(); const smSession = (/sm_session=([^;]+)/.exec(oh.Cookie || '') || [])[1] || '';
  const browser = await webkit.launch({ headless: true });
  const arm = { fixOn, worktreeSha: f.worktreeSha, servedVersion: f.servedVersion };
  try {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
    await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/', httpOnly: true, secure: true }]);
    const page = await ctx.newPage();
    await page.goto(`${f.base}/model`, { waitUntil: 'domcontentloaded', timeout: 20000 }); // architect 70cfcdab1: /model mounts the drawer GRAPH-LESS → graph-absent precondition (/trace = comprehensive graph = INVALID)
    await sleep(2500);
    // pick the subject: forced (arm-OFF reuses arm-ON's pick), else SWEEP for a QA-Review task measuring graph-ABSENT
    let subject = forcedSubject, sweep = [];
    if (!subject) {
      for (const u of CANDIDATES) { const g = await graphGet(page, u); const st = await iorStatusOf(page, u); sweep.push({ u: u.slice(0, 8), graphPresent: g.present, iorStatus: st }); if (g.present === false && st === 'QA Review') { subject = u; break; } }
    }
    arm.sweep = sweep; arm.subject = subject;
    if (!subject) { arm.error = 'no graph-absent QA-Review subject found among candidates'; await ctx.close(); return arm; }
    arm.graphAtTest = await graphGet(page, subject);       // ★ the invariant: measured graph-absence AT TEST TIME
    arm.iorStatus = await iorStatusOf(page, subject);
    const a = await openAndRead(page, subject); const b = await openAndRead(page, subject); // warmup + assert
    arm.controlsRender = a.approve && a.decline && b.approve && b.decline;
    arm.controlsHidden = !a.approve && !a.decline && !b.approve && !b.decline;
    arm.failLoud = a.unresolved || b.unresolved;
    await ctx.close();
  } finally { await browser.close(); arm.teardown = await f.teardown(); }
  return arm;
}

console.log('R40.31 A — arm FIX-ON (sweep for graph-absent subject + DIRECT proof)…');
const on = await runArm(true, null);
console.log(JSON.stringify(on, null, 2));
let off = { skipped: true };
if (on.subject) { console.log(`\nR40.31 A — arm FIX-OFF (attachTaskStatus neutered, SAME subject ${on.subject.slice(0, 8)} + commit)…`); off = await runArm(false, on.subject); console.log(JSON.stringify(off, null, 2)); }

// VERDICT
const graphAbsent = on.graphAtTest?.present === false && (on.graphAtTest?.status ?? null) === null; // ★ subject measured NOT in _graph
const direct = graphAbsent && on.controlsRender === true && on.iorStatus === 'QA Review';            // DIRECT: /api/ior is the sole source
const offGraphAbsent = off.graphAtTest?.present === false;                                            // membership identical (absent) in the OFF arm
const differential = direct && off.controlsHidden === true && offGraphAbsent;                         // DIFFERENTIAL: render ONLY with the fix, membership constant
const prodSafe = on.teardown?.prodUp === true && on.teardown?.leftover === 0 && off.teardown?.prodUp === true && off.teardown?.leftover === 0;

console.log('\n=== VERDICT A (STATUS not MEMBERSHIP, on a graph-absent subject) ===');
console.log(`  subject: ${on.subject}`);
console.log(`  ★ graph-absent AT TEST TIME (invariant): ${graphAbsent}  [FIX-ON _graph.get=${JSON.stringify(on.graphAtTest)}]`);
console.log(`  DIRECT  @ ${on.worktreeSha}/v${on.servedVersion}: controls render=${on.controlsRender} · /api/ior status=${on.iorStatus} (sole source)`);
console.log(`  DIFFERENTIAL FIX-OFF @ ${off.worktreeSha}/v${off.servedVersion}: controls hidden=${off.controlsHidden} · failLoud=${off.failLoud} · graph-absent=${offGraphAbsent} · iorStatus=${off.iorStatus}`);
console.log(`  ⇒ render ONLY with attachTaskStatus, membership constant(absent) both arms: ${differential}`);
console.log(`  teardown prod:4444 untouched + 0 leftover: ${prodSafe}`);
// THREE outcomes (PO): INVALID ≠ RED. A precondition-miss (no graph-absent subject) means the result is MEANINGLESS, re-select —
// NOT that the property is absent (that would be RED). GREEN only when the isolation held AND the fix rendered controls.
let outcome, exit;
if (!on.subject) { outcome = 'INVALID — no graph-absent QA-Review subject among candidates (all in _graph); precondition unmet, re-select'; exit = 2; }
else if (!graphAbsent) { outcome = `INVALID — subject ${on.subject.slice(0, 8)} measured graph-PRESENT at test time; precondition unmet, result meaningless, re-select`; exit = 2; }
else if (direct && differential && prodSafe) { outcome = 'GREEN — A APPEAR: controls follow STATUS not membership (direct + differential, graph-absent subject)'; exit = 0; }
else { outcome = 'RED — graph-absent + actionable but controls did NOT follow status (property absent)'; exit = 1; }
console.log(`\n${outcome.startsWith('GREEN') ? '✓' : outcome.startsWith('INVALID') ? '⊘' : '✗'} ${outcome}`);
process.exit(exit);
