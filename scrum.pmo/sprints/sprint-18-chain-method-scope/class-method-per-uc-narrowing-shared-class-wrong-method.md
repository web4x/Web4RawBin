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

## Subtasks
