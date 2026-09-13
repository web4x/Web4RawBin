<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 41.2: class Folder — radical-OOP M1 class, clean-create (full MDA/MOF chain, top-down)

[task:uuid:6128094d-3a43-4541-b050-71cd33a8f7c8]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

★★ BLOCKED-ON-TRON-QA-OF-FILE (2026-09-13, Tron order): do NOT start T41.2 Folder until Tron QA-APPROVES Task 41.1 (class File). Verbatim 'dont do folder before i assure file qa approved'. Planner go WITHDRAWN, expert countermanded — nobody re-starts this until the File QA-accept lands. Stays Planned (no work). Provenance: crisis-minted by robbin-req 2026-09-13; architect wires class/method on build-go (design 37e362633 + re-scope 4fc4325f3).

## Task Description

Build class Folder as a radical-OOP M1 class (clean-create; new S41 Folder SUPERSEDES legacy 77ff595d, un-migrated per Tron): owner-never-null + fully-qualified IOR + class-has-methods (children/renderSelf). Full 6-step MDA chain before code.

## Intention

class Folder EXISTS as a real M1 class for the first time — behaviour not data-bag, owned, fully-qualified IOR, carried whole through DnD.

## Acceptance Criteria

- [ ] **(guard/owner-never-null)** The CREATE PATH REJECTS an ownerless Folder BY CONSTRUCTION (Tron: 'its me as the owner') — ownerIor never null on a NEW Folder. A GUARD on new creates, NOT a backfill of the existing units. The owner is a fully-qualified instance IOR (Tron / resolved room / user).
- [ ] **(guard/federation-ior)** NEW Folder units carry a FULLY-QUALIFIED IOR = CLASS + PROTOCOL + ORIGIN + UUID ('ior:class:Folder:rest:<origin>/<uuid>', Tron verbatim), and the RESOLVER resolves that new form. ADDITIVE / zero-migration: the legacy bare form still parses and the 212 existing bare refs are NOT rewritten. ORIGIN is mandatory — it makes the ref resolvable ACROSS servers (federation).
- [ ] **(guard/behaviour-not-data-bag)** Folder is a CLASS WITH METHODS (behaviour) — ask-the-object: a folder renders/resolves ITSELF via its methods (renderSelf / resolveOwnIor / children). A 0-method DATA-BAG ({uuid,name,location,kind,ext} with no behaviour) FAILS — that is the radical-OOP violation that made the tree emit strings.
- [ ] **(mof/m1-class)** Folder is a REAL M1 Class unit (ior:class:Class name 'Folder', proper case) in the MOF/MDA chain — radical-OOP: 'a FOLDER IS a Folder class'. Every folder rendered/dragged/stored is a Folder-class INSTANCE (M0) resolved THROUGH the class, never an ad-hoc JSON blob nor a computed bare string.
- [ ] **(dnd/carries-unit)** Dragging a Folder in rb-file-tree carries the REAL Folder-class unit (its fully-qualified IOR resolving to the stored unit + owner) through the ONE DnD contract (R37.20/R40.106), NOT a computed bare string ('collection:dir:...', 'collection:file:...', 'folder:<uuid>'). Drop places a LINK to that one unit.
- [ ] **(126/top-down)** Folder is delivered TOP-DOWN through the FULL 6-step MDA chain minted BEFORE any code — Requirement -> UseCase -> Class(M1) -> Method -> Implementation -> Test — NO backfill (Rule #126 purest form). Every chain link on disk before Folder code ships.
- [ ] **(create/clean-new)** The Folder class is CREATED CLEAN + NEW as a radical-OOP M1 class (Tron zero-migration re-scope). ★ MEASURED (robbin-req, measure-don't-relay, FYI not blocking): a legacy Folder Class EXISTS — 77ff595d-a6c7-4022-a437-198c5a714bc7 (ior:class:Class name 'Folder', R40.86 DropTarget, ownerIor NULL). Per Tron ZERO-MIGRATION it is LEFT un-migrated; the new S41 Folder SUPERSEDES it as the canonical M1 model (recorded, not reconciled). Architect design said 'Folder absent/mint' — surfaced the existing unit so the supersede is explicit, not a silent 2nd class.
