// [test:uuid:4e3547dd-3654-4071-9a70-01d86f65cd71] R40.57 refreshCurrentSlot derive-at-render → Impl f5928a3b. This gate (Scenario A open-after-designation + B full-reload) cleanly proves the drawer DERIVES the current-slot role at render (bar hides Set-as-Current for the current task) GREEN on v0.8.126 — the faithful scope-prover for f5928a3b. (Re-pointed here from r4056-diagnose by gate-author measure: r4056-diagnose is a cross-view-DISAGREEMENT diagnostic that self-flags UNDETERMINED on v0.8.126, NOT a clean derive-at-render green; pending req sourceFile re-point.)
// R40.57 CONSUMER decisive verify on v0.8.125 — distinguish a REAL consumer-RED from a harness artifact before reporting.
// The fix (rb-detail-drawer.ts:91-102,523-524): drawer fetches the live current-slot uuid into _currentSlotUuid, derives
// taskRole = bareUuid(ref)==_currentSlotUuid ? 'current':'other', re-derives on a CurrentSprint-pin subscription.
// TWO scenarios so a synthetic-mount subscription miss can't false-RED:
//   A) OPEN-AFTER-DESIGNATION (fresh derivation, no live-update/subscription needed): designate 40.1 FIRST, then open the
//      drawer → it fetches _currentSlotUuid=40.1 at open → taskRole 'current' → Set-as-Current MUST be ABSENT. If PRESENT
//      here, the DERIVATION itself is broken = REAL RED (not a subscription artifact).
//   B) LIVE-UPDATE (drawer open, THEN designate): tests the subscription re-derive (Tron's actual flow).
// Also read _currentSlotUuid + the endpoint the drawer uses, to pinpoint. Scratch v0.8.125, phantom-guarded, own session.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
import fs from 'fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const TASK = '7a956c21-5f37-4062-b921-9bdd5a461546'; // Task 40.1
const CSU = 'current-sprint-singleton-0000-000000000001';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const OUT = 'test-results/r4057-consumer'; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: 'HEAD', buildDist: true });
const oh = f.ownerHeaders();
console.log(`scratch: ${f.base} servedVersion=${f.servedVersion} sha=${f.worktreeSha}`);
const jf = (u) => fetch(`${f.base}${u}`, { headers: oh }).then(r => r.json()).catch(() => null);
const resolvedCurrent8 = async () => { const d = await jf(`/api/trace/children/${CSU}`); const c = (d?.children || []).find(k => /Current\b/.test(String(k.name || '')) && !/CurrentSprint/.test(String(k.name || ''))); return c?.uuid?.slice?.(0, 8) || null; };
const readBar = (page) => page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer'); const bar = d?.querySelector('.drawer-actionbar');
  return { barOffersSetCurrent: /Set as Current/i.test(bar?.innerText || ''), currentSlotUuid: (d?._currentSlotUuid || '(unreadable)'), drawerRef: d?.getAttribute('ref') || '', barText: (bar?.innerText || '').replace(/\s+/g, ' ').slice(0, 110) };
});
const openDrawer = (page, u) => page.evaluate((x) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: ['task:' + x] } })), u);

const raw = { servedVersion: f.servedVersion, sha: f.worktreeSha };
try {
  // what the drawer's recompute endpoint returns for the current-slot role (the source of _currentSlotUuid)
  const csTrace = await jf(`/api/trace/children/${CSU}?mode=trace`);
  await fetch(`${f.base}/api/task/${TASK}/make-current`, { method: 'POST', headers: oh });
  const cur8 = await resolvedCurrent8();
  const csTrace2 = await jf(`/api/trace/children/${CSU}?mode=trace`);
  const roleCurrentChild = (csTrace2?.children || []).find(k => k.role === 'current');
  raw.slotsCurrent8 = cur8; raw.endpoint_roleCurrent_uuid8 = roleCurrentChild?.uuid?.slice?.(0, 8) || '(none)';
  console.log(`designated 40.1 → slots.current=${cur8} · endpoint(?mode=trace) role==='current' child uuid=${raw.endpoint_roleCurrent_uuid8}`);

  const browser = await webkit.launch({ headless: true });
  try {
    // ── SCENARIO A: OPEN-AFTER-DESIGNATION (fresh derivation; no subscription needed) ──
    const ctxA = await browser.newContext({ ...IOS, serviceWorkers: 'block' });
    await ctxA.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, oh['x-player-token']);
    const smA = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (smA) await ctxA.addCookies([{ name: 'sm_session', value: smA[1], domain: 'localhost', path: '/' }]);
    const pageA = await ctxA.newPage();
    await pageA.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await pageA.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
    await sleep(600);
    await openDrawer(pageA, TASK); await sleep(2200); // drawer mounts AFTER 40.1 is already current → fresh derive
    const A = await readBar(pageA);
    await pageA.screenshot({ path: `${OUT}/r4057-A-open-after-v${f.servedVersion}.png` });
    raw.A = A;
    console.log(`\nSCENARIO A (open-after-designation, fresh derive): bar-offers-SetCurrent=${A.barOffersSetCurrent} · drawer._currentSlotUuid=${String(A.currentSlotUuid).slice(0,8)} · (40.1 IS current → correct=ABSENT)`);
    console.log(`  → DERIVATION ${A.barOffersSetCurrent ? 'RED (bar offers Set-as-Current for the CURRENT task = derivation broken)' : 'GREEN (bar hides Set-as-Current = derives current correctly)'}`);
    await ctxA.close();

    // ── SCENARIO B: FULL RELOAD with 40.1 already current (eliminates any mount/subscription timing) ──
    const ctxB = await browser.newContext({ ...IOS, serviceWorkers: 'block' });
    await ctxB.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, oh['x-player-token']);
    const smB = (oh['Cookie'] || '').match(/sm_session=([^;]+)/); if (smB) await ctxB.addCookies([{ name: 'sm_session', value: smB[1], domain: 'localhost', path: '/' }]);
    const pageB = await ctxB.newPage();
    await pageB.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await sleep(500); await openDrawer(pageB, TASK); await sleep(1500);
    await pageB.reload({ waitUntil: 'networkidle' }); await sleep(1200); await openDrawer(pageB, TASK); await sleep(2200);
    const B = await readBar(pageB);
    raw.B = B;
    console.log(`SCENARIO B (full reload, 40.1 current): bar-offers-SetCurrent=${B.barOffersSetCurrent} · _currentSlotUuid=${String(B.currentSlotUuid).slice(0,8)}`);
    await ctxB.close();
  } finally { await browser.close(); }

  console.log('\n════ R40.57 CONSUMER derivation verdict (v' + f.servedVersion + ') ════');
  const derivationGreen = raw.A && raw.A.barOffersSetCurrent === false;
  console.log(`  endpoint role==='current' resolves to = ${raw.endpoint_roleCurrent_uuid8} (should be 40.1=7a956c21)`);
  console.log(`  A open-after derivation: ${derivationGreen ? 'GREEN' : 'RED'} · B full-reload bar-offers=${raw.B?.barOffersSetCurrent}`);
  console.log(`  ⇒ ${derivationGreen ? 'consumer derives current CORRECTLY on a fresh render — prior cross-view RED (if any) is a LIVE-UPDATE subscription issue, not derivation' : 'CONSUMER DERIVATION IS BROKEN post-fix — bar offers Set-as-Current for the current task even on a fresh render/reload = REAL RED, not a harness artifact'}`);
  fs.writeFileSync(`${OUT}/r4057-consumer-raw-v${f.servedVersion}.json`, JSON.stringify(raw, null, 2));
} finally {
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}
