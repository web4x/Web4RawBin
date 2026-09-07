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

- [ ] **(by-construction)** Every File/WebItem detail-render component EXTENDS RbDetailBase (the r4011 fail-loud primitive), NEVER HTMLElement directly. A detail component extending HTMLElement (or otherwise not routing through RbDetailBase's fail-loud) => RED. The 2 stragglers RbFileDetail (d932447e) + RbWebItemDetail (2598da09/accc6a00) migrate to extend RbDetailBase.
- [ ] **(fail-loud)** An unresolvable / missing ref in ANY detail render fails LOUD via RbDetailBase (a VISIBLE error), NEVER silent — no hand-paint, no permanent 'Loading...', no parent-collection fallback, no blank box. RoomView.openFilePreview's silent-fail (852101d1) is eliminated: it delegates, not hand-paints.
- [ ] **(DRY)** In-room preview DELEGATES through the shared renderDetailForRef path (same primitive as /trace), NOT a forked hand-paint. This kills the RoomView preview-fork RECURRENCE ROOT (e4dafc536): a shared detail fix now reaches in-room by construction, so BUG18-class defects cannot recur via the fork.
- [ ] **(gate-first)** ★ PO CONDITION: a /trace File/WebItem detail-render COVERAGE GATE must EXIST and PASS *before* PhaseA migration lands. Refactoring Tron's main surface against an UNGATED path = handing him a new regression. The coverage gate is the PRECONDITION for the migration, not a follow-up.
- [ ] **(phased)** PHASED: PhaseA migrates the 2 cross-page stragglers (RbFileDetail/RbWebItemDetail -> extend RbDetailBase) FIRST; PhaseB makes the room delegate via renderDetailForRef. Order matters: converge the shared primitive before re-pointing the room at it.
- [ ] **(gate)** STUB-MUST-FAIL (prove-the-prover): a synthetic detail component extending HTMLElement with an unresolvable ref => the convergence gate FLAGS it (RED); a component extending RbDetailBase with fail-loud => NOT flagged. A gate that cannot go RED on a real bypass certifies nothing.
- [ ] **(verify)** @390 REGRESSION GATE (the deliverable that keeps BUG18-class CLOSED): clicking a FILE or WebItem in a room -> the FILE/WebItem detail renders (correct type-appropriate view), NOT the PARENT collection / uuid-named unit / silent blank; a missing ref shows fail-loud, not a silent wrong-surface. Real @390 device, asserts the RENDERED artifact (Arm-B: not a proxy).

## Subtasks

None (atomic task).
