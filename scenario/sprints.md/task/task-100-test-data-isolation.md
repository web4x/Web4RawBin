# T100: Test Data Isolation — DATA_DIR Override
[task:uuid:a0b1c2d3-e4f5-4061-8273-849500000100]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] testing (tester — AC1-AC5 PASS; AC4 port-isolated run ed5c5de: prod data/rooms 3→3 sha-identical, tmp got 26 rooms, live stayed up. 7 disk-asserting specs need E2E_DATA_DIR — tester follow-up, not a T100 bug.)
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [requirement:uuid:80ca8e83-fb72-4e3d-874b-af17cd8c2dbf](./requirements.md) — R-T1 test data isolation
  - [Sprint 13 Planning](./planning.md)
  - Tron directive 2026-05-26 (room-flood from E2E into prod)
- down
  - None (atomic task)
- chain
  - **requirement:** R-T1 in [requirements.md](./requirements.md)
  - **use case:** test runs against an isolated data dir, prod untouched
  - **puml:** N/A (test-infra)
  - **class/method:** `server.ts` data-path resolution (introduce `DATA_DIR` env, default to current prod path); Playwright spec server-launch config
- relates
  - Root cause of the same prod-pollution that S14 (Legacy Migration) is cleaning up; T93 multi-room surfaced the room counts. Tester's interim `afterAll` cleanup is a SEPARATE immediate mitigation — T100 is the proper fix.

## Task Description

Make the server's data directory configurable so E2E tests run against an isolated
dir and can never write into prod `data/`.

- **Expert (server.ts):** replace hardcoded `data/` references with a resolved
  base from `process.env.DATA_DIR || '<current default>'`. All readers/writers
  (profiles.json, devices.json, rooms, users/<token>/...) go through the resolved
  base. Default unchanged → zero prod behavior change when DATA_DIR unset.
- **Tester (specs):** launch the test server with `DATA_DIR=<tmp/e2e-data>` (per-run
  temp dir), point specs at it, and clean it between runs. Prod `data/` is never touched.

## Acceptance Criteria

- [ ] AC1: `server.ts` resolves its data base from `DATA_DIR` env (default = current prod path; unset → no change)
- [ ] AC2: ALL data paths (profiles, devices, rooms, users/<token>) honor the resolved base — no stray hardcoded `data/`
- [ ] AC3: E2E specs launch the server with an isolated `DATA_DIR` (tmp) — prod `data/` byte-unchanged after a full E2E run
- [ ] AC4: A test proves isolation: run E2E, assert prod `data/rooms` count unchanged
- [ ] AC5: No regression — prod run (DATA_DIR unset) behaves exactly as before
- [ ] `npm run build` + version bump

## QA Audit & User Feedback

- 2026-05-26: Tron directive (via PO) — E2E flooded prod with test rooms; proper fix is isolated DATA_DIR. Tester interim afterAll cleanup is separate/immediate.
- 2026-05-26: AC4 isolated-run FAILED (reuseExistingServer:true race leaked to prod). PO green-lit; expert added port override (86780fc), tester added E2E_ISOLATED port isolation (playwright.config). Re-run PASSED — prod byte-unchanged, tmp populated. AC4 MET.

## Subtasks

None (atomic task).

---
*Sprint 13 — Stability (Core Workflow Fixes)*
*Owner: robbin-expert (server.ts DATA_DIR), robbin-tester (switch specs)*
*Priority: HIGH — prevents recurrence of prod data pollution*
