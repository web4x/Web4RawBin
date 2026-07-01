<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 26.3: Server-to-server scenario fetch API (on the origin)

[task:uuid:e36f7645-2e76-4e6f-a7ec-90c9f03fdfcc]

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
    - Requirement R26.3 `[requirement:uuid:05d21385-766a-426d-9045-77255d5234a0]`
  - down
    - [UC26.3: federation.scenarioFetchApi](./planning.md#uc26-3) `[uc:uuid:e205f1b0-7e8f-4b52-932c-dc9ae2350ef6]`

## Task Description

The origin server exposes GET /api/scenario/<uuid> (unit JSON), /content (file bytes, content-addressable, only when the receiver lacks the contentHash), and /children?mode=trace (forward children). Fetched server-to-server (receiver's server calls origin, NOT browser) so there is no CORS and auth is server-presented: a short-lived signed CAPABILITY grant for ad-hoc DnD, or a per-server keypair signature + trust list for standing federation. Every federated fetch is rate-limited + audit-logged.

## Context

Greenfield federation, scenario-first (#126). Design: federated-scenario-transfer.md (architect 7e940cf81). Class server. Consumed by R26.2 (fetchUrl) + R26.4 (lazy resolve).

## Intention

RawBin Federation: the origin exposes a safe, authenticated server-to-server API so the receiver's server (not the browser) fetches units/bytes/children — no CORS, no ambient authority.

## Acceptance Criteria

- [x] (endpoint-unit) GET /api/scenario/<uuid> returns the unit JSON (ScenarioIndex.get)
- [x] (endpoint-content) GET /api/scenario/<uuid>/content returns file bytes (content-addressable), served only when the receiver lacks the contentHash
- [x] (endpoint-children) GET /api/scenario/<uuid>/children?mode=trace returns forward children (reuses /api/trace/children) for the tree walk
- [x] (transport) Fetches are server-to-server (receiver's server calls origin), NOT browser->origin — no CORS; auth is server-presented
- [x] (auth-adhoc) Ad-hoc DnD auth = a short-lived SIGNED capability grant scoped to {uuid + its transferable subtree}, minutes-expiry, embedded in fetchUrl?grant=; only the drag recipient holds it
- [ ] (auth-standing) Standing federation auth = the caller server signs requests with its per-server keypair; the origin verifies the signature + an explicit trust list
- [x] (safety) Every federated fetch is rate-limited + audit-logged (addLog)

## Implementation

 GREEN → QA Review: impl v0.7.4 (3bedda07e); tester GREEN DET-3x df5b2ac6b — grant auth + unit/content/children. NOTE: gate covered capability-GRANT auth; the STANDING-federation keypair+trust-list AC (auth-standing) was NOT in this gate → left [ ]. (#27 per-AC honest.)

## Subtasks

None (atomic task).
