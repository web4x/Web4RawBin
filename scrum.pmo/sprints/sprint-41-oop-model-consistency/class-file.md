<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 41.1: class File — radical-OOP M1 class, clean-create (full MDA/MOF chain, top-down)

[task:uuid:a264c6a3-9732-4796-9aaa-dbd3b8e67dd6]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

IN-PROGRESS by-the-act (planner 2026-09-13, Tron DELIVER order): FOUR increments SHIPPED+GATED on hotfix/t40.1-checklist-band, each VERIFIED as a real commit (never hand-stamped) — inc-1 ownIor 245da4f9f (Ior value-object owns compose+GUARD#2, composeUnitIor DELETED) / inc-2 renderSelf-as-TOKEN 5795ab068 (semantic icon token, Model/View leak fixed) / inc-3 moveTo eadf179a7 (pure move COMMAND, ask-the-object) / inc-4a token->SVG adapter map a13f6243b (FILE_TOKEN_ICONS, /model view owns glyph). Architect BACKSTOPPED ownIor + moveTo GREEN. ★ REMAINING: inc-4b (rb-object-item wiring + deploy) = single remaining implementation piece; then testing / chain-complete-to-Test. NOT Done — Tron's gate (0 Done till Tron). Provenance: crisis-minted by robbin-req 2026-09-13; architect wires class/method (design 37e362633 + re-scope 4fc4325f3).

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
