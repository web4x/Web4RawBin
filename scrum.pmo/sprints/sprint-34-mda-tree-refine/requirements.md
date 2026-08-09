<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 34 Requirements — MDA-tree refine (retain-protect-tweak the S33 achievement)

## Requirements

- [ ] **R34.1 — Universal orange «Scenario»+«Edit» default actions on ALL scenario-instance detail views (client)**
  [requirement:uuid:793760f2-1c58-4dfa-ae8c-96f8ec4c8027]
  Every scenario-instance detail view MUST render an orange «◆ Scenario» + «✎ Edit» DEFAULT action pair — generic, solved once for every scenario instance — reusing actionsForContext/DEFAULT_ACTIONS (model.ts); type-specific verbs append AFTER. Client-only (ride R33.6.5/R33.9 action-bar, no fork).
  **Acceptance criteria:**
  - [ ] **(functional)** Every scenario-instance detail view renders the «◆ Scenario» + «✎ Edit» default pair via actionsForContext/DEFAULT_ACTIONS, independent of and BEFORE any type-specific verbs.
  - [ ] **(functional)** «Scenario» dispatches to the instance's scenario-view (/scenario?ior=<ref>).
  - [ ] **(functional)** «Edit» opens the edit flow for that instance.
  - [ ] **(functional)** The default pair renders ORANGE (a .da-btn variant class), visually distinct from type-specific verbs.
  - [ ] **(gate)** GATE @390 real-WebKit: open ANY item detail → the orange Scenario+Edit pair is present + functional; type-specific verbs append after.
  -> drawer.universalScenarioEdit [uc:uuid:8106d378-04ee-4869-b803-37b21dd2b0bb]

- [ ] **R34.2 — File & Folder are real ior:class:Folder/File units in MODEL_STORE, showing exact location (server)**
  [requirement:uuid:fe463924-154e-4f99-bf3d-2fabc388042c]
  mofChildren MUST mint/use real ior:class:Folder + ior:class:File units in MODEL_STORE (not synthetic dir:/file: collection refs) so each folder/file node resolves to a REAL unit with a detail view + the R34.1 default actions + its exact LOCATION. Deterministic uuid = keyToUuid(rel-path) (R32.2), MODEL_STORE-isolated (R32.5, prod untouched). Server; tree render unchanged.
  **Acceptance criteria:**
  - [ ] **(functional)** mofChildren mints/uses real ior:class:Folder + ior:class:File units in MODEL_STORE (not synthetic dir:/file: collection refs); each resolves to a real unit with a detail view.
  - [ ] **(functional)** The File/Folder detail shows its exact LOCATION (rel-path).
  - [ ] **(functional)** File/Folder detail shows the R34.1 «Scenario»+«Edit» default pair (depends R34.1).
  - [ ] **(functional)** Unit uuid = keyToUuid(rel-path) (R32.2 deterministic) so re-derive re-binds the same unit — no duplicates.
  - [ ] **(security)** Units minted in MODEL_STORE ONLY; prod scenario/index untouched (R32.5 isolation); tree render unchanged (still rb-trace-tree folders); /trace detail unregressed.
  - [ ] **(gate)** GATE @390 real-WebKit: a File/Folder node opens a REAL detail with exact location + Scenario/Edit; prod scenario/index untouched.
  -> modelTree.fileFolderUnit [uc:uuid:cdbde4ef-4d10-4daf-9a0f-a21e6055ea9b]

- [ ] **R34.3 — In-room action bar: Add-folder verb+endpoint / remove-from-tree / delete-unit-with-confirm-WARN**
  [requirement:uuid:615048d8-4bfb-449a-81e0-41ca460c969a]
  The in-room action bar MUST offer, for the selected item: «📁 Add folder» (new verb + POST /api/model/folder/create minting an ior:class:Folder unit in MODEL_STORE, then load()+expandPath reveal), «✕ Remove» (detach node from tree/diagram VIEW only — non-destructive, unit stays), and «🗑 Delete» (destroy the UNIT, gated by a confirm() WARN before the delete endpoint). Distinct verbs = same lifecycle discipline as R33.8/R33.9.
  **Acceptance criteria:**
  - [ ] **(functional)** «📁 Add folder» appears on folder/diagram context; POST /api/model/folder/create {parent,name} mints an ior:class:Folder unit in MODEL_STORE (store-only INV, mirrors /api/model/diagram/create), then load()+expandPath reveals it.
  - [ ] **(functional)** «✕ Remove» detaches the node from its tree/diagram VIEW (view-link removal, non-destructive) — the scenario unit STILL EXISTS.
  - [ ] **(security)** «🗑 Delete» destroys the UNIT, gated by a confirm() WARN ('Delete <name> permanently?') BEFORE the delete endpoint; on confirm the unit is gone.
  - [ ] **(functional)** remove and delete are DISTINCT verbs with distinct labels + distinct semantics (view vs unit), same discipline as R33.8/R33.9.
  - [ ] **(gate)** GATE @390 real-WebKit: add folder → appears+reveals; remove → node gone from tree BUT unit still exists; delete → confirm WARN → unit gone.
  -> diagram.addFolder [uc:uuid:0dae4d84-a18e-44f9-894d-e542b6578938]
  -> model.createFolder [uc:uuid:5594dfa6-a0c2-4964-a007-e086ca37ce72]
  -> diagram.removeFromTree [uc:uuid:aec2fdd9-7198-403f-a8a0-963f86342a19]
  -> unit.deleteWithConfirm [uc:uuid:daff6011-ca76-4941-bc1c-de13231cc74e]

- [ ] **R34.4 — Element remove-from-diagram appears in the bar (wire active-diagram context) — RESIDUAL, rides R33.9**
  [requirement:uuid:21d3df6c-bd67-46db-af28-f161069d789e]
  The R33.9 remove-from-diagram verb (model.ts:75, removeFromDiagram handler) already EXISTS but shows only when a diagram is active. RESIDUAL: ensure rb-active-diagram{uuid} fires when a diagram is viewed AND an element is selected from THAT diagram, so membership verbs (incl remove-from-diagram) appear. NO new verb — ride R33.9.
  **Acceptance criteria:**
  - [ ] **(functional)** When a diagram is being viewed AND an element is selected from THAT diagram, rb-active-diagram{uuid} fires so membership verbs (incl remove-from-diagram) appear in the bar.
  - [ ] **(functional)** The EXISTING R33.9 remove-from-diagram verb removes the element FROM the diagram — no new verb fabricated.
  - [ ] **(functional)** Rides R33.9 actionsForContext + removeFromDiagram (ride-existing; NO new Method/Impl — the chain reuses the built R33.9 nodes).
  - [ ] **(gate)** GATE @390 real-WebKit: select an element that IS in the open diagram → remove-from-diagram shows + works.
  -> actionBar.activeDiagramContext [uc:uuid:553229c3-2221-4c16-8e42-e46a7efb9fc0]

- [ ] **R34.5 — Tree auto-expands the folder ancestor path on select→navigate (wire trigger to R33.7.4 reveal)**
  [requirement:uuid:6f604af0-947f-43e5-93c0-61241b04a1d7]
  On select→navigate the tree MUST auto-EXPAND the folder ancestor path to REVEAL the target class/element. Nav is already CORRECT (Tron confirmed: works when expanded); only the auto-expand/reveal is missing. FIX = wire the missing trigger to dispatch rb-tree-reveal{ref} / call revealModelElement→expandPath (R33.7.4), reused wholesale. New GAP, but ride-existing impl (LOW, no fork, no new verb/Method).
  **Acceptance criteria:**
  - [ ] **(functional)** On select→navigate, the tree auto-EXPANDS the folder ancestor path and reveals/highlights the target class/element (nav already correct; only the reveal was missing).
  - [ ] **(functional)** The fix wires the missing trigger to dispatch rb-tree-reveal{ref} / call revealModelElement→expandPath (R33.7.4) — reused wholesale, NO fork, NO new verb/Method.
  - [ ] **(functional)** An off-tree / absent target is a graceful no-op (no error).
  - [ ] **(gate)** GATE @390 real-WebKit: select a class (from diagram/detail) → its folder path auto-expands + the leaf highlights, with NO manual expand.
  -> traceTree.autoExpandOnNavigate [uc:uuid:a156a018-e171-4a1d-9f2c-b82851bbe384]

- [ ] **R34.6 — Element unit-actions appear on class-select in the tree (wire detail-shown) — RESIDUAL, rides R33.9/R33.7.4**
  [requirement:uuid:ba3fe02e-b1e5-4013-b7e0-2b99c1f9b33a]
  Modelelement unit actions already EXIST via R33.9 actionsForContext. RESIDUAL: ensure a class-select IN THE TREE dispatches rb-drawer-detail-shown{type:'modelelement',ref} (so setActions fires) + sets active-diagram (R34.4) when applicable. Folds into the R-B/R-C action-bar wiring. NO new verb — ride R33.9/R33.7.4.
  **Acceptance criteria:**
  - [ ] **(functional)** A class-select IN THE TREE dispatches rb-drawer-detail-shown{type:'modelelement',ref} so setActions fires.
  - [ ] **(functional)** Modelelement unit verbs (+ membership if a diagram is active, R34.4) appear in the action bar on class-select.
  - [ ] **(functional)** Rides R33.9 actionsForContext + R33.7.4 (ride-existing; NO new verb/Method).
  - [ ] **(gate)** GATE @390 real-WebKit: select a class in the tree → its unit verbs (+ membership if a diagram is active) appear in the bar.
  -> actionBar.classSelectActions [uc:uuid:bf4d39b4-ddb7-4d03-b7ff-6f7b367a38aa]

- [ ] **R34.7 — Universal action bar on ALL drawer usages (shared drawer renders A1 default + host registerActionProvider)**
  [requirement:uuid:ad8c6d3e-0e28-498b-8981-bb86d9fe3e86]
  R-E (Tron 2026-08-03: 'add the action bar to all usages of the drawer'). The action-bar MECHANISM is already shared (setActions/showActionsForType, R33.6.5) and rb-drawer-detail-shown fires on EVERY drawer detail-render, but the ONLY listener is model.ts wireDrawerActions -> the bar shows on /model ONLY; 6 of 7 drawer mount sites (/trace, /scenario, in-room, /server-manager, feature-manager, trace/index) show NO bar. FIX (solve-once in the SHARED drawer, NO fork): showActionsForType itself sets the UNIVERSAL R-A A1 default [Scenario,Edit] + exposes RbDetailDrawer.registerActionProvider(fn); the model host REGISTERS its context verbs via actionsForContext (R33.9 reused verbatim) instead of the isolated wireDrawerActions. UNIFIES with R-A A1 (A1's default is built INTO the shared drawer = ONE universal mechanism). Client-only.
  **Acceptance criteria:**
  - [ ] **(functional)** INV-E1: the action bar renders on EVERY drawer usage (all 7 mount sites: /trace, /scenario, in-room, /server-manager, feature-manager, trace/index, /model) with the context-appropriate verb-set — BY CONSTRUCTION (the shared drawer sets the default itself, not gated on a per-page host wiring).
  - [ ] **(functional)** INV-E2: default [◆ Scenario, ✎ Edit] everywhere; + model verbs (unit always / membership when a diagram is active, R33.9 actionsForContext) ONLY where the model host registered via registerActionProvider; + per-type verbs where defined. Reuse actionsForContext — no fork.
  - [ ] **(functional)** INV-E3: setActions/showActionsForType/actionsForContext reused as-is (no fork); the /model page's existing bar + verb-set UNCHANGED (unregressed); rb-drawer-detail-shown still dispatched (back-compat); empty/chat selection still clears the bar.
  - [ ] **(functional)** The «Scenario» verb opens /scenario?ior=<ref>; the «Edit» verb opens the edit flow — both GENERIC (no host needed), wired in the shared drawer's rb-drawer-action path so they work on every usage.
  - [ ] **(functional)** Unifies with R-A A1 (793760f2): A1's universal [Scenario,Edit] default is built INTO the shared drawer per this design, so A1 + R-E are ONE universal mechanism (not two parallel implementations).
  - [ ] **(gate)** GATE @390 real-WebKit: the action bar is PRESENT on a detail in /trace, /scenario, in-room, /server-manager, feature-manager (default Scenario+Edit at minimum); /model still shows its FULL model verb-set (unregressed, R-A/R33.9); Scenario opens the scenario view, Edit opens edit; empty selection clears the bar; no page throws.
  -> drawer.universalActionBar [uc:uuid:a1393fcc-1fac-44d4-bcff-e8212e471127]
