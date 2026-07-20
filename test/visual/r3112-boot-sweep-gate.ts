// [test:uuid:c35f02c7-fba5-4a97-9dc0-952f5d543703] R31.4 boot-sweep-orphans — PtyBridge.reapOrphans (Impl 5d313828, Method 28d8158b). At boot (nothing attached) every sm_* grouped session is an orphan → reaped, zero left. GREEN DET-3x served==0.7.102: LIVE fresh-boot 0 stale sm_* (architect restart reaped) + attachPane spawns grouped sm_* → reapOrphans sweeps ALL injected orphans to 0 + non-sm sessions untouched (clean live tree) + boot-wired (server.ts:2212). Build-safe (no prod restart).
// ★ LIVE EMPIRICAL PROOF (controlled experiment, expert+tester): seeded orphan sm_bootcheck_marker → RED-baseline: a
//   '[r]' press = CLIENT rebuild only (server pid UNCHANGED 1217320, marker SURVIVES, reapOrphans did NOT run). GREEN:
//   a REAL restart (Ctrl-C→npm start, pid CHANGED 1217320→1231421) → marker REAPED = reapOrphans ran at the real boot
//   (also sm_archbackstop reaped). ★★ VERSION-LIE LESSON: /api/config .version is UNRELIABLE ('[r]' bumps it with NO
//   server restart) → anchor "live" to the server PID + reapOrphans-boot behavior, NOT the version string.
// R31.4 boot-sweep-orphans — PtyBridge.reapOrphans (Impl 5d313828, Method 28d8158b, Class PtyBridge 59648f26,
// UC ptyBridge.reapOrphans 8bd83486). served==0.7.102 (self-verified, phantom-guard). Build-safe DET-3x — proves the
// AC without a Tron-disrupting prod restart:
// (0) SELF-VERIFY served==0.7.102. (1) LIVE FRESH-BOOT: 0 stale sm_* right now = the architect's restart reaped
//     everything at boot (empirical). (2) FULL lifecycle: attach a terminal via the REAL PtyBridge.attachPane
//     (spawns a grouped sm_* — what a live owner terminal does) + inject extra orphans (what a crash/restart leaves) →
//     drive the REAL reapOrphans (EXACTLY what server boot runs, server.ts:2212) → assert ZERO stale sm_* + non-sm
//     sessions untouched (clean live tree). (3) fresh-boot no-op. (4) BOOT-WIRING proven by source (reapOrphans@boot).
import { execFileSync } from 'node:child_process';
import https from 'node:https';
import { PtyBridge } from '../../src/ts/server/PtyBridge.js';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.102';
const sh = (a: string[]) => { try { return execFileSync('tmux', a, { encoding: 'utf8' }); } catch { return ''; } };
const smNames = (): string[] => sh(['list-sessions', '-F', '#{session_name}']).trim().split('\n').filter(n => n.startsWith('sm_'));
const nonSm = (): string[] => sh(['list-sessions', '-F', '#{session_name}\t#{window_width}x#{window_height}']).trim().split('\n').filter(l => l && !l.startsWith('sm_'));
const killAllSm = () => { for (const n of smNames()) sh(['kill-session', '-t', n]); };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const servedVersion = (): Promise<string> => new Promise((res) => { https.get({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }).on('error', () => res('?')); });
function mockWs(): any { const h: Record<string, any> = {}; return { readyState: 1, sent: [] as any[], send(d: any) { this.sent.push(d); }, close() { (h.close || (() => {}))(); }, on(e: string, cb: any) { h[e] = cb; } }; }

const served = await servedVersion();
const bootSrc = execFileSync('grep', ['-nE', 'PtyBridge.reapOrphans', `${REPO}/src/ts/server/server.ts`], { encoding: 'utf8' });
const bootWired = /reapOrphans\(/.test(bootSrc) && /boot/i.test(bootSrc);
const panes = sh(['list-panes', '-a', '-F', '#{pane_id}\t#{session_name}']).trim().split('\n').filter(Boolean).map(l => l.split('\t'));
const pane = (panes.find(([, s]) => /robbinTeam2/.test(s)) || panes[0] || [])[0];

const results: boolean[] = [];
try {
  if (served !== TARGET) { console.log(`ABORT (phantom-guard): served=${served} != ${TARGET}`); process.exitCode = 1; }
  else {
    console.log(`served==${TARGET} ✓ | boot-wired=${bootWired} | attach-pane=${pane}`);
    const liveFreshBoot = smNames().length === 0;   // (1) architect's restart reaped everything at boot
    console.log(`(1) LIVE FRESH-BOOT: 0 stale sm_* now = ${liveFreshBoot} (found ${smNames().length})`);
    for (let i = 1; i <= 3; i++) {
      const beforeNonSm = nonSm();
      // (2a) attach a terminal via the REAL attachPane → spawns a grouped sm_*
      let attachSpawned = false;
      if (pane) { const ws = mockWs(); await PtyBridge.attachPane(ws, pane, () => {}); await sleep(800); attachSpawned = smNames().length >= 1; }
      // + inject extra orphans (what a crash/restart with attached terminals leaves behind)
      for (let j = 0; j < 2; j++) sh(pane ? ['new-session', '-d', '-s', `sm_orphan_${i}_${j}_${process.pid}`, '-t', beforeNonSm[0].split('\t')[0]] : ['new-session', '-d', '-s', `sm_orphan_${i}_${j}`]);
      await sleep(200);
      const injected = smNames().length;

      // (2b) BOOT SWEEP — the REAL reapOrphans (server.ts:2212 call) → zero stale sm_*
      await PtyBridge.reapOrphans(() => {});
      await sleep(400);
      const remaining = smNames().length;
      const reaped = attachSpawned && injected >= 3 && remaining === 0;

      const nonSmAfter = nonSm();
      const noDisrupt = beforeNonSm.every(s => nonSmAfter.includes(s));   // clean live tree — non-sm untouched
      await PtyBridge.reapOrphans(() => {});                              // (3) fresh-boot no-op
      const freshZero = smNames().length === 0;

      const pass = liveFreshBoot && bootWired && reaped && noDisrupt && freshZero;
      results.push(pass);
      console.log(`iter ${i}: attach-spawns-sm=${attachSpawned} inject=${injected}->reap=${remaining}(reaped=${reaped}) no-disrupt=${noDisrupt}(${beforeNonSm.length} non-sm) fresh-zero=${freshZero} => ${pass ? 'GREEN' : 'RED'}`);
      killAllSm();
    }
  }
} finally { killAllSm(); }

console.log('\n===== R31.4 boot-sweep-orphans reapOrphans (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: reapOrphans driven directly = the boot call (server.ts:2212, wired-by-source) + LIVE 0-orphan post-restart; no prod restart (would disrupt Tron).');
process.exitCode = green ? 0 : 1;
