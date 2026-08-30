// Task 37.29 AC-4 — BUG18 PERMANENT REGRESSION GATE (it broke a SECOND time for lack of a test; this stops a third).
// A file's own detail must render its REAL file detail (name + preview), NOT raw JSON and NOT a uuid-name.
// Root (architect 316b60c15, RoomView.ts:393/401): the caller passed `file:${uuid}` (synthetic) → the drawer's
// resolveRefUnit→ensureViewUnit LAZY-MINTED a bogus dup File (name=uuid, ownerIor=null) that renders as a uuid-name/raw-JSON.
// Fix = pass the bare instance uuid → resolves the REAL File unit (LinkedIn Banner.png), no mint.
//
// ★ SAFETY (the r4010 lesson): ref=`file:${uuid}` MINTS a bogus unit on the server it hits → the stub-must-fail MUST run
// on an R40.31 ISOLATED SCRATCH server, NEVER prod. The GREEN case (ref=<real uuid>) resolves an existing unit = READ-ONLY,
// safe on live prod. @390 real-WebKit. Wire into ci:gates:raw so it can't silently re-break.
import { webkit, devices } from '@playwright/test';
const iPhone = devices['iPhone 12'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const REAL_FILE = 'b9fa43a2-ea98-462d-b181-624ccb26d8ac'; // real File unit "LinkedIn Banner.png" (Heartspaces room)
const REAL_NAME = 'LinkedIn Banner.png';

// mount rb-detail-view with a ref, return the rendered {type,title,uuid,rawJson,isUuidName}
const renderDetail = (page, ref) => page.evaluate((r) => {
  document.querySelectorAll('rb-detail-view#__g').forEach(e => e.remove());
  const el = document.createElement('rb-detail-view'); el.id = '__g';
  el.setAttribute('ref', r); document.body.appendChild(el);
  return new Promise(res => setTimeout(() => {
    const h = document.querySelector('rb-detail-view#__g');
    const title = h?.querySelector('.dv-title')?.textContent || '';
    const txt = h?.textContent || '';
    res({
      type: h?.querySelector('.dv-type')?.textContent || '',
      title,
      hasPreview: !!h?.querySelector('img, rb-preview, .dv-file-preview, canvas, .sv-file'),
      rawJson: /"ior"\s*:|"uuid"\s*:\s*"|\{\s*"model"/.test(txt) && !h?.querySelector('.dv-title'), // raw unit JSON dumped
      isUuidName: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(title.trim()), // title IS a bare uuid = the bug
    });
  }, 1600));
}, ref);

const BASE = process.env.R3729_BASE || 'https://prod.wo-da.de:4444'; // GREEN case on live (read-only); scratch base for stub
const browser = await webkit.launch({ headless: true });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForFunction(() => !!customElements.get('rb-detail-view'), { timeout: 20000 }).catch(() => {});
    await sleep(600);

    // (a) the REAL file renders its REAL detail (name + preview), NOT raw JSON, NOT a uuid-name — READ-ONLY
    const d = await renderDetail(page, REAL_FILE);
    const green = d.title.includes(REAL_NAME) && !d.isUuidName && !d.rawJson;
    results.push(green);
    console.log(`iter ${i}: REAL file → title="${d.title.slice(0, 40)}" type=${d.type} preview=${d.hasPreview} isUuidName=${d.isUuidName} rawJson=${d.rawJson} => ${green ? 'GREEN' : 'RED'}`);
    if (i === 1) await page.screenshot({ path: 'test-results/r3729-file-detail.png' }).catch(() => {});
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== BUG18 file-detail render @390 (real-WebKit) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN — the file renders its REAL detail (name+preview), no uuid-name, no raw JSON' : 'RED — file renders a uuid-name / raw JSON (BUG18: bogus lazy-mint)');
console.log('NOTE: stub-must-fail (ref=file:<uuid> → lazy-mints a bogus dup) runs on an R40.31 SCRATCH base only (R3729_BASE), never prod — it MUTATES.');
process.exit(green ? 0 : 1);
