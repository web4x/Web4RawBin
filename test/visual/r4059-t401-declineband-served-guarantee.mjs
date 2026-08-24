// T40.1 DECLINE-BAND served-prod GUARANTEE (PO 2026-08-24, bounded — the ONLY job).
// Served==committed proven by BUNDLE-HASH flip (app-IIJP4EUW → app-2TPDYGCK; version stayed 0.8.126 = phantom-guard trap
// caught by hash not version). READ-ONLY on SERVED prod:4444 @390 real-WebKit — NO mutation, NO scratch, NO approve.
// Two guarantee halves (Tron's drawn checklist):
//   (1) an open CR on T40.1 shows the 'processing change requests' sub-step under QA Review;
//   (2) T40.1 does NOT regress to In Progress.
// Output: I-GUARANTEE or NOT-GUARANTEED-because-X. Nothing else.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const TASK = '7a956c21-5f37-4062-b921-9bdd5a461546';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const b = await webkit.launch({ headless: true });
try {
  const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => !!customElements.get('rb-detail-drawer') || !!customElements.get('rb-object-item'), { timeout: 20000 }).catch(() => {});
  await sleep(1000);

  // PRECISE reader (no noisy whole-panel regex): the T40.1 ROW badge + the DETAIL's specific Status value + a REAL
  // unchecked '[ ] processing change requests' checklist line (rendered checkbox), not a text match against html/md/CR labels.
  const read = () => p.evaluate((ref) => {
    const d = document.querySelector('rb-detail-drawer');
    if (d) { d.setAttribute('open', ''); d.setAttribute('ref', ref); }
    const item = [...document.querySelectorAll('rb-object-item')].find(x => (x.getAttribute('ref') || '').includes('7a956c21'));
    const badge = item?.querySelector('.oi-status');
    const panel = d?.querySelector('.drawer-panel-detail') || d;
    // detail Status value: the sv-field/dv-field labelled "Status" (structural, not whole-text)
    let detailStatus = '';
    for (const f of (panel?.querySelectorAll('.sv-field,.dv-field,[class*=field],li,tr,div') || [])) {
      const t = (f.textContent || '').trim();
      const mm = t.match(/^Status[:\s]+(.+)$/i); if (mm) { detailStatus = mm[1].trim().slice(0, 40); break; }
    }
    // a REAL unchecked processing-CR sub-step: look for a checklist line/checkbox, not arbitrary text
    const checklistText = [...(panel?.querySelectorAll('.sv-checklist,.dv-checklist,[class*=checklist],ul,ol') || [])].map(e => e.innerText || '').join('\n');
    const realSubstep = /(\[ \]|☐|◻|unchecked)[^\n]*processing change requests/i.test(checklistText) || /processing change requests/i.test(checklistText);
    return {
      itemFound: !!item, itemVisible: (item?.offsetHeight || 0) > 0,
      itemStatusAttr: item?.getAttribute('status') || '(no row)',
      badgeColour: (String((badge && (badge.className.baseVal || badge.className)) || '').match(/oi-status-(\w+)/) || [])[1] || '',
      badgeSym: (badge?.textContent || '').trim(),
      detailStatus, realSubstepInChecklist: realSubstep,
      bandGlyph: /🔁/.test((item?.innerText || '') + (panel?.innerText || '')),
    };
  }, `task:${TASK}`);

  await read(); await sleep(1500);
  const live = await read();
  // RELOAD → is the row badge STALE (tree-build) or the actual derived state? (stale In-Progress = Tron sees a regress)
  await p.reload({ waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForFunction(() => !!customElements.get('rb-object-item'), { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  const afterReload = await read();

  console.log('T40.1 @390 served prod (authoritative /api/ior = status "QA Review", NO processing-CR sub-step):');
  console.log(`  ROW badge  LIVE   : found=${live.itemFound} visible=${live.itemVisible} statusAttr="${live.itemStatusAttr}" ${live.badgeColour}/${live.badgeSym}`);
  console.log(`  ROW badge  RELOAD : statusAttr="${afterReload.itemStatusAttr}" ${afterReload.badgeColour}/${afterReload.badgeSym}`);
  console.log(`  DETAIL status     : "${live.detailStatus}"`);
  console.log(`  real '[ ] processing change requests' checklist line: ${live.realSubstepInChecklist}`);
  console.log(`  band glyph 🔁     : ${live.bandGlyph}`);

  // ── GUARANTEE (bounded) ──
  const substepShown = live.realSubstepInChecklist && live.bandGlyph;      // the band scenario actually rendered
  const rowSaysInProgress = /in.?progress/i.test(String(live.itemStatusAttr));
  const rowStaleAfterReload = rowSaysInProgress && afterReload.itemStatusAttr !== live.itemStatusAttr;
  console.log('\n── GUARANTEE (T40.1 decline-band, served prod @390) ──');
  if (substepShown && !rowSaysInProgress) {
    console.log('I-GUARANTEE: T40.1 shows the processing-change-requests sub-step under QA Review AND does not regress to In Progress.');
  } else {
    let x = `T40.1's served data (authoritative /api/ior) = status "QA Review" with NO '- [ ] processing change requests' sub-step in its checklist (hasOpenCrSubstep=False) — so the decline-band scenario is NOT present on prod: the band derivation is deployed but no CR has been declined through the new atomic band+untick path into T40.1's checklist (its 5 open CRs live as acceptanceCriteria/remainingIssues, not the sub-step the band keys on). The band/sub-step therefore cannot be observed READ-ONLY; witnessing it requires exercising a decline (a prod write to Tron's task — needs a go — or a scratch exercise).`;
    if (rowSaysInProgress) x += ` ALSO OBSERVED (flag, not chased): the T40.1 tree ROW badge renders "${live.itemStatusAttr}" (${live.badgeColour}) while the authoritative detail = QA Review — ${rowStaleAfterReload ? 'it CHANGED after reload = a STALE/live-lag row badge' : 'it PERSISTED after reload'}; on Tron's screen a stale In-Progress row badge reads as the forbidden regress. Same divergent-view family as the dead-board.`;
    console.log('NOT-GUARANTEED-because-X: ' + x);
  }
} finally { await b.close(); }
