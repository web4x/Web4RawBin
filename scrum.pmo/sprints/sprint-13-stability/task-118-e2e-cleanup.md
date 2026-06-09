<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T118: E2E test cleanup — cleanupTestUsers + per-spec afterAll + backfill purge

[task:uuid:c2118a07-d18e-4e1b-b9a2-5f8e2c1f0d77]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:c2118a07-d18e-4e1b-b9a2-5f8e2c1f0d77]`

- up
  - [Sprint 13 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:c32974c5-dd10-45a7-b5dd-0d711b412fdc]` — "E2E test runs must not flood `data/` with orphan users or rooms; every spec that creates user/room state must clean it up after the run." (Tron directive 2026-05-29, promoted from B2 in [backlog.md](../../backlog.md).)
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

## Acceptance Criteria

- [ ] AC1 — `cleanupTestUsers(pattern)` helper exists in `test/e2e/helpers.ts`, honors `DATA_DIR`, refuses unbounded patterns
- [ ] AC2 — All 8 ensureLobby-using specs have `test.afterAll` calling `cleanupTestUsers` (+ `cleanupTestRooms` where rooms were created) with spec-specific regex
- [ ] AC3 — Backfill dry-run report lists matched test users and explicitly shows the 3 real owners as preserved
- [ ] AC4 — Backfill apply reduces `data/users/` to the 3 real owners + intentional fixtures only; no real-user dir touched
- [ ] AC5 — Full E2E suite (`npm run test:e2e`) → `data/users/` count after the run equals the count before the run (zero net add)
- [ ] AC6 — `npm run build` succeeds; full vitest + playwright suite passes; no regression on T100 (vitest isolation still works)
- [ ] AC7 — Real owner accounts (Marcel Donges's Room, Admins's Room, Marcel Surface Mini per S14 audit) untouched by both helper and backfill

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
