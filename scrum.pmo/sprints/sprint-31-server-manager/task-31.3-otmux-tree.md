<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.3: otmux session/pane tree in Server Manager (live, refreshable, selectable pane nodes)

[task:uuid:d5199875-0e47-4ce8-a756-ef3d29afc6eb]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

In Progress (PO 2026-07-20): otmux session/pane tree BUILT + renders server-side via otmux behind owner-guard (v0.7.85 eae839200, v0.7.89 12d4a1a0c). RE-ARCHITECTURE underway (Tron directive, architect 7c43178cc + 13a79ee2b): scenario-unit tree via shared traceability itemView - typed nodes otmuxSession -> otmuxWindow -> otmuxPane.

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement `[requirement:uuid:168e6d2b-439f-4c90-ab0c-47b2a10ccae0]`
  - down
    - [UC](./planning.md) `[uc:uuid:742aa04d-4dd8-46a6-bee1-f1b8ab9fa552]`

## Task Description

The Server Manager main view is a live tree of sessions -> windows -> panes mirroring 'otmux tree', read SERVER-SIDE via otmux. It is refreshable; each pane node is selectable and shows the pane title/target so the owner knows which agent pane it is. TRON DEVICE-FEEDBACK #2 2026-07-20 (IMG_4598): readSessionTree DATA is correct (chain-complete-to-Test 9467b1c6, 5a9f00a71) but the SHARED rb-trace-tree RENDER/INTERACTION layer has 2 behavior bugs - (1) the window node is a placebo '0: bash' with NO chevron (should be 'window 0' with its own expand/collapse children), (2) expansion is not layer-by-layer (explodes the whole subtree; only settles after manual per-session toggling). SHARPEN (render-behavior, GENERIC in rb-trace-tree, DISTINCT from the readSessionTree data chain): +AC-perlevel-expand-collapse, +AC-layer-by-layer, +AC-window-label, +AC-initial-collapsed. These need their OWN chain (a tree-render UC->Method on the shared rb-trace-tree component) - architect is diagnosing the shared-component fix; req mints that render chain scenario-first from the design (readSessionTree data chain UNCHANGED). R31.3 req STAYS In-Progress (do NOT flip Done). Route: architect (0.3) -> expert (0.1) -> tester (0.5, chromium logic + iOS visual to Tron). TRON CLARIFICATION 2026-07-20 (scenario-first gap - reached architect as a design dispatch but was never in the ACs; captured now): the badge must come via STANDARD parent/children REFERENCES (OO-referenced tree like /trace scenario badges), RETIRING the bespoke nodeChildCount fork (split(':') colon bug). +AC-badge-std-refs.

## Context

designRef: scrum.pmo/sprints/sprint-31-server-manager/design-server-manager.md (architect 9920f6832 + d4f7fee8c). Owner token 41ad88c4-4dee-49ac-afcb-8a2026657b2d (Marcel Donges). Sprint 31 Server Manager = owner-gated infra console (otmux tree + xterm.js terminal).

## Intention

R31.3 = read-only tree (lower risk; build after gate+section, before the terminal).

## Acceptance Criteria

- [ ] The view renders sessions -> windows -> panes hierarchically, matching the structure of 'otmux tree'.
- [ ] The tree is read SERVER-SIDE via otmux (behind the owner-guard R31.2), not from any client-side enumeration.
- [ ] The tree is refreshable and reflects the current live session/pane state on refresh.
- [ ] Each pane node is selectable and displays its title/target (e.g. robbinTeam2:0.4 = robbin-req@...) so the owner can identify the agent pane.
- [ ] The /server-manager page has a 'Back to Profile' exit link/affordance that navigates to /profile. (Tron 2026-07-20 - page navigation/exit affordance.)
- [ ] Every expandable node - session AND window - has its OWN expand/collapse chevron; the three levels (session / window / pane) toggle INDEPENDENTLY. BUG (IMG_4598): session nodes have a chevron but the WINDOW node has none. Panes are leaves (no chevron). Generic behavior of the shared rb-trace-tree component.
- [ ] Expanding a node reveals ONLY its DIRECT children, themselves collapsed - layer by layer / lazy (session expand -> windows collapsed; window expand -> panes), never exploding the whole subtree at once. BUG (IMG_4598): expansion explodes windows+panes together and only settles after the owner manually toggles each session.
- [ ] The window node is labeled by its window index/name (e.g. 'window 0'), NOT the active-command placebo (e.g. '0: bash'). BUG (IMG_4598): the middle level shows the active command instead of a clear window label.
- [ ] The tree's INITIAL state is correctly collapsed (sessions collapsed, or a clear sensible default) - no 'open yet closed' mixed/indeterminate state on first render that only corrects after manual toggling. BUG (IMG_4598): initial state was closed-yet-open and behaved naturally only after each session was manually opened+closed once.
- [ ] The tree node child-count BADGE is derived from the node's STANDARD parent/children scenario REFERENCES (the OO-referenced tree - exactly as /trace's scenario badges derive their count from children refs), NOT a bespoke per-node count fork. RETIRE nodeChildCount (the bespoke fork whose split(':') colon-parsing miscounts - the colon bug). The badge == the real referenced child count at EVERY level (session/window/pane).

## Implementation

v0.7.85/89: otmux session/pane tree BUILT + renders (sessions -> windows -> panes, server-side via otmux behind the owner-guard). Being RE-ARCHITECTED to itemView typed-nodes (implementing[~]). Refresh + selectable-pane pending the re-architecture settle.

## Subtasks

None (atomic task).
