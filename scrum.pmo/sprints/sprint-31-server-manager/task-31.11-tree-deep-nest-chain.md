<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.11: Traceability tree deep-nests the full chain (UC->Class->Method->Impl->Test) for every sprint

[task:uuid:94c1211c-85bb-4e48-acd4-8fc9334312eb]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.11 `[requirement:uuid:c56b1120-a2d5-4017-916d-02e269c50fd5]`
  - down
    - None (atomic task)

## Task Description

The traceability TREE must deep-nest the FULL forward chain UC -> Class -> Method -> Impl -> Test as EXPANDABLE tree nodes, each with its type-icon + child-count badge, for EVERY sprint INCLUDING S31 - matching the S30 target (IMG_4702). BUG (IMG_4701): a S31 UC node (e.g. serverManager.ownerGuard, drawer.observePosition) STOPS at the UC in the tree - the Class->Method->Impl->Test chain appears ONLY in the bottom drawer, not as nested tree children; a S30 UC (e.g. traceTree.currentSprintEagerLazy) deep-nests the whole chain as expandable nodes (UC puzzle -> Class RbTraceTree cube badge19 -> Method terminal -> Impl </> -> Test flask green-check). NOT a data-mint gap: the chain DATA is complete and RESOLVES correctly (the drawer proves S31 chains resolve to the right units - R31.10 works). This is a TREE RENDERING / chain-walk difference - the tree deep-nests for S30 UCs but not S31 UCs. Fix in the SHARED rb-trace-tree (fixes ALL sprints by construction, DRY). Route: architect DIAGNOSES the S30-vs-S31 nesting difference (measure file:line - what makes S30 chain nodes render as expandable children while S31's don't) -> req captures this AC -> expert fixes shared rb-trace-tree -> tester gates @390 (expand a S31 Task's UC -> full Class->Method->Impl->Test nests like S30) -> Tron device re-verify. The chain (UC->...->Test) mints/re-points onto the built shared-tree fix per architect diagnosis (data=truth).

## Acceptance Criteria

- [x] In the traceability tree, expanding a UC node deep-nests the FULL forward chain as EXPANDABLE child nodes: UC -> Class -> Method -> Impl -> Test, each an expandable tree node. The tree MUST NOT stop at the UC (the chain is not drawer-only) - the Class/Method/Impl/Test are nested tree children like S30.
- [x] Each chain node renders its TYPE-ICON matching the S30 target (IMG_4702): UC=puzzle, Class=cube, Method=terminal, Impl=</>, Test=flask with a green check when status=pass.
- [x] Each expandable chain node shows its CHILD-COUNT badge (e.g. Class RbTraceTree badge = its method count), matching the S30 target's eager child-count badges.
- [x] The deep-nesting works for EVERY sprint INCLUDING S31 - the fix lives in the SHARED rb-trace-tree (DRY, by-construction all sprints). S31 UCs (serverManager.ownerGuard, drawer.observePosition) deep-nest their full Class->Method->Impl->Test exactly like S30 UCs.
- [x] This is a TREE-RENDERING / chain-walk fix, NOT a unit-mint gap: the chain DATA is already complete and resolves to the CORRECT units (the drawer shows the right full chain for S31; R31.10 sibling-fallback is fixed). No missing units are minted to satisfy R31.11 - the shared tree-walk is fixed to nest what already exists.
- [x] Gated @390: expand a S31 Task's UC (serverManager.ownerGuard AND drawer.observePosition) -> the full Class->Method->Impl->Test nests as expandable icon+badge nodes, matching the S30 target screenshot (IMG_4702, e.g. Task 30.1 traceTree.currentSprintEagerLazy). /trace unregressed. Tron device re-verify (S31 tree looks like the S30 target).

## Subtasks

None (atomic task).
