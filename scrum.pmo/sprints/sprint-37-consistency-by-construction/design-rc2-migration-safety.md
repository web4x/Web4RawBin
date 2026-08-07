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

## ★ R-C7 BUILD-GRADE — 5 HARD GATES (Tron's data-loss invariant, non-negotiable) + BITE
TRON authorized the migration as R-C7, completeness-proven PER SPRINT. The procedure is now a real build with hard gates. A migrator `migrate-board.ts` (or extend generate-sprint-md) exposes `--prove <sprint>` (read-only proof) and `--apply <sprint>` (write, gated by proof), ONE sprint at a time.

- **GATE-1 — per-sprint UNITS-COMPLETENESS PROOF before ANY write.** For sprint S: extract the SUBSTANTIVE items from the hand file (every requirement line, task, AC, status) and from the generated-from-units output; assert **generated-items ⊇ hand-file-items** (set-inclusion on modeled content, ignoring formatting/whitespace/ordering/pure-prose). If ANY item is missing → `--apply` REFUSES sprint S + prints the missing items. No proof, no write.
- **GATE-2 — backfill-from-FILE-first where units lack content.** For a missing item (GATE-1 fail), the FILE is that item's source of truth → req/planner BACKFILL it INTO the Sprint/Req/Task units (scenario-first #126), re-run `--prove` → must now pass, THEN `--apply`. Backfill writes UNITS only; direction file→units→(re-prove)→md.
- **GATE-3 — idempotent + REVERSIBLE, one-sprint-at-a-time.** `--apply` does ONE sprint = ONE atomic git commit over the prior committed file; NEVER a bulk clobber. Re-`--apply` = byte-identical (deterministic generator). `git revert <that commit>` fully restores the hand file. 
- **GATE-4 — zero content loss PROVABLE by diff.** `--apply` emits the proof: a semantic diff showing the ONLY deltas between prior-file and generated are formatting/ordering/header — ZERO dropped requirement/task/AC/status. The commit records this proof. (generated ⊇ prior, semantically.)
- **GATE-5 — genuine-narrative stays hand-authored.** KEEP-HAND-AUTHORED files (prose/rationale, sprints.overview) are NEVER migrated → and are EXCLUDED from `checkSprint`'s board-completeness scope (marked hand-authored, like `design-*.md`) so they stop failing as `mismatched`. Narrative generation = R-C6 (separate).

### BITE gate (fail-loud PROVEN not asserted, [[correct-by-construction-needs-gate-verification]])
1. **BITE-refuse:** on a sprint, DELETE a requirement from the units but KEEP it in the hand file (units-incomplete) → `--prove`/`--apply` MUST REFUSE that sprint naming the missing requirement (GATE-1 bites). This is the core data-loss guard proven.
2. **BITE-narrative:** a KEEP-HAND-AUTHORED file → migrator classifies KEEP + never writes it (GATE-5).
3. **PASS path:** a SAFE-MIGRATE sprint → `--prove` passes → `--apply` writes with header, semantic-diff shows 0 content loss (GATE-4), commit; re-`--apply` byte-identical (GATE-3); `git revert` restores (GATE-3).
4. **BACKFILL path:** a NEEDS-BACKFILL sprint → `--apply` refuses → backfill units → `--prove` flips to pass → `--apply` succeeds (GATE-2).

### Chain (req mints R-C7 #126)
UC `board.migrateProvenComplete` → Class `BoardMigrator` → Method `proveComplete` + `applyMigration` → Impl → **Test = the BITE-refuse** (units-incomplete → refuse) + PASS/BACKFILL paths. Distinct Test (verify-owner-first). Migrator is scripts/CI-tooling → NO server restart. req mints; expert builds `--prove`/`--apply`; I backstop (BITE-refuse fail-loud + per-sprint proof + git-reversible + 0-loss diff).
