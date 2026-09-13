# Sprint 41 — OOP Model Consistency: File & Folder as real modelled classes (robbin-architect, 2026-09-13)

Tron ordered Sprint 41: class File + class Folder, TWO top-down planned tasks, FULL traceability, FULL MDA/MOF chain. I own the chain shape. ★ This SUPERSEDES the synthetic-ref item (not re-sequenced): the axis was never storage (resolve-vs-mint) — it is that **the class was never modelled**. We do not resolve-on-read a string pretending to be a File; we MODEL File, and the tree emits INSTANCES of it. Design-only, scenario-first, top-down; coordinate with req (requirements/UCs) + planner (sprint + 2 tasks).

## ★★ RE-SCOPED by Tron (verbatim: "do not migrate it yet, just start to create clean oop for the first time… same set of features just composed radical oop"). Sprint 41 = CREATE the clean thing, ZERO migration.
- **OUT of Sprint 41 (banked, ranked, Sprint-41-FOLLOWS, NOT started):** the additive/phased parse-both IOR rollout across the 212 bare occurrences / 66 files; the fleet-wide ownerIor-null backfill (1379); rewriting any existing bare refs; CONSOLIDATING the 3 broken lowercase "file" stubs.
- **IN:** CREATE `File` and `Folder` CLEANLY, for the FIRST time, as real radical-OOP M1 classes — full 6-step chain, real METHODS (ask-the-object), ownerIor ALWAYS set (Tron: "each scenario has a ownerIor and its never null! its me as the owner!!!" → create REJECTS an ownerless unit by construction), fully-qualified IOR `ior:class:File:rest:<origin>/<uuid>` (HIS verbatim spec) ON THE NEW UNITS. Same features (tree/drag/detail still work) — composed of real objects instead of strings + external machinery.
- **WHY build-clean-first (not just smaller):** a migration designed before the clean class exists is designed against the OLD shape and bakes the compromise into the new class. Build clean first → migration is a separate decision against something real. "yet" = not now, not never.
- ★ **DUPLICATE-RISK, NAMED + ACCEPTED:** the clean `File` will coexist with the 3 broken lowercase "file" stubs (and clean instances alongside the 282/206 old M0) until the later migration. ACCEPTED for Sprint 41 — but WRITTEN DOWN here so nobody mistakes a stub for the real class: the real File is the NEW clean M1 unit (owned, methods, fully-qualified IOR); the 3 lowercase-"file"/0-method/null-owner stubs are the OLD broken ones, retired by the later consolidation item.

## Measured existing state (check-before-create, disk) — used to SCOPE, not to migrate now
- **File IS modelled at M1 — but broken:** 3 DUPLICATE ModelElement stubs named lowercase `"file"` (35f8f879 / a0df222c / bccba82d), **0 methods** (data-bags = defect 3), **ownerIor=null** (defect 1). → consolidate to ONE canonical `File` M1 class (dedup like R27.2), proper case, add methods, set owner, instanceOf M2.
- **Folder is NOT modelled** (0 M1 class named Folder) → MINT it.
- **M0 instances exist:** ior:class:File ×282 (21 owner-null), ior:class:Folder ×206 (92 owner-null) — they do NOT trace up to a proper M1 class and many are ownerless.
- **The MDA/MOF tower ALREADY EXISTS** (anchor into it, don't rebuild): ModelElement metaLevels M3=2, M2=32, M1=638 (R32.1/R32.2 deterministic meta-model, a1d2e3f4-*).
- **ownerIor-null is fleet-wide:** 1379 / 7138 units (~19%). Defect-1 fix is by-construction (generic) but MIGRATION scoped File/Folder-first.
- **IOR format:** Sprint 26 built an OPTIONAL `@originHost` suffix on `ior:instance:<uuid>` (federated-ior.ts, back-compat). Blast of the bare form = **212 `ior:instance:` occurrences / 52 refUuid / 66 files** → the fully-qualified change MUST be additive/phased.

## The MDA/MOF chain — LEVELS EXPLICIT (Tron's point: M0-ish strings with no M1 above them)
- **M3 (MOF, 2 units):** the meta-metamodel primitives (Class/Attribute/…). Unchanged; File/Folder's M2 conforms to it.
- **M2 (metamodel, 32 units):** the scenario metamodel — what a "Class with methods/owner" IS at the type level. File's & Folder's M1 classes are `instanceOf` the M2 Class meta-element.
- **M1 (classes):** ★ **CREATE `File` and `Folder` as clean first-class M1 ModelElement classes WITH methods + owner** — both NEW (do NOT consolidate the 3 broken `file` stubs — that is the later migration; the clean File is minted fresh). Both `instanceOf` M2, carry methods (behaviour), ownerIor=Tron.
- **M0 (instances):** a File/Folder unit created via the clean class `instanceOf` its M1 class, carrying the fully-qualified IOR + owner BY CONSTRUCTION. **rb-file-tree.ts emits M0 instances OF the clean M1 File** (not `file:<path>` synthetic strings) — the class-hop synthetic refs skipped is now mandatory. (The 282/206 EXISTING M0 instances are untouched this sprint = later migration; they coexist per the duplicate-risk note.)

## THREE defects fixed BY CONSTRUCTION (not by patching emitters)
1. **ownerIor never null — a unit cannot be minted ownerless** (Tron: "its me as the owner!!!"). Owner comes from the MINTING CONTEXT (the acting identity; Tron as root owner), supplied at the ONE create seam (UnitController.create): create without a resolvable owner → **REJECT** (fail-closed), so no caller can produce a null owner regardless of who misbehaves (same shape as the ensureViewUnit `file:<uuid>` refusal). A null owner = "belongs to nobody," a defect, not a missing field. Scope: the GUARD + the NEW clean File/Folder units carry a non-null owner by construction; the existing 21+92 (and fleet-wide 1379) null-owners are NOT backfilled this sprint (later migration item). BITE: create(ownerless) → rejected; remove the guard → RED.
2. **Fully-qualified IOR — `ior:class:File:rest:<origin>/<uuid>` (CLASS + PROTOCOL + ORIGIN + UUID).** ORIGIN is load-bearing (cross-server resolvable — the Sprint 26 federation property; a bare `file:<uuid>` resolves nowhere but here). BY CONSTRUCTION: the IOR is COMPOSED BY THE CLASS (`File.ior()` assembles class+protocol+origin+uuid), never a hand-built bare string. Scope: NEW clean File/Folder units MINT the fully-qualified form, and the resolver LEARNS to resolve that new form (a single parse branch so the new units work + resolve cross-origin via the Sprint 26 loader registry) — this is part of building the clean thing, NOT the migration. ★ EXPLICITLY OUT: rolling parse-both ACROSS the 212 existing bare occurrences / rewriting old refs / a phased drain — that is the later migration item (existing bare refs are UNTOUCHED; they keep resolving as today). BITE: a File minted without origin → rejected; a fully-qualified ref from another origin resolves via the loader registry.
3. **File & Folder are real classes with real METHODS (not data-bags).** The M1 classes DECLARE behaviour; the M0 instances answer BY ASKING THE OBJECT (Tron's law). E.g. `File.renderSelf()` / `File.move(target)` / `File.ior()`; `Folder.children()` / `Folder.renderSelf()`. This CLOSES the synthetic-ref defect structurally: the tree asks the File instance to render itself (behaviour on the object), never rebuilds the answer from `resolveRefUnit` + external machinery. BITE: the tree renders a File via its class method; a File with 0 methods → the M1-class gate RED (a data-bag is not a class).

## Traceability chain — the instrument that makes the class-hop unskippable
Full 6-step per class: **Requirement → UseCase → Class → Method → Implementation → Test.** Tron: we IGNORED it and today's synthetic refs never passed through a Class hop — the chain makes that impossible. TWO top-down tasks:
- **Task 41.1 — File:** Req (File is a modelled M1 class, owned, fully-qualified IOR, behaviour) → UC `file.renderSelf` / `file.resolveOwnIor` → Class `File` (M1, consolidated from the 3 stubs) → Methods (renderSelf/move/ior) → Impl (rb-file-tree emits M0 File instances; File.ior composes the fully-qualified ref) → Test (a File instance renders via its method; owner non-null; IOR round-trips cross-origin).
- **Task 41.2 — Folder:** same chain; Class `Folder` MINTED (absent today); Methods (children/renderSelf/ior); Impl (tree emits M0 Folder instances); Test.
Both tasks: instances trace `instanceOf` → M1 class → M2 → M3 (the level chain is VERIFIABLE, not implied).

## ★ CLASS + METHOD HOPS — concrete & mintable (architect owns; hand to req/planner so the chain is not empty)
MDA anchors (measured): M3 root `a1d2e3f4-0000-4a1b-8c2d-000000000001`; M2 `UmlClass` = `a1d2e3f4-0000-4a1b-8c2d-000000000003`; M2 `UmlMethod` = `a1d2e3f4-0000-4a1b-8c2d-000000000006`. Every method name is camelCase (name gate).

### Class `File` (NEW clean M1) — metaLevel=M1, instanceOf [UmlClass …003], ownerIor=Tron, IOR `ior:class:File:rest:<origin>/<uuid>`
Methods (real behaviour — ask-the-object):
- `File.renderSelf()` — the File renders its OWN tree node + detail (icon/name from the object; replaces the synthetic-string render). UC `file.renderSelf`.
- `File.moveTo(targetFolder)` — the File moves ITSELF into a folder (composes with the object-action move). UC `file.moveIntoFolder`.
- `File.ownIor()` — composes its OWN fully-qualified IOR (class+protocol+origin+uuid); the by-construction origin guard lives here. UC `file.resolveOwnIor`.

### Class `Folder` (NEW clean M1 — MINT) — metaLevel=M1, instanceOf [UmlClass …003], ownerIor=Tron, IOR `ior:class:Folder:rest:<origin>/<uuid>`
Methods:
- `Folder.renderSelf()` — renders its OWN tree node + detail. UC `folder.renderSelf`.
- `Folder.children()` — the Folder answers its OWN contained children (behaviour, never rebuilt from ref+external machinery). UC `folder.listChildren`.
- `Folder.linkIn(unit)` / `Folder.unlink(unit)` — add/remove ONE containment edge as object behaviour. UCs `folder.linkChild` / `folder.unlinkChild`.
- `Folder.ownIor()` — composes its fully-qualified IOR. UC `folder.resolveOwnIor`.

### Chain wiring (per task) — Req → UC → Class → Method → Impl → Test
- **Task 41.1 File:** Req(41.1) → each UC above → Class `File` → its Method → Impl (rb-file-tree renders the File instance via `renderSelf`; `File.ownIor` composes the fully-qualified ref) → Test.
- **Task 41.2 Folder:** Req(41.2) → each UC → Class `Folder` → Method → Impl (tree emits Folder instances; `Folder.children` drives the tree) → Test.
- **3 by-construction guards as FAILABLE ACs:** (1) create REJECTS an ownerless unit (owner=Tron, never null); (2) a File/Folder minted without a fully-qualified `ior:class:…:rest:<origin>/<uuid>` is REJECTED (origin present) — via `ownIor()`; (3) a 0-method class FAILS the M1-class gate (a data-bag is not a class). Remove any guard → its BITE RED.
- **Minting:** req mints Req+UC (top-down); the Class + Method units are THIS spec (architect-owned) — req/planner mint them in the chain, I refine/wire on build-go. Impl/Test are the build. NEW clean units only — do NOT touch the 3 stubs / 282-206 M0 / 212 bare refs.

## Supersedes / coordination
- **Supersedes `synthetic-ref-dnd-unify.md` (Shape A):** that followed the retracted storage axis. Under Sprint 41 the tree emits modelled M0 File/Folder instances (behaviour on the object) — the synthetic-string resolve-on-read is retired. T37.20 AC-A1/A2 (file drags as File, payload = unit JSON) are SATISFIED because the node IS a File instance. (The pin-status-integrity item is unaffected — ships on its own sequence.)
- **req** mints the 2 requirements + UCs (scenario-first). **planner** stands up Sprint 41 + Task 41.1/41.2. **I** own the chain shape + class/method set + MDA levels + the 3 by-construction guards; I backstop on build. Named separate items (ranked, not stretched): fleet-wide ownerIor-null backfill (1379); the fully-qualified-IOR migration of the existing 212 bare refs.
