# T97: Migrate token-<timestamp> User Dirs → UUIDv4
[task:uuid:97b2d4f6-3c8e-4a11-8b57-2d4f6a8b9c97]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — T98 verify)
- [ ] QA Review
- [ ] Done

## Traceability

**Tests:**
- [🔗 R14.1/R14.2](../test/r14-1-r14-2.md)


## Traceability

- up
  - [requirement:uuid:3465dfd3-6fec-4b69-a643-7e379fa3e2d7](./requirements.md) — R14.2 migrate user dirs to UUIDv4
  - [Sprint 14 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R14.2 in [requirements.md](./requirements.md)
  - **use case:** migrate-userdirs workflow (architect — diagrams/migration-workflow.puml)
  - **puml:** [diagrams/migration-workflow.puml](./diagrams/migration-workflow.puml) (pending architect)
  - **class/method:** UserKeys/token-dir handling; profiles.json + devices.json token refs; per-user rooms paths

## Task Description

Migrate legacy `token-<timestamp>` user directories to UUIDv4 token directories,
updating ALL references (profiles.json, devices.json, room owner tokens, .ssh paths).
Idempotent; no data loss. Old token is mapped → new UUIDv4 consistently everywhere.
_(Architect designs the reference-rewrite + ordering; req confirms requirement text.)_

## Acceptance Criteria

- [ ] AC1: Every `token-<timestamp>` dir is copied to a fresh UUIDv4 dir (141 → 141 new UUID dirs)
- [ ] AC2: In each copied dir, ALL `rooms/*/room.json` `ownerToken` (+ any `creatorId`/`creatorToken`) rewritten from the old token to the new UUID — zero `token-` strings remain in the copies (171 refs rewritten)
- [ ] AC3: A persisted remap table `data/migration/token-remap.json` (old→new) is produced for T98
- [ ] AC4: profiles.json correctly handled — no-op on current data (0 token-* profiles); defensive rekey+redirect branch present for any future token-* profile
- [ ] AC5: Idempotent — re-run is a no-op; already-UUID dirs untouched
- [ ] AC6: No data loss — copy-then-verify; original token-* dirs left intact (removal deferred to T99, gated)
- [ ] `npm run build` + version bump

## QA Audit & User Feedback

- 2026-05-26: Tron directive — legacy data migration. Quote pending req.

## Subtasks

None (atomic task).

---
*Sprint 14 — Legacy Data Migration*
*Owner: robbin-architect (design), robbin-expert (implement), robbin-tester (verify)*
*Priority: 1 (migrate phase)*
