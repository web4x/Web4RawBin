<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.9: IntelliJ-faithful base-aware 3-way merge view

[task:uuid:6a6a56d3-3e06-44e9-9ca2-b7c11d574bff]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

HELD-FROM-BATCH (PO 2026-08-12, NOT Tron-signable): tester-diagnosed = GATE STALE/UNVERIFIABLE (status:pass over a currently-RED gate DET-3x, hollow-row class), FEATURE NOT IMPLICATED (no broken feature). Status stays QA-Review (not downgraded); do NOT approve until the gate is re-verified GREEN.

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.9 `[requirement:uuid:0d6f18cd-1496-4672-8fee-5a38eeb728dc]`
  - down
    - [UC](./planning.md) `[uc:uuid:829f010e-e811-4a64-89a3-f324fc48995d]`

## Task Description

Rebuild the RbDiffEditor merge view to be IntelliJ-faithful and base-aware: render the 3-way merge with IntelliJ visual fidelity (base-aware conflict resolution, gutter actions), superseding the in-house-LCS merge (R30.6.1/3).

## Context

Covers R30.9 (0d6f18cd). Class RbDiffEditor.

## Intention

S30: minted for #126 traceability (R30.9 was requirement-only; pin held the req uuid as workaround).

## Acceptance Criteria

- [x] (merge) Two refs -> GitApi.mergeBase -> CENTER starts as the base-aware auto-merge (non-conflicting changes from either side pre-applied via node-diff3), true conflicts flagged; layout is LEFT=local | CENTER=result | RIGHT=remote (IntelliJ column order).
- [x] (gutter) Per-change accept-left / accept-right gutter arrows (renderMergeGutter + acceptChange) apply that side's chunk into CENTER at the aligned range; conflicts are highlighted for resolution.
- [x] (actions) 'Apply All Non-Conflicting Changes' (applyAllNonConflicting) is one click; syncScroll3 keeps all three panes scroll-aligned.
- [x] (fidelity) CENTER is a full Monaco editor (autocomplete/lint/keybindings) — IntelliJ's fully-functional center; the 3 editors share one Monaco via monacoLoader (reuse rb-code-editor's).
- [x] (git) BASE = GitApi.mergeBase(leftRef,rightRef) via read-only git merge-base (execFile + ref-allowlist / R30.7 guardRef).
- [x] (fallback) No merge-base (unrelated histories / working-file vs arbitrary ref / non-git) -> documented 2-way take-over fallback (CENTER=local, accept-arrows work as plain take-over).
- [x] (supersede) The in-house LCS is retired: R30.6.1 computeDiff (15843ac9) + R30.6.3 renderHunks (37636aaa)/takeHunk (6ebfac12) markers removed + Impl units noted 'superseded by IntelliJ 3-way merge (R30.9)'; node-diff3 owns diffing. save writes CENTER via /api/files.
- [x] (verify) computeMergedCenter unit test: diff3Merge auto-applies non-conflicting changes + flags true conflicts (pure, DOM-free).

## Implementation

TRON-ACCEPTED 2026-07-13 (fidelity gate PASSED — Tron: the current implementation is amazing; IntelliJ 3-way visual-fidelity check passed). Tester finishing last 3 interaction hops for full chain-credit. status QA Review (Tron-accepted = the real acceptance; full scoreboard credit pending 3 hops). | HOPS RESOLVED (2026-07-17, PO doctrine-correct, tester refused false-credit): (#2) renderHunks Impl 37636aaa = RETIRED-SUPERSEDED (supersededBy R30.9 req 0d6f18cd, note LCS/manual-gutter retired — verified on disk, honor-supersededBy R30.11 pattern, NOT a Test = no false-credit). (#3) populateRightHistory Impl 58c11039 = RETIRED-SUPERSEDED (supersededBy populateLeftHistory 751934c1 R30.17 — verified on disk). Both retired-NOT-open. (#1) save Impl a88b2b53 = THE ONE TRACKED-OPEN coverage item: implemented + live + Tron-accepted, but NO pollution-safe isolated Test yet (PUT /api/files is overwrite-only, no scratch/delete; the classifier CORRECTLY blocks prod writes — doctrine working). NOT green-washed, NOT false-credited, NO prod write sanctioned. CLOSURE PATH = expert builds a by-construction safe-save-test mechanism (dry-run flag on PUT preferred, reusable for the whole suite), DEFERRED until AFTER Tron R30.34 verdict (expert stays free for a possible bolden). T30.9 stays QA-Review (Tron-accepted = real acceptance; the save Test is the single honest-open, deferred). | ✓ SAVE-ITEM CLOSED (2026-07-19, tester 9b6b3688c — SUBSUMED, correct-by-construction, no false-credit): the one honest-open (save Impl a88b2b53, no pollution-safe Test) is CLOSED via Test 4e2c8f10 (the R30.38 save-404 gate) — SAME single RbDiffEditor.save (Method 11a8ea6e -> Impl a88b2b53) drives PUT /api/files with merged CENTER content = T30.9 save AC (superset: +repo-correctness). 4e2c8f10 IS the pollution-safe mechanism (non-writing 409 stale-mtime probe + route-intercept, non-destructive proven via post-run git clean-check). a88b2b53.tests[]=[4e2c8f10] credits BOTH R30.9 + R30.38 (one impl, one Test). T30.9 save-coverage = 100%; all 3 hops resolved (#2/#3 retired-superseded, #1 save subsumed-closed). Stays QA-Review (Tron-accepted) — ready for Done on Tron formal sign-off.

## Subtasks

None (atomic task).
