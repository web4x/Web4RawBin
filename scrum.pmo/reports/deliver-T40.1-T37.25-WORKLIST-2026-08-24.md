# WORKLIST — deliver T40.1 (+ all CRs) and T37.25 (Tron directive, PO 2026-08-24)

Measured on disk at HEAD `0f3cd2e66` v0.8.126 (NOT inferred from checklists — repeatedly stale). NO status flips. `f46a6558` (PO's list) = **R40.47, a Requirement (PII split), NOT a CR** — the canonical CR set is the 5 under Test `c4f8a1d6.changeRequests[]`.

## T40.1 (`7a956c21`, QA-Review, all In-Progress sub-steps [x], 5 CRs OPEN)

The #86 CONTROLLER INFRASTRUCTURE is BUILT and on disk: `unit-controller.ts` (generic apply), `task-policy.ts::statusNext` (thin façade, impl 47227ad1), `mvc-boundary-guard.ts` (approve DELEGATES → single-source Done), `step-evidence.ts` (shared predicate). The 5 CRs each demand one mechanic:

| CR | demands | on disk | remains |
|----|---------|---------|---------|
| **4babebb1** (drive-action / re-parent) | decline is no longer inert; CR re-parented Task→Test | **BUILT** — structure verified (ownerIor→Test `c4f8a1d6`, `task`→T40.1 backref, `reparentedFrom` recorded); behaviour `declineToChangeRequest` (server.ts:1616) mints CR via the seam THEN reopens via TaskPolicy (unticks QA/Done → derives In-Progress; publishUnitChanged emits live) | (i) render-under-test @/trace verify; (ii) the processing sub-step it references (=7286d45a, below); (iii) formally resolve the CR |
| **7286d45a** (processing-change-requests sub-step under QA Review) | a task with ≥1 OPEN CR derives QA-Review[ ] + processing-CR[ ] | **NOT STARTED** — grep `processing change request` in src/ts = **0**; T40.1 checklist has NO such sub-step; a task with 5 open CRs still shows QA-Review[x]. **The load-bearing gap.** | build the derive-layer sub-step (derived-from-open-CR, NOT a stored flag) → T40.1 derives to Tron's sketch (pre-reg proof ii) |
| **c27ae455** (Set-as-Current demotes prev→NEXT) | set-current moves the old current to next | **PARTIAL** — designation input (R40.17) + derived-next (`bySprintDisplayOrder`, `resolveSprintPin` af97137f) BUILT; demote emerges from derived-next by construction | verify the set-current path demotes prev→next LIVE + its gate/Test |
| **18ebe066** (auto-advance@QA + recalc next + rollup-parent) | pin auto-advances on QA; rollup-parent kills the coord-root 37.4 mis-pick | **PARTIAL** — auto-advance-on-QA SHIPPED (T40.18 `46964040` v0.8.95, chain-complete-to-Test); **rollup-parent-status NOT built** — T37.4 `79fd2164` still stored `Planned`, no rollup code path (grep=0) = exactly my pre-registration finding | build rollup-derived parent status so 37.4 DERIVES QA-Review → pin lands **37.20** (pre-reg oracle i) |
| **461d5db6** (derived-status single-writer) | status is derived, never imperatively written | **BUILT** — architect 794c8c23a; status = `deriveStatusEnum(checklist)`, NO direct `m.status=` write in server.ts, raw `idx.put` gone, `UnitController` persists once (SOLE writer) | its stub-must-fail gate/Test (no 2nd writer reappears) |

**T40.1 genuinely-left = TWO real build items:** (b) processing-CR sub-step [derive layer] + (d) rollup-parent-status [the pin-oracle piece]. The rest is verify (c-demote, a-render), gate/Test authoring, and formally resolving the 5 CRs. When (b)+(d) land: T40.1 derives to Tron's sketch AND the pin unsticks to 37.20 = two of the three pre-registered demo oracles fire.

## T37.25 (`a39efc32`, ONE VIEW BUS, In-Progress — refinement done; test-cases/impl/testing open)

**PO's hypothesis CONFIRMED: subscribe-on-render is substantially BUILT.** Views that DO subscribe a ref on render (live-update):
- `rb-detail-view` (obj.ref + linked refs), `rb-requirement-detail`, `rb-usecase-detail`, `rb-task-detail` — all `ViewBus.subscribe(viewBusKey(ref), ()=>render())`
- **`rb-detail-drawer` (R40.57/58, 887891fe2, v0.8.126): subscribes the CurrentSprint pin via the SAME viewBusKey the tree uses (rb-detail-drawer.ts:87) + the action bar to the shown ref (:492)** — the "one more view subscribes on render" PO cited
- `ProfileSheet`, `RoomBrowser`, `rb-member-badge` (User channel); `universal-actions` notifies the CurrentSprint singleton

**The genuine gap = ONE BUS is NOT unified (still PLURAL).** TWO ViewBus files exist:
- `src/public/ts/ViewBus.ts` (instance adapter) and `src/public/ts/trace/ViewBus.ts` (the CLASS the tree uses).
- `RawBinClient.ts:4` explicitly flags it: *"two ViewBus files exist … reconcile to ONE = C4 DRY item after req returns."*
- ⇒ **AC-one-bus-not-two = NOT satisfied** (the R40.18-class two-source disease at the bus). This is the real architecture item for T37.25.

**T37.25 genuinely-left = ONE real item + gates:** (1) retire the 2nd ViewBus / unify to ONE bus (AC-one-bus-not-two); (2) the AC-subscribe-on-render-coverage GATE (a Test that RED's if a rendered ref isn't subscribed — enumerates any client view still not subscribing, e.g. confirm the tree row + any board-projection surface); (3) the @390 device AC (Tron). subscribe-on-render itself is largely delivered.

## Estimate of what is genuinely left (for parallel dispatch)

- **T40.1:** 2 builds — (b) processing-CR sub-step (derive layer, small-med), (d) rollup-parent-status (small, kills the coord-root mis-pick); + verify c/a + author gates + resolve 5 CRs. The infra they ride is already built.
- **T37.25:** 1 build — unify the 2 ViewBus files to ONE (the DRY reconcile the code already flags as owed); + coverage gate + one-bus gate + @390. Subscribe-on-render is done.
- **Shared dependency:** rollup-parent-status (d) also unblocks the pin demo oracle; the processing-CR sub-step (b) makes T40.1 render Tron's sketch. Both are prerequisites to the acceptance demo, not post-work.

NO status flipped. Pin / 37.4 / buildOrder / T40.1 checklist all left as-is (they back the pre-registered oracles).
