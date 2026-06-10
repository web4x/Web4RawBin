### R18.9: Chain cycles are completely eliminated — forward-only traversal with cycle guard.

<details><summary>Tron directive</summary>

> > TRON: "these cases [T123↔R16.4 infinite cycle in trace tree] have to completely be eliminated. also lazy loading just the next layer would prevent the issue here."
> 
> The trace tree currently exhibits infinite cycles when a Task and Requirement reference each other (T123↔R16.4 observed). ALL cycles in the traceability chain must be eliminated. The chain walker must enforce strict forward-only traversal: requirement → task → UC → class → method → impl → test. A visited-set cycle guard must prevent any node from being expanded twice in the same chain path. If a cycle is detected, the node renders as a leaf with a cycle indicator — it does NOT recurse.
> 
> **Deduplication check:** R-F (data quality, zero backward chaos) and B18 (forward-only) cover the DATA direction. R18.9 covers the RUNTIME traversal — the tree walker must guard against cycles even if the data has them. Different layer — genuinely new.
> 
> **Acceptance criteria:**
> - [ ] No infinite expansion in the trace tree (T123↔R16.4 cycle resolved)
> - [ ] Visited-set guard: a node appearing twice in the same path stops expansion
> - [ ] Cycle detected → node rendered as leaf with visual indicator (e.g. ⟳ icon)
> - [ ] Forward-only chain types enforced: requirement can only expand to tasks, task to UCs, etc.

</details>