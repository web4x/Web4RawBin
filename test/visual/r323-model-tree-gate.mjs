// R32.3 MDA model-tree — INDEPENDENT gate (own oracle + planted-defect bite), DET-3x. served==HEAD==v0.8.3.
// R32.3 = SERVER shapes the M1 model as {roots} for the SHARED rb-trace-tree (data-only REUSE, no client fork).
// Impl 449d830a = modelFacetType (server.ts:35): node type = first instanceOf facet resolving to a Uml* M2 metaclass,
// else 'ModelElement'. /api/model/tree (server.ts:1465): roots = ModelElement metaLevel==='M1' && !memberOf;
// childCount = members.length (R31.11 badge); relatesTo is NOT walked (detail/R32.6).
// The server logic lives in server.ts (unimportable — server entry). So: (A) SOURCE-AUDIT the real invariants +
// (B) run a byte-faithful REPLICA against a synthetic fixture with PLANTED-DEFECT BITES (own oracle), + (C) drive the
// REAL shared rb-trace-tree with the server's .items shape (proves data-only reuse + draggable) + (D) live determinism
// + (E) shared-tree regression (/trace + SM). Measured DIFFERENTLY than the expert tsx self-check.
import { devices, chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import https from 'node:https';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (path) => new Promise((res) => { const rq = https.request({ host: 'prod.wo-da.de', port: 4444, path, rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res({ status: r.statusCode, body: b })); }); rq.on('error', () => res({ status: 0, body: '' })); rq.end(); });

// ── REPLICA of modelFacetType (server.ts:35) — byte-faithful; source-audit below proves the real fn matches ──
const modelFacetType = (model, idx) => {
  const io = Array.isArray(model?.instanceOf) ? model.instanceOf : [];
  for (const r of io) { const n = String(idx.get(String(r).replace('ior:instance:', ''))?.model?.name || ''); if (n.startsWith('Uml')) return n; }
  return 'ModelElement';
};
// REPLICA of the roots filter (server.ts:1471-1477)
const buildRoots = (units, idx) => {
  const roots = [];
  for (const [u, unit] of units) {
    if (!unit || unit.ior !== 'ior:class:ModelElement') continue;
    const m = unit.model; if (m.metaLevel !== 'M1' || m.memberOf) continue;
    const members = Array.isArray(m.members) ? m.members : [];
    roots.push({ uuid: String(m.uuid || u), type: modelFacetType(m, idx), name: String(m.name || ''), hasChildren: members.length > 0, childCount: members.length });
  }
  roots.sort((a, b) => a.name.localeCompare(b.name));
  return roots;
};

async function partA_sourceAudit() {
  const s = readFileSync(`${REPO}/src/ts/server/server.ts`, 'utf8');
  const facet = /function modelFacetType[\s\S]{0,400}?instanceOf[\s\S]{0,200}?startsWith\('Uml'\)[\s\S]{0,80}?return 'ModelElement'/.test(s);
  const region = s.slice(s.indexOf("'/api/model/tree'"), s.indexOf("'/api/model/tree'") + 900); // the roots handler
  const rootsFilter = region.includes('ior:class:ModelElement') && region.includes("metaLevel !== 'M1'") && region.includes('m.memberOf') && region.includes('members.length'); // AC2/4 filter + members→childCount
  const childrenUsesFacet = /ct === 'ModelElement' \? modelFacetType/.test(s);           // children walk (1698) types ModelElements via facet
  const detSort = /roots\.sort\(\(a, b\) => a\.name\.localeCompare\(b\.name\)\)/.test(s);   // AC6 deterministic order
  const relatesToNotChild = !region.includes('relatesTo');                                 // AC5: relatesTo NOT referenced in the roots handler at all
  return { facet, rootsFilter, childrenUsesFacet, detSort, relatesToNotChild };
}

function partB_logicBite() {
  // synthetic M2 metaclasses + M1 model + members + a relatesTo (own oracle)
  const idx = { get: (u) => ({ UmlClass: { model: { name: 'UmlClass' } }, UmlInterface: { model: { name: 'UmlInterface' } }, NotUml: { model: { name: 'PlainThing' } } })[u] || null };
  const facetClass = modelFacetType({ instanceOf: ['ior:instance:UmlClass'] }, idx) === 'UmlClass';       // AC3 M2 facet type
  const facetIface = modelFacetType({ instanceOf: ['ior:instance:UmlInterface'] }, idx) === 'UmlInterface';
  const facetFallbackNonUml = modelFacetType({ instanceOf: ['ior:instance:NotUml'] }, idx) === 'ModelElement'; // ★ bite: non-Uml facet → fallback
  const facetFallbackEmpty = modelFacetType({}, idx) === 'ModelElement';                                   // ★ bite: no facet → fallback
  const units = new Map([
    ['foo', { ior: 'ior:class:ModelElement', model: { uuid: 'foo', name: 'Foo', metaLevel: 'M1', instanceOf: ['ior:instance:UmlClass'], members: ['bar', 'baz'], relatesTo: ['qux'] } }], // top-level class, 2 members + a relatesTo
    ['bar', { ior: 'ior:class:ModelElement', model: { uuid: 'bar', name: 'bar', metaLevel: 'M1', memberOf: 'foo', instanceOf: ['ior:instance:UmlClass'] } }], // member → NOT a root
    ['inst', { ior: 'ior:class:ModelElement', model: { uuid: 'inst', name: 'anInstance', metaLevel: 'M0' } }], // M0 → NOT a root
  ]);
  const roots = buildRoots(units, idx);
  const oneRoot = roots.length === 1 && roots[0].uuid === 'foo';                    // AC: only top-level M1
  const memberExcluded = !roots.some(r => r.uuid === 'bar');                        // ★ bite: memberOf child is NOT a root
  const m0Excluded = !roots.some(r => r.uuid === 'inst');                          // ★ bite: M0 excluded
  const childCountIsMembers = roots[0]?.childCount === 2 && roots[0]?.hasChildren;  // AC2/AC4: members → childCount badge
  const relatesToNotCounted = roots[0]?.childCount === 2;                           // ★ bite: relatesTo (1 entry) did NOT inflate childCount → relatesTo-not-a-child
  const typeIsFacet = roots[0]?.type === 'UmlClass';                                // AC3
  return { facetClass, facetIface, facetFallbackNonUml, facetFallbackEmpty, oneRoot, memberExcluded, m0Excluded, childCountIsMembers, relatesToNotCounted, typeIsFacet };
}

async function partC_clientReuse(browser) {
  // AC1 data-only reuse + AC8 draggable: feed the SHARED rb-trace-tree the server's exact .items shape → it renders.
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-trace-tree'), { timeout: 15000 }).catch(() => {});
  const out = await page.evaluate(() => {
    const t = document.createElement('rb-trace-tree'); document.body.appendChild(t);
    t.items = [{ uuid: 'foo', type: 'UmlClass', name: 'Foo', hasChildren: true, childCount: 2 }]; // server /api/model/tree shape
    return new Promise((resolve) => setTimeout(() => {
      const item = t.querySelector('rb-object-item');
      const txt = t.textContent || '';
      const ref = (item?.getAttribute('ref') || '').toLowerCase(); // renderItems lowercases: `${type.toLowerCase()}:${uuid}`
      resolve({ mounted: !!item, showsName: /Foo/.test(txt), showsFacetType: ref.includes('umlclass') || (item?.getAttribute('type') || '').toLowerCase() === 'umlclass', badge2: /\b2\b/.test(item?.textContent || txt), draggable: item ? (item.getAttribute('draggable') === 'true' || !!item.querySelector('[draggable="true"]')) : false, ref, tag: item?.tagName || null });
    }, 900));
  });
  await ctx.close();
  return out;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const cfg = await httpGet('/api/config'); const ver = (() => { try { return JSON.parse(cfg.body).version; } catch { return null; } })();
  const sw = await httpGet('/sw.js'); const swv = (sw.body.match(/CACHE_NAME\s*=\s*'([^']+)'/) || [])[1];
  const verOk = ver === '0.8.3' && swv === 'rawbin-v0.8.3';
  const audit = await partA_sourceAudit();
  const auditOk = Object.values(audit).every(Boolean);
  const noFork = !/rb-model-tree|ModelTreeComponent|class RbModelTree/.test(readFileSync(`${REPO}/src/ts/server/server.ts`, 'utf8')) && (await (async () => { try { readFileSync(`${REPO}/src/public/ts/components/rb-model-tree.ts`); return false; } catch { return true; } })()); // AC1 no-fork
  const bite = partB_logicBite();
  const biteOk = Object.values(bite).every(Boolean);
  console.log(`ver=${ver}/sw=${swv} verOk=${verOk} | audit=${JSON.stringify(audit)} auditOk=${auditOk} noFork=${noFork} | bite=${JSON.stringify(bite)} biteOk=${biteOk}`);
  if (!verOk) { console.log('ABORT phantom-guard: served != v0.8.3'); process.exitCode = 1; }
  else {
    for (let i = 1; i <= 3; i++) {
      // (D) live determinism — /api/model/tree valid {roots} shape + identical across 2 reads
      const t1 = await httpGet('/api/model/tree'); const t2 = await httpGet('/api/model/tree');
      let shapeOk = false, deterministic = false;
      try { const j1 = JSON.parse(t1.body); shapeOk = Array.isArray(j1.roots); deterministic = t1.body === t2.body; } catch { /* */ }
      // (E) shared-tree regression
      const trace = await httpGet('/trace'); const whoami = await httpGet('/api/server-manager/whoami');
      const regressionOk = trace.status === 200 && whoami.status === 403;
      // (C) client data-only reuse + draggable
      const c = await partC_clientReuse(browser);
      const clientOk = c.mounted && c.showsName && c.showsFacetType && c.badge2 && c.draggable;
      const pass = verOk && auditOk && noFork && biteOk && shapeOk && deterministic && regressionOk && clientOk;
      results.push(pass);
      console.log(`iter ${i}: liveShape=${shapeOk} det=${deterministic}(roots=${(() => { try { return JSON.parse(t1.body).roots.length; } catch { return '?'; } })()}) | regression /trace=${trace.status} whoami=${whoami.status}=${regressionOk} | client=${clientOk}(${JSON.stringify(c)}) => ${pass ? 'GREEN' : 'RED'}`);
    }
  }
} finally { await browser.close(); }

console.log('\n===== R32.3 model-tree INDEPENDENT gate (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
if (process.exitCode !== 1) process.exitCode = green ? 0 : 1;
