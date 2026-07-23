<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5.4: viewport responsive mode: landscape flex all-visible, portrait native scroll-snap scroller, container-query driven

[task:uuid:5dc15076-f6e6-4ff0-87bd-23b9b6924bd8]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Task 31.5 (umbrella)](./task-31.5-concept-scrollable-viewport-woda-layout.md)
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.5.4 `[requirement:uuid:be4e57a6-d685-4484-8901-a17cd99776d9]`
  - down
    - None (atomic build task)

## Task Description

The viewport is a CSS presentation MODE of rb-strip (not a separate element): a CONTAINER-QUERY (@container, orientation media-query fallback) sets rb-strip[data-mode=landscape|portrait]. Landscape = display:flex; overflow:visible (all compartments expanded, bars visible, side-by-side). Portrait = overflow-x:auto; scroll-snap-type:x mandatory — a horizontally-scrollable viewport; COMPARTMENTS are the snap targets (scroll-snap-align:start), BARS ride at a compartment's leading edge (NOT independent snap points). Native CSS scroll-snap, no JS scroll math; the editor snaps ([]|[ / ]|[]|[ / ]|[]) fall out of compartment-align + peek. The active compartment is preserved across landscape<->portrait flip (scrollIntoView on flip). FOUNDATION piece (build order 1).

## Acceptance Criteria

- [ ] data-mode set by CONTAINER-QUERY (@container on the strip container; orientation media-query fallback), NOT a top-level media query — composes when nested. Landscape=display:flex;overflow:visible all-visible; portrait=overflow-x:auto;scroll-snap-type:x mandatory scroller.
- [ ] COMPARTMENTS are the scroll-snap targets (scroll-snap-align:start); BARS are inter-compartment, NOT independent snap points (they ride at a compartment's leading edge). Snaps land on meaningful content; editor []|[ / ]|[]|[ / ]|[] fall out of compartment-align + peek — no bespoke per-snap JS.
- [ ] The ACTIVE compartment (last-snapped/focused, id stored on the strip) is PRESERVED across landscape<->portrait flip: on flip, scrollIntoView the previously-active compartment.
- [ ] POSITIONING!=FUNCTION (cross-cutting, architect design b3f30491f): the SAME component instance in ANY presentation combination {bar|compartment}x{landscape|portrait}x{inline|bottom} passes the SAME functional tests (detail renders, scroll works, expand/minimize, verb-actions fire) — only computed layout/position differs. Any behavior that CHANGES with position/presentation is a DEFECT (the anti-pattern Tron flagged). Tester gates this piece at Tron's real viewport (portrait mobile scroll-snap + landscape side-by-side).
- [ ] AC-INV-PRESENTATION (cross-cutting R31.5.8): positioning != function — presentation is a reactive layer, never a second fork.

## Subtasks

None (atomic build task).
