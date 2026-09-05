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

- [ ] ONE FORMATTER, SINGLE-SOURCE: a single formatHumanReadableSize(bytes) -> B/kB/MB/GB/TB living in ONE place; if a size-formatting helper already exists, EXTEND it, do not add a second.
- [ ] BOTH SUNBURST CALL SITES render via THIS formatter: LEGEND (per-file size) AND CENTER (total) — neither formats inline/ad-hoc.
- [ ] PRODUCT-WIDE: every other size-render site in the product routes through the same one formatter (Tron: DRY everywhere).
- [ ] FORBID A 2ND (stub-must-fail): a lint/gate scans for raw-byte->human size formatting OUTSIDE the one function -> RED if a second call site/impl exists (scan the HAZARD not the actors); proven able-to-fail on a planted duplicate.
- [ ] @390 TEAM-VERIFIED (rewordProvenance 2026-09-05, customer-not-tester law): WE verify @390 real-WebKit that legend + center show human-readable sizes (not raw bytes) — sizes ARE verifiable by us, 'un-mockable/his-screen' was WRONG; Tron ACCEPTS delivered verified work.

## Subtasks

None (atomic task).
