# R-C2 migration safety — hand-authored board adoption (architect design, 2026-08-07)

**Blocker (expert surfaced, correctly did NOT force):** the OWNED-OUTPUT guard (TRON: never clobber a file lacking `GENERATED_HEADER`) skips ~20 hand-authored `requirements.md` + ~10 `planning.md` → `checkSprint` fails them on any mismatch → board stuck 9/37, unreachable by regen. Forcing the regen would risk **losing hand-authored content**. So: AUDIT first (read-only, sizes data-loss risk), TRON decides, THEN migrate only what's proven safe.

## ★ SAFETY ENVELOPE (the whole point — no destructive write before proof)
**No hand-authored file is ever generator-overwritten until the AUDIT proves its units carry all its content** (or its units are backfilled to do so). The read-only audit is the GATE before any write. This upholds TRON's OWNED-OUTPUT rule (default = never clobber non-header files); the migration adds only an EXPLICIT, per-file, audited exception — never a blanket force.

## Classification (read-only audit → 3 classes, per hand-authored file)
- **(i) SAFE-MIGRATE** — units ⊇ file content (every requirement/task/AC/status in the file exists in the Sprint/Req/Task units; the file differs only by formatting/ordering/missing header). Adopting loses NOTHING.
- **(ii) NEEDS-BACKFILL** — the file carries substantive content the UNITS LACK. The FILE is currently the source of that content → back up: backfill the units FIRST (scenario-first), re-verify units ⊇ file, THEN it becomes SAFE-MIGRATE.
- **(iii) KEEP-HAND-AUTHORED** — genuine narrative not modelable as units (prose/rationale) → generator must NOT own it (R-C6 territory).

## Migration PROCEDURE (backfill-then-migrate; idempotent; reversible)
Ordered, each step atomic-commit + git-reversible:
1. **AUDIT (read-only, THIS task):** classify all 30 files. Output = the allowlist per class + (for ii) the exact missing content. **No writes.** ← the data-loss gate.
2. **TRON decides** on the facts (counts + risk). Only after go.
3. **(ii) BACKFILL units first (req/planner, scenario-first #126):** mint the missing requirements/ACs/tasks/statuses INTO the Sprint/Req/Task units so units ⊇ file. Then re-audit that file → it must flip to SAFE-MIGRATE (generated ⊇ file, 0 content lost). Backfill writes UNITS, never the generated md.
4. **(i)+(ii-backfilled) ADOPT (generator):** for ONLY the audited-safe allowlist, the generator generates-and-writes the file WITH the `GENERATED_HEADER` (so future regen owns it). A pre-write assertion: `generated_output ⊇ committed_file semantics` (no requirement/task/AC dropped) — abort that file if not. Atomic commit per batch.
5. **(iii) KEEP-HAND-AUTHORED:** EXCLUDE from `checkSprint`'s board-completeness scope (mark hand-authored, like the generator already excludes `design-*.md`/`PO-vision.md`) → `checkSprint` stops reporting them as `mismatched`. Permanent hand-authored (or R-C6 narrative-generator later).
6. **Verify:** re-run `check:sprint-md --all` → 37/37 minus the (iii) excluded (which are now out-of-scope, not failing).

## INVARIANTS
- **INV-M1 (no data loss):** a file is adopted ONLY after audit/back-fill proves units ⊇ its content; the ADOPT step asserts `generated ⊇ committed` and aborts on any dropped requirement/task/AC. Nothing hand-authored is lost.
- **INV-M2 (reversible):** every write is an atomic git commit over the prior committed state → `git revert` fully restores. No in-place destructive edit.
- **INV-M3 (idempotent):** re-running ADOPT on an already-adopted file = byte-identical (deterministic generator); re-running BACKFILL = 0-churn (units already carry it).
- **INV-M4 (guard intact):** the OWNED-OUTPUT guard stays the default; adoption is an EXPLICIT per-file allowlist from the audit — un-audited non-header files are STILL never clobbered.
- **INV-M5 (units untouched by the generator):** ADOPT writes only md (with header); BACKFILL writes only units (req/planner) — the two directions never mix; prod scenario data untouched.
