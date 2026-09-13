<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# New git repo as M1 Repository class — greenfield class-first MVC home for the corrected MVP

[task:uuid:28978064-986e-416a-aec8-9518a504419b]

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

STOOD UP Planned, BLOCKED on Tron's word (name/org + visibility). ★ Crisis-minted by robbin-req (PO urgent 2026-09-13, Tron order; planner being rewound) — PLANNER's lane, take over/reconcile (lane-flag). Architect wires M1 registration shape + class-first MVC skeleton. ★ SAFETY: do NOT create the repo public on an inference (irreversible); default PRIVATE. No repo creation until Tron gives name+org+visibility.

## Task Description

Create a new git repo (gh/git), register it in the M1 tree as a modelled Repository class (not a path string), class-first + MVC by construction (R41.3 shape from line one), implement the corrected MVP there.

## Intention

Stop retrofitting; build the corrected architecture clean in its own modelled repo.

## Acceptance Criteria

- [ ] **(m1/repository-class)** Repository is a real M1 class (ModelElement, instanceOf UmlClass a1d2e3f4-..-003) with methods create()/renderSelf()/ownIor()/head()/branch()/remote(), ownerIor=Tron, and a fully-qualified IOR ior:class:Repository:rest:<origin>/<uuid>. CREATE-clean (the lowercase 'repo' M1 stub is LEFT, zero-migration). A 0-method / null-owner / bare-IOR Repository => RED.
- [ ] **(m1/registered-federation)** The new repo (M0 instance) is REGISTERED in the EXISTING M1 tree (a Repository node RESOLVES) AND is addressable CROSS-ORIGIN by its fully-qualified IOR — the new repo is a DISTINCT ORIGIN (Sprint 26 federation used for real; the first genuine 2nd origin). A repo referenced as a bare path string / not resolvable cross-origin => RED.
- [ ] **(mvc-kernel/view-base)** The greenfield View base class is OBSERVER-ONLY BY CONSTRUCTION: it subscribes to a Model's IOR-keyed event + re-renders via renderSelf() on notify; there is NO reload/poll path in the base. In the new repo: 0 location.reload, 0 polling-for-freshness. A view that reloads/polls => RED (so the 13/94-subscribe retrofit cannot recur).
- [ ] **(mvc-kernel/model-base)** The greenfield Model base class owns state + a per-object IOR-keyed CHANGE-EVENT (emits on mutation); EVERY domain class (File/Folder/Repository/...) extends it, so change-events exist BY CONSTRUCTION. A data-bag class (no behaviour/events) is unrepresentable => a data-bag class => RED.
- [ ] **(guard/owner-never-null)** create() REJECTS an ownerless unit from LINE 1 (owner-never-null by construction in the greenfield, Tron 'its me as the owner'). An ownerless create in the new repo => RED.
- [ ] **(safety/visibility-irreversible)** ★ SAFETY (FAILABLE): the repo is created PRIVATE by default and is NEVER created PUBLIC on an inference — PUBLIC requires TRON'S EXPLICIT word (public publishes EVERYTHING + is NOT reversible by deletion). gh repo create is a build-time OUTWARD action on explicit Tron/PO go, not now. Creating public without explicit Tron authorization => RED.
- [ ] **(mvp/greenfield-home)** The CORRECTED MVP is implemented in the NEW repo (the greenfield home) — build the corrected architecture clean, modelled from the start, THERE; not retrofitted into the old codebase.
