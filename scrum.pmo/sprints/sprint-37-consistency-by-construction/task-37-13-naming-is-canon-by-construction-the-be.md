<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.13: Naming is canon by construction — the be

[task:uuid:ff834c77-19dd-439d-8cf5-a65ec7873ece]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

In-Progress staged from disk evidence (S37 R37.13-19 backfill, planner 2026-08-29): chain has a SHIPPED Impl (StepEvidence implementing) but NO two-keyed passing Test yet -> In-Progress, NOT QA-Review. ⚠ GATE-BLIND CAVEAT (same axis as R40.55): impl-shipped/no-Test-unit MAY be gate-satisfied (a lint/gate my Test-walk cannot see); if so the TESTER 3-link verdict (cite+green-on-HEAD+asserts-THIS-AC) bumps it to QA-Review — I do NOT self-credit a gate. Dup-check STRUCTURAL: 0 shadows.

## Task Description

Deliver + verify requirement R37.13 (Naming is canon by construction — the be). Retroactive task unit minted scenario-first from the existing CURRENT-sprint requirement (#126 gap: active S37 work untracked). Covers R37.13; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** The guard checks BOTH forms: a TASK's identity in model.name (/^Task C\d/) + model.slug (/^task-c\d/) AND a REQUIREMENT's model.altId (/^R-C\d/). An altId-only check passes every task regardless of name (half-blind) and is REJECTED — both surfaces asserted.
- [ ] **(functional)** The killed bespoke scheme is asserted ABSENT: a Task name /^Task C\d/ OR slug /^task-c\d/, or a Req altId /^R-C\d/ -> the guard exits non-zero LISTING each offender (ior + uuid + surface + value).
- [ ] **(gate)** A WEAKENED guard goes RED (tester meta-bite): weaken/remove the check so a planted 'Task C9' / 'task-c9-' / 'R-C9' would pass -> the bite suite turns RED. The guard PROVES itself, not merely asserts (a by-construction claim is false if only asserted).
- [ ] **(functional)** Folded into ci:gates (RED on any bespoke id) so naming cannot drift back through CI — the consistency-by-construction sprint must not itself be inconsistent.
- [ ] **(functional)** Read-only over the scenario index; violations sorted by uuid; exit 1 iff any (deterministic, no false-low).
- [ ] **(functional)** The guard ALSO scans generator SOURCE (src/ + scripts/*.ts) for a hardcoded bespoke literal (R-C<n> / task-c<n> / Task C<n>): a generator ASSERTING the dead scheme -> RED (findSchemeLiteralsInSource). EXCLUDES the INV-C<n> invariant namespace (different namespace), comment-only lines, and the guard file itself. Closes the source-surface blind side (units-scan structurally could not catch a hardcoded literal — where the overview board-drift defect lived).
- [ ] **(gate)** TEST EXERCISES AC-bespoke-absent + AC-both-surfaces + AC-meta-bite (distinct-intent): plant a 'Task C9' name / 'task-c9-' slug / 'R-C9' altId -> guard RED naming each surface; remove all -> GREEN; weaken the guard -> suite RED. Verify Impl.tests[] on disk before flip.

## Subtasks
