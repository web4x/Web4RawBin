<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.6: Shared pan/zoom viewer capability for EVERY embedded format (FUTURE / concept)

[task:uuid:6be9a92d-2c96-4345-abea-003af7793244]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.6 `[requirement:uuid:57225ee8-cb9d-46cc-9af3-0167855999e2]` (conceptOnly + future)
  - concept traceability (NO build chain yet — deferred until Tron authorizes build)
    - facet-ACs (decomposition candidates for the later build-requirements): AC-shared-panzoom-base, AC-all-formats-panzoom, AC-extensible-future-formats, AC-concept-future
    - design docs: DEFERRED (architect shared-viewer-base design authored when Tron authorizes build)

## Task Description

FUTURE / CONCEPT ONLY (Tron 2026-07-20 — do NOT implement now; deferred until Tron authorizes build). Generalize the SVG viewer's pan/zoom (RbPanZoom, src/public/ts/trace/pan-zoom.ts) into ONE SHARED viewer base/mixin so EVERY embedded-format viewer (png/gif/webp/svg/html/'you name it') pans + zooms CONSISTENTLY — a new format viewer INHERITS pan/zoom for free (DRY, same shared-mechanism doctrine as drawer/tree/template/badges). Related to R31.5 on a DIFFERENT axis: R31.5 = layout/positioning of drawer/compartments; R31.6 = the pan/zoom CAPABILITY of whatever viewer sits inside. Acceptance = a coherent CONCEPT, NOT code; each facet decomposes into atomic build-requirements when Tron authorizes implementation.

## Context

The drawer embeds VIEWERS for many content formats; today only the SVG viewer has rich pan/zoom, others reimplement ad-hoc. This concept unifies pan/zoom as a shared capability across all embeddable formats.

## Intention

Tron (2026-07-20): capture the shared-pan/zoom-viewer concept as a FUTURE plan. DO NOT IMPLEMENT — deferred until Tron authorizes build. Covering task (#126) for req R31.6.

## Acceptance Criteria

- [ ] A coherent CONCEPT is captured (req) — a plan, NOT code (facets below are DECOMPOSITION CANDIDATES, not testable ACs yet; no Test-hop until Tron authorizes build).
- [ ] Pan/zoom is established as a SHARED viewer capability: RbPanZoom generalized into ONE shared base/mixin, not reimplemented per format.
- [ ] EVERY embedded-format viewer pans + zooms consistently via that base (png/gif/webp/svg/html/…), not a subset; same gestures/limits across formats.
- [ ] A new embeddable-format viewer INHERITS pan/zoom for free (extensible to future formats, no per-format reimplementation).
- [ ] FUTURE / concept: acceptance is a coherent concept + (when authorized) the architect's shared-viewer-base design, NOT an implementation.

## Subtasks

None (atomic task).
