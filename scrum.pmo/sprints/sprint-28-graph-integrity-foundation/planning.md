# Sprint 28 — Graph-Integrity Foundation — Planning

**Requirements:** [requirements.md](./requirements.md). **Design:** architect ref-slot registry 05da0584a / slot inventory 76c3a102b.

## Sprint Goal

Make the graph-integrity INSTRUMENT honest (R27.5 registry+calibration) then repair the DEBT it surfaces (R27.6 true-dangling). Foundational; planner builds T27.5/T27.6 on Tron's go.

## Use Cases

| Anchor | UseCase | UC UUID | Covers | Class |
|--------|---------|---------|--------|-------|
| <a id="uc27-5"></a>UC27.5 | traceAudit.refSlotRegistry | 5ff15c57-503c-45f7-a4c0-82f7969d3646 | R27.5 | trace-audit/RefSlotRegistry |
| <a id="uc27-6"></a>UC27.6 | graph.repairTrueDangling | a07def59-1e57-40bc-9b92-7c64b1229516 | R27.6 | GraphIntegrity |

## Definition of Done

- Registry imported by every migration+audit; token false-positives excluded; orphan/dangling metrics honest (R27.5).
- Method.implementation/Test.parent/Test.verifies/Test.methods dangling all = 0, gated + verified (R27.6).

---

*Planned by robbin-req 2026-07-01. Sprint 28 — Graph-Integrity Foundation.*
