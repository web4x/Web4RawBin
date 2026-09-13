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

- [ ] **(metamodel/complete-3-reps)** Every File model element (UmlClass/UmlAttribute/UmlMethod/UmlAssociation, enumerated from TS) appears in ALL THREE representations — UML M2 + TS M2 + PUML M2. Missing in ANY rep => RED.
- [ ] **(action/diagram-complete)** The open-diagram action renders EVERY File element (no silent omission) — the derived set from TsToModel, whatever it currently is. A modeled element missing from the diagram => RED.
- [ ] **(metamodel/one-source-gate)** ★ CONSISTENT-BY-CONSTRUCTION: a consistency gate RE-DERIVES the UML+PUML from the TS SOURCE and DIFFS element-for-element; any DRIFT (a hand-maintained divergence between the 3 reps) => RED. One source, others derived — never 3 hand-maintained copies.
- [ ] **(metamodel/not-a-stub)** The derived UmlClass File has ownerIor=Tron + a fully-qualified IOR + REAL members (attributes+methods+associations) — NOT the 0-member stub. A 0-member / null-owner / bare-IOR derived File class => RED.
- [ ] **(mvc/model-purity)** MODEL PURITY: the File model (M2/M1) carries 0 glyph/DOM/format — presentation stays in the VIEWS (puml+diagram). MVC: model=data, puml+diagram=views, actions=controller. A glyph/DOM/format leaking into the model => RED (the inc-2/File.iconGlyph lesson, generalized).
