# Owned-Output Delete-Guard — DESIGN (anti-regression, stub-must-fail)

**By:** robbin-architect 2026-08-09, per PO. SCOPE = **guard design only** — the generator diagnosis is skill-expert's lane (owns generate-sprint-md); I take its finding as input. Deleted docs: pin-two-sources-authoritative-answer.md / R31-traceability-audit-RESULT.md / release-tagging.md (all hand-authored, no marker).

## INPUT (skill-expert diagnosing; not re-run here)
skill-expert's lead: generate-sprint-md has NO delete code + an **owned-output confinement whitelist committed at `0c7b29c7b`** — so either that confinement **REGRESSED** (plausibly via tonight's Option-1 revert, which also reverted build.mjs) or a **different reconcile path** deletes. Read-only diff in progress. My design must hold under BOTH outcomes — and especially under "confinement regressed," where the fix is a RESTORE and the durable job is making the regression impossible to reintroduce.

## THE GUARD — a generator may only touch files it OWNS (write AND delete)
Correct-by-construction, same principle as the C7 rule (*legacy is authoritative until a completeness proof*) + R37.3 fail-closed. One shared helper (`scripts/owned-output-guard.ts`) every generator / regen / reconcile / prune path routes through:
1. **Create/replace** ONLY a file in the generator's declared owned-whitelist AND (if it already exists) carrying that generator's `GENERATED_HEADER`. Never clobber an unmarked file.
2. **Delete** ONLY a file carrying the generator's `GENERATED_HEADER`. **NEVER delete an unmarked file** — unmarked = hand-authored until proven otherwise. A prune that encounters an unmarked file in its dir LEAVES it (may WARN, never `rm`).
3. Path-confinement: no `/`-escaping / `..` names (as generate-sprint-md already does).

## ★ THE VALUABLE HALF — the BITE must fail if the GUARD ITSELF is absent (stub-must-fail)
The lesson tonight is that a confinement living only as inline code **can silently revert** (Option-1 reverted build.mjs; it can revert a whitelist just as quietly). **A confinement that can silently disappear is not a guard.** So the BITE is not "did a file get deleted" — it is "**is the protection present and effective**," the same stub-must-fail standard the tester applied to the device-AC lint:
- **B1 behavioural (protection works):** plant a hand-authored file (no marker) in each generator's target dir → run the generator (write + any prune) → assert it SURVIVES byte-identical, un-clobbered, un-deleted. A prune that removes it → RED.
- **B2 anti-regression (protection PRESENT):** assert the guard is actually wired — every generator's write/delete goes THROUGH `ownedOutputGuard` (not an ad-hoc `fs.writeFileSync`/`unlinkSync` that bypasses it). Concretely: (a) a static check that no generator script calls `unlinkSync`/`rmSync`/`writeFileSync` on a `scrum.pmo/**` path except via the helper; (b) a **negative BITE** — a stub generator that tries to delete an unmarked file MUST be REFUSED by the helper; if the helper is removed/weakened so the stub succeeds, the suite goes RED. So a silent revert of the confinement **breaks CI**, not a knowledge doc.
- **B3 idempotent + fail-closed:** on an ambiguous/unmarked target the helper REFUSES (never "assume generated").
Fold into `ci:gates` (the R37.3 fail-closed family, beside the fabricated-uuid + prefix-expansion guards). This is what converts "restore the confinement" (a one-time fix if it regressed) into "the confinement cannot vanish undetected" (permanent).

## SCOPE vs the freeze
generate-sprint-md.ts, sprint-overview.ts, the shared helper + BITEs = **`scripts/`** → **BUILDABLE UNDER THE FREEZE** (no src/ts, no restart). If skill-expert's diagnosis finds a src/ts server-side generator also deletes, that adoption queues post-GO; the scripts-side guard + the anti-regression BITE land now.

## INTERIM (refine the PO's fleet rule)
- Keep: "after ANY regen, `git status` for `D` lines + restore unowned from HEAD before commit."
- ADD: if skill-expert confirms a REGRESSION, the immediate fix is **restore `0c7b29c7b`'s confinement**; then the B2 anti-regression BITE lands so this class can't silently recur. If instead a *different reconcile path* deletes, route THAT path through the same helper + it's covered by the same B1/B2.
