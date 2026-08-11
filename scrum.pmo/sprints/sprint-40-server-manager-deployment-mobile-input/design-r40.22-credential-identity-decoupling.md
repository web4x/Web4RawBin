# R40.22 — Credential/Identity Decoupling + Storage Re-key (design)

**Author:** robbin-architect · 2026-08-11. PO-dispatched ROOT FIX (not containment). Resolves the conflation diagnosed during the PII incident: **`ownerToken` = identity + credential + storage-key in ONE value**. This is the only step that makes token rotation possible without orphaning a user's home. **Design-only — execute nothing.** No secret values in this note.

## Measured constraint that decides the key (decision 1)
- **No universal on-disk stable owner-id exists.** Profile model keys = `uuid,name,phones,emails,addresses,companies,unitLinks` — **NO token, NO device link**; Device keys = `…,ownerToken,…` (only owner link is the token, no `profileUuid`); Room likewise. **0/195 Device + 0/45 Room ownerTokens resolve to a Profile on disk** (the token↔profile link is runtime-only, in-memory `userProfiles` keyed by the token itself).
- ⇒ **Profile-uuid is NOT viable** (not universal — Devices/Rooms/test-homes have no Profile). Use the PO's fallback: a **purpose-built opaque `storageId`**.

## Decision 1 — `storageId`: a non-secret, never-auth identifier (SAFE-TO-LEAK BY DESIGN)
- **`storageId`** = a fresh opaque uuid minted **per distinct owner** (per distinct `ownerToken`). It keys `data/users/<storageId>/`, appears in path strings + unitLinks, and is **NEVER accepted for authentication** (documented invariant). Because it can never authenticate, its appearing in a leaked path string is harmless — re-conflation is **structurally impossible** (the auth path and the storage key are now different value-spaces).
- **The token becomes purely a rotatable auth credential.** A durable mapping `tokenToStorageId` (and the reverse for auth→home) lives in **gitignored runtime** (`data/`, NOT tracked — it contains the token). Rotating a token swaps its entry in that map; `storageId` is unchanged ⇒ the home is untouched.
- Cost = one mapping; benefit = the three roles are now three values, and the storage key is safe-to-leak.

## Decision 2 — BRIDGE, not hard rename (storage dual-validity)
Migrate each home with BOTH paths resolving during transition (the storage analogue of the auth dual-validity): create `data/users/<storageId>/` and make the legacy `data/users/<token>/` resolve to it (symlink/bridge), so a half-run never breaks a read. Rewrite unitLinks token→storageId, verify, THEN converge and drop the legacy-token bridge. Migration is recoverable, not atomic-or-broken.

## Decision 3+4 — the migration (data over live user data → full treatment)
Per owner (idempotent, fail-closed, half-run-recoverable):
1. **DRY-RUN + COUNTS first:** distinct owners, homes under `data/users/`, files per home, the 167 tracked unitLinks token-segments to rewrite. Emit the table; no writes.
2. **Mint** `storageId` for the owner if absent (idempotent: skip if `tokenToStorageId` already has it).
3. **Bridge** `data/users/<token>/` ↔ `data/users/<storageId>/` (both resolve).
4. **Rewrite** the owner's File/WebItem `model.unitLinks` `../data/users/<token>/…` → `…/<storageId>/…`; **prove every link resolves AFTER** (stat the target); **byte-verify file CONTENT unchanged** (hash each file pre/post == equal — no file lost/altered).
5. **Converge:** once all of an owner's links use `storageId` and all reads route via `storageId`, drop the legacy-token bridge.
6. **Kill mint-regrowth at source (4):** `createUserHome(token)` (UserKeys.ts:51) → `createUserHome(storageId)`; `file-unit.ts:74` `roomFsLink` uses `storageId`; the mint (server.ts:1996/2009) passes `storageId`, NOT `playerToken`, into `createFileUnit`/`createWebItemUnit`. New uploads embed the non-secret `storageId` — the migration cannot refill behind us.
- **Fail-closed + idempotent:** every step checks "already done?"; a home that fails any check ABORTS that home (RED), never drops it; the bridge means a half-run leaves all reads valid; re-run completes.

## Decision 5 — the gate that proves it (stub-must-fail + a structural invariant)
- **Post-migration invariants (fail the migration if any breaks):** (a) NO `data/users/<token>/` path remains — every home keyed by `storageId`; (b) **NO tracked unitLinks (or any path string) contains a credential-shaped segment** (scan paths; a token-shaped value in a path = RED) — this is the standing invariant that no NEW path may embed a credential; (c) every File/WebItem link resolves to an existing target; (d) per-file content-hash BEFORE == AFTER (0 files lost/changed); (e) idempotent (a second run is a no-op).
- **stub-must-fail:** feed a home whose file is missing post-move → gate RED (proves it can fail); feed a path still containing a token → invariant (b) RED.
- Wire the credential-shaped-path invariant into `ci:gates` (composes with the field-level `pii-guard`): field-level catches a token in a FIELD, this catches one in a PATH string.

## ★ ORDERING CONSTRAINT (the whole point — state explicitly)
**Storage MUST be keyed by `storageId` BEFORE any token is rotated.** Otherwise rotation orphans the home — the exact trap caught this incident. **Acceptance criterion:** after the re-key, **rotating a token changes ONLY the `tokenToStorageId` mapping (authentication) and touches NO path and NO file** — proven by a post-rekey rotation test whose path/file byte-diff == 0.

## User-experience impact (for PO → Tron)
- **The re-key itself changes NOTHING a user experiences:** during the bridge both paths resolve; after converge the home content is identical, only its directory key changed; auth is untouched (still the token, until its own later rotation). No re-login, no data move visible to the user.
- The user-facing changes are SEPARATE ladder steps: the 116 auth-invalidation (dormant test sessions, ruled acceptable) and the later enrolled-79 rotation (transparent, device-key-gated). **Nothing in THIS design changes user experience** — flagged so PO can tell Tron the root fix is invisible to users.

## Sequencing in the ladder
repo-private (Tron, now) · auth-invalidate 116 (fresh expert, gate satisfied) · **THIS re-key (storageId, bridge, gated migration)** · THEN storage-safe rotation of the enrolled-79 incl Tron (rotation now touches only auth). The re-key is blocked on nothing and is the prerequisite for a safe rotation.
