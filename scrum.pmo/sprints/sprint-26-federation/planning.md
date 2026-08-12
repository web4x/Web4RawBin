<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 26 Planning — Sprint 26 — RawBin Federation

## Sprint Goal

Federated scenario transfer via DnD: dragging an item between two RawBin servers transfers the scenario unit (receiver recreates it locally with provenance + unitLinks), not just a WebItem pointing at the source. Structure eager, payload lazy, identity by-reference. Greenfield federation, design-ahead chain before code (#126).

**Status:** Planned

## Tasks

- [x] 🏁 [Task 26.1: Federated IOR — provenance via originHost](./task-26.1-federated-ior-provenance.md)
- [x] 🏁 [Task 26.2: Cross-origin DnD federated-reference protocol](./task-26.2-cross-origin-dnd-federated-ref.md)
- [ ] 🧪 [Task 26.3: Server-to-server scenario fetch API (on the origin)](./task-26.3-server-to-server-fetch-api.md)
- [x] 🏁 [Task 26.4: Lazy child resolve — structure eager, payload lazy, members by-reference](./task-26.4-lazy-child-resolve.md)
- [x] 🏁 [Task 26.5: Conflict reconcile — uuid already exists locally](./task-26.5-conflict-reconcile.md)
- [ ] 🧪 [Task 26.6: Federation import wiring (end-to-end receive orchestration)](./task-26.6-federation-import-wiring.md)
