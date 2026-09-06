<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T21.4: Device-link on known phone/email

[task:uuid:e83dc244-9a34-400d-9c71-7aba890632bb]

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
  - requirement:uuid:04dff687-ae49-4d9c-9150-6e2419a1c0b9 (R-unit, architect-refined AC/TS)
  - Sprint 21 Planning
- chain
  - use case: uc:uuid:ff91e891-57b8-4d82-b3d5-fa45219b9db1
- context
  - Sprint 21 shipped without scenario-first planning (no planner on WODA.prod); tasks backfilled by architect per PO directive 2026-06-29.

## Task Description

On IDENTIFY with a phone/email already in the alt-index, resolveKeyToProfile returns the existing profile; server sends KNOWN_KEY_CHALLENGE and (on correct secret code) attaches a NEW device to the existing profile via the existing DEVICE_ENROLL path — never mints a new user. Identical for phone and email.

## Acceptance Criteria

See requirement unit 04dff687-ae49-4d9c-9150-6e2419a1c0b9 (architect-refined AC + gateable test scenarios).

## Dependencies

- Requires: Sprint 21 requirement + UC/Class/Method chain seeds
- Enables: tester DET gate

## Definition of Done

- [ ] All req ACs met; chain resolves Req->UC->Class->Method->Impl->Test
- [ ] Tester DET gate PASS
- [ ] Tron QA approved

## QA Audit & User Feedback

Shipped: v0.6.68 (email) + f420c79de (phone). Architect PDCA: PDCA R21.5: server wiring verified server.ts:1928-31.

## Subtasks

None (atomic task).
