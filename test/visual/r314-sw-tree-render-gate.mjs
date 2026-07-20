// R31.4/R30.14 SW-fix tree-render gate (served==0.7.93), DET-3x. Verifies the SW fix that made /server-manager +
// /profile network-first + retired the bespoke tree for the shared rb-trace-tree renderer.
// (1) served sw.js = network-first for /server-manager AND /profile (navigationStrategy list) + CACHE_NAME rawbin-v0.7.93;
//     served sw.js == committed src/public/sw.js (the fix is deployed byte-exact).
// (2) Server Manager renders the SHARED rb-trace-tree (id=sm-tree) NOT the old bespoke inline tree — source mount +
//     the rb-trace-tree renderer is DEPLOYED in the served bundle (via /trace which mounts the same element).
// (3) served==committed bundle hash: the content-hashed /dist bundle the server serves exists in committed src/public/dist.
// NOTE: /server-manager page is owner-gated (403 non-owner) → its rendered tree VISUAL + the iOS-PWA-SW-activation repro
// = Tron's real device (webkit unlaunchable here); this gate proves the network-first + renderer LOGIC is deployed.
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const TARGET = '0.7.93';
const httpGet = (path) => new Promise((r) => {
  const req = https.request({ host: HOST, port: PORT, path, method: 'GET', rejectUnauthorized: false }, (res) => {
    let b = ''; res.on('data', (c) => b += c); res.on('end', () => r({ status: res.statusCode, body: b }));
  });
  req.on('error', () => r({ status: 0, body: '' })); req.end();
});
const serverTs = fs.readFileSync(`${REPO}/src/ts/server/server.ts`, 'utf8');
const committedSw = fs.readFileSync(`${REPO}/src/public/sw.js`, 'utf8');

const results = [];
for (let i = 1; i <= 3; i++) {
  const cfg = JSON.parse((await httpGet('/api/config')).body || '{}');
  const versionOk = cfg.version === TARGET;

  // (1) served sw.js network-first for BOTH routes + cache name + byte-equal to committed
  const sw = (await httpGet('/sw.js')).body;
  const swNetworkFirst = new RegExp(`CACHE_NAME\\s*=\\s*['"]rawbin-v${TARGET.replace(/\./g, '\\.')}['"]`).test(sw)
    && sw.includes("'/server-manager'") && sw.includes("'/profile'")
    && /navigationStrategy/.test(sw) && /networkFirst/.test(sw);
  const swServedEqCommitted = sw.trim() === committedSw.trim();

  // (1b) /profile (network-first route) reachable
  const profile = await httpGet('/profile');
  const profileOk = profile.status === 200 && /feature-grants|profile/i.test(profile.body);

  // (2) source: Server Manager mounts the SHARED rb-trace-tree#sm-tree, bespoke retired
  const rendererSrcOk = /<rb-trace-tree id="sm-tree"/.test(serverTs) && /bespoke inline tree is retired/.test(serverTs);

  // (2b)+(3) the rb-trace-tree renderer is DEPLOYED + served==committed bundle hash — via /trace (mounts the same element)
  const trace = await httpGet('/trace');
  const bundles = [...trace.body.matchAll(/src="(\/dist\/[^"]+\.js)"/g)].map((m) => m[1]);
  let rendererDeployed = false, bundleHashOk = false;
  for (const src of bundles) {
    const name = src.split('/').pop();
    if (fs.existsSync(`${REPO}/src/public/dist/${name}`)) bundleHashOk = true;   // content-hashed name committed = served==committed
    const js = (await httpGet(src)).body;
    if (/rb-trace-tree|RbTraceTree/.test(js)) rendererDeployed = true;
  }

  const pass = versionOk && swNetworkFirst && swServedEqCommitted && profileOk && rendererSrcOk && rendererDeployed && bundleHashOk;
  results.push(pass);
  console.log(`iter ${i}: version=${versionOk}(${cfg.version}) sw-network-first=${swNetworkFirst} sw==committed=${swServedEqCommitted} profile200=${profileOk} renderer-src=${rendererSrcOk} renderer-deployed=${rendererDeployed} bundle==committed=${bundleHashOk} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R31.4 SW-fix network-first + rb-trace-tree render (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: /server-manager rendered-tree VISUAL + iOS-PWA-SW-activation repro = Tron device (owner-gated + webkit unlaunchable here).');
process.exitCode = green ? 0 : 1;
