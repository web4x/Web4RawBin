<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-rename-champagne-to-traceability: 'Champagne Chain' → 'Traceability Chain' in all user-facing UI

[task:uuid:56cc23b5-aca1-49f5-9037-e2c58110643c]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect — canonicalize UC/Class/Method + PUML)
  - [ ] creating test cases (tester — RED heading-string E2E FIRST)
  - [ ] implementing (expert)
  - [ ] testing (tester — RED→GREEN E2E + screenshot)
- [x] QA Review
- [ ] Done

## Task Description

CR1 (S20, ChangeRequest — dogfoods R20.4): the detail-view section labeled 'Champagne Chain' uses internal measurement jargon in USER-FACING UI. RENAME to 'Traceability Chain' everywhere in the product UI; champagne/marketing terms must NOT appear in the product interface (only internal scoring/audit tools). intendedChain (for architect): UC detailView.renameChainLabel; Class RbDetailDrawer (or per-type DetailView template); Method renderTraceabilitySection (change heading string); Test RED: open any detail-view → assert heading is 'Traceability Chain' (or 'Traceability'), NOT 'Champagne Chain' (currently FAILS in some views). S20 DISCIPLINE: full chain designed + Test FIRST; UI → Playwright+screenshot gate; nothing ships chain-open. RELEASE → v0.6.5 + git tag (strict order: CR1 before BUG1).

## Subtasks
