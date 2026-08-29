// R40.x BAR-REF AGREEMENT — the action bar must target the SAME unit the drawer RENDERS. Wrong-verdict hazard:
// architect-confirmed (041c6f7b3) the bar reads the drawer's _shownRef (selection-driven), a SEPARATE holder from the
// rendered content ref (detailPanel.dataset.currentRef). They agree today because the drawer owns both; the RbDetailBase
// fix moves content to the element, so WITHOUT the 3rd delete they SPLIT → Approve/Decline would act on the SELECTED
// unit while the owner READS a different unit's detail = approve the WRONG task, and a wrong approvedBy is invisible after.
// ★ Asserts on HIS surface @390 from HIS entry: the ref the Approve action ACTUALLY TARGETS (captured from the POST it
//   fires, route-intercepted so NO write) == the rendered content ref. + STUB-MUST-FAIL (force _shownRef≠content →
//   the agreement check MUST catch it) so the gate provably bites. + attempt Tron's divergence (rapid A→B select).
//   Consumer-vs-consumer agreement, same class as pin-vs-action-bar. RED if they ever disagree; the fix must keep it GREEN.
// DET-3x. Scratch foundation (owner), route-intercepted approve = zero prod/scratch write.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const A = '9f11a990-79bd-46e4-95e2-abe066f4b95b'; // Task 40.28
const B = '9a70ce5e-7e88-45f9-b921-0f8e9caf07a6'; // Task 40.10
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
console.log(`bar-ref agreement, scratch@HEAD ${f.servedVersion}`);
const b = await webkit.launch({ headless: true });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
    await ctx.addInitScript(t => { try { localStorage.setItem('rawbin-player-id', t) } catch {} }, oh['x-player-token']);
    const sm = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (sm) await ctx.addCookies([{ name: 'sm_session', value: sm[1], domain: 'localhost', path: '/' }]);
    // capture the ref the Approve POST actually targets; NEVER let it reach the server (route-intercept = no write)
    let approveTargetUuid = null;
    await ctx.route('**/api/task/*/approve', route => { const m = route.request().url().match(/api\/task\/([0-9a-f-]+)\/approve/); approveTargetUuid = m ? m[1] : null; route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, status: 'Done' }) }); });
    const p = await ctx.newPage();
    await p.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await p.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
    await sleep(800);
    const openDetail = (u) => p.evaluate(ref => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.setAttribute('open', ''); d.setAttribute('ref', ref); } }, `task:${u}`);
    // read the two holders: bar target (_shownRef) + rendered content (detailPanel.dataset.currentRef)
    const holders = () => p.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); return { shownRef: (d && d._shownRef) || '(none)', contentRef: (d?.detailPanel?.dataset?.currentRef) || (d?.querySelector('.drawer-panel-detail')?.dataset?.currentRef) || '(none)' }; });

    // (a) select A, settle → holders agree + Approve targets the rendered unit
    await openDetail(A); await sleep(1200);
    const hA = await holders();
    const barBtn = 'rb-detail-drawer .drawer-actionbar [data-verb="qa-approve"]';
    approveTargetUuid = null; await p.locator(barBtn).click({ timeout: 5000 }).catch(() => {});
    await sleep(400);
    const approveHitsContent = approveTargetUuid !== null && hA.contentRef.includes(approveTargetUuid);
    const holdersAgreeA = hA.shownRef.includes(A) && hA.contentRef.includes(A);

    // (b) TRON'S DIVERGENCE attempt: rapid A→B select, sample the holders mid-transition
    await openDetail(A); await sleep(300); await openDetail(B);
    let diverged = false, worst = '';
    for (const t of [50, 150, 350, 700, 1200]) { await sleep(t < 700 ? (t - 0) : 250); const h = await holders(); if (h.shownRef !== '(none)' && h.contentRef !== '(none)' && !sameUnit(h.shownRef, h.contentRef)) { diverged = true; worst = `shownRef=${short(h.shownRef)} contentRef=${short(h.contentRef)}`; break; } }

    // (c) STUB-MUST-FAIL: force _shownRef ≠ content → the agreement check MUST catch the mismatch
    await openDetail(B); await sleep(800);
    await p.evaluate((bogus) => { const d = document.querySelector('rb-detail-drawer'); if (d) d._shownRef = bogus; }, 'task:deadbeef-0000-0000-0000-000000000000');
    const hStub = await holders();
    const stubDetected = !sameUnit(hStub.shownRef, hStub.contentRef);   // gate can see the split

    const agree = holdersAgreeA && approveHitsContent && !diverged;
    results.push({ i, holdersAgreeA, approveTargetUuid, approveHitsContent, diverged, worst, stubDetected });
    console.log(`iter ${i}: A holders-agree=${holdersAgreeA} | Approve targets rendered unit=${approveHitsContent}(hit=${short(approveTargetUuid||'')}) | rapid-A→B diverged=${diverged}${diverged?' ['+worst+']':''} | stub-must-fail detects split=${stubDetected} => ${agree && stubDetected ? 'agree+bites' : (diverged ? 'RED-DIVERGED' : 'CHECK')}`);
    await ctx.close();
  }
} finally { await b.close(); const td = await f.teardown(); console.log(`teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
function short(r) { return String(r).replace('task:', '').slice(0, 8); }
function sameUnit(a, b) { return short(a) && short(a) === short(b); }

console.log('\n===== BAR-REF AGREEMENT (bar target == rendered content), @390, DET-3x =====');
const allBite = results.every(r => r.stubDetected);
const anyDiverge = results.some(r => r.diverged || !r.approveHitsContent || !r.holdersAgreeA);
results.forEach(r => console.log(`  iter ${r.i}: ${(r.diverged||!r.approveHitsContent||!r.holdersAgreeA) ? 'DISAGREE (hazard)' : 'agree'} | stub-bites=${r.stubDetected}`));
if (!allBite) console.log('⚠ STUB-MUST-FAIL did NOT bite in some run — the gate cannot prove it detects a split; fix the reader before trusting a green.');
console.log('VERDICT:', anyDiverge
  ? 'RED — the action bar and the rendered detail can refer to DIFFERENT units (wrong-verdict hazard reproduced on his surface).'
  : (allBite ? 'GREEN — bar target == rendered content on every selection (agree today, drawer owns both), and the gate PROVABLY bites (stub-must-fail). This is the standing assertion the RbDetailBase fix must KEEP green (the 3rd delete). Today = baseline agree.' : 'INCONCLUSIVE — stub-must-fail did not confirm the reader.'));
process.exitCode = (!anyDiverge && allBite) ? 0 : 1;
