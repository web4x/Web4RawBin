// R-C7 narrative-preservation BITE (PO-flagged, expert caught live on S28) — own-oracle, scripts-only, DET.
// THE HOLE: proveBoardComplete only inspects ID gaps + ID-less checkbox rows; hand NARRATIVE outside the generated
// regions ('**Theme:** …', '**Source:** …', '*Captured by …*') is INVISIBLE to the proof (G5 excludes narrative),
// yet nothing preserves it on --apply → the regen STRIPS it (S28: 26 deletions). So 'prove PASS ⇒ apply succeeds'
// held while the deeper invariant 'apply loses NOTHING' was violated. PO fix path: (interim) --prove MUST REFUSE a
// board carrying hand narrative outside generated regions, with a NAMED reason, WHILE R-C6 preserve-narrative is
// unbuilt; (final, R-C6) the same board PASSES and its narrative survives --apply byte-identical (generated index
// between markers, narrative outside untouched). THIS BITE = phase (a): a narrative-carrying board must NOT prove
// 'complete'. RED now (proveBoardComplete is blind → returns complete) → GREEN when the refusal lands. Phase (b)
// [narrative survives --apply byte-identical] is the follow-on once R-C6 preserve-region ships. NO marker while RED.
import { proveBoardComplete } from '../../scripts/migrate-boards.ts';

// generated board = pure structural rows, NO hand narrative
const generated = [
  '# Sprint 28 — X',
  '- [x] R28.1 first requirement',
  '- [x] R28.2 second requirement',
  '',
].join('\n');

// CASE-A (BITE): hand board = SAME rows + HAND NARRATIVE outside any generated region (the exact shapes the expert
// found being stripped on S28). No R/T id, not a checkbox row → invisible to proveBoardComplete → would be lost on apply.
const handWithNarrative = [
  '# Sprint 28 — X',
  '',
  '**Theme:** consolidate the room-handling epic under one owner.',
  '**Source:** Tron directive, standup 2026-07-xx.',
  '',
  '- [x] R28.1 first requirement',
  '- [x] R28.2 second requirement',
  '',
  '*Captured by robbin-req; see the linked ADR for rationale.*',
  '',
].join('\n');

// CASE-B (HOLD): a CLEAN board (rows only, matches generated) must STILL prove complete (no false refusal).
const handClean = generated;

const isComplete = (d: { gaps: string[]; needsReview: string[] }) => d.gaps.length === 0 && d.needsReview.length === 0;

const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  const a = proveBoardComplete(handWithNarrative, generated);
  const b = proveBoardComplete(handClean, generated);

  // BITE: a narrative-carrying board must NOT read as complete (prove must REFUSE / flag the narrative that apply would strip)
  const biteRefusesNarrative = !isComplete(a);
  // HOLD: a clean board must still prove complete (no false refusal)
  const cleanHolds = isComplete(b);

  const pass = biteRefusesNarrative && cleanHolds;
  results.push(pass);
  console.log(`iter ${i}: narrative-refused=${biteRefusesNarrative}(A.gaps=[${a.gaps.join(',')}] A.needsReview=[${a.needsReview.join(',')}]) clean-holds=${cleanHolds} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R-C7 narrative-preservation BITE — phase (a) prove-must-refuse (DET-3x, own-oracle) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (bites: narrative invisible to prove → apply would strip it)');
console.log('NOTE: RED = the hole (prove passes a board whose hand narrative --apply strips). Flips GREEN when --prove REFUSES a narrative-carrying board with a named reason. Phase (b) [narrative survives --apply byte-identical] follows once R-C6 preserve-region ships. No Test marker while RED.');
process.exitCode = green ? 0 : 1;
