<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.10: Model tree completeness + folder grouping: ts/ enumerates the full src/ directory tree (all 123 .ts, folder-grouped), not only the ~25 generated files

[task:uuid:7f1b9ad5-2eee-4836-9d10-ede5add49dd4]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

DONE: chain-complete-to-Test (Impl cfb6acef server.sourceDirTree tests[]=[5d4b2fb5], req mint 8d60ba65e adopting tester marker d5b7f639f) + real-WebKit @390 self-gated GREEN (r3310 folder-nav 6a248b19a; v0.8.37 dir-guard fix 1ee75456d over v0.8.36 __dirname b2d33d826). 123-ts completeness + folder-grouping, Safari 605.1.15 = Tron iPhone engine. Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.10 `[requirement:uuid:fa29ab28-04fc-43d4-9e55-c42573bdefa8]`
  - down
    - None (atomic task)

## Task Description

R33.10 (Tron device; architect design 7e1365d60, R33.10-tree-completeness-folders.md). Disk src has 123 .ts but rawbin:ts groups m1Roots by sourceFile -> shows only the ~25 GENERATED files (bounded generate-project) = incomplete tree. item-2 (25->ALL ts) + item-3 (folder grouping) = ONE fix: redesign rawbin:ts (+children) to walk src/ RECURSIVELY (like pumlChildren reads the diagrams dir) emitting folder nodes by directory (dir:<relpath>) + .ts file leaves (file:<relpath>) for ALL 123; under a file: leaf -> its M1 ModelElements from MODEL_STORE if generated, else empty (or generate-on-expand). The directory hierarchy IS the grouping. Completeness + folder-grouping in one. 55-puml folder already closed. Reuse the mof layer-by-layer + /api/trace/children routing, NO fork. INV-T1-4.

## Acceptance Criteria

- [x] The ts/ folder enumerates ALL 123 src .ts files (count == disk) by walking the src/ DIRECTORY TREE recursively - NOT only the ~25 files that were run through TsToModel.generate. Completeness = the enumeration source is the src/ dir walk, not the generated-sourceFile set (INV-T1).
- [x] ts/ groups files by directory: dir:<relpath> folder nodes mirror the src/ directory tree; expanding a folder reveals its files + subfolders (layer-by-layer). The directory hierarchy IS the folder grouping (INV-T2).
- [x] Expanding a file:<relpath> .ts leaf shows its M1 ModelElements from MODEL_STORE if that file was generated, else empty (or generate-on-expand reusing /api/model/generate). A non-generated file still APPEARS in the tree (completeness) even with no elements.
- [x] Reuse the mof layer-by-layer + /api/trace/children routing; the puml/ (55) + diagram/ folders are UNREGRESSED; read-only src/ walk + MODEL_STORE reads only, prod scenario/index untouched (INV-T3 no-fork / INV-T4 isolation).
- [x] GATE @390 (tester + Tron device): ts/ shows ALL src .ts grouped in directory folders (count == disk 123); expand a folder -> its files/subfolders; expand a file -> its M1 elements (generated) or empty; puml/=55 + diagram/ + /trace UNREGRESSED. SERVER change -> boundary restart + boot-verify. planted: count != 123 or a flat non-folder-grouped list = RED.

## Subtasks

None (atomic task).
