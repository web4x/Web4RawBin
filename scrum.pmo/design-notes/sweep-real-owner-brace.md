# FINDING-2: real-owner sweep protection must be BY-CONSTRUCTION, not gate-convention (robbin-architect, 2026-09-12)

PO-routed design (design-only, not build — no-sweep order still standing). Measured gap + by-construction fix. Pattern = **guard-in-the-acting-code** (keep-set / guard#5 / phantom-4 family: *a protection not read by the acting code protects nothing*) + **separation of concerns** (delete-protection roster ≠ auth-trust set).

## The gap (measured)
- The sweep's "real-owner protection" lives ONLY in the **tester's dry-run gate SELECTION** (`r40106-inc7-sweep-dryrun-gate.mjs`): `isReal = protectedSet.has(owner) || realProfileTokens.has(owner)`, where `realProfileTokens` = `data/profiles.json` filtered `profileCommitted===true`. EXCLUDED-from-sweep = protected OR real.
- **Shipped `deleteUnitWithScan` does NOT check committed profiles.** Its owner-brace is `model.protected || (!explicitOwner && ownerByToken(ownerTok))` — and `ownerByToken` = ONLY the protected-identity-set (`/root/.rawbin/protected-owner-identities.json`, 1 identity 05e58f81). The **26 committed profiles + ce981242 are real accounts NOT in that set** → shipped code would NOT refuse a bulk-delete of their units.
- So real-account protection is **convention** (gate selection), bypassable by invoking a sweep/bulk-delete any other way = the **a16262b8 incident shape** (protection the acting code doesn't implement).

## PO CONSTRAINT (honored): do NOT widen the protected-identity-set
`protected-owner-identities.json` is the owner-**AUTH-TRUST** set — `FeatureManager` re-seeds `allowedUsers` from it. Adding profiles there = **privilege escalation** (conflates delete-protection with access-trust). The fix must be a SEPARATE protection source.

## Design — a separate, by-construction predicate in the shipped bulk-delete path
`isOwnerKnownRealAccount(token): boolean` — derived from **committed profiles** (`data/profiles.json`, `profileCommitted===true`), the SAME source the gate uses. A READ-ONLY delete-protection signal, wholly distinct from the auth-trust set.

**Wire it into the EXISTING bulk-delete brace** (`deleteUnitWithScan`, the `!explicitOwner` branch):
```
// now:  if (um.protected || (!opts?.explicitOwner && ownerTok && ownerByToken(ownerTok)))          return 403
// new:  if (um.protected || (!opts?.explicitOwner && ownerTok && (ownerByToken(ownerTok) || isOwnerKnownRealAccount(ownerTok)))) return 403
```
- **Bulk/sweep (`!explicitOwner`)** → refuses if owner ∈ protected-identity-set (existing, auth) **OR** owner has a committed profile (NEW, real-account roster). Unbypassable BY CONSTRUCTION — every sweep path calls `deleteUnitWithScan`, which now refuses real-owned units regardless of the caller's selection.
- **`explicitOwner` (deliberate individual delete / deleteRoomComposite)** → still bypasses the owner-brace (the deliberate-act escape hatch — unchanged; model.protected STILL refuses even here, unmark-first).
- **Separation preserved:** `isOwnerKnownRealAccount` reads `profiles.json` (the real-account ROSTER); `ownerByToken` reads the auth-trust set. Two sources, two purposes. Protection auto-tracks real accounts as they register (a committed profile) WITHOUT granting them auth-trust — no privilege escalation.

## Refinements (lift the gate's convention into code, with two hardenings)
1. **FULL token match, NOT the gate's `slice(0,8)`.** The dry-run gate compares 8-char prefixes (convenience). A SAFETY brace must not risk a prefix collision (false-negative = a real owner not protected = a real unit swept). Match the full token. [[full-uuid-data-writes-and-prefix-negative-conclusions]]
2. **Resolve through `redirectTo` (tombstones).** A consolidated/deduped real account (R25.7) redirects to a primary; its OLD token's units must still be protected. `isOwnerKnownRealAccount` resolves the token through the redirect chain and checks the resolved primary against committed profiles. (Gate comment: "known real accounts + their tombstones.")
3. **Load once per sweep** (memoize the committed-profile token Set at sweep start) — not a profiles.json read per-unit.

## Failable gate (makes the brace enforceable + provable — build with it)
A BITE: a committed-profile-owned orphan fed to the bulk-delete path → **REFUSED** (403). **Stub-must-fail:** remove `isOwnerKnownRealAccount` from the condition → the real-owned orphan gets SELECTED/deleted → RED. So the brace can't silently regress to convention-only again.

## Acceptance
- The shipped bulk-delete path (`!explicitOwner`) refuses ANY committed-profile-owned unit, proven by the failable BITE — **regardless of invocation path** (not just the tester's gate). By-construction, unbypassable.
- Delete-protection source (`profiles.json`) stays SEPARATE from the auth-trust set (`protected-owner-identities.json`) — no privilege-escalation path introduced.
- Deliberate `explicitOwner` delete of a real-owned-but-UNMARKED unit still allowed (escape hatch intact); `model.protected` still refuses even deliberate (unmark-first).

**Gated:** this brace lands BEFORE the 48-orphan sweep runs (the sweep stays under the no-sweep order until this + 7b-verification are in). Design-only now; expert builds when the sweep-brace is scheduled. No invented mechanism — the gate's proven `profiles.json` predicate lifted into the shipped brace, full-token + redirect-resolved, kept separate from auth.
