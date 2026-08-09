# R40.17 — Unify "what is current": ONE resolveSprintPin, explicit hint as override (kill the 2nd source)

**Author:** robbin-architect · 2026-08-08. Expert-flagged + PO-relayed finding: two sources of one truth for "what is current". Follow-on to R-C1 `resolveSprintPin` (shipped). DESIGN → expert builds → I backstop. No existing R40.17 doc (verified — not double-designing).

## MEASURED — the two sources (confirmed on disk, v0.8.74)
1. **`resolveSprintPin`** (`sprint-pin-resolver.ts:14`, Impl `af97137f`) — derives current PURELY from the Active-sprint set: `active = rows.filter(status==='Active')`; **`:30` THROWS on `active.length > 1`** (R-C1 INV-C1-4 fail-loud); `current = active.length===1 ? that : null`. **Takes NO hint input.** With 6 Active → unresolved (throws/fail-loud).
2. **`CurrentSprint.slotsFrom` / `load`** (`CurrentSprint.ts:88/92`) — derives the DISPLAYED 3-slot view from the singleton's **STORED HINTS** (`sprintName` / `nextBacklogOverride` / `lastCompletedUuid…`) + live task state → shows "Current: Task C2". It **ignores `resolveSprintPin`** entirely.

⇒ The screen (derived-from-stored-hint) says "C2"; the resolver (derived-from-Active-count) says unresolved. **Two functions answer "current" and disagree** — the same single-source disease as the 2 depref builders / 2 marker counts. R40.17 fixes it by making ONE function the answer.

## DESIGN — the explicit hint feeds INTO `resolveSprintPin`; consumers call it, never re-derive
`resolveSprintPin(idx, hint?)` becomes THE one function. `hint` = the singleton's explicit override (its `sprintName` → sprint number, plus the existing `nextBacklogOverride` / `lastCompleted*`).

**Rule — explicit-overrides-derived, VALIDATED against reality:**
1. Derive the Active set from files (unchanged, number-keyed).
2. `current` = the sprint the **explicit hint selects, IF that sprint is in the derived Active set** (hint validated). Else if exactly 1 Active → that one (derived). Else (`>1 Active` and no valid hint) → **FAIL-LOUD** (replaces the bare `:30` throw with reason `"N Active + no disambiguating hint — set the current-sprint hint or resolve checklists to one In-Progress"`).
3. The hint **disambiguates AMONG Active candidates; it CANNOT promote a non-Active or nonexistent sprint to current** (a hint pointing outside the Active set → FAIL-LOUD, never a fabricated current). "Explicit-overrides-derived" = explicit breaks the tie, constrained by reality — not an unconstrained hand-set that can lie.

**Single-source mechanics:**
- `CurrentSprint.slotsFrom` **CALLS `resolveSprintPin(idx, singletonHint)`** for the sprint-level current, THEN derives the TASK-level 3-slot WITHIN that resolved sprint. It STOPS deriving current from `sprintName` in parallel — otherwise that would be a THIRD source.
- All consumers (CurrentSprint, generator, tree-row, detail-header) get "current" from `resolveSprintPin`. The singleton's stored hint is an INPUT to it, not a parallel truth.

## INVARIANTS (extending R-C1's INV-C1-*)
- **INV-C1-9 ONE-current-function:** exactly one function (`resolveSprintPin`) answers "what is current"; every consumer calls it, none re-derives. Grep-lint BITE: no other `filter(status==='Active')` / current-from-`sprintName` derivation outside `resolveSprintPin` (a 2nd/3rd derivation fails the gate — INV-C1-8 lineage).
- **INV explicit-VALIDATED:** the hint may only SELECT among the derived Active set; a hint → non-Active/nonexistent sprint = FAIL-LOUD (no fabricated/resurrected current).
- **INV fail-closed (R-C3 lineage):** `>1 Active` and no valid hint → fail-loud with a named reason; hint resolves to nothing → fail-loud. A pin that cannot be determined is never silently guessed.

## ★ SEMANTIC FLAG for PO (my design judgment — your call)
Pure "explicit-ALWAYS-wins" (the hint overriding even a single clear Active) would **reintroduce the stale-hint drift R-C1 killed** — a stale `sprintName` hint could show the wrong current while the files clearly derive another. My design instead = **explicit-DISAMBIGUATES-within-the-validated-Active-set**: it honors explicit-overrides-derived for the REAL ambiguity (6 Active), while a stale hint cannot lie (points at a non-Active sprint → fail-loud). **Edge I'd rule fail-loud:** exactly 1 Active AND the hint names a DIFFERENT (also-Active? no — only 1 Active) sprint → surface the disagreement (stale hint) rather than silently letting either win. If you want pure "explicit-always-wins" instead, say so and I'll restate — but I recommend the validated form so R40.17 doesn't undo R-C1.

## GATE — distinct #126 BITE (no cross-wire)
- **two-source-BITE (the bug that started this):** for one fixed state, `CurrentSprint` displayed-current === `resolveSprintPin` current — they can never disagree.
- **disambiguation:** 6 Active + hint = S-N → current = S-N.
- **no-hint ambiguity:** 6 Active + no hint → FAIL-LOUD.
- **no-fabrication:** hint → a Done/Planned/nonexistent sprint → FAIL-LOUD (never a current that isn't Active).
- **stale-hint (per PO ruling):** 1 Active + hint names another → fail-loud (recommended) [confirm].
- **grep-lint:** only `resolveSprintPin` derives current (INV-C1-9); a re-introduced 2nd/3rd source fails CI.

## Chain + deploy
- Chain: R40.17 req → UC `currentPin.unifyExplicitOverride` → extend `SprintPinResolver.resolveSprintPin` (hint param) + `CurrentSprint` consumes → Impl → the two-source + grep-lint BITEs. req mints at build-go.
- Deploy: `sprint-pin-resolver.ts` + `CurrentSprint.ts` (client/shared) → client bundle → real restart (expert-owned deploy). I backstop: two-source-BITE green + grep-lint zero + fail-loud paths.
