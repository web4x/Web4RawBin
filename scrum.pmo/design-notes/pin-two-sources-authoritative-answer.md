# The Pin: two sources of one truth — authoritative answer (robbin-skill-expert, 2026-08-09)

**Read-only analysis. My domain (CurrentSprint pin owner). Settles "what is the current task" for the R40.17/R40.18 + R-C1 resolver design. No code/mint/board writes — this doc is the written answer.**

## TL;DR
There are **TWO independent pin systems feeding TWO surfaces at TWO granularities, with NO shared source.** That is the two-sources-of-one-truth bug — the same disease we killed on depref-builders / marker-counts. Tron's phone shows System A (a hand-set snapshot); the tooling reports System B (a live derivation that currently fail-louds). They were never wired to each other.

## COMMITTED STATEMENT (PO's 4 points, settled — robbin-skill-expert owns this)
1. **How many sources:** TWO. (A) the CurrentSprint singleton's STORED 3 slots — derived by `CurrentSprint.getThreeSlots()` from the singleton's own hand-set hints (focus + nextBacklogOverride + lastCompletedUuid); (B) `resolveSprintPin()` — a separate derivation from the index (Active-count), which IGNORES the singleton. They share no source ⇒ they disagree (screen=C2, resolver=UNRESOLVED).
2. **Which is authoritative:** SHOULD be `resolveSprintPin` (System B) — the R-C1 "computed-from-files, never hand-set" source. System A is a hand-set snapshot (stale by design). **The System-A writer must DIE**: retire the direct singleton hand-edit AND `getThreeSlots`-from-focus; the stored slots either get deleted or become a write-through cache written ONLY by resolveSprintPin. One writer, by construction.
3. **Precedence rule:** `DERIVE validated sets (Active/Closed/Planned + within-sprint current-TASK by CHAIN activity) → EXPLICIT hint DISAMBIGUATES WITHIN them → AUTO-on-QA transitions within them → else FAIL-LOUD`. The explicit hint can never fabricate a non-Active current (architect's guard, accepted).
4. **Can explicit-current unblock the ambiguous pin without masking the ambiguity? YES for the DISPLAY, NO for the audit — by construction:**
   - With 6 Active, an explicit-current naming ONE of the genuinely-Active sprints (e.g. S37) lets the DISPLAY resolve to it instead of throwing → the pin unblocks for Tron's screen.
   - It must NOT mask the truth: the 6-Active is a DATA defect (stale unclosed sprints 19/20/21/25 with lingering In-Progress checklists). The hint is a DISPLAY tie-breaker layered OVER the derivation — it does NOT mutate the derivation's inputs, does NOT flip any checklist, does NOT lower the Active-count.
   - So the **R-C5 honesty audit STILL computes + counts + surfaces "6 Active (4 stale)"** as an open defect until the checklists are reconciled. Display shows S37 AND the audit still screams "6 Active — fix the 4 stale."
   - Guard: explicit-current pointing at a NON-Active sprint is REJECTED (can't fabricate). It disambiguates among real-Active only; it can never hide that the other 5 are (wrongly) Active — the audit counts them regardless. **Unblock ≠ resolve; the data fix (R-C5) is what resolves.**

## System A — the STORED singleton (what Tron's screen shows)
- File: `scenario/index/c/u/r/r/e/current-sprint-singleton-0000-000000000001.scenario.json` (`ior:class:CurrentSprint`).
- The 3 slots ("Current: Task C2 / R-C2", "Last Completed: Task 36.5") are **STORED DATA on the unit** (`model.slots`) — **TASK-level**.
- Produced by `CurrentSprint.getThreeSlots()` (`src/ts/scenario/CurrentSprint.ts:166`), which derives from the singleton's OWN persisted state (`focus`/current + `nextBacklogOverride` + `lastCompletedUuid`) — **NOT** from `resolveSprintPin`.

**Q1 → STORED data, and a SECOND derivation independent of resolveSprintPin.**

**Q2 (who writes / when / stale):**
- Writers: (a) `planner-drive.ts` → `CurrentSprint.setFocus()`/persist (needs tsx); (b) **ME (robbin-skill-expert) via DIRECT singleton edit** when tsx is denied (my documented tsx-free method). The **C2 / Task-36.5 on Tron's screen right now is my hand-edit** — commit `666093e3e` (2026-08-08 pin advance S36→S37).
- When: on manual pin-advance events.
- **STALE: yes, by design.** It is a hand-set snapshot ("current as of my last advance"); nothing re-syncs it to the files afterward. It cannot self-heal.

## System B — resolveSprintPin (the R-C1 computed resolver)
- File: `src/ts/scenario/sprint-pin-resolver.ts:108` (impl `af97137f`). **SPRINT-level** (returns the current *sprint*, not task).
- Rule: `current` = the ONE Active sprint (≥1 In-Progress non-superseded task; a QA-pending-only sprint does NOT qualify, INV-C1-3); **>1 Active = FAIL-LOUD (INV-C1-4), never a silent pick**; `last` = highest-number Closed; `next` = lowest-number Planned with number > current. Frozen legacy (num ≤ `FROZEN_LEGACY_MAX`=18) is excluded by construction.
- Consumed by: `consistency-guard.ts` (the gate) + `sprint-overview-generator.ts` (R-C6 generated overview). **NOT wired to the CurrentSprint unit Tron sees.**

**Q3 (rule + why it differs):** it recomputes purely from the index and finds **6 sprints compute Active [21,20,40,19,37,25]** → refuses to pick → UNRESOLVED. It differs from System A because A trusts my hand-set `focus` (one definite task) while B ignores the singleton and counts Active sprints index-wide. **The 6-count is inflated by STALE UNCLOSED old sprints (19,20,21,25) whose task checklists still read In-Progress — the same dual-status disease R-C5 targets.** So B's "UNRESOLVED" is a correct fail-loud on bad DATA, not a broken rule.

## Q4 — authoritative TODAY vs what SHOULD be
- **TODAY (de-facto):** System A (stored singleton = my hand-edit) is what renders on Tron's screen → authoritative for DISPLAY. System B is authoritative for the GATE + generated overview but currently throws. **The two surfaces literally disagree — that is what Tron is feeling.**
- **SHOULD BE:** `resolveSprintPin` (System B) is the single source of truth — it is the R-C1 "computed-from-files, never hand-set" design. The CurrentSprint stored slots must become **either (a) deleted, or (b) a write-through CACHE written ONLY by resolveSprintPin**. The two illegitimate writers — **my hand-edit AND `getThreeSlots`-from-focus — must be RETIRED.**
- **Granularity gap to close:** resolveSprintPin is SPRINT-level; Tron's display is TASK-level ("Current: Task X"). The resolver must be extended to also pick the current TASK *within* the current sprint — **by chain activity** (impl/test markers / build-go), NOT by `model.status` (all 6 S37 tasks read status=Planned while R-C2's impl marker `b31ae393` is already at HEAD — task-FSM lags chain-credit; see my S37 pin-advance feed-forward).

## The precedence rule R40.17 + R40.18 must build against (ONE rule, INSIDE resolveSprintPin)
**Refined form (I ACCEPT robbin-architect's guard, doc a3daa5c7c input-only): the explicit hint DISAMBIGUATES WITHIN the validated set — it can never fabricate a non-Active current. This keeps R40.17 steering AND R-C1's no-hand-set-drift, by construction.**

`current = DERIVE(validated sets) → EXPLICIT disambiguates within them → AUTO transitions within them`
1. **DERIVE:** compute Active / Closed / Planned from files (existing resolveSprintPin logic + the new within-sprint current-TASK pick by CHAIN activity). This defines the *validated* candidate sets.
2. **EXPLICIT (R40.17 — assign as current/next):** a declarative steering directive stored ON a task/sprint unit that the resolver READS. It **only disambiguates within a validated set** — if >1 Active and the hint names one of them → pick it (honestly resolves the INV-C1-4 tie); for `next`, the hint picks which Planned. A hint pointing at a target OUTSIDE its status class (e.g. "current = a non-Active sprint") is **IGNORED + surfaced, never obeyed** — no fabrication. This is the ONE legitimate override, and it replaces my hand-edit as a directive the resolver consumes, NOT pre-baked slots.
3. **AUTO (R40.18 — auto-progress on QA):** on QA-pass the resolver applies the current→next transition itself within validated states (no hand-set).
4. **Residual ambiguity with NO valid hint = FAIL-LOUD (unchanged).**

**The 6-Active ambiguity is cleared by R-C5 reconciling the stale old-sprint checklists (data fix) — NOT by the resolver silent-picking, and NOT by a hint fabricating a winner.** Fail-loud stays; the hint only breaks ties among genuinely-Active candidates.

## Bottom line for the architect (design to these semantics)
- Make `resolveSprintPin` the SINGLE pin source; retire System A as an independent writer (delete or cache-only).
- Extend it: SPRINT current (have it) → TASK current within-sprint by CHAIN activity (new).
- Implement precedence `explicit ELSE auto ELSE derived` inside it; explicit/auto write DECLARATIVE directives on units, never pre-baked slots.
- Keep fail-loud; let R-C5 clear the stale-checklist data that inflates Active to 6.
- Until wired: **stop hand-editing the singleton** (me included) — every hand-edit is a fresh second-source.
