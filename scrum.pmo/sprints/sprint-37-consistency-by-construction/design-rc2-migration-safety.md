# R37.2 migration safety — hand-authored board adoption (architect design, 2026-08-07)

**Blocker (expert surfaced, correctly did NOT force):** the OWNED-OUTPUT guard (TRON: never clobber a file lacking `GENERATED_HEADER`) skips ~20 hand-authored `requirements.md` + ~10 `planning.md` → `checkSprint` fails them on any mismatch → board stuck 9/37, unreachable by regen. Forcing the regen would risk **losing hand-authored content**. So: AUDIT first (read-only, sizes data-loss risk), TRON decides, THEN migrate only what's proven safe.

## ★ SAFETY ENVELOPE (the whole point — no destructive write before proof)
**No hand-authored file is ever generator-overwritten until the AUDIT proves its units carry all its content** (or its units are backfilled to do so). The read-only audit is the GATE before any write. This upholds TRON's OWNED-OUTPUT rule (default = never clobber non-header files); the migration adds only an EXPLICIT, per-file, audited exception — never a blanket force.

## Classification (read-only audit → 3 classes, per hand-authored file)
- **(i) SAFE-MIGRATE** — units ⊇ file content (every requirement/task/AC/status in the file exists in the Sprint/Req/Task units; the file differs only by formatting/ordering/missing header). Adopting loses NOTHING.
- **(ii) NEEDS-BACKFILL** — the file carries substantive content the UNITS LACK. The FILE is currently the source of that content → back up: backfill the units FIRST (scenario-first), re-verify units ⊇ file, THEN it becomes SAFE-MIGRATE.
- **(iii) KEEP-HAND-AUTHORED** — genuine narrative not modelable as units (prose/rationale) → generator must NOT own it (R37.6 territory).

## Migration PROCEDURE (backfill-then-migrate; idempotent; reversible)
Ordered, each step atomic-commit + git-reversible:
1. **AUDIT (read-only, THIS task):** classify all 30 files. Output = the allowlist per class + (for ii) the exact missing content. **No writes.** ← the data-loss gate.
2. **TRON decides** on the facts (counts + risk). Only after go.
3. **(ii) BACKFILL units first (req/planner, scenario-first #126):** mint the missing requirements/ACs/tasks/statuses INTO the Sprint/Req/Task units so units ⊇ file. Then re-audit that file → it must flip to SAFE-MIGRATE (generated ⊇ file, 0 content lost). Backfill writes UNITS, never the generated md.
4. **(i)+(ii-backfilled) ADOPT (generator):** for ONLY the audited-safe allowlist, the generator generates-and-writes the file WITH the `GENERATED_HEADER` (so future regen owns it). A pre-write assertion: `generated_output ⊇ committed_file semantics` (no requirement/task/AC dropped) — abort that file if not. Atomic commit per batch.
5. **(iii) KEEP-HAND-AUTHORED:** EXCLUDE from `checkSprint`'s board-completeness scope (mark hand-authored, like the generator already excludes `design-*.md`/`PO-vision.md`) → `checkSprint` stops reporting them as `mismatched`. Permanent hand-authored (or R37.6 narrative-generator later).
6. **Verify:** re-run `check:sprint-md --all` → 37/37 minus the (iii) excluded (which are now out-of-scope, not failing).

## INVARIANTS
- **INV-M1 (no data loss):** a file is adopted ONLY after audit/back-fill proves units ⊇ its content; the ADOPT step asserts `generated ⊇ committed` and aborts on any dropped requirement/task/AC. Nothing hand-authored is lost.
- **INV-M2 (reversible):** every write is an atomic git commit over the prior committed state → `git revert` fully restores. No in-place destructive edit.
- **INV-M3 (idempotent):** re-running ADOPT on an already-adopted file = byte-identical (deterministic generator); re-running BACKFILL = 0-churn (units already carry it).
- **INV-M4 (guard intact):** the OWNED-OUTPUT guard stays the default; adoption is an EXPLICIT per-file allowlist from the audit — un-audited non-header files are STILL never clobbered.
- **INV-M5 (units untouched by the generator):** ADOPT writes only md (with header); BACKFILL writes only units (req/planner) — the two directions never mix; prod scenario data untouched.

## ★ R37.7 BUILD-GRADE — 5 HARD GATES (Tron's data-loss invariant, non-negotiable) + BITE
TRON authorized the migration as R37.7, completeness-proven PER SPRINT. The procedure is now a real build with hard gates. A migrator `migrate-board.ts` (or extend generate-sprint-md) exposes `--prove <sprint>` (read-only proof) and `--apply <sprint>` (write, gated by proof), ONE sprint at a time.

- **GATE-1 — per-sprint UNITS-COMPLETENESS PROOF before ANY write.** For sprint S: extract the SUBSTANTIVE items from the hand file (every requirement line, task, AC, status) and from the generated-from-units output; assert **generated-items ⊇ hand-file-items** (set-inclusion on modeled content, ignoring formatting/whitespace/ordering/pure-prose). If ANY item is missing → `--apply` REFUSES sprint S + prints the missing items. No proof, no write.
- **GATE-2 — backfill-from-FILE-first where units lack content.** For a missing item (GATE-1 fail), the FILE is that item's source of truth → req/planner BACKFILL it INTO the Sprint/Req/Task units (scenario-first #126), re-run `--prove` → must now pass, THEN `--apply`. Backfill writes UNITS only; direction file→units→(re-prove)→md.
- **GATE-3 — idempotent + REVERSIBLE, one-sprint-at-a-time.** `--apply` does ONE sprint = ONE atomic git commit over the prior committed file; NEVER a bulk clobber. Re-`--apply` = byte-identical (deterministic generator). `git revert <that commit>` fully restores the hand file. 
- **GATE-4 — zero content loss PROVABLE by diff.** `--apply` emits the proof: a semantic diff showing the ONLY deltas between prior-file and generated are formatting/ordering/header — ZERO dropped requirement/task/AC/status. The commit records this proof. (generated ⊇ prior, semantically.)
- **GATE-5 — genuine-narrative stays hand-authored.** KEEP-HAND-AUTHORED files (prose/rationale, sprints.overview) are NEVER migrated → and are EXCLUDED from `checkSprint`'s board-completeness scope (marked hand-authored, like `design-*.md`) so they stop failing as `mismatched`. Narrative generation = R37.6 (separate).

### BITE gate (fail-loud PROVEN not asserted, [[correct-by-construction-needs-gate-verification]])
1. **BITE-refuse:** on a sprint, DELETE a requirement from the units but KEEP it in the hand file (units-incomplete) → `--prove`/`--apply` MUST REFUSE that sprint naming the missing requirement (GATE-1 bites). This is the core data-loss guard proven.
2. **BITE-narrative:** a KEEP-HAND-AUTHORED file → migrator classifies KEEP + never writes it (GATE-5).
3. **PASS path:** a SAFE-MIGRATE sprint → `--prove` passes → `--apply` writes with header, semantic-diff shows 0 content loss (GATE-4), commit; re-`--apply` byte-identical (GATE-3); `git revert` restores (GATE-3).
4. **BACKFILL path:** a NEEDS-BACKFILL sprint → `--apply` refuses → backfill units → `--prove` flips to pass → `--apply` succeeds (GATE-2).

### Chain (req mints R37.7 #126)
UC `board.migrateProvenComplete` → Class `BoardMigrator` → Method `proveComplete` + `applyMigration` → Impl → **Test = the BITE-refuse** (units-incomplete → refuse) + PASS/BACKFILL paths. Distinct Test (verify-owner-first). Migrator is scripts/CI-tooling → NO server restart. req mints; expert builds `--prove`/`--apply`; I backstop (BITE-refuse fail-loud + per-sprint proof + git-reversible + 0-loss diff).

## ★ PER-SPRINT CLASSIFICATION (read-only audit, evidence-based, 2026-08-07) — sizes the migration
**Totals:** (i) SAFE-MIGRATE = **9** · (ii) NEEDS-BACKFILL = **11** · (iii) KEEP-HAND-AUTHORED = **10** (+1 orphan dir). Clean cutover at S21.

### (i) SAFE-MIGRATE (9) — requirements.md S21–S29 (scenario-first era; units carry all reqs+ACs)
`--apply` can run these proven-only (G1 passes). **3 PRE-CHECK caveats before flipping ownership (G4):**
- **S24** — units have `description` but NO `tronQuote` → the PO directive quotes would be lost. Fold quotes into `description`/`tronQuote` first, OR Tron accepts the loss.
- **S27** — hand file body includes **R27.5**, which is modeled under **S28**'s `requirements[]` → the S27-only generated view DROPS R27.5. RE-LINK (content still in index) before flipping.
- **S29** — **R29.2** referenced in the hand file but is NOT an S29 unit → verify deferred/moved, not lost.
- All 9 also drop sprint-intro prose + `## Traceability Matrix` tables + `*(impl base:/design:)*` annotations = recomputable/minor; Tron decides whether to fold into `goal`/`description` first.

### (ii) NEEDS-BACKFILL (11) — requirements.md S08–S18 (units EMPTY or CORRUPT → G1 REFUSES). req+planner backfill FROM the hand file (G2) then re-prove.
- **6 FROM-SCRATCH authoring (reqUnits=0):** S08, S09, S12, S14, S15, **S17 (47 reqs — largest)**. Generator would erase 14–349 authored lines each if forced → G1 correctly refuses.
- **5 REPAIR of a prior lossy MD→unit migration:** S10, S11, S13, S16, S18 — units have markdown-table-rows as `name`, misaligned Tron quotes, missing altIds, missing whole reqs (R10.1/R11.1/R16.1/R-A1/R-T1), 0 ACs. Backfill = REPAIR (replace garbled units), not just fill.

### (iii) KEEP-HAND-AUTHORED (10) — all planning.md S01–S09 are DESIGN DOCS (architecture audits, crypto/API specs, ASCII dep-graphs, Sprint-Totals, DoD) — NOT modelable by the Sprint schema. Same class as sprints.overview → G5 (exclude from checkSprint scope; R37.6). 
- **+1 ORPHAN dir:** `sprint-20-traceability-first/planning.md` — NO Sprint unit maps to it (real S20 = `sprint-20-radical-forward-planning-traceability-first`, byte-matches). Stale DUPLICATE directory — not part of the 9/37 blockage; recommend delete/archive (planner call).

**Migration sizing:** 9 migrate-now (3 w/ pre-check) · 11 backfill-first (6 author + 5 repair) · 10 keep-hand + 1 orphan-dir cleanup. The classification CONFIRMS the 5 gates: G1 refuses all 11 incomplete sprints (the data-loss guard working by construction), G2 is the 11-sprint backfill path, G5 covers the 10 planning docs.
