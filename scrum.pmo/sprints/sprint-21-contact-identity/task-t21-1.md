<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T21.1: vCard drop stores .vcf beside avatar

[task:uuid:0c1b375e-6a2a-4b35-bb64-b43adce88697]

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
  - requirement:uuid:efd1acb6-d9de-476b-b30f-50d7969b37fe (R-unit, architect-refined AC/TS)
  - Sprint 21 Planning
- chain
  - use case: uc:uuid:9cd5cc65-58d9-4417-8480-86531ed3cf4e
- context
  - Sprint 21 shipped without scenario-first planning (no planner on WODA.prod); tasks backfilled by architect per PO directive 2026-06-29.

## Task Description

Dropping a .vcf onto a profile parses it (parseVCard+applyVCard: photo->avatar, fn->name, tel/url) and POSTs /api/vcard to store the raw .vcf as encrypted contact.vcf in the same user dir as the avatar (encryptFile, rekey-retry on failure). vCard fields feed the Phone/Email/Address/Company minting flows.

## Acceptance Criteria

See requirement unit efd1acb6-d9de-476b-b30f-50d7969b37fe (architect-refined AC + gateable test scenarios).

## Dependencies

- Requires: Sprint 21 requirement + UC/Class/Method chain seeds
- Enables: tester DET gate

## Definition of Done

- [ ] All req ACs met; chain resolves Req->UC->Class->Method->Impl->Test
- [ ] Tester DET gate PASS
- [ ] Tron QA approved

## QA Audit & User Feedback

Shipped: v0.6.x (R21.1 shipped; implRef ProfileEditor.ts:102-139 + server.ts:495-523). Architect PDCA: req backfilled vs shipped code.

## Subtasks

None (atomic task).
