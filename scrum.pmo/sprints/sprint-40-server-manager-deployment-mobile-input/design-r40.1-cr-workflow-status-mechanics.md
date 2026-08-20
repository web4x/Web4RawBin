# R40.1 — CR + workflow + derived-status mechanics (Tron directive #86, architect design)

robbin-architect 2026-08-20. Tron: T40.1 DECLINE minted a CR but NO ACTION (CR 4babebb1 ownerIor=Task 7a956c21, grep 'processing change request'=0 — mechanics d352f22d3 + ACs 77c2086c captured, never built). Design-only; req mints CRs under Test c4f8a1d6, expert builds, tester gates. **Every mechanic MUST render REALTIME via the ONE VIEW BUS (viewBusKey/live-bridge) — a reload does not satisfy Tron.**

**Measured now:** CR mint = `declineToChangeRequest` server.ts:1630 (ownerIor→Task); `attachTaskChangeRequests` :1429 finds CRs by `CR.task`/`CR.ownerIor`. Status: `deriveStatusEnum(checklist)` (task-status.ts) is THE single source, BUT server.ts:1639 writes `m.status='In Progress'` DIRECTLY on decline (single-writer VIOLATION). Pin: `getThreeSlots` (CurrentSprint.ts, derived, no stored pin; `nextBacklogOverride` exists; nextBacklog = next-not-done-in-sprint).

## (5) FIRST — DERIVED STATUS / single-status-writer (by-construction; everything else depends on it)
Tron sighted T37.25 showing 'QA Review' NOT from its checklist = a status WRITTEN, not derived. #2 and #4 both change status; if they WRITE it, they re-introduce the bug. So status is a **DERIVED GETTER over the checklist, single-sourced**:
- **Rule:** `model.status` is NEVER stored/written imperatively. It is `deriveStatusEnum(statusChecklist)` computed on read (already the pattern at server.ts:1426). The `statusChecklist` is the ONE source of truth; every state change edits the CHECKLIST, and status re-derives.
- **Fix the known violation:** server.ts:1639 `m.status='In Progress'` on decline → REPLACE with a CHECKLIST edit (the decline adds/uncrosses the appropriate step, see #2); status re-derives to the right value. No direct write.
- **detectStatusWrites gate (CI, must-fail):** a lint that flags any `model.status = <literal or non-derive>` write (allow ONLY `deriveStatusEnum(...)` at the read boundary). stub-must-fail: a seeded `m.status='Done'` trips it RED. This is the same by-construction discipline as the viewBusKey single-source (the derived value has ONE producer).
- **Realtime:** a checklist edit emits `ViewBus.notify(viewBusKey({type:'task',uuid}))` → the status badge re-derives live (this is exactly the badge live-MVC just proven at v0.8.116).

## (1) CR RE-PARENT — CR is a CHILD OF THE TEST, not the Task
Tron: the test "maybe tested the wrong thing" ⇒ a CR is feedback ON the test ⇒ it hangs off the Test node.
- **Structural rule:** on a DECLINE of a Test's verdict, the minted CR gets `ownerIor → ior:instance:<testUuid>` (the Test whose verdict was declined — for R40.1, Test c4f8a1d6), AND keeps `CR.task → <taskUuid>` as the backref. ownerIor = the TREE parent (CR renders under the Test); CR.task = the backref the task's checklist reads (#2). Two links, distinct roles.
- **`declineToChangeRequest` change:** it must receive/resolve WHICH test's verdict was declined (the decline action already targets a Test verdict) and set `ownerIor→thatTest`. Not the Task.
- **Migration of existing orphan CRs (gated dry-run+count, R27.x discipline):** for each CR with `ownerIor→Task`: resolve its Test via (a) the declined-test reference if recorded, else (b) the task→coveredRequirement→Test chain when a SINGLE test exists; AMBIGUOUS (multiple tests, no recorded ref) → leave + FLAG (never guess). Re-point `ownerIor→Test`, keep `CR.task`. INV: no CR lost, every re-parented CR resolves to an existing Test, `CR.task` preserved, count before==after. Dry-run prints per-CR {old-owner, new-Test, ambiguous?}.
- **Realtime:** re-parent + new-CR emit `ViewBus.notify` for the Test node (CR child appears live) AND the Task (checklist sub-step, #2).

## (2) NEW SUB-STEP 'processing change requests' UNDER QA Review
Tron's EXACT shape (this SUPERSEDES the old AC 77c2086c 'QA Review stays [x]' — **Tron's new shape WINS, reconciled explicitly, old wording retired**):
```
Planned ☑
In Progress ☑
  refinement ☑
  creating test cases ☐
  implementing ☐
  testing ☐
QA Review ☐
  processing change requests ☐
Done ☐
```
- **By-construction (derived sub-step, not a stored flag):** the QA-Review section of a task's `statusChecklist` includes a `processing change requests` sub-step **present IFF the task has ≥1 OPEN CR** (CR reachable via `CR.task`, status=Open), and **checked IFF all its CRs are resolved**. While any CR is open: QA Review ☐ + processing-change-requests ☐. Status derives (#5) to 'QA Review' in the processing-CR sub-state.
- **Reconcile with old AC:** old '77c2086c: QA Review stays [x]' is SUPERSEDED — under an open CR, QA Review is ☐ (not done) with the sub-step, per Tron. State the supersede in the req AC (verify-owner-first: keep the old AC's Test as its own credit, mint the new-shape AC fresh).
- **Realtime:** CR open/resolve edits the checklist → `ViewBus.notify(task)` → the sub-step + badge render live.

## (3) SET AS CURRENT ⇒ previous current becomes NEXT
- **Rule:** `setAsCurrent(T)` sets `focus=T` (T becomes current by the existing focus-wins derivation) AND records the DISPLACED old-current as next via `nextBacklogOverride = <old-current uuid>`. So getThreeSlots yields current=T, nextBacklog=old-current (override). T40.1 set-current ⇒ T37.25 (old current) → next. ✓
- **Reconcile with the derived pin (INV-C1-9 no-stored-pin):** the override is the ONE sanctioned pin input (it already exists); it CLEARS when the old-current reaches Done (then nextBacklog re-derives normally). So the pin stays derived except for this explicit override, which is itself deterministic.
- **Realtime:** setAsCurrent emits `ViewBus.notify(current-sprint-singleton)` → the pin re-renders live (the R40.17 live-pin path).

## (4) WORKFLOW — work only on current until QA Review, then AUTO-ADVANCE
- **Rule:** agents work ONLY on the current task until its derived status reaches **'QA Review'**. On current→QA-Review: the pin AUTO-ADVANCES (focus moves from the QA-Review task to nextBacklog; nextBacklogOverride clears), and a NEW next is CALCULATED. The QA-Review task enters QA-pending (not current, not Done — awaiting Tron's approve→Done / decline→CR).
- **Trigger reconcile:** the existing pin auto-derives on DONE-not-QA — Tron moves the advance trigger to **QA-Review** (a task at QA is no longer the active-work current). State this supersede.
- **'CALCULATED' next — DETERMINISTIC:** next = the FIRST task, in the sprint's task-array order (array POSITION = build sequence per planning.md 'identity != position'), that is NOT Done AND NOT the new current AND (if a dependency DAG exists) has its dependencies satisfied. Ties broken by array index (total order). If the sprint has none left → the first open task of the next sprint by number (existing getThreeSlots fallback). Fully deterministic, no heuristic.
- **Realtime:** auto-advance emits `ViewBus.notify(current-sprint-singleton)` → pin re-renders live; no reload.

## META — REALTIME via the ONE VIEW BUS (threaded through all 5)
Every seam that mutates a unit here MUST emit `ViewBus.notify(viewBusKey({type,uuid}))` on the ONE bus for each affected unit, reusing the hardened live-bridge/viewBusKey (v0.8.116): decline→CR (Test + Task), CR-resolve (Test + Task), checklist edit (Task badge/checklist), setAsCurrent/auto-advance (CurrentSprint singleton). Subscribed views (tree row, drawer detail/controls, badge, pin) re-render surgically — NO reload. **Gate each by the same live-MVC standard just proven** (IN-PLACE via the ViewBus callback, not a poll/reload; the row/badge/controls shapes apply).

## Build order + gating
1. **(5) derived-status + detectStatusWrites** FIRST (foundation; #2/#4 depend on it; fixes the :1639 violation).
2. **(1) CR re-parent** (structural rule + gated migration).
3. **(2) processing-CR sub-step** (derived from open-CR; supersede old AC).
4. **(3)/(4) pin setAsCurrent + auto-advance** (override + QA-trigger + deterministic calculated-next).
5. Realtime emits folded into each seam; gate every mutation live-MVC (no reload) + the derived-status/detectStatusWrites CI + the migration dry-run+count. Tester gates each by construction; Tron device @390 realtime confirm.

**CHOKEPOINT FLAG:** the CR-migration + any status-checklist rewrite touch `ScenarioIndex.put` — expert HOLDS for architect confirm; mint/migrate scenario-first, no chokepoint-change-by-availability.
