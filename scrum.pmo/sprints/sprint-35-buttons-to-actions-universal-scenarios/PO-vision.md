# Sprint 35 — Buttons→Actions + Universal On-Disk Scenarios

**Tron directive (2026-08-04):** "well done with the action bar. now you have to convert the previous buttons to actions. and make sure all item views really have a scenario on disk so that both buttons always work and the scenarios also contain the information."

Builds directly on S34's universal action bar (R-E `universalActionBar` ffd44b17 + `onUniversalAction` 005dbd3e + `actionsForContext`). PO VISION SEED — scenario-first: architect MEASURES the current button/scenario landscape + designs; req formalizes R35.x + UUIDs/UCs; expert implements against the units. NO impl before units land (#126). Framing as Sprint 35 (Tron-directed new theme post-S34); S33/S34 sprint-CLOSE remains separate Tron governance.

## Requirement decomposition (PO ACs — req to formalize)

### R35.1 — Convert legacy per-view buttons → universal action-bar actions
- Every bespoke per-item-view button that existed BEFORE the universal action bar becomes an ACTION registered via the S34 mechanism (`actionsForContext`/`registerActionProvider`), rendered in the one shared `universalActionBar`.
- Item views stop carrying their own button markup — actions flow through the shared bar (generic-behavior-in-the-shared-component, solved once). ARCHITECT to MEASURE the full inventory of existing per-view buttons first (which views, which buttons, what each does) → each maps to an action.
- No behavior lost: every old button's action is preserved (same effect), just relocated into the bar. Verb-listing rides `actionsForContext`.

### R35.2 — Every item view has a REAL scenario on disk (both buttons ALWAYS work)
- EVERY item type rendered in a view resolves to a REAL `ior:class:X` unit on disk (MODEL_STORE), so ◆Scenario (→/scenario?ior) and ✎Edit (→scenarioEditorHref) — "both buttons" — ALWAYS work, never dead/no-op.
- Extends S34 A2 (File/Folder resolve-to-real-MODEL_STORE-unit, `ensureFolderFileUnit` a09b474d, keyToUuid idempotent, prod-untouched) to ALL item types that currently lack an on-disk scenario. ARCHITECT: measure which item types/views currently have NO backing scenario (both buttons would fail) → extend the resolver.
- By-construction: deterministic keyToUuid lazy-mint, idempotent (no dup on re-open), prod scenario/index untouched (store-only), tree byte-unchanged (A2 fork-A pattern).

### R35.3 — Scenarios CONTAIN the item's information (not empty stubs)
- Each resolved scenario unit is POPULATED with the item's actual data (name, description, type-specific fields, location/source), not a bare/empty unit. ◆Scenario opens a scenario that shows the real info; ✎Edit edits real content.
- ARCHITECT: define, per item type, what information the scenario carries (mirror the item's view data into the unit's fields). REQ: ACs assert the scenario contains the expected fields for each type.

### R35.4 — Traceability tree as the 4th folder under the MDA RawBin project
**Tron directive (2026-08-04):** "add the traceability tree as the fourth folder under the MDA project RawBin folder — ts, puml, diagrams, traceability."
- The MDA/MOF RawBin project node currently shows THREE folders: `ts`, `puml`, `diagrams`. ADD a FOURTH: `traceability` — rendering the traceability tree (Requirement→UseCase→Class→Method→Impl→Test units) under the project.
- ARCHITECT: measure where the project-node folder set is defined (S33 mof-layered-tree / S34 tree), add `traceability` as the 4th child folder, populated from the scenario traceability units (the same chain the scoreboard walks). Ties to R35.2/R35.3 (folder + children resolve to real on-disk scenarios containing info).
- Gate @390: RawBin project node expands to show exactly [ts, puml, diagrams, traceability]; the traceability folder expands to the real trace tree.

## Build order (architect/planner to confirm)
1. R35.2 ensure-scenario-on-disk for all item types (foundation — both buttons need it) + R35.3 populate (same resolver pass) →
2. R35.1 convert legacy buttons → actions (depends on the action mechanism, mostly client).

## Gate posture (real-WebKit @390, per S34)
- R35.1: each converted action present + FIRES in the bar (not just present) @390; no bespoke button left behind; no behavior lost.
- R35.2: for EVERY item type, ◆Scenario + ✎Edit both resolve (real unit, not dead) — gate with a data-having sample per type, not a degenerate entity.
- R35.3: the resolved scenario CONTAINS the item's info (assert fields non-empty for a populated sample).
- All chain-to-Test, screenshot+pixel where visual, verify Impl.tests[] on disk before flip.
