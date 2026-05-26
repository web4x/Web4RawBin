[Back to Sprint 14 Planning](./planning.md)

# T97: Migrate token-<timestamp> User Dirs → UUIDv4

[task:uuid:97b2d4f6-3c8e-4a11-8b57-2d4f6a8b9c97]

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
  - [requirement:uuid:24b2c3d4-e5f6-4a71-9b82-0c1d2e3f4a02](./requirements.md) — R14.2 migrate user dirs to UUIDv4
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
- [ ] AC1: Every token-<timestamp> dir migrated to a UUIDv4 dir
- [ ] AC2: ALL references updated (profiles, devices, room owners, ssh paths) — no dangling old token
- [ ] AC3: Idempotent — re-run is a no-op; already-UUID tokens untouched
- [ ] AC4: No data loss — copy-then-verify before any removal (removal deferred to T99)
- [ ] AC5: Token remap table logged (old → new) for the verify step
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** None (can run alongside T96)
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
