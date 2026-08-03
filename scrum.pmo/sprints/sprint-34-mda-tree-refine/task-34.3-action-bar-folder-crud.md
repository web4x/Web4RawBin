<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.3: In-room action bar: Add-folder verb+endpoint / remove-from-tree / delete-unit-with-confirm-WARN [R-B]

[task:uuid:8b79efc6-11ca-4e9a-b8df-3a2e015bccaa]

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

Planned — cluster R-B (build after R-C/D2). NEW verb Add-folder (POST /api/model/folder/create, store-only, mirrors diagram/create) + remove-vs-delete lifecycle discipline (R33.8/R33.9). Gate real-WebKit @390 on ship.

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
