[Back to Sprint 14 Planning](./planning.md)

# T96: Migrate Legacy data/rooms → Per-User Room Model

[task:uuid:96a1c3e5-2b7d-4f10-9a46-1c3e5f7a9b96]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing (expert)
  - [ ] testing (tester)
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
- [ ] AC1: Every legacy data/rooms/*.json with a resolvable owner is migrated to per-user
- [ ] AC2: Idempotent — re-running migrates nothing new, no duplicates
- [ ] AC3: No data loss — legacy files untouched until T99 (migration is copy, not move)
- [ ] AC4: Rooms with no resolvable owner are reported (not silently dropped)
- [ ] AC5: Migration logged with per-room outcome (migrated/skipped/orphan)
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** None
- **Enables:** T98 (verify), T99 (remove — gated)

## Definition of Done
- [ ] All AC met; chain links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-26: Tron directive — legacy data migration. Quote pending req.

## Subtasks
None (atomic task).

---
*Sprint 14 — Legacy Data Migration*
*Owner: robbin-architect (design), robbin-expert (implement), robbin-tester (verify)*
*Priority: 1 (migrate phase)*
