// [test:uuid:96d0d227-2ac0-468b-8bb7-b3d3a0438fc7] R31.1 renderFeatureGrants (Impl f345b8ed, Class ProfilePage a3958f85, Method b4f03947) — RENDER + FILTER, DET-3x @390 real-WebKit. RETARGETED (2026-08-12): the impl MOVED from the ProfileEditor edit-form to the read-only /profile VIEWER, server-injected into #feature-grants from m.features in the PROFILE ws message (NO whoami round-trip). This gates the CLIENT RENDER+FILTER intent, distinct from R31.8 render-every-feature (b70aa99f) and from the SERVER-SIDE gate r312 (assertOwner 335dbf3d).
// ★ CLIENT-ONLY by construction (PO security ruling): NO server surface, NO self-grant route, prod code UNCHANGED. The harness wraps the page's own WebSocket onmessage IN-PAGE to hand the REAL renderFeatureGrants snippet a SYNTHETIC m.features payload — the server is never asked to grant anything, the cookie-mint onclick is never fired (no writes). 8d9be587 (FeatureManager-not-ServerManager) is the READ-ONLY EXPECTED shape, never impersonated. Owner-VISIBLE-on-real-prod (server actually grants Server Manager) splits to Tron-device.
// Engine-swap: WK=1 → real WebKit (Tron's Safari @390); default chromium. node22: PATH=/opt/node22/bin:$PATH WK=1 node test/visual/r311-feature-grants-render-gate.mjs
import { chromium, webkit, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const ENGINE = process.env.WK ? webkit : chromium;
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// in-page: wrap WebSocket.onmessage so a PROFILE frame gets window.__injectFeatures spliced in → the REAL render runs on it.
const WS_INJECT = (features) => `(() => {
  window.__injectFeatures = ${JSON.stringify(features)};
  const proto = WebSocket.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'onmessage');
  Object.defineProperty(proto, 'onmessage', {
    configurable: true,
    get() { return desc.get.call(this); },
    set(fn) {
      const wrapped = function(e) {
        if (window.__injectFeatures) { try {
          const m = JSON.parse(e.data);
          if (m && m.type === 'PROFILE' && m.profile) { m.features = window.__injectFeatures;
            return fn.call(this, new MessageEvent('message', { data: JSON.stringify(m) })); }
        } catch (_) {} }
        return fn.call(this, e);
      };
      desc.set.call(this, wrapped);
    },
  });
})()`;

async function renderWith(browser, features, expectContent) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  await ctx.addInitScript(WS_INJECT(features));
  const page = await ctx.newPage();
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' }).catch(() => {});
  if (expectContent) await page.waitForFunction(() => document.querySelectorAll('#feature-grants a').length > 0, { timeout: 15000 }).catch(() => {});
  else await sleep(2500); // empty arm: give the render its chance, then assert it stayed empty
  const out = await page.evaluate(() => {
    const fg = document.querySelector('#feature-grants');
    const anchors = Array.from(fg ? fg.querySelectorAll('a') : []).map(a => (a.textContent || '').trim());
    const box = fg ? fg.getBoundingClientRect() : { width: 0, height: 0 };
    return {
      host: !!fg,
      h3: (fg?.querySelector('h3')?.textContent || '').trim(),
      anchors,
      serverManager: anchors.some(t => /server manager/i.test(t)),
      featureManager: anchors.some(t => /feature manager/i.test(t)),
      smIcon: anchors.find(t => /server manager/i.test(t))?.startsWith('\u{1F5A5}') ?? null, // 🖥️ prefix
      fmIcon: anchors.find(t => /feature manager/i.test(t))?.startsWith('\u{1F511}') ?? null, // 🔑 prefix
      visible: box.width > 0 && box.height > 0,
    };
  });
  await ctx.close();
  return out;
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    // ARM A — CONTROL/vacuity-guard: empty features → section stays EMPTY (render is payload-driven, not pre-populated)
    const a = await renderWith(browser, [], false);
    const armEmpty = a.host && a.anchors.length === 0 && a.h3 === '';

    // ARM B — NON-OWNER FILTER (8d9be587 shape: FeatureManager, NOT ServerManager): renders FM entry, FILTERS OUT Server Manager
    const b = await renderWith(browser, [{ name: 'Feature Manager', launchPage: '/feature-manager' }], true);
    const armFilter = b.host && b.h3 === 'Feature access' && b.featureManager && b.fmIcon === true && !b.serverManager && b.anchors.length === 1 && b.visible;

    // ARM C — RENDER-COMPLETENESS: when Server Manager IS in the granted set it renders with the 🖥️ affordance (so ARM B's
    // absence is a genuine filter of a not-granted feature, not an unconditional drop of Server Manager)
    const c = await renderWith(browser, [{ name: 'Server Manager', launchPage: '/server-manager' }, { name: 'Feature Manager', launchPage: '/feature-manager' }], true);
    const armComplete = c.host && c.serverManager && c.smIcon === true && c.featureManager && c.fmIcon === true && c.anchors.length === 2;

    const pass = armEmpty && armFilter && armComplete;
    results.push(pass);
    console.log(`iter ${i}: empty-control=${armEmpty}(h3="${a.h3}" n=${a.anchors.length}) | non-owner-FILTER=${armFilter}(fm=${b.featureManager} sm=${b.serverManager} vis=${b.visible} "${b.anchors}") | render-complete=${armComplete}(sm🖥️=${c.smIcon} fm🔑=${c.fmIcon} n=${c.anchors.length}) => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log(`\n===== R31.1 renderFeatureGrants render+filter (${process.env.WK ? 'WebKit' : 'chromium'} @390, CLIENT-ONLY inject) DET-3x =====`);
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — renders granted features, FILTERS the not-granted (Server Manager), no server surface' : 'RED');
process.exitCode = green ? 0 : 1;
