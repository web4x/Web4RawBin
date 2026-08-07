// R-C5 TaskStatus detector BITE — INDEPENDENT anti-green-wash gate (own-oracle + live CLI, engine-independent, DET-3x).
// Imports the REAL deriveStatusEnum (impl 8a032c42) + assertStatusConsistent (impl d86f0309) from src/ts/scenario/
// task-status.ts. A detector that GREENS a planted inconsistency is worthless. PO's 4 asks:
//  (1) PLANT status=Done + Done-box UNCHECKED → detector FAILS LOUD, NAMES it, does NOT auto-flip (INV-S5a);
//  (2) live honest counts reproduce — FALSE-DONE==0 now (the planner ticked the 7 = the fix worked), + the breakdown;
//  (3) VACUOUS-BITE (the hole I found): an ABSENT checklist + a MALFORMED (non-string) one → each REPORTED in its own
//      named category, NEVER silently 'clean';
//  (4) report-only by default (exit 0, doesn't red pre-existing-debt CI) but exits non-zero under --strict.
// Zero pollution (in-memory index for the plant; CLI is read-only detect+list, no auto-flip).
// [test:uuid:223d2ff6-64da-4450-85c3-2108c5e33c31] R-C5 deriveStatusEnum (8a032c42) — PURE: highest-order CHECKED top-level checkbox; indented sub-steps ignored; unchecked Done ≠ Done; malformed/empty → Planned, never throws.
// [test:uuid:30d4b44a-7b5a-41bf-9ad1-d6609d7ab652] R-C5 assertStatusConsistent (d86f0309) — FAIL-LOUD detector BITE: CATCHES+NAMES a planted FALSE-DONE (status=Done, Done box unchecked) + DRIFT + MALFORMED (non-string) + UNVERIFIABLE (absent checklist, the vacuous-hole class NAMED not silent), does NOT false-positive a clean task, orders FALSE-DONE first, NEVER auto-flips (INV-S5a, no write), report-only exits 0 while --strict enforces (exit 1).
import { deriveStatusEnum, assertStatusConsistent } from '../../src/ts/scenario/task-status.ts';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const fakeIdx = (units: any[]) => { const m = new Map(units.map((u) => [u.model.uuid, u])); return { list: () => [...m.keys()], get: (u: string) => m.get(u) } as any; };
const T = (uuid: string, status: string, checklist: any) => ({ ior: 'ior:class:Task', model: { uuid, name: 'T-' + uuid, status, statusChecklist: checklist } });

// ── PLANTED BITE (own-oracle) — (1) + (3) ──
function plantedIter() {
  const R: any = {};
  R.d_done = deriveStatusEnum('- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [x] Done') === 'Done';
  R.d_highest = deriveStatusEnum('- [x] In Progress\n- [ ] Done') === 'In Progress';
  R.d_indentedIgnored = deriveStatusEnum('- [x] Planned\n  - [x] Done') === 'Planned'; // ★ indented Done ignored (top-level only)
  R.d_unchecked = deriveStatusEnum('- [ ] Done') === 'Planned';
  R.d_malformed = deriveStatusEnum(null as any) === 'Planned' && deriveStatusEnum(12 as any) === 'Planned';
  R.derivePure = R.d_done && R.d_highest && R.d_indentedIgnored && R.d_unchecked && R.d_malformed && deriveStatusEnum('') === 'Planned';

  const clean = T('clean0000', 'In Progress', '- [x] Planned\n- [x] In Progress\n- [ ] Done');
  const falseDone = T('falsedone', 'Done', '- [x] In Progress\n- [ ] Done');   // (1) status=Done + Done box UNCHECKED
  const drift = T('drift0000', 'Planned', '- [x] QA Review');
  const malformed = T('malform00', 'Done', ['not', 'a', 'string']);            // (3) MALFORMED non-string
  const unverifiable = T('unverif00', 'Done', undefined);                       // (3) ABSENT checklist
  const off = assertStatusConsistent(fakeIdx([clean, falseDone, drift, malformed, unverifiable]));
  const by = (u: string) => off.find((o: any) => o.uuid === u);
  R.catchesFalseDone = by('falsedone')?.kind === 'FALSE-DONE';   // ★ THE anti-green-wash bite
  R.namesFalseDone = by('falsedone')?.name === 'T-falsedone';    // NAMES the task (not just a count)
  R.catchesDrift = by('drift0000')?.kind === 'DRIFT';
  R.catchesMalformed = by('malform00')?.kind === 'MALFORMED';
  R.catchesUnverifiable = by('unverif00')?.kind === 'UNVERIFIABLE';
  R.cleanNotFlagged = !by('clean0000');
  R.falseDoneFirst = off[0]?.kind === 'FALSE-DONE';
  R.exactly4 = off.length === 4;
  R.noAutoFlip = falseDone.model.status === 'Done';             // INV-S5a: the unit's status is UNCHANGED (detect-only)
  R.allCleanZero = assertStatusConsistent(fakeIdx([clean, T('clean1111', 'Done', '- [x] Done')])).length === 0;
  R.ok = R.derivePure && R.catchesFalseDone && R.namesFalseDone && R.catchesDrift && R.catchesMalformed && R.catchesUnverifiable && R.cleanNotFlagged && R.falseDoneFirst && R.exactly4 && R.noAutoFlip && R.allCleanZero;
  return R;
}

// ── LIVE CLI — (2) honest counts + (4) report-only vs --strict + INV-S5a no-write ──
function cliAxis() {
  const run = (args: string) => { try { return { code: 0, out: execSync(`npx tsx src/ts/scenario/task-status.ts ${args}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e: any) { return { code: e.status || 1, out: (e.stdout || '') + (e.stderr || '') }; } };
  // sample a real Task file to prove the CLI never writes (INV-S5a no auto-flip)
  const sampleTask = execSync(`grep -rlE '"ior": ?"ior:class:Task"' scenario/index | head -1`, { cwd: ROOT, encoding: 'utf8' }).trim();
  const mtimeBefore = sampleTask ? fs.statSync(path.join(ROOT, sampleTask)).mtimeMs : 0;
  const rep = run('');                    // report-only default
  const mtimeAfter = sampleTask ? fs.statSync(path.join(ROOT, sampleTask)).mtimeMs : 0;
  const strict = run('--strict');         // enforce
  const m = /Offenders:\s*(\d+)\s*\(FALSE-DONE:\s*(\d+).*?MALFORMED:\s*(\d+).*?UNVERIFIABLE:\s*(\d+).*?DRIFT:\s*(\d+)\)/s.exec(rep.out);
  const counts = m ? { total: +m[1], falseDone: +m[2], malformed: +m[3], unverifiable: +m[4], drift: +m[5] } : null;
  return {
    counts,
    falseDoneZero: !!counts && counts.falseDone === 0,          // (2) fix-proof: 0 FALSE-DONE now
    realDebtNonVacuous: !!counts && counts.total > 0,           // non-vacuous: the detector still reports the real drift/malformed debt
    reportOnlyExit0: rep.code === 0,                            // (4) report-only doesn't red CI
    strictExitsNonZero: strict.code !== 0,                      // (4) --strict enforces (exits 1 while debt>0)
    invS5aNoWrite: mtimeBefore === mtimeAfter,                  // INV-S5a: detector NEVER wrote a Task file
  };
}

const planted: any[] = [];
for (let i = 1; i <= 3; i++) planted.push(plantedIter());
const cli = cliAxis();

console.log('\n===== R-C5 TaskStatus detector BITE (own-oracle + live CLI, DET-3x) =====');
planted.forEach((r, i) => console.log(`planted iter ${i + 1}: ${JSON.stringify(r)}`));
console.log(`CLI live: ${JSON.stringify(cli)}`);
const plantedGreen = planted.length === 3 && planted.every((r) => r.ok);
const cliGreen = cli.falseDoneZero && cli.realDebtNonVacuous && cli.reportOnlyExit0 && cli.strictExitsNonZero && cli.invS5aNoWrite;
console.log(`(1)+(3) planted BITE (FALSE-DONE/DRIFT/MALFORMED/UNVERIFIABLE caught+named, clean clean, no auto-flip): ${plantedGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`(2)+(4) live counts + modes (FALSE-DONE==0 fix-proof, real debt reported, report-only exit0, --strict exit1, no-write INV-S5a): ${cliGreen ? 'GREEN' : 'RED'}`);
const green = plantedGreen && cliGreen;
console.log('OVERALL R-C5 detector BITE:', green ? 'GREEN (bites+holds)' : 'RED');
process.exitCode = green ? 0 : 1;
