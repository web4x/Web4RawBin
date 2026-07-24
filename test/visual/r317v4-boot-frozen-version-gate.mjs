// [test:uuid:ff91ca36-1bd4-417e-a103-af85c15ef50c] R31.7 INV-V4 boot-frozen version (the version-lie killer) — getVersion() returns BOOT_VERSION, a module-load const (server.ts:62/68), NOT a per-request fs read → /api/config CANNOT change without a real restart, BY CONSTRUCTION. GREEN DET-3x v0.7.135: source-audit (getVersion=return BOOT_VERSION, module-const IIFE, /api/config uses getVersion, exactly 1 module-scope package.json read) + runtime (served==committed==build-manifest==0.7.135, /api/config==/api/health single-source, stable across 5 polls no drift). Independent + NON-mutating (anti-circular vs architect decoy-injection, PO-approved). → req mints onto the R31.7 getVersion/INV-V4 impl.
// R31.7 INV-V4 — the version-lie killer. /api/config must return the BOOT-frozen version, NOT a per-request read, so a
// rebuild-without-restart (or a decoy package.json/build-manifest edit) CANNOT change /api/config until a REAL restart.
// INDEPENDENT + NON-MUTATING (measured DIFFERENTLY than the architect's decoy-injection = anti-circular, PO-approved):
//  (A) SOURCE-AUDIT by construction: getVersion()=return BOOT_VERSION (module-load const IIFE :62), /api/config uses
//      getVersion() (:1409) — NO fs.readFileSync inside the handler or getVersion → cannot change without a module re-load (restart).
//  (B) RUNTIME DET-3x: /api/config .version == committed pkg.version == build-manifest .version == 0.7.135, and /api/config
//      == /api/health (single source getVersion), STABLE across N polls (no per-request drift).
// Does NOT mutate the shared prod checkout. served self-verified.
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.135';
const getJson = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => { try { r(JSON.parse(b)); } catch { r({}); } }); }); q.on('error', () => r({})); q.end(); });

// ── (A) source-audit: INV-V4 by construction ──
const src = fs.readFileSync(`${REPO}/src/ts/server/server.ts`, 'utf8');
const getVersionFrozen = /function getVersion\(\)\s*:\s*string\s*\{\s*return BOOT_VERSION;\s*\}/.test(src);        // returns the const, no fs
const bootConstModuleScope = /\nconst BOOT_VERSION\s*:\s*string\s*=\s*\(\(\)\s*=>\s*\{/.test(src);                  // module-scope IIFE captured once
const configUsesGetVersion = /version:\s*getVersion\(\)/.test(src) && /res\.end\(JSON\.stringify\(\{\s*baseDomain[^}]*version:\s*getVersion\(\)/.test(src.replace(/\n/g, ' '));
// the ONLY package.json readFileSync is the module-load PKG_VERSION const (:49); assert it's exactly 1 and module-scope (not per-request in a handler)
const pkgReads = (src.match(/readFileSync[^\n]*package\.json/g) || []).length;                                     // line-scoped (nested parens) → expect exactly 1
const pkgReadIsModuleConst = /const PKG_VERSION[^\n]*readFileSync[^\n]*package\.json/.test(src);                    // the read is the module-load const, not a handler
const auditOk = getVersionFrozen && bootConstModuleScope && configUsesGetVersion && pkgReads === 1 && pkgReadIsModuleConst;

// committed + build-manifest sources
const committed = JSON.parse(fs.readFileSync(`${REPO}/package.json`, 'utf8')).version;
let manifest = null; try { manifest = JSON.parse(fs.readFileSync(`${REPO}/src/public/dist/build-manifest.json`, 'utf8')).version; } catch { /* fallback path */ }

const results = [];
console.log(`SOURCE-AUDIT (INV-V4 by construction): getVersion=return BOOT_VERSION=${getVersionFrozen} | BOOT_VERSION module-const=${bootConstModuleScope} | /api/config uses getVersion()=${configUsesGetVersion} | package.json readFileSync count=${pkgReads}&moduleConst=${pkgReadIsModuleConst}(expect 1 @module-load) => ${auditOk ? 'PASS' : 'FAIL'}`);
console.log(`committed pkg.version=${committed} | build-manifest.version=${manifest}`);

for (let i = 1; i <= 3; i++) {
  const versions = [];
  for (let n = 0; n < 5; n++) { versions.push((await getJson('/api/config')).version); }      // stable-poll: no per-request drift
  const health = (await getJson('/api/health')).version;
  const cfg = versions[0];
  const servedIsTarget = cfg === TARGET;
  const equalsCommitted = cfg === committed;                                                   // served == committed
  const singleSource = cfg === health;                                                         // /api/config == /api/health (both getVersion)
  const stable = versions.every(v => v === cfg);                                               // no per-request drift = frozen
  const manifestMatch = !manifest || manifest === cfg;                                          // boot source == served
  const pass = auditOk && servedIsTarget && equalsCommitted && singleSource && stable && manifestMatch;
  results.push(pass);
  console.log(`iter ${i}: served=${cfg}(target=${servedIsTarget} ==committed=${equalsCommitted}) config==health=${singleSource}(${health}) stable5=${stable}[${versions.join(',')}] manifest==served=${manifestMatch} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R31.7 INV-V4 boot-frozen version (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: INV-V4 proven BY CONSTRUCTION (getVersion reads a boot-frozen const, no per-request fs) + empirical stable-poll; anti-circular vs architect decoy-injection. No prod mutation.');
process.exitCode = green ? 0 : 1;
