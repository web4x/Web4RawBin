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
