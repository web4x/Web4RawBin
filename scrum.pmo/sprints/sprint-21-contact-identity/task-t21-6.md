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
- [x] QA Review
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

- [ ] **(unit-shape)** A phone is minted as an ior:class:Phone unit with model { uuid, e164, ownerIor } AND a top-level ownerIor; both ownerIor === ior:instance:<profileUuid>.
- [ ] **(unit-shape)** model.e164 stores the NORMALIZED canonical key (normalizePhone output), never the raw input string.
- [ ] **(unit-shape)** The caller supplies the v4 uuid (PhoneIndex is runtime-crypto-free); the server passes crypto.randomUUID().
- [ ] **(format)** normalizePhone(raw) strips ALL non-digit characters and returns +<digits> (e.g. '+49 1525 384-4085' -> '+4915253844085').
- [ ] **(format)** Input with no digits returns '' (empty), which is rejected downstream.
- [ ] **(format)** isValidPhoneKey enforces /^\+\d{6,15}$/ — a leading + then 6..15 digits; an invalid key causes mintAndLink to return null and mint NOTHING.
- [ ] **(format)** The standardized +CountryDigits format is enforced AT creation: mintAndLink normalizes and validates before any unit is written.
- [ ] **(profile-link)** On success the Phone IOR ior:instance:<phoneUuid> is appended to Profile.model.phones[].
- [ ] **(profile-link)** A profile may carry MULTIPLE distinct phones — different normalized keys produce multiple Phone units and multiple phones[] entries.
- [ ] **(idempotent)** IDEMPOTENT: minting a phone whose normalized key already exists in phones[] adds NO duplicate unit and NO duplicate phones[] entry.
- [ ] **(idempotent)** Idempotency is keyed on the NORMALIZED value — raw variants like '+49 1525 3844085' and '+4915253844085' collapse to the same single entry.
- [ ] **(mintAndLink)** mintAndLink(profileUuid, rawPhone, phoneUuid) returns the normalized key on success, null on an invalid key OR a missing profile.
- [ ] **(mintAndLink)** If the profile does not exist, mintAndLink returns null and mints no unit.
- [ ] **(alt-index)** On success an alt/phone/<key>.scenario.json symlink is registered pointing to the PROFILE's canonical file, declared on the Profile's unitLinks[] (self-syncs on write, self-removes on profile remove).
- [ ] **(alt-index)** resolveToProfile(rawPhone) normalizes, follows the symlink, and returns the profile uuid — i.e. the phone is an alternate UUID for the profile (feeds R21.3/R21.4).
- [ ] **(seed)** Tron's phone +4915253844085 exists as the first Phone unit on his WODA.prod profile (real seed data from the start).

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
