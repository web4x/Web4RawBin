[Back to Sprint 14 Planning](./planning.md)

# T99: Remove Legacy Load Path + Files — ⛔ GATED

[task:uuid:99d4f6a8-5ea0-4c13-8d79-4f6a8c0d1e99]

## ⛔ GATE — DO NOT START until BOTH conditions hold
1. **T98 verification PASSES** (no-data-loss proof committed), AND
2. **Tron explicitly authorizes** the legacy deletion.

This task **NEVER auto-runs**. No agent may begin implementing until both gate
conditions are satisfied and recorded in the QA Audit section below. Destructive +
irreversible (deletes code + data files) — the gate is non-negotiable.

## Status
- [ ] Planned (BLOCKED by gate)
- [ ] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Design (robbin-architect) — safe-delete sequence (POST-GATE ONLY)

Destructive + irreversible. The expert executes this ONLY after BOTH gate conditions (T98 PASS + Tron auth) are recorded. Strict ordering — backup precedes any delete; code-path removal precedes file delete so the running server never reads half-deleted state.

### Step 0 — GATE CHECK (refuse otherwise)
Read `data/migration/verify-report.json`; require `PASS:true`. Read the GATE LOG below; require Tron authorization recorded. If either missing → ABORT, do nothing.

### Step 1 — BACKUP (rollback point)
`tar -czf data/migration/backup-pre-T99-<UTC>.tgz data/rooms data/users` (whole user tree + flat rooms). Store the tar PATH + sha256 in the GATE LOG. This is the rollback artifact — verify it's readable (`tar -tzf` lists expected entries) BEFORE proceeding.

### Step 2 — REMOVE legacy CODE path (before deleting files)
In server.ts: remove the legacy `roomManager.loadFromDisk(data/rooms)` call so per-user scan is the sole source of truth. Rebuild. Restart. Confirm server loads rooms ONLY from per-user dirs (room count unchanged vs per-user count). Doing code-first means even if file-delete is interrupted, the server already ignores the flat dir.

### Step 3 — DELETE legacy files (idempotent, scoped)
Only after Step 2 verified:
- `rm -rf data/rooms/` (the 239 flat duplicates — all proven present per-user by T98).
- Remove the original `data/users/token-*` dirs that T97 copied to UUID dirs — delete ONLY tokens listed in `token-remap.json` (never a glob that could catch a non-migrated dir). For each remap entry: confirm `data/users/<newUuid>/` exists and is populated, THEN `rm -rf data/users/<oldToken>/`.
- Do NOT touch `data/users/_unowned/` (quarantine stays until Tron reviews).

### Step 4 — POST-DELETE verification
- Re-run T98 verifier (or a subset): zero `token-*` dirs remain; zero `data/rooms/`; `/api/health` room count == per-user count (no legacy inflation, no loss).
- Full E2E suite green.

### Rollback
If anything fails at Steps 2-4: `rm -rf data/rooms data/users && tar -xzf <backup>.tgz` restores the exact pre-T99 state. Document rollback trigger in GATE LOG.

### Scope guards
- Never `rm -rf` with a glob that could match UUID dirs — token deletion is driven by the explicit remap table only.
- Backup is mandatory and verified-readable before any delete.
- All deletes are idempotent (re-run safe).

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
