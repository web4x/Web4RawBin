<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T21.3: Phone alt-UUID index (ln symlink)

[task:uuid:1bae9710-c00a-4f04-a3de-0b0a98b85d16]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect — req+architecture.md)
  - [x] AC + test scenarios (in requirement unit)
  - [x] implementing (expert — shipped)
  - [x] architect PDCA Check
  - [ ] testing (tester DET gate)
- [x] QA Review
- [ ] Done

## Traceability

- up
  - requirement:uuid:144d1332-e3c8-4e37-a1ca-93904801b5c6 (R-unit, architect-refined AC/TS)
  - Sprint 21 Planning
- chain
  - use case: uc:uuid:97015dcc-de18-4625-9025-f41a49682309
- context
  - Sprint 21 shipped without scenario-first planning (no planner on WODA.prod); tasks backfilled by architect per PO directive 2026-06-29.

## Task Description

Normalize phone to +<digits> and register alt/phone/<key>.scenario.json as a symlink on the PROFILE unit unitLinks[] pointing to the profile (alternate UUID). resolveToProfile follows the symlink -> profile uuid. PhoneIndex.registerSymlink/normalizePhone.

## Acceptance Criteria

See requirement unit 144d1332-e3c8-4e37-a1ca-93904801b5c6 (architect-refined AC + gateable test scenarios).

## Dependencies

- Requires: Sprint 21 requirement + UC/Class/Method chain seeds
- Enables: tester DET gate

## Definition of Done

- [ ] All req ACs met; chain resolves Req->UC->Class->Method->Impl->Test
- [ ] Tester DET gate PASS
- [ ] Tron QA approved

## QA Audit & User Feedback

Shipped: v0.6.69 f420c79de. Architect PDCA: PDCA: normalizePhone +CountryCode gap flagged -> expert routed (00->+, national reject).

## Subtasks

None (atomic task).
