<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.10: Traceability tree resolves the correct UC.method in EVERY view — never sibling-fallback when UC.method is set

[task:uuid:e9f5eba2-d64d-485b-8f2c-f94094fd9994]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.10 `[requirement:uuid:797113c5-5824-4d82-899f-89bc04886dff]`
  - down
    - None (atomic task)

## Task Description

The traceability tree MUST resolve a UseCase to its OWN UC.model.method in EVERY view — trace-mode AND non-trace / scenario-mode — and MUST NOT fall back to a sibling method on the same Class when UC.method is set. ROOT (skill-expert audit R31-traceability-audit-RESULT.md, IMG_4647): the server attaches chainMethod from UC.model.method ONLY in queryMode==='trace' (server.ts:1644-1647); the client rb-trace-tree.buildSeedNode renders chainMethod if present, ELSE falls back to fetchAndRenderChildren (the Class's methods) — which surfaces a WRONG sibling (e.g. R31.9 UC drawer.observePosition resolving to R25.4 onGrabBarPointer on the shared Class RbDetailDrawer). This is a CODE fix (architect designs the Class/Method topology + the resolve path), not merely a data-wiring gap: even with UC.method correctly set (as R31.9's IS on disk), non-trace views mis-resolve. Captured per Tron completeness directive (R31-completeness-directive.md) — completeness of the tree resolution across all views.

## Acceptance Criteria

- [x] For a UseCase whose model.method is SET, the traceability tree resolves and displays THAT method (and its chain) in EVERY view — trace-mode AND non-trace / scenario-mode — never a sibling method on the same Class. Acceptance probe: R31.9 UC drawer.observePosition resolves to observePosition (e8097351), NOT onGrabBarPointer (R25.4), in non-trace/scenario views too.
- [x] When UC.method is set, the client tree MUST NOT fall back to the Class's sibling-methods (the fetchAndRenderChildren path); the UC's own method resolution is authoritative in all query modes (the chainMethod attach is not gated to queryMode==='trace' alone). Architect owns the code fix.

## Subtasks

None (atomic task).
