# R40.18 — Pin auto-progress on QA-Review (detailed impl-shape)

**Author:** robbin-architect · 2026-08-12. Req `ce2734ea`. PO-requested because R40.18 had NO landed design (only the requirement) — closing the thin-design gap (the R36.4 lesson: a summary-level design produced an unclean build). Design → expert builds → I backstop. Pairs with R40.17 (manual steering); together = the whole pin mechanism.

## Measured state
- **No R40.18 design doc** on disk (the design list jumps r40.17→r40.19). Requirement is detailed; the IMPL-SHAPE was undesigned.
- **Two-level pin (measured):** (1) SPRINT-level `resolveSprintPin(idx, hint?)` (`sprint-pin-resolver.ts:115`) — current/last/next SPRINT, explicit `currentSprintNumber`/`nextSprintNumber` DISAMBIGUATES the Active set (R40.17). (2) TASK-level `CurrentSprint.slotsFrom` (`CurrentSprint.ts`) — WITHIN the resolved sprint, derives the current/last/next TASK 3-slot; already honors explicit `currentTaskUuid` (:216), `lastCompleted` (:250), `nextBacklog` (:268) overrides.
- **Governing philosophy (R40.17/R37.1, load-bearing):** "Files are the single source of truth; the pin is DERIVED (advance = RUN the resolver, never store)." INV-C1-9: exactly ONE function answers "current"; consumers CALL it, none re-derives.

## ★ THE impl-shape decision: DERIVATION, not a QA-transition HOOK
R40.18 auto-progress is at the TASK level. **Do NOT build a QA-transition hook that MUTATES a stored current-task pin.** A hook that writes the pin while `slotsFrom` derives it = two functions owning "current" = the exact two-source disease R40.17/INV-C1-9 kill. Instead:

**Auto-progress = the existing task-level derivation treats QA-Review as "has left current."** The current-TASK is DERIVED as: the first task in SPRINT-COMPLETION ORDER whose status is NOT terminal-for-current (not QA-Review, not Done, not Superseded/Cancelled). So when a task flips to QA-Review, it drops out of the current-eligible set BY DERIVATION and the next task becomes current — **with zero stored mutation, zero hook, idempotent by construction** (a pure function of task states; running it twice = same result → no double-rotate). The QA transition (R40.10) already writes the task's status; the next `slotsFrom`/render re-derives → the pin has advanced. Nothing else writes the pin.

## Derivation rules (inside `slotsFrom`, the ONE task-pin place)
- **current-TASK** = `explicit currentTaskUuid IF it is set AND still current-eligible (non-terminal)` ELSE `first task in sprint-completion order with status ∉ {QA-Review, Done, Superseded, Cancelled}` ELSE **FAIL-LOUD UNRESOLVED** (never a silent pick). — The precedence is ONE chain in ONE place (explicit-if-valid → auto-derive → fail-loud), never split across a view or a hook.
- **next-TASK** = `explicit nextBacklog IF set (validated: a not-Done task)` ELSE the task FOLLOWING current in sprint-completion order (skipping terminal). 3-slot uniqueness reused (current ≠ next ≠ lastCompleted).
- **lastCompleted** = the highest task in completion order with status **Done** (R40.10 approve) — **QA-Review is EXCLUDED** (QA is not completion; no false Done). This is why the QA'd task leaves *current* but does NOT become *lastCompleted* until it is approved to Done.
- **SPRINT-COMPLETION ORDER** = the sprint's task ordering (the `tasks[]`/planning order that, completed in sequence, completes the sprint — Tron's words). Reuse the existing order the sprint already carries; do NOT invent a new field.

## Precedence — explicit WINS, single-sourced (the DESIGN-REQUIRED AC)
- The `explicit currentTaskUuid` (R40.17 designation) WINS over auto **while it is still valid (its target non-terminal)**. Auto-derive fires only when no valid explicit is set → auto NEVER clobbers Tron's manual choice.
- **★ Semantic flag for PO (my judgment, your call — mirrors R40.17's stale-hint flag):** when the explicitly-pinned currentTaskUuid's task itself flips to QA/Done (the steered task completes), the explicit is STALE → auto-derive RESUMES (the designation is a steering nudge that is "used up" when its task completes, NOT a permanent lock). This is what makes "R40.17 = steer, R40.18 = auto-progress, together = whole mechanism" true. Alternative (pure explicit-locks-forever) would freeze the pin on a completed task — I recommend explicit-wins-WHILE-valid. Confirm.
- All consumers get the pin from `slotsFrom`/`resolveSprintPin` (INV-C1-9). **No QA hook keeps its own opinion.**

## Invariants + gate BITEs (extend R37.1/R40.17 INV-C1-*)
1. **auto-derive-idempotent:** running slotsFrom twice on one state = identical pin (pure derivation, no double-rotate). BITE: derive→derive, assert equal.
2. **QA-advances-current:** fixed state, flip task T (current) → QA-Review → re-derive → current = the next-in-order, T is no longer current, next re-selected. BITE with a real 2-task sprint.
3. **explicit-wins:** explicit currentTaskUuid set to a valid task → current = it even though auto would pick another; clear/complete it → auto resumes. BITE.
4. **lastCompleted-follows-DONE-not-QA:** flip T→QA → lastCompleted UNCHANGED; approve T→Done (R40.10) → lastCompleted = T. BITE (the false-Done guard).
5. **no-2nd-source (grep-lint, INV-C1-9 lineage):** no current-task derivation / no pin STORE outside slotsFrom/resolveSprintPin; a QA-transition hook that writes a current-pin fails CI.
6. **fail-loud-unresolved:** ambiguous / unresolvable task ref → UNRESOLVED named reason, never a silent pick (R37.3 lineage).
7. **@390 no-manual-refresh:** because it's live-derived, the view re-derives on render → the pin moves without a manual refresh; verify @390 real-WebKit the slot advances after a QA flip (device AC).

## Reuse (no new machinery)
R-C5/`deriveStatusEnum` status derivation · R40.10 QA/approve transition (the trigger that writes status) · R40.17 explicit-hint units + `resolveSprintPin` · the existing `CurrentSprint.slotsFrom` 3-slot + uniqueness. R40.18 ADDS only: (a) QA-Review counts as "left current" in the current-eligible filter, (b) the explicit-while-valid precedence line, (c) the BITEs. No hook, no stored pin, no new field.

## Bottom line
The one shape that makes this clean: **auto-progress is a DERIVATION (QA-Review = left-current), never a hook that stores the pin.** A summary-level design would likely say "add a QA hook that advances the pin" — which is precisely the two-source bug R40.17 killed and the unclean-build shape R36.4 warned about. Explicit-wins-while-valid, lastCompleted-follows-DONE-not-QA, idempotent-by-derivation, fail-loud, single-sourced. Expert builds to this; I backstop the 7 BITEs.
