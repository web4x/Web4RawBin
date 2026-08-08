<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 40 Requirements — Server Manager — deployment-node model + mobile input control

## Requirements

- [ ] **R40.1 — Open Claude.ai RC action (per-pane deep link to the pane's agent)**
  [requirement:uuid:caab6d86-35b8-4865-acf4-d4210670e775]
  an action that opens the Claude app or webpage at the AGENT's RC for the SELECTED pane (per-pane deep link, e.g. claude.ai/code/<session-id>)
  An action, visible and fireable from a pane's surface, that opens the Claude app (or the web page as fallback) at the SELECTED pane's AGENT's Remote Control — resolving the pane -> its agent -> its session id -> a per-pane deep link (e.g. claude.ai/code/<session-id>) — so firing it on pane 0.1 opens 0.1's agent's RC, never another pane's.
  **Acceptance criteria:**
  - [ ] **(visible-fireable)** The action is visible AND fireable from the pane surface (the pane's own action affordance).
  - [ ] **(resolve-chain)** Firing resolves the SELECTED pane -> its agent -> its session id -> the RC deep link (claude.ai/code/<session-id>).
  - [ ] **(app-else-web)** Opens the Claude app if available, else the web page (app-if-available-else-web).
  - [ ] **(right-agent)** Opens the RIGHT agent's RC: firing on pane 0.1 must NOT open 0.0's RC (per-pane isolation, no cross-pane leak).
  - [ ] **(device-gate)** Verified @390 mobile REAL-WebKit: the action fires and opens the correct per-pane deep link.
  -> pane.resolveRcLink [uc:uuid:350ab353-0f6b-496c-b2f5-ff0f2eaf0ce2]

- [ ] **R40.2 — WODA.prod modelled as a UML deployment Node (with real refs + otmux children)**
  [requirement:uuid:adab1bb5-a292-490b-84fb-6e921dfb6a8f]
  the SERVER modelled as a UML deployment NODE unit with REFERENCES to (a) its SSH config, (b) its configured DOMAIN, (c) its LETSENCRYPT CERTIFICATE, and the CURRENT OTMUX ITEMS (session -> window -> pane) as CHILDREN of that root
  The WODA.prod server is modelled as a UML deployment-NODE scenario unit with resolvable references to (a) its SSH config, (b) its configured domain, (c) its LetsEncrypt certificate; the current otmux items (session -> window -> pane) appear as CHILDREN of that node root; it renders in the UML diagram in deployment-node style (a 3D node box, not a plain class box).
  **Acceptance criteria:**
  - [ ] **(node-exists)** A deployment-node unit for WODA.prod exists on disk (UML deployment-Node facet), with its 3 references present.
  - [ ] **(refs-resolve-REAL)** The 3 refs — SSH config, configured domain, LetsEncrypt certificate — RESOLVE to REAL MEASURED artefacts on WODA.prod AND are SEMANTICALLY CORRECT (each answers the right question for a deployment NODE — the node's OWN inbound service config, not a resolvable-but-wrong outbound client file). NEVER invented/assumed paths (= fabricated identity) and NEVER a real-path-answering-the-wrong-question. Measured referents: DOMAIN=.env LE_DOMAIN/BASE_DOMAIN(prod.wo-da.de); CERT=/etc/letsencrypt/live/prod.wo-da.de/; SSH=/etc/ssh/sshd_config (inbound service) + host identity ~/.ssh/public_keys/root.WODA.prod.public_key — NOT ~/.ssh/config (outbound client).
  - [ ] **(otmux-children)** The current otmux items appear as CHILDREN under the node root in the correct hierarchy: session -> window -> pane.
  - [ ] **(deployment-style)** Renders in the UML diagram in DEPLOYMENT-NODE style (the 3D node-box notation), NOT a plain class box.
  - [ ] **(inv-t)** INV-T: tree byte-diff == 0 — the node projection is compute-on-read / non-mutating (no write-back to the scenario tree).
  - [ ] **(device-gate)** @390 mobile REAL-WebKit: the node + its otmux children render legibly.
  -> deploymentNode.render [uc:uuid:b9a549e4-f48a-45d8-8888-bcf639928449]

- [ ] **R40.3 — Suppress OS keyboard + configurable Keyboard Controller shell**
  [requirement:uuid:bfe97d61-24b0-4a76-82e7-0ea44406901f]
  an action that PREVENTS the OS keyboard from opening, plus a keyboard-controller surface like the action bar but with CONFIGURABLE KEYSTROKES (full controller designed later — this sprint = suppression + shell + config model)
  An action that PREVENTS the OS (iOS) keyboard from opening on terminal input, plus a keyboard-controller surface (like the action bar) with CONFIGURABLE, data-driven keystrokes. This sprint delivers the suppression + the controller shell + the config model; the full controller is designed later.
  **Acceptance criteria:**
  - [ ] **(A-suppress-by-construction)** [A · AUTOMATABLE @390 real-WebKit] The terminal input is configured to SUPPRESS the OS keyboard by construction (inputmode=none / readonly / not-focusable, per architect design) — verifiable in the served config/DOM, not by observing keyboard absence (which is vacuously true on a headless host).
  - [ ] **(A-input-still-reaches-pty)** [A · AUTOMATABLE] Synthetic input STILL REACHES the PTY after suppression — functional proof the suppression did NOT break typing (input flows to the terminal). This is the anti-vacuity guard: the feature must be present, not merely 'no keyboard appeared'.
  - [ ] **(A-terminal-fully-visible)** [A · AUTOMATABLE @390 real-WebKit + PIXEL] The terminal stays FULLY VISIBLE — currently 100% occluded; screenshot pixel-evidence shows it un-occluded (NEVER DOM counts).
  - [ ] **(A-no-overlay-scenario-edit)** [A · AUTOMATABLE @390 + PIXEL] The keyboard-controller input row does NOT overlay the Scenario/Edit buttons (pixel evidence — Tron's actual reported bug).
  - [ ] **(A-keystrokes-configurable)** [A · AUTOMATABLE] Keystrokes are CONFIGURABLE (data-driven config model, not hardcoded) — the config model exists and drives the controller shell.
  - [ ] **(B-ios-keyboard-never-opens)** [B · DEVICE-ONLY — TRON verifies on REAL iOS; NEVER reportable GREEN from a headless/desktop/Linux-WebKit run] The iOS on-screen keyboard genuinely NEVER opens on terminal input. (Real WebKit on the CI host has no on-screen keyboard at all, so this cannot be automated without a false pass — device-gated, same as the physical-finger longpress sliver.)
  -> terminal.keyboardControl [uc:uuid:9d1225a4-2e27-4498-88ff-dc87e932aa4c]

- [ ] **R40.4 — Sprint labels show the sprint number (composed at display from number + name)**
  [requirement:uuid:9a8cbffe-3e5c-4d4c-82a7-583d64dbd1fb]
  why is it not named sprint 40 - ...
  Every sprint surface displays the sprint NUMBER with its theme ("Sprint N — theme"), composed AT THE DISPLAY LAYER by ONE shared helper from the already-first-class model.number + model.name. The number is NOT written into the name field (that would be a second source of truth and drift on rename/renumber). Fixes all sprints (their labels currently render theme-only, unidentifiable/unsortable) with NO data migration.
  **Acceptance criteria:**
  - [ ] **(display)** Every sprint surface shows "Sprint N — theme": the tree row, the detail header, AND every generated MD view (the generator requirements.md header already does this — extend the same to tree + detail).
  - [ ] **(single-source)** The label is composed by ONE shared helper (e.g. sprintLabel(unit) => "Sprint {number} — {name}") — a grep PROVES there is no second composition site.
  - [ ] **(coverage)** Works for ALL existing sprints with NO data migration — S35/S36/S37 (and every other) are fixed by the same display-layer change, not by editing their units.
  - [ ] **(single-source)** The name field is UNCHANGED (theme-only); the number is NOT duplicated into name. model.number remains the single source of truth for the number.
  - [ ] **(device)** @390 mobile: the label is legible and NOT truncated mid-number in the tree row.
  -> sprintView.renderLabel [uc:uuid:d6cb7ddd-9587-49a2-b6b2-a355862579da]

- [ ] **R40.5 — Detail/feature-view EXTRA action buttons de-duplicated onto the shared action bar (editor chrome unchanged)**
  [requirement:uuid:e152177d-d016-45eb-a41f-75ffe3dc9a64]
  the editor actions can stay the same regarding ux ... but all in-room detail views have additional buttons shall become [actions] and feature views / details views have additional action buttons that are extra and not DRY
  The DETAIL-VIEW FAMILY (in-room detail views + feature/detail views) has accumulated EXTRA bespoke action buttons that DUPLICATE the same logical actions per view (not DRY). Each such additional button becomes an action UNIT rendered by the ONE shared universalActionBar (R35.1). ★ The point is DE-DUPLICATION (no logical action implemented more than once across detail/feature views), NOT uniformity for its own sake. ⛔ OUT OF SCOPE: the EDITOR CHROME keeps its UX EXACTLY as-is (Code · Open Diff · Save · the Files/Editor/Preview footer · the header Back) — Tron is happy with that UX; do NOT migrate/restyle/relocate it.
  **Acceptance criteria:**
  - [ ] **(automatable)** [AUTOMATABLE, source] A GREP-DRIVEN INVENTORY of the ADDITIONAL action buttons across ALL in-room detail views + feature/detail views is produced at build; the EDITOR CHROME (Code/Open-Diff/Save/Files-Editor-Preview-footer/header-Back) is EXPLICITLY EXCLUDED and that exclusion is RECORDED (not silently dropped).
  - [ ] **(automatable)** [AUTOMATABLE, source] Each IN-SCOPE (detail/feature-view additional) button becomes an action UNIT rendered by the shared universalActionBar (R35.1 mechanism 54acc696/ffd44b17), NOT bespoke per-view markup.
  - [ ] **(automatable)** [AUTOMATABLE] Per-surface actionSets declared as DATA (config units), not hardcoded.
  - [ ] **(automatable)** [AUTOMATABLE, source, stub-must-fail] The invariant: NO logical action is implemented more than once across the detail/feature views (DE-DUPLICATION, not uniformity). A grep-zero-bespoke lint SCOPED to the detail/feature-view surfaces ONLY — it must NOT fire on the editor chrome, and it must FAIL if a NEW bespoke detail-view button appears (plant one -> RED).
  - [ ] **(device)** [DEVICE/VISUAL @390 - Tron] The migrated detail/feature-view bars render @390 unchanged-or-better (pixel; Tron final visual, esp. any owner-gated surface a non-owner cannot load).
  -> 1c21d43a [uc:uuid:1c21d43a-c036-43b8-b947-1fae68720bb5]

- [ ] **R40.6 — deploymentRefs become a real typed OOP model (interfaces + inheritance, IOR relationships to file-leaf nodes)**
  [requirement:uuid:6a9d99c3-7ca7-4b35-b808-8dcc6719e162]
  just ior relationships to uml deployment diagram nodes that basically end in files - think oop interfaces and inheritance scenario-first
  The WODA.prod deploymentRefs (today an ad-hoc array of {role, ref:'ior:file:...', note} STRING refs) become a real OOP model: each ref a first-class TYPED unit related by TYPED IOR relationships (deploys/contains/manifestsAs/configuredBy), a genuine inheritance hierarchy with interfaces (abstract deployment-target -> Device/ExecutionEnvironment/Service; Artifact -> ConfigFile/Certificate/KeyFile/EnvValue), each leaf resolving to a real file on disk. Reuses the existing M2 family (no parallel type system).
  **Acceptance criteria:**
  - [ ] **(automatable)** [AUTOMATABLE, graph] Each ref is a FIRST-CLASS typed unit (an ior:class:ModelElement instanceOf its deployment-type), NOT a string in an array.
  - [ ] **(automatable)** [AUTOMATABLE, graph] Refs are related by TYPED IOR relationships (deploys / contains / manifestsAs / configuredBy), NOT a free-text 'role' string.
  - [ ] **(automatable)** [AUTOMATABLE, graph] A genuine inheritance hierarchy with interfaces exists: abstract deployment-target -> Device / ExecutionEnvironment / Service; Artifact -> ConfigFile / Certificate / KeyFile / EnvValue.
  - [ ] **(automatable)** [AUTOMATABLE, graph] IS-A is a REAL GRAPH EDGE: generalization/realization are ior:class:Relationship instances using the EXISTING M2 kinds (UmlGeneralization a1d2e3f4-..0011, UmlDependency ..0012). ConfigFile --generalization--> Artifact and Certificate --realizes--> FileBacked are QUERYABLE EDGES; a gate asserts IS-A by READING THE GRAPH, never a string/name. (Architect ecaed1399: measured the kinds already exist, invented no machinery.)
  - [ ] **(automatable)** [AUTOMATABLE, graph] INTERFACES are UmlInterface (a1d2e3f4-..0004) contracts CUTTING ACROSS the tree (not single-inheritance): FileBacked (all 4 Artifact subtypes realize it), Deployable (the target subtypes), Measurable (Certificate/ConfigFile/KeyFile). Realization is a QUERYABLE edge (realizes, via UmlDependency/UmlInterface), read the same way as generalization.
  - [ ] **(invariant)** [AUTOMATABLE, disk, ★ THE CROWN AC / fail-closed] For EVERY unit realizing FileBacked, resolve(u.manifestsAs) MUST EXIST as a real on-disk file — evaluated as a MODEL QUERY over the graph, FAIL-CLOSED. ★ Correct-by-construction: M1 nodes inherit the contract via instanceOf->M2 edges, so the gate FINDS the FileBacked realizers BY QUERY (not by re-listing) — a future 5th artifact type is covered automatically, no gate edit (correct-by-construction, not maintained-by-memory). Makes Trons basically-end-in-files PROVABLE; guards the fabricated-reference class killed 5x this sprint.
  - [ ] **(automatable)** [AUTOMATABLE, graph+disk] All 4 existing refs survive the migration as proper typed nodes: sshd_config · host key · .env#LE_DOMAIN · LE fullchain — none lost, each now a typed unit.
  - [ ] **(automatable)** [AUTOMATABLE, graph] The types reuse the existing M2 metamodel family (a1d2e3f4-... sentinels) — NO parallel type system; the deployment-node facet already added (R40.2 UmlNode) extends, not forks.
  - [ ] **(automatable)** [AUTOMATABLE] INV-T byte-diff==0 — the typed model is compute-on-read / a structural migration that does not churn unrelated units.
  - [ ] **(automatable)** [AUTOMATABLE, graph] Each NEW M2 member (the deployment-type metaclasses joining the a1d2e3f4-.. family) carries a sentinelReason field ("M2 deployment-metamodel member, patterned by design for family lookup") so the registered-sentinel exception is PROVABLE-not-remembered — an unexplained legitimate patterned uuid is indistinguishable from a fabricated defect (R5 sentinel rule + the identity-detector exclusion).
  -> b2c5cdba [uc:uuid:b2c5cdba-527d-4321-89f9-c5ec1158ccf0]

- [ ] **R40.7 — Back is real history back; the path label navigates to the containing folder**
  [requirement:uuid:6ce80195-a394-4ba3-b9ca-3db7a04d2ce2]
  back should be a real history back; the path label should do what back does today
  The '← Back' control performs GENUINE browser history back; clicking the '📁 scenario/...' path label navigates to the containing folder (the behaviour Back does TODAY). The two are distinct and neither does the other's job.
  **Acceptance criteria:**
  - [ ] **(automatable)** [AUTOMATABLE @390 real-WebKit] '← Back' performs genuine history back — proven by navigating 2+ steps then Back returns to the prior view (not the folder).
  - [ ] **(automatable)** [AUTOMATABLE @390 real-WebKit] Clicking the '📁 scenario/...' path label navigates to the CONTAINING FOLDER (today's Back behaviour).
  - [ ] **(automatable)** [AUTOMATABLE @390] The two are DISTINCT: Back does history, the path label does folder-nav; neither does the other's job (both asserted in one flow).
  -> 5d02d562 [uc:uuid:5d02d562-eafb-4bc9-8d6f-3894b3fbda9c]

- [ ] **R40.8 — 'Files' shows the real on-disk file location of the scenario unit**
  [requirement:uuid:90cc7bab-f7d4-4646-bc85-4a58fcb2c3eb]
  files should show where the file really is
  The editor footer 'Files' tab reveals the ACTUAL filesystem path of that scenario unit (browsable there), and the path shown MATCHES the unit's real location on disk (measured, not composed).
  **Acceptance criteria:**
  - [ ] **(automatable)** [AUTOMATABLE, disk] The path shown by Files MATCHES the unit's REAL location on disk (scenario/index/<shard>/<uuid>.scenario.json) — measured against the filesystem, NOT composed from the slug.
  - [ ] **(automatable)** [AUTOMATABLE @390] The Files tab reveals that path and is browsable to the containing folder from there.
  -> 98df6abf [uc:uuid:98df6abf-7801-457d-92bd-690aac4819a7]

- [ ] **R40.9 — 'Preview' shows that scenario's traceability chain + details drawer (reusing existing surfaces)**
  [requirement:uuid:50753cf6-59e8-4251-84e0-7d54f988ce76]
  preview should show that scenario's traceability and the details drawer
  The editor footer 'Preview' tab renders the scenario's traceability chain and opens the details drawer for a selected node — REUSING the existing /trace + rb-detail-drawer surfaces (no bespoke preview renderer; same DRY spirit as R40.5).
  **Acceptance criteria:**
  - [ ] **(automatable)** [AUTOMATABLE, source, stub-must-fail] Preview REUSES the existing trace + rb-detail-drawer components (grep proves NO bespoke preview renderer — plant a bespoke renderer -> gate RED; DRY like R40.5).
  - [ ] **(automatable)** [AUTOMATABLE @390 real-WebKit] Preview renders the selected scenario's traceability chain (the /trace surface).
  - [ ] **(automatable)** [AUTOMATABLE @390 real-WebKit] The details drawer opens for a selected node (the rb-detail-drawer surface).
  -> 23af7ba9 [uc:uuid:23af7ba9-4aad-4455-83f7-48b6ca62165d]

- [ ] **R40.10 — Tron renders his QA verdict from the task: Approve (records verdict + flips Done-gate) / Decline (mints a ChangeRequest)**
  [requirement:uuid:33451271-29db-4e54-acaa-d0d9f59c04ad]
  for the tasks on QA add an approve by Tron action then you do not need to remind me ... also add a action decline QA, that results in a scenario-first change request unit
  A task at QA-Review carries TWO owner-only action units: APPROVE BY TRON (records approvedBy+approvedAt as DATA on the unit -> Done-gate flips; makes "Done requires Tron QA" PROVABLE not remembered) and DECLINE QA (mints an ior:class:ChangeRequest unit capturing the reason, LINKED to the declined task/requirement, entering the board as real work). Removes the PO from the loop: no reminder pings, no batch markdown. Applies to ANY task at QA-Review (incl the S37 twelve unsigned) -> obsoletes tron-qa-batch.md + reminders.
  **Acceptance criteria:**
  - [ ] **(automatable)** [AUTOMATABLE, data] APPROVE fires on a QA-Review task, records approvedBy + approvedAt as DATA on the unit (so "Done requires Tron QA" is PROVABLE from the record, not remembered), and flips the Done-gate.
  - [ ] **(automatable)** [AUTOMATABLE, graph] DECLINE mints an ior:class:ChangeRequest unit (REUSE the EXISTING kind — registered templates.ts:370 + in CHAIN_TYPES; NOT a new kind) capturing the reason, LINKED to the declined task/requirement, entering the board as real work — a UNIT, not a comment that gets lost.
  - [ ] **(automatable)** [AUTOMATABLE, 403] OWNER-GATED: only the owner may render a verdict; a non-owner approve/decline is 403. This gate IS the integrity of "Done requires Tron QA" — if anyone can self-approve, the law is decorative.
  - [ ] **(automatable)** [AUTOMATABLE, fail-closed] EVIDENCE PRECONDITION: the actions are available ONLY on tasks genuinely at QA-Review WITH their evidence present — approving can NEVER manufacture a Done on a task that is not chain-complete. Approval is a human judgement ON TOP of verified evidence, never a substitute for it.
  - [ ] **(automatable)** [AUTOMATABLE, source] Both actions are ACTION UNITS on the R40.5 universalActionBar mechanism — NOT two hand-placed bespoke buttons (that would commit R40.5s exact defect while fixing it).
  - [ ] **(device)** [DEVICE @390 - Tron] The visual firing (Tron taps Approve / Decline on his device) is Tron device-verification.
  -> 0a3e3653 [uc:uuid:0a3e3653-c997-4a87-97ef-1511a1fef5dd]
