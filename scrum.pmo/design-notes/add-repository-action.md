# 'add Repository' action for the M1 node (mof-m1) — radical-OOP, top-down (robbin-architect, 2026-09-13)

Tron: "radical oop classes TOP DOWN scenario first planned." Design the 'add Repository' action on the mof-m1 (MOF-layer M1) node. Design-only, on disk (not a message), complete-to-method before the expert builds (PO standing rule). Builds on 41.4 (Repository M1 class) + the object-action mechanism (Command + self-registering registry).

## Measured (check-before-create)
- **Project class + gh-boundary: ABSENT in code** (ior:class:Project exists as DATA only). → CREATE-clean, no migration.
- **Three-way-diff mechanism = `rb-diff-editor.ts`** (1300 lines): `SideState = { path, ref, repo, content }` — it already selects a **repo + ref (branch) per side**; edit.ts:28-33 routes `left/right/repo/3way` refs. This IS the canonical repo/branch mechanism to reuse.
- mof-m1 node is currently a synthetic Folder (ensureViewUnit). Top-down wants a real layer class (below).

## (1) WHICH object owns 'add Repository' → the **M1-LAYER object** (a `ModelLayer` class), NOT Repository
The action is offered ON the mof-m1 node and MUTATES the layer (adds a Repository member to the M1 layer's collection) — so per radical-OOP + the object-action mechanism (a container owns adds to its collection, exactly like `Folder.linkIn`), the **M1-layer object owns `ModelLayer.addRepository(...)`** and registers it as the action offered on mof-m1. Repository's own genesis (`Repository.create`) is what the layer's action DELEGATES to. **Status-by-construction:** agents/Tron invoke the ACTION `ModelLayer.addRepository`, which mints the Repository through the create seam (owner set, IOR composed, registered in mof-m1) — NEVER a hand-written unit.
- ★ SUB-CHOICE for Tron/PO: introduce a clean `ModelLayer` class as the owner (my lean, top-down — the mof-m1 node is a Folder today; the action is the natural place to model the layer as a real class), OR fold the action onto an existing model-tree-layer object. Flag.

## (2) SELECTOR — REUSE the three-way-diff repo/branch mechanism (do NOT fork a 2nd picker)
`ModelLayer.addRepository` opens the **canonical repo/ref selector from `rb-diff-editor.ts`** (the SideState `{repo, ref}` populator) — the SAME picker the three-way-diff uses — EXTENDED to also select a **PROJECT** and carry a **'NEW project'** action (attach an EXISTING project or create a NEW one). It returns `{ repo: existing|NEW, project: existing|NEW, branch }`.
- ★ REUSE-NOT-FORK: the expert (owner of rb-diff-editor) CONFIRMS the exact reusable sub-unit to extract/share (a `RepoRefSelector` extracted from rb-diff-editor's per-side picker) BEFORE building — I identify the mechanism; the extraction point is the owner's confirm, so this is genuine reuse (a guessed target could accidentally fork — the exact thing Tron barred).

## (3) CLASSES TOP-DOWN — Repository HAS-A Project; gh boundary is its own owner
- **Repository** (M1, from 41.4) — HAS-A Project. Methods (41.4: create/renderSelf/ownIor/head/branch/remote) + `Repository.project()` (its Project) + `Repository.attachTo(project)`.
- **Project** (own class, CREATE-clean): `Project.create()` (gh project, GATED + PRIVATE default) · `Project.attach(repository)` · `Project.repositories()` · `Project.renderSelf()` · `Project.ownIor()`. M1 class, instanceOf UmlClass (a1d2e3f4-…-003), ownerIor=Tron, fully-qualified IOR.
- **GhBoundary** (own class, CREATE-clean — the gh-facing boundary owns ALL gh interaction; NEVER inline a gh call in a view or a domain method): `GhBoundary.createRepo(spec)` (gated/private) · `GhBoundary.createProject(spec)` (gated/private) · `GhBoundary.listRepos()` · `GhBoundary.listProjects()` · `GhBoundary.listBranches(repo)`. `Repository.create`/`Project.create` DELEGATE here (ask-the-object; the boundary is the one place gh is called).
- **ModelLayer** (owns the action): `ModelLayer.addRepository()` — opens the selector (2) → attach existing OR create-new via Repository/Project/GhBoundary → mint the Repository in the M1 layer (owner-set, fully-qualified IOR, registered in mof-m1, live via 41.3 observer).

## (4) ZERO MIGRATION
All clean classes (ModelLayer / Project / GhBoundary / Repository-41.4). No backfill of the old `repo`/`file`/`folder` stubs; existing units untouched. Duplicate-risk coexistence named+accepted (per S41).

## (5) OUTWARD-ACTION CAUTION (a gh repo/project create is a REAL outward act)
- **CREATE (new repo / new project) = EXPLICIT + GATED + PRIVATE default.** GhBoundary.createRepo/createProject require an explicit create-intent flag and default visibility=PRIVATE (public publishes everything and delete does not unpublish). The create happens at BUILD on Tron's explicit go — never as a side effect, never an architect step (same class as a prod deploy).
- **SELECT / ATTACH an EXISTING repo/project = NOT gated** (no outward create; read/attach only). So the selector's 'existing' branches are safe; only the 'NEW' branches hit the gated create.

## Chain complete-to-method (hand to expert; must be complete BEFORE build — PO rule)
Full 6-step per class. Req = "the M1 layer adds a Repository via an owned ACTION (radical-OOP), reusing the three-way-diff selector, gh-create gated+private, zero migration."
- **UC `layer.addRepository`** → Class `ModelLayer` → Method `ModelLayer.addRepository` → Impl → Test.
- **UC `repository.attachToProject`** → Class `Repository` → Method `Repository.attachTo` (+ 41.4 create/renderSelf/ownIor) → Impl → Test.
- **UC `project.create` / `project.attachRepository`** → Class `Project` → Methods `Project.create`/`attach`/`repositories`/`renderSelf`/`ownIor` → Impl → Test.
- **UC `ghBoundary.createRepo` / `ghBoundary.listRepos`** → Class `GhBoundary` → Methods createRepo/createProject/listRepos/listProjects/listBranches → Impl → Test.
- **UC `selector.pickRepoProject`** → the reused rb-diff-editor RepoRefSelector (extended project + new-project) → Impl (extract/share) → Test.
- **Failable ACs:** (1) the action is invoked, never a hand-written Repository (a hand-write bypassing the action → RED); (2) ONE selector — grep 0 second repo/branch picker (a forked picker → RED); (3) gh calls ONLY in GhBoundary — grep 0 inline gh in views/methods → RED; (4) create defaults PRIVATE + requires explicit create-intent (a public/no-confirm create → RED); (5) new Repository/Project carry ownerIor=Tron + fully-qualified IOR (null-owner/bare-IOR → RED); (6) attach-existing performs NO outward create.

## Flags (Tron/PO)
- (a) `ModelLayer` as the action owner vs an existing layer object (my lean: clean ModelLayer, top-down).
- (b) exact rb-diff-editor selector sub-unit to reuse — expert confirms (reuse-not-fork).
- (c) repo/project NAME + org + VISIBILITY = Tron (default PRIVATE; carried from 41.4).
- req mints Req+UC+Class+Method (complete-to-method) from THIS note; I refine/wire; expert builds; gh-create at build on Tron's go.
