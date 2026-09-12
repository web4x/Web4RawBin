# FINDING-2 real-owner brace — ARCHITECT SIGN-OFF ✅ (robbin-architect, 2026-09-12)

**R40.106 FINDING-2** (sweep real-owner protection BY-CONSTRUCTION). Shipped **v0.8.227 (`fd43b28c1`)**, `server.ts` blob **`0ac24f15b795d05fc0c2cffb6cd7c102a2cfa8ea`**. **SIGNED GREEN.** Closes the live shipped-code protection gap: the bulk-delete path now protects Tron's 26 committed accounts by construction, not gate-selection convention (the a16262b8 shape).

## Co-verify — all GREEN, verified on the SHIPPED/served bytes (not relay)
- **(i)** `isOwnerKnownRealAccount(token)` reads `userProfiles.get(t).profileCommitted===true` (the committed-profile roster). ✓
- **(ii)** wired into `deleteUnitWithScan` `!explicitOwner` branch ALONGSIDE `ownerByToken`: `(ownerByToken(t) || isOwnerKnownRealAccount(t)) → 403`. ✓
- **(iii) SEPARATION (PO non-negotiable, no privilege escalation) — confirmed TWO ways + PO:** the fn body reads `userProfiles` ONLY (node fn-body grep: 0 refs to protected-owner-identities/ownerByToken/allowedUsers/FeatureManager); and `fd43b28c1`'s file-list touches NO auth-trust file. Auth-trust set UNCHANGED. ✓
- **(iv)** FULL-token via `Map.get` (no `slice(0,8)` — a prefix compare in a safety predicate reads a real owner as unprotected on collision). ✓
- **(v)** redirect-resolved: follows `redirectTo` chain to the primary before the committed check (tombstones protected), with a cycle-guard (`seen` Set). ✓
- **(vi)** memoized: in-memory `userProfiles` map (no per-unit `profiles.json` read). ✓
- **(vii)** `explicitOwner` deliberate-delete still bypasses the owner-brace; `model.protected` still refuses even then (two-layer intact). ✓
- **(viii) DISCRIMINATION bite GREEN (tester, failable):** real committed-profile-owned bulk-delete → **403** AND ephemeral non-committed → **200** — the brace DISCRIMINATES, not blanket-refuses. RED→GREEN differential vs the v0.8.226 baseline (real-owned was 200 pre-brace); `ce981242` refused = full-token firing. ✓
- **SHA-MATCH (char-level):** tester freshly re-hashed rig `server.ts` == `0ac24f15…` == `fd43b28c1:server.ts` == served 0.8.227 — rig==ship byte-identical (robust to the gate's data/pre-image commits; blob unchanged). ✓
- **served==committed==0.8.227** (architect node-https self-check); clean boot.

## What it is / next
A protection ADD (non-destructive) — closes the real-account bulk-delete gap shipped on its own merits. The tester's dry-run gate becomes the ongoing VERIFIER (shipped-EXCLUDED == gate-SELECTED, by construction not convention).
**Corrected sequence (PO):** (1) ✅ brace signed+shipped [THIS] → (2) expert builds the step-2 sanctioned sweep op (design `sanctioned-sweep-op.md`: list-driven no-new-primitive, challenge-auth, per-unit through `deleteUnitWithScan` so all 3 guards evaluate, two-phase fail-closed via a `dryRun` mode, durable committed pre-image, SET-SHA MANDATORY, verify-gone+idempotent) → (3) the 34-uuid named execution THROUGH that op, architect backstops (0-real + pre-images + 0-dangling) → (4) PO lifts no-sweep in writing. INC-7 baseline stays honest-RED (documented: orphans await the sanctioned path) until step 3.
