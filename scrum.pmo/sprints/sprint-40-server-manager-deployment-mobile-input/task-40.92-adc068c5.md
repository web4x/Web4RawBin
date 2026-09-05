<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.92: Add folder to a model collection SUCCEEDS but the folder never appears (Tron last visible symptom)

[task:uuid:adc068c5-c319-414b-ab55-c3d6c91bf012]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

STOOD UP QA-Review-with-open-CR 2026-09-05 (PO GO). FIXED + DEPLOYED v0.8.182 (48de1dcb3), tester DET-3x FULL-SCOPE GREEN incl a PROVEN regression check (physical-dir children byte-identical pre/post) + stub-must-fail. Chain f9f4c69e8: UC fe9a2e26 -> Class server(REUSED +1 method) -> Method 0f0af4c6 folderChildrenUnder -> Impl 973481f2 -> Test 30797b47. ★ UPDATED 2026-09-05 (PO, minutes after mint — my own law bit my own mint): now SATISFIED 6/6 (918be49d4) — expert SEATED [impl:uuid:973481f2] at server.ts:1740 (d1c006d3f), req grep-verified match, tester confirmed scoreboard 6/6 no-false-open. Honest state = clean QA-Review (Tron's LAST visible symptom FIXED, DET-3x GREEN, chain 6/6 source-stamped). Done pending TRON ONLY (0-Done invariant). UC full-uuid fe9a2e26-3809-4155-ba2a-8adb43138f62 disk-resolved from R40.92.useCases[] (NOT fabricated). ACs mirrored no-drift. LOCAL push-freeze, path-limited. req reverse-wires R40.92.tasks[]. 0 Done till Tron.

## Task Description

FIXED + DEPLOYED v0.8.182 (48de1dcb3), tester DET-3x FULL-SCOPE GREEN incl a PROVEN regression check (physical-dir children byte-identical pre/post) + stub-must-fail. Chain f9f4c69e8: UC fe9a2e26 -> Class server(REUSED +1 method) -> Method 0f0af4c6 folderChildrenUnder -> Impl 973481f2 -> Test 30797b47. ★ UPDATED 2026-09-05 (PO, minutes after mint — my own law bit my own mint): now SATISFIED 6/6 (918be49d4) — expert SEATED [impl:uuid:973481f2] at server.ts:1740 (d1c006d3f), req grep-verified match, tester confirmed scoreboard 6/6 no-false-open. Honest state = clean QA-Review (Tron's LAST visible symptom FIXED, DET-3x GREEN, chain 6/6 source-stamped). Done pending TRON ONLY (0-Done invariant). Covers R40.92 (6009a5ad), UC fe9a2e26. Minted 2026-09-05 (PO GO — 3rd firefight-skip, PO-owned; planner now dispatched same-breath as req). verify-owner-first: full-index scan confirmed NO prior covering task.

## Context

FIXED + DEPLOYED v0.8.182 (48de1dcb3), tester DET-3x FULL-SCOPE GREEN incl a PROVEN regression check (physical-dir children byte-identical pre/post) + stub-must-fail. Chain f9f4c69e8: UC fe9a2e26 -> Class server(REUSED +1 method) -> Method 0f0af4c6 folderChildrenUnder -> Impl 973481f2 -> Test 30797b47. ★ UPDATED 2026-09-05 (PO, minutes after mint — my own law bit my own mint): now SATISFIED 6/6 (918be49d4) — expert SEATED [impl:uuid:973481f2] at server.ts:1740 (d1c006d3f), req grep-verified match, tester confirmed scoreboard 6/6 no-false-open. Honest state = clean QA-Review (Tron's LAST visible symptom FIXED, DET-3x GREEN, chain 6/6 source-stamped). Done pending TRON ONLY (0-Done invariant).

## Intention

Board-track R40.92 at its honest status; declare the ONE canonical planning unit (traceability=DRY enforcement).

## Acceptance Criteria

Mirrors R40.92 req ACs (no-drift, disk-resolved UC). NEVER Done till Tron.
- [ ] AC-folder-renders-in-collection-after-add: THE SYMPTOM (Tron literal): after add-folder on a MODEL COLLECTION (e.g. diagrams), the new folder RENDERS as a child of that collection in the model view AND PERSISTS across reload.
- [ ] AC-children-include-parent-linked-store-only-folders: ROOT NAMED: the model-collection children derivation (server.ts:1789, rawbin:diagram) must INCLUDE ior:class:Folder units parented under that collection, NOT filter to ior:class:Diagram only.
- [ ] AC-found-by-parent-link-not-location: a store-only model Folder is found by its PARENT link (parent=rawbin:diagram), NOT by a filesystem location; the location-based dir: merge (server.ts:1780) cannot find a locationless folder.
- [ ] AC-offered-implies-succeeds-implies-visible: the VIOLATED invariant (ties Bug c83c02f2 + R40.84-B + R40.87): if add-folder is OFFERED on a surface, a successful add is VISIBLE on THAT surface; succeeds-invisibly is a defect.
- [ ] AC-failable-gate-self-stub: the gate ships with a RED-proving fixture: seed a store-only Folder parented under rawbin:diagram (no location); /api/trace/children(rawbin:diagram) MUST include it; the pre-fix code goes RED.
- [x] AC-impl-marker-SEATED (6/6, updated 2026-09-05 — was 5/6 at mint, flipped minutes later): the Impl source-code marker [impl:uuid:973481f2] is now SEATED at server.ts:1740 (expert d1c006d3f); req GREP-VERIFIED it matches the minted uuid + tester independently confirmed the scoreboard shows all 6 hops with NO false-open -> req SATISFIED (918be49d4). Chain 6/6 source-stamped. Done pending TRON only.

## Subtasks

None (atomic task).
