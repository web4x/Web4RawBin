// R40.31 B PRE-FIX DIAGNOSTIC BASELINE — NOT a B-green (a labeled PRE-FIX arm of a differential; PO + architect 748cab757).
// ★ PRE-REGISTERED PREDICTION (recorded to PO before running): bus-wide INERT — NO broadcast-driven in-place flip on /model OR
//   /trace; any badge move is the POLL (wholesale tree re-render) around a dead per-ref subscription (raw-ref vs `${type}:${uuid}`
//   key mismatch, expert 9bda7916f). If a REAL in-place flip appears on /trace → the raw-ref FORMAT differs per surface (still one
//   shared builder fixes it) — either way BOUNDS THE DIVERGENCE LOCUS, not the fix. Report ACTUAL vs PREDICTED explicitly.
// ★ CONDITION-1 (architect): PROVE THE DISCRIMINATOR before trusting it — self-test REPLACED (known wholesale) + IN-PLACE (known
//   mutation). If it cannot demonstrate BOTH, every classification is INVALID (not RED/GREEN). prove-the-instrument-before-the-reading.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
const TARGET = '97e8a6ad-46db-440f-a9be-cfb97ca64df4';
const TAG = 'data-bdisc';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// discriminator self-test (condition-1): tag a root, then (a) wholesale-replace it → REPLACED; (b) mutate content in place → IN-PLACE.
const proveDiscriminator = (page) => page.evaluate((TAG) => {
  const host = document.createElement('div'); document.body.appendChild(host);
  host.innerHTML = `<span ${TAG}="t1">A</span>`;
  host.innerHTML = `<span>B</span>`;                                   // wholesale replace (root gone)
  const replacedDetected = !host.querySelector(`[${TAG}="t1"]`) && host.textContent === 'B';
  host.innerHTML = `<span ${TAG}="t2">X</span>`;
  host.querySelector(`[${TAG}="t2"]`).textContent = 'Y';              // in-place mutation (root persists)
  const el = host.querySelector(`[${TAG}="t2"]`);
  const inPlaceDetected = !!el && el.textContent === 'Y';
  host.remove();
  return { replacedDetected, inPlaceDetected };
}, TAG);

// find TARGET's real tree row (rb-object-item, its REAL ref — never a standalone mount: a chosen ref could falsely MATCH the notify
// key and hide the real raw-ref mismatch). Tag its root. Returns whether it was found in-tree.
const tagRow = (page, u) => page.evaluate(({ u, TAG }) => {
  const el = [...document.querySelectorAll('rb-object-item')].find((e) => (e.getAttribute('ref') || '').includes(u));
  if (el) { el.setAttribute(TAG, 'row'); return { found: true, ref: el.getAttribute('ref'), badge: el.querySelector('.oi-status')?.textContent?.trim() || null, cls: el.querySelector('.oi-status')?.className || null }; }
  return { found: false };
}, { u, TAG });
const readRow = (page, TAG) => page.evaluate((TAG) => {
  const el = document.querySelector(`rb-object-item[${TAG}="row"]`);  // the SAME tagged element (persists iff in-place; gone iff replaced)
  if (!el) { const any = [...document.querySelectorAll('rb-object-item')].find((e) => (e.getAttribute('ref') || '')); return { tagPersists: false, badge: null }; }
  return { tagPersists: true, badge: el.querySelector('.oi-status')?.textContent?.trim() || null, cls: el.querySelector('.oi-status')?.className || null };
}, TAG);
// drawer (singleton root — never "replaced"; measures in-place controls/badge change vs inert = the DETAIL+CONTROLS surface)
const openDrawer = async (page, u) => { await page.waitForSelector('rb-detail-drawer', { timeout: 15000 }); await page.evaluate((x) => { const d = document.querySelector('rb-detail-drawer'); d.setAttribute('open', ''); d.setAttribute('ref', `task:${x}`); }, u); await page.waitForSelector('rb-detail-drawer button[data-verb="qa-approve"]', { timeout: 8000 }).catch(() => {}); };
const readDrawer = (page) => page.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); return { approve: !!d?.querySelector('button[data-verb="qa-approve"]'), badge: d?.querySelector('.dv-status-badge')?.textContent?.trim() || null }; });
const classify = (beforeBadge, after, changed) => !changed ? 'INERT' : (after.tagPersists ? 'IN-PLACE (targeted re-render)' : 'REPLACED (wholesale/poll tree rebuild)');

const f = await setupFoundation({ attachEvidenceTo: TARGET });
const oh = f.ownerHeaders(); const smSession = (/sm_session=([^;]+)/.exec(oh.Cookie || '') || [])[1] || '';
const cookie = { name: 'sm_session', value: smSession, domain: 'localhost', path: '/', httpOnly: true, secure: true };
const browser = await webkit.launch({ headless: true });
const out = { label: 'PRE-FIX ARM', worktreeSha: f.worktreeSha, servedVersion: f.servedVersion, prediction: 'bus-wide INERT (no broadcast-driven in-place flip; any move = poll/wholesale)', surfaces: {} };
try {
  // condition-1: prove the discriminator on a throwaway page FIRST
  const probe = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage(); await probe.goto(`${f.base}/api/config`).catch(() => {});
  out.discriminatorProof = await proveDiscriminator(probe);
  const discOk = out.discriminatorProof.replacedDetected === true && out.discriminatorProof.inPlaceDetected === true;

  if (discOk) {
    // one approve, two observer surfaces (/model + /trace) — the broadcast reaches both; single Done transition.
    const mk = async (surface) => { const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx.addCookies([cookie]); const p = await ctx.newPage(); const ws = []; p.on('websocket', (w) => w.on('framereceived', (ev) => { try { const m = JSON.parse(ev.payload); ws.push({ type: m.type, uuid: m.uuid }); } catch { } })); await p.goto(`${f.base}${surface}`, { waitUntil: 'domcontentloaded', timeout: 20000 }); await sleep(2500); return { ctx, p, ws }; };
    const model = await mk('/model'); const trace = await mk('/trace');
    const actorCtx = await browser.newContext({ ignoreHTTPSErrors: true }); await actorCtx.addCookies([cookie]); const actor = await actorCtx.newPage(); await actor.goto(`${f.base}/model`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    for (const [name, o] of [['model', model], ['trace', trace]]) {
      const row = await tagRow(o.p, TARGET); await openDrawer(o.p, TARGET); const drawerBefore = await readDrawer(o.p);
      out.surfaces[name] = { rowFound: row.found, rowBadgeBefore: row.badge ?? null, drawerBefore };
    }
    await openDrawer(actor, TARGET); const hadApprove = await actor.$('rb-detail-drawer button[data-verb="qa-approve"]'); if (hadApprove) await actor.click('rb-detail-drawer button[data-verb="qa-approve"]');
    await sleep(5000);
    for (const [name, o] of [['model', model], ['trace', trace]]) {
      const rowAfter = await readRow(o.p, TAG); const drawerAfter = await readDrawer(o.p);
      const s = out.surfaces[name];
      s.rowBadgeAfter = rowAfter.badge ?? null; s.rowTagPersists = rowAfter.tagPersists; s.drawerAfter = drawerAfter;
      s.wsUnitChangedForTarget = o.ws.some((fr) => fr.type === 'unit-changed' && String(fr.uuid || '') === TARGET);
      const rowChanged = s.rowFound && (s.rowBadgeAfter !== s.rowBadgeBefore);
      s.rowVerdict = s.rowFound ? classify(s.rowBadgeBefore, rowAfter, rowChanged) : 'ROW-NOT-IN-TREE (not testable on this surface)';
      const drawerChanged = (drawerAfter.approve !== s.drawerBefore.approve) || (drawerAfter.badge !== s.drawerBefore.badge);
      s.drawerVerdict = drawerChanged ? 'CHANGED (drawer controls/badge moved)' : 'INERT (controls/badge unchanged)';
    }
    for (const o of [model, trace, { ctx: actorCtx }]) await o.ctx.close();
  }
} finally { await browser.close(); out.teardown = await f.teardown(); }

// ACTUAL vs PREDICTED
const surfInert = (s) => (s.drawerVerdict?.startsWith('INERT')) && (!s.rowFound || s.rowVerdict === 'INERT' || s.rowVerdict.startsWith('REPLACED'));
const busWideInert = out.discriminatorProof?.replacedDetected && out.discriminatorProof?.inPlaceDetected && Object.values(out.surfaces).every(surfInert);
console.log('\n===== R40.31 B PRE-FIX DIAGNOSTIC (baseline — NOT B-green) =====');
console.log(JSON.stringify(out, null, 2));
console.log(`\n★ DISCRIMINATOR PROOF (condition-1): REPLACED=${out.discriminatorProof?.replacedDetected} · IN-PLACE=${out.discriminatorProof?.inPlaceDetected} → ${out.discriminatorProof?.replacedDetected && out.discriminatorProof?.inPlaceDetected ? 'PROVEN' : 'UNPROVEN → all classifications INVALID'}`);
console.log(`★ PREDICTED: bus-wide INERT (no broadcast-driven in-place flip; any move = poll/wholesale)`);
for (const [n, s] of Object.entries(out.surfaces)) console.log(`  ACTUAL /${n}: row=${s.rowVerdict} (badge ${s.rowBadgeBefore}→${s.rowBadgeAfter}, tagPersists=${s.rowTagPersists}) · drawer=${s.drawerVerdict} · wsFrame=${s.wsUnitChangedForTarget}`);
console.log(`★ ACTUAL vs PREDICTED: ${!out.discriminatorProof?.replacedDetected || !out.discriminatorProof?.inPlaceDetected ? 'INVALID (discriminator unproven)' : busWideInert ? 'MATCHES prediction (bus-wide inert / poll-wholesale)' : 'DIVERGES — a real in-place flip appeared (row path resolves keys on some surface); narrows the divergence locus'}`);
process.exit(0); // baseline: always exit 0 (this is not a pass/fail gate — it is a labeled differential arm)
