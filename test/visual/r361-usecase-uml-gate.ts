// R36.1 UseCase → UmlUseCase M2 projection (= the T36.1 systemic fix) — INDEPENDENT tester gate, @390 real-WebKit + data,
// DET-3x, served v0.8.64. projectUmlUseCase rides reconcileCanonical (server.ts:1289, compute-on-read) — UNIONs the
// UmlUseCase metaclass facet into a UseCase's instanceOf at READ time so renderFacet draws the ELLIPSE, WITHOUT writing
// the UseCase file (INV-T). Distinct-intent (T36.1 fix); NO cross-wire onto class Tests fb5ae5eb/e21b876d; verify-owner-first.
//
// AXIS-A (data, compute-on-read): real UseCases → /api/ior model.instanceOf ⊇ ior:instance:792cd09c (UmlUseCase M2);
//   INV-T byte-diff==0 (/api/ior twice byte-identical + on-disk UseCase file mtime UNCHANGED + file does NOT contain the
//   M2 uuid = projection never writes). BITE: a non-UseCase Class → instanceOf does NOT gain UmlUseCase (targeted, not blanket).
// AXIS-B (render, @390 real-WebKit): renderFacet(UmlUseCase) → dm-facet-usecase ELLIPSE, pixel-painted (reuse facet-probe).
// [test:uuid:e16322ff-69f1-46a0-99a1-125a3427dbe2] R36.1 UseCase→UmlUseCase M2 projection — real UseCase /api/ior instanceOf ⊇ 792cd09c (compute-on-read) + non-UseCase Class does NOT + INV-T byte-diff==0 (deterministic + file mtime unchanged + file has NO M2 uuid = never writes). DISTINCT-INTENT on Impl 37c08fd5 (projectUmlUseCase rides reconcileCanonical) — NOT fb5ae5eb (R36.2 counterpart-enrichment intent). This IS the T36.1 systemic fix.
// [test:uuid:751eca73-278e-4e9f-90d1-814148d4923f] R36.1 UmlUseCase ellipse render @390 real-WebKit — renderFacet draws the dm-facet-usecase ellipse for a UseCase view (pixel-painted). ⚠ req: renderFacet=94ad4f50 already carries e21b876d (5-facet paint incl ellipse) → decide DISTINCT-usecase-render Test vs drop-as-covered; do NOT double-credit.
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R361_TARGET || '0.8.64';
const SP = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad';
const FACET_BUNDLE = fs.readFileSync(path.join(SP, 'facet-probe.bundle.js'), 'utf8');
const OUT = path.join(ROOT, 'test-results/r361-usecase') + '/'; fs.mkdirSync(OUT, { recursive: true });
const UML_USECASE = '792cd09c-8a94-48da-abc6-b890d5f880ea';
const UC1 = '997ea6db-b586-472e-8024-55ae7e0699f5';   // real UseCase (verified projects)
const UC2 = '97015dcc-de18-4625-9025-f41a49682309';   // another real UseCase
const NON_UC = '97d6e2bf-6c02-4c36-82f6-c0c6178d1163'; // a Class — must NOT gain UmlUseCase (bite)
const shard = (u: string) => path.join(ROOT, 'scenario/index', ...u.slice(0, 5).split(''), `${u}.scenario.json`);

const http = (p: string): Promise<{ status: number; text: string }> => new Promise((res) => {
  const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: p, method: 'GET', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', (c) => b += c); r.on('end', () => res({ status: r.statusCode || 0, text: b })); });
  q.on('error', () => res({ status: 0, text: '' })); q.end();
});
const iorInstanceOf = async (u: string): Promise<{ has: boolean; raw: string }> => { const t = (await http(`/api/ior/${u}`)).text; let io: any[] = []; try { io = JSON.parse(t)?.unit?.model?.instanceOf || []; } catch { /* */ } return { has: io.some((x) => String(x).includes(UML_USECASE)), raw: t }; };

const served = (() => { try { return JSON.parse(''); } catch { return null; } })();
const servedV = (await http('/api/config')).text;
const sv = (() => { try { return JSON.parse(servedV).version; } catch { return '?'; } })();
console.log(sv === TARGET ? `served==${TARGET} verified — SERVED verdict on real-WebKit.` : `⚠ PHANTOM-GUARD: served=${sv} != ${TARGET}.`);

// ── AXIS-A: compute-on-read projection + INV-T ──
async function dataAxis() {
  const uc1 = await iorInstanceOf(UC1), uc2 = await iorInstanceOf(UC2), nonuc = await iorInstanceOf(NON_UC);
  const projects = uc1.has && uc2.has;                 // real UseCases GAIN UmlUseCase
  const biteTargeted = !nonuc.has;                     // a Class does NOT
  // INV-T: /api/ior deterministic (twice byte-identical) + on-disk file UNCHANGED + file does NOT contain the M2 uuid
  const mtimeBefore = fs.existsSync(shard(UC1)) ? fs.statSync(shard(UC1)).mtimeMs : 0;
  const a = (await http(`/api/ior/${UC1}`)).text, b = (await http(`/api/ior/${UC1}`)).text;
  const mtimeAfter = fs.existsSync(shard(UC1)) ? fs.statSync(shard(UC1)).mtimeMs : 0;
  const deterministic = a === b && a.length > 20;
  const fileNoWrite = mtimeBefore === mtimeAfter;
  const filePristine = fs.existsSync(shard(UC1)) && !fs.readFileSync(shard(UC1), 'utf8').includes(UML_USECASE); // projection is read-only
  return { projects, biteTargeted, deterministic, fileNoWrite, filePristine, ok: projects && biteTargeted && deterministic && fileNoWrite && filePristine };
}

// ── AXIS-B: UmlUseCase ellipse render @390 real-WebKit ──
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css">`
  + `<style>body{margin:0;background:#0d1117}svg .dm-box-bg{fill:#1e2633;stroke:#7aa2f7;stroke-width:1.5}svg .dm-name{fill:#e6edf3;font:12px system-ui}</style>`
  + `</head><body><svg id="surface" width="800" height="600" viewBox="0 0 800 600"></svg></body></html>`;
async function renderAxis(browser: any, shot: boolean) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route((u: URL) => u.pathname === '/facet', (r: any) => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/facet`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ content: FACET_BUNDLE, type: 'module' });
  await page.waitForFunction(() => (window as any).__facet && typeof (window as any).__facet.renderFacet === 'function', { timeout: 8000 }).catch(() => {});
  const r = await page.evaluate(() => {
    const node = { name: 'authenticateUser', kind: 'usecase', attrs: [], methods: [], members: [], relations: [] };
    const view = { viewKind: 'UmlUseCase', unit: 'modelelement:u-uc', x: 40, y: 40, w: 200 };
    let svg = ''; try { svg = (window as any).__facet.renderFacet(view, node); } catch (e) { return { err: String(e), svg: '' }; }
    document.getElementById('surface')!.innerHTML = svg;
    return { svg, hasEllipse: /<ellipse/.test(svg), hasUseCaseClass: /dm-facet-usecase/.test(svg), hasName: /authenticateUser/.test(svg) };
  });
  const painted = await page.evaluate(async () => {
    const svg = document.getElementById('surface')!; const xml = new XMLSerializer().serializeToString(svg);
    const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
    const img = new Image(); await new Promise((rr) => { img.onload = rr; img.onerror = rr; img.src = url; });
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 160; const cx = cv.getContext('2d')!; cx.drawImage(img, 0, 0);
    const d = cx.getImageData(30, 30, 220, 100).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 40 && (Math.abs(d[i] - 13) + Math.abs(d[i + 1] - 22) + Math.abs(d[i + 2] - 33)) > 40) n++; }
    return n;
  });
  if (shot) await page.screenshot({ path: OUT + 'usecase-ellipse-390.png' });
  await ctx.close();
  return { hasEllipse: r.hasEllipse, hasUseCaseClass: r.hasUseCaseClass, hasName: r.hasName, painted, ok: r.hasEllipse && r.hasUseCaseClass && r.hasName && painted > 20 };
}

const browser = await webkit.launch({ headless: true });
const dataRuns: any[] = [], renderRuns: any[] = [];
try { for (let i = 1; i <= 3; i++) { dataRuns.push(await dataAxis()); renderRuns.push(await renderAxis(browser, i === 1)); } } finally { await browser.close(); }

console.log(`\n===== R36.1 UseCase→UmlUseCase (T36.1 fix) — real-WebKit @390 DET-3x (served ${sv}) =====`);
console.log(`AXIS-A[0] data: ${JSON.stringify(dataRuns[0])}`);
console.log(`AXIS-B[0] render: ${JSON.stringify(renderRuns[0])}`);
const dataGreen = dataRuns.length === 3 && dataRuns.every((r) => r.ok);
const renderGreen = renderRuns.length === 3 && renderRuns.every((r) => r.ok);
console.log(`(A projection+INV-T) data: ${dataGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`(B ellipse render @390 WebKit): ${renderGreen ? 'GREEN DET-3x' : 'RED'}`);
const green = sv === TARGET && dataGreen && renderGreen;
console.log('OVERALL R36.1:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
