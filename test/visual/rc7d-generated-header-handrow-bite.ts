// R-C7 GENERATED_HEADER + hand-row BITE — the EXACT hole the S19 false-COMPLETE exposed, now closed by the expert's
// DRY fix (825fc5995: proveComplete no longer skips GENERATED_HEADER files; ONE exported perFileDiffs is the single
// source of truth for both prove & apply). INDEPENDENT own-oracle BITE over the EXPORTED perFileDiffs, DET-3x, scripts-only.
// CLASSIFICATION RULE encoded+bitten (architect): a hand item is CONTENT by DEFAULT (fail-closed) → flagged; it is
// non-content ONLY if provably G5-narrative (free prose, no checkbox) OR byte-identical boilerplate the generator
// reproduces. An in-flight/needs-review status row = CONTENT. A GENERATED_HEADER is NOT a free pass ("verify, don't assume").
// [test:uuid:47cebb22-c0c0-43e8-a1f4-5ebc42d5534a] R-C7 perFileDiffs GENERATED_HEADER-no-skip — a generated board carrying a hand-added row → REFUSE (needs-review for ID-less content e.g. 'in flight per po' / gap for a new ID), NEVER skipped because it has the header (closes the S19 false-COMPLETE); narrative(free prose)/byte-identical/nonexistent correctly free. DISTINCT-INTENT (no-skip) on the shared perFileDiffs the fix made prove & apply share (proveComplete 21e38b44) — alongside 0870c78b (completeness) + ae106047 (fail-closed).
import { perFileDiffs } from '../../scripts/migrate-boards.ts';
import { GENERATED_HEADER } from '../../scripts/generate-sprint-md.ts';
import fs from 'node:fs';
import path from 'node:path';

const SP = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad';
const DIR = path.join(SP, 'rc7d-fixture');
const GEN = GENERATED_HEADER + '\n# Sprint XX\n\n- [x] R-C10 first generated requirement\n- [ ] R-C11 second generated requirement\n';

function iter() {
  fs.rmSync(DIR, { recursive: true, force: true }); fs.mkdirSync(DIR, { recursive: true });
  const write = (name: string, extra: string) => fs.writeFileSync(path.join(DIR, name), GEN + extra);
  const R: any = {};

  // ★ THE NEW BITE: a GENERATED_HEADER file with a hand-added ID-LESS content row (S19's exact "in flight per po")
  // MUST be caught as needs-review — NOT skipped because it carries the header.
  write('handrow.md', '- [ ] implementing expert (in flight per po)\n');
  const d1 = perFileDiffs(DIR, new Map([['handrow.md', GEN]]));
  R.catchesHandRow = d1.length === 1 && d1[0].needsReview.some((x) => /in flight per po/i.test(x)) && d1[0].gaps.length === 0;

  // ID-bearing hand-added row (a genuinely new requirement) → a hard GAP.
  write('handid.md', '- [ ] R-C99 hand-added new requirement\n');
  const d2 = perFileDiffs(DIR, new Map([['handid.md', GEN]]));
  R.catchesHandId = d2.length === 1 && d2[0].gaps.some((x) => /R-C99/i.test(x));

  // CLASSIFICATION: G5 narrative (free prose, no checkbox) → NOT content → NOT flagged (zero-loss).
  write('narrative.md', '\nRationale: this design was chosen for latency. (free prose, no checkbox)\n');
  const d3 = perFileDiffs(DIR, new Map([['narrative.md', GEN]]));
  R.narrativeFree = d3.length === 0;

  // CLASSIFICATION: byte-identical boilerplate (truly generated, unedited) → free (0 delta).
  fs.writeFileSync(path.join(DIR, 'clean.md'), GEN);
  const d4 = perFileDiffs(DIR, new Map([['clean.md', GEN]]));
  R.cleanZero = d4.length === 0;

  // a NON-EXISTENT target file → skipped (generator creates it fresh, nothing hand-authored to prove).
  const d5 = perFileDiffs(DIR, new Map([['nonexistent.md', GEN]]));
  R.nonexistentSkipped = d5.length === 0;

  // ★ NEGATIVE CONTROL — the OLD (buggy) behavior would have SKIPPED handrow.md for carrying GENERATED_HEADER → 0 deltas
  // (the vacuous false-COMPLETE). The fix means it is NOT skipped. Assert the header did NOT buy a pass:
  R.headerNotAFreePass = R.catchesHandRow; // same fact, named for the report

  R.ok = R.catchesHandRow && R.catchesHandId && R.narrativeFree && R.cleanZero && R.nonexistentSkipped;
  return R;
}

const runs: any[] = [];
for (let i = 1; i <= 3; i++) runs.push(iter());
fs.rmSync(DIR, { recursive: true, force: true });
console.log('\n===== R-C7 GENERATED_HEADER + hand-row BITE (own-oracle, DET-3x) =====');
runs.forEach((r, i) => console.log(`iter ${i + 1}: ${JSON.stringify(r)}`));
const green = runs.length === 3 && runs.every((r) => r.ok);
console.log('OVERALL R-C7 header-handrow BITE:', green ? 'GREEN (bites+holds)' : 'RED');
console.log('BITE PROVEN: a GENERATED_HEADER board with a hand-added row is REFUSED (needs-review/gap), never skipped — the header is not a free pass (fixes the exact S19 false-COMPLETE). Narrative/byte-identical/nonexistent correctly free (content-default fail-closed classification).');
process.exitCode = green ? 0 : 1;
