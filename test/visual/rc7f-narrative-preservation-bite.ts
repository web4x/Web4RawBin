// [test:uuid:57829ccc-59dd-4360-a11c-35899a5182f1] R-C7 narrative-loss REFUSAL (perFileDiffs.drops → proveComplete refuse, expert fix 7eeb6cc6c) — proveComplete 21e38b44, DISTINCT-intent (narrative preservation), alongside 705e8a53 (prose-gap) + 0870c78b + ae106047. GREEN DET-3x phase (a): hand narrative surfaced as drops → prove refuses fail-closed; clean board still complete. Phase (b) [survives --apply byte-identical] follows R-C6.
// R-C7 narrative-preservation BITE (PO-flagged, expert caught live on S28) — own-oracle, scripts-only, DET.
// ★ CORRECTION (measure-first, rule #4): my first cut pointed at proveBoardComplete — the STRUCTURAL proof, which is
// narrative-blind BY DESIGN (G5) and would NEVER flip. The narrative-loss guard actually lives in the SHARED, EXPORTED
// perFileDiffs() (migrate-boards.ts:68) — it surfaces every hand line the generator won't reproduce as a `drop`, and
// proveComplete (impl 21e38b44) then REFUSES fail-closed on any drop (line 116: complete requires 0 gaps AND 0
// needsReview AND 0 drops). So the correct BITE targets perFileDiffs.drops = the layer that makes "apply loses nothing"
// enforceable. THE HOLE it closes: hand narrative ('**Theme:**', '**Source:**', '*Captured by …*') outside generated
// regions silently vanished on --apply (S28: 26 deletions). DISCRIMINATION: pre-7eeb6cc6c perFileDiffs had NO `drops`
// field → this assertion could not pass = RED; post-fix drops surfaces the narrative = GREEN. Phase (b) [narrative
// SURVIVES --apply byte-identical] follows once R-C6 preserve-region ships (drops→0 for a preserved board, then PASS).
import { perFileDiffs } from '../../scripts/migrate-boards.ts';
import fs from 'node:fs';
import path from 'node:path';

const SCRATCH = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad';
const BOARD = 'requirements.md';

// generated view = pure structural rows, NO hand narrative
const generated = [
  '# Sprint 28 — X',
  '- [x] R28.1 first requirement',
  '- [x] R28.2 second requirement',
  '',
].join('\n');

// CASE-A: a board carrying HAND NARRATIVE outside any generated region (the exact shapes stripped on S28)
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

const isRefuse = (e?: { gaps: string[]; needsReview: string[]; drops: string[] }) => !!e && (e.gaps.length + e.needsReview.length + e.drops.length) > 0;

const results: boolean[] = [];
for (let i = 1; i <= 3; i++) {
  const dir = fs.mkdtempSync(path.join(SCRATCH, 'rc7f-'));
  try {
    // CASE-A (BITE): narrative board → perFileDiffs must surface the narrative as `drops` → proveComplete would REFUSE
    fs.writeFileSync(path.join(dir, BOARD), handWithNarrative);
    const a = perFileDiffs(dir, new Map([[BOARD, generated]]));
    const aEntry = a.find((e) => e.file === BOARD);
    const narrativeSurfaced = !!aEntry && aEntry.drops.some((l) => /\*\*(theme|source)|captured by/i.test(l));
    const wouldRefuseNarrative = isRefuse(aEntry);

    // CASE-B (HOLD): a clean board (== generated) → 0 drops → complete (no false refusal)
    fs.writeFileSync(path.join(dir, BOARD), generated);
    const b = perFileDiffs(dir, new Map([[BOARD, generated]]));
    const cleanComplete = !isRefuse(b.find((e) => e.file === BOARD));

    const pass = narrativeSurfaced && wouldRefuseNarrative && cleanComplete;
    results.push(pass);
    console.log(`iter ${i}: narrative-surfaced-as-drop=${narrativeSurfaced} would-refuse=${wouldRefuseNarrative}(drops=[${(aEntry?.drops || []).map((l) => l.slice(0, 24)).join(' | ')}]) clean-complete=${cleanComplete} => ${pass ? 'GREEN' : 'RED'}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('\n===== R-C7 narrative-preservation BITE — phase (a) prove-refuses-narrative-loss (DET-3x, own-oracle via perFileDiffs) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: verifies the narrative-loss refusal guard (perFileDiffs.drops → proveComplete refuse) — hand narrative can no longer silently vanish on --apply. Phase (b) [narrative survives --apply BYTE-IDENTICAL] follows once R-C6 preserve-region ships. Marker → proveComplete 21e38b44 (distinct-intent: narrative-loss-refusal).');
process.exitCode = green ? 0 : 1;
