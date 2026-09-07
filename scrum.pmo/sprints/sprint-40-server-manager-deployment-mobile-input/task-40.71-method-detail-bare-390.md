<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.71: Method/Class detail panel is BARE @390 (no source link / no signature / no description) — derive from impl.sourceFile

[task:uuid:f431c5a4-61a1-47b0-ac92-7ff138c1534c]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

IN-PROGRESS, PARTIAL 1-of-4 (PO RESTATE 2026-08-31, board-status lane; I own T40.71 BOARD status, req owns R40.71 REQUIREMENT matrix — SAME language, no drift; append-only-safe). NEVER Done till Tron. MATRIX: (1) method source-link DELIVERED v0.8.151 @390-verified; (2) method full-signature OPEN -> SPLIT to R40.74/T40.74 (render feature/parsed-signature, distinct kind, req minted 35c9767f); (3) ~16 residual no-derivable-impl OPEN -> mark 'source not available'; (4) class OPEN count=78 (60 field-absent + 18 invalid .scenario.json sourceFile -> the 18 = R40.75 0d1394a6 data-defect DEFERRED pending Tron, NO task), class fix BUILT v0.8.152 but NOT restarted = NOT landed. refinement[x]=architect root-confirm. Coordinating wording with req (pinged, matrices must match). Served LOCAL-only not pushed (Tron push-hold). UC b9d8950e verified. 0 Done till Tron.

## Task Description

USER-VISIBLE DEFECT (prod sweep, served v0.8.150; covers R40.71). REPRO @390: a user clicks a Method (or Class) in /trace or /model and the detail panel opens BARE — red 'Method' badge + name + uuid, but NO source-file link, NO signature line, NO description body, empty sections = nothing to act on. MEASURED (req reproduced architect): 344/657 Method units (52%) + 60/192 Class (31%) have no model.sourceFile. SURFACE (expert): sourceFile absent -> renderSourceLink() returns '' in rb-method-detail (fetchDetailData -> /api/trace/children data.sourceFile). ★ FIX-APPROACH: 328/344 of those methods HAVE an implementation carrying sourceFile (the FORWARD edge, R37.32) -> DERIVE the link + signature from impl.sourceFile; genuinely-source-less remainder marked explicitly, never blank. Reuse rb-method-detail + the forward impl edge, NO fork.

## Context

Covers R40.71 b5e4646c (UC b9d8950e). User-visible face of the traceability-integrity family (R37.29 referential / R37.32 forward-authoritative); authoritative AC = R36.3 d4048137 AC-gate-390 (full signature+docs) + R40.27 81d1928d (Class analog). Delivery-first (Law 2): user-visible @390 defect, screenshot-checkable.

## Intention

A user never sees a bare method/class panel for a unit that has a shipped impl — the source link + full signature + description render, derived from the forward edge.

## Acceptance Criteria

- [ ] **(user-visible@390)** On a 390px screen, opening a LIVE method's detail shows a '📄 <path>:<line>' source link — a screenshot shows the link present, matching an already-enriched method's panel. Today it is absent = the defect.
- [ ] **(user-visible@390)** On 390px, a live method detail SHOWS the full signature line — visibility name(parameters):returnType — plus docs, per R36.3 AC-gate-390 (the authoritative AC). A screenshot shows the signature line present, matching an enriched method. Today it is absent (tester rendered @390: no signature/params/returnType/description) = the confirmed defect. NOTE: deriving sourceFile alone (the 📄 link) does NOT satisfy this — the signature must render too.
- [ ] **(user-visible@390)** The detail shows a description body + populated sections, not just badge+name+uuid. Screenshot: the body is non-empty for a live method.
- [ ] **(user-visible@390)** For the 328/344 methods whose implementation carries sourceFile, the link is DERIVED from impl.sourceFile (forward edge) and renders — a user never sees a bare panel for a method that has a shipped impl. Screenshot: such a method shows 📄 path:line.
- [ ] **(measurable)** The count of Method/Class detail panels that render with NO source link AND NO description trends toward 0 for units that have a derivable source; the remaining (genuinely source-less) are explicitly marked, not blank.
- [ ] **(partial-cannot-read-as-done)** R40.71 is satisfied ONLY when ALL FOUR conditions render @390; the v0.8.151 ship delivered 1 of 4 = PARTIAL, NOT done. (1) METHOD source-link — DELIVERED (v0.8.151, derive sourceFile from impl, 328/344, screenshot-verified @390). (2) METHOD full-signature render — OPEN, SPLIT to R40.74 (distinct-kind; 0/657 carry signature data). (3) ~16 residual methods (344 minus 328 derivable) with no impl carrying sourceFile — OPEN, still bare; must be explicitly MARKED, not blank. (4) CLASS detail — OPEN, 78 classes render no source link on served tree (PO-ruled: 60 absent + 18 mis-populated=R40.75); class source-link BUILT-AND-HELD (v0.8.152 committed NOT served); signature=R40.74; 18-data=R40.75. A board that reads the v0.8.151 ship as done is WRONG: 3 of 4 remain. Screenshot each condition @390.

## Subtasks

None (atomic task).
