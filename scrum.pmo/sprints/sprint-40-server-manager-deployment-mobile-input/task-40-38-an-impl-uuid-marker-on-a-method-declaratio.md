<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.38: An [impl:uuid] marker on a method declaratio

[task:uuid:cc6eadc6-9e53-4054-841c-f031948f7441]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.38 (An [impl:uuid] marker on a method declaratio). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.38; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(report-only)** The lint scans every [impl:uuid] method-marker in src/, resolves caller-or-supersede, and prints offenders (count + each named: file:line + method + impl-uuid) LOUD, exit 0 in report-only mode. Never blocks in phase 1.
- [ ] **(named-debt)** The current offender set is enumerated as NAMED DEBT — the baseline to drive to 0 (never a silent count; false-low-worse-than-absent).
- [ ] **(flip)** When offenders == 0, the lint flips to STRICT (fails ci:gates). A born-RED strict gate is FORBIDDEN — report-only until the offender count reaches 0; the flip is the acceptance event (precedent: check:sprint-md / consistency:strict / ownerIor gate — report-only until debt==0, then strict-by-construction). The flip condition is this explicit AC.
- [ ] **(functional)** A method whose Method/Impl unit carries a supersededBy record is NOT an offender (honorSupersededBy, R30.11) — SUPERSEDED-honest is not orphan. (Directly the actionsForContext a1a5be99 case: superseded-with-record, keeps its own Tests, not flagged.)
- [ ] **(gate)** STUB-MUST-FAIL ON THE CHECK: feed a synthetic marked-uncalled-unsuperseded method -> the lint FLAGS it (report, or fail in strict); feed a marked-called OR marked-superseded method -> NOT flagged. The check is PROVEN able to catch the class (a lint that can't go RED on a real orphan certifies nothing = prove-the-prover).

## Subtasks
