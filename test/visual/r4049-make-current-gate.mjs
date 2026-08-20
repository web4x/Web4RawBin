// R40.49 make-current fix gate (v0.8.121) — ASSERT THE PROPERTY (the pin MOVES + expiry OBSERVABLE), NOT the 200. Isolated scratch,
// owner session from the SYSTEM literal (foundation), mutation-free (prod pin is a frozen oracle). Both halves + 2 stub-must-fails + the Planned side-effect.
//   (a) PIN MOVES: make-current a QA-Review task → 200 AND the RESOLVED current (getThreeSlots '📌 Current' slot) == that task AND it STAYS QA-Review (no regress to In-Progress).
//   (b) EXPIRY OBSERVABLE: approve the designated task → Done → resolved current FALLS BACK to derivation (≠ the Done task) AND the StaleSteerLog '[pin] explicit current-task steer … expired' appears (BITE-6b) — never a silent stale winner.
//   SIDE-EFFECT (report plainly, not a defect): make-current a PLANNED task → it STAYS Planned (always-designate, no auto-advance to In-Progress) — a real behaviour change from the one-rule-per-intent ruling.
//   stub-must-fail ×2 (separate arms): suppress the currentTaskUuid honor → pin does NOT move → RED; silence the expiry (survives past Done) → RED.
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';
const CSU = 'current-sprint-singleton-0000-000000000001';
const TARGET = process.env.MC_TASK || '97e8a6ad-46db-440f-a9be-cfb97ca64df4'; // a REAL Sprint 37 QA-Review task (in the resolved sprint → the designation is valid + resolvable; a synthetic seed is not in the sprint set so it can't win)
const LOG = path.join('/tmp', `r4031-server-${process.pid}.log`);
const STALE_RE = /\[pin\][^\n]*(expired|steer|stale)/i;

// stub arms via serverPatch (compiled into the scratch server before boot)
const STUB = process.env.STUB || ''; // '' | 'suppress' | 'silence'
const suppressHonor = (root) => { // neuter getThreeSlots' honor of currentTaskUuid → the designation cannot move the pin
  const p = path.join(root, 'src/ts/scenario/CurrentSprint.ts');
  const s = fs.readFileSync(p, 'utf8').replace(/(getThreeSlots\(resolvedSprint\?[^)]*\): ThreeSlots \{)/, '$1 currentTaskUuid = undefined; /* STUB suppress designation honor */');
  if (!s.includes('STUB suppress')) throw new Error('suppressHonor: anchor not found');
  fs.writeFileSync(p, s);
};
const silenceExpiry = (root) => { // keep validity but make the expiry UNOBSERVABLE (drop the StaleSteerLog) → silent stale winner
  const p = path.join(root, 'src/ts/scenario/CurrentSprint.ts');
  const before = fs.readFileSync(p, 'utf8');
  const s = before.replace(/console\.(log|warn|error)\(([^\n]*\[pin\][^\n]*(expired|steer|reached Done)[^\n]*)\)/i, '/* STUB silence expiry */ void ($2)');
  fs.writeFileSync(p, s === before ? before + '\n/* STUB silence: no StaleSteer anchor matched — arm reports UNPROVEN */\n' : s);
};
const serverPatch = STUB === 'suppress' ? suppressHonor : STUB === 'silence' ? silenceExpiry : undefined;

const f = await setupFoundation({ attachEvidenceTo: TARGET, ...(serverPatch ? { serverPatch } : {}) });
const oh = f.ownerHeaders();
const raw = { stub: STUB || 'none', servedVersion: f.servedVersion, seeded: { qa: TARGET?.slice(0, 8), planned: f.seeded.planned?.slice(0, 8) } };
const post = (u, verb) => fetch(`${f.base}/api/task/${u}/${verb}`, { method: 'POST', headers: oh }).then((r) => r.status).catch(() => -1);
const statusOf = (u) => fetch(`${f.base}/api/ior/ior:instance:${u}`, { headers: oh }).then((r) => r.json()).then((j) => j?.unit?.model?.status ?? j?.model?.status ?? null).catch(() => 'err');
const resolvedCurrent = async () => { // the '📌 Current' slot's task uuid, honoring currentTaskUuid, re-evaluated per read
  try {
    const j = await (await fetch(`${f.base}/api/trace/children/${CSU}`, { headers: oh })).json();
    const kids = j?.children || j?.result?.children || (Array.isArray(j) ? j : []);
    const cur = kids.find((c) => /Current\b/.test(String(c.name || '')) && !/CurrentSprint/.test(String(c.name || '')));
    const ref = String(cur?.uuid || cur?.ref || '');
    return ref.includes(':') ? ref.slice(ref.lastIndexOf(':') + 1) : ref;
  } catch { return ''; }
};
const readLog = () => { try { return fs.readFileSync(LOG, 'utf8'); } catch { return ''; } };

try {
  // (a) PIN MOVES on a QA-Review task
  raw.a_makeCurrentStatus = await post(TARGET, 'make-current');
  raw.a_resolvedCurrent8 = (await resolvedCurrent()).slice(0, 8);
  raw.a_pinMoved = raw.a_resolvedCurrent8 === TARGET.slice(0, 8);
  raw.a_statusStaysQA = (await statusOf(TARGET)) === 'QA Review'; // no regress to In-Progress
  // SIDE-EFFECT: make-current a Planned task → stays Planned (always-designate, no auto-advance)
  raw.side_plannedMakeCurrent = await post(f.seeded.planned, 'make-current');
  raw.side_plannedStatusAfter = await statusOf(f.seeded.planned); // expect 'Planned' (report plainly)
  // re-designate back to qaReview so (b)'s expiry is on the QA-Review designation
  await post(TARGET, 'make-current');
  // (b) EXPIRY OBSERVABLE: approve the designated QA-Review task → Done → fallback + StaleSteerLog
  const logBefore = readLog().length;
  raw.b_approveStatus = await post(TARGET, 'approve');
  raw.b_qaStatusAfter = await statusOf(TARGET); // expect Done
  raw.b_resolvedAfter8 = (await resolvedCurrent()).slice(0, 8);
  raw.b_fellBack = raw.b_resolvedAfter8 !== TARGET.slice(0, 8); // no longer the (now Done) designated task
  raw.b_staleSteerLogged = STALE_RE.test(readLog().slice(logBefore)); raw.b_pinLines = (readLog().slice(logBefore).match(/\[pin\][^\n]*/g) || []).slice(-4);
} finally { raw.teardown = await f.teardown(); }

console.log(JSON.stringify(raw, null, 2));
const prodSafe = raw.teardown?.prodUp === true && raw.teardown?.leftover === 0;
const aOk = raw.a_makeCurrentStatus === 200 && raw.a_pinMoved && raw.a_statusStaysQA;
const bOk = raw.b_qaStatusAfter === 'Done' && raw.b_fellBack && raw.b_staleSteerLogged;
console.log('\n=== R40.49 make-current PROPERTY gate (scratch v' + raw.servedVersion + ') ===');
console.log(`  (a) PIN MOVES: make-current→${raw.a_makeCurrentStatus}, resolved current==task=${raw.a_pinMoved}, stays QA-Review=${raw.a_statusStaysQA}`);
console.log(`  SIDE-EFFECT (report): make-current a Planned task → ${raw.side_plannedMakeCurrent}, status after='${raw.side_plannedStatusAfter}' (expect 'Planned' = always-designate, no auto-advance)`);
console.log(`  (b) EXPIRY OBSERVABLE: approve→Done=${raw.b_qaStatusAfter === 'Done'}, current fell back=${raw.b_fellBack}, StaleSteerLog present=${raw.b_staleSteerLogged}`);
console.log(`  prod:4444 untouched=${prodSafe}`);
let verdict, exit;
if (!prodSafe) { verdict = 'INVALID — teardown not clean'; exit = 2; }
else if (STUB === 'suppress') { verdict = raw.a_pinMoved ? '✗ STUB-BROKEN — pin moved even with the designation honor suppressed (gate cannot detect the silent no-op)' : '✓ STUB-MUST-FAIL PASSED — with the currentTaskUuid honor suppressed the pin does NOT move ⇒ the gate DETECTS the silent no-op'; exit = raw.a_pinMoved ? 1 : 0; }
else if (STUB === 'silence') { verdict = raw.b_staleSteerLogged ? '✗ STUB-BROKEN — StaleSteerLog still present with the expiry silenced' : '✓ STUB-MUST-FAIL PASSED — with the expiry silenced the lapse is UNOBSERVABLE ⇒ the gate DETECTS the lying-pin resurrection (a stale silent winner)'; exit = raw.b_staleSteerLogged ? 1 : 0; }
else if (aOk && bOk) { verdict = `✓ GREEN — (a) the pin MOVES (make-current on a QA-Review task → that task IS the resolved current, stays QA-Review) AND (b) expiry is OBSERVABLE (on Done → falls back to derivation + StaleSteerLog logs the lapse, never a silent stale winner). SIDE-EFFECT reported: a tapped Planned task stays Planned (no auto-advance). Both stub-must-fails run separately (STUB=suppress|silence). Tron's @390 tap = final acceptance.`; exit = 0; }
else { verdict = `RED — property not met: a(pinMoves=${raw.a_pinMoved}/staysQA=${raw.a_statusStaysQA}) b(Done=${raw.b_qaStatusAfter === 'Done'}/fellBack=${raw.b_fellBack}/logged=${raw.b_staleSteerLogged})`; exit = 1; }
console.log(`\n${exit === 0 ? '✓' : exit === 2 ? '⊘' : '✗'} ${verdict}`);
process.exit(exit);
