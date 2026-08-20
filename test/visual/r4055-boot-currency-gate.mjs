// [test:uuid:3a6ba052-47cb-48bd-8961-24630f5e5a54] R40.55 bootGuard.assertCurrencyAndStatelessness (UseCase f7945307,
// Req dc809efb) — the boot-currency + statelessness guard is FAILABLE, and still bites AFTER the cure. R40.55's OWN
// scope (distinct-intent): a boot may NOT name a sprint/version diverging from HEAD, AND carries NO active-state.
// INDEPENDENT hop: adopts the guard's 22 --selftest cases as failability evidence (stale-bites, positional-exemption,
// fail-closed on every truth-source failure, OWNED/EXCLUDED/UNCLASSIFIED classification, dead-exemption), then adds the
// SEEDED-REGRESSION the pure selftests do not cover: seed a stale/state boot into a REAL owned boot file in an ISOLATED
// synthetic scratch workspace → guard --strict RED → revert → GREEN. That revert→GREEN is the single assertion proving
// the guard STILL BITES after the cure — the whole point of R40.55's terminal flip. HEAD read from the repo (v0.8.123/
// Sprint 40); boots from RB_AGENT_WORKSPACE (overridable → isolated, no live pollution). Run: node test/visual/r4055-boot-currency-gate.mjs
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const GUARD = 'node --import tsx scripts/check-boot-currency.ts';
const runGuard = (extra, env) => { try { execSync(`${GUARD} ${extra}`, { cwd: REPO, env: { ...process.env, ...env }, stdio: 'pipe' }); return 0; } catch (e) { return e.status || 1; } };

const results = [];
// (1) ADOPT the guard's own failability suite — 22 selftests (do not re-derive): the RED mechanism bites on a seeded
//     stale version, positional lessons-heading exemption holds, fail-closed on non-semver/no-workspace/0-boots/low-count,
//     OWNED/EXCLUDED/UNCLASSIFIED classification, dead-exemption detection.
results.push(['(1) guard --selftest suite (22 failability cases) all pass', runGuard('--selftest', {}) === 0]);

// (2) SEEDED-REGRESSION on a REAL owned boot file (integration; the pure selftests only exercise classifyBoot on strings).
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'r4055-boot-'));
const adir = path.join(scratch, 'session/agents');
const TIMELESS = '# Boot\n## You are: robbin agent\n## Anchor: read your context.md first (names no version, no sprint)\n';
for (let i = 1; i <= 8; i++) { const d = path.join(adir, `robbin-seed-${i}`); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'boot.md'), TIMELESS); } // >= MIN_BOOTS(7), all OWNED (/^robbin-/)
// the guard's dead-exemption check RREDs if a NAMED exclusion resolves to no boot — provide the named-excluded boot so
// the isolated scratch is otherwise-clean (this also keeps the dead-exemption feature honest: it's why a bare scratch REDs).
{ const d = path.join(adir, 'master-product-owner'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'boot.md'), TIMELESS); }
const env = { RB_AGENT_WORKSPACE: scratch };
const owned = path.join(adir, 'robbin-seed-1', 'boot.md');
try {
  const cleanGreen = runGuard('--strict', env) === 0;                                                 // 8 timeless owned boots → GREEN
  fs.writeFileSync(owned, '# Boot\n## Current status\nrunning v0.8.61 in prod now\n');                 // R40.55 dim-1: VERSION diverging from HEAD (0.8.123) in a non-lessons heading
  const redVersion = runGuard('--strict', env) === 1;                                                 // → RED (bite)
  fs.writeFileSync(owned, TIMELESS);                                                                   // CURE (revert)
  const greenAfterCure = runGuard('--strict', env) === 0;                                             // → GREEN — the guard still bites AFTER the cure (terminal flip)
  fs.writeFileSync(owned, '# Boot\n## Goal\nfinish the Sprint 36 work then ship\n');                   // R40.55 dim-2: NO-ACTIVE-STATE (names a sprint) — even with no version
  const redState = runGuard('--strict', env) === 1;                                                   // → RED (bite on the statelessness dimension)
  fs.writeFileSync(owned, TIMELESS);
  const greenFinal = runGuard('--strict', env) === 0;

  results.push(['(2) seeded-regression: 8 timeless owned boots → --strict GREEN', cleanGreen]);
  results.push(['(3) R40.55 dim-1 VERSION-divergence bites: v0.8.61 != HEAD → --strict RED', redVersion]);
  results.push(['(4) TERMINAL FLIP: revert cure → --strict GREEN (guard still bites AFTER the cure)', greenAfterCure && greenFinal]);
  results.push(['(5) R40.55 dim-2 NO-ACTIVE-STATE bites: sprint-state (no version) → --strict RED', redState]);
} finally { fs.rmSync(scratch, { recursive: true, force: true }); }

console.log('=== R40.55 bootGuard.assertCurrencyAndStatelessness — FAILABILITY + terminal-flip (distinct-intent) ===');
for (const [label, ok] of results) console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
const green = results.length === 5 && results.every(([, ok]) => ok);
console.log(`\nVERDICT: ${green ? 'GREEN — guard is failable on BOTH R40.55 dimensions (version-divergence AND active-state) and still bites after the cure' : 'RED'}`);
process.exitCode = green ? 0 : 1;
