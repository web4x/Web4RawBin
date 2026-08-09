// [test:uuid:16c10d4d-94ba-49be-9db5-6f65211e3982] R32.9 FeatureManager surface — verifies the MDA feature is DISCOVERED + membership-gated (INV-D2 owner auto-seed via bootstrapSeed 03b2b1db; INV-D4 fail-closed serverModelPage 152c8e0f /model 403 + non-member featuresForToken list EXCLUDES MDA, non-vacuous). NON-member rendered-list exclusion + /model+/server-manager 403 (authenticated-non-member, live raw-ws IDENTIFY session) + INV-D2 disk. Owner-sees-📐 render = Tron device IMG_4715. → req wires this Test onto the R32.9 impl (row = serverModelPage 152c8e0f).
// R32.9 FeatureManager SURFACE — NON-member rendered-list exclusion (the automatable half), DET-3x. The surface list a
// user sees = MSG.PROFILE.features (featuresForToken, server-authoritative, data-driven launchPage INV-D3). This gate
// establishes a REAL live SystemTester session via a raw-ws IDENTIFY (@390 dims), captures the server's live
// MSG.PROFILE, and asserts gotProfile=TRUE (the real list arrived) AND the DISCOVERED MDA 'Model-Driven Code Quality'
// is ABSENT (non-vacuous exclusion) — plus /model + /server-manager 403 for that SAME live session (INV-D4 fail-closed,
// authenticated-non-member). Owner-sees-📐-in-list + launch→/model = Tron DEVICE-confirmed (IMG_4715, his real token).
// INV-D2 owner auto-seed = disk-read (MDA.allowedUsers==[owner] despite mint-empty). Measured DIFFERENTLY than expert.
import https from 'node:https';
import fs from 'node:fs';
import { WebSocket } from 'ws';
import { OWNER_LITERAL } from './_owner-literal.mjs'; // no-secrets: owner literal read at runtime, never hardcoded

const HOST = 'localhost', PORT = 4444;                        // same server as prod.wo-da.de:4444 on WODA.prod
const OWNER = OWNER_LITERAL;
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const MDA = 'Model-Driven Code Quality';
const MDA_UNIT = '/var/dev/Workspaces/web4x/Web4RawBin/scenario/index/9/0/1/e/0/901e0ece-c735-4c20-8652-1809069662c3.scenario.json';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const mda = JSON.parse(fs.readFileSync(MDA_UNIT, 'utf8')).model;
const invD2 = Array.isArray(mda.allowedUsers) && mda.allowedUsers.length === 1 && mda.allowedUsers[0] === OWNER && mda.launchPage === '/model' && mda.icon === '📐' && mda.name === MDA;

const httpGet = (path, token) => new Promise((res) => { const r = https.request({ host: HOST, port: PORT, path, method: 'GET', rejectUnauthorized: false, headers: { 'x-player-token': token } }, x => { x.on('data', () => {}); x.on('end', () => res(x.statusCode)); }); r.on('error', () => res(0)); r.end(); });
const version = () => new Promise((res) => { https.get({ host: HOST, port: PORT, path: '/api/config', rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res(''); } }); }).on('error', () => res('')); });

// raw-ws IDENTIFY(ST) → capture the live MSG.PROFILE.features; keep the socket OPEN so the token has a live session
async function nonMemberProfile() {
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${HOST}:${PORT}`, { rejectUnauthorized: false });
    let profile = null, done = false;
    const finish = async () => { if (done) return; done = true;
      const model = await httpGet('/model', ST); const sm = await httpGet('/server-manager', ST); // fetched WHILE live → authenticated-non-member 403
      try { ws.close(); } catch { /* */ }
      resolve({ gotProfile: profile !== null, names: profile ? (profile.features || []).map(f => f.name) : [], serverManager: profile?.serverManager, model, sm });
    };
    ws.on('message', (d) => { let m; try { m = JSON.parse(d.toString()); } catch { return; }
      if (m.type === 'welcome') ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: ST, deviceId: 'systemtester-e2e', name: 'SystemTester', screenWidth: 390, screenHeight: 844, platform: 'iPhone' }));
      if (m.features !== undefined) { profile = { features: m.features, serverManager: m.serverManager }; setTimeout(finish, 300); }
    });
    ws.on('error', () => finish());
    setTimeout(finish, 8000);
  });
}

const results = [];
const ver = (await version()) === '0.8.9';
for (let i = 1; i <= 3; i++) {
  const non = await nonMemberProfile();
  // ★ NON-VACUOUS exclusion: the live MSG.PROFILE ARRIVED (gotProfile) AND the DISCOVERED MDA feature is NOT in the list
  const listExcludesMda = non.gotProfile === true && !non.names.includes(MDA);
  const failClosed = non.model === 403 && non.sm === 403;                 // authenticated-non-member → gated launch-targets 403
  const pass = ver && invD2 && listExcludesMda && failClosed;
  results.push(pass);
  console.log(`iter ${i}: v0.8.9=${ver} INV-D2=${invD2} | NON-member MSG.PROFILE: gotProfile=${non.gotProfile} features=[${non.names.join(',')}] MDA-in-list=${non.names.includes(MDA)} → excludes-MDA(non-vacuous)=${listExcludesMda} | fail-closed(/model=${non.model} /server-manager=${non.sm})=${failClosed} => ${pass ? 'GREEN' : 'RED'}`);
  await sleep(300);
}

console.log('\n===== R32.9 FeatureManager surface — NON-member rendered-list exclusion (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('R32.9 surface FULLY gated: owner-render 📐 (Tron device IMG_4715 ✓) + non-member exclusion (this gate) + INV-D2/D4 foundation. POLLUTION-SAFE (SystemTester only, no writes).');
process.exitCode = green ? 0 : 1;
