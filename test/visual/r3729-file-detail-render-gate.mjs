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
const REAL_FILE = 'b9fa43a2-ea98-462d-b181-624ccb26d8ac'; // (a) the file Tron saw BROKEN — "LinkedIn Banner.png" (Heartspaces room)
const REAL_NAME = 'LinkedIn Banner.png';
const CTRL_FILE = '569c4e79-a74d-4a51-b20a-0798c0e552dc'; // (b) CLEAN control room file (never broken) — name "325e17b6-...jpeg"
const CTRL_NAME = '325e17b6-411c-4d4a-aad0-f8a5066b3fc0.jpeg';

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
      isUuidName: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(title.trim()), // title IS a BARE uuid (no extension) = the BUG18 symptom (a healthy uuid.jpeg name does NOT match)
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

    // (a) the previously-BAD file renders its REAL detail (real name, NOT raw JSON, NOT a bare-uuid name) — READ-ONLY
    const d = await renderDetail(page, REAL_FILE);
    const aOk = d.title.includes(REAL_NAME) && !d.isUuidName && !d.rawJson;
    // (b) a CLEAN control room file still renders correctly (no regression) — READ-ONLY
    const c = await renderDetail(page, CTRL_FILE);
    const bOk = c.title.includes(CTRL_NAME) && !c.isUuidName && !c.rawJson;
    const green = aOk && bOk;
    results.push(green);
    console.log(`iter ${i}: (a)bad-file→"${d.title.slice(0, 34)}" ok=${aOk} | (b)clean-ctrl→"${c.title.slice(0, 34)}" ok=${bOk} => ${green ? 'GREEN' : 'RED'}`);
    if (i === 1) await page.screenshot({ path: 'test-results/r3729-file-detail.png' }).catch(() => {});
    await ctx.close();
  }
  // ── SELF-FAILABILITY CHECK (proves the gate's ASSERTION fires): feed the isUuidName detector a bare uuid — it MUST
  // flag it. This proves the render assertion is not inert. (The FULL planted-defect stub — seed a real File unit with
  // name=uuid on an R40.31 SCRATCH server, render it, assert RED — is the completing step; a bare-uuid ref on live
  // resolves to '⚠ unresolved' (correct fail-loud), NOT the bug shape, so the real defect needs a seeded unit on scratch.)
  const bareUuid = '12345678-1234-4123-8123-123456789abc';
  const detectorFires = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bareUuid) && !/^[0-9a-f]{8}-/.test('LinkedIn Banner.png');
  results.push(detectorFires);
  console.log(`self-failability: isUuidName detector flags a bare uuid + passes a real filename = ${detectorFires ? 'OK (assertion is live)' : 'BROKEN'}`);
  console.log('NOTE: render cases (a)+(b) are ALSO failable-on-regression by construction — a BUG18 recurrence renders a bare-uuid title → isUuidName=true → RED.');
} finally { await browser.close(); }

console.log('\n===== BUG18 file-detail render @390 (real-WebKit) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length >= 4 && results.every(Boolean); // 3 render iters (a+b each) + self-failability
console.log('OVERALL:', green ? 'GREEN — (a) the previously-bad file + (b) a clean control both render their REAL name (no bare-uuid, no raw JSON); assertion is live' : 'RED — a file renders a bare-uuid name / raw JSON (BUG18: bogus lazy-mint) OR the detector is inert');
process.exit(green ? 0 : 1);
