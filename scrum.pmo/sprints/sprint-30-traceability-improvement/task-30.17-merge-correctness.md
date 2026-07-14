<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.17: 3-pane merge functional correctness

[task:uuid:b74f8023-b501-426a-af6f-86d0d9f378f8]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.17 `[requirement:uuid:5aa71554-03ee-410f-b0d4-d00e9a7f2efa]`
  - down
    - [UC](./planning.md) `[uc:uuid:e322c683-0c92-406e-abb4-322390b1a973]`

## Task Description

Verify + fix the R30.16 3-pane merge FUNCTIONAL correctness: accepting hunks produces the correct merged output (acceptance).

## Context

Covers R30.17 (5aa71554). Class RbDiffEditor.

## Intention

S30 diff/merge editor completion (R30.17). Minted for #126 traceability (was requirement-only).

## Acceptance Criteria

- [ ] (click) #4: accept take-arrows WORK - a single delegated click listener on the stable component ROOT (attached once in mountThreePane) routes [data-cid] clicks to acceptChange(id,side)/dismiss; renderInterPaneGutters drops its per-strip addEventListener (only sets innerHTML). Clicking take-Local/take-Repo MUTATES the CENTER Result text content (not just renders a button).
- [ ] (ribbons) #1: renderConnectorRibbons draws the Local->Result band ONLY iff c.a.length>0 and the Result->Repository band ONLY iff c.b.length>0 - a one-sided change no longer draws both bands.
- [ ] (ribbons) #3: no ghost ribbon from an empty side (origin taken from a/b length); the gutter take-arrows are gated the same (take-Local shown iff a.length, take-Repo iff b.length).
- [ ] (align) #2: alignPaneRows afterLineNumber uses a consistent index base (handles len===0 blocks, spacer BEFORE the gap); anchors pinned to the hunk first-changed line. MANDATORY: post-alignment lineY(edRemote, c.bStart) === lineY(edCenter, c.span[0]) (and Local) - source row and its center landing share Y (+-0).
- [ ] (history) #5: the .de-history <select> renders on the LEFT pane (s==='local'); populateLeftHistory populates the LEFT with the file's git history (old-on-left), RIGHT = working/current; pane labels read old(left)/new(right); swapSides + acceptChange left/right semantics preserved.
- [ ] (gate) ★ Tester DET-3x asserts FUNCTION not appearance (the R30.16 miss): (a) click take-arrow -> CENTER editor value CONTENT changes; (b) click ignore -> that change's arrows/ribbon disappear + CENTER unchanged; (c) one-sided hunk -> ribbon from ONE side only (no ghost); (d) lineY(remote,bStart)===lineY(center,span[0]); (e) history <select> on LEFT.

## Implementation

STOOD UP (planning) — status Planned; was requirement-only, minted for #126 traceability. Status to be advanced per PO/architect hop-signals (some R30.1x may already be shipped/gated — verify).

## Subtasks

None (atomic task).
