<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T202: Class.method-per-UC narrowing — shared Class picks wrong method

[task:uuid:8a303a65-d8c1-4aa3-885e-e10e5c3f00ca]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Task Description

Sibling/follow-on to T187 R18.13 (chain narrowing). When two UseCases share a Class, the /trace tree expander uses the global Class.methods[] fan-out and picks the wrong method for the active UC. Fix: /api/trace/children passes UC chainMethod context so the expander uses UC.method not global Class.method.

## Acceptance Criteria

- [ ] AC1: When the same Class is shared by ≥2 UseCases, expanding its node in /trace tree shows ONLY the method tied to the active UC.chainMethod (not all Class.methods[]).
- [ ] AC2: /api/trace/children accepts/uses a UC chainMethod context parameter (or equivalent) so the expander resolves per-UC, not per-Class.
- [ ] AC3: Tester reproduces the original defect (two UCs share a Class, current behaviour shows wrong method) and verifies the fix on real S18 chain data.
- [ ] AC4: No regression in single-UC Class cases (T187 chain narrowing baseline preserved).
- [ ] AC5: trace:audit:strict still passes per learning #27.
- [ ] AC6: Rule-pair (a) package.json + (b) sw.js bump if /api/trace/children is route/bundle surface.

## Subtasks
