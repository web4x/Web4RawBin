<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.18: Pin auto-progress on QA-Review — pin advances BY DERIVATION (explicit-wins-over-auto, lastCompleted-follows-DONE-not-QA), the shipped auto half of the pin mechanism

[task:uuid:46964040-9dbb-4454-94d0-6eafa1f64be7]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.18 `[requirement:uuid:ce2734ea-2590-4491-a9a3-3be22629cacb]`
  - down
    - [UC](./planning.md) `[uc:uuid:4715978d-8210-4441-9af0-0f7b5edc46f6]`

## Task Description

Switching a task to QA-Review AUTO-PROGRESSES the pin: the QA'd task leaves CURRENT, NEXT becomes CURRENT, a new NEXT is selected by SPRINT-COMPLETION ORDER. Precedence single-sourced in resolveSprintPin: EXPLICIT (R40.17 assigned) WINS over auto/derived — never clobbers Tron's manual choice, never a 2nd source. lastCompleted follows DONE (R40.10 approve), NOT QA (QA is not completion = no false Done). Idempotent, fail-loud (UNRESOLVED not silent-pick), 3-slot uniqueness reused, @390 visible without manual refresh. R40.17 = manual steering; R40.18 = auto so the pin moves BY ITSELF. Reuse R-C5 status derivation + R40.10 QA/approve + R40.17 action units + the existing resolver.

## Context

Covers R40.18 (ce2734ea) via UC 4715978d (pin.autoProgressOnQa) -> core Impl e9eb79e0 (slotsFrom, the derivation, Test 3f9c1e75) + observer Impl c0cfbbad (stale-steer LOG server.ts:1739, Test 7d4a1f83). Chain-complete-to-Test (32090be44). Completes R40.17 (manual assign) — together = the whole pin mechanism.

## Intention

Make R40.18's SHIPPED auto-progress half a schedulable, QA-Review-able deliverable (credited via the chain but had NO covering task = invisible + could not reach Tron's device bucket; mirror of the T40.17 live-pin reverse-credit-debt). req measure-finding 2026-08-12.

## Acceptance Criteria

- [x] TRIGGER: a task switching to QA-Review AUTO-PROGRESSES the pin — the QA'd task leaves CURRENT, NEXT becomes CURRENT, a new NEXT is selected by SPRINT-COMPLETION ORDER (BITE-2, Test 3f9c1e75).
- [x] EXPLICIT (R40.17 assigned) WINS over AUTO — single-sourced in resolveSprintPin (explicit-if-set ELSE auto/derived), never clobbers Tron's choice, never a 2nd source in a view/hook (BITE-3).
- [x] lastCompleted follows DONE (R40.10 approve), NOT QA — QA is NOT completion, so no false Done on the QA transition (BITE-4; consistent with the false-Done doctrine).
- [x] IDEMPOTENT: re-entering QA / a re-run does NOT double-rotate the slots (BITE-1).
- [x] FAIL-LOUD: an ambiguous next-by-sprint-completion reports UNRESOLVED, never silent-picks (BITE-6).
- [x] 3-SLOT UNIQUENESS preserved (current/next/lastCompleted distinct) — reuses the pin's existing enforcement.
- [ ] AC-7-DEVICE [device-only @390 pixel, Tron on phone, un-mockable, NEVER headless-green]: after a QA-Review switch the 3 pin slots visibly ROTATE on the @390 board WITHOUT a manual refresh, or the board states why not (R40.18 BITE-7, Tron device row — turns the device bucket 17->18).

## Implementation

SHIPPED (v0.8.95) + chain-complete-to-Test (32090be44). Impls e9eb79e0 (slotsFrom derivation) + c0cfbbad (stale-steer LOG) BOTH markerPending=false; Tests 3f9c1e75 (pass, covers BITEs 1-idempotent/2-QA-advances/3-explicit-wins/4-lastCompleted/5-enum-not-symbol/6-fail-loud/7) + 7d4a1f83 (pass, BITE-6b observable-stale-steer) two-keyed both-dir. Planner VERIFIED both-dir on disk + verify-owner-first PASSED (both Tests are R40.18's OWN, no borrowed credit; e9eb79e0.tests[]=[3f9c1e75]<->impls, c0cfbbad.tests[]=[7d4a1f83]<->impls) -> FLIPPED to QA-Review 2026-08-12. AC-7-DEVICE @390 = Tron (turns device bucket 17->18). 0 Done till Tron verdict (R40.10).

## Subtasks

None (atomic task).
