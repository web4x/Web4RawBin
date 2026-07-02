<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T21.8: Companies as shared dedup units

[task:uuid:842d4f01-8ba6-4917-8b9b-e99d4d70c986]

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
  - requirement:uuid:bf6a0433-6e85-4341-92e5-79acb725e0bf (R-unit, architect-refined AC/TS)
  - Sprint 21 Planning
- chain
  - use case: uc:uuid:a62c6e37-139f-4107-a157-1c67b3e06bfb
- context
  - Sprint 21 shipped without scenario-first planning (no planner on WODA.prod); tasks backfilled by architect per PO directive 2026-06-29.

## Task Description

CompanyIndex.mintOrReuseShared: companyNameKey (NFKD+diacritics, lowercase, &->and, strip legal suffixes, strip non-alnum) is the recall key; domain (from email/URL) is the AUTHORITATIVE key. Domain-hit reuses; domain present-but-miss mints DISTINCT (AC-b3); no-domain nameKey collision dedups (Tron "do not duplicate"). ownerIor:null shared; Profile.companies[] forward-only; /api/company/suggest autocomplete.

## Acceptance Criteria

See requirement unit bf6a0433-6e85-4341-92e5-79acb725e0bf (architect-refined AC + gateable test scenarios).

## Dependencies

- Requires: Sprint 21 requirement + UC/Class/Method chain seeds
- Enables: tester DET gate

## Definition of Done

- [ ] All req ACs met; chain resolves Req->UC->Class->Method->Impl->Test
- [ ] Tester DET gate PASS
- [ ] Tron QA approved

## QA Audit & User Feedback

Shipped: v0.6.72 a52245de1 + b3 fix v0.6.74 2a1357a69. Architect PDCA: PDCA: AC-b3 gap -> FIXED v0.6.74 (verified GREEN).

## Subtasks

None (atomic task).
