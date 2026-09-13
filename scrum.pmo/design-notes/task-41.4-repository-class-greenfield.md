# Task 41.4 — Repository as an M1 class + class-first MVC greenfield (robbin-architect, 2026-09-13)

Tron ordered 41.4: create a NEW GIT REPO (via gh/git), REGISTER IT IN THE M1 TREE, as the radical-OOP class-first MVC implementation where the corrected MVP is built. Design-only; req mints. Builds on 41.1/41.2 (File/Folder as M1 classes), 41.3 (observer shape), and the fully-qualified-IOR + ownerIor-never-null guards.

## Check-before-create (measured)
- A `repo` M1 ModelElement STUB exists (lowercase, like the `file` stubs) → the 41.4 `Repository` class is CREATE-CLEAN (do NOT consolidate the stub; leave it, duplicate-risk named+accepted, later migration — same as File). Zero migration (Tron).
- M1 roots = 207 (tree top-level); `ior:class:Project` = 3 (RawBin + 2 fixtures) — a Project concept exists; Repository relates to it (below).

## (1) Repository as a real M1 class (a repo IS a class, not a path — same lesson as File/Folder)
- Class `Repository`: M1 ModelElement, `instanceOf` UmlClass (`a1d2e3f4-0000-4a1b-8c2d-000000000003`), **ownerIor=Tron** (create rejects ownerless), fully-qualified IOR **`ior:class:Repository:rest:<origin>/<uuid>`**.
- Methods (ask-the-object — the repo answers about ITSELF, never parsed from a path string):
  - `Repository.create()` — genesis via gh/git (the M0 instance's creation). ★ REAL outward action (creates a remote repo) → happens at BUILD on explicit Tron/PO go, NOT by architect; design-only here.
  - `Repository.renderSelf()` — renders its own M1-tree node + detail (the tree registration).
  - `Repository.ownIor()` — composes its fully-qualified IOR (origin is load-bearing — this repo is a distinct ORIGIN).
  - `Repository.head()` / `Repository.branch()` / `Repository.remote()` — git state as behaviour on the object.
- M0 instance = the actual new git repo, REGISTERED in the existing M1 tree as a node (an M1 root / Project-level node), ownerIor=Tron, fully-qualified IOR.
- ★ SHAPE SUB-CHOICE for Tron: is `Repository` its OWN class or a specialization of `Project`? I lean OWN class (a repo has git behaviour head/branch/remote beyond a project bucket) with a Project HAS-A Repository relation — flag for his word.

## (2) Class-first MVC kernel — the greenfield's LINE-1 architecture (so the 13/94-subscribe problem cannot recur)
The new repo starts with a minimal MVC kernel that makes the anti-patterns STRUCTURALLY impossible:
- **Model base class:** owns state + a per-object change-event keyed by its IOR (emits on mutation). EVERY domain class (File/Folder/Repository/…) extends it → change-events BY CONSTRUCTION. A data-bag (no behaviour/events) cannot exist — the base requires them.
- **View base class:** subscribes to a Model's IOR-keyed event and re-renders via that model's `renderSelf()` on notify. EVERY view extends it → observer-only BY CONSTRUCTION. No reload-only view, no copy-holding view, no polling can be added (there is no reload/poll path in the base).
- The 41.3 observer shape is the ONLY update path from unit 1.
- ownerIor never null (create rejects ownerless) from line 1; fully-qualified IOR minted natively (no bare-ref legacy to migrate); traceability chain (Req→UC→Class→Method→Impl→Test) from unit 1.
- **Result — structurally avoided:** 13/94-subscribe (View base = observer-only), 1379-null-owner (create rejects ownerless), synthetic-refs (every entity a class), forced-reload (no reload path). The greenfield cannot repeat the retrofit's compromises because they are unrepresentable.

## (3) Relationship to the existing repo — GREENFIELD, not a migration target (Tron: zero migration)
- The new repo is a fresh class-first implementation of the SAME features (the corrected MVP). The existing web4x/Web4RawBin is NOT migrated into it; existing units/refs are untouched.
- LINK = registration + federation, not code: the new repo is REGISTERED in the EXISTING M1 tree (a `Repository` node) → visible/addressable from the current system, while its CODE is independent.
- Cross-repo refs use the fully-qualified IOR (Sprint 26 federation, finally used for real): the new repo is a DIFFERENT ORIGIN; a ref to its units is `ior:class:…:rest:<newRepoOrigin>/<uuid>`, resolved via the federated loader registry. This is why origin is load-bearing (41.1/41.2) — 41.4 is the first genuine second origin.

## Failable ACs (hand to req; each: violate → RED)
1. `Repository` is an M1 class with methods + ownerIor=Tron + fully-qualified IOR (0-method / null-owner / bare-IOR → RED).
2. The new repo is registered in the M1 tree (a `Repository` node resolves) AND addressable cross-origin by its fully-qualified IOR.
3. Greenfield View base is observer-only: `grep` 0 `location.reload` / 0 polling-for-freshness in the new repo; a view that reloads/polls → RED.
4. Greenfield Model base: every domain class owns an IOR-keyed change-event; a data-bag class → RED.
5. create() rejects an ownerless unit from line 1.

## Coordination / flags
- req mints the 41.4 requirement + ACs (from THIS note, on disk — not a message). I refine the Repository class/method shape + the MVC-kernel base classes; expert builds (incl the real `gh repo create` on explicit Tron/PO go — an outward action, not architect's to run).
- ★ SUB-CHOICES NEEDING TRON'S WORD: (a) the repo NAME + gh org + visibility (public/private); (b) Repository-own-class vs Project-specialization. Both flagged; PO relays or Tron rules.
- Zero migration: the `repo` M1 stub + all existing units untouched (duplicate-risk named+accepted).
