<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T156: Reload button on Connection-Failed + Offline pages

[task:uuid:9937a1f1-5674-48fb-92fe-6dc4a38089b0]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:9937a1f1-5674-48fb-92fe-6dc4a38089b0]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng):** B4 in [scrum.pmo/backlog.md](../../backlog.md)
  - **B4 requirement** `[requirement:uuid:c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e90]`
    Verbatim Tron quotes:
    > "add a reload button to page Connection Failed / Could not connect to server. Please refresh."
    > addendum: "same on the you are offline page"
- down
  - None (atomic task; small UI/HTML change in two error surfaces)
- follows
  - [T58: Link contrast on /md/ pages](../sprint-7-encrypted-storage/task-58-link-contrast.md) — historical UI-styling precedent (planning context)
  - [T150: File-browser breadcrumb link contrast (CSS)](./task-150-breadcrumb-link-contrast.md) — recent CSS sibling
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B4 `[requirement:uuid:c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e90]` (req-eng confirmed)
  - **use case:** UC-TBD (architect — likely `errorPage.renderReloadButton`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UC as a `UseCase` instance (rule #10 / T117)
  - **class/method:** `src/public/ts/app.ts` (connection-failed error HTML ~line 81), `src/public/sw.js` OFFLINE_HTML (existing `<button class="retry">`), possibly `src/public/ts/edit.ts` equivalent — TBD by architect

## Context

Tron 2026-06-01 (B4): two error surfaces should expose a manual reload action so
the user isn't stuck — the **Connection-Failed page** (`app.ts` catch block,
`<div class="error">...Please refresh...</div>`) currently shows error text
without a button; the **You-Are-Offline page** (`sw.js` OFFLINE_HTML) already
has a `<button class="retry" onclick="location.reload()">Retry</button>` —
verify it works and add the equivalent to Connection-Failed.

## Intention

### Why this task exists
- Connection-Failed page has no clickable reload action — users must
  refresh manually via the browser address bar
- Offline page button exists but may need verification (mobile, hover)

### Problems this task solves
- Connection-Failed users have no in-page action
- Inconsistency between two error surfaces

### How it solves them
- Add `<button onclick="location.reload()">` to Connection-Failed
- Verify (or restyle) the offline page button
- Architect-finalized button shape applies to both

## Acceptance Criteria

- [ ] AC1 — Connection-Failed page (`app.ts`) shows a clickable reload button
- [ ] AC2 — Clicking the button invokes `location.reload()` (page refreshes)
- [ ] AC3 — Offline page (`sw.js` OFFLINE_HTML) reload button verified working (or replaced if not)
- [ ] AC4 — Visual consistency: both buttons follow the same shape/styling per architect's design
- [ ] AC5 — iPhone safe-area-inset-bottom respected if the button is bottom-anchored
- [ ] AC6 — No regression: existing pages unchanged
- [ ] AC7 — `npm run build` succeeds; all existing tests pass
- [ ] AC8 — **Rule-pair (a)+(b) [learnings #15 + #16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as the user-facing impl. (c) STATIC_SHELL: exempt (no new route)
- [ ] AC9 — All 4 roles committed work in this file

## Dependencies

- **Requires:** None (small standalone UI fix)
- **Coordinate-with:** None
- **Enables:** users have an in-page recovery action on both error surfaces

## Definition of Done

- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓; (c) exempt
- [ ] No regression
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-06-01: PO directed planner to stand up T156 from backlog B4. CMM4 4-role (#18); real v4 uuids (#17); rule-pair (a)+(b) in AC8 + DoD (#15+#16).
- 2026-06-01 **robbin-req (anchor confirm):** B4 verbatim already in traceability block (lines 37-38, canonical uuid:c5d6e7f8). Both Tron quotes present ("add a reload button..." + "same on the you are offline page"). Chain section updated with full uuid. Note: sw.js offline page already has a Retry button — T156 scope is primarily the app.ts connection-failed page. Ready for architect.

## Subtasks

None (one line change + optional edit.ts mirror).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 20 (Reload button on error pages)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 8 (small UX win on error surfaces; quick single-cycle ship)*
