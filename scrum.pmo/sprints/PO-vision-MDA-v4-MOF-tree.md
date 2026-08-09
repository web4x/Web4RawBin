# PO-VISION — MDA v4 MOF-layered tree (Tron, 2026-07-30, IMG_4716)

Tron: "i envision a MDA v4 tree with MOF m3, m2, m1, m0 folders … m2 holding the uml profile classes (instances of m3) and m1 projects with ts classes and puml diagrams as code and svg.. having rawbin as project in m1 and dist folder in m0"

## The vision (supersedes the current FLAT model tree)
Current tree = FLAT (Circle/Point/Shape/Id/makeId + a Model-diagram, all one list) = the r32.2-sample DEMO. Tron wants a proper **MOF 4-layer TREE**:
- **M3 folder** = MOF meta-meta model (the top metamodel).
- **M2 folder** = the UML profile classes (UmlClass/UmlInterface/UmlAttribute/UmlMethod/UmlAssociation/...) — INSTANCES OF M3.
- **M1 folder** = PROJECTS (models): **RawBin as an M1 project**, holding its TS classes + PUML diagrams AS CODE (puml text) AND SVG (rendered).
- **M0 folder** = the **dist** folder = runtime instances (compiled/running artifacts).

## Connects to what exists
- R32.1 ModelElement multi-facet instanceOf = the M-levels ALREADY exist in the model (same-UUID across M3/M2/M1). This vision = PRESENT them as M-layer FOLDERS in the tree, not a flat list.
- R33 (backlog: RawBin real multi-file model) = M1's RawBin project = a PIECE of this (the M1 real classes). This vision SUBSUMES + expands R33.
- PUML (R32.7) = the "puml as code" in M1; the SVG diagram (R32.4/6) = the "puml as svg" in M1.

## Scope = big → a NEW SPRINT (Tron authorizes, no auto-increment)
This is the next major MDA arc: MOF-layered tree presentation + RawBin as a REAL M1 project (multi-file, R33) + dist as M0 + puml-code+svg per M1 project. Propose as Sprint 33. Scenario-first: architect designs the MOF-layer tree model + presentation (reuse rb-trace-tree folders, the multi-facet M-levels, R33 real-gen) → req formalizes → build.
