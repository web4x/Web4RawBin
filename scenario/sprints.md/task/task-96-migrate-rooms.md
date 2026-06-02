# T96: Migrate Legacy data/rooms → Per-User Room Model
[task:uuid:96a1c3e5-2b7d-4f10-9a46-1c3e5f7a9b96]

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

- up
  - [requirement:uuid:14a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f01](./requirements.md) — R14.1 migrate legacy rooms
  - [Sprint 14 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R14.1 in [requirements.md](./requirements.md)
  - **use case:** migrate-rooms workflow (architect — diagrams/migration-workflow.puml)
  - **puml:** [diagrams/migration-workflow.puml](./diagrams/migration-workflow.puml) (pending architect)
  - **class/method:** server.ts roomManager.loadFromDisk / scanAllRooms; Room.fromPersisted
- context
  - T93 root cause (27ef9c6): legacy data/rooms shadows per-user scan at startup

## Task Description

Migrate legacy `data/rooms/*.json` into `data/users/<token>/rooms/<uuid>/room.json`.
Idempotent (safe to re-run); no data loss. Each legacy room mapped to its owner's
per-user dir. Rooms already present per-user are skipped (no duplication).
_(Architect designs the safe/idempotent algorithm; req confirms requirement text.)_

## Acceptance Criteria

- [ ] AC1: Every legacy `data/rooms/<id>.json` whose `<id>` already exists per-user is SKIPPED — the per-user copy is NEVER overwritten (no schema regression). [239/239 today]
- [ ] AC2: A genuine legacy-only room (id absent from all per-user dirs) is copied forward; with no resolvable owner it is quarantined under `data/users/_unowned/rooms/<id>/` and REPORTED (count + ids) — never silently dropped, never deleted. [0 today]
- [ ] AC3: Idempotent — re-running migrates nothing new, creates no duplicates, mutates no existing per-user room.json
- [ ] AC4: No data loss — legacy `data/rooms/*.json` files left UNTOUCHED (copy, not move; deletion is T99, gated)
- [ ] AC5: Per-room outcome logged: migrated | skipped(already-per-user) | orphan-quarantined; summary counts emitted
- [ ] AC6: Migration adds NO new code dependence on the flat `data/rooms/` dir
- [ ] `npm run build` + version bump

## QA Audit & User Feedback

- 2026-05-26: Tron directive — legacy data migration. Quote pending req.

## Subtasks

None (atomic task).

---
*Sprint 14 — Legacy Data Migration*
*Owner: robbin-architect (design), robbin-expert (implement), robbin-tester (verify)*
*Priority: 1 (migrate phase)*
