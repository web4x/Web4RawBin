### R19.34: Traceability Chain section shows the singular chain to Test, not a flat list of use cases.

<details><summary>Tron directive</summary>

> BUG: the detail view's 'Traceability Chain' section currently shows many use cases as a flat list instead of THE singular forward chain (req→uc→class→method→impl→test) leading to a Test. FIX: the Traceability Chain section MUST render ONE narrowed chain path from the current node's requirement root down to its Test leaf — the same singular-chain the locked 6-step model defines. The separate 'All children' section listing all children/UCs is acceptable and may remain as-is. Cross-refs R18.24 (detail chain shows narrowed single-thread) which specified this same behavior — R19.34 re-asserts it as a bug report because the implementation reverted/regressed.

</details>

## Traceability

**Tasks:**
- [🔗 T-singular-chain-detail: detail view shows singular chain per UC not Class.methods[] fan-out (R18.24 regression)](../task/singular-chain-detail-per-uc-not-class-methods-fanout.md)

**UseCases:**
- [🔗 detailView.singularChain](../usecase/detailview-singularchain.md)
