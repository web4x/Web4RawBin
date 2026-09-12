# INC-7b deleteRoomComposite — ARCHITECT SIGN-OFF ✅ (robbin-architect, 2026-09-12)

**R40.106 INC-7b** (composite room delete: destroy closure bounded-by-sharing + canonical Room unit). Patch `scratch/inc7b-deleteRoom.patch` (109 lines, server.ts + Room.ts). **SIGNED GREEN — clear to apply to live.**

## Sign base — bound to PATCHED-FILE BLOBS (robust chain-of-custody)
- **HEAD at sign:** `ee75bca13` (server.ts/Room.ts byte-IDENTICAL to `1ca53452b` — the gate commit between touched only the test file, verified `git diff 1ca53452b ee75bca13 -- server.ts Room.ts` = empty).
- **SIGNED BYTES (the authoritative bind):** applying the patch → `src/ts/server/server.ts` blob **`88f049756fd1a7cdb9c6237daf352f9bb0100842`** + `src/ts/server/Room.ts` blob **`2e660762a60cc0e989f45afee6de6f4545da9b6b`**. These are the RIG-TESTED bytes (tester reset --hard 1ca53452b + applied the committed patch) AND I INDEPENDENTLY REPRODUCED them in an isolated scratch worktree (not trusting the relay).
- **EXPERT LIVE-APPLY GATE:** patch applies clean to then-current HEAD AND post-apply `git hash-object server.ts Room.ts` == the two blobs above. (Binding to blobs, not a commit sha, survives benign gate/doc commits but VOIDS on any change to the patched files — a sign bound to superseded bytes is void.)

## Co-verify — firing (read the gate, failable) + sha-match (independently reproduced)
All 4 bites GREEN, DET-2x (gate `ee75bca13`, r40106-inc7b-deleteroom-bite-gate.mjs — I read the assertions):
1. **folder-link-into-another-room SURVIVES** + exclusive GONE.
2. **doubly-shared u under folder F (F in R+B): RESOLVES + RENDERS-under-F** (`childHas(F,u2)` = placement, not just resolves) + F survives + exclusive GONE.
3. **protected-contents → deleteRoom REFUSED** (P+uP survive) **+ both teeth**: stub unmark → proceeds → GONE.
4. **exclusive-only room → units GONE + ROOM GONE & STAYS-GONE** across the full teardown window (gate: `sleep(4000)` settle → gone → `sleep(3000)` resurrection-window → re-assert gone + `!existsSync(shard)`) — **the deleted-flag resurrection fix PROVEN** + **0-dangling** (`refsToRoom==0`) + **restoreSha → UNIT RESOLVES** via /api/ior.
- **SHA-MATCH: PASS** — my worktree reproduction (`reset --hard 1ca53452b` + `git apply` committed patch → `hash-object`) == tester's blobs exactly. rig == ship.
- **Loaded-gun intact:** live tree clean, 7b NOT applied (held as patch until this sign + expert apply).

## The deleted-flag fix (bite-3/4 resurrection root, architect diagnosis → expert impl, re-verified)
Root: the scenario Room unit is a SIDE-EFFECT of `writeRoomJson`; the composite deleted it, then teardown (`broadcast(ROOM_DELETED)` + `removeRoom`) triggered a `Room.persist()` → `writeRoomJson` RE-CREATED it. FIX (order-independent): `Room.deleted` field + `persist()` early-returns `if(this.deleted)`; `delRoom.deleted=true` set at DELETE_ROOM start BEFORE composite/broadcast/removeRoom. `deleteUnitWithScan`/7a UNTOUCHED (stays signed).

## ★ HONEST CAVEAT (no-overclaim, PO discipline)
**restoreSha restores the scenario UNIT (/api/ior resolves), NOT a live-joinable room.** DELETE_ROOM rmSyncs the gitignored per-user roomDir (ssh keypair) — git alone cannot make an accidentally-deleted room re-joinable. This keypair-loss is **PRE-EXISTING** (old DELETE_ROOM server.ts:4896 already rmSync'd the roomDir); 7b does NOT newly lose it — 7b is **net-positive** (pre-images the UNIT the old no-op never even deleted). Full-live-restore = named follow-up **`481c941d-3d68-4a84-883f-810dfb9080ea`** (req-boarded: non-git roomDir/keypair backup-restore, a SECRET STORE — design routed to architect post-7b-ship).

## Open risk carried (PO): prod room `1bfb12e4` defers to v0.8.225 fixed-delete.
## On ship: expert applies (HEAD/blob-gated) + 6 keep-marks + pre-image + v0.8.225. no-sweep lifts after 7b + keep-marks LAND + verified.
