# S37 — Sprint name = single-source "Sprint <n>: <title>" (design, impl-shape)

robbin-architect 2026-08-17. Tron (screenshots): sprint names are inconsistent ("Sprint 30 — X" em-dash / "Sprint 31 - X" hyphen / some no number / "Sprint 33 — Sprint 33 — …" DOUBLED); demands "**Sprint xx: zzzz** everywhere" and "**the sprint number shall be a scenario ATTRIBUTE**." Report to PO + req 0.4 + expert 0.1. **Design only.** S37-thesis (consistency-by-construction) applied to sprint identity.

## ★ MEASURED — this is R40.4-PHASE-2, not a greenfield (extend, don't rebuild)
- The number ATTRIBUTE already exists: `model.number`, read via `sprintNumOf(unit)` (`sprint-pin-resolver.ts:38` = `model.number` ELSE parse `sprint-<N>` dir). But it is NOT REQUIRED (falls back), and the number ALSO lives embedded in `model.name`.
- A single-source ATOM already exists: `sprint-label.ts` (R40.4) — `sprintPrefix(num)`="Sprint N", `sprintLabel(name,num)`="Sprint N — name" — WITH a gate `scripts/check-sprint-label.ts` (ci:gates) that FAILS if any site composes "Sprint <number>" outside the atom.
- **BUT R40.4 deliberately chose "name stays theme-only, NO data migration" (its header says so).** That deferral IS the defect Tron sees: number in BOTH `model.number` AND the name → `sprintLabel("Sprint 30 — Trace", 30)` = **"Sprint 30 — Sprint 30 — Trace"** = the DOUBLING. And multiple formats survive: `generator.ts:105` `sprintPrefix(m.number)+' Planning — '+m.name`, `sprint-overview-generator.ts:39` `S${n} ${name}`, `sprintLabel` uses "—" not ":".
- **Family:** one fact (the number) stored in two places + no migration + per-site separators = drift-by-construction (our L4/L5). Tron's directive OVERRIDES the R40.4 no-migration decision → phase-2.

## SECOND, INDEPENDENT DEFECT — item view renders the name TWICE (measured)
`rb-object-item.ts:186-198`: `name = getAttribute('name')`; `desc = getAttribute('description') || getAttribute('title')` (line 188); renders `<span class="oi-name">${name}</span>` (197) AND `${desc ? <p class="oi-desc">${desc}</p> : ''}` (198). When a sprint has no `description`, `desc` falls back to `title`, and where `title == name` the subtitle REPEATS the name verbatim = Tron's "some TWICE." Independent of the naming format.

## ★ DRY TIGHTENING (Tron: "highest CMM3 principle DRY. only ONE sprint number attribute") — ENUMERATED
Measured — the sprint number is stored/embedded in a FAN of places today (task 40.11 `6e3cc1b2` + the sprint unit):
| location | today | ruling |
|---|---|---|
| **Sprint unit `model.number`** | the attribute | ★ **THE ONE SOURCE** (sprintNumber). Required. |
| Sprint unit `model.name` prefix "Sprint 40 — …" | embedded | strip → bare title; DERIVE via formatter |
| Sprint unit `model.slug` | embedded | DERIVE (or consistency-checked accessor) |
| `sprints/sprint-<n>-*` DIRECTORY | authoritative on disk | **migration INPUT + a CONSISTENCY GATE** (dir-number == `sprintNumber` → RED on mismatch), NOT a second truth |
| Task `parent` ior → Sprint | link | KEEP — the link ALONE determines a task's sprint number |
| Task `sprintName` "Sprint 40" | **stored string** | ★ **MUST GO** — delete the persisted field; derive via `parent → sprint.number` (a derived accessor, never stored) |
| Task `name` "Task 40.11: …" | embeds 40 + .11 | title stored BARE; number DERIVED (see task-family below) |
| Task `slug` "task-40.11-…" | embeds 40.11 | DERIVE/regenerate from numbers; consistency-checked |
| generated MD / overview / view code | re-composed per-site | ALL via the ONE formatter |

**ONE-SOURCE RULE:** the Sprint unit's `sprintNumber` (`model.number`) is the sole stored truth; a task's sprint number is `resolveParent(task) → sprint.sprintNumber` (NEVER a stored `sprintName`); every display string is built ONLY by the formatter. The `sprint-<n>` dir is input-then-check, not truth.

## ★ TASK NUMBERING = THE SAME FAMILY (PO asked — YES)
"Task 40.11: X" embeds the sprint number the same way. A task number has TWO components: the **sprint part** (DERIVE from `parent → sprint.sprintNumber`) + the **task index** ".11" (a TASK attribute `taskIndex`/`model.number` on the task). So: `taskDisplayName(task) = "Task <parent.sprintNumber>.<task.taskIndex>: <bareTitle>"` — ONE number attribute per unit (sprint carries its number, task carries its index), all titles/labels DERIVED, no stored "Sprint N"/"Task N.M" literal, no `sprintName` field. Fix the FAMILY, not the sprint instance. Same gates apply to task titles.

## DESIGN — by construction (S37 thesis)
1. **`sprintNumber` = REQUIRED typed attribute** = `model.number` on the Sprint unit (declared-not-defaulted, L5). `sprintNumOf`'s dir-parse fallback becomes MIGRATION-ONLY; at RENDER the number is read from the required `model.number` (no parse). Gate: a Sprint unit with no `model.number` → RED.
2. **Title stored WITHOUT any prefix:** `model.name` = the bare title ("Traceability Improvement"). The "Sprint <n>" prefix is NEVER data.
3. **ONE formatter → "Sprint <n>: <title>":** extend the existing atom — `sprintDisplayName(unit) = sprintPrefix(num) + ': ' + bareTitle` (colon per Tron, replacing "—"). EVERY surface derives at render, never stores: item view (`rb-object-item` name slot), detail header, `generator.ts:105`, `sprint-overview-generator.ts:39` (retire the `S{n} {name}` variant), task rows. Reuse `sprint-label.ts` as the sole home; no new module.
4. **Item-view dup fix (`rb-object-item.ts:188,197-198`):** name slot = `sprintDisplayName(unit)`; secondary slot = `description` (the sprint GOAL/summary) ONLY, or NOTHING — **drop the `|| getAttribute('title')` fallback that duplicates the name.** One fact, one place.
5. **MIGRATION (~20 Sprint units) — deliberate change, so NOT INV-T byte-diff==0:**
   - `model.number` set from the **SPRINT DIRECTORY** `scrum.pmo/sprints/sprint-<n>-*` (authoritative — NOT parsed from prose); strip any leading "Sprint <n>[ —:-]" from `model.name`.
   - **Scratch dry-run FIRST** + per-unit before/after report + an AMBIGUOUS list: units with no leading number in the name (e.g. "MDA-tree refine…", "Buttons->Actions…", "Consistency by Construction") get their number from the DIR; anything still unresolvable is **REPORTED, never invented**.
   - Constraints (replace INV-T): **reversibility** (backup + zero-restore proven) + **content-conservation** (the stripped bare title is a substring of the original; `sprintDisplayName` recomposes to the original-minus-prefix; assert NO title text lost). No silent drops.
6. **GATES (each stub-must-fail, report-only→strict per DUAL-FLIP):**
   - no Sprint unit without `model.number` → RED.
   - `model.name` matching `/Sprint\s*\d+/` (a number left in a title) → RED — this is the double-prefix source.
   - **extend `check-sprint-label.ts`:** no surface builds a sprint DISPLAY string outside `sprintDisplayName` → RED (the atom's gate already covers "Sprint <n>" composition; widen to the whole display name).
   - item-row `oi-desc` text == `oi-name` text → RED (the duplicate-line detector, catches defect #2 for any type, not just sprints).
   - ★ **DRY no-2nd-source lint (Tron's ONE-attribute):** a persisted `sprintName` (or any sprint-number) field on a Task (or any non-Sprint unit) → RED; `model.name` matching `/Task\s*\d+\.\d+/` (task title with an embedded number) → RED; a display built outside `sprintDisplayName`/`taskDisplayName` → RED. The sprint number exists in exactly ONE stored place (Sprint `model.number`); the task index in one (Task `taskIndex`); everything else derives.
   - ★ **dir↔attribute consistency gate:** for every Sprint unit, `sprint-<n>` directory number == `model.number` → RED on mismatch (the dir is a check, not a source).

## ★ PHASED MIGRATION (PO scope ruling — the task family is BIG: ~hundreds of task units × ~37 sprints)
Fix the family ONCE, migrate the data in PHASES, never a red-from-birth gate:
1. **Build ONCE (the family, one place):** the formatter (`sprintDisplayName` + `taskDisplayName`), the ATTRIBUTE requirement (`Sprint.number`, `Task.taskIndex`), and the GATES — a single implementation covering every sprint/task.
2. **Migrate in PHASES, S37 FIRST** (the sprint in Tron's screenshots), then sprint-by-sprint. Sprint names (~20 units) + S37's tasks first; the remaining sprints' task units follow.
3. **Gates REPORT-ONLY until the migration completes, THEN strict** (the DUAL-FLIP discipline — an unsatisfiable red-from-birth gate is how gates get silently removed; we lived R37.3). ★ Self-draining + visible: each ci run the report-only gate EMITS the remaining count ("N sprints / M task units still carry an embedded number in title/slug/sprintName") — no-silent-caps — and **auto-flips to strict when the count hits 0.** The counter IS the trigger; the debt cannot rot unseen.
4. ★ **DEBT + REVISIT TRIGGER recorded (my own [[L-DEFERRAL-BECOMES-THE-DEFECT]], applied to this deferral):** RESIDUAL RISK = "until phase-N, task numbers still exist in titles/slugs/`sprintName` fields for the not-yet-migrated sprints — a task's displayed number is authoritative via the formatter (parent→sprint.number) but the stale embedded copies still exist as un-derived data." REVISIT TRIGGER = the report-only gate's remaining-count (above): visible every ci run, strict-flip at 0. This is NOT a silent defer — it is a named debt with a self-executing drain.

## Constraints / handoff
Reuse `sprint-label.ts` + `sprintNumOf` + `check-sprint-label.ts` (no new machinery — this is R40.4-phase-2). @390 mobile-first (Tron's device — the item view is where he sees it). Missing units for req: a req/UC for `sprintView.displayName` (the one formatter + attribute-required + gates) and the migration (`sprintName.migrateToAttribute`). Build order: attribute-required + formatter + item-dup fix (code, gateable) → migration (scratch dry-run → review ambiguous → apply reversible) → @390 device confirm. Deliberate-change migration ⇒ reversibility + content-conservation, not byte-diff==0.
