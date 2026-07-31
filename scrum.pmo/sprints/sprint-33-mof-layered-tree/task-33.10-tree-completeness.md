<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.10: Model tree completeness + folder grouping: ts/ enumerates the full src/ directory tree (all 123 .ts, folder-grouped), not only the ~25 generated files

[task:uuid:7f1b9ad5-2eee-4836-9d10-ede5add49dd4]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Built v0.8.35 (tree completeness: enumerate src/ dir-tree, 123 ts + folder grouping). Backstop FAIL (9f37dba31 sourceDirTree out-of-scope PROJECT_ROOT ReferenceError -> rawbin:ts={}); 1-line fix RE-SHIPPED v0.8.36 (b2d33d826 __dirname). Re-gate PENDING -> In-Progress.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.10 `[requirement:uuid:fa29ab28-04fc-43d4-9e55-c42573bdefa8]`
  - down
    - None (atomic task)

## Task Description

R33.10 (Tron device; architect design 7e1365d60, R33.10-tree-completeness-folders.md). Disk src has 123 .ts but rawbin:ts groups m1Roots by sourceFile -> shows only the ~25 GENERATED files (bounded generate-project) = incomplete tree. item-2 (25->ALL ts) + item-3 (folder grouping) = ONE fix: redesign rawbin:ts (+children) to walk src/ RECURSIVELY (like pumlChildren reads the diagrams dir) emitting folder nodes by directory (dir:<relpath>) + .ts file leaves (file:<relpath>) for ALL 123; under a file: leaf -> its M1 ModelElements from MODEL_STORE if generated, else empty (or generate-on-expand). The directory hierarchy IS the grouping. Completeness + folder-grouping in one. 55-puml folder already closed. Reuse the mof layer-by-layer + /api/trace/children routing, NO fork. INV-T1-4.

## Acceptance Criteria

- [ ] The ts/ folder enumerates ALL 123 src .ts files (count == disk) by walking the src/ DIRECTORY TREE recursively - NOT only the ~25 files that were run through TsToModel.generate. Completeness = the enumeration source is the src/ dir walk, not the generated-sourceFile set (INV-T1).
- [ ] ts/ groups files by directory: dir:<relpath> folder nodes mirror the src/ directory tree; expanding a folder reveals its files + subfolders (layer-by-layer). The directory hierarchy IS the folder grouping (INV-T2).
- [ ] Expanding a file:<relpath> .ts leaf shows its M1 ModelElements from MODEL_STORE if that file was generated, else empty (or generate-on-expand reusing /api/model/generate). A non-generated file still APPEARS in the tree (completeness) even with no elements.
- [ ] Reuse the mof layer-by-layer + /api/trace/children routing; the puml/ (55) + diagram/ folders are UNREGRESSED; read-only src/ walk + MODEL_STORE reads only, prod scenario/index untouched (INV-T3 no-fork / INV-T4 isolation).
- [ ] GATE @390 (tester + Tron device): ts/ shows ALL src .ts grouped in directory folders (count == disk 123); expand a folder -> its files/subfolders; expand a file -> its M1 elements (generated) or empty; puml/=55 + diagram/ + /trace UNREGRESSED. SERVER change -> boundary restart + boot-verify. planted: count != 123 or a flat non-folder-grouped list = RED.

## Subtasks

None (atomic task).
