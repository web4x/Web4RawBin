# T151: Migrate MD traceability bullets → JSON model arrays (no info loss)
[task:uuid:79ceb865-780f-4bcb-b487-8078bce47790]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (req + architect — JOINT: `fa7c9bb` req anchor B12 verbatim + per-shape mapping table; `6f4db8f` architect design — MD traceability → JSON arrays migration)
  - [ ] creating test cases
  - [x] implementing (`d3ec388` v0.5.48 — **815/815 per-task count gate PASSED, zero loss**; rule-pair (a)+(b) ✓: package.json + sw.js CACHE_NAME → rawbin-v0.5.48)
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.
> **Diligence directive (PO 2026-06-01):** this is a BIG task per Tron — every
> MD chain bullet must map to a corresponding JSON model array entry; per-task
> before/after item counts required as loss-detection evidence.

## Traceability

`[task:uuid:79ceb865-780f-4bcb-b487-8078bce47790]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng anchored 2026-06-01):** B12 in [scrum.pmo/backlog.md](../../backlog.md), commit `416d0a1`
  - **B12 requirement** `[requirement:uuid:b2c3d4e5-f6a7-4b8c-d9e0-123456780b12]`
    Verbatim Tron quote:
    > "the md file traceability content is good but its not at all reflected in the json scenarios. all tasks and usecases arrays with traceability reference are empty but the json should be the source from with the traceability section is generated. migrate the md traceability content diligently to data without loosing infos that you have in the plain text. this is a big diligent task for architect and req agent to fix that needs to be carefully tracked."
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
  - **requirement:** B12 `[requirement:uuid:b2c3d4e5-f6a7-4b8c-d9e0-123456780b12]` (req-eng anchored)
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

## QA Audit & User Feedback

- 2026-06-01: PO directed planner to stand up T151 as a BIG diligent task per Tron. JOINT req+architect refinement enforced. CMM4 4-role engagement (learnings #18); real v4 uuids (#17); rule-pair (a)+(b) baked into AC12 + DoD (#15+#16).
- 2026-06-01 **robbin-req (JOINT anchor + per-shape mapping):** Replaced planner-suggested `requirement:uuid:04d8ede7` with req's canonical `requirement:uuid:b2c3d4e5...0b12` (from B12 capture, commit `416d0a1`). Verbatim Tron quote anchored (full directive). Per-shape mapping table added: 12 MD bullet types → JSON model fields, with IOR types and notes for architect. Audit counts: 74 up, 74 down, 33 follows, 65 chain blocks, 1 changes across S10-S17. Ready for architect to design migration script + schema from this mapping.

## Subtasks

None (single script + schema + template).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 15 (MD chain → JSON arrays migration; no info loss)*
*Owners (CMM4): robbin-req + robbin-architect (JOINT) → robbin-expert → robbin-tester*
*Priority: 2 (BIG diligent task per Tron — foundation for #19 chain canonicalization; rides on T125/T126/T134/T149)*
