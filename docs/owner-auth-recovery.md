# Owner auth recovery — restoring server-manager owner access from the host

**When to use this:** the owner (Tron) cannot access owner-only surfaces (Server Manager, Feature Manager, the terminal) and the failure says **`owner auth unavailable: config-absent`** or **`owner auth unavailable: config-malformed`** — i.e. the trusted-identity config is missing or broken, so the server is failing **CLOSED** (by design — a credential fallback that works when config is broken would be a permanent backdoor; that is the RCE we removed). This is a **~5-minute host fix**. If the failure instead says you are *not the owner*, or the terminal is *severed*, this doc does not apply — those are different states, distinguishable in the message on purpose.

## The fix

Owner identity is trusted by **profile UUID** (an identity, **not** a secret) listed in an **untracked host file**:

- **File:** `$RAWBIN_PROTECTED_IDS` if set, else `/root/.rawbin/protected-owner-identities.json`
- **Shape:** a JSON array of owner profile-UUID strings.

```bash
mkdir -p /root/.rawbin
cat > /root/.rawbin/protected-owner-identities.json <<'JSON'
["05e58f81-....-............"]   # the owner's Profile-unit UUID (identity, not a credential)
JSON
```

Then restart the server (or it is re-read on the next gated request).

## Verify (no owner session needed)

```bash
curl -sk https://localhost:4444/api/health   # → protectedIdentities: { configured: >=1, error: null }
```

The boot log should read `[boot][protected-identities] loaded N trusted identities`. Once `configured >= 1` and `error: null`, the owner's normal client authenticates via its existing player token (`rawbin-player-id` → its Profile UUID ∈ the trusted set) — **no shared secret / owner-token literal involved.**

## Why it is safe to write this down

The recovery file holds **profile UUIDs (identities), never credentials.** Knowing the owner's profile UUID does not grant access — the actual credential is the owner's own player token, which lives only in the owner's client and is never in this file, the repo, or this doc. That is what makes fail-closed operable: the recovery is public-safe.

## Related

- Structural literal-trust removal (the RCE fix that makes owner auth fail-closed): `scrum.pmo/design-notes/literal-trust-removal-INPUT-2026-08-24.md`.
- Trusted-identity loader: `src/ts/server/FeatureManager.ts` `loadProtectedIdentities` (`config-absent` / `config-malformed` / null).
