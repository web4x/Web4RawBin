<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.1: MOF-layered model tree: /model presents M2·UML Profile + M1·Projects folders (P1)

[task:uuid:6027e554-3041-47a8-ab0b-7d8f0e76adba]

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
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.1 `[requirement:uuid:e347e82b-20e9-44ac-9f4d-0257f31e3b1b]`
  - down
    - None (atomic task)

## Task Description

Sprint 33 P1 (Tron-authorized, PO-vision 76517908d; architect design 4d9ec3914): present the /model tree as a MOF layered structure (M3/M2/M1/M0) instead of a flat list. P1 = the M2 + M1 folder presentation (DRIVE NOW). MEASURE-FIRST: the M-levels ALREADY exist as DATA in MODEL_STORE (census by model.metaLevel: M3=2, M2=18, M1=12 + Diagram) and R32.1 multi-facet instanceOf already links M1->M2 - so P1 is a PRESENTATION problem, NOT a data build. The /api/model/tree groups the store units by metaLevel into folder roots: 'M2 · UML Profile' (18 metaclasses -> each -> its M1 instances via reverse instanceOf) + 'M1 · Projects' (project -> classes/interfaces/functions -> members + a PUML(code) node R32.7 + a Diagram(svg) node R32.4/6). REUSE rb-trace-tree folders/collections + lazy-expand + the metaLevel data + R32.7 puml + R32.4/6 diagram + MODEL_STORE (R32.5) - NO fork; NEW = the /api/model/tree group-by-metaLevel restructure + project grouping + M-layer icons. P2 (RawBin real multi-file M1, SUBSUMES the R33 backlog) + P3 (M3 + M0/dist) are phased forward (designed after P1 ships). Server change -> real restart.

## Acceptance Criteria

- [x] INV-MOF1 - the /model tree ROOT is MOF-layer FOLDERS (P1: 'M2 · UML Profile' + 'M1 · Projects'), each expanding to its layer's units grouped by model.metaLevel - NOT a flat list.
- [x] INV-MOF2 - 'M2 · UML Profile' folder -> the 18 M2 metaclasses (UmlClass, UmlInterface, UmlMethod, UmlAttribute, UmlAssociation, UmlGeneralization, UmlDependency, UmlFunction, UmlType, + ts/puml *-code facets); each metaclass -> its M1 instances via the REVERSE multi-facet instanceOf (real R32.1 data, not synthetic).
- [x] 'M1 · Projects' folder -> project node(s) (P1: a synthetic project grouping the M1 ModelElements by common sourceFile; a real ior:class:Project unit in P2) -> class/interface/function children -> members (existing) + a PUML(code) node (R32.7 modelToPuml) + a Diagram(svg) node (R32.4/6 boxes+edges, the existing Diagram unit).
- [x] INV-MOF3 - a class shown under BOTH 'M2 · UmlClass' (as an instance) AND 'M1 · Projects' (as a project class) is the SAME uuid via two nav paths - one unit, NO duplicate (R32.1 same-UUID law; tree ref-nav = navigation != duplication).
- [x] INV-MOF4 - the tree reads MODEL_STORE only; prod scenario/index is untouched (git-clean); /model stays membership-gated (R32.9 requireFeatureAccess 403 for non-member).
- [x] REUSE rb-trace-tree folders/collections + N-level lazy-expand + the metaLevel data (R32.1) + R32.7 puml + R32.4/6 diagram + MODEL_STORE (R32.5) - NO client fork. The ONLY new code is the /api/model/tree group-by-metaLevel restructure + project grouping + M-layer icons (📦/📁).
- [x] GATE @390 the FOLDER STRUCTURE + cross-level nav (Tron viewport): the /model tree shows the M2 + M1 folders; expand M2 -> metaclasses -> M1 instances; expand M1 -> project -> classes -> members + PUML(code) + Diagram(svg); a class under both M2-instance and M1-project = same uuid no dup; prod git-clean; /model 403 non-member - NOT just 'the page loads'.

## Subtasks

None (atomic task).
