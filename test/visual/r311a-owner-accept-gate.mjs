// [test:uuid:PENDING] R31.1 owner-ACCEPT path (REAL, NO mock) — the PRIMARY happy-path on Impl f345b8ed.
// ★ LESSON this gate exists for: r311v MOCKED the owner path (whoami-intercept 200) → verified the render but HID
// Tron's real 'owner sees NO entry' bug. This gate verifies the REAL accept against REALITY: it registers the owner
// token as a LIVE session (seed rawbin-player-id=OWNER + e2e-bypass device keys → /app ws → IDENTIFY → tokenToClient.set,
// server.ts:2555), THEN loads /profile so renderFeatureGrants' REAL whoami (assertOwner: live AND constant-time owner)
// returns 200 → the 'Server Manager' entry is appended at the viewer bottom. NO whoami mock anywhere.
//
// ⚠ RUN COORDINATED on the v0.7.88 signal ONLY — establishing a live owner session calls tokenToClient.set(OWNER),
// which would DISPLACE Tron's real owner session if he is connected. Do NOT run ad-hoc while Tron holds the owner
// session. Expected: RED on the pre-fix build (reproduces 'no entry'), GREEN once the expert fixes the owner-accept.
import { chromium } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const OWNER = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// seed the OWNER identity (mirror seedSystemTester, owner token) — e2e-bypass device keys so IDENTIFY registers it live
async function seedOwner(context) {
  await context.addInitScript((owner) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('rawbin-player-id', owner);
      localStorage.setItem('rawbin-name', 'Owner');
      localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass');
      localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass');
      localStorage.setItem('rawbin-device-signature', 'e2e-bypass');
    }
  }, OWNER);
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedOwner(ctx);
    const page = await ctx.newPage();
    // establish the LIVE owner session first (app ws → IDENTIFY{OWNER} → tokenToClient.set)
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
    await sleep(2500);
    // REAL whoami as the live owner (no mock) — must be 200
    const whoamiStatus = await page.evaluate(async (o) => (await fetch('/api/server-manager/whoami', { headers: { 'x-player-token': o } })).status, OWNER);
    // now the /profile viewer: renderFeatureGrants' REAL whoami → 200 → entry appended
    await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#feature-grants', { timeout: 20000 }).catch(() => {});
    await sleep(2500);
    const view = await page.evaluate(() => {
      const host = document.querySelector('#feature-grants');
      const sm = Array.from(host?.querySelectorAll('a') || []).filter(a => /server manager/i.test(a.textContent || ''));
      return { hostPresent: !!host, title: /feature access/i.test(host?.textContent || ''), smText: sm[0]?.textContent?.trim() || null, smHref: sm[0]?.getAttribute('href') || null };
    });
    const pass = whoamiStatus === 200 && view.hostPresent && view.title && !!view.smText && view.smHref?.startsWith('/server-manager');
    results.push(pass);
    console.log(`iter ${i}: REAL-whoami=${whoamiStatus} viewer-entry=${!!view.smText}("${view.smText}" href=${view.smHref}) title=${view.title} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R31.1 owner-ACCEPT (REAL live owner, NO mock, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (owner-accept broken / pre-fix)');
process.exitCode = green ? 0 : 1;
