### R19.28: Tree prefetch is one-layer-ahead eager — preload exactly one sublayer beyond visible, non-recursive.

<details><summary>Tron directive</summary>

> The tree (rb-tree in /trace and in-room) MUST use a ONE-LAYER-AHEAD eager prefetch strategy: always preload exactly one sublayer beyond what is currently visible so that every shown node's child-count badge (R19.25) is known without the user needing to expand. On expand of a node, eagerly prefetch the NEXT sublayer for ALL now-shown children — exactly one layer deep, NON-recursive. This is lazy loading with one-layer-ahead eager preloading: not fully recursive (which would load the entire tree), but not purely on-demand either (which would show unknown badge counts until clicked).

</details>

## Traceability

**Tasks:**
- [🔗 T-one-layer-prefetch: server childCount + client prefetchCache + 3 non-recursive triggers](../task/one-layer-prefetch-childcount-cache-triggers.md)

**UseCases:**
- [🔗 traceTree.prefetchLayer](../usecase/tracetree-prefetchlayer.md)
