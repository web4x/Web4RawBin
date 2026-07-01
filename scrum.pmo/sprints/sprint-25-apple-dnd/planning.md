<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 25 Planning — Sprint 25 — Apple DnD

## Sprint Goal

Support Apple drag-and-drop items (URL schemes: mailto/webcal/calshow/maps/geo/tel/x-apple-reminder, NOT files) as URL-scheme routing on the R23.2 YouTube model (detect scheme -> preview -> Open-in-New-Tab native app). Phase 1 R25.1 = comprehensive DnD logging to reveal which schemes Apple sends; R25.2+ per-scheme handlers deferred to measure-first.

**Status:** Planned

## Tasks

- [ ] [Task 25.1: Comprehensive DnD logging (capture every dropped URL scheme)](./task-25.1-dnd-logging-capture-url-schemes.md)
- [ ] [Task 25.2: Unified WebItem scenario unit (bookmark / .url / .webloc)](./task-25.2-webitem-unified-url-unit.md)
- [ ] [Task 25.3: vCard onboarding recognizes existing users (device-link, no new UUID)](./task-25.3-vcard-onboarding-device-link.md)
- [ ] [Task 25.4: Drawer interaction — grab-bar mouse parity + X-minimize](./task-25.4-drawer-grab-bar-mouse-x-minimize.md)
- [ ] [Task 25.5: Drop-area clipboard preview + import](./task-25.5-clipboard-preview-import.md)
- [ ] [Task 25.6: Scenario link on ALL detail views](./task-25.6-scenario-link-all-detail-views.md)


| <a id="uc-rd1"></a>UC-RD.1 | room.dedupMembersOnLoad | e03132c7-ea09-4ec3-9b6a-e685e2b0f546 | R25.7 (AC-a) |
| <a id="uc-rd2"></a>UC-RD.2 | consolidate.evictAbsorbedFromRooms | 9300a275-d78b-4758-950f-d2d70d21c8e4 | R25.7 (AC-b) |
| <a id="uc-rd3"></a>UC-RD.3 | connect.redirectTombstoneToPrimary | ede1de17-a252-4566-b5bd-f3a474d6217d | R25.7 (AC-c) |
| <a id="uc-rd4"></a>UC-RD.4 | room.addMemberIdempotent | 85f40027-3b56-4a6e-94a2-c4b561f985e2 | R25.7 (AC-d) |