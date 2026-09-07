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

## ★ FULL BLAST RADIUS (measured HEAD vs staged, all 9 — READ ONLY)
**Headline: ZERO members silently dropped. createdAt rewritten on ALL 9. 4 member-name blanks. All 9 fully recoverable from HEAD (clean).**

| room | name | real? | members | createdAt | name blanks |
|---|---|---|---|---|---|
| 2b1921a9 | Christine Dawood's Room | REAL | 7→7 (0 dropped) | REWRITTEN | none |
| 3231db71 | Marcel dnd test room | test-named, real members | 6→6 | REWRITTEN | Marcel Donges (c09087ec)→"" |
| 3ec1bf6e | GRG TREFF | REAL | 5→5 | REWRITTEN | none |
| 6c04f959 | 🤍 Heartspaces ❤️ (MM double-state) | REAL | 7→7 | REWRITTEN | none |
| 8be52aa9 | Marcel Donges's Room | REAL (11 ppl: Sebastian Roscher, Werner Hölzl, Lindar Winnie Otieno…) | 11→11 | REWRITTEN | none |
| a16262b8 | System Evidence — T37.21 | TEST | 3→3 | REWRITTEN | SystemTester (ce981242)→"" |
| b3efa337 | Semvec Hackathon | REAL | 5→5 | REWRITTEN | none |
| cc3294d0 | Amos Donges's Room | REAL | 3→3 | REWRITTEN | Amos Donges (8d9be587)→"" |
| edd7fa61 | Marcel Owner Test Room | test-named, real owner | 2→2 | REWRITTEN | Marcel Donges (c09087ec)→"" |

- **≈6 REAL rooms + 3 test-named** (but 3231db71/edd7fa61 hold real members). Only a16262b8 is purely a test/evidence room.
- **createdAt REWRITTEN on 9/9** — every room lost its true creation time (+ joinedAt churns per the persist code, a lesser loss).
- **4 name-blanks across 4 rooms, 3 distinct people:** Marcel Donges (c09087ec, in 3231db71 + edd7fa61), Amos Donges (cc3294d0), SystemTester (a16262b8). The rest of each room's members keep their names.
- **★★ ZERO members DROPPED** — member counts identical HEAD→staged in all 9. The feared silent people-loss did NOT occur. This also refines the mechanism: the incident fired the PERSIST-side name-blank + createdAt-reset, NOT the load-side profile-less DROP (that drop remains a LATENT risk needing guard #1/#5, but it did not trigger here).
- **Recovery: 100% from HEAD** — HEAD carries correct names + createdAt for all 9; the corruption is only staged/working. PO preserve-then-restore (checkout from HEAD) fully recovers. Note HEAD already carries pre-existing blank OWNER names (own condition, not this incident).

## GUARD DESIGN (PO-approved, by-construction + gateable) — for the expert
The chokepoint: ALL Room-unit writes must pass ONE guard. Prefer a **Room persist-policy on UnitController.apply** (registerPolicy for ior:class:Room — same seam as the Task FSM policy) so every Room write is gated; if Room.persistMembers writes via idx.put directly, either route it through UnitController.apply or place the guard in that write. Guards #1/#2 make the common case correct; #5 makes the whole class IMPOSSIBLE.

1. **Non-destructive name (read-before-write):** in the Room→unit serialize, for each member, if the in-memory `m.name` is EMPTY, read the member's LAST-KNOWN name from the stored unit and write THAT, never `""`. A save may add/keep a name, never downgrade non-empty→empty. Gate: unit-test — persist a room whose in-memory member has name="" over a stored name="X" → the written unit keeps "X".
2. **Immutable timestamps:** `createdAt` = the stored unit's createdAt (or this.createdAt only when genuinely loaded), NEVER `Date.now()` on an existing unit. `joinedAt` = the member's ORIGINAL joinedAt (persist it on the member; stop `joinedAt: Date.now()` on every save). Gate: re-persist an existing room twice → createdAt + every joinedAt byte-identical across saves.
3. **Cleanup scoped to its deletion-set:** the cleanup tool operates on an EXPLICIT allowlist of target uuids and writes/deletes ONLY those; it NEVER re-persists a bystander unit. Gate: run the cleanup with a probe bystander room in the store → assert 0 writes to any uuid outside the deletion set (mtime/hash unchanged).
4. **Restore the regen-model R40.81 guard** (the −7 refuse-to-write-post-flip lines) AND `git blame`/`git log -S` the removal to find WHO removed it + why (a silently-deleted safety guard is its own finding). Gate: check-regen-guard test — with MODEL_STORE_SOURCE=scenario-index, regen-model exits non-zero (refuses).
5. **★ Persist-invariant gate (class-killer):** BEFORE writing a Room unit, diff it against the stored unit; REFUSE (throw/RED) if any member name goes non-empty→"" OR createdAt changes on an existing unit. This catches the whole class even if #1/#2 have a bug — a destructive identity write cannot land. **Drift-injection BITE (stub-must-fail):** a test that attempts a name-blanking / createdAt-moving save asserts it is REFUSED; remove the guard → the BITE goes green → the gate is RED. This is the "0 identity-fields blanked on save" invariant, enforced by construction. Add to ci:gates.

Sequence for the expert: guard #5 FIRST (the safety net — makes further damage impossible immediately, even before the repair), then #1/#2 (correctness), #3 (scope the cleanup), #4 (restore regen guard + blame). The repair (restore the 9 from HEAD) runs AFTER #5 is in place so a re-persist during repair can't re-corrupt.
