<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.1.1: puml/ folder existing-source .puml leaf renders its diagram as SVG in-section (renderPumlSource, R33.6 item-4 consolidation)

[task:uuid:8be6074f-29c9-4566-b710-bf861d9d9799]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

DONE: chain-complete-to-Test (Impl b0c0d27d RbModelElementDetail.renderPumlSource tests[]=[478d8204], strict-AST credit HOLDS markerPending=false 39656aa1d, two-key both-dir) + REAL-WEBKIT @390 self-gated GREEN DET-3x (Test 478d8204 / r3364-puml-source-render-gate.mjs, 4afba208b, Safari 605.1.15 = Tron iPhone engine, served==HEAD 0.8.38). req ACs refined to delivered renderPumlSource scope (efcd0f28e, requirement==impl==gate). Team-gated at Tron real engine -> Done. Tron build-go 068b9f42f.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.1.1 `[requirement:uuid:5333d468-2434-4552-b5f7-e1bdc1d9c716]`
  - down
    - None (atomic task)

## Task Description

R33.1.1 (S33-P1 completion, CONSOLIDATED with R33.6 item-4 per PO dd3fa403b + designAdopted 343938e7e). The puml/ folder's EXISTING-SOURCE .puml leaves render their diagram as SVG in-section: a puml-src folder-leaf mounts rb-modelelement-detail -> renderPumlSource (Impl b0c0d27d) -> GET /md raw text -> POST /api/puml-render (docker plantuml) -> SVG in-section. EXISTING authored .puml ONLY (the R33.5 source half; the /api enumeration is already R33.5 Impl 9eb2c39c); the modelToPuml GENERATED puml-as-code leaf is superseded-by-consolidation (separate future item). Reuse rb-preview.renderPuml + /api/puml-render, NO fork. INV-P1.1-3.

## Acceptance Criteria

- [x] INV-P1.1 (existing-source only): a puml-src FOLDER-leaf itemview (an EXISTING authored .puml under the project's source, the R33.5 source half) renders its diagram as SVG in-section on select/expand. It renders the RAW authored .puml text, NEVER R32.7 modelToPuml model-generated puml. Absent source -> no section.
- [x] INV-P1.2 (render reuse, no fork): the SVG comes from the SAME /api/puml-render + rb-preview.renderPuml path as the /md preview - identical output, no second renderer. GET /md/<relpath>.puml (raw text/plain) -> POST /api/puml-render -> SVG.
- [x] INV-P1.3 (isolation-safe): the render is READ-ONLY - fetch the source .puml then POST to render only; no MODEL_STORE or prod mutation.
- [x] GATE @390 real-WebKit (Test 478d8204, r3364-puml-source-render-gate.mjs, served==HEAD 0.8.38): select a REAL puml-src leaf -> GET /md raw -> POST /api/puml-render (docker plantuml) -> SVG renders in-section (okW>0, nodes>0, PIXEL-sample non-bg); a planted bogus relpath -> NO svg. DET-3x.

## Subtasks

None (atomic task).
