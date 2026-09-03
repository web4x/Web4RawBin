// PROD READ-ONLY defects 2 + 3 (PO 2026-09-03, v0.8.167) — gateable WITHOUT owner-auth / room-state (no create, no mutation).
// Defect 2: does the room Files folder NOW render an Add-folder button? (fix: add-folder is UNIVERSAL in the shared drawer bar)
// Defect 3: does the sunburst show HUMAN-READABLE sizes with a centre total and NO single-child blob?
// Read via the /trace shared drawer (same bar the room uses). NO auth, NO create, NO cleanup needed.
import { webkit } from '@playwright/test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const FILES_REF = 'roomcoll:6c04f959-f3d6-42eb-818f-5e2e4498bf91:files';
const FILES_UUID = 'f0250bdc-bc79-4f21-a2ad-a78a96959fc1';

const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await sleep(800);

  // DEFECT 2: room Files action bar — is add-folder now present? (open the ref in the shared drawer, read buttons)
  const d2 = await page.evaluate(async ({ ref, uuid }) => {
    let drawer = document.querySelector('rb-detail-drawer') || document.querySelector('rb-detail-view');
    if (!drawer) { drawer = document.createElement('rb-detail-drawer'); document.body.appendChild(drawer); }
    for (const r of [ref, `folder:${uuid}`, uuid]) { try { drawer.setAttribute('ref', r); drawer.setAttribute('open', ''); } catch {} }
    await new Promise((rz) => setTimeout(rz, 1600));
    const detailText = (document.querySelector('rb-detail-drawer, rb-detail-view')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    const buttons = [...document.querySelectorAll('rb-strip button, .rb-strip button, rb-detail-drawer button, rb-detail-view button, [role="button"]')].map((b) => (b.textContent || '').trim()).filter(Boolean);
    return { detailText, resolved: !/unresolved/i.test(detailText), buttons, hasAddFolder: buttons.some((t) => /add folder/i.test(t)) };
  }, { ref: FILES_REF, uuid: FILES_UUID });
  R(`\n──────── DEFECT 2: room Files Add-folder button (prod, rendered) ────────`);
  R(`  detail resolved=${d2.resolved} | buttons=${JSON.stringify(d2.buttons)} | add-folder present=${d2.hasAddFolder}`);
  R(`  → ${d2.hasAddFolder ? 'FIXED: room Files folder NOW offers Add folder' : 'STILL ABSENT: no Add-folder button (RED)'}${!d2.resolved ? ' ⚠ (detail read unresolved even on prod — flag)' : ''}`);

  // DEFECT 3: mount the room Files sunburst the WAY r4021c proved renders on prod (drawer→.trace-page, single ref, wait for .dv-sunburst)
  await page.evaluate((r) => { let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); (document.querySelector('.trace-page') || document.body).appendChild(d); } d.removeAttribute('ref'); d.setAttribute('ref', r); d.setAttribute('open', ''); }, FILES_REF);
  await page.waitForFunction(() => { const v = document.querySelector('rb-detail-view, rb-detail-drawer'); return v && (v.querySelector('.dv-sunburst') || v.querySelector('.dv-title')); }, { timeout: 12000 }).catch(() => {});
  await sleep(1000);
  const d3 = await page.evaluate(() => {
    const wrap = document.querySelector('.dv-sunburst');
    if (!wrap) return { hasSunburst: false };
    const arcs = wrap.querySelectorAll('path, [class*="arc"]').length;
    const empty = !!wrap.querySelector('.dv-sunburst-empty');
    const allText = (document.querySelector('rb-detail-view, rb-detail-drawer')?.textContent || '');
    const humanTokens = (allText.match(/\d[\d.,]*\s?(bytes|kB|KB|MB|GB|TB)\b/g) || []).slice(0, 8); // human-readable (defect-3 fix)
    const rawByteTokens = (allText.match(/\b\d{6,}\b/g) || []).slice(0, 6);                          // raw bytes (the OLD un-fixed form)
    const centreText = (wrap.querySelector('.dv-sunburst-total, [class*="total"], text')?.textContent || '').trim();
    return { hasSunburst: true, arcs, empty, humanTokens, rawByteTokens, centreText };
  });
  R(`\n──────── DEFECT 3: sunburst human-readable sizes + centre total (prod, rendered) ────────`);
  R(`  hasSunburst=${d3.hasSunburst} arcs=${d3.arcs} empty=${d3.empty} | HUMAN-size labels=${JSON.stringify(d3.humanTokens)} | RAW-byte tokens=${JSON.stringify(d3.rawByteTokens)} | centreText=${JSON.stringify(d3.centreText)}`);
  const humanN = (d3.humanTokens || []).length, rawN = (d3.rawByteTokens || []).length;
  R(`  → ${humanN > 0 && rawN === 0 ? 'FIXED: sizes are HUMAN-READABLE (kB/MB/GB), no raw-byte blobs' : humanN > 0 ? `MIXED: ${humanN} human + ${rawN} raw-byte tokens still present` : rawN > 0 ? 'STILL RAW BYTES (defect-3 NOT fixed on this surface)' : 'no size labels observed'} · ${d3.arcs >= 2 ? 'no single-child blob (arcs=' + d3.arcs + ')' : 'SINGLE arc (blob?)'}`);
  await page.screenshot({ path: 'test-results/r4021-prod-defects23.png' }).catch(() => {});
} finally { await browser.close().catch(() => {}); }
