<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5.7: drawer = Details compartment: data-position inline|bottom branches ONLY layout CSS, function fully shared

[task:uuid:1ca14378-4800-4150-a2e0-f3ae4c5910ad]

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
    - [Task 31.5 (umbrella)](./task-31.5-concept-scrollable-viewport-woda-layout.md)
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.5.7 `[requirement:uuid:8243b2fc-e26a-457c-86e1-175eebf60715]`
  - down
    - None (atomic build task)

## Task Description

THE CRUX (build EARLY, right after the strip foundation — lowest-risk highest-value; rides the in-flight R31.4 DRY drawer fix = step 0). Generalize rb-detail-drawer: a data-position attr branches ONLY layout CSS — landscape = INLINE as the [D] strip segment (position:static, in-flow, sized by the strip); portrait = BOTTOM drawer (position:fixed; bottom:0) exactly as today. HARD invariant: the detail-render flow, content, scroll, grab-bar, expand/minimize, in-room R30.20 X->chat are ALL SHARED, untouched by position. There is NO 'full-width drawer' second component (that fork = the regression Tron flagged). Depends on 5.1-5.4; crossRef R31.4.

## Acceptance Criteria

- [ ] rb-detail-drawer gains a data-position=inline|bottom attr that branches ONLY layout CSS: landscape=inline [D] strip segment (position:static, in-flow); portrait=bottom drawer (position:fixed;bottom:0, as today). Same instance, position is a presentation mode.
- [ ] HARD invariant: the detail-render flow / scroll / grab-bar / expand-minimize / in-room R30.20 X->chat are ALL SHARED and UNTOUCHED by position (data-position branches ONLY layout CSS). There is NO second 'full-width drawer' component — that fork is the regression Tron flagged. Continues the in-flight R31.4 DRY drawer fix (terminal via the shared detail flow) = step 0, generalized to position.
- [ ] POSITIONING!=FUNCTION (cross-cutting, architect design b3f30491f): the SAME component instance in ANY presentation combination {bar|compartment}x{landscape|portrait}x{inline|bottom} passes the SAME functional tests (detail renders, scroll works, expand/minimize, verb-actions fire) — only computed layout/position differs. Any behavior that CHANGES with position/presentation is a DEFECT (the anti-pattern Tron flagged). Tester gates this piece at Tron's real viewport (portrait mobile scroll-snap + landscape side-by-side).
- [ ] AC-INV-PRESENTATION (cross-cutting R31.5.8): positioning != function — presentation is a reactive layer, never a second fork.

## Subtasks

None (atomic build task).
