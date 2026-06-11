### R19.58: All 7 type DetailViews show ONE consistent Traceability section with the real chain, not a flat method list.

<details><summary>Tron directive</summary>

> EVERY type DetailView (all 7: Sprint, Task, Requirement, UseCase, Class, Method, Implementation, Test) MUST show ONE consistent 'Traceability' section containing the REAL singular chain (req→uc→class→method→impl→test) — the content currently labeled 'Champagne Chain' in some views. The label MUST be user-understandable ('Traceability', NOT 'Champagne Chain' — users don't know what champagne means). The current inconsistency: first 2 types show 'Traceability' but with a WRONG flat all-methods list; second 2 types show 'Champagne Chain' with the CORRECT chain content. Consolidate: every type uses the same template section, same label ('Traceability'), same correct singular-chain content. 'All children' section stays as-is (separate, listing all children).

</details>

## Traceability

**Tasks:**
- [🔗 T-detailview-consolidate: all 7 type DetailViews show ONE consistent Traceability Chain section](../task/detailview-consolidate-consistent-chain-section.md)

**UseCases:**
- [🔗 detailView.unifiedTraceability](../usecase/detailview-unifiedtraceability.md)
