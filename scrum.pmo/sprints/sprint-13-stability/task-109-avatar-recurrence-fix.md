<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T109: Avatar Recurrence Fix — Decrypt-Exception Overwrite + Rekey Re-encrypt

[task:uuid:109a0b1c-2d3e-4f50-8617-a09010901109]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] Done

## Traceability

- up
  - [requirement:uuid:a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d](./requirements.md) — R-A1: Avatar must persist (satisfied by T91 + T109 together)
  - [Sprint 13 Planning](./planning.md)
  - Tron directive 2026-05-26 ("keeps breaking to fallback")
- down
  - None (atomic task)
- completes
  - [T91](./task-91-avatar-persist.md) — T91 closed the STRING-desync overwrite; T109 closes the decrypt-EXCEPTION overwrite + rekey re-encrypt. R-A1 done only when BOTH verify.
- chain
  - **requirement:** R-A1 in [requirements.md](./requirements.md)
  - **class/method:** server.ts `ensureAvatar` catch path + `GET /api/avatar` decrypt; UserKeys identity rekey → re-encrypt `files/*`
- relates
  - DISJOINT from S14: token-* dirs (T97) have 0 avatars/keys; the ~118 real avatars are on already-UUID dirs T97 never touches → migration can't fix or worsen it. (T97 should still add: re-encrypt files/* on identity rekey.)

## Acceptance Criteria

- [ ] AC1: decrypt EXCEPTION in `ensureAvatar` NEVER overwrites avatar.enc with a default (no data loss)
- [ ] AC2: present-but-undecryptable avatar.enc is left intact + logged (recoverable)
- [ ] AC3: on identity rekey, files/* (avatar.enc) are re-encrypted with the new key → stay decryptable
- [ ] AC4: after rekey + reconnect, the user's real avatar still serves (no fallback)
- [ ] AC5: no avatar.enc is destroyed across regen/redirect/reconnect cycles
- [ ] `npm run build` + version bump

## Dependencies

- **Requires:** T91 (string-desync fix) — T109 completes R-A1
- **Enables:** R-A1 done (with T91)

## Definition of Done

- [ ] AC met; chain resolves; no avatar destroyed on decrypt-exception or rekey
- [ ] Tests pass, build clean
- [ ] Tron QA approved (R-A1 declared done only with T91+T109)

## QA Audit & User Feedback

- 2026-05-26: Tron — "app keeps breaking the profile picture to the fallback" (post-T91 recurrence). New task per PO; expert fix landed v0.5.9 (75053e4); tester verification pending.

## Subtasks

None (atomic task).

---
*Sprint 13 — Stability (Core Workflow Fixes)*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: HIGH — actively destroying avatars (permanent loss) until verified*
