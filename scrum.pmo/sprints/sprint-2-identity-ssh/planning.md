# Sprint 2 Planning — RawBin Identity & SSH Infrastructure

## Sprint Goal
Transform RawBin from anonymous token-based identity to cryptographic SSH key-based authentication with mandatory profile completion, per-user SSH keys, per-device enrollment, and vCard contact sharing.

## Sprint Overview
**Duration:** TBD
**Focus:** User identity, SSH key infrastructure, device enrollment
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directives via iphone:0.0

## Task List

- [ ] [T7: User Editor Dialog](./task-7-user-editor.md)
  **Priority:** 7 (CRITICAL — enables all identity work) **Status:** PLANNED
  **Effort:** 3h expert + 1h tester
  - ProfileEditor.ts client component (name, phone, url, avatar, secret code)
  - Self-click in room → editor, other-click → stub for T11
  - Server: UPDATE_PROFILE handler, UserProfile extensions (phone, url, profileCommitted)

- [ ] [T8: Mandatory Profile Gate](./task-8-profile-gate.md)
  **Priority:** 8 (HIGH — blocks room access for new users) **Status:** PLANNED
  **Effort:** 2h expert + 1h tester
  **Depends on:** T7
  - Gate mode: no close button, name required, "Continue" to proceed
  - Server rejects room create/join for uncommitted profiles

- [ ] [T9: SSH Key Generation on Profile Commit](./task-9-ssh-keys.md)
  **Priority:** 9 (HIGH — foundation for device auth) **Status:** PLANNED
  **Effort:** 3h expert + 1h tester
  **Depends on:** T8
  - New UserKeys.ts module (Node.js crypto, no shell)
  - Per-user home directory: data/users/<token>/.ssh/
  - OOSH directory pattern: id_rsa, public_keys/, private_key/, authorized_keys

- [ ] [T10: Device Key Enrollment](./task-10-device-keys.md)
  **Priority:** 10 (HIGH — enables per-device auth) **Status:** PLANNED
  **Effort:** 4h expert + 1.5h tester
  **Depends on:** T9
  - Secret code verification → device keypair generation → user key signing
  - DeviceEnrollDialog.ts client component
  - Device keys stored in localStorage, public key in authorized_keys

- [ ] [T11: vCard Download](./task-11-vcard.md)
  **Priority:** 11 (MEDIUM — user-facing feature) **Status:** PLANNED
  **Effort:** 1.5h expert + 0.5h tester
  **Depends on:** T7 (runs parallel with T8-T9)
  - ProfileSheet.ts bottom-sheet overlay
  - vCard V3.0 generation (FN, TEL, URL, PHOTO)
  - Other-user click → GET_USER_INFO → download .vcf

- [ ] [T12: SSH-Based Login (Challenge-Response)](./task-12-ssh-login.md)
  **Priority:** 12 (HIGH — completes auth chain) **Status:** PLANNED
  **Effort:** 3h expert + 1h tester
  **Depends on:** T10
  - Welcome message includes challenge nonce
  - Client signs with device key via Web Crypto API
  - Server verifies → authenticated connection
  - Backward compatible with token-based IDENTIFY

## Dependency Graph
```
T7 (Editor) ──→ T8 (Gate) ──→ T9 (SSH Keys) ──→ T10 (Device Keys) ──→ T12 (SSH Login)
     └──→ T11 (vCard) [parallel with T8-T9]
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 6 (T7-T12) |
| Expert effort | ~16.5h |
| Tester effort | ~6h |
| New files | 6 |
| New WS messages | 10 (31 → 41) |
| New lines (est.) | ~1,000 |

## Definition of Done
- All task acceptance criteria met
- `npm run build` succeeds
- All vitest tests pass (room + server + profile + userkeys + client)
- SSH key generation works (Node.js crypto, OOSH directory pattern)
- Device enrollment flow works end-to-end
- Challenge-response auth works
- Profile gate blocks room access for new users
- vCard download works on mobile
- No regression in Sprint 1 functionality

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-23
**Sprint:** Sprint 2 — Identity & SSH Infrastructure
