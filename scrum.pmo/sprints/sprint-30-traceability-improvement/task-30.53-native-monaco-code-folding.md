<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.53: Changes-focused code-folding via NATIVE Monaco collapse/expand (fold by method boundaries)

[task:uuid:183475f6-400a-47f3-927a-620185798c22]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing (native Monaco fold, v0.7.81 edit-ZGIJZW7E.js)
  - [x] testing - model-side GREEN DET-3x (FIX-A2 r3053b RED->GREEN 79/79 + r3053c 104/104 + INV-A2)
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:ac3338b6-07a1-4fa6-9040-d9144db16ee8]`
  - supersedes
    - R30.51 (41a6ab2c) setHiddenAreas — Tron-rejected + reverted
  - down
    - [UC](./planning.md) `[uc:uuid:fcf8b48f-8e84-47d4-905b-4cdfb355e528]`
    - [UC](./planning.md) `[uc:uuid:8451731c-bb67-43ab-9a40-27a43e817d77]`
    - [UC](./planning.md) `[uc:uuid:48d56602-bfa0-4df3-ae48-81f65e936430]`

## Task Description

REDESIGN of code-folding using Monaco's NATIVE folding (standard chevron collapse/expand + '...' placeholder), foldable regions = METHOD boundaries; collapsing an unchanged method-block syncs across all 3 editors; change-holding method-blocks stay expanded. Replaces the Tron-rejected setHiddenAreas mechanism (R30.51).

## Context

Covers R30.53 (ac3338b6, supersedes R30.51 41a6ab2c) → 3 UCs (fcf8b48f/8451731c/48d56602) → RbDiffEditor. Architect REDESIGNING a native FoldingController (foldByMethodBoundaries / syncNativeFold / keepChangeMethodsExpanded). AC4 = the native-Monaco approach design-flag. Gate = screenshot+behavior DET-3x incl 390 mobile (Tron-visual).

## Intention

S30 diff/merge editor — R30.53 native-Monaco code-folding (supersedes R30.51 after Tron rejection).

## Acceptance Criteria

- [x] Code-folding uses Monaco NATIVE folding: standard chevron collapse/expand + '...' placeholder for a collapsed region (NOT setHiddenAreas hide-lines). - model-side GREEN (r3053c fold-affordance 104/104)
- [x] Foldable regions are the METHOD boundaries - folding collapses a whole method block. - GREEN (foldByMethodBoundaries 2de3411f, r3053c)
- [x] Collapsing an UNCHANGED method-block collapses the corresponding block SYNCED across all 3 editors (Local/Center/Repository); method-blocks containing a change/conflict STAY EXPANDED. - GREEN (r3053b left-pane parity RED->GREEN 79/79 + INV-A2)
- [x] [DESIGN-FLAG] The native-Monaco folding impl approach (FoldingController / folding-range provider by method / native fold-state sync) per architect derive-confirm. - CONFIRMED (architect backstop e5c46cb99 PASS vs LOCKED spec)
- [x] GATE (screenshot+behavior, DET-3x incl 390 mobile): native chevrons collapse/expand method-blocks with '...' placeholder; collapse an unchanged method-block -> all 3 collapse synced; change-containing method-blocks stay expanded. (Mobile MUST work.) - automated DET-3x GREEN model-side (r3053b/r3053c/INV-A2); FINAL Tron device webkit-visual (real 390 mobile) PENDING = held rule#9 Done gate (batched R30.53+R30.34+R30.41)

## Implementation

TRON DEVICE SIGN-OFF GREEN (2026-07-20, PO-relayed, rule#9 satisfied) -> DONE. MODEL-SIDE COMPLETE + triple-verified (v0.7.81) - awaiting ONLY Tron device webkit-visual (held rule#9). Full chain: BUG-1 left-fold-desync (v0.7.79) + BUG-2 fold-affordance (v0.7.80) + FIX-A2 left-pane parity (v0.7.81, 6517825bf change-method classification by signature-union, parity x3). Triple-verified: expert CBC + architect backstop (e5c46cb99 vs LOCKED spec) + tester gate. Gates GREEN DET-3x: r3053b left-pane-parity RED->GREEN 79/79 (f0d21d7fa, panes() residual CLOSED), r3053c fold-affordance 104/104, INV-A2. Native Monaco folding deployed (edit-ZGIJZW7E.js). Batched into ONE Tron device-check = R30.53 fold-chevron+left-parity + R30.34 spline + R30.41 syntax. r3053c fold-affordance Test unit being minted from marker 1dfe3d0f->foldByMethodBoundaries 2de3411f (90cf08562, #126 chain-honesty, req) - finishing residual, not a functional gap. Supersedes R30.51 (setHiddenAreas, Tron-rejected).

## Subtasks

None (atomic task).
