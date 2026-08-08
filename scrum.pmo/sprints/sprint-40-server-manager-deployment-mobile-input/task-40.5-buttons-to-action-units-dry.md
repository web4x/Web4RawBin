<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.5: All bespoke buttons -> action UNITS on the shared universalActionBar (DRY everywhere, grep-zero-bespoke)

[task:uuid:a10c3329-9249-423a-9643-17efc7bdced9]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.5 (all bespoke buttons -> action units, DRY, grep-zero-bespoke). Scenario-first: req minted R40.5 e152177d (515f743b8); coveredRequirements + useCases 1c21d43a wired; ACs MIRRORED with automatable/device tags (certScope at AC level, NOT flattened: 3 AUTOMATABLE + 1 DEVICE/VISUAL @390 Tron owner-gated). Architect designs the chain. No build until build-go.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.5 `[requirement:uuid:e152177d-d016-45eb-a41f-75ffe3dc9a64]`
  - down
    - None (atomic task)

## Task Description

R40.5 (Tron QA v0.8.70: 'all these special buttons should be standard actions - DRY everywhere'). Every bespoke button across surfaces (Scenario/Edit/Claude.ai-RC/Code/Open-Diff/Save/Files/Editor/Preview/Refresh/Back-to-Profile) becomes an ACTION UNIT rendered by the ONE shared universalActionBar (extends R35.1 which already migrated 4). Per-surface action sets = DATA not hardcoded; no bespoke button markup remains. Reuse R35.1 universalActionBar, NO fork. Scenario-first: req mints R40.5 + ACs; architect designs; expert implements; tester gates.

## Acceptance Criteria

- [ ] [AUTOMATABLE, source] Every listed button (Scenario/Edit/Claude.ai-RC/Code/Open-Diff/Save/Files/Editor/Preview/Refresh/Back-to-Profile) is an action UNIT rendered by the shared universalActionBar (R35.1 mechanism 54acc696), NOT bespoke markup.
- [ ] [AUTOMATABLE, source, stub-must-fail] A grep PROVES ZERO bespoke button markup remains on those surfaces (R40.4 single-source enforcement shape) — plant a bespoke button -> gate RED.
- [ ] [AUTOMATABLE] Per-surface action sets are declared as DATA (config units), not hardcoded — the set is read, not literal.
- [ ] [DEVICE/VISUAL @390 - Tron] The migrated bars render @390 unchanged-or-better (pixel; Tron final visual on the owner-gated surfaces where a non-owner cannot load).

## Subtasks

None (atomic task).
