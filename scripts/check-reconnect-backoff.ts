/**
 * STORM AMPLIFIER gate (oopPO rank 2, spec cdf69c6be). Enforce, do NOT document.
 * The client reconnect must be BOUNDED EXPONENTIAL BACKOFF + JITTER, reset ONLY after a stable period — never a fixed
 * interval reset on every connect (that AMPLIFIES a flap into a storm). Asserts the pure formula (grows/bounded/jittered)
 * AND that the served inline client uses it, not the old fixed setTimeout(connect,2000). Visibility BITE is a SEPARATE gate.
 * stub-must-fail: revert onclose to setTimeout(connect,2000), OR make reconnectBackoffDelay return a constant → RED.
 */
import { reconnectBackoffDelay, RECONNECT_BACKOFF_MAX_MS } from '../src/ts/server/reconnect-tracker.js';
import { readFileSync } from 'node:fs';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const r = 0.5;

// 1) GROWS (exponential, not a fixed interval): same rand, higher attempt → strictly higher delay (until the cap).
if (!(reconnectBackoffDelay(1, r) > reconnectBackoffDelay(0, r))) fail('backoff not growing 0→1 — a fixed interval is the amplifier.');
if (!(reconnectBackoffDelay(3, r) > reconnectBackoffDelay(1, r))) fail('backoff not growing 1→3.');
// 2) BOUNDED: never exceeds MAX, even at large attempts.
for (const a of [10, 20, 100]) if (reconnectBackoffDelay(a, 0.999) > RECONNECT_BACKOFF_MAX_MS) fail(`backoff exceeds MAX (${RECONNECT_BACKOFF_MAX_MS}) at attempt ${a}.`);
// 3) JITTERED: varies with rand (no thundering herd) — not a deterministic value per attempt.
if (reconnectBackoffDelay(2, 0) === reconnectBackoffDelay(2, 0.999)) fail('backoff not jittered (rand ignored) — clients reconnect in lockstep.');
// 4) never 0 (no busy-loop).
if (reconnectBackoffDelay(0, 0) < 1) fail('backoff can be 0 — busy-loop.');

// 5) SERVED CLIENT (server.ts inline) uses the backoff, NOT the fixed setTimeout(connect,2000).
const srv = readFileSync(new URL('../src/ts/server/server.ts', import.meta.url), 'utf-8');
if (srv.includes('setTimeout(connect,2000)')) fail('served inline client STILL uses fixed setTimeout(connect,2000) — the storm amplifier is back.');
if (!/reconnAttempt/.test(srv) || !/Math\.pow\(2,reconnAttempt\)/.test(srv)) fail('served inline client missing exp-backoff (reconnAttempt / Math.pow(2,reconnAttempt)) — reverted?');
// 6) reset ONLY after stable: onopen must NOT reset reconnAttempt=0 immediately (bare connect); it schedules a delayed reset.
if (/onopen=function\(\)\{connected=true;reconnAttempt=0/.test(srv)) fail('backoff reset on BARE connect (reconnAttempt=0 in onopen) — a flap resets it = the amplifier.');
if (!/stableTimer=setTimeout\(function\(\)\{reconnAttempt=0;\}/.test(srv)) fail('missing the STABLE-period reset (stableTimer) — reset must be delayed, not on bare connect.');

console.log('✓ storm-amplifier: bounded exp backoff + jitter (grows, ≤30s, jittered, non-zero); served client uses it not fixed-2s; reset only after a stable period.');
