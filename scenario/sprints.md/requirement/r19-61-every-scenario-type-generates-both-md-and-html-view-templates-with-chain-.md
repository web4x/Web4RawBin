### R19.61: Every scenario type generates both .md and .html view templates with chain-link and edit affordance.

<details><summary>Tron directive</summary>

> Every scenario type (Room, User, Device, File, Requirement, UseCase, Class, Method, Implementation, Test, Sprint, Task) MUST generate BOTH a .md and .html view template. Each template MUST carry: (a) a chain-link icon (🔗) linking to the scenario unit, and (b) an edit affordance (✏️) linking to edit the scenario unit. BUG: Room .html files currently have NEITHER (missing chain-link + missing edit affordance); .md templates have them. Consistent across ALL types — no type may be missing either template or either affordance.

</details>

## Traceability

**Tasks:**
- [🔗 T-type-view-template: every scenario type generates .md + .html with chain-link + edit affordance](../task/type-view-template-md-html-chainlink-edit.md)

**UseCases:**
- [🔗 viewTemplate.registerAllTypes](../usecase/viewtemplate-registeralltypes.md)
