<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.3: In-room action bar: Add-folder verb+endpoint / remove-from-tree / delete-unit-with-confirm-WARN [R-B]

[task:uuid:8b79efc6-11ca-4e9a-b8df-3a2e015bccaa]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [~] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

In Progress — R-B BUILT v0.8.41 (expert 4e3837ae9, Add-folder endpoint POST /api/model/folder/create + verb; remove/delete RIDE R33.8/R33.9). Impls addFolder 2f65a342 + createFolder 28000b00 strict-AST credited markerPending->false (req 35c89d650, v0.8.42, served==HEAD 0.8.42). @390 real-WebKit gate + chain-complete-to-Test (Test mint) PENDING -> NOT Done.

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.3 `[requirement:uuid:615048d8-4bfb-449a-81e0-41ca460c969a]`
  - down
    - None (atomic task)

## Task Description

R-B. The in-room action bar MUST offer, for the selected item: Add folder (new verb + POST /api/model/folder/create minting an ior:class:Folder unit in MODEL_STORE, then load()+expandPath reveal), Remove (detach node from tree/diagram VIEW only — non-destructive, unit stays), and Delete (destroy the UNIT, gated by a confirm() WARN before the delete endpoint). Distinct verbs = same lifecycle discipline as R33.8/R33.9.

## Acceptance Criteria

- [ ] (functional) 'Add folder' appears on folder/diagram context; POST /api/model/folder/create {parent,name} mints an ior:class:Folder unit in MODEL_STORE (store-only INV, mirrors /api/model/diagram/create), then load()+expandPath reveals it.
- [ ] (functional) 'Remove' detaches the node from its tree/diagram VIEW (view-link removal, non-destructive) - the scenario unit STILL EXISTS.
- [ ] (security) 'Delete' destroys the UNIT, gated by a confirm() WARN ('Delete <name> permanently?') BEFORE the delete endpoint; on confirm the unit is gone.
- [ ] (functional) remove and delete are DISTINCT verbs with distinct labels + distinct semantics (view vs unit), same discipline as R33.8/R33.9.
- [ ] (gate) GATE @390 real-WebKit: add folder -> appears+reveals; remove -> node gone from tree BUT unit still exists; delete -> confirm WARN -> unit gone.

## Subtasks

None (atomic task).
