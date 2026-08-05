<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 36.2: UmlClass + tsClass extend Class — two facet-lens views of ONE Class (A-merge, tree-preserving) [R36.2, projections build 3rd]

[task:uuid:58596fcc-781f-444b-9730-ca7e3db5f5e0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [~] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

In Progress (chain-BUILT via R30.11, ONE distinct survives-regen Test PENDING @390): R36.2 all chains BUILT on disk — A-merge/reconcile (reconcileCanonical 37c08fd5.tests[]=[fb5ae5eb], INV-T byte-diff==0 no-write) + both-facet render (renderFacet 94ad4f50.tests[]=[e21b876d]) + usedIn-bidirectional (R36.5 foundation) + usedin-SURVIVES-REGEN (own UC d2a2ead2 -> own Method 94154aba server.usedInSurvivesRegen RIDES resolveUsedIn Impl 2f44e112, R30.11 shared-impl; side-index 95941e5c3 v0.8.54 mechanism BUILT by-construction: usage-index.json separate MODEL_STORE file, TsToModel touches 0x). ★ VERIFY-NOT-RELAY CLEAN (checked disk myself): 2f44e112 (R36.5-owned) UNTOUCHED — tests[]=[91a10db8], markerPending=false, NO re-credit/flip/touch. R36.2.useCases[]+=d2a2ead2 (req d446e8c97). ★ survives-regen Test VERIFIED (a81a82c4 'T36.2 usedIn survives re-generation', status=pass, distinct-intent on 2f44e112, NOT claiming 91a10db8; tester GREEN 5fcacef90 v0.8.61). ★★ HELD on the GUARDRAIL AC (R36.2 GATE): it requires the R36.5 RE-GATE on the side-index (PO ordered NOW) — but the tester's v0.8.61 cycle GREEN'd R36.3 + T36.2-survives-regen and DID NOT re-gate R36.5's 91a10db8 on the side-index (no re-gate commit; 91a10db8 status=pass is still the OLD on-element run). T36.2 NOT Done until R36.5 re-gated GREEN (GUARDRAIL met) — coupled w/ T36.5 Done-PENDING-RE-GATE. Flagged tester/req/PO.

## Traceability

  - up
    - [Sprint 36 Planning](./planning.md)
    - Requirement R36.2 `[requirement:uuid:32bf71f2-550c-409c-8c4d-b6c26be81586]`
  - down
    - None (atomic task)

## Task Description

The existing Class ScenarioUnit gains instanceOf:[UmlClass, ts-class-code] (both M2 facets EXIST — reuse) = two facet-LENS VIEWS: UmlClass (UML box: name + attribute/method compartments from Class.methods[]+members) vs tsClass (TS signature view). Both draggable (Diagram view-link to the ONE Class unit, viewKind:'class'|'tsClass'); render from Class data; usedIn usage-refs tracked. Two projections, ONE unit — NO copy. TRON RULING A (MERGE 2026-08-05): the authored traceability Class unit IS the model element — gains the facets in place; TsToModel RECONCILES the generated M1 ModelElement into the SAME traceability Class (deterministic same-uuid sourceFile::qualifiedName, or modelElement link), removing the M1/traceability duplication (ONE unit per real class). HARD CONSTRAINT (Tron): the merge MUST NOT disrupt/break the current tree.

## Acceptance Criteria

- [ ] (functional) The Class unit carries instanceOf:[UmlClass, ts-class-code] (reuse existing M2 facets) = two facet-lens VIEWS of the ONE Class unit, no copy.
- [ ] (functional) A-MERGE (fork-A resolve-at-detail, architect b08995a28): the authored traceability Class IS the model element (enriched with instanceOf[UmlClass,ts-class-code]+members+signature+usedIn IN PLACE); the generated M1 ModelElement reconciles to the SAME canonical Class by the DETERMINISTIC key sourceFile::qualifiedName (keyToUuid same-uuid) OR a modelElement<->baseUnit link, resolved at /api/ior — ONE unit per real class, no M1/traceability duplication.
- [ ] (functional) Both UmlClass + tsClass are draggable (Diagram view-link to the ONE Class unit, viewKind class|tsClass); each renders from the SAME Class data (UML box vs TS signature).
- [ ] (functional) Usage-refs (usedIn[]) tracked bidirectionally with Diagram.views.
- [ ] (gate) HARD AC-tree-unchanged (Tron, reuse A2/R35.4 protect-the-tree): /api/model/tree + rawbin children [ts,puml,diagrams,traceability] + sprint structure + EVERY existing node BYTE-IDENTICAL before vs after merge (byte-diff==0); a merged element STILL shows at its current node, only detail//api/ior/Scenario/Edit/facet-views resolve to the ONE canonical unit; NO node added/removed/reordered/recounted.
- [ ] (gate) HARD AC-usedin-survives-regen (architect mechanism (c) SIDE-INDEX ca49f1826): usedIn[] survives TsToModel RE-GEN BY CONSTRUCTION — usedIn lives in a DEDICATED MODEL_STORE usage-index keyed by the CANONICAL uuid (sourceFile::qualifiedName), OUTSIDE the generated element file; TsToModel never touches the side-index, the generated M1 stays PRISTINE (INV-RM1 strict); resolveUsedIn reads the side-index; bidirectional side-index<->Diagram.views. GATE @390: place a Class on a diagram -> TsToModel re-gen -> usedIn survives + element file byte-unchanged + tree byte-unchanged.
- [ ] (gate) GUARDRAIL (architect 19b6217be + PO): (c) is a TRANSPARENT BACKEND SWAP — only the 3 R36.5 fns (addUsedIn/removeUsedIn/resolveUsedIn 2f44e112) move off-element to the MODEL_STORE side-index (keyToUuid(sourceFile::qualifiedName)); callers + GET /api/model/used-in + /api/ior UNCHANGED. On R36.2 ship the tester MUST RE-GATE R36.5 on the side-index backend (element file now PRISTINE INV-RM1, /api/ior still shows usedIn, INV-T byte-diff==0); R36.5 Test 91a10db8 re-verified/re-pointed to the side-index behavior.
- [ ] (gate) GATE @390: Class instanceOf both facets (ONE merged unit); drag each renders from the ONE unit's data (no duplicate); usedIn bidirectional.

## Subtasks

None (atomic task).
