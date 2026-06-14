### R20.5c: Detail view renders superseded/duplicateOf links visible in the detail section.

<details><summary>Tron directive</summary>

> The detail view MUST render superseded links — when a unit has supersededBy or supersedes[] fields, they are shown as navigable links in the detail section. This is the dedup-traceability half of R20.5 (part C). Method already implemented: RbDetailView.renderSupersededLinks (31c6e25e) at detail-superseded.ts:15.

</details>

## Traceability

**UseCases:**
- [🔗 detailView.renderSuperseded](../usecase/detailview-rendersuperseded.md)

**Tests:**
- [🔗 ae410763](/scenario?ior=ae410763-0000-0000-0000-000000000000)
