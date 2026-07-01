[Back to Planning](./planning.md)

# Sprint 28 — Graph-Integrity Foundation — Requirements

**Source:** PO re-scope + architect ref-slot registry design (05da0584a / slot inventory 76c3a102b), 2026-07-01.
**Theme:** the canonical ref-slot registry (instrument) + the true-dangling repair (debt). Foundational, scenario-first; build on Tron's go.

> **GENERATED-FROM-SCENARIO-UNITS view** — source of truth is the scenario units. Do not hand-edit.

---

## Requirements

- [ ] **R27.5 — Canonical ref-slot registry + trace-audit calibration** *(moved from S27; f48fbf5d)*
  [requirement:uuid:f48fbf5d-e75e-43c3-9a0c-80bbd6e503bc]
  A canonical ref-slot registry every migration+audit imports (per-slot fwd/back/cross + token/edge/self), excluding ~500 auth-token false-positives, plus the orphan-metric calibration — so the graph metrics become HONEST. Root fix for the R27.4 ownerIor + Test.methods slot-misses.
  → UC27.5 traceAudit.refSlotRegistry `[uc:uuid:5ff15c57-503c-45f7-a4c0-82f7969d3646]`

- [ ] **R27.6 — Repair the true-dangling refs surfaced by the registry** *(3a7d4df2-7588-4b09-a959-21708d68b8b1)*
  [requirement:uuid:3a7d4df2-7588-4b09-a959-21708d68b8b1]
  Repair the 96 TRUE-dangling refs under the token/walk-gap noise: Method.implementation 51 + Test.parent 32 + Test.verifies 12 + Test.methods 1 — triage repoint/drop, atomic+rollbackable, all slots resolve.
  → UC27.6 graph.repairTrueDangling `[uc:uuid:a07def59-1e57-40bc-9b92-7c64b1229516]`

---

## Traceability Matrix

| Req | Name | Requirement UUID | UC UUID |
|-----|------|------------------|---------|
| R27.5 | Canonical ref-slot registry + calibration | f48fbf5d-e75e-43c3-9a0c-80bbd6e503bc | 5ff15c57-503c-45f7-a4c0-82f7969d3646 |
| R27.6 | True-dangling repair | 3a7d4df2-7588-4b09-a959-21708d68b8b1 | a07def59-1e57-40bc-9b92-7c64b1229516 |

*Captured by robbin-req 2026-07-01. R27.5 instrument / R27.6 debt. crossRef R27.4 (first slot-misses) + R24.5 (CI gate).*
