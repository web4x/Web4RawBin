<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.18: Pin auto-progress on QA-Review — pin advances BY DERIVATION (explicit-wins-over-auto, lastCompleted-follows-DONE-not-QA), the shipped auto half of the pin mechanism

[task:uuid:46964040-9dbb-4454-94d0-6eafa1f64be7]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.18 `[requirement:uuid:ce2734ea-2590-4491-a9a3-3be22629cacb]`
  - down
    - [UC](./planning.md) `[uc:uuid:4715978d-8210-4441-9af0-0f7b5edc46f6]`

## Task Description

Switching a task to QA-Review AUTO-PROGRESSES the pin: the QA'd task leaves CURRENT, NEXT becomes CURRENT, a new NEXT is selected by SPRINT-COMPLETION ORDER. Precedence single-sourced in resolveSprintPin: EXPLICIT (R40.17 assigned) WINS over auto/derived — never clobbers Tron's manual choice, never a 2nd source. lastCompleted follows DONE (R40.10 approve), NOT QA (QA is not completion = no false Done). Idempotent, fail-loud (UNRESOLVED not silent-pick), 3-slot uniqueness reused, @390 visible without manual refresh. R40.17 = manual steering; R40.18 = auto so the pin moves BY ITSELF. Reuse R-C5 status derivation + R40.10 QA/approve + R40.17 action units + the existing resolver.

## Context

Covers R40.18 (ce2734ea) via UC 4715978d (pin.autoProgressOnQa) -> core Impl e9eb79e0 (slotsFrom, the derivation, Test 3f9c1e75) + observer Impl c0cfbbad (stale-steer LOG server.ts:1739, Test 7d4a1f83). Chain-complete-to-Test (32090be44). Completes R40.17 (manual assign) — together = the whole pin mechanism.

## Intention

Make R40.18's SHIPPED auto-progress half a schedulable, QA-Review-able deliverable (credited via the chain but had NO covering task = invisible + could not reach Tron's device bucket; mirror of the T40.17 live-pin reverse-credit-debt). req measure-finding 2026-08-12.

## Acceptance Criteria

- [ ] **(trigger-qa-auto-progresses)** TRIGGER: a task's state switching to QA-Review AUTO-PROGRESSES the pin — the QA'd task LEAVES current, NEXT becomes CURRENT, and a new NEXT is selected BY SPRINT-COMPLETION ORDER (the order that completes the sprint, per Tron's words).
- [ ] **(explicit-wins-over-auto-SINGLE-SOURCE)** ★ DESIGN-REQUIRED (precedence): EXPLICIT (R40.17 assigned) WINS over AUTO — auto-progress RESPECTS an explicitly-assigned next and NEVER clobbers Tron's choice. The precedence chain is ONE rule in ONE place: explicit-if-set ELSE auto/derived, decided INSIDE resolveSprintPin — never in a view or in a transition hook that keeps its own opinion (else two things fight over the same slots = two-sources-of-one-truth).
- [ ] **(lastCompleted-follows-DONE-not-QA)** ★ DESIGN-REQUIRED (lastCompleted semantics, architect call): QA is NOT completion. A task at QA-Review awaits Tron's verdict, so lastCompleted updates ONLY when it reaches DONE (R40.10 approve), NOT on the QA transition. Auto-progress moves CURRENT forward; lastCompleted follows DONE. Otherwise the board claims work completed that he has not signed (a false Done).
- [ ] **(idempotent)** IDEMPOTENT: re-entering QA, or a re-run, must NOT double-rotate the slots.
- [ ] **(fail-loud-unresolved)** FAIL-LOUD, never silent-pick: if the next-by-sprint-completion cannot be determined unambiguously, report it as UNRESOLVED — exactly as resolveSprintPin already does for the ambiguous current (it prefers saying 'I do not know' over guessing).
- [ ] **(uniqueness-3-slot)** 3-SLOT UNIQUENESS preserved (current / next / lastCompleted distinct) — REUSE the pin's existing enforcement, do NOT reimplement.
- [ ] **(device)** [DEVICE-ONLY @390 pixel — Tron on phone, un-mockable, NEVER headless-green, TRON-ONLY] After a QA-Review switch the pin's 3 slots visibly ROTATE on the @390 board WITHOUT a manual refresh (the auto-progress derivation reaches the render surface), or the board states why not. Real-device pixel gate — the tap/pixel verify is Tron's, never headless-green (R40.18 BITE-7). Retag of the former AC-device-390-visible to the AC-N-DEVICE convention (skill-expert request) so the device-bucket detector catch is GUARANTEED by id + tokens, not heuristic — turns Tron's device bucket 17->18.
- [ ] **(predicate-corrected)** CURRENT = the In-Progress task with the MAX lastAdvancedAt (SINGLE, deterministic, DERIVED at render, NEVER stored) — NOT first-by-order (which returned the never-started Planned task 37.4 = the stale pin Tron saw). An explicit designatedCurrent OVERRIDE (Tron's Set-Current) wins WHILE its target is non-terminal; first-Planned (next-to-start) is the FALLBACK only when NOTHING is In Progress. The stale stored currentTaskUuid is IGNORED — derive from LIVE status, never the stored pointer (R40.17). GATE: a resolver returning a Planned task while an In-Progress task exists -> RED; two In-Progress with different lastAdvancedAt not resolving to the max -> RED.
- [ ] **(recency-metadata)** lastAdvancedAt is SEAM-WRITTEN: TaskPolicy/UnitController stamps it as a CONSEQUENCE of any advance (a status transition OR a checklist sub-step tick); callers CANNOT set it (no caller-provided lastAdvancedAt in the intent bag — same no-back-door law as status, MvcBoundaryGuard-forbidden). The field is RECENCY metadata ONLY; status NEVER derives from it (orthogonal, like doneBasis). GATE: a caller writing lastAdvancedAt directly -> RED; status derived from lastAdvancedAt -> RED.
- [ ] **(multi-current)** ABSENCE: an untimestamped In-Progress task ranks LAST (a stamped task wins the single-current); if ALL In-Progress are untimestamped, the pin falls back to the SET (WIP=N, no arbitrary pick). TRANSPARENCY: the pin surface ALWAYS shows WIP=N whenever >1 task is In Progress, even once a single current is resolved by timestamp — concurrent work is never hidden (WIP>1 surfaced honestly, on-theme for consistency-by-construction).
- [ ] **(view-surface)** Item + detail views VISIBLY mark derived CURRENT and NEXT (isCurrent(task)/isNext(task) computed AT RENDER from the resolver), NEVER a stored flag (a stored 'current' is a stale 2nd source, R40.17). A distinct CURRENT marker on the derived-current row + NEXT on the derived-next — so the current task is NOT visually identical to the others (fixes Tron's 'other tasks before STALE'; today every S37 task renders identical '- [ ]').
- [ ] **(view-surface)** LIVE: the CURRENT/NEXT markers re-render via the MVC ViewBus (R37.12 slice-1) — a pin/status change emits and the markers MOVE with NO reload. Derivation + display + live = one coherent thing (live-and-correct, not live-and-wrong).
- [ ] **(all-channels)** ALL CHANNELS (Tron: realtime 'through web, business logic, skills'): ONE derivation consumed by the VIEW (marks current/next), the RESOLVER (business logic), and the SKILL/ENDPOINT (an agent moving a task to In Progress stamps lastAdvancedAt at the seam -> it becomes current BY DERIVATION -> emit -> live view). Single-source predicate (L2), no per-channel divergence. GATE: a 2nd current-derivation in any channel -> RED.
- [ ] **(view-surface)** The 'Set current'/'Set next' ACTIONS demote to explicit OVERRIDE (Tron's 1st defect: 'I see set current ACTION while it should BE the current'): the derived current shows BY DEFAULT (no press needed); the buttons are the EXCEPTION override — win WHILE the target is non-terminal, then auto-RESUME to derivation. The override is an INPUT (designation), NEVER a stored pin.
- [ ] **(view-surface)** The pin row renders the slot-label + the FULL taskDisplayName ('Task <n>.<m>: <title>', the R40.4 formatter) with NO mid-word truncation — wrap or a word-boundary ellipsis at a readable length, NEVER 'Objects...' (Tron's 2nd defect: unreadable cut-mid-word pin rows). GATE: a pin row cut mid-word -> RED. (Role/entity single-source lives on R40.4 AC-pin-role-entity-single-source.)
- [ ] **(migration)** BACKFILL (self-draining migration, distinct-intent UC task.backfillLastAdvancedFromGit 1c203897): S37 tasks get lastAdvancedAt from each unit's LAST status/checklist-CHANGING commit (git-derived, authoritative); the rest is a self-draining DEBT gate (report-only -> auto-strict-at-0 as the seam stamps new advances). Acceptance = REVERSIBILITY + content-conservation: NO invented timestamps — a task with no status/checklist-changing commit reports UNRESOLVED and ranks-last, never faked; NOT INV-T byte-diff (deliberate metadata add). Architect wires the UC chain on build-go.
- [ ] **(blocking-dependency)** R40.18's correct-VALUE (the pin shows the right current) is GREEN only after BOTH (a) the lastAdvancedAt SEAM-STAMP ships — a SMALL addition to TaskPolicy.apply on the EXISTING slice-1 seam, landing WITH R40.18 (its predicate NEEDS it), NOT gated behind the T37.4.x verdict data-merge (a separate concern that also uses the seam) — AND (b) BACKFILL 1c203897 runs (existing S37 tasks get lastAdvancedAt). BUILD ORDER within R40.18: seam-stamp -> backfill -> predicate/view. Until both land, the max-lastAdvancedAt derivation lacks data for pre-seam tasks (they rank-last / WIP=N fallback). Blocking-dependency (R40.25 AC-8 pattern) — the value-gate must NOT go green prematurely.

## Implementation

SHIPPED (v0.8.95) + chain-complete-to-Test (32090be44). Impls e9eb79e0 (slotsFrom derivation) + c0cfbbad (stale-steer LOG) BOTH markerPending=false; Tests 3f9c1e75 (pass, covers BITEs 1-idempotent/2-QA-advances/3-explicit-wins/4-lastCompleted/5-enum-not-symbol/6-fail-loud/7) + 7d4a1f83 (pass, BITE-6b observable-stale-steer) two-keyed both-dir. Planner VERIFIED both-dir on disk + verify-owner-first PASSED (both Tests are R40.18's OWN, no borrowed credit; e9eb79e0.tests[]=[3f9c1e75]<->impls, c0cfbbad.tests[]=[7d4a1f83]<->impls) -> FLIPPED to QA-Review 2026-08-12. AC-7-DEVICE @390 = Tron (turns device bucket 17->18). 0 Done till Tron verdict (R40.10).

## Subtasks

None (atomic task).
