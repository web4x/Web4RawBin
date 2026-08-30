<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.30: File/WebItem detail render CONVERGENCE onto the fail-loud primitive (RbDetailBase) — cross-page; retires the RoomView preview fork (recurrence-root cure)

[task:uuid:6541850f-ce0f-47d9-ae27-6ccf2862122e]

## Status
- [x] Planned
- [x] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP In-Progress (PO-scoped 2026-08-30, #126) on req's R37.26 b910550a. Expert HOLDING its code edit until this task exists; NO sub-step committed yet (honest floor — refinement earns [x] when the convergence design/measurement commits). Markers reuse/retire per expert: 852101d1 openFilePreview (retire PhaseB) · d932447e RbFileDetail (migrate) · 2598da09+accc6a00 RbWebItemDetail (migrate). Minted SERVED tree for Tron visibility; req R37.26 b910550a + UC 65a81dff-c68f-4b9f-ba25-d24b91c910ae (resolved from R37.26.useCases[] on origin/main, real full-uuid not fabricated) are on origin/main -> flagged expert to carry them to served so the chain resolves.

## Task Description

The BROADER root behind BUG18: THREE parallel detail-render paths exist, two BYPASS the r4011 fail-loud primitive. (1) RoomView.openFilePreview (852101d1) hand-paints + fails SILENT in-room. (2) ★ RbFileDetail (d932447e) + RbWebItemDetail (2598da09/accc6a00) extend HTMLElement, NOT RbDetailBase — so they bypass the fail-loud guard on the TRACE PAGE too (Tron's main surface), not only in-room. (3) RbDetailBase + its 8 subclasses = the correct path. REPRO: a File/WebItem detail with bad/missing data (e.g. a name=uuid unit) renders RAW/silent instead of failing loud, on /trace AND in-room. CONVERGE all detail renders onto the ONE fail-loud primitive so a shared drawer/preview fix reaches every surface by construction. Reuse RbDetailBase + renderDetailForRef, NO fork.

## Context

Covers R37.26 b910550a (detailRender.convergeOnFailLoudBase, UC 65a81dff). Adjacent (crossRef, none own it — req structural ruling): r4011/R40.11 deploymentRef-fail-loud · R37.12 RbDetailBase idempotent-render (distinct property) · R40.69 File-DATA · R40.12 File-preview. Invariant shape (one primitive, every detail extends it, HTMLElement-bypass=RED) = the R37.11/R37.12 by-construction family = S37. Directly cures the e4dafc536 recurrence-root backlog entry.

## Intention

ONE fail-loud detail primitive that EVERY render extends — an HTMLElement-not-RbDetailBase detail is impossible-by-construction. Retiring the RoomView fork means shared drawer/preview fixes finally reach in-room (kills the recurrence root e4dafc536).

## Acceptance Criteria

- [ ] EXTEND-PRIMITIVE: RbFileDetail + RbWebItemDetail extend RbDetailBase (not HTMLElement) — every detail render extends the ONE fail-loud primitive; an HTMLElement-based detail render cannot exist.
- [ ] FAIL-LOUD-NOT-SILENT: a File/WebItem detail with bad/missing data FAILS LOUD (not raw-JSON / uuid-name / silent) on BOTH /trace and in-room.
- [ ] ROOM DELEGATES: RoomView renders file/webitem preview via renderDetailForRef through the shared flow; the openFilePreview (852101d1) hand-paint fork is RETIRED — shared drawer/preview fixes reach in-room by construction (cures recurrence-root e4dafc536).
- [ ] ★ GATE-FIRST (PO HARD condition): a /trace File + WebItem detail-render coverage gate EXISTS and is GREEN BEFORE Phase A migration lands — no refactor of Tron's main surface against an ungated path. (BUG18 @390 covers the room; /trace needs the equivalent FIRST.)
- [ ] PHASED: Phase A = migrate the 2 stragglers (RbFileDetail, RbWebItemDetail) onto the primitive CROSS-PAGE FIRST; Phase B = RoomView delegates via renderDetailForRef.
- [ ] STUB-MUST-FAIL: the fail-loud is proven NON-VACUOUS — a stub rendering bad data silently -> RED (bite), for File and WebItem, on /trace and in-room.
- [ ] @390 REGRESSION GATE: real-WebKit @390 asserts File + WebItem detail render through the primitive (positive-control pairing: bad-data unit + clean unit); wired into ci:gates = BUG18-class permanent close.

## Subtasks

None (atomic task).
