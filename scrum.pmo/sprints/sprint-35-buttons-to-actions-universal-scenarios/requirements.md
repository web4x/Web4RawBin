<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 35 Requirements — Buttons->Actions + Universal On-Disk Scenarios

## Requirements

- [ ] **R35.1 — Convert legacy per-view buttons into universal action-bar actions**
  [requirement:uuid:b1fbf276-7e20-4e03-9e83-281f64574beb]
  Every bespoke per-item-view button (rb-detail-view vcard[member/user]+preview-file[file]; rb-file-detail new-tab[file]; rb-webitem-detail proxy-preview[webitem]) becomes an actionsForContext/ACTIONS_BY_TYPE verb [download-vcard/preview-file/open-newtab/proxy-preview] rendered in the ONE shared universalActionBar; detail views drop their own button markup; handler via rb-drawer-action (model.ts wireDrawerActions) dispatches to the existing fns (downloadVCard/renderFilePreview/window.open/toProxy). zoom-reset EXCLUDED (viewer control, not an item-action).
  **Acceptance criteria:**
  - [ ] **(functional)** Every bespoke per-view button maps to an actionsForContext/ACTIONS_BY_TYPE verb keyed by type (member/user->download-vcard; file->preview-file+open-newtab; webitem->proxy-preview), rendered in the shared universalActionBar.
  - [ ] **(functional)** INV-1: each converted action preserves the OLD button's effect (dispatches to the existing downloadVCard/renderFilePreview/window.open/toProxy fn) — same result, relocated into the bar.
  - [ ] **(functional)** INV-2: NO bespoke item-action button remains in any detail view (zoom-reset EXCEPTED = in-pane viewer control, not an item-action).
  - [ ] **(functional)** Verb-listing rides actionsForContext (a1a5be99); the click handler routes via rb-drawer-action (wireDrawerActions). Client-only.
  - [ ] **(gate)** GATE @390 real-WebKit: each converted action is PRESENT + FIRES in the bar per type; the old bespoke buttons are gone; no behavior lost.
  -> actionBar.convertLegacyButtons [uc:uuid:f9c241bf-4af9-43fe-b945-bcd03c3083ad]

- [ ] **R35.2 — Every item type resolves to a REAL on-disk ior:class:X unit (both buttons always work)**
  [requirement:uuid:030a1801-4ce0-4e08-85c0-80bf774b0794]
  GENERALIZE the A2 resolver ensureFolderFileUnit -> ensureViewUnit(ior) so EVERY item type resolves to a REAL on-disk ior:class:X unit (MODEL_STORE) and both OScenario/OEdit always work. Mint the currently-null cases: synthetic MOF folder refs (project:RawBin, rawbin:ts/puml/diagram/traceability, mof-m1, mof-m2[:mc]) -> ior:class:Folder (keyToUuid('folder::'+ref)); puml-src leaves -> ior:class:File/PumlArtifact (keyToUuid('puml::'+path)). Deterministic idempotent lazy mint, prod scenario/index NEVER touched, tree/mofChildren byte-unchanged (fork-A, only /api/ior + /scenario resolve).
  **Acceptance criteria:**
  - [ ] **(functional)** EVERY item type rendered in a view resolves to a REAL ior:class:X unit on disk (MODEL_STORE) so OScenario (/scenario?ior) + OEdit (scenarioEditorHref) both ALWAYS work, never dead/no-op. Generalizes ensureFolderFileUnit -> ensureViewUnit covering synthetic MOF folders (->Folder) + puml-src (->File/PumlArtifact).
  - [ ] **(functional)** INV-A2-2: deterministic keyToUuid ('folder::'+ref / 'puml::'+path) = idempotent LAZY mint — fetch twice yields the SAME uuid, no dup on re-open.
  - [ ] **(security)** INV-A2-3: units minted in MODEL_STORE ONLY; prod scenario/index NEVER touched.
  - [ ] **(functional)** INV-A2-1: tree/mofChildren output BYTE-unchanged (only /api/ior + /scenario resolve to the new unit) — fork-A.
  - [ ] **(gate)** GATE @390 real-WebKit: for EVERY item type, OScenario + OEdit both resolve to a real unit (not dead) — data-having sample per type: Folder=rawbin:ts, File=file:src/ts/server/server.ts, PumlArtifact=a real puml/ leaf (NOT a degenerate entity).
  -> modelTree.ensureViewUnit [uc:uuid:c3902503-5bdc-479c-8457-51ba4421f98a]

- [ ] **R35.3 — Resolved scenarios are POPULATED with the item's information (not empty stubs)**
  [requirement:uuid:b039cd80-0c49-4c78-8701-629dbcac6228]
  Each resolved scenario unit is POPULATED with the item's actual data (mirror the node's view data -> unit model fields), not a bare/empty unit. The R35.2 resolver (ensureViewUnit) writes the per-type fields at mint time. OScenario opens a scenario that SHOWS the real info; OEdit edits real content. Per-type field-set: Folder {name,kind:folder,location,parent,childCount}; File {name,location:rel,kind:file,sourceFile}; PumlArtifact {name,kind:pumlArtifact,sourceFile,location}; Project {name:RawBin,kind:project,childCount:4}. Trace/modelelement/diagram units already carry info (no change).
  **Acceptance criteria:**
  - [ ] **(functional)** Each resolved scenario unit is POPULATED with the item's actual data (name, description, type-specific fields, location/source) — NOT a bare/empty stub. The R35.2 ensureViewUnit resolver writes these at mint time (mirror node display data -> unit model).
  - [ ] **(functional)** Per-type field-set non-empty: Folder = name/kind:'folder'/location/parent/childCount; File = name/location:rel/kind:'file'/sourceFile; PumlArtifact = name/kind:'pumlArtifact'/sourceFile/location; Project = name:'RawBin'/kind:'project'/childCount:4.
  - [ ] **(functional)** OScenario opens a scenario showing the real info; OEdit edits real content (not an empty unit).
  - [ ] **(gate)** GATE @390 real-WebKit: the resolved scenario CONTAINS the item's info — assert the type's fields are NON-EMPTY for a populated sample per type.
  -> modelTree.populateViewUnitFields [uc:uuid:8f1eed4d-5ce6-4901-992d-699a8fb8cf0b]

- [ ] **R35.4 — Add traceability as the 4th folder under the MDA RawBin project**
  [requirement:uuid:476d367f-cad6-4b3e-b988-d90ee5049ac3]
  Tron: 'add the traceability tree as the fourth folder under the MDA project RawBin folder - ts, puml, diagrams, traceability.' The RawBin project node (server.ts:1240-1247, currently [ts,puml,diagram], childCount 3 @:1236) gets a 4TH folder 'traceability': (a) add mofFolder('rawbin:traceability','traceability',traceCount,'trace-icon') at :1247; (b) bump childCount 3->4 at :1236; (c) uuid==='rawbin:traceability' -> return requirement-root MofNodes (walk /api/trace roots) so it expands into the REAL trace tree via the existing rb-trace-tree (reuse, no fork); (d) folder + children resolve to real on-disk scenarios (R35.2/R35.3; trace units already real).
  **Acceptance criteria:**
  - [ ] **(functional)** The MDA RawBin project node shows EXACTLY [ts, puml, diagrams, traceability] — a 4th mofFolder('rawbin:traceability',...) added at server.ts:1247 + childCount hint bumped 3->4 at :1236.
  - [ ] **(functional)** rawbin:traceability expands into the REAL trace tree (Requirement->UseCase->Class->Method->Impl->Test) via the EXISTING rb-trace-tree — returns the requirement-root MofNodes (walk /api/trace roots), reuse no fork.
  - [ ] **(functional)** The traceability folder + its children resolve to real on-disk scenarios containing info (ties R35.2/R35.3; trace units already real); nodes open a real detail + OScenario/OEdit.
  - [ ] **(gate)** GATE @390 real-WebKit: the RawBin project node expands to EXACTLY [ts, puml, diagrams, traceability]; the traceability folder expands to the Req->...->Test tree; nodes open real detail + both buttons resolve.
  -> mofTree.traceabilityFolder [uc:uuid:beb0af0d-ca65-44c5-bdbb-e06d99a14862]
