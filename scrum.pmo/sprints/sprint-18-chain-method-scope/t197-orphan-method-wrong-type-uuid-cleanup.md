<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Orphan-method + wrong-type-UUID cleanup in Method.implementation chain

[task:uuid:10a52f9f-b74f-42be-bf76-ff75aa3c14d3]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Task Description

Chain-integrity cleanup eliminating two classes of structural defects in the Method→Impl edge of the traceability chain.

Architect pass (8680cea3) stripped 132 wrong-type Task UUIDs that had leaked into Method.implementation fields. These were Task IORs masquerading as Impl IORs — a type-confusion that broke the chain walker's invariant that Method.implementation always points to an Implementation unit, never to a Task. Removing them restores the typed edge required by R18.13 (chain terminates in Test only via valid type-checked steps Method→Impl→Test).

Follow-up pass (ebf11114) fixed 6 orphan methods where UC.method pointed to a method UUID that was not present in UC.class.methods[]. These orphans violated the object model: the chain walker could narrow UC→Method (R18.24) only to find that Method did not belong to the Class on the same chain. The fix re-anchors UC.method to a real entry in UC.class.methods[], restoring R18.16 (Class level holds the narrowed method as one of its own).

Net effect: the Method node in the chain now both belongs to its parent Class and points only to valid Implementation units, eliminating the two known sources of typed-edge breakage on the UC→Class→Method→Impl→Test path.

## QA Audit & User Feedback

2026-06-05 8680cea3 T197 architect: strip 132 wrong-type Task UUIDs from Method.implementation fields
2026-06-05 ebf11114 T197 follow-up: fix 6 orphan methods (UC.method ∉ UC.class.methods[])

## Subtasks

None (atomic task).
