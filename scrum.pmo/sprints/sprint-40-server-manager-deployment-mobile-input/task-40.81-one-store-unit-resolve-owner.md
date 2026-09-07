<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.81: ONE physical unit store — Unit.resolve OWNS the single store; every index/view is a symlink tree (radical-OOP Slice-1 convergence)

[task:uuid:d864b05f-8a0e-4b16-9a45-8230fd745413]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

MINTED In-Progress 2026-09-06 as PRIO-1 CURRENT (PO-set; tester RED-baselines now). VERIFIED ABSENT before mint (0 covering task + no existing store-convergence task; check-before-create satisfied, not a parallel duplicate). Radical-OOP: Unit.resolve OWNS the store (object-owns-behaviour). Slice-1 Node half already SHIPPED GREEN @v0.8.187; this is the open one-store half. UC full-uuid ea8c3cf8-8d96-429d-9eba-e9f8f5a866b4 from R40.81.useCases[] on disk. 14 ACs mirrored no-drift + OOP-owner CR + transport-is-scenario standing AC. LOCAL push-freeze, path-limited. req reverse-wires R40.81.tasks[]. 0 Done till Tron.

## Task Description

PRIO-1 CURRENT (PO 2026-09-06, tester RED-baselining now). The OPEN half of Tron's prio-1 — Slice-1 Node (owns-children-rendering) already SHIPPED 4-axis GREEN @v0.8.187, R40.81 one-store is the remaining half. Covers R40.81 be8ec6b6, UC ea8c3cf8. ★ RADICAL-OOP (object-owns-behaviour): Unit.resolve is the ONE canonical STORE OWNER — not a functional store-picker/free-fn; every other index/view is a SYMLINK tree into the one physical store, a duplicate physical store is FORBIDDEN. verify-owner-first: full-index scan confirmed R40.81 had NO covering task + no existing store-convergence task (the sprint-dir-resolver/class-dedup/add-folder candidates are distinct) = VERIFIED ABSENT -> minted (NOT a parallel duplicate; check-before-create satisfied).

## Context

Covers R40.81 be8ec6b6 (UC ea8c3cf8). Radical-OOP Slice-1 convergence. CURRENT (PO-set). Supersedes R40.69 two-store legitimacy. Standing AC: transport-is-the-scenario.

## Intention

Unit.resolve owns exactly one physical unit store; all else symlinks into it; divergence fails closed.

## Acceptance Criteria

- [ ] **(by-construction)** There is EXACTLY ONE physical store of unit files: scenario/index (measured 5947 real files, 0 symlink). Every other index/view tree (data/model-store model tree, scenario/sprints.json speaking-name, room Files dirs) is a SYMLINK tree INTO it. A SECOND tree containing REAL (non-symlink) *.scenario.json files => RED.
- [ ] **(by-construction)** Any ADDITIONAL index tree contains ONLY symlinks that resolve into the one store — never a real file. Correct-shape precedent already exists: data/users room-file dirs (measured 53/53 symlinks) + the R17.5 speaking-name symlink tree + scenario/sprints.json. A real file appearing in ANY index tree => RED.
- [ ] **(by-construction/THE-GATE)** THE by-construction guarantee (Tron's core ask): a UUID that already exists as a REAL file in the one store may NOT have a SECOND real file anywhere in the repo. The gate FAILS if a duplicate real file appears for a UUID already present in the one store. (Measured today: 33 UUIDs are real in BOTH scenario/index AND data/model-store = the current violation.)
- [ ] **(migration/gated)** The 33 byte-identical overlap dupes (real in both stores, MEASURED byte-identical now) are collapsed: KEEP the scenario/index real file, replace the model-store copy with a symlink into it (or remove). Gated dry-run + count; no unit lost; count before==after.
- [ ] **(migration/gated/MEASURED-NUANCE)** MEASURED NUANCE (beyond the directive's stated 33): data/model-store holds 777 real files but only 33 overlap scenario/index — 744 are model-store-ONLY. Deleting just the 33 dupes would LEAVE 744 as a second physical store = the rule HALF-APPLIED. So the 744 are RELOCATED into the one store (scenario/index) and symlinked back into the model tree — NOT left as real files. Gated dry-run + count; every model-tree entry resolves to a real file in the one store afterward.
- [ ] **(fail-closed)** TODAY there is NO rule for which copy wins if the 33 diverge (measured: 0 diverged now, all byte-identical). The migration makes divergence IMPOSSIBLE by construction (a symlink is ONE file). UNTIL it lands, if any of the 33 diverges it is FAIL-CLOSED: STOP + architect/Tron rules which wins, NEVER a silent pick. (Encodes the gap the directive named: 'no rule for which wins if they do'.)
- [ ] **(self-failability)** The one-store lint ships with a RED-proving fixture: a seeded duplicate real unit file MUST make it RED before it counts as wired (R40.54 own-failability). Isolated: fixture in scratch, no prod mutation, cleanup-on-failure (R40.31).
- [ ] **(supersede/LOUD)** LOUD SUPERSEDE (Tron verbatim outranks a prior ruling): Tron's directive 2026-09-05 (he does NOT want a data model-store; ONE physical store, symlink trees, a duplicate physical store is FORBIDDEN) SUPERSEDES R40.69's ruling b09bb0308 that 'the two stores are BOTH LEGITIMATE'. The model-store is NOT a legitimate 2nd physical store — it becomes a symlink tree. VERIFY-OWNER-FIRST: R40.69 KEEPS its File-uuid-name symptom ACs (name/location/sourceFile/ownerIor + ensureViewUnit-refuses-uuid) — those stand, untouched; ONLY its two-store-legitimacy ruling + AC-no-modelelement-in-multiple-stores (dedupe-overlap = the WEAKER form) are subsumed by R40.81's stronger one-physical-store form. Architect reconciles R40.69's store-boundary ruling (AC-what-writes-each) to the one-store shape.
- [ ] **(migration/THE-crux (folded from R40.95))** RESETTABILITY PRESERVED WITHOUT A SECOND STORE. The ONLY thing the 2nd store bought was a safe re-generate (generate writes ONLY there -> store is wipeable -> prod never clobbered). After migration, re-generate must be IDEMPOTENT-IN-PLACE + REPLACE-BY-DETERMINISTIC-KEY + NEVER wipe-a-store: it updates existing units in place by their deterministic key, never deletes-and-rewrites a whole store, never clobbers a prod (room) unit. The resettability property is kept; the 2nd store is not.
- [ ] **(migration/baseline (folded from R40.95))** NO REGRESSION: the tester's PRE-migration baseline (captured before the migration runs) re-runs IDENTICAL post-migration across the ~67 source refs — writers (TsToModel.generate bulk, model-folder create, diagram add/move/zoom/create, trace author, element hide/remove) AND readers (mofChildren MOF tree, trace-merge M1 counterpart, isModelUnit routing, usage-index). Byte/behaviour-identical where it was before.
- [ ] **(migration/one-owner (folded from R40.95))** ONE canonical owner of the DATA (scenario/index via the canonical put/ScenarioIndex); the model tree PERSISTS as a reference VIEW (folders holding refs), which is NOT a second owner. FORBIDDEN = a SECOND INDEX (units stored twice / a parallel unit store): server.ts:122 MODEL_STORE + data/model-store/index + usage-index.json sidecar are removed or re-pointed to resolve BY LINK. ★ NO CODE FORKS ON WHICH STORE A UNIT LIVES IN — isModelUnit store-routing collapses; a reader resolves a ref into the one index, never branches on model-store-vs-index. A residual second-store PATH or a which-store fork => RED. (Tron: 'a model tree folder holding links to the scenario index is absolutely valid but NOT a second Index!!!!')
- [ ] **(migration/self-failability (folded from R40.95))** FAILABLE gate + stub-must-fail for the migration: (a) seed a unit that exists ONLY in data/model-store post-migration -> RED; (b) a re-generate that WIPES a store or CLOBBERS a prod unit -> RED. A suite green on either seed is inadmissible (R40.54).
- [ ] **(migration/zero-data-loss (PO split))** ZERO DATA LOSS by DE-DUPLICATION, not deletion (Tron-refined 2026-09-06). Every unit exists EXACTLY ONCE in scenario/index: the 669 model-store-only units RELOCATE into the one index; the 115 overlap COLLAPSE to a single copy. NOTHING is deleted — storage is de-duplicated. The model tree PERSISTS as reference-structure (folders holding refs into the one index), NOT as a second copy. PRESERVATION SPLIT (re-measure at migration-time, moving target): of the 669, ~628 are TsToModel-REGENERABLE (attribute/method/function/interface/class/type/property) = present-or-regenerable; ~41 are AUTHORED + IRREPLACEABLE (19 File, 6 Diagram, 6 PumlArtifact, 4 Folder, 3 Project, 3 UmlTraceRelationship) = need PRESENCE AND CONTENT-SHA INTACT (the tester attached relPath + contentSha to each). An authored unit missing OR content-sha-changed => RED.
- [ ] **(migration/mitigation (PO git note))** GIT REALITY = the whole data-loss mitigation: scenario/index is TRACKED (6244 files, revertible), but data/model-store is GITIGNORED + UNTRACKED -> a git revert CANNOT restore it. So a ONE-TIME SNAPSHOT of data/model-store is taken BEFORE the migration mutates anything (the migration is gated on the snapshot existing); the authored 41 are verifiable against it by content-sha. No snapshot => the migration must NOT run.
- [ ] **(principle/generalises (Tron 2026-09-06))** THE PRINCIPLE (generalises beyond this migration): ONE canonical owner of the DATA, MANY legitimate VIEWS BY REFERENCE. A view that holds REFS is NOT a second owner; storing the same unit twice IS. A model tree of folders holding links into the one index is VALID; a parallel unit store is FORBIDDEN. Same law as one-translator (R40.91) / one-derivation (R40.92 folderChildrenUnder) / capability-on-the-class (R40.82, R40.86) — stated for STORAGE: the owner is singular, the reference-views are plural.
- [ ] **(apply-time/fail-closed)** The divergence check is RE-ASSERTED AT APPLY, not trusted from the plan-time dry-run. The measured "0 diverged now" is a PLAN-time snapshot; between plan and apply a copy can diverge, so the migration RE-CHECKS byte-identity per overlapping uuid AT APPLY and FAILS-CLOSED (STOP, name both, architect/Tron rules) if any differ — never applies on a stale clean measurement.
- [ ] **(apply-time/post-invariant)** POST-APPLY INV-DATA: after the migration applies, the data invariant holds — EVERY unit resolves through the one store (scenario/index), the unit count is preserved (before==after), there is ZERO dangling symlink and ZERO orphaned real file left in a 2nd store. Asserted AFTER apply, fail-closed.

## Subtasks

None (atomic task).
