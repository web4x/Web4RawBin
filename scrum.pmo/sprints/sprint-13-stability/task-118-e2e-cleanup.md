[Back to Sprint 13 Planning](./planning.md)

# T118: E2E test cleanup — cleanupTestUsers + per-spec afterAll + backfill purge

[task:uuid:c2118a07-d18e-4e1b-b9a2-5f8e2c1f0d77]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owner:** robbin-expert (helper + per-spec wiring), robbin-tester (verify; prod-data preserved)
**This file is the single source of truth.** Expert and tester work from this file alone — no chat clarification.

## Traceability

`[task:uuid:c2118a07-d18e-4e1b-b9a2-5f8e2c1f0d77]`

- up
  - [Sprint 13 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:r118-e2e-cleanup-d18b-2c5f-a7f0e2b1c5d8]` — "E2E test runs must not flood `data/` with orphan users or rooms; every spec that creates user/room state must clean it up after the run." (Tron directive 2026-05-29, promoted from B2 in [backlog.md](../../backlog.md).)
  - **promoted from:** B2 in [backlog.md](../../backlog.md) (2026-05-29)
- down
  - None (atomic task)
- follows
  - [T100: Test Data Isolation — DATA_DIR override](./task-100-test-data-isolation.md) — vitest side; T118 is the E2E cousin
- chain (req → usecase → puml → class/method)
  - **requirement:** r118-e2e-cleanup (Tron 2026-05-29)
  - **use case:** UC-cleanupTestUsers, UC-cleanupTestRooms (existing T100), UC-e2eAfterAll (per-spec hook); add to S13 PUML
  - **puml:** [diagrams/sprint13-usecases.puml](./diagrams/sprint13-usecases.puml) (if present; else architect adds new entries)
  - **class/method:** `test/e2e/helpers.ts` → `cleanupTestUsers(pattern)`; per-spec `test.afterAll(() => cleanupTestUsers(<pattern>))`

## Problem Statement

Tron 2026-05-29: tests must not flood `data/` with users that are never deleted.
**Measured:** `data/users/` holds **263 user dirs** today; **115 created on a single
day (2026-05-26)** during heavy S13/S14 test runs. Sampled profile names map directly
to E2E spec names (`E2E-Room-Test`, `RoomE2E`, `SshE2E`, `NameE2E`, `DeleteE2E`,
`VisibleE2E`, `BadgeOwner`, `OrderUser`, `E2E-Profile`). Vitest is fine
(`os.tmpdir()` + `afterEach rmSync` in `room-identity.test.ts`,
`avatar-preserve.test.ts`, `trace-consistency.test.ts`); the leak is E2E hitting
the live server.

## Root Cause (diagnosed, evidence-backed)

| Gap | Detail |
|-----|--------|
| 1 | `test/e2e/helpers.ts::cleanupTestRooms(pattern)` exists (honors T100 DATA_DIR) but deletes **rooms only** — leaves the user dir, SSH keys, profile.json, and any files in place. |
| 2 | No `cleanupTestUsers(pattern)` helper exists. |
| 3 | 5 of 9 ensureLobby-using specs have **zero cleanup**: `contacts-ui` (8×), `lobby-card-badges` (2×), `mobile-viewport` (2×), `multi-room-lobby` (6×), `profile-editor` (2×). 3 specs (`room-identity`, `room-lifecycle`, `room-order`) clean only rooms. |
| 4 | Existing 263-dir backlog needs a one-shot purge — preserving the 3 real owner accounts (Marcel Donges's Room owner, Admins's Room owner, Marcel Surface Mini owner) plus any non-test fixture. |

## Design

### Change 1 — `cleanupTestUsers(pattern: RegExp): number` in `test/e2e/helpers.ts`

Mirror `cleanupTestRooms`. Iterate `data/users/*/profile.json` in the DATA_DIR
the server actually wrote to (T100-honoring), match `profile.name` against
`pattern`, `fs.rmSync(userDir, { recursive: true, force: true })` for matches,
return the count. Safety: refuse to run if `pattern` is missing or matches
unbounded (e.g. `/.*/`).

### Change 2 — Test-user naming convention (lint/audit)

Every `ensureLobby(page, name)` call MUST use a name with a recognizable test
prefix so cleanup can match safely. Recommended forms:
- `E2E-<spec-slug>-<role>` — e.g. `E2E-Contacts-Owner`, `E2E-Lobby-Guest`
- `T<task>-<role>` — e.g. `T81-Owner`, `T93-Guest`
Existing names already follow a recognizable pattern (`RoomE2E`, `NameE2E`,
`BadgeOwner`, etc.); the audit step (Change 4) verifies every spec's regex
covers every name it uses.

### Change 3 — Per-spec `afterAll` cleanup wiring

For every E2E spec that calls `ensureLobby`, add:
```typescript
import { ensureLobby, cleanupTestUsers, cleanupTestRooms } from './helpers';

test.afterAll(() => {
  const users = cleanupTestUsers(/^(E2E-Contacts|ContactsOwner|GuestB)/);  // spec-specific
  const rooms = cleanupTestRooms(/^(E2E-Contacts|ContactsRoom)/);
  console.log(`[contacts-ui cleanup] removed ${users} users, ${rooms} rooms`);
});
```

Specs to wire (this task):
- `contacts-ui.spec.ts` (8 ensureLobby, 0 cleanup)
- `lobby-card-badges.spec.ts` (2 / 0)
- `mobile-viewport.spec.ts` (2 / 0)
- `multi-room-lobby.spec.ts` (6 / 0)
- `profile-editor.spec.ts` (2 / 0)
- `room-identity.spec.ts` (8 / 2 rooms-only) — add users cleanup
- `room-lifecycle.spec.ts` (2 / 2 rooms-only) — add users cleanup
- `room-order.spec.ts` (2 / 2 rooms-only) — add users cleanup

Patterns per spec are the spec's own — match the prefixes its `ensureLobby`
calls actually use.

### Change 4 — One-shot backfill purge (PROD-DATA SAFE)

Two-step, gated:
1. **Dry-run report** (`scripts/test-data-purge.ts --report` or similar):
   list every `data/users/*/profile.json` whose name matches the union regex
   of all known test patterns. Emit a JSON report: count, sample names,
   token-list. **Show the 3 real owner accounts as `preserved`** by negative
   match. PO + tester review.
2. **Apply** (`--apply`, after PO sign-off): `fs.rmSync` each matched dir.
   Log final user count. Goal: baseline returns to ~3 (real owners) plus any
   intentional fixtures.

The script is a one-shot, NOT a recurring cleanup — recurring cleanup is the
per-spec `afterAll` (Change 3).

### Change 5 — Version bump (PWA reach unchanged — test infra only)

This is test-infra only — no client behavior change. Version bump optional;
include if any non-test file is touched. (Likely no bump needed.)

## Acceptance Criteria
- [ ] AC1 — `cleanupTestUsers(pattern)` helper exists in `test/e2e/helpers.ts`, honors `DATA_DIR`, refuses unbounded patterns
- [ ] AC2 — All 8 ensureLobby-using specs have `test.afterAll` calling `cleanupTestUsers` (+ `cleanupTestRooms` where rooms were created) with spec-specific regex
- [ ] AC3 — Backfill dry-run report lists matched test users and explicitly shows the 3 real owners as preserved
- [ ] AC4 — Backfill apply reduces `data/users/` to the 3 real owners + intentional fixtures only; no real-user dir touched
- [ ] AC5 — Full E2E suite (`npm run test:e2e`) → `data/users/` count after the run equals the count before the run (zero net add)
- [ ] AC6 — `npm run build` succeeds; full vitest + playwright suite passes; no regression on T100 (vitest isolation still works)
- [ ] AC7 — Real owner accounts (Marcel Donges's Room, Admins's Room, Marcel Surface Mini per S14 audit) untouched by both helper and backfill

## Test Scenarios

File: `test/vitest/e2e-cleanup.test.ts` (new) + manual E2E run verification.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Call `cleanupTestUsers(/^E2E-/)` on a tmp DATA_DIR seeded with 3 `E2E-*` users + 1 `Real-*` user | Returns 3; only `Real-*` dir remains |
| TS2 | Call `cleanupTestUsers(/.*/)` | Throws / returns 0 (unbounded-pattern guard) |
| TS3 | Backfill `--report` against real `data/` | Output includes `preserved` list with the 3 owner names; matched-count > 0 |
| TS4 | Manual: count `data/users/` before E2E, run full E2E, count after | Equal (zero net add) |
| TS5 | Manual: after backfill apply, restart server | `/api/health` rooms=3; live owners load; nothing degraded |

## Dependencies
- **Requires:** T100 (DATA_DIR override — helpers honor it)
- **Enables:** sustainable E2E hygiene; precondition for any future E2E expansion

## Definition of Done
- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] `data/users/` baseline restored to real owners + intentional fixtures only
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-29: Promoted from backlog B2 (planner-filed; Tron-triaged via PO). Awaiting refinement + impl, then Tron QA.

## Subtasks
None (atomic task).

---

*Sprint 13 — Stability*
*Owner: robbin-expert (helper + spec wiring), robbin-tester (verify; prod-data preserved)*
*Priority: 8 (test-infra hygiene — sustains the gate)*
