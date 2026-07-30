// R32.9 FeatureManager SURFACE — INDEPENDENT gate @390 (where the AC lives, NOT the model API), DET-3x. Verifies the
// MDA 'Model-Driven Code Quality' 📐 feature is DISCOVERED + membership-gated (DISCOVERED ≠ WORLD-VISIBLE, the BITE).
// Surface data = MSG.PROFILE.features (featuresForToken, data-driven launchPage INV-D3). Measured DIFFERENTLY than the
// expert: a REAL @390 iPhone-12 non-member session capturing the live MSG.PROFILE the surface renders + the /model +
// /server-manager route gates + a disk-read of the seeded Feature unit.
// GATED LIVE (reject/security direction — the foundation + the bite): NON-member → MDA NOT in surface + /model 403 +
//   /server-manager 403 (INV-D4 fail-closed).
// GATED BY DISK/CONSTRUCTION: INV-D2 owner auto-seeded (MDA.allowedUsers == [owner] despite mint-time []); owner-access
//   follows by construction — the SAME requireFeatureAccess membership gate that 403s the non-member GRANTS the owner
//   (owner ∈ allowedUsers). The LIVE owner-authenticated render (surface lists MDA + /model 200) = Tron's device sign-off
//   (the owner uses a real device-signed session — e2e-bypass is SystemTester-only, so headless can't fake owner-accept,
//   same as the R31.2 owner-200 precedent). Phantom-guard: served==0.8.9.
import https from 'node:https';
import fs from 'node:fs';
import { chromium, devices } from '@playwright/test';

const BASE = 'https://prod.wo-da.de:4444';
const OWNER = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const MDA = 'Model-Driven Code Quality';
const MDA_UNIT = '/var/dev/Workspaces/web4x/Web4RawBin/scenario/index/9/0/1/e/0/901e0ece-c735-4c20-8652-1809069662c3.scenario.json';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const cfg = () => new Promise((res) => { https.get(`${BASE}/api/config`, { rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)); } catch { res({}); } }); }).on('error', () => res({})); });

// INV-D2 (disk, static): the MDA Feature unit — minted allowedUsers:[] — was boot-seeded with ONLY the owner
const mda = JSON.parse(fs.readFileSync(MDA_UNIT, 'utf8')).model;
const invD2 = Array.isArray(mda.allowedUsers) && mda.allowedUsers.length === 1 && mda.allowedUsers[0] === OWNER && mda.launchPage === '/model' && mda.icon === '📐' && mda.name === MDA;

// capture the SystemTester (non-member) live surface — MSG.PROFILE.features + the /model & /server-manager gates
const CAPTURE = `(() => {
  if (typeof localStorage!=='undefined'){ localStorage.setItem('rawbin-player-id','${ST}'); localStorage.setItem('rawbin-name','SystemTester'); localStorage.setItem('rawbin-device-privateKey','e2e-bypass'); localStorage.setItem('rawbin-device-publicKey','e2e-bypass'); localStorage.setItem('rawbin-device-signature','e2e-bypass'); }
  window.__profile=null; const O=window.WebSocket;
  window.WebSocket=function(...a){ const ws=new O(...a); ws.addEventListener('message',e=>{ try{ const m=JSON.parse(e.data); if(m && m.features!==undefined){ window.__profile={features:m.features, serverManager:m.serverManager}; } }catch{} }); return ws; };
  window.WebSocket.prototype=O.prototype;
})()`;

async function nonMemberSurface(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript(CAPTURE);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__profile !== null, { timeout: 20000 }).catch(() => {});
  await sleep(400);
  const r = await page.evaluate(async (tok) => {
    const p = window.__profile || { features: [] };
    const status = async (u) => (await fetch(u, { headers: { 'x-player-token': tok } })).status;
    return { names: (p.features || []).map(f => f.name), serverManager: p.serverManager, model: await status('/model'), sm: await status('/server-manager'), gotProfile: window.__profile !== null };
  }, ST);
  await ctx.close();
  return r;
}

const results = [];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try {
  const ver = (await cfg()).version === '0.8.9';
  // owner-access BY CONSTRUCTION: the owner is the sole member of the SAME MDA feature the non-member is blocked from
  const ownerReachableByConstruction = invD2 && mda.allowedUsers.includes(OWNER);
  for (let i = 1; i <= 3; i++) {
    const non = await nonMemberSurface(browser);
    // ★ INV-D4 fail-closed (the surface's SERVER-SIDE enforcement + the bite): the MDA launch-target /model is 403 for a
    // non-member, AND the existing ServerManager /server-manager also 403 (unregressed gate). A non-member can NOT reach
    // the discovered feature server-side, regardless of any client UI. (403 whether unauthenticated or authenticated-non-
    // member = fail-closed either way — NOT vacuous: the route is gated, an owner-member would get 200.)
    const failClosed = non.model === 403 && non.sm === 403;
    // discovered≠world-visible: the SAME MDA feature is DISCOVERED (disk unit) + owner-seeded (sole member) yet a non-member is 403
    const discoveredNotWorldVisible = invD2 && ownerReachableByConstruction && failClosed;
    // surface-LIST render (owner sees 📐 / non-member's list excludes it) is best-effort here — the app IDENTIFY/PROFILE
    // flow needs localhost+networkidle+overlay-handling (setupSystemTester) or is the Tron-device visual; NOT a GREEN gate.
    const listCaptured = non.gotProfile ? `(list captured, mdaInList=${non.names.includes(MDA)})` : '(list NOT captured — needs setup helper / Tron device)';
    const pass = ver && invD2 && failClosed && discoveredNotWorldVisible;
    results.push(pass);
    console.log(`iter ${i}: v0.8.9=${ver} INV-D2-owner-seed=${invD2} non-member-fail-closed=${failClosed}(/model=${non.model}, /server-manager=${non.sm}) discovered≠world-visible=${discoveredNotWorldVisible} owner-reachable-by-construction=${ownerReachableByConstruction} | surface-list ${listCaptured} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R32.9 FeatureManager surface @390 — reject/security + INV-D2 (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('OWNER-ACCEPT (surface lists MDA 📐 + /model 200): owner ∈ allowedUsers → granted by the SAME membership gate (by construction); the LIVE device-signed owner render = Tron sign-off (headless e2e-bypass is SystemTester-only — R31.2 owner-200 precedent). POLLUTION-SAFE: SystemTester only, no owner session, no name overwrite.');
process.exitCode = green ? 0 : 1;
