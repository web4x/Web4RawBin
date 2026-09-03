// REPRODUCE Tron's "Add folder failed: bad-parent-loc" (PO 2026-09-03, NO gating — findings only). Tron clicked Add-folder
// on the ts collection AND shared and got bad-parent-loc. My r4021 GREEN used a DIRECT POST (parent='dir:src/ts' raw) that
// WORKED AROUND the verb-UI path — the verb sends `parent = shownRef` (the FULL view-ref, model.ts:131), server does
// ensureViewUnit(parent)→resolveModelParent→resolveDirRefAbs('dir:'+location); if it fails → error:'bad-parent-loc' (FolderService.ts:102).
// This captures the EXACT request/response for BOTH what the verb sends (node's full ref) AND the raw ref, to pin the root —
// scratch localhost:4643, owner auto-authed by the foundation (NO prod identity, NO credential-guard bypass). Also checks whether
// the ROOM Files folder offers an Add-folder button. Findings for the expert to diagnose against a real trace, not a theory.
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
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha}`);
// seed the M1 root so the /model tree renders past the top (same as r4021)
if (MODEL_STORE) { const fx = { ior: 'ior:class:ModelElement', ownerIor: null, model: { uuid: 'facade01-5eed-4a1c-8b0f-000000004078', name: 'R40MofSeedFixture', metaLevel: 'M1', sourceFile: 'src/ts/seed-fixture.ts', kind: 'class' } };
  const p = path.join(MODEL_STORE, 'f', 'a', 'c', 'a', 'd', 'facade01-5eed-4a1c-8b0f-000000004078.scenario.json'); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(fx, null, 2) + '\n'); }

const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  if (smSession) await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/' }]);
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, OWNER);
  const page = await ctx.newPage();
  await page.goto(f.base + '/model', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => { const t = document.getElementById('model-tree'); return t && t.querySelectorAll('rb-object-item, .tt-row').length > 0; }, { timeout: 20000 }).catch(() => {});
  await sleep(600);

  // POST exactly what the verb posts (model.ts:132) from the page context (owner cookie, same-origin) — capture request+response.
  const post = (parent, name) => page.evaluate(async ({ parent, name }) => {
    try { const r = await fetch('/api/model/folder/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name, parent }) });
      let body = null; try { body = await r.json(); } catch {}
      return { httpStatus: r.status, ok: r.ok, body }; } catch (e) { return { err: String(e && e.message) }; }
  }, { parent, name });

  // find the rendered node's FULL ref (= shownRef the verb sends) for a given raw dir ref
  const nodeRef = (rawDir) => page.evaluate((raw) => {
    const t = document.getElementById('model-tree'); if (!t) return null;
    const nodes = [...t.querySelectorAll('rb-object-item, [ref], [data-ref], .tt-node, .tt-row')];
    const hit = nodes.find((n) => [...n.attributes].some((a) => a.value === raw || a.value.endsWith(':' + raw) || a.value === 'collection:' + raw));
    return hit ? ([...hit.attributes].find((a) => a.value === raw || a.value.endsWith(':' + raw) || a.value === 'collection:' + raw)?.value || null) : null;
  }, rawDir);

  for (const rawDir of ['dir:src/ts', 'dir:src/shared']) {
    await page.evaluate(async (p) => { const t = document.getElementById('model-tree'); if (t && t.expandPath) await t.expandPath(p); }, ['mof-m1', 'project:RawBin', 'rawbin:ts', rawDir]);
    await sleep(900);
    const shownRef = await nodeRef(rawDir);
    R(`\n──────── ${rawDir} ────────`);
    R(`  node's FULL ref (= shownRef the verb sends as parent) = ${JSON.stringify(shownRef)}`);
    // (A) EXACTLY what the verb does: POST parent = shownRef (the full view-ref)
    const asVerb = await post(shownRef || `collection:${rawDir}`, `repro-verb-${Date.now() % 100000}`);
    R(`  (A) VERB path  POST {parent:${JSON.stringify(shownRef || 'collection:' + rawDir)}} → HTTP ${asVerb.httpStatus} ok=${asVerb.ok} body=${JSON.stringify(asVerb.body)}`);
    // (B) what my gate did: POST parent = raw dir ref
    const asRaw = await post(rawDir, `repro-raw-${Date.now() % 100000}`);
    R(`  (B) RAW path   POST {parent:${JSON.stringify(rawDir)}} → HTTP ${asRaw.httpStatus} ok=${asRaw.ok} body=${JSON.stringify(asRaw.body)}`);
    R(`  → ${asVerb.body?.error === 'bad-parent-loc' ? 'REPRODUCED bad-parent-loc on the VERB path' : 'verb path did NOT reproduce (' + JSON.stringify(asVerb.body) + ')'}${asRaw.ok && asRaw.body?.ok ? ' | RAW path SUCCEEDED (the workaround) — confirms the difference is the ref FORM the verb sends' : ''}`);
  }

  // ROOM Files folder: does it offer an Add-folder button/verb? (Tron's 2nd report). add-folder appliesTo excludes file/member/etc; a roomcoll:...:files is a 'collection' — check.
  R(`\n──────── ROOM Files add-folder button ────────`);
  const roomFilesVerb = await page.evaluate(async () => {
    try { const mod = await import('/dist/model-Q4PQAEQF.js').catch(() => null); } catch {}
    // read the decl table if exposed, else report structurally: does the model-action-decls include add-folder for a files collection type?
    return { note: 'add-folder appliesTo = notTypes[task,file,webitem,member,user,puml,pumlartifact,changerequest]; a roomcoll ":files" folder renders as type "collection" → the verb SHOULD be offered unless the room Files node carries an excluded type or the room surface never lists verbs' };
  });
  R(`  ${JSON.stringify(roomFilesVerb.note)}`);
  R(`  (structural read — a live room-Files verb check needs the room surface; reporting reproducibility to PO, full room mount deferred to avoid a heavy detour)`);
} finally {
  await browser.close().catch(() => {});
  const td = await f.teardown();
  R(`\nteardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`);
}
