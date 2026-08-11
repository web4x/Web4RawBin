// [test:uuid:501f17ad-5e4b-4746-8aa1-8b7c3669955b] R40.28 AC-6 RbDetailDrawer.onUniversalAction new-tab actual-open (Impl 7557bd7c) — a real tap-seam (rb-drawer-action) on ◆Scenario/✎Edit opens a NEW browsing context (page event, NOT a target=_blank DOM attr), verified on real WebKit @390 for BOTH the sync-uuid path and the synthetic-ref about:blank→pointed path (empty-container killed). AC-7 iOS silent-block = device-only (Tron). GREEN DET-3x.
// R40.28 AC-6 — ◆Scenario/✎Edit open a NEW TAB. GATE the ACTUAL open (a NEW browsing context really opens, page
// event — NOT a target=_blank DOM attr: the empty-container trap), on REAL WebKit @390 (iPhone context). Impl
// RbDetailDrawer.onUniversalAction 7557bd7c (3rd increment on the shared handler; the seam is the rb-drawer-action
// {verb,ref} event the .drawer-actionbar button dispatches — rb-detail-drawer.ts:390). Both paths R40.28 ships:
//  • SYNC-UUID: a normal ref → window.open('/scenario?ior=<uuid>') SYNC in-gesture.
//  • SYNTHETIC-REF (dir:/file:/puml-src:/…): window.open('about:blank') SYNC, then fetch /api/ior → point win.location
//    to /scenario?ior=<resolvedUuid>. ★ The gate asserts the popup does NOT stay about:blank (empty-container kill) —
//    it must resolve+point, proving the sync-open-then-async-point pattern actually lands the real target.
// AC-7 (iOS silently blocks a NON-sync open) is DEVICE-ONLY — headless WebKit does not enforce the sync-gesture rule
// (measured in r4028-newtab-mechanism-selftest) → Tron device-verify, not here. served==0.8.84==HEAD (no phantom). DET-3x.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const UUID = '005dbd3e-19e3-473f-944b-96c4e8053b4a';   // a real scenario-unit uuid → sync-uuid path builds /scenario?ior=<uuid>
const SYNREF = 'file:package.json';                    // resolves via /api/ior (HTTP 200) → synthetic-ref about:blank→pointed path

// dispatch the EXACT seam event the ◆/✎ actionbar button fires, and observe whether a NEW context opens + where it lands
async function fire(ctx, page, verb, ref, awaitPointed) {
  const popupP = ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null);
  await page.evaluate(({ verb, ref }) => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb, ref }, bubbles: true })), { verb, ref });
  const popup = await popupP;
  if (!popup) return { opened: false, url: null };
  if (awaitPointed) { try { await popup.waitForURL(u => !/^about:blank/.test(String(u)), { timeout: 6000 }); } catch { /* stayed blank = trap */ } }
  else { try { await popup.waitForLoadState('domcontentloaded', { timeout: 3000 }); } catch { /* noop */ } }
  const url = popup.url();
  await popup.close().catch(() => {});
  return { opened: true, url };
}

const browser = await webkit.launch({ headless: true });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext(IOS);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    // a connected rb-detail-drawer registers onUniversalAction on document (rb-detail-drawer.ts:72)
    const hasDrawer = await page.waitForFunction(() => !!document.querySelector('rb-detail-drawer') && !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).then(() => true).catch(() => false);

    // SYNC-UUID path: ◆Scenario → new tab at /scenario?ior=<uuid>
    const scen = await fire(ctx, page, 'scenario', UUID, false);
    const acScenario = scen.opened && /\/scenario\?ior=005dbd3e/.test(scen.url || '');
    // SYNC-UUID path: ✎Edit → new tab at the scenario-editor href
    const edit = await fire(ctx, page, 'edit', UUID, false);
    const acEdit = edit.opened && /005dbd3e/.test(edit.url || '') && !/^about:blank/.test(edit.url || '');
    // SYNTHETIC-REF path: opens about:blank SYNC then POINTS it (must NOT stay about:blank = empty-container kill)
    const syn = await fire(ctx, page, 'scenario', SYNREF, true);
    const acSynthetic = syn.opened && /\/scenario\?ior=/.test(syn.url || '') && !/^about:blank/.test(syn.url || '');

    const pass = hasDrawer && acScenario && acEdit && acSynthetic;
    results.push(pass);
    console.log(`iter ${i}: drawer=${hasDrawer} | ◆Scenario-opens=${acScenario}(${(scen.url || 'none').slice(0, 48)}) | ✎Edit-opens=${acEdit}(${(edit.url || 'none').slice(0, 48)}) | synthetic-ref-pointed=${acSynthetic}(${(syn.url || 'none').slice(0, 48)}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.28 AC-6 new-tab actual-open @390 real-WebKit (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: AC-7 (iOS silent-block of non-sync open) is DEVICE-ONLY — Tron real-device (headless WebKit does not enforce the sync-gesture rule).');
process.exitCode = green ? 0 : 1;
