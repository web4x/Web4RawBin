<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 22.4: PNG files clickable + open in preview (same as SVG)

[task:uuid:dd0c576d-219a-458c-8092-cdb151c5d422]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

RESOLVED. Tester DET-3x found PNG preview links RED (404) on v0.6.78 (adddd7ae5); expert fixed 404→200 in v0.6.79 (4e3c3df0d); tester re-gated GREEN DET-3x on v0.6.79 (9/9: 3 runs x 3 iters, PNG link HTTP 200 image/png, 124 clickable img anchors) and committed the VERDICT in 4d6474790 (test/visual/r224-clickable-png-gate.mjs). Testing hop CLEARED → QA Review (Tron gate).

## Traceability

  - up
    - [Sprint 22 Planning](./planning.md)
    - Requirement R22.4 `[requirement:uuid:c13ee707-0099-45ef-9d4d-f5541d21b2bd]`
  - down
    - [UC-VF.4: mdBrowser.pngOpensPreview](./planning.md#uc-vf4) `[uc:uuid:3ab76d13-2ef6-4ca2-b597-7692cb2a30f6]`

## Task Description

In the /md/ file browser, PNG files MUST be clickable and open in the same preview/viewer that SVG files currently open in — the PNGs are not clickable today.

## Context

/md/ file browser listing. SVG entries are clickable and open a preview; PNG entries were inert.

## Intention

Tron: "in the /md/ file browser, PNG files should be clickable and open in a preview — same behavior as SVGs currently do." (e.g. /md/test/visual/?highlight=r211-vcard-persist-gate.mjs)

## Acceptance Criteria

- [x] PNG entries in the /md/ file browser render as clickable links (like SVG entries) — impl v0.6.78 (9c052bd9a)
- [x] Clicking a PNG opens it in the SAME preview/viewer that SVG files use — RED (404) v0.6.78 → fix v0.6.79 (404→200) → GREEN
- [x] SVG behaviour is unchanged (no regression)
- [x] Verified live (headless) on the /md/ test/visual listing — tester GREEN DET-3x v0.6.79 (verdict 4d6474790; 9/9, PNG HTTP 200 image/png, 124 clickable anchors)

## Subtasks

None (atomic task).
