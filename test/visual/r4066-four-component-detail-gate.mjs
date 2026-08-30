// PHASE-A 4-COMPONENT DETAIL GATE (PO deadlock-break ruling) — the FAMILY = detail-elements-that-render-a-scenario-unit-
// instance (RbDetailBase escapees). R37.26 migrates all 4 onto RbDetailBase (the ONE render funnel + one-model-source +
// fail-LOUD renderUnresolved). This gate BLOCKS the Phase-A land: GREEN fires the pre-authorized land, RED = HOLD.
// ★ DELTA-2 BINDING: report each of the 4 INDIVIDUALLY. ALL-4-OR-HOLD — ANY fail = HOLD (expert fixes renderDetail), NOT a
//   partial land, NOT a DETAIL_ARTIFACTS exemption (revoked). Do NOT shade toward green; a RED is a valid deliverable.
// MEASURED MIGRATION INVARIANT (architect ruling; STATED==IMPLEMENTED — the code below asserts exactly this, no proxy):
//   (1) RENDERS REAL RESOLVED UNIT DATA: mount a REAL committed-index uuid → screenshot+PIXEL painted (region not blank,
//       never a DOM element-count) + the resolved model's real name appears + not '⚠ unresolved' / bare-uuid / raw-JSON.
//   (2) BASE FAIL-LOUD: mount a BOGUS uuid → the element renders the BASE's '⚠ unresolved' (RbDetailBase.renderUnresolved,
//       rb-detail-base:83) — an own-funnel/unmigrated component renders its OWN 'not found' → fails this = the clean
//       migration discriminator (positive control that the base funnel ran).
//   (C) META-BITE (stub-must-fail): stub a component's renderUnresolved to emit an OWN fail-string on a bogus ref → the
//       base-fail-loud assertion MUST go RED → proves the gate catches an escapee that self-handles the fail path.
//   RETIRED (measured NON-discriminators, asserted NOWHERE): shown-event (3 dispatch sites incl the drawer → fires regardless
//   of the base) and type-specific dv-* funnel classes (dv-head/dv-field/dv-rel — decoration, varies per component).
// SURFACE PRE-CHECK (right-server only, NOT proof of migration): served trace-page bundle == the migration build (from the page).
// BASE: GATE_BASE env = the expert's R40.31 scratch URL (the acceptance surface). Absent → spin my own buildDist scratch
//   (validates the harness + captures the RED-baseline on my HEAD, where feature/modelelement may still be escapees).
// Scratch-only; a bogus/synthetic ref can MINT on the server it hits (BUG18/r4010) → NEVER prod (gate refuses a :4444 base).
import { webkit } from '@playwright/test';
import fs from 'node:fs';
import WebSocket from 'ws';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test((s || '').trim());
const BOGUS = '00000000-dead-4000-8000-000000000000'; // resolves to nothing → fail-loud (a bare uuid 404 is a READ, no mint)

// MEASURED (regcheck): rb-file/webitem-detail register on /trace; rb-feature-detail registers only via /feature-manager,
// rb-modelelement-detail only via /model (import sites feature-manager.ts:9 / model.ts:12). The shared-funnel signature is
// PAGE-INDEPENDENT (the base funnel resolves /api/ior + fires shown-event wherever the element is registered) → gate each
// on the page where it is REGISTERED. Mounting an UNregistered tag = inert element = a gate artifact (not a migration bug).
const COMPONENTS = [
  { tag: 'rb-file-detail',         uuid: '9bca3ed8-bdbb-470f-8bca-8f40cc5ead7e', type: 'File',         page: '/trace' },
  { tag: 'rb-webitem-detail',      uuid: '96f54cc2-5897-475d-912e-5ff01078e44a', type: 'WebItem',      page: '/trace' },
  { tag: 'rb-feature-detail',      uuid: '901e0ece-c735-4c20-8652-1809069662c3', type: 'Feature',      page: '/feature-manager' },
  { tag: 'rb-modelelement-detail', uuid: '9a67e869-9bcf-4107-8530-8f3935dda8ff', type: 'ModelElement', page: '/model' },
];

// ── resolve BASE ──
let BASE = process.env.GATE_BASE || '';
let foundation = null;
if (BASE) {
  if (/:4444(\b|\/)/.test(BASE) || /prod\.wo-da/.test(BASE)) { R(`REFUSED: GATE_BASE=${BASE} looks like PROD — a bogus/synthetic ref can MINT. Point at an isolated scratch.`); process.exit(2); }
} else {
  const { setupFoundation } = await import('./r4031-foundation.mjs');
  foundation = await setupFoundation({ buildDist: true });
  BASE = foundation.base;
  R(`(no GATE_BASE) spun own buildDist scratch for harness validation / RED-baseline: ${BASE} v${foundation.servedVersion} sha=${foundation.worktreeSha}`);
}

// mount a detail component with a ref; return rendered {dvType,dvTitle,contentLen} + a pixel-painted flag from a screenshot
const renderProbe = async (page, tag, ref, stubOwnFail) => {
  // META-BITE stub (architect-specified): override renderUnresolved to emit an OWN fail-string (the UNMIGRATED tell) instead of
  // routing through RbDetailBase.renderUnresolved's '⚠ unresolved' — a component that self-handles the fail path must go RED.
  if (stubOwnFail) await page.evaluate((t) => { const C = customElements.get(t); if (C && C.prototype) C.prototype.renderUnresolved = function () { this.innerHTML = '<div class="dv-type">error</div><div class="dv-title">not found (own fail-string)</div>'; }; }, tag);
  await page.evaluate(({ t, r }) => { const old = document.getElementById('__g'); if (old) old.remove(); const el = document.createElement(t); el.id = '__g'; el.setAttribute('ref', r); document.body.appendChild(el); }, { t: tag, r: ref });
  await sleep(1600);
  const dom = await page.evaluate(() => {
    const el = document.getElementById('__g'); if (!el) return null;
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
    // Capture ONLY the MEASURED-invariant signals (architect ruling, STATED==IMPLEMENTED): the base fail-loud DOM (dv-type +
    // dv-title carry RbDetailBase.renderUnresolved's '⚠ unresolved' :83) + the real rendered text/name. DELIBERATELY NOT
    // captured or asserted — shown-event (3 dispatch sites incl rb-detail-drawer:446 → fires regardless of the base, NOT a
    // discriminator) and type-specific dv-* funnel classes (dv-head/dv-field/dv-rel — decoration, varies per component, NO
    // base invariant). dv-type/dv-title here are the BASE fail-loud strings, not per-component decoration.
    return {
      dvType: el.querySelector('.dv-type')?.textContent?.trim() || '',
      dvTitle: el.querySelector('.dv-title')?.textContent?.trim() || '',
      contentLen: txt.length, text: txt.slice(0, 220),
    };
  });
  // PIXEL: screenshot the mounted element region, decode in-page, count non-background painted pixels
  const shot = await page.locator('#__g').screenshot().catch(() => null);
  let paintedFrac = 0;
  if (shot) {
    const b64 = shot.toString('base64');
    paintedFrac = await page.evaluate(async (b) => {
      const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b; }).catch(() => {});
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data; let painted = 0, tot = 0;
      for (let i = 0; i < d.length; i += 4) { tot++; const r = d[i], gr = d[i + 1], bl = d[i + 2]; if (Math.abs(r - 17) > 24 || Math.abs(gr - 17) > 24 || Math.abs(bl - 17) > 24) painted++; } // bg ~#111
      return tot ? painted / tot : 0;
    }, b64);
  }
  return { ...dom, paintedFrac };
};

// OWNER-AUTH (PO + architect AUTHORIZED, SCRATCH ONLY): reach the owner-gated REAL surfaces /feature-manager + /model where
// rb-feature-detail / rb-modelelement-detail are registered (they deliberately stay off /trace — selection-triggered on their
// own pages). Read the scratch's owner token at runtime (NEVER printed) + mint an sm_session — SAME mechanism as
// setupFoundation. Using existing auth to LOAD owner-gated pages (read-only render) — NOT modifying auth, NOT prod, creates no
// identity/room. GUARDRAIL: the gate already refuses a :4444/prod BASE, so this privileged session is scratch-only.
let OWNER = '', smSession = '', authStatus = '?', ownerWs = null;
try {
  // GATE_OWNER_TOKEN_PATH lets the expert hand me the PATH to the scratch's own owner-token file (option i): read the VALUE
  // at runtime, never printed, never crosses a pane. Default = the host token (works when the scratch reads it — option ii).
  OWNER = fs.readFileSync(process.env.GATE_OWNER_TOKEN_PATH || '/root/.rawbin/owner-token', 'utf8').trim();
  // STEP 1 (REQUIRED, expert-corrected): open an owner WS + IDENTIFY so the server registers OWNER_TOKEN in tokenToClient
  // (server.ts:952) — a POST /session ALONE 403s regardless of token. Exact setupFoundation sequence. Keep the WS OPEN.
  ownerWs = await new Promise((resolve, reject) => {
    const ws = new WebSocket(BASE.replace(/^https/, 'wss'), { rejectUnauthorized: false });
    const t = setTimeout(() => reject(new Error('owner WS: no PROFILE within 15s')), 15000);
    ws.on('message', (raw) => { let m; try { m = JSON.parse(raw.toString()); } catch { return; } if (m.type === 'welcome') ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: OWNER, deviceId: 'r4066-owner', name: 'r4066-owner', screenWidth: 1, screenHeight: 1, platform: 'node' })); else if (m.type === 'PROFILE') { clearTimeout(t); resolve(ws); } });
    ws.on('error', (e) => { clearTimeout(t); reject(e); });
  });
  // STEP 2: now the token is registered → POST /session mints sm_session
  const sres = await fetch(BASE + '/api/server-manager/session', { method: 'POST', headers: { 'x-player-token': OWNER } });
  authStatus = String(sres.status);
  const setCookies = (typeof sres.headers.getSetCookie === 'function' ? sres.headers.getSetCookie() : [sres.headers.get('set-cookie') || '']).join(' ; ');
  smSession = (/sm_session=([^;]+)/.exec(setCookies) || [])[1] || '';
} catch (e) { authStatus = 'ERR:' + String(e && e.message).slice(0, 50); }
R(`owner-auth (scratch-only): owner-token=${OWNER ? 'read' : 'MISSING'} ownerWS=${ownerWs ? 'IDENTIFIED' : 'no'} sessionPOST=${authStatus} sm_session=${smSession ? 'minted' : 'none'}`);

const browser = await webkit.launch();
const results = [];
let servedVersion = '?';
let servedBundle = null, surfaceOk = false;
const EXPECTED_BUNDLE = process.env.GATE_BUNDLE || 'trace-page-FUSJBIA3.js'; // the migration build (prod is PA4Q6SXO)
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  if (smSession) await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/' }]);
  if (OWNER) await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, OWNER);
  const page = await ctx.newPage();
  await page.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-base') || document.querySelector('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await sleep(600);
  try { servedVersion = (await (await fetch(BASE + '/api/config').catch(() => null))?.json())?.version || '?'; } catch {}
  // STATIC SURFACE PRE-CHECK (from the SERVED PAGE, never off disk): the served trace-page bundle == the migration build.
  // Content-derived (revert → different hash). This is ONLY 'am I on the right surface' (wrong-URL/stale-cache) — NOT proof
  // of migration (that is the per-component funnel signature below; version-stamp alone stays green on a revert = a proxy).
  servedBundle = await page.evaluate(() => [...document.querySelectorAll('script[src]')].map((x) => (x.src.match(/trace-page-[A-Z0-9]+\.js/) || [])[0]).find(Boolean) || null);
  surfaceOk = servedBundle === EXPECTED_BUNDLE;
  R(`served version: ${servedVersion} | SURFACE: bundle=${servedBundle} expected=${EXPECTED_BUNDLE} → ${surfaceOk ? 'RIGHT SURFACE' : '⚠ WRONG/STALE SURFACE'} (surface-only, not proof of migration)`);

  for (const c of COMPONENTS) {
    // navigate to the page where THIS component is REGISTERED (file/webitem=/trace, feature=/feature-manager, modelelement=/model).
    // Mounting an unregistered tag = inert element = gate artifact. Not-registered on its OWN home page = a real finding.
    await page.goto(BASE + c.page, { waitUntil: 'domcontentloaded' });
    const registered = await page.waitForFunction((t) => !!customElements.get(t), c.tag, { timeout: 15000 }).then(() => true).catch(() => false);
    await sleep(300);
    // confirm the unit resolves on the served surface + get its real model.name (fail-loud if the fixture uuid is absent)
    const unit = await page.evaluate(async (u) => { try { const j = await (await fetch(`/api/ior/ior:instance:${u}`)).json(); return { ok: !!j?.unit, name: j?.unit?.model?.name || '', ior: j?.unit?.ior || '' }; } catch { return { ok: false }; } }, c.uuid);
    // (A) RENDER (real ref) — structure-INDEPENDENT: the resolved renderDetail renders type-specific DOM (NOT the base's
    // .dv-title, which is the UNRESOLVED path). Proof it rendered THAT unit's detail = pixel-painted (screenshot) + the unit's
    // REAL model.name appears in the rendered text + NOT the unresolved marker + not a bare-uuid (BUG18) + not raw-JSON.
    const rnd = await renderProbe(page, c.tag, c.uuid, false);
    const nameKey = (unit.name || '').replace(/\s+/g, ' ').trim().slice(0, 12);
    // ═══ MEASURED MIGRATION INVARIANT (architect ruling; STATED==IMPLEMENTED — asserted below, no shown-event/dv-* proxy) ═══
    // A component routes through RbDetailBase iff, per component on its REAL surface:
    //   (1) RENDERS REAL RESOLVED UNIT DATA — the resolved model's real name painted (not thin/fabricated/bare-uuid/raw-JSON), AND
    //   (2) BASE FAIL-LOUD — an unresolvable ref renders the BASE '⚠ unresolved' (rb-detail-base:83), NOT an own 'not found'.
    // RETIRED (measured NON-discriminators, asserted NOWHERE): shown-event (3 dispatch sites incl rb-detail-drawer:446 → fires
    // regardless of the base) and type-specific dv-* funnel classes (dv-head/dv-field/dv-rel — decoration, varies, no invariant).
    // (1) RENDER — real resolved unit data:
    const renderPass = registered && rnd.paintedFrac > 0.02 && rnd.dvType !== 'unresolved' && !/⚠?\s*unresolved/i.test(rnd.text)
      && rnd.contentLen > 20 && !isUuid(rnd.text) && (nameKey.length >= 3 ? rnd.text.includes(nameKey) : rnd.contentLen > 40);
    // (2) BASE FAIL-LOUD — bogus ref MUST render the BASE '⚠ unresolved' (proves it routed through RbDetailBase.renderUnresolved);
    // an own-funnel/unmigrated component renders its OWN 'not found' here → fails this = the clean migration discriminator.
    const fl = await renderProbe(page, c.tag, BOGUS, false);
    const failLoudPass = !!fl && fl.dvType === 'unresolved' && /⚠\s*unresolved/i.test(fl.dvTitle);
    const pass = renderPass && failLoudPass;
    results.push({ ...c, registered, unitResolves: unit.ok, unitName: unit.name, renderPass, failLoudPass, pass, rnd, fl });
    R(`  ${c.tag.padEnd(24)} @${c.page} registered=${registered} unit(${c.type})=${unit.ok ? 'resolves:"' + (unit.name || '').slice(0, 24) + '"' : 'ABSENT'}`);
    R(`      (1)REAL-DATA=${renderPass} [painted=${rnd.paintedFrac.toFixed(2)} name-in-text=${nameKey.length >= 3 ? rnd.text.includes(nameKey) : 'n/a'} text="${rnd.text.slice(0, 46)}"]`);
    R(`      (2)BASE-FAIL-LOUD=${failLoudPass} [type=${fl.dvType} title="${fl.dvTitle.slice(0, 28)}"] => ${pass ? 'PASS' : 'FAIL'}`);
  }

  // (C) META-BITE (architect-specified stub-must-fail): stub a component's renderUnresolved to emit an OWN fail-string (the
  // UNMIGRATED tell) instead of the base '⚠ unresolved', mount a BOGUS ref → the BASE-FAIL-LOUD assertion MUST go RED (own
  // string ≠ base string) = the gate CATCHES an escapee that self-handles the fail path instead of RbDetailBase.renderUnresolved.
  const biteCtx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const bitePage = await biteCtx.newPage();
  await bitePage.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await bitePage.waitForFunction(() => !!customElements.get('rb-file-detail'), { timeout: 20000 }).catch(() => {});
  await sleep(400);
  const biteTag = COMPONENTS[0].tag; // rb-file-detail (registered on /trace)
  const bitten = await renderProbe(bitePage, biteTag, BOGUS, true); // stubOwnFail=true → own 'not found' string on the bogus ref
  const biteBaseFailLoud = !!bitten && bitten.dvType === 'unresolved' && /⚠\s*unresolved/i.test(bitten.dvTitle);
  const bitePassesStub = !biteBaseFailLoud; // own fail-string must NOT satisfy base-fail-loud → gate correctly detects RED
  R(`  META-BITE stub ${biteTag}.renderUnresolved→own-fail-string → base-fail-loud DETECTED-RED=${bitePassesStub} (title="${bitten.dvTitle.slice(0, 30)}")`);
  results._bite = bitePassesStub;
  await biteCtx.close();
  await ctx.close();
} finally {
  await browser.close().catch(() => {});
  try { ownerWs && ownerWs.close(); } catch { /* owner WS teardown */ }
  if (foundation) { const td = await foundation.teardown(); R(`teardown: prod:4444 up=${td.prodUp} leftover=${td.leftover}`); }
}

// ── verdict: ALL-4-OR-HOLD ──
R(`\n═══ PHASE-A 4-COMPONENT DETAIL GATE (@390, served v${servedVersion}) ═══`);
R(`DEFINITION IN FORCE (architect measured invariant): (1) renders REAL resolved unit data (real name painted, not a stub) + (2) BASE FAIL-LOUD (unresolvable ref → base '⚠ unresolved', not an own 'not found'). RETIRED: shown-event (3 dispatch sites) + dv-* (decoration). Applied to ALL 4 (never feature-only).`);
for (const r of results) R(`  ${r.tag.padEnd(24)} ${r.pass ? 'PASS' : 'FAIL'}  (render=${r.renderPass} fail-loud=${r.failLoudPass}${r.unitResolves ? '' : ' unit-ABSENT'})`);
const bite = results._bite === true;
R(`  META-BITE (stub-must-fail):   ${bite ? 'PASS (gate can go RED)' : 'FAIL (gate CANNOT fail — INVALID)'}`);
R(`  SURFACE (pre-check):          ${surfaceOk ? 'RIGHT (' + servedBundle + ')' : '⚠ WRONG/STALE (' + servedBundle + ' != ' + EXPECTED_BUNDLE + ')'}`);
const all4 = results.length === 4 && results.every((r) => r.pass);
const green = all4 && bite && surfaceOk;
const failing = results.filter((r) => !r.pass).map((r) => r.tag).join(', ');
if (green) {
  R(`\nVERDICT: GREEN — all 4 render REAL resolved unit data + BASE fail-loud '⚠ unresolved' (routed through RbDetailBase.renderUnresolved), meta-BITE valid (own-fail-string → RED), right surface → Phase-A land AUTHORIZED.`);
} else {
  // RED DISAMBIGUATION (PO/architect: guard==assertion → re-confirm the SURFACE before blaming the migration)
  R(`\nVERDICT: HOLD (ALL-4-OR-HOLD — no partial land, no DETAIL_ARTIFACTS exemption).`);
  R(`★ RED DISAMBIGUATION (re-confirm surface FIRST):`);
  if (!surfaceOk) R(`  → WRONG/STALE SURFACE: served ${servedBundle} != ${EXPECTED_BUNDLE}. This RED is a SURFACE problem (wrong-URL / stale-cache / wrong-server) — NOT proof the migration is broken. Re-point at the migration scratch + re-run before attributing to renderDetail.`);
  else {
    R(`  → SERVER SURFACE CONFIRMED (${servedBundle} = migration build). Attributing each failure:`);
    const notReg = results.filter((r) => !r.pass && !r.registered);
    const renderFails = results.filter((r) => !r.pass && r.registered);
    if (notReg.length) R(`     ⚠ SURFACE/LOADING FINDING (NOT a renderDetail bug — do NOT send the expert to debug renderDetail): ${notReg.map((r) => r.tag + ' NOT-REGISTERED@' + r.page).join(', ')}. Not loaded on the gated surface (feature registers only via /feature-manager, modelelement only via /model; both routes are owner-gated 403 on the scratch). Migration renderDetail for these is UNVERIFIED, not failed. ARCHITECT to rule the correct surface: (a) load all 4 on /trace, or (b) the scratch exposes /feature-manager + /model under owner-auth so the gate can reach them.`);
    if (renderFails.length) R(`     MIGRATION/renderDetail DEFECT (registered but BASE signature absent — no shown-event, or no real resolved content): ${renderFails.map((r) => r.tag).join(', ')} — expert fixes renderDetail.`);
    if (!bite) R(`     META-BITE INVALID — the gate could not be shown to fail; fix the bite before trusting any green.`);
  }
}
R(`FAMILY: detail-elements-rendering-a-scenario-unit-instance via RbDetailBase (the shared funnel) — not one instance. iOS-scope N/A here.`);
process.exit(green ? 0 : 1);
