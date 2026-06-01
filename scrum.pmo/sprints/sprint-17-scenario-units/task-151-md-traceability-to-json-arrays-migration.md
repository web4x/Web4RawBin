[Back to Sprint 17 Planning](./planning.md)

# T151: Migrate MD traceability bullets → JSON model arrays (no info loss)

[task:uuid:79ceb865-780f-4bcb-b487-8078bce47790]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req + architect — JOINT)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.
> **Diligence directive (PO 2026-06-01):** this is a BIG task per Tron — every
> MD chain bullet must map to a corresponding JSON model array entry; per-task
> before/after item counts required as loss-detection evidence.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — JOINT req+architect refinement, sequence req+architect → expert → tester:**
1. **robbin-req (JOINT with architect)** — capture the verbatim Tron quote for this directive; replace the planner-suggested `requirement:uuid` below with req's canonical one; enumerate the MD chain-bullet shapes currently in use across S10–S17 task files (`up`, `down`, `follows`, `chain.requirement`, `chain.use case`, `chain.puml`, `chain.class/method`, `changes`, etc.); produce a per-shape canonical mapping to JSON model array fields (input for architect)
2. **robbin-architect (JOINT with req)** — design the JSON schema extension on each scenario unit's `model` to carry the chain arrays (e.g. `model.links.up: [{type, ref, label}]`, `model.links.down`, `model.links.follows`, `model.chain.requirement`, `model.chain.useCases[]`, `model.chain.puml[]`, `model.chain.methods[]`, `model.changes[]`); design the **per-task item-count audit** ("before" = count of MD chain bullets per task; "after" = count of JSON array entries per task; both must match exactly for that task to pass); design the migration script (idempotent; dry-run mode reports counts without writing); update `scrum.pmo/standards/traceability-standard.md` to record the canonical model shape
3. **robbin-expert** — implement the migration script per the joint design (reads each task's MD chain, parses each bullet into a typed link, writes into the scenario JSON `model.links` / `model.chain` arrays); runs the dry-run across S10–S17 and produces the per-task before/after counts; runs the apply pass after PO sign-off; carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — verify per-task: every MD bullet has a corresponding JSON array entry (count match); spot-check the link payload (type+ref+label) round-trips; chain audit (`trace-cli`) shows 0 broken links post-migration; T126 ViewGenerator regenerates the `.md` views from the JSON arrays and the regenerated MD matches (modulo formatting) the original chain bullets

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:79ceb865-780f-4bcb-b487-8078bce47790]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng):** *(awaiting req-eng B-entry / verbatim anchor — PO 2026-06-01 directed stand-up; "BIG diligent task per Tron")*
  - **MD-to-JSON-arrays migration requirement (planner-suggested; req-eng to anchor/override on capture)**
    `[requirement:uuid:04d8ede7-91c6-4d04-86a4-482556ea706c]`
    Planner summary (req to confirm / correct from Tron's literal):
    > Task files' `## Traceability` chain bullets (`up`, `down`, `follows`,
    > `chain.requirement / use case / puml / class/method`, `changes`,
    > etc.) carry traceability edges that today live ONLY in the MD prose.
    > The scenario JSON model (T125 foundation) is the canonical source per
    > learning #19. Each MD chain bullet must migrate to a corresponding
    > entry in the JSON model's link arrays (`model.links.*` /
    > `model.chain.*`) — **with zero information loss**. Per-task counts
    > of MD bullets BEFORE = JSON entries AFTER, exactly.
- down
  - None at parent level (architect may split T151.x per chain-shape or per sprint cohort if scope warrants — coordinate with planner first)
- follows
  - [T125: Foundation (Unit + IOR + ClassLoaders + ScenarioIndex + ViewTemplateRegistry)](./task-125-foundation.md) — the scenario JSON model T151 extends
  - [T126: Generated views + 7 templates](./task-126-views.md) — consumes the JSON arrays to regenerate MD chains post-migration
  - [T134: TraceLink as a scenario unit](./task-134-traceability-as-units.md) — TraceLink class; T151 may emit one TraceLink per chain bullet (architect decides whether array entries are inline objects OR references to TraceLink scenario units)
  - [T143: Chain → tree rework](./task-143-traceability-tree-rework.md) — tree edges T151 makes machine-readable
  - [T146: Requirement-entry format reform](./task-146-requirement-name-first-format.md) — NAME-first format; T151's arrays carry the NAME alongside the ref
  - [T149: Universal symlink tree across 9 classes](./task-149-symlink-tree-all-9-classes.md) — universal resolution; T151's arrays use the symlink-resolvable refs
- chain (req → usecase → puml → class/method) — JOINT req+architect to fill on refinement
  - **requirement:** MD-to-JSON-arrays migration (above; planner-suggested → req-eng anchor)
  - **use case:** UC-TBD (architect — likely `migration.mdChainToJsonArrays`, `audit.itemCountPerTask`, `viewGenerator.regenerateFromArrays`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** migration script (architect names — likely `scripts/migrate-chain-to-json.ts` or extends `scripts/migrate-to-scenario.ts`) / `scrum.pmo/standards/traceability-standard.md` (model spec) / scenario JSON schema (T125 foundation)

## Context

Current state (post-T134/T141/T143/T146/T149):
- Each task's `## Traceability` block contains chain bullets (markdown lists
  for `up`, `down`, `follows`, `chain.requirement`, `chain.use case`,
  `chain.puml`, `chain.class/method`, `changes`)
- These bullets are the SOURCE OF TRUTH for the chain today — readable in MD,
  but NOT in the JSON scenario model
- Per learning #19, planning.md becomes a generated view from JSON; the chain
  must follow the same principle — the JSON model carries it, MD is generated
- Without machine-readable arrays, `trace-cli` parses MD prose (fragile);
  T149's universal symlinks resolve targets but the EDGE list still lives in MD
- T143's tree-walks (`walkUp`/`walkDown`) need to traverse JSON arrays, not
  scrape MD

Tron's directive (PO 2026-06-01): migrate every MD chain bullet into the
corresponding JSON `model.links.*` / `model.chain.*` array — with **zero
information loss**, verified by per-task before/after item counts.

## Intention

### Why this task exists
- The chain is the most-cited traceability data; it must live in the JSON
  source of truth, not in MD prose
- Migration must be auditable per task (count match), not "best-effort"
- T143/T146/T149 raise the stakes — the tree, NAME labels, and universal
  resolution all assume the edges are machine-readable

### Problems this task solves
- Chain edges parsed from MD (fragile, locale-sensitive, format-sensitive)
- `trace-cli` and T126 ViewGenerator scrape MD instead of reading JSON
- No formal validator can confirm "every MD bullet → JSON entry"
- Risk of silent info loss when MD chain text is reorganized

### How it solves them
- Define JSON schema fields per chain shape (architect's design)
- Migration script reads each task's MD chain, emits one JSON array entry per
  bullet, writes to the scenario unit's `model.links` / `model.chain`
- Per-task before/after count audit; mismatch = test fail
- T126 ViewGenerator regenerates the MD chain from JSON arrays going forward
  (closes the loop with #19 — JSON is canonical, MD is a view)

## Acceptance Criteria
- [ ] AC1 (Schema) — Scenario JSON `model` extended with chain arrays
  (architect-named, e.g. `model.links.up[]`, `model.links.down[]`,
  `model.links.follows[]`, `model.chain.requirement`, `model.chain.useCases[]`,
  `model.chain.puml[]`, `model.chain.methods[]`, `model.changes[]`); spec in
  `scrum.pmo/standards/traceability-standard.md`
- [ ] AC2 (Migration) — Migration script reads each task file's `## Traceability`
  block, parses each bullet into a typed link `{type, ref, label}` (or
  architect-finalized shape), writes to the JSON scenario unit's arrays
- [ ] AC3 (Idempotence) — Running the migration twice yields the same JSON
  state; counts unchanged on the second run
- [ ] AC4 (Dry-run) — `--dry-run` mode reports per-task before/after counts
  without writing
- [ ] AC5 (Per-task count audit) — For EVERY task file in S10–S17, the count
  of MD chain bullets (before) equals the count of JSON array entries (after);
  per-task table emitted as evidence; any mismatch is a hard FAIL
- [ ] AC6 (Per-shape coverage) — Every chain-shape currently in MD has a
  JSON array equivalent (no shape silently dropped); req's per-shape mapping
  (refinement output) is the authoritative checklist
- [ ] AC7 (Spot-check round-trip) — Architect/tester selects ≥5 tasks across
  classes (Task / Requirement / UseCase / Class / Method / Test) and verifies
  the JSON arrays carry the same refs, labels, and types as the MD source
- [ ] AC8 (T126 regenerates) — After migration, T126 ViewGenerator can
  regenerate the `.md` chain from JSON arrays; regenerated MD matches the
  original (modulo whitespace / canonical ordering) for the spot-check sample
- [ ] AC9 (`trace-cli` clean) — Chain audit reports 0 broken links across the
  migrated graph; orphan/missing-target counts ≤ pre-migration baseline
- [ ] AC10 (Regression) — No regression on T131 (Task symlinks), T141
  (chain-link rendering), T144/T147 (🔗 click-through), T149 (universal
  resolution), T146 (NAME on 🔗)
- [ ] AC11 — `npm run build` succeeds; all existing tests pass
- [ ] AC12 — **Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version"
  bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as
  the user-facing impl (T126 regeneration will reach Tron's device).
  (c) STATIC_SHELL: likely exempt (no new route — architect to confirm)
- [ ] AC13 — All 4 roles committed work in this file (req+architect JOINT
  refinement + expert impl + tester verify)

## Test Scenarios
File: `test/vitest/md-chain-to-json-migration.test.ts` (new) + per-task evidence table committed to QA Audit.

| Test | Action | Expected |
|------|--------|----------|
| TS1 (per-task counts) | Dry-run migration across S10–S17; emit per-task table `task → MD-bullets → JSON-entries` | Every row: MD count == JSON count |
| TS2 (idempotence) | Apply migration; run again | Second run reports 0 changes; counts unchanged |
| TS3 (per-shape coverage) | For each MD chain shape (`up`, `down`, `follows`, `chain.requirement`, `chain.use case`, `chain.puml`, `chain.class/method`, `changes`), verify ≥1 JSON array entry exists post-migration | All shapes present in JSON |
| TS4 (round-trip spot-check ≥5 tasks) | Compare original MD chain vs T126-regenerated MD from JSON arrays | Match (modulo formatting); refs / labels / types preserved |
| TS5 (broken-link audit) | Run `trace-cli` chain audit | 0 broken links; orphans ≤ baseline |
| TS6 (regression: T131/T141/T144/T147/T149/T146) | Visual + click-through across migrated views | All unchanged behaviorally |
| TS7 (mismatch case) | Synthetic: add an extra MD bullet to one task without re-running migration | Audit reports the count mismatch on that task |
| TS8 (rule-pair post-bump) | New CACHE_NAME activates; updated views visible on Tron's device | ✓ |

## Dependencies
- **Requires:** T125 (scenario JSON model foundation), T134 (TraceLink class — architect decides if arrays inline objects or TraceLink-unit references), T126 (ViewGenerator — regenerates MD from arrays), T149 (universal symlinks — refs in arrays resolve via the symlink tree)
- **Coordinate-with:** T143 (tree-walks read JSON arrays after this), T146 (NAME first line — arrays carry NAME as label), T141 (chain-link rendering — anchor target from arrays)
- **Enables:** chain is machine-readable; T126 closes the #19 loop (JSON canonical, MD generated); `trace-cli` reads JSON instead of scraping MD

## Drive Plan (planner-coordinated, CMM4 4-role — JOINT refinement)
1. **robbin-req + robbin-architect (JOINT)** — req captures the verbatim Tron quote and per-shape mapping list; architect designs the JSON schema extension + per-task count audit + migration script shape + standard update; both sign off the design section in this file
2. **robbin-expert** — implements the migration script per the joint design; runs dry-run, produces the per-task count table, commits the table into the QA Audit section as evidence; after PO sign-off on the dry-run report, runs the apply pass; carries rule-pair (a)+(b) in the apply commit-set
3. **robbin-tester** — verifies per-task counts match exactly; runs TS1–TS8; spot-checks ≥5 tasks round-trip; commits the verification report into the QA Audit section

## Definition of Done
- [ ] All AC met (AC1–AC13) — especially AC5 per-task count audit zero mismatches
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on T131 / T141 / T144 / T147 / T149 / T146
- [ ] All 4 roles committed work
- [ ] Tron QA approved (with per-task count table evidence)

## QA Audit & User Feedback
- 2026-06-01: PO directed planner to stand up T151 as a BIG diligent task per Tron. JOINT req+architect refinement enforced; per-task before/after item count audit baked into AC5 + DoD as loss-detection evidence. req-eng to capture the verbatim Tron quote and anchor (or replace) the planner-suggested `requirement:uuid` on the next pass. CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC12 + DoD (learnings #15+#16). Awaiting req+architect JOINT refinement → expert dry-run + apply → tester per-task verify → Tron QA.

## Subtasks
None at parent level (architect+req may split T151.x per chain-shape or per sprint cohort if scope warrants — coordinate with planner first).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 15 (MD chain → JSON arrays migration; no info loss)*
*Owners (CMM4): robbin-req + robbin-architect (JOINT) → robbin-expert → robbin-tester*
*Priority: 2 (BIG diligent task per Tron — foundation for #19 chain canonicalization; rides on T125/T126/T134/T149)*
