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
    const d = document.querySelector('rb-detail-drawer');   // observe-only — opening is done deterministically by openDetail() below, NOT re-triggered per read (that raced the async /api/ior render)
    const item = [...document.querySelectorAll('rb-object-item')].find(x => (x.getAttribute('ref') || '').includes('7a956c21'));
    const badge = item?.querySelector('.oi-status');
    const panel = d?.querySelector('.drawer-panel-detail') || d;
    // detail Status value: the sv-field/dv-field labelled "Status" (structural, not whole-text)
    let detailStatus = '';
    for (const f of (panel?.querySelectorAll('.sv-field,.dv-field,[class*=field],li,tr,div') || [])) {
      const t = (f.textContent || '').trim();
      const mm = t.match(/^Status[:\s]+(.+)$/i); if (mm) { detailStatus = mm[1].trim().slice(0, 40); break; }
    }
    // the RENDERED structured checklist ONLY (.dv-status-checklist = renderStatusChecklist output): the ☐ processing-change-
    // requests line indented under ☐ QA Review. Target it precisely — NOT the CR master-list (span.oi-name 'CR #86-2…') and
    // NOT raw md. (Earlier false-NEGATIVE: an over-broad [class*=preview] exclusion caught the drawer's preview ancestor and
    // dropped the whole checklist. Assert the exact artifact — DOM-verified via r4059-substep-dom-inspect.mjs.)
    const checklistEl = panel?.querySelector('.dv-status-checklist');
    const realSubstep = /processing change requests/i.test(checklistEl?.innerText || '');
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
  // ★ AUTHORED-STATE read (Tron R40.59 has TWO parts: sub-step EXISTS **and** QA Review stays [x]). The band status
  // 'QA-Review-with-open-CR' derives PRECISELY BECAUSE QA Review is unticked + sub-step open → it MASKS an untick regress.
  // So assert the AUTHORED checkbox (statusChecklist), never the derived/rendered status which papers over the regress.
  const ior = await (async () => { const res = await fetch(`${BASE}/api/ior/ior:instance:${TASK}`, { signal: AbortSignal.timeout(15000) }).catch(() => null); if (!res) return {}; const d = await res.json(); const m = d?.unit?.model || {}; const cl = m.statusChecklist || ''; return { status: m.status, hasSubstep: /^\s+-\s*\[ \]\s*processing change requests/im.test(cl), qaTicked: /^\s*-\s*\[x\]\s*QA Review/im.test(cl) }; })();

  // ★ DETAIL captured FIRST in the CLEAN pre-nav state — tree navigation re-renders and confounds the detail read
  // (DOM-inspection r4059-substep-dom-inspect.mjs proves the sub-step renders when read clean). Open the ref ONCE, wait on
  // the LAST-rendering checklist line (Done ⇒ the sub-step before it has painted); never a sleep (readiness = last artifact).
  const openDetail = () => p.evaluate((ref) => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.setAttribute('open', ''); d.setAttribute('ref', ref); } }, `task:${TASK}`);
  const waitDetailReady = () => p.waitForFunction(() => {
    const d = document.querySelector('rb-detail-drawer'); const panel = d?.querySelector('.drawer-panel-detail') || d; const txt = panel?.innerText || '';
    const cl = panel?.querySelector('.dv-status-checklist');
    return /Task 40\.1\b/.test(txt) && /Status/i.test(txt) && /\[[ x]\]\s*Done\b/i.test(cl?.innerText || ''); // Done = last checklist line
  }, { timeout: 12000 }).then(() => true).catch(() => false);
  await openDetail();
  const detailReady = await waitDetailReady();
  if (!detailReady) console.log('  ⚠ detail did not reach the last-render signal (Done line) within 12s — reporting, NOT averaging.');
  const live = await read();   // DETAIL fields authoritative here (clean, pre-nav)

  // THEN navigate to T40.1's tree ROW (Tron's board surface) for the ROW-surface check only. Bounded; each round re-checks a REAL found condition.
  for (let round = 0; round < 10; round++) {
    const found = await p.evaluate(() => [...document.querySelectorAll('rb-object-item')].some(x => (x.getAttribute('ref') || '').includes('7a956c21')));
    if (found) { console.log(`  T40.1 row reached (round ${round})`); break; }
    await p.evaluate(() => { for (const it of document.querySelectorAll('rb-object-item')) { const t = it.innerText || ''; if (/Sprints?\b|Sprint 40|Sprint40|Marcel Donges/i.test(t)) { const tog = it.querySelector('.expander,.toggle,[class*="expand"],[class*="chevron"],.oi-toggle,.oi-expand') || it; try { tog.click(); } catch {} } } });
    await sleep(1000);
  }
  const liveRow = await read();   // ROW fields authoritative here (post-nav)
  // RELOAD → is the row badge STALE (tree-build) or the actual derived state? (stale In-Progress = Tron sees a regress)
  await p.reload({ waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForFunction(() => !!customElements.get('rb-object-item'), { timeout: 20000 }).catch(() => {});
  // the tree collapses on reload → deterministically re-navigate to the row (each round re-checks a REAL 'found' condition,
  // not a blind sleep) so the row-stale comparison reads the actual row, never a missing one.
  for (let round = 0; round < 10; round++) {
    const found = await p.evaluate(() => [...document.querySelectorAll('rb-object-item')].some(x => (x.getAttribute('ref') || '').includes('7a956c21')));
    if (found) break;
    await p.evaluate(() => { for (const it of document.querySelectorAll('rb-object-item')) { const t = it.innerText || ''; if (/Sprints?\b|Sprint 40|Marcel Donges/i.test(t)) { const tog = it.querySelector('.expander,.toggle,[class*="expand"],[class*="chevron"],.oi-expand') || it; try { tog.click(); } catch {} } } });
    await sleep(800);
  }
  const afterReload = await read();

  console.log(`AUTHORITATIVE /api/ior: status="${ior.status}" hasOpenCrSubstep=${ior.hasSubstep}`);
  console.log('T40.1 @390 served prod — per surface:');
  console.log(`  DETAIL status     : "${live.detailStatus}"  | sub-step line rendered: ${live.realSubstepInChecklist}`);
  console.log(`  ROW (tree) LIVE   : found=${liveRow.itemFound} visible=${liveRow.itemVisible} statusAttr="${liveRow.itemStatusAttr}" ${liveRow.badgeColour}/${liveRow.badgeSym}`);
  console.log(`  ROW (tree) RELOAD : statusAttr="${afterReload.itemStatusAttr}" ${afterReload.badgeColour}/${afterReload.badgeSym}`);

  // ── GUARANTEE (dynamic, per surface — no hardcoded narrative). DETAIL fields from `live` (clean pre-nav), ROW from `liveRow` (post-nav). ──
  const bandDerived = /qa-?review-with-open-cr/i.test(String(ior.status)) && ior.hasSubstep;   // authoritative decline-band present
  const half1_substepUnderQA = live.realSubstepInChecklist && /qa-?review/i.test(String(live.detailStatus)); // sub-step shown under QA Review (detail, clean read)
  const detailNoRegress = !/^\s*in.?progress\s*$/i.test(String(live.detailStatus)) && /qa-?review/i.test(String(live.detailStatus));
  const rowFound = liveRow.itemFound === true;                                   // FAIL-CLOSED: target-not-found (e.g. the pin moved) is NEVER a pass
  const rowRegressed = /in.?progress/i.test(String(liveRow.itemStatusAttr)) && afterReload.itemStatusAttr === liveRow.itemStatusAttr;
  const rowSurfaceHolds = rowFound && !rowRegressed;                          // a missing/moved specimen cannot satisfy the property
  // ★ THIRD check (half-green is not a guarantee): the row badge must render a PROPER GLYPH, not the gray raw-text fallback.
  // The band 'qa-review-with-open-cr' has no client BADGE_MAP entry → gray span with the raw enum text (not 🔁). That is
  // Tron-facing and holds the guarantee OPEN even when both literal halves pass. Flips true when the one-sourced fix ships.
  const rowBadgeRawText = /qa-?review-with-open-cr/i.test(String(liveRow.badgeSym)) || (liveRow.badgeColour === 'gray' && /open-cr/i.test(String(liveRow.badgeSym)));
  const rowBadgeProper = rowFound && !rowBadgeRawText;
  // ★ AUTHORED-STATE half (the thing the fix changes): a decline must KEEP QA Review [x]. Unticked = the Tron regress the
  // band derivation masks. RED now on 0.8.139 (QA Review is [ ]); flips GREEN when the expert's checklist fix (dc514665b) lands.
  const authoredQaTicked = ior.qaTicked === true;
  console.log('\n── GUARANTEE (T40.1 decline-band, served prod @390) ──');
  console.log(`  precondition (authoritative band derived): ${bandDerived}`);
  console.log(`  ★ AUTHORED no-regress — QA Review box stays [x]: ${authoredQaTicked ? 'HOLDS' : 'FAILS ([ ] — decline unticked it; band masks it as not-In-Progress)'}`);
  console.log(`  half-1 sub-step under QA Review shown (detail): ${half1_substepUnderQA}`);
  console.log(`  half-2 no-regress — detail surface: ${detailNoRegress ? 'HOLDS' : 'FAILS'} | tree row surface: ${!rowFound ? 'FAIL-CLOSED (row not found — NOT a pass)' : (rowSurfaceHolds ? 'HOLDS' : 'FAILS (row=In-Progress)')}`);
  console.log(`  badge glyph (row shows 🔁 not gray raw-text): ${rowBadgeProper ? 'HOLDS' : `FAILS (badge=${liveRow.badgeColour}/${liveRow.badgeSym})`}`);
  if (authoredQaTicked && half1_substepUnderQA && detailNoRegress && rowSurfaceHolds && rowBadgeProper) {
    console.log('\nI-GUARANTEE: a decline KEEPS QA Review [x] + adds the [ ] processing-change-requests sub-step, the detail shows it under QA Review, no surface regresses to In Progress, AND the row badge renders a proper band glyph.');
  } else if (!authoredQaTicked) {
    console.log(`\nNOT-GUARANTEED-because-X: the AUTHORED checklist has QA Review UNTICKED ([ ]) — the decline REGRESSED it (reopen:true). Tron's R40.59 AC is "a decline must NOT untick QA Review, only add the [ ] sub-step". The band status '${ior.status}' MASKS this (derives not-In-Progress precisely because QA Review is unticked), so the render/derivation looks right while the authored state regressed. Sub-step present=${half1_substepUnderQA}, badge-proper=${rowBadgeProper}. This RED is the live baseline the expert's checklist fix dc514665b flips (decline keeps QA Review [x]).${rowBadgeProper ? '' : ' (Also open: badge-map glyph gap — separate one-source fix.)'}`);
  } else if (half1_substepUnderQA && detailNoRegress && rowSurfaceHolds && !rowBadgeProper) {
    console.log(`\nNOT-GUARANTEED-because-X: both guarantee halves HOLD (sub-step shown under QA Review + no regress, derivation/detail/row-status all = band) — BUT the tree ROW BADGE renders gray raw-text "${liveRow.badgeSym}" instead of the 🔁 band glyph (BADGE_MAP has no 'qa-review-with-open-cr' entry = STATUS_GLYPHS/BADGE_MAP duplicate-source). Tron's board shows raw enum text. RED baseline r4059-badge-glyph-single-source-lint.mjs owns this; flips GREEN when the one-sourced fix ships. Half-green is not a guarantee.`);
  } else if (half1_substepUnderQA && detailNoRegress && rowRegressed) {
    console.log(`\nNOT-GUARANTEED-because-X: the decline-band works in the DERIVATION + DETAIL (authoritative status="${ior.status}", sub-step shown under QA Review, no regress) — half-1 and detail-side half-2 GREEN — BUT the T40.1 tree 📌 pin-slot ROW still renders "${live.itemStatusAttr}"/${live.badgeColour}, persisting after reload, so on Tron's actual board surface T40.1 reads as regressed to In Progress. Same confirmed two-source divergence already flagged (probe 109151e8e): tree-source status ≠ /api/ior derivation. The migration fixed the derivation; the pin-slot row surface does not reflect it.`);
  } else {
    console.log(`\nNOT-GUARANTEED-because-X: half-1 shown=${half1_substepUnderQA}, detail no-regress=${detailNoRegress}, authoritative status="${ior.status}" hasSubstep=${ior.hasSubstep}. See per-surface lines.`);
  }
} finally { await b.close().catch(() => {}); clearTimeout(WD); process.exit(process.exitCode || 0); }
