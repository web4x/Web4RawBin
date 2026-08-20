# R40.1 — CR + workflow + derived-status mechanics (Tron directive #86, architect design)

robbin-architect 2026-08-20. Tron: T40.1 DECLINE minted a CR but NO ACTION (CR 4babebb1 ownerIor=Task 7a956c21, grep 'processing change request'=0 — mechanics d352f22d3 + ACs 77c2086c captured, never built). Design-only; req mints CRs under Test c4f8a1d6, expert builds, tester gates. **Every mechanic MUST render REALTIME via the ONE VIEW BUS (viewBusKey/live-bridge) — a reload does not satisfy Tron.**

**Measured now:** CR mint = `declineToChangeRequest` server.ts:1630 (ownerIor→Task); `attachTaskChangeRequests` :1429 finds CRs by `CR.task`/`CR.ownerIor`. Status: `deriveStatusEnum(checklist)` (task-status.ts) is THE single source, BUT server.ts:1639 writes `m.status='In Progress'` DIRECTLY on decline (single-writer VIOLATION). Pin: `getThreeSlots` (CurrentSprint.ts, derived, no stored pin; `nextBacklogOverride` exists; nextBacklog = next-not-done-in-sprint).

## (5) FIRST — DERIVED STATUS / single-status-writer (by-construction; everything else depends on it)
Tron sighted T37.25 showing 'QA Review' NOT from its checklist = a status WRITTEN, not derived. #2 and #4 both change status; if they WRITE it, they re-introduce the bug. So status is a **DERIVED GETTER over the checklist, single-sourced**:
- **Rule:** `model.status` is NEVER stored/written imperatively. It is `deriveStatusEnum(statusChecklist)` computed on read (already the pattern at server.ts:1426). The `statusChecklist` is the ONE source of truth; every state change edits the CHECKLIST, and status re-derives.
- **Fix the known violation:** server.ts:1639 `m.status='In Progress'` on decline → REPLACE with a CHECKLIST edit (the decline adds/uncrosses the appropriate step, see #2); status re-derives to the right value. No direct write.
- **detectStatusWrites gate (CI, must-fail):** a lint that flags any `model.status = <literal or non-derive>` write (allow ONLY `deriveStatusEnum(...)` at the read boundary). stub-must-fail: a seeded `m.status='Done'` trips it RED. This is the same by-construction discipline as the viewBusKey single-source (the derived value has ONE producer).
- **Realtime:** a checklist edit emits `ViewBus.notify(viewBusKey({type:'task',uuid}))` → the status badge re-derives live (this is exactly the badge live-MVC just proven at v0.8.116).
- **★ RENDER-SIDE guard (planner MEASURED: stored-vs-derived DRIFT=0 board-wide, T37.25 In-Progress everywhere on committed disk, INV-S5a already gates the unit level — so Tron's "T37.25 at QA Review" is NOT a stored-status bug).** Two candidates, and the guard must cover the second: (a) Tron MIS-SIGHTED the ADJACENT T37.24 (which genuinely IS QA-Review and IS the live currentTaskUuid) — a non-bug; OR (b) the GUI rendered a status the unit does NOT have = a **stale ViewBus/RENDER drift** — a REAL, worse bug, squarely the ONE-VIEW-BUS domain. **So (5) extends past stored-vs-derived to RENDER-vs-derived:** the displayed status (badge/checklist/scoreboard) MUST equal the unit's derived status at render time; the render reads the LIVE-derived value via the ViewBus (re-derives on unit-changed, never latches a stale status — same defect class as the badge live-MVC). **Gate:** a rendered-status == derived-status assertion at Tron's @390 viewport (pixel/DOM at the badge), stub-must-fail on a seeded stale render. **DISAMBIGUATE FIRST (measure, don't assume):** capture T37.25's ACTUAL rendered badge @390 — shows 'In Progress' ⇒ mis-sight (T37.24 adjacent), non-bug; shows 'QA Review' ⇒ real render-drift ⇒ fix the latch/stale-bus. Do not design the fix before the disambiguation says which.

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

## (3)+(4) THE PIN — ONE SOURCE by construction; auto-advance is DERIVED, not a written step
★ Planner MEASURED the bug with hard numbers: **TWO DISAGREEING SOURCES for "what is current"** (render reads one focus e.g. T37.24-QA; a STALE second e.g. T37.2/C2 disagrees) AND **no auto-advance mechanism (grep=0) ⇒ the pin is STUCK on QA-completed tasks = the board Tron sees "frozen."** So (3) is not "add an override" — it is **eliminate the second source**, and (4) makes advancement fall out of the derivation for free.
- **SINGLE-SOURCE derivation (the whole pin from ONE rule):** `current` = the ONE focus task **IF VALID**, else the first "not-past" task by build-order. **VALID focus = in-sprint AND not-Done AND NOT-QA-Review** (extend the existing valid-focus test, which already rejects done/out-of-sprint, to ALSO reject QA-Review). "not-past" = derived-status is In-Progress-or-earlier. `next`/`lastCompleted` derive from the same order+statuses. NO separately-stored "current"; the RENDER reads this derivation, never a parallel field.
- **(4) AUTO-ADVANCE = FREE by construction:** when the current (focus) task's derived status reaches **QA-Review**, the focus becomes INVALID (QA-Review) ⇒ the derivation falls through to the first not-past task ⇒ the pin AUTO-ADVANCES with NO written step, NO stored transition, evaluated fresh each read. That is why "stuck on QA tasks" cannot happen by construction (a QA-Review task is never the derived current). Trigger moves from the old DONE-not-QA to QA-Review — state this supersede.
- **(3) SET-AS-CURRENT is the ONLY manual input — a SINGLE, enforced-singular pointer:** `setAsCurrent(T)` = an ATOMIC transaction: set focus on T, CLEAR focus on ALL other in-sprint tasks. **INV-single-focus: ≤1 focus per sprint, gated (must-fail: 2 foci ⇒ RED)** — this IS the fix for the measured two-source split (the stale T37.2/C2 focus was a never-cleared second writer). Displaced old-current → NEXT: recorded in the ONE `nextBacklogOverride` field (a single source for the next-PREFERENCE, distinct from "current"; cleared when that task advances/Dones). T40.1 set-current ⇒ T37.25 → next. ✓
- **'CALCULATED' next — DETERMINISTIC:** next = `nextBacklogOverride` if set-and-still-valid, ELSE the FIRST not-past, not-current task by sprint build-order (array position; deps-satisfied if a DAG exists; ties by index); none left ⇒ first open task of next sprint by number. No heuristic.
- **★ FIELD-LEVEL COLLAPSE (PO's required addition — the two fields NAMED): `currentTaskUuid` (what the render reads, measured 5acdcc4c/T37.24) and `slots.current` (getThreeSlots output, measured 4bc1b3d5/T37.2·C2) currently hold DIFFERENT answers = the two-source bug.** AUTHORITATIVE = **`getThreeSlots.current` (the derivation from the single valid-focus rule above)**. `currentTaskUuid` is RETIRED as an independent value → it becomes a DERIVED READ equal to `getThreeSlots(...).current`; the render NEVER reads a separately-stored/passed current. (If a caller still needs a uuid, it takes `slots.current`, not its own field.) With one producer, the two can never diverge again — and here BOTH measured values are QA-Review, so the valid-focus rule rejects both and current derives to the first not-past task.
- **★ STUB-MUST-FAIL (PO required):** two gates a seeded divergence trips RED — (i) **≤1 focus per sprint** (seed 2 foci ⇒ FAIL) = the two-writer detector; (ii) **`currentTaskUuid` === `getThreeSlots.current`** at render (seed them different ⇒ FAIL) = proves the render reads the derivation, not a parallel field. A suite that stays green on a seeded divergence is inadmissible.
- **★ (4) UNSTICK ACCEPTANCE DEMO (PO):** because both candidate-currents are ALREADY QA-Review, the FIRST run of the single-source valid-focus-rejects-QA derivation must VISIBLY move the pin OFF a QA-Review task to the first not-past task **by itself, LIVE, no reload** (ViewBus emit). "Pin unsticks off QA on first run, live" IS the (4) acceptance.
- **Realtime:** setAsCurrent / any status change that flips validity emits `ViewBus.notify(current-sprint-singleton)` → pin re-renders live (R40.17 live-pin path); no reload.

## META — REALTIME via the ONE VIEW BUS (threaded through all 5)
Every seam that mutates a unit here MUST emit `ViewBus.notify(viewBusKey({type,uuid}))` on the ONE bus for each affected unit, reusing the hardened live-bridge/viewBusKey (v0.8.116): decline→CR (Test + Task), CR-resolve (Test + Task), checklist edit (Task badge/checklist), setAsCurrent/auto-advance (CurrentSprint singleton). Subscribed views (tree row, drawer detail/controls, badge, pin) re-render surgically — NO reload. **Gate each by the same live-MVC standard just proven** (IN-PLACE via the ViewBus callback, not a poll/reload; the row/badge/controls shapes apply).

## Build order + gating
1. **(5) derived-status + detectStatusWrites** FIRST (foundation; #2/#4 depend on it; fixes the :1639 violation).
2. **(1) CR re-parent** (structural rule + gated migration).
3. **(2) processing-CR sub-step** (derived from open-CR; supersede old AC).
4. **(3)/(4) pin setAsCurrent + auto-advance** (override + QA-trigger + deterministic calculated-next).
5. Realtime emits folded into each seam; gate every mutation live-MVC (no reload) + the derived-status/detectStatusWrites CI + the migration dry-run+count. Tester gates each by construction; Tron device @390 realtime confirm.

**CHOKEPOINT FLAG:** the CR-migration + any status-checklist rewrite touch `ScenarioIndex.put` — expert HOLDS for architect confirm; mint/migrate scenario-first, no chokepoint-change-by-availability.
