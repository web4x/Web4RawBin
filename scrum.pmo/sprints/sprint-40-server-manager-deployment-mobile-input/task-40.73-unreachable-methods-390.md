<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.73: 3 unreachable methods — in no Class.methods[], invisible in the tree, user cannot navigate to them @390

[task:uuid:0137dd13-f4e3-4fc2-8373-00fc19f617cd]

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

STOOD UP Planned (PO delivery-first, covers R40.73 04dc74bd, user-visible-regression served v0.8.150). Role flow: architect confirm-root (3 methods no Class.methods[]) -> expert wire forward edge / surface -> tester @390 screenshot-gate. UC full-uuid ba6edc39-4c82-4a0f-8ab0-948eb00150d6 verified from R40.73.useCases[]. Minted SERVED tree; ⚠ R40.73 chain main/local-only -> req reverse-wires 04dc74bd.tasks[]. NOT pushed (Tron push-hold). 0 Done till Tron.

## Task Description

USER-VISIBLE DEFECT (prod sweep, served v0.8.150; covers R40.73). REPRO @390: 3 Method units are in NO Class.methods[] array -> INVISIBLE in the tree -> a user cannot navigate to them from their Class at all (no chain path exists to render them under). MEASURED (req reproduced architect): exactly 3 unreachable. SURFACE: the navigation face of the forward-edge model (R37.32) — a Method not forward-referenced by any Class has no path. FIX-APPROACH: surface every Method under a reachable Class (wire the missing forward Class.methods[] edge for the 3, or render an explicit 'no class path' surfacing) — a method with a shipped impl is never silently invisible. Reuse the forward Class->methods edge + tree render, NO fork.

## Context

Covers R40.73 04dc74bd (UC ba6edc39). Navigation face of the traceability-integrity family (R37.29 referential / R37.32 forward-authoritative). Delivery-first (Law 2): user-visible @390 defect, screenshot-checkable.

## Intention

Every method is reachable by navigation @390 — expanding its Class shows it; a method with a shipped impl is never invisible.

## Acceptance Criteria

- [ ] @390 METHOD-UNDER-CLASS: every Method is reachable by navigation — expanding its Class shows it in the methods list. Screenshot: the 3 currently-orphaned methods appear under a Class, not nowhere.
- [ ] MEASURABLE: count of Method units in no Class.methods[] (baseline 3) is 0; a method with a shipped impl but no Class path is surfaced, never silently invisible.

## Subtasks

None (atomic task).
