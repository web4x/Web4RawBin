# Sprint 17 — Scenario Units / IOR Data Model & Class Views — TRON LITERAL REQUIREMENTS

**Source:** Tron, relayed in chat, 2026-05-30. Captured VERBATIM by robbin-po. Tron's directive: "plan that in an collaborative action of the architect, the req agent and the planner." DO NOT paraphrase — the source below is authoritative; req/architect/planner refine the structured requirements + plan FROM it.

---

## LITERAL SOURCE (verbatim)

> ok understood. the sprint 1 was much better structured on task 1 and task1.1 as it was organized from the templates. the templates should be like the html registered view for the classes Requirement, Task, UseCase … each Task and requirement shall have its own md, html view strictly from the view templates. there shall be navigation between the file browse and the traceability browser possible. the data shall be in uuid.scenario.json that contains an ior [internet object reference], that can load the class Task to process the file and create the views. views are purely generated and live updated from the flat json data, that can have ior links to children or other relationships. planning.md becomes an task overview from task item views as md and html views. the sprint overview becomes a list of sprint items and so on for the involved classes. each instance becomes the same scenario json format where just the class model attributes varies. the json has { ior, model, ownerIor } model contains all attributes and ior relationships to other instances. uuid identified instances are units in a data directory in scenario/index in which has folders from the first 5 characters of the uuid and there stores the original uuid.scenario.json.
>
> under scanarios/sprints.json/ create a file tree of ln links to the json index with speaking names like in sprint 1 and task1 and task 1.1
>
> migrate all sprints, tasks, requirements like this wit references to classes, tests and puml usecases and classes and verb/mthods.
>
> all files are units and can be referenced via ior also as a scenario.
>
> in scenarios/sprints.md/ have the resulting structured md views from the templates with the same speaking names as in the sprints.json/ folder
>
> each method must be traced completely back to a task and a requirement.
>
> plan that in an collaborative action of the architect, the req agent and the planner

---

## Decomposition hints (for req — confirm/correct against the literal text above; NOT authoritative)

### Data model
- **R17.1 Scenario JSON unit** — every instance (Task, Requirement, UseCase, Class, Method/Verb, Test, Sprint, ...) is a `uuid.scenario.json` with shape `{ ior, model, ownerIor }`. `model` carries all attributes AND `ior` links to other instances.
- **R17.2 IOR (Internet Object Reference)** — universal reference handle, embedded in every unit + every link to children/related instances. Loadable: the IOR resolves to its class (e.g. `Task`) which processes the file and creates views.
- **R17.3 Class-based instances** — typed classes Requirement, Task, UseCase, Class, Method (verb), Test, Sprint (and others). Each instance varies only in `model` attributes; the wrapper `{ior, model, ownerIor}` is uniform.

### Storage layout
- **R17.4 Index by UUID prefix** — canonical store: `scenario/index/<first-5-chars-of-uuid>/<uuid>.scenario.json`.
- **R17.5 Speaking-name tree (json)** — `scenarios/sprints.json/` contains symlink (`ln`) tree to the index with speaking names like `sprint-1/task-1/task-1.1` — mirrors human-friendly hierarchy.
- **R17.6 Speaking-name tree (md)** — `scenarios/sprints.md/` contains the **generated** md views from the templates with the same speaking names as `sprints.json/`.

### Views & templates
- **R17.7 HTML view templates per class** — templates are registered views for each class (Requirement, Task, UseCase, …). Each Task and each requirement has its own `.md` AND `.html` view, rendered strictly from the templates.
- **R17.8 Views generated + live-updated** — views are pure functions of the flat JSON; live-update on data change.
- **R17.9 planning.md is a generated Task-overview** — built from task item views (md + html) via the templates.
- **R17.10 Sprint overview = list of sprint items** — and so on for the involved classes (lists are generated from instances).

### Navigation & traceability
- **R17.11 File-browser ↔ traceability-browser navigation** — the two browsers must be navigable both ways.
- **R17.12 All files are units, referenceable via IOR** — also as a scenario.
- **R17.13 Method → task → requirement traceability** — every method must be traced completely back to a task AND a requirement.

### Migration
- **R17.14 Migrate all sprints/tasks/requirements** to the scenario-unit model with references to classes, tests, puml use cases, puml classes, and verb/methods. Like Sprint 1's task-1 + task-1.1 hierarchical structure.

### Process
- **R17.15 Collaborative planning** — architect + req-eng + planner jointly plan this sprint. (Tron-assigned roles.)

(req: split/refine per the literal source; these hints are NOT authoritative. The verbatim text is.)

> NOTE 2026-05-31: extensions 1-3 verbatim source was lost to iphone:0.1 server-crash recovery. Re-archived below from formalized requirements.md (ea532bd).

---

## EXTENSION — TRON 2026-05-31 (verbatim, 1st extension — re-archived from requirements.md ea532bd)

> the task statuses will work like that in md but not in html. actually the tasks statuses must be methods of task class that trigger a task state machine until a task is done. the traceability needs to be converted to uuid.scenario.json of the traced type as atomic units in the index with ln links in a requirement and use case and class,… instances with md and html views

### Decomposition hints
- **R17.16 HTML status renders correctly** — Status checklist works in MD but NOT in HTML; fix the HTML template.
- **R17.17 Task status as state-machine methods on the Task class** — status must be METHODS on the Task class that trigger a state machine until Done.
- **R17.18 Traceability links → first-class scenario units** — every traceability LINK becomes its own `uuid.scenario.json` atomic unit in the index with `ln` symlinks.

---

## EXTENSION — TRON 2026-05-31 (verbatim, 2nd extension — re-archived from requirements.md ea532bd)

> i do not see my latest prompts reflected as requirements from the req agent neither do i see uuid.scenario.JSON for requirements and use cases… relay it to the req agent and planner and make them learn to use scenarios to plan in future. they shall order skills on top of the new implementation to plan and trace work. add that to sprint 17. decide yourself to give the skill development to the expert, or agent trainer (would need much context) or to fork an skill-expert from the expert

### Decomposition hints
- **R17.19 Tron prompts → formal requirement units** — every Tron literal quote must be captured as a `requirement:uuid`.
- **R17.20 Requirement + UseCase units in scenario index** — extend migration to emit scenario JSON for Requirement + UseCase.
- **R17.21 Req-eng + planner LEARN to use scenarios for planning** — update SKILL.md.
- **R17.22 Skills on top of scenarios** — `.skill` definitions built on the scenario implementation.
- **R17.23 Skill development owner** — PO decision: fork skill-expert from expert.

---

## EXTENSION — TRON 2026-05-31 (verbatim, 3rd extension — re-archived from requirements.md ea532bd)

> use case json must track the exact locations in the exact puml file units for tracability as well as classes and methods as iors to the git location and commit of the file

### Decomposition hints
- **R17.24 UC/Class/Method unit carries exact source location + git anchor** — model MUST track exact source FILE, location (line range), git commit SHA.

---

## EXTENSION — TRON 2026-05-31 (verbatim, PO-relayed — re-archived from requirements.md ea532bd)

> in scenario/sprints.md/usecase/ <file>.md add a chain link symbol before the edit to link to the original ln file in scenario/sprints.json/…

### Decomposition hints
- **R17.25 Generated MD views show chain-link icon → symlink JSON source** — 🔗 before ✏️ linking to sprints.json/.

---

## EXTENSION — TRON 2026-05-31 (verbatim, 4th extension — traceability is a TREE)

> thats basically good. but chain is actually a tree. each element should be a link. all are based on typed scenarios... sharpen that in the planning and rework the refined tasks

### Decomposition hints (for req — confirm against literal)
- **R17.26 Traceability is a TREE not a chain** — the `## Chain` / linear sequence framing (req → uc → puml → class/method) is wrong; the real structure is a TREE that branches at every level. Rename `## Chain` → `## Traceability` and render hierarchically.
- **R17.27 Every element is a LINK** — in BOTH task files AND generated views, every referenced node (Requirement/UseCase/PUML/Class/Method/Task/Subtask/Test/TraceLink) MUST be a clickable link to its scenario-unit view. No plain text references.
- **R17.28 All traceability elements are typed scenarios** — every node in the tree IS a typed scenario unit (no bare strings) — the tree is a graph of `ior:instance:<uuid>` references resolved through ClassLoader + ViewTemplateRegistry.
- **R17.29 Sharpen planning + rework refined task files** — update S17 `planning.md` AND rework every refined task file (T124.x, T125-T142) so the Traceability section is tree-of-typed-scenario-links. New task files follow this shape from the start.
