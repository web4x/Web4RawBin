# Honest-Done Worklist — 5 stale-Active sprints (close In-Progress -> Done/supersededBy)

By robbin-req 2026-08-07 (PO (a) close-stale ruling; resolveSprintPin fail-loud on >1 Active). These In-Progress-deriving tasks on ancient/shipped non-frozen sprints are STALE (checklist never closed). Planner marks each to HONEST status: Done (shipped) or supersededBy (merged/refactored). NO auto-flip (INV-S5a). Goal: after close, exactly 1 Active (S37).
**Total: 49 stale In-Progress tasks across S19/20/21/25/31.**

## S19 — Sprint 19 — Room Handling — 26 stale In-Progress
- 6c4949fa — T-room-unit: Room IS a scenario unit + click-to-edit room editor
- 164d8114 — T-visibility: Room visibility modes (public/by-invite/private)
- 1805f7db — T-apply-flow: BY-INVITE Apply button + invite-request messages
- 67b2763e — T-persistent: Room mode PERSISTENT + offline members + add/remove
- 312cb103 — T-default-flip: PERSISTENT becomes default mode after sprint
- ae090710 — T-room-ui: drop-zone + Members/Files tree + member item views
- 834fe55b — T-file-unit: Files become scenario units (uuid.content + scenario.json
- 2195d98f — T-room-ui-shared: in-room tree REUSES /trace rb-tree + rb-tree-item wi
- e90c223d — T-remove-room-sizes: strip maxMembers/maxPlayers/size config from mode
- 787e88ab — T-remove-spectator: strip isSpectator/mode/role/UI/join-flow/server/MS
- a91643c6 — T-sticky-drawer-close: sticky close button on detail drawer
- b3b822e9 — T-room-json-symlink-and-ui: room.json symlink to canonical scenario un
- c0d67460 — T-room-edit-pen-canonical: edit pen on room item opens canonical scena
- fda34dac — T-room-link-404-fix: room link navigates to live room or editor, never
- 147e2f64 — T-member-iors: room scenario unit model holds IOR references to its me
- 7fca98ae — T-dnd-file-chain: drop file onto room drop-zone uploads and creates Fi
- 25c38ac0 — T-dnd-unknown-dispatcher: unknown format dropped onto room chat + exte
- 1c7f8d8e — T-server-log-level: configurable server log level gates logging verbos
- 40a756f5 — T-file-version-new: different content same name registers new version
- 6f574da6 — T-file-version-array: file scenario unit has version[] array {version,
- 0c28c7f8 — T-user-scenarios: Users become first-class scenario units (ior:class:U
- fb629eb7 — T-back-button-visible: full-width drawer must not cover top-nav back b
- 3ca88df7 — T-room-join-stale-takeover: joining from lobby must succeed (same-toke
- 322d0fcd — T-room-file-item-rerender: file items in room tree survive re-render (
- 4c19b50f — T-drawer-drag-resize: the drawer nudge/grab-handle must DRAG-RESIZE th
- 1cbad4ef — T-iframe-pinch-scale: a pinch gesture inside the preview iframe must S

## S20 — Sprint 20 — Radical Forward Planning (Traceability-First) — 9 stale In-Progress
- 450cb98a — T-s19-champagne-backfill-tracking: track tonight's 22:07 radical backf
- fe8c43a5 — T-detail-drawer-grab-bar: default detail drawer nudge becomes the wide
- 767dd241 — T-item-views-default-collapsed: every item view defaults COLLAPSED on 
- b1c93799 — T-bug-changerequest-oop-extensions: Bug + ChangeRequest as Requirement
- d43fce61 — T-s19-shared-impl-split-recovery: split 11 shared-impl regressions int
- 56cc23b5 — T-rename-champagne-to-traceability: 'Champagne Chain' → 'Traceability 
- 18ee26a2 — T-chain-excludes-self-and-nonchain: chain section excludes the Task se
- 7047d04f — T-selection-model: app-wide SelectionModel + selection-driven drawer/m
- 1fac9d23 — T-selection-tap-switch-longpress-toggle: tap clears+selects ONE, long-

## S21 — Sprint 21 — Contact Identity — 9 stale In-Progress
- 0c1b375e — T21.1: vCard drop stores .vcf beside avatar
- a25e2787 — T21.2: Lobby renders real name on first connect
- 1bae9710 — T21.3: Phone alt-UUID index (ln symlink)
- e83dc244 — T21.4: Device-link on known phone/email
- 3960168e — T21.5: Emails as scenario units + alt-index
- af9dc6cc — T21.6: Phones as scenario units (seed Tron)
- 18845496 — T21.7: Addresses async OSM-verified
- 842d4f01 — T21.8: Companies as shared dedup units
- f86f7003 — T21.9: File detail reorder + pan/zoom

## S25 — Sprint 25 — Apple DnD — 4 stale In-Progress
- 06544a45 — Task 25.1: Comprehensive DnD logging (capture every dropped URL scheme
- 92bdca8b — Task 25.3: vCard onboarding recognizes existing users (device-link, no
- b9deaf57 — Task 25.4: Drawer interaction — grab-bar mouse parity + X-minimize
- d01c38b3 — Task 25.7: Room membership dedup by resolved identity (structural, no 

## S31 — Sprint 31 - Server Manager — 1 stale In-Progress
- 6be9a92d — Task 31.6: Shared pan/zoom viewer capability for EVERY embedded format
