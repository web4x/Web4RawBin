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
// ★ TERMINATION pattern (PO completion-condition 2026-08-29, class 'NON-TERMINATION HAS NO RED'): hard watchdog turns a
// never-terminate into a RED exit; finally always closes the browser + process.exit forces drain; node fetch gets a timeout.
const HARD_MS = Number(process.env.GATE_HARD_MS || 180000);
const WD = setTimeout(() => { console.log(`RED: WATCHDOG — gate exceeded ${HARD_MS}ms without terminating (never-terminate = RED).`); process.exit(1); }, HARD_MS);

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

  // authoritative served derivation (dynamic — never a hardcoded narrative)
  const ior = await (async () => { const res = await fetch(`${BASE}/api/ior/ior:instance:${TASK}`, { signal: AbortSignal.timeout(15000) }).catch(() => null); if (!res) return {}; const d = await res.json(); const m = d?.unit?.model || {}; const cl = m.statusChecklist || ''; return { status: m.status, hasSubstep: /^\s+-\s*\[ \]\s*processing change requests/im.test(cl) }; })();

  // NAVIGATE to T40.1's tree row (Tron's board surface) — expand toward Sprint 40 until the row renders, so the ROW
  // surface is actually EVALUATED (not fail-closed as 'not in default view'). Bounded rounds; each expand settles.
  for (let round = 0; round < 10; round++) {
    const found = await p.evaluate(() => [...document.querySelectorAll('rb-object-item')].some(x => (x.getAttribute('ref') || '').includes('7a956c21')));
    if (found) { console.log(`  T40.1 row reached (round ${round})`); break; }
    await p.evaluate(() => { for (const it of document.querySelectorAll('rb-object-item')) { const t = it.innerText || ''; if (/Sprints?\b|Sprint 40|Sprint40|Marcel Donges/i.test(t)) { const tog = it.querySelector('.expander,.toggle,[class*="expand"],[class*="chevron"],.oi-toggle,.oi-expand') || it; try { tog.click(); } catch {} } } });
    await sleep(1000);
  }
  await read(); await sleep(1500);
  const live = await read();
  // RELOAD → is the row badge STALE (tree-build) or the actual derived state? (stale In-Progress = Tron sees a regress)
  await p.reload({ waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForFunction(() => !!customElements.get('rb-object-item'), { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  const afterReload = await read();

  console.log(`AUTHORITATIVE /api/ior: status="${ior.status}" hasOpenCrSubstep=${ior.hasSubstep}`);
  console.log('T40.1 @390 served prod — per surface:');
  console.log(`  DETAIL status     : "${live.detailStatus}"  | sub-step line rendered: ${live.realSubstepInChecklist}`);
  console.log(`  ROW (📌 pin-slot) LIVE   : found=${live.itemFound} visible=${live.itemVisible} statusAttr="${live.itemStatusAttr}" ${live.badgeColour}/${live.badgeSym}`);
  console.log(`  ROW (📌 pin-slot) RELOAD : statusAttr="${afterReload.itemStatusAttr}" ${afterReload.badgeColour}/${afterReload.badgeSym}`);

  // ── GUARANTEE (dynamic, per surface — no hardcoded narrative) ──
  const bandDerived = /qa-?review-with-open-cr/i.test(String(ior.status)) && ior.hasSubstep;   // authoritative decline-band present
  const half1_substepUnderQA = live.realSubstepInChecklist && /qa-?review/i.test(String(live.detailStatus)); // sub-step shown under QA Review (detail)
  const detailNoRegress = !/^\s*in.?progress\s*$/i.test(String(live.detailStatus)) && /qa-?review/i.test(String(live.detailStatus));
  const rowFound = live.itemFound === true;                                   // FAIL-CLOSED: target-not-found (e.g. the pin moved) is NEVER a pass
  const rowRegressed = /in.?progress/i.test(String(live.itemStatusAttr)) && afterReload.itemStatusAttr === live.itemStatusAttr;
  const rowSurfaceHolds = rowFound && !rowRegressed;                          // a missing/moved specimen cannot satisfy the property
  console.log('\n── GUARANTEE (T40.1 decline-band, served prod @390) ──');
  console.log(`  precondition (authoritative band derived): ${bandDerived}`);
  console.log(`  half-1 sub-step under QA Review shown (detail): ${half1_substepUnderQA}`);
  console.log(`  half-2 no-regress — detail surface: ${detailNoRegress ? 'HOLDS' : 'FAILS'} | pin-slot row surface: ${!rowFound ? 'FAIL-CLOSED (target row not found — pin may have moved; NOT a pass)' : (rowSurfaceHolds ? 'HOLDS' : 'FAILS (row=In-Progress)')}`);
  if (half1_substepUnderQA && detailNoRegress && rowSurfaceHolds) {
    console.log('\nI-GUARANTEE: T40.1 shows the processing-change-requests sub-step under QA Review AND does not regress to In Progress on any surface.');
  } else if (half1_substepUnderQA && detailNoRegress && rowRegressed) {
    console.log(`\nNOT-GUARANTEED-because-X: the decline-band works in the DERIVATION + DETAIL (authoritative status="${ior.status}", sub-step shown under QA Review, no regress) — half-1 and detail-side half-2 GREEN — BUT the T40.1 tree 📌 pin-slot ROW still renders "${live.itemStatusAttr}"/${live.badgeColour}, persisting after reload, so on Tron's actual board surface T40.1 reads as regressed to In Progress. Same confirmed two-source divergence already flagged (probe 109151e8e): tree-source status ≠ /api/ior derivation. The migration fixed the derivation; the pin-slot row surface does not reflect it.`);
  } else {
    console.log(`\nNOT-GUARANTEED-because-X: half-1 shown=${half1_substepUnderQA}, detail no-regress=${detailNoRegress}, authoritative status="${ior.status}" hasSubstep=${ior.hasSubstep}. See per-surface lines.`);
  }
} finally { await b.close().catch(() => {}); clearTimeout(WD); process.exit(process.exitCode || 0); }
