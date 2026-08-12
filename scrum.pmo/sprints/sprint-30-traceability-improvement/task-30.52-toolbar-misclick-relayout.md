<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.52: 3-way merge toolbar re-layout — mis-click prevention ('N selected' own line, 'X/Y open' buffer)

[task:uuid:a0b24e6b-aa8b-4341-9f9d-ad158c5cb12e]

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
    - Requirement `[requirement:uuid:989471e8-c5f0-44fc-831f-4b1d1ad55d0c]`
  - refines
    - R30.50 (32abea56) toolbar-A — mis-click re-layout, new req per closure-freeze
  - impl-edit
    - renderMergeGutter e24dc98a (existing impl, no new Method/Impl)
  - down
    - [UC](./planning.md) `[uc:uuid:dce46e2a-c341-4251-be26-40497877e407]`

## Task Description

Re-layout the 3-way merge toolbar to prevent mis-clicks: 'N selected' moves to its OWN line directly under the '✨ Apply All' button (split from the compose), and the 'X/Y open conflicts' text moves DOWN to render BETWEEN the ▼ (down-nav) and ✓ (resolve) controls as a buffer. Both counts stay shown — repositioned, not removed.

## Context

Covers R30.52 (989471e8, refinementOf R30.50 32abea56 — NEW req per closure-freeze, R30.50 closed) → UC merge.toolbarMisclickLayout dce46e2a → RbDiffEditor. IMPL-EDIT on renderMergeGutter e24dc98a (NO new Method/Impl — a layout edit on the existing gutter impl). Gate = screenshot+behavior (Tron-visual).

## Intention

S30 diff/merge editor — R30.52 toolbar mis-click re-layout (refines R30.50-A after closure-freeze).

## Acceptance Criteria

- [x] 'N selected' renders INLINE on the SAME horizontal row as 'Apply All' + the nav controls (not wrapped onto its own line). [CORRECTED 2026-07-19: 'own line' was a mis-read of Tron's horizontal-toolbar ASCII stack.]
- [x] The 'X/Y open conflicts' text is MOVED DOWN to render BETWEEN the ▼ (down-nav) and ✓ (resolve) controls, as a NON-CLICKABLE buffer above ✓ (so a ▼ mis-click does not hit ✓).
- [x] Both counts (N selected + X/Y open conflicts) are still shown - repositioned, not removed.
- [x] GATE (screenshot+behavior): 'N selected' INLINE on the same row as Apply All + nav (not wrapped); 'X/Y open conflicts' between ▼ and ✓ as a non-clickable buffer; both counts visible; ▼ and ✓ no longer adjacent.  [GREEN DET-3x at TRON'S REAL state: iPhone-12/390px, N=14 post-'Apply All->Repo wins', '14 selected' visible single-line inline, toolbar one-row h=32, open-count between ▼/✓ (96fe09d80 v0.7.76); served==gated (toolbar unchanged v0.7.77)]

## Implementation

QA-REVIEW: toolbar re-layout CORRECTED + re-gated. Gate r3052 GREEN DET-3x at TRON'S REAL mobile state (96fe09d80 v0.7.76, iPhone-12/390px, N=14 post-Apply-All — '14 selected' visible inline, one-row h=32, open-count between ▼/✓). Chain both-directions: Test 53731d96 mobile-visibility + 919d290d inline <-> Impl renderMergeGutter e24dc98a. served==gated (toolbar code unchanged v0.7.76->v0.7.77; v0.7.77 bump = R30.51 folding, not toolbar). The N=1 false-green VOIDED. 4/4 ACs. HELD rule#9 -> Tron final visual -> Done.

## Subtasks

None (atomic task).
