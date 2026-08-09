// [test:uuid:a1e8d3f7-6b52-4c90-8d14-9f7e2a3c5b08] R40.9 EditorPreview.previewTraceability (Impl 0ed5cd75) — the Preview
// tab REUSES the shared /trace + rb-detail-drawer surfaces (rb-trace-tree scoped via data-seed-ior + rb-detail-drawer),
// NO bespoke preview renderer (DRY like R40.5); and @390 real-WebKit the Preview renders the unit's traceability chain +
// the details drawer opens on node-select. AC-reuse-grep (source, stub-must-fail) + AC-traceability-390 + AC-drawer-390.
import { webkit, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'node:fs';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const IOR = 'ior:instance:90cc7bab-f7d4-4646-bc85-4a58fcb2c3eb'; // a real unit (R40.8 req) with a traceability chain
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// AC-reuse-grep check (stub-must-fail): a previewTraceability body REUSES iff it mounts BOTH shared components via
// createElement AND builds NO bespoke markup (innerHTML only cleared to '', never assigned non-empty template).
const isReuse = (body) =>
  /createElement\(['"]rb-trace-tree['"]\)/.test(body) &&
  /createElement\(['"]rb-detail-drawer['"]\)/.test(body) &&
  !/innerHTML\s*=\s*[`'"]\s*[^`'"\s]/.test(body); // any non-empty innerHTML assignment = bespoke renderer → NOT reuse

const layoutSrc = fs.readFileSync(`${REPO}/src/public/ts/components/rb-editor-layout.ts`, 'utf8');
const realBody = (layoutSrc.match(/previewTraceability\(unitIor[^{]*\{([\s\S]*?)\n  \}/) || [, ''])[1];
const bespokeBody = `const host=this.previewEl; host.innerHTML = '<div class="bespoke-trace">'+renderChain(unitIor)+'</div>';`; // synthetic bespoke renderer
const reuseSource = isReuse(realBody);
const biteFires = isReuse(bespokeBody) === false;                     // stub-must-fail: a bespoke renderer MUST fail the check
const importsShared = /import ['"][^'"]*rb-trace-tree/.test(layoutSrc) && /import ['"][^'"]*rb-detail-drawer/.test(layoutSrc);
// DRY: no OTHER bespoke traceability-preview custom element defined anywhere in the client
const noBespokeElement = !/customElements\.define\(['"]rb-[a-z-]*preview-?(trace|scenario)/.test(
  fs.readdirSync(`${REPO}/src/public/ts`, { recursive: true }).filter(f => String(f).endsWith('.ts')).map(f => { try { return fs.readFileSync(`${REPO}/src/public/ts/${f}`, 'utf8'); } catch { return ''; } }).join('\n'));

const browser = await webkit.launch();
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/edit`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-editor-layout') && !!document.querySelector('rb-editor-layout'), { timeout: 20000 }).catch(() => {});

    // drive the REAL previewTraceability on the served page (@390) — mounts the SHARED surfaces
    await page.evaluate((ior) => { const el = document.querySelector('rb-editor-layout'); el?.showPreview?.(); el?.previewTraceability?.(ior); }, IOR);
    await sleep(2500); // let rb-trace-tree fetch its seeded subtree + render

    const r = await page.evaluate(() => {
      const host = document.querySelector('rb-editor-layout .el-preview') || document.querySelector('.el-preview');
      const tree = host?.querySelector('rb-trace-tree');
      const drawer = host?.querySelector('rb-detail-drawer');
      const nodes = tree ? tree.querySelectorAll('rb-object-item, .to-node, [data-ior]').length : 0;
      return { hasTree: !!tree, seeded: tree?.getAttribute('data-seed-ior') || '', hasDrawer: !!drawer, nodes };
    });
    const traceRenders = r.hasTree && r.seeded === IOR && r.nodes > 0;   // AC-traceability-390: the /trace surface renders the scoped chain

    // AC-drawer-390: selecting a node opens the shared rb-detail-drawer
    await page.evaluate(() => { const n = document.querySelector('.el-preview rb-trace-tree rb-object-item, .el-preview rb-trace-tree [data-ior]'); n?.dispatchEvent(new MouseEvent('click', { bubbles: true })); }).catch(() => {});
    await sleep(1200);
    const drawerOpens = await page.evaluate(() => { const d = document.querySelector('.el-preview rb-detail-drawer'); return !!d && (d.hasAttribute('open') || (d.offsetHeight || 0) > 0 || (d.querySelector('.drawer-panel-detail')?.innerHTML || '').length > 50); });

    const pass = reuseSource && biteFires && importsShared && noBespokeElement && traceRenders && drawerOpens;
    results.push(pass);
    console.log(`iter ${i}: reuse-source=${reuseSource} bite-fires=${biteFires} imports-shared=${importsShared} no-bespoke=${noBespokeElement} | @390 trace-renders=${traceRenders}(tree=${r.hasTree} seed=${r.seeded === IOR} nodes=${r.nodes}) drawer-opens=${drawerOpens} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.9 Preview reuses /trace + rb-detail-drawer (source+bite + @390 real-WebKit, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
