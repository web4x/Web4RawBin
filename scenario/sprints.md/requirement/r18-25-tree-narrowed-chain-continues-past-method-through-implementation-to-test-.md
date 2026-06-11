### R18.25: Tree narrowed chain continues past Method through Implementation to Test — not stopping at Method.

<details><summary>Tron directive</summary>

> > TRON: "Traceability Chain = All children but they should not. tree shows the tracability chain but also broken ...only till method...not deeper to impl and test"
> 
> ### R18.25: Tree narrowed chain continues past Method through Implementation to Test — not stopping at Method.
> 
> The /trace tree currently stops the chain at Method level — it does not expand further to show Implementation → Test(s). The chain must continue the full 7-step depth: req → task → UC → class → method → **impl → test**. This is the same gap as R18.13 (chain terminates in Test) but specifically about the tree UI not rendering the last two levels.

</details>

## Traceability

**Tasks:**
- [🔗 Object.verb UC population + Class/Method/Impl chain wiring (multi-phase epic)](../task/t195-object-verb-uc-population-chain-wiring.md)

**UseCases:**
- [🔗 traceTree.chainToTest](../usecase/tracetree-chaintotest.md)
