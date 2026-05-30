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
