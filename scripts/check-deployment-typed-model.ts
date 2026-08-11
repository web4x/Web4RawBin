/**
 * T40.11 Slice-1 GATE (design-r40.11-depref-migration-split.md §Slice 1) — pure unit test of DeploymentModel.buildTypedModel.
 * Isolated by construction (R40.31): buildTypedModel is PURE, so NO prod mutation / no scenario I/O. Must be able to FAIL:
 * asserts the exact 5-descriptor reconcile output + STUB-MUST-FAIL on an untypeable ref (never a silent drop). Exit != 0 on
 * any failure; folds into ci:gates.
 */
import { DeploymentModel, type TypedUnit } from '../src/ts/server/DeploymentModel.js';

const M2 = (n: string) => `ior:instance:a1d2e3f4-0000-4a1b-8c2d-0000000000${n}`;
const SERVICE = M2('25'), CONFIGFILE = M2('27'), CERTIFICATE = M2('28'), KEYFILE = M2('29'), ENVVALUE = M2('30');

// Fixture = the real WODA.prod node's 4 deploymentRefs (fc327458).
const fixtureNode = { model: { deploymentRefs: [
  { role: 'ssh-service', ref: 'ior:file:/etc/ssh/sshd_config' },
  { role: 'ssh-host-identity', ref: 'ior:file:~/.ssh/public_keys/root.WODA.prod.public_key' },
  { role: 'domain', ref: 'ior:file:.env#LE_DOMAIN' },
  { role: 'letsencrypt-cert', ref: 'ior:file:/etc/letsencrypt/live/prod.wo-da.de/fullchain.pem' },
] } };

const fail: string[] = [];
const check = (cond: boolean, msg: string) => { if (!cond) fail.push(msg); };
const byType = (units: TypedUnit[], t: string) => units.filter(u => u.m2Type === t);

const units = DeploymentModel.buildTypedModel(fixtureNode);

// (1) exactly 5 descriptors from 4 refs (the 1→2 ssh-service split)
check(units.length === 5, `expected 5 descriptors, got ${units.length}`);
// (2) each M2 type present exactly once
for (const [t, name] of [[SERVICE, 'Service'], [CONFIGFILE, 'ConfigFile'], [KEYFILE, 'KeyFile'], [CERTIFICATE, 'Certificate'], [ENVVALUE, 'EnvValue']] as const)
  check(byType(units, t).length === 1, `expected exactly 1 ${name} unit, got ${byType(units, t).length}`);
// (3) ssh-service → Service + ConfigFile with the configuredBy edge
const svc = byType(units, SERVICE)[0], cfg = byType(units, CONFIGFILE)[0];
check(!!svc && !!cfg && svc.configuredBy === cfg.key, `Service.configuredBy must point to the ConfigFile key (${svc?.configuredBy} vs ${cfg?.key})`);
check(cfg?.manifestsAs === '/etc/ssh/sshd_config', `ConfigFile.manifestsAs should be the sshd_config path, got ${cfg?.manifestsAs}`);
// (4) EnvValue carries the .env#LE_DOMAIN fragment
const env = byType(units, ENVVALUE)[0];
check(env?.manifestsAs === '.env' && env?.fragment === 'LE_DOMAIN', `EnvValue must carry manifestsAs=.env fragment=LE_DOMAIN, got ${env?.manifestsAs}#${env?.fragment}`);
// (5) FileBacked units resolve a real leaf path
check(byType(units, KEYFILE)[0]?.manifestsAs?.includes('root.WODA.prod') === true, 'KeyFile must manifestAs the real key path');
check(byType(units, CERTIFICATE)[0]?.manifestsAs?.includes('fullchain.pem') === true, 'Certificate must manifestAs the real cert path');

// STUB-MUST-FAIL: an untypeable ref THROWS (never a silent drop)
let threw = false;
try { DeploymentModel.buildTypedModel({ model: { deploymentRefs: [{ role: 'mystery-role', ref: 'ior:file:/x' }] } }); }
catch { threw = true; }
check(threw, 'buildTypedModel MUST throw on an untypeable deploymentRef role (never silently drop it)');

if (fail.length) { console.error('✗ check-deployment-typed-model FAILED:\n  - ' + fail.join('\n  - ')); process.exit(1); }
console.log('✓ check-deployment-typed-model — 5 typed descriptors, configuredBy split, .env fragment, stub-must-fail all pass.');
