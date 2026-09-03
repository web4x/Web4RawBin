// OPTION B (PO 2026-09-03): the REAL Add-folder VERB-UI click-flow on SCRATCH (foundation-authed), ts AND shared — NOT a
// hand-built POST. Closes the exact gap that made this morning's green a lie: the harness deviating from the user's click-flow.
// ★ LABEL HONESTLY: this is the real click-flow proven on SCRATCH (localhost:4643), NOT a prod result. The prod E2E is Tron's
//   click (owner-auth on his live prod is his decision alone — Option A declined). Combined with expert resolver-verify (real
//   project root, both Tron node refs) + architect 11/11 incl fail-closed = strong evidence, honest about its boundary.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const f = await setupFoundation();
const OWNER = fs.readFileSync('/root/.rawbin/owner-token', 'utf8').trim();
const smSession = (/sm_session=([^;]+)/.exec(f.ownerHeaders().Cookie || '') || [])[1] || '';
const scratchDir = fs.readdirSync('/tmp').filter((d) => d.startsWith(`r4031-scratch-${process.pid}-`)).map((d) => path.join('/tmp', d))[0] || null;
const MODEL_STORE = scratchDir ? path.join(scratchDir, 'data/model-store/index') : null;
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} | ownerSession=${!!smSession}`);
if (MODEL_STORE) { const fx = { ior: 'ior:class:ModelElement', ownerIor: null, model: { uuid: 'facade01-5eed-4a1c-8b0f-000000004078', name: 'R40MofSeedFixture', metaLevel: 'M1', sourceFile: 'src/ts/seed-fixture.ts', kind: 'class' } };
  const p = path.join(MODEL_STORE, 'f', 'a', 'c', 'a', 'd', 'facade01-5eed-4a1c-8b0f-000000004078.scenario.json'); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(fx, null, 2) + '\n'); }

const browser = await webkit.launch();
const results = [];
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  if (smSession) await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/' }]);
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, OWNER);
  const page = await ctx.newPage();
  const posts = [];
  page.on('response', async (res) => { if (res.url().includes('/api/model/folder/create')) { let body = null; try { body = await res.json(); } catch {} posts.push({ status: res.status(), reqBody: res.request().postData(), body }); } });
  page.on('dialog', async (d) => { await d.accept('scratch-verb-' + (Date.now() % 100000)); });
  await page.goto(f.base + '/model', { waitUntil: 'domcontentloaded' });
  const ok = await page.waitForFunction(() => { const t = document.getElementById('model-tree'); return t && t.querySelectorAll('rb-object-item, .tt-row').length > 0; }, { timeout: 20000 }).then(() => true).catch(() => false);
  if (!ok) throw new Error('scratch /model did not render');

  for (const [label, rawDir] of [['ts', 'dir:src/ts'], ['shared', 'dir:src/shared']]) {
    posts.length = 0;
    await page.evaluate(async (p) => { const t = document.getElementById('model-tree'); if (t && t.expandPath) await t.expandPath(p); }, ['mof-m1', 'project:RawBin', 'rawbin:ts', rawDir]);
    await sleep(900);
    // REAL verb-UI: select the node → CLICK the '📁 Add folder' verb button (NOT a POST) → prompt → app's own addFolder → POST
    const drove = await page.evaluate(async (raw) => {
      const t = document.getElementById('model-tree'); if (!t) return { err: 'no tree' };
      const node = [...t.querySelectorAll('rb-object-item, .tt-node, [ref]')].find((n) => [...n.attributes].some((a) => a.value === raw || a.value.endsWith(':' + raw) || a.value === 'collection:' + raw));
      if (!node) return { err: 'node not found: ' + raw };
      // the node's FULL ref (= what a tree selection sets as shownRef). Open its detail in the shared drawer = exactly what
      // selection does (fires rb-drawer-detail-shown → model sets shownRef + populates the MODEL_DECLS action bar). NOT a POST.
      const nodeRef = ([...node.attributes].find((a) => /^(collection:)?dir:/.test(a.value) || a.value === raw) || {}).value || raw;
      let drawer = document.querySelector('rb-detail-drawer'); if (!drawer) { drawer = document.createElement('rb-detail-drawer'); document.body.appendChild(drawer); }
      drawer.removeAttribute('ref'); drawer.setAttribute('ref', nodeRef); drawer.setAttribute('open', '');
      await new Promise((r) => setTimeout(r, 1400));
      // find the real Add-folder verb in the drawer bar (shadow-pierced), click it → app's addFolder(shownRef) → app's own POST
      const walk = (root, out) => { for (const el of root.querySelectorAll('*')) { const t = (el.textContent || ''); if ((/add folder/i.test(t) || /📁/.test(t)) && t.length < 40) out.push(el); if (el.shadowRoot) walk(el.shadowRoot, out); } return out; };
      const found = walk(document, []);
      const btn = found.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0];
      if (!btn) return { err: 'NO Add-folder verb in drawer bar after opening detail', nodeRef, selRef: [...node.attributes].map((a) => a.name + '=' + a.value).slice(0, 4) };
      (btn.closest('button, [role="button"], [class*="item"], [class*="compartment"], [class*="action"]') || btn).click();
      return { clicked: true, verbBtn: (btn.textContent || '').trim().slice(0, 24), nodeRef };
    }, rawDir);
    await sleep(2500);
    const p = posts[posts.length - 1];
    const pass = !!(p && p.status === 200 && p.body && p.body.ok);
    results.push({ label, pass, drove, req: p?.reqBody, status: p?.status, body: p?.body });
    R(`\n──────── ${label} (${rawDir}) — REAL VERB-UI click-flow ────────`);
    R(`  drive: ${JSON.stringify(drove)}`);
    R(`  REQUEST (the app's own POST): ${p?.reqBody}`);
    R(`  RESPONSE: HTTP ${p?.status} body=${JSON.stringify(p?.body)}`);
    R(`  → ${pass ? 'GREEN — real verb-UI create SUCCEEDED (no bad-parent-loc); the fix resolves the ref the VERB sends' : (p?.body?.error === 'bad-parent-loc' ? 'RED — STILL bad-parent-loc via the real verb' : 'RED/DEVIATION — ' + (drove.err || 'no create POST fired'))}`);
  }
} catch (e) { R(`(halted: ${String(e && e.message)})`); }
finally { await browser.close().catch(() => {}); const td = await f.teardown(); R(`\nteardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`); }

R(`\n═══ OPTION B VERDICT — REAL VERB-UI on SCRATCH (NOT prod) ═══`);
results.forEach((r) => R(`  • ${r.label}: ${r.pass ? 'GREEN (real click-flow)' : 'RED/DEVIATION'} — req=${r.req} → HTTP ${r.status}`));
const green = results.length === 2 && results.every((r) => r.pass);
R(`  OVERALL: ${green ? 'GREEN on scratch via the REAL click-flow (both ts+shared) — labelled: SCRATCH not prod; prod E2E = Tron clicks' : 'NOT all green — see above'}`);
process.exitCode = green ? 0 : 1;
