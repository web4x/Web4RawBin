[Back to Sprint 18 Planning](./planning.md)

# T200: Tree ↔ Detail Sync — bi-directional selection state on /trace

[task:uuid:f84b551a-ab73-4a73-a9d7-a938b350ebdf]

> **PO direction 2026-06-08 (stand-up):** New feature task; req-eng capturing.
> Stand it up APPLYING the new per-cycle pre-gate (commit `780bb36`):
> `coveredRequirements[]` + `useCases[]` populated AT standup.
>
> **PO direction 2026-06-08 (release):** T201 6-step chain-correction CLOSED
> (verified through Layer 5, v0.5.109 `84908ea4`). T200 RELEASED from sequencing
> block — architect quick-designs the detail→tree sync mechanism, expert builds,
> tester standing by. Per req's deduplication note (compound-source line 438 +
> commit `18ae221e`), **R18.33 IS T200**; placeholder canonicalized below.

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (req-eng canonicalized R18.33 verbatim Tron quote 2026-06-08; architect to quick-design sync semantics on release)
  - [ ] creating test cases
  - [ ] implementing (expert — tree-state ↔ drawer-state binding; URL `?ior=` already exists per T173 — extend for bi-directional, focus on detail→tree per R18.33)
  - [ ] testing (tester standing by — verify both directions: click-tree→drawer + chain-click-in-drawer→tree-scroll+expand+highlight)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only. Never checked by planner/sync.

## Pre-gate triple-check
**At stand-up 2026-06-08:**
- (a) Chain wiring: `coveredRequirements[]` + `useCases[]` BOTH populated with planner-generated v4 placeholders per learnings #17, adoption-note per #20. ✓
- (b) Rule-pair (#15/#16): scope = user-facing UI on `/trace`; AC8 captures (a) `package.json` + (b) `sw.js` CACHE_NAME bump at impl-shipped; (c) STATIC_SHELL exempt. ✓
- (c) Tron-QA gate (#9/#10): QA Review + Done unchecked. ✓

**At release 2026-06-08 (post-T201):**
- (a) `coveredRequirements[]` CANONICALIZED — placeholder `c8064a94-…` replaced with R18.33's canonical req:uuid `b64a9d54-545f-4f25-b110-209421cec8e2` (real v4, owned by Sprint 18). `useCases[]` placeholder remains pending architect quick-design. ✓ (planner side)
- (b) Rule-pair still applies; unchanged.
- (c) Tron-QA gate still untouched.
- Dependency T201 satisfied (PO-verified, v0.5.109 `84908ea4` Layer 5 complete) → T200 RELEASED from sequencing block.

## Traceability

`[task:uuid:f84b551a-ab73-4a73-a9d7-a938b350ebdf]`

- up
  - [Sprint 18 Planning](./planning.md)
  - **coveredRequirements[]** — `Task.coveredRequirements[]` populated (planner pre-gate enforcement):
    - **R18.33 — Detail navigation syncs tree selection** `[requirement:uuid:b64a9d54-545f-4f25-b110-209421cec8e2]` (canonical, req-eng emit; was planner placeholder `c8064a94-…` 2026-06-08 at stand-up, canonicalized on release 2026-06-08)
      - Tron verbatim (compound-source line 412): "when i navigate within the details view, the state of the tree overview does not follow… last selected scenario should be scrolled into view and expanded so much that its visible."
      - Tron sequencing (Follow-on K): "after this is done [chain-correction] do the tree overview sync with the navigation in the details." → blocked-by T201; SATISFIED 2026-06-08.
- chain (req → task → useCase → class → method → implementation → test) — **architect supplies useCases[] at design; planner enforces it's non-empty before 📝→✅**
  - **useCases[]** (planner placeholder, architect to canonicalize):
    - `[usecase:uuid:dbc9ad5f-9c02-413b-a81a-3fcb28a09d48]` — likely `trace.tree.syncToDetail` / `trace.detail.syncToTree` (or a unified `selection.sync` UC). Architect to design + assign canonical UC IORs; planner adopts/replaces during 📝 sync.
  - **requirement:** R-tree-detail-sync (above)
  - **class:** TBD (architect — likely the trace tree component + detail drawer state holder)
  - **method:** TBD
  - **implementation:** TBD
  - **test:** Playwright E2E for both directions (TS1/TS2 in Test Scenarios below)
- follows
  - T173 (`.scenario.json` click → `/trace?ior=` + lazy-load) — established the URL → tree-expand → detail-render path; T200 extends this with bi-directional sync
  - T110 (DetailViewContainer drawer) — provides the detail surface that must sync back to the tree
  - T143 (tree-item redesign / chain → tree rework) — tree-item interactions T200 ties to detail state
- down
  - None (atomic — single coordinated bi-directional binding)

## Task Description

**Today:** `/trace?ior=<uuid>` (T173) expands the tree from a Requirement root down
to that instance + opens its DetailView in the drawer. That's the URL → tree+detail
direction.

**Missing (T200):** the bi-directional binding when interacting WITHIN /trace:
1. **Tree → detail:** clicking a node in the tree should update the detail
   drawer to that instance (today this may already work via T173's verb routing;
   confirm + formalise as part of the sync contract).
2. **Detail → tree:** clicking a chain link inside the detail drawer (e.g.
   "Requirement" link on a Task's DetailView) should update the tree to that
   target — scroll, expand the path to it, highlight it — not just swap the
   drawer's content silently while the tree falls out of sync.

The state being synced: **currently-selected IOR** (the unit shown in the
drawer + highlighted in the tree). Both surfaces must stay in lock-step on
every selection change, regardless of which surface initiated it.

(Architect to finalise scope + design state holder + sync semantics during
refinement; planner-authored stand-up only.)

## Acceptance Criteria
- [ ] AC1 — Clicking a tree node updates the detail drawer to that node's instance
- [ ] AC2 — Clicking a chain link inside a DetailView (any of 7 types) updates the tree: scrolls to + expands path to + highlights the target node
- [ ] AC3 — URL stays in sync: `?ior=<current-selected-uuid>` reflects the live selection in both directions (browser back/forward navigates selection history)
- [ ] AC4 — No flicker / no double-fetch: a single sync action updates both surfaces atomically
- [ ] AC5 — Tree → detail and detail → tree both work for all 7 typed surfaces (Requirement / Task / UseCase / Class / Method / Implementation / Test)
- [ ] AC6 — Regression: T173 `/trace?ior=` deep-link still works on first load (no flicker, full expand+select+render path holds)
- [ ] AC7 — Regression: T110 drawer slide-up/slide-down, T143 tree-item interactions (tap-collapse / `>` expand), T165 7/7 tree rendering all unaffected
- [ ] AC8 — **Rule-pair (a)+(b) [#15+#16]:** `package.json` bump + `sw.js` CACHE_NAME bump in the same commit-set; (c) STATIC_SHELL exempt (reuses `/trace`, no new HTML route)
- [ ] AC9 — `npm run build` succeeds; full test suite passes

## Test Scenarios

File: `test/e2e/trace-tree-detail-sync.spec.ts` (new)

| TS | Action | Expected |
|----|--------|----------|
| TS1 | Open `/trace?ior=<task-uuid>` deep-link | Tree expands path; drawer shows TaskDetailView (T173 regression baseline) |
| TS2 | From TS1 state, click a tree sibling | Drawer updates to sibling's DetailView; tree highlight moves to sibling |
| TS3 | From TS1 state, click a "Requirement" chain link inside the drawer | Tree scrolls to + expands the requirement node + highlights it; drawer updates to RequirementDetailView |
| TS4 | Browser Back after TS3 | Selection reverts; both surfaces back in sync to previous state |
| TS5 | Walk each typed DetailView (Req/Task/UC/Class/Method/Impl/Test) clicking a chain link | Tree sync holds for every type |
| TS6 (regression) | T173 deep-link from `.scenario.json` click in /edit | Unchanged behavior |
| TS7 | Rule-pair post-bump on Tron's iPhone | New CACHE_NAME activates; sync reaches device |

## Owners (CMM4 4-role, per learnings #18 + per-cycle Planner↔Architect Sync Rule)
- **robbin-req** — capture the verbatim Tron tree↔detail-sync quote in compound-requirement-source; canonicalize R-tree-detail-sync requirement scenario unit (replacing placeholder req:uuid `c8064a94-…`)
- **robbin-architect** — design the sync semantics (state holder location, event flow, URL contract, single-source-of-truth for "selected IOR"); supply the canonical `useCases[]` (replacing placeholder uc:uuid `dbc9ad5f-…`)
- **robbin-expert** — implement per architect's design; rule-pair (a)+(b) at ship time
- **robbin-tester** — Playwright TS1-TS7; visual confirm on iPhone (Tron's device)

## Dependencies
- **Requires:** T173 (URL → tree + detail rendering surface), T110 (drawer), T143 (tree-item), T165 (7/7 tree rendering), T111 (typed DetailViews providing chain links)
- **Enables:** richer /trace navigation; no more "drawer says one thing, tree says another"
- **Coordinate-with:** if architect designs a router-level selection store, must not break T173's `?ior=` contract

## Definition of Done
- [ ] All AC met; chain wired both sides (`coveredRequirements[]` + `useCases[]`) with canonical (non-placeholder) uuids after req-eng + architect refinement
- [ ] Rule-pair (a)+(b) verified at impl-shipped sync
- [ ] No regression on T110/T111/T143/T165/T166/T173
- [ ] All 4 roles committed work; per-cycle pre-gate triple-check passed at each transition
- [ ] Tron QA approved

## Subtasks
None (atomic — single coordinated bi-directional binding per architect's design).

## QA Audit & User Feedback
- 2026-06-08: PO directive — stand up tree↔detail sync task applying the new per-cycle pre-gate (Planner↔Architect Sync Rule, commit `780bb36`). First live test of the prevention.
- 2026-06-08: Pre-gate triple-check applied at stand-up: (a) chain wiring populated with planner v4 placeholders (adoption-note pattern); (b) rule-pair captured in AC8 + DoD; (c) Tron-QA gate untouched.
- Pending: req-eng anchors verbatim Tron quote → architect designs sync semantics + canonical useCases[] → expert impl + rule-pair → tester Playwright TS1-TS7 → Tron QA.

---

**Sprint:** Sprint 18 — Chain Method-Scope & Role Skills
**Requirement:** R18.33 — Detail navigation syncs tree selection (canonical req:uuid b64a9d54-545f-4f25-b110-209421cec8e2)
**Priority:** HIGH — Tron device usability on the now-complete 7-class /trace tree
**Blocked-by:** T201 6-step chain correction — SATISFIED 2026-06-08 (v0.5.109 `84908ea4` Layer 5 complete, PO-verified) → T200 RELEASED
