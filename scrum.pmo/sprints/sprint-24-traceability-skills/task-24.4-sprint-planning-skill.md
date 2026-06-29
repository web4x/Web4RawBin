<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 24.4: Sprint planning skill (scenario→MD ViewGenerator)

[task:uuid:1c0181ab-5aff-499f-aeff-53c839c1ad87]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 24 Planning](./planning.md)
    - Requirement R24.4 `[requirement:uuid:9dd36e28-c666-40b8-bc1b-117aac0a7d8a]`
  - down
    - [UC-SK.4: skill.sprint-planning-skill](./planning.md#uc-sk4) `[uc:uuid:4a606188-2812-42ef-9e13-f44e652ab4b0]`

## Task Description

Sprint planning markdown is a GENERATED VIEW of the scenario units (law #100, markdown=VIEW): generate-sprint-md.ts builds planning.md and per-task MD files FROM the Sprint/Task/Requirement scenario units, supports --list and --all, and a round-trip --check that asserts the on-disk MD is a byte-match of the regenerated view (drift = fail).

## Context

Impl base (formalize, do not rewrite): scripts/generate-sprint-md.ts (generateTaskMd/generatePlanningMd/buildSprintOutput/generateSprint/checkSprint) + npm check:sprint-md. PLANNER NOTE (measured, the tool I run every cycle): only files starting with the GENERATED_HEADER are checked (hand-authored requirements.md is ignored); --check also reports an 'extra' stale file when a Task slug rename leaves an orphaned generated MD on disk; determinism = sort by uuid/slug, LF only, single trailing newline, no timestamps; emoji in a Task's statusChecklist breaks the audit parser (keep Status pure).

## Intention

PO 2026-06-29: formalize the scattered traceability + MD-planning TS tools as a coherent OOSH-like Object.verb SKILL set — R24.4 is sprint planning (the ViewGenerator that dogfoods law #100).

## Acceptance Criteria

- [ ] (generate) generate-sprint-md builds planning.md + per-task MD files from the Sprint/Task scenario units (markdown is a view, never hand-authored source)
- [ ] (list-all) --list enumerates sprints; --all (re)generates every sprint's MD
- [ ] (roundtrip) --check (check:sprint-md) asserts on-disk MD is a byte-match of the regenerated view; any drift fails
- [ ] (task-files) Task MD files are created from Task units with their coveredRequirements + chain, speaking-name slugs
- [ ] (law100) Scenario units are the source of truth; MD is derived (law #100)
- [ ] (drift-scope) --check (check:sprint-md) drift detection also catches EXTRA/orphan stale MD files (e.g. left by a slug rename), scoped to the GENERATED_HEADER region - not just content byte-diff of expected files

## Implementation

Impl on existing generate-sprint-md.ts ([test:uuid:9dbf5538]); Test hop wired d33440e1c; chain COMPLETE (32/297). Tested via the tool's INHERENT gate — the round-trip --check (check:sprint-md) which the planner runs every cycle, byte-match GREEN. No separate per-task DET-3x gate commit; flagged to PO.

## Subtasks

None (atomic task).
