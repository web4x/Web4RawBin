### R18.17: /trace sprint list shows each sprint exactly ONCE — no duplicates.

<details><summary>Tron directive</summary>

> > TRON: "you see a fundamental duplication flaw and missing sprint numbers"
> 
> The /trace browser's sprint list currently shows each sprint twice. This is either a data issue (duplicate Sprint scenario units in the index — the same duplication pattern seen with the 12 duplicate Class pairs) or a rendering issue (the sprint list query returns duplicates). Each sprint must appear exactly once in the list.
> 
> **Acceptance criteria:**
> - [ ] /trace sprint list shows each sprint name exactly once
> - [ ] No duplicate Sprint scenario units in the index (or if duplicates exist in data, the renderer deduplicates)

</details>

## Traceability

**UseCases:**
- [🔗 sprintList.dedupe](../usecase/sprintlist-dedupe.md)
