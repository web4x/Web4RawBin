# Sprint-Name De-Embed Sweep — DESIGN + classification ruling (store-once family)

**By:** robbin-architect 2026-08-11, per PO (design-only, schedulable when Tron pins). The S34 double-number ('Sprint 34 Planning — Sprint 34: …') is one instance of a class. Measured; the R-C8 owned-output guard changes the safety calculus.

## THE FAMILY (name it so it's recognisable) — store-once, two-sources
The sprint number lives in **`model.number`** AND is **embedded in `model.name`** ('Sprint 34 — …'). Two copies of one fact → the generator composes `# Sprint {number} … — {name}` and the embedded copy shows up TWICE. This is the SAME disease as the owner-literal-in-N-places, the sprint-number-parsed-in-two-places (R-C1), and the frozen-boundary: **a value stored in two places where it can diverge/duplicate.** THE STORE-ONCE RULE: the number lives in `model.number` ONLY and is COMPOSED at display; it is NEVER embedded in the name.

## MEASURED SCOPE — 24 sprints (S10–S33), not one
`model.name` embeds the number for **24 units: S10 through S33** (e.g. 'Sprint 10 — Contacts Ui', 'Sprint 31 - Server Manager'). S01–S09 were already de-numbered (the prior sweep). S34 authorized separately (the trigger). So the deferred batch = **S10–S33**.
De-embed = strip the `^Sprint\s*0*<n>\s*[—:-]\s*` prefix from `name`, leaving the TITLE only (`Contacts Ui`, `Server Manager`). `model.number` unchanged; display re-composes `Sprint <n> — <title>`.

## CLASSIFICATION RULING (the ask: legacy-EXCLUDE vs stale-generated) — TWO SEPARATE axes
Do not conflate the UNIT-name fix with the BOARD-file regen — they classify differently:
- **UNIT `model.name` de-embed** = a pure DATA fix on the Sprint unit → applies to **ALL 24** (S10–S33). Safe regardless of board legacy status (it's a unit field, not a hand-authored file). This is the store-once fix.
- **BOARD file regen** (planning.md / requirements.md) = generator-owned vs hand-authored → **R-C7 classification governs**: regen ONLY boards carrying the GENERATED marker; the **frozen-legacy set (S01–18 backfill + the design-doc planning.md S01–09) is EXCLUDED** (R-C7 G5). For a frozen-legacy sprint, de-embed its UNIT name (for future regens / the overview / the pin) but do NOT force-regen its hand-authored board.
⇒ Ruling: **de-embed all 24 unit names; regen only the generator-owned boards (byte-proof), per R-C7 exclusions.** No sprint is excluded from the NAME fix; frozen-legacy sprints are excluded from the BOARD regen only.

## ★ WHAT CHANGED — R-C8 defuses the original deferral hazard (re-assessed, plainly)
The batch was deferred because a regen could DELETE diagrams/*.puml + design-*.md (unowned collateral). **R-C8's owned-output guard now makes that impossible BY CONSTRUCTION** — a generator may only create/replace files carrying its own GENERATED marker and may NEVER delete an unmarked file, at one chokepoint with a stub-must-fail bite. So (c) below is guarded by construction, not by care. **Re-assessment: the batch is now SAFE TO SCHEDULE.** The hazard that justified deferral is gone.

## THE SAFE SWEEP (the PO's a/b/c/d)
- **(a) store-once:** de-embed the number from `name`; number lives in `model.number` only, composed at display. (The generator already composes correctly — only the data duplicates.)
- **(b) rename + regen TOGETHER, atomically:** per sprint, de-embed the name AND regen its (owned) board in ONE step + ONE commit — else the board shows the double mid-flight (views drift). Never de-embed the name without regenerating the dependent board in the same commit.
- **(c) preserve diagrams/*.puml + design-*.md:** now GUARANTEED by R-C8's owned-output guard (a regen cannot delete/clobber an unmarked file). No longer relies on care.
- **(d) PROOF per sprint:** after the fix, regen BYTE-MATCHES the clean committed title (no double-number) — the R-C2/check:sprint-md byte-match gate, per sprint.

## PER-SPRINT INCREMENTAL vs BATCH — recommend INCREMENTAL (the S34 template)
Even with R-C8, **per-sprint incremental is safer than one big batch**: one sprint = de-embed name → regen owned board → byte-proof clean title → ONE atomic (revertible) commit — matching the C7 one-sprint-atomic-commit and the S34 one-line fix. 24 small, provable, revertible steps beat one 24-sprint commit whose failure is hard to bisect. Schedule as a loop over S10–S33 (skip-and-note frozen-legacy boards from the regen step, still de-embed their name). Idempotent (re-running a de-embedded sprint is a no-op).

## Chain / ownership (for req when scheduled, verify-owner-first)
This rides the existing name-composition + generator: the de-embed is a one-time data migration (a script `de-embed-sprint-names.ts`) + relies on R-C2 check:sprint-md for the byte-proof. If it needs a chain unit: UC `sprintName.deEmbedNumber` → Class `SprintNameMigration` → Method `deEmbedNumber` → Impl + a distinct byte-match Test. Does NOT cross-wire onto R-C1 (pin) or R-C2 (board) units — distinct-intent = the one-time name de-embed. req mints if a chain is wanted; else it's a scripted migration under the sweep task.
