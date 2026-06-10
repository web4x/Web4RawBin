<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-room-ui-shared: in-room tree REUSES /trace rb-tree + rb-tree-item with Members/Files data adapters

[task:uuid:2195d98f-eb78-47da-9048-e8553d2b8d35]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement architect - rb-tree + rb-tree-item reuse + adapter design
  - [ ] creating test cases
  - [ ] implementing expert rule-pair a+b
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Refinement of T-room-ui ae090710 - 529d5c42 v0.5.129 shipped with an inline ad-hoc tree. Tron directive: REUSE the existing /trace rb-tree + rb-tree-item components for the in-room Members/Files tree. Architect designs data adapters: Members fed from WS feed; Files from unitLinks[] of FileLoader. Expert implements the adapter layer + swaps the inline tree for rb-tree. Singular-chain by design: ONE UseCase per Task; ONE Method per UseCase (per LOCKED 7-step chain; learning #27 strict-verify-bar).

## Subtasks
