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
- [x] QA Review
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

- [ ] **(unit-shape)** Each email is minted as an ior:class:Email scenario unit with its own v4 uuid in scenario/index.
- [ ] **(unit-shape)** The Email unit model carries { uuid, address (normalized), ownerIor } — the address field stores the NORMALIZED form.
- [ ] **(unit-shape)** ownerIor points to the owning Profile (nav parent, NOT a chain edge); the Profile carries the forward IOR in model.emails[].
- [ ] **(relationship)** Profile.model.emails[] holds the forward IOR(s) to Email unit(s) (class-to-method relationship shape).
- [ ] **(relationship)** A profile may carry MULTIPLE Email units, each an independent ior:class:Email with its own uuid.
- [ ] **(relationship)** Idempotent: linking an email whose normalized address already exists on the profile creates NO duplicate Email unit and NO duplicate entry in emails[].
- [ ] **(normalize)** normalizeEmail(raw) = trim + lowercase. "Marcel.Donges@Gmail.com" -> "marcel.donges@gmail.com".
- [ ] **(normalize)** normalizeEmail is deterministic and pure; the SAME implementation is shared by server and client.
- [ ] **(normalize)** The normalized form is what is stored as the unit address AND used as the alt-index key (one canonical value).
- [ ] **(alt-index)** The alt/email/<normalizedAddress>.scenario.json symlink is declared on the PROFILE unit unitLinks[] (matches shipped R21.6 phone) and points to the Profile unit; index.put self-syncs it (ensureSymlinkDisk), remove() self-removes it.
- [ ] **(alt-index)** The alt/email entry resolves DIRECTLY to the owning Profile — making the email an alternate UUID for that profile (parallel to R21.3 phone).
- [ ] **(alt-index)** resolveKeyToProfile(normalizedEmail) returns the owning Profile uuid (read the symlinked Profile unit model.uuid), or null on miss.
- [ ] **(mint-link)** EmailIndex.mintAndLink(profileUuid, rawEmail): normalize -> mint-or-reuse the Email unit (ownerIor=Profile) -> push its IOR into Profile.emails[] -> add alt/email link to Profile.unitLinks[] -> index.put.
- [ ] **(mint-link)** EmailIndex.mintAndLink is idempotent: calling it twice with the same email on the same profile yields exactly ONE Email unit and ONE emails[] entry and ONE alt/email symlink.
- [ ] **(mint-link)** EmailIndex.mintAndLink returns the Email unit IOR.
- [ ] **(device-link)** On IDENTIFY with an email already in the alt/email index, resolveKeyToProfile returns the existing profile and the device-link flow (R21.4) runs — NO new user is minted.
- [ ] **(device-link)** Email device-link is IDENTICAL to phone (R21.4): correct secret code -> a new device attaches to the existing profile; wrong/absent code -> no device, no profile merge.

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
