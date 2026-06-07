# Planner: S2-S9 Sprint.tasks[] Backfill — Status

**Date:** 2026-06-07
**Owner:** robbin-planner
**Pointer:** robbin-po

## Directive (PO 2026-06-07)
1. Sprint.tasks[] BACKFILL for the 8 empty Sprints (S2-S9) — wire their committed task units so Sprint-no-children flag clears.
2. After architect's R18.19 design, apply zero-pad sweep (01-18) to all Sprint names.
3. (Follow-up) Re-run scripts/regenerate-views.ts / generate-sprint-md.ts to sync S18 planning.md with the Sprint unit's 11 tasks; ensure Sprint type included in fetchDetailChildren.

## Status

### R18.19 zero-pad (#2): ✓ DONE BEFORE I ACTED
Architect `2276be51` already renamed 9 Sprint units (S1 → "Sprint 01", … S9 → "Sprint 09"). S10-S18 already 2-digit. `model.number` stays int for sort. Verified live: all 8 empty S2-S9 units show "Sprint 02 — Identity & SSH" through "Sprint 09 — Room Identity".

### S18 planning.md sync (#3a): ✓ DONE
Re-ran `npx tsx scripts/generate-sprint-md.ts 5b950725-a6f6-4d45-b802-4784ee6ef962`:
- ✓ planning.md
- ✓ 11 task .md files emitted (T187/T188/T189/T190 + T191/T192/T193/T194 + T195/T197/T198)
- 12 markdown links in planning.md

Generator commit reference: bc11d861 (planner: S18 dogfood COMPLETE).

### Sprint type in fetchDetailChildren (#3b): NOT MY LANE
This requires code change in the trace browser client (Sprint type added to the detail-children fetch handler) — architect/expert work, not planner board sync. Flagged for the appropriate role.

### S2-S9 backfill (#1): BLOCKED — historical Task units don't exist
**Census finding** (planner, 2026-06-07):
- 8 Sprint scenario units S2-S9 each have `model.tasks = []`
- 117 Task scenario units total in `scenario/index/`; 11 have a `sprint` pointer (the S17/S18 dogfood tasks)
- **106 Task units have no `sprint` pointer** — but their `name` fields show T81+ (S10 onward). All 92 T-numbered Task names parse to numbers ≥ 81.
- **ZERO Task scenario units exist for T7-T80 (the S2-S9 historical range).** S2-S9 tasks predate the scenario-unit migration and were never created as JSON units.

**So the "backfill" is mis-scoped as a wiring exercise.** The S2-S9 Task scenario units must be CREATED first (historical task unit creation project, ~50-70 units across T7-T80 with names/descriptions sourced from `scrum.pmo/sprints/sprint-N-*/task-*.md` legacy files + git commit history). Once those units exist, wiring `Task.sprint` + `Sprint.tasks[]` is mechanical.

This is the same shape of project as the "Pre-S16 UC Gap" the architect resolved in cascade `452f8d5d` (created 13 UCs for S1-S14 tasks-with-tests). For Tasks themselves, it's a bigger pass — every historical S2-S9 task.

### Recommendation to PO
Pick ONE:
- **(a)** Stand up a new Task-creation pass (T199-style: planner-first scaffold + architect content + tester verify) covering S2-S9 historical tasks. ~50-70 Task units; substantial work; probably needs the same wave-batch split that R18.9-R18.28 used.
- **(b)** Defer S2-S9 historical unit creation; clear the Sprint-no-children verify flag with a "by-design pending historical migration" note. The empty S2-S9 Sprints don't block any active sprint work.
- **(c)** Bound the scope: only create units for S2-S9 tasks-with-tests (analogous to architect's path A from S17 cascade) — smaller subset.

I have NOT created any historical task units autonomously — too much interpretive content to author without role specialization. Awaiting your call.

### PO DECISION 2026-06-07: (b) DEFER

> "Don't author the 50-70 historical S2-S9 Task units now — not blocking active work. Clear the Sprint-no-children verify flag with a 'by-design — S2-S9 historical task-unit migration deferred' note in the task file + the S18/verify board. Re-openable as a dedicated migration sprint if Tron wants full historical completeness." — robbin-po

**Rationale (PO):** S2-S9 are closed/QA-approved sprints. Their empty `tasks[]` on the Sprint scenario unit does NOT block any active S17/S18 work. The verify flag (`Sprint-no-children`) is downgraded from FAIL to **by-design / deferred** for S2-S9 specifically. Active sprints (S10+) must continue to have populated Sprint.tasks[] — the deferral applies ONLY to the historical S1-S9 range.

**Re-open condition:** Tron explicitly requests full historical completeness (e.g., for a chain audit or trace-tree completeness pass). At that point, a dedicated migration sprint covers S2-S9 (and S1 if needed) using the same wave-batch pattern used for R18.9-R18.28 + T191-T199. Estimate: ~50-70 Task units + ~20-40 Subtask units; multiple batches over a session.

### Verify-flag adjustment

**`Sprint-no-children` flag (last tester run):** 8 Sprints flagged (S2-S9). Per PO decision (b):
- S2-S9: **DEFERRED — by-design** (historical task-unit migration not in scope)
- S10+ (if any): real FAIL — must be backfilled (none currently flagged; spot-checks pass)

The audit tooling (`scripts/trace-audit-strict.mjs` etc.) should treat S1-S9 empty `tasks[]` as orphan-by-design analogous to TraceLink units. If the gate currently FAILs on this, architect should add the allowlist hook so the gate doesn't block on historical Sprint emptiness.

### Decision commit
- PO direction received 2026-06-07 via otmux (post `7a88d664` planner status report)
- This task file updated with the decision + rationale
- Pointer back to PO: planner pane → robbin-po one-line "decision recorded"

### Follow-on (planner-tracked, NOT immediate)
- If S2-S9 historical migration is later requested, this file becomes the entry point for the new sprint's scoping doc.
- The "(c) bounded" option (tasks-with-tests only) remains viable as a middle path if full migration is too large.

## Commits in this work
- `2276be51` (architect) R18.19 zero-pad applied — 9 Sprint units renamed
- `bc11d861` (planner) S18 dogfood COMPLETE — Sprint.tasks=11 + Sprint.requirements=20; generator emits 11 task md
- (no new planner commit for S2-S9 backfill — blocker reported instead)
