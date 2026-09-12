// R40.106 INC-5 (v0.8.221) — add-folder-NEST collapsed create-path check (PO named it explicitly).
// The 3rd collapsed create path (add-folder-nest, alongside multipart-upload=native-nest + federation-import).
// AUTHENTICATED via the seeded SystemTester browser session (raw https = 401, documented). Reuse 909f1bd6, no room creation.
// Create parent folder → create child folder NESTED in parent → assert the child lands UNDER the parent (its linkIn edge).
// FAILABLE: a control root-folder must NOT appear under the parent. Refactor = must land exactly as before.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const ROOM = '909f1bd6-1f97-4542-b02b-242cfcc41f5e';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await webkit.launch();
const R = {};
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  R.served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  const tag = String(Date.now()).slice(-7);
  const P = `INC5nestP-${tag}`, C = `INC5nestC-${tag}`, CTRL = `INC5ctrl-${tag}`;
  const mkFolder = (name, nested) => page.request.post(`${BASE}/api/room/${ROOM}/folder`, { headers: { 'content-type': 'application/json' }, data: { name, nestedPath: nested, playerToken: SYS } }).then(r => r.status());
  const children = (ref) => page.evaluate(async (r) => { try { const j = await (await fetch(`/api/trace/children/${encodeURIComponent(r)}`)).json(); return (j.children || []).map(c => c.name); } catch { return []; } }, ref);

  R.pStatus = await mkFolder(P, '');                 // parent at Files root
  R.cStatus = await mkFolder(C, P);                  // child NESTED in parent (the add-folder-nest collapsed path)
  R.ctrlStatus = await mkFolder(CTRL, '');           // control: another root folder (must NOT appear under parent)
  await sleep(1500);
  const underParent = await children(`roomcoll:${ROOM}:files/${P}`);
  const atRoot = await children(`roomcoll:${ROOM}:files`);
  R.childUnderParent = underParent.includes(C);      // the nested edge landed
  R.ctrlNotUnderParent = !underParent.includes(CTRL); // failable control
  R.parentAtRoot = atRoot.includes(P);
  R.pass = R.pStatus === 200 && R.cStatus === 200 && R.childUnderParent && R.ctrlNotUnderParent && R.parentAtRoot;
} catch (e) { R.error = String(e.message || e); R.pass = false; }
finally { await browser.close(); }

console.log(`=== R40.106 INC-5 add-folder-nest (collapsed create-path) — served ${R.served}, room 909f1bd6 ===`);
console.log(`  parent-create=${R.pStatus} child-create=${R.cStatus} | child-nested-under-parent=${R.childUnderParent} parent-at-root=${R.parentAtRoot} control-not-nested=${R.ctrlNotUnderParent} => ${R.pass ? 'GREEN' : 'RED'}${R.error ? ' err=' + R.error : ''}`);
console.log(R.pass ? 'GREEN — add-folder-nest lands the child edge under its parent via the collapsed FolderService.linkIn; control isolates.' : 'RED');
process.exit(R.pass ? 0 : 1);
