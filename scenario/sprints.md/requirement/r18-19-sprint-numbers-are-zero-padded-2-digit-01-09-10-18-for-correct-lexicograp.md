### R18.19: Sprint numbers are zero-padded 2-digit (01-09, 10-18) for correct lexicographic ordering.

<details><summary>Tron directive</summary>

> ## LITERAL SOURCE — Follow-on J: Zero-padded sprint numbers for sort (2026-06-05)
> 
> > TRON: "to sort the sprints correctly do 01 - 09 and then 10,11"
> 
> ### R18.19: Sprint numbers are zero-padded 2-digit (01-09, 10-18) for correct lexicographic ordering.
> 
> [requirement:uuid:18a1b2c3-d4e5-6f70-8190-000000018019]
> 
> Sprint names/slugs must use 2-digit zero-padded numbers so string-based sorting produces numeric order. "Sprint 01", "Sprint 02", ... "Sprint 09", "Sprint 10", "Sprint 11", ... "Sprint 18". Without zero-padding, lexicographic sort puts "Sprint 1" before "Sprint 10" before "Sprint 2" — wrong order.
> 
> Applies to: Sprint scenario unit `model.name`, speaking-name symlink tree directory names, and any sorted display in /trace or /scenario.
> 
> **Acceptance criteria:**
> - [ ] Sprint names use 2-digit numbers: "Sprint 01 — Foundation" through "Sprint 18 — ..."
> - [ ] Lexicographic sort of sprint names produces correct numeric order
> - [ ] Speaking-name tree uses zero-padded slug: `sprint-01-rawbin-foundation/`
> - [ ] Existing Sprint scenario units re-migrated with padded names
> 
> → Sprint-migration task (planner folds into dedup/rename task)

</details>

## Traceability

**Tasks:**
- [🔗 Sprint scenario units + sprint catalogue cleanup (dedupe + numbered rename)](../task/t198-sprint-scenario-units-catalogue-cleanup.md)

**UseCases:**
- [🔗 sprintList.zeroPad](../usecase/sprintlist-zeropad.md)
