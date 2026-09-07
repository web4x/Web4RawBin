<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.28: Deploy commits atomically - served == committed == HEAD (no phantom-version window)

[task:uuid:483dcce4-eb2e-4327-aed2-a751b6bf21a0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:06ac71d5-5308-44ea-9720-ec5c01921915]`
  - down
    - [UC](./planning.md) `[uc:uuid:fd00cbc6-4f0f-4ef1-aebc-17e75d7a178b]`
    - [UC](./planning.md) `[uc:uuid:9eff5d30-4c78-4334-8c05-cc465ba957b4]`

## Task Description

Deploy commits atomically - served == committed == HEAD (no phantom-version window) (retroactive #126 backfill).

## Context

BACKFILL (2026-07-17 gap audit): DONE #126 backfill, CORRECT-BY-CONSTRUCTION (PO ruling). Closure path = INVARIANT/CI CHECK (served==committed==HEAD guard, the phantom-version-window eliminator), NOT a functional Test unit. Built 548856f76 by-construction sole-minter. Class b6946e59. The guard trips on a deliberate version mismatch = the gate. This directly serves the served==gated lesson (eliminates the ungateable phantom window).

## Intention

S30 #126 gap-closure backfill (PO-approved gap audit).

## Acceptance Criteria

- [ ] **(atomic)** The deploy commits the version-bump + built dist BEFORE (or atomically with) serving the new bundle - it never serves an uncommitted build.
- [ ] **(invariant)** served == committed == HEAD at all times: the version the server serves equals the committed dist equals HEAD package.json version. No phantom window (served != committed).
- [ ] **(guard)** A guard FAILS the deploy/startup if the running prod version != HEAD package.json version - a serve-before-commit is caught, not silent.
- [ ] **(invariant)** The phantom-version window (served != committed, ungateable) is eliminated: every served bundle is reproducible from a commit.
- [ ] **(by-construction)** Atomicity is structural (commit-then-serve ordering + the guard), not a manual step - a new deploy path cannot skip it.
- [ ] **(verify)** A deploy leaves served==committed==HEAD; the guard trips on a deliberate version mismatch (gate the guard). Companion to R30.14 (client side).

## Implementation

DONE #126 backfill, CORRECT-BY-CONSTRUCTION (PO ruling). Closure path = INVARIANT/CI CHECK (served==committed==HEAD guard, the phantom-version-window eliminator), NOT a functional Test unit. Built 548856f76 by-construction sole-minter. Class b6946e59. The guard trips on a deliberate version mismatch = the gate. This directly serves the served==gated lesson (eliminates the ungateable phantom window).

## Subtasks

None (atomic task).
