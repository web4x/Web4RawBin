<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.5: Detail/feature-view EXTRA action buttons de-duplicated onto the shared action bar (editor chrome UNCHANGED)

[task:uuid:a10c3329-9249-423a-9643-17efc7bdced9]

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

Planned - S40 R40.5 (SCOPE-CORRECTED ac147a82d: detail/feature-view EXTRA buttons DE-DUP onto shared bar; ⛔ editor chrome OUT/unchanged, exclusion RECORDED). RE-MIRRORED from rewritten R40.5. coveredRequirements + useCases 1c21d43a wired; ACs MIRRORED with tags (4 AUTOMATABLE + 1 DEVICE/VISUAL @390 Tron). NOTE: slug stays task-40.5-buttons-to-action-units-dry (identifier stable; corrected scope in name/desc/ACs). ★ In Progress refinement [x]: design/build-requirement DELIVERED (architect 9cf7857a2 authoritative-N-before-migration + build-go cb77ce28f: UC rides EXISTING universalActionBar 54acc696/ffd44b17, actionSets at build from grep-inventory; architect confirmed NO open design action, NOT design-gated). BUILD-READY, expert on it (Impl markerPending). ★ SCOPE: editor chrome OUT, IN = duplicated detail/feature-view buttons, POINT = de-dup NOT uniformity; grep-zero-bespoke lint SCOPED to detail/feature (must NOT fire on editor chrome) + stub-must-fail on new bespoke.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.5 `[requirement:uuid:e152177d-d016-45eb-a41f-75ffe3dc9a64]`
  - down
    - None (atomic task)

## Task Description

R40.5 (Tron QA v0.8.70, SCOPE-CORRECTED ac147a82d: 'the editor actions can stay the same regarding ux ... but all in-room detail views have additional buttons shall become actions and feature views/details views have additional action buttons that are extra and not DRY'). The DETAIL-VIEW FAMILY (in-room detail views + feature/detail views) accumulated EXTRA bespoke action buttons that DUPLICATE the same logical actions per view (not DRY). Each such additional button becomes an action UNIT on the ONE shared universalActionBar (R35.1). ★ The point is DE-DUPLICATION (no logical action implemented more than once across detail/feature views), NOT uniformity for its own sake. ⛔ OUT OF SCOPE: the EDITOR CHROME keeps its UX EXACTLY as-is (Code/Open-Diff/Save/Files-Editor-Preview-footer/header-Back — Tron is happy with that UX; do NOT migrate/restyle/relocate it). Reuse R35.1 universalActionBar, NO fork. Scenario-first: req mints R40.5 + ACs; architect designs; expert implements; tester gates. (slug kept stable; scope lives in name/desc/ACs.)

## Acceptance Criteria

- [ ] [AUTOMATABLE, source] A GREP-DRIVEN INVENTORY of the ADDITIONAL action buttons across ALL in-room detail views + feature/detail views is produced at build; the EDITOR CHROME (Code/Open-Diff/Save/Files-Editor-Preview-footer/header-Back) is EXPLICITLY EXCLUDED and that exclusion is RECORDED (not silently dropped).
- [ ] [AUTOMATABLE, source] Each IN-SCOPE (detail/feature-view additional) button becomes an action UNIT rendered by the shared universalActionBar (R35.1 mechanism 54acc696/ffd44b17), NOT bespoke per-view markup.
- [ ] [AUTOMATABLE] Per-surface actionSets declared as DATA (config units), not hardcoded.
- [ ] [AUTOMATABLE, source, stub-must-fail] The invariant: NO logical action is implemented more than once across the detail/feature views (DE-DUPLICATION, not uniformity). A grep-zero-bespoke lint SCOPED to the detail/feature-view surfaces ONLY — it must NOT fire on the editor chrome, and it must FAIL if a NEW bespoke detail-view button appears (plant one -> RED).
- [ ] [DEVICE/VISUAL @390 - Tron] The migrated detail/feature-view bars render @390 unchanged-or-better (pixel; Tron final visual, esp. any owner-gated surface a non-owner cannot load).

## Subtasks

None (atomic task).
