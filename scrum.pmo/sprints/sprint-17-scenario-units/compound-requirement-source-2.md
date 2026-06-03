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
