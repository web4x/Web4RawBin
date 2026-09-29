/**
 * R1 VISIBILITY gate (PO 2026-09-29) — the reconnect-storm detector must be LOAD-BEARING, not decorative. The lobby
 * flap-fix removed the storm's only visible symptom, so a per-token reconnect-rate signal + alarm must exist and BITE.
 * Induce a close-loop → the per-token counter CLIMBS and isStorm fires above the human bound; a single/handful does not.
 * stub-must-fail (RED-on-removal): remove the counting (record→0) → the climb assertion fails; remove the threshold
 * (isStorm→false) → the storm-detected assertion fails. Either way the detector goes invisible → this gate RED.
 */
import { ReconnectTracker, RECONNECT_ALARM_PER_MIN } from '../src/ts/server/reconnect-tracker.js';

const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
const t = new ReconnectTracker();
const now = 1_000_000;

// induce a close-loop: 6 closes for ONE token within 60s → the counter must CLIMB 1..6 (instrumentation records)
const rates = [];
for (let i = 0; i < 6; i++) rates.push(t.record('tok-storm', now + i * 1000));
if (JSON.stringify(rates) !== JSON.stringify([1, 2, 3, 4, 5, 6])) fail(`per-token counter did not climb per close (got [${rates}]) — instrumentation not recording (storm invisible).`);

// the ALARM fires above the human-plausible bound, and NOT at/below it
if (!t.isStorm(6)) fail(`isStorm(6) false — a storm above ${RECONNECT_ALARM_PER_MIN}/min not detected (alarm decorative, not load-bearing).`);
if (t.isStorm(RECONNECT_ALARM_PER_MIN)) fail(`isStorm(${RECONNECT_ALARM_PER_MIN}) true — the bound must be a human-plausible handful, not alarm-on-every-reconnect.`);
if (t.isStorm(1)) fail('isStorm(1) true — a single reconnect is not a storm.');

// the window PRUNES (a rate, not a permanent stuck alarm): a close 60s later resets to 1
const later = t.record('tok-storm', now + 6 * 1000 + 61_000);
if (later !== 1) fail(`window did not prune old closes (rate ${later} after a 60s gap) — a stale permanent alarm, not a rate/min.`);

// per-TOKEN isolation (a different token is independent, not a global counter)
if (t.record('tok-other', now) !== 1) fail('per-token isolation broken — the counter is global, not per-token.');

console.log(`✓ R1 visibility: per-token reconnect counter CLIMBS on a close-loop (1..6) + isStorm fires >${RECONNECT_ALARM_PER_MIN}/min (not at/below); window prunes; per-token isolated. Remove the counter/threshold → RED (load-bearing).`);
