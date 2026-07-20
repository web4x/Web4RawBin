<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 31 Planning — Sprint 31 - Server Manager

## Sprint Goal

Owner-gated infra console. A user-specific feature-grants section at the bottom of the profile (per-user, keyed to token) surfaces a 'Server Manager' ONLY for owner token 41ad88c4-4dee-49ac-afcb-8a2026657b2d. Server Manager = a live otmux session/pane tree (like otmux tree) where selecting a pane opens a fullscreen interactive xterm.js SSH terminal over an owner-gated websocket PTY bridge attaching to that tmux pane. Owner-guard is server-side by-construction (owner 200 / non-owner 403 on every endpoint + ws handshake). Scenario-first.

**Status:** Planned

## Task Ordering

Build order (security foundation first, PO/Tron 2026-07-20): R31.2 owner-gate -> R31.1 profile section -> R31.3 otmux tree -> R31.4 xterm.js terminal. Task IDENTITY is numeric (T31.1-4 = R31.1-4); array POSITION = build sequence (identity != position).

## Tasks

- [ ] [Task 31.2: Owner-only access gate (server-side, by-construction, incl websocket UPGRADE ticket)](./task-31.2-owner-gate.md)
- [ ] [Task 31.1: User-specific profile features section (per-user grants, owner-only entries, profile bottom)](./task-31.1-profile-feature-grants.md)
- [ ] [Task 31.3: otmux session/pane tree in Server Manager (live, refreshable, selectable pane nodes)](./task-31.3-otmux-tree.md)
- [ ] [Task 31.4: Pane -> interactive fullscreen xterm.js SSH terminal (owner-gated ws PTY bridge, read-only default)](./task-31.4-xterm-terminal.md)
- [ ] [Task 31.5 (CONCEPT): Responsive scrollable viewport + WODA bar/compartment layout — DESIGN ARTIFACT, not a build](./task-31.5-concept-scrollable-viewport-woda-layout.md)
