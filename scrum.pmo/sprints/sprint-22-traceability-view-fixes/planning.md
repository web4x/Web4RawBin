# Sprint 22 — Traceability View Fixes — Planning

**Source:** Tron directive (screenshot) 2026-06-29, via robbin-po.
**Requirements:** [requirements.md](./requirements.md)

## Sprint Goal

Fix two defects in the Task detail view of the traceability browser: remove the false-duplicate empty "Traceability Chain: No chain" section so only one chain section renders, and repoint the Forward Links section to link to the MD task documentation file instead of showing the raw `useCases` IOR reference.

## Use Case Placeholder

| Anchor | UseCase (Object.verb) | UC placeholder UUID | Covers |
|--------|----------------------|---------------------|--------|
| <a id="uc-vf1"></a>UC-VF.1 | taskDetail.renderSingleChainAndMdLink | 4d0e454a-124a-43f7-8487-28aa61c12fbf | R22.1 |
| <a id="uc-vf2"></a>UC-VF.2 | drawer.panZoomMouseParity | ada54a0e-0eef-4f16-a393-8c30c6bdd06d | R22.2 |
| <a id="uc-vf3"></a>UC-VF.3 | chainNode.linkToSource | 1371923a-06f2-4c84-a1ca-75a98ef77f51 | R22.3 |
| <a id="uc-vf4"></a>UC-VF.4 | mdBrowser.pngOpensPreview | 3ab76d13-2ef6-4ca2-b597-7692cb2a30f6 | R22.4 |

The architect refines UC-VF.1 into a real UseCase unit (likely on the Task-detail view class, e.g. `rb-task-detail.ts`) and wires Class → Method → Implementation → Test.

## Notes

- Issue 1 (chain dedup) and issue 2 (Forward Links → MD link) are distinct surfaces in the same Task detail view; captured as one requirement R22.1 per the PO directive. R-I split into R22.1 + R22.2 is available if independent tasking is preferred (see requirements.md R-I note).
- Likely impl site: the Task DetailView renderer (`src/public/ts/trace/rb-task-detail.ts` per the S21 R21.9 reference) — the section that emits "Traceability Chain" and "Forward Links".

## Definition of Done (Strict Verify Bar)

- Task detail view shows exactly one chain section; no empty "No chain" duplicate.
- Forward Links opens the task's `.md` file path.
- Verified live headless against the running app.

---

*Planned by robbin-req 2026-06-29. Sprint 22 — Traceability View Fixes.*
