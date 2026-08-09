<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T: TestCase + Gate as 1st-class scenario units (R20.20 + R20.21)

[task:uuid:54519bc4-2704-4484-a83f-5b88019d62c3]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Task Description

Promote each describe()/it() block to a first-class ior:class:TestCase unit and each verification gate to a first-class ior:class:Gate unit in the index, and fix the related parse, verdict-render-wiring, and [test:uuid] source-marker bugs. Covers R20.20, R20.21, BUG15, BUG16, BUG17.
