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
