# S37 "consistency by design" — full architect design (2026-08-12)

Source of truth: session/tasks/TRON-ORDER-S37-dnd-units-ior-origin.md. Reuse-not-fork map done (5 mechanisms). req mints scenario-first; this is the DETAILED impl-shape design. ★ THE SPINE (tell any successor): **inc-3's `resolveRefUnit` is the backbone** — Tron's four clusters collapse onto TWO shared primitives + real Folder units (B) + discovered root (D).

## THE SPINE — two shared primitives (single-source)
1. **`resolveRefUnit(rawRef) → {uuid,type,kind,unit}`** (inc-3) — the SOLE ref→unit resolver (synthetic via full-ref `/api/ior`→ensureViewUnit lazy-mint; real via `ior:instance:<uuid>`). Importers: detail · action-bar · nav · **DnD-serialize (4th)**.
2. **`deserializeDropUnit(payload) → {unit}`** — the SOLE origin-aware payload→unit consumer: reads the scenario-UNIT JSON in the buffer; if the unit's IOR carries a NON-LOCAL origin, re-fetch the real unit via `/api/ior` on that origin (federation import). ONE consumer, every drop target.
Two holes that produced the plain-URL WebItem months ago — payload had no unit (A) + IOR had no origin (C) — both close on this spine.

## A — DnD carries the ACTUAL UNIT (never *.show?uuid=/URL) — ONE serializer, ONE deserializer, fleet-wide
**Current (map):** the ONE producer `rb-object-item.ts:121 onDragStart` emits `#${type}.show?uuid=${uuid}` into text/plain + text/uri-list (`${origin}/app#…`) + `application/rb-object-ref` (raw `type:uuid`) + `application/rb-federated-ref` (JSON via `drop-dispatcher.buildFederatedRef`). Consumers: RoomView drop (`:199-253`), diagram surface `onDropAddView` (`rb-diagram-detail.ts:241`), profile avatar (files). NO tree/editor drop consumer yet.

**Design:**
- **SERIALIZER (shared, drag-start):** `serializeDragUnit(rawRef) = JSON.stringify(await resolveRefUnit(rawRef).unit)`. The buffer's primary payload (a single MIME, e.g. `application/rb-unit`) = the **full scenario-unit JSON** (Tron A2 verbatim example: the `{ior,ownerIor,model}` object), NOT a link. **DELETE the `#type.show?uuid=` producer + the text/uri-list `/app#…` URL** — those are the "generally wrong" links. Keep `application/rb-federated-ref` but make it origin-COMPLETE per C (it already carries `ior:instance:uuid@host` + `fetchUrl=host/api/scenario/uuid`). text/plain MAY carry a human label (the unit name), never a `.show?uuid=` ref.
- **A1 (file drags as file):** the serializer resolves the dragged node's REAL unit via `resolveRefUnit` → a File node yields the `ior:class:File` unit, a folder yields `ior:class:Folder` — never a `collection`. The double-prefix/`collection`-type mis-labeling (see inc-3) is fixed at the SAME source (mofFolder type + the resolver), so "file drags as file" falls out by construction.
- **DESERIALIZER (shared, every drop target):** `deserializeDropUnit(dataTransfer)` reads `application/rb-unit` (the unit JSON) OR `application/rb-federated-ref` (origin ref → C re-fetch); every target (RoomView drop · diagram `onDropAddView` · future /model-tree · editor/drawer) calls it and gets a UNIT — no per-target parse, no scheme-URL/file fallback that mints a plain WebItem. Diagram `onDropAddView` places THAT unit on the diagram (Tron amendment "onDrop to diagramms"); Room import stores THAT unit.
- **GATE (per target + stub-must-fail):** BITE asserts each target (diagram · room · tree/collection · editor) receives a unit, not a link. ★ GREP-LINT (PO): **no `*.show?uuid=` PRODUCER survives in any drag-payload path** — grep `setData(...#${...}.show?uuid=` / `text/uri-list` with a `.show` hash → RED. Reintroduce a URL producer → RED = the "ALWAYS" enforced by construction, not per-target trust.

## C — IOR carries a clear ORIGIN (reconcile federated-ior, no 2nd scheme)
**Current (map):** ONE origin scheme exists — `federated-ior.ts`: `ior:instance:<uuid>@<originHost>` (host-only; bare = local). Producer `federatedIor(uuid,host,self)`, parser `parseFederatedIor`. `buildFederatedRef` already emits `ior:instance:uuid@host` + `fetchUrl=host/api/scenario/uuid`. Tron wants class+host+**path**: `ior:class:WebItem://prod.wo-da.de:4444/scenario/index/…/uuid.scenario.json`.
**Design (extend the ONE module, do NOT fork):**
- Extend `federated-ior.ts` with an origin-COMPLETE form that carries **class + host + unit-path**, and make `parseFederatedIor` accept BOTH the existing `ior:instance:<uuid>@<host>` AND the class+host+path form (100% back-compat: bare still local). The canonical producer stays `federatedIor(...)` — add the class+path params there; NO second producer.
- The DnD `rb-federated-ref` uses this complete form so a cross-instance drop's `deserializeDropUnit` re-fetches the REAL unit via `/api/ior`/federation-import on the origin (closing the "degraded to a plain-URL WebItem" hole). This is where **A meets C**: origin-complete IOR = the deserializer can always recover the unit.
- GATE: parse round-trips both forms; a cross-instance drop (WODA.prod↔WODA.test) resolves to the real unit, never a link; stub-must-fail: strip the origin → assert the drop can't silently mint a local WebItem (must fail loud / require origin).

## B — room Members/Files become REAL Folder units + sunburst (WIRE R40.16, don't duplicate)
**Existing task FOUND (verify-owner-first):** **R40.16** `[requirement:uuid:cc875e35-772b-4352-b99c-4070f0370a68]` → UC `[uc:uuid:966de307-0d5e-470e-b983-37db7ee3ec60]` "Folders as real scenario units — type-driven detail + item actions + child-size sunburst" (requirements.md:210-227, Backlog, NO task-md yet, NO sunburst code yet). WIRE S37-B to cc875e35 — do NOT mint a duplicate req/UC.
**Design:**
- Room `members-<roomUuid>`/`files-<roomUuid>` pseudo-collections → REAL `ior:class:Folder` units (reuse `FolderService.mintRealUnit`, kind e.g. `folder`/`members`/`files`), replacing the drawer collection-branch fetch. Converges with inc-3: once these are real Folder units, the collection-branch RETIRES entirely (every folder resolves via `resolveRefUnit`).
- Folder detail = the GENERIC type-driven view (R40.11 lineage, NOT bespoke — R40.16 AC) + a **child-size field** on the Folder unit (ONE source of truth, derived/stored) rendered as a **sunburst** (a VIEW over the field, not a second store). Sunburst component is NEW (none exists) — a view over the folder's child-size field.
- GATE: members/files render a real Folder detail with sunburst @390; the folder's child-size = one field (no 2nd source); wire to cc875e35 (no dup unit).

## D — server-manager root DISCOVERED, not hardcoded
**Current (map):** root is HARDCODED at `server.ts:1606` `NODE_UUID='fc327458…'` (the "WODA.prod" deployment node); literal "WODA.prod" fallbacks at `OtmuxBridge.ts:87` / `server.ts:1614`. Live-discovery precedent = `OtmuxBridge.readSessionTree` (`tmux list-panes -a -F`, execFile array-args). NO ssh-config parser exists.
**Design:**
- Discover the root host from real config on disk the way otmux discovers panes: add an `OtmuxBridge`-sibling `discoverRootHost()` that reads the host from config (ssh config `Host` block / the deployment node selected BY the running host's identity), replacing the hardcoded `NODE_UUID` selection with "which deployment node describes THIS host." On WODA.test it resolves WODA.test, not WODA.prod.
- Mirror readSessionTree's shape (execFile/read on disk, fail-open-and-loud). NO hardcoded host constant survives (grep-lint: no `'WODA.prod'`/`prod.wo-da.de` literal in the root-selection path).
- GATE: on WODA.test the server-manager root = WODA.test (discovered), not the hardcoded prod node; stub-must-fail: a wrong/absent config → fail-open-and-loud notice, never a silent wrong host.

## Cross-cutting: gates + the four grep-lints (single-source enforcement)
Each cluster carries a one-file/one-source grep-lint (the R40.37/APPROVE_STATUSES shape): (inc-3) synthetic-ref parse in one file; (A) no `*.show?uuid=` producer in any drag path; (C) one federated-ior producer/parser; (D) no hardcoded root host. All gates stub-must-fail ON THE CHECK. Device ACs @390 = Tron (tag AC-N-DEVICE). Guards stay (server-side authz on drop/import/folder-create unchanged — affordance/contract is additive). Full uuids everywhere.

## Sequencing
inc-1+inc-2 deploy (R40.37) → **inc-3** (resolveRefUnit spine = AC4+A3) → then S37 in dependency order: **C** (origin-complete IOR — A depends on it for cross-instance) → **A** (serializer 4th-importer + deserializer, retire *.show URLs) → **B** (real Folder units + sunburst, wire cc875e35; retires collection-branch) → **D** (discovered root, independent). Each is bounded and rides existing mechanisms (resolveRefUnit / federated-ior / FolderService / readSessionTree). req mints scenario-first per cluster.
