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

Mirrors R37.33's 7 ACs. NEVER Done till Tron.
- [ ] AC-one-dir-convention-repo-relative: ALL dir: refs REPO-RELATIVE (aligned with file:); sourceDirTree emits dir:src/<childRel> (was dir:<childRel>); no ref carries a SRC-relative base.
- [ ] AC-one-resolver-resolveDirRefAbs: ONE resolver resolveDirRefAbs(ref)=path.resolve(PROJECT_ROOT, ref.replace(/^dir:/,'')) -> abs-string only (baseKind ELIMINATED, one base=PROJECT_ROOT); every dir:->abs consumer routes through it; empty/invalid -> '' and the caller confines.
- [ ] AC-retire-both-special-cases: RETIRE (a) createPhysicalWithUnit existence-heuristic (FolderService:65-66) + (b) puml-dir base regex (server.ts:1706); correct-by-CONSTRUCTION not correct-by-fallback. stub: any dir-base resolution NOT through resolveDirRefAbs -> RED.
- [ ] AC-gated-migration-dead-dir-units: the dir:ts->dir:src/ts change moves keyToUuid('folder::ts')->keyToUuid('folder::src/ts'); old uuids become DEAD lazy view-units. A GATED sweep removes orphaned dir: units: DRY-RUN + COUNT first (before==after accounting), NEVER a blind delete.
- [ ] AC-no-active-data-loss: migration touches ONLY lazy re-mintable dir: view-units (dead uuids), NEVER active data; confinement unchanged. stub: a sweep removing a NON-lazy/referenced unit -> RED.
- [ ] AC-stub-must-fail: (1) a dir: ref emitted SRC-relative (dir:ts not dir:src/ts) -> RED; (2) a dir->abs path by heuristic/special-case instead of resolveDirRefAbs -> RED; (3) migration sweep without a dry-run+count -> RED.
- [ ] ★ AC-migration-both-directions (PO 2026-09-01): the migration is GATED BOTH DIRECTIONS. (A) NOTHING LOST: sweep removes ONLY unreferenced lazy dir: units; before==after count reconciles (swept==orphaned-lazy, 0 referenced/active removed); a sweep deleting a referenced/non-lazy unit -> RED. (B) NOTHING WRONGLY RE-POINTED: every re-based dir: ref (dir:ts->dir:src/ts) resolves to the CORRECT new lazy-unit identity keyToUuid('folder::'+repo-rel), + a REVERSE check confirms every consumer of a re-pointed unit resolves to the new unit — NO dangling on a dead old uuid, NO wrong-uuid re-point. stubs: (i) referenced unit swept -> RED; (ii) ref left on a dead old uuid -> RED; (iii) ref re-pointed to a uuid != keyToUuid(new-repo-rel-key) -> RED. Same both-sides discipline as R37.29.

## Implementation

IN-PROGRESS (2026-09-01): ★ core resolveDirRefAbs DEPLOYED v0.8.165 (Impl 8ac3ba20 real, marker FolderService.ts:22) — the src/ts dir-namespace bug FIXED, which UNBLOCKED T37.21 P2. Still PENDING: the full 7-AC scope (retire-both-special-cases + gated BOTH-directions migration of dead lazy dir: units + stubs) + the tester gate + req's R37.33 Test (pends tester marker). refinement[x]=architect design. Was: STOOD UP Planned (build-NEXT per PO; resolveDirRefAbs==the old sourceDirTree item = ONE root closing both the Add-folder heuristic + P5 gap, then R40.78 LAST). Chain design-ahead (architect-minted, req derive-verified 7/7): R37.33 58528eab -> UC 2d193523 -> Class 3758a4d1 DirRef -> Method c5d3bca9 resolveDirRefAbs -> Impl 8ac3ba20. UC full-uuid 2d193523-9a3b-4224-96ec-29654114a2bc verified from R37.33.useCases[]. ★ T-NUMBER = 37.34 (Task 37.33 was taken by the R37.29 task 9b140eee); coveredRequirements=R37.33 is the structural link. Minted SERVED; req reverse-wires R37.33.tasks[] += 9cd50dde. LOCAL not pushed. 0 Done till Tron.

## Subtasks

None (atomic task).
