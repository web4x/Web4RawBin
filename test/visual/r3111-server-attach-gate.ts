// [test:uuid:b395a272-7060-46ca-9942-22bc29a3b7a4] R31.4 PtyBridge.attachPane (Impl 394eac63) — grouped-session lifecycle: (a) grouped tmux sm_<pane>_<ts> SPAWNS on attach; (b) NO-DISRUPT (pre-existing non-sm sessions unchanged incl size — grouped attach size-independent); (c) DETACH-CLEANUP on ws.close → pty + grouped session killed, zero leak. Headless-mockable slice (mock ws + real tmux); interactive keystroke VISUAL = Tron device.
// R31.4 SERVER-ATTACH slice — PtyBridge.attachPane (Impl 394eac63, Method 6fc43b8e). Headless-mockable, DET-3x.
// Drives the REAL PtyBridge against real tmux with a MOCK ws (no browser, no owner cookie — the interactive RW visual
// stays Tron-device). Asserts the grouped-session lifecycle: (a) grouped tmux session sm_<pane>_<ts> SPAWNS on attach;
// (b) NO-DISRUPT — every pre-existing non-sm session unchanged incl SIZE (grouped attach is size-independent, own view);
// (c) DETACH-CLEANUP — ws.close → pty killed + grouped session killed, ZERO leak. Rigorous finally-sweep of sm_* .
import { execFileSync } from 'node:child_process';
import { PtyBridge } from '../../src/ts/server/PtyBridge.js';

const sh = (args: string[]) => { try { return execFileSync('tmux', args, { encoding: 'utf8' }); } catch { return ''; } };
const sessions = (): string[] => sh(['list-sessions', '-F', '#{session_name}\t#{window_width}x#{window_height}']).trim().split('\n').filter(Boolean);
const smNames = (): string[] => sh(['list-sessions', '-F', '#{session_name}']).trim().split('\n').filter(n => n.startsWith('sm_'));
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const killAllSm = () => { for (const n of smNames()) sh(['kill-session', '-t', n]); };

// mock ws (the `ws` surface PtyBridge.attachPane uses: send / close / on('message'|'close'|'error'))
function mockWs(): any {
  const h: Record<string, (...a: any[]) => void> = {};
  return { readyState: 1, sent: [] as any[], send(d: any) { this.sent.push(d); }, close() { (h.close || (() => {}))(); }, on(ev: string, cb: any) { h[ev] = cb; } };
}

// pick a real pane — prefer my own team (robbinTeam2), else any
const panes = sh(['list-panes', '-a', '-F', '#{pane_id}\t#{session_name}']).trim().split('\n').filter(Boolean).map(l => l.split('\t'));
const mine = panes.find(([, s]) => /robbinTeam2/.test(s)) || panes[0];

const results: boolean[] = [];
killAllSm(); // clear any prior leak before measuring
try {
  if (!mine) { console.log('ABORT: no tmux pane available'); process.exitCode = 1; }
  else {
    const [paneId, targetSession] = mine;
    console.log(`server-attach target: pane=${paneId} session=${targetSession}`);
    for (let i = 1; i <= 3; i++) {
      const before = sessions();
      const beforeNonSm = before.filter(l => !l.startsWith('sm_'));
      const ws = mockWs();
      await PtyBridge.attachPane(ws, paneId, () => {});
      await sleep(1000); // node-pty spawn + grouped session create

      const during = sessions();
      const spawned = during.some(l => l.startsWith('sm_'));                                   // (a)
      const noDisrupt = beforeNonSm.every(b => during.includes(b));                             // (b) same name+SIZE, non-sm untouched
      const gotReady = ws.sent.some((s: any) => typeof s === 'string' && s.includes('"ready"'));// attach handshake sent
      const noError = !ws.sent.some((s: any) => typeof s === 'string' && s.includes('"error"'));

      ws.close();                                                                                // (c) trigger cleanup
      await sleep(1200);
      const after = smNames();
      const cleaned = after.length === 0;                                                        // no grouped-session leak

      const pass = spawned && noDisrupt && gotReady && noError && cleaned;
      results.push(pass);
      console.log(`iter ${i}: (a)spawn=${spawned} (b)no-disrupt=${noDisrupt}(${beforeNonSm.length} non-sm sessions size-stable) ready=${gotReady} noErr=${noError} (c)cleanup=${cleaned}(sm-left=${after.length}) => ${pass ? 'GREEN' : 'RED'}`);
      killAllSm(); // belt-and-suspenders between iters
    }
  }
} finally { killAllSm(); } // never leak a grouped session

console.log('\n===== R31.4 server-attach grouped-session lifecycle (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: interactive RW keystroke VISUAL = Tron device; this gates the grouped-session spawn/no-disrupt/cleanup slice.');
process.exitCode = green ? 0 : 1;
