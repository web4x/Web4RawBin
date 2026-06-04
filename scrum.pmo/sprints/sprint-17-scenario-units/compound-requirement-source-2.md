# Compound Requirement Source — Task State Machine + Traceability Units

**Captured by:** robbin-req
**Date:** 2026-06-02
**Source:** Tron directive via robbin-po

## FLAG: STATEMENT CUT OFF

Tron's directive was cut off mid-sentence. The text below is **verbatim but incomplete**. Flagged for Tron to complete.

## Tron Verbatim (INCOMPLETE)

> "the task statuses will work like that in md but not in html. actually the tasks statuses must be methods of task class that trigger a task state machine until a task is done. the traceability needs to be converted to uuid.scenario.json of the traced type as atomic units in the index with ln links in a requirement and use case and class,… instances with md and"

**CUT HERE** — sentence unfinished. Likely continues with: "...md and [html/json/...] views" or similar.

## Decomposition (3 discernible requirements — NOT authoritative, literal text above IS)

### R-A: HTML view of task status checklist broken
> "the task statuses will work like that in md but not in html"

Task status checkboxes render correctly in raw markdown but are broken when viewed in the HTML browser (`/md/` route). The `marked.js` rendering or the MD_CSS styling does not preserve checkbox state/interactivity.

### R-B: Task.status becomes state-machine methods on Task class
> "actually the tasks statuses must be methods of task class that trigger a task state machine until a task is done"

Task status is not just markdown checkboxes — it must be **methods** (verbs) on a `Task` class that drive a state machine: Planned → In Progress (refinement/test/impl/testing) → QA Review → Done. The class exposes methods like `task.startRefinement()`, `task.startImplementing()`, `task.complete()` that transition state.

### R-C: Traceability artifacts become atomic scenario.json units
> "the traceability needs to be converted to uuid.scenario.json of the traced type as atomic units in the index with ln links in a requirement and use case and class,… instances with md and"

Each traceability artifact (Requirement, UseCase, Class, Method) becomes a `<uuid>.scenario.json` file in `scenario/index/`. These are atomic units indexed by type. `ln` (symlinks) connect instances. Each unit has MD and [CUT — likely HTML/JSON] views.

This extends the Sprint 17 scenario unit architecture to cover the full traceability chain — requirements, use cases, and classes are no longer just markdown sections but first-class scenario units with JSON models and symlink-based indexing.

---

## Tron Verbatim — Follow-on (2026-06-02, second directive)

> "this is an amazing improvement!!! amazing team achievement! here some improvement requests. keep it mobile first layout and limit the with hard to the current right window size. the picture shows a usecase tracing to a task tracing to three usecases tracing to a task. traceability has to start with atomic requirements. tracing to tasks to many usecases to one class to one method to one implementation. looks like the data quality does not do that yet. also not all instances are reached over this tree. review the data and make is a complete consistent tree with no backward chaos and no untraced scenarios. plan it diligently and do not stop until reached with the team. activate the sm again"

## Decomposition (4 additional requirements — NOT authoritative, literal text above IS)

### R-D: Mobile-first layout + hard width limit
> "keep it mobile first layout and limit the with hard to the current right window size"

Traceability browser must use mobile-first layout. Hard max-width capped at current right window/panel size — no horizontal overflow.

### R-E: Chain ORDER — atomic requirements are ROOTS
> "traceability has to start with atomic requirements. tracing to tasks to many usecases to one class to one method to one implementation"

The forward chain is strictly: **requirement → task → usecase(s) → class → method → implementation → test**.

Atomic requirements are the root of every tree. No chain starts from a task or usecase — it starts from a requirement.

**AMENDMENT (Tron literal):**
> "implementation traces finally to test"

Chain terminates at test. Full order: requirement → task → usecase → class → method → implementation → **test(s)**.

**AMENDMENT 2 (Tron literal):**
> "one implementation can have multiple tests"

Cardinality: implementation → test is **1:N**. An implementation traces to multiple tests (`Implementation.tests[]` = IOR array of Test instances).

### R-F: Data quality — complete consistent tree, zero untraced scenarios
> "not all instances are reached over this tree. review the data and make is a complete consistent tree with no backward chaos and no untraced scenarios"

Every scenario unit instance must be reachable from a requirement root. Zero backward refs (forward-only, per B18). Zero orphan scenarios (every unit traced). The tree must be complete and consistent — no dead ends, no unreachable nodes.

### R-G: Diligent plan, no-stop until done, SM re-activated
> "plan it diligently and do not stop until reached with the team. activate the sm again"

This is a standing directive — not a single task but a team mode. Plan the data quality remediation diligently, execute with the full team, do not stop until every instance is traced. Scrum Master re-activated for monitoring.

---

## Tron Verbatim — Follow-on (2026-06-02, third directive)

> "mmm its stll massive orphans and many depending not in the correct order. fill the missing tractability data with the req agent and architect consistently."

## Decomposition (1 requirement — NOT authoritative, literal text above IS)

### R-H: Chain-direction enforcement + missing-data fill (JOINT req+architect)
> "its stll massive orphans and many depending not in the correct order. fill the missing tractability data with the req agent and architect consistently."

Despite T169 audit reporting clean mechanics, Tron sees on `/trace`:
1. **Massive orphans** — units not reachable from a requirement root
2. **Wrong direction** — links going child→parent instead of parent→child (violates R-E forward-only chain: req→task→uc→class→method→impl→test)
3. **Missing data** — traceability fields empty or incomplete

Tron assigns this JOINTLY to req-eng + architect: fill the missing data consistently, fix direction violations, eliminate orphans. Not a tooling task — a data quality task that requires human judgment on which requirement each unit belongs to and which direction each link should point.

---

## Tron Verbatim — Follow-on (2026-06-02, fourth directive)

> "let the req agent split tasks into one sentence requirements"

## Decomposition

### R-I: Tasks decompose into atomic one-sentence requirements (STANDING RULE)
> "let the req agent split tasks into one sentence requirements"

**STANDING RULE — applies to ALL work going forward + retroactively:**

Each TASK decomposes into multiple ATOMIC one-sentence requirements. Each atomic requirement is a ROOT of the R-E chain (requirement→task→uc→class→method→impl→test). One sentence = one `[requirement:uuid:]` = one chain root.

**Application:**
- **(a) New tasks at refinement time:** req-eng splits each task's scope into atomic one-sentence requirements before architect designs
- **(b) Retroactive:** Split compound requirements in T167-T172 + existing S17 tasks into atomic one-sentence `[requirement:uuid:]` entries

**Example:** T169 "complete tree, no back-chaos, no untraced" → splits into:
- R-F.1: "Every scenario unit is reachable from a requirement root" (one sentence)
- R-F.2: "Zero backward-direction links in the traceability chain" (one sentence)
- R-F.3: "Zero orphan scenario units in the index" (one sentence)

Each gets its own `[requirement:uuid:]` and becomes a chain root.

---

## Tron Verbatim — Follow-on (2026-06-02, fifth directive)

> "each tes must be rached by a tracking chain"

### R-J: Every Test must be reachable via the tracking chain
> "each tes must be rached by a tracking chain"

Every Test scenario unit instance MUST be reachable from a Requirement root via the LOCKED chain (req→task→uc→class→method→impl→test). Zero test orphans. Folds into T172 scope (direction enforcement + missing data fill).

---

## Tron Verbatim — Follow-on (2026-06-03, sixth directive)

> "scenario/sprints.json/sprint-17-scenario-units sprint.json 🔗 ✏️ clicking on the sprint.json currently ends in a dead end. instead open it as a sprint item view in the traceability tree view. lazy load all requirements and tasks as tree children. from there lazy load further traceability the same way"

## Atomic Requirements (per R-I rule)

### R-K1: Clicking a .scenario.json file must not be a dead end.
> "clicking on the sprint.json currently ends in a dead end"

Currently clicking a scenario unit JSON in the file browser or sprint listing produces no useful result. It must navigate somewhere meaningful.

### R-K2: Clicking a scenario unit opens it as that instance in the /trace tree view.
> "instead open it as a sprint item view in the traceability tree view"

The click target is the `/trace` tree view, focused on that specific instance (e.g. Sprint 17 node expanded). Not a raw JSON view, not a dead-end — the traceability tree with that node selected.

### R-K3: Lazy-load children cascading down the chain (Sprint→reqs+tasks, Req→tasks, Task→UCs, etc.).
> "lazy load all requirements and tasks as tree children. from there lazy load further traceability the same way"

The tree lazy-loads children on expand: Sprint shows its Requirements + Tasks, Requirement shows its Tasks, Task shows its UseCases, cascading down the R-E chain. Each level loads on demand, not all at once.

---

## Tron Verbatim — Follow-on (2026-06-03, seventh directive)

> "https://home.donges.it:4444/md/scenario/sprints.md/task/sprint.md still shows File not found"

### R-L: Generated views must never emit dead links — every href must resolve.
> "https://home.donges.it:4444/md/scenario/sprints.md/task/sprint.md still shows File not found"

A parent-sprint link in a Task generated view resolves to `../task/sprint.md` (wrong directory — sprint files are in `../sprint/`, not `../task/`). The ViewGenerator emits a relative href that points to the wrong sibling directory. Every generated link must resolve to an existing file.

**PO refinement (2026-06-03):** The click was on `sprint.json 🔗 ✏️` (the symlink shown by the file browser). The `.json` click handler does wrong `.md` path conversion AND wrong directory. Same root cause as R-K1 (dead-end on .scenario.json click): the file browser's click-to-navigate logic converts `.scenario.json` to an `.md` path incorrectly — both the directory and the extension mapping are wrong. R-K1 and R-L share this root cause.

**PO second repro (2026-06-03):** Clicking T110 in a `Tasks:` list also 404s. Not limited to sprint.json — ALL generated href emission (task links in planning.md views, sprint overview, DetailView navigation) must resolve. Same root-cause class: ViewGenerator emits relative paths that don't match the actual directory structure of generated .md files.

---

## Tron Verbatim — Follow-on (2026-06-03, eighth directive — desktop /trace review)

> "this is how it looks like on the desktop browser https://home.donges.it:4444/trace?ior=2370d3b3-... "No view for ?.?" This area has been replaced by the details drawer. clicking on r10.2 shows the second screenshot. on tesktop the drawer shall not have that nudge diplayed that in mobile closes the drawer. calling the link above shall not open the tracability as it does. it just shall show the one scenario from the parameter. on opening the itm view on the right, it shall lazy load the children tasks. as previously specified. to have this other mode lets introduce a new rout /scenario, that uses the same view components as the tracability view but just lasy loads the tree from the first clicked scenario. when the drawer switches to mobile, as in the third screenshot, the item views shall only be as borad as the drawer."

## Atomic Requirements (per R-I rule)

### R-M1: Desktop drawer must not show "No view for ?.?" placeholder.
> "No view for ?.?" This area has been replaced by the details drawer."

The legacy placeholder text must be removed. The detail area is now the drawer — it should show nothing (empty state) or the selected item, never a "No view" error.

### R-M2: Desktop drawer must not show the mobile swipe-handle/nudge.
> "on tesktop the drawer shall not have that nudge diplayed that in mobile closes the drawer"

The drag-to-dismiss handle bar is mobile-only UX. On desktop viewports it must be hidden.

### R-M3: New route /scenario?ior=<uuid> — single-scenario view with lazy-loaded children.
> "calling the link above shall not open the tracability as it does. it just shall show the one scenario from the parameter... lets introduce a new rout /scenario, that uses the same view components as the tracability view but just lasy loads the tree from the first clicked scenario"

`/scenario?ior=<uuid>` is a NEW route distinct from `/trace`. It reuses the same view components (tree + drawer) but starts from ONE scenario unit as root and lazy-loads its children down the chain — not the full traceability tree. `/trace` continues to show the full tree.

### R-M4: Mobile drawer item-view width capped at drawer width (no overflow).
> "when the drawer switches to mobile... the item views shall only be as borad as the drawer"

On mobile, when the detail drawer is visible, item content must not overflow the drawer width. Hard width-cap at drawer boundary — consistent with R-D/T167 mobile-first directive.

---

## Tron Verbatim — Follow-on (2026-06-03, ninth directive — R-M3 refinement)

> "clicking on sprint.json goe now to tractability but always shows the same content nowether what is the provided scenario parameter. it at least has to scroll to the selected element and open its details. but in case of sprint.json it should ONLY show that itemview and THEN lazyliad children!!!"

### R-M3 refinement — three atomic sub-requirements:

### R-M3a: /scenario?ior= MUST honor the ior parameter (not show same content regardless).
> "always shows the same content nowether what is the provided scenario parameter"

Currently the ior query param is ignored — every click renders the same default view. The route must read the param and load that specific scenario unit.

### R-M3b: MINIMUM behavior — scroll to the selected element and open its details.
> "it at least has to scroll to the selected element and open its details"

Even if the full /scenario route isn't ready, the minimum viable fix: scroll the tree to the node matching the ior param and open the detail drawer for it.

### R-M3c: For sprint.json — show ONLY that single item view, THEN lazy-load children.
> "in case of sprint.json it should ONLY show that itemview and THEN lazyliad children!!!"

When opening a Sprint scenario unit: do NOT render the full traceability tree. Show ONLY that sprint's item view (detail panel), THEN lazy-load its children (requirements, tasks) on demand. This is the core R-M3 behavior — single-scenario root with cascading lazy-load. Tron's emphasis (!!!) marks this as the primary expectation.

---

## Tron Verbatim — Follow-on (2026-06-03, tenth directive — R-M3 extension)

> "navigating through the details view must scroll the selected element in the tree into the view"

### R-M3d: Details-drawer navigation must scroll the tree to the selected element.
> "navigating through the details view must scroll the selected element in the tree into the view"

When the user clicks a chain link or cross-navigates between instances inside the details drawer, the corresponding tree node must scroll into view AND be marked as selected. Extends R-M3b (scroll+open) to cover ALL in-drawer navigation, not just initial load. Folds into T174 (R-M3 scope).

---

## Tron Verbatim — Follow-on (2026-06-03, eleventh directive — R-M3 interaction parity)

> "the click on a scenario.json now shows the right thing. but the collapse expands and detailsView on click are not working in that case. it should work from the behavior as the traceability browser, but just from the lazy loaded entry point"

### R-M3e: /scenario route must have full /trace interaction parity — collapse/expand + DetailView-on-click.
> "the collapse expands and detailsView on click are not working in that case. it should work from the behavior as the traceability browser, but just from the lazy loaded entry point"

The /scenario route renders the scoped tree correctly but interactions are dead — collapse/expand (T115 icon-tap + `>` expander) and DetailView-on-click (T110/T111) are not wired. /scenario must have the SAME interactive behavior as /trace: all tree interactions fully functional, just seeded from the lazy-loaded single entry point instead of the full tree. Folds into T174.

---

## Tron Verbatim — Follow-on (2026-06-03, twelfth directive — tree model + oversized items)

> [L1] "we hace still oversized items. the expand/collapse state does not look like its correct. make all scenarios implement tree extends traceability with parent and children[] model attributes, set via getter and setters from the type that should be above and below from traceability chain"

> [L2 CORRECTION] "Traceability extends Tree is corrected"

> [L3 REFINE] "parent children satisfy scenario iors and types"

## Atomic Requirements (per R-I rule)

### R-N1: Tree items must not be oversized (width).
> "we hace still oversized items"

Tree item rendering overflows the container width. Items must fit within the tree panel without horizontal overflow — consistent with R-D/T167 mobile-first width-cap.

### R-N2: Expand/collapse state must be correct.
> "the expand/collapse state does not look like its correct"

Tree nodes show wrong expand/collapse state — nodes that should be expandable show as collapsed or vice versa. The visual state must match the data state (has children → expandable; no children → leaf).

### R-N3: Class model — Tree (BASE) ← Traceability extends Tree ← typed scenario classes.
> "make all scenarios implement tree extends traceability with parent and children[] model attributes, set via getter and setters from the type that should be above and below from traceability chain"
> CORRECTION: "Traceability extends Tree is corrected"
> REFINE: "parent children satisfy scenario iors and types"

Class hierarchy:
- **Tree** (BASE class): generic `parent` (IOR ref) + `children[]` (IOR ref array) model attributes
- **Traceability** extends Tree: adds chain-typed semantics — resolves which type is "above" (parent) and "below" (children) from the R-E chain position
- **Typed scenario classes** (Requirement, Task, UseCase, Class, Method, Implementation, Test) extend Traceability

`parent` = single scenario IOR of the parent instance (typed per chain position).
`children[]` = array of scenario IORs of child instances (typed per chain position).
Set via getters/setters that enforce the chain type constraints (e.g. Task.parent must be a Requirement IOR; Task.children must be UseCase IORs).

→ [T175](./task-175-tree-model-oversized-expand-collapse.md)

---

## Requirement — Verifiability gap (2026-06-03, PO-originated)

> Headless Playwright cannot execute /scenario (and other) ES-module page JS because the self-signed SSL cert blocks type=module imports (ignoreHTTPSErrors doesn't cover module fetch). Tester can grep-verify code but NOT behavior of browser JS.

### R-O: Test server must serve page JS so headless Playwright executes it — browser-behavior ACs are headlessly verifiable.

The isolated test server (T100, port 4445) uses a self-signed certificate. Playwright's `ignoreHTTPSErrors` handles navigation but does NOT cover ES module `import` fetches — the browser silently refuses to load `<script type="module">` from an untrusted origin. This means all browser-behavior ACs (DOM state, click interactions, lazy-load cascading) cannot be verified headlessly — they are deferred to Tron's physical device.

**Fix must be one of:**
- Valid/trusted test certificate (e.g. mkcert-generated, added to system trust store)
- HTTP test scheme (no SSL for test server — modules load over plain HTTP)
- Module-fetch cert handling (Chromium launch flag `--allow-insecure-localhost` or equivalent)

Without this, every AC that depends on client JS executing is unverifiable by the tester agent. This is a systemic blocker for all browser-behavior testing across T174, T175, and future UI tasks.

→ Task TBD (planner stand-up)

---

## Requirement — PWA stale cache (2026-06-03, Tron recurring pain via PO)

> TRON (recurring): new SW version should take control immediately on next load (skipWaiting + clients.claim), purges old CACHE_NAME, no manual clear needed. Tron repeatedly hits stale-SW-cache showing old bundles despite version+sw.js bumps.

### R-P: New service worker version auto-activates on next page load — no manual cache clear or hard-refresh needed.

[requirement:uuid:a1b2c3d4-5e6f-7a8b-9c0d-p00000000001]

When the server deploys a new version (package.json version bump + sw.js CACHE_NAME stamp), the next page load by any client must:
1. Detect the new sw.js (browser's 24h check OR navigation fetch)
2. Install the new SW (pre-cache new STATIC_SHELL + hashed bundle)
3. Activate immediately via `self.skipWaiting()` in the install handler
4. Claim all open clients via `self.clients.claim()` in the activate handler
5. Purge ALL old caches (any key !== new CACHE_NAME)
6. Reload the page automatically via `controllerchange` listener

The user NEVER needs to manually clear cache, hard-refresh, or dismiss an update banner to get fresh assets. The update banner (if shown) is informational only — the SW takes control regardless of user action.

**Context:** Sprint 5 T33 originally had skipWaiting only in the message handler (user clicks "Update Now"). The v0.2.6 review removed unconditional skipWaiting from install to prevent mid-session reloads. This was correct for the "don't interrupt typing" concern but caused the recurring stale-cache pain. The fix is to restore unconditional skipWaiting in install BUT defer the reload to the next natural navigation (not mid-session).

**Key constraint:** The reload must happen on the NEXT page load, not mid-session. `controllerchange` fires when the new SW takes control — if the user is mid-typing, the reload should be deferred until the next navigation or visibility change, not forced immediately.

→ Task TBD (backlog — planner triage)

---

## Requirement — Tron LOCKED OUT: self-signed cert blocks SW (2026-06-04, Tron lockout via PO)

> TRON: Chrome blocks service-worker registration on the self-signed cert at home.donges.it — can't load the app on real device. LOCKED OUT.

### R-T1: home.donges.it serves a real CA-trusted certificate so Chrome allows service worker registration.

[requirement:uuid:b2c3d4e5-6f7a-8b9c-0d1e-t00000000001]

Chrome refuses to register a service worker on origins with self-signed or untrusted certificates (except localhost). The current self-signed cert generated by `openssl req -x509` in server.ts blocks SW registration on home.donges.it — Tron cannot use the PWA on his real device. The server MUST serve a Let's Encrypt (or equivalent CA-trusted) certificate for the production domain. Self-signed cert remains acceptable for localhost development only.

### R-T2: Playwright tests use CDP Security.setIgnoreCertificateErrors for headless cert bypass.

[requirement:uuid:b2c3d4e5-6f7a-8b9c-0d1e-t00000000002]

Headless Playwright tests cannot use a CA-trusted cert (no domain, no ACME challenge). The tester MUST use Chrome DevTools Protocol `Security.setIgnoreCertificateErrors` (via `cdpSession.send`) as the workaround for self-signed certs in CI/headless — this covers both navigation AND ES module `<script type="module">` fetches that `ignoreHTTPSErrors` alone does not handle. This supersedes R-O's workaround options.

→ T180 (planner stand-up)

---

## Requirement — Tree lazy-load depth + forward-only display (2026-06-04, Tron live feedback via PO)

> TRON: "collapse/expand works but lazy loading deeper on each item seems not. still the task links to requirements and in children back to task which is wrong"

### R-U1: Scenario tree lazy-loads children at every depth level of the canonical chain.

[requirement:uuid:c3d4e5f6-7a8b-9c0d-1e2f-u00000000001]

Expanding any tree node at any depth (requirement → task → useCase → class → method → implementation → test) MUST trigger a lazy-load fetch for that node's children. Currently only the first expansion level loads children — deeper expansions show nothing. Every node in the 7-step canonical chain that has forward references MUST lazy-load its children on expand, recursively to the full depth of the chain.

### R-U2: DetailView renders forward-only — no backward links displayed.

[requirement:uuid:c3d4e5f6-7a8b-9c0d-1e2f-u00000000002]

The detail panel for any scenario unit MUST NOT display backward links. Specifically: a Task detail MUST NOT show "requirements" pointing back to parent requirements. A UseCase MUST NOT show "tasks" pointing back. The display follows the forward-only chain (B18/T159 rule): each detail view shows only its FORWARD children (tasks[], useCases[], classes[], methods[], implementations[], tests[]). Any `requirements[]`, `links.up`, or reverse-direction fields MUST be suppressed from the rendered view even if present in the underlying JSON.

→ T178 (lazy-load depth) + new strict-forward-display task (planner triage)

---

## Requirement — /trace nav review: lazy-load depth + browse-source link (2026-06-04, Tron live review via PO)

> TRON: "1st scenario nav works. 2nd lazy loading of sub. requirement should trace to usecase BUT no further lazy load implemented or data wrong as no use case children. clicking browse source goes to 3rd — bug — should have gone to picture 5 (file in the file browser) visible in picture 4."

### R-V1: Tree lazy-loads FORWARD-ONLY children at every chain depth — no backward task→requirement children; deeper levels must load.

[requirement:uuid:d4e5f6a7-8b9c-0d1e-2f3a-v00000000001]

When expanding a Requirement node, children shown are Tasks (forward). When expanding a Task, children are UseCases (forward) — NOT requirements (backward). When expanding a UseCase, children are Classes. And so on through method→impl→test. Currently the 2nd-level expansion (requirement→task→useCase) shows no children — either lazy-load is not triggered at depth ≥2, or the data has no useCase children on the Task units. Both must be fixed: (1) lazy-load fetch must fire on expand at ANY depth, not just the first level; (2) Task scenario units must have populated `useCases[]` forward arrays (currently 0 of 106 have them per the deep-chain audit). A Task expanding to show its parent requirement as a child is a BACKWARD link violation (B18/R-U2) and must never happen.

→ T181 + T178 (planner folds)

### R-V2: DetailView 'Browse source' button deep-links to the actual source file in the /edit file browser, not to a rendered or wrong view.

[requirement:uuid:d4e5f6a7-8b9c-0d1e-2f3a-v00000000002]

The "Browse source" link in the DetailView (the IOR source field rendered as a clickable action) MUST navigate to the file browser at the real file path — e.g. `/edit/scrum.pmo/sprints/sprint-15/task-101-object-model.md` for a Task, or `/edit/src/public/ts/trace/rb-trace-tree.ts` for a Class. Currently clicking "Browse source" navigates to a wrong destination (Tron: "goes to 3rd — bug — should have gone to picture 5"). The href must be constructed from `model.source.file` (or the scenario unit's markdown/typescript path) and resolve to the Monaco editor file browser at that path, not to the /md/ rendered view or a scenario JSON URL.

→ New task (planner triage — browse-source deep-link fix)

---

## Requirement — Scenario JSON click opens rendered task view (2026-06-04, Tron live from screenshot)

> TRON: "clicking on the task json in picture 1 should open the task in picture 2 which is picture 3!!!"
> Context: Picture 1 = scenario/sprints.json/sprint-15/task/ listing (task-101..task-108.json with 🔗✏️ icons). Picture 2 = scrum.pmo/sprints/sprint-15/ raw file listing. Picture 3 = rendered T107 task detail view (/md/ rendered markdown). Tron expects clicking task-107-detail-overview-views.json in the scenario tree to open the RENDERED task view (picture 3), not the raw file browser directory (picture 2).

### R-W1: Clicking a .scenario.json task link in the scenario tree navigates to the rendered task view, not the raw file browser.

[requirement:uuid:e5f6a7b8-9c0d-1e2f-3a4b-w00000000001]

When a user clicks a task `.scenario.json` file in the scenario/sprints.json/ tree (the speaking-name symlink tree), the destination MUST be the rendered markdown view of that task's source `.md` file (via `/md/<path>.md`). NOT the raw file browser directory listing, NOT the /trace traceability view, NOT the /scenario scenario view. The target is the **original markdown file rendered by marked.js** — the same view as navigating to `/md/scrum.pmo/sprints/<sprint>/<task-slug>.md` directly. The scenario JSON contains `model.source.file` or the task's slug — the click handler resolves to the rendered `/md/` view of the source .md file.

**Tron clarification:** "and not the traceability or scenario view!!!" — the destination is the file's OWN rendered content, not any generated/derived view.

→ Folds into R-V2 task (planner)

---

## Requirement — PlantUML class diagram for traceability architecture (2026-06-05, Tron question → gap)

> TRON (via PO): Tron's question reveals no class diagram exists documenting the traceability tree architecture or the scenario-instance implementation. The diagram is also the PUML source for [class:uuid] and [method:uuid] annotations that feed the UC→Class→Method chain (T178 data fill).

### R-X1: A PlantUML class diagram documents the traceability-tree-extends architecture.

[requirement:uuid:7b062e87-7541-4be2-ab0f-dd1f7a7c225f]

A `.puml` class diagram must exist showing the Tree base class extended by RbObjectItem and RbDetailDrawer, with parent/children as IOR references. The diagram covers: Tree (base with expand/collapse/lazy-load), RbObjectItem (one tree node — icon, name, drag, expand-children), RbDetailDrawer (detail panel — open, close, swipe-dismiss), and their inheritance/composition relationships. Each class and method element in the diagram carries `[class:uuid]` and `[method:uuid]` annotations per the traceability standard.

### R-X2: A PlantUML class diagram documents the scenario-instance implementation classes.

[requirement:uuid:ec56b884-3aa5-400a-b3e2-1095ffdcbe4a]

A `.puml` class diagram must exist showing ScenarioUnit, IORResolver, ClassRegistry (with ClassLoaders), and ViewTemplateRegistry — the four pillars of the scenario-instance system. The diagram covers: ScenarioUnit (ior, model, ownerIor, load, save), IORResolver (resolve, resolveClass, resolveInstance), ClassRegistry (register, get), ViewTemplateRegistry (register, renderHtml, renderMd), and their associations. Each class and method element carries `[class:uuid]` and `[method:uuid]` annotations that become the authoritative PUML source for the UC→Class→Method chain links.

→ New task (planner stand-up — architect creates diagrams, feeds T178 chain)

---

## Requirement — Tree view lazy-load at every chain level (2026-06-05, Tron live feedback)

> TRON: "i can now start in the scenario browser and drill down in the details view to the tests, but the tree view does not offer the lazy loading down the whole chain . that a bug… needs to check expand/collapse on children, no matter of what type and lazy llas"

### R-Y1: The TREE view lazy-loads children on expand at every level of the canonical chain.

[requirement:uuid:a7b8c9d0-1e2f-3a4b-5c6d-y00000000001]

The tree panel (rb-trace-tree) must fetch and display children when a node is expanded, at EVERY depth of the chain: requirement → task → useCase → class → method → implementation → test. Currently the DetailView drill-down works (Tron confirmed: "i can now start in the scenario browser and drill down in the details view to the tests"), but the TREE panel does not lazy-load below the first level. Expanding a node in the tree must trigger a fetch for that node's forward children regardless of depth. This is distinct from R-U1/R-V1 which identified the same gap — this is Tron's confirmation that DetailView is fixed but Tree is still broken.

### R-Y2: Tree expand/collapse works for children of ANY scenario type.

[requirement:uuid:a7b8c9d0-1e2f-3a4b-5c6d-y00000000002]

The tree's expand/collapse behavior must not be restricted to specific types. A Method node must be expandable to show its Implementation children. An Implementation node must be expandable to show its Test children. Currently expand/collapse may only work for certain types (e.g. requirement→task) and silently fail for deeper types. The tree item component must handle all 7 types uniformly: if a node has forward children in its model, the expand arrow appears and clicking it lazy-loads those children.

→ Planner stand-up — tree lazy-load fix (refines R-U1/R-V1, distinct from DetailView which now works)
