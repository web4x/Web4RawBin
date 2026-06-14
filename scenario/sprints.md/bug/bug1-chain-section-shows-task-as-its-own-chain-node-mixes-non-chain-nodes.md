### BUG1: Chain section shows Task as its own chain node + mixes non-chain nodes.

<details><summary>Tron directive</summary>

> BUG: the Traceability Chain section in the detail-view shows the TASK as its OWN chain node (self-referential — the Task appears in its own traced chain) and mixes in non-chain nodes (all methods instead of chain-relevant only). The chain should show ONLY the singular traced path (req→uc→class→method→impl→test) — Task is NAVIGATION, not a chain node (locked 6-step standard). Ties to R20.5-A (chain shows only traced-chain nodes).

</details>

## Traceability

**Tasks:**
- [🔗 T-chain-excludes-self-and-nonchain: chain section excludes the Task self-node + non-chain nodes](../task/chain-section-excludes-self-and-nonchain.md)
