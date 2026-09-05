// PROD folder-detail EMPTY-BODY probe (Tron's 0.8.174 screenshot: duplicates SELECTED, verbs present, body BLANK). READ-ONLY.
// Distinct from the scratch verb-gap: on PROD folders carry REAL uuids → /api/ior RESOLVES (verbs show) but the detail body
// is empty. Characterize WHY: mount rb-detail-view for a top-level folder (duplicates real uuid, then Trash), record which
// /api/trace/children ref it fetches + status, and dump which body sections render (.dv-fields / .dv-scenario-children /
// .dv-sunburst) vs blank. Read-only: GETs only, no writes, no folders, no touching Tron's data. Screenshot @390.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
// Mount by the ROOMCOLL LOCATION ref — the ref the (fixed) items-tree hands a room folder, i.e. what Tron's REAL selection
// uses. On the OLD build /api/ior for this ref is null → empty; on the FIXED build it resolves → children+sunburst. So this
// is both faithful-to-Tron AND a clean RED→GREEN discriminator. (Real uuids 3344ade1/3e041bff kept in comments for reference.)
const ROOM = '3231db71-d834-435a-a7f9-a801680ccd62';
const DUP = `roomcoll:${ROOM}:files/Trash/duplicates`; // duplicates (Tron's selected folder); real uuid 3344ade1, child a161cc8a=dupChildTest
const TRASH = `roomcoll:${ROOM}:files/Trash`;          // real uuid 3e041bff
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };

const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const childFetches = [];
  await page.on('response', (r) => { const u = r.url(); if (/\/api\/trace\/children\//.test(u)) childFetches.push({ ref: decodeURIComponent(u.split('/api/trace/children/')[1] || '').slice(0, 70), status: r.status() }); });
  await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-view'), { timeout: 20000 }).catch(() => {});

  const probe = async (uuid, label) => {
    childFetches.length = 0;
    await page.evaluate((ref) => { let h = document.getElementById('fd-host'); if (h) h.remove(); h = document.createElement('div'); h.id = 'fd-host'; h.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0b0f17;overflow:auto;padding:12px'; const d = document.createElement('rb-detail-view'); d.id = 'fd-view'; d.setAttribute('ref', ref); h.appendChild(d); document.body.appendChild(h); }, `folder:${uuid}`);
    await sleep(3000);
    const body = await page.evaluate(() => {
      const d = document.getElementById('fd-view'); if (!d) return { why: 'no view' };
      const txt = (d.textContent || '').replace(/\s+/g, ' ').trim();
      const sec = (s) => { const e = d.querySelector(s); return e ? (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) : null; };
      return { totalTextLen: txt.length, textSample: txt.slice(0, 120), fields: sec('.dv-fields'), children: sec('.dv-scenario-children'), sunburst: sec('.dv-sunburst'), hasSunburstEmpty: !!d.querySelector('.dv-sunburst-empty'), sectionCount: d.querySelectorAll('.dv-fields, .dv-scenario-children, .dv-sunburst, [class^=dv-]').length };
    });
    await page.screenshot({ path: `test-results/r4022e-detail-${label}.png`, fullPage: true }).catch(() => {});
    console.log(`\n[${label} ${uuid.slice(0, 8)}] childFetches=${JSON.stringify(childFetches)}`);
    console.log(`  body: totalTextLen=${body.totalTextLen} sectionCount=${body.sectionCount}`);
    console.log(`  .dv-fields=${JSON.stringify(body.fields)} | .dv-scenario-children=${JSON.stringify(body.children)} | .dv-sunburst=${JSON.stringify(body.sunburst)} empty=${body.hasSunburstEmpty}`);
    console.log(`  textSample="${body.textSample}"`);
    return body;
  };

  await probe(DUP, 'duplicates');
  await probe(TRASH, 'Trash');
  await ctx.close();
} finally { await browser.close().catch(() => {}); }
