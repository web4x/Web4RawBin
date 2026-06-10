# Sprint 19 — Room Handling — TRON LITERAL REQUIREMENTS (compound source)

**Source:** Tron, chat, 2026-06-10. Captured VERBATIM by robbin-po BEFORE decomposition. robbin-req splits into atomic requirements (each requirement:uuid links UP to this source); planner stands up the sprint; architect designs; expert implements; tester verifies. DO NOT paraphrase — the verbatim text is authoritative.

---

## LITERAL SOURCE (verbatim)

> plan a sprint 19 about room handling. in a room you can click on the room name and edit the room config scenario. a room is a scenario like every other req, task, method … scenario. unique uuid and same scenario model and test of the json. rooms can be public, by invite or with private password. private rooms are only listed for owners. by invite rooms send a invite request as a message into the room with the requesters name and uuid. the show not a join button like public rooms but an „Apply" button. the message can be accepted and they join. rooms can be live or persistent. persistent rooms add every one to the members list even if they are offline but show them as offline. but no contact gets ever lost. contacts can be added and temoved from the room member list. live mode is the current default mode. after the sprint persistpis the default mode and it can be switched to live mode in the room editor. the room content area gets a drop content here area double the size of an item view in the tree overview. below there is a tree with two nodes, Members and Files. members will be diplayes as item views below the member node. files get uploaded and are stored in the uuid indes as uuid.content and a uuid.scenario.json with the reference to the content and unitLinks[] references to the ln links eg in the room folder on the filesystem. so every file becomes a unique unit.

---

## Decomposition hints (for req — confirm/correct against literal; NOT authoritative)

### Room as a scenario unit
- **R19.1** A room IS a scenario unit like every other (req/task/method) — unique v4 uuid, same `{ior, model, ownerIor}` shape, AND a test of the json.
- **R19.2** Click the room name → open/edit the room config scenario (room editor).

### Visibility modes
- **R19.3** Room visibility = one of: PUBLIC | BY-INVITE | PRIVATE (password).
- **R19.4** PRIVATE rooms are listed ONLY for owners.
- **R19.5** BY-INVITE rooms: requester sends an invite REQUEST as a message into the room carrying the requester's name + uuid; the room shows an "Apply" button (NOT a join button like public); the request message can be ACCEPTED → requester joins.
- **R19.6** PUBLIC rooms show a join button (current behavior).

### Lifecycle modes
- **R19.7** Room mode = LIVE | PERSISTENT.
- **R19.8** PERSISTENT rooms add everyone to the members list even when offline, shown as offline — no contact is ever lost.
- **R19.9** Members (contacts) can be ADDED and REMOVED from the room member list.
- **R19.10** LIVE is the current default. AFTER this sprint, PERSISTENT becomes the default mode, switchable back to LIVE in the room editor.

### Room UI layout
- **R19.11** Room content area gets a "drop content here" drop area, DOUBLE the size of a tree-overview item view.
- **R19.12** Below it: a tree with two nodes — Members and Files.
- **R19.13** Members displayed as item views below the Members node.

### Files as units
- **R19.14** Files uploaded into a room are stored in the uuid index as `<uuid>.content` PLUS a `<uuid>.scenario.json` referencing the content, with `unitLinks[]` references to the ln links (e.g. in the room folder on the filesystem) — every file becomes a unique scenario unit.

(req: split/refine per the literal source; decompose ALL atoms + signal 'decomposition complete' BEFORE planner creates tasks, per the precedence protocol. The verbatim text is authoritative.)


## Refinements (post-decomposition)

### Component-identity (refines R19.11+12+13)
- **R19.21** (2026-06-10): the in-room Members/Files tree MUST be rendered by the SAME rb-tree component used in /trace, and items by the SAME rb-tree-item component (Lucide icon, speaky name, word-wrap description, drag, tap-to-collapse/expand, > expander). Discovered when T-room-ui v0.5.129 (commit 529d5c42) shipped an inline tree.
  > TRON: "the in room tree should be the same as in the treacability and the items the same as the itmens there!!!"
