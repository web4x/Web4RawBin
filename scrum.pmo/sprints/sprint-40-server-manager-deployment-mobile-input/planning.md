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
- [ ] [Task 40.5: Detail/feature-view EXTRA action buttons de-duplicated onto the shared action bar (editor chrome UNCHANGED)](./task-40.5-buttons-to-action-units-dry.md)
- [ ] [Task 40.6: deploymentRefs -> real typed OOP model (typed units + typed IOR relationships + inheritance/interfaces, each leaf resolves a real file)](./task-40.6-deployment-refs-typed-oop-model.md)
- [ ] [Task 40.7: Back = real history.back(); the path label navigates to the containing folder (distinct)](./task-40.7-back-history-path-label-nav.md)
- [ ] [Task 40.8: 'Files' shows the REAL measured on-disk path of the scenario unit (fail-closed if absent, browsable)](./task-40.8-files-real-disk-path.md)
- [ ] [Task 40.9: 'Preview' = traceability chain + details drawer, REUSING /trace + rb-detail-drawer (no bespoke renderer)](./task-40.9-preview-traceability-drawer-reuse.md)
- [ ] [Task 40.10: Tron renders his QA verdict FROM the task — Approve (records verdict + flips Done-gate) / Decline (mints a ChangeRequest)](./task-40.10-tron-qa-verdict-approve-decline.md)
- [ ] [Task 40.11: deploymentRefs are scenario-first units with default views (fix the permanent-Loading detail drawer)](./task-40.11-deployment-refs-scenario-units-default-views.md)
- [ ] [Task 40.12: File detail view renders a working type-appropriate preview (audio player regression fix; fail-loud, all contexts)](./task-40.12-file-preview-audio-player-regression.md)
- [ ] [Task 40.28: Default actions Scenario + Edit ALWAYS open in a new tab (every surface the universalActionBar composes on), never navigate the current tab](./task-40.28-default-actions-new-tab.md)
- [ ] [Task 40.17: Live-pin no-refresh — pin-designate updates the sprint tree LIVE @390 (the shipped half of R40.17)](./task-40.17-live-pin-no-refresh.md)
