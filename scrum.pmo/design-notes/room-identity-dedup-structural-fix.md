# Room Identity Dedup — Structural Fix (design)

**Author:** robbin-architect · 2026-07-01. Trigger: Heartspaces shows 3 Marcel Donges (2703628c tombstoned, <user-token> tombstone-lost, 8f74dfba primary) + SystemTester = 4 members. Measured against src/ts/server/Room.ts + server.ts at HEAD.

## Root causes (measured)
1. **CONSOLIDATE never cleans room membership.** Handler (server.ts:2102-2140) sets `friend.redirectTo = myToken` + `saveProfiles()` but touches NO room's `members` map. The absorbed (tombstoned) profile stays a member forever.
2. **`room.members` is keyed by clientId, deduped only in SOME output paths.** `Room.resolveToken` exists (Room.ts:106, injected server.ts:368 = `userProfiles.get(t)?.redirectTo || t`). `allMemberInfo()` (Room.ts:313-320) keys by resolved token → dedups in that ONE output. But `room.members.size` (memberCount broadcasts), the JOIN handler (server.ts:1840 maps raw `members.values()`), and the raw map itself are NOT deduped → 4 entries visible.
3. **`redirectTo` is not immutable / not restart-durable.** <user-token> lost its `redirectTo` — a reconnect or IDENTIFY of the tombstoned token re-saved the profile without it. A tombstone must be permanent.

## Structural fix — make dup IMPOSSIBLE (3 parts + invariant + repair)

### (a) ROOM LOAD: filter members through resolveToken + DEDUPLICATE
In the Room constructor / persisted-member load (Room.ts:126-137): map each persisted member's `playerToken` through `Room.resolveToken`; group members by resolved-primary token; keep ONE per identity (prefer the entry whose token IS the primary and/or the non-disconnected/most-recent one), drop the rest. Result: `room.members` holds ≤1 entry per real identity at load — not just in one display path.

### (b) CONSOLIDATE: actively evict the absorbed profile from ALL rooms
In the CONSOLIDATE handler, AFTER `friend.redirectTo = myToken`: iterate `roomManager` rooms; for each, remove every member whose `playerToken === targetToken` (and any that now `resolveToken()` to `myToken` while a primary entry exists), broadcasting `MEMBER_LEFT` + corrected `memberCount`. Live cleanup immediately, not only on next load. If the primary isn't yet a member of a room the tombstone was in, re-key that member entry to the primary token rather than deleting (preserve presence).

### (c) CONNECT: redirect a tombstoned connection to the primary, add NO new member
In IDENTIFY/JOIN: resolve the connecting token via `resolveToken`. If `profile.redirectTo` is set → the effective identity is the PRIMARY: send `TOKEN_REDIRECT` (mechanism exists, server.ts:2017-2018) and `addMember` UNDER the primary token — never create a second member entry for the tombstone. **And `redirectTo` becomes IMMUTABLE:** every profile save preserves it; IDENTIFY on a redirectTo'd token redirects + never re-mints/clears it (fixes Bug 2 / restart durability).

### Invariant: addMember is identity-idempotent
`Room.addMember` (Room.ts:171) already re-keys on same `playerToken` (reconnect, :186-192). Extend: dedup on RESOLVED token — if a member already exists whose `resolveToken(playerToken)` equals the new member's resolved token, RE-KEY that entry (update ws/id) instead of inserting a second. Then even a stale path can't create a dup. Also fix the inconsistency: memberCount + the JOIN output (:1840) should use `allMemberInfo()` (resolved+deduped), not raw `members`.

### One-time repair (migration, gated)
Heartspaces + profiles.json are already corrupted: (1) re-tombstone <user-token> → `redirectTo = 8f74dfba` (the lost tombstone); confirm 2703628c → 8f74dfba; (2) collapse the 3 Marcel member entries in the Heartspaces room to the single primary 8f74dfba. Dry-run + count first (never silently drop a real member).

## Traceability (SCENARIO FIRST — TRON #126)
This is a structural bugfix; the chain must exist BEFORE the expert codes it. Recommend req mint a requirement (e.g. "Room membership deduplicates by resolved identity; consolidation evicts tombstones; redirectTo is immutable + restart-durable") with UCs I then refine:
- `room.dedupMembersOnLoad` → Room (load-time collapse)
- `consolidate.evictAbsorbedFromRooms` → the CONSOLIDATE handler
- `connect.redirectTombstoneToPrimary` → IDENTIFY/JOIN (+ redirectTo immutability)
- `room.addMemberIdempotent` → Room.addMember invariant
Class = Room (+ server identity handlers). The one-time repair = a gated migration task.
