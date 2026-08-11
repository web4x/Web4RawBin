// R40.28 gate MECHANISM prove-the-prover (freeze-safe, synthetic — NO served feature needed).
// Proves whether the AC-6/AC-7 detection actually discriminates, on REAL WebKit @390 (iPhone-12-ish), BEFORE the
// new-tab impl lands — so the eventual gate is trusted, not hoped. AC-6 = a NEW browsing context ACTUALLY opened
// (context 'page' event), never target=_blank-in-DOM (empty-container trap). AC-7 = iOS blocks NON-synchronous
// window.open; a real tap whose handler opens SYNC must fire the popup, an ASYNC (post-await/timeout/promise) open
// must NOT — that is the hazard the gate must catch BY CONSTRUCTION. This selftest measures if THIS engine enforces
// the sync-gesture rule; if async ALSO opens here, AC-7 is DEVICE-ONLY (report — do not claim a gate that can't bite).
import { webkit } from '@playwright/test';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// iPhone-12 WebKit context WITHOUT isMobile (WebKit rejects isMobile) — viewport+touch+iOS-UA give the parity that matters.
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };

const HANDLERS = {
  sync:            `window.open('data:text/html,<h1>opened</h1>','_blank')`,                          // must OPEN
  'async-timeout': `setTimeout(function(){window.open('data:text/html,<h1>opened</h1>','_blank')},30)`, // must be BLOCKED
  'async-promise': `Promise.resolve().then(function(){window.open('data:text/html,<h1>opened</h1>','_blank')})`, // BLOCKED
};

// did a REAL tap in the gesture handler open a NEW browsing context? (page event — NOT DOM target attr)
async function tapOpens(browser, handlerBody) {
  const ctx = await browser.newContext(IOS);
  const page = await ctx.newPage();
  await page.setContent(`<!doctype html><meta name=viewport content="width=device-width"><button id=b style="width:200px;height:80px;font-size:24px">open tab</button><script>document.getElementById('b').addEventListener('click',function(){${handlerBody}})</script>`);
  const popupP = ctx.waitForEvent('page', { timeout: 2500 }).catch(() => null); // register BEFORE the tap (no race)
  await page.tap('#b');                                        // REAL touch gesture (not dispatchEvent)
  const popup = await popupP;                                  // page event = a NEW browsing context opened (the AC-6 signal; url-refinement applies against the real feature)
  await ctx.close();
  return !!popup;
}

const browser = await webkit.launch({ headless: true });
const out = {};
try {
  for (let i = 1; i <= 3; i++) {                               // DET-3x
    for (const [name, body] of Object.entries(HANDLERS)) {
      const opened = await tapOpens(browser, body);
      (out[name] = out[name] || []).push(opened);
    }
    await sleep(50);
  }
} finally { await browser.close(); }

const all = (a, v) => a.length === 3 && a.every(x => x === v);
const syncOpens = all(out.sync, true);
const asyncBlocked = all(out['async-timeout'], false) && all(out['async-promise'], false);
console.log('sync (must open) :', JSON.stringify(out.sync), syncOpens ? 'OK' : 'FAIL');
console.log('async-timeout    :', JSON.stringify(out['async-timeout']), all(out['async-timeout'], false) ? 'BLOCKED(good)' : 'OPENED(engine does not enforce)');
console.log('async-promise    :', JSON.stringify(out['async-promise']), all(out['async-promise'], false) ? 'BLOCKED(good)' : 'OPENED(engine does not enforce)');
console.log('');
if (syncOpens && asyncBlocked) {
  console.log('VERDICT: MECHANISM DISCRIMINATES — sync opens, async blocked on WebKit @390. AC-6 + AC-7 are GATE-ABLE here by construction.');
  process.exitCode = 0;
} else if (syncOpens && !asyncBlocked) {
  console.log('VERDICT: AC-7 DEVICE-ONLY — this WebKit does NOT enforce the iOS sync-gesture popup rule (async also opens). AC-6 (actual-open) is gate-able; AC-7 (silent-block hazard) must go to Tron real-device. Report to req.');
  process.exitCode = 2;
} else {
  console.log('VERDICT: INCONCLUSIVE — sync did not reliably open; investigate tap/touch setup before trusting the gate.');
  process.exitCode = 1;
}
