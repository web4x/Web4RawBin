# The Pin: two sources of one truth — authoritative answer (robbin-skill-expert, 2026-08-09)

**Read-only analysis. My domain (CurrentSprint pin owner). Settles "what is the current task" for the R40.17/R40.18 + R37.1 resolver design. No code/mint/board writes — this doc is the written answer.**

## TL;DR
There are **TWO independent pin systems feeding TWO surfaces at TWO granularities, with NO shared source.** That is the two-sources-of-one-truth bug — the same disease we killed on depref-builders / marker-counts. Tron's phone shows System A (a hand-set snapshot); the tooling reports System B (a live derivation that currently fail-louds). They were never wired to each other.

## ★ RECONCILIATION 2026-08-11 (READ FIRST — resolves the L40↔L47 contradiction; the (c)-BOTH ruling)
The expert found L40 and L47 disagreed: **L40** derives the within-sprint current TASK by CHAIN ACTIVITY; **L47** has the explicit hint disambiguate the SPRINT — read together, "assign Task X current" would resolve X's sprint yet still show a chain-derived Task Y≠X. That is the two-sources disease living in the design itself. RULING (mine, R40.17 semantics owner):
- **(c) BOTH, one function.** Assigning a task as current sets the SPRINT (= that task's sprint, resolved by resolveSprintPin) AND the TASK slot (= that task).
- **Chain-activity is the DEFAULT task-slot pick; an EXPLICIT task-uuid designation OVERRIDES it.** No designation → chain-activity picks the within-sprint task; Tron's explicit pick wins when present. (This is the fix that makes L40 and L47 agree.)
- **The hint is a declarative directive INPUT-ONLY to resolveSprintPin** (stored on the singleton, read by the resolver) — NEVER pre-baked slots, never a second store.
- **The multi-Active audit count is NEVER reduced by a hint** — display disambiguation only; R37.5 keeps counting the stale-Active sprints until the data is reconciled.
- **DESIGNATION ≠ ACTIVE (resolves the S33/S34 gap).** MEASURED 2026-08-11: S33 (15 tasks) + S34 (7) are ALL Done → CLOSED, not Active (`deriveSprintStatus`: Active needs ≥1 In-Progress). A task DESIGNATION may point at a task in ANY sprint incl a Closed one; it is ALWAYS displayed WITH the task's real derived sprint status ("Current: Task 33.x — S33·Closed"), so it never fabricates Active and never refuses the owner. The "hint outside its status class = ignored+surfaced" rule in step-2 below governs ONLY resolveSprintPin's SPRINT-LEVEL ACTIVE answer (a stale hint can't claim a non-Active sprint holds active WORK); the TASK designation is a separate, honestly-labeled pointer, NOT gated on the Active set.
- **THE INVARIANT, precisely (PO ruling 2026-08-11, adopted verbatim):** an explicit OWNER DESIGNATION is NOT a fabrication — **the never-fabricate invariant constrains the DERIVATION, never the owner.** So the designation is UNCONSTRAINED but LABELED (shows the designated sprint/task with its REAL derived status, e.g. Closed), and the within-Active constraint governs ONLY the derived sprint-level answer. **Precedence: explicit designation → derive → fail-loud UNRESOLVED** — and a VALID designation is NEVER replaced by an error on the owner's screen (fail-loud is for the *derived* answer when there is no valid designation, not a way to refuse the owner's explicit pick).
- **R37.5 COLLISION — RULED (PO 2026-08-11, my recommendation adopted):** assign-as-current sets DESIGNATION only — **NO status write, ever.** Making a task actually in-progress (so its sprint becomes Active) is a CHECKLIST edit and the owner's DELIBERATE act under R37.5 (derived-status single source) — **NEVER a pin-button side-effect.** ★ PROHIBITION (implementer MUST read this): a button that silently mutates task status would MANUFACTURE Active sprints as a by-product of designation — that is the authored-status disease wearing a new hat (the same class that produced the 17 bare unverdicted Dones). The assign-as-current/next button writes ONLY the designation directive on the singleton; it must not touch any task's `statusChecklist` or `status`. Reactivation is a separate, explicit checklist edit by the owner.

## COMMITTED STATEMENT (PO's 4 points, settled — robbin-skill-expert owns this)
1. **How many sources:** TWO. (A) the CurrentSprint singleton's STORED 3 slots — derived by `CurrentSprint.getThreeSlots()` from the singleton's own hand-set hints (focus + nextBacklogOverride + lastCompletedUuid); (B) `resolveSprintPin()` — a separate derivation from the index (Active-count), which IGNORES the singleton. They share no source ⇒ they disagree (screen=C2, resolver=UNRESOLVED).
2. **Which is authoritative:** SHOULD be `resolveSprintPin` (System B) — the R37.1 "computed-from-files, never hand-set" source. System A is a hand-set snapshot (stale by design). **The System-A writer must DIE**: retire the direct singleton hand-edit AND `getThreeSlots`-from-focus; the stored slots either get deleted or become a write-through cache written ONLY by resolveSprintPin. One writer, by construction.
3. **Precedence rule:** `DERIVE validated sets (Active/Closed/Planned + within-sprint current-TASK by CHAIN activity) → EXPLICIT hint DISAMBIGUATES WITHIN them → AUTO-on-QA transitions within them → else FAIL-LOUD`. The explicit hint can never fabricate a non-Active current (architect's guard, accepted).
4. **Can explicit-current unblock the ambiguous pin without masking the ambiguity? YES for the DISPLAY, NO for the audit — by construction:**
   - With 6 Active, an explicit-current naming ONE of the genuinely-Active sprints (e.g. S37) lets the DISPLAY resolve to it instead of throwing → the pin unblocks for Tron's screen.
   - It must NOT mask the truth: the 6-Active is a DATA defect (stale unclosed sprints 19/20/21/25 with lingering In-Progress checklists). The hint is a DISPLAY tie-breaker layered OVER the derivation — it does NOT mutate the derivation's inputs, does NOT flip any checklist, does NOT lower the Active-count.
   - So the **R37.5 honesty audit STILL computes + counts + surfaces "6 Active (4 stale)"** as an open defect until the checklists are reconciled. Display shows S37 AND the audit still screams "6 Active — fix the 4 stale."
   - Guard: explicit-current pointing at a NON-Active sprint is REJECTED (can't fabricate). It disambiguates among real-Active only; it can never hide that the other 5 are (wrongly) Active — the audit counts them regardless. **Unblock ≠ resolve; the data fix (R37.5) is what resolves.**

## System A — the STORED singleton (what Tron's screen shows)
- File: `scenario/index/c/u/r/r/e/current-sprint-singleton-0000-000000000001.scenario.json` (`ior:class:CurrentSprint`).
- The 3 slots ("Current: Task 37.2 / R37.2", "Last Completed: Task 36.5") are **STORED DATA on the unit** (`model.slots`) — **TASK-level**.
- Produced by `CurrentSprint.getThreeSlots()` (`src/ts/scenario/CurrentSprint.ts:166`), which derives from the singleton's OWN persisted state (`focus`/current + `nextBacklogOverride` + `lastCompletedUuid`) — **NOT** from `resolveSprintPin`.

**Q1 → STORED data, and a SECOND derivation independent of resolveSprintPin.**

**Q2 (who writes / when / stale):**
- Writers: (a) `planner-drive.ts` → `CurrentSprint.setFocus()`/persist (needs tsx); (b) **ME (robbin-skill-expert) via DIRECT singleton edit** when tsx is denied (my documented tsx-free method). The **C2 / Task-36.5 on Tron's screen right now is my hand-edit** — commit `666093e3e` (2026-08-08 pin advance S36→S37).
- When: on manual pin-advance events.
- **STALE: yes, by design.** It is a hand-set snapshot ("current as of my last advance"); nothing re-syncs it to the files afterward. It cannot self-heal.

## System B — resolveSprintPin (the R37.1 computed resolver)
- File: `src/ts/scenario/sprint-pin-resolver.ts:108` (impl `af97137f`). **SPRINT-level** (returns the current *sprint*, not task).
- Rule: `current` = the ONE Active sprint (≥1 In-Progress non-superseded task; a QA-pending-only sprint does NOT qualify, INV-C1-3); **>1 Active = FAIL-LOUD (INV-C1-4), never a silent pick**; `last` = highest-number Closed; `next` = lowest-number Planned with number > current. Frozen legacy (num ≤ `FROZEN_LEGACY_MAX`=18) is excluded by construction.
- Consumed by: `consistency-guard.ts` (the gate) + `sprint-overview-generator.ts` (R37.6 generated overview). **NOT wired to the CurrentSprint unit Tron sees.**

**Q3 (rule + why it differs):** it recomputes purely from the index and finds **6 sprints compute Active [21,20,40,19,37,25]** → refuses to pick → UNRESOLVED. It differs from System A because A trusts my hand-set `focus` (one definite task) while B ignores the singleton and counts Active sprints index-wide. **The 6-count is inflated by STALE UNCLOSED old sprints (19,20,21,25) whose task checklists still read In-Progress — the same dual-status disease R37.5 targets.** So B's "UNRESOLVED" is a correct fail-loud on bad DATA, not a broken rule.

## Q4 — authoritative TODAY vs what SHOULD be
- **TODAY (de-facto):** System A (stored singleton = my hand-edit) is what renders on Tron's screen → authoritative for DISPLAY. System B is authoritative for the GATE + generated overview but currently throws. **The two surfaces literally disagree — that is what Tron is feeling.**
- **SHOULD BE:** `resolveSprintPin` (System B) is the single source of truth — it is the R37.1 "computed-from-files, never hand-set" design. The CurrentSprint stored slots must become **either (a) deleted, or (b) a write-through CACHE written ONLY by resolveSprintPin**. The two illegitimate writers — **my hand-edit AND `getThreeSlots`-from-focus — must be RETIRED.**
- **Granularity gap to close:** resolveSprintPin is SPRINT-level; Tron's display is TASK-level ("Current: Task X"). The resolver must be extended to also pick the current TASK *within* the current sprint — **by chain activity** (impl/test markers / build-go), NOT by `model.status` (all 6 S37 tasks read status=Planned while R37.2's impl marker `b31ae393` is already at HEAD — task-FSM lags chain-credit; see my S37 pin-advance feed-forward). **[RECONCILED 2026-08-11: chain-activity is the DEFAULT task-slot pick; an EXPLICIT task-uuid designation (R40.17 assign-as-current) OVERRIDES it — see the Reconciliation block at top.]**

## The precedence rule R40.17 + R40.18 must build against (ONE rule, INSIDE resolveSprintPin)
**Refined form (I ACCEPT robbin-architect's guard, doc a3daa5c7c input-only): the explicit hint DISAMBIGUATES WITHIN the validated set — it can never fabricate a non-Active current. This keeps R40.17 steering AND R37.1's no-hand-set-drift, by construction.**

`current = DERIVE(validated sets) → EXPLICIT disambiguates within them → AUTO transitions within them`
1. **DERIVE:** compute Active / Closed / Planned from files (existing resolveSprintPin logic + the new within-sprint current-TASK pick by CHAIN activity). This defines the *validated* candidate sets.
2. **EXPLICIT (R40.17 — assign as current/next):** a declarative steering directive stored ON a task/sprint unit that the resolver READS. It **only disambiguates within a validated set** — if >1 Active and the hint names one of them → pick it (honestly resolves the INV-C1-4 tie); for `next`, the hint picks which Planned. A hint pointing at a target OUTSIDE its status class (e.g. "current = a non-Active sprint") is **IGNORED + surfaced, never obeyed** — no fabrication. This is the ONE legitimate override, and it replaces my hand-edit as a directive the resolver consumes, NOT pre-baked slots. **[RECONCILED 2026-08-11: an explicit task-uuid designation ALSO sets the TASK slot (= the designated task, OVERRIDING the chain-activity default) and its SPRINT (via that task's sprint). A designation may point at a task in a Closed/QA-pending sprint — it is displayed WITH the task's real derived status, never fabricating Active; the "ignored if outside status class" rule here governs the SPRINT-LEVEL ACTIVE answer ONLY. See the Reconciliation block at top.]**
3. **AUTO (R40.18 — auto-progress on QA):** on QA-pass the resolver applies the current→next transition itself within validated states (no hand-set).
4. **Residual ambiguity with NO valid hint = FAIL-LOUD (unchanged).**

**The 6-Active ambiguity is cleared by R37.5 reconciling the stale old-sprint checklists (data fix) — NOT by the resolver silent-picking, and NOT by a hint fabricating a winner.** Fail-loud stays; the hint only breaks ties among genuinely-Active candidates.

## Bottom line for the architect (design to these semantics)
- Make `resolveSprintPin` the SINGLE pin source; retire System A as an independent writer (delete or cache-only).
- Extend it: SPRINT current (have it) → TASK current within-sprint by CHAIN activity (new).
- Implement precedence `explicit ELSE auto ELSE derived` inside it; explicit/auto write DECLARATIVE directives on units, never pre-baked slots.
- Keep fail-loud; let R37.5 clear the stale-checklist data that inflates Active to 6.
- Until wired: **stop hand-editing the singleton** (me included) — every hand-edit is a fresh second-source.
