<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 35.3: Resolved scenarios are POPULATED with the item's information (not empty stubs) [R35.3, build FIRST, same resolver pass]

[task:uuid:6506f2ab-27d6-4331-aa34-926f2190245c]

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

Planned — cluster R35.3 (build FIRST, same ensureViewUnit resolver pass as R35.2; order R35.2/3->R35.4->R35.1). Resolver writes per-type fields at mint time (mirror node display data -> unit model). @390 real-WebKit gate (assert fields non-empty on a populated sample per type) + chain-complete-to-Test on ship.

## Traceability

  - up
    - [Sprint 35 Planning](./planning.md)
    - Requirement R35.3 `[requirement:uuid:b039cd80-0c49-4c78-8701-629dbcac6228]`
  - down
    - None (atomic task)

## Task Description

Each resolved scenario unit is POPULATED with the item's actual data (mirror the node's view data -> unit model fields), not a bare/empty unit. The R35.2 resolver (ensureViewUnit) writes the per-type fields at mint time. Scenario opens a scenario that SHOWS the real info; Edit edits real content. Per-type field-set: Folder {name,kind:folder,location,parent,childCount}; File {name,location:rel,kind:file,sourceFile}; PumlArtifact {name,kind:pumlArtifact,sourceFile,location}; Project {name:RawBin,kind:project,childCount:4}. Trace/modelelement/diagram units already carry info (no change). Same resolver pass as R35.2.

## Acceptance Criteria

- [ ] (functional) Each resolved scenario unit is POPULATED with the item's actual data (name, description, type-specific fields, location/source) - NOT a bare/empty stub. The R35.2 ensureViewUnit resolver writes these at mint time (mirror node display data -> unit model).
- [ ] (functional) Per-type field-set non-empty: Folder = name/kind:'folder'/location/parent/childCount; File = name/location:rel/kind:'file'/sourceFile; PumlArtifact = name/kind:'pumlArtifact'/sourceFile/location; Project = name:'RawBin'/kind:'project'/childCount:4.
- [ ] (functional) Scenario opens a scenario showing the real info; Edit edits real content (not an empty unit).
- [ ] (gate) GATE @390 real-WebKit: the resolved scenario CONTAINS the item's info - assert the type's fields are NON-EMPTY for a populated sample per type.

## Subtasks

None (atomic task).
