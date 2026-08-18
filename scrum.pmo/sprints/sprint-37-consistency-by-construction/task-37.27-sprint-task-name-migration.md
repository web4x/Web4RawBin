<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.27: Sprint/task-name MIGRATION — strip embedded numbers to the single attribute, PHASED S37-first (R40.4-phase-2)

[task:uuid:f5986d69-74ec-4a29-87a0-01baccc111be]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Task Description

The deliberate DRY migration (R40.4-phase-2, UC sprintName.migrateToAttribute c9f394b1): eliminate every persisted duplicate of the number so Sprint.number + Task.taskIndex are the ONLY stored homes. Sprint units (~20): number from the sprint-<n> DIR (authoritative), strip the leading 'Sprint <n>[ :-]' from model.name. TASK family: DELETE the persisted model.sprintName field (derives via parent), strip 'Task <n>.<m>' from the title, set model.taskIndex. Scratch dry-run FIRST + per-unit before/after + AMBIGUOUS list (unresolvable REPORTED, never invented). ★ S37 ALREADY MIGRATED as the reference case (b86b53cc: name bare 'Consistency by Construction' + number 37, H1 shows the number once); ~19 sprints remain, PHASED.

## Context

UC sprintName.migrateToAttribute c9f394b1 -> R40.4 9a8cbffe. Reference case + revert recipe: scrum.pmo/sprints/sprint-37-consistency-by-construction/R40.4-phase2-S37-migration-log.md.

## Intention

One number attribute per unit; everything derives; no drift-by-construction.

## Acceptance Criteria

**AC (37.24 shape — real-WebKit @390 PIXEL, never a DOM count):** After migration a sprint/task board shows the number EXACTLY once (no doubling) @390 pixel-verified. ★ PHASED (PO ruling): S37 FIRST (DONE — reference case, verified on disk), then sprint-by-sprint. Gates are REPORT-ONLY with the COUNT EMITTED every ci run + AUTO-STRICT AT 0 (the self-draining revisit trigger — an unsatisfiable red-from-birth gate is how check:task-status got silently deleted). The phased remainder is recorded as DEBT with the residual risk (until phase-N, un-migrated sprints hold embedded numbers as un-derived data; display authoritative via the formatter) + revisit trigger (the remaining-count). Acceptance = NOT byte-diff==0 (deliberate change): REVERSIBILITY (backup + zero-restore) + CONTENT-CONSERVATION (bare title is an exact substring of the original, no theme text lost).

## Subtasks
