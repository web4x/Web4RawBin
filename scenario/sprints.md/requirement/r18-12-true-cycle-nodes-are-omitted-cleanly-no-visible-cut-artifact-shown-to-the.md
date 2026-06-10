### R18.12: True-cycle nodes are omitted cleanly — no visible cut artifact shown to the user.

<details><summary>Tron directive</summary>

> > TRON: "cycle stopped but also correct children got cut out. user does not want to see the cut out cycle."
> 
> When a true cycle IS detected (a node is its own ancestor), the cyclic node is simply NOT rendered — no ⟳ icon, no "cycle detected" label, no placeholder. The tree silently terminates at the parent. The user sees a normal leaf node with no indication that a cycle was suppressed. Tron: "user does not want to see the cut out cycle."
> 
> **Acceptance criteria:**
> - [ ] True-cycle nodes are omitted entirely from the rendered tree
> - [ ] No cycle icon, label, or placeholder visible to the user
> - [ ] Parent node of a suppressed cycle appears as a normal leaf (no expand arrow if its only children would be cyclic)
> - [ ] If a node has BOTH legitimate children AND a cyclic child, only the legitimate children render

</details>

## Traceability

**UseCases:**
- [🔗 traceTree.cycleOmit](../usecase/tracetree-cycleomit.md)
