// [test:uuid:705e8a53-dbed-4b77-8527-043535fda95a] R-C7 prose-cross-ref-not-a-gap (structural-row gap-id derivation, expert fix 7eeb6cc6c) — proveComplete 21e38b44, DISTINCT-intent alongside 0870c78b (complete) + ae106047 (fail-closed-vacuous). GREEN DET-3x: a hand PROSE cross-ref no longer injects a false gap; a real structural checkbox gap still fires.
// R-C7 extractIds prose-cross-ref BITE (architect-requested) — own-oracle, scripts-only, served-independent, DET.
// THE HOLE: proveBoardComplete's gap check (migrate-boards.ts:51) uses extractIds() which regex-scans the WHOLE board
// markdown (line 25) — including PROSE — for R/T ids. So a hand-authored NARRATIVE cross-reference like "blocked by
// R21.9 (see sprint 21)" injects id:R21.9 as a FALSE GAP, even though R21.9 is not a structural row of THIS sprint.
// That contradicts the stated intent (line 20: "STRUCTURAL keys, narrative ignored" / line 42-46: a gap is a missing
// hand ITEM, prose yields no items). Fix (expert): the gap check must derive ids from STRUCTURAL rows (extractRows),
// not the whole-md extractIds. BITE = a prose cross-ref must NOT be a gap; HOLD = a real structural gap MUST still fire.
// RED now (bites the live bug) → GREEN once extractIds/gap-derivation is restricted to structural rows. NO marker while RED.
import { proveBoardComplete } from '../../scripts/migrate-boards.ts';

// generated board = the two real structural rows, NO prose cross-refs
const generated = [
  '# Sprint 21 — Room handling',
  '- [x] R21.1 first requirement',
  '- [x] R21.2 second requirement',
  '',
].join('\n');

// CASE-A (BITE): hand board = SAME structural rows + a PROSE line cross-referencing R21.9 and T18.3 (other sprints).
// These are narrative mentions, NOT checkbox rows here → must NOT be reported as gaps.
const handProseCrossref = [
  '# Sprint 21 — Room handling',
  '- [x] R21.1 first requirement',
  '- [x] R21.2 second requirement',
  '',
  'Note: R21.2 was unblocked once R21.9 landed (tracked in the sprint-21 follow-up); see also T18.3 for history.',
  '',
].join('\n');

// CASE-B (HOLD): hand board carries a REAL structural checkbox row (R21.7) that the generated board lacks = genuine gap.
const handRealGap = [
  '# Sprint 21 — Room handling',
  '- [x] R21.1 first requirement',
  '- [x] R21.2 second requirement',
  '- [ ] R21.7 genuinely missing requirement',
  '',
].join('\n');

const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  const a = proveBoardComplete(handProseCrossref, generated);
  const b = proveBoardComplete(handRealGap, generated);

  // BITE: neither prose id may appear as a gap (prose cross-ref ≠ gap)
  const proseGaps = a.gaps.filter((g) => g === 'id:R21.9' || g === 'id:T18.3');
  const biteProseNotGap = proseGaps.length === 0;

  // HOLD: a real structural gap MUST still be caught (invariant before + after the fix)
  const realGapCaught = b.gaps.includes('id:R21.7');

  const pass = biteProseNotGap && realGapCaught;
  results.push(pass);
  console.log(`iter ${i}: prose-not-gap=${biteProseNotGap}(A.gaps=[${a.gaps.join(',')}]) real-gap-held=${realGapCaught}(B.gaps=[${b.gaps.join(',')}]) => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R-C7 extractIds prose-cross-ref BITE (DET-3x, own-oracle) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (bites the live prose-cross-ref false-gap)');
console.log('NOTE: RED here = the BITE catching the live bug (prose cross-ref counted as a gap). Flips GREEN when the gap check derives ids from STRUCTURAL rows, not whole-md extractIds. No Test marker while RED.');
process.exitCode = green ? 0 : 1;
