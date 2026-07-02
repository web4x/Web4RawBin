<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 26.6: Federation import wiring (end-to-end receive orchestration)

[task:uuid:026af82c-3668-4d94-ae01-51e5276f851b]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 26 Planning](./planning.md)
    - Requirement R26.6 `[requirement:uuid:e289f96e-0afc-4568-9c26-16cd9b8272eb]`
  - includes
    - R26.1 (federated IOR) + R26.2 (DnD ref) + R26.3 (fetch API) + R26.4 (lazy resolve) + R26.5 (conflict reconcile) — the composed capabilities
  - down
    - [UC26.6: federation.import](./planning.md#uc26-6) `[uc:uuid:32f30eee-b0c8-4fca-b4d1-9ee6a1c0cdb1]`

## Task Description

The receiver exposes POST /api/federation/import which composes R26.1-R26.5 end-to-end: fetch the unit from the origin (R26.3) -> validate -> recreate locally with provenance (R26.1 originHost/originIor) -> resolve children per eager/lazy policy (R26.4) -> reconcile uuid conflict (R26.5) -> link the chain. The INTEGRATION that connects the federation pieces into the drop flow.

## Context

R26.6 is the INTEGRATION composing R26.1-R26.5. Chain: R26.6 e289f96e -> UC federation.import 32f30eee -> Class FederationApi 6456d811 -> Method importScenario c4506b11 -> Impl 3132c189 (server.ts). designNote federated-scenario-transfer.md (architect 7e940cf81).

## Intention

RawBin Federation: the receiver-side endpoint that orchestrates a federated import end-to-end (v0.7.7 wiring T26.1-T26.5 into the drop flow). R26.6 <<include>>s R26.1-R26.5.

## Acceptance Criteria

- [x] (endpoint) The receiver exposes POST /api/federation/import accepting a federated reference (or fetchUrl) and returning the imported unit's local IOR
- [x] (orchestrate) Import sequences: fetch unit JSON from origin (R26.3) -> validate -> recreate locally with provenance (R26.1 originHost/originIor) -> resolve children per eager/lazy policy (R26.4) -> reconcile uuid conflict (R26.5) -> link the chain
- [ ] (security) Incoming JSON is validated (schema + size-cap + sanitize), NEVER executed; foreign identities never become local auth principals (per securityNote + R25.7 members-by-reference)
- [x] (result) After import the transferred unit exists locally (recreated) with intact unitLinks + provenance, appearing in the target room/context
- [x] (idempotent) Re-import of the same reference is safe - it delegates to the R26.5 reconcile (no blind duplicate)
- [x] (integration) R26.6 is the INTEGRATION that composes R26.1-R26.5 (<<include>>); the constituent capabilities live in those reqs

## Implementation

Code SHIPPED v0.7.7 (004c0934f — /api/federation/import, server.ts). Impl 3132c189. Expert RELABELED markers R26.7/T26.7 -> R26.6/T26.6 + renamed federationImport -> importScenario (7ec101e47, per req R26.6-canonical + architect method-owner). Tester GREEN DET-3x (b9604a1e2, gate r263-t267-federation-e2e-gate.mjs, 53/310): real unit+provenance / lazy @host children / idempotent noop. 5/6 ACs GREEN; (security) LEFT [ ] — the e2e gate covers the foreign-identity-by-ref half (lazy @host children) but NOT the schema-validate/never-execute-foreign-JSON half (must-not-blanket, #27) -> flagged.

## Subtasks

None (atomic task).
