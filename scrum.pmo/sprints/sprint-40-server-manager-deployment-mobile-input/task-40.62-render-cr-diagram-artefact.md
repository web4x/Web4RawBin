<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.62: Render the CR diagram file-artefact — a CR dropped on a diagram renders as a FILE-shaped artefact reusing the existing file/pumlartifact path (no forked CR-diagram kind)

[task:uuid:bb9dec65-0ff0-4e90-b55b-09a48e5bc40c]

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
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.62 `[requirement:uuid:a4c9340d-7cc6-4155-ab12-06a6ff4e5fa5]`
  - down
    - None (atomic task, plan-not-build; architect designs useCases at activation)

## Task Description

R40.62 diagram half (AC-render-diagram-file-artefact). Tron IMG_5175/5176: dragging a ChangeRequest onto a DIAGRAM accepts the drop (green + badge) but renders NOTHING. The AC was minted (1cbe69cd2, tree+diagram halves) but only the TREE half was built — the diagram half has no implementing task (the invisible untasked-AC the ac-untasked-audit now flags). This task implements the diagram render: a CR on a diagram renders as a FILE-shaped ARTEFACT reusing the EXISTING file/pumlartifact artefact path (Tron verbatim 'on diagrams an artefact like a file'), NOT a new CR-specific diagram kind. DRY gate: a forked CR-specific diagram renderer => RED (reuse the rb-modelelement-detail puml/artefact render, don't fork — DRY-by-copy is how the page-bootstrap bug got in). PLAN-NOT-BUILD (Tron: plan-a-task-to-fix-later): QUEUED AFTER the T40.1 checklist deploy + R37.24; architect supplies useCases + design at activation.

## Context

Covers R40.62 (a4c9340d) AC-render-diagram-file-artefact via the existing file/pumlartifact artefact render (rb-modelelement-detail). useCases pending architect design at activation (plan-not-build). The tree half (AC-render-tree-shared-itemview) shipped without a task = the meta-finding this task + the ac-untasked-audit detector close.

## Intention

Tron IMG_5175/6 device-QA (drag-CR-onto-diagram renders nothing) — plan the implementing task for R40.62's unbuilt diagram-render half. Covering task (#126) for req R40.62 AC-render-diagram-file-artefact; queued after the critical path per Tron 'plan-not-build-now'.

## Acceptance Criteria

- [ ] **(shape/parent)** ChangeRequest.ownerIor resolves to an ior:class:Test — the Test that must be re-evaluated/changed to resolve the CR. Renders under the Test (reverse-ownerIor scan, 5e9a1d887). SUPERSEDES R40.60 CR-ownerIor->Task; on disk the 5 T40.1 CRs are already ownerIor=Test (R40.60 Task-migration never ran) so this is disk-aligned, not a migration.
- [ ] **(shape/master-single-source)** task.changeRequests[] is the AUTHORITATIVE Task->CR master list (NOT a losable mirror — correct the server.ts:1391 comment to MASTER). Bidirectional single-source: every CR in task.changeRequests[] has model.task===that task, AND every CR unit with model.task===T is in T.changeRequests[]. ONE master (the task list); the backref MUST equal it.
- [ ] **(shape/affected-children)** CR.affects[] = the traceability units along the Task->…->Test trace that must change for the fix to land consistently; the CR is the CONTAINER of what changes and renders CR -> affected-units (forward children, hasChildren from affects[].length). Each affects[] ref is a REAL unit on the Task->Test trace.
- [ ] **(mechanic/evidence-gated)** Resolving a CR raised at a Task traces DOWN Task->coveredRequirement->UseCase->Class->Method->Impl->Test; the Test(s) needing change = the CR's parent(s), the units on that path that must change = affects[]. CR.status -> Resolved ONLY when the parent Test re-evaluates GREEN WITH the change (evidence-gated, NOT stamped) — so the change lands consistently across the chain.
- [ ] **(defect/gated-backfill)** ★ FLAGGED DEFECT (NOT minted as done): task.changeRequests[] is EMPTY on ALL tasks while CR units exist (RED baseline = today's 0-master with T40.1's 5 CRs found only via backref). FIX-SHAPE (gated, PO GO required, NOT run): for each ChangeRequest, add its uuid to model.task's changeRequests[]; dry-run+COUNT; INV every CR appears in exactly ONE task master; idempotent; correct the :1391 comment. Do NOT run until PO GO. ★ RENDERING RULING 2026-08-29 (architect f6b18ebea, do-not-elevate): CRs are ALREADY reachable in the tree via itemView (measured ownerIor: 5 under Test c4f8a1d6 + 3 under Sprint/Task parents), so the backfill may be UNNEEDED FOR REACHABILITY. HOLD this AC flagged-not-done; do NOT mint the backfill as required-for-reachability. RULE: after itemView(tree)+file-artefact(diagram) render, MEASURE precisely what is STILL unreachable and take THAT to Tron — never a general shape question. The DATA model (parent=Test/master-list/affects) STANDS; only its migration SCOPE may shrink (possibly to zero).
- [ ] **(render/tree-DRY)** TREE: a CR renders via the SHARED itemView path — ALREADY SO, nothing bespoke to retire (Tron verbatim: 'itemView in the tree'). Measured: rb-object-item/rb-trace-tree have NO changerequest branch; the CR appends as a standard child node (R40.61 reverse-ownerIor scan) and its detail REUSES rb-requirement-detail via the type-map (rb-detail-drawer.ts:305 changerequest->rb-requirement-detail). A CR is NOT a special node type. GATE (DRY): 0 CR-specific tree renderer — a bespoke 'changerequest' tree/item branch => RED (reuse the shared item path, never fork).
- [ ] **(render/diagram-reuse)** DIAGRAMS: a CR renders as a FILE-shaped ARTEFACT reusing the EXISTING artefact path (Tron verbatim: 'on diagrams an artefact like a file'), NOT a new CR-specific diagram kind. Measured: artefacts render via the file/pumlartifact node treatment (rb-modelelement-detail puml/artefact render). GATE (DRY): a CR on a diagram routes through the existing file/pumlartifact artefact render — a forked CR-specific diagram renderer => RED (DRY-by-copy is how the page-bootstrap bug got in; reuse, don't fork).

## Subtasks

None (atomic task, plan-not-build).
