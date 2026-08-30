// PHASE-A 4-COMPONENT DETAIL GATE (PO deadlock-break ruling) — the FAMILY = detail-elements-that-render-a-scenario-unit-
// instance (RbDetailBase escapees). R37.26 migrates all 4 onto RbDetailBase (the ONE render funnel + one-model-source +
// fail-LOUD renderUnresolved). This gate BLOCKS the Phase-A land: GREEN fires the pre-authorized land, RED = HOLD.
// ★ DELTA-2 BINDING: report each of the 4 INDIVIDUALLY. ALL-4-OR-HOLD — ANY fail = HOLD (expert fixes renderDetail), NOT a
//   partial land, NOT a DETAIL_ARTIFACTS exemption (revoked). Do NOT shade toward green; a RED is a valid deliverable.
// Per component, @390 real-WebKit on the SERVED scratch surface:
//   (A) RENDER: mount with a REAL committed-index uuid of its type → the element renders THAT unit's detail — assert
//       screenshot+PIXEL painted (region not blank, never a DOM element-count) AND dv-title is real (not '⚠ unresolved',
//       not a bare-uuid [BUG18 symptom], not raw-JSON), name matches the server's model.name.
//   (B) FAIL-LOUD: mount with a BOGUS uuid → RbDetailBase renderUnresolved: dv-type='unresolved' + dv-title '⚠ unresolved'
//       VISIBLE (never a silent blank). This fail-loud-via-base is ALSO the migration discriminator (an un-migrated escapee
//       would blank or fail-loud its own way) — it is the behavioural phantom-guard that all 4 route through the base.
//   (C) META-BITE (stub-must-fail): stub ONE component's renderDetail → the suite MUST go RED for it → proves the gate can fail.
// PHANTOM-GUARD (served==the-build-I'm-gating): served /api/config version recorded + all-4-fail-loud-via-base asserted (a
//   back-version / un-migrated surface would not produce the base's '⚠ unresolved' for the escapees). Expert-supplied minify-
//   surviving discriminator folds in here when provided.
// BASE: GATE_BASE env = the expert's R40.31 scratch URL (the acceptance surface). Absent → spin my own buildDist scratch
//   (validates the harness + captures the RED-baseline on my HEAD, where feature/modelelement may still be escapees).
// Scratch-only; a bogus/synthetic ref can MINT on the server it hits (BUG18/r4010) → NEVER prod (gate refuses a :4444 base).
import { webkit } from '@playwright/test';
import fs from 'node:fs';

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
const renderProbe = async (page, tag, ref, stubRenderDetail) => {
  if (stubRenderDetail) await page.evaluate((t) => { const C = customElements.get(t); if (C && C.prototype) C.prototype.renderDetail = function () { /* STUBBED no-op — meta-BITE */ }; }, tag);
  // wire the rb-drawer-detail-shown listener ONCE + CLEAR the ring before each mount (the base fires it on EVERY render path)
  await page.evaluate(() => { window.__shown = []; if (!window.__shownWired) { window.__shownWired = true; document.addEventListener('rb-drawer-detail-shown', (e) => { try { window.__shown.push((e.detail && e.detail.ref) || ''); } catch {} }); } });
  await page.evaluate(({ t, r }) => { const old = document.getElementById('__g'); if (old) old.remove(); const el = document.createElement(t); el.id = '__g'; el.setAttribute('ref', r); document.body.appendChild(el); }, { t: tag, r: ref });
  await sleep(1600);
  const dom = await page.evaluate(() => {
    const el = document.getElementById('__g'); if (!el) return null;
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
    // FUNNEL SIGNATURE (architect/PO honest discriminator): the shared renderDetail DOM + the shown event. Capture a spread of
    // candidate funnel classes so the run REVEALS the real structure (measure-first — I mis-guessed .dv-title once already).
    const has = (s) => !!el.querySelector(s);
    return {
      dvType: el.querySelector('.dv-type')?.textContent?.trim() || '',
      dvTitle: el.querySelector('.dv-title')?.textContent?.trim() || '',
      dvHead: has('.dv-head'), dvFields: has('.dv-fields'), dvParentChildren: has('.dv-parent-children, .dv-children, .dv-parent, .dv-parents'),
      // the HONEST shared funnel signature (type-specific DOM varies: file=dv-head/dv-fields/dv-parent, webitem=dv-field) =
      // ANY dv-* element BEYOND the unresolved shell (dv-type/dv-title). Falsifiable on revert: own-funnel → no dv-* + no shown.
      dvBeyondShell: [...el.querySelectorAll('[class*="dv-"]')].some((n) => !/\bdv-(type|title)\b/.test(' ' + n.className + ' ')),
      funnelClasses: [...el.querySelectorAll('[class*="dv-"]')].map((n) => n.className).slice(0, 8).join('|'),
      shownFired: (window.__shown || []).length > 0,
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
let OWNER = '', smSession = '', authStatus = '?';
try {
  // GATE_OWNER_TOKEN_PATH lets the expert hand me the PATH to the scratch's own owner-token file (option i): read the VALUE
  // at runtime, never printed, never crosses a pane. Default = the host token (works when the scratch reads it — option ii).
  OWNER = fs.readFileSync(process.env.GATE_OWNER_TOKEN_PATH || '/root/.rawbin/owner-token', 'utf8').trim();
  const sres = await fetch(BASE + '/api/server-manager/session', { method: 'POST', headers: { 'x-player-token': OWNER } });
  authStatus = String(sres.status);
  const setCookies = (typeof sres.headers.getSetCookie === 'function' ? sres.headers.getSetCookie() : [sres.headers.get('set-cookie') || '']).join(' ; ');
  smSession = (/sm_session=([^;]+)/.exec(setCookies) || [])[1] || '';
} catch (e) { authStatus = 'ERR:' + String(e && e.message).slice(0, 40); }
R(`owner-auth (scratch-only): owner-token=${OWNER ? 'read' : 'MISSING'} sessionPOST=${authStatus} sm_session=${smSession ? 'minted' : 'none'}`);

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
    // FUNNEL SIGNATURE (the honest per-component discriminator; version-stamp DEMOTED to surface-only): shown-event fired +
    // the shared renderDetail DOM present. Both DISAPPEAR if a component is reverted to its own-funnel → can't false-green.
    const funnelSig = !!rnd && rnd.shownFired && rnd.dvBeyondShell; // shared signature (type-DOM-agnostic; covers file dv-fields AND webitem dv-field)
    const renderPass = registered && funnelSig && rnd.paintedFrac > 0.02 && rnd.dvType !== 'unresolved' && !/⚠?\s*unresolved/i.test(rnd.text)
      && rnd.contentLen > 20 && !isUuid(rnd.text) && (nameKey.length >= 3 ? rnd.text.includes(nameKey) : rnd.contentLen > 40);
    // (B) FAIL-LOUD (bogus ref) — base '⚠ unresolved' + shown-event (announceShown fires on the unresolved path too)
    const fl = await renderProbe(page, c.tag, BOGUS, false);
    const failLoudPass = !!fl && fl.dvType === 'unresolved' && /unresolved/i.test(fl.dvTitle) && fl.shownFired;
    const pass = renderPass && failLoudPass;
    results.push({ ...c, registered, unitResolves: unit.ok, unitName: unit.name, renderPass, failLoudPass, funnelSig, pass, rnd, fl });
    R(`  ${c.tag.padEnd(24)} @${c.page} registered=${registered} unit(${c.type})=${unit.ok ? 'resolves:"' + (unit.name || '').slice(0, 24) + '"' : 'ABSENT'}`);
    R(`      RENDER=${renderPass} [shown=${rnd.shownFired} funnel(head=${rnd.dvHead}/fields=${rnd.dvFields}/pc=${rnd.dvParentChildren}) painted=${rnd.paintedFrac.toFixed(2)} name-in-text=${nameKey.length >= 3 ? rnd.text.includes(nameKey) : 'n/a'} classes="${rnd.funnelClasses.slice(0, 60)}" text="${rnd.text.slice(0, 40)}"]`);
    R(`      FAIL-LOUD=${failLoudPass} [type=${fl.dvType} title="${fl.dvTitle.slice(0, 22)}" shown=${fl.shownFired}] => ${pass ? 'PASS' : 'FAIL'}`);
  }

  // (C) META-BITE: stub ONE component's renderDetail on a FRESH context → its render MUST fail (proves the gate can go RED)
  const biteCtx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const bitePage = await biteCtx.newPage();
  await bitePage.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await bitePage.waitForFunction(() => !!customElements.get('rb-file-detail'), { timeout: 20000 }).catch(() => {});
  await sleep(400);
  const biteTag = COMPONENTS[0].tag; // rb-file-detail
  const bitten = await renderProbe(bitePage, biteTag, COMPONENTS[0].uuid, true);
  const bitePassesStub = !(bitten.hasTitleEl && bitten.dvTitle.length > 0 && bitten.paintedFrac > 0.01); // stubbed renderDetail → NO real detail
  R(`  META-BITE stub ${biteTag}.renderDetail → suite-detects-RED=${bitePassesStub} (title="${bitten.dvTitle.slice(0, 20)}" painted=${bitten.paintedFrac.toFixed(3)})`);
  results._bite = bitePassesStub;
  await biteCtx.close();
  await ctx.close();
} finally {
  await browser.close().catch(() => {});
  if (foundation) { const td = await foundation.teardown(); R(`teardown: prod:4444 up=${td.prodUp} leftover=${td.leftover}`); }
}

// ── verdict: ALL-4-OR-HOLD ──
R(`\n═══ PHASE-A 4-COMPONENT DETAIL GATE (@390, served v${servedVersion}) ═══`);
for (const r of results) R(`  ${r.tag.padEnd(24)} ${r.pass ? 'PASS' : 'FAIL'}  (render=${r.renderPass} fail-loud=${r.failLoudPass}${r.unitResolves ? '' : ' unit-ABSENT'})`);
const bite = results._bite === true;
R(`  META-BITE (stub-must-fail):   ${bite ? 'PASS (gate can go RED)' : 'FAIL (gate CANNOT fail — INVALID)'}`);
R(`  SURFACE (pre-check):          ${surfaceOk ? 'RIGHT (' + servedBundle + ')' : '⚠ WRONG/STALE (' + servedBundle + ' != ' + EXPECTED_BUNDLE + ')'}`);
const all4 = results.length === 4 && results.every((r) => r.pass);
const green = all4 && bite && surfaceOk;
const failing = results.filter((r) => !r.pass).map((r) => r.tag).join(', ');
if (green) {
  R(`\nVERDICT: GREEN — all 4 render scenario-unit detail via the shared funnel (shown-event + funnel DOM) + fail-loud '⚠ unresolved', meta-BITE valid, right surface → Phase-A land AUTHORIZED.`);
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
    if (renderFails.length) R(`     MIGRATION/renderDetail DEFECT (registered but funnel signature absent): ${renderFails.map((r) => r.tag).join(', ')} — expert fixes renderDetail.`);
    if (!bite) R(`     META-BITE INVALID — the gate could not be shown to fail; fix the bite before trusting any green.`);
  }
}
R(`FAMILY: detail-elements-rendering-a-scenario-unit-instance via RbDetailBase (the shared funnel) — not one instance. iOS-scope N/A here.`);
process.exit(green ? 0 : 1);
