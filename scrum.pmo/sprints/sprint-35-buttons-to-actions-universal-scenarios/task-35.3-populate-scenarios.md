<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 35.3: Resolved scenarios are POPULATED with the item's information (not empty stubs) [R35.3, build FIRST, same resolver pass]

[task:uuid:6506f2ab-27d6-4331-aa34-926f2190245c]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

DONE: R35.3 populate per-type fields built (ensureViewUnit resolver writes fields at mint, SAME pass as R35.2; Folder/File/PumlArtifact/Project field-sets) + chain-complete-to-Test (SHARES Impl a09b474d.tests[]=[23a9f9fd,9bc0a109], markerPending=false; Test 9bc0a109 EXPLICITLY = 'R35.2 all-types-resolve + R35.3 fields-populated' -> covers R35.3, verified on disk) + REAL-WEBKIT @390 GREEN DET-3x (v0.8.48, served==HEAD 0.8.50, fields non-empty on populated sample per type). Team-gated -> Done. NOTE: two-tasks-one-gate LEGIT — one resolver Impl does both facets, gate 9bc0a109 asserts both R35.2+R35.3 (verified Test name, not relayed).

## Traceability

  - up
    - [Sprint 35 Planning](./planning.md)
    - Requirement R35.3 `[requirement:uuid:b039cd80-0c49-4c78-8701-629dbcac6228]`
  - down
    - None (atomic task)

## Task Description

Each resolved scenario unit is POPULATED with the item's actual data (mirror the node's view data -> unit model fields), not a bare/empty unit. The R35.2 resolver (ensureViewUnit) writes the per-type fields at mint time. Scenario opens a scenario that SHOWS the real info; Edit edits real content. Per-type field-set: Folder {name,kind:folder,location,parent,childCount}; File {name,location:rel,kind:file,sourceFile}; PumlArtifact {name,kind:pumlArtifact,sourceFile,location}; Project {name:RawBin,kind:project,childCount:4}. Trace/modelelement/diagram units already carry info (no change). Same resolver pass as R35.2.

## Acceptance Criteria

- [x] (functional) Each resolved scenario unit is POPULATED with the item's actual data (name, description, type-specific fields, location/source) - NOT a bare/empty stub. The R35.2 ensureViewUnit resolver writes these at mint time (mirror node display data -> unit model).
- [x] (functional) Per-type field-set non-empty: Folder = name/kind:'folder'/location/parent/childCount; File = name/location:rel/kind:'file'/sourceFile; PumlArtifact = name/kind:'pumlArtifact'/sourceFile/location; Project = name:'RawBin'/kind:'project'/childCount:4.
- [x] (functional) Scenario opens a scenario showing the real info; Edit edits real content (not an empty unit).
- [x] (gate) GATE @390 real-WebKit: the resolved scenario CONTAINS the item's info - assert the type's fields are NON-EMPTY for a populated sample per type.

## Subtasks

None (atomic task).
