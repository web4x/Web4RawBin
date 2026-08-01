// R33.9 — RbDiagramDetail.broadcastActiveDiagram (Impl 5150477e) @390 COMPONENT-harness gate, DET-3x independent.
// The 5th chain: rb-diagram-detail connectedCallback → broadcastActiveDiagram(uuid) dispatches rb-active-diagram{uuid}
// (this diagram is now the ACTIVE membership target); disconnectedCallback → broadcastActiveDiagram(null) (verbs hide).
// Gate the DISPATCHER directly: mount the component → assert rb-active-diagram fires with detail.uuid === the diagram uuid;
// remove it → assert rb-active-diagram fires with detail.uuid === null. Non-vacuous: mount carries the REAL uuid (not null),
// unmount carries null (opposite). Read-only (event dispatch only, no writes, no /model, no owner). served==HEAD==0.8.37.
// [test:uuid:8f33daf4-c1f7-4812-80ef-b111157a71a6] R33.9 RbDiagramDetail.broadcastActiveDiagram (Impl 5150477e) @390 DET-3x:
// mount → rb-active-diagram{uuid==diagram}; unmount → rb-active-diagram{uuid==null}. Component-harness, read-only.
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runOnce(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  // install the listener BEFORE the element connects → capture the mount broadcast
  await page.evaluate(() => { document.body.innerHTML = ''; window.__active = []; document.addEventListener('rb-active-diagram', e => window.__active.push(e.detail && 'uuid' in e.detail ? e.detail.uuid : 'MISSING')); });
  // MOUNT → connectedCallback → broadcastActiveDiagram(uuid)
  await page.evaluate((u) => { const d = document.createElement('rb-diagram-detail'); d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u); document.body.appendChild(d); }, DIAG);
  await sleep(700);
  const onMount = await page.evaluate(() => window.__active.slice());
  // UNMOUNT → disconnectedCallback → broadcastActiveDiagram(null)
  await page.evaluate(() => { window.__active = []; document.getElementById('dg').remove(); });
  await sleep(400);
  const onUnmount = await page.evaluate(() => window.__active.slice());
  await ctx.close();
  return { onMount, onUnmount };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const runs = [];
try { for (let i = 0; i < 3; i++) runs.push(await runOnce(browser)); }
finally { await browser.close(); }

console.log('\n===== R33.9 broadcastActiveDiagram @390 iPhone-12 (DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: mount=${JSON.stringify(R.onMount)} unmount=${JSON.stringify(R.onUnmount)}`));
const mountOk = runs.every(R => R.onMount.includes(DIAG) && !R.onMount.includes(null)); // mount broadcasts the REAL uuid, never null
const unmountOk = runs.every(R => R.onUnmount.length > 0 && R.onUnmount.every(u => u === null)); // unmount broadcasts null
const green = runs.length === 3 && mountOk && unmountOk;
console.log(`\nMOUNT → rb-active-diagram{uuid==diagram}: ${mountOk ? 'GREEN' : 'RED'}`);
console.log(`UNMOUNT → rb-active-diagram{uuid==null}: ${unmountOk ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.9 broadcastActiveDiagram:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
