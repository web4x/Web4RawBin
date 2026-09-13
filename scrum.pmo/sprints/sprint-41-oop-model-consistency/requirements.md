<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 41 Requirements — Sprint 41 — OOP Model Consistency

## Requirements

- [ ] **R41.1 — File is a modelled M1 class (MOF/MDA) — behaviour not data-bag, owned (never null), fully-qualified IOR, carried whole through DnD**
  [requirement:uuid:993db1f3-bbca-4dc2-8004-43a47e6a8c98]
  create a class File and a class Folder during two top down planned sprint tasks with full tracability and as full mda mof chain in a sprint 41: OOP model consistency
  Model File as a REAL M1 Class (radical-OOP: 'a FILE IS a File class'). Today rb-file-tree emits bare strings ('collection:dir:src/shared/test','collection:file:src/shared/','file:b9fa43a2-...') and File units are broken (ownerIor NULL; {uuid,name,location,kind,ext} data-bag, no backing class). CREATE File CLEAN + NEW as a radical-OOP M1 class (Tron zero-migration: leave the 3 lowercase 'file' ModelElement stubs as legacy, do NOT consolidate/migrate). 3 by-construction guards (owner-never-null / fully-qualified-additive-IOR / class-has-methods). TOP-DOWN, full 6-step chain, no backfill.
  **Acceptance criteria:**
  - [ ] **(guard/owner-never-null)** The CREATE PATH REJECTS an ownerless File BY CONSTRUCTION (Tron: 'its me as the owner') — ownerIor never null on a NEW File. A GUARD on new creates, NOT a backfill of the existing units. The owner is a fully-qualified instance IOR (Tron / resolved room / user).
  - [ ] **(guard/federation-ior)** NEW File units carry a FULLY-QUALIFIED IOR = CLASS + PROTOCOL + ORIGIN + UUID ('ior:class:File:rest:<origin>/<uuid>', Tron verbatim), and the RESOLVER resolves that new form. ADDITIVE / zero-migration: the legacy bare form still parses and the 212 existing bare refs are NOT rewritten. ORIGIN is mandatory — it makes the ref resolvable ACROSS servers (federation).
  - [ ] **(guard/behaviour-not-data-bag)** File is a CLASS WITH METHODS (behaviour) — ask-the-object: a file renders/resolves ITSELF via its methods (renderSelf / resolveOwnIor / children). A 0-method DATA-BAG ({uuid,name,location,kind,ext} with no behaviour) FAILS — that is the radical-OOP violation that made the tree emit strings.
  - [ ] **(mof/m1-class)** File is a REAL M1 Class unit (ior:class:Class name 'File', proper case) in the MOF/MDA chain — radical-OOP: 'a FILE IS a File class'. Every file rendered/dragged/stored is a File-class INSTANCE (M0) resolved THROUGH the class, never an ad-hoc JSON blob nor a computed bare string.
  - [ ] **(dnd/carries-unit)** Dragging a File in rb-file-tree carries the REAL File-class unit (its fully-qualified IOR resolving to the stored unit + owner) through the ONE DnD contract (R37.20/R40.106), NOT a computed bare string ('collection:dir:...', 'collection:file:...', 'file:<uuid>'). Drop places a LINK to that one unit.
  - [ ] **(126/top-down)** File is delivered TOP-DOWN through the FULL 6-step MDA chain minted BEFORE any code — Requirement -> UseCase -> Class(M1) -> Method -> Implementation -> Test — NO backfill (Rule #126 purest form). Every chain link on disk before File code ships.
  - [ ] **(create/clean-new)** The File class is CREATED CLEAN + NEW — a radical-OOP M1 File class existing for the FIRST time (Tron zero-migration re-scope). It is NOT consolidated/migrated/backfilled from the existing lowercase-'file' ModelElement stubs (35f8f879 / a0df222c / bccba82d (ior:class:ModelElement name 'file', owner null)) — those are LEFT as legacy. The new File is the canonical M1 model going forward.
  -> file.renderSelf [uc:uuid:59649d58-f4d6-4862-9fee-93eab5055982]
  -> file.moveIntoFolder [uc:uuid:0b09a430-eb28-46d2-a84b-652a63db1de1]
  -> file.resolveOwnIor [uc:uuid:812d0e73-bd4b-41df-ad49-860f38ced744]

- [ ] **R41.2 — Folder is a modelled M1 class (MOF/MDA) — RECONCILE the existing Folder class (77ff595d), fix its null owner, add M1 model + fully-qualified IOR + behaviour + DnD-carries-unit**
  [requirement:uuid:0ac8c383-ec63-4515-b27a-6614546ed9ae]
  create a class File and a class Folder during two top down planned sprint tasks with full tracability and as full mda mof chain in a sprint 41: OOP model consistency
  Model Folder as a REAL M1 Class. ★ CHECK-BEFORE-CREATE (measured): a Folder Class ALREADY EXISTS — 77ff595d (R40.86, implements DropTarget, ownerIor NULL). Per Tron ZERO-MIGRATION, LEAVE 77ff595d un-migrated and CREATE a NEW clean Folder M1 class that SUPERSEDES it as the canonical model (recorded, not reconciled). Measurement surfaced so the supersede is explicit, not a silent 2nd class. 3 by-construction guards + full chain, no backfill.
  **Acceptance criteria:**
  - [ ] **(guard/owner-never-null)** The CREATE PATH REJECTS an ownerless Folder BY CONSTRUCTION (Tron: 'its me as the owner') — ownerIor never null on a NEW Folder. A GUARD on new creates, NOT a backfill of the existing units. The owner is a fully-qualified instance IOR (Tron / resolved room / user).
  - [ ] **(guard/federation-ior)** NEW Folder units carry a FULLY-QUALIFIED IOR = CLASS + PROTOCOL + ORIGIN + UUID ('ior:class:Folder:rest:<origin>/<uuid>', Tron verbatim), and the RESOLVER resolves that new form. ADDITIVE / zero-migration: the legacy bare form still parses and the 212 existing bare refs are NOT rewritten. ORIGIN is mandatory — it makes the ref resolvable ACROSS servers (federation).
  - [ ] **(guard/behaviour-not-data-bag)** Folder is a CLASS WITH METHODS (behaviour) — ask-the-object: a folder renders/resolves ITSELF via its methods (renderSelf / resolveOwnIor / children). A 0-method DATA-BAG ({uuid,name,location,kind,ext} with no behaviour) FAILS — that is the radical-OOP violation that made the tree emit strings.
  - [ ] **(mof/m1-class)** Folder is a REAL M1 Class unit (ior:class:Class name 'Folder', proper case) in the MOF/MDA chain — radical-OOP: 'a FOLDER IS a Folder class'. Every folder rendered/dragged/stored is a Folder-class INSTANCE (M0) resolved THROUGH the class, never an ad-hoc JSON blob nor a computed bare string.
  - [ ] **(dnd/carries-unit)** Dragging a Folder in rb-file-tree carries the REAL Folder-class unit (its fully-qualified IOR resolving to the stored unit + owner) through the ONE DnD contract (R37.20/R40.106), NOT a computed bare string ('collection:dir:...', 'collection:file:...', 'folder:<uuid>'). Drop places a LINK to that one unit.
  - [ ] **(126/top-down)** Folder is delivered TOP-DOWN through the FULL 6-step MDA chain minted BEFORE any code — Requirement -> UseCase -> Class(M1) -> Method -> Implementation -> Test — NO backfill (Rule #126 purest form). Every chain link on disk before Folder code ships.
  - [ ] **(create/clean-new)** The Folder class is CREATED CLEAN + NEW as a radical-OOP M1 class (Tron zero-migration re-scope). ★ MEASURED (robbin-req, measure-don't-relay, FYI not blocking): a legacy Folder Class EXISTS — 77ff595d-a6c7-4022-a437-198c5a714bc7 (ior:class:Class name 'Folder', R40.86 DropTarget, ownerIor NULL). Per Tron ZERO-MIGRATION it is LEFT un-migrated; the new S41 Folder SUPERSEDES it as the canonical M1 model (recorded, not reconciled). Architect design said 'Folder absent/mint' — surfaced the existing unit so the supersede is explicit, not a silent 2nd class.
  -> folder.renderSelf [uc:uuid:8b2d0f15-1c3e-4b7f-8d42-2e6a7b3c4d5e]
  -> folder.listChildren [uc:uuid:7a1c9e04-0b2f-4a6e-9c31-1d5f6a2b3c4d]
  -> folder.linkChild [uc:uuid:eebe2340-76a4-46d8-b26e-5c7d79569264]
  -> folder.unlinkChild [uc:uuid:b1382584-4c46-4a50-a6bb-593d91101ef1]
  -> folder.resolveOwnIor [uc:uuid:fe29a839-9a32-4e7e-b760-16449c607898]

- [ ] **R41.3 — File/Folder views update LIVE via MVC (view observes model, object notifies) — no forced reload; observing != polling**
  [requirement:uuid:500be03e-1f3c-44c5-ad15-bdd1e9fea7d4]
  the ui has NO MVC liveupdates... its all forced reloads!!! | add that as requirements for folder and file as task 41.3
  Tron: 'the ui has NO MVC liveupdates... its all forced reloads!!!' — cost him TWICE today (S41 rendered Tasks(0); the pin read written-not-landed) BOTH while disk was correct: every 'disk is correct' failed to reach his screen. Radical-OOP, SCOPED to the File/Folder classes built in 41.1/41.2 (NOT a fleet-wide refactor): the VIEW OBSERVES THE MODEL and the OBJECT NOTIFIES on change; a File/Folder view updates WITHOUT a forced reload when its unit changes. Views holding COPIES they re-pull = the data-layer anti-pattern at the VIEW layer. Applies the existing C4/R37.4 MVC law (one controller + viewBus UNIT_CHANGED + registered projections) to File + Folder. Written against the architect's MEASURED live-update coverage.
  **Acceptance criteria:**
  - [ ] **(observer/subscribe)** A File/Folder VIEW (BOTH the tree-node AND the detail view) SUBSCRIBES to its OWN object's change-event on the ViewBus, keyed on the unit's IOR — NOT a global rebuild, NOT a subscription to all traffic.
  - [ ] **(observer/notify-seam)** The File/Folder UNIT EMITS a per-object change-event on mutation, via the ONE write seam (publishUnitChanged keyed by its IOR). The object notifies through the single seam; nothing mutates a File/Folder without emitting.
  - [ ] **(observer/render-self)** On notify, the view re-renders THAT object via its renderSelf() (the 41.1/41.2 method) — NO wholesale tree rebuild, NO forced reload. Ask-the-object: the changed File/Folder renders itself.
  - [ ] **(observer/reaches-screen)** A File/Folder change REACHES THE VIEW with NO manual refresh (the stale-render bite — every 'disk is correct' must reach Tron's screen). Bypassing the observer/seam leaves the screen stale.
  - [ ] **(observer/no-polling)** NO setInterval / polling for File/Folder freshness (observing != polling). Freshness comes from the per-object event, never a timer.
  - [ ] **(scope/two-classes)** SCOPED to File + Folder (tree-node + detail views of the 41.1/41.2 classes) — converges with the 41.1/41.2 renderSelf + route-writes-through-seam, scoped to these two. NOT a fleet-wide view refactor; rides the existing C4/R37.4 ViewBus, no new bus.
  - [ ] **(measured/coverage)** WRITTEN AGAINST MEASURED REALITY (architect measurement, 41.3 note 95b04fa02): client surface = 94 .ts files, 13 SUBSCRIBE (ViewBus.on), 10 force RELOAD/href - live-observation is the MINORITY. Tron reload-only surfaces named: RoomView (WS-direct, no ViewBus), rb-task-detail (static/reload), model.ts host, universal-actions action-bar; drawer subscribes AND reloads. SCOPED to File/Folder: the File/Folder tree-node + detail views must SUBSCRIBE - ZERO reload-only File/Folder views after. A File/Folder view still reload-only after => RED.
  -> fileFolderView.observesUnitLiveNoReload [uc:uuid:8f464a83-d107-4a98-9a08-73ca6f5e456f]
