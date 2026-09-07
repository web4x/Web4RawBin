<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.30: Behavioural gates target STABLE test hooks (

[task:uuid:6edfda45-5a42-4b53-8e8c-0299eb29abd4]

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

Deliver + verify requirement R40.30 (Behavioural gates target STABLE test hooks (). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.30; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(stable-hooks)** Behavioural gates target STABLE test hooks (data-testid or an equivalent contract), NOT incidental CSS class names — a cosmetic rename cannot break a behavioural gate.
- [ ] **(hook-dependency-discoverable)** Renaming or removing a test hook REQUIRES re-running the gates that depend on it — the dependency is DISCOVERABLE: a gate declares which hooks it binds.
- [ ] **(retarget-stub-must-fail)** A re-targeted gate MUST re-prove it can FAIL (stub-must-fail) before its GREEN counts — otherwise re-pointing a selector until it passes silently empties the gate.
- [ ] **(drift-names-itself)** Drift is DETECTABLE rather than discovered by accident: a gate whose hook has VANISHED says 'hook missing' LOUDLY (distinct signal), not read -1 and report a behavioural failure. The RED must name drift, not masquerade as a code regression.

## Subtasks
