### R18.16: Traceability chain includes the Class level between UseCase and Method — no skip from UseCase directly to Method.

<details><summary>Tron directive</summary>

> > TRON (3): "usecese -> method instead of usecase -> class -> method and then missing implementation test"
> 
> The /trace tree currently shows UseCase → Method, skipping the Class level. The locked 7-step chain (R-E / T168) requires: req → task → UC → **Class** → Method → Implementation → Test. The chain walker must resolve the Class node between UseCase and Method. If the UseCase's `classes[]` links to a Class which has `methods[]`, the tree shows UC → Class → Method. If the data is missing the Class hop (UseCase has `methods[]` directly instead of `classes[]`), this is a data quality fix.
> 
> Additionally: Tron notes "missing implementation test" — the chain below Method must continue to Implementation → Test (per R18.13). This links to T195 where missing impl/test data is being filled.
> 
> **Deduplication check:** R18.2 covers narrowing to ONE method. R18.16 covers a different issue — the Class LEVEL is skipped entirely. Not narrowing, but a missing hop.
> 
> **Acceptance criteria:**
> - [ ] /trace tree shows UC → Class → Method (not UC → Method)
> - [ ] Every Method in the chain has a parent Class node
> - [ ] If UseCase has no `classes[]` but has direct `methods[]`, the data is fixed (Class node inserted)
> - [ ] Below Method: Implementation → Test continues (per R18.13, linked to T195 data fill)

</details>

## Traceability

**Tasks:**
- [🔗 Orphan-method + wrong-type-UUID cleanup in Method.implementation chain](../task/t197-orphan-method-wrong-type-uuid-cleanup.md)
- [🔗 Object.verb UC population + Class/Method/Impl chain wiring (multi-phase epic)](../task/t195-object-verb-uc-population-chain-wiring.md)

**UseCases:**
- [🔗 traceGraph.classHop](../usecase/tracegraph-classhop.md)
