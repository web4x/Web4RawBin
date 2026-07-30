<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 33 Planning — Sprint 33 — MDA v4 MOF-layered tree

## Sprint Goal

Present the MDA model as a proper MOF 4-layer TREE (M3/M2/M1/M0 folders) instead of the current FLAT r32.2-demo list (Tron IMG_4716). M3 = MOF meta-meta model; M2 = UML profile classes (UmlClass/UmlInterface/UmlAttribute/... — instances of M3); M1 = PROJECTS (RawBin as a REAL M1 project — its TS classes + PUML as code AND as SVG); M0 = dist folder (runtime instances). Builds on R32.1 ModelElement multi-facet instanceOf (same-UUID across M-levels ALREADY exist — present them as folders, not a flat list). Subsumes + expands R33 (RawBin real multi-file model = M1's RawBin project). PHASED (architect-assessed, Tron go): P1 present M2+M1 MOF folders (low-risk reuse of rb-trace-tree folders + multi-facet M-levels); P2 RawBin real M1 multi-file (subsumes R33 backlog); P3 M3 + M0/dist. Scenario-first: architect designs the MOF-layer tree model + presentation → req formalizes → build.

**Status:** Planned

## Tasks

- [x] [Task 33.1: MOF-layered model tree: /model presents M2·UML Profile + M1·Projects folders (P1)](./task-33.1-mof-layered-tree.md)
- [x] [Task 33.2: MOF tree bounded/lazy render + file-dir sub-grouping (@390 perf)](./task-33.2-bounded-lazy-render.md)
- [x] [Task 33.3: Working interactive diagram: DnD -> selectable MOVABLE SVG class boxes (S33 RE-SCOPE)](./task-33.3-interactive-diagram.md)
