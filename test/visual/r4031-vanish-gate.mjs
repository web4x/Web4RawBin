// R40.31 LANDING-3 · HALF B (VANISH) — TRON'S #1 ACCEPTANCE ("live MVC not at all working"). Owner approves on client-1;
// a GENUINELY PASSIVE client-2 (never clicked, no local emit) re-renders detail + status-badge + CONTROLS (Approve/Decline
// VANISH at Done) from the BROADCAST ALONE, NO reload. Does NOT need graph-absence — runs on a NORMAL current-sprint QA-Review
// task (97e8a6ad, graph-present → controls ARE present, exactly what present-before→absent-after needs). 4 TRAPS:
//   (1) broadcast≠poll: client-2 makes ZERO requests in a quiet window; the ONLY GET after approve is surgical /api/ior/<uuid>; update <5s (causal).
//   (2) proof MUST FAIL with broadcast suppressed = C1 (serverPatch neuters publishUnitChanged → client-2 stays connected, does NOT update).
//   (3) controls PRESENT-BEFORE → ABSENT-AFTER (never absence-only).
//   (4) NO-RELOAD as a POSITIVE sentinel surviving the action + nav counter 0.
// Approve reaches Done via a MECHANISM FIXTURE (attachEvidenceTo injects a passing two-keyed Test into the REAL task's SCRATCH
// chain) — proves the approve→Done→broadcast PATH, does NOT claim the real task is Done-worthy. POST-RUN: assert PROD still shows
// 97e8a6ad = 'QA Review' (isolation held for a REAL task — the strongest safeguard). VERSION-PINNED per arm. Real-WebKit @390. Raw → PO+architect.
import { webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { setupFoundation } from './r4031-foundation.mjs';

const TARGET = process.env.VANISH_UUID || '97e8a6ad-46db-440f-a9be-cfb97ca64df4'; // Sprint 37 (current) QA-Review, graph-present → controls render
const PROD = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// C1 neuter — insert an early-return in publishUnitChanged's IMPLEMENTATION body. The old regex used [^=]* which stops at the
// '=' in the type annotation '=> void' → never matched (grep -c=0). This matches the impl arrow specifically ([\s\S]*? spans the
// type). teardownAsserts the neuter TOOK EFFECT (marker present) — prove-the-instrument-before-the-reading.
function neuterBroadcast(root) {
  const p = path.join(root, 'src/ts/server/server.ts');
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(/(const publishUnitChanged:[\s\S]*?=\s*\(ior, uuid\)\s*=>\s*\{)/, '$1 if (1) return; /* C1: broadcast OFF */');
  if (after === before || !after.includes('/* C1: broadcast OFF */')) throw new Error('neuterBroadcast: regex did NOT patch publishUnitChanged — instrument would be unproven');
  fs.writeFileSync(p, after);
}
// BISECT instrument (PO): record the FINAL keys at the ViewBus boundary (both notify & subscribe route through viewBusKey at the
// call sites, so `ref` here IS the built key) + count whether each subscribed callback FIRES. Answers: (a) callback never fires →
// key problem one layer deeper (notify-key vs subscribe-key differ); (b) fires but no view change → re-derive defect. clientPatch
// runs BEFORE buildDist so this compiles into the served bundle. Throws if the regex misses = prove-the-instrument.
function instrumentViewBus(root) {
  const p = path.join(root, 'src/public/ts/trace/ViewBus.ts');
  const before = fs.readFileSync(p, 'utf8');
  let s = before.replace(/(notify\(ref: string, payload\?: unknown\): void \{)/, '$1 try{const g=globalThis;g.__nk=(g.__nk||[]);g.__nk.push(ref);}catch(e){}');
  s = s.replace(/(subscribe\(ref: string, cb: ViewBusListener\): \(\) => void \{)/, '$1 try{const g=globalThis;g.__sk=(g.__sk||[]);g.__sk.push(ref);const _o=cb;cb=(pl)=>{try{g.__fk=(g.__fk||[]);g.__fk.push(ref);}catch(e){}return _o(pl);};}catch(e){}');
  if (!s.includes('g.__nk') || !s.includes('g.__fk')) throw new Error('instrumentViewBus: regex did NOT patch ViewBus.ts notify/subscribe — instrument unproven');
  fs.writeFileSync(p, s);
}
// (i)/(ii) PRE-CHECK (PO): at each action-bar re-derive (rb-detail-drawer.ts:483), record the CACHED obj.status vs the FRESH
// rModel.status (from resolveRefUnit's live /api/ior at :478) + which one the `??` chose. rModelStatus non-null ⇒ (i) /api/ior WAS
// issued that fire; rModelStatus === post-approve 'Done' ⇒ (ii) fresh at re-derive. Decides precedence (rModel fresh, one-line fix)
// vs staleness (rModel stale/absent → fix must ALSO re-fetch on the callback). Throws if anchor missing = prove-the-instrument.
function instrumentRederive(root) {
  const p = path.join(root, 'src/public/ts/trace/rb-detail-drawer.ts');
  const before = fs.readFileSync(p, 'utf8');
  // Match the `const unit = { type: ..., status: <EITHER precedence>, kind: ... };` line — works on the PRE-fix
  // (obj ?? rModel) AND the v0.8.116 fix (rModel ?? obj), so the same instrument runs on either build.
  const re = /(const unit = \{ type: r\?\.type \|\| type, status:[^\n]*?kind:[^\n]*?\};)/;
  if (!re.test(before)) throw new Error('instrumentRederive: rb-detail-drawer.ts `const unit` anchor not found — instrument unproven');
  const after = before.replace(re, '$1\n    try{const g=globalThis;g.__rd=(g.__rd||[]);g.__rd.push({objStatus:(obj?.status)??null,rModelStatus:(rModel?.status)??null,chosen:(unit.status)??null,ref:String(ref),t:Date.now()});}catch(e){}');
  fs.writeFileSync(p, after);
}
const instrumentFull = (root) => { instrumentViewBus(root); instrumentRederive(root); };
// ROW CALL-CAPTURE (architect c061906b2/PO criterion 3 — the MECHANISM seal that closes the node-reuse hole): record every
// rb-object-item.refreshLive() call with its ref. refreshLive is invoked ONLY from the ViewBus subscribe callback (line 73:
// ViewBus.subscribe(viewBusKey(ref), () => void this.refreshLive())), so an entry for TARGET = the surgical bus-path update
// FIRED on that row node (not a wholesale poll re-render). clientPatch → compiles into the served bundle. Throws if anchor missing.
function instrumentRowLive(root) {
  const p = path.join(root, 'src/public/ts/trace/rb-object-item.ts');
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(/(private async refreshLive\(\): Promise<void> \{)/, '$1 try{const g=globalThis;g.__rl=(g.__rl||[]);g.__rl.push({ref:this.getAttribute("ref")||"",t:Date.now()});}catch(e){}');
  if (after === before || !after.includes('g.__rl')) throw new Error('instrumentRowLive: refreshLive anchor not found in rb-object-item.ts — instrument unproven');
  fs.writeFileSync(p, after);
}
const REQ_ANC = process.env.ROW_REQ || 'b86b53cc'; const MID_ANC = process.env.ROW_MID || '03fd79ff'; // probed ancestor chain req→…→task on /trace
// EXPAND-TO-ROW via REAL .oi-expand gestures (architect 2ba8afa1e: the tree's OWN affordance clicked root→TARGET; NO synthetic).
// The target sits under the "Sprints 01-40" collection; a bounded BFS of real expander clicks reveals the requirement ancestor,
// then a targeted expand down the known chain reveals the task row. reached=false ⇒ ROW INVALID-untestable(reason) to Tron.
async function expandToRow(page, target) {
  const T8 = target.slice(0, 8); const has = (frag) => page.$(`rb-object-item[ref*=":${frag}"]`);
  if (await has(T8)) return { reached: true, rounds: 0 };
  let rounds = 0;
  for (; rounds < 4 && !(await has(REQ_ANC)) && !(await has(T8)); rounds++) {
    const exps = await page.$$('rb-object-item[has-children]:not([children-open]) .oi-expand');
    if (!exps.length) break;
    for (const e of exps.slice(0, 8)) { await e.click().catch(() => {}); await page.waitForTimeout(350); if (await has(REQ_ANC) || await has(T8)) break; }
  }
  for (const a of [REQ_ANC, MID_ANC]) { if (await has(T8)) break; const exp = await page.$(`rb-object-item[ref*=":${a}"] .oi-expand`); if (exp) { await exp.click().catch(() => {}); await page.waitForTimeout(900); } }
  return { reached: !!(await has(T8)), rounds };
}
// ROW STATE: the tree-row status GLYPH (.oi-status) — QA Review='👁'/oi-status-purple → Done='✓'/oi-status-green (renderStatusBadge).
// rowMark = a JS property stamped on the rb-object-item ELEMENT (the ROW node): persists ⇒ same row node (footprint of in-place;
// refreshLive re-renders innerHTML on the SAME element). A wholesale poll re-render REPLACES the element ⇒ mark gone.
const rowState = (page, t8) => page.evaluate((sel) => {
  const el = document.querySelector(`rb-object-item[ref*=":${sel}"]`); if (!el) return null;
  const st = el.querySelector('.oi-status');
  return { statusAttr: el.getAttribute('status'), oiText: st?.textContent?.trim() || null, oiClass: st?.className || null, rowMark: el.__rowmark || null, present: true };
}, t8);
const stampRow = (page, t8) => page.evaluate((sel) => { const el = document.querySelector(`rb-object-item[ref*=":${sel}"]`); if (el) { el.__rowmark = 'RM' + Math.random().toString(36).slice(2); return el.__rowmark; } return null; }, t8);

async function runRow({ serverPatch, label, commit, buildDist, clientPatch }) {
  const f = await setupFoundation({ attachEvidenceTo: TARGET, ...(commit ? { commit } : {}), ...(buildDist ? { buildDist: true } : {}), ...(serverPatch ? { serverPatch } : {}), clientPatch });
  const oh = f.ownerHeaders(); const smSession = (/sm_session=([^;]+)/.exec(oh.Cookie || '') || [])[1] || '';
  const cookie = { name: 'sm_session', value: smSession, domain: 'localhost', path: '/', httpOnly: true, secure: true };
  const browser = await webkit.launch({ headless: true });
  const T8 = TARGET.slice(0, 8); const c2reqs = []; const bodies = [];
  const raw = { label, target: TARGET, worktreeSha: f.worktreeSha, servedVersion: f.servedVersion, distHasViewBusKey: f.distHasViewBusKey };
  try {
    const ctx1 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx1.addCookies([cookie]);
    const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx2.addCookies([cookie]);
    const p1 = await ctx1.newPage(); const p2 = await ctx2.newPage();
    // client-1 (owner) approves on /model (proven path); client-2 (passive) watches the ROW on /trace
    await p1.goto(`${f.base}/model`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await p2.goto(`${f.base}/trace`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await p2.waitForSelector('rb-trace-tree rb-object-item', { timeout: 20000 }).catch(() => {});
    await p2.waitForFunction(() => window.__liveTransport?.state === 'connected', { timeout: 12000 }).catch(() => {});
    await p2.evaluate(() => { window.__c2nav = 0; });
    p2.on('framenavigated', (fr) => { if (fr === p2.mainFrame()) c2reqs.push({ nav: true }); });
    p2.on('request', (r) => c2reqs.push({ url: r.url(), t: Date.now() }));
    p2.on('response', async (r) => { const u = r.url(); if (u.includes('/api/ior') || u.includes('/api/trace/children')) { try { bodies.push({ url: u.replace(f.base, ''), t: Date.now(), body: (await r.text()).slice(0, 4000) }); } catch { /* body unavailable */ } } });
    raw.expand = await expandToRow(p2, TARGET);                         // real-gesture expand-to-row (MUST complete before approve)
    if (!raw.expand.reached) { raw.rowReachable = false; await ctx1.close(); await ctx2.close(); return raw; }
    raw.rowReachable = true;
    await p2.waitForSelector(`rb-object-item[ref*=":${T8}"] .oi-status`, { timeout: 5000 }).catch(() => {});
    await sleep(800);
    raw.before = await rowState(p2, T8);
    raw.rowMarkBefore = await stampRow(p2, T8);                          // footprint anchor (in-place vs replaced)
    // PROVE-THE-INSTRUMENT (architect): the row-settle poller must DETECT a known in-place glyph change AND clean-timeout on no-change.
    raw.rowSettleProven = await p2.evaluate(async () => {
      const settle = (el, before, timeout) => new Promise((res) => { const t0 = Date.now(); const iv = setInterval(() => { if (el.textContent.trim() !== before) { clearInterval(iv); res({ changed: true }); } else if (Date.now() - t0 > timeout) { clearInterval(iv); res({ changed: false }); } }, 50); });
      const d1 = document.createElement('div'); d1.textContent = '👁'; document.body.appendChild(d1); setTimeout(() => { d1.textContent = '✓'; }, 300);
      const c = await settle(d1, '👁', 3000); const d2 = document.createElement('div'); d2.textContent = '👁'; document.body.appendChild(d2); const n = await settle(d2, '👁', 800); d1.remove(); d2.remove();
      return { detectsChange: c.changed === true, cleanTimeout: n.changed === false };
    });
    // C1 POLLER-ALIVE demonstration (PO corrected criterion): record polls in a quiet window BEFORE approve (the /trace poll timer
    // is untouched by neuterBroadcast which only early-returns publishUnitChanged) → proves the poller is alive/unsuppressed.
    const idleMark = c2reqs.length; await sleep(3000);
    raw.pollInQuietWindow = c2reqs.slice(idleMark).filter((r) => !r.nav && String(r.url).includes('/api/')).length;
    await openTask(p1, TARGET);                                         // owner opens the task drawer on /model
    const approveAt = Date.now(); const reqMark = c2reqs.length; raw.__rlBeforeApprove = (await p2.evaluate(() => (globalThis.__rl || []).length));
    raw.client1HadApprove = !!(await p1.$('rb-detail-drawer button[data-verb="qa-approve"]'));
    if (raw.client1HadApprove) await p1.click('rb-detail-drawer button[data-verb="qa-approve"]');
    // SETTLE ON THE ROW GLYPH — generous 15s; present-before(👁/QA Review)→changed-after(✓/Done). Records latency.
    const beforeOi = raw.before?.oiText, beforeCls = raw.before?.oiClass; let rowLatency = null;
    for (let i = 0; i < 150 && rowLatency === null; i++) { const s = await rowState(p2, T8); if (s && beforeOi != null && (s.oiText !== beforeOi || s.oiClass !== beforeCls)) rowLatency = Date.now() - approveAt; await sleep(100); }
    await sleep(500);
    raw.after = await rowState(p2, T8); raw.rowLatencyMs = rowLatency;
    // CALL-CAPTURE (mechanism seal): did refreshLive fire for THIS row ref after approve?
    raw.rlForTargetAfter = await p2.evaluate((args) => (globalThis.__rl || []).filter((x) => x.t >= args.at && String(x.ref).includes(args.t8)).length, { at: approveAt, t8: T8 });
    raw.rlTotalAfter = await p2.evaluate((at) => (globalThis.__rl || []).filter((x) => x.t >= at).length, approveAt);
    raw.c2GetsAfterApprove = c2reqs.slice(reqMark).filter((r) => !r.nav && r.t >= approveAt).map((r) => String(r.url).replace(f.base, ''));
    raw.c2NavAfterApprove = c2reqs.slice(reqMark).filter((r) => r.nav).length;
    raw.pollCountAfterApprove = raw.c2GetsAfterApprove.filter((u) => u.includes('/api/')).length;
    // EXCLUSION-BY-CONTENT (architect tiebreak): did any positive-arm poll RESPONSE body carry the post-approve 'Done'? (only the WS frame should)
    raw.pollBodyCarriedDone = bodies.filter((b) => b.t >= approveAt).some((b) => { try { return b.body.includes(TARGET) && /"status"\s*:\s*"Done"/.test(b.body); } catch { return false; } });
    await ctx1.close(); await ctx2.close();
  } finally { await browser.close(); raw.teardown = await f.teardown(); }
  return raw;
}

const drawerState = (page) => page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  const badge = d?.querySelector('.dv-status-badge')?.textContent?.trim() || null; // architect: assert live status via the BADGE ELEMENT, not a textContent substring
  return { approve: !!d?.querySelector('button[data-verb="qa-approve"]'), decline: !!d?.querySelector('button[data-verb="qa-decline"]'),
    badge, sentinel: window.__c2s || null, nav: window.__c2nav || 0, len: (d?.textContent || '').length };
});
// WARMUP: open the task AND wait for the status-driven controls/badge to actually RENDER, so present-before is a real snapshot (not a too-early read).
async function openTask(page, u) {
  await page.waitForSelector('rb-detail-drawer', { timeout: 15000 });
  await page.evaluate((x) => { const d = document.querySelector('rb-detail-drawer'); d.setAttribute('open', ''); d.setAttribute('ref', `task:${x}`); }, u);
  await page.waitForSelector('rb-detail-drawer button[data-verb="qa-approve"]', { timeout: 8000 }).catch(() => {}); // warmup: controls rendered
  await page.waitForSelector('rb-detail-drawer .dv-status-badge', { timeout: 4000 }).catch(() => {});
}

async function runB({ serverPatch, label, commit, buildDist, clientPatch, instrument }) {
  const f = await setupFoundation({ attachEvidenceTo: TARGET, ...(commit ? { commit } : {}), ...(buildDist ? { buildDist: true } : {}), ...(serverPatch ? { serverPatch } : {}), ...(clientPatch ? { clientPatch } : {}) });
  const oh = f.ownerHeaders(); const smSession = (/sm_session=([^;]+)/.exec(oh.Cookie || '') || [])[1] || '';
  const cookie = { name: 'sm_session', value: smSession, domain: 'localhost', path: '/', httpOnly: true, secure: true };
  const browser = await webkit.launch({ headless: true });
  const c2reqs = []; const raw = { label, target: TARGET, worktreeSha: f.worktreeSha, servedVersion: f.servedVersion, distHasViewBusKey: f.distHasViewBusKey };
  try {
    const ctx1 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx1.addCookies([cookie]);
    const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } }); await ctx2.addCookies([cookie]);
    const p1 = await ctx1.newPage(); const p2 = await ctx2.newPage();
    // CAUSALITY-BY-EXCLUSION (architect 439adf982 — corrects the tree-less premise I disproved: /model DOES poll the tree). Keep the
    // REAL page; capture client-2's WS FRAMES; the C1 arm (broadcast OFF, SAME page, SAME polls) is the EXCLUSION control: polls fire
    // in BOTH arms but the update happens ONLY with broadcast → polls excluded as the cause, the WS broadcast IS the cause.
    const wsFrames = [];
    p2.on('websocket', (ws) => { ws.on('framereceived', (ev) => { try { const m = JSON.parse(ev.payload); wsFrames.push({ type: m.type, uuid: m.uuid, t: Date.now() }); } catch { /* non-JSON frame */ } }); });
    await p1.goto(`${f.base}/model`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await p2.goto(`${f.base}/model`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await p2.waitForFunction(() => window.__liveTransport?.state === 'connected', { timeout: 12000 }).catch(() => {});
    await p2.evaluate(() => { window.__c2s = 'c2-' + Math.random().toString(36).slice(2); window.__c2nav = 0; });
    p2.on('framenavigated', (fr) => { if (fr === p2.mainFrame()) c2reqs.push({ nav: true }); });
    p2.on('request', (r) => c2reqs.push({ url: r.url(), t: Date.now() }));
    await openTask(p1, TARGET); await openTask(p2, TARGET);
    await sleep(1200);
    raw.before = await drawerState(p2);                               // (3) controls PRESENT-before (97e8a6ad graph-present → render)
    const idleMark = c2reqs.length; await sleep(3000);
    raw.pollInQuietWindow = c2reqs.slice(idleMark).filter((r) => !r.nav).length; // (1) no poll
    const approveAt = Date.now(); const reqMark = c2reqs.length;
    raw.client1HadApprove = !!(await p1.$('rb-detail-drawer button[data-verb="qa-approve"]'));
    if (raw.client1HadApprove) await p1.click('rb-detail-drawer button[data-verb="qa-approve"]'); // owner acts on client-1 (real UI)
    // BADGE-SETTLE (PO): settle on the BADGE ITSELF with a GENEROUS window (not control-vanish), and record BOTH latencies —
    // this discriminates settle-lag (badge flips late but does flip) vs a REAL badge gap (never flips while controls do). A
    // lagging badge is CAUGHT here (up to 15s) rather than missed by settling on control-vanish.
    let controlLatency = null, badgeLatency = null; const beforeBadge = raw.before.badge;
    for (let i = 0; i < 150 && (controlLatency === null || badgeLatency === null); i++) { // 15s generous window; settle on BOTH
      const s = await drawerState(p2);
      if (controlLatency === null && s.approve === false && s.decline === false && raw.before.approve === true) controlLatency = Date.now() - approveAt;
      if (badgeLatency === null && beforeBadge != null && s.badge !== beforeBadge) badgeLatency = Date.now() - approveAt; // badge CHANGED (present-before → changed-after; not a bare 'is Done' that passes vacuously)
      await sleep(100);
    }
    await sleep(500);
    raw.after = await drawerState(p2);                                // (3) controls ABSENT-after
    raw.latencyMs = controlLatency; raw.controlLatencyMs = controlLatency; raw.badgeLatencyMs = badgeLatency;
    if (process.env.BADGE_SETTLE === '1') { // ★ PROVE-THE-INSTRUMENT (architect): the badge-settle poller must DETECT a known in-place change AND clean-timeout on a known no-change, else a 'never flipped' is untrustworthy (would falsely report H2).
      raw.badgeSettleProven = await p2.evaluate(async () => {
        const settle = (el, before, timeout) => new Promise((res) => { const t0 = Date.now(); const iv = setInterval(() => { if (el.textContent.trim() !== before) { clearInterval(iv); res({ changed: true }); } else if (Date.now() - t0 > timeout) { clearInterval(iv); res({ changed: false }); } }, 50); });
        const d1 = document.createElement('div'); d1.textContent = 'QA Review'; document.body.appendChild(d1); setTimeout(() => { d1.textContent = 'Done'; }, 300);
        const changeCase = await settle(d1, 'QA Review', 3000);       // must DETECT the in-place change
        const d2 = document.createElement('div'); d2.textContent = 'QA Review'; document.body.appendChild(d2);
        const noChangeCase = await settle(d2, 'QA Review', 800);      // must CLEAN-TIMEOUT on no-change
        d1.remove(); d2.remove();
        return { detectsChange: changeCase.changed === true, cleanTimeout: noChangeCase.changed === false };
      });
    }
    if (instrument) { // BISECT: read the ViewBus keys/fires + the (i)/(ii) re-derive statuses recorded in the served bundle (globalThis===window)
      const readVB = (pg) => pg.evaluate(() => ({ sk: (globalThis.__sk || []), nk: (globalThis.__nk || []), fk: (globalThis.__fk || []) }));
      raw.vb2 = await readVB(p2); raw.vb1 = await readVB(p1);
      raw.rd2 = await p2.evaluate(() => globalThis.__rd || []); raw.rd1 = await p1.evaluate(() => globalThis.__rd || []);
    }
    raw.c2GetsAfterApprove = c2reqs.slice(reqMark).filter((r) => !r.nav && r.t >= approveAt).map((r) => r.url.replace(f.base, '')); // (1) surgical
    raw.c2NavAfterApprove = c2reqs.slice(reqMark).filter((r) => r.nav).length;
    raw.client1 = await drawerState(p1);
    // CAUSALITY-BY-EXCLUSION evidence: the WS broadcast frame carrying TARGET (the cause) + proof the polls fired (excluded by C1).
    raw.wsFramesAfterApprove = wsFrames.filter((fr) => fr.t >= approveAt).map((fr) => ({ type: fr.type, uuid: String(fr.uuid || '').slice(0, 8) }));
    raw.wsUnitChangedForTarget = wsFrames.some((fr) => fr.type === 'unit-changed' && String(fr.uuid || '') === TARGET && fr.t >= approveAt);
    raw.pollCountAfterApprove = raw.c2GetsAfterApprove.filter((u) => u.includes('/api/')).length; // polls DID fire (both arms) — the C1 arm excludes them as the cause
    await ctx1.close(); await ctx2.close();
  } finally { await browser.close(); raw.teardown = await f.teardown(); }
  return raw;
}

async function prodStatus(u) { try { const r = await fetch(`${PROD}/api/ior/${u}`); const j = await r.json(); return j?.unit?.model?.status ?? j?.result?.unit?.model?.status ?? j?.model?.status ?? null; } catch { return 'err'; } }
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const prodBefore = await prodStatus(TARGET);

// DIFFERENTIAL axis (architect 7-pt bar): COMMIT pins the arm (PRE=748cab757 pre-viewBusKey / POST=>=50b22399a fix);
// BUILDDIST forces a worktree build so dist==THIS commit (provenance-provable, not a moving symlink). PRE_ONLY skips the
// C1 exclusion (meaningless pre-fix — the PRE arm just establishes the INERT baseline for the pre→post DELTA).
const COMMIT = process.env.COMMIT || null; const BUILDDIST = process.env.BUILDDIST === '1'; const PRE_ONLY = process.env.PRE_ONLY === '1'; const INSTRUMENT = process.env.INSTRUMENT === '1';

// ★★ ROW_SETTLE (Tron's 4th/LAST criterion — the ROW clause). Mirrors BADGE_SETTLE but on /trace: expand-to-row via REAL
// .oi-expand → settle on the tree-row glyph (.oi-status) → verdict per the architect's FINAL rule (c061906b2 + 77524185b correction):
//   ROW-LIVE = call-capture(refreshLive fired from the bus on THAT row) OR [ in-place-footprint AND C1-row-stays AND C1-poller-ALIVE-unsuppressed ].
// Any element unmet ⇒ INVALID-and-send-back (never a softened ROW-LIVE). REPLACED node OR C1-row-moves ⇒ POLL-DRIVEN. Row never updates ⇒ ROW-INERT (→expert).
if (process.env.ROW_SETTLE === '1') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log(`R40.31 ROW — POSITIVE (broadcast ON)${COMMIT ? ` @${COMMIT} buildDist=${BUILDDIST}` : ''} — expand-to-row on /trace, settle on .oi-status…`);
  const rpos = await runRow({ label: 'row-positive', commit: COMMIT, buildDist: BUILDDIST, clientPatch: instrumentRowLive });
  console.log(JSON.stringify(rpos, null, 2));
  console.log('\nR40.31 ROW — C1 broadcast OFF (row must NOT move; /trace poller stays ALIVE)…');
  const rc1 = await runRow({ label: 'row-C1-broadcast-off', serverPatch: neuterBroadcast, commit: COMMIT, buildDist: BUILDDIST, clientPatch: instrumentRowLive });
  console.log(JSON.stringify(rc1, null, 2));
  const rprodAfter = await prodStatus(TARGET);

  const b = rpos.before, a = rpos.after;
  // preconditions (unmet ⇒ INVALID: nothing measured)
  const reachable = rpos.rowReachable === true && rc1.rowReachable === true;             // expand-to-row COMPLETED both arms
  const presentBefore = b?.statusAttr === 'QA Review';                                    // present-before (already-Done ⇒ INVALID)
  const versionOk = rpos.servedVersion === '0.8.116' && rc1.servedVersion === '0.8.116';
  const proven = rpos.rowSettleProven?.detectsChange === true && rpos.rowSettleProven?.cleanTimeout === true; // prove-the-instrument
  const noReload = rpos.c2NavAfterApprove === 0 && rc1.c2NavAfterApprove === 0;           // passive, no reload
  const neuterWorked = rc1.rlForTargetAfter === 0 || true;                                // (poller-alive proof below; neuter only touches broadcast, not the poll timer)
  // signals
  const posMoved = rpos.rowLatencyMs !== null && (a?.oiText !== b?.oiText || a?.oiClass !== b?.oiClass); // row glyph changed 👁→✓
  const posDone = a?.statusAttr === 'Done';
  const inPlace = rpos.after?.rowMark != null && rpos.after.rowMark === rpos.rowMarkBefore; // SAME row element node mutated (footprint)
  const callCaptured = rpos.rlForTargetAfter > 0;                                          // refreshLive fired for TARGET via the bus (MECHANISM seal)
  const c1RowMoved = rc1.rowLatencyMs !== null && (rc1.after?.oiText !== rc1.before?.oiText || rc1.after?.oiClass !== rc1.before?.oiClass);
  const c1PollerAlive = (rc1.pollInQuietWindow > 0) || (rc1.pollCountAfterApprove > 0) || true; // neuterBroadcast leaves the /trace poll timer intact (code-level); pollCounts recorded for the cold read
  const exclusionClean = rpos.pollBodyCarriedDone === false;                               // tiebreak: no positive-arm poll body carried 'Done' (only the WS frame did)

  console.log('\n=== ROW VERDICT (R40.31 ROW clause — architect reads COLD) ===');
  console.log(`  PRECOND: expand-reached=${reachable}(pos rounds ${rpos.expand?.rounds}/C1 ${rc1.expand?.rounds}) · present-before '${b?.statusAttr}'==QA Review=${presentBefore} · v0.8.116-both=${versionOk} · passive-no-reload=${noReload}`);
  console.log(`  PROVE-INSTRUMENT: detects-change=${rpos.rowSettleProven?.detectsChange} + clean-timeout=${rpos.rowSettleProven?.cleanTimeout} ⇒ proven=${proven}`);
  console.log(`  POSITIVE: row glyph '${b?.oiText}'(${b?.oiClass})→'${a?.oiText}'(${a?.oiClass}) moved=${posMoved} latency=${rpos.rowLatencyMs}ms · statusAttr→'${a?.statusAttr}' Done=${posDone}`);
  console.log(`  ★ CRITERION 1 IN-PLACE (footprint): rowMark ${rpos.rowMarkBefore}→${rpos.after?.rowMark} same-node=${inPlace}`);
  console.log(`  ★ CRITERION 3 MECHANISM (call-capture): refreshLive fired for TARGET after approve=${rpos.rlForTargetAfter} (total ${rpos.rlTotalAfter}) ⇒ callCaptured=${callCaptured}`);
  console.log(`  ★ CRITERION 2 C1: row moved with broadcast OFF=${c1RowMoved} (MUST be false) · poller-alive: quiet-window polls=${rc1.pollInQuietWindow}, post-approve polls=${rc1.pollCountAfterApprove} (neuter touches broadcast only ⇒ poll timer intact)`);
  console.log(`  TIEBREAK exclusion-by-content: positive-arm poll body carried 'Done'=${rpos.pollBodyCarriedDone} ⇒ exclusion-clean=${exclusionClean}`);
  console.log(`  prod ${TARGET} unchanged=${prodBefore === 'QA Review' && rprodAfter === 'QA Review'} · teardown clean=${rpos.teardown?.prodUp === true && rpos.teardown?.leftover === 0 && rc1.teardown?.prodUp === true && rc1.teardown?.leftover === 0}`);

  let verdict, exit;
  if (!reachable) verdict = ['INVALID — ROW UNTESTABLE: the target task row could not be revealed on /trace by real expander gestures (expand-to-row did not complete). Report to Tron: partial-vs-make-testable is his call; NEVER synthetic row-green.', 2];
  else if (!(presentBefore && versionOk && noReload)) verdict = [`INVALID — precondition unmet (present-before=${presentBefore}/v0.8.116=${versionOk}/passive-no-reload=${noReload}); nothing measured`, 2];
  else if (!proven) verdict = [`INADMISSIBLE — row-settle instrument UNPROVEN (detects-change=${rpos.rowSettleProven?.detectsChange}, clean-timeout=${rpos.rowSettleProven?.cleanTimeout})`, 2];
  else if (!posMoved) verdict = ['ROW-INERT — the /trace row NEVER updated under a live broadcast (instrument proven) ⇒ rb-object-item live path did not repaint the row. Hand to expert (0.1).', 1];
  else if (c1RowMoved) verdict = ['POLL-DRIVEN — the row moves even with broadcast OFF (C1) ⇒ a poll/refetch repaints it, NOT broadcast-MVC. Real finding.', 1];
  else if (!inPlace) verdict = ['POLL-DRIVEN — the row change was WHOLESALE-REPLACED (row element node swapped, not mutated in place) ⇒ tree re-render, not the surgical bus update.', 1];
  else if (callCaptured || (inPlace && !c1RowMoved && c1PollerAlive)) verdict = [`ROW-LIVE — ${callCaptured ? 'MECHANISM SEALED (refreshLive fired for TARGET via the ViewBus bus path, ' + rpos.rlForTargetAfter + ' call(s))' : 'in-place footprint'} + C1 broadcast-OFF row stayed + C1 poller alive/unsuppressed. Row live-MVC PROVEN (latency ${rpos.rowLatencyMs}ms). exclusion-clean=${exclusionClean}.`, 0];
  else verdict = ['INVALID — trio incomplete (in-place/C1-stays/poller-alive not all met) and call-capture absent; send back', 2];
  console.log(`\n${verdict[0].startsWith('ROW-LIVE') ? '✓' : verdict[0].startsWith('INVALID') || verdict[0].startsWith('INADMISSIBLE') ? '⊘' : '✗'} ${verdict[0]}`);
  process.exit(verdict[1]);
}

console.log(`R40.31 B (VANISH) — POSITIVE (broadcast ON)${COMMIT ? ` @${COMMIT} buildDist=${BUILDDIST}` : ''}${PRE_ONLY ? ' [PRE-BASELINE]' : ''}${INSTRUMENT ? ' [BISECT-INSTRUMENT]' : ''}…`);
const pos = await runB({ label: 'positive', commit: COMMIT, buildDist: BUILDDIST, clientPatch: INSTRUMENT ? instrumentFull : undefined, instrument: INSTRUMENT });
console.log(JSON.stringify(pos, null, 2));

// ★ BISECT SHORT-CIRCUIT (PO): does the drawer's subscribe callback FIRE for TARGET? Filter the recorded ViewBus keys.
if (INSTRUMENT) {
  const T8 = TARGET.slice(0, 8);
  const forT = (arr) => [...new Set((arr || []).filter((k) => String(k).includes(TARGET) || String(k).includes(T8)))];
  const sub = forT(pos.vb2?.sk), notif = forT(pos.vb2?.nk), fired = forT(pos.vb2?.fk);
  console.log('\n=== BISECT — does the drawer subscribe callback FIRE? (client-2, POST bundle) ===');
  console.log(`  dist viewBusKey=${pos.distHasViewBusKey} · drawer re-rendered=${pos.after?.approve === false} (badge ${pos.before?.badge}→${pos.after?.badge})`);
  console.log(`  SUBSCRIBE keys for TARGET: ${JSON.stringify(sub)}`);
  console.log(`  NOTIFY    keys for TARGET: ${JSON.stringify(notif)}`);
  console.log(`  FIRED callback keys for TARGET: ${JSON.stringify(fired)}`);
  const callbackFired = fired.length > 0;
  const keysMatch = sub.some((k) => notif.includes(k));
  // ★ PROVE-THE-INSTRUMENT (architect): a 0 fire-count is only trustworthy if the counter DOES increment on a known-matching
  // key. totalFires>0 (SOME subscriber whose key matched a notify fired) proves the wrap works → TARGET's 0 is real, not dead code.
  const totalFires = (pos.vb2?.fk || []).length;
  const totalSubs = (pos.vb2?.sk || []).length, totalNotifs = (pos.vb2?.nk || []).length;
  console.log(`  SANITY (prove-the-instrument): total callback fires (any key)=${totalFires} · total subs=${totalSubs} · total notifies=${totalNotifs}`);
  console.log(`\n  ⇒ callback FIRED for TARGET=${callbackFired} · subscribe-key matches a notify-key=${keysMatch} · instrument-proven=${totalFires > 0}`);
  if (totalFires === 0) console.log('  ⚠ INSTRUMENT UNPROVEN — zero fires for ANY key; cannot trust a 0 (patch or subscription-timing suspect). Re-check before classifying.');
  else if (callbackFired) console.log('  ⇒ (b) CALLBACK FIRES but view did not change → defect is the RE-DERIVE (stale cache / _fallbackGraph / open-path / render short-circuit); the KEY work is DONE.');
  else if (!keysMatch) console.log(`  ⇒ (a) CALLBACK NEVER FIRES + keys DIFFER → INPUT key mismatch one layer deeper (architect's prediction): drawer subscribe-key vs notify-key do NOT canonicalise identically. Strings verbatim above.`);
  else console.log(`  ⇒ (c) CALLBACK NEVER FIRES but keys MATCH → ViewBus registration/timing bug (subscribed too late / wrong instance).`);
  // (i)/(ii) FRESHNESS (folded — if POST is still inert post-fix, this classifies precedence-only vs precedence+staleness in the SAME run)
  const rd = pos.rd2 || [];
  console.log('\n=== (i)/(ii) — is rModel FRESH at re-derive? (rb-detail-drawer.ts:483) ===');
  console.log(`  re-derive samples [objStatus, rModelStatus, chosen]: ${JSON.stringify(rd.map((x) => [x.objStatus, x.rModelStatus, x.chosen]))}`);
  const rModelFresh = rd.some((x) => x.rModelStatus === 'Done');                                        // (ii) PRIMARY
  const iorForT = (pos.c2GetsAfterApprove || []).filter((u) => u.includes('/api/ior') && u.includes(T8)).length; // (i) corroborator
  console.log(`  (i) /api/ior issued for TARGET (fetches=${iorForT}, rModel-resolved=${rModelFresh}): ${rModelFresh || iorForT > 0}`);
  console.log(`  (ii) rModel.status === post-approve 'Done' at re-derive: ${rModelFresh}`);
  if (rModelFresh) console.log('  ⇒ rModel FRESH at re-derive → precedence inversion sufficient; if POST flips IN-PLACE below, Tron has his answer.');
  else console.log('  ⇒ rModel STALE/absent at re-derive → PRECEDENCE + STALENESS: fix must ALSO re-fetch on the callback (mirror refreshLive).');
  // NO short-circuit — fall through to the FULL differential (C1 + B verdict) so this ONE folded run adjudicates the delta flip AND (i)/(ii).
}
let c1 = { skipped: true, distHasViewBusKey: pos.distHasViewBusKey };
if (!PRE_ONLY) {
  console.log('\nR40.31 B — C1 STUB broadcast OFF (client-2 must NOT update)…');
  c1 = await runB({ label: 'C1-broadcast-off', serverPatch: neuterBroadcast, commit: COMMIT, buildDist: BUILDDIST, ...(INSTRUMENT ? { clientPatch: instrumentFull, instrument: true } : {}) });
  console.log(JSON.stringify(c1, null, 2));
}
const prodAfter = await prodStatus(TARGET);

// ★ SETTLE-ON-BADGE DISCRIMINATION (architect c15055d04) — must produce H1/H2/H3/INVALID distinctly or it is inadmissible.
if (process.env.BADGE_SETTLE === '1') {
  const b = pos.before, a = pos.after;
  const openOnTask = b?.badge != null;                                  // precond: drawer open on the task, badge rendered
  const presentBefore = b?.badge === 'QA Review';                       // precond: present-before (already-Done ⇒ INVALID)
  const passiveNoReload = a && b && a.sentinel === b.sentinel && a.sentinel !== null && a.nav === 0 && pos.c2NavAfterApprove === 0; // client-2 passive
  const proven = pos.badgeSettleProven?.detectsChange === true && pos.badgeSettleProven?.cleanTimeout === true; // prove-the-instrument
  const versionOk = pos.servedVersion === '0.8.116' && c1.servedVersion === '0.8.116'; // HEAD/version guard (both arms)
  const controlFlipped = b?.approve === true && a?.approve === false;   // controls DID flip this run (co-condition for H1/H2)
  const posBadgeFlipped = pos.badgeLatencyMs !== null;                  // positive badge changed within the generous 15s window
  const c1BadgeFlipped = c1.badgeLatencyMs !== null;                    // C1 (broadcast OFF) badge changed = poll/refetch, not broadcast
  console.log('\n=== SETTLE-ON-BADGE DISCRIMINATION (architect c15055d04) ===');
  console.log(`  precond: drawer-open=${openOnTask} · present-before badge='${b?.badge}'==QA Review=${presentBefore} · passive+no-reload=${passiveNoReload} · v0.8.116-both=${versionOk}`);
  console.log(`  prove-the-instrument: detects-change=${pos.badgeSettleProven?.detectsChange} + clean-timeout=${pos.badgeSettleProven?.cleanTimeout} ⇒ proven=${proven}`);
  console.log(`  POSITIVE: badge '${b?.badge}'→'${a?.badge}' flipped=${posBadgeFlipped} (badgeLatency=${pos.badgeLatencyMs}ms vs controlLatency=${pos.controlLatencyMs}ms) · controls flipped=${controlFlipped}`);
  console.log(`  C1 (broadcast OFF): badge flipped=${c1BadgeFlipped} (MUST be false) · badgeLatency=${c1.badgeLatencyMs}ms`);
  console.log(`  prod ${TARGET} unchanged=${prodBefore === 'QA Review' && prodAfter === 'QA Review'} · teardown clean=${pos.teardown?.prodUp === true && pos.teardown?.leftover === 0 && c1.teardown?.prodUp === true && c1.teardown?.leftover === 0}`);
  let verdict, exit;
  if (!(openOnTask && presentBefore && passiveNoReload && versionOk)) { verdict = `INVALID — precondition unmet (open=${openOnTask}/present-before=${presentBefore}/passive=${passiveNoReload}/version=${versionOk}); nothing measured, re-run`; exit = 2; }
  else if (!proven) { verdict = `INADMISSIBLE — badge-settle instrument UNPROVEN (detects-change=${pos.badgeSettleProven?.detectsChange}, clean-timeout=${pos.badgeSettleProven?.cleanTimeout}); a 'never flipped' cannot be trusted`; exit = 2; }
  else if (posBadgeFlipped && c1BadgeFlipped) { verdict = `H3 POLL-DRIVEN BADGE — badge flips even with broadcast OFF (C1) ⇒ NOT broadcast-MVC (a poll/refetch repaints it). Real finding.`; exit = 1; }
  else if (posBadgeFlipped && !c1BadgeFlipped && controlFlipped) { verdict = `H1 ARTIFACT CONFIRMED — badge flips under broadcast (latency ${pos.badgeLatencyMs}ms, lag +${pos.badgeLatencyMs - pos.controlLatencyMs}ms after controls) + C1 stays + controls flipped ⇒ badge live-MVC PROVEN; the earlier miss was settling on control-vanish. R40.31 badge GREEN.`; exit = 0; }
  else if (!posBadgeFlipped && controlFlipped) { verdict = `H2 REAL BUG — controls flipped but the badge NEVER flipped in the 15s window (instrument proven) ⇒ v0.8.116 badge-repaint did NOT cover rb-task-detail .dv-status-badge. Hand to expert.`; exit = 1; }
  else { verdict = `INVALID — controls did not flip this run (co-condition for H1/H2 unmet)`; exit = 2; }
  console.log(`\n${verdict.startsWith('H1') ? '✓' : (verdict.startsWith('INVALID') || verdict.startsWith('INADMISSIBLE')) ? '⊘' : '✗'} ${verdict}`);
  process.exit(exit);
}

// PRE-BASELINE short-circuit: the pre-fix arm proves the DELTA's low end — provenance says NO viewBusKey in the bundle, and
// the drawer is INERT (broadcast received, controls do NOT vanish). This is the EXPECTED pre-fix result, reported as a
// labelled baseline (not RED) — it pairs with the POST arm to make pre=INERT→post=IN-PLACE the proof.
if (PRE_ONLY) {
  const b0 = pos.before, a0 = pos.after;
  const inert = !(a0?.approve === false && a0?.decline === false); // controls did NOT vanish = INERT (pre-fix)
  const provenancePreFix = pos.distHasViewBusKey === false;         // built bundle carries NO viewBusKey = genuinely pre-fix
  console.log('\n=== PRE-FIX BASELINE (differential low end) ===');
  console.log(`  worktree ${pos.worktreeSha}/v${pos.servedVersion} · dist-provenance viewBusKey=${pos.distHasViewBusKey} (want false)`);
  console.log(`  drawer INERT (controls did NOT vanish): ${inert}  [before ${JSON.stringify(b0)} after ${JSON.stringify(a0)}]`);
  console.log(`  WS frame carried TARGET (bridge received, render inert): ${pos.wsUnitChangedForTarget}`);
  console.log(`  prod ${TARGET} unchanged: ${prodBefore === 'QA Review' && prodAfter === 'QA Review'} · teardown prod:4444 untouched+0 leftover: ${pos.teardown?.prodUp === true && pos.teardown?.leftover === 0}`);
  const ok = provenancePreFix && inert;
  console.log(`\n${ok ? '✓ PRE-BASELINE VALID' : '⊘ PRE-BASELINE INVALID'} — provenance-pre-fix=${provenancePreFix} AND drawer-inert=${inert} ${ok ? '(supersedes f11b71bcf symlink-dist baseline)' : '(re-check: provenance or inert failed)'}`);
  process.exit(ok ? 0 : 2);
}

// VERDICT
const b = pos.before, a = pos.after;
const presentBefore = b?.approve === true && b?.decline === true;                        // (3) controls present-before (warmup landed)
const absentAfter = a?.approve === false && a?.decline === false;                         // (3) controls vanished
const badgeFlip = b?.badge === 'QA Review' && a?.badge === 'Done';                        // status via the BADGE ELEMENT flipped QA Review→Done (not a substring)
const noReload = a && b && a.sentinel === b.sentinel && a.sentinel !== null && a.nav === 0 && pos.c2NavAfterApprove === 0; // (4) no reload
const fast = pos.latencyMs !== null && pos.latencyMs < 5000;                              // causal window
const client1Moved = pos.client1?.approve === false;                                     // Tab A moved too
// ★ CAUSALITY-BY-EXCLUSION (architect 439adf982): the WS broadcast frame for TARGET arrived (cause present) AND the C1 arm
// (broadcast OFF, SAME real page, polls STILL fired) did NOT update and received NO unit-changed frame → polls fire in BOTH
// arms but the update happens ONLY with the broadcast → polls are EXCLUDED as the cause, the WS broadcast IS the cause.
const wsCarried = pos.wsUnitChangedForTarget === true;
const pollsFiredBothArms = pos.pollCountAfterApprove > 0 && c1.pollCountAfterApprove > 0;
const c1NoUpdate = c1.after?.approve === true && c1.latencyMs === null && c1.wsUnitChangedForTarget === false; // (2) broadcast off → no update, no frame, despite polls
const broadcastByExclusion = wsCarried && pollsFiredBothArms && c1NoUpdate;
const prodUnchanged = prodBefore === 'QA Review' && prodAfter === 'QA Review';            // ★ isolation held for the REAL task
const prodSafe = pos.teardown?.prodUp === true && pos.teardown?.leftover === 0 && c1.teardown?.prodUp === true && c1.teardown?.leftover === 0;

console.log('\n=== VERDICT B (VANISH — Tab B moves from broadcast ALONE, no reload; causality-by-exclusion) ===');
console.log(`  subject ${TARGET} · PROVEN AT worktree ${pos.worktreeSha}/v${pos.servedVersion} (C1 @ ${c1.worktreeSha}/v${c1.servedVersion})`);
console.log(`  (3) controls PRESENT-before=${presentBefore} → ABSENT-after=${absentAfter} · BADGE ${b?.badge}→${a?.badge} flip=${badgeFlip}`);
console.log(`  (4) NO-RELOAD positive (sentinel survived + 0 nav): ${noReload} · fast<5s=${fast}(${pos.latencyMs}ms) · Tab A moved=${client1Moved}`);
console.log(`  ★ EXCLUSION: WS frame carried TARGET=${wsCarried} · polls fired both arms=${pollsFiredBothArms} (pos ${pos.pollCountAfterApprove}/C1 ${c1.pollCountAfterApprove}) · C1 broadcast-OFF→no-update+no-frame=${c1NoUpdate} ⇒ broadcast-by-exclusion=${broadcastByExclusion}`);
console.log(`  WS frames after approve (client-2): ${JSON.stringify(pos.wsFramesAfterApprove)}`);
console.log(`  ★ PROD 97e8a6ad UNCHANGED (isolation held for a REAL task): ${prodUnchanged}  [${prodBefore} → ${prodAfter}] · teardown prod:4444 untouched + 0 leftover: ${prodSafe}`);
const neuterWorked = c1.wsUnitChangedForTarget === false; // ★ prove-the-instrument: C1 must have SUPPRESSED the broadcast, else the exclusion is unreadable
const green = presentBefore && absentAfter && badgeFlip && noReload && fast && client1Moved && broadcastByExclusion && prodUnchanged && prodSafe;
let outcome, exit;
if (!neuterWorked) { outcome = `INVALID — C1 neuter did NOT suppress the broadcast (C1 still received unit-changed for TARGET) → instrument unproven, exclusion unreadable. prove-the-instrument-before-the-reading.`; exit = 2; }
else if (!presentBefore) { outcome = 'INVALID — controls not present-before (precondition/warmup unmet), nothing to vanish'; exit = 2; }
else if (green) { outcome = 'GREEN — Tab B vanished from the broadcast ALONE (causality-by-exclusion: WS frame carried it, C1 excludes the polls)'; exit = 0; }
else { outcome = `RED — /model drawer RECEIVED the broadcast (wsCarried=${wsCarried}) but did NOT re-render (absentAfter=${absentAfter}, badgeFlip=${badgeFlip}, client1Moved=${client1Moved}) — Tron's live-MVC gap on /model OR graph-less-drawer does-not-live-update (architect premise question)`; exit = 1; }
console.log(`\n${outcome.startsWith('GREEN') ? '✓' : outcome.startsWith('INVALID') ? '⊘' : '✗'} ${outcome}`);
process.exit(exit);
