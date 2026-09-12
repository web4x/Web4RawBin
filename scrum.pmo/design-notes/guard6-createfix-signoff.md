# CREATE-fix (GUARD#6 partial-write) — ARCHITECT SIGN-OFF ✅ (robbin-architect, 2026-09-12)

**Bug:** e73b2af8 (CRITICAL/UNIVERSAL — ALL CREATE_ROOM broken since v0.8.212). **Fix:** v0.8.224 (38e6fa06b), RoomKeys.ts writeRoomJson partial-merge. **SIGNED GREEN.**

## 5-point bar — all GREEN, verified (self + independent tester, not relay)
1. **Partial write PRESERVES stored members** — code: `explicitMembers='members' in data` captured before preserve; on omit `data.members=stored.members`; gate (c) `assertRoomPersistInvariant(…,false)` must-NOT-throw (failable: throw=brick-back=RED). ✅ (architect code-read + gate)
2. **New-user createRoom SUCCEEDS** — tester v0.8.224 ship-bytes rig, real WS path: new distinct-primary-no-redirect user `6a440ff3` → **ROOM_JOINED `6b42a2ab`** (was: silence/GUARD#6 "no redirect"). ✅
3. **Existing-redirect createRoom SUCCEEDS** — rig: `dc531b63`→present-primary `b9a08d58` → **ROOM_JOINED `8f316093`** (was: silence/GUARD#6 "primary absent"). ✅
4. **TEETH — explicit distinct-primary drop STILL REFUSES** — gate teeth assertion `assertRoomPersistInvariant(…,true)` same-drop MUST-throw (failable: no-throw=teeth-lost=RED); `#6` gated on `explicitMembers`, not disabled. ✅ (the false-negative worry is discharged by a failable assertion, not assumption — the guard still loudly refuses a real member-drop)
5. **Benign-dedup still passes** — pre-existing gate assertions unchanged (stub-dropped/primary-present passes). ✅

**Boot-check:** served==committed==0.8.224 (architect node-https self-check, past the cert block) + clean boot, zero GUARD#6 refusals (real prod partial-write signal — existing distinct-primary rooms re-persist clean; pre-fix boot false-refused them). ✅
**Chain-of-custody:** rig = `git worktree reset --hard 38e6fa06b` = ship bytes; rig==served==committed. ✅
**Before/after, same rig:** v0.8.223 = both cases silent-throw → v0.8.224 = both ROOM_JOINED. Two independent methods agree (architect always-false-benign code prediction + rig behavior).

## ★ HONEST CAVEAT (PO condition, stated plainly so rig-green is never mistaken for prod-proven)
**Verified on the ship-bytes rig, NOT exercised on prod — because exercising it (create a room) would leave UNDELETABLE debris while deleteRoom/7b is unshipped, which is the pollution Tron has flagged twice.** The proof on prod is **Tron's next real room create.** Rig-verified + shipped + first-real-create = the proof.

## Next (7b chain-of-custody gate)
7b patch `206014252` applies CLEAN to new HEAD 38e6fa06b; server.ts UNTOUCHED since INC-7a `3f8772a68` (38e6fa06b touched RoomKeys.ts only) → 7b patch base byte-identical → my prior 7b code-verification HOLDS against the unchanged file. At 7b-apply: re-sha-match rig(38e6fa06b+patch)==ship + tester 7b bites fire → I co-verify + sign 7b → ship.
