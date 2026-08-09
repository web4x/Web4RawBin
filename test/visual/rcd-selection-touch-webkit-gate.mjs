// [test:uuid:2fe84858-7b0d-4062-b986-bbefae3390ee] Group-D f3 TAP-SWITCH — handleTapSelect cc1dcd0e (→selectionModel.replaceWith): real-WebKit @390 tap selects a node + SWITCHES off the previous (single-select). GREEN DET-3x.
// [test:uuid:ff903752-3d69-4ec4-a555-f7ec09637ff6] Group-D f3 LONGPRESS-TOGGLE — simulateLongPress 4256aef7 (→selectionModel.toggle): real-WebKit @390 500ms-hold timer toggles a node in/out, OTHERS stay (multi-select). GREEN DET-3x. ⚠ req: the touch path is touchstart→500ms-timer→longPressToggle (rb-object-item.ts:66); verify it maps to Impl 4256aef7 (or its own impl) before wiring. 1fac9d23=TASK uuid.
// Group-D f3 — rb-object-item selection tap-switch / longpress-toggle (task 1fac9d23 → impls handleTapSelect cc1dcd0e
// [→selectionModel.replaceWith] + simulateLongPress 4256aef7 [→selectionModel.toggle]). ★ REAL-WEBKIT @390 (webkit
// launches here now — env changed): TAP = single-select SWITCH (replaceWith clears others); LONG-PRESS (500ms hold)
// = multi-select TOGGLE (add/remove, others STAY). Asserts the [selected] attribute after REAL touch gestures on real
// WebKit — NOT emulation-Chromium (which fires taps real-WebKit won't). Client-only selection state = pollution-free,
// no SystemTester/prod write. Phantom-guard: served==committed==HEAD v0.8.65. DET-3x.
import { webkit, devices } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const iPhone = devices['iPhone 12'];

const selOf = (page) => page.evaluate(() => [...document.querySelectorAll('rb-object-item[ref]')].slice(0, 2).map(e => e.getAttribute('ref')));
const isSel = (page, ref) => page.evaluate((r) => { const e = document.querySelector(`rb-object-item[ref="${r}"]`); return !!e && e.hasAttribute('selected'); }, ref);
// real long-press: the component's touchstart listener does NOT read touch data — it just starts a 500ms timer. So a
// plain 'touchstart' Event exercises the REAL listener + REAL timer + REAL longPressToggle on real WebKit (WebKit blocks
// the Touch/TouchEvent constructor, but a generic Event of type 'touchstart' hits the same addEventListener). Hold past
// 500ms so the timer fires, then 'touchend'. (The physical-finger 500ms hold is Tron-confirmable; the timer→toggle logic
// is gated here on real WebKit.)
const longPress = (page, ref) => page.evaluate(async (r) => {
  const el = document.querySelector(`rb-object-item[ref="${r}"]`); if (!el) return;
  el.dispatchEvent(new Event('touchstart', { bubbles: true }));
  await new Promise(res => setTimeout(res, 620)); // > 500ms → the long-press timer fires longPressToggle → toggle
  el.dispatchEvent(new Event('touchend', { bubbles: true }));
}, ref);

const browser = await webkit.launch({ headless: true });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForSelector('rb-object-item[ref]', { timeout: 20000 }).catch(() => {});
    await sleep(600);
    const refs = await selOf(page);
    if (refs.length < 2) { results.push(false); console.log(`iter ${i}: SETUP-FAIL — <2 rb-object-item[ref] nodes on /trace @390 => RED`); await ctx.close(); continue; }
    const [A, B] = refs;
    await page.evaluate(() => { const m = document.querySelector('rb-object-item'); }); // no-op warm

    // ── TAP-SWITCH (real WebKit tap): tap A → A selected; tap B → B selected AND A NOT (single-select switch) ──
    await page.tap(`rb-object-item[ref="${A}"]`).catch(() => {});
    await sleep(150);
    const aSelAfterTapA = await isSel(page, A);
    await page.tap(`rb-object-item[ref="${B}"]`).catch(() => {});
    await sleep(150);
    const bSel = await isSel(page, B), aClearedAfterTapB = !(await isSel(page, A));
    const tapSwitch = aSelAfterTapA && bSel && aClearedAfterTapB;

    // ── LONG-PRESS TOGGLE (real 500ms hold): longpress A → A on (+B stays, MULTI); longpress A again → A off ──
    await longPress(page, A); await sleep(200);
    const aOnAfterLp = await isSel(page, A), bStaysMulti = await isSel(page, B); // B was selected from the tap-switch; toggle must NOT clear it
    await longPress(page, A); await sleep(200);
    const aOffAfterLp2 = !(await isSel(page, A));
    const longPressToggle = aOnAfterLp && bStaysMulti && aOffAfterLp2;

    const pass = tapSwitch && longPressToggle;
    results.push(pass);
    console.log(`iter ${i}: tap-switch=${tapSwitch}(A-on=${aSelAfterTapA} B-on=${bSel} A-cleared=${aClearedAfterTapB}) longpress-toggle=${longPressToggle}(A-on=${aOnAfterLp} B-stays-multi=${bStaysMulti} A-off=${aOffAfterLp2}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== Group-D f3 selection tap-switch/longpress-toggle (real-WebKit @390, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x (real-WebKit touch)' : 'RED');
process.exitCode = green ? 0 : 1;
