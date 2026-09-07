<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.14: Portable encrypted loginToken — download fro

[task:uuid:88183260-40e1-4a4e-89ab-83a433642b71]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.14 (Portable encrypted loginToken — download fro). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.14; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(download-from-profile)** DOWNLOAD from the profile, reusing the vCard-download precedent.
- [ ] **(crypto-pubkey-STUB-MUST-FAIL)** Encrypted TO the user's PUBLIC key so ONLY his PRIVATE key can decrypt — proven BY CONSTRUCTION: decryption with a WRONG key must FAIL (stub-must-fail applied to crypto; NEVER 'it decrypted for me' as evidence). [DESIGN-REQUIRED — architect security design.]
- [ ] **(token-identity-form)** Token identity form = User.Name.web4ID.
- [ ] **(drag-drop-login-REUSE)** DRAG-AND-DROP into ANY server logs that user on — REUSE the DropDispatcher / WebItem MIME routing, no new drop machinery.
- [ ] **(credential-security)** Credential-grade security stated explicitly: replay-safety (expiry and/or nonce), REVOCABILITY, and forgery-resistance (dropping a token must NEVER authenticate a DIFFERENT identity).
- [ ] **(no-plaintext-secretCode)** Must NOT embed the plaintext secretCode.

## Subtasks
