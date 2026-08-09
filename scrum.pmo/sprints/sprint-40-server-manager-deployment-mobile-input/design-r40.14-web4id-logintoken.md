# R40.14 — web4ID / portable encrypted loginToken (DESIGN ONLY, no build)

**Author:** robbin-architect · 2026-08-08. Tron GO, design-required because it is a **CREDENTIAL** (nobody builds it from ACs alone). Req `e8ab7aa2-92e2-423e-b3d1-794796c530fe` (R40.14), Backlog, parented S40. Build lands post-reset with a fresh expert. DESIGN → committed doc, NO code.

**Tron's words:** *"download a loginToken from the profile (like the vcard), encrypted in a way that only the real user can decrypt it with his private key, but the token works as a User.Name.web4ID that can be dragged and dropped into any server to log on."*

## MEASURED infra (disk, v0.8.74) — reuse-not-fork foundations
- **Per-user RSA keypairs EXIST** (`UserKeys.ts`): `data/users/<id>/.ssh/id_rsa` (pkcs8 PEM) + `id_rsa.pub` (spki PEM). `getUserPublicKey`/`getUserPrivateKey`; `crypto.sign('sha256',…)` + `crypto.verify` already used (`signDeviceKey`/`verifyDeviceKey`).
- **Device trust chain EXISTS**: `enrollDevice` → `generateDeviceKeypair` + the identity key SIGNS the device pubkey (`signDeviceKey`) + `addAuthorizedKey`. `verifyChallenge(userToken, devicePubkey, challenge, signedChallenge)` = a working **challenge-response**.
- **DropDispatcher** (`src/public/ts/drop-dispatcher.ts`): `register(mimePrefix, handler)`, routes by `file.type.startsWith(prefix)`; `dispatchUrl` handles the rb-federated-ref (originHost + fetchUrl) precedent.
- **Federation** (`federation-transfer.ts`, S26): `originHost` tagging + fetch `/api/scenario/<uuid>` from the origin — the cross-server-trust precedent.
- **Login today**: `tokenToClient` Map = authenticated sessions; `secretCode` per profile; `ServerManagerGuard.assertOwner`. "Log on" = get a token into `tokenToClient`.
- **Crypto**: `node:crypto` only (no external lib needed).

## Core shape — a SIGNED assertion inside an ENCRYPTED envelope (two crypto ops, two goals)
Confidentiality and authenticity are DIFFERENT goals; conflating them into one operation is the classic credential mistake. The web4ID separates them:
- **INNER = signed identity assertion** (the credential): claims + a signature by the user's IDENTITY private key. Portable, self-contained, verified by any server against the identity PUBLIC key. → authenticity / anti-forgery / identity-binding.
- **OUTER = encryption envelope to the user**: the assertion is hybrid-encrypted so only the *real user* can open the file at rest. → confidentiality ("only the real user can decrypt").

## (1) CRYPTO SHAPE — **PICK: reuse the existing per-user identity keypair; multi-recipient hybrid envelope**
- **Signer = the user's IDENTITY key** (`UserKeys.getUserPrivateKey`, home-server-held). The identity private key **never leaves the server** (smallest attack surface). Servers verify with the identity PUBLIC key.
  - Algorithm: **RSA-PSS + SHA-256** for the new credential signature (modern default; note the existing `signDeviceKey` uses PKCS1-v1_5 — new credential should specify PSS). Confirm `generateUserKeypair` modulus ≥2048 (**recommend 4096** for a long-lived identity key).
- **Encryption (the "his private key" part) = hybrid, MULTI-RECIPIENT to the user's ENROLLED device keys** (+ the identity key as a recovery recipient): AES-256-**GCM** encrypts the payload; the AES content-key is **RSA-OAEP(SHA-256)-wrapped once per recipient** (each enrolled device pubkey from `authorized_keys`, plus the identity pubkey). Any ONE of the user's enrolled devices can open it; nobody else can.
- **Why this pick (vs a dedicated token keypair):** (a) **single-source** — the web4ID SHOULD BE the user's existing cryptographic identity, not a parallel key to manage/revoke/trust (a 2nd keypair = the single-source disease); (b) the identity key already signs device keys + drives challenge-response — reuse; (c) multi-recipient keeps the identity private key server-only while still letting the *real user* (any enrolled device) decrypt — matches "only the real user … his private key" AND portability across the user's devices.
- **Trade-off flagged for your call:** the simpler single-recipient variant (encrypt only to the identity pubkey, user exports a passphrase-wrapped identity private key at download) matches "his private key" most literally BUT exports the identity private key off-server = a real exposure. I recommend AGAINST it; multi-recipient-to-devices keeps the crown jewel on the server.

## (2) TOKEN CONTENT — inside `User.Name.web4ID`
**INSIDE (the signed claims):** `identityIor` (`ior:instance:<user-uuid>` — canonical identity) · `web4Id` (the `User.Name.web4ID` human string) · `displayName` · `issuerHost` (minting server, e.g. `prod.wo-da.de`) · `issuerKeyId` (**SHA-256 fingerprint** of the identity pubkey — tells the verifier WHICH key to fetch/trust and detects key-swap) · `issuedAt` · `expiry` (short, default 24h, configurable) · `jti` (unique token id — replay + revocation handle) · `nonce` (random) · `audience` (`"any"` for portable, or a host allow-list) · `schemaVersion`. Plus `signature` over the canonical (sorted-key) serialization.
**MUST NOT be inside:** ✗ plaintext `secretCode` (the current login secret — never travels) · ✗ any private key material (identity or device) · ✗ a session token / `tokenToClient` value · ✗ password/avatar/PII beyond displayName · ✗ any long-lived bearer secret (the token's power is the SIGNATURE, not a secret it carries — a leaked assertion is still bounded by expiry+nonce+revocation+challenge).

## (3) REPLAY + REVOCATION + FORGERY — the three that make it safe
- **FORGERY → signature binds identity.** The assertion is signed by the identity private key; a forger can't produce a valid signature without it. The signature covers `identityIor`, so a dropped token authenticates ONLY the identity it was signed for — you cannot edit the identity and re-sign. Wrong/other-key signature → verify fails → reject.
- **REPLAY → expiry + one-time jti + challenge-response (possession proof).**
  - short `expiry` bounds the window; `jti` unique per token.
  - receiving server keeps a **seen-jti cache** (TTL = expiry) → a re-submitted jti in-window is rejected (one-time per server).
  - ★ **strongest, and the infra already has it:** at login the server issues a fresh random **challenge**; the client signs it with the user's device private key; server checks via `verifyChallenge`. A *captured .web4id file alone cannot log in* — the replayer lacks the private key to answer the challenge. Possession, not mere presentation.
- **REVOCATION → issuer revocation list + key rotation.**
  - Tron revokes a lost token from his profile → adds its `jti` to the issuer's `data/users/<id>/revoked-web4ids.json`. Receiving servers check revocation federation-style (`GET <issuerHost>/api/web4id/revoked/<jti>`) or cache a short-lived signed revocation list.
  - short expiry caps revocation latency (a lost token dies in ≤24h regardless of reachability).
  - **nuclear:** `regenerateUserKeypair` rotates the identity key → EVERY outstanding token fails signature verification at once (global revoke). Trade-off: invalidates all tokens + re-enrolls devices — reserve for compromise.

## (4) DROP-TO-LOGIN PATH — reuse DropDispatcher, no new machinery
- **MIME / extension:** `application/web4id`, extension **`.web4id`**. Register `dispatcher.register('application/web4id', web4idLoginHandler)`. Because a downloaded file's MIME can arrive generic (`application/octet-stream`), ALSO match the `.web4id` extension in `dispatch` (small addition to the existing allowlist, not a new dispatcher).
- **Client handler:** unwrap the OUTER envelope with the device private key → obtain the signed assertion → `GET /api/web4id/challenge` (fresh nonce) → sign it with the device key → `POST /api/web4id/login {assertion, signedChallenge, deviceKeyId}`.
- **Server endpoint `POST /api/web4id/login`:** verify signature (issuer key, point 5) → check expiry → check jti not seen (replay) → check not revoked → `verifyChallenge` (possession) → on ALL pass, mint a session token into `tokenToClient` (the existing auth path) + set the session cookie; identity of the session = the signed `identityIor` (never anything else). Any failure → 401 with a NAMED reason.
- Profile **download** (the "like the vcard" part): `GET /api/web4id/download` (authenticated) streams `Alice.web4id` (the multi-recipient envelope), `Content-Disposition: attachment`, `Content-Type: application/web4id`. Mirrors the existing vcard/profile-download pattern; no new download machinery.

## (5) CROSS-SERVER TRUST — **PICK: federation-fetch the issuer's public key (TOFU-pinned), not self-contained**
The crux: a token minted on `prod` dropped onto `test`/another host. The receiving server needs the issuer's public key to verify.
- **PICK (i) federation fetch:** assertion carries `issuerHost` + `issuerKeyId`. Receiving server fetches `GET https://<issuerHost>/api/web4id/pubkey/<identityIor>` (S26 originHost-fetch precedent, over TLS) → verifies the signature; **pins `(issuerHost, issuerKeyId) → pubkey` on first use (TOFU)**; a later key change for the same identity is flagged as possible compromise (re-confirm), because `issuerKeyId` is the key fingerprint.
- **vs (ii) self-contained** (embed issuer key + trust a pre-shared CA): rejected — without a real PKI/CA it still needs a pinned anchor AND cannot do live revocation.
- **Trade-off (stated):** (i) requires the issuer reachable at login (acceptable — login is inherently online) and roots trust in TLS+DNS (the receiving server trusts that `<issuerHost>` speaks for its own users — the same trust model as email domains / OIDC discovery). In exchange it gets LIVE revocation + key-rotation, which a credential needs. Mitigate the reachability cost with a short pubkey cache.

## (6) GATE SHAPE (tester) — STUB-MUST-FAIL on crypto, never "it decrypted for me"
Each is a distinct #126 Test; the crypto gates prove REJECTION, not acceptance:
- **Wrong-key decrypt FAILS:** envelope to user A, open attempt with user B's key → MUST fail (OAEP unwrap throws) → login rejected. (Not "it decrypted for me.")
- **Forged token REJECTED:** tamper any claim (identityIor/displayName/expiry) without re-signing → signature verify fails → reject. AND sign with a non-issuer key → reject.
- **Replayed token REJECTED:** submit a valid token twice (same jti) → 2nd rejected; AND replay a captured assertion WITHOUT the private key → challenge unanswerable → rejected.
- **Expired token REJECTED:** `expiry` in the past → rejected.
- **Revoked token REJECTED:** `jti` on the revocation list → rejected.
- **Identity-isolation:** a token for identity A can NEVER mint a session for identity B (session identity == signed `identityIor`, asserted).
- **FAIL-CLOSED (R-C3 lineage):** any missing claim / unfetchable issuer key / malformed envelope / verify that cannot run → REJECT with a named reason, NEVER a permissive default. A crypto check that can't execute = FAIL.

## Chain + posture
- Chain: UC `web4id.mintLoginToken` + `web4id.dropToLogin` → Class `Web4IdCredential` (server) + `Web4IdLogin` (client handler) → Methods (`mint`/`verify`/`revoke`; `unwrapAndLogin`) → Impls → the STUB-MUST-FAIL crypto BITE Tests. req mints at build-go.
- **Security doctrine ties:** single-source (reuse identity keypair, DropDispatcher, federation fetch — no forks), fail-closed (R-C3), correct-by-construction (signature binds identity), stub-must-fail (crypto gates prove rejection). Credential = the identity private key stays server-side; the file is confidential to the user's enrolled devices; trust is live-revocable.
- **DESIGN ONLY — no code. Then HOLD** for post-reset build with a fresh expert; I backstop the crypto gates on ship.
