// PROD REAL-VERB-UI GATE (PO 2026-09-03, v0.8.167) — gate defect-1 (bad-parent-loc) the way TRON does it: the exact
// Add-folder VERB-UI click-flow on PROD @390, ts AND shared, NOT a hand-built POST. Capture the real request+response per node.
// ★ If the harness must DEVIATE from his click-flow to run (e.g. auth-blocked, verb button absent), the DEVIATION IS THE FINDING —
//   report that, not a green. ★ CLEANUP: a create leaves a real folder in the served tree — remove it immediately (folders have
//   NO in-memory residue: unlink unit + rmdir) + verify git-clean. If removal fails, report loudly.
// Owner self-auth via the runtime owner token (/root/.rawbin/owner-token) — NOT a peer handoff, NOT a new identity, NEVER printed.
import { webkit } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const OWNER = fs.readFileSync('/root/.rawbin/owner-token', 'utf8').trim();

// owner self-auth: mint an sm_session for the EXISTING owner (curl, token in header only, never logged)
let smSession = '';
try {
  const out = execSync(`curl -s -i -X POST ${BASE}/api/server-manager/session -H 'Content-Type: application/json' -H 'x-player-token: ${OWNER}' --insecure`, { encoding: 'utf8' });
  smSession = (out.match(/set-cookie:\s*sm_session=([^;\s]+)/i) || [])[1] || (out.match(/"session"\s*:\s*"([^"]+)"/) || [])[1] || '';
} catch {}
R(`owner self-auth: sm_session=${smSession ? 'MINTED' : 'FAILED'}`);

const browser = await webkit.launch();
const created = []; // {uuid, location} to clean up
let verdict = [];
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  if (smSession) await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'prod.wo-da.de', path: '/' }]);
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, OWNER);
  const page = await ctx.newPage();
  // capture the REAL verb's network call
  const posts = [];
  page.on('response', async (res) => { if (res.url().includes('/api/model/folder/create')) { let body = null; try { body = await res.json(); } catch {} posts.push({ url: res.url(), status: res.status(), reqBody: res.request().postData(), body }); } });
  page.on('dialog', async (d) => { await d.accept('gate-verb-' + Date.now() % 100000); }); // accept the prompt('New folder name')

  await page.goto(BASE + '/model', { waitUntil: 'domcontentloaded' });
  const surfaceOk = await page.waitForFunction(() => { const t = document.getElementById('model-tree'); return t && t.querySelectorAll('rb-object-item, .tt-row').length > 0; }, { timeout: 20000 }).then(() => true).catch(() => false);
  if (!surfaceOk) { R(`★ DEVIATION = FINDING: /model did NOT render a tree as owner (auth-blocked / fail-closed). Cannot run the real verb-UI on prod. NOT a green. sm_session=${!!smSession}`); verdict.push('DEVIATION: /model unreachable as owner (auth) — the real click-flow could not run; report, not green.'); throw new Error('surface-unreachable'); }

  for (const [label, rawDir] of [['ts', 'dir:src/ts'], ['shared', 'dir:src/shared']]) {
    posts.length = 0;
    await page.evaluate(async (p) => { const t = document.getElementById('model-tree'); if (t && t.expandPath) await t.expandPath(p); }, ['mof-m1', 'project:RawBin', 'rawbin:ts', rawDir]);
    await sleep(900);
    // REAL verb-UI: select the node → find + CLICK the '📁 Add folder' verb button in the action bar (NOT a POST)
    const drove = await page.evaluate(async (raw) => {
      const t = document.getElementById('model-tree'); if (!t) return { err: 'no tree' };
      const node = [...t.querySelectorAll('rb-object-item, .tt-node, [ref]')].find((n) => [...n.attributes].some((a) => a.value === raw || a.value.endsWith(':' + raw) || a.value === 'collection:' + raw));
      if (!node) return { err: 'node not found for ' + raw };
      (node.closest('.tt-row') || node).click(); // select → renders the action bar
      await new Promise((r) => setTimeout(r, 900));
      const btn = [...document.querySelectorAll('rb-strip button, .rb-strip button, button, [role="button"]')].find((b) => /add folder/i.test(b.textContent || ''));
      if (!btn) return { err: 'NO Add-folder verb button in the action bar (deviation)', selectedRef: [...node.attributes].map((a) => a.name + '=' + a.value).slice(0, 4) };
      btn.click(); // the REAL verb → prompt → addFolder(shownRef) → its own POST
      return { clicked: true, selectedRef: [...node.attributes].map((a) => a.name + '=' + a.value).slice(0, 4) };
    }, rawDir);
    await sleep(2500); // let the prompt-accept + POST complete
    const p = posts[posts.length - 1];
    R(`\n──────── ${label} (${rawDir}) — REAL VERB-UI ────────`);
    R(`  drive: ${JSON.stringify(drove)}`);
    if (p) { R(`  REQUEST body: ${p.reqBody}`); R(`  RESPONSE: HTTP ${p.status} body=${JSON.stringify(p.body)}`);
      if (p.body?.uuid && p.body?.ok) { created.push({ uuid: p.body.uuid, location: p.body.unit?.model?.location }); verdict.push(`${label}: VERB-UI create → HTTP ${p.status} ok — folder ${p.body.uuid.slice(0, 8)} at ${p.body.unit?.model?.location}`); }
      else verdict.push(`${label}: VERB-UI create → HTTP ${p.status} ${JSON.stringify(p.body)} ${p.body?.error === 'bad-parent-loc' ? '= STILL bad-parent-loc, RED' : ''}`); }
    else { R(`  ⚠ NO folder/create POST fired — ${drove.err || 'the verb did not POST'} = DEVIATION (report, not green)`); verdict.push(`${label}: DEVIATION — real verb did not fire a create POST (${drove.err || 'no button/no post'})`); }
  }
} catch (e) { R(`(halted: ${String(e && e.message)})`); }
finally {
  await browser.close().catch(() => {});
  // ── CLEANUP: remove any folder this gate created (unit + physical dir), verify git-clean ──
  for (const c of created) {
    try {
      const shard = path.join(REPO, 'data/model-store/index', ...c.uuid.slice(0, 5).split(''), `${c.uuid}.scenario.json`);
      if (fs.existsSync(shard)) fs.rmSync(shard);
      if (c.location) { const dir = path.join(REPO, c.location); if (fs.existsSync(dir)) fs.rmdirSync(dir); }
      R(`  cleanup ${c.uuid.slice(0, 8)}: unit-removed=${!fs.existsSync(shard)} dir-removed=${!c.location || !fs.existsSync(path.join(REPO, c.location))}`);
    } catch (e) { R(`  ⚠ CLEANUP FAILED for ${c.uuid.slice(0, 8)}: ${String(e && e.message)} — DEBRIS may remain, tell PO`); }
  }
  try { const dirty = execSync(`git -C ${REPO} status --short data/model-store src`, { encoding: 'utf8' }).trim(); R(`  git-clean after cleanup (model-store+src): ${dirty ? 'DIRTY:\n' + dirty : 'CLEAN'}`); } catch {}
}
R(`\n═══ PROD VERB-UI VERDICT (defect-1 bad-parent-loc, ts+shared) ═══`);
verdict.forEach((v) => R('  • ' + v));
