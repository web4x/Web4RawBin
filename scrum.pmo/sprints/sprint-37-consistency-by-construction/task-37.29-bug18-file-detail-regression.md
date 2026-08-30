<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.29: BUG18 REGRESSION re-fix — clicking a file in a room shows the PARENT collection, not the file's own detail; rewire + @390 regression gate

[task:uuid:802a9597-5665-4d14-84e2-ced70b51f5a5]

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

STOOD UP In-Progress tracking active work (PO #1 priority 2026-08-30): architect+tester diagnosing CODE-vs-DATA now; NO sub-step committed yet (honest floor — refinement earns [x] when the diagnosis commits). LIVE on prod v0.8.145 (works test v0.8.87 = 2-server bisect). Fix + @390 regression gate pending. Minted on the SERVED hotfix tree for Tron visibility (board renders from units); needs to reach main at reconcile.

## Task Description

LIVE REGRESSION (Tron, prod 2026-08-30). BUG18 (949ee3c2, Sprint 20, tronDone 2026-06-15) has REGRESSED A SECOND TIME — because nothing guarded it (no task -> no test -> no regression gate -> silent re-break). REPRO: in a room with Files (e.g. 'Jesus Munich' Files), clicking a FILE opens the PARENT 'Files(N)' collection in the detail drawer (or a raw uuid-named/unit-JSON view) instead of the file's OWN detail. TWO-SERVER BISECT: works on test.wo-da.de v0.8.87, broken on prod.wo-da.de v0.8.145. SURFACE: the in-room file-detail-on-click resolution renders the file ref's PARENT collection rather than the file unit's detail. Architect+tester diagnosing CODE-vs-DATA. This task is the durable home for the re-fix AND the regression gate that keeps it closed. Reuse existing file-detail + browse-file wiring, NO fork.

## Context

Covers Bug BUG18 949ee3c2 (origin Sprint 20, Tron-traced/Tron-done then regressed). UC fdcbb079 file-detail-on-click (reused, not forked). Cross-sprint: bug keeps its S20 origin; the re-fix executes in S37 (realtime-MVC/detail surface, Tron pinned) per the T37.27 precedent.

## Intention

Keep BUG18 closed for good: rewire file-detail-on-click AND ship a @390 regression gate so it can never silently re-break a third time. The TEST is the deliverable that outlives the fix.

## Acceptance Criteria

- [ ] REPRO CLOSED: in a room with Files, clicking a FILE renders that FILE's OWN detail in the drawer @390 — NOT the parent 'Files(N)' collection, NOT a raw uuid-named / unit-JSON view. (Bug's own AC.)
- [ ] SURFACE/REWIRE: the file-detail-on-click resolution is corrected so a file ref resolves to the file unit's detail, not its parent collection (architect confirms exact component + CODE-vs-DATA on diagnosis; fix is a rewire, no fork).
- [ ] NAVIGATION preserved (BUG18 2nd AC): from the file detail, the action NAVIGATES to BROWSE-FILE with the file HIGHLIGHTED, enabling the scenario Monaco editor.
- [ ] ★ REGRESSION GATE @390 (THE keep-it-closed deliverable): a real-WebKit @390 test opens a file in a room and asserts the FILE's own detail renders; planted-defect (parent collection or uuid-name shown) = RED; wired into ci:gates so a third silent re-break is impossible. Tron device @390 confirms.

## Subtasks

None (atomic task).
