<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.4: Sprint labels show the sprint NUMBER (display-composed 'Sprint N — theme' from model.number + name, single-source)

[task:uuid:ae0548ae-d4be-4349-b505-e1d0d0fb88ed]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.4 (sprint labels show the number, display-composed single-source). Just minted (req b0229eb17); coveredRequirements + useCases (d6cb7ddd) wired. In Progress: architect one-helper-placement DESIGN committed 033fb688b (sprintLabel(sprint)='Sprint '+sprintNumOf+' — '+name, REUSES R-C1 sprintNumOf, placed in shared sprint module; consumers = generate-sprint-md :101/:145 + tree-row + detail-header, all import it, AC2 grep-no-2nd-site). useCases d6cb7ddd wired (architect supply-at-design confirmed). Chain UC->Class->Method sprintLabel->Impl->Test mints at build-go; req mints/expert builds. ACs mirrored from req R40.4 9a8cbffe.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.4 `[requirement:uuid:9a8cbffe-3e5c-4d4c-82a7-583d64dbd1fb]`
  - down
    - None (atomic task)

## Task Description

R40.4 (Tron: 'why is it not named sprint 40'). Every sprint surface displays the sprint NUMBER with its theme ('Sprint N — theme'), composed AT THE DISPLAY LAYER by ONE shared helper (sprintLabel(unit) => 'Sprint {number} — {name}') from the already-first-class model.number + model.name. The number is NOT written into the name field (that would be a second source of truth + drift on rename/renumber). Fixes ALL sprints (labels currently render theme-only, unidentifiable/unsortable) with NO data migration. Reuse the existing generator requirements.md header pattern (already composes the label) — extend the SAME one helper to the tree row + detail header. NO fork. Scenario-first: req minted R40.4 (9a8cbffe) + ACs; architect designs the one-helper placement; expert implements; tester gates @390 (+ grep-proof single composition site).

## Acceptance Criteria

- [ ] (display) Every sprint surface shows 'Sprint N — theme': the tree row, the detail header, AND every generated MD view (the generator requirements.md header already does this — extend the SAME to tree + detail).
- [ ] (single-source) The label is composed by ONE shared helper (sprintLabel(unit) => 'Sprint {number} — {name}') — a grep PROVES there is no second composition site.
- [ ] (coverage) Works for ALL existing sprints with NO data migration — S35/S36/S37 (and every other) are fixed by the same display-layer change, not by editing their units.
- [ ] (single-source) The name field is UNCHANGED (theme-only); the number is NOT duplicated into name. model.number remains the single source of truth for the number.
- [ ] (device) @390 mobile: the label is legible and NOT truncated mid-number in the tree row.

## Subtasks

None (atomic task).
