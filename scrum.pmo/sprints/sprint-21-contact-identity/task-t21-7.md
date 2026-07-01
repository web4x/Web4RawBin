<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T21.7: Addresses async OSM-verified

[task:uuid:18845496-084b-451d-b5f3-ad16ac3631c5]

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
  - requirement:uuid:5d3b5e6e-75da-4b66-8d44-75df5f9ceb7f (R-unit, architect-refined AC/TS)
  - Sprint 21 Planning
- chain
  - use case: uc:uuid:fab88cb9-fd28-4271-b3b1-aff9008c3b9a
- context
  - Sprint 21 shipped without scenario-first planning (no planner on WODA.prod); tasks backfilled by architect per PO directive 2026-06-29.

## Task Description

AddressIndex.mintAddress: store ior:class:Address { oneLine "Country City PostalCode Street HouseNumber", verified:false, osmLink:null, gmapsLink:null } synchronously (never blocks); server enqueues a background VerifyJob that hits Nominatim (limit=1, UA, <=1 req/s, cached by oneLine) and on a hit sets verified:true + OSM + Google Maps links.

## Acceptance Criteria

See requirement unit 5d3b5e6e-75da-4b66-8d44-75df5f9ceb7f (architect-refined AC + gateable test scenarios).

## Dependencies

- Requires: Sprint 21 requirement + UC/Class/Method chain seeds
- Enables: tester DET gate

## Definition of Done

- [ ] All req ACs met; chain resolves Req->UC->Class->Method->Impl->Test
- [ ] Tester DET gate PASS
- [ ] Tron QA approved

## QA Audit & User Feedback

Shipped: v0.6.70. Architect PDCA: PDCA: PASS/COMPLIANT (17 ACs); link formats byte-matched.

## Subtasks

None (atomic task).
