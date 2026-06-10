### R19.29: Tree owns badge calculation and lazy-eager prefetch as its own methods — items are dumb views the tree drives.

<details><summary>Tron directive</summary>

> The Tree component (rb-trace-tree) MUST own badge child-count calculation+assignment AND lazy/eager one-layer prefetch as its OWN methods/behavior operating ON its items. rb-object-item becomes a dumb view that the Tree drives — it does not self-calculate badge counts, does not self-trigger prefetch, and does not scatter these concerns across multiple trigger sites. This is an OO quality refactor: badge+prefetch logic moves FROM ad-hoc per-item/per-expand-site INTO Tree.updateBadges() and Tree.prefetchLayer() (or equivalent method names). The current scattered implementation causes a bug where some nodes (e.g. Class RbObjectItem) show badge 0 despite having a visible Method child — count inconsistent because not all trigger sites update correctly. The refactor fixes this by centralizing the source of truth.

</details>

## Traceability

**Tasks:**
- [🔗 T-tree-owns-badges-prefetch: Tree owns computeBadges/prefetchLayer/prefetchVisibleLayer + TRACE_FWD plural-field fix](../task/tree-owns-badges-prefetch-trace-fwd-plural-fix.md)

**UseCases:**
- [🔗 traceTree.computeBadges](../usecase/tracetree-computebadges.md)
