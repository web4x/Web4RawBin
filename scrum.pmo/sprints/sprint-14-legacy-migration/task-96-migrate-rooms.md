[Back to Sprint 14 Planning](./planning.md)

# T96: Migrate Legacy data/rooms → Per-User Room Model

[task:uuid:96a1c3e5-2b7d-4f10-9a46-1c3e5f7a9b96]

## Status
- [ ] Planned
- [ ] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Data Findings — on-disk reality (robbin-architect, 2026-05-26, measured)

**The flat `data/rooms/` is already a STALE DUPLICATE of the per-user structure.** Measured:
- `data/rooms/*.json`: **239** legacy flat rooms.
- per-user room dirs (`data/users/*/rooms/<id>/`): **239** unique ids.
- **In BOTH: 239. Legacy-ONLY (need migrating): 0.**

So every legacy flat room ALREADY exists per-user. The per-user copy is the AUTHORITATIVE, newer schema (`ownerToken` + `sshPublicKey` + `sshKeysGenerated`); the flat copy is the OLD schema (`creatorId`, no ownerToken; 181/239 have `creatorId:"dormant"`). They are NOT byte-equal — per-user supersedes flat.

**Implication:** T96 is NOT a bulk data move. A blind copy would be DANGEROUS — it could overwrite a newer per-user `room.json` with the older flat schema (data regression). T96 = a safe, idempotent reconciler that migrates ONLY genuine legacy-only orphans (0 today) and NEVER overwrites an existing per-user room. The flat files are deleted in T99 (gated), not here.

## Design (robbin-architect)

### Algorithm — `migrateLegacyRooms()` (idempotent, copy-not-move, never-overwrite)

For each `data/rooms/<id>.json`:
1. If `data/users/<owner>/rooms/<id>/room.json` already exists for ANY owner → **SKIP** (already migrated; do NOT touch the per-user copy). This covers all 239 today.
2. Else (legacy-only orphan): resolve owner:
   - The flat schema's `creatorId` is an old ws-client id or `"dormant"` — NOT a user token. It cannot reliably map to an owner. So a legacy-only room with no resolvable owner is an **ORPHAN**.
   - Orphans are NOT silently dropped and NOT deleted: copy to a quarantine home `data/users/_unowned/rooms/<id>/room.json` (a reserved, non-UUID holding key), and REPORT (count + ids) for Tron review. Never invent an owner.
3. Log per-room outcome: `migrated | skipped(already per-user) | orphan-quarantined`.

Copy semantics: read flat JSON → write to target room.json ONLY if target absent (atomic write to temp then rename). Legacy flat files are left untouched (deletion is T99).

### Why no schema translation is needed for the 239
They're already per-user in the new schema. The reconciler only writes NEW per-user files for true orphans (mapping old fields forward: `id`, `name`, `maxMembers`, `isPrivate`, `roomKey`, `state`, `createdAt`, `chatHistory`; `ownerToken` = `_unowned`; `sshKeysGenerated:false`).

### Server load path (ties to T93)
After migration, `loadFromDisk(data/rooms)` is obsolete — the per-user scan is authoritative. Removing the flat load path is T99 (gated), but T96 must NOT add new dependence on the flat dir.

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
