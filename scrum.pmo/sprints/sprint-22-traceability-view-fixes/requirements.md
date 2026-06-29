[Back to Planning](./planning.md)

# Sprint 22 — Traceability View Fixes — Requirements

**Source:** Tron directive (screenshot) 2026-06-29, via robbin-po.
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md) — 6-step chain: Requirement → UseCase → Class → Method → Implementation → Test.

---

## Requirements

- [ ] **R22.1 — Task detail: one chain section + Forward Links to MD task file**
  [requirement:uuid:661836fd-2db8-4863-8556-0d698c897cd5]
  > TRON (screenshot directive): "Task detail view has two issues: (1) 'Traceability Chain: No chain' appears as a FALSE DUPLICATE above the real chain (which renders correctly below it) — the empty first section must be removed or merged, one chain section only. (2) Forward Links shows raw useCases reference — should instead show a LINK TO THE MD TASK FILE (the sprint task documentation file path)."
  The Task detail view must render exactly ONE Traceability Chain section — removing the false-duplicate empty "Traceability Chain: No chain" section that currently appears above the correctly-rendered chain — and its Forward Links section must show a link to the MD task documentation file (the sprint task file path) instead of the raw useCases reference.
  **Acceptance criteria:**
  - [ ] **(issue 1 — dedupe chain)** The Task detail view shows only ONE Traceability Chain section
  - [ ] The empty/false "Traceability Chain: No chain" section that rendered ABOVE the real chain is gone (removed or merged into the single section)
  - [ ] The remaining single chain section still renders the real chain correctly (no regression)
  - [ ] **(issue 2 — Forward Links → MD)** The Forward Links section links to the MD task documentation file (the sprint task file path), not the raw `useCases` IOR reference
  - [ ] The link resolves/opens the task's `.md` file in the sprint directory
  - [ ] Verified live (headless) against the running app — the Task detail view matches the corrected layout
  → [UC-VF.1: taskDetail.renderSingleChainAndMdLink](./planning.md#uc-vf1) `[uc:uuid:4d0e454a-124a-43f7-8487-28aa61c12fbf]` *(placeholder)*

---

## Traceability Matrix

| Req | Concise name | Requirement UUID | UC placeholder UUID |
|-----|--------------|------------------|---------------------|
| R22.1 | Task detail: one chain + MD-file links | 661836fd-2db8-4863-8556-0d698c897cd5 | 4d0e454a-124a-43f7-8487-28aa61c12fbf |

**R-I note (for planner/PO):** R22.1 bundles two distinct atomic behaviours — (a) dedupe the chain section, (b) repoint Forward Links to the MD file. Per the atomic-one-sentence rule these could split into R22.1 + R22.2; captured as one unit per the PO directive ("R22.1"). Flag if a split is wanted for independent tasking.

---

*Captured by robbin-req 2026-06-29. Verbatim Tron (screenshot) directive is authoritative; concise name is for display.*
