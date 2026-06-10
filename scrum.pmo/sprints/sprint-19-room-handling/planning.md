<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 19 Planning — Sprint 19 — Room Handling

## Sprint Goal

Rooms and files become first-class scenario units like every other req/task/method. Click the room name to edit the room config scenario. Visibility = public | by-invite (Apply-flow with an invite-request message carrying the requester's name+uuid, accept→join) | private (password, listed only for owners). Lifecycle = live | persistent (persistent keeps offline members listed-as-offline so no contact is ever lost; persistent becomes default after this sprint, switchable to live in the editor). Members can be added and removed. Room content area has a drop-zone double the size of a tree-overview item view; below it a tree with two nodes — Members (member item views) and Files. Uploaded files are stored in the uuid index as uuid.content + uuid.scenario.json with unitLinks[] symlinks (e.g. into a room folder) — every file is a unique scenario unit.

**Status:** Planned

## Tasks

- [ ] [T-room-unit: Room IS a scenario unit + click-to-edit room editor](./room-unit-as-scenario-and-editor.md)
- [ ] [T-visibility: Room visibility modes (public/by-invite/private)](./room-visibility-modes.md)
- [ ] [T-apply-flow: BY-INVITE Apply button + invite-request messages](./by-invite-apply-flow.md)
- [ ] [T-persistent: LIVE | PERSISTENT mode + offline member retention + member add/remove](./persistent-mode-offline-retention-member-add-remove.md)
- [ ] [T-default-flip: PERSISTENT becomes default after this sprint, switchable to LIVE in room editor](./persistent-default-switchable-in-editor.md)
- [ ] [T-room-ui: double-size drop-zone + Members/Files tree + member item views](./room-ui-dropzone-members-files-tree.md)
- [ ] [T-file-unit: uploaded files become scenario units with uuid.content + uuid.scenario.json + unitLinks](./file-as-scenario-unit-content-meta-symlinks.md)
