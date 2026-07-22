<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 31 Planning — Sprint 31 - Server Manager

## Sprint Goal

Owner-gated infra console. A user-specific feature-grants section at the bottom of the profile (per-user, keyed to token) surfaces a 'Server Manager' ONLY for owner token 41ad88c4-4dee-49ac-afcb-8a2026657b2d. Server Manager = a live otmux session/pane tree (like otmux tree) where selecting a pane opens a fullscreen interactive xterm.js SSH terminal over an owner-gated websocket PTY bridge attaching to that tmux pane. Owner-guard is server-side by-construction (owner 200 / non-owner 403 on every endpoint + ws handshake). Scenario-first.

**Status:** Planned

## Task Ordering

Build order (security foundation first, PO/Tron 2026-07-20): R31.2 owner-gate -> R31.1 profile section -> R31.3 otmux tree -> R31.4 xterm.js terminal. Task IDENTITY is numeric (T31.1-4 = R31.1-4); array POSITION = build sequence (identity != position).

## Tasks

- [x] [Task 31.2: Owner-only access gate for Server Manager - server-side by-construction (owner 200 / non-owner 403, incl websocket)](./task-31.2-owner-gate.md)
- [ ] [Task 31.1: User-specific profile features section (per-user grants, owner-only entries, at profile bottom)](./task-31.1-profile-feature-grants.md)
- [ ] [Task 31.3: otmux session/pane tree in Server Manager (live, refreshable, selectable pane nodes)](./task-31.3-otmux-tree.md)
- [ ] [Task 31.4: Pane -> interactive default-drawer xterm.js SSH terminal (owner-gated websocket PTY bridge)](./task-31.4-xterm-terminal.md)
- [ ] [Task 31.5: Responsive bar/compartment WODA scrollable-viewport layout (CONCEPT)](./task-31.5-concept-scrollable-viewport-woda-layout.md)
  - [ ] [Task 31.5.1: rb-compartment: one component whose presentation attr flips full-content (expanded) <-> collapsed bar strip](./task-31.5.1-rb-compartment.md)
  - [ ] [Task 31.5.2: rb-strip: ordered row rendered from a descriptor array; owns layout+scroll+snap, no content logic](./task-31.5.2-rb-strip.md)
  - [ ] [Task 31.5.3: rb-snap-nav: data-driven bottom nav, one button per compartment, click snaps the viewport to its left edge](./task-31.5.3-rb-snap-nav.md)
  - [ ] [Task 31.5.4: viewport responsive mode: landscape flex all-visible, portrait native scroll-snap scroller, container-query driven](./task-31.5.4-viewport-mode.md)
  - [ ] [Task 31.5.5: the 3-way editor is an rb-strip instance: descriptor [L]|[C]|[R] + nav {Left,Center,Right}](./task-31.5.5-editor-instance.md)
  - [ ] [Task 31.5.6: WODA is an rb-strip instance: descriptor W|[O][D]|A + nav {What,Overview,Details,Actions}](./task-31.5.6-woda-instance.md)
  - [ ] [Task 31.5.7: drawer = Details compartment: data-position inline|bottom branches ONLY layout CSS, function fully shared](./task-31.5.7-drawer-details.md)
- [ ] [Task 31.6: Shared pan/zoom viewer capability for EVERY embedded format (FUTURE / concept)](./task-31.6-concept-shared-panzoom-viewer.md)
- [x] [Task 31.7: DRY single-source app version via ONE typed Config scenario unit — all consumers generated/derived, never hand-copied](./task-31.7-single-source-version.md)
- [ ] [Task 31.8: Feature typed unit type + FeatureManager root-of-trust — product layer linking implementations to user grants](./task-31.8-feature-featuremanager.md)
