// [test:uuid:ebf52aa4-a8d1-47d1-91fa-e18745af3d3b] R31.8 FeatureManager.grantFeature (Impl 5e2f6781) — owner grants a LIVE non-owner the Server Manager Feature → SAME session flips 403→200; MIRROR adds to BOTH Feature.allowedUsers (disk) + profile.features. GREEN DET-3x served v0.7.105 pid 667508 (verify-by-pid), pollution-safe (Feature unit byte-restored).
// [test:uuid:8b79320f-51c0-4aec-be86-22256094e9be] R31.8 FeatureManager.revokeFeature (Impl 987a31a9) — revoke flips the SAME session 200→403; MIRROR removes from BOTH sides; + INV-F4 root-of-trust: a non-owner POST /api/feature-manager {grant} → 403 with allowedUsers UNCHANGED (no self-grant/escalation). GREEN DET-3x served v0.7.105 pid 667508.
// R31.8 slice-(b) grant/revoke FLIP — FeatureManager.grantFeature (Impl 5e2f6781) + revokeFeature (Impl 987a31a9),
// Class 9f7f345a. THE Tron-facing proof: owner grants a LIVE non-owner the 'Server Manager' Feature → the SAME session
// flips 403→200; revoke → 403. served v0.7.105 fresh pid 667508 (verify-by-pid). DET-3x, POLLUTION-SAFE: the Server
// Manager Feature unit (16604eee) is backed up and byte-restored in finally (grant adds SystemTester, revoke removes it
// → back to [OWNER]); the profile-side mirror uses an in-memory stub map (no profiles.json write).
// (FLIP) live SystemTester baseline 403 → grantFeature → 200 → revokeFeature → 403. (MIRROR) grant adds to BOTH
// Feature.allowedUsers (disk) AND profile.features (stub); revoke clears both. (INV-F4) non-owner POST /api/feature-manager
// {grant} → 403 AND allowedUsers UNCHANGED (no self-grant/escalation — the hardcoded-owner root-of-trust).
import { FeatureManager } from '../../src/ts/server/FeatureManager.js';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'node:fs';
import https from 'node:https';
import { OWNER_LITERAL } from './_owner-literal.mjs'; // no-secrets: owner literal read at runtime, never hardcoded

const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const SM = '16604eee-d844-4efb-bd4d-881433ca82a6';           // 'Server Manager' Feature unit
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const FEAT = `${REPO}/scenario/index/1/6/6/0/4/${SM}.scenario.json`;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const readAU = (): string[] => JSON.parse(fs.readFileSync(FEAT, 'utf8')).model.allowedUsers || [];
const post = (path: string, body: unknown, headers: Record<string, string> = {}): Promise<number> => new Promise((res) => {
  const data = JSON.stringify(body); const q = https.request({ host: HOST, port: PORT, path, method: 'POST', rejectUnauthorized: false, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } }, (r) => { r.on('data', () => {}); r.on('end', () => res(r.statusCode || 0)); }); q.on('error', () => res(0)); q.write(data); q.end();
});

const backup = fs.readFileSync(FEAT, 'utf8');
const results: boolean[] = [];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await sleep(1500); // SystemTester ws → live authenticated session
  const whoami = (): Promise<number> => page.evaluate((st) => fetch('/api/server-manager/whoami', { headers: { 'x-player-token': st } }).then(r => r.status), ST);

  for (let i = 1; i <= 3; i++) {
    const before = await whoami();                                          // non-member → 403
    const stub = new Map([[ST, { token: ST, features: [] as string[] }]]);
    const g = FeatureManager.grantFeature(SM, ST, stub, () => {});          // owner-gate is INV-F4 (tested below); here we drive the impl
    const auGrant = readAU().includes(ST);                                  // MIRROR side 1: Feature.allowedUsers (disk)
    const mirrorGrant = (stub.get(ST)!.features || []).includes(SM);        // MIRROR side 2: profile.features
    await sleep(400);
    const granted = await whoami();                                         // member + live → 200 (the FLIP)
    FeatureManager.revokeFeature(SM, ST, stub, () => {});
    const auRevoke = !readAU().includes(ST);
    const mirrorRevoke = !(stub.get(ST)!.features || []).includes(SM);
    await sleep(400);
    const revoked = await whoami();                                         // revoked → 403 (flip back)
    const flip = g.ok && before === 403 && granted === 200 && revoked === 403 && auGrant && mirrorGrant && auRevoke && mirrorRevoke;
    results.push(flip);
    console.log(`iter ${i}: FLIP before=${before} →grant→ ${granted} →revoke→ ${revoked} | MIRROR grant(au=${auGrant} prof=${mirrorGrant}) revoke(au=${auRevoke} prof=${mirrorRevoke}) => ${flip ? 'GREEN' : 'RED'}`);
  }

  // INV-F4: non-owner POST the owner-gated grant endpoint → 403, allowedUsers UNCHANGED (no self-grant)
  const auPre = JSON.stringify(readAU());
  const noOwner = await post('/api/feature-manager', { action: 'grant', feature: SM, token: ST });                  // no token/cookie
  const litOwner = await post('/api/feature-manager', { action: 'grant', feature: SM, token: ST }, { 'x-player-token': OWNER_LITERAL }); // leaked owner literal, not a live session
  const invF4 = noOwner === 403 && litOwner === 403 && JSON.stringify(readAU()) === auPre;
  results.push(invF4);
  console.log(`INV-F4 non-owner grant: no-token=${noOwner} owner-literal-not-live=${litOwner} allowedUsers-unchanged=${JSON.stringify(readAU()) === auPre} => ${invF4 ? 'GREEN' : 'RED'}`);
  await ctx.close();
} finally {
  fs.writeFileSync(FEAT, backup);                                           // POLLUTION-SAFE byte-restore
  await browser.close();
  const restored = fs.readFileSync(FEAT, 'utf8') === backup && !readAU().includes(ST);
  console.log(`pollution-safe restore: Feature unit == pre-gate + SystemTester NOT in allowedUsers = ${restored}`);
  if (!restored) results.push(false);
}

console.log('\n===== R31.8 slice-(b) grant/revoke FLIP (DET-3x) =====');
const green = results.length >= 4 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
