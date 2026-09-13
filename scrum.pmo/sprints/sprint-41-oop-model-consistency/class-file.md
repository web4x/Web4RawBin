<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# class File — radical-OOP M1 class, clean-create (full MDA/MOF chain, top-down)

[task:uuid:a264c6a3-9732-4796-9aaa-dbd3b8e67dd6]

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

STOOD UP Planned, top-down scenario-first (chain minted before code). ★ Crisis-minted by robbin-req (PO urgent 2026-09-13, Tron watching zero-tasks, planner pane unreachable=detached shell) — PLANNER's lane: take over / reconcile. Architect wires class/method on build-go (design 37e362633 + re-scope 4fc4325f3).

## Task Description

Build class File as a radical-OOP M1 class (clean-create, ZERO migration): owner-never-null (create rejects ownerless) + fully-qualified IOR (ior:class:File:rest:<origin>/<uuid>, additive) + class-has-methods (renderSelf/resolveOwnIor, ask-the-object). Full 6-step MDA chain minted before code. rb-file-tree emits M0 File instances, not bare strings.

## Intention

class File EXISTS as a real M1 class for the first time — behaviour not data-bag, owned, fully-qualified IOR, carried whole through DnD.

## Acceptance Criteria

- [ ] **(guard/owner-never-null)** The CREATE PATH REJECTS an ownerless File BY CONSTRUCTION (Tron: 'its me as the owner') — ownerIor never null on a NEW File. A GUARD on new creates, NOT a backfill of the existing units. The owner is a fully-qualified instance IOR (Tron / resolved room / user).
- [ ] **(guard/federation-ior)** NEW File units carry a FULLY-QUALIFIED IOR = CLASS + PROTOCOL + ORIGIN + UUID ('ior:class:File:rest:<origin>/<uuid>', Tron verbatim), and the RESOLVER resolves that new form. ADDITIVE / zero-migration: the legacy bare form still parses and the 212 existing bare refs are NOT rewritten. ORIGIN is mandatory — it makes the ref resolvable ACROSS servers (federation).
- [ ] **(guard/behaviour-not-data-bag)** File is a CLASS WITH METHODS (behaviour) — ask-the-object: a file renders/resolves ITSELF via its methods (renderSelf / resolveOwnIor / children). A 0-method DATA-BAG ({uuid,name,location,kind,ext} with no behaviour) FAILS — that is the radical-OOP violation that made the tree emit strings.
- [ ] **(mof/m1-class)** File is a REAL M1 Class unit (ior:class:Class name 'File', proper case) in the MOF/MDA chain — radical-OOP: 'a FILE IS a File class'. Every file rendered/dragged/stored is a File-class INSTANCE (M0) resolved THROUGH the class, never an ad-hoc JSON blob nor a computed bare string.
- [ ] **(dnd/carries-unit)** Dragging a File in rb-file-tree carries the REAL File-class unit (its fully-qualified IOR resolving to the stored unit + owner) through the ONE DnD contract (R37.20/R40.106), NOT a computed bare string ('collection:dir:...', 'collection:file:...', 'file:<uuid>'). Drop places a LINK to that one unit.
- [ ] **(126/top-down)** File is delivered TOP-DOWN through the FULL 6-step MDA chain minted BEFORE any code — Requirement -> UseCase -> Class(M1) -> Method -> Implementation -> Test — NO backfill (Rule #126 purest form). Every chain link on disk before File code ships.
- [ ] **(create/clean-new)** The File class is CREATED CLEAN + NEW — a radical-OOP M1 File class existing for the FIRST time (Tron zero-migration re-scope). It is NOT consolidated/migrated/backfilled from the existing lowercase-'file' ModelElement stubs (35f8f879 / a0df222c / bccba82d (ior:class:ModelElement name 'file', owner null)) — those are LEFT as legacy. The new File is the canonical M1 model going forward.
