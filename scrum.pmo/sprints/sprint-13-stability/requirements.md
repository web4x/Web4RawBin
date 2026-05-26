[Back to Planning](./planning.md)

# Sprint 13 — Requirements

## Source
Tron directives 2026-05-26 via robbin-po. Four requirements across three workflows (Avatar, Rooms, PWA).

---

## AVATAR Workflow

- [ ] **R-A1: Avatar must persist across sessions — must not revert to default**
  [requirement:uuid:a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d]
  > TRON DIRECTIVE: "my avatar picture disappeared. its back to default."
  → [T91: Avatar persistence fix](./task-91-avatar-persist.md)

- [ ] **R-A2: Avatar upload must work without exposing key errors to user**
  [requirement:uuid:b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e]
  > TRON DIRECTIVE: "i tried to upload a new one… got the message key not found. a user should not need to know anything about the keys."
  → [T92: Avatar upload key-error UX](./task-92-avatar-upload-ux.md)

## ROOMS Workflow

- [ ] **R-R1: All user rooms load from disk on connect and appear in lobby**
  [requirement:uuid:c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f]
  > TRON DIRECTIVE: "i created more than one room. but only one showes up in the lobby. when a user connects all his rooms should show up in the lobby and being loaded from disk."
  → [T93: Multi-room lobby listing](./task-93-multi-room-lobby.md)

## PWA Workflow

- [ ] **R-V1: Version update bar must appear on new version** (PRIORITY)
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80]
  > TRON DIRECTIVE: "i did also not see the version update bar any more."
  → [T94: PWA update banner fix](./task-94-pwa-update-banner.md)

  **FLAG:** This may mean Tron's device is not receiving updates at all — the SW may be serving stale code. Architect should audit the SW update path end-to-end before expert implements a fix.

---

## TEST-INFRA Workflow

- [ ] **R-T1: E2E tests must never pollute prod data — isolated DATA_DIR**
  [requirement:uuid:e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8092]
  > TRON DIRECTIVE (via PO 2026-05-26): E2E test runs flooded prod with test rooms; tests must use an isolated data dir, never prod.
  → [T100: Test data isolation (DATA_DIR override)](./task-100-test-data-isolation.md)

  Proper fix for the room-flood (the same prod-pollution that T93/S14 migration is cleaning up). Tester's interim afterAll cleanup is separate/immediate.

## UUID Index

| Requirement | UUID (short) | Task | Workflow | Priority |
|-------------|-------------|------|----------|----------|
| R-A1 | `a1b2c3d4` | T91 | Avatar | HIGH |
| R-A2 | `b2c3d4e5` | T92 | Avatar | HIGH |
| R-R1 | `c3d4e5f6` | T93 | Rooms | HIGH |
| R-V1 | `d4e5f6a7` | T94 | PWA | **CRITICAL** |
| R-T1 | `e5f6a7b8` | T100 | Test-infra | HIGH |
