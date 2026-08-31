<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.71: Method/Class detail panel is BARE @390 (no source link / no signature / no description) — derive from impl.sourceFile

[task:uuid:f431c5a4-61a1-47b0-ac92-7ff138c1534c]

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

STOOD UP Planned (PO delivery-first, covers R40.71 b5e4646c, user-visible-regression served v0.8.150). Role flow: architect root-confirm (sourceFile-absent -> renderSourceLink '') -> expert derive-from-impl.sourceFile + signature -> tester @390 screenshot-gate. UC full-uuid b9d8950e-c54b-4e9a-8e44-60e1d77459fb verified from R40.71.useCases[]. Minted SERVED tree; ⚠ R40.71 chain main/local-only -> req reverse-wires b5e4646c.tasks[]. NOT pushed (Tron push-hold). 0 Done till Tron.

## Task Description

USER-VISIBLE DEFECT (prod sweep, served v0.8.150; covers R40.71). REPRO @390: a user clicks a Method (or Class) in /trace or /model and the detail panel opens BARE — red 'Method' badge + name + uuid, but NO source-file link, NO signature line, NO description body, empty sections = nothing to act on. MEASURED (req reproduced architect): 344/657 Method units (52%) + 60/192 Class (31%) have no model.sourceFile. SURFACE (expert): sourceFile absent -> renderSourceLink() returns '' in rb-method-detail (fetchDetailData -> /api/trace/children data.sourceFile). ★ FIX-APPROACH: 328/344 of those methods HAVE an implementation carrying sourceFile (the FORWARD edge, R37.32) -> DERIVE the link + signature from impl.sourceFile; genuinely-source-less remainder marked explicitly, never blank. Reuse rb-method-detail + the forward impl edge, NO fork.

## Context

Covers R40.71 b5e4646c (UC b9d8950e). User-visible face of the traceability-integrity family (R37.29 referential / R37.32 forward-authoritative); authoritative AC = R36.3 d4048137 AC-gate-390 (full signature+docs) + R40.27 81d1928d (Class analog). Delivery-first (Law 2): user-visible @390 defect, screenshot-checkable.

## Intention

A user never sees a bare method/class panel for a unit that has a shipped impl — the source link + full signature + description render, derived from the forward edge.

## Acceptance Criteria

- [ ] @390 SOURCE LINK: opening a LIVE method's detail shows a '📄 <path>:<line>' source link (screenshot present, matching an enriched method); today absent = the defect.
- [ ] @390 FULL SIGNATURE: a live method detail SHOWS the full signature line — visibility name(parameters):returnType — plus docs (R36.3 AC-gate-390, authoritative). Screenshot present. ★ Deriving sourceFile alone (the 📄 link) does NOT satisfy this — the signature must render too.
- [ ] @390 DESCRIPTION BODY: detail shows a description body + populated sections, not just badge+name+uuid. Screenshot: body non-empty for a live method.
- [ ] DERIVE-FROM-IMPL: for the 328/344 methods whose impl carries sourceFile, the link+signature are DERIVED from impl.sourceFile (forward edge) and render — screenshot: such a method shows 📄 path:line + signature.
- [ ] MEASURABLE: count of Method/Class panels rendering with NO source link AND NO description trends to 0 for units with a derivable source; genuinely source-less remainder explicitly marked, not blank.

## Subtasks

None (atomic task).
