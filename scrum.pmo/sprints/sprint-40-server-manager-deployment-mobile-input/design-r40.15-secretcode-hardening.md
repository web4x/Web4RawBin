# R40.15 — secretCode hardening (PROD EXPOSURE, design-only no build)

**Author:** robbin-architect · 2026-08-08. PO-authorized. Named debt `2182c412`. A real prod exposure, not a feature: the 4-digit secretCode is the credential that links devices to an identity — the weakest link in the identity model we spent sprints making structurally sound. DESIGN → committed doc, NO code.

## MEASURED — the exposure is WORSE than "plaintext at rest"
- **Plaintext at rest:** `writeUserProfile` (`UserKeys.ts:199-203`) → `profile.json = JSON.stringify(profile)` → `secretCode` stored in cleartext on disk.
- **★ Transmitted to CLIENTS (bigger than the named debt):** the plaintext code is sent to browsers — `server.ts:3190` `profileViewData{…secretCode:p.secretCode…}`, `:3831` `PROFILE_UPDATED{…secretCode…}`, `:3186` comment "feed it the full m.profile (token/secretCode/…)". So it also lives in client memory/DOM/over-the-wire.
- **Plaintext compare, NO rate limit, on the two credential paths:** device-enroll `msg.secretCode !== enrollProfile.secretCode` (`:3860`) and consolidate `friend.secretCode !== secretCode` (`:3718`). Both are the identity-linking gate; neither limits attempts.
- **Space:** 4-digit, `/^\d{4}$/` (`:3753`) = **10 000 values** — brute-forceable in seconds online, in milliseconds offline.
- Generated `generateSecretCode()` (`:547`); cleared on successful consolidate (`:3732`).

## ★ HONEST SECURITY FRAMING (don't oversell hash-at-rest)
A 4-digit code has 10k values; **any** hash of it (even scrypt/argon2) is crackable offline in milliseconds if an attacker gets `hash+salt` — a slow KDF barely helps at this size. So hashing is NOT the primary defense. The real defenses, in order:
1. **RATE-LIMIT online verification** (the primary defense — makes online brute force infeasible).
2. **NEVER expose the hash or the code** (server-only; stop transmitting; never log) — so there is nothing to crack offline.
3. **Hash+salt at rest** — defends against a casual disk/payload read, and is correct hygiene, but is a *secondary* wall for a 4-digit secret.
4. **★ Deeper fix (recommended, flagged):** device-link should migrate to the challenge-response the identity model ALREADY has (`verifyChallenge` / `enrollDevice` / the per-user RSA keypair, used at `server.ts:3900`) — a signed challenge is not brute-forceable and is the structurally-sound primitive. The 4-digit code is a weak human-shared secret; the crown fix is to stop using it as the device-link credential. R40.15 hardens the existing code AND names this migration as the real endgame.

## DESIGN
### (1) Hash + salt at rest — never reversible, never plaintext
- Store `secretCodeHash` = KDF(code, per-user random salt) using **scrypt** (`node:crypto.scryptSync`, already the crypto lib) with a stored salt; **never** the plaintext `secretCode` field in `profile.json`. Verification = `timingSafeEqual(scrypt(input, salt), storedHash)` (constant-time).
- **Stop transmitting it:** remove `secretCode` from `profileViewData` (`:3190`) and `PROFILE_UPDATED` (`:3831`). Where the UI needs to show *that a code exists*, send a MASKED placeholder only (like the onboarding hint `:2775` "M••• D•••"), never the value.

### (2) Rate-limit verification (the primary defense)
- A server-side attempt counter per `(targetIdentity, source)` on BOTH device-enroll (`:3860`) and consolidate (`:3718`): e.g. ≤5 attempts, then exponential backoff → lockout; counter persists across reconnects (not just in-memory per-ws, or an attacker reconnects to reset). Reset on success + on owner reset.
- **Attempt-flood → REFUSED** with a generic "too many attempts" (no oracle about closeness). This makes the 10k space unreachable online.

### (3) Never logged
- The code value never enters `addLog`/console/audit/error text. Failure logs may say "wrong secret code" but NEVER the value or the guess. Audit the log sinks; add a redaction invariant.

### (4) Migration path — NO user lock-out
- **Lazy upgrade-on-verify:** verify path = if `secretCodeHash` present → scrypt-compare; ELSE if legacy plaintext `secretCode` present → compare plaintext AND on match immediately **set `secretCodeHash` + delete the plaintext field** (one-way upgrade). Legacy codes keep working until first successful use, then auto-harden.
- **Owner-driven reset:** an owner can reset a user's code (generate → hash → clear legacy) for accounts that never re-verify — so nobody is permanently stuck on plaintext.
- **Immediate (not user-gated):** stop transmitting/logging the plaintext NOW (code change), independent of per-user hash migration — the leak stops for everyone at deploy; the at-rest hash fills in lazily.

## ★ FAIL-FIRST ACs (web4ID style — stub-must-fail, run FIRST)
- **ATTEMPT-FLOOD MUST BE REFUSED (run first):** fire N+1 rapid verification attempts → the limiter REFUSES (lockout/backoff); it MUST NOT keep accepting guesses. If a flood is accepted, the hardening is vacuous — this gate fails before any other.
- **STORED-HASH-MUST-NOT-BE-REVERSIBLE (run first):** assert the stored value is a scrypt hash + salt, NOT the plaintext; read `profile.json` → MUST find NO plaintext `secretCode` (post-migration); and assert NO client payload carries the value (grep the profile payloads → masked only). If plaintext is readable at rest or on the wire, RED before anything else.
- **NEVER-LOGGED:** grep all log/audit sinks for the code value → zero.
- **MIGRATION-NO-LOCKOUT:** a legacy plaintext profile → correct code verifies AND upgrades to hash (plaintext gone after); wrong code → refused + counts toward the limit; owner reset works.
- **timing-safe:** verification uses constant-time compare (no early-exit oracle).

## INVARIANTS
- **INV-R4015-1 hash-at-rest:** `profile.json` stores `secretCodeHash`+salt (scrypt), never the plaintext; a plaintext `secretCode` at rest (post-migration) is a violation.
- **INV-R4015-2 rate-limited (PRIMARY):** device-enroll + consolidate verification is attempt-limited per identity+source, persistent across reconnects; flood → refused.
- **INV-R4015-3 never-transmitted / never-logged:** the code value never appears in a client payload (masked only) nor any log/audit sink.
- **INV-R4015-4 migration-no-lockout:** legacy plaintext upgrades one-way on next successful verify (or owner reset); no user locked out; the on-the-wire/log leak stops for everyone at deploy.
- **INV-R4015-5 fail-first:** attempt-flood-refused + hash-not-reversible run FIRST (stub-must-fail).
- **INV-R4015-6 (flag, endgame):** the 4-digit code is inherently weak; the device-link credential should migrate to the existing challenge-response (`verifyChallenge`/identity keypair). Recorded as the real fix beyond hardening.

## Chain + posture
- Chain: UC `secretCode.hardenAtRest` + `secretCode.rateLimitVerify` → Class `SecretCodeGuard` (server) → Methods `hashAndStore` / `verifyRateLimited` / `migrateOnVerify` → Impls → the fail-first stub-must-fail Tests. req mints at build-go.
- Ties: fail-closed (attempt-flood refused, R-C3 lineage), stub-must-fail (prove rejection, not "it verified for me"), honest-security (don't claim a 4-digit hash is strong — the rate limit + non-exposure are the real walls), single-source (one `SecretCodeGuard`, reuse scrypt + the existing challenge-response).
- **DESIGN ONLY — no code.** Report; build post-authorization; I backstop the fail-first gates on ship.
