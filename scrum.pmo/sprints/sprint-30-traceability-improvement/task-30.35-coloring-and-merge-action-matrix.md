<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.35: Diff coloring by kind + per-block merge-action MATRIX (WORKS/BROKEN validation)

[task:uuid:16379ac9-889f-43b6-96da-c24f5505f7ab]

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
    - Requirement R30.35 `[requirement:uuid:96634144-2069-4d3d-809c-f804873d7401]`
  - hard-gate
    - Tron approves the merge-action matrix DIAGRAM before ANY fix-implementation
  - down
    - 18 combination UCs (coloring + per-block actions + matrix cells) - tracked WORKS/BROKEN

## Task Description

Two parts: (A) diff COLORING by kind (add=green/delete=red/modify=blue/conflict=brown) - GATED GREEN. (B) per-block MERGE-ACTIONS matrix (Tron new model 2bdbab817): the center shows BOTH versions; for every {ADD/DELETE/MODIFY/CONFLICT} x {>> putLeft (add left) / << putRight (add right) / x removeLine (ALWAYS remove)} + edge states, track a WORKS/BROKEN status (architect validates each vs live). NO ignore/dismiss/pick-side.

## Context

Covers R30.35 (96634144) - 18 UCs = coloring (9c41a415) + per-block actions (d7493e80) + 16 combination cells (the matrix). Class RbDiffEditor 18165081. Architect design c37d98c18 (kind-derive a0b30550 + per-kind acceptChange 843d79d4). ★ HARD GATE (Tron): Tron approves the matrix DIAGRAM before ANY fix-implementation - this task stays PRE-IMPLEMENTATION (of fixes) until then. Sync: req (0.4) mints combination units, architect (0.3) validates each cell vs live v0.7.51.

## Intention

S30 diff/merge editor, R30.35 (Tron scenario-first: plan x/>> merge-actions with req+planner, sync architect). Systematic per-combination correctness, not ad-hoc.

## Acceptance Criteria

- [ ] **(kind)** KIND is derived in computeMergedCenter from the diff3 region: oLength==0 -> ADDITION, abLength==0 -> DELETION, both>0 -> MODIFICATION, stable:false -> CONFLICT. ConflictKind is extended and CONFLICT_PALETTE maps add=green / delete=red / modify=blue / conflict=brown (one place, pure fn of the block).
- [ ] **(color)** ADDITION (one side adds lines, oLength==0) renders GREEN.
- [ ] **(color)** DELETION (a line removed from the result - e.g. a local-only line dropped in dev, abLength==0) renders RED. This FIXES the current defect where every one-sided change rendered BLUE (a deletion looked like an addition).
- [ ] **(color)** MODIFICATION (changed, both sides present, both>0) renders BLUE.
- [ ] **(color)** CONFLICT (both sides diverge, stable:false) renders RED/BROWN (brown, visually distinct from delete-red).
- [ ] **(block)** Per changed region the CENTER shows BOTH versions (left line + right line; older=dark, newer=highlighted). Actions are ADD/REMOVE (NO ignore/dismiss/pick-side): '>>' PUTS the LEFT version into the center, '<<' PUTS the RIGHT version into the center (BOTH can be in the center at once), 'x' REMOVES that line from the center (ALWAYS). See the 16-cell behaviour matrix (mergeAction.* UCs).
- [ ] **(action-visibility)** UNIFIED per-line button-visibility (supersedes 'x only when both versions'): for EACH side, PER LINE-IN-CENTER - if that side's line IS in the center, show 'x' (remove that side); if it is NOT in the center, show '>>' (left) / '<<' (right) (add that side). Applies uniformly to BOTH one-sided changes AND conflicts.
- [ ] **(action-visibility)** Pressing 'x' on a side REMOVES that side's line from the center. From 2 lines -> 1 line (the change AUTO-RESOLVES to the remaining version and the editor JUMPS to the next change via jumpToChange). From 1 line -> 0 lines (the region is un-merged/removed - a deliberate resolved outcome; '>>'/'<<' then show on both sides to re-add either).
- [ ] **(action-visibility)** The '>>' (left) / '<<' (right) add-side action shows when that side's line is NOT currently in the center.
- [ ] **(action-visibility)** A ONE-SIDED change (1 line in center) follows the same per-line rule: 'x' on the present side removes it (-> 0 lines, un-merged) and '>>'/'<<' shows on the absent side; after removing to 0 lines, BOTH '>>'/'<<' show so either side can be re-added. No special-case - the per-line rule covers one-sided and conflicts identically.
- [ ] **(resolution)** The resolved-state DERIVES from the center line-count: 2 lines = UNRESOLVED (both versions present, undecided); 1 line = RESOLVED (one version chosen); 0 lines = RESOLVED (region removed / neither - a deliberate choice, re-openable via '>>'/'<<'). Unresolved ONLY when the center holds 2 versions. The R30.37 checkmark reflects this derived state and can manually override it.
- [ ] **(rendering)** A both-versions change (a>0 && b>0) renders as TWO PER-SIDE blocks, NOT one merged block spanning both center lines. MECHANISM (architect design e6a58f982): centerLeft span = [span0, span0+a.len] = the LEFT/older version (DARK); centerRight span = [span0+a.len, span1] = the RIGHT/newer version (HIGHLIGHTED). renderCenterChangeBlocks [37c9694c] emits 2 decorations (centerLeft + centerRight); renderConnectorRibbons [5051b2a4] draws 2 HALF-ribbons - Local<->centerLeft AND Repository<->centerRight - each side connecting to ITS specific center line, never one merged ribbon spanning both. One-sided changes (insertions/deletions) unchanged. Impl-edit, markers stay. The 2 blocks are VISUAL ONLY: the change remains ONE unit for resolution (one R30.37 'RESOLVED' checkmark, one resolved-state) - 2 blocks does NOT mean 2 resolve targets. (Ref screenshot: line 73 left / center 74+75 / right 74 -> 2 blocks.)
- [ ] **(gate)** GATE = SCREENSHOT the 4 kinds show the CORRECT colors (add=green / delete=red / modify=blue / conflict=brown) AND each action (>> / << / x) does the right thing per kind - especially '>>' RE-ADDS a deleted line on a DELETION block. Pixel/screenshot, NEVER DOM/element-count. Client-facing -> version-bump + atomic deploy (R30.28).

## Implementation

IN PROGRESS - PRE-IMPLEMENTATION per Tron HARD GATE (diagram approval before any fix). PART A COLORING = GATED GREEN DET-3x v0.7.51 (Test 5d8b3f47, delete=red FIXED - was blue; 32f976921). PART B ACTIONS MATRIX = being validated by architect vs live v0.7.51 (per-cell WORKS/BROKEN below). NEW MODEL 2bdbab817: >> putLeft (add left) / << putRight (add right) / x removeLine (always). acceptChange 843d79d4 to be re-fitted to put-left/put-right/remove on the both-versions center. NEXT: architect fills the matrix WORKS/BROKEN -> matrix diagram -> TRON APPROVES DIAGRAM (hard gate) -> THEN expert implements fixes for BROKEN cells. NO implementation of fixes until Tron approves. 

MERGE-ACTION MATRIX — WORKS/BROKEN per combination UC (architect validates each vs LIVE; ?=pending). Dual-linked to the 16 behaviour UCs (req f0b8acb14, REWORKED to Tron's new model 2bdbab817 — SAME uuids, new semantics). NEW MODEL: the center shows BOTH versions; >> putLeft ADDS the left/local version, << putRight ADDS the right/repo version, x removeLine REMOVES (ALWAYS) — NO ignore/dismiss/pick-side.
| KIND \ ACTION | >> putLeft (add left) | << putRight (add right) | x removeLine (always) |
|---|---|---|---|
| ADD      | 1eed3029 addPutLeft ?      | 4b47be33 addPutRight ?      | 3662f00b addRemoveLine ? |
| DELETE   | fd08c146 deletePutLeft ?   | 98c235e0 deletePutRight ?   | 74167c20 deleteRemoveLine ? |
| MODIFY   | 33ade681 modifyPutLeft ?   | 352b05ec modifyPutRight ?   | c014b832 modifyRemoveLine ? |
| CONFLICT | b934da9e conflictPutLeft ? | 72668662 conflictPutRight ? | a328ddac conflictRemoveLine ? |
EDGES (4): edgeBothVersionsInCenter 45cac75f ? / edgeCenterShowsBothVersions bc52e3ed ? / edgeRemoveIsAlways e11a2842 ? / edgeReAddAfterRemove c4ecb985 ?
(non-matrix UCs on R30.35: kindColoring 9c41a415 + blockActions d7493e80 = coloring, GATED GREEN.)
HARD GATE: architect fills WORKS/BROKEN -> PUML/SVG matrix DIAGRAM -> TRON APPROVES DIAGRAM -> only THEN expert fixes BROKEN cells. Task PRE-IMPLEMENTATION until Tron signs the diagram. ⚠ SEMANTICS REWORKED 2bdbab817 (put-left/put-right/remove-always); the 16 uuids + WORKS/BROKEN grid are UNAFFECTED (only cell labels re-synced). | ★ HARD GATE SATISFIED (2026-07-18): TRON APPROVED the architect diagram ("implement them all") — the diagram sign-off HAPPENED. No longer pre-implementation. EXPERT BUILDING NOW. Next Tron touchpoint = FINAL VISUAL VERIFY after the builds+gates land. On expert deploy -> gate (per-cell/behaviour) -> chain-to-Test + served==gated -> QA-Review -> Tron final verify -> Done. | NUMBERING (req 35d80847d): the 2-block rendering is R30.35 AC-two-per-side-blocks, NOT a separate R30.38 (no R30.38 req — label collision only). Tracked/gated under R30.35/T30.35 (Rule-9 dedup). Verified: 0 R30.38 unit on disk. | -> QA-REVIEW (2026-07-18, MERGE-EDITOR ARC COMPLETE, prod v0.7.56): gate-GREEN + chain-complete — coloring (32f976921) + both-versions (e57f587d7) + 2-block half-ribbons (e5b8df258 GREEN DET-3x v0.7.56, Test 5c9e2a71 wired onto renderConnectorRibbons 5051b2a4 + computeMergedCenter a0b30550) + the put-left/put-right/remove actions matrix. served==gated v0.7.56. 6/6 ACs gate-proven. HELD per rule#9 — AWAITING Tron VISUAL verify (he has screenshots) -> Done. | POLISH+OPT (2026-07-18, prod v0.7.59, tester f6e5bddb4): served==gated MOVED v0.7.56->v0.7.59. 6 polish fixes A/B/C/D/E/F GREEN DET-3x v0.7.59 (Test 1e6a4c93 wired onto jumpToChange 65c465fa + renderInterPaneGutter fd99c520 + renderConnectorRibbons 5051b2a4) + derived+override optimization v0.7.58 (Test 9b4e7c25 wired onto openChangeCount 8b6abf77 + toggleResolved c86a104d + removeLine af887908). No new req (folded under the arc, verified 0 R30.38+). Still QA-Review AWAITING Tron VISUAL verify.

## Subtasks

16 behaviour UCs (12 core {ADD/DELETE/MODIFY/CONFLICT}x{>>/<</x} + 4 edges) = the matrix cells, each dual-linked with an expectedBehaviour AC. WORKS/BROKEN tracked in the matrix (implementation). No fix-impl until Tron approves the diagram.
