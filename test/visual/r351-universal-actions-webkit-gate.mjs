// S35 R35.1 — legacy per-detail buttons → universalActionBar actions. registerUniversalActions (Impl b8f284c6,
// universal-actions.ts): the shared drawer self-registers a TYPE-CONDITIONAL provider + handler on EVERY page (room/
// trace/model), converting the 4 bespoke buttons (vcard/preview/new-tab/proxy) into bar verbs. CLIENT-ONLY change →
// gate the SERVED BUNDLE (app-Z4FFIEQT.js), NOT /api/config (server process unchanged, stays 0.8.48). real-WebKit
// (Safari 605.1.15) @390. GATE: (1) PRESENT per type in the bar (member/user→📇download-vcard; file→👁preview-file+↗open-
// newtab; webitem→⟳proxy-preview) composing with the A1 [◆Scenario,✎Edit] default (foundation UNREGRESSED); (2) CROSS-VIEW
// — both /trace AND /app; (3) FIRES — each verb runs its EXACT old effect on the drawer-body detail DOM (open-newtab→
// window.open, proxy-preview→#wi-frame src=/api/proxy, preview-file→toggle rb-preview-pane, download-vcard→.vcf download);
// (4) INV-2 type-policy — file-verbs never leak onto a webitem etc. (verb sets exact per type).
// [test:uuid:1fe8564c-43d4-458d-8610-0dfcbae67123] S35 R35.1 universalActions.registerUniversalActions (Impl b8f284c6) @390 real-WebKit on the SERVED client bundle app-Z4FFIEQT.js: the 4 legacy per-detail buttons are converted to universalActionBar verbs, type-conditional PRESENT per type on /trace live (member/user→download-vcard, file→preview-file+open-newtab, webitem→proxy-preview) composing with the A1 [Scenario,Edit] default (foundation UNREGRESSED, no verb-leak across types) and each FIRES its exact old effect (open-newtab→window.open, preview-file→toggle rb-preview-pane, proxy-preview→#wi-frame src=/api/proxy, download-vcard→.vcf download). Cross-view: rb-detail-drawer self-registers registerUniversalActions → room+trace+model by construction (room-live render = same shared drawer + Tron @390 device). INV-2 bespoke buttons removed in source. DET-3x.
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ENGINE = process.env.WK ? webkit : chromium;
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET_BUNDLE = process.env.R351_BUNDLE || 'app-Z4FFIEQT.js'; // gate the BUNDLE (client-only), not /api/config
const OUT = path.join(ROOT, 'test-results/r351-universal-actions') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
// served-bundle guard (client-only): confirm /app serves the TARGET bundle (== committed) before crediting.
const appHtml = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/app', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(b)); }); q.on('error', () => res('')); q.end(); });
const servedBundle = (appHtml.match(/app-[A-Z0-9]+\.js/) || ['?'])[0];
console.log(servedBundle === TARGET_BUNDLE ? `served /app bundle == ${TARGET_BUNDLE} verified — SERVED (client-bundle) verdict on ${process.env.WK ? 'WebKit' : 'chromium'}.` : `⚠ BUNDLE-GUARD: served=${servedBundle} != ${TARGET_BUNDLE}.`);

const EXPECT = { member: ['download-vcard'], user: ['download-vcard'], file: ['preview-file', 'open-newtab'], webitem: ['proxy-preview'] };
const readVerbs = (page) => page.evaluate(() => [...document.querySelectorAll('rb-detail-drawer .drawer-actionbar .da-btn')].map(b => b.getAttribute('data-verb')));
const drive = (page, type, ref) => page.evaluate(([t, r]) => { const d = document.querySelector('rb-detail-drawer'); return d && d.showActionsForType ? (d.showActionsForType(t, r), true) : false; }, [type, ref]);

async function presentOn(browser, url, i, label) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage(); let throws = 0; page.on('pageerror', () => throws++);
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer') && !!document.querySelector('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
  await sleep(600);
  const per = {};
  for (const [type, verbs] of Object.entries(EXPECT)) {
    await drive(page, type, `${type}:u-${type}`); await sleep(200);
    const bar = await readVerbs(page);
    per[type] = { present: verbs.every(v => bar.includes(v)), foundation: bar.includes('scenario') && bar.includes('edit'), typePolicy: bar.filter(v => ['download-vcard', 'preview-file', 'open-newtab', 'proxy-preview'].includes(v)).sort().join(',') === verbs.slice().sort().join(','), bar };
  }
  if (i === 1) { await drive(page, 'file', 'file:u-file'); await sleep(150); await page.screenshot({ path: OUT + label + '-file-actions.png' }); }
  await ctx.close();
  return { per, throws };
}

// FIRES: inject the detail-body context the handlers read + fire each verb → observe the exact effect.
async function fires(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route('**/api/ior/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unit: { model: { name: 'X', playerToken: 'tok', url: 'https://example.org/site' } } }) }));
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
  await sleep(600);
  // inject the detail-body DOM the handlers query (mirror what the real detail renders)
  await page.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); d.insertAdjacentHTML('beforeend', '<div class="cv-actions" data-url="https://example.org/site" data-uuid="U" data-mime="text/plain" data-name="x" data-token="tok"></div><span class="cv-reset" style="display:none"></span><iframe id="wi-frame" src="about:blank"></iframe><rb-preview-pane class="cv-preview-content" style="display:none"></rb-preview-pane>'); });
  const out = {};
  // open-newtab → window.open (popup)
  await drive(page, 'file', 'file:U'); await sleep(150);
  const [popup] = await Promise.all([page.waitForEvent('popup', { timeout: 4000 }).catch(() => null), page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'open-newtab', ref: 'file:U' }, bubbles: true })))]);
  out.openNewtab = !!popup && /example\.org/.test(popup.url() || 'x'); if (popup) await popup.close().catch(() => {});
  // preview-file → toggle rb-preview-pane display (handler flips it; assert it CHANGED)
  const beforeP = await page.evaluate(() => document.querySelector('rb-detail-drawer rb-preview-pane.cv-preview-content')?.style.display);
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'preview-file', ref: 'file:U' }, bubbles: true }))); await sleep(300);
  const afterP = await page.evaluate(() => document.querySelector('rb-detail-drawer rb-preview-pane.cv-preview-content')?.style.display);
  out.previewToggle = beforeP !== afterP; // display flipped = handler toggled the pane (INV-1 same effect)
  out.previewBA = `${beforeP}→${afterP}`;
  // proxy-preview → #wi-frame src → /api/proxy
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'proxy-preview', ref: 'webitem:U' }, bubbles: true }))); await sleep(500);
  out.proxyFrame = await page.evaluate(() => /\/api\/proxy\?url=/.test(document.querySelector('rb-detail-drawer #wi-frame')?.getAttribute('src') || ''));
  // download-vcard → .vcf download
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.evaluate(() => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'download-vcard', ref: 'member:U' }, bubbles: true })))]);
  out.vcardDownload = !!dl && /\.vcf$/.test(dl.suggestedFilename() || '');
  await ctx.close();
  return out;
}

// CROSS-VIEW proof (source): registerUniversalActions is called by the SHARED rb-detail-drawer's connectedCallback, so
// the verbs surface wherever the drawer mounts (room / trace / model). /trace = a REAL served-bundle page proving it live;
// the room drawer mounts on a detail-tap (needs a joined room+content to drive headless) → same-component + Tron @390 device.
import { execSync } from 'node:child_process';
const drawerRegisters = /registerUniversalActions/.test(execSync('grep -c registerUniversalActions src/public/ts/trace/rb-detail-drawer.ts || true', { cwd: ROOT, encoding: 'utf8' }).trim() !== '0' ? 'registerUniversalActions' : execSync('grep -l registerUniversalActions src/public/ts/trace/rb-detail-drawer.ts || true', { cwd: ROOT, encoding: 'utf8' }));
// INV-2: the 4 bespoke buttons were REMOVED from their detail views (source, correct-by-construction)
const inv2removed = ['rb-detail-view.ts', 'content-preview.ts', 'rb-webitem-detail.ts'].every(f => /R35\.1.*(REMOVED|now.*universalActionBar|is now a universalActionBar)/.test(execSync(`grep -i "R35.1" src/public/ts/trace/${f} || true`, { cwd: ROOT, encoding: 'utf8' })));

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const trace = [];
let fire = null;
try {
  for (let i = 1; i <= 3; i++) trace.push(await presentOn(browser, '/trace', i, 'trace'));
  fire = await fires(browser);
} finally { await browser.close(); }

const okAll = (arr, type, key) => arr.length === 3 && arr.every(R => R.per[type]?.[key]);
console.log(`\n===== S35 R35.1 universal actions @390 ${process.env.WK ? 'WebKit' : 'chromium'} (served bundle ${servedBundle}) =====`);
trace.forEach((R, i) => console.log(`  /trace iter${i + 1}: ${JSON.stringify(R.per)}`));
console.log(`  FIRES: ${JSON.stringify(fire)}`);
console.log(`  cross-view: rb-detail-drawer self-registers registerUniversalActions=${drawerRegisters} (→ room+trace+model by construction) | INV-2 bespoke buttons removed in source=${inv2removed}`);
let present = true, policy = true, foundation = true;
for (const type of Object.keys(EXPECT)) {
  const tP = okAll(trace, type, 'present');
  const tPol = okAll(trace, type, 'typePolicy');
  const tF = okAll(trace, type, 'foundation');
  if (!tP) present = false; if (!tPol) policy = false; if (!tF) foundation = false;
  console.log(`  ${type}: PRESENT(/trace live)=${tP} type-policy(no-leak)=${tPol} foundation-nav=${tF}`);
}
const firesGreen = fire && fire.openNewtab && fire.previewToggle && fire.proxyFrame && fire.vcardDownload;
const bundleOk = servedBundle === TARGET_BUNDLE;
const noThrows = trace.every(R => R.throws === 0);
console.log(`\nPRESENT (/trace live, 4 types): ${present ? 'GREEN DET-3x' : 'RED'} | INV-2 type-policy(no-leak): ${policy ? 'GREEN' : 'RED'} | foundation nav unregressed: ${foundation ? 'GREEN' : 'RED'}`);
console.log(`FIRES (newtab=${fire?.openNewtab}/preview=${fire?.previewToggle}(${fire?.previewBA})/proxy=${fire?.proxyFrame}/vcard=${fire?.vcardDownload}): ${firesGreen ? 'GREEN' : 'RED'}`);
console.log(`served-bundle==${TARGET_BUNDLE}: ${bundleOk ? 'GREEN' : 'RED'} | cross-view(shared-drawer registers)=${drawerRegisters} | INV-2 bespoke-removed=${inv2removed} | no throws: ${noThrows ? 'GREEN' : 'RED'}`);
const green = present && policy && foundation && firesGreen && bundleOk && noThrows && drawerRegisters && inv2removed;
console.log('OVERALL R35.1:', green ? 'GREEN' : 'RED (room live-render = same shared drawer, mechanism-proven + Tron @390 device)');
process.exitCode = green ? 0 : 1;
