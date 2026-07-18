<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.35: Diff coloring by kind + per-block merge-action MATRIX (WORKS/BROKEN validation)

[task:uuid:16379ac9-889f-43b6-96da-c24f5505f7ab]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.35 `[requirement:uuid:96634144-2069-4d3d-809c-f804873d7401]`
  - hard-gate
    - Tron approves the merge-action matrix DIAGRAM before ANY fix-implementation
  - down
    - 18 combination UCs (coloring + per-block actions + matrix cells) - tracked WORKS/BROKEN

## Task Description

Two parts: (A) diff COLORING by kind (add=green/delete=red/modify=blue/conflict=brown, kind derived in computeMergedCenter) - GATED GREEN. (B) per-block IntelliJ MERGE-ACTIONS matrix: for every {ADD/DELETE/MODIFY/CONFLICT} x {x dismiss / >> take-Local / << take-Repo} combination + edge states, track a WORKS/BROKEN status (architect validates each vs live v0.7.51). '>>' on a DELETION RE-ADDS the deleted line.

## Context

Covers R30.35 (96634144) - 18 UCs = coloring (9c41a415) + per-block actions (d7493e80) + 16 combination cells (the matrix). Class RbDiffEditor 18165081. Architect design c37d98c18 (kind-derive a0b30550 + per-kind acceptChange 843d79d4). ★ HARD GATE (Tron): Tron approves the matrix DIAGRAM before ANY fix-implementation - this task stays PRE-IMPLEMENTATION (of fixes) until then. Sync: req (0.4) mints combination units, architect (0.3) validates each cell vs live v0.7.51.

## Intention

S30 diff/merge editor, R30.35 (Tron scenario-first: plan x/>> merge-actions with req+planner, sync architect). Systematic per-combination correctness, not ad-hoc.

## Acceptance Criteria

- [x] (color-kind) KIND derived in computeMergedCenter (oLength==0 ADD / abLength==0 DELETE / both>0 MODIFY / stable:false CONFLICT); CONFLICT_PALETTE add=green/delete=red/modify=blue/conflict=brown [GATED v0.7.51]
- [x] (color-delete) DELETION renders RED (fixes the defect where one-sided changes rendered BLUE) [GATED v0.7.51 Test 5d8b3f47]
- [ ] (actions-matrix) EVERY {ADD/DELETE/MODIFY/CONFLICT} x {x / >> / <<} combination + edge states validated WORKS on live v0.7.51 (architect-measured); '>>' on a DELETION RE-ADDS the deleted line
- [ ] (diagram-gate) ★ Tron APPROVES the matrix DIAGRAM before ANY fix-implementation (HARD GATE - task pre-implementation until then)
- [ ] (gate) GATE = SCREENSHOT the 4 kinds show correct colors AND each action does the right thing per kind (esp >> re-adds a deleted line); pixel/screenshot NEVER DOM-count

## Implementation

IN PROGRESS - PRE-IMPLEMENTATION per Tron HARD GATE (diagram approval before any fix). PART A COLORING = GATED GREEN DET-3x v0.7.51 (Test 5d8b3f47, delete=red FIXED - was blue; 32f976921). PART B ACTIONS MATRIX = being validated by architect vs live v0.7.51 (per-cell WORKS/BROKEN below). acceptChange 843d79d4 built (>> take-Local/DELETE re-adds, << take-Repo, x dismiss). NEXT: architect fills the matrix WORKS/BROKEN -> matrix diagram -> TRON APPROVES DIAGRAM (hard gate) -> THEN expert implements fixes for BROKEN cells. NO implementation of fixes until Tron approves. 

MERGE-ACTION MATRIX (WORKS/BROKEN per combination — architect validates each vs LIVE v0.7.51; ? = pending architect validation):
| KIND \ ACTION | x (dismiss) | >> (take Local->Result) | << (take Repo->Result) |
|---|---|---|---|
| ADD (oLength==0, green)      | ? | ? | ? |
| DELETE (abLength==0, red)    | ? | ? (RE-ADDS deleted line) | ? |
| MODIFY (both>0, blue)        | ? | ? | ? |
| CONFLICT (stable:false, brown)| ? | ? | ? |
EDGE STATES (each ?): empty-opposite-side / no-base 2-way fallback / first-line / last-line / adjacent-blocks / already-accepted re-click / dismiss-then-reaccept.
Each cell + edge = a combination UC under R30.35 (18 UCs minted by req). Architect fills WORKS/BROKEN; BROKEN cells -> fix only AFTER Tron approves the matrix DIAGRAM (HARD GATE).

## Subtasks

The 18 combination UCs are the matrix cells (see matrix in implementation). Each = WORKS/BROKEN, architect-validated vs live v0.7.51.
