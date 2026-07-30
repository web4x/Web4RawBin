# Sprint 32 — MDA Model architecture (architect design, robbin-architect 2026-07-29)

Scenario-first design of the HARD parts (PO-vision.md). Layered as directed — **LAYER 1 (identity model) first**, then view-as-link, PUML no-dup, action-sync. Builds on the EXISTING substrate (no re-fork): `TraceModel` route-refs `type:uuid` + `links: Record<relation, ObjectRef[]>` (multi-ref, bidirectional) + `TraceGraph` (owns identity, REJECTS duplicate UUIDs) + scenario units (`ior:class:X`, `model{uuid,…}`). Reuse rb-trace-tree / RbPanZoom / rb-detail-drawer.

---

## ★ LAYER 1 — MoF 3-level IDENTITY MODEL (the central correct-by-construction invariant)

### The units
- **M3 (meta-meta, MOF root):** exactly TWO units — `Class` and `Relationship`. `metaLevel:'M3'`. `instanceOf` is REFLEXIVE at the top: `Class instanceOf Class`, `Relationship instanceOf Class` (MOF's self-describing ceiling). These are the only self-typed units — the fixed point.
- **M2 (UML profile):** units each `instanceOf` an M3 unit. `metaLevel:'M2'`. Two families:
  - MODEL metaclasses (instanceOf M3 `Class`): `UmlClass`, `UmlInterface`, `UmlAttribute`, `UmlMethod`, `UmlProperty` (getter+setter), `UmlFunction`, `UmlType`.
  - RELATIONSHIP metaclasses (instanceOf M3 `Relationship`): `UmlAssociation`, `UmlGeneralization`, `UmlDependency` (a typed attr/getter/setter → another type = an association/dependency).
  - CODE-representation metaclasses (instanceOf M3 `Class`): `ts-class-code`, `puml-class-code`, `ts-method-code`, … — the M2 types whose M1 instances ARE concrete serializable code artifacts.
- **M1 (the actual TS structures):** one unit per real element — a specific `class RbHeader`, `interface Foo`, `method render`, `attribute name`, `property visibility(get/set)`, `function bar`. `metaLevel:'M1'`. Each `instanceOf` its M2 metaclass(es).

### THE INVARIANT: same UUID across levels = ONE identity, multi-level representation
**A model element has ONE UUID. That UUID is its identity everywhere — the model unit, the diagram views, the .puml serialization, the .ts code all reference the SAME UUID. Never a copy, never a re-mint.** (This is the federated-IOR identity law applied to the model: one IOR/UUID, N representations/hosts — R25.7 identity-by-reference.)

Concretely, the PO's "a puml class is BOTH an M2 `instanceOf Class` AND an M1 `instanceOf puml-class-code`, same UUID": a class element (UUID X) carries a **multi-facet `instanceOf`** — the model already supports multi-ref relations:
```
X.instanceOf = [ 'umlclass:<UmlClass-uuid>',        // MODEL facet: X is-a UML Class (the M2/diagram view)
                 'ts-class-code:<ts-class-code-uuid>' ]  // CODE facet: X is-a concrete TS/puml code artifact
```
One unit X, two meta-facets, ONE UUID. Viewing X "as a Class" = the M2/type facet; viewing X "as concrete code" = the M1/instance facet. The dual-representation lives on the single unit — NOT two units with copied data.

### Unit shape (extends the scenario/Trace unit — additive, no schema fork)
```
ior: 'ior:class:ModelElement'
model:
  uuid            : <v4>                      // THE identity
  metaLevel       : 'M3' | 'M2' | 'M1'
  kind            : 'class'|'interface'|'attribute'|'property'|'method'|'function'|'type'|'relationship'
  name            : string
  instanceOf      : ObjectRef[]               // → meta one level up (multi-facet). REVERSE: 'instances'
  members         : ObjectRef[]               // composition: class → [attributes, methods, properties]  (REVERSE: 'memberOf')
  relatesTo       : ObjectRef[]               // typed attr/getter/setter → another element  (REVERSE: 'relatedFrom')
  diagramViews    : ObjectRef[]               // Layer 2: N view-links (identity-by-reference)  (REVERSE: 'viewsUnit')
  sourceFile/sourceLine, tsSignature, …       // code facet fields
```
- Reuse `TraceGraph.link(a, relation, b, inverse)` for EVERY relation → all bidirectional by construction. Reuse `type:uuid` refs + `refUuid`.
- `ior:class:ModelElement` is ONE unit type carrying `metaLevel`+`kind` (NOT a new ior per kind) → the same-UUID/one-unit law holds; the tree/drawer type-map keys off `kind`.

### Correct-by-construction PIN (the identity gate — like R31.7's version invariant)
A `Chain`/validator (CI + structural gate) enforces, so identity CANNOT drift:
1. **UUID uniqueness** — TraceGraph already rejects dupes; the gate asserts no UUID exists twice on disk.
2. **Level integrity** — every `instanceOf` points EXACTLY one level up (M1→M2, M2→M3), except the M3 reflexive fixed point (`Class instanceOf Class`). No M1→M3 skip, no down-links.
3. **instanceOf non-empty** — every M2/M1 unit has ≥1 `instanceOf` (M3 self-types).
4. **Serialization carries the UUID** — every .puml/.ts emission of X embeds `X.uuid` (puml stereotype/note-tag + a `[model:uuid:X]` code marker, mirroring `[impl:uuid:]`); the gate asserts round-trip re-binds to X, never re-mints. THIS is the no-duplication law (Layer 3) rooted in the identity.
5. **Same-UUID cross-representation** — the model unit, its diagramViews, its .puml node, its .ts marker ALL carry X. The gate greps: an element present in ≥2 representations must show the SAME uuid in each.

This is the federated-IOR pattern: identity is the UUID; representations are references to it; the gate makes drift impossible (not incidental).

---

## LAYER 2 — DIAGRAM = VIEWS, view = a LINK (identity-by-reference, R25.7 — NOT copies)
- A **Diagram** = a scenario unit (`ior:class:Diagram`, uuid D) holding an ORDERED list of **view-links**.
- A **view** is NOT a unit-copy — it is a **link** `{ unit: 'modelelement:X', x, y, w?, h?, viewKind:'class'|'attr'|'method'|'prop'|'relationship' }` recorded on BOTH sides: the diagram's `views[]` AND the element's `diagramViews[] += D` (bidirectional, `TraceGraph.link`). N diagrams × N views of X = N links; X's `diagramViews` lists all of them. Move/select mutates the link's x,y — the UNIT is untouched (identity-by-reference).
- **Composed views:** a class view renders compartments from X's `members[]` — attribute-compartment (attribute views), method-compartment (method views), property-compartment (getter+setter views). The composition is DERIVED from `members[]` refs, not duplicated: the class view = one view-link to X + auto-rendered member sub-views (each a ref to the member unit). Drop-into-compartment adds a `members[]` ref (Layer 4 action).
- **Relationship view:** when X has a `relatesTo[]` ref (an attribute/getter/setter typed as another element Y), render an edge X→Y (instanceOf a `UmlAssociation`/`UmlDependency` M2). The edge is a VIEW of the relationship element (same view-as-link rule).
- **x,y on drop** = the drop coordinates stored on the view-link; the SVG view is then selectable+movable (mutates the link only).

---

## LAYER 3 — PUML serializer/parser (diagram ⇄ .puml, NO duplication, round-trippable)
- **Serialize:** walk the diagram's `views[]` → emit each element ONCE (a `class`/`interface`/etc. block with its compartments from `members[]`), embedding `X.uuid` as a stereotype/hidden note (`class RbHeader <<uuid:X>>` or a `note` line) so identity survives the text. Relationships → puml edges. NO element emitted twice (dedup by UUID on the walk — a `Set<uuid>` like the R31.11/R31.13 de-dup discipline).
- **Parse:** read .puml → for each class/edge, extract the embedded UUID → if a unit with that UUID EXISTS, RE-BIND to it (reuse, never re-mint); if absent (hand-authored puml), mint a NEW M1 element + its instanceOf facets (M2 UmlClass + puml-class-code) with a fresh UUID. → **round-trip identity: parse(serialize(D)) == D by UUID.**
- The puml-class = M2 `instanceOf Class` + M1 `instanceOf puml-class-code`, SAME UUID (Layer 1 multi-facet). The .puml is just another REPRESENTATION of the same unit (like a diagram view or the .ts code) — not a separate model.
- **Gate:** round-trip structural identity (parse→serialize→parse → same UUIDs + same structure); byte-determinism is NOT required (puml formatting), UUID+structure identity IS.

---

## LAYER 4 — ACTION-SYNC (TS ⇄ model ⇄ PUML, by construction, same UUID)
- The model unit is the **single source of truth**; TS code and .puml are GENERATED representations (the R31.7/R31.13 "single source, generated consumers, no hand-copy" law applied to the model).
- **Actions** (`class.add`, `class.remove`, `attribute.add`, `attribute.edit`, `method.add`, …) mutate the MODEL unit (add/remove a `members[]` ref, edit a field) → then a **projector** re-emits BOTH representations from the unit: TS (via the ts-*-code facet) + PUML (Layer 3), each carrying the SAME UUID. Because both are projections of the one unit, they are in sync BY CONSTRUCTION — there is no independent TS-state or PUML-state to drift.
- Bidirectional: a change ORIGINATING in TS (R32.2 TS→M1 generation via the compiler AST) or in .puml (Layer 3 parse) updates the SAME unit (re-bind by embedded UUID) → re-projects the other. Same UUID throughout = the anti-drift invariant.
- **Gate:** every action → assert both representations re-derive equal from the unit (like R31.13 rebuild-twice / R31.7 derive-equal); a diff = a drift bug caught by construction.

---

## REUSE (Tron's "why reinvent the tree") — mechanics solved once
| Need | Reuse (NOT re-fork) |
|------|---------------------|
| MDA model tree + drag source | `rb-trace-tree` (same itemView/expand/select; `.items` = the model units by `instanceOf`/`members`; `kind`→icon). skill-expert's lane. |
| Diagram pan/pinch-zoom in the drawer | `RbPanZoom` (R31.6 canonical class) — the SVG diagram is a pan/zoom viewer in the Details compartment. |
| Diagram surface / detail host | `rb-detail-drawer` (the SVG diagram is a detail-view for a Diagram unit; drop target; identical scroll/grab-bar). |
| Same-UUID / identity-by-reference | the IOR/federated-IOR + R25.7 kinship pattern already in the codebase. |
| Version/identity gate | the R31.7 invariant-gate pattern (CI + structural). |

---

## HANDOFF
- **req (AC shapes):** R32.1 identity — `ior:class:ModelElement` with `metaLevel`+`kind`+`instanceOf`; M3 Class/Relationship reflexive; same-UUID-across-levels invariant + the 5 identity-gate assertions as testable ACs. R32.5 view-as-link (N-links, x,y, bidirectional). R32.7 PUML round-trip-identity AC. R32.8 action→both-representations-derive-equal AC. Each chain-to-Test.
- **expert (build spec):** foundation FIRST = the ModelElement unit + TraceGraph relations (instanceOf/instances, members/memberOf, relatesTo, diagramViews) + the identity validator (Chain-style gate). Then TS→M1 (R32.2, ts-compiler AST), then the reuse wiring (tree/RbPanZoom/drawer), then PUML (Layer 3), then action-sync (Layer 4) LAST (highest risk). NO device hacks (R31.12 lesson); standard SVG/HTML5.
- Build order per PO: R32.0 bump → R32.1 identity (this layer) → R32.2 → R32.3 → R32.4 → R32.5 → R32.6 → R32.7 → R32.8.

---

## R32.1 BUILD SPEC — M3/M2 SEED + IDENTITY VALIDATOR (architect → expert; req wires the chain onto the built artifacts)
Per scenario-first + correct-by-construction: a DETERMINISTIC, idempotent, re-runnable SEED (pinned UUIDs) + a VALIDATOR gate — NOT a fragile hand-mint. Mints via `ScenarioIndex.put(uuid, unit)` (src/ts/scenario/index-store.ts). Same-UUID law + the 5 gates hold by construction.

### A) Seed generator — `scripts/seed-mda-model.mjs` (idempotent; pinned UUIDs = re-run mints nothing new)
Emits `ior:class:ModelElement` units. UUIDs are PINNED constants (a `SEED_UUIDS` map) so re-seed is a no-op (idempotent = the same-UUID/no-re-mint law at the seed level). Every link via a bidirectional helper (writes `instanceOf` + reverse `instances`).
- **M3 (2, reflexive):**
  - `Class`   — metaLevel M3, kind 'class',        instanceOf [Class]        (self — MOF fixed point)
  - `Relationship` — metaLevel M3, kind 'relationship', instanceOf [Class]   (a relationship IS-A classifier at M3)
- **M2 model metaclasses (instanceOf Class):** `UmlClass`(kind class), `UmlInterface`(interface), `UmlAttribute`(attribute), `UmlMethod`(method), `UmlProperty`(property), `UmlFunction`(function), `UmlType`(type).
- **M2 relationship metaclasses (instanceOf Relationship):** `UmlAssociation`, `UmlGeneralization`, `UmlDependency` (kind relationship).
- **M2 code-representation metaclasses (instanceOf Class):** `ts-class-code`, `puml-class-code`, `ts-interface-code`, `ts-method-code`, `ts-attribute-code`, `ts-property-code`, `ts-function-code` (kind = the code kind). These are the metaclasses whose M1 instances are the concrete serializable artifacts (the CODE facet of the multi-facet instanceOf).
- Reverse `instances` accrues on each M3 unit. Result: 2 M3 + ~17 M2 units, all instanceOf-linked, ONE-level-up, correct-by-construction.
- Gate the seed: re-run → `git status` ZERO churn (idempotent, pinned UUIDs) = the R31.13 determinism discipline applied to the seed.

### B) Identity validator — `ModelValidator.validate(index): Violation[]` (empty = PASS; CI + structural gate, like versionGuard/camelCase gate)
Implements the 5 AC gates over all `ior:class:ModelElement` units on disk:
1. **AC-uuid-unique** — no UUID in >1 file (TraceGraph.register already throws on load-dup; the gate asserts disk uniqueness).
2. **AC-level-integrity** — every `instanceOf` ref resolves to a unit EXACTLY one level up (M1→M2, M2→M3); M3 `instanceOf`→M3 (reflexive); REJECT any skip (M1→M3), down-link, or cross-level.
3. **AC-instanceof-nonempty** — every M2 + M1 unit has ≥1 `instanceOf`; M3 units self-type (instanceOf includes an M3).
4. **AC-serialization-embeds-uuid** — for any element with a .puml/.ts representation, the artifact embeds `uuid` (puml `<<uuid:X>>` stereotype/note + `[model:uuid:X]` code marker, mirroring `[impl:uuid:]`); the RE-BIND function `bindByUuid(embeddedUuid)` returns the existing unit (never mints) → round-trip never duplicates. (For R32.1 foundation: assert the marker CONVENTION + `bindByUuid` exist; Layers 3/4 exercise it live.)
5. **AC-same-uuid-cross-representation** — an element present in ≥2 representations (unit / diagramView / puml / ts) shows the IDENTICAL uuid in each.
- Wire as `Chain.validateModel` (mirrors the existing Chain gates) → runs in CI + pre-commit; a violation fails the build. The identity CANNOT drift (correct-by-construction pin, R31.7 pattern).

### C) Chain (req wires onto the built artifacts)
- Class `ModelElement` (the unit type) → Method `ModelValidator.validate` → Impl → Test (the 5 gates GREEN on the seed). Plus the seed generator as its own Method/Impl. req mints R32.1 Class/Method/Impl markers onto the built validator + seed; I mint/repoint if the expert env can't (IMPL-MINT pattern).
- GATE: seed re-run = 0 churn (idempotent) + `ModelValidator.validate(seed)` = 0 violations (all 5 AC gates green) + a planted bad unit (e.g. M1→M3 skip) → validator RED (proves the gates bite).

---

## R32.2 DESIGN — TS → M1 generation (architect, pipeline while R32.1 closes)
Parse the TS compiler base structures (ts compiler API / AST) → generate M1 `ior:class:ModelElement` units on the R32.1 foundation (same ModelElement + TraceModel + ModelValidator — REUSE, no fork). Idempotent + same-UUID by construction.

### Q1 — TS AST node → M2 metaclass (multi-facet instanceOf: MODEL facet + CODE facet, per R32.1)
| TS AST node | M1 kind | instanceOf (model facet, code facet) |
|-------------|---------|--------------------------------------|
| `ClassDeclaration` | class | `[UmlClass, ts-class-code]` |
| `InterfaceDeclaration` | interface | `[UmlInterface, ts-interface-code]` |
| `FunctionDeclaration` | function | `[UmlFunction, ts-function-code]` |
| `MethodDeclaration` (class member) | method | `[UmlMethod, ts-method-code]` — `memberOf` its class |
| `PropertyDeclaration` (class field) | attribute | `[UmlAttribute, ts-attribute-code]` — `memberOf` its class |
| `GetAccessorDeclaration` + `SetAccessorDeclaration` (same name) → ONE element | property | `[UmlProperty, ts-property-code]` — accessor+mutator PAIRED into one property; `memberOf` its class |
| `TypeAliasDeclaration` | type | `[UmlType]` (+ add `ts-type-code` to the seed — small seed extension) |
- Class `members[]` = its methods + attributes + properties (composition; reverse `memberOf`). One-level-up integrity holds (M1 instanceOf M2) → ModelValidator gate 2 passes by construction.
- `extends`/`implements` (heritage) → a UmlGeneralization relationship (Q3).

### Q2 — SAME UUID across re-parses (the crux: idempotent, no re-mint — the R32.1/R31.13 law for discovered code)
**Derive the UUID DETERMINISTICALLY from a STABLE identity key — do NOT random-mint.** Key = `<repo-relative sourceFile> :: <qualifiedName>`:
- class/interface/function/type → `path::Name` (e.g. `src/public/ts/components/rb-header.ts::RbHeader`).
- member → `path::ClassName.memberName` (e.g. `…rb-header.ts::RbHeader.render`); property = `…::ClassName.propName` (the get/set PAIR shares one key → one property element).
UUID = a v5-style namespaced hash of the key, shaped valid-v4 (`sha256(key)` sliced into 8-4-**4**-**8**xx-12 with the version/variant nibbles forced — the EXISTING pattern at `scripts/migrate-to-scenario.ts:245`). ⇒ re-parse the SAME code → SAME key → SAME uuid → `ModelValidator.bindByUuid` RE-BINDS (never re-mints) = idempotent 0-churn by construction (like the seed's pinned uuids, but derived from the code identity). Rename/move = a new key = a new element (correct); the old uuid is removed by a reconcile pass (removed-from-source ⇒ delete/tombstone its unit). Optionally embed the `[model:uuid:X]` marker (R32.1 `modelMarker`) in the TS on generation for gate-4 (serialization-embeds-uuid) + human traceability — but re-bind does NOT depend on the marker (derivation is the source of truth).

### Q3 — Relationships (typed member → `relatesTo`)
During parse, resolve each member's TYPE (ts TypeChecker or the type node identifier) → if it resolves to another modeled element Y:
- typed attribute/property → `X.relatesTo += Y` instanceOf **UmlAssociation** (reverse `relatedFrom` on Y).
- `extends`/`implements` → **UmlGeneralization**.
- method param/return of another type → **UmlDependency**.
The relationship carries its M2 type; R32.6 renders it as a relationship view. For R32.2 core, the `relatesTo` link + the M2 relationship-type suffices.

### Build spec (expert; foundation-reuse, no fork)
- `TsToModel` (src/ts/scenario/) or `scripts/generate-m1.mjs`: `ts.createProgram(files)` → walk each SourceFile (`ts.forEachChild`) → per node: compute identity key → deterministic uuid → build the M1 unit (metaLevel M1, kind, name, instanceOf [UmlX, ts-X-code], members[], relatesTo[]) → `ScenarioIndex.put` (re-bind if the uuid exists). Bidirectional links via the TraceGraph helper (memberOf/relatedFrom/instances).
- Idempotent: deterministic uuids ⇒ re-run = 0 churn (R31.13 discipline). Reconcile: elements absent from source this pass ⇒ removed.
- Post-gen: `ModelValidator.validate` ⇒ 0 violations (M1→M2 level-integrity, instanceof-nonempty, uuid-unique all hold by construction).

### GATE / HANDOFF
- **GATE:** generate over a known TS file → the expected M1 units exist with correct instanceOf (UmlX+ts-X-code); RE-RUN = 0 churn (deterministic uuid); ModelValidator(generated)=0 violations; a typed attribute → a `relatesTo` link to the target element. Chain-to-Test.
- **req (AC):** R32.2 = TS→M1 per the AST→M2 map; deterministic idempotent uuid (sourceFile::qualifiedName); multi-facet instanceOf; class members[] composition; get+set→one property; typed→relatesTo+M2-relationship-type; ModelValidator(generated)=0. Chain onto the built `TsToModel.generate` (Class/Method/Impl/Test), same IMPL-MINT pattern as R32.1.
- **expert:** builds `TsToModel` on the R32.1 foundation; HOLDS until this design + PO build-go (scenario-first). Small seed add: `ts-type-code` M2 unit.

## R32.3 DESIGN — Model tree = rb-trace-tree REUSED over MDA units (architect 2026-07-29, req d07b2dc0)
Same law as the Server Manager tree (R31.3/R31.11): generic tree mechanics live in the SHARED `rb-trace-tree`; a feature supplies only DATA + forward-key config. NO tree fork. Built on the R32.1/R32.2 foundation (ModelElement multi-facet units already generated + gated GREEN, tester 690c6568b).

### Q1 — ModelElement → rb-trace-tree data shape (composition = children)
The tree is the **composition tree**: M1 `UmlClass`/`UmlInterface` → their `members` (attributes/methods/properties); M2 metaclasses can be a higher tier. `rb-trace-tree` walks children via the server `/api/trace/children/<uuid>` → `forwardKeysForMode(type)`. A ModelElement's composition forward = `members` (design-mda-model.md:36, REVERSE `memberOf`). So the child-walk = `members` for model units — nothing else changes in the tree.

### Q2 — the ONE data-config addition (chain-model), NOT a fork
- `src/ts/shared/chain-model.ts` CHAIN_TYPE_CONFIG: add **`ModelElement: { scenarioFwd:['members'], traceFwd:['members'], clientFwd:['members'], expectedChildren:[] }`** (all model units carry `ior:class:ModelElement` → the server's `type = ior.split(':')[2]` = `ModelElement` for every model node, so ONE entry drives the whole model tree). This is the exact mechanism R31.11 hardened (forwardKeysForMode is the single source; string+array both resolve; de-dup at server.ts:1610). Members render as children by construction; badge = `members.length` via the R31.11 `node.dataset.childRefCount` path — REUSED, no new badge code.
- **`relatesTo` is NOT a child forward-key** (typed attr/getter/setter → another element). Making it a child would nest cross-type edges as tree children = cycles/wrong. relatesTo edges surface in the node DETAIL-view (the shared drawer) + are the input to R32.6 relationship/diagram views — NOT the R32.3 composition tree.

### Q3 — node icon/type from the M2 instanceOf facet + badge (reuse rb-object-item)
`rb-object-item` renders `type → TRACE_ICONS[type]` + `child-count` badge. For a model node the server children entry sets `type` = the node's **M2 MODEL-facet metaclass** (from `instanceOf`: `UmlClass`/`UmlInterface`/`UmlAttribute`/`UmlMethod`/`UmlProperty`/`UmlFunction`) so the icon reflects the model kind. Small DATA add: `TRACE_ICONS` entries for the Uml* metaclasses (icons.ts) — data, not tree logic. `hasChildren` = `members.length>0`; badge = members count (R31.11 stamp).

### Q4 — tree entry (reuse an existing rb-trace-tree mount pattern, no new tree)
Feed rb-trace-tree the model roots the SAME way an existing surface already does — choose ONE (expert/PO pick, both are pure DATA into the shared component):
- **(a) `data-seed-ior`** on a model-root unit (like the room tree `#room-tree`): `<rb-trace-tree data-seed-ior="<model-root/M2-root uuid>">` walks `members` via `/api/trace/children` + the new forward-key. Best if a single model root exists.
- **(b) `.items` roots** (like Server Manager): a thin `/api/model/tree` (or reuse `/api/trace`) returns the M1 classes (or M2 metaclasses) as roots with inline/lazy `members`. Best for a flat class list.
Either is data-only; rb-trace-tree renders + lazy-expands + badges unchanged.

### GATE / HANDOFF
- **GATE (tester):** open the model tree → M1 classes render with correct Uml* icons + real member-count badges; expand a class → its attributes/methods/properties nest (composition); re-render/re-parse = same UUIDs (R32.2 determinism) so the tree is stable; `/trace` + Server Manager + room trees UNREGRESSED (shared component — the ModelElement forward-key entry is additive, other types untouched); relatesTo does NOT appear as a tree child.
- **req (AC):** R32.3 = model tree via the SHARED rb-trace-tree (no fork); ModelElement forward-key=`members` in chain-model (composition children); node type/icon from the M2 MODEL-facet instanceOf; member-count badge (R31.11 stamp); relatesTo NOT a child (detail/R32.6 only); shared-tree regression (/trace + SM + room) green. Chain onto the built model-tree wiring (Class/Method/Impl/Test), same IMPL-MINT pattern as R32.1/R32.2.
- **expert:** DATA + config only — chain-model `ModelElement` entry + server children type-from-instanceOf shaping + `TRACE_ICONS` Uml* entries + the tree-entry (a or b). Touches NO rb-trace-tree mechanics. HOLDS until this design + PO build-go (scenario-first).

## R32.4 DESIGN — SVG diagram SURFACE in the drawer (architect 2026-07-30, req 496936cb)
Scope split (PO, mirrors R32.3-tree→R32.6-edges): **R32.4 = the SURFACE + NODES only** (SVG container in the shared drawer; classes/interfaces as UML boxes, laid out, clickable). **EDGES (relatesTo→association/generalization) are R32.6.** REUSE the trio (design-mda-model.md:3): `rb-detail-drawer` (R31.4 detail-view path) + `RbPanZoom` (R31.6, ratified) + the model data (R32.2/R32.3) + the LAYER-2 Diagram/view-link model (design-mda-model.md:56-61). Standard SVG/HTML5, NO device hacks (R31.12 lesson).

### Q1 — the surface is a DRAWER DETAIL-VIEW (R31.4 path, NO fork — the R31.12 law)
NEW detail-view element **`rb-diagram-detail`** (like `rb-terminal-detail`/`rb-class-detail`) registered in the drawer tagMap (`rb-detail-drawer.ts` type-map) for a **`diagram:`** ref. It mounts via the STANDARD selection→`renderDetailForRef` flow — NOT `showElement`, NOT a bespoke overlay (the exact fork R31.12 #2/#1 retired). So it inherits the drawer's responsive position (R31.9 data-position: bottom portrait / inline landscape) + open/close/expand by construction. Selecting a `diagram:<D>` ref (from the model tree R32.3, or a "view diagram" action) renders the surface.

### Q2 — NODES from the LAYER-2 view-links (identity-by-reference, units untouched)
The surface renders a `Diagram` unit D's ordered **`views[]`** (design-mda-model.md:57-61): each view-link `{ unit:'modelelement:X', x, y, w?, h?, viewKind:'class' }` → one SVG **UML class box** at (x,y): 3 compartments (name / attributes / methods) built from X's `members` (the M2 MODEL-facet gives the box kind + icon, same `modelFacetType` as R32.3; attributes/methods/properties from members). The box reads the UNIT for content but position lives on the LINK (move mutates x,y on the link only — unit untouched, R25.7). viewKind `attr/method/prop` = inner rows; `relationship` = R32.6 (skipped here).

### Q3 — pan/zoom = REUSE RbPanZoom (R31.6), fit = ResizeObserver (R31.4 terminal pattern)
The SVG surface uses a `viewBox` + **`RbPanZoom.applyPanZoom`** (the R31.6 shared pan/zoom base I ratified) for pinch/drag→CSS-transform on the viewport — NO new pan/zoom code. A `ResizeObserver` fits the surface to the drawer box (same pattern as the R31.4 terminal's fit). Responsive: the drawer is already CSS-responsive; the surface just fills it.

### Q4 — nodes CLICKABLE → node detail (standard selection, no fork)
Click an SVG box → `selectionModel.clear(); selectionModel.select('modelelement:X')` → `selection-changed` → the SHARED drawer renders X's node detail (the R32.3/standard detail flow). Identical to the room/SM pane-click pattern. No capture-hook, no fork.

### Data note (same as R32.3): surface renders what a Diagram HAS
A Diagram's `views[]` are populated by **R32.5 (drop→generate→view)** — R32.4 is the SURFACE that renders them (0 views initially → empty surface; drops add view-links with x,y). Safe to build ahead: the surface + node render + pan/zoom + click are complete; live populated diagram = R32.5. (Mirror of R32.3 tree: mechanism now, live data R32.5.)

### GATE / HANDOFF
- **GATE (tester):** given a Diagram with N view-links → the surface renders N UML boxes (name/attr/method compartments from members, correct M2-facet kind) at their x,y in the shared drawer; pan/zoom works (RbPanZoom); resize fits; click a box → drawer shows that element's detail; NO edges yet (R32.6); shared-drawer UNREGRESSED (/trace + Server Manager + room detail-views open normally — additive tagMap entry only, the R31.12 no-fork law).
- **req (AC):** R32.4 = SVG diagram SURFACE as a drawer detail-view (`rb-diagram-detail`, R31.4 path, NO fork); nodes = Layer-2 view-links → UML class boxes (compartments from members, M2-facet kind); pan/zoom via RbPanZoom (R31.6 reuse); ResizeObserver fit; nodes clickable→node detail (standard selection); EDGES excluded (R32.6); shared-drawer regression green. Chain onto the built `rb-diagram-detail` (Class/Method/Impl/Test), IMPL-MINT like R32.1-3.
- **expert:** DATA+VIEW only — new `rb-diagram-detail` element + drawer tagMap `diagram`→it + SVG box render from view-links/members + RbPanZoom wire + click→select. Touches NO drawer mechanics (tagMap add is additive). HOLDS until this design + PO build-go.

## R32.5 DESIGN — drop→generate→view (GO-LIVE), on an ISOLATED model store (architect 2026-07-30, req ec0e1754)
The milestone that populates R32.3 tree + R32.4 diagram with a REAL model. REUSE only: `TsToModel` (R32.2), `drop-dispatcher` (existing), rb-trace-tree (R32.3), rb-diagram-detail (R32.4), Layer-2 view-links. NO forks.

### ★ SCOPE Q RESOLVED — WHERE the model lives: an ISOLATED store, NEVER prod scenario/index (PO's don't-force-prod-mutation law)
- **Store = a dedicated ScenarioIndex dir `data/model-store/index/`** (under `data/`, demo-scoped, resettable, gitignorable) — SEPARATE from prod `scenario/index/`. Generation writes here; prod is never mutated.
- **Write hook already exists:** `TsToModel.generate(files, { indexDir:'data/model-store/index', write:true })` (TsToModel.ts:96) → M1/M2 units land in the store. Seed the store's M2 metaclasses once (copy the 20 M2 seed units from prod, or generate-on-first-run) so the store is self-contained for `modelFacetType`/instanceOf resolution.
- **Read reroute (the ONE server change):** `/api/model/tree` (server.ts:1470, currently hard-codes `scenario/index`) reads `MODEL_STORE` instead; and `/api/trace/children`, when the requested uuid is a **ModelElement**, resolves from `MODEL_STORE` (union: trace units stay in `scenario/index`, model units come from the store). rb-trace-tree/data-seed-ior + the R32.3 forward-key walk are UNCHANGED — they just read a store that now has data. This is why R32.3 correctly returned `roots=0` (prod had 0 M1); pointing the read at the populated store makes it live.

### Pipeline (drop → generate → view)
1. **DROP** (reuse `drop-dispatcher`): drop a TS file (or pick a target) on a model drop-zone → client POSTs path/content to **`POST /api/model/generate`** (owner/safe-gated as appropriate).
2. **GENERATE** (reuse `TsToModel.generate`): server runs it with `indexDir:MODEL_STORE, write:true` → M1/M2 units (deterministic same-UUID, R32.2) + creates a **demo `Diagram` unit with Layer-2 view-links** (one per generated class/interface, `viewKind:'class'`, auto-layout x,y = a deterministic grid/row) so R32.4's surface has nodes.
3. **VIEW** (reuse R32.3 + R32.4): the tree (`/api/model/tree`→store) + the diagram surface (`rb-diagram-detail` over the demo Diagram's view-links) render the generated model LIVE. Re-drop the same file = same UUIDs (R32.2 determinism) → idempotent, no dup nodes.

### GATE / HANDOFF
- **GATE (tester + Tron device — the go-live demo):** drop a known TS file → tree shows its classes→members with correct M2 icons+badges (R32.3) AND the diagram surface shows the class boxes (R32.4); prod `scenario/index` is UNTOUCHED (grep count of ior:class:ModelElement in prod unchanged — isolation proven); re-drop = idempotent (same UUIDs, 0 dup); /trace + SM + room + prod traceability UNREGRESSED (model reads hit the store, trace reads hit prod).
- **req (AC):** R32.5 = drop→TsToModel.generate(indexDir=MODEL_STORE)→M1/M2 + demo Diagram view-links (auto-layout)→tree+diagram render LIVE from the store; ISOLATED store (data/model-store), prod scenario/index NEVER mutated (the safe-mechanism law); deterministic re-drop idempotent; reuse drop-dispatcher/TsToModel/tree/diagram (no forks); prod + shared-tree/drawer regression green. Chain onto the built generate-pipeline (Class/Method/Impl/Test), IMPL-MINT like R32.1-4.
- **expert:** MODEL_STORE dir const + read-reroute (model reads → store, trace → prod) + `POST /api/model/generate` (drop→generate→demo-Diagram) + drop-zone wiring. Server change → real restart + R31.7 invariant (+ the pure-client vs version-sync lesson — this is server, so restart re-stamps). HOLDS until this design + PO build-go.

## R32.6 DESIGN — relationship EDGES on the R32.4 diagram surface (architect 2026-07-30, req c8bc0ee4)
The home for the edges DEFERRED from R32.3(tree)/R32.4(diagram, AC-edges-excluded). An ADDITIVE render pass on the SAME `rb-diagram-detail` surface — NO re-fork. Realizes design-mda-model.md:60 (relationship view = edge X→Y, view-as-link). REUSE: the R32.4 surface + RbPanZoom + the model `relatesTo` (R32.5-generated, verified present: Circle→0ce4d…, center→6b9bf…) + M2 relationship metaclasses.

### Q1 — edge DATA = model `relatesTo` (exists) resolved to on-surface endpoints
For each rendered node box (view-link, unit X), read `X.relatesTo[]` (ModelElement:37 — a typed attr/getter/setter → element Y). Draw an edge X→Y **iff Y is ALSO a box on this diagram** (both endpoints visible; a relatesTo to an off-diagram element is skipped, not a dangling edge). The relationship's **M2 kind** (its `instanceOf` → `UmlAssociation`/`UmlGeneralization`/`UmlDependency`, design:13/108; heritage `extends`/`implements`→`UmlGeneralization`, design:142) drives the arrowhead. De-dup edges by (from,to,kind) `Set` (R31.11/R31.13 discipline) so re-render is stable/idempotent.

### Q2 — render = an ADDITIVE SVG edge pass on the R32.4 surface (reuse, no fork)
`rb-diagram-detail` already draws the boxes from view-links (R32.4). R32.6 adds a second pass: after boxes, draw `<path>`/`<line>` edges in the SAME `<svg>` group (so RbPanZoom transforms edges WITH nodes — pan/zoom for free, R31.6). Routing: connect box borders (straight center-to-center clipped to each box's x,y,w,h from its view-link; orthogonal is a later polish). Edges render BEHIND box fills (z-order) so boxes stay readable.

### Q3 — arrowhead/style by M2 relation kind (SVG `<marker>`s)
- `UmlGeneralization` (extends/implements) → solid line + **hollow triangle** head at the target (UML generalization).
- `UmlAssociation` (typed attr/getter/setter) → solid line + open arrow (or plain) at the target.
- `UmlDependency` → **dashed** line + open arrow.
One `<defs>` marker set; the edge picks its marker by kind. Optional edge label = the member name / multiplicity (later).

### Q4 — edge is a VIEW (Layer-2, identity-by-ref) + clickable
Per design:58-60 the edge is a relationship **view-link** (`viewKind:'relationship'`, from/to = the two element refs) on the Diagram — OR derived on-the-fly from `relatesTo` between visible boxes (R32.6 core = derived; a persisted relationship view-link is the Layer-4/drop-authored form). Click an edge → `selectionModel.select` the relationship/member ref → shared drawer shows its detail (standard flow, same as node click). Units UNTOUCHED (position/existence on the box view-links; the edge reads relatesTo).

### GATE / HANDOFF
- **GATE (tester + Tron):** on the R32.5 demo diagram (faa4acad — Circle/Point/Shape/…), edges render between related boxes with the CORRECT arrowhead per kind (generalization=hollow-triangle for Shape-implements, association/dependency for typed members); pan/zoom moves edges WITH boxes (RbPanZoom); edge→click shows relationship detail; a relatesTo to an OFF-diagram element draws NO dangling edge; re-render idempotent (de-dup); R32.4 boxes + /trace + SM + room UNREGRESSED (additive edge pass only, no drawer/surface mechanics changed).
- **req (AC):** R32.6 = relationship edges on the R32.4 surface from model `relatesTo` (both endpoints on-diagram); arrowhead by M2 kind (Association/Generalization/Dependency; heritage→Generalization); edge in the same SVG group (RbPanZoom-transformed); edge clickable→relationship detail; de-dup idempotent; edges-excluded-from-R32.4 now RENDERED (closes that deferral); reuse-only (rb-diagram-detail/RbPanZoom, NO fork); R32.4 + shared regression green. Chain onto the built edge-render (Class/Method/Impl/Test), IMPL-MINT like R32.1-5.
- **expert:** additive edge pass in `rb-diagram-detail` (relatesTo→on-surface endpoints, M2-kind marker, SVG group) + marker `<defs>`. Touches NO surface/drawer mechanics. If a new server read is needed (relationship M2 kind resolution) → real-boot check + __dirname-deps-below-shim (R32.5 lesson). HOLDS until this design + PO build-go.

---

## R32.7 PUML EXPORT/IMPORT — ARCHITECT DESIGN (robbin-architect 2026-07-30, finalizes MDA-structure invariants for task-32.7 f7a635b2 / req b1fef048)
MEASURE-FIRST (confirmed R32.7 GENUINELY NEW): NO `@startuml` GENERATOR exists in src (grep empty — the repo's "puml" hits are FILE-PREVIEW of .puml, not model→puml generation). REUSE surface (measured, do NOT re-fork): `src/public/ts/trace/diagram-view-model.ts` — `EdgeKind='association'|'generalization'|'dependency'` (:6), `DiagramNode{name,kind,attrs[],methods[],relations?}` (:9), `DiagramRelation{to,kind}` (:7), `buildEdges` de-dup `seen` by `from->to:kind` (:75-76), `EDGE_DEFS` arrow-by-kind (:41-44); R32.2 model+deterministic-uuid via `TsToModel.ts`; R32.5 isolated-store.

### Architecture — ONE shared pure module `src/ts/shared/puml-serializer.ts` (usable client + server, no I/O)
**EXPORT `modelToPuml(nodes, relations): string`** — a PUML-TEXT renderer PARALLEL to `buildDiagramSvg` (same model, different sink):
- Node → `class Name {\n  attr\n  method()\n}`; `kind==='interface'` → `interface Name {...}` (mirrors the buildBox `«interface»` stereotype :28). attrs/methods() mirror the box compartments.
- Relation → PUML line, kind mapping MIRRORS `EDGE_DEFS` arrowheads: **generalization** (hollow triangle) → `Parent <|-- Child`; **association** (open) → `From --> To`; **dependency** (open, dashed) → `From ..> To`.
- **NO-DUP (AC):** each class emitted ONCE (a `seenClasses` set); relations de-dup by `from->to:kind` (REUSE buildEdges' `seen`).
- **BYTE-IDENTICAL re-export (idempotent):** DETERMINISTIC ORDER — sort classes by (name,uuid), members by declared-order, relations by (from,to,kind). NO timestamps/random. → re-export same model = byte-identical.

**IMPORT `pumlToModel(text): {elements, relations}`** — parse `@startuml..@enduml`: class/interface blocks + members + relationship lines (reverse kind map: `<|--`→generalization, `-->`→association, `..>`→dependency).
- Persist into the **ISOLATED store (R32.5 pattern) — NO prod mutation.** Pure parse in the shared module; persistence via the isolated store at the call site.

### MDA-STRUCTURE INVARIANTS (finalized — the task's "finalize on architect design")
- **INV-P1 (same-UUID-across-M-levels):** a puml class ⇒ ONE uuid that is BOTH M2-instanceOf-Class AND M1-instanceOf-puml-class-code. The uuid is DERIVED DETERMINISTICALLY from the element identity (R32.2 deterministic-uuid law) — NOT random. So parsing an existing .puml RESOLVES to the same-uuid unit.
- **INV-P2 (no-dup / reuse-not-remint):** import maps each parsed class to its existing same-uuid unit (de-dup by deterministic uuid) → never re-mints, never duplicates. Export emits each element once.
- **INV-P3 (round-trip stable, correct-by-construction):** `parse→serialize→parse` identity-preserving; `export(model)` byte-identical on re-export; `import(export(m))` yields the SAME uuids as `m`. Holds BY CONSTRUCTION from deterministic-uuid (INV-P1) + deterministic export order.
- **INV-P4 (isolation):** import writes ONLY the isolated store; prod scenario store is never mutated by an import (R32.5).

### Server endpoint? (R32.5 lesson)
Export = pure client text transform (model already client-side). Import-persist: RECOMMEND a client-side ISOLATED in-memory store (no prod mutation, no endpoint) for the round-trip; IF a server persist endpoint is later needed → `__dirname`-deps-below shim + REAL-BOOT verify (R32.5). Keep parse/serialize in the shared pure module regardless.

### Chain / build order / gate
- Chain mints onto the BUILT fix (per task): UC puml.export/puml.import → Class PumlSerializer → Method modelToPuml + pumlToModel → Impl → Test. I mint/repoint on ship (IMPL-MINT pattern) if req/expert env can't.
- GATE (tester): (a) export a known model → valid .puml, each element ONCE (no-dup); (b) re-export byte-identical; (c) import→export→import stable (same uuids, INV-P1/P3); (d) import of an existing .puml REUSES same-uuid units (no re-mint, INV-P2); (e) import mutates ONLY the isolated store (INV-P4); (f) edge kinds round-trip (generalization/association/dependency ↔ `<|--`/`-->`/`..>`).

## R32.8 ACTION-SYNC — ARCHITECT DESIGN (robbin-architect 2026-07-30, unit 782d4b8e, req b1fef048) — the MDA SPRINT FINALE
MEASURE-FIRST (confirmed GENUINELY NEW): no `reSync`/`actionSync`/`syncModel` in src (grep empty; the diff3/rb-diff-editor hits are the unrelated merge editor). The sync ENGINE already exists and is the whole point of R32.2's determinism — R32.8 is a thin ACTION + re-render over it, NO new model logic.

### ★ KEY INSIGHT — the sync engine is `TsToModel.generate()`; R32.8 is a CLIENT-ONLY action that re-invokes the EXISTING endpoint
`TsToModel.generate(files,{indexDir:MODEL_STORE,write,diagram})` (TsToModel.ts:96) ALREADY: (1) rebinds every element by DETERMINISTIC uuid `keyToUuid("<repo-rel sourceFile>::<qn>")` (:49) → re-run = same uuid, never re-mints (INV-P1/P2); (2) content-compares each write → 0-churn on no-change (:197-198); (3) RECONCILES — removes prior M1 units of the PROCESSED sourceFiles no longer present in source (:217-234) → stale members drop, new members added; (4) writes ONLY `MODEL_STORE` (data/model-store/index, R32.5) → prod scenario/index untouched. And it is already exposed at **`POST /api/model/generate {file}`** (server.ts:1513-1532, existing, deployed v0.8.7). So "sync the model to the current TS" == re-POST generate with the model's own sourceFile. **R32.8 adds NO server code** — it is a client ACTION + explicit re-render. (PO's "client-isolated preferred, no boot risk" — satisfied: no new endpoint.)

### Architecture — a "Re-Sync from source" ACTION on the model view (client-only)
1. **ACTION surface (NEW, client):** a "⟳ Re-Sync" button in the model view — on the `rb-diagram-detail` toolbar (rb-diagram-detail.ts:44-89) and/or the model tree header (scenario-view.ts). Visible when viewing a MODEL unit (Diagram / ModelElement), not trace units.
2. **TRIGGER (reuse):** onClick reads the model's `sourceFile` (from the fetched M1 unit — every M1 carries `model.sourceFile`, TsToModel.ts:175; for a Diagram, from its first view-link's ModelElement) → `dispatchModelGenerate(sourceFile)` (drop-dispatcher.ts:155) → `POST /api/model/generate {file:sourceFile}` (EXISTING). Server re-runs generate against MODEL_STORE → rebind/reconcile/idempotent → `{ok, diagramUuid, wrote, roots}`.
3. **RE-RENDER (explicit — render is demand-driven, NO auto event):** on `ok`, re-render ALL views from the one refreshed store: (a) tree — re-seed rb-trace-tree (re-fetch `/api/model/tree` or re-set `data-seed-ior`); (b) diagram+edges — reset `rb-diagram-detail`'s `ref` attr → `attributeChangedCallback` (:45) re-fetches the Diagram + members + `buildDiagramSvg`/`buildEdges`; (c) PUML — re-run `modelToPuml` (R32.7) over the re-fetched model. All read the SAME MODEL_STORE → TS↔model↔PUML consistent by construction.

### MDA-STRUCTURE INVARIANTS (finalized — R32.8)
- **INV-S1 (deterministic rebind):** re-sync rebinds existing units by same-uuid — no dup, no re-mint. BY CONSTRUCTION from `generate()` `keyToUuid` + content-compared write (INV-P1/P2 lineage, R32.2 law).
- **INV-S2 (reconcile-complete):** for the synced sourceFile, removed members drop + new members added + unchanged rebind. BY CONSTRUCTION from `generate()` reconcile (:217-234).
- **INV-S3 (isolation):** sync writes ONLY MODEL_STORE; prod scenario/index NEVER mutated. BY CONSTRUCTION (generate indexDir=MODEL_STORE, R32.5).
- **INV-S4 (all-views-consistent):** after sync, tree + diagram + edges + PUML ALL reflect the same re-generated model — one source (MODEL_STORE), all views re-read it. Correct-by-construction (single source of truth).

### SCOPE — single-file re-sync (matches R32.5's single-file drop); multi-file/deletion DEFERRED
R32.5 drops ONE .ts → one model+Diagram (Diagram uuid = keyToUuid('diagram::'+files.sorted), TsToModel.ts:206). R32.8 re-syncs THAT file via the existing single-file generate. OUT OF SCOPE for the finale (note, not build): (a) a FILE DELETED on disk — the existing endpoint 400s on a missing path (server.ts:1521), so its stale units linger; (b) multi-file models. Both would need a dedicated **`POST /api/model/sync`** (server → R32.5 discipline: __dirname-below shim + real-boot) that re-runs generate over the store's full tracked sourceFile set + a deletion pass for tracked-but-absent files. Flag to PO as optional R33; NOT in R32.8.

### DEPLOY DISCIPLINE (R32.7 LESSON — applies even though client-only)
Client-only STILL bumps the version (0.8.7→0.8.8) → build-manifest/SW change, but `/api/config` = `BOOT_VERSION` FROZEN AT BOOT (server.ts:96-102, R31.7 INV-V4). The menu `[r]` rebuild is client-only and does NOT bounce the process → served stays stale. So the deploy REQUIRES a REAL restart: `[d] stop` → `npm start` (re-reads build-manifest). Then verify served==committed==SW==build-manifest==HEAD==0.8.8 + sacred gate 403. (This is exactly what bit R32.7's restart.)

### Chain / gate / handoff
- **Chain (client-render, mirror R32.7 RbTerminalDetail pattern):** UC `model.sync` → Class (the action component, e.g. reuse rb-diagram-detail or a small `ModelSyncAction`) → Method `reSyncFromSource` → Impl → Test. req mints scenario-first (#126); I mint/repoint Impl on ship if req/expert env can't (IMPL-MINT).
- **GATE (tester + Tron device):** (a) edit a tracked TS (add a class/method) → ⟳ Re-Sync → tree + diagram + edges + PUML ALL show the new element; unchanged elements keep the SAME uuids (no dup node) [S1]; (b) remove a member → Re-Sync → gone from ALL views [S2]; (c) Re-Sync with NO source change → 0-churn (wrote=0, store byte-identical, views stable) [idempotent]; (d) prod scenario/index git-clean/grep-count UNCHANGED across sync [S3 isolation]; (e) all four views (tree/diagram/edges/puml) reflect the same post-sync model [S4]; (f) /trace + /scenario + prod traceability UNREGRESSED (model reads→store, trace→prod).
- **req (ACs):** hand the 8 ACs (below). **expert:** client-only — Re-Sync action button (diagram toolbar + tree header) reading model.sourceFile → dispatchModelGenerate → explicit re-render of tree/diagram/puml; NO server change; but version bump → REAL restart to re-stamp /api/config (R32.7 lesson) + R31.7 invariant. HOLDS until PO build-go.

### 8 ACs handed to req (0.4)
- AC1: a "Re-Sync" action is available on the model view (diagram + tree) for MODEL units only (not trace units).
- AC2: Re-Sync re-runs generation on the model's own sourceFile via the EXISTING /api/model/generate (no new server endpoint).
- AC3: after Re-Sync, the tree re-renders and shows the current model (added elements appear, removed elements disappear).
- AC4: after Re-Sync, the diagram + relationship edges (R32.6) re-render to the current model.
- AC5: after Re-Sync, the exported PUML (R32.7) reflects the current model (TS↔model↔PUML consistent).
- AC6: INV-S1 — unchanged elements keep the SAME uuid across re-sync (no duplicate, no re-mint; deterministic-uuid law).
- AC7: INV-S3 — Re-Sync mutates ONLY the isolated model-store; prod scenario/index is never touched.
- AC8: Re-Sync with no source change is idempotent (0-churn: no new/changed units, views stable).

### ARCHITECT BACKSTOP — R32.8 v0.8.8 / a4dff5323 (robbin-architect 2026-07-30): **PASS** — MDA SPRINT CLOSED
Expert shipped the Re-Sync finale; I restarted remoteShells:0.2 ([d] stop → npm start, per the R32.7 lesson — [r] is client-only, BOOT_VERSION frozen at boot) → served 0.8.8.
- **STATIC PASS:** CLIENT-ONLY — diff touches only rb-diagram-detail.ts (+37) + rb-trace-tree.ts (+7) + bundles/sw/version; NO src/ts/server/*.ts change. `reSyncFromSource` (rb-diagram-detail.ts:62) reuses `dropDispatcher.dispatchModelGenerate` → the EXISTING `POST /api/model/generate` (no new endpoint, no fork). Re-render: on ok, re-renders diagram+edges + broadcasts `rb-model-resynced`; rb-trace-tree listens (:86) → re-renders a seed MODEL tree. PUML = export-on-demand (NO live pane in src/public/ts — grep empty), so it reflects the current store BY CONSTRUCTION (no stale cache, no listener needed). Toolbar button = model-units-only (count && sourceFile, :103).
- **FUNCTIONAL PASS (engine, via the reused endpoint):** re-sync `test/fixtures/r32.2-sample.ts` ×2 → identical `{ok, units:12, roots:5, diagramUuid:faa4acad…, wrote:0}` both times = DETERMINISTIC same-uuid rebind (INV-S1) + IDEMPOTENT 0-churn (AC8). ISOLATION (INV-S3): prod scenario/index ModelElement count = 27 UNCHANGED across the re-syncs (writes hit MODEL_STORE only). INV-S2 reconcile (added-appear/removed-disappear) = BY CONSTRUCTION from generate()'s reconcile pass (R32.5-proven) + tester edit→resync gate. INV-S4 = the 3 live views (tree/diagram/edges) re-render from the one MODEL_STORE + PUML export-on-demand consistent by construction.
- **R31.7 INVARIANT:** served==committed(pkg)==SW(rawbin-v0.8.8)==build-manifest==0.8.8; sacred gate /server-manager 403; /trace 200; /api/model/tree 200. HEAD advanced to 85b751a02 (req chain-mint model.sync→reSyncFromSource→Impl markerPending — scenario-units + requirements.md only, no dist/pkg change → no re-restart).
- **REMAINING (Tron device):** authed visual — edit a tracked .ts → ⟳ Re-Sync → tree+diagram+edges all update + PUML export reflects it. Chain marker: expert places [impl:uuid] on reSyncFromSource decl (req #126).
- **MDA SPRINT 32 COMPLETE:** R32.1 identity → R32.2 engine → R32.3 tree → R32.4 diagram → R32.5 go-live(isolated store) → R32.6 edges → R32.7 PUML → R32.8 action-sync. All designed + shipped + backstopped PASS.

## R32.9 FEATURE-DISCOVERY + MDA REGISTRATION — ARCHITECT DESIGN (robbin-architect 2026-07-30, Tron 'discovered not hardcoded')
MEASURE-FIRST (accurate root — the discovery LIST already exists; the fragility is narrower than a rebuild):
- **`featuresForToken(token)` (server.ts:932) ALREADY enumerates ALL `ior:class:Feature` units and membership-filters by `allowedUsers.includes(token)`** → the per-user launcher list (`m.features`, sent in the PROFILE ws msg :2894, rendered by `renderFeatureGrants` :1002) is ALREADY discovery + membership-gated, fail-closed. `listFeatures`/`featureRoots` (FeatureManager.ts:53/148) likewise enumerate. So "discovered≠hardcoded" is ALREADY TRUE for the list + the guard.
- **THE 3 REAL HARDCODES (why MDA is missing):**
  1. **No MDA Feature unit exists** — enumeration finds nothing to show. PRIMARY miss.
  2. **Owner-seed is hardcoded** — `FeatureManager.bootstrapSeed` seeds the owner into ONLY `SEED_FEATURES=[ServerManager,FeatureManager]` (FeatureManager.ts:31,38-47). A NEW Feature unit gets NO owner in `allowedUsers` → `featuresForToken(owner)` excludes it → owner never sees it. **THIS is the "every new feature needs a code-edit" fragility Tron named.**
  3. **Launch route is hardcoded** — `renderFeatureGrants` derives icon+page from a `f.name==='Server Manager'?…:'/feature-manager'` ternary (server.ts:1019-1021) → a discovered MDA would mis-launch to /feature-manager.

### Design — drop the 3 hardcodes (correct-by-construction / DRY, same as version-single-source R31.7); reuse the existing discovery+gate
**A. Discovery-based owner-seed (drop SEED_FEATURES).** `FeatureManager.bootstrapSeed` (FeatureManager.ts:38): replace the `for (uuid of SEED_FEATURES)` loop with ENUMERATE all `ior:class:Feature` units (reuse the `listFeatures` ScenarioIndex scan) → `ServerManagerGuard.seedOwnerInto(allowedUsers)` for each; write if changed. DELETE the `SEED_FEATURES` const (:31). → any Feature unit (incl. MDA) auto-gets the owner at boot; new features = ZERO code-edit. INV-G2==1 preserved (seedOwnerInto, no literal here).
**B. Create the MDA Feature unit (scenario-first, req/planner mint #126).** `ior:class:Feature` in PROD `scenario/index` (where featuresForToken/FeatureManager read — NOT the model-store; the FEATURE is a registration, distinct from the MODEL units): model `{ name:'Model-Driven Code Quality', icon:'📐', allowedUsers:[] (owner seeded by A at boot), launchPage:'/model' }`, stable uuid.
**C. Data-driven launch (drop the name-ternary).** Add `launchPage` to the Feature model → surface it in `featuresForToken`'s return (`{uuid,name,icon,launchPage}`) → `renderFeatureGrants` uses `f.icon` + `f.launchPage` (drop the `f.name==='Server Manager'?…` branches :1019-1021); the cookie-mint-then-nav generalizes (mint sm_session → `location.href=f.launchPage`). Backfill `launchPage`(+icon) onto the EXISTING ServerManager (`/server-manager`) + FeatureManager (`/feature-manager`) units so the ternary fully retires (small data seed, req/planner).
**D. MDA launch target = a membership-gated `/model` page (reuse R31.8 gate + the R32.5 surface).** NEW route `/model` gated by `requireFeatureAccessHttp(req,res,'Model-Driven Code Quality')` (the SAME R31.8 data-driven gate + choke-point pattern as `/server-manager` :1039-1040, fail-closed) → serves the model view = the R32.5 drop→tree(R32.3)/diagram+edges(R32.4/6)/puml(R32.7) surface, composed from the BUILT components (rb-trace-tree data-seed + rb-diagram-detail + drop-dispatcher) — NO fork. (The `/api/model/*` routes stay as-is for now; gating them under the same feature is a flagged hardening follow-up, not this AC.)

### INVARIANTS (R32.9)
- **INV-D1 (discovery):** the feature list = enumerate ALL `ior:class:Feature` (featuresForToken/listFeatures — already so) — NO hardcoded feature list. New Feature unit auto-appears.
- **INV-D2 (discovery-based owner-seed):** bootstrapSeed seeds the owner into ALL discovered Feature units — SEED_FEATURES DROPPED. New feature → owner auto-member, zero code-edit. THE fragility fixed.
- **INV-D3 (data-driven launch):** each Feature unit carries `launchPage`(+icon); the launcher reads them — name-ternary DROPPED.
- **INV-D4 (membership gate, fail-closed — discovered≠visible):** `featuresForToken` filters per-user by `allowedUsers` membership; `/model` `requireFeatureAccess` 403s non-members. The owner-seed grants the OWNER only; other users need explicit `grantFeature`. Same R31.8 mechanism as ServerManager.

### Reuse (NO fork) / gate / chain / deploy
- **REUSE:** featuresForToken/listFeatures (discovery), requireFeatureAccess + seedOwnerInto (R31.8), renderFeatureGrants (launcher), the R32.5 model view surface. NEW = MDA Feature unit + `launchPage` field + `/model` gated route + bootstrapSeed discovery-seed.
- **GATE (tester + Tron @390):** (a) MDA `ior:class:Feature` unit exists (name/icon/launchPage/allowedUsers); (b) after a REAL boot, the owner is a member of MDA (discovery-seed) → owner's /profile 'Feature access' LISTS 'Model-Driven Code Quality'; (c) click → navigates to `/model` (data-driven launchPage, NOT /feature-manager) → the model view (tree/diagram/edges) renders; (d) `/model` non-member → 403 + MDA absent from a non-member's m.features (fail-closed); (e) grep-clean: NO `SEED_FEATURES`, NO `f.name==='Server Manager'` launch-ternary; (f) ServerManager + FeatureManager still list+launch (their units gain launchPage/icon — behavior-preserving).
- **CHAIN (#126, req mints):** UC feature.discover (+ MDA feature.register) → Class FeatureManager → Method bootstrapSeed (discovery-seed) → Impl → Test; + the MDA Feature unit (data). I mint/repoint Impl on ship if needed.
- **DEPLOY:** SERVER change (bootstrapSeed + featuresForToken + renderFeatureGrants + /model route) → version bump → REAL restart ([d] stop→npm start, R32.7 lesson) + R31.7 invariant + REAL-BOOT verify (bootstrapSeed runs at startup — confirm owner seeded into MDA + feature appears + /model 403 non-member). HOLDS until PO build-go.

### 1 AC handed to req (0.4)
- AC: FeatureManager DISCOVERS features (enumerate ALL `ior:class:Feature`, NO hardcoded SEED list — bootstrapSeed seeds the owner into every discovered Feature) + the 'Model-Driven Code Quality' Feature unit EXISTS (icon + `launchPage:/model`) → auto-appears in the owner's Feature access and LAUNCHES to the membership-gated `/model` model view (R32.3-8 surface); discovered≠visible — each Feature's `allowedUsers` still membership-gates (R31.8, fail-closed), non-member `/model`→403. Adopt-not-invent; reuse featuresForToken/requireFeatureAccess/model-view, no fork.

### ARCHITECT BACKSTOP — R32.9 v0.8.9 / 705f1ab8f (robbin-architect 2026-07-30): **PASS** — MDA feature now REACHABLE
Expert shipped the server change; req minted the MDA Feature unit; I restarted remoteShells:0.2 ([d] stop → npm start).
- **BOOT-VERIFY (R32.5 lesson):** FRESH process — pid 3202378 → 3715637 (not a version-lie); server boots CLEAN + serves live traffic (no TDZ/crash — expert added no module-top __dirname-dep; FeatureManager uses pre-existing SCENARIO_DIR). served 0.8.9.
- **INVARIANT:** served==committed(pkg)==SW(rawbin-v0.8.9)==0.8.9; HEAD 705f1ab8f.
- **STATIC:** SEED_FEATURES DROPPED (FeatureManager.ts — only a comment remains); bootstrapSeed (:36-40) ENUMERATES `ior:class:Feature` via idx.list() + seedOwnerInto each (INV-D2); featuresForToken (server.ts:932) + renderFeatureGrants (:1039 `f.launchPage||…`) data-driven launch, name-ternary GONE (INV-D3); serverModelPage + gated `/model` route requireFeatureAccess('Model-Driven Code Quality') (INV-D4).
- **INV-D2 CRUX (demonstrable, proven on disk):** the MDA Feature unit was minted `allowedUsers:[]`; after this boot bootstrapSeed AUTO-SEEDED the owner → **Model-Driven Code Quality: launchPage=/model, owner-seeded=TRUE (allowedUsers=1)**. A NEW feature auto-reachable by the owner with ZERO code-edit / zero SEED list = the fragility Tron named is FIXED by construction. Server Manager (/server-manager) + Feature Manager (/feature-manager) also owner-seeded + carry launchPage (backfilled, INV-D1/D3, unregressed).
- **INV-D4 LIVE GATE (non-member, no session):** `/model` → **403** (fail-closed, discovered≠visible); `/server-manager` → 403 (SM sacred); `/feature-manager` → 403 (FM gated); `/trace` → 200 (unregressed). featuresForToken filters per-user by allowedUsers → a non-member's list excludes MDA by construction.
- **REMAINING (Tron @390 device — 403-limited solo):** owner opens FeatureManager → sees 'Model-Driven Code Quality' 📐 → clicks → /model → model view (tree/diagram/edges) renders. Holds by construction (owner now a member + launchPage=/model); visual confirm is Tron's.
- **MDA feature now REACHABLE.** R32.9 chain: req mints UC feature.discover/register→Class FeatureManager→Method bootstrapSeed→Impl→Test (#126).

## R32.10 /model DRAWER + SELECT→DETAIL/DIAGRAM — ARCHITECT DESIGN (robbin-architect 2026-07-30, Tron device-QA IMG_4715, req f106673d) — my R32.9-shell gap, own it
MEASURE-FIRST (root confirmed): the `/model` bundle `src/public/ts/model/model.ts` imports ONLY `rb-trace-tree` (:4) + mounts the tree; it NEVER creates `<rb-detail-drawer>` — unlike `/scenario` (scenario-view.ts:38-41) + `/trace` (trace-page.ts:35-37) which create+append the drawer. The drawer opens via the document `selection-changed` listener (rb-detail-drawer.ts) — with NO drawer mounted, tree-select fires into the void → "not even a drawer opening" (Tron). The R32.9 /model shell (serverModelPage server.ts:1000-1013) + bundle added the tree, forgot the drawer. Also: the drawer tagMap (rb-detail-drawer.ts:211-219) has `diagram:'rb-diagram-detail'` (:218, R32.4) but NO `modelelement` entry → a ModelElement node falls to the generic `rb-detail-view`; NO `rb-modelelement-detail` exists yet. (Root B — model is the r32.2-sample DEMO not RawBin's real multi-file src — is ELEVATED to R33, needs Tron authorization; NOT R32.10.)

### Part A — mount the drawer (the core fix; select→drawer opens). CLIENT-ONLY, mirror /scenario, NO fork
`model.ts`: `import '../trace/rb-detail-drawer.js';` (it self-imports rb-diagram-detail + rb-class/method/…-detail, rb-detail-drawer.ts:29-37) → after mounting the tree, `const d=document.createElement('rb-detail-drawer'); (document.querySelector('.trace-page')||document.body).appendChild(d);` (EXACTLY scenario-view.ts:38-41 / the R31.4 SM-drawer pattern). The SHARED `selectionModel`/`selection-changed` already wires tree-select → `drawer.renderDetailForRef` — NO per-page wiring. → select ANY node opens the drawer. This alone kills "no drawer opens."

### Part B — typed detail: class→node-detail(+members)+diagram, method→signature
1. **NEW `rb-modelelement-detail`** (client, mirror the existing rb-class-detail pattern; drawer self-imports it + tagMap `modelelement:'rb-modelelement-detail'`). Fetches the ModelElement via /api/ior (isModelUnit→MODEL_STORE) and renders BY `kind`:
   - **class/interface:** «kind» + name + qualifiedName; MEMBERS list — each method/attr a `dv-link` (ref `modelelement:<memberUuid>`) → selecting DRILLS to that member's signature detail (same element, member kind); RELATIONS (relatesTo → the R32.6 edges); a **"📐 Open diagram" dv-link** → selects the class's diagram ref (`diagram:<diagramUuid>`) → drawer SWAPS to `rb-diagram-detail` (R32.4/6 boxes+edges, already registered) = "reach its diagram" by construction.
   - **method/attribute/property:** SIGNATURE detail — name, «kind», type/return (from `relations`), memberOf (owning-class dv-link). = "method→signature".
2. **Diagram-reach data (the one small server touch):** `/api/model/tree` (server.ts:1490) ALSO emits the store's `ior:class:Diagram` unit(s) as a root node `{type:'diagram', name:'📐 Model diagram (N)', uuid}` AND/OR surfaces each class root's `diagramUuid` (resolve from the Diagram whose `views[]` reference the class — reuse the store). So the Diagram is selectable in the tree (→ rb-diagram-detail) AND the class detail's "Open diagram" link resolves. (Minimal: emit the Diagram root — the demo is single-file/one Diagram; per-class resolution matters for R33 multi-file.)

### INVARIANTS / reuse / gate / deploy
- **INV-M1 (drawer-on-model):** /model mounts `<rb-detail-drawer>` (mirror /trace/scenario) → select→renderDetailForRef opens, by construction.
- **INV-M2 (typed detail):** class→node-detail+members+diagram-reach; method→signature — via `rb-modelelement-detail` + the `diagram:` tagMap (R32.4). No generic-only dead-end.
- **INV-M3 (membership gate unchanged):** /model still 403s non-members (R32.9 INV-D4) — Part A/B are inside the gated page/bundle; no gate change.
- **REUSE (NO fork):** rb-detail-drawer + rb-diagram-detail + selectionModel + /api/model/tree + the rb-*-detail pattern. NEW = the drawer mount in model.ts + rb-modelelement-detail + tagMap entry + the Diagram-root/diagramUuid surface.
- **GATE @390 (the INTERACTION, tester + Tron — NOT 'page loads'):** (a) select a class node → drawer OPENS with the class detail (name + methods list); (b) from it reach the DIAGRAM → boxes + R32.6 edges render; (c) select a method/member → signature detail; (d) /model still 403 non-member (gate unregressed); (e) /trace + /scenario drawers UNREGRESSED (shared elements). Gate the SELECT→OPENS interaction, not the page load (the 2nd gated-loads-not-works miss — [[gate-the-ac-surface]]).
- **DEPLOY:** model.ts + rb-modelelement-detail = CLIENT; the Diagram-root surface = SERVER (/api/model/tree). Server touch → REAL restart ([d] stop→npm start, R32.7 lesson) + boot-verify + R31.7 invariant. (If the diagram-reach is done fully client-side by emitting the Diagram root is deemed server — keep it minimal; the drawer-mount core is client-only and is the primary fix.)
- **CHAIN (#126, req mints):** UC modelElement.inspect (select→detail) + reuse feature.launch → Class RbModelElementDetail → Method render/mount → Impl → Test; + serverModelPage/model-tree extension. I mint/repoint Impl on ship if needed.
- **ROOT B → R33 (flagged, not R32.10):** generate RawBin's REAL model (multi-file over src/) so the tree/diagram show RawBin's classes/functions/interfaces — the actual value of "Model-Driven Code Quality." Needs Tron authorization (new sprint/schedule) + the R33 multi-file model-sync.

### AC handed to req (0.4)
- AC: on /model, selecting a model node OPENS the shared drawer (drawer mounted, mirror /trace); selecting a CLASS shows its node-detail + members and REACHES its diagram (R32.4/6 boxes+edges); selecting a METHOD/member shows its signature; /model stays membership-gated (403 non-member) and /trace+/scenario drawers unregressed. Gate the INTERACTION @390 (select→drawer-opens+detail+diagram+signature), NOT page-load. Reuse rb-detail-drawer/rb-diagram-detail/selectionModel, no fork.

### ARCHITECT BACKSTOP — R32.10 v0.8.10 / 52cd07514 (robbin-architect 2026-07-30): **PASS** — /model drawer + typed detail live
Restarted remoteShells:0.2 ([d] stop → npm start).
- **BOOT-VERIFY:** FRESH pid 3715637 → 3786293 (not a version-lie); clean boot (serves /api/config + /api/model/tree; no TDZ — the /api/model/tree touch is inside the existing handler, no new module-top __dirname-dep). served 0.8.10.
- **INVARIANT:** served==committed(pkg)==SW(rawbin-v0.8.10)==0.8.10; HEAD 52cd07514.
- **STATIC:** PART A — model.ts imports rb-detail-drawer + createElement+append to .trace-page (:18-20, mirror scenario-view) → shared selectionModel opens it (INV-M1). PART B — rb-modelelement-detail.ts EXISTS + tagMap `modelelement:'rb-modelelement-detail'` (rb-detail-drawer.ts:219, INV-M2). SERVER — /api/model/tree emits `modelelement` roots (:1531) + `diagram` roots (:1534).
- **INTERACTION DATA (live, the @390 substrate):** GET /api/model/tree → root types `{modelelement:5, diagram:1}` — Circle/Point (UmlClass), Shape (UmlInterface), Id (UmlType), makeId (UmlFunction) + "Model diagram (3 classes)" (icon diagram). So select-class→rb-modelelement-detail (members+Open-diagram) and select-diagram/Open-diagram→rb-diagram-detail (R32.4/6 boxes+edges) are wired BY CONSTRUCTION (drawer mounted + tagMap + typed roots). method→signature via the same modelelement detail by kind.
- **INV-M3 GATE + unregressed:** /model non-member → **403** (preserved); /trace → 200; /server-manager → 403. 
- **REMAINING (Tron @390 device — 403-limited solo):** the authed VISUAL — select a class → drawer opens with «kind»+members → "📐 Open diagram" → boxes+edges; select a method → signature. Holds by construction (drawer mounted + tagMap + live typed roots); visual confirm is Tron's.
- **ROOT B still R33:** the live model is Circle/Point/Shape/Id/makeId = the r32.2-sample DEMO (confirmed in the tree) — Tron's "where are RawBin's classes" = the R33 real multi-file model (awaits authorization).

## R32.11 IN-DIAGRAM DRAG-TO-ADD-VIEW — ROOT + FIX (robbin-architect 2026-07-30, Tron: the DnD IS the vision, it's a BUG). Own the prior "drifted" mis-read — Tron corrected: drag-a-class-into-diagram is CORRECT, just NOT WIRED.
MEASURE-FIRST — ROOT (3 missing pieces; the interaction was never built, only PROMPTED):
1. **NO drop-target on the diagram:** `rb-diagram-detail.ts` has ZERO `dragover`/`drop`/`dataTransfer` handlers (grep empty) — the *"Empty diagram — drop a class to add a view (R32.5)"* string (:104) is a LABEL with no handler behind it. Dropping a class card on `.dm-surface` does nothing.
2. **NO add-view endpoint:** the only model-mutation route is `POST /api/model/generate` (drop a .ts FILE → regenerate). There is NO route to append ONE class's view-link to an existing Diagram unit.
3. **drop-dispatcher routes FILES, not a class-ref:** `dispatch`(mime)/`dispatchModelGenerate`(.ts path) — no path consumes a dragged `application/rb-object-ref` (the tree card's payload) into the diagram.
So R32.5 gated drop-a-FILE→generate; the in-diagram drag-a-CLASS→add-view was never wired = the 3rd "gated-path ≠ interaction" ([[gate-the-ac-surface]]).

### FIX (hand expert) — wire the drag-to-add-view (reuse view-link shape + MODEL_STORE + re-render; NO fork)
| # | File | Change |
|---|------|--------|
| 1 | `src/public/ts/trace/rb-diagram-detail.ts` | Add `.dm-surface` **`dragover`** (preventDefault → allow drop) + **`drop`** handlers. On drop: read the dragged element ref (`e.dataTransfer.getData('application/rb-object-ref')` — the tree card sets it in rb-object-item.onDragStart; fallback `text/plain` hash → uuid); compute x,y from the drop point (map cursor→`.dm-content` coords, account for RbPanZoom transform); POST add-view; on ok `await this.render()` (re-render boxes+edges). |
| 2 | `src/ts/server/server.ts` | NEW `POST /api/model/diagram/add-view` `{diagramUuid, elementUuid, x, y}`: read the Diagram unit from **MODEL_STORE** (isolated, R32.5) → append `{unit:'modelelement:'+elementUuid, x, y, viewKind:'class'}` to `model.views` (DEDUP if the element already has a view = idempotent) → write back to MODEL_STORE (prod scenario/index NEVER touched). Membership-gate consistent with /model if desired (or reuse the model API posture). |
| 3 | (verify) `rb-object-item.onDragStart` | already sets `application/rb-object-ref` = the node ref (S31) → the model tree card is a valid drag SOURCE; confirm the modelelement node's ref is carried. |

### INVARIANTS / gate / deploy
- **INV-R1 (drop adds a view):** drop a class card on the diagram → its view-link is appended to the Diagram unit → box renders. **INV-R2 (idempotent):** dropping the same class twice = one view (dedup). **INV-R3 (isolation):** add-view writes ONLY MODEL_STORE; prod scenario/index unchanged. **INV-R4 (persist):** re-open the diagram shows the added view (persisted, not just in-DOM).
- **GATE @390 (the INTERACTION — tester + Tron):** empty diagram → drag "Circle" from the model tree → drop → Circle box appears; drag "Point" → 2nd box + R32.6 edges; drag Circle again → NO dup (INV-R2); prod scenario/index git-clean (INV-R3); re-open /model diagram → views persist (INV-R4). Gate the DROP, not the label.
- **DEPLOY:** client (drop handler) + server (add-view endpoint) → REAL restart + boot-verify + R31.7 invariant.
- **CHAIN (#126, req):** UC diagram.addView → Class RbDiagramDetail (+ the server add-view Method) → Method onDrop/diagramAddView → Impl → Test. I mint/repoint on ship if needed.
- **NOTE (my prior mis-read, corrected):** R32.10-assessment (1) called drag-into-empty "drift" — Tron OVERRODE: it IS the original vision; the auto-show idea is secondary. R32.11 makes the DRAG work (the primary), not replace it.

### R32.11 COMPLEMENT (PO 2026-07-30): DnD is PRIMARY (fix it), auto-show is ADDITIVE (add it too)
Per PO: keep the drag-to-add-view as the vision (fix #1-3 above) AND add **select-class → auto-show its view** as a COMPLEMENT (not a replacement). Additive design: when a class node is selected (selection-changed), if the /model diagram is open, auto-append that class's view-link (same add-view path as the drop, idempotent) so its box appears — the DRAG stays for deliberate curation, the SELECT gives instant feedback. Both funnel through the ONE add-view mechanism (INV-R1..R4) — no second path. Small; can ride R32.11 or a fast-follow.

### ARCHITECT BACKSTOP — R32.11 add-view v0.8.11 (a3b9cd404) + R33.1 MOF-tree v0.8.12 (287357c90) (robbin-architect 2026-07-30): **BOTH PASS**
Restarted remoteShells:0.2 twice ([d] stop→npm start) as the two deploys landed; served 0.8.12. BOOT-VERIFY: fresh pids 3786293→3933528→3962801 (not version-lies); clean boot + live traffic. served==committed(pkg)==SW(rawbin-v0.8.12)==0.8.12; HEAD e4a572068 (req chain-mint, comment-only, no re-restart).
- **R32.11 (in-diagram DnD add-view) STATIC:** rb-diagram-detail `.dm-surface` gained `dragover`(:113)+`drop`(:114) reading `application/rb-object-ref`→RbPanZoom-mapped x,y→POST `/api/model/diagram/add-view` (was ZERO handlers); server endpoint (server.ts:1565) reads Diagram from MODEL_STORE, dedups by `unit` link, writes MODEL_STORE only, UUID path-safe.
- **R32.11 FUNCTIONAL (live add-view):** dedup Circle (already a view) → `{added:false, views:3}` (INV-R2); add `_r` (new) → `{added:true, views:4}` (INV-R1 + INV-R4 persist); re-add `_r` → `{added:false, views:4}` (idempotent). Auto-show complement = the same endpoint with x,y omitted → server auto-grid (proven by the coord-less add). **INV-R3 isolation:** prod ModelElement+Diagram = 28 UNCHANGED across the add-views. (Probe: the `_r` view is a backstop artifact in the resettable MODEL_STORE demo — not prod.)
- **R33.1 (MOF-tree) STATIC+LIVE:** GET /api/model/tree root = **[`M2 · UML Profile` (mof-layer, 18 metaclasses), `M1 · Projects` (mof-layer, 1)]** (INV-MOF1 layers-as-folders); «UmlClass» → childCount 2 = Circle/Point M1 instances via reverse multi-facet `instanceOf` (INV-MOF2); a class under BOTH M2-instance and M1-project = same uuid ref-nav no-dup (INV-MOF3, R32.1 law); Diagram node `faa4acad` nested under M1·Projects. Reads MODEL_STORE only.
- **GATE (both):** /model non-member → **403** (R32.9 preserved); /trace → 200; /server-manager → 403 (unregressed). 
- **REMAINING (Tron @390 device — 403-limited solo):** R32.11 authed VISUAL drag-a-class→box-appears+edges+persist+select-auto-show; R33.1 authed folder expand/cross-level nav. Both hold by construction (endpoint + tree structure live).
- **GAP (expert-flagged, non-blocking):** R33.1 '📄 PUML(code)' leaf node not yet wired (R32.7 surface) — thin fast-follow; folders+diagram+cross-level-nav all in.
