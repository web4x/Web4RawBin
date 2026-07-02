<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T21.6: Phones as scenario units (seed Tron)

[task:uuid:af9dc6cc-486d-4646-81fb-0e3a0cc262f4]

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
  - requirement:uuid:3bd63ae7-96e9-453a-a19f-fc7e1e00ab1f (R-unit, architect-refined AC/TS)
  - Sprint 21 Planning
- chain
  - use case: uc:uuid:4242f9be-20c4-47c7-8035-d395413d7915
- context
  - Sprint 21 shipped without scenario-first planning (no planner on WODA.prod); tasks backfilled by architect per PO directive 2026-06-29.

## Task Description

PhoneIndex.mintAndLink: mint ior:class:Phone unit { e164:+CountryDigits, ownerIor:profile } -> Profile.phones[] (multiple, idempotent) -> alt/phone symlink. Standardized format enforced at creation. Tron +4915253844085 seeded as first Phone unit on his WODA.prod profile.

## Acceptance Criteria

See requirement unit 3bd63ae7-96e9-453a-a19f-fc7e1e00ab1f (architect-refined AC + gateable test scenarios).

## Dependencies

- Requires: Sprint 21 requirement + UC/Class/Method chain seeds
- Enables: tester DET gate

## Definition of Done

- [ ] All req ACs met; chain resolves Req->UC->Class->Method->Impl->Test
- [ ] Tester DET gate PASS
- [ ] Tron QA approved

## QA Audit & User Feedback

Shipped: v0.6.69 f420c79de (seed done). Architect PDCA: PDCA: normalizePhone country-code gap -> expert fix pending.

## Subtasks

None (atomic task).
