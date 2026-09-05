<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.79: Sunburst center circle shows TOTAL size of all children (human-formatted via the ONE R40.80 formatter)

[task:uuid:d47ec615-251d-4c13-adf7-56a0940bfc03]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned (req R40.79 408bdc6f, Tron folder-detail 2026-09-02). OWNER=EXPERT. UC full-uuid b394dbec-1641-4405-8039-82de4f763ed9 resolved from R40.79.useCases[] on disk (NOT fabricated). verify-owner-first: R40.79.tasks[]=[] (uncovered). ★ DRY: center CONSUMES the R40.80 shared formatter (T40.80 dd2326a2), does NOT re-implement — center+legend agree by construction. Distinct from R37.21 AC-B (arc=bytes); this = center-total render, new. DEPENDS-ON T40.80. Minted LOCAL (push-freeze), not-pushed. req reverse-wires R40.79.tasks[]. PO sequences (formatter T40.80 first). 0 Done till Tron.

## Task Description

Tron folder-detail (owner=EXPERT, screenshot=acceptance @390). Tron: the sunburst CENTER circle displays the TOTAL size of all children, human-formatted. ★ DRY (Tron->PO 2026-09-02): the center renders via the ONE shared formatter (R40.80 T40.80 dd2326a2, UC sunburst.formatHumanReadableSize) — it does NOT define its own format logic, so center and legend agree by construction. Same surface as P4b/P5b (Impl a34f1a68 renderChildSizeSunburst / sunburst.ts). DEPENDS-ON T40.80 (shared formatter must exist first).

## Context

Covers R40.79 408bdc6f (UC b394dbec sunburst.renderCenterTotal). Consumes R40.80 c09a7b9b formatter (T40.80 dd2326a2). crossRef R37.21 P4b (arc=bytes, /api/trace sizes). Owner=expert.

## Intention

Center shows the true total of the children's bytes, formatted the one product-wide way.

## Acceptance Criteria

- [ ] CENTER = TOTAL: the sunburst center circle displays the SUM of all children's sizes (total bytes of the rendered arcs).
- [ ] TOTAL CORRECTNESS: center total == sum of the arc byte-values tied to /api/trace sizes (same on-disk-bytes source as P4b, not childCount); proven with a stub where a wrong sum -> RED.
- [ ] HUMAN-FORMATTED VIA THE SHARED FORMATTER (DRY): the center formats the total through R40.80's ONE formatHumanReadableSize — NOT its own inline logic; center and legend cannot disagree by construction.
- [ ] @390 SCREENSHOT ACCEPTANCE: center shows the human-formatted total on Tron's device surface — un-mockable, his screen is the acceptance.

## Subtasks

None (atomic task).
