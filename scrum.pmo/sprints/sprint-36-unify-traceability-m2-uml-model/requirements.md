<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 36 Requirements — Unify Traceability Units with the M2 UML/TS Model

## Requirements

- [ ] **R36.1 — UmlUseCase extends UseCase (new M2 view of the same scenario, A-merge)**
  [requirement:uuid:e8fc62f9-5816-4eb1-938c-3db4b44bb803]
  MINT UmlUseCase as a M2 metaclass on disk (ABSENT today) — the existing UseCase ScenarioUnit gains instanceOf:[...,UmlUseCase] (typed OOP EXTENSION / VIEW, NOT a duplicate; the EXACT M2 instanceOf multi-facet mechanism M1 ModelElement already uses). ★ TRON RULING A (MERGE 2026-08-05): the traceability UseCase unit IS the model element — it gains the instanceOf facet + draggability + usage-refs IN PLACE; TsToModel RECONCILES any generated M1 into the SAME traceability unit (deterministic same-uuid by sourceFile::qualifiedName, or a modelElement link), so ONE unit per real use case (no M1/traceability duplication). Drag→diagram = a Diagram view-link to the UseCase unit rendered as a UML use-case ellipse from its EXISTING data (name=Object.verb, class, method) — a VIEW, no copy. UseCase tracks usedIn[]. Stays a Class.method/Object.verb decomposition tracing to its Method (→R36.4). ★ HARD CONSTRAINT (Tron): the merge MUST NOT disrupt/break the current tree.
  **Acceptance criteria:**
  - [ ] **(functional)** UmlUseCase is minted as a M2 metaclass ON DISK (absent today); a UseCase unit carries instanceOf:[...,UmlUseCase] — typed OOP extension, NOT a duplicate.
  - [ ] **(functional)** A-MERGE (fork-A resolve-at-detail, architect b08995a28): the traceability UseCase unit IS the model element (enriched with the instanceOf facet + draggability + usedIn IN PLACE); a generated M1 ModelElement reconciles to the SAME canonical unit by the DETERMINISTIC key sourceFile::qualifiedName (keyToUuid same-uuid) OR a modelElement<->baseUnit link, resolved at /api/ior — ONE unit per real use case, no duplication.
  - [ ] **(functional)** Drag→diagram creates a Diagram view-link to the UseCase unit, rendered as a UML use-case ellipse FROM its existing data (name=Object.verb/class/method) — a VIEW, no copied data.
  - [ ] **(functional)** The UseCase unit tracks usedIn[] (diagrams/folders it is placed on) — bidirectional with Diagram.views.
  - [ ] **(gate)** HARD AC (Tron constraint, reuse A2/R35.4 protect-the-tree): /api/model/tree + rawbin children [ts,puml,diagrams,traceability] + sprint structure + EVERY existing node render BYTE-IDENTICAL before vs after merge (byte-diff==0). A merged element STILL shows at its current node — only its detail / /api/ior / Scenario / Edit / facet-views resolve to the ONE canonical unit; NO node added/removed/reordered/recounted. The MOF tree + traceability folder + /api/model/tree are UNTOUCHED. GATE @390: pre/post-merge tree byte-diff==0.
  - [ ] **(gate)** GATE @390 real-WebKit: UmlUseCase exists on disk (M2); a UseCase instanceOf it (ONE merged unit); drag renders the ellipse from unit data (no duplicate); usedIn bidirectional. Chain-to-Test, Impl.tests[] on disk before flip.
  -> modelElement.umlUseCaseView [uc:uuid:543ce993-9ffd-4460-a1db-f83bbf1ea0eb]

- [ ] **R36.2 — UmlClass + tsClass extend Class (two facet-lens views of ONE Class, A-merge)**
  [requirement:uuid:32bf71f2-550c-409c-8c4d-b6c26be81586]
  The existing Class ScenarioUnit gains instanceOf:[UmlClass, ts-class-code] (both M2 facets EXIST — reuse) = two facet-LENS VIEWS: UmlClass (UML box: name + attribute/method compartments from Class.methods[]+members) vs tsClass (TS signature view). Both draggable (Diagram view-link to the ONE Class unit, viewKind:'class'|'tsClass'); render from Class data; usedIn usage-refs tracked. Two projections, ONE unit — NO copy. ★ TRON RULING A (MERGE 2026-08-05): the authored traceability Class unit IS the model element — gains the facets in place; TsToModel RECONCILES the generated M1 ModelElement into the SAME traceability Class (deterministic same-uuid sourceFile::qualifiedName, or modelElement link), removing the M1/traceability duplication (ONE unit per real class). ★ HARD CONSTRAINT (Tron): the merge MUST NOT disrupt/break the current tree.
  **Acceptance criteria:**
  - [ ] **(functional)** The Class unit carries instanceOf:[UmlClass, ts-class-code] (reuse existing M2 facets) = two facet-lens VIEWS of the ONE Class unit, no copy.
  - [ ] **(functional)** A-MERGE (fork-A resolve-at-detail, architect b08995a28): the authored traceability Class IS the model element (enriched with instanceOf[UmlClass,ts-class-code]+members+signature+usedIn IN PLACE); the generated M1 ModelElement reconciles to the SAME canonical Class by the DETERMINISTIC key sourceFile::qualifiedName (keyToUuid same-uuid) OR a modelElement<->baseUnit link, resolved at /api/ior — ONE unit per real class, no M1/traceability duplication.
  - [ ] **(functional)** Both UmlClass + tsClass are draggable (Diagram view-link to the ONE Class unit, viewKind class|tsClass); each renders from the SAME Class data (UML box vs TS signature).
  - [ ] **(functional)** Usage-refs (usedIn[]) tracked bidirectionally with Diagram.views.
  - [ ] **(gate)** HARD AC (Tron constraint, reuse A2/R35.4 protect-the-tree): /api/model/tree + rawbin children [ts,puml,diagrams,traceability] + sprint structure + EVERY existing node render BYTE-IDENTICAL before vs after merge (byte-diff==0). A merged element STILL shows at its current node — only its detail / /api/ior / Scenario / Edit / facet-views resolve to the ONE canonical unit; NO node added/removed/reordered/recounted. The MOF tree + traceability folder + /api/model/tree UNTOUCHED. GATE @390: pre/post-merge tree byte-diff==0.
  - [ ] **(gate)** HARD (architect mechanism (c) SIDE-INDEX, ca49f1826): usedIn[] survives TsToModel RE-GENERATION BY CONSTRUCTION — usedIn lives in a DEDICATED usage-index in MODEL_STORE keyed by the CANONICAL deterministic uuid (sourceFile::qualifiedName), OUTSIDE the generated element file. TsToModel NEVER touches the side index, so re-gen leaves usedIn intact; the generated M1 element stays PRISTINE (INV-RM1 strict — element file never written); resolveUsedIn reads the side index (resolve-at-detail); bidirectional side-index<->Diagram.views. (c) refactors R36.5 on-element usedIn into the side index — natural AT R36.2. GATE @390: place a Class on a diagram (usedIn set in side-index) -> trigger TsToModel re-gen -> usedIn still present+correct (survives) + the generated element file byte-unchanged + tree byte-unchanged.
  - [ ] **(gate)** GUARDRAIL (architect 19b6217be + PO): (c) is a TRANSPARENT BACKEND SWAP — ONLY the 3 R36.5 fns (addUsedIn/removeUsedIn/resolveUsedIn 2f44e112) move off-element to read/write the MODEL_STORE side-index (keyed by keyToUuid(sourceFile::qualifiedName)); add-view/remove-view callers + GET /api/model/used-in + /api/ior behavior UNCHANGED. BECAUSE the usedIn STORE LOCATION moves off-element, when R36.2 ships the tester MUST RE-GATE R36.5 on the side-index backend: add-view→side-index returns, remove-view→drops, bidirectional, the element file is NOW PRISTINE (INV-RM1), /api/ior STILL shows usedIn (resolver attaches), INV-T byte-diff==0. R36.5 on-element Test 91a10db8 is re-verified/re-pointed to the side-index behavior on R36.2 ship.
  - [ ] **(gate)** GATE @390: Class instanceOf both facets (ONE merged unit); drag each renders from the ONE unit's data (no duplicate); usedIn bidirectional.
  -> modelElement.umlClassView [uc:uuid:dd000fd8-b65c-4868-a3ed-22b2f23a3aed]

- [ ] **R36.3 — Method enrichment (full signature + docs) + Method-vs-Function + Uml/ts projections**
  [requirement:uuid:d4048137-c73c-4132-a27e-2b2fae53c5b8]
  ENRICH the Method ScenarioUnit with a FULL SIGNATURE: visibility (public/private/protected), name(parameters[]), returnType, and documentation (oosh-style). Method != Function via a parentClass field — PRESENT ⇒ Method (instanceOf UmlMethod), ABSENT ⇒ Function (instanceOf UmlFunction); Function→Method is convertible (add a parentClass), Method→Function is blocked/hard (state/attribute access) = a one-way conversion. Projections: UmlMethod/UmlFunction + ts-method-code (typed extensions of the enriched Method/Function).
  **Acceptance criteria:**
  - [ ] **(functional)** The Method unit carries a FULL signature: visibility {public|private|protected}, name(parameters[]), returnType, docs (oosh-style) — enriched from the source decl.
  - [ ] **(functional)** parentClass field distinguishes Method (PRESENT ⇒ instanceOf UmlMethod) from Function (ABSENT ⇒ instanceOf UmlFunction). Function→Method convertible (add parentClass); Method→Function blocked (modelled one-way).
  - [ ] **(functional)** UmlMethod/UmlFunction + ts-method-code projections render as typed facet-lens VIEWS of the enriched Method/Function unit (no copy).
  - [ ] **(gate)** GATE @390: Method unit shows the full signature + docs; Method/Function distinction via parentClass present/absent; projections render from the unit; Function→Method conversion works, Method→Function blocked.
  -> modelElement.methodSignature [uc:uuid:f5e4ecb2-b337-4ed4-9c49-df3effd5775a]

- [ ] **R36.4 — UmlTraceRelationship extends TraceLink (typed RawBin decompose/trace)**
  [requirement:uuid:2265ad63-8c61-4e72-bd36-afd28c9bd731]
  NEW UmlTraceRelationship EXTENDS the existing TraceLink (reuse {from,to,fromType,toType,relation,direction,label}) with a RawBin relation VOCABULARY (decomposes/traces), NOT strict UML 2.5. Semantics: a UseCase (=Class.method/Object.verb) traces/decomposes → its Method. Each endpoint = a typed OOP-extended ScenarioUnit tracking usage-refs. Renders as a typed connector on the diagram (reuse R32.6 edges + EDGE_DEFS kind-map, add the trace kind).
  **Acceptance criteria:**
  - [ ] **(functional)** UmlTraceRelationship EXTENDS TraceLink (reuse from/to/fromType/toType/relation/direction/label) + a RawBin relation vocabulary (decomposes/traces) — NOT strict UML 2.5, NOT a new fork.
  - [ ] **(functional)** Semantics: a UseCase (Class.method/Object.verb) traces/decomposes → its Method; each endpoint is a typed OOP-extended unit tracking usage-refs.
  - [ ] **(functional)** Renders as a typed connector on the diagram — reuse R32.6 edges + EDGE_DEFS kind-map with the added trace kind (no fork).
  - [ ] **(gate)** GATE @390: a UmlTraceRelationship between a UseCase + its Method renders the typed trace connector; the relation vocabulary (decomposes/traces) is carried; endpoints resolve to real units.
  -> modelElement.umlTraceRelationship [uc:uuid:8c10c217-3372-4cdb-b4ba-60076766a70c]

- [ ] **R36.5 — Scenario/Edit always open the correct base ScenarioUnit + usedIn[] usage-ref tracking**
  [requirement:uuid:a8663672-3522-4f0c-b313-d14d13dbba5f]
  For EVERY projected view/element, the ◆Scenario + ✎Edit buttons carry the info to open the CORRECT underlying BASE ScenarioUnit (the unit the view projects) in the editor — RIDES S35 universal-actions (onUniversalAction b8f284c6) + ensureViewUnit (a09b474d). Usage-reference tracking (NEW, cross-cutting, bidirectional): add usedIn:[{kind:'diagram'|'folder', ref}] on units ↔ the existing Diagram.views[]/folder links; a resolver computes back-refs ("where is this used"). Bidirectional invariant: unit.usedIn ⟷ diagram.views (add-view/remove-view maintain BOTH, reuse R32.11/R33.8 add/remove-view).
  **Acceptance criteria:**
  - [ ] **(functional)** For every projected view/element, ◆Scenario opens /scenario?ior=<BASE-unit> + ✎Edit opens the base unit's editor — the CORRECT underlying ScenarioUnit the view projects (rides S35 universal-actions + ensureViewUnit). Gate the actual open-TARGET, not button presence.
  - [ ] **(functional)** Each unit carries usedIn:[{kind:'diagram'|'folder', ref}] tracking where it is placed/linked; a resolver answers "where is this used" (back-refs).
  - [ ] **(functional)** INVARIANT: unit.usedIn ⟷ Diagram.views bidirectional — add-view/remove-view maintain BOTH sides (reuse R32.11/R33.8 add/remove-view), never one-sided.
  - [ ] **(gate)** GATE @390: Scenario/Edit on a projected view open the CORRECT base unit (verify the open-target); usedIn is bidirectional (place on diagram → unit.usedIn + diagram.views both updated; remove → both cleared).
  -> actionBar.openBaseUnit [uc:uuid:2d58e144-1765-4564-ba51-500ba8275944]
  -> modelElement.usedInResolver [uc:uuid:e46c6407-3188-4fde-9ad3-5cf5ff171914]
