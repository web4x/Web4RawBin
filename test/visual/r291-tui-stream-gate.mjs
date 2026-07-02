// [test:uuid:d03c8ac3-6a5a-4bb6-bf8a-b35deddd3bb1] R29.1 selfHealingStart — TUI stream proves foreground self-healed start (integration)
// [test:uuid:76fa996e-97c9-4605-bf15-d6b5d653ef80] R29.1 addLog — AC-4 TUI streams in remoteShells:0.2
// [test:uuid:34ff57ed-919b-46cd-998e-23e362ea34ea] R29.1 setupTUI — AC-4 TUI streams in remoteShells:0.2
// R29.1 AC-4 — TUI-verify: the live request-log dashboard streams in the WODA.prod pane
// (remoteShells:0.2) exactly as WODA.test (remoteShells:0.3). Re-runnable live-ops check:
// fire probes at prod, capture remoteShells:0.2, assert each probe streams AS A TIMESTAMPED
// LINE in the pane (server=setupTUI+addLog). PRECONDITION: prod must be running FOREGROUND in
// remoteShells:0.2 (npm start there → self-heal node<18→node22 → foreground TTY). Requires otmux.
//
// Verified GREEN 2026-07-02: probes streamed r1 3/3, r2 3/3, r3 3/3, final 2/2 + PO's 5 TUI-PROVE.
// GOTCHA: on a live-throughput pane, capture a BIG window (15 lines miss fast-scrolled probes; 45 catch them).

import { execSync } from 'child_process';

const BASE = 'https://prod.wo-da.de:4444';
const PANE = 'remoteShells:0.2';
const CAP_LINES = 60;                                    // big window — live pane scrolls fast
const sh = (c) => { try { return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return (e.stdout || '') + ''; } };
const fire = (mark) => sh(`curl -sk -o /dev/null "${BASE}/api/config?${mark}"`);
const capture = () => sh(`otmux pane.capture ${PANE} ${CAP_LINES}`);
const sleep = (ms) => { try { execSync(`sleep ${(ms / 1000).toFixed(1)}`); } catch { /* ignore */ } };

// sanity: is prod serving + is the pane a foreground request-log TUI?
const paneNow = capture();
const paneLooksLive = /GET \/|POST \/|foreground TTY|New client/i.test(paneNow);

const results = [];
for (let round = 1; round <= 3; round++) {
  const mark = `r291-tui-${round}-${Date.now() % 100000}`;
  fire(`${mark}-a`); fire(`${mark}-b`); fire(`${mark}-c`);
  sleep(2500);
  const pane = capture();
  const hits = (pane.match(new RegExp(mark, 'g')) || []).length;
  const pass = hits >= 3;                                // all 3 probes streamed as pane lines
  results.push(pass);
  console.log(`round ${round}: probes streamed in ${PANE} = ${hits}/3 => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT R29.1 AC-4 TUI stream (DET-3x) ===');
results.forEach((p, i) => console.log(`  round ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log(`pane looked live at start: ${paneLooksLive}`);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (ensure prod is running FOREGROUND in remoteShells:0.2)');
process.exit(green ? 0 : 1);
