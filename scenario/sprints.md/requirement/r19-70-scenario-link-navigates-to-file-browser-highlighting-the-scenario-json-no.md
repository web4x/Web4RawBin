### R19.70: Scenario link navigates to file browser highlighting the scenario.json, not a self-reference.

<details><summary>Tron directive</summary>

> The Scenario link in the detail view MUST navigate to the FILE BROWSER (/md/) navigated to and HIGHLIGHTING the <uuid>.scenario.json file — NOT a self-reference (/scenario?ior=self), and NOT directly to Monaco (/edit/). From the highlighted file in the browser, the user clicks the existing PEN icon to open the editor. This reuses the file-browser edit pattern for consistency across the app. The scenario-link affordance MUST be ONE shared DRY implementation reused across ALL detail views (Room, File, User, Device, and all chain types) — not a per-view reimplementation. One function, one template partial, all views consume it.

</details>

## Traceability

**UseCases:**
- [🔗 detailView.scenarioBrowserLink](../usecase/detailview-scenariobrowserlink.md)
