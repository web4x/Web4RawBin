// R33.6 item-4 — INDEPENDENT @390 component-harness gate (expert skipped self-verify → authoritative). DET-3x.
// RbModelElementDetail.renderPumlSource (Impl b0c0d27d): a puml-src:<relpath> FOLDER itemview renders the EXISTING
// authored .puml as SVG (was 'not found'). Chain (INV-P1.1/2/3, read-only no-fork): GET /md/scrum.pmo/sprints/<relpath>
// (raw .puml) → POST /api/puml-render → <svg> injected into the detail. PLANTED-DEFECT: a bogus relpath → GET 404 →
// NO svg (the old 'not found' path). Uses a REAL puml-src relpath discovered from the live /api/trace/children/rawbin:puml.
// Mount rb-modelelement-detail @390 iPhone-12 (component-harness). Read-only (GET raw + render POST; no writes, no mount pollution).
// Client bundle = committed HEAD build (v0.8.25); served SW rawbin-v0.8.25 (phantom-guard: gate the BUNDLE not /api/config). node22.
// [test:uuid:478d8204-e6fa-43c8-9c54-ca7610dbaa6f] placed on GREEN → req mints onto Impl b0c0d27d.
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
import { chromium, webkit, devices } from '@playwright/test';
const ENGINE = process.env.WK ? webkit : chromium; // WK=1 → real Safari @390 (Tron-facing visual; WebKit≠chromium false-green class)
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r3364') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TARGET = process.env.R3364_TARGET || '0.8.38'; // PO: gate the SERVED docker-render (phantom-guard — BUG-B fix + plantuml docker land at v0.8.38)
const served = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
if (served !== TARGET) { console.log(`⚠ PHANTOM-GUARD: served=${served} != TARGET=${TARGET} — ABORT (don't credit a stale/mid-restart render).`); process.exit(1); }
console.log(`served==${TARGET} verified. engine=${process.env.WK ? 'webkit' : 'chromium'}`);
// PIXEL-sample (PO: assert the SVG is VISIBLY rendered, not just DOM-present): screenshot the svg element → decode
// in-browser (Image→canvas→getImageData) → count pixels FAR from the #0d1117 bg. A real PlantUML diagram = many.
const pixelNonBg = async (page) => { const h = await page.$('#md svg'); if (!h) return 0; let buf; try { buf = await h.screenshot(); } catch { return 0; }
  return page.evaluate((b64) => new Promise(res => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0, t = d.length / 4; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 13) + Math.abs(d[i + 1] - 17) + Math.abs(d[i + 2] - 23) > 60) n++; res(t ? n / t : 0); }; img.onerror = () => res(0); img.src = 'data:image/png;base64,' + b64; }), buf.toString('base64')); };

// CLEAN shell (route-fulfilled) so the model bundle loads into a FRESH custom-element registry — injecting it onto the
// real /trace throws "rb-compartment already registered" (first-wins define), which aborts the module → renderPumlSource
// never runs (empty #md). Mirror r335c's serve-shell approach.
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body style="margin:0;background:#0d1117"><script type="module" src="${BUNDLE}"></script></body></html>`;
async function mountDetail(browser, ref) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route(u => u.pathname === '/trace', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-modelelement-detail'), { timeout: 15000 }).catch(() => {});
  await page.evaluate((r) => {
    document.body.style.margin = '0'; document.body.innerHTML = '';
    const d = document.createElement('rb-modelelement-detail');
    d.id = 'md'; d.style.cssText = 'display:block;position:fixed;inset:0;background:#0d1117;overflow:auto';
    document.body.appendChild(d); d.setAttribute('ref', r);
  }, ref);
  await sleep(2200); // GET raw .puml → POST /api/puml-render → inject svg
  return { ctx, page };
}
const svgInfo = (page) => page.evaluate(() => {
  const host = document.querySelector('#md'); const svg = host && host.querySelector('svg');
  return { hasSvg: !!svg, w: svg ? Math.round(svg.getBoundingClientRect().width) : 0, nodes: svg ? svg.querySelectorAll('*').length : 0,
    text: (host?.textContent || '').slice(0, 60).replace(/\s+/g, ' ') };
});

async function happyOnce(browser, i, relPath) {
  const { ctx, page } = await mountDetail(browser, `puml-src:${relPath}`);
  const s = await svgInfo(page);
  const pxFrac = Number((await pixelNonBg(page)).toFixed(4)); // PO pixel-sample: SVG visibly rendered
  if (i === 1) await page.screenshot({ path: OUT + '01-puml-svg.png' });
  await ctx.close();
  return { okHasSvg: s.hasSvg, okW: s.w, okNodes: s.nodes, okPxFrac: pxFrac, okText: s.text };
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
// discover a REAL puml-src relpath from the live server (ungated enumeration)
const disc = await (async () => {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true }); const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  const rel = await page.evaluate(async () => { const t = await (await fetch('/api/trace/children/rawbin:puml')).text(); const m = t.match(/puml-src:([^"]+\.puml)/); return m ? m[1] : ''; });
  await ctx.close(); return rel;
})();
const runs = []; let biteHasSvg = null;
try {
  if (!disc) { console.log('SETUP-FAIL: no puml-src relpath found'); }
  else {
    for (let i = 1; i <= 3; i++) runs.push(await happyOnce(browser, i, disc));           // DET-3x happy
    const { ctx, page } = await mountDetail(browser, 'puml-src:__nonexistent__/__bogus__.puml'); // planted-defect once (deterministic)
    biteHasSvg = (await svgInfo(page)).hasSvg; await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R33.6 item-4 puml-source render @390 iPhone-12 (DET-3x) =====');
console.log('relpath:', disc);
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
console.log('planted bite (bogus relpath) hasSvg:', biteHasSvg);
// real .puml → SVG DOM (nodes) + real SIZE + VISIBLY rendered pixels (PO pixel-sample). Threshold 0.3%: a PlantUML LINE
// diagram is mostly whitespace/thin-strokes → measured ~0.75% non-bg; blank/planted = 0% → 0.3% separates cleanly.
const render = runs.length === 3 && runs.every(R => R.okHasSvg === true && R.okNodes > 20 && R.okW > 100 && R.okPxFrac > 0.003);
const bite = biteHasSvg === false;                                                          // bogus relpath → no SVG (old 'not found')
console.log(`\nINV-P1 puml-src renders existing .puml as SVG: ${render ? 'GREEN DET-3x' : 'RED'}`);
console.log(`PLANTED-DEFECT bite (bogus relpath → no SVG): ${bite ? 'GREEN' : 'RED'}`);
console.log('OVERALL item-4:', render && bite ? 'GREEN DET-3x' : 'RED');
process.exitCode = render && bite ? 0 : 1;
