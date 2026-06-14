### R20.12: Current Sprint pinned at TOP of the traceability sprint-list (app view).

<details><summary>Tron directive</summary>

> The app's sprint-list view (rb-overview.ts) MUST render the CURRENT SPRINT as a pinned row at the TOP (ABOVE Sprint 01), with visually distinct styling (e.g. 📌 icon, highlight, bold). The pinned row names the current task (e.g. 'Sprint 20 — Drawer detail→v0.6.23'). This is the visible manifestation of the WIP=1 model in the app — the user always sees what's active NOW at the top of the list. Currently: sprint-list shows only numeric sprints 01-14 with no current-sprint pin.

</details>

## Traceability

**UseCases:**
- [🔗 sprintList.pinCurrent](../usecase/sprintlist-pincurrent.md)
