<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Complete M2 metamodel of File (UML+TS+PUML, consistent-by-construction) + 'open diagram' action on class File

[task:uuid:43a1f664-a7c1-475a-8d8b-25306041b9ff]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned + CURRENT (Tron order). Architect designs the M2-metamodel shape (UML+TS+PUML one-source); robbin-req folds the on-disk note + mints the missing model elements; expert builds File.openDiagram + the derivation; PLANNER boards it CURRENT. ★ ZERO-MIGRATION: file-unit.ts untouched. T41.2 Folder BLOCKED until Tron QA-approves File.

## Task Description

Tron order (CURRENT): File is not fully modeled — where are its UmlClass attributes/interfaces/relationships? Complete the M2 metamodel of File in 3 consistent-by-construction representations (UML M2 + TS M2 + PUML M2, one source others derived, MVC) + add an 'open diagram' action on class File (file.ts) rendering EVERYTHING modeled. ZERO-MIGRATION: leave file-unit.ts alone. Architect designing the metamodel shape now (fold on-disk note).

## Intention

The invented modeling overhead becomes VISIBLE + complete, not theoretical; File is completely modeled, not just Class+Methods.

## Acceptance Criteria

- [ ] **(model/complete)** File is COMPLETELY modeled as an M2 metamodel: UmlClass File (13782f0c exists) + ALL its model elements — attributes, interfaces (implements), relationships/associations, methods — as Uml* units. MEASURED gap: File today has Class+Methods only; attributes/interfaces/relationships MISSING. A File model element present in code/data but absent from the metamodel => RED.
- [ ] **(model/one-source)** THREE representations — UML M2 + TS M2 + PUML M2 — are CONSISTENT BY CONSTRUCTION: ONE source, the others DERIVED/proven, NEVER three hand-maintained copies. MVC: model=data, puml+diagram=VIEWS, actions=controller. A 2nd hand-maintained copy (drift-able) => RED.
- [ ] **(action/diagram)** The 'open diagram' action on class File (file.ts) renders a diagram of EVERYTHING modeled for File — UmlClass, interfaces, attributes, methods, relationships — with NO silent omission (every modeled element APPEARS). Ask-the-object: File OWNS the action (File.openDiagram).
- [ ] **(action/ui)** The 'open diagram' action OPENS from the UI (on class File / mof node). Reuse the existing diagram render (rb-diagram-detail), no fork.
- [ ] **(scope/zero-migration)** ★ ZERO-MIGRATION (Tron standing law, 'leave file-unit.ts allone'): src/ts/scenario/file-unit.ts is NOT touched — no collapse, refactor, deletion, or marker change. Build the CLEAN class File (file.ts) + metamodel BESIDE it; coexistence is INTENDED, not debt. A change to file-unit.ts under this task => RED.
