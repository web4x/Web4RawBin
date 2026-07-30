// R32.4 MDA SVG-diagram-in-drawer — INDEPENDENT gate (own oracle + planted-defect bite), DET-3x. served==HEAD==v0.8.4.
// R32.4 = the diagram surface is a DRAWER detail-view (rb-diagram-detail, additive tagMap, standard renderDetailForRef —
// NO overlay/fork). Impl ba96a744 = DiagramViewModel.buildDiagramSvg (EXPORTED pure fn → I import + run the REAL code).
// Nodes come from view-LINKS (R25.7 position on the link, unit untouched); UML boxes = name/attr/method compartments +
// M2-facet kind (interface→«interface»); EDGES/relationship views EXCLUDED (R32.6). Surface renders 0 views on prod
// by-design (R32.5 populates) → gate the SHAPE/logic. Measured DIFFERENTLY than expert tsx: import + bites + source-audit
// + live component-registered + regression.
import { buildDiagramSvg, type ViewLink, type DiagramNode } from '../../src/public/ts/trace/diagram-view-model.ts';
import { readFileSync } from 'node:fs';
import https from 'node:https';
import { chromium } from '@playwright/test';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const httpGet = (path: string): Promise<{ status: number; body: string }> => new Promise((res) => { const rq = https.request({ host: 'prod.wo-da.de', port: 4444, path, rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', (c) => b += c); r.on('end', () => res({ status: r.statusCode || 0, body: b })); }); rq.on('error', () => res({ status: 0, body: '' })); rq.end(); });

// ── Part A: run the REAL buildDiagramSvg against a synthetic view-set + PLANTED-DEFECT BITES (own oracle) ──
function partA() {
  const nodeOf = (u: string): DiagramNode | null => (({
    foo: { name: 'Foo', kind: 'class', attrs: ['a: number', 'b: string'], methods: ['greet', 'run'] },
    iface: { name: 'Barable', kind: 'interface', attrs: [], methods: ['bar'] },
  } as Record<string, DiagramNode>)[u] || null);
  const views: ViewLink[] = [
    { unit: 'ior:instance:foo', x: 50, y: 70, viewKind: 'class' },      // class box at the view-link x,y
    { unit: 'iface', x: 300, y: 70, viewKind: 'interface' },            // interface box (stereotype)
    { unit: 'edgeRel', x: 0, y: 0, viewKind: 'relationship' },          // ★ EDGE → must be EXCLUDED (R32.6)
    { unit: 'ghost', x: 500, y: 0, viewKind: 'class' },                 // ★ unresolved (nodeOf null) → skipped
  ];
  const { svg, count } = buildDiagramSvg(views, nodeOf);
  return {
    count2: count === 2,                                               // only foo + iface
    edgeExcluded: !svg.includes('edgeRel'),                            // ★ bite: relationship view NOT rendered (R32.6)
    unresolvedSkipped: !svg.includes('ghost'),                         // ★ bite: null-node view skipped
    positionOnLink: svg.includes('translate(50,70)') && svg.includes('translate(300,70)'), // AC3 pos from the LINK (R25.7)
    compartments: svg.includes('Foo') && svg.includes('a: number') && svg.includes('greet()'), // AC2 name/attr/method rows
    interfaceStereo: svg.includes('«interface» Barable'),             // AC2 M2 facet kind → stereotype
    selectTarget: svg.includes('data-ref="modelelement:foo"'),        // AC6 box carries the shared-drawer select target
    svgRoot: /^<svg class="dm-svg"[^>]*viewBox=/.test(svg),           // valid SVG surface
  };
}

// ── Part B: source-audit the SHAPE (additive tagMap / no fork / RbPanZoom reuse / resize-fit / R32.6 edges-deferred) ──
function partB() {
  const drawer = readFileSync(`${REPO}/src/public/ts/trace/rb-detail-drawer.ts`, 'utf8');
  const dd = readFileSync(`${REPO}/src/public/ts/trace/rb-diagram-detail.ts`, 'utf8');
  const vm = readFileSync(`${REPO}/src/public/ts/trace/diagram-view-model.ts`, 'utf8');
  return {
    tagMapAdditive: /diagram:\s*'rb-diagram-detail'/.test(drawer) && /tagMap\[type\]\s*\|\|\s*'rb-detail-view'/.test(drawer), // AC1 additive, standard renderDetailForRef fallback
    noFork: /import '\.\/rb-diagram-detail/.test(drawer) && !/overlay/i.test(dd.slice(0, 400)),                              // AC1 drawer self-imports; not an overlay component
    panZoomReuse: /RbPanZoom|rb-pan-zoom|PanZoom/.test(dd),                                                                   // AC4 reuse RbPanZoom
    resizeFit: /ResizeObserver|resize|fit\(|preserveAspectRatio/.test(dd) || /preserveAspectRatio="xMidYMid meet"/.test(vm), // AC5 resize→fit
    edgesR326: /relationship views = R32\.6|R32\.6.*skip|both skipped here/.test(vm),                                          // AC7 edges deferred to R32.6 (by construction)
  };
}

async function partC(browser: any) {
  // AC1/AC4: the additive component actually ships + is a registered custom element on the shared /trace surface (no fork).
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto('https://prod.wo-da.de:4444/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
  const defined = await page.evaluate(() => ({ diagram: !!customElements.get('rb-diagram-detail'), drawer: !!customElements.get('rb-detail-drawer') }));
  await ctx.close();
  return defined;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results: boolean[] = [];
try {
  const cfg = await httpGet('/api/config'); const ver = (() => { try { return JSON.parse(cfg.body).version; } catch { return null; } })();
  const sw = await httpGet('/sw.js'); const swv = (sw.body.match(/CACHE_NAME\s*=\s*'([^']+)'/) || [])[1];
  const verOk = ver === '0.8.4' && swv === 'rawbin-v0.8.4';
  const a = partA(); const aOk = Object.values(a).every(Boolean);
  const b = partB(); const bOk = Object.values(b).every(Boolean);
  console.log(`ver=${ver}/sw=${swv} verOk=${verOk} | A(import+bite)=${JSON.stringify(a)} aOk=${aOk} | B(audit)=${JSON.stringify(b)} bOk=${bOk}`);
  if (!verOk) { console.log('ABORT phantom-guard: served != v0.8.4'); process.exitCode = 1; }
  else {
    for (let i = 1; i <= 3; i++) {
      const c = await partC(browser); const cOk = c.diagram && c.drawer;               // AC1 component registered (additive)
      const trace = await httpGet('/trace'); const whoami = await httpGet('/api/server-manager/whoami');
      const regressionOk = trace.status === 200 && whoami.status === 403;               // AC8 shared-drawer regression
      const pass = verOk && aOk && bOk && cOk && regressionOk;
      results.push(pass);
      console.log(`iter ${i}: A=${aOk} B=${bOk} | client-registered=${cOk}(${JSON.stringify(c)}) | regression /trace=${trace.status} whoami=${whoami.status}=${regressionOk} => ${pass ? 'GREEN' : 'RED'}`);
    }
  }
} finally { await browser.close(); }

console.log('\n===== R32.4 diagram-in-drawer INDEPENDENT gate (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
if (process.exitCode !== 1) process.exitCode = green ? 0 : 1;
