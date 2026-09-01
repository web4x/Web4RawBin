// T37.21 PART 3 — redundant body Scenario/Edit links GONE, action-bar buttons SURVIVE. Two directions, the SECOND is the
// one that matters (removing the bar = a THIRD regression; R34.7/R33.6.5, Tron-verified v0.8.153 — assert it explicitly,
// never assume). Fix (expert de73f5c18): detail-children.scenarioBrowserLinkFromIor now returns '' (body = DATA only),
// superseded by the A1 universal bar (rb-detail-drawer.ts:479 defaults [◆ Scenario, ✎ Edit]). Emoji discriminators:
// body link used 📄 Scenario / ✏️ Edit (REMOVED); the bar uses ◆ Scenario / ✎ Edit (RETAINED).
// ★ VERSION CAVEAT (PO, record verbatim): gated against CLIENT code from v0.8.154 while the served version STRING still
// reads 0.8.153 — deliberate batched restart (parts 3+4 client-only, live-served; process version syncs at the 3+4
// restart). NOT a phantom: named, not hidden. Read-only on the live prod client (no writes, no identities). @390 webkit.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const SPRINT37 = 'b86b53cc-13cb-409a-81d6-2025b5f2979e';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);

const browser = await webkit.launch();
let verdict = 'INCONCLUSIVE', exit = 1;
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await sleep(600);
  const servedVer = await page.evaluate(async () => { try { return (await (await fetch('/api/config')).json()).version; } catch { return '?'; } }); // relative, post-goto (same-origin)
  // discover a real Task uuid (any unit detail carried the body link per R26.2 'EVERY detail view')
  const taskUuid = await page.evaluate(async (s) => { try { const k = await (await fetch(`/api/trace/children/${s}`)).json(); return (k.children || []).find((c) => c.type === 'Task')?.uuid || null; } catch { return null; } }, SPRINT37);
  if (!taskUuid) { verdict = 'INCONCLUSIVE: could not discover a Task uuid on the served client to mount a detail.'; throw new Error('no-task'); }

  // mount the detail for that unit in the drawer (read-only; the A1 bar + body both self-fetch)
  const mounted = await page.evaluate((uuid) => {
    let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); (document.querySelector('.trace-page') || document.body).appendChild(d); }
    d.setAttribute('ref', `task:${uuid}`); d.setAttribute('open', ''); return true;
  }, taskUuid);
  await sleep(1800);

  // read: body panel (detail content) vs action bar (the strip), scoped separately
  const read = () => page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    const body = d?.querySelector('.drawer-panel-detail') || d;
    const bodyText = (body?.textContent || '');
    const bodyHtml = (body?.innerHTML || '');
    // body-link detectors: the removed 📄 Scenario / ✏️ Edit + any /md scenario-browser <a> inside the body
    const bodyHasPageEmoji = /📄/.test(bodyText);
    const bodyHasPencilEdit = /✏/.test(bodyText);
    const bodyScenarioAnchor = !!body && [...body.querySelectorAll('a')].some((a) => /\/md\//.test(a.getAttribute('href') || '') && /scenario/i.test(a.textContent || ''));
    // action bar: the retained ◆ Scenario / ✎ Edit (search the whole drawer, they live in the strip not the body panel)
    const all = d ? (d.textContent || '') : '';
    const barScenario = /◆\s*Scenario/.test(all) || [...(d?.querySelectorAll('button,[role=button],.rb-strip *') || [])].some((e) => /◆\s*Scenario|^Scenario$/.test((e.textContent || '').trim()));
    const barEdit = /✎\s*Edit/.test(all) || [...(d?.querySelectorAll('button,[role=button],.rb-strip *') || [])].some((e) => /✎\s*Edit|^Edit$/.test((e.textContent || '').trim()));
    return { bodyLen: bodyText.length, bodyHasPageEmoji, bodyHasPencilEdit, bodyScenarioAnchor, barScenario, barEdit };
  });
  const s = await read();
  await page.screenshot({ path: 'test-results/r4021p3/detail-links.png' }).catch(() => {});

  const bodyLinksGone = !s.bodyHasPageEmoji && !s.bodyHasPencilEdit && !s.bodyScenarioAnchor && s.bodyLen > 50; // gone, but a real body rendered
  const barSurvives = s.barScenario && s.barEdit;                                                        // ← the one that matters
  R(`  DIR-1 body redundant links GONE: ${bodyLinksGone} (📄=${s.bodyHasPageEmoji} ✏=${s.bodyHasPencilEdit} /md-anchor=${s.bodyScenarioAnchor}, bodyLen=${s.bodyLen})`);
  R(`  DIR-2 action bar SURVIVES ◆Scenario+✎Edit: ${barSurvives} (scenario=${s.barScenario} edit=${s.barEdit})`);

  // ── FAILABILITY (prove BOTH directions can fail) ──
  // (a) inject a 📄 Scenario link into the body → DIR-1 must flip false
  await page.evaluate(() => { const b = document.querySelector('rb-detail-drawer .drawer-panel-detail') || document.querySelector('rb-detail-drawer'); if (b) { const a = document.createElement('a'); a.href = '/md/x'; a.textContent = '📄 Scenario'; b.appendChild(a); } });
  const s2 = await read();
  const dir1CanFail = (s2.bodyHasPageEmoji || s2.bodyScenarioAnchor) === true; // the injected link is now detected
  // (b) clear the bar → DIR-2 must flip false
  await page.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); if (d && typeof d.setActions === 'function') d.setActions([]); });
  await sleep(300);
  const s3 = await read();
  const dir2CanFail = !(s3.barScenario && s3.barEdit); // bar now empty → survives=false
  R(`  FAILABILITY: DIR-1 bites on injected 📄 link=${dir1CanFail} · DIR-2 bites on cleared bar=${dir2CanFail}`);

  const green = bodyLinksGone && barSurvives && dir1CanFail && dir2CanFail;
  const CAVEAT = `[gated against CLIENT code from v0.8.154 while the served version STRING still read ${servedVer} — deliberate batched restart, parts 3+4 client-only live-served; version syncs at the 3+4 restart. Named, not phantom.]`;
  if (green) verdict = `GREEN — Part 3 both directions: redundant body Scenario/Edit links are GONE (no 📄/✏️/‌md-anchor, real body rendered) AND the action bar's ◆ Scenario + ✎ Edit SURVIVE (the 3rd-regression guard holds). Both directions proven able-to-fail (injected link caught; cleared bar caught). @390 real-WebKit on the live prod client. ${CAVEAT}`;
  else if (!barSurvives) verdict = `RED — ★ 3RD REGRESSION RISK: the action bar ◆ Scenario/✎ Edit did NOT survive (scenario=${s.barScenario} edit=${s.barEdit}). Removing the bar is exactly what Tron verified at v0.8.153 must NOT happen. STOP + flag. ${CAVEAT}`;
  else if (!bodyLinksGone) verdict = `RED — redundant body links still present (📄=${s.bodyHasPageEmoji} ✏=${s.bodyHasPencilEdit} /md-anchor=${s.bodyScenarioAnchor}) → the P3 removal is not live on this client. ${CAVEAT}`;
  else verdict = `RED — failability not proven: DIR-1 bites=${dir1CanFail} DIR-2 bites=${dir2CanFail}; a direction that can't fail is not a gate. ${CAVEAT}`;
} catch (e) {
  if (!/no-task/.test(String(e && e.message))) verdict = `ERROR: ${String(e && e.message).slice(0, 200)}`;
} finally { await browser.close().catch(() => {}); }
R(`\n═══ T37.21 PART-3 REDUNDANT-LINKS GATE ═══\n${verdict}`);
process.exit(/^GREEN/.test(verdict) ? 0 : 1);
