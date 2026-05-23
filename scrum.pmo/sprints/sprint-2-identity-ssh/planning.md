# Sprint 2 Planning — RawBin Identity & SSH Infrastructure

## Sprint Goal
Transform RawBin from anonymous token-based identity to cryptographic SSH key-based authentication with mandatory profile completion, per-user SSH keys, per-device enrollment, and vCard contact sharing.

## Sprint Overview
**Duration:** TBD
**Focus:** User identity, SSH key infrastructure, device enrollment
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directives via iphone:0.0

## Task List

- [x] [T7: User Editor Dialog](./task-7-user-editor.md)
  **Status:** DONE — ProfileEditor.ts 123 lines, UPDATE_PROFILE+GET_USER_INFO handlers, MessageTypes 35

- [x] [T8: Mandatory Profile Gate](./task-8-profile-gate.md)
  **Status:** DONE — gate flow in app.ts, server rejects uncommitted profiles

- [x] [T9: SSH Key Generation on Profile Commit](./task-9-ssh-keys.md)
  **Status:** DONE — UserKeys.ts 135→192 lines, RSA-2048, OOSH .ssh/ pattern

- [x] [T10: Device Key Enrollment](./task-10-device-keys.md)
  **Status:** DONE — device keypairs, secret code verification, DeviceEnrollDialog.ts 69 lines

- [x] [T11: vCard Download](./task-11-vcard.md)
  **Status:** DONE — ProfileSheet.ts 98 lines, vCard V3.0, Link Account

- [x] [T12: SSH-Based Login (Challenge-Response)](./task-12-ssh-login.md)
  **Status:** DONE — challenge nonce, Web Crypto sign/verify, backward compatible

## Dependency Graph
```
T7 (Editor) ──→ T8 (Gate) ──→ T9 (SSH Keys) ──→ T10 (Device Keys) ──→ T12 (SSH Login)
     └──→ T11 (vCard) [parallel with T8-T9]
```

## Architecture Diagrams

Created by robbin-architect. Source: `diagrams/*.puml`, rendered: `diagrams/*.svg`.

| Diagram | Source | Description |
|---------|--------|-------------|
| [Use Cases](./diagrams/use-case.svg) | [use-case.puml](./diagrams/use-case.puml) | All actors (User, Device, Server) and 20 use cases across T7-T12, color-coded by type |
| [Class Diagram](./diagrams/class-diagram.svg) | [class-diagram.puml](./diagrams/class-diagram.puml) | UserProfile, DeviceRecord, UserKeys, WebSocketClient, Room, RoomMember — new fields highlighted in green |
| [Enrollment Sequence](./diagrams/sequence-enrollment.svg) | [sequence-enrollment.puml](./diagrams/sequence-enrollment.puml) | Full flow: Profile Gate (T8) → SSH key generation (T9) → Device enrollment (T10) |
| [Auth Sequence](./diagrams/sequence-auth.svg) | [sequence-auth.puml](./diagrams/sequence-auth.puml) | Challenge-response authentication (T12) with replay protection and backward compatibility |

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 6/6 DONE |
| Expert effort | ~16.5h |
| Tester effort | ~6h |
| New files | 6 (ProfileEditor, ProfileSheet, DeviceEnrollDialog, UserKeys + 2 test files) |
| WS messages | 31 → 47 (+16) |
| Tests | 116 unit tests pass (33 room + 22 profile + 61 userkeys) |
| Build | 24.8KB |

## Definition of Done
- [x] All task acceptance criteria met
- [x] `npm run build` succeeds (24.8KB)
- [x] All vitest unit tests pass (116/116)
- [x] SSH key generation works (Node.js crypto, OOSH directory pattern)
- [x] Device enrollment flow works end-to-end
- [x] Challenge-response auth works
- [x] Profile gate blocks room access for new users
- [x] vCard download works
- [x] No regression in Sprint 1 functionality

## Sprint Metrics
- Tasks completed: 6/6
- Sprint completed: 2026-05-23

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-23
**Sprint:** Sprint 2 — Identity & SSH Infrastructure
