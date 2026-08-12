# Option B — Owner-token rotation RUNBOOK (architect, 2026-08-12)

For Tron to authorize as ONE decision. The COMPLETE close of the public-`OWNER_TOKEN` exposure. Prove-before-kill throughout: Tron authenticates on the NEW token BEFORE the OLD dies.

## ★ PRECONDITION — D2 IS NOT LIVE YET (corrected 2026-08-12, PO caught the premise)
As of writing, **served is still v0.8.92 and NO D2 commit has landed — the prod shell/RCE is STILL REACHABLE right now.** This runbook does NOT assume the shell is closed. D2 (sever the PTY ws-upgrade) is the FIRST thing that must go live; only AFTER D2 severs the shell does B1's *safe decoupled* sequence become affordable (because the remaining exposure is then HTTP surfaces, not a live shell). Until D2 lands, closing the RCE via D2 outranks starting B. Do not read any part of this runbook as evidence the shell is contained.

## Measured footprint — what the old token `41ad88c4` keys (counts, value withheld)
- **Code:** the literal at `ServerManagerGuard.ts:12` (INV-G2 = exactly one location); `FeatureManager.bootstrapSeed()` (server.ts:3384) re-seeds the owner into allowedUsers EVERY boot — **additively/idempotent, it does NOT remove the old entry** (so a scrub is mandatory, boot won't do it).
- **Data:** in **3 Feature units' `allowedUsers[]`** (Server Manager / Feature Manager / Model-Driven), **1 `ownerToken` field**, **2 `unitLinks` path strings**, + a Profile unit.
- **Storage:** `data/users/<owner-token>/` home dir **EXISTS** → storage is keyed BY the token → naive rotation ORPHANS his home. This is identity+credential+storage CONFLATED (the R40.22 root).

## What CHANGES / what BREAKS / what Tron DOES
Two paths — recommend **B1 (decoupled, safe)**, affordable **once D2 is live** (D2 severs the shell → remaining exposure is HTTP surfaces, so the safe sequence is worth the extra time). If D2 is NOT yet live, get D2 live first — do not start B while the shell is open:

### B1 — decoupled (recommended): storage-rekey FIRST, then auth-only rotation
1. Land the R40.22 storage-rekey (token → opaque non-secret `storageId`): re-key `data/users/` by storageId, rewrite the **2** owner `unitLinks` token→storageId, **byte-verify per-file hash before==after** (gated dry-run+count migration). After this, storage no longer depends on the token.
2. Rotate the `ServerManagerGuard.ts:12` literal → a fresh non-public secret (OOB to Tron). `bootstrapSeed` now seeds the NEW token on boot.
3. **Scrub** the OLD `41ad88c4` from the **3** Feature `allowedUsers[]` + the **1** `ownerToken` field (data commit) — mandatory; bootstrapSeed won't remove it.
- **What breaks while it happens:** nothing storage-side (decoupled → 0 file bytes); a brief window where server-manager HTTP has no owner until the new literal deploys + restarts.
- **What Tron does himself:** receive the new token OOB; re-authenticate with it (login + open a terminal once D2 is lifted).

### B2 — coupled (only if Tron won't wait for the rekey): riskier
Rotate literal + scrub 3 allowedUsers + **migrate `data/users/<old>→<new>` + rewrite 2 unitLinks + update 1 ownerToken**, ALL atomic. Touches storage+identity → a partial migration = lockout risk. Byte-verify hash before==after. Prefer B1.

## ★★ SECRET-HYGIENE CONSTRAINT (PO/Tron, folded in — the one that would RECREATE the incident)
The incident's root cause was a credential existing as a LITERAL in a committed file. A rotation that succeeds functionally but re-embeds the secret is a FAILED rotation — it resets the clock on the identical hole with a fresh value. Therefore, by construction:
- **The new token is NEVER a literal in any tracked file.** `ServerManagerGuard` reads it from a RUNTIME reference — env (`RB_OWNER_TOKEN`) or a gitignored root-only config — resolved at boot. INV-G2 evolves: not "the literal lives in exactly one place" but **"ZERO uuid-shaped secret literals in tracked code; the config-read lives in one place."**
- **Fail-closed + LOUD if the reference is absent/unreadable** → OWNER_TOKEN unresolved → owner-gate denies ALL (never a blank that accidentally matches) + a loud boot log, DISTINCT from a wrong-secret (same absent-vs-wrong discipline as the revocation list).
- **bootstrapSeed must NOT persist the raw secret into a committed `allowedUsers` unit.** It re-seeds the owner every boot; if it writes the raw token into a git-tracked Feature unit, the secret is re-embedded in a committed file = re-exposure. Store a NON-SECRET reference in allowedUsers (the `storageId`/opaque id from the B1 rekey), or keep owner-membership runtime-only — never the raw token on disk.
- **Delivery is OWNER-ONLY.** Tron supplies it, or it is written to a root-only path he reads, or generated in-place and never leaves the process. **NO agent — including me, including to the PO — transmits, logs, echoes, commits, reports, or writes-to-an-anchor the value.** (My own grep checks below output COUNTS/booleans only, never the value.)

## VERIFY (all must pass; this IS the acceptance)
0. ★ SECRET-HYGIENE (alongside 403-everywhere): grep the B1 diff AND the entire tracked tree for ANY uuid-shaped token literal (old `41ad88c4` AND any new value) → **ZERO secret literals**; confirm `ServerManagerGuard` reads OWNER_TOKEN from config/env (not embedded); confirm `bootstrapSeed`/allowedUsers hold a non-secret reference, not the raw token; confirm NO agent context / commit message / transcript / anchor contains the new value. A functional rotation that re-embeds the secret = FAILED.
1. NEW token → owner-route **200** + Server Manager / Feature Manager / Model-Driven all reachable; can open a fresh terminal (after D2 lifted).
2. OLD public `41ad88c4` → **403 on ALL owner surfaces** (server-manager, FeatureManager grant/revoke, Model-Driven) AND rejected at IDENTIFY-owner.
3. `bootstrapSeed` seeds ONLY the new token (grep the boot; old token absent from re-seed).
4. Storage intact — B1: storageId-keyed, `data/users` untouched; B2: migrated, hash before==after, 0 orphaned.
5. served==committed after the version bump (R31.7 invariant).
6. (Tron/separate) repo-PRIVATE + history-scrub (filter-repo/BFG) so the old token's public copies are purged — until then the old token stays publicly readable even after it's dead (dead ≠ deleted).

## PROVE-BEFORE-KILL + REVERT
- **Order:** deploy the new literal + seed → Tron proves NEW-token owner-route-200 → ONLY THEN scrub the old from allowedUsers/ownerToken. Never kill the old before the new is proven.
- **If new-token auth breaks:** REVERT = redeploy the pre-rotation build (old token restores his access). ★ CAVEAT: the old token is PUBLIC → revert re-opens the exposure, so it's a break-glass to restore access ONLY, immediately followed by a corrected re-rotation — never a resting state. (This is exactly why prove-before-kill is non-negotiable: verify NEW works before killing OLD so revert is essentially never needed.)
- D2 stays in place until rotation verifies — the terminal is severed for everyone (incl Tron) until B completes, then D2 is lifted and the new-token owner regains it.

## One-decision summary for Tron
"Rotate my owner token: (1) decouple storage first so nothing of mine moves, (2) swap the secret to a fresh private one you send me out-of-band, (3) kill the public one everywhere — but only after I've proven the new one works. I keep everything; I lose the terminal only until it's done; if the new token fails you put the old build back so I'm not locked out, then fix and retry. Then take the repo private and scrub history so the dead token isn't even readable."
