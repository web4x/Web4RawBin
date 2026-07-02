[Back to Planning](./planning.md)

# Sprint 26 — RawBin Federation — Requirements

**Source:** Tron directive 2026-07-01 (dragging items between two RawBin servers) + architect design.
**Design:** scrum.pmo/design-notes/federated-scenario-transfer.md (architect 7e940cf81). **Standard:** [traceability-standard.md](../../standards/traceability-standard.md).
**Principle:** STRUCTURE eager, PAYLOAD lazy, IDENTITY by-reference. This is GREENFIELD federation — full design-ahead chain minted BEFORE the expert codes (#126 scenario-first).
**Anti-dup note:** these R26.1-R26.5 are the CANONICAL R26.x (federation). The v0.6.97/98 gate labels 'R26.1/R26.2' for clipboard/scenario-link were a MISLABEL of R25.5/R25.6 (see gateLabelDrift on those units) and must be relabeled R25.5/R25.6.

---

## Requirements

- [ ] **R26.1 — Federated IOR — provenance via originHost**
  [requirement:uuid:e8744de9-ca4a-4f8b-a6d9-c7c971999d8b]
  An IOR gains an OPTIONAL host suffix (ior:instance:<uuid>@<originHost>) so a reference is resolvable across servers; local IORs omit @host (implicit self), 100% back-compatible. An imported unit records provenance in model.originHost + model.originIor. Resolution is polymorphic via a pluggable loader registry: no-@host resolves locally (ScenarioIndex.get), @remote resolves via a registered federated loader (fetch), so a federated IOR dereferences lazily anywhere it appears.
  *(design: scrum.pmo/design-notes/federated-scenario-transfer.md (architect 7e940cf81); Class IOR / resolver)*
  **Acceptance criteria:**
  - [ ] **(format)** The IOR string supports an optional host suffix: ior:instance:<uuid>@<originHost>; a local IOR omits @host (implicit self) and stays 100% back-compatible with every existing ior:instance:<uuid>.
  - [ ] **(provenance)** An imported unit stores provenance: model.originHost (source server canonical https:// URL) + model.originIor (the original ior:instance:<uuid>@host). Local-born units omit both.
  - [ ] **(resolver)** Resolution is polymorphic via a pluggable loader registry: no-@host/@self -> local ScenarioIndex.get; @remote -> a registered federated loader (fetches via R26.3), keyed on @host exactly as FileLoader is registered locally.
  - [ ] **(resolver)** A federated IOR can be dereferenced lazily anywhere it appears (ISR-style), not only at import.
  - [ ] **(identity)** originHost is the server's canonical https:// origin (reuses per-server host identity), never an IP.
  → [UC26.1: ior.federatedOrigin](./planning.md#uc26-1) `[uc:uuid:9b4a8c02-a913-45e9-b984-640defa70b33]` *(placeholder — architect to refine)*

- [ ] **R26.2 — Cross-origin DnD federated-reference protocol**
  [requirement:uuid:e36d585c-cbb1-4715-a175-fa844f375cde]
  Cross-origin drag puts a self-contained FEDERATED REFERENCE in the DataTransfer (application/rb-federated-ref = {ior@host, originHost, type, name, fetchUrl, contentHash?}) rather than the full scenario JSON (files are MB; DataTransfer is size-limited + sync-read). The receiver reads the ref and asks ITS OWN server to import from fetchUrl. A text/uri-list fallback stays for human/browser. Tiny units MAY inline full JSON to skip the round-trip.
  *(design: scrum.pmo/design-notes/federated-scenario-transfer.md (architect 7e940cf81); Class DropDispatcher)*
  **Acceptance criteria:**
  - [ ] **(protocol)** DataTransfer carries application/rb-federated-ref = { ior:'ior:instance:<uuid>@<originHost>', originHost, type, name, fetchUrl:'<originHost>/api/scenario/<uuid>?grant=<capabilityToken>', contentHash? }.
  - [ ] **(protocol)** The full scenario JSON is NOT serialized into DataTransfer (files are MB; size-limited + synchronous-read); the ref is a reference + fetch URL.
  - [ ] **(fallback)** A text/uri-list fallback = '<originHost>/app#<hash>' remains for human/browser (unchanged).
  - [ ] **(flow)** The receiver reads the federated-ref and asks ITS OWN server to import from fetchUrl (server-to-server, never browser->origin).
  - [ ] **(optimization)** For tiny units (URL WebItem, short text) the full JSON MAY be inlined in the ref to skip the round-trip; the canonical path stays reference+fetch.
  → [UC26.2: dnd.federatedReference](./planning.md#uc26-2) `[uc:uuid:13ce665c-0f13-4d1e-8d7d-1818f1e80ee1]` *(placeholder — architect to refine)*

- [ ] **R26.3 — Server-to-server scenario fetch API (on the origin)**
  [requirement:uuid:05d21385-766a-426d-9045-77255d5234a0]
  The origin server exposes GET /api/scenario/<uuid> (unit JSON), /content (file bytes, content-addressable, only when the receiver lacks the contentHash), and /children?mode=trace (forward children). Fetched server-to-server (receiver's server calls origin, NOT browser) so there is no CORS and auth is server-presented: a short-lived signed CAPABILITY grant for ad-hoc DnD, or a per-server keypair signature + trust list for standing federation. Every federated fetch is rate-limited + audit-logged.
  *(design: scrum.pmo/design-notes/federated-scenario-transfer.md (architect 7e940cf81); Class server)*
  **Acceptance criteria:**
  - [ ] **(endpoint)** GET /api/scenario/<uuid> returns the unit JSON (ScenarioIndex.get).
  - [ ] **(endpoint)** GET /api/scenario/<uuid>/content returns file bytes (content-addressable), served only when the receiver lacks the contentHash.
  - [ ] **(endpoint)** GET /api/scenario/<uuid>/children?mode=trace returns forward children (reuses /api/trace/children) for the tree walk.
  - [ ] **(transport)** Fetches are server-to-server (receiver's server calls origin), NOT browser->origin — no CORS; auth is server-presented.
  - [ ] **(auth)** Ad-hoc DnD auth = a short-lived SIGNED capability grant scoped to {uuid + its transferable subtree}, minutes-expiry, embedded in fetchUrl?grant=; only the drag recipient holds it.
  - [ ] **(auth)** Standing federation auth = the caller server signs requests with its per-server keypair; the origin verifies the signature + an explicit trust list.
  - [ ] **(safety)** Every federated fetch is rate-limited + audit-logged (addLog).
  → [UC26.3: federation.scenarioFetchApi](./planning.md#uc26-3) `[uc:uuid:e205f1b0-7e8f-4b52-932c-dc9ae2350ef6]` *(placeholder — architect to refine)*

- [ ] **R26.4 — Lazy child resolve — structure eager, payload lazy, members by-reference**
  [requirement:uuid:71b44e05-555f-4db2-a485-f375cd7ad70b]
  Transfer is STRUCTURE-eager / PAYLOAD-lazy: the primary unit + light metadata mint immediately (item appears instantly); file BYTES, deep subtrees, and member profiles resolve lazily on first need. Content dedups across servers by contentHash (skip the byte transfer + relink if the receiver already has it). Room MEMBERS stay federated identity references (ior@originHost), NEVER minted as local profiles — a foreign member only materializes locally on later connect+consolidate — so federation does NOT re-create the duplication R25.7 fixed.
  *(design: scrum.pmo/design-notes/federated-scenario-transfer.md (architect 7e940cf81); Class Transfer)*
  **Acceptance criteria:**
  - [ ] **(eager)** Eager: the primary unit + light metadata are minted immediately so the item appears in the target room instantly.
  - [ ] **(lazy)** Lazy: file BYTES fetch on first preview/open (via R26.3 /content); deep subtrees and member profiles resolve on demand.
  - [ ] **(dedup)** Content dedups across servers by contentHash: on import, if the receiver already stores that hash, SKIP the byte transfer and just relink.
  - [ ] **(members)** Room members transfer as federated identity references (ior:instance:<memberUuid>@originHost), NOT minted as local profiles; a foreign member materializes locally only on later connect+consolidate (ties to R25.7 redirectTo).
  - [ ] **(invariant)** Federating a room NEVER mints foreign identities as local members — it must not re-create the duplication R25.7 eliminated.
  → [UC26.4: federation.lazyChildResolve](./planning.md#uc26-4) `[uc:uuid:67859edd-c0a6-4cb0-8834-4d11c50e7ec1]` *(placeholder — architect to refine)*

- [ ] **R26.5 — Conflict reconcile — uuid already exists locally**
  [requirement:uuid:f7e4c1cc-c2a5-423c-bbaa-d010a2d1fa79]
  On import, a uuid that already exists locally is RECONCILED, never blind-duplicated. Same uuid + same originHost = idempotent re-transfer (update only if the remote is newer, else no-op). Same uuid + different originHost = a genuine collision: re-mint under a fresh local uuid, keep model.originIor for provenance, and rewrite all inbound forward refs (the import remap pass). Content files dedup by contentHash regardless of uuid. A reference-rewrite pass keeps the chain intact across the boundary.
  *(design: scrum.pmo/design-notes/federated-scenario-transfer.md (architect 7e940cf81); Class Transfer)*
  **Acceptance criteria:**
  - [ ] **(idempotent)** Same uuid + same originHost -> idempotent re-transfer: update the local copy IF the remote is newer (updatedAt/version), else no-op (re-dragging is safe).
  - [ ] **(remint)** Same uuid + DIFFERENT originHost -> re-mint under a fresh local uuid, set model.originIor = ior:instance:<oldUuid>@<host>, and rewrite all inbound forward refs to the new uuid (import remap).
  - [ ] **(dedup)** Content files dedup by contentHash regardless of uuid (same bytes = same content unit).
  - [ ] **(remap)** Reference-rewrite pass on import: for every forward ref (children[]/parentFolder/class/etc) — target in this transfer -> remap to its new local uuid; stays remote -> keep as a federated @host IOR (lazy resolve); already local -> relink. The chain stays intact across the boundary.
  - [ ] **(provenance)** Always record originHost + originIor so a federated copy can attribute + re-sync later.
  → [UC26.5: federation.conflictReconcile](./planning.md#uc26-5) `[uc:uuid:1f097e01-7d45-4e8c-b403-5a5ff5f0bfe6]` *(placeholder — architect to refine)*

- [ ] **R26.6 — Federation import wiring (end-to-end receive orchestration)**
  [requirement:uuid:e289f96e-0afc-4568-9c26-16cd9b8272eb]
  The receiver's `POST /api/federation/import` endpoint ORCHESTRATES R26.1-R26.5 into one working receive: federated-ref (R26.2) -> fetch from origin (R26.3) -> validate + recreate locally with provenance (R26.1) -> resolve children eager/lazy (R26.4) -> reconcile uuid conflict (R26.5), leaving the unit present locally with intact unitLinks.
  *(design: federated-scenario-transfer.md 7e940cf81; Class FederationApi. NOTE: code shipped v0.7.7 BEFORE this req — a #126 slip; chain completed retroactively for traceability.)*
  **Acceptance criteria:**
  - [ ] **(endpoint)** The receiver exposes `POST /api/federation/import` accepting a federated reference (or fetchUrl) and returning the imported unit's local IOR.
  - [ ] **(orchestrate)** Import sequences: fetch unit JSON from origin (R26.3) -> validate -> recreate locally with provenance (R26.1 originHost/originIor) -> resolve children per eager/lazy policy (R26.4) -> reconcile uuid conflict (R26.5) -> link the chain.
  - [ ] **(security-gate)** Incoming JSON is validated (schema + size-cap + sanitize), NEVER executed; foreign identities never become local auth principals (per securityNote + R25.7 members-by-reference).
  - [ ] **(result)** After import the transferred unit exists locally (recreated) with intact unitLinks + provenance, appearing in the target room/context.
  - [ ] **(idempotent)** Re-import of the same reference is safe — it delegates to the R26.5 reconcile (no blind duplicate).
  - [ ] **(composes)** R26.6 is the INTEGRATION that composes R26.1-R26.5 (<<include>>); the constituent capabilities live in those reqs.
  → [UC26.6: federation.import](./planning.md#uc26-6) `[uc:uuid:32f30eee-b0c8-4fca-b4d1-9ee6a1c0cdb1]` → FederationApi.importScenario

## Cross-cutting

- **Security / trust:** Cross-cutting security/trust: capability grants are signed + expiring + scoped (no ambient authority); server-federation signatures use a per-server keypair + explicit trust list (no open fetch). Never trust incoming JSON blindly — validate schema, cap size, sanitize, NEVER execute; foreign identities NEVER become local auth principals.

---

## Traceability Matrix

| Req | Skill | Requirement UUID | UC placeholder UUID |
|-----|-------|------------------|---------------------|
| R26.1 | Federated IOR — provenance via originHost | e8744de9-ca4a-4f8b-a6d9-c7c971999d8b | 9b4a8c02-a913-45e9-b984-640defa70b33 |
| R26.2 | Cross-origin DnD federated-reference protocol | e36d585c-cbb1-4715-a175-fa844f375cde | 13ce665c-0f13-4d1e-8d7d-1818f1e80ee1 |
| R26.3 | Server-to-server scenario fetch API (on the origin) | 05d21385-766a-426d-9045-77255d5234a0 | e205f1b0-7e8f-4b52-932c-dc9ae2350ef6 |
| R26.4 | Lazy child resolve — structure eager, payload lazy, members by-reference | 71b44e05-555f-4db2-a485-f375cd7ad70b | 67859edd-c0a6-4cb0-8834-4d11c50e7ec1 |
| R26.5 | Conflict reconcile — uuid already exists locally | f7e4c1cc-c2a5-423c-bbaa-d010a2d1fa79 | 1f097e01-7d45-4e8c-b403-5a5ff5f0bfe6 |
| R26.6 | Federation import wiring (end-to-end orchestration) | e289f96e-0afc-4568-9c26-16cd9b8272eb | 32f30eee-b0c8-4fca-b4d1-9ee6a1c0cdb1 |

*Captured by robbin-req 2026-07-01, grounded in architect design 7e940cf81. Greenfield federation, scenario-first (#126).*
