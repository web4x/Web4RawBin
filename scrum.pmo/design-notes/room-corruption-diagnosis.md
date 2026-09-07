# Room-corruption diagnosis — blanked member name + rewritten createdAt (robbin-architect, 2026-09-07)

PO routed: is the staged corruption on 9 room units (member name blanked, timestamps rewritten) the blast radius of the PO-ordered test-room cleanup, and can the tool still do it to another room? Analysis is READ-ONLY on the 9 paths (never staged/committed).

## Corruption confirmed (room 3231db71, staged)
- `createdAt`: `1788693405565` → `1788735733886` (reset ~11.75h forward — the original creation time LOST).
- member `name`: `"Marcel Donges"` → `""` (Tron's own name blanked).

## The two migration scripts are NOT the recent corruptor (exonerated by measure)
- **migrate-one-store.ts** = a BYTE-IDENTICAL copy that NEVER overwrites (`fs.writeFileSync(dest, bytes)` line 97, `if (fs.existsSync(dest)) …never overwrite` line 94). It cannot blank a name or reset a timestamp — it copies verbatim into empty dests. NOT the corruptor.
- **regen-model.ts** — audit log (`data/logs/regen-model-audit.log`) shows its last run was **2026-08-08**, not today → did NOT produce this. **BUT a SAFETY GUARD was removed from it** (unstaged edit, −7 lines): the R40.81 post-flip "REFUSE to write the FROZEN model-store (invisible to live reads)" check. That deletion is a SEPARATE latent hazard — restore it; a guard that refuses-to-write-post-flip must not be silently removed.

## The actual HAZARD (scan the hazard, not the actor) — a lossy room re-persist
The corruption fingerprint (name→"" AND createdAt reset) matches the LIVE room-persist path, `Room.persistMembers` (R19.35, Room.ts ~:401):
```
members: [...this.members.values()].map(m => ({ ior, name: m.name, …, joinedAt: Date.now() })),
createdAt: this.createdAt,
```
Three data-hazards in this one serialize:
1. **`name: m.name` overwrites a good stored name with `""`** — if the in-memory member has no name (reconstructed room, or a member whose PROFILE was deleted), the save PERSISTS the blank over the good data. No "never overwrite a non-empty name with empty" guard.
2. **`joinedAt: Date.now()`** resets on EVERY save (original join time churned).
3. **`createdAt` change** ⇒ the room was RECONSTRUCTED (fresh `this.createdAt` from the constructor), not loaded-preserving-createdAt.
And the LOAD path (Room.ts:108-109, :349) DROPS a member whose token "has no profile (deleted profile → orphan)". So a member's identity here is coupled to their PROFILE existing.

## Verdict on the PO's hypothesis: SUPPORTED — this is the cleanup's blast radius
The PO-ordered test-data cleanup ("don't spam me with test rooms") deleted test rooms/PROFILES. If it deleted a profile a REAL room's member depends on — or re-persisted a real room while profiles were missing — the room re-saves with that member's name blanked (hazard 1) and, if reconstructed, a fresh createdAt (hazard 3). 2 of the 9 being SystemTester's own rooms fits a test-cleanup that reached one real room (3231db71) as collateral. **Deliberate migration, buggy (lossy) output — the PO's order's blast radius, not a rogue process.** (One link unconfirmed by me: the exact operation that re-persisted 3231db71 — server cleanup op vs a specific handler — SM/whoever-ran-the-cleanup can name it; the HAZARD stands regardless of the trigger.)

## CAN IT RECUR? YES — and the tool must not survive as-is
Any room re-persisted while a member's profile is missing (or the room is reconstructed) will corrupt it the same way. Required guards (by-construction, gate-able):
1. **Non-destructive identity on persist:** NEVER overwrite a stored non-empty member `name` with `""` — if the in-memory name is empty, PRESERVE the last-known persisted name (a save must not blank identity).
2. **Immutable timestamps:** `createdAt` and `joinedAt` are preserved on re-persist, never `Date.now()`-reset. (createdAt especially — it is a creation fact, not a save fact.)
3. **Scope the cleanup:** the cleanup tool must touch ONLY the rooms/profiles in its DELETION set — never re-persist a unit outside it. A cleanup that re-serializes bystander rooms is the blast-radius bug; delete-set-only by construction.
4. **Restore the regen-model R40.81 guard** (separate).
5. **A persist-invariant gate:** a room save that would blank a non-empty name or move createdAt = REFUSE/RED (drift-injection BITE). This is the "0 identity-fields blanked on save" invariant.

## Handling the 6c04f959 double-state (PO flag)
`6c04f959` is `MM` (staged AND working-tree modified) — restore must reconcile BOTH states: preserve-out both the staged and working versions (hashes), then path-limited checkout from HEAD, verify the restored unit == HEAD (name + createdAt intact), no index reset. Per the PO preserve-then-restore mechanism.

## Do NOT
Commit any of the 9 room paths (3231db71 cc3294d0 a16262b8 2b1921a9 3ec1bf6e 6c04f959 8be52aa9 b3efa337 edd7fa61) — any commit touching them ships the blank + timestamp rewrite. Path-limited commits (this note) are immune; verify `git show --stat`.
