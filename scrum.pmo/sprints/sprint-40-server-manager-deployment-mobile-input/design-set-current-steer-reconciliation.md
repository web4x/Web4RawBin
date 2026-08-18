# Set-as-Current — reconciling R40.44 (retire) vs R40.37 (offer): the ruling I stand behind

robbin-architect 2026-08-18. PO caught a real contradiction between my two rulings. **Honest reconciliation, no defending.** Design-only; Tron decides the product question. req's R40.37 AC-SET-CURRENT-NEXT semantics revise per this.

## The contradiction — and which I stand behind: (A) R40.44, DERIVED-ONLY
- **(A) R40.44 (`7cb9617fb`, MY ruling):** RETIRE Set-current/Set-next — a manual override is the SECOND SOURCE that stale-picked 78ea801d3 and "lied to Tron for days"; the pin is DERIVED (current = the In-Progress task with MAX `lastAdvancedAt`), two-source impossible-by-construction. It explicitly left open "future-(b)-labeled-override IF a workflow surfaces."
- **(B) R40.37 today:** I "CONFIRMED set-current/next IS the explicit-steer surface (`CurrentSprint.currentTaskUuid`, owner-gated), not a regression."
- **These cannot both hold, and (B) is my ERROR.** I pointed Set-as-Current at the EXISTING `currentTaskUuid` / `/api/current-sprint/designate` mechanism (server.ts:1801) — but THAT mechanism is exactly the stored-winning-pin second source R40.44 retired. Confirming it as "the intended steer" would re-introduce the lying-pin Tron suffered. **I withdraw the part of (B) that legitimized a stored steer.** The tester's ground truth (UNIVERSAL_DECLS expose only qa-approve/qa-decline; set-current retired by construction) is correct; I stand behind (A).
- What in (B) SURVIVES: only the MECHANISM is fine — the R40.37 `appliesTo{when}` visibility matrix, the (d) one-action-surface, the open-file action. What was WRONG was the SEMANTICS of what Set-as-Current DOES (store a designation that wins). Matrix ok; action-meaning not.

## Tron's ask is the "future-(b)" case — grant it WITHOUT a second source
R40.44 anticipated this: a workflow now wants "make this task current." The binary the PO framed (manual-steer-with-divergence vs derived-no-button) DISSOLVES if the button drives a DERIVATION INPUT instead of a competing pin:
- **★ RECOMMENDED — Set-as-Current = ADVANCE the task (derivation-not-hook, L1):** the action bumps the task's `lastAdvancedAt` to now (via the SEAM, owner-gated, emits) and ensures it is In-Progress. The DERIVED resolver then picks it as current BECAUSE it is now the max-`lastAdvancedAt` In-Progress task. **No stored winning pin, no second source, nothing to diverge** — the pin stays 100% derived. "Make a task current" == "advance it," which IS the derived model. Tron gets the button AND keeps the never-lies guarantee. (Set-as-Next = the analogous derivation input for the next-Planned pick — a backlog-order the resolver reads, not a stored next-pin.)
- **Fallback — HINT-that-fail-louds (only if a stored designation is truly needed, e.g. the >1-Active-sprint disambiguation at resolver:145):** a designation is read ONLY to disambiguate and FAIL-LOUDS when it diverges from the files (never silently wins) — which resolver:145 already does (it throws on ambiguity). NEVER a stored pin that wins silently. This is strictly worse than advance-based (it keeps a divergable value) — use only where derivation genuinely can't disambiguate.

## R40.44 removal STANDS
Remove `/api/current-sprint/designate` + `handlePinDesignate` (the silent-winning-pin route, server.ts:1801). A "make current" button, if Tron approves, is ADVANCE-based (option a) — it does NOT resurrect designate. So R40.44 and a future Set-as-Current are NOT in conflict: one deletes the lying-pin route, the other (if wanted) drives the derivation.

## The product question is Tron's; my design input narrows it
The PO rightly puts it to Tron. My input: **there is no real tradeoff to accept** — advance-based Set-as-Current gives the button with ZERO divergence risk, so "manual steer back" need NOT mean "accept a hand-set pin that can diverge." If Tron wants the button: build it advance-based. If he prefers no button: derived-only stands, R40.44 as-is. Either way, NO stored winning pin.

## ★ SET-AS-NEXT ruling (2026-08-18, measured) — PERMANENTLY EMPTY cell, no button
Set-as-Current = ADVANCE (bump lastAdvancedAt → derived current). **Set-as-Next has NO honest form:**
- Measured (sprint-pin-resolver.ts:155-157): next = the lowest-number Planned sprint > current. Next-ORDER **is** sprint-NUMBER = fixed Tron-controlled identity (only Tron increments sprints) — there is NO reorderable per-item backlog-order to "move into," so a reorder-based set-next (the analog of advance) is NOT buildable. The sole override is the stored `nextSprintNumber`/`nextBacklogOverride` = the IDENTICAL lying-pin, one slot over → REFUSE.
- Task level is worse: there is NO derived "next task" at all (current task = derived max-lastAdvancedAt In-Progress; "next task" has no derivation basis), so a task Set-as-next could ONLY be a stored second source with nothing to fall back to.
- ⇒ The matrix cell is **honestly empty (no button), full stop** — not "pending a reorder input." Tron told plainly: "next" follows from sprint-number order; you make a task current by ADVANCING it; there is no "next" pin to set (a button would re-create the removed lie). Matrix: current=neither · next=Set-as-Current(advance) only · other=Set-as-Current+open-file · open-file=all. No Set-as-next anywhere.

## Handoff
- req: R40.37 AC-SET-CURRENT-NEXT — keep the matrix + one-surface + open-file; REVISE the action semantics from "designate/store steer" to "ADVANCE (bump lastAdvancedAt via seam)" pending Tron's yes/no. AC-SET-NEXT-VISIBILITY-MATRIX matrix unchanged. R40.44 removal unaffected.
- No build; Tron decides. If yes → Set-as-Current wires to an advance-through-seam (emits, live per the AC-3 cross-view path); gate: no stored currentTaskUuid pin written, the pin resolves purely from lastAdvancedAt, and a divergence is impossible (nothing to diverge).
