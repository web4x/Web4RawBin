<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.80: ONE human-readable size formatter (B/kB/MB/GB/TB) — single-source, consumed by sunburst LEGEND and CENTER + product-wide (DRY)

[task:uuid:dd2326a2-a7b7-44d8-93e9-4afe160b20c7]

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

STOOD UP Planned (req R40.80 c09a7b9b, Tron folder-detail 2026-09-02). OWNER=EXPERT (render/format code). UC full-uuid 59a7550f-de7d-4374-95e9-b8977eccd244 resolved from R40.80.useCases[] on disk (NOT fabricated). verify-owner-first: R40.80.tasks[]=[] (uncovered, no double-mint). ★ DRY-SHAPED per Tron's standing law: this is the ONE formatter; T40.79 center-total consumes it. Distinct from R37.21 AC-B (arc=bytes) — this is human-FORMAT, new. Minted LOCAL (push-freeze active, not-pushed). req reverse-wires R40.80.tasks[]. PO sequences priority. 0 Done till Tron.

## Task Description

Tron folder-detail (owner=EXPERT, screenshot=acceptance @390). Tron: sizes render human-readable (B/kB/MB/GB/TB), NOT raw bytes — in the sunburst LEGEND (per-file) AND the CENTER (total). ★ DRY STANDING LAW (Tron->PO 2026-09-02): this is ONE formatter, single-source, used by both call sites AND wherever a size renders anywhere else in the product. If two call sites can ever disagree about how 10916416 renders, we have already failed. UC=sunburst.formatHumanReadableSize IS the shared formatter; R40.79 center-total (T40.79) CONSUMES it, does NOT define its own. Same surface as P4b/P5b (Impl a34f1a68 renderChildSizeSunburst / sunburst.ts). NO new formatter if one already exists to extend.

## Context

Covers R40.80 c09a7b9b (UC 59a7550f sunburst.formatHumanReadableSize). Sibling: R40.79 408bdc6f center-total (T40.79 d47ec615) consumes THIS. crossRef R37.21 (P4b/P5b arc=bytes surface). Owner=expert. [[generic-behavior-in-shared-component]] + [[scan-the-hazard-not-the-actors]].

## Intention

One size-formatting verb for the whole product; two call sites can never disagree on how a byte count renders.

## Acceptance Criteria

- [ ] **(user-visible@390)** WE verify @390 real-WebKit: the legend shows human-readable sizes, NOT raw bytes — 10916416 renders as '10.9 MB', 43 as '43 B', 4717922 as '4.7 MB', 1 as '1 B' (his exact values, human-formatted). Sizes ARE verifiable by us @390 real-WebKit (the 'un-mockable/his-screen' framing was WRONG); Tron accepts.
- [ ] **(format)** The format is SI (1000-based): 1 kB=1000 B, 1 MB=1e6 B, GB=1e9, TB=1e12; 1 decimal for kB+, integer for B. Derived from Tron's own 10916416->10.9 MB example. Rounding is stated so OUR @390 real-WebKit verification is unambiguous.
- [ ] **(consistency)** The same human format applies to BOTH the legend AND the centre total (R40.79) — no surface shows raw bytes. WE verify @390 real-WebKit: neither the legend nor the centre shows a raw byte count.
- [ ] **(DRY/failable-R40.54)** DRY (Tron standing law): ONE size formatter renders the human-readable size EVERYWHERE — the sunburst CENTRE total (R40.79), the LEGEND per-file sizes, and ANY size rendered elsewhere in the product. NOT one formatter for the centre and another for the legend. If two call sites can EVER disagree about how 10916416 renders, we have failed => a second size-format impl => RED. Check-before-create: extend the existing formatter if one exists, do not add a rival.

## Subtasks

None (atomic task).
