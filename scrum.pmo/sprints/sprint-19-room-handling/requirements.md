<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 19 Requirements — Room Handling

## Requirements

- [ ] **R19.1 — R19.1: A room is a scenario unit like every other (req/task/method) with a unique v4 uuid, the same {ior, model, ownerIor} shape, and a test of the json.**
  [requirement:uuid:3e14d73c-1ddb-4f42-8d33-481581a8ec95]
  > TRON: "a room is a scenario like every other req, task, method … scenario. unique uuid and same scenario model and test of the json."
  Tron literal: "a room is a scenario like every other req, task, method … scenario. unique uuid and same scenario model and test of the json."
  -> room.bootstrapAsUnit [uc:uuid:745f233a-d38e-4805-9d80-865b7959d39d]

- [ ] **R19.2 — R19.2: Clicking the room name opens the room config scenario for editing (room editor).**
  [requirement:uuid:18ecdab4-e8d1-453f-89b2-4cae64103a80]
  > TRON: "in a room you can click on the room name and edit the room config scenario."
  Tron literal: "in a room you can click on the room name and edit the room config scenario."
  -> room.editConfig [uc:uuid:5de1b235-c32b-4b14-95e3-e770fa5a6f05]
  -> room.bootstrapAsUnit [uc:uuid:745f233a-d38e-4805-9d80-865b7959d39d]

- [ ] **R19.3 — R19.3: Room visibility is one of three modes: PUBLIC, BY-INVITE, or PRIVATE (password-protected).**
  [requirement:uuid:1f1849b5-b47a-4018-8bb1-cd9690884930]
  > TRON: "rooms can be public, by invite or with private password."
  Tron literal: "rooms can be public, by invite or with private password."
  -> room.enforceVisibility [uc:uuid:018ff1e4-f105-49e6-ab63-c28f193133e0]

- [ ] **R19.4 — R19.4: PRIVATE rooms are listed only for their owners.**
  [requirement:uuid:bcaa8cda-6ac6-4606-8443-8dd8ed80e673]
  > TRON: "private rooms are only listed for owners."
  Tron literal: "private rooms are only listed for owners."
  -> room.enforceVisibility [uc:uuid:018ff1e4-f105-49e6-ab63-c28f193133e0]

- [ ] **R19.5 — R19.5: BY-INVITE rooms show an 'Apply' button instead of a join button; clicking it posts an invite-request message into the room with the requester's name and uuid, and an owner accepting that message joins the requester.**
  [requirement:uuid:97bb40eb-638f-463b-b66d-e601cc0802c1]
  > TRON: "by invite rooms send a invite request as a message into the room with the requesters name and uuid. the show not a join button like public rooms but an „Apply" button. the message can be accepted and they join."
  Tron literal: "by invite rooms send a invite request as a message into the room with the requesters name and uuid. the show not a join button like public rooms but an „Apply" button. the message can be accepted and they join."
  -> room.applyAndAccept [uc:uuid:39734975-1169-433d-b243-08129ce49f7e]

- [ ] **R19.6 — R19.6: PUBLIC rooms show a join button (current behaviour preserved).**
  [requirement:uuid:8bd2f61f-d229-4eec-a385-47795c753ca2]
  > TRON: "the show not a join button like public rooms but an „Apply" button." (PUBLIC keeps the join button — current behaviour)
  Derived contrast to R19.5: "not a join button like public rooms" implies PUBLIC keeps its existing join-button affordance.
  -> room.applyAndAccept [uc:uuid:39734975-1169-433d-b243-08129ce49f7e]

- [ ] **R19.7 — R19.7: Each room has a lifecycle mode of either LIVE or PERSISTENT.**
  [requirement:uuid:b6b9c0ab-0f35-4801-b7f0-cd6dc3820f23]
  > TRON: "rooms can be live or persistent."
  Tron literal: "rooms can be live or persistent."
  -> room.maintainPersistentMembers [uc:uuid:2b7b95f1-e3f6-4069-bdf3-2f76da1953b0]

- [ ] **R19.8 — R19.8: PERSISTENT rooms keep every member on the member list even when offline, shown as offline — no contact is ever lost.**
  [requirement:uuid:30dcb1a0-17b9-4fcb-9823-e71a4dc371c9]
  > TRON: "persistent rooms add every one to the members list even if they are offline but show them as offline. but no contact gets ever lost."
  Tron literal: "persistent rooms add every one to the members list even if they are offline but show them as offline. but no contact gets ever lost."
  -> room.maintainPersistentMembers [uc:uuid:2b7b95f1-e3f6-4069-bdf3-2f76da1953b0]
  -> room.retainOnDisconnect [uc:uuid:61e01080-6650-4ff1-ba50-0e2a523a2a35]

- [ ] **R19.9 — R19.9: Members (contacts) can be added to and removed from the room's member list.**
  [requirement:uuid:d6c4604a-339f-4690-8f92-7885dec8def5]
  > TRON: "contacts can be added and temoved from the room member list."
  Tron literal: "contacts can be added and temoved from the room member list."
  -> room.maintainPersistentMembers [uc:uuid:2b7b95f1-e3f6-4069-bdf3-2f76da1953b0]

- [ ] **R19.10 — R19.10: LIVE is the current default lifecycle mode; after this sprint PERSISTENT becomes the default, switchable back to LIVE in the room editor.**
  [requirement:uuid:1350d422-1133-4f04-9f9f-c0b3c4930542]
  > TRON: "live mode is the current default mode. after the sprint persistpis the default mode and it can be switched to live mode in the room editor."
  Tron literal: "live mode is the current default mode. after the sprint persistpis [persistent] the default mode and it can be switched to live mode in the room editor."
  -> room.setDefaultPersistent [uc:uuid:08151f85-c057-4790-9300-5794a76cae6b]

- [ ] **R19.11 — R19.11: The room content area gets a 'drop content here' drop area double the size of a tree-overview item view.**
  [requirement:uuid:61c2661a-fb8a-489a-9d5d-abc4e819cf5d]
  > TRON: "the room content area gets a drop content here area double the size of an item view in the tree overview."
  Tron literal: "the room content area gets a drop content here area double the size of an item view in the tree overview."
  -> roomContent.composeLayout [uc:uuid:3c2daa94-420d-496a-abfc-5a96297d01a4]

- [ ] **R19.12 — R19.12: Below the drop area sits a tree with exactly two nodes: Members and Files.**
  [requirement:uuid:dc2e99eb-8e31-4337-887b-8204f7588c20]
  > TRON: "below there is a tree with two nodes, Members and Files."
  Tron literal: "below there is a tree with two nodes, Members and Files."
  -> roomContent.composeLayout [uc:uuid:3c2daa94-420d-496a-abfc-5a96297d01a4]

- [ ] **R19.13 — R19.13: Members are displayed as item views below the Members node.**
  [requirement:uuid:409ea58b-763b-433e-b17d-0ea156d94355]
  > TRON: "members will be diplayes as item views below the member node."
  Tron literal: "members will be diplayes as item views below the member node."
  -> roomContent.composeLayout [uc:uuid:3c2daa94-420d-496a-abfc-5a96297d01a4]

- [ ] **R19.14 — R19.14: Files uploaded into a room are stored in the uuid index as <uuid>.content plus a <uuid>.scenario.json that references the content and carries unitLinks[] to the ln symlinks in the room folder — every file is a unique scenario unit.**
  [requirement:uuid:f1ca3cc9-a675-4a3b-9898-9e33d7876ed8]
  > TRON: "files get uploaded and are stored in the uuid indes as uuid.content and a uuid.scenario.json with the reference to the content and unitLinks[] references to the ln links eg in the room folder on the filesystem. so every file becomes a unique unit."
  Tron literal: "files get uploaded and are stored in the uuid indes as uuid.content and a uuid.scenario.json with the reference to the content and unitLinks[] references to the ln links eg in the room folder on the filesystem. so every file becomes a unique unit."
  -> file.persistAsUnit [uc:uuid:79871ec1-2280-4556-b56f-3afcdcee64b0]

- [ ] **R19.15 — R19.15: The room scenario json passes the same json test as every other scenario unit.**
  [requirement:uuid:4efd2fb6-d854-4781-a18a-d873fc54d030]
  > TRON: and test of the json
  Tron literal sub-clause split from R19.1 per R-I.
  -> room.validateScenarioShape [uc:uuid:63f4f562-27c3-4d9c-a53a-88cd2577710a]

- [ ] **R19.16 — R19.16: BY-INVITE rooms show an Apply button instead of a join button.**
  [requirement:uuid:e61b4760-fda7-464e-bec2-3056d6e9d93f]
  > TRON: the show not a join button like public rooms but an Apply button
  Tron literal sub-clause split from R19.5 per R-I.
  -> room.applyButton [uc:uuid:5ecb8607-20a7-4268-ab0d-b7d3a7eef82c]

- [ ] **R19.17 — R19.17: Accepting the invite-request message joins the requester to the room.**
  [requirement:uuid:4ca31ded-1376-4fc9-8a5e-0d86e6a9183b]
  > TRON: the message can be accepted and they join
  Tron literal sub-clause split from R19.5 per R-I.
  -> room.acceptInvite [uc:uuid:98ab691d-434f-4342-a828-e7ef18589b45]

- [ ] **R19.18 — R19.18: No contact is ever lost from a room member list.**
  [requirement:uuid:ba3fa399-750a-4201-a93d-923530f88d3d]
  > TRON: but no contact gets ever lost
  Tron literal sub-clause split from R19.8 per R-I.
  -> room.retainOnDisconnect [uc:uuid:61e01080-6650-4ff1-ba50-0e2a523a2a35]

- [ ] **R19.19 — R19.19: The room mode can be switched from PERSISTENT to LIVE in the room editor.**
  [requirement:uuid:c31aaa02-22ce-47f8-bf01-2a2021107257]
  > TRON: it can be switched to live mode in the room editor
  Tron literal sub-clause split from R19.10 per R-I.
  -> room.setDefaultPersistent [uc:uuid:08151f85-c057-4790-9300-5794a76cae6b]

- [ ] **R19.20 — R19.20: The file scenario unit carries unitLinks[] references to its ln links in the room folder on the filesystem.**
  [requirement:uuid:4a9d1728-368e-4b84-ad03-e6497669a098]
  > TRON: and unitLinks[] references to the ln links eg in the room folder on the filesystem
  Tron literal sub-clause split from R19.14 per R-I.
  -> file.unitLinks [uc:uuid:e253fec9-6100-4694-9e32-0a734685eecb]

- [ ] **R19.21 — R19.21: In-room Members/Files tree reuses the trace browser rb-tree + rb-tree-item components.**
  [requirement:uuid:d1391ee3-d08c-4db1-8445-753b4d1c89a3]
  > TRON: "the in room tree should be the same as in the treacability and the items the same as the itmens there!!!"
  The Members/Files tree inside a room MUST be rendered by the SAME rb-tree component used in /trace, and each tree item MUST be rendered by the SAME rb-tree-item component (Lucide icon, speaky name, word-wrap description, drag, tap-to-collapse/expand, > expander). The current inline tree in RoomView (T-room-ui v0.5.129, commit 529d5c42) does not satisfy this — re-implement using the shared components.
  -> room.mountTraceTree [uc:uuid:bfd99ec4-57b4-4de6-a77b-4ab5940e5298]

- [ ] **R19.2.A — R19.2.A: Room name shows a pencil edit icon that opens the room config/scenario editor on click.**
  [requirement:uuid:9311987c-6dcd-4b73-9d9b-74383d6e16b9]
  > TRON (gap): "the app has no room config/scenario editor yet clicking on the room name in the room." + ADDENDUM: "add a pencil like in the browser to see it opens an editor."
  The room name displayed in-room MUST carry a pencil edit icon (same edit affordance as the file browser). Clicking the pencil (or the room name itself per R19.2) opens the room config/scenario editor for the room unit. Refines R19.2 with (1) gap evidence that as of T-room-ui v0.5.129 the click-to-edit room editor is not implemented, and (2) a visual-affordance addendum so the user sees that the name is editable.
  -> room.editConfig [uc:uuid:5de1b235-c32b-4b14-95e3-e770fa5a6f05]

- [ ] **R19.22 — R19.22: Every per-user room.json is a symlink to the canonical Room scenario unit, and the UI shows a link to it next to the edit button.**
  [requirement:uuid:d3416a23-f2f9-4c70-8a47-88e0f93a9aa0]
  > TRON: "data/users/<uuuid>/rooms/<ruuid>/room.json is empty but should be a ln link to a uuid.scenario.json of a room in the index with a link next to the edit button. this should be true for ALL rooms."
  Every data/users/<userUuid>/rooms/<roomUuid>/room.json MUST be a filesystem symlink (ln) to the canonical Room scenario unit at scenario/index/<shard>/<roomUuid>.scenario.json — never a standalone JSON file. The UI MUST also display a link affordance next to the edit pencil button that navigates to the canonical scenario unit. Aligns with the unitLinks pattern from R18.29-R18.31 (lifecycle of unitLinks symlinks) and R19.14 / R19.20 (file scenario units carry unitLinks references to their ln links on the filesystem). Backfill required for existing room.json files that are currently empty or standalone.
  -> room.symlinkCanonical [uc:uuid:4421b0c1-9663-4250-8e1d-ce49ae1a9db3]
  -> room.linkToScenario [uc:uuid:9d3a0ced-7942-48eb-bb37-f66f59ac641a]

- [ ] **R19.22.A — R19.22.A: Every data/users/<u>/rooms/<r>/room.json is a symlink to scenario/index/<shard>/<r>.scenario.json + one-shot backfill.**
  [requirement:uuid:e9618d93-8dbc-44b2-abd7-b1eddebce97d]
  Filesystem invariant: every room.json on disk is a symlink to the canonical Room scenario unit in the index. One-shot backfill converts existing standalone room.json files to symlinks pointing at the canonical scenario unit. After backfill, Room.persist writes to the canonical unit and the symlink resolves transparently.
  -> room.symlinkCanonical [uc:uuid:4421b0c1-9663-4250-8e1d-ce49ae1a9db3]

- [ ] **R19.22.B — R19.22.B: UI link next to the edit pencil button that opens the canonical Room scenario unit.**
  [requirement:uuid:b748b4f1-44dd-480a-8e6c-45d9cb0e5ea3]
  UI affordance: a clickable link (icon or text) adjacent to the room edit pencil button that navigates to the canonical Room scenario unit in the /trace tree or scenario viewer. Enables the user to inspect the room's scenario data directly from the room UI.
  -> room.linkToScenario [uc:uuid:9d3a0ced-7942-48eb-bb37-f66f59ac641a]

- [ ] **R19.23 — R19.23: Remove all room size and capacity limits — rooms are unbounded.**
  [requirement:uuid:17fd9704-5573-4cd0-8bfd-cf7ae303af4e]
  > TRON: "remove all room sizes and the spectator functionality." (room-size clause)
  REMOVE all room size/capacity functionality: maxMembers, maxPlayers, room-size configuration in model/UI/server validation. Rooms have no upper bound on members. Delete every code path that checks, enforces, displays, or configures room capacity.
  -> room.stripSizeLimits [uc:uuid:f68def2b-cb7f-44e5-a7b5-2ffcf898f6ce]

- [ ] **R19.24 — R19.24: Remove spectator functionality entirely.**
  [requirement:uuid:7d6c95ce-c2e5-4119-b74b-c26be7dbafc6]
  > TRON: "remove all room sizes and the spectator functionality." (spectator clause)
  REMOVE all spectator functionality: isSpectator flag, spectator mode/role, spectator join flow, spectator UI elements, spectator-related server logic, spectator message types. Delete every code path that references, checks, or enables spectator mode.
  -> room.stripSpectator [uc:uuid:35fac08e-cccd-4b4b-80fa-9a1f2196f2b1]

- [ ] **R19.8.A — R19.8.A: Persistent rooms flip a leaving member to offline status instead of pruning them from the member list.**
  [requirement:uuid:f3b61367-a470-42a1-87a8-727ebee4beca]
  > PO directive 2026-06-10: persistent rooms must RETAIN members on leave + only toggle online/offline (Royal Jungle bug anchor). Anchored on TRON: "persistent rooms add every one to the members list even if they are offline but show them as offline. but no contact gets ever lost."
  When a member leaves (disconnects, navigates away, or closes the app) a persistent room, the server MUST toggle their status from online to offline — NOT remove (prune) them from the member list. The member row stays visible in the Members tree with an offline indicator. Rejoining flips the status back to online. This is the transition-event contract that R19.8 implies but does not explicitly state: R19.8 describes the steady-state (members shown as offline), R19.8.A makes the leave-event behavior explicit (flip, never prune). Royal Jungle bug anchor.
  -> room.retainOnDisconnect [uc:uuid:61e01080-6650-4ff1-ba50-0e2a523a2a35]

- [ ] **R19.8.B — R19.8.B: Persistent rejoin flips the existing member back to online — never adds a duplicate entry.**
  [requirement:uuid:417918a5-b2ce-45d4-8434-fd67d6abef3f]
  > TRON: "the deduplication of users in the members bar does not work. a user leaves and comes back and is then in twice. should never happen."
  When a member rejoins a persistent room, the server MUST look up the existing member entry by playerToken and flip disconnected→false (online). It MUST NOT add a new member entry. Members are keyed by identity (playerToken) and the member list is always unique by that key. This is the rejoin half of the R19.8.A transition contract: R19.8.A covers leave (online→offline, never prune); R19.8.B covers rejoin (offline→online, never duplicate). The deduplication invariant holds at all times — no user ever appears twice in the members bar.
  -> room.rejoinDedup [uc:uuid:fa121190-54d0-41d6-a332-6aa5d0bc9ce3]

- [ ] **R19.21.A — R19.21.A: Members and Files nodes are rb-object-item folder nodes containing child items, not bespoke section headers.**
  [requirement:uuid:f732d200-601b-46b2-96c4-21c966f38b7c]
  > TRON: "members and folders black on black and basically they shall be themselves items and be treated like folders containing the other items."
  The 'Members' and 'Files' nodes in the in-room tree MUST be THEMSELVES rb-object-item instances of folder/collection type — NOT bespoke section headers with custom styling. They contain member items / file items as expandable/collapsible children (folder semantics, same item model as /trace). This fixes the black-on-black contrast issue (bespoke headers become real items with proper theming) and enforces the R19.21 component-identity constraint at the structural level: every node in the room tree is an rb-object-item, including the two root folders.
  -> room.folderNodeRender [uc:uuid:34c24320-fb22-4985-ab59-20c9e98ed033]

- [ ] **R19.21.B — R19.21.B: Drag preview shows the full item card, not just the icon.**
  [requirement:uuid:f0943631-e165-4b0d-af7a-f748f5c47688]
  > TRON: "the drag preview is just the icon but it should be the full item."
  When dragging an rb-object-item (tree item), the drag image/ghost MUST render the FULL item card (icon + speaky name + word-wrap description) — not just the icon square. Applies to rb-object-item everywhere it appears: /trace browser AND in-room Members/Files tree. This is a component-level fix on rb-object-item's dragstart handler (setDragImage must clone the full item element, not just the icon).
  -> objectItem.dragGhost [uc:uuid:32daf90e-7bcd-40f0-be75-2135c3c5d294]

- [ ] **R19.25 — R19.25: rb-object-item shows a red child-count badge left of the collapse arrow.**
  [requirement:uuid:6ed53825-86ce-4ec7-80d0-ce739e876992]
  > TRON: "add left of the collapse arrow a badge with the amount of children — a red circle/var with the number."
  Every rb-object-item that has children MUST display a badge left of the › expander arrow showing the number of children. The badge is a red circle/oval with the count number inside. Applies globally to rb-object-item everywhere it renders (in-room tree, /trace browser).
  -> objectItem.badge [uc:uuid:41fbdb92-75f3-40e8-a3be-a2abe03a83ec]

- [ ] **R19.26 — R19.26: Drag is only activated when grabbing the icon element, not the whole item row.**
  [requirement:uuid:ad2a7074-d5dd-4076-bcb5-d06ffa0662d9]
  > TRON: "drag is only activated when taking it on the icon."
  rb-object-item drag MUST only initiate when the user grabs the icon element. Dragging from the name, description, or any other part of the item row MUST NOT start a drag. The draggable attribute or mousedown/touchstart handler must be scoped to the icon element only.
  -> objectItem.iconDrag [uc:uuid:2966abcc-5a19-4927-960c-87a7c2bdc88c]

- [ ] **R19.27 — R19.27: Clicking the icon once collapses item width to a perfect square with the icon inside, height unchanged.**
  [requirement:uuid:4603db83-167a-43a2-a06f-1f56167eb34b]
  > TRON: "clicking the icon once shall collapse the width of the item to a perfect square with the icon inside but keep the height."
  When the user clicks/taps the icon of an rb-object-item once, the item MUST collapse its WIDTH to a perfect square (the icon centered inside) while keeping its HEIGHT unchanged. This is a compact/minimized view state toggled by icon-tap. A second tap on the icon restores the full-width layout (icon + name + description visible).
  -> objectItem.squareCollapse [uc:uuid:1f7175d3-3c00-46f1-9bac-22e21f086999]

- [ ] **R19.28 — R19.28: Tree prefetch is one-layer-ahead eager — preload exactly one sublayer beyond visible, non-recursive.**
  [requirement:uuid:e790f0bc-590a-4b32-8df0-bfaa5db2c93c]
  > TRON: "lets focus on the lazy loading. to know the badge and optimize ux experience, we already eager preload exactly one sub layer. and on expand the next sublayer of all shown children… but NOT recursive, just one layer… lazy but eager ahead."
  The tree (rb-tree in /trace and in-room) MUST use a ONE-LAYER-AHEAD eager prefetch strategy: always preload exactly one sublayer beyond what is currently visible so that every shown node's child-count badge (R19.25) is known without the user needing to expand. On expand of a node, eagerly prefetch the NEXT sublayer for ALL now-shown children — exactly one layer deep, NON-recursive. This is lazy loading with one-layer-ahead eager preloading: not fully recursive (which would load the entire tree), but not purely on-demand either (which would show unknown badge counts until clicked).
  -> traceTree.prefetchLayer [uc:uuid:40a60fa9-912b-40d4-9ded-cf2b0f15cd88]

- [ ] **R19.29 — R19.29: Tree owns badge calculation and lazy-eager prefetch as its own methods — items are dumb views the tree drives.**
  [requirement:uuid:a688978b-3151-4384-bb00-2adcc5fe055b]
  > TRON: "increase the quality by more object orientation. the badges calculation and assignment and lazy eager loading must be more a method and behavior of the tree on the items as of the individual items."
  The Tree component (rb-trace-tree) MUST own badge child-count calculation+assignment AND lazy/eager one-layer prefetch as its OWN methods/behavior operating ON its items. rb-object-item becomes a dumb view that the Tree drives — it does not self-calculate badge counts, does not self-trigger prefetch, and does not scatter these concerns across multiple trigger sites. This is an OO quality refactor: badge+prefetch logic moves FROM ad-hoc per-item/per-expand-site INTO Tree.updateBadges() and Tree.prefetchLayer() (or equivalent method names). The current scattered implementation causes a bug where some nodes (e.g. Class RbObjectItem) show badge 0 despite having a visible Method child — count inconsistent because not all trigger sites update correctly. The refactor fixes this by centralizing the source of truth.
  -> traceTree.computeBadges [uc:uuid:8c9d0e1f-2a3b-4c4d-5e6f-7a8b9c0d1e2f]

- [ ] **R19.30 — R19.30: Edit pen (✏️) opens the canonical room scenario unit in EDIT mode.**
  [requirement:uuid:ca351869-b694-491e-ba0f-8c9e9623c4db]
  > TRON (original): "edit pen runs into an empty file…bug."
  > TRON (intention clarification): "chain link works but there is a difference in the requirement intention between the both." — pen = edit, link = view/navigate.
  INTENTION: the edit pen (✏️) opens the room's CANONICAL scenario unit (scenario/index/<shard>/<roomUuid>.scenario.json) in EDIT mode — the Monaco editor with the JSON content editable. Both pen and link resolve to the SAME canonical target (the room scenario unit); the pen opens it for editing, the link opens it for viewing/navigating. BUG (original): pen navigated to data/users/<token>/... (empty/missing per-user file) instead of the canonical unit. FIX: pen href must point to /edit/<canonical-scenario-path>.
  -> room.editCanonical [uc:uuid:3d2c4fd1-0c59-4975-9b09-fcbc618e0857]

- [ ] **R19.31 — R19.31: Chain link (🔗) navigates to VIEW the canonical room scenario unit.**
  [requirement:uuid:836c97f9-0c2a-4974-9a77-d4658296fd2e]
  > TRON (original): "and the room into a 404. bug. either into the room…. or the room editor."
  > TRON (intention clarification): "chain link works but there is a difference in the requirement intention between the both." — link = view/navigate, pen = edit.
  INTENTION: the chain link (🔗) navigates to the room's CANONICAL scenario unit (scenario/index/<shard>/<roomUuid>.scenario.json) in VIEW mode — the scenario detail view or /trace browser showing the unit's data, chain, and children. Both link and pen resolve to the SAME canonical target (the room scenario unit); the link opens it for viewing/navigating, the pen opens it for editing. BUG (original): link navigated to a 404. FIX: link href must point to /md/<canonical-scenario-path> or /trace?uuid=<roomUuid>. If the room unit is not found (deleted/expired), show a 'room not found' message, not a generic 404.
  -> room.linkResolve [uc:uuid:8d5e34cc-8640-4711-a5af-4ccaf4dfea7a]

- [ ] **R19.32 — R19.32: Shared room link loads the app and join flow, never the offline page.**
  [requirement:uuid:1935258b-92a7-4317-b5e4-e8188df53fce]
  > TRON: "sharing seems broken… sending worked, but the url in a browser was ending on the offline page on that url."
  BUG: opening a shared room link (/app?join=<roomUuid>) in a browser lands on the 'RawBin — Offline' page instead of loading the app and triggering the join flow. Sharing (sending the link) works, but the receiving browser shows the offline fallback. FIX: the /app?join=<roomUuid> route MUST be served by the service worker as the app shell (not the offline page), the app MUST parse the ?join= query parameter on load, and MUST initiate the join/apply flow for the referenced room. The SW STATIC_SHELL must include /app or the SPA entry that handles this route.
  -> sw.ignoreSearchNav [uc:uuid:3f49e52e-8be7-40a0-9d9d-ce797c992dfd]

- [ ] **R19.33 — R19.33: Detail drawer close affordance stays sticky in view, never scrolls away.**
  [requirement:uuid:553be449-3bad-4580-9426-11c4ab10e202]
  > TRON: "the details nudge to close scrolls out of the view"
  > TRON (re-confirmed via planner): the (X) close button must STAY ON TOP ALWAYS / sticky above scrolling body (app.css:278/280).
  BUG: the detail drawer's close affordance (nudge handle / X button) scrolls out of view when the user scrolls down in the detail content. FIX: the close affordance MUST be position:sticky or position:fixed relative to the drawer viewport so it remains visible and tappable regardless of content scroll position. Implementation: the (X) close button (app.css:278/280 area) must STAY ON TOP ALWAYS — sticky above the scrolling body. Tron re-confirmed via planner relay 2026-06-11.
  -> detailDrawer.stickyClose [uc:uuid:e03214c1-5154-45ba-a5b0-30c00a305d27]

- [ ] **R19.35 — R19.35: Room scenario unit model holds IOR references to its member units.**
  [requirement:uuid:c99083ba-1b38-474c-88d1-ca4bf5f5a2c7]
  > TRON: "the Room model is lacking member IORs — the model needs to hold IOR references to its members."
  The Room scenario unit's model MUST hold IOR references to its members as a members[] array of ior:instance:<memberUuid> refs (same pattern as tasks[], useCases[]). Members become first-class linked scenario units — traceable and navigable from the Room unit in /trace and the room detail view — not just runtime WebSocket session data. This makes the member list persistent in the scenario graph, surviving server restarts and enabling traceability walks from Room→Member.
  -> room.persistMembers [uc:uuid:f7a2ed01-208f-4678-b9dc-948030fe2d7b]

- [ ] **R19.36 — R19.36: DnD file-upload chain is fully traceable from drop to ln link to room file-tree display.**
  [requirement:uuid:573d5b87-bd20-4eb6-9ec4-87896a6533bb]
  > TRON: "double check all drag and drop requirements and implement a fully tracable chain for dnd file upload from dropping into a room to the ln link to the file content in the room represented in the rooms file tree."
  Dropping a file into the room drop-zone MUST execute a FULLY TRACEABLE chain: (1) drop event fires on the drop-zone → (2) file extracted from DataTransfer → (3) file content stored as <uuid>.content in the scenario index → (4) FileUnit scenario unit created as <uuid>.scenario.json (per R19.14) → (5) ln symlink created from the room's folder to the file unit (unitLinks per R19.20) → (6) the room's file-tree (Members/Files tree, R19.12) updates to show the new file item. Every step in this chain MUST be a traceable scenario operation — no silent side-effects, no unlinked file creation. The chain is: DropEvent → FileUnit.upload (Method) → FileUnit (Class) → Room.files[] updated → tree re-render.
  -> dropZone.uploadFile [uc:uuid:d2ab1540-0799-4b7d-842f-0b1550a2485e]

- [ ] **R19.37 — R19.37: Unknown drop format logs the event to room chat as an extensible dispatcher.**
  [requirement:uuid:46d49877-63c5-438b-9982-6c66a041ee44]
  > TRON: "on unknown drag and drop log what happened into the room chat so that we can add over time multiple drop formats like vcards, mails, href links etc."
  When a drop event carries a format NOT recognized by the current handler registry, the system MUST log the drop event to the room chat with the format details ('Dropped [mimeType]: [name/preview] — no handler yet'). This makes unrecognized drops visible and actionable instead of silently failing. The drop dispatcher is an extensible registry: known formats (file) route to the file-upload chain (R19.36); future formats (vcard, mail, href/links, etc.) plug in via handler registration without modifying the dispatcher core. The dispatcher routes by mimeType/DataTransfer item kind.
  -> dropZone.dispatchUnknown [uc:uuid:95a70f06-ae4e-47e6-86fb-b4ee9685442d]

- [ ] **R19.38 — R19.38: Chat messages are scenario units with ownerIor and a doubly-linked list of next/prev message IORs.**
  [requirement:uuid:2d4fefed-0895-4be3-b153-505dc65eca9a]
  > TRON: "make messages first place scenario units with clear ownerIor and a double linked list of ior to next and previous message"
  Each chat Message MUST be a first-class scenario unit (ior:class:Message) with: ownerIor pointing to the sender User unit, model.nextMessage as an IOR to the next message in thread order, model.prevMessage as an IOR to the previous message. This forms a doubly-linked list of messages navigable in both directions. Messages are stored in the scenario index like every other unit — unique uuid, {ior, model, ownerIor} shape, traceable.
  -> chat.lazyLoad [uc:uuid:52cfbd70-a718-4c38-b689-be6207fb8054]
  -> message.persistAsUnit [uc:uuid:631bac17-31a3-45df-8aab-2ce578c26dcc]

- [ ] **R19.39 — R19.39: A system RawBin User unit owns the DnD debug/log messages.**
  [requirement:uuid:4ed793f1-94a0-4645-b4f5-b8dff74da75c]
  > TRON: "add a RawBin user that owns the debug messages from dnd"
  A dedicated system User scenario unit named 'RawBin' MUST exist as the ownerIor for all system-generated messages — specifically the DnD unknown-drop debug/log messages from R19.37. When the drop dispatcher encounters an unknown format and writes a Message unit to the room chat, that Message's ownerIor points to the RawBin system user (not to any human user). This distinguishes system-generated log messages from user-sent chat messages in the UI and in traceability.
  -> user.ensureSystemOwner [uc:uuid:b7b2b9a7-1788-43cb-b987-1c192be9100d]

- [ ] **R19.40 — R19.40: Room holds lastMessageIor; chat lazy-loads 5 messages at a time walking prevMessage.**
  [requirement:uuid:a0d3791e-a859-4303-b475-b3e525fce114]
  > TRON: "the room obviously needs to have a reference on the last message to lazy load the chat. only load the last 5 messages and continue lazyloading 5, when scrolling hits latest loaded message."
  The Room scenario unit MUST hold a model.lastMessageIor field pointing to the most recent Message unit. The chat UI loads the last 5 messages on open (starting from lastMessageIor, walking prevMessage IORs backward). When the user scrolls up and reaches the oldest-loaded message, the UI lazy-loads the next 5 older messages (continuing to walk prevMessage). This is backward-pagination using the R19.38 doubly-linked list — no separate index or query needed, just IOR traversal.
  -> chat.lazyLoad [uc:uuid:52cfbd70-a718-4c38-b689-be6207fb8054]

- [ ] **R19.41 — R19.41: Server has a configurable log level that gates logging detail at runtime.**
  [requirement:uuid:e0bcf6ec-3b16-483a-bdc9-a22b9ab2495b]
  > TRON: "introduce serverside log level to increase and decrease server log details."
  The server MUST have a configurable LOG LEVEL with standard verbosity tiers (error < warn < info < debug < trace). All server logging (including the file-upload/createFileUnit diligent logging from R19.36) respects the active level — messages below the threshold are suppressed. The level MUST be settable at runtime without server restart (e.g. via admin API endpoint or WS command) AND have a persisted default (env var or config file read at startup). This enables increasing detail for debugging and decreasing for production noise.
  -> server.leveledLog [uc:uuid:06634d4e-d969-45b3-b4ce-5ad43c577bde]

- [ ] **R19.42 — R19.42: Drop-zone has clear onDragEnter/onDragExit visual handlers.**
  [requirement:uuid:9e8b678b-c522-4929-90c3-d710c4893b6a]
  > TRON: "the in room drop zone ux has to be improved… clear onDropEnter / exit handlers."
  The room drop-zone MUST have clear visual feedback on drag interaction: onDragEnter highlights the drop-zone (border glow, background color change, or overlay) indicating a valid drop target; onDragLeave/onDragExit clears the highlight back to default state. The visual state transitions must be clean — no stuck highlights after exit, no flicker on child-element boundary crossing (use dragenter/dragleave counter or pointer tracking).
  -> dropZone.feedbackCycle [uc:uuid:3bfb242c-8de5-4f1d-be49-9ccee674144c]

- [ ] **R19.43 — R19.43: After drop, show an upload status bar with progress.**
  [requirement:uuid:fd822bbe-da7a-4121-bd80-a4ac7d05c744]
  > TRON: "after drop show an upload statusbar"
  After a file is dropped into the room drop-zone, an upload STATUS BAR MUST appear showing upload progress (percentage or indeterminate spinner). The status bar remains visible until the upload completes (success or failure) and then transitions to the result state. This provides immediate visual feedback that the drop was received and work is in progress.
  -> dropZone.feedbackCycle [uc:uuid:3bfb242c-8de5-4f1d-be49-9ccee674144c]

- [ ] **R19.44 — R19.44: Upload success or failure posts a corresponding RawBin system chat message.**
  [requirement:uuid:65151a56-5efa-448c-b790-1a0522532749]
  > TRON: "a upload success or failure with the corresponding system chat messages."
  On upload completion, the system MUST post a RawBin system chat message (ownerIor = RawBin user per R19.39): on success 'Uploaded <filename>' (or equivalent with file icon); on failure 'Upload failed: <filename> — <reason>'. These are Message scenario units (R19.38) written to the room's chat thread, visible to all room members as system-generated entries.
  -> dropZone.feedbackCycle [uc:uuid:3bfb242c-8de5-4f1d-be49-9ccee674144c]

- [ ] **R19.45 — R19.45: Offline page has a red Flush PWA Cache button next to Retry.**
  [requirement:uuid:9b468b6d-37e8-4f4e-879c-dea228b747c5]
  > TRON: "continue to get [offline page] — not in the pwa but in the browser. add next to retry a red flush pwa cache button."
  The offline page ('You're Offline / Retry') MUST display a RED 'Flush PWA Cache' button next to the existing Retry button. Clicking it clears ALL service-worker caches (caches.keys() → caches.delete() for each) AND unregisters then re-registers the service worker, recovering from stale-cache offline state where the SW serves cached 404s or outdated bundles. After flush, the page auto-reloads to attempt a fresh network fetch.
  -> offlinePage.flushCache [uc:uuid:d8872aa3-9f4f-4918-8336-55548dc1c53a]

- [ ] **R19.46 — R19.46: Room file-restore is driven by the scenario's authoritative files[] IOR list, not filesystem symlink scan.**
  [requirement:uuid:124d9eec-0c46-4f45-8640-b7e14618d214]
  > TRON: "now the file is restoring twice. we just need to restore the scenario, as it points to the file."
  Room file restoration on load MUST be driven by the Room scenario unit's authoritative model.files[] IOR references (same pattern as model.members[] per R19.35), NOT by a blind filesystem symlink scan of the room folder (which produces duplicates and orphans). The Room scenario unit holds a files[] array of ior:instance:<fileUuid> refs — one entry per unique FileUnit. Restore iterates files[] and emits one FILE_ADDED per unique file scenario unit. Dedup is by file IOR — if the IOR is already in files[], it is not added again. One upload = ONE FileUnit creation + ONE files[] append. The scenario is the source of truth; symlinks are derived artifacts.
  -> room.restoreFilesFromScenario [uc:uuid:0224263f-4cc3-46e3-9532-66567050a754]
  -> file.dedupByContentHash [uc:uuid:0da815f4-c62f-4295-86a7-26d99cca7415]

- [ ] **R19.47 — R19.47: Identical file content reuses the existing FileUnit UUID and adds another unitLink.**
  [requirement:uuid:89502cba-1085-4bf1-ac97-be9a8ba452cf]
  > TRON: "if the user dropped the same file twice and its identical to an existing content file, then register it NOT as a new UUID, but as the existing UUID and as another unitLink."
  When a user drops a file whose content hash (R19.49) matches an EXISTING FileUnit in the index, the system MUST NOT create a new UUID/scenario unit. Instead it reuses the existing FileUnit's UUID and adds another unitLink (symlink) from the new location to that existing unit. The Room.files[] IOR list (R19.46) is not duplicated — the existing IOR is already there. This is content-addressable dedup: same content = same unit, multiple symlinks.
  -> file.reuseByContentHash [uc:uuid:f0b3cd73-5e0e-4235-9589-018f5f22a369]

- [ ] **R19.48 — R19.48: Different file content with same name registers as a unit version, not a new unit.**
  [requirement:uuid:160039ef-92a5-44d7-af1c-d9b71cdb1be0]
  > TRON: "if its a new file with different size but new name register it as a unit version."
  When a user drops a file whose content hash (R19.49) does NOT match any existing FileUnit but whose name matches an existing file in the room, the system MUST register it as a new VERSION of the existing FileUnit — not as a separate unit. The new content is stored as a new <uuid>.content, and the FileUnit's version[] array (R19.50) gains a new entry {version: N+1, ior: <new-content-ior>}. The FileUnit UUID stays the same; Room.files[] is unchanged. This is version-on-name-collision.
  -> file.versionByName [uc:uuid:5b9193ae-33ce-4b94-80ad-cb32895765f9]

- [ ] **R19.49 — R19.49: Each file scenario unit stores a content hash.**
  [requirement:uuid:49a447cf-f27f-4639-aca7-4ab2b46543fb]
  > TRON: "create a content hash for each file in the file scenario."
  Every FileUnit scenario unit MUST store a model.contentHash field — a cryptographic hash (e.g. SHA-256 hex) of the file's binary content computed at upload time. This hash is the dedup key for R19.47 (identical content reuse) and the difference detector for R19.48 (version-on-name-collision). The hash is immutable for a given content version.
  -> file.storeContentHash [uc:uuid:1dabd60a-0ddd-4b00-8433-152b719a2875]

- [ ] **R19.50 — R19.50: File scenario unit has a version[] array of {version, ior} entries.**
  [requirement:uuid:fe9922f0-e58f-4e26-9d5a-8c65f8b26c60]
  > TRON: "add a version[] with {version,ior}."
  Every FileUnit scenario unit MUST have a model.version[] array. Each entry is {version: <number>, ior: <ior-to-content>} representing one version of the file's content. Version 1 is the initial upload. Subsequent versions (R19.48) append entries with incrementing version numbers. The latest version is the last entry. The current content symlink always points to the latest version's content file.
  -> file.uploadEndpoint [uc:uuid:b7b31a9d-2c0f-4b9d-a5c7-6ac770013e47]

- [ ] **R19.51 — R19.51: Content-hash index at scenario/content/ with symlinks for O(1) dedup lookup on upload.**
  [requirement:uuid:33677612-5507-415c-8abf-1d2e27bc603b]
  > TRON: "under scenarios/content/ add ln links with the name <contenthash>.file.scenario.json to the original files scenario as a content hash index to query on upload."
  A content-hash INDEX directory at scenario/content/ MUST hold symlinks named <contentHash>.file.scenario.json, each pointing to the canonical FileUnit scenario unit that stores that content. On upload: (1) compute content hash (R19.49), (2) look up scenario/content/<hash>.file.scenario.json — if the symlink exists, the file is a duplicate → reuse that FileUnit UUID + add unitLink per R19.47; if not, create the new FileUnit + add the index symlink. This gives O(1) hash-based dedup lookup without scanning the entire index. ADDITIONALLY: the content-index symlink MUST be registered in the canonical File scenario unit's unitLinks[] array (per R18.29-31 unitLinks lifecycle — always-consistent bidirectional). AC: (a) symlink exists at scenario/content/<hash>.file.scenario.json AND (b) that symlink path is listed in the FileUnit's unitLinks[].
  -> file.indexByContentHash [uc:uuid:0eeb1bb1-e0fb-4b0a-a1b0-b27bd2d6b358]

- [ ] **R19.52 — R19.52: Detail drawer is full width — no max-width cap.**
  [requirement:uuid:dceda100-434b-4ef7-9af3-9a69ccfac6b2]
  > PO relay (Tron via planner): drawer must be FULL WIDTH (remove max-width:480px cap, app.css:271).
  The /trace detail drawer MUST be FULL WIDTH — remove the max-width:480px cap (app.css:271 or equivalent). The drawer should expand to fill the available width of its container, not be constrained to a fixed pixel width.
  -> detailDrawer.fullWidth [uc:uuid:61cec7ea-1051-4b6f-8845-eac939d83d10]

- [ ] **R19.53 — R19.53: ONE canonical room location on disk — data/users/<uuid>/rooms/<roomUuid>/, no stray dirs.**
  [requirement:uuid:4c442530-92fb-48b4-81d8-54af2ca9c866]
  > TRON: "rooms directories got a mess on disk. standardize it. ONE place not many. rooms should stay under data/user/rooms."
  All room data MUST live under ONE canonical location: data/users/<user-uuid>/rooms/<room-uuid>/ (with files/ and messages/ subdirs). No room data outside this path. WRONG STRAYS to remove: scenario/rooms/<roomUuid>/ and scenario/sprints.json/rooms/<roomUuid>/. CORRECT (keep): scenario/sprints.md/room/*.md = generated views, these are fine. Two actions: (a) fix the CODE that writes to the stray paths (scenario/rooms/, scenario/sprints.json/rooms/) so all future writes go to the canonical data/users/ location only; (b) one-time MIGRATION of existing stray data into canonical (backup-gated).
  -> room.canonicalDir [uc:uuid:5211afac-5f86-45c9-8f10-714e94079e20]

- [ ] **R19.54 — R19.54: Users become first-class scenario units (ior:class:User) in the scenario index.**
  [requirement:uuid:3544a030-48cf-48f4-a08c-a376fb749f79]
  > TRON: "users and devices still have to be converted to standard first class scenarios."
  Each User MUST be a first-class scenario unit (ior:class:User) stored at scenario/index/<shard>/<userUuid>.scenario.json with the standard {ior, model, ownerIor} shape. model fields mapped from profiles.json: model.name (display name), model.phone, model.url, model.avatar (path), model.avatarCrop, model.secretCode (4-digit auth code for account linking per R18 BR-011), model.profileCommitted (bool), model.sshKeysGenerated (bool), model.sshKeyGeneratedAt (ISO date), model.consolidatedFrom[] (merged account IORs), model.bugReports[] (bug report entries). ownerIor = null (User is a root entity). unitLinks[] = symlinks to per-user data dirs (data/users/<uuid>/). devices[] = IOR refs to Device units (R19.55) owned by this User. rooms[] = IOR refs to Room units the User is a member of. Migration: 145 profiles in profiles.json → 145 User scenario units. Token field becomes the uuid. profiles.json becomes deprecated/derived (regeneratable from scenario units).
  -> user.scenarioUnit [uc:uuid:164a1371-4781-45ca-9153-10000003a0d4]

- [ ] **R19.55 — R19.55: Devices become first-class scenario units (ior:class:Device) in the scenario index.**
  [requirement:uuid:53820063-250e-451e-b395-69948c6eee79]
  > TRON: "users and devices still have to be converted to standard first class scenarios."
  Each Device MUST be a first-class scenario unit (ior:class:Device) stored at scenario/index/<shard>/<deviceUuid>.scenario.json with the standard {ior, model, ownerIor} shape. ownerIor = ior:instance:<userUuid> (the User that owns this device). model fields mapped from devices.json: model.userAgent, model.ip (last known), model.screenSize, model.platform, model.firstSeen (ISO), model.lastSeen (ISO), model.connectionCount (int), model.enrolled (bool), model.devicePublicKey, model.enrolledAt (ISO). unitLinks[] = symlink to User unit (reverse navigation). Migration: 205 devices in devices.json → 205 Device scenario units. deviceId field becomes the uuid. ownerToken → ownerIor = ior:instance:<ownerToken>. devices.json becomes deprecated/derived.
  -> device.scenarioUnit [uc:uuid:7f241b91-9cb1-416d-9b5f-883b1a84b5ff]

- [ ] **R19.56 — R19.56: Cleanup legacy multi-char index shards — migrate to single-char-per-level canonical paths.**
  [requirement:uuid:b8db5c65-9fcf-4866-8f31-15aee864ba5d]
  > TRON: "we need to cleanup the legacy index folder longer than one character."
  scenario/index/ shards MUST be single-char-per-level (5-level: <u0>/<u1>/<u2>/<u3>/<u4>/<uuid>.scenario.json). Legacy multi-char prefix directories (e.g. 01666/, 08e36/, etc.) hold units in the OLD flat sharding scheme. Migrate each unit from the legacy multi-char dir to the canonical single-char shard path, update all symlinks that pointed to the old path, then REMOVE the empty legacy dirs.
  -> index.canonicalShard [uc:uuid:2884c5cd-425e-400b-97a3-8231e542d8cb]

- [ ] **R19.57 — R19.57: Full-width drawer must not cover the top-nav back button — back stays visible and clickable.**
  [requirement:uuid:8b823df5-0ad9-4264-b200-6a7125010654]
  > TRON: "drawer is now full width but back button hidden underneath."
  BUG (regression from R19.52 full-width drawer): the detail drawer now covers/hides the top-nav back button (←). FIX: the back button MUST stay visible and clickable above the drawer at all times. The drawer's z-index or layout must not overlap the top navigation bar. Either the drawer starts below the top-nav, or the top-nav has a higher z-index than the drawer.
  -> pageNav.backButtonVisible [uc:uuid:27d71119-bfae-418b-a99d-a6985c2d7d0e]

- [ ] **R19.58 — R19.58: All 7 type DetailViews show ONE consistent Traceability section with the real chain, not a flat method list.**
  [requirement:uuid:af607390-db30-4b1c-b3ac-21aba612aa60]
  > TRON: "the detail views became very inconsistent. the first 2 still have traceability and all children — good, but the traceability is wrong, its all methods and both are the same. all children is correct, traceability not. in the second 2 we see champagne chain — wtf, how shall a user know what that is — but THAT is the correct traceability. review and consolidate that across all types."
  EVERY type DetailView (all 7: Sprint, Task, Requirement, UseCase, Class, Method, Implementation, Test) MUST show ONE consistent 'Traceability' section containing the REAL singular chain (req→uc→class→method→impl→test) — the content formerly labeled 'Champagne Chain' in some views (renamed to 'Traceability' in source, CR1 1f9324607). The label MUST be user-understandable ('Traceability', NOT 'Champagne Chain' — users don't know what champagne means). RESOLVED (2026-06-15 — by superseding R20.5 + R20.30 + CR1): the former inconsistency (first 2 types showed 'Traceability' with a WRONG flat all-methods list; second 2 showed 'Champagne Chain' with the CORRECT chain content) is FIXED — all 7 types now use the same template, same 'Traceability' label, same correct singular-chain content. Consolidate: every type uses the same template section, same label ('Traceability'), same correct singular-chain content. 'All children' section stays as-is (separate, listing all children). [SUPERSEDED by R20.5 (7734f4e1); kept on disk as history per PO ruling — current reality lives in R20.5.]
  -> detailView.unifiedTraceability [uc:uuid:36fdbba4-58dd-4ab8-a711-d50718f7fc8c]

- [ ] **R19.59 — R19.59: Room construction persist must load persisted members/files/chat BEFORE writing — never wipe existing data.**
  [requirement:uuid:5a181bc4-c0bc-41d0-8cd4-f13431fd4ac4]
  > PO diagnosis (HeartSpace loss): persistent rooms must NOT lose offline-retained members on restart/createRoom — Room must load persisted members/files/chat BEFORE/at construction persist. Bug: construction persist wiped members.
  BUG (HeartSpace loss): Room.createRoom() / construction persist writes a fresh scenario unit that WIPES previously persisted members[], files[], and lastMessageIor. FIX: Room construction MUST load the existing persisted scenario unit FIRST (if it exists), merge any new construction-time fields into the loaded state, THEN persist. The load-before-write order ensures offline-retained members (R19.8/8.A), uploaded files (R19.46), and chat history (R19.40) survive server restart and Room re-creation.
  -> room.loadBeforeWrite [uc:uuid:8dd6e157-c2a6-4031-8252-74334046a545]

- [ ] **R19.60 — R19.60: Pre-existing rooms backfill files[] from on-disk FileUnits so old rooms restore files on join.**
  [requirement:uuid:fd5ab4b4-31c6-40c5-a0b1-6f72f00fd155]
  > PO diagnosis (HeartSpace loss): pre-existing rooms' files[] must be backfilled from on-disk FileUnits so old rooms restore files on join.
  Rooms created BEFORE the Room.files[] IOR pattern (R19.46) may have FileUnit scenario units on disk (in their room folder) but an empty files[] array. On room load/join, the server MUST backfill files[] by scanning for FileUnit symlinks in the room's canonical directory and adding their IORs to files[]. This one-time backfill ensures old rooms restore their files for joining members without requiring manual re-upload.
  -> room.backfillFiles [uc:uuid:5080b8a8-cd1a-4a3f-9d8d-029bb2285a7f]

- [ ] **R19.61 — R19.61: Every scenario type generates both .md and .html view templates with chain-link and edit affordance.**
  [requirement:uuid:9473a0be-d248-4277-80a3-9d9f1560f2cb]
  > TRON: "here we see missing chain links to the scenario and the templates for room md and html have to be created. check that on all types."
  Every scenario type (Room, User, Device, File, Requirement, UseCase, Class, Method, Implementation, Test, Sprint, Task) MUST generate BOTH a .md and .html view template. Each template MUST carry: (a) a chain-link icon (🔗) linking to the scenario unit, and (b) an edit affordance (✏️) linking to edit the scenario unit. BUG: Room .html files currently have NEITHER (missing chain-link + missing edit affordance); .md templates have them. Consistent across ALL types — no type may be missing either template or either affordance.
  -> viewTemplate.registerAllTypes [uc:uuid:06058dca-b2a8-4af5-a75c-400b4aa27a30]

- [ ] **R19.55.A — R19.55.A: Device↔User association modeled like Room↔User — forward IOR array, ownerIor, per-user storage, unitLinks.**
  [requirement:uuid:150333f7-afdf-47a3-833f-4b53c6102eee]
  > TRON: "devices are like rooms associated to users."
  The Device↔User relationship MUST be modeled identically to Room↔User: User scenario unit gets a model.devices[] forward IOR array (like model.rooms[]), Device.ownerIor points to its User unit (back-ref), per-user association uses data/users/<userUuid>/devices/ directory with symlinks to Device scenario units (same pattern as data/users/<uuid>/rooms/), and the symlinks are registered in Device.unitLinks[] (R18.29-31 always-consistent lifecycle). This makes Device association navigable, persistent, and consistent with the Room pattern.
  -> user.deviceAssociation [uc:uuid:490a59e0-6baf-4d1f-a813-a155f61b6d85]

- [ ] **R19.62 — R19.62: Dropping a URL/link into a room creates a url-type scenario unit.**
  [requirement:uuid:4885d7cb-b946-4759-914c-a95d2b249b64]
  > TRON: "dropped a link (Project_Sanctuary_OnePager.html URL) into room — did not work. should create something like a windows url that opens as html"
  When a URL/link is dropped into the room drop-zone (via the R19.37 extensible dispatcher), the system MUST create a url-type FileUnit scenario unit (like a Windows .url or macOS .webloc). The unit stores the href in model.href, the page title in model.name (if extractable), and model.contentType='url'. This extends R19.37's dispatcher with a 'url' handler alongside the existing 'file' handler. The unit is stored in the scenario index and linked to the room via Room.files[] (R19.46).
  -> dropZone.urlDrop [uc:uuid:a7a05f12-b5fd-4f10-af9e-3aa32b7cff04]

- [ ] **R19.63 — R19.63: Clicking a file unit in the room tree shows a preview in the detail drawer.**
  [requirement:uuid:6052570f-4630-4cdf-8270-6ef29eec33df]
  > TRON: "best case viewed in its OWN iframe loading the href = a preview in the detail drawer when the file is clicked. same for images."
  When a user clicks/taps a file item (FileUnit) in the room's Members/Files tree, the detail drawer MUST open and show a PREVIEW of the file content. The preview is rendered by the generic previewer (R19.65) based on content type. This is the file's detail view — the drawer shows the preview above the standard scenario unit metadata.
  -> detailDrawer.renderFilePreview [uc:uuid:e3d1ff70-04ef-4402-b79e-ddad1a9654b7]

- [ ] **R19.64 — R19.64: Preview renders by content type — href in iframe, image as img, SVG in viewer.**
  [requirement:uuid:8d90d7ec-0bce-439f-8180-bed4a182aace]
  > TRON: "best case viewed in its OWN iframe loading the href = a preview in the detail drawer when the file is clicked. same for images."
  The file preview (R19.63) MUST render differently based on content type: href/url → an iframe loading the URL (the page renders inside the drawer); image (png/jpg/gif/webp) → an img element displaying the image; SVG → the existing SVG viewer (fullscreen-capable per R18.34). The preview dispatches by model.contentType or file extension. Each render mode is a handler in the generic previewer (R19.65).
  -> detailView.byTypeRender [uc:uuid:0fe9b0c2-1483-4c60-8f9f-9ab02c927eb2]

- [ ] **R19.65 — R19.65: Generalize SVG viewer into a generic previewer for SVG, images, and href/HTML links.**
  [requirement:uuid:b03701b6-2105-4589-b27d-7db58b62e16c]
  > TRON: "maybe repurpose the existing svg viewer to make it generic — preview images AND href links too."
  The existing SVG fullscreen viewer (R18.34) MUST be generalized into a generic content previewer component that handles multiple content types: SVG (existing behavior), images (png/jpg/gif/webp), and href/HTML links (iframe). The component dispatches by content type to the appropriate renderer. This is the Object.verb pattern: ContentPreviewer.render(unit) where the unit's contentType determines the render strategy. Extensible for future types (pdf, video, etc.).
  -> contentPreviewer.render [uc:uuid:3b6a5ce6-aee6-46f5-af59-23be3b8d9d2b]

- [ ] **R19.66 — R19.66: Room Scenario button opens a Room detail view, not 'Task not found'.**
  [requirement:uuid:e6495d45-6d70-4e10-82d0-fdbe6ce01a0a]
  > TRON: "the in-room scenario button goes here [/scenario route] — that's not useful. at least there must be a detail view for it that then can open the scenario editor."
  BUG: clicking a room's Scenario button navigates to /scenario?ior=<roomUuid> which renders 'Task not found' — the route assumes the IOR is a Task and fails when it resolves to a Room. FIX: the /scenario route MUST resolve the unit by UUID, detect its ior:class type (Room in this case), and render the appropriate DETAIL VIEW for that type. The Room detail view shows the room's scenario data (members, files, chat, config) with an action button to open the scenario editor (per R19.2/R19.2.A). This is a type-dispatch fix on the /scenario route — it must handle ALL scenario types, not just Task.
  -> scenarioView.typeDispatch [uc:uuid:5fd0119f-730c-4e00-b26e-4009d247643d]

- [ ] **R19.67 — R19.67: Room scenario detail shows type 'Room', speaky name, and clickable Scenario.json link — not bare uuid.**
  [requirement:uuid:a99486b6-4c4c-46cb-80e6-607af73e7f7e]
  > TRON: "the in-room link to scenario jumps to scenario view with a uuid in the details view but it should be clickable. shows unknown + bare uuid. make it nicer: Room <room-name> + [Scenario.json](…uuid) clickable."
  The /scenario Room detail view (R19.66) currently shows 'unknown' as type label and renders the uuid bare and repeated without a clickable link. FIX: (1) type label = 'Room' (resolved from ior:class), (2) display the room's speaky NAME (model.name), (3) render a CLICKABLE [Scenario.json](…uuid) link to the scenario unit file — not a bare uuid string. Consistent with how other types (Task, Requirement, etc.) render in /scenario.
  -> detailView.roomScenarioDetail [uc:uuid:744d67f9-c19b-49c5-8c61-d14eb5531394]

- [ ] **R19.68 — R19.68: File access is room-scoped — only room members may read/download a room's files.**
  [requirement:uuid:f7d15a93-56d0-40c3-9634-3abfd98c166f]
  SECURITY: file access (read/download of uploaded FileUnits) MUST be authorized per room membership. Only authenticated members of a room may access that room's files. The server MUST validate that the requesting user's token is in the room's members[] before serving file content. Unauthenticated or non-member requests return 403. This prevents cross-room file leakage and unauthorized access to uploaded content.
  -> fileApi.roomScopedAccess [uc:uuid:85f44adb-ac94-432d-b8cf-b23f3158abfb]

- [ ] **R19.69 — R19.69: Iframe previews of untrusted uploads use sandbox attribute to prevent script execution.**
  [requirement:uuid:d989c0c4-d024-44de-b3e2-ef271c731157]
  SECURITY: when rendering file previews in iframes (R19.64 — href/HTML content loaded via iframe), the iframe MUST carry a sandbox attribute that prevents script execution, form submission, and top-level navigation from the loaded content. Recommended: sandbox='allow-same-origin' (allows CSS/images but blocks scripts). This prevents XSS/phishing from malicious uploaded HTML files or dropped URLs. Applies to the generic previewer (R19.65) iframe render path.
  -> contentPreviewer.iframeSandbox [uc:uuid:570c7fbb-896a-4508-a76f-f6dd022be716]

- [ ] **R19.70 — R19.70: Scenario link navigates to file browser highlighting the scenario.json, not a self-reference.**
  [requirement:uuid:b1aaaa0d-a3ad-43d3-ac09-b67b8d1129ec]
  > TRON (original): "the scenario link in the picture/room detail is a SELF reference but should reference the scenario MONACO EDITOR"
  > TRON (refined): "to be consistent we should link to the browser and highlight the file so that we can then click the pen."
  > TRON (DRY emphasis): "this is how it is done on all other cases — should be consistent and in ONE DRY PLACE."
  The Scenario link in the detail view MUST navigate to the FILE BROWSER (/md/) navigated to and HIGHLIGHTING the <uuid>.scenario.json file — NOT a self-reference (/scenario?ior=self), and NOT directly to Monaco (/edit/). From the highlighted file in the browser, the user clicks the existing PEN icon to open the editor. This reuses the file-browser edit pattern for consistency across the app. The scenario-link affordance MUST be ONE shared DRY implementation reused across ALL detail views (Room, File, User, Device, and all chain types) — not a per-view reimplementation. One function, one template partial, all views consume it.
  -> detailView.scenarioBrowserLink [uc:uuid:f1028183-e45e-4ab0-a6cd-4ebcaee8205c]

- [ ] **R19.71 — R19.71: Room scenario detail lists files[] as children, not 'no children'.**
  [requirement:uuid:91ba9fbd-6482-44bc-ab88-1efc14a04af4]
  > TRON (via PO): room scenario detail shows 'no children' but the room HAS files. Witness: room 440ccc82.
  The Room scenario detail view currently shows 'no children' even when the room has files in Room.files[] (R19.46). FIX: the detail view's children section MUST list the room's files[] IOR refs as child items (FileUnit children). The Room's FORWARD_KEYS for /api/trace/children should include 'files' (alongside 'members') so the trace walker and detail view both resolve Room→FileUnit children.
  -> traceChildren.roomForwardRefs [uc:uuid:985195e3-cf7e-4cca-8597-02ecefcaa22f]

- [ ] **R19.72 — R19.72: Secret-code page has a red 'Remove current ID data' button for full re-enrollment.**
  [requirement:uuid:380dc7c0-0dec-4bc4-b0a0-dafa3552b86b]
  > TRON: "on the page where you have to add the secret code, add a button in red — Remove current ID data — so that if a user has not remembered its generated secret they can start fully over."
  > TRON (extend): "add a danger text explaining the consequences."
  > TRON (scope): "only if its the secret code first time onboarding."
  The secret-code-entry page during FIRST-TIME ONBOARDING (initial device enrollment) MUST display a RED "Remove current ID data" button that wipes all local identity data: generated keypair, token, device data from localStorage, and any local SSH/profile artifacts. After wipe, the user starts fresh from the enrollment flow as a new device. This is the recovery path for a user who has lost/forgotten their generated secret code during initial setup. SCOPE: the button+danger-text are ONLY visible during first-time onboarding (the secret-code-entry step of initial enrollment) — NOT for already-enrolled/established users. A DANGER warning text MUST appear with/before the button explaining the IRREVERSIBLE consequences: wiping permanently loses the current identity/keypair/secret, all rooms+files owned by that identity become inaccessible, and the action cannot be undone. A confirm step (dialog or second-click) is recommended before executing the wipe.
  -> profile.removeLocalIdentity [uc:uuid:1df1d3ce-354f-4ba2-a440-9c0aa7b9c1ac]

- [ ] **R19.73 — R19.73: In-room file click opens ContentPreviewer — image/html/href preview works in room context.**
  [requirement:uuid:02af5fc2-2cc5-4a32-ba6c-1167a0a513d6]
  > TRON (PRIORITY): "prioritize making the image and html/href preview work IN THE ROOM."
  PRIORITY: clicking a file in the IN-ROOM file tree (RoomView Members/Files tree) MUST open the ContentPreviewer (R19.65) in a detail view/drawer within the room context — image renders as img, html/href renders in sandboxed iframe, etc. Currently preview works in /trace detail but NOT on in-room file-click. REUSE the existing ContentPreviewer DRY (same component as /trace, not a reimplementation). The room tree file-click handler must invoke the same preview path that /trace uses.
  -> roomContent.filePreview [uc:uuid:f20d9dff-7eda-4188-a50c-84b7862706d1]

- [ ] **R19.74 — R19.74: text/html file preview renders in a sandboxed iframe, not as raw source.**
  [requirement:uuid:7d80452e-a562-4e1d-91e2-4a1ebf0cea67]
  > TRON (via PO): html preview must RENDER in room — not raw source. Refines R19.64 (preview by type) + R19.73 (in-room preview).
  When previewing a text/html file (uploaded HTML content), the ContentPreviewer MUST render it in a SANDBOXED IFRAME that displays the rendered HTML page — NOT as raw <pre> source text. The iframe carries sandbox='allow-same-origin' per R19.69 (blocks scripts/forms/navigation). This applies both in /trace detail and in-room (R19.73). The content is served via a blob URL or /api/file/<uuid>/content so the iframe loads the actual HTML rendering.
  -> contentPreviewer.htmlSandboxed [uc:uuid:c8e9099b-3ffb-4079-9e7e-35b18db790a9]

- [ ] **R19.75 — R19.75: ContentPreviewer passes auth token in content URL so room members can preview files.**
  [requirement:uuid:b2057a60-71f5-4d6e-96a7-de98b8f18057]
  > TRON (screenshot bug): in-room HTML preview iframe shows 'Forbidden: token required' — preview content URL doesn't pass auth token.
  BUG: in-room HTML/image preview iframe shows 'Forbidden: token required' because the content URL (/api/file/<uuid>/content) does not include the authenticated member's token. R19.68 (room-scoped file auth) correctly rejects unauthenticated requests with 403, but the ContentPreviewer does not pass the token. FIX: the ContentPreviewer MUST include the member's auth token in the content URL (e.g. ?token=<memberToken> query param, or use a session cookie/header that the iframe inherits). Room MEMBERS see the preview; non-members still get 403. This is an interaction bug between R19.68 (auth gate) and R19.64/74 (preview rendering).
  -> contentPreviewer.authToken [uc:uuid:29397b2e-f40e-4a4b-9aa1-d9d1cbbac899]

- [ ] **R19.76 — R19.76: Replace playerToken-in-URL with short-lived preview nonce for file content auth.**
  [requirement:uuid:d99ae5ba-bd0f-46be-ae36-8cdbf3645125]
  SECURITY DEBT (NOT blocking MVP): R19.75 passes playerToken in the content URL query param (?token=) which exposes the long-lived auth credential in server access logs and browser history (same-origin, low but real risk). HARDEN: the server issues a short-lived (60s TTL) preview NONCE on request; the client appends the nonce instead of the playerToken to the content URL. The nonce is single-use or time-limited, scoped to the specific file UUID + room. This eliminates token leakage via URL while preserving R19.68 room-scoped auth.

- [ ] **R19.77 — R19.77: URL file preview shows two buttons — Open in preview (inline iframe) and Open in new tab.**
  [requirement:uuid:32e42144-0d04-49c9-a54d-298a4289c8c4]
  > TRON: "that worked well, but add in this case in the preview two buttons to open the url in preview or as a new tab."
  When previewing a URL-type file unit (.url/.html.url scenario unit per R19.62), the ContentPreviewer MUST show TWO action buttons: (a) 'Open in preview' — renders the URL inline in the sandboxed preview iframe (R19.64/74 iframe path), and (b) 'Open in new tab' — opens the URL in a new browser tab (window.open with target=_blank). This gives the user the choice between inline preview and full-page navigation.
  -> contentPreviewer.urlFileActions [uc:uuid:d35defb1-d6ce-4dc8-952e-5f0b59f9ebcc]

- [ ] **R19.78 — R19.78: Action buttons render ABOVE the filename, not below.**
  [requirement:uuid:684cc684-4369-4246-9b9c-fb2f1679d778]
  > TRON: "add the action buttons above the name."
  The ContentPreviewer action buttons (e.g. 'Open in preview' / 'Open in new tab' per R19.77) MUST render ABOVE the filename/name label, not below it. Layout order top-to-bottom: drawer nudge → action buttons → filename → preview content.
  -> contentPreviewer.buttonsAboveName [uc:uuid:1a61ea80-05cb-48f8-b61c-21b71a68d7cb]

- [ ] **R19.79 — R19.79: Drawer nudge/drag handle visible above action buttons so user knows drawer is resizable.**
  [requirement:uuid:bd35b1c8-469d-45f9-b7b3-c26bdc62eb6e]
  > TRON: "above the action buttons the drawer nudge is missing…otherwise the user does not know he can drag the size."
  The detail drawer MUST show a NUDGE (drag handle / grabber bar) ABOVE the action buttons so the user knows the drawer height is resizable by dragging. Currently the nudge is missing in the preview drawer layout. The nudge is the topmost element: nudge → action buttons → filename → preview content. Relates to R19.33 (sticky close affordance) — the nudge and close button both live in the fixed/sticky top area of the drawer.
  -> drawer.nudgeAboveButtons [uc:uuid:ccbf5736-934f-46ca-9904-7a131f1a3c1e]

- [ ] **R19.80 — R19.80: Drawer can be sized up to 95% of viewport height.**
  [requirement:uuid:034c4842-d21c-4d1f-ae43-d7be70ced589]
  > TRON: "make it possible to size it to 95%."
  The detail drawer MUST be resizable up to 95% of the viewport height (currently capped lower). When the user drags the nudge handle upward, the drawer grows up to max-height: 95vh. This gives near-fullscreen preview space while keeping the top-nav back button visible (R19.57).
  -> drawer.resize95vh [uc:uuid:363920d4-b0f7-47ec-ae17-31b462fd2e8c]

- [ ] **R19.81 — R19.81: Pinch-zoom works in the preview iframe, not just pan.**
  [requirement:uuid:f5e7b9cd-3fb7-41b0-b9b4-fbdb419f234c]
  > TRON: "pan is working well in the iframe but pinch not at all."
  BUG: pan gesture works in the preview iframe but pinch-zoom does nothing. FIX: the preview iframe MUST support pinch-zoom (two-finger zoom on touch devices). This may require touch-action CSS on the iframe or a gesture handler that translates pinch events into CSS transform scale on the iframe content. Both pan AND pinch must work for the preview to be usable on mobile.
  -> contentPreviewer.iframePinchZoom [uc:uuid:988b66cb-44d4-4207-bc90-cb9b7055fa95]

- [ ] **R19.82 — R19.82: Joining a room from lobby must succeed — stale online-status must not block rejoin.**
  [requirement:uuid:14a5a9ca-9800-4131-a811-7ef16cd42290]
  > TRON: "currently i get cannot join room errors from the lobby."
  BUG: 'cannot join room' errors from the lobby. Root cause: after server restart/crash, persisted members have disconnected=false (stale online-status — no live WebSocket backs it). When the same user tries to rejoin, the server sees them as 'already connected' and rejects the join. FIX: on room load (R19.59 load-before-write), reset ALL persisted members' disconnected=true (no live WS exists after restart). On join, if the member already exists in members[], flip disconnected→false (R19.8.B dedup) instead of rejecting. Never reject a join for a member that has no live WS backing their online status.
  -> room.addMemberTakeover [uc:uuid:30059fca-381e-4832-88b0-60a66bef1987]

- [ ] **R19.83 — R19.83: File items in room tree must survive re-render — collapse-to-icon and preview-drawer work like member items.**
  [requirement:uuid:8ba2d9ef-0560-4292-9b56-66552434799d]
  > TRON: "file items not fully working — do not collapse to icons, do not open the preview drawer; member items work fully."
  BUG: file items in the in-room tree do not collapse to icons (R19.27) and do not open the preview drawer (R19.73) — member items work fully. Root cause: re-render destroys file item DOM nodes because there is no this.files[] / renderRoomTreeFiles() mirror of the members pattern (this.members[] / renderRoomTreeMembers()). FIX: file items must be managed with the same lifecycle pattern as member items — a persistent this.files[] array and a renderRoomTreeFiles() method that preserves/updates existing file item nodes on re-render instead of destroying and recreating them. All item interactions (collapse-to-icon, preview-drawer click, drag) must work identically on file items and member items.

- [ ] **R19.84 — R19.84: Drawer nudge DRAG-RESIZES the drawer height, not just swipe-dismiss.**
  [requirement:uuid:0be510a8-fce6-49cb-afa8-d9cf39762d4d]
  > TRON: "do you see the issue with the nudge???" — nudge is a dead handle, dragging does not resize.
  BUG: the drawer nudge handle LOOKS draggable (R19.79) but dragging it does NOT resize the drawer — it only triggers swipe-dismiss. FIX: dragging the nudge handle up/down MUST resize the drawer height (from some minimum up to 95vh per R19.80). This is a real drag-resize interaction, not just a CSS max-height. The nudge touch/mouse handler must track drag delta and update the drawer height in real-time. Swipe-dismiss remains on fast downward swipe; slow drag = resize.
  -> detailDrawer.dragResize [uc:uuid:2bf41a1b-74a2-49bd-ad38-c445e898fe49]

- [ ] **R19.85 — R19.85: Iframe pinch gesture SCALES the preview content, not just pans.**
  [requirement:uuid:e29dcae1-2327-48df-a3c5-41add257c624]
  > TRON: "the pinch does not let me make the content of the preview make smaller in the iframe… only pan works. thats not enough."
  BUG: pinch gesture in the preview iframe only PANS (translates) — it does not SCALE (zoom in/out). Pinch-out must make the content bigger; pinch-IN must make it smaller. FIX: the pinch gesture handler must apply CSS transform: scale() on the iframe content (or the iframe wrapper), not just translate. R19.81 captured the pinch-zoom requirement but the implementation only achieved pan. R19.85 re-asserts: pinch = SCALE, not pan. Both pinch-to-scale AND pan (single-finger drag) must coexist.

- [ ] **R19.86 — R19.86: URL/webitem files clicked in room must open the ContentPreviewer drawer — regression fix.**
  [requirement:uuid:01b055f1-240c-439d-a0ca-d73df56a53e0]
  > TRON: "URL files do NOT open the drawer anymore."
  REGRESSION (~862868bfe): clicking a URL/webitem file item in the in-room file tree no longer opens the ContentPreviewer/detail drawer. Previously worked (R19.73/77). FIX: restore the file-click → drawer-open path for url-type FileUnits. The click handler or event delegation for url/webitem items must invoke the same ContentPreviewer path as image/html files.

- [ ] **R19.87 — R19.87: iOS — all file types must open preview drawer, not just vcard.**
  [requirement:uuid:c639acdf-cf0a-4fa7-b8c2-4afe103fb028]
  > TRON: "on desktop the url drawer works, but especially on iphone it does not — only for the vcard. all others dont open the drawer."
  BUG (iOS-specific): on iPhone, only text/vcard files open the ContentPreviewer/detail drawer. Image, HTML, URL/webitem files do NOT open the drawer on iOS — they work on desktop. Root cause likely: iOS Safari touch event handling differs (click vs touchend delegation, passive listeners, or 300ms tap delay interfering with the file-item click handler). FIX: the file-click → drawer-open path must work on iOS Safari for ALL content types (image, html, url, vcard, etc.), not just vcard. Test on real iPhone Safari + PWA.

- [ ] **R19.88 — R19.88: Every rb-object-item must initialize all interactivity — no partial-init items.**
  [requirement:uuid:26b5f7c1-6a36-4bb2-bcae-cb234533afff]
  > TRON: "on desktop hover shows hand/finger cursor on working files; some items with no visible reason do NOT — and those also do not compact to icon or open the drawer. some kind of initialisation issue on the item. slightly differs mac browser vs ios."
  BUG: some rb-object-item instances fail ALL interactivity together: no pointer/hand cursor on hover, no collapse-to-icon on click, no drawer-open. Other items of the same type work. This is a per-item INITIALIZATION inconsistency — some items miss the event listener attachment / CSS class / interactive setup entirely. Timing-sensitive: slightly differs between Mac browser and iOS. FIX: rb-object-item initialization must be deterministic and complete for EVERY instance — cursor, click handler (collapse + drawer), drag. No item may be left in a partially-initialized state regardless of render timing or platform.

- [ ] **R19.89 — R19.89: Red Remove-Local-Identity button must be on DeviceEnrollDialog, not ProfileEditor.**
  [requirement:uuid:2ad3fd18-6d78-4aa2-8213-36934b0f3504]
  > TRON: "the red button for remove identity must be here (Authorize This Device / secret-code screen)!!! someone put it into the profile editor. thats a bug."
  BUG: the red 'Remove current ID data' button (R19.72, impl 25884b0c) is placed on the WRONG screen — it is in the ProfileEditor (ProfileEditor.ts:68 gate mode) instead of the DeviceEnrollDialog 'Authorize This Device' secret-code screen. FIX: MOVE the button to the DeviceEnrollDialog where a locked-out user (without the secret code) actually needs the escape path. The ProfileEditor is for established users who are already authenticated — the button has no purpose there and is confusing. R19.72 specified 'the secret-code page' which is the DeviceEnrollDialog.

- [ ] **R19.88.A — R19.88.A: Stop destroy+recreate of file items — DIFF/update in place, no innerHTML churn.**
  [requirement:uuid:3785b104-f890-473e-8d76-bee5bf010b84]
  > TRON: "desktop — still inconsistent: some file items render icon-only/dont work, the ones that work can be collapsed."
  R19.88 whenDefined gate did NOT fully fix the partial-init race: re-render still destroys and recreates items via innerHTML='' churn, re-introducing the initialization race per item. FIX: stop destroy+recreate. DIFF/update existing item DOM nodes in place — match by file UUID, update changed properties, add new items, remove deleted items. Never innerHTML='' the container that holds live rb-object-item instances. This is architect option-c: reconcile the DOM like a virtual-DOM diff, preserving existing initialized custom elements.

- [ ] **R19.90 — R19.90: In-room tree REUSES rb-trace-tree component — delete duplicate RoomView tree implementation.**
  [requirement:uuid:20fc59cc-5f92-4c17-b86b-c35b837d0373]
  > TRON: "no improvement on iphone — do a DRY and OOP check."
  DRY + OOP audit result: the in-room tree DUPLICATES the working /trace rb-trace-tree (non-DRY: 2 tree implementations, 2 item-creation paths, 2 collapse handlers; non-OOP: RoomView owns item lifecycle it shouldn't). ROOT FIX: in-room REUSES the existing rb-trace-tree component with a new 'room' mode and a setItems(members, files) API. DELETE the duplicate RoomView renderRoomTree*/diffRenderItems/manual event delegation. rb-trace-tree already handles item init, collapse, drawer-open, drag correctly — reusing it fixes the iOS init race by construction (no more hand-rolled custom-element lifecycle in RoomView). Supersedes the approach in R19.83 (file lifecycle mirror), R19.88 (whenDefined gate), R19.88.A (innerHTML diff) — all were patches on the duplicate impl instead of eliminating the duplication.

- [ ] **R19.91 — R19.91: Remove Local Identity clears ALL browser state and reloads into first-run ProfileEditor.**
  [requirement:uuid:4b4b61c1-6dfd-4fd8-8a68-b4182c1b2e76]
  > TRON: "Remove Local Identity button is now correct, but pressing it must result in removing ALL state from the browser store that brings it here, and start as if it was the first time, then reload into the profile editor again."
  The removeLocalIdentity handler MUST: (1) CLEAR ALL browser state that holds identity — localStorage (token, keypair, device data, name, secret), IndexedDB entries, and any cached identity in SW caches, (2) reset the app to first-run state (no token, no device, no profile), (3) reload the page which opens the ProfileEditor in new-user onboarding mode (as if visiting for the first time). Currently likely a partial clear that leaves residual state preventing a true fresh start.

- [ ] **R19.92a — R19.92a: In-room file items use the same data path as /trace — not bespoke WS feed.**
  [requirement:uuid:71a8954e-a2b6-4b8e-936f-825646aa76aa]
  > TRON: "in the first two pictures the files perfectly work. why not IN the rooms the same way... finally fix the in room file items"
  The /trace traceability browser renders the room's files perfectly (first two pictures). The in-room file tree does NOT. ROOT CAUSE: in-room uses a bespoke WS feed for file items instead of the same scenario-unit data path that /trace uses. FIX: in-room file items MUST use the SAME data path as /trace — load FileUnit scenario units from the scenario index (Room.files[] IOR → fetch unit → render rb-object-item), not a separate WS message feed. This is the DRY principle from R19.90 applied to the DATA layer, not just the component layer.

- [ ] **R19.93 — R19.93: File detail view has a Preview button to open the ContentPreviewer.**
  [requirement:uuid:36becf02-fd36-4a10-9b11-1bd42f832a10]
  > TRON: "add on the file details view a preview button"
  The file DETAIL VIEW (detail drawer showing FILE scenario unit metadata: Scenario link, Parent link, etc.) currently has NO preview/open button. FIX: add a PREVIEW button (like the in-room preview buttons per R19.77) that opens the ContentPreviewer for this file — image renders as img, html in sandboxed iframe, url shows the two-button choice. The preview button appears alongside Scenario/Parent/Browse links in the detail view header.

- [ ] **R19.94 — R19.94: App header shows version string on all screens — small, undisturbing.**
  [requirement:uuid:a5e4fb82-f717-43b0-bcdd-2c73904c5599]
  > TRON: "add version to the header small undisturbing so you see it on all screenshots"
  The app HEADER MUST display the current version (e.g. 'v0.5.x · rawbin') on ALL screens. The version text is small and undisturbing (low contrast, small font) so it doesn't dominate the UI but is always visible — especially useful on screenshots for bug reports and QA.

- [ ] **R19.95 — R19.95: Main route (/) has a red Reset PWA Cache button.**
  [requirement:uuid:c8a480fa-ebc2-4c84-a3f1-f320f8faa2d6]
  > TRON: "add to the / main route a red reset pwa cache button"
  The / main route MUST display a RED 'Reset PWA Cache' button that clears all service-worker caches and reloads. Same functionality as the offline page's flush button (R19.45) but available on the main route — so users can force-reset even when the app loads (not just when stuck on offline page).

- [ ] **R19.96 — R19.96: Profile page shows the user's UUID — restore missing UUID display.**
  [requirement:uuid:5c325047-f190-4528-a975-df14fe5a6f18]
  > TRON: "the profile does not show my uuid as a user anymore"
  BUG: the profile page no longer shows the user's UUID. It used to display the UUID (for sharing / account linking). FIX: restore the UUID display in the profile view — show the user's full UUID (or short form with copy-to-clipboard) so they can identify their account and share it for account linking.

- [ ] **R19.99 — R19.99: One link still renders broken in md-safari room — identify and fix.**
  [requirement:uuid:aaa36d91-35b8-49ba-877d-d39b2275e1da]
  > PO relay (Tron v0.5.228 desktop Chrome): one link still renders broken in md-safari room.
  BUG (v0.5.228, desktop Chrome macOS): one link in the md-safari room still renders broken (non-clickable, wrong href, or missing target). Identify which link it is and fix. All other links in the room work.

- [ ] **R19.100 — R19.100: Identical files must render in ALL rooms — no per-room stale-cache inversion.**
  [requirement:uuid:ca4f8758-0267-4ae4-9723-f5b87ff8a593]
  > PO relay (Tron v0.5.228): identical files in SYSTEM TEST room don't render while md-safari DOES — inversion, likely per-room stale cache.
  BUG (v0.5.228): identical files in the SYSTEM TEST room do NOT render for Tron, while the md-safari room with the same files DOES render them. This is an inversion — the same data renders in one room but not another. Likely per-room stale cache or per-room scenario-unit load inconsistency. FIX: file rendering must be deterministic per FileUnit UUID regardless of which room displays it. If the FileUnit exists in the index and is in Room.files[], it renders. No per-room cache should suppress rendering.

- [ ] **R19.101 — R19.101: In-room tree shows BOTH Members AND Files collections via seed-ior — no regression.**
  [requirement:uuid:4d185684-170a-4cb9-bddb-d47419e57337]
  > PO relay (Tron): in-room tree LOST Members collection when consolidated to seed-ior (only Files render now; Members section gone).
  REGRESSION: consolidating the in-room tree to use seed-ior (R19.90/92) lost the Members collection — only Files render now. Members section is gone from the tree. The Members collection was accepted as missing while files were being fixed, but now must return. FIX: the in-room tree MUST show BOTH Members AND Files as top-level folder nodes (R19.21.A) via the SAME seed-ior data path, WITHOUT regressing the files fix. The Room's children API must return both members[] and files[] as children of the room seed, rendered as two folder-type rb-object-items.

- [ ] **R19.102 — R19.102: Room tree supports user actions — create new folder to organize content.**
  [requirement:uuid:754be820-0697-4ce8-8d7a-824484c47c69]
  > TRON: "prepare for actions like create new folder in the room UX."
  The in-room tree (currently auto-generated Members/Files collections) MUST support USER ACTIONS for content organization — starting with 'create new folder'. A user-created folder is a scenario unit (ior:class:Folder, nestable) within the room that can contain files and sub-folders. This is a design-ahead capture for a family of actions: create folder, move file into folder, rename folder, delete folder. The folder appears as an rb-object-item folder node in the tree (same as Members/Files per R19.21.A). After Members/Files-folder render fix (R19.101) lands.
