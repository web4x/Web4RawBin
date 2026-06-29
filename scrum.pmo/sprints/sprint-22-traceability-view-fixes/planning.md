# Sprint 22 — Traceability View Fixes — Planning

**Source:** Tron directive (screenshot) 2026-06-29, via robbin-po.
**Requirements:** [requirements.md](./requirements.md)

## Sprint Goal

Fix two defects in the Task detail view of the traceability browser: remove the false-duplicate empty "Traceability Chain: No chain" section so only one chain section renders, and repoint the Forward Links section to link to the MD task documentation file instead of showing the raw `useCases` IOR reference.

## Use Case Placeholder

| Anchor | UseCase (Object.verb) | UC placeholder UUID | Covers |
|--------|----------------------|---------------------|--------|
| <a id="uc-vf1"></a>UC-VF.1 | taskDetail.renderSingleChainAndMdLink | 4d0e454a-124a-43f7-8487-28aa61c12fbf | R22.1 |

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
