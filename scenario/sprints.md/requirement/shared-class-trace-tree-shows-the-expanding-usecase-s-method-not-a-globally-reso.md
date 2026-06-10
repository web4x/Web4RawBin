### Shared Class: trace tree shows the expanding UseCase's method, not a globally-resolved Class.method

<details><summary>Tron directive</summary>

> When a Class is referenced by multiple UseCases in the trace graph, expanding the Class under a specific UseCase MUST show the Method bound to THAT UseCase (UC.method). It MUST NOT fall back to a single global Class.method resolution (e.g. last-verb-match-wins, alphabetic-first, or any other UC-blind heuristic), because such heuristics pick the wrong method when the Class is shared. Method resolution is UC-scoped: every Class node in the trace tree is rendered in the context of its expanding ancestor UseCase, and the displayed Method is the one wired to that UC's chain. This refines R18.2 (chain-through-Class narrowing) by specifying the resolution context for the multi-UC-shared-Class case.

</details>

## Traceability

**Tasks:**
- [🔗 T202: Class.method-per-UC narrowing — shared Class picks wrong method](../task/class-method-per-uc-narrowing-shared-class-wrong-method.md)
