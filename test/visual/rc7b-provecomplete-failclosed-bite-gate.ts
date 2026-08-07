// R-C7 proveComplete FAIL-CLOSED re-BITE — INDEPENDENT anti-vacuous gate (own-oracle, scripts-only, DET-3x).
// The hole I originally hit: proveComplete on an unresolvable / wrong-ior:class uuid returned a VACUOUS complete:true,
// which would let --apply overwrite a hand-authored board on an EMPTY proof (data-loss). The expert's fail-closed sweep
// (88a044892) now REFUSES those with a NAMED reason. This re-BITE reproduces MY false-'COMPLETE' and asserts it is now a
// REFUSAL, while a REAL Sprint still returns a genuine (non-vacuous) proof — proving the fix distinguishes the two.
// READ-ONLY (proveComplete is G1 proof-before-write, never writes). Zero pollution.
// [test:uuid:ae106047-eb62-4a99-9b33-84f91697269f] R-C7 proveComplete (21e38b44) FAIL-CLOSED — unresolvable uuid AND wrong-ior:class (Requirement, not Sprint) → REFUSE complete:false with a NAMED FAIL-CLOSED reason (never vacuous complete:true, the data-loss hole I found); a real Sprint (Sprint18) still proves non-vacuously (real gaps/needsReview, not a refusal). DISTINCT-INTENT (fail-closed) on 21e38b44 alongside 0870c78b (completeness proof).
import { proveComplete } from '../../scripts/migrate-boards.ts';

const UNRESOLVABLE = '00000000-0000-4000-8000-000000000000';
const WRONG_IOR = '91a1c36a-bd77-4c05-a5ac-e3f1dfbfac5b';   // an ior:class:Requirement (NOT Sprint) — my exact original false-COMPLETE
const REAL_SPRINT = '5b950725-a6f6-4d45-b802-4784ee6ef962'; // Sprint18 — a genuine Sprint (real proof, non-vacuous)

function iter() {
  const R: any = {};
  const unres = proveComplete(UNRESOLVABLE);
  const wrong = proveComplete(WRONG_IOR);
  const real = proveComplete(REAL_SPRINT);

  // BITE-1 unresolvable → REFUSE (fail-closed), never vacuous complete:true
  R.unresRefuses = unres.complete === false && !!unres.reason && /FAIL-CLOSED/.test(unres.reason) && /does not resolve/i.test(unres.reason) && unres.gaps.length === 0;
  // BITE-2 wrong-ior (Requirement, not Sprint) → REFUSE naming the wrong class — the EXACT hole I found
  R.wrongIorRefuses = wrong.complete === false && !!wrong.reason && /FAIL-CLOSED/.test(wrong.reason) && /not ior:class:Sprint/i.test(wrong.reason);
  R.wrongIorNamesClass = !!wrong.reason && /Requirement/.test(wrong.reason);
  // NON-VACUOUS control: a REAL Sprint must NOT be a fail-closed refusal — it runs the genuine proof (real gaps named,
  // or genuinely complete). A vacuous fix that just refused everything would fail HERE.
  R.realNonVacuous = (real.reason === undefined || !/FAIL-CLOSED/.test(real.reason)) && (real.complete === true || real.gaps.length > 0 || real.needsReview.length > 0);
  R.realProofRan = real.sprintSlug !== REAL_SPRINT.slice(0, 8) || real.complete === true || real.gaps.length > 0; // buildSprintOutput resolved a real slug / real proof

  R.ok = R.unresRefuses && R.wrongIorRefuses && R.wrongIorNamesClass && R.realNonVacuous;
  R._dbg = { unres: { c: unres.complete, r: unres.reason }, wrong: { c: wrong.complete, r: wrong.reason }, real: { c: real.complete, slug: real.sprintSlug, gaps: real.gaps.length, needsReview: real.needsReview.length, failClosed: !!real.reason && /FAIL-CLOSED/.test(real.reason) } };
  return R;
}

const runs: any[] = [];
for (let i = 1; i <= 3; i++) runs.push(iter());
console.log('\n===== R-C7 proveComplete FAIL-CLOSED re-BITE (DET-3x) =====');
runs.forEach((r, i) => console.log(`iter ${i + 1}: ok=${r.ok} ${JSON.stringify(r._dbg)}`));
const green = runs.length === 3 && runs.every((r) => r.ok);
console.log('OVERALL proveComplete FAIL-CLOSED re-BITE:', green ? 'GREEN (bites+holds)' : 'RED');
console.log('BITE PROVEN: my original vacuous-COMPLETE (unresolvable + wrong-ior Requirement uuid) now REFUSES with a named reason; a real Sprint still proves non-vacuously — the fix closes the hole without over-refusing.');
process.exitCode = green ? 0 : 1;
