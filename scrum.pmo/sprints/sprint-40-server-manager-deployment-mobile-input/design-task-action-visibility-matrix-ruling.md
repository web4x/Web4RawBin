# Task-action visibility matrix — ruling (architect, 2026-08-18)

Tron: add an open-Task-file action + Set-as-Current / Set-as-next on non-current tasks; "not yet consistent → not ok to approve." Resolve the apparent contradiction with R40.18 defect-2 (which RETIRED Set-current/Set-next). **Design only; expert finishes the 2-root approve fix FIRST — no interleave.** Reuse R40.37 + R40.18, no new machinery. Report committed.

## (a) NO contradiction — confirmed. Retired from the DERIVED PIN ≠ offered ON A TASK
R40.18 defect-2 retired hand-set Set-current/Set-next **from the derived pin SLOTS** — the pin is COMPUTED from files, never hand-set (tester verified absent). But my R40.18 ruling ALSO established the **explicit STEER**: `CurrentSprint.currentTaskUuid` — an owner designation that WINS while valid and AUTO-RESUMES when the steered task reaches Done (the observable stale-steer, BITE-6b). Measured on disk: server.ts:2586 "an owner designation WINS and is shown"; server.ts:860-865/1772 stale-steer auto-resume (LOG-ONLY, **never a pin write**); server.ts:1790 owner-gated; server.ts:1813 writes `{sprintName, currentTaskUuid}` (current) / `{nextSprintName, nextBacklogOverride}` (next).
⇒ Offering Set-as-Current ON A TASK **writes that explicit steer, not the derived pin.** Different surface, different meaning. It is the explicit-steer half of R40.18, NOT a pin regression. The pin STAYS derived (resolver reads steer + files); the steer is a declared owner-override INPUT to the resolver, never a hand-set pin value (derivation-not-hook, L1).

## (b) THE VISIBILITY MATRIX — declared via R40.37 `appliesTo{when}`, resolved once by `applicableActionsFor`
Two predicates over the unit's currency: `isCurrent(unit)` / `isNext(unit)` (derived from the resolver — the same computed pin, not a stored flag). New `ActionDecl`s (`action-applicability.ts`, alongside qa-approve/decline):

| task state | Set-as-Current | Set-as-next | open-file |
|---|---|---|---|
| **current** | — (hidden) | — (hidden) | ✓ |
| **next** | ✓ | — (hidden) | ✓ |
| **every other** | ✓ | ✓ | ✓ |

- `set-as-current`: `appliesTo:{ types:['task'], when: ctx => !isCurrent(ctx.unit) }` (shown on next + all others; hidden on current).
- `set-as-next`: `appliesTo:{ types:['task'], when: ctx => !isCurrent(ctx.unit) && !isNext(ctx.unit) }` (all others only; hidden on current AND next).
- `open-file`: `appliesTo:{ types:['task'] }` (ALL tasks — a navigation/read action, no currency condition). Opens the task's `sourceFile`/slug.md.
The matrix FALLS OUT of the two predicates — declared-not-defaulted (L5), resolved ONCE in the shared bar (no per-view if-chain), `onInvalid:'hide'`.

## (c) Set-as-Current/next writes the explicit steer THROUGH THE SEAM — YES
- Route through the OWNER-GATED endpoint (server.ts:1790, "only the owner steers the pin" — 403 for non-owner) AND the mutation SEAM (`UnitController.apply`) so the steer write EMITS → the pin + affected task rows live-update (no reload). NEVER a direct pin write.
- The pin REMAINS derived: the resolver reads `currentTaskUuid`/`nextBacklogOverride` + files and computes the slots — R40.18's derived-pin invariant is untouched. The steer is the sanctioned override input, not a stored pin value.
- The stale-steer AUTO-RESUME stays intact + observable (BITE-6b): Set-as-Current on task X sets `currentTaskUuid=X`; when X reaches Done the designation is used up → auto-progress resumes (logged, never silent).
- `open-file` is READ-ONLY (nav) — no seam write, no emit.

## (d) ONE action surface — the bar; the detail body renders DATA, never duplicate actions (structural)
Tron: the detail body renders the same actions TWICE — bar BUTTONS (Scenario/Edit/Approve/Decline) + inline LINKS in the body (Scenario, Edit, Task file). Same DRY law as the sprint-name two-implementations (name the FAMILY: **duplicated-action-surfaces** = a second source of the SAME affordance).
- **PRINCIPLE (structural, not a patch):** the ACTION BAR is the SINGLE action surface; the detail body renders DATA only. Make duplication IMPOSSIBLE, not forbidden: the detail renderer must DERIVE its actions from the SAME action registry the bar uses (`applicableActionsFor` + the R40.37 decls) — if the body has no independent action-render path, a duplicate cannot exist (structure-over-process; the shape survives the next feature).
- **★ ORDERING DEPENDENCY (Tron's "can THEN be removed"):** the inline body links may be removed ONLY AFTER `open-file` exists as a real dynamic action (b) — else we delete the ONLY route to the task file. Sequence: (1) add `open-file` (+ set-current/next) as decls; (2) THEN strip the inline Scenario/Edit/Task-file links from the detail body; (3) gate that the body renders zero action affordances. Never step-2 before step-1.

## Gates (each stub-must-fail; report-only→strict)
1. Visibility BITE per (currency-state × action): current→{−,−,open}; next→{current,−,open}; other→{current,next,open}. A Set-as-next OFFERED on the next task, or either steer on the current task → RED.
2. `currentTaskUuid`/`nextBacklogOverride` written ONLY via the owner-gated seam endpoint (grep-lint: no other writer) → a direct pin/steer write elsewhere → RED. The R40.18 derived-pin gate STILL passes (no hand-set pin).
3. non-owner Set-as-Current → 403 (fail-closed, same family as approve AC-2).
4. after Set-as-Current on X then X→Done: the steer expires, auto-progress resumes, and it is LOGGED (BITE-6b observable) → RED if the steer persists or drops silently.
5. **(d) one surface:** the detail BODY renders ZERO action affordances (Scenario/Edit/Task-file/etc. come only from the bar via `applicableActionsFor`) → RED if any action link is rendered in the body. Ordering: this gate goes strict only AFTER `open-file` decl ships (else it would demand removing the sole route to the file).

## Reuse / handoff (no ballooning)
Reuse: R40.37 `applicableActionsFor` + `appliesTo{when}` (the whole visibility mechanism), R40.18 explicit-steer + stale-steer (server.ts:857-865/1790-1813), UnitController seam + emit (live), the owner gate. Missing units for req: 3 `ActionDecl`s (set-as-current / set-as-next / open-file) as ACs on the R40.37 action req + the R40.18 steer req — no new sprint. Backstop @390 on ship (pixel): the matrix renders per-state; Set-as-Current live-moves the pin; non-owner 403.
