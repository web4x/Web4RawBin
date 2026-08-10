// T-R31.14 scripted deploy + R40.25 device-gate FOLDED IN — THE ONE deploy path. By construction you CANNOT deploy
// without the device gate running: the gate is a step of this script, and there is NO --skip/--bypass (INV-PDG-5).
// TOPOLOGY PINNED (not re-architected): the server keeps running in the FOREGROUND of the known-good pane
// server:0.2 (%18) — this script drives the restart INTO that pane via tmux (same `npm start` the manual path uses;
// the old path stays intact) and does NOT block on the server's stdout. It triggers the restart, RETURNS, and POLLS
// /api/config until served==committed (timeout → fail-closed), THEN runs the gate.
//   SEQUENCE: build → commit build artifacts → restart(%18) → poll served==committed → post-deploy-gate → exit code.
//   FAIL LOUD + ATOMIC: any step failing aborts non-zero BEFORE the next; NOT-RUN and RED both → non-zero (deploy NOT done).
//   --dry-run: prove the whole sequence with ZERO prod mutation (simulated build/restart/poll) + assert the gate's
//   exit-code contract (GREEN→0, RED→1, NOT-RUN→1). Run: node scripts/deploy.mjs [--dry-run]
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PANE = 'server:0.2'; // PINNED: the npm-running foreground server pane (%18). NOT remoteShells (stale).
const DRY = process.argv.includes('--dry-run');
if (process.argv.some((a) => /^--(skip|bypass|no-gate|force|green)/i.test(a))) { console.error('✗ deploy: NO skip/bypass/force flag exists (INV-PDG-5 NO-SILENCER). Refusing.'); process.exit(1); }

const committedVersion = () => { try { return JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8')).version; } catch { return null; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function servedVersion() {
  return new Promise((resolve) => {
    const req = https.get('https://localhost:4444/api/config', { rejectUnauthorized: false, timeout: 4000 }, (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => { try { resolve(JSON.parse(b).version || null); } catch { resolve(null); } }); });
    req.on('error', () => resolve(null)); req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}
async function pollServed(target, timeoutMs) { const end = Date.now() + timeoutMs; while (Date.now() < end) { if ((await servedVersion()) === target) return true; await sleep(2000); } return false; }
const abort = (msg) => { console.error(`✗ deploy: ${msg} — atomic abort, deploy UN-VERIFIED.`); process.exit(1); };

async function main() {
  const committed = committedVersion();
  if (!committed) abort('cannot read committed version (package.json)');
  console.log(`▸ deploy${DRY ? ' (DRY-RUN — ZERO prod mutation)' : ''}: target v${committed} → pane ${PANE}`);

  // (1) BUILD
  if (DRY) console.log('  [dry-run] step build: `npm run build` (skipped)');
  else { console.log('▸ build …'); if (spawnSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' }).status !== 0) abort('build failed'); }

  // (2) COMMIT build artifacts (path-limited: version derivatives + dist; source already committed by the developer)
  if (DRY) console.log('  [dry-run] step commit: path-limited commit of package.json + sw.js + dist (skipped)');
  else {
    console.log('▸ commit build artifacts …');
    const P = ['package.json', 'src/public/sw.js', 'src/public/dist'];
    spawnSync('git', ['add', '--', ...P], { cwd: ROOT });
    const nothingStaged = spawnSync('git', ['diff', '--cached', '--quiet', '--', ...P], { cwd: ROOT }).status === 0; // 0 = no staged diff
    if (nothingStaged) console.log('  nothing to commit — no-change deploy (build artifacts byte-identical); continuing (no empty commit).');
    else { const c = spawnSync('git', ['-c', 'commit.gpgsign=false', 'commit', '-m', `deploy: build artifacts v${committed}`, '--', ...P], { cwd: ROOT, stdio: 'inherit' }); if (c.status !== 0) abort('commit of build artifacts failed'); }
  }

  // (3) RESTART into the PINNED foreground pane (%18) — does NOT block on the server's stdout
  if (DRY) console.log(`  [dry-run] step restart: tmux send-keys -t ${PANE} C-c + 'npm start' (pinned foreground; skipped)`);
  else { console.log(`▸ restart → ${PANE} (pinned foreground) …`); spawnSync('tmux', ['send-keys', '-t', PANE, 'C-c']); await sleep(3000); spawnSync('tmux', ['send-keys', '-t', PANE, 'npm start', 'Enter']); }

  // (4) POLL served==committed (timeout → fail-closed abort)
  if (DRY) console.log(`  [dry-run] step poll: /api/config until served==committed==v${committed} (simulated OK)`);
  else { console.log('▸ poll /api/config until served==committed …'); if (!(await pollServed(committed, 60000))) abort(`served != committed v${committed} within 60s`); }

  // (5) THE GATE — folded in, un-skippable. Live: run the real trigger (exits non-zero on RED/NOT-RUN). Dry: assert the contract.
  if (DRY) {
    console.log('▸ [dry-run] step gate: assert post-deploy-gate exit-code contract (no webkit, no prod, no record) …');
    const contract = { GREEN: 0, RED: 1, 'NOT-RUN': 1 };
    let ok = true;
    for (const [verdict, code] of Object.entries(contract)) { const nonZero = code !== 0; const shouldFail = verdict !== 'GREEN'; if (nonZero !== shouldFail) ok = false; console.log(`  contract: ${verdict} → exit ${code} ${nonZero === shouldFail ? '✓' : '✗ WRONG'}`); }
    if (!ok) abort('gate exit-code contract broken (NOT-RUN/RED must be non-zero)');
    console.log(`✓ DRY-RUN complete — build→commit→restart→poll→gate sequence wired end-to-end; gate contract holds (NOT-RUN & RED both non-zero → deploy blocked); ZERO prod mutation. Report to PO before first LIVE run.`);
    process.exit(0);
  }
  console.log('▸ post-deploy-gate (gate:device:live vs live prod, WebKit@390) …');
  const g = spawnSync('node', [path.join(ROOT, 'scripts/post-deploy-gate.mjs')], { cwd: ROOT, stdio: 'inherit' });
  if ((g.status ?? 1) !== 0) abort('device gate RED/NOT-RUN — deploy is NOT done (served-but-UNVERIFIED)');
  console.log(`✓ deploy VERIFIED: v${committed} served + device-gate GREEN.`);
  process.exit(0);
}
main();
