# S36 DESIGN — Unify traceability units with the M2 UML/TS model (views of ONE unit) — robbin-architect 2026-08-05
MEASURE-FIRST (disk-verified). Existing shapes: **UseCase**{name=Object.verb, class, method, classes[], tasks[], implementations[], tests[]} · **Class**{name, description, sourceFile:ior:file:, methods[]} · **Method**{name=Class.method, description, sourceFile, implementations[], tests[] — NO signature yet} · **Implementation**{sourceFile, sourceLine, tests[]} · **ModelElement**{metaLevel:M1|M2, kind, instanceOf[], members[], memberOf, relatesTo[], relations[]} · **Diagram**{views:[{unit, x, y, viewKind}]} (MODEL_STORE) · **TraceLink**{from, to, fromType, toType, relation, direction, label}. **M2 metaclasses ON DISK:** UmlClass/UmlInterface/UmlMethod/UmlFunction/UmlAttribute/UmlProperty/UmlType/UmlAssociation/UmlGeneralization/UmlDependency + ts-class-code/ts-method-code/ts-function-code/… + puml-class-code. **UmlUseCase = ABSENT (R36.1 mints it).** No usedIn/projection mechanism exists (NEW, cross-cutting).

## CORE MECHANISM (DRY) — typed OOP extension = REUSE the existing M2 `instanceOf` multi-facet
A ScenarioUnit is the ONE source of truth. A "typed OOP extension / view" = the unit **instanceOf its typed M2 facet(s)** — the EXACT mechanism M1 ModelElement already uses (`instanceOf:[UmlClass, ts-class-code]`, TsToModel FACETS). So:
- **Class** unit → `instanceOf:[UmlClass(M2), ts-class-code(M2)]` → UmlClass & tsClass are two facet-LENS VIEWS of the ONE Class unit (render UML box vs TS signature from the SAME data). NO copy.
- **Method** unit → `instanceOf:[UmlMethod|UmlFunction, ts-method-code]`.
- **UseCase** unit → `instanceOf:[UmlUseCase(M2, NEW)]`.
A "view" renders the ONE unit through a facet lens; the unit's DATA is authoritative; the facet TYPES the projection. Drag-onto-diagram = a Diagram `views[]` view-link to the base unit (REUSE R32.4/R32.11 Diagram view-links) rendered via its facet. This unifies the MDA model element and the traceability unit into ONE.

## ★ GENUINE TRON-DECISION (surfaced to PO/Tron — the sprint's crux)
Today the SAME real class has TWO units: the authored **traceability Class** (prod scenario/index, e.g. `Onboarding`@ProfileEditor.ts) AND a TS-generated **M1 ModelElement** (MODEL_STORE, TsToModel, `instanceOf:[UmlClass,ts-class-code]`). "ONE unit, not duplicates" needs a direction:
- **(A) MERGE (recommended, truest DRY):** the traceability Class/Method/UseCase unit IS the model element — it gains `instanceOf` facets + draggability + usage-refs; TsToModel RECONCILES generated M1 into the traceability unit (same-uuid by `sourceFile::qualifiedName` deterministic key, OR a `modelElement` link), so ONE unit per real class. Removes the M1/traceability duplication.
- **(B) REFERENCE (less invasive):** keep both; the M1 ModelElement carries a `baseUnit`→traceability-Class link; views + Scenario/Edit resolve to the traceability unit. Two units, one canonical.
DECISION NEEDED: A or B — and if A, how TsToModel reconciles (deterministic same-uuid vs link). I recommend **(A)** (matches "NOT duplicates"); it's a larger model change (TsToModel generation path). Also confirm: **UmlTraceRelationship EXTENDS TraceLink** (reuse from/to/relation/direction + a RawBin relation vocab) — recommended — vs a new type.

## R36.1 — UmlUseCase extends UseCase
MINT `UmlUseCase` M2 metaclass (ABSENT on disk). UseCase unit → `instanceOf:[…,UmlUseCase]`. Drag→diagram: a Diagram view-link to the UseCase unit rendered as a UML use-case ellipse from the UseCase's existing data (name=Object.verb, class, method). Usage-ref: UseCase.usedIn[] tracks the diagrams/folders it's placed on. UseCase stays a `Class.method`/`Object.verb` decomposition tracing to its Method (→R36.4). NO duplicate — the UML use case is a VIEW.

## R36.2 — UmlClass + tsClass extend Class
Class unit → `instanceOf:[UmlClass, ts-class-code]` (both M2 facets EXIST — reuse). Two facet-lens VIEWS: UmlClass = UML box (name + attribute/method compartments from Class.methods[] + members), tsClass = TS signature view. Both draggable (Diagram view-link to the ONE Class unit, `viewKind:'class'|'tsClass'`); render from Class data; usage-refs tracked. Two projections, ONE unit.

## R36.3 — Method enrichment + Method-vs-Function + Uml/ts projections
- **ENRICH Method** model with a full signature: `visibility:'public'|'private'|'protected'`, `parameters:[{name,type}]`, `returnType`, `docs` (oosh-style block). (Source of truth: derive from TS via TsToModel AST where available; else authored.)
- **Method ≠ Function:** `parentClass` field — PRESENT ⇒ Method (`instanceOf UmlMethod`), ABSENT ⇒ Function (`instanceOf UmlFunction`). Function→Method = add a parentClass (convertible); Method→Function = blocked/hard (state/attribute access) — modelled as a one-way conversion.
- Projections: UmlMethod/UmlFunction + ts-method-code facets (EXIST). The enriched signature renders in the UML method compartment + the TS view.

## R36.4 — UmlTraceRelationship (typed, RawBin-specific)
NEW `UmlTraceRelationship` — recommended to **EXTEND TraceLink** (reuse {from, to, fromType, toType, relation, direction, label}) with a RawBin relation vocabulary (`decomposes`/`traces`), NOT strict UML 2.5. Semantics: a UseCase (=Class.method/Object.verb) `traces`/`decomposes` → its Method. Each endpoint = a typed OOP-extended unit tracking usage-refs. Renders as a typed connector on the diagram (reuse R32.6 edges + EDGE_DEFS kind-map, add the trace kind).

## R36.5 — Scenario/Edit open the CORRECT underlying unit + usage-reference tracking
- **Scenario/Edit → base unit (REUSE S35):** every projected view carries the BASE unit's ior; the S35 universal-actions provider's ◆Scenario→`/scenario?ior=<base-uuid>` + ✎Edit→`/edit/<base-unit-path>` resolve to the ONE underlying unit (the view projects). A UmlClass view's Scenario/Edit open the Class unit, not the view. Reuse `ensureViewUnit` (S34/S35) for on-disk resolution.
- **Usage-reference tracking (NEW, cross-cutting, bidirectional):** add `usedIn:[{kind:'diagram'|'folder', ref}]` on units ↔ the existing `Diagram.views[]` / folder links. A resolver computes back-refs ("where is this used"). Bidirectional invariant: unit.usedIn ⟷ diagram.views (add-view/remove-view maintain both, reuse R32.11/R33.8 add/remove-view).

## Build order / chain / gate
- **Order (confirm PO):** (1) FOUNDATION: the `instanceOf`-facet typed-extension + usage-ref tracking + R36.5 Scenario/Edit→base wiring (rides S35 universal-actions). (2) R36.3 Method enrichment (underpins projections). (3) R36.1/R36.2 projections + drag-to-diagram. (4) R36.4 UmlTraceRelationship. Server (unit model + resolver) → restart+backstop; client (views/drag/buttons) → client.
- **Reuse map (NO fork):** M2 `instanceOf` facets (R32.1/R32.2) · Diagram view-links (R32.4/R32.11) · TraceLink (R36.4) · S35 universal-actions + ensureViewUnit (R36.5) · R32.6 edges (UmlTraceRelationship render). NEW: UmlUseCase M2 · Method signature fields · usedIn[] + back-ref resolver · UmlTraceRelationship type.
- **GATE (@390):** each new type is a typed unit ON DISK (instanceOf its base/facet); drag→diagram renders from the unit's data (no duplicate data); ◆Scenario/✎Edit open the CORRECT base unit; usage-ref bidirectional (unit↔diagram/folder); Method signature + Method/Function distinction present. Chain-to-Test; Impl.tests[] on disk before flip.

## TRON RULING = (A) MERGE, tree-preserving — R36.1/R36.2 REFINED (architect 2026-08-05)
Tron: Option A (traceability unit IS the model element; TsToModel reconciles generated M1 INTO it, single unit). ★ HARD CONSTRAINT: "shall NOT disrupt/break what i currently see in the tree" → the merge is DATA/RESOLUTION-level ONLY; the TREE renders BYTE-UNCHANGED (M1·Projects→RawBin→[ts,puml,diagrams,traceability] + sprint structure + every node exactly as now).
### MERGE MECHANISM = fork-A resolve-at-detail (REUSE the A2/R35.4 pattern — the SAME "tree byte-unchanged" invariant)
Do NOT data-move M1 out of the tree read-path. Instead UNIFY at RESOLUTION: a generated M1 ModelElement and its authored traceability unit (matched by the DETERMINISTIC key `sourceFile::qualifiedName` → keyToUuid, R32.2) resolve to the SAME canonical unit — the traceability unit, ENRICHED with the M2 facets (`instanceOf:[Uml*,ts-*-code]`) + members + signature + usedIn[]. Reconcile = same-uuid (deterministic key) OR a `modelElement`↔`baseUnit` link resolved at `/api/ior` (exactly ensureViewUnit's resolve-at-detail). The MOF tree (mofChildren) + traceability folder + `/api/model/tree` are UNTOUCHED — only DETAIL / `/api/ior` / Scenario·Edit / facet-views resolve to the merged unit. This is the R35.4 "protect-the-tree" fork-A, applied to the merge.
### ★ INV-T (TREE-UNCHANGED / NO-DISRUPTION) — the hard AC
`/api/model/tree` + `/api/trace/children/{project:RawBin, rawbin:ts, rawbin:puml, rawbin:diagram, rawbin:traceability}` + the sprint structure render **BYTE-IDENTICAL before/after the merge**. GATE @390 + byte-diff: capture the tree JSON pre-merge, apply the merge, re-capture → ZERO diff. The merge NEVER changes a tree node's ref/name/order/count; it only changes what a node RESOLVES to on open. (Reuse A2 INV-A2-1 byte-unchanged.)
### R36.1 REFINED (UmlUseCase extends UseCase, merge+tree-safe)
Mint `UmlUseCase` M2. The traceability UseCase unit gains `instanceOf:[…,UmlUseCase]` + usedIn[] (DATA-level). Drag→diagram view-link renders the UML use case from the UseCase's data. Scenario/Edit→the UseCase unit. **INV-T:** the tree (incl. the traceability folder's UseCase nodes) is byte-unchanged; the facet is added to the unit, not to a new tree node.
### R36.2 REFINED (UmlClass+tsClass extend Class, merge+tree-safe)
The traceability Class unit is reconciled with the generated M1 (same-uuid by sourceFile::qualifiedName / link) → ONE unit carrying `instanceOf:[UmlClass,ts-class-code]` + members + methods[] + usedIn[]. UmlClass/tsClass = facet-lens views of that ONE unit; draggable (Diagram view-link); Scenario/Edit→the Class unit. **INV-T:** `/api/model/tree` ts/ subtree (files→classes→members) + counts render BYTE-IDENTICAL; the M1 node still shows — it just resolves to the merged canonical unit. NO tree disruption.
### Hard AC handed to req (both R36.1/R36.2, + all merge clusters)
"AC-tree-unchanged (HARD, Tron): the merge is data/resolution-level only — `/api/model/tree`, rawbin children [ts,puml,diagrams,traceability], the sprint structure, and every existing node render BYTE-IDENTICAL before vs after the merge (byte-diff == 0). A merged element still appears at its current tree node; only its DETAIL / Scenario / Edit / facet-view resolve to the ONE canonical unit. NO node added/removed/reordered/recounted by the merge. GATE @390: pre/post-merge tree byte-diff == 0."

## R36.2 usedIn-survives-regen — MECHANISM CALL (architect 2026-08-05): (c) SIDE INDEX
The regen-fragility (TsToModel overwrites the M1 file, dropping additive usedIn) is best ELIMINATED by construction, not patched. CALL = **(c) a dedicated usage-index in MODEL_STORE, keyed by the CANONICAL deterministic uuid (sourceFile::qualifiedName)** — usedIn lives OUTSIDE the generated element file.
- **Why (c) fits fork-A resolve-at-detail:** the generated M1 element stays PRISTINE (purely TsToModel output) → INV-RM1 stays STRICT ("element file never touched" — no relaxation needed, the whole INV-RM1 nuance dissolves); usedIn is a SEPARATE additive concern RESOLVED on demand (resolveUsedIn reads the side index) — exactly the fork-A principle (don't mutate generated data; resolve the extra view separately). Re-gen-immune BY CONSTRUCTION (TsToModel never touches the side index). Decoupled (TsToModel has zero usedIn knowledge). Keyed by the canonical uuid = works for the merged unit + survives re-gen + bidirectional (side-index ⟷ Diagram.views[]).
- **REJECT (a):** the canonical traceability unit lives in PROD scenario/index → writing usedIn there VIOLATES prod-untouched isolation (INV-A2-3). (If the canonical is materialized in MODEL_STORE it just BECOMES (c).)
- **(b) read-merge-write = the minimal-change fallback** if the team prefers NOT to refactor R36.5's shipped on-element usedIn: TsToModel reads+re-attaches usedIn before overwrite. Works, but COUPLES the generator to usedIn + keeps INV-RM1 relaxed. Acceptable but inferior.
- **Cost note:** (c) refactors R36.5's on-element usedIn into the side index — natural to do AT R36.2 (the merge/reconcile build). RECOMMEND (c); (b) only if avoiding the R36.5 touch.

## R36.2 (c) SIDE USAGE-INDEX — DESIGN (architect 2026-08-05, PO-APPROVED, preserve R36.5)
MEASURED R36.5 sites (server.ts): `addUsedIn(elementUuid,kind,ref)` (:1215, writes u.model.usedIn on the ELEMENT file :1222) ← add-view :1915; `removeUsedIn(elementUuid,diagramUuid)` (:1234-1237, filters+writes element file) ← remove-view :1207; `resolveUsedIn(elementUuid)` (:1244-1248, impl 2f44e112, reads u.model.usedIn from element file) ← GET /api/model/used-in/<uuid> :1893 + /api/ior. KEY PROPERTY: the M1 element uuid IS `keyToUuid(sourceFile::qualifiedName)` = the CANONICAL deterministic uuid already → keying a side-index by that uuid survives re-gen + is the merged unit's key BY CONSTRUCTION.
### (c) = TRANSPARENT BACKEND SWAP of ONLY those 3 functions (preserve R36.5 gated behavior)
- **Store:** a side usage-index in MODEL_STORE (`data/model-store/usage-index/` sharded by uuid, OR one keyed map) — canonicalUuid → `[{kind,ref}]`. NOT on the element file, NOT prod.
- **`addUsedIn`/`removeUsedIn`:** read-modify-write the SIDE-INDEX entry (keyed by uuid) instead of the element file. The generated element file is NEVER written → stays PRISTINE (INV-RM1 STRICT restored; re-gen can't drop usedIn).
- **`resolveUsedIn` (2f44e112, marker STAYS impl-edit):** read the SIDE-INDEX entry instead of the element file — SAME return shape.
- **`/api/model/used-in/<uuid>` + add-view/remove-view callers: UNCHANGED** (call the same 3 functions) → R36.5's GATED BEHAVIOR (endpoint returns back-refs; add/remove bidirectional) HOLDS identically.
- **`/api/ior` parity:** usedIn was "present on the unit model at /api/ior" (R36.5, because on-element). Off-element now → the /api/ior resolver ATTACHES `resolveUsedIn(uuid)` onto the returned model (transparent) so that behavior is preserved too.
### INV-T + isolation
- **INV-T:** the side-index is tree-INVISIBLE (not in /api/model/tree/mofChildren) → tree byte-diff==0 (even more decoupled than on-element). 
- **Isolation:** side-index in MODEL_STORE/data, NEVER prod scenario/index.
### ★ GUARDRAIL FLAG (per PO) — tester RE-GATE R36.5
The store LOCATION moves off-element → the SIDE-INDEX. The resolveUsedIn/add/remove API + /api/model/used-in behavior are PRESERVED (transparent), but the BACKING STORAGE changed → **tester must RE-GATE R36.5** on the side-index backend: add-view→used-in returns it; remove-view→drops it; bidirectional; element file now PRISTINE (usedIn NOT on it); /api/ior still shows usedIn (via the resolver attach); INV-T byte-diff==0. Build (c) INTO the R36.2 A-merge (the merge keys the same canonical uuid = the side-index key).

## R36.3 — two scope/design CALLS (architect 2026-08-05, expert flagged)
### (a) Projection RENDER ordering → lands WITH R36.1/2 (DRY, one render mechanism)
R36.3 part-1 (d978df35d, rides TsToModel.generate 382f8644) ships the DATA: Method/Function signature + `parentClass` + `instanceOf:[UmlMethod|UmlFunction, ts-method-code]`. The UmlMethod/UmlFunction FACET-LENS RENDER uses the SAME projection/view mechanism R36.1/R36.2 build — do NOT fork a second renderer. CALL: R36.3 = the instanceOf+signature DATA now; the facet-lens RENDER lands WITH R36.1/R36.2 (re-scope R36.3's render ACs to the R36.1/2 projection mechanism). Matches the build order (R36.3 underpins the projections).
### (b) Function→Method CONVERSION = SOURCE REFACTOR, not a preserved model-edit
★ PRINCIPLE (the correct-by-construction line): **preserve-across-regen applies ONLY to NON-source-derived metadata** (usedIn = diagram/folder placement, NOT a code fact → side-index, R36.2). **SOURCE-DERIVED facts follow the source** (TsToModel = source of truth): `parentClass`/method-vs-function/signature/members are GENERATED from the AST → a model-only edit creates model↔source DRIFT that regenerate CORRECTLY overwrites. So Function→Method CONVERSION = a **SOURCE refactor** (move the top-level function INTO a class in the .ts → TsToModel regenerates it as a method NATURALLY), NOT a model-edit that regenerate must preserve. This is the OPPOSITE of the usedIn caveat: usedIn is preserved BECAUSE it isn't in the source; parentClass is NOT preserved BECAUSE it is. CALL for this sprint: R36.3 MODELS the distinction (parentClass present=Method/absent=Function — SHIPPED) + declares the conversion SEMANTICS = source-edit (Scenario/Edit opens the source; regenerate reflects the refactor). A dedicated function→method REFACTOR operation (rewrite source + call-sites) is a LATER feature if Tron wants a one-click convert — flag to PO. Do NOT build a model-only-preserved conversion (it would lie vs source).
### Restart
R36.3 restart stays DEFERRED per the moving-target guard (tester gating the foundation @390 on 0.8.52) — I honor it; the enrichment is data-only + takes effect on re-generate. I restart+backstop R36.3 when the 0.8.52 gate lifts.

## R36.1/R36.2 part-2 — DETAILED reconcile design (architect 2026-08-05, for the fresh expert)
The A-merge is a RESOLVE-TIME COMPUTE-ON-READ at `/api/ior` (server.ts:2358) — NEVER a write to either file. This is what makes it correct-by-construction: files stay pristine ⇒ INV-T (tree bytes) + isolation (prod) + INV-RM1 (M1 pristine) all hold BY CONSTRUCTION; "never blind-overwrite" = the merge NEVER writes, it computes a canonical VIEW.
### MERGE ALGORITHM — `reconcileCanonical(uuid)` hooked into GET /api/ior/<uuid>
1. **Load base:** `base = idx.get(uuid)` from `isModelUnit(uuid) ? MODEL_STORE : prod scenario/index` (existing resolve). (uuid may be the traceability uuid OR the M1 uuid.)
2. **Compute the canonical key:** `key = keyToUuid(base.sourceFile-rel :: (base.qualifiedName || base.name))`. This is the M1's own uuid AND the deterministic dedup key (R32.2). (No sourceFile/name → no counterpart; base IS canonical, skip to 5.)
3. **Find the counterpart (dedup by sourceFile::qualifiedName):**
   - base is a TRACEABILITY unit (Class/Method/UseCase) → counterpart `m1 = MODEL_STORE.get(key)` (the generated M1).
   - base is an M1 element → counterpart `trace = ` the traceability unit with matching sourceFile+name (scan prod by type+sourceFile+name, or a name→uuid index). 
   - No counterpart → base is canonical as-is (still gets facets if authored + usedIn); done.
4. **READ-MERGE into a canonical VIEW (compute in memory, precedence table below) — do NOT write either file.**
5. **Attach usedIn:** `canonical.usedIn = resolveUsedIn(key)` (R36.2 side-index, keyed by the canonical key).
6. **Return** the canonical merged model as the /api/ior response. (Persistence NOT needed; if ever required, write ONLY to a MODEL_STORE canonical unit — never prod, never the pristine M1 — but default is compute-on-read.)
### FIELD-PRECEDENCE (which field from which side — never blind-overwrite; UNION where additive)
| Field | Source (winner) | Rule |
|-------|-----------------|------|
| `uuid` (canonical identity) | TRACEABILITY | the authored, chain-stable uuid; the M1 key ALIASES to it (both resolve to the same canonical) |
| `name`, `sourceFile`, `qualifiedName` | TRACEABILITY (M1 fallback) | authored preferred; M1 if trace absent |
| `instanceOf:[Uml*, ts-*-code]` | UNION(M1 generated, authored) | the typed OOP-extension facets — generated facets UNION any authored |
| `members[]`, `memberOf`, `kind`, `relatesTo[]`, `relations[]` | M1 (generated structure) | the AST-derived model structure |
| `visibility, parameters[], returnType, docs, parentClass` (R36.3) | M1/enrichment (source-derived) | the signature; source is truth (per R36.3 principle) |
| `methods[]`, `implementations[]`, `tests[]`, `class`, `method`, `tasks`, `description` | TRACEABILITY (authored chain) | the 6-step chain links |
| `usedIn[]` | R36.2 side-index (key) | attached at step 5 |
INV: additive fields UNION (never drop one side); scalar conflicts prefer the AUTHORED chain unit for identity/chain, the GENERATED M1 for structure/signature. NEVER overwrite a file.
### FACET-LENS RENDER — `renderFacet(canonical, facetType)` built ONCE, reused by all projections
ONE facet-parameterized renderer over the canonical merged unit — NOT N renderers. Reuse the R32.4 diagram-view-model `buildBox`/`buildDiagramSvg` surface; the `facetType` selects the lens:
- `UmlClass` → UML box: name + attribute compartment (members kind∈{attribute,property}) + method compartment (members kind=method, each rendered via UmlMethod).
- `UmlMethod`/`UmlFunction` → `visibility name(parameters): returnType` + docs; UmlFunction iff `parentClass` absent.
- `UmlUseCase` → use-case ellipse (name=Object.verb) + a UmlTraceRelationship connector to its `method` (R36.4).
- `tsClass`/`ts-method-code` → TS-syntax lens over the same data.
Drag-onto-diagram = a Diagram `views[]` view-link {unit: canonical-uuid, viewKind: facetType} (reuse R32.4/R32.11 add-view); the surface renderer calls `renderFacet(reconcileCanonical(unit), viewKind)`. Scenario/Edit on any facet view → the canonical uuid (rides S35 universal-actions → the base unit). ONE render path, all projections.
### INV / gate
INV-T byte-diff==0 (merge is /api/ior compute-on-read; mofChildren/tree read the unchanged files) · isolation (no prod write) · INV-RM1 strict (M1 pristine) · usedIn side-index survives re-gen · dedup deterministic (keyToUuid) · facet render built once (no fork). GATE @390: drag each facet → renders from the canonical (no dup data); Scenario/Edit → canonical base unit; pre/post-merge tree byte-diff==0; where-used bidirectional.

## R36.4 — UmlTraceRelationship DETAILED design (architect 2026-08-05, for clean build-go; req 2265ad63)
The summary above (## R36.4) is the intent; this is the impl-shape (mirrors the reconcile detail so the expert builds without interpretation).
### ★ DRY: DERIVED trace needs NO new unit — the UseCase ALREADY carries `method`
Measured: `UseCase.model.method → Method` (the Object.verb→Method trace is ALREADY in the chain data). So a UseCase's UmlTraceRelationship is a TYPED VIEW of that EXISTING link — rendered as a connector, NOT a new stored unit (same principle as the facet-lens projections). Only an AUTHORED/custom trace (drawn on the diagram between two units with no existing link) mints a real unit.
### UmlTraceRelationship UNIT (only for AUTHORED traces) — EXTENDS TraceLink
Shape = TraceLink + a RawBin relation vocab: `{ ior:'ior:class:UmlTraceRelationship', model:{ uuid, from:'ior:instance:<UseCase>', to:'ior:instance:<Method>', fromType:'usecase', toType:'method', relation:'traces'|'decomposes', direction:'directed', label } }`. Store: MODEL_STORE (isolated, prod scenario/index NEVER touched, like Diagram/UmlUseCase). Deterministic uuid = `keyToUuid('umltrace::'+from+'::'+to+'::'+relation)` → idempotent (re-draw = same uuid, no dup). `ior:class:UmlTraceRelationship` optionally `instanceOf` a UmlTraceRelationship M2 metaclass (mint if the M2 facet is wanted; else it stands as a typed unit extending TraceLink's fields).
### CONNECTOR RENDER — reuse R32.6 buildEdges + EDGE_DEFS (add ONE 'trace' kind)
- Extend `EDGE_DEFS` (diagram-view-model.ts) with a `trace` kind: arrowhead = dashed open arrow (distinct from association/generalization/dependency); marker `dm-arrow-trace`.
- In `buildEdges`, additionally emit a trace edge for each on-diagram UseCase whose `method` (derived) OR each on-diagram UmlTraceRelationship (authored) connects two on-diagram units — REUSE the existing `borderPoint` clip geometry (R33.6.3) + the `seen` de-dup (from→to:kind) + the both-on-diagram guard (off-diagram target → no dangling edge). `data-rel-kind="trace"`, `data-rel-from`/`data-rel-to` for reroute (R33.6.3) + click→detail.
- Renders in the SAME SVG group as the R32.6 edges → RbPanZoom-transformed, reroutes on move (R33.6.3), no fork.
### SEMANTICS + Scenario/Edit + INV
- Semantics: a UseCase (=Class.method / Object.verb) `traces`/`decomposes` → its Method (RawBin-typed, NOT strict UML 2.5).
- Scenario/Edit on a trace connector → the UmlTraceRelationship unit (authored) OR its UseCase/Method endpoints (derived) — rides S35 universal-actions → the correct base unit (R36.5).
- **INV-T:** trace connectors render on the DIAGRAM surface only → the MOF tree / `/api/model/tree` are UNTOUCHED → byte-diff==0. **Isolation:** authored UmlTraceRelationship units in MODEL_STORE, prod never touched. **No fork:** reuse R32.6 buildEdges/EDGE_DEFS + borderPoint + TraceLink shape + S35 buttons.
### Chain / gate
Chain: UC (umlTrace.render / umlTrace.author) → Method (buildTraceEdge on diagram-view-model, extends buildEdges 8c68b925) + authorTrace (server, mints the unit) → Impl → Test. req mints on this. GATE @390: a UseCase + its Method both on a diagram → a `trace` connector renders (dashed arrow, reroutes on move); an authored trace persists to MODEL_STORE (idempotent, prod untouched); Scenario/Edit on the connector → correct unit; INV-T tree byte-diff==0; /trace R32.6 edges unregressed. Client (render) + server (authored-trace persist) → restart+backstop the server bit.

## R36.3 SCOPE (architect 2026-08-05, PO readiness) = CODE-DONE → CHAIN-CREDIT + GATE (no new build)
MEASURED on disk — R36.3 is CODE-COMPLETE across both halves; NOT a code gap:
- **part-1 DATA (d978df35d, v0.8.53):** TsToModel EXTRACTS the full signature (TsToModel.ts:150-180 — function→signature+NO parentClass; method→parentClass+signature; visibility from modifiers; oosh docs from JSDoc) AND WRITES it onto the M1 model (:228-232 `model.visibility/parameters/returnType/documentation/parentClass`). **Method-vs-Function distinguished BY CONSTRUCTION:** `parentClass` PRESENT ⇒ Method ⇒ `instanceOf UmlMethod` (FACETS['method']); ABSENT ⇒ Function ⇒ `instanceOf UmlFunction` (FACETS['function']). Function→Method = a source refactor (per the R36.3 principle) — code models the distinction, no model-preserve.
- **part-2 RENDER (renderFacet B, 94ad4f50):** the facet-lens (diagram-view-model.ts:61) routes UmlMethod/UmlFunction → `renderMethodFacet` = a signature-line compartment (`visibility name(parameters): returnType`, :67) built from the canonical model's R36.3 fields (rb-diagram-detail.ts:124-128); distinguishes UmlMethod vs UmlFunction.
### VERDICT: R36.3 = CODE-DONE → **chain-credit + gate (R30.11 pattern, NO new build)**.
### ★ ONE GATE PREREQUISITE (data-freshness, NOT a code gap)
On-disk M1 methods GENERATED BEFORE d978df35d are STALE (lack the signature fields — sample confirmed: method has no visibility/parameters/parentClass). The enrichment populates on the NEXT TsToModel RE-GENERATE (re-sync, R32.8). So the tester's GATE must (1) RE-GENERATE a class → its methods now carry `visibility/parameters/returnType/parentClass`; (2) @390 the method facet renders the signature line; (3) a top-level FUNCTION (no parentClass) renders as UmlFunction vs a class METHOD as UmlMethod. Then chain-credit the R36.3 chain (req mints Test on the existing part-1/part-2 Impls, R30.11 — no new build).

## R36.3 SCOPE — RECONCILED with planner (architect+planner 2026-08-05, supersedes the loose "credit on 94ad4f50")
The planner is CORRECT on the facts (measured, agreed): 94ad4f50 = `renderFacet` is **R36.2-owned** (part-2 B, not R36.3's); 382f8644 = `TsToModel.generate` is **R32.2-owned**; there is NO distinct R36.3-owned Impl; the R36.3 UC `modelElement.methodSignature` is UNWIRED (method=None); zero R36.3-tested Impls. My "code-done" is ALSO correct — and the two are NOT in conflict:
### RECONCILED VERDICT: CODE-done, CHAIN un-built → chain-credit via R30.11 SHARED-IMPL (NO new build)
- R36.3's INTENT is SHIPPED but WOVEN INTO two EXISTING, OTHER-owned Impls (no distinct R36.3 code):
  - **data-enrich-write + Method-vs-Function** → inside **382f8644** `TsToModel.generate` (R32.2-owned): TsToModel.ts:150-180 extract (incl. `memberVisibility` :74 inline, docs :82) + :228-232 write; `parentClass`→FACETS UmlMethod/UmlFunction.
  - **method-signature-render** → inside **94ad4f50** `renderFacet` (R36.2-owned): `renderMethodFacet` (:68, inline helper of renderFacet).
  - Neither Impl is R36.3-owned; both are SHAREABLE.
- Because R36.3 has ZERO distinct code, it does NOT need a new BUILD — BUT its CHAIN must be BUILT (the planner's valid point): req wires R36.3's OWN `modelElement.methodSignature` UC → Method(s) → the SHARED Impls **382f8644** (data-enrich) + **94ad4f50** (render), and mints **DISTINCT-INTENT Tests** — (T1) re-generate → a method carries `visibility/parameters/returnType/parentClass`; (T2) a method facet RENDERS the signature line; (T3) a top-level function (no parentClass) = UmlFunction vs a class method = UmlMethod — WITHOUT re-crediting/flipping 382f8644 (stays R32.2) or 94ad4f50 (stays R36.2). Pure R30.11 shared-impl: distinct Tests on shared Impls, no double-credit.
- If the team judges R30.11-shared-credit too thin for a distinct requirement, the ALTERNATIVE is to EXTRACT R36.3's code into a distinct Impl (e.g., an `enrichMethodSignature` helper split out of generate + a `renderMethodFacet` marker) = a small refactor BUILD. RECOMMEND the R30.11 shared-credit (the code genuinely lives in the shared Impls; no functional gap) unless the planner wants distinct-Impl hygiene.
### VERDICT to PO: NO functional BUILD needed (code shipped); CHAIN-CREDIT via R30.11 shared-impl on 382f8644+94ad4f50 with 3 distinct-intent Tests + wire the methodSignature UC. Gate = re-generate + facet render.

## R36.3 JOINT VERDICT (architect + planner AGREE, 2026-08-05) — R30.11 shared-credit, distinct-intent VERIFIED on disk
VERIFY-OWNERSHIP-FIRST (PO's hard condition, checked on disk): the shared Impls' EXISTING Tests carry OTHER intents → R36.3's 3 Tests are GENUINELY DISTINCT, no double-credit:
- **382f8644** (TsToModel.generate, R32.2) existing Test = **ba762f5a** "R32.2 TsToModel TS→M1 generation (4 ACs + planted-defect)" = the GENERATION intent (TS→M1, deterministic uuid, members) — does NOT assert signature-extract. → R36.3-T1 (visibility/parameters/returnType/parentClass EXTRACTED+WRITTEN on re-gen) is DISTINCT.
- **94ad4f50** (renderFacet, R36.2) existing Test = **e21b876d** "S36 part-2 5-facet lens paint @390" = the FACET-LENS-ROUTING/paint intent (5 facets render) — does NOT assert the method-signature-LINE CONTENT. → R36.3-T2 (the method facet's `visibility name(params): returnType` COMPARTMENT CONTENT, from the R36.3 fields) is DISTINCT. [req: word T2 to assert the signature-line CONTENT, not merely that the method facet paints — that's the distinct-intent boundary.]
- R36.3-T3 (Method-vs-Function: parentClass PRESENT→UmlMethod vs ABSENT→UmlFunction) — neither existing Test asserts it → DISTINCT.
### VERDICT (both confirm on-disk): (a) R30.11 SHARED-IMPL chain-credit is CLEAN — NO functional build.
- R36.3 gets its OWN `modelElement.methodSignature` UC → Method(s) → the SHARED Impls **382f8644**(data) + **94ad4f50**(render). NOT cross-wiring R36.2's chain.
- 3 DISTINCT-INTENT Tests (T1 signature-extract-written / T2 signature-line-content-renders / T3 method-vs-function) — NOT claiming ba762f5a(R32.2) or e21b876d(R36.2); the 382f8644/94ad4f50 markers STAY R32.2/R36.2 (no re-credit/flip).
- T36.3 stays In-Progress; planner flips → Done ONLY when the 3 distinct Tests wire (Impl.tests[] on disk) + @390 GREEN (incl. the re-generate step). Method-vs-Function = recorded by-construction invariant.
- Extract (Opt B) rejected = hygiene-only, risks shared-code churn; shared-credit is correct (code genuinely lives there — R35.2/3 shared-gate precedent). PLANNER AGREES (this is the joint verdict).

## T36.2 SCOPE — usedin-survives-regen VERDICT (architect 2026-08-05, PO readiness, measured on disk)
HARD AC = usedIn side-index PERSISTS across a TsToModel re-generate. MEASURED:
- **R36.2c side-index IS BUILT (95941e5c3):** usedIn lives in a DEDICATED `data/model-store/usage-index.json` (server.ts:1244-1256) — a SEPARATE file ONE LEVEL ABOVE the index shards ("never scanned as a unit", :1250), keyed by the element's CANONICAL uuid (=keyToUuid(sourceFile::qualifiedName)). addUsedIn/removeUsedIn/resolveUsedIn(2f44e112) read/write THIS file; the element shard file is PRISTINE.
- **SURVIVES-REGEN HOLDS BY CONSTRUCTION (verified):** `usage-index.json` EXISTS as a separate store; `TsToModel` references usage-index/usedIn **ZERO** times (grep -c = 0); `TsToModel.generate` writes ONLY the element shards (:250) + the Diagram (:266) → it CANNOT touch `usage-index.json`. So a re-generate OVERWRITES the M1 element but LEAVES the usage-index UNTOUCHED → usedIn SURVIVES. This is precisely the (c) design's purpose (re-gen-immune by construction; the R36.5→(c) move eliminated the fragility).
### VERDICT: BUILT-ALREADY (mechanism) — NOT a blocker, NOT needs-code-build.
The survives-regen MECHANISM is complete + correct-by-construction (side-index separate from the re-gen write scope). The planner's "un-built" flag = the AC's TEST/CHAIN is un-built (no distinct Test asserting "usedIn survives a re-generate"), NOT the mechanism — same pattern as R36.3 (mechanism-done, chain-pending).
- **REMAINING = ONE distinct survives-regen TEST** (add usedIn → re-generate the element → assert usedIn PERSISTS + element file re-generated) → a small Test/gate-add on the EXISTING resolveUsedIn(2f44e112)/side-index Impls, **NOT a code build, NO design needed** (mechanism shipped).
- **PO build-now-vs-defer:** RECOMMEND add the Test NOW (chain-credit the HARD AC; low-cost; proves survives-regen) — but it is DEFERRABLE (mechanism is safe by construction; deferring = gate-hygiene debt, not risk). Either way: **NO code build, NO blocker to S36 shipping.**

## R36.1 FALSE-DONE AUDIT + UseCase→UmlUseCase PROJECTION FIX (architect 2026-08-06, S36-correction, T36.1 reopened)
### ★ FALSE-DONE EVIDENCE (measured on disk 0.8.63)
T36.1 was flipped Done, but the UmlUseCase AC is UNMET. MEASURED: **531 UseCase units, 0 carry the UmlUseCase facet, 0 have a `sourceFile`/`qualifiedName` key.** The A-merge `reconcileCanonical` (server.ts:1288, Impl 37c08fd5) only enriches a base unit that has a MODEL_STORE M1 counterpart keyed by `keyToUuid(sourceFile::qualifiedName)` — but UseCase units are Object.verb scenario units, NOT TS-derived (TsToModel generates ZERO usecases, grep 0), so they have NO key → reconcileCanonical returns early (:1290 "no key → base IS canonical") for EVERY UseCase → the UmlUseCase facet is never added. The chain-credit Tests exercise CLASSES only: `fb5ae5eb`↔`37c08fd5` = 5-**class** facet-UNION merge; `e21b876d`↔`94ad4f50` = 5-**facet** (class/method) PAINT. NEITHER tests a scenario UseCase resolving/rendering as UmlUseCase. M2 metaclass + renderFacet-ellipse (diagram-view-model.ts:50/62) exist, but the UseCase→UmlUseCase projection was NEVER wired = false-Done (mechanism-present, AC-unmet — the systemic pattern).

### FIX — TYPE-LEVEL projection ("UmlUseCase EXTENDS UseCase", Tron Ruling A), compute-on-read, no fork, no write
A UseCase's UmlUseCase-ness is NOT key-based (no TS counterpart) — it is INTRINSIC to the type. "UmlUseCase extends UseCase" ⇒ every `ior:class:UseCase` IS a UmlUseCase in the model lens. So the projection is a tiny TYPE-RULE, not a counterpart merge.

| # | File | Change | Detail |
|---|------|--------|--------|
| 1 | `server.ts` reconcileCanonical (:1288) OR sibling on the /api/ior path (:2458) | when `ior === 'ior:class:UseCase'`, UNION the UmlUseCase M2 facet into `instanceOf` in-memory | `m.instanceOf = [...(m.instanceOf||[]), 'ior:instance:ce1d8d57-e845-428d-9dc9-9c241b17c479']` — compute-on-read, NEVER writes the file (INV-T byte-diff==0 by construction, same discipline as the class-merge). |
| 2 | render | NONE — `renderFacet` already draws UmlUseCase as an ellipse from node data (name=Object.verb). Reuse. |
| 3 | drag→diagram | reuse existing add-view → Diagram view-link to the UseCase unit; ellipse from EXISTING data — a VIEW, no copy. |
| 4 | usedIn | already attached via `resolveUsedIn` side-index (:1312) — bidirectional (R36.5/R36.2c). |

### INVARIANTS
- **INV-U1 (project-not-write):** every UseCase's /api/ior resolves with `instanceOf ⊇ {UmlUseCase}`, but NO scenario/index file is written → **INV-T tree byte-diff==0** (HARD Tron AC: tree/traceability/mof/every node byte-identical pre↔post; UseCase still shows at its current node).
- **INV-U2 (render-from-data):** a dragged UseCase renders as a UmlUseCase ellipse from its existing name/class/method — no copy, no duplicate unit.
- **INV-U3 (one-unit):** the traceability UseCase IS the model element (Tron Ruling A) — no duplicate M1 usecase (none exists; projection is type-level, needs no counterpart).
- **INV-U4 (usedIn bidirectional):** via side-index (unchanged).

### GATE @390 (real-WebKit — the DISTINCT test the false-Done lacked)
(a) a REAL scenario UseCase /api/ior shows `instanceOf` INCLUDING UmlUseCase [INV-U1]; (b) pre/post: `/api/model/tree` + rawbin children + traceability folder byte-diff==0 [INV-T]; (c) drag → renders as a UML use-case ELLIPSE from its data (not a class box, no duplicate) [INV-U2]; (d) usedIn bidirectional. ★ MUST exercise a UseCase (not a class) — distinct-intent from fb5ae5eb/e21b876d (verify-owner-first: NO cross-wire onto 37c08fd5/94ad4f50's class Tests).

### Chain
Small addition on the /api/ior resolution path. DISTINCT behavior (UseCase type-projection vs class counterpart-merge) → needs its OWN distinct Test (the false-Done gap). Server change → REAL restart + R31.7. req mints the distinct UseCase-projection Test scenario-first (#126); I backstop on ship (INV-U1..4 + @390 ellipse).

## T36.5 WHERE-USED DISPLAY — ARCHITECT DESIGN (architect 2026-08-06, PO-sequenced after R36.1)
MEASURE-FIRST: the DATA already exists — `resolveUsedIn` (server.ts:2f44e112, R36.2c side-index usage-index.json) + `reconcileCanonical` (:1312) attach `m.usedIn = [{kind, ref}]` onto every /api/ior model-element resolution. But NO client renders it (grep src/public/ts usedIn = 0). So T36.5 = pure client DISPLAY of already-served data. NO server change, NO fork.

### FIX — a "Where used" section in RbModelElementDetail.render (rb-modelelement-detail.ts:31-72)
| # | File | Change | Detail |
|---|------|--------|--------|
| 1 | `rb-modelelement-detail.ts` render (before `this.innerHTML=html` :70) | ADD a `usedIn` section, reusing the EXISTING `this.sec()` + `this.link()` helpers | `const usedIn = Array.isArray(m.usedIn) ? m.usedIn as {kind:string;ref:string}[] : []; html += this.sec('Where used', usedIn.length); html += usedIn.length ? usedIn.map(u => this.link(u.ref, u.kind, /*name from u.ref or fetch*/)).join('') : '<div class="dv-empty">Not used</div>';` |
| 2 | drill | NONE — the existing `.dv-link` click handler (:71) already does `selectionModel.replaceWith(ref)` → the drawer re-renders the using Diagram/element. A usedIn `ref` (e.g. `diagram:<uuid>`) reuses it verbatim. |
| 3 | backend | NONE — usedIn already on /api/ior (survives-regen + bidirectional by construction, R36.2c/R36.5). |

### INVARIANTS
- **INV-W1 (data-driven):** the section reflects `m.usedIn` from /api/ior (side-index) → survives-regen + bidirectional inherited (backend unchanged).
- **INV-W2 (drill):** each usedIn ref clickable → `selectionModel.replaceWith` → drawer re-renders the using unit (standard flow, reused).
- **INV-W3 (INV-T):** display is detail-view ONLY → tree byte-diff==0 (usedIn was never in the tree).
- **INV-W4 (empty-safe):** no usedIn → "Not used", no error.

### GATE @390
(a) add a diagram view referencing an element → open that element's detail → "Where used" lists the diagram [INV-W1]; (b) remove the view → the entry drops (bidirectional, R36.5) [INV-W1]; (c) click a usedIn ref → drills to the using unit [INV-W2]; (d) re-generate → usedIn persists (side-index, R36.2c); (e) tree byte-diff==0 pre/post [INV-W3].

### Chain
Client-only addition to RbModelElementDetail.render (Method c2da9192 / Impl 7e147ad8) — DISTINCT behavior (where-used display) → its OWN distinct Test (no cross-wire). Client-only → version bump → REAL restart (R32.7 lesson) + R31.7. req mints the distinct Test scenario-first (#126); I backstop on ship (INV-W1..4 + @390 drill).
