<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T21.5: Emails as scenario units + alt-index

[task:uuid:3960168e-45a6-4739-8c54-03a2825713c0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect — req+architecture.md)
  - [x] AC + test scenarios (in requirement unit)
  - [x] implementing (expert — shipped)
  - [x] architect PDCA Check
  - [ ] testing (tester DET gate)
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - requirement:uuid:a8be009e-8d1c-41ae-8f38-96515a72a929 (R-unit, architect-refined AC/TS)
  - Sprint 21 Planning
- chain
  - use case: uc:uuid:c59356f7-d8ea-4e47-9659-efea4ef05c2c
- context
  - Sprint 21 shipped without scenario-first planning (no planner on WODA.prod); tasks backfilled by architect per PO directive 2026-06-29.

## Task Description

EmailIndex.mintAndLink: normalizeEmail (trim+lowercase) -> mint ior:class:Email unit (ownerIor=profile) -> push into Profile.emails[] (multiple, idempotent) -> register alt/email symlink on Profile.unitLinks[]. Known email triggers the R21.4 device-link via shared resolveKeyToProfile.

## Acceptance Criteria

See requirement unit a8be009e-8d1c-41ae-8f38-96515a72a929 (architect-refined AC + gateable test scenarios).

## Dependencies

- Requires: Sprint 21 requirement + UC/Class/Method chain seeds
- Enables: tester DET gate

## Definition of Done

- [ ] All req ACs met; chain resolves Req->UC->Class->Method->Impl->Test
- [ ] Tester DET gate PASS
- [ ] Tron QA approved

## QA Audit & User Feedback

Shipped: v0.6.68 d4aad5081. Architect PDCA: PDCA: PASS/COMPLIANT (17 ACs).

## Subtasks

None (atomic task).
