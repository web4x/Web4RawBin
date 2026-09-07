<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.4: Sprint labels show the sprint NUMBER (display-composed 'Sprint N — theme' from model.number + name, single-source)

[task:uuid:ae0548ae-d4be-4349-b505-e1d0d0fb88ed]

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

Planned - S40 R40.4 (sprint labels show the number, display-composed single-source). Just minted (req b0229eb17); coveredRequirements + useCases (d6cb7ddd) wired. QA-Review: R40.4 CHAIN-COMPLETE-TO-TEST (req 72be83fda, planner disk-verified) — Impl e7fb7e65 SprintLabel.sprintLabel (markerPending=false, STRICT-AST verified heads sprint-label.ts:19, single-source sprintPrefix atom, AC2 grep-no-2nd-site) + Test d7e4b9a1 (SINGLE-SOURCE INVARIANT, status=pass) wired both-dir + r404-sprint-label-single-source-gate GREEN DET-3x. All 4 In-Progress sub-steps done (refinement=architect 033fb688b / test-cases=d7e4b9a1 / implementing=e7fb7e65 / testing=r404 GREEN). ★ AWAITING TRON for Done (NOT Done w/o Tron per tron-qa-batch). FIRST S40 req closed-to-Test. Chain: UC sprintView.renderLabel d6cb7ddd -> Method sprintLabel -> Impl e7fb7e65 -> Test d7e4b9a1.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.4 `[requirement:uuid:9a8cbffe-3e5c-4d4c-82a7-583d64dbd1fb]`
  - down
    - None (atomic task)

## Task Description

R40.4 (Tron: 'why is it not named sprint 40'). Every sprint surface displays the sprint NUMBER with its theme ('Sprint N — theme'), composed AT THE DISPLAY LAYER by ONE shared helper (sprintLabel(unit) => 'Sprint {number} — {name}') from the already-first-class model.number + model.name. The number is NOT written into the name field (that would be a second source of truth + drift on rename/renumber). Fixes ALL sprints (labels currently render theme-only, unidentifiable/unsortable) with NO data migration. Reuse the existing generator requirements.md header pattern (already composes the label) — extend the SAME one helper to the tree row + detail header. NO fork. Scenario-first: req minted R40.4 (9a8cbffe) + ACs; architect designs the one-helper placement; expert implements; tester gates @390 (+ grep-proof single composition site).

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

None (atomic task).
