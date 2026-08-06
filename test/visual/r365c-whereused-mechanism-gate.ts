// T36.5 Where-used DISPLAY mechanism — INDEPENDENT tester gate, @390 real-WebKit, DET-3x, served v0.8.64.
// The display is built in rb-modelelement-detail.ts:70-84 (impl 7e147ad8): a "Where used" section that LISTS m.usedIn as
// .dv-link rows (diagram → drill diagram:<uuid> via selectionModel.replaceWith) or "Not used" when empty. m.usedIn is the
// R36.2 off-element side-index MERGED onto /api/ior (compute-on-read). I gate the MECHANISM engine-side by mounting the
// component STANDALONE (non-owner /api/ior) with real usedIn data — USED element → LISTS the diagram + correct drill ref;
// UNUSED → "Not used". ★ The owner-gated /model PAGE render (403 non-owner) I CANNOT see → FLAGGED for Tron device-verify
// (do NOT false-green what I can't render — iOS-webkit-split). Pollution-safe: add/remove-view net-zero + usage-index restore.
// [test:uuid:84fbf58f-716c-4694-92d6-db30baa1d665] T36.5 where-used DISPLAY mechanism (RbModelElementDetail.render 7e147ad8) — a USED element renders the "Where used" section LISTING the diagram as a .dv-link with the correct drill ref (diagram:<uuid> → selectionModel.replaceWith); an UNUSED element renders "Not used". @390 real-WebKit, distinct-intent (DISPLAY, NOT the R36.5 backend resolver 2f44e112/af74aef0 nor renderFacet e21b876d); owner-gated /model page render = Tron device.
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R365C_TARGET || '0.8.64';
const USAGE = path.join(ROOT, 'data/model-store/usage-index.json');
const OUT = path.join(ROOT, 'test-results/r365c-whereused') + '/'; fs.mkdirSync(OUT, { recursive: true });
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const E = '666daa9b-cdb3-4b9d-afee-4f65aab61206';   // a real modelelement (class)
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css">`
  + `<style>body{margin:0;background:#0d1117;color:#e6edf3}.dv-link{padding:6px;border:1px solid #30363d;margin:3px;border-radius:4px}.dv-empty{color:#8b949e;padding:6px}h4{color:#8b949e}</style>`
  + `<script type="module" src="/dist/model-AKLNZTFB.js"></script></head><body><div id="host" style="padding:12px"></div></body></html>`;

const http = (method: string, p: string, body?: any): Promise<number> => new Promise((res) => {
  const data = body ? JSON.stringify(body) : undefined;
  const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: p, method, rejectUnauthorized: false, headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, (r) => { r.on('data', () => { }); r.on('end', () => res(r.statusCode || 0)); });
  q.on('error', () => res(0)); if (data) q.write(data); q.end();
});
const served = await new Promise<string>((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', (c) => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
console.log(served === TARGET ? `served==${TARGET} verified — SERVED verdict on real-WebKit.` : `⚠ PHANTOM-GUARD: served=${served} != ${TARGET}.`);

async function iter(page: any, shot: boolean) {
  const usageBefore = fs.existsSync(USAGE) ? fs.readFileSync(USAGE) : null;
  let usedRes: any = {}, unusedRes: any = {};
  try {
    // USED: add-view → element gains usedIn → mount lists the diagram drill link
    await http('POST', '/api/model/diagram/add-view', { diagramUuid: DIAG, elementUuid: E });
    usedRes = await page.evaluate((eluuid: string) => new Promise<any>((resolve) => {
      const host = document.getElementById('host')!; host.innerHTML = '';
      const el = document.createElement('rb-modelelement-detail'); host.appendChild(el);
      el.setAttribute('ref', 'modelelement:' + eluuid);
      setTimeout(() => {
        const html = el.innerHTML;
        const diagLink = el.querySelector('.dv-link[data-ref^="diagram:"]') as HTMLElement | null;
        let drill = ''; if (diagLink) { try { drill = diagLink.getAttribute('data-ref') || ''; diagLink.click(); } catch { /* */ } }
        resolve({ hasWhereUsed: /Where used/i.test(html), listsDiagram: !!diagLink, drill, notUsed: /Not used/i.test(html), bodyLen: html.length });
      }, 1500);
    }), E);
    if (shot) await page.screenshot({ path: OUT + 'used-390.png' });
    // UNUSED: remove-view → element has no usedIn → "Not used"
    await http('POST', '/api/model/diagram/remove-view', { diagramUuid: DIAG, elementUuid: E });
    unusedRes = await page.evaluate((eluuid: string) => new Promise<any>((resolve) => {
      const host = document.getElementById('host')!; host.innerHTML = '';
      const el = document.createElement('rb-modelelement-detail'); host.appendChild(el);
      el.setAttribute('ref', 'modelelement:' + eluuid);
      setTimeout(() => { const html = el.innerHTML; resolve({ hasWhereUsed: /Where used/i.test(html), notUsed: /Not used/i.test(html), listsDiagram: !!el.querySelector('.dv-link[data-ref^="diagram:"]') }); }, 1500);
    }), E);
    if (shot) await page.screenshot({ path: OUT + 'notused-390.png' });
  } finally {
    await http('POST', '/api/model/diagram/remove-view', { diagramUuid: DIAG, elementUuid: E }); // ensure net-zero
    if (usageBefore) { try { fs.writeFileSync(USAGE, usageBefore); } catch { /* */ } }
  }
  const usedOk = usedRes.hasWhereUsed && usedRes.listsDiagram && /^diagram:/.test(usedRes.drill || '') && usedRes.drill.includes(DIAG) && !usedRes.notUsed;
  const unusedOk = unusedRes.hasWhereUsed && unusedRes.notUsed && !unusedRes.listsDiagram;
  return { usedRes, unusedRes, usedOk, unusedOk, ok: usedOk && unusedOk };
}

const browser = await webkit.launch({ headless: true });
const runs: any[] = [];
try {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route((u: URL) => u.pathname === '/whereused', (r: any) => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/whereused`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-modelelement-detail'), { timeout: 15000 }).catch(() => { });
  for (let i = 1; i <= 3; i++) runs.push(await iter(page, i === 1));
  await ctx.close();
} finally { await browser.close(); }

console.log(`\n===== T36.5 where-used mechanism — real-WebKit @390 DET-3x (served ${served}) =====`);
runs.forEach((r, i) => console.log(`iter ${i + 1}: used=${JSON.stringify(r.usedRes)} | unused=${JSON.stringify(r.unusedRes)} => ${r.ok ? 'GREEN' : 'RED'}`));
const green = served === TARGET && runs.length === 3 && runs.every((r) => r.ok);
console.log('OVERALL T36.5 where-used mechanism:', green ? 'GREEN DET-3x' : 'RED');
console.log('⚠ SCOPE: gated the DISPLAY MECHANISM (component lists diagram drill-link vs "Not used", non-owner /api/ior). The owner-gated /model PAGE render (403 non-owner) = TRON DEVICE-VERIFY — not false-greened here.');
process.exitCode = green ? 0 : 1;
