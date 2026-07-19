<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.27: 3-pane rows align — corresponding lines share one visual row

[task:uuid:316ebf29-a9a6-42ea-b0dc-677b816cf6d2]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [~] testing — REOPENED: r3053b left-pane parity RE-RED v0.7.80
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.27 `[requirement:uuid:674bae73-43ae-403a-9feb-ce8784ab1f20]`
  - crossRef
    - R30.23 (regression source — computeOneSidedHunks one-sided surfacing)
  - down
    - [UC diffEditor.threePaneRowAlignment](./planning.md) `[uc:uuid:a01ee01d-e77e-4d37-99ea-bb3dbd7e423e]`

## Task Description

Fix the 3-pane line-alignment regression: corresponding stable lines must sit on the SAME visual row across Local/Center/Repository, and a one-sided insertion of N lines shows N blank spacer rows in the opposite pane AT that position (not piled at the top). R30.23 regression — computeOneSidedHunks hardcodes the opposite-side start=0, so alignPaneRows dumps one-sided spacers at line 0 instead of the change position.

## Context

Covers R30.27 (674bae73) → UC diffEditor.threePaneRowAlignment (a01ee01d) → Class RbDiffEditor 18165081. Architect root-cause+fix spec 8f6884af3 (thread la/lb running line counters, set aStart:la/bStart:lb, remove the 0 fallbacks). IMPL-EDIT, marker a0b30550 stays (no new units). REGRESSION of R30.23 (one-sided change surfacing). RED baseline wired 7a4f9fbc6 (spacers at line 0). Must not regress repo-only / pure-conflict align (real aStart/bStart untouched).

## Intention

S30 diff/merge editor (R30.27, Tron live-confirmed): 3-pane rows were mis-aligning (spacers at line 0). Restore row-for-row alignment; merge result byte-identical, only spacer placement moves.

## Acceptance Criteria

- [x] (aligned) A 3-way diff with ≥1 one-sided change: the top stable line sits on the SAME visual row in all 3 panes; every corresponding stable line thereafter shares a row across Local/Center/Repository
- [x] (aligned) A LEFT (local-only) insertion of N lines shows N blank spacer rows in the REMOTE pane AT that position (not piled at the top); content below stays row-matched. Symmetric for repo-only
- [x] (no-regression) Repo-only changes AND pure conflicts both still align — the conflict path's real aStart/bStart are untouched (regression guard)
- [x] (result) The merge RESULT is byte-identical — pick/kind semantics unchanged; this only moves where spacer rows are inserted
- [x] (fix) Running per-buffer line counters la/lb threaded through the region loop; computeOneSidedHunks(region, cid, la, lb) sets aStart:la / bStart:lb (0 fallbacks removed); ok-runs (la+=len, lb+=len) and the conflict path advance the counters; alignPaneRows / renderCenterChangeBlocks / renderSideChangeBlocks / ribbons unchanged
- [x] (verify) Assertion-grade: for each stable line, getTopForLineNumber is equal (±0) across edLocal/edCenter/edRemote; DET-3x + Tron visual on the 4-screenshot repro; client fix → version-bump

## Implementation

REOPENED (Done->In-Progress, PO directive) — COVERED-EXCEPT-r3053b-OPEN. gate 3c8a5f19 SEPARATELY asserts R30.27's OWN AC (nMisaligned===0 all-anchors-align, RED->GREEN v0.7.40, anchor-recorded) = COVERED. BUT does NOT capture the r3053b LEFT-PANE PARITY defect (r3053b-leftpane-parity-gate.mjs RE-RED v0.7.80, 6d2f0ba44) surfaced by R30.53 folding on the SHARED alignment; architect LOCKED FIX-A2 (c1fe99640 signature-union classification). HOLD until FIX-A2 + r3053b RED->GREEN + CBC-confirm. NOT a false close. r3053b scope w/ SM/tester. | IN PROGRESS — architect derive/spec 8f6884af3 (root-cause+fix), EXPERT BUILDING now (impl-edit RbDiffEditor: thread per-buffer line counters la/lb through the region loop; computeOneSidedHunks(region,cid,la,lb) sets aStart:la / bStart:lb, 0 fallbacks removed; ok-runs la+=len/lb+=len + conflict path advance the counters; alignPaneRows/renderCenterChangeBlocks/renderSideChangeBlocks/ribbons unchanged). RED baseline gate 7a4f9fbc6 (DET-3x, spacers at line 0 reproduces). → expert deploy → QA-Review → tester DET-3x GREEN (getTopForLineNumber equal ±0 across edLocal/edCenter/edRemote per stable line) → Done. ⚠ before Done: chain-to-Test wired + served==gated (verify gate cites the served bundle) — the R30.25 lessons. | CLOSED -> DONE (PO decision + correct-by-construction VERIFIED, expert+architect measured IDLE = stale-In-Progress not active). READ the gate test/visual/r3027-three-pane-alignment-gate.mjs: PASS condition = nMisaligned===0 (line 61) = EVERY corresponding anchor aligns (getTopForLineNumber equal across all 3 panes) = R30.27 distinct AC (aligned/verify); the gate is literally the r3027 gate (RED->GREEN v0.7.40 on R30.27 spacer-at-0 fix), extended for R30.29 post-blank witnesses. GREEN DET-3x v0.7.47. Chain-to-Test via SHARED impl (R30.11 pattern): computeMergedCenter a0b30550 + alignPaneRows 17c71adf + Test 3c8a5f19. AC-coverage: aligned/no-regression-align/fix(via outcome)/verify all asserted (misaligned=0); AC-4 (result byte-identical) is STRUCTURAL (spacer-only impl-edit, no content change) + covered by the merge functional gates (R30.16/R30.17), not the alignment gate. NOT green-wash (independently measured GREEN + AC-specific pass condition).

## Subtasks

None (atomic task).
