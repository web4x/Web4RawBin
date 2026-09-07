<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.34: Dir-namespace single base-resolution — ONE resolveDirRefAbs, all dir: refs repo-relative, retire the 2 correct-by-incident special-cases (gated both-directions migration) [covers R37.33]

[task:uuid:9cd50dde-7237-4b95-b75f-ce181a74e347]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver R37.33 (correct-by-construction follow-up; architect design 71e7c87ab, PO-dispatched to expert; builds NEXT). ★ NOTE: task numbered 37.34 not 37.33 because 'Task 37.33' (9b140eee) was already minted this session covering R37.29 — coveredRequirements is the structural link (R37.33 58528eab). ROOT: the dir: ref namespace carries TWO base conventions (sourceDirTree emits SRC-relative dir:<childRel>; pumlPhysicalTree emits REPO-relative dir:<dirRel>) while file: refs are already repo-relative — so dir: is the outlier, papered over by TWO correct-by-INCIDENT special-cases (createPhysicalWithUnit existence-heuristic FolderService:65-66 + puml-dir regex server.ts:1706). SAME root behind the Tron-facing Add-folder-on-/model ENOENT bug AND the P5 sourceDirTree gap. FIX (remove ambiguity, don't heuristically resolve): make ALL dir: refs REPO-RELATIVE so ONE resolveDirRefAbs(ref)=path.resolve(PROJECT_ROOT, ref-without-dir-prefix) is a trivial join, retire both special-cases. Reuse the chain (Class DirRef / Method resolveDirRefAbs), NO fork.

## Context

Covers R37.33 58528eab (UC 2d193523 dirNamespace.resolveBase). Chain design-ahead (architect-minted, req derive-verified 7/7): R37.33 -> UC 2d193523 -> Class 3758a4d1 DirRef -> Method c5d3bca9 resolveDirRefAbs -> Impl 8ac3ba20. Retires the R40.70 part-2 createPhysicalWithUnit heuristic + closes the R40.77 P5 sourceDirTree gap (same root). Referential-integrity family with R37.29. ★ BUILD-NEXT per PO (resolveDirRefAbs == the old sourceDirTree item, ONE root closing both; then R40.78 LAST). Post-QA cleanup, NOT blocking T37.21 QA-Review.

## Intention

One dir: base convention (repo-relative, aligned with file:) + one resolver (resolveDirRefAbs) — resolution correct-by-construction, no heuristic; retire the 2 special-cases; migrate dead lazy dir: units gated both-directions.

## Acceptance Criteria

- [ ] **(by-construction)** ALL dir: refs are REPO-RELATIVE (one convention, aligned with the existing file: convention). sourceDirTree emits dir:src/<childRel> (was dir:<childRel>); no ref carries a SRC-relative base. Two dir: base conventions => the defect this eliminates.
- [ ] **(by-construction)** There is ONE resolver: resolveDirRefAbs(ref) = path.resolve(PROJECT_ROOT, ref.replace(/^dir:/,'')) -> the absolute disk path (abs-string only, NO {abs,baseKind} - baseKind is ELIMINATED because there is ONE base=PROJECT_ROOT). Every dir:->abs consumer (createPhysicalWithUnit, sourceDirTree walk, ensureViewUnit location) routes through it; empty/invalid -> '' and the caller confines.
- [ ] **(correct-by-construction)** The two correct-by-INCIDENT special-cases are RETIRED: (a) the createPhysicalWithUnit existence-heuristic (FolderService:65-66, the pinned deadline measure) and (b) the puml-dir base regex (server.ts:1706). Resolution is correct-by-CONSTRUCTION (one convention + one resolver), never correct-by-fallback. stub: any dir-base resolution NOT through resolveDirRefAbs (a surviving heuristic/special-case) => RED.
- [ ] **(migration)** The dir:ts->dir:src/ts change moves keyToUuid('folder::ts')->keyToUuid('folder::src/ts') = the LAZY Folder unit identity; old uuids become DEAD MODEL_STORE view-units (dir: folders are lazy, re-minted on access). A GATED sweep removes the orphaned dir: units: DRY-RUN + COUNT first (before==after accounting), never a blind delete. No ACTIVE data loss (only re-mintable lazy view-units are touched).
- [ ] **(safety)** The migration touches ONLY lazy, re-mintable dir: view-units (dead uuids), NEVER active data; confinement (createPhysicalWithUnit) is unchanged. stub: a sweep that removes a NON-lazy / referenced unit => RED.
- [ ] **(gate)** stub-must-fail: (1) a dir: ref emitted SRC-relative (dir:ts not dir:src/ts) => RED; (2) a dir->abs path computed by a heuristic/special-case instead of resolveDirRefAbs => RED; (3) the migration sweep run without a dry-run+count => RED.
- [ ] **(migration/gated-both-directions)** ★ The dead-lazy-dir-unit migration is GATED in BOTH DIRECTIONS (PO 2026-09-01 — this is the one part of the change that touches EXISTING data, not new behaviour; a resolver change that quietly re-points units is discovered much later). (A) NOTHING LOST: the sweep removes ONLY UNREFERENCED lazy dir: units; a before==after count reconciles (swept == orphaned-lazy, 0 referenced/active units removed); a sweep that would delete a referenced/non-lazy unit => RED. (B) NOTHING WRONGLY RE-POINTED: every dir: ref whose base convention changes (dir:ts -> dir:src/ts) resolves to the CORRECT new lazy-unit identity keyToUuid('folder::'+repo-rel), and a REVERSE check confirms every consumer of a re-pointed dir: unit now resolves to the new unit — NO ref left dangling on a dead old uuid, NO ref re-pointed to a WRONG uuid. stub-must-fail: (i) a referenced unit swept => RED; (ii) a dir: ref left on a dead old uuid after migration => RED; (iii) a dir: ref re-pointed to a uuid != keyToUuid(new-repo-rel-key) => RED. Same both-sides discipline as R37.29 referential-integrity.

## Implementation

IN-PROGRESS (2026-09-01): ★ core resolveDirRefAbs DEPLOYED v0.8.165 (Impl 8ac3ba20 real, marker FolderService.ts:22) — the src/ts dir-namespace bug FIXED, which UNBLOCKED T37.21 P2. Still PENDING: the full 7-AC scope (retire-both-special-cases + gated BOTH-directions migration of dead lazy dir: units + stubs) + the tester gate + req's R37.33 Test (pends tester marker). refinement[x]=architect design. Was: STOOD UP Planned (build-NEXT per PO; resolveDirRefAbs==the old sourceDirTree item = ONE root closing both the Add-folder heuristic + P5 gap, then R40.78 LAST). Chain design-ahead (architect-minted, req derive-verified 7/7): R37.33 58528eab -> UC 2d193523 -> Class 3758a4d1 DirRef -> Method c5d3bca9 resolveDirRefAbs -> Impl 8ac3ba20. UC full-uuid 2d193523-9a3b-4224-96ec-29654114a2bc verified from R37.33.useCases[]. ★ T-NUMBER = 37.34 (Task 37.33 was taken by the R37.29 task 9b140eee); coveredRequirements=R37.33 is the structural link. Minted SERVED; req reverse-wires R37.33.tasks[] += 9cd50dde. LOCAL not pushed. 0 Done till Tron.

## Subtasks

None (atomic task).
