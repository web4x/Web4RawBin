# Structural literal-trust removal (server-manager RCE root) — MEASURED design INPUT for architect ratify

## 🛑🛑 CANCELLED 2026-08-24 (Tron via PO) — THIS REFACTOR IS NOT BUILT. Kept as ANALYSIS only.
**Tron: "I never ordered to fix it — it's a Server Manager."** A server-manager terminal IS arbitrary shell-exec on the host — **that is the FEATURE, not a vulnerability.** We mislabeled the product's purpose an "RCE" and severed the feature for 12 days + designed a 54-file auth re-architecture he never asked for. The ONLY real problem was a **credential leaked into tracked files**, whose correct fix is **ROTATE THE CREDENTIAL** (a 2-minute owner action). The structural literal-trust removal / resolveOwner path-(b) redesign / whole refactor below = **CANCELLED, build NOTHING.** (Everything below is retained as the auth-surface analysis that informed the rotation decision.)

### ✅ THE ONLY WORK (small): rotation + un-sever. UN-SEVER RUNBOOK — READY, **HOLD until Tron ROTATES** (leaked token is live until then; un-severing first = terminal reachable by any repo-holder).
1. **Tron ROTATES** the owner token (his action, ~2 min — PO asking). ⇒ the leaked public `41ad88c4` stops being the owner credential.
2. **Un-sever = DELETE the D2 containment block** (server.ts ~3715-3733), restoring the original feature gate that sits commented beside it — a DELETION, not a redesign (reversible by design, the inverse of d26cc132c v0.8.93). Exact edit: replace the `403 severed + socket.destroy + return` body with the uncommented original gate:
   ```
   if (path === '/api/server-manager/terminal') {
     if (!ServerManagerGuard.requireFeatureAccess(req, 'Server Manager', resolveSessionToken, featureAllowedUsers).ok) {
       const ip = req.socket.remoteAddress || 'unknown';
       addLog(`[server-manager] DENY kind=ws path=${path} token=${(ServerManagerGuard.playerTokenFrom(req) || 'none').slice(0, 8)} ip=${ip}`);
       socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); socket.destroy(); return;
     }
     termWss.handleUpgrade(req, socket, head, (ws) => termWss.emit('connection', ws, req));
   }
   ```
   All referenced symbols current (requireFeatureAccess/resolveSessionToken/featureAllowedUsers per server.ts:1038; termWss @3712; PtyBridge.attachPane @3740). Guaranteed to compile (pre-containment state).
3. **Deploy** (client-facing — terminal returns to Tron's view): bump SOURCE config unit → `node build.mjs` → commit via rbadd (server.ts + package.json + sw.js + dist) → restart server:0.2 → verify served==committed + terminal ws connects for the owner. Optional follow: drop the now-moot `severed-for-security` notice in rb-terminal-detail.ts.
4. **DO NOT un-sever before rotation.** Rotation first, un-sever immediately after.
- ★ ONE small guard is the PO's PROPOSAL TO TRON (his call, NOT ours to build unasked): a lint failing if any owner-auth value appears in a tracked file (prevents a credential re-leak). Do NOT build unless Tron says so.

---
**Author:** robbin-expert · **2026-08-24** · [ANALYSIS ONLY — refactor CANCELLED above] Shape was architect-RATIFIED (note 314ea6ca1) + PO-confirmed before Tron cancelled — retained as the measured auth-surface analysis. **NOT deployable until Tron ROTATES the token** + architect re-backstops the FULL chain. Terminal stays SEVERED (server.ts:3705) = safe state.

## ★★★ THE PRIMARY DELIVERABLE IS THE LINT (PO headline), not the auth string-fix
**TWO-FOR-TWO: two independent, competent fixes BOTH reopened arbitrary shell-exec.** (1) my sm_session gate — the public literal mints a session. (2) my protected-identity finding — 05e58f81 is PUBLIC (10 files), path-(b) has no live-session check, `profileUuidOf(uuid)=uuid` ⇒ present the bare public uuid COLD → owner → PTY. **Both swapped one public value for another public value.** ⇒ THE REAL ROOT, generalised: it is not WHICH value is trusted — it is that **ANY value found in the repo is trusted AT ALL, presented cold with no session.** Every fix that names a specific value reproduces this. So the **INV-G2 LINT EXTENSION — "no owner-auth path accepts ANY value that appears in a TRACKED file, presented cold" — IS THE HEADLINE.** The auth change fixes today's two strings; the LINT makes the THIRD instance impossible-by-construction. **Failable test covers the 05e58f81-COLD attack too** (a test covering only 41ad88c4 would have passed the protected-identity fix while it was wide open). ★ BANKED ON THE SURFACE: nobody edits owner-auth here without the architect backstop — not process, the **measured failure rate** (2/2 competent fixes reopened RCE).

## The RCE chain (measured on disk, HEAD 279183055 / v0.8.130)
`x-player-token: 41ad88c4…` (the PUBLIC literal, committed in 37 tracked files) → gate at **server.ts:1664** = `requireFeatureAccessHttp('Server Manager')` (data-driven `Feature.allowedUsers` membership) → **POST /api/server-manager/session** mints an `sm_session` cookie (owner:true, server.ts:1735-1737) → that cookie authenticates the **terminal ws-upgrade** → **PTY → shell**.

The literal passes the membership gate because **`ServerManagerGuard.seedOwnerInto` pushes `OWNER_TOKEN` into every `Feature.allowedUsers`** as the bootstrap root-of-trust (ServerManagerGuard.ts:69-71, called by FeatureManager.bootstrapSeed). It is ALSO accepted directly by `assertOwner`/`isOwner` (timingSafeEqual against the literal, :29/:40) which `resolveOwner` path-(a) uses.

## ★ KEY FINDING — a NON-literal owner path ALREADY exists (so removal need NOT lock the owner out)
`resolveOwner` (server.ts:943-959) has TWO owner paths:
- **(a) literal** — `assertOwner` timingSafeEqual against `OWNER_TOKEN` 41ad88c4. **← the RCE root.**
- **(b) protected-identity** — the caller's REAL player token → `FeatureManager.profileUuidOf(token)` → the owner's **Profile-unit uuid**; owner iff that uuid ∈ `loadProtectedIdentities().ids` (contains Tron's profile **05e58f81**). This is keyed on the owner's per-user PROFILE identity, **not** the shared public literal.

Path (b) is seeded into `allowedUsers` at boot separately (the protected-identities re-seed, FeatureManager.ts:26). So the legitimate owner authenticates as **05e58f81** without the literal.

## ⛔ MY KEY FINDING WAS A TRAP — architect Q2 = NO (note 314ea6ca1, verified first-hand). Path-(b) is ITSELF RCE-open.
"Protected-identity ONLY" swaps one public value for another: `x-player-token: 05e58f81` (the owner PROFILE-UUID, PUBLIC in 10 tracked files) → `profileUuidOf(05e58f81)=05e58f81` (a bare profile-uuid presented as a token resolves to itself, FeatureManager.ts:158) → ∈ protected-ids → OWNER → POST /session → cookie → terminal → PTY. resolveOwner path-(b) (server.ts:956-959) does **NO** live-session/`tokenToClient` check — it trusts ANY presented token whose profileUuidOf ∈ protected-ids. It also passes `requireFeatureAccess` (05e58f81 is seeded in allowedUsers), so dropping the literal from allowedUsers leaves 05e58f81 = **RCE unchanged**. A cold attack with NO secret.

## ✅ CORRECTED STRUCTURAL SHAPE — architect-RATIFIED (build THIS)
1. **Drop path-(a) literal-trust** — YES. `assertOwner`/`isOwner` no longer timingSafeEqual a hardcoded literal; remove the `assertOwner` literal call from `resolveOwner`.
2. **Path-(b) must require a SECRET the attacker cannot present:** accept the presented `tok` for the protected-identity check ONLY if it is a GENUINE TOKEN-KEY (`userProfiles.has(tok)`) OR a LIVE session (`tokenToClient.has(tok)`). **A bare profile-uuid presented cold is REJECTED.** Combined with Tron's **ROTATION** (the owner's real token becomes a NEW secret, not the public 41ad88c4) ⇒ BOTH public values (literal AND profile-uuid) authenticate NOWHERE.
3. **Delete the `OWNER_TOKEN` literal + EXTEND the INV-G2 lint:** no owner-auth path accepts ANY value that appears in a TRACKED file (covers the literal AND the public profile-uuid — the general invariant, not two special-cases).
4. **COND-2 recovery** still lists the owner's protected profile-uuid, but since auth now requires the token-key/live-session, **05e58f81 being public is HARMLESS** (can't be presented cold).
5. **Terminal gate** (when eventually un-severed, separate step): gate on `sm_session` owner:true — sound ONLY because the mint now requires a genuine-token-key/live-session owner, so neither public value obtains a session.

## Q1 — RESOLVED by PO (binding): FAIL-CLOSED, with two conditions that are part of the deliverable
A credential fallback that grants access when config is broken IS a permanent backdoor — it created this RCE. An outage is visible/bounded/recoverable; an RCE is silent/unbounded/already-exploited. So: removing the literal-seed ⇒ a broken protected-ids config fails CLOSED (no owner auth). PO added two mandatory conditions:

**CONDITION 1 — FAIL-LOUD = loud AND ACTIONABLE (PO refinement), not just distinguishable (AMEND-4, a swallowed degrade recreates the silent bug).** When `loadProtectedIdentities().error != null` and no valid owner membership resolves, the owner-gated surfaces must return a distinct AND self-documenting signal: `owner auth unavailable: <config-absent|config-malformed>` **plus the recovery in the message itself** — the `PROTECTED_IDS_FILE` path + the one-line fix + a pointer to `docs/owner-auth-recovery.md`, so **Tron reads the fix in the error he is looking at** (a recovery only findable once already locked out is useless). NEVER a generic 403 / broken spinner. Boot: upgrade FeatureManager.ts:64 `console.warn` → a LOUD boot **ERROR** naming the file + reason + fix. Tron must tell 'config broken' vs 'not owner' vs 'feature severed' in ONE glance. `/api/health.protectedIdentities {configured, error}` (server.ts:2937) already half-present — extend to the gate responses. ★ The recovery doc is ALREADY LIVE + findable (not only in this dated note): `docs/owner-auth-recovery.md` + a README "Operations" pointer (COND-2 home requirement satisfied).

**CONDITION 2 — a DOCUMENTED, TESTED host-recovery path (fail-closed is only responsible if a lockout is a 5-minute fix).** Measured + concrete:
- **File** (untracked host config): `$RAWBIN_PROTECTED_IDS` else `/root/.rawbin/protected-owner-identities.json` (FeatureManager.ts:22).
- **Shape:** a JSON ARRAY of owner PROFILE-uuid strings — `["05e58f81-…full-uuid…"]`. (A profile uuid is an IDENTITY, not a credential — safe to document; the actual credential is the owner's own player token, never written here.)
- **Restore from the host with NO owner session:** write that file with the owner's profile uuid → restart (or it re-reads per gate). **Verify:** `curl -sk https://localhost:4444/api/health` ⇒ `protectedIdentities.configured ≥ 1, error: null`; boot log ⇒ `loaded N trusted identities`. Then the owner's existing client (its `rawbin-player-id` player token → `profileUuidOf` → 05e58f81 ∈ ids) authenticates — no literal.
- **TEST (not just describe), safely:** exercise via `RAWBIN_PROTECTED_IDS=<scratch file>` env override — absent ⇒ gate returns `owner auth unavailable: config-absent` (fail-loud); malformed ⇒ `config-malformed`; valid `["05e58f81…"]` ⇒ owner auth works. NO live-config mutation ([[dont-force-prod-mutation-build-safe-test]]).

## Remaining open questions for the architect (I will not guess these on an RCE surface)
- **Q2 — is path (b) sound end-to-end?** Confirm `profileUuidOf(token)` cannot be driven to 05e58f81 by any attacker-presentable token (the token→profile binding must be the owner's own per-user secret, `tokenToClient`/profiles map). If sound, (b) is a complete owner auth.
- **Q3 — client secret delivery:** the mint button (server.ts:1130) sends `token` as x-player-token. Post-removal the owner's client must present its protected-identity player token (which it already holds as `rawbin-player-id`) — confirm no client change needed, or scope it.
- **Q4 — bootstrap-secret source (only if Q1/Q2 don't fully cover owner auth):** env vs untracked config; fail-closed semantics. Tron sets the value (rotation) — I NEVER write a secret value (propose+GO discipline).

## MANDATORY FAILABLE TEST (architect-required; must exercise the full chain, not no-cookie→403)
`literal 41ad88c4` → `POST /api/server-manager/session` → **use the returned cookie** → terminal ws-upgrade must **403, no PTY**. GREEN-if-connects = **RED** (the RCE returned). Plus: broken/absent protected-identity config ⇒ mint 403 (fail-closed); the REAL protected identity ⇒ owner path still works (no lock-out).

## Sequencing
architect ratifies shape → I build to it (auth code + failable test + repurposed INV-G2 lint) → architect re-backstops the FULL chain → **Tron rotates OWNER_TOKEN** (I never write the value) → only THEN un-sever + deploy. Zero rush (PO: "rather Tron wait than reopen an RCE").
