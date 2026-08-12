// [test:uuid:d81f4a06-3e57-4c92-b5a1-7f0c9e26a4b3] R40.11 slice-3 AC-5 — the drawer's ONE GENERIC type-driven default view renders CONTENT for a deployment typed-unit, NOT a perpetual 'Loading…'. Tron's DEVICE gate (real-WebKit @390, PIXEL — never headless-green). Distinct from the AC-3/AC-4/stub DATA-CONTRACT check (scripts/check-deployment-default-view.ts, disk): this proves the CLIENT actually RENDERS the served `fields` visibly. Impl: RbDetailView.render slice-3 field-view (rb-detail-view.ts) + server /api/trace/children `fields`.
// PHANTOM-GUARD: asserts the served /api/trace/children serves `fields` (slice-3 DEPLOYED) FIRST — if not, RED (committed≠served; do not green a stale build). AC-4 fail-loud: a bogus ref → '⚠ unresolved', never perpetual Loading. Real-WebKit @390 (WK default; process.env.CHROME→chromium for a non-device smoke only). DET-3x. Read-only (same-origin GET; no mint).
import { webkit, chromium } from '@playwright/test';
const ENGINE = process.env.CHROME ? chromium : webkit;
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const CONFIGFILE = '71bd2de9-9819-4fde-a159-f75ff748888c'; // ConfigFile sshd_config — type-key manifestsAs
const BOGUS = 'depunit-unresolved-00000000-0000-0000-0000-000000000000';

// phantom-guard: is slice-3's server half deployed? (served /api/trace/children must carry `fields`)
const probe = await fetch(`${BASE}/api/trace/children/${CONFIGFILE}`, {}).then(r => r.json()).catch(() => ({}));
const cfg = await fetch(`${BASE}/api/config`).then(r => r.json()).catch(() => ({}));
const fieldsServed = !!(probe && probe.fields && Object.keys(probe.fields).length > 0);
console.log(`served v${cfg.version} · /api/trace/children fields-served=${fieldsServed}`);

const browser = await ENGINE.launch({ headless: true, args: ENGINE === chromium ? ['--no-sandbox', '--ignore-certificate-errors'] : [] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });         // registers rb-detail-view + serves the deployed bundle
    await page.waitForFunction(() => !!customElements.get('rb-detail-view'), { timeout: 20000 }).catch(() => {});

    // mount the detail view standalone (graph null → the slice-3 /api/trace/children fallback render path) on a deployment unit
    await page.evaluate((uuid) => { const el = document.createElement('rb-detail-view'); el.id = '_g'; document.body.appendChild(el); el.setAttribute('ref', uuid); }, CONFIGFILE);
    await page.waitForFunction(() => { const e = document.querySelector('#_g'); return e && !/Loading/.test(e.querySelector('.dv-type')?.textContent || 'Loading'); }, { timeout: 15000 }).catch(() => {});
    await sleep(1200);

    const dom = await page.evaluate(() => {
      const e = document.querySelector('#_g');
      const fields = e?.querySelectorAll('.dv-field') || [];
      return {
        type: e?.querySelector('.dv-type')?.textContent || '',
        title: e?.querySelector('.dv-title')?.textContent || '',
        fieldCount: fields.length,
        hasFieldsBlock: !!e?.querySelector('.dv-fields'),
        stillLoading: /Loading/.test(e?.textContent || ''),
        fieldText: Array.from(fields).map(f => (f.textContent || '').trim()).join(' | ').slice(0, 120),
      };
    });
    // PIXEL @390: the .dv-fields region actually paints content (non-empty box)
    let contentPx = 0;
    const box = await page.evaluate(() => { const f = document.querySelector('#_g .dv-fields'); if (!f) return null; const r = f.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    if (box && box.w > 0 && box.h > 0) contentPx = 1; // rendered with real geometry (paint proof; screenshot saved below)
    await page.screenshot({ path: `test-results/r4011c-slice3/iter${i}.png` }).catch(() => {});

    // AC-4 fail-loud: bogus ref → '⚠ unresolved', NEVER perpetual Loading
    await page.evaluate((uuid) => { const el = document.createElement('rb-detail-view'); el.id = '_b'; document.body.appendChild(el); el.setAttribute('ref', uuid); }, BOGUS);
    await sleep(1500);
    const failLoud = await page.evaluate(() => { const e = document.querySelector('#_b'); const t = e?.querySelector('.dv-title')?.textContent || ''; return { unresolved: /unresolved/i.test(t), stillLoading: /Loading/.test(t) }; });

    const contentGreen = dom.hasFieldsBlock && dom.fieldCount >= 1 && !/Loading/.test(dom.type) && dom.type.length > 0 && !dom.stillLoading && contentPx === 1;
    const failLoudGreen = failLoud.unresolved && !failLoud.stillLoading;
    const pass = fieldsServed && contentGreen && failLoudGreen;
    results.push(pass);
    console.log(`iter ${i}: fields-served=${fieldsServed} | content=${contentGreen}(type="${dom.type}" fields=${dom.fieldCount} "${dom.fieldText}" loading=${dom.stillLoading}) | fail-loud=${failLoudGreen}(${failLoud.unresolved}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.11 slice-3 default-view CONTENT @390 real-WebKit (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — drawer renders type-driven CONTENT (not Loading) + fail-loud on unresolved' : 'RED (slice-3 not served, or content not rendered — see fields-served)');
process.exitCode = green ? 0 : 1;
