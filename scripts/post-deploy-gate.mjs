// R40.25 (uuid 7fee0120) DeviceGateTrigger.runAndRecord — THE post-deploy device-gate trigger (architect design 00361a7e3).
// The FINAL step of the deploy path: after restart + served==committed, run the EXISTING gate:device:live lane
// (WebKit@390) against LIVE prod, classify FAIL-CLOSED, record a version+commit-STAMPED device-gate unit, notify
// PO/SM, and exit NON-ZERO on RED/NOT-RUN so a deploy is NOT "done" until the device gate is GREEN.
//   INV-PDG-1 deploy-done requires device-GREEN · INV-PDG-2 NOT-RUN == RED (unrunnable is failure, never a silent
//   pass/skip) · INV-PDG-3 durable+visible · INV-PDG-4 real live artifact · INV-PDG-7 freshness (served must ==
//   committed version, else the artifact is stale/mid-flight = NOT-RUN=RED).
// ★ INV-PDG-5 NO SILENCER: there is NO --skip/--bypass/--force flag, and passing one is REFUSED loudly. Shipping
//   without a green device gate is ALLOWED but RECORDED as served-but-UNVERIFIED (the RED/NOT-RUN unit) — never
//   silenceable. A future bypass must be a committed, authored, VISIBLE override, never a silent skip.
// Run (deploy final step): node scripts/post-deploy-gate.mjs   (exit 0 = GREEN/verified, exit 1 = RED/NOT-RUN/unverified)
import { spawnSync, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROD = 'https://localhost:4444';

function servedVersion() {
  return new Promise((resolve) => {
    const req = https.get(`${PROD}/api/config`, { rejectUnauthorized: false, timeout: 5000 }, (res) => {
      let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => { try { resolve(JSON.parse(b).version || null); } catch { resolve(null); } });
    });
    req.on('error', () => resolve(null)); req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}
const committedVersion = () => { try { return JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8')).version; } catch { return null; } };
const headCommit = () => { try { return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { return 'unknown'; } };

function record(verdict, version, commit, evidence) {
  const r = spawnSync('node', ['--import', 'tsx', path.join(ROOT, 'scripts/record-gates.ts'), '--type', 'device-gate', '--verdict', verdict, '--evidence', `v${version} @${commit} — ${evidence}`, '--gated-by', 'post-deploy-trigger', '--version', String(version), '--commit', commit], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) console.error('[post-deploy-gate] ⚠ record-gates failed — the durable unit was NOT written (INV-PDG-3 at risk).');
}
function notify(msg) { try { spawnSync('tmux', ['send-keys', '-t', 'robbinTeam2:0.0', msg, 'Enter']); } catch { /* notify best-effort; the non-zero exit + unit are the primary loud signals */ } }
function fail(verdict, version, commit, evidence, human) { record(verdict, version, commit, evidence); notify(`🔴 post-deploy-gate ${verdict} — ${human} (served-but-UNVERIFIED v${version} @${commit})`); console.error(`✗ post-deploy-gate: ${verdict} — ${evidence}. Deploy UN-VERIFIED (INV-PDG-1/2).`); process.exit(1); }

async function main() {
  if (process.argv.some((a) => /^--(skip|bypass|force|no-gate|green)/i.test(a))) { console.error('✗ post-deploy-gate: NO skip/bypass/force flag exists (INV-PDG-5 NO-SILENCER). Refusing.'); process.exit(1); }

  const committed = committedVersion(), commit = headCommit();
  const served = await servedVersion();

  if (!served) return fail('NOT-RUN', committed, commit, 'server not serving /api/config (unreachable) — cannot certify a live artifact', 'server unreachable');
  if (served !== committed) return fail('NOT-RUN', served, commit, `served v${served} != committed v${committed} — stale/mid-flight artifact (INV-PDG-7 freshness)`, `served v${served} != committed v${committed} — restart before gating`);

  console.log(`▸ post-deploy-gate: running gate:device:live (WebKit@390) against LIVE prod v${served} @${commit} …`);
  const r = spawnSync('npm', ['run', 'gate:device:live'], { cwd: ROOT, stdio: 'inherit', timeout: 180000 });

  if (r.error || r.status === null) return fail('NOT-RUN', served, commit, `gate:device:live could not run (${r.error?.message || 'timeout/killed before asserting'}) — webkit/runner/device unavailable`, 'device lane unrunnable');
  if (r.status !== 0) return fail('RED', served, commit, `gate:device:live FAILED (exit ${r.status}) — a live device assertion regressed`, 'device gate FAILED');

  record('GREEN', served, commit, 'gate:device:live PASS on WebKit@390 live prod');
  console.log(`✓ post-deploy-gate: GREEN — served v${served} @${commit} verified on WebKit@390. Deploy VERIFIED (INV-PDG-1).`);
  process.exit(0);
}
main();
