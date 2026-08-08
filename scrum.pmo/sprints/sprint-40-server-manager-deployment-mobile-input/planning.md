<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 40 Planning — Server Manager — deployment-node model + mobile input control

## Sprint Goal

Server Manager: model the deployment surface + fix mobile input control (Tron-authorized S40, #76). R40.1 — an action that opens the Claude app/web at the selected pane's AGENT RC (remote-control) session (per-pane/per-agent deep link; Claude Code sessions addressable as claude.ai/code/<session-id>, so selecting robbinTeam2:0.0 + firing lands on that agent's RC). R40.2 — represent WODA.prod as a UML deployment-NODE (rendered deployment-node style in the UML diagram) with REFERENCES to (a) the SSH config for WODA.prod, (b) the configured DOMAIN, (c) the LETSENCRYPT CERTIFICATE for that server, and the CURRENT OTMUX ITEMS (sessions->windows->panes) as CHILDREN of that root node. R40.3 — an action that PREVENTS the OS-specific (iOS) keyboard from opening + a new configurable Keyboard Controller surface (action-bar-style but with CONFIGURABLE KEYSTROKES); this sprint delivers the SUPPRESSION + the controller SHELL + the config model (the controller behavior is designed later). Evidence (Tron screenshot): the iOS keyboard covers the ENTIRE terminal and the input row overlays the Scenario/Edit buttons. Scenario-first (#126): req mints the R40.1/2/3 Requirement units + ACs; planner boards the sprint + 3 covering tasks; units on disk BEFORE any implementation.

**Status:** Planned

## Tasks

- [ ] [Task 40.1: Action — Open Claude.ai RC (per-pane/agent deep link to the selected agent's remote-control session)](./task-40.1-open-claude-rc-action.md)
- [ ] [Task 40.2: WODA.prod as a UML deployment-Node (SSH/domain/letsencrypt refs + otmux sessions->windows->panes children)](./task-40.2-woda-prod-uml-deployment-node.md)
- [ ] [Task 40.3: Suppress OS (iOS) keyboard + configurable Keyboard Controller (suppression + controller shell + config model)](./task-40.3-suppress-keyboard-controller.md)
- [ ] [Task 40.4: Sprint labels show the sprint NUMBER (display-composed 'Sprint N — theme' from model.number + name, single-source)](./task-40.4-sprint-label-shows-number.md)
