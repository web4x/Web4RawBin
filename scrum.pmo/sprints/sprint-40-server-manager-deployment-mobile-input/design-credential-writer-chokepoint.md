# Causes-first: what WRITES raw tokens into tracked units + the by-construction chokepoint (architect, 2026-08-12)

PO class-closer: rotating one token while the WRITERS that produced 254 of them keep running = fixing the artifact, not the bug. The writers re-expose Tron's NEW token on the next boot and expose every future user identically. Design now (incident has attention), SEQUENCE AFTER B1 (B1 unblocks Tron). DESIGN-ONLY.

## Writer inventory — every path that persists a raw token into a tracked unit (measured)
| # | Writer | Site(s) | Credential field written |
|---|--------|---------|--------------------------|
| 1 | Device enroll (connect + enroll) | server.ts:3808, :4010 | Device `ownerToken` = raw token |
| 2 | Room create | Room.ts:331/394, server.ts:3565 | Room `ownerToken`/`creatorToken` |
| 3 | File upload | server.ts:2013 → file-unit.ts:88 | File `uploaderToken` |
| 4 | WebItem upload | server.ts:2000 → WebItem.ts:124 | WebItem `uploaderToken` |
| 5 | Feature seed (bootstrapSeed) | ServerManagerGuard.ts:70 | Feature `allowedUsers[]` (raw OWNER_TOKEN, EVERY boot) |
| 6 | Feature grant/revoke (FeatureManager) | server.ts grant route | Feature `allowedUsers[]` |
| 7 | Profile write + user home | server.ts:3958 writeUserProfile + createUserHome | Profile `token`, `data/users/<token>/` fs-key, 2 `unitLinks` |

**= 7 writer classes, ~9 sites.** Credential field-set: `ownerToken`, `creatorToken`, `uploaderToken`, `token`, `allowedUsers[]`, plus the `data/users/<token>` fs path-key and token-bearing `unitLinks` segments. This is why there are 254 — persisting the raw credential is the ROUTINE behaviour, not an accident. #5 is the automatic re-exposer (writes the live secret into a committed unit every restart).

## The chokepoint — ScenarioIndex.put refuses a secret-shaped value in a credential field
Every scenario-unit write funnels through **`ScenarioIndex.put`** (the sole disk-write, R31.7). Make it the ONE guard.

**The distinguishing problem:** every unit is full of legitimate uuids (class/method/parent refs) — the guard must NOT refuse "any uuid", only a SECRET. Two moves make secret-vs-ref decidable by construction:
1. **Enumerated credential field-set** (the inventory above): the guard scans ONLY `ownerToken`/`creatorToken`/`uploaderToken`/`token`/`allowedUsers[]` — never the ref fields — so legit uuid refs are never touched (no false-positive).
2. **Opaque storageId is TAGGED** (e.g. `sid:<opaque>`), structurally distinct from a raw token (bare uuid). So "credential field holds a bare-uuid" = a secret; "holds a `sid:`" = an opaque ref.

**Guard:** on `put`, if any credential field holds a bare-uuid-shaped value (a token) rather than a `sid:` opaque ref → **REFUSE the write, fail-closed, LOUD** (name the field + unit, never log the value). Forces every writer to convert token→storageId (via the B1 `tokenToStorageId` map) BEFORE persisting. Committed data then holds ONLY opaque refs BY CONSTRUCTION.
- **requireFeatureAccess co-change:** membership check compares the caller's storageId (resolve token→sid) against `allowedUsers` (now sids) — consistent with B1. #5 bootstrapSeed seeds the owner's `sid`, not the raw token → the automatic re-exposer is neutralised at the source.
- **fs path-key co-requirement** (not a put-guard, same fix): `createUserHome`/unitLinks key on `sid`, not the raw token (the B1 rekey already does this) — so `data/users/` and link paths hold no secret either.

## Gate + discipline
- **Stub-must-fail BITE (test the guard, not just the writer):** put a unit with `ownerToken` = a bare uuid → guard MUST refuse (LOUD); put one with `ownerToken` = `sid:…` → MUST accept. A guard that can't refuse certifies nothing.
- **★ POSITIVE CONTROL (mandatory for a chokepoint):** prove the guard does NOT break legitimate writes — normal unit writes (sid refs), approve/decline verdict writes, federation, CLI mint all still PASS. A guard that refuses everything passes every negative test; the acceptance is "bad-write refused AND all good-writes still work."
- **★ CHOKEPOINT FLAG (standing rule):** this modifies `ScenarioIndex.put` — a chokepoint. I FLAG it; do NOT build by availability. Expert holds for confirm; positive-control proof required before it lands.
- **Sequence:** AFTER B1 (B1 provides the `tokenToStorageId` map + storageId shape the guard depends on; and B1 unblocks Tron first). This guard is what makes B1's "opaque refs in committed data" true FOR EVERY FUTURE WRITE, not just the one rotation — the causes-first close.

## One-line summary
One token is an incident; a `put` that will persist a bare credential is the bug. Fix: `put` refuses a bare-uuid in any enumerated credential field (fail-closed, LOUD, stub-must-fail, positive-controlled), so committed data can only ever hold opaque `sid:` refs — the 254 cannot recur and the next user is safe by construction.
