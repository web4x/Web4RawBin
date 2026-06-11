### R18.10: Tree lazy-loads only the NEXT layer per expand — not the full subtree.

<details><summary>Tron directive</summary>

> > TRON: "these cases [T123↔R16.4 infinite cycle in trace tree] have to completely be eliminated. also lazy loading just the next layer would prevent the issue here."
> 
> Each expand click loads ONLY the immediate children of the clicked node — one layer deep. It does NOT recursively load grandchildren or the full subtree. This prevents the cycle issue (a cycle cannot recurse if only one layer loads at a time) and keeps the tree responsive. The user must explicitly click to expand each successive level.
> 
> **Deduplication check:** R18.6 covers DOM append (no full re-render). R-Y1/R-V1 cover lazy-load data fetch at every depth. R18.10 is the DEPTH LIMIT per expand — only one layer, not recursive. Complements R18.6 and R-Y1 but is a distinct constraint.
> 
> **Acceptance criteria:**
> - [ ] Expanding a node fetches and renders only its immediate children (depth=1)
> - [ ] Grandchildren are NOT fetched until the user expands a child node
> - [ ] Even if data contains deep nesting, only one layer appears per click
> - [ ] Combined with R18.9 cycle guard: cycles cannot recurse because only one layer loads

</details>

## Traceability

**Tasks:**
- [🔗 T173: .scenario.json click → /trace tree + lazy-load (consolidates R-K1 + R-L; covers R-K2 + R-K3)](../task/task-173-file-browser-scenario-click-to-trace.md)

**UseCases:**
- [🔗 traceTree.lazyExpand](../usecase/tracetree-lazyexpand.md)
