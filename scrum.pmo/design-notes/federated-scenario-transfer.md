# Federated Scenario Transfer — Architecture (foundation of RawBin federation)

**Author:** robbin-architect · 2026-07-01. Trigger: Tron dragged items between two RawBin servers. Grounded in: IOR shape (`ior:instance:<uuid>`), content-addressable file storage (file-unit.ts: sha256 `contentHash` + dedup), DnD (rb-object-item.ts:128-130 sets a *reference*, not full JSON), `/api/trace/children` + `/api/ior`. Scenario-first (#126): this note is the design input; req captures reqs before any code.

**One principle throughout: STRUCTURE eager, PAYLOAD lazy, IDENTITY by-reference.**

## (1) Federated IOR — provenance via originHost
Today an IOR is origin-implicit (local uuid). Federation needs provenance so a reference is resolvable across servers.
- **IOR string gains an optional host suffix:** `ior:instance:<uuid>@<originHost>`. Local IORs omit `@host` (implicit self) — 100% back-compatible with every existing `ior:instance:<uuid>`. Example: `ior:instance:abc…@https://rawbin.alice.example`.
- **The imported unit stores provenance in its model:** `model.originHost` (source server canonical URL) + `model.originIor` (the original `ior:instance:<uuid>@host`). Local-born units: absent.
- **Resolution via a pluggable loader (the IOR loader-registry pattern):** the resolver inspects the IOR — no `@host` or `@self` → `ScenarioIndex.get` (local); `@remote` → the federated loader fetches via (3). Register a `federated` loader keyed on `@host`, exactly as FileLoader is registered for local. This keeps resolution polymorphic and lets a federated IOR be dereferenced lazily anywhere it appears (ISR-style).
- originHost reuses the server's existing identity (RawBin already has per-server domain/host identity); it is the canonical `https://…` origin, not an IP.

## (2) Cross-origin DnD protocol — reference + fetch URL, NOT full JSON
DnD already carries a reference (uuid + `/app` URL) but only same-origin-resolvable. For cross-origin, put a **self-contained federated reference** in DataTransfer — do NOT serialize the full scenario (files are MB; DataTransfer has size limits and is synchronous-read-only):
```
application/rb-federated-ref =
  { ior: "ior:instance:<uuid>@<originHost>", originHost, type, name,
    fetchUrl: "<originHost>/api/scenario/<uuid>?grant=<capabilityToken>",
    contentHash?: "<sha256 for File units>" }
text/uri-list = "<originHost>/app#<hash>"   // human/browser fallback (unchanged)
```
- The receiver reads the federated-ref and asks ITS OWN server to import from `fetchUrl` (see 3). Reference+fetch = scalable, lets the receiver choose lazy/eager, and works for a 1KB note or a 1GB video identically.
- **Optimization:** for tiny units (URL WebItem, short text) the full JSON MAY be inlined in the ref to skip the round-trip; the canonical path stays reference+fetch.

## (3) Server-to-server scenario fetch API (on the ORIGIN)
New endpoints, served by the source server; **fetched server-to-server (receiver's server calls origin), NOT browser→origin** — so no CORS, and auth is server-presented:
- `GET /api/scenario/<uuid>` → the unit JSON (`ScenarioIndex.get`).
- `GET /api/scenario/<uuid>/content` → file bytes (content-addressable) — only when the receiver lacks the `contentHash`.
- `GET /api/scenario/<uuid>/children?mode=trace` → forward children (reuse `/api/trace/children`) for tree walk.
- **Auth = capability token (ad-hoc DnD) + server-keypair signature (established federation):**
  - At **drag-start**, the origin mints a short-lived, signed grant scoped to `{uuid + its transferable subtree}`, embedded in `fetchUrl?grant=…`. Only the drag recipient holds it; it expires (minutes). Scopes access to exactly the dragged item — no full server trust needed for a one-off.
  - For standing federation between known servers, requests are signed with the server's keypair (RawBin already has RSA keypairs for users/devices — extend to a server identity key). The origin verifies the caller server's signature + a trust list.
- Rate-limit + audit-log every federated fetch (addLog), like the Nominatim worker.

## (4) Lazy vs eager child transfer
- **Eager:** the primary unit + light metadata → mint immediately so the item appears in the target room instantly.
- **Lazy:** file BYTES (fetch `/content` on first preview/open), deep subtrees, room MEMBER profiles.
- **Content dedup across servers:** a File unit carries `contentHash`. On import, if the receiver already stores that hash (its own content-addressable index), **skip the byte transfer entirely** — just relink. Cross-server dedup falls out of the existing hash model for free.
- **Room members = by-reference, NOT minted locally.** Transferring a room copies the room + its File/WebItem children (structure eager, bytes lazy), but each member stays a **federated identity reference** (`ior:instance:<memberUuid>@originHost`). Do NOT mint foreign identities as local profiles — that would re-create the exact duplication R25.7 just fixed. A foreign member materializes locally only if that user later connects + consolidates (ties to R25.7 `redirectTo`).

## (5) Conflict resolution — uuid already exists locally
A scenario uuid is v4 (globally unique by construction), so "exists locally" almost always means the SAME logical unit (re-drag) — reconcile, never blind-duplicate:
- **Same uuid + same originHost** → idempotent re-transfer: update the local copy IF the remote is newer (`updatedAt`/version compare), else no-op. Re-dragging is safe.
- **Same uuid + DIFFERENT originHost** (a genuine distinct unit that collides) → **re-mint under a fresh local uuid**, set `model.originIor = ior:instance:<oldUuid>@<host>` for provenance, and **rewrite all inbound forward refs** to the new uuid (the import remap pass). Same shape as the company mint-new-on-conflict.
- **Content files** dedup by `contentHash` regardless of uuid (same bytes = same content unit).
- **Reference-rewrite pass on import:** for every forward ref (children[]/parentFolder/class/etc.) in the incoming unit — if the target is also in this transfer → remap to its new local uuid; if it stays remote → keep as a federated `@host` IOR (resolves lazily via the loader); if it already exists locally → relink. This keeps the chain intact across the boundary.
- Always record `originHost` + `originIor` so a federated copy can attribute + re-sync later.

## Security / trust (cross-cutting)
- Capability grants are signed + expiring + scoped (no ambient authority). Server-federation signatures use a per-server keypair + explicit trust list (no open fetch). Never trust incoming JSON blindly: validate schema, cap size, sanitize, and NEVER execute; foreign identities never become local auth principals.

## Traceability (#126 — scenario first)
Foundational → its own Sprint (RawBin Federation). Recommend req capture reqs; UCs I then refine:
- `ior.federatedOrigin` (Class IOR / resolver — @host + provenance + pluggable federated loader)
- `dnd.federatedReference` (Class DropDispatcher — the rb-federated-ref DataTransfer contract)
- `federation.scenarioFetchApi` (Class server — GET /api/scenario/<uuid>{,/content,/children} + capability/signature auth)
- `federation.lazyChildResolve` (Class Transfer — eager-structure/lazy-payload + contentHash dedup + members-by-reference)
- `federation.conflictReconcile` (Class Transfer — same/other-origin reconcile + reference-rewrite remap)
The one-time nothing here; it is greenfield federation — full design-ahead chain minted BEFORE the expert codes.
