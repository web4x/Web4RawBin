# R31.8 DESIGN — `Feature` unit type + FeatureManager root-of-trust (robbin-architect 2026-07-21)

Tron: model a scenario-first `Feature` type — referenced by all its implementations (both-way), referencing the user profiles allowed to use it; ServerManager + FeatureManager are Features; profile shows the user's granted features. Generalizes R31.1 (render) + R31.2 (gate) data-driven, WITHOUT weakening the security. MEASURED first, then design; security/bootstrap is the architect call (below).

## MEASURED — current topology
- **Profiles = `Map<token, UserProfile>`** (server.ts:166) persisted as a JSON array to PROFILES_PATH (:198); `UserProfile` iface (:129) keyed by `token`. NOT scenario units yet. → For R31.8, `Feature.allowedUsers` references the profile's **token** (the stable user identity, e.g. Tron `41ad88c4…`); `profile.features` is a new field on UserProfile. (Full profile-as-scenario-unit = a later R31.7-aligned migration; token-ref works now + is stable.)
- **Gate = choke-point** server.ts:891 `if (filepath==='/server-manager' || startsWith('/api/server-manager/')) { if(!requireOwnerHttp(req,res)) return; }` → `requireOwnerHttp`→`resolveOwner`/`ServerManagerGuard.assertOwner` (hardcoded `OWNER_TOKEN` + live-session + sm_session cookie). INV-G1/2/3.
- **Render bridge** server.ts:2625 sets `serverManager: ServerManagerGuard.isOwner(profile.token)` on the PROFILE ws msg → `renderFeatureGrants` (:862) shows the entry IFF `m.serverManager`.

## (1) The `Feature` typed unit (`ior:class:Feature`) + bidirectional graph
```
{ "ior": "ior:class:Feature",
  "model": { "uuid", "name", "description", "icon",
             "implementations": [ "ior:instance:<impl-uuid>", … ],   // → Impl units
             "allowedUsers":    [ "<profile-token>", … ] } }          // → user identities
```
**Both-way, MIRROR-MAINTAINED (like Class.methods[] ↔ Method.ownerIor):**
- `Feature.implementations[]` ↔ **`Impl.feature`** (new back-ref on `ior:class:Implementation`). Adding an impl to a feature writes BOTH sides. Navigation: Feature→its impls; impl→its Feature.
- `Feature.allowedUsers[]` ↔ **`profile.features[]`** (new field, Feature-uuid refs). A grant writes BOTH sides atomically; a revoke removes from BOTH. Navigation: Feature→its users; user→their features.
- Mirror invariant (INV-F-MIRROR): for every `f ∈ Feature.implementations`, `Impl(f).feature == Feature`; for every `u ∈ Feature.allowedUsers`, `u`'s profile has `Feature ∈ profile.features`. A drift-check (like the existing reverse-link verify) fails loud.

## Instances (req mints scenario-first, #126)
- **ServerManager** Feature: implementations=[assertOwner 8bb1842f, attachPane 394eac63, readSessionTree 5c1701bc, renderFeatureGrants f345b8ed, buildSeedNode 5b3d9f1a…]; allowedUsers=[Tron 41ad88c4…].
- **FeatureManager** Feature: implementations=[grant/revoke logic + enable/disable UI]; allowedUsers=[Tron].

## (2) DATA-DRIVEN access + ★ SECURITY / BOOTSTRAP (architect call) — generalizes R31.2, NEVER weakens it
**The gate generalizes from "is caller THE owner?" to "is caller in `Feature.allowedUsers`?"** — data, not a hardcoded literal per feature. New server-side guard, SAME shape as assertOwner (fail-closed):
```
requireFeatureAccess(req, featureName): boolean
  token = playerTokenFrom(req)  // header/cookie, R31.2
  if (!token || !isLiveSession(token)) return 403        // live authenticated session (unchanged)
  if (!Feature(featureName).allowedUsers.includes(token)) return 403   // data-driven membership
  return true    // else 403 + addLog DENY (audit)
```

### ROOT-OF-TRUST DECISION (my call): FeatureManager WRITES stay HARDCODED-owner; feature ACCESS is data-driven
The privilege-escalation trap: if FeatureManager access were itself data-driven (`FeatureManager.allowedUsers`), anyone who reached it could add themselves to ANY feature (incl. FeatureManager) → self-grant escalation → the whole model is worthless. So the GRANT-EDITING authority must be IMMUTABLE.
- **FeatureManager grant/revoke (writes to any `allowedUsers`/`profile.features`) = gated by the HARDCODED owner-gate** (`ServerManagerGuard.assertOwner`, the R31.2 `OWNER_TOKEN`) — the root-of-trust, NOT data-driven. Only the hardcoded owner mutates grants.
- **BOOTSTRAP:** at first run, seed `FeatureManager.allowedUsers=[OWNER_TOKEN]` AND `ServerManager.allowedUsers=[OWNER_TOKEN]` from the hardcoded `OWNER_TOKEN` (Tron). The hardcoded owner is the bootstrap root; from there Tron grants everyone else via FeatureManager. No grant path exists that doesn't originate at the hardcoded owner.
- **Feature ACCESS** (ServerManager + future features, and READ of FeatureManager's own page) = data-driven `requireFeatureAccess(feature)`. Grants only ADD a membership check; they never remove the server-side enforcement.

### INV-G PRESERVED BY CONSTRUCTION (→ INV-F, do NOT weaken)
| R31.2 | R31.8 generalization |
|-------|----------------------|
| INV-G1: every /server-manager route+ws → 403 for non-owner | **INV-F1:** every feature's routes+ws gated server-side by `requireFeatureAccess(feature)` at the choke-point; non-member→403. The gate is ADDED at the same choke-point (server.ts:891 pattern), never bypassed; UI-hiding is NOT the gate. |
| INV-G2: OWNER_TOKEN literal ==1 | **INV-G2 UNCHANGED:** the hardcoded literal stays ==1, now the FeatureManager root-of-trust + bootstrap seed. Feature access adds NO new literals (uses `allowedUsers` data). grep-guard still ==1. |
| INV-G3: rejected ws upgrade never opens the socket | **INV-F3:** a feature ws upgrade checks `requireFeatureAccess` before `handleUpgrade`; non-member → `socket.destroy` before open, no handler/pty. |
| — | **INV-F4 (root-of-trust):** grant/revoke (any `allowedUsers`/`profile.features` write) is reachable ONLY through the hardcoded-owner gate; a non-owner grant attempt → 403, never mutates. A data-driven-only path to grant-editing = a HOLE (rejected). |
| — | **INV-F5 (grants ADD-only to checks):** a feature with empty/malformed `allowedUsers` FAILS CLOSED (403 for all incl. owner-unless-bootstrap-seeded), never fails-open. |

## (3) Profile feature-list render off the model (generalizes R31.1)
Replace the single `serverManager: isOwner(token)` flag (server.ts:2625) with **`features: <Feature[] where token ∈ allowedUsers>`** on the PROFILE ws msg (server-computed, same trust path — the client can't self-grant). `renderFeatureGrants` iterates `m.features` → renders one entry per granted Feature (name/icon/link), at the profile bottom (#feature-grants). For Tron: [ServerManager, FeatureManager]. Non-granted user → empty list → section absent by construction (not UI-hidden). This IS R31.1, now Feature-model-driven.

## Route / handoff
Design-only (architect). req: formalize `ior:class:Feature` + `Impl.feature` back-ref + `profile.features` field + mint ServerManager & FeatureManager instances + reframe R31.1/R31.2 as Feature-model instances (in place, same altIds). expert: implement the Feature units + mirror-maintained back-refs + `requireFeatureAccess` gate (ServerManager switches to it) + FeatureManager grant/revoke (hardcoded-owner-gated, writes both mirror sides) + bootstrap seed + profile `m.features` render. tester: gate — both-way nav resolves (Feature↔Impl, Feature↔profile); grant via FeatureManager (owner) flips a user's access member-200/non-member-403; revoke flips back; profile lists exactly the granted features; INV-F1..5 hold (non-owner grant→403, feature routes/ws 403 for non-members, OWNER_TOKEN literal==1, empty allowedUsers fails-closed). I backstop the security invariants (INV-F, esp. the root-of-trust) + a real restart on ship. Composes with R31.7 (Feature/profile grants are typed scenario units = data-on-disk-is-truth).

## SESSION/COOKIE + MINT GENERALIZATION + INV-F6 (PO-approved security, 2026-07-22) — the access token source
Measured: `smSessions = Map<sid,{owner,expiresAt}>` (server.ts:811), cookie = random `sm_session` sid (crypto.randomUUID); resolveOwner cookie path returns placeholder `token:'sm_session'` + checks the `owner` boolean — cannot ID the user for `allowedUsers`. Fix (PO-approved):

### slice-(a) EXACT SPEC (relay verbatim to the expert)
- Store the TOKEN in the smSessions Map **VALUE**: `{ owner, expiresAt, token }`, keyed by the random `sid`. The cookie VALUE stays the opaque random `sid` — NOT the token. **That distinction IS the security:** httpOnly holds, the token is never JS-exposed, a stolen cookie = an expiring/revocable `sid` (NOT the raw token). No new exposure — the token already lives in server memory (tokenToClient).
- `requireFeatureAccess` resolves the token via cookie→`smSessions.get(sid).token` (or the header path), then checks `token ∈ Feature.allowedUsers`. Returns the REAL token, not the `'sm_session'` placeholder. Membership check UNCHANGED (INV-F). Cookie validity = the liveness proof (minted post-auth, R31.2-consistent).
- slice-(a) is owner-only (allowedUsers=[owner]): owner mints → session token=owner → ServerManager membership → 200; non-owner has no session → 403.

### slice-(b+) MINT GENERALIZATION (PO-approved) — required for data-driven access to be non-inert
- `/session` mint GENERALIZES from owner-only to **any LIVE authenticated user binds THEIR OWN token to a session** (minting is NON-privileged — it just binds your already-authenticated live token to a cookie). 
- `FeatureManager` grant/revoke (who is IN `allowedUsers`) STAYS **hardcoded-owner** (root-of-trust, INV-F4). Access = per-feature `allowedUsers` membership.
- Triad: **mint = any-live-user(own token) / grant-revoke = hardcoded-owner / access = per-feature allowedUsers**.

### ★ INV-F6 (membership-NOT-session-absence) — the invariant SHIFT the generalized mint forces
Under slice-(a), a non-owner is 403 because they have NO session. Under slice-(b+), a non-owner CAN mint a valid OWN session — so the 403 MUST rest on the **allowedUsers-MEMBERSHIP check, NEVER on session-absence**. 
- **The gate MUST re-derive access per-request from `token ∈ Feature.allowedUsers` — it must NOT shortcut on `s.owner` or on "has a valid sm_session ⇒ authorized".** The current resolveOwner cookie path (`if s.owner → ok`) is R31.2-owner-semantics; for FEATURE access it must become `token = s.token; ok = token ∈ feature.allowedUsers`. The `owner` boolean is ONLY for the FeatureManager write-gate (root-of-trust), NEVER for feature access.
- **Test (tester gates slice-b+):** a non-owner holding a VALID own-session STILL gets **403 on ServerManager** (token ∉ ServerManager.allowedUsers) — proving the gate is membership-driven, not session-presence-driven. Grant that user via FeatureManager (owner) → their SAME session now → 200. Revoke → 403 again. Access flips with MEMBERSHIP, session unchanged.
- Composes with INV-F1 (every feature route/ws gated by requireFeatureAccess) + INV-F5 (empty allowedUsers fails-closed). Correct-by-construction: authorization = membership, authentication = session; never conflate them.
