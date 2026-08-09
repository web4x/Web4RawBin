// [test:uuid:f38f87af-26ba-42cb-9516-8e4447f98e4a] R31.8c AC-featuremanager-lists-all-members (51ee3d5b9) / FeatureManager.allowedUsersChildren (Impl ad622052) — a Feature with N allowedUsers renders EXACTLY N child user-nodes ON LOAD (no cap/subset/manual-refresh), name-resolved, OPAQUE ids (<featureUuid>:<sha256[:16]>), owner(Feature-Manager)-gated 200 / non-member 403. Both Features (Server Manager 16604eee + Feature Manager 2980b7d9), N=3→3. GREEN DET-3x verify-by-pid 1314979 v0.7.114. Distinct-intent from opaque-ref Test 55d125ee (same Impl ad622052).
// R31.8c AC-featuremanager-lists-all-members (51ee3d5b9) — FeatureManager.allowedUsersChildren (Impl ad622052).
// CONFIRM-EXISTING-BEHAVIOR (architect measured it MET): a Feature with N allowedUsers renders EXACTLY N itemView
// child user-nodes ON LOAD (no subset/cap/manual-refresh), name-resolved, OPAQUE ids, owner(Feature-Manager)-gated 200.
// DET-3x, verify-by-PID (v0.7.114 pid 1314979 — NOT /api/config), SystemTester-only, pollution-safe (SM 16604eee +
// FM 2980b7d9 byte-backup/finally-restore). Gates BOTH Features (Server Manager 16604eee + Feature Manager 2980b7d9).
import { FeatureManager } from '../../src/ts/server/FeatureManager.js';
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import { OWNER_LITERAL } from './_owner-literal.mjs'; // no-secrets: owner literal read at runtime, never hardcoded

const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const SM = '16604eee-d844-4efb-bd4d-881433ca82a6';           // 'Server Manager' Feature
const FM = '2980b7d9-a166-44ca-bf73-5dd1a4ba7b16';           // 'Feature Manager' Feature (viewing children needs THIS)
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const OWNER = OWNER_LITERAL;
const EXPECTED_PID = '1314979';
const featPath = (u: string) => `${REPO}/scenario/index/${u[0]}/${u[1]}/${u[2]}/${u[3]}/${u[4]}/${u}.scenario.json`;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const readAU = (u: string): string[] => JSON.parse(fs.readFileSync(featPath(u), 'utf8')).model.allowedUsers || [];
const getRaw = (path: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string }> => new Promise((res) => {
  https.get({ host: HOST, port: PORT, path, headers, rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res({ status: r.statusCode || 0, body: b })); }).on('error', () => res({ status: 0, body: '' }));
});

let runningPid = '';
try { runningPid = execFileSync('bash', ['-c', "ps -eo pid,cmd | grep 'server/server.ts' | grep -v grep | head -1 | awk '{print $1}'"], { encoding: 'utf8' }).trim(); } catch { /* */ }
const pidFresh = runningPid === EXPECTED_PID;
const backupSM = fs.readFileSync(featPath(SM), 'utf8');
const backupFM = fs.readFileSync(featPath(FM), 'utf8');
const results: boolean[] = [];
console.log(`VERIFY-BY-PID: pid=${runningPid} (expected ${EXPECTED_PID}) fresh=${pidFresh}`);
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await sleep(1500); // live ST session
  const childrenOf = (f: string): Promise<{ status: number; body: string }> => page.evaluate(([ff, st]) => fetch(`/api/trace/children/${ff}`, { headers: { 'x-player-token': st } }).then(async r => ({ status: r.status, body: await r.text() })), [f, ST]);

  const stub = new Map([[ST, { token: ST, features: [] as string[] }]]);
  FeatureManager.grantFeature(FM, ST, stub, () => {});       // ST gets Feature-Manager VIEW access (+ becomes a member of FM)
  FeatureManager.grantFeature(SM, ST, stub, () => {});       // + a member of Server Manager (so SM has N=2 to list)
  await sleep(400);

  for (let i = 1; i <= 3; i++) {
    const perFeature: boolean[] = [];
    for (const [label, f] of [['Server Manager', SM], ['Feature Manager', FM]] as const) {
      const au = readAU(f);                                   // the N allowedUsers on disk (ON LOAD, current state)
      const ch = await childrenOf(f);                         // fresh GET each iter — not cached / not grant-triggered
      let kids: { uuid?: string; ref?: string; name?: string; type?: string }[] = [];
      try { const j = JSON.parse(ch.body); kids = j.children || []; } catch { /* */ }
      const refOf = (k: { uuid?: string; ref?: string }) => String(k.ref || k.uuid || '').replace(/^profile:/, '');
      const exactN = ch.status === 200 && kids.length === au.length;                                   // N-in → N-children (no cap/subset)
      const allOpaque = kids.length > 0 && kids.every(k => new RegExp(`^${f}:[0-9a-f]{16}$`).test(refOf(k)));  // opaque ids
      const allNamed = kids.every(k => !!(k.name && String(k.name).trim().length > 0));                 // name-resolved
      const noRaw = !ch.body.includes(ST) && !ch.body.includes(OWNER);                                  // no raw token (ST or OWNER)
      const expectedIds = au.map(t => FeatureManager.userIdOf(t)).sort();
      const gotIds = kids.map(k => refOf(k).split(':')[1]).sort();
      const idsMatch = JSON.stringify(expectedIds) === JSON.stringify(gotIds);                          // each member ↔ its opaque id
      const ok = pidFresh && exactN && allOpaque && allNamed && noRaw && idsMatch;
      perFeature.push(ok);
      if (i === 1) console.log(`  [${label} ${f.slice(0, 8)}] N=${au.length} children=${kids.length} exactN=${exactN} opaque=${allOpaque} named=${allNamed} noRaw=${noRaw} idsMatch=${idsMatch} names=${JSON.stringify(kids.map(k => k.name))}`);
    }
    const pass = perFeature.every(Boolean);
    results.push(pass);
    console.log(`iter ${i}: SM+FM lists-all-members (N→N, on-load, opaque, named, owner-gated) => ${pass ? 'GREEN' : 'RED'}`);
  }

  // owner-gated: a NON-member (no token) → 403 no-leak (both Features)
  const p0sm = await getRaw(`/api/trace/children/${SM}`, {});
  const p0fm = await getRaw(`/api/trace/children/${FM}`, {});
  const ownerGated = p0sm.status === 403 && p0fm.status === 403 && !p0sm.body.includes(ST) && !p0fm.body.includes(OWNER);
  results.push(ownerGated);
  console.log(`owner-gated non-member: SM=${p0sm.status} FM=${p0fm.status} no-leak=${!p0sm.body.includes(ST) && !p0fm.body.includes(OWNER)} => ${ownerGated ? 'GREEN' : 'RED'}`);

  FeatureManager.revokeFeature(FM, ST, stub, () => {});
  FeatureManager.revokeFeature(SM, ST, stub, () => {});
  await ctx.close();
} finally {
  fs.writeFileSync(featPath(SM), backupSM); fs.writeFileSync(featPath(FM), backupFM);
  await browser.close();
  const restored = fs.readFileSync(featPath(SM), 'utf8') === backupSM && fs.readFileSync(featPath(FM), 'utf8') === backupFM && !readAU(SM).includes(ST) && !readAU(FM).includes(ST);
  console.log(`pollution-safe restore: SM+FM == pre-gate + ST removed = ${restored}`);
  if (!restored) results.push(false);
}

console.log('\n===== R31.8c FeatureManager lists-all-members (DET-3x, verify-by-pid) =====');
const green = results.length >= 4 && results.every(Boolean) && pidFresh;
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
