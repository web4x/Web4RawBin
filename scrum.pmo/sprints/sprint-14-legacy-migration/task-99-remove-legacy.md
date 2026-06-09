<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T99: Remove Legacy Load Path + Files — ⛔ GATED

[task:uuid:99d4f6a8-5ea0-4c13-8d79-4f6a8c0d1e99]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [requirement:uuid:44d4e5f6-a7b8-4c93-9da4-2e3f4a5b6c04](./requirements.md) — R14.4 remove legacy (gated)
  - [Sprint 14 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R14.4 in [requirements.md](./requirements.md)
  - **use case:** remove-legacy (architect — diagrams/migration-workflow.puml)
  - **puml:** [diagrams/migration-workflow.puml](./diagrams/migration-workflow.puml) (pending architect)
  - **class/method:** server.ts legacy roomManager.loadFromDisk removal; delete data/rooms/, legacy token dirs
- gated-by
  - [T98](./task-98-verify.md) verification PASS — AND Tron authorization

## Task Description

After the gate clears: remove the legacy load path in server.ts (so per-user
becomes the sole source of truth), delete legacy `data/rooms/*.json` and any
migrated-away `token-<timestamp>` dirs. Destructive — keep a one-shot backup
(tar) before deletion per architect's design.
_(Architect designs the safe-delete + backup; expert executes ONLY post-gate.)_

## Acceptance Criteria

- [ ] AC0 (GATE): T98 PASS committed AND Tron authorization recorded in QA Audit — verified before ANY other AC
- [ ] AC1: Legacy roomManager.loadFromDisk path removed; per-user scan is sole source of truth
- [ ] AC2: data/rooms/ legacy files removed (after backup tar)
- [ ] AC3: Migrated-away token-<timestamp> dirs removed (after backup)
- [ ] AC4: Server starts clean; /api/health room count == per-user count (no legacy inflation)
- [ ] AC5: Full suite green; no regression
- [ ] `npm run build` + version bump + sw.js cache

## Dependencies

- **Requires:** T98 PASS + Tron authorization (HARD GATE — see top)
- **Enables:** None (sprint close)

## Definition of Done

- [ ] Gate satisfied + recorded; all AC met; chain links resolve
- [ ] Backup taken; tests pass; build clean
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-26: Tron directive — legacy delete must be GATED on verify PASS + Tron authorization; never auto-run. Quote pending req.
- GATE LOG (fill at gate time): [ ] T98 PASS commit: ____ · [ ] Tron authorization: ____

## Subtasks

None (atomic task).

---
*Sprint 14 — Legacy Data Migration*
*Owner: robbin-architect (safe-delete design), robbin-expert (execute POST-GATE only), robbin-tester (verify)*
*Priority: 3 (delete phase — GATED, runs last)*
