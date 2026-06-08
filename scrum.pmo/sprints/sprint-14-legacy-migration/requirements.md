[Back to Planning](./planning.md)

# Sprint 14 — Legacy Data Migration — Requirements

Safe, verified migration of legacy on-disk data to the per-user / UUID model,
then a GATED removal of legacy code+files. Per
[traceability standard](../../standards/traceability-standard.md): each
requirement carries a `[requirement:uuid]` + forward link to its task.

> **req-eng:** authoring authority for requirement text + literal Tron quotes.
> Entries below are planner scaffolding — refine wording/quotes; keep the UUIDs
> and forward links stable so task chain up-links don't break.
> **architect:** designs the safe migration (idempotent, reversible until delete);
> diagrams in diagrams/.

## Background (from T93 root-cause, 27ef9c6/492221a)
Legacy `data/rooms/*.json` (~191) shadows per-user `data/users/<token>/rooms/*/room.json`
(~173) at startup. Two legacy shapes to migrate: (1) legacy room files → per-user
rooms; (2) `token-<timestamp>` user dirs → UUIDv4 token dirs.

## Requirements

- [ ] R14.1 — Migrate legacy `data/rooms/*.json` into the per-user room model
  (`data/users/<token>/rooms/<uuid>/room.json`), idempotently and without data loss.
  [requirement:uuid:14a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f01]
  > Tron (via R-R1/T93 root-cause): "i created more than one room. but only one showes up in the lobby. when a user connects all his rooms should show up in the lobby and being loaded from disk." — Legacy rooms shadow per-user rooms; migration required.
  → [T96](./task-96-migrate-rooms.md)

- [ ] R14.2 — Migrate legacy `token-<timestamp>` user directories to UUIDv4 token
  directories, updating all references, idempotently and without data loss.
  [requirement:uuid:24b2c3d4-e5f6-4a71-9b82-0c1d2e3f4a02]
  > Tron (via T97, 2026-05-26): "migrate to UUID v4, do NOT delete." — 141 token-timestamp dirs → UUIDv4.
  → [T97](./task-97-migrate-userdirs.md)

- [ ] R14.3 — Prove migration integrity: every legacy record maps to exactly one
  migrated record, counts reconcile, no data loss — an auditable proof.
  [requirement:uuid:34c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b03]
  > Tron (via T98): No direct quote — derived from R-R1 root-cause: migration integrity must be auditable before legacy deletion.
  → [T98](./task-98-verify.md)

- [ ] R14.4 — Remove legacy load path (code) + legacy files, ONLY after verify
  passes AND Tron authorizes. Must NEVER auto-run.
  [requirement:uuid:44d4e5f6-a7b8-4c93-9da4-2e3f4a5b6c04]
  > Tron (via T99): "Tron explicitly authorizes the legacy deletion." — Gated: NEVER auto-runs.
  → [T99](./task-99-remove-legacy.md) — **GATED**

## Forward Traceability
| Requirement | Task | Use case | PUML | Class/method |
|-------------|------|----------|------|--------------|
| R14.1 | T96 | migrate rooms workflow | diagrams/migration-workflow.puml | server.ts roomManager.loadFromDisk / scanAllRooms; Room.fromPersisted |
| R14.2 | T97 | migrate user dirs workflow | diagrams/migration-workflow.puml | UserKeys/token dir handling; profiles.json token refs |
| R14.3 | T98 | verify/no-data-loss | diagrams/migration-workflow.puml | migration verifier (new) |
| R14.4 | T99 (GATED) | remove legacy | diagrams/migration-workflow.puml | server.ts legacy loadFromDisk removal; data/rooms delete |

## Sequence (HARD constraint)
```
T96 migrate-rooms ┐
                  ├─→ T98 verify ──[Tron AUTHORIZATION gate]──→ T99 remove-legacy
T97 migrate-userdirs ┘
```
T99 NEVER auto-runs. Requires (a) T98 verify PASS and (b) explicit Tron authorization.

---
**Sprint:** Sprint 14 — Legacy Data Migration
**Created:** 2026-05-26
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md)
