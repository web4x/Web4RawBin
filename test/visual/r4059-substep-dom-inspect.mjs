// DEFINITIVE: where does 'processing change requests' actually render in T40.1's detail? Structured .dv-status-checklist
// (⇒ my reader scoping is wrong) or only raw md (⇒ real 'sub-step not shown structurally' gap)? Inspect the DOM, don't guess.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const TASK = '7a956c21-5f37-4062-b921-9bdd5a461546';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const WD = setTimeout(() => { console.log('RED: WATCHDOG'); process.exit(1); }, 120000);
const b = await webkit.launch({ headless: true });
try {
  const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
  await sleep(800);
  await p.evaluate((ref) => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.setAttribute('open', ''); d.setAttribute('ref', ref); } }, `task:${TASK}`);
  await p.waitForFunction(() => /\[[ x]\]\s*Done\b/i.test((document.querySelector('rb-detail-drawer')?.innerText || '')), { timeout: 12000 }).catch(() => {});
  const info = await p.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    const panel = d?.querySelector('.drawer-panel-detail') || d;
    const cl = panel?.querySelector('.dv-status-checklist');
    // every element whose OWN text node mentions the sub-step, with provenance
    const hits = [];
    for (const e of panel?.querySelectorAll('*') || []) {
      if ((e.textContent || '').toLowerCase().includes('processing change requests') && !(e.children.length && [...e.children].some(c => (c.textContent || '').toLowerCase().includes('processing change requests')))) {
        hits.push({ tag: e.tagName.toLowerCase(), cls: String(e.className?.baseVal || e.className || '').slice(0, 40), inMd: !!e.closest('.sv-md,.dv-md,[class*=markdown],[class*=preview],pre,code'), txt: (e.textContent || '').trim().slice(0, 50) });
      }
    }
    return {
      panelClass: panel?.className || '(none)',
      hasChecklistDiv: !!cl,
      checklistText: (cl?.innerText || '(no .dv-status-checklist)').slice(0, 300),
      checklistHasSubstep: /processing change requests/i.test(cl?.innerText || ''),
      hits: hits.slice(0, 6),
    };
  });
  console.log('panel class      :', info.panelClass);
  console.log('.dv-status-checklist present:', info.hasChecklistDiv, '| has sub-step:', info.checklistHasSubstep);
  console.log('checklist text   :', JSON.stringify(info.checklistText));
  console.log('sub-step hits (leaf elements):');
  for (const h of info.hits) console.log(`  <${h.tag} class="${h.cls}"> inMd=${h.inMd} : "${h.txt}"`);
  console.log('\nCONCLUSION:', info.checklistHasSubstep ? '(b) sub-step IS in .dv-status-checklist → my reader panel/scope missed it (fix reader)' : (info.hits.every(h => h.inMd) && info.hits.length ? '(a) sub-step ONLY in raw md, NOT the structured checklist → REAL "not shown structurally under QA Review" gap' : '(?) sub-step not found anywhere visible — re-derive'));
} finally { await b.close().catch(() => {}); clearTimeout(WD); process.exit(0); }
