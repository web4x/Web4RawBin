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
- [ ] [T-persistent: Room mode PERSISTENT + offline members + add/remove](./persistent-room-mode.md)
- [ ] [T-default-flip: PERSISTENT becomes default mode after sprint](./persistent-default-mode-flip.md)
- [ ] [T-room-ui: drop-zone + Members/Files tree + member item views](./room-content-ui-layout.md)
- [ ] [T-file-unit: Files become scenario units (uuid.content + scenario.json + unitLinks[])](./file-as-scenario-unit.md)
- [ ] [T-room-ui-shared: in-room tree REUSES /trace rb-tree + rb-tree-item with Members/Files data adapters](./room-ui-shared-rb-tree-reuse-members-files-adapters.md)
- [ ] [T-room-editor: pencil edit icon next to room name opens room config/scenario editor](./room-editor-pencil-icon-config-scenario-editor.md)
- [ ] [T-room-symlink: room.json as symlink to canonical scenario unit + one-shot backfill](./room-symlink-canonical-scenario-unit-backfill.md)
- [ ] [T-room-link-affordance: link next to edit pencil opens canonical Room scenario unit](./room-link-affordance-open-canonical-scenario-unit.md)
- [ ] [T-remove-room-sizes: strip maxMembers/maxPlayers/size config from model+UI+server](./remove-room-sizes-max-members-players-config.md)
- [ ] [T-remove-spectator: strip isSpectator/mode/role/UI/join-flow/server/MSG types](./remove-spectator-mode-role-ui-join-flow-msg-types.md)
- [ ] [T-persistent-retention: ws.close+LEAVE_ROOM branch on room.mode — markDisconnected vs removeMember](./persistent-retention-disconnect-vs-remove-by-mode.md)
- [ ] [T-persistent-dedup: Room.addMember match-by-playerToken reconnect vs reject vs insert](./persistent-dedup-addmember-match-reconnect-reject-insert.md)
- [ ] [T-child-count-badge: child-count number badge on tree items](./child-count-badge-tree-items.md)
- [ ] [T-icon-only-drag: drag uses icon-only ghost image](./icon-only-drag-ghost-image.md)
- [ ] [T-icon-tap-collapse: icon tap collapses item to square width](./icon-tap-collapse-square-width.md)
- [ ] [T-one-layer-prefetch: server childCount + client prefetchCache + 3 non-recursive triggers](./one-layer-prefetch-childcount-cache-triggers.md)
- [ ] [T-tree-owns-badges-prefetch: Tree owns computeBadges/prefetchLayer/prefetchVisibleLayer + TRACE_FWD plural-field fix](./tree-owns-badges-prefetch-trace-fwd-plural-fix.md)
- [ ] [T-share-link-offline: sw.js cacheFirst ignoreSearch for /app?join=<uuid> offline navigation](./share-link-offline-sw-cachefirst-ignoresearch.md)
- [ ] [T-sticky-drawer-close: sticky close button on detail drawer](./sticky-drawer-close-button.md)
- [ ] [T-singular-chain-detail: detail view shows singular chain per UC not Class.methods[] fan-out (R18.24 regression)](./singular-chain-detail-per-uc-not-class-methods-fanout.md)
