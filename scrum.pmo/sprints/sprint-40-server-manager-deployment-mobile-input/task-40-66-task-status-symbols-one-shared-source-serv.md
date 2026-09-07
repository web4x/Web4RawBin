<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.66: Task-status symbols: ONE shared source (serv

[task:uuid:691fd8a9-f9e9-4442-84c4-3edee7924cd8]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.66 (Task-status symbols: ONE shared source (serv). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.66; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(guard/mode-1-EXISTS-reframed)** EXISTS (REFRAMED per architect shape-ruling d33919390, landed AFTER my mint — my original mandated a vocab-unifying glyph EXTRACTION task-status-glyphs.ts, which would RESTYLE Tron's board (his ⚡/○/👁 -> server glyphs) = a separate Tron-surface UX decision, NOT required for the class-kill; kept visible as the corrected-away over-spec). The SHARED SOURCE is the EXISTING STATUS_ORDER enum (already shared, task-status-constants.ts) — NO new glyph extraction. The class-kill = the CLIENT-COVERAGE LINT over that enum: the client badge render must cover the shared STATUS_ORDER, and a status with no client glyph REDs. The client keeps its own glyph vocabulary (BADGE_MAP); only COVERAGE of the shared enum is enforced, not a unified glyph set.
- [ ] **(guard/mode-2-WIRED)** WIRED: the lint is in ci:gates:raw as STRICT, NEVER report-only. Report-only is EXACTLY how check-status-symbol.ts hid: it EXISTS, was NEVER wired (0 mentions in package.json, measured), and its 2nd-vocabulary detector was REPORT-ONLY so it missed BADGE_MAP entirely. A lint not in the strict gate does not exist for CI. (Target: 1 strict gate entry; report-only=0.)
- [ ] **(guard/mode-3-COVERS)** COVERS THE CLASS: the lint covers the CLIENT badge render AND ALL statuses INCLUDING the band (QA-Review-with-open-CR), not just the server table. The check-status-symbol miss was covering the server vocabulary while the CLIENT BADGE_MAP + the band status went unchecked. Every TaskStatusEnum value (Planned/In Progress/QA-Review-with-open-CR/QA Review/Done) MUST have a render on both surfaces via the shared source.
- [ ] **(guard/mode-4-RED-BASELINE)** RED-ON-THE-LIVE-DEFECT: the lint MUST be PROVEN to go RED on TODAY's unfixed tree (BADGE_MAP lacks the band => raw gray 'qa-review-with-open-cr' text) BEFORE the fix lands — that evidence is available NOW and is the strongest we can get (tester owns the RED). A lint that cannot RED on its own motivating defect is the WRONG lint. THEN the shared-source fix + the SAME lint greens.
- [ ] **(guard-that-guards-the-guards)** META-CHECK (PO-adopted + architect fold): EVERY scripts/check-*.{mjs,ts} appears in ci:gates:raw — an existing-but-UNWIRED guard => RED. This is the guard-that-guards-the-guards: it generalizes AC-wired-strict-not-report-only from THIS lint to the WHOLE check-* family, killing the unwired-guard class BY CONSTRUCTION (a gate, not a procedure — does not depend on the next agent remembering to wire). Would have caught check-status-symbol.ts (unwired since Aug 12, 0 in package.json, exits-0 = certified green over its own defect) AND check-detail-primitive.

## Subtasks
