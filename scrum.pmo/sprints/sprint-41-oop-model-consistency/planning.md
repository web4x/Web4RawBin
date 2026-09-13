<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 41 Planning — Sprint 41 — OOP Model Consistency

## Sprint Goal

TOP-DOWN PLANNED (Tron build order 2026-09-12): model File + Folder as REAL M1 CLASSES in the MOF/MDA chain, full traceability, whole chain minted BEFORE any code (Rule #126 purest form — deliberate contrast to incident-driven bottom-up). ★ Tron ZERO-MIGRATION re-scope (4fc4325f3): File/Folder CREATED CLEAN + NEW (exist for the first time), NOT consolidated/migrated; legacy stubs left, guards scope to NEW units. 3 by-construction guards both classes satisfy: (1) ownerIor never-null (create rejects ownerless); (2) fully-qualified IOR class+protocol+origin+uuid, ADDITIVE/back-compat; (3) class-has-methods / ask-the-object (a 0-method data-bag fails). EXACTLY TWO tasks: (1) class File, (2) class Folder.

**Status:** Planned

## Tasks

- [ ] ✅ [Task 41.1: class File — radical-OOP M1 class, clean-create (full MDA/MOF chain, top-down)](./class-file.md)
- [ ] ⏳ [Task 41.2: class Folder — radical-OOP M1 class, clean-create (full MDA/MOF chain, top-down)](./class-folder.md)
- [ ] ⏳ [Task 41.3: MVC live-updates for File and Folder — view observes model, object notifies, no forced reload](./mvc-live-updates-file-folder.md)
- [ ] ⏳ [Task 41.4: New git repo as M1 Repository class — greenfield class-first MVC home for the corrected MVP](./new-git-repo-m1-class-mvp-home.md)
- [ ] ⏳ [Complete M2 metamodel of File (UML+TS+PUML, consistent-by-construction) + 'open diagram' action on class File](./file-complete-m2-metamodel-open-diagram.md)
