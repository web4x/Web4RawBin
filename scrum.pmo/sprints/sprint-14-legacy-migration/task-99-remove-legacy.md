[Back to Sprint 14 Planning](./planning.md)

# T99: Remove Legacy Load Path + Files — ⛔ GATED

[task:uuid:99d4f6a8-5ea0-4c13-8d79-4f6a8c0d1e99]

## ⛔ GATE — DO NOT START until BOTH conditions hold
1. **T98 verification PASSES** (no-data-loss proof committed), AND
2. **Tron explicitly authorizes** the legacy deletion.

This task **NEVER auto-runs**. No agent may begin implementing until both gate
conditions are satisfied and recorded in the QA Audit section below. Destructive +
irreversible (deletes code + data files) — the gate is non-negotiable.

## Status — implementing DONE (v0.5.20) — write path removed + proven; awaiting tester UI verify, then Tron QA
Gate held correctly (both conditions logged pre-delete). The post-delete regeneration
(data/rooms reappeared 19:57 via Room.persist's DUAL-WRITE) is now FIXED: v0.5.20
(9c1b0a0) removed the dual-write + dead loadFromDisk/fromPersisted/setPersistDir.
Planner code-verified 2026-05-27: src/ has NO data/rooms write/load path (only T99
removal-marker comments in Room.ts:273,292 + server.ts:210). Live filesystem: data/rooms
ABSENT while per-user rooms present (3 users). Expert runtime proof: createRoom().persist()
writes per-user ONLY, restart → rooms=3 from per-user, data/rooms stays absent.
Remaining: tester independent UI room-create verification, then Tron QA.
- [x] Planned (gate cleared)
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert) — read-path removal + delete (ec0423d) AND dual-WRITE removal (9c1b0a0 v0.5.20); code-verified no legacy write/load path remains
  - [ ] testing (tester — independent UI room-create must confirm data/rooms stays gone)
- [ ] QA Review
- [ ] Done

## GATE LOG (both conditions MET before execution)
- [x] **(a) T98 PASS** — data/migration/verify-report.json `PASS:true` (v0.5.17; PO-confirmed: 3 rooms, 141 bijective remap, 0 dangling).
- [x] **(b) Tron deletion authorization** — granted 2026-05-26 (relayed via robbin-po).

## Execution (robbin-expert, 2026-05-26, v0.5.19)
- **Step 0 gate check:** verified verify-report.json PASS:true + Tron auth recorded; CONFIRMED all 3 real rooms present in per-user dirs (99e6a422+c5899b10 under 3dca7f5e, fe4d5664 under f4798dae) so removing the legacy path is loss-free.
- **Step 1 backup:** web4rawbin-pre-T99-backup-20260526T175321Z.tar.gz (65M), verified readable (3 data/rooms + 141 token dirs), sha256 4359315d41c38b77b4e40899a435d13c789c15a33d8b66968ec68bb55faca640.
- **Step 2 code (AC1):** removed `roomManager.loadFromDisk()` call (server.ts) → per-user UUID scan is the SOLE load source. Restarted v0.5.19 → rooms=3 (unchanged) BEFORE any delete — proved per-user-only load.
- **Step 3 files (AC2/AC3):** deleted data/rooms/ (3 redundant, all per-user-present); deleted 141 token-* ORIGINAL dirs via the remap table (guarded: each old token confirmed to have a populated UUID target first; never a glob; 0 skipped). _unowned untouched (none existed — 0 orphans). per-user rooms intact = 3.
- **Step 4 verify (AC4):** restarted → /api/health=0.5.19 rooms=3; the 3 real rooms (Marcel Donges's Room, Admins's Room, Marcel Surface Mini) load from per-user ONLY. Zero loss post-deletion. 0 token-* dirs, no data/rooms.
- Rollback artifact retained.

## COMPLETION (robbin-expert, 2026-05-26, v0.5.20) — kill the dual-WRITE (verify caught regen)
PO/verify caught it: data/rooms REGENERATED at 19:57 after deletion — Room.persist's dual-write recreated the 3 files. "Consistently removed" requires removing the WRITE, not just files. Done:
- (1) Room.persist: removed the `if (this.persistDir)` legacy-write block — rooms persist ONLY to per-user/UUID (writeRoomJson).
- (2) RoomManager constructor: dropped the `'data/rooms'` default + persistDir field (now takes an ignored optional legacy arg for call-site compat); createRoom no longer setPersistDir.
- (3) removed the dead `loadFromDisk` method + `fromPersisted` + `setPersistDir` + `removePersisted` (Room.ts) — all legacy-only, no longer called. removeRoom drops in-memory only (per-user dir delete stays in the server DELETE_ROOM handler).
- (4) deleted the regenerated data/rooms/ + dir.
- (5) VERIFY: runtime proof (tmp DATA_DIR) — `createRoom(...).persist()` writes per-user room.json ONLY, data/rooms NOT created. Restart → /api/health rooms=3 (3 real rooms load from per-user) AND data/rooms stays absent. Legacy write path truly gone.
- v0.5.20, sw.js rawbin-v0.5.20. Tester: full-suite regression + re-confirm no data/rooms AFTER a UI room-create.

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
