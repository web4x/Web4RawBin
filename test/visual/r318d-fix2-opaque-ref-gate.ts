// [test:uuid:55d125ee-d76a-4fcd-8797-4a51e0e965b5] R31.8c FIX-2 opaque-ref — FeatureManager.allowedUsersChildren (Impl ad622052): a Feature's allowedUsers child ref = '<featureUuid>:<sha256(token)[:16]>' (opaque userId, e.g. 16604eee-…:ce39a9092cdafdf1), and the raw auth-token (ce981242) appears NOWHERE in /api/trace/children body. GREEN DET-3x, verify-by-pid 1314979 (v0.7.114), pollution-safe. + flip 403↔200 + P0 non-member→403 no-leak.
// R31.8c FIX-2 — OPAQUE-REF (credential-leak fix), Impl FeatureManager.allowedUsersChildren (ad622052, Method 72c660f9).
// VERIFY-BY-PID (fresh v0.7.114 pid 1314979 — NOT /api/config, which reads the manifest + lies via [r]). DET-3x,
// SystemTester-only, pollution-safe (SM Feature unit 16604eee byte-backup/finally-restore). Reuses the r318b flip harness.
// (2) OPAQUE-REF (PRIMARY, the NEW FIX-2 assertion): grant ST → member GET /api/trace/children/<Feature> → each
//     allowedUsers child ref = '<featureUuid>:<sha256(token)[:16]>' (userIdOf) AND the raw auth-token (ce981242) appears
//     NOWHERE in the body → revoke. (1) FLIP 403↔200 by membership. (3) P0 spot: non-member GET → 403 + no-leak.
import { FeatureManager } from '../../src/ts/server/FeatureManager.js';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';

const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const SM = '16604eee-d844-4efb-bd4d-881433ca82a6';
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const FEAT = `${REPO}/scenario/index/1/6/6/0/4/${SM}.scenario.json`;
const FM = '2980b7d9-a166-44ca-bf73-5dd1a4ba7b16';          // 'Feature Manager' Feature — viewing a Feature's member list needs THIS (server.ts:1503 requireFeatureAccess 'Feature Manager'), not Server-Manager membership
const FM_FEAT = `${REPO}/scenario/index/2/9/8/0/b/${FM}.scenario.json`;
const EXPECTED_PID = '1314979';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const readAU = (): string[] => JSON.parse(fs.readFileSync(FEAT, 'utf8')).model.allowedUsers || [];
const getRaw = (path: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string }> => new Promise((res) => {
  https.get({ host: HOST, port: PORT, path, headers, rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res({ status: r.statusCode || 0, body: b })); }).on('error', () => res({ status: 0, body: '' }));
});

// VERIFY-BY-PID: the running server process (never /api/config)
let runningPid = '';
try { runningPid = execFileSync('bash', ['-c', "ps -eo pid,cmd | grep 'server/server.ts' | grep -v grep | head -1 | awk '{print $1}'"], { encoding: 'utf8' }).trim(); } catch { /* */ }
const userId = FeatureManager.userIdOf(ST);                 // sha256(ST)[:16] — the opaque id that must replace the raw token

const backup = fs.readFileSync(FEAT, 'utf8');
const backupFM = fs.readFileSync(FM_FEAT, 'utf8');
const results: boolean[] = [];
console.log(`VERIFY-BY-PID: running server.ts pid=${runningPid} (expected fresh ${EXPECTED_PID}) | userIdOf(ST)=${userId} (16-hex=${/^[0-9a-f]{16}$/.test(userId)})`);
const pidFresh = runningPid === EXPECTED_PID;
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await sleep(1500); // live ST session
  const whoami = (): Promise<number> => page.evaluate((st) => fetch('/api/server-manager/whoami', { headers: { 'x-player-token': st } }).then(r => r.status), ST);
  const childrenAsMember = (): Promise<{ status: number; body: string }> => page.evaluate(([f, st]) => fetch(`/api/trace/children/${f}`, { headers: { 'x-player-token': st } }).then(async r => ({ status: r.status, body: await r.text() })), [SM, ST]);

  for (let i = 1; i <= 3; i++) {
    const stub = new Map([[ST, { token: ST, features: [] as string[] }]]);
    // (1) FLIP: non-member 403 → grant Server-Manager → 200
    const before = await whoami();
    FeatureManager.grantFeature(SM, ST, stub, () => {});      // ST becomes a MEMBER of Server Manager (appears in its children)
    await sleep(400);
    const granted = await whoami();

    // (2) OPAQUE-REF (primary) — ST also needs Feature-Manager access to VIEW the member list (server.ts:1503)
    FeatureManager.grantFeature(FM, ST, stub, () => {});
    await sleep(400);
    const ch = await childrenAsMember();
    let kids: { uuid?: string; ref?: string; type?: string; name?: string }[] = [];
    try { const j = JSON.parse(ch.body); kids = j.children || j.nodes || j.items || (Array.isArray(j) ? j : []); } catch { /* */ }
    const profileKids = kids.filter(k => (k.type === 'profile') || /^(profile:)?[0-9a-f-]+:[0-9a-f]{16}$/.test(String(k.ref || k.uuid || '')));
    const stChild = profileKids.find(k => String(k.ref || k.uuid || '').includes(userId));
    const refOpaque = !!stChild && new RegExp(`(^|:)${SM}:${userId}$`).test(String(stChild.ref || stChild.uuid || '').replace(/^profile:/, ''));
    const noRawToken = !ch.body.includes(ST);                 // ★ the raw auth-token must appear NOWHERE
    const opaque = ch.status === 200 && profileKids.length >= 1 && refOpaque && noRawToken;

    FeatureManager.revokeFeature(FM, ST, stub, () => {});
    FeatureManager.revokeFeature(SM, ST, stub, () => {});
    await sleep(400);
    const revoked = await whoami();
    const flip = before === 403 && granted === 200 && revoked === 403;

    const pass = pidFresh && flip && opaque;
    results.push(pass);
    console.log(`iter ${i}: [1]FLIP=${flip}(${before}→${granted}→${revoked}) | [2]OPAQUE-REF=${opaque}(status=${ch.status} profileKids=${profileKids.length} stRef=${(stChild?.ref || stChild?.uuid || 'none')} refOpaque=${refOpaque} noRawToken=${noRawToken}) => ${pass ? 'GREEN' : 'RED'}`);
  }

  // (3) P0 spot: non-member GET → 403 + no raw token / no allowedUsers leak
  const p0 = await getRaw(`/api/trace/children/${SM}`, {});
  const p0ok = p0.status === 403 && !p0.body.includes(ST) && !/allowedUsers/.test(p0.body);
  results.push(p0ok);
  console.log(`(3) P0 spot non-member children: status=${p0.status} no-token-leak=${!p0.body.includes(ST)} => ${p0ok ? 'GREEN' : 'RED'}`);
  await ctx.close();
} finally {
  fs.writeFileSync(FEAT, backup); fs.writeFileSync(FM_FEAT, backupFM);
  await browser.close();
  const restored = fs.readFileSync(FEAT, 'utf8') === backup && fs.readFileSync(FM_FEAT, 'utf8') === backupFM && !readAU().includes(ST);
  console.log(`pollution-safe restore: SM + FM Feature units == pre-gate + ST NOT in allowedUsers = ${restored}`);
  if (!restored) results.push(false);
}

console.log('\n===== R31.8c FIX-2 opaque-ref (DET-3x, verify-by-pid) =====');
const green = results.length >= 4 && results.every(Boolean) && (runningPid === EXPECTED_PID);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED', `| pidFresh=${runningPid === EXPECTED_PID}`);
console.log('NOTE: (4) terminal node-pty loads = r3110 (reused peer); interactive keystroke VISUAL = Tron device.');
process.exitCode = green ? 0 : 1;
