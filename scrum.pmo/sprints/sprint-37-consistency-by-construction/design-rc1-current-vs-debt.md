# R-C1 pin shape — CURRENT (deterministic) vs DEBT (honest), two separate signals

**Author:** robbin-architect · 2026-08-07. PO design question after the frozen-exclusion refinement (b161f311f) left `resolveSprintPin` still throwing on 5 current-era Active `[19,20,21,25,37]` — because S19/20/21/25 hold non-terminal legacy tasks and the single-active INV made the pin a HOSTAGE to human-gated legacy cleanup (A1→Done needs Tron QA). Answer: **option (c), done as two signals.** The pin must be deterministic by construction AND must not lie about unfinished work — so those are TWO different questions, not one.

## The root confusion (why single-active was the wrong abstraction)
`INV-C1-4 single-current-fail-loud` assumed **"exactly one sprint has open work = that one is current."** Reality violates the premise: MANY sprints can carry open (non-terminal) work as *debt*, while exactly one is the *current focus*. Conflating "has open work" with "is current" made the pin throw whenever legacy debt existed. The fix is to stop conflating them.

## Design — TWO signals from the same file-derived data
### Signal 1: CURRENT (deterministic, never hostage to legacy hygiene)
**`current` = the HIGHEST-numbered current-era sprint with any OPEN work**, where OPEN = ≥1 task deriving `In Progress` or `QA Review` (actively moving; NOT Planned = not-started, NOT terminal = Done/superseded/cancelled).
- Deterministic BY CONSTRUCTION: the max is unique — no ambiguity, no throw, no dependence on whether S19-25 are cleaned up. S37 (open) resolves as current immediately even with 4 legacy debt-sprints below it.
- Progression axiom that makes this correct: sprint numbers only increase; the team always advances the highest started sprint. A lower-numbered sprint with open tasks is debt we moved PAST, not the current focus.
- `null` only when NO current-era sprint has open work (genuinely between sprints → `next-backlog` picks up).
- `last-completed` = highest fully-terminal (Done/closed) sprint below current; `next-backlog` = lowest Planned above current. (unchanged shape.)

### Signal 2: DEBT (honest, visible, never masked)
**`sprintsWithDebt` = every current-era sprint EXCEPT `current` that still has ≥1 non-terminal task**, each with its open-task count and a breakdown (In-Progress / QA-Review / Planned-but-in-a-closed-context). Emitted alongside the pin and surfaced in the board/overview.
- This is what keeps the pin from LYING: S19(15 In-Progress), S20/21/25(…) are LOUDLY reported as carrying debt — just not confused with "current."
- A sub-flag `activeDebt` (a non-current sprint with **In-Progress**, not merely QA-Review) = a workflow smell ("active work on a non-current sprint") → surfaced as a WARN in the debt signal, NOT a throw (it informs, never blocks the pin).

### What replaces INV-C1-4
- **INV-C1-4′ (deterministic current):** `current` = max-open-work sprint; unique by construction → no single-active throw. The old ambiguity throw is DELETED (it was the hostage mechanism).
- **INV-C1-6 (fail-closed vacuous) STAYS:** unresolvable task ref / empty index still REFUSE with a named reason — the fail-loud that's genuinely about data integrity, not about legacy hygiene.
- **INV-C1-11 (debt-visible, no-mask):** non-current sprints with open work MUST appear in `sprintsWithDebt` — the pin resolving does NOT erase unfinished work; a gate asserts `current + closed + sprintsWithDebt` accounts for EVERY current-era sprint (no sprint silently dropped — [[no silent caps]]).

## Why not (a) or (b)
- **(a) leave it** — makes the pin hostage to Tron's QA sign-off on ~40 legacy tasks; R-C6's overview can't generate until unrelated cleanup finishes. Rejected: couples a deterministic view to human-gated hygiene.
- **(b) `< max number = historical`, mask old open work** — deterministic but LIES (masks genuinely-unfinished work). Rejected: violates the honesty half. The debt signal is exactly what (b) throws away.
- **(c) two signals** — deterministic current + honest debt. Adopted.

## GATE — BITE
- **current-deterministic BITE:** S19/20/21/25 hold open tasks + S37 open → `current = S37` (NO throw), regardless of legacy state; toggling a legacy task's status does NOT change `current` (only the debt list).
- **debt-visible BITE:** the 4 legacy sprints appear in `sprintsWithDebt` with correct open counts; a sprint with open work that is NEITHER current NOR in the debt list = FAIL (no silent mask).
- **null-current BITE:** all current-era sprints terminal/Planned → `current=null`, `next-backlog` = lowest Planned.
- **fail-closed vacuous (retained):** unresolvable task ref → refuse.
- Golden fixtures F1/F2 (S35/36/37; S18 supersededBy) still hold; add F3 = the live 5-active state → current=S37 + debt[19,20,21,25].

## Impl-shape + sequence + the prefix guard
- IMPL-EDIT of the existing resolver (`sprint-pin-resolver.ts`, b161f311f): replace the `active.length>1 throw` with `current = maxBy(openSprints, num)`; add `sprintsWithDebt` to the returned `SprintPin`. NO new units. Keep the frozen-exclusion (isCurrentEra) + cancelledReason-terminal already built.
- **Prefix-collision guard lands in the SAME by-construction pass** — YES (PO asked): fold both the pin-shape fail-closed refinements AND the fail-closed-prefix-resolution guard (design-chainexcludesself-untangle.md §D: full-uuid chain refs + ambiguous-prefix refuse + trace-audit collision BITE) into **R-C3**'s fail-closed guard suite. Same family ([[false-low-worse-than-absent]]): a determination must never silently resolve on ambiguous/insufficient input — whether that's an ambiguous sprint-active set or an ambiguous uuid prefix.
- Sequence: this pin-shape refinement lands with/just after the R-C1 build, BEFORE R-C6's pin half consumes it. req/expert per the build queue; I backstop.
