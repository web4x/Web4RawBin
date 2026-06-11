### R18.18: Sprint names in /trace include their sprint number.

<details><summary>Tron directive</summary>

> > TRON: "you see a fundamental duplication flaw and missing sprint numbers"
> 
> Sprint names in the /trace browser omit the sprint number (e.g. showing "Foundation" instead of "Sprint 1 — Foundation"). The Sprint scenario unit's `model.name` must include the sprint number, or the renderer must prepend it from the slug/ordering. Users need the number to identify sprints by their sequence.
> 
> **Acceptance criteria:**
> - [ ] Each sprint in /trace shows its number (e.g. "Sprint 1 — Foundation", not just "Foundation")
> - [ ] Sprint ordering in the list matches sprint number order

</details>

## Traceability

**Tasks:**
- [🔗 Sprint scenario units + sprint catalogue cleanup (dedupe + numbered rename)](../task/t198-sprint-scenario-units-catalogue-cleanup.md)

**UseCases:**
- [🔗 sprintList.numberLabel](../usecase/sprintlist-numberlabel.md)
