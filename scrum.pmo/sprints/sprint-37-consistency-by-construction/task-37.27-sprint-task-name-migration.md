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

- [ ] **(display)** Every surface shows EXACTLY 'Sprint <n>: <title>' (sprints) / 'Task <n>.<m>: <title>' (tasks), colon: tree/item row, detail header, every generated MD view — all derive at render, none stores the composed string.
- [ ] **(single-source)** The display strings are composed by the ONE formatter family sprintDisplayName/taskDisplayName — a grep PROVES no second composition site (extends sprint-label.ts; retires generator.ts:105 + sprint-overview-generator.ts:39 variants).
- [ ] **(single-source)** Sprint number = REQUIRED typed attribute model.number (declared-not-defaulted); read at RENDER from model.number (dir-parse fallback becomes MIGRATION-ONLY). GATE (stub-must-fail): a Sprint unit with no model.number -> RED.
- [ ] **(single-source)** A task number has TWO components: the sprint part DERIVES via parent->sprint.number, the '.M' is the task's OWN model.taskIndex attribute. taskDisplayName='Task <parent.sprintNumber>.<taskIndex>: <title>'; NO stored 'Task N.M' literal, NO task.sprintName field. One number attribute per unit (sprint.number, task.taskIndex).
- [ ] **(single-source)** DRY (Tron's ONE-attribute): NO persisted sprint-number anywhere except Sprint.number, NO persisted task-number except Task.taskIndex. The task model.sprintName field is DELETED (derives via parent, NOT kept in sync). GATE (stub-must-fail): a persisted sprintName/sprint-number field on a Task or any non-Sprint unit -> RED.
- [ ] **(single-source)** model.name = bare title only; no 'Sprint <n>' / 'Task <n>.<m>' prefix ever stored. GATES: model.name matching /Sprint\s*\d+/ -> RED (the 'Sprint 33 — Sprint 33 —' double-prefix source); model.name matching /Task\s*\d+\.\d+/ -> RED (task-title embedded number).
- [ ] **(display)** ONE formatter family produces EXACTLY 'Sprint <n>: <title>' and 'Task <n>.<m>: <title>' (colon per Tron) on EVERY surface, derived at render. GATE (extend check-sprint-label.ts): any surface building a sprint/task DISPLAY string outside sprintDisplayName|taskDisplayName -> RED.
- [ ] **(display)** Item-view dup fix (rb-object-item.ts:188,197-198): name slot = the formatter; secondary slot = description ONLY or nothing — DROP the `|| getAttribute('title')` fallback that repeats the name. GATE: an item row whose oi-desc text == its oi-name text -> RED (duplicate-line detector, any type).
- [ ] **(gate)** dir<->attribute consistency: for every Sprint unit, the sprint-<n> directory number == model.number -> RED on mismatch. The directory is a CHECK, not a source of truth.
- [ ] **(migration)** The migration (sprint + task family) is a DELIBERATE change, so acceptance is NOT INV-T byte-diff==0 but: (a) REVERSIBILITY — backup taken, zero-restore proven; (b) CONTENT-CONSERVATION — the stripped bare title is a substring of the original, the formatter recomposes to original-minus-prefix, NO title text lost. Scratch dry-run FIRST + per-unit before/after + AMBIGUOUS list; unresolvable numbers REPORTED never invented (number from the sprint-<n> dir is the authoritative input).
- [ ] **(migration)** PHASED (PO ruling — the task family is ~hundreds of units x ~37 sprints): build the family ONCE (formatter+attribute+gates), then migrate in PHASES S37 FIRST (Tron's screenshot sprint) then sprint-by-sprint. Gates are REPORT-ONLY until the migration completes then STRICT (R37.3 dual-flip — an unsatisfiable red-from-birth gate is how gates get silently removed). ★ SELF-DRAINING + VISIBLE: each ci run the report-only gate EMITS the remaining count ('N sprints / M task units still carry an embedded number in title/slug/sprintName') — no-silent-caps — and AUTO-FLIPS to strict when the count hits 0 (the counter IS the trigger). ★ RECORDED DEBT (not a silent defer — the R40.4-deferral-IS-the-doubling lesson applied to itself): RESIDUAL RISK = until phase-N the not-yet-migrated sprints' tasks still hold embedded numbers as un-derived data (the DISPLAYED number is authoritative via the formatter; the stale copies persist); REVISIT TRIGGER = the remaining-count gate, visible every ci run, strict-flip at 0.
- [ ] **(device)** @390 mobile (Tron's device): the item name renders EXACTLY 'Sprint <n>: <title>' / 'Task <n>.<m>: <title>', legible, NOT truncated mid-number, with NO doubled subtitle (defect #2). Pixel-gated, Tron-visible.
- [ ] **(dry-no-double-prefix)** NO double-prefix in pin/slot rows (DRY one-word-one-owner, R40.18 pin view): the ROLE word ('Current'/'Next'/'Last Completed') is the pin SLOT-LABEL's ALONE; the ENTITY word ('Task <n>.<m>:') is the taskDisplayName FORMATTER's ALONE. The formatter NEVER emits 'Current'/'Next'; the slot-label NEVER emits 'Task'. GATES: taskDisplayName output containing a role-word -> RED; a slot-label containing 'Task' -> RED. Reuses the ONE taskDisplayName (no separate pin formatter). crossRef R40.18.

## Subtasks
