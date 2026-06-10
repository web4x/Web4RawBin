<!-- GENERATED FROM SCENARIO UNITS - DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-singular-chain-detail: detail view shows singular chain per UC not Class.methods[] fan-out (R18.24 regression)

[task:uuid:f3e0b558-116b-4659-8de7-efa0322451ac]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement architect
  - [ ] creating test cases
  - [ ] implementing expert (in flight per PO)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Detail view must show the singular chain per UseCase (one method per UC) not the full Class.methods[] fan-out. NOTE: this is a regression of R18.24 (detail chain narrowing). Flag in verificationHistory. Covers R19.34.

## verificationHistory

- R18.24 regression: detail chain narrowing (R18.24 originally required singular chain per UC in detail views; regressed when Class.methods[] fan-out was re-introduced). R19.34 re-establishes the singular-chain invariant.

## Subtasks
