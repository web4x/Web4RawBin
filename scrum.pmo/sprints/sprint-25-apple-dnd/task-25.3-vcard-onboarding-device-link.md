<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 25.3: vCard onboarding recognizes existing users (device-link, no new UUID)

[task:uuid:92bdca8b-6c08-459d-a540-98073b80c020]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [x] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 25 Planning](./planning.md)
    - Requirement R25.3 `[requirement:uuid:d0acb05d-982f-418b-a0d4-667d13435371]`
  - crossRef
    - R21.4 device-link mechanism (reused) + R21.1 identity
  - down
    - [UC-OB.1: onboarding.vCardKnownUserDeviceLink](./planning.md#uc-ob1) `[uc:uuid:c461d975-729b-4d60-bd45-6b1a1b62be33]`

## Task Description

During onboarding, the moment a dragged vCard fills the profile (phone/email), those keys are checked against the alt-UUID index (resolveKeyToProfile) BEFORE any profile is minted: if the phone/email is already known, the dialog switches from "Authorize This Device" to "User already exists. Unlock device with your secret code" — WITHOUT creating a new user UUID/profile — and on the correct secret code the device is linked to the EXISTING profile. Replaces today's mint-new-profile-then-manual-Link-Account.

## Context

REUSES the R21.4 device-link mechanism (resolveKeyToProfile / KNOWN_KEY_CHALLENGE / DEVICE_ENROLL_REQUEST already shipped) — the gap is the vCard onboarding path mints FIRST instead of checking. Expert is WIRING the existing mechanism into the onboarding gate, NOT building device-link from scratch. crossRef R21.4 (device-link) + R21.1 (identity). implRef: ProfileEditor.ts + server.ts:230/2054.

## Intention

Tron: "the moment I dragged the vCard and it filled out the profile it should switch to Authorize This Device WITHOUT creating a new user UUID and profile, but asking for my existing secret code... User already exists. Unlock device with your secret code... add the device to my existing user."

## Acceptance Criteria

- [ ] (check-on-fill) When a vCard fills the onboarding profile, the filled phone AND email are checked against the alt-UUID index (resolveKeyToProfile) BEFORE minting any profile
- [ ] (known->switch) If a key is FOUND, the dialog switches from "Authorize This Device" to "User already exists. Unlock device with your secret code"
- [ ] (no new uuid) No new user UUID / profile is created while a known key awaits the secret code
- [ ] (correct code->link) On the correct secret code, the device is linked to the EXISTING profile (device-link, R21.4) - no new UUID
- [ ] (wrong code) A wrong secret code is rejected explicitly; still no new profile
- [ ] (replaces manual) This replaces today's behaviour (mint new profile -> manual Link Account)
- [ ] (unknown->authorize) If neither key is known, onboarding proceeds normally with "Authorize This Device" (new profile)

## Implementation

IN FLIGHT — expert implementing v0.6.93 (not yet committed): wire the existing R21.4 device-link (resolveKeyToProfile / KNOWN_KEY_CHALLENGE / DEVICE_ENROLL_REQUEST) into the vCard onboarding gate (ProfileEditor.ts + server.ts:230/2054) so a known phone/email switches the dialog to 'User already exists. Unlock device with your secret code' BEFORE minting. Flip implementing[x] when v0.6.93 commits (source-verified); testing[x] on a committed tester GREEN (#102).

## Subtasks

None (atomic task). NOTE: R25.3+ per-scheme MEANINGFUL preview bodies (email/calendar-event/map/contact-card on top of the WebItem launcher card) are deferred — created as Tron exercises each scheme.
