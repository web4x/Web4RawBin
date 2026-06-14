### R20.5: Detail-view Traceability Chain shows ONLY traced-chain nodes; All Children = union of ALL model arrays. Universal.

<details><summary>Tron directive</summary>

> UNIVERSAL rule for EVERY scenario type detail view (all present and future types): (A) Traceability Chain section shows ONLY nodes in an actual traced chain (req→uc→class→METHOD — chain-relevant method only, not all class methods). (B) All Children section = UNION of ALL array-relationship fields in the model (useCases[]/tasks[]/tests[]/methods[]/implementations[]/members[]/files[]/etc). Two distinct sections, two distinct data sources, one DRY implementation across all DetailViews. (C) DEDUP TRACEABILITY: when requirements are deduplicated/merged, each duplicate carries a supersededBy/duplicateOf link to the canonical, visible in the detail-view + traceable in the chain. A deduped req is never lost — it traces to its canonical. The canonical lists its duplicates via supersedes[]. Both directions surfaced in the detail-view.

</details>

## Traceability

**Tasks:**
- [🔗 T-singular-chain-detail: detail view shows singular chain per UC not Class.methods[] fan-out (R18.24 regression)](../task/singular-chain-detail-per-uc-not-class-methods-fanout.md)

**UseCases:**
- [🔗 detailView.singularChain](../usecase/detailview-singularchain.md)
