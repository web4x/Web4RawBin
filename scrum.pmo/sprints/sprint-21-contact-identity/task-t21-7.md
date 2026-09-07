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
- [x] QA Review
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

- [ ] **(format)** The address is stored as ONE string field `oneLine` ordered large to small: Country City PostalCode Street HouseNumber.
- [ ] **(format)** Canonical example: `DE Berlin 10115 Strasse 7` — country code first, postal code third, house number last.
- [ ] **(format)** The five tokens appear in exactly this sequence: Country, City, PostalCode, Street, HouseNumber (no reordering, no separate fields).
- [ ] **(unit-shape)** Each address is minted as an `ior:class:Address` scenario unit with its own v4 uuid in scenario/index.
- [ ] **(unit-shape)** The unit model carries exactly: { uuid, oneLine, verified, osmLink, gmapsLink, ownerIor }.
- [ ] **(unit-shape)** At creation the unit is { verified:false, osmLink:null, gmapsLink:null }.
- [ ] **(unit-shape)** ownerIor points to the owning Profile (nav parent, NOT a chain edge); the Profile carries the forward IOR in model.addresses[]. A profile may hold multiple Address units.
- [ ] **(async-verify)** Save is immediate and NEVER blocks: the unit is index.put synchronously and returned before any network call.
- [ ] **(async-verify)** A background VerifyJob(uuid) is enqueued off the request path (server worker), not awaited by the caller.
- [ ] **(async-verify)** VerifyJob queries Nominatim GET /search?q=<oneLine>&format=json&limit=1 with a descriptive User-Agent, rate-limited to <=1 req/s, cached by oneLine.
- [ ] **(async-verify)** On an OSM hit: unit.verified=true and links are set, then index.put — the verified badge appears on next render/push.
- [ ] **(async-verify)** On an OSM miss: unit stays verified=false, persists, and displays WITHOUT a badge — never deleted, never errors the UI.
- [ ] **(badge-states)** Badge states: UNVERIFIED (no badge) at creation and on miss; VERIFIED (badge shown) only after a confirmed OSM hit.
- [ ] **(link-storage)** On verification, osmLink is stored as https://www.openstreetmap.org/?mlat=<lat>&mlon=<lon>#map=18/<lat>/<lon>.
- [ ] **(link-storage)** On verification, gmapsLink is stored as https://www.google.com/maps?q=<lat>,<lon>.
- [ ] **(link-storage)** BOTH links are stored on the same unit on success; both remain null while unverified.

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
