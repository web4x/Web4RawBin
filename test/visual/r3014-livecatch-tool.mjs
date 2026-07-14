// R30.14 LIVE-CATCH (shadow-DOM aware) — park a real tab, watch for the expert's next deploy: rb-update-banner
// (SHADOW DOM) 'Update Now' lights up (arm A pollForWorkerUpdate→updatefound) → tap #update-now → SKIP_WAITING →
// claimClients→controllerchange→reload→new version (arm B). SW ALLOWED. Version via /api/config. ~5.5min hold.
import { chromium } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const OUT = '/var/dev/Workspaces/web4x/Web4RawBin/test-results/merge-visual';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const ver = (page) => page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
const bannerState = (page) => page.evaluate(() => { const el = document.querySelector('rb-update-banner'); const b = el?.shadowRoot?.getElementById('banner'); return { present: !!b, visible: !!(b && b.getBoundingClientRect().height > 0), text: (b?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), hasBtn: !!el?.shadowRoot?.getElementById('update-now') }; });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 900 } }); // SW ALLOWED
const page = await ctx.newPage();
try {
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 30000 }).catch(() => {});
  const vBefore = await ver(page);
  console.log(`PARKED — controller=${await page.evaluate(() => !!navigator.serviceWorker.controller)} version=${vBefore} — holding ~5.5min for the next deploy`);

  let fired = false;
  for (let s = 0; s < 330; s += 3) {
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {})); // accelerate (bypasses the visibility gate)
    const b = await bannerState(page);
    const waiting = await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.waiting); });
    if (b.present) { fired = true; console.log(`  [t+${s}s] ARM A — banner in shadow DOM: "${b.text}" visible=${b.visible} btn=${b.hasBtn} (waiting=${waiting})`); break; }
    if (waiting && s % 15 === 0) console.log(`  [t+${s}s] waiting-worker present (update detected), banner not shown yet`);
    await sleep(3000);
  }

  if (fired) {
    await page.screenshot({ path: `${OUT}/r3014-livecatch-banner.png` }).catch(() => {});
    // TAP the shadow-DOM Update Now button → arm B
    await page.evaluate(() => document.querySelector('rb-update-banner')?.shadowRoot?.getElementById('update-now')?.click());
    // SKIP_WAITING → skipWaiting → activate → claimClients → controllerchange → location.reload
    await sleep(6000);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await sleep(2000);
    const vAfter = await ver(page);
    const controller = await page.evaluate(() => !!navigator.serviceWorker.controller);
    await page.screenshot({ path: `${OUT}/r3014-livecatch-reloaded.png` }).catch(() => {});
    const flipped = vAfter !== vBefore && vAfter !== '?';
    console.log(`ARM B — after tap: version ${vBefore} → ${vAfter} controllerPresent=${controller} reloaded=${flipped}`);
    console.log(`LIVE-CATCH RESULT: ${fired && flipped ? 'GREEN — real banner→tap→reclaim→reload→new version' : 'PARTIAL (banner=' + fired + ' versionFlipped=' + flipped + ')'}`);
  } else {
    console.log('LIVE-CATCH: no banner within ~5.5min — ask for a deploy inside the hold window.');
  }
} finally { await ctx.close(); await browser.close(); }
