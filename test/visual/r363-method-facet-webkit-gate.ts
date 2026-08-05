// R36.3 method-facet signature render — INDEPENDENT tester gate, @390 real-WebKit + served re-generate, DET-3x.
// Chains (req mint 1470075c8): enrichMethodSignature 68d1997e RIDES generate 382f8644 (data) + renderMethodFacet d8818494
// RIDES renderFacet 94ad4f50 (render). 3 distinct-intent Tests to wire on GREEN: T1 data-extract@382f8644,
// T2 signature-CONTENT-render@94ad4f50, T3 mvf (Method-vs-Function). Markers HELD until GREEN → req wires.
//
// AXIS-A (T1 data-extract + T3 mvf) — SERVED RE-GENERATE (the real enrich; the live M1 units are STALE pre-enrich, no
//   signature — exactly the data-freshness prereq): POST /api/model/generate {fixture} → the class-METHOD carries
//   visibility+parameters+returnType+parentClass ⇒ instanceOf UmlMethod; the top-level FUNCTION carries params/returnType
//   ⇒ instanceOf UmlFunction, NO parentClass. Cross-checked against a real stale unit (mvf classification holds pre-enrich).
//   POLLUTION-SAFE: snapshot MODEL_STORE shard-set, restore (delete non-baseline) in finally; prod scenario/index untouched.
// AXIS-B (T2 signature-CONTENT-render) — @390 real-WebKit facet-probe: renderFacet paints the ENRICHED signature
//   'visibility name(params): returnType' (sigOf), pixel-visible; BITE: a node with NO signature → bare 'name()' fallback.
// served-confirm/phantom-guard: served==HEAD==0.8.59. real-iOS-TAP fire = Tron device.
//
// [test:uuid:PENDING-T1] R36.3 data-extract (TsToModel.generate 382f8644) — re-generate enriches method/function signature
// [test:uuid:PENDING-T2] R36.3 signature-CONTENT render (renderFacet 94ad4f50) — facet paints 'visibility name(params): returnType' @390 WebKit
// [test:uuid:PENDING-T3] R36.3 Method-vs-Function — parentClass PRESENT ⇒ UmlMethod, ABSENT ⇒ UmlFunction
import { keyToUuid } from '../../src/ts/scenario/TsToModel.ts';
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R363_TARGET || '0.8.59';
const SP = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad';
const FACET_BUNDLE = fs.readFileSync(path.join(SP, 'facet-probe.bundle.js'), 'utf8');
const OUT = path.join(ROOT, 'test-results/r363-method-facet') + '/'; fs.mkdirSync(OUT, { recursive: true });
const STORE = path.join(ROOT, 'data/model-store/index');
const UML_METHOD = 'a1d2e3f4-0000-4a1b-8c2d-000000000006', UML_FUNCTION = 'a1d2e3f4-0000-4a1b-8c2d-000000000008';
const FIXREL = 'test/fixtures/r363-sig-fixture.ts';
// deterministic unit uuids (keyToUuid(rel::qname) — same formula the server uses)
const U_GREET = keyToUuid(`${FIXREL}::Greeter.greet`), U_TALLY = keyToUuid(`${FIXREL}::tallyUp`);

const http = (method: string, p: string, body?: any): Promise<{ status: number; json: any }> => new Promise((res) => {
  const data = body ? JSON.stringify(body) : undefined;
  const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: p, method, rejectUnauthorized: false, headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, (r) => { let b = ''; r.on('data', (c) => b += c); r.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: r.statusCode || 0, json: j }); }); });
  q.on('error', () => res({ status: 0, json: null })); if (data) q.write(data); q.end();
});
const served: string = (await http('GET', '/api/config')).json?.version || '?';
console.log(served === TARGET ? `served==${TARGET} verified — SERVED verdict on real-WebKit.` : `⚠ PHANTOM-GUARD: served=${served} != ${TARGET}.`);

// sigOf — faithful replica of rb-diagram-detail.ts:126 (composes DiagramNode.signature renderMethodFacet paints)
function sigOf(m: any): string | undefined {
  const k = String(m?.kind || '');
  if (k !== 'method' && k !== 'function' && m?.parameters === undefined && m?.returnType === undefined) return undefined;
  const vis = m.visibility ? String(m.visibility) + ' ' : '';
  const params = Array.isArray(m.parameters) ? m.parameters.map((p: any) => typeof p === 'string' ? p : `${p?.name ?? ''}${p?.type ? ': ' + p.type : ''}`).join(', ') : '';
  const ret = m.returnType ? ': ' + String(m.returnType) : '';
  return `${vis}${String(m.name || '')}(${params})${ret}`;
}
const snapStore = (): Set<string> => { const s = new Set<string>(); const walk = (d: string) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : s.add(p); } }; walk(STORE); return s; };

// ── AXIS-A: served re-generate → enriched signature + mvf ──
async function dataAxis() {
  const baseline = snapStore();
  let genOk = false, greet: any = null, tally: any = null, genErr = '';
  try {
    const gen = await http('POST', '/api/model/generate', { file: FIXREL });
    genOk = gen.status === 200 && gen.json?.ok === true;
    if (!genOk) genErr = `HTTP ${gen.status} ${JSON.stringify(gen.json)}`;
    greet = (await http('GET', `/api/ior/${U_GREET}`)).json?.unit?.model || null;
    tally = (await http('GET', `/api/ior/${U_TALLY}`)).json?.unit?.model || null;
  } finally {
    // restore: delete every store file NOT in the baseline (the fixture's units + demo diagram)
    for (const f of snapStore()) if (!baseline.has(f)) { try { fs.unlinkSync(f); } catch { /* */ } }
  }
  const J = (x: any) => JSON.stringify(x || null);
  // T1: method carries full signature fields (the enrich)
  const greetEnriched = !!greet && greet.kind === 'method' && greet.visibility === 'public' && greet.returnType === 'void' && greet.parameters?.[0]?.name === 'name' && greet.parameters?.[0]?.type === 'string' && !!greet.parentClass;
  const tallyEnriched = !!tally && tally.kind === 'function' && tally.returnType === 'string' && tally.parameters?.length === 2;
  // T3 mvf: method ⇒ UmlMethod + parentClass ; function ⇒ UmlFunction + NO parentClass
  const mvf = !!greet && !!tally && J(greet.instanceOf).includes(UML_METHOD) && !J(greet.instanceOf).includes(UML_FUNCTION) && !!greet.parentClass
    && J(tally.instanceOf).includes(UML_FUNCTION) && !J(tally.instanceOf).includes(UML_METHOD) && !tally.parentClass;
  const prodClean = !fs.existsSync(path.join(ROOT, 'scenario/index', ...U_GREET.slice(0, 5).split(''), `${U_GREET}.scenario.json`)); // prod scenario/index NEVER got the fixture unit
  const greetSig = sigOf(greet), tallySig = sigOf(tally);
  const sigOk = greetSig === 'public greet(name: string): void' && tallySig === 'public tallyUp(x: number, y: number): string';
  return { genOk, genErr, greetEnriched, tallyEnriched, mvf, prodClean, sigOk, greetSig, tallySig, ok: genOk && greetEnriched && tallyEnriched && mvf && prodClean && sigOk };
}

// ── AXIS-B: signature-CONTENT render @390 real-WebKit ──
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css">`
  + `<style>body{margin:0;background:#0d1117}svg .dm-box-bg{fill:#1e2633;stroke:#7aa2f7;stroke-width:1.5}svg .dm-name{fill:#e6edf3;font:12px system-ui}svg .dm-row{fill:#c0caf5;font:11px monospace}svg .dm-sep{stroke:#30363d}</style>`
  + `</head><body><svg id="surface" width="800" height="600" viewBox="0 0 800 600"></svg></body></html>`;
async function renderAxis(browser: any, sigs: { greet?: string; func?: string }, shot: boolean) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route((u: URL) => u.pathname === '/facet', (r: any) => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/facet`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ content: FACET_BUNDLE, type: 'module' });
  await page.waitForFunction(() => (window as any).__facet && typeof (window as any).__facet.renderFacet === 'function', { timeout: 8000 }).catch(() => {});
  const cases = [
    { key: 'method', viewKind: 'UmlMethod', node: { name: 'greet', kind: 'method', signature: sigs.greet, attrs: [], methods: [], members: [], relations: [] }, want: 'greet(name: string): void' },
    { key: 'function', viewKind: 'UmlFunction', node: { name: 'tallyUp', kind: 'function', signature: sigs.func, attrs: [], methods: [], members: [], relations: [] }, want: 'tallyUp(x: number, y: number): string' },
    { key: 'bite-nosig', viewKind: 'UmlMethod', node: { name: 'greet', kind: 'method', signature: undefined, attrs: [], methods: [], members: [], relations: [] }, want: 'greet()' },
  ];
  const per: any = {};
  for (const c of cases) {
    const r = await page.evaluate(([node, viewKind]: any) => {
      const view = { viewKind, unit: 'modelelement:u-' + node.name, x: 40, y: 40, w: 240 };
      let svg = ''; try { svg = (window as any).__facet.renderFacet(view, node); } catch (e) { return { err: String(e), svg: '' }; }
      document.getElementById('surface')!.innerHTML = svg;
      return { svg, isMethodBox: /dm-facet-method/.test(svg) };
    }, [c.node, c.viewKind]);
    const painted = await page.evaluate(async () => {
      const svg = document.getElementById('surface')!; const xml = new XMLSerializer().serializeToString(svg);
      const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
      const img = new Image(); await new Promise((rr) => { img.onload = rr; img.onerror = rr; img.src = url; });
      const cv = document.createElement('canvas'); cv.width = 320; cv.height = 200; const cx = cv.getContext('2d')!; cx.drawImage(img, 0, 0);
      const d = cx.getImageData(40, 50, 260, 40).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 40 && (Math.abs(d[i] - 13) + Math.abs(d[i + 1] - 22) + Math.abs(d[i + 2] - 33)) > 40) n++; }
      return n;
    });
    if (shot) await page.screenshot({ path: OUT + `${c.key}.png` });
    const contentOk = (r.svg || '').includes(c.want);
    const notFallbackLeak = c.key === 'bite-nosig' ? !/name: string|: void/.test(r.svg || '') : true;
    per[c.key] = { contentOk, painted, paintedOk: painted > 20, isMethodBox: r.isMethodBox, notFallbackLeak, ok: contentOk && painted > 20 && r.isMethodBox && notFallbackLeak };
  }
  await ctx.close();
  return per;
}

const browser = await webkit.launch({ headless: true });
const dataRuns: any[] = [], renderRuns: any[] = [];
try {
  const d0 = await dataAxis();
  for (let i = 1; i <= 3; i++) {
    dataRuns.push(i === 1 ? d0 : await dataAxis());
    renderRuns.push(await renderAxis(browser, { greet: d0.greetSig, func: d0.tallySig }, i === 1));
  }
} finally { await browser.close(); }

console.log(`\n===== R36.3 method-facet signature render — real-WebKit @390 DET-3x (served ${served}) =====`);
console.log(`AXIS-A[0] data/mvf: ${JSON.stringify(dataRuns[0])}`);
console.log(`AXIS-B[0] render:   ${JSON.stringify(renderRuns[0])}`);
const dataGreen = dataRuns.length === 3 && dataRuns.every((r) => r.ok);
const renderGreen = renderRuns.length === 3 && renderRuns.every((r) => r.method?.ok && r.function?.ok && r['bite-nosig']?.ok);
console.log(`(T1 data-extract + T3 mvf) served re-generate: ${dataGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`(T2 signature-CONTENT render @390 WebKit, screenshot): ${renderGreen ? 'GREEN DET-3x' : 'RED'}`);
const green = served === TARGET && dataGreen && renderGreen;
console.log('OVERALL R36.3:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: real-iOS-TAP fire of the re-generate/facet interaction = Tron @390 device (PO split); this gates the enrich→render mechanism.');
process.exitCode = green ? 0 : 1;
