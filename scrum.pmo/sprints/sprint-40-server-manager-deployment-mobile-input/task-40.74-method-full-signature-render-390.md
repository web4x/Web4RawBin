<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.74: Method detail full-signature render @390 — visibility name(params):returnType + docs (distinct-kind: parse/enrich signature data FIRST, 0/657 carry it)

[task:uuid:cfe0fc7e-1b1a-4f84-a3b6-0b5f6a02c45b]

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

STOOD UP Planned (PO split from R40.71 cond-2, req minted R40.74 35c9767f). DISTINCT-KIND: needs signature-DATA (parse source decl OR enrich Method field) FIRST — 0/657 carry it — THEN render; NOT the v0.8.151 data-derivation. Role flow: architect design (parse-vs-enrich) -> expert enrich+render -> tester @390 screenshot-gate + stub-must-fail. UC full-uuid 87561c8d-afae-4a3d-8ee4-2d38c1851b83 verified from R40.74.useCases[]. Sibling: T40.71 f431c5a4 (source-link half, cond-1 DELIVERED) — this = cond-2. Minted SERVED; req reverse-wires 35c9767f.tasks[]. LOCAL-only not pushed (Tron push-hold). 0 Done till Tron.

## Task Description

USER-VISIBLE DEFECT (covers R40.74, SPLIT from R40.71 condition-2 per PO 2026-08-31). REPRO @390: opening a method detail shows name + (post v0.8.151) source-link but NO full-signature line (visibility name(parameters):returnType) and no docs — R36.3 AC-gate-390 unmet. ★ DISTINCT KIND (why NOT smuggled into the shipped v0.8.151 source-link fix): source-link = DATA DERIVATION (impl already carries sourceFile). Signature render = a RENDER feature that FIRST needs signature DATA which does NOT exist — MEASURED (req): 0/657 Method units carry a signature/parameters/returnType field -> needs source-signature PARSING or a new enriched field BEFORE anything renders. Different fix path + owner-effort = its own item. Reuse rb-method-detail render + a signature enrich step, NO fork.

## Context

Covers R40.74 35c9767f (UC 87561c8d). Implements R36.3 d4048137 AC-gate-390 (Method SHOWS full signature+docs @390). Split from T40.71 condition-2 (data-derivation vs parse/enrich = different fix path). Delivery-first (Law 2), screenshot-checkable @390.

## Intention

A user @390 sees the method's full signature (visibility name(params):returnType) + docs — backed by real signature data that exists before render.

## Acceptance Criteria

- [ ] **(user-visible@390)** On 390px, a live method detail SHOWS the full signature line: visibility {public|private|protected} name(parameters):returnType. Screenshot: the signature line is present, matching an enriched method.
- [ ] **(user-visible@390)** The detail renders the method docs (oosh-style) below the signature. Screenshot: docs body present, not empty.
- [ ] **(distinct-kind)** The signature DATA exists before render: either parsed from the source declaration or an enriched Method-unit field (visibility/parameters/returnType). Today 0/657 carry it — the render cannot succeed without this step. NOT satisfiable by the sourceFile-derive (which only surfaces the file link).
- [ ] **(provenance)** This is tracked as its own item, NOT closed by the v0.8.151 source-link ship. A board reading v0.8.151 as satisfying the signature render is WRONG.
- [ ] **(gate)** STUB-MUST-FAIL: a method with signature data present but the detail rendering no signature line => RED; renders the line => GREEN.

## Subtasks

None (atomic task).
